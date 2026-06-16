import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";

const allowedNodePermissions = new Set();

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else {
      files.push(fullPath);
    }
  }

  return files.sort();
}

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

function fail(file, message) {
  throw new Error(`${file}: ${message}`);
}

function duplicateCheck(file, values, label) {
  const seen = new Set();
  for (const value of values) {
    if (seen.has(value)) {
      fail(file, `duplicate ${label}: ${value}`);
    }
    seen.add(value);
  }
}

function portKey(nodeId, portId) {
  return `${nodeId}:${portId}`;
}

function typeLabel(type) {
  if ("dataKind" in type) {
    return `${type.flow}<${type.dataKind}>`;
  }
  return `${type.flow}<${type.kind}>`;
}

function formatAccepts(targetFormat, sourceFormat) {
  if (targetFormat === undefined || sourceFormat === undefined) {
    return true;
  }
  const targetFormats = Array.isArray(targetFormat) ? targetFormat : [targetFormat];
  const sourceFormats = Array.isArray(sourceFormat) ? sourceFormat : [sourceFormat];
  return sourceFormats.every((format) => targetFormats.includes(format));
}

function compatibleTypes(sourceType, targetType) {
  if (sourceType.flow !== targetType.flow) {
    return false;
  }
  if (sourceType.dataKind !== targetType.dataKind) {
    return false;
  }
  if (!formatAccepts(targetType.format, sourceType.format)) {
    return false;
  }
  return true;
}

function validatePorts(file, nodeId, ports) {
  duplicateCheck(
    file,
    ports.map((port) => port.id),
    `port id on ${nodeId}`
  );

  for (const port of ports) {
    if (port.direction !== "input" && "activation" in port) {
      fail(file, `output port ${nodeId}.${port.id} must not declare activation`);
    }
  }
}

function validateGraphV01Semantics(file, graph) {
  duplicateCheck(
    file,
    graph.nodes.map((node) => node.id),
    "node id"
  );

  const ports = new Map();
  for (const node of graph.nodes) {
    validatePorts(file, node.id, node.ports);
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
      fail(file, `edge references missing source port ${fromKey}`);
    }
    if (!to) {
      fail(file, `edge references missing target port ${toKey}`);
    }
    if (from.direction !== "output") {
      fail(file, `edge source ${fromKey} is not an output port`);
    }
    if (to.direction !== "input") {
      fail(file, `edge target ${toKey} is not an input port`);
    }
    if (!compatibleTypes(from.type, to.type)) {
      fail(file, `incompatible edge ${fromKey} ${typeLabel(from.type)} -> ${toKey} ${typeLabel(to.type)}`);
    }
  }
}

function validateNodeDefinitionV01Semantics(file, definition) {
  validatePorts(file, definition.id, definition.ports);

  for (const permission of definition.permissions) {
    if (!allowedNodePermissions.has(permission)) {
      fail(file, `unsupported permission: ${permission}`);
    }
  }
}

function selectValidator(file, document, validators) {
  if (document.schema === "skenion.graph" && document.schemaVersion === "0.0.0") {
    return validators.graphV0;
  }
  if (document.schema === "skenion.graph" && document.schemaVersion === "0.1.0") {
    return validators.graphV01;
  }
  if (document.schema === "skenion.graph.patch" && document.schemaVersion === "0.0.0") {
    return validators.patchV0;
  }
  if (document.schema === "skenion.graph.patch" && document.schemaVersion === "0.1.0") {
    return validators.patchV01;
  }
  if (document.schema === "skenion.graph.patch.event" && document.schemaVersion === "0.1.0") {
    return validators.patchEventV01;
  }
  if (document.schema === "skenion.graph.patch.history" && document.schemaVersion === "0.1.0") {
    return validators.patchHistoryV01;
  }
  if (document.schema === "skenion.node.definition" && document.schemaVersion === "0.1.0") {
    return validators.nodeDefinitionV01;
  }

  fail(file, `no validator for schema ${document.schema ?? "<missing>"} ${document.schemaVersion ?? "<missing>"}`);
}

function validateDocument(file, document, validators) {
  const validator = selectValidator(file, document, validators);
  if (!validator(document)) {
    fail(file, validator.errors?.map((error) => `${error.instancePath} ${error.message}`).join("; "));
  }

  if (document.schema === "skenion.graph" && document.schemaVersion === "0.1.0") {
    validateGraphV01Semantics(file, document);
  }
  if (document.schema === "skenion.node.definition" && document.schemaVersion === "0.1.0") {
    validateNodeDefinitionV01Semantics(file, document);
  }
}

const schemaFiles = (await walk("json-schema")).filter((file) => file.endsWith(".json"));
for (const file of schemaFiles) {
  await readJson(file);
}

await readFile("openapi/runtime-http.v0.yaml", "utf8");

const ajv = new Ajv2020({ allErrors: true });
const graphPatchV01Schema = await readJson("json-schema/graph/v0.1/patch.schema.json");
const graphPatchEventV01Schema = await readJson("json-schema/graph/v0.1/patch-event.schema.json");
ajv.addSchema(graphPatchV01Schema);
ajv.addSchema(graphPatchEventV01Schema);
const validators = {
  graphV0: ajv.compile(await readJson("json-schema/graph/v0/graph.schema.json")),
  patchV0: ajv.compile(await readJson("json-schema/graph/v0/patch.schema.json")),
  graphV01: ajv.compile(await readJson("json-schema/graph/v0.1/graph.schema.json")),
  patchV01: ajv.compile(graphPatchV01Schema),
  patchEventV01: ajv.compile(graphPatchEventV01Schema),
  patchHistoryV01: ajv.compile(await readJson("json-schema/graph/v0.1/patch-history.schema.json")),
  nodeDefinitionV01: ajv.compile(
    await readJson("json-schema/node/v0.1/node-definition.schema.json")
  )
};

const fixtureFiles = (await walk("fixtures")).filter((file) => file.endsWith(".json"));
const validFixtureFiles = fixtureFiles.filter((file) => !file.includes(`${path.sep}invalid${path.sep}`));
const invalidFixtureFiles = fixtureFiles.filter((file) => file.includes(`${path.sep}invalid${path.sep}`));

for (const file of validFixtureFiles) {
  validateDocument(file, await readJson(file), validators);
}

for (const file of invalidFixtureFiles) {
  try {
    validateDocument(file, await readJson(file), validators);
  } catch {
    continue;
  }
  fail(file, "invalid fixture unexpectedly passed");
}

console.log(
  `validated ${schemaFiles.length} schemas, ${validFixtureFiles.length} valid fixtures, and ${invalidFixtureFiles.length} invalid fixtures`
);
