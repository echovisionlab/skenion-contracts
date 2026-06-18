# core.toggle

`core.toggle` stores a boolean state for performer-facing on/off control.

Inputs:

- `in`: update the stored boolean and emit it.
- `set`: update the stored boolean without emitting.
- `bang`: flip the stored boolean and emit the new value.

`in` accepts Max/Pd-style boolean forms: `bang`, `1`, `0`, `on`, `off`, `true`,
and `false`. `set 1`, `set 0`, `set on`, and `set off` update state silently.

Output:

- `value`: the current boolean value.

Use `core.bool` when a bang should only re-emit the current boolean. Use `core.toggle` when a bang should flip state.

Params:

- `value`: saved initial boolean value.
- `sendName`: optional boolean channel updated whenever the toggle emits.
- `receiveName`: optional boolean channel used for routed toggle updates.
