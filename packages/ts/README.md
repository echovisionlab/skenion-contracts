# @skenion/contracts

TypeScript contract schemas, schema/shape validators, type definitions, and
Runtime HTTP guards for skenion.

This package defines object/interface, graph, payload, package, and Runtime HTTP
shapes. It does not publish the first-party object registry or builtin
inventory; Runtime and package registries provide object definitions using
these shapes. Runtime remains responsible for registry-aware validation,
connection acceptance, session mutation acceptance, and execution semantics.
`parseObjectTextV01` is a lexical shape helper only; concrete object resolution
and alias mapping are Runtime/package-registry responsibilities.

The canonical source repository is
https://github.com/skenion/skenion-contracts.
