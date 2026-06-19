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
  | "asset.video"
  | "video.frame"
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

export interface NodeDefinitionManifestV01 {
  schema: "skenion.node.definition";
  schemaVersion: "0.1.0";
  id: string;
  version: string;
  displayName: string;
  category: string;
  scriptApiVersion?: string;
  bundleHash?: string;
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

export interface ValidationSuccess<T> {
  ok: true;
  value: T;
}

export interface ValidationFailure {
  ok: false;
  errors: string[];
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;
