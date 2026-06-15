# Skenion Contracts

Versioned contracts, schemas, generated protocol packages, and conformance tests for Skenion.

This repository is the source of truth for TypeScript/Rust communication contracts.

## Contract Surfaces

- Protobuf + Buf for live runtime control messages.
- JSON Schema for persisted graph and project documents.
- OpenAPI for HTTP runtime surfaces such as health, snapshots, assets, and diagnostics.
- Golden fixtures and conformance tests for TypeScript/Rust compatibility.

## Repository Layout

```text
proto/          Protobuf packages for live runtime contracts
json-schema/    JSON Schemas for persisted graph/project data
openapi/        HTTP API contracts
fixtures/       Valid example documents and patches
golden/         Binary and JSON golden vectors
conformance/    Cross-language compatibility tests
packages/ts/    Generated TypeScript package placeholder
crates/rust/    Generated Rust crate placeholder
docs/           Contract evolution and compatibility rules
```

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
