import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  applyGraphPatch,
  graphPatchV01Schema,
  graphV01Schema,
  nodeDefinitionV01Schema,
  validateGraphPatch,
  validateGraphDocument,
  validateNodeDefinition
} from "../dist/index.js";

const repoRoot = path.resolve(import.meta.dirname, "../../..");

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(repoRoot, relativePath), "utf8"));
}

test("exports v0.1 graph and node definition schemas", () => {
  assert.equal(graphV01Schema.properties.schemaVersion.const, "0.1.0");
  assert.equal(graphPatchV01Schema.properties.schema.const, "skenion.graph.patch");
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

test("validates v0.1 graph patch fixtures", async () => {
  const patch = await readJson("fixtures/graph-patch/v0.1/valid/set-node-param.patch.json");
  const result = validateGraphPatch(patch);

  assert.equal(result.ok, true);
});

test("rejects schema-invalid graph patches", async () => {
  const patch = await readJson("fixtures/graph-patch/v0.1/invalid/unsupported-op.patch.json");
  const result = validateGraphPatch(patch);

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /must match exactly one schema/);
});

test("applies graph patches atomically and updates revision", async () => {
  const graph = await readJson("fixtures/graph/v0.1/valid/minimal-value.graph.json");
  graph.revision = "1";
  const patch = {
    schema: "skenion.graph.patch",
    schemaVersion: "0.1.0",
    id: "patch_001",
    baseRevision: "1",
    ops: [
      {
        op: "setNodeParam",
        nodeId: "slider_1",
        key: "value",
        value: 0.75
      }
    ]
  };

  const result = applyGraphPatch(graph, patch, { nextRevision: "2" });

  assert.equal(result.ok, true);
  assert.equal(result.graph.revision, "2");
  assert.equal(result.graph.nodes[0].params.value, 0.75);
  assert.equal(graph.revision, "1");
  assert.equal(graph.nodes[0].params.value, 0.5);
});

test("removeNode removes incident edges", async () => {
  const graph = await readJson("fixtures/graph/v0.1/valid/minimal-value.graph.json");
  graph.revision = "1";

  const result = applyGraphPatch(graph, {
    schema: "skenion.graph.patch",
    schemaVersion: "0.1.0",
    id: "patch_remove",
    baseRevision: "1",
    ops: [{ op: "removeNode", nodeId: "slider_1" }]
  });

  assert.equal(result.ok, true);
  assert.equal(result.graph.revision, "2");
  assert.equal(result.graph.edges.length, 0);
  assert.equal(result.graph.nodes.some((node) => node.id === "slider_1"), false);
});

test("setNodeParams addNode and removeNode apply in order", async () => {
  const graph = await readJson("fixtures/graph/v0.1/valid/minimal-value.graph.json");
  graph.revision = "1";

  const result = applyGraphPatch(graph, {
    schema: "skenion.graph.patch",
    schemaVersion: "0.1.0",
    id: "patch_ordered",
    baseRevision: "1",
    ops: [
      {
        op: "addNode",
        node: {
          id: "value_2",
          kind: "core.value-f32",
          kindVersion: "0.1.0",
          params: {},
          ports: []
        }
      },
      { op: "setNodeParams", nodeId: "value_2", params: { value: 1 } },
      { op: "removeNode", nodeId: "value_2" }
    ]
  }, { nextRevision: "accepted" });

  assert.equal(result.ok, true);
  assert.equal(result.graph.revision, "accepted");
  assert.equal(result.graph.nodes.some((node) => node.id === "value_2"), false);
});

test("rejects graph patch conflicts duplicate edges and invalid resulting graphs", async () => {
  const graph = await readJson("fixtures/graph/v0.1/valid/minimal-value.graph.json");
  graph.revision = "1";

  const conflict = applyGraphPatch(graph, {
    schema: "skenion.graph.patch",
    schemaVersion: "0.1.0",
    id: "patch_conflict",
    baseRevision: "0",
    ops: []
  });
  assert.equal(conflict.ok, false);
  assert.match(conflict.errors.join("\n"), /baseRevision 0/);

  const duplicateEdge = applyGraphPatch(graph, {
    schema: "skenion.graph.patch",
    schemaVersion: "0.1.0",
    id: "patch_duplicate_edge",
    baseRevision: "1",
    ops: [
      {
        op: "addEdge",
        edge: graph.edges[0]
      }
    ]
  });
  assert.equal(duplicateEdge.ok, false);
  assert.match(duplicateEdge.errors.join("\n"), /already exists/);

  const invalidEdge = applyGraphPatch(graph, {
    schema: "skenion.graph.patch",
    schemaVersion: "0.1.0",
    id: "patch_invalid_edge",
    baseRevision: "1",
    ops: [
      {
        op: "addEdge",
        edge: {
          from: { node: "slider_1", port: "out" },
          to: { node: "missing", port: "value" }
        }
      }
    ]
  });
  assert.equal(invalidEdge.ok, false);
  assert.match(invalidEdge.errors.join("\n"), /missing target port/);
});

test("rejects missing patch targets and absent edges", async () => {
  const graph = await readJson("fixtures/graph/v0.1/valid/minimal-value.graph.json");
  graph.revision = "1";

  const missingNode = applyGraphPatch(graph, {
    schema: "skenion.graph.patch",
    schemaVersion: "0.1.0",
    id: "patch_missing_node",
    baseRevision: "1",
    ops: [{ op: "setNodeParam", nodeId: "missing", key: "value", value: 1 }]
  });
  assert.equal(missingNode.ok, false);
  assert.match(missingNode.errors.join("\n"), /node missing does not exist/);

  const missingEdge = applyGraphPatch(graph, {
    schema: "skenion.graph.patch",
    schemaVersion: "0.1.0",
    id: "patch_missing_edge",
    baseRevision: "1",
    ops: [
      {
        op: "removeEdge",
        edge: {
          from: { node: "slider_1", port: "out" },
          to: { node: "blur_1", port: "missing" }
        }
      }
    ]
  });
  assert.equal(missingEdge.ok, false);
  assert.match(missingEdge.errors.join("\n"), /does not exist/);
});

test("rejects structurally invalid patches and missing add or remove targets", async () => {
  const graph = await readJson("fixtures/graph/v0.1/valid/minimal-value.graph.json");
  graph.revision = "1";

  const invalidPatch = applyGraphPatch(graph, {
    schema: "skenion.graph.patch",
    schemaVersion: "0.1.0",
    id: "invalid",
    baseRevision: "1",
    ops: [{ op: "moveNode", nodeId: "slider_1" }]
  });
  assert.equal(invalidPatch.ok, false);
  assert.match(invalidPatch.errors.join("\n"), /must match exactly one schema/);

  const duplicateNode = applyGraphPatch(graph, {
    schema: "skenion.graph.patch",
    schemaVersion: "0.1.0",
    id: "duplicate_node",
    baseRevision: "1",
    ops: [
      {
        op: "addNode",
        node: graph.nodes[0]
      }
    ]
  });
  assert.equal(duplicateNode.ok, false);
  assert.match(duplicateNode.errors.join("\n"), /node slider_1 already exists/);

  const missingRemoveNode = applyGraphPatch(graph, {
    schema: "skenion.graph.patch",
    schemaVersion: "0.1.0",
    id: "remove_missing_node",
    baseRevision: "1",
    ops: [{ op: "removeNode", nodeId: "missing" }]
  });
  assert.equal(missingRemoveNode.ok, false);
  assert.match(missingRemoveNode.errors.join("\n"), /node missing does not exist/);

  const missingSetParamsNode = applyGraphPatch(graph, {
    schema: "skenion.graph.patch",
    schemaVersion: "0.1.0",
    id: "set_params_missing_node",
    baseRevision: "1",
    ops: [{ op: "setNodeParams", nodeId: "missing", params: {} }]
  });
  assert.equal(missingSetParamsNode.ok, false);
  assert.match(missingSetParamsNode.errors.join("\n"), /node missing does not exist/);
});

test("appends deterministic suffix for non-numeric graph revisions", async () => {
  const graph = await readJson("fixtures/graph/v0.1/valid/minimal-value.graph.json");
  const result = applyGraphPatch(graph, {
    schema: "skenion.graph.patch",
    schemaVersion: "0.1.0",
    id: "patch_suffix",
    baseRevision: "rev_0001",
    ops: []
  });

  assert.equal(result.ok, true);
  assert.equal(result.graph.revision, "rev_0001+1");
});
