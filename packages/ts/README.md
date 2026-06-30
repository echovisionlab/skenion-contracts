# @skenion/contracts

TypeScript contract schemas, schema/shape validators, and type definitions for
skenion.

This package defines object/interface, graph, graph-transform payload, package,
extension, and value shapes. It does not publish the first-party object
registry, builtin inventory, or Runtime HTTP/WebSocket transport DTO registry;
Runtime and package registries provide object definitions using these shapes.
Runtime remains responsible for registry-aware validation, connection
acceptance, session mutation acceptance, transport DTOs, and execution
semantics.
Value format and occurrence header types are reusable primitives for Runtime,
Studio, SDK, and package authors; they are not the Runtime realtime event or
command registry.
`parseObjectSpecV01` is a lexical shape helper only; concrete object resolution
and alias mapping are Runtime/package-registry responsibilities.

The canonical source repository is
https://github.com/skenion/skenion-contracts.
