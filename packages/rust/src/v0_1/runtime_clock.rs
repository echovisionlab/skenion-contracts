use serde::{Deserialize, Serialize};

use super::clock::{ClockSourceKindV01, ClockStateV01, ClockTimeSignatureV01};

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum RuntimeClockDiagnosticSeverityV01 {
    Warning,
    Error,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeClockDiagnosticV01 {
    pub severity: RuntimeClockDiagnosticSeverityV01,
    pub code: String,
    pub message: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum RuntimeClockSourceStatusV01 {
    Running,
    Stopped,
    Error,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ClockSourceSnapshotV01 {
    pub source_id: String,
    pub source_kind: ClockSourceKindV01,
    pub status: RuntimeClockSourceStatusV01,
    pub latest_snapshot: Option<ClockStateV01>,
    pub diagnostics: Vec<RuntimeClockDiagnosticV01>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ClockSourceListResponseV01 {
    pub ok: bool,
    pub sources: Vec<ClockSourceSnapshotV01>,
    pub diagnostics: Vec<RuntimeClockDiagnosticV01>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ClockSourceSnapshotResponseV01 {
    pub ok: bool,
    pub source: Option<ClockSourceSnapshotV01>,
    pub diagnostics: Vec<RuntimeClockDiagnosticV01>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MidiInputDescriptorV01 {
    pub index: usize,
    pub name: String,
    pub backend: String,
    pub id: Option<String>,
    pub stable: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MidiInputListResponseV01 {
    pub ok: bool,
    pub inputs: Vec<MidiInputDescriptorV01>,
    pub diagnostics: Vec<RuntimeClockDiagnosticV01>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MidiClockSourceStartRequestV01 {
    pub source_id: String,
    pub input_port_index: usize,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub time_signature: Option<ClockTimeSignatureV01>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MidiClockSourceStartResponseV01 {
    pub ok: bool,
    pub source: Option<ClockSourceSnapshotV01>,
    pub diagnostics: Vec<RuntimeClockDiagnosticV01>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MidiClockSourceStopRequestV01 {
    pub source_id: String,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MidiClockSourceStopResponseV01 {
    pub ok: bool,
    pub source: Option<ClockSourceSnapshotV01>,
    pub diagnostics: Vec<RuntimeClockDiagnosticV01>,
}
