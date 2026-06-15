# Capabilities

Runtime compatibility is based on negotiated capabilities.

Capability identifiers should be stable strings:

```text
runtime.handshake.v1
graph.patch.v1
assets.sha256.v1
preview.snapshot.v1
telemetry.batch.v1
```

Applications must not infer behavior from runtime version alone. The editor and
SDK should hide, disable, or degrade features that are not present in the
negotiated capability set.
