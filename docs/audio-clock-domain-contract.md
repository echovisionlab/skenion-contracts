# Audio Clock Domain Contract

This contract fixes the v0 audio endpoint and clock-domain planning vocabulary.
It does not implement a high-quality bridge or resampler.

## Contract Types

- `AudioDeviceDescriptorV01`
- `AudioDevicePreferenceV01`
- `AudioStreamConfigRequestV01`
- `AudioStreamConfigResolvedV01`
- `AudioEndpointV01`
- `AudioClockDomainV01`
- `AudioGraphPartitionV01`
- `AudioClockBridgePlanV01`
- `AudioResamplerPlanV01`

## Canonical Objects

| Object | Meaning |
| --- | --- |
| `audio.input` | Input endpoint source, Pd-style `adc~` alias. |
| `audio.output` | Output endpoint sink, Pd-style `dac~` alias. |
| `audio.clock-bridge` | Explicit independent clock-domain crossing boundary. |
| `audio.resample` | Explicit sample-rate/drift compensation boundary. |

## Rules

- `device != stream != clock domain`.
- The same numeric `sampleRate` does not imply the same `AudioClockDomain`.
- Direct audio-rate `value.core.float32` routing is valid inside one clock
  domain.
- Independent-domain routing requires `audio.clock-bridge` or `audio.resample`.
- Audio callbacks must execute precompiled plans and must not access graph,
  session, UI, HTTP, file IO, allocation-heavy paths, or graph locks.

## v0 Bridge Planning

`planAudioClockBridgeV01` / `plan_audio_clock_bridge_v01` classifies a route:

- same domain: `method: direct`, `required: false`
- different domains with an explicit bridge node: `method: clock-bridge`
- different domains without a bridge: `method: invalid` with diagnostic code
  `audio-clock-domain-crossing-requires-bridge`

Runtime planners may add richer `AudioResamplerPlanV01` details later, but they
must not silently accept hidden independent-domain routes.
