import type {
  ConversionPlanV01,
  DataTypeV01,
  RepresentationSpecV01,
  RepresentationV01,
  SemanticDataKindV01,
  TypeDescriptorV01
} from "./types.js";

export const representationRegistryV01 = [
  { id: "f64", semanticDataKind: "number.float", bitsPerComponent: 64, signed: true },
  { id: "f32", semanticDataKind: "number.float", bitsPerComponent: 32, signed: true },
  { id: "f16", semanticDataKind: "number.float", bitsPerComponent: 16, signed: true },
  { id: "f8.e4m3", semanticDataKind: "number.float", bitsPerComponent: 8, signed: true },
  { id: "f8.e5m2", semanticDataKind: "number.float", bitsPerComponent: 8, signed: true },
  { id: "ufloat16", semanticDataKind: "number.float", bitsPerComponent: 16, signed: false },
  { id: "ufloat8", semanticDataKind: "number.float", bitsPerComponent: 8, signed: false },
  { id: "i64", semanticDataKind: "number.int", bitsPerComponent: 64, signed: true, integer: true },
  { id: "i32", semanticDataKind: "number.int", bitsPerComponent: 32, signed: true, integer: true },
  { id: "i16", semanticDataKind: "number.int", bitsPerComponent: 16, signed: true, integer: true },
  { id: "i8", semanticDataKind: "number.int", bitsPerComponent: 8, signed: true, integer: true },
  { id: "u64", semanticDataKind: "number.uint", bitsPerComponent: 64, signed: false, integer: true },
  { id: "u32", semanticDataKind: "number.uint", bitsPerComponent: 32, signed: false, integer: true },
  { id: "u16", semanticDataKind: "number.uint", bitsPerComponent: 16, signed: false, integer: true },
  { id: "u8", semanticDataKind: "number.uint", bitsPerComponent: 8, signed: false, integer: true },
  { id: "rgba32f", semanticDataKind: "color", bitsPerComponent: 32, signed: false, channels: 4 },
  { id: "rgba16f", semanticDataKind: "color", bitsPerComponent: 16, signed: false, channels: 4 },
  { id: "rgba8unorm", semanticDataKind: "color", bitsPerComponent: 8, signed: false, normalized: true, channels: 4 },
  { id: "rgb8unorm", semanticDataKind: "color", bitsPerComponent: 8, signed: false, normalized: true, channels: 3 }
] satisfies RepresentationSpecV01[];

const representationById = new Map<string, RepresentationSpecV01>(
  representationRegistryV01.map((representation) => [representation.id, representation])
);

const defaultRepresentationByDataKind = new Map<string, RepresentationV01>([
  ["number.float", "f32"],
  ["number.int", "i32"],
  ["number.uint", "u32"],
  ["color", "rgba32f"]
]);

const numericKinds = new Set(["number.float", "number.int", "number.uint"]);

export function representationForDataType(type: DataTypeV01): string | undefined {
  const format = Array.isArray(type.format) ? type.format[0] : type.format;
  return format ?? defaultRepresentationByDataKind.get(type.dataKind);
}

export function typeDescriptorForDataType(type: DataTypeV01): TypeDescriptorV01 {
  return {
    dataKind: type.dataKind,
    representation: representationForDataType(type)
  };
}

export function planConversion(sourceType: DataTypeV01, targetType: DataTypeV01): ConversionPlanV01 {
  const source = typeDescriptorForDataType(sourceType);
  const target = typeDescriptorForDataType(targetType);
  const base = {
    source,
    target,
    implicit: true
  };

  if (targetType.dataKind === "message.any") {
    return {
      ...base,
      ok: true,
      lossy: false,
      steps: [{ policy: "identity" }],
      diagnostics: []
    };
  }

  if (sourceType.flow !== targetType.flow) {
    return failedPlan(base, `flow ${sourceType.flow} is not compatible with ${targetType.flow}`);
  }

  if (source.dataKind === target.dataKind && source.representation === target.representation) {
    return {
      ...base,
      ok: true,
      lossy: false,
      steps: [{ policy: "identity" }],
      diagnostics: []
    };
  }

  if (numericKinds.has(String(source.dataKind)) && numericKinds.has(String(target.dataKind))) {
    return numericConversionPlan(base);
  }

  if (source.dataKind === "color" && target.dataKind === "color") {
    const sourceRepresentation = representationById.get(String(source.representation));
    const targetRepresentation = representationById.get(String(target.representation));
    if (!sourceRepresentation || sourceRepresentation.semanticDataKind !== "color") {
      return failedPlan(
        base,
        `unknown or mismatched source representation ${source.representation} for color`
      );
    }
    if (!targetRepresentation || targetRepresentation.semanticDataKind !== "color") {
      return failedPlan(
        base,
        `unknown or mismatched target representation ${target.representation} for color`
      );
    }

    return {
      ...base,
      ok: true,
      lossy: source.representation !== target.representation,
      steps: [{
        policy: "color-cast",
        clamp: "unit",
        quantize: true,
        sanitize: "nan-inf-to-finite"
      }],
      diagnostics: [lossyDiagnostic(source, target)]
    };
  }

  return failedPlan(base, `${source.dataKind} is not compatible with ${target.dataKind}`);
}

function numericConversionPlan(base: Pick<ConversionPlanV01, "source" | "target" | "implicit">): ConversionPlanV01 {
  const sourceKind = base.source.dataKind;
  const targetKind = base.target.dataKind;
  const sourceRepresentation = representationById.get(String(base.source.representation));
  const targetRepresentation = representationById.get(String(base.target.representation));
  if (!sourceRepresentation || sourceRepresentation.semanticDataKind !== sourceKind) {
    return failedPlan(
      base,
      `unknown or mismatched source representation ${base.source.representation} for ${sourceKind}`
    );
  }
  if (!targetRepresentation || targetRepresentation.semanticDataKind !== targetKind) {
    return failedPlan(
      base,
      `unknown or mismatched target representation ${base.target.representation} for ${targetKind}`
    );
  }

  const narrowing = Boolean(
    sourceRepresentation.bitsPerComponent > targetRepresentation.bitsPerComponent
  );
  const lossy = narrowing || sourceKind !== targetKind || base.source.representation !== base.target.representation;

  if (sourceKind === "number.float" && (targetKind === "number.int" || targetKind === "number.uint")) {
    return {
      ...base,
      ok: true,
      lossy: true,
      steps: [{
        policy: "float-to-integer",
        clamp: "saturating",
        trunc: "toward-zero",
        sanitize: "nan-inf-to-finite"
      }],
      diagnostics: [lossyDiagnostic(base.source, base.target)]
    };
  }

  if ((sourceKind === "number.int" || sourceKind === "number.uint") && targetKind === "number.float") {
    return {
      ...base,
      ok: true,
      lossy,
      steps: [{
        policy: "integer-to-float",
        clamp: "saturating",
        quantize: true,
        sanitize: "nan-inf-to-finite"
      }],
      diagnostics: [lossyDiagnostic(base.source, base.target)]
    };
  }

  if (
    (sourceKind === "number.int" && targetKind === "number.uint") ||
    (sourceKind === "number.uint" && targetKind === "number.int")
  ) {
    return {
      ...base,
      ok: true,
      lossy: true,
      steps: [{ policy: "integer-signedness", clamp: "saturating" }],
      diagnostics: [lossyDiagnostic(base.source, base.target)]
    };
  }

  return {
    ...base,
    ok: true,
    lossy,
    steps: [{
      policy: "numeric-cast",
      clamp: "saturating",
      quantize: true,
      sanitize: "nan-inf-to-finite"
    }],
    diagnostics: [lossyDiagnostic(base.source, base.target)]
  };
}

function failedPlan(
  base: Pick<ConversionPlanV01, "source" | "target" | "implicit">,
  message: string
): ConversionPlanV01 {
  return {
    ...base,
    ok: false,
    lossy: false,
    steps: [],
    diagnostics: [{ severity: "error", code: "incompatible-types", message }]
  };
}

function lossyDiagnostic(source: TypeDescriptorV01, target: TypeDescriptorV01): ConversionPlanV01["diagnostics"][number] {
  return {
    severity: "warning",
    code: "implicit-lossy-conversion",
    message: `${typeDescriptorLabel(source)} converts to ${typeDescriptorLabel(target)} with saturating conversion policy`
  };
}

function typeDescriptorLabel(type: TypeDescriptorV01): string {
  return `${type.dataKind}/${type.representation}`;
}
