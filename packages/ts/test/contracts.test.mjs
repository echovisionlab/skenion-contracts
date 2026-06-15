import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  graphV01Schema,
  nodeDefinitionV01Schema,
  validateGraphDocument,
  validateNodeDefinition
} from "../dist/index.js";

const repoRoot = path.resolve(import.meta.dirname, "../../..");

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(repoRoot, relativePath), "utf8"));
}

test("exports v0.1 graph and node definition schemas", () => {
  assert.equal(graphV01Schema.properties.schemaVersion.const, "0.1.0");
  assert.equal(nodeDefinitionV01Schema.properties.schema.const, "skenion.node.definition");
});

test("validates a v0.1 graph fixture", async () => {
  const graph = await readJson("fixtures/graph/v0.1/valid/bang-event.graph.json");
  const result = validateGraphDocument(graph);

  assert.equal(result.ok, true);
});

test("rejects incompatible bool to bang graph wiring", async () => {
  const graph = await readJson("fixtures/graph/v0.1/invalid/bool-to-bang.graph.json");
  const result = validateGraphDocument(graph);

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /incompatible edge/);
});

test("rejects schema-invalid graph documents", () => {
  const result = validateGraphDocument({
    schema: "skenion.graph",
    schemaVersion: "0.1.0"
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /required property/);
});

test("reports nested schema paths for invalid graph documents", async () => {
  const graph = await readJson("fixtures/graph/v0.1/valid/minimal-value.graph.json");
  graph.schemaVersion = "0.2.0";

  const result = validateGraphDocument(graph);

  assert.equal(result.ok, false);
  assert.equal(result.errors.join("\n").includes("/schemaVersion"), true);
});

test("rejects graph semantic failures", async () => {
  const cases = [
    ["fixtures/graph/v0.1/invalid/duplicate-node-id.graph.json", /duplicate node id/],
    ["fixtures/graph/v0.1/invalid/edge-to-missing-port.graph.json", /edge references missing target port/],
    ["fixtures/graph/v0.1/invalid/input-to-input-edge.graph.json", /is not an output port/],
    ["fixtures/graph/v0.1/invalid/resource-video-direct-stream.graph.json", /resource<asset.video>/],
    ["fixtures/graph/v0.1/invalid/video-stream-direct-gpu.graph.json", /stream<video.frame>/]
  ];

  for (const [fixture, expected] of cases) {
    const graph = await readJson(fixture);
    const result = validateGraphDocument(graph);

    assert.equal(result.ok, false, fixture);
    assert.match(result.errors.join("\n"), expected, fixture);
  }
});

test("rejects edges with missing source ports and non-input targets", async () => {
  const graph = await readJson("fixtures/graph/v0.1/valid/minimal-value.graph.json");
  graph.edges[0].from.port = "missing";
  graph.edges.push({
    from: {
      node: "slider_1",
      port: "out"
    },
    to: {
      node: "slider_1",
      port: "out"
    }
  });

  const result = validateGraphDocument(graph);

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /edge references missing source port slider_1:missing/);
  assert.match(result.errors.join("\n"), /edge target slider_1:out is not an input port/);
});

test("rejects source formats not accepted by a target port", async () => {
  const graph = await readJson("fixtures/graph/v0.1/valid/minimal-value.graph.json");
  graph.nodes[0].ports[0].type.format = "float32";
  graph.nodes[1].ports[0].type.format = ["float64"];

  const result = validateGraphDocument(graph);

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /incompatible edge/);
});

test("accepts source formats included by a target port", async () => {
  const graph = await readJson("fixtures/graph/v0.1/valid/minimal-value.graph.json");
  graph.nodes[0].ports[0].type.format = "float32";
  graph.nodes[1].ports[0].type.format = ["float16", "float32"];

  const result = validateGraphDocument(graph);

  assert.equal(result.ok, true);
});

test("accepts absent source or target format constraints", async () => {
  const graphWithOnlyTargetFormat = await readJson("fixtures/graph/v0.1/valid/minimal-value.graph.json");
  graphWithOnlyTargetFormat.nodes[1].ports[0].type.format = "float32";
  assert.equal(validateGraphDocument(graphWithOnlyTargetFormat).ok, true);

  const graphWithOnlySourceFormat = await readJson("fixtures/graph/v0.1/valid/minimal-value.graph.json");
  graphWithOnlySourceFormat.nodes[0].ports[0].type.format = "float32";
  assert.equal(validateGraphDocument(graphWithOnlySourceFormat).ok, true);
});

test("accepts target scalar formats that include every source format", async () => {
  const graph = await readJson("fixtures/graph/v0.1/valid/minimal-value.graph.json");
  graph.nodes[0].ports[0].type.format = ["float32"];
  graph.nodes[1].ports[0].type.format = "float32";

  const result = validateGraphDocument(graph);

  assert.equal(result.ok, true);
});

test("validates a script node manifest fixture", async () => {
  const definition = await readJson("fixtures/node/v0.1/valid/script-control.node.json");
  const result = validateNodeDefinition(definition);

  assert.equal(result.ok, true);
});

test("rejects schema-invalid node definitions", () => {
  const result = validateNodeDefinition({
    schema: "skenion.node.definition",
    schemaVersion: "0.1.0"
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /required property/);
});

test("reports nested schema paths for invalid node definitions", async () => {
  const definition = await readJson("fixtures/node/v0.1/valid/script-control.node.json");
  definition.schemaVersion = "0.2.0";

  const result = validateNodeDefinition(definition);

  assert.equal(result.ok, false);
  assert.equal(result.errors.join("\n").includes("/schemaVersion"), true);
});

test("rejects output activation in node definitions", async () => {
  const definition = await readJson("fixtures/node/v0.1/valid/script-control.node.json");
  definition.ports.find((port) => port.direction === "output").activation = "trigger";

  const result = validateNodeDefinition(definition);

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /must not declare activation/);
});

test("rejects unsupported permissions in node manifests", async () => {
  const definition = await readJson("fixtures/node/v0.1/invalid/unsupported-permission.node.json");
  const result = validateNodeDefinition(definition);

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /unsupported permission/);
});
