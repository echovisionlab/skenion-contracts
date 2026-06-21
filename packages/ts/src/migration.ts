import type {
  DataFlow,
  EdgeV01,
  EdgeSpecV02,
  GraphDocumentV01,
  GraphDocumentV02,
  GraphNodeV01,
  GraphNodeV02,
  PortActivation,
  PortRateV02,
  PortSpecV02,
  PortV01,
  ProjectDocumentV01,
  ProjectDocumentV02,
  TriggerModeV02
} from "./types.js";

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function v02RateForV01Flow(flow: DataFlow, dataKind: string): PortRateV02 {
  if (flow === "event") {
    return "event";
  }
  if (flow === "signal") {
    return "audio";
  }
  if (flow === "stream") {
    return "render";
  }
  if (flow === "resource" && dataKind.startsWith("gpu.")) {
    return "gpu";
  }
  if (flow === "resource") {
    return "resource";
  }
  return "control";
}

function v02TriggerModeForV01Activation(activation?: PortActivation): TriggerModeV02 | undefined {
  if (activation === "trigger") {
    return "trigger";
  }
  if (activation === "latched") {
    return "latched";
  }
  return undefined;
}

function migratePortV01ToV02(port: PortV01): PortSpecV02 {
  const nextPort: PortSpecV02 = {
    id: port.id,
    direction: port.direction,
    type: port.type.dataKind,
    rate: v02RateForV01Flow(port.type.flow, port.type.dataKind)
  };

  if (port.label !== undefined) {
    nextPort.label = port.label;
  }
  if (port.default !== undefined) {
    nextPort.defaultValue = cloneJson(port.default);
  }
  if (port.required !== undefined) {
    nextPort.required = port.required;
  }
  const triggerMode = v02TriggerModeForV01Activation(port.activation);
  if (triggerMode !== undefined) {
    nextPort.triggerMode = triggerMode;
  }

  return nextPort;
}

function migrateNodeV01ToV02(node: GraphNodeV01): GraphNodeV02 {
  return {
    id: node.id,
    kind: node.kind,
    kindVersion: node.kindVersion,
    params: cloneJson(node.params),
    ports: node.ports.map(migratePortV01ToV02)
  };
}

function slugId(value: string): string {
  return value.replace(/[^A-Za-z0-9_-]+/g, "_").replace(/^_+|_+$/g, "") || "endpoint";
}

function edgeIdV02(edge: EdgeV01, index: number, usedIds: Set<string>): string {
  const base = [
    "edge",
    slugId(edge.from.node),
    slugId(edge.from.port),
    "to",
    slugId(edge.to.node),
    slugId(edge.to.port)
  ].join("_");
  let candidate = base;
  let suffix = index + 1;
  while (usedIds.has(candidate)) {
    candidate = `${base}_${suffix}`;
    suffix += 1;
  }
  usedIds.add(candidate);
  return candidate;
}

function migrateEdgeV01ToV02(edge: EdgeV01, index: number, usedIds: Set<string>): EdgeSpecV02 {
  return {
    id: edgeIdV02(edge, index, usedIds),
    source: {
      nodeId: edge.from.node,
      portId: edge.from.port
    },
    target: {
      nodeId: edge.to.node,
      portId: edge.to.port
    }
  };
}

export function migrateGraphDocumentV01ToV02(graph: GraphDocumentV01): GraphDocumentV02 {
  const usedEdgeIds = new Set<string>();

  return {
    schema: "skenion.graph",
    schemaVersion: "0.2.0",
    id: graph.id,
    revision: graph.revision,
    nodes: graph.nodes.map(migrateNodeV01ToV02),
    edges: graph.edges.map((edge, index) => migrateEdgeV01ToV02(edge, index, usedEdgeIds))
  };
}

export function migrateProjectDocumentV01ToV02(project: ProjectDocumentV01): ProjectDocumentV02 {
  const nextProject: ProjectDocumentV02 = {
    schema: "skenion.project",
    schemaVersion: "0.2.0",
    id: project.id,
    revision: project.revision,
    graph: migrateGraphDocumentV01ToV02(project.graph),
    viewState: cloneJson(project.viewState),
    patchLibrary: []
  };

  if (project.metadata !== undefined) {
    nextProject.metadata = cloneJson(project.metadata);
  }
  if (project.tutorial !== undefined) {
    nextProject.tutorial = cloneJson(project.tutorial);
  }
  if (project.help !== undefined) {
    nextProject.help = cloneJson(project.help);
  }

  return nextProject;
}
