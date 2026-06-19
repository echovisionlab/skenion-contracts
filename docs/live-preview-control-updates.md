# Live Preview Control Updates

Live preview control updates describe how runtime control events reach a running
local preview without mutating the persisted graph.

## Boundary

Graph patches edit the artwork definition. Runtime control events perform the
loaded artwork. Slider, toggle, button, and typed value interactions must not
produce graph patch operations.

Runtime control events may update:

- stored runtime control values
- named object routing channel state
- a running preview control-state snapshot
- telemetry control revision fields

Runtime control events must not update:

- graph nodes or edges
- shader source
- generated shader interfaces
- render output selection

Those structure changes still make the preview stale and require a preview
restart.

## Preview Control Snapshot

The Runtime server writes a runtime-internal snapshot for the local preview child
process:

```json
{
  "schema": "skenion.preview.control-state",
  "schemaVersion": "0.1.0",
  "sessionRevision": 12,
  "controlRevision": 5,
  "values": {
    "slider_1": { "type": "float", "representation": "f32", "value": 0.75 }
  },
  "channels": {
    "number.float:speed": {
      "selector": "float",
      "atoms": [{ "type": "float", "representation": "f32", "value": 0.75 }]
    },
    "boolean:enabled": {
      "selector": "bool",
      "atoms": [{ "type": "bool", "value": true }]
    }
  },
  "writtenAt": "unix-ms:1710000000000"
}
```

The snapshot is written atomically by replacing the previous snapshot file. A
preview process may poll the file and apply newer `controlRevision` values to
the next frame.

`channels` stores complete emitted `ControlMessage` payloads, not raw value
atoms. This keeps selector-only messages such as `bang` and typed message-box
payloads round-trippable through the preview boundary. Silent `set ...` updates
change object state without publishing a channel message.

## Revisions

`sessionRevision` tracks loaded-session graph and plan mutations.
`controlRevision` tracks runtime control-state mutations.

A successful control event increments `controlRevision` only when runtime values
or typed channels change. Invalid events and read-only control requests do not
advance it.

## Telemetry

Runtime preview status and telemetry expose:

- `controlRevision`
- `previewControlRevision`
- `controlLive`
- `lastControlUpdateAt`

`controlLive: true` means the preview has received the latest known runtime
control revision. It is separate from graph staleness: a preview can be graph
stale and still have current control state, or graph-fresh but waiting for a
control snapshot update.
