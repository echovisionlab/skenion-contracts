import type {
  EdgeV01,
  GraphDocumentV01,
  GraphNodeV01,
  GraphPatchOperationV01,
  GraphPatchV01,
  ApplyGraphPatchResult,
  InvertGraphPatchResult
} from "./types.js";
import { validateGraphDocument, validateGraphPatch } from "./validate.js";

export interface ApplyGraphPatchOptions {
  nextRevision?: string;
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function cloneGraph(graph: GraphDocumentV01): GraphDocumentV01 {
  return cloneJson(graph);
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

export function invertGraphPatch(
  graphBefore: GraphDocumentV01,
  patch: GraphPatchV01
): InvertGraphPatchResult {
  const patchValidation = validateGraphPatch(patch);
  if (!patchValidation.ok) {
    return { ok: false, errors: patchValidation.errors };
  }

  if (graphBefore.revision !== patch.baseRevision) {
    return {
      ok: false,
      errors: [
        `patch baseRevision ${patch.baseRevision} does not match graph revision ${graphBefore.revision}`
      ]
    };
  }

  const workingGraph = cloneGraph(graphBefore);
  const inverseGroups: GraphPatchOperationV01[][] = [];

  for (const operation of patch.ops) {
    if (operation.op === "addNode") {
      if (findNode(workingGraph, operation.node.id)) {
        return { ok: false, errors: [`node ${operation.node.id} already exists`] };
      }
      inverseGroups.unshift([{ op: "removeNode", nodeId: operation.node.id }]);
      workingGraph.nodes.push(cloneJson(operation.node));
    } else if (operation.op === "removeNode") {
      const node = findNode(workingGraph, operation.nodeId);
      if (!node) {
        return { ok: false, errors: [`node ${operation.nodeId} does not exist`] };
      }
      const incidentEdges = workingGraph.edges.filter(
        (edge) => edge.from.node === operation.nodeId || edge.to.node === operation.nodeId
      );
      inverseGroups.unshift([
        { op: "addNode", node: cloneJson(node) },
        ...incidentEdges.map((edge): GraphPatchOperationV01 => ({
          op: "addEdge",
          edge: cloneJson(edge)
        }))
      ]);
      workingGraph.nodes = workingGraph.nodes.filter((candidate) => candidate.id !== operation.nodeId);
      workingGraph.edges = workingGraph.edges.filter(
        (edge) => edge.from.node !== operation.nodeId && edge.to.node !== operation.nodeId
      );
    } else if (operation.op === "setNodeParams") {
      const node = findNode(workingGraph, operation.nodeId);
      if (!node) {
        return { ok: false, errors: [`node ${operation.nodeId} does not exist`] };
      }
      inverseGroups.unshift([
        { op: "setNodeParams", nodeId: operation.nodeId, params: cloneJson(node.params) }
      ]);
      node.params = cloneJson(operation.params);
    } else if (operation.op === "setNodeParam") {
      const node = findNode(workingGraph, operation.nodeId);
      if (!node) {
        return { ok: false, errors: [`node ${operation.nodeId} does not exist`] };
      }
      inverseGroups.unshift([
        { op: "setNodeParams", nodeId: operation.nodeId, params: cloneJson(node.params) }
      ]);
      node.params[operation.key] = cloneJson(operation.value);
    } else if (operation.op === "addEdge") {
      const key = edgeKey(operation.edge);
      if (workingGraph.edges.some((edge) => edgeKey(edge) === key)) {
        return { ok: false, errors: [`edge ${key} already exists`] };
      }
      inverseGroups.unshift([{ op: "removeEdge", edge: cloneJson(operation.edge) }]);
      workingGraph.edges.push(cloneJson(operation.edge));
    } else {
      const key = edgeKey(operation.edge);
      const before = workingGraph.edges.length;
      workingGraph.edges = workingGraph.edges.filter((edge) => edgeKey(edge) !== key);
      if (workingGraph.edges.length === before) {
        return { ok: false, errors: [`edge ${key} does not exist`] };
      }
      inverseGroups.unshift([{ op: "addEdge", edge: cloneJson(operation.edge) }]);
    }
  }

  workingGraph.revision = nextRevision(graphBefore.revision);
  const graphValidation = validateGraphDocument(workingGraph);
  if (!graphValidation.ok) {
    return { ok: false, errors: graphValidation.errors };
  }

  const inversePatch: GraphPatchV01 = {
    schema: "skenion.graph.patch",
    schemaVersion: "0.1.0",
    id: `${patch.id}_inverse`,
    baseRevision: workingGraph.revision,
    ops: inverseGroups.flat()
  };
  if (patch.clientId !== undefined) {
    inversePatch.clientId = patch.clientId;
  }
  if (patch.description !== undefined) {
    inversePatch.description = `Inverse of ${patch.id}: ${patch.description}`;
  }

  return { ok: true, inversePatch };
}
