use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum AudioEndpointDirectionV01 {
    Input,
    Output,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum AudioClockDomainAuthorityV01 {
    Authoritative,
    DriverReported,
    UserConfigured,
    Derived,
    Unavailable,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum AudioClockBridgeMethodV01 {
    Direct,
    ClockBridge,
    Resample,
    Invalid,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AudioDeviceDescriptorV01 {
    pub id: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub host_api: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub is_default_input: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub is_default_output: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_input_channels: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_output_channels: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub clock_domain_hint: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AudioDevicePreferenceV01 {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub device_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name_contains: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub default_input: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub default_output: Option<bool>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AudioStreamConfigRequestV01 {
    pub endpoint_id: String,
    pub direction: AudioEndpointDirectionV01,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub device: Option<AudioDevicePreferenceV01>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sample_rate: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub channels: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sample_format: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub block_size: Option<u32>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AudioStreamConfigResolvedV01 {
    pub endpoint_id: String,
    pub direction: AudioEndpointDirectionV01,
    pub device: AudioDeviceDescriptorV01,
    pub sample_rate: u32,
    pub channels: u32,
    pub sample_format: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub block_size: Option<u32>,
    pub clock_domain_id: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AudioEndpointV01 {
    pub id: String,
    pub node_id: String,
    pub direction: AudioEndpointDirectionV01,
    pub channel_ports: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub requested_config: Option<AudioStreamConfigRequestV01>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub resolved_config: Option<AudioStreamConfigResolvedV01>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub clock_domain_id: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AudioClockDomainV01 {
    pub id: String,
    pub authority: AudioClockDomainAuthorityV01,
    pub source: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub sample_rate: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub drift_compensated: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub shared_with: Option<Vec<String>>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AudioGraphPartitionV01 {
    pub id: String,
    pub clock_domain_id: String,
    pub endpoint_ids: Vec<String>,
    pub node_ids: Vec<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum AudioClockBridgeDiagnosticSeverityV01 {
    Info,
    Warning,
    Error,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
pub struct AudioClockBridgeDiagnosticV01 {
    pub severity: AudioClockBridgeDiagnosticSeverityV01,
    pub code: String,
    pub message: String,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AudioClockBridgePlanV01 {
    pub required: bool,
    pub source_clock_domain_id: String,
    pub target_clock_domain_id: String,
    pub method: AudioClockBridgeMethodV01,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bridge_node_id: Option<String>,
    pub diagnostics: Vec<AudioClockBridgeDiagnosticV01>,
}

#[derive(Debug, Clone, PartialEq, Eq, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AudioResamplerPlanV01 {
    pub source_sample_rate: u32,
    pub target_sample_rate: u32,
    pub drift_compensation: bool,
    pub quality: String,
}

pub fn plan_audio_clock_bridge_v01(
    source: &AudioClockDomainV01,
    target: &AudioClockDomainV01,
    bridge_node_id: Option<&str>,
) -> AudioClockBridgePlanV01 {
    if source.id == target.id {
        return AudioClockBridgePlanV01 {
            required: false,
            source_clock_domain_id: source.id.clone(),
            target_clock_domain_id: target.id.clone(),
            method: AudioClockBridgeMethodV01::Direct,
            bridge_node_id: None,
            diagnostics: Vec::new(),
        };
    }

    if let Some(node_id) = bridge_node_id {
        return AudioClockBridgePlanV01 {
            required: true,
            source_clock_domain_id: source.id.clone(),
            target_clock_domain_id: target.id.clone(),
            method: AudioClockBridgeMethodV01::ClockBridge,
            bridge_node_id: Some(node_id.to_owned()),
            diagnostics: vec![AudioClockBridgeDiagnosticV01 {
                severity: AudioClockBridgeDiagnosticSeverityV01::Info,
                code: "explicit-audio-clock-bridge".to_owned(),
                message:
                    "audio signal crosses independent clock domains through an explicit bridge node"
                        .to_owned(),
            }],
        };
    }

    AudioClockBridgePlanV01 {
        required: true,
        source_clock_domain_id: source.id.clone(),
        target_clock_domain_id: target.id.clone(),
        method: AudioClockBridgeMethodV01::Invalid,
        bridge_node_id: None,
        diagnostics: vec![AudioClockBridgeDiagnosticV01 {
            severity: AudioClockBridgeDiagnosticSeverityV01::Error,
            code: "audio-clock-domain-crossing-requires-bridge".to_owned(),
            message: "audio signal crosses independent clock domains without object.core.audio.clock-bridge or object.core.audio.resample".to_owned(),
        }],
    }
}
