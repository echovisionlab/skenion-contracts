# Control Routing

Skenion v0.1 uses object-owned typed routing for non-local control values.
Value, message, and UI control objects can publish to or receive from named
channels through `sendName` and `receiveName` params. Standalone routing
objects are not part of the builtin object model.

## Object-Owned Channels

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
string:status
event.bang:reset
```

Generic graph dataflow is intentionally not part of v0.1, but control objects
may use `message.any` on object inlets for Max/Pd-style coercion. A typed
channel is still keyed by canonical data kind.

## Routing Params

Routing-capable objects may declare these graph params:

```json
{
  "sendName": "",
  "receiveName": ""
}
```

When an object emits a value, Runtime also writes the emitted value to
`<dataKind>:<sendName>` if `sendName` is non-empty. When Runtime receives a
compatible channel update for an object's `receiveName`, it may update that
object's runtime state.

The graph must still use explicit edges for execution dependencies. Hidden
shader or render reads from channel names are not part of v0.1.

Primary routing-capable objects include:

- `core.value-f32`, `core.value-i32`, `core.value-bool`
- `core.color-rgba`, `core.string`, `core.message`
- `core.comment`, `core.panel`
- `ui.button`, `ui.slider-f32`, `ui.toggle`

## Panel Controls

Panel control nodes emit runtime control events. These interactions are
performance-time state changes, not graph edits:

- `ui.button` accepts any incoming message and emits `event.bang`
- `ui.slider-f32` accepts `in`, `set`, and `bang` and emits `value<number.f32>`
- `ui.toggle` accepts `bang`, `0/1`, `off/on`, `false/true`, and `set` forms

Changing graph parameters such as `label`, `min`, `max`, `step`, `sendName`, or
`receiveName` remains a graph patch. Moving a runtime slider or clicking a
runtime toggle must not create a graph patch.

When local preview is running, Runtime may write the updated control state to a
preview control-state snapshot so the preview can consume new typed values on a
later frame without restarting. Graph structure changes still make the preview
stale; see [Live Preview Control Updates](./live-preview-control-updates.md).

## Hidden Reads

Studio inspectors and remote-control panels may read by node address for UI
purposes. Runtime graph execution may not silently read another node's params or
state by address. Non-local graph dataflow must be represented by explicit graph
edges or by a future explicit reference node.
