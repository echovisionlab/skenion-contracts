use serde::{Deserialize, Serialize};

use super::{NodeDefinitionManifestV01, RuntimeIoTransportKindV01};

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
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
pub enum ExtensionTestKindV01 {
    Node,
    Codec,
    Extension,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
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
#[serde(rename_all = "camelCase")]
pub struct ExtensionNativeBindingV01 {
    pub entrypoint: String,
    pub artifacts: Vec<ExtensionNativeArtifactV01>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExtensionCodecDescriptorV01 {
    pub id: String,
    pub version: String,
    pub transport_kinds: Vec<RuntimeIoTransportKindV01>,
    pub direction: ExtensionCodecDirectionV01,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ExtensionTransportDescriptorV01 {
    pub id: String,
    pub version: String,
    pub kind: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
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
