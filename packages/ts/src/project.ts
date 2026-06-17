import type { GraphDocumentV01, ViewStateV01 } from "./types.js";

export function createDefaultViewStateForGraph(graph: GraphDocumentV01): ViewStateV01 {
  const nodes = Object.fromEntries(
    graph.nodes.map((node, index) => [
      node.id,
      {
        x: 96 + (index % 4) * 280,
        y: 96 + Math.floor(index / 4) * 180
      }
    ])
  );

  return {
    schema: "skenion.view-state",
    schemaVersion: "0.1.0",
    canvas: {
      nodes,
      viewport: {
        x: 0,
        y: 0,
        zoom: 1
      }
    }
  };
}
