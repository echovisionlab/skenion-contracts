export type DataFlow = "value" | "event" | "signal" | "stream" | "resource";
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

export type SemanticDataKindV01 =
  | "number.float"
  | "number.int"
  | "number.uint"
  | "boolean"
  | "string"
  | "message.any"
  | "event.bang"
  | "clock.state"
  | "asset.video"
  | "video.frame"
  | "signal.audio"
  | "gpu.texture2d"
  | "color";

export type FloatRepresentationV01 =
  | "f64"
  | "f32"
  | "f16"
  | "f8.e4m3"
  | "f8.e5m2"
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

export type RuntimeClockDiagnosticSeverity = "warning" | "error";

export interface RuntimeClockDiagnostic {
  severity: RuntimeClockDiagnosticSeverity;
  code: string;
  message: string;
}

export type RuntimeIoDiagnosticSeverity = "warning" | "error";

export interface RuntimeIoDiagnostic {
  severity: RuntimeIoDiagnosticSeverity;
  code: string;
  message: string;
}

export type RuntimeIoTransportKind = "midi" | "hid" | "serial" | "inline";
export type RuntimeIoDirection = "input" | "output";

export interface RuntimeIoDeviceDescriptor {
  id: string;
  name: string;
  transportKind: RuntimeIoTransportKind;
  directions: RuntimeIoDirection[];
  backend: string;
  index?: number;
  stable: boolean;
}

export interface RuntimeIoDeviceListResponse {
  ok: boolean;
  devices: RuntimeIoDeviceDescriptor[];
  diagnostics: RuntimeIoDiagnostic[];
}

export interface RuntimeIoInlineFrame {
  atNs: number;
  bytes: number[];
}

export type RuntimeIoBindingConfig =
  | { kind: "midi"; deviceId: string }
  | { kind: "hid"; deviceId: string }
  | { kind: "serial"; deviceId: string; baudRate?: number }
  | { kind: "inline"; frames: RuntimeIoInlineFrame[] };

export type RuntimeDiagnosticSeverityV01 = "error" | "warning" | "info";
export type RuntimeDiagnosticSeverity = RuntimeDiagnosticSeverityV01;
export type RuntimeDiagnosticDetails =
  | string
  | number
  | boolean
  | null
  | RuntimeDiagnosticDetails[]
  | { [key: string]: RuntimeDiagnosticDetails };

export interface RuntimeDiagnosticV01 {
  severity: RuntimeDiagnosticSeverityV01;
  message: string;
  code?: string;
  details?: RuntimeDiagnosticDetails;
}

export type RuntimeDiagnostic = RuntimeDiagnosticV01;

export interface RuntimeHealth {
  ok: boolean;
  service: string;
  version: string;
}

export interface RuntimeInfo {
  name: string;
  version: string;
  apiVersion: string;
  capabilities: string[];
}

export type RuntimeSessionLifecycleState = "initializing" | "ready" | "closing" | "closed" | "error";
export type RuntimeConnectionProfileMode = "local-managed" | "local-shared" | "remote";
export type RuntimeOwnershipMode = "owned-child" | "external" | "remote";

export interface RuntimeEndpointMetadata {
  url: string;
  canonicalUrl?: string;
  protocol: "http" | "https";
  host?: string;
  port?: number;
  tls?: boolean;
}

export interface RuntimeProcessMetadata {
  ownedByHost: boolean;
  pid?: number;
  executablePath?: string;
  workingDirectory?: string;
  startedAt?: string;
  ownerWindowId?: string;
  platform?: string;
  arch?: string;
}

export interface RuntimeConnectionProfileBase {
  displayName?: string;
  endpoint: RuntimeEndpointMetadata;
  process?: RuntimeProcessMetadata | null;
}

export type RuntimeConnectionProfile =
  | (RuntimeConnectionProfileBase & { mode: "local-managed"; ownership: "owned-child" })
  | (RuntimeConnectionProfileBase & { mode: "local-shared"; ownership: "external" })
  | (RuntimeConnectionProfileBase & { mode: "remote"; ownership: "remote" });

export interface RuntimeEventReplayWindow {
  cursorKind: "sequence";
  currentCursor: string;
  earliestSequence: number;
  latestSequence: number;
  replayLimit: number | null;
  overflow?: boolean;
}

export interface RuntimeSessionCapabilitySet {
  sessionAddressing: boolean;
  eventReplay: boolean;
  multiWindow: boolean;
  profiles: RuntimeConnectionProfileMode[];
  authPolicy: "deferred";
}

export interface RuntimeLogEvent {
  id: number;
  timestamp: string;
  source: "runtime";
  level: RuntimeDiagnosticSeverity;
  code: string | null;
  message: string;
}

export interface RuntimeLogRetention {
  replayLimit: number;
  replayLevels: RuntimeDiagnosticSeverity[];
}

export interface RuntimeLogSnapshotResponse {
  schema: "skenion.runtime.logs";
  schemaVersion: string;
  ok: boolean;
  events: RuntimeLogEvent[];
  retention: RuntimeLogRetention;
  diagnostics: RuntimeDiagnostic[];
}

export type RuntimeProjectSnapshot = ProjectDocumentV01;
export type RuntimeProjectRequest = ProjectDocumentV01;

export interface RuntimePlan {
  graphId: string;
  graphRevision: string;
  nodes: RuntimePlanNode[];
  edges: RuntimePlanEdge[];
  groups: RuntimeExecutionGroup[];
}

export interface RuntimePlanNode {
  nodeId: string;
  kind: string;
  kindVersion: string;
  executionModel: string;
  order: number;
}

export interface RuntimePlanEdge {
  fromNode: string;
  fromPort: string;
  toNode: string;
  toPort: string;
  metadata?: RuntimePlanEdgeMetadata | null;
}

export interface RuntimePlanEdgeMetadata {
  resolvedType?: string | null;
  mergePolicy?: string | null;
  fanOutPolicy?: string | null;
  order?: number | null;
  feedback?: {
    boundary: string;
    bufferMode?: string;
    maxLatencyFrames?: number;
  } | null;
  cycleClassification?: string | null;
}

export interface RuntimeExecutionGroup {
  executionModel: string;
  nodeIds: string[];
}

export interface RuntimeDummyExecutionReport {
  graphId: string;
  graphRevision: string;
  frameCount: number;
  frames: RuntimeDummyFrameReport[];
}

export interface RuntimeDummyFrameReport {
  index: number;
  executedNodes: RuntimeDummyNodeExecution[];
}

export interface RuntimeDummyNodeExecution {
  nodeId: string;
  kind: string;
  kindVersion: string;
  executionModel: string;
  order: number;
  status: string;
}

export interface RuntimeApiResponse {
  ok: boolean;
  diagnostics: RuntimeDiagnostic[];
  plan: RuntimePlan | null;
  report: RuntimeDummyExecutionReport | null;
}

export interface RuntimeSessionSnapshot {
  sessionRevision: number;
  viewRevision: number;
  controlRevision: number;
  project: RuntimeProjectSnapshot | null;
  diagnostics: RuntimeDiagnosticV01[];
  plan: Record<string, unknown> | null;
}

export interface RuntimeSessionResponse {
  ok: boolean;
  snapshot: RuntimeSessionSnapshot;
  diagnostics: RuntimeDiagnosticV01[];
  report: RuntimeDummyExecutionReport | null;
}

export interface RuntimeSessionInfoResponse {
  schema: "skenion.runtime.session.info";
  schemaVersion: "0.1.0";
  ok: boolean;
  sessionId: string;
  lifecycle: RuntimeSessionLifecycleState;
  snapshot: RuntimeSessionSnapshot;
  profile: RuntimeConnectionProfile;
  capabilities: RuntimeSessionCapabilitySet;
  eventReplay: RuntimeEventReplayWindow;
  diagnostics: RuntimeDiagnosticV01[];
}

export interface RuntimeMutationRequest {
  operation?: RuntimeOperationEnvelope;
  viewPatch?: RuntimeViewPatch;
  clientId?: string;
  description?: string;
}

export interface RuntimeViewPatch {
  baseViewRevision: number;
  ops: RuntimeViewPatchOperation[];
}

export type RuntimeViewPatchOperation =
  | { op: "setNodeView"; nodeId: string; view: CanvasNodeViewV01 }
  | { op: "moveNodeView"; nodeId: string; from?: CanvasNodeViewV01; to: CanvasNodeViewV01 };

export type RuntimeHistoryEntryKind = "apply" | "undo" | "redo";

export interface RuntimeHistoryEntry {
  id: string;
  sequence: number;
  kind: RuntimeHistoryEntryKind;
  mutation: RuntimeMutationRequest;
  inverseMutation: RuntimeMutationRequest;
  subjectEventId?: string;
  clientId?: string;
  description?: string;
  createdAt: string;
}

export interface RuntimeHistory {
  schema: "skenion.runtime.history";
  schemaVersion: "0.1.0";
  entries: RuntimeHistoryEntry[];
  canUndo: boolean;
  canRedo: boolean;
  undoDepth: number;
  redoDepth: number;
}

export interface RuntimeMutationResponse {
  ok: boolean;
  applied: boolean;
  conflict: boolean;
  snapshot: RuntimeSessionSnapshot;
  history: RuntimeHistory;
  diagnostics: RuntimeDiagnosticV01[];
}

export type RuntimeSessionEventKind = "snapshot" | "load" | "clear" | "mutate" | "undo" | "redo";

export interface RuntimeEventReplayGap {
  expectedSequence: number;
  actualSequence: number;
  reason: "retention-overflow" | "stream-reset" | "unknown";
}

export interface RuntimeEventReplayMetadata {
  cursor: string;
  previousCursor: string | null;
  replayed: boolean;
  gap: RuntimeEventReplayGap | null;
  overflow: boolean;
}

export interface RuntimeSessionEvent {
  schema: "skenion.runtime.session.event";
  schemaVersion: "0.1.0";
  id: string;
  sessionId: string;
  sequence: number;
  sessionRevision: number;
  kind: RuntimeSessionEventKind;
  snapshot: RuntimeSessionSnapshot;
  history: RuntimeHistory;
  mutation?: RuntimeHistoryEntry;
  replay: RuntimeEventReplayMetadata;
  diagnostics: RuntimeDiagnosticV01[];
  createdAt: string;
}

export type RuntimePreviewState = "stopped" | "starting" | "running" | "exited" | "error";

export interface RuntimePreviewStatus {
  ok: boolean;
  state: RuntimePreviewState;
  pid: number | null;
  graphId: string | null;
  graphRevision: string | null;
  sessionRevision: number | null;
  previewSessionRevision: number | null;
  controlRevision: number | null;
  previewControlRevision: number | null;
  controlLive: boolean;
  lastControlUpdateAt: string | null;
  stale: boolean;
  startedAt: string | null;
  exitedAt: string | null;
  exitCode: number | null;
  message: string | null;
  diagnostics: RuntimeDiagnostic[];
}

export interface RuntimePreviewStartRequest {
  restart: boolean;
}

export interface RuntimeAsset {
  id: string;
  name: string;
  mimeType: string;
  kind: string;
  sizeBytes: number;
  runtimeUri: string;
}

export interface RuntimeAssetImportResponse {
  ok: boolean;
  asset: RuntimeAsset | null;
  diagnostics: RuntimeDiagnostic[];
}

export interface RuntimeAssetListResponse {
  ok: boolean;
  assets: RuntimeAsset[];
  diagnostics: RuntimeDiagnostic[];
}

export interface RuntimeAssetGetResponse {
  ok: boolean;
  asset: RuntimeAsset | null;
  diagnostics: RuntimeDiagnostic[];
}

export type RuntimeControlValue =
  | { type: "float"; representation: FloatRepresentationV01; value: number }
  | { type: "int"; representation: IntRepresentationV01; value: number }
  | { type: "uint"; representation: UintRepresentationV01; value: number }
  | { type: "bool"; value: boolean }
  | { type: "string"; value: string }
  | {
      type: "color";
      representation: ColorRepresentationV01;
      colorSpace: "linear" | "srgb";
      value: [number, number, number, number];
    };

export type RuntimeControlAtom = RuntimeControlValue;

export interface RuntimeControlMessage {
  selector: string;
  atoms: RuntimeControlAtom[];
}

export interface RuntimeControlEventRequest {
  nodeId: string;
  portId: "in" | "cold" | "value" | "out";
  message: RuntimeControlMessage;
}

export interface RuntimeControlEmission {
  nodeId: string;
  portId: "in" | "out" | "value";
  message: RuntimeControlMessage;
}

export interface RuntimeControlEventResponse {
  ok: boolean;
  changed: boolean;
  controlRevision: number | null;
  emitted: RuntimeControlEmission[];
  diagnostics: RuntimeDiagnostic[];
}

export interface RuntimeControlStateResponse {
  ok: boolean;
  controlRevision: number;
  values: Record<string, RuntimeControlValue>;
  channels: Record<string, RuntimeControlMessage>;
  diagnostics: RuntimeDiagnostic[];
}

export type RuntimeControlReadTarget = "param" | "port" | "state";

export interface RuntimeControlReadRequest {
  nodeId: string;
  target: RuntimeControlReadTarget;
  id: string;
}

export type RuntimeControlReadValue =
  | RuntimeControlValue
  | {
      type: "json";
      value: unknown;
    };

export interface RuntimeControlReadResponse {
  ok: boolean;
  address: RuntimeControlReadRequest;
  value: RuntimeControlReadValue | null;
  diagnostics: RuntimeDiagnostic[];
}

export interface RuntimeTelemetrySnapshot {
  schema: "skenion.runtime.telemetry";
  schemaVersion: "0.1.0";
  ok: boolean;
  timestamp: string;
  session: RuntimeTelemetrySession;
  preview: RuntimeTelemetryPreview;
  render: RuntimeTelemetryRender;
  process: RuntimeTelemetryProcess;
  diagnostics: RuntimeDiagnostic[];
}

export interface RuntimeTelemetrySession {
  loaded: boolean;
  graphId: string | null;
  graphRevision: string | null;
  sessionRevision: number;
  controlRevision: number;
}

export interface RuntimeTelemetryPreview {
  state: RuntimePreviewState;
  pid: number | null;
  stale: boolean;
  graphId: string | null;
  graphRevision: string | null;
  sessionRevision: number | null;
  previewSessionRevision: number | null;
  controlRevision: number | null;
  previewControlRevision: number | null;
  controlLive: boolean;
  lastControlUpdateAt: string | null;
}

export interface RuntimeTelemetryRender {
  active: boolean;
  backend: string | null;
  renderer: string | null;
  framesRendered: number;
  approxFps: number | null;
  lastFrameMs: number | null;
  lastError: string | null;
  sourceNodeId: string | null;
  diagnostics: ShaderDiagnosticV01[];
  generatedSourceAvailable: boolean;
  controlRevision: number | null;
  previewControlRevision: number | null;
  controlLive: boolean;
  lastControlUpdateAt: string | null;
}

export interface RuntimeTelemetryProcess {
  runtimeVersion: string;
  uptimeMs: number;
}

export interface RuntimeGeneratedShaderResponse {
  ok: boolean;
  nodeId: string | null;
  language: "wgsl" | null;
  source: string | null;
  sourceMap: GeneratedShaderSourceMapV01 | null;
  diagnostics: ShaderDiagnosticV01[];
}

export interface RuntimeSessionRunRequest {
  frames: number;
}

export type ExtensionKindV01 = "core-package" | "native-runtime" | "codec" | "node-pack";
export type ExtensionNativeArtifactAbiV01 = "c";
export type ExtensionCodecDirectionV01 = "decode" | "encode" | "duplex";
export type ExtensionTransportKindV01 = "midi" | "hid" | "serial" | "inline";
export type ExtensionTestKindV01 = "node" | "codec" | "extension";
export type RuntimeExtensionStatus = "loaded" | "disabled" | "failed";

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
  details?: RuntimeDiagnosticDetails;
}

export interface PackageManifestV01 {
  schema: "skenion.package.manifest";
  schemaVersion: "0.1.0";
  id: string;
  version: string;
  displayName?: string;
  category: PackageCategoryV01;
  source: PackageSourceV01;
  root: PackageRootV01;
  trust: PackageTrustV01;
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

export interface PackageRegistryEntryV01 {
  packageId: string;
  version: string;
  category: PackageCategoryV01;
  source: PackageSourceV01;
  root: PackageRootV01;
  trust: PackageTrustV01;
  contracts: PackageContractsSupportV01;
  runtimeAbiRange?: string;
  targets?: PackageTargetTripleV01[];
  manifestPath: string;
  manifestChecksum: PackageChecksumV01;
  provides: PackageProvidesV01;
  diagnostics: PackageDiagnosticV01[];
}

export interface PackageRegistryListResponseV01 {
  ok: boolean;
  packages: PackageRegistryEntryV01[];
  diagnostics: PackageDiagnosticV01[];
}

export interface RuntimeExtensionDescriptor {
  id: string;
  version: string;
  kind: ExtensionKindV01;
  runtimeAbiVersion: string;
  manifestPath: string;
  status: RuntimeExtensionStatus;
  capabilities: string[];
  providedNodes: string[];
  providedCodecs: string[];
  providedTransports: string[];
  providedHelp: string[];
  testIds: string[];
  diagnostics: RuntimeDiagnostic[];
}

export interface RuntimeExtensionListResponse {
  ok: boolean;
  extensions: RuntimeExtensionDescriptor[];
  diagnostics: RuntimeDiagnostic[];
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
  semanticDataKind: "number.float" | "number.int" | "number.uint" | "color";
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

export interface PasteGraphFragmentOptions {
  outsideEndpointPolicy?: GraphFragmentOutsideEndpointPolicyV01;
  idConflictPolicy?: "remap" | "reject";
  preserveRelativePositions?: boolean;
}

export interface PasteGraphFragmentRequest {
  target: GraphTargetRef;
  fragment: GraphFragmentV01;
  placement?: PastePlacement;
  options?: PasteGraphFragmentOptions;
}

export interface RuntimeOperationAttribution {
  actorId?: string;
  clientId?: string;
  label?: string;
}

export interface RuntimeOperationEnvelope {
  schema: "skenion.runtime.operation";
  schemaVersion: "0.1.0";
  id: string;
  kind: "pasteGraphFragment";
  request: PasteGraphFragmentRequest;
  attribution?: RuntimeOperationAttribution;
  correlationId?: string;
  createdAt?: string;
}

export interface IdRemapResult {
  nodeIdMap: Record<string, string>;
  edgeIdMap: Record<string, string>;
  omittedEdgeIds: string[];
}

export type RuntimeOperationDiagnosticSeverity = "error" | "warning" | "info";

export interface RuntimeOperationDiagnostic {
  severity: RuntimeOperationDiagnosticSeverity;
  code: string;
  message: string;
  path?: string;
  target?: GraphTargetRef;
  expectedRevision?: string;
  actualRevision?: string;
  duplicates?: string[];
  nodes?: string[];
  edges?: string[];
}

export interface PasteGraphFragmentResponse {
  schema: "skenion.runtime.paste-graph-fragment.response";
  schemaVersion: "0.1.0";
  ok: boolean;
  applied: boolean;
  conflict: boolean;
  target: GraphTargetRef;
  revisionBefore: string;
  revisionAfter: string | null;
  historyEntryId: string | null;
  idRemap: IdRemapResult;
  diagnostics: RuntimeOperationDiagnostic[];
}

export interface RuntimeCollaborationCausalMetadata {
  baseRevision: string;
  baseSequence: number;
  vector: Record<string, number>;
  observedOperationIds?: string[];
}

export type RuntimeCollaborationAuthSubjectKind = "anonymous" | "user" | "service" | "deferred";

export interface RuntimeCollaborationAuthSubject {
  kind: RuntimeCollaborationAuthSubjectKind;
  subjectId?: string;
  issuer?: string;
  displayName?: string;
}

export interface RuntimeCollaborationParticipant {
  participantId: string;
  sessionId: string;
  joinedAt: string;
  displayName?: string;
  color?: string;
  capabilities?: string[];
  authSubject?: RuntimeCollaborationAuthSubject;
}

export interface RuntimeCollaborationCanvasPosition {
  x: number;
  y: number;
}

export type RuntimeCollaborationChange =
  | {
      op: "node.add";
      changeId: string;
      node: GraphNodeV01;
      view?: RuntimeCollaborationCanvasPosition;
    }
  | {
      op: "node.move";
      changeId: string;
      nodeId: string;
      from?: RuntimeCollaborationCanvasPosition;
      to: RuntimeCollaborationCanvasPosition;
    }
  | {
      op: "node.delete";
      changeId: string;
      nodeId: string;
      tombstoneId?: string;
    }
  | {
      op: "edge.connect";
      changeId: string;
      edge: EdgeSpecV01;
    }
  | {
      op: "edge.disconnect";
      changeId: string;
      edgeId: string;
    };

export interface RuntimeCollaborationChangeSetPayload {
  kind: "changeSet";
  target: GraphTargetRef;
  changes: RuntimeCollaborationChange[];
  undoGroupId?: string;
  description?: string;
}

export interface RuntimeCollaborationPasteGraphFragmentPayload {
  kind: "pasteGraphFragment";
  request: PasteGraphFragmentRequest;
  undoGroupId?: string;
  description?: string;
}

export type RuntimeCollaborationUndoRedoAction = "undo" | "redo";

export interface RuntimeCollaborationUndoScope {
  kind: "participant";
  participantId: string;
}

export interface RuntimeCollaborationUndoRedoPayload {
  kind: "undoRedo";
  action: RuntimeCollaborationUndoRedoAction;
  scope: RuntimeCollaborationUndoScope;
  subjectOperationId?: string;
  undoGroupId?: string;
  maxOperations?: number;
}

export type RuntimeCollaborationOperationPayload =
  | RuntimeCollaborationChangeSetPayload
  | RuntimeCollaborationPasteGraphFragmentPayload
  | RuntimeCollaborationUndoRedoPayload;

export interface RuntimeCollaborationOperationEnvelope {
  schema: "skenion.runtime.collaboration.operation";
  schemaVersion: "0.1.0";
  operationId: string;
  sessionId: string;
  participantId: string;
  idempotencyKey: string;
  causal: RuntimeCollaborationCausalMetadata;
  payload: RuntimeCollaborationOperationPayload;
  authSubject?: RuntimeCollaborationAuthSubject;
  correlationId?: string;
  submittedAt: string;
}

export interface RuntimeCollaborationOperationBatch {
  schema: "skenion.runtime.collaboration.operation-batch";
  schemaVersion: "0.1.0";
  sessionId: string;
  operations: RuntimeCollaborationOperationEnvelope[];
  submittedAt?: string;
}

export type RuntimeCollaborationOperationDiagnosticSeverity = "error" | "warning" | "info";

export type RuntimeCollaborationOperationDiagnosticCode =
  | "base-revision-mismatch"
  | "causality-gap"
  | "duplicate-idempotency-key"
  | "idempotent-replay"
  | "invalid-operation"
  | "operation-rebased"
  | "participant-expired"
  | "participant-mismatch"
  | "presence-expired"
  | "selection-expired"
  | "unsupported-operation";

export interface RuntimeCollaborationOperationDiagnostic {
  severity: RuntimeCollaborationOperationDiagnosticSeverity;
  code: RuntimeCollaborationOperationDiagnosticCode;
  message: string;
  path?: string;
  participantId?: string;
  operationId?: string;
  idempotencyKey?: string;
  expectedRevision?: string;
  actualRevision?: string;
  expectedSequence?: number;
  actualSequence?: number;
}

export interface RuntimeCollaborationServerClock {
  revision: string;
  sequence: number;
  vector: Record<string, number>;
}

export interface RuntimeCollaborationAck {
  sequence: number;
  revision: string;
  serverClock: RuntimeCollaborationServerClock;
  appliedAt: string;
}

export type RuntimeCollaborationNackReason =
  | "base-revision-mismatch"
  | "causality-gap"
  | "duplicate-idempotency-key"
  | "invalid-operation"
  | "participant-expired"
  | "unsupported-operation";

export interface RuntimeCollaborationNack {
  reason: RuntimeCollaborationNackReason;
  retryable?: boolean;
  diagnostics?: RuntimeCollaborationOperationDiagnostic[];
}

export interface RuntimeCollaborationConflict {
  code: string;
  message: string;
  changeIds?: string[];
  nodeIds?: string[];
  edgeIds?: string[];
}

export type RuntimeCollaborationRebaseStrategy =
  | "ot-transform"
  | "crdt-merge"
  | "server-reject";

export interface RuntimeCollaborationRebase {
  from: RuntimeCollaborationCausalMetadata;
  to: RuntimeCollaborationCausalMetadata;
  strategy: RuntimeCollaborationRebaseStrategy;
  transformedPayload?: RuntimeCollaborationOperationPayload;
  conflicts: RuntimeCollaborationConflict[];
}

export type RuntimeCollaborationOperationStatus =
  | "accepted"
  | "duplicate"
  | "rejected"
  | "rebased";

export interface RuntimeCollaborationOperationResult {
  schema: "skenion.runtime.collaboration.operation-result";
  schemaVersion: "0.1.0";
  sessionId: string;
  operationId: string;
  participantId: string;
  idempotencyKey: string;
  status: RuntimeCollaborationOperationStatus;
  causal: RuntimeCollaborationCausalMetadata;
  ack?: RuntimeCollaborationAck;
  nack?: RuntimeCollaborationNack;
  rebase?: RuntimeCollaborationRebase;
  diagnostics: RuntimeCollaborationOperationDiagnostic[];
  createdAt: string;
}

export interface RuntimeCollaborationOperationBatchResult {
  schema: "skenion.runtime.collaboration.operation-batch-result";
  schemaVersion: "0.1.0";
  sessionId: string;
  results: RuntimeCollaborationOperationResult[];
  diagnostics: RuntimeCollaborationOperationDiagnostic[];
  createdAt: string;
}

export type RuntimeCollaborationPresenceState =
  | "joined"
  | "active"
  | "idle"
  | "away"
  | "left"
  | "expired";

export interface RuntimeCollaborationPresence {
  state: RuntimeCollaborationPresenceState;
  displayName?: string;
  color?: string;
  statusText?: string;
  capabilities?: string[];
  connectionId?: string;
  clientWindowId?: string;
}

export interface RuntimeCollaborationPresenceEnvelope {
  schema: "skenion.runtime.collaboration.presence";
  schemaVersion: "0.1.0";
  sessionId: string;
  participantId: string;
  presence: RuntimeCollaborationPresence;
  authSubject?: RuntimeCollaborationAuthSubject;
  updatedAt: string;
  expiresAt: string;
}

export interface RuntimeCollaborationPortEndpoint {
  nodeId: string;
  portId: string;
}

export interface RuntimeCollaborationTextPosition {
  nodeId: string;
  field: string;
  offset: number;
}

export type RuntimeCollaborationSelectionRange =
  | { kind: "nodes"; nodeIds: string[] }
  | { kind: "edges"; edgeIds: string[] }
  | { kind: "ports"; endpoints: RuntimeCollaborationPortEndpoint[] }
  | {
      kind: "text";
      anchor: RuntimeCollaborationTextPosition;
      focus: RuntimeCollaborationTextPosition;
    };

export interface RuntimeCollaborationSelection {
  ranges: RuntimeCollaborationSelectionRange[];
  activeRangeIndex?: number;
}

export type RuntimeCollaborationCursor =
  | { kind: "canvas"; x: number; y: number; clientWindowId?: string }
  | { kind: "node"; nodeId: string; portId?: string; clientWindowId?: string };

export interface RuntimeCollaborationSelectionEnvelope {
  schema: "skenion.runtime.collaboration.selection";
  schemaVersion: "0.1.0";
  sessionId: string;
  participantId: string;
  target: GraphTargetRef;
  selection: RuntimeCollaborationSelection;
  cursor?: RuntimeCollaborationCursor;
  updatedAt: string;
  expiresAt: string;
}

export type RuntimeCollaborationEventPayload =
  | { kind: "operationResult"; result: RuntimeCollaborationOperationResult }
  | { kind: "presence"; presence: RuntimeCollaborationPresenceEnvelope }
  | { kind: "selection"; selection: RuntimeCollaborationSelectionEnvelope };

export type RuntimeCollaborationEventKind =
  | "operation-result"
  | "presence"
  | "selection";

export interface RuntimeCollaborationEventEnvelope {
  schema: "skenion.runtime.collaboration.event";
  schemaVersion: "0.1.0";
  eventId: string;
  sessionId: string;
  sequence: number;
  causal: RuntimeCollaborationCausalMetadata;
  kind: RuntimeCollaborationEventKind;
  payload: RuntimeCollaborationEventPayload;
  replay: RuntimeEventReplayMetadata;
  createdAt: string;
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
  source: PackageSourceV01;
  root: PackageRootV01;
  trust: PackageTrustV01;
  contractsLine: string;
  contractsRange: string;
  manifestPath: string;
  manifestChecksum: PackageChecksumV01;
  evidenceRefs?: string[];
}

export interface ProjectResourceLockEntryV01 {
  id: string;
  lockEntryId: string;
  resourceId: string;
  path: string;
  checksum: PackageChecksumV01;
  evidenceRefs?: string[];
}

export interface ProviderRefV01 {
  id: string;
  kind: ProviderRefKindV01;
  packageId: string;
  providedId: string;
  lockEntryId: string;
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
  providerRefs?: ProviderRefV01[];
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
  | "value"
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
export type ShaderUniformDataKindV01 = "number.float" | "number.int" | "number.uint" | "boolean" | "color";

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

export type ControlAtomV01 =
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

export interface ControlMessageV01 {
  selector: string;
  atoms: ControlAtomV01[];
}

export type ObjectTextAtomV01 =
  | { type: "float"; value: number; representation?: string }
  | { type: "int"; value: number; representation?: string }
  | { type: "uint"; value: number; representation?: string }
  | { type: "bool"; value: boolean }
  | { type: "symbol"; value: string }
  | { type: "string"; value: string };

export interface ObjectTextPortV01 {
  id: string;
  direction: PortDirection;
  type: string;
  rate?: PortRateV01;
  activation?: "trigger" | "latched" | "passive";
  defaultValue?: unknown;
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
  classSymbol: string;
  creationArgs: ObjectTextAtomV01[];
  resolvedKind: string | null;
  resolvedKindVersion: string | null;
  params: Record<string, unknown>;
  instancePorts: ObjectTextPortV01[];
  displayText: string;
  diagnostics: ObjectTextDiagnosticV01[];
}

export type ReleaseTrainTargetV01 =
  | "aarch64-apple-darwin"
  | "x86_64-apple-darwin"
  | "x86_64-pc-windows-msvc"
  | "aarch64-pc-windows-msvc"
  | "x86_64-unknown-linux-gnu"
  | "aarch64-unknown-linux-gnu";

export type ReleaseTrainSupportTierV01 = "release-blocking" | "preview";
export type ReleaseTrainArtifactKindV01 =
  | "runtime-binary"
  | "studio-desktop-package"
  | "studio-runtime-sidecar"
  | "studio-web-bundle";
export type ReleaseTrainTargetArtifactKindV01 = Exclude<ReleaseTrainArtifactKindV01, "studio-web-bundle">;
export type ReleaseTrainPackageEcosystemV01 = "npm" | "crates.io";
export type ReleaseTrainChecksumAlgorithmV01 = "sha256";
export type ReleaseTrainGateStatusV01 = "pending" | "passed" | "failed" | "waived";

export interface ReleaseTrainRegistryPackageV01 {
  ecosystem: ReleaseTrainPackageEcosystemV01;
  name: string;
  version: string;
  url?: string | null;
}

export interface ReleaseTrainChecksumV01 {
  algorithm: ReleaseTrainChecksumAlgorithmV01;
  value: string | null;
}

export interface ReleaseTrainGithubReleaseAssetSourceV01 {
  kind: "github-release-asset";
  repository: string;
  tag: string;
  "asset-name": string;
  url: string | null;
}

export interface ReleaseTrainUrlSourceV01 {
  kind: "url";
  url: string;
}

export type ReleaseTrainArtifactSourceV01 =
  | ReleaseTrainGithubReleaseAssetSourceV01
  | ReleaseTrainUrlSourceV01;

export interface ReleaseTrainArtifactV01 {
  id: string;
  target: ReleaseTrainTargetV01;
  "support-tier": ReleaseTrainSupportTierV01;
  kind: ReleaseTrainTargetArtifactKindV01;
  name: string;
  version: string;
  source: ReleaseTrainArtifactSourceV01;
  checksum: ReleaseTrainChecksumV01;
  "size-bytes": number | null;
}

export type ReleaseTrainTargetArtifactMapV01 = Record<ReleaseTrainTargetV01, ReleaseTrainArtifactV01>;

export interface ReleaseTrainStudioWebBundleArtifactV01 {
  id: string;
  kind: "studio-web-bundle";
  name: string;
  version: string;
  source: ReleaseTrainArtifactSourceV01;
  checksum: ReleaseTrainChecksumV01;
  "size-bytes": number | null;
}

export type ReleaseTrainReleaseArtifactV01 =
  | ReleaseTrainArtifactV01
  | ReleaseTrainStudioWebBundleArtifactV01;

export interface ReleaseTrainProtocolBaselinesV01 {
  graph: "0.1";
  project: "0.1";
  node: "0.1";
  extension: "0.1";
  "runtime-http": "v0";
  "runtime-collaboration": "v0";
}

export type ReleaseTrainConnectionProfileV01 = "local-managed" | "local-shared" | "remote";

export interface ReleaseTrainRuntimeCapabilitySetV01 {
  "session-addressing": true;
  "event-replay": true;
  "multi-window": true;
  "connection-profiles": ReleaseTrainConnectionProfileV01[];
  collaboration: "server-authoritative-ot";
  "operation-log": true;
  "io-discovery": "raw-descriptor";
  "auth-policy": "deferred";
}

export interface ReleaseTrainStudioCapabilitySetV01 {
  "graph-editor": true;
  "patch-library": true;
  subpatches: true;
  "living-help": true;
  "graph-clipboard": true;
  "desktop-shell": "tauri";
  "connection-profiles": ReleaseTrainConnectionProfileV01[];
}

export interface ReleaseTrainMarketplaceCapabilitySetV01 {
  "package-discovery": true;
  "package-install": true;
  "package-update": true;
  "extension-packages": true;
}

export interface ReleaseTrainManualCapabilitySetV01 {
  "versioned-paths": true;
  "pages-deployment": true;
  "latest-promotion-requires-matrix": true;
  "patch-releases-use-major-minor-path": true;
}

export interface ReleaseTrainCapabilitySetV01 {
  "protocol-surfaces": ReleaseTrainProtocolBaselinesV01;
  runtime: ReleaseTrainRuntimeCapabilitySetV01;
  studio: ReleaseTrainStudioCapabilitySetV01;
  marketplace: ReleaseTrainMarketplaceCapabilitySetV01;
  manual: ReleaseTrainManualCapabilitySetV01;
}

export interface ReleaseTrainContractsComponentV01 {
  npm: ReleaseTrainRegistryPackageV01;
  crate: ReleaseTrainRegistryPackageV01;
}

export interface ReleaseTrainRuntimeComponentV01 {
  binaries: ReleaseTrainTargetArtifactMapV01;
}

export interface ReleaseTrainSdkComponentV01 {
  npm: ReleaseTrainRegistryPackageV01;
}

export interface ReleaseTrainStudioComponentV01 {
  "web-bundle": ReleaseTrainStudioWebBundleArtifactV01;
  "desktop-packages": ReleaseTrainTargetArtifactMapV01;
  "runtime-sidecars": ReleaseTrainTargetArtifactMapV01;
}

export interface ReleaseTrainExamplesComponentV01 {
  repository: string;
  version: string;
  tag: string;
  commit?: string;
}

export interface ReleaseTrainManualComponentV01 {
  version: string;
  path: string;
  "pages-url": string;
}

export interface ReleaseTrainDocsComponentV01 {
  manual: ReleaseTrainManualComponentV01;
}

export interface ReleaseTrainComponentsV01 {
  contracts: ReleaseTrainContractsComponentV01;
  runtime: ReleaseTrainRuntimeComponentV01;
  sdk: ReleaseTrainSdkComponentV01;
  studio: ReleaseTrainStudioComponentV01;
  examples: ReleaseTrainExamplesComponentV01;
  docs: ReleaseTrainDocsComponentV01;
}

export interface ReleaseTrainRegistryPackageGateV01 {
  id: string;
  status: ReleaseTrainGateStatusV01;
  required: boolean;
  package: ReleaseTrainRegistryPackageV01;
  "evidence-url"?: string;
}

export interface ReleaseTrainRegistryPackageGatesV01 {
  "contracts-npm": ReleaseTrainRegistryPackageGateV01;
  "contracts-crate": ReleaseTrainRegistryPackageGateV01;
  "sdk-npm": ReleaseTrainRegistryPackageGateV01;
}

export interface ReleaseTrainArtifactCollectionGateV01 {
  id: string;
  status: ReleaseTrainGateStatusV01;
  required: boolean;
  repository: string;
  tag: string;
  "artifact-ids": string[];
  "evidence-url"?: string;
}

export interface ReleaseTrainGithubReleaseAssetGatesV01 {
  runtime: ReleaseTrainArtifactCollectionGateV01;
  studio: ReleaseTrainArtifactCollectionGateV01;
}

export interface ReleaseTrainChecksumGateV01 {
  id: string;
  status: ReleaseTrainGateStatusV01;
  required: boolean;
  "artifact-ids": string[];
  "expected-checksums"?: Record<string, ReleaseTrainChecksumV01>;
  "evidence-url"?: string;
}

export interface ReleaseTrainRuntimeSmokeGateV01 {
  id: string;
  status: ReleaseTrainGateStatusV01;
  required: boolean;
  target: ReleaseTrainTargetV01;
  "artifact-id": string;
  "evidence-url"?: string;
}

export type ReleaseTrainRuntimeSmokeGateMapV01 = Record<ReleaseTrainTargetV01, ReleaseTrainRuntimeSmokeGateV01>;

export interface ReleaseTrainStudioPackageSmokeGateV01 {
  id: string;
  status: ReleaseTrainGateStatusV01;
  required: boolean;
  target: ReleaseTrainTargetV01;
  "desktop-package-artifact-id": string;
  "runtime-sidecar-artifact-id": string;
  "evidence-url"?: string;
}

export type ReleaseTrainStudioPackageSmokeGateMapV01 = Record<ReleaseTrainTargetV01, ReleaseTrainStudioPackageSmokeGateV01>;

export interface ReleaseTrainExamplesConformanceGateV01 {
  id: string;
  status: ReleaseTrainGateStatusV01;
  required: boolean;
  repository: string;
  ref: string;
  version: string;
  "evidence-url"?: string;
}

export interface ReleaseTrainDocsPagesDeploymentGateV01 {
  id: string;
  status: ReleaseTrainGateStatusV01;
  required: boolean;
  "manual-version": string;
  "manual-path": string;
  "pages-url": string;
  "evidence-url"?: string;
}

export interface ReleaseTrainGatesV01 {
  "registry-packages": ReleaseTrainRegistryPackageGatesV01;
  "github-release-assets": ReleaseTrainGithubReleaseAssetGatesV01;
  "checksum-verification": ReleaseTrainChecksumGateV01;
  "runtime-smoke": ReleaseTrainRuntimeSmokeGateMapV01;
  "studio-package-smoke": ReleaseTrainStudioPackageSmokeGateMapV01;
  "examples-conformance": ReleaseTrainExamplesConformanceGateV01;
  "docs-pages-deployment": ReleaseTrainDocsPagesDeploymentGateV01;
}

export interface ReleaseTrainManifestV01 {
  schema: "skenion.release-train";
  "schema-version": "0.1.0";
  "train-id": string;
  "train-version": string;
  "protocol-baselines": ReleaseTrainProtocolBaselinesV01;
  "capability-set": ReleaseTrainCapabilitySetV01;
  components: ReleaseTrainComponentsV01;
  "release-gates": ReleaseTrainGatesV01;
}

export type CompatibilityMatrixTargetV01 = ReleaseTrainTargetV01;
export type CompatibilityMatrixArtifactKindV01 = ReleaseTrainArtifactKindV01;
export type CompatibilityMatrixPackageEcosystemV01 = ReleaseTrainPackageEcosystemV01;
export type CompatibilityMatrixChecksumAlgorithmV01 = ReleaseTrainChecksumAlgorithmV01;
export type CompatibilityMatrixPromotionStateV01 = "draft" | "candidate" | "promoted" | "rejected";
export type CompatibilityMatrixConformanceStatusV01 = "pending" | "passed" | "failed";

export interface CompatibilityMatrixChecksumV01 {
  algorithm: CompatibilityMatrixChecksumAlgorithmV01;
  value: string | null;
}

export interface CompatibilityMatrixGithubReleaseAssetSourceV01 {
  kind: "github-release-asset";
  repository: string;
  tag: string;
  "asset-name": string;
  url?: string | null;
}

export interface CompatibilityMatrixArtifactV01 {
  id: string;
  target: CompatibilityMatrixTargetV01;
  kind: CompatibilityMatrixArtifactKindV01;
  name: string;
  version: string;
  source: CompatibilityMatrixGithubReleaseAssetSourceV01;
  checksum: CompatibilityMatrixChecksumV01;
  "size-bytes"?: number | null;
}

export type CompatibilityMatrixTargetArtifactMapV01 = Record<
  CompatibilityMatrixTargetV01,
  CompatibilityMatrixArtifactV01
>;

export interface CompatibilityMatrixRegistryPackageV01 {
  ecosystem: CompatibilityMatrixPackageEcosystemV01;
  name: string;
  version: string;
  tag: string;
  commit: string;
  url?: string | null;
}

export type CompatibilityMatrixProtocolBaselinesV01 = ReleaseTrainProtocolBaselinesV01;

export interface CompatibilityMatrixCapabilitySetV01 {
  runtime: string[];
  studio: string[];
  marketplace: string[];
  docs: string[];
}

export interface CompatibilityMatrixContractsComponentV01 {
  npm: CompatibilityMatrixRegistryPackageV01;
  crate: CompatibilityMatrixRegistryPackageV01;
}

export interface CompatibilityMatrixRuntimeComponentV01 {
  version: string;
  assets: CompatibilityMatrixTargetArtifactMapV01;
}

export interface CompatibilityMatrixSdkComponentV01 {
  npm: CompatibilityMatrixRegistryPackageV01;
  "supported-contracts-range": string;
}

export interface CompatibilityMatrixStudioComponentV01 {
  version: string;
  "web-assets": CompatibilityMatrixArtifactV01[];
  "desktop-assets": CompatibilityMatrixTargetArtifactMapV01;
  "runtime-sidecars": CompatibilityMatrixTargetArtifactMapV01;
}

export interface CompatibilityMatrixExamplesComponentV01 {
  repository: string;
  ref: string;
  commit: string;
  "conformance-status": CompatibilityMatrixConformanceStatusV01;
  "evidence-url"?: string;
}

export interface CompatibilityMatrixManualComponentV01 {
  version: string;
  path: string;
  "pages-url": string;
  "pages-deployed": boolean;
  "promoted-latest": boolean;
  "evidence-url"?: string;
}

export interface CompatibilityMatrixDocsComponentV01 {
  manual: CompatibilityMatrixManualComponentV01;
}

export interface CompatibilityMatrixComponentsV01 {
  contracts: CompatibilityMatrixContractsComponentV01;
  runtime: CompatibilityMatrixRuntimeComponentV01;
  sdk: CompatibilityMatrixSdkComponentV01;
  studio: CompatibilityMatrixStudioComponentV01;
  examples: CompatibilityMatrixExamplesComponentV01;
  docs: CompatibilityMatrixDocsComponentV01;
}

export interface CompatibilityMatrixVerificationV01 {
  "expected-checksums": Record<string, CompatibilityMatrixChecksumV01>;
}

export interface CompatibilityMatrixPromotionV01 {
  state: CompatibilityMatrixPromotionStateV01;
  "promoted-at"?: string;
  "promoted-by"?: string;
  "evidence-url"?: string;
}

export interface CompatibilityMatrixV01 {
  schema: "skenion.compatibility-matrix";
  "schema-version": "0.1.0";
  "matrix-id": string;
  "contracts-line": string;
  "contracts-range": string;
  "protocol-baselines": CompatibilityMatrixProtocolBaselinesV01;
  capabilities: CompatibilityMatrixCapabilitySetV01;
  components: CompatibilityMatrixComponentsV01;
  verification: CompatibilityMatrixVerificationV01;
  promotion: CompatibilityMatrixPromotionV01;
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
