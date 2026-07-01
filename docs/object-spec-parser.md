# Object Spec Parser Contract v0.1

Human-facing Pd-style object spec is parsed into a machine-readable report. The
report is used by Studio and Runtime to create or update typed objects, but it is
not the long-term persisted implementation identity of the user-facing object.
The machine-readable parse output schema is
`json-schema/object-spec/v0.1/parse-result.schema.json`.

For design intent, see the skenion Docs
[object spec parser model](https://github.com/skenion/skenion-docs/blob/main/docs/model/object-spec-parser.md).

## Parse Result

A parser result records original input text, class name, creation arguments,
an optional resolved implementation reference when a Runtime/package resolver
supplies one, optional resolution state, params, specialized instance ports,
display text, and issues.

Contracts exports a pure lexical helper for this shape. The helper normalizes
optional brackets, tokenizes the class name and creation arguments, and leaves
`implementation`, `objectResolution`, `params`, and `instancePorts` empty.
Concrete object availability, alias mapping, argument arity/type checks, and
implementation-port specialization belong to Runtime/package registries.

Runtime/package resolver failures should still produce a valid parse result
with `ok: false` and error issues. They must not silently create an
approximate node.

The v0 object authoring target is that objects preserve `objectSpec` as the
source of truth and carry resolution state separately. A resolved object spec
may point at a Runtime/package implementation reference. That reference is
provider-scoped identity such as core, project patch, or package plus `objectId`
and optional version/interface data. An unresolved object spec remains the same
editable typed object with issues. Resolution failure is not a separate
user-facing node class.

## Lexical Baseline

The Contracts helper baseline covers lexical examples such as `[+ 1]`,
`[*~ 0.5]`, `[osc~ 440]`, `[sqrt~]`, and package namespaced symbols. These
examples exercise token and atom shape only; they do not declare first-party
object availability or runtime semantics.

Object spec is an authoring surface and the visible source for objects. Current
v0 objects must use the active `0.1` graph shape and may
carry resolution state that points at the Runtime implementation reference.
Unsupported old import or migration-only object authoring shapes are rejected with
issues by the validator or resolver that owns that surface.
