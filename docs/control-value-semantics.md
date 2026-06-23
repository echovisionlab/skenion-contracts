# Control Value Semantics

skenion value nodes are stateful control nodes. This document defines the pre-v1
typed value behavior used by built-in value nodes and runtime control events.

## Typed Value Nodes

The canonical v0.1 typed value nodes are:

- `core.float` for `value<number.float>`
- `core.int` for `value<number.int>`
- `core.uint` for `value<number.uint>`
- `core.bool` for `value<boolean>`
- `core.color` for `value<color>`
- `core.string` for `value<string>`

Each typed value node has the same control surface:

- `in` is the hot `message.any` inlet. A typed value message updates the stored
  value and emits it; `bang` emits the current stored value; `set ...` updates
  silently.
- `cold` is the cold inlet. A compatible typed value or `set ...` updates the
  stored value without emitting.
- `value` emits the current stored value.

`core.bool` is also the canonical toggle object when `params.widget` is
`"toggle"` or `"checkbox"`. In that widget mode, a `bang` interaction flips the
stored boolean and emits the new value. There is no separate toggle node.

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

`bang` and `set` are selectors carried by `ControlMessage`. They are not
separate visual inlet ports.

## Graph Edits Versus Runtime Control

Graph mutation operations edit the artwork. Runtime control events perform the artwork.

Changing `params.value` through a graph mutation changes the saved graph document.
Sending a runtime control event changes only the loaded runtime session control
state. Runtime control events must not be serialized back into the graph as
patches unless a later user action explicitly edits the graph.

## Range Metadata

`number.float` is a generic floating-point value type and must not globally imply
`0..1`. Range constraints belong to a specific shader uniform, UI widget,
clamp/map node, or later interface metadata. Runtime shader demos may clamp
values at the uniform extraction boundary, but the canonical `core.float`
builtin itself stays unconstrained.

## Comments And Messages

`core.comment` is a persisted graph annotation and runtime text object. It has
one hot `in` inlet for `event<message.any>`. `set <text>` updates the runtime
display text silently. Inspector text edits remain saved graph mutations.

`core.message` is the first simple message-box form. It stores message box text
in graph params and emits a `ControlMessage` selector plus typed atoms when
banged or clicked. `set ...` on `in` updates the runtime message text silently.
`pack`/`unpack` and richer message transforms are deferred until the typed
control graph is stable.

Bang is a message selector/event. It is not a stored runtime value.

Object-owned `sendName`/`receiveName` routing and widget controls are documented
in `docs/control-routing.md`.

## Pre-v1 Compatibility

This is a pre-v1 contract. Breaking built-in node shape changes are allowed
while skenion is still converging on the runtime/editor control model.

The previous value-object surface with separate visual `bang` and `set` input
ports is removed. Canonical value objects expose only `in`, `cold`, and
`value`; `bang` and `set` remain `ControlMessage.selector` values handled by
the receiving object.
