# Node Help Patch Graphs v0

Node help is a validated artifact, not only prose. Contracts defines the help
document and graph shapes; Runtime/package registries own which first-party or
package objects are available. Local fixture files in this repository exercise
those shapes; they are not a public Contracts-owned object inventory.

Each package or Runtime-owned object help entry may include equivalent data:

- a compact help JSON document
- a help graph JSON document
- optional long-form docs under `docs/nodes/`

The help JSON gives Studio a compact panel surface: summary, description, port explanations, parameter explanations, runtime behavior, related nodes, tags, and the help graph path.

The checked-in `help/v0.1` graphs are normal active `skenion.graph` `0.1.0`
documents. First-party and package help can be represented as
`PatchDefinitionV01` entries opened as real graph views, with selected fragments
copied as `GraphFragmentV01`.

Help graph documents must validate with the current graph validator, use
node kinds from the registry/package definition set being demonstrated, and
keep a stable id:

```text
help-<node-id-with-dots-replaced-by-hyphens>
```

Example:

```text
package.example.gain
help-package-example-gain
```

Help graphs are read-only learning patches by default. Studio may offer "Open
as New Graph" to copy a help graph into the user's editable patch, but the
source help graph itself is not mutated.

Runtime/package object PRs should keep their provided node definition, help
JSON, help graph, and relevant docs together. Contracts PRs should add local
fixtures only when they exercise contract shape or validator behavior.

Help graphs may demonstrate panel controls and named object routing, but
they remain ordinary graph documents. Runtime-only interactions such as moving a
slider or clicking a toggle are shown through the relevant node contract; they
are not serialized into the source help graph.
