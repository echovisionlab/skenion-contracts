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
  createDefaultViewStateForGraph,
  controlMessageV01Schema,
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
  planConversion,
  projectV01Schema,
  representationForDataType,
  representationRegistryV01,
  shaderDiagnosticV01Schema,
  shaderInterfaceV01Schema,
  viewStateV01Schema,
  analyzeShaderInterfaceV01,
  shaderInterfaceToPortsV01,
  analyzeGraphDocumentV02,
  validateGraphPatchEvent,
  validateGraphPatchHistory,
  validateGraphPatch,
  validateControlMessage,
  validateGraphDocument,
  validateGraphDocumentV02,
  validateNodeDefinition,
  validateNodeDefinitionV02,
  validateProjectDocument,
  validateViewState,
  validateShaderInterface
} from "../dist/index.js";

const repoRoot = path.resolve(import.meta.dirname, "../../..");

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(repoRoot, relativePath), "utf8"));
}

test("exports v0.1 graph and node definition schemas", () => {
  assert.equal(graphV01Schema.properties.schemaVersion.const, "0.1.0");
  assert.equal(projectV01Schema.properties.schema.const, "skenion.project");
  assert.equal(viewStateV01Schema.properties.schema.const, "skenion.view-state");
  assert.equal(graphPatchV01Schema.properties.schema.const, "skenion.graph.patch");
  assert.equal(graphPatchEventV01Schema.properties.schema.const, "skenion.graph.patch.event");
  assert.equal(graphPatchHistoryV01Schema.properties.schema.const, "skenion.graph.patch.history");
  assert.equal(nodeDefinitionV01Schema.properties.schema.const, "skenion.node.definition");
  assert.equal(shaderInterfaceV01Schema.properties.schema.const, "skenion.shader.interface");
  assert.equal(controlMessageV01Schema.properties.selector.type, "string");
  assert.deepEqual(shaderDiagnosticV01Schema.properties.phase.enum, [
    "interface-analysis",
    "source-sync",
    "wgsl-generation",
    "wgsl-compile",
    "render-pipeline",
    "render-frame"
  ]);
});

test("validates control messages as selector and atoms", () => {
  const bang = validateControlMessage({ selector: "bang", atoms: [] });
  assert.equal(bang.ok, true);

  const set = validateControlMessage({
    selector: "set",
    atoms: [
      { type: "f32", value: 0.75 },
      { type: "float", representation: "f32", value: 0.75 },
      { type: "int", representation: "i32", value: 3 },
      { type: "uint", representation: "u8", value: 255 },
      { type: "string", value: "speed" },
      { type: "color", representation: "rgba32f", value: [1, 0.25, 0, 1] }
    ]
  });
  assert.equal(set.ok, false);
  assert.match(set.errors.join("\n"), /must be equal to constant/);

  const canonicalSet = validateControlMessage({
    selector: "set",
    atoms: [
      { type: "float", representation: "f32", value: 0.75 },
      { type: "int", representation: "i32", value: 3 },
      { type: "uint", representation: "u8", value: 255 },
      { type: "string", value: "speed" },
      { type: "color", representation: "rgba32f", value: [1, 0.25, 0, 1] }
    ]
  });
  assert.equal(canonicalSet.ok, true);

  const invalidLegacyBang = validateControlMessage({ type: "bang" });
  assert.equal(invalidLegacyBang.ok, false);
  assert.match(invalidLegacyBang.errors.join("\n"), /must have required property 'selector'/);
});

test("validates project documents and view state fixtures", async () => {
  const project = await readJson("fixtures/project/v0.1/valid/minimal.project.json");
  const result = validateProjectDocument(project);

  assert.equal(result.ok, true);
  assert.equal(validateViewState(project.viewState).ok, true);

  const partialViewProject = await readJson("fixtures/project/v0.1/valid/object-routing-panel.project.json");
  assert.equal(validateProjectDocument(partialViewProject).ok, true);
});

test("rejects invalid project view state", async () => {
  const missingNode = await readJson("fixtures/project/v0.1/invalid/view-references-missing-node.project.json");
  const missingNodeResult = validateProjectDocument(missingNode);
  assert.equal(missingNodeResult.ok, false);
  assert.match(missingNodeResult.errors.join("\n"), /viewState references missing graph node/);

  const invalidPosition = await readJson("fixtures/project/v0.1/invalid/invalid-view-position.project.json");
  const invalidPositionResult = validateProjectDocument(invalidPosition);
  assert.equal(invalidPositionResult.ok, false);
  assert.match(invalidPositionResult.errors.join("\n"), /must be number/);

  const invalidViewStateResult = validateViewState({
    schema: "skenion.view-state",
    schemaVersion: "0.1.0",
    canvas: {
      nodes: {
        value_1: {
          x: 0,
          y: 0,
          width: 0
        }
      }
    }
  });
  assert.equal(invalidViewStateResult.ok, false);
  assert.match(invalidViewStateResult.errors.join("\n"), /must be > 0/);
});

test("creates default view state for graph nodes", async () => {
  const graph = await readJson("fixtures/graph/v0.1/valid/minimal-value.graph.json");
  const viewState = createDefaultViewStateForGraph(graph);

  assert.equal(viewState.schema, "skenion.view-state");
  assert.deepEqual(Object.keys(viewState.canvas.nodes), ["slider_1", "blur_1"]);
  assert.deepEqual(viewState.canvas.nodes.slider_1, { x: 96, y: 96 });
  assert.deepEqual(viewState.canvas.nodes.blur_1, { x: 376, y: 96 });
  assert.deepEqual(viewState.canvas.viewport, { x: 0, y: 0, zoom: 1 });
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

test("accepts message.any targets across control message flows", () => {
  const graph = {
    schema: "skenion.graph",
    schemaVersion: "0.1.0",
    id: "message-any-control",
    revision: "1",
    nodes: [
      {
        id: "string_1",
        kind: "core.string",
        kindVersion: "0.1.0",
        params: { value: "ready" },
        ports: [
          {
            id: "value",
            direction: "output",
            label: "Value",
            type: { flow: "value", dataKind: "string" }
          }
        ]
      },
      {
        id: "message_1",
        kind: "core.message",
        kindVersion: "0.1.0",
        params: { value: "perform" },
        ports: [
          {
            id: "in",
            direction: "input",
            label: "In",
            type: { flow: "event", dataKind: "message.any" },
            required: false,
            activation: "trigger"
          }
        ]
      }
    ],
    edges: [
      {
        from: { node: "string_1", port: "value" },
        to: { node: "message_1", port: "in" }
      }
    ]
  };

  assert.equal(validateGraphDocument(graph).ok, true);
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

test("accepts numeric representation mismatches as implicit conversion", async () => {
  const graph = await readJson("fixtures/graph/v0.1/valid/minimal-value.graph.json");
  graph.nodes[0].ports[0].type.format = "f32";
  graph.nodes[1].ports[0].type.format = "f16";

  const result = validateGraphDocument(graph);

  assert.equal(result.ok, true);
});

test("accepts source formats included by a target port", async () => {
  const graph = await readJson("fixtures/graph/v0.1/valid/minimal-value.graph.json");
  graph.nodes[0].ports[0].type.format = "f32";
  graph.nodes[1].ports[0].type.format = ["f16", "f32"];

  const result = validateGraphDocument(graph);

  assert.equal(result.ok, true);
});

test("accepts absent source or target format constraints", async () => {
  const graphWithOnlyTargetFormat = await readJson("fixtures/graph/v0.1/valid/minimal-value.graph.json");
  graphWithOnlyTargetFormat.nodes[1].ports[0].type.format = "f32";
  assert.equal(validateGraphDocument(graphWithOnlyTargetFormat).ok, true);

  const graphWithOnlySourceFormat = await readJson("fixtures/graph/v0.1/valid/minimal-value.graph.json");
  graphWithOnlySourceFormat.nodes[0].ports[0].type.format = "f32";
  assert.equal(validateGraphDocument(graphWithOnlySourceFormat).ok, true);
});

test("accepts target scalar formats that include every source format", async () => {
  const graph = await readJson("fixtures/graph/v0.1/valid/minimal-value.graph.json");
  graph.nodes[0].ports[0].type.format = ["f32"];
  graph.nodes[1].ports[0].type.format = "f32";

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

  assert.deepEqual([...ids].sort(), [...builtinManifestV01.nodes].sort());

  const valueDefinition = getBuiltinNodeDefinition("core.float");
  assert.deepEqual(valueDefinition?.ports.map((port) => port.id), ["in", "set", "bang", "value"]);
  assert.equal(valueDefinition?.ports.find((port) => port.id === "in")?.activation, "trigger");
  assert.equal(valueDefinition?.ports.find((port) => port.id === "set")?.activation, "latched");
  assert.equal(valueDefinition?.ports.find((port) => port.id === "bang")?.type.dataKind, "event.bang");
  const valueOutputType = valueDefinition?.ports.find((port) => port.id === "value")?.type;
  assert.equal(valueOutputType?.dataKind, "number.float");
  assert.equal(Boolean(valueOutputType && "range" in valueOutputType), false);

  const i32Definition = getBuiltinNodeDefinition("core.int");
  assert.deepEqual(i32Definition?.ports.map((port) => port.id), ["in", "set", "bang", "value"]);
  assert.equal(i32Definition?.ports.find((port) => port.id === "value")?.type.dataKind, "number.int");
  assert.equal(i32Definition?.ports.find((port) => port.id === "value")?.type.format, "i32");

  const uintDefinition = getBuiltinNodeDefinition("core.uint");
  assert.deepEqual(uintDefinition?.ports.map((port) => port.id), ["in", "set", "bang", "value"]);
  assert.equal(uintDefinition?.ports.find((port) => port.id === "value")?.type.dataKind, "number.uint");
  assert.equal(uintDefinition?.ports.find((port) => port.id === "value")?.type.format, "u32");

  const boolDefinition = getBuiltinNodeDefinition("core.bool");
  assert.deepEqual(boolDefinition?.ports.map((port) => port.id), ["in", "set", "bang", "value"]);
  assert.equal(boolDefinition?.ports.find((port) => port.id === "value")?.type.dataKind, "boolean");

  const colorDefinition = getBuiltinNodeDefinition("core.color");
  assert.deepEqual(colorDefinition?.ports.map((port) => port.id), ["in", "set", "bang", "value"]);
  assert.equal(colorDefinition?.ports.find((port) => port.id === "value")?.type.dataKind, "color");
  assert.equal(colorDefinition?.ports.find((port) => port.id === "value")?.type.format, "rgba32f");

  const stringDefinition = getBuiltinNodeDefinition("core.string");
  assert.deepEqual(stringDefinition?.ports.map((port) => port.id), ["in", "set", "bang", "value"]);
  assert.equal(stringDefinition?.ports.find((port) => port.id === "value")?.type.dataKind, "string");

  const toggleDefinition = getBuiltinNodeDefinition("core.toggle");
  assert.deepEqual(toggleDefinition?.ports.map((port) => port.id), ["in", "set", "bang", "value"]);
  assert.equal(toggleDefinition?.ports.find((port) => port.id === "value")?.type.dataKind, "boolean");

  const commentDefinition = getBuiltinNodeDefinition("core.comment");
  assert.deepEqual(commentDefinition?.ports.map((port) => port.id), []);

  const panelDefinition = getBuiltinNodeDefinition("core.panel");
  assert.deepEqual(panelDefinition?.ports.map((port) => port.id), ["set"]);
  assert.equal(panelDefinition?.ports.find((port) => port.id === "set")?.type.dataKind, "message.any");

  const messageDefinition = getBuiltinNodeDefinition("core.message");
  assert.deepEqual(messageDefinition?.ports.map((port) => port.id), ["in", "set", "bang", "value"]);
  assert.equal(messageDefinition?.ports.find((port) => port.id === "in")?.type.dataKind, "message.any");
  assert.equal(messageDefinition?.ports.find((port) => port.id === "set")?.type.dataKind, "message.any");
  assert.equal(messageDefinition?.ports.find((port) => port.id === "value")?.type.dataKind, "message.any");

  const sliderDefinition = getBuiltinNodeDefinition("ui.slider-float");
  assert.deepEqual(sliderDefinition?.ports.map((port) => port.id), ["in", "set", "bang", "value"]);
  assert.equal(sliderDefinition?.ports.find((port) => port.id === "value")?.type.dataKind, "number.float");

  const buttonDefinition = getBuiltinNodeDefinition("ui.button");
  assert.deepEqual(buttonDefinition?.ports.map((port) => port.id), ["in", "bang"]);
  assert.equal(buttonDefinition?.ports.find((port) => port.id === "in")?.type.dataKind, "message.any");

  const uiToggleDefinition = getBuiltinNodeDefinition("ui.toggle");
  assert.deepEqual(uiToggleDefinition?.ports.map((port) => port.id), ["in", "set", "value"]);
  assert.equal(uiToggleDefinition?.ports.find((port) => port.id === "in")?.type.dataKind, "message.any");

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
  assert.equal(builtinManifestV01.canonicalDataKinds.includes("number.float"), true);
  assert.equal(builtinManifestV01.canonicalDataKinds.includes("number.int"), true);
  assert.equal(builtinManifestV01.canonicalDataKinds.includes("number.uint"), true);
  assert.equal(builtinManifestV01.canonicalDataKinds.includes("boolean"), true);
  assert.equal(builtinManifestV01.canonicalDataKinds.includes("string"), true);
  assert.equal(builtinManifestV01.canonicalDataKinds.includes("message.any"), true);
  assert.equal(builtinManifestV01.canonicalDataKinds.includes("event.bang"), true);
  assert.equal(builtinManifestV01.canonicalDataKinds.includes("f32"), false);
  assert.equal(builtinManifestV01.canonicalDataKinds.includes("number.f32"), false);
  assert.equal(builtinManifestV01.canonicalDataKinds.includes("bang"), false);
  assert.deepEqual(builtinManifestV01.representations["number.float"].includes("f8.e4m3"), true);
  assert.deepEqual(builtinManifestV01.representations.color.includes("rgba8unorm"), true);
});

test("plans implicit numeric and color representation conversions", () => {
  assert.equal(representationRegistryV01.some((representation) => representation.id === "f8.e4m3"), true);
  assert.equal(representationRegistryV01.some((representation) => representation.id === "ufloat8"), true);
  assert.equal(representationRegistryV01.some((representation) => representation.id === "ufloat16"), true);
  assert.equal(representationRegistryV01.some((representation) => representation.id === "rgba8unorm"), true);

  const knownRepresentations = new Set(representationRegistryV01.map((representation) => representation.id));
  const valueType = (dataKind, format) => ({ flow: "value", dataKind, format });
  const assertImplicitConversion = (label, source, target, expectedPolicy) => {
    const plan = planConversion(source, target);
    assert.equal(plan.ok, true, `${label} should be implicit`);
    assert.equal(knownRepresentations.has(plan.source.representation), true, `${label} source representation is registered`);
    assert.equal(knownRepresentations.has(plan.target.representation), true, `${label} target representation is registered`);
    if (expectedPolicy) {
      assert.equal(plan.steps[0].policy, expectedPolicy, `${label} policy`);
    }
    return plan;
  };

  const semanticConversions = [
    ["float -> float", valueType("number.float", "f32"), valueType("number.float", "f16"), "numeric-cast"],
    ["float -> int", valueType("number.float", "f32"), valueType("number.int", "i32"), "float-to-integer"],
    ["float -> uint", valueType("number.float", "f32"), valueType("number.uint", "u32"), "float-to-integer"],
    ["int -> int", valueType("number.int", "i32"), valueType("number.int", "i8"), "numeric-cast"],
    ["int -> uint", valueType("number.int", "i32"), valueType("number.uint", "u32"), "integer-signedness"],
    ["int -> float", valueType("number.int", "i32"), valueType("number.float", "f32"), "integer-to-float"],
    ["uint -> uint", valueType("number.uint", "u32"), valueType("number.uint", "u8"), "numeric-cast"],
    ["uint -> int", valueType("number.uint", "u32"), valueType("number.int", "i32"), "integer-signedness"],
    ["uint -> float", valueType("number.uint", "u32"), valueType("number.float", "f32"), "integer-to-float"],
    ["ufloat -> float", valueType("number.float", "ufloat8"), valueType("number.float", "f32"), "numeric-cast"],
    ["ufloat -> int", valueType("number.float", "ufloat16"), valueType("number.int", "i32"), "float-to-integer"],
    ["ufloat -> uint", valueType("number.float", "ufloat8"), valueType("number.uint", "u32"), "float-to-integer"],
    ["color -> color", valueType("color", "rgba32f"), valueType("color", "rgba8unorm"), "color-cast"]
  ];
  for (const [label, source, target, expectedPolicy] of semanticConversions) {
    assertImplicitConversion(label, source, target, expectedPolicy);
  }

  const representationConversions = [
    ["f32 -> f8", valueType("number.float", "f32"), valueType("number.float", "f8.e4m3"), "numeric-cast"],
    ["f8 -> f16", valueType("number.float", "f8.e4m3"), valueType("number.float", "f16"), "numeric-cast"],
    ["ufloat8 -> uint", valueType("number.float", "ufloat8"), valueType("number.uint", "u8"), "float-to-integer"],
    ["ufloat16 -> int", valueType("number.float", "ufloat16"), valueType("number.int", "i16"), "float-to-integer"],
    ["float -> uint", valueType("number.float", "f32"), valueType("number.uint", "u8"), "float-to-integer"],
    ["int -> float", valueType("number.int", "i32"), valueType("number.float", "f16"), "integer-to-float"],
    ["uint -> int", valueType("number.uint", "u32"), valueType("number.int", "i8"), "integer-signedness"],
    ["i32 -> i8", valueType("number.int", "i32"), valueType("number.int", "i8"), "numeric-cast"],
    ["u32 -> u8", valueType("number.uint", "u32"), valueType("number.uint", "u8"), "numeric-cast"],
    ["rgba32f -> rgba8unorm", valueType("color", "rgba32f"), valueType("color", "rgba8unorm"), "color-cast"],
    ["rgb -> rgba", valueType("color", "rgb8unorm"), valueType("color", "rgba8unorm"), "color-cast"],
    ["rgba -> rgb", valueType("color", "rgba8unorm"), valueType("color", "rgb8unorm"), "color-cast"]
  ];
  for (const [label, source, target, expectedPolicy] of representationConversions) {
    assertImplicitConversion(label, source, target, expectedPolicy);
  }

  const floatToByte = planConversion(
    { flow: "value", dataKind: "number.float", format: "f32" },
    { flow: "value", dataKind: "number.uint", format: "u8" }
  );
  assert.equal(floatToByte.lossy, true);
  assert.equal(floatToByte.steps[0].clamp, "saturating");
  assert.equal(floatToByte.steps[0].trunc, "toward-zero");

  const messageSink = planConversion(
    { flow: "value", dataKind: "string" },
    { flow: "event", dataKind: "message.any" }
  );
  assert.equal(messageSink.ok, true);
  assert.equal(messageSink.lossy, false);

  assert.equal(representationForDataType({ flow: "value", dataKind: "number.float", format: ["f16", "f32"] }), "f16");
  assert.equal(representationForDataType({ flow: "value", dataKind: "number.uint" }), "u32");
  assert.equal(representationForDataType({ flow: "value", dataKind: "string" }), undefined);

  const intNarrow = planConversion(
    { flow: "value", dataKind: "number.int", format: "i32" },
    { flow: "value", dataKind: "number.int", format: "i8" }
  );
  assert.equal(intNarrow.ok, true);
  assert.equal(intNarrow.lossy, true);
  assert.equal(intNarrow.steps[0].policy, "numeric-cast");

  const colorToUnorm = planConversion(
    { flow: "value", dataKind: "color", format: "rgba32f" },
    { flow: "value", dataKind: "color", format: "rgba8unorm" }
  );
  assert.equal(colorToUnorm.ok, true);
  assert.equal(colorToUnorm.lossy, true);
  assert.equal(colorToUnorm.steps[0].policy, "color-cast");
  assert.equal(colorToUnorm.steps[0].clamp, "unit");

  const intToFloat = planConversion(
    { flow: "value", dataKind: "number.int", format: "i32" },
    { flow: "value", dataKind: "number.float", format: "f32" }
  );
  assert.equal(intToFloat.ok, true);
  assert.equal(intToFloat.steps[0].policy, "integer-to-float");

  const uintToInt = planConversion(
    { flow: "value", dataKind: "number.uint", format: "u32" },
    { flow: "value", dataKind: "number.int", format: "i16" }
  );
  assert.equal(uintToInt.ok, true);
  assert.equal(uintToInt.steps[0].policy, "integer-signedness");

  const colorIdentity = planConversion(
    { flow: "value", dataKind: "color", format: "rgba32f" },
    { flow: "value", dataKind: "color", format: "rgba32f" }
  );
  assert.equal(colorIdentity.ok, true);
  assert.equal(colorIdentity.lossy, false);
  assert.equal(colorIdentity.diagnostics.length, 0);

  const incompatible = planConversion(
    { flow: "value", dataKind: "boolean" },
    { flow: "event", dataKind: "event.bang" }
  );
  assert.equal(incompatible.ok, false);

  const sameFlowIncompatible = planConversion(
    { flow: "value", dataKind: "boolean" },
    { flow: "value", dataKind: "color", format: "rgba32f" }
  );
  assert.equal(sameFlowIncompatible.ok, false);

  const numericToBoolean = planConversion(
    { flow: "value", dataKind: "number.float", format: "f32" },
    { flow: "value", dataKind: "boolean" }
  );
  assert.equal(numericToBoolean.ok, false);

  const booleanToNumeric = planConversion(
    { flow: "value", dataKind: "boolean" },
    { flow: "value", dataKind: "number.float", format: "f32" }
  );
  assert.equal(booleanToNumeric.ok, false);

  const unknownRepresentation = planConversion(
    { flow: "value", dataKind: "number.float", format: "float.custom" },
    { flow: "value", dataKind: "number.float", format: "float.other" }
  );
  assert.equal(unknownRepresentation.ok, false);

  assert.equal(planConversion(
    { flow: "value", dataKind: "number.float", format: "f32" },
    { flow: "value", dataKind: "number.float", format: "float.other" }
  ).ok, false);
  assert.equal(planConversion(
    { flow: "value", dataKind: "number.float", format: "float.custom" },
    { flow: "value", dataKind: "number.float", format: "f32" }
  ).ok, false);
  assert.equal(planConversion(
    { flow: "value", dataKind: "number.float", format: "i32" },
    { flow: "value", dataKind: "number.float", format: "f32" }
  ).ok, false);
  assert.equal(planConversion(
    { flow: "value", dataKind: "color", format: "f32" },
    { flow: "value", dataKind: "color", format: "rgba32f" }
  ).ok, false);
  assert.equal(planConversion(
    { flow: "value", dataKind: "color", format: "rgba32f" },
    { flow: "value", dataKind: "color", format: "color.custom" }
  ).ok, false);
});

test("analyzes WGSL shader uniform annotations into dynamic ports", () => {
  const source = [
    "// @skenion.uniform speed number.float default=0.5 min=0 max=2 step=0.01 label=\"Speed Amount\"",
    "// @skenion.uniform enabled boolean default=true",
    "// @skenion.uniform disabled boolean default=false",
    "// @skenion.uniform iterations number.int default=8",
    "// @skenion.uniform seed number.uint default=4",
    "// @skenion.uniform tint color default=[1,0.2,0.1,1]",
    "fn fs_main() -> @location(0) vec4<f32> { return vec4<f32>(1.0); }"
  ].join("\n");

  const result = analyzeShaderInterfaceV01(source, { language: "wgsl" });

  assert.equal(result.ok, true);
  assert.equal(result.diagnostics.length, 0);
  assert.equal(validateShaderInterface(result.shaderInterface).ok, true);
  assert.deepEqual(
    result.shaderInterface.uniforms.map((uniform) => [uniform.id, uniform.type.dataKind, uniform.default]),
    [
      ["speed", "number.float", 0.5],
      ["enabled", "boolean", true],
      ["disabled", "boolean", false],
      ["iterations", "number.int", 8],
      ["seed", "number.uint", 4],
      ["tint", "color", [1, 0.2, 0.1, 1]]
    ]
  );
  assert.equal(result.shaderInterface.uniforms[0].label, "Speed Amount");
  assert.deepEqual(result.shaderInterface.uniforms[0].type.range, { min: 0, max: 2, step: 0.01 });
  assert.equal(result.shaderInterface.uniforms[0].type.format, "f32");
  assert.equal(result.shaderInterface.uniforms[3].type.format, "i32");
  assert.equal(result.shaderInterface.uniforms[4].type.format, "u32");
  assert.equal(result.shaderInterface.uniforms[5].type.format, "rgba32f");

  const ports = shaderInterfaceToPortsV01(result.shaderInterface);
  assert.deepEqual(ports.map((port) => port.id), ["speed", "enabled", "disabled", "iterations", "seed", "tint", "out"]);
  assert.equal(ports[0].activation, "latched");
  assert.equal(ports[6].direction, "output");
  assert.equal(ports[6].type.dataKind, "gpu.texture2d");
});

test("reports shader uniform annotation diagnostics", () => {
  const source = [
    "// @skenion.uniform",
    "const note = \"@skenion.uniform\";",
    "// @skenion.uniform 1bad number.float default=nope min=nope step=-1",
    "// @skenion.uniform out number.float",
    "// @skenion.uniform speed vec3 default=0",
    "// @skenion.uniform speed number.float default=0.2",
    "// @skenion.uniform badFloat number.float default=nope",
    "// @skenion.uniform flag boolean default=maybe",
    "// @skenion.uniform count number.int default=1.5",
    "// @skenion.uniform badSeed number.uint default=-1",
    "// @skenion.uniform color color default=nope",
    "// @skenion.uniform color2 color default=[1,2,3]",
    "// @skenion.uniform ranged number.float min=nope max=Infinity step=-1",
    "// @skenion.uniform plain number.float label=Plain"
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
  assert.equal(result.diagnostics.find((diagnostic) => diagnostic.code === "invalid-default")?.column, 43);
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
        type: { flow: "value", dataKind: "number.float" },
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

  const valueHelp = getBuiltinNodeHelp("core.float");
  assert.match(valueHelp?.summary ?? "", /floating-point/);
  assert.deepEqual(valueHelp?.ports?.map((port) => port.id), ["in", "set", "bang", "value"]);
  assert.equal(valueHelp?.docsPath, "docs/nodes/core.float.md");
  assert.equal(valueHelp?.helpGraph, "help/v0.1/nodes/core.float.help.graph.json");
  assert.equal(valueHelp?.tags.includes("control"), true);

  const toggleHelp = getBuiltinNodeHelp("core.toggle");
  assert.match(toggleHelp?.ports?.find((port) => port.id === "bang")?.description ?? "", /Flips/);

  const shaderHelp = getBuiltinNodeHelp("render.fullscreen-shader");
  assert.match(shaderHelp?.runtimeBehavior ?? "", /dynamic uniform layout/);
  assert.equal(shaderHelp?.relatedNodes?.includes("render.output"), true);

  const valueHelpGraph = getBuiltinNodeHelpGraph("core.float");
  assert.equal(valueHelpGraph?.id, "help-core-float");
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
          kind: "core.float",
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
      kind: "core.float",
      kindVersion: "0.1.0",
      params: {},
      ports: [
        {
          id: "value",
          direction: "output",
          type: { flow: "value", dataKind: "number.float" }
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
          type: { flow: "value", dataKind: "number.float" },
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
            type: { flow: "value", dataKind: "number.float" },
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
  scalarSourceFormatGraph.nodes[0].ports[0].type.format = "f32";
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
            type: { flow: "value", dataKind: "number.float", format: ["f32"] },
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
  formatMismatchGraph.nodes[0].ports[0].type.format = ["f16"];
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
            type: { flow: "value", dataKind: "number.float", format: "f32" },
            required: false,
            activation: "latched"
          }
        ]
      }
    ]
  }, { nextRevision: "2" });
  assert.equal(formatMismatchResult.ok, true);
  assert.equal(formatMismatchResult.graph.edges.length, 1);

  graph.nodes[0].ports[0].type.format = ["f32"];
  const replacementPorts = [
    {
      id: "radius",
      direction: "input",
      label: "Radius",
      type: { flow: "value", dataKind: "number.float", format: ["f32"] },
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
        type: { flow: "value", dataKind: "number.float" },
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
