use skenion_contracts::{
    ApplyPatchErrorV01, AudioClockBridgeMethodV01, AudioClockDomainAuthorityV01,
    AudioClockDomainV01, ClockAuthorityV01, ClockCapabilityV01, ClockTimeSignatureV01, DataFlowV01,
    DataTypeV01, ExtensionKindV01, ExtensionManifestV01, GraphDocumentV01, GraphDocumentV02,
    GraphFragmentOutsideEndpointPolicyV02, GraphFragmentV02, GraphPatchOperationV01, GraphPatchV01,
    MidiClockMessageKindV01, MidiClockMessageV01, MidiClockSnapshotV01, NodeDefinitionManifestV01,
    NodeDefinitionManifestV02, NumberRangeV01, ObjectTextParseResultV01, ProjectDocumentV02,
    RuntimeCollaborationEventEnvelope, RuntimeCollaborationEventKind,
    RuntimeCollaborationOperationBatchResult, RuntimeCollaborationOperationEnvelope,
    RuntimeCollaborationOperationResult, RuntimeCollaborationRebaseStrategy,
    RuntimeOperationEnvelope, RuntimeSessionEvent, RuntimeSessionEventKind,
    RuntimeSessionInfoResponse, StringOrStringsV01, analyze_graph_document_v02,
    analyze_graph_fragment_v02, apply_graph_patch_v01, apply_midi_clock_message_v01,
    compatible_data_types_v01, derive_patch_contract_v02, derive_patch_contracts_v02,
    invert_graph_patch_v01, midi_clock_snapshot_to_clock_state_v01, parse_midi_clock_message_v01,
    parse_object_text_v01, plan_audio_clock_bridge_v01, type_label_v01,
    validate_graph_document_v01, validate_graph_document_v02, validate_graph_fragment_v02,
    validate_node_definition_v01, validate_node_definition_v02,
    validate_object_text_parse_result_v01, validate_project_document_v02,
    validate_runtime_collaboration_event_envelope,
    validate_runtime_collaboration_operation_batch_result,
    validate_runtime_collaboration_operation_envelope,
    validate_runtime_collaboration_operation_result, validate_runtime_operation_envelope,
    validate_runtime_session_event, validate_runtime_session_info_response,
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
fn serializes_optional_contract_fields_as_absent() {
    let mut number = data_type(DataFlowV01::Value, "number.float");
    number.range = Some(NumberRangeV01 {
        min: Some(0.0),
        max: None,
        step: None,
    });
    let serialized_type = serde_json::to_value(&number).expect("type should serialize");

    assert_eq!(
        serialized_type,
        serde_json::json!({
            "flow": "value",
            "dataKind": "number.float",
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
              "kind": "core.slider",
              "kindVersion": "0.1.0",
              "params": {},
              "ports": [
                { "id": "out", "direction": "output", "type": { "flow": "value", "dataKind": "number.float" } }
              ]
            }
          ],
          "edges": []
        }"#,
    )
    .expect("graph should parse");
    let serialized_graph = serde_json::to_string(&graph).expect("graph should serialize");

    assert!(!serialized_graph.contains("null"));
    assert!(serialized_graph.contains(r#""dataKind":"number.float""#));
    assert!(validate_graph_document_v01(&graph).is_ok());
}

#[test]
fn parses_public_graph_fragment_paste_contracts() {
    let operation: RuntimeOperationEnvelope = serde_json::from_str(
        r#"{
          "schema": "skenion.runtime.operation",
          "schemaVersion": "0.1.0",
          "id": "op-public-paste",
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
              "edges": []
            }
          },
          "correlationId": "public-test"
        }"#,
    )
    .expect("operation should parse");

    validate_runtime_operation_envelope(&operation).expect("operation should validate");
    assert!(operation.attribution.is_none());
    assert_eq!(operation.request.target.base_revision, "1");

    let fragment: &GraphFragmentV02 = &operation.request.fragment;
    let analysis =
        analyze_graph_fragment_v02(fragment, GraphFragmentOutsideEndpointPolicyV02::Reject);
    assert!(analysis.ok);
    validate_graph_fragment_v02(fragment).expect("fragment should validate");
}

#[test]
fn parses_public_collaboration_operation_contract() {
    let operation: RuntimeCollaborationOperationEnvelope = serde_json::from_str(
        r#"{
          "schema": "skenion.runtime.collaboration.operation",
          "schemaVersion": "0.1.0",
          "operationId": "op-public-collab",
          "sessionId": "session-a",
          "participantId": "participant-a",
          "idempotencyKey": "session-a:participant-a:1",
          "causal": {
            "baseRevision": "root-rev-1",
            "baseSequence": 1,
            "vector": { "participant-a": 1 }
          },
          "payload": {
            "kind": "undoRedo",
            "action": "undo",
            "scope": { "kind": "participant", "participantId": "participant-a" },
            "maxOperations": 1
          },
          "submittedAt": "2026-06-22T00:00:00.000Z"
        }"#,
    )
    .expect("collaboration operation should parse");

    validate_runtime_collaboration_operation_envelope(&operation)
        .expect("collaboration operation should validate");
    assert_eq!(operation.participant_id, "participant-a");
}

#[test]
fn parses_public_collaboration_batch_result_and_rebase_enums() {
    let batch_result: RuntimeCollaborationOperationBatchResult =
        serde_json::from_str(include_str!(
            "../../../fixtures/runtime-collaboration/v0/valid/operation-batch-result.json"
        ))
        .expect("batch result should parse");
    validate_runtime_collaboration_operation_batch_result(&batch_result)
        .expect("batch result should validate");
    assert_eq!(batch_result.results.len(), 2);

    let mut wrong_schema = batch_result.clone();
    wrong_schema.schema = "skenion.runtime.collaboration.operation-batch".to_owned();
    let wrong_schema_report = validate_runtime_collaboration_operation_batch_result(&wrong_schema)
        .expect_err("wrong batch result schema should fail");
    assert!(
        wrong_schema_report
            .errors()
            .iter()
            .any(|error| error.message.contains("expected schema"))
    );

    let mut wrong_version = batch_result.clone();
    wrong_version.schema_version = "0.2.0".to_owned();
    let wrong_version_report =
        validate_runtime_collaboration_operation_batch_result(&wrong_version)
            .expect_err("wrong batch result schemaVersion should fail");
    assert!(
        wrong_version_report
            .errors()
            .iter()
            .any(|error| error.message.contains("expected schemaVersion 0.1.0"))
    );

    let mut empty_results = batch_result.clone();
    empty_results.results.clear();
    let empty_results_report =
        validate_runtime_collaboration_operation_batch_result(&empty_results)
            .expect_err("empty batch result should fail");
    assert!(
        empty_results_report
            .errors()
            .iter()
            .any(|error| error.message.contains("at least one operation result"))
    );

    let mut nested_invalid = batch_result.clone();
    nested_invalid.results[0].schema = "skenion.runtime.collaboration.operation".to_owned();
    let nested_invalid_report =
        validate_runtime_collaboration_operation_batch_result(&nested_invalid)
            .expect_err("invalid nested operation result should fail");
    assert!(
        nested_invalid_report
            .errors()
            .iter()
            .any(|error| error.message.contains("expected schema"))
    );

    let rebased: RuntimeCollaborationOperationResult = serde_json::from_str(include_str!(
        "../../../fixtures/runtime-collaboration/v0/valid/rebased-mixed-change-set.operation-result.json"
    ))
    .expect("rebased result should parse");
    validate_runtime_collaboration_operation_result(&rebased)
        .expect("rebased result should validate");
    assert_eq!(
        rebased
            .rebase
            .as_ref()
            .expect("rebased result should include rebase metadata")
            .strategy,
        RuntimeCollaborationRebaseStrategy::OtTransform
    );

    let invalid_strategy = serde_json::from_str::<RuntimeCollaborationOperationResult>(
        include_str!(
            "../../../fixtures/runtime-collaboration/v0/invalid/rebase-unknown-strategy.operation-result.json"
        ),
    );
    assert!(invalid_strategy.is_err());
}

#[test]
fn validates_public_remaining_collaboration_coverage_paths() {
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
    assert_eq!(
        valid_gap_event.kind,
        RuntimeCollaborationEventKind::OperationResult
    );

    let selection_event: RuntimeCollaborationEventEnvelope = serde_json::from_str(
        r#"{
          "schema": "skenion.runtime.collaboration.event",
          "schemaVersion": "0.1.0",
          "eventId": "event-selection",
          "sessionId": "session-collab-a",
          "sequence": 10,
          "causal": {
            "baseRevision": "root-rev-10",
            "baseSequence": 10,
            "vector": { "participant-a": 10 }
          },
          "kind": "selection",
          "payload": {
            "kind": "selection",
            "selection": {
              "schema": "skenion.runtime.collaboration.selection",
              "schemaVersion": "0.1.0",
              "sessionId": "session-collab-a",
              "participantId": "participant-a",
              "target": { "path": { "kind": "root" }, "baseRevision": "root-rev-10" },
              "selection": {
                "ranges": [
                  { "kind": "nodes", "nodeIds": ["gain"] }
                ],
                "activeRangeIndex": 0
              },
              "cursor": {
                "kind": "canvas",
                "x": 120.0,
                "y": 80.0,
                "clientWindowId": "window-a"
              },
              "updatedAt": "2026-06-22T00:00:00.050Z",
              "expiresAt": "2026-06-22T00:00:05.050Z"
            }
          },
          "replay": {
            "cursor": "10",
            "previousCursor": "9",
            "replayed": false,
            "gap": null,
            "overflow": false
          },
          "createdAt": "2026-06-22T00:00:00.050Z"
        }"#,
    )
    .expect("selection event should parse");
    validate_runtime_collaboration_event_envelope(&selection_event)
        .expect("selection event should validate");
    assert_eq!(
        selection_event.kind,
        RuntimeCollaborationEventKind::Selection
    );

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
fn parses_public_session_addressed_runtime_event() {
    let info: RuntimeSessionInfoResponse = serde_json::from_str(
        r#"{
          "schema": "skenion.runtime.session.info",
          "schemaVersion": "0.1.0",
          "ok": true,
          "sessionId": "session-a",
          "lifecycle": "ready",
          "snapshot": { "sessionRevision": 1, "viewRevision": 1, "controlRevision": 1, "project": null, "diagnostics": [], "plan": null },
          "profile": {
            "mode": "remote",
            "ownership": "remote",
            "endpoint": { "url": "https://runtime.example.test", "protocol": "https" },
            "process": null
          },
          "capabilities": {
            "sessionAddressing": true,
            "defaultSessionAlias": true,
            "eventReplay": true,
            "multiWindow": true,
            "profiles": ["local-managed", "local-shared", "remote"],
            "authPolicy": "deferred"
          },
          "eventReplay": {
            "cursorKind": "sequence",
            "currentCursor": "1",
            "earliestSequence": 1,
            "latestSequence": 1,
            "replayLimit": 512
          },
          "diagnostics": []
        }"#,
    )
    .expect("session info should parse");
    validate_runtime_session_info_response(&info).expect("session info should validate");
    assert_eq!(info.session_id, "session-a");

    let event: RuntimeSessionEvent = serde_json::from_str(
        r#"{
          "schema": "skenion.runtime.session.event",
          "schemaVersion": "0.1.0",
          "id": "event-1",
          "sessionId": "session-a",
          "sequence": 1,
          "sessionRevision": 1,
          "kind": "snapshot",
          "snapshot": { "sessionRevision": 1, "viewRevision": 1, "controlRevision": 1, "project": null, "diagnostics": [], "plan": null },
          "history": {
            "schema": "skenion.runtime.history",
            "schemaVersion": "0.1.0",
            "entries": [],
            "canUndo": false,
            "canRedo": false,
            "undoDepth": 0,
            "redoDepth": 0
          },
          "replay": {
            "cursor": "1",
            "previousCursor": null,
            "replayed": false,
            "gap": null,
            "overflow": false
          },
          "diagnostics": [],
          "createdAt": "2026-06-21T00:00:00.000Z"
        }"#,
    )
    .expect("session event should parse");

    validate_runtime_session_event(&event).expect("session event should validate");
    assert_eq!(event.session_id, "session-a");
    assert_eq!(event.kind, RuntimeSessionEventKind::Snapshot);
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
            { "id": "out", "direction": "output", "type": { "flow": "event", "dataKind": "event.bang" }, "activation": "trigger" }
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
              { "nodeId": "core.value", "markdownPath": "help/value.md" }
            ]
          },
          "permissions": [],
          "tests": [
            { "id": "value-baseline", "kind": "node", "target": "core.value", "fixturePath": "tests/value.input.json" }
          ]
        }"#,
    )
    .expect("extension manifest should parse");

    assert_eq!(manifest.kind, ExtensionKindV01::CorePackage);
    assert_eq!(manifest.provides.help[0].node_id, "core.value");
    assert_eq!(manifest.tests[0].id, "value-baseline");
}

#[test]
fn validates_public_object_text_parse_results() {
    let result: ObjectTextParseResultV01 = serde_json::from_str(
        r#"{
          "schema": "skenion.object-text.parse-result",
          "schemaVersion": "0.1.0",
          "input": "[*~ 0.5]",
          "ok": true,
          "classSymbol": "*~",
          "creationArgs": [{ "type": "float", "value": 0.5, "representation": "f32" }],
          "resolvedKind": "audio.operator.mul",
          "resolvedKindVersion": "0.1.0",
          "params": { "right": 0.5 },
          "instancePorts": [
            { "id": "in", "direction": "input", "type": "signal.audio", "rate": "audio", "activation": "latched" },
            { "id": "right", "direction": "input", "type": "number.float", "rate": "control", "activation": "latched", "defaultValue": 0.5 },
            { "id": "out", "direction": "output", "type": "signal.audio", "rate": "audio" }
          ],
          "displayText": "*~ 0.5",
          "diagnostics": []
        }"#,
    )
    .expect("object text result should parse");

    validate_object_text_parse_result_v01(&result).expect("object text result should validate");
    assert_eq!(result.resolved_kind.as_deref(), Some("audio.operator.mul"));

    let mut wrong_schema = result.clone();
    wrong_schema.schema = "wrong.object-text".to_owned();
    let schema_error = validate_object_text_parse_result_v01(&wrong_schema)
        .expect_err("schema mismatch should fail");
    assert!(schema_error.to_string().contains("wrong.object-text"));

    let mut wrong_version = result;
    wrong_version.schema_version = "9.9.9".to_owned();
    let version_error = validate_object_text_parse_result_v01(&wrong_version)
        .expect_err("schema version mismatch should fail");
    assert!(version_error.to_string().contains("9.9.9"));

    let parsed = parse_object_text_v01("[osc~ 440]");
    assert_eq!(parsed.resolved_kind.as_deref(), Some("audio.osc"));
    assert_eq!(
        parsed.params.get("frequency"),
        Some(&serde_json::json!(440))
    );
}

#[test]
fn parses_public_object_text_baseline_matrix() {
    let supported = [
        ("[+ 1]", Some("core.operator.add")),
        ("[+ 1.]", Some("core.operator.add")),
        ("[+]", Some("core.operator.add")),
        ("[* 0.5]", Some("core.operator.mul")),
        ("[/ 0.5]", Some("core.operator.div")),
        ("[sqrt]", Some("core.operator.sqrt")),
        ("[+~]", Some("audio.operator.add")),
        ("[-~]", Some("audio.operator.sub")),
        ("[*~ 0.5]", Some("audio.operator.mul")),
        ("[/~ 0.5]", Some("audio.operator.div")),
        ("[sqrt~]", Some("audio.operator.sqrt")),
        ("[osc~ 440]", Some("audio.osc")),
        ("[phasor~ 1]", Some("audio.phasor")),
        ("[adc~]", Some("audio.input")),
        ("[dac~]", Some("audio.output")),
    ];

    for (input, expected_kind) in supported {
        let result = parse_object_text_v01(input);
        validate_object_text_parse_result_v01(&result).expect("parse result should validate");
        assert!(result.ok, "{input} should parse");
        assert_eq!(result.resolved_kind.as_deref(), expected_kind);
    }

    for input in [
        "[+ 1",
        "+ 1]",
        "",
        "[+ 1 2]",
        "[+ true]",
        "[+ false]",
        "[+ 1.bad]",
        "[+ 1e309]",
        "[*~ 1 2]",
        "[*~ beep]",
        "[/~ false]",
        "[sqrt~ 1]",
        "[osc~ 1 2]",
        "[osc~ false]",
        "[phasor~ beep]",
        "[adc~ 1]",
        "[dac~ 1]",
        "[sin~]",
        "[expr $f1]",
        "[frobnicate]",
    ] {
        let result = parse_object_text_v01(input);
        validate_object_text_parse_result_v01(&result).expect("failure result should validate");
        assert!(!result.ok, "{input} should fail without throwing");
        assert!(
            !result.diagnostics.is_empty(),
            "{input} should include diagnostics"
        );
    }
}

#[test]
fn plans_public_audio_clock_bridge_requirements() {
    let source = AudioClockDomainV01 {
        id: "input-device".to_owned(),
        authority: AudioClockDomainAuthorityV01::DriverReported,
        source: "audio.input".to_owned(),
        sample_rate: Some(48_000),
        drift_compensated: None,
        shared_with: None,
    };
    let same = AudioClockDomainV01 {
        id: "input-device".to_owned(),
        authority: AudioClockDomainAuthorityV01::DriverReported,
        source: "audio.output".to_owned(),
        sample_rate: Some(48_000),
        drift_compensated: None,
        shared_with: None,
    };
    let independent = AudioClockDomainV01 {
        id: "output-device".to_owned(),
        authority: AudioClockDomainAuthorityV01::DriverReported,
        source: "audio.output".to_owned(),
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
        invalid.diagnostics[0].code,
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
    assert!(result.diagnostics.is_empty());
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
    assert!(result.diagnostics.is_empty());
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
    assert!(result.diagnostics.is_empty());
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
    assert_eq!(
        result.diagnostics[0].code,
        "invalid-midi-song-position-pointer"
    );
    assert_eq!(result.snapshot.tick_index, 0);

    let missing_spp = MidiClockMessageV01 {
        kind: MidiClockMessageKindV01::SongPositionPointer,
        song_position_sixteenth: None,
        received_host_time_ns: None,
    };
    let result = apply_midi_clock_message_v01(&MidiClockSnapshotV01::new("midi-e"), &missing_spp);
    assert_eq!(
        result.diagnostics[0].code,
        "invalid-midi-song-position-pointer"
    );

    let mut saturated = MidiClockSnapshotV01::new("midi-f");
    saturated.tick_index = u64::MAX;
    let result = apply_midi_clock_message_v01(&saturated, &tick);
    assert_eq!(result.diagnostics[0].code, "midi-clock-tick-overflow");
}

#[test]
fn validates_public_type_helpers() {
    let mut source = data_type(DataFlowV01::Signal, "number.float");
    let mut target = data_type(DataFlowV01::Signal, "number.float");

    assert_eq!(type_label_v01(&source), "signal<number.float>");
    target.format = Some(StringOrStringsV01::One("f32".to_owned()));
    assert!(compatible_data_types_v01(&source, &target));
    source.format = Some(StringOrStringsV01::One("f64".to_owned()));
    assert!(compatible_data_types_v01(&source, &target));
    target.data_kind = "boolean".to_owned();
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
                { "id": "out", "direction": "output", "type": { "flow": "value", "dataKind": "number.float" }, "activation": "trigger" }
              ]
            },
            {
              "id": "node",
              "kind": "core.node",
              "kindVersion": "0.1.0",
              "params": {},
              "ports": [
                { "id": "in", "direction": "input", "type": { "flow": "event", "dataKind": "event.bang" }, "activation": "trigger" }
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

#[test]
fn applies_public_graph_patch() {
    let graph: GraphDocumentV01 = serde_json::from_str(
        r#"{
          "schema": "skenion.graph",
          "schemaVersion": "0.1.0",
          "id": "public-patch",
          "revision": "1",
          "nodes": [
            {
              "id": "source",
              "kind": "core.slider",
              "kindVersion": "0.1.0",
              "params": { "value": 0.5 },
              "ports": [
                { "id": "out", "direction": "output", "type": { "flow": "value", "dataKind": "number.float" } }
              ]
            }
          ],
          "edges": []
        }"#,
    )
    .expect("graph should parse");
    let patch = GraphPatchV01 {
        schema: "skenion.graph.patch".to_owned(),
        schema_version: "0.1.0".to_owned(),
        id: "patch".to_owned(),
        base_revision: "1".to_owned(),
        client_id: None,
        created_at: None,
        description: None,
        ops: vec![GraphPatchOperationV01::SetNodeParam {
            node_id: "source".to_owned(),
            key: "value".to_owned(),
            value: serde_json::Value::from(0.75),
        }],
    };

    let result = apply_graph_patch_v01(&graph, &patch, Some("2")).expect("patch should apply");

    assert_eq!(result.revision, "2");
    assert_eq!(
        result.nodes[0].params["value"],
        serde_json::Value::from(0.75)
    );

    let mut conflict = patch;
    conflict.base_revision = "0".to_owned();
    assert!(matches!(
        apply_graph_patch_v01(&graph, &conflict, None),
        Err(ApplyPatchErrorV01::BaseRevisionMismatch { .. })
    ));
}

#[test]
fn inverts_public_graph_patch() {
    let graph: GraphDocumentV01 = serde_json::from_str(
        r#"{
          "schema": "skenion.graph",
          "schemaVersion": "0.1.0",
          "id": "public-invert",
          "revision": "1",
          "nodes": [
            {
              "id": "source",
              "kind": "core.slider",
              "kindVersion": "0.1.0",
              "params": { "value": 0.5 },
              "ports": [
                { "id": "out", "direction": "output", "type": { "flow": "value", "dataKind": "number.float" } }
              ]
            }
          ],
          "edges": []
        }"#,
    )
    .expect("graph should parse");
    let patch = GraphPatchV01 {
        schema: "skenion.graph.patch".to_owned(),
        schema_version: "0.1.0".to_owned(),
        id: "patch".to_owned(),
        base_revision: "1".to_owned(),
        client_id: None,
        created_at: None,
        description: None,
        ops: vec![GraphPatchOperationV01::SetNodeParam {
            node_id: "source".to_owned(),
            key: "value".to_owned(),
            value: serde_json::Value::from(0.75),
        }],
    };

    let inverse = invert_graph_patch_v01(&graph, &patch).expect("patch should invert");

    assert_eq!(inverse.base_revision, "2");
    assert_eq!(inverse.ops.len(), 1);
}

#[test]
fn validates_public_v02_graph_and_node_contracts() {
    let graph: GraphDocumentV02 = serde_json::from_str(
        r#"{
          "schema": "skenion.graph",
          "schemaVersion": "0.2.0",
          "id": "public-v02",
          "revision": "1",
          "nodes": [
            {
              "id": "clear",
              "kind": "render.clear-color",
              "kindVersion": "0.2.0",
              "params": { "color": [0, 0, 0, 1] },
              "ports": [
                { "id": "out", "direction": "output", "type": "render.frame", "rate": "render" }
              ]
            },
            {
              "id": "output",
              "kind": "render.output",
              "kindVersion": "0.2.0",
              "params": {},
              "ports": [
                { "id": "in", "direction": "input", "type": "render.frame", "rate": "render", "required": true }
              ]
            }
          ],
          "edges": [
            {
              "id": "edge_clear_output",
              "source": { "nodeId": "clear", "portId": "out" },
              "target": { "nodeId": "output", "portId": "in" },
              "resolvedType": "render.frame"
            }
          ]
        }"#,
    )
    .expect("v0.2 graph should parse");
    let validation = validate_graph_document_v02(&graph).expect("v0.2 graph should validate");

    assert!(validation.ok);
    assert!(analyze_graph_document_v02(&graph).cycles.is_empty());

    let node: NodeDefinitionManifestV02 = serde_json::from_str(
        r#"{
          "schema": "skenion.node.definition",
          "schemaVersion": "0.2.0",
          "id": "render.output",
          "version": "0.2.0",
          "displayName": "Render Output",
          "category": "Render",
          "ports": [
            { "id": "in", "direction": "input", "type": "render.frame", "rate": "render", "required": true }
          ],
          "execution": { "model": "gpu_pass", "clock": "frame" },
          "state": { "persistent": false },
          "permissions": [],
          "capabilities": ["render.output.v0.2"]
        }"#,
    )
    .expect("v0.2 node should parse");

    validate_node_definition_v02(&node).expect("v0.2 node should validate");
}

#[test]
fn validates_public_v02_project_and_derived_patch_contracts() {
    let project: ProjectDocumentV02 = serde_json::from_str(include_str!(
        "../../../fixtures/project/v0.2/valid/n-m-boundary-patch.project.json"
    ))
    .expect("v0.2 project should parse");

    validate_project_document_v02(&project).expect("v0.2 project should validate");

    let contract = derive_patch_contract_v02(&project.patch_library[0]);
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
fn derives_public_v02_patch_contract_fallback_port_ids() {
    let project: ProjectDocumentV02 = serde_json::from_str(
        r#"{
          "schema": "skenion.project",
          "schemaVersion": "0.2.0",
          "id": "project-fallback-boundaries",
          "revision": "1",
          "graph": {
            "schema": "skenion.graph",
            "schemaVersion": "0.2.0",
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
                "schemaVersion": "0.2.0",
                "id": "patch-fallbacks",
                "revision": "1",
                "nodes": [
                  {
                    "id": "fallback_input",
                    "kind": "core.inlet",
                    "kindVersion": "0.2.0",
                    "params": {},
                    "ports": [
                      { "id": "out", "direction": "output", "type": "number.float" }
                    ]
                  },
                  {
                    "id": "multi_input",
                    "kind": "core.inlet",
                    "kindVersion": "0.2.0",
                    "params": {},
                    "ports": [
                      { "id": "first", "direction": "output", "type": "number.float" },
                      { "id": "second", "direction": "output", "type": "number.float" }
                    ]
                  },
                  {
                    "id": "fallback_output",
                    "kind": "core.outlet",
                    "kindVersion": "0.2.0",
                    "params": {},
                    "ports": [
                      { "id": "in", "direction": "input", "type": "number.float" }
                    ]
                  }
                ],
                "edges": []
              }
            }
          ]
        }"#,
    )
    .expect("v0.2 project should parse");

    validate_project_document_v02(&project).expect("v0.2 project should validate");

    let contracts = derive_patch_contracts_v02(&project);
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
fn reports_public_v02_project_and_patch_definition_errors() {
    let project: ProjectDocumentV02 = serde_json::from_value(serde_json::json!({
        "schema": "wrong.project",
        "schemaVersion": "9.9.9",
        "id": "",
        "revision": "",
        "graph": {
            "schema": "wrong.graph",
            "schemaVersion": "9.9.9",
            "id": "root",
            "revision": "1",
            "nodes": [
                {
                    "id": "source",
                    "kind": "core.value",
                    "kindVersion": "0.2.0",
                    "params": {},
                    "ports": [
                        { "id": "out", "direction": "output", "type": "value.number" }
                    ]
                },
                {
                    "id": "target",
                    "kind": "render.output",
                    "kindVersion": "0.2.0",
                    "params": {},
                    "ports": [
                        { "id": "in", "direction": "input", "type": "render.frame" }
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
                            "kind": "core.inlet",
                            "kindVersion": "0.2.0",
                            "params": { "portId": "same" },
                            "ports": [
                                { "id": "out", "direction": "output", "type": "value.number" }
                            ]
                        },
                        {
                            "id": "inlet_b",
                            "kind": "core.inlet",
                            "kindVersion": "0.2.0",
                            "params": { "portId": "same" },
                            "ports": [
                                { "id": "out", "direction": "output", "type": "value.number" }
                            ]
                        },
                        {
                            "id": "sink",
                            "kind": "render.output",
                            "kindVersion": "0.2.0",
                            "params": {},
                            "ports": [
                                { "id": "in", "direction": "input", "type": "render.frame" }
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
        validate_project_document_v02(&project).expect_err("project should fail validation");
    let text = report.to_string();

    for expected in [
        "expected schema skenion.project, found wrong.project",
        "expected schemaVersion 0.2.0, found 9.9.9",
        "project id must not be empty",
        "project revision must not be empty",
        "root graph expected schema skenion.graph, found wrong.graph",
        "root graph expected schemaVersion 0.2.0, found 9.9.9",
        "root graph incompatible-type",
        "viewState references missing graph node: missing_root_view",
        "patch id must not be empty",
        "patch revision must not be empty",
        "patch  graph expected schema skenion.graph, found wrong.patch.graph",
        "patch  graph expected schemaVersion 0.2.0, found 9.9.9",
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
