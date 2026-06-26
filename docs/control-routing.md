# Control Routing

skenion v0.1 uses object-owned typed routing for non-local control values.
Behavior-named control, message, panel, and annotation objects can publish to or
receive from named channels through `sendName` and `receiveName` params.
Concrete routing-capable object availability belongs to Runtime/package
registries. Standalone routing objects are not part of the Contracts object
model.

## Object-Owned Channels

The v0.1 channel key is:

```text
<control-port-type>:<name>
```

Examples:

```text
control.number.float:speed
control.number.int:iterations
control.bool:enabled
control.color:tint
control.string:status
control.message.any:reset
```

Generic graph dataflow is intentionally not part of v0.1, but control objects
may use `control.message.any` on object inlets for Max/Pd-style coercion. A typed
channel is still keyed by its canonical control port type.

## Routing Params

Routing-capable objects may declare these graph params:

```json
{
  "sendName": "",
  "receiveName": ""
}
```

When an object emits a value, Runtime also writes the emitted value to
`<control-port-type>:<sendName>` if `sendName` is non-empty. When Runtime receives a
compatible channel update for an object's `receiveName`, it may update that
object's runtime state or dispatch the incoming message to an object handler.
A trigger-style Runtime object can treat compatible non-set channel messages as
`event.bang`; `set ...` may be accepted silently without emitting.

The graph must still use explicit edges for execution dependencies. Hidden
shader or render reads from channel names are not part of v0.1.

Primary routing-capable Runtime/package objects usually include numeric/color
controls, message boxes, annotations, panels, and trigger controls.

## Panel Controls

Widget params choose the visible object style without changing the canonical
node kind. These interactions are performance-time state changes, not graph
edits:

- trigger controls accept incoming control messages; non-set messages emit
  `event.bang`, while `set ...` is silent
- annotation controls can accept `set <text>` on `in` and update runtime display
  text without output
- panel controls can accept `set <hex>` on `in` and update runtime panel color
  without output
- numeric slider controls send typed payloads to the hot `in` inlet and emit
  `control.number.float`
- Bool and string payloads are selectors/atoms handled by behavior-named
  objects. Toggle/text UI objects are deferred until they have behavior-named
  contracts.

Changing graph parameters such as `label`, `min`, `max`, `step`, `sendName`, or
`receiveName` remains a saved graph mutation. Moving a runtime slider or
clicking a runtime widget must not create a graph mutation.

When local preview is running, Runtime may write the updated control state to a
preview control-state snapshot so the preview can consume new typed values on a
later frame without restarting. Graph structure changes still make the preview
stale; see [Live Preview Control Updates](./live-preview-control-updates.md).

## Hidden Reads

Studio inspectors and remote-control panels may read by node address for UI
purposes. Runtime graph execution may not silently read another node's params or
state by address. Non-local graph dataflow must be represented by explicit graph
edges or by a future explicit reference node.
