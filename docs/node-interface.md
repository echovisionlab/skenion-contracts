# Node Interface v0.1

skenion nodes are typed, time-aware runtime actors. The persisted graph document
stores patch wiring. Runtime scheduling details live in node definition
manifests and runtime registries.

For human-readable review of how data moves across control, audio, video,
render, and GPU domains, see the
[skenion Docs data delivery model](https://github.com/skenion/skenion-docs/blob/main/docs/model/data-delivery-model.md).

## Documents

There are two related contracts:

- `skenion.graph` describes object instances, ports, and edges in a saved patch.
- `skenion.node.definition` describes the static executable interface that a
  runtime, plugin, or script module can provide.

Graph documents preserve the user-facing `objectSpec` separately from optional
resolver output. A resolved graph node may carry an `implementation` reference:
provider identity such as core, project patch, or package plus `objectId` and
optional version/interface data. User-authored names do not need to be globally
namespaced; provider-scoped implementation identity is the stable contract
surface after resolution. Graph documents do not persist a scheduler plan, GPU
pass order, script lifecycle, or permissions.

## Port Type Model

v0.1 uses one canonical type model:

```json
{
  "type": "value.core.float64",
  "rate": "control",
  "description": "Radius in px"
}
```

Do not add a separate `domain` field to graph schema. In the design notes,
domain names such as audio, video, gpu, clock, and message are explanatory
categories. In the graph/node port contract, those concepts are expressed
through canonical port type strings such as `value.core.float64`,
`value.core.bang`, audio-rate `value.core.float32`, and `value.core.tensor`.

## Flow

`flow` describes temporal delivery semantics.

| Flow | Meaning |
| --- | --- |
| `control` | Retained or message-dispatched control payload. |
| `event` | Discrete occurrence; may have no durable value. |
| `signal` | Time-varying control signal sampled by a clock. |
| `stream` | Ordered media/block data with backpressure or drop policy. |
| `resource` | Asset or runtime resource handle. |

Current v0 graphs use `control` and `signal`. Older `value`, `constant`, and `sampled`
flow names are not valid `0.1` contract values and must be rejected with
issues.

## Core Port Type Strings

Current graph and node manifests use canonical port type strings for payload
semantics.

Initial core port types:

| Port type | Typical flow | Meaning |
| --- | --- | --- |
| `value.core.bang` | `event` | Momentary trigger event. |
| `value.core.bool` | `control`, `signal`, `event` | Boolean payload. |
| `value.core.float32` | `signal` | Floating-point audio/control signal when the endpoint declares a signal or audio rate. |
| `value.core.float64` | `control`, `signal` | Floating-point number; storage/transport precision is a representation. |
| `value.core.int64` | `control`, `signal` | Signed integer; width is a representation. |
| `value.core.uint64` | `control`, `signal` | Unsigned integer; width is a representation. |
| `value.core.color` | `control`, `signal` | Color payload; channel count and encoding are representations. |
| `value.core.string` | `control`, `event` | UTF-8 string. |
| `value.core.vector` | `control`, `signal`, `stream` | One-dimensional dense numeric array with explicit element format and length metadata. |
| `value.core.matrix` | `control`, `signal`, `stream` | Two-dimensional dense numeric array. Audio blocks use this with `[frames, channels]`, sample rate, channel, shape, and format metadata. |
| `value.core.tensor` | `stream` | N-dimensional dense numeric array. Raster images and video frames use this with `[height, width, channels]`, format, color-space, and alpha metadata. |
| `value.core.tensor` | `resource` | GPU texture resource. |
| `value.core.string` | `resource` | Content-addressed video asset. |
| `value.core.string` | `resource` | Content-addressed image asset. |
| `value.core.string` | `resource` | Content-addressed audio asset. |
| `clock.beat` | `event`, `signal` | Musical clock payload. |
| `clock.timecode` | `event`, `signal` | Absolute timecode payload. |
| `message.midi` | `event`, `stream` | MIDI message payload. |
| `message.osc` | `event`, `stream` | OSC message payload. |

GPU is not a flow. A GPU texture is `flow: "resource"` with
`dataKind: "value.core.tensor"`.

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
  "type": "value.core.float64",
  "description": "Radius in px",
  "required": false,
  "defaultValue": 10,
  "triggerMode": "passive"
}
```

`triggerMode` is valid only for input ports:

- `trigger`: a hot inlet that schedules node evaluation when updated.
- `passive`: a cold inlet whose latest payload is read when the node evaluates.

Outputs do not declare activation.

## Bang Is Not Boolean

`bang` is the `MessageValue` key and the pure trigger edge type
`value.core.bang`, not a boolean or stored control value.

Examples:

- button press: `value.core.bang`
- toggle state: `value.core.bool`
- edge detection: explicit `logic.rising_edge`
- bang to boolean state: explicit `logic.toggle`

Implicit conversion between `value.core.bool` and `value.core.bang` is not allowed.

## Conversion Policy

Direct edges are valid only when:

- the source port is an output
- the target port is an input
- canonical port types match or the target explicitly lists the source in
  `accepts`
- declared constraints are compatible

All domain crossing is represented by explicit converter nodes. Examples:

- `value.core.string` to `value.core.tensor`: `media.video_decode`
- `value.core.tensor` to `value.core.tensor`: `gpu.texture_upload`
- `value.core.bool` to `value.core.bang`: `logic.rising_edge`
- `value.core.matrix` to `value.core.float64`: `audio.rms`
- `value.core.tensor` format changes: `gpu.extract_channel` or another GPU node

The editor may offer to insert converter nodes, but the saved graph must contain
those nodes explicitly.

## Runtime Scheduling

The runtime resolves a node's `objectSpec` and optional `bindingRef` through the
active core, project, and package registries. The selected implementation's node
definition supplies execution model, clock affinity, state behavior,
permissions, and failure policy.

The graph document itself remains a typed wiring document. It should not store:

- runtime execution plan
- GPU pass ordering
- JS isolate lifecycle details
- native plugin ABI details
- transient resource handles
- implicit conversion records
- transport/session fields
