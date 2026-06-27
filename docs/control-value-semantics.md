# Control Value Semantics

skenion control messages carry keys and typed atoms. This document defines
the pre-v1 control payload behavior used by runtime control events and
Runtime/package-provided objects. Contracts owns the payload and key
shapes, not the concrete object inventory.

## Control Objects And Payloads

Runtime-owned behavior-named control object examples include:

- `core.bang` for trigger behavior. It emits `value.core.bang`; `value.core.bang` is not
  an object identity.
- `core.message` for saved message-box behavior. It emits a `MessageValue`
  key plus typed atoms.

Runtime-owned numeric/color stored-payload object examples include:

- `core.float` for `value.core.float64` payloads
- `core.int` for `value.core.int64` payloads
- `core.uint` for `value.core.uint64` payloads
- `core.color` for `value.core.color` payloads

Bool and string are payload/atom semantics, not canonical object identities.
`value.core.bool`, `value.core.string`, and the `bool`, `string`, and `symbol`
keys may be accepted by behavior-named objects such as `core.message`,
`core.bang`, or future widget objects. A toggle, checkbox, label, or text UI
must use a behavior-named object contract rather than `core.bool` or
`core.string`.

The numeric/color stored-payload objects have the same control surface:

- `in` is the hot `value.core.message` inlet. A compatible typed control
  payload updates the stored payload and emits it; `bang` emits the current
  stored payload; `set ...` updates silently.
- `cold` is the cold inlet. A compatible typed control payload updates the
  stored payload without emitting.
- `value` emits the current stored payload. The port id is payload/state naming;
  it does not make the object a value object.

This is the Max/MSP-style stored-payload message model:

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

`bang` and `set` are keys carried by `MessageValue`. They are not
separate visual inlet ports.

## Graph Edits Versus Runtime Control

Graph mutation operations edit the artwork. Runtime control events perform the artwork.

Changing `params.value` through a graph mutation changes the saved graph document.
Sending a runtime control event changes only the loaded runtime session control
state. Runtime control events must not be serialized back into the graph as
patches unless a later user action explicitly edits the graph.

## Range Metadata

`value.core.float64` is a generic floating-point control payload and must not globally imply
`0..1`. Range constraints belong to a specific shader uniform, UI widget,
clamp/map node, or later interface metadata. Runtime shader demos may clamp
values at the uniform extraction boundary, but a generic floating-point control
object definition should stay unconstrained unless that Runtime/package
definition says otherwise.

## Comments And Messages

`core.comment` is a persisted graph annotation and runtime text object. It has
one hot `in` inlet for `value.core.message`. `set <text>` updates the runtime
display text silently. Inspector text edits remain saved graph mutations.

`core.message` is the first simple message-box form. It stores message box text
in graph params and emits a `MessageValue` key plus typed atoms when
banged or clicked. `set ...` on `in` updates the runtime message text silently.
`pack`/`unpack`, toggle widgets, text widgets, and richer message transforms are
deferred until the behavior-named control graph is stable.

Bang is a message key and the pure trigger edge type `value.core.bang`. It is
not a stored runtime value and is not represented as `control.bang` or boolean
state.

Object-owned `sendName`/`receiveName` routing and widget controls are documented
in `docs/control-routing.md`.

## Pre-v1 Compatibility

This is a pre-v1 contract. Breaking node-definition shape changes are allowed
while skenion is still converging on the runtime/editor control model.

The previous generic value-object surface with separate visual `bang` and `set`
input ports is removed. Numeric/color stored-payload objects expose only `in`,
`cold`, and `value`; `bang` and `set` remain `MessageValue.key` values
handled by the receiving object. Bool/string payload-named object identities are
not valid Contracts examples for object identity.
