use serde::{Deserialize, Serialize};
use serde_json::{Map, Value, json};
use thiserror::Error;

use super::types::MessageSelectorPolicyV01;

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
    pub accepts: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub activation: Option<ObjectTextPortActivationV01>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub default_value: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message_selectors: Option<MessageSelectorPolicyV01>,
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
    #[error("object text parse result semantic validation failed: {0}")]
    Semantic(String),
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
    let errors = object_text_parse_result_semantic_errors(result);
    if !errors.is_empty() {
        return Err(ObjectTextValidationErrorV01::Semantic(errors.join("; ")));
    }
    Ok(())
}

fn is_selector_aware_object_text_input_port(port: &ObjectTextPortV01) -> bool {
    port.direction == ObjectTextPortDirectionV01::Input
        && (port.port_type == "control.message.any"
            || port.accepts.as_ref().is_some_and(|accepted| {
                accepted.iter().any(|value| value == "control.message.any")
            }))
}

fn object_text_message_selector_policy_errors(
    port: &ObjectTextPortV01,
    label: &str,
) -> Vec<String> {
    let Some(policy) = &port.message_selectors else {
        return if is_selector_aware_object_text_input_port(port) {
            vec![format!(
                "{label} selector-aware input port requires messageSelectors"
            )]
        } else {
            Vec::new()
        };
    };

    let mut errors = Vec::new();
    if policy.accepted.is_empty() {
        errors.push(format!(
            "{label} messageSelectors.accepted must list at least one selector"
        ));
    }
    for (field, selectors) in [
        ("silent", &policy.silent),
        ("trigger", &policy.trigger),
        ("store", &policy.store),
        ("emit", &policy.emit),
    ] {
        for selector in selectors.iter().flat_map(|values| values.iter()) {
            if !policy.accepted.contains(selector) {
                errors.push(format!(
                    "{label} messageSelectors.{field} selector {selector} is not accepted"
                ));
            }
        }
    }
    if policy
        .trigger
        .as_ref()
        .is_some_and(|selectors| selectors.iter().any(|selector| selector == "set"))
    {
        errors.push(format!(
            "{label} messageSelectors.trigger must not include set"
        ));
    }
    if policy
        .emit
        .as_ref()
        .is_some_and(|selectors| selectors.iter().any(|selector| selector == "set"))
    {
        errors.push(format!(
            "{label} messageSelectors.emit must not include set"
        ));
    }
    if policy.accepted.iter().any(|selector| selector == "set")
        && !policy
            .silent
            .as_ref()
            .is_some_and(|selectors| selectors.iter().any(|selector| selector == "set"))
        && !policy
            .store
            .as_ref()
            .is_some_and(|selectors| selectors.iter().any(|selector| selector == "set"))
    {
        errors.push(format!(
            "{label} messageSelectors.set must be silent or store behavior"
        ));
    }

    errors
}

fn object_text_parse_result_semantic_errors(result: &ObjectTextParseResultV01) -> Vec<String> {
    result
        .instance_ports
        .iter()
        .flat_map(|port| {
            object_text_message_selector_policy_errors(
                port,
                &format!(
                    "objectText instancePort {}.{}",
                    result.class_symbol, port.id
                ),
            )
        })
        .collect()
}

fn diagnostic(code: &str, message: impl Into<String>) -> ObjectTextDiagnosticV01 {
    ObjectTextDiagnosticV01 {
        severity: ObjectTextDiagnosticSeverityV01::Error,
        code: code.to_owned(),
        message: message.into(),
    }
}

fn success(
    input: &str,
    display_text: &str,
    class_symbol: &str,
    creation_args: Vec<ObjectTextAtomV01>,
    resolved_kind: &str,
    params: Map<String, Value>,
    instance_ports: Vec<ObjectTextPortV01>,
) -> ObjectTextParseResultV01 {
    ObjectTextParseResultV01 {
        schema: "skenion.object-text.parse-result".to_owned(),
        schema_version: "0.1.0".to_owned(),
        input: input.to_owned(),
        ok: true,
        class_symbol: class_symbol.to_owned(),
        creation_args,
        resolved_kind: Some(resolved_kind.to_owned()),
        resolved_kind_version: Some("0.1.0".to_owned()),
        params,
        instance_ports,
        display_text: display_text.to_owned(),
        diagnostics: Vec::new(),
    }
}

fn failure(
    input: &str,
    display_text: &str,
    class_symbol: &str,
    creation_args: Vec<ObjectTextAtomV01>,
    code: &str,
    message: impl Into<String>,
) -> ObjectTextParseResultV01 {
    ObjectTextParseResultV01 {
        schema: "skenion.object-text.parse-result".to_owned(),
        schema_version: "0.1.0".to_owned(),
        input: input.to_owned(),
        ok: false,
        class_symbol: class_symbol.to_owned(),
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
                "object text brackets must be balanced".to_owned(),
            ));
        }
        return Ok(trimmed[1..trimmed.len() - 1].trim().to_owned());
    }
    Ok(trimmed.to_owned())
}

fn tokenize(display_text: &str) -> Vec<&str> {
    display_text.split_whitespace().collect()
}

fn parse_atom(token: &str) -> ObjectTextAtomV01 {
    let unsigned_token = token.strip_prefix(['+', '-']).unwrap_or(token);
    if !unsigned_token.is_empty() {
        let all_digits = unsigned_token
            .chars()
            .all(|character| character.is_ascii_digit());
        if all_digits {
            return ObjectTextAtomV01::Int {
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
            return ObjectTextAtomV01::Float {
                value,
                representation: Some("f32".to_owned()),
            };
        }
        _ => {}
    }

    if token == "true" || token == "false" {
        return ObjectTextAtomV01::Bool {
            value: token == "true",
        };
    }

    ObjectTextAtomV01::Symbol {
        value: token.to_owned(),
    }
}

fn numeric_value(atom: &ObjectTextAtomV01) -> Option<f64> {
    match atom {
        ObjectTextAtomV01::Float { value, .. } => Some(*value),
        ObjectTextAtomV01::Int { value, .. } => Some(*value as f64),
        ObjectTextAtomV01::Uint { value, .. } => Some(*value as f64),
        ObjectTextAtomV01::Bool { .. }
        | ObjectTextAtomV01::Symbol { .. }
        | ObjectTextAtomV01::String { .. } => None,
    }
}

fn numeric_json(value: f64) -> Value {
    if value.fract() == 0.0 {
        json!(value as i64)
    } else {
        json!(value)
    }
}

fn input_port(
    id: &str,
    port_type: &str,
    rate: ObjectTextPortRateV01,
    activation: ObjectTextPortActivationV01,
) -> ObjectTextPortV01 {
    ObjectTextPortV01 {
        id: id.to_owned(),
        direction: ObjectTextPortDirectionV01::Input,
        port_type: port_type.to_owned(),
        rate: Some(rate),
        accepts: None,
        activation: Some(activation),
        default_value: None,
        message_selectors: None,
        description: None,
    }
}

fn output_port(id: &str, port_type: &str, rate: ObjectTextPortRateV01) -> ObjectTextPortV01 {
    ObjectTextPortV01 {
        id: id.to_owned(),
        direction: ObjectTextPortDirectionV01::Output,
        port_type: port_type.to_owned(),
        rate: Some(rate),
        accepts: None,
        activation: None,
        default_value: None,
        message_selectors: None,
        description: None,
    }
}

fn numeric_trigger_message_selectors() -> MessageSelectorPolicyV01 {
    let selectors = ["bang", "float", "int", "uint", "bool"]
        .into_iter()
        .map(str::to_owned)
        .collect::<Vec<_>>();
    MessageSelectorPolicyV01 {
        accepted: selectors.clone(),
        silent: None,
        trigger: Some(selectors.clone()),
        store: None,
        emit: Some(selectors),
    }
}

fn control_ports(default_value: f64) -> Vec<ObjectTextPortV01> {
    let mut right = input_port(
        "right",
        "control.number.float",
        ObjectTextPortRateV01::Control,
        ObjectTextPortActivationV01::Latched,
    );
    right.default_value = Some(numeric_json(default_value));
    let mut hot = input_port(
        "in",
        "control.message.any",
        ObjectTextPortRateV01::Control,
        ObjectTextPortActivationV01::Trigger,
    );
    hot.message_selectors = Some(numeric_trigger_message_selectors());
    vec![
        hot,
        right,
        output_port(
            "out",
            "control.number.float",
            ObjectTextPortRateV01::Control,
        ),
    ]
}

fn control_sqrt_ports() -> Vec<ObjectTextPortV01> {
    let mut hot = input_port(
        "in",
        "control.message.any",
        ObjectTextPortRateV01::Control,
        ObjectTextPortActivationV01::Trigger,
    );
    hot.message_selectors = Some(numeric_trigger_message_selectors());
    vec![
        hot,
        output_port(
            "out",
            "control.number.float",
            ObjectTextPortRateV01::Control,
        ),
    ]
}

fn audio_binary_ports() -> Vec<ObjectTextPortV01> {
    vec![
        input_port(
            "left",
            "signal.audio",
            ObjectTextPortRateV01::Audio,
            ObjectTextPortActivationV01::Latched,
        ),
        input_port(
            "right",
            "signal.audio",
            ObjectTextPortRateV01::Audio,
            ObjectTextPortActivationV01::Latched,
        ),
        output_port("out", "signal.audio", ObjectTextPortRateV01::Audio),
    ]
}

fn audio_scalar_ports(default_value: f64) -> Vec<ObjectTextPortV01> {
    let mut right = input_port(
        "right",
        "control.number.float",
        ObjectTextPortRateV01::Control,
        ObjectTextPortActivationV01::Latched,
    );
    right.default_value = Some(numeric_json(default_value));
    vec![
        input_port(
            "in",
            "signal.audio",
            ObjectTextPortRateV01::Audio,
            ObjectTextPortActivationV01::Latched,
        ),
        right,
        output_port("out", "signal.audio", ObjectTextPortRateV01::Audio),
    ]
}

fn audio_unary_ports() -> Vec<ObjectTextPortV01> {
    vec![
        input_port(
            "in",
            "signal.audio",
            ObjectTextPortRateV01::Audio,
            ObjectTextPortActivationV01::Latched,
        ),
        output_port("out", "signal.audio", ObjectTextPortRateV01::Audio),
    ]
}

fn oscillator_ports(default_value: f64) -> Vec<ObjectTextPortV01> {
    let mut frequency = input_port(
        "frequency",
        "control.number.float",
        ObjectTextPortRateV01::Control,
        ObjectTextPortActivationV01::Latched,
    );
    frequency.default_value = Some(numeric_json(default_value));
    vec![
        frequency,
        output_port("out", "signal.audio", ObjectTextPortRateV01::Audio),
    ]
}

fn insert_param(params: &mut Map<String, Value>, key: &str, value: f64) {
    params.insert(key.to_owned(), numeric_json(value));
}

fn control_kind(class_symbol: &str) -> Option<&'static str> {
    match class_symbol {
        "+" => Some("core.operator.add"),
        "-" => Some("core.operator.sub"),
        "*" => Some("core.operator.mul"),
        "/" => Some("core.operator.div"),
        "pow" => Some("core.operator.pow"),
        "min" => Some("core.operator.min"),
        "max" => Some("core.operator.max"),
        _ => None,
    }
}

fn audio_kind(class_symbol: &str) -> Option<&'static str> {
    match class_symbol {
        "+~" => Some("audio.operator.add"),
        "-~" => Some("audio.operator.sub"),
        "*~" => Some("audio.operator.mul"),
        "/~" => Some("audio.operator.div"),
        _ => None,
    }
}

fn deferred_message(class_symbol: &str) -> Option<&'static str> {
    match class_symbol {
        "sin~" => Some("sin~ is deferred; use osc~, expr~ sin($v1), or a future skenion extension"),
        "square~" => Some(
            "square~ is deferred; use phasor~ plus comparison/expression logic, or a future skenion extension",
        ),
        "expr" => Some("expr is deferred until the expression layer contract is implemented"),
        "expr~" => Some("expr~ is deferred until the expression layer contract is implemented"),
        "fexpr~" => Some("fexpr~ is deferred until the expression layer contract is implemented"),
        _ => None,
    }
}

fn audio_output_ports() -> Vec<ObjectTextPortV01> {
    vec![
        input_port(
            "left",
            "signal.audio",
            ObjectTextPortRateV01::Audio,
            ObjectTextPortActivationV01::Latched,
        ),
        input_port(
            "right",
            "signal.audio",
            ObjectTextPortRateV01::Audio,
            ObjectTextPortActivationV01::Latched,
        ),
    ]
}

fn audio_input_ports() -> Vec<ObjectTextPortV01> {
    vec![
        output_port("left", "signal.audio", ObjectTextPortRateV01::Audio),
        output_port("right", "signal.audio", ObjectTextPortRateV01::Audio),
    ]
}

pub fn parse_object_text_v01(input: &str) -> ObjectTextParseResultV01 {
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
    let Some((class_symbol, arg_tokens)) = tokens.split_first() else {
        return failure(
            input,
            "<empty>",
            "<empty>",
            Vec::new(),
            "empty-object-text",
            "object text must contain a class symbol",
        );
    };
    let creation_args: Vec<ObjectTextAtomV01> =
        arg_tokens.iter().map(|token| parse_atom(token)).collect();

    if let Some(message) = deferred_message(class_symbol) {
        return failure(
            input,
            &display_text,
            class_symbol,
            creation_args,
            "deferred-object",
            message,
        );
    }

    if let Some(kind) = control_kind(class_symbol) {
        if creation_args.len() > 1 {
            return failure(
                input,
                &display_text,
                class_symbol,
                creation_args,
                "invalid-arg-count",
                format!("{class_symbol} accepts at most one creation argument"),
            );
        }
        let right = if let Some(arg) = creation_args.first() {
            if let Some(value) = numeric_value(arg) {
                value
            } else {
                return failure(
                    input,
                    &display_text,
                    class_symbol,
                    creation_args,
                    "invalid-arg-type",
                    format!("{class_symbol} creation argument must be numeric"),
                );
            }
        } else {
            0.0
        };
        let mut params = Map::new();
        insert_param(&mut params, "right", right);
        return success(
            input,
            &display_text,
            class_symbol,
            creation_args,
            kind,
            params,
            control_ports(right),
        );
    }

    if *class_symbol == "sqrt" {
        if !creation_args.is_empty() {
            return failure(
                input,
                &display_text,
                class_symbol,
                creation_args,
                "invalid-arg-count",
                "sqrt accepts no creation arguments",
            );
        }
        return success(
            input,
            &display_text,
            class_symbol,
            creation_args,
            "core.operator.sqrt",
            Map::new(),
            control_sqrt_ports(),
        );
    }

    if let Some(kind) = audio_kind(class_symbol) {
        if creation_args.len() > 1 {
            return failure(
                input,
                &display_text,
                class_symbol,
                creation_args,
                "invalid-arg-count",
                format!(
                    "{class_symbol} accepts at most one creation argument in the first DSP baseline"
                ),
            );
        }
        if creation_args.is_empty() {
            return success(
                input,
                &display_text,
                class_symbol,
                creation_args,
                kind,
                Map::new(),
                audio_binary_ports(),
            );
        }
        let right = if let Some(value) = numeric_value(&creation_args[0]) {
            value
        } else {
            return failure(
                input,
                &display_text,
                class_symbol,
                creation_args,
                "invalid-arg-type",
                format!("{class_symbol} creation argument must be numeric"),
            );
        };
        let mut params = Map::new();
        insert_param(&mut params, "right", right);
        return success(
            input,
            &display_text,
            class_symbol,
            creation_args,
            kind,
            params,
            audio_scalar_ports(right),
        );
    }

    if *class_symbol == "sqrt~" {
        if !creation_args.is_empty() {
            return failure(
                input,
                &display_text,
                class_symbol,
                creation_args,
                "invalid-arg-count",
                "sqrt~ accepts no creation arguments",
            );
        }
        return success(
            input,
            &display_text,
            class_symbol,
            creation_args,
            "audio.operator.sqrt",
            Map::new(),
            audio_unary_ports(),
        );
    }

    let oscillator_kind = match *class_symbol {
        "osc~" => Some("audio.osc"),
        "phasor~" => Some("audio.phasor"),
        _ => None,
    };
    if let Some(kind) = oscillator_kind {
        if creation_args.len() > 1 {
            return failure(
                input,
                &display_text,
                class_symbol,
                creation_args,
                "invalid-arg-count",
                format!("{class_symbol} accepts at most one creation argument"),
            );
        }
        let frequency = if let Some(arg) = creation_args.first() {
            if let Some(value) = numeric_value(arg) {
                value
            } else {
                return failure(
                    input,
                    &display_text,
                    class_symbol,
                    creation_args,
                    "invalid-arg-type",
                    format!("{class_symbol} frequency argument must be numeric"),
                );
            }
        } else {
            0.0
        };
        let mut params = Map::new();
        insert_param(&mut params, "frequency", frequency);
        return success(
            input,
            &display_text,
            class_symbol,
            creation_args,
            kind,
            params,
            oscillator_ports(frequency),
        );
    }

    if *class_symbol == "dac~" {
        if !creation_args.is_empty() {
            return failure(
                input,
                &display_text,
                class_symbol,
                creation_args,
                "invalid-arg-count",
                "dac~ accepts no creation arguments in the first audio backend contract",
            );
        }
        return success(
            input,
            &display_text,
            class_symbol,
            creation_args,
            "audio.output",
            Map::new(),
            audio_output_ports(),
        );
    }

    if *class_symbol == "adc~" {
        if !creation_args.is_empty() {
            return failure(
                input,
                &display_text,
                class_symbol,
                creation_args,
                "invalid-arg-count",
                "adc~ accepts no creation arguments in the first audio endpoint contract",
            );
        }
        return success(
            input,
            &display_text,
            class_symbol,
            creation_args,
            "audio.input",
            Map::new(),
            audio_input_ports(),
        );
    }

    failure(
        input,
        &display_text,
        class_symbol,
        creation_args,
        "unsupported-class",
        format!("unsupported object class: {class_symbol}"),
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    fn code(input: &str) -> String {
        parse_object_text_v01(input).diagnostics[0].code.clone()
    }

    #[test]
    fn parses_raw_and_operator_variants() {
        assert_eq!(
            parse_object_text_v01("+ 1").resolved_kind.as_deref(),
            Some("core.operator.add")
        );
        assert_eq!(
            parse_object_text_v01("[+ 1]").resolved_kind.as_deref(),
            Some("core.operator.add")
        );
        assert_eq!(
            parse_object_text_v01("+").params.get("right"),
            Some(&json!(0))
        );
        assert_eq!(
            parse_object_text_v01("- 2").resolved_kind.as_deref(),
            Some("core.operator.sub")
        );
        assert_eq!(
            parse_object_text_v01("* 0.5").resolved_kind.as_deref(),
            Some("core.operator.mul")
        );
        assert_eq!(
            parse_object_text_v01("/ 0.5").resolved_kind.as_deref(),
            Some("core.operator.div")
        );
        assert_eq!(
            parse_object_text_v01("+ 1e3").params.get("right"),
            Some(&json!(1000))
        );
        assert_eq!(
            parse_object_text_v01("pow 2").resolved_kind.as_deref(),
            Some("core.operator.pow")
        );
        assert_eq!(
            parse_object_text_v01("min 2").resolved_kind.as_deref(),
            Some("core.operator.min")
        );
        assert_eq!(
            parse_object_text_v01("max 2").resolved_kind.as_deref(),
            Some("core.operator.max")
        );
        assert_eq!(
            parse_object_text_v01("sqrt").resolved_kind.as_deref(),
            Some("core.operator.sqrt")
        );
        assert_eq!(
            parse_object_text_v01("-~ 0.25").resolved_kind.as_deref(),
            Some("audio.operator.sub")
        );
        assert_eq!(
            parse_object_text_v01("+~").resolved_kind.as_deref(),
            Some("audio.operator.add")
        );
        assert_eq!(
            parse_object_text_v01("*~ 0.5").resolved_kind.as_deref(),
            Some("audio.operator.mul")
        );
        assert_eq!(
            parse_object_text_v01("/~ 0.5").resolved_kind.as_deref(),
            Some("audio.operator.div")
        );
        assert_eq!(
            parse_object_text_v01("sqrt~").resolved_kind.as_deref(),
            Some("audio.operator.sqrt")
        );
        assert_eq!(
            parse_object_text_v01("osc~").params.get("frequency"),
            Some(&json!(0))
        );
        assert_eq!(
            parse_object_text_v01("osc~ 440").params.get("frequency"),
            Some(&json!(440))
        );
        assert_eq!(
            parse_object_text_v01("phasor~").params.get("frequency"),
            Some(&json!(0))
        );
        assert_eq!(
            parse_object_text_v01("phasor~ 1").params.get("frequency"),
            Some(&json!(1))
        );
        assert_eq!(
            parse_object_text_v01("adc~").resolved_kind.as_deref(),
            Some("audio.input")
        );
        assert_eq!(
            parse_object_text_v01("dac~").resolved_kind.as_deref(),
            Some("audio.output")
        );
    }

    #[test]
    fn reports_parser_failures_without_panicking() {
        assert_eq!(code("[+ 1"), "invalid-syntax");
        assert_eq!(code("+ 1]"), "invalid-syntax");
        assert_eq!(code(""), "empty-object-text");
        assert_eq!(code("+ 1 2"), "invalid-arg-count");
        assert_eq!(code("+ true"), "invalid-arg-type");
        assert_eq!(code("+ false"), "invalid-arg-type");
        assert_eq!(code("+ 1.bad"), "invalid-arg-type");
        assert_eq!(code("+ 1e309"), "invalid-arg-type");
        assert_eq!(code("*~ 1 2"), "invalid-arg-count");
        assert_eq!(code("sqrt 1"), "invalid-arg-count");
        assert_eq!(code("*~ beep"), "invalid-arg-type");
        assert_eq!(code("/~ false"), "invalid-arg-type");
        assert_eq!(code("sqrt~ 1"), "invalid-arg-count");
        assert_eq!(code("osc~ 1 2"), "invalid-arg-count");
        assert_eq!(code("osc~ false"), "invalid-arg-type");
        assert_eq!(code("phasor~ beep"), "invalid-arg-type");
        assert_eq!(code("dac~ 1"), "invalid-arg-count");
        assert_eq!(code("frobnicate"), "unsupported-class");
    }

    #[test]
    fn reports_deferred_objects_explicitly() {
        assert_eq!(code("sin~"), "deferred-object");
        assert_eq!(code("square~"), "deferred-object");
        assert_eq!(code("expr"), "deferred-object");
        assert_eq!(code("expr~"), "deferred-object");
        assert_eq!(code("fexpr~"), "deferred-object");
        assert_eq!(code("adc~ 1"), "invalid-arg-count");
    }

    #[test]
    fn recognizes_uint_as_numeric_for_contract_completeness() {
        assert_eq!(
            numeric_value(&ObjectTextAtomV01::Uint {
                value: 7,
                representation: Some("u32".to_owned())
            }),
            Some(7.0)
        );
        assert_eq!(
            numeric_value(&ObjectTextAtomV01::String {
                value: "not-number".to_owned()
            }),
            None
        );
    }

    #[test]
    fn parses_atom_numeric_and_symbol_edges() {
        assert_eq!(
            parse_atom("+"),
            ObjectTextAtomV01::Symbol {
                value: "+".to_owned()
            }
        );
        assert_eq!(
            parse_atom("xyz"),
            ObjectTextAtomV01::Symbol {
                value: "xyz".to_owned()
            }
        );
        assert_eq!(
            parse_atom("1E3"),
            ObjectTextAtomV01::Float {
                value: 1000.0,
                representation: Some("f32".to_owned())
            }
        );
        assert_eq!(
            parse_atom("false"),
            ObjectTextAtomV01::Bool { value: false }
        );
    }

    #[test]
    fn serializes_all_public_object_text_variants() {
        assert_eq!(
            serde_json::to_value(ObjectTextAtomV01::Bool { value: false }).unwrap(),
            json!({ "type": "bool", "value": false })
        );
        assert_eq!(
            serde_json::to_value(ObjectTextAtomV01::Symbol {
                value: "symbolic".to_owned()
            })
            .unwrap(),
            json!({ "type": "symbol", "value": "symbolic" })
        );

        let rates = [
            ObjectTextPortRateV01::Event,
            ObjectTextPortRateV01::Control,
            ObjectTextPortRateV01::Audio,
            ObjectTextPortRateV01::Render,
            ObjectTextPortRateV01::Gpu,
            ObjectTextPortRateV01::Resource,
            ObjectTextPortRateV01::Io,
        ];
        assert_eq!(
            serde_json::to_value(rates).unwrap(),
            json!([
                "event", "control", "audio", "render", "gpu", "resource", "io"
            ])
        );

        let activations = [
            ObjectTextPortActivationV01::Trigger,
            ObjectTextPortActivationV01::Latched,
            ObjectTextPortActivationV01::Passive,
        ];
        assert_eq!(
            serde_json::to_value(activations).unwrap(),
            json!(["trigger", "latched", "passive"])
        );

        let severities = [
            ObjectTextDiagnosticSeverityV01::Error,
            ObjectTextDiagnosticSeverityV01::Warning,
            ObjectTextDiagnosticSeverityV01::Info,
        ];
        assert_eq!(
            serde_json::to_value(severities).unwrap(),
            json!(["error", "warning", "info"])
        );
    }
}
