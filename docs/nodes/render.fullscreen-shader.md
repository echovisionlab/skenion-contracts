# render.fullscreen-shader

`render.fullscreen-shader` runs a WGSL fullscreen pass and outputs a GPU texture resource.

The builtin definition only declares the static `out` port. Shader inputs are generated on each node instance from `@skenion.uniform` annotations in `params.source`.

Supported annotation form:

```wgsl
// @skenion.uniform speed number.float default=0.5
// @skenion.uniform tint color default=[1,0.2,0.1,1]
```

Studio analyzes the source, lets the user sync generated input ports, and Runtime builds a dynamic uniform layout from the resulting node interface.
