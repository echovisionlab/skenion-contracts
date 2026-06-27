# object.core.float

`object.core.float` stores a `value.core.float64` control payload.

Inputs:

- `in`: hot `value.core.message` inlet. A `value.core.float64` payload updates
  and emits; `bang` emits the current stored payload; `set ...` updates silently.
- `cold`: cold inlet. A compatible payload updates silently.

Output:

- `value`: the current `value.core.float64` payload.

The graph `params.value` is the saved default. Runtime control events may change the session value without changing the persisted graph.
