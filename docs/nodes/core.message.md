# core.message

`core.message` is a Max/Pd-like message box. It stores message text and emits a
control message: selector plus typed atoms.

Input:

- `in`: hot message inlet. `bang` emits the saved payload, `set ...` updates the
  runtime payload without output, and other messages evaluate the stored message
  payload.

Output:

- `out`: the emitted message payload. v0.1 stores message box text as the
  graph param and Runtime parses it into a selector plus atoms.

Params:

- `value`: saved message text.
- `sendName`: optional message channel updated when the message emits.
- `receiveName`: optional message channel used for routed message updates.

Pack/unpack, multiple message outlets, and richer list transforms remain future
work.
