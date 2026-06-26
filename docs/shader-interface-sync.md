# Shader Interface Sync

skenion must keep shader uniform names separate from value types.

```text
port id   = shader-facing semantic name, such as speed, enabled, iterations, tint
port type = data contract, such as control.number.float, control.bool, control.number.int, control.color
```

`u_value` and `u_color` were temporary fixed-port demo names. They are not
types. The fullscreen shader UI should read like:

```text
speed      : control.number.float
enabled    : control.bool
iterations : control.number.int
tint       : control.color
```

## Dynamic Flow

Dynamic shader interface sync v0 is explicit and annotation based:

```text
WGSL source annotations
  -> shader interface analyzer
  -> inferred node input ports
  -> Studio Analyze / Sync Inputs
  -> active graph mutation
  -> Runtime dynamic uniform layout
```

Example annotation block:

```wgsl
// @skenion.uniform speed number.float
// @skenion.uniform enabled bool
// @skenion.uniform iterations number.int
// @skenion.uniform tint color
```

Generated ports:

```text
speed      control.number.float
enabled    control.bool
iterations control.number.int
tint       control.color
out        gpu.texture2d
```

## Patch Boundary

The sync operation should be explicit. Studio can show a proposed interface diff
and then apply `replaceNodeInterface` with
`edgePolicy: "removeInvalidEdges"`. When ports disappear, invalid incident edges
are removed by that explicit patch. There is no implicit adapter insertion.

When applied through Runtime's session operation API, the
`replaceNodeInterface` change is submitted in a Runtime-owned operation
envelope and recorded as part of Runtime mutation history, so global undo/redo
can restore the previous port list and the removed compatible edges.

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
User source must not define skenion-reserved `vs_main`.
