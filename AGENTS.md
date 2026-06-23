# Codex Agent Context

This repository is one part of the Skenion workspace. Do not treat local code
momentum as the source of truth: before committing, pushing, opening a PR, or
writing PR close keywords, check the relevant GitHub milestone and issue with
`/opt/homebrew/bin/gh`.

## Strict v0 Contract Policy

Skenion v0 does not support legacy, deprecated, or import-only compatibility
paths. Contracts must model the current product surface only. Unsupported
schema, protocol, graph, project, package, manifest, or ABI versions must be
rejected with structured diagnostics rather than migrated, imported, shimmed, or
kept behind deprecated aliases.

The forward graph/project contract label is `0.1`. Remove v0.2 as a separate
contract surface and merge the current v0.2 design/content into the 0.1 label.
Do not preserve the old v0.1 meaning as legacy compatibility. If a version
field remains, validators should accept only exact current `0.1` for that
surface and reject all others.

## Component Releases And Compatibility Matrices

Release Please owns natural component releases for this repository. The hub
verifies and promotes compatibility matrices; it does not conduct component
releases or require all repositories to publish the same product version.
Contracts define the v0 compatibility line: supporting Contracts `0.45` means
supporting `>=0.45.0 <0.46.0`, while Runtime, SDK, Studio, docs, and examples
may release at different component versions.

Registry publishing must happen only through GitHub Actions release workflows
and Release Please. Local verification may use dry-run commands, but never run a
local npm or crates.io upload.

Workflows that need cross-repository or release automation credentials must use
the organization Actions secret `GH_TOKEN`. Do not add `RELEASE_PLEASE_TOKEN`,
`SKENION_RELEASE_TRAIN_TOKEN`, or default Actions-token fallbacks for release,
compatibility-matrix, artifact-verification, or promotion workflows.

## Repository Role

This repo owns public contracts, JSON Schemas, generated validators/clients, and
compatibility-matrix metadata helpers. Keep manual TypeScript/Rust contract
duplicates out of downstream repos; generated or exported contract artifacts
should be the source of truth.

## Manager, Worker, And Review Gate Defaults

Codex should operate as a manager/orchestrator on Skenion work. The manager owns
sequencing, milestone and issue hygiene, PR title/body/close-keyword control,
worker assignment, integration, and final reporting. Except for trivial
documentation, context, issue, or status edits, the manager should not directly
modify code. Implementation work and follow-up fixes should be delegated to
focused worker agents, then integrated by the manager. Workers must receive a
clear ownership scope, usually specific files, modules, or repository slices,
and must be told that other agents may be editing nearby code.

Follow-up work is not an exception: if review, CI, or user feedback requires
non-trivial code changes, the manager must assign that work to a worker and send
the completed slice through a separate review gate again. The manager may run
verification and status commands, but should not directly patch non-trivial
implementation code.

Every completed worker slice needs a separate review gate before it is treated
as done. The gate should be a different expert agent from the worker. A gate
review should prioritize correctness, API cleanliness, responsibility
boundaries, readability, test coverage, CI risk, and milestone acceptance
criteria. If the gate fails, the manager must send concrete fixes back to a
worker, then run the gate again until the slice passes or a real blocker is
recorded in the issue. The manager may only make trivial documentation,
context, issue, or status corrections directly.

Default code quality requirements:

- Write code that is easy to read before it is clever.
- Follow clean-code principles: clear names, small responsibilities, explicit
  data flow, predictable control flow, and low incidental coupling.
- Do not introduce interface-based abstraction lightly. Public APIs, traits,
  generated clients, schemas, and extension points must earn their existence and
  remain small, stable, and understandable.
- Keep responsibility ownership clear. Runtime, Studio, Contracts, SDK,
  Examples, and Docs must not duplicate each other's source-of-truth roles.
- UI/UX work must be reviewed for actual workflow quality, not merely rendered
  components.

Issues and milestones are the operating ledger. When work discovers new debt,
missing scope, or a design risk, record it on the relevant GitHub issue or open
a properly milestoned issue before burying it in local context. Close issues
only when the repository-specific acceptance criteria are genuinely complete.
Use `Refs` for partial or cross-repo work and `Closes` only for finished scope.
