# Core Control Layer Nodes

The core control layer establishes the basic Max/MSP-style patching surface for
typed payloads and simple control annotations. The object names below are
Runtime-owned examples, not a Contracts-owned inventory.

## Control Objects And Payloads

Runtime-owned behavior-named control objects may include trigger and message
box objects. Runtime-owned numeric/color stored-payload objects may share this
surface:

- `in`: hot `control.message.any` inlet; typed controls update and emit,
  `bang` emits the stored payload, and `set ...` updates silently
- `cold`: cold inlet; compatible typed control payloads update silently
- `value`: output the current stored payload. The port id is payload/state
  naming, not a value-object contract.

Bool and string are payload/atom semantics. `control.bool`, `control.string`,
and the `bool`, `string`, and `symbol` selectors can be carried by
`ControlMessage` and handled by behavior-named objects. A toggle, checkbox,
label, or text UI must be introduced as a behavior-named object rather than a
payload-named object identity.

## Message And Comment

`core.message` is a Max/Pd-like message box. Click or `bang` on `in` emits its
saved payload. `set <message>` on `in` updates runtime message state silently.
Inspector text edits remain saved graph mutations.

`core.comment` documents the patch as a text annotation. It receives
`control.message.any` on `in`; `set <text>` updates runtime display text
silently. It has no output. Inspector text edits remain saved graph mutations.

`core.panel` groups controls visually. It receives `control.message.any` on
`in`; `set <hex>` updates runtime panel color silently. It has no output.
Inspector color edits remain saved graph mutations.

## UI Widgets

Buttons, sliders, toggles, and compact number boxes are widget modes only when
the object identity names behavior. Toggle/text widgets are deferred until they
have behavior-named object contracts. Standalone routing nodes are not part of
the Contracts object model.

## Addressing

Control panels can address graph params and runtime state by node address, for
example `node:float_1/param:value` or `node:float_1/state:value`. Graph
execution must use explicit graph edges rather than hidden address reads.
