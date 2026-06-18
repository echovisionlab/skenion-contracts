# Core Control Layer Nodes

The core control layer establishes the basic Max/MSP-style patching surface for
typed values and simple control annotations.

## Value Nodes

`core.float`, `core.int`, `core.bool`, `core.color`, and
`core.string` share the same stored-value surface:

- `in`: update the stored value and emit it
- `set`: update the stored value without emitting
- `bang`: emit the current stored value without changing it
- `value`: output the current stored value

`core.toggle` uses the same boolean type as `core.bool`, but `bang` flips
the stored value and emits the new value. Value objects may also use
`sendName` and `receiveName` graph params for named typed routing.

## Message And Comment

`core.message` is a Max/Pd-like message box. Click, `in`, or `bang` emits its
saved payload. `set <message>` updates runtime message state silently. Inspector
text edits remain graph patches.

`core.comment` documents the patch and has no runtime behavior. It is rendered
as a text annotation, not as a generic node card. It may still expose a `set`
inlet and `receiveName` for patcher-style live text updates; it does not emit.

## UI Objects

`ui.button`, `ui.slider-float`, and `ui.toggle` are object controls, not generic
cards. They may use `sendName` and `receiveName` just like core value objects.
Standalone routing nodes are not part of the builtin object model.

## Addressing

Control panels can address graph params and runtime state by node address, for
example `node:value_1/param:value` or `node:value_1/state:value`. Graph
execution must use explicit graph edges rather than hidden address reads.
