import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";

const allowedNodePermissions = new Set();

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else {
      files.push(fullPath);
    }
  }

  return files.sort();
}

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

function fail(file, message) {
  throw new Error(`${file}: ${message}`);
}

function duplicateCheck(file, values, label) {
  const seen = new Set();
  for (const value of values) {
    if (seen.has(value)) {
      fail(file, `duplicate ${label}: ${value}`);
    }
    seen.add(value);
  }
}

function portKey(nodeId, portId) {
  return `${nodeId}:${portId}`;
}

function typeLabel(type) {
  if ("dataKind" in type) {
    return `${type.flow}<${type.dataKind}>`;
  }
  return `${type.flow}<${type.kind}>`;
}

const numericDataKinds = new Set(["number.float", "number.int", "number.uint"]);
const controlMessageDataKinds = new Set([
  "boolean",
  "color",
  "event.bang",
  "message.any",
  "number.float",
  "number.int",
  "number.uint",
  "string"
]);

function messageAnyCompatible(sourceType, targetType) {
  if (targetType.flow === "event") {
    return (
      sourceType.flow === "event" ||
      (sourceType.flow === "value" && controlMessageDataKinds.has(sourceType.dataKind))
    );
  }
  if (targetType.flow === "value") {
    return sourceType.flow === "value" && controlMessageDataKinds.has(sourceType.dataKind);
  }
  return false;
}

function compatibleTypes(sourceType, targetType) {
  if (targetType.dataKind === "message.any") {
    return messageAnyCompatible(sourceType, targetType);
  }
  if (sourceType.flow !== targetType.flow) {
    return false;
  }
  if (sourceType.dataKind === targetType.dataKind) {
    return true;
  }
  return numericDataKinds.has(sourceType.dataKind) && numericDataKinds.has(targetType.dataKind);
}

function validatePorts(file, nodeId, ports) {
  duplicateCheck(
    file,
    ports.map((port) => port.id),
    `port id on ${nodeId}`
  );

  for (const port of ports) {
    if (port.direction !== "input" && "activation" in port) {
      fail(file, `output port ${nodeId}.${port.id} must not declare activation`);
    }
  }
}

function validateGraphV01Semantics(file, graph) {
  duplicateCheck(
    file,
    graph.nodes.map((node) => node.id),
    "node id"
  );

  const ports = new Map();
  for (const node of graph.nodes) {
    validatePorts(file, node.id, node.ports);
    for (const port of node.ports) {
      ports.set(portKey(node.id, port.id), port);
    }
  }

  for (const edge of graph.edges) {
    const fromKey = portKey(edge.from.node, edge.from.port);
    const toKey = portKey(edge.to.node, edge.to.port);
    const from = ports.get(fromKey);
    const to = ports.get(toKey);

    if (!from) {
      fail(file, `edge references missing source port ${fromKey}`);
    }
    if (!to) {
      fail(file, `edge references missing target port ${toKey}`);
    }
    if (from.direction !== "output") {
      fail(file, `edge source ${fromKey} is not an output port`);
    }
    if (to.direction !== "input") {
      fail(file, `edge target ${toKey} is not an input port`);
    }
    if (!compatibleTypes(from.type, to.type)) {
      fail(file, `incompatible edge ${fromKey} ${typeLabel(from.type)} -> ${toKey} ${typeLabel(to.type)}`);
    }
  }
}

function validateProjectV01Semantics(file, project) {
  validateGraphV01Semantics(file, project.graph);
  validateViewStateNodeReferences(file, project.graph, project.viewState);
}

function validateViewStateNodeReferences(file, graph, viewState, label = "viewState") {
  const graphNodeIds = new Set(graph.nodes.map((node) => node.id));
  for (const nodeId of Object.keys(viewState.canvas.nodes)) {
    if (!graphNodeIds.has(nodeId)) {
      fail(file, `${label} references missing graph node: ${nodeId}`);
    }
  }
}

function boundaryStringParam(node, key) {
  const value = node.params?.[key];
  if (typeof value === "string" && value.length > 0) {
    return value;
  }
  return undefined;
}

function boundaryPortId(node, port, eligiblePortCount) {
  return (
    boundaryStringParam(node, "portId") ??
    boundaryStringParam(node, "externalPortId") ??
    (eligiblePortCount === 1 ? node.id : port.id)
  );
}

function derivedPatchBoundaryPortIds(patch) {
  const portIds = [];

  for (const node of patch.graph.nodes) {
    if (node.kind === "core.inlet") {
      const ports = node.ports.filter((port) => port.direction === "output");
      for (const port of ports) {
        portIds.push(boundaryPortId(node, port, ports.length));
      }
    } else if (node.kind === "core.outlet") {
      const ports = node.ports.filter((port) => port.direction === "input");
      for (const port of ports) {
        portIds.push(boundaryPortId(node, port, ports.length));
      }
    }
  }

  return portIds;
}

function validatePatchDefinitionV02Semantics(file, patch) {
  validateGraphV02Semantics(file, patch.graph);

  if (patch.viewState) {
    validateViewStateNodeReferences(file, patch.graph, patch.viewState, `patch ${patch.id} viewState`);
  }

  duplicateCheck(file, derivedPatchBoundaryPortIds(patch), `boundary port id on patch ${patch.id}`);
}

function validateProjectV02Semantics(file, project) {
  validateGraphV02Semantics(file, project.graph);
  validateViewStateNodeReferences(file, project.graph, project.viewState);
  duplicateCheck(
    file,
    project.patchLibrary.map((patch) => patch.id),
    "patch id"
  );

  for (const patch of project.patchLibrary) {
    validatePatchDefinitionV02Semantics(file, patch);
  }
}

function validateNodeDefinitionV01Semantics(file, definition) {
  validatePorts(file, definition.id, definition.ports);

  for (const permission of definition.permissions) {
    if (!allowedNodePermissions.has(permission)) {
      fail(file, `unsupported permission: ${permission}`);
    }
  }
}

function dataKindsInDefinition(definition) {
  return definition.ports.map((port) => port.type.dataKind);
}

function validateRepresentationManifest(manifestFile, manifest) {
  const required = {
    "number.float": ["f32"],
    "number.int": ["i32"],
    "number.uint": ["u32"],
    color: ["rgba32f"]
  };
  if (!manifest.representations || typeof manifest.representations !== "object") {
    fail(manifestFile, "manifest must declare representations");
  }
  for (const [dataKind, representations] of Object.entries(required)) {
    const actual = manifest.representations[dataKind];
    if (!Array.isArray(actual)) {
      fail(manifestFile, `representations.${dataKind} must be an array`);
    }
    for (const representation of representations) {
      if (!actual.includes(representation)) {
        fail(manifestFile, `representations.${dataKind} must include ${representation}`);
      }
    }
  }
}

function validateBuiltins(manifestFile, builtinNodeFiles, validators) {
  const manifest = builtinFileDocuments.get(manifestFile);
  validateBuiltinsManifest(manifestFile, manifest);
  const requiredBuiltinIds = manifest.nodes;
  const canonicalDataKinds = new Set(manifest.canonicalDataKinds);
  validateRepresentationManifest(manifestFile, manifest);
  const definitions = [];

  for (const file of builtinNodeFiles) {
    const definition = builtinFileDocuments.get(file);
    if (!definition) {
      fail(file, "builtin document was not loaded");
    }
    if (!validators.nodeDefinitionV01(definition)) {
      fail(file, validators.nodeDefinitionV01.errors?.map((error) => `${error.instancePath} ${error.message}`).join("; "));
    }
    validateNodeDefinitionV01Semantics(file, definition);
    definitions.push(definition);
  }

  duplicateCheck(
    "builtins/v0.1/nodes",
    definitions.map((definition) => definition.id),
    "builtin node id"
  );

  const ids = new Set(definitions.map((definition) => definition.id));
  if (ids.size !== requiredBuiltinIds.length) {
    fail(manifestFile, `manifest declares ${requiredBuiltinIds.length} builtin ids but ${ids.size} node files were found`);
  }
  for (const id of requiredBuiltinIds) {
    if (!ids.has(id)) {
      fail(manifestFile, `missing required builtin node id: ${id}`);
    }
  }

  for (const definition of definitions) {
    for (const dataKind of dataKindsInDefinition(definition)) {
      if (!canonicalDataKinds.has(dataKind)) {
        fail(`builtins/v0.1/nodes/${definition.id}.node.json`, `dataKind ${dataKind} is not listed in ${manifestFile}`);
      }
    }
  }

  validateTypedValueBuiltin(definitions, "core.float", "number.float", "Value");
  validateTypedValueBuiltin(definitions, "core.int", "number.int", "Value");
  validateTypedValueBuiltin(definitions, "core.uint", "number.uint", "Value");
  validateTypedValueBuiltin(definitions, "core.bool", "boolean", "Value");
  validateTypedValueBuiltin(definitions, "core.color", "color", "Color");
  validateTypedValueBuiltin(definitions, "core.string", "string", "Value");
  validateBangBuiltin(definitions);
  validateCommentBuiltin(definitions);
  validatePanelBuiltin(definitions);
  validateMessageBuiltin(definitions);

  const shaderDefinition = definitions.find((definition) => definition.id === "render.fullscreen-shader");
  const shaderPorts = new Map(shaderDefinition?.ports.map((port) => [port.id, port]));
  const dynamicInputPorts = [...shaderPorts.keys()].filter((portId) => portId !== "out");
  if (dynamicInputPorts.length > 0) {
    fail(
      "builtins/v0.1/nodes/render.fullscreen-shader.node.json",
      `render.fullscreen-shader builtin should only declare static out port; dynamic inputs are graph instance ports: ${dynamicInputPorts.join(", ")}`
    );
  }
  const shaderOutPort = shaderPorts.get("out");
  if (shaderOutPort?.type.dataKind !== "gpu.texture2d") {
    fail("builtins/v0.1/nodes/render.fullscreen-shader.node.json", "render.fullscreen-shader.out must use dataKind gpu.texture2d");
  }
}

function expectedHelpGraphPath(id) {
  return `help/v0.1/nodes/${id}.help.graph.json`;
}

function expectedHelpGraphId(id) {
  return `help-${id.replaceAll(".", "-")}`;
}

function validateBuiltinsHelp(helpFiles, helpGraphFiles, definitions, validators) {
  const byId = new Map(definitions.map((definition) => [definition.id, definition]));
  const helpDocuments = helpFiles.map((file) => [file, builtinFileDocuments.get(file)]);
  const helpGraphDocuments = new Map(helpGraphFiles.map((file) => [file, builtinFileDocuments.get(file)]));

  duplicateCheck(
    "builtins/v0.1/help",
    helpDocuments.map(([, document]) => document?.id),
    "builtin help id"
  );

  const helpIds = new Set(helpDocuments.map(([, document]) => document?.id));
  for (const definition of definitions) {
    if (!helpIds.has(definition.id)) {
      fail("builtins/v0.1/help", `missing builtin help for ${definition.id}`);
    }
  }

  for (const [file, help] of helpDocuments) {
    if (!help || typeof help !== "object") {
      fail(file, "help document must be a JSON object");
    }
    if (help.schema !== "skenion.node.help") {
      fail(file, "help schema must be skenion.node.help");
    }
    if (help.schemaVersion !== "0.1.0") {
      fail(file, "help schemaVersion must be 0.1.0");
    }
    if (typeof help.id !== "string" || help.id.length === 0) {
      fail(file, "help id must be a non-empty string");
    }
    if (typeof help.summary !== "string" || help.summary.length === 0) {
      fail(file, "help summary must be a non-empty string");
    }
    if (typeof help.description !== "string" || help.description.length === 0) {
      fail(file, "help description must be a non-empty string");
    }
    if (typeof help.helpGraph !== "string" || help.helpGraph.length === 0) {
      fail(file, "help helpGraph must be a non-empty string");
    }
    const expectedGraphPath = expectedHelpGraphPath(help.id);
    if (help.helpGraph !== expectedGraphPath) {
      fail(file, `helpGraph must be ${expectedGraphPath}`);
    }
    if (help.docsPath !== undefined && !existsSync(help.docsPath)) {
      fail(file, `docsPath does not exist: ${help.docsPath}`);
    }
    if (!Array.isArray(help.tags) || help.tags.length === 0) {
      fail(file, "help tags must be a non-empty array");
    }
    for (const tag of help.tags) {
      if (typeof tag !== "string" || tag.length === 0) {
        fail(file, "help tags must contain non-empty strings");
      }
    }

    const definition = byId.get(help.id);
    if (!definition) {
      fail(file, `help references missing builtin node ${help.id}`);
    }

    const ports = new Set(definition.ports.map((port) => port.id));
    for (const item of help.ports ?? []) {
      if (!ports.has(item.id)) {
        fail(file, `help references missing port ${help.id}.${item.id}`);
      }
      if (typeof item.description !== "string" || item.description.length === 0) {
        fail(file, `help port ${help.id}.${item.id} needs a description`);
      }
    }

    for (const item of help.params ?? []) {
      if (typeof item.id !== "string" || item.id.length === 0) {
        fail(file, "help param id must be a non-empty string");
      }
      if (typeof item.description !== "string" || item.description.length === 0) {
        fail(file, `help param ${item.id} needs a description`);
      }
    }

    for (const nodeId of help.relatedNodes ?? []) {
      if (!byId.has(nodeId)) {
        fail(file, `related node ${nodeId} is not a builtin node`);
      }
    }

    const helpGraph = helpGraphDocuments.get(help.helpGraph);
    if (!helpGraph) {
      fail(file, `help graph file was not loaded: ${help.helpGraph}`);
    }
    validateDocument(help.helpGraph, helpGraph, validators);
    const expectedGraphId = expectedHelpGraphId(help.id);
    if (helpGraph.id !== expectedGraphId) {
      fail(help.helpGraph, `help graph id must be ${expectedGraphId}`);
    }
    const graphNodeKinds = new Set(helpGraph.nodes.map((node) => node.kind));
    for (const kind of graphNodeKinds) {
      if (!byId.has(kind)) {
        fail(help.helpGraph, `help graph references non-builtin node kind ${kind}`);
      }
    }
  }

  duplicateCheck(
    "help/v0.1/nodes",
    [...helpGraphDocuments.values()].map((document) => document?.id),
    "help graph id"
  );
}

function validateCommentBuiltin(definitions) {
  const definition = definitions.find((candidate) => candidate.id === "core.comment");
  const file = "builtins/v0.1/nodes/core.comment.node.json";
  if (!definition) {
    fail(file, "core.comment must exist");
  }
  const ports = new Map(definition.ports.map((port) => [port.id, port]));
  const input = ports.get("in");
  if (input?.direction !== "input" || input?.type.flow !== "event" || input?.type.dataKind !== "message.any") {
    fail(file, "core.comment.in must accept event<message.any>");
  }
  if (input.activation !== "trigger") {
    fail(file, "core.comment.in activation must be trigger");
  }
  if (ports.has("set") || ports.has("bang") || ports.has("value")) {
    fail(file, "core.comment must expose only in; set and bang are message selectors");
  }
}

function validatePanelBuiltin(definitions) {
  const definition = definitions.find((candidate) => candidate.id === "core.panel");
  const file = "builtins/v0.1/nodes/core.panel.node.json";
  if (!definition) {
    fail(file, "core.panel must exist");
  }
  const ports = new Map(definition.ports.map((port) => [port.id, port]));
  const input = ports.get("in");
  if (input?.direction !== "input" || input?.type.flow !== "event" || input?.type.dataKind !== "message.any") {
    fail(file, "core.panel.in must accept event<message.any>");
  }
  if (input.activation !== "trigger") {
    fail(file, "core.panel.in activation must be trigger");
  }
  if (ports.has("set") || ports.has("bang") || ports.has("value")) {
    fail(file, "core.panel must expose only in; set and bang are message selectors");
  }
}

function validateMessageBuiltin(definitions) {
  const definition = definitions.find((candidate) => candidate.id === "core.message");
  const file = "builtins/v0.1/nodes/core.message.node.json";
  if (!definition) {
    fail(file, "core.message must exist");
  }
  const ports = new Map(definition.ports.map((port) => [port.id, port]));
  const input = ports.get("in");
  if (input?.direction !== "input" || input?.type.dataKind !== "message.any") {
    fail(file, "core.message.in must be input message.any");
  }
  if (input.activation !== "trigger") {
    fail(file, "core.message.in activation must be trigger");
  }
  if (ports.has("set") || ports.has("bang") || ports.has("value")) {
    fail(file, "core.message must expose only in/out ports; set and bang are message selectors");
  }
  const out = ports.get("out");
  if (out?.direction !== "output" || out?.type.flow !== "event" || out?.type.dataKind !== "message.any") {
    fail(file, "core.message.out must be output event<message.any>");
  }
}

function validateBangBuiltin(definitions) {
  const definition = definitions.find((candidate) => candidate.id === "core.bang");
  const file = "builtins/v0.1/nodes/core.bang.node.json";
  if (!definition) {
    fail(file, "core.bang must exist");
  }
  const ports = new Map(definition.ports.map((port) => [port.id, port]));
  const input = ports.get("in");
  if (input?.direction !== "input" || input?.type.flow !== "event" || input?.type.dataKind !== "message.any") {
    fail(file, "core.bang.in must accept event<message.any>");
  }
  if (input.activation !== "trigger") {
    fail(file, "core.bang.in activation must be trigger");
  }
  if (ports.has("bang")) {
    fail(file, "core.bang output port id must be out; bang is a message selector");
  }
  const out = ports.get("out");
  if (out?.direction !== "output" || out?.type.flow !== "event" || out?.type.dataKind !== "event.bang") {
    fail(file, "core.bang.out must be output event<event.bang>");
  }
}

function validateTypedValueBuiltin(definitions, id, dataKind, outputLabel) {
  const definition = definitions.find((candidate) => candidate.id === id);
  const file = `builtins/v0.1/nodes/${id}.node.json`;
  if (!definition) {
    fail(file, `${id} must exist`);
  }

  const ports = new Map(definition.ports.map((port) => [port.id, port]));
  const expected = [
    ["in", "input", "trigger", "message.any"],
    ["cold", "input", "latched", dataKind],
    ["value", "output", undefined, dataKind]
  ];
  if (ports.has("set") || ports.has("bang")) {
    fail(file, `${id} must not expose set or bang input ports; they are message selectors`);
  }
  for (const [portId, direction, activation, expectedDataKind] of expected) {
    const port = ports.get(portId);
    if (!port) {
      fail(file, `${id}.${portId} port is required`);
    }
    if (port.direction !== direction) {
      fail(file, `${id}.${portId} must be ${direction}`);
    }
    if (port.type.dataKind !== expectedDataKind) {
      fail(file, `${id}.${portId} must use dataKind ${expectedDataKind}`);
    }
    if (activation && port.activation !== activation) {
      fail(file, `${id}.${portId} activation must be ${activation}`);
    }
    if (port.type.range) {
      fail(file, `${id}.${portId} must not declare a global range constraint`);
    }
  }
  if (ports.get("value")?.label !== outputLabel) {
    fail(file, `${id}.value label must be ${outputLabel}`);
  }
}

function validateBuiltinsManifest(file, manifest) {
  if (!manifest || typeof manifest !== "object") {
    fail(file, "manifest must be a JSON object");
  }
  if (manifest.schema !== "skenion.builtins.manifest") {
    fail(file, "manifest schema must be skenion.builtins.manifest");
  }
  if (manifest.schemaVersion !== "0.1.0") {
    fail(file, "manifest schemaVersion must be 0.1.0");
  }
  if (manifest.version !== "0.1") {
    fail(file, "manifest version must be 0.1");
  }
  if (!Array.isArray(manifest.nodes) || manifest.nodes.length === 0) {
    fail(file, "manifest nodes must be a non-empty array");
  }
  if (!Array.isArray(manifest.canonicalDataKinds) || manifest.canonicalDataKinds.length === 0) {
    fail(file, "manifest canonicalDataKinds must be a non-empty array");
  }
  duplicateCheck(file, manifest.nodes, "manifest node id");
  duplicateCheck(file, manifest.canonicalDataKinds, "canonical dataKind");
  for (const forbidden of ["f32", "i32", "rgba", "number.f32", "number.i32", "color.rgba"]) {
    if (manifest.canonicalDataKinds.includes(forbidden)) {
      fail(file, `representation-specific dataKind ${forbidden} must not be canonical`);
    }
  }
  if (manifest.canonicalDataKinds.includes("bang")) {
    fail(file, "legacy dataKind bang must not be canonical");
  }
}

function portSpecKey(nodeId, portId) {
  return `${nodeId}:${portId}`;
}

function edgeEndpointKey(edge) {
  return `${edge.source.nodeId}:${edge.source.portId}->${edge.target.nodeId}:${edge.target.portId}`;
}

function edgeEnabled(edge) {
  return edge.enabled !== false;
}

function portTypeAccepts(source, target) {
  return source.type === target.type || target.accepts?.includes(source.type) === true;
}

function inputMaxConnections(port) {
  if (port.direction === "output") {
    return Number.POSITIVE_INFINITY;
  }
  if (port.maxConnections === null) {
    return Number.POSITIVE_INFINITY;
  }
  return port.maxConnections ?? 1;
}

function mergePolicy(port) {
  return port.mergePolicy ?? "forbid";
}

function typeFamily(type) {
  return type.split(".")[0] ?? type;
}

function controlCycleTypes(edges, ports) {
  return edges.every((edge) => {
    const source = ports.get(portSpecKey(edge.source.nodeId, edge.source.portId));
    const target = ports.get(portSpecKey(edge.target.nodeId, edge.target.portId));
    const sourceFamily = source ? typeFamily(source.type) : "";
    const targetFamily = target ? typeFamily(target.type) : "";
    return (
      (sourceFamily === "value" || sourceFamily === "control") &&
      (targetFamily === "value" || targetFamily === "control")
    );
  });
}

function stronglyConnectedComponents(nodes, edges) {
  const outgoing = new Map(nodes.map((node) => [node, []]));
  for (const edge of edges.filter(edgeEnabled)) {
    outgoing.get(edge.source.nodeId)?.push(edge.target.nodeId);
  }

  let nextIndex = 0;
  const stack = [];
  const onStack = new Set();
  const index = new Map();
  const low = new Map();
  const components = [];

  function visit(node) {
    index.set(node, nextIndex);
    low.set(node, nextIndex);
    nextIndex += 1;
    stack.push(node);
    onStack.add(node);

    for (const target of outgoing.get(node) ?? []) {
      if (!index.has(target)) {
        visit(target);
        low.set(node, Math.min(low.get(node), low.get(target)));
      } else if (onStack.has(target)) {
        low.set(node, Math.min(low.get(node), index.get(target)));
      }
    }

    if (low.get(node) === index.get(node)) {
      const component = [];
      let current;
      do {
        current = stack.pop();
        onStack.delete(current);
        component.push(current);
      } while (current !== node);
      components.push(component.sort());
    }
  }

  for (const node of nodes) {
    if (!index.has(node)) {
      visit(node);
    }
  }

  return components;
}

function cycleEdgesFor(component, edges) {
  const nodes = new Set(component);
  return edges.filter((edge) => (
    edgeEnabled(edge) &&
    nodes.has(edge.source.nodeId) &&
    nodes.has(edge.target.nodeId) &&
    (component.length > 1 || edge.source.nodeId === edge.target.nodeId)
  ));
}

function validateGraphV02Semantics(file, graph) {
  duplicateCheck(
    file,
    graph.nodes.map((node) => node.id),
    "node id"
  );

  const ports = new Map();
  const incoming = new Map();
  const outgoing = new Map();
  for (const node of graph.nodes) {
    duplicateCheck(
      file,
      node.ports.map((port) => port.id),
      `port id on ${node.id}`
    );
    for (const group of node.portGroups ?? []) {
      if (group.maxPorts !== undefined && group.maxPorts < group.minPorts) {
        fail(file, `port group ${node.id}.${group.id} maxPorts is less than minPorts`);
      }
    }
    for (const port of node.ports) {
      const key = portSpecKey(node.id, port.id);
      ports.set(key, port);
      incoming.set(key, []);
      outgoing.set(key, []);
    }
  }

  duplicateCheck(
    file,
    graph.edges.map((edge) => edge.id),
    "edge id"
  );
  const edgeKeys = new Set();
  for (const edge of graph.edges) {
    const exactKey = edgeEndpointKey(edge);
    if (edgeKeys.has(exactKey)) {
      fail(file, `duplicate edge endpoints: ${exactKey}`);
    }
    edgeKeys.add(exactKey);

    const sourceKey = portSpecKey(edge.source.nodeId, edge.source.portId);
    const targetKey = portSpecKey(edge.target.nodeId, edge.target.portId);
    const source = ports.get(sourceKey);
    const target = ports.get(targetKey);
    if (!source) {
      fail(file, `edge ${edge.id} references missing source port ${sourceKey}`);
    }
    if (!target) {
      fail(file, `edge ${edge.id} references missing target port ${targetKey}`);
    }
    if (source.direction !== "output") {
      fail(file, `edge ${edge.id} source ${sourceKey} is not an output port`);
    }
    if (target.direction !== "input") {
      fail(file, `edge ${edge.id} target ${targetKey} is not an input port`);
    }
    if (!portTypeAccepts(source, target)) {
      fail(file, `edge ${edge.id} cannot connect ${sourceKey} ${source.type} to ${targetKey} ${target.type}`);
    }
    if (edgeEnabled(edge)) {
      incoming.get(targetKey).push(edge);
      outgoing.get(sourceKey).push(edge);
    }
  }

  for (const [key, connectedEdges] of incoming) {
    const port = ports.get(key);
    if (port.direction !== "input") {
      continue;
    }
    const minimum = port.required === true ? Math.max(port.minConnections ?? 0, 1) : port.minConnections ?? 0;
    if (connectedEdges.length < minimum) {
      fail(file, `input ${key} requires at least ${minimum} connection(s)`);
    }
    if (connectedEdges.length > inputMaxConnections(port)) {
      fail(file, `input ${key} accepts at most ${port.maxConnections ?? 1} connection(s)`);
    }
    if (connectedEdges.length > 1 && mergePolicy(port) === "forbid") {
      fail(file, `input ${key} has fan-in but mergePolicy is forbid`);
    }
  }

  for (const [key, connectedEdges] of outgoing) {
    const port = ports.get(key);
    if (port.direction === "output" && connectedEdges.length > 1 && port.fanOutPolicy === "forbid") {
      fail(file, `output ${key} forbids fan-out`);
    }
  }

  const nodes = graph.nodes.map((node) => node.id).sort();
  for (const component of stronglyConnectedComponents(nodes, graph.edges)) {
    const cycleEdges = cycleEdgesFor(component, graph.edges);
    if (cycleEdges.length === 0) {
      continue;
    }
    const feedback = cycleEdges.find((edge) => edge.feedback?.enabled === true);
    if (!feedback && controlCycleTypes(cycleEdges, ports)) {
      fail(file, "ambiguous-algebraic-loop: control/value cycle requires explicit latch, delay, or feedback policy");
    }
    if (!feedback) {
      fail(file, "invalid-cycle: cycle requires explicit feedback policy");
    }
  }
}

function validateGraphFragmentV02Semantics(file, fragment) {
  duplicateCheck(
    file,
    fragment.nodes.map((node) => node.id),
    "node id"
  );

  const nodeIds = new Set(fragment.nodes.map((node) => node.id));
  const ports = new Map();
  for (const node of fragment.nodes) {
    duplicateCheck(
      file,
      node.ports.map((port) => port.id),
      `port id on ${node.id}`
    );
    for (const port of node.ports) {
      ports.set(portSpecKey(node.id, port.id), port);
    }
  }

  duplicateCheck(
    file,
    fragment.edges.map((edge) => edge.id),
    "edge id"
  );
  for (const edge of fragment.edges) {
    if (!nodeIds.has(edge.source.nodeId) || !nodeIds.has(edge.target.nodeId)) {
      fail(file, `edge ${edge.id} references an endpoint outside the graph fragment`);
    }

    const sourceKey = portSpecKey(edge.source.nodeId, edge.source.portId);
    const targetKey = portSpecKey(edge.target.nodeId, edge.target.portId);
    const source = ports.get(sourceKey);
    const target = ports.get(targetKey);
    if (!source) {
      fail(file, `edge ${edge.id} references missing source port ${sourceKey}`);
    }
    if (!target) {
      fail(file, `edge ${edge.id} references missing target port ${targetKey}`);
    }
    if (source.direction !== "output") {
      fail(file, `edge ${edge.id} source ${sourceKey} is not an output port`);
    }
    if (target.direction !== "input") {
      fail(file, `edge ${edge.id} target ${targetKey} is not an input port`);
    }
    if (!portTypeAccepts(source, target)) {
      fail(file, `edge ${edge.id} cannot connect ${sourceKey} ${source.type} to ${targetKey} ${target.type}`);
    }
  }
}

function validateNodeDefinitionV02Semantics(file, definition) {
  duplicateCheck(
    file,
    definition.ports.map((port) => port.id),
    `port id on ${definition.id}`
  );

  for (const group of definition.portGroups ?? []) {
    if (group.maxPorts !== undefined && group.maxPorts < group.minPorts) {
      fail(file, `port group ${definition.id}.${group.id} maxPorts is less than minPorts`);
    }
  }

  for (const permission of definition.permissions) {
    if (!allowedNodePermissions.has(permission)) {
      fail(file, `unsupported permission: ${permission}`);
    }
  }
}

function validateRuntimeSessionEventSemantics(file, event) {
  const gap = event.replay?.gap;
  if (gap && gap.expectedSequence >= gap.actualSequence) {
    fail(file, "replay gap expectedSequence must be less than actualSequence");
  }
  if (event.sessionRevision !== event.snapshot?.sessionRevision) {
    fail(file, "sessionRevision must match snapshot.sessionRevision");
  }
}

function validateRuntimeCollaborationCausality(file, causal, label) {
  const maxVector = Math.max(...Object.values(causal.vector));
  if (causal.baseSequence < maxVector) {
    fail(file, `${label} baseSequence must be greater than or equal to the causal vector maximum`);
  }
}

function validateRuntimeCollaborationAuthSeparation(file, participantId, authSubject, label) {
  if (authSubject?.subjectId && authSubject.subjectId === participantId) {
    fail(file, `${label} participantId must not mirror auth subject id`);
  }
}

function validateRuntimeCollaborationExpiry(file, updatedAt, expiresAt, label) {
  if (expiresAt <= updatedAt) {
    fail(file, `${label} expiresAt must be later than updatedAt`);
  }
}

function validateRuntimeCollaborationOperationEnvelopeSemantics(file, operation) {
  validateRuntimeCollaborationCausality(file, operation.causal, "operation causal");
  validateRuntimeCollaborationAuthSeparation(file, operation.participantId, operation.authSubject, "operation");
  if (!(operation.participantId in operation.causal.vector)) {
    fail(file, "operation causal vector must include participantId");
  }
  if (operation.payload.kind === "changeSet") {
    duplicateCheck(
      file,
      operation.payload.changes.map((change) => change.changeId),
      "collaboration change id"
    );
  }
  if (operation.payload.kind === "pasteGraphFragment") {
    validateGraphFragmentV02Semantics(file, operation.payload.request.fragment);
  }
  if (
    operation.payload.kind === "undoRedo" &&
    operation.payload.scope.participantId !== operation.participantId
  ) {
    fail(file, "undoRedo scope participantId must match operation participantId");
  }
}

function validateRuntimeCollaborationOperationBatchSemantics(file, batch) {
  duplicateCheck(
    file,
    batch.operations.map((operation) => operation.idempotencyKey),
    "collaboration idempotency key"
  );
  for (const operation of batch.operations) {
    if (operation.sessionId !== batch.sessionId) {
      fail(file, "collaboration batch operation sessionId must match batch sessionId");
    }
    validateRuntimeCollaborationOperationEnvelopeSemantics(file, operation);
  }
}

function validateRuntimeCollaborationOperationResultSemantics(file, result) {
  validateRuntimeCollaborationCausality(file, result.causal, "operation result causal");
  if ((result.status === "accepted" || result.status === "rebased") && !result.ack) {
    fail(file, "accepted or rebased collaboration result must include ack");
  }
  if (result.status === "accepted" && (result.nack || result.rebase)) {
    fail(file, "accepted collaboration result must not include nack or rebase");
  }
  if ((result.status === "duplicate" || result.status === "rejected") && !result.nack) {
    fail(file, "duplicate or rejected collaboration result must include nack");
  }
  if (result.status === "duplicate" && result.nack?.reason !== "duplicate-idempotency-key") {
    fail(file, "duplicate collaboration result nack reason must be duplicate-idempotency-key");
  }
  if (result.status === "rebased" && !result.rebase) {
    fail(file, "rebased collaboration result must include rebase metadata");
  }
  if (result.rebase) {
    validateRuntimeCollaborationCausality(file, result.rebase.from, "rebase from causal");
    validateRuntimeCollaborationCausality(file, result.rebase.to, "rebase to causal");
  }
}

function validateRuntimeCollaborationPresenceSemantics(file, presence) {
  validateRuntimeCollaborationAuthSeparation(file, presence.participantId, presence.authSubject, "presence");
  validateRuntimeCollaborationExpiry(file, presence.updatedAt, presence.expiresAt, "presence");
}

function validateRuntimeCollaborationSelectionSemantics(file, selection) {
  validateRuntimeCollaborationExpiry(file, selection.updatedAt, selection.expiresAt, "selection");
}

function validateRuntimeCollaborationEventSemantics(file, event) {
  validateRuntimeCollaborationCausality(file, event.causal, "collaboration event causal");
  const gap = event.replay?.gap;
  if (gap && gap.expectedSequence >= gap.actualSequence) {
    fail(file, "collaboration event replay gap expectedSequence must be less than actualSequence");
  }
}

function selectValidator(file, document, validators) {
  if (document.schema === "skenion.graph" && document.schemaVersion === "0.0.0") {
    return validators.graphV0;
  }
  if (document.schema === "skenion.graph" && document.schemaVersion === "0.1.0") {
    return validators.graphV01;
  }
  if (document.schema === "skenion.graph" && document.schemaVersion === "0.2.0") {
    return validators.graphV02;
  }
  if (document.schema === "skenion.graph.fragment" && document.schemaVersion === "0.2.0") {
    return validators.graphFragmentV02;
  }
  if (document.schema === "skenion.runtime.operation" && document.schemaVersion === "0.1.0") {
    return validators.runtimeOperationV0;
  }
  if (document.schema === "skenion.runtime.session.info" && document.schemaVersion === "0.1.0") {
    return validators.runtimeSessionInfo;
  }
  if (document.schema === "skenion.runtime.session.event" && document.schemaVersion === "0.1.0") {
    return validators.runtimeSessionEvent;
  }
  if (document.schema === "skenion.runtime.paste-graph-fragment.response" && document.schemaVersion === "0.1.0") {
    return validators.pasteGraphFragmentResponse;
  }
  if (document.schema === "skenion.runtime.collaboration.operation" && document.schemaVersion === "0.1.0") {
    return validators.runtimeCollaborationOperation;
  }
  if (document.schema === "skenion.runtime.collaboration.operation-batch" && document.schemaVersion === "0.1.0") {
    return validators.runtimeCollaborationOperationBatch;
  }
  if (document.schema === "skenion.runtime.collaboration.operation-result" && document.schemaVersion === "0.1.0") {
    return validators.runtimeCollaborationOperationResult;
  }
  if (document.schema === "skenion.runtime.collaboration.presence" && document.schemaVersion === "0.1.0") {
    return validators.runtimeCollaborationPresence;
  }
  if (document.schema === "skenion.runtime.collaboration.selection" && document.schemaVersion === "0.1.0") {
    return validators.runtimeCollaborationSelection;
  }
  if (document.schema === "skenion.runtime.collaboration.event" && document.schemaVersion === "0.1.0") {
    return validators.runtimeCollaborationEvent;
  }
  if (document.schema === "skenion.view-state" && document.schemaVersion === "0.1.0") {
    return validators.viewStateV01;
  }
  if (document.schema === "skenion.project" && document.schemaVersion === "0.1.0") {
    return validators.projectV01;
  }
  if (document.schema === "skenion.project" && document.schemaVersion === "0.2.0") {
    return validators.projectV02;
  }
  if (document.schema === "skenion.graph.patch" && document.schemaVersion === "0.0.0") {
    return validators.patchV0;
  }
  if (document.schema === "skenion.graph.patch" && document.schemaVersion === "0.1.0") {
    return validators.patchV01;
  }
  if (document.schema === "skenion.graph.patch.event" && document.schemaVersion === "0.1.0") {
    return validators.patchEventV01;
  }
  if (document.schema === "skenion.graph.patch.history" && document.schemaVersion === "0.1.0") {
    return validators.patchHistoryV01;
  }
  if (document.schema === "skenion.node.definition" && document.schemaVersion === "0.1.0") {
    return validators.nodeDefinitionV01;
  }
  if (document.schema === "skenion.node.definition" && document.schemaVersion === "0.2.0") {
    return validators.nodeDefinitionV02;
  }
  if (document.schema === "skenion.shader.interface" && document.schemaVersion === "0.1.0") {
    return validators.shaderInterfaceV01;
  }
  if (document.schema === "skenion.object-text.parse-result" && document.schemaVersion === "0.1.0") {
    return validators.objectTextParseResultV01;
  }
  if (document.schema === "skenion.extension.manifest" && document.schemaVersion === "0.1.0") {
    return validators.extensionManifestV01;
  }

  fail(file, `no validator for schema ${document.schema ?? "<missing>"} ${document.schemaVersion ?? "<missing>"}`);
}

function validateDocument(file, document, validators) {
  const validator = selectValidator(file, document, validators);
  if (!validator(document)) {
    fail(file, validator.errors?.map((error) => `${error.instancePath} ${error.message}`).join("; "));
  }

  if (document.schema === "skenion.graph" && document.schemaVersion === "0.1.0") {
    validateGraphV01Semantics(file, document);
  }
  if (document.schema === "skenion.graph" && document.schemaVersion === "0.2.0") {
    validateGraphV02Semantics(file, document);
  }
  if (document.schema === "skenion.graph.fragment" && document.schemaVersion === "0.2.0") {
    validateGraphFragmentV02Semantics(file, document);
  }
  if (document.schema === "skenion.runtime.operation" && document.schemaVersion === "0.1.0") {
    validateGraphFragmentV02Semantics(file, document.request.fragment);
  }
  if (document.schema === "skenion.runtime.session.event" && document.schemaVersion === "0.1.0") {
    validateRuntimeSessionEventSemantics(file, document);
  }
  if (document.schema === "skenion.runtime.collaboration.operation" && document.schemaVersion === "0.1.0") {
    validateRuntimeCollaborationOperationEnvelopeSemantics(file, document);
  }
  if (document.schema === "skenion.runtime.collaboration.operation-batch" && document.schemaVersion === "0.1.0") {
    validateRuntimeCollaborationOperationBatchSemantics(file, document);
  }
  if (document.schema === "skenion.runtime.collaboration.operation-result" && document.schemaVersion === "0.1.0") {
    validateRuntimeCollaborationOperationResultSemantics(file, document);
  }
  if (document.schema === "skenion.runtime.collaboration.presence" && document.schemaVersion === "0.1.0") {
    validateRuntimeCollaborationPresenceSemantics(file, document);
  }
  if (document.schema === "skenion.runtime.collaboration.selection" && document.schemaVersion === "0.1.0") {
    validateRuntimeCollaborationSelectionSemantics(file, document);
  }
  if (document.schema === "skenion.runtime.collaboration.event" && document.schemaVersion === "0.1.0") {
    validateRuntimeCollaborationEventSemantics(file, document);
  }
  if (document.schema === "skenion.project" && document.schemaVersion === "0.1.0") {
    validateProjectV01Semantics(file, document);
  }
  if (document.schema === "skenion.project" && document.schemaVersion === "0.2.0") {
    validateProjectV02Semantics(file, document);
  }
  if (document.schema === "skenion.node.definition" && document.schemaVersion === "0.1.0") {
    validateNodeDefinitionV01Semantics(file, document);
  }
  if (document.schema === "skenion.node.definition" && document.schemaVersion === "0.2.0") {
    validateNodeDefinitionV02Semantics(file, document);
  }
}

const schemaFiles = (await walk("json-schema")).filter((file) => file.endsWith(".json"));
for (const file of schemaFiles) {
  await readJson(file);
}

await readFile("openapi/runtime-http.v0.yaml", "utf8");

const ajv = new Ajv2020({ allErrors: true });
const graphV01Schema = await readJson("json-schema/graph/v0.1/graph.schema.json");
const graphV02Schema = await readJson("json-schema/graph/v0.2/graph.schema.json");
const graphFragmentV02Schema = await readJson("json-schema/graph/v0.2/fragment.schema.json");
const runtimeOperationV0Schema = await readJson("json-schema/runtime/v0/operation.schema.json");
const runtimeSessionV0Schema = await readJson("json-schema/runtime/v0/session.schema.json");
const runtimeCollaborationV0Schema = await readJson("json-schema/runtime/v0/collaboration.schema.json");
const viewStateV01Schema = await readJson("json-schema/view/v0.1/view-state.schema.json");
const projectV01Schema = await readJson("json-schema/project/v0.1/project.schema.json");
const projectV02Schema = await readJson("json-schema/project/v0.2/project.schema.json");
const graphPatchV01Schema = await readJson("json-schema/graph/v0.1/patch.schema.json");
const graphPatchEventV01Schema = await readJson("json-schema/graph/v0.1/patch-event.schema.json");
const nodeDefinitionV01Schema = await readJson("json-schema/node/v0.1/node-definition.schema.json");
ajv.addSchema(graphV01Schema);
ajv.addSchema(graphV02Schema);
ajv.addSchema(graphFragmentV02Schema);
ajv.addSchema(runtimeOperationV0Schema);
ajv.addSchema(viewStateV01Schema);
ajv.addSchema(nodeDefinitionV01Schema);
ajv.addSchema(runtimeSessionV0Schema);
ajv.addSchema(runtimeCollaborationV0Schema);
ajv.addSchema(graphPatchV01Schema);
ajv.addSchema(graphPatchEventV01Schema);
const validators = {
  graphV0: ajv.compile(await readJson("json-schema/graph/v0/graph.schema.json")),
  patchV0: ajv.compile(await readJson("json-schema/graph/v0/patch.schema.json")),
  graphV01: ajv.compile(graphV01Schema),
  graphV02: ajv.compile(graphV02Schema),
  graphFragmentV02: ajv.compile(graphFragmentV02Schema),
  runtimeOperationV0: ajv.compile(runtimeOperationV0Schema),
  runtimeSessionInfo: ajv.compile(runtimeSessionV0Schema),
  runtimeSessionEvent: ajv.compile({
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://skenion.dev/schemas/runtime/v0/session-event.schema.json",
    $ref: "https://skenion.dev/schemas/runtime/v0/session.schema.json#/$defs/runtimeSessionEvent"
  }),
  pasteGraphFragmentResponse: ajv.compile({
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://skenion.dev/schemas/runtime/v0/paste-graph-fragment-response.schema.json",
    $ref: "https://skenion.dev/schemas/runtime/v0/operation.schema.json#/$defs/pasteGraphFragmentResponse"
  }),
  runtimeCollaborationOperation: ajv.compile({
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://skenion.dev/schemas/runtime/v0/collaboration-operation.fixture.schema.json",
    $ref: "https://skenion.dev/schemas/runtime/v0/collaboration.schema.json#/$defs/runtimeCollaborationOperationEnvelope"
  }),
  runtimeCollaborationOperationBatch: ajv.compile({
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://skenion.dev/schemas/runtime/v0/collaboration-operation-batch.fixture.schema.json",
    $ref: "https://skenion.dev/schemas/runtime/v0/collaboration.schema.json#/$defs/runtimeCollaborationOperationBatch"
  }),
  runtimeCollaborationOperationResult: ajv.compile({
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://skenion.dev/schemas/runtime/v0/collaboration-operation-result.fixture.schema.json",
    $ref: "https://skenion.dev/schemas/runtime/v0/collaboration.schema.json#/$defs/runtimeCollaborationOperationResult"
  }),
  runtimeCollaborationPresence: ajv.compile({
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://skenion.dev/schemas/runtime/v0/collaboration-presence.fixture.schema.json",
    $ref: "https://skenion.dev/schemas/runtime/v0/collaboration.schema.json#/$defs/runtimeCollaborationPresenceEnvelope"
  }),
  runtimeCollaborationSelection: ajv.compile({
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://skenion.dev/schemas/runtime/v0/collaboration-selection.fixture.schema.json",
    $ref: "https://skenion.dev/schemas/runtime/v0/collaboration.schema.json#/$defs/runtimeCollaborationSelectionEnvelope"
  }),
  runtimeCollaborationEvent: ajv.compile({
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://skenion.dev/schemas/runtime/v0/collaboration-event.fixture.schema.json",
    $ref: "https://skenion.dev/schemas/runtime/v0/collaboration.schema.json#/$defs/runtimeCollaborationEventEnvelope"
  }),
  viewStateV01: ajv.compile(viewStateV01Schema),
  projectV01: ajv.compile(projectV01Schema),
  projectV02: ajv.compile(projectV02Schema),
  patchV01: ajv.compile(graphPatchV01Schema),
  patchEventV01: ajv.compile(graphPatchEventV01Schema),
  patchHistoryV01: ajv.compile(await readJson("json-schema/graph/v0.1/patch-history.schema.json")),
  nodeDefinitionV01: ajv.compile(nodeDefinitionV01Schema),
  nodeDefinitionV02: ajv.compile(
    await readJson("json-schema/node/v0.2/node-definition.schema.json")
  ),
  shaderInterfaceV01: ajv.compile(
    await readJson("json-schema/shader/v0.1/shader-interface.schema.json")
  ),
  objectTextParseResultV01: ajv.compile(
    await readJson("json-schema/object-text/v0.1/parse-result.schema.json")
  ),
  extensionManifestV01: ajv.compile(
    await readJson("json-schema/extension/v0.1/extension-manifest.schema.json")
  )
};

const fixtureFiles = (await walk("fixtures")).filter((file) => file.endsWith(".json"));
const validFixtureFiles = fixtureFiles.filter((file) => !file.includes(`${path.sep}invalid${path.sep}`));
const invalidFixtureFiles = fixtureFiles.filter((file) => file.includes(`${path.sep}invalid${path.sep}`));
const builtinFiles = (await walk("builtins")).filter((file) => file.endsWith(".json"));
const helpGraphFiles = (await walk("help")).filter((file) => file.endsWith(".help.graph.json"));
const builtinManifestFile = "builtins/v0.1/builtins.manifest.json";
const builtinNodeFiles = builtinFiles.filter((file) => file.endsWith(".node.json"));
const builtinHelpFiles = builtinFiles.filter((file) => file.endsWith(".help.json"));
const builtinFileDocuments = new Map();

for (const file of validFixtureFiles) {
  validateDocument(file, await readJson(file), validators);
}

for (const file of invalidFixtureFiles) {
  try {
    validateDocument(file, await readJson(file), validators);
  } catch {
    continue;
  }
  fail(file, "invalid fixture unexpectedly passed");
}

for (const file of builtinFiles) {
  builtinFileDocuments.set(file, await readJson(file));
}
for (const file of helpGraphFiles) {
  builtinFileDocuments.set(file, await readJson(file));
}
if (!builtinFileDocuments.has(builtinManifestFile)) {
  fail(builtinManifestFile, "missing builtin manifest");
}
validateBuiltins(builtinManifestFile, builtinNodeFiles, validators);
validateBuiltinsHelp(
  builtinHelpFiles,
  helpGraphFiles,
  builtinNodeFiles.map((file) => builtinFileDocuments.get(file)),
  validators
);

console.log(
  `validated ${schemaFiles.length} schemas, ${validFixtureFiles.length} valid fixtures, ${invalidFixtureFiles.length} invalid fixtures, ${builtinNodeFiles.length} builtins, ${builtinHelpFiles.length} builtin help files, ${helpGraphFiles.length} help graphs, and 1 builtin manifest`
);
