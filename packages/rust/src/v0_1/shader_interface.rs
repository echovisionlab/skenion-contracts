use serde::{Deserialize, Serialize};
use serde_json::{Number, Value};

use super::{
    DataFlowV01, DataTypeV01, NumberRangeV01, PortActivationV01, PortDirectionV01, PortV01,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum ShaderLanguageV01 {
    Wgsl,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ShaderUniformV01 {
    pub id: String,
    pub label: String,
    #[serde(rename = "type")]
    pub data_type: DataTypeV01,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub default: Option<Value>,
    pub required: bool,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ShaderInterfaceV01 {
    pub schema: String,
    pub schema_version: String,
    pub language: ShaderLanguageV01,
    pub uniforms: Vec<ShaderUniformV01>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum ShaderDiagnosticSeverityV01 {
    Error,
    Warning,
    Info,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum ShaderDiagnosticPhaseV01 {
    InterfaceAnalysis,
    SourceSync,
    WgslGeneration,
    WgslCompile,
    RenderPipeline,
    RenderFrame,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum ShaderDiagnosticSourceV01 {
    User,
    Generated,
    Runtime,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ShaderDiagnosticV01 {
    pub severity: ShaderDiagnosticSeverityV01,
    pub phase: ShaderDiagnosticPhaseV01,
    pub code: String,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub line: Option<usize>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub column: Option<usize>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub end_line: Option<usize>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub end_column: Option<usize>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub uniform_id: Option<String>,
    pub source: ShaderDiagnosticSourceV01,
}

pub type ShaderInterfaceDiagnosticSeverityV01 = ShaderDiagnosticSeverityV01;
pub type ShaderInterfaceDiagnosticV01 = ShaderDiagnosticV01;

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GeneratedShaderSourceMapV01 {
    pub user_source_start_line: usize,
    pub generated_line_offset: usize,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ShaderInterfaceAnalysisV01 {
    pub ok: bool,
    pub shader_interface: ShaderInterfaceV01,
    pub diagnostics: Vec<ShaderInterfaceDiagnosticV01>,
}

pub fn analyze_shader_interface_v01(source: &str) -> ShaderInterfaceAnalysisV01 {
    let mut diagnostics = Vec::new();
    let mut uniforms = Vec::new();
    let mut ids = std::collections::BTreeSet::new();

    for (line_index, line) in source.lines().enumerate() {
        let Some(rest) = annotation_payload(line) else {
            if line.trim_start().starts_with("//")
                && let Some(column) = line.find("@skenion.uniform").map(|index| index + 1)
            {
                diagnostics.push(diagnostic(
                    "malformed-annotation",
                    "malformed @skenion.uniform annotation",
                    Some(line_index + 1),
                    Some(column),
                    None,
                ));
            }
            continue;
        };
        let line_number = line_index + 1;
        let mut parts = rest
            .splitn(3, char::is_whitespace)
            .filter(|part| !part.is_empty());
        let Some(id) = parts.next() else {
            diagnostics.push(diagnostic(
                "malformed-annotation",
                "malformed @skenion.uniform annotation",
                Some(line_number),
                line.find("@skenion.uniform").map(|index| index + 1),
                None,
            ));
            continue;
        };
        let id_column = line.find(id).map(|index| index + 1);
        let Some(raw_type) = parts.next() else {
            diagnostics.push(diagnostic(
                "missing-uniform-type",
                format!("missing uniform type for {id}"),
                Some(line_number),
                id_column,
                Some(id),
            ));
            continue;
        };
        let attributes = parse_attributes(parts.next().unwrap_or_default());

        if !valid_port_id(id) {
            diagnostics.push(diagnostic(
                "invalid-uniform-id",
                format!("invalid uniform id: {id}"),
                Some(line_number),
                id_column,
                Some(id),
            ));
            continue;
        }
        if ["out", "in", "set", "bang", "value"].contains(&id) {
            diagnostics.push(diagnostic(
                "reserved-uniform-id",
                format!("reserved uniform id: {id}"),
                Some(line_number),
                id_column,
                Some(id),
            ));
            continue;
        }
        if !ids.insert(id.to_owned()) {
            diagnostics.push(diagnostic(
                "duplicate-uniform-id",
                format!("duplicate uniform id: {id}"),
                Some(line_number),
                id_column,
                Some(id),
            ));
            continue;
        }

        if !matches!(
            raw_type,
            "value.core.float32"
                | "value.core.int32"
                | "value.core.uint32"
                | "value.core.bool"
                | "value.core.color"
        ) {
            diagnostics.push(diagnostic(
                "unsupported-uniform-type",
                format!("unsupported uniform type: {raw_type}"),
                Some(line_number),
                id_column,
                Some(id),
            ));
            continue;
        }

        diagnostics.extend(range_diagnostics(&attributes, line, line_number, id));
        let mut uniform = ShaderUniformV01 {
            id: id.to_owned(),
            label: attributes
                .get("label")
                .map_or_else(|| default_label(id), |value| string_attribute(value)),
            data_type: data_type_for(raw_type, &attributes),
            default: None,
            required: false,
        };
        if let Some(default) = attributes.get("default") {
            match parse_default(raw_type, default) {
                Ok(value) => uniform.default = Some(value),
                Err(message) => diagnostics.push(diagnostic(
                    "invalid-default",
                    message,
                    Some(line_number),
                    attribute_column(line, "default").or(id_column),
                    Some(id),
                )),
            }
        }
        uniforms.push(uniform);
    }

    ShaderInterfaceAnalysisV01 {
        ok: diagnostics
            .iter()
            .all(|diagnostic| diagnostic.severity != ShaderDiagnosticSeverityV01::Error),
        shader_interface: ShaderInterfaceV01 {
            schema: "skenion.shader.interface".to_owned(),
            schema_version: "0.1.0".to_owned(),
            language: ShaderLanguageV01::Wgsl,
            uniforms,
        },
        diagnostics,
    }
}

pub fn shader_interface_to_ports_v01(shader_interface: &ShaderInterfaceV01) -> Vec<PortV01> {
    let mut ports = shader_interface
        .uniforms
        .iter()
        .map(|uniform| PortV01 {
            id: uniform.id.clone(),
            direction: PortDirectionV01::Input,
            label: Some(uniform.label.clone()),
            data_type: uniform.data_type.clone(),
            required: Some(uniform.required),
            default_value: uniform.default.clone(),
            activation: Some(PortActivationV01::Latched),
        })
        .collect::<Vec<_>>();
    ports.push(PortV01 {
        id: "out".to_owned(),
        direction: PortDirectionV01::Output,
        label: Some("Out".to_owned()),
        data_type: DataTypeV01 {
            flow: DataFlowV01::Resource,
            data_kind: "value.core.tensor".to_owned(),
            unit: None,
            range: None,
            shape: None,
            channels: None,
            sample_rate: None,
            format: Some(super::StringOrStringsV01::One("rgba8unorm".to_owned())),
            color_space: Some("srgb".to_owned()),
            frame_rate: None,
            alpha_policy: None,
            values: None,
        },
        required: None,
        default_value: None,
        activation: None,
    });
    ports
}

fn annotation_payload(line: &str) -> Option<&str> {
    let trimmed = line.trim_start();
    let comment = trimmed.strip_prefix("//")?.trim_start();
    Some(comment.strip_prefix("@skenion.uniform")?.trim())
}

fn valid_port_id(value: &str) -> bool {
    let mut chars = value.chars();
    let Some(first) = chars.next() else {
        return false;
    };
    (first == '_' || first.is_ascii_alphabetic())
        && chars.all(|character| character == '_' || character.is_ascii_alphanumeric())
}

fn parse_attributes(value: &str) -> std::collections::BTreeMap<String, String> {
    let mut attributes = std::collections::BTreeMap::new();
    let bytes = value.as_bytes();
    let mut index = 0;
    while index < bytes.len() {
        while index < bytes.len() && bytes[index].is_ascii_whitespace() {
            index += 1;
        }
        let key_start = index;
        while index < bytes.len() && (bytes[index].is_ascii_alphanumeric() || bytes[index] == b'_')
        {
            index += 1;
        }
        if key_start == index || index >= bytes.len() || bytes[index] != b'=' {
            index += 1;
            continue;
        }
        let key = &value[key_start..index];
        index += 1;
        let value_start = index;
        if index < bytes.len() && bytes[index] == b'"' {
            index += 1;
            while index < bytes.len() {
                if bytes[index] == b'\\' {
                    index += 2;
                    continue;
                }
                if bytes[index] == b'"' {
                    index += 1;
                    break;
                }
                index += 1;
            }
        } else if index < bytes.len() && bytes[index] == b'[' {
            index += 1;
            while index < bytes.len() && bytes[index] != b']' {
                index += 1;
            }
            if index < bytes.len() {
                index += 1;
            }
        } else {
            while index < bytes.len() && !bytes[index].is_ascii_whitespace() {
                index += 1;
            }
        }
        attributes.insert(key.to_owned(), value[value_start..index].to_owned());
    }
    attributes
}

fn data_type_for(
    data_kind: &str,
    attributes: &std::collections::BTreeMap<String, String>,
) -> DataTypeV01 {
    let range = NumberRangeV01 {
        min: number_attribute(attributes, "min"),
        max: number_attribute(attributes, "max"),
        step: number_attribute(attributes, "step").filter(|value| *value > 0.0),
    };
    let (format, color_space) = match data_kind {
        "value.core.float32" => (Some(super::StringOrStringsV01::One("f32".to_owned())), None),
        "value.core.int32" => (Some(super::StringOrStringsV01::One("i32".to_owned())), None),
        "value.core.uint32" => (Some(super::StringOrStringsV01::One("u32".to_owned())), None),
        "value.core.color" => (
            Some(super::StringOrStringsV01::One("rgba32f".to_owned())),
            Some("linear".to_owned()),
        ),
        _ => (None, None),
    };
    DataTypeV01 {
        flow: DataFlowV01::Control,
        data_kind: data_kind.to_owned(),
        unit: None,
        range: (range.min.is_some() || range.max.is_some() || range.step.is_some())
            .then_some(range),
        shape: None,
        channels: None,
        sample_rate: None,
        format,
        color_space,
        frame_rate: None,
        alpha_policy: None,
        values: None,
    }
}

fn number_attribute(
    attributes: &std::collections::BTreeMap<String, String>,
    key: &str,
) -> Option<f64> {
    attributes
        .get(key)?
        .parse::<f64>()
        .ok()
        .filter(|value| value.is_finite())
}

fn range_diagnostics(
    attributes: &std::collections::BTreeMap<String, String>,
    line: &str,
    line_number: usize,
    uniform_id: &str,
) -> Vec<ShaderInterfaceDiagnosticV01> {
    let mut diagnostics = Vec::new();
    for key in ["min", "max"] {
        if let Some(raw_value) = attributes.get(key)
            && raw_value
                .parse::<f64>()
                .ok()
                .is_none_or(|value| !value.is_finite())
        {
            diagnostics.push(diagnostic(
                "invalid-number-range",
                format!("invalid {key} range value: {raw_value}"),
                Some(line_number),
                attribute_column(line, key),
                Some(uniform_id),
            ));
        }
    }

    if let Some(raw_value) = attributes.get("step")
        && raw_value
            .parse::<f64>()
            .ok()
            .is_none_or(|value| !value.is_finite() || value <= 0.0)
    {
        diagnostics.push(diagnostic(
            "invalid-number-range",
            format!("invalid step range value: {raw_value}"),
            Some(line_number),
            attribute_column(line, "step"),
            Some(uniform_id),
        ));
    }
    diagnostics
}

fn attribute_column(line: &str, key: &str) -> Option<usize> {
    line.find(&format!("{key}=")).map(|index| index + 1)
}

fn parse_default(data_kind: &str, value: &str) -> Result<Value, String> {
    match data_kind {
        "value.core.float32" => value
            .parse::<f64>()
            .ok()
            .filter(|value| value.is_finite())
            .and_then(Number::from_f64)
            .map(Value::Number)
            .ok_or_else(|| format!("invalid value.core.float32 default: {value}")),
        "value.core.int32" => value
            .parse::<i64>()
            .map(|value| Value::Number(Number::from(value)))
            .map_err(|_| format!("invalid value.core.int32 default: {value}")),
        "value.core.uint32" => value
            .parse::<u64>()
            .map(|value| Value::Number(Number::from(value)))
            .map_err(|_| format!("invalid value.core.uint32 default: {value}")),
        "value.core.bool" => match value {
            "true" => Ok(Value::Bool(true)),
            "false" => Ok(Value::Bool(false)),
            _ => Err(format!("invalid value.core.bool default: {value}")),
        },
        "value.core.color" => serde_json::from_str::<Value>(value)
            .ok()
            .filter(|parsed| {
                parsed.as_array().is_some_and(|items| {
                    items.len() == 4
                        && items
                            .iter()
                            .all(|item| item.as_f64().is_some_and(f64::is_finite))
                })
            })
            .ok_or_else(|| format!("invalid color default: {value}")),
        _ => Err(format!("unsupported uniform type: {data_kind}")),
    }
}

fn string_attribute(value: &str) -> String {
    value
        .strip_prefix('"')
        .and_then(|value| value.strip_suffix('"'))
        .map_or_else(|| value.to_owned(), |value| value.replace("\\\"", "\""))
}

fn default_label(id: &str) -> String {
    let mut label = String::new();
    let mut previous_lower = false;
    for character in id.chars() {
        if character == '_' {
            label.push(' ');
            previous_lower = false;
        } else {
            if previous_lower && character.is_ascii_uppercase() {
                label.push(' ');
            }
            label.push(character);
            previous_lower = character.is_ascii_lowercase();
        }
    }
    let mut chars = label.chars();
    let Some(first) = chars.next() else {
        return label;
    };
    format!("{}{}", first.to_ascii_uppercase(), chars.as_str())
}

fn diagnostic(
    code: &str,
    message: impl Into<String>,
    line: Option<usize>,
    column: Option<usize>,
    uniform_id: Option<&str>,
) -> ShaderInterfaceDiagnosticV01 {
    ShaderInterfaceDiagnosticV01 {
        severity: ShaderDiagnosticSeverityV01::Error,
        phase: ShaderDiagnosticPhaseV01::InterfaceAnalysis,
        code: code.to_owned(),
        message: message.into(),
        line,
        column,
        end_line: None,
        end_column: None,
        uniform_id: uniform_id.map(ToOwned::to_owned),
        source: ShaderDiagnosticSourceV01::User,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn analyzes_annotations_and_generates_ports() {
        let source = r#"
// @skenion.uniform speed value.core.float32 default=0.5 min=0 max=2 step=0.01 label="Speed Amount"
// @skenion.uniform enabled value.core.bool default=false
// @skenion.uniform iterations value.core.int32 default=8
// @skenion.uniform seed value.core.uint32 default=12
// @skenion.uniform tint value.core.color default=[1,0.2,0.1,1]
"#;
        let analysis = analyze_shader_interface_v01(source);

        assert!(analysis.ok);
        assert_eq!(analysis.shader_interface.uniforms.len(), 5);
        assert_eq!(analysis.shader_interface.uniforms[0].id, "speed");
        assert_eq!(analysis.shader_interface.uniforms[0].label, "Speed Amount");
        assert_eq!(
            analysis.shader_interface.uniforms[0].data_type.data_kind,
            "value.core.float32"
        );
        assert_eq!(
            analysis.shader_interface.uniforms[0].default,
            Some(Value::from(0.5))
        );
        assert_eq!(
            analysis.shader_interface.uniforms[1].default,
            Some(Value::from(false))
        );
        assert_eq!(
            analysis.shader_interface.uniforms[3].default,
            Some(Value::from(12_u64))
        );

        let ports = shader_interface_to_ports_v01(&analysis.shader_interface);
        assert_eq!(
            ports
                .iter()
                .map(|port| port.id.as_str())
                .collect::<Vec<_>>(),
            vec!["speed", "enabled", "iterations", "seed", "tint", "out"]
        );
        assert_eq!(ports[0].activation, Some(PortActivationV01::Latched));
        assert_eq!(ports[5].direction, PortDirectionV01::Output);
        assert_eq!(ports[5].data_type.data_kind, "value.core.tensor");
    }

    #[test]
    fn handles_annotation_attribute_grammar() {
        let source = r#"
// @skenion.uniform shaderSpeed_value value.core.float32 label="Shader \"Speed\"" junk default=0.25 min=-1 max=1 step=0.5
// @skenion.uniform phase value.core.float32 label=Phase stray
// @skenion.uniform ready value.core.bool default=true
"#;
        let analysis = analyze_shader_interface_v01(source);

        assert!(analysis.ok);
        assert_eq!(
            analysis.shader_interface.uniforms[0].label,
            "Shader \"Speed\""
        );
        assert_eq!(
            analysis.shader_interface.uniforms[0]
                .data_type
                .range
                .as_ref()
                .and_then(|range| range.min),
            Some(-1.0)
        );
        assert_eq!(
            analysis.shader_interface.uniforms[0]
                .data_type
                .range
                .as_ref()
                .and_then(|range| range.step),
            Some(0.5)
        );
        assert_eq!(analysis.shader_interface.uniforms[1].label, "Phase");
        assert_eq!(
            analysis.shader_interface.uniforms[2].default,
            Some(Value::from(true))
        );

        let attributes = parse_attributes("bad label=\"A \\\"B\\\"\" list=[1,2,3,4] empty=");
        assert_eq!(
            attributes.get("label").map(String::as_str),
            Some("\"A \\\"B\\\"\"")
        );
        assert_eq!(
            attributes.get("list").map(String::as_str),
            Some("[1,2,3,4]")
        );
        assert_eq!(attributes.get("empty").map(String::as_str), Some(""));
        assert_eq!(default_label("shaderSpeed_value"), "Shader Speed value");
        assert_eq!(default_label(""), "");
        assert!(!valid_port_id(""));
        assert_eq!(
            parse_default("unsupported", "1").expect_err("type should be rejected"),
            "unsupported uniform type: unsupported"
        );
    }

    #[test]
    fn reports_invalid_annotations() {
        let source = r#"
// ordinary shader comment
// malformed @skenion.uniform marker
// @skenion.uniform
// @skenion.uniform only_id
// @skenion.uniform 1bad value.core.float32
// @skenion.uniform out value.core.float32
// @skenion.uniform speed vec3
// @skenion.uniform speed value.core.float32
// @skenion.uniform broken value.core.float32 default=nope
// @skenion.uniform flag value.core.bool default=maybe
// @skenion.uniform count value.core.int32 default=1.2
// @skenion.uniform seed value.core.uint32 default=-1
// @skenion.uniform tint value.core.color default=nope
// @skenion.uniform bad_tint value.core.color default=[1,2,3,"x"]
// @skenion.uniform ranged value.core.float32 min=nope max=Infinity step=-1
"#;
        let analysis = analyze_shader_interface_v01(source);

        assert!(!analysis.ok);
        assert_eq!(
            analysis
                .diagnostics
                .iter()
                .map(|diagnostic| diagnostic.code.as_str())
                .collect::<Vec<_>>(),
            vec![
                "malformed-annotation",
                "malformed-annotation",
                "missing-uniform-type",
                "invalid-uniform-id",
                "reserved-uniform-id",
                "unsupported-uniform-type",
                "duplicate-uniform-id",
                "invalid-default",
                "invalid-default",
                "invalid-default",
                "invalid-default",
                "invalid-default",
                "invalid-default",
                "invalid-number-range",
                "invalid-number-range",
                "invalid-number-range"
            ]
        );
        assert_eq!(
            analysis.diagnostics[0].phase,
            ShaderDiagnosticPhaseV01::InterfaceAnalysis
        );
        assert_eq!(
            analysis.diagnostics[0].source,
            ShaderDiagnosticSourceV01::User
        );
        assert_eq!(analysis.diagnostics[0].line, Some(3));
        assert!(analysis.diagnostics[0].column.is_some());
    }
}
