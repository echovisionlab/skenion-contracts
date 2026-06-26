# Object/Data Payload Semantics Inventory

Issue: skenion/skenion-contracts#174.

Contracts v0.1 draws this boundary:

- `node.kind` identifies executable behavior with ports, state, and diagnostics.
- Port `type`, `accepts`, `messageSelectors`, control atoms, and resources identify payload semantics.
- Runtime/package registries own object availability, dispatch, state mutation,
  ordering, operation acceptance, and execution. Contracts only define the
  schemas, DTOs, and static shape/invariant validators for the metadata
  Runtime/package surfaces exchange.

## Inventory And Disposition

| Surface | Files/Symbols | Disposition |
| --- | --- | --- |
| Control message selector and atom payloads | `json-schema/control/v0.1/control-message.schema.json`, `ControlMessageV01`, `ControlAtomV01`, `packages/rust/src/v0_1/control_message.rs` | Keep as payload shape. Selectors and atoms are messages, not node identities. |
| Selector acceptance metadata | `messageSelectors` in `json-schema/graph/v0.1/graph.schema.json`, `json-schema/node/v0.1/node-definition.schema.json`, `json-schema/object-text/v0.1/parse-result.schema.json`, `MessageSelectorPolicyV01` | Keep and tighten as static metadata. Selector lists must be non-empty selector strings; Contracts validators can require selector policy shape on selector-aware input ports, but Runtime decides dispatch acceptance for a loaded registry/session. |
| Port payload acceptance metadata | `PortSpecV01.accepts`, object-text `instancePorts[].accepts`, graph edge validation | Keep as payload compatibility metadata. It must not be copied into `node.kind`. |
| Legacy/generic value port aliases | `message.any`, `number.float`, `number.int`, `number.uint`, `boolean`, `color`, `string`, `value.*`, `value<...>` in TS/Rust shape validators and invalid fixtures | Reject. Current graph/node contracts use canonical port types such as `control.number.float` and `control.message.any`. |
| Payload identity as executable node kind | `control.*`, `event.bang`, `asset.video`, `asset.image`, `asset.audio`, `gpu.texture2d`, `value.*`, `data.*`, `payload.*` when used as `graph.nodes[].kind` | Reject in graph and graph-fragment semantic validation. A payload type alone is not executable behavior. |
| Stored-payload object examples | Runtime/package-provided node definitions that store numeric or color payloads | Runtime-owned examples may exist, but Contracts must not publish them as builtin inventory or treat them as precedent for payload-type object identity. |
| Bool/string payload-named objects | Object identities that are only `bool`, `string`, or equivalent payload names | Reject as contract examples. `bool` and `string` are payload/atom semantics, not canonical object identities. If this behavior exists, it needs behavior-named Runtime/package object contracts such as a widget, toggle, label, text, or message object with explicit state/ports. |
| Message box behavior | Runtime/package-provided message-box object definition, `docs/control-message-model.md` | Keep the message payload shape and selector semantics. Concrete message-box object availability belongs to Runtime/package registries. |
| Bang behavior and event payload | Runtime/package-provided trigger object definition, `event.bang` port type | Keep separated. A trigger object is executable behavior; `event.bang` is payload/event type and is rejected as a node kind. |
| Resource source objects and resource payloads | Runtime/package-provided asset, decoder, uploader, and render nodes; `asset.video`, `gpu.texture2d` payload/resource types | Keep behavior/resource split. Source/decoder/uploader/render nodes are executable; `asset.video` and `gpu.texture2d` are payload/resource types and rejected as node kinds. |
| Object-text resolution state | `json-schema/object-text/v0.1/parse-result.schema.json`, `ObjectTextParseResultV01`, `parseObjectTextV01` / Rust parser | Keep. `resolvedKind` points to executable behavior; invalid payload identity object text should resolve to diagnostics rather than a payload node. |
| Unresolved-object placeholder | Any concrete unresolved placeholder object identity | Defer. Known transitional surface; issue direction is resolution diagnostics on object boxes rather than stabilizing a separate payload/data identity. |
