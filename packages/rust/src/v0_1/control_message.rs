use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum ControlAtomV01 {
    #[serde(rename = "float")]
    Float { representation: String, value: f64 },
    #[serde(rename = "int")]
    Int { representation: String, value: i64 },
    #[serde(rename = "uint")]
    Uint { representation: String, value: u64 },
    #[serde(rename = "bool")]
    Bool { value: bool },
    #[serde(rename = "string")]
    String { value: String },
    #[serde(rename = "color")]
    Color {
        representation: String,
        #[serde(rename = "colorSpace")]
        #[serde(skip_serializing_if = "Option::is_none")]
        color_space: Option<String>,
        value: [f64; 4],
    },
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ControlMessageV01 {
    pub selector: String,
    #[serde(default)]
    pub atoms: Vec<ControlAtomV01>,
}

impl ControlMessageV01 {
    pub fn bang() -> Self {
        Self {
            selector: "bang".to_owned(),
            atoms: Vec::new(),
        }
    }

    pub fn set(atoms: Vec<ControlAtomV01>) -> Self {
        Self {
            selector: "set".to_owned(),
            atoms,
        }
    }
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::*;

    #[test]
    fn serializes_bang_as_selector_not_value() {
        assert_eq!(
            serde_json::to_value(ControlMessageV01::bang()).unwrap(),
            json!({ "selector": "bang", "atoms": [] })
        );
    }

    #[test]
    fn serializes_typed_atoms() {
        assert_eq!(
            serde_json::to_value(ControlMessageV01 {
                selector: "set".to_owned(),
                atoms: vec![
                    ControlAtomV01::Int {
                        representation: "i32".to_owned(),
                        value: 1
                    },
                    ControlAtomV01::Uint {
                        representation: "u8".to_owned(),
                        value: 255
                    },
                    ControlAtomV01::String {
                        value: "on".to_owned()
                    },
                    ControlAtomV01::Color {
                        representation: "rgba32f".to_owned(),
                        color_space: Some("linear".to_owned()),
                        value: [1.0, 0.0, 0.5, 1.0]
                    }
                ]
            })
            .unwrap(),
            json!({
                "selector": "set",
                "atoms": [
                    { "type": "int", "representation": "i32", "value": 1 },
                    { "type": "uint", "representation": "u8", "value": 255 },
                    { "type": "string", "value": "on" },
                    { "type": "color", "representation": "rgba32f", "colorSpace": "linear", "value": [1.0, 0.0, 0.5, 1.0] }
                ]
            })
        );
    }

    #[test]
    fn constructs_set_messages() {
        assert_eq!(
            ControlMessageV01::set(vec![
                ControlAtomV01::Float {
                    representation: "f32".to_owned(),
                    value: 0.5
                },
                ControlAtomV01::Bool { value: true },
                ControlAtomV01::String {
                    value: "armed".to_owned()
                }
            ]),
            ControlMessageV01 {
                selector: "set".to_owned(),
                atoms: vec![
                    ControlAtomV01::Float {
                        representation: "f32".to_owned(),
                        value: 0.5
                    },
                    ControlAtomV01::Bool { value: true },
                    ControlAtomV01::String {
                        value: "armed".to_owned()
                    }
                ]
            }
        );
    }
}
