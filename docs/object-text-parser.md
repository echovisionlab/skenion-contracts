# Object Text Parser Contract v0.1

Human-facing Pd-style object text is parsed and resolved into a machine-readable
report. The report is used by Studio and Runtime to create or update object
boxes, but it is not the long-term persisted identity of the user-facing box.
The machine-readable parse output schema is
`json-schema/object-text/v0.1/parse-result.schema.json`.

For design intent, see the Skenion Docs
[object text parser model](https://github.com/echovisionlab/skenion-docs/blob/main/docs/model/object-text-parser.md).

## Parse Result

A parser result records original input text, class symbol, creation arguments,
the resolved implementation kind when available, params, specialized instance
ports, display text, and diagnostics.

Unsupported or invalid object text should still produce a valid parse result
with `ok: false` and error diagnostics. It must not silently create an
approximate node.

The v0 object-box target is that typed object boxes preserve `objectText` as the
source of truth and carry resolution state separately. A resolved object text
such as `decode` may execute as `core.video-decode`; an unresolved object text
such as `user.manipulator` remains the same editable object box with diagnostics.
Resolution failure is not a separate user-facing node class.

## First Baseline

The first baseline covers control arithmetic, audio arithmetic, audio sources,
and unary DSP examples such as `[+ 1]`, `[*~ 0.5]`, `[osc~ 440]`, and `[sqrt~]`.

Object text is an authoring surface and the visible source for typed object
boxes. Current v0 object boxes must use the active `0.1` graph shape and carry
resolution state that points at the Runtime implementation kind. Unsupported
old import or migration-only object-box shapes are rejected with diagnostics.
