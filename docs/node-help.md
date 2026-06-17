# Node Help Patch Graphs v0

Skenion builtin help is a validated artifact, not only prose. Each builtin node owns:

- `builtins/v0.1/help/<node-id>.help.json`
- `help/v0.1/nodes/<node-id>.help.graph.json`
- optional long-form docs under `docs/nodes/`

The help JSON gives Studio a compact panel surface: summary, description, port explanations, parameter explanations, runtime behavior, related nodes, tags, and the help graph path.

The help graph is a normal `skenion.graph` `0.1.0` document. It must validate with the same graph validator as project fixtures, use canonical builtin node kinds, and keep a stable id:

```text
help-<node-id-with-dots-replaced-by-hyphens>
```

Example:

```text
core.value-f32
help/v0.1/nodes/core.value-f32.help.graph.json
help-core-value-f32
```

Help graphs are read-only learning patches by default. Studio may offer "Open as New Graph" to copy a help graph into the user's editable patch, but the canonical help graph itself is not mutated.

New builtin node PRs must add or update the node definition, help JSON, help graph, and any relevant docs in the same change.
