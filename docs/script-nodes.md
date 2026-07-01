# Script Nodes v0.1

Script nodes are ordinary skenion node definitions authored through a TypeScript
SDK helper.

The stable contract is a serializable `skenion.node.definition` manifest. Type
inference in TypeScript is authoring help, not the runtime source of truth.

## Boundary

`skenion-contracts` owns:

- node definition manifest schema
- graph schema
- raw generated contract packages
- fixtures and conformance tests

`skenion-sdk` will own:

- `defineNode`
- `t.value`, `t.event`, `t.signal`, `t.stream`, `t.resource`
- primitive helpers such as `t.f32`, `t.bool`, `t.string`
- manifest extraction and validation against `skenion-contracts`
- local script test harness

`skenion-studio` will visualize manifests. It must not invent a separate node
model.

## Manifest Output

A script module should produce:

- a `skenion.node.definition` manifest
- an executable module or bundle
- a bundle hash

The manifest contains stable port ids and type contracts. Graph edges connect by
node instance id and port id, not labels or TypeScript property display names.

## Initial Lifecycle

v0.1 core script lifecycle:

- `onInit`
- `onInput`
- `onEvent`
- `onDispose`

Do not add first-class `onMidi`, `onBeat`, or `onFrame` to the core v0.1
lifecycle. MIDI, beat, timecode, and frame activity should enter scripts
through typed ports or future opt-in execution metadata.

## Sandbox

Default script execution is restrictive:

- no DOM
- no filesystem
- no raw network
- no process access
- no dynamic imports by default
- runtime-provided context only

Runtime enforcement must include:

- CPU budget
- memory budget
- queue limits
- output rate limits
- structured issues
- last-good or default output behavior after hook failure

Script errors must never stop the Rust render loop or audio callback.

## Example Authoring Shape

```ts
import { defineNode, t } from "@skenion/sdk/script";

export default defineNode({
  id: "example.threshold",
  version: "0.1.0",
  inputs: {
    value: t.signal(t.f32({ min: 0, max: 1 }), { activation: "trigger" }),
    threshold: t.value(t.f32({ default: 0.5 }), { activation: "latched" }),
    reset: t.event(t.bang(), { activation: "trigger" })
  },
  outputs: {
    above: t.signal(t.bool()),
    crossed: t.event(t.bang())
  },
  onInit(ctx) {},
  onInput(ctx, change) {},
  onEvent(ctx, event) {},
  onDispose(ctx) {}
});
```

The SDK must compile this authoring shape into a manifest compatible with
`json-schema/node/v0.1/node-definition.schema.json`.
