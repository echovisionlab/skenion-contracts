# Control Message Model v0

Skenion control patching is message-driven. A control event is not just a typed
value flowing through an adapter. It is a message selector plus zero or more
typed atoms, dispatched by the receiving object.

## Message Shape

```json
{
  "selector": "set",
  "atoms": [{ "type": "f32", "value": 0.75 }]
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

- Button accepts any incoming message and emits `bang`.
- Toggle handles `bang`, `0`, `1`, `off`, `on`, `false`, `true`, and `set ...`.
- Message emits its stored message on click or bang, and updates silently on
  `set ...`.
- Comment is a canvas annotation. It has no runtime control state and no ports.

`message.any` is a message domain data kind. It is not a string value.

## Conversion Boundary

Numeric and color representation conversion belongs to the conversion policy
layer. Domain crossing still requires explicit nodes, such as video-to-GPU or
audio-to-control analysis.
