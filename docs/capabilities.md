# Capabilities

Runtime compatibility is based on negotiated capabilities.

Capability identifiers should be stable strings:

```text
runtime.handshake.v1
runtime.operations.v1
runtime.collaboration.v1
assets.sha256.v1
preview.snapshot.v1
telemetry.batch.v1
```

Graph edits are submitted as runtime operation envelopes through the session
operations route. Realtime collaboration support is advertised separately from
basic operation submission so clients can distinguish single-client mutation
from server-coordinated operation logs, presence, rebasing, and participant
metadata.

Applications must not infer behavior from runtime version alone. The editor and
SDK should hide, disable, or degrade features that are not present in the
negotiated capability set.
