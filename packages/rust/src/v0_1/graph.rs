use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};

use super::PortV01;

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct GraphDocumentV01 {
    pub schema: String,
    pub schema_version: String,
    pub id: String,
    pub revision: String,
    pub nodes: Vec<GraphNodeV01>,
    pub edges: Vec<EdgeV01>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
#[serde(rename_all = "camelCase")]
pub struct GraphNodeV01 {
    pub id: String,
    pub kind: String,
    pub kind_version: String,
    pub params: Map<String, Value>,
    pub ports: Vec<PortV01>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct PortRefV01 {
    pub node: String,
    pub port: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(deny_unknown_fields)]
pub struct EdgeV01 {
    pub from: PortRefV01,
    pub to: PortRefV01,
}
