use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(tag = "type", content = "value", rename_all = "camelCase")]
pub enum ControlAtomV01 {
    F32(f64),
    I32(i64),
    Bool(bool),
    String(String),
    Rgba([f64; 4]),
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
                    ControlAtomV01::I32(1),
                    ControlAtomV01::String("on".to_owned()),
                    ControlAtomV01::Rgba([1.0, 0.0, 0.5, 1.0])
                ]
            })
            .unwrap(),
            json!({
                "selector": "set",
                "atoms": [
                    { "type": "i32", "value": 1 },
                    { "type": "string", "value": "on" },
                    { "type": "rgba", "value": [1.0, 0.0, 0.5, 1.0] }
                ]
            })
        );
    }

    #[test]
    fn constructs_set_messages() {
        assert_eq!(
            ControlMessageV01::set(vec![
                ControlAtomV01::F32(0.5),
                ControlAtomV01::Bool(true),
                ControlAtomV01::String("armed".to_owned())
            ]),
            ControlMessageV01 {
                selector: "set".to_owned(),
                atoms: vec![
                    ControlAtomV01::F32(0.5),
                    ControlAtomV01::Bool(true),
                    ControlAtomV01::String("armed".to_owned())
                ]
            }
        );
    }
}
