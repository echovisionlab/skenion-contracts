use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};

use super::GraphDocumentV01;

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ProjectDocumentV01 {
    pub schema: String,
    pub schema_version: String,
    pub id: String,
    pub revision: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<ProjectMetadataV01>,
    pub graph: GraphDocumentV01,
    pub view_state: ViewStateV01,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tutorial: Option<Map<String, Value>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub help: Option<Map<String, Value>>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectMetadataV01 {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub created_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<String>,
    #[serde(flatten)]
    pub extra: Map<String, Value>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ViewStateV01 {
    pub schema: String,
    pub schema_version: String,
    pub canvas: CanvasViewStateV01,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct CanvasViewStateV01 {
    pub nodes: BTreeMap<String, CanvasNodeViewV01>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub viewport: Option<CanvasViewportV01>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct CanvasNodeViewV01 {
    pub x: f64,
    pub y: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub width: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub height: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub collapsed: Option<bool>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct CanvasViewportV01 {
    pub x: f64,
    pub y: f64,
    pub zoom: f64,
}

pub fn create_default_view_state_for_graph_v01(graph: &GraphDocumentV01) -> ViewStateV01 {
    let nodes = graph
        .nodes
        .iter()
        .enumerate()
        .map(|(index, node)| {
            (
                node.id.clone(),
                CanvasNodeViewV01 {
                    x: 96.0 + ((index % 4) as f64) * 280.0,
                    y: 96.0 + ((index / 4) as f64) * 180.0,
                    width: None,
                    height: None,
                    collapsed: None,
                },
            )
        })
        .collect();

    ViewStateV01 {
        schema: "skenion.view-state".to_owned(),
        schema_version: "0.1.0".to_owned(),
        canvas: CanvasViewStateV01 {
            nodes,
            viewport: Some(CanvasViewportV01 {
                x: 0.0,
                y: 0.0,
                zoom: 1.0,
            }),
        },
    }
}

#[cfg(test)]
mod tests {
    use serde_json::{Map, Value};

    use super::*;
    use crate::{EdgeV01, GraphNodeV01, PortRefV01};

    fn graph() -> GraphDocumentV01 {
        GraphDocumentV01 {
            schema: "skenion.graph".to_owned(),
            schema_version: "0.1.0".to_owned(),
            id: "graph".to_owned(),
            revision: "1".to_owned(),
            nodes: vec![
                GraphNodeV01 {
                    id: "a".to_owned(),
                    kind: "core.value-f32".to_owned(),
                    kind_version: "0.1.0".to_owned(),
                    params: Map::new(),
                    ports: vec![],
                },
                GraphNodeV01 {
                    id: "b".to_owned(),
                    kind: "core.value-f32".to_owned(),
                    kind_version: "0.1.0".to_owned(),
                    params: Map::new(),
                    ports: vec![],
                },
            ],
            edges: vec![EdgeV01 {
                from: PortRefV01 {
                    node: "a".to_owned(),
                    port: "value".to_owned(),
                },
                to: PortRefV01 {
                    node: "b".to_owned(),
                    port: "in".to_owned(),
                },
            }],
        }
    }

    #[test]
    fn project_document_round_trips_json() {
        let project = ProjectDocumentV01 {
            schema: "skenion.project".to_owned(),
            schema_version: "0.1.0".to_owned(),
            id: "project".to_owned(),
            revision: "1".to_owned(),
            metadata: Some(ProjectMetadataV01 {
                title: Some("Project".to_owned()),
                description: None,
                created_at: None,
                updated_at: None,
                extra: Map::from_iter([("owner".to_owned(), Value::String("studio".to_owned()))]),
            }),
            graph: graph(),
            view_state: create_default_view_state_for_graph_v01(&graph()),
            tutorial: None,
            help: None,
        };

        let serialized = serde_json::to_string(&project).expect("project serializes");
        let parsed: ProjectDocumentV01 =
            serde_json::from_str(&serialized).expect("project deserializes");

        assert_eq!(parsed.schema, "skenion.project");
        assert_eq!(parsed.view_state.canvas.nodes.len(), 2);
        assert_eq!(
            parsed
                .metadata
                .and_then(|metadata| metadata.extra.get("owner").cloned()),
            Some(Value::String("studio".to_owned()))
        );
    }

    #[test]
    fn default_view_state_positions_every_graph_node() {
        let view_state = create_default_view_state_for_graph_v01(&graph());

        assert_eq!(view_state.canvas.nodes["a"].x, 96.0);
        assert_eq!(view_state.canvas.nodes["b"].x, 376.0);
        assert_eq!(view_state.canvas.viewport.expect("viewport").zoom, 1.0);
    }
}
