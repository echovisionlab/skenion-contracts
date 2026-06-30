# Object/Data Payload Semantics Inventory

Issue: skenion/skenion-contracts#174.

Contracts v0.1 draws this boundary:

- User-facing `objectSpec` records what the author typed in an object box.
- Resolved `implementation` identifies executable behavior with provider,
  `objectId`, optional version/interface data, ports, state, and diagnostics.
- Port `type`, `accepts`, `messageKeys`, control atoms, and resources identify payload semantics.
- Runtime/package registries own object availability, dispatch, state mutation,
  ordering, operation acceptance, and execution. Contracts only define the
  schemas, DTOs, and static shape/invariant validators for the metadata
  Runtime/package surfaces exchange.

## Inventory And Disposition

| Surface | Files/Symbols | Disposition |
| --- | --- | --- |
| Message key and atom payloads | `json-schema/message/v0.1/message-value.schema.json`, `MessageValueV01`, `MessageAtomV01`, `packages/rust/src/v0_1/message_value.rs` | Keep as payload shape. Keys and atoms are messages, not node identities. |
| Key acceptance metadata | `messageKeys` in `json-schema/graph/v0.1/graph.schema.json`, `json-schema/node/v0.1/node-definition.schema.json`, `json-schema/object-spec/v0.1/parse-result.schema.json`, `MessageKeyPolicyV01` | Keep and tighten as static metadata. Key lists must be non-empty key strings; Contracts validators can require key policy shape on message-key-aware input ports, but Runtime decides dispatch acceptance for a loaded registry/session. |
| Port payload acceptance metadata | `PortSpecV01.accepts`, object-spec `instancePorts[].accepts`, graph edge validation | Keep as payload compatibility metadata. It must not be copied into implementation identity. |
| Legacy/generic value port aliases | `message.any`, `number.float`, `number.int`, `number.uint`, `boolean`, `color`, `string`, `value.*`, `value<...>` in TS/Rust shape validators and invalid fixtures | Reject. Current graph/node contracts use canonical port types such as `value.core.float64` and `value.core.message`. |
| Payload identity as executable implementation | `control.*`, `value.core.bang`, `value.core.string`, `value.core.string`, `value.core.string`, `value.core.tensor`, `value.*`, `data.*`, `payload.*` when used as `graph.nodes[].implementation.objectId` | Reject in graph and graph-fragment semantic validation. A payload type alone is not executable behavior. |
| Stored-payload object examples | Runtime/package-provided node definitions that store numeric or color payloads | Runtime-owned examples may exist, but Contracts must not publish them as builtin inventory or treat them as precedent for payload-type object identity. |
| Bool/string payload-named objects | Object identities that are only `bool`, `string`, or equivalent payload names | Reject as contract examples. `bool` and `string` are payload/atom semantics, not canonical object identities. If this behavior exists, it needs behavior-named Runtime/package object contracts such as a widget, toggle, label, text, or message object with explicit state/ports. |
| Message box behavior | Runtime/package-provided message-box object definition, `docs/message-value-model.md` | Keep the message payload shape and key semantics. Concrete message-box object availability belongs to Runtime/package registries. |
| Bang behavior and event payload | Runtime/package-provided trigger object definition, `value.core.bang` port type | Keep separated. A trigger object is executable behavior; `value.core.bang` is payload/event type and is rejected as a node kind. |
| Resource source objects and resource payloads | Runtime/package-provided asset, decoder, uploader, and render nodes; `value.core.string`, `value.core.tensor` payload/resource types | Keep behavior/resource split. Source/decoder/uploader/render nodes are executable; `value.core.string` and `value.core.tensor` are payload/resource types and rejected as node kinds. |
| Object-spec parse result shape | `json-schema/object-spec/v0.1/parse-result.schema.json`, `ObjectSpecParseResultV01`, `parseObjectSpecV01` / Rust parser | Keep as shape plus lexical helper. `implementation` and `objectResolution` may point to executable behavior when a Runtime/package resolver supplies them; Contracts must not map object spec to concrete first-party kinds or decide object availability. Invalid payload identity object spec should resolve to diagnostics in the owning Runtime/package resolver rather than to a payload node. |
| Unresolved-object placeholder | Any concrete unresolved placeholder object identity | Defer. Known transitional surface; issue direction is resolution diagnostics on object boxes rather than stabilizing a separate payload/data identity. |
