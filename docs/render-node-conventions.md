# Render Node Conventions v0.1

This document records Runtime-owned render node convention examples that were
used while exercising the v0.1 node-definition and graph contracts. Contracts
does not publish these examples as the canonical first-party object inventory.
Actual object availability and execution behavior come from Runtime/package
registries.

The graph schema is unchanged. Render node behavior is described by
`NodeDefinitionManifestV01` documents plus graph node params. Consumers should
discover the concrete definitions from Runtime/package surfaces, not from
`@skenion/contracts`.

## `object.core.render.clear-color`

`object.core.render.clear-color` is the first built-in render node convention.

Example definition shape:

```json
{
  "schema": "skenion.node.definition",
  "schemaVersion": "0.1.0",
  "id": "object.core.render.clear-color",
  "version": "0.1.0",
  "displayName": "Clear Color",
  "category": "Render",
  "ports": [
    {
      "id": "out",
      "direction": "output",
      "label": "Out",
      "type": "value.core.tensor"
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
    "object.core.render.output.clear-color"
  ]
}
```

Graph node params:

```json
{
  "color": [0.05, 0.08, 0.12, 1.0]
}
```

`value.core.color` is `[r, g, b, a]`.

Rules:

- Components are numeric.
- Components are interpreted in the `0.0..1.0` range.
- Runtimes may clamp out-of-range values.
- Missing or invalid color values should fall back to a runtime default.
- The color space is intentionally simple for v0.1; do not add color
  management fields to the graph schema for this node.

`object.core.render.clear-color` is a frame-clocked GPU pass that produces a
`value.core.tensor` output. Starting in v0.13, preview output should be
selected by wiring `object.core.render.clear-color:out` into `object.core.render.output:in`.

## `object.core.color`

`object.core.color` is a value source convention used by render nodes that accept
`value.core.color` controls.

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

## `object.core.render.fullscreen-shader`

`object.core.render.fullscreen-shader` is a built-in fullscreen shader pass convention. The
node identity names the render pass concept, not a specific shader language.
The current built-in shader path only supports WGSL through `params.language`.
Uniform inputs are graph instance ports generated from source annotations, not
fixed manifest ports.

Example definition shape:

```json
{
  "schema": "skenion.node.definition",
  "schemaVersion": "0.1.0",
  "id": "object.core.render.fullscreen-shader",
  "version": "0.1.0",
  "displayName": "Fullscreen Shader",
  "category": "Render",
  "ports": [
    {
      "id": "out",
      "direction": "output",
      "label": "Out",
      "type": "value.core.tensor"
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
    "object.core.render.output.fullscreen-shader"
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
- `source` must not provide skenion-reserved `vs_main`; Runtime generates the
  fullscreen triangle vertex entry point.
- Uniform input ports are declared by line comments:
  `// @skenion.uniform <id> <dataKind> [attributes...]`.
- Supported uniform data kinds are `value.core.float32`, `value.core.int32`,
  `value.core.uint32`, `value.core.bool`, and `value.core.color`.
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

`object.core.render.fullscreen-shader` is a frame-clocked GPU pass that produces a
`value.core.tensor` output. Starting in v0.13, preview output should be
selected by wiring `object.core.render.fullscreen-shader:out` into `object.core.render.output:in`.

### Dynamic Interface Sync

The shader interface analyzer produces a `skenion.shader.interface` document
from WGSL annotations. `shaderInterfaceToPortsV01` converts that interface into
graph node ports. Studio must apply interface changes explicitly through the
active graph mutation surface with invalid edges removed.

Example:

```wgsl
// @skenion.uniform speed value.core.float32 default=0.5 min=0 max=2 step=0.01 label="Speed"
// @skenion.uniform enabled value.core.bool default=true label="Enabled"
// @skenion.uniform iterations value.core.int32 default=8 min=1 max=32 step=1 label="Iterations"
// @skenion.uniform tint value.core.color default=[1,0.2,0.1,1] label="Tint"
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
speed      value.core.float64
enabled    value.core.bool
iterations value.core.int64
tint       value.core.color
out        value.core.tensor
```

### WGSL ABI

Runtime generates a WGSL header before the user source. skenion exposes a single
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

- `value.core.float32`: `f32`, alignment 4, size 4.
- `value.core.int32`: `i32`, alignment 4, size 4.
- `value.core.bool`: stored as `u32`; use `sk_bool`.
- `value.core.color`: `vec4<f32>`, alignment 16, size 16.

The ABI is still intentionally small. Do not add GLSL, texture inputs, video,
audio, MIDI, asset-backed shader source, or multi-pass render graph semantics
to this node convention yet.

## `object.core.render.output`

`object.core.render.output` is the explicit final preview output key. It lets Studio
and Runtime agree on which render node feeds the local preview surface instead
of relying on first-matching render node scans.

Node definition:

```json
{
  "schema": "skenion.node.definition",
  "schemaVersion": "0.1.0",
  "id": "object.core.render.output",
  "version": "0.1.0",
  "displayName": "Render Output",
  "category": "Render",
  "ports": [
    {
      "id": "in",
      "direction": "input",
      "label": "In",
      "type": "value.core.tensor",
      "required": true
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
    "object.core.render.output.surface"
  ]
}
```

Rules:

- `object.core.render.output` selects the final local preview surface source.
- `object.core.render.output:in` accepts `value.core.tensor` render outputs.
- v0.13 supports one effective output. If multiple `object.core.render.output` nodes exist,
  runtimes should select deterministically and report a diagnostic.
- If no `object.core.render.output` node exists, runtimes must report that no active render
  output is available. They must not select an older render node shape as a
  fallback.

## Preview Document

Runtime preview documents are runtime-internal in v0.10. They are not a shared
contract yet. If a future tool or process needs to produce preview documents
directly, promote that document shape into `json-schema/preview/v0.1/`.
