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

export interface RuntimeDiagnosticV01 {
  severity: RuntimeDiagnosticSeverityV01;
  message: string;
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

export interface RuntimeProjectSnapshot {
  graph: GraphDocumentV01;
  viewState: ViewStateV01;
  nodes: NodeDefinitionManifestV01[];
}

export interface RuntimeProjectRequest {
  graph: GraphDocumentV01;
  nodes: NodeDefinitionManifestV01[];
  viewState?: ViewStateV01;
}

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
  plan: RuntimePlan | null;
}

export interface RuntimeSessionResponse {
  ok: boolean;
  snapshot: RuntimeSessionSnapshot;
  diagnostics: RuntimeDiagnosticV01[];
  report: RuntimeDummyExecutionReport | null;
}

export interface RuntimeMutationRequest {
  graphPatch?: GraphPatchV01;
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

export type RuntimePatchResponse = RuntimeMutationResponse;

export type RuntimeSessionEventKind = "snapshot" | "load" | "clear" | "mutate" | "undo" | "redo";

export interface RuntimeSessionEvent {
  schema: "skenion.runtime.session.event";
  schemaVersion: "0.1.0";
  id: string;
  sessionId: string;
  sequence: number;
  kind: RuntimeSessionEventKind;
  snapshot: RuntimeSessionSnapshot;
  history: RuntimeHistory;
  mutation?: RuntimeHistoryEntry;
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
  transportKinds: RuntimeIoTransportKind[];
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

export interface ExtensionTestDescriptorV01 {
  id: string;
  kind: ExtensionTestKindV01;
  target: string;
  fixturePath?: string;
  expectedPath?: string;
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

export interface GraphNodeV01 {
  id: string;
  kind: string;
  kindVersion: string;
  params: Record<string, unknown>;
  ports: PortV01[];
}

export interface EdgeV01 {
  from: {
    node: string;
    port: string;
  };
  to: {
    node: string;
    port: string;
  };
}

export interface GraphDocumentV01 {
  schema: "skenion.graph";
  schemaVersion: "0.1.0";
  id: string;
  revision: string;
  nodes: GraphNodeV01[];
  edges: EdgeV01[];
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

export interface ProjectDocumentV01 {
  schema: "skenion.project";
  schemaVersion: "0.1.0";
  id: string;
  revision: string;
  metadata?: {
    title?: string;
    description?: string;
    createdAt?: string;
    updatedAt?: string;
    [key: string]: unknown;
  };
  graph: GraphDocumentV01;
  viewState: ViewStateV01;
  tutorial?: Record<string, unknown>;
  help?: Record<string, unknown>;
}

export type PortRateV02 = "event" | "control" | "audio" | "render" | "gpu" | "resource" | "io";
export type MergePolicyV02 = "forbid" | "ordered-events" | "mix" | "array" | "latest" | "first" | "custom";
export type FanOutPolicyV02 = "allow" | "forbid" | "copy" | "share";
export type TriggerModeV02 = "passive" | "trigger" | "latched";
export type FeedbackBoundaryV02 =
  | "same-turn"
  | "next-tick"
  | "control-frame"
  | "audio-sample"
  | "audio-block"
  | "render-frame"
  | "gpu-pingpong"
  | "manual";
export type FeedbackBufferModeV02 = "latest" | "queue" | "ring" | "pingpong";
export type CycleValidationV02 =
  | "no-cycle"
  | "valid-feedback"
  | "risky-feedback"
  | "ambiguous-algebraic-loop"
  | "invalid-cycle";

export interface PortSpecV02 {
  id: string;
  direction: PortDirection;
  type: string;
  label?: string;
  rate?: PortRateV02;
  accepts?: string[];
  minConnections?: number;
  maxConnections?: number | null;
  mergePolicy?: MergePolicyV02;
  fanOutPolicy?: FanOutPolicyV02;
  triggerMode?: TriggerModeV02;
  defaultValue?: unknown;
  latch?: boolean;
  required?: boolean;
  styleKey?: string;
  group?: string;
  description?: string;
}

export interface PortGroupSpecV02 {
  id: string;
  direction: PortDirection;
  type: string;
  minPorts: number;
  label?: string;
  rate?: PortRateV02;
  maxPorts?: number;
  ordered?: boolean;
  portIdPattern?: string;
  createLabel?: string;
  defaultPortSpec?: PortSpecV02;
}

export interface FeedbackPolicyV02 {
  enabled: boolean;
  boundary: FeedbackBoundaryV02;
  initialValue?: unknown;
  recursionLimit?: number;
  maxEventsPerTick?: number;
  maxIterationsPerFrame?: number;
  bufferMode?: FeedbackBufferModeV02;
  intentional?: boolean;
  label?: string;
}

export interface EdgeEndpointV02 {
  nodeId: string;
  portId: string;
}

export interface EdgeSpecV02 {
  id: string;
  source: EdgeEndpointV02;
  target: EdgeEndpointV02;
  resolvedType?: string;
  order?: number;
  enabled?: boolean;
  adapter?: string;
  feedback?: FeedbackPolicyV02;
  styleOverride?: string;
  label?: string;
  description?: string;
}

export interface CableStyleV02 {
  color?: string;
  pattern?: "solid" | "dashed" | "dotted";
  width?: number;
  marker?: string;
}

export type CableStyleRegistryV02 = Record<string, CableStyleV02>;

export interface GraphNodeV02 {
  id: string;
  kind: string;
  kindVersion: string;
  params: Record<string, unknown>;
  ports: PortSpecV02[];
  portGroups?: PortGroupSpecV02[];
}

export interface GraphDocumentV02 {
  schema: "skenion.graph";
  schemaVersion: "0.2.0";
  id: string;
  revision: string;
  nodes: GraphNodeV02[];
  edges: EdgeSpecV02[];
  cableStyles?: CableStyleRegistryV02;
}

export interface GraphFragmentViewV02 {
  nodes?: Record<string, CanvasNodeViewV01>;
}

export interface GraphFragmentOmittedEdgeV02 {
  id: string;
  source: EdgeEndpointV02;
  target: EdgeEndpointV02;
  reason: "outside-fragment" | "policy-omit";
}

export interface GraphFragmentV02 {
  schema: "skenion.graph.fragment";
  schemaVersion: "0.2.0";
  id?: string;
  nodes: GraphNodeV02[];
  edges: EdgeSpecV02[];
  view?: GraphFragmentViewV02;
  omittedEdges?: GraphFragmentOmittedEdgeV02[];
  metadata?: Record<string, unknown>;
}

export type GraphFragmentOutsideEndpointPolicyV02 = "reject" | "omit";

export interface GraphFragmentValidationOptionsV02 {
  outsideEndpointPolicy?: GraphFragmentOutsideEndpointPolicyV02;
}

export interface GraphFragmentDiagnosticV02 {
  severity: "error" | "warning";
  code: string;
  message: string;
  nodes?: string[];
  edges?: string[];
}

export interface GraphFragmentValidationResultV02 {
  ok: boolean;
  diagnostics: GraphFragmentDiagnosticV02[];
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
  outsideEndpointPolicy?: GraphFragmentOutsideEndpointPolicyV02;
  idConflictPolicy?: "remap" | "reject";
  preserveRelativePositions?: boolean;
}

export interface PasteGraphFragmentRequest {
  target: GraphTargetRef;
  fragment: GraphFragmentV02;
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

export interface ProjectMetadataV02 {
  title?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface PatchDefinitionV02 {
  id: string;
  revision: string;
  metadata?: ProjectMetadataV02;
  graph: GraphDocumentV02;
  viewState?: ViewStateV01;
}

export interface PatchContractPortV02 extends PortSpecV02 {
  boundaryNodeId: string;
  boundaryPortId: string;
}

export interface PatchContractV02 {
  id: string;
  revision: string;
  metadata?: ProjectMetadataV02;
  ports: PatchContractPortV02[];
}

export interface ProjectDocumentV02 {
  schema: "skenion.project";
  schemaVersion: "0.2.0";
  id: string;
  revision: string;
  metadata?: ProjectMetadataV02;
  graph: GraphDocumentV02;
  viewState: ViewStateV01;
  patchLibrary: PatchDefinitionV02[];
  tutorial?: Record<string, unknown>;
  help?: Record<string, unknown>;
}

export interface GraphValidationDiagnosticV02 {
  severity: "error" | "warning";
  code: string;
  message: string;
  nodes?: string[];
  edges?: string[];
}

export interface GraphCycleValidationV02 {
  classification: CycleValidationV02;
  nodes: string[];
  edges: string[];
  message: string;
}

export interface GraphValidationResultV02 {
  ok: boolean;
  diagnostics: GraphValidationDiagnosticV02[];
  cycles: GraphCycleValidationV02[];
}

export interface AddNodeOperationV01 {
  op: "addNode";
  node: GraphNodeV01;
}

export interface RemoveNodeOperationV01 {
  op: "removeNode";
  nodeId: string;
}

export interface ReplaceNodeOperationV01 {
  op: "replaceNode";
  nodeId: string;
  node: GraphNodeV01;
  edgePolicy: "removeInvalidEdges";
}

export interface SetNodeParamsOperationV01 {
  op: "setNodeParams";
  nodeId: string;
  params: Record<string, unknown>;
}

export interface SetNodeParamOperationV01 {
  op: "setNodeParam";
  nodeId: string;
  key: string;
  value: unknown;
}

export interface AddEdgeOperationV01 {
  op: "addEdge";
  edge: EdgeV01;
}

export interface RemoveEdgeOperationV01 {
  op: "removeEdge";
  edge: EdgeV01;
}

export interface ReplaceNodeInterfaceOperationV01 {
  op: "replaceNodeInterface";
  nodeId: string;
  ports: PortV01[];
  edgePolicy: "removeInvalidEdges";
}

export type GraphPatchOperationV01 =
  | AddNodeOperationV01
  | RemoveNodeOperationV01
  | ReplaceNodeOperationV01
  | SetNodeParamsOperationV01
  | SetNodeParamOperationV01
  | AddEdgeOperationV01
  | RemoveEdgeOperationV01
  | ReplaceNodeInterfaceOperationV01;

export interface GraphPatchV01 {
  schema: "skenion.graph.patch";
  schemaVersion: "0.1.0";
  id: string;
  baseRevision: string;
  clientId?: string;
  createdAt?: string;
  description?: string;
  ops: GraphPatchOperationV01[];
}

export type GraphPatchEventKindV01 = "apply" | "undo" | "redo";

export interface GraphPatchEventV01 {
  schema: "skenion.graph.patch.event";
  schemaVersion: "0.1.0";
  id: string;
  sequence: number;
  kind: GraphPatchEventKindV01;
  patch: GraphPatchV01;
  inversePatch: GraphPatchV01;
  revisionBefore: string;
  revisionAfter: string;
  clientId?: string;
  description?: string;
  subjectEventId?: string;
  createdAt: string;
}

export interface GraphPatchHistoryV01 {
  schema: "skenion.graph.patch.history";
  schemaVersion: "0.1.0";
  events: GraphPatchEventV01[];
  canUndo: boolean;
  canRedo: boolean;
  undoDepth: number;
  redoDepth: number;
}

export type ApplyGraphPatchResult =
  | { ok: true; graph: GraphDocumentV01 }
  | { ok: false; errors: string[] };

export type InvertGraphPatchResult =
  | { ok: true; inversePatch: GraphPatchV01 }
  | { ok: false; errors: string[] };

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
  ports: PortV01[];
  execution: NodeExecutionV01;
  state: NodeStateV01;
  permissions: string[];
  capabilities: string[];
}

export interface NodeDefinitionManifestV02 {
  schema: "skenion.node.definition";
  schemaVersion: "0.2.0";
  id: string;
  version: string;
  displayName: string;
  category: string;
  scriptApiVersion?: string;
  bundleHash?: string;
  surface?: NodeSurfaceV01;
  ports: PortSpecV02[];
  portGroups?: PortGroupSpecV02[];
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
  rate?: PortRateV02;
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

export interface ValidationSuccess<T> {
  ok: true;
  value: T;
}

export interface ValidationFailure {
  ok: false;
  errors: string[];
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;
