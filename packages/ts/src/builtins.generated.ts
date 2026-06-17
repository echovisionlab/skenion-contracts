/* This file is generated from builtins/v0.1. */
import type { NodeDefinitionManifestV01 } from "./types.js";

export interface BuiltinManifestV01 {
  schema: "skenion.builtins.manifest";
  schemaVersion: "0.1.0";
  version: "0.1";
  nodes: string[];
  canonicalDataKinds: string[];
}

export const builtinManifestV01 = {
  "schema": "skenion.builtins.manifest",
  "schemaVersion": "0.1.0",
  "version": "0.1",
  "nodes": [
    "core.value-f32",
    "core.color-rgba",
    "core.target",
    "core.bang-button",
    "core.event-log",
    "core.video-asset",
    "core.video-decode",
    "core.gpu-upload",
    "core.preview",
    "render.clear-color",
    "render.fullscreen-shader",
    "render.output"
  ],
  "canonicalDataKinds": [
    "number.f32",
    "event.bang",
    "asset.video",
    "video.frame",
    "gpu.texture2d",
    "color.rgba"
  ]
} satisfies BuiltinManifestV01;

export const builtinNodeDefinitionsV01 = [
  {
    "schema": "skenion.node.definition",
    "schemaVersion": "0.1.0",
    "id": "core.bang-button",
    "version": "0.1.0",
    "displayName": "Bang Button",
    "category": "Events",
    "ports": [
      {
        "id": "bang",
        "direction": "output",
        "label": "Bang",
        "type": {
          "flow": "event",
          "dataKind": "event.bang"
        }
      }
    ],
    "execution": {
      "model": "event"
    },
    "state": {
      "persistent": false
    },
    "permissions": [],
    "capabilities": []
  },
  {
    "schema": "skenion.node.definition",
    "schemaVersion": "0.1.0",
    "id": "core.color-rgba",
    "version": "0.1.0",
    "displayName": "RGBA Color",
    "category": "Values",
    "ports": [
      {
        "id": "value",
        "direction": "output",
        "label": "Color",
        "type": {
          "flow": "value",
          "dataKind": "color.rgba"
        }
      }
    ],
    "execution": {
      "model": "value"
    },
    "state": {
      "persistent": false
    },
    "permissions": [],
    "capabilities": []
  },
  {
    "schema": "skenion.node.definition",
    "schemaVersion": "0.1.0",
    "id": "core.event-log",
    "version": "0.1.0",
    "displayName": "Event Log",
    "category": "Events",
    "ports": [
      {
        "id": "bang",
        "direction": "input",
        "label": "Bang",
        "type": {
          "flow": "event",
          "dataKind": "event.bang"
        },
        "required": true,
        "activation": "trigger"
      }
    ],
    "execution": {
      "model": "event"
    },
    "state": {
      "persistent": false
    },
    "permissions": [],
    "capabilities": []
  },
  {
    "schema": "skenion.node.definition",
    "schemaVersion": "0.1.0",
    "id": "core.gpu-upload",
    "version": "0.1.0",
    "displayName": "GPU Upload",
    "category": "Converters",
    "ports": [
      {
        "id": "frames",
        "direction": "input",
        "label": "Frames",
        "type": {
          "flow": "stream",
          "dataKind": "video.frame",
          "frameRate": 60,
          "colorSpace": "srgb",
          "alphaPolicy": "black"
        },
        "required": true,
        "activation": "latched"
      },
      {
        "id": "texture",
        "direction": "output",
        "label": "Texture",
        "type": {
          "flow": "resource",
          "dataKind": "gpu.texture2d",
          "format": "rgba8unorm",
          "colorSpace": "srgb"
        }
      }
    ],
    "execution": {
      "model": "gpu_pass"
    },
    "state": {
      "persistent": false
    },
    "permissions": [],
    "capabilities": []
  },
  {
    "schema": "skenion.node.definition",
    "schemaVersion": "0.1.0",
    "id": "core.preview",
    "version": "0.1.0",
    "displayName": "Preview",
    "category": "Output",
    "ports": [
      {
        "id": "texture",
        "direction": "input",
        "label": "Texture",
        "type": {
          "flow": "resource",
          "dataKind": "gpu.texture2d",
          "format": "rgba8unorm",
          "colorSpace": "srgb"
        },
        "required": true,
        "activation": "latched"
      }
    ],
    "execution": {
      "model": "frame"
    },
    "state": {
      "persistent": false
    },
    "permissions": [],
    "capabilities": []
  },
  {
    "schema": "skenion.node.definition",
    "schemaVersion": "0.1.0",
    "id": "core.target",
    "version": "0.1.0",
    "displayName": "Value Target",
    "category": "Values",
    "ports": [
      {
        "id": "value",
        "direction": "input",
        "label": "Value",
        "type": {
          "flow": "value",
          "dataKind": "number.f32",
          "range": {
            "min": 0,
            "max": 1,
            "step": 0.01
          }
        },
        "required": true,
        "activation": "latched"
      }
    ],
    "execution": {
      "model": "value"
    },
    "state": {
      "persistent": false
    },
    "permissions": [],
    "capabilities": []
  },
  {
    "schema": "skenion.node.definition",
    "schemaVersion": "0.1.0",
    "id": "core.value-f32",
    "version": "0.1.0",
    "displayName": "Float Value",
    "category": "Values",
    "ports": [
      {
        "id": "value",
        "direction": "output",
        "label": "Value",
        "type": {
          "flow": "value",
          "dataKind": "number.f32",
          "range": {
            "min": 0,
            "max": 1,
            "step": 0.01
          }
        }
      }
    ],
    "execution": {
      "model": "value"
    },
    "state": {
      "persistent": false
    },
    "permissions": [],
    "capabilities": []
  },
  {
    "schema": "skenion.node.definition",
    "schemaVersion": "0.1.0",
    "id": "core.video-asset",
    "version": "0.1.0",
    "displayName": "Video Asset",
    "category": "Media",
    "ports": [
      {
        "id": "asset",
        "direction": "output",
        "label": "Asset",
        "type": {
          "flow": "resource",
          "dataKind": "asset.video"
        }
      }
    ],
    "execution": {
      "model": "async_resource"
    },
    "state": {
      "persistent": false
    },
    "permissions": [],
    "capabilities": []
  },
  {
    "schema": "skenion.node.definition",
    "schemaVersion": "0.1.0",
    "id": "core.video-decode",
    "version": "0.1.0",
    "displayName": "Video Decode",
    "category": "Converters",
    "ports": [
      {
        "id": "asset",
        "direction": "input",
        "label": "Asset",
        "type": {
          "flow": "resource",
          "dataKind": "asset.video"
        },
        "required": true,
        "activation": "latched"
      },
      {
        "id": "frames",
        "direction": "output",
        "label": "Frames",
        "type": {
          "flow": "stream",
          "dataKind": "video.frame",
          "frameRate": 60,
          "colorSpace": "srgb",
          "alphaPolicy": "black"
        }
      }
    ],
    "execution": {
      "model": "video_frame"
    },
    "state": {
      "persistent": false
    },
    "permissions": [],
    "capabilities": []
  },
  {
    "schema": "skenion.node.definition",
    "schemaVersion": "0.1.0",
    "id": "render.clear-color",
    "version": "0.1.0",
    "displayName": "Clear Color",
    "category": "Render",
    "ports": [
      {
        "id": "out",
        "direction": "output",
        "label": "Out",
        "type": {
          "flow": "resource",
          "dataKind": "gpu.texture2d",
          "format": "rgba8unorm",
          "colorSpace": "srgb"
        }
      }
    ],
    "execution": {
      "model": "gpu_pass",
      "clock": "frame"
    },
    "state": {
      "persistent": false
    },
    "permissions": [],
    "capabilities": [
      "render.output.clear-color"
    ]
  },
  {
    "schema": "skenion.node.definition",
    "schemaVersion": "0.1.0",
    "id": "render.fullscreen-shader",
    "version": "0.1.0",
    "displayName": "Fullscreen Shader",
    "category": "Render",
    "ports": [
      {
        "id": "u_value",
        "direction": "input",
        "label": "u_value",
        "type": {
          "flow": "value",
          "dataKind": "number.f32",
          "range": {
            "min": 0,
            "max": 1,
            "step": 0.01
          }
        },
        "required": false,
        "activation": "latched"
      },
      {
        "id": "u_value2",
        "direction": "input",
        "label": "u_value2",
        "type": {
          "flow": "value",
          "dataKind": "number.f32",
          "range": {
            "min": 0,
            "max": 1,
            "step": 0.01
          }
        },
        "required": false,
        "activation": "latched"
      },
      {
        "id": "u_color",
        "direction": "input",
        "label": "u_color",
        "type": {
          "flow": "value",
          "dataKind": "color.rgba"
        },
        "required": false,
        "activation": "latched"
      },
      {
        "id": "out",
        "direction": "output",
        "label": "Out",
        "type": {
          "flow": "resource",
          "dataKind": "gpu.texture2d",
          "format": "rgba8unorm",
          "colorSpace": "srgb"
        }
      }
    ],
    "execution": {
      "model": "gpu_pass",
      "clock": "frame"
    },
    "state": {
      "persistent": false
    },
    "permissions": [],
    "capabilities": [
      "render.output.fullscreen-shader"
    ]
  },
  {
    "schema": "skenion.node.definition",
    "schemaVersion": "0.1.0",
    "id": "render.output",
    "version": "0.1.0",
    "displayName": "Render Output",
    "category": "Render",
    "ports": [
      {
        "id": "in",
        "direction": "input",
        "label": "In",
        "type": {
          "flow": "resource",
          "dataKind": "gpu.texture2d",
          "format": "rgba8unorm",
          "colorSpace": "srgb"
        },
        "required": true,
        "activation": "latched"
      }
    ],
    "execution": {
      "model": "frame",
      "clock": "frame"
    },
    "state": {
      "persistent": false
    },
    "permissions": [],
    "capabilities": [
      "render.output.surface"
    ]
  }
] satisfies NodeDefinitionManifestV01[];

export function getBuiltinNodeDefinition(id: string): NodeDefinitionManifestV01 | undefined {
  return builtinNodeDefinitionsV01.find((definition) => definition.id === id);
}
