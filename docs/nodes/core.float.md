# core.float

`core.float` stores a `number.float` control value.

Inputs:

- `in`: hot `message.any` inlet. A `number.float` message updates and emits;
  `bang` emits the current stored value; `set ...` updates silently.
- `cold`: cold inlet. A compatible value or `set ...` updates silently.

Output:

- `value`: the current `number.float` value.

The graph `params.value` is the saved default. Runtime control events may change the session value without changing the persisted graph.
