# Audio DSP Contract Baseline v0

This document fixes the initial contract boundary for future Rust DSP runtime
work. It does not introduce live audio device IO.

For the human-readable model, see the Skenion Docs
[audio DSP model](https://github.com/echovisionlab/skenion-docs/blob/main/docs/model/audio-dsp-model.md).

## Runtime Direction

The future Rust DSP runtime should compile audio subgraphs into a block-based
plan with stable node order, preallocated audio buffers, explicit block size and
sample rate, bounded control queues, and scalar-promotion optimizations for
objects such as `[*~ 0.5]`.

The audio callback must not perform UI dispatch, HTTP requests, graph mutation,
blocking IO, or unbounded allocation.

## First Builtin Surface

The first contract baseline publishes definitions for audio arithmetic,
`audio.osc`, `audio.phasor`, `audio.cos`, `audio.noise`, `audio.sig`, and
`audio.snapshot`.

These definitions make port shape and rate/domain classification visible to
Studio and examples. They do not imply that live audio rendering is implemented.

