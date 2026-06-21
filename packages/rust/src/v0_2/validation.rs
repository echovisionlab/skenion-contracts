use std::{
    collections::{HashMap, HashSet},
    error::Error,
    fmt,
};

use super::{
    CycleValidationV02, EdgeSpecV02, FeedbackBoundaryV02, GraphCycleValidationV02,
    GraphDocumentV02, GraphFragmentDiagnosticV02, GraphFragmentOutsideEndpointPolicyV02,
    GraphFragmentV02, GraphFragmentValidationResultV02, GraphValidationDiagnosticV02,
    GraphValidationResultV02, MergePolicyV02, NodeDefinitionManifestV02, PasteGraphFragmentRequest,
    PasteGraphFragmentResponse, PatchDefinitionV02, PortDirectionV02, PortSpecV02,
    ProjectDocumentV02, RuntimeCollaborationAuthSubject, RuntimeCollaborationCausalMetadata,
    RuntimeCollaborationChange, RuntimeCollaborationEventEnvelope, RuntimeCollaborationNackReason,
    RuntimeCollaborationOperationBatch, RuntimeCollaborationOperationEnvelope,
    RuntimeCollaborationOperationPayload, RuntimeCollaborationOperationResult,
    RuntimeCollaborationOperationStatus, RuntimeCollaborationPresenceEnvelope,
    RuntimeCollaborationSelectionEnvelope, RuntimeConnectionProfile, RuntimeConnectionProfileMode,
    RuntimeHistory, RuntimeHistoryEntry, RuntimeMutationRequest, RuntimeOperationEnvelope,
    RuntimeOwnershipMode, RuntimeSessionEvent, RuntimeSessionInfoResponse, RuntimeSessionSnapshot,
    RuntimeViewPatchOperation, derive_patch_contract_v02,
};
use crate::v0_1::{
    DataTypeV01, EdgeV01, GraphNodeV01, GraphPatchOperationV01, GraphPatchV01, PortV01,
    StringOrStringsV01, ViewStateV01,
};

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

fn fragment_diagnostic(
    diagnostics: &mut Vec<GraphFragmentDiagnosticV02>,
    severity: &str,
    code: &str,
    message: impl Into<String>,
    nodes: Option<Vec<String>>,
    edges: Option<Vec<String>>,
) {
    diagnostics.push(GraphFragmentDiagnosticV02 {
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

pub fn analyze_graph_fragment_v02(
    fragment: &GraphFragmentV02,
    outside_endpoint_policy: GraphFragmentOutsideEndpointPolicyV02,
) -> GraphFragmentValidationResultV02 {
    let mut diagnostics = Vec::new();
    let mut omitted_edge_ids = Vec::new();
    let mut node_ids = HashSet::new();
    let mut edge_ids = HashSet::new();
    let mut ports = HashMap::new();

    for node in &fragment.nodes {
        if !node_ids.insert(node.id.clone()) {
            fragment_diagnostic(
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
                fragment_diagnostic(
                    &mut diagnostics,
                    "error",
                    "duplicate-port-id",
                    format!("duplicate port id on {}: {}", node.id, port.id),
                    Some(vec![node.id.clone()]),
                    None,
                );
            }
            ports.insert(port_key(&node.id, &port.id), port.clone());
        }
    }

    for edge in &fragment.edges {
        if !edge_ids.insert(edge.id.clone()) {
            fragment_diagnostic(
                &mut diagnostics,
                "error",
                "duplicate-edge-id",
                format!("duplicate edge id: {}", edge.id),
                None,
                Some(vec![edge.id.clone()]),
            );
        }

        let source_node_missing = !node_ids.contains(&edge.source.node_id);
        let target_node_missing = !node_ids.contains(&edge.target.node_id);
        if source_node_missing || target_node_missing {
            let severity = if outside_endpoint_policy == GraphFragmentOutsideEndpointPolicyV02::Omit
            {
                omitted_edge_ids.push(edge.id.clone());
                "warning"
            } else {
                "error"
            };
            fragment_diagnostic(
                &mut diagnostics,
                severity,
                "fragment-edge-outside-selection",
                format!(
                    "edge {} references an endpoint outside the graph fragment",
                    edge.id
                ),
                None,
                Some(vec![edge.id.clone()]),
            );
            continue;
        }

        let source_key = port_key(&edge.source.node_id, &edge.source.port_id);
        let target_key = port_key(&edge.target.node_id, &edge.target.port_id);
        let source = ports.get(&source_key);
        let target = ports.get(&target_key);

        if source.is_none() {
            fragment_diagnostic(
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
            fragment_diagnostic(
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
            fragment_diagnostic(
                &mut diagnostics,
                "error",
                "invalid-source-direction",
                format!("edge {} source {source_key} is not an output port", edge.id),
                None,
                Some(vec![edge.id.clone()]),
            );
        }
        if target.direction != PortDirectionV02::Input {
            fragment_diagnostic(
                &mut diagnostics,
                "error",
                "invalid-target-direction",
                format!("edge {} target {target_key} is not an input port", edge.id),
                None,
                Some(vec![edge.id.clone()]),
            );
        }
        if !accepts(source, target) {
            fragment_diagnostic(
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
    }

    GraphFragmentValidationResultV02 {
        ok: diagnostics
            .iter()
            .all(|diagnostic| diagnostic.severity != "error"),
        diagnostics,
        omitted_edge_ids,
    }
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
        let max_connections = input_max_connections(port);
        if connected_edges.len() as u64 > max_connections {
            diagnostic(
                &mut diagnostics,
                "error",
                "fan-in-cardinality",
                format!(
                    "input {key} accepts at most {} connection(s)",
                    max_connections
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

fn validate_graph_fragment_with_policy(
    fragment: &GraphFragmentV02,
    outside_endpoint_policy: GraphFragmentOutsideEndpointPolicyV02,
) -> Result<GraphFragmentValidationResultV02, ValidationReportV02> {
    let mut errors = Vec::new();
    if fragment.schema != "skenion.graph.fragment" {
        errors.push(ValidationErrorV02::new(format!(
            "expected schema skenion.graph.fragment, found {}",
            fragment.schema
        )));
    }
    if fragment.schema_version != "0.2.0" {
        errors.push(ValidationErrorV02::new(format!(
            "expected schemaVersion 0.2.0, found {}",
            fragment.schema_version
        )));
    }

    let result = analyze_graph_fragment_v02(fragment, outside_endpoint_policy);
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

pub fn validate_graph_fragment_v02(
    fragment: &GraphFragmentV02,
) -> Result<GraphFragmentValidationResultV02, ValidationReportV02> {
    validate_graph_fragment_with_policy(fragment, GraphFragmentOutsideEndpointPolicyV02::Reject)
}

pub fn validate_paste_graph_fragment_request(
    request: &PasteGraphFragmentRequest,
) -> Result<GraphFragmentValidationResultV02, ValidationReportV02> {
    let outside_endpoint_policy = request
        .options
        .as_ref()
        .and_then(|options| options.outside_endpoint_policy)
        .unwrap_or_default();
    validate_graph_fragment_with_policy(&request.fragment, outside_endpoint_policy)
}

fn validate_runtime_collaboration_causality(
    causal: &RuntimeCollaborationCausalMetadata,
    label: &str,
) -> Vec<ValidationErrorV02> {
    let max_vector = causal.vector.values().copied().max().unwrap_or(0);
    if causal.base_sequence < max_vector {
        vec![ValidationErrorV02::new(format!(
            "{label} baseSequence must be greater than or equal to the causal vector maximum"
        ))]
    } else {
        Vec::new()
    }
}

fn validate_runtime_collaboration_auth_separation(
    participant_id: &str,
    auth_subject: Option<&RuntimeCollaborationAuthSubject>,
    label: &str,
) -> Vec<ValidationErrorV02> {
    if auth_subject
        .and_then(|subject| subject.subject_id.as_deref())
        .is_some_and(|subject_id| subject_id == participant_id)
    {
        vec![ValidationErrorV02::new(format!(
            "{label} participantId must not mirror auth subject id"
        ))]
    } else {
        Vec::new()
    }
}

fn validate_runtime_collaboration_expiry(
    updated_at: &str,
    expires_at: &str,
    label: &str,
) -> Vec<ValidationErrorV02> {
    if expires_at <= updated_at {
        vec![ValidationErrorV02::new(format!(
            "{label} expiresAt must be later than updatedAt"
        ))]
    } else {
        Vec::new()
    }
}

fn runtime_collaboration_change_id(change: &RuntimeCollaborationChange) -> &str {
    match change {
        RuntimeCollaborationChange::NodeAdd { change_id, .. }
        | RuntimeCollaborationChange::NodeMove { change_id, .. }
        | RuntimeCollaborationChange::NodeDelete { change_id, .. }
        | RuntimeCollaborationChange::EdgeConnect { change_id, .. }
        | RuntimeCollaborationChange::EdgeDisconnect { change_id, .. } => change_id,
    }
}

fn validate_runtime_collaboration_payload(
    payload: &RuntimeCollaborationOperationPayload,
    participant_id: &str,
) -> Vec<ValidationErrorV02> {
    match payload {
        RuntimeCollaborationOperationPayload::ChangeSet { changes, .. } => duplicate_errors(
            changes.iter().map(runtime_collaboration_change_id),
            "collaboration change id",
        ),
        RuntimeCollaborationOperationPayload::PasteGraphFragment { request, .. } => {
            match validate_paste_graph_fragment_request(request) {
                Ok(_) => Vec::new(),
                Err(report) => report.errors().to_vec(),
            }
        }
        RuntimeCollaborationOperationPayload::UndoRedo { scope, .. } => {
            if scope.participant_id != participant_id {
                vec![ValidationErrorV02::new(
                    "undoRedo scope participantId must match operation participantId",
                )]
            } else {
                Vec::new()
            }
        }
    }
}

fn validate_runtime_collaboration_operation_envelope_semantics(
    envelope: &RuntimeCollaborationOperationEnvelope,
) -> Vec<ValidationErrorV02> {
    let mut errors = Vec::new();
    errors.extend(validate_runtime_collaboration_causality(
        &envelope.causal,
        "operation causal",
    ));
    errors.extend(validate_runtime_collaboration_auth_separation(
        &envelope.participant_id,
        envelope.auth_subject.as_ref(),
        "operation",
    ));
    errors.extend(validate_runtime_collaboration_payload(
        &envelope.payload,
        &envelope.participant_id,
    ));

    if !envelope
        .causal
        .vector
        .contains_key(&envelope.participant_id)
    {
        errors.push(ValidationErrorV02::new(
            "operation causal vector must include participantId",
        ));
    }

    errors
}

pub fn validate_runtime_collaboration_operation_envelope(
    envelope: &RuntimeCollaborationOperationEnvelope,
) -> Result<(), ValidationReportV02> {
    let mut errors = Vec::new();
    if envelope.schema != "skenion.runtime.collaboration.operation" {
        errors.push(ValidationErrorV02::new(format!(
            "expected schema skenion.runtime.collaboration.operation, found {}",
            envelope.schema
        )));
    }
    if envelope.schema_version != "0.1.0" {
        errors.push(ValidationErrorV02::new(format!(
            "expected schemaVersion 0.1.0, found {}",
            envelope.schema_version
        )));
    }
    errors.extend(validate_runtime_collaboration_operation_envelope_semantics(
        envelope,
    ));

    if errors.is_empty() {
        Ok(())
    } else {
        Err(ValidationReportV02::new(errors))
    }
}

pub fn validate_runtime_collaboration_operation_batch(
    batch: &RuntimeCollaborationOperationBatch,
) -> Result<(), ValidationReportV02> {
    let mut errors = Vec::new();
    if batch.schema != "skenion.runtime.collaboration.operation-batch" {
        errors.push(ValidationErrorV02::new(format!(
            "expected schema skenion.runtime.collaboration.operation-batch, found {}",
            batch.schema
        )));
    }
    if batch.schema_version != "0.1.0" {
        errors.push(ValidationErrorV02::new(format!(
            "expected schemaVersion 0.1.0, found {}",
            batch.schema_version
        )));
    }
    errors.extend(duplicate_errors(
        batch
            .operations
            .iter()
            .map(|operation| operation.idempotency_key.as_str()),
        "collaboration idempotency key",
    ));
    for operation in &batch.operations {
        if operation.session_id != batch.session_id {
            errors.push(ValidationErrorV02::new(
                "collaboration batch operation sessionId must match batch sessionId",
            ));
        }
        errors.extend(validate_runtime_collaboration_operation_envelope_semantics(
            operation,
        ));
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(ValidationReportV02::new(errors))
    }
}

pub fn validate_runtime_collaboration_operation_result(
    result: &RuntimeCollaborationOperationResult,
) -> Result<(), ValidationReportV02> {
    let mut errors = Vec::new();
    if result.schema != "skenion.runtime.collaboration.operation-result" {
        errors.push(ValidationErrorV02::new(format!(
            "expected schema skenion.runtime.collaboration.operation-result, found {}",
            result.schema
        )));
    }
    if result.schema_version != "0.1.0" {
        errors.push(ValidationErrorV02::new(format!(
            "expected schemaVersion 0.1.0, found {}",
            result.schema_version
        )));
    }

    errors.extend(validate_runtime_collaboration_causality(
        &result.causal,
        "operation result causal",
    ));

    let has_ack = result.ack.is_some();
    let has_nack = result.nack.is_some();
    let has_rebase = result.rebase.is_some();
    if matches!(
        result.status,
        RuntimeCollaborationOperationStatus::Accepted
            | RuntimeCollaborationOperationStatus::Rebased
    ) && !has_ack
    {
        errors.push(ValidationErrorV02::new(
            "accepted or rebased collaboration result must include ack",
        ));
    }
    if result.status == RuntimeCollaborationOperationStatus::Accepted && (has_nack || has_rebase) {
        errors.push(ValidationErrorV02::new(
            "accepted collaboration result must not include nack or rebase",
        ));
    }
    if matches!(
        result.status,
        RuntimeCollaborationOperationStatus::Duplicate
            | RuntimeCollaborationOperationStatus::Rejected
    ) && !has_nack
    {
        errors.push(ValidationErrorV02::new(
            "duplicate or rejected collaboration result must include nack",
        ));
    }
    if result.status == RuntimeCollaborationOperationStatus::Duplicate
        && !result.nack.as_ref().is_some_and(|nack| {
            nack.reason == RuntimeCollaborationNackReason::DuplicateIdempotencyKey
        })
    {
        errors.push(ValidationErrorV02::new(
            "duplicate collaboration result nack reason must be duplicate-idempotency-key",
        ));
    }
    if result.status == RuntimeCollaborationOperationStatus::Rebased && !has_rebase {
        errors.push(ValidationErrorV02::new(
            "rebased collaboration result must include rebase metadata",
        ));
    }
    if let Some(rebase) = &result.rebase {
        errors.extend(validate_runtime_collaboration_causality(
            &rebase.from,
            "rebase from causal",
        ));
        errors.extend(validate_runtime_collaboration_causality(
            &rebase.to,
            "rebase to causal",
        ));
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(ValidationReportV02::new(errors))
    }
}

pub fn validate_runtime_collaboration_presence_envelope(
    presence: &RuntimeCollaborationPresenceEnvelope,
) -> Result<(), ValidationReportV02> {
    let mut errors = Vec::new();
    if presence.schema != "skenion.runtime.collaboration.presence" {
        errors.push(ValidationErrorV02::new(format!(
            "expected schema skenion.runtime.collaboration.presence, found {}",
            presence.schema
        )));
    }
    if presence.schema_version != "0.1.0" {
        errors.push(ValidationErrorV02::new(format!(
            "expected schemaVersion 0.1.0, found {}",
            presence.schema_version
        )));
    }
    errors.extend(validate_runtime_collaboration_auth_separation(
        &presence.participant_id,
        presence.auth_subject.as_ref(),
        "presence",
    ));
    errors.extend(validate_runtime_collaboration_expiry(
        &presence.updated_at,
        &presence.expires_at,
        "presence",
    ));

    if errors.is_empty() {
        Ok(())
    } else {
        Err(ValidationReportV02::new(errors))
    }
}

pub fn validate_runtime_collaboration_selection_envelope(
    selection: &RuntimeCollaborationSelectionEnvelope,
) -> Result<(), ValidationReportV02> {
    let mut errors = Vec::new();
    if selection.schema != "skenion.runtime.collaboration.selection" {
        errors.push(ValidationErrorV02::new(format!(
            "expected schema skenion.runtime.collaboration.selection, found {}",
            selection.schema
        )));
    }
    if selection.schema_version != "0.1.0" {
        errors.push(ValidationErrorV02::new(format!(
            "expected schemaVersion 0.1.0, found {}",
            selection.schema_version
        )));
    }
    errors.extend(validate_runtime_collaboration_expiry(
        &selection.updated_at,
        &selection.expires_at,
        "selection",
    ));

    if errors.is_empty() {
        Ok(())
    } else {
        Err(ValidationReportV02::new(errors))
    }
}

pub fn validate_runtime_collaboration_event_envelope(
    event: &RuntimeCollaborationEventEnvelope,
) -> Result<(), ValidationReportV02> {
    let mut errors = Vec::new();
    if event.schema != "skenion.runtime.collaboration.event" {
        errors.push(ValidationErrorV02::new(format!(
            "expected schema skenion.runtime.collaboration.event, found {}",
            event.schema
        )));
    }
    if event.schema_version != "0.1.0" {
        errors.push(ValidationErrorV02::new(format!(
            "expected schemaVersion 0.1.0, found {}",
            event.schema_version
        )));
    }
    errors.extend(validate_runtime_collaboration_causality(
        &event.causal,
        "collaboration event causal",
    ));
    if event
        .replay
        .gap
        .as_ref()
        .is_some_and(|gap| gap.expected_sequence >= gap.actual_sequence)
    {
        errors.push(ValidationErrorV02::new(
            "collaboration event replay gap expectedSequence must be less than actualSequence",
        ));
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(ValidationReportV02::new(errors))
    }
}

pub fn validate_runtime_operation_envelope(
    envelope: &RuntimeOperationEnvelope,
) -> Result<(), ValidationReportV02> {
    let mut errors = Vec::new();
    if envelope.schema != "skenion.runtime.operation" {
        errors.push(ValidationErrorV02::new(format!(
            "expected schema skenion.runtime.operation, found {}",
            envelope.schema
        )));
    }
    if envelope.schema_version != "0.1.0" {
        errors.push(ValidationErrorV02::new(format!(
            "expected schemaVersion 0.1.0, found {}",
            envelope.schema_version
        )));
    }
    if envelope.kind != "pasteGraphFragment" {
        errors.push(ValidationErrorV02::new(format!(
            "unsupported runtime operation kind: {}",
            envelope.kind
        )));
    }
    if let Err(report) = validate_paste_graph_fragment_request(&envelope.request) {
        errors.extend(report.errors().iter().cloned());
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(ValidationReportV02::new(errors))
    }
}

pub fn validate_paste_graph_fragment_response(
    response: &PasteGraphFragmentResponse,
) -> Result<(), ValidationReportV02> {
    let mut errors = Vec::new();
    if response.schema != "skenion.runtime.paste-graph-fragment.response" {
        errors.push(ValidationErrorV02::new(format!(
            "expected schema skenion.runtime.paste-graph-fragment.response, found {}",
            response.schema
        )));
    }
    if response.schema_version != "0.1.0" {
        errors.push(ValidationErrorV02::new(format!(
            "expected schemaVersion 0.1.0, found {}",
            response.schema_version
        )));
    }
    if response.applied && !response.ok {
        errors.push(ValidationErrorV02::new(
            "paste response cannot be applied when ok is false",
        ));
    }
    if response.applied && response.revision_after.is_none() {
        errors.push(ValidationErrorV02::new(
            "applied paste response must include revisionAfter",
        ));
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(ValidationReportV02::new(errors))
    }
}

pub fn validate_runtime_session_info_response(
    response: &RuntimeSessionInfoResponse,
) -> Result<(), ValidationReportV02> {
    let mut errors = Vec::new();
    if response.schema != "skenion.runtime.session.info" {
        errors.push(ValidationErrorV02::new(format!(
            "expected schema skenion.runtime.session.info, found {}",
            response.schema
        )));
    }
    if response.schema_version != "0.1.0" {
        errors.push(ValidationErrorV02::new(format!(
            "expected schemaVersion 0.1.0, found {}",
            response.schema_version
        )));
    }
    if response.session_id.is_empty() {
        errors.push(ValidationErrorV02::new("sessionId must not be empty"));
    }
    errors.extend(runtime_session_snapshot_errors(&response.snapshot));
    errors.extend(runtime_profile_errors(&response.profile));
    if response.capabilities.auth_policy != "deferred" {
        errors.push(ValidationErrorV02::new(
            "runtime session authPolicy must be deferred",
        ));
    }
    if response.event_replay.cursor_kind != "sequence" {
        errors.push(ValidationErrorV02::new(
            "runtime eventReplay cursorKind must be sequence",
        ));
    }
    if response.event_replay.current_cursor.is_empty() {
        errors.push(ValidationErrorV02::new(
            "runtime eventReplay currentCursor must not be empty",
        ));
    }
    if response.event_replay.earliest_sequence == 0 {
        errors.push(ValidationErrorV02::new(
            "runtime eventReplay earliestSequence must be at least 1",
        ));
    }
    if matches!(
        (&response.profile.mode, &response.profile.ownership),
        (
            RuntimeConnectionProfileMode::LocalManaged,
            RuntimeOwnershipMode::OwnedChild
        ) | (
            RuntimeConnectionProfileMode::LocalShared,
            RuntimeOwnershipMode::External
        ) | (
            RuntimeConnectionProfileMode::Remote,
            RuntimeOwnershipMode::Remote
        )
    ) {
    } else {
        errors.push(ValidationErrorV02::new(
            "runtime profile ownership must match local-managed, local-shared, or remote mode",
        ));
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(ValidationReportV02::new(errors))
    }
}

fn runtime_profile_errors(profile: &RuntimeConnectionProfile) -> Vec<ValidationErrorV02> {
    let mut errors = Vec::new();
    if profile.endpoint.url.is_empty() {
        errors.push(ValidationErrorV02::new("endpoint url must not be empty"));
    }
    if profile
        .endpoint
        .canonical_url
        .as_ref()
        .is_some_and(String::is_empty)
    {
        errors.push(ValidationErrorV02::new(
            "endpoint canonicalUrl must not be empty",
        ));
    }
    if profile.endpoint.host.as_ref().is_some_and(String::is_empty) {
        errors.push(ValidationErrorV02::new("endpoint host must not be empty"));
    }
    if let Some(process) = &profile.process {
        if process.pid == Some(0) {
            errors.push(ValidationErrorV02::new("process pid must be at least 1"));
        }
        if process
            .executable_path
            .as_ref()
            .is_some_and(String::is_empty)
        {
            errors.push(ValidationErrorV02::new(
                "process executablePath must not be empty",
            ));
        }
        if process
            .working_directory
            .as_ref()
            .is_some_and(String::is_empty)
        {
            errors.push(ValidationErrorV02::new(
                "process workingDirectory must not be empty",
            ));
        }
        if process
            .owner_window_id
            .as_ref()
            .is_some_and(String::is_empty)
        {
            errors.push(ValidationErrorV02::new(
                "process ownerWindowId must not be empty",
            ));
        }
        if process.platform.as_ref().is_some_and(String::is_empty) {
            errors.push(ValidationErrorV02::new(
                "process platform must not be empty",
            ));
        }
        if process.arch.as_ref().is_some_and(String::is_empty) {
            errors.push(ValidationErrorV02::new("process arch must not be empty"));
        }
    }
    errors
}

pub fn validate_runtime_session_event(
    event: &RuntimeSessionEvent,
) -> Result<(), ValidationReportV02> {
    let mut errors = Vec::new();
    if event.schema != "skenion.runtime.session.event" {
        errors.push(ValidationErrorV02::new(format!(
            "expected schema skenion.runtime.session.event, found {}",
            event.schema
        )));
    }
    if event.schema_version != "0.1.0" {
        errors.push(ValidationErrorV02::new(format!(
            "expected schemaVersion 0.1.0, found {}",
            event.schema_version
        )));
    }
    if event.session_id.is_empty() {
        errors.push(ValidationErrorV02::new("sessionId must not be empty"));
    }
    if event.id.is_empty() {
        errors.push(ValidationErrorV02::new("event id must not be empty"));
    }
    if event.sequence == 0 {
        errors.push(ValidationErrorV02::new("sequence must be at least 1"));
    }
    if event.created_at.is_empty() {
        errors.push(ValidationErrorV02::new("createdAt must not be empty"));
    }
    errors.extend(runtime_session_snapshot_errors(&event.snapshot));
    errors.extend(runtime_history_errors(&event.history));
    if let Some(mutation) = &event.mutation {
        errors.extend(runtime_history_entry_errors(mutation, "mutation"));
    }
    if event.replay.cursor.is_empty() {
        errors.push(ValidationErrorV02::new("replay cursor must not be empty"));
    }
    if event
        .replay
        .previous_cursor
        .as_ref()
        .is_some_and(String::is_empty)
    {
        errors.push(ValidationErrorV02::new(
            "replay previousCursor must not be empty",
        ));
    }
    if let Some(gap) = &event.replay.gap {
        if gap.expected_sequence == 0 || gap.actual_sequence == 0 {
            errors.push(ValidationErrorV02::new(
                "replay gap sequences must be at least 1",
            ));
        }
        if gap.expected_sequence >= gap.actual_sequence {
            errors.push(ValidationErrorV02::new(
                "replay gap expectedSequence must be less than actualSequence",
            ));
        }
    }
    if event.session_revision != event.snapshot.session_revision {
        errors.push(ValidationErrorV02::new(
            "event sessionRevision must match snapshot.sessionRevision",
        ));
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(ValidationReportV02::new(errors))
    }
}

fn runtime_session_snapshot_errors(snapshot: &RuntimeSessionSnapshot) -> Vec<ValidationErrorV02> {
    let mut errors = Vec::new();
    if snapshot.diagnostics.iter().any(|diagnostic| {
        diagnostic
            .get("message")
            .and_then(serde_json::Value::as_str)
            .is_none_or(str::is_empty)
    }) {
        errors.push(ValidationErrorV02::new(
            "snapshot diagnostics must include non-empty message",
        ));
    }
    if snapshot.plan.as_ref().is_some_and(|plan| !plan.is_object()) {
        errors.push(ValidationErrorV02::new(
            "snapshot plan must be an object or null",
        ));
    }
    errors
}

fn runtime_history_errors(history: &RuntimeHistory) -> Vec<ValidationErrorV02> {
    let mut errors = Vec::new();
    if history.schema != "skenion.runtime.history" {
        errors.push(ValidationErrorV02::new(format!(
            "expected history schema skenion.runtime.history, found {}",
            history.schema
        )));
    }
    if history.schema_version != "0.1.0" {
        errors.push(ValidationErrorV02::new(format!(
            "expected history schemaVersion 0.1.0, found {}",
            history.schema_version
        )));
    }
    for entry in &history.entries {
        errors.extend(runtime_history_entry_errors(entry, "history entry"));
    }
    errors
}

fn runtime_history_entry_errors(
    entry: &RuntimeHistoryEntry,
    label: &str,
) -> Vec<ValidationErrorV02> {
    let mut errors = Vec::new();
    if entry.id.is_empty() {
        errors.push(ValidationErrorV02::new(format!(
            "{label} id must not be empty"
        )));
    }
    if entry.sequence == 0 {
        errors.push(ValidationErrorV02::new(format!(
            "{label} sequence must be at least 1"
        )));
    }
    if entry.created_at.is_empty() {
        errors.push(ValidationErrorV02::new(format!(
            "{label} createdAt must not be empty"
        )));
    }
    if entry
        .subject_event_id
        .as_ref()
        .is_some_and(String::is_empty)
    {
        errors.push(ValidationErrorV02::new(format!(
            "{label} subjectEventId must not be empty"
        )));
    }
    if entry.client_id.as_ref().is_some_and(String::is_empty) {
        errors.push(ValidationErrorV02::new(format!(
            "{label} clientId must not be empty"
        )));
    }
    errors.extend(runtime_mutation_request_errors(
        &entry.mutation,
        &format!("{label} mutation"),
    ));
    errors.extend(runtime_mutation_request_errors(
        &entry.inverse_mutation,
        &format!("{label} inverseMutation"),
    ));
    errors
}

fn runtime_mutation_request_errors(
    mutation: &RuntimeMutationRequest,
    label: &str,
) -> Vec<ValidationErrorV02> {
    let mut errors = Vec::new();
    if let Some(graph_patch) = &mutation.graph_patch {
        errors.extend(runtime_graph_patch_errors(graph_patch, label));
    }
    if let Some(view_patch) = &mutation.view_patch {
        for operation in &view_patch.ops {
            match operation {
                RuntimeViewPatchOperation::SetNodeView { node_id, .. }
                | RuntimeViewPatchOperation::MoveNodeView { node_id, .. } => {
                    if node_id.is_empty() {
                        errors.push(ValidationErrorV02::new(format!(
                            "{label} viewPatch operation nodeId must not be empty"
                        )));
                    }
                }
            }
        }
    }
    if mutation.client_id.as_ref().is_some_and(String::is_empty) {
        errors.push(ValidationErrorV02::new(format!(
            "{label} clientId must not be empty"
        )));
    }
    errors
}

#[allow(clippy::collapsible_match)]
fn runtime_graph_patch_errors(patch: &GraphPatchV01, label: &str) -> Vec<ValidationErrorV02> {
    let mut errors = Vec::new();
    if patch.schema != "skenion.graph.patch" {
        errors.push(ValidationErrorV02::new(format!(
            "{label} graphPatch schema must be skenion.graph.patch"
        )));
    }
    if patch.schema_version != "0.1.0" {
        errors.push(ValidationErrorV02::new(format!(
            "{label} graphPatch schemaVersion must be 0.1.0"
        )));
    }
    if patch.id.is_empty() {
        errors.push(ValidationErrorV02::new(format!(
            "{label} graphPatch id must not be empty"
        )));
    }
    if patch.base_revision.is_empty() {
        errors.push(ValidationErrorV02::new(format!(
            "{label} graphPatch baseRevision must not be empty"
        )));
    }
    if patch.client_id.as_ref().is_some_and(String::is_empty) {
        errors.push(ValidationErrorV02::new(format!(
            "{label} graphPatch clientId must not be empty"
        )));
    }
    if patch.created_at.as_ref().is_some_and(String::is_empty) {
        errors.push(ValidationErrorV02::new(format!(
            "{label} graphPatch createdAt must not be empty"
        )));
    }
    for operation in &patch.ops {
        match operation {
            GraphPatchOperationV01::AddNode { node } => {
                errors.extend(runtime_graph_patch_node_errors(node, label));
            }
            GraphPatchOperationV01::RemoveNode { node_id } => {
                if node_id.is_empty() {
                    errors.push(ValidationErrorV02::new(format!(
                        "{label} graphPatch operation nodeId must not be empty"
                    )));
                }
            }
            GraphPatchOperationV01::ReplaceNode { node_id, node, .. } => {
                if node_id.is_empty() {
                    errors.push(ValidationErrorV02::new(format!(
                        "{label} graphPatch operation nodeId must not be empty"
                    )));
                }
                errors.extend(runtime_graph_patch_node_errors(node, label));
            }
            GraphPatchOperationV01::SetNodeParams { node_id, .. } => {
                if node_id.is_empty() {
                    errors.push(ValidationErrorV02::new(format!(
                        "{label} graphPatch operation nodeId must not be empty"
                    )));
                }
            }
            GraphPatchOperationV01::SetNodeParam { node_id, key, .. } => {
                if node_id.is_empty() {
                    errors.push(ValidationErrorV02::new(format!(
                        "{label} graphPatch operation nodeId must not be empty"
                    )));
                }
                if key.is_empty() {
                    errors.push(ValidationErrorV02::new(format!(
                        "{label} graphPatch operation key must not be empty"
                    )));
                }
            }
            GraphPatchOperationV01::ReplaceNodeInterface { node_id, .. } => {
                if node_id.is_empty() {
                    errors.push(ValidationErrorV02::new(format!(
                        "{label} graphPatch operation nodeId must not be empty"
                    )));
                }
            }
            GraphPatchOperationV01::AddEdge { edge }
            | GraphPatchOperationV01::RemoveEdge { edge } => {
                errors.extend(runtime_graph_patch_edge_errors(edge, label));
            }
        }
    }
    errors
}

fn runtime_graph_patch_node_errors(node: &GraphNodeV01, label: &str) -> Vec<ValidationErrorV02> {
    let mut errors = Vec::new();
    if node.id.is_empty() {
        errors.push(ValidationErrorV02::new(format!(
            "{label} graphPatch node id must not be empty"
        )));
    }
    if node.kind.is_empty() {
        errors.push(ValidationErrorV02::new(format!(
            "{label} graphPatch node kind must not be empty"
        )));
    }
    if node.kind_version.is_empty() {
        errors.push(ValidationErrorV02::new(format!(
            "{label} graphPatch node kindVersion must not be empty"
        )));
    }
    for port in &node.ports {
        errors.extend(runtime_graph_patch_port_errors(port, label));
    }
    errors
}

fn runtime_graph_patch_port_errors(port: &PortV01, label: &str) -> Vec<ValidationErrorV02> {
    let mut errors = Vec::new();
    if port.id.is_empty() {
        errors.push(ValidationErrorV02::new(format!(
            "{label} graphPatch port id must not be empty"
        )));
    }
    errors.extend(runtime_graph_patch_data_type_errors(&port.data_type, label));
    errors
}

fn runtime_graph_patch_data_type_errors(
    data_type: &DataTypeV01,
    label: &str,
) -> Vec<ValidationErrorV02> {
    let mut errors = Vec::new();
    if data_type.data_kind.is_empty() {
        errors.push(ValidationErrorV02::new(format!(
            "{label} graphPatch port dataKind must not be empty"
        )));
    }
    let invalid_range_step = match &data_type.range {
        Some(range) => matches!(range.step, Some(step) if step <= 0.0),
        None => false,
    };
    if invalid_range_step {
        errors.push(ValidationErrorV02::new(format!(
            "{label} graphPatch port range step must be greater than 0"
        )));
    }
    let invalid_shape = match &data_type.shape {
        Some(shape) => {
            let mut has_invalid_shape_entry = false;
            for entry in shape {
                if *entry == 0 {
                    has_invalid_shape_entry = true;
                }
            }
            has_invalid_shape_entry
        }
        None => false,
    };
    if invalid_shape {
        errors.push(ValidationErrorV02::new(format!(
            "{label} graphPatch port shape entries must be at least 1"
        )));
    }
    if data_type.channels == Some(0) {
        errors.push(ValidationErrorV02::new(format!(
            "{label} graphPatch port channels must be at least 1"
        )));
    }
    if matches!(data_type.sample_rate, Some(sample_rate) if sample_rate <= 0.0) {
        errors.push(ValidationErrorV02::new(format!(
            "{label} graphPatch port sampleRate must be greater than 0"
        )));
    }
    if matches!(data_type.frame_rate, Some(frame_rate) if frame_rate <= 0.0) {
        errors.push(ValidationErrorV02::new(format!(
            "{label} graphPatch port frameRate must be greater than 0"
        )));
    }
    let invalid_format = match &data_type.format {
        Some(StringOrStringsV01::One(value)) => value.is_empty(),
        Some(StringOrStringsV01::Many(values)) => {
            let mut has_empty_format = false;
            for value in values {
                if value.is_empty() {
                    has_empty_format = true;
                }
            }
            has_empty_format
        }
        None => false,
    };
    if invalid_format {
        errors.push(ValidationErrorV02::new(format!(
            "{label} graphPatch port format must not be empty"
        )));
    }
    let invalid_alpha_policy = match &data_type.alpha_policy {
        Some(policy) => !matches!(policy.as_str(), "error" | "white" | "black" | "luminance"),
        None => false,
    };
    if invalid_alpha_policy {
        errors.push(ValidationErrorV02::new(format!(
            "{label} graphPatch port alphaPolicy must be supported"
        )));
    }
    let invalid_values = match &data_type.values {
        Some(values) => {
            let mut has_invalid_value = false;
            for value in values {
                if !(value.is_string() || value.is_number() || value.is_boolean()) {
                    has_invalid_value = true;
                }
            }
            has_invalid_value
        }
        None => false,
    };
    if invalid_values {
        errors.push(ValidationErrorV02::new(format!(
            "{label} graphPatch port values must be scalar strings, numbers, or booleans"
        )));
    }
    errors
}

fn runtime_graph_patch_edge_errors(edge: &EdgeV01, label: &str) -> Vec<ValidationErrorV02> {
    let mut errors = Vec::new();
    if edge.from.node.is_empty() || edge.from.port.is_empty() {
        errors.push(ValidationErrorV02::new(format!(
            "{label} graphPatch edge source must not be empty"
        )));
    }
    if edge.to.node.is_empty() || edge.to.port.is_empty() {
        errors.push(ValidationErrorV02::new(format!(
            "{label} graphPatch edge target must not be empty"
        )));
    }
    errors
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
    use crate::v0_2::{
        EdgeEndpointV02, FeedbackPolicyV02, GraphFragmentV02, GraphNodeV02, GraphTargetRef,
        IdConflictPolicy, IdRemapResult, PasteGraphFragmentOptions, PasteGraphFragmentRequest,
        PasteGraphFragmentResponse, PatchPath, RuntimeEventReplayGap, RuntimeEventReplayGapReason,
        RuntimeHistoryEntry, RuntimeOperationDiagnostic, RuntimeOperationEnvelope,
        RuntimeSessionEvent, RuntimeSessionInfoResponse,
    };
    use serde_json::json;
    use std::collections::BTreeMap;

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

    fn base_fragment() -> GraphFragmentV02 {
        let graph = base_graph();
        GraphFragmentV02 {
            schema: "skenion.graph.fragment".to_owned(),
            schema_version: "0.2.0".to_owned(),
            id: Some("fragment".to_owned()),
            nodes: graph.nodes,
            edges: graph.edges,
            view: None,
            omitted_edges: None,
            metadata: None,
        }
    }

    fn root_target() -> GraphTargetRef {
        GraphTargetRef {
            path: PatchPath::Root,
            base_revision: "1".to_owned(),
            target_revision: None,
        }
    }

    fn paste_request(fragment: GraphFragmentV02) -> PasteGraphFragmentRequest {
        PasteGraphFragmentRequest {
            target: root_target(),
            fragment,
            placement: None,
            options: None,
        }
    }

    fn runtime_operation(fragment: GraphFragmentV02) -> RuntimeOperationEnvelope {
        RuntimeOperationEnvelope {
            schema: "skenion.runtime.operation".to_owned(),
            schema_version: "0.1.0".to_owned(),
            id: "operation".to_owned(),
            kind: "pasteGraphFragment".to_owned(),
            request: paste_request(fragment),
            attribution: None,
            correlation_id: None,
            created_at: None,
        }
    }

    fn runtime_session_info() -> RuntimeSessionInfoResponse {
        serde_json::from_value(json!({
            "schema": "skenion.runtime.session.info",
            "schemaVersion": "0.1.0",
            "ok": true,
            "sessionId": "session-a",
            "lifecycle": "ready",
            "snapshot": { "sessionRevision": 1, "viewRevision": 1, "controlRevision": 1, "project": null, "diagnostics": [], "plan": null },
            "profile": {
                "mode": "local-managed",
                "ownership": "owned-child",
                "endpoint": { "url": "http://127.0.0.1:49231", "protocol": "http" },
                "process": { "ownedByHost": true }
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
        }))
        .expect("session info should parse")
    }

    fn runtime_session_event() -> RuntimeSessionEvent {
        serde_json::from_value(json!({
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
            "createdAt": "2026-06-22T00:00:00.000Z"
        }))
        .expect("session event should parse")
    }

    fn runtime_session_mutation_event(
        mutation: serde_json::Value,
        inverse_mutation: serde_json::Value,
    ) -> serde_json::Value {
        json!({
            "schema": "skenion.runtime.session.event",
            "schemaVersion": "0.1.0",
            "id": "event-mutate",
            "sessionId": "session-a",
            "sequence": 2,
            "sessionRevision": 2,
            "kind": "mutate",
            "snapshot": { "sessionRevision": 2, "viewRevision": 2, "controlRevision": 1, "project": null, "diagnostics": [], "plan": null },
            "history": {
                "schema": "skenion.runtime.history",
                "schemaVersion": "0.1.0",
                "entries": [
                    {
                        "id": "history-2",
                        "sequence": 2,
                        "kind": "apply",
                        "mutation": mutation,
                        "inverseMutation": inverse_mutation,
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
                "cursor": "2",
                "previousCursor": "1",
                "replayed": false,
                "gap": null,
                "overflow": false
            },
            "diagnostics": [],
            "createdAt": "2026-06-22T00:00:02.000Z"
        })
    }

    fn runtime_graph_patch_mutation(extra_operation_key: bool) -> serde_json::Value {
        let mut operation = json!({
            "op": "setNodeParam",
            "nodeId": "value_1",
            "key": "value",
            "value": 0.5
        });
        if extra_operation_key {
            operation["unexpected"] = json!(true);
        }
        json!({
            "graphPatch": {
                "schema": "skenion.graph.patch",
                "schemaVersion": "0.1.0",
                "id": "patch-runtime",
                "baseRevision": "1",
                "ops": [operation]
            }
        })
    }

    fn runtime_view_patch_mutation(extra_operation_key: bool) -> serde_json::Value {
        let mut operation = json!({
            "op": "setNodeView",
            "nodeId": "value_1",
            "view": { "x": 0, "y": 0 }
        });
        if extra_operation_key {
            operation["unexpected"] = json!(true);
        }
        json!({
            "viewPatch": {
                "baseViewRevision": 1,
                "ops": [operation]
            }
        })
    }

    #[test]
    fn rejects_extra_nested_runtime_patch_operation_keys_at_parse_boundary() {
        serde_json::from_value::<RuntimeSessionEvent>(runtime_session_mutation_event(
            json!({}),
            json!({}),
        ))
        .expect("empty mutation requests should parse");

        let graph_null = runtime_session_mutation_event(
            json!({ "graphPatch": null }),
            runtime_view_patch_mutation(false),
        );
        let graph_null_error = serde_json::from_value::<RuntimeSessionEvent>(graph_null)
            .expect_err("explicit null graphPatch should fail");
        assert!(
            graph_null_error
                .to_string()
                .contains("graphPatch must be an object")
        );

        let graph_without_ops = runtime_session_mutation_event(
            json!({
                "graphPatch": {
                    "schema": "skenion.graph.patch",
                    "schemaVersion": "0.1.0",
                    "id": "patch-without-ops",
                    "baseRevision": "1"
                }
            }),
            runtime_view_patch_mutation(false),
        );
        let graph_without_ops_error =
            serde_json::from_value::<RuntimeSessionEvent>(graph_without_ops)
                .expect_err("graphPatch without ops should fail after strict key scan");
        assert!(
            graph_without_ops_error
                .to_string()
                .contains("missing field `ops`")
        );

        let graph_non_object_op = runtime_session_mutation_event(
            json!({
                "graphPatch": {
                    "schema": "skenion.graph.patch",
                    "schemaVersion": "0.1.0",
                    "id": "patch-non-object-op",
                    "baseRevision": "1",
                    "ops": [null]
                }
            }),
            runtime_view_patch_mutation(false),
        );
        serde_json::from_value::<RuntimeSessionEvent>(graph_non_object_op)
            .expect_err("non-object graphPatch operation should fail");

        let graph_missing_op = runtime_session_mutation_event(
            json!({
                "graphPatch": {
                    "schema": "skenion.graph.patch",
                    "schemaVersion": "0.1.0",
                    "id": "patch-missing-op",
                    "baseRevision": "1",
                    "ops": [{ "nodeId": "value_1" }]
                }
            }),
            runtime_view_patch_mutation(false),
        );
        serde_json::from_value::<RuntimeSessionEvent>(graph_missing_op)
            .expect_err("graphPatch operation without op discriminator should fail");

        let graph_unknown_op = runtime_session_mutation_event(
            json!({
                "graphPatch": {
                    "schema": "skenion.graph.patch",
                    "schemaVersion": "0.1.0",
                    "id": "patch-unknown-op",
                    "baseRevision": "1",
                    "ops": [{ "op": "unsupported" }]
                }
            }),
            runtime_view_patch_mutation(false),
        );
        serde_json::from_value::<RuntimeSessionEvent>(graph_unknown_op)
            .expect_err("unsupported graphPatch operation should fail");

        let graph_extra = runtime_session_mutation_event(
            runtime_graph_patch_mutation(true),
            runtime_view_patch_mutation(false),
        );
        let graph_error = serde_json::from_value::<RuntimeSessionEvent>(graph_extra)
            .expect_err("extra nested graphPatch operation key should fail");
        assert!(
            graph_error
                .to_string()
                .contains("graphPatch ops[0] contains unknown field unexpected")
        );

        let view_extra = runtime_session_mutation_event(
            runtime_graph_patch_mutation(false),
            runtime_view_patch_mutation(true),
        );
        let view_error = serde_json::from_value::<RuntimeSessionEvent>(view_extra)
            .expect_err("extra nested viewPatch operation key should fail");
        assert!(
            view_error
                .to_string()
                .contains("unknown field `unexpected`")
        );
    }

    #[test]
    fn validates_basic_graph_and_serializes_optional_fields_as_absent() {
        let mut graph = base_graph();
        graph.nodes[0].port_groups = Some(vec![super::super::PortGroupSpecV02 {
            id: "outputs".to_owned(),
            direction: PortDirectionV02::Output,
            port_type: "value.number".to_owned(),
            min_ports: 1,
            label: Some("Outputs".to_owned()),
            rate: None,
            max_ports: Some(2),
            ordered: Some(true),
            port_id_pattern: Some("out_{index}".to_owned()),
            create_label: Some("Add output".to_owned()),
            default_port_spec: None,
        }]);
        let result = validate_graph_document_v02(&graph).expect("graph should validate");
        assert!(result.ok);
        assert!(result.diagnostics.is_empty());

        let serialized = serde_json::to_string(&graph).expect("graph should serialize");
        assert!(!serialized.contains("null"));
    }

    #[test]
    fn validates_graph_fragment_policy_and_semantic_branches() {
        let fragment = base_fragment();
        let valid = validate_graph_fragment_v02(&fragment).expect("fragment should validate");
        assert!(valid.ok);

        let mut schema_invalid = fragment.clone();
        schema_invalid.schema = "wrong".to_owned();
        schema_invalid.schema_version = "9.9.9".to_owned();
        let schema_report =
            validate_graph_fragment_v02(&schema_invalid).expect_err("schema should fail");
        assert!(schema_report.to_string().contains("skenion.graph.fragment"));
        assert!(schema_report.to_string().contains("0.2.0"));

        let mut duplicate_node = fragment.clone();
        duplicate_node.nodes.push(duplicate_node.nodes[0].clone());
        assert!(
            validate_graph_fragment_v02(&duplicate_node)
                .expect_err("duplicate node should fail")
                .to_string()
                .contains("duplicate-node-id")
        );

        let mut duplicate_port = fragment.clone();
        let cloned_port = duplicate_port.nodes[0].ports[0].clone();
        duplicate_port.nodes[0].ports.push(cloned_port);
        assert!(
            validate_graph_fragment_v02(&duplicate_port)
                .expect_err("duplicate port should fail")
                .to_string()
                .contains("duplicate-port-id")
        );

        let mut duplicate_edge = fragment.clone();
        duplicate_edge.edges.push(duplicate_edge.edges[0].clone());
        assert!(
            validate_graph_fragment_v02(&duplicate_edge)
                .expect_err("duplicate edge should fail")
                .to_string()
                .contains("duplicate-edge-id")
        );

        let mut outside = fragment.clone();
        outside.edges[0].target.node_id = "outside".to_owned();
        assert!(
            validate_graph_fragment_v02(&outside)
                .expect_err("outside endpoint should fail")
                .to_string()
                .contains("fragment-edge-outside-selection")
        );
        let omitted =
            analyze_graph_fragment_v02(&outside, GraphFragmentOutsideEndpointPolicyV02::Omit);
        assert!(omitted.ok);
        assert_eq!(omitted.omitted_edge_ids, vec!["edge_source_target"]);

        let mut missing_source = fragment.clone();
        missing_source.edges[0].source.port_id = "missing".to_owned();
        assert!(
            validate_graph_fragment_v02(&missing_source)
                .expect_err("missing source should fail")
                .to_string()
                .contains("missing-source-port")
        );

        let mut missing_target = fragment.clone();
        missing_target.edges[0].target.port_id = "missing".to_owned();
        assert!(
            validate_graph_fragment_v02(&missing_target)
                .expect_err("missing target should fail")
                .to_string()
                .contains("missing-target-port")
        );

        let mut invalid_source_direction = fragment.clone();
        invalid_source_direction.nodes[0].ports[0].direction = PortDirectionV02::Input;
        assert!(
            validate_graph_fragment_v02(&invalid_source_direction)
                .expect_err("input source should fail")
                .to_string()
                .contains("invalid-source-direction")
        );

        let mut invalid_target_direction = fragment.clone();
        invalid_target_direction.nodes[1].ports[0].direction = PortDirectionV02::Output;
        assert!(
            validate_graph_fragment_v02(&invalid_target_direction)
                .expect_err("output target should fail")
                .to_string()
                .contains("invalid-target-direction")
        );

        let mut incompatible = fragment;
        incompatible.nodes[1].ports[0].port_type = "string".to_owned();
        assert!(
            validate_graph_fragment_v02(&incompatible)
                .expect_err("incompatible edge should fail")
                .to_string()
                .contains("incompatible-type")
        );
    }

    #[test]
    fn validates_runtime_operation_and_paste_response_branches() {
        let fragment = base_fragment();
        let operation = runtime_operation(fragment.clone());
        validate_runtime_operation_envelope(&operation).expect("operation should validate");
        validate_paste_graph_fragment_request(&operation.request)
            .expect("paste request should validate");

        let mut outside_operation = runtime_operation(fragment);
        outside_operation.request.fragment.edges[0].target.node_id = "outside".to_owned();
        assert!(
            validate_runtime_operation_envelope(&outside_operation)
                .expect_err("outside endpoint should fail by default")
                .to_string()
                .contains("fragment-edge-outside-selection")
        );
        outside_operation.request.options = Some(PasteGraphFragmentOptions {
            outside_endpoint_policy: Some(GraphFragmentOutsideEndpointPolicyV02::Omit),
            id_conflict_policy: Some(IdConflictPolicy::Remap),
            preserve_relative_positions: Some(true),
        });
        let omit_result = validate_runtime_operation_envelope(&outside_operation);
        assert!(omit_result.is_ok());

        let mut invalid_operation = outside_operation;
        invalid_operation.schema = "wrong".to_owned();
        invalid_operation.schema_version = "9.9.9".to_owned();
        invalid_operation.kind = "loadProject".to_owned();
        let invalid_report = validate_runtime_operation_envelope(&invalid_operation)
            .expect_err("invalid operation should fail");
        let invalid_text = invalid_report.to_string();
        assert!(invalid_text.contains("skenion.runtime.operation"));
        assert!(invalid_text.contains("0.1.0"));
        assert!(invalid_text.contains("unsupported runtime operation kind"));

        let response = PasteGraphFragmentResponse {
            schema: "skenion.runtime.paste-graph-fragment.response".to_owned(),
            schema_version: "0.1.0".to_owned(),
            ok: true,
            applied: true,
            conflict: false,
            target: root_target(),
            revision_before: "1".to_owned(),
            revision_after: Some("2".to_owned()),
            history_entry_id: Some("history".to_owned()),
            id_remap: IdRemapResult {
                node_id_map: BTreeMap::from([("source".to_owned(), "source_2".to_owned())]),
                edge_id_map: BTreeMap::from([(
                    "edge_source_target".to_owned(),
                    "edge_source_target_2".to_owned(),
                )]),
                omitted_edge_ids: Vec::new(),
            },
            diagnostics: vec![RuntimeOperationDiagnostic {
                severity: "info".to_owned(),
                code: "operation-rebased".to_owned(),
                message: "rebased".to_owned(),
                path: None,
                target: None,
                expected_revision: Some("1".to_owned()),
                actual_revision: Some("1".to_owned()),
                duplicates: None,
                nodes: None,
                edges: None,
            }],
        };
        validate_paste_graph_fragment_response(&response).expect("response should validate");

        let mut invalid_response = response;
        invalid_response.schema = "wrong".to_owned();
        invalid_response.schema_version = "9.9.9".to_owned();
        invalid_response.ok = false;
        invalid_response.revision_after = None;
        let response_report = validate_paste_graph_fragment_response(&invalid_response)
            .expect_err("invalid response should fail");
        let response_text = response_report.to_string();
        assert!(response_text.contains("paste-graph-fragment"));
        assert!(response_text.contains("0.1.0"));
        assert!(response_text.contains("cannot be applied"));
        assert!(response_text.contains("revisionAfter"));
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
            id: "edge_missing_source_node".to_owned(),
            source: EdgeEndpointV02 {
                node_id: "missing".to_owned(),
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

        let mut control_cycle = graph.clone();
        for node in &mut control_cycle.nodes {
            for port in &mut node.ports {
                port.port_type = "control.number".to_owned();
            }
        }
        let control_ambiguous =
            validate_graph_document_v02(&control_cycle).expect_err("control cycle should fail");
        assert!(
            control_ambiguous
                .to_string()
                .contains("ambiguous-algebraic-loop")
        );

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
    fn validates_runtime_session_profile_and_replay_branches() {
        let info = runtime_session_info();
        validate_runtime_session_info_response(&info).expect("session info should validate");

        let mut invalid_info = info.clone();
        invalid_info.schema = "wrong".to_owned();
        invalid_info.schema_version = "9.9.9".to_owned();
        invalid_info.session_id.clear();
        invalid_info.capabilities.auth_policy = "trusted-local".to_owned();
        invalid_info.event_replay.cursor_kind = "timestamp".to_owned();
        invalid_info.event_replay.current_cursor.clear();
        invalid_info.event_replay.earliest_sequence = 0;
        invalid_info.profile.endpoint.url.clear();
        invalid_info.profile.endpoint.canonical_url = Some(String::new());
        invalid_info.profile.endpoint.host = Some(String::new());
        if let Some(process) = &mut invalid_info.profile.process {
            process.pid = Some(0);
            process.executable_path = Some(String::new());
            process.working_directory = Some(String::new());
            process.owner_window_id = Some(String::new());
            process.platform = Some(String::new());
            process.arch = Some(String::new());
        }
        invalid_info.profile.ownership = RuntimeOwnershipMode::Remote;
        let info_error = validate_runtime_session_info_response(&invalid_info)
            .expect_err("invalid session info should fail")
            .to_string();
        assert!(info_error.contains("skenion.runtime.session.info"));
        assert!(info_error.contains("0.1.0"));
        assert!(info_error.contains("sessionId must not be empty"));
        assert!(info_error.contains("authPolicy must be deferred"));
        assert!(info_error.contains("cursorKind must be sequence"));
        assert!(info_error.contains("currentCursor must not be empty"));
        assert!(info_error.contains("earliestSequence must be at least 1"));
        assert!(info_error.contains("endpoint url must not be empty"));
        assert!(info_error.contains("endpoint canonicalUrl must not be empty"));
        assert!(info_error.contains("endpoint host must not be empty"));
        assert!(info_error.contains("process pid must be at least 1"));
        assert!(info_error.contains("process executablePath must not be empty"));
        assert!(info_error.contains("process workingDirectory must not be empty"));
        assert!(info_error.contains("process ownerWindowId must not be empty"));
        assert!(info_error.contains("process platform must not be empty"));
        assert!(info_error.contains("process arch must not be empty"));
        assert!(info_error.contains("profile ownership must match"));

        let shared = serde_json::from_value(json!({
            "schema": "skenion.runtime.session.info",
            "schemaVersion": "0.1.0",
            "ok": true,
            "sessionId": "session-b",
            "lifecycle": "ready",
            "snapshot": { "sessionRevision": 1, "viewRevision": 1, "controlRevision": 1, "project": null, "diagnostics": [], "plan": null },
            "profile": {
                "mode": "local-shared",
                "ownership": "external",
                "endpoint": { "url": "http://127.0.0.1:49232", "protocol": "http" },
                "process": { "ownedByHost": false }
            },
            "capabilities": {
                "sessionAddressing": true,
                "defaultSessionAlias": true,
                "eventReplay": true,
                "multiWindow": true,
                "profiles": ["local-shared"],
                "authPolicy": "deferred"
            },
            "eventReplay": {
                "cursorKind": "sequence",
                "currentCursor": "1",
                "earliestSequence": 1,
                "latestSequence": 1,
                "replayLimit": null
            },
            "diagnostics": []
        }))
        .expect("shared info should parse");
        validate_runtime_session_info_response(&shared).expect("shared info should validate");

        let remote = serde_json::from_value(json!({
            "schema": "skenion.runtime.session.info",
            "schemaVersion": "0.1.0",
            "ok": true,
            "sessionId": "session-c",
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
                "defaultSessionAlias": false,
                "eventReplay": true,
                "multiWindow": true,
                "profiles": ["remote"],
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
        }))
        .expect("remote info should parse");
        validate_runtime_session_info_response(&remote).expect("remote info should validate");

        let event = runtime_session_event();
        validate_runtime_session_event(&event).expect("session event should validate");

        let mut invalid_event = event.clone();
        invalid_event.schema = "wrong".to_owned();
        invalid_event.schema_version = "9.9.9".to_owned();
        invalid_event.id.clear();
        invalid_event.session_id.clear();
        invalid_event.sequence = 0;
        invalid_event.created_at.clear();
        invalid_event.session_revision = 2;
        invalid_event.snapshot.diagnostics.push(json!({
            "severity": "warning"
        }));
        invalid_event.snapshot.plan = Some(json!("opaque-plan"));
        invalid_event.history.schema = "wrong".to_owned();
        invalid_event.history.schema_version = "9.9.9".to_owned();
        let invalid_graph_patch = json!({
            "schema": "wrong",
            "schemaVersion": "9.9.9",
            "id": "",
            "baseRevision": "",
            "clientId": "",
            "createdAt": "",
            "ops": [
                {
                    "op": "addNode",
                    "node": {
                        "id": "",
                        "kind": "",
                        "kindVersion": "",
                        "params": {},
                        "ports": [
                            {
                                "id": "",
                                "direction": "input",
                                "type": {
                                    "flow": "value",
                                    "dataKind": "",
                                    "range": { "step": 0 },
                                    "shape": [0],
                                    "channels": 0,
                                    "sampleRate": 0,
                                    "format": "",
                                    "frameRate": 0,
                                    "alphaPolicy": "unsupported",
                                    "values": [{}]
                                }
                            },
                            {
                                "id": "format-array",
                                "direction": "input",
                                "type": {
                                    "flow": "value",
                                    "dataKind": "number.float",
                                    "format": [""]
                                }
                            },
                            {
                                "id": "format-absent",
                                "direction": "input",
                                "type": {
                                    "flow": "value",
                                    "dataKind": "number.float"
                                }
                            }
                        ]
                    }
                },
                { "op": "removeNode", "nodeId": "" },
                { "op": "setNodeParams", "nodeId": "", "params": {} },
                {
                    "op": "replaceNode",
                    "nodeId": "",
                    "node": {
                        "id": "",
                        "kind": "",
                        "kindVersion": "",
                        "params": {},
                        "ports": []
                    },
                    "edgePolicy": "removeInvalidEdges"
                },
                { "op": "setNodeParam", "nodeId": "", "key": "", "value": null },
                {
                    "op": "replaceNodeInterface",
                    "nodeId": "",
                    "ports": [],
                    "edgePolicy": "removeInvalidEdges"
                },
                {
                    "op": "addEdge",
                    "edge": {
                        "from": { "node": "node-a", "port": "out" },
                        "to": { "node": "node-b", "port": "in" }
                    }
                },
                {
                    "op": "removeEdge",
                    "edge": {
                        "from": { "node": "", "port": "" },
                        "to": { "node": "", "port": "" }
                    }
                }
            ]
        });
        let invalid_view_patch = json!({
            "baseViewRevision": 0,
            "ops": [
                { "op": "setNodeView", "nodeId": "", "view": { "x": 0, "y": 0 } },
                { "op": "moveNodeView", "nodeId": "", "from": { "x": 0, "y": 0 }, "to": { "x": 1, "y": 1 } }
            ]
        });
        let invalid_entry: RuntimeHistoryEntry = serde_json::from_value(json!({
            "id": "",
            "sequence": 0,
            "kind": "apply",
            "mutation": {
                "graphPatch": invalid_graph_patch,
                "clientId": ""
            },
            "inverseMutation": {
                "viewPatch": invalid_view_patch,
                "clientId": ""
            },
            "subjectEventId": "",
            "clientId": "",
            "createdAt": ""
        }))
        .expect("invalid history entry should parse structurally");
        invalid_event.history.entries.push(invalid_entry.clone());
        invalid_event.mutation = Some(invalid_entry);
        invalid_event.replay.cursor.clear();
        invalid_event.replay.previous_cursor = Some(String::new());
        invalid_event.replay.gap = Some(RuntimeEventReplayGap {
            expected_sequence: 0,
            actual_sequence: 0,
            reason: RuntimeEventReplayGapReason::Unknown,
        });
        let event_error = validate_runtime_session_event(&invalid_event)
            .expect_err("invalid session event should fail")
            .to_string();
        assert!(event_error.contains("skenion.runtime.session.event"));
        assert!(event_error.contains("0.1.0"));
        assert!(event_error.contains("event id must not be empty"));
        assert!(event_error.contains("sessionId must not be empty"));
        assert!(event_error.contains("sequence must be at least 1"));
        assert!(event_error.contains("createdAt must not be empty"));
        assert!(event_error.contains("snapshot diagnostics must include non-empty message"));
        assert!(event_error.contains("snapshot plan must be an object or null"));
        assert!(event_error.contains("expected history schema skenion.runtime.history"));
        assert!(event_error.contains("expected history schemaVersion 0.1.0"));
        assert!(event_error.contains("history entry id must not be empty"));
        assert!(event_error.contains("history entry sequence must be at least 1"));
        assert!(event_error.contains("history entry createdAt must not be empty"));
        assert!(event_error.contains("history entry subjectEventId must not be empty"));
        assert!(event_error.contains("history entry clientId must not be empty"));
        assert!(event_error.contains("history entry mutation graphPatch schema must be"));
        assert!(event_error.contains("history entry mutation graphPatch schemaVersion must be"));
        assert!(event_error.contains("history entry mutation graphPatch id must not be empty"));
        assert!(
            event_error
                .contains("history entry mutation graphPatch baseRevision must not be empty")
        );
        assert!(
            event_error.contains("history entry mutation graphPatch clientId must not be empty")
        );
        assert!(
            event_error.contains("history entry mutation graphPatch createdAt must not be empty")
        );
        assert!(
            event_error
                .contains("history entry mutation graphPatch operation nodeId must not be empty")
        );
        assert!(
            event_error
                .contains("history entry mutation graphPatch operation key must not be empty")
        );
        assert!(
            event_error.contains("history entry mutation graphPatch node id must not be empty")
        );
        assert!(
            event_error.contains("history entry mutation graphPatch node kind must not be empty")
        );
        assert!(
            event_error
                .contains("history entry mutation graphPatch node kindVersion must not be empty")
        );
        assert!(
            event_error.contains("history entry mutation graphPatch port id must not be empty")
        );
        assert!(
            event_error
                .contains("history entry mutation graphPatch port dataKind must not be empty")
        );
        assert!(
            event_error.contains(
                "history entry mutation graphPatch port range step must be greater than 0"
            )
        );
        assert!(
            event_error.contains(
                "history entry mutation graphPatch port shape entries must be at least 1"
            )
        );
        assert!(
            event_error
                .contains("history entry mutation graphPatch port channels must be at least 1")
        );
        assert!(
            event_error.contains(
                "history entry mutation graphPatch port sampleRate must be greater than 0"
            )
        );
        assert!(
            event_error.contains(
                "history entry mutation graphPatch port frameRate must be greater than 0"
            )
        );
        assert!(
            event_error.contains("history entry mutation graphPatch port format must not be empty")
        );
        assert!(
            event_error
                .contains("history entry mutation graphPatch port alphaPolicy must be supported")
        );
        assert!(event_error.contains(
            "history entry mutation graphPatch port values must be scalar strings, numbers, or booleans"
        ));
        assert!(
            event_error.contains("history entry mutation graphPatch edge source must not be empty")
        );
        assert!(
            event_error.contains("history entry mutation graphPatch edge target must not be empty")
        );
        assert!(event_error.contains("history entry mutation clientId must not be empty"));
        assert!(event_error.contains(
            "history entry inverseMutation viewPatch operation nodeId must not be empty"
        ));
        assert!(event_error.contains("history entry inverseMutation clientId must not be empty"));
        assert!(event_error.contains("mutation id must not be empty"));
        assert!(event_error.contains("mutation mutation graphPatch schema must be"));
        assert!(
            event_error.contains("mutation mutation graphPatch operation nodeId must not be empty")
        );
        assert!(event_error.contains("mutation mutation clientId must not be empty"));
        assert!(
            event_error
                .contains("mutation inverseMutation viewPatch operation nodeId must not be empty")
        );
        assert!(event_error.contains("mutation inverseMutation clientId must not be empty"));
        assert!(event_error.contains("replay cursor must not be empty"));
        assert!(event_error.contains("replay previousCursor must not be empty"));
        assert!(event_error.contains("replay gap sequences must be at least 1"));
        assert!(event_error.contains("expectedSequence must be less than actualSequence"));
        assert!(event_error.contains("sessionRevision must match"));
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
