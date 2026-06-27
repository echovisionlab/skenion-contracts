# skenion-contracts

Rust contract types and validators for skenion.

This crate defines shared contract shapes and static validators. Value format
and occurrence header types are reusable primitives, not the Runtime realtime
event or command registry. Runtime remains responsible for registry-aware
validation, session mutation acceptance, transport DTOs, and execution
semantics.

The canonical source repository is
https://github.com/skenion/skenion-contracts.
