use serde::{Deserialize, Serialize};

use super::{ExecutionModelV01, PortV01};

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
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
    pub ports: Vec<PortV01>,
    pub execution: NodeExecutionV01,
    pub state: NodeStateV01,
    pub permissions: Vec<String>,
    pub capabilities: Vec<String>,
}
