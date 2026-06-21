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

`graph-document@0.0.0` is frozen as the bootstrap baseline. Its schema remains
available for fixtures and migration tests.

`graph-document@0.1.0` introduces directioned ports, `flow + dataKind`, and
node-definition references through `kind` and `kindVersion`.

`graph-document@0.2.0` is the active authoring/runtime contract. Product code
should use `ProjectDocumentV02`, `GraphDocumentV02`, `PatchDefinitionV02`,
`PatchContractV02`, `GraphFragmentV02`, and v0.2 `GraphTargetRef` target paths
for new project, help, runtime, and collaboration work.

`graph-document@0.1.0` and its graph patch/history schemas are frozen legacy
surfaces. They may be parsed by migration/import tooling and validated as
fixtures, but they are not active authoring, runtime mutation, collaboration, or
help patch contracts.

Do not mutate old schema files in place when a persisted document shape changes.
Add a new schema version and migration fixture instead.
