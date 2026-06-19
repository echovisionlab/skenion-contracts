# Control Message Model v0

Skenion control patching is message-driven. A control event is not just a typed
value flowing through an adapter. It is a message selector plus zero or more
typed atoms, dispatched by the receiving object.

For the broader delivery model that separates control messages from audio
signals, video streams, render frames, and GPU resources, see
[Skenion Docs](https://github.com/echovisionlab/skenion-docs/blob/main/docs/model/data-delivery-model.md).

## Message Shape

```json
{
  "selector": "set",
  "atoms": [{ "type": "float", "representation": "f32", "value": 0.75 }]
}
```

`bang` is represented as a selector with no atoms:

```json
{
  "selector": "bang",
  "atoms": []
}
```

Bang is not a stored value. Runtime state may store floats, ints, booleans,
strings, colors, or future semantic values, but it must not store `bang` as a
value.

## Object Dispatch

Objects own their message handlers:

- Bang accepts any incoming control message on its inlet and emits `bang`.
  This includes numeric values, booleans, strings, stored message-box output,
  selector-only messages, and `bang` itself. Bang is a message-to-bang object,
  not an `event.bang`-only adapter.
- Value objects handle selectors on their hot inlet. A typed value updates and
  emits, `bang` emits the stored value, and `set ...` updates silently.
- Value objects also expose a cold inlet for silent typed value storage.
- Toggle handles `bang`, `0`, `1`, `off`, `on`, `false`, `true`, and `set ...`
  through the same object-owned inlet handlers.
- Message emits its stored message on click or `bang`, and updates silently on
  `set ...`.
- Comment is a canvas annotation. It has no runtime control state and no ports.

`message.any` is a message domain data kind. It is not a string value.
Any scalar/control value can be lifted into this message domain when connected
to an object inlet such as `core.bang.in` or `core.message.in`.

`bang` and `set` are message selectors, not visual inlet names. A node should
not expose a dedicated `bang` inlet just to receive the `bang` selector.

## Conversion Boundary

Numeric and color representation conversion belongs to the conversion policy
layer. Domain crossing still requires explicit nodes, such as video-to-GPU or
audio-to-control analysis.
