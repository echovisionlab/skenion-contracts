import Ajv2020Runtime from "ajv/dist/2020.js";
import type {
  ErrorObject,
  Options,
  ValidateFunction
} from "ajv/dist/2020.js";
import {
  compatibilityMatrixV01Schema,
  messageValueV01Schema,
  extensionManifestV01Schema,
  graphFragmentV01Schema,
  graphV01Schema,
  nodeDefinitionV01Schema,
  objectTextParseResultV01Schema,
  packageDiscoveryV01Schema,
  packageInstallPlanRequestV01Schema,
  packageInstallPlanResponseV01Schema,
  packageListingV01Schema,
  packageManifestV01Schema,
  projectV01Schema,
  shaderInterfaceV01Schema,
  viewStateV01Schema
} from "./generated/schemas.js";
import { derivePatchContractV01 } from "./project.js";
import type {
  CompatibilityMatrixV01,
  MessageValueV01,
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
  PackageDiscoveryResponseV01,
  PackageInstallPlanRequestV01,
  PackageInstallPlanResponseV01,
  PackageInstallPlanTargetV01,
  PackageListingV01,
  PackageManifestV01,
  PackageRootDocumentV01,
  PatchDefinitionV01,
  PasteGraphFragmentRequest,
  PortSpecV01,
  ProjectDocumentV01,
  ProjectPackageLockEntryV01,
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
const graphV01Validator = ajv.compile(graphV01Schema);
const graphFragmentV01Validator = ajv.compile(graphFragmentV01Schema);
const messageValueV01Validator = ajv.compile(messageValueV01Schema);
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
ajv.addSchema(packageListingV01Schema);
const packageListingV01Validator = ajv.compile(packageListingV01Schema);
const packageDiscoveryV01Validator = ajv.compile(packageDiscoveryV01Schema);
const packageInstallPlanRequestV01Validator = ajv.compile(packageInstallPlanRequestV01Schema);
const packageInstallPlanResponseV01Validator = ajv.compile(packageInstallPlanResponseV01Schema);
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

function validatePackageListingV01Semantics(listing: PackageListingV01): string[] {
  const errors: string[] = [];

  errors.push(...duplicateErrors((listing.provides.patches ?? []).map((provided) => provided.id), "provided patch id"));
  errors.push(...duplicateErrors((listing.provides.nodes ?? []).map((provided) => provided.id), "provided node id"));
  errors.push(...duplicateErrors((listing.provides.resources ?? []).map((provided) => provided.id), "provided resource id"));
  errors.push(...duplicateErrors((listing.provides.help ?? []).map((provided) => provided.id), "provided help id"));
  errors.push(...duplicateErrors((listing.provides.nativeObjects ?? []).map((provided) => provided.id), "provided native object id"));
  errors.push(...duplicateErrors((listing.provides.codecs ?? []).map((provided) => provided.id), "provided codec id"));

  const lowerBoundVersion = listing.contracts.range.slice(2).split(" ", 1)[0];
  if (
    deriveV0CompatibilityLine(lowerBoundVersion) !== listing.contracts.line ||
    deriveV0CompatibilityRange(lowerBoundVersion) !== listing.contracts.range
  ) {
    errors.push("package listing contracts line must match contracts range");
  }
  if (listing.runtimeAbiRange !== undefined) {
    const runtimeAbiLowerBoundVersion = listing.runtimeAbiRange.slice(2).split(" ", 1)[0];
    if (deriveV0CompatibilityRange(runtimeAbiLowerBoundVersion) !== listing.runtimeAbiRange) {
      errors.push("package listing runtimeAbiRange must be a current v0 compatibility range");
    }
  }

  const artifacts = listing.artifactEvidence.artifacts;
  const evidenceIds = new Set(listing.artifactEvidence.evidence.map((evidence) => evidence.id));
  for (const artifact of artifacts) {
    for (const evidenceRef of artifact.evidenceRefs) {
      if (!evidenceIds.has(evidenceRef)) {
        errors.push(`listing artifact ${artifact.path} references missing evidence: ${evidenceRef}`);
      }
    }
  }

  const nativeArtifacts = artifacts.filter((artifact) => artifact.kind === "native-artifact");
  if (listing.category === "patch") {
    if (nativeArtifacts.length > 0) {
      errors.push("patch package listing must not declare native artifact summaries");
    }
  }

  if (listing.category === "native" || listing.category === "mixed") {
    const nativeTargets = new Set(nativeArtifacts.map((artifact) => artifact.target));
    for (const target of listing.targetSupport.targets ?? []) {
      if (!nativeTargets.has(target)) {
        errors.push(`package listing target ${target} has no native artifact summary`);
      }
    }
  }

  return errors;
}

function validatePackageDiscoveryResponseV01Semantics(response: PackageDiscoveryResponseV01): string[] {
  const errors = duplicateErrors(
    response.listings.map((listing) => `${listing.packageId}@${listing.version}`),
    "package listing"
  );

  for (const listing of response.listings) {
    errors.push(...validatePackageListingV01Semantics(listing));
  }

  return errors;
}

const packagePlanTargetTriples: Record<
  PackageInstallPlanTargetV01["os"],
  Record<PackageInstallPlanTargetV01["arch"], string>
> = {
  macos: {
    aarch64: "aarch64-apple-darwin",
    x86_64: "x86_64-apple-darwin"
  },
  windows: {
    aarch64: "aarch64-pc-windows-msvc",
    x86_64: "x86_64-pc-windows-msvc"
  },
  linux: {
    aarch64: "aarch64-unknown-linux-gnu",
    x86_64: "x86_64-unknown-linux-gnu"
  }
};

function validatePackageInstallPlanTargetV01Semantics(
  target: PackageInstallPlanTargetV01
): string[] {
  const errors: string[] = [];
  const expectedTriple = packagePlanTargetTriples[target.os][target.arch];
  if (target.triple !== expectedTriple) {
    errors.push(`package install plan target ${target.os}/${target.arch} must use target triple ${expectedTriple}`);
  }

  const contractsLowerBoundVersion = target.contracts.range.slice(2).split(" ", 1)[0];
  if (
    deriveV0CompatibilityLine(contractsLowerBoundVersion) !== target.contracts.line ||
    deriveV0CompatibilityRange(contractsLowerBoundVersion) !== target.contracts.range
  ) {
    errors.push("package install plan target contracts line must match contracts range");
  }

  if (target.runtimeAbiRange !== undefined) {
    const runtimeAbiLowerBoundVersion = target.runtimeAbiRange.slice(2).split(" ", 1)[0];
    if (deriveV0CompatibilityRange(runtimeAbiLowerBoundVersion) !== target.runtimeAbiRange) {
      errors.push("package install plan target runtimeAbiRange must be a current v0 compatibility range");
    }
  }

  return errors;
}

function validatePackageInstallPlanLockEntryV01Semantics(
  lockEntry: ProjectPackageLockEntryV01
): string[] {
  const errors: string[] = [];

  if (lockEntry.category === "patch") {
    if (lockEntry.runtimeAbiRange !== undefined) {
      errors.push(`patch package install plan lock ${lockEntry.id} must not declare runtimeAbiRange`);
    }
    if (lockEntry.target !== undefined) {
      errors.push(`patch package install plan lock ${lockEntry.id} must not declare target`);
    }
    if (lockEntry.nativeArtifacts !== undefined) {
      errors.push(`patch package install plan lock ${lockEntry.id} must not declare nativeArtifacts`);
    }
  }

  if (lockEntry.category === "native" || lockEntry.category === "mixed") {
    if (lockEntry.runtimeAbiRange === undefined) {
      errors.push(`${lockEntry.category} package install plan lock ${lockEntry.id} requires runtimeAbiRange`);
    }
    if (lockEntry.target === undefined) {
      errors.push(`${lockEntry.category} package install plan lock ${lockEntry.id} requires target`);
    }
    if (!Array.isArray(lockEntry.nativeArtifacts) || lockEntry.nativeArtifacts.length === 0) {
      errors.push(`${lockEntry.category} package install plan lock ${lockEntry.id} requires nativeArtifacts`);
    }
  }

  return errors;
}

function validatePackageInstallPlanRequestPreSchemaSemantics(document: unknown): string[] {
  if (document === null || typeof document !== "object") {
    return [];
  }

  const request = document as {
    schema?: unknown;
    current?: {
      packageLock?: unknown;
    };
    rollbackCandidates?: unknown;
  };
  if (request.schema !== "skenion.package.install-plan.request") {
    return [];
  }

  const errors: string[] = [];
  const packageLock = Array.isArray(request.current?.packageLock) ? request.current.packageLock : [];
  const rollbackCandidates = Array.isArray(request.rollbackCandidates) ? request.rollbackCandidates : [];
  for (const lockEntry of [...packageLock, ...rollbackCandidates]) {
    if (lockEntry === null || typeof lockEntry !== "object") {
      continue;
    }
    errors.push(...validatePackageInstallPlanLockEntryV01Semantics(lockEntry as ProjectPackageLockEntryV01));
  }

  return errors;
}

function validatePackageInstallPlanResponsePreSchemaSemantics(document: unknown): string[] {
  if (document === null || typeof document !== "object") {
    return [];
  }

  const response = document as {
    schema?: unknown;
    ok?: unknown;
    checks?: unknown;
    actions?: unknown;
    diagnostics?: unknown;
  };
  if (response.schema !== "skenion.package.install-plan.response") {
    return [];
  }

  const errors: string[] = [];
  const checks = Array.isArray(response.checks) ? response.checks : [];
  const actions = Array.isArray(response.actions) ? response.actions : [];
  const diagnostics = Array.isArray(response.diagnostics) ? response.diagnostics : [];

  for (const check of checks) {
    if (check === null || typeof check !== "object") {
      continue;
    }
    const diagnosticRefs = (check as { diagnosticRefs?: unknown }).diagnosticRefs;
    if (
      (check as { status?: unknown }).status === "fail" &&
      (!Array.isArray(diagnosticRefs) || diagnosticRefs.length === 0)
    ) {
      errors.push(`package install plan failing check ${(check as { kind?: unknown }).kind} requires diagnosticRefs`);
    }
  }

  for (const action of actions) {
    if (action === null || typeof action !== "object") {
      continue;
    }
    const diagnosticRefs = (action as { diagnosticRefs?: unknown }).diagnosticRefs;
    if (
      (action as { kind?: unknown }).kind === "reject" &&
      (!Array.isArray(diagnosticRefs) || diagnosticRefs.length === 0)
    ) {
      errors.push(`package install plan reject action ${(action as { id?: unknown }).id} requires diagnosticRefs`);
    }
  }

  const hasFailedCheck = checks.some((check) => {
    return check !== null && typeof check === "object" && (check as { status?: unknown }).status === "fail";
  });
  const hasRejectAction = actions.some((action) => {
    return action !== null && typeof action === "object" && (action as { kind?: unknown }).kind === "reject";
  });
  const hasErrorDiagnostic = diagnostics.some((diagnostic) => {
    return diagnostic !== null && typeof diagnostic === "object" && (diagnostic as { severity?: unknown }).severity === "error";
  });

  if (response.ok === true) {
    if (hasFailedCheck) {
      errors.push("successful package install plan response must not include failed checks");
    }
    if (hasRejectAction) {
      errors.push("successful package install plan response must not include reject actions");
    }
  }

  if (response.ok === false) {
    if (!hasRejectAction) {
      errors.push("failed package install plan response requires a reject action");
    }
    if (!hasErrorDiagnostic) {
      errors.push("failed package install plan response requires an error diagnostic");
    }
  }

  return errors;
}

function validatePackageInstallPlanRequestV01Semantics(
  request: PackageInstallPlanRequestV01
): string[] {
  const errors = validatePackageInstallPlanTargetV01Semantics(request.target);
  const packageLockIds = new Set(request.current.packageLock.map((entry) => entry.id));

  if (request.desired.versionRange !== undefined) {
    const desiredLowerBoundVersion = request.desired.versionRange.slice(2).split(" ", 1)[0];
    if (deriveV0CompatibilityRange(desiredLowerBoundVersion) !== request.desired.versionRange) {
      errors.push("package install plan desired versionRange must be a current v0 compatibility range");
    }
  }

  errors.push(...duplicateErrors(request.current.packageLock.map((entry) => entry.id), "package install plan lock entry id"));
  errors.push(...duplicateErrors(request.current.objectBindings.map((entry) => entry.id), "package install plan object binding id"));

  if (
    request.current.installedLockEntryId !== undefined &&
    !packageLockIds.has(request.current.installedLockEntryId)
  ) {
    errors.push(`package install plan references missing installedLockEntryId: ${request.current.installedLockEntryId}`);
  }

  for (const lockEntry of request.current.packageLock) {
    errors.push(...validatePackageInstallPlanLockEntryV01Semantics(lockEntry));
  }

  for (const rollbackCandidate of request.rollbackCandidates ?? []) {
    errors.push(...validatePackageInstallPlanLockEntryV01Semantics(rollbackCandidate));
  }

  for (const binding of request.current.objectBindings) {
    if (binding.target?.kind === "packageProvider" && !packageLockIds.has(binding.target.lockEntryId)) {
      errors.push(`package install plan object binding ${binding.id} references missing lockEntryId: ${binding.target.lockEntryId}`);
    }
  }

  for (const candidate of request.candidates) {
    errors.push(...validatePackageListingV01Semantics(candidate.listing));
    if (candidate.listing.packageId !== request.packageId) {
      errors.push(`package install plan candidate ${candidate.listing.packageId} does not match request packageId ${request.packageId}`);
    }

    if (candidate.manifest !== undefined) {
      errors.push(...validatePackageManifestV01Semantics(candidate.manifest));
      if (candidate.manifest.id !== candidate.listing.packageId) {
        errors.push(`package install plan candidate manifest id ${candidate.manifest.id} does not match listing packageId ${candidate.listing.packageId}`);
      }
      if (candidate.manifest.version !== candidate.listing.version) {
        errors.push(`package install plan candidate manifest version ${candidate.manifest.version} does not match listing version ${candidate.listing.version}`);
      }
    }
  }

  return errors;
}

function validatePackageInstallPlanResponseV01Semantics(
  response: PackageInstallPlanResponseV01
): string[] {
  const errors = validatePackageInstallPlanTargetV01Semantics(response.target);

  errors.push(...duplicateErrors(response.actions.map((action) => action.id), "package install plan action id"));
  errors.push(...duplicateErrors(response.diagnostics.map((diagnostic) => diagnostic.id), "package install plan diagnostic id"));

  const diagnosticIds = new Set(response.diagnostics.map((diagnostic) => diagnostic.id));
  for (const check of response.checks) {
    for (const diagnosticRef of check.diagnosticRefs ?? []) {
      if (!diagnosticIds.has(diagnosticRef)) {
        errors.push(`package install plan check ${check.kind} references missing diagnostic ${diagnosticRef}`);
      }
    }
  }

  for (const [index, action] of response.actions.entries()) {
    if (action.order !== index) {
      errors.push(`package install plan action ${action.id} order must be ${index}`);
    }

    for (const diagnosticRef of action.diagnosticRefs ?? []) {
      if (!diagnosticIds.has(diagnosticRef)) {
        errors.push(`package install plan action ${action.id} references missing diagnostic ${diagnosticRef}`);
      }
    }

    for (const capabilityChange of action.capabilityChanges ?? []) {
      if (capabilityChange.diagnosticRef !== undefined && !diagnosticIds.has(capabilityChange.diagnosticRef)) {
        errors.push(
          `package install plan action ${action.id} capability change references missing diagnostic ${capabilityChange.diagnosticRef}`
        );
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
  if (target.type === "value.core.message" && isMessageValuePortType(source.type)) {
    return true;
  }
  return source.type === target.type || target.accepts?.includes(source.type) === true;
}

function isMessageValuePortType(type: string): boolean {
  return [
    "value.core.message",
    "value.core.bang",
    "value.core.bool",
    "value.core.uint8",
    "value.core.uint16",
    "value.core.uint32",
    "value.core.uint64",
    "value.core.int8",
    "value.core.int16",
    "value.core.int32",
    "value.core.int64",
    "value.core.float8",
    "value.core.float16",
    "value.core.float32",
    "value.core.float64",
    "value.core.ufloat8",
    "value.core.ufloat16",
    "value.core.ufloat32",
    "value.core.ufloat64",
    "value.core.color",
    "value.core.string"
  ].includes(type);
}

const firstPartyValueTypeIds = new Set([
  "value.core.bang",
  "value.core.bool",
  "value.core.uint8",
  "value.core.uint16",
  "value.core.uint32",
  "value.core.uint64",
  "value.core.int8",
  "value.core.int16",
  "value.core.int32",
  "value.core.int64",
  "value.core.float8",
  "value.core.float16",
  "value.core.float32",
  "value.core.float64",
  "value.core.ufloat8",
  "value.core.ufloat16",
  "value.core.ufloat32",
  "value.core.ufloat64",
  "value.core.string",
  "value.core.message",
  "value.core.color",
  "value.core.vector",
  "value.core.matrix",
  "value.core.tensor"
]);

const invalidValueTypeIds = new Set([
  "value.core.float",
  "value.core.int",
  "value.core.uint",
  "value.core.number",
  "value.core.object",
  "value.core.frame",
  "value.core.symbol",
  "value.media.asset",
  "value.media.stream",
  "value.media.video-stream",
  "value.media.audio-stream",
  "value.media.audio-sample",
  "value.media.audio-frame",
  "value.media.audio-buffer",
  "value.media.image",
  "value.media.matrix",
  "value.media.render-frame",
  "value.media.video-frame"
]);

function invalidPortValueType(type: string): boolean {
  if ([
    "message.any",
    "number.float",
    "number.int",
    "number.uint",
    "boolean",
    "color",
    "string",
    "control.number",
    "control.message",
    "control.message.any",
    "event.bang",
    "asset.video",
    "asset.image",
    "asset.audio",
    "gpu.texture2d",
    "video.frame",
    "render.frame",
    "stream.video.frame",
    "signal.audio"
  ].includes(type)) {
    return true;
  }
  if (
    type.startsWith("control.") ||
    type.startsWith("event.") ||
    type.startsWith("stream.") ||
    type.startsWith("payload.") ||
    type.startsWith("data.") ||
    type.startsWith("selector.") ||
    type.startsWith("value<")
  ) {
    return true;
  }
  if (invalidValueTypeIds.has(type)) {
    return true;
  }
  if (type.startsWith("value.") && !firstPartyValueTypeIds.has(type)) {
    return true;
  }
  return false;
}

function isPayloadIdentityNodeKind(kind: string): boolean {
  return [
    "value",
    "data",
    "payload",
    "bool",
    "string",
    "core.bool",
    "core.string",
    "value.core.message",
    "value.core.bang",
    "value.core.string",
    "value.core.string",
    "value.core.string",
    "value.core.tensor"
  ].includes(kind) ||
    kind.startsWith("value.") ||
    kind.startsWith("data.") ||
    kind.startsWith("payload.") ||
    kind.startsWith("control.");
}

type MessageKeyPolicyPortV01 = Pick<PortSpecV01, "direction" | "type" | "accepts" | "messageKeys">;

function isKeyAwareInputPort(port: MessageKeyPolicyPortV01): boolean {
  return port.direction === "input" && (
    port.type === "value.core.message" ||
    port.accepts?.includes("value.core.message") === true
  );
}

type MessageKeyPolicyField = "silent" | "trigger" | "store" | "emit";

const messageKeyPolicyFields: MessageKeyPolicyField[] = [
  "silent",
  "trigger",
  "store",
  "emit"
];

function messageKeyPolicyErrors(port: MessageKeyPolicyPortV01, label: string): string[] {
  const policy = port.messageKeys;
  if (!policy) {
    return isKeyAwareInputPort(port)
      ? [`${label} message-key-aware input port requires messageKeys`]
      : [];
  }

  const errors: string[] = [];
  const accepted = policy.accepted ?? [];
  if (accepted.length === 0) {
    errors.push(`${label} messageKeys.accepted must list at least one key`);
  }
  const acceptedSet = new Set(accepted);
  for (const field of messageKeyPolicyFields) {
    for (const key of policy[field] ?? []) {
      if (!acceptedSet.has(key)) {
        errors.push(`${label} messageKeys.${field} key ${key} is not accepted`);
      }
    }
  }
  if (policy.trigger?.includes("set") === true) {
    errors.push(`${label} messageKeys.trigger must not include set`);
  }
  if (policy.emit?.includes("set") === true) {
    errors.push(`${label} messageKeys.emit must not include set`);
  }
  if (
    acceptedSet.has("set") &&
    policy.silent?.includes("set") !== true &&
    policy.store?.includes("set") !== true
  ) {
    errors.push(`${label} messageKeys.set must be silent or store behavior`);
  }

  return errors;
}

function validateObjectTextParseResultV01Semantics(result: ObjectTextParseResultV01): string[] {
  return result.instancePorts.flatMap((port) =>
    messageKeyPolicyErrors(port, `objectText instancePort ${result.className}.${port.id}`)
  );
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
    if (isPayloadIdentityNodeKind(node.kind)) {
      fragmentDiagnostic(
        diagnostics,
        "error",
        "payload-node-kind",
        `node ${node.id} uses payload identity ${node.kind} as an executable kind`,
        { nodes: [node.id] }
      );
    }

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
      if (invalidPortValueType(port.type)) {
        fragmentDiagnostic(
          diagnostics,
          "error",
          "invalid-value-type",
          `port ${node.id}.${port.id} uses invalid value type ${port.type}`,
          { nodes: [node.id] }
        );
      }
      for (const acceptedType of port.accepts ?? []) {
        if (invalidPortValueType(acceptedType)) {
          fragmentDiagnostic(
            diagnostics,
            "error",
            "invalid-value-type",
            `port ${node.id}.${port.id} accepts invalid value type ${acceptedType}`,
            { nodes: [node.id] }
          );
        }
      }
      for (const error of messageKeyPolicyErrors(port, `port ${node.id}.${port.id}`)) {
        fragmentDiagnostic(diagnostics, "error", "message-key-policy", error, { nodes: [node.id] });
      }
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
    if (edge.resolvedType !== undefined && invalidPortValueType(edge.resolvedType)) {
      fragmentDiagnostic(
        diagnostics,
        "error",
        "invalid-value-type",
        `edge ${edge.id} uses invalid resolvedType ${edge.resolvedType}`,
        { edges: [edge.id] }
      );
    }

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

function isImmediateValueCyclePortType(type: string): boolean {
  return type.startsWith("value.core.");
}

function immediateValueCycleTypes(edges: EdgeSpecV01[], ports: Map<string, PortSpecV01>): boolean {
  return edges.every((edge) => {
    const source = ports.get(portSpecKey(edge.source.nodeId, edge.source.portId));
    const target = ports.get(portSpecKey(edge.target.nodeId, edge.target.portId));
    return isImmediateValueCyclePortType(source?.type ?? "") && isImmediateValueCyclePortType(target?.type ?? "");
  });
}

function classifyCycle(
  nodes: string[],
  edges: EdgeSpecV01[],
  ports: Map<string, PortSpecV01>
): GraphCycleValidationV01 {
  const feedback = edges.find((edge) => edge.feedback?.enabled === true);
  if (!feedback) {
    const classification = immediateValueCycleTypes(edges, ports)
      ? "ambiguous-algebraic-loop"
      : "invalid-cycle";
    return {
      classification,
      nodes,
      edges: edges.map((edge) => edge.id),
      message: classification === "ambiguous-algebraic-loop"
        ? "immediate value cycle requires explicit latch, delay, or feedback policy"
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

  if (isPayloadIdentityNodeKind(definition.id)) {
    errors.push(`payload identity node definition id: ${definition.id}`);
  }

  for (const port of definition.ports) {
    if (invalidPortValueType(port.type)) {
      errors.push(`invalid value type on ${definition.id}.${port.id}: ${port.type}`);
    }
      for (const acceptedType of port.accepts ?? []) {
        if (invalidPortValueType(acceptedType)) {
          errors.push(`invalid accepted value type on ${definition.id}.${port.id}: ${acceptedType}`);
        }
      }
      errors.push(...messageKeyPolicyErrors(port, `port ${definition.id}.${port.id}`));
  }

  for (const group of definition.portGroups ?? []) {
    if (invalidPortValueType(group.type)) {
      errors.push(`invalid port group type on ${definition.id}.${group.id}: ${group.type}`);
    }
    if (invalidPortValueType(group.defaultPortSpec?.type ?? "")) {
      errors.push(`invalid default value type on ${definition.id}.${group.id}: ${group.defaultPortSpec?.type}`);
    }
    for (const acceptedType of group.defaultPortSpec?.accepts ?? []) {
      if (invalidPortValueType(acceptedType)) {
        errors.push(`invalid default accepted value type on ${definition.id}.${group.id}: ${acceptedType}`);
      }
    }
    if (group.defaultPortSpec) {
      errors.push(...messageKeyPolicyErrors(group.defaultPortSpec, `port group ${definition.id}.${group.id} defaultPortSpec`));
    }
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
    if (isPayloadIdentityNodeKind(node.kind)) {
      diagnostic(
        diagnostics,
        "error",
        "payload-node-kind",
        `node ${node.id} uses payload identity ${node.kind} as an executable kind`,
        { nodes: [node.id] }
      );
    }

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
      if (invalidPortValueType(port.type)) {
        diagnostic(
          diagnostics,
          "error",
          "invalid-value-type",
          `port ${node.id}.${port.id} uses invalid value type ${port.type}`,
          { nodes: [node.id] }
        );
      }
      for (const acceptedType of port.accepts ?? []) {
        if (invalidPortValueType(acceptedType)) {
          diagnostic(
            diagnostics,
            "error",
            "invalid-value-type",
            `port ${node.id}.${port.id} accepts invalid value type ${acceptedType}`,
            { nodes: [node.id] }
          );
        }
      }
      for (const error of messageKeyPolicyErrors(port, `port ${node.id}.${port.id}`)) {
        diagnostic(diagnostics, "error", "message-key-policy", error, { nodes: [node.id] });
      }
      const key = portSpecKey(node.id, port.id);
      ports.set(key, port);
      incoming.set(key, []);
      outgoing.set(key, []);
    }

    for (const group of node.portGroups ?? []) {
      if (invalidPortValueType(group.type)) {
        diagnostic(
          diagnostics,
          "error",
          "invalid-value-type",
          `port group ${node.id}.${group.id} uses invalid value type ${group.type}`,
          { nodes: [node.id] }
        );
      }
      if (invalidPortValueType(group.defaultPortSpec?.type ?? "")) {
        diagnostic(
          diagnostics,
          "error",
          "invalid-value-type",
          `port group ${node.id}.${group.id} default port uses invalid value type ${group.defaultPortSpec?.type}`,
          { nodes: [node.id] }
        );
      }
      for (const acceptedType of group.defaultPortSpec?.accepts ?? []) {
        if (invalidPortValueType(acceptedType)) {
          diagnostic(
            diagnostics,
            "error",
            "invalid-value-type",
            `port group ${node.id}.${group.id} default port accepts invalid value type ${acceptedType}`,
            { nodes: [node.id] }
          );
        }
      }
      if (group.defaultPortSpec) {
        for (const error of messageKeyPolicyErrors(group.defaultPortSpec, `port group ${node.id}.${group.id} defaultPortSpec`)) {
          diagnostic(diagnostics, "error", "message-key-policy", error, { nodes: [node.id] });
        }
      }
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
    if (edge.resolvedType !== undefined && invalidPortValueType(edge.resolvedType)) {
      diagnostic(
        diagnostics,
        "error",
        "invalid-value-type",
        `edge ${edge.id} uses invalid resolvedType ${edge.resolvedType}`,
        { edges: [edge.id] }
      );
    }

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

export function validateMessageValue(document: unknown): ValidationResult<MessageValueV01> {
  if (!messageValueV01Validator(document)) {
    return { ok: false, errors: schemaErrors(messageValueV01Validator.errors as ErrorObject[]) };
  }

  return { ok: true, value: document as MessageValueV01 };
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

  const result = document as ObjectTextParseResultV01;
  const errors = validateObjectTextParseResultV01Semantics(result);
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value: result };
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

export function validatePackageListingV01(
  document: unknown
): ValidationResult<PackageListingV01> {
  if (!packageListingV01Validator(document)) {
    return { ok: false, errors: schemaErrors(packageListingV01Validator.errors as ErrorObject[]) };
  }

  const listing = document as PackageListingV01;
  const errors = validatePackageListingV01Semantics(listing);
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value: listing };
}

export function validatePackageDiscoveryResponseV01(
  document: unknown
): ValidationResult<PackageDiscoveryResponseV01> {
  if (!packageDiscoveryV01Validator(document)) {
    return { ok: false, errors: schemaErrors(packageDiscoveryV01Validator.errors as ErrorObject[]) };
  }

  const response = document as PackageDiscoveryResponseV01;
  const errors = validatePackageDiscoveryResponseV01Semantics(response);
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value: response };
}

export function validatePackageInstallPlanRequestV01(
  document: unknown
): ValidationResult<PackageInstallPlanRequestV01> {
  const preSchemaErrors = validatePackageInstallPlanRequestPreSchemaSemantics(document);
  if (preSchemaErrors.length > 0) {
    return { ok: false, errors: preSchemaErrors };
  }

  if (!packageInstallPlanRequestV01Validator(document)) {
    return { ok: false, errors: schemaErrors(packageInstallPlanRequestV01Validator.errors as ErrorObject[]) };
  }

  const request = document as PackageInstallPlanRequestV01;
  const errors = validatePackageInstallPlanRequestV01Semantics(request);
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value: request };
}

export function validatePackageInstallPlanResponseV01(
  document: unknown
): ValidationResult<PackageInstallPlanResponseV01> {
  const preSchemaErrors = validatePackageInstallPlanResponsePreSchemaSemantics(document);
  if (preSchemaErrors.length > 0) {
    return { ok: false, errors: preSchemaErrors };
  }

  if (!packageInstallPlanResponseV01Validator(document)) {
    return { ok: false, errors: schemaErrors(packageInstallPlanResponseV01Validator.errors as ErrorObject[]) };
  }

  const response = document as PackageInstallPlanResponseV01;
  const errors = validatePackageInstallPlanResponseV01Semantics(response);
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value: response };
}

export function isPackageListingV01(document: unknown): document is PackageListingV01 {
  return validatePackageListingV01(document).ok;
}

export function isPackageDiscoveryResponseV01(
  document: unknown
): document is PackageDiscoveryResponseV01 {
  return validatePackageDiscoveryResponseV01(document).ok;
}

export function isPackageInstallPlanRequestV01(
  document: unknown
): document is PackageInstallPlanRequestV01 {
  return validatePackageInstallPlanRequestV01(document).ok;
}

export function isPackageInstallPlanResponseV01(
  document: unknown
): document is PackageInstallPlanResponseV01 {
  return validatePackageInstallPlanResponseV01(document).ok;
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

export function validatePasteGraphFragmentRequest(
  document: unknown
): ValidationResult<PasteGraphFragmentRequest> {
  const errors: string[] = [];

  if (!isRecord(document)) {
    return { ok: false, errors: ["/ must be object"] };
  }

  const target = document.target;
  if (!isRecord(target)) {
    errors.push("/target must be object");
  } else {
    if (!isGraphTargetPath(target.path)) {
      errors.push("/target/path must be a supported graph target path");
    }
    if (typeof target.baseRevision !== "string" || target.baseRevision.length === 0) {
      errors.push("/target/baseRevision must be a non-empty string");
    }
    if (
      target.targetRevision !== undefined &&
      (typeof target.targetRevision !== "string" || target.targetRevision.length === 0)
    ) {
      errors.push("/target/targetRevision must be a non-empty string when present");
    }
  }

  if (
    document.placement !== undefined &&
    !(
      isRecord(document.placement) &&
      (
        (document.placement.kind === "position" &&
          typeof document.placement.x === "number" &&
          typeof document.placement.y === "number") ||
        (document.placement.kind === "anchor" &&
          typeof document.placement.nodeId === "string" &&
          (document.placement.offsetX === undefined || typeof document.placement.offsetX === "number") &&
          (document.placement.offsetY === undefined || typeof document.placement.offsetY === "number"))
      )
    )
  ) {
    errors.push("/placement must be a supported paste placement");
  }

  const options = document.options;
  if (
    options !== undefined &&
    !(
      isRecord(options) &&
      (options.outsideEndpointPolicy === undefined ||
        options.outsideEndpointPolicy === "reject" ||
        options.outsideEndpointPolicy === "omit") &&
      (options.idConflictPolicy === undefined ||
        options.idConflictPolicy === "remap" ||
        options.idConflictPolicy === "reject") &&
      (options.interfaceIncidentEdgePolicy === undefined ||
        options.interfaceIncidentEdgePolicy === "drop" ||
        options.interfaceIncidentEdgePolicy === "preserve-diagnostic" ||
        options.interfaceIncidentEdgePolicy === "reject") &&
      (options.preserveRelativePositions === undefined ||
        typeof options.preserveRelativePositions === "boolean")
    )
  ) {
    errors.push("/options must be supported paste graph fragment options");
  }

  const outsideEndpointPolicy = isRecord(options) &&
    (options.outsideEndpointPolicy === "reject" || options.outsideEndpointPolicy === "omit")
    ? options.outsideEndpointPolicy
    : undefined;
  const fragmentResult = validateGraphFragmentV01(document.fragment, { outsideEndpointPolicy });
  if (!fragmentResult.ok) {
    errors.push(...fragmentResult.errors);
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value: document as unknown as PasteGraphFragmentRequest };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isGraphTargetPath(path: unknown): boolean {
  if (!isRecord(path)) {
    return false;
  }
  if (path.kind === "root") {
    return Object.keys(path).length === 1;
  }
  if (path.kind === "project-patch-definition") {
    return typeof path.patchId === "string" && path.patchId.length > 0;
  }
  if (path.kind === "package-patch-definition") {
    return (
      typeof path.packageId === "string" &&
      path.packageId.length > 0 &&
      typeof path.patchId === "string" &&
      path.patchId.length > 0 &&
      (path.version === undefined || typeof path.version === "string")
    );
  }
  if (path.kind === "embedded-patch-instance") {
    return (
      Array.isArray(path.ownerPath) &&
      path.ownerPath.every((entry) => typeof entry === "string") &&
      typeof path.nodeId === "string" &&
      path.nodeId.length > 0
    );
  }
  if (path.kind === "help-working-copy") {
    return (
      typeof path.workingCopyId === "string" &&
      path.workingCopyId.length > 0 &&
      (path.sourcePackageId === undefined || typeof path.sourcePackageId === "string") &&
      (path.sourcePatchId === undefined || typeof path.sourcePatchId === "string")
    );
  }
  return false;
}
