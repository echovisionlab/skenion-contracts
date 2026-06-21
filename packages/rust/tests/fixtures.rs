use std::{fs, path::Path};

use skenion_contracts::{
    GraphDocumentV01, GraphDocumentV02, GraphPatchEventV01, GraphPatchHistoryV01, GraphPatchV01,
    NodeDefinitionManifestV01, NodeDefinitionManifestV02, ObjectTextParseResultV01,
    ProjectDocumentV02, parse_object_text_v01, validate_graph_document_v01,
    validate_graph_document_v02, validate_node_definition_v01, validate_node_definition_v02,
    validate_object_text_parse_result_v01, validate_project_document_v02,
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
