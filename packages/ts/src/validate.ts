import Ajv2020Runtime from "ajv/dist/2020.js";
import type {
  ErrorObject,
  Options,
  ValidateFunction
} from "ajv/dist/2020.js";
import {
  graphPatchEventV01Schema,
  graphPatchHistoryV01Schema,
  graphPatchV01Schema,
  graphV01Schema,
  graphV02Schema,
  nodeDefinitionV01Schema,
  nodeDefinitionV02Schema,
  shaderInterfaceV01Schema
} from "./generated/schemas.js";
import type {
  DataTypeV01,
  EdgeSpecV02,
  GraphCycleValidationV02,
  GraphDocumentV01,
  GraphDocumentV02,
  GraphPatchEventV01,
  GraphPatchHistoryV01,
  GraphPatchV01,
  GraphValidationDiagnosticV02,
  GraphValidationResultV02,
  NodeDefinitionManifestV01,
  NodeDefinitionManifestV02,
  PortV01,
  PortSpecV02,
  ShaderInterfaceV01,
  ValidationResult
} from "./types.js";

const allowedNodePermissions = new Set<string>();

const Ajv2020 = Ajv2020Runtime as unknown as new (opts?: Options) => {
  compile(schema: unknown): ValidateFunction;
  addSchema(schema: unknown): unknown;
};
const ajv = new Ajv2020({ allErrors: true });
ajv.addSchema(graphPatchV01Schema);
ajv.addSchema(graphPatchEventV01Schema);
const graphV01Validator = ajv.compile(graphV01Schema);
const graphV02Validator = ajv.compile(graphV02Schema);
const graphPatchV01Validator = ajv.compile(graphPatchV01Schema);
const graphPatchEventV01Validator = ajv.compile(graphPatchEventV01Schema);
const graphPatchHistoryV01Validator = ajv.compile(graphPatchHistoryV01Schema);
const nodeDefinitionV01Validator = ajv.compile(nodeDefinitionV01Schema);
const nodeDefinitionV02Validator = ajv.compile(nodeDefinitionV02Schema);
const shaderInterfaceV01Validator = ajv.compile(shaderInterfaceV01Schema);

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

function formatAccepts(targetFormat: DataTypeV01["format"], sourceFormat: DataTypeV01["format"]): boolean {
  if (targetFormat === undefined || sourceFormat === undefined) {
    return true;
  }

  const targetFormats = Array.isArray(targetFormat) ? targetFormat : [targetFormat];
  const sourceFormats = Array.isArray(sourceFormat) ? sourceFormat : [sourceFormat];
  return sourceFormats.every((format) => targetFormats.includes(format));
}

function compatibleTypes(sourceType: DataTypeV01, targetType: DataTypeV01): boolean {
  return (
    sourceType.flow === targetType.flow &&
    sourceType.dataKind === targetType.dataKind &&
    formatAccepts(targetType.format, sourceType.format)
  );
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
  return source.type === target.type || target.accepts?.includes(source.type) === true;
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

export function validateShaderInterface(document: unknown): ValidationResult<ShaderInterfaceV01> {
  if (!shaderInterfaceV01Validator(document)) {
    return { ok: false, errors: schemaErrors(shaderInterfaceV01Validator.errors as ErrorObject[]) };
  }

  return { ok: true, value: document as ShaderInterfaceV01 };
}
