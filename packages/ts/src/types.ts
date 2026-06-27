export type DataFlow = "control" | "event" | "signal" | "stream" | "resource";
export type PortDirection = "input" | "output";
export type PortActivation = "trigger" | "latched";
export type AlphaPolicy = "error" | "white" | "black" | "luminance";

export interface DataTypeV01 {
  flow: DataFlow;
  dataKind: string;
  unit?: string;
  range?: {
    min?: number;
    max?: number;
    step?: number;
  };
  shape?: number[];
  channels?: number;
  sampleRate?: number;
  format?: string | string[];
  colorSpace?: string;
  frameRate?: number;
  alphaPolicy?: AlphaPolicy;
  values?: Array<string | number | boolean>;
}

export type ValueTypeIdV01 =
  | "value.core.bang"
  | "value.core.bool"
  | "value.core.uint8"
  | "value.core.uint16"
  | "value.core.uint32"
  | "value.core.uint64"
  | "value.core.int8"
  | "value.core.int16"
  | "value.core.int32"
  | "value.core.int64"
  | "value.core.float8"
  | "value.core.float16"
  | "value.core.float32"
  | "value.core.float64"
  | "value.core.ufloat8"
  | "value.core.ufloat16"
  | "value.core.ufloat32"
  | "value.core.ufloat64"
  | "value.core.string"
  | "value.core.message"
  | "value.core.color"
  | "value.core.vector"
  | "value.core.matrix"
  | "value.core.tensor";

export type SemanticDataKindV01 = ValueTypeIdV01;

export type FloatRepresentationV01 =
  | "f64"
  | "f32"
  | "f16"
  | "f8.e4m3"
  | "f8.e5m2"
  | "ufloat64"
  | "ufloat32"
  | "ufloat16"
  | "ufloat8";

export type IntRepresentationV01 =
  | "i64"
  | "i32"
  | "i16"
  | "i8";

export type UintRepresentationV01 =
  | "u64"
  | "u32"
  | "u16"
  | "u8";

export type NumericRepresentationV01 =
  | FloatRepresentationV01
  | IntRepresentationV01
  | UintRepresentationV01;

export type ColorRepresentationV01 =
  | "rgba32f"
  | "rgba16f"
  | "rgba8unorm"
  | "rgb8unorm";

export type RepresentationV01 = NumericRepresentationV01 | ColorRepresentationV01;

export type AudioEndpointDirectionV01 = "input" | "output";
export type AudioClockDomainAuthorityV01 =
  | "authoritative"
  | "driver-reported"
  | "user-configured"
  | "derived"
  | "unavailable";
export type AudioClockBridgeMethodV01 = "direct" | "clock-bridge" | "resample" | "invalid";
export type ClockAuthorityV01 = "authoritative" | "derived" | "estimated" | "unavailable";
export type ClockSourceKindV01 =
  | "local"
  | "audio-device"
  | "render-frame"
  | "link"
  | "midi-clock"
  | "mtc"
  | "host-transport";
export type ClockCapabilityV01 =
  | "running"
  | "tempo-bpm"
  | "phase"
  | "tick"
  | "ppq-position"
  | "song-position"
  | "bar-beat"
  | "time-signature"
  | "time-seconds"
  | "timecode"
  | "sample-frame";

export interface ClockFieldV01<T> {
  value: T | null;
  authority: ClockAuthorityV01;
  source: string;
  confidence?: number;
}

export interface ClockTimeSignatureV01 {
  numerator: number;
  denominator: number;
}

export interface ClockStateV01 {
  sourceId: string;
  sourceKind: ClockSourceKindV01 | string;
  capabilities: Array<ClockCapabilityV01 | string>;
  running?: ClockFieldV01<boolean>;
  tempoBpm?: ClockFieldV01<number>;
  phase01?: ClockFieldV01<number>;
  tickIndex?: ClockFieldV01<number>;
  ppqPosition?: ClockFieldV01<number>;
  songPositionSixteenth?: ClockFieldV01<number>;
  bar?: ClockFieldV01<number>;
  beat?: ClockFieldV01<number>;
  division?: ClockFieldV01<number>;
  tickInDivision?: ClockFieldV01<number>;
  timeSignature?: ClockFieldV01<ClockTimeSignatureV01>;
  timeSeconds?: ClockFieldV01<number>;
  timecode?: ClockFieldV01<string>;
  sampleRate?: ClockFieldV01<number>;
  sampleFrame?: ClockFieldV01<number>;
  latencySeconds?: ClockFieldV01<number>;
  lastUpdateHostTimeNs?: number;
}

export type JsonValueV01 =
  | string
  | number
  | boolean
  | null
  | JsonValueV01[]
  | { [key: string]: JsonValueV01 };

export type ExtensionKindV01 = "core-package" | "native-runtime" | "codec" | "node-pack";
export type ExtensionNativeArtifactAbiV01 = "c";
export type ExtensionCodecDirectionV01 = "decode" | "encode" | "duplex";
export type ExtensionTransportKindV01 = "midi" | "hid" | "serial" | "inline";
export type ExtensionTestKindV01 = "node" | "codec" | "extension";

export interface ExtensionNativeArtifactV01 {
  os: string;
  arch: string;
  abi: ExtensionNativeArtifactAbiV01;
  path: string;
  sha256?: string;
}

export interface ExtensionNativeBindingV01 {
  entrypoint: string;
  artifacts: ExtensionNativeArtifactV01[];
}

export interface ExtensionCodecDescriptorV01 {
  id: string;
  version: string;
  transportKinds: ExtensionTransportKindV01[];
  direction: ExtensionCodecDirectionV01;
}

export interface ExtensionTransportDescriptorV01 {
  id: string;
  version: string;
  kind: string;
}

export interface ExtensionHelpEntryV01 {
  nodeId: string;
  nodeVersion?: string;
  title?: string;
  markdownPath?: string;
  graphPath?: string;
}

export interface ExtensionProvidesV01 {
  nodes?: NodeDefinitionManifestV01[];
  codecs?: ExtensionCodecDescriptorV01[];
  transports?: ExtensionTransportDescriptorV01[];
  help?: ExtensionHelpEntryV01[];
}

export interface ExtensionFrontendMetadataV01 {
  displayName?: string;
  description?: string;
  tags?: string[];
}

export interface ExtensionTestDescriptorV01 {
  id: string;
  kind: ExtensionTestKindV01;
  target: string;
  fixturePath?: string;
  expectedPath?: string;
}

export interface ExtensionManifestV01 {
  schema: "skenion.extension.manifest";
  schemaVersion: "0.1.0";
  id: string;
  version: string;
  sdkVersion?: string;
  runtimeAbiVersion: string;
  kind: ExtensionKindV01;
  native?: ExtensionNativeBindingV01;
  provides: ExtensionProvidesV01;
  permissions: string[];
  frontend?: ExtensionFrontendMetadataV01;
  tests?: ExtensionTestDescriptorV01[];
}

export const SKENION_PACKAGE_MANIFEST_FILE_NAME = "skenion.package.json";

export type PackageCategoryV01 = "patch" | "native" | "mixed";
export type PackageSourceV01 = "first-party" | "marketplace" | "workspace" | "project-local";
export type PackageRootV01 = "package" | "project" | "dev-link" | "marketplace-install";
export type PackageTrustV01 = "trusted" | "untrusted" | "quarantined";
export type PackageTargetTripleV01 =
  | "aarch64-apple-darwin"
  | "x86_64-apple-darwin"
  | "x86_64-pc-windows-msvc"
  | "aarch64-pc-windows-msvc"
  | "x86_64-unknown-linux-gnu"
  | "aarch64-unknown-linux-gnu";
export type PackageChecksumAlgorithmV01 = "sha256";
export type PackageEvidenceKindV01 = "checksum" | "signature" | "sbom" | "attestation";
export type PackageDiagnosticSeverityV01 = "error" | "warning" | "info";
export type PackageListingTargetSupportKindV01 = "target-independent" | "targeted" | "unavailable";
export type PackageListingArtifactKindV01 = "manifest" | "package-archive" | "native-artifact";
export type PackageListingDiagnosticCodeV01 =
  | "malformed-listing-metadata"
  | "unsupported-contracts-range"
  | "missing-artifact"
  | "unavailable-target"
  | "quarantined-package"
  | "hidden-package";

export interface PackageContractsSupportV01 {
  line: string;
  range: string;
}

export interface PackageProvidedRefV01 {
  id: string;
  path: string;
  description?: string;
}

export interface PackageProvidesV01 {
  patches?: PackageProvidedRefV01[];
  nodes?: PackageProvidedRefV01[];
  resources?: PackageProvidedRefV01[];
  help?: PackageProvidedRefV01[];
}

export interface PackagePathsV01 {
  patches?: string[];
  resources?: string[];
  docs?: string[];
  tests?: string[];
}

export interface PackageChecksumV01 {
  algorithm: PackageChecksumAlgorithmV01;
  value: string;
}

export interface PackageChecksumRefV01 {
  id: string;
  path: string;
  checksum: PackageChecksumV01;
}

export interface PackageEvidenceRefV01 {
  id: string;
  kind: PackageEvidenceKindV01;
  path: string;
  checksum: PackageChecksumV01;
}

export interface PackageNativeArtifactV01 {
  target: PackageTargetTripleV01;
  path: string;
  entrypoint: string;
  checksum: PackageChecksumV01;
  evidenceRefs: string[];
}

export interface PackageDiagnosticV01 {
  severity: PackageDiagnosticSeverityV01;
  code: string;
  message: string;
  details?: JsonValueV01;
}

export interface PackageManifestV01 {
  schema: "skenion.package.manifest";
  schemaVersion: "0.1.0";
  id: string;
  version: string;
  displayName?: string;
  category: PackageCategoryV01;
  contracts: PackageContractsSupportV01;
  runtimeAbiRange?: string;
  targets?: PackageTargetTripleV01[];
  provides: PackageProvidesV01;
  patchLibrary?: PatchDefinitionV01[];
  paths: PackagePathsV01;
  checksums: PackageChecksumRefV01[];
  evidence: PackageEvidenceRefV01[];
  nativeArtifacts?: PackageNativeArtifactV01[];
  diagnostics?: PackageDiagnosticV01[];
}

export interface PackageRootDocumentV01 {
  schema: "skenion.package.root";
  schemaVersion: "0.1.0";
  manifestFileName: typeof SKENION_PACKAGE_MANIFEST_FILE_NAME;
  manifest: PackageManifestV01;
}

export interface PackageListingTargetSupportV01 {
  kind: PackageListingTargetSupportKindV01;
  targets?: PackageTargetTripleV01[];
  summary?: string;
}

export interface PackageListingProvidedSummaryRefV01 {
  id: string;
  description?: string;
}

export interface PackageListingProvidesSummaryV01 {
  patches?: PackageListingProvidedSummaryRefV01[];
  nodes?: PackageListingProvidedSummaryRefV01[];
  resources?: PackageListingProvidedSummaryRefV01[];
  help?: PackageListingProvidedSummaryRefV01[];
  nativeObjects?: PackageListingProvidedSummaryRefV01[];
  codecs?: PackageListingProvidedSummaryRefV01[];
  capabilities?: string[];
}

export interface PackageListingArtifactSummaryV01 {
  kind: PackageListingArtifactKindV01;
  target?: PackageTargetTripleV01;
  path: string;
  checksum: PackageChecksumV01;
  evidenceRefs: string[];
}

export interface PackageListingEvidenceSummaryV01 {
  id: string;
  kind: PackageEvidenceKindV01;
  path: string;
  checksum: PackageChecksumV01;
}

export interface PackageListingArtifactEvidenceSummaryV01 {
  artifacts: PackageListingArtifactSummaryV01[];
  evidence: PackageListingEvidenceSummaryV01[];
}

export interface PackageListingDiscoverySignalsV01 {
  stargazerCount: number;
  rankingScore: number;
}

export interface PackageListingDiagnosticV01 {
  severity: PackageDiagnosticSeverityV01;
  code: PackageListingDiagnosticCodeV01;
  message: string;
  details?: JsonValueV01;
}

/**
 * Public marketplace/package discovery projection.
 *
 * Project packageId, version, category, contracts, runtimeAbiRange,
 * targetSupport targets, provides, and artifactEvidence from PackageManifestV01
 * plus release artifacts; displayName is manifest-derived when present.
 * Marketplace/discovery metadata owns summary, description, tags, license,
 * homepageUrl, repositoryUrl, discoverySignals, and visibility diagnostics.
 * This DTO intentionally excludes accounts, auth, writes, install transactions,
 * local registry roots, and mutable package manifests.
 */
export interface PackageListingV01 {
  schema: "skenion.package.listing";
  schemaVersion: "0.1.0";
  packageId: string;
  version: string;
  displayName: string;
  summary: string;
  description?: string;
  category: PackageCategoryV01;
  tags?: string[];
  license: string;
  homepageUrl?: string;
  repositoryUrl?: string;
  contracts: PackageContractsSupportV01;
  runtimeAbiRange?: string;
  targetSupport: PackageListingTargetSupportV01;
  provides: PackageListingProvidesSummaryV01;
  artifactEvidence: PackageListingArtifactEvidenceSummaryV01;
  discoverySignals: PackageListingDiscoverySignalsV01;
  diagnostics: PackageListingDiagnosticV01[];
}

/**
 * Public package discovery/search response.
 *
 * The response is read-only aggregate discovery data. Install/update planning
 * request and response DTOs are intentionally deferred to the next package
 * management contract slice.
 */
export interface PackageDiscoveryResponseV01 {
  schema: "skenion.package.discovery";
  schemaVersion: "0.1.0";
  ok: boolean;
  listings: PackageListingV01[];
  diagnostics: PackageListingDiagnosticV01[];
}

export type PackageInstallPlanIntentV01 = "install" | "update";
export type PackageInstallPlanTargetOsV01 = "macos" | "windows" | "linux";
export type PackageInstallPlanTargetArchV01 = "aarch64" | "x86_64";
export type PackageInstallPlanActionKindV01 =
  | "download"
  | "verify"
  | "stage"
  | "replace"
  | "disable"
  | "rollback"
  | "keep"
  | "reject";
export type PackageInstallPlanCheckKindV01 =
  | "contracts-line"
  | "runtime-abi"
  | "target-triple"
  | "checksum"
  | "provenance"
  | "capability-change"
  | "lock-state";
export type PackageInstallPlanCheckStatusV01 = "pass" | "warning" | "fail" | "skipped";
export type PackageInstallPlanCapabilityChangeKindV01 = "add" | "remove" | "keep";
export type PackageInstallPlanCapabilityKindV01 = ProviderRefKindV01 | "capability";
export type PackageInstallPlanDiagnosticCodeV01 =
  | "incompatible-contracts-line"
  | "incompatible-runtime-abi"
  | "unsupported-target"
  | "missing-artifact"
  | "checksum-mismatch"
  | "missing-provenance-evidence"
  | "missing-lock-entry"
  | "ambiguous-package-id"
  | "stale-installed-lock"
  | "removed-capability"
  | "rollback-unavailable";

export interface PackageInstallPlanDesiredV01 {
  version?: string;
  versionRange?: string;
}

export interface PackageInstallPlanTargetV01 {
  os: PackageInstallPlanTargetOsV01;
  arch: PackageInstallPlanTargetArchV01;
  triple: PackageTargetTripleV01;
  contracts: PackageContractsSupportV01;
  runtimeAbiRange?: string;
}

export interface PackageInstallPlanCurrentStateV01 {
  packageLock: ProjectPackageLockEntryV01[];
  objectBindings: ProjectObjectBindingV01[];
  installedLockEntryId?: string;
}

export interface PackageInstallPlanCandidateV01 {
  listing: PackageListingV01;
  manifest?: PackageManifestV01;
}

/**
 * Declarative package install/update planning input.
 *
 * The request carries current lock/binding state plus candidate package
 * listing and optional manifest evidence. It intentionally has no endpoint,
 * registry write, filesystem mutation, or native loading semantics.
 */
export interface PackageInstallPlanRequestV01 {
  schema: "skenion.package.install-plan.request";
  schemaVersion: "0.1.0";
  requestId: string;
  intent: PackageInstallPlanIntentV01;
  packageId: string;
  desired: PackageInstallPlanDesiredV01;
  target: PackageInstallPlanTargetV01;
  current: PackageInstallPlanCurrentStateV01;
  candidates: PackageInstallPlanCandidateV01[];
  rollbackCandidates?: ProjectPackageLockEntryV01[];
}

export interface PackageInstallPlanCheckV01 {
  kind: PackageInstallPlanCheckKindV01;
  status: PackageInstallPlanCheckStatusV01;
  diagnosticRefs?: string[];
  message?: string;
}

export interface PackageInstallPlanCapabilityChangeV01 {
  kind: PackageInstallPlanCapabilityChangeKindV01;
  capabilityKind: PackageInstallPlanCapabilityKindV01;
  id: string;
  diagnosticRef?: string;
}

export interface PackageInstallPlanActionV01 {
  id: string;
  order: number;
  kind: PackageInstallPlanActionKindV01;
  packageId: string;
  version?: string;
  lockEntryId?: string;
  toLockEntryId?: string;
  rollbackLockEntryId?: string;
  target?: PackageTargetTripleV01;
  artifact?: PackageListingArtifactSummaryV01;
  checksum?: PackageChecksumV01;
  evidenceRefs?: string[];
  capabilityChanges?: PackageInstallPlanCapabilityChangeV01[];
  diagnosticRefs?: string[];
  reason?: string;
}

export interface PackageInstallPlanDiagnosticV01 {
  id: string;
  severity: PackageDiagnosticSeverityV01;
  code: PackageInstallPlanDiagnosticCodeV01;
  message: string;
  details?: JsonValueV01;
}

/**
 * Declarative package install/update planning output.
 *
 * A response can express a safe keep/no-op, ordered download/verify/stage/
 * replace actions, rollback, or fail-closed rejection with diagnostics. The
 * actions are planning records only and do not authorize Runtime mutation.
 */
export interface PackageInstallPlanResponseV01 {
  schema: "skenion.package.install-plan.response";
  schemaVersion: "0.1.0";
  requestId: string;
  ok: boolean;
  packageId: string;
  selectedVersion?: string;
  target: PackageInstallPlanTargetV01;
  checks: PackageInstallPlanCheckV01[];
  actions: PackageInstallPlanActionV01[];
  diagnostics: PackageInstallPlanDiagnosticV01[];
}

export interface AudioDeviceDescriptorV01 {
  id: string;
  name: string;
  hostApi?: string;
  isDefaultInput?: boolean;
  isDefaultOutput?: boolean;
  maxInputChannels?: number;
  maxOutputChannels?: number;
  clockDomainHint?: string;
}

export interface AudioDevicePreferenceV01 {
  deviceId?: string;
  nameContains?: string;
  defaultInput?: boolean;
  defaultOutput?: boolean;
}

export interface AudioStreamConfigRequestV01 {
  endpointId: string;
  direction: AudioEndpointDirectionV01;
  device?: AudioDevicePreferenceV01;
  sampleRate?: number;
  channels?: number;
  sampleFormat?: string;
  blockSize?: number;
}

export interface AudioStreamConfigResolvedV01 {
  endpointId: string;
  direction: AudioEndpointDirectionV01;
  device: AudioDeviceDescriptorV01;
  sampleRate: number;
  channels: number;
  sampleFormat: string;
  blockSize?: number;
  clockDomainId: string;
}

export interface AudioEndpointV01 {
  id: string;
  nodeId: string;
  direction: AudioEndpointDirectionV01;
  channelPorts: string[];
  requestedConfig?: AudioStreamConfigRequestV01;
  resolvedConfig?: AudioStreamConfigResolvedV01;
  clockDomainId?: string;
}

export interface AudioInputEndpointV01 extends AudioEndpointV01 {
  direction: "input";
}

export interface AudioOutputEndpointV01 extends AudioEndpointV01 {
  direction: "output";
}

export interface AudioClockDomainV01 {
  id: string;
  authority: AudioClockDomainAuthorityV01;
  source: string;
  sampleRate?: number;
  driftCompensated?: boolean;
  sharedWith?: string[];
}

export interface AudioGraphPartitionV01 {
  id: string;
  clockDomainId: string;
  endpointIds: string[];
  nodeIds: string[];
}

export interface AudioClockBridgeDiagnosticV01 {
  severity: "info" | "warning" | "error";
  code: string;
  message: string;
}

export interface AudioClockBridgePlanV01 {
  required: boolean;
  sourceClockDomainId: string;
  targetClockDomainId: string;
  method: AudioClockBridgeMethodV01;
  bridgeNodeId?: string;
  diagnostics: AudioClockBridgeDiagnosticV01[];
}

export interface AudioResamplerPlanV01 {
  sourceSampleRate: number;
  targetSampleRate: number;
  driftCompensation: boolean;
  quality: "placeholder" | "linear" | "sinc" | "external";
}

export interface RepresentationSpecV01 {
  id: RepresentationV01;
  semanticDataKind: ValueTypeIdV01;
  bitsPerComponent: number;
  signed?: boolean;
  integer?: boolean;
  normalized?: boolean;
  channels?: number;
}

export interface TypeDescriptorV01 {
  dataKind: SemanticDataKindV01 | string;
  representation?: RepresentationV01 | string;
}

export interface ConversionStepV01 {
  policy:
    | "identity"
    | "numeric-cast"
    | "float-to-integer"
    | "integer-to-float"
    | "integer-signedness"
    | "color-cast";
  clamp?: "saturating" | "unit";
  quantize?: boolean;
  trunc?: "toward-zero";
  sanitize?: "nan-inf-to-finite";
}

export interface ConversionDiagnosticV01 {
  severity: "info" | "warning" | "error";
  code: string;
  message: string;
}

export interface ConversionPlanV01 {
  ok: boolean;
  source: TypeDescriptorV01;
  target: TypeDescriptorV01;
  implicit: boolean;
  lossy: boolean;
  steps: ConversionStepV01[];
  diagnostics: ConversionDiagnosticV01[];
}

export interface PortV01 {
  id: string;
  direction: PortDirection;
  label?: string;
  type: DataTypeV01;
  required?: boolean;
  default?: unknown;
  activation?: PortActivation;
}

export type PortRateV01 = "event" | "control" | "audio" | "render" | "gpu" | "resource" | "io";
export type MergePolicyV01 = "forbid" | "ordered-events" | "mix" | "array" | "latest" | "first" | "custom";
export type FanOutPolicyV01 = "allow" | "forbid" | "copy" | "share";
export type TriggerModeV01 = "passive" | "trigger" | "latched";
export type FeedbackBoundaryV01 =
  | "same-turn"
  | "next-tick"
  | "control-frame"
  | "audio-sample"
  | "audio-block"
  | "render-frame"
  | "gpu-pingpong"
  | "manual";
export type FeedbackBufferModeV01 = "latest" | "queue" | "ring" | "pingpong";
export type CycleValidationV01 =
  | "no-cycle"
  | "valid-feedback"
  | "risky-feedback"
  | "ambiguous-algebraic-loop"
  | "invalid-cycle";

export interface MessageKeyPolicyV01 {
  accepted: string[];
  silent?: string[];
  trigger?: string[];
  store?: string[];
  emit?: string[];
}

export interface PortSpecV01 {
  id: string;
  direction: PortDirection;
  type: string;
  label?: string;
  rate?: PortRateV01;
  accepts?: string[];
  minConnections?: number;
  maxConnections?: number | null;
  mergePolicy?: MergePolicyV01;
  fanOutPolicy?: FanOutPolicyV01;
  triggerMode?: TriggerModeV01;
  messageKeys?: MessageKeyPolicyV01;
  defaultValue?: unknown;
  latch?: boolean;
  required?: boolean;
  styleKey?: string;
  group?: string;
  description?: string;
}

export interface PortGroupSpecV01 {
  id: string;
  direction: PortDirection;
  type: string;
  minPorts: number;
  label?: string;
  rate?: PortRateV01;
  maxPorts?: number;
  ordered?: boolean;
  portIdPattern?: string;
  createLabel?: string;
  defaultPortSpec?: PortSpecV01;
}

export interface FeedbackPolicyV01 {
  enabled: boolean;
  boundary: FeedbackBoundaryV01;
  initialValue?: unknown;
  recursionLimit?: number;
  maxEventsPerTick?: number;
  maxIterationsPerFrame?: number;
  bufferMode?: FeedbackBufferModeV01;
  intentional?: boolean;
  label?: string;
}

export interface EdgeEndpointV01 {
  nodeId: string;
  portId: string;
}

export interface EdgeSpecV01 {
  id: string;
  source: EdgeEndpointV01;
  target: EdgeEndpointV01;
  resolvedType?: string;
  order?: number;
  enabled?: boolean;
  adapter?: string;
  feedback?: FeedbackPolicyV01;
  styleOverride?: string;
  label?: string;
  description?: string;
}

export interface CableStyleV01 {
  color?: string;
  pattern?: "solid" | "dashed" | "dotted";
  width?: number;
  marker?: string;
}

export type CableStyleRegistryV01 = Record<string, CableStyleV01>;

export interface GraphNodeV01 {
  id: string;
  kind: string;
  kindVersion: string;
  objectText?: string;
  bindingRef?: string;
  params: Record<string, unknown>;
  ports: PortSpecV01[];
  portGroups?: PortGroupSpecV01[];
}

export interface GraphDocumentV01 {
  schema: "skenion.graph";
  schemaVersion: "0.1.0";
  id: string;
  revision: string;
  nodes: GraphNodeV01[];
  edges: EdgeSpecV01[];
  cableStyles?: CableStyleRegistryV01;
}

export interface CanvasNodeViewV01 {
  x: number;
  y: number;
  width?: number;
  height?: number;
  collapsed?: boolean;
}

export interface CanvasViewportV01 {
  x: number;
  y: number;
  zoom: number;
}

export interface ViewStateV01 {
  schema: "skenion.view-state";
  schemaVersion: "0.1.0";
  canvas: {
    nodes: Record<string, CanvasNodeViewV01>;
    viewport?: CanvasViewportV01;
  };
}

export interface GraphFragmentViewV01 {
  nodes?: Record<string, CanvasNodeViewV01>;
}

export interface GraphFragmentOmittedEdgeV01 {
  id: string;
  source: EdgeEndpointV01;
  target: EdgeEndpointV01;
  reason: "outside-fragment" | "policy-omit";
}

export interface GraphFragmentV01 {
  schema: "skenion.graph.fragment";
  schemaVersion: "0.1.0";
  id?: string;
  nodes: GraphNodeV01[];
  edges: EdgeSpecV01[];
  view?: GraphFragmentViewV01;
  omittedEdges?: GraphFragmentOmittedEdgeV01[];
  metadata?: Record<string, unknown>;
}

export type GraphFragmentOutsideEndpointPolicyV01 = "reject" | "omit";

export interface GraphFragmentValidationOptionsV01 {
  outsideEndpointPolicy?: GraphFragmentOutsideEndpointPolicyV01;
}

export interface GraphFragmentDiagnosticV01 {
  severity: "error" | "warning";
  code: string;
  message: string;
  nodes?: string[];
  edges?: string[];
}

export interface GraphFragmentValidationResultV01 {
  ok: boolean;
  diagnostics: GraphFragmentDiagnosticV01[];
  omittedEdgeIds: string[];
}

export type PatchPath =
  | { kind: "root" }
  | { kind: "project-patch-definition"; patchId: string }
  | { kind: "package-patch-definition"; packageId: string; patchId: string; version?: string }
  | { kind: "embedded-patch-instance"; ownerPath: string[]; nodeId: string }
  | {
      kind: "help-working-copy";
      workingCopyId: string;
      sourcePackageId?: string;
      sourcePatchId?: string;
    };

export interface GraphTargetRef {
  path: PatchPath;
  baseRevision: string;
  targetRevision?: string;
}

export type PastePlacement =
  | { kind: "position"; x: number; y: number }
  | { kind: "anchor"; nodeId: string; offsetX?: number; offsetY?: number };

export type InterfaceIncidentEdgePolicyV01 = "drop" | "preserve-diagnostic" | "reject";
export type InterfaceRecoveryActionIdV01 = "drop-edge" | "reconnect" | "restore-port" | "replace-provider";
export type InterfaceDiagnosticMissingEndpointV01 = "source-node" | "source-port" | "target-node" | "target-port";
export type InterfaceDiagnosticCardinalityReasonV01 =
  | "fan-in"
  | "fan-out"
  | "merge-policy"
  | "min-connections"
  | "max-connections";

export interface InterfaceDiagnosticCardinalityV01 {
  reason: InterfaceDiagnosticCardinalityReasonV01;
  policy?: string;
  limit?: number | null;
  actual?: number;
}

export interface InterfaceDiagnosticDetailV01 {
  edgeId: string;
  sourceNodeId: string;
  sourcePortId: string;
  targetNodeId: string;
  targetPortId: string;
  missingEndpoint?: InterfaceDiagnosticMissingEndpointV01;
  expectedDirection?: PortDirection;
  actualDirection?: PortDirection;
  expectedType?: string;
  actualType?: string;
  cardinality?: InterfaceDiagnosticCardinalityV01;
  recoveryActions: InterfaceRecoveryActionIdV01[];
}

export interface PasteGraphFragmentOptions {
  outsideEndpointPolicy?: GraphFragmentOutsideEndpointPolicyV01;
  idConflictPolicy?: "remap" | "reject";
  interfaceIncidentEdgePolicy?: InterfaceIncidentEdgePolicyV01;
  preserveRelativePositions?: boolean;
}

export interface PasteGraphFragmentRequest {
  target: GraphTargetRef;
  fragment: GraphFragmentV01;
  placement?: PastePlacement;
  options?: PasteGraphFragmentOptions;
}

export interface ProjectMetadataV01 {
  title?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export type ProviderRefKindV01 = "patch" | "node" | "resource" | "native-object" | "codec" | "help";

export interface ProjectPackageDependencyV01 {
  packageId: string;
  versionRange: string;
  lockEntryId: string;
  required?: boolean;
}

export interface ProjectPackageLockEntryV01 {
  id: string;
  packageId: string;
  version: string;
  category: PackageCategoryV01;
  source: PackageSourceV01;
  root: PackageRootV01;
  trust: PackageTrustV01;
  contractsLine: string;
  contractsRange: string;
  manifestPath: string;
  manifestChecksum: PackageChecksumV01;
  evidenceRefs?: string[];
  runtimeAbiRange?: string;
  target?: PackageTargetTripleV01;
  nativeArtifacts?: PackageNativeArtifactV01[];
}

export interface ProjectResourceLockEntryV01 {
  id: string;
  lockEntryId: string;
  resourceId: string;
  path: string;
  checksum: PackageChecksumV01;
  evidenceRefs?: string[];
}

export type ProjectObjectBindingStatusV01 = "resolved" | "unresolved" | "ambiguous" | "stale" | "missing";

export type ProjectObjectBindingDiagnosticCodeV01 =
  | "binding-unresolved"
  | "binding-ambiguous"
  | "binding-target-missing"
  | "binding-target-stale"
  | "binding-lock-mismatch"
  | "binding-interface-drift";

export interface ProjectObjectBindingDiagnosticV01 {
  severity: PackageDiagnosticSeverityV01;
  code: ProjectObjectBindingDiagnosticCodeV01;
  message: string;
  details?: JsonValueV01;
}

export interface ProjectPatchBindingTargetV01 {
  kind: "projectPatch";
  patchId: string;
  revision?: string;
  interfaceRevision?: string;
  interfaceDigest?: PackageChecksumV01;
}

export interface PackageProviderBindingTargetV01 {
  kind: "packageProvider";
  lockEntryId: string;
  packageId: string;
  capabilityKind: ProviderRefKindV01;
  providedId: string;
  alias?: string;
  displayName?: string;
}

export type ProjectObjectBindingTargetV01 = ProjectPatchBindingTargetV01 | PackageProviderBindingTargetV01;

export interface ProjectObjectBindingV01 {
  id: string;
  objectText: string;
  status: ProjectObjectBindingStatusV01;
  target?: ProjectObjectBindingTargetV01;
  diagnostics?: ProjectObjectBindingDiagnosticV01[];
}

export interface PatchDefinitionV01 {
  id: string;
  revision: string;
  metadata?: ProjectMetadataV01;
  graph: GraphDocumentV01;
  viewState?: ViewStateV01;
}

export interface PatchContractPortV01 extends PortSpecV01 {
  boundaryNodeId: string;
  boundaryPortId: string;
}

export interface PatchContractV01 {
  id: string;
  revision: string;
  metadata?: ProjectMetadataV01;
  ports: PatchContractPortV01[];
}

export interface ProjectDocumentV01 {
  schema: "skenion.project";
  schemaVersion: "0.1.0";
  id: string;
  revision: string;
  metadata?: ProjectMetadataV01;
  graph: GraphDocumentV01;
  viewState: ViewStateV01;
  patchLibrary: PatchDefinitionV01[];
  packageDependencies?: ProjectPackageDependencyV01[];
  packageLock?: ProjectPackageLockEntryV01[];
  resourceLock?: ProjectResourceLockEntryV01[];
  objectBindings?: ProjectObjectBindingV01[];
  tutorial?: Record<string, unknown>;
  help?: Record<string, unknown>;
}

export interface GraphValidationDiagnosticV01 {
  severity: "error" | "warning";
  code: string;
  message: string;
  nodes?: string[];
  edges?: string[];
}

export interface GraphCycleValidationV01 {
  classification: CycleValidationV01;
  nodes: string[];
  edges: string[];
  message: string;
}

export interface GraphValidationResultV01 {
  ok: boolean;
  diagnostics: GraphValidationDiagnosticV01[];
  cycles: GraphCycleValidationV01[];
}

export type ExecutionModelV01 =
  | "event"
  | "control"
  | "frame"
  | "audio_block"
  | "video_frame"
  | "gpu_pass"
  | "async_resource"
  | "script_control"
  | "native_plugin";

export interface NodeExecutionV01 {
  model: ExecutionModelV01;
  clock?: "frame" | "audio" | "beat" | "timecode" | "external";
}

export interface NodeStateV01 {
  persistent: boolean;
}

export interface NodeSurfaceV01 {
  palette?: "direct";
}

export interface NodeDefinitionManifestV01 {
  schema: "skenion.node.definition";
  schemaVersion: "0.1.0";
  id: string;
  version: string;
  displayName: string;
  category: string;
  scriptApiVersion?: string;
  bundleHash?: string;
  surface?: NodeSurfaceV01;
  ports: PortSpecV01[];
  portGroups?: PortGroupSpecV01[];
  execution: NodeExecutionV01;
  state: NodeStateV01;
  permissions: string[];
  capabilities: string[];
}

export type ShaderLanguageV01 = "wgsl";
export type ShaderUniformDataKindV01 =
  | "value.core.float32"
  | "value.core.int32"
  | "value.core.uint32"
  | "value.core.bool"
  | "value.core.color";

export interface ShaderUniformV01 {
  id: string;
  label: string;
  type: DataTypeV01;
  default?: unknown;
  required: boolean;
}

export interface ShaderInterfaceV01 {
  schema: "skenion.shader.interface";
  schemaVersion: "0.1.0";
  language: ShaderLanguageV01;
  uniforms: ShaderUniformV01[];
}

export type ShaderDiagnosticSeverityV01 = "error" | "warning" | "info";
export type ShaderDiagnosticPhaseV01 =
  | "interface-analysis"
  | "source-sync"
  | "wgsl-generation"
  | "wgsl-compile"
  | "render-pipeline"
  | "render-frame";
export type ShaderDiagnosticSourceV01 = "user" | "generated" | "runtime";

export interface ShaderSourceSpanV01 {
  line?: number;
  column?: number;
  endLine?: number;
  endColumn?: number;
}

export interface ShaderDiagnosticV01 extends ShaderSourceSpanV01 {
  severity: ShaderDiagnosticSeverityV01;
  phase: ShaderDiagnosticPhaseV01;
  code: string;
  message: string;
  uniformId?: string;
  source: ShaderDiagnosticSourceV01;
}

export type ShaderInterfaceDiagnosticV01 = ShaderDiagnosticV01;

export interface GeneratedShaderSourceMapV01 {
  userSourceStartLine: number;
  generatedLineOffset: number;
}

export interface ShaderInterfaceAnalysisV01 {
  ok: boolean;
  shaderInterface: ShaderInterfaceV01;
  diagnostics: ShaderInterfaceDiagnosticV01[];
}

export type MessageAtomV01 =
  | { type: "float"; representation: FloatRepresentationV01; value: number }
  | { type: "int"; representation: IntRepresentationV01; value: number }
  | { type: "uint"; representation: UintRepresentationV01; value: number }
  | { type: "bool"; value: boolean }
  | { type: "string"; value: string }
  | {
      type: "color";
      representation: ColorRepresentationV01;
      colorSpace?: "linear" | "srgb";
      value: [number, number, number, number];
    };

export interface MessageValueV01 {
  key: string;
  atoms: MessageAtomV01[];
}

export type ObjectTextAtomV01 =
  | { type: "float"; value: number; representation?: string }
  | { type: "int"; value: number; representation?: string }
  | { type: "uint"; value: number; representation?: string }
  | { type: "bool"; value: boolean }
  | { type: "identifier"; value: string }
  | { type: "string"; value: string };

export interface ObjectTextPortV01 {
  id: string;
  direction: PortDirection;
  type: string;
  rate?: PortRateV01;
  accepts?: string[];
  activation?: "trigger" | "latched" | "passive";
  defaultValue?: unknown;
  messageKeys?: MessageKeyPolicyV01;
  description?: string;
}

export interface ObjectTextDiagnosticV01 {
  severity: "error" | "warning" | "info";
  code: string;
  message: string;
}

export interface ObjectTextParseResultV01 {
  schema: "skenion.object-text.parse-result";
  schemaVersion: "0.1.0";
  input: string;
  ok: boolean;
  className: string;
  creationArgs: ObjectTextAtomV01[];
  resolvedKind: string | null;
  resolvedKindVersion: string | null;
  params: Record<string, unknown>;
  instancePorts: ObjectTextPortV01[];
  displayText: string;
  diagnostics: ObjectTextDiagnosticV01[];
}

export type CompatibilityMatrixPackageEcosystemV01 = "npm" | "crates.io";

export interface CompatibilityMatrixRegistryPackageV01 {
  ecosystem: CompatibilityMatrixPackageEcosystemV01;
  name: string;
  version: string;
  url?: string | null;
}

export interface CompatibilityMatrixProtocolBaselinesV01 {
  graph: "0.1";
  project: "0.1";
  node: "0.1";
  extension: "0.1";
  "runtime-http": "v0";
  "runtime-collaboration": "v0";
}

export interface CompatibilityMatrixContractsComponentV01 {
  npm: CompatibilityMatrixRegistryPackageV01;
  crate: CompatibilityMatrixRegistryPackageV01;
}

export interface CompatibilityMatrixRuntimeComponentV01 {
  version: string;
}

export interface CompatibilityMatrixSdkComponentV01 {
  npm: CompatibilityMatrixRegistryPackageV01;
  "supported-contracts-range": string;
}

export interface CompatibilityMatrixStudioComponentV01 {
  version: string;
}

export interface CompatibilityMatrixComponentsV01 {
  contracts: CompatibilityMatrixContractsComponentV01;
  runtime: CompatibilityMatrixRuntimeComponentV01;
  sdk: CompatibilityMatrixSdkComponentV01;
  studio: CompatibilityMatrixStudioComponentV01;
}

export interface CompatibilityMatrixV01 {
  schema: "skenion.compatibility-matrix";
  "schema-version": "0.1.0";
  "matrix-id": string;
  "contracts-line": string;
  "contracts-range": string;
  "protocol-baselines": CompatibilityMatrixProtocolBaselinesV01;
  components: CompatibilityMatrixComponentsV01;
}

export interface ValidationSuccess<T> {
  ok: true;
  value: T;
}

export interface ValidationFailure {
  ok: false;
  errors: string[];
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;
