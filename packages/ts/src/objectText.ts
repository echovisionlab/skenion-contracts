import type {
  ObjectTextAtomV01,
  ObjectTextDiagnosticV01,
  ObjectTextParseResultV01
} from "./types.js";

const SCHEMA = "skenion.object-text.parse-result" as const;
const SCHEMA_VERSION = "0.1.0" as const;

function diagnostic(code: string, message: string): ObjectTextDiagnosticV01 {
  return { severity: "error", code, message };
}

function result(
  input: string,
  displayText: string,
  className: string,
  creationArgs: ObjectTextAtomV01[],
  partial: Pick<ObjectTextParseResultV01, "ok" | "diagnostics">
): ObjectTextParseResultV01 {
  return {
    schema: SCHEMA,
    schemaVersion: SCHEMA_VERSION,
    input,
    ok: partial.ok,
    className,
    creationArgs,
    resolvedKind: null,
    resolvedKindVersion: null,
    params: {},
    instancePorts: [],
    displayText,
    diagnostics: partial.diagnostics
  };
}

function failure(
  input: string,
  displayText: string,
  className: string,
  creationArgs: ObjectTextAtomV01[],
  code: string,
  message: string
): ObjectTextParseResultV01 {
  return result(input, displayText, className, creationArgs, {
    ok: false,
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
  if (/^[+-]?(?:(?:\d+\.\d*|\.\d+)(?:[eE][+-]?\d+)?|\d+(?:[eE][+-]?\d+))$/u.test(token)) {
    const value = Number.parseFloat(token);
    if (Number.isFinite(value)) {
      return { type: "float", value, representation: "f32" };
    }
  }
  if (token === "true" || token === "false") {
    return { type: "bool", value: token === "true" };
  }
  return { type: "identifier", value: token };
}

export function parseObjectTextV01(input: string): ObjectTextParseResultV01 {
  const normalized = normalizeInput(input);
  if (!normalized.ok) {
    return failure(input, normalized.displayText, "<invalid>", [], "invalid-syntax", normalized.message);
  }

  const displayText = normalized.displayText;
  const tokens = tokenize(displayText);
  if (tokens.length === 0) {
    return failure(input, "<empty>", "<empty>", [], "empty-object-text", "object text must contain a class name");
  }

  const [className, ...argTokens] = tokens;
  const creationArgs = argTokens.map(parseAtom);
  return result(input, displayText, className, creationArgs, {
    ok: true,
    diagnostics: []
  });
}
