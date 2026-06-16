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
}
