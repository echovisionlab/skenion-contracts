import type { AudioClockBridgePlanV01, AudioClockDomainV01 } from "./types.js";

export function planAudioClockBridgeV01(
  source: AudioClockDomainV01,
  target: AudioClockDomainV01,
  bridgeNodeId?: string
): AudioClockBridgePlanV01 {
  if (source.id === target.id) {
    return {
      required: false,
      sourceClockDomainId: source.id,
      targetClockDomainId: target.id,
      method: "direct",
      issues: []
    };
  }

  if (bridgeNodeId) {
    return {
      required: true,
      sourceClockDomainId: source.id,
      targetClockDomainId: target.id,
      method: "clock-bridge",
      bridgeNodeId,
      issues: [
        {
          severity: "info",
          code: "explicit-audio-clock-bridge",
          message: "audio signal crosses independent clock domains through an explicit bridge node"
        }
      ]
    };
  }

  return {
    required: true,
    sourceClockDomainId: source.id,
    targetClockDomainId: target.id,
    method: "invalid",
    issues: [
      {
        severity: "error",
        code: "audio-clock-domain-crossing-requires-bridge",
        message: "audio signal crosses independent clock domains without object.core.audio.clock-bridge or object.core.audio.resample"
      }
    ]
  };
}
