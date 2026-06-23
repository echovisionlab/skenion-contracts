# Node Help Patch Graphs v0

skenion builtin help is a validated artifact, not only prose. Each builtin node owns:

- `builtins/v0.1/help/<node-id>.help.json`
- `help/v0.1/nodes/<node-id>.help.graph.json`
- optional long-form docs under `docs/nodes/`

The help JSON gives Studio a compact panel surface: summary, description, port explanations, parameter explanations, runtime behavior, related nodes, tags, and the help graph path.

The checked-in `help/v0.1` graphs are normal active `skenion.graph` `0.1.0`
documents. First-party and package help can also be represented as
`PatchDefinitionV01` entries opened as real graph views, with selected fragments
copied as `GraphFragmentV01`.

Help graph documents must validate with the current graph validator, use
canonical builtin node kinds, and keep a stable id:

```text
help-<node-id-with-dots-replaced-by-hyphens>
```

Example:

```text
core.float
help/v0.1/nodes/core.float.help.graph.json
help-core-float
```

Help graphs are read-only learning patches by default. Studio may offer "Open as New Graph" to copy a help graph into the user's editable patch, but the canonical help graph itself is not mutated.

New builtin node PRs must add or update the node definition, help JSON, help graph, and any relevant docs in the same change.

Help graphs may demonstrate panel controls and named object routing, but
they remain ordinary graph documents. Runtime-only interactions such as moving a
slider or clicking a toggle are shown through the relevant node contract; they
are not serialized into the canonical help graph.
