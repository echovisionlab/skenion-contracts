# core.value-f32

`core.value-f32` stores a `number.f32` control value.

Inputs:

- `in`: update the stored value and emit it.
- `set`: update the stored value without emitting.
- `bang`: emit the current stored value without changing it.

Output:

- `value`: the current `number.f32` value.

The graph `params.value` is the saved default. Runtime control events may change the session value without changing the persisted graph.
