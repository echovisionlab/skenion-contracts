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
  nodeCatalogV01Schema,
  nodeDefinitionV01Schema,
  objectSpecParseResultV01Schema,
  packageDiscoveryV01Schema,
  packageInstallPlanRequestV01Schema,
  packageInstallPlanResponseV01Schema,
  packageListingV01Schema,
  packageManifestV01Schema,
  projectV01Schema,
  runtimeSessionLoadRequestV01Schema,
  shaderInterfaceV01Schema,
  viewStateV01Schema
} from "./generated/schemas.js";
import {
  computeNodeCatalogRevisionV01,
  projectPatchNodeDefinitionIdV01
} from "./nodeCatalog.js";
import { derivePatchContractV01 } from "./project.js";
import type {
  CompatibilityMatrixV01,
  MessageValueV01,
  EdgeSpecV01,
  ExtensionManifestV01,
  GraphCycleValidationV01,
  GraphDocumentV01,
  GraphFragmentIssueV01,
  GraphFragmentValidationOptionsV01,
  GraphFragmentValidationResultV01,
  GraphFragmentV01,
  GraphValidationIssueV01,
  GraphValidationResultV01,
  EndpointBindingValueFormatV01,
  NodeCatalogIssueTargetV01,
  NodeCatalogIssueV01,
  NodeCatalogSnapshotV01,
  NodeDefinitionManifestV01,
  ObjectProviderRefV01,
  ObjectSpecParseResultV01,
  PackageDiscoveryResponseV01,
  PackageInstallPlanRequestV01,
  PackageInstallPlanResponseV01,
  PackageInstallPlanTargetV01,
  PackageListingV01,
  PackageManifestV01,
  PackageRootDocumentV01,
  PatchDefinitionV01,
  PasteGraphFragmentRequest,
  PortConnectionPolicyV01,
  PortSpecV01,
  ProjectDocumentV01,
  ProjectPackageLockEntryV01,
  RuntimeSessionLoadRequestV01,
  ValueFormatV01,
  ValueOccurrenceHeaderV01,
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
ajv.addSchema(runtimeSessionLoadRequestV01Schema);
ajv.addSchema(nodeDefinitionV01Schema);
const graphV01Validator = ajv.compile(graphV01Schema);
const graphFragmentV01Validator = ajv.compile(graphFragmentV01Schema);
const messageValueV01Validator = ajv.compile(messageValueV01Schema);
const objectSpecParseResultV01Validator = ajv.compile(objectSpecParseResultV01Schema);
const nodeDefinitionV01Validator = ajv.compile(nodeDefinitionV01Schema);
const nodeCatalogV01Validator = ajv.compile(nodeCatalogV01Schema);
const shaderInterfaceV01Validator = ajv.compile(shaderInterfaceV01Schema);
const viewStateV01Validator = ajv.compile(viewStateV01Schema);
const projectV01Validator = ajv.compile(projectV01Schema);
const runtimeSessionLoadRequestV01Validator = ajv.compile(runtimeSessionLoadRequestV01Schema);
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

function isBlank(value: string): boolean {
  return value.trim().length === 0;
}

function packageObjectExportErrors(
  objects: Array<{
    objectId: string;
    primaryObjectSpec: string;
    aliases?: string[];
    definitionPath?: string;
    helpId?: string;
  }>,
  packageId: string,
  label: string
): string[] {
  const errors: string[] = [];
  const specToObjectId = new Map<string, string>();

  errors.push(
    ...duplicateErrors(
      objects.map((object) => `${packageId}/${object.objectId}`),
      `${label} provider/objectId`
    )
  );

  for (const object of objects) {
    if (isPayloadIdentityNodeKind(object.objectId)) {
      errors.push(`${label} object ${object.objectId} uses payload/value identity as an executable object`);
    }
    if (isBlank(object.primaryObjectSpec)) {
      errors.push(`${label} object ${object.objectId} primaryObjectSpec must not be blank`);
    }

    for (const spec of [object.primaryObjectSpec, ...(object.aliases ?? [])]) {
      if (isBlank(spec)) {
        errors.push(`${label} object ${object.objectId} alias/spec must not be blank`);
        continue;
      }
      const previousObjectId = specToObjectId.get(spec);
      if (previousObjectId !== undefined) {
        errors.push(
          `${label} duplicate object spec ${JSON.stringify(spec)} for ${previousObjectId} and ${object.objectId}`
        );
      } else {
        specToObjectId.set(spec, object.objectId);
      }
    }
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
  return result.issues
    .filter((issue) => issue.severity === "error")
    .map((issue) => `${label} ${issue.code}: ${issue.message}`);
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
  errors.push(...packageObjectExportErrors(manifest.provides.objects ?? [], manifest.id, "provided object"));

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
  errors.push(...packageObjectExportErrors(listing.provides.objects ?? [], listing.packageId, "provided object"));
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

function compareUnicodeCodePoint(left: string, right: string): number {
  const leftCodePoints = Array.from(left);
  const rightCodePoints = Array.from(right);
  const count = Math.min(leftCodePoints.length, rightCodePoints.length);

  for (let index = 0; index < count; index += 1) {
    const leftCodePoint = leftCodePoints[index].codePointAt(0) as number;
    const rightCodePoint = rightCodePoints[index].codePointAt(0) as number;
    if (leftCodePoint !== rightCodePoint) {
      return leftCodePoint - rightCodePoint;
    }
  }

  return leftCodePoints.length - rightCodePoints.length;
}

function sortedErrors(values: string[], label: string): string[] {
  const sorted = [...values].sort(compareUnicodeCodePoint);
  return values.every((value, index) => value === sorted[index])
    ? []
    : [`${label} must be sorted by Unicode code point`];
}

function checksumEquals(left: { algorithm: string; value: string }, right: { algorithm: string; value: string }): boolean {
  return left.algorithm === right.algorithm && left.value === right.value;
}

function validateNodeCatalogIssueTargetV01(
  target: NodeCatalogIssueTargetV01,
  entryIds: ReadonlySet<string>,
  label: string
): string[] {
  if (target.kind === "catalog") {
    return [];
  }
  if (target.kind === "entry" && !entryIds.has(target.catalogId)) {
    return [`${label} references missing entry catalogId: ${target.catalogId}`];
  }
  return [];
}

function validateNodeCatalogIssueV01Semantics(
  issue: NodeCatalogIssueV01,
  entryIds: ReadonlySet<string>,
  label: string
): string[] {
  const errors = validateNodeCatalogIssueTargetV01(
    issue.target,
    entryIds,
    `${label} target`
  );
  if (issue.severity === "error") {
    errors.push(`${label} must not use error severity in a valid catalog snapshot`);
  }
  return errors;
}

function providerKey(provider: ObjectProviderRefV01): string {
  if (provider.kind === "core") {
    return "core";
  }
  if (provider.kind === "projectPatch") {
    return `projectPatch:${provider.patchId}`;
  }
  return `package:${provider.packageId}:${provider.lockEntryId ?? ""}`;
}

function validateNodeCatalogObjectSpecV01Semantics(
  primaryObjectSpec: string,
  aliases: string[] | undefined,
  label: string,
  objectSpecOwners: Map<string, string>,
  primaryObjectSpecs: Set<string>
): string[] {
  const errors: string[] = [];
  if (primaryObjectSpecs.has(primaryObjectSpec)) {
    errors.push(`duplicate primaryObjectSpec: ${primaryObjectSpec}`);
  }
  primaryObjectSpecs.add(primaryObjectSpec);

  const existingCanonicalOwner = objectSpecOwners.get(primaryObjectSpec);
  if (existingCanonicalOwner !== undefined) {
    errors.push(`${label} primaryObjectSpec collides with ${existingCanonicalOwner}: ${primaryObjectSpec}`);
  } else {
    objectSpecOwners.set(primaryObjectSpec, `${label} primaryObjectSpec`);
  }

  if (aliases === undefined) {
    return errors;
  }

  errors.push(...sortedErrors(aliases, `${label} aliases`));
  errors.push(...duplicateErrors(aliases, `${label} alias`));

  for (const alias of aliases) {
    const owner = objectSpecOwners.get(alias);
    if (owner !== undefined) {
      errors.push(`${label} alias collides with ${owner}: ${alias}`);
    } else {
      objectSpecOwners.set(alias, `${label} alias`);
    }
  }

  return errors;
}

function validateNodeCatalogSnapshotV01Semantics(snapshot: NodeCatalogSnapshotV01): string[] {
  const errors: string[] = [];
  const entryIds = new Set(snapshot.entries.map((entry) => entry.catalogId));

  errors.push(...duplicateErrors(snapshot.entries.map((entry) => entry.catalogId), "catalogId"));
  errors.push(...sortedErrors(snapshot.entries.map((entry) => entry.catalogId), "catalog entries"));
  errors.push(...duplicateErrors(
    snapshot.entries.map((entry) => `${entry.definition.id}@${entry.definition.version}`),
    "node definition id/version"
  ));

  const objectSpecOwners = new Map<string, string>();
  const primaryObjectSpecs = new Set<string>();
  const implementationIds = new Set<string>();

  for (const entry of snapshot.entries) {
    const definitionResult = validateNodeDefinitionV01(entry.definition);
    if (!definitionResult.ok) {
      errors.push(
        ...definitionResult.errors.map((error) => `catalog entry ${entry.catalogId} definition: ${error}`)
      );
    }

    const implementationId = `${providerKey(entry.provider)}:${entry.objectId}`;
    if (implementationIds.has(implementationId)) {
      errors.push(`duplicate catalog implementation: ${implementationId}`);
    }
    implementationIds.add(implementationId);

    errors.push(...validateNodeCatalogObjectSpecV01Semantics(
      entry.primaryObjectSpec,
      entry.aliases,
      `catalog entry ${entry.catalogId}`,
      objectSpecOwners,
      primaryObjectSpecs
    ));

    for (const issue of entry.issues ?? []) {
      errors.push(...validateNodeCatalogIssueV01Semantics(
        issue,
        entryIds,
        `catalog entry ${entry.catalogId} issue`
      ));
    }

    if (entry.provider.kind === "projectPatch" && entry.provider.interfaceDigest !== undefined) {
      const expectedDefinitionId = projectPatchNodeDefinitionIdV01(
        entry.provider.patchId,
        entry.provider.interfaceDigest
      );
      if (entry.definition.id !== expectedDefinitionId) {
        errors.push(
          `projectPatch catalog entry ${entry.catalogId} definition.id must be ${expectedDefinitionId}`
        );
      }
    }
  }

  for (const [index, issue] of (snapshot.issues ?? []).entries()) {
    errors.push(...validateNodeCatalogIssueV01Semantics(
      issue,
      entryIds,
      `catalog issue ${index}`
    ));
  }

  const expectedRevision = computeNodeCatalogRevisionV01(snapshot);
  if (!checksumEquals(snapshot.catalogRevision, expectedRevision)) {
    errors.push(`catalogRevision mismatch: expected ${expectedRevision.value}`);
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
    issues?: unknown;
  };
  if (response.schema !== "skenion.package.install-plan.response") {
    return [];
  }

  const errors: string[] = [];
  const checks = Array.isArray(response.checks) ? response.checks : [];
  const actions = Array.isArray(response.actions) ? response.actions : [];
  const issues = Array.isArray(response.issues) ? response.issues : [];

  for (const check of checks) {
    if (check === null || typeof check !== "object") {
      continue;
    }
    const issueRefs = (check as { issueRefs?: unknown }).issueRefs;
    if (
      (check as { status?: unknown }).status === "fail" &&
      (!Array.isArray(issueRefs) || issueRefs.length === 0)
    ) {
      errors.push(`package install plan failing check ${(check as { kind?: unknown }).kind} requires issueRefs`);
    }
  }

  for (const action of actions) {
    if (action === null || typeof action !== "object") {
      continue;
    }
    const issueRefs = (action as { issueRefs?: unknown }).issueRefs;
    if (
      (action as { kind?: unknown }).kind === "reject" &&
      (!Array.isArray(issueRefs) || issueRefs.length === 0)
    ) {
      errors.push(`package install plan reject action ${(action as { id?: unknown }).id} requires issueRefs`);
    }
  }

  const hasFailedCheck = checks.some((check) => {
    return check !== null && typeof check === "object" && (check as { status?: unknown }).status === "fail";
  });
  const hasRejectAction = actions.some((action) => {
    return action !== null && typeof action === "object" && (action as { kind?: unknown }).kind === "reject";
  });
  const hasErrorIssue = issues.some((issue) => {
    return issue !== null && typeof issue === "object" && (issue as { severity?: unknown }).severity === "error";
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
    if (!hasErrorIssue) {
      errors.push("failed package install plan response requires an error issue");
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
    const provider = binding.implementation?.provider;
    if (provider?.kind === "package") {
      if (provider.lockEntryId === undefined) {
        errors.push(`package install plan object binding ${binding.id} package implementation requires lockEntryId`);
      } else if (!packageLockIds.has(provider.lockEntryId)) {
        errors.push(`package install plan object binding ${binding.id} references missing lockEntryId: ${provider.lockEntryId}`);
      }
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
  errors.push(...duplicateErrors(response.issues.map((issue) => issue.id), "package install plan issue id"));

  const issueIds = new Set(response.issues.map((issue) => issue.id));
  for (const check of response.checks) {
    for (const issueRef of check.issueRefs ?? []) {
      if (!issueIds.has(issueRef)) {
        errors.push(`package install plan check ${check.kind} references missing issue ${issueRef}`);
      }
    }
  }

  for (const [index, action] of response.actions.entries()) {
    if (action.order !== index) {
      errors.push(`package install plan action ${action.id} order must be ${index}`);
    }

    for (const issueRef of action.issueRefs ?? []) {
      if (!issueIds.has(issueRef)) {
        errors.push(`package install plan action ${action.id} references missing issue ${issueRef}`);
      }
    }

    for (const capabilityChange of action.capabilityChanges ?? []) {
      if (capabilityChange.issueRef !== undefined && !issueIds.has(capabilityChange.issueRef)) {
        errors.push(
          `package install plan action ${action.id} capability change references missing issue ${capabilityChange.issueRef}`
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
    const implementation = binding.implementation;
    if (implementation?.provider.kind === "projectPatch") {
      const target = implementation.provider;
      const patch = patchById.get(target.patchId);
      if (!patch) {
        if (binding.status === "resolved") {
          errors.push(`resolved object binding ${binding.id} references missing project patch: ${target.patchId}`);
        } else if (
          binding.status !== "error" ||
          !bindingHasIssue(binding, new Set(["implementation-missing"]))
        ) {
          errors.push(`object binding ${binding.id} references missing project patch: ${target.patchId} without error issue`);
        }
        continue;
      }
      if (patch && target.revision !== undefined && target.revision !== patch.revision) {
        if (binding.status === "resolved") {
          errors.push(`resolved object binding ${binding.id} project patch ${target.patchId} revision is stale`);
        } else if (
          binding.status !== "error" ||
          !bindingHasIssue(binding, new Set(["implementation-stale", "interface-drift"]))
        ) {
          errors.push(`object binding ${binding.id} project patch ${target.patchId} revision is stale without issues`);
        }
      }
      continue;
    }

    if (implementation?.provider.kind !== "package") {
      continue;
    }

    const providerRef = implementation.provider;
    if (providerRef.lockEntryId === undefined) {
      errors.push(`object binding ${binding.id} package implementation requires lockEntryId`);
      continue;
    }
    const lockEntry = packageLockById.get(providerRef.lockEntryId);
    if (!lockEntry) {
      if (binding.status === "resolved") {
        errors.push(`resolved object binding ${binding.id} references missing lockEntryId: ${providerRef.lockEntryId}`);
      } else if (
        binding.status !== "error" ||
        !bindingHasIssue(binding, new Set(["implementation-missing"]))
      ) {
        errors.push(`object binding ${binding.id} references missing lockEntryId: ${providerRef.lockEntryId} without error issue`);
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

function issue(
  issues: GraphValidationIssueV01[],
  severity: GraphValidationIssueV01["severity"],
  code: string,
  message: string,
  refs: Pick<GraphValidationIssueV01, "nodes" | "edges"> = {}
): void {
  issues.push({ severity, code, message, ...refs });
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

function portTypePolicyV01(source: PortSpecV01, target: PortSpecV01): PortConnectionPolicyV01 {
  if (source.type === target.type) {
    return { accepted: true, reason: "type-match", effectiveType: source.type };
  }
  if (target.type === "value.core.message" && isMessageValuePortType(source.type)) {
    return { accepted: true, reason: "message-selector", effectiveType: source.type };
  }
  if (target.accepts?.includes(source.type) === true) {
    return { accepted: true, reason: "target-accepts", effectiveType: source.type };
  }
  return { accepted: false, reason: "incompatible-type" };
}

export function portTypeAcceptsV01(source: PortSpecV01, target: PortSpecV01): boolean {
  return portTypePolicyV01(source, target).accepted;
}

export function portConnectionPolicyV01(source: PortSpecV01, target: PortSpecV01): PortConnectionPolicyV01 {
  if (source.direction !== "output" || target.direction !== "input") {
    return { accepted: false, reason: "direction-mismatch" };
  }
  return portTypePolicyV01(source, target);
}

export function isMessageValuePortTypeV01(type: string): boolean {
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

function isMessageValuePortType(type: string): boolean {
  return isMessageValuePortTypeV01(type);
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
  "value.object.core",
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

const valueTypeIdPattern = /^value\.[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)+$/;
const sha256Pattern = /^[a-fA-F0-9]{64}$/;
const firstPartyRepresentations = new Set([
  "f64",
  "f32",
  "f16",
  "f8.e4m3",
  "f8.e5m2",
  "ufloat64",
  "ufloat32",
  "ufloat16",
  "ufloat8",
  "i64",
  "i32",
  "i16",
  "i8",
  "u64",
  "u32",
  "u16",
  "u8",
  "rgba32f",
  "rgba16f",
  "rgba8unorm",
  "rgb8unorm"
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isReservedValueTypeIdV01(type: string): boolean {
  return type.startsWith("value.core.") || type.startsWith("value.media.");
}

export function isValidCustomValueTypeIdV01(type: string): boolean {
  return valueTypeIdPattern.test(type) && !isReservedValueTypeIdV01(type) && !invalidValueTypeIds.has(type);
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function hasOnlyKeys(value: Record<string, unknown>, allowedKeys: Set<string>, label: string): string[] {
  return Object.keys(value)
    .filter((key) => !allowedKeys.has(key))
    .map((key) => `${label}.${key} is not allowed`);
}

function validateOptionalPositiveInteger(
  errors: string[],
  value: Record<string, unknown>,
  key: string,
  label: string
): void {
  if (value[key] !== undefined && !isPositiveInteger(value[key])) {
    errors.push(`${label}.${key} must be a positive integer`);
  }
}

function validateOptionalNonNegativeInteger(
  errors: string[],
  value: Record<string, unknown>,
  key: string,
  label: string
): void {
  if (value[key] !== undefined && !isNonNegativeInteger(value[key])) {
    errors.push(`${label}.${key} must be a non-negative integer`);
  }
}

function validateOptionalFiniteNumber(
  errors: string[],
  value: Record<string, unknown>,
  key: string,
  label: string
): void {
  if (value[key] !== undefined && !isFiniteNumber(value[key])) {
    errors.push(`${label}.${key} must be a finite number`);
  }
}

function validateShapeArray(errors: string[], value: unknown, label: string): void {
  if (!Array.isArray(value) || value.length === 0) {
    errors.push(`${label} must be a non-empty array of positive integers`);
    return;
  }
  for (const [index, dimension] of value.entries()) {
    if (!isPositiveInteger(dimension)) {
      errors.push(`${label}[${index}] must be a positive integer`);
    }
  }
}

function validateEndpointRef(errors: string[], value: unknown, label: string): void {
  if (!isRecord(value)) {
    errors.push(`${label} must be an object`);
    return;
  }
  errors.push(...hasOnlyKeys(value, new Set(["nodeId", "portId"]), label));
  if (typeof value.nodeId !== "string" || value.nodeId.length === 0) {
    errors.push(`${label}.nodeId must be a non-empty string`);
  }
  if (typeof value.portId !== "string" || value.portId.length === 0) {
    errors.push(`${label}.portId must be a non-empty string`);
  }
}

function isValidValueTypeId(value: string): boolean {
  if (invalidValueTypeIds.has(value)) {
    return false;
  }
  if (firstPartyValueTypeIds.has(value)) {
    return true;
  }
  if (value.startsWith("value.core.") || value.startsWith("value.media.")) {
    return false;
  }
  return valueTypeIdPattern.test(value);
}

function expectedFormatForFirstPartyValueType(valueTypeId: string): Set<string> | null {
  if (valueTypeId === "value.core.float8") {
    return new Set(["f8.e4m3", "f8.e5m2"]);
  }
  if (valueTypeId === "value.core.float16") {
    return new Set(["f16"]);
  }
  if (valueTypeId === "value.core.float32") {
    return new Set(["f32"]);
  }
  if (valueTypeId === "value.core.float64") {
    return new Set(["f64"]);
  }
  if (valueTypeId === "value.core.ufloat8") {
    return new Set(["ufloat8"]);
  }
  if (valueTypeId === "value.core.ufloat16") {
    return new Set(["ufloat16"]);
  }
  if (valueTypeId === "value.core.ufloat32") {
    return new Set(["ufloat32"]);
  }
  if (valueTypeId === "value.core.ufloat64") {
    return new Set(["ufloat64"]);
  }
  if (valueTypeId === "value.core.int8") {
    return new Set(["i8"]);
  }
  if (valueTypeId === "value.core.int16") {
    return new Set(["i16"]);
  }
  if (valueTypeId === "value.core.int32") {
    return new Set(["i32"]);
  }
  if (valueTypeId === "value.core.int64") {
    return new Set(["i64"]);
  }
  if (valueTypeId === "value.core.uint8") {
    return new Set(["u8"]);
  }
  if (valueTypeId === "value.core.uint16") {
    return new Set(["u16"]);
  }
  if (valueTypeId === "value.core.uint32") {
    return new Set(["u32"]);
  }
  if (valueTypeId === "value.core.uint64") {
    return new Set(["u64"]);
  }
  if (valueTypeId === "value.core.color") {
    return new Set(["rgba32f", "rgba16f", "rgba8unorm", "rgb8unorm"]);
  }
  if (["value.core.vector", "value.core.matrix", "value.core.tensor"].includes(valueTypeId)) {
    return firstPartyRepresentations;
  }
  return null;
}

function validateValueFormatErrors(valueFormat: unknown, label = "valueFormat"): string[] {
  if (!isRecord(valueFormat)) {
    return [`${label} must be an object`];
  }

  const allowedKeys = new Set([
    "valueTypeId",
    "format",
    "shape",
    "dynamicShape",
    "layout",
    "strides",
    "byteLength",
    "sampleRate",
    "channels",
    "channelLayout",
    "colorSpace",
    "colorRange",
    "transfer",
    "primaries",
    "alphaPolicy",
    "resourceKind"
  ]);
  const errors = hasOnlyKeys(valueFormat, allowedKeys, label);
  const valueTypeId = valueFormat.valueTypeId;

  if (typeof valueTypeId !== "string" || valueTypeId.length === 0) {
    errors.push(`${label}.valueTypeId must be a non-empty string`);
  } else if (!isValidValueTypeId(valueTypeId)) {
    errors.push(`${label}.valueTypeId is not a valid value type id: ${valueTypeId}`);
  }

  if (valueFormat.format !== undefined && typeof valueFormat.format !== "string") {
    errors.push(`${label}.format must be a string`);
  }
  if (typeof valueTypeId === "string" && typeof valueFormat.format === "string") {
    const expectedFormats = expectedFormatForFirstPartyValueType(valueTypeId);
    if (expectedFormats && !expectedFormats.has(valueFormat.format)) {
      errors.push(`${label}.format ${valueFormat.format} is not valid for ${valueTypeId}`);
    }
  }

  if (valueFormat.shape !== undefined) {
    validateShapeArray(errors, valueFormat.shape, `${label}.shape`);
  }
  if (["value.core.vector", "value.core.matrix", "value.core.tensor"].includes(String(valueTypeId))) {
    if (valueFormat.shape === undefined) {
      errors.push(`${label}.shape is required for ${valueTypeId}`);
    }
    if (valueFormat.format === undefined) {
      errors.push(`${label}.format is required for ${valueTypeId}`);
    }
  }
  if (valueFormat.strides !== undefined) {
    validateShapeArray(errors, valueFormat.strides, `${label}.strides`);
  }
  validateOptionalPositiveInteger(errors, valueFormat, "byteLength", label);
  validateOptionalPositiveInteger(errors, valueFormat, "channels", label);
  validateOptionalFiniteNumber(errors, valueFormat, "sampleRate", label);
  if (valueFormat.sampleRate !== undefined && isFiniteNumber(valueFormat.sampleRate) && valueFormat.sampleRate <= 0) {
    errors.push(`${label}.sampleRate must be greater than zero`);
  }
  if (valueFormat.dynamicShape !== undefined && typeof valueFormat.dynamicShape !== "boolean") {
    errors.push(`${label}.dynamicShape must be a boolean`);
  }

  for (const key of ["layout", "channelLayout", "colorSpace", "colorRange", "transfer", "primaries", "alphaPolicy", "resourceKind"]) {
    if (valueFormat[key] !== undefined && typeof valueFormat[key] !== "string") {
      errors.push(`${label}.${key} must be a string`);
    }
  }

  if (valueTypeId === "value.core.bang") {
    for (const key of Object.keys(valueFormat)) {
      if (key !== "valueTypeId") {
        errors.push(`${label}.${key} is not allowed for value.core.bang`);
      }
    }
  }

  return errors;
}

function validateEndpointBindingValueFormatErrors(
  bindingFormat: unknown,
  label = "bindingFormat"
): string[] {
  if (!isRecord(bindingFormat)) {
    return [`${label} must be an object`];
  }

  const allowedKeys = new Set([
    "bindingId",
    "bindingEpoch",
    "formatRevision",
    "formatDigest",
    "valueFormat",
    "source",
    "target",
    "delivery"
  ]);
  const errors = hasOnlyKeys(bindingFormat, allowedKeys, label);

  if (typeof bindingFormat.bindingId !== "string" || bindingFormat.bindingId.length === 0) {
    errors.push(`${label}.bindingId must be a non-empty string`);
  }
  validateOptionalPositiveInteger(errors, bindingFormat, "bindingEpoch", label);
  if (bindingFormat.bindingEpoch === undefined) {
    errors.push(`${label}.bindingEpoch is required`);
  }
  validateOptionalPositiveInteger(errors, bindingFormat, "formatRevision", label);
  if (bindingFormat.formatRevision === undefined) {
    errors.push(`${label}.formatRevision is required`);
  }
  if (bindingFormat.formatDigest !== undefined) {
    if (typeof bindingFormat.formatDigest !== "string" || !sha256Pattern.test(bindingFormat.formatDigest)) {
      errors.push(`${label}.formatDigest must be a 64-character sha256 hex string`);
    }
  }
  errors.push(...validateValueFormatErrors(bindingFormat.valueFormat, `${label}.valueFormat`));
  if (bindingFormat.source !== undefined) {
    validateEndpointRef(errors, bindingFormat.source, `${label}.source`);
  }
  if (bindingFormat.target !== undefined) {
    validateEndpointRef(errors, bindingFormat.target, `${label}.target`);
  }
  if (bindingFormat.delivery !== undefined) {
    if (!isRecord(bindingFormat.delivery)) {
      errors.push(`${label}.delivery must be an object`);
    } else {
      const delivery = bindingFormat.delivery;
      errors.push(...hasOnlyKeys(delivery, new Set(["policy", "maxInFlight", "keyframes"]), `${label}.delivery`));
      if (delivery.policy !== undefined && !["ordered", "latest", "ring", "drop"].includes(String(delivery.policy))) {
        errors.push(`${label}.delivery.policy is invalid`);
      }
      validateOptionalPositiveInteger(errors, delivery, "maxInFlight", `${label}.delivery`);
      if (delivery.keyframes !== undefined && typeof delivery.keyframes !== "boolean") {
        errors.push(`${label}.delivery.keyframes must be a boolean`);
      }
    }
  }

  return errors;
}

function validateValueOccurrenceHeaderErrors(
  header: unknown,
  label = "occurrenceHeader"
): string[] {
  if (!isRecord(header)) {
    return [`${label} must be an object`];
  }

  const allowedKeys = new Set([
    "bindingId",
    "bindingEpoch",
    "formatRevision",
    "sequence",
    "clock",
    "timestamp",
    "payloadKind",
    "byteLength",
    "byteOffset",
    "actualShape",
    "flags",
    "droppedBefore",
    "duration"
  ]);
  const errors = hasOnlyKeys(header, allowedKeys, label);

  if (typeof header.bindingId !== "string" || header.bindingId.length === 0) {
    errors.push(`${label}.bindingId must be a non-empty string`);
  }
  validateOptionalPositiveInteger(errors, header, "bindingEpoch", label);
  if (header.bindingEpoch === undefined) {
    errors.push(`${label}.bindingEpoch is required`);
  }
  validateOptionalPositiveInteger(errors, header, "formatRevision", label);
  if (header.formatRevision === undefined) {
    errors.push(`${label}.formatRevision is required`);
  }
  validateOptionalNonNegativeInteger(errors, header, "sequence", label);
  if (header.sequence === undefined) {
    errors.push(`${label}.sequence is required`);
  }
  if (typeof header.payloadKind !== "string" || !["empty", "json", "bytes", "resource-handle"].includes(header.payloadKind)) {
    errors.push(`${label}.payloadKind is invalid`);
  }
  if (header.clock !== undefined && typeof header.clock !== "string") {
    errors.push(`${label}.clock must be a string`);
  }
  validateOptionalFiniteNumber(errors, header, "timestamp", label);
  validateOptionalPositiveInteger(errors, header, "byteLength", label);
  validateOptionalNonNegativeInteger(errors, header, "byteOffset", label);
  if (header.actualShape !== undefined) {
    validateShapeArray(errors, header.actualShape, `${label}.actualShape`);
  }
  if (header.flags !== undefined) {
    if (!Array.isArray(header.flags)) {
      errors.push(`${label}.flags must be an array`);
    } else {
      for (const [index, flag] of header.flags.entries()) {
        if (!["discontinuity", "keyframe", "dropped-before", "end-of-stream"].includes(String(flag))) {
          errors.push(`${label}.flags[${index}] is invalid`);
        }
      }
    }
  }
  validateOptionalNonNegativeInteger(errors, header, "droppedBefore", label);
  validateOptionalFiniteNumber(errors, header, "duration", label);
  if (header.duration !== undefined && isFiniteNumber(header.duration) && header.duration < 0) {
    errors.push(`${label}.duration must be greater than or equal to zero`);
  }

  if (header.payloadKind === "empty") {
    for (const key of ["byteLength", "byteOffset", "actualShape"]) {
      if (header[key] !== undefined) {
        errors.push(`${label}.${key} is not allowed when payloadKind is empty`);
      }
    }
  }

  return errors;
}

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
  if (type.startsWith("value.core.") && !firstPartyValueTypeIds.has(type)) {
    return true;
  }
  if (type.startsWith("value.media.")) {
    return true;
  }
  if (type.startsWith("value.") && !firstPartyValueTypeIds.has(type) && !isValidCustomValueTypeIdV01(type)) {
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
    "object.core.bool",
    "object.core.string",
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

function graphNodeResolutionIssues(
  node: {
    id: string;
    implementation?: { objectId: string };
    objectResolution?: { status: string; issues?: Array<{ code?: string }> };
  }
): GraphValidationIssueV01[] {
  const issues: GraphValidationIssueV01[] = [];
  const objectId = node.implementation?.objectId;
  if (objectId !== undefined && isPayloadIdentityNodeKind(objectId)) {
    issues.push({
      severity: "error",
      code: "payload-implementation-id",
      message: `node ${node.id} uses payload identity ${objectId} as an executable implementation`,
      nodes: [node.id]
    });
  }
  if (node.objectResolution?.status === "unresolved" && node.implementation !== undefined) {
    issues.push({
      severity: "error",
      code: "unresolved-object-has-implementation",
      message: `node ${node.id} has unresolved objectResolution with implementation`,
      nodes: [node.id]
    });
  }
  if (node.objectResolution?.status === "resolved" && node.implementation === undefined) {
    issues.push({
      severity: "error",
      code: "resolved-object-missing-implementation",
      message: `node ${node.id} has resolved objectResolution without implementation`,
      nodes: [node.id]
    });
  }
  if (node.objectResolution?.status === "error") {
    const hasImplementationIssue = (node.objectResolution.issues ?? []).some((issue) =>
      typeof issue.code === "string" && IMPLEMENTATION_ERROR_ISSUE_CODES.has(issue.code)
    );
    if (node.implementation === undefined) {
      issues.push({
        severity: "error",
        code: "error-object-missing-implementation",
        message: `node ${node.id} has error objectResolution without implementation`,
        nodes: [node.id]
      });
    }
    if (!hasImplementationIssue) {
      issues.push({
        severity: "error",
        code: "error-object-missing-issue",
        message: `node ${node.id} has error objectResolution without implementation issue`,
        nodes: [node.id]
      });
    }
  }
  return issues;
}

const IMPLEMENTATION_ERROR_ISSUE_CODES = new Set([
  "implementation-missing",
  "implementation-stale",
  "implementation-lock-mismatch",
  "interface-drift"
]);

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

function validateObjectSpecParseResultV01Semantics(result: ObjectSpecParseResultV01): string[] {
  const errors: string[] = [];
  errors.push(...result.instancePorts.flatMap((port) =>
    messageKeyPolicyErrors(port, `objectSpec instancePort ${result.className}.${port.id}`)
  ));
  return errors;
}

function fragmentIssue(
  issues: GraphFragmentIssueV01[],
  severity: GraphFragmentIssueV01["severity"],
  code: string,
  message: string,
  refs: Pick<GraphFragmentIssueV01, "nodes" | "edges"> = {}
): void {
  issues.push({ severity, code, message, ...refs });
}

function analyzeFragmentSemantics(
  fragment: GraphFragmentV01,
  options: GraphFragmentValidationOptionsV01
): GraphFragmentValidationResultV01 {
  const issues: GraphFragmentIssueV01[] = [];
  const omittedEdgeIds: string[] = [];
  const outsideEndpointPolicy = options.outsideEndpointPolicy ?? "reject";
  const nodeIds = new Set<string>();
  const edgeIds = new Set<string>();
  const ports = new Map<string, PortSpecV01>();

  for (const node of fragment.nodes) {
    if (nodeIds.has(node.id)) {
      fragmentIssue(
        issues,
        "error",
        "duplicate-node-id",
        `duplicate node id: ${node.id}`,
        { nodes: [node.id] }
      );
    }
    nodeIds.add(node.id);
    for (const resolutionIssue of graphNodeResolutionIssues(node)) {
      fragmentIssue(
        issues,
        resolutionIssue.severity,
        resolutionIssue.code,
        resolutionIssue.message,
        { nodes: resolutionIssue.nodes }
      );
    }

    const portIds = new Set<string>();
    for (const port of node.ports) {
      if (portIds.has(port.id)) {
        fragmentIssue(
          issues,
          "error",
          "duplicate-port-id",
          `duplicate port id on ${node.id}: ${port.id}`,
          { nodes: [node.id] }
        );
      }
      portIds.add(port.id);
      if (invalidPortValueType(port.type)) {
        fragmentIssue(
          issues,
          "error",
          "invalid-value-type",
          `port ${node.id}.${port.id} uses invalid value type ${port.type}`,
          { nodes: [node.id] }
        );
      }
      for (const acceptedType of port.accepts ?? []) {
        if (invalidPortValueType(acceptedType)) {
          fragmentIssue(
            issues,
            "error",
            "invalid-value-type",
            `port ${node.id}.${port.id} accepts invalid value type ${acceptedType}`,
            { nodes: [node.id] }
          );
        }
      }
      for (const error of messageKeyPolicyErrors(port, `port ${node.id}.${port.id}`)) {
        fragmentIssue(issues, "error", "message-key-policy", error, { nodes: [node.id] });
      }
      ports.set(portSpecKey(node.id, port.id), port);
    }
  }

  for (const edge of fragment.edges) {
    if (edgeIds.has(edge.id)) {
      fragmentIssue(
        issues,
        "error",
        "duplicate-edge-id",
        `duplicate edge id: ${edge.id}`,
        { edges: [edge.id] }
      );
    }
    edgeIds.add(edge.id);
    if (edge.resolvedType !== undefined && invalidPortValueType(edge.resolvedType)) {
      fragmentIssue(
        issues,
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
      fragmentIssue(
        issues,
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
      fragmentIssue(
        issues,
        "error",
        "missing-source-port",
        `edge ${edge.id} references missing source port ${sourceKey}`,
        { edges: [edge.id] }
      );
    }
    if (!target) {
      fragmentIssue(
        issues,
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
      fragmentIssue(
        issues,
        "error",
        "invalid-source-direction",
        `edge ${edge.id} source ${sourceKey} is not an output port`,
        { edges: [edge.id] }
      );
    }
    if (target.direction !== "input") {
      fragmentIssue(
        issues,
        "error",
        "invalid-target-direction",
        `edge ${edge.id} target ${targetKey} is not an input port`,
        { edges: [edge.id] }
      );
    }
    const connectionPolicy = portConnectionPolicyV01(source, target);
    if (!connectionPolicy.accepted && connectionPolicy.reason !== "direction-mismatch") {
      fragmentIssue(
        issues,
        "error",
        "incompatible-type",
        `edge ${edge.id} cannot connect ${sourceKey} ${source.type} to ${targetKey} ${target.type}: ${connectionPolicy.reason}`,
        { edges: [edge.id] }
      );
    }
  }

  return {
    ok: issues.every((entry) => entry.severity !== "error"),
    issues,
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
  const issues: GraphValidationIssueV01[] = [];
  const cycles: GraphCycleValidationV01[] = [];
  const nodeIds = new Set<string>();
  const ports = new Map<string, PortSpecV01>();
  const incoming = new Map<string, EdgeSpecV01[]>();
  const outgoing = new Map<string, EdgeSpecV01[]>();
  const edgeIds = new Set<string>();
  const edgeKeys = new Set<string>();

  for (const node of graph.nodes) {
    if (nodeIds.has(node.id)) {
      issue(issues, "error", "duplicate-node-id", `duplicate node id: ${node.id}`, { nodes: [node.id] });
    }
    nodeIds.add(node.id);
    issues.push(...graphNodeResolutionIssues(node));

    const portIds = new Set<string>();
    for (const port of node.ports) {
      if (portIds.has(port.id)) {
        issue(
          issues,
          "error",
          "duplicate-port-id",
          `duplicate port id on ${node.id}: ${port.id}`,
          { nodes: [node.id] }
        );
      }
      portIds.add(port.id);
      if (invalidPortValueType(port.type)) {
        issue(
          issues,
          "error",
          "invalid-value-type",
          `port ${node.id}.${port.id} uses invalid value type ${port.type}`,
          { nodes: [node.id] }
        );
      }
      for (const acceptedType of port.accepts ?? []) {
        if (invalidPortValueType(acceptedType)) {
          issue(
            issues,
            "error",
            "invalid-value-type",
            `port ${node.id}.${port.id} accepts invalid value type ${acceptedType}`,
            { nodes: [node.id] }
          );
        }
      }
      for (const error of messageKeyPolicyErrors(port, `port ${node.id}.${port.id}`)) {
        issue(issues, "error", "message-key-policy", error, { nodes: [node.id] });
      }
      const key = portSpecKey(node.id, port.id);
      ports.set(key, port);
      incoming.set(key, []);
      outgoing.set(key, []);
    }

    for (const group of node.portGroups ?? []) {
      if (invalidPortValueType(group.type)) {
        issue(
          issues,
          "error",
          "invalid-value-type",
          `port group ${node.id}.${group.id} uses invalid value type ${group.type}`,
          { nodes: [node.id] }
        );
      }
      if (invalidPortValueType(group.defaultPortSpec?.type ?? "")) {
        issue(
          issues,
          "error",
          "invalid-value-type",
          `port group ${node.id}.${group.id} default port uses invalid value type ${group.defaultPortSpec?.type}`,
          { nodes: [node.id] }
        );
      }
      for (const acceptedType of group.defaultPortSpec?.accepts ?? []) {
        if (invalidPortValueType(acceptedType)) {
          issue(
            issues,
            "error",
            "invalid-value-type",
            `port group ${node.id}.${group.id} default port accepts invalid value type ${acceptedType}`,
            { nodes: [node.id] }
          );
        }
      }
      if (group.defaultPortSpec) {
        for (const error of messageKeyPolicyErrors(group.defaultPortSpec, `port group ${node.id}.${group.id} defaultPortSpec`)) {
          issue(issues, "error", "message-key-policy", error, { nodes: [node.id] });
        }
      }
      if (group.maxPorts !== undefined && group.maxPorts < group.minPorts) {
        issue(
          issues,
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
      issue(issues, "error", "duplicate-edge-id", `duplicate edge id: ${edge.id}`, { edges: [edge.id] });
    }
    edgeIds.add(edge.id);

    const edgeKey = edgeEndpointKey(edge);
    if (edgeKeys.has(edgeKey)) {
      issue(issues, "error", "duplicate-edge", `duplicate edge endpoints: ${edgeKey}`, { edges: [edge.id] });
    }
    edgeKeys.add(edgeKey);

    const sourceKey = portSpecKey(edge.source.nodeId, edge.source.portId);
    const targetKey = portSpecKey(edge.target.nodeId, edge.target.portId);
    const source = ports.get(sourceKey);
    const target = ports.get(targetKey);
    if (edge.resolvedType !== undefined && invalidPortValueType(edge.resolvedType)) {
      issue(
        issues,
        "error",
        "invalid-value-type",
        `edge ${edge.id} uses invalid resolvedType ${edge.resolvedType}`,
        { edges: [edge.id] }
      );
    }

    if (!source) {
      issue(issues, "error", "missing-source-port", `edge ${edge.id} references missing source port ${sourceKey}`, { edges: [edge.id] });
    }
    if (!target) {
      issue(issues, "error", "missing-target-port", `edge ${edge.id} references missing target port ${targetKey}`, { edges: [edge.id] });
    }
    if (!source || !target) {
      continue;
    }

    if (source.direction !== "output") {
      issue(issues, "error", "invalid-source-direction", `edge ${edge.id} source ${sourceKey} is not an output port`, { edges: [edge.id] });
    }
    if (target.direction !== "input") {
      issue(issues, "error", "invalid-target-direction", `edge ${edge.id} target ${targetKey} is not an input port`, { edges: [edge.id] });
    }
    const connectionPolicy = portConnectionPolicyV01(source, target);
    if (!connectionPolicy.accepted && connectionPolicy.reason !== "direction-mismatch") {
      issue(issues, "error", "incompatible-type", `edge ${edge.id} cannot connect ${sourceKey} ${source.type} to ${targetKey} ${target.type}: ${connectionPolicy.reason}`, { edges: [edge.id] });
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
      issue(issues, "error", "missing-required-input", `input ${key} requires at least ${minimum} connection(s)`);
    }
    if (connectedEdges.length > inputMaxConnections(port)) {
      issue(issues, "error", "fan-in-cardinality", `input ${key} accepts at most ${port.maxConnections ?? 1} connection(s)`);
    }
    if (connectedEdges.length > 1 && portMergePolicy(port) === "forbid") {
      issue(issues, "error", "fan-in-without-merge-policy", `input ${key} has fan-in but mergePolicy is forbid`);
    }
  }

  for (const [key, connectedEdges] of outgoing) {
    const port = ports.get(key);
    if (port?.direction === "output" && connectedEdges.length > 1 && portFanOutPolicy(port) === "forbid") {
      issue(issues, "error", "fan-out-forbidden", `output ${key} forbids fan-out`);
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
      issue(issues, "error", cycle.classification, cycle.message, { nodes: cycle.nodes, edges: cycle.edges });
    } else if (cycle.classification === "risky-feedback") {
      issue(issues, "warning", cycle.classification, cycle.message, { nodes: cycle.nodes, edges: cycle.edges });
    }
  }

  return {
    ok: issues.every((entry) => entry.severity !== "error"),
    issues,
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
    return { ok: false, errors: result.issues.map((issue) => `${issue.code}: ${issue.message}`) };
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
    return { ok: false, errors: result.issues.map((entry) => `${entry.code}: ${entry.message}`) };
  }

  return { ok: true, value: fragment };
}

export function validateMessageValue(document: unknown): ValidationResult<MessageValueV01> {
  if (!messageValueV01Validator(document)) {
    return { ok: false, errors: schemaErrors(messageValueV01Validator.errors as ErrorObject[]) };
  }

  return { ok: true, value: document as MessageValueV01 };
}

export function validateValueFormatV01(document: unknown): ValidationResult<ValueFormatV01> {
  const errors = validateValueFormatErrors(document);
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value: document as ValueFormatV01 };
}

export function validateEndpointBindingValueFormatV01(
  document: unknown
): ValidationResult<EndpointBindingValueFormatV01> {
  const errors = validateEndpointBindingValueFormatErrors(document);
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value: document as EndpointBindingValueFormatV01 };
}

export function validateValueOccurrenceHeaderV01(
  document: unknown
): ValidationResult<ValueOccurrenceHeaderV01> {
  const errors = validateValueOccurrenceHeaderErrors(document);
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value: document as ValueOccurrenceHeaderV01 };
}

export function validateObjectSpecParseResult(
  document: unknown
): ValidationResult<ObjectSpecParseResultV01> {
  if (!objectSpecParseResultV01Validator(document)) {
    return {
      ok: false,
      errors: schemaErrors(objectSpecParseResultV01Validator.errors as ErrorObject[])
    };
  }

  const result = document as ObjectSpecParseResultV01;
  const errors = validateObjectSpecParseResultV01Semantics(result);
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

export function validateNodeCatalogSnapshotV01(
  document: unknown
): ValidationResult<NodeCatalogSnapshotV01> {
  if (!nodeCatalogV01Validator(document)) {
    return { ok: false, errors: schemaErrors(nodeCatalogV01Validator.errors as ErrorObject[]) };
  }

  const snapshot = document as NodeCatalogSnapshotV01;
  const errors = validateNodeCatalogSnapshotV01Semantics(snapshot);
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value: snapshot };
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

function validateRuntimeSessionLoadRequestV01Semantics(
  request: RuntimeSessionLoadRequestV01
): string[] {
  const errors: string[] = [];
  const projectResult = validateProjectDocumentV01(request.project);

  if (!projectResult.ok) {
    errors.push(...projectResult.errors.map((error) => `project ${error}`));
  }

  return errors;
}

export function validateRuntimeSessionLoadRequestV01(
  document: unknown
): ValidationResult<RuntimeSessionLoadRequestV01> {
  if (!runtimeSessionLoadRequestV01Validator(document)) {
    return {
      ok: false,
      errors: schemaErrors(runtimeSessionLoadRequestV01Validator.errors as ErrorObject[])
    };
  }

  const request = document as RuntimeSessionLoadRequestV01;
  const errors = validateRuntimeSessionLoadRequestV01Semantics(request);
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value: request };
}

export function isRuntimeSessionLoadRequestV01(
  document: unknown
): document is RuntimeSessionLoadRequestV01 {
  return validateRuntimeSessionLoadRequestV01(document).ok;
}

function validateProjectObjectBindingStatusInvariants(document: unknown): string[] {
  if (typeof document !== "object" || document === null || !Array.isArray((document as { objectBindings?: unknown }).objectBindings)) {
    return [];
  }

  const errors: string[] = [];

  for (const binding of (document as { objectBindings: unknown[] }).objectBindings) {
    if (typeof binding !== "object" || binding === null) {
      continue;
    }
    const record = binding as { id?: unknown; status?: unknown; implementation?: unknown; issues?: unknown };
    const id = typeof record.id === "string" ? record.id : "<unknown>";
    if (record.status === "resolved" && record.implementation === undefined) {
      errors.push(`resolved object binding ${id} requires implementation`);
      continue;
    }
    if (record.status === "unresolved" && record.implementation !== undefined) {
      errors.push(`unresolved object binding ${id} must not include implementation`);
      continue;
    }
    if (record.status === "error") {
      if (record.implementation === undefined) {
        errors.push(`error object binding ${id} requires implementation`);
        continue;
      }
      if (!bindingHasIssue(record, IMPLEMENTATION_ERROR_ISSUE_CODES)) {
        errors.push(`error object binding ${id} requires implementation issue`);
      }
    }
  }

  return errors;
}

function bindingHasIssue(
  record: { issues?: unknown },
  codes: ReadonlySet<string>
): boolean {
  const issues = Array.isArray(record.issues) ? record.issues : [];
  return issues.some((issue) => {
    if (typeof issue !== "object" || issue === null) {
      return false;
    }
    const code = (issue as { code?: unknown }).code;
    return typeof code === "string" && codes.has(code);
  });
}

export function validateProjectDocument(document: unknown): ValidationResult<ProjectDocumentV01> {
  return validateProjectDocumentV01(document);
}

function validateGraphTargetRefFields(errors: string[], target: unknown, label: string): void {
  if (!isRecord(target)) {
    errors.push(`${label} must be object`);
    return;
  }
  if (!isGraphTargetPath(target.path)) {
    errors.push(`${label}/path must be a supported graph target path`);
  }
  if (typeof target.baseRevision !== "string" || target.baseRevision.length === 0) {
    errors.push(`${label}/baseRevision must be a non-empty string`);
  }
  if (
    target.targetRevision !== undefined &&
    (typeof target.targetRevision !== "string" || target.targetRevision.length === 0)
  ) {
    errors.push(`${label}/targetRevision must be a non-empty string when present`);
  }
}

export function validatePasteGraphFragmentRequest(
  document: unknown
): ValidationResult<PasteGraphFragmentRequest> {
  const errors: string[] = [];

  if (!isRecord(document)) {
    return { ok: false, errors: ["/ must be object"] };
  }

  validateGraphTargetRefFields(errors, document.target, "/target");

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
        options.interfaceIncidentEdgePolicy === "preserve-issue" ||
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
      (path.version === undefined || (typeof path.version === "string" && path.version.length > 0))
    );
  }
  if (path.kind === "embedded-patch-instance") {
    return (
      Array.isArray(path.ownerPath) &&
      path.ownerPath.every((entry) => typeof entry === "string" && entry.length > 0) &&
      typeof path.nodeId === "string" &&
      path.nodeId.length > 0
    );
  }
  if (path.kind === "help-working-copy") {
    return (
      typeof path.workingCopyId === "string" &&
      path.workingCopyId.length > 0 &&
      (path.sourcePackageId === undefined ||
        (typeof path.sourcePackageId === "string" && path.sourcePackageId.length > 0)) &&
      (path.sourcePatchId === undefined ||
        (typeof path.sourcePatchId === "string" && path.sourcePatchId.length > 0))
    );
  }
  return false;
}
