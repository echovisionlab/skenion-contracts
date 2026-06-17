# Render Node Conventions v0.1

This document records built-in render node conventions that are intentionally
small and stable enough for examples, runtimes, and Studio tooling to share.

The graph schema is unchanged. Render node behavior is defined by node
definition manifests plus graph node params.

Canonical built-in node manifests live under `builtins/v0.1/nodes`. This
document explains behavior and ABI expectations; it is not the source of truth
for manifest JSON. Consumers should import `builtinNodeDefinitionsV01` from
`@skenion/contracts` or audit their local copies against the builtins directory.

## `render.clear-color`

`render.clear-color` is the first built-in render node convention.

Canonical manifest:

`builtins/v0.1/nodes/render.clear-color.node.json`

Shape:

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

## `core.color-rgba`

`core.color-rgba` is a value source convention used by render nodes that accept
`value<color.rgba>` controls.

Canonical manifest:

`builtins/v0.1/nodes/core.color-rgba.node.json`

Graph node params:

```json
{
  "value": [1.0, 1.0, 1.0, 1.0]
}
```

`value` is `[r, g, b, a]`.

Rules:

- Components are numeric.
- Components are interpreted in the `0.0..1.0` range.
- Runtimes may clamp out-of-range values.
- Missing or invalid values should fall back to `[1.0, 1.0, 1.0, 1.0]`.

## `render.fullscreen-shader`

`render.fullscreen-shader` is a built-in fullscreen shader pass convention. The
node identity names the render pass concept, not a specific shader language.
The current built-in shader path only supports WGSL through `params.language`.

Canonical manifest:

`builtins/v0.1/nodes/render.fullscreen-shader.node.json`

Shape:

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
        "dataKind": "number.f32",
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
      "id": "u_value2",
      "direction": "input",
      "label": "u_value2",
      "type": {
        "flow": "value",
        "dataKind": "number.f32",
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
      "id": "u_color",
      "direction": "input",
      "label": "u_color",
      "type": {
        "flow": "value",
        "dataKind": "color.rgba"
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

- `language` must be `"wgsl"`.
- `source` must be a non-empty WGSL module.
- `source` must provide `vs_main` and `fs_main` entry points.
- `u_value` and `u_value2` are optional latched `value<number.f32>` inputs in
  the inclusive `0.0..1.0` range.
- `u_color` is an optional latched `value<color.rgba>` input. The source
  convention is `core.color-rgba.params.value = [r, g, b, a]`.
- If `u_value` or `u_value2` is not connected, runtimes should provide `0.0`.
- If `u_color` is not connected, runtimes should provide white
  `[1.0, 1.0, 1.0, 1.0]`.
- Runtimes may clamp out-of-range number and color components.
- v0.2 node-definition metadata should expose these uniform inputs as cold
  control-rate value inputs with `maxConnections: 1`, `mergePolicy: "forbid"`,
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
  frame: u32,

  u_value: f32,
  u_value2: f32,
  _pad0: vec2<f32>,

  u_color: vec4<f32>,
}

@group(0) @binding(0)
var<uniform> skenion: SkenionFrame;
```

The physical layout is 48 bytes. `_pad0` keeps `u_color` 16-byte aligned.
Defaults are `u_value = 0.0`, `u_value2 = 0.0`, and
`u_color = vec4<f32>(1.0, 1.0, 1.0, 1.0)`.

Existing shaders that only declare `resolution`, `time`, `frame`, and
`u_value` need to update the uniform struct layout before reading the new
fields.

The preview renderer calls:

- `vs_main` as the vertex entry point
- `fs_main` as the fragment entry point

The shader should draw a fullscreen triangle using `@builtin(vertex_index)`.
The default example is:

```wgsl
struct SkenionFrame {
  resolution: vec2<f32>,
  time: f32,
  frame: u32,

  u_value: f32,
  u_value2: f32,
  _pad0: vec2<f32>,

  u_color: vec4<f32>,
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
  let pulse = 0.5 + 0.5 * sin(skenion.time * 2.0);
  let mix_value = clamp(skenion.u_value, 0.0, 1.0);
  let brightness = 0.25 + 0.75 * clamp(skenion.u_value2, 0.0, 1.0);
  let animated = vec3<f32>(pulse, 0.2 + mix_value * 0.8, 1.0 - mix_value);
  let rgb = mix(animated, skenion.u_color.rgb, mix_value) * brightness;
  return vec4<f32>(rgb, skenion.u_color.a);
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
