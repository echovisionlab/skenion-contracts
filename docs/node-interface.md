# Node Interface v0.1

skenion nodes are typed, time-aware runtime actors. The persisted graph document
stores patch wiring. Runtime scheduling details live in node definition
manifests and runtime registries.

For human-readable review of how data moves across control, audio, video,
render, and GPU domains, see the
[skenion Docs data delivery model](https://github.com/skenion/skenion-docs/blob/main/docs/model/data-delivery-model.md).

## Documents

There are two related contracts:

- `skenion.graph` describes node instances, ports, and edges in a saved patch.
- `skenion.node.definition` describes a node kind that a runtime, plugin, or
  script module can provide.

Graph documents reference node definitions by `kind` and `kindVersion`. They do
not persist a scheduler plan, GPU pass order, script lifecycle, or permissions.

## Port Type Model

v0.1 uses one canonical type model:

```json
{
  "flow": "value",
  "dataKind": "number.float",
  "unit": "px",
  "range": { "min": 0, "max": 100 }
}
```

Do not add a separate `domain` field to graph schema. In the design notes,
domain names such as audio, video, gpu, clock, and message are explanatory
categories. In the contract, those concepts are expressed through `flow`,
`dataKind`, and constraints.

## Flow

`flow` describes temporal delivery semantics.

| Flow | Meaning |
| --- | --- |
| `value` | Retained current value. |
| `event` | Discrete occurrence; may have no durable value. |
| `signal` | Time-varying control signal sampled by a clock. |
| `stream` | Ordered media/block data with backpressure or drop policy. |
| `resource` | Asset or runtime resource handle. |

Current v0 graphs use `value` and `signal`. Older `constant` and `sampled`
flow names are not valid `0.1` contract values and must be rejected with
diagnostics.

## Data Kind

`dataKind` describes payload semantics.

Initial core data kinds:

| Data kind | Typical flow | Meaning |
| --- | --- | --- |
| `event.bang` | `event` | Momentary trigger event. |
| `boolean` | `value`, `signal`, `event` | Boolean payload. |
| `number.float` | `value`, `signal` | Floating-point number; storage/transport precision is a representation. |
| `number.int` | `value`, `signal` | Signed integer; width is a representation. |
| `number.uint` | `value`, `signal` | Unsigned integer; width is a representation. |
| `vec2`, `vec3`, `vec4` | `value`, `signal` | Numeric vectors. |
| `color` | `value`, `signal` | Color value; channel count and encoding are representations. |
| `string` | `value`, `event` | UTF-8 string. |
| `enum` | `value`, `event` | One of a declared `values` set. |
| `matrix.f32` | `value`, `signal`, `stream` | Numeric matrix. |
| `audio.buffer` | `stream` | Audio block data. |
| `video.frame` | `stream` | Decoded video frame data. |
| `gpu.texture2d` | `resource` | GPU texture resource. |
| `asset.video` | `resource` | Content-addressed video asset. |
| `asset.image` | `resource` | Content-addressed image asset. |
| `asset.audio` | `resource` | Content-addressed audio asset. |
| `clock.beat` | `event`, `signal` | Musical clock payload. |
| `clock.timecode` | `event`, `signal` | Absolute timecode payload. |
| `message.midi` | `event`, `stream` | MIDI message payload. |
| `message.osc` | `event`, `stream` | OSC message payload. |

GPU is not a flow. A GPU texture is `flow: "resource"` with
`dataKind: "gpu.texture2d"`.

## Constraints

Type constraints are validation and compatibility data, not opaque metadata.

Allowed v0.1 constraints:

- `unit`
- `range`
- `shape`
- `channels`
- `sampleRate`
- `format`
- `colorSpace`
- `frameRate`
- `alphaPolicy`
- `values`

Display-only UI hints should be added later in a separate field. Do not put
validation semantics into an untyped `metadata` bag.

## Ports

Graph v0.1 uses explicit directioned ports:

```json
{
  "id": "radius",
  "direction": "input",
  "label": "Radius",
  "type": {
    "flow": "value",
    "dataKind": "number.float",
    "unit": "px",
    "range": { "min": 0, "max": 100 }
  },
  "required": false,
  "default": 10,
  "activation": "latched"
}
```

`activation` is valid only for input ports:

- `trigger`: a hot inlet that schedules node evaluation when updated.
- `latched`: a cold inlet whose latest value is read when the node evaluates.

Outputs do not declare activation.

## Bang Is Not Boolean

`bang` is an event payload, not a boolean value.

Examples:

- button press: `event<bang>`
- toggle state: `value<boolean>`
- edge detection: explicit `logic.rising_edge`
- bang to boolean state: explicit `logic.toggle`

Implicit conversion between `boolean` and `bang` is not allowed.

## Conversion Policy

Direct edges are valid only when:

- the source port is an output
- the target port is an input
- `flow` matches
- `dataKind` matches
- declared constraints are compatible

All domain crossing is represented by explicit converter nodes. Examples:

- `asset.video` to `video.frame`: `media.video_decode`
- `video.frame` to `gpu.texture2d`: `gpu.texture_upload`
- `boolean` to `bang`: `logic.rising_edge`
- `audio.buffer` to `number.float`: `audio.rms`
- `gpu.texture2d` format changes: `gpu.extract_channel` or another GPU node

The editor may offer to insert converter nodes, but the saved graph must contain
those nodes explicitly.

## Runtime Scheduling

The runtime resolves `node.kind` and `kindVersion` through a node registry or
manifest. That resolved node definition supplies execution model, clock
affinity, state behavior, permissions, and failure policy.

The graph document itself remains a typed wiring document. It should not store:

- runtime execution plan
- GPU pass ordering
- JS isolate lifecycle details
- native plugin ABI details
- transient resource handles
- implicit conversion records
- transport/session fields
