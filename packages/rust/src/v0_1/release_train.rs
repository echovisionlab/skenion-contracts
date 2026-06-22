use std::collections::{BTreeMap, HashMap, HashSet};

use serde::{Deserialize, Serialize};

use super::{ValidationErrorV01, ValidationReportV01};

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Deserialize, Serialize)]
pub enum ReleaseTrainTargetV01 {
    #[serde(rename = "aarch64-apple-darwin")]
    Aarch64AppleDarwin,
    #[serde(rename = "x86_64-apple-darwin")]
    X8664AppleDarwin,
    #[serde(rename = "x86_64-pc-windows-msvc")]
    X8664PcWindowsMsvc,
    #[serde(rename = "aarch64-pc-windows-msvc")]
    Aarch64PcWindowsMsvc,
    #[serde(rename = "x86_64-unknown-linux-gnu")]
    X8664UnknownLinuxGnu,
    #[serde(rename = "aarch64-unknown-linux-gnu")]
    Aarch64UnknownLinuxGnu,
}

impl ReleaseTrainTargetV01 {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Aarch64AppleDarwin => "aarch64-apple-darwin",
            Self::X8664AppleDarwin => "x86_64-apple-darwin",
            Self::X8664PcWindowsMsvc => "x86_64-pc-windows-msvc",
            Self::Aarch64PcWindowsMsvc => "aarch64-pc-windows-msvc",
            Self::X8664UnknownLinuxGnu => "x86_64-unknown-linux-gnu",
            Self::Aarch64UnknownLinuxGnu => "aarch64-unknown-linux-gnu",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum ReleaseTrainSupportTierV01 {
    ReleaseBlocking,
    Preview,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum ReleaseTrainArtifactKindV01 {
    RuntimeBinary,
    StudioDesktopPackage,
    StudioRuntimeSidecar,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum ReleaseTrainPackageEcosystemV01 {
    Npm,
    #[serde(rename = "crates.io")]
    CratesIo,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum ReleaseTrainChecksumAlgorithmV01 {
    Sha256,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum ReleaseTrainGateStatusV01 {
    Pending,
    Passed,
    Failed,
    Waived,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ReleaseTrainRegistryPackageV01 {
    pub ecosystem: ReleaseTrainPackageEcosystemV01,
    pub name: String,
    pub version: String,
    pub url: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ReleaseTrainChecksumV01 {
    pub algorithm: ReleaseTrainChecksumAlgorithmV01,
    pub value: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(tag = "kind", rename_all_fields = "camelCase")]
pub enum ReleaseTrainArtifactSourceV01 {
    #[serde(rename = "github-release-asset")]
    GithubReleaseAsset {
        repository: String,
        tag: String,
        asset_name: String,
        url: Option<String>,
    },
    #[serde(rename = "url")]
    Url { url: String },
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ReleaseTrainArtifactV01 {
    pub id: String,
    pub target: ReleaseTrainTargetV01,
    pub support_tier: ReleaseTrainSupportTierV01,
    pub kind: ReleaseTrainArtifactKindV01,
    pub name: String,
    pub version: String,
    pub source: ReleaseTrainArtifactSourceV01,
    pub checksum: ReleaseTrainChecksumV01,
    pub size_bytes: Option<u64>,
}

pub type ReleaseTrainTargetArtifactMapV01 =
    BTreeMap<ReleaseTrainTargetV01, ReleaseTrainArtifactV01>;

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ReleaseTrainProtocolBaselinesV01 {
    pub graph: String,
    pub project: String,
    pub node: String,
    pub extension: String,
    pub runtime_http: String,
    pub runtime_collaboration: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum ReleaseTrainConnectionProfileV01 {
    LocalManaged,
    LocalShared,
    Remote,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ReleaseTrainRuntimeCapabilitySetV01 {
    pub session_addressing: bool,
    pub event_replay: bool,
    pub multi_window: bool,
    pub connection_profiles: Vec<ReleaseTrainConnectionProfileV01>,
    pub collaboration: String,
    pub operation_log: bool,
    pub io_discovery: String,
    pub auth_policy: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ReleaseTrainStudioCapabilitySetV01 {
    pub graph_editor: bool,
    pub patch_library: bool,
    pub subpatches: bool,
    pub living_help: bool,
    pub graph_clipboard: bool,
    pub desktop_shell: String,
    pub connection_profiles: Vec<ReleaseTrainConnectionProfileV01>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ReleaseTrainMarketplaceCapabilitySetV01 {
    pub package_discovery: bool,
    pub package_install: bool,
    pub package_update: bool,
    pub extension_packages: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ReleaseTrainManualCapabilitySetV01 {
    pub versioned_paths: bool,
    pub pages_deployment: bool,
    pub latest_promotion_requires_matrix: bool,
    pub patch_releases_use_major_minor_path: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ReleaseTrainCapabilitySetV01 {
    pub protocol_surfaces: ReleaseTrainProtocolBaselinesV01,
    pub runtime: ReleaseTrainRuntimeCapabilitySetV01,
    pub studio: ReleaseTrainStudioCapabilitySetV01,
    pub marketplace: ReleaseTrainMarketplaceCapabilitySetV01,
    pub manual: ReleaseTrainManualCapabilitySetV01,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ReleaseTrainContractsComponentV01 {
    pub npm: ReleaseTrainRegistryPackageV01,
    #[serde(rename = "crate")]
    pub crate_package: ReleaseTrainRegistryPackageV01,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ReleaseTrainRuntimeComponentV01 {
    #[serde(rename = "crate")]
    pub crate_package: ReleaseTrainRegistryPackageV01,
    pub binaries: ReleaseTrainTargetArtifactMapV01,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ReleaseTrainSdkComponentV01 {
    pub npm: ReleaseTrainRegistryPackageV01,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ReleaseTrainStudioComponentV01 {
    pub web: ReleaseTrainRegistryPackageV01,
    pub desktop: ReleaseTrainRegistryPackageV01,
    pub desktop_packages: ReleaseTrainTargetArtifactMapV01,
    pub runtime_sidecars: ReleaseTrainTargetArtifactMapV01,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ReleaseTrainExamplesComponentV01 {
    pub repository: String,
    pub version: String,
    pub tag: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub commit: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ReleaseTrainManualComponentV01 {
    pub version: String,
    pub path: String,
    pub pages_url: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ReleaseTrainDocsComponentV01 {
    pub manual: ReleaseTrainManualComponentV01,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ReleaseTrainComponentsV01 {
    pub contracts: ReleaseTrainContractsComponentV01,
    pub runtime: ReleaseTrainRuntimeComponentV01,
    pub sdk: ReleaseTrainSdkComponentV01,
    pub studio: ReleaseTrainStudioComponentV01,
    pub examples: ReleaseTrainExamplesComponentV01,
    pub docs: ReleaseTrainDocsComponentV01,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ReleaseTrainRegistryPackageGateV01 {
    pub id: String,
    pub status: ReleaseTrainGateStatusV01,
    pub required: bool,
    pub package: ReleaseTrainRegistryPackageV01,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub evidence_url: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ReleaseTrainRegistryPackageGatesV01 {
    pub contracts_npm: ReleaseTrainRegistryPackageGateV01,
    pub contracts_crate: ReleaseTrainRegistryPackageGateV01,
    pub runtime_crate: ReleaseTrainRegistryPackageGateV01,
    pub sdk_npm: ReleaseTrainRegistryPackageGateV01,
    pub studio_web: ReleaseTrainRegistryPackageGateV01,
    pub studio_desktop: ReleaseTrainRegistryPackageGateV01,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ReleaseTrainArtifactCollectionGateV01 {
    pub id: String,
    pub status: ReleaseTrainGateStatusV01,
    pub required: bool,
    pub repository: String,
    pub tag: String,
    pub artifact_ids: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub evidence_url: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ReleaseTrainGithubReleaseAssetGatesV01 {
    pub runtime: ReleaseTrainArtifactCollectionGateV01,
    pub studio: ReleaseTrainArtifactCollectionGateV01,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ReleaseTrainChecksumGateV01 {
    pub id: String,
    pub status: ReleaseTrainGateStatusV01,
    pub required: bool,
    pub artifact_ids: Vec<String>,
    #[serde(default, skip_serializing_if = "BTreeMap::is_empty")]
    pub expected_checksums: BTreeMap<String, ReleaseTrainChecksumV01>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub evidence_url: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ReleaseTrainRuntimeSmokeGateV01 {
    pub id: String,
    pub status: ReleaseTrainGateStatusV01,
    pub required: bool,
    pub target: ReleaseTrainTargetV01,
    pub artifact_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub evidence_url: Option<String>,
}

pub type ReleaseTrainRuntimeSmokeGateMapV01 =
    BTreeMap<ReleaseTrainTargetV01, ReleaseTrainRuntimeSmokeGateV01>;

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ReleaseTrainStudioPackageSmokeGateV01 {
    pub id: String,
    pub status: ReleaseTrainGateStatusV01,
    pub required: bool,
    pub target: ReleaseTrainTargetV01,
    pub desktop_package_artifact_id: String,
    pub runtime_sidecar_artifact_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub evidence_url: Option<String>,
}

pub type ReleaseTrainStudioPackageSmokeGateMapV01 =
    BTreeMap<ReleaseTrainTargetV01, ReleaseTrainStudioPackageSmokeGateV01>;

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ReleaseTrainExamplesConformanceGateV01 {
    pub id: String,
    pub status: ReleaseTrainGateStatusV01,
    pub required: bool,
    pub repository: String,
    #[serde(rename = "ref")]
    pub ref_name: String,
    pub version: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub evidence_url: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ReleaseTrainDocsPagesDeploymentGateV01 {
    pub id: String,
    pub status: ReleaseTrainGateStatusV01,
    pub required: bool,
    pub manual_version: String,
    pub manual_path: String,
    pub pages_url: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub evidence_url: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ReleaseTrainGatesV01 {
    pub registry_packages: ReleaseTrainRegistryPackageGatesV01,
    pub github_release_assets: ReleaseTrainGithubReleaseAssetGatesV01,
    pub checksum_verification: ReleaseTrainChecksumGateV01,
    pub runtime_smoke: ReleaseTrainRuntimeSmokeGateMapV01,
    pub studio_package_smoke: ReleaseTrainStudioPackageSmokeGateMapV01,
    pub examples_conformance: ReleaseTrainExamplesConformanceGateV01,
    pub docs_pages_deployment: ReleaseTrainDocsPagesDeploymentGateV01,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct ReleaseTrainManifestV01 {
    pub schema: String,
    pub schema_version: String,
    pub train_id: String,
    pub train_version: String,
    pub protocol_baselines: ReleaseTrainProtocolBaselinesV01,
    pub capability_set: ReleaseTrainCapabilitySetV01,
    pub components: ReleaseTrainComponentsV01,
    pub release_gates: ReleaseTrainGatesV01,
}

const RELEASE_TRAIN_TARGETS_V01: [ReleaseTrainTargetV01; 6] = [
    ReleaseTrainTargetV01::Aarch64AppleDarwin,
    ReleaseTrainTargetV01::X8664AppleDarwin,
    ReleaseTrainTargetV01::X8664PcWindowsMsvc,
    ReleaseTrainTargetV01::Aarch64PcWindowsMsvc,
    ReleaseTrainTargetV01::X8664UnknownLinuxGnu,
    ReleaseTrainTargetV01::Aarch64UnknownLinuxGnu,
];

fn support_tier_for_target(target: ReleaseTrainTargetV01) -> ReleaseTrainSupportTierV01 {
    match target {
        ReleaseTrainTargetV01::Aarch64AppleDarwin
        | ReleaseTrainTargetV01::X8664AppleDarwin
        | ReleaseTrainTargetV01::X8664PcWindowsMsvc
        | ReleaseTrainTargetV01::X8664UnknownLinuxGnu => {
            ReleaseTrainSupportTierV01::ReleaseBlocking
        }
        ReleaseTrainTargetV01::Aarch64PcWindowsMsvc
        | ReleaseTrainTargetV01::Aarch64UnknownLinuxGnu => ReleaseTrainSupportTierV01::Preview,
    }
}

fn is_numeric_version(value: &str, part_count: usize) -> bool {
    let parts: Vec<&str> = value.split('.').collect();
    parts.len() == part_count
        && parts
            .iter()
            .all(|part| !part.is_empty() && part.bytes().all(|byte| byte.is_ascii_digit()))
}

fn is_sha256_hex(value: &str) -> bool {
    value.len() == 64 && value.bytes().all(|byte| byte.is_ascii_hexdigit())
}

fn validate_checksum(errors: &mut Vec<ValidationErrorV01>, checksum: &ReleaseTrainChecksumV01) {
    if let Some(value) = &checksum.value {
        if !is_sha256_hex(value) {
            errors.push(ValidationErrorV01::new(
                "checksum value must be a 64 character sha256 hex digest",
            ));
        }
    }
}

fn validate_package_version(
    errors: &mut Vec<ValidationErrorV01>,
    label: &str,
    package: &ReleaseTrainRegistryPackageV01,
    train_version: &str,
) {
    if package.version != train_version {
        errors.push(ValidationErrorV01::new(format!(
            "{label} version must be {train_version}"
        )));
    }
}

fn validate_artifact_map(
    errors: &mut Vec<ValidationErrorV01>,
    label: &str,
    artifacts: &ReleaseTrainTargetArtifactMapV01,
    expected_kind: ReleaseTrainArtifactKindV01,
    train_version: &str,
) {
    for target in RELEASE_TRAIN_TARGETS_V01 {
        let target_label = target.as_str();
        let Some(artifact) = artifacts.get(&target) else {
            errors.push(ValidationErrorV01::new(format!(
                "{label} missing artifact for {target_label}"
            )));
            continue;
        };

        if artifact.target != target {
            errors.push(ValidationErrorV01::new(format!(
                "{label} {target_label} target must match map key"
            )));
        }
        if artifact.support_tier != support_tier_for_target(target) {
            errors.push(ValidationErrorV01::new(format!(
                "{label} {target_label} supportTier does not match target release tier"
            )));
        }
        if artifact.kind != expected_kind {
            errors.push(ValidationErrorV01::new(format!(
                "{label} {target_label} kind does not match artifact set"
            )));
        }
        if artifact.version != train_version {
            errors.push(ValidationErrorV01::new(format!(
                "{label} {target_label} version must be {train_version}"
            )));
        }
        validate_checksum(errors, &artifact.checksum);
    }
}

fn release_train_artifacts(manifest: &ReleaseTrainManifestV01) -> Vec<&ReleaseTrainArtifactV01> {
    manifest
        .components
        .runtime
        .binaries
        .values()
        .chain(manifest.components.studio.desktop_packages.values())
        .chain(manifest.components.studio.runtime_sidecars.values())
        .collect()
}

fn artifact_index<'a>(
    errors: &mut Vec<ValidationErrorV01>,
    manifest: &'a ReleaseTrainManifestV01,
) -> HashMap<&'a str, &'a ReleaseTrainArtifactV01> {
    let mut seen = HashSet::new();
    let mut artifacts = HashMap::new();

    for artifact in release_train_artifacts(manifest) {
        if artifact.id.is_empty() {
            errors.push(ValidationErrorV01::new("artifact id must not be empty"));
            continue;
        }
        if !seen.insert(artifact.id.as_str()) {
            errors.push(ValidationErrorV01::new(format!(
                "duplicate artifact id: {}",
                artifact.id
            )));
        }
        artifacts.insert(artifact.id.as_str(), artifact);
    }

    artifacts
}

fn validate_artifact_id(
    errors: &mut Vec<ValidationErrorV01>,
    artifacts: &HashMap<&str, &ReleaseTrainArtifactV01>,
    label: &str,
    artifact_id: &str,
) {
    if !artifacts.contains_key(artifact_id) {
        errors.push(ValidationErrorV01::new(format!(
            "{label} references unknown artifact {artifact_id}"
        )));
    }
}

fn validate_artifact_collection_gate(
    errors: &mut Vec<ValidationErrorV01>,
    artifacts: &HashMap<&str, &ReleaseTrainArtifactV01>,
    gate: &ReleaseTrainArtifactCollectionGateV01,
    label: &str,
) {
    if gate.artifact_ids.is_empty() {
        errors.push(ValidationErrorV01::new(format!(
            "{label} artifactIds must not be empty"
        )));
    }
    for artifact_id in &gate.artifact_ids {
        validate_artifact_id(errors, artifacts, label, artifact_id);
    }
}

fn validate_runtime_smoke_gates(
    errors: &mut Vec<ValidationErrorV01>,
    manifest: &ReleaseTrainManifestV01,
    artifacts: &HashMap<&str, &ReleaseTrainArtifactV01>,
) {
    for target in RELEASE_TRAIN_TARGETS_V01 {
        let target_label = target.as_str();
        let Some(gate) = manifest.release_gates.runtime_smoke.get(&target) else {
            errors.push(ValidationErrorV01::new(format!(
                "runtimeSmoke missing gate for {target_label}"
            )));
            continue;
        };
        if gate.target != target {
            errors.push(ValidationErrorV01::new(format!(
                "runtimeSmoke {target_label} target must match map key"
            )));
        }
        validate_artifact_id(errors, artifacts, "runtimeSmoke", &gate.artifact_id);
        if let Some(runtime_artifact) = manifest.components.runtime.binaries.get(&target) {
            if gate.artifact_id != runtime_artifact.id {
                errors.push(ValidationErrorV01::new(format!(
                    "runtimeSmoke {target_label} artifactId must match runtime binary"
                )));
            }
        }
    }
}

fn validate_studio_smoke_gates(
    errors: &mut Vec<ValidationErrorV01>,
    manifest: &ReleaseTrainManifestV01,
    artifacts: &HashMap<&str, &ReleaseTrainArtifactV01>,
) {
    for target in RELEASE_TRAIN_TARGETS_V01 {
        let target_label = target.as_str();
        let Some(gate) = manifest.release_gates.studio_package_smoke.get(&target) else {
            errors.push(ValidationErrorV01::new(format!(
                "studioPackageSmoke missing gate for {target_label}"
            )));
            continue;
        };
        if gate.target != target {
            errors.push(ValidationErrorV01::new(format!(
                "studioPackageSmoke {target_label} target must match map key"
            )));
        }
        validate_artifact_id(
            errors,
            artifacts,
            "studioPackageSmoke desktopPackageArtifactId",
            &gate.desktop_package_artifact_id,
        );
        validate_artifact_id(
            errors,
            artifacts,
            "studioPackageSmoke runtimeSidecarArtifactId",
            &gate.runtime_sidecar_artifact_id,
        );

        if let Some(desktop_artifact) = manifest.components.studio.desktop_packages.get(&target) {
            if gate.desktop_package_artifact_id != desktop_artifact.id {
                errors.push(ValidationErrorV01::new(format!(
                    "studioPackageSmoke {target_label} desktopPackageArtifactId must match desktop package"
                )));
            }
        }
        if let Some(sidecar_artifact) = manifest.components.studio.runtime_sidecars.get(&target) {
            if gate.runtime_sidecar_artifact_id != sidecar_artifact.id {
                errors.push(ValidationErrorV01::new(format!(
                    "studioPackageSmoke {target_label} runtimeSidecarArtifactId must match runtime sidecar"
                )));
            }
        }
    }
}

fn validate_checksum_gate(
    errors: &mut Vec<ValidationErrorV01>,
    manifest: &ReleaseTrainManifestV01,
    artifacts: &HashMap<&str, &ReleaseTrainArtifactV01>,
) {
    let gate = &manifest.release_gates.checksum_verification;
    if gate.artifact_ids.is_empty() {
        errors.push(ValidationErrorV01::new(
            "checksumVerification artifactIds must not be empty",
        ));
    }
    for artifact_id in &gate.artifact_ids {
        validate_artifact_id(errors, artifacts, "checksumVerification", artifact_id);
    }
    for (artifact_id, expected_checksum) in &gate.expected_checksums {
        let Some(artifact) = artifacts.get(artifact_id.as_str()) else {
            errors.push(ValidationErrorV01::new(format!(
                "checksum gate references unknown artifact {artifact_id}"
            )));
            continue;
        };
        validate_checksum(errors, expected_checksum);
        if artifact.checksum.algorithm != expected_checksum.algorithm {
            errors.push(ValidationErrorV01::new(format!(
                "checksum gate algorithm must match artifact {artifact_id}"
            )));
        }
        match (&artifact.checksum.value, &expected_checksum.value) {
            (Some(actual), Some(expected)) if actual != expected => {
                errors.push(ValidationErrorV01::new(format!(
                    "checksum gate value must match artifact {artifact_id}"
                )));
            }
            (None, Some(_)) => {
                errors.push(ValidationErrorV01::new(format!(
                    "artifact {artifact_id} checksum value must be populated before checksum gate can pin it"
                )));
            }
            _ => {}
        }
    }
}

fn validate_protocol_baselines(
    errors: &mut Vec<ValidationErrorV01>,
    protocol: &ReleaseTrainProtocolBaselinesV01,
) {
    let expected = [
        ("graph", protocol.graph.as_str(), "0.1"),
        ("project", protocol.project.as_str(), "0.1"),
        ("node", protocol.node.as_str(), "0.1"),
        ("extension", protocol.extension.as_str(), "0.1"),
        ("runtimeHttp", protocol.runtime_http.as_str(), "v0"),
        (
            "runtimeCollaboration",
            protocol.runtime_collaboration.as_str(),
            "v0",
        ),
    ];

    for (label, actual, expected_value) in expected {
        if actual != expected_value {
            errors.push(ValidationErrorV01::new(format!(
                "protocolBaselines {label} must be {expected_value}"
            )));
        }
    }
}

fn validate_connection_profiles(
    errors: &mut Vec<ValidationErrorV01>,
    profiles: &[ReleaseTrainConnectionProfileV01],
    label: &str,
) {
    let expected = HashSet::from([
        ReleaseTrainConnectionProfileV01::LocalManaged,
        ReleaseTrainConnectionProfileV01::LocalShared,
        ReleaseTrainConnectionProfileV01::Remote,
    ]);
    let actual: HashSet<ReleaseTrainConnectionProfileV01> = profiles.iter().copied().collect();
    if actual != expected || profiles.len() != expected.len() {
        errors.push(ValidationErrorV01::new(format!(
            "{label} connectionProfiles must include local-managed, local-shared, and remote"
        )));
    }
}

fn require_capability(errors: &mut Vec<ValidationErrorV01>, enabled: bool, label: &str) {
    if !enabled {
        errors.push(ValidationErrorV01::new(format!(
            "capabilitySet {label} must be enabled"
        )));
    }
}

fn validate_capability_set(
    errors: &mut Vec<ValidationErrorV01>,
    manifest: &ReleaseTrainManifestV01,
) {
    if manifest.capability_set.protocol_surfaces != manifest.protocol_baselines {
        errors.push(ValidationErrorV01::new(
            "capabilitySet protocolSurfaces must match protocolBaselines",
        ));
    }

    let runtime = &manifest.capability_set.runtime;
    require_capability(
        errors,
        runtime.session_addressing,
        "runtime.sessionAddressing",
    );
    require_capability(errors, runtime.event_replay, "runtime.eventReplay");
    require_capability(errors, runtime.multi_window, "runtime.multiWindow");
    require_capability(errors, runtime.operation_log, "runtime.operationLog");
    validate_connection_profiles(errors, &runtime.connection_profiles, "runtime");
    if runtime.collaboration != "server-authoritative-ot" {
        errors.push(ValidationErrorV01::new(
            "capabilitySet runtime.collaboration must be server-authoritative-ot",
        ));
    }
    if runtime.io_discovery != "raw-descriptor" {
        errors.push(ValidationErrorV01::new(
            "capabilitySet runtime.ioDiscovery must be raw-descriptor",
        ));
    }
    if runtime.auth_policy != "deferred" {
        errors.push(ValidationErrorV01::new(
            "capabilitySet runtime.authPolicy must be deferred",
        ));
    }

    let studio = &manifest.capability_set.studio;
    require_capability(errors, studio.graph_editor, "studio.graphEditor");
    require_capability(errors, studio.patch_library, "studio.patchLibrary");
    require_capability(errors, studio.subpatches, "studio.subpatches");
    require_capability(errors, studio.living_help, "studio.livingHelp");
    require_capability(errors, studio.graph_clipboard, "studio.graphClipboard");
    validate_connection_profiles(errors, &studio.connection_profiles, "studio");
    if studio.desktop_shell != "tauri" {
        errors.push(ValidationErrorV01::new(
            "capabilitySet studio.desktopShell must be tauri",
        ));
    }

    let marketplace = &manifest.capability_set.marketplace;
    require_capability(
        errors,
        marketplace.package_discovery,
        "marketplace.packageDiscovery",
    );
    require_capability(
        errors,
        marketplace.package_install,
        "marketplace.packageInstall",
    );
    require_capability(
        errors,
        marketplace.package_update,
        "marketplace.packageUpdate",
    );
    require_capability(
        errors,
        marketplace.extension_packages,
        "marketplace.extensionPackages",
    );

    let manual = &manifest.capability_set.manual;
    require_capability(errors, manual.versioned_paths, "manual.versionedPaths");
    require_capability(errors, manual.pages_deployment, "manual.pagesDeployment");
    require_capability(
        errors,
        manual.latest_promotion_requires_matrix,
        "manual.latestPromotionRequiresMatrix",
    );
    require_capability(
        errors,
        manual.patch_releases_use_major_minor_path,
        "manual.patchReleasesUseMajorMinorPath",
    );
}

fn validate_registry_package_gate(
    errors: &mut Vec<ValidationErrorV01>,
    label: &str,
    gate: &ReleaseTrainRegistryPackageGateV01,
    package: &ReleaseTrainRegistryPackageV01,
) {
    if gate.package.ecosystem != package.ecosystem
        || gate.package.name != package.name
        || gate.package.version != package.version
    {
        errors.push(ValidationErrorV01::new(format!(
            "registryPackages {label} package must match component package"
        )));
    }
}

pub fn validate_release_train_manifest_v01(
    manifest: &ReleaseTrainManifestV01,
) -> Result<(), ValidationReportV01> {
    let mut errors = Vec::new();

    if manifest.schema != "skenion.release-train" {
        errors.push(ValidationErrorV01::new(format!(
            "expected schema skenion.release-train, found {}",
            manifest.schema
        )));
    }
    if manifest.schema_version != "0.1.0" {
        errors.push(ValidationErrorV01::new(format!(
            "expected schemaVersion 0.1.0, found {}",
            manifest.schema_version
        )));
    }
    if !is_numeric_version(&manifest.train_id, 2) {
        errors.push(ValidationErrorV01::new(
            "trainId must be a major.minor numeric version",
        ));
    }
    if !is_numeric_version(&manifest.train_version, 3) {
        errors.push(ValidationErrorV01::new(
            "trainVersion must be a major.minor.patch numeric version",
        ));
    }
    if !manifest
        .train_version
        .starts_with(&format!("{}.", manifest.train_id))
    {
        errors.push(ValidationErrorV01::new(
            "trainVersion must match trainId major.minor",
        ));
    }

    validate_protocol_baselines(&mut errors, &manifest.protocol_baselines);
    validate_capability_set(&mut errors, manifest);

    validate_package_version(
        &mut errors,
        "contracts npm",
        &manifest.components.contracts.npm,
        &manifest.train_version,
    );
    validate_package_version(
        &mut errors,
        "contracts crate",
        &manifest.components.contracts.crate_package,
        &manifest.train_version,
    );
    validate_package_version(
        &mut errors,
        "runtime crate",
        &manifest.components.runtime.crate_package,
        &manifest.train_version,
    );
    validate_package_version(
        &mut errors,
        "sdk npm",
        &manifest.components.sdk.npm,
        &manifest.train_version,
    );
    validate_package_version(
        &mut errors,
        "studio web",
        &manifest.components.studio.web,
        &manifest.train_version,
    );
    validate_package_version(
        &mut errors,
        "studio desktop",
        &manifest.components.studio.desktop,
        &manifest.train_version,
    );

    validate_artifact_map(
        &mut errors,
        "runtime binary",
        &manifest.components.runtime.binaries,
        ReleaseTrainArtifactKindV01::RuntimeBinary,
        &manifest.train_version,
    );
    validate_artifact_map(
        &mut errors,
        "studio desktop package",
        &manifest.components.studio.desktop_packages,
        ReleaseTrainArtifactKindV01::StudioDesktopPackage,
        &manifest.train_version,
    );
    validate_artifact_map(
        &mut errors,
        "studio runtimeSidecars",
        &manifest.components.studio.runtime_sidecars,
        ReleaseTrainArtifactKindV01::StudioRuntimeSidecar,
        &manifest.train_version,
    );

    if manifest.components.examples.version != manifest.train_version {
        errors.push(ValidationErrorV01::new(format!(
            "examples version must be {}",
            manifest.train_version
        )));
    }
    if manifest.components.docs.manual.version != manifest.train_version {
        errors.push(ValidationErrorV01::new(format!(
            "docs manual version must be {}",
            manifest.train_version
        )));
    }
    let expected_manual_path = format!("/manual/{}/", manifest.train_id);
    if manifest.components.docs.manual.path != expected_manual_path {
        errors.push(ValidationErrorV01::new(format!(
            "docs manual path must be {expected_manual_path}"
        )));
    }

    let artifacts = artifact_index(&mut errors, manifest);
    validate_artifact_collection_gate(
        &mut errors,
        &artifacts,
        &manifest.release_gates.github_release_assets.runtime,
        "githubReleaseAssets runtime",
    );
    validate_artifact_collection_gate(
        &mut errors,
        &artifacts,
        &manifest.release_gates.github_release_assets.studio,
        "githubReleaseAssets studio",
    );
    validate_runtime_smoke_gates(&mut errors, manifest, &artifacts);
    validate_studio_smoke_gates(&mut errors, manifest, &artifacts);
    validate_checksum_gate(&mut errors, manifest, &artifacts);

    validate_registry_package_gate(
        &mut errors,
        "contractsNpm",
        &manifest.release_gates.registry_packages.contracts_npm,
        &manifest.components.contracts.npm,
    );
    validate_registry_package_gate(
        &mut errors,
        "contractsCrate",
        &manifest.release_gates.registry_packages.contracts_crate,
        &manifest.components.contracts.crate_package,
    );
    validate_registry_package_gate(
        &mut errors,
        "runtimeCrate",
        &manifest.release_gates.registry_packages.runtime_crate,
        &manifest.components.runtime.crate_package,
    );
    validate_registry_package_gate(
        &mut errors,
        "sdkNpm",
        &manifest.release_gates.registry_packages.sdk_npm,
        &manifest.components.sdk.npm,
    );
    validate_registry_package_gate(
        &mut errors,
        "studioWeb",
        &manifest.release_gates.registry_packages.studio_web,
        &manifest.components.studio.web,
    );
    validate_registry_package_gate(
        &mut errors,
        "studioDesktop",
        &manifest.release_gates.registry_packages.studio_desktop,
        &manifest.components.studio.desktop,
    );

    let examples_gate = &manifest.release_gates.examples_conformance;
    if examples_gate.repository != manifest.components.examples.repository {
        errors.push(ValidationErrorV01::new(
            "examples conformance gate repository must match examples repository",
        ));
    }
    if examples_gate.version != manifest.components.examples.version {
        errors.push(ValidationErrorV01::new(
            "examples conformance gate version must match examples version",
        ));
    }
    if examples_gate.ref_name != manifest.components.examples.tag {
        errors.push(ValidationErrorV01::new(
            "examples conformance gate ref must match examples tag",
        ));
    }

    let docs_gate = &manifest.release_gates.docs_pages_deployment;
    if docs_gate.manual_version != manifest.components.docs.manual.version {
        errors.push(ValidationErrorV01::new(
            "docs Pages gate manualVersion must match docs manual version",
        ));
    }
    if docs_gate.manual_path != manifest.components.docs.manual.path {
        errors.push(ValidationErrorV01::new(
            "docs Pages gate manualPath must match docs manual path",
        ));
    }
    if docs_gate.pages_url != manifest.components.docs.manual.pages_url {
        errors.push(ValidationErrorV01::new(
            "docs Pages gate pagesUrl must match docs manual pagesUrl",
        ));
    }

    if errors.is_empty() {
        Ok(())
    } else {
        Err(ValidationReportV01::new(errors))
    }
}
