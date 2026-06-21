use crate::v0_1::{
    DataFlowV01, EdgeV01, GraphDocumentV01, GraphNodeV01, PortActivationV01, PortDirectionV01,
    PortV01, ProjectDocumentV01, ProjectMetadataV01,
};

use super::{
    EdgeEndpointV02, EdgeSpecV02, GraphDocumentV02, GraphNodeV02, PortDirectionV02, PortRateV02,
    PortSpecV02, ProjectDocumentV02, ProjectMetadataV02, TriggerModeV02,
};

fn v02_rate_for_v01_flow(flow: &DataFlowV01, data_kind: &str) -> PortRateV02 {
    match flow {
        DataFlowV01::Event => PortRateV02::Event,
        DataFlowV01::Signal => PortRateV02::Audio,
        DataFlowV01::Stream => PortRateV02::Render,
        DataFlowV01::Resource if data_kind.starts_with("gpu.") => PortRateV02::Gpu,
        DataFlowV01::Resource => PortRateV02::Resource,
        DataFlowV01::Value => PortRateV02::Control,
    }
}

fn v02_direction_for_v01_direction(direction: &PortDirectionV01) -> PortDirectionV02 {
    match direction {
        PortDirectionV01::Input => PortDirectionV02::Input,
        PortDirectionV01::Output => PortDirectionV02::Output,
    }
}

fn v02_trigger_mode_for_v01_activation(
    activation: &Option<PortActivationV01>,
) -> Option<TriggerModeV02> {
    match activation {
        Some(PortActivationV01::Trigger) => Some(TriggerModeV02::Trigger),
        Some(PortActivationV01::Latched) => Some(TriggerModeV02::Latched),
        None => None,
    }
}

fn migrate_port_v01_to_v02(port: &PortV01) -> PortSpecV02 {
    PortSpecV02 {
        id: port.id.clone(),
        direction: v02_direction_for_v01_direction(&port.direction),
        port_type: port.data_type.data_kind.clone(),
        label: port.label.clone(),
        rate: Some(v02_rate_for_v01_flow(
            &port.data_type.flow,
            &port.data_type.data_kind,
        )),
        accepts: None,
        min_connections: None,
        max_connections: None,
        merge_policy: None,
        fan_out_policy: None,
        trigger_mode: v02_trigger_mode_for_v01_activation(&port.activation),
        default_value: port.default_value.clone(),
        latch: None,
        required: port.required,
        style_key: None,
        group: None,
        description: None,
    }
}

fn migrate_node_v01_to_v02(node: &GraphNodeV01) -> GraphNodeV02 {
    GraphNodeV02 {
        id: node.id.clone(),
        kind: node.kind.clone(),
        kind_version: node.kind_version.clone(),
        params: node.params.clone(),
        ports: node.ports.iter().map(migrate_port_v01_to_v02).collect(),
        port_groups: None,
    }
}

fn slug_id(value: &str) -> String {
    let slug = value
        .chars()
        .map(|character| {
            if character.is_ascii_alphanumeric() || character == '_' || character == '-' {
                character
            } else {
                '_'
            }
        })
        .collect::<String>()
        .trim_matches('_')
        .to_owned();

    if slug.is_empty() {
        "endpoint".to_owned()
    } else {
        slug
    }
}

fn edge_id_v02(edge: &EdgeV01, index: usize, used_ids: &mut Vec<String>) -> String {
    let base = format!(
        "edge_{}_{}_to_{}_{}",
        slug_id(&edge.from.node),
        slug_id(&edge.from.port),
        slug_id(&edge.to.node),
        slug_id(&edge.to.port)
    );
    let mut candidate = base.clone();
    let mut suffix = index + 1;
    while used_ids.contains(&candidate) {
        candidate = format!("{base}_{suffix}");
        suffix += 1;
    }
    used_ids.push(candidate.clone());
    candidate
}

fn migrate_edge_v01_to_v02(
    edge: &EdgeV01,
    index: usize,
    used_ids: &mut Vec<String>,
) -> EdgeSpecV02 {
    EdgeSpecV02 {
        id: edge_id_v02(edge, index, used_ids),
        source: EdgeEndpointV02 {
            node_id: edge.from.node.clone(),
            port_id: edge.from.port.clone(),
        },
        target: EdgeEndpointV02 {
            node_id: edge.to.node.clone(),
            port_id: edge.to.port.clone(),
        },
        resolved_type: None,
        order: None,
        enabled: None,
        adapter: None,
        feedback: None,
        style_override: None,
        label: None,
        description: None,
    }
}

fn migrate_project_metadata_v01_to_v02(metadata: &ProjectMetadataV01) -> ProjectMetadataV02 {
    ProjectMetadataV02 {
        title: metadata.title.clone(),
        description: metadata.description.clone(),
        created_at: metadata.created_at.clone(),
        updated_at: metadata.updated_at.clone(),
        extra: metadata.extra.clone(),
    }
}

pub fn migrate_graph_document_v01_to_v02(graph: &GraphDocumentV01) -> GraphDocumentV02 {
    let mut used_edge_ids = Vec::new();

    GraphDocumentV02 {
        schema: "skenion.graph".to_owned(),
        schema_version: "0.2.0".to_owned(),
        id: graph.id.clone(),
        revision: graph.revision.clone(),
        nodes: graph.nodes.iter().map(migrate_node_v01_to_v02).collect(),
        edges: graph
            .edges
            .iter()
            .enumerate()
            .map(|(index, edge)| migrate_edge_v01_to_v02(edge, index, &mut used_edge_ids))
            .collect(),
        cable_styles: None,
    }
}

pub fn migrate_project_document_v01_to_v02(project: &ProjectDocumentV01) -> ProjectDocumentV02 {
    ProjectDocumentV02 {
        schema: "skenion.project".to_owned(),
        schema_version: "0.2.0".to_owned(),
        id: project.id.clone(),
        revision: project.revision.clone(),
        metadata: project
            .metadata
            .as_ref()
            .map(migrate_project_metadata_v01_to_v02),
        graph: migrate_graph_document_v01_to_v02(&project.graph),
        view_state: project.view_state.clone(),
        patch_library: Vec::new(),
        tutorial: project.tutorial.clone(),
        help: project.help.clone(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn migrates_v01_flow_rates_and_stable_edge_ids() {
        let graph: GraphDocumentV01 = serde_json::from_value(json!({
            "schema": "skenion.graph",
            "schemaVersion": "0.1.0",
            "id": "legacy-flow-rates",
            "revision": "rev_0001",
            "nodes": [
                {
                    "id": "source",
                    "kind": "core.source",
                    "kindVersion": "0.1.0",
                    "params": {},
                    "ports": [
                        { "id": "event", "direction": "output", "type": { "flow": "event", "dataKind": "bang" } },
                        { "id": "signal", "direction": "output", "type": { "flow": "signal", "dataKind": "audio.f32" } },
                        { "id": "stream", "direction": "output", "type": { "flow": "stream", "dataKind": "video.frame" } },
                        { "id": "gpu", "direction": "output", "type": { "flow": "resource", "dataKind": "gpu.texture2d" } },
                        { "id": "resource", "direction": "output", "type": { "flow": "resource", "dataKind": "asset.video" } },
                        { "id": "value", "direction": "output", "type": { "flow": "value", "dataKind": "number.float" } }
                    ]
                }
            ],
            "edges": [
                {
                    "from": { "node": "$$$", "port": "$$$" },
                    "to": { "node": "$$$", "port": "$$$" }
                },
                {
                    "from": { "node": "$$$", "port": "$$$" },
                    "to": { "node": "$$$", "port": "$$$" }
                }
            ]
        }))
        .expect("legacy graph should parse");

        let migrated = migrate_graph_document_v01_to_v02(&graph);
        let ports = &migrated.nodes[0].ports;
        let rate_for = |port_id: &str| {
            ports
                .iter()
                .find(|port| port.id == port_id)
                .and_then(|port| port.rate.as_ref())
        };

        assert_eq!(rate_for("event"), Some(&PortRateV02::Event));
        assert_eq!(rate_for("signal"), Some(&PortRateV02::Audio));
        assert_eq!(rate_for("stream"), Some(&PortRateV02::Render));
        assert_eq!(rate_for("gpu"), Some(&PortRateV02::Gpu));
        assert_eq!(rate_for("resource"), Some(&PortRateV02::Resource));
        assert_eq!(rate_for("value"), Some(&PortRateV02::Control));
        assert_eq!(
            migrated.edges[0].id,
            "edge_endpoint_endpoint_to_endpoint_endpoint"
        );
        assert_eq!(
            migrated.edges[1].id,
            "edge_endpoint_endpoint_to_endpoint_endpoint_2"
        );
    }
}
