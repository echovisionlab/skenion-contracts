# core.toggle

`core.toggle` stores a boolean state for performer-facing on/off control.

Inputs:

- `in`: update the stored boolean and emit it.
- `set`: update the stored boolean without emitting.
- `bang`: flip the stored boolean and emit the new value.

Output:

- `value`: the current boolean value.

Use `core.value-bool` when a bang should only re-emit the current boolean. Use `core.toggle` when a bang should flip state.
