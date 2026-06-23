import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  builtinNodeDefinitionsV01,
  CONTRACTS_COMPATIBILITY_LINE,
  CONTRACTS_COMPATIBILITY_RANGE,
  CONTRACTS_PACKAGE_VERSION,
  getBuiltinNodeDefinition,
  getBuiltinNodeHelp,
  getBuiltinNodeHelpGraph,
  compatibilityMatrixV01Schema,
  createDefaultViewStateForGraph,
  derivePatchContractV01,
  derivePatchContractsV01,
  deriveV0CompatibilityLine,
  deriveV0CompatibilityRange,
  controlMessageV01Schema,
  extensionManifestV01Schema,
  graphFragmentV01Schema,
  graphV01Schema,
  nodeDefinitionV01Schema,
  objectTextParseResultV01Schema,
  planAudioClockBridgeV01,
  planConversion,
  projectV01Schema,
  releaseTrainV01Schema,
  runtimeCollaborationV0Schema,
  runtimeOperationV0Schema,
  runtimeSessionV0Schema,
  parseObjectTextV01,
  representationForDataType,
  representationRegistryV01,
  shaderDiagnosticV01Schema,
  shaderInterfaceV01Schema,
  viewStateV01Schema,
  analyzeShaderInterfaceV01,
  shaderInterfaceToPortsV01,
  analyzeGraphDocumentV01,
  analyzeGraphFragmentV01,
  applyMidiClockMessageV01,
  createInitialMidiClockSnapshotV01,
  midiClockSnapshotToClockStateV01,
  parseMidiClockMessageV01,
  validateControlMessage,
  validateExtensionManifestV01,
  validateObjectTextParseResult,
  validateGraphDocument,
  validateGraphDocumentV01,
  validateGraphFragmentV01,
  validateNodeDefinition,
  validateNodeDefinitionV01,
  validatePatchDefinitionV01,
  validatePasteGraphFragmentRequest,
  validatePasteGraphFragmentResponse,
  validateProjectDocument,
  validateProjectDocumentV01,
  validateReleaseTrainManifestV01,
  validateCompatibilityMatrixV01,
  validateRuntimeCollaborationEventEnvelope,
  validateRuntimeCollaborationOperationBatch,
  validateRuntimeCollaborationOperationBatchResult,
  validateRuntimeCollaborationOperationEnvelope,
  validateRuntimeCollaborationOperationResult,
  validateRuntimeCollaborationPresenceEnvelope,
  validateRuntimeCollaborationSelectionEnvelope,
  validateRuntimeOperationEnvelope,
  validateRuntimeSessionEvent,
  validateRuntimeSessionInfoResponse,
  validateViewState,
  validateViewStateV01,
  validateShaderInterface,
  isCompatibilityMatrixV01,
  isSameV0CompatibilityLine,
  isPasteGraphFragmentRequest,
  isPasteGraphFragmentResponse,
  isReleaseTrainManifestV01,
  isRuntimeOperationEnvelope,
  isRuntimeSessionEvent,
  isRuntimeSessionInfoResponse,
  satisfiesV0CompatibilityRange
} from "../dist/index.js";

const repoRoot = path.resolve(import.meta.dirname, "../../..");

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(repoRoot, relativePath), "utf8"));
}

async function fixtureFiles(relativePath) {
  const directory = path.join(repoRoot, relativePath);
  return (await readdir(directory))
    .filter((fileName) => fileName.endsWith(".json"))
    .sort()
    .map((fileName) => path.join(relativePath, fileName));
}

const tsPackageJson = await readJson("packages/ts/package.json");

test("exports active schema contracts", () => {
  assert.ok(builtinNodeDefinitionsV01.length > 0);
  assert.equal(getBuiltinNodeDefinition("render.output")?.id, "render.output");
  assert.equal(getBuiltinNodeHelp("render.output")?.id, "render.output");
  assert.equal(getBuiltinNodeHelpGraph("render.output")?.id, "help-render-output");
  assert.equal(graphV01Schema.properties.schemaVersion.const, "0.1.0");
  assert.equal(projectV01Schema.properties.schemaVersion.const, "0.1.0");
  assert.equal(viewStateV01Schema.properties.schemaVersion.const, "0.1.0");
  assert.equal(nodeDefinitionV01Schema.properties.schemaVersion.const, "0.1.0");
  assert.equal(objectTextParseResultV01Schema.properties.schema.const, "skenion.object-text.parse-result");
  assert.equal(extensionManifestV01Schema.properties.schemaVersion.const, "0.1.0");
  assert.equal(releaseTrainV01Schema.properties.schema.const, "skenion.release-train");
  assert.equal(releaseTrainV01Schema.properties["schema-version"].const, "0.1.0");
  assert.equal(compatibilityMatrixV01Schema.properties.schema.const, "skenion.compatibility-matrix");
  assert.equal(compatibilityMatrixV01Schema.properties["schema-version"].const, "0.1.0");
  assert.equal(CONTRACTS_PACKAGE_VERSION, tsPackageJson.version);
  assert.equal(CONTRACTS_COMPATIBILITY_LINE, deriveV0CompatibilityLine(CONTRACTS_PACKAGE_VERSION));
  assert.equal(CONTRACTS_COMPATIBILITY_RANGE, deriveV0CompatibilityRange(CONTRACTS_PACKAGE_VERSION));
  assert.equal(shaderInterfaceV01Schema.properties.schema.const, "skenion.shader.interface");
  assert.equal(runtimeSessionV0Schema.properties.schema.const, "skenion.runtime.session.info");
  assert.equal(
    runtimeCollaborationV0Schema.$defs.runtimeCollaborationOperationEnvelope.properties.schema.const,
    "skenion.runtime.collaboration.operation"
  );
  assert.equal(controlMessageV01Schema.properties.selector.type, "string");
  assert.deepEqual(shaderDiagnosticV01Schema.properties.phase.enum, [
    "interface-analysis",
    "source-sync",
    "wgsl-generation",
    "wgsl-compile",
    "render-pipeline",
    "render-frame"
  ]);
});

test("derives v0 compatibility lines and ranges", () => {
  assert.equal(deriveV0CompatibilityLine("0.44.0"), "0.44");
  assert.equal(deriveV0CompatibilityLine("0.44.33"), "0.44");
  assert.equal(deriveV0CompatibilityRange("0.44.33"), ">=0.44.0 <0.45.0");
  assert.equal(isSameV0CompatibilityLine("0.44.0", "0.44.33"), true);
  assert.equal(isSameV0CompatibilityLine("0.44.33", "0.45.0"), false);
  assert.equal(satisfiesV0CompatibilityRange("0.44.33", ">=0.44.0 <0.45.0"), true);
  assert.equal(satisfiesV0CompatibilityRange("0.45.0", ">=0.44.0 <0.45.0"), false);
  assert.equal(satisfiesV0CompatibilityRange("not-semver", ">=0.44.0 <0.45.0"), false);
  assert.equal(satisfiesV0CompatibilityRange("0.44.0", "not-range"), false);
  assert.equal(satisfiesV0CompatibilityRange("0.44.0", ">=0.44.0 <0.46.0"), false);
  assert.equal(satisfiesV0CompatibilityRange("0.44.0", ">=1.44.0 <1.45.0"), false);
  assert.equal(isSameV0CompatibilityLine("not-semver", "0.44.0"), false);
  assert.throws(() => deriveV0CompatibilityLine("not-semver"), /SemVer/);
  assert.throws(() => deriveV0CompatibilityLine("1.0.0"), /v0 SemVer/);
  assert.throws(() => deriveV0CompatibilityRange("1.0.0"), /v0 SemVer/);
});

test("validates compatibility matrix fixtures and semantic failures", async () => {
  const matrix = await readJson(
    "fixtures/compatibility-matrix/v0.1/valid/unequal-component-versions.compatibility-matrix.json"
  );
  const result = validateCompatibilityMatrixV01(matrix);

  assert.equal(result.ok, true);
  assert.equal(isCompatibilityMatrixV01(matrix), true);
  assert.equal(matrix.schema, "skenion.compatibility-matrix");
  assert.equal(matrix["contracts-line"], "0.45");
  assert.equal(matrix.components.contracts.npm.version, "0.45.0");
  assert.equal(matrix.components.runtime.version, "0.44.2");
  assert.equal(matrix.components.sdk.npm.version, "0.17.0");
  assert.equal(matrix.components.studio.version, "0.44.5");
  assert.equal(matrix.components.docs.manual.version, "0.44.1");

  const incompatibleSdkRange = structuredClone(matrix);
  incompatibleSdkRange.components.sdk["supported-contracts-range"] = ">=0.44.0 <0.45.0";
  const incompatibleSdkRangeResult = validateCompatibilityMatrixV01(incompatibleSdkRange);
  assert.equal(incompatibleSdkRangeResult.ok, false);
  assert.match(incompatibleSdkRangeResult.errors.join("\n"), /supported-contracts-range/);

  const missingRuntimeArtifact = structuredClone(matrix);
  delete missingRuntimeArtifact.components.runtime.assets["aarch64-apple-darwin"];
  const missingRuntimeArtifactResult = validateCompatibilityMatrixV01(missingRuntimeArtifact);
  assert.equal(missingRuntimeArtifactResult.ok, false);
  assert.match(missingRuntimeArtifactResult.errors.join("\n"), /aarch64-apple-darwin/);

  const checksumMismatch = structuredClone(matrix);
  checksumMismatch.verification["expected-checksums"]["runtime-aarch64-apple-darwin"].value =
    "0000000000000000000000000000000000000000000000000000000000000000";
  const checksumMismatchResult = validateCompatibilityMatrixV01(checksumMismatch);
  assert.equal(checksumMismatchResult.ok, false);
  assert.match(checksumMismatchResult.errors.join("\n"), /checksum value must match/);

  const unpromotedDocs = structuredClone(matrix);
  unpromotedDocs.components.docs.manual["pages-deployed"] = false;
  unpromotedDocs.components.docs.manual["promoted-latest"] = false;
  const unpromotedDocsResult = validateCompatibilityMatrixV01(unpromotedDocs);
  assert.equal(unpromotedDocsResult.ok, false);
  assert.match(unpromotedDocsResult.errors.join("\n"), /docs Pages manual|docs manual promoted latest/);

  const identityAndLineFailures = structuredClone(matrix);
  identityAndLineFailures.components.contracts.npm.name = "@skenion/not-contracts";
  identityAndLineFailures.components.contracts.crate.name = "not-skenion-contracts";
  identityAndLineFailures.components.sdk.npm.name = "@skenion/not-sdk";
  identityAndLineFailures["contracts-line"] = "0.44";
  identityAndLineFailures["contracts-range"] = ">=0.44.0 <0.45.0";
  identityAndLineFailures.components.contracts.crate.version = "0.44.33";
  const identityAndLineFailuresResult = validateCompatibilityMatrixV01(identityAndLineFailures);
  assert.equal(identityAndLineFailuresResult.ok, false);
  assert.match(
    identityAndLineFailuresResult.errors.join("\n"),
    /@skenion\/contracts|skenion-contracts|@skenion\/sdk|contracts-line|contracts-range|same v0 compatibility line/
  );

  const invalidContractsVersion = structuredClone(matrix);
  invalidContractsVersion.components.contracts.npm.version = "1.0.0";
  const invalidContractsVersionResult = validateCompatibilityMatrixV01(invalidContractsVersion);
  assert.equal(invalidContractsVersionResult.ok, false);
  assert.match(invalidContractsVersionResult.errors.join("\n"), /v0 SemVer/);

  const artifactShapeFailures = structuredClone(matrix);
  artifactShapeFailures.components.runtime.assets["aarch64-apple-darwin"].target = "x86_64-apple-darwin";
  artifactShapeFailures.components.runtime.assets["x86_64-apple-darwin"].kind = "studio-web-bundle";
  artifactShapeFailures.components.studio["web-assets"][0].kind = "runtime-binary";
  artifactShapeFailures.components.studio["desktop-assets"]["x86_64-apple-darwin"].id =
    "runtime-aarch64-apple-darwin";
  const artifactShapeFailuresResult = validateCompatibilityMatrixV01(artifactShapeFailures);
  assert.equal(artifactShapeFailuresResult.ok, false);
  assert.match(
    artifactShapeFailuresResult.errors.join("\n"),
    /target must match map key|kind must be|studio-web-bundle|duplicate compatibility matrix artifact id/
  );

  const checksumReferenceFailures = structuredClone(matrix);
  checksumReferenceFailures.verification["expected-checksums"]["unknown-artifact"] = {
    algorithm: "sha256",
    value: "abababababababababababababababababababababababababababababababab"
  };
  checksumReferenceFailures.components.runtime.assets["aarch64-apple-darwin"].checksum.value = null;
  const checksumReferenceFailuresResult = validateCompatibilityMatrixV01(checksumReferenceFailures);
  assert.equal(checksumReferenceFailuresResult.ok, false);
  assert.match(
    checksumReferenceFailuresResult.errors.join("\n"),
    /unknown artifact|must be populated|requires checksum/
  );

  const unpassedExamples = structuredClone(matrix);
  unpassedExamples.components.examples["conformance-status"] = "pending";
  const unpassedExamplesResult = validateCompatibilityMatrixV01(unpassedExamples);
  assert.equal(unpassedExamplesResult.ok, false);
  assert.match(unpassedExamplesResult.errors.join("\n"), /examples conformance/);
});

test("validates release train manifest fixtures", async () => {
  const manifest = await readJson("fixtures/release-train/v0.1/valid/0.43.0.release-train.json");
  const result = validateReleaseTrainManifestV01(manifest);

  assert.equal(result.ok, true);
  assert.equal(isReleaseTrainManifestV01(manifest), true);
  assert.equal(manifest.schema, "skenion.release-train");
  assert.equal(manifest["schema-version"], "0.1.0");
  assert.equal(manifest["train-id"], "0.43");
  assert.equal(manifest["train-version"], "0.43.0");
  assert.equal(manifest["protocol-baselines"].graph, "0.1");
  assert.equal(manifest["protocol-baselines"]["runtime-http"], "v0");
  assert.equal(manifest["capability-set"]["protocol-surfaces"].graph, "0.1");
  assert.equal(manifest["capability-set"].runtime.collaboration, "server-authoritative-ot");
  assert.deepEqual(manifest["capability-set"].studio["connection-profiles"], ["local-managed", "local-shared", "remote"]);
  assert.equal(manifest["capability-set"].marketplace["package-install"], true);
  assert.equal(manifest["capability-set"].manual["versioned-paths"], true);
  assert.equal(manifest.components.runtime.binaries["aarch64-apple-darwin"]["support-tier"], "release-blocking");
  assert.equal(manifest.components.runtime.binaries["aarch64-pc-windows-msvc"]["support-tier"], "preview");
  assert.equal(manifest.components.studio["runtime-sidecars"]["x86_64-unknown-linux-gnu"].version, "0.43.0");
  assert.equal(manifest.components.runtime.binaries["aarch64-apple-darwin"].source.repository, "skenion/skenion-runtime");
  assert.equal(manifest.components.studio["desktop-packages"]["aarch64-apple-darwin"].source.repository, "skenion/skenion-studio");
  assert.equal(
    manifest.components.studio["desktop-packages"]["aarch64-apple-darwin"].name,
    "skenion-studio-aarch64-apple-darwin.tar.gz"
  );
  assert.equal(manifest.components.studio["web-bundle"].id, "studio-web-bundle");
  assert.equal(manifest.components.studio["web-bundle"].name, "skenion-studio-web-bundle-v0.43.0.tar.gz");
  assert.equal(manifest.components.studio["web-bundle"].source.repository, "skenion/skenion-studio");
  assert.equal(manifest.components.studio["web-bundle"].checksum.algorithm, "sha256");
  assert.equal(
    manifest["release-gates"]["github-release-assets"].studio["artifact-ids"].includes("studio-web-bundle"),
    true
  );
  assert.equal(manifest["release-gates"]["checksum-verification"]["artifact-ids"].includes("studio-web-bundle"), true);
  assert.equal(manifest.components.examples.repository, "skenion/skenion-examples");
  assert.equal(manifest.components.docs.manual.path, "/manual/0.43/");
  assert.equal(manifest.components.docs.manual["pages-url"], "https://skenion.github.io/skenion-docs/manual/0.43/");

  const invalidCases = [
    ["fixtures/release-train/v0.1/invalid/missing-runtime-artifact.release-train.json", /aarch64-apple-darwin/],
    ["fixtures/release-train/v0.1/invalid/checksum-mismatch.release-train.json", /checksum gate value/],
    ["fixtures/release-train/v0.1/invalid/invalid-checksum.release-train.json", /pattern|sha256/],
    ["fixtures/release-train/v0.1/invalid/pinned-checksum-null-artifact.release-train.json", /must be populated/],
    ["fixtures/release-train/v0.1/invalid/contracts-runtime-mismatch.release-train.json", /runtime binary/],
    ["fixtures/release-train/v0.1/invalid/studio-sidecar-mismatch.release-train.json", /studio runtime-sidecars/],
    ["fixtures/release-train/v0.1/invalid/examples-mismatch.release-train.json", /examples version/],
    ["fixtures/release-train/v0.1/invalid/manual-pages-mismatch.release-train.json", /pages-url/],
    ["fixtures/release-train/v0.1/invalid/registry-package-gate-mismatch.release-train.json", /release-gates\.registry-packages\.contracts-npm/],
    ["fixtures/release-train/v0.1/invalid/missing-capability-set.release-train.json", /capability-set/]
  ];

  for (const [fixture, expected] of invalidCases) {
    const invalid = await readJson(fixture);
    const invalidResult = validateReleaseTrainManifestV01(invalid);

    assert.equal(invalidResult.ok, false, fixture);
    assert.match(invalidResult.errors.join("\n"), expected, fixture);
    assert.equal(isReleaseTrainManifestV01(invalid), false, fixture);
  }

  const trainIdMismatch = structuredClone(manifest);
  trainIdMismatch["train-id"] = "0.44";
  const trainIdMismatchResult = validateReleaseTrainManifestV01(trainIdMismatch);
  assert.equal(trainIdMismatchResult.ok, false);
  assert.match(trainIdMismatchResult.errors.join("\n"), /train-version/);

  const registryGatePackageMismatch = structuredClone(manifest);
  registryGatePackageMismatch["release-gates"]["registry-packages"]["contracts-npm"].package.version = "0.42.0";
  const registryGatePackageMismatchResult = validateReleaseTrainManifestV01(registryGatePackageMismatch);
  assert.equal(registryGatePackageMismatchResult.ok, false);
  assert.match(registryGatePackageMismatchResult.errors.join("\n"), /release-gates\.registry-packages\.contracts-npm/);

  const sdkPackageVersionMismatch = structuredClone(manifest);
  sdkPackageVersionMismatch.components.sdk.npm.version = "0.42.0";
  const sdkPackageVersionMismatchResult = validateReleaseTrainManifestV01(sdkPackageVersionMismatch);
  assert.equal(sdkPackageVersionMismatchResult.ok, false);
  assert.match(sdkPackageVersionMismatchResult.errors.join("\n"), /sdk npm version/);

  const runtimeCrateComponent = structuredClone(manifest);
  runtimeCrateComponent.components.runtime.crate = {
    ecosystem: "crates.io",
    name: "skenion-runtime",
    version: "0.43.0",
    url: null
  };
  const runtimeCrateComponentResult = validateReleaseTrainManifestV01(runtimeCrateComponent);
  assert.equal(runtimeCrateComponentResult.ok, false);
  assert.match(runtimeCrateComponentResult.errors.join("\n"), /additional properties/);

  const studioRegistryComponents = structuredClone(manifest);
  studioRegistryComponents.components.studio.web = {
    ecosystem: "npm",
    name: "@skenion/studio-web",
    version: "0.43.0",
    url: null
  };
  studioRegistryComponents.components.studio.desktop = {
    ecosystem: "npm",
    name: "@skenion/studio-desktop",
    version: "0.43.0",
    url: null
  };
  const studioRegistryComponentsResult = validateReleaseTrainManifestV01(studioRegistryComponents);
  assert.equal(studioRegistryComponentsResult.ok, false);
  assert.match(studioRegistryComponentsResult.errors.join("\n"), /additional properties/);

  const productRegistryGate = structuredClone(manifest);
  productRegistryGate["release-gates"]["registry-packages"].runtimeCrate = {
    id: "runtime-crate-exists",
    status: "pending",
    required: true,
    package: {
      ecosystem: "crates.io",
      name: "skenion-runtime",
      version: "0.43.0",
      url: null
    }
  };
  const productRegistryGateResult = validateReleaseTrainManifestV01(productRegistryGate);
  assert.equal(productRegistryGateResult.ok, false);
  assert.match(productRegistryGateResult.errors.join("\n"), /additional properties/);

  const capabilitySurfaceMismatch = structuredClone(manifest);
  capabilitySurfaceMismatch["capability-set"]["protocol-surfaces"].graph = "0.2";
  const capabilitySurfaceMismatchResult = validateReleaseTrainManifestV01(capabilitySurfaceMismatch);
  assert.equal(capabilitySurfaceMismatchResult.ok, false);
  assert.match(capabilitySurfaceMismatchResult.errors.join("\n"), /capability-set protocol-surfaces|constant/);

  const runtimeProfileMismatch = structuredClone(manifest);
  runtimeProfileMismatch["capability-set"].runtime["connection-profiles"] = ["local-managed"];
  const runtimeProfileMismatchResult = validateReleaseTrainManifestV01(runtimeProfileMismatch);
  assert.equal(runtimeProfileMismatchResult.ok, false);
  assert.match(runtimeProfileMismatchResult.errors.join("\n"), /connection-profiles/);

  const examplesGateMismatch = structuredClone(manifest);
  examplesGateMismatch["release-gates"]["examples-conformance"].version = "0.42.0";
  const examplesGateMismatchResult = validateReleaseTrainManifestV01(examplesGateMismatch);
  assert.equal(examplesGateMismatchResult.ok, false);
  assert.match(examplesGateMismatchResult.errors.join("\n"), /examples conformance gate/);

  const examplesGateRefMismatch = structuredClone(manifest);
  examplesGateRefMismatch["release-gates"]["examples-conformance"].repository = "skenion/Other-examples";
  examplesGateRefMismatch["release-gates"]["examples-conformance"].ref = "skenion-examples-v0.42.0";
  const examplesGateRefMismatchResult = validateReleaseTrainManifestV01(examplesGateRefMismatch);
  assert.equal(examplesGateRefMismatchResult.ok, false);
  assert.match(examplesGateRefMismatchResult.errors.join("\n"), /repository|ref/);

  const runtimeRepositoryMismatch = structuredClone(manifest);
  runtimeRepositoryMismatch.components.runtime.binaries["aarch64-apple-darwin"].source.repository =
    "skenion/other-runtime";
  const runtimeRepositoryMismatchResult = validateReleaseTrainManifestV01(runtimeRepositoryMismatch);
  assert.equal(runtimeRepositoryMismatchResult.ok, false);
  assert.match(runtimeRepositoryMismatchResult.errors.join("\n"), /runtime binary.*repository/);

  const runtimeUrlSourceMismatch = structuredClone(manifest);
  runtimeUrlSourceMismatch.components.runtime.binaries["aarch64-apple-darwin"].source = {
    kind: "url",
    url: "https://example.invalid/skenion-runtime-v0.43.0-aarch64-apple-darwin.tar.gz"
  };
  const runtimeUrlSourceMismatchResult = validateReleaseTrainManifestV01(runtimeUrlSourceMismatch);
  assert.equal(runtimeUrlSourceMismatchResult.ok, false);
  assert.match(runtimeUrlSourceMismatchResult.errors.join("\n"), /source must be a GitHub release asset/);

  const githubAssetRepositoryMismatch = structuredClone(manifest);
  githubAssetRepositoryMismatch["release-gates"]["github-release-assets"].runtime.repository =
    "skenion/other-runtime";
  const githubAssetRepositoryMismatchResult = validateReleaseTrainManifestV01(githubAssetRepositoryMismatch);
  assert.equal(githubAssetRepositoryMismatchResult.ok, false);
  assert.match(githubAssetRepositoryMismatchResult.errors.join("\n"), /github-release-assets runtime repository/);

  const studioGithubAssetRepositoryMismatch = structuredClone(manifest);
  studioGithubAssetRepositoryMismatch["release-gates"]["github-release-assets"].studio.repository =
    "skenion/other-studio";
  const studioGithubAssetRepositoryMismatchResult = validateReleaseTrainManifestV01(
    studioGithubAssetRepositoryMismatch
  );
  assert.equal(studioGithubAssetRepositoryMismatchResult.ok, false);
  assert.match(studioGithubAssetRepositoryMismatchResult.errors.join("\n"), /github-release-assets studio repository/);

  const examplesRepositoryMismatch = structuredClone(manifest);
  examplesRepositoryMismatch.components.examples.repository = "skenion/Other-examples";
  const examplesRepositoryMismatchResult = validateReleaseTrainManifestV01(examplesRepositoryMismatch);
  assert.equal(examplesRepositoryMismatchResult.ok, false);
  assert.match(examplesRepositoryMismatchResult.errors.join("\n"), /examples repository/);

  const legacyRepositoryOwnerMismatch = structuredClone(manifest);
  legacyRepositoryOwnerMismatch.components.examples.repository = "echovisionlab/skenion-examples";
  const legacyRepositoryOwnerMismatchResult = validateReleaseTrainManifestV01(legacyRepositoryOwnerMismatch);
  assert.equal(legacyRepositoryOwnerMismatchResult.ok, false);
  assert.match(legacyRepositoryOwnerMismatchResult.errors.join("\n"), /pattern/);

  const docsGateVersionMismatch = structuredClone(manifest);
  docsGateVersionMismatch["release-gates"]["docs-pages-deployment"]["manual-version"] = "0.42.0";
  const docsGateVersionMismatchResult = validateReleaseTrainManifestV01(docsGateVersionMismatch);
  assert.equal(docsGateVersionMismatchResult.ok, false);
  assert.match(docsGateVersionMismatchResult.errors.join("\n"), /manual-version/);

  const docsManualPathMismatch = structuredClone(manifest);
  docsManualPathMismatch.components.docs.manual.path = "/manual/0.42/";
  docsManualPathMismatch["release-gates"]["docs-pages-deployment"]["manual-path"] = "/manual/0.42/";
  const docsManualPathMismatchResult = validateReleaseTrainManifestV01(docsManualPathMismatch);
  assert.equal(docsManualPathMismatchResult.ok, false);
  assert.match(docsManualPathMismatchResult.errors.join("\n"), /docs manual path/);

  const docsManualVersionMismatch = structuredClone(manifest);
  docsManualVersionMismatch.components.docs.manual.version = "0.42.0";
  const docsManualVersionMismatchResult = validateReleaseTrainManifestV01(docsManualVersionMismatch);
  assert.equal(docsManualVersionMismatchResult.ok, false);
  assert.match(docsManualVersionMismatchResult.errors.join("\n"), /docs manual version/);

  const docsGatePathMismatch = structuredClone(manifest);
  docsGatePathMismatch["release-gates"]["docs-pages-deployment"]["manual-path"] = "/manual/0.42/";
  const docsGatePathMismatchResult = validateReleaseTrainManifestV01(docsGatePathMismatch);
  assert.equal(docsGatePathMismatchResult.ok, false);
  assert.match(docsGatePathMismatchResult.errors.join("\n"), /manual-path/);

  const unknownChecksumArtifact = structuredClone(manifest);
  unknownChecksumArtifact["release-gates"]["checksum-verification"]["expected-checksums"] = {
    "missing-artifact": { algorithm: "sha256", value: null }
  };
  const unknownChecksumArtifactResult = validateReleaseTrainManifestV01(unknownChecksumArtifact);
  assert.equal(unknownChecksumArtifactResult.ok, false);
  assert.match(unknownChecksumArtifactResult.errors.join("\n"), /unknown artifact/);

  const checksumArtifactIdMismatch = structuredClone(manifest);
  checksumArtifactIdMismatch["release-gates"]["checksum-verification"]["artifact-ids"] = ["missing-artifact"];
  const checksumArtifactIdMismatchResult = validateReleaseTrainManifestV01(checksumArtifactIdMismatch);
  assert.equal(checksumArtifactIdMismatchResult.ok, false);
  assert.match(checksumArtifactIdMismatchResult.errors.join("\n"), /checksum-verification/);

  const githubAssetIdMismatch = structuredClone(manifest);
  githubAssetIdMismatch["release-gates"]["github-release-assets"].runtime["artifact-ids"] = ["missing-artifact"];
  const githubAssetIdMismatchResult = validateReleaseTrainManifestV01(githubAssetIdMismatch);
  assert.equal(githubAssetIdMismatchResult.ok, false);
  assert.match(githubAssetIdMismatchResult.errors.join("\n"), /github-release-assets runtime/);

  const studioDesktopNameMismatch = structuredClone(manifest);
  studioDesktopNameMismatch.components.studio["desktop-packages"]["aarch64-apple-darwin"].name =
    "bad-studio-name.tar.gz";
  studioDesktopNameMismatch.components.studio["desktop-packages"]["aarch64-apple-darwin"].source["asset-name"] =
    "bad-studio-name.tar.gz";
  const studioDesktopNameMismatchResult = validateReleaseTrainManifestV01(studioDesktopNameMismatch);
  assert.equal(studioDesktopNameMismatchResult.ok, false);
  assert.match(studioDesktopNameMismatchResult.errors.join("\n"), /studio desktop package.*name/);

  const studioWebBundleNameMismatch = structuredClone(manifest);
  studioWebBundleNameMismatch.components.studio["web-bundle"].name = "studio-web.tar.gz";
  const studioWebBundleNameMismatchResult = validateReleaseTrainManifestV01(studioWebBundleNameMismatch);
  assert.equal(studioWebBundleNameMismatchResult.ok, false);
  assert.match(studioWebBundleNameMismatchResult.errors.join("\n"), /components\.studio\["web-bundle"\]\.name/);

  const studioWebBundleVersionAndSourceMismatch = structuredClone(manifest);
  studioWebBundleVersionAndSourceMismatch.components.studio["web-bundle"].version = "0.42.0";
  studioWebBundleVersionAndSourceMismatch.components.studio["web-bundle"].source = {
    kind: "url",
    url: "https://example.invalid/skenion-studio-web-bundle-v0.43.0.tar.gz"
  };
  const studioWebBundleVersionAndSourceMismatchResult = validateReleaseTrainManifestV01(
    studioWebBundleVersionAndSourceMismatch
  );
  assert.equal(studioWebBundleVersionAndSourceMismatchResult.ok, false);
  assert.match(
    studioWebBundleVersionAndSourceMismatchResult.errors.join("\n"),
    /components\.studio\["web-bundle"\]\.version|source/
  );

  const studioWebBundleReleaseAssetMismatch = structuredClone(manifest);
  studioWebBundleReleaseAssetMismatch.components.studio["web-bundle"].source.repository =
    "skenion/other-studio";
  studioWebBundleReleaseAssetMismatch.components.studio["web-bundle"].source.tag = "skenion-studio-v0.42.0";
  studioWebBundleReleaseAssetMismatch.components.studio["web-bundle"].source["asset-name"] = "studio-web.tar.gz";
  const studioWebBundleReleaseAssetMismatchResult = validateReleaseTrainManifestV01(
    studioWebBundleReleaseAssetMismatch
  );
  assert.equal(studioWebBundleReleaseAssetMismatchResult.ok, false);
  assert.match(
    studioWebBundleReleaseAssetMismatchResult.errors.join("\n"),
    /components\.studio\["web-bundle"\]\.repository|tag|asset-name/
  );

  const studioWebBundleGateMissing = structuredClone(manifest);
  studioWebBundleGateMissing["release-gates"]["github-release-assets"].studio["artifact-ids"] =
    studioWebBundleGateMissing["release-gates"]["github-release-assets"].studio["artifact-ids"].filter(
      (artifactId) => artifactId !== "studio-web-bundle"
    );
  const studioWebBundleGateMissingResult = validateReleaseTrainManifestV01(studioWebBundleGateMissing);
  assert.equal(studioWebBundleGateMissingResult.ok, false);
  assert.match(studioWebBundleGateMissingResult.errors.join("\n"), /components\.studio\["web-bundle"\]\.id/);

  const studioWebBundleChecksumGateMissing = structuredClone(manifest);
  studioWebBundleChecksumGateMissing["release-gates"]["checksum-verification"]["artifact-ids"] =
    studioWebBundleChecksumGateMissing["release-gates"]["checksum-verification"]["artifact-ids"].filter(
      (artifactId) => artifactId !== "studio-web-bundle"
    );
  const studioWebBundleChecksumGateMissingResult = validateReleaseTrainManifestV01(
    studioWebBundleChecksumGateMissing
  );
  assert.equal(studioWebBundleChecksumGateMissingResult.ok, false);
  assert.match(studioWebBundleChecksumGateMissingResult.errors.join("\n"), /checksum-verification.*web-bundle/);

  const runtimeSmokeTargetMismatch = structuredClone(manifest);
  runtimeSmokeTargetMismatch["release-gates"]["runtime-smoke"]["aarch64-apple-darwin"].target = "x86_64-apple-darwin";
  const runtimeSmokeTargetMismatchResult = validateReleaseTrainManifestV01(runtimeSmokeTargetMismatch);
  assert.equal(runtimeSmokeTargetMismatchResult.ok, false);
  assert.match(runtimeSmokeTargetMismatchResult.errors.join("\n"), /target must match map key/);

  const runtimeSmokeMismatch = structuredClone(manifest);
  runtimeSmokeMismatch["release-gates"]["runtime-smoke"]["aarch64-apple-darwin"]["artifact-id"] = "runtime-x86_64-apple-darwin";
  const runtimeSmokeMismatchResult = validateReleaseTrainManifestV01(runtimeSmokeMismatch);
  assert.equal(runtimeSmokeMismatchResult.ok, false);
  assert.match(runtimeSmokeMismatchResult.errors.join("\n"), /runtime-smoke/);

  const studioSmokeTargetMismatch = structuredClone(manifest);
  studioSmokeTargetMismatch["release-gates"]["studio-package-smoke"]["aarch64-apple-darwin"].target =
    "x86_64-apple-darwin";
  const studioSmokeTargetMismatchResult = validateReleaseTrainManifestV01(studioSmokeTargetMismatch);
  assert.equal(studioSmokeTargetMismatchResult.ok, false);
  assert.match(studioSmokeTargetMismatchResult.errors.join("\n"), /target must match map key/);

  const studioDesktopSmokeMismatch = structuredClone(manifest);
  studioDesktopSmokeMismatch["release-gates"]["studio-package-smoke"]["aarch64-apple-darwin"]["desktop-package-artifact-id"] =
    "studio-desktop-x86_64-apple-darwin";
  const studioDesktopSmokeMismatchResult = validateReleaseTrainManifestV01(studioDesktopSmokeMismatch);
  assert.equal(studioDesktopSmokeMismatchResult.ok, false);
  assert.match(studioDesktopSmokeMismatchResult.errors.join("\n"), /desktop-package-artifact-id/);

  const studioSmokeMismatch = structuredClone(manifest);
  studioSmokeMismatch["release-gates"]["studio-package-smoke"]["aarch64-apple-darwin"]["runtime-sidecar-artifact-id"] =
    "studio-runtime-sidecar-x86_64-apple-darwin";
  const studioSmokeMismatchResult = validateReleaseTrainManifestV01(studioSmokeMismatch);
  assert.equal(studioSmokeMismatchResult.ok, false);
  assert.match(studioSmokeMismatchResult.errors.join("\n"), /studio-package-smoke/);
});

test("validates runtime session profile and replay fixtures", async () => {
  const infoFixtures = [
    "fixtures/runtime-session/v0/valid/local-managed-session-info.json",
    "fixtures/runtime-session/v0/valid/local-shared-session-info.json",
    "fixtures/runtime-session/v0/valid/remote-session-info.json"
  ];

  for (const fixture of infoFixtures) {
    const info = await readJson(fixture);
    const infoResult = validateRuntimeSessionInfoResponse(info);

    assert.equal(infoResult.ok, true, fixture);
    assert.equal(isRuntimeSessionInfoResponse(info), true, fixture);
    assert.equal(info.capabilities.authPolicy, "deferred");
  }

  const localManaged = await readJson("fixtures/runtime-session/v0/valid/local-managed-session-info.json");
  assert.equal(localManaged.profile.mode, "local-managed");
  assert.equal(localManaged.profile.ownership, "owned-child");
  assert.deepEqual(localManaged.capabilities.profiles, ["local-managed", "local-shared", "remote"]);

  const event = await readJson("fixtures/runtime-session/v0/valid/replayed-session-event.json");
  const eventResult = validateRuntimeSessionEvent(event);

  assert.equal(eventResult.ok, true);
  assert.equal(isRuntimeSessionEvent(event), true);
  assert.equal(event.sessionId, "session-a");
  assert.equal(event.sessionRevision, event.snapshot.sessionRevision);
  assert.equal(event.replay.gap.reason, "retention-overflow");

  const invalidInfoFixtures = [
    "fixtures/runtime-session/v0/invalid/invalid-profile-mode.session-info.json",
    "fixtures/runtime-session/v0/invalid/ownership-mismatch.session-info.json",
    "fixtures/runtime-session/v0/invalid/empty-profile-metadata.session-info.json"
  ];

  for (const fixture of invalidInfoFixtures) {
    const invalidInfo = await readJson(fixture);
    const invalidInfoResult = validateRuntimeSessionInfoResponse(invalidInfo);

    assert.equal(invalidInfoResult.ok, false, fixture);
    assert.equal(isRuntimeSessionInfoResponse(invalidInfo), false, fixture);
  }

  const extraProfile = structuredClone(localManaged);
  extraProfile.profile.endpoint.extra = true;
  assert.equal(validateRuntimeSessionInfoResponse(extraProfile).ok, false);
  assert.equal(isRuntimeSessionInfoResponse(extraProfile), false);

  const invalidEventFixtures = [
    "fixtures/runtime-session/v0/invalid/missing-replay.session-event.json",
    "fixtures/runtime-session/v0/invalid/extra-operation-keys.session-event.json",
    "fixtures/runtime-session/v0/invalid/empty-replay-cursor.session-event.json",
    "fixtures/runtime-session/v0/invalid/replay-additional-property.session-event.json",
    "fixtures/runtime-session/v0/invalid/replay-gap-order.session-event.json",
    "fixtures/runtime-session/v0/invalid/scalar-plan.session-event.json",
    "fixtures/runtime-session/v0/invalid/nested-mutation-client-id.session-event.json",
    "fixtures/runtime-session/v0/invalid/malformed-nested-operation.session-event.json"
  ];

  for (const fixture of invalidEventFixtures) {
    const invalidEvent = await readJson(fixture);
    const invalidEventResult = validateRuntimeSessionEvent(invalidEvent);

    assert.equal(invalidEventResult.ok, false, fixture);
    assert.equal(isRuntimeSessionEvent(invalidEvent), false, fixture);
  }

  const extraViewPatchView = structuredClone(event);
  extraViewPatchView.kind = "mutate";
  extraViewPatchView.history.entries = [
    {
      id: "history-extra-view",
      sequence: 8,
      kind: "apply",
      mutation: {
        viewPatch: {
          baseViewRevision: 2,
          ops: [
            {
              op: "setNodeView",
              nodeId: "node-a",
              view: { x: 0, y: 0, extra: true }
            }
          ]
        }
      },
      inverseMutation: {
        viewPatch: {
          baseViewRevision: 3,
          ops: [
            {
              op: "moveNodeView",
              nodeId: "node-a",
              to: { x: 1, y: 1 }
            }
          ]
        }
      },
      clientId: "studio-main",
      createdAt: "2026-06-22T00:00:05.000Z"
    }
  ];
  assert.equal(validateRuntimeSessionEvent(extraViewPatchView).ok, false);
  assert.equal(isRuntimeSessionEvent(extraViewPatchView), false);

  const extraReplay = structuredClone(event);
  extraReplay.replay.extra = true;
  assert.equal(validateRuntimeSessionEvent(extraReplay).ok, false);
  assert.equal(isRuntimeSessionEvent(extraReplay), false);

  const mismatchedRevision = structuredClone(event);
  mismatchedRevision.sessionRevision = event.snapshot.sessionRevision + 1;
  assert.equal(validateRuntimeSessionEvent(mismatchedRevision).ok, false);
  assert.equal(isRuntimeSessionEvent(mismatchedRevision), false);
});

test("validates extension package manifests with help and tests", async () => {
  const currentManifest = await readJson("fixtures/extension/v0.1/valid/minimal-native-extension.manifest.json");
  const currentResult = validateExtensionManifestV01(currentManifest);

  assert.equal(currentResult.ok, true);
  assert.equal(currentManifest.schemaVersion, "0.1.0");
  assert.equal(currentManifest.provides.nodes[0].schemaVersion, "0.1.0");

  const noNodeCurrentManifest = structuredClone(currentManifest);
  noNodeCurrentManifest.kind = "core-package";
  delete noNodeCurrentManifest.native;
  delete noNodeCurrentManifest.provides.nodes;
  const noNodeCurrentResult = validateExtensionManifestV01(noNodeCurrentManifest);
  assert.equal(noNodeCurrentResult.ok, true);

  const semanticInvalidCurrentManifest = structuredClone(currentManifest);
  semanticInvalidCurrentManifest.provides.nodes[0].permissions = ["runtime.unsupported"];
  const semanticInvalidCurrentResult = validateExtensionManifestV01(semanticInvalidCurrentManifest);
  assert.equal(semanticInvalidCurrentResult.ok, false);
  assert.match(semanticInvalidCurrentResult.errors.join("\n"), /provided node example\.sensor-reading/);

  const duplicateProvidedNodeManifest =
    await readJson("fixtures/extension/v0.1/invalid/duplicate-provided-node-id.manifest.json");
  const duplicateProvidedNodeResult = validateExtensionManifestV01(duplicateProvidedNodeManifest);
  assert.equal(duplicateProvidedNodeResult.ok, false);
  assert.match(duplicateProvidedNodeResult.errors.join("\n"), /duplicate provided node id: example\.sensor-reading/);

  const legacyNodeManifest = await readJson("fixtures/extension/v0.1/invalid/legacy-node.manifest.json");
  const legacyNodeResult = validateExtensionManifestV01(legacyNodeManifest);

  assert.equal(legacyNodeResult.ok, false);
  assert.match(legacyNodeResult.errors.join("\n"), /schemaVersion must be equal to constant/);
});

test("documents runtime IO discovery HTTP API", async () => {
  const openApi = await readFile(path.join(repoRoot, "openapi/runtime-http.v0.yaml"), "utf8");

  for (const pathName of [
    "/v0/io/devices:"
  ]) {
    assert.match(openApi, new RegExp(pathName.replace(/[{}]/g, "\\$&")));
  }

  for (const legacyPath of [
    "/v0/clock/midi/inputs:",
    "/v0/clock/midi/start:",
    "/v0/clock/midi/stop:",
    "/v0/clock/sources:",
    "/v0/clock/sources/{sourceId}:"
  ]) {
    assert.doesNotMatch(openApi, new RegExp(legacyPath.replace(/[{}]/g, "\\$&")));
  }

  for (const schemaName of [
    "RuntimeIoDeviceListResponse",
    "RuntimeIoDeviceDescriptor",
    "RuntimeIoBindingConfig",
    "RuntimeIoDiagnostic",
    "RuntimeSessionInfoResponse",
    "RuntimeConnectionProfile",
    "RuntimeSessionCapabilitySet",
    "RuntimeEventReplayMetadata",
    "RuntimeOperationEnvelope",
    "PasteGraphFragmentRequest",
    "PasteGraphFragmentResponse",
    "RuntimeCollaborationOperationEnvelope",
    "RuntimeCollaborationOperationBatch",
    "RuntimeCollaborationOperationResult",
    "RuntimeCollaborationOperationBatchResult",
    "RuntimeCollaborationPresenceEnvelope",
    "RuntimeCollaborationSelectionEnvelope",
    "RuntimeCollaborationEventEnvelope",
    "GraphTargetRef",
    "PatchPath",
    "IdRemapResult",
    "RuntimeOperationDiagnostic"
  ]) {
    assert.match(openApi, new RegExp(`\\b${schemaName}:`));
  }

  assert.match(openApi, /\/v0\/sessions\/\{sessionId\}:/);
  assert.match(openApi, /\/v0\/sessions\/\{sessionId\}\/operations:/);
  assert.match(openApi, /\/v0\/sessions\/\{sessionId\}\/events\/stream:/);
  assert.doesNotMatch(openApi, /^  \/v0\/session(?:\/|:)/m);
  assert.doesNotMatch(openApi, /Compatibility\/default-session alias|defaultSessionAlias|legacy \/v0\/session/);
  assert.match(openApi, /name: since/);
  assert.match(openApi, /authPolicy:/);
  assert.match(openApi, /sessions\.events\.stream/);
  assert.match(openApi, /sessionId:/);
  assert.match(openApi, /RuntimeProjectSnapshot:\n\s+\$ref: "#\/components\/schemas\/ProjectDocumentV01"/);
  assert.match(openApi, /RuntimeMutationRequest:[\s\S]*?operation:\n\s+\$ref: "#\/components\/schemas\/RuntimeOperationEnvelope"/);
  assert.doesNotMatch(openApi, /RuntimeMutationGraphPatch:/);
  assert.doesNotMatch(openApi, /GraphDocumentV01:|GraphPatchV01:|GraphPatchEventV01:|GraphPatchHistoryV01:/);
});

test("runtime protobuf wire uses active runtime operations", async () => {
  const envelopeProto = await readFile(path.join(repoRoot, "proto/skenion/runtime/v1/envelope.proto"), "utf8");

  assert.match(envelopeProto, /message ApplyRuntimeOperation/);
  assert.match(envelopeProto, /bytes operation_json = 1;/);
  assert.match(envelopeProto, /reserved 20;/);
  assert.match(envelopeProto, /reserved "apply_graph_patch";/);
  assert.match(envelopeProto, /ApplyRuntimeOperation apply_runtime_operation = 22;/);
  assert.doesNotMatch(envelopeProto, /ApplyRuntimeOperation apply_runtime_operation = 20;|ApplyGraphPatch|patch_json/);
});

test("validates object text parse result fixtures", async () => {
  const add = await readJson("fixtures/object-text/v0.1/valid/add-int.parse.json");
  const addResult = validateObjectTextParseResult(add);

  assert.equal(addResult.ok, true);
  assert.equal(add.resolvedKind, "core.operator.add");
  assert.deepEqual(add.instancePorts.map((port) => port.id), ["in", "right", "out"]);

  const scalarAudio = await readJson("fixtures/object-text/v0.1/valid/audio-mul-scalar.parse.json");
  const scalarResult = validateObjectTextParseResult(scalarAudio);

  assert.equal(scalarResult.ok, true);
  assert.equal(scalarAudio.resolvedKind, "audio.operator.mul");
  assert.deepEqual(scalarAudio.instancePorts.map((port) => `${port.id}:${port.type}:${port.rate}`), [
    "in:signal.audio:audio",
    "right:number.float:control",
    "out:signal.audio:audio"
  ]);

  const unsupported = await readJson("fixtures/object-text/v0.1/valid/unsupported-vanilla-object.parse.json");
  const unsupportedResult = validateObjectTextParseResult(unsupported);

  assert.equal(unsupportedResult.ok, true);
  assert.equal(unsupported.ok, false);
  assert.equal(unsupported.diagnostics[0].code, "deferred-object");

  const invalid = await readJson("fixtures/object-text/v0.1/invalid/missing-class-symbol.parse.json");
  const invalidResult = validateObjectTextParseResult(invalid);

  assert.equal(invalidResult.ok, false);
  assert.match(invalidResult.errors.join("\n"), /classSymbol/);
});

test("parses object text into golden parse results", async () => {
  for (const fixture of await fixtureFiles("fixtures/object-text/v0.1/valid")) {
    const expected = await readJson(fixture);
    assert.deepEqual(parseObjectTextV01(expected.input), expected, fixture);
  }

  const raw = parseObjectTextV01("+ 1");
  assert.equal(raw.ok, true);
  assert.equal(raw.input, "+ 1");
  assert.equal(raw.displayText, "+ 1");
  assert.equal(raw.resolvedKind, "core.operator.add");

  assert.deepEqual(parseObjectTextV01("+").params, { right: 0 });
  assert.equal(parseObjectTextV01("- 2").resolvedKind, "core.operator.sub");
  assert.equal(parseObjectTextV01("pow 2").resolvedKind, "core.operator.pow");
  assert.equal(parseObjectTextV01("min 2").resolvedKind, "core.operator.min");
  assert.equal(parseObjectTextV01("max 2").resolvedKind, "core.operator.max");
  assert.equal(parseObjectTextV01("sqrt").resolvedKind, "core.operator.sqrt");
  assert.equal(parseObjectTextV01("-~ 0.25").resolvedKind, "audio.operator.sub");
  assert.deepEqual(parseObjectTextV01("osc~").params, { frequency: 0 });
  assert.deepEqual(parseObjectTextV01("phasor~").params, { frequency: 0 });
  assert.equal(parseObjectTextV01("adc~").resolvedKind, "audio.input");
  assert.equal(parseObjectTextV01("dac~").resolvedKind, "audio.output");

  assert.equal(parseObjectTextV01("[+ 1").diagnostics[0].code, "invalid-syntax");
  assert.equal(parseObjectTextV01("+ 1]").diagnostics[0].code, "invalid-syntax");
  assert.equal(parseObjectTextV01("").diagnostics[0].code, "empty-object-text");
  assert.equal(parseObjectTextV01("+ 1 2").diagnostics[0].code, "invalid-arg-count");
  assert.equal(parseObjectTextV01("+ true").diagnostics[0].code, "invalid-arg-type");
  assert.equal(parseObjectTextV01("+ false").diagnostics[0].code, "invalid-arg-type");
  assert.equal(parseObjectTextV01("+ .").diagnostics[0].code, "invalid-arg-type");
  assert.equal(parseObjectTextV01("sqrt 1").diagnostics[0].code, "invalid-arg-count");
  assert.equal(parseObjectTextV01("*~ beep").diagnostics[0].code, "invalid-arg-type");
  assert.equal(parseObjectTextV01("sqrt~ 1").diagnostics[0].code, "invalid-arg-count");
  assert.equal(parseObjectTextV01("osc~ 1 2").diagnostics[0].code, "invalid-arg-count");
  assert.equal(parseObjectTextV01("phasor~ beep").diagnostics[0].code, "invalid-arg-type");
  assert.equal(parseObjectTextV01("square~").diagnostics[0].code, "deferred-object");
  assert.equal(parseObjectTextV01("adc~ 1").diagnostics[0].code, "invalid-arg-count");
  assert.equal(parseObjectTextV01("dac~ 1").diagnostics[0].code, "invalid-arg-count");
  assert.equal(parseObjectTextV01("expr").diagnostics[0].code, "deferred-object");
  assert.equal(parseObjectTextV01("expr~").diagnostics[0].code, "deferred-object");
  assert.equal(parseObjectTextV01("fexpr~").diagnostics[0].code, "deferred-object");
});

test("validates control messages as selector and atoms", () => {
  const bang = validateControlMessage({ selector: "bang", atoms: [] });
  assert.equal(bang.ok, true);

  const set = validateControlMessage({
    selector: "set",
    atoms: [
      { type: "f32", value: 0.75 },
      { type: "float", representation: "f32", value: 0.75 },
      { type: "int", representation: "i32", value: 3 },
      { type: "uint", representation: "u8", value: 255 },
      { type: "string", value: "speed" },
      { type: "color", representation: "rgba32f", value: [1, 0.25, 0, 1] }
    ]
  });
  assert.equal(set.ok, false);
  assert.match(set.errors.join("\n"), /must be equal to constant/);

  const canonicalSet = validateControlMessage({
    selector: "set",
    atoms: [
      { type: "float", representation: "f32", value: 0.75 },
      { type: "int", representation: "i32", value: 3 },
      { type: "uint", representation: "u8", value: 255 },
      { type: "string", value: "speed" },
      { type: "color", representation: "rgba32f", value: [1, 0.25, 0, 1] }
    ]
  });
  assert.equal(canonicalSet.ok, true);

  const invalidLegacyBang = validateControlMessage({ type: "bang" });
  assert.equal(invalidLegacyBang.ok, false);
  assert.match(invalidLegacyBang.errors.join("\n"), /must have required property 'selector'/);
});

test("default graph project view and node validators are strict v0.1", async () => {
  const graph = await readJson("fixtures/graph/v0.1/valid/render-output.graph.json");
  const project = await readJson("fixtures/project/v0.1/valid/input-only-patch.project.json");
  const node = await readJson("fixtures/node/v0.1/valid/render-clear-color.node.json");
  const viewState = createDefaultViewStateForGraph(graph);

  assert.equal(validateGraphDocument(graph).ok, true);
  assert.equal(validateProjectDocument(project).ok, true);
  assert.equal(validateNodeDefinition(node).ok, true);
  assert.equal(validateViewState(viewState).ok, true);

  const unsupportedGraph = {
    schema: "skenion.graph",
    schemaVersion: "9.9.9",
    id: "unsupported-graph",
    revision: "1",
    nodes: [],
    edges: []
  };
  const unsupportedViewState = {
    schema: "skenion.view-state",
    schemaVersion: "9.9.9",
    canvas: { nodes: {} }
  };
  const unsupportedProject = {
    schema: "skenion.project",
    schemaVersion: "9.9.9",
    id: "unsupported-project",
    revision: "1",
    graph: unsupportedGraph,
    viewState: unsupportedViewState,
    patchLibrary: []
  };
  const unsupportedNode = {
    schema: "skenion.node.definition",
    schemaVersion: "9.9.9",
    id: "unsupported.node",
    version: "0.1.0",
    displayName: "Unsupported Node",
    category: "Unsupported",
    ports: [],
    execution: { model: "value" },
    state: { persistent: false },
    permissions: [],
    capabilities: []
  };

  assert.equal(validateGraphDocument(unsupportedGraph).ok, false);
  assert.equal(validateGraphDocumentV01(unsupportedGraph).ok, false);
  assert.equal(validateProjectDocument(unsupportedProject).ok, false);
  assert.equal(validateProjectDocumentV01(unsupportedProject).ok, false);
  assert.equal(validateViewState(unsupportedViewState).ok, false);
  assert.equal(validateViewStateV01(unsupportedViewState).ok, false);
  assert.equal(validateNodeDefinition(unsupportedNode).ok, false);
  assert.equal(validateNodeDefinitionV01(unsupportedNode).ok, false);

  const orphanViewProject = structuredClone(project);
  orphanViewProject.viewState.canvas.nodes["missing-node"] = { x: 0, y: 0 };
  const orphanViewResult = validateProjectDocument(orphanViewProject);
  assert.equal(orphanViewResult.ok, false);
  assert.match(orphanViewResult.errors.join("\n"), /missing-node/);
});

test("creates default view state for graph nodes", async () => {
  const graph = await readJson("fixtures/graph/v0.1/valid/render-output.graph.json");
  const viewState = createDefaultViewStateForGraph(graph);

  assert.equal(viewState.schema, "skenion.view-state");
  assert.equal(viewState.schemaVersion, "0.1.0");
  assert.equal(validateViewState(viewState).ok, true);
  assert.equal(validateViewStateV01(viewState).ok, true);
  const invalidCurrentViewState = structuredClone(viewState);
  invalidCurrentViewState.schemaVersion = "9.9.9";
  assert.equal(validateViewState(invalidCurrentViewState).ok, false);
  assert.equal(validateViewStateV01(invalidCurrentViewState).ok, false);
  assert.deepEqual(Object.keys(viewState.canvas.nodes), ["clear_color", "output"]);
  assert.deepEqual(viewState.canvas.nodes.clear_color, { x: 96, y: 96 });
  assert.deepEqual(viewState.canvas.nodes.output, { x: 376, y: 96 });
  assert.deepEqual(viewState.canvas.viewport, { x: 0, y: 0, zoom: 1 });
});

test("parses MIDI Clock messages into clock state authority", () => {
  assert.deepEqual(parseMidiClockMessageV01([0xf8]), { kind: "tick" });
  assert.deepEqual(parseMidiClockMessageV01([0xfa]), { kind: "start" });
  assert.deepEqual(parseMidiClockMessageV01([0xfb]), { kind: "continue" });
  assert.deepEqual(parseMidiClockMessageV01([0xfc]), { kind: "stop" });
  assert.deepEqual(parseMidiClockMessageV01([0xf2, 16, 0]), {
    kind: "song-position-pointer",
    songPositionSixteenth: 16
  });
  assert.equal(parseMidiClockMessageV01([]), null);
  assert.equal(parseMidiClockMessageV01([0x90, 60, 127]), null);
  assert.equal(parseMidiClockMessageV01([0xf2]), null);
  assert.equal(parseMidiClockMessageV01([0xf2, 0x80, 0]), null);

  let snapshot = createInitialMidiClockSnapshotV01({
    sourceId: "midi-a",
    timeSignature: { numerator: 4, denominator: 4 }
  });
  let result = applyMidiClockMessageV01(snapshot, {
    kind: "start",
    receivedHostTimeNs: 100
  });
  assert.equal(result.snapshot.running, true);
  assert.deepEqual(result.diagnostics, []);
  assert.equal(result.clockState.running.value, true);
  assert.equal(result.clockState.bar.value, 1);
  assert.equal(result.clockState.beat.value, 1);
  assert.equal(result.clockState.tempoBpm.authority, "unavailable");
  assert.equal(result.clockState.lastUpdateHostTimeNs, 100);

  snapshot = result.snapshot;
  result = applyMidiClockMessageV01(snapshot, { kind: "tick" });
  assert.deepEqual(result.diagnostics, []);
  assert.equal(result.snapshot.tickIndex, 1);
  assert.equal(result.clockState.tickIndex.value, 1);
  assert.equal(result.clockState.ppqPosition.value, 1 / 24);
  assert.equal(result.clockState.phase01.value, 1 / 24);
  assert.equal(result.clockState.songPositionSixteenth.value, 0);

  result = applyMidiClockMessageV01(snapshot, {
    kind: "song-position-pointer",
    songPositionSixteenth: 16
  });
  assert.deepEqual(result.diagnostics, []);
  assert.equal(result.snapshot.tickIndex, 96);
  assert.equal(result.clockState.bar.value, 2);
  assert.equal(result.clockState.beat.value, 1);
  assert.equal(result.clockState.division.value, 1);

  result = applyMidiClockMessageV01(result.snapshot, { kind: "stop" });
  assert.equal(result.clockState.running.value, false);
  result = applyMidiClockMessageV01(result.snapshot, { kind: "continue" });
  assert.equal(result.clockState.running.value, true);

  const noMeter = midiClockSnapshotToClockStateV01(createInitialMidiClockSnapshotV01());
  assert.equal(noMeter.bar.authority, "unavailable");
  assert.equal(noMeter.timeSignature.value, null);
  assert.equal(noMeter.capabilities.includes("bar-beat"), false);

  const custom = createInitialMidiClockSnapshotV01({
    ticksPerQuarter: 48,
    lastUpdateHostTimeNs: 7
  });
  result = applyMidiClockMessageV01(custom, { kind: "song-position-pointer" });
  assert.equal(result.diagnostics[0].code, "invalid-midi-song-position-pointer");
  assert.equal(result.snapshot.tickIndex, 0);
  assert.equal(result.snapshot.lastUpdateHostTimeNs, 7);

  result = applyMidiClockMessageV01(custom, {
    kind: "song-position-pointer",
    songPositionSixteenth: 16_384
  });
  assert.equal(result.diagnostics[0].code, "invalid-midi-song-position-pointer");
  assert.equal(result.snapshot.tickIndex, 0);

  const invalidTiming = midiClockSnapshotToClockStateV01({
    ...custom,
    ticksPerQuarter: 0,
    timeSignature: { numerator: 4, denominator: 0 }
  });
  assert.equal(invalidTiming.ppqPosition.value, 0);
  assert.equal(invalidTiming.bar.authority, "unavailable");

  result = applyMidiClockMessageV01({
    ...custom,
    tickIndex: Number.MAX_SAFE_INTEGER
  }, { kind: "tick" });
  assert.equal(result.diagnostics[0].code, "midi-clock-tick-overflow");
});

test("plans audio clock-domain bridge requirements", () => {
  const source = {
    id: "input-device",
    authority: "driver-reported",
    source: "audio.input",
    sampleRate: 48_000
  };
  const same = {
    id: "input-device",
    authority: "driver-reported",
    source: "audio.output",
    sampleRate: 48_000
  };
  const independent = {
    id: "output-device",
    authority: "driver-reported",
    source: "audio.output",
    sampleRate: 48_000
  };

  assert.deepEqual(planAudioClockBridgeV01(source, same), {
    required: false,
    sourceClockDomainId: "input-device",
    targetClockDomainId: "input-device",
    method: "direct",
    diagnostics: []
  });

  const invalid = planAudioClockBridgeV01(source, independent);
  assert.equal(invalid.required, true);
  assert.equal(invalid.method, "invalid");
  assert.equal(invalid.diagnostics[0].code, "audio-clock-domain-crossing-requires-bridge");

  const bridged = planAudioClockBridgeV01(source, independent, "bridge");
  assert.equal(bridged.required, true);
  assert.equal(bridged.method, "clock-bridge");
  assert.equal(bridged.bridgeNodeId, "bridge");
});

test("plans implicit numeric and color representation conversions", () => {
  assert.equal(representationRegistryV01.some((representation) => representation.id === "f8.e4m3"), true);
  assert.equal(representationRegistryV01.some((representation) => representation.id === "ufloat8"), true);
  assert.equal(representationRegistryV01.some((representation) => representation.id === "ufloat16"), true);
  assert.equal(representationRegistryV01.some((representation) => representation.id === "rgba8unorm"), true);

  const knownRepresentations = new Set(representationRegistryV01.map((representation) => representation.id));
  const valueType = (dataKind, format) => ({ flow: "value", dataKind, format });
  const assertImplicitConversion = (label, source, target, expectedPolicy) => {
    const plan = planConversion(source, target);
    assert.equal(plan.ok, true, `${label} should be implicit`);
    assert.equal(knownRepresentations.has(plan.source.representation), true, `${label} source representation is registered`);
    assert.equal(knownRepresentations.has(plan.target.representation), true, `${label} target representation is registered`);
    if (expectedPolicy) {
      assert.equal(plan.steps[0].policy, expectedPolicy, `${label} policy`);
    }
    return plan;
  };

  const semanticConversions = [
    ["float -> float", valueType("number.float", "f32"), valueType("number.float", "f16"), "numeric-cast"],
    ["float -> int", valueType("number.float", "f32"), valueType("number.int", "i32"), "float-to-integer"],
    ["float -> uint", valueType("number.float", "f32"), valueType("number.uint", "u32"), "float-to-integer"],
    ["int -> int", valueType("number.int", "i32"), valueType("number.int", "i8"), "numeric-cast"],
    ["int -> uint", valueType("number.int", "i32"), valueType("number.uint", "u32"), "integer-signedness"],
    ["int -> float", valueType("number.int", "i32"), valueType("number.float", "f32"), "integer-to-float"],
    ["uint -> uint", valueType("number.uint", "u32"), valueType("number.uint", "u8"), "numeric-cast"],
    ["uint -> int", valueType("number.uint", "u32"), valueType("number.int", "i32"), "integer-signedness"],
    ["uint -> float", valueType("number.uint", "u32"), valueType("number.float", "f32"), "integer-to-float"],
    ["ufloat -> float", valueType("number.float", "ufloat8"), valueType("number.float", "f32"), "numeric-cast"],
    ["ufloat -> int", valueType("number.float", "ufloat16"), valueType("number.int", "i32"), "float-to-integer"],
    ["ufloat -> uint", valueType("number.float", "ufloat8"), valueType("number.uint", "u32"), "float-to-integer"],
    ["color -> color", valueType("color", "rgba32f"), valueType("color", "rgba8unorm"), "color-cast"]
  ];
  for (const [label, source, target, expectedPolicy] of semanticConversions) {
    assertImplicitConversion(label, source, target, expectedPolicy);
  }

  const representationConversions = [
    ["f32 -> f8", valueType("number.float", "f32"), valueType("number.float", "f8.e4m3"), "numeric-cast"],
    ["f8 -> f16", valueType("number.float", "f8.e4m3"), valueType("number.float", "f16"), "numeric-cast"],
    ["ufloat8 -> uint", valueType("number.float", "ufloat8"), valueType("number.uint", "u8"), "float-to-integer"],
    ["ufloat16 -> int", valueType("number.float", "ufloat16"), valueType("number.int", "i16"), "float-to-integer"],
    ["float -> uint", valueType("number.float", "f32"), valueType("number.uint", "u8"), "float-to-integer"],
    ["int -> float", valueType("number.int", "i32"), valueType("number.float", "f16"), "integer-to-float"],
    ["uint -> int", valueType("number.uint", "u32"), valueType("number.int", "i8"), "integer-signedness"],
    ["i32 -> i8", valueType("number.int", "i32"), valueType("number.int", "i8"), "numeric-cast"],
    ["u32 -> u8", valueType("number.uint", "u32"), valueType("number.uint", "u8"), "numeric-cast"],
    ["rgba32f -> rgba8unorm", valueType("color", "rgba32f"), valueType("color", "rgba8unorm"), "color-cast"],
    ["rgb -> rgba", valueType("color", "rgb8unorm"), valueType("color", "rgba8unorm"), "color-cast"],
    ["rgba -> rgb", valueType("color", "rgba8unorm"), valueType("color", "rgb8unorm"), "color-cast"]
  ];
  for (const [label, source, target, expectedPolicy] of representationConversions) {
    assertImplicitConversion(label, source, target, expectedPolicy);
  }

  const floatToByte = planConversion(
    { flow: "value", dataKind: "number.float", format: "f32" },
    { flow: "value", dataKind: "number.uint", format: "u8" }
  );
  assert.equal(floatToByte.lossy, true);
  assert.equal(floatToByte.steps[0].clamp, "saturating");
  assert.equal(floatToByte.steps[0].trunc, "toward-zero");

  const messageSink = planConversion(
    { flow: "value", dataKind: "string" },
    { flow: "event", dataKind: "message.any" }
  );
  assert.equal(messageSink.ok, true);
  assert.equal(messageSink.lossy, false);

  for (const dataKind of ["number.float", "number.int", "number.uint", "boolean", "color", "string"]) {
    const valueToBangObjectInlet = planConversion(
      { flow: "value", dataKind },
      { flow: "event", dataKind: "message.any" }
    );
    assert.equal(
      valueToBangObjectInlet.ok,
      true,
      `${dataKind} should connect to a message.any object inlet such as core.bang.in`
    );
  }

  const panelMessageSink = planConversion(
    { flow: "value", dataKind: "string" },
    { flow: "value", dataKind: "message.any" }
  );
  assert.equal(panelMessageSink.ok, true);

  const bangToAnyMessage = planConversion(
    { flow: "event", dataKind: "event.bang" },
    { flow: "event", dataKind: "message.any" }
  );
  assert.equal(bangToAnyMessage.ok, true);

  const anyMessageToAnyMessage = planConversion(
    { flow: "event", dataKind: "message.any" },
    { flow: "event", dataKind: "message.any" }
  );
  assert.equal(anyMessageToAnyMessage.ok, true);

  const resourceToMessage = planConversion(
    { flow: "resource", dataKind: "gpu.texture2d" },
    { flow: "event", dataKind: "message.any" }
  );
  assert.equal(resourceToMessage.ok, false);

  const eventToValueMessage = planConversion(
    { flow: "event", dataKind: "event.bang" },
    { flow: "value", dataKind: "message.any" }
  );
  assert.equal(eventToValueMessage.ok, false);

  const invalidMessageAnyFlow = planConversion(
    { flow: "value", dataKind: "string" },
    { flow: "resource", dataKind: "message.any" }
  );
  assert.equal(invalidMessageAnyFlow.ok, false);

  assert.equal(representationForDataType({ flow: "value", dataKind: "number.float", format: ["f16", "f32"] }), "f16");
  assert.equal(representationForDataType({ flow: "value", dataKind: "number.uint" }), "u32");
  assert.equal(representationForDataType({ flow: "value", dataKind: "string" }), undefined);

  const intNarrow = planConversion(
    { flow: "value", dataKind: "number.int", format: "i32" },
    { flow: "value", dataKind: "number.int", format: "i8" }
  );
  assert.equal(intNarrow.ok, true);
  assert.equal(intNarrow.lossy, true);
  assert.equal(intNarrow.steps[0].policy, "numeric-cast");

  const colorToUnorm = planConversion(
    { flow: "value", dataKind: "color", format: "rgba32f" },
    { flow: "value", dataKind: "color", format: "rgba8unorm" }
  );
  assert.equal(colorToUnorm.ok, true);
  assert.equal(colorToUnorm.lossy, true);
  assert.equal(colorToUnorm.steps[0].policy, "color-cast");
  assert.equal(colorToUnorm.steps[0].clamp, "unit");

  const intToFloat = planConversion(
    { flow: "value", dataKind: "number.int", format: "i32" },
    { flow: "value", dataKind: "number.float", format: "f32" }
  );
  assert.equal(intToFloat.ok, true);
  assert.equal(intToFloat.steps[0].policy, "integer-to-float");

  const uintToInt = planConversion(
    { flow: "value", dataKind: "number.uint", format: "u32" },
    { flow: "value", dataKind: "number.int", format: "i16" }
  );
  assert.equal(uintToInt.ok, true);
  assert.equal(uintToInt.steps[0].policy, "integer-signedness");

  const colorIdentity = planConversion(
    { flow: "value", dataKind: "color", format: "rgba32f" },
    { flow: "value", dataKind: "color", format: "rgba32f" }
  );
  assert.equal(colorIdentity.ok, true);
  assert.equal(colorIdentity.lossy, false);
  assert.equal(colorIdentity.diagnostics.length, 0);

  const incompatible = planConversion(
    { flow: "value", dataKind: "boolean" },
    { flow: "event", dataKind: "event.bang" }
  );
  assert.equal(incompatible.ok, false);

  const sameFlowIncompatible = planConversion(
    { flow: "value", dataKind: "boolean" },
    { flow: "value", dataKind: "color", format: "rgba32f" }
  );
  assert.equal(sameFlowIncompatible.ok, false);

  const numericToBoolean = planConversion(
    { flow: "value", dataKind: "number.float", format: "f32" },
    { flow: "value", dataKind: "boolean" }
  );
  assert.equal(numericToBoolean.ok, false);

  const booleanToNumeric = planConversion(
    { flow: "value", dataKind: "boolean" },
    { flow: "value", dataKind: "number.float", format: "f32" }
  );
  assert.equal(booleanToNumeric.ok, false);

  const unknownRepresentation = planConversion(
    { flow: "value", dataKind: "number.float", format: "float.custom" },
    { flow: "value", dataKind: "number.float", format: "float.other" }
  );
  assert.equal(unknownRepresentation.ok, false);

  assert.equal(planConversion(
    { flow: "value", dataKind: "number.float", format: "f32" },
    { flow: "value", dataKind: "number.float", format: "float.other" }
  ).ok, false);
  assert.equal(planConversion(
    { flow: "value", dataKind: "number.float", format: "float.custom" },
    { flow: "value", dataKind: "number.float", format: "f32" }
  ).ok, false);
  assert.equal(planConversion(
    { flow: "value", dataKind: "number.float", format: "i32" },
    { flow: "value", dataKind: "number.float", format: "f32" }
  ).ok, false);
  assert.equal(planConversion(
    { flow: "value", dataKind: "color", format: "f32" },
    { flow: "value", dataKind: "color", format: "rgba32f" }
  ).ok, false);
  assert.equal(planConversion(
    { flow: "value", dataKind: "color", format: "color.custom" },
    { flow: "value", dataKind: "color", format: "rgba32f" }
  ).ok, false);
  assert.equal(planConversion(
    { flow: "value", dataKind: "color", format: "rgba32f" },
    { flow: "value", dataKind: "color", format: "color.custom" }
  ).ok, false);
  assert.equal(planConversion(
    { flow: "value", dataKind: "color", format: "rgba32f" },
    { flow: "value", dataKind: "color", format: "f32" }
  ).ok, false);
});

test("analyzes WGSL shader uniform annotations into dynamic ports", () => {
  const source = [
    "// @skenion.uniform speed number.float default=0.5 min=0 max=2 step=0.01 label=\"Speed Amount\"",
    "// @skenion.uniform enabled boolean default=true",
    "// @skenion.uniform disabled boolean default=false",
    "// @skenion.uniform iterations number.int default=8",
    "// @skenion.uniform seed number.uint default=4",
    "// @skenion.uniform tint color default=[1,0.2,0.1,1]",
    "fn fs_main() -> @location(0) vec4<f32> { return vec4<f32>(1.0); }"
  ].join("\n");

  const result = analyzeShaderInterfaceV01(source, { language: "wgsl" });

  assert.equal(result.ok, true);
  assert.equal(result.diagnostics.length, 0);
  assert.equal(validateShaderInterface(result.shaderInterface).ok, true);
  assert.deepEqual(
    result.shaderInterface.uniforms.map((uniform) => [uniform.id, uniform.type.dataKind, uniform.default]),
    [
      ["speed", "number.float", 0.5],
      ["enabled", "boolean", true],
      ["disabled", "boolean", false],
      ["iterations", "number.int", 8],
      ["seed", "number.uint", 4],
      ["tint", "color", [1, 0.2, 0.1, 1]]
    ]
  );
  assert.equal(result.shaderInterface.uniforms[0].label, "Speed Amount");
  assert.deepEqual(result.shaderInterface.uniforms[0].type.range, { min: 0, max: 2, step: 0.01 });
  assert.equal(result.shaderInterface.uniforms[0].type.format, "f32");
  assert.equal(result.shaderInterface.uniforms[3].type.format, "i32");
  assert.equal(result.shaderInterface.uniforms[4].type.format, "u32");
  assert.equal(result.shaderInterface.uniforms[5].type.format, "rgba32f");

  const ports = shaderInterfaceToPortsV01(result.shaderInterface);
  assert.deepEqual(ports.map((port) => port.id), ["speed", "enabled", "disabled", "iterations", "seed", "tint", "out"]);
  assert.equal(ports[0].activation, "latched");
  assert.equal(ports[6].direction, "output");
  assert.equal(ports[6].type.dataKind, "gpu.texture2d");
});

test("reports shader uniform annotation diagnostics", () => {
  const source = [
    "// @skenion.uniform",
    "const note = \"@skenion.uniform\";",
    "// @skenion.uniform 1bad number.float default=nope min=nope step=-1",
    "// @skenion.uniform out number.float",
    "// @skenion.uniform speed vec3 default=0",
    "// @skenion.uniform speed number.float default=0.2",
    "// @skenion.uniform badFloat number.float default=nope",
    "// @skenion.uniform flag boolean default=maybe",
    "// @skenion.uniform count number.int default=1.5",
    "// @skenion.uniform badSeed number.uint default=-1",
    "// @skenion.uniform color color default=nope",
    "// @skenion.uniform color2 color default=[1,2,3]",
    "// @skenion.uniform ranged number.float min=nope max=Infinity step=-1",
    "// @skenion.uniform plain number.float label=Plain"
  ].join("\n");

  const result = analyzeShaderInterfaceV01(source, { language: "glsl" });

  assert.equal(result.ok, false);
  assert.deepEqual(
    result.diagnostics.map((diagnostic) => diagnostic.code),
    [
      "unsupported-language",
      "malformed-annotation",
      "invalid-uniform-id",
      "reserved-uniform-id",
      "unsupported-uniform-type",
      "duplicate-uniform-id",
      "invalid-default",
      "invalid-default",
      "invalid-default",
      "invalid-default",
      "invalid-default",
      "invalid-default",
      "invalid-number-range",
      "invalid-number-range",
      "invalid-number-range"
    ]
  );
  assert.deepEqual(
    result.diagnostics.map((diagnostic) => [diagnostic.phase, diagnostic.source]),
    result.diagnostics.map(() => ["interface-analysis", "user"])
  );
  assert.equal(result.diagnostics[1]?.line, 1);
  assert.equal(result.diagnostics[1]?.column, 4);
  assert.equal(result.diagnostics.find((diagnostic) => diagnostic.code === "invalid-default")?.column, 43);
  assert.equal(result.shaderInterface.uniforms.at(-1)?.label, "Plain");
});

test("rejects schema-invalid shader interfaces", () => {
  const result = validateShaderInterface({
    schema: "skenion.shader.interface",
    schemaVersion: "0.1.0",
    language: "wgsl",
    uniforms: [
      {
        id: "out",
        label: "Out",
        type: { flow: "value", dataKind: "number.float" },
        required: false
      }
    ]
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /must NOT be valid/);
});

test("exports and validates v0.1 graph and node schemas", async () => {
  assert.equal(graphV01Schema.properties.schemaVersion.const, "0.1.0");
  assert.equal(nodeDefinitionV01Schema.properties.schemaVersion.const, "0.1.0");

  const graph = await readJson("fixtures/graph/v0.1/valid/render-output.graph.json");
  const node = await readJson("fixtures/node/v0.1/valid/render-clear-color.node.json");

  assert.equal(validateGraphDocument(graph).ok, true);
  assert.equal(validateGraphDocumentV01(graph).ok, true);
  assert.equal(validateNodeDefinition(node).ok, true);
  assert.equal(validateNodeDefinitionV01(node).ok, true);

  const legacyVersion = await readJson("fixtures/graph/v0.1/invalid/legacy-000-version.graph.json");
  const legacyInputsOutputs = await readJson("fixtures/unsupported/v0.1/invalid/legacy-inputs-outputs.graph.json");
  const legacySampledFlow = await readJson("fixtures/unsupported/v0.1/invalid/legacy-sampled-flow.graph.json");
  const legacyPatch = await readJson("fixtures/unsupported/v0.1/invalid/legacy-graph-patch.patch.json");

  assert.equal(validateGraphDocument(legacyVersion).ok, false);
  assert.equal(validateGraphDocument(legacyInputsOutputs).ok, false);
  assert.equal(validateGraphDocument(legacySampledFlow).ok, false);
  assert.equal(validateGraphDocument(legacyPatch).ok, false);
});

test("exports and validates v0.1 graph fragment contracts", async () => {
  assert.equal(graphFragmentV01Schema.properties.schema.const, "skenion.graph.fragment");
  assert.equal(graphFragmentV01Schema.properties.schemaVersion.const, "0.1.0");

  const fragment = await readJson("fixtures/graph-fragment/v0.1/valid/internal-edge.fragment.json");
  const result = validateGraphFragmentV01(fragment);
  assert.equal(result.ok, true);
  assert.deepEqual(fragment.edges.map((edge) => edge.id), ["edge-source-sink"]);

  const analysis = analyzeGraphFragmentV01(fragment);
  assert.equal(analysis.ok, true);
  assert.deepEqual(analysis.omittedEdgeIds, []);

  const outside = await readJson("fixtures/graph-fragment/v0.1/invalid/outside-endpoint.fragment.json");
  const rejected = validateGraphFragmentV01(outside);
  assert.equal(rejected.ok, false);
  assert.match(rejected.errors.join("\n"), /fragment-edge-outside-selection/);

  const omitted = analyzeGraphFragmentV01(outside, { outsideEndpointPolicy: "omit" });
  assert.equal(omitted.ok, true);
  assert.equal(omitted.diagnostics[0].severity, "warning");
  assert.deepEqual(omitted.omittedEdgeIds, ["edge-to-outside"]);

  const schemaInvalid = structuredClone(fragment);
  delete schemaInvalid.nodes;
  assert.equal(validateGraphFragmentV01(schemaInvalid).ok, false);

  const duplicateNode = structuredClone(fragment);
  duplicateNode.nodes.push(structuredClone(duplicateNode.nodes[0]));
  assert.match(validateGraphFragmentV01(duplicateNode).errors.join("\n"), /duplicate-node-id/);

  const duplicatePort = structuredClone(fragment);
  duplicatePort.nodes[0].ports.push(structuredClone(duplicatePort.nodes[0].ports[0]));
  assert.match(validateGraphFragmentV01(duplicatePort).errors.join("\n"), /duplicate-port-id/);

  const duplicateEdge = structuredClone(fragment);
  duplicateEdge.edges.push(structuredClone(duplicateEdge.edges[0]));
  assert.match(validateGraphFragmentV01(duplicateEdge).errors.join("\n"), /duplicate-edge-id/);

  const missingSource = structuredClone(fragment);
  missingSource.edges[0].source.portId = "missing";
  assert.match(validateGraphFragmentV01(missingSource).errors.join("\n"), /missing-source-port/);

  const missingTarget = structuredClone(fragment);
  missingTarget.edges[0].target.portId = "missing";
  assert.match(validateGraphFragmentV01(missingTarget).errors.join("\n"), /missing-target-port/);

  const badSourceDirection = structuredClone(fragment);
  badSourceDirection.nodes[0].ports[0].direction = "input";
  assert.match(validateGraphFragmentV01(badSourceDirection).errors.join("\n"), /invalid-source-direction/);

  const badTargetDirection = structuredClone(fragment);
  badTargetDirection.nodes[1].ports[0].direction = "output";
  assert.match(validateGraphFragmentV01(badTargetDirection).errors.join("\n"), /invalid-target-direction/);

  const incompatible = structuredClone(fragment);
  incompatible.nodes[1].ports[0].type = "string";
  assert.match(validateGraphFragmentV01(incompatible).errors.join("\n"), /incompatible-type/);

  const acceptsList = structuredClone(fragment);
  acceptsList.nodes[1].ports[0].type = "number.int";
  acceptsList.nodes[1].ports[0].accepts = ["number.float"];
  assert.equal(validateGraphFragmentV01(acceptsList).ok, true);

  const messageAny = structuredClone(fragment);
  messageAny.nodes[1].ports[0].type = "message.any";
  assert.equal(validateGraphFragmentV01(messageAny).ok, true);
});

test("rejects v0.2 graph, project, patch, and fragment contract labels", async () => {
  const graph = await readJson("fixtures/graph/v0.1/valid/render-output.graph.json");
  const unsupportedGraph = structuredClone(graph);
  unsupportedGraph.schemaVersion = "0.2.0";
  const graphResult = validateGraphDocumentV01(unsupportedGraph);
  assert.equal(graphResult.ok, false);
  assert.match(graphResult.errors.join("\n"), /schemaVersion/);

  const project = await readJson("fixtures/project/v0.1/valid/input-only-patch.project.json");
  const unsupportedProject = structuredClone(project);
  unsupportedProject.schemaVersion = "0.2.0";
  const projectResult = validateProjectDocumentV01(unsupportedProject);
  assert.equal(projectResult.ok, false);
  assert.match(projectResult.errors.join("\n"), /schemaVersion/);

  const unsupportedPatch = structuredClone(project.patchLibrary[0]);
  unsupportedPatch.graph.schemaVersion = "0.2.0";
  const patchResult = validatePatchDefinitionV01(unsupportedPatch);
  assert.equal(patchResult.ok, false);
  assert.match(patchResult.errors.join("\n"), /schemaVersion/);

  const fragment = await readJson("fixtures/graph-fragment/v0.1/valid/internal-edge.fragment.json");
  const unsupportedFragment = structuredClone(fragment);
  unsupportedFragment.schemaVersion = "0.2.0";
  const fragmentResult = validateGraphFragmentV01(unsupportedFragment);
  assert.equal(fragmentResult.ok, false);
  assert.match(fragmentResult.errors.join("\n"), /schemaVersion/);
});

test("validates session-addressed paste operation contracts", async () => {
  assert.equal(runtimeOperationV0Schema.properties.schema.const, "skenion.runtime.operation");
  assert.equal(runtimeOperationV0Schema.$defs.pasteGraphFragmentRequest.required[0], "target");

  const root = await readJson("fixtures/runtime-operation/v0/valid/root-graph-paste.operation.json");
  const projectPatch = await readJson("fixtures/runtime-operation/v0/valid/project-patch-definition-paste.operation.json");
  const helpWorkingCopy = await readJson("fixtures/runtime-operation/v0/valid/help-working-copy-paste.operation.json");

  for (const operation of [root, projectPatch, helpWorkingCopy]) {
    assert.equal(validateRuntimeOperationEnvelope(operation).ok, true);
    assert.equal(validatePasteGraphFragmentRequest(operation.request).ok, true);
    assert.equal(isRuntimeOperationEnvelope(operation), true);
    assert.equal(isPasteGraphFragmentRequest(operation.request), true);
  }

  assert.equal(root.request.target.path.kind, "root");
  assert.equal("attribution" in root, false);
  assert.equal(projectPatch.request.target.path.kind, "project-patch-definition");
  assert.equal(helpWorkingCopy.request.target.path.kind, "help-working-copy");

  const diagnosticsResponse = await readJson("fixtures/runtime-operation/v0/valid/target-path-diagnostics.response.json");
  assert.equal(validatePasteGraphFragmentResponse(diagnosticsResponse).ok, true);
  assert.equal(isPasteGraphFragmentResponse(diagnosticsResponse), true);
  assert.deepEqual(diagnosticsResponse.diagnostics.map((entry) => entry.code), [
    "invalid-target-path",
    "duplicate-target-path"
  ]);
  assert.equal(diagnosticsResponse.diagnostics[0].path, "/request/target/path");
  assert.deepEqual(diagnosticsResponse.idRemap, {
    nodeIdMap: {},
    edgeIdMap: {},
    omittedEdgeIds: []
  });

  const remapResponse = await readJson("fixtures/runtime-operation/v0/valid/id-remap.response.json");
  assert.equal(validatePasteGraphFragmentResponse(remapResponse).ok, true);
  assert.equal(isPasteGraphFragmentResponse(remapResponse), true);
  assert.deepEqual(remapResponse.idRemap.nodeIdMap, {
    source: "source_2",
    sink: "sink_2"
  });
  assert.deepEqual(remapResponse.idRemap.edgeIdMap, {
    "edge-source-sink": "edge-source-sink_2"
  });

  const invalidEnvelope = structuredClone(root);
  invalidEnvelope.kind = "loadProject";
  assert.equal(validateRuntimeOperationEnvelope(invalidEnvelope).ok, false);
  assert.equal(isRuntimeOperationEnvelope(invalidEnvelope), false);

  const invalidRequest = structuredClone(root.request);
  delete invalidRequest.target;
  assert.equal(validatePasteGraphFragmentRequest(invalidRequest).ok, false);
  assert.equal(isPasteGraphFragmentRequest(invalidRequest), false);

  const outsideFragment = await readJson("fixtures/graph-fragment/v0.1/invalid/outside-endpoint.fragment.json");
  const defaultOutsideRequest = structuredClone(root.request);
  defaultOutsideRequest.fragment = outsideFragment;
  assert.equal(validatePasteGraphFragmentRequest(defaultOutsideRequest).ok, false);
  const defaultOutsideEnvelope = structuredClone(root);
  defaultOutsideEnvelope.request = defaultOutsideRequest;
  assert.equal(validateRuntimeOperationEnvelope(defaultOutsideEnvelope).ok, false);

  const omitOutsideRequest = structuredClone(defaultOutsideRequest);
  omitOutsideRequest.options = { outsideEndpointPolicy: "omit" };
  assert.equal(validatePasteGraphFragmentRequest(omitOutsideRequest).ok, true);

  const invalidResponse = structuredClone(diagnosticsResponse);
  invalidResponse.diagnostics[0].code = "not-a-contract-code";
  assert.equal(validatePasteGraphFragmentResponse(invalidResponse).ok, false);
  assert.equal(isPasteGraphFragmentResponse(invalidResponse), false);
});

function validateCollaborationDocument(document) {
  switch (document.schema) {
    case "skenion.runtime.collaboration.operation":
      return validateRuntimeCollaborationOperationEnvelope(document);
    case "skenion.runtime.collaboration.operation-batch":
      return validateRuntimeCollaborationOperationBatch(document);
    case "skenion.runtime.collaboration.operation-batch-result":
      return validateRuntimeCollaborationOperationBatchResult(document);
    case "skenion.runtime.collaboration.operation-result":
      return validateRuntimeCollaborationOperationResult(document);
    case "skenion.runtime.collaboration.presence":
      return validateRuntimeCollaborationPresenceEnvelope(document);
    case "skenion.runtime.collaboration.selection":
      return validateRuntimeCollaborationSelectionEnvelope(document);
    case "skenion.runtime.collaboration.event":
      return validateRuntimeCollaborationEventEnvelope(document);
    default:
      return { ok: false, errors: [`unexpected collaboration schema ${document.schema}`] };
  }
}

test("validates realtime collaboration operation, presence, causality, and undo contracts", async () => {
  assert.equal(
    runtimeCollaborationV0Schema.$defs.runtimeCollaborationOperationEnvelope.required.includes("idempotencyKey"),
    true
  );
  assert.equal(
    runtimeCollaborationV0Schema.$defs.runtimeCollaborationPresenceEnvelope.properties.presence.$ref,
    "#/$defs/runtimeCollaborationPresence"
  );

  for (const fixture of await fixtureFiles("fixtures/runtime-collaboration/v0/valid")) {
    const document = await readJson(fixture);
    const result = validateCollaborationDocument(document);

    assert.equal(result.ok, true, fixture);
  }

  for (const fixture of await fixtureFiles("fixtures/runtime-collaboration/v0/invalid")) {
    const document = await readJson(fixture);
    const result = validateCollaborationDocument(document);

    assert.equal(result.ok, false, fixture);
  }

  const changeSet = await readJson("fixtures/runtime-collaboration/v0/valid/change-set.operation.json");
  assert.equal(validateRuntimeCollaborationOperationEnvelope(changeSet).ok, true);
  assert.deepEqual(changeSet.payload.changes.map((change) => change.op), [
    "node.add",
    "node.move",
    "edge.connect",
    "node.delete"
  ]);
  assert.notEqual(changeSet.participantId, changeSet.authSubject.subjectId);
  assert.equal("clientWindowId" in changeSet, false);

  const invalidPastePayload = await readJson("fixtures/runtime-collaboration/v0/valid/paste-fragment.operation.json");
  invalidPastePayload.payload.request.fragment = await readJson(
    "fixtures/graph-fragment/v0.1/invalid/outside-endpoint.fragment.json"
  );
  const invalidPastePayloadResult = validateRuntimeCollaborationOperationEnvelope(invalidPastePayload);
  assert.equal(invalidPastePayloadResult.ok, false);
  assert.match(invalidPastePayloadResult.errors.join("\n"), /fragment-edge-outside-selection/);

  const duplicateResult = await readJson(
    "fixtures/runtime-collaboration/v0/valid/duplicate-idempotency.operation-result.json"
  );
  assert.equal(validateRuntimeCollaborationOperationResult(duplicateResult).ok, true);
  assert.equal(duplicateResult.status, "duplicate");
  assert.equal(duplicateResult.nack.reason, "duplicate-idempotency-key");

  const duplicateBatch = await readJson(
    "fixtures/runtime-collaboration/v0/invalid/duplicate-idempotency.operation-batch.json"
  );
  const duplicateBatchResult = validateRuntimeCollaborationOperationBatch(duplicateBatch);
  assert.equal(duplicateBatchResult.ok, false);
  assert.match(duplicateBatchResult.errors.join("\n"), /duplicate collaboration idempotency key/);

  const invalidBatchShape = structuredClone(duplicateBatch);
  delete invalidBatchShape.operations;
  assert.equal(validateRuntimeCollaborationOperationBatch(invalidBatchShape).ok, false);

  const sessionMismatchBatch = await readJson("fixtures/runtime-collaboration/v0/valid/operation-batch.json");
  sessionMismatchBatch.operations[0].sessionId = "session-other";
  const sessionMismatchBatchResult = validateRuntimeCollaborationOperationBatch(sessionMismatchBatch);
  assert.equal(sessionMismatchBatchResult.ok, false);
  assert.match(sessionMismatchBatchResult.errors.join("\n"), /sessionId must match/);

  const batchResult = await readJson("fixtures/runtime-collaboration/v0/valid/operation-batch-result.json");
  assert.equal(validateRuntimeCollaborationOperationBatchResult(batchResult).ok, true);
  assert.deepEqual(batchResult.results.map((result) => result.status), ["accepted", "rejected"]);

  const invalidBatchResultShape = structuredClone(batchResult);
  delete invalidBatchResultShape.results;
  assert.equal(validateRuntimeCollaborationOperationBatchResult(invalidBatchResultShape).ok, false);

  const batchResultMismatch = await readJson(
    "fixtures/runtime-collaboration/v0/invalid/batch-result-session-mismatch.operation-batch-result.json"
  );
  const batchResultMismatchResult =
    validateRuntimeCollaborationOperationBatchResult(batchResultMismatch);
  assert.equal(batchResultMismatchResult.ok, false);
  assert.match(batchResultMismatchResult.errors.join("\n"), /batch result operation sessionId/);

  const staleCausal = await readJson("fixtures/runtime-collaboration/v0/invalid/stale-causal-vector.operation.json");
  const staleCausalResult = validateRuntimeCollaborationOperationEnvelope(staleCausal);
  assert.equal(staleCausalResult.ok, false);
  assert.match(staleCausalResult.errors.join("\n"), /causal vector maximum/);

  const missingParticipantVector = await readJson("fixtures/runtime-collaboration/v0/valid/participant-undo.operation.json");
  missingParticipantVector.causal.vector = { "participant-b": 2 };
  const missingParticipantVectorResult = validateRuntimeCollaborationOperationEnvelope(missingParticipantVector);
  assert.equal(missingParticipantVectorResult.ok, false);
  assert.match(missingParticipantVectorResult.errors.join("\n"), /must include participantId/);

  const presence = await readJson("fixtures/runtime-collaboration/v0/valid/active.presence.json");
  assert.equal(validateRuntimeCollaborationPresenceEnvelope(presence).ok, true);
  assert.equal(presence.updatedAt < presence.expiresAt, true);
  assert.notEqual(presence.participantId, presence.authSubject.subjectId);

  const deferredAuthPresence = structuredClone(presence);
  deferredAuthPresence.authSubject = { kind: "deferred" };
  assert.equal(validateRuntimeCollaborationPresenceEnvelope(deferredAuthPresence).ok, true);

  const invalidPresenceShape = structuredClone(presence);
  delete invalidPresenceShape.expiresAt;
  assert.equal(validateRuntimeCollaborationPresenceEnvelope(invalidPresenceShape).ok, false);

  const selection = await readJson("fixtures/runtime-collaboration/v0/valid/remote-selection.selection.json");
  assert.equal(validateRuntimeCollaborationSelectionEnvelope(selection).ok, true);
  assert.deepEqual(selection.selection.ranges.map((range) => range.kind), ["nodes", "edges", "text"]);
  assert.deepEqual(selection.selection.ranges[2].anchor, {
    nodeId: "message-1",
    field: "text",
    offset: 0
  });
  assert.equal(selection.cursor.clientWindowId, "window-b");

  const undo = await readJson("fixtures/runtime-collaboration/v0/valid/participant-undo.operation.json");
  assert.equal(validateRuntimeCollaborationOperationEnvelope(undo).ok, true);
  assert.equal(undo.payload.scope.kind, "participant");
  assert.equal(undo.payload.scope.participantId, undo.participantId);

  const undoMismatch = await readJson("fixtures/runtime-collaboration/v0/invalid/undo-scope-mismatch.operation.json");
  const undoMismatchResult = validateRuntimeCollaborationOperationEnvelope(undoMismatch);
  assert.equal(undoMismatchResult.ok, false);
  assert.match(undoMismatchResult.errors.join("\n"), /scope participantId/);

  const rebase = await readJson("fixtures/runtime-collaboration/v0/valid/rebased.operation-result.json");
  assert.equal(validateRuntimeCollaborationOperationResult(rebase).ok, true);
  assert.equal(rebase.status, "rebased");
  assert.equal(rebase.rebase.strategy, "ot-transform");
  assert.equal(rebase.rebase.transformedPayload.kind, "changeSet");

  const mixedRebase = await readJson(
    "fixtures/runtime-collaboration/v0/valid/rebased-mixed-change-set.operation-result.json"
  );
  assert.equal(validateRuntimeCollaborationOperationResult(mixedRebase).ok, true);
  assert.deepEqual(mixedRebase.rebase.transformedPayload.changes.map((change) => change.op), [
    "node.add",
    "node.move",
    "node.delete",
    "edge.connect"
  ]);

  const pasteRebase = await readJson(
    "fixtures/runtime-collaboration/v0/valid/rebased-paste-fragment.operation-result.json"
  );
  assert.equal(validateRuntimeCollaborationOperationResult(pasteRebase).ok, true);
  assert.equal(pasteRebase.rebase.transformedPayload.kind, "pasteGraphFragment");

  const invalidRebaseStrategy = await readJson(
    "fixtures/runtime-collaboration/v0/invalid/rebase-unknown-strategy.operation-result.json"
  );
  assert.equal(validateRuntimeCollaborationOperationResult(invalidRebaseStrategy).ok, false);

  const extraWindow = await readJson("fixtures/runtime-collaboration/v0/invalid/extra-client-window.operation.json");
  const extraWindowResult = validateRuntimeCollaborationOperationEnvelope(extraWindow);
  assert.equal(extraWindowResult.ok, false);
  assert.match(extraWindowResult.errors.join("\n"), /must NOT have additional properties/);

  const missingRanges = await readJson("fixtures/runtime-collaboration/v0/invalid/selection-missing-ranges.selection.json");
  const missingRangesResult = validateRuntimeCollaborationSelectionEnvelope(missingRanges);
  assert.equal(missingRangesResult.ok, false);
  assert.match(missingRangesResult.errors.join("\n"), /ranges/);

  const expiredSelection = structuredClone(selection);
  expiredSelection.expiresAt = "2026-06-22T00:00:02.000Z";
  const expiredSelectionResult = validateRuntimeCollaborationSelectionEnvelope(expiredSelection);
  assert.equal(expiredSelectionResult.ok, false);
  assert.match(expiredSelectionResult.errors.join("\n"), /selection expiresAt/);

  const event = await readJson("fixtures/runtime-collaboration/v0/valid/operation-result.event.json");
  assert.equal(validateRuntimeCollaborationEventEnvelope(event).ok, true);
  assert.equal(event.replay.cursor, "6");

  const validGapEvent = structuredClone(event);
  validGapEvent.replay.gap = {
    expectedSequence: 4,
    actualSequence: 6,
    reason: "unknown"
  };
  validGapEvent.replay.replayed = true;
  assert.equal(validateRuntimeCollaborationEventEnvelope(validGapEvent).ok, true);

  const invalidEventShape = structuredClone(event);
  delete invalidEventShape.replay;
  assert.equal(validateRuntimeCollaborationEventEnvelope(invalidEventShape).ok, false);

  const invalidEvent = await readJson("fixtures/runtime-collaboration/v0/invalid/event-replay-gap-order.event.json");
  const invalidEventResult = validateRuntimeCollaborationEventEnvelope(invalidEvent);
  assert.equal(invalidEventResult.ok, false);
  assert.match(invalidEventResult.errors.join("\n"), /replay gap expectedSequence/);

  const mismatchedEvent = await readJson(
    "fixtures/runtime-collaboration/v0/invalid/event-kind-payload-mismatch.event.json"
  );
  const mismatchedEventResult = validateRuntimeCollaborationEventEnvelope(mismatchedEvent);
  assert.equal(mismatchedEventResult.ok, false);
  assert.match(mismatchedEventResult.errors.join("\n"), /kind/);

  const invalidResultShape = structuredClone(duplicateResult);
  delete invalidResultShape.status;
  assert.equal(validateRuntimeCollaborationOperationResult(invalidResultShape).ok, false);

  const acceptedWithNack = await readJson("fixtures/runtime-collaboration/v0/valid/accepted.operation-result.json");
  acceptedWithNack.nack = {
    reason: "invalid-operation"
  };
  const acceptedWithNackResult = validateRuntimeCollaborationOperationResult(acceptedWithNack);
  assert.equal(acceptedWithNackResult.ok, false);
  assert.match(acceptedWithNackResult.errors.join("\n"), /must not include nack/);

  const rejectedMissingNack = structuredClone(duplicateResult);
  rejectedMissingNack.status = "rejected";
  delete rejectedMissingNack.nack;
  const rejectedMissingNackResult = validateRuntimeCollaborationOperationResult(rejectedMissingNack);
  assert.equal(rejectedMissingNackResult.ok, false);
  assert.match(rejectedMissingNackResult.errors.join("\n"), /must include nack/);

  const duplicateWrongReason = structuredClone(duplicateResult);
  duplicateWrongReason.nack.reason = "invalid-operation";
  const duplicateWrongReasonResult = validateRuntimeCollaborationOperationResult(duplicateWrongReason);
  assert.equal(duplicateWrongReasonResult.ok, false);
  assert.match(duplicateWrongReasonResult.errors.join("\n"), /duplicate-idempotency-key/);

  const rebasedMissingRebase = structuredClone(rebase);
  delete rebasedMissingRebase.rebase;
  const rebasedMissingRebaseResult = validateRuntimeCollaborationOperationResult(rebasedMissingRebase);
  assert.equal(rebasedMissingRebaseResult.ok, false);
  assert.match(rebasedMissingRebaseResult.errors.join("\n"), /must include rebase metadata/);
});

test("runtime session events are session-addressed", () => {
  const event = {
    schema: "skenion.runtime.session.event",
    schemaVersion: "0.1.0",
    id: "event-1",
    sessionId: "session-a",
    sequence: 1,
    sessionRevision: 1,
    kind: "snapshot",
    snapshot: {
      sessionRevision: 1,
      viewRevision: 1,
      controlRevision: 0,
      project: null,
      diagnostics: [],
      plan: null
    },
    history: {
      schema: "skenion.runtime.history",
      schemaVersion: "0.1.0",
      entries: [],
      canUndo: false,
      canRedo: false,
      undoDepth: 0,
      redoDepth: 0
    },
    replay: {
      cursor: "1",
      previousCursor: null,
      replayed: false,
      gap: null,
      overflow: false
    },
    diagnostics: [],
    createdAt: "2026-06-21T00:00:00.000Z"
  };

  assert.equal(isRuntimeSessionEvent(event), true);
  const missingSession = structuredClone(event);
  delete missingSession.sessionId;
  assert.equal(isRuntimeSessionEvent(missingSession), false);
});

test("exports and validates v0.1 project patch library contracts", async () => {
  assert.equal(projectV01Schema.properties.schemaVersion.const, "0.1.0");
  assert.equal(projectV01Schema.properties.patchLibrary.items.$ref, "#/$defs/patchDefinition");
  assert.equal(projectV01Schema.$defs.patchDefinition.properties.contract, undefined);

  for (const fixture of await fixtureFiles("fixtures/project/v0.1/valid")) {
    const project = await readJson(fixture);
    const result = validateProjectDocumentV01(project);
    assert.equal(validateProjectDocument(project).ok, true, fixture);
    assert.equal(result.ok, true, fixture);
    assert.equal(validatePatchDefinitionV01(project.patchLibrary[0]).ok, true, fixture);
  }

  for (const fixture of await fixtureFiles("fixtures/project/v0.1/invalid")) {
    const result = validateProjectDocumentV01(await readJson(fixture));
    assert.equal(result.ok, false, fixture);
    assert.match(result.errors.join("\n"), /duplicate boundary port id/, fixture);
  }

  const validProject = await readJson("fixtures/project/v0.1/valid/input-only-patch.project.json");
  const schemaInvalidProject = structuredClone(validProject);
  delete schemaInvalidProject.patchLibrary;
  const schemaInvalidProjectResult = validateProjectDocumentV01(schemaInvalidProject);
  assert.equal(schemaInvalidProjectResult.ok, false);
  assert.match(schemaInvalidProjectResult.errors.join("\n"), /patchLibrary/);

  const schemaInvalidPatch = structuredClone(validProject.patchLibrary[0]);
  schemaInvalidPatch.id = "";
  const schemaInvalidPatchResult = validatePatchDefinitionV01(schemaInvalidPatch);
  assert.equal(schemaInvalidPatchResult.ok, false);
  assert.match(schemaInvalidPatchResult.errors.join("\n"), /must NOT have fewer than 1 characters/);

  const semanticInvalidProject = await readJson("fixtures/project/v0.1/invalid/duplicate-boundary-port-id.project.json");
  const semanticInvalidPatchResult = validatePatchDefinitionV01(semanticInvalidProject.patchLibrary[0]);
  assert.equal(semanticInvalidPatchResult.ok, false);
  assert.match(semanticInvalidPatchResult.errors.join("\n"), /duplicate boundary port id/);

  const graphInvalidPatch = structuredClone(validProject.patchLibrary[0]);
  graphInvalidPatch.graph.nodes.push(structuredClone(graphInvalidPatch.graph.nodes[0]));
  const graphInvalidPatchResult = validatePatchDefinitionV01(graphInvalidPatch);
  assert.equal(graphInvalidPatchResult.ok, false);
  assert.match(graphInvalidPatchResult.errors.join("\n"), /duplicate node id/);
});

test("derives v0.1 patch contracts from core inlet and outlet boundary nodes", async () => {
  const inputProject = await readJson("fixtures/project/v0.1/valid/input-only-patch.project.json");
  const inputContract = derivePatchContractV01(inputProject.patchLibrary[0]);
  assert.deepEqual(inputContract.ports.map((port) => port.id), ["frequency"]);
  assert.equal(inputContract.ports[0].direction, "input");
  assert.equal(inputContract.ports[0].boundaryNodeId, "frequency_in");
  assert.equal(inputContract.ports[0].boundaryPortId, "out");
  assert.equal(inputContract.ports[0].label, "Frequency");
  assert.equal(inputContract.ports[0].description, "Frequency value entering the patch.");
  assert.equal("tooltip" in inputContract.ports[0], false);

  const outputProject = await readJson("fixtures/project/v0.1/valid/output-only-patch.project.json");
  const outputContract = derivePatchContractsV01(outputProject)[0];
  assert.deepEqual(outputContract.ports.map((port) => `${port.id}:${port.direction}`), [
    "amplitude:output"
  ]);
  assert.equal(outputContract.ports[0].description, "Amplitude value leaving the patch.");

  const boundaryProject = await readJson("fixtures/project/v0.1/valid/n-m-boundary-patch.project.json");
  const boundaryContract = derivePatchContractV01(boundaryProject.patchLibrary[0]);
  assert.deepEqual(boundaryContract.ports.map((port) => `${port.id}:${port.direction}`), [
    "left:input",
    "right:input",
    "sum:output",
    "difference:output"
  ]);

  const recursiveProject = await readJson("fixtures/project/v0.1/valid/recursive-reference.project.json");
  const recursiveContract = derivePatchContractV01(recursiveProject.patchLibrary[0]);
  assert.deepEqual(recursiveContract.ports.map((port) => port.id), ["value", "result"]);

  const fallbackPatch = {
    id: "fallbacks",
    revision: "1",
    graph: {
      schema: "skenion.graph",
      schemaVersion: "0.1.0",
      id: "fallback-boundary-graph",
      revision: "1",
      nodes: [
        {
          id: "single_boundary",
          kind: "core.inlet",
          kindVersion: "0.1.0",
          params: {},
          ports: [
            { id: "out", direction: "output", type: "number.float", rate: "control" }
          ]
        },
        {
          id: "multi_boundary",
          kind: "core.outlet",
          kindVersion: "0.1.0",
          params: {},
          ports: [
            { id: "left", direction: "input", type: "number.float", rate: "control" },
            { id: "right", direction: "input", type: "number.float", rate: "control" }
          ]
        }
      ],
      edges: []
    }
  };
  const fallbackContract = derivePatchContractV01(fallbackPatch);
  assert.deepEqual(fallbackContract.ports.map((port) => `${port.id}:${port.direction}`), [
    "single_boundary:input",
    "left:output",
    "right:output"
  ]);
});

test("v0.1 validates fan-out, fan-in, accepts, and feedback fixtures", async () => {
  for (const fixture of [
    "fixtures/graph/v0.1/valid/zero-port-node.graph.json",
    "fixtures/graph/v0.1/valid/n-input-output-node.graph.json",
    "fixtures/graph/v0.1/valid/source-fan-out.graph.json",
    "fixtures/graph/v0.1/valid/ordered-event-fan-in.graph.json",
    "fixtures/graph/v0.1/valid/audio-mix-fan-in.graph.json",
    "fixtures/graph/v0.1/valid/render-frame-feedback.graph.json"
  ]) {
    const result = validateGraphDocumentV01(await readJson(fixture));
    assert.equal(result.ok, true, fixture);
  }

  const feedbackGraph = await readJson("fixtures/graph/v0.1/valid/render-frame-feedback.graph.json");
  const feedbackAnalysis = analyzeGraphDocumentV01(feedbackGraph);
  assert.equal(feedbackAnalysis.ok, true);
  assert.equal(feedbackAnalysis.cycles[0].classification, "valid-feedback");
  assert.match(feedbackAnalysis.cycles[0].message, /render-frame|explicit boundary/);

  feedbackGraph.edges[0].feedback.boundary = "same-turn";
  const riskyAnalysis = analyzeGraphDocumentV01(feedbackGraph);
  assert.equal(riskyAnalysis.ok, true);
  assert.equal(riskyAnalysis.diagnostics[0].severity, "warning");
  assert.equal(riskyAnalysis.cycles[0].classification, "risky-feedback");

  delete feedbackGraph.edges[0].feedback;
  const invalidCycle = analyzeGraphDocumentV01(feedbackGraph);
  assert.equal(invalidCycle.ok, false);
  assert.equal(invalidCycle.cycles[0].classification, "invalid-cycle");
});

test("v0.1 message.any inlets accept bang events", () => {
  const graph = {
    schema: "skenion.graph",
    schemaVersion: "0.1.0",
    id: "message-any-bang",
    revision: "1",
    nodes: [
      {
        id: "button",
        kind: "core.bang",
        kindVersion: "0.1.0",
        params: {},
        ports: [
          { id: "out", direction: "output", type: "event.bang", rate: "event" }
        ]
      },
      {
        id: "message",
        kind: "core.message",
        kindVersion: "0.1.0",
        params: {},
        ports: [
          { id: "in", direction: "input", type: "message.any", rate: "event", triggerMode: "trigger" }
        ]
      }
    ],
    edges: [
      {
        id: "edge_button_message",
        source: { nodeId: "button", portId: "out" },
        target: { nodeId: "message", portId: "in" }
      }
    ]
  };

  assert.equal(validateGraphDocumentV01(graph).ok, true);
});

test("v0.1 rejects invalid direction fan-in and algebraic-loop fixtures", async () => {
  const cases = [
    ["fixtures/graph/v0.1/invalid/input-to-input-edge.graph.json", /invalid-source-direction/],
    ["fixtures/graph/v0.1/invalid/output-to-output-edge.graph.json", /invalid-target-direction/],
    ["fixtures/graph/v0.1/invalid/fan-in-without-merge-policy.graph.json", /fan-in-without-merge-policy/],
    ["fixtures/graph/v0.1/invalid/render-input-fan-in-default.graph.json", /fan-in-cardinality/],
    ["fixtures/graph/v0.1/invalid/ambiguous-value-algebraic-loop.graph.json", /ambiguous-algebraic-loop/]
  ];

  for (const [fixture, expected] of cases) {
    const result = validateGraphDocumentV01(await readJson(fixture));
    assert.equal(result.ok, false, fixture);
    assert.match(result.errors.join("\n"), expected, fixture);
  }

  const controlLoop = await readJson("fixtures/graph/v0.1/invalid/ambiguous-value-algebraic-loop.graph.json");
  for (const node of controlLoop.nodes) {
    for (const port of node.ports) {
      port.type = "control.number";
    }
  }
  const controlLoopResult = validateGraphDocumentV01(controlLoop);
  assert.equal(controlLoopResult.ok, false);
  assert.match(controlLoopResult.errors.join("\n"), /ambiguous-algebraic-loop/);

  const missingPortCycle = await readJson("fixtures/graph/v0.1/valid/zero-port-node.graph.json");
  missingPortCycle.edges.push({
    id: "edge_missing_cycle",
    source: { nodeId: "note_1", portId: "missing_out" },
    target: { nodeId: "note_1", portId: "missing_in" }
  });
  const missingPortCycleAnalysis = analyzeGraphDocumentV01(missingPortCycle);
  assert.equal(missingPortCycleAnalysis.ok, false);
  assert.equal(missingPortCycleAnalysis.cycles[0].classification, "invalid-cycle");
});

test("v0.1 reports detailed semantic diagnostics", async () => {
  const graph = await readJson("fixtures/graph/v0.1/valid/source-fan-out.graph.json");
  graph.nodes[0].ports[0].fanOutPolicy = "forbid";
  graph.nodes[1].ports[0].required = true;
  graph.nodes[2].ports[0].type = "render.frame";
  graph.nodes[2].ports[0].accepts = ["gpu.texture2d"];
  graph.edges[1].source.portId = "missing";
  graph.edges.push({
    ...graph.edges[0],
    id: "edge_duplicate_endpoint"
  });
  graph.edges.push({
    ...graph.edges[0],
    id: "edge_wrong_type",
    target: { nodeId: "meter_b", portId: "in" }
  });
  graph.edges.push({
    ...graph.edges[0],
    id: "edge_missing_target",
    target: { nodeId: "missing", portId: "in" }
  });
  graph.edges.push({
    ...graph.edges[0],
    id: "edge_duplicate_endpoint"
  });
  graph.nodes.push({
    ...graph.nodes[1],
    id: "meter_a"
  });
  graph.nodes[1].ports.push({
    ...graph.nodes[1].ports[0]
  });

  const analysis = analyzeGraphDocumentV01(graph);

  assert.equal(analysis.ok, false);
  assert.match(analysis.diagnostics.map((entry) => entry.code).join("\n"), /missing-source-port/);
  assert.match(analysis.diagnostics.map((entry) => entry.code).join("\n"), /missing-target-port/);
  assert.match(analysis.diagnostics.map((entry) => entry.code).join("\n"), /duplicate-node-id/);
  assert.match(analysis.diagnostics.map((entry) => entry.code).join("\n"), /duplicate-port-id/);
  assert.match(analysis.diagnostics.map((entry) => entry.code).join("\n"), /duplicate-edge-id/);
  assert.match(analysis.diagnostics.map((entry) => entry.code).join("\n"), /duplicate-edge/);
  assert.match(analysis.diagnostics.map((entry) => entry.code).join("\n"), /incompatible-type/);
  assert.match(analysis.diagnostics.map((entry) => entry.code).join("\n"), /fan-out-forbidden/);

  const acceptingGraph = await readJson("fixtures/graph/v0.1/valid/render-output.graph.json");
  acceptingGraph.nodes[1].ports[0].accepts = ["gpu.texture2d"];
  acceptingGraph.nodes[0].ports[0].type = "gpu.texture2d";
  acceptingGraph.edges[0].resolvedType = "gpu.texture2d";
  assert.equal(validateGraphDocumentV01(acceptingGraph).ok, true);

  const unlimitedGraph = await readJson("fixtures/graph/v0.1/invalid/render-input-fan-in-default.graph.json");
  unlimitedGraph.nodes[2].ports[0].maxConnections = null;
  unlimitedGraph.nodes[2].ports[0].mergePolicy = "array";
  assert.equal(validateGraphDocumentV01(unlimitedGraph).ok, true);

  const requiredGraph = await readJson("fixtures/graph/v0.1/valid/zero-port-node.graph.json");
  requiredGraph.nodes[0].ports.push({
    id: "in",
    direction: "input",
    type: "value.number",
    required: true
  });
  const requiredResult = validateGraphDocumentV01(requiredGraph);
  assert.equal(requiredResult.ok, false);
  assert.match(requiredResult.errors.join("\n"), /missing-required-input/);
});

test("v0.1 rejects schema and node-definition semantic failures", async () => {
  assert.equal(validateGraphDocumentV01({
    schema: "skenion.graph",
    schemaVersion: "0.1.0"
  }).ok, false);
  assert.equal(validateNodeDefinitionV01({
    schema: "skenion.node.definition",
    schemaVersion: "0.1.0"
  }).ok, false);

  const badGroupGraph = await readJson("fixtures/graph/v0.1/valid/zero-port-node.graph.json");
  badGroupGraph.nodes[0].portGroups = [
    {
      id: "bad",
      direction: "input",
      type: "value.number",
      minPorts: 2,
      maxPorts: 1
    }
  ];
  const badGroupResult = validateGraphDocumentV01(badGroupGraph);
  assert.equal(badGroupResult.ok, false);
  assert.match(badGroupResult.errors.join("\n"), /invalid-port-group/);

  const invalidNode = await readJson("fixtures/node/v0.1/invalid/unsupported-permission.node.json");
  const invalidNodeResult = validateNodeDefinitionV01(invalidNode);
  assert.equal(invalidNodeResult.ok, false);
  assert.match(invalidNodeResult.errors.join("\n"), /unsupported permission/);

  const duplicatePortNode = await readJson("fixtures/node/v0.1/valid/render-clear-color.node.json");
  duplicatePortNode.ports.push({ ...duplicatePortNode.ports[0] });
  const duplicatePortResult = validateNodeDefinitionV01(duplicatePortNode);
  assert.equal(duplicatePortResult.ok, false);
  assert.match(duplicatePortResult.errors.join("\n"), /duplicate port id/);

  const badNodeGroup = await readJson("fixtures/node/v0.1/valid/dynamic-input-group.node.json");
  badNodeGroup.portGroups[0].minPorts = 2;
  badNodeGroup.portGroups[0].maxPorts = 1;
  const badNodeGroupResult = validateNodeDefinitionV01(badNodeGroup);
  assert.equal(badNodeGroupResult.ok, false);
  assert.match(badNodeGroupResult.errors.join("\n"), /maxPorts/);
});
