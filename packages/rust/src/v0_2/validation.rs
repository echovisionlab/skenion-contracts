use std::{
    collections::{HashMap, HashSet},
    error::Error,
    fmt,
};

use super::{
    CycleValidationV02, EdgeSpecV02, FeedbackBoundaryV02, GraphCycleValidationV02,
    GraphDocumentV02, GraphValidationDiagnosticV02, GraphValidationResultV02, MergePolicyV02,
    NodeDefinitionManifestV02, PatchDefinitionV02, PortDirectionV02, PortSpecV02,
    ProjectDocumentV02, derive_patch_contract_v02,
};
use crate::v0_1::ViewStateV01;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ValidationErrorV02 {
    pub message: String,
}

impl ValidationErrorV02 {
    fn new(message: impl Into<String>) -> Self {
        Self {
            message: message.into(),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ValidationReportV02 {
    errors: Vec<ValidationErrorV02>,
}

impl ValidationReportV02 {
    fn new(errors: Vec<ValidationErrorV02>) -> Self {
        Self { errors }
    }

    pub fn errors(&self) -> &[ValidationErrorV02] {
        &self.errors
    }
}

impl fmt::Display for ValidationReportV02 {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(
            f,
            "{}",
            self.errors
                .iter()
                .map(|error| error.message.as_str())
                .collect::<Vec<_>>()
                .join("; ")
        )
    }
}

impl Error for ValidationReportV02 {}

fn duplicate_errors<'a>(
    values: impl Iterator<Item = &'a str>,
    label: &str,
) -> Vec<ValidationErrorV02> {
    let mut seen = HashSet::new();
    let mut errors = Vec::new();

    for value in values {
        if !seen.insert(value) {
            errors.push(ValidationErrorV02::new(format!(
                "duplicate {label}: {value}"
            )));
        }
    }

    errors
}

fn diagnostic(
    diagnostics: &mut Vec<GraphValidationDiagnosticV02>,
    severity: &str,
    code: &str,
    message: impl Into<String>,
    nodes: Option<Vec<String>>,
    edges: Option<Vec<String>>,
) {
    diagnostics.push(GraphValidationDiagnosticV02 {
        severity: severity.to_owned(),
        code: code.to_owned(),
        message: message.into(),
        nodes,
        edges,
    });
}

fn port_key(node_id: &str, port_id: &str) -> String {
    format!("{node_id}:{port_id}")
}

fn edge_endpoint_key(edge: &EdgeSpecV02) -> String {
    format!(
        "{}:{}->{}:{}",
        edge.source.node_id, edge.source.port_id, edge.target.node_id, edge.target.port_id
    )
}

fn edge_enabled(edge: &EdgeSpecV02) -> bool {
    edge.enabled != Some(false)
}

fn input_max_connections(port: &PortSpecV02) -> u64 {
    match port.max_connections {
        Some(Some(max_connections)) => max_connections,
        Some(None) => u64::MAX,
        None => 1,
    }
}

fn input_max_connections_label(port: &PortSpecV02) -> String {
    match port.max_connections {
        Some(Some(max_connections)) => max_connections.to_string(),
        Some(None) => "unlimited".to_owned(),
        None => "1".to_owned(),
    }
}

fn merge_policy_for(port: &PortSpecV02) -> MergePolicyV02 {
    port.merge_policy.clone().unwrap_or(MergePolicyV02::Forbid)
}

fn accepts(source: &PortSpecV02, target: &PortSpecV02) -> bool {
    if target.port_type == "message.any" && is_control_message_port_type(&source.port_type) {
        return true;
    }
    source.port_type == target.port_type
        || target
            .accepts
            .as_ref()
            .is_some_and(|accepted| accepted.contains(&source.port_type))
}

fn is_control_message_port_type(port_type: &str) -> bool {
    matches!(
        port_type,
        "message.any"
            | "event.bang"
            | "number.float"
            | "number.int"
            | "number.uint"
            | "boolean"
            | "color"
            | "string"
    )
}

fn port_family(port_type: &str) -> &str {
    port_type
        .split_once('.')
        .map_or(port_type, |(family, _)| family)
}

fn control_cycle_types(edges: &[EdgeSpecV02], ports: &HashMap<String, PortSpecV02>) -> bool {
    edges.iter().all(|edge| {
        let source_key = port_key(&edge.source.node_id, &edge.source.port_id);
        let target_key = port_key(&edge.target.node_id, &edge.target.port_id);
        let source_family = ports
            .get(&source_key)
            .map(|port| port_family(&port.port_type))
            .unwrap_or_default();
        let target_family = ports
            .get(&target_key)
            .map(|port| port_family(&port.port_type))
            .unwrap_or_default();
        matches!(source_family, "value" | "control") && matches!(target_family, "value" | "control")
    })
}

fn classify_cycle(
    nodes: Vec<String>,
    edges: Vec<EdgeSpecV02>,
    ports: &HashMap<String, PortSpecV02>,
) -> GraphCycleValidationV02 {
    let feedback = edges
        .iter()
        .find(|edge| edge.feedback.as_ref().is_some_and(|policy| policy.enabled));

    if let Some(edge) = feedback {
        if edge
            .feedback
            .as_ref()
            .is_some_and(|policy| policy.boundary == FeedbackBoundaryV02::SameTurn)
        {
            return GraphCycleValidationV02 {
                classification: CycleValidationV02::RiskyFeedback,
                nodes,
                edges: edges.iter().map(|edge| edge.id.clone()).collect(),
                message: format!("feedback edge {} uses same-turn boundary", edge.id),
            };
        }

        return GraphCycleValidationV02 {
            classification: CycleValidationV02::ValidFeedback,
            nodes,
            edges: edges.iter().map(|edge| edge.id.clone()).collect(),
            message: format!("feedback edge {} provides explicit boundary", edge.id),
        };
    }

    let classification = if control_cycle_types(&edges, ports) {
        CycleValidationV02::AmbiguousAlgebraicLoop
    } else {
        CycleValidationV02::InvalidCycle
    };
    let message = match classification {
        CycleValidationV02::AmbiguousAlgebraicLoop => {
            "control/value cycle requires explicit latch, delay, or feedback policy"
        }
        _ => "cycle requires explicit feedback policy",
    };

    GraphCycleValidationV02 {
        classification,
        nodes,
        edges: edges.iter().map(|edge| edge.id.clone()).collect(),
        message: message.to_owned(),
    }
}

fn strongly_connected_components(nodes: &[String], edges: &[EdgeSpecV02]) -> Vec<Vec<String>> {
    let mut outgoing: HashMap<&str, Vec<&str>> = HashMap::new();
    for node in nodes {
        outgoing.insert(node, Vec::new());
    }
    for edge in edges.iter().filter(|edge| edge_enabled(edge)) {
        if let Some(targets) = outgoing.get_mut(edge.source.node_id.as_str()) {
            targets.push(edge.target.node_id.as_str());
        }
    }

    struct Tarjan<'a> {
        outgoing: HashMap<&'a str, Vec<&'a str>>,
        index: usize,
        stack: Vec<&'a str>,
        on_stack: HashSet<&'a str>,
        indexes: HashMap<&'a str, usize>,
        lows: HashMap<&'a str, usize>,
        components: Vec<Vec<String>>,
    }

    impl<'a> Tarjan<'a> {
        fn visit(&mut self, node: &'a str) {
            self.indexes.insert(node, self.index);
            self.lows.insert(node, self.index);
            self.index += 1;
            self.stack.push(node);
            self.on_stack.insert(node);

            for target in self.outgoing.get(node).cloned().unwrap_or_default() {
                if !self.indexes.contains_key(target) {
                    self.visit(target);
                    let low = (*self.lows.get(node).unwrap()).min(*self.lows.get(target).unwrap());
                    self.lows.insert(node, low);
                } else if self.on_stack.contains(target) {
                    let low =
                        (*self.lows.get(node).unwrap()).min(*self.indexes.get(target).unwrap());
                    self.lows.insert(node, low);
                }
            }

            if self.lows.get(node) == self.indexes.get(node) {
                let mut component = Vec::new();
                while let Some(current) = self.stack.pop() {
                    self.on_stack.remove(current);
                    component.push(current.to_owned());
                    if current == node {
                        break;
                    }
                }
                component.sort();
                self.components.push(component);
            }
        }
    }

    let mut tarjan = Tarjan {
        outgoing,
        index: 0,
        stack: Vec::new(),
        on_stack: HashSet::new(),
        indexes: HashMap::new(),
        lows: HashMap::new(),
        components: Vec::new(),
    };

    for node in nodes {
        if !tarjan.indexes.contains_key(node.as_str()) {
            tarjan.visit(node);
        }
    }

    tarjan.components
}

fn cycle_edges_for(component: &[String], edges: &[EdgeSpecV02]) -> Vec<EdgeSpecV02> {
    let component_set: HashSet<&str> = component.iter().map(String::as_str).collect();
    edges
        .iter()
        .filter(|edge| {
            edge_enabled(edge)
                && component_set.contains(edge.source.node_id.as_str())
                && component_set.contains(edge.target.node_id.as_str())
                && (component.len() > 1 || edge.source.node_id == edge.target.node_id)
        })
        .cloned()
        .collect()
}

pub fn analyze_graph_document_v02(graph: &GraphDocumentV02) -> GraphValidationResultV02 {
    let mut diagnostics = Vec::new();
    let mut cycles = Vec::new();
    let mut node_ids = HashSet::new();
    let mut ports: HashMap<String, PortSpecV02> = HashMap::new();
    let mut incoming: HashMap<String, Vec<EdgeSpecV02>> = HashMap::new();
    let mut outgoing: HashMap<String, Vec<EdgeSpecV02>> = HashMap::new();
    let mut edge_ids = HashSet::new();
    let mut edge_keys = HashSet::new();

    for node in &graph.nodes {
        if !node_ids.insert(node.id.clone()) {
            diagnostic(
                &mut diagnostics,
                "error",
                "duplicate-node-id",
                format!("duplicate node id: {}", node.id),
                Some(vec![node.id.clone()]),
                None,
            );
        }

        let mut port_ids = HashSet::new();
        for port in &node.ports {
            if !port_ids.insert(port.id.clone()) {
                diagnostic(
                    &mut diagnostics,
                    "error",
                    "duplicate-port-id",
                    format!("duplicate port id on {}: {}", node.id, port.id),
                    Some(vec![node.id.clone()]),
                    None,
                );
            }
            let key = port_key(&node.id, &port.id);
            ports.insert(key.clone(), port.clone());
            incoming.insert(key.clone(), Vec::new());
            outgoing.insert(key, Vec::new());
        }

        for group in node.port_groups.as_deref().unwrap_or_default() {
            if group.max_ports.is_some_and(|max| max < group.min_ports) {
                diagnostic(
                    &mut diagnostics,
                    "error",
                    "invalid-port-group",
                    format!(
                        "port group {}.{} maxPorts is less than minPorts",
                        node.id, group.id
                    ),
                    Some(vec![node.id.clone()]),
                    None,
                );
            }
        }
    }

    for edge in &graph.edges {
        if !edge_ids.insert(edge.id.clone()) {
            diagnostic(
                &mut diagnostics,
                "error",
                "duplicate-edge-id",
                format!("duplicate edge id: {}", edge.id),
                None,
                Some(vec![edge.id.clone()]),
            );
        }
        let edge_key = edge_endpoint_key(edge);
        if !edge_keys.insert(edge_key.clone()) {
            diagnostic(
                &mut diagnostics,
                "error",
                "duplicate-edge",
                format!("duplicate edge endpoints: {edge_key}"),
                None,
                Some(vec![edge.id.clone()]),
            );
        }

        let source_key = port_key(&edge.source.node_id, &edge.source.port_id);
        let target_key = port_key(&edge.target.node_id, &edge.target.port_id);
        let source = ports.get(&source_key);
        let target = ports.get(&target_key);

        if source.is_none() {
            diagnostic(
                &mut diagnostics,
                "error",
                "missing-source-port",
                format!(
                    "edge {} references missing source port {source_key}",
                    edge.id
                ),
                None,
                Some(vec![edge.id.clone()]),
            );
        }
        if target.is_none() {
            diagnostic(
                &mut diagnostics,
                "error",
                "missing-target-port",
                format!(
                    "edge {} references missing target port {target_key}",
                    edge.id
                ),
                None,
                Some(vec![edge.id.clone()]),
            );
        }
        let (Some(source), Some(target)) = (source, target) else {
            continue;
        };

        if source.direction != PortDirectionV02::Output {
            diagnostic(
                &mut diagnostics,
                "error",
                "invalid-source-direction",
                format!("edge {} source {source_key} is not an output port", edge.id),
                None,
                Some(vec![edge.id.clone()]),
            );
        }
        if target.direction != PortDirectionV02::Input {
            diagnostic(
                &mut diagnostics,
                "error",
                "invalid-target-direction",
                format!("edge {} target {target_key} is not an input port", edge.id),
                None,
                Some(vec![edge.id.clone()]),
            );
        }
        if !accepts(source, target) {
            diagnostic(
                &mut diagnostics,
                "error",
                "incompatible-type",
                format!(
                    "edge {} cannot connect {source_key} {} to {target_key} {}",
                    edge.id, source.port_type, target.port_type
                ),
                None,
                Some(vec![edge.id.clone()]),
            );
        }

        if edge_enabled(edge) {
            incoming
                .get_mut(&target_key)
                .expect("target key should exist")
                .push(edge.clone());
            outgoing
                .get_mut(&source_key)
                .expect("source key should exist")
                .push(edge.clone());
        }
    }

    for (key, connected_edges) in &incoming {
        let port = ports.get(key).expect("incoming key should exist");
        if port.direction != PortDirectionV02::Input {
            continue;
        }
        let minimum = if port.required == Some(true) {
            port.min_connections.unwrap_or(0).max(1)
        } else {
            port.min_connections.unwrap_or(0)
        };
        if connected_edges.len() < minimum as usize {
            diagnostic(
                &mut diagnostics,
                "error",
                "missing-required-input",
                format!("input {key} requires at least {minimum} connection(s)"),
                None,
                None,
            );
        }
        if connected_edges.len() as u64 > input_max_connections(port) {
            diagnostic(
                &mut diagnostics,
                "error",
                "fan-in-cardinality",
                format!(
                    "input {key} accepts at most {} connection(s)",
                    input_max_connections_label(port)
                ),
                None,
                None,
            );
        }
        if connected_edges.len() > 1 && merge_policy_for(port) == MergePolicyV02::Forbid {
            diagnostic(
                &mut diagnostics,
                "error",
                "fan-in-without-merge-policy",
                format!("input {key} has fan-in but mergePolicy is forbid"),
                None,
                None,
            );
        }
    }

    for (key, connected_edges) in &outgoing {
        let port = ports.get(key).expect("outgoing key should exist");
        if port.direction == PortDirectionV02::Output
            && connected_edges.len() > 1
            && port
                .fan_out_policy
                .as_ref()
                .is_some_and(|policy| matches!(policy, super::FanOutPolicyV02::Forbid))
        {
            diagnostic(
                &mut diagnostics,
                "error",
                "fan-out-forbidden",
                format!("output {key} forbids fan-out"),
                None,
                None,
            );
        }
    }

    let mut sorted_nodes: Vec<String> = node_ids.into_iter().collect();
    sorted_nodes.sort();
    for component in strongly_connected_components(&sorted_nodes, &graph.edges) {
        let component_edges = cycle_edges_for(&component, &graph.edges);
        if component_edges.is_empty() {
            continue;
        }
        let cycle = classify_cycle(component, component_edges, &ports);
        match &cycle.classification {
            CycleValidationV02::AmbiguousAlgebraicLoop | CycleValidationV02::InvalidCycle => {
                let code = match &cycle.classification {
                    CycleValidationV02::AmbiguousAlgebraicLoop => "ambiguous-algebraic-loop",
                    _ => "invalid-cycle",
                };
                diagnostic(
                    &mut diagnostics,
                    "error",
                    code,
                    cycle.message.clone(),
                    Some(cycle.nodes.clone()),
                    Some(cycle.edges.clone()),
                );
            }
            CycleValidationV02::RiskyFeedback => diagnostic(
                &mut diagnostics,
                "warning",
                "risky-feedback",
                cycle.message.clone(),
                Some(cycle.nodes.clone()),
                Some(cycle.edges.clone()),
            ),
            CycleValidationV02::NoCycle | CycleValidationV02::ValidFeedback => {}
        }
        cycles.push(cycle);
    }

    GraphValidationResultV02 {
        ok: diagnostics
            .iter()
            .all(|diagnostic| diagnostic.severity != "error"),
        diagnostics,
        cycles,
    }
}

pub fn validate_graph_document_v02(
    graph: &GraphDocumentV02,
) -> Result<GraphValidationResultV02, ValidationReportV02> {
    let mut errors = Vec::new();
    if graph.schema != "skenion.graph" {
        errors.push(ValidationErrorV02::new(format!(
            "expected schema skenion.graph, found {}",
            graph.schema
        )));
    }
    if graph.schema_version != "0.2.0" {
        errors.push(ValidationErrorV02::new(format!(
            "expected schemaVersion 0.2.0, found {}",
            graph.schema_version
        )));
    }

    let result = analyze_graph_document_v02(graph);
    for diagnostic in result
        .diagnostics
        .iter()
        .filter(|diagnostic| diagnostic.severity == "error")
    {
        errors.push(ValidationErrorV02::new(format!(
            "{}: {}",
            diagnostic.code, diagnostic.message
        )));
    }

    if errors.is_empty() {
        Ok(result)
    } else {
        Err(ValidationReportV02::new(errors))
    }
}

pub fn validate_node_definition_v02(
    definition: &NodeDefinitionManifestV02,
) -> Result<(), ValidationReportV02> {
    let mut errors = Vec::new();

    if definition.schema != "skenion.node.definition" {
        errors.push(ValidationErrorV02::new(format!(
            "expected schema skenion.node.definition, found {}",
            definition.schema
        )));
    }
    if definition.schema_version != "0.2.0" {
        errors.push(ValidationErrorV02::new(format!(
            "expected schemaVersion 0.2.0, found {}",
            definition.schema_version
        )));
    }
    errors.extend(duplicate_errors(
        definition.ports.iter().map(|port| port.id.as_str()),
        &format!("port id on {}", definition.id),
    ));

    for group in definition.port_groups.as_deref().unwrap_or_default() {
        if group.max_ports.is_some_and(|max| max < group.min_ports) {
            errors.push(ValidationErrorV02::new(format!(
                "port group {}.{} maxPorts is less than minPorts",
                definition.id, group.id
            )));
        }
    }

    for permission in &definition.permissions {
        errors.push(ValidationErrorV02::new(format!(
            "unsupported permission: {permission}"
        )));
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(ValidationReportV02::new(errors))
    }
}

fn graph_v02_semantic_errors(graph: &GraphDocumentV02, label: &str) -> Vec<ValidationErrorV02> {
    let mut errors = Vec::new();

    if graph.schema != "skenion.graph" {
        errors.push(ValidationErrorV02::new(format!(
            "{label} expected schema skenion.graph, found {}",
            graph.schema
        )));
    }
    if graph.schema_version != "0.2.0" {
        errors.push(ValidationErrorV02::new(format!(
            "{label} expected schemaVersion 0.2.0, found {}",
            graph.schema_version
        )));
    }

    errors.extend(
        analyze_graph_document_v02(graph)
            .diagnostics
            .into_iter()
            .filter(|diagnostic| diagnostic.severity == "error")
            .map(|diagnostic| {
                ValidationErrorV02::new(format!(
                    "{label} {}: {}",
                    diagnostic.code, diagnostic.message
                ))
            }),
    );

    errors
}

fn view_state_node_reference_errors(
    view_state: &ViewStateV01,
    graph: &GraphDocumentV02,
    label: &str,
) -> Vec<ValidationErrorV02> {
    let graph_node_ids: HashSet<&str> = graph.nodes.iter().map(|node| node.id.as_str()).collect();
    let mut errors = Vec::new();

    for node_id in view_state.canvas.nodes.keys() {
        if !graph_node_ids.contains(node_id.as_str()) {
            errors.push(ValidationErrorV02::new(format!(
                "{label} references missing graph node: {node_id}"
            )));
        }
    }

    errors
}

pub fn validate_patch_definition_v02(
    patch: &PatchDefinitionV02,
) -> Result<(), ValidationReportV02> {
    let mut errors = Vec::new();

    if patch.id.is_empty() {
        errors.push(ValidationErrorV02::new("patch id must not be empty"));
    }
    if patch.revision.is_empty() {
        errors.push(ValidationErrorV02::new("patch revision must not be empty"));
    }

    errors.extend(graph_v02_semantic_errors(
        &patch.graph,
        &format!("patch {} graph", patch.id),
    ));

    if let Some(view_state) = &patch.view_state {
        errors.extend(view_state_node_reference_errors(
            view_state,
            &patch.graph,
            &format!("patch {} viewState", patch.id),
        ));
    }

    let contract = derive_patch_contract_v02(patch);
    errors.extend(duplicate_errors(
        contract.ports.iter().map(|port| port.port.id.as_str()),
        &format!("boundary port id on patch {}", patch.id),
    ));

    if errors.is_empty() {
        Ok(())
    } else {
        Err(ValidationReportV02::new(errors))
    }
}

pub fn validate_project_document_v02(
    project: &ProjectDocumentV02,
) -> Result<(), ValidationReportV02> {
    let mut errors = Vec::new();

    if project.schema != "skenion.project" {
        errors.push(ValidationErrorV02::new(format!(
            "expected schema skenion.project, found {}",
            project.schema
        )));
    }
    if project.schema_version != "0.2.0" {
        errors.push(ValidationErrorV02::new(format!(
            "expected schemaVersion 0.2.0, found {}",
            project.schema_version
        )));
    }
    if project.id.is_empty() {
        errors.push(ValidationErrorV02::new("project id must not be empty"));
    }
    if project.revision.is_empty() {
        errors.push(ValidationErrorV02::new(
            "project revision must not be empty",
        ));
    }

    errors.extend(graph_v02_semantic_errors(&project.graph, "root graph"));
    errors.extend(view_state_node_reference_errors(
        &project.view_state,
        &project.graph,
        "viewState",
    ));
    errors.extend(duplicate_errors(
        project.patch_library.iter().map(|patch| patch.id.as_str()),
        "patch id",
    ));

    for patch in &project.patch_library {
        if let Err(report) = validate_patch_definition_v02(patch) {
            errors.extend(report.errors);
        }
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(ValidationReportV02::new(errors))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::v0_2::{EdgeEndpointV02, FeedbackPolicyV02, GraphNodeV02};
    use serde_json::json;

    fn graph(json: &str) -> GraphDocumentV02 {
        serde_json::from_str(json).expect("graph should parse")
    }

    fn node(json: &str) -> NodeDefinitionManifestV02 {
        serde_json::from_str(json).expect("node should parse")
    }

    fn base_graph() -> GraphDocumentV02 {
        graph(
            r#"{
              "schema": "skenion.graph",
              "schemaVersion": "0.2.0",
              "id": "base",
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
                  "kind": "core.float",
                  "kindVersion": "0.2.0",
                  "params": {},
                  "ports": [
                    { "id": "in", "direction": "input", "type": "value.number" }
                  ]
                }
              ],
              "edges": [
                {
                  "id": "edge_source_target",
                  "source": { "nodeId": "source", "portId": "out" },
                  "target": { "nodeId": "target", "portId": "in" }
                }
              ]
            }"#,
        )
    }

    #[test]
    fn validates_basic_graph_and_serializes_optional_fields_as_absent() {
        let graph = base_graph();
        let result = validate_graph_document_v02(&graph).expect("graph should validate");
        assert!(result.ok);
        assert!(result.diagnostics.is_empty());

        let serialized = serde_json::to_string(&graph).expect("graph should serialize");
        assert!(!serialized.contains("null"));
    }

    #[test]
    fn reports_direction_missing_duplicate_type_and_fanout_errors() {
        let mut graph = base_graph();
        graph.nodes[0].ports[0].fan_out_policy = Some(super::super::FanOutPolicyV02::Forbid);
        graph.nodes[1].ports[0].port_type = "render.frame".to_owned();
        graph.nodes[1].ports[0].accepts = Some(vec!["gpu.texture2d".to_owned()]);
        let duplicate_port = graph.nodes[1].ports[0].clone();
        graph.nodes[1].ports.push(duplicate_port);
        graph.nodes.push(graph.nodes[1].clone());
        graph.edges.push(graph.edges[0].clone());
        graph.edges[1].id = "edge_duplicate".to_owned();
        graph.edges.push(EdgeSpecV02 {
            id: "edge_missing".to_owned(),
            source: EdgeEndpointV02 {
                node_id: "source".to_owned(),
                port_id: "missing".to_owned(),
            },
            target: EdgeEndpointV02 {
                node_id: "target".to_owned(),
                port_id: "in".to_owned(),
            },
            resolved_type: None,
            order: None,
            enabled: None,
            adapter: None,
            feedback: None,
            style_override: None,
            label: None,
            description: None,
        });
        graph.edges.push(EdgeSpecV02 {
            id: "edge_input_source".to_owned(),
            source: EdgeEndpointV02 {
                node_id: "target".to_owned(),
                port_id: "in".to_owned(),
            },
            target: EdgeEndpointV02 {
                node_id: "source".to_owned(),
                port_id: "out".to_owned(),
            },
            resolved_type: None,
            order: None,
            enabled: None,
            adapter: None,
            feedback: None,
            style_override: None,
            label: None,
            description: None,
        });
        graph.edges.push(EdgeSpecV02 {
            id: "edge_missing_target".to_owned(),
            source: EdgeEndpointV02 {
                node_id: "source".to_owned(),
                port_id: "out".to_owned(),
            },
            target: EdgeEndpointV02 {
                node_id: "missing".to_owned(),
                port_id: "in".to_owned(),
            },
            resolved_type: None,
            order: None,
            enabled: None,
            adapter: None,
            feedback: None,
            style_override: None,
            label: None,
            description: None,
        });
        graph.edges.push(EdgeSpecV02 {
            id: "edge_duplicate".to_owned(),
            source: EdgeEndpointV02 {
                node_id: "source".to_owned(),
                port_id: "out".to_owned(),
            },
            target: EdgeEndpointV02 {
                node_id: "target".to_owned(),
                port_id: "in".to_owned(),
            },
            resolved_type: None,
            order: None,
            enabled: None,
            adapter: None,
            feedback: None,
            style_override: None,
            label: None,
            description: None,
        });

        let report = validate_graph_document_v02(&graph).expect_err("graph should fail");
        let text = report.to_string();
        assert!(text.contains("duplicate-node-id"));
        assert!(text.contains("duplicate-port-id"));
        assert!(text.contains("duplicate-edge-id"));
        assert!(text.contains("duplicate-edge"));
        assert!(text.contains("missing-source-port"));
        assert!(text.contains("missing-target-port"));
        assert!(text.contains("invalid-source-direction"));
        assert!(text.contains("invalid-target-direction"));
        assert!(text.contains("incompatible-type"));
        assert!(text.contains("fan-out-forbidden"));
        assert!(report.errors().len() >= 5);
    }

    #[test]
    fn validates_accepts_required_merge_and_unlimited_connection_rules() {
        let mut graph = base_graph();
        graph.nodes[0].ports[0].port_type = "gpu.texture2d".to_owned();
        graph.nodes[1].ports[0].accepts = Some(vec!["gpu.texture2d".to_owned()]);
        assert!(validate_graph_document_v02(&graph).is_ok());

        graph.nodes[1].ports[0].required = Some(true);
        graph.edges.clear();
        let missing = validate_graph_document_v02(&graph).expect_err("required input should fail");
        assert!(missing.to_string().contains("missing-required-input"));

        graph.nodes.push(GraphNodeV02 {
            id: "source_two".to_owned(),
            kind: "core.value".to_owned(),
            kind_version: "0.2.0".to_owned(),
            params: serde_json::Map::new(),
            ports: vec![PortSpecV02 {
                id: "out".to_owned(),
                direction: PortDirectionV02::Output,
                port_type: "gpu.texture2d".to_owned(),
                label: None,
                rate: None,
                accepts: None,
                min_connections: None,
                max_connections: None,
                merge_policy: None,
                fan_out_policy: None,
                trigger_mode: None,
                default_value: None,
                latch: None,
                required: None,
                style_key: None,
                group: None,
                description: None,
            }],
            port_groups: None,
        });
        graph.edges = vec![
            EdgeSpecV02 {
                id: "edge_one".to_owned(),
                source: EdgeEndpointV02 {
                    node_id: "source".to_owned(),
                    port_id: "out".to_owned(),
                },
                target: EdgeEndpointV02 {
                    node_id: "target".to_owned(),
                    port_id: "in".to_owned(),
                },
                resolved_type: None,
                order: Some(0),
                enabled: None,
                adapter: None,
                feedback: None,
                style_override: None,
                label: None,
                description: None,
            },
            EdgeSpecV02 {
                id: "edge_two".to_owned(),
                source: EdgeEndpointV02 {
                    node_id: "source_two".to_owned(),
                    port_id: "out".to_owned(),
                },
                target: EdgeEndpointV02 {
                    node_id: "target".to_owned(),
                    port_id: "in".to_owned(),
                },
                resolved_type: None,
                order: Some(1),
                enabled: Some(false),
                adapter: None,
                feedback: None,
                style_override: None,
                label: None,
                description: None,
            },
        ];
        assert!(validate_graph_document_v02(&graph).is_ok());

        graph.edges[1].enabled = None;
        let fan_in = validate_graph_document_v02(&graph).expect_err("default fan-in should fail");
        assert!(fan_in.to_string().contains("fan-in-cardinality"));
        graph.nodes[1].ports[0].max_connections = Some(Some(2));
        let merge = validate_graph_document_v02(&graph).expect_err("missing merge should fail");
        assert!(merge.to_string().contains("fan-in-without-merge-policy"));
        graph.nodes[1].ports[0].merge_policy = Some(MergePolicyV02::Array);
        assert!(validate_graph_document_v02(&graph).is_ok());
    }

    #[test]
    fn message_any_inlets_accept_bang_events() {
        let graph = graph(
            r#"{
              "schema": "skenion.graph",
              "schemaVersion": "0.2.0",
              "id": "message-any-control-types",
              "revision": "1",
              "nodes": [
                {
                  "id": "button",
                  "kind": "core.bang",
                  "kindVersion": "0.2.0",
                  "params": {},
                  "ports": [
                    { "id": "out", "direction": "output", "type": "event.bang", "rate": "event" }
                  ]
                },
                {
                  "id": "float_value",
                  "kind": "core.float",
                  "kindVersion": "0.2.0",
                  "params": {},
                  "ports": [
                    { "id": "value", "direction": "output", "type": "number.float", "rate": "event" }
                  ]
                },
                {
                  "id": "int_value",
                  "kind": "core.int",
                  "kindVersion": "0.2.0",
                  "params": {},
                  "ports": [
                    { "id": "value", "direction": "output", "type": "number.int", "rate": "event" }
                  ]
                },
                {
                  "id": "uint_value",
                  "kind": "core.uint",
                  "kindVersion": "0.2.0",
                  "params": {},
                  "ports": [
                    { "id": "value", "direction": "output", "type": "number.uint", "rate": "event" }
                  ]
                },
                {
                  "id": "bool_value",
                  "kind": "core.bool",
                  "kindVersion": "0.2.0",
                  "params": {},
                  "ports": [
                    { "id": "value", "direction": "output", "type": "boolean", "rate": "event" }
                  ]
                },
                {
                  "id": "color_value",
                  "kind": "core.color",
                  "kindVersion": "0.2.0",
                  "params": {},
                  "ports": [
                    { "id": "value", "direction": "output", "type": "color", "rate": "event" }
                  ]
                },
                {
                  "id": "string_value",
                  "kind": "core.string",
                  "kindVersion": "0.2.0",
                  "params": {},
                  "ports": [
                    { "id": "value", "direction": "output", "type": "string", "rate": "event" }
                  ]
                },
                {
                  "id": "message",
                  "kind": "core.message",
                  "kindVersion": "0.2.0",
                  "params": {},
                  "ports": [
                    { "id": "in", "direction": "input", "type": "message.any", "rate": "event", "maxConnections": 7, "mergePolicy": "ordered-events", "triggerMode": "trigger" }
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
        );

        validate_graph_document_v02(&graph).expect("event.bang should feed message.any");
    }

    #[test]
    fn classifies_cycles_without_executing_feedback() {
        let mut graph = base_graph();
        graph.nodes[0].ports.push(PortSpecV02 {
            id: "in".to_owned(),
            direction: PortDirectionV02::Input,
            port_type: "value.number".to_owned(),
            label: None,
            rate: None,
            accepts: None,
            min_connections: None,
            max_connections: None,
            merge_policy: None,
            fan_out_policy: None,
            trigger_mode: None,
            default_value: None,
            latch: None,
            required: None,
            style_key: None,
            group: None,
            description: None,
        });
        graph.nodes[1].ports.push(PortSpecV02 {
            id: "out".to_owned(),
            direction: PortDirectionV02::Output,
            port_type: "value.number".to_owned(),
            label: None,
            rate: None,
            accepts: None,
            min_connections: None,
            max_connections: None,
            merge_policy: None,
            fan_out_policy: None,
            trigger_mode: None,
            default_value: None,
            latch: None,
            required: None,
            style_key: None,
            group: None,
            description: None,
        });
        graph.edges.push(EdgeSpecV02 {
            id: "edge_target_source".to_owned(),
            source: EdgeEndpointV02 {
                node_id: "target".to_owned(),
                port_id: "out".to_owned(),
            },
            target: EdgeEndpointV02 {
                node_id: "source".to_owned(),
                port_id: "in".to_owned(),
            },
            resolved_type: None,
            order: None,
            enabled: None,
            adapter: None,
            feedback: None,
            style_override: None,
            label: None,
            description: None,
        });

        let ambiguous = validate_graph_document_v02(&graph).expect_err("cycle should fail");
        assert!(ambiguous.to_string().contains("ambiguous-algebraic-loop"));

        graph.edges[1].feedback = Some(FeedbackPolicyV02 {
            enabled: true,
            boundary: FeedbackBoundaryV02::RenderFrame,
            initial_value: Some(json!(0.0)),
            recursion_limit: Some(1),
            max_events_per_tick: Some(8),
            max_iterations_per_frame: Some(1),
            buffer_mode: Some(super::super::FeedbackBufferModeV02::Latest),
            intentional: Some(true),
            label: Some("feedback".to_owned()),
        });
        let feedback = validate_graph_document_v02(&graph).expect("explicit feedback should pass");
        assert_eq!(
            feedback.cycles[0].classification,
            CycleValidationV02::ValidFeedback
        );

        graph.edges[1].feedback.as_mut().unwrap().boundary = FeedbackBoundaryV02::SameTurn;
        let risky = analyze_graph_document_v02(&graph);
        assert!(risky.ok);
        assert_eq!(risky.diagnostics[0].severity, "warning");
        assert_eq!(
            risky.cycles[0].classification,
            CycleValidationV02::RiskyFeedback
        );
    }

    #[test]
    fn validates_node_definition_schema_permissions_and_groups() {
        let valid = node(
            r#"{
              "schema": "skenion.node.definition",
              "schemaVersion": "0.2.0",
              "id": "render.clear-color",
              "version": "0.2.0",
              "displayName": "Clear Color",
              "category": "Render",
              "ports": [
                { "id": "out", "direction": "output", "type": "render.frame" }
              ],
              "execution": { "model": "gpu_pass", "clock": "frame" },
              "state": { "persistent": false },
              "permissions": [],
              "capabilities": ["render.frame.v0.2"]
            }"#,
        );
        validate_node_definition_v02(&valid).expect("node should validate");

        let mut invalid = valid;
        invalid.schema = "wrong".to_owned();
        invalid.schema_version = "9.9.9".to_owned();
        invalid.permissions.push("network".to_owned());
        invalid.ports.push(invalid.ports[0].clone());
        invalid.port_groups = Some(vec![super::super::PortGroupSpecV02 {
            id: "bad".to_owned(),
            direction: PortDirectionV02::Input,
            port_type: "value.number".to_owned(),
            min_ports: 2,
            label: None,
            rate: None,
            max_ports: Some(1),
            ordered: None,
            port_id_pattern: None,
            create_label: None,
            default_port_spec: None,
        }]);
        let report = validate_node_definition_v02(&invalid).expect_err("node should fail");
        let text = report.to_string();
        assert!(text.contains("expected schema skenion.node.definition"));
        assert!(text.contains("expected schemaVersion 0.2.0"));
        assert!(text.contains("unsupported permission"));
        assert!(text.contains("duplicate port id"));
        assert!(text.contains("maxPorts"));
    }

    #[test]
    fn reports_schema_mismatches_and_invalid_port_group_on_graph() {
        let mut graph = base_graph();
        graph.schema = "wrong".to_owned();
        graph.schema_version = "9.9.9".to_owned();
        graph.nodes.push(GraphNodeV02 {
            id: "grouped".to_owned(),
            kind: "core.grouped".to_owned(),
            kind_version: "0.2.0".to_owned(),
            params: serde_json::Map::new(),
            ports: Vec::new(),
            port_groups: Some(vec![super::super::PortGroupSpecV02 {
                id: "bad".to_owned(),
                direction: PortDirectionV02::Input,
                port_type: "value.number".to_owned(),
                min_ports: 2,
                label: None,
                rate: None,
                max_ports: Some(1),
                ordered: None,
                port_id_pattern: None,
                create_label: None,
                default_port_spec: None,
            }]),
        });
        let report = validate_graph_document_v02(&graph).expect_err("graph should fail");
        let text = report.to_string();
        assert!(text.contains("expected schema skenion.graph"));
        assert!(text.contains("expected schemaVersion 0.2.0"));
        assert!(text.contains("invalid-port-group"));
    }
}
