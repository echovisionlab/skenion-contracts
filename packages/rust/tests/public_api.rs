use skenion_contracts::{
    DataFlowV01, DataTypeV01, GraphDocumentV01, NodeDefinitionManifestV01, StringOrStringsV01,
    compatible_data_types_v01, type_label_v01, validate_graph_document_v01,
    validate_node_definition_v01,
};

fn data_type(flow: DataFlowV01, data_kind: &str) -> DataTypeV01 {
    DataTypeV01 {
        flow,
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
fn reports_public_validation_errors() {
    let definition: NodeDefinitionManifestV01 = serde_json::from_str(
        r#"{
          "schema": "wrong.node.definition",
          "schemaVersion": "9.9.9",
          "id": "script.bad",
          "version": "0.1.0",
          "displayName": "Bad",
          "category": "Script",
          "ports": [
            { "id": "out", "direction": "output", "type": { "flow": "event", "dataKind": "bang" }, "activation": "trigger" }
          ],
          "execution": { "model": "script_control" },
          "state": { "persistent": false },
          "permissions": ["network"],
          "capabilities": []
        }"#,
    )
    .expect("definition should parse");

    let error = validate_node_definition_v01(&definition).expect_err("definition should fail");
    assert!(error.errors().len() >= 4);
    assert!(error.to_string().contains("wrong.node.definition"));
}

#[test]
fn validates_public_type_helpers() {
    let mut source = data_type(DataFlowV01::Signal, "number.f32");
    let mut target = data_type(DataFlowV01::Signal, "number.f32");

    assert_eq!(type_label_v01(&source), "signal<number.f32>");
    target.format = Some(StringOrStringsV01::One("f32".to_owned()));
    assert!(compatible_data_types_v01(&source, &target));
    source.format = Some(StringOrStringsV01::One("f64".to_owned()));
    assert!(!compatible_data_types_v01(&source, &target));
}

#[test]
fn reports_public_graph_semantic_errors() {
    let graph: GraphDocumentV01 = serde_json::from_str(
        r#"{
          "schema": "wrong.graph",
          "schemaVersion": "9.9.9",
          "id": "bad-graph",
          "revision": "1",
          "nodes": [
            {
              "id": "node",
              "kind": "core.node",
              "kindVersion": "0.1.0",
              "params": {},
              "ports": [
                { "id": "out", "direction": "output", "type": { "flow": "value", "dataKind": "number.f32" }, "activation": "trigger" }
              ]
            },
            {
              "id": "node",
              "kind": "core.node",
              "kindVersion": "0.1.0",
              "params": {},
              "ports": [
                { "id": "in", "direction": "input", "type": { "flow": "event", "dataKind": "bang" }, "activation": "trigger" }
              ]
            }
          ],
          "edges": [
            { "from": { "node": "node", "port": "missing" }, "to": { "node": "node", "port": "missing" } },
            { "from": { "node": "node", "port": "in" }, "to": { "node": "node", "port": "out" } }
          ]
        }"#,
    )
    .expect("graph should parse");

    let error = validate_graph_document_v01(&graph).expect_err("graph should fail");
    let text = error.to_string();

    assert!(text.contains("expected schema skenion.graph"));
    assert!(text.contains("duplicate node id: node"));
    assert!(text.contains("edge references missing source port node:missing"));
    assert!(text.contains("edge target node:out is not an input port"));
}
