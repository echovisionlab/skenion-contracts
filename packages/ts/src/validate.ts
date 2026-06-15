import Ajv2020Runtime from "ajv/dist/2020.js";
import type {
  ErrorObject,
  Options,
  ValidateFunction
} from "ajv/dist/2020.js";
import {
  graphV01Schema,
  nodeDefinitionV01Schema
} from "./generated/schemas.js";
import type {
  DataTypeV01,
  GraphDocumentV01,
  NodeDefinitionManifestV01,
  PortV01,
  ValidationResult
} from "./types.js";

const allowedNodePermissions = new Set<string>();

const Ajv2020 = Ajv2020Runtime as unknown as new (opts?: Options) => {
  compile(schema: unknown): ValidateFunction;
};
const ajv = new Ajv2020({ allErrors: true });
const graphV01Validator = ajv.compile(graphV01Schema);
const nodeDefinitionV01Validator = ajv.compile(nodeDefinitionV01Schema);

function schemaErrors(errors: ErrorObject[]): string[] {
  return errors.map((error) => {
    const path = error.instancePath || "/";
    return `${path} ${error.message}`;
  });
}

function duplicateErrors(values: string[], label: string): string[] {
  const seen = new Set<string>();
  const errors: string[] = [];

  for (const value of values) {
    if (seen.has(value)) {
      errors.push(`duplicate ${label}: ${value}`);
    }
    seen.add(value);
  }

  return errors;
}

function portKey(nodeId: string, portId: string): string {
  return `${nodeId}:${portId}`;
}

function typeLabel(type: DataTypeV01): string {
  return `${type.flow}<${type.dataKind}>`;
}

function formatAccepts(targetFormat: DataTypeV01["format"], sourceFormat: DataTypeV01["format"]): boolean {
  if (targetFormat === undefined || sourceFormat === undefined) {
    return true;
  }

  const targetFormats = Array.isArray(targetFormat) ? targetFormat : [targetFormat];
  const sourceFormats = Array.isArray(sourceFormat) ? sourceFormat : [sourceFormat];
  return sourceFormats.every((format) => targetFormats.includes(format));
}

function compatibleTypes(sourceType: DataTypeV01, targetType: DataTypeV01): boolean {
  return (
    sourceType.flow === targetType.flow &&
    sourceType.dataKind === targetType.dataKind &&
    formatAccepts(targetType.format, sourceType.format)
  );
}

function validatePorts(ownerId: string, ports: PortV01[]): string[] {
  const errors = duplicateErrors(
    ports.map((port) => port.id),
    `port id on ${ownerId}`
  );

  for (const port of ports) {
    if (port.direction !== "input" && "activation" in port) {
      errors.push(`output port ${ownerId}.${port.id} must not declare activation`);
    }
  }

  return errors;
}

function validateGraphV01Semantics(graph: GraphDocumentV01): string[] {
  const errors = duplicateErrors(
    graph.nodes.map((node) => node.id),
    "node id"
  );
  const ports = new Map<string, PortV01>();

  for (const node of graph.nodes) {
    errors.push(...validatePorts(node.id, node.ports));
    for (const port of node.ports) {
      ports.set(portKey(node.id, port.id), port);
    }
  }

  for (const edge of graph.edges) {
    const fromKey = portKey(edge.from.node, edge.from.port);
    const toKey = portKey(edge.to.node, edge.to.port);
    const from = ports.get(fromKey);
    const to = ports.get(toKey);

    if (!from) {
      errors.push(`edge references missing source port ${fromKey}`);
    }
    if (!to) {
      errors.push(`edge references missing target port ${toKey}`);
    }
    if (!from || !to) {
      continue;
    }
    if (from.direction !== "output") {
      errors.push(`edge source ${fromKey} is not an output port`);
    }
    if (to.direction !== "input") {
      errors.push(`edge target ${toKey} is not an input port`);
    }
    if (!compatibleTypes(from.type, to.type)) {
      errors.push(`incompatible edge ${fromKey} ${typeLabel(from.type)} -> ${toKey} ${typeLabel(to.type)}`);
    }
  }

  return errors;
}

function validateNodeDefinitionV01Semantics(definition: NodeDefinitionManifestV01): string[] {
  const errors = validatePorts(definition.id, definition.ports);

  for (const permission of definition.permissions) {
    if (!allowedNodePermissions.has(permission)) {
      errors.push(`unsupported permission: ${permission}`);
    }
  }

  return errors;
}

export function validateGraphDocument(document: unknown): ValidationResult<GraphDocumentV01> {
  if (!graphV01Validator(document)) {
    return { ok: false, errors: schemaErrors(graphV01Validator.errors as ErrorObject[]) };
  }

  const graph = document as GraphDocumentV01;
  const errors = validateGraphV01Semantics(graph);
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value: graph };
}

export function validateNodeDefinition(
  document: unknown
): ValidationResult<NodeDefinitionManifestV01> {
  if (!nodeDefinitionV01Validator(document)) {
    return { ok: false, errors: schemaErrors(nodeDefinitionV01Validator.errors as ErrorObject[]) };
  }

  const definition = document as NodeDefinitionManifestV01;
  const errors = validateNodeDefinitionV01Semantics(definition);
  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, value: definition };
}
