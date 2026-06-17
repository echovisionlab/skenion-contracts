import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  applyGraphPatch,
  builtinManifestV01,
  builtinNodeHelpGraphsV01,
  builtinNodeHelpV01,
  builtinNodeDefinitionsV01,
  getBuiltinNodeDefinition,
  getBuiltinNodeHelp,
  getBuiltinNodeHelpGraph,
  graphPatchEventV01Schema,
  graphPatchHistoryV01Schema,
  graphPatchV01Schema,
  graphV01Schema,
  graphV02Schema,
  invertGraphPatch,
  nodeDefinitionV01Schema,
  nodeDefinitionV02Schema,
  shaderDiagnosticV01Schema,
  shaderInterfaceV01Schema,
  analyzeShaderInterfaceV01,
  shaderInterfaceToPortsV01,
  analyzeGraphDocumentV02,
  validateGraphPatchEvent,
  validateGraphPatchHistory,
  validateGraphPatch,
  validateGraphDocument,
  validateGraphDocumentV02,
  validateNodeDefinition,
  validateNodeDefinitionV02,
  validateShaderInterface
} from "../dist/index.js";

const repoRoot = path.resolve(import.meta.dirname, "../../..");

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(repoRoot, relativePath), "utf8"));
}

test("exports v0.1 graph and node definition schemas", () => {
  assert.equal(graphV01Schema.properties.schemaVersion.const, "0.1.0");
  assert.equal(graphPatchV01Schema.properties.schema.const, "skenion.graph.patch");
  assert.equal(graphPatchEventV01Schema.properties.schema.const, "skenion.graph.patch.event");
  assert.equal(graphPatchHistoryV01Schema.properties.schema.const, "skenion.graph.patch.history");
  assert.equal(nodeDefinitionV01Schema.properties.schema.const, "skenion.node.definition");
  assert.equal(shaderInterfaceV01Schema.properties.schema.const, "skenion.shader.interface");
  assert.deepEqual(shaderDiagnosticV01Schema.properties.phase.enum, [
    "interface-analysis",
    "source-sync",
    "wgsl-generation",
    "wgsl-compile",
    "render-pipeline",
    "render-frame"
  ]);
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

test("exports canonical v0.1 builtin node definitions", () => {
  const ids = builtinNodeDefinitionsV01.map((definition) => definition.id);

  assert.deepEqual(ids, [
    "core.bang-button",
    "core.color-rgba",
    "core.comment",
    "core.event-log",
    "core.gpu-upload",
    "core.message",
    "core.preview",
    "core.string",
    "core.target",
    "core.toggle",
    "core.value-bool",
    "core.value-f32",
    "core.value-i32",
    "core.video-asset",
    "core.video-decode",
    "render.clear-color",
    "render.fullscreen-shader",
    "render.output"
  ]);

  const valueDefinition = getBuiltinNodeDefinition("core.value-f32");
  assert.deepEqual(valueDefinition?.ports.map((port) => port.id), ["in", "set", "bang", "value"]);
  assert.equal(valueDefinition?.ports.find((port) => port.id === "in")?.activation, "trigger");
  assert.equal(valueDefinition?.ports.find((port) => port.id === "set")?.activation, "latched");
  assert.equal(valueDefinition?.ports.find((port) => port.id === "bang")?.type.dataKind, "event.bang");
  const valueOutputType = valueDefinition?.ports.find((port) => port.id === "value")?.type;
  assert.equal(valueOutputType?.dataKind, "number.f32");
  assert.equal(Boolean(valueOutputType && "range" in valueOutputType), false);

  const i32Definition = getBuiltinNodeDefinition("core.value-i32");
  assert.deepEqual(i32Definition?.ports.map((port) => port.id), ["in", "set", "bang", "value"]);
  assert.equal(i32Definition?.ports.find((port) => port.id === "value")?.type.dataKind, "number.i32");

  const boolDefinition = getBuiltinNodeDefinition("core.value-bool");
  assert.deepEqual(boolDefinition?.ports.map((port) => port.id), ["in", "set", "bang", "value"]);
  assert.equal(boolDefinition?.ports.find((port) => port.id === "value")?.type.dataKind, "boolean");

  const colorDefinition = getBuiltinNodeDefinition("core.color-rgba");
  assert.deepEqual(colorDefinition?.ports.map((port) => port.id), ["in", "set", "bang", "value"]);
  assert.equal(colorDefinition?.ports.find((port) => port.id === "value")?.type.dataKind, "color.rgba");

  const stringDefinition = getBuiltinNodeDefinition("core.string");
  assert.deepEqual(stringDefinition?.ports.map((port) => port.id), ["in", "set", "bang", "value"]);
  assert.equal(stringDefinition?.ports.find((port) => port.id === "value")?.type.dataKind, "string");

  const toggleDefinition = getBuiltinNodeDefinition("core.toggle");
  assert.deepEqual(toggleDefinition?.ports.map((port) => port.id), ["in", "set", "bang", "value"]);
  assert.equal(toggleDefinition?.ports.find((port) => port.id === "value")?.type.dataKind, "boolean");

  const commentDefinition = getBuiltinNodeDefinition("core.comment");
  assert.deepEqual(commentDefinition?.ports, []);

  const messageDefinition = getBuiltinNodeDefinition("core.message");
  assert.deepEqual(messageDefinition?.ports.map((port) => port.id), ["bang", "value"]);
  assert.equal(messageDefinition?.ports.find((port) => port.id === "value")?.type.dataKind, "string");

  const shaderDefinition = getBuiltinNodeDefinition("render.fullscreen-shader");
  assert.deepEqual(shaderDefinition?.ports.map((port) => port.id), ["out"]);
  assert.equal(shaderDefinition?.ports.find((port) => port.id === "out")?.type.dataKind, "gpu.texture2d");
  assert.equal(getBuiltinNodeDefinition("missing.node"), undefined);
  assert.equal(
    builtinNodeDefinitionsV01.flatMap((definition) => definition.ports).some((port) => port.type.dataKind === "f32"),
    false
  );
});

test("exports the canonical v0.1 builtin manifest", () => {
  assert.equal(builtinManifestV01.schema, "skenion.builtins.manifest");
  assert.equal(builtinManifestV01.schemaVersion, "0.1.0");
  assert.equal(builtinManifestV01.version, "0.1");
  assert.deepEqual(
    [...builtinManifestV01.nodes].sort(),
    builtinNodeDefinitionsV01.map((definition) => definition.id).sort()
  );
  assert.equal(builtinManifestV01.canonicalDataKinds.includes("number.f32"), true);
  assert.equal(builtinManifestV01.canonicalDataKinds.includes("number.i32"), true);
  assert.equal(builtinManifestV01.canonicalDataKinds.includes("boolean"), true);
  assert.equal(builtinManifestV01.canonicalDataKinds.includes("string"), true);
  assert.equal(builtinManifestV01.canonicalDataKinds.includes("event.bang"), true);
  assert.equal(builtinManifestV01.canonicalDataKinds.includes("f32"), false);
  assert.equal(builtinManifestV01.canonicalDataKinds.includes("bang"), false);
});

test("analyzes WGSL shader uniform annotations into dynamic ports", () => {
  const source = [
    "// @skenion.uniform speed number.f32 default=0.5 min=0 max=2 step=0.01 label=\"Speed Amount\"",
    "// @skenion.uniform enabled boolean default=true",
    "// @skenion.uniform disabled boolean default=false",
    "// @skenion.uniform iterations number.i32 default=8",
    "// @skenion.uniform tint color.rgba default=[1,0.2,0.1,1]",
    "fn fs_main() -> @location(0) vec4<f32> { return vec4<f32>(1.0); }"
  ].join("\n");

  const result = analyzeShaderInterfaceV01(source, { language: "wgsl" });

  assert.equal(result.ok, true);
  assert.equal(result.diagnostics.length, 0);
  assert.equal(validateShaderInterface(result.shaderInterface).ok, true);
  assert.deepEqual(
    result.shaderInterface.uniforms.map((uniform) => [uniform.id, uniform.type.dataKind, uniform.default]),
    [
      ["speed", "number.f32", 0.5],
      ["enabled", "boolean", true],
      ["disabled", "boolean", false],
      ["iterations", "number.i32", 8],
      ["tint", "color.rgba", [1, 0.2, 0.1, 1]]
    ]
  );
  assert.equal(result.shaderInterface.uniforms[0].label, "Speed Amount");
  assert.deepEqual(result.shaderInterface.uniforms[0].type.range, { min: 0, max: 2, step: 0.01 });

  const ports = shaderInterfaceToPortsV01(result.shaderInterface);
  assert.deepEqual(ports.map((port) => port.id), ["speed", "enabled", "disabled", "iterations", "tint", "out"]);
  assert.equal(ports[0].activation, "latched");
  assert.equal(ports[5].direction, "output");
  assert.equal(ports[5].type.dataKind, "gpu.texture2d");
});

test("reports shader uniform annotation diagnostics", () => {
  const source = [
    "// @skenion.uniform",
    "const note = \"@skenion.uniform\";",
    "// @skenion.uniform 1bad number.f32 default=nope min=nope step=-1",
    "// @skenion.uniform out number.f32",
    "// @skenion.uniform speed vec3 default=0",
    "// @skenion.uniform speed number.f32 default=0.2",
    "// @skenion.uniform badFloat number.f32 default=nope",
    "// @skenion.uniform flag boolean default=maybe",
    "// @skenion.uniform count number.i32 default=1.5",
    "// @skenion.uniform color color.rgba default=nope",
    "// @skenion.uniform color2 color.rgba default=[1,2,3]",
    "// @skenion.uniform ranged number.f32 min=nope max=Infinity step=-1",
    "// @skenion.uniform plain number.f32 label=Plain"
  ].join("\n");

  const result = analyzeShaderInterfaceV01(source, { language: "glsl" });

  assert.equal(result.ok, false);
  assert.deepEqual(
    result.diagnostics.map((diagnostic) => diagnostic.code),
    [
      "unsupported-language",
      "malformed-annotation",
      "invalid-uniform-id",
      "reserved-uniform-id",
      "unsupported-uniform-type",
      "duplicate-uniform-id",
      "invalid-default",
      "invalid-default",
      "invalid-default",
      "invalid-default",
      "invalid-default",
      "invalid-number-range",
      "invalid-number-range",
      "invalid-number-range"
    ]
  );
  assert.deepEqual(
    result.diagnostics.map((diagnostic) => [diagnostic.phase, diagnostic.source]),
    result.diagnostics.map(() => ["interface-analysis", "user"])
  );
  assert.equal(result.diagnostics[1]?.line, 1);
  assert.equal(result.diagnostics[1]?.column, 4);
  assert.equal(result.diagnostics.find((diagnostic) => diagnostic.code === "invalid-default")?.column, 41);
  assert.equal(result.shaderInterface.uniforms.at(-1)?.label, "Plain");
});

test("rejects schema-invalid shader interfaces", () => {
  const result = validateShaderInterface({
    schema: "skenion.shader.interface",
    schemaVersion: "0.1.0",
    language: "wgsl",
    uniforms: [
      {
        id: "out",
        label: "Out",
        type: { flow: "value", dataKind: "number.f32" },
        required: false
      }
    ]
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /must NOT be valid/);
});

test("exports builtin node help", () => {
  const helpIds = builtinNodeHelpV01.map((help) => help.id);

  assert.deepEqual([...helpIds].sort(), [...builtinManifestV01.nodes].sort());
  assert.deepEqual(
    builtinNodeHelpGraphsV01.map((helpGraph) => helpGraph.id).sort(),
    [...builtinManifestV01.nodes].sort()
  );

  const valueHelp = getBuiltinNodeHelp("core.value-f32");
  assert.match(valueHelp?.summary ?? "", /floating-point/);
  assert.deepEqual(valueHelp?.ports?.map((port) => port.id), ["in", "set", "bang", "value"]);
  assert.equal(valueHelp?.docsPath, "docs/nodes/core.value-f32.md");
  assert.equal(valueHelp?.helpGraph, "help/v0.1/nodes/core.value-f32.help.graph.json");
  assert.equal(valueHelp?.tags.includes("control"), true);

  const toggleHelp = getBuiltinNodeHelp("core.toggle");
  assert.match(toggleHelp?.ports?.find((port) => port.id === "bang")?.description ?? "", /Flips/);

  const shaderHelp = getBuiltinNodeHelp("render.fullscreen-shader");
  assert.match(shaderHelp?.runtimeBehavior ?? "", /dynamic uniform layout/);
  assert.equal(shaderHelp?.relatedNodes?.includes("render.output"), true);

  const valueHelpGraph = getBuiltinNodeHelpGraph("core.value-f32");
  assert.equal(valueHelpGraph?.id, "help-core-value-f32");
  assert.equal(validateGraphDocument(valueHelpGraph).ok, true);
  assert.deepEqual(valueHelpGraph?.edges[0], {
    from: { node: "bang_1", port: "bang" },
    to: { node: "value_1", port: "bang" }
  });

  const shaderHelpGraph = getBuiltinNodeHelpGraph("render.fullscreen-shader");
  assert.equal(shaderHelpGraph?.nodes.find((node) => node.id === "shader_1")?.ports.map((port) => port.id).join(","), "speed,tint,out");
  assert.equal(validateGraphDocument(shaderHelpGraph).ok, true);

  assert.equal(getBuiltinNodeHelp("missing.node"), undefined);
  assert.equal(getBuiltinNodeHelpGraph("missing.node"), undefined);
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

test("exports and validates v0.2 graph and node schemas", async () => {
  assert.equal(graphV02Schema.properties.schemaVersion.const, "0.2.0");
  assert.equal(nodeDefinitionV02Schema.properties.schemaVersion.const, "0.2.0");

  const graph = await readJson("fixtures/graph/v0.2/valid/render-output.graph.json");
  const node = await readJson("fixtures/node/v0.2/valid/render-clear-color.node.json");

  assert.equal(validateGraphDocumentV02(graph).ok, true);
  assert.equal(validateNodeDefinitionV02(node).ok, true);
});

test("v0.2 validates fan-out, fan-in, accepts, and feedback fixtures", async () => {
  for (const fixture of [
    "fixtures/graph/v0.2/valid/zero-port-node.graph.json",
    "fixtures/graph/v0.2/valid/n-input-output-node.graph.json",
    "fixtures/graph/v0.2/valid/source-fan-out.graph.json",
    "fixtures/graph/v0.2/valid/ordered-event-fan-in.graph.json",
    "fixtures/graph/v0.2/valid/audio-mix-fan-in.graph.json",
    "fixtures/graph/v0.2/valid/render-frame-feedback.graph.json"
  ]) {
    const result = validateGraphDocumentV02(await readJson(fixture));
    assert.equal(result.ok, true, fixture);
  }

  const feedbackGraph = await readJson("fixtures/graph/v0.2/valid/render-frame-feedback.graph.json");
  const feedbackAnalysis = analyzeGraphDocumentV02(feedbackGraph);
  assert.equal(feedbackAnalysis.ok, true);
  assert.equal(feedbackAnalysis.cycles[0].classification, "valid-feedback");
  assert.match(feedbackAnalysis.cycles[0].message, /render-frame|explicit boundary/);

  feedbackGraph.edges[0].feedback.boundary = "same-turn";
  const riskyAnalysis = analyzeGraphDocumentV02(feedbackGraph);
  assert.equal(riskyAnalysis.ok, true);
  assert.equal(riskyAnalysis.diagnostics[0].severity, "warning");
  assert.equal(riskyAnalysis.cycles[0].classification, "risky-feedback");

  delete feedbackGraph.edges[0].feedback;
  const invalidCycle = analyzeGraphDocumentV02(feedbackGraph);
  assert.equal(invalidCycle.ok, false);
  assert.equal(invalidCycle.cycles[0].classification, "invalid-cycle");
});

test("v0.2 rejects invalid direction fan-in and algebraic-loop fixtures", async () => {
  const cases = [
    ["fixtures/graph/v0.2/invalid/input-to-input-edge.graph.json", /invalid-source-direction/],
    ["fixtures/graph/v0.2/invalid/output-to-output-edge.graph.json", /invalid-target-direction/],
    ["fixtures/graph/v0.2/invalid/fan-in-without-merge-policy.graph.json", /fan-in-without-merge-policy/],
    ["fixtures/graph/v0.2/invalid/render-input-fan-in-default.graph.json", /fan-in-cardinality/],
    ["fixtures/graph/v0.2/invalid/ambiguous-value-algebraic-loop.graph.json", /ambiguous-algebraic-loop/]
  ];

  for (const [fixture, expected] of cases) {
    const result = validateGraphDocumentV02(await readJson(fixture));
    assert.equal(result.ok, false, fixture);
    assert.match(result.errors.join("\n"), expected, fixture);
  }

  const controlLoop = await readJson("fixtures/graph/v0.2/invalid/ambiguous-value-algebraic-loop.graph.json");
  for (const node of controlLoop.nodes) {
    for (const port of node.ports) {
      port.type = "control.number";
    }
  }
  const controlLoopResult = validateGraphDocumentV02(controlLoop);
  assert.equal(controlLoopResult.ok, false);
  assert.match(controlLoopResult.errors.join("\n"), /ambiguous-algebraic-loop/);

  const missingPortCycle = await readJson("fixtures/graph/v0.2/valid/zero-port-node.graph.json");
  missingPortCycle.edges.push({
    id: "edge_missing_cycle",
    source: { nodeId: "note_1", portId: "missing_out" },
    target: { nodeId: "note_1", portId: "missing_in" }
  });
  const missingPortCycleAnalysis = analyzeGraphDocumentV02(missingPortCycle);
  assert.equal(missingPortCycleAnalysis.ok, false);
  assert.equal(missingPortCycleAnalysis.cycles[0].classification, "invalid-cycle");
});

test("v0.2 reports detailed semantic diagnostics", async () => {
  const graph = await readJson("fixtures/graph/v0.2/valid/source-fan-out.graph.json");
  graph.nodes[0].ports[0].fanOutPolicy = "forbid";
  graph.nodes[1].ports[0].required = true;
  graph.nodes[2].ports[0].type = "render.frame";
  graph.nodes[2].ports[0].accepts = ["gpu.texture2d"];
  graph.edges[1].source.portId = "missing";
  graph.edges.push({
    ...graph.edges[0],
    id: "edge_duplicate_endpoint"
  });
  graph.edges.push({
    ...graph.edges[0],
    id: "edge_wrong_type",
    target: { nodeId: "meter_b", portId: "in" }
  });
  graph.edges.push({
    ...graph.edges[0],
    id: "edge_missing_target",
    target: { nodeId: "missing", portId: "in" }
  });
  graph.edges.push({
    ...graph.edges[0],
    id: "edge_duplicate_endpoint"
  });
  graph.nodes.push({
    ...graph.nodes[1],
    id: "meter_a"
  });
  graph.nodes[1].ports.push({
    ...graph.nodes[1].ports[0]
  });

  const analysis = analyzeGraphDocumentV02(graph);

  assert.equal(analysis.ok, false);
  assert.match(analysis.diagnostics.map((entry) => entry.code).join("\n"), /missing-source-port/);
  assert.match(analysis.diagnostics.map((entry) => entry.code).join("\n"), /missing-target-port/);
  assert.match(analysis.diagnostics.map((entry) => entry.code).join("\n"), /duplicate-node-id/);
  assert.match(analysis.diagnostics.map((entry) => entry.code).join("\n"), /duplicate-port-id/);
  assert.match(analysis.diagnostics.map((entry) => entry.code).join("\n"), /duplicate-edge-id/);
  assert.match(analysis.diagnostics.map((entry) => entry.code).join("\n"), /duplicate-edge/);
  assert.match(analysis.diagnostics.map((entry) => entry.code).join("\n"), /incompatible-type/);
  assert.match(analysis.diagnostics.map((entry) => entry.code).join("\n"), /fan-out-forbidden/);

  const acceptingGraph = await readJson("fixtures/graph/v0.2/valid/render-output.graph.json");
  acceptingGraph.nodes[1].ports[0].accepts = ["gpu.texture2d"];
  acceptingGraph.nodes[0].ports[0].type = "gpu.texture2d";
  acceptingGraph.edges[0].resolvedType = "gpu.texture2d";
  assert.equal(validateGraphDocumentV02(acceptingGraph).ok, true);

  const unlimitedGraph = await readJson("fixtures/graph/v0.2/invalid/render-input-fan-in-default.graph.json");
  unlimitedGraph.nodes[2].ports[0].maxConnections = null;
  unlimitedGraph.nodes[2].ports[0].mergePolicy = "array";
  assert.equal(validateGraphDocumentV02(unlimitedGraph).ok, true);

  const requiredGraph = await readJson("fixtures/graph/v0.2/valid/zero-port-node.graph.json");
  requiredGraph.nodes[0].ports.push({
    id: "in",
    direction: "input",
    type: "value.number",
    required: true
  });
  const requiredResult = validateGraphDocumentV02(requiredGraph);
  assert.equal(requiredResult.ok, false);
  assert.match(requiredResult.errors.join("\n"), /missing-required-input/);
});

test("v0.2 rejects schema and node-definition semantic failures", async () => {
  assert.equal(validateGraphDocumentV02({
    schema: "skenion.graph",
    schemaVersion: "0.2.0"
  }).ok, false);
  assert.equal(validateNodeDefinitionV02({
    schema: "skenion.node.definition",
    schemaVersion: "0.2.0"
  }).ok, false);

  const badGroupGraph = await readJson("fixtures/graph/v0.2/valid/zero-port-node.graph.json");
  badGroupGraph.nodes[0].portGroups = [
    {
      id: "bad",
      direction: "input",
      type: "value.number",
      minPorts: 2,
      maxPorts: 1
    }
  ];
  const badGroupResult = validateGraphDocumentV02(badGroupGraph);
  assert.equal(badGroupResult.ok, false);
  assert.match(badGroupResult.errors.join("\n"), /invalid-port-group/);

  const invalidNode = await readJson("fixtures/node/v0.2/invalid/unsupported-permission.node.json");
  const invalidNodeResult = validateNodeDefinitionV02(invalidNode);
  assert.equal(invalidNodeResult.ok, false);
  assert.match(invalidNodeResult.errors.join("\n"), /unsupported permission/);

  const duplicatePortNode = await readJson("fixtures/node/v0.2/valid/render-clear-color.node.json");
  duplicatePortNode.ports.push({ ...duplicatePortNode.ports[0] });
  const duplicatePortResult = validateNodeDefinitionV02(duplicatePortNode);
  assert.equal(duplicatePortResult.ok, false);
  assert.match(duplicatePortResult.errors.join("\n"), /duplicate port id/);

  const badNodeGroup = await readJson("fixtures/node/v0.2/valid/dynamic-input-group.node.json");
  badNodeGroup.portGroups[0].maxPorts = 0;
  const badNodeGroupResult = validateNodeDefinitionV02(badNodeGroup);
  assert.equal(badNodeGroupResult.ok, false);
  assert.match(badNodeGroupResult.errors.join("\n"), /maxPorts/);
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

test("validates graph patch event and history fixtures", async () => {
  const event = await readJson("fixtures/graph-patch-event/v0.1/valid/apply-event.json");
  const history = await readJson("fixtures/graph-patch-history/v0.1/valid/history-with-events.json");

  assert.equal(validateGraphPatchEvent(event).ok, true);
  assert.equal(validateGraphPatchHistory(history).ok, true);
});

test("rejects schema-invalid graph patch events and histories", async () => {
  const event = await readJson("fixtures/graph-patch-event/v0.1/invalid/invalid-kind.json");
  const history = await readJson("fixtures/graph-patch-history/v0.1/valid/empty-history.json");
  history.events.push({ schema: "skenion.graph.patch.event", schemaVersion: "0.1.0" });

  const eventResult = validateGraphPatchEvent(event);
  const historyResult = validateGraphPatchHistory(history);

  assert.equal(eventResult.ok, false);
  assert.match(eventResult.errors.join("\n"), /allowed values/);
  assert.equal(historyResult.ok, false);
  assert.match(historyResult.errors.join("\n"), /required property/);
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

test("replaceNodeInterface updates ports and removes invalid incident edges", async () => {
  const graph = await readJson("fixtures/graph/v0.1/valid/minimal-value.graph.json");
  graph.revision = "1";
  graph.nodes.push(
    {
      id: "source_2",
      kind: "core.value-f32",
      kindVersion: "0.1.0",
      params: {},
      ports: [
        {
          id: "value",
          direction: "output",
          type: { flow: "value", dataKind: "number.f32" }
        }
      ]
    },
    {
      id: "target_2",
      kind: "core.preview",
      kindVersion: "0.1.0",
      params: {},
      ports: [
        {
          id: "value",
          direction: "input",
          type: { flow: "value", dataKind: "number.f32" },
          required: false,
          activation: "latched"
        }
      ]
    }
  );
  graph.edges.push({
    from: { node: "source_2", port: "value" },
    to: { node: "target_2", port: "value" }
  });

  const result = applyGraphPatch(graph, {
    schema: "skenion.graph.patch",
    schemaVersion: "0.1.0",
    id: "replace_interface",
    baseRevision: "1",
    ops: [
      {
        op: "replaceNodeInterface",
        nodeId: "blur_1",
        edgePolicy: "removeInvalidEdges",
        ports: [
          {
            id: "enabled",
            direction: "input",
            label: "Enabled",
            type: { flow: "value", dataKind: "boolean" },
            required: false,
            activation: "latched"
          }
        ]
      }
    ]
  }, { nextRevision: "2" });

  assert.equal(result.ok, true);
  assert.equal(result.graph.nodes.find((node) => node.id === "blur_1").ports[0].id, "enabled");
  assert.equal(result.graph.edges.length, 1);
  assert.equal(result.graph.edges[0].from.node, "source_2");
});

test("replaceNodeInterface keeps compatible edges and inverts removed edges", async () => {
  const graph = await readJson("fixtures/graph/v0.1/valid/minimal-value.graph.json");
  graph.revision = "1";
  const noFormatResult = applyGraphPatch(graph, {
    schema: "skenion.graph.patch",
    schemaVersion: "0.1.0",
    id: "replace_interface_no_format",
    baseRevision: "1",
    ops: [
      {
        op: "replaceNodeInterface",
        nodeId: "blur_1",
        edgePolicy: "removeInvalidEdges",
        ports: [
          {
            id: "radius",
            direction: "input",
            label: "Radius",
            type: { flow: "value", dataKind: "number.f32" },
            required: false,
            activation: "latched"
          }
        ]
      }
    ]
  }, { nextRevision: "2" });
  assert.equal(noFormatResult.ok, true);
  assert.equal(noFormatResult.graph.edges.length, 1);

  const scalarSourceFormatGraph = await readJson("fixtures/graph/v0.1/valid/minimal-value.graph.json");
  scalarSourceFormatGraph.revision = "1";
  scalarSourceFormatGraph.nodes[0].ports[0].type.format = "float32";
  const scalarSourceFormatResult = applyGraphPatch(scalarSourceFormatGraph, {
    schema: "skenion.graph.patch",
    schemaVersion: "0.1.0",
    id: "replace_interface_scalar_source_format",
    baseRevision: "1",
    ops: [
      {
        op: "replaceNodeInterface",
        nodeId: "blur_1",
        edgePolicy: "removeInvalidEdges",
        ports: [
          {
            id: "radius",
            direction: "input",
            label: "Radius",
            type: { flow: "value", dataKind: "number.f32", format: ["float32"] },
            required: false,
            activation: "latched"
          }
        ]
      }
    ]
  }, { nextRevision: "2" });
  assert.equal(scalarSourceFormatResult.ok, true);
  assert.equal(scalarSourceFormatResult.graph.edges.length, 1);

  const formatMismatchGraph = await readJson("fixtures/graph/v0.1/valid/minimal-value.graph.json");
  formatMismatchGraph.revision = "1";
  formatMismatchGraph.nodes[0].ports[0].type.format = ["float16"];
  const formatMismatchResult = applyGraphPatch(formatMismatchGraph, {
    schema: "skenion.graph.patch",
    schemaVersion: "0.1.0",
    id: "replace_interface_format_mismatch",
    baseRevision: "1",
    ops: [
      {
        op: "replaceNodeInterface",
        nodeId: "blur_1",
        edgePolicy: "removeInvalidEdges",
        ports: [
          {
            id: "radius",
            direction: "input",
            label: "Radius",
            type: { flow: "value", dataKind: "number.f32", format: "float32" },
            required: false,
            activation: "latched"
          }
        ]
      }
    ]
  }, { nextRevision: "2" });
  assert.equal(formatMismatchResult.ok, true);
  assert.equal(formatMismatchResult.graph.edges.length, 0);

  graph.nodes[0].ports[0].type.format = ["float32"];
  const replacementPorts = [
    {
      id: "radius",
      direction: "input",
      label: "Radius",
      type: { flow: "value", dataKind: "number.f32", format: ["float32"] },
      required: false,
      activation: "latched"
    },
    {
      id: "enabled",
      direction: "input",
      label: "Enabled",
      type: { flow: "value", dataKind: "boolean" },
      required: false,
      activation: "latched"
    }
  ];
  const patch = {
    schema: "skenion.graph.patch",
    schemaVersion: "0.1.0",
    id: "replace_interface",
    baseRevision: "1",
    ops: [
      {
        op: "replaceNodeInterface",
        nodeId: "blur_1",
        edgePolicy: "removeInvalidEdges",
        ports: replacementPorts
      }
    ]
  };

  const result = applyGraphPatch(graph, patch, { nextRevision: "2" });
  assert.equal(result.ok, true);
  assert.equal(result.graph.edges.length, 1);

  const inverse = invertGraphPatch(graph, patch);
  assert.equal(inverse.ok, true);
  assert.deepEqual(inverse.inversePatch.ops[0].ports.map((port) => port.id), ["radius"]);

  const removedEdgePatch = {
    ...patch,
    ops: [
      {
        ...patch.ops[0],
        ports: [
          {
            id: "enabled",
            direction: "input",
            type: { flow: "value", dataKind: "boolean" },
            required: false,
            activation: "latched"
          }
        ]
      }
    ]
  };
  const inverseWithRemovedEdge = invertGraphPatch(graph, removedEdgePatch);
  assert.equal(inverseWithRemovedEdge.ok, true);
  assert.equal(inverseWithRemovedEdge.inversePatch.ops.length, 2);
  assert.equal(inverseWithRemovedEdge.inversePatch.ops[1].op, "addEdge");

  const missingApply = applyGraphPatch(graph, {
    ...patch,
    id: "replace_missing",
    ops: [{ ...patch.ops[0], nodeId: "missing" }]
  });
  assert.equal(missingApply.ok, false);
  assert.match(missingApply.errors.join("\n"), /node missing does not exist/);

  const missingInvert = invertGraphPatch(graph, {
    ...patch,
    id: "replace_missing",
    ops: [{ ...patch.ops[0], nodeId: "missing" }]
  });
  assert.equal(missingInvert.ok, false);
  assert.match(missingInvert.errors.join("\n"), /node missing does not exist/);
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

test("inverts add node and add edge patches in reverse order", async () => {
  const graph = await readJson("fixtures/graph/v0.1/valid/minimal-value.graph.json");
  const addedNode = {
    id: "meter_1",
    kind: "core.meter",
    kindVersion: "0.1.0",
    params: {},
    ports: [
      {
        id: "value",
        direction: "input",
        type: { flow: "value", dataKind: "number.f32" },
        activation: "latched"
      }
    ]
  };
  const edge = {
    from: { node: "slider_1", port: "out" },
    to: { node: "meter_1", port: "value" }
  };

  const result = invertGraphPatch(graph, {
    schema: "skenion.graph.patch",
    schemaVersion: "0.1.0",
    id: "patch_add_meter",
    baseRevision: "rev_0001",
    clientId: "studio-local",
    description: "Add meter.",
    ops: [
      { op: "addNode", node: addedNode },
      { op: "addEdge", edge }
    ]
  });

  assert.equal(result.ok, true);
  assert.equal(result.inversePatch.baseRevision, "rev_0001+1");
  assert.equal(result.inversePatch.clientId, "studio-local");
  assert.equal(result.inversePatch.description, "Inverse of patch_add_meter: Add meter.");
  assert.deepEqual(result.inversePatch.ops, [
    { op: "removeEdge", edge },
    { op: "removeNode", nodeId: "meter_1" }
  ]);
});

test("inverts remove node by restoring node and incident edges", async () => {
  const graph = await readJson("fixtures/graph/v0.1/valid/minimal-value.graph.json");
  graph.revision = "1";

  const inverse = invertGraphPatch(graph, {
    schema: "skenion.graph.patch",
    schemaVersion: "0.1.0",
    id: "patch_remove_slider",
    baseRevision: "1",
    ops: [{ op: "removeNode", nodeId: "slider_1" }]
  });
  assert.equal(inverse.ok, true);
  assert.equal(inverse.inversePatch.baseRevision, "2");
  assert.deepEqual(inverse.inversePatch.ops.map((op) => op.op), ["addNode", "addEdge"]);

  const removed = applyGraphPatch(graph, {
    schema: "skenion.graph.patch",
    schemaVersion: "0.1.0",
    id: "patch_remove_slider",
    baseRevision: "1",
    ops: [{ op: "removeNode", nodeId: "slider_1" }]
  }, { nextRevision: "2" });
  assert.equal(removed.ok, true);

  const restored = applyGraphPatch(removed.graph, inverse.inversePatch, { nextRevision: "3" });
  assert.equal(restored.ok, true);
  assert.equal(restored.graph.nodes.length, graph.nodes.length);
  assert.equal(restored.graph.edges.length, graph.edges.length);

  const inverseTarget = invertGraphPatch(graph, {
    schema: "skenion.graph.patch",
    schemaVersion: "0.1.0",
    id: "patch_remove_blur",
    baseRevision: "1",
    ops: [{ op: "removeNode", nodeId: "blur_1" }]
  });
  assert.equal(inverseTarget.ok, true);
  assert.deepEqual(inverseTarget.inversePatch.ops.map((op) => op.op), ["addNode", "addEdge"]);
});

test("inverts param and edge removal operations", async () => {
  const graph = await readJson("fixtures/graph/v0.1/valid/minimal-value.graph.json");
  graph.revision = "1";

  const result = invertGraphPatch(graph, {
    schema: "skenion.graph.patch",
    schemaVersion: "0.1.0",
    id: "patch_params_edges",
    baseRevision: "1",
    ops: [
      { op: "setNodeParam", nodeId: "slider_1", key: "value", value: 0.75 },
      { op: "setNodeParams", nodeId: "slider_1", params: { value: 0.25, mode: "fine" } },
      { op: "removeEdge", edge: graph.edges[0] }
    ]
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.inversePatch.ops, [
    { op: "addEdge", edge: graph.edges[0] },
    { op: "setNodeParams", nodeId: "slider_1", params: { value: 0.75 } },
    { op: "setNodeParams", nodeId: "slider_1", params: { value: 0.5 } }
  ]);
});

test("reports invert failures without mutating input graph", async () => {
  const graph = await readJson("fixtures/graph/v0.1/valid/minimal-value.graph.json");
  graph.revision = "1";
  const cases = [
    [
      {
        schema: "skenion.graph.patch",
        schemaVersion: "0.1.0",
        id: "bad_op",
        baseRevision: "1",
        ops: [{ op: "moveNode", nodeId: "slider_1" }]
      },
      /must match exactly one schema/
    ],
    [
      {
        schema: "skenion.graph.patch",
        schemaVersion: "0.1.0",
        id: "wrong_base",
        baseRevision: "0",
        ops: []
      },
      /baseRevision 0/
    ],
    [
      {
        schema: "skenion.graph.patch",
        schemaVersion: "0.1.0",
        id: "duplicate_node",
        baseRevision: "1",
        ops: [{ op: "addNode", node: graph.nodes[0] }]
      },
      /already exists/
    ],
    [
      {
        schema: "skenion.graph.patch",
        schemaVersion: "0.1.0",
        id: "remove_missing_node",
        baseRevision: "1",
        ops: [{ op: "removeNode", nodeId: "missing" }]
      },
      /does not exist/
    ],
    [
      {
        schema: "skenion.graph.patch",
        schemaVersion: "0.1.0",
        id: "set_params_missing_node",
        baseRevision: "1",
        ops: [{ op: "setNodeParams", nodeId: "missing", params: {} }]
      },
      /does not exist/
    ],
    [
      {
        schema: "skenion.graph.patch",
        schemaVersion: "0.1.0",
        id: "set_param_missing_node",
        baseRevision: "1",
        ops: [{ op: "setNodeParam", nodeId: "missing", key: "value", value: 1 }]
      },
      /does not exist/
    ],
    [
      {
        schema: "skenion.graph.patch",
        schemaVersion: "0.1.0",
        id: "duplicate_edge",
        baseRevision: "1",
        ops: [{ op: "addEdge", edge: graph.edges[0] }]
      },
      /already exists/
    ],
    [
      {
        schema: "skenion.graph.patch",
        schemaVersion: "0.1.0",
        id: "missing_edge",
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
      },
      /does not exist/
    ],
    [
      {
        schema: "skenion.graph.patch",
        schemaVersion: "0.1.0",
        id: "invalid_result",
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
      },
      /missing target port/
    ]
  ];

  for (const [patch, expected] of cases) {
    const result = invertGraphPatch(graph, patch);
    assert.equal(result.ok, false, patch.id);
    assert.match(result.errors.join("\n"), expected, patch.id);
  }

  assert.equal(graph.nodes.length, 2);
  assert.equal(graph.edges.length, 1);
});
