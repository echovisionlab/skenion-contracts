import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import {
  applyGraphPatch,
  builtinManifestV01,
  builtinNodeHelpGraphsV01,
  builtinNodeHelpV01,
  builtinNodeDefinitionsV01,
  createDefaultViewStateForGraph,
  derivePatchContractV02,
  derivePatchContractsV02,
  controlMessageV01Schema,
  extensionManifestV01Schema,
  getBuiltinNodeDefinition,
  getBuiltinNodeHelp,
  getBuiltinNodeHelpGraph,
  graphFragmentV02Schema,
  graphPatchEventV01Schema,
  graphPatchHistoryV01Schema,
  graphPatchV01Schema,
  graphV01Schema,
  graphV02Schema,
  invertGraphPatch,
  nodeDefinitionV01Schema,
  nodeDefinitionV02Schema,
  objectTextParseResultV01Schema,
  planAudioClockBridgeV01,
  planConversion,
  projectV01Schema,
  projectV02Schema,
  runtimeOperationV0Schema,
  runtimeSessionV0Schema,
  parseObjectTextV01,
  representationForDataType,
  representationRegistryV01,
  shaderDiagnosticV01Schema,
  shaderInterfaceV01Schema,
  viewStateV01Schema,
  analyzeShaderInterfaceV01,
  shaderInterfaceToPortsV01,
  analyzeGraphDocumentV02,
  analyzeGraphFragmentV02,
  applyMidiClockMessageV01,
  createInitialMidiClockSnapshotV01,
  midiClockSnapshotToClockStateV01,
  parseMidiClockMessageV01,
  validateGraphPatchEvent,
  validateGraphPatchHistory,
  validateGraphPatch,
  validateControlMessage,
  validateExtensionManifestV01,
  validateObjectTextParseResult,
  validateGraphDocument,
  validateGraphDocumentV02,
  validateGraphFragmentV02,
  validateNodeDefinition,
  validateNodeDefinitionV02,
  validatePatchDefinitionV02,
  validatePasteGraphFragmentRequest,
  validatePasteGraphFragmentResponse,
  validateProjectDocument,
  validateProjectDocumentV02,
  validateRuntimeOperationEnvelope,
  validateRuntimeSessionEvent,
  validateRuntimeSessionInfoResponse,
  validateViewState,
  validateShaderInterface,
  isPasteGraphFragmentRequest,
  isPasteGraphFragmentResponse,
  isRuntimeOperationEnvelope,
  isRuntimeSessionEvent,
  isRuntimeSessionInfoResponse
} from "../dist/index.js";

const repoRoot = path.resolve(import.meta.dirname, "../../..");

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(repoRoot, relativePath), "utf8"));
}

async function fixtureFiles(relativePath) {
  const directory = path.join(repoRoot, relativePath);
  return (await readdir(directory))
    .filter((fileName) => fileName.endsWith(".json"))
    .sort()
    .map((fileName) => path.join(relativePath, fileName));
}

test("exports v0.1 graph and node definition schemas", () => {
  assert.equal(graphV01Schema.properties.schemaVersion.const, "0.1.0");
  assert.equal(projectV01Schema.properties.schema.const, "skenion.project");
  assert.equal(viewStateV01Schema.properties.schema.const, "skenion.view-state");
  assert.equal(graphPatchV01Schema.properties.schema.const, "skenion.graph.patch");
  assert.equal(graphPatchEventV01Schema.properties.schema.const, "skenion.graph.patch.event");
  assert.equal(graphPatchHistoryV01Schema.properties.schema.const, "skenion.graph.patch.history");
  assert.equal(nodeDefinitionV01Schema.properties.schema.const, "skenion.node.definition");
  assert.equal(objectTextParseResultV01Schema.properties.schema.const, "skenion.object-text.parse-result");
  assert.equal(extensionManifestV01Schema.properties.schema.const, "skenion.extension.manifest");
  assert.equal(shaderInterfaceV01Schema.properties.schema.const, "skenion.shader.interface");
  assert.equal(runtimeSessionV0Schema.properties.schema.const, "skenion.runtime.session.info");
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

test("validates runtime session profile and replay fixtures", async () => {
  const infoFixtures = [
    "fixtures/runtime-session/v0/valid/local-managed-session-info.json",
    "fixtures/runtime-session/v0/valid/local-shared-session-info.json",
    "fixtures/runtime-session/v0/valid/remote-session-info.json"
  ];

  for (const fixture of infoFixtures) {
    const info = await readJson(fixture);
    const infoResult = validateRuntimeSessionInfoResponse(info);

    assert.equal(infoResult.ok, true, fixture);
    assert.equal(isRuntimeSessionInfoResponse(info), true, fixture);
    assert.equal(info.capabilities.authPolicy, "deferred");
  }

  const localManaged = await readJson("fixtures/runtime-session/v0/valid/local-managed-session-info.json");
  assert.equal(localManaged.profile.mode, "local-managed");
  assert.equal(localManaged.profile.ownership, "owned-child");
  assert.deepEqual(localManaged.capabilities.profiles, ["local-managed", "local-shared", "remote"]);

  const event = await readJson("fixtures/runtime-session/v0/valid/replayed-session-event.json");
  const eventResult = validateRuntimeSessionEvent(event);

  assert.equal(eventResult.ok, true);
  assert.equal(isRuntimeSessionEvent(event), true);
  assert.equal(event.sessionId, "session-a");
  assert.equal(event.sessionRevision, event.snapshot.sessionRevision);
  assert.equal(event.replay.gap.reason, "retention-overflow");

  const invalidInfoFixtures = [
    "fixtures/runtime-session/v0/invalid/invalid-profile-mode.session-info.json",
    "fixtures/runtime-session/v0/invalid/ownership-mismatch.session-info.json"
  ];

  for (const fixture of invalidInfoFixtures) {
    const invalidInfo = await readJson(fixture);
    const invalidInfoResult = validateRuntimeSessionInfoResponse(invalidInfo);

    assert.equal(invalidInfoResult.ok, false, fixture);
    assert.equal(isRuntimeSessionInfoResponse(invalidInfo), false, fixture);
  }

  const extraProfile = structuredClone(localManaged);
  extraProfile.profile.endpoint.extra = true;
  assert.equal(validateRuntimeSessionInfoResponse(extraProfile).ok, false);
  assert.equal(isRuntimeSessionInfoResponse(extraProfile), false);

  const invalidEventFixtures = [
    "fixtures/runtime-session/v0/invalid/missing-replay.session-event.json",
    "fixtures/runtime-session/v0/invalid/empty-replay-cursor.session-event.json",
    "fixtures/runtime-session/v0/invalid/replay-additional-property.session-event.json"
  ];

  for (const fixture of invalidEventFixtures) {
    const invalidEvent = await readJson(fixture);
    const invalidEventResult = validateRuntimeSessionEvent(invalidEvent);

    assert.equal(invalidEventResult.ok, false, fixture);
    assert.equal(isRuntimeSessionEvent(invalidEvent), false, fixture);
  }

  const extraReplay = structuredClone(event);
  extraReplay.replay.extra = true;
  assert.equal(validateRuntimeSessionEvent(extraReplay).ok, false);
  assert.equal(isRuntimeSessionEvent(extraReplay), false);
});

test("validates extension package manifests with help and tests", async () => {
  const manifest = await readJson("fixtures/extension/v0.1/valid/minimal-native-extension.manifest.json");
  const result = validateExtensionManifestV01(manifest);

  assert.equal(result.ok, true);
  assert.equal(manifest.id, "example/native-sensor");
  assert.equal(manifest.provides.help[0].markdownPath, "help/sensor-reading.md");
  assert.equal(manifest.tests[0].fixturePath, "tests/sensor-reading.input.json");

  const invalidAbi = await readJson("fixtures/extension/v0.1/invalid/abi-mismatch.manifest.json");
  const invalidResult = validateExtensionManifestV01(invalidAbi);

  assert.equal(invalidResult.ok, false);
  assert.match(invalidResult.errors.join("\n"), /must be equal to constant/);
});

test("documents runtime IO discovery HTTP API", async () => {
  const openApi = await readFile(path.join(repoRoot, "openapi/runtime-http.v0.yaml"), "utf8");

  for (const pathName of [
    "/v0/io/devices:"
  ]) {
    assert.match(openApi, new RegExp(pathName.replace(/[{}]/g, "\\$&")));
  }

  for (const legacyPath of [
    "/v0/clock/midi/inputs:",
    "/v0/clock/midi/start:",
    "/v0/clock/midi/stop:",
    "/v0/clock/sources:",
    "/v0/clock/sources/{sourceId}:"
  ]) {
    assert.doesNotMatch(openApi, new RegExp(legacyPath.replace(/[{}]/g, "\\$&")));
  }

  for (const schemaName of [
    "RuntimeIoDeviceListResponse",
    "RuntimeIoDeviceDescriptor",
    "RuntimeIoBindingConfig",
    "RuntimeIoDiagnostic",
    "RuntimeSessionInfoResponse",
    "RuntimeConnectionProfile",
    "RuntimeSessionCapabilitySet",
    "RuntimeEventReplayMetadata",
    "RuntimeOperationEnvelope",
    "PasteGraphFragmentRequest",
    "PasteGraphFragmentResponse",
    "GraphTargetRef",
    "PatchPath",
    "IdRemapResult",
    "RuntimeOperationDiagnostic"
  ]) {
    assert.match(openApi, new RegExp(`\\b${schemaName}:`));
  }

  assert.match(openApi, /\/v0\/sessions\/\{sessionId\}:/);
  assert.match(openApi, /\/v0\/sessions\/\{sessionId\}\/operations:/);
  assert.match(openApi, /\/v0\/sessions\/\{sessionId\}\/events\/stream:/);
  assert.match(openApi, /Compatibility\/default-session alias/);
  assert.match(openApi, /name: since/);
  assert.match(openApi, /authPolicy:/);
  assert.match(openApi, /sessions\.events\.stream/);
  assert.match(openApi, /sessionId:/);
});

test("validates object text parse result fixtures", async () => {
  const add = await readJson("fixtures/object-text/v0.1/valid/add-int.parse.json");
  const addResult = validateObjectTextParseResult(add);

  assert.equal(addResult.ok, true);
  assert.equal(add.resolvedKind, "core.operator.add");
  assert.deepEqual(add.instancePorts.map((port) => port.id), ["in", "right", "out"]);

  const scalarAudio = await readJson("fixtures/object-text/v0.1/valid/audio-mul-scalar.parse.json");
  const scalarResult = validateObjectTextParseResult(scalarAudio);

  assert.equal(scalarResult.ok, true);
  assert.equal(scalarAudio.resolvedKind, "audio.operator.mul");
  assert.deepEqual(scalarAudio.instancePorts.map((port) => `${port.id}:${port.type}:${port.rate}`), [
    "in:signal.audio:audio",
    "right:number.float:control",
    "out:signal.audio:audio"
  ]);

  const unsupported = await readJson("fixtures/object-text/v0.1/valid/unsupported-vanilla-object.parse.json");
  const unsupportedResult = validateObjectTextParseResult(unsupported);

  assert.equal(unsupportedResult.ok, true);
  assert.equal(unsupported.ok, false);
  assert.equal(unsupported.diagnostics[0].code, "deferred-object");

  const invalid = await readJson("fixtures/object-text/v0.1/invalid/missing-class-symbol.parse.json");
  const invalidResult = validateObjectTextParseResult(invalid);

  assert.equal(invalidResult.ok, false);
  assert.match(invalidResult.errors.join("\n"), /classSymbol/);
});

test("parses object text into golden parse results", async () => {
  for (const fixture of await fixtureFiles("fixtures/object-text/v0.1/valid")) {
    const expected = await readJson(fixture);
    assert.deepEqual(parseObjectTextV01(expected.input), expected, fixture);
  }

  const raw = parseObjectTextV01("+ 1");
  assert.equal(raw.ok, true);
  assert.equal(raw.input, "+ 1");
  assert.equal(raw.displayText, "+ 1");
  assert.equal(raw.resolvedKind, "core.operator.add");

  assert.deepEqual(parseObjectTextV01("+").params, { right: 0 });
  assert.equal(parseObjectTextV01("- 2").resolvedKind, "core.operator.sub");
  assert.equal(parseObjectTextV01("pow 2").resolvedKind, "core.operator.pow");
  assert.equal(parseObjectTextV01("min 2").resolvedKind, "core.operator.min");
  assert.equal(parseObjectTextV01("max 2").resolvedKind, "core.operator.max");
  assert.equal(parseObjectTextV01("sqrt").resolvedKind, "core.operator.sqrt");
  assert.equal(parseObjectTextV01("-~ 0.25").resolvedKind, "audio.operator.sub");
  assert.deepEqual(parseObjectTextV01("osc~").params, { frequency: 0 });
  assert.deepEqual(parseObjectTextV01("phasor~").params, { frequency: 0 });
  assert.equal(parseObjectTextV01("adc~").resolvedKind, "audio.input");
  assert.equal(parseObjectTextV01("dac~").resolvedKind, "audio.output");

  assert.equal(parseObjectTextV01("[+ 1").diagnostics[0].code, "invalid-syntax");
  assert.equal(parseObjectTextV01("+ 1]").diagnostics[0].code, "invalid-syntax");
  assert.equal(parseObjectTextV01("").diagnostics[0].code, "empty-object-text");
  assert.equal(parseObjectTextV01("+ 1 2").diagnostics[0].code, "invalid-arg-count");
  assert.equal(parseObjectTextV01("+ true").diagnostics[0].code, "invalid-arg-type");
  assert.equal(parseObjectTextV01("+ false").diagnostics[0].code, "invalid-arg-type");
  assert.equal(parseObjectTextV01("+ .").diagnostics[0].code, "invalid-arg-type");
  assert.equal(parseObjectTextV01("sqrt 1").diagnostics[0].code, "invalid-arg-count");
  assert.equal(parseObjectTextV01("*~ beep").diagnostics[0].code, "invalid-arg-type");
  assert.equal(parseObjectTextV01("sqrt~ 1").diagnostics[0].code, "invalid-arg-count");
  assert.equal(parseObjectTextV01("osc~ 1 2").diagnostics[0].code, "invalid-arg-count");
  assert.equal(parseObjectTextV01("phasor~ beep").diagnostics[0].code, "invalid-arg-type");
  assert.equal(parseObjectTextV01("square~").diagnostics[0].code, "deferred-object");
  assert.equal(parseObjectTextV01("adc~ 1").diagnostics[0].code, "invalid-arg-count");
  assert.equal(parseObjectTextV01("dac~ 1").diagnostics[0].code, "invalid-arg-count");
  assert.equal(parseObjectTextV01("expr").diagnostics[0].code, "deferred-object");
  assert.equal(parseObjectTextV01("expr~").diagnostics[0].code, "deferred-object");
  assert.equal(parseObjectTextV01("fexpr~").diagnostics[0].code, "deferred-object");
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
  assert.deepEqual(valueDefinition?.surface, { palette: "direct" });
  assert.deepEqual(valueDefinition?.ports.map((port) => port.id), ["in", "cold", "value"]);
  assert.equal(valueDefinition?.ports.find((port) => port.id === "in")?.activation, "trigger");
  assert.equal(valueDefinition?.ports.find((port) => port.id === "cold")?.activation, "latched");
  const valueOutputType = valueDefinition?.ports.find((port) => port.id === "value")?.type;
  assert.equal(valueOutputType?.dataKind, "number.float");
  assert.equal(Boolean(valueOutputType && "range" in valueOutputType), false);

  const i32Definition = getBuiltinNodeDefinition("core.int");
  assert.deepEqual(i32Definition?.ports.map((port) => port.id), ["in", "cold", "value"]);
  assert.equal(i32Definition?.ports.find((port) => port.id === "value")?.type.dataKind, "number.int");
  assert.equal(i32Definition?.ports.find((port) => port.id === "value")?.type.format, "i32");

  const uintDefinition = getBuiltinNodeDefinition("core.uint");
  assert.deepEqual(uintDefinition?.ports.map((port) => port.id), ["in", "cold", "value"]);
  assert.equal(uintDefinition?.ports.find((port) => port.id === "value")?.type.dataKind, "number.uint");
  assert.equal(uintDefinition?.ports.find((port) => port.id === "value")?.type.format, "u32");

  const boolDefinition = getBuiltinNodeDefinition("core.bool");
  assert.deepEqual(boolDefinition?.ports.map((port) => port.id), ["in", "cold", "value"]);
  assert.equal(boolDefinition?.ports.find((port) => port.id === "value")?.type.dataKind, "boolean");

  const colorDefinition = getBuiltinNodeDefinition("core.color");
  assert.deepEqual(colorDefinition?.ports.map((port) => port.id), ["in", "cold", "value"]);
  assert.equal(colorDefinition?.ports.find((port) => port.id === "value")?.type.dataKind, "color");
  assert.equal(colorDefinition?.ports.find((port) => port.id === "value")?.type.format, "rgba32f");

  const stringDefinition = getBuiltinNodeDefinition("core.string");
  assert.deepEqual(stringDefinition?.ports.map((port) => port.id), ["in", "cold", "value"]);
  assert.equal(stringDefinition?.ports.find((port) => port.id === "value")?.type.dataKind, "string");

  const commentDefinition = getBuiltinNodeDefinition("core.comment");
  assert.deepEqual(commentDefinition?.ports.map((port) => port.id), ["in"]);
  assert.equal(commentDefinition?.ports.find((port) => port.id === "in")?.type.flow, "event");
  assert.equal(commentDefinition?.ports.find((port) => port.id === "in")?.type.dataKind, "message.any");

  const panelDefinition = getBuiltinNodeDefinition("core.panel");
  assert.deepEqual(panelDefinition?.ports.map((port) => port.id), ["in"]);
  assert.equal(panelDefinition?.ports.find((port) => port.id === "in")?.type.flow, "event");
  assert.equal(panelDefinition?.ports.find((port) => port.id === "in")?.type.dataKind, "message.any");

  const messageDefinition = getBuiltinNodeDefinition("core.message");
  assert.deepEqual(messageDefinition?.ports.map((port) => port.id), ["in", "out"]);
  assert.equal(messageDefinition?.ports.find((port) => port.id === "in")?.type.dataKind, "message.any");
  assert.equal(messageDefinition?.ports.find((port) => port.id === "out")?.type.dataKind, "message.any");

  const bangDefinition = getBuiltinNodeDefinition("core.bang");
  assert.deepEqual(bangDefinition?.ports.map((port) => port.id), ["in", "out"]);
  assert.equal(bangDefinition?.ports.find((port) => port.id === "in")?.type.dataKind, "message.any");
  assert.equal(bangDefinition?.ports.find((port) => port.id === "out")?.type.dataKind, "event.bang");

  for (const removedId of [
    ["core", "target"],
    ["core", "event-log"],
    ["core", "bang-button"],
    ["core", "toggle"],
    ["ui", "button"],
    ["ui", "slider-float"],
    ["ui", "toggle"]
  ].map((parts) => parts.join("."))) {
    assert.equal(getBuiltinNodeDefinition(removedId), undefined);
  }

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
  assert.equal(builtinManifestV01.canonicalDataKinds.includes("clock.state"), true);
  assert.equal(builtinManifestV01.canonicalDataKinds.includes("f32"), false);
  assert.equal(builtinManifestV01.canonicalDataKinds.includes("number.f32"), false);
  assert.equal(builtinManifestV01.canonicalDataKinds.includes("bang"), false);
  assert.deepEqual(builtinManifestV01.representations["number.float"].includes("f8.e4m3"), true);
  assert.deepEqual(builtinManifestV01.representations.color.includes("rgba8unorm"), true);
  assert.equal(getBuiltinNodeDefinition("clock.midi-clock")?.ports.map((port) => port.id).join(","), "state,tick,running");
  assert.equal(getBuiltinNodeDefinition("audio.input")?.ports.map((port) => port.id).join(","), "left,right");
  assert.equal(getBuiltinNodeDefinition("audio.clock-bridge")?.ports.map((port) => port.id).join(","), "in,out");
  assert.equal(getBuiltinNodeDefinition("audio.resample")?.ports.map((port) => port.id).join(","), "in,out");
  assert.equal(getBuiltinNodeDefinition("core.operator.add")?.surface?.palette, undefined);
  assert.equal(getBuiltinNodeDefinition("audio.operator.mul")?.surface?.palette, undefined);
});

test("parses MIDI Clock messages into clock state authority", () => {
  assert.deepEqual(parseMidiClockMessageV01([0xf8]), { kind: "tick" });
  assert.deepEqual(parseMidiClockMessageV01([0xfa]), { kind: "start" });
  assert.deepEqual(parseMidiClockMessageV01([0xfb]), { kind: "continue" });
  assert.deepEqual(parseMidiClockMessageV01([0xfc]), { kind: "stop" });
  assert.deepEqual(parseMidiClockMessageV01([0xf2, 16, 0]), {
    kind: "song-position-pointer",
    songPositionSixteenth: 16
  });
  assert.equal(parseMidiClockMessageV01([]), null);
  assert.equal(parseMidiClockMessageV01([0x90, 60, 127]), null);
  assert.equal(parseMidiClockMessageV01([0xf2]), null);
  assert.equal(parseMidiClockMessageV01([0xf2, 0x80, 0]), null);

  let snapshot = createInitialMidiClockSnapshotV01({
    sourceId: "midi-a",
    timeSignature: { numerator: 4, denominator: 4 }
  });
  let result = applyMidiClockMessageV01(snapshot, {
    kind: "start",
    receivedHostTimeNs: 100
  });
  assert.equal(result.snapshot.running, true);
  assert.deepEqual(result.diagnostics, []);
  assert.equal(result.clockState.running.value, true);
  assert.equal(result.clockState.bar.value, 1);
  assert.equal(result.clockState.beat.value, 1);
  assert.equal(result.clockState.tempoBpm.authority, "unavailable");
  assert.equal(result.clockState.lastUpdateHostTimeNs, 100);

  snapshot = result.snapshot;
  result = applyMidiClockMessageV01(snapshot, { kind: "tick" });
  assert.deepEqual(result.diagnostics, []);
  assert.equal(result.snapshot.tickIndex, 1);
  assert.equal(result.clockState.tickIndex.value, 1);
  assert.equal(result.clockState.ppqPosition.value, 1 / 24);
  assert.equal(result.clockState.phase01.value, 1 / 24);
  assert.equal(result.clockState.songPositionSixteenth.value, 0);

  result = applyMidiClockMessageV01(snapshot, {
    kind: "song-position-pointer",
    songPositionSixteenth: 16
  });
  assert.deepEqual(result.diagnostics, []);
  assert.equal(result.snapshot.tickIndex, 96);
  assert.equal(result.clockState.bar.value, 2);
  assert.equal(result.clockState.beat.value, 1);
  assert.equal(result.clockState.division.value, 1);

  result = applyMidiClockMessageV01(result.snapshot, { kind: "stop" });
  assert.equal(result.clockState.running.value, false);
  result = applyMidiClockMessageV01(result.snapshot, { kind: "continue" });
  assert.equal(result.clockState.running.value, true);

  const noMeter = midiClockSnapshotToClockStateV01(createInitialMidiClockSnapshotV01());
  assert.equal(noMeter.bar.authority, "unavailable");
  assert.equal(noMeter.timeSignature.value, null);
  assert.equal(noMeter.capabilities.includes("bar-beat"), false);

  const custom = createInitialMidiClockSnapshotV01({
    ticksPerQuarter: 48,
    lastUpdateHostTimeNs: 7
  });
  result = applyMidiClockMessageV01(custom, { kind: "song-position-pointer" });
  assert.equal(result.diagnostics[0].code, "invalid-midi-song-position-pointer");
  assert.equal(result.snapshot.tickIndex, 0);
  assert.equal(result.snapshot.lastUpdateHostTimeNs, 7);

  result = applyMidiClockMessageV01(custom, {
    kind: "song-position-pointer",
    songPositionSixteenth: 16_384
  });
  assert.equal(result.diagnostics[0].code, "invalid-midi-song-position-pointer");
  assert.equal(result.snapshot.tickIndex, 0);

  const invalidTiming = midiClockSnapshotToClockStateV01({
    ...custom,
    ticksPerQuarter: 0,
    timeSignature: { numerator: 4, denominator: 0 }
  });
  assert.equal(invalidTiming.ppqPosition.value, 0);
  assert.equal(invalidTiming.bar.authority, "unavailable");

  result = applyMidiClockMessageV01({
    ...custom,
    tickIndex: Number.MAX_SAFE_INTEGER
  }, { kind: "tick" });
  assert.equal(result.diagnostics[0].code, "midi-clock-tick-overflow");
});

test("plans audio clock-domain bridge requirements", () => {
  const source = {
    id: "input-device",
    authority: "driver-reported",
    source: "audio.input",
    sampleRate: 48_000
  };
  const same = {
    id: "input-device",
    authority: "driver-reported",
    source: "audio.output",
    sampleRate: 48_000
  };
  const independent = {
    id: "output-device",
    authority: "driver-reported",
    source: "audio.output",
    sampleRate: 48_000
  };

  assert.deepEqual(planAudioClockBridgeV01(source, same), {
    required: false,
    sourceClockDomainId: "input-device",
    targetClockDomainId: "input-device",
    method: "direct",
    diagnostics: []
  });

  const invalid = planAudioClockBridgeV01(source, independent);
  assert.equal(invalid.required, true);
  assert.equal(invalid.method, "invalid");
  assert.equal(invalid.diagnostics[0].code, "audio-clock-domain-crossing-requires-bridge");

  const bridged = planAudioClockBridgeV01(source, independent, "bridge");
  assert.equal(bridged.required, true);
  assert.equal(bridged.method, "clock-bridge");
  assert.equal(bridged.bridgeNodeId, "bridge");
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

  for (const dataKind of ["number.float", "number.int", "number.uint", "boolean", "color", "string"]) {
    const valueToBangObjectInlet = planConversion(
      { flow: "value", dataKind },
      { flow: "event", dataKind: "message.any" }
    );
    assert.equal(
      valueToBangObjectInlet.ok,
      true,
      `${dataKind} should connect to a message.any object inlet such as core.bang.in`
    );
  }

  const panelMessageSink = planConversion(
    { flow: "value", dataKind: "string" },
    { flow: "value", dataKind: "message.any" }
  );
  assert.equal(panelMessageSink.ok, true);

  const bangToAnyMessage = planConversion(
    { flow: "event", dataKind: "event.bang" },
    { flow: "event", dataKind: "message.any" }
  );
  assert.equal(bangToAnyMessage.ok, true);

  const anyMessageToAnyMessage = planConversion(
    { flow: "event", dataKind: "message.any" },
    { flow: "event", dataKind: "message.any" }
  );
  assert.equal(anyMessageToAnyMessage.ok, true);

  const resourceToMessage = planConversion(
    { flow: "resource", dataKind: "gpu.texture2d" },
    { flow: "event", dataKind: "message.any" }
  );
  assert.equal(resourceToMessage.ok, false);

  const eventToValueMessage = planConversion(
    { flow: "event", dataKind: "event.bang" },
    { flow: "value", dataKind: "message.any" }
  );
  assert.equal(eventToValueMessage.ok, false);

  const invalidMessageAnyFlow = planConversion(
    { flow: "value", dataKind: "string" },
    { flow: "resource", dataKind: "message.any" }
  );
  assert.equal(invalidMessageAnyFlow.ok, false);

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
    { flow: "value", dataKind: "color", format: "color.custom" },
    { flow: "value", dataKind: "color", format: "rgba32f" }
  ).ok, false);
  assert.equal(planConversion(
    { flow: "value", dataKind: "color", format: "rgba32f" },
    { flow: "value", dataKind: "color", format: "color.custom" }
  ).ok, false);
  assert.equal(planConversion(
    { flow: "value", dataKind: "color", format: "rgba32f" },
    { flow: "value", dataKind: "color", format: "f32" }
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
  const helpNodeIds = builtinManifestV01.nodes;

  assert.deepEqual([...helpIds].sort(), [...helpNodeIds].sort());
  assert.deepEqual(
    builtinNodeHelpGraphsV01.map((helpGraph) => helpGraph.id).sort(),
    [...helpNodeIds].sort()
  );

  const valueHelp = getBuiltinNodeHelp("core.float");
  assert.match(valueHelp?.summary ?? "", /floating-point/);
  assert.deepEqual(valueHelp?.ports?.map((port) => port.id), ["in", "cold", "value"]);
  assert.equal(valueHelp?.docsPath, "docs/nodes/core.float.md");
  assert.equal(valueHelp?.helpGraph, "help/v0.1/nodes/core.float.help.graph.json");
  assert.equal(valueHelp?.tags.includes("control"), true);

  const bangHelp = getBuiltinNodeHelp("core.bang");
  assert.match(bangHelp?.description ?? "", /event\.bang.*selector/);
  assert.match(bangHelp?.runtimeBehavior ?? "", /any message/);
  assert.deepEqual(bangHelp?.ports?.map((port) => port.id), ["in", "out"]);

  const unresolvedHelp = getBuiltinNodeHelp("core.unresolved-object");
  assert.match(unresolvedHelp?.summary ?? "", /object text/);
  assert.match(unresolvedHelp?.runtimeBehavior ?? "", /diagnostics/);
  assert.deepEqual(unresolvedHelp?.params?.map((param) => param.id), [
    "objectText",
    "diagnosticMessage",
    "requestedKind"
  ]);

  const shaderHelp = getBuiltinNodeHelp("render.fullscreen-shader");
  assert.match(shaderHelp?.runtimeBehavior ?? "", /dynamic uniform layout/);
  assert.equal(shaderHelp?.relatedNodes?.includes("render.output"), true);

  const valueHelpGraph = getBuiltinNodeHelpGraph("core.float");
  assert.equal(valueHelpGraph?.id, "help-core-float");
  assert.equal(validateGraphDocument(valueHelpGraph).ok, true);
  assert.deepEqual(valueHelpGraph?.edges[0], {
    from: { node: "bang_1", port: "out" },
    to: { node: "value_1", port: "in" }
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

test("exports and validates v0.2 graph fragment contracts", async () => {
  assert.equal(graphFragmentV02Schema.properties.schema.const, "skenion.graph.fragment");
  assert.equal(graphFragmentV02Schema.properties.schemaVersion.const, "0.2.0");

  const fragment = await readJson("fixtures/graph-fragment/v0.2/valid/internal-edge.fragment.json");
  const result = validateGraphFragmentV02(fragment);
  assert.equal(result.ok, true);
  assert.deepEqual(fragment.edges.map((edge) => edge.id), ["edge-source-sink"]);

  const analysis = analyzeGraphFragmentV02(fragment);
  assert.equal(analysis.ok, true);
  assert.deepEqual(analysis.omittedEdgeIds, []);

  const outside = await readJson("fixtures/graph-fragment/v0.2/invalid/outside-endpoint.fragment.json");
  const rejected = validateGraphFragmentV02(outside);
  assert.equal(rejected.ok, false);
  assert.match(rejected.errors.join("\n"), /fragment-edge-outside-selection/);

  const omitted = analyzeGraphFragmentV02(outside, { outsideEndpointPolicy: "omit" });
  assert.equal(omitted.ok, true);
  assert.equal(omitted.diagnostics[0].severity, "warning");
  assert.deepEqual(omitted.omittedEdgeIds, ["edge-to-outside"]);

  const schemaInvalid = structuredClone(fragment);
  delete schemaInvalid.nodes;
  assert.equal(validateGraphFragmentV02(schemaInvalid).ok, false);

  const duplicateNode = structuredClone(fragment);
  duplicateNode.nodes.push(structuredClone(duplicateNode.nodes[0]));
  assert.match(validateGraphFragmentV02(duplicateNode).errors.join("\n"), /duplicate-node-id/);

  const duplicatePort = structuredClone(fragment);
  duplicatePort.nodes[0].ports.push(structuredClone(duplicatePort.nodes[0].ports[0]));
  assert.match(validateGraphFragmentV02(duplicatePort).errors.join("\n"), /duplicate-port-id/);

  const duplicateEdge = structuredClone(fragment);
  duplicateEdge.edges.push(structuredClone(duplicateEdge.edges[0]));
  assert.match(validateGraphFragmentV02(duplicateEdge).errors.join("\n"), /duplicate-edge-id/);

  const missingSource = structuredClone(fragment);
  missingSource.edges[0].source.portId = "missing";
  assert.match(validateGraphFragmentV02(missingSource).errors.join("\n"), /missing-source-port/);

  const missingTarget = structuredClone(fragment);
  missingTarget.edges[0].target.portId = "missing";
  assert.match(validateGraphFragmentV02(missingTarget).errors.join("\n"), /missing-target-port/);

  const badSourceDirection = structuredClone(fragment);
  badSourceDirection.nodes[0].ports[0].direction = "input";
  assert.match(validateGraphFragmentV02(badSourceDirection).errors.join("\n"), /invalid-source-direction/);

  const badTargetDirection = structuredClone(fragment);
  badTargetDirection.nodes[1].ports[0].direction = "output";
  assert.match(validateGraphFragmentV02(badTargetDirection).errors.join("\n"), /invalid-target-direction/);

  const incompatible = structuredClone(fragment);
  incompatible.nodes[1].ports[0].type = "string";
  assert.match(validateGraphFragmentV02(incompatible).errors.join("\n"), /incompatible-type/);

  const acceptsList = structuredClone(fragment);
  acceptsList.nodes[1].ports[0].type = "number.int";
  acceptsList.nodes[1].ports[0].accepts = ["number.float"];
  assert.equal(validateGraphFragmentV02(acceptsList).ok, true);

  const messageAny = structuredClone(fragment);
  messageAny.nodes[1].ports[0].type = "message.any";
  assert.equal(validateGraphFragmentV02(messageAny).ok, true);
});

test("validates session-addressed paste operation contracts", async () => {
  assert.equal(runtimeOperationV0Schema.properties.schema.const, "skenion.runtime.operation");
  assert.equal(runtimeOperationV0Schema.$defs.pasteGraphFragmentRequest.required[0], "target");

  const root = await readJson("fixtures/runtime-operation/v0/valid/root-graph-paste.operation.json");
  const projectPatch = await readJson("fixtures/runtime-operation/v0/valid/project-patch-definition-paste.operation.json");
  const helpWorkingCopy = await readJson("fixtures/runtime-operation/v0/valid/help-working-copy-paste.operation.json");

  for (const operation of [root, projectPatch, helpWorkingCopy]) {
    assert.equal(validateRuntimeOperationEnvelope(operation).ok, true);
    assert.equal(validatePasteGraphFragmentRequest(operation.request).ok, true);
    assert.equal(isRuntimeOperationEnvelope(operation), true);
    assert.equal(isPasteGraphFragmentRequest(operation.request), true);
  }

  assert.equal(root.request.target.path.kind, "root");
  assert.equal("attribution" in root, false);
  assert.equal(projectPatch.request.target.path.kind, "project-patch-definition");
  assert.equal(helpWorkingCopy.request.target.path.kind, "help-working-copy");

  const diagnosticsResponse = await readJson("fixtures/runtime-operation/v0/valid/target-path-diagnostics.response.json");
  assert.equal(validatePasteGraphFragmentResponse(diagnosticsResponse).ok, true);
  assert.equal(isPasteGraphFragmentResponse(diagnosticsResponse), true);
  assert.deepEqual(diagnosticsResponse.diagnostics.map((entry) => entry.code), [
    "invalid-target-path",
    "duplicate-target-path"
  ]);
  assert.equal(diagnosticsResponse.diagnostics[0].path, "/request/target/path");
  assert.deepEqual(diagnosticsResponse.idRemap, {
    nodeIdMap: {},
    edgeIdMap: {},
    omittedEdgeIds: []
  });

  const remapResponse = await readJson("fixtures/runtime-operation/v0/valid/id-remap.response.json");
  assert.equal(validatePasteGraphFragmentResponse(remapResponse).ok, true);
  assert.equal(isPasteGraphFragmentResponse(remapResponse), true);
  assert.deepEqual(remapResponse.idRemap.nodeIdMap, {
    source: "source_2",
    sink: "sink_2"
  });
  assert.deepEqual(remapResponse.idRemap.edgeIdMap, {
    "edge-source-sink": "edge-source-sink_2"
  });

  const invalidEnvelope = structuredClone(root);
  invalidEnvelope.kind = "loadProject";
  assert.equal(validateRuntimeOperationEnvelope(invalidEnvelope).ok, false);
  assert.equal(isRuntimeOperationEnvelope(invalidEnvelope), false);

  const invalidRequest = structuredClone(root.request);
  delete invalidRequest.target;
  assert.equal(validatePasteGraphFragmentRequest(invalidRequest).ok, false);
  assert.equal(isPasteGraphFragmentRequest(invalidRequest), false);

  const outsideFragment = await readJson("fixtures/graph-fragment/v0.2/invalid/outside-endpoint.fragment.json");
  const defaultOutsideRequest = structuredClone(root.request);
  defaultOutsideRequest.fragment = outsideFragment;
  assert.equal(validatePasteGraphFragmentRequest(defaultOutsideRequest).ok, false);
  const defaultOutsideEnvelope = structuredClone(root);
  defaultOutsideEnvelope.request = defaultOutsideRequest;
  assert.equal(validateRuntimeOperationEnvelope(defaultOutsideEnvelope).ok, false);

  const omitOutsideRequest = structuredClone(defaultOutsideRequest);
  omitOutsideRequest.options = { outsideEndpointPolicy: "omit" };
  assert.equal(validatePasteGraphFragmentRequest(omitOutsideRequest).ok, true);

  const invalidResponse = structuredClone(diagnosticsResponse);
  invalidResponse.diagnostics[0].code = "not-a-contract-code";
  assert.equal(validatePasteGraphFragmentResponse(invalidResponse).ok, false);
  assert.equal(isPasteGraphFragmentResponse(invalidResponse), false);
});

test("runtime session events are session-addressed", () => {
  const event = {
    schema: "skenion.runtime.session.event",
    schemaVersion: "0.1.0",
    id: "event-1",
    sessionId: "session-a",
    sequence: 1,
    sessionRevision: 1,
    kind: "snapshot",
    snapshot: {
      sessionRevision: 1,
      viewRevision: 1,
      controlRevision: 0,
      project: null,
      diagnostics: [],
      plan: null
    },
    history: {
      schema: "skenion.runtime.history",
      schemaVersion: "0.1.0",
      entries: [],
      canUndo: false,
      canRedo: false,
      undoDepth: 0,
      redoDepth: 0
    },
    replay: {
      cursor: "1",
      previousCursor: null,
      replayed: false,
      gap: null,
      overflow: false
    },
    diagnostics: [],
    createdAt: "2026-06-21T00:00:00.000Z"
  };

  assert.equal(isRuntimeSessionEvent(event), true);
  const missingSession = structuredClone(event);
  delete missingSession.sessionId;
  assert.equal(isRuntimeSessionEvent(missingSession), false);
});

test("exports and validates v0.2 project patch library contracts", async () => {
  assert.equal(projectV02Schema.properties.schemaVersion.const, "0.2.0");
  assert.equal(projectV02Schema.properties.patchLibrary.items.$ref, "#/$defs/patchDefinition");
  assert.equal(projectV02Schema.$defs.patchDefinition.properties.contract, undefined);

  for (const fixture of await fixtureFiles("fixtures/project/v0.2/valid")) {
    const project = await readJson(fixture);
    const result = validateProjectDocumentV02(project);
    assert.equal(result.ok, true, fixture);
    assert.equal(validatePatchDefinitionV02(project.patchLibrary[0]).ok, true, fixture);
  }

  for (const fixture of await fixtureFiles("fixtures/project/v0.2/invalid")) {
    const result = validateProjectDocumentV02(await readJson(fixture));
    assert.equal(result.ok, false, fixture);
    assert.match(result.errors.join("\n"), /duplicate boundary port id/, fixture);
  }

  const validProject = await readJson("fixtures/project/v0.2/valid/input-only-patch.project.json");
  const schemaInvalidProject = structuredClone(validProject);
  delete schemaInvalidProject.patchLibrary;
  const schemaInvalidProjectResult = validateProjectDocumentV02(schemaInvalidProject);
  assert.equal(schemaInvalidProjectResult.ok, false);
  assert.match(schemaInvalidProjectResult.errors.join("\n"), /patchLibrary/);

  const schemaInvalidPatch = structuredClone(validProject.patchLibrary[0]);
  schemaInvalidPatch.id = "";
  const schemaInvalidPatchResult = validatePatchDefinitionV02(schemaInvalidPatch);
  assert.equal(schemaInvalidPatchResult.ok, false);
  assert.match(schemaInvalidPatchResult.errors.join("\n"), /must NOT have fewer than 1 characters/);

  const semanticInvalidProject = await readJson("fixtures/project/v0.2/invalid/duplicate-boundary-port-id.project.json");
  const semanticInvalidPatchResult = validatePatchDefinitionV02(semanticInvalidProject.patchLibrary[0]);
  assert.equal(semanticInvalidPatchResult.ok, false);
  assert.match(semanticInvalidPatchResult.errors.join("\n"), /duplicate boundary port id/);

  const graphInvalidPatch = structuredClone(validProject.patchLibrary[0]);
  graphInvalidPatch.graph.nodes.push(structuredClone(graphInvalidPatch.graph.nodes[0]));
  const graphInvalidPatchResult = validatePatchDefinitionV02(graphInvalidPatch);
  assert.equal(graphInvalidPatchResult.ok, false);
  assert.match(graphInvalidPatchResult.errors.join("\n"), /duplicate node id/);
});

test("derives v0.2 patch contracts from core inlet and outlet boundary nodes", async () => {
  const inputProject = await readJson("fixtures/project/v0.2/valid/input-only-patch.project.json");
  const inputContract = derivePatchContractV02(inputProject.patchLibrary[0]);
  assert.deepEqual(inputContract.ports.map((port) => port.id), ["frequency"]);
  assert.equal(inputContract.ports[0].direction, "input");
  assert.equal(inputContract.ports[0].boundaryNodeId, "frequency_in");
  assert.equal(inputContract.ports[0].boundaryPortId, "out");
  assert.equal(inputContract.ports[0].label, "Frequency");
  assert.equal(inputContract.ports[0].description, "Frequency value entering the patch.");
  assert.equal("tooltip" in inputContract.ports[0], false);

  const outputProject = await readJson("fixtures/project/v0.2/valid/output-only-patch.project.json");
  const outputContract = derivePatchContractsV02(outputProject)[0];
  assert.deepEqual(outputContract.ports.map((port) => `${port.id}:${port.direction}`), [
    "amplitude:output"
  ]);
  assert.equal(outputContract.ports[0].description, "Amplitude value leaving the patch.");

  const boundaryProject = await readJson("fixtures/project/v0.2/valid/n-m-boundary-patch.project.json");
  const boundaryContract = derivePatchContractV02(boundaryProject.patchLibrary[0]);
  assert.deepEqual(boundaryContract.ports.map((port) => `${port.id}:${port.direction}`), [
    "left:input",
    "right:input",
    "sum:output",
    "difference:output"
  ]);

  const recursiveProject = await readJson("fixtures/project/v0.2/valid/recursive-reference.project.json");
  const recursiveContract = derivePatchContractV02(recursiveProject.patchLibrary[0]);
  assert.deepEqual(recursiveContract.ports.map((port) => port.id), ["value", "result"]);

  const fallbackPatch = {
    id: "fallbacks",
    revision: "1",
    graph: {
      schema: "skenion.graph",
      schemaVersion: "0.2.0",
      id: "fallback-boundary-graph",
      revision: "1",
      nodes: [
        {
          id: "single_boundary",
          kind: "core.inlet",
          kindVersion: "0.2.0",
          params: {},
          ports: [
            { id: "out", direction: "output", type: "number.float", rate: "control" }
          ]
        },
        {
          id: "multi_boundary",
          kind: "core.outlet",
          kindVersion: "0.2.0",
          params: {},
          ports: [
            { id: "left", direction: "input", type: "number.float", rate: "control" },
            { id: "right", direction: "input", type: "number.float", rate: "control" }
          ]
        }
      ],
      edges: []
    }
  };
  const fallbackContract = derivePatchContractV02(fallbackPatch);
  assert.deepEqual(fallbackContract.ports.map((port) => `${port.id}:${port.direction}`), [
    "single_boundary:input",
    "left:output",
    "right:output"
  ]);
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

test("v0.2 message.any inlets accept bang events", () => {
  const graph = {
    schema: "skenion.graph",
    schemaVersion: "0.2.0",
    id: "message-any-bang",
    revision: "1",
    nodes: [
      {
        id: "button",
        kind: "core.bang",
        kindVersion: "0.2.0",
        params: {},
        ports: [
          { id: "out", direction: "output", type: "event.bang", rate: "event" }
        ]
      },
      {
        id: "message",
        kind: "core.message",
        kindVersion: "0.2.0",
        params: {},
        ports: [
          { id: "in", direction: "input", type: "message.any", rate: "event", triggerMode: "trigger" }
        ]
      }
    ],
    edges: [
      {
        id: "edge_button_message",
        source: { nodeId: "button", portId: "out" },
        target: { nodeId: "message", portId: "in" }
      }
    ]
  };

  assert.equal(validateGraphDocumentV02(graph).ok, true);
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

test("replaceNode swaps node snapshots and keeps only compatible incident edges", async () => {
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
  const replacement = {
    ...graph.nodes[1],
    params: { objectText: "gpu.blur 12" }
  };
  const patch = {
    schema: "skenion.graph.patch",
    schemaVersion: "0.1.0",
    id: "replace_node",
    baseRevision: "1",
    ops: [
      {
        op: "replaceNode",
        nodeId: "blur_1",
        node: replacement,
        edgePolicy: "removeInvalidEdges"
      }
    ]
  };

  const result = applyGraphPatch(graph, patch, { nextRevision: "2" });
  assert.equal(result.ok, true);
  assert.equal(result.graph.nodes.find((node) => node.id === "blur_1").params.objectText, "gpu.blur 12");
  assert.equal(result.graph.edges.length, 2);

  const inverse = invertGraphPatch(graph, patch);
  assert.equal(inverse.ok, true);
  assert.equal(inverse.inversePatch.ops[0].op, "replaceNode");
  assert.equal(inverse.inversePatch.ops[0].node.params.value, undefined);

  const missingPatch = {
    ...patch,
    id: "replace_node_missing",
    ops: [{ ...patch.ops[0], nodeId: "missing" }]
  };
  const missingApply = applyGraphPatch(graph, missingPatch);
  assert.equal(missingApply.ok, false);
  assert.match(missingApply.errors.join("\n"), /node missing does not exist/);
  const missingInvert = invertGraphPatch(graph, missingPatch);
  assert.equal(missingInvert.ok, false);
  assert.match(missingInvert.errors.join("\n"), /node missing does not exist/);

  const mismatchedPatch = {
    ...patch,
    id: "replace_node_mismatched",
    ops: [{ ...patch.ops[0], node: { ...replacement, id: "other_1" } }]
  };
  const mismatchedApply = applyGraphPatch(graph, mismatchedPatch);
  assert.equal(mismatchedApply.ok, false);
  assert.match(mismatchedApply.errors.join("\n"), /must match nodeId/);
  const mismatchedInvert = invertGraphPatch(graph, mismatchedPatch);
  assert.equal(mismatchedInvert.ok, false);
  assert.match(mismatchedInvert.errors.join("\n"), /must match nodeId/);

  const unresolved = {
    id: "blur_1",
    kind: "core.unresolved-object",
    kindVersion: "0.1.0",
    params: {
      objectText: "user.blur",
      diagnosticMessage: "user.blur is unavailable",
      requestedKind: "user.blur"
    },
    ports: []
  };
  const unresolvedPatch = {
    ...patch,
    id: "replace_node_unresolved",
    ops: [
      {
        op: "replaceNode",
        nodeId: "blur_1",
        node: unresolved,
        edgePolicy: "removeInvalidEdges"
      }
    ]
  };
  const unresolvedResult = applyGraphPatch(graph, unresolvedPatch, { nextRevision: "2" });
  assert.equal(unresolvedResult.ok, true);
  assert.equal(unresolvedResult.graph.edges.length, 1);

  const inverseWithRemovedEdge = invertGraphPatch(graph, unresolvedPatch);
  assert.equal(inverseWithRemovedEdge.ok, true);
  assert.equal(inverseWithRemovedEdge.inversePatch.ops.length, 2);
  assert.equal(inverseWithRemovedEdge.inversePatch.ops[1].op, "addEdge");
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
