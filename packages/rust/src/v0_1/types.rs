use serde::{Deserialize, Deserializer, Serialize};
use serde_json::Value;
use sha2::{Digest, Sha256};
use std::collections::BTreeMap;

use super::message_value::MessageValueV01;

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum DataFlowV01 {
    Control,
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

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum ValueLayoutV01 {
    Scalar,
    Interleaved,
    Planar,
    RowMajor,
    ColumnMajor,
    Strided,
    Opaque,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum ValuePayloadKindV01 {
    Empty,
    Json,
    Bytes,
    ResourceHandle,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum ValueResourceKindV01 {
    CpuBuffer,
    GpuBuffer,
    GpuTexture,
    RuntimeHandle,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum ValueClockV01 {
    Logical,
    HostTime,
    AudioSampleFrame,
    RenderFrame,
    VideoPts,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum ValueContinuityFlagV01 {
    Discontinuity,
    Keyframe,
    DroppedBefore,
    EndOfStream,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ValueEndpointRefV01 {
    pub node_id: String,
    pub port_id: String,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ValueFormatV01 {
    pub value_type_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub format: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub shape: Option<Vec<u64>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub dynamic_shape: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub layout: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub strides: Option<Vec<u64>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub byte_length: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sample_rate: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub channels: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub channel_layout: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub color_space: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub color_range: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub transfer: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub primaries: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub alpha_policy: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resource_kind: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct EndpointBindingDeliveryPolicyV01 {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub policy: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_in_flight: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub keyframes: Option<bool>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct EndpointBindingValueFormatV01 {
    pub binding_id: String,
    pub binding_epoch: u64,
    pub format_revision: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub format_digest: Option<String>,
    pub value_format: ValueFormatV01,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub source: Option<ValueEndpointRefV01>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub target: Option<ValueEndpointRefV01>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub delivery: Option<EndpointBindingDeliveryPolicyV01>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ValueOccurrenceHeaderV01 {
    pub binding_id: String,
    pub binding_epoch: u64,
    pub format_revision: u64,
    pub sequence: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub clock: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub timestamp: Option<f64>,
    pub payload_kind: ValuePayloadKindV01,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub byte_length: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub byte_offset: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub actual_shape: Option<Vec<u64>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub flags: Option<Vec<ValueContinuityFlagV01>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub dropped_before: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub duration: Option<f64>,
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

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct MessageKeyPolicyV01 {
    pub accepted: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub silent: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub trigger: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub store: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub emit: Option<Vec<String>>,
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
    pub message_keys: Option<MessageKeyPolicyV01>,
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
pub struct CanvasViewStateV01 {
    pub nodes: BTreeMap<String, CanvasNodeViewV01>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ViewStateV01 {
    pub schema: String,
    pub schema_version: String,
    pub canvas: CanvasViewStateV01,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(
    tag = "kind",
    rename_all = "camelCase",
    rename_all_fields = "camelCase",
    deny_unknown_fields
)]
pub enum ObjectProviderRefV01 {
    Core,
    ProjectPatch {
        patch_id: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        revision: Option<String>,
        #[serde(skip_serializing_if = "Option::is_none")]
        interface_revision: Option<String>,
        #[serde(skip_serializing_if = "Option::is_none")]
        interface_digest: Option<PackageChecksumV01>,
    },
    Package {
        package_id: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        lock_entry_id: Option<String>,
        #[serde(skip_serializing_if = "Option::is_none")]
        version: Option<String>,
    },
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ObjectImplementationRefV01 {
    pub provider: ObjectProviderRefV01,
    pub object_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub interface_digest: Option<PackageChecksumV01>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum ObjectResolutionStatusV01 {
    Resolved,
    Unresolved,
    Error,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum ObjectResolutionIssueCodeV01 {
    ResolutionUnresolved,
    ResolutionAmbiguous,
    ImplementationMissing,
    ImplementationStale,
    ImplementationLockMismatch,
    InterfaceDrift,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ObjectResolutionIssueV01 {
    pub severity: PackageIssueSeverityV01,
    pub code: ObjectResolutionIssueCodeV01,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<Value>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ObjectResolutionCandidateV01 {
    pub implementation: ObjectImplementationRefV01,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub object_spec: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub display_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ObjectResolutionV01 {
    pub status: ObjectResolutionStatusV01,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub selected_spec: Option<String>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub candidates: Vec<ObjectResolutionCandidateV01>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub issues: Vec<ObjectResolutionIssueV01>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct GraphNodeV01 {
    pub id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub implementation: Option<ObjectImplementationRefV01>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub object_spec: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub object_resolution: Option<ObjectResolutionV01>,
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
pub struct GraphFragmentIssueV01 {
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
    pub issues: Vec<GraphFragmentIssueV01>,
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
    PreserveIssue,
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
pub enum InterfaceIssueMissingEndpointV01 {
    SourceNode,
    SourcePort,
    TargetNode,
    TargetPort,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum InterfaceIssueCardinalityReasonV01 {
    FanIn,
    FanOut,
    MergePolicy,
    MinConnections,
    MaxConnections,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct InterfaceIssueCardinalityV01 {
    pub reason: InterfaceIssueCardinalityReasonV01,
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
pub struct InterfaceIssueDetailV01 {
    pub edge_id: String,
    pub source_node_id: String,
    pub source_port_id: String,
    pub target_node_id: String,
    pub target_port_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub missing_endpoint: Option<InterfaceIssueMissingEndpointV01>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expected_direction: Option<PortDirectionV01>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub actual_direction: Option<PortDirectionV01>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expected_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub actual_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cardinality: Option<InterfaceIssueCardinalityV01>,
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

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum NodeCatalogDisplayPaletteV01 {
    Direct,
    Text,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct NodeCatalogDisplayV01 {
    pub title: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub category: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub palette: Option<NodeCatalogDisplayPaletteV01>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub help_id: Option<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum NodeCatalogIssueSeverityV01 {
    Info,
    Warning,
    Error,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(
    tag = "kind",
    rename_all = "camelCase",
    rename_all_fields = "camelCase",
    deny_unknown_fields
)]
pub enum NodeCatalogIssueTargetV01 {
    Catalog,
    Entry { catalog_id: String },
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct NodeCatalogIssueV01 {
    pub severity: NodeCatalogIssueSeverityV01,
    pub code: String,
    pub message: String,
    pub target: NodeCatalogIssueTargetV01,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<Value>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct NodeCatalogEntryV01 {
    pub catalog_id: String,
    pub object_id: String,
    pub primary_object_spec: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub aliases: Option<Vec<String>>,
    pub provider: ObjectProviderRefV01,
    pub definition: NodeDefinitionManifestV01,
    pub creatable: bool,
    pub display: NodeCatalogDisplayV01,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub issues: Option<Vec<NodeCatalogIssueV01>>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct NodeCatalogSnapshotV01 {
    pub schema: String,
    pub schema_version: String,
    pub catalog_revision: PackageChecksumV01,
    pub entries: Vec<NodeCatalogEntryV01>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub issues: Option<Vec<NodeCatalogIssueV01>>,
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
pub enum PackageIssueSeverityV01 {
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
pub enum PackageListingIssueCodeV01 {
    MalformedListingMetadata,
    UnsupportedContractsVersion,
    MissingArtifact,
    UnavailableTarget,
    QuarantinedPackage,
    HiddenPackage,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct PackageContractsRequirementV01 {
    pub version: String,
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

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct PackageObjectExportV01 {
    pub object_id: String,
    pub primary_object_spec: String,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub aliases: Vec<String>,
    pub definition_path: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub help_id: Option<String>,
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
    pub objects: Vec<PackageObjectExportV01>,
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
pub struct PackageIssueV01 {
    pub severity: PackageIssueSeverityV01,
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
    pub contracts: PackageContractsRequirementV01,
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
    pub issues: Vec<PackageIssueV01>,
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

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct PackageListingObjectExportSummaryV01 {
    pub object_id: String,
    pub primary_object_spec: String,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub aliases: Vec<String>,
    pub definition_path: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub help_id: Option<String>,
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
    pub objects: Vec<PackageListingObjectExportSummaryV01>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub resources: Vec<PackageListingProvidedSummaryRefV01>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub help: Vec<PackageListingProvidedSummaryRefV01>,
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
pub struct PackageListingIssueV01 {
    pub severity: PackageIssueSeverityV01,
    pub code: PackageListingIssueCodeV01,
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
/// homepageUrl, repositoryUrl, discoverySignals, and visibility issues.
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
    pub contracts: PackageContractsRequirementV01,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub runtime_abi_range: Option<String>,
    pub target_support: PackageListingTargetSupportV01,
    pub provides: PackageListingProvidesSummaryV01,
    pub artifact_evidence: PackageListingArtifactEvidenceSummaryV01,
    pub discovery_signals: PackageListingDiscoverySignalsV01,
    pub issues: Vec<PackageListingIssueV01>,
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
    pub issues: Vec<PackageListingIssueV01>,
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
    ContractsVersion,
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
pub enum PackageInstallPlanIssueCodeV01 {
    IncompatibleContractsVersion,
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
    pub contracts: PackageContractsRequirementV01,
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
    pub issue_refs: Vec<String>,
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
    pub issue_ref: Option<String>,
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
    pub issue_refs: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct PackageInstallPlanIssueV01 {
    pub id: String,
    pub severity: PackageIssueSeverityV01,
    pub code: PackageInstallPlanIssueCodeV01,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<Value>,
}

/// Declarative package install/update planning output.
///
/// A response can express a safe keep/no-op, ordered download/verify/stage/
/// replace actions, rollback, or fail-closed rejection with issues. The
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
    pub issues: Vec<PackageInstallPlanIssueV01>,
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
    pub contracts_version: String,
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
    Error,
}

pub type ProjectObjectBindingIssueCodeV01 = ObjectResolutionIssueCodeV01;
pub type ProjectObjectBindingIssueV01 = ObjectResolutionIssueV01;

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ProjectObjectBindingV01 {
    pub id: String,
    pub object_spec: String,
    pub status: ProjectObjectBindingStatusV01,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub implementation: Option<ObjectImplementationRefV01>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub candidates: Vec<ObjectResolutionCandidateV01>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub issues: Vec<ProjectObjectBindingIssueV01>,
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
    pub document_id: String,
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

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum RuntimeSessionLoadModeV01 {
    LoadIfEmpty,
    ReplaceIfMatch,
    ForceReplace,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeSessionLoadPreconditionV01 {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub document_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub session_revision: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub graph_revision: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeSessionLoadRequestV01 {
    pub schema: String,
    pub schema_version: String,
    pub project: ProjectDocumentV01,
    pub mode: RuntimeSessionLoadModeV01,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub precondition: Option<RuntimeSessionLoadPreconditionV01>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum RuntimeIssueSeverityV01 {
    Error,
    Warning,
    Info,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeIssueV01 {
    pub severity: RuntimeIssueSeverityV01,
    pub code: String,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<Value>,
}

#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum RuntimeNodeCatalogHelloModeV01 {
    #[default]
    None,
    IfChanged,
    Always,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeNodeCatalogHelloRequestV01 {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mode: Option<RuntimeNodeCatalogHelloModeV01>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub known_revision: Option<Value>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeSessionHelloPayloadV01 {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_cursor: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resume_token: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub node_catalog: Option<RuntimeNodeCatalogHelloRequestV01>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeRealtimeSessionRevisionsV01 {
    pub session_revision: u64,
    pub view_revision: u64,
    pub control_revision: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub graph_revision: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(tag = "status")]
pub enum RuntimeNodeCatalogStatusPayloadV01 {
    #[serde(rename = "notRequested")]
    NotRequested,
    #[serde(rename = "unchanged")]
    Unchanged {
        #[serde(rename = "catalogRevision")]
        catalog_revision: Value,
    },
    #[serde(rename = "included")]
    Included {
        #[serde(rename = "catalogRevision")]
        catalog_revision: Value,
        snapshot: NodeCatalogSnapshotV01,
    },
}

impl RuntimeNodeCatalogStatusPayloadV01 {
    pub fn snapshot(&self) -> Option<&NodeCatalogSnapshotV01> {
        match self {
            Self::Included { snapshot, .. } => Some(snapshot),
            Self::NotRequested | Self::Unchanged { .. } => None,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeSessionAttachedPayloadV01 {
    pub connection_id: String,
    pub client_id: String,
    pub window_id: String,
    pub resume_token: String,
    pub current_revisions: RuntimeRealtimeSessionRevisionsV01,
    pub snapshot: Value,
    pub global_cursor: String,
    pub node_catalog: RuntimeNodeCatalogStatusPayloadV01,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeSessionSyncRequiredPayloadV01 {
    pub connection_id: String,
    pub client_id: String,
    pub window_id: String,
    pub resume_token: String,
    pub current_revisions: RuntimeRealtimeSessionRevisionsV01,
    pub snapshot: Value,
    pub global_cursor: String,
    pub node_catalog: RuntimeNodeCatalogStatusPayloadV01,
    pub issue: RuntimeIssueV01,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
pub enum RuntimeRealtimeFrameTypeV01 {
    #[serde(rename = "session.hello")]
    SessionHello,
    #[serde(rename = "session.attached")]
    SessionAttached,
    #[serde(rename = "session.syncRequired")]
    SessionSyncRequired,
    #[serde(rename = "graph.command")]
    GraphCommand,
    #[serde(rename = "node.input")]
    NodeInput,
    #[serde(rename = "command.ack")]
    CommandAck,
    #[serde(rename = "graph.applied")]
    GraphApplied,
    #[serde(rename = "control.emitted")]
    ControlEmitted,
    #[serde(rename = "selection.update")]
    SelectionUpdate,
    #[serde(rename = "selection.updated")]
    SelectionUpdated,
    #[serde(rename = "runtime.issue")]
    RuntimeIssue,
    #[serde(rename = "nodeCatalog.request")]
    NodeCatalogRequest,
    #[serde(rename = "nodeCatalog.snapshot")]
    NodeCatalogSnapshot,
    #[serde(rename = "nodeCatalog.unchanged")]
    NodeCatalogUnchanged,
    #[serde(rename = "nodeCatalog.changed")]
    NodeCatalogChanged,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeRealtimeEnvelopeV01 {
    pub schema: String,
    pub schema_version: String,
    #[serde(rename = "type")]
    pub message_type: RuntimeRealtimeFrameTypeV01,
    pub message_id: String,
    pub session_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub connection_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub client_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub window_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub command_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub correlation_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub idempotency_key: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sequence: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cursor: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub created_at: Option<String>,
    pub payload: Value,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
pub enum GraphCommandKindV01 {
    #[serde(rename = "view.patch")]
    ViewPatch,
    #[serde(rename = "graph.changeSet")]
    GraphChangeSet,
    #[serde(rename = "graph.pasteFragment")]
    GraphPasteFragment,
    #[serde(rename = "history.undo")]
    HistoryUndo,
    #[serde(rename = "history.redo")]
    HistoryRedo,
    #[serde(rename = "node.resolve")]
    NodeResolve,
    #[serde(rename = "node.create")]
    NodeCreate,
    #[serde(rename = "node.replace")]
    NodeReplace,
    #[serde(rename = "node.delete")]
    NodeDelete,
    #[serde(rename = "node.update")]
    NodeUpdate,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum RuntimeGraphCommandScopeV01 {
    Client,
    Global,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
pub enum RuntimeGraphCommandUnresolvedPolicyV01 {
    #[serde(rename = "reject")]
    Reject,
    #[serde(rename = "materialize-issue")]
    MaterializeIssue,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeGraphCommandPayloadV01 {
    pub kind: GraphCommandKindV01,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub base_session_revision: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub base_graph_revision: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub base_view_revision: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub target: Option<GraphTargetRef>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub surface_path: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub view_patch: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub changes: Option<Vec<Value>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub object_spec: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub node_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub requested_node_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub view: Option<CanvasNodeViewV01>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub params: Option<serde_json::Map<String, Value>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub request: Option<PasteGraphFragmentRequest>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scope: Option<RuntimeGraphCommandScopeV01>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub unresolved_policy: Option<RuntimeGraphCommandUnresolvedPolicyV01>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub interface_incident_edge_policy: Option<InterfaceIncidentEdgePolicyV01>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeNodeInputV01 {
    pub node_id: String,
    pub port_id: String,
    pub message: MessageValueV01,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeNodeInputPayloadV01 {
    pub inputs: Vec<RuntimeNodeInputV01>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum RuntimeCommandAckStatusV01 {
    Accepted,
    Conflict,
    Rejected,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeCommandAckPayloadV01 {
    pub status: RuntimeCommandAckStatusV01,
    pub accepted: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub applied: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub conflict: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cached: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub kind: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub command_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub correlation_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub idempotency_key: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub event_cursor: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub graph_sequence: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub target: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub surface_path: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub base_session_revision: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub base_graph_revision: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub base_view_revision: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub session_revision: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub graph_revision: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub view_revision: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub history_summary: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub node: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub operation: Option<Value>,
    pub issues: Vec<RuntimeIssueV01>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeGraphAppliedPayloadV01 {
    pub kind: GraphCommandKindV01,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub command_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub correlation_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub idempotency_key: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub graph_sequence: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub target: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub surface_path: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub node: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub operation: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub session_revision: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub graph_revision: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub view_revision: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub history_entry_id: Option<String>,
    pub issues: Vec<RuntimeIssueV01>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub replayed: Option<bool>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeControlEmittedEventV01 {
    pub node_id: String,
    pub port_id: String,
    pub message: MessageValueV01,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeControlEmittedPayloadV01 {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub command_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub correlation_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub idempotency_key: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub control_sequence: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub control_revision: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub changed: Option<bool>,
    pub events: Vec<RuntimeControlEmittedEventV01>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub values: Option<Value>,
    pub issues: Vec<RuntimeIssueV01>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub replayed: Option<bool>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeSelectionUpdatePayloadV01 {
    pub target: Value,
    pub selection: Value,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cursor: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ttl_ms: Option<u64>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeSelectionUpdatedPayloadV01 {
    pub target: Value,
    pub selection: Value,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cursor: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ttl_ms: Option<u64>,
    pub participant_id: String,
    pub updated_at: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub replayed: Option<bool>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeIssuePayloadV01 {
    pub issue: RuntimeIssueV01,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeNodeCatalogRequestPayloadV01 {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub known_revision: Option<Value>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
pub enum RuntimeNodeCatalogSnapshotStatusV01 {
    #[serde(rename = "included")]
    Included,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeNodeCatalogSnapshotPayloadV01 {
    pub status: RuntimeNodeCatalogSnapshotStatusV01,
    pub catalog_revision: Value,
    pub snapshot: NodeCatalogSnapshotV01,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
pub enum RuntimeNodeCatalogUnchangedStatusV01 {
    #[serde(rename = "unchanged")]
    Unchanged,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeNodeCatalogUnchangedPayloadV01 {
    pub status: RuntimeNodeCatalogUnchangedStatusV01,
    pub catalog_revision: Value,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeNodeCatalogChangedPayloadV01 {
    pub catalog_revision: Value,
    pub snapshot: NodeCatalogSnapshotV01,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub replayed: Option<bool>,
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

fn is_core_implementation(node: &GraphNodeV01, object_id: &str) -> bool {
    matches!(
        &node.implementation,
        Some(ObjectImplementationRefV01 {
            provider: ObjectProviderRefV01::Core,
            object_id: node_object_id,
            ..
        }) if node_object_id == object_id
    )
}

pub fn derive_patch_contract_v01(patch: &PatchDefinitionV01) -> PatchContractV01 {
    let mut ports = Vec::new();
    for node in &patch.graph.nodes {
        if is_core_implementation(node, "inlet") {
            ports.extend(derive_boundary_ports(
                node,
                PortDirectionV01::Output,
                PortDirectionV01::Input,
            ));
        } else if is_core_implementation(node, "outlet") {
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

fn canonical_json_v01(value: &Value) -> String {
    match value {
        Value::Null => "null".to_owned(),
        Value::Bool(value) => value.to_string(),
        Value::Number(value) => value.to_string(),
        Value::String(value) => serde_json::to_string(value).expect("string should serialize"),
        Value::Array(values) => {
            let entries = values
                .iter()
                .map(canonical_json_v01)
                .collect::<Vec<_>>()
                .join(",");
            format!("[{entries}]")
        }
        Value::Object(map) => {
            let mut keys = map.keys().collect::<Vec<_>>();
            keys.sort_by(|left, right| left.chars().cmp(right.chars()));
            let entries = keys
                .into_iter()
                .map(|key| {
                    format!(
                        "{}:{}",
                        serde_json::to_string(key).expect("key should serialize"),
                        canonical_json_v01(&map[key])
                    )
                })
                .collect::<Vec<_>>()
                .join(",");
            format!("{{{entries}}}")
        }
    }
}

fn sha256_canonical_digest_v01(value: &Value) -> PackageChecksumV01 {
    let canonical_json = canonical_json_v01(value);
    let mut hasher = Sha256::new();
    hasher.update(canonical_json.as_bytes());
    let digest = hasher.finalize();
    PackageChecksumV01 {
        algorithm: PackageChecksumAlgorithmV01::Sha256,
        value: digest
            .iter()
            .map(|byte| format!("{byte:02x}"))
            .collect::<String>(),
    }
}

pub fn compute_patch_interface_digest_v01(patch: &PatchDefinitionV01) -> PackageChecksumV01 {
    let contract = derive_patch_contract_v01(patch);
    sha256_canonical_digest_v01(&serde_json::json!({
        "id": &patch.id,
        "ports": &contract.ports,
    }))
}

fn node_catalog_revision_preimage_v01(snapshot: &NodeCatalogSnapshotV01) -> Value {
    let mut value = serde_json::to_value(snapshot).expect("node catalog snapshot should serialize");
    let snapshot_object = value
        .as_object_mut()
        .expect("node catalog snapshot should serialize as object");
    snapshot_object.remove("catalogRevision");
    snapshot_object.remove("issues");
    let entries = snapshot_object
        .get_mut("entries")
        .and_then(Value::as_array_mut)
        .expect("node catalog entries should serialize as array");
    for entry in entries {
        let entry_object = entry
            .as_object_mut()
            .expect("node catalog entry should serialize as object");
        entry_object.remove("issues");
    }
    value
}

pub fn compute_node_catalog_revision_v01(snapshot: &NodeCatalogSnapshotV01) -> PackageChecksumV01 {
    sha256_canonical_digest_v01(&node_catalog_revision_preimage_v01(snapshot))
}

pub fn sanitize_project_patch_id_v01(patch_id: &str) -> String {
    let sanitized = patch_id
        .chars()
        .map(|character| {
            if character.is_ascii_alphanumeric() || character == '.' || character == '-' {
                character
            } else {
                '-'
            }
        })
        .collect::<String>();

    if sanitized.is_empty() {
        "patch".to_owned()
    } else {
        sanitized
    }
}

pub fn project_patch_node_definition_id_v01(
    patch_id: &str,
    interface_digest: &PackageChecksumV01,
) -> String {
    format!(
        "object.project.patch.{}.{}",
        sanitize_project_patch_id_v01(patch_id),
        interface_digest.value
    )
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
pub struct GraphValidationIssueV01 {
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
    pub issues: Vec<GraphValidationIssueV01>,
    pub cycles: Vec<GraphCycleValidationV01>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum ExecutionModelV01 {
    Event,
    Control,
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
