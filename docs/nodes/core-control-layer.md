# Core Control Layer Nodes

The core control layer establishes the basic Max/MSP-style patching surface for
typed values and simple control annotations.

## Value Nodes

`core.value-f32`, `core.value-i32`, `core.value-bool`, `core.color-rgba`, and
`core.string` share the same stored-value surface:

- `in`: update the stored value and emit it
- `set`: update the stored value without emitting
- `bang`: emit the current stored value without changing it
- `value`: output the current stored value

`core.toggle` uses the same boolean type as `core.value-bool`, but `bang` flips
the stored value and emits the new value.

## Message And Comment

`core.message` is a simple string message box. It emits its saved string payload
when banged. Typed multi-message forms are deferred.

`core.comment` documents the patch and has no runtime behavior.

## Addressing

Control panels can address graph params and runtime state by node address, for
example `node:value_1/param:value` or `node:value_1/state:value`. Graph
execution must use explicit graph edges rather than hidden address reads.
