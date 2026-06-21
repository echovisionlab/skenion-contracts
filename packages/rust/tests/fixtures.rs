#![recursion_limit = "256"]

use std::{fs, path::Path};

use skenion_contracts::{
    GraphDocumentV01, GraphDocumentV02, GraphFragmentOutsideEndpointPolicyV02, GraphFragmentV02,
    GraphPatchEventV01, GraphPatchHistoryV01, GraphPatchV01, NodeDefinitionManifestV01,
    NodeDefinitionManifestV02, ObjectTextParseResultV01, PasteGraphFragmentResponse,
    ProjectDocumentV01, ProjectDocumentV02, RuntimeCollaborationEventEnvelope,
    RuntimeCollaborationOperationBatch, RuntimeCollaborationOperationBatchResult,
    RuntimeCollaborationOperationEnvelope, RuntimeCollaborationOperationResult,
    RuntimeCollaborationPresenceEnvelope, RuntimeCollaborationSelectionEnvelope,
    RuntimeOperationEnvelope, RuntimeSessionEvent, RuntimeSessionInfoResponse,
    analyze_graph_document_v02, analyze_graph_fragment_v02, migrate_graph_document_v01_to_v02,
    migrate_project_document_v01_to_v02, parse_object_text_v01, validate_graph_document_v01,
    validate_graph_document_v02, validate_graph_fragment_v02, validate_node_definition_v01,
    validate_node_definition_v02, validate_object_text_parse_result_v01,
    validate_paste_graph_fragment_response, validate_project_document_v02,
    validate_runtime_collaboration_event_envelope, validate_runtime_collaboration_operation_batch,
    validate_runtime_collaboration_operation_batch_result,
    validate_runtime_collaboration_operation_envelope,
    validate_runtime_collaboration_operation_result,
    validate_runtime_collaboration_presence_envelope,
    validate_runtime_collaboration_selection_envelope, validate_runtime_operation_envelope,
    validate_runtime_session_event, validate_runtime_session_info_response,
};

fn collect_json_files(dir: &Path, files: &mut Vec<std::path::PathBuf>) {
    for entry in fs::read_dir(dir).expect("fixture directory should be readable") {
        let entry = entry.expect("fixture entry should be readable");
        let path = entry.path();
        if path.is_dir() {
            collect_json_files(&path, files);
        } else if path
            .extension()
            .is_some_and(|extension| extension == "json")
        {
            files.push(path);
        }
    }
}

fn fixture_files(relative: &str) -> Vec<std::path::PathBuf> {
    let root = Path::new(env!("CARGO_MANIFEST_DIR")).join(relative);
    let mut files = Vec::new();
    collect_json_files(&root, &mut files);
    files.sort();
    files
}

#[test]
fn validates_graph_fixtures() {
    for file in fixture_files("../../fixtures/graph/v0.1/valid") {
        let graph: GraphDocumentV01 =
            serde_json::from_slice(&fs::read(&file).expect("fixture should be readable"))
                .expect("valid graph fixture should parse");
        validate_graph_document_v01(&graph)
            .unwrap_or_else(|error| panic!("{} should be valid: {error}", file.display()));
    }

    for file in fixture_files("../../fixtures/graph/v0.1/invalid") {
        let graph: GraphDocumentV01 =
            serde_json::from_slice(&fs::read(&file).expect("fixture should be readable"))
                .expect("invalid graph fixture should still parse");
        assert!(
            validate_graph_document_v01(&graph).is_err(),
            "{} should be invalid",
            file.display()
        );
    }
}

#[test]
fn validates_v02_graph_fixtures() {
    for file in fixture_files("../../fixtures/graph/v0.2/valid") {
        let graph: GraphDocumentV02 =
            serde_json::from_slice(&fs::read(&file).expect("fixture should be readable"))
                .expect("valid graph fixture should parse");
        validate_graph_document_v02(&graph)
            .unwrap_or_else(|error| panic!("{} should be valid: {error}", file.display()));
    }

    for file in fixture_files("../../fixtures/graph/v0.2/invalid") {
        let graph: GraphDocumentV02 =
            serde_json::from_slice(&fs::read(&file).expect("fixture should be readable"))
                .expect("invalid graph fixture should still parse");
        assert!(
            validate_graph_document_v02(&graph).is_err(),
            "{} should be invalid",
            file.display()
        );
    }
}

#[test]
fn migrates_legacy_v01_fixtures_to_v02_active_contracts() {
    for name in ["minimal-value", "core-panel-help"] {
        let input_path = format!("../../fixtures/migration/v0.1-to-v0.2/{name}.input.graph.json");
        let expected_path =
            format!("../../fixtures/migration/v0.1-to-v0.2/{name}.expected.graph.json");
        let input: GraphDocumentV01 = serde_json::from_slice(
            &fs::read(Path::new(env!("CARGO_MANIFEST_DIR")).join(&input_path))
                .expect("input graph fixture should be readable"),
        )
        .expect("input graph fixture should parse");
        let expected: GraphDocumentV02 = serde_json::from_slice(
            &fs::read(Path::new(env!("CARGO_MANIFEST_DIR")).join(&expected_path))
                .expect("expected graph fixture should be readable"),
        )
        .expect("expected graph fixture should parse");
        let migrated = migrate_graph_document_v01_to_v02(&input);

        assert_eq!(migrated, expected, "{name}");
        validate_graph_document_v01(&input).expect("legacy graph input should validate");
        validate_graph_document_v02(&migrated).expect("migrated graph should validate");
    }

    let project_input: ProjectDocumentV01 = serde_json::from_slice(
        &fs::read(
            Path::new(env!("CARGO_MANIFEST_DIR"))
                .join("../../fixtures/migration/v0.1-to-v0.2/minimal-project.input.project.json"),
        )
        .expect("input project fixture should be readable"),
    )
    .expect("input project fixture should parse");
    let project_expected: ProjectDocumentV02 =
        serde_json::from_slice(
            &fs::read(Path::new(env!("CARGO_MANIFEST_DIR")).join(
                "../../fixtures/migration/v0.1-to-v0.2/minimal-project.expected.project.json",
            ))
            .expect("expected project fixture should be readable"),
        )
        .expect("expected project fixture should parse");
    let project_migrated = migrate_project_document_v01_to_v02(&project_input);

    assert_eq!(project_migrated, project_expected);
    assert!(project_migrated.patch_library.is_empty());
    validate_project_document_v02(&project_migrated).expect("migrated project should validate");
}

#[test]
fn validates_v02_graph_fragment_fixtures() {
    for file in fixture_files("../../fixtures/graph-fragment/v0.2/valid") {
        let fragment: GraphFragmentV02 =
            serde_json::from_slice(&fs::read(&file).expect("fixture should be readable"))
                .expect("valid graph fragment fixture should parse");
        let result = validate_graph_fragment_v02(&fragment)
            .unwrap_or_else(|error| panic!("{} should be valid: {error}", file.display()));
        assert!(result.ok);
        assert!(result.omitted_edge_ids.is_empty());
    }

    for file in fixture_files("../../fixtures/graph-fragment/v0.2/invalid") {
        let fragment: GraphFragmentV02 =
            serde_json::from_slice(&fs::read(&file).expect("fixture should be readable"))
                .expect("invalid graph fragment fixture should still parse");
        assert!(
            validate_graph_fragment_v02(&fragment).is_err(),
            "{} should be invalid",
            file.display()
        );
        let omitted =
            analyze_graph_fragment_v02(&fragment, GraphFragmentOutsideEndpointPolicyV02::Omit);
        assert!(omitted.ok);
        assert_eq!(omitted.omitted_edge_ids, vec!["edge-to-outside".to_owned()]);
    }
}

#[test]
fn validates_runtime_operation_fixtures() {
    for file in fixture_files("../../fixtures/runtime-operation/v0/valid") {
        let document = fs::read(&file).expect("fixture should be readable");
        let value: serde_json::Value =
            serde_json::from_slice(&document).expect("runtime operation fixture should parse");
        match value.get("schema").and_then(serde_json::Value::as_str) {
            Some("skenion.runtime.operation") => {
                let operation: RuntimeOperationEnvelope = serde_json::from_value(value)
                    .unwrap_or_else(|error| panic!("{} should parse: {error}", file.display()));
                validate_runtime_operation_envelope(&operation)
                    .unwrap_or_else(|error| panic!("{} should validate: {error}", file.display()));
            }
            Some("skenion.runtime.paste-graph-fragment.response") => {
                let response: PasteGraphFragmentResponse = serde_json::from_value(value)
                    .unwrap_or_else(|error| panic!("{} should parse: {error}", file.display()));
                validate_paste_graph_fragment_response(&response)
                    .unwrap_or_else(|error| panic!("{} should validate: {error}", file.display()));
            }
            other => panic!("{} has unexpected schema {other:?}", file.display()),
        }
    }
}

#[test]
fn validates_runtime_collaboration_fixtures() {
    for file in fixture_files("../../fixtures/runtime-collaboration/v0/valid") {
        let document = fs::read(&file).expect("fixture should be readable");
        let value: serde_json::Value =
            serde_json::from_slice(&document).expect("runtime collaboration fixture should parse");
        match value.get("schema").and_then(serde_json::Value::as_str) {
            Some("skenion.runtime.collaboration.operation") => {
                let operation: RuntimeCollaborationOperationEnvelope =
                    serde_json::from_value(value)
                        .unwrap_or_else(|error| panic!("{} should parse: {error}", file.display()));
                validate_runtime_collaboration_operation_envelope(&operation)
                    .unwrap_or_else(|error| panic!("{} should validate: {error}", file.display()));
            }
            Some("skenion.runtime.collaboration.operation-batch") => {
                let batch: RuntimeCollaborationOperationBatch = serde_json::from_value(value)
                    .unwrap_or_else(|error| panic!("{} should parse: {error}", file.display()));
                validate_runtime_collaboration_operation_batch(&batch)
                    .unwrap_or_else(|error| panic!("{} should validate: {error}", file.display()));
            }
            Some("skenion.runtime.collaboration.operation-batch-result") => {
                let result: RuntimeCollaborationOperationBatchResult =
                    serde_json::from_value(value)
                        .unwrap_or_else(|error| panic!("{} should parse: {error}", file.display()));
                validate_runtime_collaboration_operation_batch_result(&result)
                    .unwrap_or_else(|error| panic!("{} should validate: {error}", file.display()));
            }
            Some("skenion.runtime.collaboration.operation-result") => {
                let result: RuntimeCollaborationOperationResult = serde_json::from_value(value)
                    .unwrap_or_else(|error| panic!("{} should parse: {error}", file.display()));
                validate_runtime_collaboration_operation_result(&result)
                    .unwrap_or_else(|error| panic!("{} should validate: {error}", file.display()));
            }
            Some("skenion.runtime.collaboration.presence") => {
                let presence: RuntimeCollaborationPresenceEnvelope = serde_json::from_value(value)
                    .unwrap_or_else(|error| panic!("{} should parse: {error}", file.display()));
                validate_runtime_collaboration_presence_envelope(&presence)
                    .unwrap_or_else(|error| panic!("{} should validate: {error}", file.display()));
            }
            Some("skenion.runtime.collaboration.selection") => {
                let selection: RuntimeCollaborationSelectionEnvelope =
                    serde_json::from_value(value)
                        .unwrap_or_else(|error| panic!("{} should parse: {error}", file.display()));
                validate_runtime_collaboration_selection_envelope(&selection)
                    .unwrap_or_else(|error| panic!("{} should validate: {error}", file.display()));
            }
            Some("skenion.runtime.collaboration.event") => {
                let event: RuntimeCollaborationEventEnvelope = serde_json::from_value(value)
                    .unwrap_or_else(|error| panic!("{} should parse: {error}", file.display()));
                validate_runtime_collaboration_event_envelope(&event)
                    .unwrap_or_else(|error| panic!("{} should validate: {error}", file.display()));
            }
            other => panic!("{} has unexpected schema {other:?}", file.display()),
        }
    }

    for file in fixture_files("../../fixtures/runtime-collaboration/v0/invalid") {
        let document = fs::read(&file).expect("fixture should be readable");
        let value: serde_json::Value = serde_json::from_slice(&document)
            .expect("invalid runtime collaboration fixture should parse as json");
        match value.get("schema").and_then(serde_json::Value::as_str) {
            Some("skenion.runtime.collaboration.operation") => {
                if let Ok(operation) =
                    serde_json::from_value::<RuntimeCollaborationOperationEnvelope>(value)
                {
                    assert!(
                        validate_runtime_collaboration_operation_envelope(&operation).is_err(),
                        "{} should fail validation",
                        file.display()
                    );
                }
            }
            Some("skenion.runtime.collaboration.operation-batch") => {
                if let Ok(batch) =
                    serde_json::from_value::<RuntimeCollaborationOperationBatch>(value)
                {
                    assert!(
                        validate_runtime_collaboration_operation_batch(&batch).is_err(),
                        "{} should fail validation",
                        file.display()
                    );
                }
            }
            Some("skenion.runtime.collaboration.operation-batch-result") => {
                if let Ok(result) =
                    serde_json::from_value::<RuntimeCollaborationOperationBatchResult>(value)
                {
                    assert!(
                        validate_runtime_collaboration_operation_batch_result(&result).is_err(),
                        "{} should fail validation",
                        file.display()
                    );
                }
            }
            Some("skenion.runtime.collaboration.operation-result") => {
                if let Ok(result) =
                    serde_json::from_value::<RuntimeCollaborationOperationResult>(value)
                {
                    assert!(
                        validate_runtime_collaboration_operation_result(&result).is_err(),
                        "{} should fail validation",
                        file.display()
                    );
                }
            }
            Some("skenion.runtime.collaboration.presence") => {
                if let Ok(presence) =
                    serde_json::from_value::<RuntimeCollaborationPresenceEnvelope>(value)
                {
                    assert!(
                        validate_runtime_collaboration_presence_envelope(&presence).is_err(),
                        "{} should fail validation",
                        file.display()
                    );
                }
            }
            Some("skenion.runtime.collaboration.selection") => {
                if let Ok(selection) =
                    serde_json::from_value::<RuntimeCollaborationSelectionEnvelope>(value)
                {
                    assert!(
                        validate_runtime_collaboration_selection_envelope(&selection).is_err(),
                        "{} should fail validation",
                        file.display()
                    );
                }
            }
            Some("skenion.runtime.collaboration.event") => {
                if let Ok(event) =
                    serde_json::from_value::<RuntimeCollaborationEventEnvelope>(value)
                {
                    assert!(
                        validate_runtime_collaboration_event_envelope(&event).is_err(),
                        "{} should fail validation",
                        file.display()
                    );
                }
            }
            other => panic!("{} has unexpected schema {other:?}", file.display()),
        }
    }
}

#[test]
fn validates_runtime_session_fixtures() {
    for file in fixture_files("../../fixtures/runtime-session/v0/valid") {
        let document = fs::read(&file).expect("fixture should be readable");
        let value: serde_json::Value =
            serde_json::from_slice(&document).expect("runtime session fixture should parse");
        match value.get("schema").and_then(serde_json::Value::as_str) {
            Some("skenion.runtime.session.info") => {
                let response: RuntimeSessionInfoResponse = serde_json::from_value(value)
                    .unwrap_or_else(|error| panic!("{} should parse: {error}", file.display()));
                validate_runtime_session_info_response(&response)
                    .unwrap_or_else(|error| panic!("{} should validate: {error}", file.display()));
            }
            Some("skenion.runtime.session.event") => {
                let event: RuntimeSessionEvent = serde_json::from_value(value)
                    .unwrap_or_else(|error| panic!("{} should parse: {error}", file.display()));
                validate_runtime_session_event(&event)
                    .unwrap_or_else(|error| panic!("{} should validate: {error}", file.display()));
            }
            other => panic!("{} has unexpected schema {other:?}", file.display()),
        }
    }

    for file in fixture_files("../../fixtures/runtime-session/v0/invalid") {
        let document = fs::read(&file).expect("fixture should be readable");
        let value: serde_json::Value = serde_json::from_slice(&document)
            .expect("invalid runtime session fixture should parse");
        match value.get("schema").and_then(serde_json::Value::as_str) {
            Some("skenion.runtime.session.info") => {
                if let Ok(response) = serde_json::from_value::<RuntimeSessionInfoResponse>(value) {
                    assert!(
                        validate_runtime_session_info_response(&response).is_err(),
                        "{} should fail validation",
                        file.display()
                    );
                }
            }
            Some("skenion.runtime.session.event") => {
                if let Ok(event) = serde_json::from_value::<RuntimeSessionEvent>(value) {
                    assert!(
                        validate_runtime_session_event(&event).is_err(),
                        "{} should fail validation",
                        file.display()
                    );
                }
            }
            other => panic!("{} has unexpected schema {other:?}", file.display()),
        }
    }
}

#[test]
fn validates_runtime_session_and_graph_edge_case_coverage_paths() {
    let duplicate_ports: NodeDefinitionManifestV02 = serde_json::from_str(
        r#"{
          "schema": "skenion.node.definition",
          "schemaVersion": "0.2.0",
          "id": "core.duplicate-port",
          "version": "0.2.0",
          "displayName": "Duplicate Port",
          "category": "Core",
          "ports": [
            { "id": "value", "direction": "input", "type": "number.float" },
            { "id": "value", "direction": "output", "type": "number.float" }
          ],
          "execution": { "model": "value" },
          "state": { "persistent": false },
          "permissions": [],
          "capabilities": []
        }"#,
    )
    .expect("duplicate port definition should parse");
    let duplicate_report =
        validate_node_definition_v02(&duplicate_ports).expect_err("duplicate port should fail");
    assert!(duplicate_report.to_string().contains("duplicate port id"));

    let message_any_graph: GraphDocumentV02 = serde_json::from_str(
        r#"{
          "schema": "skenion.graph",
          "schemaVersion": "0.2.0",
          "id": "message-any-control-types",
          "revision": "1",
          "nodes": [
            {
              "id": "button",
              "kind": "core.bang",
              "kindVersion": "0.2.0",
              "params": {},
              "ports": [
                { "id": "out", "direction": "output", "type": "event.bang", "rate": "event" }
              ]
            },
            {
              "id": "float_value",
              "kind": "core.float",
              "kindVersion": "0.2.0",
              "params": {},
              "ports": [
                { "id": "value", "direction": "output", "type": "number.float", "rate": "event" }
              ]
            },
            {
              "id": "int_value",
              "kind": "core.int",
              "kindVersion": "0.2.0",
              "params": {},
              "ports": [
                { "id": "value", "direction": "output", "type": "number.int", "rate": "event" }
              ]
            },
            {
              "id": "uint_value",
              "kind": "core.uint",
              "kindVersion": "0.2.0",
              "params": {},
              "ports": [
                { "id": "value", "direction": "output", "type": "number.uint", "rate": "event" }
              ]
            },
            {
              "id": "bool_value",
              "kind": "core.bool",
              "kindVersion": "0.2.0",
              "params": {},
              "ports": [
                { "id": "value", "direction": "output", "type": "boolean", "rate": "event" }
              ]
            },
            {
              "id": "color_value",
              "kind": "core.color",
              "kindVersion": "0.2.0",
              "params": {},
              "ports": [
                { "id": "value", "direction": "output", "type": "color", "rate": "event" }
              ]
            },
            {
              "id": "string_value",
              "kind": "core.string",
              "kindVersion": "0.2.0",
              "params": {},
              "ports": [
                { "id": "value", "direction": "output", "type": "string", "rate": "event" }
              ]
            },
            {
              "id": "message",
              "kind": "core.message",
              "kindVersion": "0.2.0",
              "params": {},
              "ports": [
                { "id": "in", "direction": "input", "type": "message.any", "rate": "event", "maxConnections": 7, "mergePolicy": "ordered-events" }
              ]
            }
          ],
          "edges": [
            {
              "id": "edge_button_message",
              "source": { "nodeId": "button", "portId": "out" },
              "target": { "nodeId": "message", "portId": "in" }
            },
            {
              "id": "edge_float_message",
              "source": { "nodeId": "float_value", "portId": "value" },
              "target": { "nodeId": "message", "portId": "in" }
            },
            {
              "id": "edge_int_message",
              "source": { "nodeId": "int_value", "portId": "value" },
              "target": { "nodeId": "message", "portId": "in" }
            },
            {
              "id": "edge_uint_message",
              "source": { "nodeId": "uint_value", "portId": "value" },
              "target": { "nodeId": "message", "portId": "in" }
            },
            {
              "id": "edge_bool_message",
              "source": { "nodeId": "bool_value", "portId": "value" },
              "target": { "nodeId": "message", "portId": "in" }
            },
            {
              "id": "edge_color_message",
              "source": { "nodeId": "color_value", "portId": "value" },
              "target": { "nodeId": "message", "portId": "in" }
            },
            {
              "id": "edge_string_message",
              "source": { "nodeId": "string_value", "portId": "value" },
              "target": { "nodeId": "message", "portId": "in" }
            }
          ]
        }"#,
    )
    .expect("message-any graph should parse");
    validate_graph_document_v02(&message_any_graph).expect("message-any graph should validate");

    let invalid_cycle_graph: GraphDocumentV02 = serde_json::from_str(
        r#"{
          "schema": "skenion.graph",
          "schemaVersion": "0.2.0",
          "id": "invalid-render-cycle",
          "revision": "1",
          "nodes": [
            {
              "id": "a",
              "kind": "render.a",
              "kindVersion": "0.2.0",
              "params": {},
              "ports": [
                { "id": "in", "direction": "input", "type": "render.frame" },
                { "id": "out", "direction": "output", "type": "render.frame" }
              ]
            },
            {
              "id": "b",
              "kind": "render.b",
              "kindVersion": "0.2.0",
              "params": {},
              "ports": [
                { "id": "in", "direction": "input", "type": "render.frame" },
                { "id": "out", "direction": "output", "type": "render.frame" }
              ]
            }
          ],
          "edges": [
            {
              "id": "edge-a-b",
              "source": { "nodeId": "a", "portId": "out" },
              "target": { "nodeId": "b", "portId": "in" }
            },
            {
              "id": "edge-b-a",
              "source": { "nodeId": "b", "portId": "out" },
              "target": { "nodeId": "a", "portId": "in" }
            }
          ]
        }"#,
    )
    .expect("invalid cycle graph should parse");
    let invalid_cycle_report =
        validate_graph_document_v02(&invalid_cycle_graph).expect_err("cycle should fail");
    assert!(invalid_cycle_report.to_string().contains("invalid-cycle"));

    let warning_graph: GraphDocumentV02 = serde_json::from_str(
        r#"{
          "schema": "skenion.graph",
          "schemaVersion": "0.2.0",
          "id": "risky-feedback-cycle",
          "revision": "1",
          "nodes": [
            {
              "id": "a",
              "kind": "core.a",
              "kindVersion": "0.2.0",
              "params": {},
              "ports": [
                { "id": "in", "direction": "input", "type": "value.number" },
                { "id": "out", "direction": "output", "type": "value.number" }
              ]
            },
            {
              "id": "b",
              "kind": "core.b",
              "kindVersion": "0.2.0",
              "params": {},
              "ports": [
                { "id": "in", "direction": "input", "type": "value.number" },
                { "id": "out", "direction": "output", "type": "value.number" }
              ]
            }
          ],
          "edges": [
            {
              "id": "edge-a-b",
              "source": { "nodeId": "a", "portId": "out" },
              "target": { "nodeId": "b", "portId": "in" }
            },
            {
              "id": "edge-b-a",
              "source": { "nodeId": "b", "portId": "out" },
              "target": { "nodeId": "a", "portId": "in" },
              "feedback": { "enabled": true, "boundary": "same-turn" }
            }
          ]
        }"#,
    )
    .expect("warning graph should parse");
    let warning_project: ProjectDocumentV02 = serde_json::from_value(serde_json::json!({
        "schema": "skenion.project",
        "schemaVersion": "0.2.0",
        "id": "project-with-warning-graph",
        "revision": "1",
        "graph": warning_graph,
        "viewState": {
            "schema": "skenion.view-state",
            "schemaVersion": "0.1.0",
            "canvas": {
                "nodes": {
                    "a": { "x": 0, "y": 0 },
                    "b": { "x": 120, "y": 0 }
                }
            }
        },
        "patchLibrary": []
    }))
    .expect("warning project should parse");
    validate_project_document_v02(&warning_project).expect("warnings should not fail project");

    let invalid_event: RuntimeSessionEvent = serde_json::from_value(serde_json::json!({
        "schema": "skenion.runtime.session.event",
        "schemaVersion": "0.1.0",
        "id": "event-invalid-mutation",
        "sessionId": "session-a",
        "sequence": 2,
        "sessionRevision": 2,
        "kind": "mutate",
        "snapshot": {
            "sessionRevision": 2,
            "viewRevision": 2,
            "controlRevision": 1,
            "project": null,
            "diagnostics": [
                { "severity": "warning" }
            ],
            "plan": []
        },
        "history": {
            "schema": "skenion.runtime.history",
            "schemaVersion": "0.1.0",
            "entries": [
                {
                    "id": "",
                    "sequence": 0,
                    "kind": "apply",
                    "mutation": {
                        "operation": {
                            "schema": "wrong",
                            "schemaVersion": "9.9.9",
                            "id": "",
                            "kind": "loadProject",
                            "request": {
                                "target": {
                                    "path": { "kind": "root" },
                                    "baseRevision": "1"
                                },
                                "fragment": {
                                    "schema": "skenion.graph.fragment",
                                    "schemaVersion": "0.2.0",
                                    "nodes": [
                                        {
                                            "id": "",
                                            "kind": "",
                                            "kindVersion": "",
                                            "params": {},
                                            "ports": [
                                                { "id": "", "direction": "input", "type": "number.float" }
                                            ]
                                        },
                                        {
                                            "id": "",
                                            "kind": "core.float",
                                            "kindVersion": "0.2.0",
                                            "params": {},
                                            "ports": []
                                        }
                                    ],
                                    "edges": [
                                        {
                                            "id": "edge-missing-source",
                                            "source": { "nodeId": "missing", "portId": "out" },
                                            "target": { "nodeId": "", "portId": "" }
                                        }
                                    ]
                                }
                            }
                        },
                        "clientId": ""
                    },
                    "inverseMutation": {
                        "viewPatch": {
                            "baseViewRevision": 0,
                            "ops": [
                                { "op": "setNodeView", "nodeId": "", "view": { "x": 0, "y": 0 } },
                                { "op": "moveNodeView", "nodeId": "", "from": { "x": 0, "y": 0 }, "to": { "x": 1, "y": 1 } }
                            ]
                        },
                        "clientId": ""
                    },
                    "subjectEventId": "",
                    "clientId": "",
                    "createdAt": ""
                }
            ],
            "canUndo": true,
            "canRedo": false,
            "undoDepth": 1,
            "redoDepth": 0
        },
        "mutation": {
            "id": "",
            "sequence": 0,
            "kind": "apply",
            "mutation": {
                "operation": {
                    "schema": "wrong",
                    "schemaVersion": "9.9.9",
                    "id": "",
                    "kind": "loadProject",
                    "request": {
                        "target": {
                            "path": { "kind": "root" },
                            "baseRevision": "1"
                        },
                        "fragment": {
                            "schema": "skenion.graph.fragment",
                            "schemaVersion": "0.2.0",
                            "nodes": [
                                {
                                    "id": "",
                                    "kind": "core.float",
                                    "kindVersion": "0.2.0",
                                    "params": {},
                                    "ports": []
                                },
                                {
                                    "id": "",
                                    "kind": "core.float",
                                    "kindVersion": "0.2.0",
                                    "params": {},
                                    "ports": []
                                }
                            ],
                            "edges": []
                        }
                    }
                },
                "clientId": ""
            },
            "inverseMutation": {
                "viewPatch": {
                    "baseViewRevision": 0,
                    "ops": [
                        { "op": "setNodeView", "nodeId": "", "view": { "x": 0, "y": 0 } }
                    ]
                },
                "clientId": ""
            },
            "subjectEventId": "",
            "clientId": "",
            "createdAt": ""
        },
        "replay": {
            "cursor": "2",
            "previousCursor": null,
            "replayed": false,
            "gap": null,
            "overflow": false
        },
        "diagnostics": [],
        "createdAt": "2026-06-22T00:00:02.000Z"
    }))
    .expect("invalid runtime event should parse structurally");
    let report = validate_runtime_session_event(&invalid_event).expect_err("event should fail");
    assert!(!report.errors().is_empty());
    let text = report.to_string();
    assert!(text.contains("snapshot diagnostics"));
    assert!(text.contains("operation expected schema skenion.runtime.operation"));
    assert!(text.contains("operation duplicate-node-id"));
    assert!(text.contains("viewPatch operation nodeId must not be empty"));
}

#[test]
fn validates_remaining_collaboration_integration_coverage_paths() {
    let accepted_disabled_graph: GraphDocumentV02 = serde_json::from_str(
        r#"{
          "schema": "skenion.graph",
          "schemaVersion": "0.2.0",
          "id": "accepted-disabled-graph",
          "revision": "1",
          "nodes": [
            {
              "id": "texture",
              "kind": "gpu.texture",
              "kindVersion": "0.2.0",
              "params": {},
              "ports": [
                { "id": "out", "direction": "output", "type": "gpu.texture2d" }
              ],
              "portGroups": [
                {
                  "id": "layers",
                  "direction": "output",
                  "type": "gpu.texture2d",
                  "minPorts": 1,
                  "maxPorts": 2
                }
              ]
            },
            {
              "id": "viewer",
              "kind": "render.viewer",
              "kindVersion": "0.2.0",
              "params": {},
              "ports": [
                {
                  "id": "in",
                  "direction": "input",
                  "type": "render.frame",
                  "accepts": ["gpu.texture2d"]
                }
              ]
            }
          ],
          "edges": [
            {
              "id": "edge-texture-viewer",
              "source": { "nodeId": "texture", "portId": "out" },
              "target": { "nodeId": "viewer", "portId": "in" },
              "enabled": false
            }
          ]
        }"#,
    )
    .expect("accepted disabled graph should parse");
    validate_graph_document_v02(&accepted_disabled_graph)
        .expect("accepted disabled graph should validate");

    let missing_source_graph: GraphDocumentV02 = serde_json::from_str(
        r#"{
          "schema": "skenion.graph",
          "schemaVersion": "0.2.0",
          "id": "missing-source-graph",
          "revision": "1",
          "nodes": [
            {
              "id": "viewer",
              "kind": "render.viewer",
              "kindVersion": "0.2.0",
              "params": {},
              "ports": [
                { "id": "in", "direction": "input", "type": "render.frame" }
              ]
            }
          ],
          "edges": [
            {
              "id": "edge-missing-source",
              "source": { "nodeId": "missing-source", "portId": "out" },
              "target": { "nodeId": "viewer", "portId": "in" }
            }
          ]
        }"#,
    )
    .expect("missing source graph should parse");
    let missing_source = analyze_graph_document_v02(&missing_source_graph);
    assert!(!missing_source.ok);
    assert!(
        missing_source
            .diagnostics
            .iter()
            .any(|diagnostic| diagnostic.code == "missing-source-port")
    );

    let value_to_render_cycle: GraphDocumentV02 = serde_json::from_str(
        r#"{
          "schema": "skenion.graph",
          "schemaVersion": "0.2.0",
          "id": "value-to-render-cycle",
          "revision": "1",
          "nodes": [
            {
              "id": "loop",
              "kind": "core.loop",
              "kindVersion": "0.2.0",
              "params": {},
              "ports": [
                {
                  "id": "in",
                  "direction": "input",
                  "type": "render.frame",
                  "accepts": ["value.number"]
                },
                { "id": "out", "direction": "output", "type": "value.number" }
              ]
            }
          ],
          "edges": [
            {
              "id": "edge-loop",
              "source": { "nodeId": "loop", "portId": "out" },
              "target": { "nodeId": "loop", "portId": "in" }
            }
          ]
        }"#,
    )
    .expect("value-to-render cycle should parse");
    assert!(
        validate_graph_document_v02(&value_to_render_cycle)
            .expect_err("mixed family self-cycle should fail")
            .to_string()
            .contains("invalid-cycle")
    );

    let change_set: RuntimeCollaborationOperationEnvelope = serde_json::from_str(
        r#"{
          "schema": "skenion.runtime.collaboration.operation",
          "schemaVersion": "0.1.0",
          "operationId": "op-integration-change-set",
          "sessionId": "session-collab-a",
          "participantId": "participant-a",
          "idempotencyKey": "session-collab-a:participant-a:coverage-change-set",
          "causal": {
            "baseRevision": "root-rev-7",
            "baseSequence": 7,
            "vector": { "participant-a": 7 }
          },
          "payload": {
            "kind": "changeSet",
            "target": {
              "path": { "kind": "root" },
              "baseRevision": "root-rev-7"
            },
            "changes": [
              {
                "op": "node.add",
                "changeId": "change-add-node",
                "node": {
                  "id": "gain",
                  "kind": "core.float",
                  "kindVersion": "0.2.0",
                  "params": {},
                  "ports": [
                    { "id": "out", "direction": "output", "type": "number.float" }
                  ]
                }
              },
              {
                "op": "node.move",
                "changeId": "change-move-node",
                "nodeId": "source",
                "to": { "x": 120, "y": 140 }
              },
              {
                "op": "node.delete",
                "changeId": "change-delete-node",
                "nodeId": "old-preview"
              },
              {
                "op": "edge.connect",
                "changeId": "change-connect-edge",
                "edge": {
                  "id": "edge-source-gain",
                  "source": { "nodeId": "source", "portId": "out" },
                  "target": { "nodeId": "gain", "portId": "out" }
                }
              },
              {
                "op": "edge.disconnect",
                "changeId": "change-disconnect-edge",
                "edgeId": "edge-old-preview"
              }
            ]
          },
          "submittedAt": "2026-06-22T00:00:00.000Z"
        }"#,
    )
    .expect("change-set operation should parse");
    validate_runtime_collaboration_operation_envelope(&change_set)
        .expect("change-set operation should validate");

    let valid_gap_event: RuntimeCollaborationEventEnvelope = serde_json::from_str(
        r#"{
          "schema": "skenion.runtime.collaboration.event",
          "schemaVersion": "0.1.0",
          "eventId": "event-valid-gap",
          "sessionId": "session-collab-a",
          "sequence": 9,
          "causal": {
            "baseRevision": "root-rev-9",
            "baseSequence": 9,
            "vector": { "participant-a": 9 }
          },
          "kind": "operation-result",
          "payload": {
            "kind": "operationResult",
            "result": {
              "schema": "skenion.runtime.collaboration.operation-result",
              "schemaVersion": "0.1.0",
              "sessionId": "session-collab-a",
              "operationId": "op-integration-change-set",
              "participantId": "participant-a",
              "idempotencyKey": "session-collab-a:participant-a:coverage-change-set",
              "status": "accepted",
              "causal": {
                "baseRevision": "root-rev-9",
                "baseSequence": 9,
                "vector": { "participant-a": 9 }
              },
              "ack": {
                "sequence": 9,
                "revision": "root-rev-9",
                "serverClock": {
                  "revision": "root-rev-9",
                  "sequence": 9,
                  "vector": { "participant-a": 9 }
                },
                "appliedAt": "2026-06-22T00:00:00.050Z"
              },
              "diagnostics": [],
              "createdAt": "2026-06-22T00:00:00.050Z"
            }
          },
          "replay": {
            "cursor": "9",
            "previousCursor": "6",
            "replayed": true,
            "gap": {
              "expectedSequence": 7,
              "actualSequence": 9,
              "reason": "retention-overflow"
            },
            "overflow": false
          },
          "createdAt": "2026-06-22T00:00:00.050Z"
        }"#,
    )
    .expect("valid gap event should parse");
    validate_runtime_collaboration_event_envelope(&valid_gap_event)
        .expect("valid collaboration replay gap should validate");

    let outside_operation: RuntimeOperationEnvelope = serde_json::from_str(
        r#"{
          "schema": "skenion.runtime.operation",
          "schemaVersion": "0.1.0",
          "id": "op-outside-fragment",
          "kind": "pasteGraphFragment",
          "request": {
            "target": {
              "path": { "kind": "root" },
              "baseRevision": "1"
            },
            "fragment": {
              "schema": "skenion.graph.fragment",
              "schemaVersion": "0.2.0",
              "nodes": [
                {
                  "id": "source",
                  "kind": "core.float",
                  "kindVersion": "0.2.0",
                  "params": {},
                  "ports": [
                    { "id": "out", "direction": "output", "type": "number.float" }
                  ]
                }
              ],
              "edges": [
                {
                  "id": "edge-to-outside",
                  "source": { "nodeId": "source", "portId": "out" },
                  "target": { "nodeId": "outside", "portId": "in" }
                }
              ]
            }
          }
        }"#,
    )
    .expect("outside runtime operation should parse");
    assert!(
        validate_runtime_operation_envelope(&outside_operation)
            .expect_err("outside endpoint should fail by default")
            .to_string()
            .contains("fragment-edge-outside-selection")
    );

    let valid_mutation_event: RuntimeSessionEvent = serde_json::from_str(
        r#"{
          "schema": "skenion.runtime.session.event",
          "schemaVersion": "0.1.0",
          "id": "event-valid-mutation",
          "sessionId": "session-a",
          "sequence": 3,
          "sessionRevision": 3,
          "kind": "mutate",
          "snapshot": {
            "sessionRevision": 3,
            "viewRevision": 3,
            "controlRevision": 1,
            "project": null,
            "diagnostics": [],
            "plan": null
          },
          "history": {
            "schema": "skenion.runtime.history",
            "schemaVersion": "0.1.0",
            "entries": [
              {
                "id": "history-valid-mutation",
                "sequence": 3,
                "kind": "apply",
                "mutation": {
	                  "operation": {
	                    "schema": "skenion.runtime.operation",
	                    "schemaVersion": "0.1.0",
	                    "id": "op-runtime-full",
	                    "kind": "pasteGraphFragment",
	                    "request": {
	                      "target": {
	                        "path": { "kind": "root" },
	                        "baseRevision": "2"
	                      },
	                      "fragment": {
	                        "schema": "skenion.graph.fragment",
	                        "schemaVersion": "0.2.0",
	                        "nodes": [
	                          {
	                            "id": "value_2",
	                            "kind": "core.float",
	                            "kindVersion": "0.2.0",
	                            "params": { "value": 0.75 },
	                            "ports": [
	                              { "id": "out", "direction": "output", "type": "number.float", "rate": "control" }
	                            ]
	                          }
	                        ],
	                        "edges": []
	                      },
	                      "placement": { "kind": "position", "x": 10, "y": 20 }
	                    },
	                    "correlationId": "runtime-session-valid"
	                  },
                  "viewPatch": {
                    "baseViewRevision": 2,
                    "ops": [
                      { "op": "setNodeView", "nodeId": "value_2", "view": { "x": 10, "y": 20 } },
                      {
                        "op": "moveNodeView",
                        "nodeId": "value_2",
                        "from": { "x": 10, "y": 20 },
                        "to": { "x": 20, "y": 30 }
                      }
                    ]
                  },
                  "clientId": "studio-main",
                  "description": "exercise every valid runtime patch branch"
                },
                "inverseMutation": {
                  "viewPatch": {
                    "baseViewRevision": 3,
                    "ops": [
                      { "op": "setNodeView", "nodeId": "value_2", "view": { "x": 0, "y": 0 } }
                    ]
                  },
                  "clientId": "studio-main"
                },
                "subjectEventId": "event-2",
                "clientId": "studio-main",
                "createdAt": "2026-06-22T00:00:02.000Z"
              }
            ],
            "canUndo": true,
            "canRedo": false,
            "undoDepth": 1,
            "redoDepth": 0
          },
          "replay": {
            "cursor": "3",
            "previousCursor": "2",
            "replayed": false,
            "gap": null,
            "overflow": false
          },
          "diagnostics": [],
          "createdAt": "2026-06-22T00:00:03.000Z"
        }"#,
    )
    .expect("valid mutation event should parse");
    validate_runtime_session_event(&valid_mutation_event)
        .expect("valid mutation event should validate");
}

#[test]
fn validates_node_definition_fixtures() {
    for file in fixture_files("../../fixtures/node/v0.1/valid") {
        let definition: NodeDefinitionManifestV01 =
            serde_json::from_slice(&fs::read(&file).expect("fixture should be readable"))
                .expect("valid node fixture should parse");
        validate_node_definition_v01(&definition)
            .unwrap_or_else(|error| panic!("{} should be valid: {error}", file.display()));
    }

    for file in fixture_files("../../fixtures/node/v0.1/invalid") {
        let definition: NodeDefinitionManifestV01 =
            serde_json::from_slice(&fs::read(&file).expect("fixture should be readable"))
                .expect("invalid node fixture should still parse");
        assert!(
            validate_node_definition_v01(&definition).is_err(),
            "{} should be invalid",
            file.display()
        );
    }
}

#[test]
fn validates_v02_node_definition_fixtures() {
    for file in fixture_files("../../fixtures/node/v0.2/valid") {
        let definition: NodeDefinitionManifestV02 =
            serde_json::from_slice(&fs::read(&file).expect("fixture should be readable"))
                .expect("valid node fixture should parse");
        validate_node_definition_v02(&definition)
            .unwrap_or_else(|error| panic!("{} should be valid: {error}", file.display()));
    }

    for file in fixture_files("../../fixtures/node/v0.2/invalid") {
        let definition: NodeDefinitionManifestV02 =
            serde_json::from_slice(&fs::read(&file).expect("fixture should be readable"))
                .expect("invalid node fixture should still parse");
        assert!(
            validate_node_definition_v02(&definition).is_err(),
            "{} should be invalid",
            file.display()
        );
    }
}

#[test]
fn validates_v02_project_patch_library_fixtures() {
    for file in fixture_files("../../fixtures/project/v0.2/valid") {
        let project: ProjectDocumentV02 =
            serde_json::from_slice(&fs::read(&file).expect("fixture should be readable"))
                .expect("valid v0.2 project fixture should parse");
        validate_project_document_v02(&project)
            .unwrap_or_else(|error| panic!("{} should be valid: {error}", file.display()));
    }

    for file in fixture_files("../../fixtures/project/v0.2/invalid") {
        let project: ProjectDocumentV02 =
            serde_json::from_slice(&fs::read(&file).expect("fixture should be readable"))
                .expect("invalid v0.2 project fixture should still parse");
        assert!(
            validate_project_document_v02(&project).is_err(),
            "{} should be invalid",
            file.display()
        );
    }
}

#[test]
fn parses_graph_patch_fixtures() {
    for file in fixture_files("../../fixtures/graph-patch/v0.1/valid") {
        let patch: GraphPatchV01 =
            serde_json::from_slice(&fs::read(&file).expect("fixture should be readable"))
                .unwrap_or_else(|error| panic!("{} should parse: {error}", file.display()));
        assert_eq!(patch.schema, "skenion.graph.patch");
        assert_eq!(patch.schema_version, "0.1.0");
    }

    let schema_invalid = [
        "add-edge-missing-endpoint.patch.json",
        "add-node-missing-node.patch.json",
        "missing-base-revision.patch.json",
        "unsupported-op.patch.json",
    ];
    for file_name in schema_invalid {
        let file = Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../fixtures/graph-patch/v0.1/invalid")
            .join(file_name);
        let parsed = serde_json::from_slice::<GraphPatchV01>(
            &fs::read(&file).expect("fixture should be readable"),
        );
        assert!(
            parsed.is_err(),
            "{} should be structurally invalid",
            file.display()
        );
    }
}

#[test]
fn parses_graph_patch_event_and_history_fixtures() {
    for file in fixture_files("../../fixtures/graph-patch-event/v0.1/valid") {
        let event: GraphPatchEventV01 =
            serde_json::from_slice(&fs::read(&file).expect("fixture should be readable"))
                .unwrap_or_else(|error| panic!("{} should parse: {error}", file.display()));
        assert_eq!(event.schema, "skenion.graph.patch.event");
        assert_eq!(event.schema_version, "0.1.0");
    }

    for file in fixture_files("../../fixtures/graph-patch-event/v0.1/invalid") {
        let parsed = serde_json::from_slice::<GraphPatchEventV01>(
            &fs::read(&file).expect("fixture should be readable"),
        );
        assert!(
            parsed.is_err(),
            "{} should be structurally invalid",
            file.display()
        );
    }

    for file in fixture_files("../../fixtures/graph-patch-history/v0.1/valid") {
        let history: GraphPatchHistoryV01 =
            serde_json::from_slice(&fs::read(&file).expect("fixture should be readable"))
                .unwrap_or_else(|error| panic!("{} should parse: {error}", file.display()));
        assert_eq!(history.schema, "skenion.graph.patch.history");
        assert_eq!(history.schema_version, "0.1.0");
    }
}

#[test]
fn parses_object_text_parse_result_fixtures() {
    for file in fixture_files("../../fixtures/object-text/v0.1/valid") {
        let result: ObjectTextParseResultV01 =
            serde_json::from_slice(&fs::read(&file).expect("fixture should be readable"))
                .unwrap_or_else(|error| panic!("{} should parse: {error}", file.display()));
        validate_object_text_parse_result_v01(&result)
            .unwrap_or_else(|error| panic!("{} should validate: {error}", file.display()));
        assert_eq!(
            parse_object_text_v01(&result.input),
            result,
            "{} should match parser output",
            file.display()
        );
    }

    for file in fixture_files("../../fixtures/object-text/v0.1/invalid") {
        let parsed = serde_json::from_slice::<ObjectTextParseResultV01>(
            &fs::read(&file).expect("fixture should be readable"),
        );
        assert!(
            parsed.is_err(),
            "{} should be structurally invalid",
            file.display()
        );
    }

    for input in [
        "[+ 1]",
        "[+ 1.]",
        "[+]",
        "[- 2]",
        "[* 0.5]",
        "[/ 0.5]",
        "[pow 2]",
        "[min 2]",
        "[max 2]",
        "[sqrt]",
        "[+~]",
        "[-~ 0.25]",
        "[*~ 0.5]",
        "[/~ 0.5]",
        "[sqrt~]",
        "[osc~]",
        "[osc~ 440]",
        "[phasor~]",
        "[phasor~ 1]",
    ] {
        let result = parse_object_text_v01(input);
        validate_object_text_parse_result_v01(&result)
            .unwrap_or_else(|error| panic!("{input} success should validate: {error}"));
        assert!(result.ok, "{input} should parse");
    }

    for input in [
        "[+ 1",
        "+ 1]",
        "",
        "[+ true]",
        "[+ false]",
        "[+ +]",
        "[+ 1.bad]",
        "[+ 1e309]",
        "[*~ 1 2]",
        "[*~ beep]",
        "[/~ false]",
        "[sqrt 1]",
        "[sqrt~ 1]",
        "[osc~ 1 2]",
        "[osc~ false]",
        "[phasor~ beep]",
        "[sin~]",
        "[square~]",
        "[expr $f1]",
        "[expr~ $v1]",
        "[fexpr~ $x1]",
        "[adc~ 1]",
        "[dac~ 1]",
        "[frobnicate]",
    ] {
        let result = parse_object_text_v01(input);
        validate_object_text_parse_result_v01(&result)
            .unwrap_or_else(|error| panic!("{input} failure should validate: {error}"));
        assert!(!result.ok, "{input} should fail without panicking");
    }
}
