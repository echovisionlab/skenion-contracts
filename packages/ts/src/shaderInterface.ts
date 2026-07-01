import type {
  DataTypeV01,
  PortV01,
  ShaderInterfaceAnalysisV01,
  ShaderInterfaceIssueV01,
  ShaderInterfaceV01,
  ShaderLanguageV01,
  ShaderUniformDataKindV01,
  ShaderUniformV01
} from "./types.js";

const UNIFORM_RE = /^\s*\/\/\s*@skenion\.uniform\s+(\S+)\s+([A-Za-z0-9_.]+)(.*)$/;
const UNIFORM_MARKER = "@skenion.uniform";
const PORT_ID_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;
const RESERVED_UNIFORM_IDS = new Set(["out", "in", "set", "bang", "value"]);
const SUPPORTED_TYPES = new Set<ShaderUniformDataKindV01>([
  "value.core.float32",
  "value.core.int32",
  "value.core.uint32",
  "value.core.bool",
  "value.core.color"
]);

export function analyzeShaderInterfaceV01(
  source: string,
  options: { language: ShaderLanguageV01 }
): ShaderInterfaceAnalysisV01 {
  const issues: ShaderInterfaceIssueV01[] = [];
  const uniforms: ShaderUniformV01[] = [];
  const ids = new Set<string>();

  if (options.language !== "wgsl") {
    issues.push({
      severity: "error",
      phase: "interface-analysis",
      code: "unsupported-language",
      message: `unsupported shader language: ${options.language}`,
      source: "user"
    });
  }

  const lines = source.split(/\r?\n/);
  for (const [lineIndex, line] of lines.entries()) {
    const markerIndex = line.indexOf(UNIFORM_MARKER);
    const match = line.match(UNIFORM_RE);
    if (!match) {
      if (markerIndex >= 0 && line.trimStart().startsWith("//")) {
        issues.push(issue({
          code: "malformed-annotation",
          message: "malformed @skenion.uniform annotation",
          line: lineIndex + 1,
          column: markerIndex + 1
        }));
      }
      continue;
    }

    const [, id, rawType, rest = ""] = match;
    const lineNumber = lineIndex + 1;
    const idColumn = Math.max(1, line.indexOf(id) + 1);
    if (!PORT_ID_RE.test(id)) {
      issues.push(error("invalid-uniform-id", `invalid uniform id: ${id}`, lineNumber, id, idColumn));
      continue;
    }
    if (RESERVED_UNIFORM_IDS.has(id)) {
      issues.push(error("reserved-uniform-id", `reserved uniform id: ${id}`, lineNumber, id, idColumn));
      continue;
    }
    if (ids.has(id)) {
      issues.push(error("duplicate-uniform-id", `duplicate uniform id: ${id}`, lineNumber, id, idColumn));
      continue;
    }
    ids.add(id);

    if (!isSupportedType(rawType)) {
      issues.push(error("unsupported-uniform-type", `unsupported uniform type: ${rawType}`, lineNumber, id, idColumn));
      continue;
    }

    const attributes = parseAttributes(rest);
    for (const rangeIssue of rangeIssues(attributes, line, lineNumber, id)) {
      issues.push(rangeIssue);
    }
    const type = dataTypeFor(rawType, attributes);
    const uniform: ShaderUniformV01 = {
      id,
      label: stringAttribute(attributes, "label") ?? defaultLabel(id),
      type,
      required: false
    };
    if (attributes.has("default")) {
      const parsedDefault = parseDefault(rawType, attributes.get("default") as string);
      if (parsedDefault.ok) {
        uniform.default = parsedDefault.value;
      } else {
        issues.push(error(
          "invalid-default",
          parsedDefault.message,
          lineNumber,
          id,
          attributeColumn(line, "default")
        ));
      }
    }
    uniforms.push(uniform);
  }

  return {
    ok: issues.every((issue) => issue.severity !== "error"),
    shaderInterface: {
      schema: "skenion.shader.interface",
      schemaVersion: "0.1.0",
      language: options.language,
      uniforms
    },
    issues
  };
}

export function shaderInterfaceToPortsV01(shaderInterface: ShaderInterfaceV01): PortV01[] {
  return [
    ...shaderInterface.uniforms.map((uniform): PortV01 => {
      const port: PortV01 = {
        id: uniform.id,
        direction: "input",
        label: uniform.label,
        type: uniform.type,
        required: uniform.required,
        activation: "latched"
      };
      if (uniform.default !== undefined) {
        port.default = uniform.default;
      }
      return port;
    }),
    {
      id: "out",
      direction: "output",
      label: "Out",
      type: {
        flow: "resource",
        dataKind: "value.core.tensor",
        format: "rgba8unorm",
        colorSpace: "srgb"
      }
    }
  ];
}

function error(
  code: string,
  message: string,
  line: number,
  uniformId?: string,
  column?: number
): ShaderInterfaceIssueV01 {
  return issue({ code, message, line, column, uniformId });
}

function issue({
  code,
  message,
  line,
  column,
  uniformId
}: {
  code: string;
  message: string;
  line?: number;
  column?: number;
  uniformId?: string;
}): ShaderInterfaceIssueV01 {
  return {
    severity: "error",
    phase: "interface-analysis",
    code,
    message,
    line,
    column,
    uniformId,
    source: "user"
  };
}

function isSupportedType(value: string): value is ShaderUniformDataKindV01 {
  return SUPPORTED_TYPES.has(value as ShaderUniformDataKindV01);
}

function dataTypeFor(dataKind: ShaderUniformDataKindV01, attributes: Map<string, string>): DataTypeV01 {
  const type: DataTypeV01 = { flow: "control", dataKind };
  if (dataKind === "value.core.float32") {
    type.format = "f32";
  } else if (dataKind === "value.core.int32") {
    type.format = "i32";
  } else if (dataKind === "value.core.uint32") {
    type.format = "u32";
  } else if (dataKind === "value.core.color") {
    type.format = "rgba32f";
    type.colorSpace = "linear";
  }
  const range = {
    min: numberAttribute(attributes, "min"),
    max: numberAttribute(attributes, "max"),
    step: positiveNumberAttribute(attributes, "step")
  };
  if (range.min !== undefined || range.max !== undefined || range.step !== undefined) {
    type.range = range;
  }
  return type;
}

function parseAttributes(value: string): Map<string, string> {
  const attributes = new Map<string, string>();
  const re = /([A-Za-z_][A-Za-z0-9_]*)=("(?:[^"\\]|\\.)*"|\[[^\]]*\]|[^\s]+)/g;
  for (const match of value.matchAll(re)) {
    attributes.set(match[1], match[2]);
  }
  return attributes;
}

function stringAttribute(attributes: Map<string, string>, key: string): string | undefined {
  const value = attributes.get(key);
  if (value === undefined) {
    return undefined;
  }
  if (value.startsWith("\"") && value.endsWith("\"")) {
    return value.slice(1, -1).replace(/\\"/g, "\"");
  }
  return value;
}

function numberAttribute(attributes: Map<string, string>, key: string): number | undefined {
  const value = attributes.get(key);
  if (value === undefined) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function positiveNumberAttribute(attributes: Map<string, string>, key: string): number | undefined {
  const value = numberAttribute(attributes, key);
  return value !== undefined && value > 0 ? value : undefined;
}

function rangeIssues(
  attributes: Map<string, string>,
  line: string,
  lineNumber: number,
  uniformId: string
): ShaderInterfaceIssueV01[] {
  const issues: ShaderInterfaceIssueV01[] = [];
  for (const key of ["min", "max"] as const) {
    const rawValue = attributes.get(key);
    if (rawValue !== undefined && !Number.isFinite(Number(rawValue))) {
      issues.push(error(
        "invalid-number-range",
        `invalid ${key} range value: ${rawValue}`,
        lineNumber,
        uniformId,
        attributeColumn(line, key)
      ));
    }
  }

  const step = attributes.get("step");
  if (step !== undefined) {
    const parsed = Number(step);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      issues.push(error(
        "invalid-number-range",
        `invalid step range value: ${step}`,
        lineNumber,
        uniformId,
        attributeColumn(line, "step")
      ));
    }
  }
  return issues;
}

function attributeColumn(line: string, key: string): number {
  return line.indexOf(`${key}=`) + 1;
}

function parseDefault(
  dataKind: ShaderUniformDataKindV01,
  value: string
): { ok: true; value: unknown } | { ok: false; message: string } {
  if (dataKind === "value.core.float32") {
    const parsed = Number(value);
    return Number.isFinite(parsed)
      ? { ok: true, value: parsed }
      : { ok: false, message: `invalid value.core.float32 default: ${value}` };
  }
  if (dataKind === "value.core.int32") {
    const parsed = Number(value);
    return Number.isInteger(parsed)
      ? { ok: true, value: parsed }
      : { ok: false, message: `invalid value.core.int32 default: ${value}` };
  }
  if (dataKind === "value.core.uint32") {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed >= 0
      ? { ok: true, value: parsed }
      : { ok: false, message: `invalid value.core.uint32 default: ${value}` };
  }
  if (dataKind === "value.core.bool") {
    if (value === "true") {
      return { ok: true, value: true };
    }
    if (value === "false") {
      return { ok: true, value: false };
    }
    return { ok: false, message: `invalid value.core.bool default: ${value}` };
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (
      Array.isArray(parsed) &&
      parsed.length === 4 &&
      parsed.every((component) => typeof component === "number" && Number.isFinite(component))
    ) {
      return { ok: true, value: parsed };
    }
  } catch {
    // Report below with a stable issue.
  }
  return { ok: false, message: `invalid color default: ${value}` };
}

function defaultLabel(id: string): string {
  return id
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
