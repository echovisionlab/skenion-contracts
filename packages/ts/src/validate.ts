import Ajv2020Runtime from "ajv/dist/2020.js";
import type {
  ErrorObject,
  Options,
  ValidateFunction
} from "ajv/dist/2020.js";
import {
  controlMessageV01Schema,
  extensionManifestV01Schema,
  graphFragmentV02Schema,
  graphPatchEventV01Schema,
  graphPatchHistoryV01Schema,
  graphPatchV01Schema,
  graphV01Schema,
  graphV02Schema,
  nodeDefinitionV01Schema,
  nodeDefinitionV02Schema,
  objectTextParseResultV01Schema,
  projectV01Schema,
  projectV02Schema,
  runtimeOperationV0Schema,
  shaderInterfaceV01Schema,
  viewStateV01Schema
} from "./generated/schemas.js";
import { planConversion } from "./conversion.js";
import { derivePatchContractV02 } from "./project.js";
import type {
  ControlMessageV01,
  DataTypeV01,
  EdgeSpecV02,
  ExtensionManifestV01,
  GraphCycleValidationV02,
  GraphDocumentV01,
  GraphDocumentV02,
  GraphFragmentDiagnosticV02,
  GraphFragmentValidationOptionsV02,
  GraphFragmentValidationResultV02,
  GraphFragmentV02,
  GraphPatchEventV01,
  GraphPatchHistoryV01,
  GraphPatchV01,
  GraphValidationDiagnosticV02,
  GraphValidationResultV02,
  NodeDefinitionManifestV01,
  NodeDefinitionManifestV02,
  ObjectTextParseResultV01,
  PatchDefinitionV02,
  PasteGraphFragmentRequest,
  PasteGraphFragmentResponse,
  PortV01,
  PortSpecV02,
  ProjectDocumentV01,
  ProjectDocumentV02,
  RuntimeOperationEnvelope,
  ShaderInterfaceV01,
  ValidationResult,
  ViewStateV01
} from "./types.js";

const allowedNodePermissions = new Set<string>();

const Ajv2020 = Ajv2020Runtime as unknown as new (opts?: Options) => {
  compile(schema: unknown): ValidateFunction;
  addSchema(schema: unknown): unknown;
};
const ajv = new Ajv2020({ allErrors: true });
ajv.addSchema(graphV02Schema);
ajv.addSchema(graphFragmentV02Schema);
ajv.addSchema(graphPatchV01Schema);
ajv.addSchema(graphPatchEventV01Schema);
ajv.addSchema(nodeDefinitionV01Schema);
const graphV01Validator = ajv.compile(graphV01Schema);
const graphV02Validator = ajv.compile(graphV02Schema);
const graphFragmentV02Validator = ajv.compile(graphFragmentV02Schema);
const runtimeOperationV0Validator = ajv.compile(runtimeOperationV0Schema);
const pasteGraphFragmentRequestValidator = ajv.compile({
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://skenion.dev/schemas/runtime/v0/paste-graph-fragment-request.schema.json",
  $ref: "https://skenion.dev/schemas/runtime/v0/operation.schema.json#/$defs/pasteGraphFragmentRequest"
});
const pasteGraphFragmentResponseValidator = ajv.compile({
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://skenion.dev/schemas/runtime/v0/paste-graph-fragment-response.schema.json",
  $ref: "https://skenion.dev/schemas/runtime/v0/operation.schema.json#/$defs/pasteGraphFragmentResponse"
});
const graphPatchV01Validator = ajv.compile(graphPatchV01Schema);
const graphPatchEventV01Validator = ajv.compile(graphPatchEventV01Schema);
const graphPatchHistoryV01Validator = ajv.compile(graphPatchHistoryV01Schema);
const controlMessageV01Validator = ajv.compile(controlMessageV01Schema);
const objectTextParseResultV01Validator = ajv.compile(objectTextParseResultV01Schema);
const nodeDefinitionV01Validator = ajv.compile(nodeDefinitionV01Schema);
const nodeDefinitionV02Validator = ajv.compile(nodeDefinitionV02Schema);
const shaderInterfaceV01Validator = ajv.compile(shaderInterfaceV01Schema);
const viewStateV01Validator = ajv.compile(viewStateV01Schema);
const projectV01Validator = ajv.compile(projectV01Schema);
const projectV02Validator = ajv.compile(projectV02Schema);
const patchDefinitionV02Validator = ajv.compile({
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://skenion.dev/schemas/project/v0.2/patch-definition.schema.json",
  $ref: "https://skenion.dev/schemas/project/v0.2/project.schema.json#/$defs/patchDefinition"
});
const extensionManifestV01Validator = ajv.compile(extensionManifestV01Schema);

function schemaErrors(errors: ErrorObject[]): string[] {
  return errors.map((error) => {
    const path = error.instancePath || "/";
    return `${path} ${error.message}`;
  });
}

function duplicateErrors(values: string[], label: string): string[] {
  const seen = new Set<string>();
  const errors: string[] = [];

  for (const value of values) {
    if (seen.has(value)) {
      errors.push(`duplicate ${label}: ${value}`);
    }
    seen.add(value);
  }

  return errors;
}

function portKey(nodeId: string, portId: string): string {
  return `${nodeId}:${portId}`;
}

function typeLabel(type: DataTypeV01): string {
  return `${type.flow}<${type.dataKind}>`;
}

function compatibleTypes(sourceType: DataTypeV01, targetType: DataTypeV01): boolean {
  return planConversion(sourceType, targetType).ok;
}

function validatePorts(ownerId: string, ports: PortV01[]): string[] {
  const errors = duplicateErrors(
    ports.map((port) => port.id),
    `port id on ${ownerId}`
  );

  for (const port of ports) {
    if (port.direction !== "input" && "activation" in port) {
      errors.push(`output port ${ownerId}.${port.id} must not declare activation`);
    }
  }

  return errors;
}

function validateGraphV01Semantics(graph: GraphDocumentV01): string[] {
  const errors = duplicateErrors(
    graph.nodes.map((node) => node.id),
    "node id"
  );
  const ports = new Map<string, PortV01>();

  for (const node of graph.nodes) {
    errors.push(...validatePorts(node.id, node.ports));
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
      errors.push(`edge references missing source port ${fromKey}`);
    }
    if (!to) {
      errors.push(`edge references missing target port ${toKey}`);
    }
    if (!from || !to) {
      continue;
    }
    if (from.direction !== "output") {
      errors.push(`edge source ${fromKey} is not an output port`);
    }
    if (to.direction !== "input") {
      errors.push(`edge target ${toKey} is not an input port`);
    }
    if (!compatibleTypes(from.type, to.type)) {
      errors.push(`incompatible edge ${fromKey} ${typeLabel(from.type)} -> ${toKey} ${typeLabel(to.type)}`);
    }
  }

  return errors;
}

function validateNodeDefinitionV01Semantics(definition: NodeDefinitionManifestV01): string[] {
  const errors = validatePorts(definition.id, definition.ports);

  for (const permission of definition.permissions) {
    if (!allowedNodePermissions.has(permission)) {
      errors.push(`unsupported permission: ${permission}`);
    }
  }

  return errors;
}

function validateViewStateNodeReferences(
  viewState: ViewStateV01,
  graph: Pick<GraphDocumentV01 | GraphDocumentV02, "nodes">,
  label = "viewState"
): string[] {
  const errors: string[] = [];
  const graphNodeIds = new Set(graph.nodes.map((node) => node.id));

  for (const nodeId of Object.keys(viewState.canvas.nodes)) {
    if (!graphNodeIds.has(nodeId)) {
      errors.push(`${label} references missing graph node: ${nodeId}`);
    }
  }

  return errors;
}

function validateProjectDocumentV01Semantics(project: ProjectDocumentV01): string[] {
  return [
    ...validateGraphV01Semantics(project.graph),
    ...validateViewStateNodeReferences(project.viewState, project.graph)
  ];
}

function graphV02SemanticErrors(graph: GraphDocumentV02, label: string): string[] {
  const result = analyzeGraphDocumentV02(graph);
  return result.diagnostics
    .filter((diagnostic) => diagnostic.severity === "error")
    .map((diagnostic) => `${label} ${diagnostic.code}: ${diagnostic.message}`);
}

function validatePatchDefinitionV02Semantics(patch: PatchDefinitionV02): string[] {
  const errors = graphV02SemanticErrors(patch.graph, `patch ${patch.id} graph`);

  if (patch.viewState) {
    errors.push(
      ...validateViewStateNodeReferences(
        patch.viewState,
        patch.graph,
        `patch ${patch.id} viewState`
      )
    );
  }

  const contract = derivePatchContractV02(patch);
  errors.push(
    ...duplicateErrors(
      contract.ports.map((port) => port.id),
      `boundary port id on patch ${patch.id}`
    )
  );

  return errors;
}

function validateProjectDocumentV02Semantics(project: ProjectDocumentV02): string[] {
  const errors = [
    ...graphV02SemanticErrors(project.graph, "root graph"),
    ...validateViewStateNodeReferences(project.viewState, project.graph),
    ...duplicateErrors(
      project.patchLibrary.map((patch) => patch.id),
      "patch id"
    )
  ];

  for (const patch of project.patchLibrary) {
    errors.push(...validatePatchDefinitionV02Semantics(patch));
  }

  return errors;
}

function diagnostic(
  diagnostics: GraphValidationDiagnosticV02[],
  severity: GraphValidationDiagnosticV02["severity"],
  code: string,
  message: string,
  refs: Pick<GraphValidationDiagnosticV02, "nodes" | "edges"> = {}
): void {
  diagnostics.push({ severity, code, message, ...refs });
}

function portSpecKey(nodeId: string, portId: string): string {
  return `${nodeId}:${portId}`;
}

function edgeEndpointKey(edge: EdgeSpecV02): string {
  return `${edge.source.nodeId}:${edge.source.portId}->${edge.target.nodeId}:${edge.target.portId}`;
}

function isEdgeEnabled(edge: EdgeSpecV02): boolean {
  return edge.enabled !== false;
}

function inputMaxConnections(port: PortSpecV02): number {
  if (port.maxConnections === null) {
    return Number.POSITIVE_INFINITY;
  }
  return port.maxConnections ?? 1;
}

function portMergePolicy(port: PortSpecV02): string {
  return port.mergePolicy ?? "forbid";
}

function portFanOutPolicy(port: PortSpecV02): string {
  return port.fanOutPolicy ?? "allow";
}

function portTypeAccepts(source: PortSpecV02, target: PortSpecV02): boolean {
  if (target.type === "message.any" && isControlMessagePortType(source.type)) {
    return true;
  }
  return source.type === target.type || target.accepts?.includes(source.type) === true;
}

function isControlMessagePortType(type: string): boolean {
  return [
    "message.any",
    "event.bang",
    "number.float",
    "number.int",
    "number.uint",
    "boolean",
    "color",
    "string"
  ].includes(type);
}

function fragmentDiagnostic(
  diagnostics: GraphFragmentDiagnosticV02[],
  severity: GraphFragmentDiagnosticV02["severity"],
  code: string,
  message: string,
  refs: Pick<GraphFragmentDiagnosticV02, "nodes" | "edges"> = {}
): void {
  diagnostics.push({ severity, code, message, ...refs });
}

function analyzeFragmentSemantics(
  fragment: GraphFragmentV02,
  options: GraphFragmentValidationOptionsV02
): GraphFragmentValidationResultV02 {
  const diagnostics: GraphFragmentDiagnosticV02[] = [];
  const omittedEdgeIds: string[] = [];
  const outsideEndpointPolicy = options.outsideEndpointPolicy ?? "reject";
  const nodeIds = new Set<string>();
  const edgeIds = new Set<string>();
  const ports = new Map<string, PortSpecV02>();

  for (const node of fragment.nodes) {
    if (nodeIds.has(node.id)) {
      fragmentDiagnostic(
        diagnostics,
        "error",
        "duplicate-node-id",
        `duplicate node id: ${node.id}`,
        { nodes: [node.id] }
      );
    }
    nodeIds.add(node.id);

    const portIds = new Set<string>();
    for (const port of node.ports) {
      if (portIds.has(port.id)) {
        fragmentDiagnostic(
          diagnostics,
          "error",
          "duplicate-port-id",
          `duplicate port id on ${node.id}: ${port.id}`,
          { nodes: [node.id] }
        );
      }
      portIds.add(port.id);
      ports.set(portSpecKey(node.id, port.id), port);
    }
  }

  for (const edge of fragment.edges) {
    if (edgeIds.has(edge.id)) {
      fragmentDiagnostic(
        diagnostics,
        "error",
        "duplicate-edge-id",
        `duplicate edge id: ${edge.id}`,
        { edges: [edge.id] }
      );
    }
    edgeIds.add(edge.id);

    const sourceNodeMissing = !nodeIds.has(edge.source.nodeId);
    const targetNodeMissing = !nodeIds.has(edge.target.nodeId);
    if (sourceNodeMissing || targetNodeMissing) {
      const severity = outsideEndpointPolicy === "omit" ? "warning" : "error";
      if (outsideEndpointPolicy === "omit") {
        omittedEdgeIds.push(edge.id);
      }
      fragmentDiagnostic(
        diagnostics,
        severity,
        "fragment-edge-outside-selection",
        `edge ${edge.id} references an endpoint outside the graph fragment`,
        { edges: [edge.id] }
      );
      continue;
    }

    const sourceKey = portSpecKey(edge.source.nodeId, edge.source.portId);
    const targetKey = portSpecKey(edge.target.nodeId, edge.target.portId);
    const source = ports.get(sourceKey);
    const target = ports.get(targetKey);

    if (!source) {
      fragmentDiagnostic(
        diagnostics,
        "error",
        "missing-source-port",
        `edge ${edge.id} references missing source port ${sourceKey}`,
        { edges: [edge.id] }
      );
    }
    if (!target) {
      fragmentDiagnostic(
        diagnostics,
        "error",
        "missing-target-port",
        `edge ${edge.id} references missing target port ${targetKey}`,
        { edges: [edge.id] }
      );
    }
    if (!source || !target) {
      continue;
    }

    if (source.direction !== "output") {
      fragmentDiagnostic(
        diagnostics,
        "error",
        "invalid-source-direction",
        `edge ${edge.id} source ${sourceKey} is not an output port`,
        { edges: [edge.id] }
      );
    }
    if (target.direction !== "input") {
      fragmentDiagnostic(
        diagnostics,
        "error",
        "invalid-target-direction",
        `edge ${edge.id} target ${targetKey} is not an input port`,
        { edges: [edge.id] }
      );
    }
    if (!portTypeAccepts(source, target)) {
      fragmentDiagnostic(
        diagnostics,
        "error",
        "incompatible-type",
        `edge ${edge.id} cannot connect ${sourceKey} ${source.type} to ${targetKey} ${target.type}`,
        { edges: [edge.id] }
      );
    }
  }

  return {
    ok: diagnostics.every((entry) => entry.severity !== "error"),
    diagnostics,
    omittedEdgeIds
  };
}

function portFamily(type: string): string {
  return type.split(".", 1).join("");
}

function controlCycleTypes(edges: EdgeSpecV02[], ports: Map<string, PortSpecV02>): boolean {
  return edges.every((edge) => {
    const source = ports.get(portSpecKey(edge.source.nodeId, edge.source.portId));
    const target = ports.get(portSpecKey(edge.target.nodeId, edge.target.portId));
    const sourceFamily = source ? portFamily(source.type) : "";
    const targetFamily = target ? portFamily(target.type) : "";
    return (
      (sourceFamily === "value" || sourceFamily === "control") &&
      (targetFamily === "value" || targetFamily === "control")
    );
  });
}

function classifyCycle(
  nodes: string[],
  edges: EdgeSpecV02[],
  ports: Map<string, PortSpecV02>
): GraphCycleValidationV02 {
  const feedback = edges.find((edge) => edge.feedback?.enabled === true);
  if (!feedback) {
    const classification = controlCycleTypes(edges, ports)
      ? "ambiguous-algebraic-loop"
      : "invalid-cycle";
    return {
      classification,
      nodes,
      edges: edges.map((edge) => edge.id),
      message: classification === "ambiguous-algebraic-loop"
        ? "control/value cycle requires explicit latch, delay, or feedback policy"
        : "cycle requires explicit feedback policy"
    };
  }

  if (feedback.feedback?.boundary === "same-turn") {
    return {
      classification: "risky-feedback",
      nodes,
      edges: edges.map((edge) => edge.id),
      message: `feedback edge ${feedback.id} uses same-turn boundary`
    };
  }

  return {
    classification: "valid-feedback",
    nodes,
    edges: edges.map((edge) => edge.id),
    message: `feedback edge ${feedback.id} provides ${feedback.feedback?.boundary} boundary`
  };
}

function stronglyConnectedComponents(nodes: string[], edges: EdgeSpecV02[]): string[][] {
  const outgoing = new Map<string, string[]>();
  for (const node of nodes) {
    outgoing.set(node, []);
  }
  for (const edge of edges) {
    if (isEdgeEnabled(edge)) {
      outgoing.get(edge.source.nodeId)?.push(edge.target.nodeId);
    }
  }

  let nextIndex = 0;
  const stack: string[] = [];
  const onStack = new Set<string>();
  const index = new Map<string, number>();
  const low = new Map<string, number>();
  const components: string[][] = [];

  function visit(node: string): void {
    index.set(node, nextIndex);
    low.set(node, nextIndex);
    nextIndex += 1;
    stack.push(node);
    onStack.add(node);

    for (const target of outgoing.get(node) ?? []) {
      if (!index.has(target)) {
        visit(target);
        low.set(node, Math.min(low.get(node) as number, low.get(target) as number));
      } else if (onStack.has(target)) {
        low.set(node, Math.min(low.get(node) as number, index.get(target) as number));
      }
    }

    if (low.get(node) === index.get(node)) {
      const component: string[] = [];
      let current: string | undefined;
      do {
        current = stack.pop();
        if (current) {
          onStack.delete(current);
          component.push(current);
        }
      } while (current && current !== node);
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

function cycleEdgesFor(component: string[], edges: EdgeSpecV02[]): EdgeSpecV02[] {
  const componentSet = new Set(component);
  return edges.filter((edge) => (
    isEdgeEnabled(edge) &&
    componentSet.has(edge.source.nodeId) &&
    componentSet.has(edge.target.nodeId) &&
    (component.length > 1 || edge.source.nodeId === edge.target.nodeId)
  ));
}

function validateNodeDefinitionV02Semantics(definition: NodeDefinitionManifestV02): string[] {
  const errors = duplicateErrors(
    definition.ports.map((port) => port.id),
    `port id on ${definition.id}`
  );

  for (const group of definition.portGroups ?? []) {
    if (group.maxPorts !== undefined && group.maxPorts < group.minPorts) {
      errors.push(`port group ${definition.id}.${group.id} maxPorts is less than minPorts`);
    }
  }

  for (const permission of definition.permissions) {
    if (!allowedNodePermissions.has(permission)) {
      errors.push(`unsupported permission: ${permission}`);
    }
  }

  return errors;
}

export function analyzeGraphDocumentV02(graph: GraphDocumentV02): GraphValidationResultV02 {
  const diagnostics: GraphValidationDiagnosticV02[] = [];
  const cycles: GraphCycleValidationV02[] = [];
  const nodeIds = new Set<string>();
  const ports = new Map<string, PortSpecV02>();
  const incoming = new Map<string, EdgeSpecV02[]>();
  const outgoing = new Map<string, EdgeSpecV02[]>();
  const edgeIds = new Set<string>();
  const edgeKeys = new Set<string>();

  for (const node of graph.nodes) {
    if (nodeIds.has(node.id)) {
      diagnostic(diagnostics, "error", "duplicate-node-id", `duplicate node id: ${node.id}`, { nodes: [node.id] });
    }
    nodeIds.add(node.id);

    const portIds = new Set<string>();
    for (const port of node.ports) {
      if (portIds.has(port.id)) {
        diagnostic(
          diagnostics,
          "error",
          "duplicate-port-id",
          `duplicate port id on ${node.id}: ${port.id}`,
          { nodes: [node.id] }
        );
      }
      portIds.add(port.id);
      const key = portSpecKey(node.id, port.id);
      ports.set(key, port);
      incoming.set(key, []);
      outgoing.set(key, []);
    }

    for (const group of node.portGroups ?? []) {
      if (group.maxPorts !== undefined && group.maxPorts < group.minPorts) {
        diagnostic(
          diagnostics,
          "error",
          "invalid-port-group",
          `port group ${node.id}.${group.id} maxPorts is less than minPorts`,
          { nodes: [node.id] }
        );
      }
    }
  }

  for (const edge of graph.edges) {
    if (edgeIds.has(edge.id)) {
      diagnostic(diagnostics, "error", "duplicate-edge-id", `duplicate edge id: ${edge.id}`, { edges: [edge.id] });
    }
    edgeIds.add(edge.id);

    const edgeKey = edgeEndpointKey(edge);
    if (edgeKeys.has(edgeKey)) {
      diagnostic(diagnostics, "error", "duplicate-edge", `duplicate edge endpoints: ${edgeKey}`, { edges: [edge.id] });
    }
    edgeKeys.add(edgeKey);

    const sourceKey = portSpecKey(edge.source.nodeId, edge.source.portId);
    const targetKey = portSpecKey(edge.target.nodeId, edge.target.portId);
    const source = ports.get(sourceKey);
    const target = ports.get(targetKey);

    if (!source) {
      diagnostic(diagnostics, "error", "missing-source-port", `edge ${edge.id} references missing source port ${sourceKey}`, { edges: [edge.id] });
    }
    if (!target) {
      diagnostic(diagnostics, "error", "missing-target-port", `edge ${edge.id} references missing target port ${targetKey}`, { edges: [edge.id] });
    }
    if (!source || !target) {
      continue;
    }

    if (source.direction !== "output") {
      diagnostic(diagnostics, "error", "invalid-source-direction", `edge ${edge.id} source ${sourceKey} is not an output port`, { edges: [edge.id] });
    }
    if (target.direction !== "input") {
      diagnostic(diagnostics, "error", "invalid-target-direction", `edge ${edge.id} target ${targetKey} is not an input port`, { edges: [edge.id] });
    }
    if (!portTypeAccepts(source, target)) {
      diagnostic(diagnostics, "error", "incompatible-type", `edge ${edge.id} cannot connect ${sourceKey} ${source.type} to ${targetKey} ${target.type}`, { edges: [edge.id] });
    }

    if (isEdgeEnabled(edge)) {
      incoming.get(targetKey)?.push(edge);
      outgoing.get(sourceKey)?.push(edge);
    }
  }

  for (const [key, connectedEdges] of incoming) {
    const port = ports.get(key);
    if (!port || port.direction !== "input") {
      continue;
    }
    const minimum = port.required === true ? Math.max(port.minConnections ?? 0, 1) : port.minConnections ?? 0;
    if (connectedEdges.length < minimum) {
      diagnostic(diagnostics, "error", "missing-required-input", `input ${key} requires at least ${minimum} connection(s)`);
    }
    if (connectedEdges.length > inputMaxConnections(port)) {
      diagnostic(diagnostics, "error", "fan-in-cardinality", `input ${key} accepts at most ${port.maxConnections ?? 1} connection(s)`);
    }
    if (connectedEdges.length > 1 && portMergePolicy(port) === "forbid") {
      diagnostic(diagnostics, "error", "fan-in-without-merge-policy", `input ${key} has fan-in but mergePolicy is forbid`);
    }
  }

  for (const [key, connectedEdges] of outgoing) {
    const port = ports.get(key);
    if (port?.direction === "output" && connectedEdges.length > 1 && portFanOutPolicy(port) === "forbid") {
      diagnostic(diagnostics, "error", "fan-out-forbidden", `output ${key} forbids fan-out`);
    }
  }

  for (const component of stronglyConnectedComponents([...nodeIds].sort(), graph.edges)) {
    const componentEdges = cycleEdgesFor(component, graph.edges);
    if (componentEdges.length === 0) {
      continue;
    }
    const cycle = classifyCycle(component, componentEdges, ports);
    cycles.push(cycle);
    if (cycle.classification === "ambiguous-algebraic-loop" || cycle.classification === "invalid-cycle") {
      diagnostic(diagnostics, "error", cycle.classification, cycle.message, { nodes: cycle.nodes, edges: cycle.edges });
    } else if (cycle.classification === "risky-feedback") {
      diagnostic(diagnostics, "warning", cycle.classification, cycle.message, { nodes: cycle.nodes, edges: cycle.edges });
    }
  }

  return {
    ok: diagnostics.every((entry) => entry.severity !== "error"),
    diagnostics,
    cycles
  };
}

export function validateGraphDocument(document: unknown): ValidationResult<GraphDocumentV01> {
  if (!graphV01Validator(document)) {
    return { ok: false, errors: schemaErrors(graphV01Validator.errors as ErrorObject[]) };
  }

  const graph = document as GraphDocumentV01;
  const errors = validateGraphV01Semantics(graph);
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value: graph };
}

export function validateGraphDocumentV02(document: unknown): ValidationResult<GraphDocumentV02> {
  if (!graphV02Validator(document)) {
    return { ok: false, errors: schemaErrors(graphV02Validator.errors as ErrorObject[]) };
  }

  const graph = document as GraphDocumentV02;
  const result = analyzeGraphDocumentV02(graph);
  if (!result.ok) {
    return { ok: false, errors: result.diagnostics.map((diagnostic) => `${diagnostic.code}: ${diagnostic.message}`) };
  }

  return { ok: true, value: graph };
}

export function analyzeGraphFragmentV02(
  fragment: GraphFragmentV02,
  options: GraphFragmentValidationOptionsV02 = {}
): GraphFragmentValidationResultV02 {
  return analyzeFragmentSemantics(fragment, options);
}

export function validateGraphFragmentV02(
  document: unknown,
  options: GraphFragmentValidationOptionsV02 = {}
): ValidationResult<GraphFragmentV02> {
  if (!graphFragmentV02Validator(document)) {
    return { ok: false, errors: schemaErrors(graphFragmentV02Validator.errors as ErrorObject[]) };
  }

  const fragment = document as GraphFragmentV02;
  const result = analyzeGraphFragmentV02(fragment, options);
  if (!result.ok) {
    return { ok: false, errors: result.diagnostics.map((entry) => `${entry.code}: ${entry.message}`) };
  }

  return { ok: true, value: fragment };
}

export function validateGraphPatch(document: unknown): ValidationResult<GraphPatchV01> {
  if (!graphPatchV01Validator(document)) {
    return { ok: false, errors: schemaErrors(graphPatchV01Validator.errors as ErrorObject[]) };
  }

  return { ok: true, value: document as GraphPatchV01 };
}

export function validateGraphPatchEvent(document: unknown): ValidationResult<GraphPatchEventV01> {
  if (!graphPatchEventV01Validator(document)) {
    return { ok: false, errors: schemaErrors(graphPatchEventV01Validator.errors as ErrorObject[]) };
  }

  return { ok: true, value: document as GraphPatchEventV01 };
}

export function validateGraphPatchHistory(
  document: unknown
): ValidationResult<GraphPatchHistoryV01> {
  if (!graphPatchHistoryV01Validator(document)) {
    return { ok: false, errors: schemaErrors(graphPatchHistoryV01Validator.errors as ErrorObject[]) };
  }

  return { ok: true, value: document as GraphPatchHistoryV01 };
}

export function validateControlMessage(document: unknown): ValidationResult<ControlMessageV01> {
  if (!controlMessageV01Validator(document)) {
    return { ok: false, errors: schemaErrors(controlMessageV01Validator.errors as ErrorObject[]) };
  }

  return { ok: true, value: document as ControlMessageV01 };
}

export function validateObjectTextParseResult(
  document: unknown
): ValidationResult<ObjectTextParseResultV01> {
  if (!objectTextParseResultV01Validator(document)) {
    return {
      ok: false,
      errors: schemaErrors(objectTextParseResultV01Validator.errors as ErrorObject[])
    };
  }

  return { ok: true, value: document as ObjectTextParseResultV01 };
}

export function validateNodeDefinition(
  document: unknown
): ValidationResult<NodeDefinitionManifestV01> {
  if (!nodeDefinitionV01Validator(document)) {
    return { ok: false, errors: schemaErrors(nodeDefinitionV01Validator.errors as ErrorObject[]) };
  }

  const definition = document as NodeDefinitionManifestV01;
  const errors = validateNodeDefinitionV01Semantics(definition);
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value: definition };
}

export function validateNodeDefinitionV02(
  document: unknown
): ValidationResult<NodeDefinitionManifestV02> {
  if (!nodeDefinitionV02Validator(document)) {
    return { ok: false, errors: schemaErrors(nodeDefinitionV02Validator.errors as ErrorObject[]) };
  }

  const definition = document as NodeDefinitionManifestV02;
  const errors = validateNodeDefinitionV02Semantics(definition);
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value: definition };
}

export function validateExtensionManifestV01(
  document: unknown
): ValidationResult<ExtensionManifestV01> {
  if (!extensionManifestV01Validator(document)) {
    return { ok: false, errors: schemaErrors(extensionManifestV01Validator.errors as ErrorObject[]) };
  }

  return { ok: true, value: document as ExtensionManifestV01 };
}

export function validateShaderInterface(document: unknown): ValidationResult<ShaderInterfaceV01> {
  if (!shaderInterfaceV01Validator(document)) {
    return { ok: false, errors: schemaErrors(shaderInterfaceV01Validator.errors as ErrorObject[]) };
  }

  return { ok: true, value: document as ShaderInterfaceV01 };
}

export function validateViewState(document: unknown): ValidationResult<ViewStateV01> {
  if (!viewStateV01Validator(document)) {
    return { ok: false, errors: schemaErrors(viewStateV01Validator.errors as ErrorObject[]) };
  }

  return { ok: true, value: document as ViewStateV01 };
}

export function validateProjectDocument(document: unknown): ValidationResult<ProjectDocumentV01> {
  if (!projectV01Validator(document)) {
    return { ok: false, errors: schemaErrors(projectV01Validator.errors as ErrorObject[]) };
  }

  const project = document as ProjectDocumentV01;
  const errors = validateProjectDocumentV01Semantics(project);
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value: project };
}

export function validatePatchDefinitionV02(
  document: unknown
): ValidationResult<PatchDefinitionV02> {
  if (!patchDefinitionV02Validator(document)) {
    return { ok: false, errors: schemaErrors(patchDefinitionV02Validator.errors as ErrorObject[]) };
  }

  const patch = document as PatchDefinitionV02;
  const errors = validatePatchDefinitionV02Semantics(patch);
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value: patch };
}

export function validateProjectDocumentV02(
  document: unknown
): ValidationResult<ProjectDocumentV02> {
  if (!projectV02Validator(document)) {
    return { ok: false, errors: schemaErrors(projectV02Validator.errors as ErrorObject[]) };
  }

  const project = document as ProjectDocumentV02;
  const errors = validateProjectDocumentV02Semantics(project);
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value: project };
}

export function validateRuntimeOperationEnvelope(
  document: unknown
): ValidationResult<RuntimeOperationEnvelope> {
  if (!runtimeOperationV0Validator(document)) {
    return { ok: false, errors: schemaErrors(runtimeOperationV0Validator.errors as ErrorObject[]) };
  }

  const envelope = document as RuntimeOperationEnvelope;
  const requestResult = validatePasteGraphFragmentRequest(envelope.request);
  if (!requestResult.ok) {
    return { ok: false, errors: requestResult.errors };
  }

  return { ok: true, value: envelope };
}

export function validatePasteGraphFragmentRequest(
  document: unknown
): ValidationResult<PasteGraphFragmentRequest> {
  if (!pasteGraphFragmentRequestValidator(document)) {
    return { ok: false, errors: schemaErrors(pasteGraphFragmentRequestValidator.errors as ErrorObject[]) };
  }

  const request = document as PasteGraphFragmentRequest;
  const fragmentResult = validateGraphFragmentV02(request.fragment, {
    outsideEndpointPolicy: request.options?.outsideEndpointPolicy
  });
  if (!fragmentResult.ok) {
    return { ok: false, errors: fragmentResult.errors };
  }

  return { ok: true, value: request };
}

export function validatePasteGraphFragmentResponse(
  document: unknown
): ValidationResult<PasteGraphFragmentResponse> {
  if (!pasteGraphFragmentResponseValidator(document)) {
    return { ok: false, errors: schemaErrors(pasteGraphFragmentResponseValidator.errors as ErrorObject[]) };
  }

  return { ok: true, value: document as PasteGraphFragmentResponse };
}
