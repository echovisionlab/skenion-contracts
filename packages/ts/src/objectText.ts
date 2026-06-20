import type {
  ObjectTextAtomV01,
  ObjectTextDiagnosticV01,
  ObjectTextParseResultV01,
  ObjectTextPortV01
} from "./types.js";

const SCHEMA = "skenion.object-text.parse-result" as const;
const SCHEMA_VERSION = "0.1.0" as const;
const CONTROL_OPERATORS = new Map([
  ["+", "core.operator.add"],
  ["-", "core.operator.sub"],
  ["*", "core.operator.mul"],
  ["/", "core.operator.div"],
  ["pow", "core.operator.pow"],
  ["min", "core.operator.min"],
  ["max", "core.operator.max"]
]);
const AUDIO_OPERATORS = new Map([
  ["+~", "audio.operator.add"],
  ["-~", "audio.operator.sub"],
  ["*~", "audio.operator.mul"],
  ["/~", "audio.operator.div"]
]);
const DEFERRED_OBJECTS = new Map([
  ["sin~", "sin~ is deferred; use osc~, expr~ sin($v1), or a future Skenion extension"],
  ["square~", "square~ is deferred; use phasor~ plus comparison/expression logic, or a future Skenion extension"],
  ["expr", "expr is deferred until the expression layer contract is implemented"],
  ["expr~", "expr~ is deferred until the expression layer contract is implemented"],
  ["fexpr~", "fexpr~ is deferred until the expression layer contract is implemented"]
]);

function diagnostic(code: string, message: string): ObjectTextDiagnosticV01 {
  return { severity: "error", code, message };
}

function result(
  input: string,
  displayText: string,
  classSymbol: string,
  creationArgs: ObjectTextAtomV01[],
  partial: Pick<ObjectTextParseResultV01, "ok" | "resolvedKind" | "resolvedKindVersion" | "params" | "instancePorts" | "diagnostics">
): ObjectTextParseResultV01 {
  return {
    schema: SCHEMA,
    schemaVersion: SCHEMA_VERSION,
    input,
    ok: partial.ok,
    classSymbol,
    creationArgs,
    resolvedKind: partial.resolvedKind,
    resolvedKindVersion: partial.resolvedKindVersion,
    params: partial.params,
    instancePorts: partial.instancePorts,
    displayText,
    diagnostics: partial.diagnostics
  };
}

function failure(
  input: string,
  displayText: string,
  classSymbol: string,
  creationArgs: ObjectTextAtomV01[],
  code: string,
  message: string
): ObjectTextParseResultV01 {
  return result(input, displayText, classSymbol, creationArgs, {
    ok: false,
    resolvedKind: null,
    resolvedKindVersion: null,
    params: {},
    instancePorts: [],
    diagnostics: [diagnostic(code, message)]
  });
}

function normalizeInput(input: string): { ok: true; displayText: string } | { ok: false; displayText: string; message: string } {
  const trimmed = input.trim();
  if (trimmed.startsWith("[") || trimmed.endsWith("]")) {
    if (!trimmed.startsWith("[") || !trimmed.endsWith("]")) {
      return { ok: false, displayText: trimmed, message: "object text brackets must be balanced" };
    }
    const inner = trimmed.slice(1, -1).trim();
    return { ok: true, displayText: inner };
  }
  return { ok: true, displayText: trimmed };
}

function tokenize(displayText: string): string[] {
  return displayText.split(/\s+/u).filter(Boolean);
}

function parseAtom(token: string): ObjectTextAtomV01 {
  if (/^[+-]?\d+$/u.test(token)) {
    const value = Number.parseInt(token, 10);
    return { type: "int", value, representation: "i32" };
  }
  if (/^[+-]?(?:\d+\.\d*|\.\d+)(?:[eE][+-]?\d+)?$/u.test(token)) {
    return { type: "float", value: Number.parseFloat(token), representation: "f32" };
  }
  if (token === "true" || token === "false") {
    return { type: "bool", value: token === "true" };
  }
  return { type: "symbol", value: token };
}

function numericValue(atom: ObjectTextAtomV01): number | null {
  if (atom.type === "float" || atom.type === "int" || atom.type === "uint") {
    return atom.value;
  }
  return null;
}

function controlPorts(defaultValue: number): ObjectTextPortV01[] {
  return [
    { id: "in", direction: "input", type: "message.any", rate: "control", activation: "trigger" },
    {
      id: "right",
      direction: "input",
      type: "number.float",
      rate: "control",
      activation: "latched",
      defaultValue
    },
    { id: "out", direction: "output", type: "number.float", rate: "control" }
  ];
}

function controlSqrtPorts(): ObjectTextPortV01[] {
  return [
    { id: "in", direction: "input", type: "message.any", rate: "control", activation: "trigger" },
    { id: "out", direction: "output", type: "number.float", rate: "control" }
  ];
}

function audioBinaryPorts(): ObjectTextPortV01[] {
  return [
    { id: "left", direction: "input", type: "signal.audio", rate: "audio", activation: "latched" },
    { id: "right", direction: "input", type: "signal.audio", rate: "audio", activation: "latched" },
    { id: "out", direction: "output", type: "signal.audio", rate: "audio" }
  ];
}

function audioScalarPorts(defaultValue: number): ObjectTextPortV01[] {
  return [
    { id: "in", direction: "input", type: "signal.audio", rate: "audio", activation: "latched" },
    {
      id: "right",
      direction: "input",
      type: "number.float",
      rate: "control",
      activation: "latched",
      defaultValue
    },
    { id: "out", direction: "output", type: "signal.audio", rate: "audio" }
  ];
}

function audioUnaryPorts(): ObjectTextPortV01[] {
  return [
    { id: "in", direction: "input", type: "signal.audio", rate: "audio", activation: "latched" },
    { id: "out", direction: "output", type: "signal.audio", rate: "audio" }
  ];
}

function oscillatorPorts(defaultValue: number): ObjectTextPortV01[] {
  return [
    {
      id: "frequency",
      direction: "input",
      type: "number.float",
      rate: "control",
      activation: "latched",
      defaultValue
    },
    { id: "out", direction: "output", type: "signal.audio", rate: "audio" }
  ];
}

function audioOutputPorts(): ObjectTextPortV01[] {
  return [
    { id: "left", direction: "input", type: "signal.audio", rate: "audio", activation: "latched" },
    { id: "right", direction: "input", type: "signal.audio", rate: "audio", activation: "latched" }
  ];
}

function audioInputPorts(): ObjectTextPortV01[] {
  return [
    { id: "left", direction: "output", type: "signal.audio", rate: "audio" },
    { id: "right", direction: "output", type: "signal.audio", rate: "audio" }
  ];
}

export function parseObjectTextV01(input: string): ObjectTextParseResultV01 {
  const normalized = normalizeInput(input);
  if (!normalized.ok) {
    return failure(input, normalized.displayText, "<invalid>", [], "invalid-syntax", normalized.message);
  }

  const displayText = normalized.displayText;
  const tokens = tokenize(displayText);
  if (tokens.length === 0) {
    return failure(input, "<empty>", "<empty>", [], "empty-object-text", "object text must contain a class symbol");
  }

  const [classSymbol, ...argTokens] = tokens;
  const creationArgs = argTokens.map(parseAtom);
  const deferredMessage = DEFERRED_OBJECTS.get(classSymbol);
  if (deferredMessage) {
    return failure(input, displayText, classSymbol, creationArgs, "deferred-object", deferredMessage);
  }

  const controlKind = CONTROL_OPERATORS.get(classSymbol);
  if (controlKind) {
    if (creationArgs.length > 1) {
      return failure(input, displayText, classSymbol, creationArgs, "invalid-arg-count", `${classSymbol} accepts at most one creation argument`);
    }
    const right = creationArgs.length === 1 ? numericValue(creationArgs[0]) : 0;
    if (right === null) {
      return failure(input, displayText, classSymbol, creationArgs, "invalid-arg-type", `${classSymbol} creation argument must be numeric`);
    }
    return result(input, displayText, classSymbol, creationArgs, {
      ok: true,
      resolvedKind: controlKind,
      resolvedKindVersion: SCHEMA_VERSION,
      params: { right },
      instancePorts: controlPorts(right),
      diagnostics: []
    });
  }

  if (classSymbol === "sqrt") {
    if (creationArgs.length > 0) {
      return failure(input, displayText, classSymbol, creationArgs, "invalid-arg-count", "sqrt accepts no creation arguments");
    }
    return result(input, displayText, classSymbol, creationArgs, {
      ok: true,
      resolvedKind: "core.operator.sqrt",
      resolvedKindVersion: SCHEMA_VERSION,
      params: {},
      instancePorts: controlSqrtPorts(),
      diagnostics: []
    });
  }

  const audioKind = AUDIO_OPERATORS.get(classSymbol);
  if (audioKind) {
    if (creationArgs.length > 1) {
      return failure(
        input,
        displayText,
        classSymbol,
        creationArgs,
        "invalid-arg-count",
        `${classSymbol} accepts at most one creation argument in the first DSP baseline`
      );
    }
    if (creationArgs.length === 0) {
      return result(input, displayText, classSymbol, creationArgs, {
        ok: true,
        resolvedKind: audioKind,
        resolvedKindVersion: SCHEMA_VERSION,
        params: {},
        instancePorts: audioBinaryPorts(),
        diagnostics: []
      });
    }
    const right = numericValue(creationArgs[0]);
    if (right === null) {
      return failure(input, displayText, classSymbol, creationArgs, "invalid-arg-type", `${classSymbol} creation argument must be numeric`);
    }
    return result(input, displayText, classSymbol, creationArgs, {
      ok: true,
      resolvedKind: audioKind,
      resolvedKindVersion: SCHEMA_VERSION,
      params: { right },
      instancePorts: audioScalarPorts(right),
      diagnostics: []
    });
  }

  if (classSymbol === "sqrt~") {
    if (creationArgs.length > 0) {
      return failure(input, displayText, classSymbol, creationArgs, "invalid-arg-count", "sqrt~ accepts no creation arguments");
    }
    return result(input, displayText, classSymbol, creationArgs, {
      ok: true,
      resolvedKind: "audio.operator.sqrt",
      resolvedKindVersion: SCHEMA_VERSION,
      params: {},
      instancePorts: audioUnaryPorts(),
      diagnostics: []
    });
  }

  if (classSymbol === "osc~" || classSymbol === "phasor~") {
    if (creationArgs.length > 1) {
      return failure(input, displayText, classSymbol, creationArgs, "invalid-arg-count", `${classSymbol} accepts at most one creation argument`);
    }
    const frequency = creationArgs.length === 1 ? numericValue(creationArgs[0]) : 0;
    if (frequency === null) {
      return failure(input, displayText, classSymbol, creationArgs, "invalid-arg-type", `${classSymbol} frequency argument must be numeric`);
    }
    return result(input, displayText, classSymbol, creationArgs, {
      ok: true,
      resolvedKind: classSymbol === "osc~" ? "audio.osc" : "audio.phasor",
      resolvedKindVersion: SCHEMA_VERSION,
      params: { frequency },
      instancePorts: oscillatorPorts(frequency),
      diagnostics: []
    });
  }

  if (classSymbol === "dac~") {
    if (creationArgs.length > 0) {
      return failure(input, displayText, classSymbol, creationArgs, "invalid-arg-count", "dac~ accepts no creation arguments in the first audio backend contract");
    }
    return result(input, displayText, classSymbol, creationArgs, {
      ok: true,
      resolvedKind: "audio.output",
      resolvedKindVersion: SCHEMA_VERSION,
      params: {},
      instancePorts: audioOutputPorts(),
      diagnostics: []
    });
  }

  if (classSymbol === "adc~") {
    if (creationArgs.length > 0) {
      return failure(input, displayText, classSymbol, creationArgs, "invalid-arg-count", "adc~ accepts no creation arguments in the first audio endpoint contract");
    }
    return result(input, displayText, classSymbol, creationArgs, {
      ok: true,
      resolvedKind: "audio.input",
      resolvedKindVersion: SCHEMA_VERSION,
      params: {},
      instancePorts: audioInputPorts(),
      diagnostics: []
    });
  }

  return failure(input, displayText, classSymbol, creationArgs, "unsupported-class", `unsupported object class: ${classSymbol}`);
}
