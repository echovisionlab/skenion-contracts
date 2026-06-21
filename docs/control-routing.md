# Control Routing

Skenion v0.1 uses object-owned typed routing for non-local control values.
Value, message, panel, and annotation objects can publish to or receive from
named channels through `sendName` and `receiveName` params. Standalone routing
objects are not part of the builtin object model.

## Object-Owned Channels

The v0.1 channel key is:

```text
<dataKind>:<name>
```

Examples:

```text
number.float:speed
number.int:iterations
boolean:enabled
color:tint
string:status
message.any:reset
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
object's runtime state or dispatch the incoming message to an object handler.
For `core.bang`, any compatible channel message triggers `out` as `event.bang`.

The graph must still use explicit edges for execution dependencies. Hidden
shader or render reads from channel names are not part of v0.1.

Primary routing-capable objects include:

- `core.float`, `core.int`, `core.bool`
- `core.color`, `core.string`, `core.message`
- `core.comment`, `core.panel`
- `core.bang`

## Panel Controls

Widget params choose the visible object style without changing the canonical
node kind. These interactions are performance-time state changes, not graph
edits:

- `core.bang` accepts any incoming control message and emits `event.bang`
- `core.comment` accepts `set <text>` on `in` and updates runtime display text
  without output
- `core.panel` accepts `set <hex>` on `in` and updates runtime panel color
  without output
- `core.float` with `widget: "slider"` sends typed values to the hot `in` inlet
  and emits `value<number.float>`
- `core.bool` with `widget: "toggle"` handles `bang`, `0/1`, `off/on`,
  `false/true`, and `set` forms through its hot `in` inlet

Changing graph parameters such as `label`, `min`, `max`, `step`, `sendName`, or
`receiveName` remains a saved graph mutation. Moving a runtime slider or
clicking a runtime toggle must not create a graph mutation.

When local preview is running, Runtime may write the updated control state to a
preview control-state snapshot so the preview can consume new typed values on a
later frame without restarting. Graph structure changes still make the preview
stale; see [Live Preview Control Updates](./live-preview-control-updates.md).

## Hidden Reads

Studio inspectors and remote-control panels may read by node address for UI
purposes. Runtime graph execution may not silently read another node's params or
state by address. Non-local graph dataflow must be represented by explicit graph
edges or by a future explicit reference node.
