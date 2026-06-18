# core.float

`core.float` stores a `number.float` control value.

Inputs:

- `in`: update the stored value and emit it.
- `set`: update the stored value without emitting.
- `bang`: emit the current stored value without changing it.

Output:

- `value`: the current `number.float` value.

The graph `params.value` is the saved default. Runtime control events may change the session value without changing the persisted graph.
