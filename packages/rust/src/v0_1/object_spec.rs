use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use thiserror::Error;

use super::types::MessageKeyPolicyV01;

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(tag = "type")]
#[serde(rename_all = "camelCase")]
pub enum ObjectSpecAtomV01 {
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
    #[serde(rename = "identifier")]
    Identifier { value: String },
    #[serde(rename = "string")]
    String { value: String },
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum ObjectSpecPortDirectionV01 {
    Input,
    Output,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum ObjectSpecPortRateV01 {
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
pub enum ObjectSpecPortActivationV01 {
    Trigger,
    Latched,
    Passive,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ObjectSpecPortV01 {
    pub id: String,
    pub direction: ObjectSpecPortDirectionV01,
    #[serde(rename = "type")]
    pub port_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rate: Option<ObjectSpecPortRateV01>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub accepts: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub activation: Option<ObjectSpecPortActivationV01>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub default_value: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message_keys: Option<MessageKeyPolicyV01>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum ObjectSpecDiagnosticSeverityV01 {
    Error,
    Warning,
    Info,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct ObjectSpecDiagnosticV01 {
    pub severity: ObjectSpecDiagnosticSeverityV01,
    pub code: String,
    pub message: String,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ObjectSpecParseResultV01 {
    pub schema: String,
    pub schema_version: String,
    pub input: String,
    pub ok: bool,
    pub class_name: String,
    pub creation_args: Vec<ObjectSpecAtomV01>,
    pub resolved_kind: Option<String>,
    pub resolved_kind_version: Option<String>,
    pub params: Map<String, Value>,
    pub instance_ports: Vec<ObjectSpecPortV01>,
    pub display_text: String,
    pub diagnostics: Vec<ObjectSpecDiagnosticV01>,
}

#[derive(Debug, Clone, PartialEq, Eq, Error)]
pub enum ObjectSpecValidationErrorV01 {
    #[error("expected schema skenion.object-spec.parse-result, found {0}")]
    SchemaMismatch(String),
    #[error("expected schemaVersion 0.1.0, found {0}")]
    SchemaVersionMismatch(String),
    #[error("object spec parse result semantic validation failed: {0}")]
    Semantic(String),
}

pub fn validate_object_spec_parse_result_v01(
    result: &ObjectSpecParseResultV01,
) -> Result<(), ObjectSpecValidationErrorV01> {
    if result.schema != "skenion.object-spec.parse-result" {
        return Err(ObjectSpecValidationErrorV01::SchemaMismatch(
            result.schema.clone(),
        ));
    }
    if result.schema_version != "0.1.0" {
        return Err(ObjectSpecValidationErrorV01::SchemaVersionMismatch(
            result.schema_version.clone(),
        ));
    }
    let errors = object_spec_parse_result_semantic_errors(result);
    if !errors.is_empty() {
        return Err(ObjectSpecValidationErrorV01::Semantic(errors.join("; ")));
    }
    Ok(())
}

fn is_key_aware_object_spec_input_port(port: &ObjectSpecPortV01) -> bool {
    port.direction == ObjectSpecPortDirectionV01::Input
        && (port.port_type == "value.core.message"
            || port
                .accepts
                .as_ref()
                .is_some_and(|accepted| accepted.iter().any(|value| value == "value.core.message")))
}

fn object_spec_message_key_policy_errors(port: &ObjectSpecPortV01, label: &str) -> Vec<String> {
    let Some(policy) = &port.message_keys else {
        return if is_key_aware_object_spec_input_port(port) {
            vec![format!(
                "{label} message-key-aware input port requires messageKeys"
            )]
        } else {
            Vec::new()
        };
    };

    let mut errors = Vec::new();
    if policy.accepted.is_empty() {
        errors.push(format!(
            "{label} messageKeys.accepted must list at least one key"
        ));
    }
    for (field, keys) in [
        ("silent", &policy.silent),
        ("trigger", &policy.trigger),
        ("store", &policy.store),
        ("emit", &policy.emit),
    ] {
        for key in keys.iter().flat_map(|values| values.iter()) {
            if !policy.accepted.contains(key) {
                errors.push(format!(
                    "{label} messageKeys.{field} key {key} is not accepted"
                ));
            }
        }
    }
    if policy
        .trigger
        .as_ref()
        .is_some_and(|keys| keys.iter().any(|key| key == "set"))
    {
        errors.push(format!("{label} messageKeys.trigger must not include set"));
    }
    if policy
        .emit
        .as_ref()
        .is_some_and(|keys| keys.iter().any(|key| key == "set"))
    {
        errors.push(format!("{label} messageKeys.emit must not include set"));
    }
    if policy.accepted.iter().any(|key| key == "set")
        && !policy
            .silent
            .as_ref()
            .is_some_and(|keys| keys.iter().any(|key| key == "set"))
        && !policy
            .store
            .as_ref()
            .is_some_and(|keys| keys.iter().any(|key| key == "set"))
    {
        errors.push(format!(
            "{label} messageKeys.set must be silent or store behavior"
        ));
    }

    errors
}

fn object_spec_parse_result_semantic_errors(result: &ObjectSpecParseResultV01) -> Vec<String> {
    result
        .instance_ports
        .iter()
        .flat_map(|port| {
            object_spec_message_key_policy_errors(
                port,
                &format!("objectSpec instancePort {}.{}", result.class_name, port.id),
            )
        })
        .collect()
}

fn diagnostic(code: &str, message: impl Into<String>) -> ObjectSpecDiagnosticV01 {
    ObjectSpecDiagnosticV01 {
        severity: ObjectSpecDiagnosticSeverityV01::Error,
        code: code.to_owned(),
        message: message.into(),
    }
}

fn success(
    input: &str,
    display_text: &str,
    class_name: &str,
    creation_args: Vec<ObjectSpecAtomV01>,
) -> ObjectSpecParseResultV01 {
    ObjectSpecParseResultV01 {
        schema: "skenion.object-spec.parse-result".to_owned(),
        schema_version: "0.1.0".to_owned(),
        input: input.to_owned(),
        ok: true,
        class_name: class_name.to_owned(),
        creation_args,
        resolved_kind: None,
        resolved_kind_version: None,
        params: Map::new(),
        instance_ports: Vec::new(),
        display_text: display_text.to_owned(),
        diagnostics: Vec::new(),
    }
}

fn failure(
    input: &str,
    display_text: &str,
    class_name: &str,
    creation_args: Vec<ObjectSpecAtomV01>,
    code: &str,
    message: impl Into<String>,
) -> ObjectSpecParseResultV01 {
    ObjectSpecParseResultV01 {
        schema: "skenion.object-spec.parse-result".to_owned(),
        schema_version: "0.1.0".to_owned(),
        input: input.to_owned(),
        ok: false,
        class_name: class_name.to_owned(),
        creation_args,
        resolved_kind: None,
        resolved_kind_version: None,
        params: Map::new(),
        instance_ports: Vec::new(),
        display_text: display_text.to_owned(),
        diagnostics: vec![diagnostic(code, message)],
    }
}

fn normalize_input(input: &str) -> Result<String, (String, String)> {
    let trimmed = input.trim();
    let starts_with_bracket = trimmed.starts_with('[');
    let ends_with_bracket = trimmed.ends_with(']');
    if starts_with_bracket || ends_with_bracket {
        if starts_with_bracket != ends_with_bracket {
            return Err((
                trimmed.to_owned(),
                "object spec brackets must be balanced".to_owned(),
            ));
        }
        return Ok(trimmed[1..trimmed.len() - 1].trim().to_owned());
    }
    Ok(trimmed.to_owned())
}

fn tokenize(display_text: &str) -> Vec<&str> {
    display_text.split_whitespace().collect()
}

fn parse_atom(token: &str) -> ObjectSpecAtomV01 {
    let unsigned_token = token.strip_prefix(['+', '-']).unwrap_or(token);
    if !unsigned_token.is_empty() {
        let all_digits = unsigned_token
            .chars()
            .all(|character| character.is_ascii_digit());
        if all_digits {
            return ObjectSpecAtomV01::Int {
                value: token.parse::<i64>().unwrap_or(0),
                representation: Some("i32".to_owned()),
            };
        }
    }

    let maybe_float = if token.contains('.') || token.contains('e') || token.contains('E') {
        token.parse::<f64>().ok()
    } else {
        None
    };
    match maybe_float {
        Some(value) if value.is_finite() => {
            return ObjectSpecAtomV01::Float {
                value,
                representation: Some("f32".to_owned()),
            };
        }
        _ => {}
    }

    if token == "true" || token == "false" {
        return ObjectSpecAtomV01::Bool {
            value: token == "true",
        };
    }

    ObjectSpecAtomV01::Identifier {
        value: token.to_owned(),
    }
}

pub fn parse_object_spec_v01(input: &str) -> ObjectSpecParseResultV01 {
    let display_text = match normalize_input(input) {
        Ok(display_text) => display_text,
        Err((display_text, message)) => {
            return failure(
                input,
                &display_text,
                "<invalid>",
                Vec::new(),
                "invalid-syntax",
                message,
            );
        }
    };
    let tokens = tokenize(&display_text);
    let Some((class_name, arg_tokens)) = tokens.split_first() else {
        return failure(
            input,
            "<empty>",
            "<empty>",
            Vec::new(),
            "empty-object-spec",
            "object spec must contain a class name",
        );
    };
    let creation_args: Vec<ObjectSpecAtomV01> =
        arg_tokens.iter().map(|token| parse_atom(token)).collect();

    success(input, &display_text, class_name, creation_args)
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    fn code(input: &str) -> String {
        parse_object_spec_v01(input).diagnostics[0].code.clone()
    }

    #[test]
    fn parses_lexical_object_spec_without_resolving_runtime_kinds() {
        let raw = parse_object_spec_v01("+ 1");
        assert!(raw.ok);
        assert_eq!(raw.class_name, "+");
        assert_eq!(raw.display_text, "+ 1");
        assert_eq!(
            raw.creation_args,
            vec![ObjectSpecAtomV01::Int {
                value: 1,
                representation: Some("i32".to_owned())
            }]
        );
        assert_eq!(raw.resolved_kind, None);
        assert_eq!(raw.resolved_kind_version, None);
        assert!(raw.params.is_empty());
        assert!(raw.instance_ports.is_empty());

        let bracketed = parse_object_spec_v01("[osc~ 1e3]");
        assert!(bracketed.ok);
        assert_eq!(bracketed.class_name, "osc~");
        assert_eq!(bracketed.display_text, "osc~ 1e3");
        assert_eq!(
            bracketed.creation_args,
            vec![ObjectSpecAtomV01::Float {
                value: 1000.0,
                representation: Some("f32".to_owned())
            }]
        );
        assert_eq!(bracketed.resolved_kind, None);
    }

    #[test]
    fn reports_parser_failures_without_panicking() {
        assert_eq!(code("[+ 1"), "invalid-syntax");
        assert_eq!(code("+ 1]"), "invalid-syntax");
        assert_eq!(code(""), "empty-object-spec");
    }

    #[test]
    fn leaves_runtime_resolution_diagnostics_to_runtime() {
        for input in ["sin~", "square~", "expr $f1", "frobnicate", "adc~ 1"] {
            let result = parse_object_spec_v01(input);
            assert!(result.ok, "{input} should be a lexical parse");
            assert!(
                result.diagnostics.is_empty(),
                "{input} should not resolve in Contracts"
            );
            assert_eq!(result.resolved_kind, None);
        }
    }

    #[test]
    fn parses_atom_numeric_and_identifier_edges() {
        assert_eq!(
            parse_atom("+"),
            ObjectSpecAtomV01::Identifier {
                value: "+".to_owned()
            }
        );
        assert_eq!(
            parse_atom("xyz"),
            ObjectSpecAtomV01::Identifier {
                value: "xyz".to_owned()
            }
        );
        assert_eq!(
            parse_atom("1E3"),
            ObjectSpecAtomV01::Float {
                value: 1000.0,
                representation: Some("f32".to_owned())
            }
        );
        assert_eq!(
            parse_atom("false"),
            ObjectSpecAtomV01::Bool { value: false }
        );
    }

    #[test]
    fn serializes_all_public_object_spec_variants() {
        assert_eq!(
            serde_json::to_value(ObjectSpecAtomV01::Bool { value: false }).unwrap(),
            json!({ "type": "bool", "value": false })
        );
        assert_eq!(
            serde_json::to_value(ObjectSpecAtomV01::Identifier {
                value: "symbolic".to_owned()
            })
            .unwrap(),
            json!({ "type": "identifier", "value": "symbolic" })
        );

        let rates = [
            ObjectSpecPortRateV01::Event,
            ObjectSpecPortRateV01::Control,
            ObjectSpecPortRateV01::Audio,
            ObjectSpecPortRateV01::Render,
            ObjectSpecPortRateV01::Gpu,
            ObjectSpecPortRateV01::Resource,
            ObjectSpecPortRateV01::Io,
        ];
        assert_eq!(
            serde_json::to_value(rates).unwrap(),
            json!([
                "event", "control", "audio", "render", "gpu", "resource", "io"
            ])
        );

        let activations = [
            ObjectSpecPortActivationV01::Trigger,
            ObjectSpecPortActivationV01::Latched,
            ObjectSpecPortActivationV01::Passive,
        ];
        assert_eq!(
            serde_json::to_value(activations).unwrap(),
            json!(["trigger", "latched", "passive"])
        );

        let severities = [
            ObjectSpecDiagnosticSeverityV01::Error,
            ObjectSpecDiagnosticSeverityV01::Warning,
            ObjectSpecDiagnosticSeverityV01::Info,
        ];
        assert_eq!(
            serde_json::to_value(severities).unwrap(),
            json!(["error", "warning", "info"])
        );
    }
}
