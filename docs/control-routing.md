# Control Routing

Skenion v0.1 uses explicit typed routing nodes for non-local control values.
This keeps graph execution inspectable while still allowing Max-style panel
controls and named channels.

## Typed Channels

The v0.1 channel key is:

```text
<dataKind>:<name>
```

Examples:

```text
number.f32:speed
number.i32:iterations
boolean:enabled
color.rgba:tint
```

Generic `any` channels are intentionally not part of v0.1. A send node and a
receive node must agree on data kind through their builtin type:

- `core.send-f32` / `core.receive-f32`
- `core.send-i32` / `core.receive-i32`
- `core.send-bool` / `core.receive-bool`
- `core.send-rgba` / `core.receive-rgba`

## Send Nodes

`core.send-*` nodes have a `name` parameter and one trigger input named `in`.
When Runtime receives a typed value at `in`, it writes that value to the typed
channel and records it in session control state.

Graph execution must still show the value source with an edge into the send
node. A send node is not a hidden graph read or an automatic adapter.

## Receive Nodes

`core.receive-*` nodes have `name` and `default` parameters, a `bang` input, and
a typed `value` output. Runtime resolves the current channel value by
`dataKind:name`; if the channel has never been written, it resolves `default`.

The `bang` input emits the current resolved value. The `value` output can also
be used by render and shader uniform extraction as an explicit graph dependency.

## Panel Controls

Panel control nodes emit runtime control events. These interactions are
performance-time state changes, not graph edits:

- `ui.button` emits `event.bang`
- `ui.slider-f32` emits `value<number.f32>`
- `ui.toggle` emits `value<boolean>`

Changing graph parameters such as `label`, `min`, `max`, `step`, `name`, or
`default` remains a graph patch. Moving a runtime slider or clicking a runtime
toggle must not create a graph patch.

When local preview is running, Runtime may write the updated control state to a
preview control-state snapshot so the preview can consume new typed values on a
later frame without restarting. Graph structure changes still make the preview
stale; see [Live Preview Control Updates](./live-preview-control-updates.md).

## Hidden Reads

Studio inspectors and remote-control panels may read by node address for UI
purposes. Runtime graph execution may not silently read another node's params or
state by address. Non-local graph dataflow must be represented by explicit
send/receive nodes, or by a future explicit reference node.
