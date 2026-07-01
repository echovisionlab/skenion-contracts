#![recursion_limit = "256"]

use std::{fs, path::Path};

use skenion_contracts::{
    GraphDocumentV01, GraphFragmentOutsideEndpointPolicyV01, GraphFragmentV01,
    NodeDefinitionManifestV01, ObjectProviderRefV01, ObjectSpecParseResultV01,
    PackageDiscoveryResponseV01, PackageInstallPlanRequestV01, PackageInstallPlanResponseV01,
    PackageIssueSeverityV01, PackageListingV01, PackageManifestV01, PackageRootDocumentV01,
    ProjectDocumentV01, ProjectObjectBindingIssueCodeV01, ProjectObjectBindingIssueV01,
    ProjectObjectBindingStatusV01, analyze_graph_fragment_v01, parse_object_spec_v01,
    validate_graph_document_v01, validate_graph_fragment_v01, validate_node_definition_v01,
    validate_object_spec_parse_result_v01, validate_package_discovery_response_v01,
    validate_package_install_plan_request_v01, validate_package_install_plan_response_v01,
    validate_package_listing_v01, validate_package_manifest_v01, validate_package_root_v01,
    validate_patch_definition_v01, validate_project_document_v01,
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

fn package_listing_fixture(relative: &str) -> PackageListingV01 {
    let file = Path::new(env!("CARGO_MANIFEST_DIR")).join(relative);
    serde_json::from_slice(&fs::read(&file).expect("package listing fixture should be readable"))
        .expect("package listing fixture should parse")
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

fn assert_package_listing_fixture_error(relative: &str, expected_message: &str) {
    let listing = package_listing_fixture(relative);
    let report = validate_package_listing_v01(&listing)
        .expect_err("package listing fixture should fail validation");
    assert!(
        report.to_string().contains(expected_message),
        "expected error containing {expected_message:?}, got {report}"
    );
}

fn assert_package_listing_error(
    mutate: impl FnOnce(&mut PackageListingV01),
    expected_message: &str,
) {
    let mut listing = package_listing_fixture(
        "../../fixtures/package/v0.1/valid/patch-listing.skenion.package-listing.json",
    );
    mutate(&mut listing);
    let report = validate_package_listing_v01(&listing)
        .expect_err("mutated package listing should fail validation");
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
            manifest.provides.objects[0].primary_object_spec = "   ".to_owned();
        },
        "primaryObjectSpec must not be blank",
    );
    assert_package_manifest_error(
        |manifest| {
            manifest.provides.objects[0].aliases.push("\t".to_owned());
        },
        "alias/spec must not be blank",
    );
    assert_package_manifest_error(
        |manifest| {
            let mut object = manifest.provides.objects[0].clone();
            object.primary_object_spec = "phasor~ 440".to_owned();
            manifest.provides.objects.push(object);
        },
        "duplicate provided object provider/objectId",
    );
    assert_package_manifest_error(
        |manifest| {
            let mut object = manifest.provides.objects[0].clone();
            object.object_id = "example.sine".to_owned();
            object.primary_object_spec = "sine~ 440".to_owned();
            object.aliases.clear();
            manifest.provides.objects.push(object);
        },
        "duplicate object spec",
    );
    assert_package_manifest_error(
        |manifest| {
            manifest.provides.objects[0].object_id = "value.core.float32".to_owned();
        },
        "payload/value identity",
    );
    assert_package_manifest_error(
        |manifest| {
            manifest.provides.objects[0].object_id = "example.bad_id".to_owned();
        },
        "objectId must use lowercase dotted/hyphen grammar",
    );
    assert_package_manifest_error(
        |manifest| {
            manifest.provides.objects[0].definition_path = "../outside.node.json".to_owned();
        },
        "definitionPath must be relative and stay inside the package",
    );
    assert_package_manifest_error(
        |manifest| {
            manifest.provides.objects[0].help_id = Some("example.bad_help".to_owned());
        },
        "helpId must use lowercase dotted/hyphen grammar",
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
fn validates_package_listing_object_export_semantic_branches() {
    assert_package_listing_fixture_error(
        "../../fixtures/package/v0.1/invalid/listing-duplicate-object-id.skenion.package-listing.json",
        "duplicate provided object provider/objectId",
    );
    assert_package_listing_fixture_error(
        "../../fixtures/package/v0.1/invalid/listing-duplicate-object-spec.skenion.package-listing.json",
        "duplicate object spec",
    );
    assert_package_listing_fixture_error(
        "../../fixtures/package/v0.1/invalid/listing-payload-object-id.skenion.package-listing.json",
        "payload/value identity",
    );
    assert_package_listing_fixture_error(
        "../../fixtures/package/v0.1/invalid/listing-blank-object-primary-spec.skenion.package-listing.json",
        "primaryObjectSpec must not be blank",
    );
    assert_package_listing_fixture_error(
        "../../fixtures/package/v0.1/invalid/listing-blank-object-alias.skenion.package-listing.json",
        "alias/spec must not be blank",
    );
    assert_package_listing_error(
        |listing| {
            listing.provides.objects[0].object_id = "example.bad_id".to_owned();
        },
        "objectId must use lowercase dotted/hyphen grammar",
    );
    assert_package_listing_error(
        |listing| {
            listing.provides.objects[0].definition_path = "/absolute.node.json".to_owned();
        },
        "definitionPath must be relative and stay inside the package",
    );
    assert_package_listing_error(
        |listing| {
            listing.provides.objects[0].help_id = Some("example.bad_help".to_owned());
        },
        "helpId must use lowercase dotted/hyphen grammar",
    );
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

fn binding_issue(code: ProjectObjectBindingIssueCodeV01) -> ProjectObjectBindingIssueV01 {
    ProjectObjectBindingIssueV01 {
        severity: PackageIssueSeverityV01::Warning,
        code,
        message: "coverage issue".to_owned(),
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
            "requires implementation",
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
        .expect("missing package-provider binding with issues should remain valid");

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
            ProjectObjectBindingStatusV01::Error,
            "error object binding binding-example-oscillator requires implementation issue",
        ),
        (
            ProjectObjectBindingStatusV01::Unresolved,
            "unresolved object binding binding-example-oscillator must not include implementation",
        ),
    ] {
        let mut missing_issue = base_project.clone();
        missing_issue.object_bindings[0].status = status;
        missing_issue.object_bindings[0].issues.clear();
        assert_project_document_error(&missing_issue, expected);
    }

    let mut missing_patch_binding = base_project.clone();
    {
        let binding = &mut missing_patch_binding.object_bindings[1];
        binding.status = ProjectObjectBindingStatusV01::Unresolved;
        binding.issues = vec![binding_issue(
            ProjectObjectBindingIssueCodeV01::ResolutionUnresolved,
        )];
        match &mut binding
            .implementation
            .as_mut()
            .expect("project patch implementation")
            .provider
        {
            ObjectProviderRefV01::ProjectPatch { patch_id, .. } => {
                *patch_id = "missing-wrapper".to_owned();
            }
            ObjectProviderRefV01::Package { .. } | ObjectProviderRefV01::Core => {
                panic!("expected project patch binding")
            }
        }
    }
    assert_project_document_error(
        &missing_patch_binding,
        "unresolved object binding binding-local-wrapper must not include implementation",
    );

    let mut missing_patch_with_issue = base_project.clone();
    {
        let binding = &mut missing_patch_with_issue.object_bindings[1];
        binding.status = ProjectObjectBindingStatusV01::Error;
        binding.issues = vec![binding_issue(
            ProjectObjectBindingIssueCodeV01::ImplementationMissing,
        )];
        match &mut binding
            .implementation
            .as_mut()
            .expect("project patch implementation")
            .provider
        {
            ObjectProviderRefV01::ProjectPatch { patch_id, .. } => {
                *patch_id = "missing-wrapper".to_owned();
            }
            ObjectProviderRefV01::Package { .. } | ObjectProviderRefV01::Core => {
                panic!("expected project patch binding")
            }
        }
    }
    validate_project_document_v01(&missing_patch_with_issue)
        .expect("error project patch binding with issue should remain valid");

    let mut resolved_stale_revision = base_project.clone();
    match &mut resolved_stale_revision.object_bindings[1]
        .implementation
        .as_mut()
        .expect("project patch implementation")
        .provider
    {
        ObjectProviderRefV01::ProjectPatch { revision, .. } => {
            *revision = Some("2".to_owned());
        }
        ObjectProviderRefV01::Package { .. } | ObjectProviderRefV01::Core => {
            panic!("expected project patch binding")
        }
    }
    assert_project_document_error(
        &resolved_stale_revision,
        "resolved object binding binding-local-wrapper project patch local_wrapper revision is stale",
    );

    let mut stale_revision_without_issue = base_project.clone();
    {
        let binding = &mut stale_revision_without_issue.object_bindings[1];
        binding.status = ProjectObjectBindingStatusV01::Error;
        binding.issues.clear();
        match &mut binding
            .implementation
            .as_mut()
            .expect("project patch implementation")
            .provider
        {
            ObjectProviderRefV01::ProjectPatch { revision, .. } => {
                *revision = Some("2".to_owned());
            }
            ObjectProviderRefV01::Package { .. } | ObjectProviderRefV01::Core => {
                panic!("expected project patch binding")
            }
        }
    }
    assert_project_document_error(
        &stale_revision_without_issue,
        "object binding binding-local-wrapper project patch local_wrapper revision is stale without issues",
    );

    let mut stale_revision_with_issue = base_project.clone();
    {
        let binding = &mut stale_revision_with_issue.object_bindings[1];
        binding.status = ProjectObjectBindingStatusV01::Error;
        binding.issues = vec![binding_issue(
            ProjectObjectBindingIssueCodeV01::ImplementationStale,
        )];
        match &mut binding
            .implementation
            .as_mut()
            .expect("project patch implementation")
            .provider
        {
            ObjectProviderRefV01::ProjectPatch { revision, .. } => {
                *revision = Some("2".to_owned());
            }
            ObjectProviderRefV01::Package { .. } | ObjectProviderRefV01::Core => {
                panic!("expected project patch binding")
            }
        }
    }
    validate_project_document_v01(&stale_revision_with_issue)
        .expect("error project patch binding with issue should remain valid");

    let mut invalid_provider_ids = base_project.clone();
    match &mut invalid_provider_ids.object_bindings[0]
        .implementation
        .as_mut()
        .expect("package implementation")
        .provider
    {
        ObjectProviderRefV01::Package { package_id, .. } => {
            *package_id = "skenion.examples".to_owned();
        }
        ObjectProviderRefV01::ProjectPatch { .. } | ObjectProviderRefV01::Core => {
            panic!("expected package provider binding")
        }
    }
    let report = validate_project_document_v01(&invalid_provider_ids)
        .expect_err("invalid package provider ids should fail validation");
    let text = report.to_string();
    assert!(text.contains("object binding binding-example-oscillator packageId must match"));

    let mut unresolved_missing_lock = base_project;
    {
        let binding = &mut unresolved_missing_lock.object_bindings[0];
        binding.status = ProjectObjectBindingStatusV01::Unresolved;
        binding.issues = vec![binding_issue(
            ProjectObjectBindingIssueCodeV01::ResolutionUnresolved,
        )];
        match &mut binding
            .implementation
            .as_mut()
            .expect("package implementation")
            .provider
        {
            ObjectProviderRefV01::Package { lock_entry_id, .. } => {
                *lock_entry_id = Some("missing-package-lock".to_owned());
            }
            ObjectProviderRefV01::ProjectPatch { .. } | ObjectProviderRefV01::Core => {
                panic!("expected package provider binding")
            }
        }
    }
    assert_project_document_error(
        &unresolved_missing_lock,
        "unresolved object binding binding-example-oscillator must not include implementation",
    );
}

#[test]
fn parses_object_spec_parse_result_fixtures() {
    for file in fixture_files("../../fixtures/object-spec/v0.1/valid") {
        let result: ObjectSpecParseResultV01 =
            serde_json::from_slice(&fs::read(&file).expect("fixture should be readable"))
                .unwrap_or_else(|error| panic!("{} should parse: {error}", file.display()));
        validate_object_spec_parse_result_v01(&result)
            .unwrap_or_else(|error| panic!("{} should validate: {error}", file.display()));
        assert_eq!(
            parse_object_spec_v01(&result.input),
            result,
            "{} should match parser output",
            file.display()
        );
    }

    for file in fixture_files("../../fixtures/object-spec/v0.1/invalid") {
        let parsed = serde_json::from_slice::<ObjectSpecParseResultV01>(
            &fs::read(&file).expect("fixture should be readable"),
        );
        let Ok(result) = parsed else {
            continue;
        };
        validate_object_spec_parse_result_v01(&result)
            .expect_err("structurally valid invalid fixture should be semantically invalid");
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
        let result = parse_object_spec_v01(input);
        validate_object_spec_parse_result_v01(&result)
            .unwrap_or_else(|error| panic!("{input} success should validate: {error}"));
        assert!(result.ok, "{input} should parse");
        assert_eq!(result.implementation, None);
        assert!(result.params.is_empty());
        assert!(result.instance_ports.is_empty());
    }

    for input in ["[+ 1", "+ 1]", ""] {
        let result = parse_object_spec_v01(input);
        validate_object_spec_parse_result_v01(&result)
            .unwrap_or_else(|error| panic!("{input} failure should validate: {error}"));
        assert!(!result.ok, "{input} should fail without panicking");
    }
}
