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

export type GraphPatchOperationV01 =
  | AddNodeOperationV01
  | RemoveNodeOperationV01
  | SetNodeParamsOperationV01
  | SetNodeParamOperationV01
  | AddEdgeOperationV01
  | RemoveEdgeOperationV01;

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

export interface ValidationSuccess<T> {
  ok: true;
  value: T;
}

export interface ValidationFailure {
  ok: false;
  errors: string[];
}

export type ValidationResult<T> = ValidationSuccess<T> | ValidationFailure;
