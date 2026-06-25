import Ajv2020Runtime from "ajv/dist/2020.js";
import type {
  ErrorObject,
  Options,
  ValidateFunction
} from "ajv/dist/2020.js";
import {
  compatibilityMatrixV01Schema,
  controlMessageV01Schema,
  extensionManifestV01Schema,
  graphFragmentV01Schema,
  graphV01Schema,
  nodeDefinitionV01Schema,
  objectTextParseResultV01Schema,
  packageManifestV01Schema,
  projectV01Schema,
  runtimeCollaborationV0Schema,
  runtimeOperationV0Schema,
  runtimeSessionV0Schema,
  shaderInterfaceV01Schema,
  viewStateV01Schema
} from "./generated/schemas.js";
import { derivePatchContractV01 } from "./project.js";
import type {
  CompatibilityMatrixV01,
  ControlMessageV01,
  EdgeSpecV01,
  ExtensionManifestV01,
  GraphCycleValidationV01,
  GraphDocumentV01,
  GraphFragmentDiagnosticV01,
  GraphFragmentValidationOptionsV01,
  GraphFragmentValidationResultV01,
  GraphFragmentV01,
  GraphValidationDiagnosticV01,
  GraphValidationResultV01,
  NodeDefinitionManifestV01,
  ObjectTextParseResultV01,
  PackageManifestV01,
  PackageRootDocumentV01,
  PatchDefinitionV01,
  PasteGraphFragmentRequest,
  PasteGraphFragmentResponse,
  PortSpecV01,
  ProjectDocumentV01,
  RuntimeCollaborationAuthSubject,
  RuntimeCollaborationCausalMetadata,
  RuntimeCollaborationEventEnvelope,
  RuntimeCollaborationOperationBatch,
  RuntimeCollaborationOperationBatchResult,
  RuntimeCollaborationOperationEnvelope,
  RuntimeCollaborationOperationPayload,
  RuntimeCollaborationOperationResult,
  RuntimeCollaborationPresenceEnvelope,
  RuntimeCollaborationSelectionEnvelope,
  RuntimeOperationEnvelope,
  RuntimeSessionEvent,
  RuntimeSessionInfoResponse,
  ShaderInterfaceV01,
  ValidationResult,
  ViewStateV01
} from "./types.js";
import { SKENION_PACKAGE_MANIFEST_FILE_NAME } from "./types.js";
import {
  deriveV0CompatibilityLine,
  deriveV0CompatibilityRange,
  satisfiesV0CompatibilityRange
} from "./version.js";

const allowedNodePermissions = new Set<string>();

const Ajv2020 = Ajv2020Runtime as unknown as new (opts?: Options) => {
  compile(schema: unknown): ValidateFunction;
  addSchema(schema: unknown): unknown;
};
const ajv = new Ajv2020({ allErrors: true });
ajv.addSchema(graphV01Schema);
ajv.addSchema(graphFragmentV01Schema);
ajv.addSchema(viewStateV01Schema);
ajv.addSchema(projectV01Schema);
ajv.addSchema(runtimeOperationV0Schema);
ajv.addSchema(runtimeSessionV0Schema);
const graphV01Validator = ajv.compile(graphV01Schema);
const graphFragmentV01Validator = ajv.compile(graphFragmentV01Schema);
const runtimeOperationV0Validator = ajv.compile(runtimeOperationV0Schema);
ajv.compile(runtimeCollaborationV0Schema);
const runtimeCollaborationOperationEnvelopeValidator = ajv.compile({
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://skenion.dev/schemas/runtime/v0/collaboration-operation.schema.json",
  $ref: "https://skenion.dev/schemas/runtime/v0/collaboration.schema.json#/$defs/runtimeCollaborationOperationEnvelope"
});
const runtimeCollaborationOperationBatchValidator = ajv.compile({
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://skenion.dev/schemas/runtime/v0/collaboration-operation-batch.schema.json",
  $ref: "https://skenion.dev/schemas/runtime/v0/collaboration.schema.json#/$defs/runtimeCollaborationOperationBatch"
});
const runtimeCollaborationOperationResultValidator = ajv.compile({
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://skenion.dev/schemas/runtime/v0/collaboration-operation-result.schema.json",
  $ref: "https://skenion.dev/schemas/runtime/v0/collaboration.schema.json#/$defs/runtimeCollaborationOperationResult"
});
const runtimeCollaborationOperationBatchResultValidator = ajv.compile({
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://skenion.dev/schemas/runtime/v0/collaboration-operation-batch-result.schema.json",
  $ref: "https://skenion.dev/schemas/runtime/v0/collaboration.schema.json#/$defs/runtimeCollaborationOperationBatchResult"
});
const runtimeCollaborationPresenceEnvelopeValidator = ajv.compile({
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://skenion.dev/schemas/runtime/v0/collaboration-presence.schema.json",
  $ref: "https://skenion.dev/schemas/runtime/v0/collaboration.schema.json#/$defs/runtimeCollaborationPresenceEnvelope"
});
const runtimeCollaborationSelectionEnvelopeValidator = ajv.compile({
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://skenion.dev/schemas/runtime/v0/collaboration-selection.schema.json",
  $ref: "https://skenion.dev/schemas/runtime/v0/collaboration.schema.json#/$defs/runtimeCollaborationSelectionEnvelope"
});
const runtimeCollaborationEventEnvelopeValidator = ajv.compile({
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://skenion.dev/schemas/runtime/v0/collaboration-event.schema.json",
  $ref: "https://skenion.dev/schemas/runtime/v0/collaboration.schema.json#/$defs/runtimeCollaborationEventEnvelope"
});
const runtimeSessionInfoResponseValidator = ajv.compile(runtimeSessionV0Schema);
const runtimeSessionEventValidator = ajv.compile({
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://skenion.dev/schemas/runtime/v0/session-event.schema.json",
  $ref: "https://skenion.dev/schemas/runtime/v0/session.schema.json#/$defs/runtimeSessionEvent"
});
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
const controlMessageV01Validator = ajv.compile(controlMessageV01Schema);
const objectTextParseResultV01Validator = ajv.compile(objectTextParseResultV01Schema);
const nodeDefinitionV01Validator = ajv.compile(nodeDefinitionV01Schema);
const shaderInterfaceV01Validator = ajv.compile(shaderInterfaceV01Schema);
const viewStateV01Validator = ajv.compile(viewStateV01Schema);
const projectV01Validator = ajv.compile(projectV01Schema);
const patchDefinitionV01Validator = ajv.compile({
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "https://skenion.dev/schemas/project/v0.1/patch-definition.schema.json",
  $ref: "https://skenion.dev/schemas/project/v0.1/project.schema.json#/$defs/patchDefinition"
});
const extensionManifestV01Validator = ajv.compile(extensionManifestV01Schema);
const packageManifestV01Validator = ajv.compile(packageManifestV01Schema);
const compatibilityMatrixV01Validator = ajv.compile(compatibilityMatrixV01Schema);

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

function validateViewStateNodeReferences(
  viewState: ViewStateV01,
  graph: Pick<GraphDocumentV01, "nodes">,
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

function graphV01SemanticErrors(graph: GraphDocumentV01, label: string): string[] {
  const result = analyzeGraphDocumentV01(graph);
  return result.diagnostics
    .filter((diagnostic) => diagnostic.severity === "error")
    .map((diagnostic) => `${label} ${diagnostic.code}: ${diagnostic.message}`);
}

function validatePatchDefinitionV01Semantics(patch: PatchDefinitionV01): string[] {
  const errors = graphV01SemanticErrors(patch.graph, `patch ${patch.id} graph`);

  if (patch.viewState) {
    errors.push(
      ...validateViewStateNodeReferences(
        patch.viewState,
        patch.graph,
        `patch ${patch.id} viewState`
      )
    );
  }

  const contract = derivePatchContractV01(patch);
  errors.push(
    ...duplicateErrors(
      contract.ports.map((port) => port.id),
      `boundary port id on patch ${patch.id}`
    )
  );

  return errors;
}

function validateProjectDocumentV01Semantics(project: ProjectDocumentV01): string[] {
  const errors = [
    ...graphV01SemanticErrors(project.graph, "root graph"),
    ...validateViewStateNodeReferences(project.viewState, project.graph),
    ...duplicateErrors(
      project.patchLibrary.map((patch) => patch.id),
      "patch id"
    )
  ];

  for (const patch of project.patchLibrary) {
    errors.push(...validatePatchDefinitionV01Semantics(patch));
  }

  errors.push(...validateProjectPackageReferencesV01(project));

  return errors;
}

function validatePackageManifestV01Semantics(manifest: PackageManifestV01): string[] {
  const errors: string[] = [];
  const evidenceIds = new Set(manifest.evidence.map((evidence) => evidence.id));

  errors.push(...duplicateErrors((manifest.provides.patches ?? []).map((provided) => provided.id), "provided patch id"));
  errors.push(...duplicateErrors((manifest.provides.nodes ?? []).map((provided) => provided.id), "provided node id"));
  errors.push(...duplicateErrors((manifest.provides.resources ?? []).map((provided) => provided.id), "provided resource id"));
  errors.push(...duplicateErrors((manifest.provides.help ?? []).map((provided) => provided.id), "provided help id"));

  for (const artifact of manifest.nativeArtifacts ?? []) {
    if (!evidenceIds.has(artifact.evidenceRefs[0])) {
      errors.push(`native artifact ${artifact.path} references missing evidence: ${artifact.evidenceRefs[0]}`);
    }
    for (const evidenceRef of artifact.evidenceRefs.slice(1)) {
      if (!evidenceIds.has(evidenceRef)) {
        errors.push(`native artifact ${artifact.path} references missing evidence: ${evidenceRef}`);
      }
    }
  }

  return errors;
}

function validateProjectPackageReferencesV01(project: ProjectDocumentV01): string[] {
  const errors: string[] = [];
  const packageLock = project.packageLock ?? [];
  const packageLockById = new Map(packageLock.map((entry) => [entry.id, entry]));
  const patchById = new Map(project.patchLibrary.map((patch) => [patch.id, patch]));

  errors.push(...duplicateErrors(packageLock.map((entry) => entry.id), "package lock entry id"));
  errors.push(...duplicateErrors((project.resourceLock ?? []).map((entry) => entry.id), "resource lock entry id"));
  errors.push(...duplicateErrors((project.objectBindings ?? []).map((entry) => entry.id), "object binding id"));

  for (const dependency of project.packageDependencies ?? []) {
    const lockEntry = packageLockById.get(dependency.lockEntryId);
    if (!lockEntry) {
      errors.push(`package dependency ${dependency.packageId} references missing lockEntryId: ${dependency.lockEntryId}`);
      continue;
    }
    if (dependency.packageId !== lockEntry.packageId) {
      errors.push(
        `package dependency ${dependency.packageId} lockEntryId ${dependency.lockEntryId} points to package ${lockEntry.packageId}`
      );
    }
    if (!satisfiesV0CompatibilityRange(lockEntry.version, dependency.versionRange)) {
      errors.push(
        `package dependency ${dependency.packageId} locked version ${lockEntry.version} does not satisfy ${dependency.versionRange}`
      );
    }
  }

  for (const resource of project.resourceLock ?? []) {
    if (!packageLockById.has(resource.lockEntryId)) {
      errors.push(`resource lock ${resource.id} references missing lockEntryId: ${resource.lockEntryId}`);
    }
  }

  const bindingIds = new Set((project.objectBindings ?? []).map((entry) => entry.id));
  for (const node of [
    ...project.graph.nodes,
    ...project.patchLibrary.flatMap((patch) => patch.graph.nodes)
  ]) {
    if (node.bindingRef !== undefined && !bindingIds.has(node.bindingRef)) {
      errors.push(`node ${node.id} references missing bindingRef: ${node.bindingRef}`);
    }
  }

  for (const binding of project.objectBindings ?? []) {
    if (binding.target?.kind === "projectPatch") {
      const target = binding.target;
      const patch = patchById.get(target.patchId);
      if (!patch) {
        if (binding.status === "resolved") {
          errors.push(`resolved object binding ${binding.id} references missing project patch: ${target.patchId}`);
        } else if (binding.status !== "missing" && binding.status !== "stale") {
          errors.push(`object binding ${binding.id} references missing project patch: ${target.patchId}`);
        }
        continue;
      }
      if (patch && target.revision !== undefined && target.revision !== patch.revision) {
        if (binding.status === "resolved") {
          errors.push(`resolved object binding ${binding.id} project patch ${target.patchId} revision is stale`);
        } else if (binding.status !== "stale") {
          errors.push(`object binding ${binding.id} project patch ${target.patchId} revision is stale without diagnostics`);
        }
      }
      continue;
    }

    if (binding.target?.kind !== "packageProvider") {
      continue;
    }

    const providerRef = binding.target;
    const lockEntry = packageLockById.get(providerRef.lockEntryId);
    if (!lockEntry) {
      if (binding.status === "resolved") {
        errors.push(`resolved object binding ${binding.id} references missing lockEntryId: ${providerRef.lockEntryId}`);
      } else if (binding.status !== "missing" && binding.status !== "stale") {
        errors.push(`object binding ${binding.id} references missing lockEntryId: ${providerRef.lockEntryId}`);
      }
      continue;
    }
    if (providerRef.packageId !== lockEntry.packageId) {
      errors.push(
        `object binding ${binding.id} packageId ${providerRef.packageId} does not match lock entry package ${lockEntry.packageId}`
      );
    }
  }

  return errors;
}

function diagnostic(
  diagnostics: GraphValidationDiagnosticV01[],
  severity: GraphValidationDiagnosticV01["severity"],
  code: string,
  message: string,
  refs: Pick<GraphValidationDiagnosticV01, "nodes" | "edges"> = {}
): void {
  diagnostics.push({ severity, code, message, ...refs });
}

function portSpecKey(nodeId: string, portId: string): string {
  return `${nodeId}:${portId}`;
}

function edgeEndpointKey(edge: EdgeSpecV01): string {
  return `${edge.source.nodeId}:${edge.source.portId}->${edge.target.nodeId}:${edge.target.portId}`;
}

function isEdgeEnabled(edge: EdgeSpecV01): boolean {
  return edge.enabled !== false;
}

function inputMaxConnections(port: PortSpecV01): number {
  if (port.maxConnections === null) {
    return Number.POSITIVE_INFINITY;
  }
  return port.maxConnections ?? 1;
}

function portMergePolicy(port: PortSpecV01): string {
  return port.mergePolicy ?? "forbid";
}

function portFanOutPolicy(port: PortSpecV01): string {
  return port.fanOutPolicy ?? "allow";
}

function portTypeAccepts(source: PortSpecV01, target: PortSpecV01): boolean {
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
  diagnostics: GraphFragmentDiagnosticV01[],
  severity: GraphFragmentDiagnosticV01["severity"],
  code: string,
  message: string,
  refs: Pick<GraphFragmentDiagnosticV01, "nodes" | "edges"> = {}
): void {
  diagnostics.push({ severity, code, message, ...refs });
}

function analyzeFragmentSemantics(
  fragment: GraphFragmentV01,
  options: GraphFragmentValidationOptionsV01
): GraphFragmentValidationResultV01 {
  const diagnostics: GraphFragmentDiagnosticV01[] = [];
  const omittedEdgeIds: string[] = [];
  const outsideEndpointPolicy = options.outsideEndpointPolicy ?? "reject";
  const nodeIds = new Set<string>();
  const edgeIds = new Set<string>();
  const ports = new Map<string, PortSpecV01>();

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

function controlCycleTypes(edges: EdgeSpecV01[], ports: Map<string, PortSpecV01>): boolean {
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
  edges: EdgeSpecV01[],
  ports: Map<string, PortSpecV01>
): GraphCycleValidationV01 {
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

function stronglyConnectedComponents(nodes: string[], edges: EdgeSpecV01[]): string[][] {
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

function cycleEdgesFor(component: string[], edges: EdgeSpecV01[]): EdgeSpecV01[] {
  const componentSet = new Set(component);
  return edges.filter((edge) => (
    isEdgeEnabled(edge) &&
    componentSet.has(edge.source.nodeId) &&
    componentSet.has(edge.target.nodeId) &&
    (component.length > 1 || edge.source.nodeId === edge.target.nodeId)
  ));
}

function validateNodeDefinitionV01Semantics(definition: NodeDefinitionManifestV01): string[] {
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

export function analyzeGraphDocumentV01(graph: GraphDocumentV01): GraphValidationResultV01 {
  const diagnostics: GraphValidationDiagnosticV01[] = [];
  const cycles: GraphCycleValidationV01[] = [];
  const nodeIds = new Set<string>();
  const ports = new Map<string, PortSpecV01>();
  const incoming = new Map<string, EdgeSpecV01[]>();
  const outgoing = new Map<string, EdgeSpecV01[]>();
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

export function validateGraphDocumentV01(document: unknown): ValidationResult<GraphDocumentV01> {
  if (!graphV01Validator(document)) {
    return { ok: false, errors: schemaErrors(graphV01Validator.errors as ErrorObject[]) };
  }

  const graph = document as GraphDocumentV01;
  const result = analyzeGraphDocumentV01(graph);
  if (!result.ok) {
    return { ok: false, errors: result.diagnostics.map((diagnostic) => `${diagnostic.code}: ${diagnostic.message}`) };
  }

  return { ok: true, value: graph };
}

export function validateGraphDocument(document: unknown): ValidationResult<GraphDocumentV01> {
  return validateGraphDocumentV01(document);
}

export function analyzeGraphFragmentV01(
  fragment: GraphFragmentV01,
  options: GraphFragmentValidationOptionsV01 = {}
): GraphFragmentValidationResultV01 {
  return analyzeFragmentSemantics(fragment, options);
}

export function validateGraphFragmentV01(
  document: unknown,
  options: GraphFragmentValidationOptionsV01 = {}
): ValidationResult<GraphFragmentV01> {
  if (!graphFragmentV01Validator(document)) {
    return { ok: false, errors: schemaErrors(graphFragmentV01Validator.errors as ErrorObject[]) };
  }

  const fragment = document as GraphFragmentV01;
  const result = analyzeGraphFragmentV01(fragment, options);
  if (!result.ok) {
    return { ok: false, errors: result.diagnostics.map((entry) => `${entry.code}: ${entry.message}`) };
  }

  return { ok: true, value: fragment };
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

export function validateNodeDefinitionV01(
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

export function validateNodeDefinition(
  document: unknown
): ValidationResult<NodeDefinitionManifestV01> {
  return validateNodeDefinitionV01(document);
}

export function validateExtensionManifestV01(
  document: unknown
): ValidationResult<ExtensionManifestV01> {
  if (!extensionManifestV01Validator(document)) {
    return { ok: false, errors: schemaErrors(extensionManifestV01Validator.errors as ErrorObject[]) };
  }

  const manifest = document as ExtensionManifestV01;
  const providedNodes = manifest.provides.nodes ?? [];
  const errors = [
    ...duplicateErrors(
      providedNodes.map((node) => node.id),
      "provided node id"
    ),
    ...providedNodes.flatMap((node) =>
      validateNodeDefinitionV01Semantics(node).map((error) => `provided node ${node.id}: ${error}`)
    )
  ];
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value: manifest };
}

export function validatePackageManifestV01(
  document: unknown
): ValidationResult<PackageManifestV01> {
  if (!packageManifestV01Validator(document)) {
    return { ok: false, errors: schemaErrors(packageManifestV01Validator.errors as ErrorObject[]) };
  }

  const manifest = document as PackageManifestV01;
  const errors = validatePackageManifestV01Semantics(manifest);
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value: manifest };
}

export function validatePackageRootV01(
  document: unknown
): ValidationResult<PackageRootDocumentV01> {
  if (
    typeof document !== "object" ||
    document === null ||
    Array.isArray(document)
  ) {
    return { ok: false, errors: ["package root must be an object"] };
  }

  const root = document as Record<string, unknown>;
  const extraKeys = Object.keys(root).filter(
    (key) => !["schema", "schemaVersion", "manifestFileName", "manifest"].includes(key)
  );
  if (extraKeys.length > 0) {
    return { ok: false, errors: [`package root has unsupported keys: ${extraKeys.join(", ")}`] };
  }
  if (root.schema !== "skenion.package.root") {
    return { ok: false, errors: ["package root schema must be skenion.package.root"] };
  }
  if (root.schemaVersion !== "0.1.0") {
    return { ok: false, errors: ["package root schemaVersion must be 0.1.0"] };
  }
  if (root.manifestFileName !== SKENION_PACKAGE_MANIFEST_FILE_NAME) {
    return { ok: false, errors: [`package root manifestFileName must be ${SKENION_PACKAGE_MANIFEST_FILE_NAME}`] };
  }

  const manifestResult = validatePackageManifestV01(root.manifest);
  if (!manifestResult.ok) {
    return { ok: false, errors: manifestResult.errors.map((error) => `manifest ${error}`) };
  }

  return {
    ok: true,
    value: {
      schema: "skenion.package.root",
      schemaVersion: "0.1.0",
      manifestFileName: SKENION_PACKAGE_MANIFEST_FILE_NAME,
      manifest: manifestResult.value
    }
  };
}

function validateCompatibilityMatrixV01Semantics(matrix: CompatibilityMatrixV01): string[] {
  const errors: string[] = [];
  const contractsNpm = matrix.components.contracts.npm;
  const contractsCrate = matrix.components.contracts.crate;

  if (contractsNpm.ecosystem !== "npm" || contractsNpm.name !== "@skenion/contracts") {
    errors.push("components.contracts.npm must identify @skenion/contracts on npm");
  }
  if (contractsCrate.ecosystem !== "crates.io" || contractsCrate.name !== "skenion-contracts") {
    errors.push("components.contracts.crate must identify skenion-contracts on crates.io");
  }
  if (matrix.components.sdk.npm.ecosystem !== "npm" || matrix.components.sdk.npm.name !== "@skenion/sdk") {
    errors.push("components.sdk.npm must identify @skenion/sdk on npm");
  }

  try {
    const expectedLine = deriveV0CompatibilityLine(contractsNpm.version);
    const expectedRange = deriveV0CompatibilityRange(contractsNpm.version);
    if (matrix["contracts-line"] !== expectedLine) {
      errors.push(`contracts-line must be ${expectedLine}`);
    }
    if (matrix["contracts-range"] !== expectedRange) {
      errors.push(`contracts-range must be ${expectedRange}`);
    }
    if (deriveV0CompatibilityLine(contractsCrate.version) !== expectedLine) {
      errors.push("contracts npm and crate versions must be on the same v0 compatibility line");
    }
  } catch (error) {
    errors.push((error as Error).message);
  }

  if (!satisfiesV0CompatibilityRange(contractsNpm.version, matrix.components.sdk["supported-contracts-range"])) {
    errors.push("sdk supported-contracts-range must include the Contracts package version");
  }
  if (!satisfiesV0CompatibilityRange(contractsNpm.version, matrix["contracts-range"])) {
    errors.push("contracts-range must include the Contracts package version");
  }

  return errors;
}

export function validateCompatibilityMatrixV01(
  document: unknown
): ValidationResult<CompatibilityMatrixV01> {
  if (!compatibilityMatrixV01Validator(document)) {
    return { ok: false, errors: schemaErrors(compatibilityMatrixV01Validator.errors as ErrorObject[]) };
  }

  const matrix = document as CompatibilityMatrixV01;
  const errors = validateCompatibilityMatrixV01Semantics(matrix);
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value: matrix };
}

export function isCompatibilityMatrixV01(document: unknown): document is CompatibilityMatrixV01 {
  return validateCompatibilityMatrixV01(document).ok;
}

export function validateShaderInterface(document: unknown): ValidationResult<ShaderInterfaceV01> {
  if (!shaderInterfaceV01Validator(document)) {
    return { ok: false, errors: schemaErrors(shaderInterfaceV01Validator.errors as ErrorObject[]) };
  }

  return { ok: true, value: document as ShaderInterfaceV01 };
}

export function validateViewStateV01(document: unknown): ValidationResult<ViewStateV01> {
  if (!viewStateV01Validator(document)) {
    return { ok: false, errors: schemaErrors(viewStateV01Validator.errors as ErrorObject[]) };
  }

  return { ok: true, value: document as ViewStateV01 };
}

export function validateViewState(document: unknown): ValidationResult<ViewStateV01> {
  return validateViewStateV01(document);
}

export function validatePatchDefinitionV01(
  document: unknown
): ValidationResult<PatchDefinitionV01> {
  if (!patchDefinitionV01Validator(document)) {
    return { ok: false, errors: schemaErrors(patchDefinitionV01Validator.errors as ErrorObject[]) };
  }

  const patch = document as PatchDefinitionV01;
  const errors = validatePatchDefinitionV01Semantics(patch);
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value: patch };
}

export function validateProjectDocumentV01(
  document: unknown
): ValidationResult<ProjectDocumentV01> {
  const bindingStatusErrors = validateProjectObjectBindingStatusInvariants(document);
  if (bindingStatusErrors.length > 0) {
    return { ok: false, errors: bindingStatusErrors };
  }

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

function validateProjectObjectBindingStatusInvariants(document: unknown): string[] {
  if (typeof document !== "object" || document === null || !Array.isArray((document as { objectBindings?: unknown }).objectBindings)) {
    return [];
  }

  const errors: string[] = [];
  const requiredDiagnosticByStatus = new Map([
    ["missing", ["binding-target-missing"]],
    ["stale", ["binding-target-stale", "binding-interface-drift"]],
    ["unresolved", ["binding-unresolved"]],
    ["ambiguous", ["binding-ambiguous"]]
  ]);

  for (const binding of (document as { objectBindings: unknown[] }).objectBindings) {
    if (typeof binding !== "object" || binding === null) {
      continue;
    }
    const record = binding as { id?: unknown; status?: unknown; target?: unknown; diagnostics?: unknown };
    const id = typeof record.id === "string" ? record.id : "<unknown>";
    if (record.status === "resolved" && record.target === undefined) {
      errors.push(`resolved object binding ${id} requires target`);
      continue;
    }
    if (typeof record.status !== "string" || !requiredDiagnosticByStatus.has(record.status)) {
      continue;
    }
    const requiredCodes = requiredDiagnosticByStatus.get(record.status)!;
    const diagnostics = Array.isArray(record.diagnostics) ? record.diagnostics : [];
    const hasRequiredDiagnostic = diagnostics.some((diagnostic) => {
      if (typeof diagnostic !== "object" || diagnostic === null) {
        return false;
      }
      const code = (diagnostic as { code?: unknown }).code;
      return typeof code === "string" && requiredCodes.includes(code);
    });
    if (!hasRequiredDiagnostic) {
      errors.push(`${record.status} object binding ${id} requires ${requiredCodes.join(" or ")} diagnostic`);
    }
  }

  return errors;
}

export function validateProjectDocument(document: unknown): ValidationResult<ProjectDocumentV01> {
  return validateProjectDocumentV01(document);
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

export function validateRuntimeCollaborationOperationEnvelope(
  document: unknown
): ValidationResult<RuntimeCollaborationOperationEnvelope> {
  if (!runtimeCollaborationOperationEnvelopeValidator(document)) {
    return {
      ok: false,
      errors: schemaErrors(runtimeCollaborationOperationEnvelopeValidator.errors as ErrorObject[])
    };
  }

  const envelope = document as RuntimeCollaborationOperationEnvelope;
  const errors = validateRuntimeCollaborationOperationEnvelopeSemantics(envelope);
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value: envelope };
}

export function validateRuntimeCollaborationOperationBatch(
  document: unknown
): ValidationResult<RuntimeCollaborationOperationBatch> {
  if (!runtimeCollaborationOperationBatchValidator(document)) {
    return {
      ok: false,
      errors: schemaErrors(runtimeCollaborationOperationBatchValidator.errors as ErrorObject[])
    };
  }

  const batch = document as RuntimeCollaborationOperationBatch;
  const errors = validateRuntimeCollaborationOperationBatchSemantics(batch);
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value: batch };
}

export function validateRuntimeCollaborationOperationResult(
  document: unknown
): ValidationResult<RuntimeCollaborationOperationResult> {
  if (!runtimeCollaborationOperationResultValidator(document)) {
    return {
      ok: false,
      errors: schemaErrors(runtimeCollaborationOperationResultValidator.errors as ErrorObject[])
    };
  }

  const result = document as RuntimeCollaborationOperationResult;
  const errors = validateRuntimeCollaborationOperationResultSemantics(result);
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value: result };
}

export function validateRuntimeCollaborationOperationBatchResult(
  document: unknown
): ValidationResult<RuntimeCollaborationOperationBatchResult> {
  if (!runtimeCollaborationOperationBatchResultValidator(document)) {
    return {
      ok: false,
      errors: schemaErrors(runtimeCollaborationOperationBatchResultValidator.errors as ErrorObject[])
    };
  }

  const result = document as RuntimeCollaborationOperationBatchResult;
  const errors = validateRuntimeCollaborationOperationBatchResultSemantics(result);
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value: result };
}

export function validateRuntimeCollaborationPresenceEnvelope(
  document: unknown
): ValidationResult<RuntimeCollaborationPresenceEnvelope> {
  if (!runtimeCollaborationPresenceEnvelopeValidator(document)) {
    return {
      ok: false,
      errors: schemaErrors(runtimeCollaborationPresenceEnvelopeValidator.errors as ErrorObject[])
    };
  }

  const presence = document as RuntimeCollaborationPresenceEnvelope;
  const errors = validateRuntimeCollaborationPresenceSemantics(presence);
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value: presence };
}

export function validateRuntimeCollaborationSelectionEnvelope(
  document: unknown
): ValidationResult<RuntimeCollaborationSelectionEnvelope> {
  if (!runtimeCollaborationSelectionEnvelopeValidator(document)) {
    return {
      ok: false,
      errors: schemaErrors(runtimeCollaborationSelectionEnvelopeValidator.errors as ErrorObject[])
    };
  }

  const selection = document as RuntimeCollaborationSelectionEnvelope;
  const errors = validateRuntimeCollaborationSelectionSemantics(selection);
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value: selection };
}

export function validateRuntimeCollaborationEventEnvelope(
  document: unknown
): ValidationResult<RuntimeCollaborationEventEnvelope> {
  if (!runtimeCollaborationEventEnvelopeValidator(document)) {
    return {
      ok: false,
      errors: schemaErrors(runtimeCollaborationEventEnvelopeValidator.errors as ErrorObject[])
    };
  }

  const event = document as RuntimeCollaborationEventEnvelope;
  const errors = validateRuntimeCollaborationEventSemantics(event);
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value: event };
}

export function validateRuntimeSessionInfoResponse(
  document: unknown
): ValidationResult<RuntimeSessionInfoResponse> {
  if (!runtimeSessionInfoResponseValidator(document)) {
    return { ok: false, errors: schemaErrors(runtimeSessionInfoResponseValidator.errors as ErrorObject[]) };
  }

  return { ok: true, value: document as RuntimeSessionInfoResponse };
}

export function validateRuntimeSessionEvent(
  document: unknown
): ValidationResult<RuntimeSessionEvent> {
  if (!runtimeSessionEventValidator(document)) {
    return { ok: false, errors: schemaErrors(runtimeSessionEventValidator.errors as ErrorObject[]) };
  }

  const event = document as RuntimeSessionEvent;
  const errors = validateRuntimeSessionEventSemantics(event);
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value: event };
}

function validateRuntimeSessionEventSemantics(event: RuntimeSessionEvent): string[] {
  const errors: string[] = [];
  if (event.replay.gap && event.replay.gap.expectedSequence >= event.replay.gap.actualSequence) {
    errors.push("replay gap expectedSequence must be less than actualSequence");
  }
  if (event.sessionRevision !== event.snapshot.sessionRevision) {
    errors.push("sessionRevision must match snapshot.sessionRevision");
  }
  return errors;
}

function validateRuntimeCollaborationCausality(
  causal: RuntimeCollaborationCausalMetadata,
  label: string
): string[] {
  const vectorValues = Object.values(causal.vector);
  const maxVector = vectorValues.reduce((max, value) => Math.max(max, value), 0);
  return causal.baseSequence < maxVector
    ? [`${label} baseSequence must be greater than or equal to the causal vector maximum`]
    : [];
}

function validateRuntimeCollaborationAuthSeparation(
  participantId: string,
  authSubject: RuntimeCollaborationAuthSubject | undefined,
  label: string
): string[] {
  if (authSubject?.subjectId && authSubject.subjectId === participantId) {
    return [`${label} participantId must not mirror auth subject id`];
  }
  return [];
}

function validateRuntimeCollaborationExpiry(
  updatedAt: string,
  expiresAt: string,
  label: string
): string[] {
  return expiresAt <= updatedAt
    ? [`${label} expiresAt must be later than updatedAt`]
    : [];
}

function validateRuntimeCollaborationPayload(
  payload: RuntimeCollaborationOperationPayload,
  participantId: string
): string[] {
  if (payload.kind === "changeSet") {
    return duplicateErrors(
      payload.changes.map((change) => change.changeId),
      "collaboration change id"
    );
  }

  if (payload.kind === "pasteGraphFragment") {
    const requestResult = validatePasteGraphFragmentRequest(payload.request);
    return requestResult.ok ? [] : requestResult.errors;
  }

  if (payload.scope.participantId !== participantId) {
    return ["undoRedo scope participantId must match operation participantId"];
  }
  return [];
}

function validateRuntimeCollaborationOperationEnvelopeSemantics(
  envelope: RuntimeCollaborationOperationEnvelope
): string[] {
  const errors = [
    ...validateRuntimeCollaborationCausality(envelope.causal, "operation causal"),
    ...validateRuntimeCollaborationAuthSeparation(
      envelope.participantId,
      envelope.authSubject,
      "operation"
    ),
    ...validateRuntimeCollaborationPayload(envelope.payload, envelope.participantId)
  ];

  if (!(envelope.participantId in envelope.causal.vector)) {
    errors.push("operation causal vector must include participantId");
  }

  return errors;
}

function validateRuntimeCollaborationOperationBatchSemantics(
  batch: RuntimeCollaborationOperationBatch
): string[] {
  const errors = duplicateErrors(
    batch.operations.map((operation) => operation.idempotencyKey),
    "collaboration idempotency key"
  );

  for (const operation of batch.operations) {
    if (operation.sessionId !== batch.sessionId) {
      errors.push("collaboration batch operation sessionId must match batch sessionId");
    }
    errors.push(...validateRuntimeCollaborationOperationEnvelopeSemantics(operation));
  }

  return errors;
}

function validateRuntimeCollaborationOperationResultSemantics(
  result: RuntimeCollaborationOperationResult
): string[] {
  const errors = validateRuntimeCollaborationCausality(result.causal, "operation result causal");
  const hasAck = result.ack !== undefined;
  const hasNack = result.nack !== undefined;
  const hasRebase = result.rebase !== undefined;

  if ((result.status === "accepted" || result.status === "rebased") && !hasAck) {
    errors.push("accepted or rebased collaboration result must include ack");
  }
  if (result.status === "accepted" && (hasNack || hasRebase)) {
    errors.push("accepted collaboration result must not include nack or rebase");
  }
  if ((result.status === "duplicate" || result.status === "rejected") && !hasNack) {
    errors.push("duplicate or rejected collaboration result must include nack");
  }
  if (result.status === "duplicate" && result.nack?.reason !== "duplicate-idempotency-key") {
    errors.push("duplicate collaboration result nack reason must be duplicate-idempotency-key");
  }
  if (result.status === "rebased" && !hasRebase) {
    errors.push("rebased collaboration result must include rebase metadata");
  }
  if (result.rebase) {
    errors.push(
      ...validateRuntimeCollaborationCausality(result.rebase.from, "rebase from causal"),
      ...validateRuntimeCollaborationCausality(result.rebase.to, "rebase to causal")
    );
  }

  return errors;
}

function validateRuntimeCollaborationOperationBatchResultSemantics(
  result: RuntimeCollaborationOperationBatchResult
): string[] {
  const errors = duplicateErrors(
    result.results.map((operationResult) => operationResult.idempotencyKey),
    "collaboration batch result idempotency key"
  );

  for (const operationResult of result.results) {
    if (operationResult.sessionId !== result.sessionId) {
      errors.push("collaboration batch result operation sessionId must match batch result sessionId");
    }
    errors.push(...validateRuntimeCollaborationOperationResultSemantics(operationResult));
  }

  return errors;
}

function validateRuntimeCollaborationPresenceSemantics(
  presence: RuntimeCollaborationPresenceEnvelope
): string[] {
  return [
    ...validateRuntimeCollaborationAuthSeparation(
      presence.participantId,
      presence.authSubject,
      "presence"
    ),
    ...validateRuntimeCollaborationExpiry(
      presence.updatedAt,
      presence.expiresAt,
      "presence"
    )
  ];
}

function validateRuntimeCollaborationSelectionSemantics(
  selection: RuntimeCollaborationSelectionEnvelope
): string[] {
  return validateRuntimeCollaborationExpiry(
    selection.updatedAt,
    selection.expiresAt,
    "selection"
  );
}

function validateRuntimeCollaborationEventSemantics(
  event: RuntimeCollaborationEventEnvelope
): string[] {
  const errors = validateRuntimeCollaborationCausality(event.causal, "collaboration event causal");

  if (event.replay.gap && event.replay.gap.expectedSequence >= event.replay.gap.actualSequence) {
    errors.push("collaboration event replay gap expectedSequence must be less than actualSequence");
  }

  return errors;
}

export function validatePasteGraphFragmentRequest(
  document: unknown
): ValidationResult<PasteGraphFragmentRequest> {
  if (!pasteGraphFragmentRequestValidator(document)) {
    return { ok: false, errors: schemaErrors(pasteGraphFragmentRequestValidator.errors as ErrorObject[]) };
  }

  const request = document as PasteGraphFragmentRequest;
  const fragmentResult = validateGraphFragmentV01(request.fragment, {
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

  const response = document as PasteGraphFragmentResponse;
  const errors: string[] = [];
  for (const diagnostic of response.diagnostics) {
    if ((diagnostic.code === "interface-drift" || diagnostic.code === "invalid-incident-edge") && diagnostic.interfaceDetail === undefined) {
      errors.push(`runtime operation diagnostic ${diagnostic.code} requires interfaceDetail`);
    }
  }
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value: response };
}
