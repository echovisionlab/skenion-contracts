# Render Node Conventions v0.1

This document records built-in render node conventions that are intentionally
small and stable enough for examples, runtimes, and Studio tooling to share.

The graph schema is unchanged. Render node behavior is defined by node
definition manifests plus graph node params.

## `render.clear-color`

`render.clear-color` is the first built-in render node convention.

Node definition:

```json
{
  "schema": "skenion.node.definition",
  "schemaVersion": "0.1.0",
  "id": "render.clear-color",
  "version": "0.1.0",
  "displayName": "Clear Color",
  "category": "Render",
  "ports": [],
  "execution": {
    "model": "gpu_pass",
    "clock": "frame"
  },
  "state": {
    "persistent": false
  },
  "permissions": [],
  "capabilities": [
    "render.output.clear-color"
  ]
}
```

Graph node params:

```json
{
  "color": [0.05, 0.08, 0.12, 1.0]
}
```

`color` is `[r, g, b, a]`.

Rules:

- Components are numeric.
- Components are interpreted in the `0.0..1.0` range.
- Runtimes may clamp out-of-range values.
- Missing or invalid color values should fall back to a runtime default.
- The color space is intentionally simple for v0.1; do not add color
  management fields to the graph schema for this node.

`render.clear-color` has no ports in v0.1. It is a frame-clocked GPU pass that
clears the local preview output.

## Preview Document

Runtime preview documents are runtime-internal in v0.10. They are not a shared
contract yet. If a future tool or process needs to produce preview documents
directly, promote that document shape into `json-schema/preview/v0.1/`.
