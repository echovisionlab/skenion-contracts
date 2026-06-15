use std::{collections::HashMap, error::Error, fmt};

use super::{
    DataFlowV01, DataTypeV01, GraphDocumentV01, NodeDefinitionManifestV01, PortDirectionV01,
    PortV01,
};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ValidationErrorV01 {
    pub message: String,
}

impl ValidationErrorV01 {
    fn new(message: impl Into<String>) -> Self {
        Self {
            message: message.into(),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ValidationReportV01 {
    errors: Vec<ValidationErrorV01>,
}

impl ValidationReportV01 {
    fn new(errors: Vec<ValidationErrorV01>) -> Self {
        Self { errors }
    }

    pub fn errors(&self) -> &[ValidationErrorV01] {
        &self.errors
    }
}

impl fmt::Display for ValidationReportV01 {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let messages = self
            .errors
            .iter()
            .map(|error| error.message.as_str())
            .collect::<Vec<_>>()
            .join("; ");
        write!(f, "{messages}")
    }
}

impl Error for ValidationReportV01 {}

fn duplicate_errors<'a>(
    values: impl Iterator<Item = &'a str>,
    label: &str,
) -> Vec<ValidationErrorV01> {
    let mut counts: HashMap<&str, usize> = HashMap::new();
    let mut errors = Vec::new();

    for value in values {
        let count = counts.entry(value).or_default();
        *count += 1;
        if *count == 2 {
            errors.push(ValidationErrorV01::new(format!(
                "duplicate {label}: {value}"
            )));
        }
    }

    errors
}

fn validate_ports(owner_id: &str, ports: &[PortV01]) -> Vec<ValidationErrorV01> {
    let mut errors = duplicate_errors(
        ports.iter().map(|port| port.id.as_str()),
        &format!("port id on {owner_id}"),
    );

    for port in ports {
        if port.direction != PortDirectionV01::Input && port.activation.is_some() {
            errors.push(ValidationErrorV01::new(format!(
                "output port {owner_id}.{} must not declare activation",
                port.id
            )));
        }
    }

    errors
}

fn format_accepts(target_type: &DataTypeV01, source_type: &DataTypeV01) -> bool {
    let Some(target_format) = &target_type.format else {
        return true;
    };
    let Some(source_format) = &source_type.format else {
        return true;
    };

    let target_formats = target_format.values();
    source_format
        .values()
        .iter()
        .all(|format| target_formats.contains(format))
}

pub fn compatible_data_types_v01(source_type: &DataTypeV01, target_type: &DataTypeV01) -> bool {
    source_type.flow == target_type.flow
        && source_type.data_kind == target_type.data_kind
        && format_accepts(target_type, source_type)
}

pub fn type_label_v01(data_type: &DataTypeV01) -> String {
    let flow = match data_type.flow {
        DataFlowV01::Value => "value",
        DataFlowV01::Event => "event",
        DataFlowV01::Signal => "signal",
        DataFlowV01::Stream => "stream",
        DataFlowV01::Resource => "resource",
    };
    format!("{flow}<{}>", data_type.data_kind)
}

pub fn validate_node_definition_v01(
    definition: &NodeDefinitionManifestV01,
) -> Result<(), ValidationReportV01> {
    let mut errors = Vec::new();

    if definition.schema != "skenion.node.definition" {
        errors.push(ValidationErrorV01::new(format!(
            "expected schema skenion.node.definition, found {}",
            definition.schema
        )));
    }
    if definition.schema_version != "0.1.0" {
        errors.push(ValidationErrorV01::new(format!(
            "expected schemaVersion 0.1.0, found {}",
            definition.schema_version
        )));
    }

    errors.extend(validate_ports(&definition.id, &definition.ports));

    for permission in &definition.permissions {
        errors.push(ValidationErrorV01::new(format!(
            "unsupported permission: {permission}"
        )));
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(ValidationReportV01::new(errors))
    }
}

pub fn validate_graph_document_v01(graph: &GraphDocumentV01) -> Result<(), ValidationReportV01> {
    let mut errors = Vec::new();

    if graph.schema != "skenion.graph" {
        errors.push(ValidationErrorV01::new(format!(
            "expected schema skenion.graph, found {}",
            graph.schema
        )));
    }
    if graph.schema_version != "0.1.0" {
        errors.push(ValidationErrorV01::new(format!(
            "expected schemaVersion 0.1.0, found {}",
            graph.schema_version
        )));
    }

    errors.extend(duplicate_errors(
        graph.nodes.iter().map(|node| node.id.as_str()),
        "node id",
    ));

    let mut ports: HashMap<(&str, &str), &PortV01> = HashMap::new();
    for node in &graph.nodes {
        errors.extend(validate_ports(&node.id, &node.ports));
        for port in &node.ports {
            ports.insert((node.id.as_str(), port.id.as_str()), port);
        }
    }

    for edge in &graph.edges {
        let from_key = (edge.from.node.as_str(), edge.from.port.as_str());
        let to_key = (edge.to.node.as_str(), edge.to.port.as_str());
        let from = ports.get(&from_key);
        let to = ports.get(&to_key);

        if from.is_none() {
            errors.push(ValidationErrorV01::new(format!(
                "edge references missing source port {}:{}",
                edge.from.node, edge.from.port
            )));
        }
        if to.is_none() {
            errors.push(ValidationErrorV01::new(format!(
                "edge references missing target port {}:{}",
                edge.to.node, edge.to.port
            )));
        }

        let (Some(from), Some(to)) = (from, to) else {
            continue;
        };

        if from.direction != PortDirectionV01::Output {
            errors.push(ValidationErrorV01::new(format!(
                "edge source {}:{} is not an output port",
                edge.from.node, edge.from.port
            )));
        }
        if to.direction != PortDirectionV01::Input {
            errors.push(ValidationErrorV01::new(format!(
                "edge target {}:{} is not an input port",
                edge.to.node, edge.to.port
            )));
        }
        if !compatible_data_types_v01(&from.data_type, &to.data_type) {
            errors.push(ValidationErrorV01::new(format!(
                "incompatible edge {}:{} {} -> {}:{} {}",
                edge.from.node,
                edge.from.port,
                type_label_v01(&from.data_type),
                edge.to.node,
                edge.to.port,
                type_label_v01(&to.data_type)
            )));
        }
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(ValidationReportV01::new(errors))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::v0_1::{NumberRangeV01, StringOrStringsV01};

    fn node_definition(json: &str) -> NodeDefinitionManifestV01 {
        serde_json::from_str(json).expect("node definition fixture should parse")
    }

    fn graph_document(json: &str) -> GraphDocumentV01 {
        serde_json::from_str(json).expect("graph fixture should parse")
    }

    fn error_text(report: &ValidationReportV01) -> String {
        report.to_string()
    }

    fn value_type(data_kind: &str) -> DataTypeV01 {
        DataTypeV01 {
            flow: DataFlowV01::Value,
            data_kind: data_kind.to_owned(),
            unit: None,
            range: None,
            shape: None,
            channels: None,
            sample_rate: None,
            format: None,
            color_space: None,
            frame_rate: None,
            alpha_policy: None,
            values: None,
        }
    }

    #[test]
    fn exposes_report_errors_and_string_list_values() {
        let report = ValidationReportV01::new(vec![ValidationErrorV01::new("one")]);
        let formats = StringOrStringsV01::Many(vec!["rgba8".to_owned(), "bgra8".to_owned()]);

        assert_eq!(report.errors()[0].message, "one");
        assert_eq!(formats.values(), vec!["rgba8", "bgra8"]);
    }

    #[test]
    fn labels_all_data_flows_and_accepts_format_constraints() {
        for (flow, expected) in [
            (DataFlowV01::Value, "value<number.f32>"),
            (DataFlowV01::Event, "event<number.f32>"),
            (DataFlowV01::Signal, "signal<number.f32>"),
            (DataFlowV01::Stream, "stream<number.f32>"),
            (DataFlowV01::Resource, "resource<number.f32>"),
        ] {
            let mut data_type = value_type("number.f32");
            data_type.flow = flow;
            assert_eq!(type_label_v01(&data_type), expected);
        }

        let mut source = value_type("texture");
        let mut target = value_type("texture");
        target.format = Some(StringOrStringsV01::One("rgba8".to_owned()));
        assert!(compatible_data_types_v01(&source, &target));

        source.format = Some(StringOrStringsV01::Many(vec!["rgba8".to_owned()]));
        assert!(compatible_data_types_v01(&source, &target));

        source.range = Some(NumberRangeV01 {
            min: Some(0.0),
            max: Some(1.0),
            step: Some(0.1),
        });
        assert_eq!(
            source.range.as_ref().and_then(|range| range.step),
            Some(0.1)
        );
    }

    #[test]
    fn accepts_valid_script_node_manifest() {
        let definition = node_definition(
            r#"{
              "schema": "skenion.node.definition",
              "schemaVersion": "0.1.0",
              "id": "script.brightness",
              "version": "0.1.0",
              "displayName": "Brightness",
              "category": "Script",
              "scriptApiVersion": "0.1.0",
              "bundleHash": "sha256:0000",
              "ports": [
                {
                  "id": "enabled",
                  "direction": "input",
                  "type": { "flow": "value", "dataKind": "boolean" },
                  "activation": "latched",
                  "default": true
                },
                {
                  "id": "pulse",
                  "direction": "output",
                  "type": { "flow": "event", "dataKind": "bang" }
                }
              ],
              "execution": { "model": "script_control" },
              "state": { "persistent": true },
              "permissions": [],
              "capabilities": ["script.api.v0.1"]
            }"#,
        );

        validate_node_definition_v01(&definition).expect("manifest should be valid");
    }

    #[test]
    fn rejects_duplicate_ports() {
        let definition = node_definition(
            r#"{
              "schema": "skenion.node.definition",
              "schemaVersion": "0.1.0",
              "id": "script.dup",
              "version": "0.1.0",
              "displayName": "Duplicate",
              "category": "Script",
              "ports": [
                { "id": "value", "direction": "input", "type": { "flow": "value", "dataKind": "number.f32" } },
                { "id": "value", "direction": "output", "type": { "flow": "value", "dataKind": "number.f32" } }
              ],
              "execution": { "model": "script_control" },
              "state": { "persistent": false },
              "permissions": [],
              "capabilities": []
            }"#,
        );

        let error =
            validate_node_definition_v01(&definition).expect_err("duplicate port should fail");
        assert!(error_text(&error).contains("duplicate port id on script.dup"));
    }

    #[test]
    fn rejects_output_activation() {
        let definition = node_definition(
            r#"{
              "schema": "skenion.node.definition",
              "schemaVersion": "0.1.0",
              "id": "script.output_activation",
              "version": "0.1.0",
              "displayName": "Output Activation",
              "category": "Script",
              "ports": [
                {
                  "id": "pulse",
                  "direction": "output",
                  "type": { "flow": "event", "dataKind": "bang" },
                  "activation": "trigger"
                }
              ],
              "execution": { "model": "script_control" },
              "state": { "persistent": false },
              "permissions": [],
              "capabilities": []
            }"#,
        );

        let error =
            validate_node_definition_v01(&definition).expect_err("output activation should fail");
        assert!(error_text(&error).contains("must not declare activation"));
    }

    #[test]
    fn rejects_unsupported_permissions() {
        let definition = node_definition(
            r#"{
              "schema": "skenion.node.definition",
              "schemaVersion": "0.1.0",
              "id": "script.permission",
              "version": "0.1.0",
              "displayName": "Permission",
              "category": "Script",
              "ports": [],
              "execution": { "model": "script_control" },
              "state": { "persistent": false },
              "permissions": ["network"],
              "capabilities": []
            }"#,
        );

        let error = validate_node_definition_v01(&definition)
            .expect_err("permission should be unsupported");
        assert!(error_text(&error).contains("unsupported permission: network"));
    }

    #[test]
    fn rejects_node_definition_schema_mismatches() {
        let definition = node_definition(
            r#"{
              "schema": "wrong.node.definition",
              "schemaVersion": "9.9.9",
              "id": "script.schema",
              "version": "0.1.0",
              "displayName": "Schema",
              "category": "Script",
              "ports": [],
              "execution": { "model": "script_control" },
              "state": { "persistent": false },
              "permissions": [],
              "capabilities": []
            }"#,
        );

        let error =
            validate_node_definition_v01(&definition).expect_err("schema mismatch should fail");
        assert!(error_text(&error).contains("expected schema skenion.node.definition"));
        assert!(error_text(&error).contains("expected schemaVersion 0.1.0"));
    }

    #[test]
    fn accepts_valid_event_bang_graph() {
        let graph = graph_document(
            r#"{
              "schema": "skenion.graph",
              "schemaVersion": "0.1.0",
              "id": "bang-graph",
              "revision": "1",
              "nodes": [
                {
                  "id": "button",
                  "kind": "core.button",
                  "kindVersion": "0.1.0",
                  "params": {},
                  "ports": [
                    { "id": "out", "direction": "output", "type": { "flow": "event", "dataKind": "bang" } }
                  ]
                },
                {
                  "id": "target",
                  "kind": "core.target",
                  "kindVersion": "0.1.0",
                  "params": {},
                  "ports": [
                    { "id": "in", "direction": "input", "type": { "flow": "event", "dataKind": "bang" }, "activation": "trigger" }
                  ]
                }
              ],
              "edges": [
                { "from": { "node": "button", "port": "out" }, "to": { "node": "target", "port": "in" } }
              ]
            }"#,
        );

        validate_graph_document_v01(&graph).expect("graph should be valid");
    }

    #[test]
    fn rejects_graph_schema_mismatches() {
        let graph = graph_document(
            r#"{
              "schema": "wrong.graph",
              "schemaVersion": "9.9.9",
              "id": "schema",
              "revision": "1",
              "nodes": [],
              "edges": []
            }"#,
        );

        let error = validate_graph_document_v01(&graph).expect_err("schema mismatch should fail");
        assert!(error_text(&error).contains("expected schema skenion.graph"));
        assert!(error_text(&error).contains("expected schemaVersion 0.1.0"));
    }

    #[test]
    fn rejects_missing_source_and_non_input_target_edges() {
        let graph = graph_document(
            r#"{
              "schema": "skenion.graph",
              "schemaVersion": "0.1.0",
              "id": "edge-errors",
              "revision": "1",
              "nodes": [
                {
                  "id": "source",
                  "kind": "core.source",
                  "kindVersion": "0.1.0",
                  "params": {},
                  "ports": [
                    { "id": "out", "direction": "output", "type": { "flow": "value", "dataKind": "number.f32" } }
                  ]
                }
              ],
              "edges": [
                { "from": { "node": "source", "port": "missing" }, "to": { "node": "source", "port": "out" } },
                { "from": { "node": "source", "port": "out" }, "to": { "node": "source", "port": "out" } }
              ]
            }"#,
        );

        let error = validate_graph_document_v01(&graph).expect_err("edge errors should fail");
        assert!(error_text(&error).contains("edge references missing source port source:missing"));
        assert!(error_text(&error).contains("edge target source:out is not an input port"));
    }

    #[test]
    fn rejects_bool_to_bang_without_converter() {
        let graph = graph_document(
            r#"{
              "schema": "skenion.graph",
              "schemaVersion": "0.1.0",
              "id": "bool-to-bang",
              "revision": "1",
              "nodes": [
                {
                  "id": "toggle",
                  "kind": "core.toggle",
                  "kindVersion": "0.1.0",
                  "params": {},
                  "ports": [
                    { "id": "out", "direction": "output", "type": { "flow": "value", "dataKind": "boolean" } }
                  ]
                },
                {
                  "id": "target",
                  "kind": "core.target",
                  "kindVersion": "0.1.0",
                  "params": {},
                  "ports": [
                    { "id": "in", "direction": "input", "type": { "flow": "event", "dataKind": "bang" }, "activation": "trigger" }
                  ]
                }
              ],
              "edges": [
                { "from": { "node": "toggle", "port": "out" }, "to": { "node": "target", "port": "in" } }
              ]
            }"#,
        );

        let error = validate_graph_document_v01(&graph).expect_err("bool to bang should fail");
        assert!(error_text(&error).contains("value<boolean>"));
        assert!(error_text(&error).contains("event<bang>"));
    }
}
