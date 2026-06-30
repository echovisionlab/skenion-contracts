import type {
  GraphDocumentV01,
  GraphNodeV01,
  PatchContractPortV01,
  PatchContractV01,
  PatchDefinitionV01,
  PortDirection,
  PortSpecV01,
  ProjectDocumentV01,
  ViewStateV01
} from "./types.js";

export function createDefaultViewStateForGraph(
  graph: GraphDocumentV01
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

function stringParam(node: GraphNodeV01, key: string): string | undefined {
  const value = node.params[key];
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function boundaryPortId(
  node: GraphNodeV01,
  port: PortSpecV01,
  eligiblePortCount: number
): string {
  return (
    stringParam(node, "portId") ??
    stringParam(node, "externalPortId") ??
    (eligiblePortCount === 1 ? node.id : port.id)
  );
}

function boundaryPortLabel(node: GraphNodeV01, port: PortSpecV01): string | undefined {
  return port.label ?? stringParam(node, "label");
}

function deriveBoundaryPorts(
  node: GraphNodeV01,
  internalDirection: PortDirection,
  externalDirection: PortDirection
): PatchContractPortV01[] {
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

function isCoreImplementation(node: GraphNodeV01, objectId: string): boolean {
  return node.implementation?.provider.kind === "core" && node.implementation.objectId === objectId;
}

export function derivePatchContractV01(patch: PatchDefinitionV01): PatchContractV01 {
  const ports = patch.graph.nodes.flatMap((node): PatchContractPortV01[] => {
    if (isCoreImplementation(node, "inlet")) {
      return deriveBoundaryPorts(node, "output", "input");
    }
    if (isCoreImplementation(node, "outlet")) {
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

export function derivePatchContractsV01(project: ProjectDocumentV01): PatchContractV01[] {
  return project.patchLibrary.map((patch) => derivePatchContractV01(patch));
}
