# Versioning

Skenion contracts use Semantic Versioning, but compatibility is negotiated by
contract family and capability, not by editor/runtime application versions.

Initial contract families:

- `runtime-wire`
- `graph-document`
- `asset-protocol`
- `preview-protocol`
- `telemetry-schema`

## Patch

- documentation fixes
- fixture clarifications
- generated-code fixes with identical wire behavior

## Minor

- optional Protobuf fields
- new commands or events gated by capabilities
- safe enum additions
- graph features old implementations can ignore safely

## Major

- removed, renamed, or retyped fields
- changed units or semantics
- new required fields
- incompatible graph behavior
- capability negotiation breaks
- plugin ABI breaks

Never reuse Protobuf field numbers or enum numbers.
