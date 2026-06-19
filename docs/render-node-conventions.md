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

## `core.color`

`core.color` is a value source convention used by render nodes that accept
`value<color>` controls.

Canonical manifest:

`builtins/v0.1/nodes/core.color.node.json`

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
Uniform inputs are graph instance ports generated from source annotations, not
fixed manifest ports.

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
- `source` must be a non-empty WGSL fragment module.
- `source` must provide `fs_main`.
- `source` must not provide Skenion-reserved `vs_main`; Runtime generates the
  fullscreen triangle vertex entry point.
- Uniform input ports are declared by line comments:
  `// @skenion.uniform <id> <dataKind> [attributes...]`.
- Supported uniform data kinds are `number.float`, `number.int`,
  `number.uint`, `boolean`, and `color`.
- Uniform ids are port ids and WGSL field names. They are not types.
- Reserved ids `out`, `in`, `set`, `bang`, and `value` are invalid.
- `default`, `min`, `max`, `step`, and quoted `label` attributes may be used
  where they fit the uniform type.
- Generated uniform input ports are optional latched value inputs.
- If a generated uniform input is not connected, runtimes use the annotation
  default or the type default: `0.0`, `0`, `false`, or white RGBA.
- Runtimes may clamp out-of-range number and color components where the node
  convention defines clamping.
- Runtime may reject invalid shader source.
- Shader compile or render errors should be surfaced through preview telemetry
  and Runtime diagnostics.

`render.fullscreen-shader` is a frame-clocked GPU pass that produces a
`resource<gpu.texture2d>` output. Starting in v0.13, preview output should be
selected by wiring `render.fullscreen-shader:out` into `render.output:in`.

### Dynamic Interface Sync

The shader interface analyzer produces a `skenion.shader.interface` document
from WGSL annotations. `shaderInterfaceToPortsV01` converts that interface into
graph node ports. Studio must apply interface changes explicitly through the
`replaceNodeInterface` graph patch operation with
`edgePolicy: "removeInvalidEdges"`.

Example:

```wgsl
// @skenion.uniform speed number.float default=0.5 min=0 max=2 step=0.01 label="Speed"
// @skenion.uniform enabled boolean default=true label="Enabled"
// @skenion.uniform iterations number.int default=8 min=1 max=32 step=1 label="Iterations"
// @skenion.uniform tint color default=[1,0.2,0.1,1] label="Tint"
@fragment
fn fs_main() -> @location(0) vec4<f32> {
  var pulse = 0.5;
  if (sk_bool(skenion.enabled)) {
    pulse = 0.5 + 0.5 * sin(skenion.time * skenion.speed * f32(skenion.iterations));
  }
  return vec4<f32>(mix(vec3<f32>(pulse), skenion.tint.rgb, 0.45), skenion.tint.a);
}
```

Generated graph instance ports:

```text
speed      value<number.float>
enabled    value<boolean>
iterations value<number.int>
tint       value<color>
out        resource<gpu.texture2d>
```

### WGSL ABI

Runtime generates a WGSL header before the user source. Skenion exposes a single
frame uniform at group 0 binding 0. The conceptual generated ABI is:

```wgsl
struct SkenionFrame {
  resolution: vec2<f32>,
  time: f32,
  frame: u32,
  /* generated uniforms, aligned by type */
  speed: f32,
  enabled: u32,
  iterations: i32,
  tint: vec4<f32>,
}

@group(0) @binding(0)
var<uniform> skenion: SkenionFrame;

fn sk_bool(value: u32) -> bool {
  return value != 0u;
}
```

Generated scalar layout rules:

- `number.float`: `f32`, alignment 4, size 4.
- `number.int`: `i32`, alignment 4, size 4.
- `boolean`: stored as `u32`; use `sk_bool`.
- `color`: `vec4<f32>`, alignment 16, size 16.

The ABI is still intentionally small. Do not add GLSL, texture inputs, video,
audio, MIDI, asset-backed shader source, or multi-pass render graph semantics
to this node convention yet.

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
