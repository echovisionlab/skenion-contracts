# Node Help Patch Graphs v0

Skenion builtin help is a validated artifact, not only prose. Each builtin node owns:

- `builtins/v0.1/help/<node-id>.help.json`
- `help/v0.1/nodes/<node-id>.help.graph.json`
- optional long-form docs under `docs/nodes/`

The help JSON gives Studio a compact panel surface: summary, description, port explanations, parameter explanations, runtime behavior, related nodes, tags, and the help graph path.

The checked-in `help/v0.1` graphs are legacy import/migration fixtures. The
active help-patch surface is the graph v0.2 project/patch-library contract:
first-party and package help should be represented as `PatchDefinitionV02`
entries opened as real graph views, with selected fragments copied as
`GraphFragmentV02`.

Legacy help graph fixtures are normal `skenion.graph` `0.1.0` documents. They must validate with the same legacy graph validator as migration fixtures, use canonical builtin node kinds, and keep a stable id:

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
