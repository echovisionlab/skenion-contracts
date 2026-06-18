# core.message

`core.message` is a Max/Pd-like message box. It stores message text and emits
the parsed value when clicked, banged, or triggered through `in`.

Input:

- `in`: emits the current message payload.
- `set`: updates the runtime message payload without output.
- `bang`: emits the saved message text.

Output:

- `value`: the emitted message value. v0.1 stores message text as the graph
  param, while Runtime may parse simple bang, string, number, boolean, and set
  forms.

Params:

- `value`: saved message text.
- `sendName`: optional string channel updated when the message emits.
- `receiveName`: optional string channel used for routed message updates.

Typed multi-message, pack/unpack, and richer message lists remain future work.
