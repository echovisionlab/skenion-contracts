# Control Value Semantics

Skenion value nodes are stateful control nodes. This document defines the pre-v1
typed value behavior used by built-in value nodes and runtime control events.

## Typed Value Nodes

The canonical v0.1 typed value nodes are:

- `core.value-f32` for `value<number.f32>`
- `core.value-i32` for `value<number.i32>`
- `core.value-bool` for `value<boolean>`
- `core.color-rgba` for `value<color.rgba>`
- `core.string` for `value<string>`

`core.toggle` also uses `value<boolean>`, but its `bang` input flips the stored
boolean before emitting. `core.value-bool` keeps the generic value-box behavior:
`bang` only emits the current value.

Each typed value node has the same control surface:

- `in` updates the stored value and emits the new value.
- `set` updates the stored value without emitting.
- `bang` emits the current stored value without changing it.
- `value` emits the current stored value.

This is the Max/MSP-style value-box model:

```text
set 32
  -> store 32
  -> emit nothing

bang
  -> emit 32

in 12
  -> store 12
  -> emit 12
```

## Graph Edits Versus Runtime Control

Graph patches edit the artwork. Runtime control events perform the artwork.

Changing `params.value` through a graph patch changes the saved graph document.
Sending a runtime control event changes only the loaded runtime session control
state. Runtime control events must not be serialized back into the graph as
patches unless a later user action explicitly edits the graph.

## Range Metadata

`number.f32` is a generic floating-point value type and must not globally imply
`0..1`. Range constraints belong to a specific shader uniform, UI widget,
clamp/map node, or later interface metadata. Runtime shader demos may clamp
values at the uniform extraction boundary, but the canonical `core.value-f32`
builtin itself stays unconstrained.

## Comments And Messages

`core.comment` is a persisted graph annotation. It has no ports and does not
participate in runtime execution.

`core.message` is the first simple message-box form. In v0.1 it stores a string
payload and emits that payload when banged. Typed multi-message payloads,
`pack`/`unpack`, `send`/`receive`, and panel/dashboard nodes are deferred until
the typed control graph is stable.

## Pre-v1 Compatibility

This is a pre-v1 contract. Breaking built-in node shape changes are allowed
while Skenion is still converging on the runtime/editor control model.
