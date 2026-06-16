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
  "ports": [
    {
      "id": "out",
      "direction": "output",
      "label": "Out",
      "type": {
        "flow": "resource",
        "dataKind": "gpu.texture2d",
        "format": "rgba8unorm",
        "colorSpace": "srgb"
      }
    }
  ],
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

`render.clear-color` is a frame-clocked GPU pass that produces a
`resource<gpu.texture2d>` output. Starting in v0.13, preview output should be
selected by wiring `render.clear-color:out` into `render.output:in`.

## `render.fullscreen-shader`

`render.fullscreen-shader` is a built-in fullscreen shader pass convention. The
node identity names the render pass concept, not a specific shader language.
Skenion v0.12 only supports WGSL through `params.language`.

Node definition:

```json
{
  "schema": "skenion.node.definition",
  "schemaVersion": "0.1.0",
  "id": "render.fullscreen-shader",
  "version": "0.1.0",
  "displayName": "Fullscreen Shader",
  "category": "Render",
  "ports": [
    {
      "id": "u_value",
      "direction": "input",
      "label": "u_value",
      "type": {
        "flow": "value",
        "dataKind": "f32",
        "range": {
          "min": 0,
          "max": 1,
          "step": 0.01
        }
      },
      "required": false,
      "activation": "latched"
    },
    {
      "id": "out",
      "direction": "output",
      "label": "Out",
      "type": {
        "flow": "resource",
        "dataKind": "gpu.texture2d",
        "format": "rgba8unorm",
        "colorSpace": "srgb"
      }
    }
  ],
  "execution": {
    "model": "gpu_pass",
    "clock": "frame"
  },
  "state": {
    "persistent": false
  },
  "permissions": [],
  "capabilities": [
    "render.output.fullscreen-shader"
  ]
}
```

Graph node params:

```json
{
  "language": "wgsl",
  "source": "<WGSL source>"
}
```

Rules:

- `language` must be `"wgsl"` in v0.12.
- `source` must be a non-empty WGSL module.
- `source` must provide `vs_main` and `fs_main` entry points.
- `u_value` is an optional latched `value<f32>` input in the inclusive
  `0.0..1.0` range.
- If `u_value` is not connected, runtimes should provide `0.0`.
- v0.2 node-definition metadata should expose `u_value` as a cold control-rate
  `value.number` input with `maxConnections: 1`, `mergePolicy: "forbid"`,
  `triggerMode: "cold"`, `latch: true`, and `required: false`.
- Runtime may reject invalid shader source.
- Shader compile or render errors should be surfaced through preview telemetry
  and Runtime diagnostics.

`render.fullscreen-shader` is a frame-clocked GPU pass that produces a
`resource<gpu.texture2d>` output. Starting in v0.13, preview output should be
selected by wiring `render.fullscreen-shader:out` into `render.output:in`.

### WGSL ABI

Skenion exposes a single frame uniform at group 0 binding 0. The conceptual ABI
is:

```wgsl
struct SkenionFrame {
  resolution: vec2<f32>,
  time: f32,
  u_value: f32,
  frame: u32,
}

@group(0) @binding(0)
var<uniform> skenion: SkenionFrame;
```

The current physical WGSL layout should include explicit padding so it matches
the 32-byte Runtime uniform buffer:

```wgsl
struct SkenionFrame {
  resolution: vec2<f32>,
  time: f32,
  u_value: f32,
  frame: u32,
  _pad0: u32,
  _pad1: u32,
  _pad2: u32,
}

@group(0) @binding(0)
var<uniform> skenion: SkenionFrame;
```

Existing shaders that only declare `resolution`, `time`, and `frame` remain
valid as long as they do not read `u_value`.

The preview renderer calls:

- `vs_main` as the vertex entry point
- `fs_main` as the fragment entry point

The shader should draw a fullscreen triangle using `@builtin(vertex_index)`.
The default example is:

```wgsl
struct SkenionFrame {
  resolution: vec2<f32>,
  time: f32,
  u_value: f32,
  frame: u32,
  _pad0: u32,
  _pad1: u32,
  _pad2: u32,
}

@group(0) @binding(0)
var<uniform> skenion: SkenionFrame;

struct VertexOut {
  @builtin(position) position: vec4<f32>,
}

@vertex
fn vs_main(@builtin(vertex_index) vertex_index: u32) -> VertexOut {
  var positions = array<vec2<f32>, 3>(
    vec2<f32>(-1.0, -3.0),
    vec2<f32>(-1.0,  1.0),
    vec2<f32>( 3.0,  1.0)
  );

  var out: VertexOut;
  out.position = vec4<f32>(positions[vertex_index], 0.0, 1.0);
  return out;
}

@fragment
fn fs_main() -> @location(0) vec4<f32> {
  return vec4<f32>(
    skenion.u_value,
    0.2,
    1.0 - skenion.u_value,
    1.0
  );
}
```

The ABI is intentionally small. Do not add mouse, audio, textures, MIDI,
additional custom uniforms, or asset-backed shader source to this node
convention yet.

## `render.output`

`render.output` is the explicit final preview output selector. It lets Studio
and Runtime agree on which render node feeds the local preview surface instead
of relying on first-matching render node scans.

Node definition:

```json
{
  "schema": "skenion.node.definition",
  "schemaVersion": "0.1.0",
  "id": "render.output",
  "version": "0.1.0",
  "displayName": "Render Output",
  "category": "Render",
  "ports": [
    {
      "id": "in",
      "direction": "input",
      "label": "In",
      "type": {
        "flow": "resource",
        "dataKind": "gpu.texture2d",
        "format": "rgba8unorm",
        "colorSpace": "srgb"
      },
      "activation": "latched"
    }
  ],
  "execution": {
    "model": "frame",
    "clock": "frame"
  },
  "state": {
    "persistent": false
  },
  "permissions": [],
  "capabilities": [
    "render.output.surface"
  ]
}
```

Rules:

- `render.output` selects the final local preview surface source.
- `render.output:in` accepts `resource<gpu.texture2d>` render outputs.
- v0.13 supports one effective output. If multiple `render.output` nodes exist,
  runtimes should select deterministically and report a diagnostic.
- If no `render.output` node exists, runtimes may use legacy render node
  selection for backward compatibility and should surface a diagnostic.

## Preview Document

Runtime preview documents are runtime-internal in v0.10. They are not a shared
contract yet. If a future tool or process needs to produce preview documents
directly, promote that document shape into `json-schema/preview/v0.1/`.
