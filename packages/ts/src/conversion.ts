import type {
  ConversionPlanV01,
  DataTypeV01,
  RepresentationSpecV01,
  RepresentationV01,
  SemanticDataKindV01,
  TypeDescriptorV01
} from "./types.js";

export const representationRegistryV01 = [
  { id: "f64", semanticDataKind: "value.core.float64", bitsPerComponent: 64, signed: true },
  { id: "f32", semanticDataKind: "value.core.float32", bitsPerComponent: 32, signed: true },
  { id: "f16", semanticDataKind: "value.core.float16", bitsPerComponent: 16, signed: true },
  { id: "f8.e4m3", semanticDataKind: "value.core.float8", bitsPerComponent: 8, signed: true },
  { id: "f8.e5m2", semanticDataKind: "value.core.float8", bitsPerComponent: 8, signed: true },
  { id: "ufloat64", semanticDataKind: "value.core.ufloat64", bitsPerComponent: 64, signed: false },
  { id: "ufloat32", semanticDataKind: "value.core.ufloat32", bitsPerComponent: 32, signed: false },
  { id: "ufloat16", semanticDataKind: "value.core.ufloat16", bitsPerComponent: 16, signed: false },
  { id: "ufloat8", semanticDataKind: "value.core.ufloat8", bitsPerComponent: 8, signed: false },
  { id: "i64", semanticDataKind: "value.core.int64", bitsPerComponent: 64, signed: true, integer: true },
  { id: "i32", semanticDataKind: "value.core.int32", bitsPerComponent: 32, signed: true, integer: true },
  { id: "i16", semanticDataKind: "value.core.int16", bitsPerComponent: 16, signed: true, integer: true },
  { id: "i8", semanticDataKind: "value.core.int8", bitsPerComponent: 8, signed: true, integer: true },
  { id: "u64", semanticDataKind: "value.core.uint64", bitsPerComponent: 64, signed: false, integer: true },
  { id: "u32", semanticDataKind: "value.core.uint32", bitsPerComponent: 32, signed: false, integer: true },
  { id: "u16", semanticDataKind: "value.core.uint16", bitsPerComponent: 16, signed: false, integer: true },
  { id: "u8", semanticDataKind: "value.core.uint8", bitsPerComponent: 8, signed: false, integer: true },
  { id: "rgba32f", semanticDataKind: "value.core.color", bitsPerComponent: 32, signed: false, channels: 4 },
  { id: "rgba16f", semanticDataKind: "value.core.color", bitsPerComponent: 16, signed: false, channels: 4 },
  { id: "rgba8unorm", semanticDataKind: "value.core.color", bitsPerComponent: 8, signed: false, normalized: true, channels: 4 },
  { id: "rgb8unorm", semanticDataKind: "value.core.color", bitsPerComponent: 8, signed: false, normalized: true, channels: 3 }
] satisfies RepresentationSpecV01[];

const representationById = new Map<string, RepresentationSpecV01>(
  representationRegistryV01.map((representation) => [representation.id, representation])
);

const defaultRepresentationByDataKind = new Map<string, RepresentationV01>([
  ["value.core.float64", "f64"],
  ["value.core.float32", "f32"],
  ["value.core.float16", "f16"],
  ["value.core.ufloat64", "ufloat64"],
  ["value.core.ufloat32", "ufloat32"],
  ["value.core.ufloat16", "ufloat16"],
  ["value.core.ufloat8", "ufloat8"],
  ["value.core.int64", "i64"],
  ["value.core.int32", "i32"],
  ["value.core.int16", "i16"],
  ["value.core.int8", "i8"],
  ["value.core.uint64", "u64"],
  ["value.core.uint32", "u32"],
  ["value.core.uint16", "u16"],
  ["value.core.uint8", "u8"],
  ["value.core.color", "rgba32f"]
]);

const floatKinds = new Set([
  "value.core.float64",
  "value.core.float32",
  "value.core.float16",
  "value.core.float8",
  "value.core.ufloat64",
  "value.core.ufloat32",
  "value.core.ufloat16",
  "value.core.ufloat8"
]);
const intKinds = new Set([
  "value.core.int64",
  "value.core.int32",
  "value.core.int16",
  "value.core.int8"
]);
const uintKinds = new Set([
  "value.core.uint64",
  "value.core.uint32",
  "value.core.uint16",
  "value.core.uint8"
]);
const numericKinds = new Set([...floatKinds, ...intKinds, ...uintKinds]);
const messageValueDataKinds = new Set([
  "value.core.bang",
  "value.core.bool",
  "value.core.color",
  "value.core.message",
  ...numericKinds,
  "value.core.string"
]);

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

  if (targetType.dataKind === "value.core.message" && isMessageValueCompatible(sourceType, targetType)) {
    return {
      ...base,
      ok: true,
      lossy: false,
      steps: [{ policy: "identity" }],
      issues: []
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
      issues: []
    };
  }

  if (numericKinds.has(String(source.dataKind)) && numericKinds.has(String(target.dataKind))) {
    return numericConversionPlan(base);
  }

  if (source.dataKind === "value.core.color" && target.dataKind === "value.core.color") {
    const sourceRepresentation = representationById.get(String(source.representation));
    const targetRepresentation = representationById.get(String(target.representation));
    if (!sourceRepresentation || sourceRepresentation.semanticDataKind !== "value.core.color") {
      return failedPlan(
        base,
        `unknown or mismatched source representation ${source.representation} for value.core.color`
      );
    }
    if (!targetRepresentation || targetRepresentation.semanticDataKind !== "value.core.color") {
      return failedPlan(
        base,
        `unknown or mismatched target representation ${target.representation} for value.core.color`
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
      issues: [lossyIssue(source, target)]
    };
  }

  return failedPlan(base, `${source.dataKind} is not compatible with ${target.dataKind}`);
}

function isMessageValueCompatible(sourceType: DataTypeV01, targetType: DataTypeV01): boolean {
  if (targetType.flow === "event") {
    return sourceType.flow === "event";
  }
  if (targetType.flow === "control") {
    return (
      (sourceType.flow === "control" && messageValueDataKinds.has(sourceType.dataKind)) ||
      (sourceType.flow === "event" && sourceType.dataKind === "value.core.bang")
    );
  }
  return false;
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
  const representationChanged = base.source.representation !== base.target.representation;

  if (floatKinds.has(String(sourceKind)) && (intKinds.has(String(targetKind)) || uintKinds.has(String(targetKind)))) {
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
      issues: [lossyIssue(base.source, base.target)]
    };
  }

  if ((intKinds.has(String(sourceKind)) || uintKinds.has(String(sourceKind))) && floatKinds.has(String(targetKind))) {
    return {
      ...base,
      ok: true,
      lossy: true,
      steps: [{
        policy: "integer-to-float",
        clamp: "saturating",
        quantize: true,
        sanitize: "nan-inf-to-finite"
      }],
      issues: [lossyIssue(base.source, base.target)]
    };
  }

  if (
    (intKinds.has(String(sourceKind)) && uintKinds.has(String(targetKind))) ||
    (uintKinds.has(String(sourceKind)) && intKinds.has(String(targetKind)))
  ) {
    return {
      ...base,
      ok: true,
      lossy: true,
      steps: [{ policy: "integer-signedness", clamp: "saturating" }],
      issues: [lossyIssue(base.source, base.target)]
    };
  }

  return {
    ...base,
    ok: true,
    lossy: narrowing || representationChanged,
    steps: [{
      policy: "numeric-cast",
      clamp: "saturating",
      quantize: true,
      sanitize: "nan-inf-to-finite"
    }],
    issues: [lossyIssue(base.source, base.target)]
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
    issues: [{ severity: "error", code: "incompatible-types", message }]
  };
}

function lossyIssue(source: TypeDescriptorV01, target: TypeDescriptorV01): ConversionPlanV01["issues"][number] {
  return {
    severity: "warning",
    code: "implicit-lossy-conversion",
    message: `${typeDescriptorLabel(source)} converts to ${typeDescriptorLabel(target)} with saturating conversion policy`
  };
}

function typeDescriptorLabel(type: TypeDescriptorV01): string {
  return `${type.dataKind}/${type.representation}`;
}
