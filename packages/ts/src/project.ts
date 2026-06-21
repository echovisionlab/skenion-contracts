import type {
  GraphDocumentV01,
  GraphDocumentV02,
  GraphNodeV02,
  PatchContractPortV02,
  PatchContractV02,
  PatchDefinitionV02,
  PortDirection,
  PortSpecV02,
  ProjectDocumentV02,
  ViewStateV01
} from "./types.js";

export function createDefaultViewStateForGraph(
  graph: GraphDocumentV01 | GraphDocumentV02
): ViewStateV01 {
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

function stringParam(node: GraphNodeV02, key: string): string | undefined {
  const value = node.params[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function boundaryPortId(
  node: GraphNodeV02,
  port: PortSpecV02,
  eligiblePortCount: number
): string {
  return (
    stringParam(node, "portId") ??
    stringParam(node, "externalPortId") ??
    (eligiblePortCount === 1 ? node.id : port.id)
  );
}

function boundaryPortLabel(node: GraphNodeV02, port: PortSpecV02): string | undefined {
  return port.label ?? stringParam(node, "label");
}

function deriveBoundaryPorts(
  node: GraphNodeV02,
  internalDirection: PortDirection,
  externalDirection: PortDirection
): PatchContractPortV02[] {
  const ports = node.ports.filter((port) => port.direction === internalDirection);

  return ports.map((port) => ({
    ...port,
    id: boundaryPortId(node, port, ports.length),
    direction: externalDirection,
    label: boundaryPortLabel(node, port),
    boundaryNodeId: node.id,
    boundaryPortId: port.id
  }));
}

export function derivePatchContractV02(patch: PatchDefinitionV02): PatchContractV02 {
  const ports = patch.graph.nodes.flatMap((node): PatchContractPortV02[] => {
    if (node.kind === "core.inlet") {
      return deriveBoundaryPorts(node, "output", "input");
    }
    if (node.kind === "core.outlet") {
      return deriveBoundaryPorts(node, "input", "output");
    }
    return [];
  });

  return {
    id: patch.id,
    revision: patch.revision,
    metadata: patch.metadata,
    ports
  };
}

export function derivePatchContractsV02(project: ProjectDocumentV02): PatchContractV02[] {
  return project.patchLibrary.map((patch) => derivePatchContractV02(patch));
}
