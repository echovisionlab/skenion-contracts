# Object Spec Parser Contract v0.1

Human-facing Pd-style object spec is parsed into a machine-readable report. The
report is used by Studio and Runtime to create or update object boxes, but it is
not the long-term persisted identity of the user-facing box.
The machine-readable parse output schema is
`json-schema/object-spec/v0.1/parse-result.schema.json`.

For design intent, see the skenion Docs
[object spec parser model](https://github.com/skenion/skenion-docs/blob/main/docs/model/object-spec-parser.md).

## Parse Result

A parser result records original input text, class name, creation arguments,
the resolved implementation kind when a Runtime/package resolver supplies one,
params, specialized instance ports, display text, and diagnostics.

Contracts exports a pure lexical helper for this shape. The helper normalizes
optional brackets, tokenizes the class name and creation arguments, and leaves
`resolvedKind`, `resolvedKindVersion`, `params`, and `instancePorts` empty.
Concrete object availability, alias mapping, argument arity/type checks, and
implementation-port specialization belong to Runtime/package registries.

Runtime/package resolver failures should still produce a valid parse result
with `ok: false` and error diagnostics. They must not silently create an
approximate node.

The v0 object-box target is that typed object boxes preserve `objectSpec` as the
source of truth and carry resolution state separately. A resolved object spec
may point at a Runtime/package implementation kind; an unresolved object spec
remains the same editable object box with diagnostics. Resolution failure is not
a separate user-facing node class.

## Lexical Baseline

The Contracts helper baseline covers lexical examples such as `[+ 1]`,
`[*~ 0.5]`, `[osc~ 440]`, `[sqrt~]`, and package namespaced symbols. These
examples exercise token and atom shape only; they do not declare first-party
object availability or runtime semantics.

Object spec is an authoring surface and the visible source for typed object
boxes. Current v0 object boxes must use the active `0.1` graph shape and may
carry resolution state that points at the Runtime implementation kind.
Unsupported old import or migration-only object-box shapes are rejected with
diagnostics by the validator or resolver that owns that surface.
