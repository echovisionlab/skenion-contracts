use serde::{Deserialize, Serialize};

use super::{
    ValidationErrorV01, ValidationReportV01, derive_v0_compatibility_line,
    derive_v0_compatibility_range, satisfies_v0_compatibility_range,
};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum CompatibilityMatrixPackageEcosystemV01 {
    Npm,
    #[serde(rename = "crates.io")]
    CratesIo,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "kebab-case")]
pub struct CompatibilityMatrixRegistryPackageV01 {
    pub ecosystem: CompatibilityMatrixPackageEcosystemV01,
    pub name: String,
    pub version: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "kebab-case")]
pub struct CompatibilityMatrixProtocolBaselinesV01 {
    pub graph: String,
    pub project: String,
    pub node: String,
    pub extension: String,
    pub runtime_http: String,
    pub runtime_collaboration: String,
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
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "kebab-case")]
pub struct CompatibilityMatrixComponentsV01 {
    pub contracts: CompatibilityMatrixContractsComponentV01,
    pub runtime: CompatibilityMatrixRuntimeComponentV01,
    pub sdk: CompatibilityMatrixSdkComponentV01,
    pub studio: CompatibilityMatrixStudioComponentV01,
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
    pub components: CompatibilityMatrixComponentsV01,
}

fn validate_protocol_baselines(
    errors: &mut Vec<ValidationErrorV01>,
    protocol: &CompatibilityMatrixProtocolBaselinesV01,
) {
    let expected = [
        ("graph", protocol.graph.as_str(), "0.1"),
        ("project", protocol.project.as_str(), "0.1"),
        ("node", protocol.node.as_str(), "0.1"),
        ("extension", protocol.extension.as_str(), "0.1"),
        ("runtime-http", protocol.runtime_http.as_str(), "v0"),
        (
            "runtime-collaboration",
            protocol.runtime_collaboration.as_str(),
            "v0",
        ),
    ];

    for (label, actual, expected) in expected {
        if actual != expected {
            errors.push(ValidationErrorV01::new(format!(
                "protocol-baselines {label} must be {expected}"
            )));
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

    validate_protocol_baselines(&mut errors, &matrix.protocol_baselines);

    let contracts_npm = &matrix.components.contracts.npm;
    let contracts_crate = &matrix.components.contracts.crate_package;
    if contracts_npm.ecosystem != CompatibilityMatrixPackageEcosystemV01::Npm
        || contracts_npm.name != "@skenion/contracts"
    {
        errors.push(ValidationErrorV01::new(
            "components.contracts.npm must identify @skenion/contracts on npm",
        ));
    }
    if contracts_crate.ecosystem != CompatibilityMatrixPackageEcosystemV01::CratesIo
        || contracts_crate.name != "skenion-contracts"
    {
        errors.push(ValidationErrorV01::new(
            "components.contracts.crate must identify skenion-contracts on crates.io",
        ));
    }
    if matrix.components.sdk.npm.ecosystem != CompatibilityMatrixPackageEcosystemV01::Npm
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

    if errors.is_empty() {
        Ok(())
    } else {
        Err(ValidationReportV01::new(errors))
    }
}

#[cfg(test)]
mod tests {
    use super::super::{
        CONTRACTS_COMPATIBILITY_LINE, CONTRACTS_COMPATIBILITY_RANGE, CONTRACTS_PACKAGE_VERSION,
    };
    use super::*;

    fn package(
        ecosystem: CompatibilityMatrixPackageEcosystemV01,
        name: &str,
        version: &str,
    ) -> CompatibilityMatrixRegistryPackageV01 {
        CompatibilityMatrixRegistryPackageV01 {
            ecosystem,
            name: name.to_owned(),
            version: version.to_owned(),
            url: None,
        }
    }

    fn matrix() -> CompatibilityMatrixV01 {
        CompatibilityMatrixV01 {
            schema: "skenion.compatibility-matrix".to_owned(),
            schema_version: "0.1.0".to_owned(),
            matrix_id: "test-matrix".to_owned(),
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
            components: CompatibilityMatrixComponentsV01 {
                contracts: CompatibilityMatrixContractsComponentV01 {
                    npm: package(
                        CompatibilityMatrixPackageEcosystemV01::Npm,
                        "@skenion/contracts",
                        CONTRACTS_PACKAGE_VERSION,
                    ),
                    crate_package: package(
                        CompatibilityMatrixPackageEcosystemV01::CratesIo,
                        "skenion-contracts",
                        CONTRACTS_PACKAGE_VERSION,
                    ),
                },
                runtime: CompatibilityMatrixRuntimeComponentV01 {
                    version: "0.44.2".to_owned(),
                },
                sdk: CompatibilityMatrixSdkComponentV01 {
                    npm: package(
                        CompatibilityMatrixPackageEcosystemV01::Npm,
                        "@skenion/sdk",
                        "0.17.0",
                    ),
                    supported_contracts_range: CONTRACTS_COMPATIBILITY_RANGE.to_owned(),
                },
                studio: CompatibilityMatrixStudioComponentV01 {
                    version: "0.44.5".to_owned(),
                },
            },
        }
    }

    #[test]
    fn validates_dependency_contract_matrix() {
        validate_compatibility_matrix_v01(&matrix()).expect("matrix should validate");
    }

    #[test]
    fn rejects_dependency_contract_mismatches() {
        let mut matrix = matrix();
        matrix.components.contracts.npm.name = "@skenion/not-contracts".to_owned();
        matrix.components.contracts.crate_package.version = "0.99.0".to_owned();
        matrix.components.sdk.supported_contracts_range = ">=0.44.0 <0.45.0".to_owned();

        let report = validate_compatibility_matrix_v01(&matrix)
            .expect_err("matrix should reject dependency mismatches");
        let message = report.to_string();
        assert!(message.contains("@skenion/contracts"));
        assert!(message.contains("same v0 compatibility line"));
        assert!(message.contains("supported-contracts-range"));
    }

    #[test]
    fn rejects_protocol_baseline_mismatch() {
        let mut matrix = matrix();
        matrix.protocol_baselines.runtime_http = "v1".to_owned();

        let report = validate_compatibility_matrix_v01(&matrix)
            .expect_err("matrix should reject protocol baseline mismatch");
        assert!(report.to_string().contains("runtime-http"));
    }
}
