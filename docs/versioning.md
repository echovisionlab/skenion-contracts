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

## Graph Schema Baseline

`graph-document@0.1.0` is the active authoring/runtime contract. Product code
should use `ProjectDocumentV01`, `GraphDocumentV01`, `PatchDefinitionV01`,
`PatchContractV01`, `GraphFragmentV01`, and v0.1 `GraphTargetRef` target paths
for project, help, runtime, and collaboration work. The v0.1 label carries the
current rich graph shape, including directioned string-typed ports, edge
policies, patch libraries, graph fragments, view state, runtime operation, and
collaboration surfaces.

Unsupported graph, project, package, manifest, and protocol versions are
rejected with structured diagnostics. Do not add import-only compatibility
paths, migration fixtures, or deprecated aliases for old v0 shapes during v0.
