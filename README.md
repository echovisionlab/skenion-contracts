# Skenion Contracts

Versioned contracts, schemas, generated protocol packages, and conformance tests for Skenion.

This repository is the source of truth for TypeScript/Rust communication contracts.
Human-readable delivery and processing model docs live in
[EchoVisionLab/skenion-docs](https://github.com/echovisionlab/skenion-docs).

## Contract Surfaces

- Protobuf + Buf for live runtime control messages.
- JSON Schema for persisted graph and project documents.
- JSON Schema for node definition manifests.
- OpenAPI for HTTP runtime surfaces such as health, snapshots, assets, and diagnostics.
- Golden fixtures and conformance tests for TypeScript/Rust compatibility.
- Typed node interfaces for value, event, stream, and resource ports.

The active graph/project contract is v0.2. Runtime-authoritative session
snapshots expose `ProjectDocumentV02` at `RuntimeSessionSnapshot.project`;
active graph mutation surfaces use `RuntimeOperationEnvelope`,
`GraphTargetRef`, and `GraphFragmentV02`. v0.1 graph/project/patch documents
remain available only as legacy import and migration fixtures.
The TypeScript `applyGraphPatch`/`invertGraphPatch` exports are deprecated
v0.1 legacy helpers; migration tooling should prefer the explicitly named
`applyLegacyGraphPatchV01`/`invertLegacyGraphPatchV01` aliases.

Typed object boxes preserve user-entered `objectText`; Runtime resolution maps
that text to implementation kinds and diagnostics without making unresolved text
a separate user-facing node class.

## Repository Layout

```text
proto/          Protobuf packages for live runtime contracts
json-schema/    JSON Schemas for graph and node definition data
openapi/        HTTP API contracts
fixtures/       Valid and invalid example documents and patches
golden/         Binary and JSON golden vectors
conformance/    Cross-language compatibility tests
packages/ts/    Generated TypeScript package placeholder
crates/rust/    Generated Rust crate placeholder
docs/           Contract evolution and compatibility rules
```

See [Node Interface](docs/node-interface.md) for the initial node and port type
model, and [Script Nodes](docs/script-nodes.md) for the script node manifest
boundary.
For design review of how values, messages, audio, video, render frames, and GPU
resources move through the system, start with the
[Skenion Docs data delivery model](https://github.com/echovisionlab/skenion-docs/blob/main/docs/model/data-delivery-model.md).
Object text parse outputs are defined in
[Object Text Parser Contract](docs/object-text-parser.md). The first audio DSP
contract baseline is documented in
[Audio DSP Contract Baseline](docs/audio-dsp-contract.md).

## Initial Validation

```bash
pnpm install
pnpm run ci
```

## Status

Bootstrap repository for the Skenion project. Implementation follows the public architecture and release rules defined in [EchoVisionLab/skenion](https://github.com/echovisionlab/skenion).

## License And Credit

This repository is licensed under the Apache License, Version 2.0.

Redistributions must preserve copyright, license, and NOTICE information as required by Apache-2.0. If Skenion helps your artwork, research, publication, installation, or tool, please credit Skenion and EchoVisionLab.
