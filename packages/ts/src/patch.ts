import type {
  EdgeV01,
  GraphDocumentV01,
  GraphNodeV01,
  GraphPatchV01,
  ApplyGraphPatchResult
} from "./types.js";
import { validateGraphDocument, validateGraphPatch } from "./validate.js";

export interface ApplyGraphPatchOptions {
  nextRevision?: string;
}

function cloneGraph(graph: GraphDocumentV01): GraphDocumentV01 {
  return JSON.parse(JSON.stringify(graph)) as GraphDocumentV01;
}

function edgeKey(edge: EdgeV01): string {
  return `${edge.from.node}:${edge.from.port}->${edge.to.node}:${edge.to.port}`;
}

function findNode(graph: GraphDocumentV01, nodeId: string): GraphNodeV01 | undefined {
  return graph.nodes.find((node) => node.id === nodeId);
}

function nextRevision(current: string, explicit?: string): string {
  if (explicit) {
    return explicit;
  }

  if (/^\d+$/.test(current)) {
    return String(Number(current) + 1);
  }

  return `${current}+1`;
}

export function applyGraphPatch(
  graph: GraphDocumentV01,
  patch: GraphPatchV01,
  options: ApplyGraphPatchOptions = {}
): ApplyGraphPatchResult {
  const patchValidation = validateGraphPatch(patch);
  if (!patchValidation.ok) {
    return { ok: false, errors: patchValidation.errors };
  }

  if (graph.revision !== patch.baseRevision) {
    return {
      ok: false,
      errors: [
        `patch baseRevision ${patch.baseRevision} does not match graph revision ${graph.revision}`
      ]
    };
  }

  const nextGraph = cloneGraph(graph);

  for (const operation of patch.ops) {
    if (operation.op === "addNode") {
      if (findNode(nextGraph, operation.node.id)) {
        return { ok: false, errors: [`node ${operation.node.id} already exists`] };
      }
      nextGraph.nodes.push(JSON.parse(JSON.stringify(operation.node)) as GraphNodeV01);
    } else if (operation.op === "removeNode") {
      const before = nextGraph.nodes.length;
      nextGraph.nodes = nextGraph.nodes.filter((node) => node.id !== operation.nodeId);
      if (nextGraph.nodes.length === before) {
        return { ok: false, errors: [`node ${operation.nodeId} does not exist`] };
      }
      nextGraph.edges = nextGraph.edges.filter(
        (edge) => edge.from.node !== operation.nodeId && edge.to.node !== operation.nodeId
      );
    } else if (operation.op === "setNodeParams") {
      const node = findNode(nextGraph, operation.nodeId);
      if (!node) {
        return { ok: false, errors: [`node ${operation.nodeId} does not exist`] };
      }
      node.params = JSON.parse(JSON.stringify(operation.params)) as Record<string, unknown>;
    } else if (operation.op === "setNodeParam") {
      const node = findNode(nextGraph, operation.nodeId);
      if (!node) {
        return { ok: false, errors: [`node ${operation.nodeId} does not exist`] };
      }
      node.params[operation.key] = JSON.parse(JSON.stringify(operation.value)) as unknown;
    } else if (operation.op === "addEdge") {
      const key = edgeKey(operation.edge);
      if (nextGraph.edges.some((edge) => edgeKey(edge) === key)) {
        return { ok: false, errors: [`edge ${key} already exists`] };
      }
      nextGraph.edges.push(JSON.parse(JSON.stringify(operation.edge)) as EdgeV01);
    } else if (operation.op === "removeEdge") {
      const key = edgeKey(operation.edge);
      const before = nextGraph.edges.length;
      nextGraph.edges = nextGraph.edges.filter((edge) => edgeKey(edge) !== key);
      if (nextGraph.edges.length === before) {
        return { ok: false, errors: [`edge ${key} does not exist`] };
      }
    }
  }

  nextGraph.revision = nextRevision(graph.revision, options.nextRevision);

  const graphValidation = validateGraphDocument(nextGraph);
  if (!graphValidation.ok) {
    return { ok: false, errors: graphValidation.errors };
  }

  return { ok: true, graph: nextGraph };
}
