import type {
  DataTypeV01,
  PortV01,
  ShaderInterfaceAnalysisV01,
  ShaderInterfaceDiagnosticV01,
  ShaderInterfaceV01,
  ShaderLanguageV01,
  ShaderUniformDataKindV01,
  ShaderUniformV01
} from "./types.js";

const UNIFORM_RE = /^\s*\/\/\s*@skenion\.uniform\s+(\S+)\s+([A-Za-z0-9_.]+)(.*)$/;
const PORT_ID_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;
const RESERVED_UNIFORM_IDS = new Set(["out", "in", "set", "bang", "value"]);
const SUPPORTED_TYPES = new Set<ShaderUniformDataKindV01>([
  "number.f32",
  "number.i32",
  "boolean",
  "color.rgba"
]);

export function analyzeShaderInterfaceV01(
  source: string,
  options: { language: ShaderLanguageV01 }
): ShaderInterfaceAnalysisV01 {
  const diagnostics: ShaderInterfaceDiagnosticV01[] = [];
  const uniforms: ShaderUniformV01[] = [];
  const ids = new Set<string>();

  if (options.language !== "wgsl") {
    diagnostics.push({
      severity: "error",
      code: "unsupported-language",
      message: `unsupported shader language: ${options.language}`
    });
  }

  const lines = source.split(/\r?\n/);
  for (const [lineIndex, line] of lines.entries()) {
    const match = line.match(UNIFORM_RE);
    if (!match) {
      continue;
    }

    const [, id, rawType, rest = ""] = match;
    const lineNumber = lineIndex + 1;
    if (!PORT_ID_RE.test(id)) {
      diagnostics.push(error("invalid-uniform-id", `invalid uniform id: ${id}`, lineNumber, id));
      continue;
    }
    if (RESERVED_UNIFORM_IDS.has(id)) {
      diagnostics.push(error("reserved-uniform-id", `reserved uniform id: ${id}`, lineNumber, id));
      continue;
    }
    if (ids.has(id)) {
      diagnostics.push(error("duplicate-uniform-id", `duplicate uniform id: ${id}`, lineNumber, id));
      continue;
    }
    ids.add(id);

    if (!isSupportedType(rawType)) {
      diagnostics.push(error("unsupported-uniform-type", `unsupported uniform type: ${rawType}`, lineNumber, id));
      continue;
    }

    const attributes = parseAttributes(rest);
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
        diagnostics.push(error("invalid-default", parsedDefault.message, lineNumber, id));
      }
    }
    uniforms.push(uniform);
  }

  return {
    ok: diagnostics.every((diagnostic) => diagnostic.severity !== "error"),
    shaderInterface: {
      schema: "skenion.shader.interface",
      schemaVersion: "0.1.0",
      language: options.language,
      uniforms
    },
    diagnostics
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
        dataKind: "gpu.texture2d",
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
  uniformId?: string
): ShaderInterfaceDiagnosticV01 {
  return { severity: "error", code, message, line, uniformId };
}

function isSupportedType(value: string): value is ShaderUniformDataKindV01 {
  return SUPPORTED_TYPES.has(value as ShaderUniformDataKindV01);
}

function dataTypeFor(dataKind: ShaderUniformDataKindV01, attributes: Map<string, string>): DataTypeV01 {
  const type: DataTypeV01 = { flow: "value", dataKind };
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

function parseDefault(
  dataKind: ShaderUniformDataKindV01,
  value: string
): { ok: true; value: unknown } | { ok: false; message: string } {
  if (dataKind === "number.f32") {
    const parsed = Number(value);
    return Number.isFinite(parsed)
      ? { ok: true, value: parsed }
      : { ok: false, message: `invalid number.f32 default: ${value}` };
  }
  if (dataKind === "number.i32") {
    const parsed = Number(value);
    return Number.isInteger(parsed)
      ? { ok: true, value: parsed }
      : { ok: false, message: `invalid number.i32 default: ${value}` };
  }
  if (dataKind === "boolean") {
    if (value === "true") {
      return { ok: true, value: true };
    }
    if (value === "false") {
      return { ok: true, value: false };
    }
    return { ok: false, message: `invalid boolean default: ${value}` };
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
    // Report below with a stable diagnostic.
  }
  return { ok: false, message: `invalid color.rgba default: ${value}` };
}

function defaultLabel(id: string): string {
  return id
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
