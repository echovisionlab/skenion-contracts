import type {
  ClockFieldV01,
  ClockStateV01,
  ClockTimeSignatureV01
} from "./types.js";

export const MIDI_CLOCK_TICKS_PER_QUARTER_V01 = 24;
export const MIDI_CLOCK_TICKS_PER_SIXTEENTH_V01 = MIDI_CLOCK_TICKS_PER_QUARTER_V01 / 4;

export type MidiClockMessageKindV01 = "tick" | "start" | "stop" | "continue" | "song-position-pointer";

export interface MidiClockMessageV01 {
  kind: MidiClockMessageKindV01;
  songPositionSixteenth?: number;
  receivedHostTimeNs?: number;
}

export interface MidiClockDiagnosticV01 {
  severity: "warning" | "error";
  code: string;
  message: string;
}

export interface MidiClockSnapshotV01 {
  sourceId: string;
  running: boolean;
  tickIndex: number;
  songPositionSixteenth: number;
  ticksPerQuarter: number;
  timeSignature: ClockTimeSignatureV01 | null;
  lastUpdateHostTimeNs?: number;
}

export interface MidiClockSnapshotOptionsV01 {
  sourceId?: string;
  ticksPerQuarter?: number;
  timeSignature?: ClockTimeSignatureV01 | null;
  lastUpdateHostTimeNs?: number;
}

export interface MidiClockApplyResultV01 {
  snapshot: MidiClockSnapshotV01;
  clockState: ClockStateV01;
  diagnostics: MidiClockDiagnosticV01[];
}

function isMidiDataByte(value: number | undefined): boolean {
  return Number.isInteger(value) && value !== undefined && value >= 0x00 && value <= 0x7f;
}

function field<T>(value: T, authority: ClockFieldV01<T>["authority"], source: string): ClockFieldV01<T> {
  return { value, authority, source };
}

function unavailable<T>(source: string): ClockFieldV01<T> {
  return { value: null, authority: "unavailable", source };
}

function normalizeTicksPerQuarter(ticksPerQuarter: number): number {
  return Number.isFinite(ticksPerQuarter) && ticksPerQuarter > 0 ? ticksPerQuarter : MIDI_CLOCK_TICKS_PER_QUARTER_V01;
}

function validSongPositionSixteenth(value: number | undefined): value is number {
  return Number.isInteger(value) && value !== undefined && value >= 0 && value <= 0x3fff;
}

function meterFields(snapshot: MidiClockSnapshotV01): null | {
  timeSignature: ClockTimeSignatureV01;
  sixteenthsPerBeat: number;
  sixteenthsPerBar: number;
  sixteenthWithinBar: number;
} {
  const meter = snapshot.timeSignature;
  if (!meter || meter.numerator <= 0 || meter.denominator <= 0 || 16 % meter.denominator !== 0) {
    return null;
  }
  const sixteenthsPerBeat = 16 / meter.denominator;
  const sixteenthsPerBar = meter.numerator * sixteenthsPerBeat;
  return {
    timeSignature: meter,
    sixteenthsPerBeat,
    sixteenthsPerBar,
    sixteenthWithinBar: snapshot.songPositionSixteenth % sixteenthsPerBar
  };
}

export function parseMidiClockMessageV01(bytes: readonly number[]): MidiClockMessageV01 | null {
  const status = bytes[0];
  if (status === 0xf8) {
    return { kind: "tick" };
  }
  if (status === 0xfa) {
    return { kind: "start" };
  }
  if (status === 0xfb) {
    return { kind: "continue" };
  }
  if (status === 0xfc) {
    return { kind: "stop" };
  }
  if (status === 0xf2 && isMidiDataByte(bytes[1]) && isMidiDataByte(bytes[2])) {
    return {
      kind: "song-position-pointer",
      songPositionSixteenth: bytes[1] + (bytes[2] << 7)
    };
  }
  return null;
}

export function createInitialMidiClockSnapshotV01(options: MidiClockSnapshotOptionsV01 = {}): MidiClockSnapshotV01 {
  return {
    sourceId: options.sourceId ?? "midi-clock",
    running: false,
    tickIndex: 0,
    songPositionSixteenth: 0,
    ticksPerQuarter: normalizeTicksPerQuarter(options.ticksPerQuarter ?? MIDI_CLOCK_TICKS_PER_QUARTER_V01),
    timeSignature: options.timeSignature ?? null,
    lastUpdateHostTimeNs: options.lastUpdateHostTimeNs
  };
}

export function applyMidiClockMessageV01(snapshot: MidiClockSnapshotV01, message: MidiClockMessageV01): MidiClockApplyResultV01 {
  const next: MidiClockSnapshotV01 = {
    ...snapshot,
    ticksPerQuarter: normalizeTicksPerQuarter(snapshot.ticksPerQuarter),
    lastUpdateHostTimeNs: message.receivedHostTimeNs ?? snapshot.lastUpdateHostTimeNs
  };
  const ticksPerSixteenth = next.ticksPerQuarter / 4;
  const diagnostics: MidiClockDiagnosticV01[] = [];

  switch (message.kind) {
    case "tick":
      if (next.tickIndex >= Number.MAX_SAFE_INTEGER) {
        diagnostics.push({
          severity: "warning",
          code: "midi-clock-tick-overflow",
          message: "MIDI Clock tickIndex reached JavaScript's safe integer limit"
        });
      } else {
        next.tickIndex += 1;
      }
      next.songPositionSixteenth = Math.floor(next.tickIndex / ticksPerSixteenth);
      break;
    case "start":
      next.running = true;
      next.tickIndex = 0;
      next.songPositionSixteenth = 0;
      break;
    case "continue":
      next.running = true;
      break;
    case "stop":
      next.running = false;
      break;
    case "song-position-pointer":
      if (!validSongPositionSixteenth(message.songPositionSixteenth)) {
        diagnostics.push({
          severity: "error",
          code: "invalid-midi-song-position-pointer",
          message: "MIDI Song Position Pointer must be a 14-bit sixteenth-note position"
        });
        break;
      }
      next.songPositionSixteenth = message.songPositionSixteenth;
      next.tickIndex = Math.round(next.songPositionSixteenth * ticksPerSixteenth);
      break;
  }

  return {
    snapshot: next,
    clockState: midiClockSnapshotToClockStateV01(next),
    diagnostics
  };
}

export function midiClockSnapshotToClockStateV01(snapshot: MidiClockSnapshotV01): ClockStateV01 {
  const source = snapshot.sourceId;
  const ticksPerQuarter = normalizeTicksPerQuarter(snapshot.ticksPerQuarter);
  const ticksPerSixteenth = ticksPerQuarter / 4;
  const capabilities = ["running", "tick", "ppq-position", "song-position"];
  const state: ClockStateV01 = {
    sourceId: source,
    sourceKind: "midi-clock",
    capabilities,
    running: field(snapshot.running, "authoritative", source),
    tempoBpm: unavailable(source),
    phase01: field((snapshot.tickIndex % ticksPerQuarter) / ticksPerQuarter, "derived", source),
    tickIndex: field(snapshot.tickIndex, "authoritative", source),
    ppqPosition: field(snapshot.tickIndex / ticksPerQuarter, "derived", source),
    songPositionSixteenth: field(snapshot.songPositionSixteenth, "authoritative", source),
    timeSeconds: unavailable(source),
    timecode: unavailable(source),
    sampleRate: unavailable(source),
    sampleFrame: unavailable(source),
    latencySeconds: unavailable(source),
    lastUpdateHostTimeNs: snapshot.lastUpdateHostTimeNs
  };

  const meter = meterFields(snapshot);
  if (meter) {
    capabilities.push("time-signature", "bar-beat");
    state.timeSignature = field(meter.timeSignature, "authoritative", source);
    state.bar = field(Math.floor(snapshot.songPositionSixteenth / meter.sixteenthsPerBar) + 1, "derived", source);
    state.beat = field(Math.floor(meter.sixteenthWithinBar / meter.sixteenthsPerBeat) + 1, "derived", source);
    state.division = field(Math.floor(meter.sixteenthWithinBar % meter.sixteenthsPerBeat) + 1, "derived", source);
    state.tickInDivision = field(snapshot.tickIndex % ticksPerSixteenth, "derived", source);
  } else {
    state.timeSignature = unavailable(source);
    state.bar = unavailable(source);
    state.beat = unavailable(source);
    state.division = unavailable(source);
    state.tickInDivision = unavailable(source);
  }

  return state;
}
