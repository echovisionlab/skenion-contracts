use serde::{Deserialize, Deserializer, Serialize};
use serde_json::Value;
use std::collections::BTreeMap;

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum DataFlowV01 {
    Value,
    Event,
    Signal,
    Stream,
    Resource,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum PortActivationV01 {
    Trigger,
    Latched,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct NumberRangeV01 {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub min: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub step: Option<f64>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(untagged)]
pub enum StringOrStringsV01 {
    One(String),
    Many(Vec<String>),
}

impl StringOrStringsV01 {
    pub fn values(&self) -> Vec<&str> {
        match self {
            Self::One(value) => vec![value.as_str()],
            Self::Many(values) => values.iter().map(String::as_str).collect(),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct DataTypeV01 {
    pub flow: DataFlowV01,
    pub data_kind: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub unit: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub range: Option<NumberRangeV01>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub shape: Option<Vec<u64>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub channels: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sample_rate: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub format: Option<StringOrStringsV01>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub color_space: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub frame_rate: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub alpha_policy: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub values: Option<Vec<Value>>,
}

fn deserialize_nullable_u64<'de, D>(deserializer: D) -> Result<Option<Option<u64>>, D::Error>
where
    D: Deserializer<'de>,
{
    Option::<u64>::deserialize(deserializer).map(Some)
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum PortDirectionV01 {
    Input,
    Output,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum PortRateV01 {
    Event,
    Control,
    Audio,
    Render,
    Gpu,
    Resource,
    Io,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum MergePolicyV01 {
    Forbid,
    OrderedEvents,
    Mix,
    Array,
    Latest,
    First,
    Custom,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum FanOutPolicyV01 {
    Allow,
    Forbid,
    Copy,
    Share,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum TriggerModeV01 {
    Passive,
    Trigger,
    Latched,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum FeedbackBoundaryV01 {
    SameTurn,
    NextTick,
    ControlFrame,
    AudioSample,
    AudioBlock,
    RenderFrame,
    GpuPingpong,
    Manual,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum FeedbackBufferModeV01 {
    Latest,
    Queue,
    Ring,
    Pingpong,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum CycleValidationV01 {
    NoCycle,
    ValidFeedback,
    RiskyFeedback,
    AmbiguousAlgebraicLoop,
    InvalidCycle,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct PortSpecV01 {
    pub id: String,
    pub direction: PortDirectionV01,
    #[serde(rename = "type")]
    pub port_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub label: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rate: Option<PortRateV01>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub accepts: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub min_connections: Option<u64>,
    #[serde(
        default,
        deserialize_with = "deserialize_nullable_u64",
        skip_serializing_if = "Option::is_none"
    )]
    pub max_connections: Option<Option<u64>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub merge_policy: Option<MergePolicyV01>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub fan_out_policy: Option<FanOutPolicyV01>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub trigger_mode: Option<TriggerModeV01>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub default_value: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub latch: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub required: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub style_key: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub group: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct PortV01 {
    pub id: String,
    pub direction: PortDirectionV01,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub label: Option<String>,
    #[serde(rename = "type")]
    pub data_type: DataTypeV01,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub required: Option<bool>,
    #[serde(rename = "default")]
    #[serde(skip_serializing_if = "Option::is_none")]
    pub default_value: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub activation: Option<PortActivationV01>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct PortGroupSpecV01 {
    pub id: String,
    pub direction: PortDirectionV01,
    #[serde(rename = "type")]
    pub port_type: String,
    pub min_ports: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub label: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rate: Option<PortRateV01>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_ports: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ordered: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub port_id_pattern: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub create_label: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub default_port_spec: Option<PortSpecV01>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct FeedbackPolicyV01 {
    pub enabled: bool,
    pub boundary: FeedbackBoundaryV01,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub initial_value: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub recursion_limit: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_events_per_tick: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_iterations_per_frame: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub buffer_mode: Option<FeedbackBufferModeV01>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub intentional: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub label: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct EdgeEndpointV01 {
    pub node_id: String,
    pub port_id: String,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct EdgeSpecV01 {
    pub id: String,
    pub source: EdgeEndpointV01,
    pub target: EdgeEndpointV01,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resolved_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub order: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enabled: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub adapter: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub feedback: Option<FeedbackPolicyV01>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub style_override: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub label: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct CableStyleV01 {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub color: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pattern: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub width: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub marker: Option<String>,
}

pub type CableStyleRegistryV01 = BTreeMap<String, CableStyleV01>;

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
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
#[serde(rename_all = "camelCase")]
pub struct CanvasViewportV01 {
    pub x: f64,
    pub y: f64,
    pub zoom: f64,
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
#[serde(rename_all = "camelCase")]
pub struct ViewStateV01 {
    pub schema: String,
    pub schema_version: String,
    pub canvas: CanvasViewStateV01,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct GraphNodeV01 {
    pub id: String,
    pub kind: String,
    pub kind_version: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub object_text: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub binding_ref: Option<String>,
    pub params: serde_json::Map<String, Value>,
    pub ports: Vec<PortSpecV01>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub port_groups: Option<Vec<PortGroupSpecV01>>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct GraphDocumentV01 {
    pub schema: String,
    pub schema_version: String,
    pub id: String,
    pub revision: String,
    pub nodes: Vec<GraphNodeV01>,
    pub edges: Vec<EdgeSpecV01>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cable_styles: Option<CableStyleRegistryV01>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct GraphFragmentViewV01 {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub nodes: Option<BTreeMap<String, CanvasNodeViewV01>>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum GraphFragmentOmittedEdgeReasonV01 {
    OutsideFragment,
    PolicyOmit,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct GraphFragmentOmittedEdgeV01 {
    pub id: String,
    pub source: EdgeEndpointV01,
    pub target: EdgeEndpointV01,
    pub reason: GraphFragmentOmittedEdgeReasonV01,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct GraphFragmentV01 {
    pub schema: String,
    pub schema_version: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id: Option<String>,
    pub nodes: Vec<GraphNodeV01>,
    pub edges: Vec<EdgeSpecV01>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub view: Option<GraphFragmentViewV01>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub omitted_edges: Option<Vec<GraphFragmentOmittedEdgeV01>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<serde_json::Map<String, Value>>,
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum GraphFragmentOutsideEndpointPolicyV01 {
    #[default]
    Reject,
    Omit,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
pub struct GraphFragmentDiagnosticV01 {
    pub severity: String,
    pub code: String,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub nodes: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub edges: Option<Vec<String>>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GraphFragmentValidationResultV01 {
    pub ok: bool,
    pub diagnostics: Vec<GraphFragmentDiagnosticV01>,
    pub omitted_edge_ids: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(
    tag = "kind",
    rename_all = "kebab-case",
    rename_all_fields = "camelCase"
)]
pub enum PatchPath {
    Root,
    ProjectPatchDefinition {
        patch_id: String,
    },
    PackagePatchDefinition {
        package_id: String,
        patch_id: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        version: Option<String>,
    },
    EmbeddedPatchInstance {
        owner_path: Vec<String>,
        node_id: String,
    },
    HelpWorkingCopy {
        working_copy_id: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        source_package_id: Option<String>,
        #[serde(skip_serializing_if = "Option::is_none")]
        source_patch_id: Option<String>,
    },
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct GraphTargetRef {
    pub path: PatchPath,
    pub base_revision: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub target_revision: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(
    tag = "kind",
    rename_all = "kebab-case",
    rename_all_fields = "camelCase"
)]
pub enum PastePlacement {
    Position {
        x: f64,
        y: f64,
    },
    Anchor {
        node_id: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        offset_x: Option<f64>,
        #[serde(skip_serializing_if = "Option::is_none")]
        offset_y: Option<f64>,
    },
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum IdConflictPolicy {
    Remap,
    Reject,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum InterfaceIncidentEdgePolicyV01 {
    Drop,
    PreserveDiagnostic,
    Reject,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum InterfaceRecoveryActionIdV01 {
    DropEdge,
    Reconnect,
    RestorePort,
    ReplaceProvider,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum InterfaceDiagnosticMissingEndpointV01 {
    SourceNode,
    SourcePort,
    TargetNode,
    TargetPort,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum InterfaceDiagnosticCardinalityReasonV01 {
    FanIn,
    FanOut,
    MergePolicy,
    MinConnections,
    MaxConnections,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct InterfaceDiagnosticCardinalityV01 {
    pub reason: InterfaceDiagnosticCardinalityReasonV01,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub policy: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub limit: Option<Option<u64>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub actual: Option<u64>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct InterfaceDiagnosticDetailV01 {
    pub edge_id: String,
    pub source_node_id: String,
    pub source_port_id: String,
    pub target_node_id: String,
    pub target_port_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub missing_endpoint: Option<InterfaceDiagnosticMissingEndpointV01>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expected_direction: Option<PortDirectionV01>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub actual_direction: Option<PortDirectionV01>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expected_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub actual_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cardinality: Option<InterfaceDiagnosticCardinalityV01>,
    pub recovery_actions: Vec<InterfaceRecoveryActionIdV01>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct PasteGraphFragmentOptions {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub outside_endpoint_policy: Option<GraphFragmentOutsideEndpointPolicyV01>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id_conflict_policy: Option<IdConflictPolicy>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub interface_incident_edge_policy: Option<InterfaceIncidentEdgePolicyV01>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub preserve_relative_positions: Option<bool>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct PasteGraphFragmentRequest {
    pub target: GraphTargetRef,
    pub fragment: GraphFragmentV01,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub placement: Option<PastePlacement>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub options: Option<PasteGraphFragmentOptions>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeOperationAttribution {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub actor_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub client_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub label: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeOperationEnvelope {
    pub schema: String,
    pub schema_version: String,
    pub id: String,
    pub kind: String,
    pub request: PasteGraphFragmentRequest,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub attribution: Option<RuntimeOperationAttribution>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub correlation_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub created_at: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct IdRemapResult {
    pub node_id_map: BTreeMap<String, String>,
    pub edge_id_map: BTreeMap<String, String>,
    pub omitted_edge_ids: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeOperationDiagnostic {
    pub severity: String,
    pub code: String,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub target: Option<GraphTargetRef>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expected_revision: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub actual_revision: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duplicates: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub nodes: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub edges: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub interface_policy: Option<InterfaceIncidentEdgePolicyV01>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub interface_detail: Option<InterfaceDiagnosticDetailV01>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct PasteGraphFragmentResponse {
    pub schema: String,
    pub schema_version: String,
    pub ok: bool,
    pub applied: bool,
    pub conflict: bool,
    pub target: GraphTargetRef,
    pub revision_before: String,
    pub revision_after: Option<String>,
    pub history_entry_id: Option<String>,
    pub id_remap: IdRemapResult,
    pub diagnostics: Vec<RuntimeOperationDiagnostic>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeCollaborationCausalMetadata {
    pub base_revision: String,
    pub base_sequence: u64,
    pub vector: BTreeMap<String, u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub observed_operation_ids: Option<Vec<String>>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum RuntimeCollaborationAuthSubjectKind {
    Anonymous,
    User,
    Service,
    Deferred,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeCollaborationAuthSubject {
    pub kind: RuntimeCollaborationAuthSubjectKind,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub subject_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub issuer: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub display_name: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeCollaborationParticipant {
    pub participant_id: String,
    pub session_id: String,
    pub joined_at: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub display_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub color: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub capabilities: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub auth_subject: Option<RuntimeCollaborationAuthSubject>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeCollaborationCanvasPosition {
    pub x: f64,
    pub y: f64,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(tag = "op", rename_all_fields = "camelCase")]
pub enum RuntimeCollaborationChange {
    #[serde(rename = "node.add")]
    NodeAdd {
        change_id: String,
        node: Box<GraphNodeV01>,
        #[serde(skip_serializing_if = "Option::is_none")]
        view: Option<RuntimeCollaborationCanvasPosition>,
    },
    #[serde(rename = "node.move")]
    NodeMove {
        change_id: String,
        node_id: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        from: Option<RuntimeCollaborationCanvasPosition>,
        to: RuntimeCollaborationCanvasPosition,
    },
    #[serde(rename = "node.delete")]
    NodeDelete {
        change_id: String,
        node_id: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        tombstone_id: Option<String>,
    },
    #[serde(rename = "edge.connect")]
    EdgeConnect {
        change_id: String,
        edge: Box<EdgeSpecV01>,
    },
    #[serde(rename = "edge.disconnect")]
    EdgeDisconnect { change_id: String, edge_id: String },
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum RuntimeCollaborationUndoRedoAction {
    Undo,
    Redo,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum RuntimeCollaborationUndoScopeKind {
    Participant,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeCollaborationUndoScope {
    pub kind: RuntimeCollaborationUndoScopeKind,
    pub participant_id: String,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(
    tag = "kind",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
)]
pub enum RuntimeCollaborationOperationPayload {
    ChangeSet {
        target: GraphTargetRef,
        changes: Vec<RuntimeCollaborationChange>,
        #[serde(skip_serializing_if = "Option::is_none")]
        undo_group_id: Option<String>,
        #[serde(skip_serializing_if = "Option::is_none")]
        description: Option<String>,
    },
    PasteGraphFragment {
        request: Box<PasteGraphFragmentRequest>,
        #[serde(skip_serializing_if = "Option::is_none")]
        undo_group_id: Option<String>,
        #[serde(skip_serializing_if = "Option::is_none")]
        description: Option<String>,
    },
    UndoRedo {
        action: RuntimeCollaborationUndoRedoAction,
        scope: RuntimeCollaborationUndoScope,
        #[serde(skip_serializing_if = "Option::is_none")]
        subject_operation_id: Option<String>,
        #[serde(skip_serializing_if = "Option::is_none")]
        undo_group_id: Option<String>,
        #[serde(skip_serializing_if = "Option::is_none")]
        max_operations: Option<u64>,
    },
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeCollaborationOperationEnvelope {
    pub schema: String,
    pub schema_version: String,
    pub operation_id: String,
    pub session_id: String,
    pub participant_id: String,
    pub idempotency_key: String,
    pub causal: RuntimeCollaborationCausalMetadata,
    pub payload: RuntimeCollaborationOperationPayload,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub auth_subject: Option<RuntimeCollaborationAuthSubject>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub correlation_id: Option<String>,
    pub submitted_at: String,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeCollaborationOperationBatch {
    pub schema: String,
    pub schema_version: String,
    pub session_id: String,
    pub operations: Vec<RuntimeCollaborationOperationEnvelope>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub submitted_at: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeCollaborationOperationDiagnostic {
    pub severity: String,
    pub code: String,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub participant_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub operation_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub idempotency_key: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expected_revision: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub actual_revision: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expected_sequence: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub actual_sequence: Option<u64>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeCollaborationServerClock {
    pub revision: String,
    pub sequence: u64,
    pub vector: BTreeMap<String, u64>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeCollaborationAck {
    pub sequence: u64,
    pub revision: String,
    pub server_clock: RuntimeCollaborationServerClock,
    pub applied_at: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum RuntimeCollaborationNackReason {
    BaseRevisionMismatch,
    CausalityGap,
    DuplicateIdempotencyKey,
    InvalidOperation,
    ParticipantExpired,
    UnsupportedOperation,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeCollaborationNack {
    pub reason: RuntimeCollaborationNackReason,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub retryable: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub diagnostics: Option<Vec<RuntimeCollaborationOperationDiagnostic>>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeCollaborationConflict {
    pub code: String,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub change_ids: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub node_ids: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub edge_ids: Option<Vec<String>>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum RuntimeCollaborationRebaseStrategy {
    OtTransform,
    CrdtMerge,
    ServerReject,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeCollaborationRebase {
    pub from: RuntimeCollaborationCausalMetadata,
    pub to: RuntimeCollaborationCausalMetadata,
    pub strategy: RuntimeCollaborationRebaseStrategy,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub transformed_payload: Option<RuntimeCollaborationOperationPayload>,
    pub conflicts: Vec<RuntimeCollaborationConflict>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum RuntimeCollaborationOperationStatus {
    Accepted,
    Duplicate,
    Rejected,
    Rebased,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeCollaborationOperationResult {
    pub schema: String,
    pub schema_version: String,
    pub session_id: String,
    pub operation_id: String,
    pub participant_id: String,
    pub idempotency_key: String,
    pub status: RuntimeCollaborationOperationStatus,
    pub causal: RuntimeCollaborationCausalMetadata,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ack: Option<RuntimeCollaborationAck>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub nack: Option<RuntimeCollaborationNack>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rebase: Option<RuntimeCollaborationRebase>,
    pub diagnostics: Vec<RuntimeCollaborationOperationDiagnostic>,
    pub created_at: String,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeCollaborationOperationBatchResult {
    pub schema: String,
    pub schema_version: String,
    pub session_id: String,
    pub results: Vec<RuntimeCollaborationOperationResult>,
    pub diagnostics: Vec<RuntimeCollaborationOperationDiagnostic>,
    pub created_at: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum RuntimeCollaborationPresenceState {
    Joined,
    Active,
    Idle,
    Away,
    Left,
    Expired,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeCollaborationPresence {
    pub state: RuntimeCollaborationPresenceState,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub display_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub color: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status_text: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub capabilities: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub connection_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub client_window_id: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeCollaborationPresenceEnvelope {
    pub schema: String,
    pub schema_version: String,
    pub session_id: String,
    pub participant_id: String,
    pub presence: RuntimeCollaborationPresence,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub auth_subject: Option<RuntimeCollaborationAuthSubject>,
    pub updated_at: String,
    pub expires_at: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeCollaborationPortEndpoint {
    pub node_id: String,
    pub port_id: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeCollaborationTextPosition {
    pub node_id: String,
    pub field: String,
    pub offset: u64,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(
    tag = "kind",
    rename_all = "lowercase",
    rename_all_fields = "camelCase"
)]
pub enum RuntimeCollaborationSelectionRange {
    Nodes {
        node_ids: Vec<String>,
    },
    Edges {
        edge_ids: Vec<String>,
    },
    Ports {
        endpoints: Vec<RuntimeCollaborationPortEndpoint>,
    },
    Text {
        anchor: RuntimeCollaborationTextPosition,
        focus: RuntimeCollaborationTextPosition,
    },
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeCollaborationSelection {
    pub ranges: Vec<RuntimeCollaborationSelectionRange>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub active_range_index: Option<u64>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(
    tag = "kind",
    rename_all = "lowercase",
    rename_all_fields = "camelCase"
)]
pub enum RuntimeCollaborationCursor {
    Canvas {
        x: f64,
        y: f64,
        #[serde(skip_serializing_if = "Option::is_none")]
        client_window_id: Option<String>,
    },
    Node {
        node_id: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        port_id: Option<String>,
        #[serde(skip_serializing_if = "Option::is_none")]
        client_window_id: Option<String>,
    },
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeCollaborationSelectionEnvelope {
    pub schema: String,
    pub schema_version: String,
    pub session_id: String,
    pub participant_id: String,
    pub target: GraphTargetRef,
    pub selection: RuntimeCollaborationSelection,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cursor: Option<RuntimeCollaborationCursor>,
    pub updated_at: String,
    pub expires_at: String,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(
    tag = "kind",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
)]
pub enum RuntimeCollaborationEventPayload {
    OperationResult {
        result: Box<RuntimeCollaborationOperationResult>,
    },
    Presence {
        presence: Box<RuntimeCollaborationPresenceEnvelope>,
    },
    Selection {
        selection: Box<RuntimeCollaborationSelectionEnvelope>,
    },
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum RuntimeCollaborationEventKind {
    OperationResult,
    Presence,
    Selection,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeCollaborationEventEnvelope {
    pub schema: String,
    pub schema_version: String,
    pub event_id: String,
    pub session_id: String,
    pub sequence: u64,
    pub causal: RuntimeCollaborationCausalMetadata,
    pub kind: RuntimeCollaborationEventKind,
    pub payload: RuntimeCollaborationEventPayload,
    pub replay: RuntimeEventReplayMetadata,
    pub created_at: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum RuntimeSessionEventKind {
    Snapshot,
    Load,
    Clear,
    Mutate,
    Undo,
    Redo,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum RuntimeSessionLifecycleState {
    Initializing,
    Ready,
    Closing,
    Closed,
    Error,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum RuntimeConnectionProfileMode {
    LocalManaged,
    LocalShared,
    Remote,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum RuntimeOwnershipMode {
    OwnedChild,
    External,
    Remote,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum RuntimeEndpointProtocol {
    Http,
    Https,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeEndpointMetadata {
    pub url: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub canonical_url: Option<String>,
    pub protocol: RuntimeEndpointProtocol,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub host: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub port: Option<u16>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tls: Option<bool>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeProcessMetadata {
    pub owned_by_host: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub pid: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub executable_path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub working_directory: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub started_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub owner_window_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub platform: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub arch: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeConnectionProfile {
    pub mode: RuntimeConnectionProfileMode,
    pub ownership: RuntimeOwnershipMode,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub display_name: Option<String>,
    pub endpoint: RuntimeEndpointMetadata,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub process: Option<RuntimeProcessMetadata>,
}

pub type RuntimeProjectSnapshot = ProjectDocumentV01;

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum RuntimeDiagnosticSeverity {
    Error,
    Warning,
    Info,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeDiagnostic {
    pub severity: RuntimeDiagnosticSeverity,
    pub message: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub code: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub details: Option<Value>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeSessionSnapshot {
    pub session_revision: u64,
    pub view_revision: u64,
    pub control_revision: u64,
    pub project: Option<RuntimeProjectSnapshot>,
    pub diagnostics: Vec<RuntimeDiagnostic>,
    pub plan: Option<Value>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeMutationRequest {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub operation: Option<RuntimeOperationEnvelope>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub view_patch: Option<RuntimeViewPatch>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub client_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct RuntimeViewPatch {
    pub base_view_revision: u64,
    pub ops: Vec<RuntimeViewPatchOperation>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields, tag = "op")]
pub enum RuntimeViewPatchOperation {
    #[serde(rename = "setNodeView")]
    SetNodeView {
        #[serde(rename = "nodeId")]
        node_id: String,
        view: CanvasNodeViewV01,
    },
    #[serde(rename = "moveNodeView")]
    MoveNodeView {
        #[serde(rename = "nodeId")]
        node_id: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        from: Option<CanvasNodeViewV01>,
        to: CanvasNodeViewV01,
    },
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum RuntimeHistoryEntryKind {
    Apply,
    Undo,
    Redo,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeHistoryEntry {
    pub id: String,
    pub sequence: u64,
    pub kind: RuntimeHistoryEntryKind,
    pub mutation: RuntimeMutationRequest,
    pub inverse_mutation: RuntimeMutationRequest,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub subject_event_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub client_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeHistory {
    pub schema: String,
    pub schema_version: String,
    pub entries: Vec<RuntimeHistoryEntry>,
    pub can_undo: bool,
    pub can_redo: bool,
    pub undo_depth: u64,
    pub redo_depth: u64,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeEventReplayWindow {
    pub cursor_kind: String,
    pub current_cursor: String,
    pub earliest_sequence: u64,
    pub latest_sequence: u64,
    pub replay_limit: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub overflow: Option<bool>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeSessionCapabilitySet {
    pub session_addressing: bool,
    pub event_replay: bool,
    pub multi_window: bool,
    pub profiles: Vec<RuntimeConnectionProfileMode>,
    pub auth_policy: String,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeSessionInfoResponse {
    pub schema: String,
    pub schema_version: String,
    pub ok: bool,
    pub session_id: String,
    pub lifecycle: RuntimeSessionLifecycleState,
    pub snapshot: RuntimeSessionSnapshot,
    pub profile: RuntimeConnectionProfile,
    pub capabilities: RuntimeSessionCapabilitySet,
    pub event_replay: RuntimeEventReplayWindow,
    pub diagnostics: Vec<RuntimeDiagnostic>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum RuntimeEventReplayGapReason {
    RetentionOverflow,
    StreamReset,
    Unknown,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeEventReplayGap {
    pub expected_sequence: u64,
    pub actual_sequence: u64,
    pub reason: RuntimeEventReplayGapReason,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeEventReplayMetadata {
    pub cursor: String,
    pub previous_cursor: Option<String>,
    pub replayed: bool,
    pub gap: Option<RuntimeEventReplayGap>,
    pub overflow: bool,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeSessionEvent {
    pub schema: String,
    pub schema_version: String,
    pub id: String,
    pub session_id: String,
    pub sequence: u64,
    pub session_revision: u64,
    pub kind: RuntimeSessionEventKind,
    pub snapshot: RuntimeSessionSnapshot,
    pub history: RuntimeHistory,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mutation: Option<RuntimeHistoryEntry>,
    pub replay: RuntimeEventReplayMetadata,
    pub diagnostics: Vec<RuntimeDiagnostic>,
    pub created_at: String,
}

pub const SKENION_PACKAGE_MANIFEST_FILE_NAME: &str = "skenion.package.json";

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum PackageCategoryV01 {
    Patch,
    Native,
    Mixed,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum PackageSourceV01 {
    FirstParty,
    Marketplace,
    Workspace,
    ProjectLocal,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum PackageRootKindV01 {
    Package,
    Project,
    DevLink,
    MarketplaceInstall,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum PackageTrustV01 {
    Trusted,
    Untrusted,
    Quarantined,
}

#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Deserialize, Serialize)]
pub enum PackageTargetTripleV01 {
    #[serde(rename = "aarch64-apple-darwin")]
    Aarch64AppleDarwin,
    #[serde(rename = "x86_64-apple-darwin")]
    X8664AppleDarwin,
    #[serde(rename = "x86_64-pc-windows-msvc")]
    X8664WindowsMsvc,
    #[serde(rename = "aarch64-pc-windows-msvc")]
    Aarch64WindowsMsvc,
    #[serde(rename = "x86_64-unknown-linux-gnu")]
    X8664LinuxGnu,
    #[serde(rename = "aarch64-unknown-linux-gnu")]
    Aarch64LinuxGnu,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum PackageChecksumAlgorithmV01 {
    Sha256,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum PackageEvidenceKindV01 {
    Checksum,
    Signature,
    Sbom,
    Attestation,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum PackageDiagnosticSeverityV01 {
    Error,
    Warning,
    Info,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum PackageListingTargetSupportKindV01 {
    TargetIndependent,
    Targeted,
    Unavailable,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum PackageListingArtifactKindV01 {
    Manifest,
    PackageArchive,
    NativeArtifact,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum PackageListingDiagnosticCodeV01 {
    MalformedListingMetadata,
    UnsupportedContractsRange,
    MissingArtifact,
    UnavailableTarget,
    QuarantinedPackage,
    HiddenPackage,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct PackageContractsSupportV01 {
    pub line: String,
    pub range: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct PackageProvidedRefV01 {
    pub id: String,
    pub path: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Default, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct PackageProvidesV01 {
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub patches: Vec<PackageProvidedRefV01>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub nodes: Vec<PackageProvidedRefV01>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub resources: Vec<PackageProvidedRefV01>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub help: Vec<PackageProvidedRefV01>,
}

#[derive(Debug, Clone, PartialEq, Eq, Default, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct PackagePathsV01 {
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub patches: Vec<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub resources: Vec<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub docs: Vec<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub tests: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct PackageChecksumV01 {
    pub algorithm: PackageChecksumAlgorithmV01,
    pub value: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct PackageChecksumRefV01 {
    pub id: String,
    pub path: String,
    pub checksum: PackageChecksumV01,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct PackageEvidenceRefV01 {
    pub id: String,
    pub kind: PackageEvidenceKindV01,
    pub path: String,
    pub checksum: PackageChecksumV01,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct PackageNativeArtifactV01 {
    pub target: PackageTargetTripleV01,
    pub path: String,
    pub entrypoint: String,
    pub checksum: PackageChecksumV01,
    pub evidence_refs: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct PackageDiagnosticV01 {
    pub severity: PackageDiagnosticSeverityV01,
    pub code: String,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<Value>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct PackageManifestV01 {
    pub schema: String,
    pub schema_version: String,
    pub id: String,
    pub version: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub display_name: Option<String>,
    pub category: PackageCategoryV01,
    pub contracts: PackageContractsSupportV01,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub runtime_abi_range: Option<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub targets: Vec<PackageTargetTripleV01>,
    pub provides: PackageProvidesV01,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub patch_library: Vec<PatchDefinitionV01>,
    pub paths: PackagePathsV01,
    pub checksums: Vec<PackageChecksumRefV01>,
    pub evidence: Vec<PackageEvidenceRefV01>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub native_artifacts: Vec<PackageNativeArtifactV01>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub diagnostics: Vec<PackageDiagnosticV01>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct PackageRootDocumentV01 {
    pub schema: String,
    pub schema_version: String,
    pub manifest_file_name: String,
    pub manifest: PackageManifestV01,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct PackageListingTargetSupportV01 {
    pub kind: PackageListingTargetSupportKindV01,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub targets: Vec<PackageTargetTripleV01>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub summary: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct PackageListingProvidedSummaryRefV01 {
    pub id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Default, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct PackageListingProvidesSummaryV01 {
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub patches: Vec<PackageListingProvidedSummaryRefV01>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub nodes: Vec<PackageListingProvidedSummaryRefV01>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub resources: Vec<PackageListingProvidedSummaryRefV01>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub help: Vec<PackageListingProvidedSummaryRefV01>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub native_objects: Vec<PackageListingProvidedSummaryRefV01>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub codecs: Vec<PackageListingProvidedSummaryRefV01>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub capabilities: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct PackageListingArtifactSummaryV01 {
    pub kind: PackageListingArtifactKindV01,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub target: Option<PackageTargetTripleV01>,
    pub path: String,
    pub checksum: PackageChecksumV01,
    pub evidence_refs: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct PackageListingEvidenceSummaryV01 {
    pub id: String,
    pub kind: PackageEvidenceKindV01,
    pub path: String,
    pub checksum: PackageChecksumV01,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct PackageListingArtifactEvidenceSummaryV01 {
    pub artifacts: Vec<PackageListingArtifactSummaryV01>,
    pub evidence: Vec<PackageListingEvidenceSummaryV01>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct PackageListingDiscoverySignalsV01 {
    pub stargazer_count: u64,
    pub ranking_score: f64,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct PackageListingDiagnosticV01 {
    pub severity: PackageDiagnosticSeverityV01,
    pub code: PackageListingDiagnosticCodeV01,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<Value>,
}

/// Public marketplace/package discovery projection.
///
/// Project packageId, version, category, contracts, runtimeAbiRange,
/// targetSupport targets, provides, and artifactEvidence from PackageManifestV01
/// plus release artifacts; displayName is manifest-derived when present.
/// Marketplace/discovery metadata owns summary, description, tags, license,
/// homepageUrl, repositoryUrl, discoverySignals, and visibility diagnostics.
/// This DTO intentionally excludes accounts, auth, writes, install
/// transactions, local registry roots, and mutable package manifests.
#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct PackageListingV01 {
    pub schema: String,
    pub schema_version: String,
    pub package_id: String,
    pub version: String,
    pub display_name: String,
    pub summary: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub category: PackageCategoryV01,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub tags: Vec<String>,
    pub license: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub homepage_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub repository_url: Option<String>,
    pub contracts: PackageContractsSupportV01,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub runtime_abi_range: Option<String>,
    pub target_support: PackageListingTargetSupportV01,
    pub provides: PackageListingProvidesSummaryV01,
    pub artifact_evidence: PackageListingArtifactEvidenceSummaryV01,
    pub discovery_signals: PackageListingDiscoverySignalsV01,
    pub diagnostics: Vec<PackageListingDiagnosticV01>,
}

/// Public package discovery/search response.
///
/// This read-only aggregate response intentionally defers install/update plan
/// request and response DTOs to the package management contract slice.
#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct PackageDiscoveryResponseV01 {
    pub schema: String,
    pub schema_version: String,
    pub ok: bool,
    pub listings: Vec<PackageListingV01>,
    pub diagnostics: Vec<PackageListingDiagnosticV01>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum PackageInstallPlanIntentV01 {
    Install,
    Update,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum PackageInstallPlanTargetOsV01 {
    Macos,
    Windows,
    Linux,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
pub enum PackageInstallPlanTargetArchV01 {
    #[serde(rename = "aarch64")]
    Aarch64,
    #[serde(rename = "x86_64")]
    X8664,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum PackageInstallPlanActionKindV01 {
    Download,
    Verify,
    Stage,
    Replace,
    Disable,
    Rollback,
    Keep,
    Reject,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum PackageInstallPlanCheckKindV01 {
    ContractsLine,
    RuntimeAbi,
    TargetTriple,
    Checksum,
    Provenance,
    CapabilityChange,
    LockState,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum PackageInstallPlanCheckStatusV01 {
    Pass,
    Warning,
    Fail,
    Skipped,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum PackageInstallPlanCapabilityChangeKindV01 {
    Add,
    Remove,
    Keep,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum PackageInstallPlanCapabilityKindV01 {
    Patch,
    Node,
    Resource,
    NativeObject,
    Codec,
    Help,
    Capability,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum PackageInstallPlanDiagnosticCodeV01 {
    IncompatibleContractsLine,
    IncompatibleRuntimeAbi,
    UnsupportedTarget,
    MissingArtifact,
    ChecksumMismatch,
    MissingProvenanceEvidence,
    MissingLockEntry,
    AmbiguousPackageId,
    StaleInstalledLock,
    RemovedCapability,
    RollbackUnavailable,
}

#[derive(Debug, Clone, PartialEq, Eq, Default, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct PackageInstallPlanDesiredV01 {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub version: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub version_range: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct PackageInstallPlanTargetV01 {
    pub os: PackageInstallPlanTargetOsV01,
    pub arch: PackageInstallPlanTargetArchV01,
    pub triple: PackageTargetTripleV01,
    pub contracts: PackageContractsSupportV01,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub runtime_abi_range: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct PackageInstallPlanCurrentStateV01 {
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub package_lock: Vec<ProjectPackageLockEntryV01>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub object_bindings: Vec<ProjectObjectBindingV01>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub installed_lock_entry_id: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct PackageInstallPlanCandidateV01 {
    pub listing: PackageListingV01,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub manifest: Option<PackageManifestV01>,
}

/// Declarative package install/update planning input.
///
/// Carries current lock/binding state plus candidate package listing and
/// optional manifest evidence. It intentionally has no endpoint, registry
/// write, filesystem mutation, or native loading semantics.
#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct PackageInstallPlanRequestV01 {
    pub schema: String,
    pub schema_version: String,
    pub request_id: String,
    pub intent: PackageInstallPlanIntentV01,
    pub package_id: String,
    pub desired: PackageInstallPlanDesiredV01,
    pub target: PackageInstallPlanTargetV01,
    pub current: PackageInstallPlanCurrentStateV01,
    pub candidates: Vec<PackageInstallPlanCandidateV01>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub rollback_candidates: Vec<ProjectPackageLockEntryV01>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct PackageInstallPlanCheckV01 {
    pub kind: PackageInstallPlanCheckKindV01,
    pub status: PackageInstallPlanCheckStatusV01,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub diagnostic_refs: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct PackageInstallPlanCapabilityChangeV01 {
    pub kind: PackageInstallPlanCapabilityChangeKindV01,
    pub capability_kind: PackageInstallPlanCapabilityKindV01,
    pub id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub diagnostic_ref: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct PackageInstallPlanActionV01 {
    pub id: String,
    pub order: u64,
    pub kind: PackageInstallPlanActionKindV01,
    pub package_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub version: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub lock_entry_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub to_lock_entry_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rollback_lock_entry_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub target: Option<PackageTargetTripleV01>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub artifact: Option<PackageListingArtifactSummaryV01>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub checksum: Option<PackageChecksumV01>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub evidence_refs: Vec<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub capability_changes: Vec<PackageInstallPlanCapabilityChangeV01>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub diagnostic_refs: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct PackageInstallPlanDiagnosticV01 {
    pub id: String,
    pub severity: PackageDiagnosticSeverityV01,
    pub code: PackageInstallPlanDiagnosticCodeV01,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<Value>,
}

/// Declarative package install/update planning output.
///
/// A response can express a safe keep/no-op, ordered download/verify/stage/
/// replace actions, rollback, or fail-closed rejection with diagnostics. The
/// actions are planning records only and do not authorize Runtime mutation.
#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct PackageInstallPlanResponseV01 {
    pub schema: String,
    pub schema_version: String,
    pub request_id: String,
    pub ok: bool,
    pub package_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub selected_version: Option<String>,
    pub target: PackageInstallPlanTargetV01,
    pub checks: Vec<PackageInstallPlanCheckV01>,
    pub actions: Vec<PackageInstallPlanActionV01>,
    pub diagnostics: Vec<PackageInstallPlanDiagnosticV01>,
}

/// Runtime HTTP package registry entry exposed to clients.
///
/// This is a Contracts-owned projection of package manifest identity, provided
/// surfaces, checksum evidence, and load diagnostics. Runtime registry
/// revisions, event ids, install transactions, active/enabled state, watcher
/// state, and cache bookkeeping remain Runtime-internal until a later contract
/// promotes one of those fields explicitly.
#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct PackageRegistryEntryV01 {
    pub package_id: String,
    pub version: String,
    pub category: PackageCategoryV01,
    pub source: PackageSourceV01,
    pub root: PackageRootKindV01,
    pub trust: PackageTrustV01,
    pub contracts: PackageContractsSupportV01,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub runtime_abi_range: Option<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub targets: Vec<PackageTargetTripleV01>,
    pub manifest_path: String,
    pub manifest_checksum: PackageChecksumV01,
    pub provides: PackageProvidesV01,
    pub diagnostics: Vec<PackageDiagnosticV01>,
}

/// Snapshot DTO for Runtime's `/v0/packages` endpoint.
///
/// The response intentionally has no revision or event cursor; clients that
/// need registry event history must use a future explicit Runtime contract
/// rather than inferring ledger state from this package list.
#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct PackageRegistryListResponseV01 {
    pub ok: bool,
    pub packages: Vec<PackageRegistryEntryV01>,
    pub diagnostics: Vec<PackageDiagnosticV01>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum ProviderRefKindV01 {
    Patch,
    Node,
    Resource,
    NativeObject,
    Codec,
    Help,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ProjectPackageDependencyV01 {
    pub package_id: String,
    pub version_range: String,
    pub lock_entry_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub required: Option<bool>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ProjectPackageLockEntryV01 {
    pub id: String,
    pub package_id: String,
    pub version: String,
    pub category: PackageCategoryV01,
    pub source: PackageSourceV01,
    pub root: PackageRootKindV01,
    pub trust: PackageTrustV01,
    pub contracts_line: String,
    pub contracts_range: String,
    pub manifest_path: String,
    pub manifest_checksum: PackageChecksumV01,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub evidence_refs: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub runtime_abi_range: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub target: Option<PackageTargetTripleV01>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub native_artifacts: Vec<PackageNativeArtifactV01>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ProjectResourceLockEntryV01 {
    pub id: String,
    pub lock_entry_id: String,
    pub resource_id: String,
    pub path: String,
    pub checksum: PackageChecksumV01,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub evidence_refs: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum ProjectObjectBindingStatusV01 {
    Resolved,
    Unresolved,
    Ambiguous,
    Stale,
    Missing,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum ProjectObjectBindingDiagnosticCodeV01 {
    BindingUnresolved,
    BindingAmbiguous,
    BindingTargetMissing,
    BindingTargetStale,
    BindingLockMismatch,
    BindingInterfaceDrift,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ProjectObjectBindingDiagnosticV01 {
    pub severity: PackageDiagnosticSeverityV01,
    pub code: ProjectObjectBindingDiagnosticCodeV01,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<Value>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(
    tag = "kind",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
)]
pub enum ProjectObjectBindingTargetV01 {
    ProjectPatch {
        patch_id: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        revision: Option<String>,
        #[serde(skip_serializing_if = "Option::is_none")]
        interface_revision: Option<String>,
        #[serde(skip_serializing_if = "Option::is_none")]
        interface_digest: Option<PackageChecksumV01>,
    },
    PackageProvider {
        lock_entry_id: String,
        package_id: String,
        capability_kind: ProviderRefKindV01,
        provided_id: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        alias: Option<String>,
        #[serde(skip_serializing_if = "Option::is_none")]
        display_name: Option<String>,
    },
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ProjectObjectBindingV01 {
    pub id: String,
    pub object_text: String,
    pub status: ProjectObjectBindingStatusV01,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub target: Option<ProjectObjectBindingTargetV01>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub diagnostics: Vec<ProjectObjectBindingDiagnosticV01>,
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
    pub extra: serde_json::Map<String, Value>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct PatchDefinitionV01 {
    pub id: String,
    pub revision: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<ProjectMetadataV01>,
    pub graph: GraphDocumentV01,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub view_state: Option<ViewStateV01>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PatchContractPortV01 {
    #[serde(flatten)]
    pub port: PortSpecV01,
    pub boundary_node_id: String,
    pub boundary_port_id: String,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct PatchContractV01 {
    pub id: String,
    pub revision: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<ProjectMetadataV01>,
    pub ports: Vec<PatchContractPortV01>,
}

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
    pub patch_library: Vec<PatchDefinitionV01>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub package_dependencies: Vec<ProjectPackageDependencyV01>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub package_lock: Vec<ProjectPackageLockEntryV01>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub resource_lock: Vec<ProjectResourceLockEntryV01>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub object_bindings: Vec<ProjectObjectBindingV01>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tutorial: Option<serde_json::Map<String, Value>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub help: Option<serde_json::Map<String, Value>>,
}

fn string_param(node: &GraphNodeV01, key: &str) -> Option<String> {
    node.params
        .get(key)
        .and_then(Value::as_str)
        .filter(|value| !value.is_empty())
        .map(ToOwned::to_owned)
}

fn boundary_port_id(node: &GraphNodeV01, port: &PortSpecV01, eligible_port_count: usize) -> String {
    string_param(node, "portId")
        .or_else(|| string_param(node, "externalPortId"))
        .unwrap_or_else(|| {
            if eligible_port_count == 1 {
                node.id.clone()
            } else {
                port.id.clone()
            }
        })
}

fn boundary_port_label(node: &GraphNodeV01, port: &PortSpecV01) -> Option<String> {
    port.label.clone().or_else(|| string_param(node, "label"))
}

fn derive_boundary_ports(
    node: &GraphNodeV01,
    internal_direction: PortDirectionV01,
    external_direction: PortDirectionV01,
) -> Vec<PatchContractPortV01> {
    let ports: Vec<&PortSpecV01> = node
        .ports
        .iter()
        .filter(|port| port.direction == internal_direction)
        .collect();

    ports
        .iter()
        .map(|port| {
            let mut external_port = (*port).clone();
            external_port.id = boundary_port_id(node, port, ports.len());
            external_port.direction = external_direction.clone();
            external_port.label = boundary_port_label(node, port);
            PatchContractPortV01 {
                port: external_port,
                boundary_node_id: node.id.clone(),
                boundary_port_id: port.id.clone(),
            }
        })
        .collect()
}

pub fn derive_patch_contract_v01(patch: &PatchDefinitionV01) -> PatchContractV01 {
    let mut ports = Vec::new();
    for node in &patch.graph.nodes {
        if node.kind == "core.inlet" {
            ports.extend(derive_boundary_ports(
                node,
                PortDirectionV01::Output,
                PortDirectionV01::Input,
            ));
        } else if node.kind == "core.outlet" {
            ports.extend(derive_boundary_ports(
                node,
                PortDirectionV01::Input,
                PortDirectionV01::Output,
            ));
        }
    }

    PatchContractV01 {
        id: patch.id.clone(),
        revision: patch.revision.clone(),
        metadata: patch.metadata.clone(),
        ports,
    }
}

pub fn derive_patch_contracts_v01(project: &ProjectDocumentV01) -> Vec<PatchContractV01> {
    project
        .patch_library
        .iter()
        .map(derive_patch_contract_v01)
        .collect()
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
pub struct GraphValidationDiagnosticV01 {
    pub severity: String,
    pub code: String,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub nodes: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub edges: Option<Vec<String>>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
pub struct GraphCycleValidationV01 {
    pub classification: CycleValidationV01,
    pub nodes: Vec<String>,
    pub edges: Vec<String>,
    pub message: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
pub struct GraphValidationResultV01 {
    pub ok: bool,
    pub diagnostics: Vec<GraphValidationDiagnosticV01>,
    pub cycles: Vec<GraphCycleValidationV01>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum ExecutionModelV01 {
    Event,
    Value,
    Frame,
    AudioBlock,
    VideoFrame,
    GpuPass,
    AsyncResource,
    ScriptControl,
    NativePlugin,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct NodeExecutionV01 {
    pub model: ExecutionModelV01,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub clock: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct NodeStateV01 {
    pub persistent: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct NodeSurfaceV01 {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub palette: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct NodeDefinitionManifestV01 {
    pub schema: String,
    pub schema_version: String,
    pub id: String,
    pub version: String,
    pub display_name: String,
    pub category: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub script_api_version: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bundle_hash: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub surface: Option<NodeSurfaceV01>,
    pub ports: Vec<PortSpecV01>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub port_groups: Option<Vec<PortGroupSpecV01>>,
    pub execution: NodeExecutionV01,
    pub state: NodeStateV01,
    pub permissions: Vec<String>,
    pub capabilities: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum ExtensionKindV01 {
    CorePackage,
    NativeRuntime,
    Codec,
    NodePack,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum ExtensionNativeArtifactAbiV01 {
    C,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum ExtensionCodecDirectionV01 {
    Decode,
    Encode,
    Duplex,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum ExtensionTransportKindV01 {
    Midi,
    Hid,
    Serial,
    Inline,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum ExtensionTestKindV01 {
    Node,
    Codec,
    Extension,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ExtensionNativeArtifactV01 {
    pub os: String,
    pub arch: String,
    pub abi: ExtensionNativeArtifactAbiV01,
    pub path: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sha256: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ExtensionNativeBindingV01 {
    pub entrypoint: String,
    pub artifacts: Vec<ExtensionNativeArtifactV01>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ExtensionCodecDescriptorV01 {
    pub id: String,
    pub version: String,
    pub transport_kinds: Vec<ExtensionTransportKindV01>,
    pub direction: ExtensionCodecDirectionV01,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ExtensionTransportDescriptorV01 {
    pub id: String,
    pub version: String,
    pub kind: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ExtensionHelpEntryV01 {
    pub node_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub node_version: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub markdown_path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub graph_path: Option<String>,
}

#[derive(Debug, Clone, Default, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ExtensionProvidesV01 {
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub nodes: Vec<NodeDefinitionManifestV01>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub codecs: Vec<ExtensionCodecDescriptorV01>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub transports: Vec<ExtensionTransportDescriptorV01>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub help: Vec<ExtensionHelpEntryV01>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ExtensionFrontendMetadataV01 {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub display_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub tags: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ExtensionTestDescriptorV01 {
    pub id: String,
    pub kind: ExtensionTestKindV01,
    pub target: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub fixture_path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expected_path: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ExtensionManifestV01 {
    pub schema: String,
    pub schema_version: String,
    pub id: String,
    pub version: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sdk_version: Option<String>,
    pub runtime_abi_version: String,
    pub kind: ExtensionKindV01,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub native: Option<ExtensionNativeBindingV01>,
    pub provides: ExtensionProvidesV01,
    pub permissions: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub frontend: Option<ExtensionFrontendMetadataV01>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub tests: Vec<ExtensionTestDescriptorV01>,
}
