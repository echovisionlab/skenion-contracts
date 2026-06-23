use std::collections::{BTreeMap, HashMap, HashSet};

use serde::{Deserialize, Serialize};

use super::{
    ReleaseTrainArtifactKindV01, ReleaseTrainChecksumAlgorithmV01, ReleaseTrainPackageEcosystemV01,
    ReleaseTrainProtocolBaselinesV01, ReleaseTrainTargetV01, ValidationErrorV01,
    ValidationReportV01, derive_v0_compatibility_line, derive_v0_compatibility_range,
    satisfies_v0_compatibility_range,
};

pub type CompatibilityMatrixTargetV01 = ReleaseTrainTargetV01;
pub type CompatibilityMatrixArtifactKindV01 = ReleaseTrainArtifactKindV01;
pub type CompatibilityMatrixPackageEcosystemV01 = ReleaseTrainPackageEcosystemV01;
pub type CompatibilityMatrixChecksumAlgorithmV01 = ReleaseTrainChecksumAlgorithmV01;
pub type CompatibilityMatrixProtocolBaselinesV01 = ReleaseTrainProtocolBaselinesV01;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum CompatibilityMatrixPromotionStateV01 {
    Draft,
    Candidate,
    Promoted,
    Rejected,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum CompatibilityMatrixConformanceStatusV01 {
    Pending,
    Passed,
    Failed,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "kebab-case")]
pub struct CompatibilityMatrixChecksumV01 {
    pub algorithm: CompatibilityMatrixChecksumAlgorithmV01,
    pub value: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "kebab-case")]
pub struct CompatibilityMatrixGithubReleaseAssetSourceV01 {
    pub kind: String,
    pub repository: String,
    pub tag: String,
    pub asset_name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "kebab-case")]
pub struct CompatibilityMatrixArtifactV01 {
    pub id: String,
    pub target: CompatibilityMatrixTargetV01,
    pub kind: CompatibilityMatrixArtifactKindV01,
    pub name: String,
    pub version: String,
    pub source: CompatibilityMatrixGithubReleaseAssetSourceV01,
    pub checksum: CompatibilityMatrixChecksumV01,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub size_bytes: Option<u64>,
}

pub type CompatibilityMatrixTargetArtifactMapV01 =
    BTreeMap<CompatibilityMatrixTargetV01, CompatibilityMatrixArtifactV01>;

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "kebab-case")]
pub struct CompatibilityMatrixRegistryPackageV01 {
    pub ecosystem: CompatibilityMatrixPackageEcosystemV01,
    pub name: String,
    pub version: String,
    pub tag: String,
    pub commit: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "kebab-case")]
pub struct CompatibilityMatrixCapabilitySetV01 {
    pub runtime: Vec<String>,
    pub studio: Vec<String>,
    pub marketplace: Vec<String>,
    pub docs: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "kebab-case")]
pub struct CompatibilityMatrixContractsComponentV01 {
    pub npm: CompatibilityMatrixRegistryPackageV01,
    #[serde(rename = "crate")]
    pub crate_package: CompatibilityMatrixRegistryPackageV01,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "kebab-case")]
pub struct CompatibilityMatrixRuntimeComponentV01 {
    pub version: String,
    pub assets: CompatibilityMatrixTargetArtifactMapV01,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "kebab-case")]
pub struct CompatibilityMatrixSdkComponentV01 {
    pub npm: CompatibilityMatrixRegistryPackageV01,
    pub supported_contracts_range: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "kebab-case")]
pub struct CompatibilityMatrixStudioComponentV01 {
    pub version: String,
    pub web_assets: Vec<CompatibilityMatrixArtifactV01>,
    pub desktop_assets: CompatibilityMatrixTargetArtifactMapV01,
    pub runtime_sidecars: CompatibilityMatrixTargetArtifactMapV01,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "kebab-case")]
pub struct CompatibilityMatrixExamplesComponentV01 {
    pub repository: String,
    #[serde(rename = "ref")]
    pub ref_name: String,
    pub commit: String,
    pub conformance_status: CompatibilityMatrixConformanceStatusV01,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub evidence_url: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "kebab-case")]
pub struct CompatibilityMatrixManualComponentV01 {
    pub version: String,
    pub path: String,
    pub pages_url: String,
    pub pages_deployed: bool,
    pub promoted_latest: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub evidence_url: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "kebab-case")]
pub struct CompatibilityMatrixDocsComponentV01 {
    pub manual: CompatibilityMatrixManualComponentV01,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "kebab-case")]
pub struct CompatibilityMatrixComponentsV01 {
    pub contracts: CompatibilityMatrixContractsComponentV01,
    pub runtime: CompatibilityMatrixRuntimeComponentV01,
    pub sdk: CompatibilityMatrixSdkComponentV01,
    pub studio: CompatibilityMatrixStudioComponentV01,
    pub examples: CompatibilityMatrixExamplesComponentV01,
    pub docs: CompatibilityMatrixDocsComponentV01,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "kebab-case")]
pub struct CompatibilityMatrixVerificationV01 {
    pub expected_checksums: BTreeMap<String, CompatibilityMatrixChecksumV01>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "kebab-case")]
pub struct CompatibilityMatrixPromotionV01 {
    pub state: CompatibilityMatrixPromotionStateV01,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub promoted_at: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub promoted_by: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub evidence_url: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "kebab-case")]
pub struct CompatibilityMatrixV01 {
    pub schema: String,
    pub schema_version: String,
    pub matrix_id: String,
    pub contracts_line: String,
    pub contracts_range: String,
    pub protocol_baselines: CompatibilityMatrixProtocolBaselinesV01,
    pub capabilities: CompatibilityMatrixCapabilitySetV01,
    pub components: CompatibilityMatrixComponentsV01,
    pub verification: CompatibilityMatrixVerificationV01,
    pub promotion: CompatibilityMatrixPromotionV01,
}

const COMPATIBILITY_MATRIX_TARGETS_V01: [CompatibilityMatrixTargetV01; 6] = [
    ReleaseTrainTargetV01::Aarch64AppleDarwin,
    ReleaseTrainTargetV01::X8664AppleDarwin,
    ReleaseTrainTargetV01::X8664PcWindowsMsvc,
    ReleaseTrainTargetV01::Aarch64PcWindowsMsvc,
    ReleaseTrainTargetV01::X8664UnknownLinuxGnu,
    ReleaseTrainTargetV01::Aarch64UnknownLinuxGnu,
];

fn is_sha256_hex(value: &str) -> bool {
    value.len() == 64 && value.bytes().all(|byte| byte.is_ascii_hexdigit())
}

fn validate_checksum(
    errors: &mut Vec<ValidationErrorV01>,
    label: &str,
    checksum: &CompatibilityMatrixChecksumV01,
) {
    if let Some(value) = &checksum.value
        && !is_sha256_hex(value)
    {
        errors.push(ValidationErrorV01::new(format!(
            "{label} checksum value must be a 64 character sha256 hex digest"
        )));
    }
}

fn validate_target_artifact_map(
    errors: &mut Vec<ValidationErrorV01>,
    artifacts: &CompatibilityMatrixTargetArtifactMapV01,
    label: &str,
    expected_kind: CompatibilityMatrixArtifactKindV01,
) {
    for target in COMPATIBILITY_MATRIX_TARGETS_V01 {
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
        if artifact.kind != expected_kind {
            errors.push(ValidationErrorV01::new(format!(
                "{label} {target_label} kind does not match artifact set"
            )));
        }
        validate_checksum(
            errors,
            &format!("{label} {target_label}"),
            &artifact.checksum,
        );
    }
}

fn insert_artifact_ref<'a>(
    errors: &mut Vec<ValidationErrorV01>,
    artifacts: &mut HashMap<&'a str, &'a CompatibilityMatrixArtifactV01>,
    seen: &mut HashSet<&'a str>,
    artifact: &'a CompatibilityMatrixArtifactV01,
) {
    if !seen.insert(artifact.id.as_str()) {
        errors.push(ValidationErrorV01::new(format!(
            "duplicate compatibility matrix artifact id: {}",
            artifact.id
        )));
    }
    artifacts.insert(artifact.id.as_str(), artifact);
}

fn artifact_index<'a>(
    errors: &mut Vec<ValidationErrorV01>,
    matrix: &'a CompatibilityMatrixV01,
) -> HashMap<&'a str, &'a CompatibilityMatrixArtifactV01> {
    let mut artifacts = HashMap::new();
    let mut seen = HashSet::new();

    for artifact in matrix
        .components
        .runtime
        .assets
        .values()
        .chain(matrix.components.studio.web_assets.iter())
        .chain(matrix.components.studio.desktop_assets.values())
        .chain(matrix.components.studio.runtime_sidecars.values())
    {
        insert_artifact_ref(errors, &mut artifacts, &mut seen, artifact);
    }

    artifacts
}

fn validate_expected_checksums(
    errors: &mut Vec<ValidationErrorV01>,
    matrix: &CompatibilityMatrixV01,
    artifacts: &HashMap<&str, &CompatibilityMatrixArtifactV01>,
) {
    for (artifact_id, expected_checksum) in &matrix.verification.expected_checksums {
        validate_checksum(errors, "verification expected-checksums", expected_checksum);
        let Some(artifact) = artifacts.get(artifact_id.as_str()) else {
            errors.push(ValidationErrorV01::new(format!(
                "verification expected-checksums references unknown artifact {artifact_id}"
            )));
            continue;
        };
        match (&artifact.checksum.value, &expected_checksum.value) {
            (Some(actual), Some(expected)) if actual != expected => {
                errors.push(ValidationErrorV01::new(format!(
                    "verification checksum value must match artifact {artifact_id}"
                )));
            }
            (None, Some(_)) => {
                errors.push(ValidationErrorV01::new(format!(
                    "artifact {artifact_id} checksum value must be populated before verification can pin it"
                )));
            }
            _ => {}
        }
    }
}

pub fn validate_compatibility_matrix_v01(
    matrix: &CompatibilityMatrixV01,
) -> Result<(), ValidationReportV01> {
    let mut errors = Vec::new();

    if matrix.schema != "skenion.compatibility-matrix" {
        errors.push(ValidationErrorV01::new(format!(
            "expected schema skenion.compatibility-matrix, found {}",
            matrix.schema
        )));
    }
    if matrix.schema_version != "0.1.0" {
        errors.push(ValidationErrorV01::new(format!(
            "expected schema-version 0.1.0, found {}",
            matrix.schema_version
        )));
    }

    let contracts_npm = &matrix.components.contracts.npm;
    let contracts_crate = &matrix.components.contracts.crate_package;
    if contracts_npm.ecosystem != ReleaseTrainPackageEcosystemV01::Npm
        || contracts_npm.name != "@skenion/contracts"
    {
        errors.push(ValidationErrorV01::new(
            "components.contracts.npm must identify @skenion/contracts on npm",
        ));
    }
    if contracts_crate.ecosystem != ReleaseTrainPackageEcosystemV01::CratesIo
        || contracts_crate.name != "skenion-contracts"
    {
        errors.push(ValidationErrorV01::new(
            "components.contracts.crate must identify skenion-contracts on crates.io",
        ));
    }
    if matrix.components.sdk.npm.ecosystem != ReleaseTrainPackageEcosystemV01::Npm
        || matrix.components.sdk.npm.name != "@skenion/sdk"
    {
        errors.push(ValidationErrorV01::new(
            "components.sdk.npm must identify @skenion/sdk on npm",
        ));
    }

    let expected_line = derive_v0_compatibility_line(&contracts_npm.version);
    let expected_range = derive_v0_compatibility_range(&contracts_npm.version);
    match expected_line {
        Some(line) if matrix.contracts_line == line => {}
        Some(line) => errors.push(ValidationErrorV01::new(format!(
            "contracts-line must be {line}"
        ))),
        None => errors.push(ValidationErrorV01::new("invalid contracts npm version")),
    }
    match expected_range {
        Some(range) if matrix.contracts_range == range => {}
        Some(range) => errors.push(ValidationErrorV01::new(format!(
            "contracts-range must be {range}"
        ))),
        None => errors.push(ValidationErrorV01::new("invalid contracts npm version")),
    }
    if derive_v0_compatibility_line(&contracts_npm.version)
        != derive_v0_compatibility_line(&contracts_crate.version)
    {
        errors.push(ValidationErrorV01::new(
            "contracts npm and crate versions must be on the same v0 compatibility line",
        ));
    }
    if !satisfies_v0_compatibility_range(
        &contracts_npm.version,
        &matrix.components.sdk.supported_contracts_range,
    ) {
        errors.push(ValidationErrorV01::new(
            "sdk supported-contracts-range must include the Contracts package version",
        ));
    }
    if !satisfies_v0_compatibility_range(&contracts_npm.version, &matrix.contracts_range) {
        errors.push(ValidationErrorV01::new(
            "contracts-range must include the Contracts package version",
        ));
    }

    validate_target_artifact_map(
        &mut errors,
        &matrix.components.runtime.assets,
        "runtime asset",
        ReleaseTrainArtifactKindV01::RuntimeBinary,
    );
    validate_target_artifact_map(
        &mut errors,
        &matrix.components.studio.desktop_assets,
        "studio desktop asset",
        ReleaseTrainArtifactKindV01::StudioDesktopPackage,
    );
    validate_target_artifact_map(
        &mut errors,
        &matrix.components.studio.runtime_sidecars,
        "studio runtime sidecar",
        ReleaseTrainArtifactKindV01::StudioRuntimeSidecar,
    );
    for artifact in &matrix.components.studio.web_assets {
        if artifact.kind != ReleaseTrainArtifactKindV01::StudioWebBundle {
            errors.push(ValidationErrorV01::new(format!(
                "studio web asset {} kind must be studio-web-bundle",
                artifact.id
            )));
        }
        validate_checksum(&mut errors, "studio web asset", &artifact.checksum);
    }

    let artifacts = artifact_index(&mut errors, matrix);
    validate_expected_checksums(&mut errors, matrix, &artifacts);

    if matrix.promotion.state == CompatibilityMatrixPromotionStateV01::Promoted {
        if matrix.components.examples.conformance_status
            != CompatibilityMatrixConformanceStatusV01::Passed
        {
            errors.push(ValidationErrorV01::new(
                "promoted compatibility matrix requires passed examples conformance",
            ));
        }
        if !matrix.components.docs.manual.pages_deployed {
            errors.push(ValidationErrorV01::new(
                "promoted compatibility matrix requires deployed docs Pages manual",
            ));
        }
        if !matrix.components.docs.manual.promoted_latest {
            errors.push(ValidationErrorV01::new(
                "promoted compatibility matrix requires docs manual promoted latest",
            ));
        }
        for artifact in artifacts.values() {
            if artifact.checksum.value.is_none() {
                errors.push(ValidationErrorV01::new(format!(
                    "promoted compatibility matrix requires checksum for artifact {}",
                    artifact.id
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

#[cfg(test)]
mod tests {
    use std::collections::BTreeMap;

    use super::super::{
        CONTRACTS_COMPATIBILITY_LINE, CONTRACTS_COMPATIBILITY_RANGE, CONTRACTS_PACKAGE_VERSION,
    };
    use super::*;

    fn sha256_value(digit: char) -> String {
        std::iter::repeat_n(digit, 64).collect()
    }

    fn checksum(digit: char) -> CompatibilityMatrixChecksumV01 {
        CompatibilityMatrixChecksumV01 {
            algorithm: ReleaseTrainChecksumAlgorithmV01::Sha256,
            value: Some(sha256_value(digit)),
        }
    }

    fn package(
        ecosystem: CompatibilityMatrixPackageEcosystemV01,
        name: &str,
        version: &str,
    ) -> CompatibilityMatrixRegistryPackageV01 {
        CompatibilityMatrixRegistryPackageV01 {
            ecosystem,
            name: name.to_owned(),
            version: version.to_owned(),
            tag: format!("{name}-v{version}"),
            commit: "1111111".to_owned(),
            url: None,
        }
    }

    fn source(name: &str, version: &str) -> CompatibilityMatrixGithubReleaseAssetSourceV01 {
        CompatibilityMatrixGithubReleaseAssetSourceV01 {
            kind: "github-release-asset".to_owned(),
            repository: "skenion/example".to_owned(),
            tag: format!("{name}-v{version}"),
            asset_name: format!("{name}-v{version}.tar.gz"),
            url: None,
        }
    }

    fn artifact(
        prefix: &str,
        target: CompatibilityMatrixTargetV01,
        kind: CompatibilityMatrixArtifactKindV01,
        version: &str,
        digest_digit: char,
    ) -> CompatibilityMatrixArtifactV01 {
        let target_label = target.as_str();
        let id = format!("{prefix}-{target_label}");

        CompatibilityMatrixArtifactV01 {
            id,
            target,
            kind,
            name: format!("{prefix}-{target_label}.tar.gz"),
            version: version.to_owned(),
            source: source(prefix, version),
            checksum: checksum(digest_digit),
            size_bytes: Some(1),
        }
    }

    fn target_artifacts(
        prefix: &str,
        kind: CompatibilityMatrixArtifactKindV01,
        version: &str,
        digest_digits: [char; 6],
    ) -> CompatibilityMatrixTargetArtifactMapV01 {
        let mut artifacts = BTreeMap::new();
        for (target, digest_digit) in COMPATIBILITY_MATRIX_TARGETS_V01
            .into_iter()
            .zip(digest_digits)
        {
            artifacts.insert(
                target,
                artifact(prefix, target, kind, version, digest_digit),
            );
        }
        artifacts
    }

    fn next_contracts_line_version() -> String {
        let minor = CONTRACTS_PACKAGE_VERSION
            .split('.')
            .nth(1)
            .expect("package version should have a minor component")
            .parse::<u64>()
            .expect("package minor should be numeric");
        format!("0.{}.0", minor + 1)
    }

    fn valid_matrix() -> CompatibilityMatrixV01 {
        let runtime_version = "0.44.2";
        let studio_version = "0.44.5";
        let docs_version = "0.44.1";
        let runtime_assets = target_artifacts(
            "runtime",
            ReleaseTrainArtifactKindV01::RuntimeBinary,
            runtime_version,
            ['a', 'b', 'c', 'd', 'e', 'f'],
        );
        let desktop_assets = target_artifacts(
            "studio-desktop",
            ReleaseTrainArtifactKindV01::StudioDesktopPackage,
            studio_version,
            ['7', '8', '9', 'a', 'b', 'c'],
        );
        let runtime_sidecars = target_artifacts(
            "studio-sidecar",
            ReleaseTrainArtifactKindV01::StudioRuntimeSidecar,
            runtime_version,
            ['1', '2', '3', '4', '5', '6'],
        );
        let web_asset = artifact(
            "studio-web-bundle",
            ReleaseTrainTargetV01::Aarch64AppleDarwin,
            ReleaseTrainArtifactKindV01::StudioWebBundle,
            studio_version,
            '9',
        );

        let mut expected_checksums = BTreeMap::new();
        for artifact in [
            runtime_assets
                .get(&ReleaseTrainTargetV01::Aarch64AppleDarwin)
                .expect("runtime artifact should exist"),
            &web_asset,
            runtime_sidecars
                .get(&ReleaseTrainTargetV01::Aarch64AppleDarwin)
                .expect("runtime sidecar should exist"),
        ] {
            expected_checksums.insert(artifact.id.clone(), artifact.checksum.clone());
        }

        CompatibilityMatrixV01 {
            schema: "skenion.compatibility-matrix".to_owned(),
            schema_version: "0.1.0".to_owned(),
            matrix_id: format!("M06.9-{CONTRACTS_PACKAGE_VERSION}"),
            contracts_line: CONTRACTS_COMPATIBILITY_LINE.to_owned(),
            contracts_range: CONTRACTS_COMPATIBILITY_RANGE.to_owned(),
            protocol_baselines: CompatibilityMatrixProtocolBaselinesV01 {
                graph: "0.1".to_owned(),
                project: "0.1".to_owned(),
                node: "0.1".to_owned(),
                extension: "0.1".to_owned(),
                runtime_http: "v0".to_owned(),
                runtime_collaboration: "v0".to_owned(),
            },
            capabilities: CompatibilityMatrixCapabilitySetV01 {
                runtime: vec!["server-authoritative-ot".to_owned()],
                studio: vec!["desktop-shell-tauri".to_owned()],
                marketplace: vec!["package-install".to_owned()],
                docs: vec!["versioned-manual".to_owned()],
            },
            components: CompatibilityMatrixComponentsV01 {
                contracts: CompatibilityMatrixContractsComponentV01 {
                    npm: package(
                        ReleaseTrainPackageEcosystemV01::Npm,
                        "@skenion/contracts",
                        CONTRACTS_PACKAGE_VERSION,
                    ),
                    crate_package: package(
                        ReleaseTrainPackageEcosystemV01::CratesIo,
                        "skenion-contracts",
                        CONTRACTS_PACKAGE_VERSION,
                    ),
                },
                runtime: CompatibilityMatrixRuntimeComponentV01 {
                    version: runtime_version.to_owned(),
                    assets: runtime_assets,
                },
                sdk: CompatibilityMatrixSdkComponentV01 {
                    npm: package(
                        ReleaseTrainPackageEcosystemV01::Npm,
                        "@skenion/sdk",
                        "0.17.0",
                    ),
                    supported_contracts_range: CONTRACTS_COMPATIBILITY_RANGE.to_owned(),
                },
                studio: CompatibilityMatrixStudioComponentV01 {
                    version: studio_version.to_owned(),
                    web_assets: vec![web_asset],
                    desktop_assets,
                    runtime_sidecars,
                },
                examples: CompatibilityMatrixExamplesComponentV01 {
                    repository: "skenion/skenion-examples".to_owned(),
                    ref_name: "skenion-examples-v0.44.1".to_owned(),
                    commit: "3333333".to_owned(),
                    conformance_status: CompatibilityMatrixConformanceStatusV01::Passed,
                    evidence_url: Some(
                        "https://github.com/skenion/skenion-examples/actions/runs/1".to_owned(),
                    ),
                },
                docs: CompatibilityMatrixDocsComponentV01 {
                    manual: CompatibilityMatrixManualComponentV01 {
                        version: docs_version.to_owned(),
                        path: "/manual/0.44/".to_owned(),
                        pages_url: "https://skenion.github.io/skenion-docs/manual/0.44/".to_owned(),
                        pages_deployed: true,
                        promoted_latest: true,
                        evidence_url: Some(
                            "https://github.com/skenion/skenion-docs/actions/runs/1".to_owned(),
                        ),
                    },
                },
            },
            verification: CompatibilityMatrixVerificationV01 { expected_checksums },
            promotion: CompatibilityMatrixPromotionV01 {
                state: CompatibilityMatrixPromotionStateV01::Promoted,
                promoted_at: Some("2026-06-23T00:00:00.000Z".to_owned()),
                promoted_by: Some("release-train".to_owned()),
                evidence_url: None,
            },
        }
    }

    fn validation_messages(matrix: &CompatibilityMatrixV01) -> Vec<String> {
        validate_compatibility_matrix_v01(matrix)
            .expect_err("matrix should fail validation")
            .errors()
            .iter()
            .map(|error| error.message.clone())
            .collect()
    }

    fn assert_has_message(messages: &[String], needle: &str) {
        assert!(
            messages.iter().any(|message| message.contains(needle)),
            "expected validation message containing {needle:?}, found {messages:#?}"
        );
    }

    #[test]
    fn validates_current_package_compatibility_matrix() {
        let matrix = valid_matrix();

        validate_compatibility_matrix_v01(&matrix)
            .expect("current package-derived matrix should validate");
        assert_eq!(
            matrix.components.contracts.npm.version,
            CONTRACTS_PACKAGE_VERSION
        );
        assert_eq!(matrix.contracts_line, CONTRACTS_COMPATIBILITY_LINE);
        assert_eq!(matrix.contracts_range, CONTRACTS_COMPATIBILITY_RANGE);
    }

    #[test]
    fn validates_draft_matrix_without_promotion_evidence() {
        let mut matrix = valid_matrix();
        matrix.promotion.state = CompatibilityMatrixPromotionStateV01::Draft;
        matrix.promotion.promoted_at = None;
        matrix.promotion.promoted_by = None;
        matrix.components.examples.conformance_status =
            CompatibilityMatrixConformanceStatusV01::Pending;
        matrix.components.docs.manual.pages_deployed = false;
        matrix.components.docs.manual.promoted_latest = false;
        matrix.verification.expected_checksums.clear();

        for artifact in matrix.components.runtime.assets.values_mut() {
            artifact.checksum.value = None;
        }
        for artifact in &mut matrix.components.studio.web_assets {
            artifact.checksum.value = None;
        }
        for artifact in matrix.components.studio.desktop_assets.values_mut() {
            artifact.checksum.value = None;
        }
        for artifact in matrix.components.studio.runtime_sidecars.values_mut() {
            artifact.checksum.value = None;
        }

        validate_compatibility_matrix_v01(&matrix)
            .expect("draft matrix should not require promotion evidence");
    }

    #[test]
    fn reports_top_level_component_identity_and_range_errors() {
        let mut matrix = valid_matrix();
        matrix.schema = "wrong.schema".to_owned();
        matrix.schema_version = "9.9.9".to_owned();
        matrix.components.contracts.npm.name = "wrong-contracts".to_owned();
        matrix.components.contracts.crate_package.name = "wrong-crate".to_owned();
        matrix.components.contracts.crate_package.version = next_contracts_line_version();
        matrix.components.sdk.npm.name = "wrong-sdk".to_owned();
        matrix.contracts_line = "0.0".to_owned();
        matrix.contracts_range = ">=0.0.0 <0.1.0".to_owned();

        let messages = validation_messages(&matrix);

        assert_has_message(&messages, "expected schema skenion.compatibility-matrix");
        assert_has_message(&messages, "expected schema-version 0.1.0");
        assert_has_message(&messages, "components.contracts.npm");
        assert_has_message(&messages, "components.contracts.crate");
        assert_has_message(&messages, "components.sdk.npm");
        assert_has_message(&messages, "contracts-line must be");
        assert_has_message(&messages, "contracts-range must be");
        assert_has_message(&messages, "same v0 compatibility line");
        assert_has_message(&messages, "contracts-range must include");
    }

    #[test]
    fn reports_invalid_contracts_package_version() {
        let mut matrix = valid_matrix();
        matrix.components.contracts.npm.version = "1.0.0".to_owned();

        let messages = validation_messages(&matrix);
        let invalid_version_errors = messages
            .iter()
            .filter(|message| message.contains("invalid contracts npm version"))
            .count();

        assert_eq!(invalid_version_errors, 2);
    }

    #[test]
    fn reports_target_artifact_shape_errors() {
        let mut matrix = valid_matrix();
        let artifact = matrix
            .components
            .runtime
            .assets
            .get_mut(&ReleaseTrainTargetV01::Aarch64AppleDarwin)
            .expect("runtime artifact should exist");
        artifact.target = ReleaseTrainTargetV01::X8664AppleDarwin;
        artifact.kind = ReleaseTrainArtifactKindV01::StudioWebBundle;
        artifact.checksum.value = Some("not-a-sha256-digest".to_owned());

        let messages = validation_messages(&matrix);

        assert_has_message(&messages, "target must match map key");
        assert_has_message(&messages, "kind does not match artifact set");
        assert_has_message(&messages, "64 character sha256 hex digest");
    }

    #[test]
    fn reports_web_duplicate_expected_checksum_and_promotion_errors() {
        let mut matrix = valid_matrix();
        matrix.components.studio.web_assets[0].kind = ReleaseTrainArtifactKindV01::RuntimeBinary;
        matrix.components.studio.web_assets[0].checksum.value = None;
        matrix.components.examples.conformance_status =
            CompatibilityMatrixConformanceStatusV01::Failed;

        let duplicate_id = matrix
            .components
            .studio
            .desktop_assets
            .get(&ReleaseTrainTargetV01::X8664AppleDarwin)
            .expect("studio desktop artifact should exist")
            .id
            .clone();
        matrix
            .components
            .studio
            .runtime_sidecars
            .get_mut(&ReleaseTrainTargetV01::X8664AppleDarwin)
            .expect("runtime sidecar should exist")
            .id = duplicate_id;

        let messages = validation_messages(&matrix);

        assert_has_message(&messages, "kind must be studio-web-bundle");
        assert_has_message(&messages, "duplicate compatibility matrix artifact id");
        assert_has_message(&messages, "checksum value must be populated");
        assert_has_message(&messages, "requires passed examples conformance");
        assert_has_message(&messages, "requires checksum for artifact");
    }
}
