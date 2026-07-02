use skenion_contracts::{
    AudioClockBridgeMethodV01, AudioClockDomainAuthorityV01, AudioClockDomainV01,
    CONTRACTS_COMPATIBILITY_LINE, CONTRACTS_COMPATIBILITY_RANGE, CONTRACTS_PACKAGE_VERSION,
    ClockAuthorityV01, ClockCapabilityV01, ClockTimeSignatureV01, CompatibilityMatrixV01,
    DataFlowV01, DataTypeV01, EndpointBindingValueFormatV01, ExtensionKindV01,
    ExtensionManifestV01, GraphCommandKindV01, GraphDocumentV01,
    GraphFragmentOutsideEndpointPolicyV01, GraphFragmentV01, GraphTargetRef, MessageAtomV01,
    MessageValueV01, MidiClockMessageKindV01, MidiClockMessageV01, MidiClockSnapshotV01,
    NodeCatalogDisplayPaletteV01, NodeCatalogDisplayV01, NodeCatalogEntryV01,
    NodeCatalogIssueSeverityV01, NodeCatalogIssueTargetV01, NodeCatalogIssueV01,
    NodeCatalogSnapshotV01, NodeDefinitionManifestV01, NumberRangeV01, ObjectProviderRefV01,
    ObjectSpecAtomV01, ObjectSpecParseResultV01, PackageCategoryV01, PackageDiscoveryResponseV01,
    PackageInstallPlanActionKindV01, PackageInstallPlanCheckStatusV01, PackageInstallPlanIntentV01,
    PackageInstallPlanIssueCodeV01, PackageInstallPlanRequestV01, PackageInstallPlanResponseV01,
    PackageInstallPlanTargetArchV01, PackageInstallPlanTargetOsV01, PackageListingArtifactKindV01,
    PackageListingIssueCodeV01, PackageListingObjectExportSummaryV01,
    PackageListingTargetSupportKindV01, PackageListingV01, PackageManifestV01,
    PackageObjectExportV01, PackageRootDocumentV01, PackageTargetTripleV01,
    PasteGraphFragmentRequest, PatchDefinitionV01, PatchPath, PortSpecV01, ProjectDocumentV01,
    RuntimeCommandAckPayloadV01, RuntimeCommandAckStatusV01, RuntimeControlEmittedEventV01,
    RuntimeControlEmittedPayloadV01, RuntimeGraphAppliedPayloadV01, RuntimeGraphCommandPayloadV01,
    RuntimeIssuePayloadV01, RuntimeIssueSeverityV01, RuntimeIssueV01, RuntimeNodeInputPayloadV01,
    RuntimeNodeInputV01, RuntimeRealtimeEnvelopeV01, RuntimeRealtimeFrameTypeV01,
    RuntimeSelectionUpdatePayloadV01, RuntimeSelectionUpdatedPayloadV01, RuntimeSessionLoadModeV01,
    RuntimeSessionLoadPreconditionV01, RuntimeSessionLoadRequestV01,
    SKENION_PACKAGE_MANIFEST_FILE_NAME, StringOrStringsV01, ValueFormatV01,
    ValueOccurrenceHeaderV01, ValuePayloadKindV01, ViewStateV01, analyze_graph_document_v01,
    analyze_graph_fragment_v01, apply_midi_clock_message_v01, compatible_data_types_v01,
    compute_node_catalog_revision_v01, compute_patch_interface_digest_v01,
    derive_patch_contract_v01, derive_patch_contracts_v01, derive_v0_compatibility_line,
    derive_v0_compatibility_range, is_message_value_port_type_v01, is_reserved_value_type_id_v01,
    is_same_v0_compatibility_line, is_valid_custom_value_type_id_v01,
    midi_clock_snapshot_to_clock_state_v01, parse_midi_clock_message_v01, parse_object_spec_v01,
    plan_audio_clock_bridge_v01, port_connection_policy_v01, port_type_accepts_v01,
    project_patch_node_definition_id_v01, sanitize_project_patch_id_v01,
    satisfies_v0_compatibility_range, type_label_v01, validate_compatibility_matrix_v01,
    validate_endpoint_binding_value_format_v01, validate_extension_manifest_v01,
    validate_graph_document_v01, validate_graph_fragment_v01, validate_node_catalog_snapshot_v01,
    validate_node_definition_v01, validate_object_spec_parse_result_v01,
    validate_package_discovery_response_v01, validate_package_install_plan_request_v01,
    validate_package_install_plan_response_v01, validate_package_listing_v01,
    validate_package_manifest_v01, validate_package_root_v01,
    validate_paste_graph_fragment_request, validate_project_document_v01,
    validate_runtime_graph_command_payload_v01, validate_runtime_node_input_payload_v01,
    validate_runtime_realtime_envelope_v01, validate_runtime_session_load_request_v01,
    validate_value_format_v01, validate_value_occurrence_header_v01,
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

fn port_spec(direction: &str, port_type: &str) -> PortSpecV01 {
    serde_json::from_value(serde_json::json!({
        "id": if direction == "output" { "out" } else { "in" },
        "direction": direction,
        "type": port_type
    }))
    .expect("port spec should parse")
}

fn graph_with_connection(source_type: &str, target_type: &str) -> GraphDocumentV01 {
    let mut target_port =
        serde_json::json!({ "id": "in", "direction": "input", "type": target_type });
    if target_type == "value.core.message" {
        target_port["messageKeys"] = serde_json::json!({
            "accepted": ["set", "bang"],
            "store": ["set"],
            "trigger": ["bang"]
        });
    }
    serde_json::from_value(serde_json::json!({
        "schema": "skenion.graph",
        "schemaVersion": "0.1.0",
        "id": "port-policy-test",
        "revision": "1",
        "nodes": [
            {
                "id": "source",
                "implementation": { "provider": { "kind": "core" }, "objectId": "source" },
                "objectSpec": "source",
                "params": {},
                "ports": [{ "id": "out", "direction": "output", "type": source_type }]
            },
            {
                "id": "target",
                "implementation": { "provider": { "kind": "core" }, "objectId": "target" },
                "objectSpec": "target",
                "params": {},
                "ports": [target_port]
            }
        ],
        "edges": [
            {
                "id": "edge_1",
                "source": { "nodeId": "source", "portId": "out" },
                "target": { "nodeId": "target", "portId": "in" }
            }
        ]
    }))
    .expect("graph should parse")
}

#[test]
fn serializes_optional_contract_fields_as_absent() {
    let mut number = data_type(DataFlowV01::Control, "value.core.float32");
    number.range = Some(NumberRangeV01 {
        min: Some(0.0),
        max: None,
        step: None,
    });
    let serialized_type = serde_json::to_value(&number).expect("type should serialize");

    assert_eq!(
        serialized_type,
        serde_json::json!({
            "flow": "control",
            "dataKind": "value.core.float32",
            "range": { "min": 0.0 }
        })
    );

    let graph: GraphDocumentV01 = serde_json::from_str(
        r#"{
          "schema": "skenion.graph",
          "schemaVersion": "0.1.0",
          "id": "serialize-graph",
          "revision": "1",
          "nodes": [
            {
              "id": "source",
              "implementation": { "provider": { "kind": "core" }, "objectId": "slider" },
              "params": {},
              "ports": [
                { "id": "out", "direction": "output", "type": "value.core.float64" }
              ]
            }
          ],
          "edges": []
        }"#,
    )
    .expect("graph should parse");
    let serialized_graph = serde_json::to_string(&graph).expect("graph should serialize");

    assert!(!serialized_graph.contains("null"));
    assert!(
        serialized_graph
            .contains(r#""implementation":{"provider":{"kind":"core"},"objectId":"slider"}"#)
    );
    assert!(serialized_graph.contains(r#""type":"value.core.float64""#));
    assert!(validate_graph_document_v01(&graph).is_ok());
}

#[test]
fn derives_public_contracts_compatibility_line_helpers() {
    let expected_line = derive_v0_compatibility_line(CONTRACTS_PACKAGE_VERSION)
        .expect("package version should define a v0 compatibility line");
    let expected_range = derive_v0_compatibility_range(CONTRACTS_PACKAGE_VERSION)
        .expect("package version should define a v0 compatibility range");

    assert_eq!(CONTRACTS_PACKAGE_VERSION, env!("CARGO_PKG_VERSION"));
    assert_eq!(CONTRACTS_COMPATIBILITY_LINE, expected_line);
    assert_eq!(CONTRACTS_COMPATIBILITY_RANGE, expected_range);
    assert_eq!(
        derive_v0_compatibility_line("0.44.0").as_deref(),
        Some("0.44")
    );
    assert_eq!(
        derive_v0_compatibility_range("0.44.33").as_deref(),
        Some(">=0.44.0 <0.45.0")
    );
    assert!(is_same_v0_compatibility_line("0.44.0", "0.44.33"));
    assert!(!is_same_v0_compatibility_line("0.44.33", "0.45.0"));
    assert!(satisfies_v0_compatibility_range(
        "0.44.33",
        ">=0.44.0 <0.45.0"
    ));
    assert!(!satisfies_v0_compatibility_range(
        "0.45.0",
        ">=0.44.0 <0.45.0"
    ));
}

#[test]
fn exposes_public_port_connection_policy_helpers() {
    let source = port_spec("output", "value.core.float32");
    let message_target = port_spec("input", "value.core.message");
    let bool_target = port_spec("input", "value.core.bool");
    let passive_source = port_spec("input", "value.core.float32");

    assert!(is_message_value_port_type_v01("value.core.float32"));
    assert!(!is_message_value_port_type_v01("value.acme.scalar"));
    assert!(port_type_accepts_v01(&source, &message_target));

    let message_policy = port_connection_policy_v01(&source, &message_target);
    assert!(message_policy.accepted);
    assert_eq!(message_policy.reason, "message-selector");
    assert_eq!(
        message_policy.effective_type.as_deref(),
        Some("value.core.float32")
    );

    let incompatible_policy = port_connection_policy_v01(&source, &bool_target);
    assert!(!incompatible_policy.accepted);
    assert_eq!(incompatible_policy.reason, "incompatible-type");

    let direction_policy = port_connection_policy_v01(&passive_source, &message_target);
    assert!(!direction_policy.accepted);
    assert_eq!(direction_policy.reason, "direction-mismatch");
}

#[test]
fn validates_value_type_namespace_policy() {
    assert!(is_reserved_value_type_id_v01("value.core.float32"));
    assert!(is_reserved_value_type_id_v01("value.media.video-frame"));
    assert!(is_valid_custom_value_type_id_v01("value.acme.scalar"));
    assert!(!is_valid_custom_value_type_id_v01("value.core.float32"));
    assert!(!is_valid_custom_value_type_id_v01(
        "value.media.video-frame"
    ));

    validate_graph_document_v01(&graph_with_connection(
        "value.core.float32",
        "value.core.message",
    ))
    .expect("message inlet should accept scalar value messages");
    validate_graph_document_v01(&graph_with_connection(
        "value.acme.scalar",
        "value.acme.scalar",
    ))
    .expect("custom provider value type should validate");

    let unknown_core = validate_graph_document_v01(&graph_with_connection(
        "value.core.scalar",
        "value.core.scalar",
    ))
    .expect_err("unknown value.core type should fail");
    assert!(unknown_core.to_string().contains("invalid-value-type"));

    let reserved_media = validate_graph_document_v01(&graph_with_connection(
        "value.media.video-frame",
        "value.media.video-frame",
    ))
    .expect_err("reserved value.media type should fail");
    assert!(reserved_media.to_string().contains("invalid-value-type"));
}

#[test]
fn parses_public_compatibility_matrix_contract() {
    let matrix: CompatibilityMatrixV01 = serde_json::from_str(include_str!(
        "../../../fixtures/compatibility-matrix/v0.1/valid/unequal-component-versions.compatibility-matrix.json"
    ))
    .expect("compatibility matrix should parse");

    validate_compatibility_matrix_v01(&matrix).expect("compatibility matrix should validate");
    assert_eq!(matrix.schema, "skenion.compatibility-matrix");
    assert_eq!(matrix.contracts_line, "0.45");
    assert_eq!(matrix.protocol_baselines.runtime_http, "v0");
    assert_eq!(matrix.components.contracts.npm.version, "0.45.0");
    assert_eq!(matrix.components.runtime.version, "0.44.2");
    assert_eq!(matrix.components.sdk.npm.version, "0.17.0");
    assert_eq!(matrix.components.studio.version, "0.44.5");

    let mut incompatible_sdk_range = serde_json::to_value(&matrix).expect("matrix to value");
    incompatible_sdk_range["components"]["sdk"]["supported-contracts-range"] =
        serde_json::json!(">=0.44.0 <0.45.0");
    let incompatible_sdk_range: CompatibilityMatrixV01 =
        serde_json::from_value(incompatible_sdk_range).expect("matrix should parse");
    let incompatible_sdk_range_report = validate_compatibility_matrix_v01(&incompatible_sdk_range)
        .expect_err("incompatible SDK range should fail");
    assert!(
        incompatible_sdk_range_report
            .errors()
            .iter()
            .any(|error| error.message.contains("supported-contracts-range"))
    );

    let mut artifact_surface = serde_json::to_value(&matrix).expect("matrix to value");
    artifact_surface["components"]["runtime"]["assets"] = serde_json::json!({});
    artifact_surface["verification"] = serde_json::json!({ "expected-checksums": {} });
    serde_json::from_value::<CompatibilityMatrixV01>(artifact_surface)
        .expect_err("release artifact verifier fields should not parse");
}

#[test]
fn validates_public_runtime_session_load_request_contract() {
    let load_if_empty: RuntimeSessionLoadRequestV01 = serde_json::from_str(include_str!(
        "../../../fixtures/runtime/v0.1/valid/load-if-empty.skenion.runtime-session-load-request.json"
    ))
    .expect("loadIfEmpty request should parse");
    validate_runtime_session_load_request_v01(&load_if_empty)
        .expect("loadIfEmpty request should validate");
    assert!(matches!(
        load_if_empty.mode,
        RuntimeSessionLoadModeV01::LoadIfEmpty
    ));

    let replace_if_match: RuntimeSessionLoadRequestV01 = serde_json::from_str(include_str!(
        "../../../fixtures/runtime/v0.1/valid/replace-if-match.skenion.runtime-session-load-request.json"
    ))
    .expect("replaceIfMatch request should parse");
    validate_runtime_session_load_request_v01(&replace_if_match)
        .expect("replaceIfMatch request should validate");
    assert!(matches!(
        replace_if_match.mode,
        RuntimeSessionLoadModeV01::ReplaceIfMatch
    ));
    assert_eq!(
        replace_if_match
            .precondition
            .as_ref()
            .and_then(|precondition| precondition.document_id.as_deref()),
        Some("00000000-0000-4000-8000-000000000101")
    );

    let invalid_project: ProjectDocumentV01 = serde_json::from_str(include_str!(
        "../../../fixtures/project/v0.1/invalid/duplicate-boundary-port-id.project.json"
    ))
    .expect("semantic invalid project should parse");
    let mut invalid_request = load_if_empty.clone();
    invalid_request.schema = "skenion.project".to_owned();
    invalid_request.schema_version = "0.2.0".to_owned();
    invalid_request.project = invalid_project;
    invalid_request.mode = RuntimeSessionLoadModeV01::ReplaceIfMatch;
    invalid_request.precondition = None;
    let invalid_report = validate_runtime_session_load_request_v01(&invalid_request)
        .expect_err("invalid request should fail");
    let invalid_text = invalid_report.to_string();
    assert!(invalid_text.contains("expected schema skenion.runtime.session-load-request"));
    assert!(invalid_text.contains("expected schemaVersion 0.1.0"));
    assert!(invalid_text.contains("project duplicate boundary port id"));
    assert!(invalid_text.contains("replaceIfMatch requires precondition"));

    let mut empty_precondition_request = load_if_empty.clone();
    empty_precondition_request.precondition = Some(RuntimeSessionLoadPreconditionV01 {
        document_id: None,
        session_revision: None,
        graph_revision: None,
    });
    let empty_precondition_report =
        validate_runtime_session_load_request_v01(&empty_precondition_request)
            .expect_err("empty precondition should fail");
    assert!(
        empty_precondition_report
            .to_string()
            .contains("precondition must not be empty")
    );

    let mut malformed_precondition_request = load_if_empty.clone();
    malformed_precondition_request.mode = RuntimeSessionLoadModeV01::ForceReplace;
    malformed_precondition_request.precondition = Some(RuntimeSessionLoadPreconditionV01 {
        document_id: Some("00000000_0000-4000-8000-000000000101".to_owned()),
        session_revision: Some(String::new()),
        graph_revision: Some(String::new()),
    });
    let malformed_precondition_report =
        validate_runtime_session_load_request_v01(&malformed_precondition_request)
            .expect_err("malformed precondition should fail");
    let malformed_precondition_text = malformed_precondition_report.to_string();
    assert!(malformed_precondition_text.contains("documentId must be a UUID"));
    assert!(malformed_precondition_text.contains("sessionRevision must not be empty"));
    assert!(malformed_precondition_text.contains("graphRevision must not be empty"));

    let mut non_hex_document_id_request = load_if_empty;
    non_hex_document_id_request.precondition = Some(RuntimeSessionLoadPreconditionV01 {
        document_id: Some("00000000-0000-4000-8000-00000000010z".to_owned()),
        session_revision: None,
        graph_revision: None,
    });
    let non_hex_document_id_report =
        validate_runtime_session_load_request_v01(&non_hex_document_id_request)
            .expect_err("non-hex documentId should fail");
    assert!(
        non_hex_document_id_report
            .to_string()
            .contains("documentId must be a UUID")
    );
}

fn runtime_float_message(value: f64) -> MessageValueV01 {
    MessageValueV01 {
        key: "float".to_owned(),
        atoms: vec![MessageAtomV01::Float {
            representation: "f32".to_owned(),
            value,
        }],
    }
}

fn runtime_envelope(
    message_type: RuntimeRealtimeFrameTypeV01,
    payload: serde_json::Value,
) -> RuntimeRealtimeEnvelopeV01 {
    RuntimeRealtimeEnvelopeV01 {
        schema: "skenion.runtime.realtime".to_owned(),
        schema_version: "0.1.0".to_owned(),
        message_type,
        message_id: "runtime-realtime-message".to_owned(),
        session_id: "default".to_owned(),
        connection_id: None,
        client_id: None,
        window_id: None,
        command_id: None,
        correlation_id: None,
        idempotency_key: None,
        sequence: None,
        cursor: None,
        created_at: None,
        payload,
    }
}

#[test]
fn validates_public_runtime_realtime_transport_contract() {
    let graph_payload = RuntimeGraphCommandPayloadV01 {
        kind: GraphCommandKindV01::NodeCreate,
        base_session_revision: None,
        base_graph_revision: None,
        base_view_revision: None,
        target: None,
        surface_path: None,
        view_patch: None,
        changes: None,
        object_spec: Some("float".to_owned()),
        node_id: None,
        requested_node_id: Some("float_1".to_owned()),
        view: None,
        params: None,
        request: None,
        scope: None,
        unresolved_policy: None,
        interface_incident_edge_policy: None,
        description: None,
    };
    validate_runtime_graph_command_payload_v01(&graph_payload)
        .expect("graph command payload should validate");
    validate_runtime_realtime_envelope_v01(&runtime_envelope(
        RuntimeRealtimeFrameTypeV01::GraphCommand,
        serde_json::to_value(&graph_payload).expect("graph payload value"),
    ))
    .expect("graph.command envelope should validate");

    let node_input_payload = RuntimeNodeInputPayloadV01 {
        inputs: vec![
            RuntimeNodeInputV01 {
                node_id: "float_1".to_owned(),
                port_id: "in".to_owned(),
                message: runtime_float_message(2.0),
            },
            RuntimeNodeInputV01 {
                node_id: "float_1".to_owned(),
                port_id: "in".to_owned(),
                message: runtime_float_message(3.0),
            },
        ],
    };
    validate_runtime_node_input_payload_v01(&node_input_payload)
        .expect("node.input payload should validate");
    let mut node_input = runtime_envelope(
        RuntimeRealtimeFrameTypeV01::NodeInput,
        serde_json::to_value(&node_input_payload).expect("node input payload value"),
    );
    node_input.command_id = Some("input-1".to_owned());
    node_input.idempotency_key = Some("input-1".to_owned());
    validate_runtime_realtime_envelope_v01(&node_input)
        .expect("node.input envelope should validate");

    validate_runtime_realtime_envelope_v01(&runtime_envelope(
        RuntimeRealtimeFrameTypeV01::CommandAck,
        serde_json::to_value(RuntimeCommandAckPayloadV01 {
            status: RuntimeCommandAckStatusV01::Accepted,
            accepted: true,
            applied: Some(false),
            conflict: Some(false),
            cached: None,
            kind: Some("node.input".to_owned()),
            command_id: None,
            correlation_id: None,
            idempotency_key: None,
            event_cursor: None,
            graph_sequence: None,
            target: None,
            surface_path: None,
            base_session_revision: None,
            base_graph_revision: None,
            base_view_revision: None,
            session_revision: None,
            graph_revision: None,
            view_revision: None,
            history_summary: None,
            node: None,
            operation: None,
            issues: Vec::new(),
        })
        .expect("ack payload value"),
    ))
    .expect("command.ack envelope should validate");

    validate_runtime_realtime_envelope_v01(&runtime_envelope(
        RuntimeRealtimeFrameTypeV01::GraphApplied,
        serde_json::to_value(RuntimeGraphAppliedPayloadV01 {
            kind: GraphCommandKindV01::NodeCreate,
            command_id: None,
            correlation_id: None,
            idempotency_key: None,
            graph_sequence: Some(7),
            target: None,
            surface_path: None,
            node: None,
            operation: None,
            session_revision: None,
            graph_revision: None,
            view_revision: None,
            history_entry_id: None,
            issues: Vec::new(),
            replayed: Some(false),
        })
        .expect("graph applied payload value"),
    ))
    .expect("graph.applied envelope should validate");

    validate_runtime_realtime_envelope_v01(&runtime_envelope(
        RuntimeRealtimeFrameTypeV01::ControlEmitted,
        serde_json::to_value(RuntimeControlEmittedPayloadV01 {
            command_id: None,
            correlation_id: None,
            idempotency_key: None,
            control_sequence: Some(8),
            control_revision: None,
            changed: Some(true),
            events: vec![RuntimeControlEmittedEventV01 {
                node_id: "float_1".to_owned(),
                port_id: "value".to_owned(),
                message: runtime_float_message(3.0),
            }],
            values: None,
            issues: Vec::new(),
            replayed: Some(false),
        })
        .expect("control emitted payload value"),
    ))
    .expect("control.emitted envelope should validate");

    let mut selection_update = runtime_envelope(
        RuntimeRealtimeFrameTypeV01::SelectionUpdate,
        serde_json::to_value(RuntimeSelectionUpdatePayloadV01 {
            target: serde_json::json!({ "kind": "root" }),
            selection: serde_json::json!({ "nodes": [] }),
            cursor: None,
            ttl_ms: Some(30_000),
        })
        .expect("selection update payload value"),
    );
    selection_update.command_id = Some("selection-1".to_owned());
    selection_update.idempotency_key = Some("selection-1".to_owned());
    validate_runtime_realtime_envelope_v01(&selection_update)
        .expect("selection.update envelope should validate");

    validate_runtime_realtime_envelope_v01(&runtime_envelope(
        RuntimeRealtimeFrameTypeV01::SelectionUpdated,
        serde_json::to_value(RuntimeSelectionUpdatedPayloadV01 {
            target: serde_json::json!({ "kind": "root" }),
            selection: serde_json::json!({ "nodes": [] }),
            cursor: None,
            ttl_ms: Some(30_000),
            participant_id: "participant-1".to_owned(),
            updated_at: "2026-07-02T00:00:00.000Z".to_owned(),
            replayed: Some(false),
        })
        .expect("selection updated payload value"),
    ))
    .expect("selection.updated envelope should validate");

    validate_runtime_realtime_envelope_v01(&runtime_envelope(
        RuntimeRealtimeFrameTypeV01::RuntimeIssue,
        serde_json::to_value(RuntimeIssuePayloadV01 {
            issue: RuntimeIssueV01 {
                severity: RuntimeIssueSeverityV01::Error,
                code: "runtime.test".to_owned(),
                message: "test issue".to_owned(),
                details: None,
            },
        })
        .expect("runtime issue payload value"),
    ))
    .expect("runtime.issue envelope should validate");

    for removed_type in [
        "graph.ack",
        "runtime.error",
        "control.command",
        "presence.update",
        "presence.updated",
    ] {
        serde_json::from_value::<RuntimeRealtimeEnvelopeV01>(serde_json::json!({
            "schema": "skenion.runtime.realtime",
            "schemaVersion": "0.1.0",
            "type": removed_type,
            "messageId": "removed-frame",
            "sessionId": "default",
            "payload": {}
        }))
        .expect_err("removed frame type should fail public DTO parsing");
    }

    serde_json::from_value::<RuntimeGraphCommandPayloadV01>(serde_json::json!({
        "kind": "node.input",
        "nodeId": "float_1",
        "portId": "in",
        "message": serde_json::to_value(runtime_float_message(2.0)).expect("message")
    }))
    .expect_err("node.input must not parse as graph.command payload");

    let empty_batch = RuntimeNodeInputPayloadV01 { inputs: Vec::new() };
    let empty_batch_report = validate_runtime_node_input_payload_v01(&empty_batch)
        .expect_err("empty node.input batch should fail");
    assert!(
        empty_batch_report
            .to_string()
            .contains("inputs must not be empty")
    );

    serde_json::from_value::<RuntimeNodeInputPayloadV01>(serde_json::json!({
        "inputs": [{
            "nodeId": "float_1",
            "portId": "in",
            "message": { "selector": "float", "atoms": [] }
        }]
    }))
    .expect_err("node.input message must use key, not selector");

    serde_json::from_value::<RuntimeNodeInputPayloadV01>(serde_json::json!({
        "inputs": [{
            "nodeId": "float_1",
            "portId": "in",
            "message": { "key": "float", "selector": "float", "atoms": [] }
        }]
    }))
    .expect_err("node.input message must not accept selector alias");

    let selector_control_emitted = runtime_envelope(
        RuntimeRealtimeFrameTypeV01::ControlEmitted,
        serde_json::json!({
            "events": [{
                "nodeId": "float_1",
                "portId": "value",
                "message": { "selector": "float", "atoms": [] }
            }],
            "issues": []
        }),
    );
    validate_runtime_realtime_envelope_v01(&selector_control_emitted)
        .expect_err("control.emitted message must use key, not selector");

    let key_plus_selector_control_emitted = runtime_envelope(
        RuntimeRealtimeFrameTypeV01::ControlEmitted,
        serde_json::json!({
            "events": [{
                "nodeId": "float_1",
                "portId": "value",
                "message": { "key": "float", "selector": "float", "atoms": [] }
            }],
            "issues": []
        }),
    );
    validate_runtime_realtime_envelope_v01(&key_plus_selector_control_emitted)
        .expect_err("control.emitted message must not accept selector alias");

    let missing_command_metadata = runtime_envelope(
        RuntimeRealtimeFrameTypeV01::NodeInput,
        serde_json::to_value(&node_input_payload).expect("node input payload value"),
    );
    let missing_command_metadata_report =
        validate_runtime_realtime_envelope_v01(&missing_command_metadata)
            .expect_err("node.input command metadata should be required");
    let text = missing_command_metadata_report.to_string();
    assert!(text.contains("requires commandId"));
    assert!(text.contains("requires idempotencyKey"));
}

#[test]
fn validates_public_value_format_and_occurrence_primitives() {
    let tensor_format: ValueFormatV01 = serde_json::from_value(serde_json::json!({
        "valueTypeId": "value.core.tensor",
        "format": "rgba8unorm",
        "shape": [1080, 1920, 4],
        "layout": "row-major",
        "colorSpace": "srgb",
        "alphaPolicy": "premultiplied"
    }))
    .expect("tensor value format should parse");
    validate_value_format_v01(&tensor_format).expect("tensor value format should validate");

    let custom_format: ValueFormatV01 = serde_json::from_value(serde_json::json!({
        "valueTypeId": "value.mike32.selector",
        "format": "mike32.selector.v1"
    }))
    .expect("custom value format should parse");
    validate_value_format_v01(&custom_format)
        .expect("custom provider value format should validate");

    for invalid in [
        serde_json::json!({ "valueTypeId": "value.media.video-frame", "format": "rgba8unorm", "shape": [1, 1, 4] }),
        serde_json::json!({ "valueTypeId": "value.core.tensor", "format": "rgba8unorm", "shape": [] }),
        serde_json::json!({ "valueTypeId": "value.core.float32", "format": "i32" }),
        serde_json::json!({ "valueTypeId": "value.core.bang", "format": "f32" }),
    ] {
        let invalid: ValueFormatV01 =
            serde_json::from_value(invalid).expect("invalid semantic value format should parse");
        validate_value_format_v01(&invalid)
            .expect_err("invalid semantic value format should fail validation");
    }

    let digest = "a".repeat(64);
    let binding: EndpointBindingValueFormatV01 = serde_json::from_value(serde_json::json!({
        "bindingId": "edge_1",
        "bindingEpoch": 1,
        "formatRevision": 2,
        "formatDigest": digest,
        "valueFormat": {
            "valueTypeId": "value.core.matrix",
            "format": "f32",
            "shape": [128, 2],
            "sampleRate": 48000,
            "channels": 2,
            "layout": "interleaved"
        },
        "source": { "nodeId": "source_1", "portId": "out" },
        "target": { "nodeId": "target_1", "portId": "in" },
        "delivery": { "policy": "ordered", "maxInFlight": 2 }
    }))
    .expect("binding value format should parse");
    validate_endpoint_binding_value_format_v01(&binding)
        .expect("binding value format should validate");

    let stale_binding: EndpointBindingValueFormatV01 = serde_json::from_value(serde_json::json!({
        "bindingId": "edge_1",
        "bindingEpoch": 0,
        "formatRevision": 0,
        "formatDigest": "not-sha",
        "valueFormat": { "valueTypeId": "value.core.float32", "format": "f32" }
    }))
    .expect("stale binding should parse");
    let stale_report = validate_endpoint_binding_value_format_v01(&stale_binding)
        .expect_err("stale binding should fail semantic validation");
    assert!(
        stale_report
            .errors()
            .iter()
            .any(|error| error.message.contains("bindingEpoch"))
    );
    assert!(
        stale_report
            .errors()
            .iter()
            .any(|error| error.message.contains("formatRevision"))
    );

    let occurrence: ValueOccurrenceHeaderV01 = serde_json::from_value(serde_json::json!({
        "bindingId": "edge_1",
        "bindingEpoch": 1,
        "formatRevision": 2,
        "sequence": 0,
        "clock": "render-frame",
        "timestamp": 12,
        "payloadKind": "bytes",
        "byteLength": 4096,
        "byteOffset": 0,
        "actualShape": [32, 32, 4],
        "flags": ["keyframe"]
    }))
    .expect("occurrence header should parse");
    validate_value_occurrence_header_v01(&occurrence).expect("occurrence header should validate");

    let invalid_occurrence = ValueOccurrenceHeaderV01 {
        binding_id: "edge_1".to_owned(),
        binding_epoch: 1,
        format_revision: 0,
        sequence: 0,
        clock: None,
        timestamp: None,
        payload_kind: ValuePayloadKindV01::Empty,
        byte_length: Some(1),
        byte_offset: None,
        actual_shape: None,
        flags: None,
        dropped_before: None,
        duration: None,
    };
    let occurrence_report = validate_value_occurrence_header_v01(&invalid_occurrence)
        .expect_err("invalid occurrence should fail");
    assert!(
        occurrence_report
            .errors()
            .iter()
            .any(|error| error.message.contains("formatRevision"))
    );
    assert!(
        occurrence_report
            .errors()
            .iter()
            .any(|error| error.message.contains("byteLength is not allowed"))
    );
}

#[test]
fn parses_public_graph_fragment_paste_request_payload() {
    let request: PasteGraphFragmentRequest = serde_json::from_str(
        r#"{
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
                "implementation": { "provider": { "kind": "core" }, "objectId": "float" },
                "params": {},
                "ports": [
                  { "id": "out", "direction": "output", "type": "value.core.float64" }
                ]
              }
            ],
            "edges": []
          },
          "placement": { "kind": "position", "x": 10, "y": 20 },
          "options": {
            "outsideEndpointPolicy": "reject",
            "idConflictPolicy": "remap",
            "interfaceIncidentEdgePolicy": "reject",
            "preserveRelativePositions": true
          }
        }"#,
    )
    .expect("paste request should parse");

    validate_paste_graph_fragment_request(&request).expect("paste request should validate");
    assert_eq!(request.target.base_revision, "1");

    let mut invalid_base_revision = request.clone();
    invalid_base_revision.target.base_revision = String::new();
    let invalid_base_revision_report =
        validate_paste_graph_fragment_request(&invalid_base_revision)
            .expect_err("empty paste target baseRevision should fail validation");
    assert!(
        invalid_base_revision_report
            .to_string()
            .contains("target.baseRevision")
    );

    let mut invalid_path_version = request.clone();
    invalid_path_version.target = GraphTargetRef {
        path: PatchPath::PackagePatchDefinition {
            package_id: "example.package".to_owned(),
            patch_id: "main".to_owned(),
            version: Some(String::new()),
        },
        base_revision: "1".to_owned(),
        target_revision: None,
    };
    let invalid_path_version_report = validate_paste_graph_fragment_request(&invalid_path_version)
        .expect_err("empty paste target optional path field should fail validation");
    assert!(
        invalid_path_version_report
            .to_string()
            .contains("target.path.version")
    );

    for path in [
        PatchPath::ProjectPatchDefinition {
            patch_id: "project-patch".to_owned(),
        },
        PatchPath::PackagePatchDefinition {
            package_id: "example/package".to_owned(),
            patch_id: "main".to_owned(),
            version: Some("0.1.0".to_owned()),
        },
        PatchPath::EmbeddedPatchInstance {
            owner_path: vec!["root".to_owned(), "parent".to_owned()],
            node_id: "subpatch_1".to_owned(),
        },
        PatchPath::HelpWorkingCopy {
            working_copy_id: "help-copy-1".to_owned(),
            source_package_id: Some("skenion/core".to_owned()),
            source_patch_id: Some("object.core.float.help".to_owned()),
        },
    ] {
        let mut variant_request = request.clone();
        variant_request.target = GraphTargetRef {
            path,
            base_revision: "1".to_owned(),
            target_revision: Some("2".to_owned()),
        };
        validate_paste_graph_fragment_request(&variant_request)
            .expect("paste target path variant should validate");
    }

    let fragment: &GraphFragmentV01 = &request.fragment;
    let analysis =
        analyze_graph_fragment_v01(fragment, GraphFragmentOutsideEndpointPolicyV01::Reject);
    assert!(analysis.ok);
    validate_graph_fragment_v01(fragment).expect("fragment should validate");
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
            { "id": "out", "direction": "output", "type": "value.core.bang" }
          ],
          "execution": { "model": "script_control" },
          "state": { "persistent": false },
          "permissions": ["network"],
          "capabilities": []
        }"#,
    )
    .expect("definition should parse");

    let error = validate_node_definition_v01(&definition).expect_err("definition should fail");
    assert!(error.errors().len() >= 3);
    assert!(error.to_string().contains("wrong.node.definition"));

    let duplicate_ports: NodeDefinitionManifestV01 = serde_json::from_str(
        r#"{
          "schema": "skenion.node.definition",
          "schemaVersion": "0.1.0",
          "id": "core.duplicate-port",
          "version": "0.1.0",
          "displayName": "Duplicate Port",
          "category": "Core",
          "ports": [
            { "id": "value", "direction": "input", "type": "value.core.float64" },
            { "id": "value", "direction": "output", "type": "value.core.float64" }
          ],
          "execution": { "model": "control" },
          "state": { "persistent": false },
          "permissions": [],
          "capabilities": []
        }"#,
    )
    .expect("duplicate port definition should parse");
    let duplicate_report =
        validate_node_definition_v01(&duplicate_ports).expect_err("duplicate port should fail");
    assert!(duplicate_report.to_string().contains("duplicate port id"));
}

#[test]
fn parses_extension_manifest_contract_surface() {
    let manifest: ExtensionManifestV01 = serde_json::from_str(
        r#"{
          "schema": "skenion.extension.manifest",
          "schemaVersion": "0.1.0",
          "id": "skenion/core",
          "version": "0.1.0",
          "runtimeAbiVersion": "0.1.0",
          "kind": "core-package",
          "provides": {
            "help": [
              { "nodeId": "object.core.float", "markdownPath": "help/float.md" }
            ]
          },
          "permissions": [],
          "tests": [
            { "id": "float-baseline", "kind": "node", "target": "object.core.float", "fixturePath": "tests/float.input.json" }
          ]
        }"#,
    )
    .expect("extension manifest should parse");

    assert_eq!(manifest.kind, ExtensionKindV01::CorePackage);
    assert_eq!(manifest.provides.help[0].node_id, "object.core.float");
    assert_eq!(manifest.tests[0].id, "float-baseline");
}

#[test]
fn validates_current_extension_manifest_contract_surface() {
    let manifest: ExtensionManifestV01 = serde_json::from_str(include_str!(
        "../../../fixtures/extension/v0.1/valid/minimal-native-extension.manifest.json"
    ))
    .expect("current extension manifest should parse");

    validate_extension_manifest_v01(&manifest).expect("current extension manifest should validate");

    assert_eq!(manifest.kind, ExtensionKindV01::NativeRuntime);
    assert_eq!(manifest.provides.nodes[0].schema_version, "0.1.0");
    assert_eq!(manifest.provides.help[0].node_id, "example.sensor-reading");

    let legacy_node_manifest: ExtensionManifestV01 = serde_json::from_str(include_str!(
        "../../../fixtures/extension/v0.1/invalid/legacy-node.manifest.json"
    ))
    .expect("manifest should parse before semantic validation");
    let report = validate_extension_manifest_v01(&legacy_node_manifest)
        .expect_err("legacy provided node should fail current validation");

    assert!(report.to_string().contains("expected schemaVersion 0.1.0"));
}

#[test]
fn validates_public_package_manifest_contract_surface() {
    let patch_package: PackageManifestV01 = serde_json::from_str(include_str!(
        "../../../fixtures/package/v0.1/valid/patch-only.skenion.package.json"
    ))
    .expect("patch package manifest should parse");

    validate_package_manifest_v01(&patch_package).expect("patch package should validate");
    assert_eq!(patch_package.schema, "skenion.package.manifest");
    assert_eq!(patch_package.category, PackageCategoryV01::Patch);
    assert!(patch_package.runtime_abi_range.is_none());
    assert!(patch_package.native_artifacts.is_empty());
    assert_eq!(patch_package.provides.patches[0].id, "example.oscillator");
    assert_eq!(
        patch_package.issues[0].details.as_ref().expect("details")["fileName"],
        SKENION_PACKAGE_MANIFEST_FILE_NAME
    );

    let mut package_with_prerelease_build = patch_package.clone();
    package_with_prerelease_build.version = "0.45.0-alpha.1+build.1".to_owned();
    validate_package_manifest_v01(&package_with_prerelease_build)
        .expect("package version with prerelease and build metadata should validate");

    let mut package_with_empty_build = patch_package.clone();
    package_with_empty_build.version = "0.45.0+".to_owned();
    let package_with_empty_build_report = validate_package_manifest_v01(&package_with_empty_build)
        .expect_err("package version with empty build metadata should fail");
    assert!(
        package_with_empty_build_report
            .to_string()
            .contains("SemVer")
    );

    let mixed_package: PackageManifestV01 = serde_json::from_str(include_str!(
        "../../../fixtures/package/v0.1/valid/mixed-native.skenion.package.json"
    ))
    .expect("mixed package manifest should parse");
    validate_package_manifest_v01(&mixed_package).expect("mixed package should validate");
    assert_eq!(mixed_package.category, PackageCategoryV01::Mixed);
    assert_eq!(
        mixed_package.runtime_abi_range.as_deref(),
        Some(">=0.45.0 <0.46.0")
    );
    assert_eq!(mixed_package.native_artifacts.len(), 1);
    assert_eq!(mixed_package.provides.nodes[0].id, "example.sensor-reading");
    assert_eq!(
        mixed_package.provides.objects[0].object_id,
        "example.sensor-native"
    );
    assert_eq!(
        mixed_package.provides.objects[0].primary_object_spec,
        "sensor"
    );
    assert_eq!(
        mixed_package.provides.objects[0].aliases,
        vec!["native-sensor".to_owned()]
    );
    assert_eq!(
        mixed_package.provides.objects[0].definition_path,
        "nodes/example.sensor-reading.node.json"
    );

    let public_object_export = PackageObjectExportV01 {
        object_id: "example.public-object".to_owned(),
        primary_object_spec: "public-object".to_owned(),
        aliases: vec!["public-alias".to_owned()],
        definition_path: "nodes/example.public-object.node.json".to_owned(),
        description: None,
        help_id: None,
    };
    let public_listing_object_export = PackageListingObjectExportSummaryV01 {
        object_id: public_object_export.object_id.clone(),
        primary_object_spec: public_object_export.primary_object_spec.clone(),
        aliases: public_object_export.aliases.clone(),
        definition_path: public_object_export.definition_path.clone(),
        description: None,
        help_id: None,
    };
    assert_eq!(
        public_listing_object_export.primary_object_spec,
        "public-object"
    );

    let root = PackageRootDocumentV01 {
        schema: "skenion.package.root".to_owned(),
        schema_version: "0.1.0".to_owned(),
        manifest_file_name: SKENION_PACKAGE_MANIFEST_FILE_NAME.to_owned(),
        manifest: patch_package,
    };
    validate_package_root_v01(&root).expect("package root should validate");

    let native_missing_evidence: PackageManifestV01 = serde_json::from_str(include_str!(
        "../../../fixtures/package/v0.1/invalid/native-missing-evidence.skenion.package.json"
    ))
    .expect("native package should parse before semantic validation");
    let missing_evidence_report = validate_package_manifest_v01(&native_missing_evidence)
        .expect_err("native package with missing evidence should fail");
    assert!(
        missing_evidence_report
            .to_string()
            .contains("missing evidence")
    );

    let extension_as_package: Result<PackageManifestV01, _> = serde_json::from_str(include_str!(
        "../../../fixtures/extension/v0.1/valid/minimal-native-extension.manifest.json"
    ));
    assert!(extension_as_package.is_err());

    let both_manifest_root: Result<PackageRootDocumentV01, _> = serde_json::from_str(include_str!(
        "../../../fixtures/package/v0.1/invalid/both-manifests.package-root.json"
    ));
    assert!(both_manifest_root.is_err());

    let project: ProjectDocumentV01 = serde_json::from_str(include_str!(
        "../../../fixtures/project/v0.1/valid/package-lock.project.json"
    ))
    .expect("project with package lock should parse");
    validate_project_document_v01(&project).expect("project package refs should validate");
    assert_eq!(
        project.package_dependencies[0].lock_entry_id,
        "pkg-skenion-examples-0.45.0"
    );
    assert_eq!(
        project.object_bindings[0]
            .implementation
            .as_ref()
            .and_then(|implementation| match &implementation.provider {
                ObjectProviderRefV01::Package {
                    lock_entry_id: Some(lock_entry_id),
                    ..
                } => Some(lock_entry_id.as_str()),
                _ => None,
            }),
        Some("pkg-skenion-examples-0.45.0")
    );
    assert_eq!(
        project.object_bindings[1]
            .implementation
            .as_ref()
            .and_then(|implementation| match &implementation.provider {
                ObjectProviderRefV01::ProjectPatch { patch_id, .. } => Some(patch_id.as_str()),
                _ => None,
            }),
        Some("local_wrapper")
    );
    assert_eq!(
        project.object_bindings[2].status,
        skenion_contracts::ProjectObjectBindingStatusV01::Error
    );
    assert_eq!(
        project.graph.nodes[0].binding_ref.as_deref(),
        Some("binding-example-oscillator")
    );
    let mut project_with_core_binding = project.clone();
    project_with_core_binding.object_bindings.push(
        serde_json::from_value(serde_json::json!({
            "id": "binding-core-float",
            "objectSpec": "float",
            "status": "resolved",
            "implementation": {
                "provider": { "kind": "core" },
                "objectId": "float"
            }
        }))
        .expect("core binding should parse"),
    );
    validate_project_document_v01(&project_with_core_binding)
        .expect("core object binding should validate");

    let mut package_binding_without_lock = project.clone();
    if let Some(implementation) =
        &mut package_binding_without_lock.object_bindings[0].implementation
        && let ObjectProviderRefV01::Package { lock_entry_id, .. } = &mut implementation.provider
    {
        *lock_entry_id = None;
    }
    let package_binding_without_lock_report =
        validate_project_document_v01(&package_binding_without_lock)
            .expect_err("package binding without lockEntryId should fail");
    assert!(
        package_binding_without_lock_report
            .to_string()
            .contains("package implementation requires lockEntryId")
    );

    let listing: PackageListingV01 = serde_json::from_str(include_str!(
        "../../../fixtures/package/v0.1/valid/patch-listing.skenion.package-listing.json"
    ))
    .expect("public package listing should parse");
    validate_package_listing_v01(&listing).expect("public package listing should validate");
    assert_eq!(listing.schema, "skenion.package.listing");
    assert_eq!(listing.package_id, "skenion/examples");
    assert_eq!(listing.discovery_signals.stargazer_count, 128);
    assert_eq!(listing.discovery_signals.ranking_score, 0.92);

    let discovery: PackageDiscoveryResponseV01 = serde_json::from_str(include_str!(
        "../../../fixtures/package/v0.1/valid/marketplace-search.skenion.package-discovery.json"
    ))
    .expect("public package discovery response should parse");
    validate_package_discovery_response_v01(&discovery)
        .expect("public package discovery response should validate");
    assert_eq!(discovery.listings.len(), 2);
    assert_eq!(
        discovery.listings[1].provides.objects[0].object_id,
        "example.sensor-native"
    );
    assert_eq!(
        discovery.listings[1].provides.objects[0].primary_object_spec,
        "sensor"
    );
    assert_eq!(
        discovery.listings[1].provides.codecs[0].id,
        "example.sensor-calibration-json"
    );
    assert_eq!(
        discovery.listings[1].issues[0].code,
        PackageListingIssueCodeV01::UnavailableTarget
    );
    assert_eq!(
        discovery.issues[0].code,
        PackageListingIssueCodeV01::HiddenPackage
    );
    assert_eq!(
        discovery.issues[1].code,
        PackageListingIssueCodeV01::QuarantinedPackage
    );

    let mut listing_missing_evidence = listing.clone();
    listing_missing_evidence.artifact_evidence.artifacts[0].evidence_refs =
        vec!["missing-evidence".to_owned()];
    let listing_missing_evidence_report = validate_package_listing_v01(&listing_missing_evidence)
        .expect_err("missing listing evidence should fail");
    assert!(
        listing_missing_evidence_report
            .to_string()
            .contains("missing evidence")
    );

    let mut duplicate_discovery = discovery.clone();
    duplicate_discovery
        .listings
        .push(discovery.listings[0].clone());
    let duplicate_discovery_report = validate_package_discovery_response_v01(&duplicate_discovery)
        .expect_err("duplicate listing should fail");
    assert!(
        duplicate_discovery_report
            .to_string()
            .contains("duplicate package listing")
    );

    let mut malformed_public_metadata = listing.clone();
    malformed_public_metadata.version = "0.45".to_owned();
    malformed_public_metadata.homepage_url = Some("ftp://skenion.dev/examples".to_owned());
    malformed_public_metadata.repository_url =
        Some("https://github.com/skenion/skenion examples".to_owned());
    malformed_public_metadata.discovery_signals.ranking_score = -0.1;
    let malformed_public_metadata_report = validate_package_listing_v01(&malformed_public_metadata)
        .expect_err("malformed public listing metadata should fail");
    let malformed_public_metadata_text = malformed_public_metadata_report.to_string();
    assert!(malformed_public_metadata_text.contains("SemVer"));
    assert!(malformed_public_metadata_text.contains("homepageUrl"));
    assert!(malformed_public_metadata_text.contains("repositoryUrl"));
    assert!(malformed_public_metadata_text.contains("rankingScore"));

    let mut listing_with_prerelease_build = listing.clone();
    listing_with_prerelease_build.version = "0.45.0-alpha.1+build.1".to_owned();
    validate_package_listing_v01(&listing_with_prerelease_build)
        .expect("listing version with prerelease and build metadata should validate");

    let mut listing_with_empty_build = listing.clone();
    listing_with_empty_build.version = "0.45.0+".to_owned();
    let listing_with_empty_build_report = validate_package_listing_v01(&listing_with_empty_build)
        .expect_err("listing version with empty build metadata should fail");
    assert!(
        listing_with_empty_build_report
            .to_string()
            .contains("SemVer")
    );

    let mut malformed_semver_suffix = listing.clone();
    malformed_semver_suffix.version = "0.45.0-alpha_1".to_owned();
    let malformed_semver_suffix_report = validate_package_listing_v01(&malformed_semver_suffix)
        .expect_err("listing version with invalid SemVer suffix should fail");
    assert!(
        malformed_semver_suffix_report
            .to_string()
            .contains("SemVer")
    );

    let mut invalid_artifact_evidence = listing.clone();
    invalid_artifact_evidence.artifact_evidence.artifacts[0].path =
        "../skenion.package.json".to_owned();
    invalid_artifact_evidence.artifact_evidence.artifacts[0]
        .checksum
        .value = "not-sha256".to_owned();
    invalid_artifact_evidence.artifact_evidence.evidence[0].path =
        "/evidence/manifest.sha256".to_owned();
    invalid_artifact_evidence.artifact_evidence.evidence[0]
        .checksum
        .value = "bad".to_owned();
    let invalid_artifact_evidence_report = validate_package_listing_v01(&invalid_artifact_evidence)
        .expect_err("malformed artifact evidence should fail");
    let invalid_artifact_evidence_text = invalid_artifact_evidence_report.to_string();
    assert!(invalid_artifact_evidence_text.contains("relative"));
    assert!(invalid_artifact_evidence_text.contains("sha256"));

    let mut empty_listing_paths = listing.clone();
    empty_listing_paths.artifact_evidence.artifacts[0]
        .path
        .clear();
    empty_listing_paths.artifact_evidence.evidence[0]
        .path
        .clear();
    let empty_listing_paths_report = validate_package_listing_v01(&empty_listing_paths)
        .expect_err("empty listing artifact and evidence paths should fail");
    assert!(empty_listing_paths_report.to_string().contains("relative"));

    let mut listing_paths_with_spaces = listing.clone();
    listing_paths_with_spaces.artifact_evidence.artifacts[0].path =
        "evidence/manifest checksum.txt".to_owned();
    listing_paths_with_spaces.artifact_evidence.evidence[0].path =
        "evidence/manifest checksum.sha256".to_owned();
    let listing_paths_with_spaces_report = validate_package_listing_v01(&listing_paths_with_spaces)
        .expect_err("listing artifact and evidence paths with spaces should fail");
    assert!(
        listing_paths_with_spaces_report
            .to_string()
            .contains("relative")
    );

    let mut target_independent_with_targets = listing.clone();
    target_independent_with_targets.target_support.targets =
        vec![PackageTargetTripleV01::Aarch64AppleDarwin];
    let target_independent_with_targets_report =
        validate_package_listing_v01(&target_independent_with_targets)
            .expect_err("target-independent listing targets should fail");
    assert!(
        target_independent_with_targets_report
            .to_string()
            .contains("target-independent")
    );

    let mut targeted_without_targets = discovery.listings[1].clone();
    targeted_without_targets.target_support.targets.clear();
    let targeted_without_targets_report = validate_package_listing_v01(&targeted_without_targets)
        .expect_err("targeted listing without targets should fail");
    assert!(
        targeted_without_targets_report
            .to_string()
            .contains("requires targets")
    );

    let mut duplicate_target_support_targets = discovery.listings[1].clone();
    duplicate_target_support_targets
        .target_support
        .targets
        .push(PackageTargetTripleV01::Aarch64AppleDarwin);
    let duplicate_target_support_targets_report =
        validate_package_listing_v01(&duplicate_target_support_targets)
            .expect_err("duplicate target support targets should fail");
    assert!(
        duplicate_target_support_targets_report
            .to_string()
            .contains("duplicate package listing targetSupport target")
    );

    let mut duplicate_evidence_refs = listing.clone();
    duplicate_evidence_refs.artifact_evidence.artifacts[0]
        .evidence_refs
        .push("manifest-checksum".to_owned());
    let duplicate_evidence_refs_report = validate_package_listing_v01(&duplicate_evidence_refs)
        .expect_err("duplicate listing artifact evidenceRefs should fail");
    assert!(
        duplicate_evidence_refs_report
            .to_string()
            .contains("duplicate listing artifact")
    );

    let range_mismatch: PackageListingV01 = serde_json::from_str(include_str!(
        "../../../fixtures/package/v0.1/invalid/listing-contracts-range-mismatch.skenion.package-listing.json"
    ))
    .expect("range mismatch listing should parse before validation");
    let range_mismatch_report =
        validate_package_listing_v01(&range_mismatch).expect_err("line/range mismatch should fail");
    assert!(
        range_mismatch_report
            .to_string()
            .contains("contracts line must match contracts range")
    );

    let mut malformed_build_suffix = listing.clone();
    malformed_build_suffix.version = "0.45.0+build_1".to_owned();
    let malformed_build_suffix_report = validate_package_listing_v01(&malformed_build_suffix)
        .expect_err("listing version with invalid build metadata should fail");
    assert!(malformed_build_suffix_report.to_string().contains("SemVer"));

    let mut incomplete_version = listing.clone();
    incomplete_version.version = "0".to_owned();
    let incomplete_version_report = validate_package_listing_v01(&incomplete_version)
        .expect_err("listing version without minor and patch should fail");
    assert!(incomplete_version_report.to_string().contains("SemVer"));

    let mut malformed_identity = listing.clone();
    malformed_identity.schema = "wrong.package.listing".to_owned();
    malformed_identity.schema_version = "9.9.9".to_owned();
    malformed_identity.package_id.clear();
    malformed_identity.version.clear();
    malformed_identity.display_name.clear();
    malformed_identity.summary.clear();
    malformed_identity.license.clear();
    let malformed_identity_report = validate_package_listing_v01(&malformed_identity)
        .expect_err("malformed listing identity should fail");
    let malformed_identity_text = malformed_identity_report.to_string();
    assert!(malformed_identity_text.contains("expected schema skenion.package.listing"));
    assert!(malformed_identity_text.contains("expected schemaVersion 0.1.0"));
    assert!(malformed_identity_text.contains("packageId must not be empty"));
    assert!(malformed_identity_text.contains("version must not be empty"));
    assert!(malformed_identity_text.contains("displayName must not be empty"));
    assert!(malformed_identity_text.contains("summary must not be empty"));
    assert!(malformed_identity_text.contains("license must not be empty"));

    let mut malformed_package_id = listing.clone();
    malformed_package_id.package_id = "Skenion/examples".to_owned();
    let malformed_package_id_report = validate_package_listing_v01(&malformed_package_id)
        .expect_err("listing packageId grammar should fail");
    assert!(
        malformed_package_id_report
            .to_string()
            .contains("lowercase digit hyphen grammar")
    );

    let mut malformed_runtime_abi_range = discovery.listings[1].clone();
    malformed_runtime_abi_range.runtime_abi_range = Some("0.45.0".to_owned());
    let malformed_runtime_abi_range_report =
        validate_package_listing_v01(&malformed_runtime_abi_range)
            .expect_err("listing runtimeAbiRange shape should fail");
    assert!(
        malformed_runtime_abi_range_report
            .to_string()
            .contains("runtimeAbiRange")
    );

    let mut unavailable_target_support = discovery.listings[1].clone();
    unavailable_target_support.target_support.kind =
        PackageListingTargetSupportKindV01::Unavailable;
    unavailable_target_support.target_support.targets.clear();
    validate_package_listing_v01(&unavailable_target_support)
        .expect("unavailable target support without targets should validate");

    let mut malformed_provides = listing.clone();
    malformed_provides.provides.patches[0].id = "example.bad_id".to_owned();
    malformed_provides.provides.capabilities.push(String::new());
    let malformed_provides_report = validate_package_listing_v01(&malformed_provides)
        .expect_err("malformed listing provided summaries should fail");
    let malformed_provides_text = malformed_provides_report.to_string();
    assert!(malformed_provides_text.contains("provided id"));
    assert!(malformed_provides_text.contains("capability must not be empty"));

    let mut allowed_special_path = listing.clone();
    allowed_special_path.artifact_evidence.artifacts[0].path =
        "evidence/@manifest%20.sha256".to_owned();
    validate_package_listing_v01(&allowed_special_path)
        .expect("relative listing artifact path may use allowed URI-safe punctuation");

    let mut missing_artifacts = listing.clone();
    missing_artifacts.artifact_evidence.artifacts.clear();
    let missing_artifacts_report = validate_package_listing_v01(&missing_artifacts)
        .expect_err("listing without artifact summaries should fail");
    let missing_artifacts_text = missing_artifacts_report.to_string();
    assert!(missing_artifacts_text.contains("artifact summaries"));
    assert!(missing_artifacts_text.contains("manifest artifact evidence"));

    let mut missing_evidence_summaries = listing.clone();
    missing_evidence_summaries
        .artifact_evidence
        .evidence
        .clear();
    let missing_evidence_summaries_report =
        validate_package_listing_v01(&missing_evidence_summaries)
            .expect_err("listing without evidence summaries should fail");
    assert!(
        missing_evidence_summaries_report
            .to_string()
            .contains("evidence summaries")
    );

    let mut no_manifest_artifact = listing.clone();
    no_manifest_artifact.artifact_evidence.artifacts[0].kind =
        PackageListingArtifactKindV01::PackageArchive;
    let no_manifest_artifact_report = validate_package_listing_v01(&no_manifest_artifact)
        .expect_err("listing without manifest artifact should fail");
    assert!(
        no_manifest_artifact_report
            .to_string()
            .contains("manifest artifact evidence")
    );

    let mut native_artifact_missing_target = discovery.listings[1].clone();
    native_artifact_missing_target.artifact_evidence.artifacts[1].target = None;
    let native_artifact_missing_target_report =
        validate_package_listing_v01(&native_artifact_missing_target)
            .expect_err("native artifact without target should fail");
    assert!(
        native_artifact_missing_target_report
            .to_string()
            .contains("requires target")
    );

    let mut empty_artifact_evidence_refs = listing.clone();
    empty_artifact_evidence_refs.artifact_evidence.artifacts[0]
        .evidence_refs
        .clear();
    let empty_artifact_evidence_refs_report =
        validate_package_listing_v01(&empty_artifact_evidence_refs)
            .expect_err("listing artifact without evidenceRefs should fail");
    assert!(
        empty_artifact_evidence_refs_report
            .to_string()
            .contains("requires evidenceRefs")
    );

    let mut empty_listing_evidence_id = listing.clone();
    empty_listing_evidence_id.artifact_evidence.evidence[0]
        .id
        .clear();
    let empty_listing_evidence_id_report = validate_package_listing_v01(&empty_listing_evidence_id)
        .expect_err("listing evidence without id should fail");
    assert!(
        empty_listing_evidence_id_report
            .to_string()
            .contains("evidence id must not be empty")
    );

    let mut patch_with_runtime_abi = listing.clone();
    patch_with_runtime_abi.runtime_abi_range = Some(">=0.45.0 <0.46.0".to_owned());
    let patch_with_runtime_abi_report = validate_package_listing_v01(&patch_with_runtime_abi)
        .expect_err("patch listing runtimeAbiRange should fail");
    assert!(
        patch_with_runtime_abi_report
            .to_string()
            .contains("must not declare runtimeAbiRange")
    );

    let mut patch_with_targeted_support = listing.clone();
    patch_with_targeted_support.target_support.kind = PackageListingTargetSupportKindV01::Targeted;
    patch_with_targeted_support.target_support.targets =
        vec![PackageTargetTripleV01::Aarch64AppleDarwin];
    let patch_with_targeted_support_report =
        validate_package_listing_v01(&patch_with_targeted_support)
            .expect_err("patch listing targeted support should fail");
    assert!(
        patch_with_targeted_support_report
            .to_string()
            .contains("targetSupport must be target-independent")
    );

    let mut patch_with_native_artifact = listing.clone();
    patch_with_native_artifact
        .artifact_evidence
        .artifacts
        .push(discovery.listings[1].artifact_evidence.artifacts[1].clone());
    let patch_with_native_artifact_report =
        validate_package_listing_v01(&patch_with_native_artifact)
            .expect_err("patch listing native artifact should fail");
    assert!(
        patch_with_native_artifact_report
            .to_string()
            .contains("native artifact summaries")
    );

    let mut mixed_without_runtime_abi = discovery.listings[1].clone();
    mixed_without_runtime_abi.runtime_abi_range = None;
    let mixed_without_runtime_abi_report = validate_package_listing_v01(&mixed_without_runtime_abi)
        .expect_err("mixed listing without runtimeAbiRange should fail");
    assert!(
        mixed_without_runtime_abi_report
            .to_string()
            .contains("requires runtimeAbiRange")
    );

    let mut mixed_target_independent = discovery.listings[1].clone();
    mixed_target_independent.target_support.kind =
        PackageListingTargetSupportKindV01::TargetIndependent;
    mixed_target_independent.target_support.targets.clear();
    let mixed_target_independent_report = validate_package_listing_v01(&mixed_target_independent)
        .expect_err("mixed listing target-independent support should fail");
    assert!(
        mixed_target_independent_report
            .to_string()
            .contains("must not be target-independent")
    );

    let mut mixed_without_native_artifacts = discovery.listings[1].clone();
    mixed_without_native_artifacts
        .artifact_evidence
        .artifacts
        .retain(|artifact| artifact.kind != PackageListingArtifactKindV01::NativeArtifact);
    let mixed_without_native_artifacts_report =
        validate_package_listing_v01(&mixed_without_native_artifacts)
            .expect_err("mixed listing without native artifacts should fail");
    assert!(
        mixed_without_native_artifacts_report
            .to_string()
            .contains("requires native artifact summaries")
    );

    let mut mixed_target_without_artifact = discovery.listings[1].clone();
    mixed_target_without_artifact
        .target_support
        .targets
        .push(PackageTargetTripleV01::X8664LinuxGnu);
    let mixed_target_without_artifact_report =
        validate_package_listing_v01(&mixed_target_without_artifact)
            .expect_err("mixed listing target without artifact should fail");
    assert!(
        mixed_target_without_artifact_report
            .to_string()
            .contains("has no native artifact summary")
    );

    let mut malformed_discovery_identity = discovery.clone();
    malformed_discovery_identity.schema = "wrong.package.discovery".to_owned();
    malformed_discovery_identity.schema_version = "9.9.9".to_owned();
    let malformed_discovery_identity_report =
        validate_package_discovery_response_v01(&malformed_discovery_identity)
            .expect_err("malformed discovery identity should fail");
    let malformed_discovery_identity_text = malformed_discovery_identity_report.to_string();
    assert!(
        malformed_discovery_identity_text.contains("expected schema skenion.package.discovery")
    );
    assert!(malformed_discovery_identity_text.contains("expected schemaVersion 0.1.0"));
}

#[test]
fn validates_public_package_install_plan_contract_surface() {
    let request: PackageInstallPlanRequestV01 = serde_json::from_str(include_str!(
        "../../../fixtures/package/v0.1/valid/update-plan-request.skenion.package-install-plan-request.json"
    ))
    .expect("install plan request should parse");
    validate_package_install_plan_request_v01(&request)
        .expect("install plan request should validate");
    assert_eq!(request.schema, "skenion.package.install-plan.request");
    assert_eq!(request.package_id, "example/native-sensor");
    assert_eq!(
        request.current.installed_lock_entry_id.as_deref(),
        Some("pkg-example-native-sensor-0.45.0")
    );
    assert_eq!(request.candidates[0].listing.package_id, request.package_id);

    let mut install_request = request.clone();
    install_request.intent = PackageInstallPlanIntentV01::Install;
    install_request.current.installed_lock_entry_id = None;
    install_request.desired.version = None;
    install_request.candidates[0].manifest = None;
    validate_package_install_plan_request_v01(&install_request)
        .expect("install request without installed lock or manifest should validate");

    let mut missing_installed_lock = request.clone();
    missing_installed_lock.current.installed_lock_entry_id = Some("missing-lock".to_owned());
    let missing_installed_lock_report =
        validate_package_install_plan_request_v01(&missing_installed_lock)
            .expect_err("missing installed lock should fail");
    assert!(
        missing_installed_lock_report
            .to_string()
            .contains("missing installedLockEntryId")
    );

    let mut mismatched_candidate = install_request.clone();
    mismatched_candidate.candidates[0].listing.package_id = "example/other-package".to_owned();
    let mismatched_candidate_report =
        validate_package_install_plan_request_v01(&mismatched_candidate)
            .expect_err("candidate packageId mismatch should fail");
    assert!(
        mismatched_candidate_report
            .to_string()
            .contains("does not match request packageId")
    );

    let target_mismatch: PackageInstallPlanRequestV01 = serde_json::from_str(include_str!(
        "../../../fixtures/package/v0.1/invalid/plan-request-target-mismatch.skenion.package-install-plan-request.json"
    ))
    .expect("target mismatch request should parse before semantic validation");
    let target_mismatch_report = validate_package_install_plan_request_v01(&target_mismatch)
        .expect_err("target mismatch should fail");
    assert!(
        target_mismatch_report
            .to_string()
            .contains("must use target triple")
    );

    let update_response: PackageInstallPlanResponseV01 = serde_json::from_str(include_str!(
        "../../../fixtures/package/v0.1/valid/update-plan-response.skenion.package-install-plan-response.json"
    ))
    .expect("install plan response should parse");
    validate_package_install_plan_response_v01(&update_response)
        .expect("install plan response should validate");
    assert!(update_response.ok);
    assert_eq!(
        update_response.actions[0].kind,
        PackageInstallPlanActionKindV01::Download
    );
    assert_eq!(
        update_response.actions[5].capability_changes[0].id,
        "example.sensor-calibration"
    );

    let keep_response: PackageInstallPlanResponseV01 = serde_json::from_str(include_str!(
        "../../../fixtures/package/v0.1/valid/keep-plan-response.skenion.package-install-plan-response.json"
    ))
    .expect("keep response should parse");
    validate_package_install_plan_response_v01(&keep_response)
        .expect("keep response should validate");
    assert_eq!(
        keep_response.checks[1].status,
        PackageInstallPlanCheckStatusV01::Skipped
    );

    let rollback_response: PackageInstallPlanResponseV01 = serde_json::from_str(include_str!(
        "../../../fixtures/package/v0.1/valid/rollback-plan-response.skenion.package-install-plan-response.json"
    ))
    .expect("rollback response should parse");
    validate_package_install_plan_response_v01(&rollback_response)
        .expect("rollback response should validate");
    assert_eq!(
        rollback_response.actions[0].kind,
        PackageInstallPlanActionKindV01::Rollback
    );

    let reject_response: PackageInstallPlanResponseV01 = serde_json::from_str(include_str!(
        "../../../fixtures/package/v0.1/valid/reject-plan-response.skenion.package-install-plan-response.json"
    ))
    .expect("reject response should parse");
    validate_package_install_plan_response_v01(&reject_response)
        .expect("reject response should validate");
    assert!(!reject_response.ok);
    assert_eq!(
        reject_response.issues[0].code,
        PackageInstallPlanIssueCodeV01::UnsupportedTarget
    );

    let unordered_actions: PackageInstallPlanResponseV01 = serde_json::from_str(include_str!(
        "../../../fixtures/package/v0.1/invalid/plan-response-unordered-actions.skenion.package-install-plan-response.json"
    ))
    .expect("unordered response should parse before semantic validation");
    let unordered_actions_report = validate_package_install_plan_response_v01(&unordered_actions)
        .expect_err("unordered actions should fail");
    assert!(
        unordered_actions_report
            .to_string()
            .contains("order must be 0")
    );

    let reject_without_error: PackageInstallPlanResponseV01 = serde_json::from_str(include_str!(
        "../../../fixtures/package/v0.1/invalid/plan-response-reject-without-error.skenion.package-install-plan-response.json"
    ))
    .expect("reject without error should parse before semantic validation");
    let reject_without_error_report =
        validate_package_install_plan_response_v01(&reject_without_error)
            .expect_err("failed plan without error issue should fail");
    assert!(
        reject_without_error_report
            .to_string()
            .contains("requires an error issue")
    );

    let mut response_target_mismatch = keep_response.clone();
    response_target_mismatch.target.os = PackageInstallPlanTargetOsV01::Linux;
    response_target_mismatch.target.arch = PackageInstallPlanTargetArchV01::X8664;
    let response_target_mismatch_report =
        validate_package_install_plan_response_v01(&response_target_mismatch)
            .expect_err("response target mismatch should fail");
    assert!(
        response_target_mismatch_report
            .to_string()
            .contains("must use target triple")
    );

    let mut successful_reject = reject_response.clone();
    successful_reject.ok = true;
    let successful_reject_report = validate_package_install_plan_response_v01(&successful_reject)
        .expect_err("successful plan must not carry reject action");
    assert!(
        successful_reject_report
            .to_string()
            .contains("must not include reject actions")
    );

    for (os, arch, triple) in [
        (
            PackageInstallPlanTargetOsV01::Macos,
            PackageInstallPlanTargetArchV01::X8664,
            PackageTargetTripleV01::X8664AppleDarwin,
        ),
        (
            PackageInstallPlanTargetOsV01::Windows,
            PackageInstallPlanTargetArchV01::Aarch64,
            PackageTargetTripleV01::Aarch64WindowsMsvc,
        ),
        (
            PackageInstallPlanTargetOsV01::Windows,
            PackageInstallPlanTargetArchV01::X8664,
            PackageTargetTripleV01::X8664WindowsMsvc,
        ),
        (
            PackageInstallPlanTargetOsV01::Linux,
            PackageInstallPlanTargetArchV01::Aarch64,
            PackageTargetTripleV01::Aarch64LinuxGnu,
        ),
    ] {
        let mut target_variant = keep_response.clone();
        target_variant.target.os = os;
        target_variant.target.arch = arch;
        target_variant.target.triple = triple;
        validate_package_install_plan_response_v01(&target_variant)
            .expect("supported target os/arch combination should validate");
    }

    let mut malformed_request_identity = request.clone();
    malformed_request_identity.schema = "wrong.plan.request".to_owned();
    malformed_request_identity.schema_version = "9.9.9".to_owned();
    malformed_request_identity.request_id.clear();
    malformed_request_identity.package_id = "Bad Package".to_owned();
    malformed_request_identity.desired.version = None;
    malformed_request_identity.desired.version_range = None;
    let malformed_request_identity_report =
        validate_package_install_plan_request_v01(&malformed_request_identity)
            .expect_err("malformed request identity should fail");
    let malformed_request_identity_text = malformed_request_identity_report.to_string();
    assert!(malformed_request_identity_text.contains("expected schema"));
    assert!(malformed_request_identity_text.contains("expected schemaVersion"));
    assert!(malformed_request_identity_text.contains("requestId"));
    assert!(malformed_request_identity_text.contains("packageId"));
    assert!(malformed_request_identity_text.contains("desired requires"));

    let mut malformed_desired = request.clone();
    malformed_desired.desired.version = Some("0.45".to_owned());
    malformed_desired.desired.version_range = Some("0.45.0".to_owned());
    let malformed_desired_report = validate_package_install_plan_request_v01(&malformed_desired)
        .expect_err("malformed desired version fields should fail");
    let malformed_desired_text = malformed_desired_report.to_string();
    assert!(malformed_desired_text.contains("desired version must be SemVer"));
    assert!(malformed_desired_text.contains("desired versionRange"));

    let mut malformed_target_contracts = request.clone();
    malformed_target_contracts.target.contracts.line = "0.44".to_owned();
    malformed_target_contracts.target.runtime_abi_range = Some("0.45.0".to_owned());
    let malformed_target_contracts_report =
        validate_package_install_plan_request_v01(&malformed_target_contracts)
            .expect_err("malformed target contracts should fail");
    let malformed_target_contracts_text = malformed_target_contracts_report.to_string();
    assert!(malformed_target_contracts_text.contains("target contracts line"));
    assert!(malformed_target_contracts_text.contains("target runtimeAbiRange"));

    let mut malformed_lock = request.clone();
    malformed_lock.current.package_lock[0].package_id = "Bad Package".to_owned();
    malformed_lock.current.package_lock[0].manifest_path =
        "/absolute/skenion.package.json".to_owned();
    malformed_lock.current.package_lock[0]
        .manifest_checksum
        .value = "not-sha256".to_owned();
    malformed_lock.current.package_lock[0].category = PackageCategoryV01::Patch;
    let malformed_lock_report = validate_package_install_plan_request_v01(&malformed_lock)
        .expect_err("malformed lock entry should fail");
    let malformed_lock_text = malformed_lock_report.to_string();
    assert!(malformed_lock_text.contains("lock"));
    assert!(malformed_lock_text.contains("manifestPath"));
    assert!(malformed_lock_text.contains("checksum"));
    assert!(malformed_lock_text.contains("must not declare runtimeAbiRange"));
    assert!(malformed_lock_text.contains("must not declare target"));
    assert!(malformed_lock_text.contains("must not declare nativeArtifacts"));

    let mut missing_native_lock_fields = request.clone();
    missing_native_lock_fields.current.package_lock[0].runtime_abi_range = None;
    missing_native_lock_fields.current.package_lock[0].target = None;
    missing_native_lock_fields.current.package_lock[0]
        .native_artifacts
        .clear();
    let missing_native_lock_fields_report =
        validate_package_install_plan_request_v01(&missing_native_lock_fields)
            .expect_err("native lock without native evidence should fail");
    let missing_native_lock_fields_text = missing_native_lock_fields_report.to_string();
    assert!(missing_native_lock_fields_text.contains("requires runtimeAbiRange"));
    assert!(missing_native_lock_fields_text.contains("requires target"));
    assert!(missing_native_lock_fields_text.contains("requires nativeArtifacts"));

    let mut duplicate_current_state = request.clone();
    duplicate_current_state
        .current
        .package_lock
        .push(duplicate_current_state.current.package_lock[0].clone());
    duplicate_current_state
        .current
        .object_bindings
        .push(duplicate_current_state.current.object_bindings[0].clone());
    let duplicate_current_state_report =
        validate_package_install_plan_request_v01(&duplicate_current_state)
            .expect_err("duplicate current state ids should fail");
    let duplicate_current_state_text = duplicate_current_state_report.to_string();
    assert!(duplicate_current_state_text.contains("duplicate package install plan lock entry id"));
    assert!(
        duplicate_current_state_text.contains("duplicate package install plan object binding id")
    );

    let mut update_without_installed_lock = request.clone();
    update_without_installed_lock
        .current
        .installed_lock_entry_id = None;
    let update_without_installed_lock_report =
        validate_package_install_plan_request_v01(&update_without_installed_lock)
            .expect_err("update without installed lock should fail");
    assert!(
        update_without_installed_lock_report
            .to_string()
            .contains("update requires installedLockEntryId")
    );

    let mut missing_binding_lock = request.clone();
    if let Some(implementation) =
        &mut missing_binding_lock.current.object_bindings[0].implementation
        && let ObjectProviderRefV01::Package { lock_entry_id, .. } = &mut implementation.provider
    {
        *lock_entry_id = Some("missing-lock".to_owned());
    }
    let missing_binding_lock_report =
        validate_package_install_plan_request_v01(&missing_binding_lock)
            .expect_err("binding with missing lock should fail");
    assert!(
        missing_binding_lock_report
            .to_string()
            .contains("object binding")
    );

    let mut request_with_core_binding = request.clone();
    request_with_core_binding.current.object_bindings.push(
        serde_json::from_value(serde_json::json!({
            "id": "binding-core-float",
            "objectSpec": "float",
            "status": "resolved",
            "implementation": {
                "provider": { "kind": "core" },
                "objectId": "float"
            }
        }))
        .expect("core binding should parse"),
    );
    validate_package_install_plan_request_v01(&request_with_core_binding)
        .expect("core binding should not require package lock");

    let mut binding_without_lock_id = request.clone();
    if let Some(implementation) =
        &mut binding_without_lock_id.current.object_bindings[0].implementation
        && let ObjectProviderRefV01::Package { lock_entry_id, .. } = &mut implementation.provider
    {
        *lock_entry_id = None;
    }
    let binding_without_lock_id_report =
        validate_package_install_plan_request_v01(&binding_without_lock_id)
            .expect_err("binding without lockEntryId should fail");
    assert!(
        binding_without_lock_id_report
            .to_string()
            .contains("package implementation requires lockEntryId")
    );

    let mut request_without_candidates = request.clone();
    request_without_candidates.candidates.clear();
    let request_without_candidates_report =
        validate_package_install_plan_request_v01(&request_without_candidates)
            .expect_err("request without candidates should fail");
    assert!(
        request_without_candidates_report
            .to_string()
            .contains("requires candidates")
    );

    let mut invalid_candidate_manifest = request.clone();
    invalid_candidate_manifest.candidates[0]
        .manifest
        .as_mut()
        .expect("fixture has manifest")
        .native_artifacts[0]
        .evidence_refs = vec!["missing-evidence".to_owned()];
    let invalid_candidate_manifest_report =
        validate_package_install_plan_request_v01(&invalid_candidate_manifest)
            .expect_err("invalid candidate manifest should fail");
    assert!(
        invalid_candidate_manifest_report
            .to_string()
            .contains("missing evidence")
    );

    let mut mismatched_manifest_id = request.clone();
    mismatched_manifest_id.candidates[0]
        .manifest
        .as_mut()
        .expect("fixture has manifest")
        .id = "example/other-package".to_owned();
    let mismatched_manifest_id_report =
        validate_package_install_plan_request_v01(&mismatched_manifest_id)
            .expect_err("manifest id mismatch should fail");
    assert!(
        mismatched_manifest_id_report
            .to_string()
            .contains("manifest id")
    );

    let mut mismatched_manifest_version = request.clone();
    mismatched_manifest_version.candidates[0]
        .manifest
        .as_mut()
        .expect("fixture has manifest")
        .version = "0.45.0".to_owned();
    let mismatched_manifest_version_report =
        validate_package_install_plan_request_v01(&mismatched_manifest_version)
            .expect_err("manifest version mismatch should fail");
    assert!(
        mismatched_manifest_version_report
            .to_string()
            .contains("manifest version")
    );

    let mut malformed_response_identity = keep_response.clone();
    malformed_response_identity.schema = "wrong.plan.response".to_owned();
    malformed_response_identity.schema_version = "9.9.9".to_owned();
    malformed_response_identity.request_id.clear();
    malformed_response_identity.package_id = "Bad Package".to_owned();
    malformed_response_identity.selected_version = Some("0.45".to_owned());
    malformed_response_identity.checks.clear();
    let malformed_response_identity_report =
        validate_package_install_plan_response_v01(&malformed_response_identity)
            .expect_err("malformed response identity should fail");
    let malformed_response_identity_text = malformed_response_identity_report.to_string();
    assert!(malformed_response_identity_text.contains("expected schema"));
    assert!(malformed_response_identity_text.contains("expected schemaVersion"));
    assert!(malformed_response_identity_text.contains("requestId"));
    assert!(malformed_response_identity_text.contains("packageId"));
    assert!(malformed_response_identity_text.contains("selectedVersion"));
    assert!(malformed_response_identity_text.contains("requires checks"));

    let mut duplicate_response_ids = reject_response.clone();
    duplicate_response_ids
        .actions
        .push(duplicate_response_ids.actions[0].clone());
    duplicate_response_ids
        .issues
        .push(duplicate_response_ids.issues[0].clone());
    let duplicate_response_ids_report =
        validate_package_install_plan_response_v01(&duplicate_response_ids)
            .expect_err("duplicate response ids should fail");
    let duplicate_response_ids_text = duplicate_response_ids_report.to_string();
    assert!(duplicate_response_ids_text.contains("duplicate package install plan action id"));
    assert!(duplicate_response_ids_text.contains("duplicate package install plan issue id"));

    let mut malformed_issue = reject_response.clone();
    malformed_issue.issues[0].id.clear();
    malformed_issue.issues[0].message.clear();
    let malformed_issue_report = validate_package_install_plan_response_v01(&malformed_issue)
        .expect_err("malformed issue should fail");
    let malformed_issue_text = malformed_issue_report.to_string();
    assert!(malformed_issue_text.contains("issue id"));
    assert!(malformed_issue_text.contains("message must not be empty"));

    let mut failing_check_without_ref = reject_response.clone();
    failing_check_without_ref.checks[0].issue_refs.clear();
    let failing_check_without_ref_report =
        validate_package_install_plan_response_v01(&failing_check_without_ref)
            .expect_err("failing check without issue ref should fail");
    assert!(
        failing_check_without_ref_report
            .to_string()
            .contains("failing check")
    );

    let mut missing_check_issue = reject_response.clone();
    missing_check_issue.checks[0].issue_refs = vec!["missing-issue".to_owned()];
    let missing_check_issue_report =
        validate_package_install_plan_response_v01(&missing_check_issue)
            .expect_err("missing check issue ref should fail");
    assert!(
        missing_check_issue_report
            .to_string()
            .contains("references missing issue")
    );

    let mut malformed_download_action = update_response.clone();
    malformed_download_action.actions[0].id.clear();
    malformed_download_action.actions[0].package_id = "Bad Package".to_owned();
    malformed_download_action.actions[0].version = Some("0.45".to_owned());
    malformed_download_action.actions[0]
        .artifact
        .as_mut()
        .expect("fixture has artifact")
        .path = "../outside".to_owned();
    malformed_download_action.actions[0]
        .artifact
        .as_mut()
        .expect("fixture has artifact")
        .checksum
        .value = "bad".to_owned();
    malformed_download_action.actions[0]
        .artifact
        .as_mut()
        .expect("fixture has artifact")
        .evidence_refs
        .clear();
    let malformed_download_action_report =
        validate_package_install_plan_response_v01(&malformed_download_action)
            .expect_err("malformed download action should fail");
    let malformed_download_action_text = malformed_download_action_report.to_string();
    assert!(malformed_download_action_text.contains("action id"));
    assert!(malformed_download_action_text.contains("packageId"));
    assert!(malformed_download_action_text.contains("version must be SemVer"));
    assert!(malformed_download_action_text.contains("artifact path"));
    assert!(malformed_download_action_text.contains("checksum"));
    assert!(malformed_download_action_text.contains("artifact requires evidenceRefs"));

    let mut missing_download_fields = update_response.clone();
    missing_download_fields.actions[0].version = None;
    missing_download_fields.actions[0].artifact = None;
    missing_download_fields.actions[0].evidence_refs.clear();
    let missing_download_fields_report =
        validate_package_install_plan_response_v01(&missing_download_fields)
            .expect_err("download action missing required fields should fail");
    let missing_download_fields_text = missing_download_fields_report.to_string();
    assert!(missing_download_fields_text.contains("requires version"));
    assert!(missing_download_fields_text.contains("requires artifact"));
    assert!(missing_download_fields_text.contains("requires evidenceRefs"));

    let mut missing_stage_version = update_response.clone();
    missing_stage_version.actions[3].version = None;
    let missing_stage_version_report =
        validate_package_install_plan_response_v01(&missing_stage_version)
            .expect_err("stage action missing version should fail");
    assert!(
        missing_stage_version_report
            .to_string()
            .contains("stage action")
    );

    let mut missing_replace_fields = update_response.clone();
    missing_replace_fields.actions[5].version = None;
    missing_replace_fields.actions[5].lock_entry_id = None;
    missing_replace_fields.actions[5].to_lock_entry_id = None;
    let missing_replace_fields_report =
        validate_package_install_plan_response_v01(&missing_replace_fields)
            .expect_err("replace action missing fields should fail");
    assert!(
        missing_replace_fields_report
            .to_string()
            .contains("replace action")
    );

    let mut missing_disable_lock = update_response.clone();
    missing_disable_lock.actions[4].lock_entry_id = None;
    let missing_disable_lock_report =
        validate_package_install_plan_response_v01(&missing_disable_lock)
            .expect_err("disable action missing lock should fail");
    assert!(
        missing_disable_lock_report
            .to_string()
            .contains("requires lockEntryId")
    );

    let mut missing_rollback_fields = rollback_response.clone();
    missing_rollback_fields.actions[0].lock_entry_id = None;
    missing_rollback_fields.actions[0].rollback_lock_entry_id = None;
    let missing_rollback_fields_report =
        validate_package_install_plan_response_v01(&missing_rollback_fields)
            .expect_err("rollback action missing fields should fail");
    assert!(
        missing_rollback_fields_report
            .to_string()
            .contains("rollback action")
    );

    let mut missing_reject_issues = reject_response.clone();
    missing_reject_issues.actions[0].issue_refs.clear();
    let missing_reject_issues_report =
        validate_package_install_plan_response_v01(&missing_reject_issues)
            .expect_err("reject action missing issue refs should fail");
    assert!(
        missing_reject_issues_report
            .to_string()
            .contains("reject action")
    );

    let mut missing_action_issue = reject_response.clone();
    missing_action_issue.actions[0].issue_refs = vec!["missing-issue".to_owned()];
    let missing_action_issue_report =
        validate_package_install_plan_response_v01(&missing_action_issue)
            .expect_err("action missing issue ref should fail");
    assert!(
        missing_action_issue_report
            .to_string()
            .contains("action reject-native-sensor-windows-arm64 references missing issue")
    );

    let mut malformed_capability_change = update_response.clone();
    malformed_capability_change.actions[5].capability_changes[0]
        .id
        .clear();
    malformed_capability_change.actions[5].capability_changes[0].issue_ref =
        Some("missing-issue".to_owned());
    let malformed_capability_change_report =
        validate_package_install_plan_response_v01(&malformed_capability_change)
            .expect_err("malformed capability change should fail");
    let malformed_capability_change_text = malformed_capability_change_report.to_string();
    assert!(malformed_capability_change_text.contains("capability change id"));
    assert!(
        malformed_capability_change_text.contains("capability change references missing issue")
    );

    let mut failed_without_reject = reject_response.clone();
    failed_without_reject.actions.clear();
    let failed_without_reject_report =
        validate_package_install_plan_response_v01(&failed_without_reject)
            .expect_err("failed plan without reject action should fail");
    assert!(
        failed_without_reject_report
            .to_string()
            .contains("requires a reject action")
    );
}

#[test]
fn validates_public_object_spec_parse_results() {
    let result: ObjectSpecParseResultV01 = serde_json::from_str(
        r#"{
          "schema": "skenion.object-spec.parse-result",
          "schemaVersion": "0.1.0",
          "input": "example.gain 0.5",
          "ok": true,
          "className": "example.gain",
          "creationArgs": [{ "type": "float", "value": 0.5, "representation": "f32" }],
          "implementation": {
            "provider": { "kind": "package", "packageId": "example/package", "version": "0.1.0" },
            "objectId": "gain"
          },
          "objectResolution": { "status": "resolved", "selectedSpec": "example.gain 0.5" },
          "params": { "gain": 0.5 },
          "instancePorts": [
            {
              "id": "in",
              "direction": "input",
              "type": "value.core.message",
              "rate": "control",
              "activation": "trigger",
              "messageKeys": {
                "accepted": ["bang", "set", "float"],
                "silent": ["set"],
                "store": ["set"],
                "trigger": ["bang", "float"],
                "emit": ["bang", "float"]
              }
            },
            { "id": "out", "direction": "output", "type": "value.core.float64", "rate": "control" }
          ],
          "displayText": "example.gain 0.5",
          "issues": []
        }"#,
    )
    .expect("object spec result should parse");

    validate_object_spec_parse_result_v01(&result).expect("object spec result should validate");
    assert_eq!(
        result
            .implementation
            .as_ref()
            .map(|implementation| implementation.object_id.as_str()),
        Some("gain")
    );
    let implementation_json = serde_json::to_value(
        result
            .implementation
            .as_ref()
            .expect("implementation should exist"),
    )
    .expect("implementation should serialize");
    assert_eq!(implementation_json.get("version"), None);
    assert_eq!(
        implementation_json
            .get("provider")
            .and_then(|provider| provider.get("version"))
            .and_then(|version| version.as_str()),
        Some("0.1.0")
    );

    let mut resolved_without_implementation = result.clone();
    resolved_without_implementation.implementation = None;
    let resolved_without_implementation_error =
        validate_object_spec_parse_result_v01(&resolved_without_implementation)
            .expect_err("resolved object spec without implementation should fail");
    assert!(
        resolved_without_implementation_error
            .to_string()
            .contains("requires implementation")
    );

    let unsupported_resolution_issue: Result<ObjectSpecParseResultV01, _> = serde_json::from_str(
        r#"{
              "schema": "skenion.object-spec.parse-result",
              "schemaVersion": "0.1.0",
              "input": "missing.object",
              "ok": false,
              "className": "missing.object",
              "creationArgs": [],
              "implementation": {
                "provider": { "kind": "core" },
                "objectId": "missing"
              },
              "objectResolution": {
                "status": "unresolved",
                "issues": [
                  {
                    "severity": "error",
                    "code": "binding-unresolved",
                    "message": "unsupported issue code must be rejected"
                  }
                ]
              },
              "params": {},
              "instancePorts": [],
              "displayText": "missing.object",
              "issues": []
            }"#,
    );
    assert!(
        unsupported_resolution_issue
            .expect_err("unsupported resolution issue code should fail parsing")
            .to_string()
            .contains("binding-unresolved")
    );

    let mut wrong_schema = result.clone();
    wrong_schema.schema = "wrong.object-spec".to_owned();
    let schema_error = validate_object_spec_parse_result_v01(&wrong_schema)
        .expect_err("schema mismatch should fail");
    assert!(schema_error.to_string().contains("wrong.object-spec"));

    let mut wrong_version = result.clone();
    wrong_version.schema_version = "9.9.9".to_owned();
    let version_error = validate_object_spec_parse_result_v01(&wrong_version)
        .expect_err("schema version mismatch should fail");
    assert!(version_error.to_string().contains("9.9.9"));

    let parsed = parse_object_spec_v01("[osc~ 440]");
    assert_eq!(parsed.class_name, "osc~");
    assert_eq!(parsed.implementation, None);
    assert!(parsed.params.is_empty());
    assert!(parsed.instance_ports.is_empty());
    assert_eq!(
        parsed.creation_args,
        vec![ObjectSpecAtomV01::Int {
            value: 440,
            representation: Some("i32".to_owned())
        }]
    );

    let mut missing_keys = result.clone();
    missing_keys.instance_ports[0].message_keys = None;
    let missing_keys_error = validate_object_spec_parse_result_v01(&missing_keys)
        .expect_err("value.core.message object spec port without keys should fail");
    assert!(
        missing_keys_error
            .to_string()
            .contains("requires messageKeys")
    );

    let mut accepting_message_any = result.clone();
    accepting_message_any.instance_ports[0].port_type = "value.core.float64".to_owned();
    accepting_message_any.instance_ports[0].accepts = Some(vec!["value.core.message".to_owned()]);
    accepting_message_any.instance_ports[0].message_keys = None;
    let accepting_message_any_error = validate_object_spec_parse_result_v01(&accepting_message_any)
        .expect_err("object spec port accepting value.core.message without keys should fail");
    assert!(
        accepting_message_any_error
            .to_string()
            .contains("requires messageKeys")
    );

    let mut empty_key_set = result.clone();
    let policy = empty_key_set.instance_ports[0]
        .message_keys
        .as_mut()
        .expect("resolved object spec should declare key policy");
    policy.accepted.clear();
    let empty_key_error = validate_object_spec_parse_result_v01(&empty_key_set)
        .expect_err("empty key policy should fail");
    assert!(
        empty_key_error
            .to_string()
            .contains("accepted must list at least one key")
    );

    let mut unaccepted_trigger = result.clone();
    let policy = unaccepted_trigger.instance_ports[0]
        .message_keys
        .as_mut()
        .expect("resolved object spec should declare key policy");
    policy.accepted = vec!["float".to_owned()];
    policy.trigger = Some(vec!["int".to_owned()]);
    let unaccepted_trigger_error = validate_object_spec_parse_result_v01(&unaccepted_trigger)
        .expect_err("key behavior outside accepted set should fail");
    assert!(
        unaccepted_trigger_error
            .to_string()
            .contains("messageKeys.trigger key int is not accepted")
    );

    let mut set_as_emit = result.clone();
    let policy = set_as_emit.instance_ports[0]
        .message_keys
        .as_mut()
        .expect("resolved object spec should declare key policy");
    policy.accepted = vec!["set".to_owned()];
    policy.silent = Some(vec!["set".to_owned()]);
    policy.trigger = None;
    policy.store = None;
    policy.emit = Some(vec!["set".to_owned()]);
    let set_emit_error = validate_object_spec_parse_result_v01(&set_as_emit)
        .expect_err("set must not be emit behavior");
    assert!(
        set_emit_error
            .to_string()
            .contains("messageKeys.emit must not include set")
    );

    let mut set_as_trigger = result.clone();
    let policy = set_as_trigger.instance_ports[0]
        .message_keys
        .as_mut()
        .expect("resolved object spec should declare key policy");
    policy.accepted = vec!["set".to_owned()];
    policy.silent = None;
    policy.trigger = Some(vec!["set".to_owned()]);
    policy.store = None;
    policy.emit = None;
    let set_trigger_error = validate_object_spec_parse_result_v01(&set_as_trigger)
        .expect_err("set must not be trigger behavior");
    let set_trigger_text = set_trigger_error.to_string();
    assert!(set_trigger_text.contains("messageKeys.trigger must not include set"));
    assert!(set_trigger_text.contains("messageKeys.set must be silent or store behavior"));

    let mut set_as_silent = result.clone();
    let policy = set_as_silent.instance_ports[0]
        .message_keys
        .as_mut()
        .expect("resolved object spec should declare key policy");
    policy.accepted = vec!["set".to_owned()];
    policy.silent = Some(vec!["set".to_owned()]);
    policy.trigger = None;
    policy.store = None;
    policy.emit = None;
    validate_object_spec_parse_result_v01(&set_as_silent)
        .expect("set should be valid as silent key behavior");

    let mut set_as_store = result.clone();
    let policy = set_as_store.instance_ports[0]
        .message_keys
        .as_mut()
        .expect("resolved object spec should declare key policy");
    policy.accepted = vec!["set".to_owned()];
    policy.silent = None;
    policy.trigger = None;
    policy.store = Some(vec!["set".to_owned()]);
    policy.emit = None;
    validate_object_spec_parse_result_v01(&set_as_store)
        .expect("set should be valid as store key behavior");
}

fn zero_checksum_v01() -> serde_json::Value {
    serde_json::json!({ "algorithm": "sha256", "value": "0".repeat(64) })
}

fn minimal_node_definition_value(id: &str, display_name: &str) -> serde_json::Value {
    serde_json::json!({
        "schema": "skenion.node.definition",
        "schemaVersion": "0.1.0",
        "id": id,
        "version": "0.1.0",
        "displayName": display_name,
        "category": "Core",
        "ports": [],
        "execution": { "model": "control" },
        "state": { "persistent": false },
        "permissions": [],
        "capabilities": []
    })
}

fn with_catalog_revision(mut snapshot: NodeCatalogSnapshotV01) -> NodeCatalogSnapshotV01 {
    snapshot.catalog_revision = compute_node_catalog_revision_v01(&snapshot);
    snapshot
}

fn valid_core_catalog_snapshot() -> NodeCatalogSnapshotV01 {
    let snapshot: NodeCatalogSnapshotV01 = serde_json::from_value(serde_json::json!({
        "schema": "skenion.node-catalog.snapshot",
        "schemaVersion": "0.1.0",
        "catalogRevision": zero_checksum_v01(),
        "entries": [
            {
                "catalogId": "core.float",
                "objectId": "float",
                "primaryObjectSpec": "float",
                "aliases": ["float64", "number"],
                "provider": { "kind": "core" },
                "definition": minimal_node_definition_value("object.core.float", "Float"),
                "creatable": true,
                "display": {
                    "title": "Float",
                    "category": "Core",
                    "palette": "text",
                    "description": "Core scalar node.",
                    "helpId": "object.core.float"
                },
                "issues": [
                    {
                        "severity": "info",
                        "code": "catalog.note",
                        "message": "Core scalar node.",
                        "target": { "kind": "entry", "catalogId": "core.float" }
                    }
                ]
            },
            {
                "catalogId": "core.message",
                "objectId": "message",
                "primaryObjectSpec": "message",
                "aliases": ["msg"],
                "provider": { "kind": "core" },
                "definition": minimal_node_definition_value("object.core.message", "Message"),
                "creatable": true,
                "display": {
                    "title": "Message",
                    "category": "Core"
                }
            }
        ],
        "issues": [
            {
                "severity": "warning",
                "code": "catalog.generated",
                "message": "Generated with non-fatal catalog issues.",
                "target": { "kind": "catalog" }
            }
        ]
    }))
    .expect("catalog should parse");

    with_catalog_revision(snapshot)
}

fn valid_project_patch() -> PatchDefinitionV01 {
    serde_json::from_value(serde_json::json!({
        "id": "Folder/My Patch?",
        "revision": "rev-with-metadata-excluded",
        "metadata": { "title": "Ignored for interface digest" },
        "graph": {
            "schema": "skenion.graph",
            "schemaVersion": "0.1.0",
            "id": "patch-project-node",
            "revision": "graph-rev",
            "nodes": [
                {
                    "id": "value_in",
                    "implementation": { "provider": { "kind": "core" }, "objectId": "inlet" },
                    "params": { "portId": "value", "label": "Value" },
                    "ports": [
                        { "id": "out", "direction": "output", "type": "value.core.float64", "rate": "control" }
                    ]
                },
                {
                    "id": "value_out",
                    "implementation": { "provider": { "kind": "core" }, "objectId": "outlet" },
                    "params": { "portId": "result", "label": "Result" },
                    "ports": [
                        { "id": "in", "direction": "input", "type": "value.core.float64", "rate": "control" }
                    ]
                }
            ],
            "edges": []
        }
    }))
    .expect("patch should parse")
}

fn valid_project_patch_catalog_snapshot() -> NodeCatalogSnapshotV01 {
    let patch = valid_project_patch();
    let interface_digest = compute_patch_interface_digest_v01(&patch);
    let definition_id = project_patch_node_definition_id_v01(&patch.id, &interface_digest);
    let ports = serde_json::to_value(
        derive_patch_contract_v01(&patch)
            .ports
            .iter()
            .map(|port| &port.port)
            .collect::<Vec<_>>(),
    )
    .expect("ports should serialize");
    let snapshot: NodeCatalogSnapshotV01 = serde_json::from_value(serde_json::json!({
        "schema": "skenion.node-catalog.snapshot",
        "schemaVersion": "0.1.0",
        "catalogRevision": zero_checksum_v01(),
        "entries": [
            {
                "catalogId": "project.folder-my-patch",
                "objectId": patch.id,
                "primaryObjectSpec": "Folder/My Patch?",
                "provider": {
                    "kind": "projectPatch",
                    "patchId": patch.id,
                    "revision": patch.revision,
                    "interfaceDigest": interface_digest
                },
                "aliases": ["Folder.My-Patch"],
                "definition": {
                    "schema": "skenion.node.definition",
                    "schemaVersion": "0.1.0",
                    "id": definition_id,
                    "version": "0.1.0",
                    "displayName": "Folder/My Patch?",
                    "category": "Project Patch",
                    "ports": ports,
                    "execution": { "model": "control" },
                    "state": { "persistent": false },
                    "permissions": [],
                    "capabilities": []
                },
                "creatable": true,
                "display": {
                    "title": "Folder/My Patch?",
                    "category": "Project Patch",
                    "palette": "direct"
                }
            }
        ]
    }))
    .expect("project patch catalog should parse");

    with_catalog_revision(snapshot)
}

#[test]
fn validates_public_node_catalog_contracts() {
    let public_display: NodeCatalogDisplayV01 =
        serde_json::from_value(serde_json::json!({ "title": "Float", "palette": "direct" }))
            .expect("display should parse");
    assert_eq!(
        public_display.palette,
        Some(NodeCatalogDisplayPaletteV01::Direct)
    );
    assert_eq!(
        serde_json::to_value(&public_display).expect("display should serialize")["palette"],
        serde_json::json!("direct")
    );
    let _public_provider: ObjectProviderRefV01 =
        serde_json::from_value(serde_json::json!({ "kind": "core" }))
            .expect("provider should parse");
    let _public_target: NodeCatalogIssueTargetV01 =
        serde_json::from_value(serde_json::json!({ "kind": "entry", "catalogId": "core.float" }))
            .expect("target should parse");
    let _public_severity = NodeCatalogIssueSeverityV01::Warning;
    let _public_issue: NodeCatalogIssueV01 = serde_json::from_value(serde_json::json!({
        "severity": "warning",
        "code": "catalog.generated",
        "message": "Generated.",
        "target": { "kind": "entry", "catalogId": "core.float" }
    }))
    .expect("issue should parse");
    let _public_entry: NodeCatalogEntryV01 = valid_core_catalog_snapshot().entries[0].clone();

    let core_catalog = valid_core_catalog_snapshot();
    let project_catalog = valid_project_patch_catalog_snapshot();
    let project_patch = valid_project_patch();

    validate_node_catalog_snapshot_v01(&core_catalog).expect("core catalog should validate");
    validate_node_catalog_snapshot_v01(&project_catalog)
        .expect("project patch catalog should validate");
    let package_catalog: NodeCatalogSnapshotV01 = serde_json::from_value(serde_json::json!({
        "schema": "skenion.node-catalog.snapshot",
        "schemaVersion": "0.1.0",
        "catalogRevision": zero_checksum_v01(),
        "entries": [
            {
                "catalogId": "package.skenion-examples.gain",
                "objectId": "gain",
                "primaryObjectSpec": "gain",
                "provider": {
                    "kind": "package",
                    "packageId": "skenion/examples",
                    "lockEntryId": "pkg-skenion-examples-0.45.0",
                    "version": "0.45.0"
                },
                "definition": minimal_node_definition_value("object.package.skenion-examples.gain", "Gain"),
                "creatable": true,
                "display": {
                    "title": "Gain",
                    "category": "Package"
                }
            }
        ]
    }))
    .expect("package catalog should parse");
    validate_node_catalog_snapshot_v01(&with_catalog_revision(package_catalog))
        .expect("package catalog should validate");
    assert_eq!(
        sanitize_project_patch_id_v01("Folder/My Patch?"),
        "Folder-My-Patch-"
    );
    assert_eq!(sanitize_project_patch_id_v01(""), "patch");
    assert_eq!(
        compute_patch_interface_digest_v01(&project_patch).value,
        "90548cb698af40b559a9538a7d07ba64839c09170857f2949cf792081fa0c33a"
    );
    assert_eq!(
        project_catalog.catalog_revision.value,
        "341ecbe57d2adbbcde7dce728f48b604b480ca7f9415a05cdbcfd548525ec1b9"
    );
    assert_eq!(
        core_catalog.catalog_revision.value,
        "b9e8b86b2c27a93e3bee1572f22550684d105fad471e2f050cdbc73104f4aa07"
    );

    let mut changed_patch = valid_project_patch();
    changed_patch.revision = "changed".to_owned();
    changed_patch.metadata = Some(
        serde_json::from_value(serde_json::json!({ "title": "Changed metadata" }))
            .expect("metadata should parse"),
    );
    assert_eq!(
        compute_patch_interface_digest_v01(&changed_patch),
        compute_patch_interface_digest_v01(&project_patch)
    );

    let mut patch_with_canonical_edge_values = valid_project_patch();
    patch_with_canonical_edge_values.graph.nodes[0].ports[0].accepts = Some(vec![
        "value.core.bang".to_owned(),
        "value.core.float64".to_owned(),
    ]);
    patch_with_canonical_edge_values.graph.nodes[0].ports[0].default_value =
        Some(serde_json::json!([null, 1, true, "ready"]));
    assert_eq!(
        compute_patch_interface_digest_v01(&patch_with_canonical_edge_values)
            .value
            .len(),
        64
    );

    let mut no_alias_entry = core_catalog.clone();
    no_alias_entry.entries[1].aliases = None;
    no_alias_entry = with_catalog_revision(no_alias_entry);
    validate_node_catalog_snapshot_v01(&no_alias_entry)
        .expect("catalog entries without aliases should validate");

    let mut catalog_scoped_issue = core_catalog.clone();
    catalog_scoped_issue.issues.as_mut().expect("issues")[0].target =
        NodeCatalogIssueTargetV01::Catalog;
    validate_node_catalog_snapshot_v01(&catalog_scoped_issue)
        .expect("catalog-scoped issues should validate");

    let mut revision_ignores_issues = core_catalog.clone();
    revision_ignores_issues.issues = Some(vec![
        serde_json::from_value(serde_json::json!({
            "severity": "warning",
            "code": "catalog.changed",
            "message": "This warning is excluded from the revision preimage.",
            "target": { "kind": "catalog" }
        }))
        .expect("issue should parse"),
    ]);
    revision_ignores_issues.entries[0].issues = Some(vec![
        serde_json::from_value(serde_json::json!({
            "severity": "warning",
            "code": "entry.changed",
            "message": "This warning is also excluded from the revision preimage.",
            "target": { "kind": "entry", "catalogId": "core.float" }
        }))
        .expect("issue should parse"),
    ]);
    assert_eq!(
        compute_node_catalog_revision_v01(&revision_ignores_issues),
        core_catalog.catalog_revision
    );
}

#[test]
fn reports_public_node_catalog_errors() {
    let mut duplicate_catalog_id = valid_core_catalog_snapshot();
    let mut duplicate_entry = duplicate_catalog_id.entries[1].clone();
    duplicate_entry.catalog_id = "core.float".to_owned();
    duplicate_entry.definition.id = "object.core.duplicate".to_owned();
    duplicate_entry.primary_object_spec = "duplicate".to_owned();
    duplicate_catalog_id.entries.push(duplicate_entry);
    duplicate_catalog_id = with_catalog_revision(duplicate_catalog_id);
    let report = validate_node_catalog_snapshot_v01(&duplicate_catalog_id)
        .expect_err("duplicate catalog id should fail");
    assert!(report.to_string().contains("duplicate catalogId"));

    let mut duplicate_definition = valid_core_catalog_snapshot();
    duplicate_definition.entries[1].definition = duplicate_definition.entries[0].definition.clone();
    duplicate_definition = with_catalog_revision(duplicate_definition);
    let report = validate_node_catalog_snapshot_v01(&duplicate_definition)
        .expect_err("duplicate definition should fail");
    assert!(
        report
            .to_string()
            .contains("duplicate node definition id/version")
    );

    let mut alias_collision = valid_core_catalog_snapshot();
    alias_collision.entries[1].aliases = Some(vec!["float".to_owned()]);
    alias_collision = with_catalog_revision(alias_collision);
    let report = validate_node_catalog_snapshot_v01(&alias_collision)
        .expect_err("alias collision should fail");
    assert!(report.to_string().contains("alias collides"));

    let mut unsorted_aliases = valid_core_catalog_snapshot();
    unsorted_aliases.entries[0].aliases = Some(vec!["zeta".to_owned(), "alpha".to_owned()]);
    unsorted_aliases = with_catalog_revision(unsorted_aliases);
    let report = validate_node_catalog_snapshot_v01(&unsorted_aliases)
        .expect_err("unsorted aliases should fail");
    assert!(report.to_string().contains("aliases must be sorted"));

    let mut bad_target = valid_core_catalog_snapshot();
    bad_target.issues.as_mut().expect("issues")[0].target = NodeCatalogIssueTargetV01::Entry {
        catalog_id: "missing.entry".to_owned(),
    };
    bad_target = with_catalog_revision(bad_target);
    let report =
        validate_node_catalog_snapshot_v01(&bad_target).expect_err("bad target should fail");
    assert!(report.to_string().contains("missing entry catalogId"));

    let mut error_issue = valid_core_catalog_snapshot();
    error_issue.issues.as_mut().expect("issues")[0].severity = NodeCatalogIssueSeverityV01::Error;
    error_issue = with_catalog_revision(error_issue);
    let report =
        validate_node_catalog_snapshot_v01(&error_issue).expect_err("error issue should fail");
    assert!(report.to_string().contains("must not use error severity"));

    let mut invalid_definition = valid_core_catalog_snapshot();
    invalid_definition.entries[0].definition.ports = serde_json::from_value(serde_json::json!([
        { "id": "dup", "direction": "input", "type": "value.core.float64" },
        { "id": "dup", "direction": "output", "type": "value.core.float64" }
    ]))
    .expect("ports should parse");
    invalid_definition = with_catalog_revision(invalid_definition);
    let report = validate_node_catalog_snapshot_v01(&invalid_definition)
        .expect_err("invalid nested definition should fail");
    assert!(report.to_string().contains("duplicate port id"));

    let mut empty_display_title = valid_core_catalog_snapshot();
    empty_display_title.entries[0].display.title.clear();
    empty_display_title = with_catalog_revision(empty_display_title);
    let report = validate_node_catalog_snapshot_v01(&empty_display_title)
        .expect_err("empty display title should fail");
    assert!(
        report
            .to_string()
            .contains("display.title must be a non-empty string")
    );

    let mut invalid_palette_value =
        serde_json::to_value(valid_core_catalog_snapshot()).expect("catalog should serialize");
    invalid_palette_value["entries"][0]["display"]["palette"] = serde_json::json!("neon");
    let invalid_palette_error =
        serde_json::from_value::<NodeCatalogSnapshotV01>(invalid_palette_value)
            .expect_err("invalid display palette should fail parsing");
    assert!(
        invalid_palette_error
            .to_string()
            .contains("unknown variant")
            && invalid_palette_error.to_string().contains("direct")
            && invalid_palette_error.to_string().contains("text")
    );

    let mut duplicate_canonical = valid_core_catalog_snapshot();
    duplicate_canonical.entries[1].primary_object_spec = "float".to_owned();
    duplicate_canonical = with_catalog_revision(duplicate_canonical);
    let report = validate_node_catalog_snapshot_v01(&duplicate_canonical)
        .expect_err("duplicate canonical text should fail");
    assert!(report.to_string().contains("duplicate primaryObjectSpec"));

    let mut duplicate_alias = valid_core_catalog_snapshot();
    duplicate_alias.entries[1].aliases = Some(vec!["dup".to_owned(), "dup".to_owned()]);
    duplicate_alias = with_catalog_revision(duplicate_alias);
    let report = validate_node_catalog_snapshot_v01(&duplicate_alias)
        .expect_err("duplicate alias should fail");
    assert!(
        report
            .to_string()
            .contains("duplicate catalog entry core.message alias")
    );

    let mut uppercase_checksum = valid_project_patch_catalog_snapshot();
    if let ObjectProviderRefV01::ProjectPatch {
        interface_digest: Some(interface_digest),
        ..
    } = &mut uppercase_checksum.entries[0].provider
    {
        interface_digest.value = interface_digest.value.to_uppercase();
    }
    let report = validate_node_catalog_snapshot_v01(&uppercase_checksum)
        .expect_err("uppercase checksum should fail");
    assert!(report.to_string().contains("sha256 hex value"));

    let mut empty_patch_id = valid_project_patch_catalog_snapshot();
    if let ObjectProviderRefV01::ProjectPatch { patch_id, .. } =
        &mut empty_patch_id.entries[0].provider
    {
        patch_id.clear();
    }
    empty_patch_id = with_catalog_revision(empty_patch_id);
    let report = validate_node_catalog_snapshot_v01(&empty_patch_id)
        .expect_err("empty project patch provider id should fail");
    assert!(report.to_string().contains("provider.patchId"));

    let mut revision_mismatch = valid_core_catalog_snapshot();
    revision_mismatch.catalog_revision.value = "f".repeat(64);
    let report = validate_node_catalog_snapshot_v01(&revision_mismatch)
        .expect_err("revision mismatch should fail");
    assert!(report.to_string().contains("catalogRevision mismatch"));

    let removed_field_snapshot_value =
        || serde_json::to_value(valid_core_catalog_snapshot()).expect("catalog should serialize");
    for (label, value, expected) in [
        (
            "legacy source field",
            {
                let mut value = removed_field_snapshot_value();
                value["entries"][0]["source"] = serde_json::json!({
                    "kind": "package",
                    "packageId": "skenion/examples",
                    "packageVersion": "0.1.0",
                    "providerId": "example.float"
                });
                value
            },
            "unknown field",
        ),
        (
            "generatedAt",
            {
                let mut value = removed_field_snapshot_value();
                value["generatedAt"] = serde_json::json!("2026-06-28T00:00:00Z");
                value
            },
            "unknown field",
        ),
        (
            "display object spec",
            {
                let mut value = removed_field_snapshot_value();
                value["entries"][0]["display"]["canonicalObjectSpec"] = serde_json::json!("float");
                value["entries"][0]["display"]["aliases"] = serde_json::json!(["float64"]);
                value
            },
            "unknown field",
        ),
        (
            "issue id",
            {
                let mut value = removed_field_snapshot_value();
                value["issues"][0]["id"] = serde_json::json!("catalog.generated");
                value
            },
            "unknown field",
        ),
        (
            "missing creatable",
            {
                let mut value = removed_field_snapshot_value();
                value["entries"][0]
                    .as_object_mut()
                    .expect("entry should be object")
                    .remove("creatable");
                value
            },
            "missing field",
        ),
    ] {
        let error = serde_json::from_value::<NodeCatalogSnapshotV01>(value)
            .expect_err(&format!("{label} should fail parsing"));
        assert!(
            error.to_string().contains(expected),
            "{label} parse error should contain {expected}: {error}"
        );
    }

    let mut creatable_false: NodeCatalogSnapshotV01 = serde_json::from_value({
        let mut value = removed_field_snapshot_value();
        value["entries"][0]["creatable"] = serde_json::json!(false);
        value
    })
    .expect("creatable false should parse before semantic validation");
    creatable_false = with_catalog_revision(creatable_false);
    let report = validate_node_catalog_snapshot_v01(&creatable_false)
        .expect_err("creatable false should fail validation");
    assert!(report.to_string().contains("creatable must be true"));

    let mut bad_project_definition_id = valid_project_patch_catalog_snapshot();
    bad_project_definition_id.entries[0].definition.id = "object.project.patch.bad".to_owned();
    bad_project_definition_id = with_catalog_revision(bad_project_definition_id);
    let report = validate_node_catalog_snapshot_v01(&bad_project_definition_id)
        .expect_err("bad project patch id should fail");
    assert!(report.to_string().contains("projectPatch catalog entry"));

    let mut wrong_schema = valid_core_catalog_snapshot();
    wrong_schema.schema = "skenion.node-catalog".to_owned();
    let report =
        validate_node_catalog_snapshot_v01(&wrong_schema).expect_err("wrong schema should fail");
    assert!(
        report
            .to_string()
            .contains("expected schema skenion.node-catalog.snapshot")
    );

    let mut wrong_schema_version = valid_core_catalog_snapshot();
    wrong_schema_version.schema_version = "0.2.0".to_owned();
    let report = validate_node_catalog_snapshot_v01(&wrong_schema_version)
        .expect_err("wrong schema version should fail");
    assert!(report.to_string().contains("expected schemaVersion 0.1.0"));
}

#[test]
fn parses_public_object_spec_lexical_matrix() {
    for input in [
        "[+ 1]",
        "[+ 1.]",
        "[+]",
        "[* 0.5]",
        "[/ 0.5]",
        "[sqrt]",
        "[+~]",
        "[-~]",
        "[*~ 0.5]",
        "[/~ 0.5]",
        "[sqrt~]",
        "[osc~ 440]",
        "[phasor~ 1]",
        "[adc~]",
        "[dac~]",
        "[frobnicate]",
        "[expr $f1]",
    ] {
        let result = parse_object_spec_v01(input);
        validate_object_spec_parse_result_v01(&result).expect("parse result should validate");
        assert!(result.ok, "{input} should parse");
        assert_eq!(result.implementation, None);
        assert_eq!(result.object_resolution, None);
        assert!(result.params.is_empty());
        assert!(result.instance_ports.is_empty());
    }

    for input in ["[+ 1", "+ 1]", ""] {
        let result = parse_object_spec_v01(input);
        validate_object_spec_parse_result_v01(&result).expect("failure result should validate");
        assert!(!result.ok, "{input} should fail without throwing");
        assert!(!result.issues.is_empty(), "{input} should include issues");
    }
}

#[test]
fn plans_public_audio_clock_bridge_requirements() {
    let source = AudioClockDomainV01 {
        id: "input-device".to_owned(),
        authority: AudioClockDomainAuthorityV01::DriverReported,
        source: "object.core.audio.input".to_owned(),
        sample_rate: Some(48_000),
        drift_compensated: None,
        shared_with: None,
    };
    let same = AudioClockDomainV01 {
        id: "input-device".to_owned(),
        authority: AudioClockDomainAuthorityV01::DriverReported,
        source: "object.core.audio.output".to_owned(),
        sample_rate: Some(48_000),
        drift_compensated: None,
        shared_with: None,
    };
    let independent = AudioClockDomainV01 {
        id: "output-device".to_owned(),
        authority: AudioClockDomainAuthorityV01::DriverReported,
        source: "object.core.audio.output".to_owned(),
        sample_rate: Some(48_000),
        drift_compensated: None,
        shared_with: None,
    };

    let direct = plan_audio_clock_bridge_v01(&source, &same, None);
    assert!(!direct.required);
    assert_eq!(direct.method, AudioClockBridgeMethodV01::Direct);

    let invalid = plan_audio_clock_bridge_v01(&source, &independent, None);
    assert!(invalid.required);
    assert_eq!(invalid.method, AudioClockBridgeMethodV01::Invalid);
    assert_eq!(
        invalid.issues[0].code,
        "audio-clock-domain-crossing-requires-bridge"
    );

    let bridged = plan_audio_clock_bridge_v01(&source, &independent, Some("bridge"));
    assert!(bridged.required);
    assert_eq!(bridged.method, AudioClockBridgeMethodV01::ClockBridge);
    assert_eq!(bridged.bridge_node_id.as_deref(), Some("bridge"));
}

#[test]
fn parses_public_midi_clock_messages_into_clock_state() {
    assert_eq!(
        parse_midi_clock_message_v01(&[0xf8]).map(|message| message.kind),
        Some(MidiClockMessageKindV01::Tick)
    );
    assert_eq!(
        parse_midi_clock_message_v01(&[0xfa]).map(|message| message.kind),
        Some(MidiClockMessageKindV01::Start)
    );
    assert_eq!(
        parse_midi_clock_message_v01(&[0xfb]).map(|message| message.kind),
        Some(MidiClockMessageKindV01::Continue)
    );
    assert_eq!(
        parse_midi_clock_message_v01(&[0xfc]).map(|message| message.kind),
        Some(MidiClockMessageKindV01::Stop)
    );
    assert_eq!(
        parse_midi_clock_message_v01(&[0xf2, 16, 0])
            .and_then(|message| message.song_position_sixteenth),
        Some(16)
    );
    assert_eq!(parse_midi_clock_message_v01(&[]), None);
    assert_eq!(parse_midi_clock_message_v01(&[0x90, 60, 127]), None);
    assert_eq!(parse_midi_clock_message_v01(&[0xf2, 0x80, 0]), None);

    let mut snapshot = MidiClockSnapshotV01::new("midi-a");
    snapshot.time_signature = Some(ClockTimeSignatureV01 {
        numerator: 4,
        denominator: 4,
    });
    let start = MidiClockMessageV01 {
        kind: MidiClockMessageKindV01::Start,
        song_position_sixteenth: None,
        received_host_time_ns: Some(100),
    };
    let mut result = apply_midi_clock_message_v01(&snapshot, &start);
    assert!(result.issues.is_empty());
    assert!(result.snapshot.running);
    assert_eq!(
        result
            .clock_state
            .running
            .as_ref()
            .and_then(|field| field.value),
        Some(true)
    );
    assert_eq!(
        result
            .clock_state
            .bar
            .as_ref()
            .and_then(|field| field.value),
        Some(1)
    );
    assert_eq!(
        result
            .clock_state
            .tempo_bpm
            .as_ref()
            .map(|field| field.authority.clone()),
        Some(ClockAuthorityV01::Unavailable)
    );
    assert_eq!(result.clock_state.last_update_host_time_ns, Some(100));

    let tick = MidiClockMessageV01 {
        kind: MidiClockMessageKindV01::Tick,
        song_position_sixteenth: None,
        received_host_time_ns: None,
    };
    result = apply_midi_clock_message_v01(&result.snapshot, &tick);
    assert!(result.issues.is_empty());
    assert_eq!(result.snapshot.tick_index, 1);
    assert_eq!(
        result
            .clock_state
            .ppq_position
            .as_ref()
            .and_then(|field| field.value),
        Some(1.0 / 24.0)
    );

    let spp = MidiClockMessageV01 {
        kind: MidiClockMessageKindV01::SongPositionPointer,
        song_position_sixteenth: Some(16),
        received_host_time_ns: None,
    };
    result = apply_midi_clock_message_v01(&result.snapshot, &spp);
    assert!(result.issues.is_empty());
    assert_eq!(result.snapshot.tick_index, 96);
    assert_eq!(
        result
            .clock_state
            .bar
            .as_ref()
            .and_then(|field| field.value),
        Some(2)
    );

    let stop = MidiClockMessageV01 {
        kind: MidiClockMessageKindV01::Stop,
        song_position_sixteenth: None,
        received_host_time_ns: None,
    };
    result = apply_midi_clock_message_v01(&result.snapshot, &stop);
    assert_eq!(
        result
            .clock_state
            .running
            .as_ref()
            .and_then(|field| field.value),
        Some(false)
    );

    let continue_message = MidiClockMessageV01 {
        kind: MidiClockMessageKindV01::Continue,
        song_position_sixteenth: None,
        received_host_time_ns: None,
    };
    result = apply_midi_clock_message_v01(&result.snapshot, &continue_message);
    assert_eq!(
        result
            .clock_state
            .running
            .as_ref()
            .and_then(|field| field.value),
        Some(true)
    );

    let no_meter = midi_clock_snapshot_to_clock_state_v01(&MidiClockSnapshotV01::new("midi-b"));
    assert_eq!(
        no_meter.bar.as_ref().map(|field| field.authority.clone()),
        Some(ClockAuthorityV01::Unavailable)
    );
    assert!(!no_meter.capabilities.contains(&ClockCapabilityV01::BarBeat));

    let mut invalid_timing = MidiClockSnapshotV01::new("midi-c");
    invalid_timing.ticks_per_quarter = 0;
    invalid_timing.time_signature = Some(ClockTimeSignatureV01 {
        numerator: 4,
        denominator: 0,
    });
    let invalid_state = midi_clock_snapshot_to_clock_state_v01(&invalid_timing);
    assert_eq!(
        invalid_state
            .ppq_position
            .as_ref()
            .and_then(|field| field.value),
        Some(0.0)
    );
    assert_eq!(
        invalid_state
            .bar
            .as_ref()
            .map(|field| field.authority.clone()),
        Some(ClockAuthorityV01::Unavailable)
    );

    let invalid_spp = MidiClockMessageV01 {
        kind: MidiClockMessageKindV01::SongPositionPointer,
        song_position_sixteenth: Some(16_384),
        received_host_time_ns: None,
    };
    let result = apply_midi_clock_message_v01(&MidiClockSnapshotV01::new("midi-d"), &invalid_spp);
    assert_eq!(result.issues[0].code, "invalid-midi-song-position-pointer");
    assert_eq!(result.snapshot.tick_index, 0);

    let missing_spp = MidiClockMessageV01 {
        kind: MidiClockMessageKindV01::SongPositionPointer,
        song_position_sixteenth: None,
        received_host_time_ns: None,
    };
    let result = apply_midi_clock_message_v01(&MidiClockSnapshotV01::new("midi-e"), &missing_spp);
    assert_eq!(result.issues[0].code, "invalid-midi-song-position-pointer");

    let mut saturated = MidiClockSnapshotV01::new("midi-f");
    saturated.tick_index = u64::MAX;
    let result = apply_midi_clock_message_v01(&saturated, &tick);
    assert_eq!(result.issues[0].code, "midi-clock-tick-overflow");
}

#[test]
fn validates_public_type_helpers() {
    let mut source = data_type(DataFlowV01::Signal, "value.core.float32");
    let mut target = data_type(DataFlowV01::Signal, "value.core.float32");

    assert_eq!(type_label_v01(&source), "signal<value.core.float32>");
    assert_eq!(
        StringOrStringsV01::One("f32".to_owned()).values(),
        vec!["f32"]
    );
    assert_eq!(
        StringOrStringsV01::Many(vec!["f32".to_owned(), "i16".to_owned()]).values(),
        vec!["f32", "i16"]
    );
    target.format = Some(StringOrStringsV01::One("f32".to_owned()));
    assert!(!compatible_data_types_v01(&source, &target));
    source.format = Some(StringOrStringsV01::One("f32".to_owned()));
    assert!(compatible_data_types_v01(&source, &target));
    target.data_kind = "value.core.bool".to_owned();
    assert!(!compatible_data_types_v01(&source, &target));

    let message_value_any = data_type(DataFlowV01::Control, "value.core.message");
    for data_kind in [
        "value.core.float32",
        "value.core.int32",
        "value.core.uint32",
        "value.core.bool",
        "value.core.color",
        "value.core.string",
        "value.core.message",
    ] {
        assert!(
            compatible_data_types_v01(
                &data_type(DataFlowV01::Control, data_kind),
                &message_value_any,
            ),
            "{data_kind} should be compatible with control value.core.message"
        );
    }
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
              "implementation": { "provider": { "kind": "core" }, "objectId": "node" },
              "params": {},
              "ports": [
                { "id": "out", "direction": "output", "type": "value.core.float64" }
              ]
            },
            {
              "id": "node",
              "implementation": { "provider": { "kind": "core" }, "objectId": "node" },
              "params": {},
              "ports": [
                { "id": "in", "direction": "input", "type": "value.core.bang" }
              ]
            }
          ],
          "edges": [
            { "id": "missing-edge", "source": { "nodeId": "node", "portId": "missing" }, "target": { "nodeId": "node", "portId": "missing" } },
            { "id": "wrong-direction", "source": { "nodeId": "node", "portId": "in" }, "target": { "nodeId": "node", "portId": "out" } }
          ]
        }"#,
    )
    .expect("graph should parse");

    let error = validate_graph_document_v01(&graph).expect_err("graph should fail");
    let text = error.to_string();

    assert!(text.contains("expected schema skenion.graph"));
    assert!(text.contains("duplicate node id: node"));
    assert!(text.contains("edge references missing source port node:missing"));
}
#[test]
fn validates_public_v01_graph_and_node_contracts() {
    let graph: GraphDocumentV01 = serde_json::from_str(
        r#"{
          "schema": "skenion.graph",
          "schemaVersion": "0.1.0",
          "id": "public-v01",
          "revision": "1",
          "nodes": [
            {
              "id": "clear",
              "implementation": { "provider": { "kind": "core" }, "objectId": "render.clear-color" },
              "params": { "color": [0, 0, 0, 1] },
              "ports": [
                { "id": "out", "direction": "output", "type": "value.core.tensor", "rate": "render" }
              ]
            },
            {
              "id": "output",
              "implementation": { "provider": { "kind": "core" }, "objectId": "render.output" },
              "params": {},
              "ports": [
                { "id": "in", "direction": "input", "type": "value.core.tensor", "rate": "render", "required": true }
              ]
            }
          ],
          "edges": [
            {
              "id": "edge_clear_output",
              "source": { "nodeId": "clear", "portId": "out" },
              "target": { "nodeId": "output", "portId": "in" },
              "resolvedType": "value.core.tensor"
            }
          ]
        }"#,
    )
    .expect("v0.1 graph should parse");
    let validation = validate_graph_document_v01(&graph).expect("v0.1 graph should validate");

    assert!(validation.ok);
    assert!(analyze_graph_document_v01(&graph).cycles.is_empty());

    let node: NodeDefinitionManifestV01 = serde_json::from_str(
        r#"{
          "schema": "skenion.node.definition",
          "schemaVersion": "0.1.0",
          "id": "object.core.render.output",
          "version": "0.1.0",
          "displayName": "Render Output",
          "category": "Render",
          "ports": [
            { "id": "in", "direction": "input", "type": "value.core.tensor", "rate": "render", "required": true }
          ],
          "execution": { "model": "gpu_pass", "clock": "frame" },
          "state": { "persistent": false },
          "permissions": [],
          "capabilities": ["object.core.render.output.v0.1"]
        }"#,
    )
    .expect("v0.1 node should parse");

    validate_node_definition_v01(&node).expect("v0.1 node should validate");
}

#[test]
fn validates_public_v01_project_and_derived_patch_contracts() {
    let project: ProjectDocumentV01 = serde_json::from_str(include_str!(
        "../../../fixtures/project/v0.1/valid/n-m-boundary-patch.project.json"
    ))
    .expect("v0.1 project should parse");

    validate_project_document_v01(&project).expect("v0.1 project should validate");

    let contract = derive_patch_contract_v01(&project.patch_library[0]);
    let port_labels: Vec<String> = contract
        .ports
        .iter()
        .map(|port| format!("{}:{:?}", port.port.id, port.port.direction))
        .collect();

    assert_eq!(
        port_labels,
        vec![
            "left:Input",
            "right:Input",
            "sum:Output",
            "difference:Output"
        ]
    );
    assert_eq!(
        contract.ports[0].port.description.as_deref(),
        Some("Left input value.")
    );
    assert_eq!(contract.ports[0].boundary_node_id, "left_in");
    assert_eq!(contract.ports[0].boundary_port_id, "out");
}

#[test]
fn derives_public_v01_patch_contract_fallback_port_ids() {
    let project: ProjectDocumentV01 = serde_json::from_str(
        r#"{
          "schema": "skenion.project",
          "schemaVersion": "0.1.0",
          "id": "project-fallback-boundaries",
          "documentId": "00000000-0000-4000-8000-000000000301",
          "revision": "1",
          "graph": {
            "schema": "skenion.graph",
            "schemaVersion": "0.1.0",
            "id": "root",
            "revision": "1",
            "nodes": [],
            "edges": []
          },
          "viewState": {
            "schema": "skenion.view-state",
            "schemaVersion": "0.1.0",
            "canvas": { "nodes": {} }
          },
          "patchLibrary": [
            {
              "id": "fallbacks",
              "revision": "1",
              "graph": {
                "schema": "skenion.graph",
                "schemaVersion": "0.1.0",
                "id": "patch-fallbacks",
                "revision": "1",
                "nodes": [
                  {
                    "id": "fallback_input",
                    "implementation": { "provider": { "kind": "core" }, "objectId": "inlet" },
                    "params": {},
                    "ports": [
                      { "id": "out", "direction": "output", "type": "value.core.float64" }
                    ]
                  },
                  {
                    "id": "multi_input",
                    "implementation": { "provider": { "kind": "core" }, "objectId": "inlet" },
                    "params": {},
                    "ports": [
                      { "id": "first", "direction": "output", "type": "value.core.float64" },
                      { "id": "second", "direction": "output", "type": "value.core.float64" }
                    ]
                  },
                  {
                    "id": "fallback_output",
                    "implementation": { "provider": { "kind": "core" }, "objectId": "outlet" },
                    "params": {},
                    "ports": [
                      { "id": "in", "direction": "input", "type": "value.core.float64" }
                    ]
                  }
                ],
                "edges": []
              }
            }
          ]
        }"#,
    )
    .expect("v0.1 project should parse");

    validate_project_document_v01(&project).expect("v0.1 project should validate");

    let contracts = derive_patch_contracts_v01(&project);
    let port_labels: Vec<String> = contracts[0]
        .ports
        .iter()
        .map(|port| {
            format!(
                "{}:{:?}:{}:{}",
                port.port.id, port.port.direction, port.boundary_node_id, port.boundary_port_id
            )
        })
        .collect();

    assert_eq!(
        port_labels,
        vec![
            "fallback_input:Input:fallback_input:out",
            "first:Input:multi_input:first",
            "second:Input:multi_input:second",
            "fallback_output:Output:fallback_output:in"
        ]
    );
}

#[test]
fn rejects_public_v01_view_state_viewport_field() {
    let result: Result<ViewStateV01, _> = serde_json::from_str(
        r#"{
          "schema": "skenion.view-state",
          "schemaVersion": "0.1.0",
          "canvas": {
            "nodes": {},
            "viewport": { "x": 0, "y": 0, "zoom": 1 }
          }
        }"#,
    );

    let error = result.expect_err("viewport is not part of persisted v0.1 view state");
    assert!(
        error.to_string().contains("unknown field `viewport`"),
        "{error}"
    );
}

#[test]
fn reports_public_v01_project_and_patch_definition_errors() {
    let project: ProjectDocumentV01 = serde_json::from_value(serde_json::json!({
        "schema": "wrong.project",
        "schemaVersion": "9.9.9",
        "id": "",
        "documentId": "not-a-uuid",
        "revision": "",
        "graph": {
            "schema": "wrong.graph",
            "schemaVersion": "9.9.9",
            "id": "root",
            "revision": "1",
            "nodes": [
                {
                    "id": "source",
                    "implementation": { "provider": { "kind": "core" }, "objectId": "float" },
                    "params": {},
                    "ports": [
                        { "id": "out", "direction": "output", "type": "value.core.float64" }
                    ]
                },
                {
                    "id": "target",
                    "implementation": { "provider": { "kind": "core" }, "objectId": "render.output" },
                    "params": {},
                    "ports": [
                        { "id": "in", "direction": "input", "type": "value.core.tensor" }
                    ]
                }
            ],
            "edges": [
                {
                    "id": "edge_root_bad",
                    "source": { "nodeId": "source", "portId": "out" },
                    "target": { "nodeId": "target", "portId": "in" }
                }
            ]
        },
        "viewState": {
            "schema": "skenion.view-state",
            "schemaVersion": "0.1.0",
            "canvas": {
                "nodes": {
                    "missing_root_view": { "x": 0, "y": 0 }
                }
            }
        },
        "patchLibrary": [
            {
                "id": "",
                "revision": "",
                "graph": {
                    "schema": "wrong.patch.graph",
                    "schemaVersion": "9.9.9",
                    "id": "patch",
                    "revision": "1",
                    "nodes": [
                        {
                            "id": "inlet_a",
                            "implementation": { "provider": { "kind": "core" }, "objectId": "inlet" },
                            "params": { "portId": "same" },
                            "ports": [
                                { "id": "out", "direction": "output", "type": "value.core.float64" }
                            ]
                        },
                        {
                            "id": "inlet_b",
                            "implementation": { "provider": { "kind": "core" }, "objectId": "inlet" },
                            "params": { "portId": "same" },
                            "ports": [
                                { "id": "out", "direction": "output", "type": "value.core.float64" }
                            ]
                        },
                        {
                            "id": "sink",
                            "implementation": { "provider": { "kind": "core" }, "objectId": "render.output" },
                            "params": {},
                            "ports": [
                                { "id": "in", "direction": "input", "type": "value.core.tensor" }
                            ]
                        }
                    ],
                    "edges": [
                        {
                            "id": "edge_patch_bad",
                            "source": { "nodeId": "inlet_a", "portId": "out" },
                            "target": { "nodeId": "sink", "portId": "in" }
                        }
                    ]
                },
                "viewState": {
                    "schema": "skenion.view-state",
                    "schemaVersion": "0.1.0",
                    "canvas": {
                        "nodes": {
                            "missing_patch_view": { "x": 0, "y": 0 }
                        }
                    }
                }
            }
        ]
    }))
    .expect("invalid project should still parse");

    let report =
        validate_project_document_v01(&project).expect_err("project should fail validation");
    let text = report.to_string();

    for expected in [
        "expected schema skenion.project, found wrong.project",
        "expected schemaVersion 0.1.0, found 9.9.9",
        "project id must not be empty",
        "project documentId must be a UUID: not-a-uuid",
        "project revision must not be empty",
        "root graph expected schema skenion.graph, found wrong.graph",
        "root graph expected schemaVersion 0.1.0, found 9.9.9",
        "root graph incompatible-type",
        "viewState references missing graph node: missing_root_view",
        "patch id must not be empty",
        "patch revision must not be empty",
        "patch  graph expected schema skenion.graph, found wrong.patch.graph",
        "patch  graph expected schemaVersion 0.1.0, found 9.9.9",
        "patch  graph incompatible-type",
        "patch  viewState references missing graph node: missing_patch_view",
        "duplicate boundary port id on patch : same",
    ] {
        assert!(
            text.contains(expected),
            "{expected:?} should appear in {text:?}"
        );
    }
}
