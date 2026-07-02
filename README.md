# skenion Contracts

Versioned contracts, schemas, generated protocol packages, and conformance tests for skenion.

This repository is the source of truth for shared TypeScript/Rust document and
payload contracts: schemas, DTOs, generated schema/shape validators, generated
types, and fixtures. It is not the source of truth for Runtime HTTP,
WebSocket/SSE, replay, collaboration, live connection, session mutation, or
Runtime client authority. Runtime and package registries own object
availability, registry-aware validation, object execution, operation
acceptance, endpoint envelopes, and connection authority while using the
Contracts-defined manifest and graph payload shapes where those payloads are
shared.
Human-readable delivery and processing model docs live in
[skenion/skenion-docs](https://github.com/skenion/skenion-docs).

## Contract Surfaces

- JSON Schema for persisted graph and project documents.
- JSON Schema for node definition manifests, object interface definitions, and
  package manifests.
- Golden fixtures and conformance tests for TypeScript/Rust shape compatibility.
- Typed node interfaces for value, event, stream, and resource ports.

The active graph/project contract is v0.1. `GraphFragmentV01`, `GraphTargetRef`,
`PatchPath`, `PastePlacement`, and `PasteGraphFragmentRequest` remain shared
graph transform payloads. Runtime-owned operation envelopes, session/replay
events, collaboration messages, logs, endpoint responses, and package-registry
client wrappers are not Contracts public API. The v0.1 label is the current
rich graph shape, including patch libraries, graph fragments, view state,
package manifests/listings/install plans, and extension-provided nodes. Older
v0.1 graph/project/patch compatibility and migration helpers are not active
contract surfaces.

Objects preserve user-entered `objectSpec`; Runtime resolution maps that spec to
implementation kinds and issues without making unresolved specs a separate
user-facing node class.

Package manifests and public listings declare object authoring exports under
`provides.objects[]`. Each object export carries an internal `objectId`, a short
user-facing `primaryObjectSpec`, optional `aliases`, a package-relative
`definitionPath`, and optional `description` / `helpId`. `provides.nodes[]`
remains a list of node-definition assets and is not the executable authoring
surface for objects.

## Repository Layout

```text
json-schema/    JSON Schemas for graph and node definition data
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
Object spec parse outputs are defined in
[Object Spec Parser Contract](docs/object-spec-parser.md). The first audio DSP
contract baseline is documented in
[Audio DSP Contract Baseline](docs/audio-dsp-contract.md).

## Initial Validation

```bash
pnpm install
pnpm run ci
```

For sibling-repository source integration, build the local package and capture
machine-readable evidence for the consumer issue or PR:

```bash
pnpm run build
pnpm run local-integration:evidence
```

The evidence command prints JSON with the local TypeScript package path/version,
the required `dist/index.js` and `dist/index.d.ts` entries, the Rust crate
path/version, and the current git branch, commit, and dirty state. It fails
without publishing or mutating release state when required local build outputs
are missing. Committed dependency manifests remain registry-first; sibling
repositories should use this evidence only for explicit unreleased source
integration work.

For CI parity on release and workflow changes, also run the Rust package gates:

```bash
cargo metadata --manifest-path packages/rust/Cargo.toml --locked --format-version 1 >/dev/null
cargo package --manifest-path packages/rust/Cargo.toml --locked --no-verify
cargo fmt --check --manifest-path packages/rust/Cargo.toml
cargo clippy --manifest-path packages/rust/Cargo.toml --all-targets --all-features -- -D warnings
cargo llvm-cov --manifest-path packages/rust/Cargo.toml --all-targets --all-features --fail-uncovered-lines 0 --fail-under-functions 100
git diff --exit-code -- packages/rust/Cargo.lock
```

## Status

Bootstrap repository for the skenion project. Implementation follows the public architecture and release rules defined in [skenion/skenion](https://github.com/skenion/skenion).

The `@skenion/contracts` npm package and `skenion-contracts` Rust crate remain
publishable release artifacts because they are importable contract and
schema/shape validator libraries. Publishing still runs only through GitHub
Actions release workflows.

Contracts packages also export exact v0 Contracts version helpers and the
`skenion.compatibility-matrix` schema/types/validators. The compatibility
matrix records Contracts package identity, the SDK-required exact Contracts
version, component versions, and protocol baselines. Runtime/Studio release artifacts,
checksums, S3 locations, promotion gates, and product release-set completeness
belong to the repositories and workflows that produce those artifacts, not to
the Contracts package.

The `@skenion/contracts` package does not export `builtins/v0.1` as a canonical
public builtin object inventory. Checked-in builtin JSON remains local fixture
and validation material for the contract shapes; its manifest is explicitly
scoped as `fixture-reference`. Consumers should discover first-party and
package-provided object definitions from Runtime/package surfaces that use
`NodeDefinitionManifestV01`.

## License And Credit

This repository is licensed under the Apache License, Version 2.0.

Redistributions must preserve copyright, license, and NOTICE information as required by Apache-2.0. If skenion helps your artwork, research, publication, installation, or tool, please credit skenion.
