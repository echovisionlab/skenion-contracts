use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use thiserror::Error;

use super::{EdgeV01, GraphDocumentV01, GraphNodeV01, validate_graph_document_v01};

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct GraphPatchV01 {
    pub schema: String,
    pub schema_version: String,
    pub id: String,
    pub base_revision: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub client_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub created_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub ops: Vec<GraphPatchOperationV01>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum GraphPatchEventKindV01 {
    Apply,
    Undo,
    Redo,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct GraphPatchEventV01 {
    pub schema: String,
    pub schema_version: String,
    pub id: String,
    pub sequence: u64,
    pub kind: GraphPatchEventKindV01,
    pub patch: GraphPatchV01,
    pub inverse_patch: GraphPatchV01,
    pub revision_before: String,
    pub revision_after: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub client_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub subject_event_id: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct GraphPatchHistoryV01 {
    pub schema: String,
    pub schema_version: String,
    pub events: Vec<GraphPatchEventV01>,
    pub can_undo: bool,
    pub can_redo: bool,
    pub undo_depth: u64,
    pub redo_depth: u64,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(tag = "op")]
pub enum GraphPatchOperationV01 {
    #[serde(rename = "addNode")]
    AddNode { node: GraphNodeV01 },
    #[serde(rename = "removeNode")]
    RemoveNode {
        #[serde(rename = "nodeId")]
        node_id: String,
    },
    #[serde(rename = "setNodeParams")]
    SetNodeParams {
        #[serde(rename = "nodeId")]
        node_id: String,
        params: Map<String, Value>,
    },
    #[serde(rename = "setNodeParam")]
    SetNodeParam {
        #[serde(rename = "nodeId")]
        node_id: String,
        key: String,
        value: Value,
    },
    #[serde(rename = "addEdge")]
    AddEdge { edge: EdgeV01 },
    #[serde(rename = "removeEdge")]
    RemoveEdge { edge: EdgeV01 },
}

#[derive(Debug, Clone, PartialEq, Eq, Error)]
pub enum ApplyPatchErrorV01 {
    #[error("expected schema skenion.graph.patch, found {0}")]
    SchemaMismatch(String),
    #[error("expected schemaVersion 0.1.0, found {0}")]
    SchemaVersionMismatch(String),
    #[error("patch baseRevision {base_revision} does not match graph revision {graph_revision}")]
    BaseRevisionMismatch {
        base_revision: String,
        graph_revision: String,
    },
    #[error("node {0} already exists")]
    NodeAlreadyExists(String),
    #[error("node {0} does not exist")]
    NodeMissing(String),
    #[error("edge {0} already exists")]
    EdgeAlreadyExists(String),
    #[error("edge {0} does not exist")]
    EdgeMissing(String),
    #[error("{0}")]
    InvalidGraph(String),
}

#[derive(Debug, Clone, PartialEq, Eq, Error)]
pub enum InvertPatchErrorV01 {
    #[error("expected schema skenion.graph.patch, found {0}")]
    SchemaMismatch(String),
    #[error("expected schemaVersion 0.1.0, found {0}")]
    SchemaVersionMismatch(String),
    #[error("patch baseRevision {base_revision} does not match graph revision {graph_revision}")]
    BaseRevisionMismatch {
        base_revision: String,
        graph_revision: String,
    },
    #[error("node {0} already exists")]
    NodeAlreadyExists(String),
    #[error("node {0} does not exist")]
    NodeMissing(String),
    #[error("edge {0} already exists")]
    EdgeAlreadyExists(String),
    #[error("edge {0} does not exist")]
    EdgeMissing(String),
    #[error("{0}")]
    InvalidGraph(String),
}

fn edge_key(edge: &EdgeV01) -> String {
    format!(
        "{}:{}->{}:{}",
        edge.from.node, edge.from.port, edge.to.node, edge.to.port
    )
}

fn next_revision(current: &str, explicit: Option<&str>) -> String {
    if let Some(explicit) = explicit {
        return explicit.to_owned();
    }

    if let Ok(value) = current.parse::<u64>() {
        return (value + 1).to_string();
    }

    format!("{current}+1")
}

fn find_node_mut<'a>(
    graph: &'a mut GraphDocumentV01,
    node_id: &str,
) -> Option<&'a mut GraphNodeV01> {
    graph.nodes.iter_mut().find(|node| node.id == node_id)
}

fn find_node<'a>(graph: &'a GraphDocumentV01, node_id: &str) -> Option<&'a GraphNodeV01> {
    graph.nodes.iter().find(|node| node.id == node_id)
}

pub fn apply_graph_patch_v01(
    graph: &GraphDocumentV01,
    patch: &GraphPatchV01,
    next_graph_revision: Option<&str>,
) -> Result<GraphDocumentV01, ApplyPatchErrorV01> {
    if patch.schema != "skenion.graph.patch" {
        return Err(ApplyPatchErrorV01::SchemaMismatch(patch.schema.clone()));
    }
    if patch.schema_version != "0.1.0" {
        return Err(ApplyPatchErrorV01::SchemaVersionMismatch(
            patch.schema_version.clone(),
        ));
    }
    if graph.revision != patch.base_revision {
        return Err(ApplyPatchErrorV01::BaseRevisionMismatch {
            base_revision: patch.base_revision.clone(),
            graph_revision: graph.revision.clone(),
        });
    }

    let mut next_graph = graph.clone();

    for operation in &patch.ops {
        match operation {
            GraphPatchOperationV01::AddNode { node } => {
                if next_graph
                    .nodes
                    .iter()
                    .any(|existing| existing.id == node.id)
                {
                    return Err(ApplyPatchErrorV01::NodeAlreadyExists(node.id.clone()));
                }
                next_graph.nodes.push(node.clone());
            }
            GraphPatchOperationV01::RemoveNode { node_id } => {
                let before = next_graph.nodes.len();
                next_graph.nodes.retain(|node| node.id != *node_id);
                if next_graph.nodes.len() == before {
                    return Err(ApplyPatchErrorV01::NodeMissing(node_id.clone()));
                }
                next_graph
                    .edges
                    .retain(|edge| edge.from.node != *node_id && edge.to.node != *node_id);
            }
            GraphPatchOperationV01::SetNodeParams { node_id, params } => {
                let Some(node) = find_node_mut(&mut next_graph, node_id) else {
                    return Err(ApplyPatchErrorV01::NodeMissing(node_id.clone()));
                };
                node.params = params.clone();
            }
            GraphPatchOperationV01::SetNodeParam {
                node_id,
                key,
                value,
            } => {
                let Some(node) = find_node_mut(&mut next_graph, node_id) else {
                    return Err(ApplyPatchErrorV01::NodeMissing(node_id.clone()));
                };
                node.params.insert(key.clone(), value.clone());
            }
            GraphPatchOperationV01::AddEdge { edge } => {
                let key = edge_key(edge);
                if next_graph
                    .edges
                    .iter()
                    .any(|existing| edge_key(existing) == key)
                {
                    return Err(ApplyPatchErrorV01::EdgeAlreadyExists(key));
                }
                next_graph.edges.push(edge.clone());
            }
            GraphPatchOperationV01::RemoveEdge { edge } => {
                let key = edge_key(edge);
                let before = next_graph.edges.len();
                next_graph
                    .edges
                    .retain(|existing| edge_key(existing) != key);
                if next_graph.edges.len() == before {
                    return Err(ApplyPatchErrorV01::EdgeMissing(key));
                }
            }
        }
    }

    next_graph.revision = next_revision(&graph.revision, next_graph_revision);

    validate_graph_document_v01(&next_graph)
        .map_err(|report| ApplyPatchErrorV01::InvalidGraph(report.to_string()))?;

    Ok(next_graph)
}

pub fn invert_graph_patch_v01(
    graph_before: &GraphDocumentV01,
    patch: &GraphPatchV01,
) -> Result<GraphPatchV01, InvertPatchErrorV01> {
    if patch.schema != "skenion.graph.patch" {
        return Err(InvertPatchErrorV01::SchemaMismatch(patch.schema.clone()));
    }
    if patch.schema_version != "0.1.0" {
        return Err(InvertPatchErrorV01::SchemaVersionMismatch(
            patch.schema_version.clone(),
        ));
    }
    if graph_before.revision != patch.base_revision {
        return Err(InvertPatchErrorV01::BaseRevisionMismatch {
            base_revision: patch.base_revision.clone(),
            graph_revision: graph_before.revision.clone(),
        });
    }

    let mut working_graph = graph_before.clone();
    let mut inverse_groups: Vec<Vec<GraphPatchOperationV01>> = Vec::new();

    for operation in &patch.ops {
        match operation {
            GraphPatchOperationV01::AddNode { node } => {
                if working_graph
                    .nodes
                    .iter()
                    .any(|existing| existing.id == node.id)
                {
                    return Err(InvertPatchErrorV01::NodeAlreadyExists(node.id.clone()));
                }
                inverse_groups.insert(
                    0,
                    vec![GraphPatchOperationV01::RemoveNode {
                        node_id: node.id.clone(),
                    }],
                );
                working_graph.nodes.push(node.clone());
            }
            GraphPatchOperationV01::RemoveNode { node_id } => {
                let Some(node) = find_node(&working_graph, node_id) else {
                    return Err(InvertPatchErrorV01::NodeMissing(node_id.clone()));
                };
                let incident_edges = working_graph
                    .edges
                    .iter()
                    .filter(|edge| edge.from.node == *node_id || edge.to.node == *node_id)
                    .cloned()
                    .collect::<Vec<_>>();
                let mut group = vec![GraphPatchOperationV01::AddNode { node: node.clone() }];
                group.extend(
                    incident_edges
                        .iter()
                        .cloned()
                        .map(|edge| GraphPatchOperationV01::AddEdge { edge }),
                );
                inverse_groups.insert(0, group);
                working_graph.nodes.retain(|node| node.id != *node_id);
                working_graph
                    .edges
                    .retain(|edge| edge.from.node != *node_id && edge.to.node != *node_id);
            }
            GraphPatchOperationV01::SetNodeParams { node_id, params } => {
                let Some(node) = find_node_mut(&mut working_graph, node_id) else {
                    return Err(InvertPatchErrorV01::NodeMissing(node_id.clone()));
                };
                inverse_groups.insert(
                    0,
                    vec![GraphPatchOperationV01::SetNodeParams {
                        node_id: node_id.clone(),
                        params: node.params.clone(),
                    }],
                );
                node.params = params.clone();
            }
            GraphPatchOperationV01::SetNodeParam {
                node_id,
                key,
                value,
            } => {
                let Some(node) = find_node_mut(&mut working_graph, node_id) else {
                    return Err(InvertPatchErrorV01::NodeMissing(node_id.clone()));
                };
                inverse_groups.insert(
                    0,
                    vec![GraphPatchOperationV01::SetNodeParams {
                        node_id: node_id.clone(),
                        params: node.params.clone(),
                    }],
                );
                node.params.insert(key.clone(), value.clone());
            }
            GraphPatchOperationV01::AddEdge { edge } => {
                let key = edge_key(edge);
                if working_graph
                    .edges
                    .iter()
                    .any(|existing| edge_key(existing) == key)
                {
                    return Err(InvertPatchErrorV01::EdgeAlreadyExists(key));
                }
                inverse_groups.insert(
                    0,
                    vec![GraphPatchOperationV01::RemoveEdge { edge: edge.clone() }],
                );
                working_graph.edges.push(edge.clone());
            }
            GraphPatchOperationV01::RemoveEdge { edge } => {
                let key = edge_key(edge);
                let before = working_graph.edges.len();
                working_graph
                    .edges
                    .retain(|existing| edge_key(existing) != key);
                if working_graph.edges.len() == before {
                    return Err(InvertPatchErrorV01::EdgeMissing(key));
                }
                inverse_groups.insert(
                    0,
                    vec![GraphPatchOperationV01::AddEdge { edge: edge.clone() }],
                );
            }
        }
    }

    working_graph.revision = next_revision(&graph_before.revision, None);
    validate_graph_document_v01(&working_graph)
        .map_err(|report| InvertPatchErrorV01::InvalidGraph(report.to_string()))?;

    Ok(GraphPatchV01 {
        schema: "skenion.graph.patch".to_owned(),
        schema_version: "0.1.0".to_owned(),
        id: format!("{}_inverse", patch.id),
        base_revision: working_graph.revision,
        client_id: patch.client_id.clone(),
        created_at: None,
        description: patch
            .description
            .as_ref()
            .map(|description| format!("Inverse of {}: {description}", patch.id)),
        ops: inverse_groups.into_iter().flatten().collect(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn graph() -> GraphDocumentV01 {
        serde_json::from_str(
            r#"{
              "schema": "skenion.graph",
              "schemaVersion": "0.1.0",
              "id": "patch-test",
              "revision": "1",
              "nodes": [
                {
                  "id": "source",
                  "kind": "core.slider",
                  "kindVersion": "0.1.0",
                  "params": { "value": 0.5 },
                  "ports": [
                    { "id": "out", "direction": "output", "type": { "flow": "value", "dataKind": "number.f32" } }
                  ]
                },
                {
                  "id": "target",
                  "kind": "core.target",
                  "kindVersion": "0.1.0",
                  "params": {},
                  "ports": [
                    { "id": "value", "direction": "input", "type": { "flow": "value", "dataKind": "number.f32" }, "activation": "latched" }
                  ]
                }
              ],
              "edges": [
                { "from": { "node": "source", "port": "out" }, "to": { "node": "target", "port": "value" } }
              ]
            }"#,
        )
        .expect("graph should parse")
    }

    fn patch(ops: Vec<GraphPatchOperationV01>) -> GraphPatchV01 {
        GraphPatchV01 {
            schema: "skenion.graph.patch".to_owned(),
            schema_version: "0.1.0".to_owned(),
            id: "patch".to_owned(),
            base_revision: "1".to_owned(),
            client_id: None,
            created_at: None,
            description: None,
            ops,
        }
    }

    fn edge() -> EdgeV01 {
        serde_json::from_str(
            r#"{
              "from": { "node": "source", "port": "out" },
              "to": { "node": "target", "port": "value" }
            }"#,
        )
        .expect("edge should parse")
    }

    fn added_node(id: &str) -> GraphNodeV01 {
        serde_json::from_str(&format!(
            r#"{{
              "id": "{id}",
              "kind": "core.value",
              "kindVersion": "0.1.0",
              "params": {{}},
              "ports": []
            }}"#
        ))
        .expect("node should parse")
    }

    #[test]
    fn applies_set_param_and_explicit_revision_without_mutating_input() {
        let original = graph();
        let result = apply_graph_patch_v01(
            &original,
            &patch(vec![GraphPatchOperationV01::SetNodeParam {
                node_id: "source".to_owned(),
                key: "value".to_owned(),
                value: Value::from(0.75),
            }]),
            Some("2"),
        )
        .expect("patch should apply");

        assert_eq!(original.revision, "1");
        assert_eq!(original.nodes[0].params["value"], Value::from(0.5));
        assert_eq!(result.revision, "2");
        assert_eq!(result.nodes[0].params["value"], Value::from(0.75));
    }

    #[test]
    fn removes_node_and_incident_edges() {
        let result = apply_graph_patch_v01(
            &graph(),
            &patch(vec![GraphPatchOperationV01::RemoveNode {
                node_id: "source".to_owned(),
            }]),
            None,
        )
        .expect("patch should apply");

        assert_eq!(result.revision, "2");
        assert!(result.nodes.iter().all(|node| node.id != "source"));
        assert!(result.edges.is_empty());
    }

    #[test]
    fn removes_existing_edges() {
        let result = apply_graph_patch_v01(
            &graph(),
            &patch(vec![GraphPatchOperationV01::RemoveEdge { edge: edge() }]),
            Some("2"),
        )
        .expect("patch should apply");

        assert_eq!(result.revision, "2");
        assert!(result.edges.is_empty());
    }

    #[test]
    fn applies_whole_params_and_adds_and_removes_nodes() {
        let result = apply_graph_patch_v01(
            &graph(),
            &patch(vec![
                GraphPatchOperationV01::AddNode {
                    node: added_node("extra"),
                },
                GraphPatchOperationV01::SetNodeParams {
                    node_id: "extra".to_owned(),
                    params: Map::from_iter([("value".to_owned(), Value::from(1))]),
                },
                GraphPatchOperationV01::RemoveNode {
                    node_id: "extra".to_owned(),
                },
            ]),
            Some("next"),
        )
        .expect("patch should apply");

        assert_eq!(result.revision, "next");
        assert!(result.nodes.iter().all(|node| node.id != "extra"));
    }

    #[test]
    fn rejects_conflict_and_duplicate_operations_atomically() {
        let mut wrong_base = patch(vec![]);
        wrong_base.base_revision = "0".to_owned();
        assert!(matches!(
            apply_graph_patch_v01(&graph(), &wrong_base, None),
            Err(ApplyPatchErrorV01::BaseRevisionMismatch { .. })
        ));

        let duplicate_node = patch(vec![GraphPatchOperationV01::AddNode {
            node: added_node("source"),
        }]);
        assert!(matches!(
            apply_graph_patch_v01(&graph(), &duplicate_node, None),
            Err(ApplyPatchErrorV01::NodeAlreadyExists(id)) if id == "source"
        ));

        let duplicate_edge = patch(vec![GraphPatchOperationV01::AddEdge { edge: edge() }]);
        assert!(matches!(
            apply_graph_patch_v01(&graph(), &duplicate_edge, None),
            Err(ApplyPatchErrorV01::EdgeAlreadyExists(key)) if key == "source:out->target:value"
        ));
    }

    #[test]
    fn rejects_missing_nodes_edges_schema_and_invalid_result_graphs() {
        let missing_remove_node = patch(vec![GraphPatchOperationV01::RemoveNode {
            node_id: "missing".to_owned(),
        }]);
        let remove_node_error = apply_graph_patch_v01(&graph(), &missing_remove_node, None)
            .expect_err("missing remove node should fail");
        assert_eq!(
            remove_node_error,
            ApplyPatchErrorV01::NodeMissing("missing".to_owned())
        );

        let missing_set_params_node = patch(vec![GraphPatchOperationV01::SetNodeParams {
            node_id: "missing".to_owned(),
            params: Map::new(),
        }]);
        let set_params_error = apply_graph_patch_v01(&graph(), &missing_set_params_node, None)
            .expect_err("missing set params node should fail");
        assert_eq!(
            set_params_error,
            ApplyPatchErrorV01::NodeMissing("missing".to_owned())
        );

        let missing_node = patch(vec![GraphPatchOperationV01::SetNodeParam {
            node_id: "missing".to_owned(),
            key: "value".to_owned(),
            value: Value::from(1),
        }]);
        assert!(matches!(
            apply_graph_patch_v01(&graph(), &missing_node, None),
            Err(ApplyPatchErrorV01::NodeMissing(id)) if id == "missing"
        ));

        let missing_edge = patch(vec![GraphPatchOperationV01::RemoveEdge { edge: edge() }]);
        let mut graph_without_edge = graph();
        graph_without_edge.edges.clear();
        let edge_error = apply_graph_patch_v01(&graph_without_edge, &missing_edge, None)
            .expect_err("missing edge should fail");
        assert_eq!(
            edge_error,
            ApplyPatchErrorV01::EdgeMissing("source:out->target:value".to_owned())
        );

        let mut bad_schema = patch(vec![]);
        bad_schema.schema = "wrong".to_owned();
        assert!(matches!(
            apply_graph_patch_v01(&graph(), &bad_schema, None),
            Err(ApplyPatchErrorV01::SchemaMismatch(schema)) if schema == "wrong"
        ));

        let mut bad_version = patch(vec![]);
        bad_version.schema_version = "9.9.9".to_owned();
        assert!(matches!(
            apply_graph_patch_v01(&graph(), &bad_version, None),
            Err(ApplyPatchErrorV01::SchemaVersionMismatch(version)) if version == "9.9.9"
        ));

        let invalid_edge = patch(vec![GraphPatchOperationV01::AddEdge {
            edge: serde_json::from_str(
                r#"{
                  "from": { "node": "source", "port": "out" },
                  "to": { "node": "missing", "port": "value" }
                }"#,
            )
            .expect("edge should parse"),
        }]);
        assert!(matches!(
            apply_graph_patch_v01(&graph(), &invalid_edge, None),
            Err(ApplyPatchErrorV01::InvalidGraph(message)) if message.contains("missing target port")
        ));
    }

    #[test]
    fn appends_suffix_for_non_numeric_revision() {
        let mut non_numeric = graph();
        non_numeric.revision = "rev_0001".to_owned();
        let mut non_numeric_patch = patch(vec![]);
        non_numeric_patch.base_revision = "rev_0001".to_owned();

        let result = apply_graph_patch_v01(&non_numeric, &non_numeric_patch, None)
            .expect("patch should apply");

        assert_eq!(result.revision, "rev_0001+1");
    }

    #[test]
    fn inverts_add_node_and_edge_in_reverse_order() {
        let mut source = graph();
        source.revision = "1".to_owned();
        let input_node: GraphNodeV01 = serde_json::from_str(
            r#"{
              "id": "meter",
              "kind": "core.meter",
              "kindVersion": "0.1.0",
              "params": {},
              "ports": [
                { "id": "value", "direction": "input", "type": { "flow": "value", "dataKind": "number.f32" }, "activation": "latched" }
              ]
            }"#,
        )
        .expect("node should parse");
        let new_edge: EdgeV01 = serde_json::from_str(
            r#"{
              "from": { "node": "source", "port": "out" },
              "to": { "node": "meter", "port": "value" }
            }"#,
        )
        .expect("edge should parse");
        let mut forward = patch(vec![
            GraphPatchOperationV01::AddNode {
                node: input_node.clone(),
            },
            GraphPatchOperationV01::AddEdge {
                edge: new_edge.clone(),
            },
        ]);
        forward.client_id = Some("studio-local".to_owned());
        forward.description = Some("Add meter.".to_owned());

        let inverse = invert_graph_patch_v01(&source, &forward).expect("patch should invert");

        assert_eq!(inverse.base_revision, "2");
        assert_eq!(inverse.client_id.as_deref(), Some("studio-local"));
        assert_eq!(
            inverse.description.as_deref(),
            Some("Inverse of patch: Add meter.")
        );
        assert_eq!(
            inverse.ops,
            vec![
                GraphPatchOperationV01::RemoveEdge { edge: new_edge },
                GraphPatchOperationV01::RemoveNode {
                    node_id: "meter".to_owned()
                }
            ]
        );
    }

    #[test]
    fn inverts_remove_node_with_incident_edges() {
        let mut source = graph();
        source.revision = "1".to_owned();
        let inverse = invert_graph_patch_v01(
            &source,
            &patch(vec![GraphPatchOperationV01::RemoveNode {
                node_id: "source".to_owned(),
            }]),
        )
        .expect("patch should invert");

        assert_eq!(inverse.base_revision, "2");
        assert!(matches!(
            &inverse.ops[0],
            GraphPatchOperationV01::AddNode { node } if node.id == "source"
        ));
        assert_eq!(
            inverse.ops[1],
            GraphPatchOperationV01::AddEdge { edge: edge() }
        );

        let removed = apply_graph_patch_v01(
            &source,
            &patch(vec![GraphPatchOperationV01::RemoveNode {
                node_id: "source".to_owned(),
            }]),
            Some("2"),
        )
        .expect("remove should apply");
        let restored =
            apply_graph_patch_v01(&removed, &inverse, Some("3")).expect("inverse should apply");
        assert_eq!(restored.nodes.len(), source.nodes.len());
        assert_eq!(restored.edges.len(), source.edges.len());
    }

    #[test]
    fn inverts_param_and_remove_edge_operations() {
        let mut source = graph();
        source.revision = "1".to_owned();
        let inverse = invert_graph_patch_v01(
            &source,
            &patch(vec![
                GraphPatchOperationV01::SetNodeParam {
                    node_id: "source".to_owned(),
                    key: "value".to_owned(),
                    value: Value::from(0.75),
                },
                GraphPatchOperationV01::SetNodeParams {
                    node_id: "source".to_owned(),
                    params: Map::from_iter([
                        ("value".to_owned(), Value::from(0.25)),
                        ("mode".to_owned(), Value::from("fine")),
                    ]),
                },
                GraphPatchOperationV01::RemoveEdge { edge: edge() },
            ]),
        )
        .expect("patch should invert");

        assert_eq!(
            inverse.ops,
            vec![
                GraphPatchOperationV01::AddEdge { edge: edge() },
                GraphPatchOperationV01::SetNodeParams {
                    node_id: "source".to_owned(),
                    params: Map::from_iter([("value".to_owned(), Value::from(0.75))]),
                },
                GraphPatchOperationV01::SetNodeParams {
                    node_id: "source".to_owned(),
                    params: Map::from_iter([("value".to_owned(), Value::from(0.5))]),
                },
            ]
        );
    }

    #[test]
    fn rejects_invert_failures_without_mutating_input() {
        let mut source = graph();
        source.revision = "1".to_owned();

        let mut bad_schema = patch(vec![]);
        bad_schema.schema = "wrong".to_owned();
        assert!(matches!(
            invert_graph_patch_v01(&source, &bad_schema),
            Err(InvertPatchErrorV01::SchemaMismatch(schema)) if schema == "wrong"
        ));

        let mut bad_version = patch(vec![]);
        bad_version.schema_version = "9.9.9".to_owned();
        assert!(matches!(
            invert_graph_patch_v01(&source, &bad_version),
            Err(InvertPatchErrorV01::SchemaVersionMismatch(version)) if version == "9.9.9"
        ));

        let mut wrong_base = patch(vec![]);
        wrong_base.base_revision = "0".to_owned();
        assert!(matches!(
            invert_graph_patch_v01(&source, &wrong_base),
            Err(InvertPatchErrorV01::BaseRevisionMismatch { .. })
        ));

        let duplicate_node = patch(vec![GraphPatchOperationV01::AddNode {
            node: added_node("source"),
        }]);
        assert!(matches!(
            invert_graph_patch_v01(&source, &duplicate_node),
            Err(InvertPatchErrorV01::NodeAlreadyExists(id)) if id == "source"
        ));

        let missing_remove_node = patch(vec![GraphPatchOperationV01::RemoveNode {
            node_id: "missing".to_owned(),
        }]);
        assert!(matches!(
            invert_graph_patch_v01(&source, &missing_remove_node),
            Err(InvertPatchErrorV01::NodeMissing(id)) if id == "missing"
        ));

        let missing_set_params_node = patch(vec![GraphPatchOperationV01::SetNodeParams {
            node_id: "missing".to_owned(),
            params: Map::new(),
        }]);
        assert!(matches!(
            invert_graph_patch_v01(&source, &missing_set_params_node),
            Err(InvertPatchErrorV01::NodeMissing(id)) if id == "missing"
        ));

        let missing_set_param_node = patch(vec![GraphPatchOperationV01::SetNodeParam {
            node_id: "missing".to_owned(),
            key: "value".to_owned(),
            value: Value::from(1),
        }]);
        assert!(matches!(
            invert_graph_patch_v01(&source, &missing_set_param_node),
            Err(InvertPatchErrorV01::NodeMissing(id)) if id == "missing"
        ));

        let duplicate_edge = patch(vec![GraphPatchOperationV01::AddEdge { edge: edge() }]);
        assert!(matches!(
            invert_graph_patch_v01(&source, &duplicate_edge),
            Err(InvertPatchErrorV01::EdgeAlreadyExists(key)) if key == "source:out->target:value"
        ));

        let missing_edge = patch(vec![GraphPatchOperationV01::RemoveEdge { edge: edge() }]);
        let mut graph_without_edge = source.clone();
        graph_without_edge.edges.clear();
        assert!(matches!(
            invert_graph_patch_v01(&graph_without_edge, &missing_edge),
            Err(InvertPatchErrorV01::EdgeMissing(key)) if key == "source:out->target:value"
        ));

        let invalid_edge = patch(vec![GraphPatchOperationV01::AddEdge {
            edge: serde_json::from_str(
                r#"{
                  "from": { "node": "source", "port": "out" },
                  "to": { "node": "missing", "port": "value" }
                }"#,
            )
            .expect("edge should parse"),
        }]);
        assert!(matches!(
            invert_graph_patch_v01(&source, &invalid_edge),
            Err(InvertPatchErrorV01::InvalidGraph(message)) if message.contains("missing target port")
        ));

        assert_eq!(source.nodes.len(), 2);
        assert_eq!(source.edges.len(), 1);
    }
}
