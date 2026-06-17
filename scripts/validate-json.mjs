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

function formatAccepts(targetFormat, sourceFormat) {
  if (targetFormat === undefined || sourceFormat === undefined) {
    return true;
  }
  const targetFormats = Array.isArray(targetFormat) ? targetFormat : [targetFormat];
  const sourceFormats = Array.isArray(sourceFormat) ? sourceFormat : [sourceFormat];
  return sourceFormats.every((format) => targetFormats.includes(format));
}

function compatibleTypes(sourceType, targetType) {
  if (sourceType.flow !== targetType.flow) {
    return false;
  }
  if (sourceType.dataKind !== targetType.dataKind) {
    return false;
  }
  if (!formatAccepts(targetType.format, sourceType.format)) {
    return false;
  }
  return true;
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

function validateBuiltins(manifestFile, builtinNodeFiles, validators) {
  const manifest = builtinFileDocuments.get(manifestFile);
  validateBuiltinsManifest(manifestFile, manifest);
  const requiredBuiltinIds = manifest.nodes;
  const canonicalDataKinds = new Set(manifest.canonicalDataKinds);
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

  const valueDefinition = definitions.find((definition) => definition.id === "core.value-f32");
  const valuePort = valueDefinition?.ports.find((port) => port.id === "value");
  if (valuePort?.type.dataKind !== "number.f32") {
    fail("builtins/v0.1/nodes/core.value-f32.node.json", "core.value-f32.value must use dataKind number.f32");
  }
  if (valuePort?.type.range?.step !== 0.01) {
    fail("builtins/v0.1/nodes/core.value-f32.node.json", "core.value-f32.value must declare range step 0.01");
  }

  const shaderDefinition = definitions.find((definition) => definition.id === "render.fullscreen-shader");
  const shaderValuePort = shaderDefinition?.ports.find((port) => port.id === "u_value");
  if (shaderValuePort?.type.dataKind !== "number.f32") {
    fail("builtins/v0.1/nodes/render.fullscreen-shader.node.json", "render.fullscreen-shader.u_value must use dataKind number.f32");
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
  if (manifest.canonicalDataKinds.includes("f32")) {
    fail(file, "legacy dataKind f32 must not be canonical");
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
const graphPatchV01Schema = await readJson("json-schema/graph/v0.1/patch.schema.json");
const graphPatchEventV01Schema = await readJson("json-schema/graph/v0.1/patch-event.schema.json");
ajv.addSchema(graphPatchV01Schema);
ajv.addSchema(graphPatchEventV01Schema);
const validators = {
  graphV0: ajv.compile(await readJson("json-schema/graph/v0/graph.schema.json")),
  patchV0: ajv.compile(await readJson("json-schema/graph/v0/patch.schema.json")),
  graphV01: ajv.compile(await readJson("json-schema/graph/v0.1/graph.schema.json")),
  graphV02: ajv.compile(await readJson("json-schema/graph/v0.2/graph.schema.json")),
  patchV01: ajv.compile(graphPatchV01Schema),
  patchEventV01: ajv.compile(graphPatchEventV01Schema),
  patchHistoryV01: ajv.compile(await readJson("json-schema/graph/v0.1/patch-history.schema.json")),
  nodeDefinitionV01: ajv.compile(
    await readJson("json-schema/node/v0.1/node-definition.schema.json")
  ),
  nodeDefinitionV02: ajv.compile(
    await readJson("json-schema/node/v0.2/node-definition.schema.json")
  )
};

const fixtureFiles = (await walk("fixtures")).filter((file) => file.endsWith(".json"));
const validFixtureFiles = fixtureFiles.filter((file) => !file.includes(`${path.sep}invalid${path.sep}`));
const invalidFixtureFiles = fixtureFiles.filter((file) => file.includes(`${path.sep}invalid${path.sep}`));
const builtinFiles = (await walk("builtins")).filter((file) => file.endsWith(".json"));
const builtinManifestFile = "builtins/v0.1/builtins.manifest.json";
const builtinNodeFiles = builtinFiles.filter((file) => file.endsWith(".node.json"));
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
if (!builtinFileDocuments.has(builtinManifestFile)) {
  fail(builtinManifestFile, "missing builtin manifest");
}
validateBuiltins(builtinManifestFile, builtinNodeFiles, validators);

console.log(
  `validated ${schemaFiles.length} schemas, ${validFixtureFiles.length} valid fixtures, ${invalidFixtureFiles.length} invalid fixtures, ${builtinNodeFiles.length} builtins, and 1 builtin manifest`
);
