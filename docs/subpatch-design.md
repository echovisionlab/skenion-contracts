# Subpatch Design

Subpatches are not implemented in the v0.1 runtime. This document records the
pre-v1 design constraints so that the control layer can evolve without blocking
on nested patch execution.

## Goals

- let artists group related graph logic into a named patch
- keep inlet/outlet contracts explicit
- allow help patches to reuse the same graph document model
- avoid hidden reads between parent and child patches

## Non-Goals

- no runtime subpatch execution in the current milestone
- no implicit access to parent node params or runtime state
- no dynamic inlet/outlet UI yet
- no pack/unpack or send/receive semantics yet

## Proposed Model

A subpatch should eventually be represented as a graph document with an explicit
boundary node contract:

- parent-facing inlet ports
- parent-facing outlet ports
- saved child graph
- child node registry requirements
- optional help/example metadata

Values cross the boundary only through declared inlet/outlet ports. Runtime
control panels may inspect child addresses when a session exposes them, but graph
execution may not implicitly read parent or sibling state.

## Help Patch Relationship

Node help can point to an example graph or help patch. Help patches are
documentation artifacts first. They must not require runtime subpatch execution
to be useful in Studio.
