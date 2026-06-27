# Semantic Types And Conversions v0

skenion separates user-facing semantic value types from storage or transport
representations.

## Semantic Types

Canonical control port types describe the meaning of a value:

- `value.core.float64`
- `value.core.int64`
- `value.core.uint64`
- `value.core.bool`
- `value.core.string`
- `value.core.color`
- `value.core.message`
- `value.core.bang`

Representation-specific names such as `number.f32`, `number.i32`, or
`color.rgba` are not canonical data kinds.

## Representations

Representations describe how a semantic value is stored or delivered:

- `value.core.float64`: `f64`
- `value.core.float32`: `f32`
- `value.core.float16`: `f16`
- `value.core.float8`: `f8.e4m3`, `f8.e5m2`
- `value.core.ufloat64`: `ufloat64`
- `value.core.ufloat32`: `ufloat32`
- `value.core.ufloat16`: `ufloat16`
- `value.core.ufloat8`: `ufloat8`
- `value.core.int64`: `i64`
- `value.core.int32`: `i32`
- `value.core.int16`: `i16`
- `value.core.int8`: `i8`
- `value.core.uint64`: `u64`
- `value.core.uint32`: `u32`
- `value.core.uint16`: `u16`
- `value.core.uint8`: `u8`
- `value.core.color`: `rgba32f`, `rgba16f`, `rgba8unorm`, `rgb8unorm`

Node definitions and graph instance ports may use `format` to declare the
chosen representation. If omitted, consumers should use the builtin default for
that semantic type.

## Implicit Conversion

Numeric and color types allow implicit representation conversion. The
conversion policy is deterministic:

- Overflow saturates to the target representation range.
- Float to int or uint clamps, sanitizes NaN/Inf, then truncates toward zero.
- Unsigned integer targets clamp negative values to zero.
- Narrowing float and color conversions may quantize.
- Color channel conversion clamps channels into the target representation range.

Conversion diagnostics should be shown in inspectors, debug views, or edge
metadata. The default canvas should not be flooded with warnings for expected
numeric/color conversions.

## Explicit Domain Crossings

Semantic conversion does not replace explicit domain-crossing nodes. Video,
audio, GPU resources, assets, and other runtime domains still require explicit
adapter or analysis nodes.
