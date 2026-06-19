use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use thiserror::Error;

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(tag = "type")]
#[serde(rename_all = "camelCase")]
pub enum ObjectTextAtomV01 {
    #[serde(rename = "float")]
    Float {
        value: f64,
        #[serde(skip_serializing_if = "Option::is_none")]
        representation: Option<String>,
    },
    #[serde(rename = "int")]
    Int {
        value: i64,
        #[serde(skip_serializing_if = "Option::is_none")]
        representation: Option<String>,
    },
    #[serde(rename = "uint")]
    Uint {
        value: u64,
        #[serde(skip_serializing_if = "Option::is_none")]
        representation: Option<String>,
    },
    #[serde(rename = "bool")]
    Bool { value: bool },
    #[serde(rename = "symbol")]
    Symbol { value: String },
    #[serde(rename = "string")]
    String { value: String },
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum ObjectTextPortDirectionV01 {
    Input,
    Output,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum ObjectTextPortRateV01 {
    Event,
    Control,
    Audio,
    Render,
    Gpu,
    Resource,
    Io,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum ObjectTextPortActivationV01 {
    Trigger,
    Latched,
    Passive,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ObjectTextPortV01 {
    pub id: String,
    pub direction: ObjectTextPortDirectionV01,
    #[serde(rename = "type")]
    pub port_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rate: Option<ObjectTextPortRateV01>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub activation: Option<ObjectTextPortActivationV01>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub default_value: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum ObjectTextDiagnosticSeverityV01 {
    Error,
    Warning,
    Info,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct ObjectTextDiagnosticV01 {
    pub severity: ObjectTextDiagnosticSeverityV01,
    pub code: String,
    pub message: String,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ObjectTextParseResultV01 {
    pub schema: String,
    pub schema_version: String,
    pub input: String,
    pub ok: bool,
    pub class_symbol: String,
    pub creation_args: Vec<ObjectTextAtomV01>,
    pub resolved_kind: Option<String>,
    pub resolved_kind_version: Option<String>,
    pub params: Map<String, Value>,
    pub instance_ports: Vec<ObjectTextPortV01>,
    pub display_text: String,
    pub diagnostics: Vec<ObjectTextDiagnosticV01>,
}

#[derive(Debug, Clone, PartialEq, Eq, Error)]
pub enum ObjectTextValidationErrorV01 {
    #[error("expected schema skenion.object-text.parse-result, found {0}")]
    SchemaMismatch(String),
    #[error("expected schemaVersion 0.1.0, found {0}")]
    SchemaVersionMismatch(String),
}

pub fn validate_object_text_parse_result_v01(
    result: &ObjectTextParseResultV01,
) -> Result<(), ObjectTextValidationErrorV01> {
    if result.schema != "skenion.object-text.parse-result" {
        return Err(ObjectTextValidationErrorV01::SchemaMismatch(
            result.schema.clone(),
        ));
    }
    if result.schema_version != "0.1.0" {
        return Err(ObjectTextValidationErrorV01::SchemaVersionMismatch(
            result.schema_version.clone(),
        ));
    }
    Ok(())
}
