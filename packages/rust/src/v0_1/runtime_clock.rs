use serde::{Deserialize, Serialize};

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
#[serde(rename_all = "lowercase")]
pub enum RuntimeIoDiagnosticSeverityV01 {
    Warning,
    Error,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeIoDiagnosticV01 {
    pub severity: RuntimeIoDiagnosticSeverityV01,
    pub code: String,
    pub message: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeIoDeviceDescriptorV01 {
    pub id: String,
    pub name: String,
    pub transport_kind: RuntimeIoTransportKindV01,
    pub directions: Vec<RuntimeIoDirectionV01>,
    pub backend: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub index: Option<usize>,
    pub stable: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeIoDeviceListResponseV01 {
    pub ok: bool,
    pub devices: Vec<RuntimeIoDeviceDescriptorV01>,
    pub diagnostics: Vec<RuntimeIoDiagnosticV01>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum RuntimeIoTransportKindV01 {
    Midi,
    Hid,
    Serial,
    Inline,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum RuntimeIoDirectionV01 {
    Input,
    Output,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeIoInlineFrameV01 {
    pub at_ns: u64,
    pub bytes: Vec<u8>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum RuntimeIoBindingConfigV01 {
    #[serde(rename = "midi")]
    Midi { device_id: String },
    #[serde(rename = "hid")]
    Hid { device_id: String },
    #[serde(rename = "serial")]
    Serial {
        device_id: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        baud_rate: Option<u32>,
    },
    #[serde(rename = "inline")]
    Inline {
        frames: Vec<RuntimeIoInlineFrameV01>,
    },
}
