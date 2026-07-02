use std::{
    collections::{BTreeSet, HashMap, HashSet},
    error::Error,
    fmt,
};

use super::types::{
    CycleValidationV01, DataFlowV01, DataTypeV01, EdgeSpecV01, EndpointBindingValueFormatV01,
    ExtensionKindV01, ExtensionManifestV01, FeedbackBoundaryV01, GraphCycleValidationV01,
    GraphDocumentV01, GraphFragmentIssueV01, GraphFragmentOutsideEndpointPolicyV01,
    GraphFragmentV01, GraphFragmentValidationResultV01, GraphTargetRef, GraphValidationIssueV01,
    GraphValidationResultV01, MergePolicyV01, NodeCatalogDisplayPaletteV01, NodeCatalogDisplayV01,
    NodeCatalogEntryV01, NodeCatalogIssueSeverityV01, NodeCatalogIssueTargetV01,
    NodeCatalogIssueV01, NodeCatalogSnapshotV01, NodeDefinitionManifestV01, ObjectProviderRefV01,
    PackageCategoryV01, PackageChecksumV01, PackageDiscoveryResponseV01,
    PackageInstallPlanActionKindV01, PackageInstallPlanCheckStatusV01, PackageInstallPlanIntentV01,
    PackageInstallPlanRequestV01, PackageInstallPlanResponseV01, PackageInstallPlanTargetArchV01,
    PackageInstallPlanTargetOsV01, PackageInstallPlanTargetV01, PackageIssueSeverityV01,
    PackageListingArtifactKindV01, PackageListingObjectExportSummaryV01,
    PackageListingTargetSupportKindV01, PackageListingV01, PackageManifestV01,
    PackageObjectExportV01, PackageRootDocumentV01, PackageTargetTripleV01,
    PasteGraphFragmentRequest, PatchDefinitionV01, PatchPath, PortDirectionV01, PortSpecV01,
    ProjectDocumentV01, ProjectObjectBindingIssueCodeV01, ProjectObjectBindingStatusV01,
    RuntimeCommandAckPayloadV01, RuntimeControlEmittedPayloadV01, RuntimeGraphAppliedPayloadV01,
    RuntimeGraphCommandPayloadV01, RuntimeIssuePayloadV01, RuntimeNodeInputPayloadV01,
    RuntimeRealtimeEnvelopeV01, RuntimeRealtimeFrameTypeV01, RuntimeSelectionUpdatePayloadV01,
    RuntimeSelectionUpdatedPayloadV01, RuntimeSessionLoadModeV01, RuntimeSessionLoadRequestV01,
    SKENION_PACKAGE_MANIFEST_FILE_NAME, ValueFormatV01, ValueOccurrenceHeaderV01,
    ValuePayloadKindV01, ViewStateV01, compute_node_catalog_revision_v01,
    derive_patch_contract_v01, project_patch_node_definition_id_v01,
};
use super::version::{
    derive_current_v0_version_range, is_v0_semver_version, satisfies_current_v0_version_range,
};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct PortConnectionPolicyV01 {
    pub accepted: bool,
    pub reason: &'static str,
    pub effective_type: Option<String>,
}

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

fn is_blank(value: &str) -> bool {
    value.trim().is_empty()
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
    derive_current_v0_version_range(lower_bound).as_deref() == Some(range)
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
    value.len() == 64
        && value
            .bytes()
            .all(|byte| byte.is_ascii_digit() || (b'a'..=b'f').contains(&byte))
}

fn validate_shape_v01(errors: &mut Vec<ValidationErrorV01>, label: &str, shape: Option<&[u64]>) {
    let Some(shape) = shape else {
        return;
    };
    if shape.is_empty() {
        errors.push(ValidationErrorV01::new(format!(
            "{label} must be a non-empty array of positive integers"
        )));
        return;
    }
    for (index, dimension) in shape.iter().enumerate() {
        if *dimension == 0 {
            errors.push(ValidationErrorV01::new(format!(
                "{label}[{index}] must be a positive integer"
            )));
        }
    }
}

fn is_value_type_id_v01(value: &str) -> bool {
    if is_first_party_value_type(value) {
        return true;
    }
    is_valid_custom_value_type_id_v01(value)
}

pub fn is_reserved_value_type_id_v01(value: &str) -> bool {
    value.starts_with("value.core.") || value.starts_with("value.media.")
}

pub fn is_valid_custom_value_type_id_v01(value: &str) -> bool {
    if is_reserved_value_type_id_v01(value) {
        return false;
    }
    let mut parts = value.split('.');
    if parts.next() != Some("value") {
        return false;
    }
    let Some(namespace) = parts.next() else {
        return false;
    };
    is_lower_digit_hyphen_segment(namespace)
        && parts.clone().next().is_some()
        && parts.all(is_lower_digit_hyphen_segment)
}

fn expected_formats_for_first_party_value_type(
    value_type_id: &str,
) -> Option<&'static [&'static str]> {
    match value_type_id {
        "value.core.float8" => Some(&["f8.e4m3", "f8.e5m2"]),
        "value.core.float16" => Some(&["f16"]),
        "value.core.float32" => Some(&["f32"]),
        "value.core.float64" => Some(&["f64"]),
        "value.core.ufloat8" => Some(&["ufloat8"]),
        "value.core.ufloat16" => Some(&["ufloat16"]),
        "value.core.ufloat32" => Some(&["ufloat32"]),
        "value.core.ufloat64" => Some(&["ufloat64"]),
        "value.core.int8" => Some(&["i8"]),
        "value.core.int16" => Some(&["i16"]),
        "value.core.int32" => Some(&["i32"]),
        "value.core.int64" => Some(&["i64"]),
        "value.core.uint8" => Some(&["u8"]),
        "value.core.uint16" => Some(&["u16"]),
        "value.core.uint32" => Some(&["u32"]),
        "value.core.uint64" => Some(&["u64"]),
        "value.core.color" => Some(&["rgba32f", "rgba16f", "rgba8unorm", "rgb8unorm"]),
        "value.core.vector" | "value.core.matrix" | "value.core.tensor" => Some(&[
            "f64",
            "f32",
            "f16",
            "f8.e4m3",
            "f8.e5m2",
            "ufloat64",
            "ufloat32",
            "ufloat16",
            "ufloat8",
            "i64",
            "i32",
            "i16",
            "i8",
            "u64",
            "u32",
            "u16",
            "u8",
            "rgba32f",
            "rgba16f",
            "rgba8unorm",
            "rgb8unorm",
        ]),
        _ => None,
    }
}

fn value_format_errors_v01(value_format: &ValueFormatV01, label: &str) -> Vec<ValidationErrorV01> {
    let mut errors = Vec::new();
    let value_type_id = value_format.value_type_id.as_str();

    if value_type_id.is_empty() {
        errors.push(ValidationErrorV01::new(format!(
            "{label}.valueTypeId must be a non-empty string"
        )));
    } else if !is_value_type_id_v01(value_type_id) {
        errors.push(ValidationErrorV01::new(format!(
            "{label}.valueTypeId is not a valid value type id: {value_type_id}"
        )));
    }

    if let Some(format) = value_format.format.as_deref()
        && let Some(expected_formats) = expected_formats_for_first_party_value_type(value_type_id)
        && !expected_formats.contains(&format)
    {
        errors.push(ValidationErrorV01::new(format!(
            "{label}.format {format} is not valid for {value_type_id}"
        )));
    }

    validate_shape_v01(
        &mut errors,
        &format!("{label}.shape"),
        value_format.shape.as_deref(),
    );
    validate_shape_v01(
        &mut errors,
        &format!("{label}.strides"),
        value_format.strides.as_deref(),
    );

    if matches!(
        value_type_id,
        "value.core.vector" | "value.core.matrix" | "value.core.tensor"
    ) {
        if value_format.shape.is_none() {
            errors.push(ValidationErrorV01::new(format!(
                "{label}.shape is required for {value_type_id}"
            )));
        }
        if value_format.format.is_none() {
            errors.push(ValidationErrorV01::new(format!(
                "{label}.format is required for {value_type_id}"
            )));
        }
    }

    if value_format.byte_length == Some(0) {
        errors.push(ValidationErrorV01::new(format!(
            "{label}.byteLength must be a positive integer"
        )));
    }
    if value_format.channels == Some(0) {
        errors.push(ValidationErrorV01::new(format!(
            "{label}.channels must be a positive integer"
        )));
    }
    if value_format
        .sample_rate
        .is_some_and(|sample_rate| !sample_rate.is_finite() || sample_rate <= 0.0)
    {
        errors.push(ValidationErrorV01::new(format!(
            "{label}.sampleRate must be greater than zero"
        )));
    }

    if value_type_id == "value.core.bang" {
        if value_format.format.is_some() {
            errors.push(ValidationErrorV01::new(format!(
                "{label}.format is not allowed for value.core.bang"
            )));
        }
        if value_format.shape.is_some() {
            errors.push(ValidationErrorV01::new(format!(
                "{label}.shape is not allowed for value.core.bang"
            )));
        }
        if value_format.byte_length.is_some() {
            errors.push(ValidationErrorV01::new(format!(
                "{label}.byteLength is not allowed for value.core.bang"
            )));
        }
        if value_format.resource_kind.is_some() {
            errors.push(ValidationErrorV01::new(format!(
                "{label}.resourceKind is not allowed for value.core.bang"
            )));
        }
    }

    errors
}

pub fn validate_value_format_v01(
    value_format: &ValueFormatV01,
) -> Result<&ValueFormatV01, ValidationReportV01> {
    let errors = value_format_errors_v01(value_format, "valueFormat");
    if errors.is_empty() {
        Ok(value_format)
    } else {
        Err(ValidationReportV01::new(errors))
    }
}

pub fn validate_endpoint_binding_value_format_v01(
    binding_format: &EndpointBindingValueFormatV01,
) -> Result<&EndpointBindingValueFormatV01, ValidationReportV01> {
    let mut errors = Vec::new();

    if binding_format.binding_id.is_empty() {
        errors.push(ValidationErrorV01::new(
            "bindingFormat.bindingId must be a non-empty string",
        ));
    }
    if binding_format.binding_epoch == 0 {
        errors.push(ValidationErrorV01::new(
            "bindingFormat.bindingEpoch must be a positive integer",
        ));
    }
    if binding_format.format_revision == 0 {
        errors.push(ValidationErrorV01::new(
            "bindingFormat.formatRevision must be a positive integer",
        ));
    }
    if binding_format
        .format_digest
        .as_deref()
        .is_some_and(|digest| !is_sha256_hex_v01(digest))
    {
        errors.push(ValidationErrorV01::new(
            "bindingFormat.formatDigest must be a 64-character sha256 hex string",
        ));
    }
    errors.extend(value_format_errors_v01(
        &binding_format.value_format,
        "bindingFormat.valueFormat",
    ));
    if binding_format
        .source
        .as_ref()
        .is_some_and(|source| source.node_id.is_empty() || source.port_id.is_empty())
    {
        errors.push(ValidationErrorV01::new(
            "bindingFormat.source must contain non-empty nodeId and portId",
        ));
    }
    if binding_format
        .target
        .as_ref()
        .is_some_and(|target| target.node_id.is_empty() || target.port_id.is_empty())
    {
        errors.push(ValidationErrorV01::new(
            "bindingFormat.target must contain non-empty nodeId and portId",
        ));
    }
    if binding_format.delivery.as_ref().is_some_and(|delivery| {
        delivery
            .policy
            .as_deref()
            .is_some_and(|policy| !matches!(policy, "ordered" | "latest" | "ring" | "drop"))
            || delivery.max_in_flight == Some(0)
    }) {
        errors.push(ValidationErrorV01::new(
            "bindingFormat.delivery contains an invalid policy or maxInFlight",
        ));
    }

    if errors.is_empty() {
        Ok(binding_format)
    } else {
        Err(ValidationReportV01::new(errors))
    }
}

pub fn validate_value_occurrence_header_v01(
    header: &ValueOccurrenceHeaderV01,
) -> Result<&ValueOccurrenceHeaderV01, ValidationReportV01> {
    let mut errors = Vec::new();

    if header.binding_id.is_empty() {
        errors.push(ValidationErrorV01::new(
            "occurrenceHeader.bindingId must be a non-empty string",
        ));
    }
    if header.binding_epoch == 0 {
        errors.push(ValidationErrorV01::new(
            "occurrenceHeader.bindingEpoch must be a positive integer",
        ));
    }
    if header.format_revision == 0 {
        errors.push(ValidationErrorV01::new(
            "occurrenceHeader.formatRevision must be a positive integer",
        ));
    }
    if header
        .timestamp
        .is_some_and(|timestamp| !timestamp.is_finite())
    {
        errors.push(ValidationErrorV01::new(
            "occurrenceHeader.timestamp must be a finite number",
        ));
    }
    if header.byte_length == Some(0) {
        errors.push(ValidationErrorV01::new(
            "occurrenceHeader.byteLength must be a positive integer",
        ));
    }
    validate_shape_v01(
        &mut errors,
        "occurrenceHeader.actualShape",
        header.actual_shape.as_deref(),
    );
    if header
        .duration
        .is_some_and(|duration| !duration.is_finite() || duration < 0.0)
    {
        errors.push(ValidationErrorV01::new(
            "occurrenceHeader.duration must be greater than or equal to zero",
        ));
    }
    if header.payload_kind == ValuePayloadKindV01::Empty {
        if header.byte_length.is_some() {
            errors.push(ValidationErrorV01::new(
                "occurrenceHeader.byteLength is not allowed when payloadKind is empty",
            ));
        }
        if header.byte_offset.is_some() {
            errors.push(ValidationErrorV01::new(
                "occurrenceHeader.byteOffset is not allowed when payloadKind is empty",
            ));
        }
        if header.actual_shape.is_some() {
            errors.push(ValidationErrorV01::new(
                "occurrenceHeader.actualShape is not allowed when payloadKind is empty",
            ));
        }
    }

    if errors.is_empty() {
        Ok(header)
    } else {
        Err(ValidationReportV01::new(errors))
    }
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

fn is_message_value_data_kind(data_kind: &str) -> bool {
    matches!(
        data_kind,
        "value.core.bang"
            | "value.core.bool"
            | "value.core.uint8"
            | "value.core.uint16"
            | "value.core.uint32"
            | "value.core.uint64"
            | "value.core.int8"
            | "value.core.int16"
            | "value.core.int32"
            | "value.core.int64"
            | "value.core.float8"
            | "value.core.float16"
            | "value.core.float32"
            | "value.core.float64"
            | "value.core.ufloat8"
            | "value.core.ufloat16"
            | "value.core.ufloat32"
            | "value.core.ufloat64"
            | "value.core.string"
            | "value.core.message"
            | "value.core.color"
    )
}

fn is_message_value_compatible(source_type: &DataTypeV01, target_type: &DataTypeV01) -> bool {
    if target_type.flow == DataFlowV01::Event {
        return source_type.flow == DataFlowV01::Event;
    }

    if target_type.flow == DataFlowV01::Control {
        return (source_type.flow == DataFlowV01::Control
            && is_message_value_data_kind(&source_type.data_kind))
            || (source_type.flow == DataFlowV01::Event
                && source_type.data_kind == "value.core.bang");
    }

    false
}

pub fn compatible_data_types_v01(source_type: &DataTypeV01, target_type: &DataTypeV01) -> bool {
    source_type == target_type
        || (source_type.data_kind == "value.core.message"
            && is_message_value_compatible(source_type, target_type))
        || (target_type.data_kind == "value.core.message"
            && is_message_value_compatible(source_type, target_type))
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

fn issue(
    issues: &mut Vec<GraphValidationIssueV01>,
    severity: &str,
    code: &str,
    message: impl Into<String>,
    nodes: Option<Vec<String>>,
    edges: Option<Vec<String>>,
) {
    issues.push(GraphValidationIssueV01 {
        severity: severity.to_owned(),
        code: code.to_owned(),
        message: message.into(),
        nodes,
        edges,
    });
}

fn fragment_issue(
    issues: &mut Vec<GraphFragmentIssueV01>,
    severity: &str,
    code: &str,
    message: impl Into<String>,
    nodes: Option<Vec<String>>,
    edges: Option<Vec<String>>,
) {
    issues.push(GraphFragmentIssueV01 {
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
    port_type_accepts_v01(source, target)
}

fn port_type_policy_v01(source: &PortSpecV01, target: &PortSpecV01) -> PortConnectionPolicyV01 {
    if source.port_type == target.port_type {
        return PortConnectionPolicyV01 {
            accepted: true,
            reason: "type-match",
            effective_type: Some(source.port_type.clone()),
        };
    }
    if target.port_type == "value.core.message" && is_message_value_port_type_v01(&source.port_type)
    {
        return PortConnectionPolicyV01 {
            accepted: true,
            reason: "message-selector",
            effective_type: Some(source.port_type.clone()),
        };
    }
    if target
        .accepts
        .as_ref()
        .is_some_and(|accepted| accepted.contains(&source.port_type))
    {
        return PortConnectionPolicyV01 {
            accepted: true,
            reason: "target-accepts",
            effective_type: Some(source.port_type.clone()),
        };
    }
    PortConnectionPolicyV01 {
        accepted: false,
        reason: "incompatible-type",
        effective_type: None,
    }
}

pub fn port_type_accepts_v01(source: &PortSpecV01, target: &PortSpecV01) -> bool {
    port_type_policy_v01(source, target).accepted
}

pub fn port_connection_policy_v01(
    source: &PortSpecV01,
    target: &PortSpecV01,
) -> PortConnectionPolicyV01 {
    if source.direction != PortDirectionV01::Output || target.direction != PortDirectionV01::Input {
        return PortConnectionPolicyV01 {
            accepted: false,
            reason: "direction-mismatch",
            effective_type: None,
        };
    }
    port_type_policy_v01(source, target)
}

pub fn is_message_value_port_type_v01(port_type: &str) -> bool {
    is_message_value_data_kind(port_type)
}

fn is_first_party_value_type(port_type: &str) -> bool {
    matches!(
        port_type,
        "value.core.bang"
            | "value.core.bool"
            | "value.core.uint8"
            | "value.core.uint16"
            | "value.core.uint32"
            | "value.core.uint64"
            | "value.core.int8"
            | "value.core.int16"
            | "value.core.int32"
            | "value.core.int64"
            | "value.core.float8"
            | "value.core.float16"
            | "value.core.float32"
            | "value.core.float64"
            | "value.core.ufloat8"
            | "value.core.ufloat16"
            | "value.core.ufloat32"
            | "value.core.ufloat64"
            | "value.core.string"
            | "value.core.message"
            | "value.core.color"
            | "value.core.vector"
            | "value.core.matrix"
            | "value.core.tensor"
    )
}

fn is_invalid_value_type(port_type: &str) -> bool {
    if matches!(
        port_type,
        "message.any"
            | "number.float"
            | "number.int"
            | "number.uint"
            | "boolean"
            | "color"
            | "string"
            | "control.number"
            | "control.message"
            | "control.message.any"
            | "event.bang"
            | "asset.video"
            | "asset.image"
            | "asset.audio"
            | "gpu.texture2d"
            | "video.frame"
            | "render.frame"
            | "stream.video.frame"
            | "signal.audio"
            | "value.core.float"
            | "value.core.int"
            | "value.core.uint"
            | "value.core.number"
            | "value.object.core"
            | "value.core.frame"
            | "value.core.symbol"
            | "value.media.asset"
            | "value.media.stream"
            | "value.media.video-stream"
            | "value.media.audio-stream"
            | "value.media.audio-sample"
            | "value.media.audio-frame"
            | "value.media.audio-buffer"
            | "value.media.image"
            | "value.media.matrix"
            | "value.media.render-frame"
            | "value.media.video-frame"
    ) {
        return true;
    }
    if port_type.starts_with("control.")
        || port_type.starts_with("event.")
        || port_type.starts_with("stream.")
        || port_type.starts_with("payload.")
        || port_type.starts_with("data.")
        || port_type.starts_with("selector.")
        || port_type.starts_with("value<")
    {
        return true;
    }
    if port_type.starts_with("value.core.") && !is_first_party_value_type(port_type) {
        return true;
    }
    if port_type.starts_with("value.media.") {
        return true;
    }
    if port_type.starts_with("value.")
        && !is_first_party_value_type(port_type)
        && !is_valid_custom_value_type_id_v01(port_type)
    {
        return true;
    }
    false
}

fn is_payload_identity_node_kind(kind: &str) -> bool {
    matches!(
        kind,
        "value"
            | "data"
            | "payload"
            | "bool"
            | "string"
            | "object.core.bool"
            | "object.core.string"
            | "value.core.message"
            | "value.core.bang"
            | "value.core.string"
            | "value.core.tensor"
    ) || kind.starts_with("value.")
        || kind.starts_with("data.")
        || kind.starts_with("payload.")
        || kind.starts_with("control.")
}

fn has_implementation_error_issue(issues: &[super::types::ObjectResolutionIssueV01]) -> bool {
    issues.iter().any(|issue| {
        matches!(
            issue.code,
            ProjectObjectBindingIssueCodeV01::ImplementationMissing
                | ProjectObjectBindingIssueCodeV01::ImplementationStale
                | ProjectObjectBindingIssueCodeV01::ImplementationLockMismatch
                | ProjectObjectBindingIssueCodeV01::InterfaceDrift
        )
    })
}

struct PackageObjectExportView<'a> {
    object_id: &'a str,
    primary_object_spec: &'a str,
    aliases: &'a [String],
    definition_path: &'a str,
    help_id: Option<&'a str>,
}

fn package_object_export_errors<'a>(
    objects: impl IntoIterator<Item = PackageObjectExportView<'a>>,
    package_id: &str,
    label: &str,
) -> Vec<ValidationErrorV01> {
    let mut errors = Vec::new();
    let mut provider_object_ids = HashSet::new();
    let mut spec_to_object_id: HashMap<&str, &str> = HashMap::new();

    for object in objects {
        let provider_object_id = format!("{package_id}/{}", object.object_id);
        if !provider_object_ids.insert(provider_object_id.clone()) {
            errors.push(ValidationErrorV01::new(format!(
                "duplicate {label} provider/objectId: {provider_object_id}"
            )));
        }

        if !is_provided_id_v01(object.object_id) {
            errors.push(ValidationErrorV01::new(format!(
                "{label} objectId must use lowercase dotted/hyphen grammar without underscores: {}",
                object.object_id
            )));
        }
        if is_payload_identity_node_kind(object.object_id) {
            errors.push(ValidationErrorV01::new(format!(
                "{label} object {} uses payload/value identity as an executable object",
                object.object_id
            )));
        }
        if is_blank(object.primary_object_spec) {
            errors.push(ValidationErrorV01::new(format!(
                "{label} object {} primaryObjectSpec must not be blank",
                object.object_id
            )));
        }
        if !is_relative_path_v01(object.definition_path) {
            errors.push(ValidationErrorV01::new(format!(
                "{label} object {} definitionPath must be relative and stay inside the package: {}",
                object.object_id, object.definition_path
            )));
        }
        if let Some(help_id) = object.help_id
            && !is_provided_id_v01(help_id)
        {
            errors.push(ValidationErrorV01::new(format!(
                "{label} object {} helpId must use lowercase dotted/hyphen grammar without underscores: {help_id}",
                object.object_id
            )));
        }

        for spec in std::iter::once(object.primary_object_spec)
            .chain(object.aliases.iter().map(String::as_str))
        {
            if is_blank(spec) {
                errors.push(ValidationErrorV01::new(format!(
                    "{label} object {} alias/spec must not be blank",
                    object.object_id
                )));
                continue;
            }
            if let Some(previous_object_id) = spec_to_object_id.get(spec) {
                errors.push(ValidationErrorV01::new(format!(
                    "{label} duplicate object spec {spec:?} for {previous_object_id} and {}",
                    object.object_id
                )));
            } else {
                spec_to_object_id.insert(spec, object.object_id);
            }
        }
    }

    errors
}

fn is_key_aware_input_port(port: &PortSpecV01) -> bool {
    port.direction == PortDirectionV01::Input
        && (port.port_type == "value.core.message"
            || port
                .accepts
                .as_ref()
                .is_some_and(|accepted| accepted.iter().any(|value| value == "value.core.message")))
}

fn message_key_policy_errors(port: &PortSpecV01, label: &str) -> Vec<String> {
    let Some(policy) = &port.message_keys else {
        return if is_key_aware_input_port(port) {
            vec![format!(
                "{label} message-key-aware input port requires messageKeys"
            )]
        } else {
            Vec::new()
        };
    };

    let mut errors = Vec::new();
    if policy.accepted.is_empty() {
        errors.push(format!(
            "{label} messageKeys.accepted must list at least one key"
        ));
    }

    for (field, keys) in [
        ("silent", &policy.silent),
        ("trigger", &policy.trigger),
        ("store", &policy.store),
        ("emit", &policy.emit),
    ] {
        for key in keys.iter().flat_map(|values| values.iter()) {
            if !policy.accepted.contains(key) {
                errors.push(format!(
                    "{label} messageKeys.{field} key {key} is not accepted"
                ));
            }
        }
    }
    if policy
        .trigger
        .as_ref()
        .is_some_and(|keys| keys.iter().any(|key| key == "set"))
    {
        errors.push(format!("{label} messageKeys.trigger must not include set"));
    }
    if policy
        .emit
        .as_ref()
        .is_some_and(|keys| keys.iter().any(|key| key == "set"))
    {
        errors.push(format!("{label} messageKeys.emit must not include set"));
    }
    if policy.accepted.iter().any(|key| key == "set")
        && !policy
            .silent
            .as_ref()
            .is_some_and(|keys| keys.iter().any(|key| key == "set"))
        && !policy
            .store
            .as_ref()
            .is_some_and(|keys| keys.iter().any(|key| key == "set"))
    {
        errors.push(format!(
            "{label} messageKeys.set must be silent or store behavior"
        ));
    }

    errors
}

pub fn analyze_graph_fragment_v01(
    fragment: &GraphFragmentV01,
    outside_endpoint_policy: GraphFragmentOutsideEndpointPolicyV01,
) -> GraphFragmentValidationResultV01 {
    let mut issues = Vec::new();
    let mut omitted_edge_ids = Vec::new();
    let mut node_ids = HashSet::new();
    let mut edge_ids = HashSet::new();
    let mut ports = HashMap::new();

    for node in &fragment.nodes {
        if !node_ids.insert(node.id.clone()) {
            fragment_issue(
                &mut issues,
                "error",
                "duplicate-node-id",
                format!("duplicate node id: {}", node.id),
                Some(vec![node.id.clone()]),
                None,
            );
        }
        if let Some(object_id) = node
            .implementation
            .as_ref()
            .map(|implementation| &implementation.object_id)
            && is_payload_identity_node_kind(object_id)
        {
            fragment_issue(
                &mut issues,
                "error",
                "payload-implementation-id",
                format!(
                    "node {} uses payload identity {} as an executable implementation",
                    node.id, object_id
                ),
                Some(vec![node.id.clone()]),
                None,
            );
        }
        if let Some(resolution) = &node.object_resolution {
            match resolution.status {
                super::types::ObjectResolutionStatusV01::Resolved => {
                    if node.implementation.is_none() {
                        fragment_issue(
                            &mut issues,
                            "error",
                            "resolved-object-missing-implementation",
                            format!(
                                "node {} has resolved objectResolution without implementation",
                                node.id
                            ),
                            Some(vec![node.id.clone()]),
                            None,
                        );
                    }
                }
                super::types::ObjectResolutionStatusV01::Unresolved => {
                    if node.implementation.is_some() {
                        fragment_issue(
                            &mut issues,
                            "error",
                            "unresolved-object-has-implementation",
                            format!(
                                "node {} has unresolved objectResolution with implementation",
                                node.id
                            ),
                            Some(vec![node.id.clone()]),
                            None,
                        );
                    }
                }
                super::types::ObjectResolutionStatusV01::Error => {
                    if node.implementation.is_none() {
                        fragment_issue(
                            &mut issues,
                            "error",
                            "error-object-missing-implementation",
                            format!(
                                "node {} has error objectResolution without implementation",
                                node.id
                            ),
                            Some(vec![node.id.clone()]),
                            None,
                        );
                    }
                    if !has_implementation_error_issue(&resolution.issues) {
                        fragment_issue(
                            &mut issues,
                            "error",
                            "error-object-missing-issue",
                            format!(
                                "node {} has error objectResolution without implementation issue",
                                node.id
                            ),
                            Some(vec![node.id.clone()]),
                            None,
                        );
                    }
                }
            }
        }
        let mut port_ids = HashSet::new();
        for port in &node.ports {
            if !port_ids.insert(port.id.clone()) {
                fragment_issue(
                    &mut issues,
                    "error",
                    "duplicate-port-id",
                    format!("duplicate port id on {}: {}", node.id, port.id),
                    Some(vec![node.id.clone()]),
                    None,
                );
            }
            if is_invalid_value_type(&port.port_type) {
                fragment_issue(
                    &mut issues,
                    "error",
                    "invalid-value-type",
                    format!(
                        "port {}.{} uses invalid value type {}",
                        node.id, port.id, port.port_type
                    ),
                    Some(vec![node.id.clone()]),
                    None,
                );
            }
            if let Some(accepted) = &port.accepts {
                for accepted_type in accepted {
                    if is_invalid_value_type(accepted_type) {
                        fragment_issue(
                            &mut issues,
                            "error",
                            "invalid-value-type",
                            format!(
                                "port {}.{} accepts invalid value type {}",
                                node.id, port.id, accepted_type
                            ),
                            Some(vec![node.id.clone()]),
                            None,
                        );
                    }
                }
            }
            for error in message_key_policy_errors(port, &format!("port {}.{}", node.id, port.id)) {
                fragment_issue(
                    &mut issues,
                    "error",
                    "message-key-policy",
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
            fragment_issue(
                &mut issues,
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
            .is_some_and(|port_type| is_invalid_value_type(port_type))
        {
            fragment_issue(
                &mut issues,
                "error",
                "invalid-value-type",
                format!(
                    "edge {} uses invalid resolvedType {}",
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
            fragment_issue(
                &mut issues,
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
            fragment_issue(
                &mut issues,
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
            fragment_issue(
                &mut issues,
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
            fragment_issue(
                &mut issues,
                "error",
                "invalid-source-direction",
                format!("edge {} source {source_key} is not an output port", edge.id),
                None,
                Some(vec![edge.id.clone()]),
            );
        }
        if target.direction != PortDirectionV01::Input {
            fragment_issue(
                &mut issues,
                "error",
                "invalid-target-direction",
                format!("edge {} target {target_key} is not an input port", edge.id),
                None,
                Some(vec![edge.id.clone()]),
            );
        }
        if !accepts(source, target) {
            fragment_issue(
                &mut issues,
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
        ok: issues.iter().all(|issue| issue.severity != "error"),
        issues,
        omitted_edge_ids,
    }
}

fn is_immediate_value_cycle_port_type(port_type: &str) -> bool {
    port_type.starts_with("value.core.")
}

fn immediate_value_cycle_types(
    edges: &[EdgeSpecV01],
    ports: &HashMap<String, PortSpecV01>,
) -> bool {
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
        is_immediate_value_cycle_port_type(source_type)
            && is_immediate_value_cycle_port_type(target_type)
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

    let classification = if immediate_value_cycle_types(&edges, ports) {
        CycleValidationV01::AmbiguousAlgebraicLoop
    } else {
        CycleValidationV01::InvalidCycle
    };
    let message = match classification {
        CycleValidationV01::AmbiguousAlgebraicLoop => {
            "immediate value cycle requires explicit latch, delay, or feedback policy"
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
    let mut issues = Vec::new();
    let mut cycles = Vec::new();
    let mut node_ids = HashSet::new();
    let mut ports: HashMap<String, PortSpecV01> = HashMap::new();
    let mut incoming: HashMap<String, Vec<EdgeSpecV01>> = HashMap::new();
    let mut outgoing: HashMap<String, Vec<EdgeSpecV01>> = HashMap::new();
    let mut edge_ids = HashSet::new();
    let mut edge_keys = HashSet::new();

    for node in &graph.nodes {
        if !node_ids.insert(node.id.clone()) {
            issue(
                &mut issues,
                "error",
                "duplicate-node-id",
                format!("duplicate node id: {}", node.id),
                Some(vec![node.id.clone()]),
                None,
            );
        }
        if let Some(object_id) = node
            .implementation
            .as_ref()
            .map(|implementation| &implementation.object_id)
            && is_payload_identity_node_kind(object_id)
        {
            issue(
                &mut issues,
                "error",
                "payload-implementation-id",
                format!(
                    "node {} uses payload identity {} as an executable implementation",
                    node.id, object_id
                ),
                Some(vec![node.id.clone()]),
                None,
            );
        }
        if let Some(resolution) = &node.object_resolution {
            match resolution.status {
                super::types::ObjectResolutionStatusV01::Resolved => {
                    if node.implementation.is_none() {
                        issue(
                            &mut issues,
                            "error",
                            "resolved-object-missing-implementation",
                            format!(
                                "node {} has resolved objectResolution without implementation",
                                node.id
                            ),
                            Some(vec![node.id.clone()]),
                            None,
                        );
                    }
                }
                super::types::ObjectResolutionStatusV01::Unresolved => {
                    if node.implementation.is_some() {
                        issue(
                            &mut issues,
                            "error",
                            "unresolved-object-has-implementation",
                            format!(
                                "node {} has unresolved objectResolution with implementation",
                                node.id
                            ),
                            Some(vec![node.id.clone()]),
                            None,
                        );
                    }
                }
                super::types::ObjectResolutionStatusV01::Error => {
                    if node.implementation.is_none() {
                        issue(
                            &mut issues,
                            "error",
                            "error-object-missing-implementation",
                            format!(
                                "node {} has error objectResolution without implementation",
                                node.id
                            ),
                            Some(vec![node.id.clone()]),
                            None,
                        );
                    }
                    if !has_implementation_error_issue(&resolution.issues) {
                        issue(
                            &mut issues,
                            "error",
                            "error-object-missing-issue",
                            format!(
                                "node {} has error objectResolution without implementation issue",
                                node.id
                            ),
                            Some(vec![node.id.clone()]),
                            None,
                        );
                    }
                }
            }
        }

        let mut port_ids = HashSet::new();
        for port in &node.ports {
            if !port_ids.insert(port.id.clone()) {
                issue(
                    &mut issues,
                    "error",
                    "duplicate-port-id",
                    format!("duplicate port id on {}: {}", node.id, port.id),
                    Some(vec![node.id.clone()]),
                    None,
                );
            }
            if is_invalid_value_type(&port.port_type) {
                issue(
                    &mut issues,
                    "error",
                    "invalid-value-type",
                    format!(
                        "port {}.{} uses invalid value type {}",
                        node.id, port.id, port.port_type
                    ),
                    Some(vec![node.id.clone()]),
                    None,
                );
            }
            if let Some(accepted) = &port.accepts {
                for accepted_type in accepted {
                    if is_invalid_value_type(accepted_type) {
                        issue(
                            &mut issues,
                            "error",
                            "invalid-value-type",
                            format!(
                                "port {}.{} accepts invalid value type {}",
                                node.id, port.id, accepted_type
                            ),
                            Some(vec![node.id.clone()]),
                            None,
                        );
                    }
                }
            }
            for error in message_key_policy_errors(port, &format!("port {}.{}", node.id, port.id)) {
                issue(
                    &mut issues,
                    "error",
                    "message-key-policy",
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
            if is_invalid_value_type(&group.port_type) {
                issue(
                    &mut issues,
                    "error",
                    "invalid-value-type",
                    format!(
                        "port group {}.{} uses invalid value type {}",
                        node.id, group.id, group.port_type
                    ),
                    Some(vec![node.id.clone()]),
                    None,
                );
            }
            if group
                .default_port_spec
                .as_ref()
                .is_some_and(|port| is_invalid_value_type(&port.port_type))
            {
                issue(
                    &mut issues,
                    "error",
                    "invalid-value-type",
                    format!(
                        "port group {}.{} default port uses invalid value type {}",
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
                        if is_invalid_value_type(accepted_type) {
                            issue(
                                &mut issues,
                                "error",
                                "invalid-value-type",
                                format!(
                                    "port group {}.{} default port accepts invalid value type {}",
                                    node.id, group.id, accepted_type
                                ),
                                Some(vec![node.id.clone()]),
                                None,
                            );
                        }
                    }
                }
                for error in message_key_policy_errors(
                    default_port,
                    &format!("port group {}.{} defaultPortSpec", node.id, group.id),
                ) {
                    issue(
                        &mut issues,
                        "error",
                        "message-key-policy",
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
                issue(
                    &mut issues,
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
            issue(
                &mut issues,
                "error",
                "duplicate-edge-id",
                format!("duplicate edge id: {}", edge.id),
                None,
                Some(vec![edge.id.clone()]),
            );
        }
        let edge_key = edge_endpoint_key(edge);
        if !edge_keys.insert(edge_key.clone()) {
            issue(
                &mut issues,
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
            .is_some_and(|port_type| is_invalid_value_type(port_type))
        {
            issue(
                &mut issues,
                "error",
                "invalid-value-type",
                format!(
                    "edge {} uses invalid resolvedType {}",
                    edge.id,
                    edge.resolved_type.as_deref().unwrap_or_default()
                ),
                None,
                Some(vec![edge.id.clone()]),
            );
        }

        if source.is_none() {
            issue(
                &mut issues,
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
            issue(
                &mut issues,
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
            issue(
                &mut issues,
                "error",
                "invalid-source-direction",
                format!("edge {} source {source_key} is not an output port", edge.id),
                None,
                Some(vec![edge.id.clone()]),
            );
        }
        if target.direction != PortDirectionV01::Input {
            issue(
                &mut issues,
                "error",
                "invalid-target-direction",
                format!("edge {} target {target_key} is not an input port", edge.id),
                None,
                Some(vec![edge.id.clone()]),
            );
        }
        if !accepts(source, target) {
            issue(
                &mut issues,
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
            issue(
                &mut issues,
                "error",
                "missing-required-input",
                format!("input {key} requires at least {minimum} connection(s)"),
                None,
                None,
            );
        }
        let max_connections = input_max_connections(port);
        if connected_edges.len() as u64 > max_connections {
            issue(
                &mut issues,
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
            issue(
                &mut issues,
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
            issue(
                &mut issues,
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
                issue(
                    &mut issues,
                    "error",
                    code,
                    cycle.message.clone(),
                    Some(cycle.nodes.clone()),
                    Some(cycle.edges.clone()),
                );
            }
            CycleValidationV01::RiskyFeedback => issue(
                &mut issues,
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
        ok: issues.iter().all(|issue| issue.severity != "error"),
        issues,
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
    for issue in result
        .issues
        .iter()
        .filter(|issue| issue.severity == "error")
    {
        errors.push(ValidationErrorV01::new(format!(
            "{}: {}",
            issue.code, issue.message
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
    for issue in result
        .issues
        .iter()
        .filter(|issue| issue.severity == "error")
    {
        errors.push(ValidationErrorV01::new(format!(
            "{}: {}",
            issue.code, issue.message
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
    let mut errors = Vec::new();
    validate_graph_target_ref_v01(&mut errors, &request.target, "target");
    if !errors.is_empty() {
        return Err(ValidationReportV01::new(errors));
    }

    let outside_endpoint_policy = request
        .options
        .as_ref()
        .and_then(|options| options.outside_endpoint_policy)
        .unwrap_or_default();
    validate_graph_fragment_with_policy(&request.fragment, outside_endpoint_policy)
}

fn push_non_empty_string_error(errors: &mut Vec<ValidationErrorV01>, label: &str, value: &str) {
    if value.is_empty() {
        errors.push(ValidationErrorV01::new(format!(
            "{label} must be a non-empty string"
        )));
    }
}

fn push_optional_non_empty_string_error(
    errors: &mut Vec<ValidationErrorV01>,
    label: &str,
    value: Option<&str>,
) {
    if value.is_some_and(str::is_empty) {
        errors.push(ValidationErrorV01::new(format!(
            "{label} must be a non-empty string when present"
        )));
    }
}

fn validate_graph_target_ref_v01(
    errors: &mut Vec<ValidationErrorV01>,
    target: &GraphTargetRef,
    label: &str,
) {
    match &target.path {
        PatchPath::Root => {}
        PatchPath::ProjectPatchDefinition { patch_id } => {
            push_non_empty_string_error(errors, &format!("{label}.path.patchId"), patch_id);
        }
        PatchPath::PackagePatchDefinition {
            package_id,
            patch_id,
            version,
        } => {
            push_non_empty_string_error(errors, &format!("{label}.path.packageId"), package_id);
            push_non_empty_string_error(errors, &format!("{label}.path.patchId"), patch_id);
            push_optional_non_empty_string_error(
                errors,
                &format!("{label}.path.version"),
                version.as_deref(),
            );
        }
        PatchPath::EmbeddedPatchInstance {
            owner_path,
            node_id,
        } => {
            for (index, entry) in owner_path.iter().enumerate() {
                push_non_empty_string_error(
                    errors,
                    &format!("{label}.path.ownerPath[{index}]"),
                    entry,
                );
            }
            push_non_empty_string_error(errors, &format!("{label}.path.nodeId"), node_id);
        }
        PatchPath::HelpWorkingCopy {
            working_copy_id,
            source_package_id,
            source_patch_id,
        } => {
            push_non_empty_string_error(
                errors,
                &format!("{label}.path.workingCopyId"),
                working_copy_id,
            );
            push_optional_non_empty_string_error(
                errors,
                &format!("{label}.path.sourcePackageId"),
                source_package_id.as_deref(),
            );
            push_optional_non_empty_string_error(
                errors,
                &format!("{label}.path.sourcePatchId"),
                source_patch_id.as_deref(),
            );
        }
    }
    push_non_empty_string_error(
        errors,
        &format!("{label}.baseRevision"),
        &target.base_revision,
    );
    push_optional_non_empty_string_error(
        errors,
        &format!("{label}.targetRevision"),
        target.target_revision.as_deref(),
    );
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
    if is_payload_identity_node_kind(&definition.id) {
        errors.push(ValidationErrorV01::new(format!(
            "payload identity node definition id: {}",
            definition.id
        )));
    }

    for port in &definition.ports {
        if is_invalid_value_type(&port.port_type) {
            errors.push(ValidationErrorV01::new(format!(
                "invalid value type on {}.{}: {}",
                definition.id, port.id, port.port_type
            )));
        }
        if let Some(accepted) = &port.accepts {
            for accepted_type in accepted {
                if is_invalid_value_type(accepted_type) {
                    errors.push(ValidationErrorV01::new(format!(
                        "invalid accepted value type on {}.{}: {}",
                        definition.id, port.id, accepted_type
                    )));
                }
            }
        }
        for error in message_key_policy_errors(port, &format!("port {}.{}", definition.id, port.id))
        {
            errors.push(ValidationErrorV01::new(error));
        }
    }

    for group in definition.port_groups.as_deref().unwrap_or_default() {
        if is_invalid_value_type(&group.port_type) {
            errors.push(ValidationErrorV01::new(format!(
                "invalid port group type on {}.{}: {}",
                definition.id, group.id, group.port_type
            )));
        }
        if let Some(default_port) = &group.default_port_spec {
            if is_invalid_value_type(&default_port.port_type) {
                errors.push(ValidationErrorV01::new(format!(
                    "invalid default value type on {}.{}: {}",
                    definition.id, group.id, default_port.port_type
                )));
            }
            if let Some(accepted) = &default_port.accepts {
                for accepted_type in accepted {
                    if is_invalid_value_type(accepted_type) {
                        errors.push(ValidationErrorV01::new(format!(
                            "invalid default accepted value type on {}.{}: {}",
                            definition.id, group.id, accepted_type
                        )));
                    }
                }
            }
            for error in message_key_policy_errors(
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

fn sorted_string_errors(values: &[String], label: &str) -> Vec<ValidationErrorV01> {
    let mut sorted = values.to_vec();
    sorted.sort_by(|left, right| left.chars().cmp(right.chars()));
    if values == sorted.as_slice() {
        Vec::new()
    } else {
        vec![ValidationErrorV01::new(format!(
            "{label} must be sorted by Unicode code point"
        ))]
    }
}

fn validate_node_catalog_issue_target_v01(
    errors: &mut Vec<ValidationErrorV01>,
    target: &NodeCatalogIssueTargetV01,
    entry_ids: &HashSet<&str>,
    label: &str,
) {
    match target {
        NodeCatalogIssueTargetV01::Catalog => {}
        NodeCatalogIssueTargetV01::Entry { catalog_id } => {
            if !entry_ids.contains(catalog_id.as_str()) {
                errors.push(ValidationErrorV01::new(format!(
                    "{label} references missing entry catalogId: {catalog_id}"
                )));
            }
        }
    }
}

fn validate_node_catalog_issue_v01(
    errors: &mut Vec<ValidationErrorV01>,
    issue: &NodeCatalogIssueV01,
    entry_ids: &HashSet<&str>,
    label: &str,
) {
    push_non_empty_string_error(errors, &format!("{label}.code"), &issue.code);
    push_non_empty_string_error(errors, &format!("{label}.message"), &issue.message);
    validate_node_catalog_issue_target_v01(
        errors,
        &issue.target,
        entry_ids,
        &format!("{label}.target"),
    );
    if issue.severity == NodeCatalogIssueSeverityV01::Error {
        errors.push(ValidationErrorV01::new(format!(
            "{label} must not use error severity in a valid catalog snapshot"
        )));
    }
}

fn validate_node_catalog_display_schema_v01(
    errors: &mut Vec<ValidationErrorV01>,
    display: &NodeCatalogDisplayV01,
    label: &str,
) {
    push_non_empty_string_error(errors, &format!("{label}.display.title"), &display.title);
    if let Some(palette) = display.palette {
        match palette {
            NodeCatalogDisplayPaletteV01::Direct | NodeCatalogDisplayPaletteV01::Text => {}
        }
    }
}

fn validate_node_catalog_display_v01(
    errors: &mut Vec<ValidationErrorV01>,
    primary_object_spec: &str,
    aliases: Option<&[String]>,
    label: &str,
    object_spec_owners: &mut HashMap<String, String>,
    primary_object_specs: &mut HashSet<String>,
) {
    push_non_empty_string_error(
        errors,
        &format!("{label}.primaryObjectSpec"),
        primary_object_spec,
    );
    if !primary_object_specs.insert(primary_object_spec.to_owned()) {
        errors.push(ValidationErrorV01::new(format!(
            "duplicate primaryObjectSpec: {primary_object_spec}"
        )));
    }

    if let Some(owner) = object_spec_owners.get(primary_object_spec) {
        errors.push(ValidationErrorV01::new(format!(
            "{label} primaryObjectSpec collides with {owner}: {primary_object_spec}"
        )));
    } else {
        object_spec_owners.insert(
            primary_object_spec.to_owned(),
            format!("{label} primaryObjectSpec"),
        );
    }

    let Some(aliases) = aliases else {
        return;
    };

    errors.extend(sorted_string_errors(aliases, &format!("{label} aliases")));
    errors.extend(duplicate_errors(
        aliases.iter().map(|alias| alias.as_str()).collect(),
        &format!("{label} alias"),
    ));
    for alias in aliases {
        push_non_empty_string_error(errors, &format!("{label}.alias"), alias);
        if let Some(owner) = object_spec_owners.get(alias) {
            errors.push(ValidationErrorV01::new(format!(
                "{label} alias collides with {owner}: {alias}"
            )));
        } else {
            object_spec_owners.insert(alias.to_owned(), format!("{label} alias"));
        }
    }
}

fn object_provider_key(provider: &ObjectProviderRefV01) -> String {
    match provider {
        ObjectProviderRefV01::Core => "core".to_owned(),
        ObjectProviderRefV01::ProjectPatch { patch_id, .. } => format!("projectPatch:{patch_id}"),
        ObjectProviderRefV01::Package {
            package_id,
            lock_entry_id,
            ..
        } => format!(
            "package:{package_id}:{}",
            lock_entry_id.as_deref().unwrap_or_default()
        ),
    }
}

fn validate_project_patch_catalog_provider_v01(
    errors: &mut Vec<ValidationErrorV01>,
    entry: &NodeCatalogEntryV01,
    patch_id: &str,
    interface_digest: &PackageChecksumV01,
) {
    validate_package_checksum_v01(errors, "provider.interfaceDigest", interface_digest);
    let expected_definition_id = project_patch_node_definition_id_v01(patch_id, interface_digest);
    if entry.definition.id == expected_definition_id {
        return;
    }

    errors.push(ValidationErrorV01::new(format!(
        "projectPatch catalog entry {} definition.id must be {}",
        entry.catalog_id, expected_definition_id
    )));
}

pub fn validate_node_catalog_snapshot_v01(
    snapshot: &NodeCatalogSnapshotV01,
) -> Result<(), ValidationReportV01> {
    let mut errors = Vec::new();

    if snapshot.schema != "skenion.node-catalog.snapshot" {
        errors.push(ValidationErrorV01::new(format!(
            "expected schema skenion.node-catalog.snapshot, found {}",
            snapshot.schema
        )));
    }
    if snapshot.schema_version != "0.1.0" {
        errors.push(ValidationErrorV01::new(format!(
            "expected schemaVersion 0.1.0, found {}",
            snapshot.schema_version
        )));
    }
    validate_package_checksum_v01(&mut errors, "catalogRevision", &snapshot.catalog_revision);

    errors.extend(duplicate_errors(
        snapshot
            .entries
            .iter()
            .map(|entry| entry.catalog_id.as_str())
            .collect(),
        "catalogId",
    ));
    errors.extend(sorted_string_errors(
        &snapshot
            .entries
            .iter()
            .map(|entry| entry.catalog_id.clone())
            .collect::<Vec<_>>(),
        "catalog entries",
    ));

    let entry_ids = snapshot
        .entries
        .iter()
        .map(|entry| entry.catalog_id.as_str())
        .collect::<HashSet<_>>();

    let mut definition_keys = HashSet::new();
    for (label, definition) in snapshot.entries.iter().map(|entry| {
        (
            format!("catalog entry {}", entry.catalog_id),
            &entry.definition,
        )
    }) {
        let key = format!("{}@{}", definition.id, definition.version);
        if !definition_keys.insert(key.clone()) {
            errors.push(ValidationErrorV01::new(format!(
                "duplicate node definition id/version: {key}"
            )));
        }
        if let Err(report) = validate_node_definition_v01(definition) {
            for error in report.errors() {
                errors.push(ValidationErrorV01::new(format!(
                    "{label} definition: {}",
                    error.message
                )));
            }
        }
    }

    let mut object_spec_owners = HashMap::new();
    let mut primary_object_specs = HashSet::new();
    let mut implementation_ids = HashSet::new();

    for entry in &snapshot.entries {
        push_non_empty_string_error(
            &mut errors,
            &format!("catalog entry {} catalogId", entry.catalog_id),
            &entry.catalog_id,
        );
        push_non_empty_string_error(
            &mut errors,
            &format!("catalog entry {} objectId", entry.catalog_id),
            &entry.object_id,
        );
        let implementation_id = format!(
            "{}:{}",
            object_provider_key(&entry.provider),
            entry.object_id
        );
        if !implementation_ids.insert(implementation_id.clone()) {
            errors.push(ValidationErrorV01::new(format!(
                "duplicate catalog implementation: {implementation_id}"
            )));
        }
        validate_node_catalog_display_v01(
            &mut errors,
            &entry.primary_object_spec,
            entry.aliases.as_deref(),
            &format!("catalog entry {}", entry.catalog_id),
            &mut object_spec_owners,
            &mut primary_object_specs,
        );
        validate_node_catalog_display_schema_v01(
            &mut errors,
            &entry.display,
            &format!("catalog entry {}", entry.catalog_id),
        );

        if !entry.creatable {
            errors.push(ValidationErrorV01::new(format!(
                "catalog entry {} creatable must be true",
                entry.catalog_id
            )));
        }

        match &entry.provider {
            ObjectProviderRefV01::Core => {}
            ObjectProviderRefV01::ProjectPatch {
                patch_id,
                revision,
                interface_digest,
                ..
            } => {
                push_non_empty_string_error(&mut errors, "provider.patchId", patch_id);
                push_optional_non_empty_string_error(
                    &mut errors,
                    "provider.revision",
                    revision.as_deref(),
                );
                if let Some(interface_digest) = interface_digest {
                    validate_project_patch_catalog_provider_v01(
                        &mut errors,
                        entry,
                        patch_id,
                        interface_digest,
                    );
                }
            }
            ObjectProviderRefV01::Package { .. } => {}
        }

        for issue in entry.issues.as_deref().unwrap_or_default() {
            validate_node_catalog_issue_v01(
                &mut errors,
                issue,
                &entry_ids,
                &format!("catalog entry {} issue", entry.catalog_id),
            );
        }
    }

    for (index, issue) in snapshot
        .issues
        .as_deref()
        .unwrap_or_default()
        .iter()
        .enumerate()
    {
        validate_node_catalog_issue_v01(
            &mut errors,
            issue,
            &entry_ids,
            &format!("catalog issue {index}"),
        );
    }

    let expected_revision = compute_node_catalog_revision_v01(snapshot);
    if snapshot.catalog_revision != expected_revision {
        errors.push(ValidationErrorV01::new(format!(
            "catalogRevision mismatch: expected {}",
            expected_revision.value
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

    for issue in analyze_graph_document_v01(graph).issues {
        if issue.severity != "error" {
            continue;
        }
        errors.push(ValidationErrorV01::new(format!(
            "{label} {}: {}",
            issue.code, issue.message
        )));
    }

    errors
}

fn is_uuid_format_v01(value: &str) -> bool {
    let bytes = value.as_bytes();
    if bytes.len() != 36 {
        return false;
    }

    for (index, byte) in bytes.iter().enumerate() {
        match index {
            8 | 13 | 18 | 23 => {
                if *byte != b'-' {
                    return false;
                }
            }
            _ => {
                if !byte.is_ascii_hexdigit() {
                    return false;
                }
            }
        }
    }

    true
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
    if !is_uuid_format_v01(&project.document_id) {
        errors.push(ValidationErrorV01::new(format!(
            "project documentId must be a UUID: {}",
            project.document_id
        )));
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

pub fn validate_runtime_session_load_request_v01(
    request: &RuntimeSessionLoadRequestV01,
) -> Result<(), ValidationReportV01> {
    let mut errors = Vec::new();

    if request.schema != "skenion.runtime.session-load-request" {
        errors.push(ValidationErrorV01::new(format!(
            "expected schema skenion.runtime.session-load-request, found {}",
            request.schema
        )));
    }
    if request.schema_version != "0.1.0" {
        errors.push(ValidationErrorV01::new(format!(
            "expected schemaVersion 0.1.0, found {}",
            request.schema_version
        )));
    }

    if let Err(report) = validate_project_document_v01(&request.project) {
        errors.extend(
            report
                .errors()
                .iter()
                .map(|error| ValidationErrorV01::new(format!("project {}", error.message))),
        );
    }

    if matches!(request.mode, RuntimeSessionLoadModeV01::ReplaceIfMatch)
        && request.precondition.is_none()
    {
        errors.push(ValidationErrorV01::new(
            "runtime session load replaceIfMatch requires precondition",
        ));
    }
    if let Some(precondition) = &request.precondition {
        if precondition.document_id.is_none()
            && precondition.session_revision.is_none()
            && precondition.graph_revision.is_none()
        {
            errors.push(ValidationErrorV01::new(
                "runtime session load precondition must not be empty",
            ));
        }
        if let Some(document_id) = &precondition.document_id
            && !is_uuid_format_v01(document_id)
        {
            errors.push(ValidationErrorV01::new(format!(
                "runtime session load precondition documentId must be a UUID: {document_id}"
            )));
        }
        if precondition
            .session_revision
            .as_ref()
            .is_some_and(|revision| revision.is_empty())
        {
            errors.push(ValidationErrorV01::new(
                "runtime session load precondition sessionRevision must not be empty",
            ));
        }
        if precondition
            .graph_revision
            .as_ref()
            .is_some_and(|revision| revision.is_empty())
        {
            errors.push(ValidationErrorV01::new(
                "runtime session load precondition graphRevision must not be empty",
            ));
        }
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(ValidationReportV01::new(errors))
    }
}

fn validate_payload<T>(payload: &serde_json::Value, label: &str) -> Vec<ValidationErrorV01>
where
    T: serde::de::DeserializeOwned,
{
    serde_json::from_value::<T>(payload.clone())
        .map(|_| Vec::new())
        .unwrap_or_else(|error| {
            vec![ValidationErrorV01::new(format!(
                "{label} payload invalid: {error}"
            ))]
        })
}

fn validate_runtime_node_input_payload_errors(
    payload: &RuntimeNodeInputPayloadV01,
) -> Vec<ValidationErrorV01> {
    let mut errors = Vec::new();
    if payload.inputs.is_empty() {
        errors.push(ValidationErrorV01::new(
            "node.input payload inputs must not be empty",
        ));
    }
    for (index, input) in payload.inputs.iter().enumerate() {
        if is_blank(&input.node_id) {
            errors.push(ValidationErrorV01::new(format!(
                "node.input payload inputs[{index}].nodeId must not be blank"
            )));
        }
        if is_blank(&input.port_id) {
            errors.push(ValidationErrorV01::new(format!(
                "node.input payload inputs[{index}].portId must not be blank"
            )));
        }
        if is_blank(&input.message.key) {
            errors.push(ValidationErrorV01::new(format!(
                "node.input payload inputs[{index}].message.key must not be blank"
            )));
        }
    }
    errors
}

pub fn validate_runtime_graph_command_payload_v01(
    payload: &RuntimeGraphCommandPayloadV01,
) -> Result<(), ValidationReportV01> {
    let mut errors = Vec::new();
    if let Some(object_spec) = &payload.object_spec
        && is_blank(object_spec)
    {
        errors.push(ValidationErrorV01::new(
            "graph.command payload objectSpec must not be blank",
        ));
    }
    if let Some(node_id) = &payload.node_id
        && is_blank(node_id)
    {
        errors.push(ValidationErrorV01::new(
            "graph.command payload nodeId must not be blank",
        ));
    }
    if let Some(requested_node_id) = &payload.requested_node_id
        && is_blank(requested_node_id)
    {
        errors.push(ValidationErrorV01::new(
            "graph.command payload requestedNodeId must not be blank",
        ));
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(ValidationReportV01::new(errors))
    }
}

pub fn validate_runtime_node_input_payload_v01(
    payload: &RuntimeNodeInputPayloadV01,
) -> Result<(), ValidationReportV01> {
    let errors = validate_runtime_node_input_payload_errors(payload);
    if errors.is_empty() {
        Ok(())
    } else {
        Err(ValidationReportV01::new(errors))
    }
}

pub fn validate_runtime_realtime_envelope_v01(
    envelope: &RuntimeRealtimeEnvelopeV01,
) -> Result<(), ValidationReportV01> {
    let mut errors = Vec::new();

    if envelope.schema != "skenion.runtime.realtime" {
        errors.push(ValidationErrorV01::new(format!(
            "expected schema skenion.runtime.realtime, found {}",
            envelope.schema
        )));
    }
    if envelope.schema_version != "0.1.0" {
        errors.push(ValidationErrorV01::new(format!(
            "expected schemaVersion 0.1.0, found {}",
            envelope.schema_version
        )));
    }
    if is_blank(&envelope.message_id) {
        errors.push(ValidationErrorV01::new(
            "runtime realtime messageId must not be blank",
        ));
    }
    if is_blank(&envelope.session_id) {
        errors.push(ValidationErrorV01::new(
            "runtime realtime sessionId must not be blank",
        ));
    }
    match envelope.message_type {
        RuntimeRealtimeFrameTypeV01::GraphCommand => {
            errors.extend(validate_payload::<RuntimeGraphCommandPayloadV01>(
                &envelope.payload,
                "graph.command",
            ));
            if let Ok(payload) =
                serde_json::from_value::<RuntimeGraphCommandPayloadV01>(envelope.payload.clone())
                && let Err(report) = validate_runtime_graph_command_payload_v01(&payload)
            {
                errors.extend(report.errors().iter().cloned());
            }
        }
        RuntimeRealtimeFrameTypeV01::NodeInput => {
            if envelope
                .command_id
                .as_ref()
                .is_none_or(|value| is_blank(value))
            {
                errors.push(ValidationErrorV01::new(
                    "node.input frame requires commandId",
                ));
            }
            if envelope
                .idempotency_key
                .as_ref()
                .is_none_or(|value| is_blank(value))
            {
                errors.push(ValidationErrorV01::new(
                    "node.input frame requires idempotencyKey",
                ));
            }
            errors.extend(validate_payload::<RuntimeNodeInputPayloadV01>(
                &envelope.payload,
                "node.input",
            ));
            if let Ok(payload) =
                serde_json::from_value::<RuntimeNodeInputPayloadV01>(envelope.payload.clone())
            {
                errors.extend(validate_runtime_node_input_payload_errors(&payload));
            }
        }
        RuntimeRealtimeFrameTypeV01::CommandAck => {
            errors.extend(validate_payload::<RuntimeCommandAckPayloadV01>(
                &envelope.payload,
                "command.ack",
            ))
        }
        RuntimeRealtimeFrameTypeV01::GraphApplied => {
            errors.extend(validate_payload::<RuntimeGraphAppliedPayloadV01>(
                &envelope.payload,
                "graph.applied",
            ))
        }
        RuntimeRealtimeFrameTypeV01::ControlEmitted => {
            errors.extend(validate_payload::<RuntimeControlEmittedPayloadV01>(
                &envelope.payload,
                "control.emitted",
            ))
        }
        RuntimeRealtimeFrameTypeV01::SelectionUpdate => {
            if envelope
                .command_id
                .as_ref()
                .is_none_or(|value| is_blank(value))
            {
                errors.push(ValidationErrorV01::new(
                    "selection.update frame requires commandId",
                ));
            }
            if envelope
                .idempotency_key
                .as_ref()
                .is_none_or(|value| is_blank(value))
            {
                errors.push(ValidationErrorV01::new(
                    "selection.update frame requires idempotencyKey",
                ));
            }
            errors.extend(validate_payload::<RuntimeSelectionUpdatePayloadV01>(
                &envelope.payload,
                "selection.update",
            ));
        }
        RuntimeRealtimeFrameTypeV01::SelectionUpdated => {
            errors.extend(validate_payload::<RuntimeSelectionUpdatedPayloadV01>(
                &envelope.payload,
                "selection.updated",
            ))
        }
        RuntimeRealtimeFrameTypeV01::RuntimeIssue => {
            errors.extend(validate_payload::<RuntimeIssuePayloadV01>(
                &envelope.payload,
                "runtime.issue",
            ))
        }
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
    if !is_v0_semver_version(&manifest.contracts.version) {
        errors.push(ValidationErrorV01::new(
            "package manifest contracts.version must be an exact v0 SemVer version",
        ));
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
    errors.extend(package_object_export_errors(
        manifest
            .provides
            .objects
            .iter()
            .map(|object: &PackageObjectExportV01| PackageObjectExportView {
                object_id: object.object_id.as_str(),
                primary_object_spec: object.primary_object_spec.as_str(),
                aliases: &object.aliases,
                definition_path: object.definition_path.as_str(),
                help_id: object.help_id.as_deref(),
            }),
        &manifest.id,
        "provided object",
    ));
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

    if !is_v0_semver_version(&listing.contracts.version) {
        errors.push(ValidationErrorV01::new(
            "package listing contracts.version must be an exact v0 SemVer version",
        ));
    }
    if let Some(runtime_abi_range) = &listing.runtime_abi_range
        && !is_current_v0_compatibility_range(runtime_abi_range)
    {
        errors.push(ValidationErrorV01::new(
            "package listing runtimeAbiRange must be a current v0 semver range",
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
    errors.extend(package_object_export_errors(
        listing
            .provides
            .objects
            .iter()
            .map(
                |object: &PackageListingObjectExportSummaryV01| PackageObjectExportView {
                    object_id: object.object_id.as_str(),
                    primary_object_spec: object.primary_object_spec.as_str(),
                    aliases: &object.aliases,
                    definition_path: object.definition_path.as_str(),
                    help_id: object.help_id.as_deref(),
                },
            ),
        &listing.package_id,
        "provided object",
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
    if !is_v0_semver_version(&target.contracts.version) {
        errors.push(ValidationErrorV01::new(
            "package install plan target contracts.version must be an exact v0 SemVer version",
        ));
    }
    if let Some(runtime_abi_range) = &target.runtime_abi_range
        && !is_current_v0_compatibility_range(runtime_abi_range)
    {
        errors.push(ValidationErrorV01::new(
            "package install plan target runtimeAbiRange must be a current v0 semver range",
        ));
    }

    errors
}

fn package_install_plan_lock_entry_errors(
    lock_entry: &super::ProjectPackageLockEntryV01,
) -> Vec<ValidationErrorV01> {
    let mut errors = Vec::new();

    if !is_v0_semver_version(&lock_entry.contracts_version) {
        errors.push(ValidationErrorV01::new(format!(
            "package install plan lock {} contractsVersion must be an exact v0 SemVer version",
            lock_entry.id
        )));
    }

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
            "package install plan desired versionRange must be a current v0 semver range",
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
        let Some(ObjectProviderRefV01::Package { lock_entry_id, .. }) = binding
            .implementation
            .as_ref()
            .map(|implementation| &implementation.provider)
        else {
            continue;
        };
        match lock_entry_id {
            Some(lock_entry_id) if !package_lock_ids.contains(lock_entry_id.as_str()) => {
                errors.push(ValidationErrorV01::new(format!(
                    "package install plan object binding {} references missing lockEntryId: {}",
                    binding.id, lock_entry_id
                )));
            }
            None => {
                errors.push(ValidationErrorV01::new(format!(
                    "package install plan object binding {} package implementation requires lockEntryId",
                    binding.id
                )));
            }
            _ => {}
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
        if candidate.listing.contracts.version != request.target.contracts.version {
            errors.push(ValidationErrorV01::new(format!(
                "package install plan candidate {} contracts.version {} does not match target {}",
                candidate.listing.package_id,
                candidate.listing.contracts.version,
                request.target.contracts.version
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
            if manifest.contracts.version != candidate.listing.contracts.version {
                errors.push(ValidationErrorV01::new(format!(
                    "package install plan candidate manifest contracts.version {} does not match listing contracts.version {}",
                    manifest.contracts.version, candidate.listing.contracts.version
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
            if action.issue_refs.is_empty() {
                errors.push(ValidationErrorV01::new(format!(
                    "package install plan reject action {} requires issueRefs",
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
            .issues
            .iter()
            .map(|issue| issue.id.as_str())
            .collect(),
        "package install plan issue id",
    ));

    let issue_ids: HashSet<&str> = response
        .issues
        .iter()
        .map(|issue| issue.id.as_str())
        .collect();
    for issue in &response.issues {
        if issue.id.is_empty() {
            errors.push(ValidationErrorV01::new(
                "package install plan issue id must not be empty",
            ));
        }
        if issue.message.is_empty() {
            errors.push(ValidationErrorV01::new(format!(
                "package install plan issue {} message must not be empty",
                issue.id
            )));
        }
    }
    for check in &response.checks {
        if matches!(check.status, PackageInstallPlanCheckStatusV01::Fail)
            && check.issue_refs.is_empty()
        {
            errors.push(ValidationErrorV01::new(format!(
                "package install plan failing check {:?} requires issueRefs",
                check.kind
            )));
        }
        for issue_ref in &check.issue_refs {
            if !issue_ids.contains(issue_ref.as_str()) {
                errors.push(ValidationErrorV01::new(format!(
                    "package install plan check {:?} references missing issue {}",
                    check.kind, issue_ref
                )));
            }
        }
    }
    for (index, action) in response.actions.iter().enumerate() {
        errors.extend(package_install_plan_action_errors(action, index));
        for issue_ref in &action.issue_refs {
            if !issue_ids.contains(issue_ref.as_str()) {
                errors.push(ValidationErrorV01::new(format!(
                    "package install plan action {} references missing issue {}",
                    action.id, issue_ref
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
            if let Some(issue_ref) = &capability_change.issue_ref
                && !issue_ids.contains(issue_ref.as_str())
            {
                errors.push(ValidationErrorV01::new(format!(
                    "package install plan action {} capability change references missing issue {}",
                    action.id, issue_ref
                )));
            }
        }
    }

    let has_reject_action = response
        .actions
        .iter()
        .any(|action| matches!(action.kind, PackageInstallPlanActionKindV01::Reject));
    let has_error_issue = response
        .issues
        .iter()
        .any(|issue| matches!(issue.severity, PackageIssueSeverityV01::Error));
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
        if !has_error_issue {
            errors.push(ValidationErrorV01::new(
                "failed package install plan response requires an error issue",
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
        if !is_v0_semver_version(&lock_entry.contracts_version) {
            errors.push(ValidationErrorV01::new(format!(
                "package lock {} contractsVersion must be an exact v0 SemVer version",
                lock_entry.id
            )));
        }
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
        if !satisfies_current_v0_version_range(&lock_entry.version, &dependency.version_range) {
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
        let has_issue = |codes: &[ProjectObjectBindingIssueCodeV01]| {
            binding
                .issues
                .iter()
                .any(|issue| codes.contains(&issue.code))
        };

        if binding.status == ProjectObjectBindingStatusV01::Resolved
            && binding.implementation.is_none()
        {
            errors.push(ValidationErrorV01::new(format!(
                "resolved object binding {} requires implementation",
                binding.id
            )));
            continue;
        }
        if binding.status == ProjectObjectBindingStatusV01::Unresolved
            && binding.implementation.is_some()
        {
            errors.push(ValidationErrorV01::new(format!(
                "unresolved object binding {} must not include implementation",
                binding.id
            )));
            continue;
        }
        if binding.status == ProjectObjectBindingStatusV01::Error {
            if binding.implementation.is_none() {
                errors.push(ValidationErrorV01::new(format!(
                    "error object binding {} requires implementation",
                    binding.id
                )));
                continue;
            }
            if !has_implementation_error_issue(&binding.issues) {
                errors.push(ValidationErrorV01::new(format!(
                    "error object binding {} requires implementation issue",
                    binding.id
                )));
            }
        }

        match binding
            .implementation
            .as_ref()
            .map(|implementation| &implementation.provider)
        {
            Some(ObjectProviderRefV01::ProjectPatch {
                patch_id, revision, ..
            }) => {
                let Some(patch) = patch_by_id.get(patch_id.as_str()) else {
                    if binding.status == ProjectObjectBindingStatusV01::Resolved {
                        errors.push(ValidationErrorV01::new(format!(
                            "resolved object binding {} references missing project patch: {}",
                            binding.id, patch_id
                        )));
                    } else if binding.status != ProjectObjectBindingStatusV01::Error
                        || !has_issue(&[ProjectObjectBindingIssueCodeV01::ImplementationMissing])
                    {
                        errors.push(ValidationErrorV01::new(format!(
                            "object binding {} references missing project patch: {} without error issue",
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
                    } else if binding.status != ProjectObjectBindingStatusV01::Error
                        || !has_issue(&[
                            ProjectObjectBindingIssueCodeV01::ImplementationStale,
                            ProjectObjectBindingIssueCodeV01::InterfaceDrift,
                        ])
                    {
                        errors.push(ValidationErrorV01::new(format!(
                            "object binding {} project patch {} revision is stale without issues",
                            binding.id, patch_id
                        )));
                    }
                }
            }
            Some(ObjectProviderRefV01::Package {
                lock_entry_id,
                package_id,
                ..
            }) => {
                if !is_package_id_v01(package_id) {
                    errors.push(ValidationErrorV01::new(format!(
                        "object binding {} packageId must match publisher/package lowercase digit hyphen grammar: {}",
                        binding.id, package_id
                    )));
                }
                let Some(lock_entry_id) = lock_entry_id else {
                    errors.push(ValidationErrorV01::new(format!(
                        "object binding {} package implementation requires lockEntryId",
                        binding.id
                    )));
                    continue;
                };
                let Some(lock_entry) = package_lock_by_id.get(lock_entry_id.as_str()) else {
                    if binding.status == ProjectObjectBindingStatusV01::Resolved {
                        errors.push(ValidationErrorV01::new(format!(
                            "resolved object binding {} references missing lockEntryId: {}",
                            binding.id, lock_entry_id
                        )));
                    } else if binding.status != ProjectObjectBindingStatusV01::Error
                        || !has_issue(&[ProjectObjectBindingIssueCodeV01::ImplementationMissing])
                    {
                        errors.push(ValidationErrorV01::new(format!(
                            "object binding {} references missing lockEntryId: {} without error issue",
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
            Some(ObjectProviderRefV01::Core) => {}
            None => {}
        }
    }

    errors
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::v0_1::{
        EdgeEndpointV01, FeedbackPolicyV01, GraphFragmentV01, GraphNodeV01,
        ObjectImplementationRefV01, ObjectProviderRefV01, ObjectResolutionStatusV01,
        ObjectResolutionV01, StringOrStringsV01,
    };
    use serde_json::json;

    fn core_implementation(object_id: &str) -> ObjectImplementationRefV01 {
        ObjectImplementationRefV01 {
            provider: ObjectProviderRefV01::Core,
            object_id: object_id.to_owned(),
            interface_digest: None,
        }
    }

    fn resolved_object_resolution() -> ObjectResolutionV01 {
        ObjectResolutionV01 {
            status: ObjectResolutionStatusV01::Resolved,
            selected_spec: Some("float".to_owned()),
            candidates: Vec::new(),
            issues: Vec::new(),
        }
    }

    fn graph(json: &str) -> GraphDocumentV01 {
        serde_json::from_str(json).expect("graph should parse")
    }

    fn node(json: &str) -> NodeDefinitionManifestV01 {
        serde_json::from_str(json).expect("node should parse")
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
                  "implementation": { "provider": { "kind": "core" }, "objectId": "float" },
                  "params": {},
                  "ports": [
                    { "id": "out", "direction": "output", "type": "value.core.float64" }
                  ]
                },
                {
                  "id": "target",
                  "implementation": { "provider": { "kind": "core" }, "objectId": "float" },
                  "params": {},
                  "ports": [
                    { "id": "in", "direction": "input", "type": "value.core.float64" }
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

    #[test]
    fn validates_project_document_branches_in_unit_target() {
        let graph = serde_json::to_value(base_graph()).expect("base graph should serialize");
        let mut project: ProjectDocumentV01 = serde_json::from_value(json!({
            "schema": "skenion.project",
            "schemaVersion": "0.1.0",
            "id": "project-unit",
            "documentId": "00000000-0000-4000-8000-000000000201",
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

        let event_message_any = data_type(DataFlowV01::Event, "value.core.message");
        let bang_event = data_type(DataFlowV01::Event, "value.core.bang");
        assert!(compatible_data_types_v01(&event_message_any, &bang_event));

        let message_value_any = data_type(DataFlowV01::Control, "value.core.message");
        let control_string = data_type(DataFlowV01::Control, "value.core.string");
        assert!(compatible_data_types_v01(
            &message_value_any,
            &control_string
        ));
        assert!(compatible_data_types_v01(&bang_event, &message_value_any));

        let signal_any = data_type(DataFlowV01::Signal, "value.core.message");
        let signal_number = data_type(DataFlowV01::Signal, "value.core.float32");
        assert!(!compatible_data_types_v01(&signal_any, &signal_number));

        assert_eq!(type_label_v01(&bang_event), "event<value.core.bang>");
        assert_eq!(
            type_label_v01(&message_value_any),
            "control<value.core.message>"
        );
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
                port_type: "value.core.float64".to_owned(),
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
                port_type: "value.core.float64".to_owned(),
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
        valid_default_port.accepts = Some(vec!["value.core.float64".to_owned()]);
        graph.nodes[0].port_groups.as_mut().unwrap()[0].default_port_spec =
            Some(valid_default_port);
        let mut valid_default_without_accepts = graph.nodes[0].ports[0].clone();
        valid_default_without_accepts.id = "out_dynamic".to_owned();
        valid_default_without_accepts.accepts = None;
        graph.nodes[0].port_groups.as_mut().unwrap()[1].default_port_spec =
            Some(valid_default_without_accepts);
        let result = validate_graph_document_v01(&graph).expect("graph should validate");
        assert!(result.ok);
        assert!(result.issues.is_empty());

        let serialized = serde_json::to_string(&graph).expect("graph should serialize");
        assert!(!serialized.contains("null"));

        let mut resolved_without_implementation = graph.clone();
        resolved_without_implementation.nodes[0].implementation = None;
        resolved_without_implementation.nodes[0].object_resolution =
            Some(resolved_object_resolution());
        let resolved_without_implementation_report =
            validate_graph_document_v01(&resolved_without_implementation)
                .expect_err("resolved graph node without implementation should fail");
        assert!(
            resolved_without_implementation_report
                .to_string()
                .contains("resolved-object-missing-implementation")
        );

        let mut invalid_default_port = graph;
        invalid_default_port.nodes[0].port_groups.as_mut().unwrap()[0].port_type =
            "number.float".to_owned();
        let mut default_port = invalid_default_port.nodes[0].ports[0].clone();
        default_port.direction = PortDirectionV01::Input;
        default_port.port_type = "number.float".to_owned();
        default_port.accepts = Some(vec![
            "message.any".to_owned(),
            "value.core.message".to_owned(),
        ]);
        invalid_default_port.nodes[0].port_groups.as_mut().unwrap()[0].default_port_spec =
            Some(default_port);
        let report = validate_graph_document_v01(&invalid_default_port)
            .expect_err("invalid default port contract should fail");
        let text = report.to_string();
        assert!(text.contains("port group source.outputs uses invalid value type"));
        assert!(text.contains("default port uses invalid value type number.float"));
        assert!(text.contains("default port accepts invalid value type message.any"));
        assert!(text.contains("defaultPortSpec message-key-aware input port requires"));
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

        let mut payload_identity_node = fragment.clone();
        payload_identity_node.nodes[0].implementation =
            Some(core_implementation("value.core.float32"));
        assert!(
            validate_graph_fragment_v01(&payload_identity_node)
                .expect_err("payload identity node should fail")
                .to_string()
                .contains("payload-implementation-id")
        );

        let mut resolved_without_implementation = fragment.clone();
        resolved_without_implementation.nodes[0].implementation = None;
        resolved_without_implementation.nodes[0].object_resolution =
            Some(resolved_object_resolution());
        assert!(
            validate_graph_fragment_v01(&resolved_without_implementation)
                .expect_err("resolved fragment node without implementation should fail")
                .to_string()
                .contains("resolved-object-missing-implementation")
        );

        let mut invalid_fragment_contracts = fragment.clone();
        invalid_fragment_contracts.nodes[1].ports[0].port_type = "value.core.message".to_owned();
        invalid_fragment_contracts.nodes[1].ports[0].accepts = Some(vec![
            "message.any".to_owned(),
            "value.core.float64".to_owned(),
        ]);
        invalid_fragment_contracts.nodes[1].ports[0].message_keys = None;
        invalid_fragment_contracts.edges[0].resolved_type = Some("number.float".to_owned());
        let invalid_fragment_report = validate_graph_fragment_v01(&invalid_fragment_contracts)
            .expect_err("legacy fragment contracts should fail");
        let invalid_fragment_text = invalid_fragment_report.to_string();
        assert!(invalid_fragment_text.contains("accepts invalid value type message.any"));
        assert!(invalid_fragment_text.contains("requires messageKeys"));
        assert!(
            invalid_fragment_text.contains("edge edge_source_target uses invalid resolvedType")
        );

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
    fn validates_value_transfer_semantic_error_branches() {
        for (payload, expected) in [
            (
                json!({ "valueTypeId": "" }),
                "valueFormat.valueTypeId must be a non-empty string",
            ),
            (
                json!({ "valueTypeId": "not-value" }),
                "valueFormat.valueTypeId is not a valid value type id",
            ),
            (
                json!({ "valueTypeId": "value" }),
                "valueFormat.valueTypeId is not a valid value type id",
            ),
            (
                json!({ "valueTypeId": "value.core.vector", "format": "f32", "shape": [2, 0] }),
                "valueFormat.shape[1] must be a positive integer",
            ),
            (
                json!({ "valueTypeId": "value.core.vector", "format": "i32" }),
                "valueFormat.shape is required for value.core.vector",
            ),
            (
                json!({ "valueTypeId": "value.core.matrix", "shape": [2, 2] }),
                "valueFormat.format is required for value.core.matrix",
            ),
            (
                json!({ "valueTypeId": "value.core.float32", "format": "i32" }),
                "valueFormat.format i32 is not valid for value.core.float32",
            ),
            (
                json!({ "valueTypeId": "value.core.float32", "byteLength": 0 }),
                "valueFormat.byteLength must be a positive integer",
            ),
            (
                json!({ "valueTypeId": "value.core.float32", "channels": 0 }),
                "valueFormat.channels must be a positive integer",
            ),
            (
                json!({ "valueTypeId": "value.core.float32", "sampleRate": 0 }),
                "valueFormat.sampleRate must be greater than zero",
            ),
            (
                json!({ "valueTypeId": "value.core.bang", "shape": [1] }),
                "valueFormat.shape is not allowed for value.core.bang",
            ),
            (
                json!({ "valueTypeId": "value.core.bang", "byteLength": 1 }),
                "valueFormat.byteLength is not allowed for value.core.bang",
            ),
            (
                json!({ "valueTypeId": "value.core.bang", "resourceKind": "file" }),
                "valueFormat.resourceKind is not allowed for value.core.bang",
            ),
        ] {
            let value_format: ValueFormatV01 =
                serde_json::from_value(payload).expect("value format should parse");
            let report = validate_value_format_v01(&value_format)
                .expect_err("invalid value format should fail");
            assert!(
                report.to_string().contains(expected),
                "expected {expected}, got {report}"
            );
        }

        let invalid_binding: EndpointBindingValueFormatV01 = serde_json::from_value(json!({
            "bindingId": "",
            "bindingEpoch": 1,
            "formatRevision": 1,
            "valueFormat": { "valueTypeId": "value.core.float32", "format": "f32" },
            "source": { "nodeId": "", "portId": "out" },
            "target": { "nodeId": "target", "portId": "" },
            "delivery": { "policy": "nonsense", "maxInFlight": 0 }
        }))
        .expect("invalid binding should parse");
        let binding_report = validate_endpoint_binding_value_format_v01(&invalid_binding)
            .expect_err("invalid binding should fail");
        let binding_text = binding_report.to_string();
        assert!(binding_text.contains("bindingFormat.bindingId must be a non-empty string"));
        assert!(binding_text.contains("bindingFormat.source must contain non-empty"));
        assert!(binding_text.contains("bindingFormat.target must contain non-empty"));
        assert!(binding_text.contains("bindingFormat.delivery contains an invalid policy"));

        let invalid_occurrence: ValueOccurrenceHeaderV01 = serde_json::from_value(json!({
            "bindingId": "",
            "bindingEpoch": 0,
            "formatRevision": 0,
            "sequence": 1,
            "payloadKind": "empty",
            "byteLength": 0,
            "byteOffset": 4,
            "actualShape": [1],
            "duration": -1
        }))
        .expect("invalid occurrence should parse");
        let occurrence_report = validate_value_occurrence_header_v01(&invalid_occurrence)
            .expect_err("invalid occurrence should fail");
        let occurrence_text = occurrence_report.to_string();
        assert!(occurrence_text.contains("occurrenceHeader.bindingId must be a non-empty string"));
        assert!(
            occurrence_text.contains("occurrenceHeader.bindingEpoch must be a positive integer")
        );
        assert!(
            occurrence_text.contains("occurrenceHeader.formatRevision must be a positive integer")
        );
        assert!(occurrence_text.contains("occurrenceHeader.byteLength must be a positive integer"));
        assert!(occurrence_text.contains("occurrenceHeader.duration must be greater than"));
        assert!(
            occurrence_text.contains("occurrenceHeader.byteLength is not allowed when payloadKind")
        );
        assert!(
            occurrence_text.contains("occurrenceHeader.byteOffset is not allowed when payloadKind")
        );
        assert!(
            occurrence_text
                .contains("occurrenceHeader.actualShape is not allowed when payloadKind")
        );

        let invalid_timestamp = ValueOccurrenceHeaderV01 {
            binding_id: "edge_1".to_owned(),
            binding_epoch: 1,
            format_revision: 1,
            sequence: 1,
            clock: None,
            timestamp: Some(f64::NAN),
            payload_kind: ValuePayloadKindV01::Json,
            byte_length: None,
            byte_offset: None,
            actual_shape: None,
            flags: None,
            dropped_before: None,
            duration: None,
        };
        assert!(
            validate_value_occurrence_header_v01(&invalid_timestamp)
                .expect_err("invalid timestamp should fail")
                .to_string()
                .contains("occurrenceHeader.timestamp must be a finite number")
        );
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
                  "implementation": { "provider": { "kind": "core" }, "objectId": "loop" },
                  "params": {},
                  "ports": [
                    { "id": "in", "direction": "input", "type": "value.core.float64" },
                    { "id": "out", "direction": "output", "type": "value.core.float64" }
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
              "documentId": "00000000-0000-4000-8000-000000000202",
              "revision": "1",
              "graph": {
                "schema": "skenion.graph",
                "schemaVersion": "0.1.0",
                "id": "warning-graph",
                "revision": "1",
                "nodes": [
                  {
                    "id": "a",
                    "implementation": { "provider": { "kind": "core" }, "objectId": "a" },
                    "params": {},
                    "ports": [
                      { "id": "in", "direction": "input", "type": "value.core.float64" },
                      { "id": "out", "direction": "output", "type": "value.core.float64" }
                    ]
                  },
                  {
                    "id": "b",
                    "implementation": { "provider": { "kind": "core" }, "objectId": "b" },
                    "params": {},
                    "ports": [
                      { "id": "in", "direction": "input", "type": "value.core.float64" },
                      { "id": "out", "direction": "output", "type": "value.core.float64" }
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
                        "implementation": { "provider": { "kind": "core" }, "objectId": "inlet" },
                        "params": {},
                        "ports": [
                          { "id": "out", "direction": "output", "type": "value.core.float64" }
                        ]
                      },
                      {
                        "id": "right_out",
                        "implementation": { "provider": { "kind": "core" }, "objectId": "outlet" },
                        "params": {},
                        "ports": [
                          { "id": "in", "direction": "input", "type": "value.core.float64" }
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
              "documentId": "00000000-0000-4000-8000-000000000203",
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
                        "implementation": { "provider": { "kind": "core" }, "objectId": "inlet" },
                        "params": { "portId": "same" },
                        "ports": [
                          { "id": "out", "direction": "output", "type": "value.core.float64" }
                        ]
                      },
                      {
                        "id": "inlet_b",
                        "implementation": { "provider": { "kind": "core" }, "objectId": "inlet" },
                        "params": { "portId": "same" },
                        "ports": [
                          { "id": "out", "direction": "output", "type": "value.core.float64" }
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
        graph.nodes[1].ports[0].port_type = "value.core.tensor".to_owned();
        graph.nodes[1].ports[0].accepts = Some(vec!["value.core.tensor".to_owned()]);
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
        graph.nodes[0].ports[0].port_type = "value.core.tensor".to_owned();
        graph.nodes[1].ports[0].accepts = Some(vec!["value.core.tensor".to_owned()]);
        assert!(validate_graph_document_v01(&graph).is_ok());

        graph.nodes[1].ports[0].required = Some(true);
        graph.edges.clear();
        let missing = validate_graph_document_v01(&graph).expect_err("required input should fail");
        assert!(missing.to_string().contains("missing-required-input"));

        graph.nodes.push(GraphNodeV01 {
            id: "source_two".to_owned(),
            implementation: Some(core_implementation("float")),
            object_spec: None,
            object_resolution: None,
            binding_ref: None,
            params: serde_json::Map::new(),
            ports: vec![PortSpecV01 {
                id: "out".to_owned(),
                direction: PortDirectionV01::Output,
                port_type: "value.core.tensor".to_owned(),
                label: None,
                rate: None,
                accepts: None,
                min_connections: None,
                max_connections: None,
                merge_policy: None,
                fan_out_policy: None,
                trigger_mode: None,
                message_keys: None,
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
                  "implementation": { "provider": { "kind": "core" }, "objectId": "bang" },
                  "params": {},
                  "ports": [
                    { "id": "out", "direction": "output", "type": "value.core.bang", "rate": "event" }
                  ]
                },
                {
                  "id": "int_source",
                  "implementation": { "provider": { "kind": "core" }, "objectId": "int" },
                  "params": {},
                  "ports": [
                    { "id": "value", "direction": "output", "type": "value.core.int64", "rate": "control" }
                  ]
                },
                {
                  "id": "bool_source",
                  "implementation": { "provider": { "kind": "core" }, "objectId": "test.bool-emitter" },
                  "params": {},
                  "ports": [
                    { "id": "value", "direction": "output", "type": "value.core.bool", "rate": "control" }
                  ]
                },
                {
                  "id": "number_box",
                  "implementation": { "provider": { "kind": "core" }, "objectId": "float" },
                  "params": {},
                  "ports": [
                    {
                      "id": "in",
                      "direction": "input",
                      "type": "value.core.message",
                      "rate": "control",
                      "accepts": [
                        "value.core.float64",
                        "value.core.int64",
                        "value.core.bool",
                        "value.core.bang"
                      ],
                      "maxConnections": 3,
                      "mergePolicy": "ordered-events",
                      "triggerMode": "trigger",
                      "messageKeys": {
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

        let mut missing_key_policy = graph.clone();
        missing_key_policy.nodes[3].ports[0].message_keys = None;
        let report = validate_graph_document_v01(&missing_key_policy)
            .expect_err("message-key-aware input should require messageKeys");
        assert!(report.to_string().contains("requires messageKeys"));

        let mut invalid_set_trigger = graph.clone();
        let policy = invalid_set_trigger.nodes[3].ports[0]
            .message_keys
            .as_mut()
            .expect("number box should declare key policy");
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
            .message_keys
            .as_mut()
            .expect("number box should declare key policy");
        policy.accepted = vec!["set".to_owned()];
        policy.silent = Some(vec!["set".to_owned()]);
        policy.trigger = None;
        policy.store = None;
        policy.emit = Some(vec!["set".to_owned()]);
        let report = validate_graph_document_v01(&invalid_set_emit).expect_err("set must not emit");
        assert!(report.to_string().contains("emit must not include set"));

        let mut valid_set_store = graph.clone();
        let policy = valid_set_store.nodes[3].ports[0]
            .message_keys
            .as_mut()
            .expect("number box should declare key policy");
        policy.accepted = vec!["set".to_owned()];
        policy.silent = None;
        policy.trigger = None;
        policy.store = Some(vec!["set".to_owned()]);
        policy.emit = None;
        validate_graph_document_v01(&valid_set_store)
            .expect("set should be valid as store key behavior");

        let mut empty_key_policy = graph.clone();
        let policy = empty_key_policy.nodes[3].ports[0]
            .message_keys
            .as_mut()
            .expect("number box should declare key policy");
        policy.accepted.clear();
        policy.silent = None;
        policy.trigger = None;
        policy.store = None;
        policy.emit = None;
        let report = validate_graph_document_v01(&empty_key_policy)
            .expect_err("accepted key set must not be empty");
        assert!(
            report
                .to_string()
                .contains("accepted must list at least one key")
        );

        let mut unaccepted_trigger_key = graph.clone();
        let policy = unaccepted_trigger_key.nodes[3].ports[0]
            .message_keys
            .as_mut()
            .expect("number box should declare key policy");
        policy.accepted = vec!["float".to_owned()];
        policy.silent = None;
        policy.trigger = Some(vec!["int".to_owned()]);
        policy.store = None;
        policy.emit = None;
        let report = validate_graph_document_v01(&unaccepted_trigger_key)
            .expect_err("key behavior must stay inside accepted keys");
        assert!(
            report
                .to_string()
                .contains("messageKeys.trigger key int is not accepted")
        );

        let mut without_bang_accept = graph.clone();
        without_bang_accept.nodes[3].ports[0].accepts = Some(vec![
            "value.core.float64".to_owned(),
            "value.core.int64".to_owned(),
            "value.core.bool".to_owned(),
        ]);
        assert!(validate_graph_document_v01(&without_bang_accept).is_ok());
    }

    #[test]
    fn rejects_invalid_value_type_aliases_in_current_contracts() {
        let legacy_types = [
            "value.number",
            "value<number.float>",
            "number.float",
            "number.int",
            "number.uint",
            "boolean",
            "message.any",
            "value.core.symbol",
            "value.media.asset",
            "value.media.audio-sample",
            "value.media.audio-frame",
            "value.media.audio-buffer",
            "value.media.future-frame",
            "value.media.image",
            "value.media.matrix",
        ];

        for legacy_type in legacy_types {
            let mut graph = base_graph();
            graph.nodes[0].ports[0].port_type = legacy_type.to_owned();
            let report = validate_graph_document_v01(&graph).expect_err("invalid port should fail");
            assert!(
                report.to_string().contains("invalid-value-type"),
                "{legacy_type}"
            );

            let mut graph = base_graph();
            graph.nodes[1].ports[0].port_type = "value.core.message".to_owned();
            graph.nodes[1].ports[0].accepts = Some(vec![legacy_type.to_owned()]);
            let report =
                validate_graph_document_v01(&graph).expect_err("legacy accepted type should fail");
            assert!(
                report.to_string().contains("invalid-value-type"),
                "{legacy_type}"
            );

            let mut graph = base_graph();
            graph.edges[0].resolved_type = Some(legacy_type.to_owned());
            let report =
                validate_graph_document_v01(&graph).expect_err("invalid resolvedType should fail");
            assert!(
                report.to_string().contains("invalid-value-type"),
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
                report.to_string().contains("invalid value type"),
                "{legacy_type}"
            );
        }

        for payload_identity in ["bool", "string"] {
            let mut graph = base_graph();
            graph.nodes[0].implementation = Some(core_implementation(payload_identity));
            let report = validate_graph_document_v01(&graph).expect_err("payload kind should fail");
            assert!(
                report.to_string().contains("payload-implementation-id"),
                "{payload_identity}"
            );

            let mut definition = node(
                r#"{
                  "schema": "skenion.node.definition",
                  "schemaVersion": "0.1.0",
                  "id": "test.node",
                  "version": "0.1.0",
                  "displayName": "Payload Identity",
                  "category": "Test",
                  "ports": [
                    { "id": "out", "direction": "output", "type": "value.core.float64" }
                  ],
                  "execution": { "model": "control" },
                  "state": { "persistent": false },
                  "permissions": [],
                  "capabilities": []
                }"#,
            );
            definition.id = payload_identity.to_owned();
            let report = validate_node_definition_v01(&definition)
                .expect_err("payload node definition id should fail");
            assert!(
                report
                    .to_string()
                    .contains("payload identity node definition id"),
                "{payload_identity}"
            );
        }
    }

    #[test]
    fn classifies_cycles_without_executing_feedback() {
        let mut graph = base_graph();
        graph.nodes[0].ports.push(PortSpecV01 {
            id: "in".to_owned(),
            direction: PortDirectionV01::Input,
            port_type: "value.core.float64".to_owned(),
            label: None,
            rate: None,
            accepts: None,
            min_connections: None,
            max_connections: None,
            merge_policy: None,
            fan_out_policy: None,
            trigger_mode: None,
            message_keys: None,
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
            port_type: "value.core.float64".to_owned(),
            label: None,
            rate: None,
            accepts: None,
            min_connections: None,
            max_connections: None,
            merge_policy: None,
            fan_out_policy: None,
            trigger_mode: None,
            message_keys: None,
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

        let mut immediate_value_cycle = graph.clone();
        for node in &mut immediate_value_cycle.nodes {
            for port in &mut node.ports {
                port.port_type = "value.core.float64".to_owned();
            }
        }
        let control_ambiguous = validate_graph_document_v01(&immediate_value_cycle)
            .expect_err("immediate value cycle should fail");
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
        assert_eq!(risky.issues[0].severity, "warning");
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
              "id": "object.core.render.clear-color",
              "version": "0.1.0",
              "displayName": "Clear Color",
              "category": "Render",
              "ports": [
                { "id": "out", "direction": "output", "type": "value.core.tensor" }
              ],
              "execution": { "model": "gpu_pass", "clock": "frame" },
              "state": { "persistent": false },
              "permissions": [],
              "capabilities": ["value.core.tensor.v0.1"]
            }"#,
        );
        validate_node_definition_v01(&valid).expect("node should validate");

        let mut invalid = valid;
        invalid.schema = "wrong".to_owned();
        invalid.schema_version = "9.9.9".to_owned();
        invalid.id = "object.core.string".to_owned();
        invalid.permissions.push("network".to_owned());
        invalid.ports.push(invalid.ports[0].clone());
        invalid.ports[0].accepts = Some(vec![
            "message.any".to_owned(),
            "value.core.float64".to_owned(),
        ]);
        let mut key_port = invalid.ports[0].clone();
        key_port.id = "key".to_owned();
        key_port.direction = PortDirectionV01::Input;
        key_port.port_type = "value.core.message".to_owned();
        key_port.accepts = None;
        key_port.message_keys = None;
        invalid.ports.push(key_port);
        invalid.port_groups = Some(vec![
            super::super::PortGroupSpecV01 {
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
                        "value.core.message".to_owned(),
                    ]);
                    port.message_keys = None;
                    port
                }),
            },
            super::super::PortGroupSpecV01 {
                id: "without-default".to_owned(),
                direction: PortDirectionV01::Output,
                port_type: "value.core.tensor".to_owned(),
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
        let report = validate_node_definition_v01(&invalid).expect_err("node should fail");
        let text = report.to_string();
        assert!(text.contains("expected schema skenion.node.definition"));
        assert!(text.contains("expected schemaVersion 0.1.0"));
        assert!(text.contains("payload identity node definition id"));
        assert!(text.contains("unsupported permission"));
        assert!(text.contains("duplicate port id"));
        assert!(text.contains("invalid accepted value type"));
        assert!(text.contains("message-key-aware input port requires messageKeys"));
        assert!(text.contains("invalid port group type"));
        assert!(text.contains("invalid default value type"));
        assert!(text.contains("invalid default accepted value type"));
        assert!(text.contains("defaultPortSpec message-key-aware input port requires"));
        assert!(text.contains("maxPorts"));
    }

    #[test]
    fn reports_schema_mismatches_and_invalid_port_group_on_graph() {
        let mut graph = base_graph();
        graph.schema = "wrong".to_owned();
        graph.schema_version = "9.9.9".to_owned();
        graph.nodes.push(GraphNodeV01 {
            id: "grouped".to_owned(),
            implementation: Some(core_implementation("grouped")),
            object_spec: None,
            object_resolution: None,
            binding_ref: None,
            params: serde_json::Map::new(),
            ports: Vec::new(),
            port_groups: Some(vec![super::super::PortGroupSpecV01 {
                id: "bad".to_owned(),
                direction: PortDirectionV01::Input,
                port_type: "value.core.float64".to_owned(),
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
