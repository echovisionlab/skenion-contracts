# Message Value Model v0

skenion control patching is message-driven. A control event is not just a typed
value flowing through an adapter. It is a message key plus zero or more
typed atoms, dispatched by the receiving object.

For the broader delivery model that separates control messages from audio
signals, video streams, render frames, and GPU resources, see
[skenion Docs](https://github.com/skenion/skenion-docs/blob/main/docs/model/data-delivery-model.md).

## Message Shape

```json
{
  "key": "set",
  "atoms": [{ "type": "float", "representation": "f32", "value": 0.75 }]
}
```

`bang` is represented as a key with no atoms:

```json
{
  "key": "bang",
  "atoms": []
}
```

Bang is not a stored value. Runtime state may store floats, ints, bools,
strings, colors, or future semantic values, but it must not store `bang` as a
value.

## Object Dispatch

Objects own their message handlers:

- Bang accepts incoming control messages on its inlet. Numeric values,
  booleans, strings, stored message-box output, key-only messages, and
  `bang` itself emit `bang`; `set ...` is accepted silently and does not emit.
  Bang is a message-to-bang object, not an `value.core.bang`-only adapter.
- Typed control objects handle keys on their hot inlet. A typed atom
  updates and emits, `bang` emits the stored payload, and `set ...` updates
  silently.
- Typed control objects also expose a cold inlet for silent typed state
  storage.
- Toggle handles `bang`, `0`, `1`, `off`, `on`, `false`, `true`, and `set ...`
  through the same object-owned inlet handlers.
- Message emits its stored message on click or `bang`, and updates silently on
  `set ...`.
- Comment is a canvas annotation. It has no output or stored control payload,
  but it exposes an `in: value.core.message` inlet so `set ...` can update
  runtime display text silently.

`value.core.message` is the control-domain message-capable port type. It is
not a string value. Any scalar control payload can be lifted into this message
domain when connected to an object inlet such as `object.core.bang.in` or
`object.core.message.in`.

`bang` and `set` are message keys, not visual inlet names. A node should
not expose a dedicated `bang` inlet just to receive the `bang` key.

## Conversion Boundary

Numeric and color representation conversion belongs to the conversion policy
layer. Domain crossing still requires explicit nodes, such as video-to-GPU or
audio-to-control analysis.
