# Shader Interface Sync

Skenion must keep shader uniform names separate from value types.

```text
port id   = shader-facing semantic name, such as speed, enabled, iterations, tint
port type = data contract, such as number.float, boolean, number.int, color
```

`u_value` and `u_color` were temporary fixed-port demo names. They are not
types. The fullscreen shader UI should read like:

```text
speed      : number.float
enabled    : boolean
iterations : number.int
tint       : color
```

## Dynamic Flow

Dynamic shader interface sync v0 is explicit and annotation based:

```text
WGSL source annotations
  -> shader interface analyzer
  -> inferred node input ports
  -> Studio Analyze / Sync Inputs
  -> replaceNodeInterface graph patch
  -> Runtime dynamic uniform layout
```

Example annotation block:

```wgsl
// @skenion.uniform speed number.float
// @skenion.uniform enabled boolean
// @skenion.uniform iterations number.int
// @skenion.uniform tint color
```

Generated ports:

```text
speed      value<number.float>
enabled    value<boolean>
iterations value<number.int>
tint       value<color>
out        resource<gpu.texture2d>
```

## Patch Boundary

The sync operation should be explicit. Studio can show a proposed interface diff
and then apply `replaceNodeInterface` with
`edgePolicy: "removeInvalidEdges"`. When ports disappear, invalid incident edges
are removed by that explicit patch. There is no implicit adapter insertion.

When applied through `/v0/session/mutate`, `replaceNodeInterface` is recorded
as part of Runtime mutation history, so global undo/redo can restore the
previous port list and the removed compatible edges.

## Source Boundary

Runtime owns the generated WGSL header. User source should provide `fs_main`
and may read:

```wgsl
skenion.resolution
skenion.time
skenion.frame
skenion.<uniformId>
```

Boolean uniforms are stored as `u32`; user shaders should call `sk_bool`.
User source must not define Skenion-reserved `vs_main`.
