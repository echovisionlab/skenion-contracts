use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum DataFlowV01 {
    Value,
    Event,
    Signal,
    Stream,
    Resource,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum PortDirectionV01 {
    Input,
    Output,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum PortActivationV01 {
    Trigger,
    Latched,
}

#[derive(Debug, Clone, PartialEq, Eq, Hash, Deserialize, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum ExecutionModelV01 {
    Event,
    Value,
    Frame,
    AudioBlock,
    VideoFrame,
    GpuPass,
    AsyncResource,
    ScriptControl,
    NativePlugin,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct NumberRangeV01 {
    pub min: Option<f64>,
    pub max: Option<f64>,
    pub step: Option<f64>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(untagged)]
pub enum StringOrStringsV01 {
    One(String),
    Many(Vec<String>),
}

impl StringOrStringsV01 {
    pub fn values(&self) -> Vec<&str> {
        match self {
            Self::One(value) => vec![value.as_str()],
            Self::Many(values) => values.iter().map(String::as_str).collect(),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct DataTypeV01 {
    pub flow: DataFlowV01,
    pub data_kind: String,
    pub unit: Option<String>,
    pub range: Option<NumberRangeV01>,
    pub shape: Option<Vec<u64>>,
    pub channels: Option<u64>,
    pub sample_rate: Option<f64>,
    pub format: Option<StringOrStringsV01>,
    pub color_space: Option<String>,
    pub frame_rate: Option<f64>,
    pub alpha_policy: Option<String>,
    pub values: Option<Vec<Value>>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct PortV01 {
    pub id: String,
    pub direction: PortDirectionV01,
    pub label: Option<String>,
    #[serde(rename = "type")]
    pub data_type: DataTypeV01,
    pub required: Option<bool>,
    #[serde(rename = "default")]
    pub default_value: Option<Value>,
    pub activation: Option<PortActivationV01>,
}
