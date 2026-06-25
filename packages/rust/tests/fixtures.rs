#![recursion_limit = "256"]

use std::{fs, path::Path};

use skenion_contracts::{
    GraphDocumentV01, GraphFragmentOutsideEndpointPolicyV01, GraphFragmentV01,
    NodeDefinitionManifestV01, ObjectTextParseResultV01, PackageDiagnosticSeverityV01,
    PackageDiscoveryResponseV01, PackageInstallPlanRequestV01, PackageInstallPlanResponseV01,
    PackageListingV01, PackageManifestV01, PackageRootDocumentV01, PasteGraphFragmentResponse,
    ProjectDocumentV01, ProjectObjectBindingDiagnosticCodeV01, ProjectObjectBindingDiagnosticV01,
    ProjectObjectBindingStatusV01, ProjectObjectBindingTargetV01,
    RuntimeCollaborationEventEnvelope, RuntimeCollaborationOperationBatch,
    RuntimeCollaborationOperationBatchResult, RuntimeCollaborationOperationEnvelope,
    RuntimeCollaborationOperationResult, RuntimeCollaborationPresenceEnvelope,
    RuntimeCollaborationSelectionEnvelope, RuntimeOperationEnvelope, RuntimeSessionEvent,
    RuntimeSessionInfoResponse, analyze_graph_document_v01, analyze_graph_fragment_v01,
    parse_object_text_v01, validate_graph_document_v01, validate_graph_fragment_v01,
    validate_node_definition_v01, validate_object_text_parse_result_v01,
    validate_package_discovery_response_v01, validate_package_install_plan_request_v01,
    validate_package_install_plan_response_v01, validate_package_listing_v01,
    validate_package_manifest_v01, validate_package_root_v01,
    validate_paste_graph_fragment_response, validate_patch_definition_v01,
    validate_project_document_v01, validate_runtime_collaboration_event_envelope,
    validate_runtime_collaboration_operation_batch,
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
fn validates_v01_graph_fixtures() {
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
fn validates_v01_graph_fragment_fixtures() {
    for file in fixture_files("../../fixtures/graph-fragment/v0.1/valid") {
        let fragment: GraphFragmentV01 =
            serde_json::from_slice(&fs::read(&file).expect("fixture should be readable"))
                .expect("valid graph fragment fixture should parse");
        let result = validate_graph_fragment_v01(&fragment)
            .unwrap_or_else(|error| panic!("{} should be valid: {error}", file.display()));
        assert!(result.ok);
        assert!(result.omitted_edge_ids.is_empty());
    }

    for file in fixture_files("../../fixtures/graph-fragment/v0.1/invalid") {
        let fragment: GraphFragmentV01 =
            serde_json::from_slice(&fs::read(&file).expect("fixture should be readable"))
                .expect("invalid graph fragment fixture should still parse");
        assert!(
            validate_graph_fragment_v01(&fragment).is_err(),
            "{} should be invalid",
            file.display()
        );
        let omitted =
            analyze_graph_fragment_v01(&fragment, GraphFragmentOutsideEndpointPolicyV01::Omit);
        assert!(omitted.ok);
        assert_eq!(omitted.omitted_edge_ids, vec!["edge-to-outside".to_owned()]);
    }
}

#[test]
fn rejects_v02_graph_project_patch_and_fragment_labels() {
    let graph_file = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../fixtures/graph/v0.1/valid/render-output.graph.json");
    let mut graph: GraphDocumentV01 =
        serde_json::from_slice(&fs::read(&graph_file).expect("fixture should be readable"))
            .expect("valid graph fixture should parse");
    graph.schema_version = "0.2.0".to_owned();
    let graph_report =
        validate_graph_document_v01(&graph).expect_err("v0.2 graph should be rejected");
    assert!(
        graph_report
            .to_string()
            .contains("expected schemaVersion 0.1.0, found 0.2.0")
    );

    let project_file = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../fixtures/project/v0.1/valid/input-only-patch.project.json");
    let mut project: ProjectDocumentV01 =
        serde_json::from_slice(&fs::read(&project_file).expect("fixture should be readable"))
            .expect("valid project fixture should parse");
    project.schema_version = "0.2.0".to_owned();
    let project_report =
        validate_project_document_v01(&project).expect_err("v0.2 project should be rejected");
    assert!(
        project_report
            .to_string()
            .contains("expected schemaVersion 0.1.0, found 0.2.0")
    );

    project.schema_version = "0.1.0".to_owned();
    project.patch_library[0].graph.schema_version = "0.2.0".to_owned();
    let patch_report = validate_patch_definition_v01(&project.patch_library[0])
        .expect_err("v0.2 patch graph should be rejected");
    assert!(
        patch_report
            .to_string()
            .contains("expected schemaVersion 0.1.0, found 0.2.0")
    );

    let fragment_file = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../fixtures/graph-fragment/v0.1/valid/internal-edge.fragment.json");
    let mut fragment: GraphFragmentV01 =
        serde_json::from_slice(&fs::read(&fragment_file).expect("fixture should be readable"))
            .expect("valid fragment fixture should parse");
    fragment.schema_version = "0.2.0".to_owned();
    let fragment_report =
        validate_graph_fragment_v01(&fragment).expect_err("v0.2 fragment should be rejected");
    assert!(
        fragment_report
            .to_string()
            .contains("expected schemaVersion 0.1.0, found 0.2.0")
    );
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
fn validates_runtime_interface_diagnostic_error_branches() {
    let file = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../fixtures/runtime-operation/v0/valid/interface-diagnostic.response.json");
    let mut response: PasteGraphFragmentResponse =
        serde_json::from_slice(&fs::read(&file).expect("fixture should be readable"))
            .expect("interface diagnostic response should parse");

    response.diagnostics[0].interface_detail = None;
    let report = validate_paste_graph_fragment_response(&response)
        .expect_err("interface diagnostic without detail should fail validation");
    assert!(
        report.to_string().contains("requires interfaceDetail"),
        "got {report}"
    );

    let mut response: PasteGraphFragmentResponse =
        serde_json::from_slice(&fs::read(&file).expect("fixture should be readable"))
            .expect("interface diagnostic response should parse");
    response.diagnostics[0]
        .interface_detail
        .as_mut()
        .expect("fixture diagnostic should have interface detail")
        .recovery_actions
        .clear();
    let report = validate_paste_graph_fragment_response(&response)
        .expect_err("interface diagnostic without recoveryActions should fail validation");
    assert!(
        report.to_string().contains("requires recoveryActions"),
        "got {report}"
    );
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
    let duplicate_ports: NodeDefinitionManifestV01 = serde_json::from_str(
        r#"{
          "schema": "skenion.node.definition",
          "schemaVersion": "0.1.0",
          "id": "core.duplicate-port",
          "version": "0.1.0",
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
        validate_node_definition_v01(&duplicate_ports).expect_err("duplicate port should fail");
    assert!(duplicate_report.to_string().contains("duplicate port id"));

    let message_any_graph: GraphDocumentV01 = serde_json::from_str(
        r#"{
          "schema": "skenion.graph",
          "schemaVersion": "0.1.0",
          "id": "message-any-control-types",
          "revision": "1",
          "nodes": [
            {
              "id": "button",
              "kind": "core.bang",
              "kindVersion": "0.1.0",
              "params": {},
              "ports": [
                { "id": "out", "direction": "output", "type": "event.bang", "rate": "event" }
              ]
            },
            {
              "id": "float_value",
              "kind": "core.float",
              "kindVersion": "0.1.0",
              "params": {},
              "ports": [
                { "id": "value", "direction": "output", "type": "number.float", "rate": "event" }
              ]
            },
            {
              "id": "int_value",
              "kind": "core.int",
              "kindVersion": "0.1.0",
              "params": {},
              "ports": [
                { "id": "value", "direction": "output", "type": "number.int", "rate": "event" }
              ]
            },
            {
              "id": "uint_value",
              "kind": "core.uint",
              "kindVersion": "0.1.0",
              "params": {},
              "ports": [
                { "id": "value", "direction": "output", "type": "number.uint", "rate": "event" }
              ]
            },
            {
              "id": "bool_value",
              "kind": "core.bool",
              "kindVersion": "0.1.0",
              "params": {},
              "ports": [
                { "id": "value", "direction": "output", "type": "boolean", "rate": "event" }
              ]
            },
            {
              "id": "color_value",
              "kind": "core.color",
              "kindVersion": "0.1.0",
              "params": {},
              "ports": [
                { "id": "value", "direction": "output", "type": "color", "rate": "event" }
              ]
            },
            {
              "id": "string_value",
              "kind": "core.string",
              "kindVersion": "0.1.0",
              "params": {},
              "ports": [
                { "id": "value", "direction": "output", "type": "string", "rate": "event" }
              ]
            },
            {
              "id": "message",
              "kind": "core.message",
              "kindVersion": "0.1.0",
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
    validate_graph_document_v01(&message_any_graph).expect("message-any graph should validate");

    let invalid_cycle_graph: GraphDocumentV01 = serde_json::from_str(
        r#"{
          "schema": "skenion.graph",
          "schemaVersion": "0.1.0",
          "id": "invalid-render-cycle",
          "revision": "1",
          "nodes": [
            {
              "id": "a",
              "kind": "render.a",
              "kindVersion": "0.1.0",
              "params": {},
              "ports": [
                { "id": "in", "direction": "input", "type": "render.frame" },
                { "id": "out", "direction": "output", "type": "render.frame" }
              ]
            },
            {
              "id": "b",
              "kind": "render.b",
              "kindVersion": "0.1.0",
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
        validate_graph_document_v01(&invalid_cycle_graph).expect_err("cycle should fail");
    assert!(invalid_cycle_report.to_string().contains("invalid-cycle"));

    let warning_graph: GraphDocumentV01 = serde_json::from_str(
        r#"{
          "schema": "skenion.graph",
          "schemaVersion": "0.1.0",
          "id": "risky-feedback-cycle",
          "revision": "1",
          "nodes": [
            {
              "id": "a",
              "kind": "core.a",
              "kindVersion": "0.1.0",
              "params": {},
              "ports": [
                { "id": "in", "direction": "input", "type": "value.number" },
                { "id": "out", "direction": "output", "type": "value.number" }
              ]
            },
            {
              "id": "b",
              "kind": "core.b",
              "kindVersion": "0.1.0",
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
    let warning_project: ProjectDocumentV01 = serde_json::from_value(serde_json::json!({
        "schema": "skenion.project",
        "schemaVersion": "0.1.0",
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
    validate_project_document_v01(&warning_project).expect("warnings should not fail project");

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
                { "severity": "warning", "message": "" }
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
                                    "schemaVersion": "0.1.0",
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
                                            "kindVersion": "0.1.0",
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
                            "schemaVersion": "0.1.0",
                            "nodes": [
                                {
                                    "id": "",
                                    "kind": "core.float",
                                    "kindVersion": "0.1.0",
                                    "params": {},
                                    "ports": []
                                },
                                {
                                    "id": "",
                                    "kind": "core.float",
                                    "kindVersion": "0.1.0",
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
    let accepted_disabled_graph: GraphDocumentV01 = serde_json::from_str(
        r#"{
          "schema": "skenion.graph",
          "schemaVersion": "0.1.0",
          "id": "accepted-disabled-graph",
          "revision": "1",
          "nodes": [
            {
              "id": "texture",
              "kind": "gpu.texture",
              "kindVersion": "0.1.0",
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
              "kindVersion": "0.1.0",
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
    validate_graph_document_v01(&accepted_disabled_graph)
        .expect("accepted disabled graph should validate");

    let missing_source_graph: GraphDocumentV01 = serde_json::from_str(
        r#"{
          "schema": "skenion.graph",
          "schemaVersion": "0.1.0",
          "id": "missing-source-graph",
          "revision": "1",
          "nodes": [
            {
              "id": "viewer",
              "kind": "render.viewer",
              "kindVersion": "0.1.0",
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
    let missing_source = analyze_graph_document_v01(&missing_source_graph);
    assert!(!missing_source.ok);
    assert!(
        missing_source
            .diagnostics
            .iter()
            .any(|diagnostic| diagnostic.code == "missing-source-port")
    );

    let value_to_render_cycle: GraphDocumentV01 = serde_json::from_str(
        r#"{
          "schema": "skenion.graph",
          "schemaVersion": "0.1.0",
          "id": "value-to-render-cycle",
          "revision": "1",
          "nodes": [
            {
              "id": "loop",
              "kind": "core.loop",
              "kindVersion": "0.1.0",
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
        validate_graph_document_v01(&value_to_render_cycle)
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
                  "kindVersion": "0.1.0",
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
              "schemaVersion": "0.1.0",
              "nodes": [
                {
                  "id": "source",
                  "kind": "core.float",
                  "kindVersion": "0.1.0",
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
	                        "schemaVersion": "0.1.0",
	                        "nodes": [
	                          {
	                            "id": "value_2",
	                            "kind": "core.float",
	                            "kindVersion": "0.1.0",
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
fn validates_package_manifest_fixtures() {
    for file in fixture_files("../../fixtures/package/v0.1/valid") {
        let document = fs::read(&file).expect("fixture should be readable");
        let value: serde_json::Value =
            serde_json::from_slice(&document).expect("package fixture should parse as JSON");
        match value.get("schema").and_then(serde_json::Value::as_str) {
            Some("skenion.package.manifest") => {
                let manifest: PackageManifestV01 =
                    serde_json::from_value(value).unwrap_or_else(|error| {
                        panic!(
                            "{} should parse as package manifest: {error}",
                            file.display()
                        )
                    });
                validate_package_manifest_v01(&manifest)
                    .unwrap_or_else(|error| panic!("{} should validate: {error}", file.display()));
                assert_eq!(manifest.schema, "skenion.package.manifest");
                assert_eq!(manifest.schema_version, "0.1.0");
            }
            Some("skenion.package.listing") => {
                let listing: PackageListingV01 =
                    serde_json::from_value(value).unwrap_or_else(|error| {
                        panic!(
                            "{} should parse as package listing: {error}",
                            file.display()
                        )
                    });
                validate_package_listing_v01(&listing)
                    .unwrap_or_else(|error| panic!("{} should validate: {error}", file.display()));
                assert_eq!(listing.schema, "skenion.package.listing");
                assert_eq!(listing.schema_version, "0.1.0");
            }
            Some("skenion.package.discovery") => {
                let response: PackageDiscoveryResponseV01 = serde_json::from_value(value)
                    .unwrap_or_else(|error| {
                        panic!(
                            "{} should parse as package discovery: {error}",
                            file.display()
                        )
                    });
                validate_package_discovery_response_v01(&response)
                    .unwrap_or_else(|error| panic!("{} should validate: {error}", file.display()));
                assert_eq!(response.schema, "skenion.package.discovery");
                assert_eq!(response.schema_version, "0.1.0");
            }
            Some("skenion.package.install-plan.request") => {
                let request: PackageInstallPlanRequestV01 = serde_json::from_value(value)
                    .unwrap_or_else(|error| {
                        panic!(
                            "{} should parse as package install plan request: {error}",
                            file.display()
                        )
                    });
                validate_package_install_plan_request_v01(&request)
                    .unwrap_or_else(|error| panic!("{} should validate: {error}", file.display()));
                assert_eq!(request.schema, "skenion.package.install-plan.request");
                assert_eq!(request.schema_version, "0.1.0");
            }
            Some("skenion.package.install-plan.response") => {
                let response: PackageInstallPlanResponseV01 = serde_json::from_value(value)
                    .unwrap_or_else(|error| {
                        panic!(
                            "{} should parse as package install plan response: {error}",
                            file.display()
                        )
                    });
                validate_package_install_plan_response_v01(&response)
                    .unwrap_or_else(|error| panic!("{} should validate: {error}", file.display()));
                assert_eq!(response.schema, "skenion.package.install-plan.response");
                assert_eq!(response.schema_version, "0.1.0");
            }
            other => panic!("{} has unexpected schema {other:?}", file.display()),
        }
    }

    for file in fixture_files("../../fixtures/package/v0.1/invalid") {
        let document = fs::read(&file).expect("fixture should be readable");
        if file
            .file_name()
            .is_some_and(|name| name.to_string_lossy().ends_with(".package-root.json"))
        {
            serde_json::from_slice::<PackageRootDocumentV01>(&document)
                .expect_err("invalid package root fixture should fail to parse");
            continue;
        }

        let value: serde_json::Value = serde_json::from_slice(&document)
            .expect("invalid package fixture should parse as JSON");
        match value.get("schema").and_then(serde_json::Value::as_str) {
            Some("skenion.package.manifest") => {
                let manifest: PackageManifestV01 =
                    serde_json::from_value(value).unwrap_or_else(|error| {
                        panic!("{} should parse before validation: {error}", file.display())
                    });
                assert!(
                    validate_package_manifest_v01(&manifest).is_err(),
                    "{} should be invalid",
                    file.display()
                );
            }
            Some("skenion.package.listing") => {
                let listing = serde_json::from_value::<PackageListingV01>(value);
                if let Ok(listing) = listing {
                    assert!(
                        validate_package_listing_v01(&listing).is_err(),
                        "{} should be invalid",
                        file.display()
                    );
                }
            }
            Some("skenion.package.discovery") => {
                let response = serde_json::from_value::<PackageDiscoveryResponseV01>(value);
                if let Ok(response) = response {
                    assert!(
                        validate_package_discovery_response_v01(&response).is_err(),
                        "{} should be invalid",
                        file.display()
                    );
                }
            }
            Some("skenion.package.install-plan.request") => {
                let request = serde_json::from_value::<PackageInstallPlanRequestV01>(value);
                if let Ok(request) = request {
                    assert!(
                        validate_package_install_plan_request_v01(&request).is_err(),
                        "{} should be invalid",
                        file.display()
                    );
                }
            }
            Some("skenion.package.install-plan.response") => {
                let response = serde_json::from_value::<PackageInstallPlanResponseV01>(value);
                if let Ok(response) = response {
                    assert!(
                        validate_package_install_plan_response_v01(&response).is_err(),
                        "{} should be invalid",
                        file.display()
                    );
                }
            }
            other => panic!("{} has unexpected schema {other:?}", file.display()),
        }
    }
}

fn package_manifest_fixture(relative: &str) -> PackageManifestV01 {
    let file = Path::new(env!("CARGO_MANIFEST_DIR")).join(relative);
    serde_json::from_slice(&fs::read(&file).expect("package fixture should be readable"))
        .expect("package fixture should parse")
}

fn assert_package_manifest_error(
    mutate: impl FnOnce(&mut PackageManifestV01),
    expected_message: &str,
) {
    let mut manifest = package_manifest_fixture(
        "../../fixtures/package/v0.1/valid/patch-only.skenion.package.json",
    );
    mutate(&mut manifest);
    let report = validate_package_manifest_v01(&manifest)
        .expect_err("mutated package manifest should fail validation");
    assert!(
        report.to_string().contains(expected_message),
        "expected error containing {expected_message:?}, got {report}"
    );
}

#[test]
fn validates_package_manifest_semantic_branches() {
    assert_package_manifest_error(
        |manifest| manifest.schema = "skenion.extension.manifest".to_owned(),
        "expected schema skenion.package.manifest",
    );
    assert_package_manifest_error(
        |manifest| manifest.schema_version = "0.2.0".to_owned(),
        "expected schemaVersion 0.1.0",
    );
    assert_package_manifest_error(
        |manifest| manifest.id.clear(),
        "package id must not be empty",
    );
    assert_package_manifest_error(
        |manifest| manifest.id = "skenion.examples".to_owned(),
        "package id must match publisher/package",
    );
    assert_package_manifest_error(
        |manifest| manifest.version.clear(),
        "package version must not be empty",
    );
    assert_package_manifest_error(
        |manifest| manifest.checksums.clear(),
        "requires checksum references",
    );
    assert_package_manifest_error(
        |manifest| manifest.evidence.clear(),
        "requires evidence references",
    );

    assert_package_manifest_error(
        |manifest| manifest.runtime_abi_range = Some(">=0.45.0 <0.46.0".to_owned()),
        "patch package must not declare runtimeAbiRange",
    );
    assert_package_manifest_error(
        |manifest| {
            manifest.targets = vec![skenion_contracts::PackageTargetTripleV01::Aarch64AppleDarwin];
        },
        "patch package must not declare targets",
    );
    assert_package_manifest_error(
        |manifest| {
            let native_manifest = package_manifest_fixture(
                "../../fixtures/package/v0.1/valid/mixed-native.skenion.package.json",
            );
            manifest.native_artifacts = native_manifest.native_artifacts;
        },
        "patch package must not declare nativeArtifacts",
    );
    assert_package_manifest_error(
        |manifest| manifest.provides.patches[0].id = "example.bad_id".to_owned(),
        "without underscores",
    );
    assert_package_manifest_error(
        |manifest| {
            let mut provided = manifest.provides.patches[0].clone();
            provided.id = "example.bad_node".to_owned();
            manifest.provides.nodes.push(provided);
        },
        "provided node id must use lowercase dotted/hyphen grammar",
    );
    assert_package_manifest_error(
        |manifest| {
            let mut provided = manifest.provides.patches[0].clone();
            provided.id = "example.bad_resource".to_owned();
            manifest.provides.resources.push(provided);
        },
        "provided resource id must use lowercase dotted/hyphen grammar",
    );
    assert_package_manifest_error(
        |manifest| {
            let mut provided = manifest.provides.patches[0].clone();
            provided.id = "example.bad_help".to_owned();
            manifest.provides.help.push(provided);
        },
        "provided help id must use lowercase dotted/hyphen grammar",
    );

    let mut native_missing_targets = package_manifest_fixture(
        "../../fixtures/package/v0.1/valid/mixed-native.skenion.package.json",
    );
    native_missing_targets.targets.clear();
    let report = validate_package_manifest_v01(&native_missing_targets)
        .expect_err("native package without targets should fail validation");
    assert!(report.to_string().contains("requires targets"));
}

#[test]
fn validates_package_root_semantic_branches() {
    let patch_package = package_manifest_fixture(
        "../../fixtures/package/v0.1/valid/patch-only.skenion.package.json",
    );
    let mut root = PackageRootDocumentV01 {
        schema: "skenion.package.root".to_owned(),
        schema_version: "0.1.0".to_owned(),
        manifest_file_name: "skenion.package.json".to_owned(),
        manifest: patch_package,
    };

    root.schema = "skenion.package.directory".to_owned();
    let report = validate_package_root_v01(&root).expect_err("wrong root schema should fail");
    assert!(
        report
            .to_string()
            .contains("expected schema skenion.package.root")
    );

    root.schema = "skenion.package.root".to_owned();
    root.schema_version = "0.2.0".to_owned();
    let report = validate_package_root_v01(&root).expect_err("wrong root version should fail");
    assert!(report.to_string().contains("expected schemaVersion 0.1.0"));

    root.schema_version = "0.1.0".to_owned();
    root.manifest_file_name = "skenion.extension.json".to_owned();
    let report =
        validate_package_root_v01(&root).expect_err("wrong manifest file name should fail");
    assert!(report.to_string().contains("manifestFileName must be"));

    root.manifest_file_name = "skenion.package.json".to_owned();
    root.manifest.schema = "skenion.extension.manifest".to_owned();
    let report = validate_package_root_v01(&root).expect_err("invalid root manifest should fail");
    assert!(
        report
            .to_string()
            .contains("manifest expected schema skenion.package.manifest")
    );
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
fn validates_v01_node_definition_fixtures() {
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
fn validates_v01_project_patch_library_fixtures() {
    for file in fixture_files("../../fixtures/project/v0.1/valid") {
        let project: ProjectDocumentV01 =
            serde_json::from_slice(&fs::read(&file).expect("fixture should be readable"))
                .expect("valid v0.1 project fixture should parse");
        validate_project_document_v01(&project)
            .unwrap_or_else(|error| panic!("{} should be valid: {error}", file.display()));
    }

    for file in fixture_files("../../fixtures/project/v0.1/invalid") {
        let project: ProjectDocumentV01 =
            serde_json::from_slice(&fs::read(&file).expect("fixture should be readable"))
                .expect("invalid v0.1 project fixture should still parse");
        assert!(
            validate_project_document_v01(&project).is_err(),
            "{} should be invalid",
            file.display()
        );
    }
}

fn project_document_fixture(relative: &str) -> ProjectDocumentV01 {
    let file = Path::new(env!("CARGO_MANIFEST_DIR")).join(relative);
    serde_json::from_slice(&fs::read(&file).expect("project fixture should be readable"))
        .expect("project fixture should parse")
}

fn binding_diagnostic(
    code: ProjectObjectBindingDiagnosticCodeV01,
) -> ProjectObjectBindingDiagnosticV01 {
    ProjectObjectBindingDiagnosticV01 {
        severity: PackageDiagnosticSeverityV01::Warning,
        code,
        message: "coverage diagnostic".to_owned(),
        details: None,
    }
}

fn assert_project_document_error(project: &ProjectDocumentV01, expected_message: &str) {
    let report =
        validate_project_document_v01(project).expect_err("project should fail validation");
    assert!(
        report.to_string().contains(expected_message),
        "expected error containing {expected_message:?}, got {report}"
    );
}

#[test]
fn validates_project_package_lock_reference_failures() {
    for (fixture, expected) in [
        (
            "../../fixtures/project/v0.1/invalid/package-dependency-package-mismatch.project.json",
            "lockEntryId pkg-skenion-examples-0.45.0 points to package skenion/examples",
        ),
        (
            "../../fixtures/project/v0.1/invalid/package-provider-package-mismatch.project.json",
            "does not match lock entry package skenion/examples",
        ),
        (
            "../../fixtures/project/v0.1/invalid/package-dependency-version-out-of-range.project.json",
            "locked version 0.45.0 does not satisfy >=0.46.0 <0.47.0",
        ),
        (
            "../../fixtures/project/v0.1/invalid/native-lock-missing-artifact.project.json",
            "requires nativeArtifacts",
        ),
        (
            "../../fixtures/project/v0.1/invalid/resolved-binding-missing-target.project.json",
            "requires target",
        ),
        (
            "../../fixtures/project/v0.1/invalid/resolved-package-binding-missing-lock.project.json",
            "resolved object binding binding-resolved-missing-lock references missing lockEntryId",
        ),
        (
            "../../fixtures/project/v0.1/invalid/resolved-project-patch-binding-missing-patch.project.json",
            "resolved object binding binding-resolved-missing-patch references missing project patch",
        ),
    ] {
        let file = Path::new(env!("CARGO_MANIFEST_DIR")).join(fixture);
        let project: ProjectDocumentV01 =
            serde_json::from_slice(&fs::read(&file).expect("fixture should be readable"))
                .expect("invalid project package fixture should parse");
        let report = validate_project_document_v01(&project)
            .expect_err("invalid project package fixture should fail validation");
        assert!(
            report.to_string().contains(expected),
            "{} should include {expected:?}, got {report}",
            file.display()
        );
    }
}

#[test]
fn validates_project_package_missing_lock_references() {
    let file = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../fixtures/project/v0.1/valid/package-lock.project.json");
    let base_project: ProjectDocumentV01 =
        serde_json::from_slice(&fs::read(&file).expect("fixture should be readable"))
            .expect("project package lock fixture should parse");

    let mut missing_dependency_lock = base_project.clone();
    missing_dependency_lock.package_dependencies[0].lock_entry_id =
        "missing-dependency-lock".to_owned();
    let report = validate_project_document_v01(&missing_dependency_lock)
        .expect_err("missing dependency lock should fail validation");
    assert!(
        report
            .to_string()
            .contains("references missing lockEntryId: missing-dependency-lock")
    );

    let mut missing_resource_lock = base_project.clone();
    missing_resource_lock.resource_lock[0].lock_entry_id = "missing-resource-lock".to_owned();
    let report = validate_project_document_v01(&missing_resource_lock)
        .expect_err("missing resource lock should fail validation");
    assert!(
        report
            .to_string()
            .contains("references missing lockEntryId: missing-resource-lock")
    );

    validate_project_document_v01(&base_project)
        .expect("missing package-provider binding with diagnostics should remain valid");

    let mut missing_binding_ref = base_project;
    missing_binding_ref.graph.nodes[0].binding_ref = Some("missing-binding".to_owned());
    let report = validate_project_document_v01(&missing_binding_ref)
        .expect_err("missing node bindingRef should fail validation");
    assert!(
        report
            .to_string()
            .contains("node external-oscillator references missing bindingRef: missing-binding")
    );
}

#[test]
fn validates_project_package_and_binding_semantic_error_branches() {
    let base_project =
        project_document_fixture("../../fixtures/project/v0.1/valid/package-lock.project.json");
    let native_project = project_document_fixture(
        "../../fixtures/project/v0.1/valid/native-package-lock.project.json",
    );

    let mut invalid_patch_lock = base_project.clone();
    invalid_patch_lock.package_lock[0].package_id = "skenion.examples".to_owned();
    invalid_patch_lock.package_lock[0].runtime_abi_range = Some(">=0.45.0 <0.46.0".to_owned());
    invalid_patch_lock.package_lock[0].target = native_project.package_lock[0].target.clone();
    invalid_patch_lock.package_lock[0].native_artifacts =
        native_project.package_lock[0].native_artifacts.clone();
    let report = validate_project_document_v01(&invalid_patch_lock)
        .expect_err("invalid patch lock should fail validation");
    let text = report.to_string();
    assert!(text.contains("package lock pkg-skenion-examples-0.45.0 packageId must match"));
    assert!(text.contains(
        "patch package lock pkg-skenion-examples-0.45.0 must not declare runtimeAbiRange"
    ));
    assert!(
        text.contains("patch package lock pkg-skenion-examples-0.45.0 must not declare target")
    );
    assert!(text.contains(
        "patch package lock pkg-skenion-examples-0.45.0 must not declare nativeArtifacts"
    ));

    let mut native_missing_abi = native_project;
    native_missing_abi.package_lock[0].runtime_abi_range = None;
    assert_project_document_error(&native_missing_abi, "requires runtimeAbiRange");

    let mut invalid_dependency_id = base_project.clone();
    invalid_dependency_id.package_dependencies[0].package_id = "skenion.examples".to_owned();
    assert_project_document_error(
        &invalid_dependency_id,
        "package dependency packageId must match",
    );

    let mut invalid_resource_id = base_project.clone();
    invalid_resource_id.resource_lock[0].resource_id = "example.bad_id".to_owned();
    assert_project_document_error(
        &invalid_resource_id,
        "resourceId must use lowercase dotted/hyphen grammar",
    );

    for (status, expected) in [
        (
            ProjectObjectBindingStatusV01::Missing,
            "missing object binding binding-example-oscillator requires binding-target-missing diagnostic",
        ),
        (
            ProjectObjectBindingStatusV01::Stale,
            "stale object binding binding-example-oscillator requires stale or interface-drift diagnostic",
        ),
        (
            ProjectObjectBindingStatusV01::Unresolved,
            "unresolved object binding binding-example-oscillator requires binding-unresolved diagnostic",
        ),
        (
            ProjectObjectBindingStatusV01::Ambiguous,
            "ambiguous object binding binding-example-oscillator requires binding-ambiguous diagnostic",
        ),
    ] {
        let mut missing_diagnostic = base_project.clone();
        missing_diagnostic.object_bindings[0].status = status;
        missing_diagnostic.object_bindings[0].diagnostics.clear();
        assert_project_document_error(&missing_diagnostic, expected);
    }

    let mut missing_patch_binding = base_project.clone();
    {
        let binding = &mut missing_patch_binding.object_bindings[1];
        binding.status = ProjectObjectBindingStatusV01::Unresolved;
        binding.diagnostics = vec![binding_diagnostic(
            ProjectObjectBindingDiagnosticCodeV01::BindingUnresolved,
        )];
        match binding.target.as_mut().expect("project patch target") {
            ProjectObjectBindingTargetV01::ProjectPatch { patch_id, .. } => {
                *patch_id = "missing-wrapper".to_owned();
            }
            ProjectObjectBindingTargetV01::PackageProvider { .. } => {
                panic!("expected project patch binding")
            }
        }
    }
    assert_project_document_error(
        &missing_patch_binding,
        "object binding binding-local-wrapper references missing project patch: missing-wrapper",
    );

    let mut resolved_stale_revision = base_project.clone();
    match resolved_stale_revision.object_bindings[1]
        .target
        .as_mut()
        .expect("project patch target")
    {
        ProjectObjectBindingTargetV01::ProjectPatch { revision, .. } => {
            *revision = Some("2".to_owned());
        }
        ProjectObjectBindingTargetV01::PackageProvider { .. } => {
            panic!("expected project patch binding")
        }
    }
    assert_project_document_error(
        &resolved_stale_revision,
        "resolved object binding binding-local-wrapper project patch local_wrapper revision is stale",
    );

    let mut stale_revision_without_diagnostic = base_project.clone();
    {
        let binding = &mut stale_revision_without_diagnostic.object_bindings[1];
        binding.status = ProjectObjectBindingStatusV01::Stale;
        binding.diagnostics.clear();
        match binding.target.as_mut().expect("project patch target") {
            ProjectObjectBindingTargetV01::ProjectPatch { revision, .. } => {
                *revision = Some("2".to_owned());
            }
            ProjectObjectBindingTargetV01::PackageProvider { .. } => {
                panic!("expected project patch binding")
            }
        }
    }
    assert_project_document_error(
        &stale_revision_without_diagnostic,
        "object binding binding-local-wrapper project patch local_wrapper revision is stale without diagnostics",
    );

    let mut invalid_provider_ids = base_project.clone();
    match invalid_provider_ids.object_bindings[0]
        .target
        .as_mut()
        .expect("package provider target")
    {
        ProjectObjectBindingTargetV01::PackageProvider {
            package_id,
            provided_id,
            ..
        } => {
            *package_id = "skenion.examples".to_owned();
            *provided_id = "example.bad_id".to_owned();
        }
        ProjectObjectBindingTargetV01::ProjectPatch { .. } => {
            panic!("expected package provider binding")
        }
    }
    let report = validate_project_document_v01(&invalid_provider_ids)
        .expect_err("invalid package provider ids should fail validation");
    let text = report.to_string();
    assert!(text.contains("object binding binding-example-oscillator packageId must match"));
    assert!(text.contains("object binding binding-example-oscillator providedId must use lowercase dotted/hyphen grammar"));

    let mut unresolved_missing_lock = base_project;
    {
        let binding = &mut unresolved_missing_lock.object_bindings[0];
        binding.status = ProjectObjectBindingStatusV01::Unresolved;
        binding.diagnostics = vec![binding_diagnostic(
            ProjectObjectBindingDiagnosticCodeV01::BindingUnresolved,
        )];
        match binding.target.as_mut().expect("package provider target") {
            ProjectObjectBindingTargetV01::PackageProvider { lock_entry_id, .. } => {
                *lock_entry_id = "missing-package-lock".to_owned();
            }
            ProjectObjectBindingTargetV01::ProjectPatch { .. } => {
                panic!("expected package provider binding")
            }
        }
    }
    assert_project_document_error(
        &unresolved_missing_lock,
        "object binding binding-example-oscillator references missing lockEntryId: missing-package-lock",
    );
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
