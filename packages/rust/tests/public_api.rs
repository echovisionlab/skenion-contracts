use skenion_contracts::{
    AudioClockBridgeMethodV01, AudioClockDomainAuthorityV01, AudioClockDomainV01,
    CONTRACTS_COMPATIBILITY_LINE, CONTRACTS_COMPATIBILITY_RANGE, CONTRACTS_PACKAGE_VERSION,
    ClockAuthorityV01, ClockCapabilityV01, ClockTimeSignatureV01, CompatibilityMatrixV01,
    DataFlowV01, DataTypeV01, EndpointBindingValueFormatV01, ExtensionKindV01,
    ExtensionManifestV01, GraphDocumentV01, GraphFragmentOutsideEndpointPolicyV01,
    GraphFragmentV01, MidiClockMessageKindV01, MidiClockMessageV01, MidiClockSnapshotV01,
    NodeDefinitionManifestV01, NumberRangeV01, ObjectTextAtomV01, ObjectTextParseResultV01,
    PackageCategoryV01, PackageDiscoveryResponseV01, PackageInstallPlanActionKindV01,
    PackageInstallPlanCheckStatusV01, PackageInstallPlanDiagnosticCodeV01,
    PackageInstallPlanIntentV01, PackageInstallPlanRequestV01, PackageInstallPlanResponseV01,
    PackageInstallPlanTargetArchV01, PackageInstallPlanTargetOsV01, PackageListingArtifactKindV01,
    PackageListingDiagnosticCodeV01, PackageListingTargetSupportKindV01, PackageListingV01,
    PackageManifestV01, PackageRootDocumentV01, PackageTargetTripleV01, PasteGraphFragmentRequest,
    ProjectDocumentV01, ProjectObjectBindingTargetV01, SKENION_PACKAGE_MANIFEST_FILE_NAME,
    StringOrStringsV01, ValueFormatV01, ValueOccurrenceHeaderV01, ValuePayloadKindV01,
    analyze_graph_document_v01, analyze_graph_fragment_v01, apply_midi_clock_message_v01,
    compatible_data_types_v01, derive_patch_contract_v01, derive_patch_contracts_v01,
    derive_v0_compatibility_line, derive_v0_compatibility_range, is_same_v0_compatibility_line,
    midi_clock_snapshot_to_clock_state_v01, parse_midi_clock_message_v01, parse_object_text_v01,
    plan_audio_clock_bridge_v01, satisfies_v0_compatibility_range, type_label_v01,
    validate_compatibility_matrix_v01, validate_endpoint_binding_value_format_v01,
    validate_extension_manifest_v01, validate_graph_document_v01, validate_graph_fragment_v01,
    validate_node_definition_v01, validate_object_text_parse_result_v01,
    validate_package_discovery_response_v01, validate_package_install_plan_request_v01,
    validate_package_install_plan_response_v01, validate_package_listing_v01,
    validate_package_manifest_v01, validate_package_root_v01,
    validate_paste_graph_fragment_request, validate_project_document_v01,
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
              "kind": "core.slider",
              "kindVersion": "0.1.0",
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
                "kind": "object.core.float",
                "kindVersion": "0.1.0",
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
        patch_package.diagnostics[0]
            .details
            .as_ref()
            .expect("details")["fileName"],
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
            .target
            .as_ref()
            .and_then(|target| match target {
                skenion_contracts::ProjectObjectBindingTargetV01::PackageProvider {
                    lock_entry_id,
                    ..
                } => Some(lock_entry_id.as_str()),
                _ => None,
            }),
        Some("pkg-skenion-examples-0.45.0")
    );
    assert_eq!(
        project.object_bindings[1]
            .target
            .as_ref()
            .and_then(|target| match target {
                skenion_contracts::ProjectObjectBindingTargetV01::ProjectPatch {
                    patch_id, ..
                } => Some(patch_id.as_str()),
                _ => None,
            }),
        Some("local_wrapper")
    );
    assert_eq!(
        project.object_bindings[2].status,
        skenion_contracts::ProjectObjectBindingStatusV01::Missing
    );
    assert_eq!(
        project.graph.nodes[0].binding_ref.as_deref(),
        Some("binding-example-oscillator")
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
        discovery.listings[1].provides.native_objects[0].id,
        "example.sensor-native"
    );
    assert_eq!(
        discovery.listings[1].provides.codecs[0].id,
        "example.sensor-calibration-json"
    );
    assert_eq!(
        discovery.listings[1].diagnostics[0].code,
        PackageListingDiagnosticCodeV01::UnavailableTarget
    );
    assert_eq!(
        discovery.diagnostics[0].code,
        PackageListingDiagnosticCodeV01::HiddenPackage
    );
    assert_eq!(
        discovery.diagnostics[1].code,
        PackageListingDiagnosticCodeV01::QuarantinedPackage
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
        reject_response.diagnostics[0].code,
        PackageInstallPlanDiagnosticCodeV01::UnsupportedTarget
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
            .expect_err("failed plan without error diagnostic should fail");
    assert!(
        reject_without_error_report
            .to_string()
            .contains("requires an error diagnostic")
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
    if let Some(ProjectObjectBindingTargetV01::PackageProvider { lock_entry_id, .. }) =
        &mut missing_binding_lock.current.object_bindings[0].target
    {
        *lock_entry_id = "missing-lock".to_owned();
    }
    let missing_binding_lock_report =
        validate_package_install_plan_request_v01(&missing_binding_lock)
            .expect_err("binding with missing lock should fail");
    assert!(
        missing_binding_lock_report
            .to_string()
            .contains("object binding")
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
        .diagnostics
        .push(duplicate_response_ids.diagnostics[0].clone());
    let duplicate_response_ids_report =
        validate_package_install_plan_response_v01(&duplicate_response_ids)
            .expect_err("duplicate response ids should fail");
    let duplicate_response_ids_text = duplicate_response_ids_report.to_string();
    assert!(duplicate_response_ids_text.contains("duplicate package install plan action id"));
    assert!(duplicate_response_ids_text.contains("duplicate package install plan diagnostic id"));

    let mut malformed_diagnostic = reject_response.clone();
    malformed_diagnostic.diagnostics[0].id.clear();
    malformed_diagnostic.diagnostics[0].message.clear();
    let malformed_diagnostic_report =
        validate_package_install_plan_response_v01(&malformed_diagnostic)
            .expect_err("malformed diagnostic should fail");
    let malformed_diagnostic_text = malformed_diagnostic_report.to_string();
    assert!(malformed_diagnostic_text.contains("diagnostic id"));
    assert!(malformed_diagnostic_text.contains("message must not be empty"));

    let mut failing_check_without_ref = reject_response.clone();
    failing_check_without_ref.checks[0].diagnostic_refs.clear();
    let failing_check_without_ref_report =
        validate_package_install_plan_response_v01(&failing_check_without_ref)
            .expect_err("failing check without diagnostic ref should fail");
    assert!(
        failing_check_without_ref_report
            .to_string()
            .contains("failing check")
    );

    let mut missing_check_diagnostic = reject_response.clone();
    missing_check_diagnostic.checks[0].diagnostic_refs = vec!["missing-diagnostic".to_owned()];
    let missing_check_diagnostic_report =
        validate_package_install_plan_response_v01(&missing_check_diagnostic)
            .expect_err("missing check diagnostic ref should fail");
    assert!(
        missing_check_diagnostic_report
            .to_string()
            .contains("references missing diagnostic")
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

    let mut missing_reject_diagnostics = reject_response.clone();
    missing_reject_diagnostics.actions[0]
        .diagnostic_refs
        .clear();
    let missing_reject_diagnostics_report =
        validate_package_install_plan_response_v01(&missing_reject_diagnostics)
            .expect_err("reject action missing diagnostic refs should fail");
    assert!(
        missing_reject_diagnostics_report
            .to_string()
            .contains("reject action")
    );

    let mut missing_action_diagnostic = reject_response.clone();
    missing_action_diagnostic.actions[0].diagnostic_refs = vec!["missing-diagnostic".to_owned()];
    let missing_action_diagnostic_report =
        validate_package_install_plan_response_v01(&missing_action_diagnostic)
            .expect_err("action missing diagnostic ref should fail");
    assert!(
        missing_action_diagnostic_report
            .to_string()
            .contains("action reject-native-sensor-windows-arm64 references missing diagnostic")
    );

    let mut malformed_capability_change = update_response.clone();
    malformed_capability_change.actions[5].capability_changes[0]
        .id
        .clear();
    malformed_capability_change.actions[5].capability_changes[0].diagnostic_ref =
        Some("missing-diagnostic".to_owned());
    let malformed_capability_change_report =
        validate_package_install_plan_response_v01(&malformed_capability_change)
            .expect_err("malformed capability change should fail");
    let malformed_capability_change_text = malformed_capability_change_report.to_string();
    assert!(malformed_capability_change_text.contains("capability change id"));
    assert!(
        malformed_capability_change_text
            .contains("capability change references missing diagnostic")
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
fn validates_public_object_text_parse_results() {
    let result: ObjectTextParseResultV01 = serde_json::from_str(
        r#"{
          "schema": "skenion.object-text.parse-result",
          "schemaVersion": "0.1.0",
          "input": "example.gain 0.5",
          "ok": true,
          "className": "example.gain",
          "creationArgs": [{ "type": "float", "value": 0.5, "representation": "f32" }],
          "resolvedKind": "example.package.gain",
          "resolvedKindVersion": "0.1.0",
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
          "diagnostics": []
        }"#,
    )
    .expect("object text result should parse");

    validate_object_text_parse_result_v01(&result).expect("object text result should validate");
    assert_eq!(
        result.resolved_kind.as_deref(),
        Some("example.package.gain")
    );

    let mut wrong_schema = result.clone();
    wrong_schema.schema = "wrong.object-text".to_owned();
    let schema_error = validate_object_text_parse_result_v01(&wrong_schema)
        .expect_err("schema mismatch should fail");
    assert!(schema_error.to_string().contains("wrong.object-text"));

    let mut wrong_version = result.clone();
    wrong_version.schema_version = "9.9.9".to_owned();
    let version_error = validate_object_text_parse_result_v01(&wrong_version)
        .expect_err("schema version mismatch should fail");
    assert!(version_error.to_string().contains("9.9.9"));

    let parsed = parse_object_text_v01("[osc~ 440]");
    assert_eq!(parsed.class_name, "osc~");
    assert_eq!(parsed.resolved_kind, None);
    assert!(parsed.params.is_empty());
    assert!(parsed.instance_ports.is_empty());
    assert_eq!(
        parsed.creation_args,
        vec![ObjectTextAtomV01::Int {
            value: 440,
            representation: Some("i32".to_owned())
        }]
    );

    let mut missing_keys = result.clone();
    missing_keys.instance_ports[0].message_keys = None;
    let missing_keys_error = validate_object_text_parse_result_v01(&missing_keys)
        .expect_err("value.core.message object text port without keys should fail");
    assert!(
        missing_keys_error
            .to_string()
            .contains("requires messageKeys")
    );

    let mut accepting_message_any = result.clone();
    accepting_message_any.instance_ports[0].port_type = "value.core.float64".to_owned();
    accepting_message_any.instance_ports[0].accepts = Some(vec!["value.core.message".to_owned()]);
    accepting_message_any.instance_ports[0].message_keys = None;
    let accepting_message_any_error = validate_object_text_parse_result_v01(&accepting_message_any)
        .expect_err("object text port accepting value.core.message without keys should fail");
    assert!(
        accepting_message_any_error
            .to_string()
            .contains("requires messageKeys")
    );

    let mut empty_key_set = result.clone();
    let policy = empty_key_set.instance_ports[0]
        .message_keys
        .as_mut()
        .expect("resolved object text should declare key policy");
    policy.accepted.clear();
    let empty_key_error = validate_object_text_parse_result_v01(&empty_key_set)
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
        .expect("resolved object text should declare key policy");
    policy.accepted = vec!["float".to_owned()];
    policy.trigger = Some(vec!["int".to_owned()]);
    let unaccepted_trigger_error = validate_object_text_parse_result_v01(&unaccepted_trigger)
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
        .expect("resolved object text should declare key policy");
    policy.accepted = vec!["set".to_owned()];
    policy.silent = Some(vec!["set".to_owned()]);
    policy.trigger = None;
    policy.store = None;
    policy.emit = Some(vec!["set".to_owned()]);
    let set_emit_error = validate_object_text_parse_result_v01(&set_as_emit)
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
        .expect("resolved object text should declare key policy");
    policy.accepted = vec!["set".to_owned()];
    policy.silent = None;
    policy.trigger = Some(vec!["set".to_owned()]);
    policy.store = None;
    policy.emit = None;
    let set_trigger_error = validate_object_text_parse_result_v01(&set_as_trigger)
        .expect_err("set must not be trigger behavior");
    let set_trigger_text = set_trigger_error.to_string();
    assert!(set_trigger_text.contains("messageKeys.trigger must not include set"));
    assert!(set_trigger_text.contains("messageKeys.set must be silent or store behavior"));

    let mut set_as_silent = result.clone();
    let policy = set_as_silent.instance_ports[0]
        .message_keys
        .as_mut()
        .expect("resolved object text should declare key policy");
    policy.accepted = vec!["set".to_owned()];
    policy.silent = Some(vec!["set".to_owned()]);
    policy.trigger = None;
    policy.store = None;
    policy.emit = None;
    validate_object_text_parse_result_v01(&set_as_silent)
        .expect("set should be valid as silent key behavior");

    let mut set_as_store = result.clone();
    let policy = set_as_store.instance_ports[0]
        .message_keys
        .as_mut()
        .expect("resolved object text should declare key policy");
    policy.accepted = vec!["set".to_owned()];
    policy.silent = None;
    policy.trigger = None;
    policy.store = Some(vec!["set".to_owned()]);
    policy.emit = None;
    validate_object_text_parse_result_v01(&set_as_store)
        .expect("set should be valid as store key behavior");
}

#[test]
fn parses_public_object_text_lexical_matrix() {
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
        let result = parse_object_text_v01(input);
        validate_object_text_parse_result_v01(&result).expect("parse result should validate");
        assert!(result.ok, "{input} should parse");
        assert_eq!(result.resolved_kind, None);
        assert_eq!(result.resolved_kind_version, None);
        assert!(result.params.is_empty());
        assert!(result.instance_ports.is_empty());
    }

    for input in ["[+ 1", "+ 1]", ""] {
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
              "kind": "core.node",
              "kindVersion": "0.1.0",
              "params": {},
              "ports": [
                { "id": "out", "direction": "output", "type": "value.core.float64" }
              ]
            },
            {
              "id": "node",
              "kind": "core.node",
              "kindVersion": "0.1.0",
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
              "kind": "object.core.render.clear-color",
              "kindVersion": "0.1.0",
              "params": { "color": [0, 0, 0, 1] },
              "ports": [
                { "id": "out", "direction": "output", "type": "value.core.tensor", "rate": "render" }
              ]
            },
            {
              "id": "output",
              "kind": "object.core.render.output",
              "kindVersion": "0.1.0",
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
                    "kind": "object.core.inlet",
                    "kindVersion": "0.1.0",
                    "params": {},
                    "ports": [
                      { "id": "out", "direction": "output", "type": "value.core.float64" }
                    ]
                  },
                  {
                    "id": "multi_input",
                    "kind": "object.core.inlet",
                    "kindVersion": "0.1.0",
                    "params": {},
                    "ports": [
                      { "id": "first", "direction": "output", "type": "value.core.float64" },
                      { "id": "second", "direction": "output", "type": "value.core.float64" }
                    ]
                  },
                  {
                    "id": "fallback_output",
                    "kind": "object.core.outlet",
                    "kindVersion": "0.1.0",
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
fn reports_public_v01_project_and_patch_definition_errors() {
    let project: ProjectDocumentV01 = serde_json::from_value(serde_json::json!({
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
                    "kind": "object.core.float",
                    "kindVersion": "0.1.0",
                    "params": {},
                    "ports": [
                        { "id": "out", "direction": "output", "type": "value.core.float64" }
                    ]
                },
                {
                    "id": "target",
                    "kind": "object.core.render.output",
                    "kindVersion": "0.1.0",
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
                            "kind": "object.core.inlet",
                            "kindVersion": "0.1.0",
                            "params": { "portId": "same" },
                            "ports": [
                                { "id": "out", "direction": "output", "type": "value.core.float64" }
                            ]
                        },
                        {
                            "id": "inlet_b",
                            "kind": "object.core.inlet",
                            "kindVersion": "0.1.0",
                            "params": { "portId": "same" },
                            "ports": [
                                { "id": "out", "direction": "output", "type": "value.core.float64" }
                            ]
                        },
                        {
                            "id": "sink",
                            "kind": "object.core.render.output",
                            "kindVersion": "0.1.0",
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
