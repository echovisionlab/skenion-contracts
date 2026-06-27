# Clock / Transport Contract Baseline v0

This document fixes the first machine-facing clock boundary. It complements the
skenion Docs [Clock And Transport model](https://github.com/skenion/skenion-docs/blob/main/docs/model/clock-and-transport.md).

## Contract Decisions

- `clock.state` is a semantic data kind carried as `flow: "control"`.
- skenion does not define a user-facing global master transport.
- Runtime internals still have substrate clocks for host time, audio sample
  time, and render frame time.
- `clock.*` objects carry musical timing, transport, phase, and sync data
  through graph cables.
- `clock.*` objects do not drive the audio callback or render loop.
- `object.core.audio.output` owns the audio device sample clock.
- `object.core.render.output` owns the render frame clock.
- Bit depth and sample format are representation concerns; sample rate and
  sample frame are clock concerns.

## Clock State Authority

Clock fields should distinguish source capability and authority:

- `authoritative`
- `derived`
- `estimated`
- `unavailable`

External sources do not provide equivalent data:

- Ableton Link is strong for tempo/phase and weak for absolute arrangement bar.
- MIDI Clock plus Song Position Pointer can derive musical position when meter
  and bar offset are known.
- MTC/SMPTE is strong for timecode and weak for musical bar/beat.
- Plugin host transport can be the most accurate source, but each host field may
  still be unavailable.

## Published Builtins

`object.core.clock.local` publishes:

- `sync: clock.state`
- `reset: value.core.bang`
- `state: clock.state`
- `tick: value.core.bang`
- `phase: value.core.float64`
- `tempo: value.core.float64`

`object.core.clock.position-display` publishes:

- `clock: clock.state`

These are contract surfaces only. Runtime scheduling and external clock input
objects are later milestones; they are graph nodes/objects, not Runtime-global
start/stop endpoints.
