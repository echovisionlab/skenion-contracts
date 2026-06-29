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

function requireString(file, value, label) {
  if (typeof value !== "string" || value.length === 0) {
    fail(file, `${label} must be a non-empty string`);
  }
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

function assertSameSet(file, actualValues, expectedValues, label) {
  const actual = new Set(actualValues);
  const expected = new Set(expectedValues);
  const missing = [...expected].filter((value) => !actual.has(value));
  const extra = [...actual].filter((value) => !expected.has(value));
  if (missing.length > 0 || extra.length > 0) {
    fail(
      file,
      `${label} mismatch: missing [${missing.join(", ")}], extra [${extra.join(", ")}]`
    );
  }
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
    if (node.kind === "object.core.inlet") {
      const ports = node.ports.filter((port) => port.direction === "output");
      for (const port of ports) {
        portIds.push(boundaryPortId(node, port, ports.length));
      }
    } else if (node.kind === "object.core.outlet") {
      const ports = node.ports.filter((port) => port.direction === "input");
      for (const port of ports) {
        portIds.push(boundaryPortId(node, port, ports.length));
      }
    }
  }

  return portIds;
}

function validatePatchDefinitionV01Semantics(file, patch) {
  validateGraphV01Semantics(file, patch.graph);

  if (patch.viewState) {
    validateViewStateNodeReferences(file, patch.graph, patch.viewState, `patch ${patch.id} viewState`);
  }

  duplicateCheck(file, derivedPatchBoundaryPortIds(patch), `boundary port id on patch ${patch.id}`);
}

function validateProjectV01Semantics(file, project) {
  validateGraphV01Semantics(file, project.graph);
  validateViewStateNodeReferences(file, project.graph, project.viewState);
  duplicateCheck(
    file,
    project.patchLibrary.map((patch) => patch.id),
    "patch id"
  );

  for (const patch of project.patchLibrary) {
    validatePatchDefinitionV01Semantics(file, patch);
  }

  const packageLockById = new Map((project.packageLock ?? []).map((entry) => [entry.id, entry]));
  duplicateCheck(file, (project.packageLock ?? []).map((entry) => entry.id), "package lock entry id");
  duplicateCheck(file, (project.resourceLock ?? []).map((entry) => entry.id), "resource lock entry id");
  duplicateCheck(file, (project.objectBindings ?? []).map((entry) => entry.id), "object binding id");

  for (const lockEntry of project.packageLock ?? []) {
    if (lockEntry.category === "patch") {
      if (lockEntry.runtimeAbiRange !== undefined) {
        fail(file, `patch package lock ${lockEntry.id} must not declare runtimeAbiRange`);
      }
      if (lockEntry.target !== undefined) {
        fail(file, `patch package lock ${lockEntry.id} must not declare target`);
      }
      if (lockEntry.nativeArtifacts !== undefined) {
        fail(file, `patch package lock ${lockEntry.id} must not declare nativeArtifacts`);
      }
    }
    if (lockEntry.category === "native" || lockEntry.category === "mixed") {
      if (lockEntry.runtimeAbiRange === undefined) {
        fail(file, `${lockEntry.category} package lock ${lockEntry.id} requires runtimeAbiRange`);
      }
      if (lockEntry.target === undefined) {
        fail(file, `${lockEntry.category} package lock ${lockEntry.id} requires target`);
      }
      if (!Array.isArray(lockEntry.nativeArtifacts) || lockEntry.nativeArtifacts.length === 0) {
        fail(file, `${lockEntry.category} package lock ${lockEntry.id} requires nativeArtifacts`);
      }
    }
  }

  for (const dependency of project.packageDependencies ?? []) {
    const lockEntry = packageLockById.get(dependency.lockEntryId);
    if (!lockEntry) {
      fail(file, `package dependency ${dependency.packageId} references missing lockEntryId: ${dependency.lockEntryId}`);
    }
    if (dependency.packageId !== lockEntry.packageId) {
      fail(file, `package dependency ${dependency.packageId} lockEntryId ${dependency.lockEntryId} points to package ${lockEntry.packageId}`);
    }
    if (!satisfiesV0CompatibilityRange(lockEntry.version, dependency.versionRange)) {
      fail(file, `package dependency ${dependency.packageId} locked version ${lockEntry.version} does not satisfy ${dependency.versionRange}`);
    }
  }
  for (const resource of project.resourceLock ?? []) {
    if (!packageLockById.has(resource.lockEntryId)) {
      fail(file, `resource lock ${resource.id} references missing lockEntryId: ${resource.lockEntryId}`);
    }
  }
  const bindingIds = new Set((project.objectBindings ?? []).map((entry) => entry.id));
  for (const node of [
    ...project.graph.nodes,
    ...project.patchLibrary.flatMap((patch) => patch.graph.nodes)
  ]) {
    if (node.bindingRef !== undefined && !bindingIds.has(node.bindingRef)) {
      fail(file, `node ${node.id} references missing bindingRef: ${node.bindingRef}`);
    }
  }

  for (const binding of project.objectBindings ?? []) {
    const diagnostics = binding.diagnostics ?? [];
    const hasDiagnostic = (...codes) => diagnostics.some((diagnostic) => codes.includes(diagnostic.code));

    if (binding.status === "resolved" && binding.target === undefined) {
      fail(file, `resolved object binding ${binding.id} requires target`);
    }
    if (binding.status === "missing" && !hasDiagnostic("binding-target-missing")) {
      fail(file, `missing object binding ${binding.id} requires binding-target-missing diagnostic`);
    }
    if (binding.status === "stale" && !hasDiagnostic("binding-target-stale", "binding-interface-drift")) {
      fail(file, `stale object binding ${binding.id} requires stale or interface-drift diagnostic`);
    }
    if (binding.status === "unresolved" && !hasDiagnostic("binding-unresolved")) {
      fail(file, `unresolved object binding ${binding.id} requires binding-unresolved diagnostic`);
    }
    if (binding.status === "ambiguous" && !hasDiagnostic("binding-ambiguous")) {
      fail(file, `ambiguous object binding ${binding.id} requires binding-ambiguous diagnostic`);
    }

    if (binding.target?.kind === "projectPatch") {
      const patch = project.patchLibrary.find((candidate) => candidate.id === binding.target.patchId);
      if (!patch) {
        if (binding.status === "resolved") {
          fail(file, `resolved object binding ${binding.id} references missing project patch: ${binding.target.patchId}`);
        }
        if (binding.status !== "missing" && binding.status !== "stale") {
          fail(file, `object binding ${binding.id} references missing project patch: ${binding.target.patchId}`);
        }
        continue;
      }
      if (binding.target.revision !== undefined && binding.target.revision !== patch.revision) {
        if (binding.status === "resolved") {
          fail(file, `resolved object binding ${binding.id} project patch ${binding.target.patchId} revision is stale`);
        }
        if (binding.status !== "stale" || !hasDiagnostic("binding-target-stale", "binding-interface-drift")) {
          fail(file, `object binding ${binding.id} project patch ${binding.target.patchId} revision is stale without diagnostics`);
        }
      }
      continue;
    }

    if (binding.target?.kind !== "packageProvider") {
      continue;
    }
    const lockEntry = packageLockById.get(binding.target.lockEntryId);
    if (!lockEntry) {
      if (binding.status === "resolved") {
        fail(file, `resolved object binding ${binding.id} references missing lockEntryId: ${binding.target.lockEntryId}`);
      }
      if (binding.status !== "missing" && binding.status !== "stale") {
        fail(file, `object binding ${binding.id} references missing lockEntryId: ${binding.target.lockEntryId}`);
      }
      continue;
    }
    if (binding.target.packageId !== lockEntry.packageId) {
      fail(file, `object binding ${binding.id} packageId ${binding.target.packageId} does not match lock entry package ${lockEntry.packageId}`);
    }
  }
}

function validatePackageManifestV01Semantics(file, manifest) {
  duplicateCheck(file, (manifest.provides.patches ?? []).map((provided) => provided.id), "provided patch id");
  duplicateCheck(file, (manifest.provides.nodes ?? []).map((provided) => provided.id), "provided node id");
  duplicateCheck(file, (manifest.provides.resources ?? []).map((provided) => provided.id), "provided resource id");
  duplicateCheck(file, (manifest.provides.help ?? []).map((provided) => provided.id), "provided help id");

  if (manifest.category === "patch") {
    if (manifest.runtimeAbiRange !== undefined) {
      fail(file, "patch package must not declare runtimeAbiRange");
    }
    if (manifest.targets !== undefined) {
      fail(file, "patch package must not declare targets");
    }
    if (manifest.nativeArtifacts !== undefined) {
      fail(file, "patch package must not declare nativeArtifacts");
    }
  }

  if (manifest.category === "native" || manifest.category === "mixed") {
    if (!manifest.runtimeAbiRange) {
      fail(file, `${manifest.category} package requires runtimeAbiRange`);
    }
    if (!manifest.targets || manifest.targets.length === 0) {
      fail(file, `${manifest.category} package requires targets`);
    }
    if (!manifest.nativeArtifacts || manifest.nativeArtifacts.length === 0) {
      fail(file, `${manifest.category} package requires nativeArtifacts`);
    }
  }

  const evidenceIds = new Set(manifest.evidence.map((evidence) => evidence.id));
  for (const artifact of manifest.nativeArtifacts ?? []) {
    for (const evidenceRef of artifact.evidenceRefs) {
      if (!evidenceIds.has(evidenceRef)) {
        fail(file, `native artifact ${artifact.path} references missing evidence: ${evidenceRef}`);
      }
    }
  }
}

function validatePackageListingV01Semantics(file, listing) {
  duplicateCheck(file, (listing.provides.patches ?? []).map((provided) => provided.id), "provided patch id");
  duplicateCheck(file, (listing.provides.nodes ?? []).map((provided) => provided.id), "provided node id");
  duplicateCheck(file, (listing.provides.resources ?? []).map((provided) => provided.id), "provided resource id");
  duplicateCheck(file, (listing.provides.help ?? []).map((provided) => provided.id), "provided help id");
  duplicateCheck(file, (listing.provides.nativeObjects ?? []).map((provided) => provided.id), "provided native object id");
  duplicateCheck(file, (listing.provides.codecs ?? []).map((provided) => provided.id), "provided codec id");

  const lowerBoundVersion = listing.contracts.range.slice(2).split(" ")[0];
  if (
    listing.contracts.line !== deriveV0CompatibilityLine(lowerBoundVersion) ||
    listing.contracts.range !== deriveV0CompatibilityRange(lowerBoundVersion)
  ) {
    fail(file, "package listing contracts line must match contracts range");
  }
  if (listing.runtimeAbiRange !== undefined) {
    const runtimeAbiLowerBoundVersion = listing.runtimeAbiRange.slice(2).split(" ")[0];
    if (listing.runtimeAbiRange !== deriveV0CompatibilityRange(runtimeAbiLowerBoundVersion)) {
      fail(file, "package listing runtimeAbiRange must be a current v0 compatibility range");
    }
  }

  const artifacts = listing.artifactEvidence.artifacts;
  const evidenceIds = new Set(listing.artifactEvidence.evidence.map((evidence) => evidence.id));
  for (const artifact of artifacts) {
    for (const evidenceRef of artifact.evidenceRefs) {
      if (!evidenceIds.has(evidenceRef)) {
        fail(file, `listing artifact ${artifact.path} references missing evidence: ${evidenceRef}`);
      }
    }
  }

  const nativeArtifacts = artifacts.filter((artifact) => artifact.kind === "native-artifact");
  if (listing.category === "patch") {
    if (nativeArtifacts.length > 0) {
      fail(file, "patch package listing must not declare native artifact summaries");
    }
  }

  if (listing.category === "native" || listing.category === "mixed") {
    const nativeTargets = new Set(nativeArtifacts.map((artifact) => artifact.target));
    for (const target of listing.targetSupport.targets ?? []) {
      if (!nativeTargets.has(target)) {
        fail(file, `package listing target ${target} has no native artifact summary`);
      }
    }
  }
}

function validatePackageDiscoveryV01Semantics(file, response) {
  duplicateCheck(
    file,
    response.listings.map((listing) => `${listing.packageId}@${listing.version}`),
    "package listing"
  );
  for (const listing of response.listings) {
    validatePackageListingV01Semantics(file, listing);
  }
}

const packagePlanTargetTriples = {
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

function validatePackageInstallPlanTargetV01Semantics(file, target) {
  const expectedTriple = packagePlanTargetTriples[target.os][target.arch];
  if (target.triple !== expectedTriple) {
    fail(file, `package install plan target ${target.os}/${target.arch} must use target triple ${expectedTriple}`);
  }

  const contractsLowerBoundVersion = target.contracts.range.slice(2).split(" ")[0];
  if (
    target.contracts.line !== deriveV0CompatibilityLine(contractsLowerBoundVersion) ||
    target.contracts.range !== deriveV0CompatibilityRange(contractsLowerBoundVersion)
  ) {
    fail(file, "package install plan target contracts line must match contracts range");
  }

  if (target.runtimeAbiRange !== undefined) {
    const runtimeAbiLowerBoundVersion = target.runtimeAbiRange.slice(2).split(" ")[0];
    if (target.runtimeAbiRange !== deriveV0CompatibilityRange(runtimeAbiLowerBoundVersion)) {
      fail(file, "package install plan target runtimeAbiRange must be a current v0 compatibility range");
    }
  }
}

function validatePackageInstallPlanLockEntryV01Semantics(file, lockEntry) {
  if (lockEntry.category === "patch") {
    if (lockEntry.runtimeAbiRange !== undefined) {
      fail(file, `patch package install plan lock ${lockEntry.id} must not declare runtimeAbiRange`);
    }
    if (lockEntry.target !== undefined) {
      fail(file, `patch package install plan lock ${lockEntry.id} must not declare target`);
    }
    if (lockEntry.nativeArtifacts !== undefined) {
      fail(file, `patch package install plan lock ${lockEntry.id} must not declare nativeArtifacts`);
    }
  }

  if (lockEntry.category === "native" || lockEntry.category === "mixed") {
    if (lockEntry.runtimeAbiRange === undefined) {
      fail(file, `${lockEntry.category} package install plan lock ${lockEntry.id} requires runtimeAbiRange`);
    }
    if (lockEntry.target === undefined) {
      fail(file, `${lockEntry.category} package install plan lock ${lockEntry.id} requires target`);
    }
    if (!Array.isArray(lockEntry.nativeArtifacts) || lockEntry.nativeArtifacts.length === 0) {
      fail(file, `${lockEntry.category} package install plan lock ${lockEntry.id} requires nativeArtifacts`);
    }
  }
}

function validatePackageInstallPlanRequestPreSchemaSemantics(file, document) {
  if (document === null || typeof document !== "object" || document.schema !== "skenion.package.install-plan.request") {
    return;
  }

  const packageLock = Array.isArray(document.current?.packageLock) ? document.current.packageLock : [];
  const rollbackCandidates = Array.isArray(document.rollbackCandidates) ? document.rollbackCandidates : [];
  for (const lockEntry of [...packageLock, ...rollbackCandidates]) {
    if (lockEntry !== null && typeof lockEntry === "object") {
      validatePackageInstallPlanLockEntryV01Semantics(file, lockEntry);
    }
  }
}

function validatePackageInstallPlanResponsePreSchemaSemantics(file, document) {
  if (
    document === null ||
    typeof document !== "object" ||
    document.schema !== "skenion.package.install-plan.response"
  ) {
    return;
  }

  const checks = Array.isArray(document.checks) ? document.checks : [];
  const actions = Array.isArray(document.actions) ? document.actions : [];
  const diagnostics = Array.isArray(document.diagnostics) ? document.diagnostics : [];

  for (const check of checks) {
    if (check === null || typeof check !== "object") {
      continue;
    }
    if (
      check.status === "fail" &&
      (!Array.isArray(check.diagnosticRefs) || check.diagnosticRefs.length === 0)
    ) {
      fail(file, `package install plan failing check ${check.kind} requires diagnosticRefs`);
    }
  }

  for (const action of actions) {
    if (action === null || typeof action !== "object") {
      continue;
    }
    if (
      action.kind === "reject" &&
      (!Array.isArray(action.diagnosticRefs) || action.diagnosticRefs.length === 0)
    ) {
      fail(file, `package install plan reject action ${action.id} requires diagnosticRefs`);
    }
  }

  const hasFailedCheck = checks.some((check) => {
    return check !== null && typeof check === "object" && check.status === "fail";
  });
  const hasRejectAction = actions.some((action) => {
    return action !== null && typeof action === "object" && action.kind === "reject";
  });
  const hasErrorDiagnostic = diagnostics.some((diagnostic) => {
    return diagnostic !== null && typeof diagnostic === "object" && diagnostic.severity === "error";
  });

  if (document.ok === true) {
    if (hasFailedCheck) {
      fail(file, "successful package install plan response must not include failed checks");
    }
    if (hasRejectAction) {
      fail(file, "successful package install plan response must not include reject actions");
    }
  }

  if (document.ok === false) {
    if (!hasRejectAction) {
      fail(file, "failed package install plan response requires a reject action");
    }
    if (!hasErrorDiagnostic) {
      fail(file, "failed package install plan response requires an error diagnostic");
    }
  }
}

function validatePackageInstallPlanRequestV01Semantics(file, request) {
  validatePackageInstallPlanTargetV01Semantics(file, request.target);

  if (request.desired.versionRange !== undefined) {
    const desiredLowerBoundVersion = request.desired.versionRange.slice(2).split(" ")[0];
    if (request.desired.versionRange !== deriveV0CompatibilityRange(desiredLowerBoundVersion)) {
      fail(file, "package install plan desired versionRange must be a current v0 compatibility range");
    }
  }

  duplicateCheck(file, request.current.packageLock.map((entry) => entry.id), "package install plan lock entry id");
  duplicateCheck(file, request.current.objectBindings.map((entry) => entry.id), "package install plan object binding id");

  const packageLockIds = new Set(request.current.packageLock.map((entry) => entry.id));
  if (
    request.current.installedLockEntryId !== undefined &&
    !packageLockIds.has(request.current.installedLockEntryId)
  ) {
    fail(file, `package install plan references missing installedLockEntryId: ${request.current.installedLockEntryId}`);
  }

  for (const lockEntry of request.current.packageLock) {
    validatePackageInstallPlanLockEntryV01Semantics(file, lockEntry);
  }

  for (const rollbackCandidate of request.rollbackCandidates ?? []) {
    validatePackageInstallPlanLockEntryV01Semantics(file, rollbackCandidate);
  }

  for (const binding of request.current.objectBindings) {
    if (binding.target?.kind === "packageProvider" && !packageLockIds.has(binding.target.lockEntryId)) {
      fail(file, `package install plan object binding ${binding.id} references missing lockEntryId: ${binding.target.lockEntryId}`);
    }
  }

  for (const candidate of request.candidates) {
    validatePackageListingV01Semantics(file, candidate.listing);
    if (candidate.listing.packageId !== request.packageId) {
      fail(file, `package install plan candidate ${candidate.listing.packageId} does not match request packageId ${request.packageId}`);
    }

    if (candidate.manifest !== undefined) {
      validatePackageManifestV01Semantics(file, candidate.manifest);
      if (candidate.manifest.id !== candidate.listing.packageId) {
        fail(file, `package install plan candidate manifest id ${candidate.manifest.id} does not match listing packageId ${candidate.listing.packageId}`);
      }
      if (candidate.manifest.version !== candidate.listing.version) {
        fail(file, `package install plan candidate manifest version ${candidate.manifest.version} does not match listing version ${candidate.listing.version}`);
      }
    }
  }
}

function validatePackageInstallPlanResponseV01Semantics(file, response) {
  validatePackageInstallPlanTargetV01Semantics(file, response.target);

  duplicateCheck(file, response.actions.map((action) => action.id), "package install plan action id");
  duplicateCheck(file, response.diagnostics.map((diagnostic) => diagnostic.id), "package install plan diagnostic id");

  const diagnosticIds = new Set(response.diagnostics.map((diagnostic) => diagnostic.id));
  let hasFailedCheck = false;
  for (const check of response.checks) {
    if (check.status === "fail") {
      hasFailedCheck = true;
      if (!Array.isArray(check.diagnosticRefs) || check.diagnosticRefs.length === 0) {
        fail(file, `package install plan failing check ${check.kind} requires diagnosticRefs`);
      }
    }
    for (const diagnosticRef of check.diagnosticRefs ?? []) {
      if (!diagnosticIds.has(diagnosticRef)) {
        fail(file, `package install plan check ${check.kind} references missing diagnostic ${diagnosticRef}`);
      }
    }
  }

  for (const [index, action] of response.actions.entries()) {
    if (action.order !== index) {
      fail(file, `package install plan action ${action.id} order must be ${index}`);
    }

    for (const diagnosticRef of action.diagnosticRefs ?? []) {
      if (!diagnosticIds.has(diagnosticRef)) {
        fail(file, `package install plan action ${action.id} references missing diagnostic ${diagnosticRef}`);
      }
    }

    for (const capabilityChange of action.capabilityChanges ?? []) {
      if (capabilityChange.diagnosticRef !== undefined && !diagnosticIds.has(capabilityChange.diagnosticRef)) {
        fail(file, `package install plan action ${action.id} capability change references missing diagnostic ${capabilityChange.diagnosticRef}`);
      }
    }
  }

  const hasRejectAction = response.actions.some((action) => action.kind === "reject");
  const hasErrorDiagnostic = response.diagnostics.some((diagnostic) => diagnostic.severity === "error");
  if (response.ok) {
    if (hasFailedCheck) {
      fail(file, "successful package install plan response must not include failed checks");
    }
    if (hasRejectAction) {
      fail(file, "successful package install plan response must not include reject actions");
    }
  } else {
    if (!hasRejectAction) {
      fail(file, "failed package install plan response requires a reject action");
    }
    if (!hasErrorDiagnostic) {
      fail(file, "failed package install plan response requires an error diagnostic");
    }
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

function v01MessageValuePortType(type) {
  return [
    "value.core.message",
    "value.core.float64",
    "value.core.int64",
    "value.core.uint64",
    "value.core.bool",
    "value.core.color",
    "value.core.string"
  ].includes(type);
}

function portTypeAccepts(source, target) {
  if (target.type === "value.core.message" && v01MessageValuePortType(source.type)) {
    return true;
  }
  return source.type === target.type || target.accepts?.includes(source.type) === true;
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

function invalidPortValueType(type) {
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
    String(type).startsWith("control.") ||
    String(type).startsWith("event.") ||
    String(type).startsWith("stream.") ||
    String(type).startsWith("payload.") ||
    String(type).startsWith("data.") ||
    String(type).startsWith("selector.") ||
    String(type).startsWith("value<")
  ) {
    return true;
  }
  if (invalidValueTypeIds.has(type)) {
    return true;
  }
  if (
    (String(type).startsWith("value.core.") || String(type).startsWith("value.media.")) &&
    !firstPartyValueTypeIds.has(type)
  ) {
    return true;
  }
  return false;
}

function payloadIdentityNodeKind(kind) {
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
    String(kind).startsWith("value.") ||
    String(kind).startsWith("data.") ||
    String(kind).startsWith("payload.") ||
    String(kind).startsWith("control.");
}

function messageKeyAwareInputPort(port) {
  return port.direction === "input" && (
    port.type === "value.core.message" ||
    port.accepts?.includes("value.core.message") === true
  );
}

function validateMessageKeyPolicy(file, port, label) {
  if (!port.messageKeys) {
    if (messageKeyAwareInputPort(port)) {
      fail(file, `${label} message-key-aware input port requires messageKeys`);
    }
    return;
  }
  const accepted = port.messageKeys.accepted ?? [];
  if (accepted.length === 0) {
    fail(file, `${label} messageKeys.accepted must list at least one key`);
  }
  const acceptedSet = new Set(accepted);
  for (const field of ["silent", "trigger", "store", "emit"]) {
    for (const key of port.messageKeys[field] ?? []) {
      if (!acceptedSet.has(key)) {
        fail(file, `${label} messageKeys.${field} key ${key} is not accepted`);
      }
    }
  }
  if (port.messageKeys.trigger?.includes("set")) {
    fail(file, `${label} messageKeys.trigger must not include set`);
  }
  if (port.messageKeys.emit?.includes("set")) {
    fail(file, `${label} messageKeys.emit must not include set`);
  }
  if (
    acceptedSet.has("set") &&
    !port.messageKeys.silent?.includes("set") &&
    !port.messageKeys.store?.includes("set")
  ) {
    fail(file, `${label} messageKeys.set must be silent or store behavior`);
  }
}

function validateObjectTextParseResultSemantics(file, result) {
  for (const port of result.instancePorts ?? []) {
    validateMessageKeyPolicy(file, port, `objectText instancePort ${result.className}.${port.id}`);
  }
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

function immediateValueCyclePortType(type) {
  return String(type).startsWith("value.core.");
}

function immediateValueCycleTypes(edges, ports) {
  return edges.every((edge) => {
    const source = ports.get(portSpecKey(edge.source.nodeId, edge.source.portId));
    const target = ports.get(portSpecKey(edge.target.nodeId, edge.target.portId));
    return immediateValueCyclePortType(source?.type ?? "") &&
      immediateValueCyclePortType(target?.type ?? "");
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

function validateGraphV01Semantics(file, graph) {
  duplicateCheck(
    file,
    graph.nodes.map((node) => node.id),
    "node id"
  );

  const ports = new Map();
  const incoming = new Map();
  const outgoing = new Map();
  for (const node of graph.nodes) {
    if (payloadIdentityNodeKind(node.kind)) {
      fail(file, `node ${node.id} uses payload identity ${node.kind} as an executable kind`);
    }
    duplicateCheck(
      file,
      node.ports.map((port) => port.id),
      `port id on ${node.id}`
    );
    for (const group of node.portGroups ?? []) {
      if (invalidPortValueType(group.type)) {
        fail(file, `port group ${node.id}.${group.id} uses invalid value type ${group.type}`);
      }
      if (invalidPortValueType(group.defaultPortSpec?.type ?? "")) {
        fail(file, `port group ${node.id}.${group.id} default port uses invalid value type ${group.defaultPortSpec.type}`);
      }
      for (const acceptedType of group.defaultPortSpec?.accepts ?? []) {
        if (invalidPortValueType(acceptedType)) {
          fail(file, `port group ${node.id}.${group.id} default port accepts invalid value type ${acceptedType}`);
        }
      }
      if (group.defaultPortSpec) {
        validateMessageKeyPolicy(file, group.defaultPortSpec, `port group ${node.id}.${group.id} defaultPortSpec`);
      }
      if (group.maxPorts !== undefined && group.maxPorts < group.minPorts) {
        fail(file, `port group ${node.id}.${group.id} maxPorts is less than minPorts`);
      }
    }
    for (const port of node.ports) {
      if (invalidPortValueType(port.type)) {
        fail(file, `port ${node.id}.${port.id} uses invalid value type ${port.type}`);
      }
      for (const acceptedType of port.accepts ?? []) {
        if (invalidPortValueType(acceptedType)) {
          fail(file, `port ${node.id}.${port.id} accepts invalid value type ${acceptedType}`);
        }
      }
      validateMessageKeyPolicy(file, port, `port ${node.id}.${port.id}`);
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
    if (invalidPortValueType(edge.resolvedType ?? "")) {
      fail(file, `edge ${edge.id} uses invalid resolvedType ${edge.resolvedType}`);
    }
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
    if (!feedback && immediateValueCycleTypes(cycleEdges, ports)) {
      fail(file, "ambiguous-algebraic-loop: immediate value cycle requires explicit latch, delay, or feedback policy");
    }
    if (!feedback) {
      fail(file, "invalid-cycle: cycle requires explicit feedback policy");
    }
  }
}

function validateRuntimeSessionLoadRequestV01Semantics(file, request) {
  validateProjectV01Semantics(file, request.project);

  if (request.mode === "replaceIfMatch" && request.precondition === undefined) {
    fail(file, "runtime session load replaceIfMatch requires precondition");
  }
}

function validateGraphFragmentV01Semantics(file, fragment) {
  duplicateCheck(
    file,
    fragment.nodes.map((node) => node.id),
    "node id"
  );

  const nodeIds = new Set(fragment.nodes.map((node) => node.id));
  const ports = new Map();
  for (const node of fragment.nodes) {
    if (payloadIdentityNodeKind(node.kind)) {
      fail(file, `node ${node.id} uses payload identity ${node.kind} as an executable kind`);
    }
    duplicateCheck(
      file,
      node.ports.map((port) => port.id),
      `port id on ${node.id}`
    );
    for (const port of node.ports) {
      if (invalidPortValueType(port.type)) {
        fail(file, `port ${node.id}.${port.id} uses invalid value type ${port.type}`);
      }
      for (const acceptedType of port.accepts ?? []) {
        if (invalidPortValueType(acceptedType)) {
          fail(file, `port ${node.id}.${port.id} accepts invalid value type ${acceptedType}`);
        }
      }
      validateMessageKeyPolicy(file, port, `port ${node.id}.${port.id}`);
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
    if (invalidPortValueType(edge.resolvedType ?? "")) {
      fail(file, `edge ${edge.id} uses invalid resolvedType ${edge.resolvedType}`);
    }
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

function validateNodeDefinitionV01Semantics(file, definition) {
  duplicateCheck(
    file,
    definition.ports.map((port) => port.id),
    `port id on ${definition.id}`
  );

  for (const group of definition.portGroups ?? []) {
    if (invalidPortValueType(group.type)) {
      fail(file, `invalid port group type on ${definition.id}.${group.id}: ${group.type}`);
    }
    if (invalidPortValueType(group.defaultPortSpec?.type ?? "")) {
      fail(file, `invalid default value type on ${definition.id}.${group.id}: ${group.defaultPortSpec.type}`);
    }
    for (const acceptedType of group.defaultPortSpec?.accepts ?? []) {
      if (invalidPortValueType(acceptedType)) {
        fail(file, `invalid default accepted value type on ${definition.id}.${group.id}: ${acceptedType}`);
      }
    }
    if (group.defaultPortSpec) {
      validateMessageKeyPolicy(file, group.defaultPortSpec, `port group ${definition.id}.${group.id} defaultPortSpec`);
    }
    if (group.maxPorts !== undefined && group.maxPorts < group.minPorts) {
      fail(file, `port group ${definition.id}.${group.id} maxPorts is less than minPorts`);
    }
  }

  for (const port of definition.ports) {
    if (invalidPortValueType(port.type)) {
      fail(file, `invalid value type on ${definition.id}.${port.id}: ${port.type}`);
    }
    for (const acceptedType of port.accepts ?? []) {
      if (invalidPortValueType(acceptedType)) {
        fail(file, `invalid accepted value type on ${definition.id}.${port.id}: ${acceptedType}`);
      }
    }
    validateMessageKeyPolicy(file, port, `port ${definition.id}.${port.id}`);
  }

  for (const permission of definition.permissions) {
    if (!allowedNodePermissions.has(permission)) {
      fail(file, `unsupported permission: ${permission}`);
    }
  }
}

function parseV0Semver(version) {
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(version);
  if (!match || Number(match[1]) !== 0) {
    return undefined;
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3])
  };
}

function deriveV0CompatibilityLine(version) {
  const parsed = parseV0Semver(version);
  return parsed ? `0.${parsed.minor}` : undefined;
}

function deriveV0CompatibilityRange(version) {
  const parsed = parseV0Semver(version);
  return parsed ? `>=0.${parsed.minor}.0 <0.${parsed.minor + 1}.0` : undefined;
}

function satisfiesV0CompatibilityRange(version, range) {
  const parsed = parseV0Semver(version);
  const rangeMatch = /^>=0\.([0-9]+)\.0 <0\.([0-9]+)\.0$/.exec(range);
  if (!parsed || !rangeMatch) {
    return false;
  }
  const lowerMinor = Number(rangeMatch[1]);
  const upperMinor = Number(rangeMatch[2]);
  return upperMinor === lowerMinor + 1 && parsed.minor === lowerMinor;
}

function validateCompatibilityMatrixSemantics(file, matrix) {
  const contractsNpm = matrix.components.contracts.npm;
  const contractsCrate = matrix.components.contracts.crate;
  const expectedLine = deriveV0CompatibilityLine(contractsNpm.version);
  const expectedRange = deriveV0CompatibilityRange(contractsNpm.version);

  if (contractsNpm.ecosystem !== "npm" || contractsNpm.name !== "@skenion/contracts") {
    fail(file, "components.contracts.npm must identify @skenion/contracts on npm");
  }
  if (contractsCrate.ecosystem !== "crates.io" || contractsCrate.name !== "skenion-contracts") {
    fail(file, "components.contracts.crate must identify skenion-contracts on crates.io");
  }
  if (matrix.components.sdk.npm.ecosystem !== "npm" || matrix.components.sdk.npm.name !== "@skenion/sdk") {
    fail(file, "components.sdk.npm must identify @skenion/sdk on npm");
  }
  if (matrix["contracts-line"] !== expectedLine) {
    fail(file, `contracts-line must be ${expectedLine}`);
  }
  if (matrix["contracts-range"] !== expectedRange) {
    fail(file, `contracts-range must be ${expectedRange}`);
  }
  if (deriveV0CompatibilityLine(contractsCrate.version) !== expectedLine) {
    fail(file, "contracts npm and crate versions must be on the same v0 compatibility line");
  }
  if (!satisfiesV0CompatibilityRange(contractsNpm.version, matrix.components.sdk["supported-contracts-range"])) {
    fail(file, "sdk supported-contracts-range must include the Contracts package version");
  }
  if (!satisfiesV0CompatibilityRange(contractsNpm.version, matrix["contracts-range"])) {
    fail(file, "contracts-range must include the Contracts package version");
  }
}

function selectValidator(file, document, validators) {
  if (document.schema === "skenion.graph" && document.schemaVersion === "0.1.0") {
    return validators.graphV01;
  }
  if (document.schema === "skenion.graph.fragment" && document.schemaVersion === "0.1.0") {
    return validators.graphFragmentV01;
  }
  if (document.schema === "skenion.view-state" && document.schemaVersion === "0.1.0") {
    return validators.viewStateV01;
  }
  if (document.schema === "skenion.project" && document.schemaVersion === "0.1.0") {
    return validators.projectV01;
  }
  if (document.schema === "skenion.node.definition" && document.schemaVersion === "0.1.0") {
    return validators.nodeDefinitionV01;
  }
  if (document.schema === "skenion.node-catalog.snapshot" && document.schemaVersion === "0.1.0") {
    return validators.nodeCatalogV01;
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
  if (document.schema === "skenion.package.manifest" && document.schemaVersion === "0.1.0") {
    return validators.packageManifestV01;
  }
  if (document.schema === "skenion.package.listing" && document.schemaVersion === "0.1.0") {
    return validators.packageListingV01;
  }
  if (document.schema === "skenion.package.discovery" && document.schemaVersion === "0.1.0") {
    return validators.packageDiscoveryV01;
  }
  if (document.schema === "skenion.package.install-plan.request" && document.schemaVersion === "0.1.0") {
    return validators.packageInstallPlanRequestV01;
  }
  if (document.schema === "skenion.package.install-plan.response" && document.schemaVersion === "0.1.0") {
    return validators.packageInstallPlanResponseV01;
  }
  if (document.schema === "skenion.runtime.session-load-request" && document.schemaVersion === "0.1.0") {
    return validators.runtimeSessionLoadRequestV01;
  }
  if (document.schema === "skenion.compatibility-matrix" && document["schema-version"] === "0.1.0") {
    return validators.compatibilityMatrixV01;
  }

  const schemaVersion = document.schema === "skenion.compatibility-matrix"
    ? document["schema-version"]
    : document.schemaVersion;
  fail(file, `no validator for schema ${document.schema ?? "<missing>"} ${schemaVersion ?? "<missing>"}`);
}

function validateDocument(file, document, validators) {
  validatePackageInstallPlanRequestPreSchemaSemantics(file, document);
  validatePackageInstallPlanResponsePreSchemaSemantics(file, document);

  const validator = selectValidator(file, document, validators);
  if (!validator(document)) {
    fail(file, validator.errors?.map((error) => `${error.instancePath} ${error.message}`).join("; "));
  }

  if (document.schema === "skenion.graph" && document.schemaVersion === "0.1.0") {
    validateGraphV01Semantics(file, document);
  }
  if (document.schema === "skenion.graph.fragment" && document.schemaVersion === "0.1.0") {
    validateGraphFragmentV01Semantics(file, document);
  }
  if (document.schema === "skenion.project" && document.schemaVersion === "0.1.0") {
    validateProjectV01Semantics(file, document);
  }
  if (document.schema === "skenion.runtime.session-load-request" && document.schemaVersion === "0.1.0") {
    validateRuntimeSessionLoadRequestV01Semantics(file, document);
  }
  if (document.schema === "skenion.object-text.parse-result" && document.schemaVersion === "0.1.0") {
    validateObjectTextParseResultSemantics(file, document);
  }
  if (document.schema === "skenion.package.manifest" && document.schemaVersion === "0.1.0") {
    validatePackageManifestV01Semantics(file, document);
  }
  if (document.schema === "skenion.package.listing" && document.schemaVersion === "0.1.0") {
    validatePackageListingV01Semantics(file, document);
  }
  if (document.schema === "skenion.package.discovery" && document.schemaVersion === "0.1.0") {
    validatePackageDiscoveryV01Semantics(file, document);
  }
  if (document.schema === "skenion.package.install-plan.request" && document.schemaVersion === "0.1.0") {
    validatePackageInstallPlanRequestV01Semantics(file, document);
  }
  if (document.schema === "skenion.package.install-plan.response" && document.schemaVersion === "0.1.0") {
    validatePackageInstallPlanResponseV01Semantics(file, document);
  }
  if (document.schema === "skenion.node.definition" && document.schemaVersion === "0.1.0") {
    validateNodeDefinitionV01Semantics(file, document);
  }
  if (document.schema === "skenion.extension.manifest" && document.schemaVersion === "0.1.0") {
    duplicateCheck(
      file,
      (document.provides.nodes ?? []).map((node) => node.id),
      "provided node id"
    );
    for (const node of document.provides.nodes ?? []) {
      validateNodeDefinitionV01Semantics(file, node);
    }
  }
  if (document.schema === "skenion.compatibility-matrix" && document["schema-version"] === "0.1.0") {
    validateCompatibilityMatrixSemantics(file, document);
  }
}

function validateBuiltinFixtureManifest(file, manifest) {
  if (manifest.schema !== "skenion.builtins.manifest") {
    fail(file, "schema must be skenion.builtins.manifest");
  }
  if (manifest.schemaVersion !== "0.1.0") {
    fail(file, "schemaVersion must be 0.1.0");
  }
  if (manifest.version !== "0.1") {
    fail(file, "version must be 0.1");
  }
  if (manifest.scope !== "fixture-reference") {
    fail(file, "scope must be fixture-reference");
  }
  if (!Array.isArray(manifest.nodes) || manifest.nodes.length === 0) {
    fail(file, "nodes must be a non-empty array");
  }
  if (!Array.isArray(manifest.canonicalTypes) || manifest.canonicalTypes.length === 0) {
    fail(file, "canonicalTypes must be a non-empty array");
  }

  for (const node of manifest.nodes) {
    requireString(file, node, "fixture node id");
  }
  for (const type of manifest.canonicalTypes) {
    requireString(file, type, "canonical type");
  }

  duplicateCheck(file, manifest.nodes, "fixture node id");
  duplicateCheck(file, manifest.canonicalTypes, "canonical type");

  for (const [type, representations] of Object.entries(manifest.representations ?? {})) {
    if (!manifest.canonicalTypes.includes(type)) {
      fail(file, `representation key is not a canonical type: ${type}`);
    }
    if (!Array.isArray(representations) || representations.length === 0) {
      fail(file, `representations for ${type} must be a non-empty array`);
    }
    for (const representation of representations) {
      requireString(file, representation, `representation for ${type}`);
    }
    duplicateCheck(file, representations, `representation for ${type}`);
  }
}

function validateBuiltinFixtureNodeDefinition(file, definition, id, manifest) {
  validateDocument(file, definition, validators);
  if (definition.id !== id) {
    fail(file, `node definition id ${definition.id} does not match fixture id ${id}`);
  }
  if (payloadIdentityNodeKind(definition.id)) {
    fail(file, `payload identity node definition id: ${definition.id}`);
  }
  if (!manifest.nodes.includes(definition.id)) {
    fail(file, `node definition is not listed in fixture manifest: ${definition.id}`);
  }

  const canonicalTypes = new Set(manifest.canonicalTypes);
  for (const port of definition.ports) {
    if (!canonicalTypes.has(port.type)) {
      fail(file, `port ${definition.id}.${port.id} uses non-canonical type ${port.type}`);
    }
    for (const acceptedType of port.accepts ?? []) {
      if (!canonicalTypes.has(acceptedType)) {
        fail(file, `port ${definition.id}.${port.id} accepts non-canonical type ${acceptedType}`);
      }
    }
  }
}

function validateBuiltinFixtureHelp(file, help, id, manifest, nodeDefinitions) {
  if (help.schema !== "skenion.node.help") {
    fail(file, "schema must be skenion.node.help");
  }
  if (help.schemaVersion !== "0.1.0") {
    fail(file, "schemaVersion must be 0.1.0");
  }
  if (help.id !== id) {
    fail(file, `help id ${help.id} does not match fixture id ${id}`);
  }
  for (const key of ["summary", "description", "helpGraph"]) {
    requireString(file, help[key], key);
  }
  if (!Array.isArray(help.tags) || help.tags.length === 0) {
    fail(file, "tags must be a non-empty array");
  }
  for (const tag of help.tags) {
    requireString(file, tag, "tag");
  }
  duplicateCheck(file, help.tags, "help tag");
  if (!manifest.nodes.includes(help.id)) {
    fail(file, `help is not listed in fixture manifest: ${help.id}`);
  }
  const expectedHelpGraph = `help/v0.1/nodes/${id}.help.graph.json`;
  if (help.helpGraph !== expectedHelpGraph) {
    fail(file, `helpGraph must be ${expectedHelpGraph}`);
  }
  if (help.example?.graph !== undefined && help.example.graph !== expectedHelpGraph) {
    fail(file, `example graph must be ${expectedHelpGraph}`);
  }
  for (const relatedNode of help.relatedNodes ?? []) {
    if (!manifest.nodes.includes(relatedNode)) {
      fail(file, `related node is not listed in fixture manifest: ${relatedNode}`);
    }
  }

  const definition = nodeDefinitions.get(help.id);
  const portIds = new Set((definition?.ports ?? []).map((port) => port.id));
  for (const port of help.ports ?? []) {
    requireString(file, port.id, "help port id");
    requireString(file, port.description, `help port ${port.id} description`);
    if (!portIds.has(port.id)) {
      fail(file, `help port is not declared by node definition: ${help.id}.${port.id}`);
    }
  }
}

function validateBuiltinFixtureHelpGraph(file, graph, id, manifest) {
  validateDocument(file, graph, validators);
  if (graph.id !== `help-${id.replaceAll(".", "-")}`) {
    fail(file, `help graph id must be help-${id.replaceAll(".", "-")}`);
  }
  const fixtureKinds = new Set(manifest.nodes);
  for (const node of graph.nodes) {
    if (!fixtureKinds.has(node.kind)) {
      fail(file, `help graph fixture node ${node.id} uses kind ${node.kind} outside the fixture manifest`);
    }
    if (node.kindVersion !== "0.1.0") {
      fail(file, `help graph node ${node.id} kindVersion must be 0.1.0`);
    }
  }
}

async function validateBuiltinsAndHelp() {
  const manifestFile = "builtins/v0.1/builtins.manifest.json";
  const manifest = await readJson(manifestFile);
  validateBuiltinFixtureManifest(manifestFile, manifest);

  const nodeFiles = (await walk("builtins/v0.1/nodes"))
    .filter((file) => file.endsWith(".node.json"));
  const helpFiles = (await walk("builtins/v0.1/help"))
    .filter((file) => file.endsWith(".help.json"));
  const helpGraphFiles = (await walk("help/v0.1/nodes"))
    .filter((file) => file.endsWith(".help.graph.json"));

  const nodeIds = nodeFiles.map((file) => path.basename(file, ".node.json"));
  const helpIds = helpFiles.map((file) => path.basename(file, ".help.json"));
  const helpGraphIds = helpGraphFiles.map((file) => path.basename(file, ".help.graph.json"));
  assertSameSet(manifestFile, nodeIds, manifest.nodes, "fixture node file ids");
  assertSameSet(manifestFile, helpIds, manifest.nodes, "fixture help file ids");
  assertSameSet(manifestFile, helpGraphIds, manifest.nodes, "fixture help graph file ids");

  const nodeDefinitions = new Map();
  for (const file of nodeFiles) {
    const id = path.basename(file, ".node.json");
    const definition = await readJson(file);
    validateBuiltinFixtureNodeDefinition(file, definition, id, manifest);
    nodeDefinitions.set(definition.id, definition);
  }

  for (const file of helpFiles) {
    const id = path.basename(file, ".help.json");
    validateBuiltinFixtureHelp(file, await readJson(file), id, manifest, nodeDefinitions);
  }

  for (const file of helpGraphFiles) {
    const id = path.basename(file, ".help.graph.json");
    validateBuiltinFixtureHelpGraph(file, await readJson(file), id, manifest);
  }

  return {
    nodeCount: nodeFiles.length,
    helpCount: helpFiles.length,
    helpGraphCount: helpGraphFiles.length
  };
}

async function validatePublicDocs() {
  const docFiles = [
    ...(await walk("docs")),
    "README.md",
    "packages/ts/README.md",
    "packages/rust/README.md"
  ].filter((file) => file.endsWith(".md"));
  const singularRuntimeSessionRoute = /\/v0\/session(?!s)(?:\/|`|\s|$)/;

  for (const file of docFiles) {
    const text = await readFile(file, "utf8");
    if (singularRuntimeSessionRoute.test(text)) {
      fail(file, "removed singular Runtime route /v0/session is documented");
    }
  }

  return docFiles.length;
}

function normalizedPath(file) {
  return file.split(path.sep).join("/");
}

function isExplicitlyLoadedSchemaFile(file) {
  const normalized = normalizedPath(file);
  return [
    "json-schema/extension/v0.1/",
    "json-schema/compatibility-matrix/v0.1/",
    "json-schema/graph/v0.1/",
    "json-schema/node/v0.1/",
    "json-schema/project/v0.1/",
    "json-schema/runtime/v0.1/",
    "json-schema/view/v0.1/"
  ].some((prefix) => normalized.startsWith(prefix));
}

const schemaFiles = (await walk("json-schema"))
  .filter((file) => file.endsWith(".json"))
  .filter((file) => !isExplicitlyLoadedSchemaFile(file));
for (const file of schemaFiles) {
  await readJson(file);
}

const ajv = new Ajv2020({ allErrors: true });
const graphV01Schema = await readJson("json-schema/graph/v0.1/graph.schema.json");
const graphFragmentV01Schema = await readJson("json-schema/graph/v0.1/fragment.schema.json");
const viewStateV01Schema = await readJson("json-schema/view/v0.1/view-state.schema.json");
const projectV01Schema = await readJson("json-schema/project/v0.1/project.schema.json");
const runtimeSessionLoadRequestV01Schema = await readJson("json-schema/runtime/v0.1/session-load-request.schema.json");
const nodeDefinitionV01Schema = await readJson("json-schema/node/v0.1/node-definition.schema.json");
const nodeCatalogV01Schema = await readJson("json-schema/node-catalog/v0.1/node-catalog.schema.json");
const extensionManifestV01Schema = await readJson("json-schema/extension/v0.1/extension-manifest.schema.json");
const packageManifestV01Schema = await readJson("json-schema/package/v0.1/package-manifest.schema.json");
const packageListingV01Schema = await readJson("json-schema/package/v0.1/package-listing.schema.json");
const packageDiscoveryV01Schema = await readJson("json-schema/package/v0.1/package-discovery.schema.json");
const packageInstallPlanRequestV01Schema = await readJson("json-schema/package/v0.1/package-install-plan-request.schema.json");
const packageInstallPlanResponseV01Schema = await readJson("json-schema/package/v0.1/package-install-plan-response.schema.json");
const compatibilityMatrixV01Schema = await readJson("json-schema/compatibility-matrix/v0.1/compatibility-matrix.schema.json");
ajv.addSchema(graphV01Schema);
ajv.addSchema(graphFragmentV01Schema);
ajv.addSchema(viewStateV01Schema);
ajv.addSchema(nodeDefinitionV01Schema);
ajv.addSchema(projectV01Schema);
ajv.addSchema(runtimeSessionLoadRequestV01Schema);
ajv.addSchema(packageListingV01Schema);
ajv.addSchema(packageInstallPlanRequestV01Schema);
ajv.addSchema(compatibilityMatrixV01Schema);
const validators = {
  graphV01: ajv.compile(graphV01Schema),
  graphFragmentV01: ajv.compile(graphFragmentV01Schema),
  viewStateV01: ajv.compile(viewStateV01Schema),
  projectV01: ajv.compile(projectV01Schema),
  runtimeSessionLoadRequestV01: ajv.compile(runtimeSessionLoadRequestV01Schema),
  nodeDefinitionV01: ajv.compile(nodeDefinitionV01Schema),
  nodeCatalogV01: ajv.compile(nodeCatalogV01Schema),
  shaderInterfaceV01: ajv.compile(
    await readJson("json-schema/shader/v0.1/shader-interface.schema.json")
  ),
  objectTextParseResultV01: ajv.compile(
    await readJson("json-schema/object-text/v0.1/parse-result.schema.json")
  ),
  extensionManifestV01: ajv.compile(extensionManifestV01Schema),
  packageManifestV01: ajv.compile(packageManifestV01Schema),
  packageListingV01: ajv.compile(packageListingV01Schema),
  packageDiscoveryV01: ajv.compile(packageDiscoveryV01Schema),
  packageInstallPlanRequestV01: ajv.compile(packageInstallPlanRequestV01Schema),
  packageInstallPlanResponseV01: ajv.compile(packageInstallPlanResponseV01Schema),
  compatibilityMatrixV01: ajv.compile(compatibilityMatrixV01Schema)
};

const fixtureFiles = (await walk("fixtures"))
  .filter((file) => file.endsWith(".json"));
const validFixtureFiles = fixtureFiles.filter((file) => !file.includes(`${path.sep}invalid${path.sep}`));
const invalidFixtureFiles = fixtureFiles.filter((file) => file.includes(`${path.sep}invalid${path.sep}`));

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

const builtinsSummary = await validateBuiltinsAndHelp();
const docCount = await validatePublicDocs();

console.log(
  `validated ${schemaFiles.length} schemas, ${validFixtureFiles.length} valid fixtures, ${invalidFixtureFiles.length} invalid fixtures, ${builtinsSummary.nodeCount} builtin fixture node definitions, ${builtinsSummary.helpCount} fixture help files, ${builtinsSummary.helpGraphCount} fixture help graphs, and ${docCount} public docs`
);
