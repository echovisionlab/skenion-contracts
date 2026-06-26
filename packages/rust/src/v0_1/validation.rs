use std::{
    collections::{BTreeSet, HashMap, HashSet},
    error::Error,
    fmt,
};

use super::version::{
    derive_v0_compatibility_line, derive_v0_compatibility_range, satisfies_v0_compatibility_range,
};
use super::{
    CycleValidationV01, DataFlowV01, DataTypeV01, EdgeSpecV01, ExtensionKindV01,
    ExtensionManifestV01, FeedbackBoundaryV01, GraphCycleValidationV01, GraphDocumentV01,
    GraphFragmentDiagnosticV01, GraphFragmentOutsideEndpointPolicyV01, GraphFragmentV01,
    GraphFragmentValidationResultV01, GraphValidationDiagnosticV01, GraphValidationResultV01,
    MergePolicyV01, NodeDefinitionManifestV01, PackageCategoryV01, PackageDiagnosticSeverityV01,
    PackageDiscoveryResponseV01, PackageInstallPlanActionKindV01, PackageInstallPlanCheckStatusV01,
    PackageInstallPlanIntentV01, PackageInstallPlanRequestV01, PackageInstallPlanResponseV01,
    PackageInstallPlanTargetArchV01, PackageInstallPlanTargetOsV01, PackageInstallPlanTargetV01,
    PackageListingArtifactKindV01, PackageListingTargetSupportKindV01, PackageListingV01,
    PackageManifestV01, PackageRootDocumentV01, PackageTargetTripleV01, PasteGraphFragmentRequest,
    PasteGraphFragmentResponse, PatchDefinitionV01, PortDirectionV01, PortSpecV01,
    ProjectDocumentV01, ProjectObjectBindingDiagnosticCodeV01, ProjectObjectBindingStatusV01,
    ProjectObjectBindingTargetV01, RuntimeCollaborationAuthSubject,
    RuntimeCollaborationCausalMetadata, RuntimeCollaborationChange,
    RuntimeCollaborationEventEnvelope, RuntimeCollaborationEventKind,
    RuntimeCollaborationEventPayload, RuntimeCollaborationNackReason,
    RuntimeCollaborationOperationBatch, RuntimeCollaborationOperationBatchResult,
    RuntimeCollaborationOperationEnvelope, RuntimeCollaborationOperationPayload,
    RuntimeCollaborationOperationResult, RuntimeCollaborationOperationStatus,
    RuntimeCollaborationPresenceEnvelope, RuntimeCollaborationSelectionEnvelope,
    RuntimeConnectionProfile, RuntimeConnectionProfileMode, RuntimeDiagnostic, RuntimeHistory,
    RuntimeHistoryEntry, RuntimeMutationRequest, RuntimeOperationEnvelope, RuntimeOwnershipMode,
    RuntimeProjectRequestV01, RuntimeSessionEvent, RuntimeSessionInfoResponse,
    RuntimeSessionSnapshot, RuntimeViewPatchOperation, SKENION_PACKAGE_MANIFEST_FILE_NAME,
    ViewStateV01, derive_patch_contract_v01,
};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ValidationErrorV01 {
    pub message: String,
}

impl ValidationErrorV01 {
    pub(crate) fn new(message: impl Into<String>) -> Self {
        Self {
            message: message.into(),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ValidationReportV01 {
    errors: Vec<ValidationErrorV01>,
}

impl ValidationReportV01 {
    pub(crate) fn new(errors: Vec<ValidationErrorV01>) -> Self {
        Self { errors }
    }

    pub fn errors(&self) -> &[ValidationErrorV01] {
        &self.errors
    }
}

impl fmt::Display for ValidationReportV01 {
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

impl Error for ValidationReportV01 {}

fn duplicate_errors(values: Vec<&str>, label: &str) -> Vec<ValidationErrorV01> {
    let mut seen = HashSet::new();
    let mut errors = Vec::new();

    for value in values {
        if !seen.insert(value) {
            errors.push(ValidationErrorV01::new(format!(
                "duplicate {label}: {value}"
            )));
        }
    }

    errors
}

fn is_lower_digit_hyphen_segment(value: &str) -> bool {
    !value.is_empty()
        && !value.starts_with('-')
        && !value.ends_with('-')
        && value
            .chars()
            .all(|ch| ch.is_ascii_lowercase() || ch.is_ascii_digit() || ch == '-')
}

fn is_package_id_v01(value: &str) -> bool {
    let Some((publisher, package)) = value.split_once('/') else {
        return false;
    };
    !package.contains('/')
        && is_lower_digit_hyphen_segment(publisher)
        && is_lower_digit_hyphen_segment(package)
}

fn is_provided_id_v01(value: &str) -> bool {
    value.split('.').all(is_lower_digit_hyphen_segment)
}

fn is_package_tag_v01(value: &str) -> bool {
    is_lower_digit_hyphen_segment(value)
}

fn is_semver_numeric_part(value: &str) -> bool {
    !value.is_empty()
        && value.bytes().all(|byte| byte.is_ascii_digit())
        && (value.len() == 1 || !value.starts_with('0'))
}

fn is_semver_suffix(value: &str) -> bool {
    !value.is_empty()
        && value
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || byte == b'.' || byte == b'-')
}

fn is_package_semver_v01(value: &str) -> bool {
    let without_build = match value.split_once('+') {
        Some((without_build, build)) if is_semver_suffix(build) => without_build,
        Some(_) => return false,
        None => value,
    };

    let core = match without_build.split_once('-') {
        Some((core, prerelease)) if is_semver_suffix(prerelease) => core,
        Some(_) => return false,
        None => without_build,
    };

    let mut parts = core.split('.');
    let major = parts.next().unwrap_or("");
    let Some(minor) = parts.next() else {
        return false;
    };
    let Some(patch) = parts.next() else {
        return false;
    };
    parts.next().is_none()
        && is_semver_numeric_part(major)
        && is_semver_numeric_part(minor)
        && is_semver_numeric_part(patch)
}

fn compatibility_range_lower_bound(range: &str) -> Option<&str> {
    range
        .strip_prefix(">=")
        .and_then(|range| range.split(' ').next())
}

fn is_current_v0_compatibility_range(range: &str) -> bool {
    let Some(lower_bound) = compatibility_range_lower_bound(range) else {
        return false;
    };
    derive_v0_compatibility_range(lower_bound).as_deref() == Some(range)
}

fn is_http_url_v01(value: &str) -> bool {
    let rest = value
        .strip_prefix("https://")
        .or_else(|| value.strip_prefix("http://"));
    matches!(rest, Some(rest) if !rest.is_empty() && !rest.chars().any(char::is_whitespace))
}

fn is_relative_path_v01(value: &str) -> bool {
    if value.is_empty() {
        return false;
    }
    if value.starts_with('/') {
        return false;
    }
    if value.split('/').any(|segment| segment == "..") {
        return false;
    }
    value.bytes().all(|byte| {
        byte.is_ascii_alphanumeric()
            || matches!(
                byte,
                b'.' | b'_'
                    | b'~'
                    | b'!'
                    | b'$'
                    | b'&'
                    | b'\''
                    | b'('
                    | b')'
                    | b'+'
                    | b','
                    | b';'
                    | b'='
                    | b':'
                    | b'@'
                    | b'%'
                    | b'/'
                    | b'-'
            )
    })
}

fn is_sha256_hex_v01(value: &str) -> bool {
    value.len() == 64 && value.bytes().all(|byte| byte.is_ascii_hexdigit())
}

fn validate_package_checksum_v01(
    errors: &mut Vec<ValidationErrorV01>,
    label: &str,
    checksum: &super::PackageChecksumV01,
) {
    if !is_sha256_hex_v01(&checksum.value) {
        errors.push(ValidationErrorV01::new(format!(
            "{label} checksum must be a 64-character sha256 hex value"
        )));
    }
}

fn is_message_any_compatible(source_type: &DataTypeV01, target_type: &DataTypeV01) -> bool {
    if target_type.flow == DataFlowV01::Event {
        return source_type.flow == DataFlowV01::Event;
    }

    if target_type.flow == DataFlowV01::Control {
        return (source_type.flow == DataFlowV01::Control
            && matches!(
                source_type.data_kind.as_str(),
                "number.float"
                    | "number.int"
                    | "number.uint"
                    | "bool"
                    | "color"
                    | "string"
                    | "message.any"
            ))
            || (source_type.flow == DataFlowV01::Event && source_type.data_kind == "event.bang");
    }

    false
}

pub fn compatible_data_types_v01(source_type: &DataTypeV01, target_type: &DataTypeV01) -> bool {
    source_type == target_type
        || (source_type.data_kind == "message.any"
            && is_message_any_compatible(source_type, target_type))
        || (target_type.data_kind == "message.any"
            && is_message_any_compatible(source_type, target_type))
}

pub fn type_label_v01(data_type: &DataTypeV01) -> String {
    let flow = match data_type.flow {
        DataFlowV01::Control => "control",
        DataFlowV01::Event => "event",
        DataFlowV01::Signal => "signal",
        DataFlowV01::Stream => "stream",
        DataFlowV01::Resource => "resource",
    };

    format!("{flow}<{}>", data_type.data_kind)
}

fn diagnostic(
    diagnostics: &mut Vec<GraphValidationDiagnosticV01>,
    severity: &str,
    code: &str,
    message: impl Into<String>,
    nodes: Option<Vec<String>>,
    edges: Option<Vec<String>>,
) {
    diagnostics.push(GraphValidationDiagnosticV01 {
        severity: severity.to_owned(),
        code: code.to_owned(),
        message: message.into(),
        nodes,
        edges,
    });
}

fn fragment_diagnostic(
    diagnostics: &mut Vec<GraphFragmentDiagnosticV01>,
    severity: &str,
    code: &str,
    message: impl Into<String>,
    nodes: Option<Vec<String>>,
    edges: Option<Vec<String>>,
) {
    diagnostics.push(GraphFragmentDiagnosticV01 {
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

fn edge_endpoint_key(edge: &EdgeSpecV01) -> String {
    format!(
        "{}:{}->{}:{}",
        edge.source.node_id, edge.source.port_id, edge.target.node_id, edge.target.port_id
    )
}

fn edge_enabled(edge: &EdgeSpecV01) -> bool {
    edge.enabled != Some(false)
}

fn input_max_connections(port: &PortSpecV01) -> u64 {
    match port.max_connections {
        Some(Some(max_connections)) => max_connections,
        Some(None) => u64::MAX,
        None => 1,
    }
}

fn merge_policy_for(port: &PortSpecV01) -> MergePolicyV01 {
    port.merge_policy.clone().unwrap_or(MergePolicyV01::Forbid)
}

fn accepts(source: &PortSpecV01, target: &PortSpecV01) -> bool {
    if target.port_type == "control.message.any" && is_control_message_port_type(&source.port_type)
    {
        return true;
    }
    if source.port_type == target.port_type {
        return true;
    }
    if let Some(accepted) = &target.accepts {
        return accepted.contains(&source.port_type);
    }
    false
}

fn is_control_message_port_type(port_type: &str) -> bool {
    matches!(
        port_type,
        "control.message.any"
            | "control.number.float"
            | "control.number.int"
            | "control.number.uint"
            | "control.bool"
            | "control.color"
            | "control.string"
    )
}

fn is_legacy_control_port_type(port_type: &str) -> bool {
    matches!(
        port_type,
        "message.any"
            | "number.float"
            | "number.int"
            | "number.uint"
            | "boolean"
            | "color"
            | "string"
    ) || port_type.starts_with("value.")
        || port_type.starts_with("value<")
}

fn is_selector_aware_input_port(port: &PortSpecV01) -> bool {
    port.direction == PortDirectionV01::Input
        && (port.port_type == "control.message.any"
            || port.accepts.as_ref().is_some_and(|accepted| {
                accepted.iter().any(|value| value == "control.message.any")
            }))
}

fn message_selector_policy_errors(port: &PortSpecV01, label: &str) -> Vec<String> {
    let Some(policy) = &port.message_selectors else {
        return if is_selector_aware_input_port(port) {
            vec![format!(
                "{label} selector-aware input port requires messageSelectors"
            )]
        } else {
            Vec::new()
        };
    };

    let mut errors = Vec::new();
    if policy.accepted.is_empty() {
        errors.push(format!(
            "{label} messageSelectors.accepted must list at least one selector"
        ));
    }

    for (field, selectors) in [
        ("silent", &policy.silent),
        ("trigger", &policy.trigger),
        ("store", &policy.store),
        ("emit", &policy.emit),
    ] {
        for selector in selectors.iter().flat_map(|values| values.iter()) {
            if !policy.accepted.contains(selector) {
                errors.push(format!(
                    "{label} messageSelectors.{field} selector {selector} is not accepted"
                ));
            }
        }
    }
    if policy
        .trigger
        .as_ref()
        .is_some_and(|selectors| selectors.iter().any(|selector| selector == "set"))
    {
        errors.push(format!(
            "{label} messageSelectors.trigger must not include set"
        ));
    }
    if policy
        .emit
        .as_ref()
        .is_some_and(|selectors| selectors.iter().any(|selector| selector == "set"))
    {
        errors.push(format!(
            "{label} messageSelectors.emit must not include set"
        ));
    }
    if policy.accepted.iter().any(|selector| selector == "set")
        && !policy
            .silent
            .as_ref()
            .is_some_and(|selectors| selectors.iter().any(|selector| selector == "set"))
        && !policy
            .store
            .as_ref()
            .is_some_and(|selectors| selectors.iter().any(|selector| selector == "set"))
    {
        errors.push(format!(
            "{label} messageSelectors.set must be silent or store behavior"
        ));
    }

    errors
}

pub fn analyze_graph_fragment_v01(
    fragment: &GraphFragmentV01,
    outside_endpoint_policy: GraphFragmentOutsideEndpointPolicyV01,
) -> GraphFragmentValidationResultV01 {
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
            if is_legacy_control_port_type(&port.port_type) {
                fragment_diagnostic(
                    &mut diagnostics,
                    "error",
                    "legacy-port-type",
                    format!(
                        "port {}.{} uses legacy control port type {}",
                        node.id, port.id, port.port_type
                    ),
                    Some(vec![node.id.clone()]),
                    None,
                );
            }
            if let Some(accepted) = &port.accepts {
                for accepted_type in accepted {
                    if is_legacy_control_port_type(accepted_type) {
                        fragment_diagnostic(
                            &mut diagnostics,
                            "error",
                            "legacy-port-type",
                            format!(
                                "port {}.{} accepts legacy control port type {}",
                                node.id, port.id, accepted_type
                            ),
                            Some(vec![node.id.clone()]),
                            None,
                        );
                    }
                }
            }
            for error in
                message_selector_policy_errors(port, &format!("port {}.{}", node.id, port.id))
            {
                fragment_diagnostic(
                    &mut diagnostics,
                    "error",
                    "message-selector-policy",
                    error,
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
        if edge
            .resolved_type
            .as_ref()
            .is_some_and(|port_type| is_legacy_control_port_type(port_type))
        {
            fragment_diagnostic(
                &mut diagnostics,
                "error",
                "legacy-port-type",
                format!(
                    "edge {} uses legacy resolvedType {}",
                    edge.id,
                    edge.resolved_type.as_deref().unwrap_or_default()
                ),
                None,
                Some(vec![edge.id.clone()]),
            );
        }

        let source_node_missing = !node_ids.contains(&edge.source.node_id);
        let target_node_missing = !node_ids.contains(&edge.target.node_id);
        if source_node_missing || target_node_missing {
            let severity = if outside_endpoint_policy == GraphFragmentOutsideEndpointPolicyV01::Omit
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

        if source.direction != PortDirectionV01::Output {
            fragment_diagnostic(
                &mut diagnostics,
                "error",
                "invalid-source-direction",
                format!("edge {} source {source_key} is not an output port", edge.id),
                None,
                Some(vec![edge.id.clone()]),
            );
        }
        if target.direction != PortDirectionV01::Input {
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

    GraphFragmentValidationResultV01 {
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

fn is_control_cycle_port_type(port_type: &str) -> bool {
    matches!(
        port_type,
        "control.message.any"
            | "event.bang"
            | "control.number.float"
            | "control.number.int"
            | "control.number.uint"
            | "control.bool"
            | "control.color"
            | "control.string"
    ) || matches!(port_family(port_type), "control")
}

fn control_cycle_types(edges: &[EdgeSpecV01], ports: &HashMap<String, PortSpecV01>) -> bool {
    edges.iter().all(|edge| {
        let source_key = port_key(&edge.source.node_id, &edge.source.port_id);
        let target_key = port_key(&edge.target.node_id, &edge.target.port_id);
        let source_type = ports
            .get(&source_key)
            .map(|port| port.port_type.as_str())
            .unwrap_or_default();
        let target_type = ports
            .get(&target_key)
            .map(|port| port.port_type.as_str())
            .unwrap_or_default();
        is_control_cycle_port_type(source_type) && is_control_cycle_port_type(target_type)
    })
}

fn classify_cycle(
    nodes: Vec<String>,
    edges: Vec<EdgeSpecV01>,
    ports: &HashMap<String, PortSpecV01>,
) -> GraphCycleValidationV01 {
    let feedback = edges
        .iter()
        .find(|edge| edge.feedback.as_ref().is_some_and(|policy| policy.enabled));

    if let Some(edge) = feedback {
        if edge
            .feedback
            .as_ref()
            .is_some_and(|policy| policy.boundary == FeedbackBoundaryV01::SameTurn)
        {
            return GraphCycleValidationV01 {
                classification: CycleValidationV01::RiskyFeedback,
                nodes,
                edges: edges.iter().map(|edge| edge.id.clone()).collect(),
                message: format!("feedback edge {} uses same-turn boundary", edge.id),
            };
        }

        return GraphCycleValidationV01 {
            classification: CycleValidationV01::ValidFeedback,
            nodes,
            edges: edges.iter().map(|edge| edge.id.clone()).collect(),
            message: format!("feedback edge {} provides explicit boundary", edge.id),
        };
    }

    let classification = if control_cycle_types(&edges, ports) {
        CycleValidationV01::AmbiguousAlgebraicLoop
    } else {
        CycleValidationV01::InvalidCycle
    };
    let message = match classification {
        CycleValidationV01::AmbiguousAlgebraicLoop => {
            "control cycle requires explicit latch, delay, or feedback policy"
        }
        _ => "cycle requires explicit feedback policy",
    };

    GraphCycleValidationV01 {
        classification,
        nodes,
        edges: edges.iter().map(|edge| edge.id.clone()).collect(),
        message: message.to_owned(),
    }
}

fn strongly_connected_components(nodes: &[String], edges: &[EdgeSpecV01]) -> Vec<Vec<String>> {
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

fn cycle_edges_for(component: &[String], edges: &[EdgeSpecV01]) -> Vec<EdgeSpecV01> {
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

pub fn analyze_graph_document_v01(graph: &GraphDocumentV01) -> GraphValidationResultV01 {
    let mut diagnostics = Vec::new();
    let mut cycles = Vec::new();
    let mut node_ids = HashSet::new();
    let mut ports: HashMap<String, PortSpecV01> = HashMap::new();
    let mut incoming: HashMap<String, Vec<EdgeSpecV01>> = HashMap::new();
    let mut outgoing: HashMap<String, Vec<EdgeSpecV01>> = HashMap::new();
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
            if is_legacy_control_port_type(&port.port_type) {
                diagnostic(
                    &mut diagnostics,
                    "error",
                    "legacy-port-type",
                    format!(
                        "port {}.{} uses legacy control port type {}",
                        node.id, port.id, port.port_type
                    ),
                    Some(vec![node.id.clone()]),
                    None,
                );
            }
            if let Some(accepted) = &port.accepts {
                for accepted_type in accepted {
                    if is_legacy_control_port_type(accepted_type) {
                        diagnostic(
                            &mut diagnostics,
                            "error",
                            "legacy-port-type",
                            format!(
                                "port {}.{} accepts legacy control port type {}",
                                node.id, port.id, accepted_type
                            ),
                            Some(vec![node.id.clone()]),
                            None,
                        );
                    }
                }
            }
            for error in
                message_selector_policy_errors(port, &format!("port {}.{}", node.id, port.id))
            {
                diagnostic(
                    &mut diagnostics,
                    "error",
                    "message-selector-policy",
                    error,
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
            if is_legacy_control_port_type(&group.port_type) {
                diagnostic(
                    &mut diagnostics,
                    "error",
                    "legacy-port-type",
                    format!(
                        "port group {}.{} uses legacy control port type {}",
                        node.id, group.id, group.port_type
                    ),
                    Some(vec![node.id.clone()]),
                    None,
                );
            }
            if group
                .default_port_spec
                .as_ref()
                .is_some_and(|port| is_legacy_control_port_type(&port.port_type))
            {
                diagnostic(
                    &mut diagnostics,
                    "error",
                    "legacy-port-type",
                    format!(
                        "port group {}.{} default port uses legacy control port type {}",
                        node.id,
                        group.id,
                        group
                            .default_port_spec
                            .as_ref()
                            .map(|port| port.port_type.as_str())
                            .unwrap_or_default()
                    ),
                    Some(vec![node.id.clone()]),
                    None,
                );
            }
            if let Some(default_port) = &group.default_port_spec {
                if let Some(accepted) = &default_port.accepts {
                    for accepted_type in accepted {
                        if is_legacy_control_port_type(accepted_type) {
                            diagnostic(
                                &mut diagnostics,
                                "error",
                                "legacy-port-type",
                                format!(
                                    "port group {}.{} default port accepts legacy control port type {}",
                                    node.id, group.id, accepted_type
                                ),
                                Some(vec![node.id.clone()]),
                                None,
                            );
                        }
                    }
                }
                for error in message_selector_policy_errors(
                    default_port,
                    &format!("port group {}.{} defaultPortSpec", node.id, group.id),
                ) {
                    diagnostic(
                        &mut diagnostics,
                        "error",
                        "message-selector-policy",
                        error,
                        Some(vec![node.id.clone()]),
                        None,
                    );
                }
            }
            if let Some(max_ports) = group.max_ports {
                if max_ports >= group.min_ports {
                    continue;
                }
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
        if edge
            .resolved_type
            .as_ref()
            .is_some_and(|port_type| is_legacy_control_port_type(port_type))
        {
            diagnostic(
                &mut diagnostics,
                "error",
                "legacy-port-type",
                format!(
                    "edge {} uses legacy resolvedType {}",
                    edge.id,
                    edge.resolved_type.as_deref().unwrap_or_default()
                ),
                None,
                Some(vec![edge.id.clone()]),
            );
        }

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

        if source.direction != PortDirectionV01::Output {
            diagnostic(
                &mut diagnostics,
                "error",
                "invalid-source-direction",
                format!("edge {} source {source_key} is not an output port", edge.id),
                None,
                Some(vec![edge.id.clone()]),
            );
        }
        if target.direction != PortDirectionV01::Input {
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
        if port.direction != PortDirectionV01::Input {
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
        if connected_edges.len() > 1 && merge_policy_for(port) == MergePolicyV01::Forbid {
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
        if port.direction == PortDirectionV01::Output
            && connected_edges.len() > 1
            && matches!(
                port.fan_out_policy.as_ref(),
                Some(super::FanOutPolicyV01::Forbid)
            )
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
            CycleValidationV01::AmbiguousAlgebraicLoop | CycleValidationV01::InvalidCycle => {
                let code = match &cycle.classification {
                    CycleValidationV01::AmbiguousAlgebraicLoop => "ambiguous-algebraic-loop",
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
            CycleValidationV01::RiskyFeedback => diagnostic(
                &mut diagnostics,
                "warning",
                "risky-feedback",
                cycle.message.clone(),
                Some(cycle.nodes.clone()),
                Some(cycle.edges.clone()),
            ),
            CycleValidationV01::NoCycle | CycleValidationV01::ValidFeedback => {}
        }
        cycles.push(cycle);
    }

    GraphValidationResultV01 {
        ok: diagnostics
            .iter()
            .all(|diagnostic| diagnostic.severity != "error"),
        diagnostics,
        cycles,
    }
}

pub fn validate_graph_document_v01(
    graph: &GraphDocumentV01,
) -> Result<GraphValidationResultV01, ValidationReportV01> {
    let mut errors = Vec::new();
    if graph.schema != "skenion.graph" {
        errors.push(ValidationErrorV01::new(format!(
            "expected schema skenion.graph, found {}",
            graph.schema
        )));
    }
    if graph.schema_version != "0.1.0" {
        errors.push(ValidationErrorV01::new(format!(
            "expected schemaVersion 0.1.0, found {}",
            graph.schema_version
        )));
    }

    let result = analyze_graph_document_v01(graph);
    for diagnostic in result
        .diagnostics
        .iter()
        .filter(|diagnostic| diagnostic.severity == "error")
    {
        errors.push(ValidationErrorV01::new(format!(
            "{}: {}",
            diagnostic.code, diagnostic.message
        )));
    }

    if errors.is_empty() {
        Ok(result)
    } else {
        Err(ValidationReportV01::new(errors))
    }
}

fn validate_graph_fragment_with_policy(
    fragment: &GraphFragmentV01,
    outside_endpoint_policy: GraphFragmentOutsideEndpointPolicyV01,
) -> Result<GraphFragmentValidationResultV01, ValidationReportV01> {
    let mut errors = Vec::new();
    if fragment.schema != "skenion.graph.fragment" {
        errors.push(ValidationErrorV01::new(format!(
            "expected schema skenion.graph.fragment, found {}",
            fragment.schema
        )));
    }
    if fragment.schema_version != "0.1.0" {
        errors.push(ValidationErrorV01::new(format!(
            "expected schemaVersion 0.1.0, found {}",
            fragment.schema_version
        )));
    }

    let result = analyze_graph_fragment_v01(fragment, outside_endpoint_policy);
    for diagnostic in result
        .diagnostics
        .iter()
        .filter(|diagnostic| diagnostic.severity == "error")
    {
        errors.push(ValidationErrorV01::new(format!(
            "{}: {}",
            diagnostic.code, diagnostic.message
        )));
    }

    if errors.is_empty() {
        Ok(result)
    } else {
        Err(ValidationReportV01::new(errors))
    }
}

pub fn validate_graph_fragment_v01(
    fragment: &GraphFragmentV01,
) -> Result<GraphFragmentValidationResultV01, ValidationReportV01> {
    validate_graph_fragment_with_policy(fragment, GraphFragmentOutsideEndpointPolicyV01::Reject)
}

pub fn validate_paste_graph_fragment_request(
    request: &PasteGraphFragmentRequest,
) -> Result<GraphFragmentValidationResultV01, ValidationReportV01> {
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
) -> Vec<ValidationErrorV01> {
    let max_vector = causal.vector.values().copied().max().unwrap_or(0);
    if causal.base_sequence < max_vector {
        vec![ValidationErrorV01::new(format!(
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
) -> Vec<ValidationErrorV01> {
    let Some(subject) = auth_subject else {
        return Vec::new();
    };
    let Some(subject_id) = subject.subject_id.as_deref() else {
        return Vec::new();
    };

    if subject_id == participant_id {
        vec![ValidationErrorV01::new(format!(
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
) -> Vec<ValidationErrorV01> {
    if expires_at <= updated_at {
        vec![ValidationErrorV01::new(format!(
            "{label} expiresAt must be later than updatedAt"
        ))]
    } else {
        Vec::new()
    }
}

fn runtime_collaboration_change_id(change: &RuntimeCollaborationChange) -> &str {
    match change {
        RuntimeCollaborationChange::NodeAdd { change_id, .. } => change_id,
        RuntimeCollaborationChange::NodeMove { change_id, .. } => change_id,
        RuntimeCollaborationChange::NodeDelete { change_id, .. } => change_id,
        RuntimeCollaborationChange::EdgeConnect { change_id, .. } => change_id,
        RuntimeCollaborationChange::EdgeDisconnect { change_id, .. } => change_id,
    }
}

fn validate_runtime_collaboration_payload(
    payload: &RuntimeCollaborationOperationPayload,
    participant_id: &str,
) -> Vec<ValidationErrorV01> {
    match payload {
        RuntimeCollaborationOperationPayload::ChangeSet { changes, .. } => duplicate_errors(
            changes
                .iter()
                .map(runtime_collaboration_change_id)
                .collect(),
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
                vec![ValidationErrorV01::new(
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
) -> Vec<ValidationErrorV01> {
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
        errors.push(ValidationErrorV01::new(
            "operation causal vector must include participantId",
        ));
    }

    errors
}

pub fn validate_runtime_collaboration_operation_envelope(
    envelope: &RuntimeCollaborationOperationEnvelope,
) -> Result<(), ValidationReportV01> {
    let mut errors = Vec::new();
    if envelope.schema != "skenion.runtime.collaboration.operation" {
        errors.push(ValidationErrorV01::new(format!(
            "expected schema skenion.runtime.collaboration.operation, found {}",
            envelope.schema
        )));
    }
    if envelope.schema_version != "0.1.0" {
        errors.push(ValidationErrorV01::new(format!(
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
        Err(ValidationReportV01::new(errors))
    }
}

pub fn validate_runtime_collaboration_operation_batch(
    batch: &RuntimeCollaborationOperationBatch,
) -> Result<(), ValidationReportV01> {
    let mut errors = Vec::new();
    if batch.schema != "skenion.runtime.collaboration.operation-batch" {
        errors.push(ValidationErrorV01::new(format!(
            "expected schema skenion.runtime.collaboration.operation-batch, found {}",
            batch.schema
        )));
    }
    if batch.schema_version != "0.1.0" {
        errors.push(ValidationErrorV01::new(format!(
            "expected schemaVersion 0.1.0, found {}",
            batch.schema_version
        )));
    }
    errors.extend(duplicate_errors(
        batch
            .operations
            .iter()
            .map(|operation| operation.idempotency_key.as_str())
            .collect(),
        "collaboration idempotency key",
    ));
    for operation in &batch.operations {
        if operation.session_id != batch.session_id {
            errors.push(ValidationErrorV01::new(
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
        Err(ValidationReportV01::new(errors))
    }
}

pub fn validate_runtime_collaboration_operation_result(
    result: &RuntimeCollaborationOperationResult,
) -> Result<(), ValidationReportV01> {
    let mut errors = Vec::new();
    if result.schema != "skenion.runtime.collaboration.operation-result" {
        errors.push(ValidationErrorV01::new(format!(
            "expected schema skenion.runtime.collaboration.operation-result, found {}",
            result.schema
        )));
    }
    if result.schema_version != "0.1.0" {
        errors.push(ValidationErrorV01::new(format!(
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

    let status_requires_ack = matches!(
        result.status,
        RuntimeCollaborationOperationStatus::Accepted
            | RuntimeCollaborationOperationStatus::Rebased
    );
    if status_requires_ack && !has_ack {
        errors.push(ValidationErrorV01::new(
            "accepted or rebased collaboration result must include ack",
        ));
    }
    if result.status == RuntimeCollaborationOperationStatus::Accepted && has_nack {
        errors.push(ValidationErrorV01::new(
            "accepted collaboration result must not include nack or rebase",
        ));
    }
    if result.status == RuntimeCollaborationOperationStatus::Accepted && has_rebase {
        errors.push(ValidationErrorV01::new(
            "accepted collaboration result must not include nack or rebase",
        ));
    }

    let status_requires_nack = matches!(
        result.status,
        RuntimeCollaborationOperationStatus::Duplicate
            | RuntimeCollaborationOperationStatus::Rejected
    );
    if status_requires_nack && !has_nack {
        errors.push(ValidationErrorV01::new(
            "duplicate or rejected collaboration result must include nack",
        ));
    }
    let has_duplicate_idempotency_nack = match result.nack.as_ref() {
        Some(nack) => nack.reason == RuntimeCollaborationNackReason::DuplicateIdempotencyKey,
        None => false,
    };
    if result.status == RuntimeCollaborationOperationStatus::Duplicate
        && !has_duplicate_idempotency_nack
    {
        errors.push(ValidationErrorV01::new(
            "duplicate collaboration result nack reason must be duplicate-idempotency-key",
        ));
    }
    if result.status == RuntimeCollaborationOperationStatus::Rebased && !has_rebase {
        errors.push(ValidationErrorV01::new(
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
        Err(ValidationReportV01::new(errors))
    }
}

pub fn validate_runtime_collaboration_operation_batch_result(
    result: &RuntimeCollaborationOperationBatchResult,
) -> Result<(), ValidationReportV01> {
    let mut errors = Vec::new();
    if result.schema != "skenion.runtime.collaboration.operation-batch-result" {
        errors.push(ValidationErrorV01::new(format!(
            "expected schema skenion.runtime.collaboration.operation-batch-result, found {}",
            result.schema
        )));
    }
    if result.schema_version != "0.1.0" {
        errors.push(ValidationErrorV01::new(format!(
            "expected schemaVersion 0.1.0, found {}",
            result.schema_version
        )));
    }
    if result.results.is_empty() {
        errors.push(ValidationErrorV01::new(
            "collaboration batch result must include at least one operation result",
        ));
    }
    errors.extend(duplicate_errors(
        result
            .results
            .iter()
            .map(|operation_result| operation_result.idempotency_key.as_str())
            .collect(),
        "collaboration batch result idempotency key",
    ));
    for operation_result in &result.results {
        if operation_result.session_id != result.session_id {
            errors.push(ValidationErrorV01::new(
                "collaboration batch result operation sessionId must match batch result sessionId",
            ));
        }
        if let Err(report) = validate_runtime_collaboration_operation_result(operation_result) {
            errors.extend(report.errors().to_vec());
        }
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(ValidationReportV01::new(errors))
    }
}

pub fn validate_runtime_collaboration_presence_envelope(
    presence: &RuntimeCollaborationPresenceEnvelope,
) -> Result<(), ValidationReportV01> {
    let mut errors = Vec::new();
    if presence.schema != "skenion.runtime.collaboration.presence" {
        errors.push(ValidationErrorV01::new(format!(
            "expected schema skenion.runtime.collaboration.presence, found {}",
            presence.schema
        )));
    }
    if presence.schema_version != "0.1.0" {
        errors.push(ValidationErrorV01::new(format!(
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
        Err(ValidationReportV01::new(errors))
    }
}

pub fn validate_runtime_collaboration_selection_envelope(
    selection: &RuntimeCollaborationSelectionEnvelope,
) -> Result<(), ValidationReportV01> {
    let mut errors = Vec::new();
    if selection.schema != "skenion.runtime.collaboration.selection" {
        errors.push(ValidationErrorV01::new(format!(
            "expected schema skenion.runtime.collaboration.selection, found {}",
            selection.schema
        )));
    }
    if selection.schema_version != "0.1.0" {
        errors.push(ValidationErrorV01::new(format!(
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
        Err(ValidationReportV01::new(errors))
    }
}

fn runtime_collaboration_event_payload_kind(
    payload: &RuntimeCollaborationEventPayload,
) -> RuntimeCollaborationEventKind {
    match payload {
        RuntimeCollaborationEventPayload::OperationResult { .. } => {
            RuntimeCollaborationEventKind::OperationResult
        }
        RuntimeCollaborationEventPayload::Presence { .. } => {
            RuntimeCollaborationEventKind::Presence
        }
        RuntimeCollaborationEventPayload::Selection { .. } => {
            RuntimeCollaborationEventKind::Selection
        }
    }
}

pub fn validate_runtime_collaboration_event_envelope(
    event: &RuntimeCollaborationEventEnvelope,
) -> Result<(), ValidationReportV01> {
    let mut errors = Vec::new();
    if event.schema != "skenion.runtime.collaboration.event" {
        errors.push(ValidationErrorV01::new(format!(
            "expected schema skenion.runtime.collaboration.event, found {}",
            event.schema
        )));
    }
    if event.schema_version != "0.1.0" {
        errors.push(ValidationErrorV01::new(format!(
            "expected schemaVersion 0.1.0, found {}",
            event.schema_version
        )));
    }
    errors.extend(validate_runtime_collaboration_causality(
        &event.causal,
        "collaboration event causal",
    ));
    if event.kind != runtime_collaboration_event_payload_kind(&event.payload) {
        errors.push(ValidationErrorV01::new(
            "collaboration event kind must match payload kind",
        ));
    }
    match &event.replay.gap {
        Some(gap) if gap.expected_sequence >= gap.actual_sequence => {
            errors.push(ValidationErrorV01::new(
                "collaboration event replay gap expectedSequence must be less than actualSequence",
            ));
        }
        _ => {}
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(ValidationReportV01::new(errors))
    }
}

pub fn validate_runtime_operation_envelope(
    envelope: &RuntimeOperationEnvelope,
) -> Result<(), ValidationReportV01> {
    let mut errors = Vec::new();
    if envelope.schema != "skenion.runtime.operation" {
        errors.push(ValidationErrorV01::new(format!(
            "expected schema skenion.runtime.operation, found {}",
            envelope.schema
        )));
    }
    if envelope.schema_version != "0.1.0" {
        errors.push(ValidationErrorV01::new(format!(
            "expected schemaVersion 0.1.0, found {}",
            envelope.schema_version
        )));
    }
    if envelope.id.is_empty() {
        errors.push(ValidationErrorV01::new(
            "runtime operation id must not be empty",
        ));
    }
    if envelope.kind != "pasteGraphFragment" {
        errors.push(ValidationErrorV01::new(format!(
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
        Err(ValidationReportV01::new(errors))
    }
}

pub fn validate_paste_graph_fragment_response(
    response: &PasteGraphFragmentResponse,
) -> Result<(), ValidationReportV01> {
    let mut errors = Vec::new();
    if response.schema != "skenion.runtime.paste-graph-fragment.response" {
        errors.push(ValidationErrorV01::new(format!(
            "expected schema skenion.runtime.paste-graph-fragment.response, found {}",
            response.schema
        )));
    }
    if response.schema_version != "0.1.0" {
        errors.push(ValidationErrorV01::new(format!(
            "expected schemaVersion 0.1.0, found {}",
            response.schema_version
        )));
    }
    if response.applied && !response.ok {
        errors.push(ValidationErrorV01::new(
            "paste response cannot be applied when ok is false",
        ));
    }
    if response.applied && response.revision_after.is_none() {
        errors.push(ValidationErrorV01::new(
            "applied paste response must include revisionAfter",
        ));
    }
    for diagnostic in &response.diagnostics {
        if matches!(
            diagnostic.code.as_str(),
            "interface-drift" | "invalid-incident-edge"
        ) && diagnostic.interface_detail.is_none()
        {
            errors.push(ValidationErrorV01::new(format!(
                "runtime operation diagnostic {} requires interfaceDetail",
                diagnostic.code
            )));
        }
        if let Some(detail) = &diagnostic.interface_detail
            && detail.recovery_actions.is_empty()
        {
            errors.push(ValidationErrorV01::new(format!(
                "runtime operation diagnostic {} interfaceDetail requires recoveryActions",
                diagnostic.code
            )));
        }
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(ValidationReportV01::new(errors))
    }
}

pub fn validate_runtime_session_info_response(
    response: &RuntimeSessionInfoResponse,
) -> Result<(), ValidationReportV01> {
    let mut errors = Vec::new();
    if response.schema != "skenion.runtime.session.info" {
        errors.push(ValidationErrorV01::new(format!(
            "expected schema skenion.runtime.session.info, found {}",
            response.schema
        )));
    }
    if response.schema_version != "0.1.0" {
        errors.push(ValidationErrorV01::new(format!(
            "expected schemaVersion 0.1.0, found {}",
            response.schema_version
        )));
    }
    if response.session_id.is_empty() {
        errors.push(ValidationErrorV01::new("sessionId must not be empty"));
    }
    errors.extend(runtime_session_snapshot_errors(&response.snapshot));
    errors.extend(runtime_diagnostic_errors(
        "session info",
        &response.diagnostics,
    ));
    errors.extend(runtime_profile_errors(&response.profile));
    if response.capabilities.auth_policy != "deferred" {
        errors.push(ValidationErrorV01::new(
            "runtime session authPolicy must be deferred",
        ));
    }
    if response.event_replay.cursor_kind != "sequence" {
        errors.push(ValidationErrorV01::new(
            "runtime eventReplay cursorKind must be sequence",
        ));
    }
    if response.event_replay.current_cursor.is_empty() {
        errors.push(ValidationErrorV01::new(
            "runtime eventReplay currentCursor must not be empty",
        ));
    }
    if response.event_replay.earliest_sequence == 0 {
        errors.push(ValidationErrorV01::new(
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
        errors.push(ValidationErrorV01::new(
            "runtime profile ownership must match local-managed, local-shared, or remote mode",
        ));
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(ValidationReportV01::new(errors))
    }
}

fn runtime_profile_errors(profile: &RuntimeConnectionProfile) -> Vec<ValidationErrorV01> {
    let mut errors = Vec::new();
    if profile.endpoint.url.is_empty() {
        errors.push(ValidationErrorV01::new("endpoint url must not be empty"));
    }
    if profile
        .endpoint
        .canonical_url
        .as_ref()
        .is_some_and(String::is_empty)
    {
        errors.push(ValidationErrorV01::new(
            "endpoint canonicalUrl must not be empty",
        ));
    }
    if profile.endpoint.host.as_ref().is_some_and(String::is_empty) {
        errors.push(ValidationErrorV01::new("endpoint host must not be empty"));
    }
    if let Some(process) = &profile.process {
        if process.pid == Some(0) {
            errors.push(ValidationErrorV01::new("process pid must be at least 1"));
        }
        if process
            .executable_path
            .as_ref()
            .is_some_and(String::is_empty)
        {
            errors.push(ValidationErrorV01::new(
                "process executablePath must not be empty",
            ));
        }
        if process
            .working_directory
            .as_ref()
            .is_some_and(String::is_empty)
        {
            errors.push(ValidationErrorV01::new(
                "process workingDirectory must not be empty",
            ));
        }
        if process
            .owner_window_id
            .as_ref()
            .is_some_and(String::is_empty)
        {
            errors.push(ValidationErrorV01::new(
                "process ownerWindowId must not be empty",
            ));
        }
        if process.platform.as_ref().is_some_and(String::is_empty) {
            errors.push(ValidationErrorV01::new(
                "process platform must not be empty",
            ));
        }
        if process.arch.as_ref().is_some_and(String::is_empty) {
            errors.push(ValidationErrorV01::new("process arch must not be empty"));
        }
    }
    errors
}

pub fn validate_runtime_session_event(
    event: &RuntimeSessionEvent,
) -> Result<(), ValidationReportV01> {
    let mut errors = Vec::new();
    if event.schema != "skenion.runtime.session.event" {
        errors.push(ValidationErrorV01::new(format!(
            "expected schema skenion.runtime.session.event, found {}",
            event.schema
        )));
    }
    if event.schema_version != "0.1.0" {
        errors.push(ValidationErrorV01::new(format!(
            "expected schemaVersion 0.1.0, found {}",
            event.schema_version
        )));
    }
    if event.session_id.is_empty() {
        errors.push(ValidationErrorV01::new("sessionId must not be empty"));
    }
    if event.id.is_empty() {
        errors.push(ValidationErrorV01::new("event id must not be empty"));
    }
    if event.sequence == 0 {
        errors.push(ValidationErrorV01::new("sequence must be at least 1"));
    }
    if event.created_at.is_empty() {
        errors.push(ValidationErrorV01::new("createdAt must not be empty"));
    }
    errors.extend(runtime_session_snapshot_errors(&event.snapshot));
    errors.extend(runtime_diagnostic_errors("event", &event.diagnostics));
    errors.extend(runtime_history_errors(&event.history));
    if let Some(mutation) = &event.mutation {
        errors.extend(runtime_history_entry_errors(mutation, "mutation"));
    }
    if event.replay.cursor.is_empty() {
        errors.push(ValidationErrorV01::new("replay cursor must not be empty"));
    }
    if event
        .replay
        .previous_cursor
        .as_ref()
        .is_some_and(String::is_empty)
    {
        errors.push(ValidationErrorV01::new(
            "replay previousCursor must not be empty",
        ));
    }
    if let Some(gap) = &event.replay.gap {
        if gap.expected_sequence == 0 || gap.actual_sequence == 0 {
            errors.push(ValidationErrorV01::new(
                "replay gap sequences must be at least 1",
            ));
        }
        if gap.expected_sequence >= gap.actual_sequence {
            errors.push(ValidationErrorV01::new(
                "replay gap expectedSequence must be less than actualSequence",
            ));
        }
    }
    if event.session_revision != event.snapshot.session_revision {
        errors.push(ValidationErrorV01::new(
            "event sessionRevision must match snapshot.sessionRevision",
        ));
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(ValidationReportV01::new(errors))
    }
}

fn runtime_session_snapshot_errors(snapshot: &RuntimeSessionSnapshot) -> Vec<ValidationErrorV01> {
    let mut errors = Vec::new();
    errors.extend(runtime_diagnostic_errors("snapshot", &snapshot.diagnostics));
    if snapshot.plan.as_ref().is_some_and(|plan| !plan.is_object()) {
        errors.push(ValidationErrorV01::new(
            "snapshot plan must be an object or null",
        ));
    }
    if let Some(project) = &snapshot.project
        && let Err(report) = validate_project_document_v01(project)
    {
        errors.extend(
            report.errors.into_iter().map(|error| {
                ValidationErrorV01::new(format!("snapshot project {}", error.message))
            }),
        );
    }
    errors
}

fn runtime_diagnostic_errors(
    label: &str,
    diagnostics: &[RuntimeDiagnostic],
) -> Vec<ValidationErrorV01> {
    let mut errors = Vec::new();
    if diagnostics
        .iter()
        .any(|diagnostic| diagnostic.message.is_empty())
    {
        errors.push(ValidationErrorV01::new(format!(
            "{label} diagnostics must include non-empty message"
        )));
    }
    errors
}

fn runtime_history_errors(history: &RuntimeHistory) -> Vec<ValidationErrorV01> {
    let mut errors = Vec::new();
    if history.schema != "skenion.runtime.history" {
        errors.push(ValidationErrorV01::new(format!(
            "expected history schema skenion.runtime.history, found {}",
            history.schema
        )));
    }
    if history.schema_version != "0.1.0" {
        errors.push(ValidationErrorV01::new(format!(
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
) -> Vec<ValidationErrorV01> {
    let mut errors = Vec::new();
    if entry.id.is_empty() {
        errors.push(ValidationErrorV01::new(format!(
            "{label} id must not be empty"
        )));
    }
    if entry.sequence == 0 {
        errors.push(ValidationErrorV01::new(format!(
            "{label} sequence must be at least 1"
        )));
    }
    if entry.created_at.is_empty() {
        errors.push(ValidationErrorV01::new(format!(
            "{label} createdAt must not be empty"
        )));
    }
    if entry
        .subject_event_id
        .as_ref()
        .is_some_and(String::is_empty)
    {
        errors.push(ValidationErrorV01::new(format!(
            "{label} subjectEventId must not be empty"
        )));
    }
    if entry.client_id.as_ref().is_some_and(String::is_empty) {
        errors.push(ValidationErrorV01::new(format!(
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
) -> Vec<ValidationErrorV01> {
    let mut errors = Vec::new();
    if let Some(operation) = &mutation.operation
        && let Err(report) = validate_runtime_operation_envelope(operation)
    {
        errors.extend(
            report.errors.into_iter().map(|error| {
                ValidationErrorV01::new(format!("{label} operation {}", error.message))
            }),
        );
    }
    if let Some(view_patch) = &mutation.view_patch {
        for operation in &view_patch.ops {
            match operation {
                RuntimeViewPatchOperation::SetNodeView { node_id, .. }
                | RuntimeViewPatchOperation::MoveNodeView { node_id, .. } => {
                    if node_id.is_empty() {
                        errors.push(ValidationErrorV01::new(format!(
                            "{label} viewPatch operation nodeId must not be empty"
                        )));
                    }
                }
            }
        }
    }
    if mutation.client_id.as_ref().is_some_and(String::is_empty) {
        errors.push(ValidationErrorV01::new(format!(
            "{label} clientId must not be empty"
        )));
    }
    errors
}

pub fn validate_node_definition_v01(
    definition: &NodeDefinitionManifestV01,
) -> Result<(), ValidationReportV01> {
    let mut errors = Vec::new();

    if definition.schema != "skenion.node.definition" {
        errors.push(ValidationErrorV01::new(format!(
            "expected schema skenion.node.definition, found {}",
            definition.schema
        )));
    }
    if definition.schema_version != "0.1.0" {
        errors.push(ValidationErrorV01::new(format!(
            "expected schemaVersion 0.1.0, found {}",
            definition.schema_version
        )));
    }
    errors.extend(duplicate_errors(
        definition
            .ports
            .iter()
            .map(|port| port.id.as_str())
            .collect(),
        &format!("port id on {}", definition.id),
    ));

    for port in &definition.ports {
        if is_legacy_control_port_type(&port.port_type) {
            errors.push(ValidationErrorV01::new(format!(
                "legacy port type on {}.{}: {}",
                definition.id, port.id, port.port_type
            )));
        }
        if let Some(accepted) = &port.accepts {
            for accepted_type in accepted {
                if is_legacy_control_port_type(accepted_type) {
                    errors.push(ValidationErrorV01::new(format!(
                        "legacy accepted port type on {}.{}: {}",
                        definition.id, port.id, accepted_type
                    )));
                }
            }
        }
        for error in
            message_selector_policy_errors(port, &format!("port {}.{}", definition.id, port.id))
        {
            errors.push(ValidationErrorV01::new(error));
        }
    }

    for group in definition.port_groups.as_deref().unwrap_or_default() {
        if is_legacy_control_port_type(&group.port_type) {
            errors.push(ValidationErrorV01::new(format!(
                "legacy port group type on {}.{}: {}",
                definition.id, group.id, group.port_type
            )));
        }
        if let Some(default_port) = &group.default_port_spec {
            if is_legacy_control_port_type(&default_port.port_type) {
                errors.push(ValidationErrorV01::new(format!(
                    "legacy default port type on {}.{}: {}",
                    definition.id, group.id, default_port.port_type
                )));
            }
            if let Some(accepted) = &default_port.accepts {
                for accepted_type in accepted {
                    if is_legacy_control_port_type(accepted_type) {
                        errors.push(ValidationErrorV01::new(format!(
                            "legacy default accepted port type on {}.{}: {}",
                            definition.id, group.id, accepted_type
                        )));
                    }
                }
            }
            for error in message_selector_policy_errors(
                default_port,
                &format!("port group {}.{} defaultPortSpec", definition.id, group.id),
            ) {
                errors.push(ValidationErrorV01::new(error));
            }
        }
        if group.max_ports.is_some_and(|max| max < group.min_ports) {
            errors.push(ValidationErrorV01::new(format!(
                "port group {}.{} maxPorts is less than minPorts",
                definition.id, group.id
            )));
        }
    }

    for permission in &definition.permissions {
        errors.push(ValidationErrorV01::new(format!(
            "unsupported permission: {permission}"
        )));
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(ValidationReportV01::new(errors))
    }
}

pub fn validate_extension_manifest_v01(
    manifest: &ExtensionManifestV01,
) -> Result<(), ValidationReportV01> {
    let mut errors = Vec::new();

    if manifest.schema != "skenion.extension.manifest" {
        errors.push(ValidationErrorV01::new(format!(
            "expected schema skenion.extension.manifest, found {}",
            manifest.schema
        )));
    }
    if manifest.schema_version != "0.1.0" {
        errors.push(ValidationErrorV01::new(format!(
            "expected schemaVersion 0.1.0, found {}",
            manifest.schema_version
        )));
    }
    if manifest.id.is_empty() {
        errors.push(ValidationErrorV01::new("extension id must not be empty"));
    }
    if manifest.version.is_empty() {
        errors.push(ValidationErrorV01::new(
            "extension version must not be empty",
        ));
    }
    if manifest.runtime_abi_version.is_empty() {
        errors.push(ValidationErrorV01::new(
            "extension runtimeAbiVersion must not be empty",
        ));
    }
    if manifest.kind == ExtensionKindV01::NativeRuntime && manifest.native.is_none() {
        errors.push(ValidationErrorV01::new(
            "native-runtime extension manifest must include native binding",
        ));
    }
    errors.extend(duplicate_errors(
        manifest
            .provides
            .nodes
            .iter()
            .map(|node| node.id.as_str())
            .collect(),
        "provided node id",
    ));

    for node in &manifest.provides.nodes {
        if let Err(report) = validate_node_definition_v01(node) {
            for error in report.errors() {
                errors.push(ValidationErrorV01::new(format!(
                    "provided node {}: {}",
                    node.id, error.message
                )));
            }
        }
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(ValidationReportV01::new(errors))
    }
}

fn graph_v01_semantic_errors(graph: &GraphDocumentV01, label: &str) -> Vec<ValidationErrorV01> {
    let mut errors = Vec::new();

    if graph.schema != "skenion.graph" {
        errors.push(ValidationErrorV01::new(format!(
            "{label} expected schema skenion.graph, found {}",
            graph.schema
        )));
    }
    if graph.schema_version != "0.1.0" {
        errors.push(ValidationErrorV01::new(format!(
            "{label} expected schemaVersion 0.1.0, found {}",
            graph.schema_version
        )));
    }

    for diagnostic in analyze_graph_document_v01(graph).diagnostics {
        if diagnostic.severity != "error" {
            continue;
        }
        errors.push(ValidationErrorV01::new(format!(
            "{label} {}: {}",
            diagnostic.code, diagnostic.message
        )));
    }

    errors
}

fn view_state_node_reference_errors(
    view_state: &ViewStateV01,
    graph: &GraphDocumentV01,
    label: &str,
) -> Vec<ValidationErrorV01> {
    let graph_node_ids: HashSet<&str> = graph.nodes.iter().map(|node| node.id.as_str()).collect();
    let mut errors = Vec::new();

    if view_state.schema != "skenion.view-state" {
        errors.push(ValidationErrorV01::new(format!(
            "{label} expected schema skenion.view-state, found {}",
            view_state.schema
        )));
    }
    if view_state.schema_version != "0.1.0" {
        errors.push(ValidationErrorV01::new(format!(
            "{label} expected schemaVersion 0.1.0, found {}",
            view_state.schema_version
        )));
    }

    for node_id in view_state.canvas.nodes.keys() {
        if !graph_node_ids.contains(node_id.as_str()) {
            errors.push(ValidationErrorV01::new(format!(
                "{label} references missing graph node: {node_id}"
            )));
        }
    }

    errors
}

pub fn validate_patch_definition_v01(
    patch: &PatchDefinitionV01,
) -> Result<(), ValidationReportV01> {
    let mut errors = Vec::new();

    if patch.id.is_empty() {
        errors.push(ValidationErrorV01::new("patch id must not be empty"));
    }
    if patch.revision.is_empty() {
        errors.push(ValidationErrorV01::new("patch revision must not be empty"));
    }

    errors.extend(graph_v01_semantic_errors(
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

    let contract = derive_patch_contract_v01(patch);
    let mut boundary_port_ids = HashSet::new();
    for port in &contract.ports {
        let port_id = port.port.id.as_str();
        if !boundary_port_ids.insert(port_id) {
            errors.push(ValidationErrorV01::new(format!(
                "duplicate boundary port id on patch {}: {}",
                patch.id, port_id
            )));
        }
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(ValidationReportV01::new(errors))
    }
}

pub fn validate_project_document_v01(
    project: &ProjectDocumentV01,
) -> Result<(), ValidationReportV01> {
    let mut errors = Vec::new();

    if project.schema != "skenion.project" {
        errors.push(ValidationErrorV01::new(format!(
            "expected schema skenion.project, found {}",
            project.schema
        )));
    }
    if project.schema_version != "0.1.0" {
        errors.push(ValidationErrorV01::new(format!(
            "expected schemaVersion 0.1.0, found {}",
            project.schema_version
        )));
    }
    if project.id.is_empty() {
        errors.push(ValidationErrorV01::new("project id must not be empty"));
    }
    if project.revision.is_empty() {
        errors.push(ValidationErrorV01::new(
            "project revision must not be empty",
        ));
    }

    errors.extend(graph_v01_semantic_errors(&project.graph, "root graph"));
    errors.extend(view_state_node_reference_errors(
        &project.view_state,
        &project.graph,
        "viewState",
    ));
    errors.extend(duplicate_errors(
        project
            .patch_library
            .iter()
            .map(|patch| patch.id.as_str())
            .collect(),
        "patch id",
    ));

    for patch in &project.patch_library {
        if let Err(report) = validate_patch_definition_v01(patch) {
            errors.extend(report.errors);
        }
    }
    errors.extend(project_package_reference_errors(project));

    if errors.is_empty() {
        Ok(())
    } else {
        Err(ValidationReportV01::new(errors))
    }
}

fn project_document_from_runtime_project_request(
    request: &RuntimeProjectRequestV01,
) -> ProjectDocumentV01 {
    ProjectDocumentV01 {
        schema: request.schema.clone(),
        schema_version: request.schema_version.clone(),
        id: request.id.clone(),
        revision: request.revision.clone(),
        metadata: request.metadata.clone(),
        graph: request.graph.clone(),
        view_state: request.view_state.clone(),
        patch_library: request.patch_library.clone(),
        package_dependencies: request.package_dependencies.clone(),
        package_lock: request.package_lock.clone(),
        resource_lock: request.resource_lock.clone(),
        object_bindings: request.object_bindings.clone(),
        tutorial: request.tutorial.clone(),
        help: request.help.clone(),
    }
}

fn requires_runtime_node_definition(kind: &str) -> bool {
    !matches!(kind, "core.inlet" | "core.outlet")
}

fn runtime_project_graph_node_definition_errors(
    graph: &GraphDocumentV01,
    label: &str,
    definition_keys: &HashSet<String>,
    versions_by_id: &HashMap<String, BTreeSet<String>>,
) -> Vec<ValidationErrorV01> {
    let mut errors = Vec::new();

    for node in &graph.nodes {
        if !requires_runtime_node_definition(&node.kind) {
            continue;
        }
        let required_key = format!("{}@{}", node.kind, node.kind_version);
        if definition_keys.contains(&required_key) {
            continue;
        }

        if let Some(provided_versions) = versions_by_id.get(&node.kind) {
            errors.push(ValidationErrorV01::new(format!(
                "node definition version mismatch: {required_key} ({label} node {}; provided versions: {})",
                node.id,
                provided_versions
                    .iter()
                    .cloned()
                    .collect::<Vec<_>>()
                    .join(", ")
            )));
        } else {
            errors.push(ValidationErrorV01::new(format!(
                "missing node definition: {required_key} ({label} node {})",
                node.id
            )));
        }
    }

    errors
}

pub fn validate_runtime_project_request_v01(
    request: &RuntimeProjectRequestV01,
) -> Result<(), ValidationReportV01> {
    let mut errors = Vec::new();
    let project = project_document_from_runtime_project_request(request);

    if let Err(report) = validate_project_document_v01(&project) {
        errors.extend(report.errors);
    }

    if request.nodes.is_empty() {
        errors.push(ValidationErrorV01::new(
            "runtime project request requires at least one node definition",
        ));
    }

    let definition_key_values = request
        .nodes
        .iter()
        .map(|definition| format!("{}@{}", definition.id, definition.version))
        .collect::<Vec<_>>();
    errors.extend(duplicate_errors(
        definition_key_values.iter().map(String::as_str).collect(),
        "runtime project node definition",
    ));

    let definition_keys = definition_key_values.into_iter().collect::<HashSet<_>>();
    let mut versions_by_id = HashMap::<String, BTreeSet<String>>::new();
    for definition in &request.nodes {
        versions_by_id
            .entry(definition.id.clone())
            .or_default()
            .insert(definition.version.clone());

        if let Err(report) = validate_node_definition_v01(definition) {
            errors.extend(report.errors.into_iter().map(|error| {
                ValidationErrorV01::new(format!(
                    "runtime project node {}@{}: {}",
                    definition.id, definition.version, error.message
                ))
            }));
        }
    }

    errors.extend(runtime_project_graph_node_definition_errors(
        &request.graph,
        "root graph",
        &definition_keys,
        &versions_by_id,
    ));
    for patch in &request.patch_library {
        errors.extend(runtime_project_graph_node_definition_errors(
            &patch.graph,
            &format!("patch {}", patch.id),
            &definition_keys,
            &versions_by_id,
        ));
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(ValidationReportV01::new(errors))
    }
}

pub fn validate_package_manifest_v01(
    manifest: &PackageManifestV01,
) -> Result<(), ValidationReportV01> {
    let mut errors = Vec::new();

    if manifest.schema != "skenion.package.manifest" {
        errors.push(ValidationErrorV01::new(format!(
            "expected schema skenion.package.manifest, found {}",
            manifest.schema
        )));
    }
    if manifest.schema_version != "0.1.0" {
        errors.push(ValidationErrorV01::new(format!(
            "expected schemaVersion 0.1.0, found {}",
            manifest.schema_version
        )));
    }
    if manifest.id.is_empty() {
        errors.push(ValidationErrorV01::new("package id must not be empty"));
    } else if !is_package_id_v01(&manifest.id) {
        errors.push(ValidationErrorV01::new(format!(
            "package id must match publisher/package lowercase digit hyphen grammar: {}",
            manifest.id
        )));
    }
    if manifest.version.is_empty() {
        errors.push(ValidationErrorV01::new("package version must not be empty"));
    } else if !is_package_semver_v01(&manifest.version) {
        errors.push(ValidationErrorV01::new(format!(
            "package version must be SemVer: {}",
            manifest.version
        )));
    }
    if manifest.checksums.is_empty() {
        errors.push(ValidationErrorV01::new(
            "package manifest requires checksum references",
        ));
    }
    if manifest.evidence.is_empty() {
        errors.push(ValidationErrorV01::new(
            "package manifest requires evidence references",
        ));
    }

    errors.extend(duplicate_errors(
        manifest
            .provides
            .patches
            .iter()
            .map(|provided| provided.id.as_str())
            .collect(),
        "provided patch id",
    ));
    for provided in &manifest.provides.patches {
        if !is_provided_id_v01(&provided.id) {
            errors.push(ValidationErrorV01::new(format!(
                "provided patch id must use lowercase dotted/hyphen grammar without underscores: {}",
                provided.id
            )));
        }
    }
    errors.extend(duplicate_errors(
        manifest
            .provides
            .nodes
            .iter()
            .map(|provided| provided.id.as_str())
            .collect(),
        "provided node id",
    ));
    for provided in &manifest.provides.nodes {
        if !is_provided_id_v01(&provided.id) {
            errors.push(ValidationErrorV01::new(format!(
                "provided node id must use lowercase dotted/hyphen grammar without underscores: {}",
                provided.id
            )));
        }
    }
    errors.extend(duplicate_errors(
        manifest
            .provides
            .resources
            .iter()
            .map(|provided| provided.id.as_str())
            .collect(),
        "provided resource id",
    ));
    for provided in &manifest.provides.resources {
        if !is_provided_id_v01(&provided.id) {
            errors.push(ValidationErrorV01::new(format!(
                "provided resource id must use lowercase dotted/hyphen grammar without underscores: {}",
                provided.id
            )));
        }
    }
    errors.extend(duplicate_errors(
        manifest
            .provides
            .help
            .iter()
            .map(|provided| provided.id.as_str())
            .collect(),
        "provided help id",
    ));
    for provided in &manifest.provides.help {
        if !is_provided_id_v01(&provided.id) {
            errors.push(ValidationErrorV01::new(format!(
                "provided help id must use lowercase dotted/hyphen grammar without underscores: {}",
                provided.id
            )));
        }
    }

    match manifest.category {
        PackageCategoryV01::Patch => {
            if manifest.runtime_abi_range.is_some() {
                errors.push(ValidationErrorV01::new(
                    "patch package must not declare runtimeAbiRange",
                ));
            }
            if !manifest.targets.is_empty() {
                errors.push(ValidationErrorV01::new(
                    "patch package must not declare targets",
                ));
            }
            if !manifest.native_artifacts.is_empty() {
                errors.push(ValidationErrorV01::new(
                    "patch package must not declare nativeArtifacts",
                ));
            }
        }
        PackageCategoryV01::Native | PackageCategoryV01::Mixed => {
            if manifest.runtime_abi_range.is_none() {
                errors.push(ValidationErrorV01::new(format!(
                    "{:?} package requires runtimeAbiRange",
                    manifest.category
                )));
            }
            if manifest.targets.is_empty() {
                errors.push(ValidationErrorV01::new(format!(
                    "{:?} package requires targets",
                    manifest.category
                )));
            }
            if manifest.native_artifacts.is_empty() {
                errors.push(ValidationErrorV01::new(format!(
                    "{:?} package requires nativeArtifacts",
                    manifest.category
                )));
            }
        }
    }

    let evidence_ids: HashSet<&str> = manifest
        .evidence
        .iter()
        .map(|evidence| evidence.id.as_str())
        .collect();
    for artifact in &manifest.native_artifacts {
        for evidence_ref in &artifact.evidence_refs {
            if !evidence_ids.contains(evidence_ref.as_str()) {
                errors.push(ValidationErrorV01::new(format!(
                    "native artifact {} references missing evidence: {}",
                    artifact.path, evidence_ref
                )));
            }
        }
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(ValidationReportV01::new(errors))
    }
}

pub fn validate_package_root_v01(root: &PackageRootDocumentV01) -> Result<(), ValidationReportV01> {
    let mut errors = Vec::new();

    if root.schema != "skenion.package.root" {
        errors.push(ValidationErrorV01::new(format!(
            "expected schema skenion.package.root, found {}",
            root.schema
        )));
    }
    if root.schema_version != "0.1.0" {
        errors.push(ValidationErrorV01::new(format!(
            "expected schemaVersion 0.1.0, found {}",
            root.schema_version
        )));
    }
    if root.manifest_file_name != SKENION_PACKAGE_MANIFEST_FILE_NAME {
        errors.push(ValidationErrorV01::new(format!(
            "package root manifestFileName must be {SKENION_PACKAGE_MANIFEST_FILE_NAME}"
        )));
    }
    if let Err(report) = validate_package_manifest_v01(&root.manifest) {
        for error in report.errors {
            errors.push(ValidationErrorV01::new(format!(
                "manifest {}",
                error.message
            )));
        }
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(ValidationReportV01::new(errors))
    }
}

fn package_listing_errors(listing: &PackageListingV01) -> Vec<ValidationErrorV01> {
    let mut errors = Vec::new();

    if listing.schema != "skenion.package.listing" {
        errors.push(ValidationErrorV01::new(format!(
            "expected schema skenion.package.listing, found {}",
            listing.schema
        )));
    }
    if listing.schema_version != "0.1.0" {
        errors.push(ValidationErrorV01::new(format!(
            "expected schemaVersion 0.1.0, found {}",
            listing.schema_version
        )));
    }
    if listing.package_id.is_empty() {
        errors.push(ValidationErrorV01::new("packageId must not be empty"));
    } else if !is_package_id_v01(&listing.package_id) {
        errors.push(ValidationErrorV01::new(format!(
            "packageId must match publisher/package lowercase digit hyphen grammar: {}",
            listing.package_id
        )));
    }
    if listing.version.is_empty() {
        errors.push(ValidationErrorV01::new(
            "package listing version must not be empty",
        ));
    } else if !is_package_semver_v01(&listing.version) {
        errors.push(ValidationErrorV01::new(format!(
            "package listing version must be SemVer: {}",
            listing.version
        )));
    }
    if listing.display_name.is_empty() {
        errors.push(ValidationErrorV01::new(
            "package listing displayName must not be empty",
        ));
    }
    if listing.summary.is_empty() {
        errors.push(ValidationErrorV01::new(
            "package listing summary must not be empty",
        ));
    }
    if listing.license.is_empty() {
        errors.push(ValidationErrorV01::new(
            "package listing license must not be empty",
        ));
    }
    if let Some(homepage_url) = &listing.homepage_url
        && !is_http_url_v01(homepage_url)
    {
        errors.push(ValidationErrorV01::new(format!(
            "package listing homepageUrl must be an http(s) URL: {homepage_url}"
        )));
    }
    if let Some(repository_url) = &listing.repository_url
        && !is_http_url_v01(repository_url)
    {
        errors.push(ValidationErrorV01::new(format!(
            "package listing repositoryUrl must be an http(s) URL: {repository_url}"
        )));
    }

    let contracts_lower_bound =
        compatibility_range_lower_bound(&listing.contracts.range).unwrap_or_default();
    if derive_v0_compatibility_line(contracts_lower_bound).as_deref()
        != Some(listing.contracts.line.as_str())
        || derive_v0_compatibility_range(contracts_lower_bound).as_deref()
            != Some(listing.contracts.range.as_str())
    {
        errors.push(ValidationErrorV01::new(
            "package listing contracts line must match contracts range",
        ));
    }
    if let Some(runtime_abi_range) = &listing.runtime_abi_range
        && !is_current_v0_compatibility_range(runtime_abi_range)
    {
        errors.push(ValidationErrorV01::new(
            "package listing runtimeAbiRange must be a current v0 compatibility range",
        ));
    }
    let mut target_support_targets = BTreeSet::new();
    for target in &listing.target_support.targets {
        if !target_support_targets.insert(target) {
            errors.push(ValidationErrorV01::new(format!(
                "duplicate package listing targetSupport target: {:?}",
                target
            )));
        }
    }
    match listing.target_support.kind {
        PackageListingTargetSupportKindV01::TargetIndependent => {
            if !listing.target_support.targets.is_empty() {
                errors.push(ValidationErrorV01::new(
                    "target-independent package listing targetSupport must not declare targets",
                ));
            }
        }
        PackageListingTargetSupportKindV01::Targeted => {
            if listing.target_support.targets.is_empty() {
                errors.push(ValidationErrorV01::new(
                    "targeted package listing targetSupport requires targets",
                ));
            }
        }
        PackageListingTargetSupportKindV01::Unavailable => {}
    }

    errors.extend(duplicate_errors(
        listing.tags.iter().map(String::as_str).collect(),
        "package listing tag",
    ));
    for tag in &listing.tags {
        if !is_package_tag_v01(tag) {
            errors.push(ValidationErrorV01::new(format!(
                "package listing tag must use lowercase hyphen grammar: {tag}"
            )));
        }
    }
    errors.extend(duplicate_errors(
        listing
            .provides
            .patches
            .iter()
            .map(|provided| provided.id.as_str())
            .collect(),
        "provided patch id",
    ));
    errors.extend(duplicate_errors(
        listing
            .provides
            .nodes
            .iter()
            .map(|provided| provided.id.as_str())
            .collect(),
        "provided node id",
    ));
    errors.extend(duplicate_errors(
        listing
            .provides
            .resources
            .iter()
            .map(|provided| provided.id.as_str())
            .collect(),
        "provided resource id",
    ));
    errors.extend(duplicate_errors(
        listing
            .provides
            .help
            .iter()
            .map(|provided| provided.id.as_str())
            .collect(),
        "provided help id",
    ));
    errors.extend(duplicate_errors(
        listing
            .provides
            .native_objects
            .iter()
            .map(|provided| provided.id.as_str())
            .collect(),
        "provided native object id",
    ));
    errors.extend(duplicate_errors(
        listing
            .provides
            .codecs
            .iter()
            .map(|provided| provided.id.as_str())
            .collect(),
        "provided codec id",
    ));
    errors.extend(duplicate_errors(
        listing
            .provides
            .capabilities
            .iter()
            .map(String::as_str)
            .collect(),
        "package capability",
    ));

    for provided in listing
        .provides
        .patches
        .iter()
        .chain(listing.provides.nodes.iter())
        .chain(listing.provides.resources.iter())
        .chain(listing.provides.help.iter())
        .chain(listing.provides.native_objects.iter())
        .chain(listing.provides.codecs.iter())
    {
        if !is_provided_id_v01(&provided.id) {
            errors.push(ValidationErrorV01::new(format!(
                "package listing provided id must use lowercase dotted/hyphen grammar without underscores: {}",
                provided.id
            )));
        }
    }
    for capability in &listing.provides.capabilities {
        if capability.is_empty() {
            errors.push(ValidationErrorV01::new(
                "package listing capability must not be empty",
            ));
        }
    }
    if !listing.discovery_signals.ranking_score.is_finite()
        || listing.discovery_signals.ranking_score < 0.0
    {
        errors.push(ValidationErrorV01::new(
            "package listing rankingScore must be a non-negative finite number",
        ));
    }

    if listing.artifact_evidence.artifacts.is_empty() {
        errors.push(ValidationErrorV01::new(
            "package listing requires artifact summaries",
        ));
    }
    if listing.artifact_evidence.evidence.is_empty() {
        errors.push(ValidationErrorV01::new(
            "package listing requires evidence summaries",
        ));
    }
    if !listing
        .artifact_evidence
        .artifacts
        .iter()
        .any(|artifact| matches!(artifact.kind, PackageListingArtifactKindV01::Manifest))
    {
        errors.push(ValidationErrorV01::new(
            "package listing requires manifest artifact evidence",
        ));
    }

    let evidence_ids: HashSet<&str> = listing
        .artifact_evidence
        .evidence
        .iter()
        .map(|evidence| evidence.id.as_str())
        .collect();
    for artifact in &listing.artifact_evidence.artifacts {
        if matches!(artifact.kind, PackageListingArtifactKindV01::NativeArtifact)
            && artifact.target.is_none()
        {
            errors.push(ValidationErrorV01::new(format!(
                "native artifact {} requires target",
                artifact.path
            )));
        }
        if !is_relative_path_v01(&artifact.path) {
            errors.push(ValidationErrorV01::new(format!(
                "listing artifact path must be relative and stay inside the package: {}",
                artifact.path
            )));
        }
        validate_package_checksum_v01(
            &mut errors,
            &format!("listing artifact {}", artifact.path),
            &artifact.checksum,
        );
        if artifact.evidence_refs.is_empty() {
            errors.push(ValidationErrorV01::new(format!(
                "listing artifact {} requires evidenceRefs",
                artifact.path
            )));
        }
        let evidence_ref_label = format!("listing artifact {} evidenceRef", artifact.path);
        errors.extend(duplicate_errors(
            artifact.evidence_refs.iter().map(String::as_str).collect(),
            &evidence_ref_label,
        ));
        for evidence_ref in &artifact.evidence_refs {
            if !evidence_ids.contains(evidence_ref.as_str()) {
                errors.push(ValidationErrorV01::new(format!(
                    "listing artifact {} references missing evidence: {}",
                    artifact.path, evidence_ref
                )));
            }
        }
    }
    for evidence in &listing.artifact_evidence.evidence {
        if evidence.id.is_empty() {
            errors.push(ValidationErrorV01::new(
                "listing evidence id must not be empty",
            ));
        }
        if !is_relative_path_v01(&evidence.path) {
            errors.push(ValidationErrorV01::new(format!(
                "listing evidence path must be relative and stay inside the package: {}",
                evidence.path
            )));
        }
        validate_package_checksum_v01(
            &mut errors,
            &format!("listing evidence {}", evidence.id),
            &evidence.checksum,
        );
    }

    let native_artifact_targets: BTreeSet<_> = listing
        .artifact_evidence
        .artifacts
        .iter()
        .filter_map(|artifact| match artifact.kind {
            PackageListingArtifactKindV01::NativeArtifact => artifact.target.clone(),
            PackageListingArtifactKindV01::Manifest
            | PackageListingArtifactKindV01::PackageArchive => None,
        })
        .collect();
    match listing.category {
        PackageCategoryV01::Patch => {
            if listing.runtime_abi_range.is_some() {
                errors.push(ValidationErrorV01::new(
                    "patch package listing must not declare runtimeAbiRange",
                ));
            }
            if listing.target_support.kind != PackageListingTargetSupportKindV01::TargetIndependent
            {
                errors.push(ValidationErrorV01::new(
                    "patch package listing targetSupport must be target-independent",
                ));
            }
            if !native_artifact_targets.is_empty() {
                errors.push(ValidationErrorV01::new(
                    "patch package listing must not declare native artifact summaries",
                ));
            }
        }
        PackageCategoryV01::Native | PackageCategoryV01::Mixed => {
            if listing.runtime_abi_range.is_none() {
                errors.push(ValidationErrorV01::new(format!(
                    "{:?} package listing requires runtimeAbiRange",
                    listing.category
                )));
            }
            if listing.target_support.kind == PackageListingTargetSupportKindV01::TargetIndependent
            {
                errors.push(ValidationErrorV01::new(format!(
                    "{:?} package listing targetSupport must not be target-independent",
                    listing.category
                )));
            }
            if native_artifact_targets.is_empty() {
                errors.push(ValidationErrorV01::new(format!(
                    "{:?} package listing requires native artifact summaries",
                    listing.category
                )));
            }
            for target in &listing.target_support.targets {
                if !native_artifact_targets.contains(target) {
                    errors.push(ValidationErrorV01::new(format!(
                        "package listing target {:?} has no native artifact summary",
                        target
                    )));
                }
            }
        }
    }

    errors
}

pub fn validate_package_listing_v01(
    listing: &PackageListingV01,
) -> Result<(), ValidationReportV01> {
    let errors = package_listing_errors(listing);

    if errors.is_empty() {
        Ok(())
    } else {
        Err(ValidationReportV01::new(errors))
    }
}

pub fn validate_package_discovery_response_v01(
    response: &PackageDiscoveryResponseV01,
) -> Result<(), ValidationReportV01> {
    let mut errors = Vec::new();

    if response.schema != "skenion.package.discovery" {
        errors.push(ValidationErrorV01::new(format!(
            "expected schema skenion.package.discovery, found {}",
            response.schema
        )));
    }
    if response.schema_version != "0.1.0" {
        errors.push(ValidationErrorV01::new(format!(
            "expected schemaVersion 0.1.0, found {}",
            response.schema_version
        )));
    }
    let listing_keys: Vec<String> = response
        .listings
        .iter()
        .map(|listing| format!("{}@{}", listing.package_id, listing.version))
        .collect();
    errors.extend(duplicate_errors(
        listing_keys.iter().map(String::as_str).collect(),
        "package listing",
    ));
    for listing in &response.listings {
        errors.extend(package_listing_errors(listing));
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(ValidationReportV01::new(errors))
    }
}

fn package_install_plan_expected_triple(
    target: &PackageInstallPlanTargetV01,
) -> PackageTargetTripleV01 {
    match (&target.os, &target.arch) {
        (PackageInstallPlanTargetOsV01::Macos, PackageInstallPlanTargetArchV01::Aarch64) => {
            PackageTargetTripleV01::Aarch64AppleDarwin
        }
        (PackageInstallPlanTargetOsV01::Macos, PackageInstallPlanTargetArchV01::X8664) => {
            PackageTargetTripleV01::X8664AppleDarwin
        }
        (PackageInstallPlanTargetOsV01::Windows, PackageInstallPlanTargetArchV01::Aarch64) => {
            PackageTargetTripleV01::Aarch64WindowsMsvc
        }
        (PackageInstallPlanTargetOsV01::Windows, PackageInstallPlanTargetArchV01::X8664) => {
            PackageTargetTripleV01::X8664WindowsMsvc
        }
        (PackageInstallPlanTargetOsV01::Linux, PackageInstallPlanTargetArchV01::Aarch64) => {
            PackageTargetTripleV01::Aarch64LinuxGnu
        }
        (PackageInstallPlanTargetOsV01::Linux, PackageInstallPlanTargetArchV01::X8664) => {
            PackageTargetTripleV01::X8664LinuxGnu
        }
    }
}

fn package_install_plan_target_errors(
    target: &PackageInstallPlanTargetV01,
) -> Vec<ValidationErrorV01> {
    let mut errors = Vec::new();
    let expected = package_install_plan_expected_triple(target);

    if target.triple != expected {
        errors.push(ValidationErrorV01::new(format!(
            "package install plan target {:?}/{:?} must use target triple {:?}",
            target.os, target.arch, expected
        )));
    }
    let contracts_lower_bound =
        compatibility_range_lower_bound(&target.contracts.range).unwrap_or_default();
    if derive_v0_compatibility_line(contracts_lower_bound).as_deref()
        != Some(target.contracts.line.as_str())
        || derive_v0_compatibility_range(contracts_lower_bound).as_deref()
            != Some(target.contracts.range.as_str())
    {
        errors.push(ValidationErrorV01::new(
            "package install plan target contracts line must match contracts range",
        ));
    }
    if let Some(runtime_abi_range) = &target.runtime_abi_range
        && !is_current_v0_compatibility_range(runtime_abi_range)
    {
        errors.push(ValidationErrorV01::new(
            "package install plan target runtimeAbiRange must be a current v0 compatibility range",
        ));
    }

    errors
}

fn package_install_plan_lock_entry_errors(
    lock_entry: &super::ProjectPackageLockEntryV01,
) -> Vec<ValidationErrorV01> {
    let mut errors = Vec::new();

    if !is_package_id_v01(&lock_entry.package_id) {
        errors.push(ValidationErrorV01::new(format!(
            "package install plan lock {} packageId must match publisher/package lowercase digit hyphen grammar: {}",
            lock_entry.id, lock_entry.package_id
        )));
    }
    if !is_relative_path_v01(&lock_entry.manifest_path) {
        errors.push(ValidationErrorV01::new(format!(
            "package install plan lock {} manifestPath must be relative and stay inside the package",
            lock_entry.id
        )));
    }
    validate_package_checksum_v01(
        &mut errors,
        &format!("package install plan lock {}", lock_entry.id),
        &lock_entry.manifest_checksum,
    );

    match lock_entry.category {
        PackageCategoryV01::Patch => {
            if lock_entry.runtime_abi_range.is_some() {
                errors.push(ValidationErrorV01::new(format!(
                    "patch package install plan lock {} must not declare runtimeAbiRange",
                    lock_entry.id
                )));
            }
            if lock_entry.target.is_some() {
                errors.push(ValidationErrorV01::new(format!(
                    "patch package install plan lock {} must not declare target",
                    lock_entry.id
                )));
            }
            if !lock_entry.native_artifacts.is_empty() {
                errors.push(ValidationErrorV01::new(format!(
                    "patch package install plan lock {} must not declare nativeArtifacts",
                    lock_entry.id
                )));
            }
        }
        PackageCategoryV01::Native | PackageCategoryV01::Mixed => {
            if lock_entry.runtime_abi_range.is_none() {
                errors.push(ValidationErrorV01::new(format!(
                    "{:?} package install plan lock {} requires runtimeAbiRange",
                    lock_entry.category, lock_entry.id
                )));
            }
            if lock_entry.target.is_none() {
                errors.push(ValidationErrorV01::new(format!(
                    "{:?} package install plan lock {} requires target",
                    lock_entry.category, lock_entry.id
                )));
            }
            if lock_entry.native_artifacts.is_empty() {
                errors.push(ValidationErrorV01::new(format!(
                    "{:?} package install plan lock {} requires nativeArtifacts",
                    lock_entry.category, lock_entry.id
                )));
            }
        }
    }

    errors
}

pub fn validate_package_install_plan_request_v01(
    request: &PackageInstallPlanRequestV01,
) -> Result<(), ValidationReportV01> {
    let mut errors = Vec::new();

    if request.schema != "skenion.package.install-plan.request" {
        errors.push(ValidationErrorV01::new(format!(
            "expected schema skenion.package.install-plan.request, found {}",
            request.schema
        )));
    }
    if request.schema_version != "0.1.0" {
        errors.push(ValidationErrorV01::new(format!(
            "expected schemaVersion 0.1.0, found {}",
            request.schema_version
        )));
    }
    if request.request_id.is_empty() {
        errors.push(ValidationErrorV01::new(
            "package install plan requestId must not be empty",
        ));
    }
    if !is_package_id_v01(&request.package_id) {
        errors.push(ValidationErrorV01::new(format!(
            "package install plan packageId must match publisher/package lowercase digit hyphen grammar: {}",
            request.package_id
        )));
    }
    if request.desired.version.is_none() && request.desired.version_range.is_none() {
        errors.push(ValidationErrorV01::new(
            "package install plan desired requires version or versionRange",
        ));
    }
    if let Some(version) = &request.desired.version
        && !is_package_semver_v01(version)
    {
        errors.push(ValidationErrorV01::new(format!(
            "package install plan desired version must be SemVer: {version}"
        )));
    }
    if let Some(version_range) = &request.desired.version_range
        && !is_current_v0_compatibility_range(version_range)
    {
        errors.push(ValidationErrorV01::new(
            "package install plan desired versionRange must be a current v0 compatibility range",
        ));
    }

    errors.extend(package_install_plan_target_errors(&request.target));
    errors.extend(duplicate_errors(
        request
            .current
            .package_lock
            .iter()
            .map(|entry| entry.id.as_str())
            .collect(),
        "package install plan lock entry id",
    ));
    errors.extend(duplicate_errors(
        request
            .current
            .object_bindings
            .iter()
            .map(|entry| entry.id.as_str())
            .collect(),
        "package install plan object binding id",
    ));

    let package_lock_ids: HashSet<&str> = request
        .current
        .package_lock
        .iter()
        .map(|entry| entry.id.as_str())
        .collect();
    if matches!(request.intent, PackageInstallPlanIntentV01::Update)
        && request.current.installed_lock_entry_id.is_none()
    {
        errors.push(ValidationErrorV01::new(
            "package install plan update requires installedLockEntryId",
        ));
    }
    if let Some(installed_lock_entry_id) = &request.current.installed_lock_entry_id
        && !package_lock_ids.contains(installed_lock_entry_id.as_str())
    {
        errors.push(ValidationErrorV01::new(format!(
            "package install plan references missing installedLockEntryId: {installed_lock_entry_id}"
        )));
    }

    for lock_entry in &request.current.package_lock {
        errors.extend(package_install_plan_lock_entry_errors(lock_entry));
    }
    for rollback_candidate in &request.rollback_candidates {
        errors.extend(package_install_plan_lock_entry_errors(rollback_candidate));
    }
    for binding in &request.current.object_bindings {
        if let Some(ProjectObjectBindingTargetV01::PackageProvider { lock_entry_id, .. }) =
            &binding.target
            && !package_lock_ids.contains(lock_entry_id.as_str())
        {
            errors.push(ValidationErrorV01::new(format!(
                "package install plan object binding {} references missing lockEntryId: {}",
                binding.id, lock_entry_id
            )));
        }
    }

    if request.candidates.is_empty() {
        errors.push(ValidationErrorV01::new(
            "package install plan request requires candidates",
        ));
    }
    for candidate in &request.candidates {
        errors.extend(package_listing_errors(&candidate.listing));
        if candidate.listing.package_id != request.package_id {
            errors.push(ValidationErrorV01::new(format!(
                "package install plan candidate {} does not match request packageId {}",
                candidate.listing.package_id, request.package_id
            )));
        }
        if let Some(manifest) = &candidate.manifest {
            if let Err(report) = validate_package_manifest_v01(manifest) {
                errors.extend(report.errors);
            }
            if manifest.id != candidate.listing.package_id {
                errors.push(ValidationErrorV01::new(format!(
                    "package install plan candidate manifest id {} does not match listing packageId {}",
                    manifest.id, candidate.listing.package_id
                )));
            }
            if manifest.version != candidate.listing.version {
                errors.push(ValidationErrorV01::new(format!(
                    "package install plan candidate manifest version {} does not match listing version {}",
                    manifest.version, candidate.listing.version
                )));
            }
        }
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(ValidationReportV01::new(errors))
    }
}

fn package_install_plan_action_errors(
    action: &super::PackageInstallPlanActionV01,
    index: usize,
) -> Vec<ValidationErrorV01> {
    let mut errors = Vec::new();

    if action.id.is_empty() {
        errors.push(ValidationErrorV01::new(
            "package install plan action id must not be empty",
        ));
    }
    if action.order != index as u64 {
        errors.push(ValidationErrorV01::new(format!(
            "package install plan action {} order must be {}",
            action.id, index
        )));
    }
    if !is_package_id_v01(&action.package_id) {
        errors.push(ValidationErrorV01::new(format!(
            "package install plan action {} packageId must match publisher/package lowercase digit hyphen grammar: {}",
            action.id, action.package_id
        )));
    }
    if let Some(version) = &action.version
        && !is_package_semver_v01(version)
    {
        errors.push(ValidationErrorV01::new(format!(
            "package install plan action {} version must be SemVer: {}",
            action.id, version
        )));
    }
    if let Some(artifact) = &action.artifact {
        if !is_relative_path_v01(&artifact.path) {
            errors.push(ValidationErrorV01::new(format!(
                "package install plan action {} artifact path must be relative and stay inside the package",
                action.id
            )));
        }
        validate_package_checksum_v01(
            &mut errors,
            &format!("package install plan action {} artifact", action.id),
            &artifact.checksum,
        );
        if artifact.evidence_refs.is_empty() {
            errors.push(ValidationErrorV01::new(format!(
                "package install plan action {} artifact requires evidenceRefs",
                action.id
            )));
        }
    }

    match action.kind {
        PackageInstallPlanActionKindV01::Download | PackageInstallPlanActionKindV01::Verify => {
            if action.version.is_none() {
                errors.push(ValidationErrorV01::new(format!(
                    "package install plan {:?} action {} requires version",
                    action.kind, action.id
                )));
            }
            if action.artifact.is_none() {
                errors.push(ValidationErrorV01::new(format!(
                    "package install plan {:?} action {} requires artifact",
                    action.kind, action.id
                )));
            }
            if action.evidence_refs.is_empty() {
                errors.push(ValidationErrorV01::new(format!(
                    "package install plan {:?} action {} requires evidenceRefs",
                    action.kind, action.id
                )));
            }
        }
        PackageInstallPlanActionKindV01::Stage => {
            if action.version.is_none() {
                errors.push(ValidationErrorV01::new(format!(
                    "package install plan stage action {} requires version",
                    action.id
                )));
            }
        }
        PackageInstallPlanActionKindV01::Replace => {
            if action.version.is_none()
                || action.lock_entry_id.is_none()
                || action.to_lock_entry_id.is_none()
            {
                errors.push(ValidationErrorV01::new(format!(
                    "package install plan replace action {} requires version, lockEntryId, and toLockEntryId",
                    action.id
                )));
            }
        }
        PackageInstallPlanActionKindV01::Disable | PackageInstallPlanActionKindV01::Keep => {
            if action.lock_entry_id.is_none() {
                errors.push(ValidationErrorV01::new(format!(
                    "package install plan {:?} action {} requires lockEntryId",
                    action.kind, action.id
                )));
            }
        }
        PackageInstallPlanActionKindV01::Rollback => {
            if action.lock_entry_id.is_none() || action.rollback_lock_entry_id.is_none() {
                errors.push(ValidationErrorV01::new(format!(
                    "package install plan rollback action {} requires lockEntryId and rollbackLockEntryId",
                    action.id
                )));
            }
        }
        PackageInstallPlanActionKindV01::Reject => {
            if action.diagnostic_refs.is_empty() {
                errors.push(ValidationErrorV01::new(format!(
                    "package install plan reject action {} requires diagnosticRefs",
                    action.id
                )));
            }
        }
    }

    errors
}

pub fn validate_package_install_plan_response_v01(
    response: &PackageInstallPlanResponseV01,
) -> Result<(), ValidationReportV01> {
    let mut errors = Vec::new();

    if response.schema != "skenion.package.install-plan.response" {
        errors.push(ValidationErrorV01::new(format!(
            "expected schema skenion.package.install-plan.response, found {}",
            response.schema
        )));
    }
    if response.schema_version != "0.1.0" {
        errors.push(ValidationErrorV01::new(format!(
            "expected schemaVersion 0.1.0, found {}",
            response.schema_version
        )));
    }
    if response.request_id.is_empty() {
        errors.push(ValidationErrorV01::new(
            "package install plan response requestId must not be empty",
        ));
    }
    if !is_package_id_v01(&response.package_id) {
        errors.push(ValidationErrorV01::new(format!(
            "package install plan response packageId must match publisher/package lowercase digit hyphen grammar: {}",
            response.package_id
        )));
    }
    if let Some(selected_version) = &response.selected_version
        && !is_package_semver_v01(selected_version)
    {
        errors.push(ValidationErrorV01::new(format!(
            "package install plan selectedVersion must be SemVer: {selected_version}"
        )));
    }
    errors.extend(package_install_plan_target_errors(&response.target));
    if response.checks.is_empty() {
        errors.push(ValidationErrorV01::new(
            "package install plan response requires checks",
        ));
    }

    errors.extend(duplicate_errors(
        response
            .actions
            .iter()
            .map(|action| action.id.as_str())
            .collect(),
        "package install plan action id",
    ));
    errors.extend(duplicate_errors(
        response
            .diagnostics
            .iter()
            .map(|diagnostic| diagnostic.id.as_str())
            .collect(),
        "package install plan diagnostic id",
    ));

    let diagnostic_ids: HashSet<&str> = response
        .diagnostics
        .iter()
        .map(|diagnostic| diagnostic.id.as_str())
        .collect();
    for diagnostic in &response.diagnostics {
        if diagnostic.id.is_empty() {
            errors.push(ValidationErrorV01::new(
                "package install plan diagnostic id must not be empty",
            ));
        }
        if diagnostic.message.is_empty() {
            errors.push(ValidationErrorV01::new(format!(
                "package install plan diagnostic {} message must not be empty",
                diagnostic.id
            )));
        }
    }
    for check in &response.checks {
        if matches!(check.status, PackageInstallPlanCheckStatusV01::Fail)
            && check.diagnostic_refs.is_empty()
        {
            errors.push(ValidationErrorV01::new(format!(
                "package install plan failing check {:?} requires diagnosticRefs",
                check.kind
            )));
        }
        for diagnostic_ref in &check.diagnostic_refs {
            if !diagnostic_ids.contains(diagnostic_ref.as_str()) {
                errors.push(ValidationErrorV01::new(format!(
                    "package install plan check {:?} references missing diagnostic {}",
                    check.kind, diagnostic_ref
                )));
            }
        }
    }
    for (index, action) in response.actions.iter().enumerate() {
        errors.extend(package_install_plan_action_errors(action, index));
        for diagnostic_ref in &action.diagnostic_refs {
            if !diagnostic_ids.contains(diagnostic_ref.as_str()) {
                errors.push(ValidationErrorV01::new(format!(
                    "package install plan action {} references missing diagnostic {}",
                    action.id, diagnostic_ref
                )));
            }
        }
        for capability_change in &action.capability_changes {
            if capability_change.id.is_empty() {
                errors.push(ValidationErrorV01::new(format!(
                    "package install plan action {} capability change id must not be empty",
                    action.id
                )));
            }
            if let Some(diagnostic_ref) = &capability_change.diagnostic_ref
                && !diagnostic_ids.contains(diagnostic_ref.as_str())
            {
                errors.push(ValidationErrorV01::new(format!(
                    "package install plan action {} capability change references missing diagnostic {}",
                    action.id, diagnostic_ref
                )));
            }
        }
    }

    let has_reject_action = response
        .actions
        .iter()
        .any(|action| matches!(action.kind, PackageInstallPlanActionKindV01::Reject));
    let has_error_diagnostic = response
        .diagnostics
        .iter()
        .any(|diagnostic| matches!(diagnostic.severity, PackageDiagnosticSeverityV01::Error));
    let has_failed_check = response
        .checks
        .iter()
        .any(|check| matches!(check.status, PackageInstallPlanCheckStatusV01::Fail));
    if response.ok {
        if has_failed_check {
            errors.push(ValidationErrorV01::new(
                "successful package install plan response must not include failed checks",
            ));
        }
        if has_reject_action {
            errors.push(ValidationErrorV01::new(
                "successful package install plan response must not include reject actions",
            ));
        }
    } else {
        if !has_reject_action {
            errors.push(ValidationErrorV01::new(
                "failed package install plan response requires a reject action",
            ));
        }
        if !has_error_diagnostic {
            errors.push(ValidationErrorV01::new(
                "failed package install plan response requires an error diagnostic",
            ));
        }
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(ValidationReportV01::new(errors))
    }
}

fn project_package_reference_errors(project: &ProjectDocumentV01) -> Vec<ValidationErrorV01> {
    let mut errors = Vec::new();
    let package_lock_by_id: HashMap<&str, _> = project
        .package_lock
        .iter()
        .map(|entry| (entry.id.as_str(), entry))
        .collect();

    errors.extend(duplicate_errors(
        project
            .package_lock
            .iter()
            .map(|entry| entry.id.as_str())
            .collect(),
        "package lock entry id",
    ));
    errors.extend(duplicate_errors(
        project
            .resource_lock
            .iter()
            .map(|entry| entry.id.as_str())
            .collect(),
        "resource lock entry id",
    ));
    errors.extend(duplicate_errors(
        project
            .object_bindings
            .iter()
            .map(|entry| entry.id.as_str())
            .collect(),
        "object binding id",
    ));

    for lock_entry in &project.package_lock {
        if !is_package_id_v01(&lock_entry.package_id) {
            errors.push(ValidationErrorV01::new(format!(
                "package lock {} packageId must match publisher/package lowercase digit hyphen grammar: {}",
                lock_entry.id, lock_entry.package_id
            )));
        }
        match lock_entry.category {
            PackageCategoryV01::Patch => {
                if lock_entry.runtime_abi_range.is_some() {
                    errors.push(ValidationErrorV01::new(format!(
                        "patch package lock {} must not declare runtimeAbiRange",
                        lock_entry.id
                    )));
                }
                if lock_entry.target.is_some() {
                    errors.push(ValidationErrorV01::new(format!(
                        "patch package lock {} must not declare target",
                        lock_entry.id
                    )));
                }
                if !lock_entry.native_artifacts.is_empty() {
                    errors.push(ValidationErrorV01::new(format!(
                        "patch package lock {} must not declare nativeArtifacts",
                        lock_entry.id
                    )));
                }
            }
            PackageCategoryV01::Native | PackageCategoryV01::Mixed => {
                if lock_entry.runtime_abi_range.is_none() {
                    errors.push(ValidationErrorV01::new(format!(
                        "{:?} package lock {} requires runtimeAbiRange",
                        lock_entry.category, lock_entry.id
                    )));
                }
                if lock_entry.target.is_none() {
                    errors.push(ValidationErrorV01::new(format!(
                        "{:?} package lock {} requires target",
                        lock_entry.category, lock_entry.id
                    )));
                }
                if lock_entry.native_artifacts.is_empty() {
                    errors.push(ValidationErrorV01::new(format!(
                        "{:?} package lock {} requires nativeArtifacts",
                        lock_entry.category, lock_entry.id
                    )));
                }
            }
        }
    }

    for dependency in &project.package_dependencies {
        if !is_package_id_v01(&dependency.package_id) {
            errors.push(ValidationErrorV01::new(format!(
                "package dependency packageId must match publisher/package lowercase digit hyphen grammar: {}",
                dependency.package_id
            )));
        }
        let Some(lock_entry) = package_lock_by_id.get(dependency.lock_entry_id.as_str()) else {
            errors.push(ValidationErrorV01::new(format!(
                "package dependency {} references missing lockEntryId: {}",
                dependency.package_id, dependency.lock_entry_id
            )));
            continue;
        };
        if dependency.package_id != lock_entry.package_id {
            errors.push(ValidationErrorV01::new(format!(
                "package dependency {} lockEntryId {} points to package {}",
                dependency.package_id, dependency.lock_entry_id, lock_entry.package_id
            )));
        }
        if !satisfies_v0_compatibility_range(&lock_entry.version, &dependency.version_range) {
            errors.push(ValidationErrorV01::new(format!(
                "package dependency {} locked version {} does not satisfy {}",
                dependency.package_id, lock_entry.version, dependency.version_range
            )));
        }
    }

    for resource in &project.resource_lock {
        if !package_lock_by_id.contains_key(resource.lock_entry_id.as_str()) {
            errors.push(ValidationErrorV01::new(format!(
                "resource lock {} references missing lockEntryId: {}",
                resource.id, resource.lock_entry_id
            )));
        }
        if !is_provided_id_v01(&resource.resource_id) {
            errors.push(ValidationErrorV01::new(format!(
                "resource lock {} resourceId must use lowercase dotted/hyphen grammar without underscores: {}",
                resource.id, resource.resource_id
            )));
        }
    }

    let patch_by_id: HashMap<&str, _> = project
        .patch_library
        .iter()
        .map(|patch| (patch.id.as_str(), patch))
        .collect();
    let binding_ids: HashSet<&str> = project
        .object_bindings
        .iter()
        .map(|binding| binding.id.as_str())
        .collect();
    for node in project.graph.nodes.iter().chain(
        project
            .patch_library
            .iter()
            .flat_map(|patch| patch.graph.nodes.iter()),
    ) {
        if let Some(binding_ref) = &node.binding_ref
            && !binding_ids.contains(binding_ref.as_str())
        {
            errors.push(ValidationErrorV01::new(format!(
                "node {} references missing bindingRef: {}",
                node.id, binding_ref
            )));
        }
    }

    for binding in &project.object_bindings {
        let has_diagnostic = |codes: &[ProjectObjectBindingDiagnosticCodeV01]| {
            binding
                .diagnostics
                .iter()
                .any(|diagnostic| codes.contains(&diagnostic.code))
        };

        if binding.status == ProjectObjectBindingStatusV01::Resolved && binding.target.is_none() {
            errors.push(ValidationErrorV01::new(format!(
                "resolved object binding {} requires target",
                binding.id
            )));
            continue;
        }
        if binding.status == ProjectObjectBindingStatusV01::Missing
            && !has_diagnostic(&[ProjectObjectBindingDiagnosticCodeV01::BindingTargetMissing])
        {
            errors.push(ValidationErrorV01::new(format!(
                "missing object binding {} requires binding-target-missing diagnostic",
                binding.id
            )));
        }
        if binding.status == ProjectObjectBindingStatusV01::Stale
            && !has_diagnostic(&[
                ProjectObjectBindingDiagnosticCodeV01::BindingTargetStale,
                ProjectObjectBindingDiagnosticCodeV01::BindingInterfaceDrift,
            ])
        {
            errors.push(ValidationErrorV01::new(format!(
                "stale object binding {} requires stale or interface-drift diagnostic",
                binding.id
            )));
        }
        if binding.status == ProjectObjectBindingStatusV01::Unresolved
            && !has_diagnostic(&[ProjectObjectBindingDiagnosticCodeV01::BindingUnresolved])
        {
            errors.push(ValidationErrorV01::new(format!(
                "unresolved object binding {} requires binding-unresolved diagnostic",
                binding.id
            )));
        }
        if binding.status == ProjectObjectBindingStatusV01::Ambiguous
            && !has_diagnostic(&[ProjectObjectBindingDiagnosticCodeV01::BindingAmbiguous])
        {
            errors.push(ValidationErrorV01::new(format!(
                "ambiguous object binding {} requires binding-ambiguous diagnostic",
                binding.id
            )));
        }

        match &binding.target {
            Some(ProjectObjectBindingTargetV01::ProjectPatch {
                patch_id, revision, ..
            }) => {
                let Some(patch) = patch_by_id.get(patch_id.as_str()) else {
                    if binding.status == ProjectObjectBindingStatusV01::Resolved {
                        errors.push(ValidationErrorV01::new(format!(
                            "resolved object binding {} references missing project patch: {}",
                            binding.id, patch_id
                        )));
                    } else if binding.status != ProjectObjectBindingStatusV01::Missing
                        && binding.status != ProjectObjectBindingStatusV01::Stale
                    {
                        errors.push(ValidationErrorV01::new(format!(
                            "object binding {} references missing project patch: {}",
                            binding.id, patch_id
                        )));
                    }
                    continue;
                };
                if revision
                    .as_ref()
                    .is_some_and(|revision| revision != &patch.revision)
                {
                    if binding.status == ProjectObjectBindingStatusV01::Resolved {
                        errors.push(ValidationErrorV01::new(format!(
                            "resolved object binding {} project patch {} revision is stale",
                            binding.id, patch_id
                        )));
                    } else if binding.status != ProjectObjectBindingStatusV01::Stale
                        || !has_diagnostic(&[
                            ProjectObjectBindingDiagnosticCodeV01::BindingTargetStale,
                            ProjectObjectBindingDiagnosticCodeV01::BindingInterfaceDrift,
                        ])
                    {
                        errors.push(ValidationErrorV01::new(format!(
                            "object binding {} project patch {} revision is stale without diagnostics",
                            binding.id, patch_id
                        )));
                    }
                }
            }
            Some(ProjectObjectBindingTargetV01::PackageProvider {
                lock_entry_id,
                package_id,
                provided_id,
                ..
            }) => {
                if !is_package_id_v01(package_id) {
                    errors.push(ValidationErrorV01::new(format!(
                        "object binding {} packageId must match publisher/package lowercase digit hyphen grammar: {}",
                        binding.id, package_id
                    )));
                }
                if !is_provided_id_v01(provided_id) {
                    errors.push(ValidationErrorV01::new(format!(
                        "object binding {} providedId must use lowercase dotted/hyphen grammar without underscores: {}",
                        binding.id, provided_id
                    )));
                }
                let Some(lock_entry) = package_lock_by_id.get(lock_entry_id.as_str()) else {
                    if binding.status == ProjectObjectBindingStatusV01::Resolved {
                        errors.push(ValidationErrorV01::new(format!(
                            "resolved object binding {} references missing lockEntryId: {}",
                            binding.id, lock_entry_id
                        )));
                    } else if binding.status != ProjectObjectBindingStatusV01::Missing
                        && binding.status != ProjectObjectBindingStatusV01::Stale
                    {
                        errors.push(ValidationErrorV01::new(format!(
                            "object binding {} references missing lockEntryId: {}",
                            binding.id, lock_entry_id
                        )));
                    }
                    continue;
                };
                if package_id != &lock_entry.package_id {
                    errors.push(ValidationErrorV01::new(format!(
                        "object binding {} packageId {} does not match lock entry package {}",
                        binding.id, package_id, lock_entry.package_id
                    )));
                }
            }
            None => {}
        }
    }

    errors
}

#[cfg(test)]
mod tests {
    use super::super::RuntimeDiagnosticSeverity;
    use super::*;
    use crate::v0_1::{
        EdgeEndpointV01, FeedbackPolicyV01, GraphFragmentV01, GraphNodeV01, GraphTargetRef,
        IdConflictPolicy, IdRemapResult, PasteGraphFragmentOptions, PasteGraphFragmentRequest,
        PasteGraphFragmentResponse, PatchPath, RuntimeCollaborationEventEnvelope,
        RuntimeCollaborationOperationBatch, RuntimeCollaborationOperationEnvelope,
        RuntimeCollaborationOperationResult, RuntimeCollaborationPresenceEnvelope,
        RuntimeCollaborationSelectionEnvelope, RuntimeEventReplayGap, RuntimeEventReplayGapReason,
        RuntimeHistoryEntry, RuntimeOperationDiagnostic, RuntimeOperationEnvelope,
        RuntimeSessionEvent, RuntimeSessionInfoResponse, StringOrStringsV01,
    };
    use serde_json::json;
    use std::collections::BTreeMap;

    fn graph(json: &str) -> GraphDocumentV01 {
        serde_json::from_str(json).expect("graph should parse")
    }

    fn node(json: &str) -> NodeDefinitionManifestV01 {
        serde_json::from_str(json).expect("node should parse")
    }

    fn value(json: &str) -> serde_json::Value {
        serde_json::from_str(json).expect("json value should parse")
    }

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

    fn base_graph() -> GraphDocumentV01 {
        graph(
            r#"{
              "schema": "skenion.graph",
              "schemaVersion": "0.1.0",
              "id": "base",
              "revision": "1",
              "nodes": [
                {
                  "id": "source",
                  "kind": "core.float",
                  "kindVersion": "0.1.0",
                  "params": {},
                  "ports": [
                    { "id": "out", "direction": "output", "type": "control.number.float" }
                  ]
                },
                {
                  "id": "target",
                  "kind": "core.float",
                  "kindVersion": "0.1.0",
                  "params": {},
                  "ports": [
                    { "id": "in", "direction": "input", "type": "control.number.float" }
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

    fn base_fragment() -> GraphFragmentV01 {
        let graph = base_graph();
        GraphFragmentV01 {
            schema: "skenion.graph.fragment".to_owned(),
            schema_version: "0.1.0".to_owned(),
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

    fn paste_request(fragment: GraphFragmentV01) -> PasteGraphFragmentRequest {
        PasteGraphFragmentRequest {
            target: root_target(),
            fragment,
            placement: None,
            options: None,
        }
    }

    fn runtime_operation(fragment: GraphFragmentV01) -> RuntimeOperationEnvelope {
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

    fn collaboration_causal(participant_id: &str, sequence: u64) -> serde_json::Value {
        let json = format!(
            r#"{{
              "baseRevision": "root-rev-{sequence}",
              "baseSequence": {sequence},
              "vector": {{ "{participant_id}": {sequence} }}
            }}"#
        );
        value(&json)
    }

    fn collaboration_ack(sequence: u64) -> serde_json::Value {
        let json = format!(
            r#"{{
              "sequence": {sequence},
              "revision": "root-rev-{sequence}",
              "serverClock": {{
                "revision": "root-rev-{sequence}",
                "sequence": {sequence},
                "vector": {{ "participant-a": {sequence} }}
              }},
              "appliedAt": "2026-06-22T00:00:00.050Z"
            }}"#
        );
        value(&json)
    }

    fn collaboration_nack(reason: &str) -> serde_json::Value {
        let json = format!(
            r#"{{
              "reason": "{reason}",
              "retryable": false,
              "diagnostics": [
                {{
                  "severity": "error",
                  "code": "{reason}",
                  "message": "operation was rejected"
                }}
              ]
            }}"#
        );
        value(&json)
    }

    fn collaboration_rebase_value() -> serde_json::Value {
        value(
            r#"{
              "from": {
                "baseRevision": "root-rev-1",
                "baseSequence": 1,
                "vector": { "participant-a": 1 }
              },
              "to": {
                "baseRevision": "root-rev-2",
                "baseSequence": 2,
                "vector": { "participant-a": 2 }
              },
              "strategy": "ot-transform",
              "conflicts": []
            }"#,
        )
    }

    fn collaboration_undo_redo_payload(participant_id: &str) -> serde_json::Value {
        let json = format!(
            r#"{{
              "kind": "undoRedo",
              "action": "undo",
              "scope": {{ "kind": "participant", "participantId": "{participant_id}" }},
              "maxOperations": 1
            }}"#
        );
        value(&json)
    }

    fn collaboration_operation_value(payload: serde_json::Value) -> serde_json::Value {
        let mut operation = value(
            r#"{
              "schema": "skenion.runtime.collaboration.operation",
              "schemaVersion": "0.1.0",
              "operationId": "op-collab-test",
              "sessionId": "session-collab-a",
              "participantId": "participant-a",
              "idempotencyKey": "session-collab-a:participant-a:test",
              "causal": null,
              "payload": null,
              "submittedAt": "2026-06-22T00:00:00.000Z"
            }"#,
        );
        operation["causal"] = collaboration_causal("participant-a", 1);
        operation["payload"] = payload;
        operation
    }

    fn collaboration_operation(
        payload: serde_json::Value,
    ) -> RuntimeCollaborationOperationEnvelope {
        serde_json::from_value(collaboration_operation_value(payload))
            .expect("collaboration operation should parse")
    }

    fn collaboration_result_value(status: &str) -> serde_json::Value {
        let mut result = value(
            r#"{
              "schema": "skenion.runtime.collaboration.operation-result",
              "schemaVersion": "0.1.0",
              "sessionId": "session-collab-a",
              "operationId": "op-collab-test",
              "participantId": "participant-a",
              "idempotencyKey": "session-collab-a:participant-a:test",
              "status": "accepted",
              "causal": null,
              "diagnostics": [],
              "createdAt": "2026-06-22T00:00:00.050Z"
            }"#,
        );
        result["status"] = serde_json::Value::String(status.to_owned());
        result["causal"] = collaboration_causal("participant-a", 2);
        result
    }

    fn accepted_collaboration_result_value() -> serde_json::Value {
        let mut result = collaboration_result_value("accepted");
        result["ack"] = collaboration_ack(2);
        result
    }

    fn collaboration_presence_value() -> serde_json::Value {
        value(
            r#"{
              "schema": "skenion.runtime.collaboration.presence",
              "schemaVersion": "0.1.0",
              "sessionId": "session-collab-a",
              "participantId": "participant-a",
              "presence": {
                "state": "active",
                "displayName": "Ada",
                "connectionId": "conn-a",
                "clientWindowId": "window-a"
              },
              "authSubject": {
                "kind": "user",
                "subjectId": "user-123",
                "issuer": "local-dev"
              },
              "updatedAt": "2026-06-22T00:00:02.000Z",
              "expiresAt": "2026-06-22T00:00:17.000Z"
            }"#,
        )
    }

    fn collaboration_selection_value() -> serde_json::Value {
        value(
            r#"{
              "schema": "skenion.runtime.collaboration.selection",
              "schemaVersion": "0.1.0",
              "sessionId": "session-collab-a",
              "participantId": "participant-a",
              "target": {
                "path": { "kind": "root" },
                "baseRevision": "root-rev-2"
              },
              "selection": {
                "ranges": [
                  { "kind": "nodes", "nodeIds": ["source"] },
                  {
                    "kind": "ports",
                    "endpoints": [
                      { "nodeId": "source", "portId": "out" }
                    ]
                  },
                  {
                    "kind": "text",
                    "anchor": { "nodeId": "message-1", "field": "text", "offset": 0 },
                    "focus": { "nodeId": "message-1", "field": "text", "offset": 5 }
                  }
                ],
                "activeRangeIndex": 2
              },
              "cursor": {
                "kind": "node",
                "nodeId": "source",
                "portId": "out",
                "clientWindowId": "window-a"
              },
              "updatedAt": "2026-06-22T00:00:03.000Z",
              "expiresAt": "2026-06-22T00:00:08.000Z"
            }"#,
        )
    }

    fn collaboration_event_value() -> serde_json::Value {
        let mut event = value(
            r#"{
              "schema": "skenion.runtime.collaboration.event",
              "schemaVersion": "0.1.0",
              "eventId": "event-collab-test",
              "sessionId": "session-collab-a",
              "sequence": 2,
              "causal": null,
              "kind": "operation-result",
              "payload": {
                "kind": "operationResult",
                "result": null
              },
              "replay": {
                "cursor": "2",
                "previousCursor": "1",
                "replayed": false,
                "gap": null,
                "overflow": false
              },
              "createdAt": "2026-06-22T00:00:00.050Z"
            }"#,
        );
        event["causal"] = collaboration_causal("participant-a", 2);
        event["payload"]["result"] = accepted_collaboration_result_value();
        event
    }

    fn runtime_session_info() -> RuntimeSessionInfoResponse {
        serde_json::from_str(
            r#"{
              "schema": "skenion.runtime.session.info",
              "schemaVersion": "0.1.0",
              "ok": true,
              "sessionId": "session-a",
              "lifecycle": "ready",
              "snapshot": {
                "sessionRevision": 1,
                "viewRevision": 1,
                "controlRevision": 1,
                "project": null,
                "diagnostics": [],
                "plan": null
              },
              "profile": {
                "mode": "local-managed",
                "ownership": "owned-child",
                "endpoint": { "url": "http://127.0.0.1:49231", "protocol": "http" },
                "process": { "ownedByHost": true }
              },
              "capabilities": {
                "sessionAddressing": true,
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
        .expect("session info should parse")
    }

    fn runtime_session_event() -> RuntimeSessionEvent {
        serde_json::from_str(
            r#"{
              "schema": "skenion.runtime.session.event",
              "schemaVersion": "0.1.0",
              "id": "event-1",
              "sessionId": "session-a",
              "sequence": 1,
              "sessionRevision": 1,
              "kind": "snapshot",
              "snapshot": {
                "sessionRevision": 1,
                "viewRevision": 1,
                "controlRevision": 1,
                "project": null,
                "diagnostics": [],
                "plan": null
              },
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
            }"#,
        )
        .expect("session event should parse")
    }

    fn runtime_session_mutation_event(
        mutation: serde_json::Value,
        inverse_mutation: serde_json::Value,
    ) -> serde_json::Value {
        let mut event = value(
            r#"{
              "schema": "skenion.runtime.session.event",
              "schemaVersion": "0.1.0",
              "id": "event-mutate",
              "sessionId": "session-a",
              "sequence": 2,
              "sessionRevision": 2,
              "kind": "mutate",
              "snapshot": {
                "sessionRevision": 2,
                "viewRevision": 2,
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
                    "id": "history-2",
                    "sequence": 2,
                    "kind": "apply",
                    "mutation": null,
                    "inverseMutation": null,
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
            }"#,
        );
        event["history"]["entries"][0]["mutation"] = mutation;
        event["history"]["entries"][0]["inverseMutation"] = inverse_mutation;
        event
    }

    fn runtime_operation_mutation(extra_operation_key: bool) -> serde_json::Value {
        let mut mutation = value(
            r#"{
              "operation": {
                "schema": "skenion.runtime.operation",
                "schemaVersion": "0.1.0",
                "id": "op-runtime-paste",
                "kind": "pasteGraphFragment",
                "request": {
                  "target": {
                    "path": { "kind": "root" },
                    "baseRevision": "1"
                  },
                  "fragment": {
                    "schema": "skenion.graph.fragment",
                    "schemaVersion": "0.1.0",
                    "nodes": [
                      {
                        "id": "float_1",
                        "kind": "core.float",
                        "kindVersion": "0.1.0",
                        "params": { "value": 0.5 },
                        "ports": [
                          { "id": "out", "direction": "output", "type": "control.number.float", "rate": "control" }
                        ]
                      }
                    ],
                    "edges": []
                  },
                  "placement": { "kind": "position", "x": 0, "y": 0 }
                },
                "correlationId": "runtime-paste-test"
              }
            }"#,
        );
        if extra_operation_key {
            mutation["operation"]["unexpected"] = serde_json::Value::Bool(true);
        }
        mutation
    }

    fn runtime_view_patch_mutation(extra_operation_key: bool) -> serde_json::Value {
        let mut mutation = value(
            r#"{
              "viewPatch": {
                "baseViewRevision": 1,
                "ops": [
                  {
                    "op": "setNodeView",
                    "nodeId": "float_1",
                    "view": { "x": 0, "y": 0 }
                  }
                ]
              }
            }"#,
        );
        if extra_operation_key {
            mutation["viewPatch"]["ops"][0]["unexpected"] = serde_json::Value::Bool(true);
        }
        mutation
    }

    fn fully_valid_runtime_operation_mutation() -> serde_json::Value {
        let mut mutation = runtime_operation_mutation(false);
        mutation["viewPatch"] = runtime_view_patch_mutation(false)["viewPatch"].clone();
        mutation["clientId"] = serde_json::Value::String("studio-main".to_owned());
        mutation["description"] =
            serde_json::Value::String("exercise active runtime operation branch".to_owned());
        mutation
    }

    #[test]
    fn rejects_extra_nested_runtime_patch_operation_keys_at_parse_boundary() {
        serde_json::from_value::<RuntimeSessionEvent>(runtime_session_mutation_event(
            json!({}),
            json!({}),
        ))
        .expect("empty mutation requests should parse");

        let legacy_graph_patch = runtime_session_mutation_event(
            json!({ "graphPatch": null }),
            runtime_view_patch_mutation(false),
        );
        let legacy_graph_patch_error =
            serde_json::from_value::<RuntimeSessionEvent>(legacy_graph_patch)
                .expect_err("legacy graphPatch should fail");
        assert!(
            legacy_graph_patch_error
                .to_string()
                .contains("unknown field `graphPatch`")
        );

        let operation_extra = runtime_session_mutation_event(
            runtime_operation_mutation(true),
            runtime_view_patch_mutation(false),
        );
        let operation_error = serde_json::from_value::<RuntimeSessionEvent>(operation_extra)
            .expect_err("extra nested runtime operation key should fail");
        assert!(
            operation_error
                .to_string()
                .contains("unknown field `unexpected`")
        );

        let view_extra = runtime_session_mutation_event(
            runtime_operation_mutation(false),
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
    fn validates_complete_runtime_mutation_patch_branches() {
        let event: RuntimeSessionEvent = serde_json::from_value(runtime_session_mutation_event(
            fully_valid_runtime_operation_mutation(),
            fully_valid_runtime_operation_mutation(),
        ))
        .expect("valid mutation event should parse");

        validate_runtime_session_event(&event).expect("valid mutation event should validate");
    }

    #[test]
    fn validates_project_document_branches_in_unit_target() {
        let graph = serde_json::to_value(base_graph()).expect("base graph should serialize");
        let mut project: ProjectDocumentV01 = serde_json::from_value(json!({
            "schema": "skenion.project",
            "schemaVersion": "0.1.0",
            "id": "project-unit",
            "revision": "1",
            "graph": graph.clone(),
            "viewState": {
                "schema": "skenion.view-state",
                "schemaVersion": "0.1.0",
                "canvas": {
                    "nodes": {
                        "source": { "x": 0, "y": 0 },
                        "target": { "x": 120, "y": 0 }
                    }
                }
            },
            "patchLibrary": [
                {
                    "id": "patch-unit",
                    "revision": "1",
                    "graph": graph,
                    "viewState": {
                        "schema": "skenion.view-state",
                        "schemaVersion": "0.1.0",
                        "canvas": {
                            "nodes": {
                                "source": { "x": 0, "y": 0 },
                                "target": { "x": 120, "y": 0 }
                            }
                        }
                    }
                }
            ]
        }))
        .expect("project should parse");

        validate_project_document_v01(&project).expect("project should validate");

        project.schema = "wrong".to_owned();
        project.patch_library.push(project.patch_library[0].clone());
        project.view_state.schema = "wrong.view".to_owned();
        project.view_state.schema_version = "9.9.9".to_owned();
        project.view_state.canvas.nodes.insert(
            "missing-node".to_owned(),
            crate::v0_1::CanvasNodeViewV01 {
                x: 1.0,
                y: 1.0,
                width: None,
                height: None,
                collapsed: None,
            },
        );
        let report = validate_project_document_v01(&project).expect_err("project should fail");
        assert!(report.errors().len() >= 3);
        let text = report.to_string();
        assert!(text.contains("expected schema skenion.project"));
        assert!(text.contains("viewState expected schema skenion.view-state"));
        assert!(text.contains("viewState expected schemaVersion 0.1.0"));
        assert!(text.contains("viewState references missing graph node"));
        assert!(text.contains("duplicate patch id"));
    }

    #[test]
    fn validates_type_helper_unit_target_branches() {
        let one = StringOrStringsV01::One("f32".to_owned());
        assert_eq!(one.values(), vec!["f32"]);

        let many = StringOrStringsV01::Many(vec!["f32".to_owned(), "i32".to_owned()]);
        assert_eq!(many.values(), vec!["f32", "i32"]);

        let event_message_any = data_type(DataFlowV01::Event, "message.any");
        let bang_event = data_type(DataFlowV01::Event, "event.bang");
        assert!(compatible_data_types_v01(&event_message_any, &bang_event));

        let control_message_any = data_type(DataFlowV01::Control, "message.any");
        let control_string = data_type(DataFlowV01::Control, "string");
        assert!(compatible_data_types_v01(
            &control_message_any,
            &control_string
        ));
        assert!(compatible_data_types_v01(&bang_event, &control_message_any));

        let signal_any = data_type(DataFlowV01::Signal, "message.any");
        let signal_number = data_type(DataFlowV01::Signal, "number.float");
        assert!(!compatible_data_types_v01(&signal_any, &signal_number));

        assert_eq!(type_label_v01(&bang_event), "event<event.bang>");
        assert_eq!(type_label_v01(&control_message_any), "control<message.any>");
        assert_eq!(
            type_label_v01(&data_type(DataFlowV01::Stream, "midi.event")),
            "stream<midi.event>"
        );
        assert_eq!(
            type_label_v01(&data_type(DataFlowV01::Resource, "file.handle")),
            "resource<file.handle>"
        );
    }

    #[test]
    fn validates_extension_manifest_negative_unit_target_branches() {
        let manifest: ExtensionManifestV01 = serde_json::from_value(json!({
            "schema": "wrong.extension",
            "schemaVersion": "9.9.9",
            "id": "",
            "version": "",
            "runtimeAbiVersion": "",
            "kind": "native-runtime",
            "provides": {},
            "permissions": []
        }))
        .expect("extension manifest should parse before validation");

        let report = validate_extension_manifest_v01(&manifest).expect_err("manifest should fail");
        let text = report.to_string();
        assert!(text.contains("expected schema skenion.extension.manifest"));
        assert!(text.contains("expected schemaVersion 0.1.0"));
        assert!(text.contains("extension id must not be empty"));
        assert!(text.contains("extension version must not be empty"));
        assert!(text.contains("extension runtimeAbiVersion must not be empty"));
        assert!(text.contains("native-runtime extension manifest must include native binding"));
    }

    #[test]
    fn validates_basic_graph_and_serializes_optional_fields_as_absent() {
        let mut graph = base_graph();
        graph.nodes[0].port_groups = Some(vec![
            super::super::PortGroupSpecV01 {
                id: "outputs".to_owned(),
                direction: PortDirectionV01::Output,
                port_type: "control.number.float".to_owned(),
                min_ports: 1,
                label: Some("Outputs".to_owned()),
                rate: None,
                max_ports: Some(2),
                ordered: Some(true),
                port_id_pattern: Some("out_{index}".to_owned()),
                create_label: Some("Add output".to_owned()),
                default_port_spec: None,
            },
            super::super::PortGroupSpecV01 {
                id: "dynamic_outputs".to_owned(),
                direction: PortDirectionV01::Output,
                port_type: "control.number.float".to_owned(),
                min_ports: 0,
                label: None,
                rate: None,
                max_ports: None,
                ordered: None,
                port_id_pattern: None,
                create_label: None,
                default_port_spec: None,
            },
        ]);
        let mut valid_default_port = graph.nodes[0].ports[0].clone();
        valid_default_port.accepts = Some(vec!["control.number.float".to_owned()]);
        graph.nodes[0].port_groups.as_mut().unwrap()[0].default_port_spec =
            Some(valid_default_port);
        let mut valid_default_without_accepts = graph.nodes[0].ports[0].clone();
        valid_default_without_accepts.id = "out_dynamic".to_owned();
        valid_default_without_accepts.accepts = None;
        graph.nodes[0].port_groups.as_mut().unwrap()[1].default_port_spec =
            Some(valid_default_without_accepts);
        let result = validate_graph_document_v01(&graph).expect("graph should validate");
        assert!(result.ok);
        assert!(result.diagnostics.is_empty());

        let serialized = serde_json::to_string(&graph).expect("graph should serialize");
        assert!(!serialized.contains("null"));

        let mut invalid_default_port = graph;
        invalid_default_port.nodes[0].port_groups.as_mut().unwrap()[0].port_type =
            "number.float".to_owned();
        let mut default_port = invalid_default_port.nodes[0].ports[0].clone();
        default_port.direction = PortDirectionV01::Input;
        default_port.port_type = "number.float".to_owned();
        default_port.accepts = Some(vec![
            "message.any".to_owned(),
            "control.message.any".to_owned(),
        ]);
        invalid_default_port.nodes[0].port_groups.as_mut().unwrap()[0].default_port_spec =
            Some(default_port);
        let report = validate_graph_document_v01(&invalid_default_port)
            .expect_err("legacy default port contract should fail");
        let text = report.to_string();
        assert!(text.contains("port group source.outputs uses legacy control port type"));
        assert!(text.contains("default port uses legacy control port type number.float"));
        assert!(text.contains("default port accepts legacy control port type message.any"));
        assert!(text.contains("defaultPortSpec selector-aware input port requires"));
    }

    #[test]
    fn validates_graph_fragment_policy_and_semantic_branches() {
        let fragment = base_fragment();
        let valid = validate_graph_fragment_v01(&fragment).expect("fragment should validate");
        assert!(valid.ok);

        let mut schema_invalid = fragment.clone();
        schema_invalid.schema = "wrong".to_owned();
        schema_invalid.schema_version = "9.9.9".to_owned();
        let schema_report =
            validate_graph_fragment_v01(&schema_invalid).expect_err("schema should fail");
        assert!(schema_report.to_string().contains("skenion.graph.fragment"));
        assert!(schema_report.to_string().contains("0.1.0"));

        let mut duplicate_node = fragment.clone();
        duplicate_node.nodes.push(duplicate_node.nodes[0].clone());
        assert!(
            validate_graph_fragment_v01(&duplicate_node)
                .expect_err("duplicate node should fail")
                .to_string()
                .contains("duplicate-node-id")
        );

        let mut duplicate_port = fragment.clone();
        let cloned_port = duplicate_port.nodes[0].ports[0].clone();
        duplicate_port.nodes[0].ports.push(cloned_port);
        assert!(
            validate_graph_fragment_v01(&duplicate_port)
                .expect_err("duplicate port should fail")
                .to_string()
                .contains("duplicate-port-id")
        );

        let mut duplicate_edge = fragment.clone();
        duplicate_edge.edges.push(duplicate_edge.edges[0].clone());
        assert!(
            validate_graph_fragment_v01(&duplicate_edge)
                .expect_err("duplicate edge should fail")
                .to_string()
                .contains("duplicate-edge-id")
        );

        let mut legacy_fragment_contracts = fragment.clone();
        legacy_fragment_contracts.nodes[1].ports[0].port_type = "control.message.any".to_owned();
        legacy_fragment_contracts.nodes[1].ports[0].accepts = Some(vec![
            "message.any".to_owned(),
            "control.number.float".to_owned(),
        ]);
        legacy_fragment_contracts.nodes[1].ports[0].message_selectors = None;
        legacy_fragment_contracts.edges[0].resolved_type = Some("number.float".to_owned());
        let legacy_fragment_report = validate_graph_fragment_v01(&legacy_fragment_contracts)
            .expect_err("legacy fragment contracts should fail");
        let legacy_fragment_text = legacy_fragment_report.to_string();
        assert!(legacy_fragment_text.contains("accepts legacy control port type message.any"));
        assert!(legacy_fragment_text.contains("requires messageSelectors"));
        assert!(legacy_fragment_text.contains("edge edge_source_target uses legacy resolvedType"));

        let mut outside = fragment.clone();
        outside.edges[0].target.node_id = "outside".to_owned();
        assert!(
            validate_graph_fragment_v01(&outside)
                .expect_err("outside endpoint should fail")
                .to_string()
                .contains("fragment-edge-outside-selection")
        );
        let omitted =
            analyze_graph_fragment_v01(&outside, GraphFragmentOutsideEndpointPolicyV01::Omit);
        assert!(omitted.ok);
        assert_eq!(omitted.omitted_edge_ids, vec!["edge_source_target"]);

        let mut missing_source = fragment.clone();
        missing_source.edges[0].source.port_id = "missing".to_owned();
        assert!(
            validate_graph_fragment_v01(&missing_source)
                .expect_err("missing source should fail")
                .to_string()
                .contains("missing-source-port")
        );

        let mut missing_target = fragment.clone();
        missing_target.edges[0].target.port_id = "missing".to_owned();
        assert!(
            validate_graph_fragment_v01(&missing_target)
                .expect_err("missing target should fail")
                .to_string()
                .contains("missing-target-port")
        );

        let mut invalid_source_direction = fragment.clone();
        invalid_source_direction.nodes[0].ports[0].direction = PortDirectionV01::Input;
        assert!(
            validate_graph_fragment_v01(&invalid_source_direction)
                .expect_err("input source should fail")
                .to_string()
                .contains("invalid-source-direction")
        );

        let mut invalid_target_direction = fragment.clone();
        invalid_target_direction.nodes[1].ports[0].direction = PortDirectionV01::Output;
        assert!(
            validate_graph_fragment_v01(&invalid_target_direction)
                .expect_err("output target should fail")
                .to_string()
                .contains("invalid-target-direction")
        );

        let mut incompatible = fragment;
        incompatible.nodes[1].ports[0].port_type = "string".to_owned();
        assert!(
            validate_graph_fragment_v01(&incompatible)
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
            outside_endpoint_policy: Some(GraphFragmentOutsideEndpointPolicyV01::Omit),
            id_conflict_policy: Some(IdConflictPolicy::Remap),
            interface_incident_edge_policy: None,
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
                interface_policy: None,
                interface_detail: None,
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
    fn validates_collaboration_operation_branch_coverage() {
        let disconnect_operation = collaboration_operation(json!({
            "kind": "changeSet",
            "target": {
                "path": { "kind": "root" },
                "baseRevision": "root-rev-1"
            },
            "changes": [
                {
                    "op": "edge.disconnect",
                    "changeId": "change-disconnect-source-target",
                    "edgeId": "edge_source_target"
                }
            ],
            "undoGroupId": "undo-group-disconnect",
            "description": "Disconnect source from target"
        }));
        validate_runtime_collaboration_operation_envelope(&disconnect_operation)
            .expect("edge.disconnect change should validate");
        let serialized =
            serde_json::to_value(&disconnect_operation).expect("operation should serialize");
        assert_eq!(serialized["payload"]["changes"][0]["op"], "edge.disconnect");
        assert_eq!(
            serialized["payload"]["changes"][0]["changeId"],
            "change-disconnect-source-target"
        );

        let mut outside_fragment = base_fragment();
        outside_fragment.edges[0].target.node_id = "outside".to_owned();
        let outside_paste = collaboration_operation(json!({
            "kind": "pasteGraphFragment",
            "request": paste_request(outside_fragment)
        }));
        assert!(
            validate_runtime_collaboration_operation_envelope(&outside_paste)
                .expect_err("outside paste should fail")
                .to_string()
                .contains("fragment-edge-outside-selection")
        );

        let mut missing_participant =
            collaboration_operation_value(collaboration_undo_redo_payload("participant-a"));
        missing_participant["schema"] = json!("wrong");
        missing_participant["schemaVersion"] = json!("9.9.9");
        missing_participant["causal"]["vector"] = json!({ "participant-b": 1 });
        let missing_participant: RuntimeCollaborationOperationEnvelope =
            serde_json::from_value(missing_participant)
                .expect("missing-participant operation should parse");
        let text = validate_runtime_collaboration_operation_envelope(&missing_participant)
            .expect_err("schema and causal vector should fail")
            .to_string();
        assert!(text.contains("skenion.runtime.collaboration.operation"));
        assert!(text.contains("0.1.0"));
        assert!(text.contains("causal vector must include participantId"));
    }

    #[test]
    fn validates_collaboration_batch_branch_coverage() {
        let mut mismatched_operation =
            collaboration_operation_value(collaboration_undo_redo_payload("participant-a"));
        mismatched_operation["sessionId"] = json!("session-other");
        let batch: RuntimeCollaborationOperationBatch = serde_json::from_value(json!({
            "schema": "wrong",
            "schemaVersion": "9.9.9",
            "sessionId": "session-collab-a",
            "operations": [mismatched_operation],
            "submittedAt": "2026-06-22T00:00:00.000Z"
        }))
        .expect("batch should parse");

        let text = validate_runtime_collaboration_operation_batch(&batch)
            .expect_err("batch schema and session mismatch should fail")
            .to_string();
        assert!(text.contains("skenion.runtime.collaboration.operation-batch"));
        assert!(text.contains("0.1.0"));
        assert!(text.contains("sessionId must match batch sessionId"));
    }

    #[test]
    fn validates_collaboration_result_branch_coverage() {
        let mut accepted_with_nack = accepted_collaboration_result_value();
        accepted_with_nack["schema"] = json!("wrong");
        accepted_with_nack["schemaVersion"] = json!("9.9.9");
        accepted_with_nack["nack"] = collaboration_nack("invalid-operation");
        let accepted_with_nack: RuntimeCollaborationOperationResult =
            serde_json::from_value(accepted_with_nack)
                .expect("accepted result with nack should parse");
        let text = validate_runtime_collaboration_operation_result(&accepted_with_nack)
            .expect_err("accepted result with nack should fail")
            .to_string();
        assert!(text.contains("skenion.runtime.collaboration.operation-result"));
        assert!(text.contains("0.1.0"));
        assert!(text.contains("must not include nack or rebase"));

        let rejected_without_nack: RuntimeCollaborationOperationResult =
            serde_json::from_value(collaboration_result_value("rejected"))
                .expect("rejected result without nack should parse");
        assert!(
            validate_runtime_collaboration_operation_result(&rejected_without_nack)
                .expect_err("rejected result without nack should fail")
                .to_string()
                .contains("must include nack")
        );

        let mut duplicate_with_wrong_nack = collaboration_result_value("duplicate");
        duplicate_with_wrong_nack["nack"] = collaboration_nack("invalid-operation");
        let duplicate_with_wrong_nack: RuntimeCollaborationOperationResult =
            serde_json::from_value(duplicate_with_wrong_nack)
                .expect("duplicate result with wrong nack should parse");
        assert!(
            validate_runtime_collaboration_operation_result(&duplicate_with_wrong_nack)
                .expect_err("duplicate result with wrong nack should fail")
                .to_string()
                .contains("duplicate-idempotency-key")
        );

        let mut rebased_without_rebase = collaboration_result_value("rebased");
        rebased_without_rebase["ack"] = collaboration_ack(2);
        let rebased_without_rebase: RuntimeCollaborationOperationResult =
            serde_json::from_value(rebased_without_rebase)
                .expect("rebased result without rebase should parse");
        assert!(
            validate_runtime_collaboration_operation_result(&rebased_without_rebase)
                .expect_err("rebased result without rebase should fail")
                .to_string()
                .contains("must include rebase metadata")
        );
    }

    #[test]
    fn validates_collaboration_presence_selection_and_event_branches() {
        let mut presence = collaboration_presence_value();
        presence["schema"] = json!("wrong");
        presence["schemaVersion"] = json!("9.9.9");
        let presence: RuntimeCollaborationPresenceEnvelope =
            serde_json::from_value(presence).expect("presence should parse");
        let text = validate_runtime_collaboration_presence_envelope(&presence)
            .expect_err("presence schema should fail")
            .to_string();
        assert!(text.contains("skenion.runtime.collaboration.presence"));
        assert!(text.contains("0.1.0"));

        let mut selection = collaboration_selection_value();
        selection["schema"] = json!("wrong");
        selection["schemaVersion"] = json!("9.9.9");
        selection["expiresAt"] = selection["updatedAt"].clone();
        let selection: RuntimeCollaborationSelectionEnvelope =
            serde_json::from_value(selection).expect("selection should parse");
        let text = validate_runtime_collaboration_selection_envelope(&selection)
            .expect_err("selection schema and expiry should fail")
            .to_string();
        assert!(text.contains("skenion.runtime.collaboration.selection"));
        assert!(text.contains("0.1.0"));
        assert!(text.contains("expiresAt must be later than updatedAt"));

        let mut event = collaboration_event_value();
        event["schema"] = json!("wrong");
        event["schemaVersion"] = json!("9.9.9");
        let event: RuntimeCollaborationEventEnvelope =
            serde_json::from_value(event).expect("event should parse");
        let text = validate_runtime_collaboration_event_envelope(&event)
            .expect_err("event schema should fail")
            .to_string();
        assert!(text.contains("skenion.runtime.collaboration.event"));
        assert!(text.contains("0.1.0"));

        let mut invalid_gap_event = collaboration_event_value();
        invalid_gap_event["replay"]["gap"] = value(
            r#"{
              "expectedSequence": 8,
              "actualSequence": 6,
              "reason": "unknown"
            }"#,
        );
        let invalid_gap_event: RuntimeCollaborationEventEnvelope =
            serde_json::from_value(invalid_gap_event).expect("invalid gap event should parse");
        assert!(
            validate_runtime_collaboration_event_envelope(&invalid_gap_event)
                .expect_err("replay gap order should fail")
                .to_string()
                .contains("expectedSequence must be less than actualSequence")
        );

        let mut valid_gap_event = collaboration_event_value();
        valid_gap_event["replay"]["gap"] = value(
            r#"{
              "expectedSequence": 1,
              "actualSequence": 3,
              "reason": "retention-overflow"
            }"#,
        );
        let valid_gap_event: RuntimeCollaborationEventEnvelope =
            serde_json::from_value(valid_gap_event).expect("valid gap event should parse");
        validate_runtime_collaboration_event_envelope(&valid_gap_event)
            .expect("valid replay gap should validate");
    }

    #[test]
    fn validates_unit_target_optional_success_and_rebase_branches() {
        let valid_presence: RuntimeCollaborationPresenceEnvelope =
            serde_json::from_value(collaboration_presence_value()).expect("presence should parse");
        validate_runtime_collaboration_presence_envelope(&valid_presence)
            .expect("valid presence should validate");

        let mut deferred_auth_presence = collaboration_presence_value();
        deferred_auth_presence["authSubject"] = json!({
            "kind": "deferred",
            "issuer": "local-dev"
        });
        let deferred_auth_presence: RuntimeCollaborationPresenceEnvelope =
            serde_json::from_value(deferred_auth_presence)
                .expect("deferred auth presence should parse");
        validate_runtime_collaboration_presence_envelope(&deferred_auth_presence)
            .expect("auth subject without subjectId should validate");

        let valid_selection: RuntimeCollaborationSelectionEnvelope =
            serde_json::from_value(collaboration_selection_value())
                .expect("selection should parse");
        validate_runtime_collaboration_selection_envelope(&valid_selection)
            .expect("valid selection should validate");

        let mut valid_batch = value(
            r#"{
              "schema": "skenion.runtime.collaboration.operation-batch",
              "schemaVersion": "0.1.0",
              "sessionId": "session-collab-a",
              "operations": [],
              "submittedAt": "2026-06-22T00:00:00.000Z"
            }"#,
        );
        valid_batch["operations"] = serde_json::Value::Array(vec![collaboration_operation_value(
            collaboration_undo_redo_payload("participant-a"),
        )]);
        let valid_batch: RuntimeCollaborationOperationBatch =
            serde_json::from_value(valid_batch).expect("valid batch should parse");
        validate_runtime_collaboration_operation_batch(&valid_batch)
            .expect("valid batch should validate");

        let change_set = collaboration_operation(value(
            r#"{
              "kind": "changeSet",
              "target": {
                "path": { "kind": "root" },
                "baseRevision": "root-rev-1"
              },
              "changes": [
                {
                  "op": "node.add",
                  "changeId": "change-add",
                  "node": {
                    "id": "added",
                    "kind": "core.float",
                    "kindVersion": "0.1.0",
                    "params": {},
                    "ports": [
                      { "id": "out", "direction": "output", "type": "control.number.float" }
                    ]
                  }
                },
                {
                  "op": "node.move",
                  "changeId": "change-move",
                  "nodeId": "source",
                  "to": { "x": 20, "y": 40 }
                },
                {
                  "op": "node.delete",
                  "changeId": "change-delete",
                  "nodeId": "old"
                },
                {
                  "op": "edge.connect",
                  "changeId": "change-connect",
                  "edge": {
                    "id": "edge-added-target",
                    "source": { "nodeId": "added", "portId": "out" },
                    "target": { "nodeId": "target", "portId": "in" }
                  }
                }
              ]
            }"#,
        ));
        validate_runtime_collaboration_operation_envelope(&change_set)
            .expect("all change id variants should validate");

        let mut accepted_with_rebase = accepted_collaboration_result_value();
        accepted_with_rebase["rebase"] = collaboration_rebase_value();
        let accepted_with_rebase: RuntimeCollaborationOperationResult =
            serde_json::from_value(accepted_with_rebase)
                .expect("accepted result with rebase should parse");
        assert!(
            validate_runtime_collaboration_operation_result(&accepted_with_rebase)
                .expect_err("accepted result with rebase should fail")
                .to_string()
                .contains("must not include nack or rebase")
        );

        let mut rebased = collaboration_result_value("rebased");
        rebased["ack"] = collaboration_ack(2);
        rebased["rebase"] = collaboration_rebase_value();
        let rebased: RuntimeCollaborationOperationResult =
            serde_json::from_value(rebased).expect("rebased result should parse");
        validate_runtime_collaboration_operation_result(&rebased)
            .expect("rebased result with rebase metadata should validate");

        let mut event = runtime_session_event();
        event.replay.gap = Some(RuntimeEventReplayGap {
            expected_sequence: 1,
            actual_sequence: 0,
            reason: RuntimeEventReplayGapReason::Unknown,
        });
        assert!(
            validate_runtime_session_event(&event)
                .expect_err("zero actual replay sequence should fail")
                .to_string()
                .contains("replay gap sequences must be at least 1")
        );

        let mut valid_gap_event = runtime_session_event();
        valid_gap_event.replay.gap = Some(RuntimeEventReplayGap {
            expected_sequence: 1,
            actual_sequence: 3,
            reason: RuntimeEventReplayGapReason::RetentionOverflow,
        });
        validate_runtime_session_event(&valid_gap_event)
            .expect("ordered replay gap should validate");

        let grouped = node(
            r#"{
              "schema": "skenion.node.definition",
              "schemaVersion": "0.1.0",
              "id": "core.dynamic-group",
              "version": "0.1.0",
              "displayName": "Dynamic Group",
              "category": "Core",
              "ports": [
                { "id": "sum", "direction": "output", "type": "control.number.float" }
              ],
              "portGroups": [
                {
                  "id": "inputs",
                  "direction": "input",
                  "type": "control.number.float",
                  "minPorts": 1,
                  "maxPorts": 2
                }
              ],
              "execution": { "model": "control" },
              "state": { "persistent": false },
              "permissions": [],
              "capabilities": []
            }"#,
        );
        validate_node_definition_v01(&grouped).expect("valid maxPorts should validate");
    }

    #[test]
    fn validates_unit_target_project_and_cycle_edge_branches() {
        let self_loop = graph(
            r#"{
              "schema": "skenion.graph",
              "schemaVersion": "0.1.0",
              "id": "self-loop",
              "revision": "1",
              "nodes": [
                {
                  "id": "loop",
                  "kind": "core.loop",
                  "kindVersion": "0.1.0",
                  "params": {},
                  "ports": [
                    { "id": "in", "direction": "input", "type": "control.number.float" },
                    { "id": "out", "direction": "output", "type": "control.number.float" }
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
        );
        assert!(
            validate_graph_document_v01(&self_loop)
                .expect_err("self-loop should require feedback")
                .to_string()
                .contains("ambiguous-algebraic-loop")
        );

        let warning_project: ProjectDocumentV01 = serde_json::from_str(
            r#"{
              "schema": "skenion.project",
              "schemaVersion": "0.1.0",
              "id": "project-warning",
              "revision": "1",
              "graph": {
                "schema": "skenion.graph",
                "schemaVersion": "0.1.0",
                "id": "warning-graph",
                "revision": "1",
                "nodes": [
                  {
                    "id": "a",
                    "kind": "core.a",
                    "kindVersion": "0.1.0",
                    "params": {},
                    "ports": [
                      { "id": "in", "direction": "input", "type": "control.number.float" },
                      { "id": "out", "direction": "output", "type": "control.number.float" }
                    ]
                  },
                  {
                    "id": "b",
                    "kind": "core.b",
                    "kindVersion": "0.1.0",
                    "params": {},
                    "ports": [
                      { "id": "in", "direction": "input", "type": "control.number.float" },
                      { "id": "out", "direction": "output", "type": "control.number.float" }
                    ]
                  }
                ],
                "edges": [
                  {
                    "id": "edge-a-b",
                    "source": { "nodeId": "a", "portId": "out" },
                    "target": { "nodeId": "b", "portId": "in" }
                  },
                  {
                    "id": "edge-b-a",
                    "source": { "nodeId": "b", "portId": "out" },
                    "target": { "nodeId": "a", "portId": "in" },
                    "feedback": { "enabled": true, "boundary": "same-turn" }
                  }
                ]
              },
              "viewState": {
                "schema": "skenion.view-state",
                "schemaVersion": "0.1.0",
                "canvas": {
                  "nodes": {
                    "a": { "x": 0, "y": 0 },
                    "b": { "x": 120, "y": 0 }
                  }
                }
              },
              "patchLibrary": [
                {
                  "id": "boundary",
                  "revision": "1",
                  "graph": {
                    "schema": "skenion.graph",
                    "schemaVersion": "0.1.0",
                    "id": "boundary-graph",
                    "revision": "1",
                    "nodes": [
                      {
                        "id": "left_in",
                        "kind": "core.inlet",
                        "kindVersion": "0.1.0",
                        "params": {},
                        "ports": [
                          { "id": "out", "direction": "output", "type": "control.number.float" }
                        ]
                      },
                      {
                        "id": "right_out",
                        "kind": "core.outlet",
                        "kindVersion": "0.1.0",
                        "params": {},
                        "ports": [
                          { "id": "in", "direction": "input", "type": "control.number.float" }
                        ]
                      }
                    ],
                    "edges": []
                  }
                }
              ]
            }"#,
        )
        .expect("warning project should parse");
        validate_project_document_v01(&warning_project)
            .expect("warning-only graph and boundary patch should validate");

        let invalid_patch_project: ProjectDocumentV01 = serde_json::from_str(
            r#"{
              "schema": "skenion.project",
              "schemaVersion": "0.1.0",
              "id": "project-invalid-patch",
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
                  "id": "",
                  "revision": "",
                  "graph": {
                    "schema": "skenion.graph",
                    "schemaVersion": "0.1.0",
                    "id": "invalid-patch-graph",
                    "revision": "1",
                    "nodes": [
                      {
                        "id": "inlet_a",
                        "kind": "core.inlet",
                        "kindVersion": "0.1.0",
                        "params": { "portId": "same" },
                        "ports": [
                          { "id": "out", "direction": "output", "type": "control.number.float" }
                        ]
                      },
                      {
                        "id": "inlet_b",
                        "kind": "core.inlet",
                        "kindVersion": "0.1.0",
                        "params": { "portId": "same" },
                        "ports": [
                          { "id": "out", "direction": "output", "type": "control.number.float" }
                        ]
                      }
                    ],
                    "edges": []
                  },
                  "viewState": {
                    "schema": "skenion.view-state",
                    "schemaVersion": "0.1.0",
                    "canvas": {
                      "nodes": {
                        "missing": { "x": 0, "y": 0 }
                      }
                    }
                  }
                }
              ]
            }"#,
        )
        .expect("invalid patch project should parse");
        let text = validate_project_document_v01(&invalid_patch_project)
            .expect_err("invalid patch should propagate into project validation")
            .to_string();
        assert!(text.contains("patch id must not be empty"));
        assert!(text.contains("duplicate boundary port id"));
        assert!(text.contains("references missing graph node"));
    }

    #[test]
    fn reports_direction_missing_duplicate_type_and_fanout_errors() {
        let mut graph = base_graph();
        graph.nodes[0].ports[0].fan_out_policy = Some(super::super::FanOutPolicyV01::Forbid);
        graph.nodes[1].ports[0].port_type = "render.frame".to_owned();
        graph.nodes[1].ports[0].accepts = Some(vec!["gpu.texture2d".to_owned()]);
        let duplicate_port = graph.nodes[1].ports[0].clone();
        graph.nodes[1].ports.push(duplicate_port);
        graph.nodes.push(graph.nodes[1].clone());
        graph.edges.push(graph.edges[0].clone());
        graph.edges[1].id = "edge_duplicate".to_owned();
        graph.edges.push(EdgeSpecV01 {
            id: "edge_missing".to_owned(),
            source: EdgeEndpointV01 {
                node_id: "source".to_owned(),
                port_id: "missing".to_owned(),
            },
            target: EdgeEndpointV01 {
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
        graph.edges.push(EdgeSpecV01 {
            id: "edge_input_source".to_owned(),
            source: EdgeEndpointV01 {
                node_id: "target".to_owned(),
                port_id: "in".to_owned(),
            },
            target: EdgeEndpointV01 {
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
        graph.edges.push(EdgeSpecV01 {
            id: "edge_missing_target".to_owned(),
            source: EdgeEndpointV01 {
                node_id: "source".to_owned(),
                port_id: "out".to_owned(),
            },
            target: EdgeEndpointV01 {
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
        graph.edges.push(EdgeSpecV01 {
            id: "edge_missing_source_node".to_owned(),
            source: EdgeEndpointV01 {
                node_id: "missing".to_owned(),
                port_id: "out".to_owned(),
            },
            target: EdgeEndpointV01 {
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
        graph.edges.push(EdgeSpecV01 {
            id: "edge_duplicate".to_owned(),
            source: EdgeEndpointV01 {
                node_id: "source".to_owned(),
                port_id: "out".to_owned(),
            },
            target: EdgeEndpointV01 {
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

        let report = validate_graph_document_v01(&graph).expect_err("graph should fail");
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
        assert!(validate_graph_document_v01(&graph).is_ok());

        graph.nodes[1].ports[0].required = Some(true);
        graph.edges.clear();
        let missing = validate_graph_document_v01(&graph).expect_err("required input should fail");
        assert!(missing.to_string().contains("missing-required-input"));

        graph.nodes.push(GraphNodeV01 {
            id: "source_two".to_owned(),
            kind: "core.float".to_owned(),
            kind_version: "0.1.0".to_owned(),
            object_text: None,
            binding_ref: None,
            params: serde_json::Map::new(),
            ports: vec![PortSpecV01 {
                id: "out".to_owned(),
                direction: PortDirectionV01::Output,
                port_type: "gpu.texture2d".to_owned(),
                label: None,
                rate: None,
                accepts: None,
                min_connections: None,
                max_connections: None,
                merge_policy: None,
                fan_out_policy: None,
                trigger_mode: None,
                message_selectors: None,
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
            EdgeSpecV01 {
                id: "edge_one".to_owned(),
                source: EdgeEndpointV01 {
                    node_id: "source".to_owned(),
                    port_id: "out".to_owned(),
                },
                target: EdgeEndpointV01 {
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
            EdgeSpecV01 {
                id: "edge_two".to_owned(),
                source: EdgeEndpointV01 {
                    node_id: "source_two".to_owned(),
                    port_id: "out".to_owned(),
                },
                target: EdgeEndpointV01 {
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
        assert!(validate_graph_document_v01(&graph).is_ok());

        graph.edges[1].enabled = None;
        let fan_in = validate_graph_document_v01(&graph).expect_err("default fan-in should fail");
        assert!(fan_in.to_string().contains("fan-in-cardinality"));
        graph.nodes[1].ports[0].max_connections = Some(Some(2));
        let merge = validate_graph_document_v01(&graph).expect_err("missing merge should fail");
        assert!(merge.to_string().contains("fan-in-without-merge-policy"));
        graph.nodes[1].ports[0].merge_policy = Some(MergePolicyV01::Array);
        assert!(validate_graph_document_v01(&graph).is_ok());
    }

    #[test]
    fn control_ports_declare_numeric_accepts_and_bang_trigger_behavior() {
        let graph = graph(
            r#"{
              "schema": "skenion.graph",
              "schemaVersion": "0.1.0",
              "id": "control-accepts-and-bang-trigger",
              "revision": "1",
              "nodes": [
                {
                  "id": "button",
                  "kind": "core.bang",
                  "kindVersion": "0.1.0",
                  "params": {},
                  "ports": [
                    { "id": "out", "direction": "output", "type": "event.bang", "rate": "event" }
                  ]
                },
                {
                  "id": "int_source",
                  "kind": "core.int",
                  "kindVersion": "0.1.0",
                  "params": {},
                  "ports": [
                    { "id": "value", "direction": "output", "type": "control.number.int", "rate": "control" }
                  ]
                },
                {
                  "id": "bool_source",
                  "kind": "core.bool",
                  "kindVersion": "0.1.0",
                  "params": {},
                  "ports": [
                    { "id": "value", "direction": "output", "type": "control.bool", "rate": "control" }
                  ]
                },
                {
                  "id": "number_box",
                  "kind": "core.float",
                  "kindVersion": "0.1.0",
                  "params": {},
                  "ports": [
                    {
                      "id": "in",
                      "direction": "input",
                      "type": "control.message.any",
                      "rate": "control",
                      "accepts": [
                        "control.number.float",
                        "control.number.int",
                        "control.bool",
                        "event.bang"
                      ],
                      "maxConnections": 3,
                      "mergePolicy": "ordered-events",
                      "triggerMode": "trigger",
                      "messageSelectors": {
                        "accepted": ["bang", "set", "float", "int", "bool"],
                        "silent": ["set"],
                        "trigger": ["bang", "float", "int", "bool"],
                        "store": ["set", "float", "int", "bool"],
                        "emit": ["bang", "float", "int", "bool"]
                      },
                      "latch": true
                    }
                  ]
                }
              ],
              "edges": [
                {
                  "id": "edge_button_message",
                  "source": { "nodeId": "button", "portId": "out" },
                  "target": { "nodeId": "number_box", "portId": "in" }
                },
                {
                  "id": "edge_int_number",
                  "source": { "nodeId": "int_source", "portId": "value" },
                  "target": { "nodeId": "number_box", "portId": "in" }
                },
                {
                  "id": "edge_bool_number",
                  "source": { "nodeId": "bool_source", "portId": "value" },
                  "target": { "nodeId": "number_box", "portId": "in" }
                }
              ]
            }"#,
        );

        validate_graph_document_v01(&graph)
            .expect("numeric control accepts and explicit bang trigger should validate");

        let mut missing_selector_policy = graph.clone();
        missing_selector_policy.nodes[3].ports[0].message_selectors = None;
        let report = validate_graph_document_v01(&missing_selector_policy)
            .expect_err("selector-aware input should require messageSelectors");
        assert!(report.to_string().contains("requires messageSelectors"));

        let mut invalid_set_trigger = graph.clone();
        let policy = invalid_set_trigger.nodes[3].ports[0]
            .message_selectors
            .as_mut()
            .expect("number box should declare selector policy");
        policy.accepted = vec!["set".to_owned()];
        policy.silent = None;
        policy.trigger = Some(vec!["set".to_owned()]);
        policy.store = None;
        policy.emit = None;
        let report = validate_graph_document_v01(&invalid_set_trigger)
            .expect_err("set must not be trigger behavior");
        let text = report.to_string();
        assert!(text.contains("trigger must not include set"));
        assert!(text.contains("set must be silent or store behavior"));

        let mut invalid_set_emit = graph.clone();
        let policy = invalid_set_emit.nodes[3].ports[0]
            .message_selectors
            .as_mut()
            .expect("number box should declare selector policy");
        policy.accepted = vec!["set".to_owned()];
        policy.silent = Some(vec!["set".to_owned()]);
        policy.trigger = None;
        policy.store = None;
        policy.emit = Some(vec!["set".to_owned()]);
        let report = validate_graph_document_v01(&invalid_set_emit).expect_err("set must not emit");
        assert!(report.to_string().contains("emit must not include set"));

        let mut valid_set_store = graph.clone();
        let policy = valid_set_store.nodes[3].ports[0]
            .message_selectors
            .as_mut()
            .expect("number box should declare selector policy");
        policy.accepted = vec!["set".to_owned()];
        policy.silent = None;
        policy.trigger = None;
        policy.store = Some(vec!["set".to_owned()]);
        policy.emit = None;
        validate_graph_document_v01(&valid_set_store)
            .expect("set should be valid as store selector behavior");

        let mut empty_selector_policy = graph.clone();
        let policy = empty_selector_policy.nodes[3].ports[0]
            .message_selectors
            .as_mut()
            .expect("number box should declare selector policy");
        policy.accepted.clear();
        policy.silent = None;
        policy.trigger = None;
        policy.store = None;
        policy.emit = None;
        let report = validate_graph_document_v01(&empty_selector_policy)
            .expect_err("accepted selector set must not be empty");
        assert!(
            report
                .to_string()
                .contains("accepted must list at least one selector")
        );

        let mut unaccepted_trigger_selector = graph.clone();
        let policy = unaccepted_trigger_selector.nodes[3].ports[0]
            .message_selectors
            .as_mut()
            .expect("number box should declare selector policy");
        policy.accepted = vec!["float".to_owned()];
        policy.silent = None;
        policy.trigger = Some(vec!["int".to_owned()]);
        policy.store = None;
        policy.emit = None;
        let report = validate_graph_document_v01(&unaccepted_trigger_selector)
            .expect_err("selector behavior must stay inside accepted selectors");
        assert!(
            report
                .to_string()
                .contains("messageSelectors.trigger selector int is not accepted")
        );

        let mut without_bang_accept = graph.clone();
        without_bang_accept.nodes[3].ports[0].accepts = Some(vec![
            "control.number.float".to_owned(),
            "control.number.int".to_owned(),
            "control.bool".to_owned(),
        ]);
        let report = validate_graph_document_v01(&without_bang_accept)
            .expect_err("bang requires an explicit accepted type");
        assert!(report.to_string().contains("incompatible-type"));
    }

    #[test]
    fn rejects_legacy_control_port_aliases_in_current_contracts() {
        let legacy_types = [
            "value.number",
            "value<number.float>",
            "number.float",
            "number.int",
            "number.uint",
            "boolean",
            "message.any",
        ];

        for legacy_type in legacy_types {
            let mut graph = base_graph();
            graph.nodes[0].ports[0].port_type = legacy_type.to_owned();
            let report = validate_graph_document_v01(&graph).expect_err("legacy port should fail");
            assert!(
                report.to_string().contains("legacy-port-type"),
                "{legacy_type}"
            );

            let mut graph = base_graph();
            graph.nodes[1].ports[0].port_type = "control.message.any".to_owned();
            graph.nodes[1].ports[0].accepts = Some(vec![legacy_type.to_owned()]);
            let report =
                validate_graph_document_v01(&graph).expect_err("legacy accepted type should fail");
            assert!(
                report.to_string().contains("legacy-port-type"),
                "{legacy_type}"
            );

            let mut graph = base_graph();
            graph.edges[0].resolved_type = Some(legacy_type.to_owned());
            let report =
                validate_graph_document_v01(&graph).expect_err("legacy resolvedType should fail");
            assert!(
                report.to_string().contains("legacy-port-type"),
                "{legacy_type}"
            );

            let legacy_id: String = legacy_type
                .chars()
                .map(|character| {
                    if character.is_ascii_alphanumeric() {
                        character
                    } else {
                        '-'
                    }
                })
                .collect();
            let definition = node(&format!(
                r#"{{
                  "schema": "skenion.node.definition",
                  "schemaVersion": "0.1.0",
                  "id": "legacy.{}",
                  "version": "0.1.0",
                  "displayName": "Legacy",
                  "category": "Test",
                  "ports": [
                    {{ "id": "in", "direction": "input", "type": "{}" }}
                  ],
                  "execution": {{ "model": "control" }},
                  "state": {{ "persistent": false }},
                  "permissions": [],
                  "capabilities": []
                }}"#,
                legacy_id, legacy_type
            ));
            let report =
                validate_node_definition_v01(&definition).expect_err("legacy node should fail");
            assert!(
                report.to_string().contains("legacy port type"),
                "{legacy_type}"
            );
        }
    }

    #[test]
    fn classifies_cycles_without_executing_feedback() {
        let mut graph = base_graph();
        graph.nodes[0].ports.push(PortSpecV01 {
            id: "in".to_owned(),
            direction: PortDirectionV01::Input,
            port_type: "control.number.float".to_owned(),
            label: None,
            rate: None,
            accepts: None,
            min_connections: None,
            max_connections: None,
            merge_policy: None,
            fan_out_policy: None,
            trigger_mode: None,
            message_selectors: None,
            default_value: None,
            latch: None,
            required: None,
            style_key: None,
            group: None,
            description: None,
        });
        graph.nodes[1].ports.push(PortSpecV01 {
            id: "out".to_owned(),
            direction: PortDirectionV01::Output,
            port_type: "control.number.float".to_owned(),
            label: None,
            rate: None,
            accepts: None,
            min_connections: None,
            max_connections: None,
            merge_policy: None,
            fan_out_policy: None,
            trigger_mode: None,
            message_selectors: None,
            default_value: None,
            latch: None,
            required: None,
            style_key: None,
            group: None,
            description: None,
        });
        graph.edges.push(EdgeSpecV01 {
            id: "edge_target_source".to_owned(),
            source: EdgeEndpointV01 {
                node_id: "target".to_owned(),
                port_id: "out".to_owned(),
            },
            target: EdgeEndpointV01 {
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

        let ambiguous = validate_graph_document_v01(&graph).expect_err("cycle should fail");
        assert!(ambiguous.to_string().contains("ambiguous-algebraic-loop"));

        let mut control_cycle = graph.clone();
        for node in &mut control_cycle.nodes {
            for port in &mut node.ports {
                port.port_type = "control.number".to_owned();
            }
        }
        let control_ambiguous =
            validate_graph_document_v01(&control_cycle).expect_err("control cycle should fail");
        assert!(
            control_ambiguous
                .to_string()
                .contains("ambiguous-algebraic-loop")
        );

        graph.edges[1].feedback = Some(FeedbackPolicyV01 {
            enabled: true,
            boundary: FeedbackBoundaryV01::RenderFrame,
            initial_value: Some(json!(0.0)),
            recursion_limit: Some(1),
            max_events_per_tick: Some(8),
            max_iterations_per_frame: Some(1),
            buffer_mode: Some(super::super::FeedbackBufferModeV01::Latest),
            intentional: Some(true),
            label: Some("feedback".to_owned()),
        });
        let feedback = validate_graph_document_v01(&graph).expect("explicit feedback should pass");
        assert_eq!(
            feedback.cycles[0].classification,
            CycleValidationV01::ValidFeedback
        );

        graph.edges[1].feedback.as_mut().unwrap().boundary = FeedbackBoundaryV01::SameTurn;
        let risky = analyze_graph_document_v01(&graph);
        assert!(risky.ok);
        assert_eq!(risky.diagnostics[0].severity, "warning");
        assert_eq!(
            risky.cycles[0].classification,
            CycleValidationV01::RiskyFeedback
        );
    }

    #[test]
    fn validates_node_definition_schema_permissions_and_groups() {
        let valid = node(
            r#"{
              "schema": "skenion.node.definition",
              "schemaVersion": "0.1.0",
              "id": "render.clear-color",
              "version": "0.1.0",
              "displayName": "Clear Color",
              "category": "Render",
              "ports": [
                { "id": "out", "direction": "output", "type": "render.frame" }
              ],
              "execution": { "model": "gpu_pass", "clock": "frame" },
              "state": { "persistent": false },
              "permissions": [],
              "capabilities": ["render.frame.v0.1"]
            }"#,
        );
        validate_node_definition_v01(&valid).expect("node should validate");

        let mut invalid = valid;
        invalid.schema = "wrong".to_owned();
        invalid.schema_version = "9.9.9".to_owned();
        invalid.permissions.push("network".to_owned());
        invalid.ports.push(invalid.ports[0].clone());
        invalid.ports[0].accepts = Some(vec![
            "message.any".to_owned(),
            "control.number.float".to_owned(),
        ]);
        let mut selector_port = invalid.ports[0].clone();
        selector_port.id = "selector".to_owned();
        selector_port.direction = PortDirectionV01::Input;
        selector_port.port_type = "control.message.any".to_owned();
        selector_port.accepts = None;
        selector_port.message_selectors = None;
        invalid.ports.push(selector_port);
        invalid.port_groups = Some(vec![super::super::PortGroupSpecV01 {
            id: "bad".to_owned(),
            direction: PortDirectionV01::Input,
            port_type: "number.float".to_owned(),
            min_ports: 2,
            label: None,
            rate: None,
            max_ports: Some(1),
            ordered: None,
            port_id_pattern: None,
            create_label: None,
            default_port_spec: Some({
                let mut port = invalid.ports[0].clone();
                port.id = "default".to_owned();
                port.direction = PortDirectionV01::Input;
                port.port_type = "number.float".to_owned();
                port.accepts = Some(vec![
                    "message.any".to_owned(),
                    "control.message.any".to_owned(),
                ]);
                port.message_selectors = None;
                port
            }),
        }]);
        let report = validate_node_definition_v01(&invalid).expect_err("node should fail");
        let text = report.to_string();
        assert!(text.contains("expected schema skenion.node.definition"));
        assert!(text.contains("expected schemaVersion 0.1.0"));
        assert!(text.contains("unsupported permission"));
        assert!(text.contains("duplicate port id"));
        assert!(text.contains("legacy accepted port type"));
        assert!(text.contains("selector-aware input port requires messageSelectors"));
        assert!(text.contains("legacy port group type"));
        assert!(text.contains("legacy default port type"));
        assert!(text.contains("legacy default accepted port type"));
        assert!(text.contains("defaultPortSpec selector-aware input port requires"));
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
        let process = invalid_info
            .profile
            .process
            .as_mut()
            .expect("local-managed fixture should include process metadata");
        process.pid = Some(0);
        process.executable_path = Some(String::new());
        process.working_directory = Some(String::new());
        process.owner_window_id = Some(String::new());
        process.platform = Some(String::new());
        process.arch = Some(String::new());
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
        invalid_event.snapshot.diagnostics.push(RuntimeDiagnostic {
            severity: RuntimeDiagnosticSeverity::Warning,
            message: String::new(),
            code: None,
            details: None,
        });
        invalid_event.snapshot.plan = Some(json!("opaque-plan"));
        let graph = serde_json::to_value(base_graph()).expect("base graph should serialize");
        let mut invalid_snapshot_project: ProjectDocumentV01 = serde_json::from_value(json!({
            "schema": "skenion.project",
            "schemaVersion": "0.1.0",
            "id": "runtime-project",
            "revision": "1",
            "graph": graph,
            "viewState": {
                "schema": "skenion.view-state",
                "schemaVersion": "0.1.0",
                "canvas": {
                    "nodes": {
                        "source": { "x": 0, "y": 0 },
                        "target": { "x": 120, "y": 0 }
                    }
                }
            },
            "patchLibrary": []
        }))
        .expect("snapshot project should parse");
        invalid_snapshot_project.schema = "wrong".to_owned();
        invalid_event.snapshot.project = Some(invalid_snapshot_project);
        invalid_event.history.schema = "wrong".to_owned();
        invalid_event.history.schema_version = "9.9.9".to_owned();
        let invalid_runtime_operation = json!({
            "schema": "wrong",
            "schemaVersion": "9.9.9",
            "id": "",
            "kind": "loadProject",
            "request": {
                "target": {
                    "path": { "kind": "root" },
                    "baseRevision": "1"
                },
                "fragment": {
                    "schema": "skenion.graph.fragment",
                    "schemaVersion": "0.1.0",
                    "nodes": [
                        {
                            "id": "",
                            "kind": "",
                            "kindVersion": "",
                            "params": {},
                            "ports": [
                            {
                                "id": "",
                                "direction": "input",
                                    "type": "control.number.float"
                                }
                            ]
                        },
                        {
                            "id": "",
                            "kind": "core.float",
                            "kindVersion": "0.1.0",
                            "params": {},
                            "ports": []
                        }
                    ],
                    "edges": [
                        {
                            "id": "edge-missing-source",
                            "source": { "nodeId": "missing", "portId": "out" },
                            "target": { "nodeId": "", "portId": "" }
                        }
                    ]
                }
            }
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
                "operation": invalid_runtime_operation,
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
        let expected_messages = [
            "skenion.runtime.session.event",
            "0.1.0",
            "event id must not be empty",
            "sessionId must not be empty",
            "sequence must be at least 1",
            "createdAt must not be empty",
            "snapshot project expected schema skenion.project",
            "snapshot diagnostics must include non-empty message",
            "snapshot plan must be an object or null",
            "expected history schema skenion.runtime.history",
            "expected history schemaVersion 0.1.0",
            "history entry id must not be empty",
            "history entry sequence must be at least 1",
            "history entry createdAt must not be empty",
            "history entry subjectEventId must not be empty",
            "history entry clientId must not be empty",
            "history entry mutation operation expected schema skenion.runtime.operation",
            "history entry mutation operation expected schemaVersion 0.1.0",
            "history entry mutation operation runtime operation id must not be empty",
            "history entry mutation operation unsupported runtime operation kind",
            "history entry mutation operation duplicate-node-id",
            "history entry mutation operation fragment-edge-outside-selection",
            "history entry mutation clientId must not be empty",
            "history entry inverseMutation viewPatch operation nodeId must not be empty",
            "history entry inverseMutation clientId must not be empty",
            "mutation id must not be empty",
            "mutation mutation operation expected schema skenion.runtime.operation",
            "mutation mutation operation duplicate-node-id",
            "mutation mutation clientId must not be empty",
            "mutation inverseMutation viewPatch operation nodeId must not be empty",
            "mutation inverseMutation clientId must not be empty",
            "replay cursor must not be empty",
            "replay previousCursor must not be empty",
            "replay gap sequences must be at least 1",
            "expectedSequence must be less than actualSequence",
            "sessionRevision must match",
        ];
        let missing_messages = expected_messages
            .iter()
            .copied()
            .filter(|expected| !event_error.contains(expected))
            .collect::<Vec<_>>();
        assert!(missing_messages.is_empty(), "{missing_messages:?}");
    }

    #[test]
    fn reports_schema_mismatches_and_invalid_port_group_on_graph() {
        let mut graph = base_graph();
        graph.schema = "wrong".to_owned();
        graph.schema_version = "9.9.9".to_owned();
        graph.nodes.push(GraphNodeV01 {
            id: "grouped".to_owned(),
            kind: "core.grouped".to_owned(),
            kind_version: "0.1.0".to_owned(),
            object_text: None,
            binding_ref: None,
            params: serde_json::Map::new(),
            ports: Vec::new(),
            port_groups: Some(vec![super::super::PortGroupSpecV01 {
                id: "bad".to_owned(),
                direction: PortDirectionV01::Input,
                port_type: "control.number.float".to_owned(),
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
        let report = validate_graph_document_v01(&graph).expect_err("graph should fail");
        let text = report.to_string();
        assert!(text.contains("expected schema skenion.graph"));
        assert!(text.contains("expected schemaVersion 0.1.0"));
        assert!(text.contains("invalid-port-group"));
    }
}
