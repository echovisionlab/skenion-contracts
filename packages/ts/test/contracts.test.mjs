import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import * as contracts from "../dist/index.js";
import {
  CONTRACTS_COMPATIBILITY_LINE,
  CONTRACTS_COMPATIBILITY_RANGE,
  CONTRACTS_PACKAGE_VERSION,
  compatibilityMatrixV01Schema,
  SKENION_PACKAGE_MANIFEST_FILE_NAME,
  createDefaultViewStateForGraph,
  derivePatchContractV01,
  derivePatchContractsV01,
  deriveV0CompatibilityLine,
  deriveV0CompatibilityRange,
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
  planAudioClockBridgeV01,
  planConversion,
  projectV01Schema,
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
  validateMessageValue,
  validateExtensionManifestV01,
  validateObjectTextParseResult,
  validateGraphDocument,
  validateGraphDocumentV01,
  validateGraphFragmentV01,
  validatePackageDiscoveryResponseV01,
  validateEndpointBindingValueFormatV01,
  validatePackageInstallPlanRequestV01,
  validatePackageInstallPlanResponseV01,
  validatePackageListingV01,
  validatePackageManifestV01,
  validatePackageRootV01,
  validateNodeDefinition,
  validateNodeDefinitionV01,
  validatePatchDefinitionV01,
  validatePasteGraphFragmentRequest,
  validateProjectDocument,
  validateProjectDocumentV01,
  validateValueFormatV01,
  validateValueOccurrenceHeaderV01,
  validateCompatibilityMatrixV01,
  validateViewState,
  validateViewStateV01,
  validateShaderInterface,
  isCompatibilityMatrixV01,
  isPackageDiscoveryResponseV01,
  isPackageInstallPlanRequestV01,
  isPackageInstallPlanResponseV01,
  isPackageListingV01,
  isSameV0CompatibilityLine,
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
  for (const removedBuiltinExport of [
    "builtinManifestV01",
    "builtinNodeDefinitionsV01",
    "builtinNodeHelpGraphsV01",
    "builtinNodeHelpV01",
    "getBuiltinNodeDefinition",
    "getBuiltinNodeHelp",
    "getBuiltinNodeHelpGraph"
  ]) {
    assert.equal(Object.hasOwn(contracts, removedBuiltinExport), false, removedBuiltinExport);
  }
  assert.equal(graphV01Schema.properties.schemaVersion.const, "0.1.0");
  assert.equal(projectV01Schema.properties.schemaVersion.const, "0.1.0");
  assert.equal(viewStateV01Schema.properties.schemaVersion.const, "0.1.0");
  assert.equal(nodeDefinitionV01Schema.properties.schemaVersion.const, "0.1.0");
  assert.equal(objectTextParseResultV01Schema.properties.schema.const, "skenion.object-text.parse-result");
  assert.equal(extensionManifestV01Schema.properties.schemaVersion.const, "0.1.0");
  assert.equal(packageManifestV01Schema.properties.schema.const, "skenion.package.manifest");
  assert.equal(packageListingV01Schema.properties.schema.const, "skenion.package.listing");
  assert.equal(packageDiscoveryV01Schema.properties.schema.const, "skenion.package.discovery");
  assert.equal(packageInstallPlanRequestV01Schema.properties.schema.const, "skenion.package.install-plan.request");
  assert.equal(packageInstallPlanResponseV01Schema.properties.schema.const, "skenion.package.install-plan.response");
  assert.equal(SKENION_PACKAGE_MANIFEST_FILE_NAME, "skenion.package.json");
  assert.equal(compatibilityMatrixV01Schema.properties.schema.const, "skenion.compatibility-matrix");
  assert.equal(compatibilityMatrixV01Schema.properties["schema-version"].const, "0.1.0");
  assert.equal(CONTRACTS_PACKAGE_VERSION, tsPackageJson.version);
  assert.equal(CONTRACTS_COMPATIBILITY_LINE, deriveV0CompatibilityLine(CONTRACTS_PACKAGE_VERSION));
  assert.equal(CONTRACTS_COMPATIBILITY_RANGE, deriveV0CompatibilityRange(CONTRACTS_PACKAGE_VERSION));
  assert.equal(shaderInterfaceV01Schema.properties.schema.const, "skenion.shader.interface");
  assert.equal(messageValueV01Schema.properties.key.type, "string");
  assert.deepEqual(shaderDiagnosticV01Schema.properties.phase.enum, [
    "interface-analysis",
    "source-sync",
    "wgsl-generation",
    "wgsl-compile",
    "render-pipeline",
    "render-frame"
  ]);
  for (const runtimeExport of [
    "runtimeProjectRequestV0Schema",
    "runtimeOperationV0Schema",
    "runtimeSessionV0Schema",
    "runtimeCollaborationV0Schema",
    "validateRuntimeProjectRequest",
    "validateRuntimeOperationEnvelope",
    "validateRuntimeSessionEvent",
    "validateRuntimeSessionInfoResponse",
    "validateRuntimeCollaborationOperationEnvelope",
    "validatePasteGraphFragmentResponse",
    "RuntimeOperationEnvelope",
    "RuntimeSessionEvent",
    "RuntimeCollaborationOperationEnvelope",
    "PasteGraphFragmentResponse",
    "isRuntimeOperationEnvelope",
    "isRuntimeSessionEvent",
    "isRuntimeLogSnapshotResponse",
    "isPackageRegistryListResponse"
  ]) {
    assert.equal(Object.hasOwn(contracts, runtimeExport), false, runtimeExport);
  }
});

test("node definition schema validates message key policy shape", () => {
  const definition = {
    schema: "skenion.node.definition",
    schemaVersion: "0.1.0",
    id: "test.message-key-policy",
    version: "0.1.0",
    displayName: "Message Key Policy Fixture",
    category: "Test",
    ports: [
      {
        id: "in",
        direction: "input",
        type: "value.core.message",
        accepts: [
          "value.core.float64",
          "value.core.int64",
          "value.core.uint64",
          "value.core.bool",
          "value.core.string",
          "value.core.color",
          "value.core.bang"
        ],
        triggerMode: "trigger",
        latch: true,
        messageKeys: {
          accepted: ["bang", "set", "float", "int", "uint", "bool", "identifier", "list", "anything"],
          silent: ["set"],
          store: ["set"],
          emit: ["bang"],
          trigger: ["bang", "float", "int", "uint", "bool", "identifier", "list", "anything"]
        }
      },
      {
        id: "cold",
        direction: "input",
        type: "value.core.float64",
        triggerMode: "passive",
        latch: true
      },
      {
        id: "out",
        direction: "output",
        type: "value.core.float64"
      }
    ],
    execution: { model: "control" },
    state: { persistent: true },
    permissions: [],
    capabilities: []
  };

  assert.equal(validateNodeDefinitionV01(definition).ok, true);

  const missingKeys = structuredClone(definition);
  delete missingKeys.ports[0].messageKeys;
  const missingKeysResult = validateNodeDefinitionV01(missingKeys);
  assert.equal(missingKeysResult.ok, false);
  assert.match(missingKeysResult.errors.join("\n"), /requires messageKeys/);

  const unacceptedTrigger = structuredClone(definition);
  unacceptedTrigger.ports[0].messageKeys.trigger.push("unknown");
  const unacceptedTriggerResult = validateNodeDefinitionV01(unacceptedTrigger);
  assert.equal(unacceptedTriggerResult.ok, false);
  assert.match(unacceptedTriggerResult.errors.join("\n"), /key unknown is not accepted/);
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

  const incompatibleSdkRange = structuredClone(matrix);
  incompatibleSdkRange.components.sdk["supported-contracts-range"] = ">=0.44.0 <0.45.0";
  const incompatibleSdkRangeResult = validateCompatibilityMatrixV01(incompatibleSdkRange);
  assert.equal(incompatibleSdkRangeResult.ok, false);
  assert.match(incompatibleSdkRangeResult.errors.join("\n"), /supported-contracts-range/);

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

  const releaseArtifactSurface = structuredClone(matrix);
  releaseArtifactSurface.components.runtime.assets = {};
  releaseArtifactSurface.components.studio["desktop-assets"] = {};
  releaseArtifactSurface.verification = { "expected-checksums": {} };
  releaseArtifactSurface.promotion = { state: "promoted" };
  const releaseArtifactSurfaceResult = validateCompatibilityMatrixV01(releaseArtifactSurface);
  assert.equal(releaseArtifactSurfaceResult.ok, false);
  assert.match(releaseArtifactSurfaceResult.errors.join("\n"), /additional properties/);
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

test("validates package manifests and package roots", async () => {
  const patchPackage = await readJson("fixtures/package/v0.1/valid/patch-only.skenion.package.json");
  const patchPackageResult = validatePackageManifestV01(patchPackage);

  assert.equal(patchPackageResult.ok, true);
  assert.equal(patchPackage.schema, "skenion.package.manifest");
  assert.equal(patchPackage.category, "patch");
  assert.equal(patchPackage.source, undefined);
  assert.equal(patchPackage.root, undefined);
  assert.equal(patchPackage.trust, undefined);
  assert.equal(patchPackage.runtimeAbiRange, undefined);
  assert.equal(patchPackage.provides.patches[0].id, "example.oscillator");
  assert.equal(patchPackage.diagnostics[0].code, "package-manifest-read");
  assert.equal(patchPackage.diagnostics[0].details.fileName, SKENION_PACKAGE_MANIFEST_FILE_NAME);

  const mixedPackage = await readJson("fixtures/package/v0.1/valid/mixed-native.skenion.package.json");
  const mixedPackageResult = validatePackageManifestV01(mixedPackage);
  assert.equal(mixedPackageResult.ok, true);
  assert.equal(mixedPackage.category, "mixed");
  assert.equal(mixedPackage.runtimeAbiRange, ">=0.45.0 <0.46.0");
  assert.deepEqual(mixedPackage.targets, ["aarch64-apple-darwin", "x86_64-apple-darwin"]);

  const packageRootResult = validatePackageRootV01({
    schema: "skenion.package.root",
    schemaVersion: "0.1.0",
    manifestFileName: SKENION_PACKAGE_MANIFEST_FILE_NAME,
    manifest: patchPackage
  });
  assert.equal(packageRootResult.ok, true);

  assert.equal(validatePackageRootV01(null).ok, false);

  const wrongRootSchema = validatePackageRootV01({
    schema: "skenion.package.directory",
    schemaVersion: "0.1.0",
    manifestFileName: SKENION_PACKAGE_MANIFEST_FILE_NAME,
    manifest: patchPackage
  });
  assert.equal(wrongRootSchema.ok, false);
  assert.match(wrongRootSchema.errors.join("\n"), /schema must be skenion\.package\.root/);

  const wrongRootVersion = validatePackageRootV01({
    schema: "skenion.package.root",
    schemaVersion: "0.2.0",
    manifestFileName: SKENION_PACKAGE_MANIFEST_FILE_NAME,
    manifest: patchPackage
  });
  assert.equal(wrongRootVersion.ok, false);
  assert.match(wrongRootVersion.errors.join("\n"), /schemaVersion must be 0\.1\.0/);

  const invalidRootManifest = validatePackageRootV01({
    schema: "skenion.package.root",
    schemaVersion: "0.1.0",
    manifestFileName: SKENION_PACKAGE_MANIFEST_FILE_NAME,
    manifest: { ...patchPackage, schema: "skenion.extension.manifest" }
  });
  assert.equal(invalidRootManifest.ok, false);
  assert.match(invalidRootManifest.errors.join("\n"), /manifest .*schema/);

  const extensionManifest = await readJson("fixtures/extension/v0.1/valid/minimal-native-extension.manifest.json");
  const extensionSurfaceResult = validatePackageManifestV01(extensionManifest);
  assert.equal(extensionSurfaceResult.ok, false);
  assert.match(extensionSurfaceResult.errors.join("\n"), /schema must be equal to constant/);

  const secondMissingEvidence = structuredClone(mixedPackage);
  secondMissingEvidence.nativeArtifacts[0].evidenceRefs = ["native-attestation", "missing-native-attestation"];
  const secondMissingEvidenceResult = validatePackageManifestV01(secondMissingEvidence);
  assert.equal(secondMissingEvidenceResult.ok, false);
  assert.match(secondMissingEvidenceResult.errors.join("\n"), /missing-native-attestation/);

  const dottedPackageId = structuredClone(patchPackage);
  dottedPackageId.id = "skenion.examples";
  assert.equal(validatePackageManifestV01(dottedPackageId).ok, false);

  const underscoredProvidedId = structuredClone(patchPackage);
  underscoredProvidedId.provides.patches[0].id = "example.bad_id";
  assert.equal(validatePackageManifestV01(underscoredProvidedId).ok, false);

  const manifestInstallState = structuredClone(patchPackage);
  manifestInstallState.source = "first-party";
  assert.equal(validatePackageManifestV01(manifestInstallState).ok, false);

  const invalidCases = [
    ["fixtures/package/v0.1/invalid/native-missing-abi.skenion.package.json", /runtimeAbiRange/],
    ["fixtures/package/v0.1/invalid/native-missing-artifact.skenion.package.json", /nativeArtifacts/],
    ["fixtures/package/v0.1/invalid/native-missing-evidence.skenion.package.json", /missing evidence/],
    ["fixtures/package/v0.1/invalid/patch-with-runtime-abi.skenion.package.json", /must NOT be valid|runtimeAbiRange/],
    ["fixtures/package/v0.1/invalid/extension-only.package-root.json", /skenion\.package\.json/],
    ["fixtures/package/v0.1/invalid/both-manifests.package-root.json", /unsupported keys/]
  ];

  for (const [fixture, expected] of invalidCases) {
    const invalid = await readJson(fixture);
    const result = fixture.endsWith(".package-root.json")
      ? validatePackageRootV01(invalid)
      : validatePackageManifestV01(invalid);

    assert.equal(result.ok, false, fixture);
    assert.match(result.errors.join("\n"), expected, fixture);
  }
});

test("validates public package listing and discovery DTOs", async () => {
  const listing = await readJson("fixtures/package/v0.1/valid/patch-listing.skenion.package-listing.json");
  const listingResult = validatePackageListingV01(listing);

  assert.equal(listingResult.ok, true);
  assert.equal(isPackageListingV01(listing), true);
  assert.equal(listing.schema, "skenion.package.listing");
  assert.equal(listing.targetSupport.kind, "target-independent");
  assert.equal(listing.discoverySignals.stargazerCount, 128);
  assert.equal(listing.discoverySignals.rankingScore, 0.92);
  assert.equal(listing.account, undefined);
  assert.equal(listing.installPlan, undefined);

  const discovery = await readJson("fixtures/package/v0.1/valid/marketplace-search.skenion.package-discovery.json");
  const discoveryResult = validatePackageDiscoveryResponseV01(discovery);

  assert.equal(discoveryResult.ok, true);
  assert.equal(isPackageDiscoveryResponseV01(discovery), true);
  assert.equal(discovery.schema, "skenion.package.discovery");
  assert.equal(discovery.listings.length, 2);
  assert.equal(discovery.listings[1].targetSupport.kind, "targeted");
  assert.deepEqual(discovery.listings[1].targetSupport.targets, ["aarch64-apple-darwin", "x86_64-apple-darwin"]);
  assert.equal(discovery.listings[1].provides.nativeObjects[0].id, "example.sensor-native");
  assert.equal(discovery.listings[1].provides.codecs[0].id, "example.sensor-calibration-json");
  assert.equal(discovery.listings[1].diagnostics[0].code, "unavailable-target");
  assert.equal(discovery.diagnostics[0].code, "hidden-package");
  assert.equal(discovery.diagnostics[1].code, "quarantined-package");

  const duplicateDiscovery = structuredClone(discovery);
  duplicateDiscovery.listings.push(structuredClone(discovery.listings[0]));
  const duplicateDiscoveryResult = validatePackageDiscoveryResponseV01(duplicateDiscovery);
  assert.equal(duplicateDiscoveryResult.ok, false);
  assert.match(duplicateDiscoveryResult.errors.join("\n"), /duplicate package listing/);

  const accountState = structuredClone(listing);
  accountState.account = { viewerStarred: true };
  assert.equal(validatePackageListingV01(accountState).ok, false);

  const missingEvidence = structuredClone(listing);
  missingEvidence.artifactEvidence.artifacts[0].evidenceRefs = ["missing-evidence"];
  const missingEvidenceResult = validatePackageListingV01(missingEvidence);
  assert.equal(missingEvidenceResult.ok, false);
  assert.match(missingEvidenceResult.errors.join("\n"), /missing evidence/);

  const lineMismatch = structuredClone(listing);
  lineMismatch.contracts.line = "0.44";
  const lineMismatchResult = validatePackageListingV01(lineMismatch);
  assert.equal(lineMismatchResult.ok, false);
  assert.match(lineMismatchResult.errors.join("\n"), /contracts line must match contracts range/);

  const patchWithNativeArtifact = structuredClone(listing);
  patchWithNativeArtifact.artifactEvidence.artifacts.push(
    structuredClone(discovery.listings[1].artifactEvidence.artifacts[1])
  );
  const patchWithNativeArtifactResult = validatePackageListingV01(patchWithNativeArtifact);
  assert.equal(patchWithNativeArtifactResult.ok, false);
  assert.match(patchWithNativeArtifactResult.errors.join("\n"), /native artifact summaries/);

  const targetWithoutArtifact = structuredClone(discovery.listings[1]);
  targetWithoutArtifact.targetSupport.targets.push("x86_64-unknown-linux-gnu");
  const targetWithoutArtifactResult = validatePackageListingV01(targetWithoutArtifact);
  assert.equal(targetWithoutArtifactResult.ok, false);
  assert.match(targetWithoutArtifactResult.errors.join("\n"), /has no native artifact summary/);

  const unavailableTargets = structuredClone(discovery.listings[1]);
  unavailableTargets.targetSupport.kind = "unavailable";
  delete unavailableTargets.targetSupport.targets;
  const unavailableTargetsResult = validatePackageListingV01(unavailableTargets);
  assert.equal(unavailableTargetsResult.ok, true);

  const duplicateSummaries = structuredClone(discovery.listings[1]);
  duplicateSummaries.provides.nativeObjects.push(structuredClone(duplicateSummaries.provides.nativeObjects[0]));
  duplicateSummaries.provides.codecs.push(structuredClone(duplicateSummaries.provides.codecs[0]));
  const duplicateSummariesResult = validatePackageListingV01(duplicateSummaries);
  assert.equal(duplicateSummariesResult.ok, false);
  assert.match(
    duplicateSummariesResult.errors.join("\n"),
    /duplicate provided native object id|duplicate provided codec id/
  );

  const invalidCases = [
    ["fixtures/package/v0.1/invalid/listing-contracts-range-mismatch.skenion.package-listing.json", validatePackageListingV01, /contracts line must match contracts range/],
    ["fixtures/package/v0.1/invalid/listing-invalid-artifact-evidence.skenion.package-listing.json", validatePackageListingV01, /checksum|path/],
    ["fixtures/package/v0.1/invalid/listing-malformed-public-metadata.skenion.package-listing.json", validatePackageListingV01, /version|homepageUrl|repositoryUrl|rankingScore/],
    ["fixtures/package/v0.1/invalid/listing-missing-summary.skenion.package-listing.json", validatePackageListingV01, /summary/],
    ["fixtures/package/v0.1/invalid/listing-missing-native-artifact.skenion.package-listing.json", validatePackageListingV01, /contains|constant|native artifact/],
    ["fixtures/package/v0.1/invalid/listing-widened-runtime-abi-range.skenion.package-listing.json", validatePackageListingV01, /runtimeAbiRange/],
    ["fixtures/package/v0.1/invalid/listing-unsupported-contracts-range.skenion.package-discovery.json", validatePackageDiscoveryResponseV01, /range/]
  ];

  for (const [fixture, validate, expected] of invalidCases) {
    const invalid = await readJson(fixture);
    const result = validate(invalid);

    assert.equal(result.ok, false, fixture);
    assert.match(result.errors.join("\n"), expected, fixture);
  }
});

test("validates package install and update plan DTOs", async () => {
  const request = await readJson("fixtures/package/v0.1/valid/update-plan-request.skenion.package-install-plan-request.json");
  const requestResult = validatePackageInstallPlanRequestV01(request);
  assert.equal(requestResult.ok, true);
  assert.equal(isPackageInstallPlanRequestV01(request), true);
  assert.equal(request.schema, "skenion.package.install-plan.request");
  assert.equal(request.current.packageLock[0].manifestPath.startsWith("/"), false);
  assert.equal(request.candidates[0].listing.packageId, request.packageId);
  assert.equal(request.candidates[0].manifest.id, request.packageId);

  const installRequest = structuredClone(request);
  installRequest.intent = "install";
  delete installRequest.current.installedLockEntryId;
  delete installRequest.desired.version;
  delete installRequest.candidates[0].manifest;
  assert.equal(validatePackageInstallPlanRequestV01(installRequest).ok, true);

  const exactInstallRequest = structuredClone(installRequest);
  exactInstallRequest.desired = { version: "0.45.1" };
  assert.equal(validatePackageInstallPlanRequestV01(exactInstallRequest).ok, true);

  const missingInstalledLock = structuredClone(request);
  missingInstalledLock.current.installedLockEntryId = "missing-lock-entry";
  const missingInstalledLockResult = validatePackageInstallPlanRequestV01(missingInstalledLock);
  assert.equal(missingInstalledLockResult.ok, false);
  assert.match(missingInstalledLockResult.errors.join("\n"), /missing installedLockEntryId/);

  const mismatchedCandidate = structuredClone(installRequest);
  mismatchedCandidate.candidates[0].listing.packageId = "example/other-package";
  const mismatchedCandidateResult = validatePackageInstallPlanRequestV01(mismatchedCandidate);
  assert.equal(mismatchedCandidateResult.ok, false);
  assert.match(mismatchedCandidateResult.errors.join("\n"), /does not match request packageId/);

  const mismatchedManifest = structuredClone(request);
  mismatchedManifest.candidates[0].manifest.id = "example/other-package";
  const mismatchedManifestResult = validatePackageInstallPlanRequestV01(mismatchedManifest);
  assert.equal(mismatchedManifestResult.ok, false);
  assert.match(mismatchedManifestResult.errors.join("\n"), /manifest id/);

  const mismatchedManifestVersion = structuredClone(request);
  mismatchedManifestVersion.candidates[0].manifest.version = "0.45.0";
  const mismatchedManifestVersionResult = validatePackageInstallPlanRequestV01(mismatchedManifestVersion);
  assert.equal(mismatchedManifestVersionResult.ok, false);
  assert.match(mismatchedManifestVersionResult.errors.join("\n"), /manifest version/);

  const targetMismatch = await readJson("fixtures/package/v0.1/invalid/plan-request-target-mismatch.skenion.package-install-plan-request.json");
  const targetMismatchResult = validatePackageInstallPlanRequestV01(targetMismatch);
  assert.equal(targetMismatchResult.ok, false);
  assert.match(targetMismatchResult.errors.join("\n"), /target .* must use target triple/);

  const targetContractsMismatch = structuredClone(request);
  targetContractsMismatch.target.contracts.range = ">=0.45.1 <0.46.0";
  const targetContractsMismatchResult = validatePackageInstallPlanRequestV01(targetContractsMismatch);
  assert.equal(targetContractsMismatchResult.ok, false);
  assert.match(targetContractsMismatchResult.errors.join("\n"), /target contracts line/);

  const targetRuntimeAbiMismatch = structuredClone(request);
  targetRuntimeAbiMismatch.target.runtimeAbiRange = ">=0.45.1 <0.46.0";
  const targetRuntimeAbiMismatchResult = validatePackageInstallPlanRequestV01(targetRuntimeAbiMismatch);
  assert.equal(targetRuntimeAbiMismatchResult.ok, false);
  assert.match(targetRuntimeAbiMismatchResult.errors.join("\n"), /target runtimeAbiRange/);

  const desiredRangeMismatch = structuredClone(request);
  desiredRangeMismatch.desired.versionRange = ">=0.45.1 <0.46.0";
  const desiredRangeMismatchResult = validatePackageInstallPlanRequestV01(desiredRangeMismatch);
  assert.equal(desiredRangeMismatchResult.ok, false);
  assert.match(desiredRangeMismatchResult.errors.join("\n"), /desired versionRange/);

  const patchLockWithNativeEvidence = structuredClone(request);
  patchLockWithNativeEvidence.current.packageLock[0].category = "patch";
  const patchLockWithNativeEvidenceResult = validatePackageInstallPlanRequestV01(patchLockWithNativeEvidence);
  assert.equal(patchLockWithNativeEvidenceResult.ok, false);
  assert.match(patchLockWithNativeEvidenceResult.errors.join("\n"), /must not declare runtimeAbiRange/);
  assert.match(patchLockWithNativeEvidenceResult.errors.join("\n"), /must not declare target/);
  assert.match(patchLockWithNativeEvidenceResult.errors.join("\n"), /must not declare nativeArtifacts/);

  const mixedLockWithoutNativeEvidence = structuredClone(request);
  delete mixedLockWithoutNativeEvidence.current.packageLock[0].runtimeAbiRange;
  delete mixedLockWithoutNativeEvidence.current.packageLock[0].target;
  delete mixedLockWithoutNativeEvidence.current.packageLock[0].nativeArtifacts;
  const mixedLockWithoutNativeEvidenceResult = validatePackageInstallPlanRequestV01(mixedLockWithoutNativeEvidence);
  assert.equal(mixedLockWithoutNativeEvidenceResult.ok, false);
  assert.match(mixedLockWithoutNativeEvidenceResult.errors.join("\n"), /requires runtimeAbiRange/);
  assert.match(mixedLockWithoutNativeEvidenceResult.errors.join("\n"), /requires target/);
  assert.match(mixedLockWithoutNativeEvidenceResult.errors.join("\n"), /requires nativeArtifacts/);

  const nativeLockCurrentState = structuredClone(request);
  nativeLockCurrentState.current.packageLock[0].category = "native";
  assert.equal(validatePackageInstallPlanRequestV01(nativeLockCurrentState).ok, true);

  const invalidPlanRequests = [
    [
      "fixtures/package/v0.1/invalid/plan-request-missing-binding-lock-entry.skenion.package-install-plan-request.json",
      /object binding .* references missing lockEntryId/
    ],
    [
      "fixtures/package/v0.1/invalid/plan-request-stale-installed-lock.skenion.package-install-plan-request.json",
      /missing installedLockEntryId/
    ],
    [
      "fixtures/package/v0.1/invalid/plan-request-noncanonical-desired-version-range.skenion.package-install-plan-request.json",
      /desired versionRange/
    ],
    [
      "fixtures/package/v0.1/invalid/plan-request-patch-lock-with-runtime-abi.skenion.package-install-plan-request.json",
      /must not declare runtimeAbiRange/
    ]
  ];

  for (const [fixture, expected] of invalidPlanRequests) {
    const invalid = await readJson(fixture);
    const invalidResult = validatePackageInstallPlanRequestV01(invalid);
    assert.equal(invalidResult.ok, false, fixture);
    assert.match(invalidResult.errors.join("\n"), expected, fixture);
  }

  assert.equal(validatePackageInstallPlanRequestV01({ schema: "skenion.package.listing" }).ok, false);
  assert.equal(validatePackageInstallPlanRequestV01({ schema: "skenion.package.install-plan.request" }).ok, false);
  assert.equal(validatePackageInstallPlanRequestV01("skenion.package.install-plan.request").ok, false);
  const requestWithNullLockEntry = structuredClone(request);
  requestWithNullLockEntry.current.packageLock = [null];
  assert.equal(validatePackageInstallPlanRequestV01(requestWithNullLockEntry).ok, false);

  assert.equal(validatePackageInstallPlanRequestV01(null).ok, false);

  const updateResponse = await readJson("fixtures/package/v0.1/valid/update-plan-response.skenion.package-install-plan-response.json");
  const updateResponseResult = validatePackageInstallPlanResponseV01(updateResponse);
  assert.equal(updateResponseResult.ok, true);
  assert.equal(isPackageInstallPlanResponseV01(updateResponse), true);
  assert.equal(updateResponse.schema, "skenion.package.install-plan.response");
  assert.deepEqual(updateResponse.actions.map((action) => action.kind), [
    "download",
    "download",
    "verify",
    "stage",
    "disable",
    "replace"
  ]);
  assert.equal(updateResponse.actions[5].capabilityChanges[0].capabilityKind, "resource");

  const keepResponse = await readJson("fixtures/package/v0.1/valid/keep-plan-response.skenion.package-install-plan-response.json");
  assert.equal(validatePackageInstallPlanResponseV01(keepResponse).ok, true);
  assert.equal(keepResponse.actions[0].kind, "keep");
  assert.equal(keepResponse.checks[1].status, "skipped");

  const rollbackResponse = await readJson("fixtures/package/v0.1/valid/rollback-plan-response.skenion.package-install-plan-response.json");
  assert.equal(validatePackageInstallPlanResponseV01(rollbackResponse).ok, true);
  assert.equal(rollbackResponse.actions[0].kind, "rollback");

  const rejectResponse = await readJson("fixtures/package/v0.1/valid/reject-plan-response.skenion.package-install-plan-response.json");
  assert.equal(validatePackageInstallPlanResponseV01(rejectResponse).ok, true);
  assert.equal(rejectResponse.ok, false);
  assert.equal(rejectResponse.actions[0].kind, "reject");
  assert.equal(rejectResponse.diagnostics[0].code, "unsupported-target");

  const unorderedActions = await readJson("fixtures/package/v0.1/invalid/plan-response-unordered-actions.skenion.package-install-plan-response.json");
  const unorderedActionsResult = validatePackageInstallPlanResponseV01(unorderedActions);
  assert.equal(unorderedActionsResult.ok, false);
  assert.match(unorderedActionsResult.errors.join("\n"), /order must be 0/);

  const rejectWithoutError = await readJson("fixtures/package/v0.1/invalid/plan-response-reject-without-error.skenion.package-install-plan-response.json");
  const rejectWithoutErrorResult = validatePackageInstallPlanResponseV01(rejectWithoutError);
  assert.equal(rejectWithoutErrorResult.ok, false);
  assert.match(rejectWithoutErrorResult.errors.join("\n"), /requires an error diagnostic/);

  const responseTargetMismatch = structuredClone(keepResponse);
  responseTargetMismatch.target.os = "linux";
  responseTargetMismatch.target.arch = "x86_64";
  const responseTargetMismatchResult = validatePackageInstallPlanResponseV01(responseTargetMismatch);
  assert.equal(responseTargetMismatchResult.ok, false);
  assert.match(responseTargetMismatchResult.errors.join("\n"), /target .* must use target triple/);

  const successfulReject = structuredClone(rejectResponse);
  successfulReject.ok = true;
  const successfulRejectResult = validatePackageInstallPlanResponseV01(successfulReject);
  assert.equal(successfulRejectResult.ok, false);
  assert.match(successfulRejectResult.errors.join("\n"), /must not include failed checks|must not include reject actions/);

  const failedResponseWithoutReject = structuredClone(rejectResponse);
  failedResponseWithoutReject.actions = [];
  const failedResponseWithoutRejectResult = validatePackageInstallPlanResponseV01(failedResponseWithoutReject);
  assert.equal(failedResponseWithoutRejectResult.ok, false);
  assert.match(failedResponseWithoutRejectResult.errors.join("\n"), /requires a reject action/);

  const failedCheckWithEmptyDiagnosticRefs = structuredClone(rejectResponse);
  failedCheckWithEmptyDiagnosticRefs.checks[0].diagnosticRefs = [];
  const failedCheckWithEmptyDiagnosticRefsResult = validatePackageInstallPlanResponseV01(failedCheckWithEmptyDiagnosticRefs);
  assert.equal(failedCheckWithEmptyDiagnosticRefsResult.ok, false);
  assert.match(failedCheckWithEmptyDiagnosticRefsResult.errors.join("\n"), /failing check .* requires diagnosticRefs/);

  const rejectActionWithEmptyDiagnosticRefs = structuredClone(rejectResponse);
  rejectActionWithEmptyDiagnosticRefs.actions[0].diagnosticRefs = [];
  const rejectActionWithEmptyDiagnosticRefsResult = validatePackageInstallPlanResponseV01(rejectActionWithEmptyDiagnosticRefs);
  assert.equal(rejectActionWithEmptyDiagnosticRefsResult.ok, false);
  assert.match(rejectActionWithEmptyDiagnosticRefsResult.errors.join("\n"), /reject action .* requires diagnosticRefs/);

  const invalidResponseShape = structuredClone(updateResponse);
  invalidResponseShape.checks = [null];
  invalidResponseShape.actions = [null];
  invalidResponseShape.diagnostics = [null];
  assert.equal(validatePackageInstallPlanResponseV01(invalidResponseShape).ok, false);

  const invalidPlanResponses = [
    [
      "fixtures/package/v0.1/invalid/plan-response-ok-with-fail-check.skenion.package-install-plan-response.json",
      /must not include failed checks/
    ],
    [
      "fixtures/package/v0.1/invalid/plan-response-removed-capability-missing-diagnostic-ref.skenion.package-install-plan-response.json",
      /references missing diagnostic/
    ],
    [
      "fixtures/package/v0.1/invalid/plan-response-rollback-unavailable-missing-action-diagnostic.skenion.package-install-plan-response.json",
      /references missing diagnostic/
    ],
    [
      "fixtures/package/v0.1/invalid/plan-response-checksum-mismatch-bad-checksum.skenion.package-install-plan-response.json",
      /pattern|checksum|must match/
    ],
    [
      "fixtures/package/v0.1/invalid/plan-response-missing-provenance-evidence-ref.skenion.package-install-plan-response.json",
      /references missing diagnostic/
    ],
    [
      "fixtures/package/v0.1/invalid/plan-response-missing-diagnostic-refs.skenion.package-install-plan-response.json",
      /requires diagnosticRefs/
    ]
  ];

  for (const [fixture, expected] of invalidPlanResponses) {
    const invalid = await readJson(fixture);
    const invalidResult = validatePackageInstallPlanResponseV01(invalid);
    assert.equal(invalidResult.ok, false, fixture);
    assert.match(invalidResult.errors.join("\n"), expected, fixture);
  }

  assert.equal(validatePackageInstallPlanResponseV01({ schema: "skenion.package.listing" }).ok, false);
  assert.equal(validatePackageInstallPlanResponseV01({ schema: "skenion.package.install-plan.response" }).ok, false);
  assert.equal(validatePackageInstallPlanResponseV01("skenion.package.install-plan.response").ok, false);
  assert.equal(validatePackageInstallPlanResponseV01(null).ok, false);
});

test("validates object text parse result fixtures", async () => {
  const add = await readJson("fixtures/object-text/v0.1/valid/add-int.parse.json");
  const addResult = validateObjectTextParseResult(add);

  assert.equal(addResult.ok, true);
  assert.equal(add.className, "+");
  assert.equal(add.resolvedKind, null);
  assert.deepEqual(add.params, {});
  assert.deepEqual(add.instancePorts, []);

  const runtimeResolved = {
    schema: "skenion.object-text.parse-result",
    schemaVersion: "0.1.0",
    input: "example.gain 0.5",
    ok: true,
    className: "example.gain",
    creationArgs: [{ type: "float", value: 0.5, representation: "f32" }],
    resolvedKind: "example.package.gain",
    resolvedKindVersion: "0.1.0",
    params: { gain: 0.5 },
    instancePorts: [
      {
        id: "in",
        direction: "input",
        type: "value.core.message",
        rate: "control",
        activation: "trigger",
        messageKeys: {
          accepted: ["bang", "set", "float"],
          silent: ["set"],
          store: ["set"],
          trigger: ["bang", "float"],
          emit: ["bang", "float"]
        }
      },
      { id: "out", direction: "output", type: "value.core.float64", rate: "control" }
    ],
    displayText: "example.gain 0.5",
    diagnostics: []
  };
  const runtimeResolvedResult = validateObjectTextParseResult(runtimeResolved);

  assert.equal(runtimeResolvedResult.ok, true);

  const symbolic = await readJson("fixtures/object-text/v0.1/valid/deferred-class-symbol.parse.json");
  const symbolicResult = validateObjectTextParseResult(symbolic);

  assert.equal(symbolicResult.ok, true);
  assert.equal(symbolic.ok, true);
  assert.equal(symbolic.resolvedKind, null);
  assert.deepEqual(symbolic.diagnostics, []);

  const invalid = await readJson("fixtures/object-text/v0.1/invalid/missing-class-symbol.parse.json");
  const invalidResult = validateObjectTextParseResult(invalid);

  assert.equal(invalidResult.ok, false);
  assert.match(invalidResult.errors.join("\n"), /className/);

  for (const fixture of [
    "fixtures/object-text/v0.1/invalid/message-value-missing-keys.parse.json",
    "fixtures/object-text/v0.1/invalid/accepts-message-value-missing-keys.parse.json"
  ]) {
    const missingKeys = await readJson(fixture);
    const result = validateObjectTextParseResult(missingKeys);

    assert.equal(result.ok, false, fixture);
    assert.match(result.errors.join("\n"), /requires messageKeys/, fixture);
  }
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
  assert.equal(raw.className, "+");
  assert.deepEqual(raw.creationArgs, [{ type: "int", value: 1, representation: "i32" }]);
  assert.equal(raw.resolvedKind, null);
  assert.deepEqual(raw.params, {});
  assert.deepEqual(raw.instancePorts, []);

  const bracketed = parseObjectTextV01("[osc~ 1e3]");
  assert.equal(bracketed.ok, true);
  assert.equal(bracketed.displayText, "osc~ 1e3");
  assert.equal(bracketed.className, "osc~");
  assert.deepEqual(bracketed.creationArgs, [{ type: "float", value: 1000, representation: "f32" }]);
  assert.equal(bracketed.resolvedKind, null);

  const runtimeOwned = parseObjectTextV01("frobnicate true");
  assert.equal(runtimeOwned.ok, true);
  assert.equal(runtimeOwned.className, "frobnicate");
  assert.deepEqual(runtimeOwned.creationArgs, [{ type: "bool", value: true }]);
  assert.deepEqual(runtimeOwned.diagnostics, []);

  const nonFinite = parseObjectTextV01("+ 1e309");
  assert.deepEqual(nonFinite.creationArgs, [{ type: "identifier", value: "1e309" }]);

  assert.equal(parseObjectTextV01("[+ 1").diagnostics[0].code, "invalid-syntax");
  assert.equal(parseObjectTextV01("+ 1]").diagnostics[0].code, "invalid-syntax");
  assert.equal(parseObjectTextV01("").diagnostics[0].code, "empty-object-text");
});

test("validates control messages as key and atoms", () => {
  const bang = validateMessageValue({ key: "bang", atoms: [] });
  assert.equal(bang.ok, true);

  const set = validateMessageValue({
    key: "set",
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

  const canonicalSet = validateMessageValue({
    key: "set",
    atoms: [
      { type: "float", representation: "f32", value: 0.75 },
      { type: "int", representation: "i32", value: 3 },
      { type: "uint", representation: "u8", value: 255 },
      { type: "string", value: "speed" },
      { type: "color", representation: "rgba32f", value: [1, 0.25, 0, 1] }
    ]
  });
  assert.equal(canonicalSet.ok, true);

  const invalidLegacyBang = validateMessageValue({ type: "bang" });
  assert.equal(invalidLegacyBang.ok, false);
  assert.match(invalidLegacyBang.errors.join("\n"), /must have required property 'key'/);
});

test("validates value format and occurrence primitives", () => {
  for (const [valueTypeId, format] of [
    ["value.core.float8", "f8.e4m3"],
    ["value.core.float8", "f8.e5m2"],
    ["value.core.float16", "f16"],
    ["value.core.float32", "f32"],
    ["value.core.float64", "f64"],
    ["value.core.ufloat8", "ufloat8"],
    ["value.core.ufloat16", "ufloat16"],
    ["value.core.ufloat32", "ufloat32"],
    ["value.core.ufloat64", "ufloat64"],
    ["value.core.int8", "i8"],
    ["value.core.int16", "i16"],
    ["value.core.int32", "i32"],
    ["value.core.int64", "i64"],
    ["value.core.uint8", "u8"],
    ["value.core.uint16", "u16"],
    ["value.core.uint32", "u32"],
    ["value.core.uint64", "u64"],
    ["value.core.color", "rgba32f"],
    ["value.core.vector", "f32"]
  ]) {
    const shape = valueTypeId === "value.core.vector" ? { shape: [4] } : {};
    assert.equal(validateValueFormatV01({ valueTypeId, format, ...shape }).ok, true, valueTypeId);
  }

  const tensorFormat = validateValueFormatV01({
    valueTypeId: "value.core.tensor",
    format: "rgba8unorm",
    shape: [1080, 1920, 4],
    layout: "row-major",
    colorSpace: "srgb",
    alphaPolicy: "premultiplied"
  });
  assert.equal(tensorFormat.ok, true);

  const customFormat = validateValueFormatV01({
    valueTypeId: "value.mike32.selector",
    format: "mike32.selector.v1"
  });
  assert.equal(customFormat.ok, true);

  for (const invalidFormat of [
    null,
    [],
    { unknown: true },
    { valueTypeId: "value.core.nope" },
    { valueTypeId: "wrong.namespace" },
    { valueTypeId: "value.core.float32", format: 1 },
    { valueTypeId: "value.media.video-frame", format: "rgba8unorm", shape: [1, 1, 4] },
    { valueTypeId: "value.core.tensor", format: "rgba8unorm", shape: [] },
    { valueTypeId: "value.core.tensor", shape: [1, 1, 4] },
    { valueTypeId: "value.core.matrix", format: "f32" },
    { valueTypeId: "value.core.matrix", format: "f32", shape: [2, 2], strides: [0] },
    { valueTypeId: "value.core.float32", format: "i32" },
    { valueTypeId: "value.core.float32", format: "f32", byteLength: 0 },
    { valueTypeId: "value.core.float32", format: "f32", channels: 0 },
    { valueTypeId: "value.core.float32", format: "f32", sampleRate: "bad" },
    { valueTypeId: "value.core.float32", format: "f32", sampleRate: 0 },
    { valueTypeId: "value.core.float32", format: "f32", dynamicShape: "yes" },
    { valueTypeId: "value.core.float32", format: "f32", layout: 1 },
    { valueTypeId: "value.core.float32", format: "f32", channelLayout: 1 },
    { valueTypeId: "value.core.float32", format: "f32", colorSpace: 1 },
    { valueTypeId: "value.core.float32", format: "f32", colorRange: 1 },
    { valueTypeId: "value.core.float32", format: "f32", transfer: 1 },
    { valueTypeId: "value.core.float32", format: "f32", primaries: 1 },
    { valueTypeId: "value.core.float32", format: "f32", alphaPolicy: 1 },
    { valueTypeId: "value.core.float32", format: "f32", resourceKind: 1 },
    { valueTypeId: "value.core.bang", format: "f32" },
    { valueTypeId: "value.core.bang", shape: [1] },
    { valueTypeId: "value.core.bang", byteLength: 1 },
    { valueTypeId: "value.core.bang", resourceKind: "runtime-handle" }
  ]) {
    const result = validateValueFormatV01(invalidFormat);
    assert.equal(result.ok, false, JSON.stringify(invalidFormat));
  }

  const binding = validateEndpointBindingValueFormatV01({
    bindingId: "edge_1",
    bindingEpoch: 1,
    formatRevision: 2,
    formatDigest: "a".repeat(64),
    valueFormat: {
      valueTypeId: "value.core.matrix",
      format: "f32",
      shape: [128, 2],
      sampleRate: 48000,
      channels: 2,
      layout: "interleaved"
    },
    source: { nodeId: "source_1", portId: "out" },
    target: { nodeId: "target_1", portId: "in" },
    delivery: { policy: "ordered", maxInFlight: 2 }
  });
  assert.equal(binding.ok, true);

  const staleBinding = validateEndpointBindingValueFormatV01({
    bindingId: "edge_1",
    bindingEpoch: 0,
    formatRevision: 0,
    formatDigest: "not-sha",
    valueFormat: { valueTypeId: "value.core.float32", format: "f32" }
  });
  assert.equal(staleBinding.ok, false);
  assert.match(staleBinding.errors.join("\n"), /bindingEpoch/);
  assert.match(staleBinding.errors.join("\n"), /formatRevision/);
  assert.match(staleBinding.errors.join("\n"), /formatDigest/);

  for (const invalidBinding of [
    null,
    [],
    { extra: true },
    {
      bindingId: "",
      valueFormat: { valueTypeId: "value.core.float32", format: "f32" }
    },
    {
      bindingId: "edge_1",
      bindingEpoch: "1",
      formatRevision: "1",
      valueFormat: { valueTypeId: "value.core.float32", format: "f32" },
      source: "not-object",
      target: { nodeId: "", portId: "" },
      delivery: "not-object"
    },
    {
      bindingId: "edge_1",
      bindingEpoch: 1,
      formatRevision: 1,
      valueFormat: { valueTypeId: "value.core.float32", format: "f32" },
      source: { nodeId: "", portId: "", extra: true },
      delivery: { policy: "bad", maxInFlight: 0, keyframes: "yes", extra: true }
    }
  ]) {
    assert.equal(validateEndpointBindingValueFormatV01(invalidBinding).ok, false, JSON.stringify(invalidBinding));
  }

  const occurrence = validateValueOccurrenceHeaderV01({
    bindingId: "edge_1",
    bindingEpoch: 1,
    formatRevision: 2,
    sequence: 0,
    clock: "render-frame",
    timestamp: 12,
    payloadKind: "bytes",
    byteLength: 4096,
    byteOffset: 0,
    actualShape: [32, 32, 4],
    flags: ["keyframe"]
  });
  assert.equal(occurrence.ok, true);

  const invalidOccurrence = validateValueOccurrenceHeaderV01({
    bindingId: "edge_1",
    bindingEpoch: 1,
    formatRevision: 0,
    sequence: 0,
    payloadKind: "empty",
    byteLength: 1
  });
  assert.equal(invalidOccurrence.ok, false);
  assert.match(invalidOccurrence.errors.join("\n"), /formatRevision/);
  assert.match(invalidOccurrence.errors.join("\n"), /byteLength is not allowed/);

  for (const invalidHeader of [
    null,
    [],
    { extra: true },
    { bindingId: "", payloadKind: "bad" },
    {
      bindingId: "edge_1",
      bindingEpoch: "1",
      formatRevision: "1",
      sequence: "0",
      payloadKind: "bytes",
      clock: 1,
      timestamp: "now",
      byteLength: 0,
      byteOffset: -1,
      actualShape: [0],
      flags: "keyframe",
      droppedBefore: -1,
      duration: "bad"
    },
    {
      bindingId: "edge_1",
      bindingEpoch: 1,
      formatRevision: 1,
      sequence: 0,
      payloadKind: "bytes",
      flags: ["bad"],
      duration: -1
    },
    {
      bindingId: "edge_1",
      bindingEpoch: 1,
      formatRevision: 1,
      sequence: 0,
      payloadKind: "empty",
      byteOffset: 0
    },
    {
      bindingId: "edge_1",
      bindingEpoch: 1,
      formatRevision: 1,
      sequence: 0,
      payloadKind: "empty",
      actualShape: [1]
    }
  ]) {
    assert.equal(validateValueOccurrenceHeaderV01(invalidHeader).ok, false, JSON.stringify(invalidHeader));
  }
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
  assert.equal(representationRegistryV01.some((representation) => representation.id === "f8.e5m2"), true);
  assert.equal(representationRegistryV01.some((representation) => representation.id === "ufloat8"), true);
  assert.equal(representationRegistryV01.some((representation) => representation.id === "ufloat16"), true);
  assert.equal(representationRegistryV01.some((representation) => representation.id === "ufloat32"), true);
  assert.equal(representationRegistryV01.some((representation) => representation.id === "ufloat64"), true);
  assert.equal(representationRegistryV01.some((representation) => representation.id === "i16"), true);
  assert.equal(representationRegistryV01.some((representation) => representation.id === "u8"), true);
  assert.equal(representationRegistryV01.some((representation) => representation.id === "rgba8unorm"), true);

  const knownRepresentations = new Set(representationRegistryV01.map((representation) => representation.id));
  const controlType = (dataKind, format) => ({ flow: "control", dataKind, format });
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
    ["float32 -> float16", controlType("value.core.float32", "f32"), controlType("value.core.float16", "f16"), "numeric-cast"],
    ["float32 -> int32", controlType("value.core.float32", "f32"), controlType("value.core.int32", "i32"), "float-to-integer"],
    ["float32 -> uint32", controlType("value.core.float32", "f32"), controlType("value.core.uint32", "u32"), "float-to-integer"],
    ["int32 -> int8", controlType("value.core.int32", "i32"), controlType("value.core.int8", "i8"), "numeric-cast"],
    ["int32 -> uint32", controlType("value.core.int32", "i32"), controlType("value.core.uint32", "u32"), "integer-signedness"],
    ["int32 -> float32", controlType("value.core.int32", "i32"), controlType("value.core.float32", "f32"), "integer-to-float"],
    ["uint32 -> uint8", controlType("value.core.uint32", "u32"), controlType("value.core.uint8", "u8"), "numeric-cast"],
    ["uint32 -> int32", controlType("value.core.uint32", "u32"), controlType("value.core.int32", "i32"), "integer-signedness"],
    ["uint32 -> float32", controlType("value.core.uint32", "u32"), controlType("value.core.float32", "f32"), "integer-to-float"],
    ["ufloat8 -> float32", controlType("value.core.ufloat8", "ufloat8"), controlType("value.core.float32", "f32"), "numeric-cast"],
    ["ufloat16 -> int32", controlType("value.core.ufloat16", "ufloat16"), controlType("value.core.int32", "i32"), "float-to-integer"],
    ["ufloat8 -> uint32", controlType("value.core.ufloat8", "ufloat8"), controlType("value.core.uint32", "u32"), "float-to-integer"],
    ["color -> color", controlType("value.core.color", "rgba32f"), controlType("value.core.color", "rgba8unorm"), "color-cast"]
  ];
  for (const [label, source, target, expectedPolicy] of semanticConversions) {
    assertImplicitConversion(label, source, target, expectedPolicy);
  }

  const representationConversions = [
    ["f32 -> f8", controlType("value.core.float32", "f32"), controlType("value.core.float8", "f8.e4m3"), "numeric-cast"],
    ["f8 e5m2 -> f16", controlType("value.core.float8", "f8.e5m2"), controlType("value.core.float16", "f16"), "numeric-cast"],
    ["f8 e4m3 -> f8 e5m2", controlType("value.core.float8", "f8.e4m3"), controlType("value.core.float8", "f8.e5m2"), "numeric-cast"],
    ["ufloat8 -> uint8", controlType("value.core.ufloat8", "ufloat8"), controlType("value.core.uint8", "u8"), "float-to-integer"],
    ["ufloat16 -> int16", controlType("value.core.ufloat16", "ufloat16"), controlType("value.core.int16", "i16"), "float-to-integer"],
    ["float32 -> uint8", controlType("value.core.float32", "f32"), controlType("value.core.uint8", "u8"), "float-to-integer"],
    ["int32 -> float16", controlType("value.core.int32", "i32"), controlType("value.core.float16", "f16"), "integer-to-float"],
    ["uint32 -> int8", controlType("value.core.uint32", "u32"), controlType("value.core.int8", "i8"), "integer-signedness"],
    ["i32 -> i8", controlType("value.core.int32", "i32"), controlType("value.core.int8", "i8"), "numeric-cast"],
    ["u32 -> u8", controlType("value.core.uint32", "u32"), controlType("value.core.uint8", "u8"), "numeric-cast"],
    ["rgba32f -> rgba8unorm", controlType("value.core.color", "rgba32f"), controlType("value.core.color", "rgba8unorm"), "color-cast"],
    ["rgb -> rgba", controlType("value.core.color", "rgb8unorm"), controlType("value.core.color", "rgba8unorm"), "color-cast"],
    ["rgba -> rgb", controlType("value.core.color", "rgba8unorm"), controlType("value.core.color", "rgb8unorm"), "color-cast"]
  ];
  for (const [label, source, target, expectedPolicy] of representationConversions) {
    assertImplicitConversion(label, source, target, expectedPolicy);
  }

  const floatToByte = planConversion(
    { flow: "control", dataKind: "value.core.float32", format: "f32" },
    { flow: "control", dataKind: "value.core.uint8", format: "u8" }
  );
  assert.equal(floatToByte.lossy, true);
  assert.equal(floatToByte.steps[0].clamp, "saturating");
  assert.equal(floatToByte.steps[0].trunc, "toward-zero");

  const messageSink = planConversion(
    { flow: "control", dataKind: "value.core.string" },
    { flow: "event", dataKind: "value.core.message" }
  );
  assert.equal(messageSink.ok, false);

  for (const dataKind of ["value.core.float32", "value.core.int32", "value.core.uint32", "value.core.bool", "value.core.color", "value.core.string"]) {
    const controlToEventMessage = planConversion(
      { flow: "control", dataKind },
      { flow: "event", dataKind: "value.core.message" }
    );
    assert.equal(
      controlToEventMessage.ok,
      false,
      `${dataKind} should not be treated as an event message payload without a port accepting it`
    );
  }

  const panelMessageSink = planConversion(
    { flow: "control", dataKind: "value.core.string" },
    { flow: "control", dataKind: "value.core.message" }
  );
  assert.equal(panelMessageSink.ok, true);

  const bangToAnyMessage = planConversion(
    { flow: "event", dataKind: "value.core.bang" },
    { flow: "event", dataKind: "value.core.message" }
  );
  assert.equal(bangToAnyMessage.ok, true);

  const anyMessageToAnyMessage = planConversion(
    { flow: "control", dataKind: "value.core.message" },
    { flow: "control", dataKind: "value.core.message" }
  );
  assert.equal(anyMessageToAnyMessage.ok, true);

  const resourceToMessage = planConversion(
    { flow: "resource", dataKind: "value.core.tensor" },
    { flow: "event", dataKind: "value.core.message" }
  );
  assert.equal(resourceToMessage.ok, false);

  const eventToMessageValue = planConversion(
    { flow: "event", dataKind: "value.core.bang" },
    { flow: "control", dataKind: "value.core.message" }
  );
  assert.equal(eventToMessageValue.ok, true);

  const invalidMessageAnyFlow = planConversion(
    { flow: "control", dataKind: "value.core.string" },
    { flow: "resource", dataKind: "value.core.message" }
  );
  assert.equal(invalidMessageAnyFlow.ok, false);

  assert.equal(representationForDataType({ flow: "control", dataKind: "value.core.float16", format: ["f16", "f32"] }), "f16");
  assert.equal(representationForDataType({ flow: "control", dataKind: "value.core.uint32" }), "u32");
  assert.equal(representationForDataType({ flow: "control", dataKind: "value.core.string" }), undefined);

  const intNarrow = planConversion(
    { flow: "control", dataKind: "value.core.int32", format: "i32" },
    { flow: "control", dataKind: "value.core.int8", format: "i8" }
  );
  assert.equal(intNarrow.ok, true);
  assert.equal(intNarrow.lossy, true);
  assert.equal(intNarrow.steps[0].policy, "numeric-cast");

  const colorToUnorm = planConversion(
    { flow: "control", dataKind: "value.core.color", format: "rgba32f" },
    { flow: "control", dataKind: "value.core.color", format: "rgba8unorm" }
  );
  assert.equal(colorToUnorm.ok, true);
  assert.equal(colorToUnorm.lossy, true);
  assert.equal(colorToUnorm.steps[0].policy, "color-cast");
  assert.equal(colorToUnorm.steps[0].clamp, "unit");

  const intToFloat = planConversion(
    { flow: "control", dataKind: "value.core.int32", format: "i32" },
    { flow: "control", dataKind: "value.core.float32", format: "f32" }
  );
  assert.equal(intToFloat.ok, true);
  assert.equal(intToFloat.steps[0].policy, "integer-to-float");

  const uintToInt = planConversion(
    { flow: "control", dataKind: "value.core.uint32", format: "u32" },
    { flow: "control", dataKind: "value.core.int16", format: "i16" }
  );
  assert.equal(uintToInt.ok, true);
  assert.equal(uintToInt.steps[0].policy, "integer-signedness");

  const colorIdentity = planConversion(
    { flow: "control", dataKind: "value.core.color", format: "rgba32f" },
    { flow: "control", dataKind: "value.core.color", format: "rgba32f" }
  );
  assert.equal(colorIdentity.ok, true);
  assert.equal(colorIdentity.lossy, false);
  assert.equal(colorIdentity.diagnostics.length, 0);

  const incompatible = planConversion(
    { flow: "control", dataKind: "value.core.bool" },
    { flow: "event", dataKind: "value.core.bang" }
  );
  assert.equal(incompatible.ok, false);

  const sameFlowIncompatible = planConversion(
    { flow: "control", dataKind: "value.core.bool" },
    { flow: "control", dataKind: "value.core.color", format: "rgba32f" }
  );
  assert.equal(sameFlowIncompatible.ok, false);

  const numericToBoolean = planConversion(
    { flow: "control", dataKind: "value.core.float32", format: "f32" },
    { flow: "control", dataKind: "value.core.bool" }
  );
  assert.equal(numericToBoolean.ok, false);

  const booleanToNumeric = planConversion(
    { flow: "control", dataKind: "value.core.bool" },
    { flow: "control", dataKind: "value.core.float32", format: "f32" }
  );
  assert.equal(booleanToNumeric.ok, false);

  const unknownRepresentation = planConversion(
    { flow: "control", dataKind: "value.core.float32", format: "float.custom" },
    { flow: "control", dataKind: "value.core.float32", format: "float.other" }
  );
  assert.equal(unknownRepresentation.ok, false);

  assert.equal(planConversion(
    { flow: "control", dataKind: "value.core.float32", format: "f32" },
    { flow: "control", dataKind: "value.core.float32", format: "float.other" }
  ).ok, false);
  assert.equal(planConversion(
    { flow: "control", dataKind: "value.core.float32", format: "float.custom" },
    { flow: "control", dataKind: "value.core.float32", format: "f32" }
  ).ok, false);
  assert.equal(planConversion(
    { flow: "control", dataKind: "value.core.float32", format: "i32" },
    { flow: "control", dataKind: "value.core.float32", format: "f32" }
  ).ok, false);
  assert.equal(planConversion(
    { flow: "control", dataKind: "value.core.color", format: "f32" },
    { flow: "control", dataKind: "value.core.color", format: "rgba32f" }
  ).ok, false);
  assert.equal(planConversion(
    { flow: "control", dataKind: "value.core.color", format: "color.custom" },
    { flow: "control", dataKind: "value.core.color", format: "rgba32f" }
  ).ok, false);
  assert.equal(planConversion(
    { flow: "control", dataKind: "value.core.color", format: "rgba32f" },
    { flow: "control", dataKind: "value.core.color", format: "color.custom" }
  ).ok, false);
  assert.equal(planConversion(
    { flow: "control", dataKind: "value.core.color", format: "rgba32f" },
    { flow: "control", dataKind: "value.core.color", format: "f32" }
  ).ok, false);
});

test("analyzes WGSL shader uniform annotations into dynamic ports", () => {
  const source = [
    "// @skenion.uniform speed value.core.float32 default=0.5 min=0 max=2 step=0.01 label=\"Speed Amount\"",
    "// @skenion.uniform enabled value.core.bool default=true",
    "// @skenion.uniform disabled value.core.bool default=false",
    "// @skenion.uniform iterations value.core.int32 default=8",
    "// @skenion.uniform seed value.core.uint32 default=4",
    "// @skenion.uniform tint value.core.color default=[1,0.2,0.1,1]",
    "fn fs_main() -> @location(0) vec4<f32> { return vec4<f32>(1.0); }"
  ].join("\n");

  const result = analyzeShaderInterfaceV01(source, { language: "wgsl" });

  assert.equal(result.ok, true);
  assert.equal(result.diagnostics.length, 0);
  assert.equal(validateShaderInterface(result.shaderInterface).ok, true);
  assert.deepEqual(
    result.shaderInterface.uniforms.map((uniform) => [uniform.id, uniform.type.dataKind, uniform.default]),
    [
      ["speed", "value.core.float32", 0.5],
      ["enabled", "value.core.bool", true],
      ["disabled", "value.core.bool", false],
      ["iterations", "value.core.int32", 8],
      ["seed", "value.core.uint32", 4],
      ["tint", "value.core.color", [1, 0.2, 0.1, 1]]
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
  assert.equal(ports[6].type.dataKind, "value.core.tensor");
});

test("reports shader uniform annotation diagnostics", () => {
  const source = [
    "// @skenion.uniform",
    "const note = \"@skenion.uniform\";",
    "// @skenion.uniform 1bad value.core.float32 default=nope min=nope step=-1",
    "// @skenion.uniform out value.core.float32",
    "// @skenion.uniform speed vec3 default=0",
    "// @skenion.uniform speed value.core.float32 default=0.2",
    "// @skenion.uniform badFloat value.core.float32 default=nope",
    "// @skenion.uniform flag value.core.bool default=maybe",
    "// @skenion.uniform count value.core.int32 default=1.5",
    "// @skenion.uniform badSeed value.core.uint32 default=-1",
    "// @skenion.uniform color value.core.color default=nope",
    "// @skenion.uniform color2 value.core.color default=[1,2,3]",
    "// @skenion.uniform ranged value.core.float32 min=nope max=Infinity step=-1",
    "// @skenion.uniform plain value.core.float32 label=Plain"
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
  assert.equal(result.diagnostics.find((diagnostic) => diagnostic.code === "invalid-default")?.column, 49);
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
        type: { flow: "control", dataKind: "number.float" },
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

  const payloadKind = structuredClone(fragment);
  payloadKind.nodes[0].kind = "value.core.bang";
  assert.match(validateGraphFragmentV01(payloadKind).errors.join("\n"), /payload-node-kind/);

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
  incompatible.nodes[1].ports[0].type = "value.core.string";
  assert.match(validateGraphFragmentV01(incompatible).errors.join("\n"), /incompatible-type/);

  const acceptsList = structuredClone(fragment);
  acceptsList.nodes[1].ports[0].type = "value.core.int64";
  acceptsList.nodes[1].ports[0].accepts = ["value.core.float64"];
  assert.equal(validateGraphFragmentV01(acceptsList).ok, true);

  const missingKeyPolicy = structuredClone(fragment);
  missingKeyPolicy.nodes[1].ports[0].type = "value.core.message";
  const missingKeyPolicyResult = validateGraphFragmentV01(missingKeyPolicy);
  assert.equal(missingKeyPolicyResult.ok, false);
  assert.match(missingKeyPolicyResult.errors.join("\n"), /requires messageKeys/);

  const messageAny = structuredClone(missingKeyPolicy);
  messageAny.nodes[1].ports[0].messageKeys = {
    accepted: ["float"],
    trigger: ["float"],
    emit: ["float"]
  };
  assert.equal(validateGraphFragmentV01(messageAny).ok, true);

  const legacyPort = structuredClone(fragment);
  legacyPort.nodes[0].ports[0].type = "number.float";
  assert.match(validateGraphFragmentV01(legacyPort).errors.join("\n"), /invalid-value-type/);

  const legacyAccepts = structuredClone(fragment);
  legacyAccepts.nodes[1].ports[0].accepts = ["message.any"];
  assert.match(validateGraphFragmentV01(legacyAccepts).errors.join("\n"), /invalid-value-type/);

  const legacyResolvedType = structuredClone(fragment);
  legacyResolvedType.edges[0].resolvedType = "boolean";
  assert.match(validateGraphFragmentV01(legacyResolvedType).errors.join("\n"), /invalid-value-type/);

  const invalidKeys = structuredClone(fragment);
  invalidKeys.nodes[1].ports[0].messageKeys = {
    accepted: [],
    trigger: ["bang"]
  };
  const invalidKeysResult = validateGraphFragmentV01(invalidKeys);
  assert.equal(invalidKeysResult.ok, false);
  assert.match(invalidKeysResult.errors.join("\n"), /messageKeys\/accepted|messageKeys\.accepted/);

  const invalidTriggerKey = structuredClone(fragment);
  invalidTriggerKey.nodes[1].ports[0].messageKeys = {
    accepted: ["float"],
    trigger: ["bang"]
  };
  const invalidTriggerKeyResult = validateGraphFragmentV01(invalidTriggerKey);
  assert.equal(invalidTriggerKeyResult.ok, false);
  assert.match(invalidTriggerKeyResult.errors.join("\n"), /key bang is not accepted/);

  const invalidSetTrigger = structuredClone(messageAny);
  invalidSetTrigger.nodes[1].ports[0].messageKeys = {
    accepted: ["set"],
    trigger: ["set"]
  };
  const invalidSetTriggerResult = validateGraphFragmentV01(invalidSetTrigger);
  assert.equal(invalidSetTriggerResult.ok, false);
  assert.match(invalidSetTriggerResult.errors.join("\n"), /trigger must not include set/);
  assert.match(invalidSetTriggerResult.errors.join("\n"), /set must be silent or store behavior/);

  const storeOnlySet = structuredClone(messageAny);
  storeOnlySet.nodes[1].ports[0].messageKeys = {
    accepted: ["set"],
    store: ["set"]
  };
  assert.equal(validateGraphFragmentV01(storeOnlySet).ok, true);

  const invalidSetEmit = structuredClone(messageAny);
  invalidSetEmit.nodes[1].ports[0].messageKeys = {
    accepted: ["set"],
    silent: ["set"],
    emit: ["set"]
  };
  const invalidSetEmitResult = validateGraphFragmentV01(invalidSetEmit);
  assert.equal(invalidSetEmitResult.ok, false);
  assert.match(invalidSetEmitResult.errors.join("\n"), /emit must not include set/);
});

test("validates graph fragment paste requests as transform payloads", async () => {
  const fragment = await readJson("fixtures/graph-fragment/v0.1/valid/internal-edge.fragment.json");
  const request = {
    target: {
      path: { kind: "root" },
      baseRevision: "root-rev-1"
    },
    fragment,
    placement: { kind: "position", x: 20, y: 40 },
    options: {
      outsideEndpointPolicy: "reject",
      idConflictPolicy: "remap",
      interfaceIncidentEdgePolicy: "reject",
      preserveRelativePositions: true
    }
  };

  assert.equal(validatePasteGraphFragmentRequest(request).ok, true);
  assert.equal(validatePasteGraphFragmentRequest({ ...request, options: undefined }).ok, true);

  const projectPatchRequest = structuredClone(request);
  projectPatchRequest.target.path = {
    kind: "project-patch-definition",
    patchId: "filter"
  };
  assert.equal(validatePasteGraphFragmentRequest(projectPatchRequest).ok, true);

  const packagePatchRequest = structuredClone(request);
  packagePatchRequest.target.path = {
    kind: "package-patch-definition",
    packageId: "example/filter",
    patchId: "filter",
    version: "1.0.0"
  };
  packagePatchRequest.target.targetRevision = "root-rev-2";
  packagePatchRequest.placement = { kind: "anchor", nodeId: "osc", offsetX: 4, offsetY: 8 };
  packagePatchRequest.options = {
    idConflictPolicy: "reject",
    interfaceIncidentEdgePolicy: "drop",
    preserveRelativePositions: false
  };
  assert.equal(validatePasteGraphFragmentRequest(packagePatchRequest).ok, true);

  const embeddedPatchRequest = structuredClone(request);
  embeddedPatchRequest.target.path = {
    kind: "embedded-patch-instance",
    ownerPath: ["patch", "subpatch"],
    nodeId: "embedded"
  };
  embeddedPatchRequest.placement = { kind: "anchor", nodeId: "osc" };
  embeddedPatchRequest.options = { interfaceIncidentEdgePolicy: "preserve-diagnostic" };
  assert.equal(validatePasteGraphFragmentRequest(embeddedPatchRequest).ok, true);

  const helpWorkingCopyRequest = structuredClone(request);
  helpWorkingCopyRequest.target.path = {
    kind: "help-working-copy",
    workingCopyId: "help-1",
    sourcePackageId: "example/filter",
    sourcePatchId: "filter-help"
  };
  assert.equal(validatePasteGraphFragmentRequest(helpWorkingCopyRequest).ok, true);

  const outsideFragment = await readJson("fixtures/graph-fragment/v0.1/invalid/outside-endpoint.fragment.json");
  const rejectedOutside = structuredClone(request);
  rejectedOutside.fragment = outsideFragment;
  assert.equal(validatePasteGraphFragmentRequest(rejectedOutside).ok, false);

  const omittedOutside = structuredClone(rejectedOutside);
  omittedOutside.options.outsideEndpointPolicy = "omit";
  assert.equal(validatePasteGraphFragmentRequest(omittedOutside).ok, true);

  const missingTarget = structuredClone(request);
  delete missingTarget.target;
  const missingTargetResult = validatePasteGraphFragmentRequest(missingTarget);
  assert.equal(missingTargetResult.ok, false);
  assert.match(missingTargetResult.errors.join("\n"), /target/);

  assert.deepEqual(validatePasteGraphFragmentRequest(null), { ok: false, errors: ["/ must be object"] });

  const invalidRequests = [
    [{ ...request, target: { path: null, baseRevision: "root-rev-1" } }, /target\/path/],
    [{ ...request, target: { path: { kind: "root", extra: true }, baseRevision: "root-rev-1" } }, /target\/path/],
    [{ ...request, target: { path: { kind: "root" }, baseRevision: "" } }, /baseRevision/],
    [
      { ...request, target: { path: { kind: "root" }, baseRevision: "root-rev-1", targetRevision: "" } },
      /targetRevision/
    ],
    [
      { ...request, target: { path: { kind: "package-patch-definition", packageId: "", patchId: "filter" }, baseRevision: "root-rev-1" } },
      /target\/path/
    ],
    [
      {
        ...request,
        target: {
          path: { kind: "package-patch-definition", packageId: "example/filter", patchId: "filter", version: 1 },
          baseRevision: "root-rev-1"
        }
      },
      /target\/path/
    ],
    [
      {
        ...request,
        target: {
          path: { kind: "embedded-patch-instance", ownerPath: ["patch", 1], nodeId: "embedded" },
          baseRevision: "root-rev-1"
        }
      },
      /target\/path/
    ],
    [
      {
        ...request,
        target: {
          path: { kind: "help-working-copy", workingCopyId: "", sourcePackageId: 7 },
          baseRevision: "root-rev-1"
        }
      },
      /target\/path/
    ],
    [
      { ...request, target: { path: { kind: "runtime-session" }, baseRevision: "root-rev-1" } },
      /target\/path/
    ],
    [{ ...request, placement: { kind: "position", x: 1 } }, /placement/],
    [{ ...request, placement: { kind: "anchor", nodeId: "osc", offsetX: "left" } }, /placement/],
    [{ ...request, options: "reject" }, /options/],
    [{ ...request, options: { outsideEndpointPolicy: "clip" } }, /options/],
    [{ ...request, options: { idConflictPolicy: "rename" } }, /options/],
    [{ ...request, options: { interfaceIncidentEdgePolicy: "keep" } }, /options/],
    [{ ...request, options: { preserveRelativePositions: "yes" } }, /options/]
  ];
  for (const [candidate, expected] of invalidRequests) {
    const result = validatePasteGraphFragmentRequest(candidate);
    assert.equal(result.ok, false);
    assert.match(result.errors.join("\n"), expected);
  }
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
    assert.match(
      result.errors.join("\n"),
      /duplicate boundary port id|lockEntryId .*points to package|does not match lock entry package|locked version .*does not satisfy|nativeArtifacts|required property 'target'|requires target|missing lockEntryId|missing project patch/,
      fixture
    );
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

  const dependencyPackageMismatch = validateProjectDocumentV01(
    await readJson("fixtures/project/v0.1/invalid/package-dependency-package-mismatch.project.json")
  );
  assert.equal(dependencyPackageMismatch.ok, false);
  assert.match(dependencyPackageMismatch.errors.join("\n"), /lockEntryId .*points to package/);

  const providerPackageMismatch = validateProjectDocumentV01(
    await readJson("fixtures/project/v0.1/invalid/package-provider-package-mismatch.project.json")
  );
  assert.equal(providerPackageMismatch.ok, false);
  assert.match(providerPackageMismatch.errors.join("\n"), /does not match lock entry package/);

  const dependencyVersionMismatch = validateProjectDocumentV01(
    await readJson("fixtures/project/v0.1/invalid/package-dependency-version-out-of-range.project.json")
  );
  assert.equal(dependencyVersionMismatch.ok, false);
  assert.match(dependencyVersionMismatch.errors.join("\n"), /locked version .*does not satisfy/);

  const validPackageProject = await readJson("fixtures/project/v0.1/valid/package-lock.project.json");
  const missingDependencyLock = structuredClone(validPackageProject);
  missingDependencyLock.packageDependencies[0].lockEntryId = "missing-lock-entry";
  const missingDependencyLockResult = validateProjectDocumentV01(missingDependencyLock);
  assert.equal(missingDependencyLockResult.ok, false);
  assert.match(missingDependencyLockResult.errors.join("\n"), /dependency .*missing-lock-entry/);

  const missingResourceLock = structuredClone(validPackageProject);
  missingResourceLock.resourceLock[0].lockEntryId = "missing-resource-lock-entry";
  const missingResourceLockResult = validateProjectDocumentV01(missingResourceLock);
  assert.equal(missingResourceLockResult.ok, false);
  assert.match(missingResourceLockResult.errors.join("\n"), /resource lock .*missing-resource-lock-entry/);

  const missingProviderBinding = validPackageProject.objectBindings.find((binding) => binding.id === "binding-missing-provider");
  assert.equal(missingProviderBinding.status, "missing");
  assert.equal(validateProjectDocumentV01(validPackageProject).ok, true);

  for (const [status, bindingIndex, expected] of [
    ["missing", 2, /missing object binding .*binding-target-missing/],
    ["stale", 1, /stale object binding .*binding-target-stale or binding-interface-drift/],
    ["unresolved", 0, /unresolved object binding .*binding-unresolved/],
    ["ambiguous", 3, /ambiguous object binding .*binding-ambiguous/]
  ]) {
    const missingDiagnostics = structuredClone(validPackageProject);
    missingDiagnostics.objectBindings[bindingIndex].status = status;
    delete missingDiagnostics.objectBindings[bindingIndex].diagnostics;
    const missingDiagnosticsResult = validateProjectDocumentV01(missingDiagnostics);
    assert.equal(missingDiagnosticsResult.ok, false, status);
    assert.match(missingDiagnosticsResult.errors.join("\n"), expected, status);
  }

  const malformedBindingList = structuredClone(validPackageProject);
  malformedBindingList.objectBindings = [null];
  assert.equal(validateProjectDocumentV01(malformedBindingList).ok, false);

  const nonArrayBindingList = structuredClone(validPackageProject);
  nonArrayBindingList.objectBindings = "not-a-binding-list";
  assert.equal(validateProjectDocumentV01(nonArrayBindingList).ok, false);

  const malformedBindingStatus = structuredClone(validPackageProject);
  malformedBindingStatus.objectBindings = [{}];
  assert.equal(validateProjectDocumentV01(malformedBindingStatus).ok, false);

  const malformedDiagnostic = structuredClone(validPackageProject);
  malformedDiagnostic.objectBindings[2].diagnostics = [null];
  const malformedDiagnosticResult = validateProjectDocumentV01(malformedDiagnostic);
  assert.equal(malformedDiagnosticResult.ok, false);
  assert.match(malformedDiagnosticResult.errors.join("\n"), /missing object binding .*binding-target-missing/);

  const wrongDiagnosticCode = structuredClone(validPackageProject);
  wrongDiagnosticCode.objectBindings[2].diagnostics = [
    {
      severity: "warning",
      code: "binding-unresolved",
      message: "This diagnostic does not satisfy a missing binding."
    }
  ];
  const wrongDiagnosticCodeResult = validateProjectDocumentV01(wrongDiagnosticCode);
  assert.equal(wrongDiagnosticCodeResult.ok, false);
  assert.match(wrongDiagnosticCodeResult.errors.join("\n"), /missing object binding .*binding-target-missing/);

  const resolvedNoTarget = validateProjectDocumentV01(
    await readJson("fixtures/project/v0.1/invalid/resolved-binding-missing-target.project.json")
  );
  assert.equal(resolvedNoTarget.ok, false);
  assert.match(resolvedNoTarget.errors.join("\n"), /required property 'target'|requires target/);

  const resolvedPackageMissingLock = validateProjectDocumentV01(
    await readJson("fixtures/project/v0.1/invalid/resolved-package-binding-missing-lock.project.json")
  );
  assert.equal(resolvedPackageMissingLock.ok, false);
  assert.match(resolvedPackageMissingLock.errors.join("\n"), /resolved object binding .*missing lockEntryId/);

  const resolvedProjectMissingPatch = validateProjectDocumentV01(
    await readJson("fixtures/project/v0.1/invalid/resolved-project-patch-binding-missing-patch.project.json")
  );
  assert.equal(resolvedProjectMissingPatch.ok, false);
  assert.match(resolvedProjectMissingPatch.errors.join("\n"), /resolved object binding .*missing project patch/);

  const unresolvedProjectMissingPatch = structuredClone(validPackageProject);
  unresolvedProjectMissingPatch.objectBindings[1].status = "unresolved";
  unresolvedProjectMissingPatch.objectBindings[1].target.patchId = "missing_patch";
  unresolvedProjectMissingPatch.objectBindings[1].diagnostics = [
    {
      severity: "warning",
      code: "binding-unresolved",
      message: "Project patch selection has not been resolved."
    }
  ];
  const unresolvedProjectMissingPatchResult = validateProjectDocumentV01(unresolvedProjectMissingPatch);
  assert.equal(unresolvedProjectMissingPatchResult.ok, false);
  assert.match(unresolvedProjectMissingPatchResult.errors.join("\n"), /object binding .*missing project patch/);

  const unresolvedPackageMissingLock = structuredClone(validPackageProject);
  unresolvedPackageMissingLock.objectBindings[0].status = "unresolved";
  unresolvedPackageMissingLock.objectBindings[0].target.lockEntryId = "missing-lock";
  unresolvedPackageMissingLock.objectBindings[0].diagnostics = [
    {
      severity: "warning",
      code: "binding-unresolved",
      message: "Package provider selection has not been resolved."
    }
  ];
  const unresolvedPackageMissingLockResult = validateProjectDocumentV01(unresolvedPackageMissingLock);
  assert.equal(unresolvedPackageMissingLockResult.ok, false);
  assert.match(unresolvedPackageMissingLockResult.errors.join("\n"), /object binding .*missing lockEntryId/);

  const missingBindingRef = structuredClone(validPackageProject);
  missingBindingRef.graph.nodes[0].bindingRef = "missing-binding";
  const missingBindingRefResult = validateProjectDocumentV01(missingBindingRef);
  assert.equal(missingBindingRefResult.ok, false);
  assert.match(missingBindingRefResult.errors.join("\n"), /bindingRef: missing-binding/);

  const staleProjectPatchBinding = structuredClone(validPackageProject);
  staleProjectPatchBinding.objectBindings[1].target.revision = "stale-revision";
  const staleProjectPatchBindingResult = validateProjectDocumentV01(staleProjectPatchBinding);
  assert.equal(staleProjectPatchBindingResult.ok, false);
  assert.match(staleProjectPatchBindingResult.errors.join("\n"), /resolved object binding .*revision is stale/);

  staleProjectPatchBinding.objectBindings[1].status = "stale";
  staleProjectPatchBinding.objectBindings[1].diagnostics = [
    {
      severity: "warning",
      code: "binding-target-stale",
      message: "The project-local patch binding points at an older known revision."
    }
  ];
  assert.equal(validateProjectDocumentV01(staleProjectPatchBinding).ok, true);

  staleProjectPatchBinding.objectBindings[1].diagnostics = [
    {
      severity: "warning",
      code: "binding-interface-drift",
      message: "The project-local patch interface changed since the binding was last planned."
    }
  ];
  assert.equal(validateProjectDocumentV01(staleProjectPatchBinding).ok, true);

  const unresolvedStaleProjectPatchBinding = structuredClone(validPackageProject);
  unresolvedStaleProjectPatchBinding.objectBindings[1].status = "unresolved";
  unresolvedStaleProjectPatchBinding.objectBindings[1].target.revision = "stale-revision";
  unresolvedStaleProjectPatchBinding.objectBindings[1].diagnostics = [
    {
      severity: "warning",
      code: "binding-unresolved",
      message: "The binding is unresolved, but it also carries old revision evidence."
    }
  ];
  const unresolvedStaleProjectPatchBindingResult = validateProjectDocumentV01(unresolvedStaleProjectPatchBinding);
  assert.equal(unresolvedStaleProjectPatchBindingResult.ok, false);
  assert.match(unresolvedStaleProjectPatchBindingResult.errors.join("\n"), /revision is stale without diagnostics/);

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
            { id: "out", direction: "output", type: "value.core.float64", rate: "control" }
          ]
        },
        {
          id: "multi_boundary",
          kind: "core.outlet",
          kindVersion: "0.1.0",
          params: {},
          ports: [
            { id: "left", direction: "input", type: "value.core.float64", rate: "control" },
            { id: "right", direction: "input", type: "value.core.float64", rate: "control" }
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
  assert.equal(invalidCycle.cycles[0].classification, "ambiguous-algebraic-loop");
});

test("v0.1 control ports declare numeric accepts and bang trigger behavior separately", () => {
  const graph = {
    schema: "skenion.graph",
    schemaVersion: "0.1.0",
    id: "control-accepts-and-bang-trigger",
    revision: "1",
    nodes: [
      {
        id: "button",
        kind: "core.bang",
        kindVersion: "0.1.0",
        params: {},
        ports: [
          { id: "out", direction: "output", type: "value.core.bang", rate: "event" }
        ]
      },
      {
        id: "int_source",
        kind: "core.int",
        kindVersion: "0.1.0",
        params: {},
        ports: [
          { id: "value", direction: "output", type: "value.core.int64", rate: "control" }
        ]
      },
      {
        id: "bool_source",
        kind: "test.bool-emitter",
        kindVersion: "0.1.0",
        params: {},
        ports: [
          { id: "value", direction: "output", type: "value.core.bool", rate: "control" }
        ]
      },
      {
        id: "number_box",
        kind: "core.float",
        kindVersion: "0.1.0",
        params: {},
        ports: [
          {
            id: "in",
            direction: "input",
            type: "value.core.message",
            rate: "control",
            accepts: [
              "value.core.float64",
              "value.core.int64",
              "value.core.bool",
              "value.core.bang"
            ],
            maxConnections: 3,
            mergePolicy: "ordered-events",
            triggerMode: "trigger",
            messageKeys: {
              accepted: ["bang", "set", "float", "int", "bool"],
              silent: ["set"],
              trigger: ["bang", "float", "int", "bool"],
              store: ["set", "float", "int", "bool"],
              emit: ["bang", "float", "int", "bool"]
            },
            latch: true
          }
        ]
      }
    ],
    edges: [
      {
        id: "edge_button_message",
        source: { nodeId: "button", portId: "out" },
        target: { nodeId: "number_box", portId: "in" }
      },
      {
        id: "edge_int_number",
        source: { nodeId: "int_source", portId: "value" },
        target: { nodeId: "number_box", portId: "in" }
      },
      {
        id: "edge_bool_number",
        source: { nodeId: "bool_source", portId: "value" },
        target: { nodeId: "number_box", portId: "in" }
      }
    ]
  };

  assert.equal(validateGraphDocumentV01(graph).ok, true);

  const withoutBangAccept = structuredClone(graph);
  withoutBangAccept.nodes[3].ports[0].accepts = [
    "value.core.float64",
    "value.core.int64",
    "value.core.bool"
  ];
  assert.equal(validateGraphDocumentV01(withoutBangAccept).ok, true);
});

test("v0.1 rejects legacy control port aliases on current graph and node contracts", () => {
  const invalidTypes = [
    "value.number",
    "value<number.float>",
    "number.float",
    "number.int",
    "number.uint",
    "boolean",
    "message.any",
    "value.core.symbol",
    "value.media.asset",
    "value.media.audio-sample",
    "value.media.audio-frame",
    "value.media.audio-buffer",
    "value.media.image",
    "value.media.matrix",
    "color",
    "string"
  ];

  for (const invalidType of invalidTypes) {
    const graph = {
      schema: "skenion.graph",
      schemaVersion: "0.1.0",
      id: `legacy-${invalidType.replaceAll(/[^A-Za-z0-9]+/g, "-")}`,
      revision: "1",
      nodes: [
        {
          id: "source",
          kind: "test.source",
          kindVersion: "0.1.0",
          params: {},
          ports: [{ id: "out", direction: "output", type: invalidType }]
        },
        {
          id: "target",
          kind: "test.target",
          kindVersion: "0.1.0",
          params: {},
          ports: [{ id: "in", direction: "input", type: "value.core.message" }]
        }
      ],
      edges: [{ id: "edge", source: { nodeId: "source", portId: "out" }, target: { nodeId: "target", portId: "in" } }]
    };
    const graphResult = validateGraphDocumentV01(graph);
    assert.equal(graphResult.ok, false, invalidType);
    assert.match(graphResult.errors.join("\n"), /invalid-value-type/, invalidType);

    graph.nodes[0].ports[0].type = "value.core.float64";
    graph.nodes[1].ports[0].accepts = [invalidType];
    const acceptsResult = validateGraphDocumentV01(graph);
    assert.equal(acceptsResult.ok, false, invalidType);
    assert.match(acceptsResult.errors.join("\n"), /invalid-value-type/, invalidType);

    graph.nodes[1].ports[0].accepts = ["value.core.float64"];
    graph.edges[0].resolvedType = invalidType;
    const resolvedTypeResult = validateGraphDocumentV01(graph);
    assert.equal(resolvedTypeResult.ok, false, invalidType);
    assert.match(resolvedTypeResult.errors.join("\n"), /invalid-value-type/, invalidType);

    const node = {
      schema: "skenion.node.definition",
      schemaVersion: "0.1.0",
      id: `legacy.${invalidType.replaceAll(/[^A-Za-z0-9]+/g, "-")}`,
      version: "0.1.0",
      displayName: "Legacy",
      category: "Test",
      ports: [{ id: "in", direction: "input", type: invalidType }],
      execution: { model: "control" },
      state: { persistent: false },
      permissions: [],
      capabilities: []
    };
    const nodeResult = validateNodeDefinitionV01(node);
    assert.equal(nodeResult.ok, false, invalidType);
    assert.match(nodeResult.errors.join("\n"), /invalid value type/, invalidType);

    node.ports[0].type = "value.core.message";
    node.ports[0].accepts = [invalidType];
    const nodeAcceptsResult = validateNodeDefinitionV01(node);
    assert.equal(nodeAcceptsResult.ok, false, invalidType);
    assert.match(nodeAcceptsResult.errors.join("\n"), /invalid accepted value type/, invalidType);
  }
});

test("v0.1 rejects invalid direction fan-in and algebraic-loop fixtures", async () => {
  const cases = [
    ["fixtures/graph/v0.1/invalid/input-to-input-edge.graph.json", /invalid-source-direction/],
    ["fixtures/graph/v0.1/invalid/output-to-output-edge.graph.json", /invalid-target-direction/],
    ["fixtures/graph/v0.1/invalid/fan-in-without-merge-policy.graph.json", /fan-in-without-merge-policy/],
    ["fixtures/graph/v0.1/invalid/render-input-fan-in-default.graph.json", /fan-in-cardinality/],
    ["fixtures/graph/v0.1/invalid/ambiguous-value-algebraic-loop.graph.json", /ambiguous-algebraic-loop/],
    ["fixtures/graph/v0.1/invalid/payload-identity-node-kind.graph.json", /payload-node-kind/]
  ];

  for (const [fixture, expected] of cases) {
    const result = validateGraphDocumentV01(await readJson(fixture));
    assert.equal(result.ok, false, fixture);
    assert.match(result.errors.join("\n"), expected, fixture);
  }

  for (const payloadKind of ["bool", "string"]) {
    const graph = await readJson("fixtures/graph/v0.1/valid/zero-port-node.graph.json");
    graph.nodes[0].kind = payloadKind;
    const result = validateGraphDocumentV01(graph);
    assert.equal(result.ok, false, payloadKind);
    assert.match(result.errors.join("\n"), /payload-node-kind/, payloadKind);
  }

  const controlLoop = await readJson("fixtures/graph/v0.1/invalid/ambiguous-value-algebraic-loop.graph.json");
  for (const node of controlLoop.nodes) {
    for (const port of node.ports) {
      port.type = "value.core.float64";
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

  const missingTargetPortCycle = await readJson("fixtures/graph/v0.1/valid/zero-port-node.graph.json");
  missingTargetPortCycle.nodes[0].ports.push({
    id: "out",
    direction: "output",
    type: "value.core.float64"
  });
  missingTargetPortCycle.edges.push({
    id: "edge_missing_target_cycle",
    source: { nodeId: "note_1", portId: "out" },
    target: { nodeId: "note_1", portId: "missing_in" }
  });
  const missingTargetPortCycleAnalysis = analyzeGraphDocumentV01(missingTargetPortCycle);
  assert.equal(missingTargetPortCycleAnalysis.ok, false);
  assert.equal(missingTargetPortCycleAnalysis.cycles[0].classification, "invalid-cycle");
});

test("v0.1 reports detailed semantic diagnostics", async () => {
  const graph = await readJson("fixtures/graph/v0.1/valid/source-fan-out.graph.json");
  graph.nodes[0].ports[0].fanOutPolicy = "forbid";
  graph.nodes[1].ports[0].required = true;
  graph.nodes[2].ports[0].type = "value.core.tensor";
  graph.nodes[2].ports[0].accepts = ["value.core.tensor", "string"];
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
  graph.nodes[1].ports[0].messageKeys = {
    trigger: ["bang"]
  };
  graph.nodes[0].portGroups = [
    {
      id: "legacy_group",
      direction: "input",
      type: "number.float",
      minPorts: 1,
      defaultPortSpec: {
        id: "legacy_template",
        direction: "input",
        type: "message.any",
        accepts: ["color"],
        messageKeys: {
          accepted: ["bang"],
          trigger: ["set"]
        }
      }
    }
  ];

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
  assert.match(analysis.diagnostics.map((entry) => entry.code).join("\n"), /invalid-value-type/);
  assert.match(analysis.diagnostics.map((entry) => entry.code).join("\n"), /message-key-policy/);

  const acceptingGraph = await readJson("fixtures/graph/v0.1/valid/render-output.graph.json");
  acceptingGraph.nodes[1].ports[0].accepts = ["value.core.tensor"];
  acceptingGraph.nodes[0].ports[0].type = "value.core.tensor";
  acceptingGraph.edges[0].resolvedType = "value.core.tensor";
  assert.equal(validateGraphDocumentV01(acceptingGraph).ok, true);

  const unlimitedGraph = await readJson("fixtures/graph/v0.1/invalid/render-input-fan-in-default.graph.json");
  unlimitedGraph.nodes[2].ports[0].maxConnections = null;
  unlimitedGraph.nodes[2].ports[0].mergePolicy = "array";
  assert.equal(validateGraphDocumentV01(unlimitedGraph).ok, true);

  const requiredGraph = await readJson("fixtures/graph/v0.1/valid/zero-port-node.graph.json");
  requiredGraph.nodes[0].ports.push({
    id: "in",
    direction: "input",
    type: "value.core.float64",
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
      type: "value.core.float64",
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

  for (const payloadId of ["core.bool", "bool", "string"]) {
    const payloadIdentityNode = await readJson("fixtures/node/v0.1/valid/render-clear-color.node.json");
    payloadIdentityNode.id = payloadId;
    const payloadIdentityNodeResult = validateNodeDefinitionV01(payloadIdentityNode);
    assert.equal(payloadIdentityNodeResult.ok, false, payloadId);
    assert.match(
      payloadIdentityNodeResult.errors.join("\n"),
      /payload identity node definition id/,
      payloadId
    );
  }

  const badNodeGroup = await readJson("fixtures/node/v0.1/valid/dynamic-input-group.node.json");
  const noDefaultPortGroupNode = await readJson("fixtures/node/v0.1/valid/render-clear-color.node.json");
  noDefaultPortGroupNode.portGroups = [
    {
      id: "optional_controls",
      direction: "input",
      type: "value.core.float64",
      minPorts: 0
    }
  ];
  assert.equal(validateNodeDefinitionV01(noDefaultPortGroupNode).ok, true);

  badNodeGroup.portGroups[0].type = "number.float";
  badNodeGroup.portGroups[0].defaultPortSpec.type = "message.any";
  badNodeGroup.portGroups[0].defaultPortSpec.accepts = ["string"];
  badNodeGroup.portGroups[0].defaultPortSpec.messageKeys = {
    accepted: ["bang"],
    trigger: ["set"]
  };
  badNodeGroup.portGroups[0].minPorts = 2;
  badNodeGroup.portGroups[0].maxPorts = 1;
  const badNodeGroupResult = validateNodeDefinitionV01(badNodeGroup);
  assert.equal(badNodeGroupResult.ok, false);
  assert.match(badNodeGroupResult.errors.join("\n"), /maxPorts/);
  assert.match(badNodeGroupResult.errors.join("\n"), /invalid port group type/);
  assert.match(badNodeGroupResult.errors.join("\n"), /invalid default value type/);
  assert.match(badNodeGroupResult.errors.join("\n"), /invalid default accepted value type/);
  assert.match(badNodeGroupResult.errors.join("\n"), /key set is not accepted/);
});
