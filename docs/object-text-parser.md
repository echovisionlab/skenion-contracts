# Object Text Parser Contract v0.1

Human-facing Pd-style object text is parsed into explicit Skenion node
contracts. The machine-readable parse output schema is
`json-schema/object-text/v0.1/parse-result.schema.json`.

For design intent, see the Skenion Docs
[object text parser model](https://github.com/echovisionlab/skenion-docs/blob/main/docs/model/object-text-parser.md).

## Parse Result

A parser result records original input text, class symbol, creation arguments,
resolved canonical node kind, params, specialized instance ports, display text,
and diagnostics.

Unsupported or invalid object text should still produce a valid parse result
with `ok: false` and error diagnostics. It must not silently create an
approximate node.

## First Baseline

The first baseline covers control arithmetic, audio arithmetic, audio sources,
and unary DSP examples such as `[+ 1]`, `[*~ 0.5]`, `[osc~ 440]`, and `[sqrt~]`.

Object text is an authoring surface only. Persisted graph nodes still use
explicit `kind`, `params`, and `ports`.

