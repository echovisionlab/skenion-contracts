# Core Control Layer Nodes

The core control layer establishes the basic Max/MSP-style patching surface for
typed values and simple control annotations.

## Value Nodes

`core.float`, `core.int`, `core.uint`, `core.bool`, `core.color`, and
`core.string` share the same stored-value surface:

- `in`: hot `message.any` inlet; typed values update and emit, `bang` emits the
  stored value, and `set ...` updates silently
- `cold`: cold inlet; compatible typed values and `set ...` update silently
- `value`: output the current stored value

`core.bool` is also the canonical toggle object when `params.widget` is
`"toggle"` or `"checkbox"`. In that widget mode, `bang` sent to `in` flips the
stored value and emits the new value. Value objects may also use `sendName` and
`receiveName` graph params for named typed routing.

## Message And Comment

`core.message` is a Max/Pd-like message box. Click or `bang` on `in` emits its
saved payload. `set <message>` on `in` updates runtime message state silently.
Inspector text edits remain graph patches.

`core.comment` documents the patch as a text annotation. It receives
`event<message.any>` on `in`; `set <text>` updates runtime display text
silently. It has no output. Inspector text edits remain graph patches.

`core.panel` groups controls visually. It receives `event<message.any>` on
`in`; `set <hex>` updates runtime panel color silently. It has no output.
Inspector color edits remain graph patches.

## UI Widgets

Buttons, sliders, toggles, and compact number boxes are widget modes on
canonical core objects. `core.bang` is the button-like bang object, `core.float`
with `widget: "slider"` is the float slider, and `core.bool` with
`widget: "toggle"` is the boolean toggle. Standalone routing nodes are not part
of the builtin object model.

## Addressing

Control panels can address graph params and runtime state by node address, for
example `node:value_1/param:value` or `node:value_1/state:value`. Graph
execution must use explicit graph edges rather than hidden address reads.
