# Node Addressing

skenion uses stable addresses for editor panels, runtime control surfaces, and
issues that need to refer to a specific part of a loaded graph.

Addresses are not hidden graph dependencies. They are safe for inspection,
remote-control panels, issues, and help links. Graph execution must still
express dependencies with explicit graph edges, or later with explicit
`send`/`receive`-style nodes.

## Address Forms

The pre-v1 address forms are:

- `node:<nodeId>/param:<paramId>`
- `node:<nodeId>/port:<portId>`
- `node:<nodeId>/state:<stateId>`

Examples:

```text
node:float_1/param:value
node:float_1/port:value
node:shader_1/port:speed
node:toggle_1/state:value
```

## Use Cases

Inspector and control panels may read values by address:

- graph params, such as `node:float_1/param:value`
- runtime output/control state, such as `node:float_1/state:value`
- port metadata and issues, such as `node:shader_1/port:speed`

Runtime graph execution must not read another node through an address unless the
saved graph contains an explicit edge or an explicit future reference node. This
keeps evaluation debuggable and prevents invisible dependencies.

## Runtime Control Reads

The runtime control API may expose read requests by structured address:

```json
{
  "nodeId": "float_1",
  "target": "state",
  "id": "value"
}
```

This is equivalent to `node:float_1/state:value`. It is intended for Studio
inspectors and remote controls, not for implicit graph execution.
