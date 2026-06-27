use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum MessageAtomV01 {
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
pub struct MessageValueV01 {
    pub key: String,
    #[serde(default)]
    pub atoms: Vec<MessageAtomV01>,
}

impl MessageValueV01 {
    pub fn bang() -> Self {
        Self {
            key: "bang".to_owned(),
            atoms: Vec::new(),
        }
    }

    pub fn set(atoms: Vec<MessageAtomV01>) -> Self {
        Self {
            key: "set".to_owned(),
            atoms,
        }
    }
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::*;

    #[test]
    fn serializes_bang_as_key_not_value() {
        assert_eq!(
            serde_json::to_value(MessageValueV01::bang()).unwrap(),
            json!({ "key": "bang", "atoms": [] })
        );
    }

    #[test]
    fn serializes_typed_atoms() {
        assert_eq!(
            serde_json::to_value(MessageValueV01 {
                key: "set".to_owned(),
                atoms: vec![
                    MessageAtomV01::Int {
                        representation: "i32".to_owned(),
                        value: 1
                    },
                    MessageAtomV01::Uint {
                        representation: "u8".to_owned(),
                        value: 255
                    },
                    MessageAtomV01::String {
                        value: "on".to_owned()
                    },
                    MessageAtomV01::Color {
                        representation: "rgba32f".to_owned(),
                        color_space: Some("linear".to_owned()),
                        value: [1.0, 0.0, 0.5, 1.0]
                    }
                ]
            })
            .unwrap(),
            json!({
                "key": "set",
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
            MessageValueV01::set(vec![
                MessageAtomV01::Float {
                    representation: "f32".to_owned(),
                    value: 0.5
                },
                MessageAtomV01::Bool { value: true },
                MessageAtomV01::String {
                    value: "armed".to_owned()
                }
            ]),
            MessageValueV01 {
                key: "set".to_owned(),
                atoms: vec![
                    MessageAtomV01::Float {
                        representation: "f32".to_owned(),
                        value: 0.5
                    },
                    MessageAtomV01::Bool { value: true },
                    MessageAtomV01::String {
                        value: "armed".to_owned()
                    }
                ]
            }
        );
    }
}
