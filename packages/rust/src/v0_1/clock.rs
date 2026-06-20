use serde::{Deserialize, Serialize};

pub const MIDI_CLOCK_TICKS_PER_QUARTER_V01: u64 = 24;
pub const MIDI_CLOCK_TICKS_PER_SIXTEENTH_V01: u64 = MIDI_CLOCK_TICKS_PER_QUARTER_V01 / 4;

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum ClockAuthorityV01 {
    Authoritative,
    Derived,
    Estimated,
    Unavailable,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum ClockSourceKindV01 {
    Local,
    AudioDevice,
    RenderFrame,
    Link,
    MidiClock,
    Mtc,
    HostTransport,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum ClockCapabilityV01 {
    Running,
    TempoBpm,
    Phase,
    Tick,
    PpqPosition,
    SongPosition,
    BarBeat,
    TimeSignature,
    TimeSeconds,
    Timecode,
    SampleFrame,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ClockFieldV01<T> {
    pub value: Option<T>,
    pub authority: ClockAuthorityV01,
    pub source: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub confidence: Option<f64>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ClockTimeSignatureV01 {
    pub numerator: u64,
    pub denominator: u64,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ClockStateV01 {
    pub source_id: String,
    pub source_kind: ClockSourceKindV01,
    pub capabilities: Vec<ClockCapabilityV01>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub running: Option<ClockFieldV01<bool>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tempo_bpm: Option<ClockFieldV01<f64>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub phase01: Option<ClockFieldV01<f64>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tick_index: Option<ClockFieldV01<u64>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ppq_position: Option<ClockFieldV01<f64>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub song_position_sixteenth: Option<ClockFieldV01<u64>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bar: Option<ClockFieldV01<u64>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub beat: Option<ClockFieldV01<u64>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub division: Option<ClockFieldV01<u64>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tick_in_division: Option<ClockFieldV01<u64>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub time_signature: Option<ClockFieldV01<ClockTimeSignatureV01>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub time_seconds: Option<ClockFieldV01<f64>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub timecode: Option<ClockFieldV01<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sample_rate: Option<ClockFieldV01<f64>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sample_frame: Option<ClockFieldV01<u64>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub latency_seconds: Option<ClockFieldV01<f64>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_update_host_time_ns: Option<u64>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum MidiClockMessageKindV01 {
    Tick,
    Start,
    Stop,
    Continue,
    SongPositionPointer,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MidiClockMessageV01 {
    pub kind: MidiClockMessageKindV01,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub song_position_sixteenth: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub received_host_time_ns: Option<u64>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum MidiClockDiagnosticSeverityV01 {
    Warning,
    Error,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MidiClockDiagnosticV01 {
    pub severity: MidiClockDiagnosticSeverityV01,
    pub code: String,
    pub message: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MidiClockSnapshotV01 {
    pub source_id: String,
    pub running: bool,
    pub tick_index: u64,
    pub song_position_sixteenth: u64,
    pub ticks_per_quarter: u64,
    pub time_signature: Option<ClockTimeSignatureV01>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_update_host_time_ns: Option<u64>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MidiClockApplyResultV01 {
    pub snapshot: MidiClockSnapshotV01,
    pub clock_state: ClockStateV01,
    pub diagnostics: Vec<MidiClockDiagnosticV01>,
}

impl MidiClockSnapshotV01 {
    pub fn new(source_id: impl Into<String>) -> Self {
        Self {
            source_id: source_id.into(),
            running: false,
            tick_index: 0,
            song_position_sixteenth: 0,
            ticks_per_quarter: MIDI_CLOCK_TICKS_PER_QUARTER_V01,
            time_signature: None,
            last_update_host_time_ns: None,
        }
    }
}

fn field<T>(value: T, authority: ClockAuthorityV01, source: &str) -> ClockFieldV01<T> {
    ClockFieldV01 {
        value: Some(value),
        authority,
        source: source.to_owned(),
        confidence: None,
    }
}

fn unavailable<T>(source: &str) -> ClockFieldV01<T> {
    ClockFieldV01 {
        value: None,
        authority: ClockAuthorityV01::Unavailable,
        source: source.to_owned(),
        confidence: None,
    }
}

fn normalize_ticks_per_quarter(ticks_per_quarter: u64) -> u64 {
    if ticks_per_quarter == 0 {
        MIDI_CLOCK_TICKS_PER_QUARTER_V01
    } else {
        ticks_per_quarter
    }
}

fn invalid_spp_diagnostic() -> MidiClockDiagnosticV01 {
    MidiClockDiagnosticV01 {
        severity: MidiClockDiagnosticSeverityV01::Error,
        code: "invalid-midi-song-position-pointer".to_owned(),
        message: "MIDI Song Position Pointer must be a 14-bit sixteenth-note position".to_owned(),
    }
}

fn tick_overflow_diagnostic() -> MidiClockDiagnosticV01 {
    MidiClockDiagnosticV01 {
        severity: MidiClockDiagnosticSeverityV01::Warning,
        code: "midi-clock-tick-overflow".to_owned(),
        message: "MIDI Clock tickIndex reached u64::MAX".to_owned(),
    }
}

fn ticks_per_sixteenth(ticks_per_quarter: u64) -> u64 {
    (normalize_ticks_per_quarter(ticks_per_quarter) / 4).max(1)
}

fn meter_fields(snapshot: &MidiClockSnapshotV01) -> Option<(u64, u64, u64)> {
    let time_signature = snapshot.time_signature?;
    if time_signature.numerator == 0
        || time_signature.denominator == 0
        || 16 % time_signature.denominator != 0
    {
        return None;
    }
    let sixteenths_per_beat = 16 / time_signature.denominator;
    let sixteenths_per_bar = time_signature.numerator * sixteenths_per_beat;
    let sixteenth_within_bar = snapshot.song_position_sixteenth % sixteenths_per_bar;
    Some((
        sixteenths_per_beat,
        sixteenths_per_bar,
        sixteenth_within_bar,
    ))
}

pub fn parse_midi_clock_message_v01(bytes: &[u8]) -> Option<MidiClockMessageV01> {
    let status = bytes.first()?;
    match status {
        0xf8 => Some(MidiClockMessageV01 {
            kind: MidiClockMessageKindV01::Tick,
            song_position_sixteenth: None,
            received_host_time_ns: None,
        }),
        0xfa => Some(MidiClockMessageV01 {
            kind: MidiClockMessageKindV01::Start,
            song_position_sixteenth: None,
            received_host_time_ns: None,
        }),
        0xfb => Some(MidiClockMessageV01 {
            kind: MidiClockMessageKindV01::Continue,
            song_position_sixteenth: None,
            received_host_time_ns: None,
        }),
        0xfc => Some(MidiClockMessageV01 {
            kind: MidiClockMessageKindV01::Stop,
            song_position_sixteenth: None,
            received_host_time_ns: None,
        }),
        0xf2 => {
            let lsb = *bytes.get(1)?;
            let msb = *bytes.get(2)?;
            if lsb > 0x7f || msb > 0x7f {
                return None;
            }
            Some(MidiClockMessageV01 {
                kind: MidiClockMessageKindV01::SongPositionPointer,
                song_position_sixteenth: Some(u64::from(lsb) + (u64::from(msb) << 7)),
                received_host_time_ns: None,
            })
        }
        _ => None,
    }
}

pub fn apply_midi_clock_message_v01(
    snapshot: &MidiClockSnapshotV01,
    message: &MidiClockMessageV01,
) -> MidiClockApplyResultV01 {
    let mut next = snapshot.clone();
    if let Some(received_host_time_ns) = message.received_host_time_ns {
        next.last_update_host_time_ns = Some(received_host_time_ns);
    }
    next.ticks_per_quarter = normalize_ticks_per_quarter(next.ticks_per_quarter);
    let ticks_per_sixteenth = ticks_per_sixteenth(next.ticks_per_quarter);
    let mut diagnostics = Vec::new();

    match message.kind {
        MidiClockMessageKindV01::Tick => {
            if next.tick_index == u64::MAX {
                diagnostics.push(tick_overflow_diagnostic());
            } else {
                next.tick_index += 1;
            }
            next.song_position_sixteenth = next.tick_index / ticks_per_sixteenth;
        }
        MidiClockMessageKindV01::Start => {
            next.running = true;
            next.tick_index = 0;
            next.song_position_sixteenth = 0;
        }
        MidiClockMessageKindV01::Continue => {
            next.running = true;
        }
        MidiClockMessageKindV01::Stop => {
            next.running = false;
        }
        MidiClockMessageKindV01::SongPositionPointer => {
            let Some(song_position_sixteenth) = message.song_position_sixteenth else {
                diagnostics.push(invalid_spp_diagnostic());
                return MidiClockApplyResultV01 {
                    clock_state: midi_clock_snapshot_to_clock_state_v01(&next),
                    snapshot: next,
                    diagnostics,
                };
            };
            if song_position_sixteenth > 0x3fff {
                diagnostics.push(invalid_spp_diagnostic());
                return MidiClockApplyResultV01 {
                    clock_state: midi_clock_snapshot_to_clock_state_v01(&next),
                    snapshot: next,
                    diagnostics,
                };
            }
            next.song_position_sixteenth = song_position_sixteenth;
            next.tick_index = next.song_position_sixteenth * ticks_per_sixteenth;
        }
    }

    MidiClockApplyResultV01 {
        clock_state: midi_clock_snapshot_to_clock_state_v01(&next),
        snapshot: next,
        diagnostics,
    }
}

pub fn midi_clock_snapshot_to_clock_state_v01(snapshot: &MidiClockSnapshotV01) -> ClockStateV01 {
    let source = snapshot.source_id.as_str();
    let ticks_per_quarter = normalize_ticks_per_quarter(snapshot.ticks_per_quarter);
    let ticks_per_sixteenth = ticks_per_sixteenth(ticks_per_quarter);
    let mut capabilities = vec![
        ClockCapabilityV01::Running,
        ClockCapabilityV01::Tick,
        ClockCapabilityV01::PpqPosition,
        ClockCapabilityV01::SongPosition,
    ];
    let mut state = ClockStateV01 {
        source_id: snapshot.source_id.clone(),
        source_kind: ClockSourceKindV01::MidiClock,
        capabilities: Vec::new(),
        running: Some(field(
            snapshot.running,
            ClockAuthorityV01::Authoritative,
            source,
        )),
        tempo_bpm: Some(unavailable(source)),
        phase01: Some(field(
            (snapshot.tick_index % ticks_per_quarter) as f64 / ticks_per_quarter as f64,
            ClockAuthorityV01::Derived,
            source,
        )),
        tick_index: Some(field(
            snapshot.tick_index,
            ClockAuthorityV01::Authoritative,
            source,
        )),
        ppq_position: Some(field(
            snapshot.tick_index as f64 / ticks_per_quarter as f64,
            ClockAuthorityV01::Derived,
            source,
        )),
        song_position_sixteenth: Some(field(
            snapshot.song_position_sixteenth,
            ClockAuthorityV01::Authoritative,
            source,
        )),
        bar: Some(unavailable(source)),
        beat: Some(unavailable(source)),
        division: Some(unavailable(source)),
        tick_in_division: Some(unavailable(source)),
        time_signature: Some(unavailable(source)),
        time_seconds: Some(unavailable(source)),
        timecode: Some(unavailable(source)),
        sample_rate: Some(unavailable(source)),
        sample_frame: Some(unavailable(source)),
        latency_seconds: Some(unavailable(source)),
        last_update_host_time_ns: snapshot.last_update_host_time_ns,
    };

    if let (
        Some(time_signature),
        Some((sixteenths_per_beat, sixteenths_per_bar, sixteenth_within_bar)),
    ) = (snapshot.time_signature, meter_fields(snapshot))
    {
        capabilities.push(ClockCapabilityV01::TimeSignature);
        capabilities.push(ClockCapabilityV01::BarBeat);
        state.time_signature = Some(field(
            time_signature,
            ClockAuthorityV01::Authoritative,
            source,
        ));
        state.bar = Some(field(
            (snapshot.song_position_sixteenth / sixteenths_per_bar) + 1,
            ClockAuthorityV01::Derived,
            source,
        ));
        state.beat = Some(field(
            (sixteenth_within_bar / sixteenths_per_beat) + 1,
            ClockAuthorityV01::Derived,
            source,
        ));
        state.division = Some(field(
            (sixteenth_within_bar % sixteenths_per_beat) + 1,
            ClockAuthorityV01::Derived,
            source,
        ));
        state.tick_in_division = Some(field(
            snapshot.tick_index % ticks_per_sixteenth,
            ClockAuthorityV01::Derived,
            source,
        ));
    }

    state.capabilities = capabilities;
    state
}
