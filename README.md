# skenion Contracts

Versioned contracts, schemas, generated protocol packages, and conformance tests for skenion.

This repository is the source of truth for TypeScript/Rust communication contracts.
Human-readable delivery and processing model docs live in
[skenion/skenion-docs](https://github.com/skenion/skenion-docs).

## Contract Surfaces

- Protobuf + Buf for live runtime control messages.
- JSON Schema for persisted graph and project documents.
- JSON Schema for node definition manifests.
- OpenAPI for HTTP runtime surfaces such as health, snapshots, assets, and diagnostics.
- Golden fixtures and conformance tests for TypeScript/Rust compatibility.
- Typed node interfaces for value, event, stream, and resource ports.

The active graph/project contract is v0.1. Runtime-authoritative session
snapshots expose `ProjectDocumentV01` at `RuntimeSessionSnapshot.project`;
active graph mutation surfaces use `RuntimeOperationEnvelope`,
`GraphTargetRef`, and `GraphFragmentV01`. The v0.1 label is the current rich
graph shape, including patch libraries, graph fragments, view state,
extension-provided nodes, and runtime operation/collaboration contracts. Older
v0.1 graph/project/patch compatibility and migration helpers are not active
contract surfaces.

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
[skenion Docs data delivery model](https://github.com/skenion/skenion-docs/blob/main/docs/model/data-delivery-model.md).
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

Bootstrap repository for the skenion project. Implementation follows the public architecture and release rules defined in [skenion/skenion](https://github.com/skenion/skenion).

The `@skenion/contracts` npm package and `skenion-contracts` Rust crate remain
publishable release artifacts because they are importable contract and validator
libraries. Publishing still runs only through GitHub Actions release workflows.
Release train registry gates are limited to `contractsNpm`, `contractsCrate`,
and `sdkNpm`; Runtime and Studio are tracked through release artifacts.

Contracts packages also export canonical v0 compatibility-line helpers and the
`skenion.compatibility-matrix` schema/types/validators. The compatibility
matrix records unequal component versions, Runtime/Studio artifacts and
checksums, SDK-supported Contracts ranges, examples conformance, Docs Manual
Pages evidence, protocol baselines, capabilities, and promotion state.

## License And Credit

This repository is licensed under the Apache License, Version 2.0.

Redistributions must preserve copyright, license, and NOTICE information as required by Apache-2.0. If skenion helps your artwork, research, publication, installation, or tool, please credit skenion.
