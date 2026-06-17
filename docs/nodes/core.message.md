# core.message

`core.message` emits a saved string payload when it receives a bang.

Input:

- `bang`: emits the saved message text.

Output:

- `value`: the emitted string value.

The v0.1 message node is intentionally string-only. Typed multi-message, pack/unpack, and send/receive nodes are deferred until the control graph model is stable.
