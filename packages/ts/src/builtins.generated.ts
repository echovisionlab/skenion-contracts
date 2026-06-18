/* This file is generated from builtins/v0.1. */
import type { GraphDocumentV01, NodeDefinitionManifestV01 } from "./types.js";

export interface BuiltinManifestV01 {
  schema: "skenion.builtins.manifest";
  schemaVersion: "0.1.0";
  version: "0.1";
  nodes: string[];
  canonicalDataKinds: string[];
}

export interface BuiltinNodeHelpItemV01 {
  id: string;
  description: string;
}

export interface BuiltinNodeHelpExampleV01 {
  title: string;
  description?: string;
  graph?: string;
}

export interface BuiltinNodeHelpV01 {
  schema: "skenion.node.help";
  schemaVersion: "0.1.0";
  id: string;
  summary: string;
  description: string;
  docsPath?: string;
  helpGraph: string;
  tags: string[];
  runtimeBehavior?: string;
  relatedNodes?: string[];
  ports?: BuiltinNodeHelpItemV01[];
  params?: BuiltinNodeHelpItemV01[];
  example?: BuiltinNodeHelpExampleV01;
}

export interface BuiltinNodeHelpGraphV01 {
  id: string;
  graph: GraphDocumentV01;
}

export const builtinManifestV01 = {
  "schema": "skenion.builtins.manifest",
  "schemaVersion": "0.1.0",
  "version": "0.1",
  "nodes": [
    "core.comment",
    "core.panel",
    "core.message",
    "core.string",
    "core.toggle",
    "core.value-f32",
    "core.value-i32",
    "core.value-bool",
    "core.color-rgba",
    "core.send-f32",
    "core.receive-f32",
    "core.send-i32",
    "core.receive-i32",
    "core.send-bool",
    "core.receive-bool",
    "core.send-rgba",
    "core.receive-rgba",
    "ui.button",
    "ui.slider-f32",
    "ui.toggle",
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
    "number.i32",
    "boolean",
    "string",
    "message.any",
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
    "displayName": "RGBA",
    "category": "Values",
    "ports": [
      {
        "id": "in",
        "direction": "input",
        "label": "In",
        "type": {
          "flow": "value",
          "dataKind": "color.rgba"
        },
        "required": false,
        "activation": "trigger"
      },
      {
        "id": "set",
        "direction": "input",
        "label": "Set",
        "type": {
          "flow": "value",
          "dataKind": "color.rgba"
        },
        "required": false,
        "activation": "latched"
      },
      {
        "id": "bang",
        "direction": "input",
        "label": "Bang",
        "type": {
          "flow": "event",
          "dataKind": "event.bang"
        },
        "required": false,
        "activation": "trigger"
      },
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
    "id": "core.comment",
    "version": "0.1.0",
    "displayName": "Comment",
    "category": "Control",
    "ports": [
      {
        "id": "set",
        "direction": "input",
        "label": "Set",
        "type": {
          "flow": "value",
          "dataKind": "message.any"
        },
        "required": false,
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
    "id": "core.message",
    "version": "0.1.0",
    "displayName": "Message",
    "category": "Control",
    "ports": [
      {
        "id": "in",
        "direction": "input",
        "label": "In",
        "type": {
          "flow": "value",
          "dataKind": "message.any"
        },
        "required": false,
        "activation": "trigger"
      },
      {
        "id": "set",
        "direction": "input",
        "label": "Set",
        "type": {
          "flow": "value",
          "dataKind": "message.any"
        },
        "required": false,
        "activation": "latched"
      },
      {
        "id": "bang",
        "direction": "input",
        "label": "Bang",
        "type": {
          "flow": "event",
          "dataKind": "event.bang"
        },
        "required": false,
        "activation": "trigger"
      },
      {
        "id": "value",
        "direction": "output",
        "label": "Value",
        "type": {
          "flow": "value",
          "dataKind": "string"
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
    "id": "core.panel",
    "version": "0.1.0",
    "displayName": "Panel",
    "category": "Control",
    "ports": [
      {
        "id": "set",
        "direction": "input",
        "label": "Set",
        "type": {
          "flow": "value",
          "dataKind": "message.any"
        },
        "required": false,
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
    "id": "core.receive-bool",
    "version": "0.1.0",
    "displayName": "Receive Bool",
    "category": "Routing",
    "ports": [
      {
        "id": "bang",
        "direction": "input",
        "label": "Bang",
        "type": {
          "flow": "event",
          "dataKind": "event.bang"
        },
        "required": false,
        "activation": "trigger"
      },
      {
        "id": "value",
        "direction": "output",
        "label": "Bool",
        "type": {
          "flow": "value",
          "dataKind": "boolean"
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
    "id": "core.receive-f32",
    "version": "0.1.0",
    "displayName": "Receive F32",
    "category": "Routing",
    "ports": [
      {
        "id": "bang",
        "direction": "input",
        "label": "Bang",
        "type": {
          "flow": "event",
          "dataKind": "event.bang"
        },
        "required": false,
        "activation": "trigger"
      },
      {
        "id": "value",
        "direction": "output",
        "label": "F32",
        "type": {
          "flow": "value",
          "dataKind": "number.f32"
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
    "id": "core.receive-i32",
    "version": "0.1.0",
    "displayName": "Receive I32",
    "category": "Routing",
    "ports": [
      {
        "id": "bang",
        "direction": "input",
        "label": "Bang",
        "type": {
          "flow": "event",
          "dataKind": "event.bang"
        },
        "required": false,
        "activation": "trigger"
      },
      {
        "id": "value",
        "direction": "output",
        "label": "I32",
        "type": {
          "flow": "value",
          "dataKind": "number.i32"
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
    "id": "core.receive-rgba",
    "version": "0.1.0",
    "displayName": "Receive RGBA",
    "category": "Routing",
    "ports": [
      {
        "id": "bang",
        "direction": "input",
        "label": "Bang",
        "type": {
          "flow": "event",
          "dataKind": "event.bang"
        },
        "required": false,
        "activation": "trigger"
      },
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
    "id": "core.send-bool",
    "version": "0.1.0",
    "displayName": "Send Bool",
    "category": "Routing",
    "ports": [
      {
        "id": "in",
        "direction": "input",
        "label": "In",
        "type": {
          "flow": "value",
          "dataKind": "boolean"
        },
        "required": true,
        "activation": "trigger"
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
    "id": "core.send-f32",
    "version": "0.1.0",
    "displayName": "Send F32",
    "category": "Routing",
    "ports": [
      {
        "id": "in",
        "direction": "input",
        "label": "In",
        "type": {
          "flow": "value",
          "dataKind": "number.f32"
        },
        "required": true,
        "activation": "trigger"
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
    "id": "core.send-i32",
    "version": "0.1.0",
    "displayName": "Send I32",
    "category": "Routing",
    "ports": [
      {
        "id": "in",
        "direction": "input",
        "label": "In",
        "type": {
          "flow": "value",
          "dataKind": "number.i32"
        },
        "required": true,
        "activation": "trigger"
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
    "id": "core.send-rgba",
    "version": "0.1.0",
    "displayName": "Send RGBA",
    "category": "Routing",
    "ports": [
      {
        "id": "in",
        "direction": "input",
        "label": "In",
        "type": {
          "flow": "value",
          "dataKind": "color.rgba"
        },
        "required": true,
        "activation": "trigger"
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
    "id": "core.string",
    "version": "0.1.0",
    "displayName": "String",
    "category": "Values",
    "ports": [
      {
        "id": "in",
        "direction": "input",
        "label": "In",
        "type": {
          "flow": "value",
          "dataKind": "string"
        },
        "required": false,
        "activation": "trigger"
      },
      {
        "id": "set",
        "direction": "input",
        "label": "Set",
        "type": {
          "flow": "value",
          "dataKind": "string"
        },
        "required": false,
        "activation": "latched"
      },
      {
        "id": "bang",
        "direction": "input",
        "label": "Bang",
        "type": {
          "flow": "event",
          "dataKind": "event.bang"
        },
        "required": false,
        "activation": "trigger"
      },
      {
        "id": "value",
        "direction": "output",
        "label": "Value",
        "type": {
          "flow": "value",
          "dataKind": "string"
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
    "id": "core.toggle",
    "version": "0.1.0",
    "displayName": "Toggle",
    "category": "Values",
    "ports": [
      {
        "id": "in",
        "direction": "input",
        "label": "In",
        "type": {
          "flow": "value",
          "dataKind": "boolean"
        },
        "required": false,
        "activation": "trigger"
      },
      {
        "id": "set",
        "direction": "input",
        "label": "Set",
        "type": {
          "flow": "value",
          "dataKind": "boolean"
        },
        "required": false,
        "activation": "latched"
      },
      {
        "id": "bang",
        "direction": "input",
        "label": "Bang",
        "type": {
          "flow": "event",
          "dataKind": "event.bang"
        },
        "required": false,
        "activation": "trigger"
      },
      {
        "id": "value",
        "direction": "output",
        "label": "Value",
        "type": {
          "flow": "value",
          "dataKind": "boolean"
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
    "id": "core.value-bool",
    "version": "0.1.0",
    "displayName": "Bool",
    "category": "Values",
    "ports": [
      {
        "id": "in",
        "direction": "input",
        "label": "In",
        "type": {
          "flow": "value",
          "dataKind": "boolean"
        },
        "required": false,
        "activation": "trigger"
      },
      {
        "id": "set",
        "direction": "input",
        "label": "Set",
        "type": {
          "flow": "value",
          "dataKind": "boolean"
        },
        "required": false,
        "activation": "latched"
      },
      {
        "id": "bang",
        "direction": "input",
        "label": "Bang",
        "type": {
          "flow": "event",
          "dataKind": "event.bang"
        },
        "required": false,
        "activation": "trigger"
      },
      {
        "id": "value",
        "direction": "output",
        "label": "Value",
        "type": {
          "flow": "value",
          "dataKind": "boolean"
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
    "id": "core.value-f32",
    "version": "0.1.0",
    "displayName": "F32",
    "category": "Values",
    "ports": [
      {
        "id": "in",
        "direction": "input",
        "label": "In",
        "type": {
          "flow": "value",
          "dataKind": "number.f32"
        },
        "required": false,
        "activation": "trigger"
      },
      {
        "id": "set",
        "direction": "input",
        "label": "Set",
        "type": {
          "flow": "value",
          "dataKind": "number.f32"
        },
        "required": false,
        "activation": "latched"
      },
      {
        "id": "bang",
        "direction": "input",
        "label": "Bang",
        "type": {
          "flow": "event",
          "dataKind": "event.bang"
        },
        "required": false,
        "activation": "trigger"
      },
      {
        "id": "value",
        "direction": "output",
        "label": "Value",
        "type": {
          "flow": "value",
          "dataKind": "number.f32"
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
    "id": "core.value-i32",
    "version": "0.1.0",
    "displayName": "I32",
    "category": "Values",
    "ports": [
      {
        "id": "in",
        "direction": "input",
        "label": "In",
        "type": {
          "flow": "value",
          "dataKind": "number.i32"
        },
        "required": false,
        "activation": "trigger"
      },
      {
        "id": "set",
        "direction": "input",
        "label": "Set",
        "type": {
          "flow": "value",
          "dataKind": "number.i32"
        },
        "required": false,
        "activation": "latched"
      },
      {
        "id": "bang",
        "direction": "input",
        "label": "Bang",
        "type": {
          "flow": "event",
          "dataKind": "event.bang"
        },
        "required": false,
        "activation": "trigger"
      },
      {
        "id": "value",
        "direction": "output",
        "label": "Value",
        "type": {
          "flow": "value",
          "dataKind": "number.i32"
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
  },
  {
    "schema": "skenion.node.definition",
    "schemaVersion": "0.1.0",
    "id": "ui.button",
    "version": "0.1.0",
    "displayName": "Button",
    "category": "UI Controls",
    "ports": [
      {
        "id": "in",
        "direction": "input",
        "label": "In",
        "type": {
          "flow": "value",
          "dataKind": "message.any"
        },
        "required": false,
        "activation": "trigger"
      },
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
    "id": "ui.slider-f32",
    "version": "0.1.0",
    "displayName": "Slider F32",
    "category": "UI Controls",
    "ports": [
      {
        "id": "in",
        "direction": "input",
        "label": "In",
        "type": {
          "flow": "value",
          "dataKind": "number.f32"
        },
        "required": false,
        "activation": "trigger"
      },
      {
        "id": "set",
        "direction": "input",
        "label": "Set",
        "type": {
          "flow": "value",
          "dataKind": "number.f32"
        },
        "required": false,
        "activation": "latched"
      },
      {
        "id": "bang",
        "direction": "input",
        "label": "Bang",
        "type": {
          "flow": "event",
          "dataKind": "event.bang"
        },
        "required": false,
        "activation": "trigger"
      },
      {
        "id": "value",
        "direction": "output",
        "label": "Value",
        "type": {
          "flow": "value",
          "dataKind": "number.f32"
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
    "id": "ui.toggle",
    "version": "0.1.0",
    "displayName": "Toggle Control",
    "category": "UI Controls",
    "ports": [
      {
        "id": "in",
        "direction": "input",
        "label": "In",
        "type": {
          "flow": "value",
          "dataKind": "message.any"
        },
        "required": false,
        "activation": "trigger"
      },
      {
        "id": "set",
        "direction": "input",
        "label": "Set",
        "type": {
          "flow": "value",
          "dataKind": "message.any"
        },
        "required": false,
        "activation": "latched"
      },
      {
        "id": "value",
        "direction": "output",
        "label": "Value",
        "type": {
          "flow": "value",
          "dataKind": "boolean"
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
  }
] satisfies NodeDefinitionManifestV01[];

export const builtinNodeHelpV01 = [
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "core.bang-button",
    "summary": "Emits a discrete bang event.",
    "description": "Bang Button is the simplest manual trigger. It emits event.bang and does not carry a continuous value.",
    "helpGraph": "help/v0.1/nodes/core.bang-button.help.graph.json",
    "tags": [
      "event",
      "trigger",
      "control"
    ],
    "runtimeBehavior": "When activated, the node emits one event.bang from its bang output.",
    "relatedNodes": [
      "core.value-f32",
      "core.toggle",
      "core.message"
    ],
    "ports": [
      {
        "id": "bang",
        "description": "Outputs a discrete event.bang trigger."
      }
    ],
    "example": {
      "title": "Trigger stored values",
      "description": "Connect Bang Button to value nodes, toggles, or messages to emit their stored payloads.",
      "graph": "help/v0.1/nodes/core.bang-button.help.graph.json"
    }
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "core.color-rgba",
    "summary": "Stores and emits an RGBA color control value.",
    "description": "Use RGBA for color controls. Component values are normalized floats in graph and runtime payloads.",
    "helpGraph": "help/v0.1/nodes/core.color-rgba.help.graph.json",
    "tags": [
      "value",
      "control",
      "color"
    ],
    "runtimeBehavior": "in updates and emits, set updates silently, and bang emits the stored RGBA color without changing it.",
    "relatedNodes": [
      "core.bang-button",
      "render.fullscreen-shader"
    ],
    "ports": [
      {
        "id": "in",
        "description": "Updates the stored color and emits it."
      },
      {
        "id": "set",
        "description": "Updates the stored color without emitting."
      },
      {
        "id": "bang",
        "description": "Emits the current stored color without changing it."
      },
      {
        "id": "value",
        "description": "Outputs the current color."
      }
    ],
    "params": [
      {
        "id": "value",
        "description": "Saved default RGBA color."
      },
      {
        "id": "sendName",
        "description": "Optional typed channel name updated whenever this object emits."
      },
      {
        "id": "receiveName",
        "description": "Optional typed channel name used to receive routed updates."
      }
    ],
    "example": {
      "title": "Drive shader tint",
      "description": "Connect color to an annotation-generated shader tint uniform.",
      "graph": "help/v0.1/nodes/core.color-rgba.help.graph.json"
    }
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "core.comment",
    "summary": "Documents a patch without participating in execution.",
    "description": "Comment nodes are persisted graph annotations. They render as canvas text and expose a set inlet for Max/Pd-style text updates without output.",
    "helpGraph": "help/v0.1/nodes/core.comment.help.graph.json",
    "tags": [
      "documentation",
      "annotation"
    ],
    "runtimeBehavior": "set <text> updates runtime comment text state silently. Inspector edits remain graph patches. Comment has no output.",
    "relatedNodes": [
      "core.message"
    ],
    "ports": [
      {
        "id": "set",
        "description": "Updates comment text from a set <text> message without output."
      }
    ],
    "params": [
      {
        "id": "text",
        "description": "Saved annotation text."
      },
      {
        "id": "receiveName",
        "description": "Optional string channel name used to receive routed text updates."
      }
    ],
    "example": {
      "title": "Annotate a patch",
      "description": "Use comments to label intent near control and render nodes.",
      "graph": "help/v0.1/nodes/core.comment.help.graph.json"
    }
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "core.event-log",
    "summary": "Receives bang events for diagnostics.",
    "description": "Event Log is a small inspection target for event patches. It helps examples show when a bang path fires.",
    "helpGraph": "help/v0.1/nodes/core.event-log.help.graph.json",
    "tags": [
      "event",
      "diagnostics"
    ],
    "runtimeBehavior": "The node records or reports incoming bang events in diagnostic contexts.",
    "relatedNodes": [
      "core.bang-button",
      "core.message"
    ],
    "ports": [
      {
        "id": "bang",
        "description": "Receives event.bang triggers."
      }
    ],
    "example": {
      "title": "See event flow",
      "description": "Connect a Bang Button to Event Log when a help graph needs visible event intent.",
      "graph": "help/v0.1/nodes/core.event-log.help.graph.json"
    }
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "core.gpu-upload",
    "summary": "Uploads decoded video frames to a GPU texture resource.",
    "description": "GPU Upload is an explicit converter from stream<video.frame> to resource<gpu.texture2d>. Skenion does not perform this conversion implicitly.",
    "helpGraph": "help/v0.1/nodes/core.gpu-upload.help.graph.json",
    "tags": [
      "converter",
      "gpu",
      "video"
    ],
    "runtimeBehavior": "Consumes video frames on the frame clock and produces a GPU texture resource for preview or render nodes.",
    "relatedNodes": [
      "core.video-decode",
      "core.preview",
      "render.output"
    ],
    "ports": [
      {
        "id": "frames",
        "description": "Receives decoded video frame stream data."
      },
      {
        "id": "texture",
        "description": "Outputs a GPU texture resource."
      }
    ],
    "example": {
      "title": "Explicit media conversion",
      "description": "Video assets must pass through decode and upload converter nodes before they can feed GPU consumers.",
      "graph": "help/v0.1/nodes/core.gpu-upload.help.graph.json"
    }
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "core.message",
    "summary": "Emits a saved message payload when clicked or triggered.",
    "description": "Message is a Max/Pd-like message box. Click or bang emits the stored message; set <message> replaces the runtime message silently.",
    "docsPath": "docs/nodes/core.message.md",
    "helpGraph": "help/v0.1/nodes/core.message.help.graph.json",
    "tags": [
      "event",
      "message",
      "text"
    ],
    "runtimeBehavior": "click, in, or bang emits the saved message payload. set updates runtime message text without output. Inspector edits are graph patches, not runtime control events.",
    "relatedNodes": [
      "core.bang-button",
      "core.string",
      "core.event-log"
    ],
    "ports": [
      {
        "id": "in",
        "description": "Accepts any message and emits the current message payload."
      },
      {
        "id": "set",
        "description": "Updates the runtime message payload without output."
      },
      {
        "id": "bang",
        "description": "Emits the saved message payload."
      },
      {
        "id": "value",
        "description": "Outputs the saved message text."
      }
    ],
    "params": [
      {
        "id": "value",
        "description": "Saved message text."
      },
      {
        "id": "sendName",
        "description": "Optional string channel name updated whenever the message emits."
      },
      {
        "id": "receiveName",
        "description": "Optional string channel name used to receive routed message updates."
      }
    ],
    "example": {
      "title": "Trigger a string message",
      "description": "Use Bang Button to emit the saved message text on demand.",
      "graph": "help/v0.1/nodes/core.message.help.graph.json"
    }
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "core.panel",
    "summary": "Draws a colored background panel on the patch canvas.",
    "description": "Panel is a visual patch annotation object. It can receive set <hex> style messages to update its runtime color state, but it does not output values.",
    "helpGraph": "help/v0.1/nodes/core.panel.help.graph.json",
    "tags": [
      "annotation",
      "panel",
      "background"
    ],
    "runtimeBehavior": "set updates the runtime panel color silently. Inspector color edits remain graph patches.",
    "relatedNodes": [
      "core.comment",
      "core.message"
    ],
    "ports": [
      {
        "id": "set",
        "description": "Updates the panel color from a message such as set #00ff00 without output."
      }
    ],
    "params": [
      {
        "id": "color",
        "description": "Saved panel color as a CSS hex string."
      },
      {
        "id": "label",
        "description": "Optional panel title text."
      },
      {
        "id": "receiveName",
        "description": "Optional string channel name used to receive routed color updates."
      }
    ],
    "example": {
      "title": "Group related controls",
      "description": "Use panels as colored backgrounds behind related controls and comments.",
      "graph": "help/v0.1/nodes/core.panel.help.graph.json"
    }
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "core.preview",
    "summary": "Consumes a GPU texture for preview-oriented output.",
    "description": "Preview is a generic GPU texture sink for examples that are not selecting the final render surface with render.output.",
    "helpGraph": "help/v0.1/nodes/core.preview.help.graph.json",
    "tags": [
      "output",
      "preview",
      "gpu"
    ],
    "runtimeBehavior": "Receives a GPU texture resource and marks it as a preview target.",
    "relatedNodes": [
      "core.gpu-upload",
      "render.output",
      "render.fullscreen-shader"
    ],
    "ports": [
      {
        "id": "texture",
        "description": "Receives the GPU texture resource to preview."
      }
    ],
    "example": {
      "title": "Preview a texture",
      "description": "Connect an explicit GPU texture producer to Preview.",
      "graph": "help/v0.1/nodes/core.preview.help.graph.json"
    }
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "core.receive-bool",
    "summary": "Reads boolean values from a named control channel.",
    "description": "Receive Bool is the matching explicit non-local routing node for Send Bool. It exposes the current channel value or its default value as a typed output.",
    "helpGraph": "help/v0.1/nodes/core.receive-bool.help.graph.json",
    "tags": [
      "routing",
      "receive",
      "control",
      "boolean"
    ],
    "runtimeBehavior": "Runtime resolves value from channel boolean:<name>. If the channel has no value, it uses the node default. bang emits the current resolved value.",
    "relatedNodes": [
      "core.send-bool",
      "core.bang-button"
    ],
    "ports": [
      {
        "id": "bang",
        "description": "Triggers emission of the current channel value or default value."
      },
      {
        "id": "value",
        "description": "Outputs the resolved boolean value."
      }
    ],
    "params": [
      {
        "id": "name",
        "description": "Channel name. Runtime reads boolean:<name>."
      },
      {
        "id": "default",
        "description": "Fallback value used before anything has been sent to the channel."
      }
    ],
    "example": {
      "title": "Read a Bool control value",
      "description": "Receive Bool makes non-local routing explicit in the graph while preserving typed cables.",
      "graph": "help/v0.1/nodes/core.receive-bool.help.graph.json"
    }
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "core.receive-f32",
    "summary": "Reads number.f32 values from a named control channel.",
    "description": "Receive F32 is the matching explicit non-local routing node for Send F32. It exposes the current channel value or its default value as a typed output.",
    "helpGraph": "help/v0.1/nodes/core.receive-f32.help.graph.json",
    "tags": [
      "routing",
      "receive",
      "control",
      "number",
      "f32"
    ],
    "runtimeBehavior": "Runtime resolves value from channel number.f32:<name>. If the channel has no value, it uses the node default. bang emits the current resolved value.",
    "relatedNodes": [
      "core.send-f32",
      "core.bang-button"
    ],
    "ports": [
      {
        "id": "bang",
        "description": "Triggers emission of the current channel value or default value."
      },
      {
        "id": "value",
        "description": "Outputs the resolved number.f32 value."
      }
    ],
    "params": [
      {
        "id": "name",
        "description": "Channel name. Runtime reads number.f32:<name>."
      },
      {
        "id": "default",
        "description": "Fallback value used before anything has been sent to the channel."
      }
    ],
    "example": {
      "title": "Read a F32 control value",
      "description": "Receive F32 makes non-local routing explicit in the graph while preserving typed cables.",
      "graph": "help/v0.1/nodes/core.receive-f32.help.graph.json"
    }
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "core.receive-i32",
    "summary": "Reads number.i32 values from a named control channel.",
    "description": "Receive I32 is the matching explicit non-local routing node for Send I32. It exposes the current channel value or its default value as a typed output.",
    "helpGraph": "help/v0.1/nodes/core.receive-i32.help.graph.json",
    "tags": [
      "routing",
      "receive",
      "control",
      "number",
      "i32"
    ],
    "runtimeBehavior": "Runtime resolves value from channel number.i32:<name>. If the channel has no value, it uses the node default. bang emits the current resolved value.",
    "relatedNodes": [
      "core.send-i32",
      "core.bang-button"
    ],
    "ports": [
      {
        "id": "bang",
        "description": "Triggers emission of the current channel value or default value."
      },
      {
        "id": "value",
        "description": "Outputs the resolved number.i32 value."
      }
    ],
    "params": [
      {
        "id": "name",
        "description": "Channel name. Runtime reads number.i32:<name>."
      },
      {
        "id": "default",
        "description": "Fallback value used before anything has been sent to the channel."
      }
    ],
    "example": {
      "title": "Read a I32 control value",
      "description": "Receive I32 makes non-local routing explicit in the graph while preserving typed cables.",
      "graph": "help/v0.1/nodes/core.receive-i32.help.graph.json"
    }
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "core.receive-rgba",
    "summary": "Reads color.rgba values from a named control channel.",
    "description": "Receive RGBA is the matching explicit non-local routing node for Send RGBA. It exposes the current channel value or its default value as a typed output.",
    "helpGraph": "help/v0.1/nodes/core.receive-rgba.help.graph.json",
    "tags": [
      "routing",
      "receive",
      "control",
      "color",
      "rgba"
    ],
    "runtimeBehavior": "Runtime resolves value from channel color.rgba:<name>. If the channel has no value, it uses the node default. bang emits the current resolved value.",
    "relatedNodes": [
      "core.send-rgba",
      "core.bang-button"
    ],
    "ports": [
      {
        "id": "bang",
        "description": "Triggers emission of the current channel value or default value."
      },
      {
        "id": "value",
        "description": "Outputs the resolved color.rgba value."
      }
    ],
    "params": [
      {
        "id": "name",
        "description": "Channel name. Runtime reads color.rgba:<name>."
      },
      {
        "id": "default",
        "description": "Fallback value used before anything has been sent to the channel."
      }
    ],
    "example": {
      "title": "Read a RGBA control value",
      "description": "Receive RGBA makes non-local routing explicit in the graph while preserving typed cables.",
      "graph": "help/v0.1/nodes/core.receive-rgba.help.graph.json"
    }
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "core.send-bool",
    "summary": "Writes boolean values into a named control channel.",
    "description": "Send Bool is an explicit non-local routing node. It accepts boolean values and stores the latest value in the typed channel identified by its name parameter.",
    "helpGraph": "help/v0.1/nodes/core.send-bool.help.graph.json",
    "tags": [
      "routing",
      "send",
      "control",
      "boolean"
    ],
    "runtimeBehavior": "When in receives a boolean value, Runtime writes it to channel boolean:<name> and emits the sent value in control diagnostics/state.",
    "relatedNodes": [
      "core.receive-bool",
      "ui.toggle"
    ],
    "ports": [
      {
        "id": "in",
        "description": "Receives the boolean value to publish to the named typed channel."
      }
    ],
    "params": [
      {
        "id": "name",
        "description": "Channel name. Runtime stores this as boolean:<name>."
      }
    ],
    "example": {
      "title": "Publish a Bool control value",
      "description": "Connect a typed value or panel control to Send Bool to update a named channel.",
      "graph": "help/v0.1/nodes/core.send-bool.help.graph.json"
    }
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "core.send-f32",
    "summary": "Writes number.f32 values into a named control channel.",
    "description": "Send F32 is an explicit non-local routing node. It accepts number.f32 values and stores the latest value in the typed channel identified by its name parameter.",
    "helpGraph": "help/v0.1/nodes/core.send-f32.help.graph.json",
    "tags": [
      "routing",
      "send",
      "control",
      "number",
      "f32"
    ],
    "runtimeBehavior": "When in receives a number.f32 value, Runtime writes it to channel number.f32:<name> and emits the sent value in control diagnostics/state.",
    "relatedNodes": [
      "core.receive-f32",
      "ui.slider-f32"
    ],
    "ports": [
      {
        "id": "in",
        "description": "Receives the number.f32 value to publish to the named typed channel."
      }
    ],
    "params": [
      {
        "id": "name",
        "description": "Channel name. Runtime stores this as number.f32:<name>."
      }
    ],
    "example": {
      "title": "Publish a F32 control value",
      "description": "Connect a typed value or panel control to Send F32 to update a named channel.",
      "graph": "help/v0.1/nodes/core.send-f32.help.graph.json"
    }
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "core.send-i32",
    "summary": "Writes number.i32 values into a named control channel.",
    "description": "Send I32 is an explicit non-local routing node. It accepts number.i32 values and stores the latest value in the typed channel identified by its name parameter.",
    "helpGraph": "help/v0.1/nodes/core.send-i32.help.graph.json",
    "tags": [
      "routing",
      "send",
      "control",
      "number",
      "i32"
    ],
    "runtimeBehavior": "When in receives a number.i32 value, Runtime writes it to channel number.i32:<name> and emits the sent value in control diagnostics/state.",
    "relatedNodes": [
      "core.receive-i32",
      "core.value-i32"
    ],
    "ports": [
      {
        "id": "in",
        "description": "Receives the number.i32 value to publish to the named typed channel."
      }
    ],
    "params": [
      {
        "id": "name",
        "description": "Channel name. Runtime stores this as number.i32:<name>."
      }
    ],
    "example": {
      "title": "Publish a I32 control value",
      "description": "Connect a typed value or panel control to Send I32 to update a named channel.",
      "graph": "help/v0.1/nodes/core.send-i32.help.graph.json"
    }
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "core.send-rgba",
    "summary": "Writes color.rgba values into a named control channel.",
    "description": "Send RGBA is an explicit non-local routing node. It accepts color.rgba values and stores the latest value in the typed channel identified by its name parameter.",
    "helpGraph": "help/v0.1/nodes/core.send-rgba.help.graph.json",
    "tags": [
      "routing",
      "send",
      "control",
      "color",
      "rgba"
    ],
    "runtimeBehavior": "When in receives a color.rgba value, Runtime writes it to channel color.rgba:<name> and emits the sent value in control diagnostics/state.",
    "relatedNodes": [
      "core.receive-rgba",
      "core.color-rgba"
    ],
    "ports": [
      {
        "id": "in",
        "description": "Receives the color.rgba value to publish to the named typed channel."
      }
    ],
    "params": [
      {
        "id": "name",
        "description": "Channel name. Runtime stores this as color.rgba:<name>."
      }
    ],
    "example": {
      "title": "Publish a RGBA control value",
      "description": "Connect a typed value or panel control to Send RGBA to update a named channel.",
      "graph": "help/v0.1/nodes/core.send-rgba.help.graph.json"
    }
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "core.string",
    "summary": "Stores and emits a string control value.",
    "description": "Use String for labels, symbolic control values, and text payloads that should move through the graph as data.",
    "helpGraph": "help/v0.1/nodes/core.string.help.graph.json",
    "tags": [
      "value",
      "control",
      "text"
    ],
    "runtimeBehavior": "in updates and emits, set updates silently, and bang emits the stored string without changing it.",
    "relatedNodes": [
      "core.message",
      "core.bang-button"
    ],
    "ports": [
      {
        "id": "in",
        "description": "Updates the stored text and emits it."
      },
      {
        "id": "set",
        "description": "Updates the stored text without emitting."
      },
      {
        "id": "bang",
        "description": "Emits the current stored text without changing it."
      },
      {
        "id": "value",
        "description": "Outputs the current text."
      }
    ],
    "params": [
      {
        "id": "value",
        "description": "Saved default text."
      },
      {
        "id": "sendName",
        "description": "Optional typed channel name updated whenever this object emits."
      },
      {
        "id": "receiveName",
        "description": "Optional typed channel name used to receive routed updates."
      }
    ],
    "example": {
      "title": "Store text as data",
      "description": "Use String when text should behave like a stored value, not a one-shot message.",
      "graph": "help/v0.1/nodes/core.string.help.graph.json"
    }
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "core.target",
    "summary": "Receives a normalized floating-point control value.",
    "description": "Value Target is a minimal sink for tutorials and validator examples. It demonstrates value<number.f32> wiring without creating a render output.",
    "helpGraph": "help/v0.1/nodes/core.target.help.graph.json",
    "tags": [
      "value",
      "sink",
      "tutorial"
    ],
    "runtimeBehavior": "Consumes the latest latched number.f32 value.",
    "relatedNodes": [
      "core.value-f32"
    ],
    "ports": [
      {
        "id": "value",
        "description": "Receives a number.f32 value. This tutorial sink constrains the preferred range to 0..1."
      }
    ],
    "example": {
      "title": "Minimal value wiring",
      "description": "Connect F32.value to Value Target.value to test basic type-compatible value flow.",
      "graph": "help/v0.1/nodes/core.target.help.graph.json"
    }
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "core.toggle",
    "summary": "Stores a boolean value and flips it when banged.",
    "description": "Toggle is the performer-facing boolean control. Use Bool when bang should only re-emit the current value; use Toggle when bang should flip the stored state.",
    "docsPath": "docs/nodes/core.toggle.md",
    "helpGraph": "help/v0.1/nodes/core.toggle.help.graph.json",
    "tags": [
      "value",
      "control",
      "boolean"
    ],
    "runtimeBehavior": "in updates and emits, set updates silently, and bang flips the stored boolean before emitting it.",
    "relatedNodes": [
      "core.value-bool",
      "core.bang-button",
      "core.message"
    ],
    "ports": [
      {
        "id": "in",
        "description": "Updates the stored boolean and emits it."
      },
      {
        "id": "set",
        "description": "Updates the stored boolean without emitting."
      },
      {
        "id": "bang",
        "description": "Flips the stored boolean and emits the new value."
      },
      {
        "id": "value",
        "description": "Outputs the current boolean."
      }
    ],
    "params": [
      {
        "id": "value",
        "description": "Saved default boolean value."
      },
      {
        "id": "sendName",
        "description": "Optional typed channel name updated whenever this object emits."
      },
      {
        "id": "receiveName",
        "description": "Optional typed channel name used to receive routed updates."
      }
    ],
    "example": {
      "title": "Bang to flip",
      "description": "Connect Bang Button to Toggle to see event-triggered state changes.",
      "graph": "help/v0.1/nodes/core.toggle.help.graph.json"
    }
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "core.value-bool",
    "summary": "Stores and emits a boolean control value.",
    "description": "Use Bool for an explicit true/false value. Bang emits the current value; it does not toggle.",
    "helpGraph": "help/v0.1/nodes/core.value-bool.help.graph.json",
    "tags": [
      "value",
      "control",
      "boolean"
    ],
    "runtimeBehavior": "in updates and emits, set updates silently, and bang emits the stored boolean without toggling.",
    "relatedNodes": [
      "core.toggle",
      "core.bang-button",
      "render.fullscreen-shader"
    ],
    "ports": [
      {
        "id": "in",
        "description": "Updates the stored value and emits it."
      },
      {
        "id": "set",
        "description": "Updates the stored value without emitting."
      },
      {
        "id": "bang",
        "description": "Emits the current stored value without changing it."
      },
      {
        "id": "value",
        "description": "Outputs the current value."
      }
    ],
    "params": [
      {
        "id": "value",
        "description": "Saved default boolean value."
      },
      {
        "id": "sendName",
        "description": "Optional typed channel name updated whenever this object emits."
      },
      {
        "id": "receiveName",
        "description": "Optional typed channel name used to receive routed updates."
      }
    ],
    "example": {
      "title": "Bool versus Toggle",
      "description": "Bool keeps bang as re-emit behavior; Toggle flips on bang.",
      "graph": "help/v0.1/nodes/core.value-bool.help.graph.json"
    }
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "core.value-f32",
    "summary": "Stores and emits a 32-bit floating-point control value.",
    "description": "Use F32 when a patch needs a generic numeric control value. The graph parameter is the saved default; runtime control events can update the live session value without changing the saved graph.",
    "docsPath": "docs/nodes/core.value-f32.md",
    "helpGraph": "help/v0.1/nodes/core.value-f32.help.graph.json",
    "tags": [
      "value",
      "control",
      "number"
    ],
    "runtimeBehavior": "in updates and emits, set updates silently, and bang emits the stored value without changing it.",
    "relatedNodes": [
      "core.bang-button",
      "core.target",
      "render.fullscreen-shader"
    ],
    "ports": [
      {
        "id": "in",
        "description": "Updates the stored value and emits it."
      },
      {
        "id": "set",
        "description": "Updates the stored value without emitting."
      },
      {
        "id": "bang",
        "description": "Emits the current stored value without changing it."
      },
      {
        "id": "value",
        "description": "Outputs the current value."
      }
    ],
    "params": [
      {
        "id": "value",
        "description": "Saved default numeric value."
      },
      {
        "id": "sendName",
        "description": "Optional typed channel name updated whenever this object emits."
      },
      {
        "id": "receiveName",
        "description": "Optional typed channel name used to receive routed updates."
      }
    ],
    "example": {
      "title": "Drive a shader uniform",
      "description": "Connect value to a fullscreen shader numeric input, then send runtime in/set/bang events while the preview runs.",
      "graph": "help/v0.1/nodes/core.value-f32.help.graph.json"
    }
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "core.value-i32",
    "summary": "Stores and emits a signed integer control value.",
    "description": "Use I32 for discrete numeric controls such as counts, selected indices, and integer mode values.",
    "helpGraph": "help/v0.1/nodes/core.value-i32.help.graph.json",
    "tags": [
      "value",
      "control",
      "integer"
    ],
    "runtimeBehavior": "in updates and emits, set updates silently, and bang emits the stored integer value without changing it.",
    "relatedNodes": [
      "core.bang-button",
      "render.fullscreen-shader"
    ],
    "ports": [
      {
        "id": "in",
        "description": "Updates the stored value and emits it."
      },
      {
        "id": "set",
        "description": "Updates the stored value without emitting."
      },
      {
        "id": "bang",
        "description": "Emits the current stored value without changing it."
      },
      {
        "id": "value",
        "description": "Outputs the current value."
      }
    ],
    "params": [
      {
        "id": "value",
        "description": "Saved default integer value."
      },
      {
        "id": "sendName",
        "description": "Optional typed channel name updated whenever this object emits."
      },
      {
        "id": "receiveName",
        "description": "Optional typed channel name used to receive routed updates."
      }
    ],
    "example": {
      "title": "Trigger an integer value",
      "description": "Use bang to re-emit the current integer after a set event updates it silently.",
      "graph": "help/v0.1/nodes/core.value-i32.help.graph.json"
    }
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "core.video-asset",
    "summary": "Represents a video asset resource.",
    "description": "Video Asset is a resource source. It stores a project-safe assetRef, name, and mimeType; explicit converter nodes preserve graph intent.",
    "helpGraph": "help/v0.1/nodes/core.video-asset.help.graph.json",
    "tags": [
      "media",
      "resource",
      "video"
    ],
    "runtimeBehavior": "Provides an asset.video resource reference for async media loading.",
    "relatedNodes": [
      "core.video-decode",
      "core.gpu-upload"
    ],
    "ports": [
      {
        "id": "asset",
        "description": "Outputs the asset.video resource reference."
      }
    ],
    "params": [
      {
        "id": "assetRef",
        "description": "Persisted project asset reference such as skenion-runtime://assets/asset_abc123. Absolute source paths must not be saved in portable projects."
      },
      {
        "id": "name",
        "description": "Display name for the selected asset."
      },
      {
        "id": "mimeType",
        "description": "MIME type reported by the runtime asset import flow."
      }
    ],
    "example": {
      "title": "Start explicit video conversion",
      "description": "Connect Video Asset to Video Decode before feeding video frames into GPU Upload.",
      "graph": "help/v0.1/nodes/core.video-asset.help.graph.json"
    }
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "core.video-decode",
    "summary": "Decodes a video asset resource into a frame stream.",
    "description": "Video Decode is the explicit adapter between asset.video and stream<video.frame>.",
    "helpGraph": "help/v0.1/nodes/core.video-decode.help.graph.json",
    "tags": [
      "converter",
      "media",
      "video"
    ],
    "runtimeBehavior": "Consumes a video asset resource and emits decoded video frames on the video/frame clock.",
    "relatedNodes": [
      "core.video-asset",
      "core.gpu-upload"
    ],
    "ports": [
      {
        "id": "asset",
        "description": "Receives the video asset resource."
      },
      {
        "id": "frames",
        "description": "Outputs decoded video frames."
      }
    ],
    "example": {
      "title": "Decode before upload",
      "description": "Use Video Decode before GPU Upload; asset resources do not connect directly to GPU texture consumers.",
      "graph": "help/v0.1/nodes/core.video-decode.help.graph.json"
    }
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "render.clear-color",
    "summary": "Produces a GPU texture cleared to one color.",
    "description": "Clear Color is the first simple render producer. It is useful for validating preview lifecycle and render.output selection before adding shader code.",
    "helpGraph": "help/v0.1/nodes/render.clear-color.help.graph.json",
    "tags": [
      "render",
      "gpu",
      "output"
    ],
    "runtimeBehavior": "On each preview frame, produces a gpu.texture2d resource cleared to params.color.",
    "relatedNodes": [
      "render.output",
      "render.fullscreen-shader",
      "core.color-rgba"
    ],
    "ports": [
      {
        "id": "out",
        "description": "Outputs the rendered GPU texture resource."
      }
    ],
    "params": [
      {
        "id": "color",
        "description": "Saved RGBA clear color."
      }
    ],
    "example": {
      "title": "Select a render output",
      "description": "Connect Clear Color.out to Render Output.in to make it the preview scene source.",
      "graph": "help/v0.1/nodes/render.clear-color.help.graph.json"
    }
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "render.fullscreen-shader",
    "summary": "Runs a WGSL fullscreen shader pass.",
    "description": "Fullscreen Shader generates instance input ports from @skenion.uniform annotations. Studio analyzes source explicitly; ports do not mutate while the user is typing.",
    "docsPath": "docs/nodes/render.fullscreen-shader.md",
    "helpGraph": "help/v0.1/nodes/render.fullscreen-shader.help.graph.json",
    "tags": [
      "render",
      "shader",
      "wgsl",
      "gpu"
    ],
    "runtimeBehavior": "Runtime builds a dynamic uniform layout from the synced input ports, generates WGSL support code, and falls back to clear rendering with structured diagnostics on compile failure.",
    "relatedNodes": [
      "core.value-f32",
      "core.color-rgba",
      "render.output"
    ],
    "ports": [
      {
        "id": "out",
        "description": "Outputs the rendered GPU texture resource."
      }
    ],
    "params": [
      {
        "id": "language",
        "description": "Shader language. v0.1 supports wgsl."
      },
      {
        "id": "source",
        "description": "WGSL source containing optional @skenion.uniform annotations."
      }
    ],
    "example": {
      "title": "Sync shader inputs",
      "description": "Analyze annotations, sync generated input ports, connect typed value nodes, and feed Render Output.",
      "graph": "help/v0.1/nodes/render.fullscreen-shader.help.graph.json"
    }
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "render.output",
    "summary": "Selects the GPU texture rendered by the preview window.",
    "description": "Render Output makes the final render source explicit. Runtime preview selection follows the node connected to this input instead of guessing the first render node.",
    "helpGraph": "help/v0.1/nodes/render.output.help.graph.json",
    "tags": [
      "render",
      "output",
      "preview"
    ],
    "runtimeBehavior": "Consumes one gpu.texture2d resource and marks it as the session preview/render output.",
    "relatedNodes": [
      "render.clear-color",
      "render.fullscreen-shader"
    ],
    "ports": [
      {
        "id": "in",
        "description": "Receives the GPU texture resource selected for output."
      }
    ],
    "example": {
      "title": "Make output explicit",
      "description": "Connect a render producer into Render Output so Runtime knows which scene to preview.",
      "graph": "help/v0.1/nodes/render.output.help.graph.json"
    }
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "ui.button",
    "summary": "Emits a bang event when clicked or when any input arrives.",
    "description": "Button is the Max/Pd-like bang control. Runtime clicks and incoming messages both emit event.bang without mutating the graph.",
    "helpGraph": "help/v0.1/nodes/ui.button.help.graph.json",
    "tags": [
      "ui",
      "panel",
      "event",
      "bang"
    ],
    "runtimeBehavior": "Runtime click or any input on in emits event.bang from bang. If sendName is set, the bang is also published to the named event.bang channel.",
    "relatedNodes": [
      "core.message",
      "core.event-log",
      "core.message"
    ],
    "ports": [
      {
        "id": "in",
        "description": "Accepts any incoming message or value and converts it to bang."
      },
      {
        "id": "bang",
        "description": "Emits an event.bang when the control is clicked."
      }
    ],
    "params": [
      {
        "id": "label",
        "description": "Text shown on the runtime control."
      },
      {
        "id": "sendName",
        "description": "Optional event.bang channel name updated whenever the button emits."
      },
      {
        "id": "receiveName",
        "description": "Optional event.bang channel name that can trigger this button."
      }
    ],
    "example": {
      "title": "Trigger a message",
      "description": "Use Button to trigger event-oriented nodes without changing the graph.",
      "graph": "help/v0.1/nodes/ui.button.help.graph.json"
    }
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "ui.slider-f32",
    "summary": "Emits number.f32 values from a runtime slider control.",
    "description": "Slider F32 is a panel control node for performer-facing numeric input. Incoming values can update it, and moving the runtime slider emits a typed value event without creating a graph patch.",
    "helpGraph": "help/v0.1/nodes/ui.slider-f32.help.graph.json",
    "tags": [
      "ui",
      "panel",
      "value",
      "f32"
    ],
    "runtimeBehavior": "Runtime slider changes update the control state and emit number.f32 from value. in updates and emits, set updates silently, and bang emits the current value.",
    "relatedNodes": [
      "core.value-f32"
    ],
    "ports": [
      {
        "id": "in",
        "description": "Updates the slider value and emits number.f32."
      },
      {
        "id": "set",
        "description": "Updates the slider value without output."
      },
      {
        "id": "bang",
        "description": "Emits the current slider value."
      },
      {
        "id": "value",
        "description": "Emits the current slider value as number.f32."
      }
    ],
    "params": [
      {
        "id": "label",
        "description": "Text shown on the runtime control."
      },
      {
        "id": "value",
        "description": "Initial slider value saved in the graph."
      },
      {
        "id": "min",
        "description": "Minimum slider value."
      },
      {
        "id": "max",
        "description": "Maximum slider value."
      },
      {
        "id": "step",
        "description": "Slider increment."
      },
      {
        "id": "sendName",
        "description": "Optional number.f32 channel name updated whenever the slider emits."
      },
      {
        "id": "receiveName",
        "description": "Optional number.f32 channel name used to receive routed slider updates."
      }
    ],
    "example": {
      "title": "Drive a shader uniform",
      "description": "Connect Slider F32 directly to a shader input or give it sendName for named routing.",
      "graph": "help/v0.1/nodes/ui.slider-f32.help.graph.json"
    }
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "ui.toggle",
    "summary": "Emits boolean values from a Max/Pd-like toggle control.",
    "description": "UI Toggle is a panel control node. Click or bang flips runtime state, 0/1/off/on set and emit, and set messages update silently without patching the graph.",
    "helpGraph": "help/v0.1/nodes/ui.toggle.help.graph.json",
    "tags": [
      "ui",
      "panel",
      "value",
      "boolean"
    ],
    "runtimeBehavior": "bang flips and emits. 0/1/off/on/false/true update and emit. set 0, set 1, set off, and set on update the runtime state without output.",
    "relatedNodes": [
      "core.value-bool",
      "ui.button",
      "core.message"
    ],
    "ports": [
      {
        "id": "in",
        "description": "Accepts bang, boolean, 0/1, or off/on style messages and emits the resulting boolean."
      },
      {
        "id": "set",
        "description": "Updates the stored toggle state without output."
      },
      {
        "id": "value",
        "description": "Emits the current toggle value as boolean."
      }
    ],
    "params": [
      {
        "id": "label",
        "description": "Text shown on the runtime control."
      },
      {
        "id": "value",
        "description": "Initial boolean value saved in the graph."
      },
      {
        "id": "sendName",
        "description": "Optional boolean channel name updated whenever the toggle emits."
      },
      {
        "id": "receiveName",
        "description": "Optional boolean channel name used to receive routed toggle updates."
      }
    ],
    "example": {
      "title": "Drive a boolean value",
      "description": "Connect UI Toggle directly to a boolean input or give it sendName for named routing.",
      "graph": "help/v0.1/nodes/ui.toggle.help.graph.json"
    }
  }
] satisfies BuiltinNodeHelpV01[];

export const builtinNodeHelpGraphsV01 = [
  {
    "id": "core.bang-button",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-core-bang-button",
      "revision": "1",
      "nodes": [
        {
          "id": "bang_1",
          "kind": "core.bang-button",
          "kindVersion": "0.1.0",
          "params": {},
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
          ]
        },
        {
          "id": "log_1",
          "kind": "core.event-log",
          "kindVersion": "0.1.0",
          "params": {},
          "ports": [
            {
              "id": "bang",
              "direction": "input",
              "label": "Bang",
              "type": {
                "flow": "event",
                "dataKind": "event.bang"
              },
              "activation": "trigger"
            }
          ]
        }
      ],
      "edges": [
        {
          "from": {
            "node": "bang_1",
            "port": "bang"
          },
          "to": {
            "node": "log_1",
            "port": "bang"
          }
        }
      ]
    }
  },
  {
    "id": "core.color-rgba",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-core-color-rgba",
      "revision": "1",
      "nodes": [
        {
          "id": "note_1",
          "kind": "core.comment",
          "kindVersion": "0.1.0",
          "params": {
            "text": "RGBA controls shader tint uniforms with normalized components."
          },
          "ports": []
        },
        {
          "id": "tint_1",
          "kind": "core.color-rgba",
          "kindVersion": "0.1.0",
          "params": {
            "value": [
              1,
              0.2,
              0.1,
              1
            ]
          },
          "ports": [
            {
              "id": "in",
              "direction": "input",
              "label": "In",
              "type": {
                "flow": "value",
                "dataKind": "color.rgba"
              },
              "activation": "trigger"
            },
            {
              "id": "set",
              "direction": "input",
              "label": "Set",
              "type": {
                "flow": "value",
                "dataKind": "color.rgba"
              },
              "activation": "latched"
            },
            {
              "id": "bang",
              "direction": "input",
              "label": "Bang",
              "type": {
                "flow": "event",
                "dataKind": "event.bang"
              },
              "activation": "trigger"
            },
            {
              "id": "value",
              "direction": "output",
              "label": "Color",
              "type": {
                "flow": "value",
                "dataKind": "color.rgba"
              }
            }
          ]
        },
        {
          "id": "shader_1",
          "kind": "render.fullscreen-shader",
          "kindVersion": "0.1.0",
          "params": {
            "language": "wgsl",
            "source": "// @skenion.uniform tint color.rgba default=[1,0.2,0.1,1]\nfn fs_main() -> @location(0) vec4<f32> { return skenion_uniforms.tint; }"
          },
          "ports": [
            {
              "id": "tint",
              "direction": "input",
              "label": "Tint",
              "type": {
                "flow": "value",
                "dataKind": "color.rgba"
              },
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
          ]
        },
        {
          "id": "output_1",
          "kind": "render.output",
          "kindVersion": "0.1.0",
          "params": {},
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
              "activation": "latched"
            }
          ]
        }
      ],
      "edges": [
        {
          "from": {
            "node": "tint_1",
            "port": "value"
          },
          "to": {
            "node": "shader_1",
            "port": "tint"
          }
        },
        {
          "from": {
            "node": "shader_1",
            "port": "out"
          },
          "to": {
            "node": "output_1",
            "port": "in"
          }
        }
      ]
    }
  },
  {
    "id": "core.comment",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-core-comment",
      "revision": "1",
      "nodes": [
        {
          "id": "note_1",
          "kind": "core.comment",
          "kindVersion": "0.1.0",
          "params": {
            "text": "Comments annotate a patch. set <text> updates comment text state without output."
          },
          "ports": [
            {
              "id": "set",
              "direction": "input",
              "label": "Set",
              "type": {
                "flow": "value",
                "dataKind": "message.any"
              },
              "required": false,
              "activation": "latched"
            }
          ]
        },
        {
          "id": "note_2",
          "kind": "core.comment",
          "kindVersion": "0.1.0",
          "params": {
            "text": "Use comments near important control or render decisions."
          },
          "ports": [
            {
              "id": "set",
              "direction": "input",
              "label": "Set",
              "type": {
                "flow": "value",
                "dataKind": "message.any"
              },
              "required": false,
              "activation": "latched"
            }
          ]
        }
      ],
      "edges": []
    }
  },
  {
    "id": "core.event-log",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-core-event-log",
      "revision": "1",
      "nodes": [
        {
          "id": "note_1",
          "kind": "core.comment",
          "kindVersion": "0.1.0",
          "params": {
            "text": "Event Log is a diagnostic sink for bang events."
          },
          "ports": []
        },
        {
          "id": "bang_1",
          "kind": "core.bang-button",
          "kindVersion": "0.1.0",
          "params": {},
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
          ]
        },
        {
          "id": "log_1",
          "kind": "core.event-log",
          "kindVersion": "0.1.0",
          "params": {},
          "ports": [
            {
              "id": "bang",
              "direction": "input",
              "label": "Bang",
              "type": {
                "flow": "event",
                "dataKind": "event.bang"
              },
              "activation": "trigger"
            }
          ]
        }
      ],
      "edges": [
        {
          "from": {
            "node": "bang_1",
            "port": "bang"
          },
          "to": {
            "node": "log_1",
            "port": "bang"
          }
        }
      ]
    }
  },
  {
    "id": "core.gpu-upload",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-core-gpu-upload",
      "revision": "1",
      "nodes": [
        {
          "id": "asset_1",
          "kind": "core.video-asset",
          "kindVersion": "0.1.0",
          "params": {
            "src": "example.mp4"
          },
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
          ]
        },
        {
          "id": "decode_1",
          "kind": "core.video-decode",
          "kindVersion": "0.1.0",
          "params": {},
          "ports": [
            {
              "id": "asset",
              "direction": "input",
              "label": "Asset",
              "type": {
                "flow": "resource",
                "dataKind": "asset.video"
              },
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
          ]
        },
        {
          "id": "upload_1",
          "kind": "core.gpu-upload",
          "kindVersion": "0.1.0",
          "params": {},
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
          ]
        },
        {
          "id": "preview_1",
          "kind": "core.preview",
          "kindVersion": "0.1.0",
          "params": {},
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
              "activation": "latched"
            }
          ]
        }
      ],
      "edges": [
        {
          "from": {
            "node": "asset_1",
            "port": "asset"
          },
          "to": {
            "node": "decode_1",
            "port": "asset"
          }
        },
        {
          "from": {
            "node": "decode_1",
            "port": "frames"
          },
          "to": {
            "node": "upload_1",
            "port": "frames"
          }
        },
        {
          "from": {
            "node": "upload_1",
            "port": "texture"
          },
          "to": {
            "node": "preview_1",
            "port": "texture"
          }
        }
      ]
    }
  },
  {
    "id": "core.message",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-core-message",
      "revision": "1",
      "nodes": [
        {
          "id": "note_1",
          "kind": "core.comment",
          "kindVersion": "0.1.0",
          "params": {
            "text": "Message emits its saved text when clicked, banged, or triggered. set updates the runtime message silently."
          },
          "ports": []
        },
        {
          "id": "bang_1",
          "kind": "core.bang-button",
          "kindVersion": "0.1.0",
          "params": {},
          "ports": [
            {
              "id": "in",
              "direction": "input",
              "label": "In",
              "type": {
                "flow": "value",
                "dataKind": "message.any"
              },
              "activation": "trigger"
            },
            {
              "id": "set",
              "direction": "input",
              "label": "Set",
              "type": {
                "flow": "value",
                "dataKind": "message.any"
              },
              "activation": "latched"
            },
            {
              "id": "bang",
              "direction": "output",
              "label": "Bang",
              "type": {
                "flow": "event",
                "dataKind": "event.bang"
              }
            }
          ]
        },
        {
          "id": "message_1",
          "kind": "core.message",
          "kindVersion": "0.1.0",
          "params": {
            "value": "render now"
          },
          "ports": [
            {
              "id": "bang",
              "direction": "input",
              "label": "Bang",
              "type": {
                "flow": "event",
                "dataKind": "event.bang"
              },
              "activation": "trigger"
            },
            {
              "id": "value",
              "direction": "output",
              "label": "Value",
              "type": {
                "flow": "value",
                "dataKind": "string"
              }
            }
          ]
        }
      ],
      "edges": [
        {
          "from": {
            "node": "bang_1",
            "port": "bang"
          },
          "to": {
            "node": "message_1",
            "port": "bang"
          }
        }
      ]
    }
  },
  {
    "id": "core.panel",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-core-panel",
      "revision": "1",
      "nodes": [
        {
          "id": "panel_1",
          "kind": "core.panel",
          "kindVersion": "0.1.0",
          "params": {
            "label": "Panel",
            "color": "transparent"
          },
          "ports": [
            {
              "id": "set",
              "direction": "input",
              "label": "Set",
              "type": {
                "flow": "value",
                "dataKind": "message.any"
              },
              "required": false,
              "activation": "latched"
            }
          ]
        },
        {
          "id": "note_1",
          "kind": "core.comment",
          "kindVersion": "0.1.0",
          "params": {
            "text": "Panel is a colored visual grouping object. set #00ff00 updates its runtime color state."
          },
          "ports": []
        }
      ],
      "edges": []
    }
  },
  {
    "id": "core.preview",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-core-preview",
      "revision": "1",
      "nodes": [
        {
          "id": "clear_1",
          "kind": "render.clear-color",
          "kindVersion": "0.1.0",
          "params": {
            "color": [
              0.1,
              0.2,
              0.4,
              1
            ]
          },
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
          ]
        },
        {
          "id": "preview_1",
          "kind": "core.preview",
          "kindVersion": "0.1.0",
          "params": {},
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
              "activation": "latched"
            }
          ]
        }
      ],
      "edges": [
        {
          "from": {
            "node": "clear_1",
            "port": "out"
          },
          "to": {
            "node": "preview_1",
            "port": "texture"
          }
        }
      ]
    }
  },
  {
    "id": "core.receive-bool",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-core-receive-bool",
      "revision": "1",
      "nodes": [
        {
          "id": "note_1",
          "kind": "core.comment",
          "kindVersion": "0.1.0",
          "params": {
            "text": "Receive Bool resolves the latest typed channel value or the node default."
          },
          "ports": []
        },
        {
          "id": "bang_1",
          "kind": "core.bang-button",
          "kindVersion": "0.1.0",
          "params": {},
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
          ]
        },
        {
          "id": "receive_1",
          "kind": "core.receive-bool",
          "kindVersion": "0.1.0",
          "params": {
            "name": "enabled",
            "default": false
          },
          "ports": [
            {
              "id": "bang",
              "direction": "input",
              "label": "Bang",
              "type": {
                "flow": "event",
                "dataKind": "event.bang"
              },
              "required": false,
              "activation": "trigger"
            },
            {
              "id": "value",
              "direction": "output",
              "label": "Bool",
              "type": {
                "flow": "value",
                "dataKind": "boolean"
              }
            }
          ]
        }
      ],
      "edges": [
        {
          "from": {
            "node": "bang_1",
            "port": "bang"
          },
          "to": {
            "node": "receive_1",
            "port": "bang"
          }
        }
      ]
    }
  },
  {
    "id": "core.receive-f32",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-core-receive-f32",
      "revision": "1",
      "nodes": [
        {
          "id": "note_1",
          "kind": "core.comment",
          "kindVersion": "0.1.0",
          "params": {
            "text": "Receive F32 resolves the latest typed channel value or the node default."
          },
          "ports": []
        },
        {
          "id": "bang_1",
          "kind": "core.bang-button",
          "kindVersion": "0.1.0",
          "params": {},
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
          ]
        },
        {
          "id": "receive_1",
          "kind": "core.receive-f32",
          "kindVersion": "0.1.0",
          "params": {
            "name": "speed",
            "default": 0
          },
          "ports": [
            {
              "id": "bang",
              "direction": "input",
              "label": "Bang",
              "type": {
                "flow": "event",
                "dataKind": "event.bang"
              },
              "required": false,
              "activation": "trigger"
            },
            {
              "id": "value",
              "direction": "output",
              "label": "F32",
              "type": {
                "flow": "value",
                "dataKind": "number.f32"
              }
            }
          ]
        }
      ],
      "edges": [
        {
          "from": {
            "node": "bang_1",
            "port": "bang"
          },
          "to": {
            "node": "receive_1",
            "port": "bang"
          }
        }
      ]
    }
  },
  {
    "id": "core.receive-i32",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-core-receive-i32",
      "revision": "1",
      "nodes": [
        {
          "id": "note_1",
          "kind": "core.comment",
          "kindVersion": "0.1.0",
          "params": {
            "text": "Receive I32 resolves the latest typed channel value or the node default."
          },
          "ports": []
        },
        {
          "id": "bang_1",
          "kind": "core.bang-button",
          "kindVersion": "0.1.0",
          "params": {},
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
          ]
        },
        {
          "id": "receive_1",
          "kind": "core.receive-i32",
          "kindVersion": "0.1.0",
          "params": {
            "name": "speed",
            "default": 0
          },
          "ports": [
            {
              "id": "bang",
              "direction": "input",
              "label": "Bang",
              "type": {
                "flow": "event",
                "dataKind": "event.bang"
              },
              "required": false,
              "activation": "trigger"
            },
            {
              "id": "value",
              "direction": "output",
              "label": "I32",
              "type": {
                "flow": "value",
                "dataKind": "number.i32"
              }
            }
          ]
        }
      ],
      "edges": [
        {
          "from": {
            "node": "bang_1",
            "port": "bang"
          },
          "to": {
            "node": "receive_1",
            "port": "bang"
          }
        }
      ]
    }
  },
  {
    "id": "core.receive-rgba",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-core-receive-rgba",
      "revision": "1",
      "nodes": [
        {
          "id": "note_1",
          "kind": "core.comment",
          "kindVersion": "0.1.0",
          "params": {
            "text": "Receive RGBA resolves the latest typed channel value or the node default."
          },
          "ports": []
        },
        {
          "id": "bang_1",
          "kind": "core.bang-button",
          "kindVersion": "0.1.0",
          "params": {},
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
          ]
        },
        {
          "id": "receive_1",
          "kind": "core.receive-rgba",
          "kindVersion": "0.1.0",
          "params": {
            "name": "tint",
            "default": [
              1,
              1,
              1,
              1
            ]
          },
          "ports": [
            {
              "id": "bang",
              "direction": "input",
              "label": "Bang",
              "type": {
                "flow": "event",
                "dataKind": "event.bang"
              },
              "required": false,
              "activation": "trigger"
            },
            {
              "id": "value",
              "direction": "output",
              "label": "Color",
              "type": {
                "flow": "value",
                "dataKind": "color.rgba"
              }
            }
          ]
        }
      ],
      "edges": [
        {
          "from": {
            "node": "bang_1",
            "port": "bang"
          },
          "to": {
            "node": "receive_1",
            "port": "bang"
          }
        }
      ]
    }
  },
  {
    "id": "core.send-bool",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-core-send-bool",
      "revision": "1",
      "nodes": [
        {
          "id": "note_1",
          "kind": "core.comment",
          "kindVersion": "0.1.0",
          "params": {
            "text": "Send Bool writes to a typed channel by name. It is explicit graph routing, not a hidden read."
          },
          "ports": []
        },
        {
          "id": "source_1",
          "kind": "ui.toggle",
          "kindVersion": "0.1.0",
          "params": {
            "label": "Enabled",
            "value": true
          },
          "ports": [
            {
              "id": "value",
              "direction": "output",
              "label": "Value",
              "type": {
                "flow": "value",
                "dataKind": "boolean"
              }
            }
          ]
        },
        {
          "id": "send_1",
          "kind": "core.send-bool",
          "kindVersion": "0.1.0",
          "params": {
            "name": "enabled"
          },
          "ports": [
            {
              "id": "in",
              "direction": "input",
              "label": "In",
              "type": {
                "flow": "value",
                "dataKind": "boolean"
              },
              "required": true,
              "activation": "trigger"
            }
          ]
        }
      ],
      "edges": [
        {
          "from": {
            "node": "source_1",
            "port": "value"
          },
          "to": {
            "node": "send_1",
            "port": "in"
          }
        }
      ]
    }
  },
  {
    "id": "core.send-f32",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-core-send-f32",
      "revision": "1",
      "nodes": [
        {
          "id": "note_1",
          "kind": "core.comment",
          "kindVersion": "0.1.0",
          "params": {
            "text": "Send F32 writes to a typed channel by name. It is explicit graph routing, not a hidden read."
          },
          "ports": []
        },
        {
          "id": "source_1",
          "kind": "ui.slider-f32",
          "kindVersion": "0.1.0",
          "params": {
            "label": "Speed",
            "value": 0.5,
            "min": 0,
            "max": 2,
            "step": 0.01
          },
          "ports": [
            {
              "id": "value",
              "direction": "output",
              "label": "Value",
              "type": {
                "flow": "value",
                "dataKind": "number.f32"
              }
            }
          ]
        },
        {
          "id": "send_1",
          "kind": "core.send-f32",
          "kindVersion": "0.1.0",
          "params": {
            "name": "speed"
          },
          "ports": [
            {
              "id": "in",
              "direction": "input",
              "label": "In",
              "type": {
                "flow": "value",
                "dataKind": "number.f32"
              },
              "required": true,
              "activation": "trigger"
            }
          ]
        }
      ],
      "edges": [
        {
          "from": {
            "node": "source_1",
            "port": "value"
          },
          "to": {
            "node": "send_1",
            "port": "in"
          }
        }
      ]
    }
  },
  {
    "id": "core.send-i32",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-core-send-i32",
      "revision": "1",
      "nodes": [
        {
          "id": "note_1",
          "kind": "core.comment",
          "kindVersion": "0.1.0",
          "params": {
            "text": "Send I32 writes to a typed channel by name. It is explicit graph routing, not a hidden read."
          },
          "ports": []
        },
        {
          "id": "source_1",
          "kind": "core.value-i32",
          "kindVersion": "0.1.0",
          "params": {
            "value": 8
          },
          "ports": [
            {
              "id": "value",
              "direction": "output",
              "label": "Value",
              "type": {
                "flow": "value",
                "dataKind": "number.i32"
              }
            }
          ]
        },
        {
          "id": "send_1",
          "kind": "core.send-i32",
          "kindVersion": "0.1.0",
          "params": {
            "name": "speed"
          },
          "ports": [
            {
              "id": "in",
              "direction": "input",
              "label": "In",
              "type": {
                "flow": "value",
                "dataKind": "number.i32"
              },
              "required": true,
              "activation": "trigger"
            }
          ]
        }
      ],
      "edges": [
        {
          "from": {
            "node": "source_1",
            "port": "value"
          },
          "to": {
            "node": "send_1",
            "port": "in"
          }
        }
      ]
    }
  },
  {
    "id": "core.send-rgba",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-core-send-rgba",
      "revision": "1",
      "nodes": [
        {
          "id": "note_1",
          "kind": "core.comment",
          "kindVersion": "0.1.0",
          "params": {
            "text": "Send RGBA writes to a typed channel by name. It is explicit graph routing, not a hidden read."
          },
          "ports": []
        },
        {
          "id": "source_1",
          "kind": "core.color-rgba",
          "kindVersion": "0.1.0",
          "params": {
            "value": [
              0.2,
              0.6,
              1,
              1
            ]
          },
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
          ]
        },
        {
          "id": "send_1",
          "kind": "core.send-rgba",
          "kindVersion": "0.1.0",
          "params": {
            "name": "tint"
          },
          "ports": [
            {
              "id": "in",
              "direction": "input",
              "label": "In",
              "type": {
                "flow": "value",
                "dataKind": "color.rgba"
              },
              "required": true,
              "activation": "trigger"
            }
          ]
        }
      ],
      "edges": [
        {
          "from": {
            "node": "source_1",
            "port": "value"
          },
          "to": {
            "node": "send_1",
            "port": "in"
          }
        }
      ]
    }
  },
  {
    "id": "core.string",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-core-string",
      "revision": "1",
      "nodes": [
        {
          "id": "note_1",
          "kind": "core.comment",
          "kindVersion": "0.1.0",
          "params": {
            "text": "String stores text as graph data. Message emits text only when triggered."
          },
          "ports": []
        },
        {
          "id": "bang_1",
          "kind": "core.bang-button",
          "kindVersion": "0.1.0",
          "params": {},
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
          ]
        },
        {
          "id": "text_1",
          "kind": "core.string",
          "kindVersion": "0.1.0",
          "params": {
            "value": "hello"
          },
          "ports": [
            {
              "id": "in",
              "direction": "input",
              "label": "In",
              "type": {
                "flow": "value",
                "dataKind": "string"
              },
              "activation": "trigger"
            },
            {
              "id": "set",
              "direction": "input",
              "label": "Set",
              "type": {
                "flow": "value",
                "dataKind": "string"
              },
              "activation": "latched"
            },
            {
              "id": "bang",
              "direction": "input",
              "label": "Bang",
              "type": {
                "flow": "event",
                "dataKind": "event.bang"
              },
              "activation": "trigger"
            },
            {
              "id": "value",
              "direction": "output",
              "label": "Value",
              "type": {
                "flow": "value",
                "dataKind": "string"
              }
            }
          ]
        }
      ],
      "edges": [
        {
          "from": {
            "node": "bang_1",
            "port": "bang"
          },
          "to": {
            "node": "text_1",
            "port": "bang"
          }
        }
      ]
    }
  },
  {
    "id": "core.target",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-core-target",
      "revision": "1",
      "nodes": [
        {
          "id": "value_1",
          "kind": "core.value-f32",
          "kindVersion": "0.1.0",
          "params": {
            "value": 0.75
          },
          "ports": [
            {
              "id": "value",
              "direction": "output",
              "label": "Value",
              "type": {
                "flow": "value",
                "dataKind": "number.f32"
              }
            }
          ]
        },
        {
          "id": "target_1",
          "kind": "core.target",
          "kindVersion": "0.1.0",
          "params": {},
          "ports": [
            {
              "id": "value",
              "direction": "input",
              "label": "Value",
              "type": {
                "flow": "value",
                "dataKind": "number.f32"
              },
              "activation": "latched"
            }
          ]
        }
      ],
      "edges": [
        {
          "from": {
            "node": "value_1",
            "port": "value"
          },
          "to": {
            "node": "target_1",
            "port": "value"
          }
        }
      ]
    }
  },
  {
    "id": "core.toggle",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-core-toggle",
      "revision": "1",
      "nodes": [
        {
          "id": "note_1",
          "kind": "core.comment",
          "kindVersion": "0.1.0",
          "params": {
            "text": "Toggle flips on bang. Bool re-emits on bang."
          },
          "ports": []
        },
        {
          "id": "bang_1",
          "kind": "core.bang-button",
          "kindVersion": "0.1.0",
          "params": {},
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
          ]
        },
        {
          "id": "toggle_1",
          "kind": "core.toggle",
          "kindVersion": "0.1.0",
          "params": {
            "value": false
          },
          "ports": [
            {
              "id": "in",
              "direction": "input",
              "label": "In",
              "type": {
                "flow": "value",
                "dataKind": "boolean"
              },
              "activation": "trigger"
            },
            {
              "id": "set",
              "direction": "input",
              "label": "Set",
              "type": {
                "flow": "value",
                "dataKind": "boolean"
              },
              "activation": "latched"
            },
            {
              "id": "bang",
              "direction": "input",
              "label": "Bang",
              "type": {
                "flow": "event",
                "dataKind": "event.bang"
              },
              "activation": "trigger"
            },
            {
              "id": "value",
              "direction": "output",
              "label": "Value",
              "type": {
                "flow": "value",
                "dataKind": "boolean"
              }
            }
          ]
        }
      ],
      "edges": [
        {
          "from": {
            "node": "bang_1",
            "port": "bang"
          },
          "to": {
            "node": "toggle_1",
            "port": "bang"
          }
        }
      ]
    }
  },
  {
    "id": "core.value-bool",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-core-value-bool",
      "revision": "1",
      "nodes": [
        {
          "id": "note_1",
          "kind": "core.comment",
          "kindVersion": "0.1.0",
          "params": {
            "text": "Bool re-emits its stored boolean on bang. It does not flip state."
          },
          "ports": []
        },
        {
          "id": "bang_1",
          "kind": "core.bang-button",
          "kindVersion": "0.1.0",
          "params": {},
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
          ]
        },
        {
          "id": "value_1",
          "kind": "core.value-bool",
          "kindVersion": "0.1.0",
          "params": {
            "value": true
          },
          "ports": [
            {
              "id": "in",
              "direction": "input",
              "label": "In",
              "type": {
                "flow": "value",
                "dataKind": "boolean"
              },
              "activation": "trigger"
            },
            {
              "id": "set",
              "direction": "input",
              "label": "Set",
              "type": {
                "flow": "value",
                "dataKind": "boolean"
              },
              "activation": "latched"
            },
            {
              "id": "bang",
              "direction": "input",
              "label": "Bang",
              "type": {
                "flow": "event",
                "dataKind": "event.bang"
              },
              "activation": "trigger"
            },
            {
              "id": "value",
              "direction": "output",
              "label": "Value",
              "type": {
                "flow": "value",
                "dataKind": "boolean"
              }
            }
          ]
        },
        {
          "id": "toggle_1",
          "kind": "core.toggle",
          "kindVersion": "0.1.0",
          "params": {
            "value": false
          },
          "ports": [
            {
              "id": "in",
              "direction": "input",
              "label": "In",
              "type": {
                "flow": "value",
                "dataKind": "boolean"
              },
              "activation": "trigger"
            },
            {
              "id": "set",
              "direction": "input",
              "label": "Set",
              "type": {
                "flow": "value",
                "dataKind": "boolean"
              },
              "activation": "latched"
            },
            {
              "id": "bang",
              "direction": "input",
              "label": "Bang",
              "type": {
                "flow": "event",
                "dataKind": "event.bang"
              },
              "activation": "trigger"
            },
            {
              "id": "value",
              "direction": "output",
              "label": "Value",
              "type": {
                "flow": "value",
                "dataKind": "boolean"
              }
            }
          ]
        }
      ],
      "edges": [
        {
          "from": {
            "node": "bang_1",
            "port": "bang"
          },
          "to": {
            "node": "value_1",
            "port": "bang"
          }
        },
        {
          "from": {
            "node": "value_1",
            "port": "value"
          },
          "to": {
            "node": "toggle_1",
            "port": "set"
          }
        }
      ]
    }
  },
  {
    "id": "core.value-f32",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-core-value-f32",
      "revision": "1",
      "nodes": [
        {
          "id": "note_1",
          "kind": "core.comment",
          "kindVersion": "0.1.0",
          "params": {
            "text": "F32 stores a number. in emits, set stores silently, bang emits the current value."
          },
          "ports": []
        },
        {
          "id": "bang_1",
          "kind": "core.bang-button",
          "kindVersion": "0.1.0",
          "params": {},
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
          ]
        },
        {
          "id": "value_1",
          "kind": "core.value-f32",
          "kindVersion": "0.1.0",
          "params": {
            "value": 0.5
          },
          "ports": [
            {
              "id": "in",
              "direction": "input",
              "label": "In",
              "type": {
                "flow": "value",
                "dataKind": "number.f32"
              },
              "activation": "trigger"
            },
            {
              "id": "set",
              "direction": "input",
              "label": "Set",
              "type": {
                "flow": "value",
                "dataKind": "number.f32"
              },
              "activation": "latched"
            },
            {
              "id": "bang",
              "direction": "input",
              "label": "Bang",
              "type": {
                "flow": "event",
                "dataKind": "event.bang"
              },
              "activation": "trigger"
            },
            {
              "id": "value",
              "direction": "output",
              "label": "Value",
              "type": {
                "flow": "value",
                "dataKind": "number.f32"
              }
            }
          ]
        },
        {
          "id": "target_1",
          "kind": "core.target",
          "kindVersion": "0.1.0",
          "params": {},
          "ports": [
            {
              "id": "value",
              "direction": "input",
              "label": "Value",
              "type": {
                "flow": "value",
                "dataKind": "number.f32"
              },
              "activation": "latched"
            }
          ]
        }
      ],
      "edges": [
        {
          "from": {
            "node": "bang_1",
            "port": "bang"
          },
          "to": {
            "node": "value_1",
            "port": "bang"
          }
        },
        {
          "from": {
            "node": "value_1",
            "port": "value"
          },
          "to": {
            "node": "target_1",
            "port": "value"
          }
        }
      ]
    }
  },
  {
    "id": "core.value-i32",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-core-value-i32",
      "revision": "1",
      "nodes": [
        {
          "id": "note_1",
          "kind": "core.comment",
          "kindVersion": "0.1.0",
          "params": {
            "text": "I32 stores discrete integer values such as counts or modes."
          },
          "ports": []
        },
        {
          "id": "bang_1",
          "kind": "core.bang-button",
          "kindVersion": "0.1.0",
          "params": {},
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
          ]
        },
        {
          "id": "value_1",
          "kind": "core.value-i32",
          "kindVersion": "0.1.0",
          "params": {
            "value": 8
          },
          "ports": [
            {
              "id": "in",
              "direction": "input",
              "label": "In",
              "type": {
                "flow": "value",
                "dataKind": "number.i32"
              },
              "activation": "trigger"
            },
            {
              "id": "set",
              "direction": "input",
              "label": "Set",
              "type": {
                "flow": "value",
                "dataKind": "number.i32"
              },
              "activation": "latched"
            },
            {
              "id": "bang",
              "direction": "input",
              "label": "Bang",
              "type": {
                "flow": "event",
                "dataKind": "event.bang"
              },
              "activation": "trigger"
            },
            {
              "id": "value",
              "direction": "output",
              "label": "Value",
              "type": {
                "flow": "value",
                "dataKind": "number.i32"
              }
            }
          ]
        }
      ],
      "edges": [
        {
          "from": {
            "node": "bang_1",
            "port": "bang"
          },
          "to": {
            "node": "value_1",
            "port": "bang"
          }
        }
      ]
    }
  },
  {
    "id": "core.video-asset",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-core-video-asset",
      "revision": "1",
      "nodes": [
        {
          "id": "note_1",
          "kind": "core.comment",
          "kindVersion": "0.1.0",
          "params": {
            "text": "Video Asset is a resource. Decode it before using video frames."
          },
          "ports": []
        },
        {
          "id": "asset_1",
          "kind": "core.video-asset",
          "kindVersion": "0.1.0",
          "params": {
            "src": "example.mp4"
          },
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
          ]
        },
        {
          "id": "decode_1",
          "kind": "core.video-decode",
          "kindVersion": "0.1.0",
          "params": {},
          "ports": [
            {
              "id": "asset",
              "direction": "input",
              "label": "Asset",
              "type": {
                "flow": "resource",
                "dataKind": "asset.video"
              },
              "activation": "latched"
            }
          ]
        }
      ],
      "edges": [
        {
          "from": {
            "node": "asset_1",
            "port": "asset"
          },
          "to": {
            "node": "decode_1",
            "port": "asset"
          }
        }
      ]
    }
  },
  {
    "id": "core.video-decode",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-core-video-decode",
      "revision": "1",
      "nodes": [
        {
          "id": "asset_1",
          "kind": "core.video-asset",
          "kindVersion": "0.1.0",
          "params": {
            "src": "example.mp4"
          },
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
          ]
        },
        {
          "id": "decode_1",
          "kind": "core.video-decode",
          "kindVersion": "0.1.0",
          "params": {},
          "ports": [
            {
              "id": "asset",
              "direction": "input",
              "label": "Asset",
              "type": {
                "flow": "resource",
                "dataKind": "asset.video"
              },
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
          ]
        },
        {
          "id": "upload_1",
          "kind": "core.gpu-upload",
          "kindVersion": "0.1.0",
          "params": {},
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
              "activation": "latched"
            }
          ]
        }
      ],
      "edges": [
        {
          "from": {
            "node": "asset_1",
            "port": "asset"
          },
          "to": {
            "node": "decode_1",
            "port": "asset"
          }
        },
        {
          "from": {
            "node": "decode_1",
            "port": "frames"
          },
          "to": {
            "node": "upload_1",
            "port": "frames"
          }
        }
      ]
    }
  },
  {
    "id": "render.clear-color",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-render-clear-color",
      "revision": "1",
      "nodes": [
        {
          "id": "clear_1",
          "kind": "render.clear-color",
          "kindVersion": "0.1.0",
          "params": {
            "color": [
              0.05,
              0.1,
              0.2,
              1
            ]
          },
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
          ]
        },
        {
          "id": "output_1",
          "kind": "render.output",
          "kindVersion": "0.1.0",
          "params": {},
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
              "activation": "latched"
            }
          ]
        }
      ],
      "edges": [
        {
          "from": {
            "node": "clear_1",
            "port": "out"
          },
          "to": {
            "node": "output_1",
            "port": "in"
          }
        }
      ]
    }
  },
  {
    "id": "render.fullscreen-shader",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-render-fullscreen-shader",
      "revision": "1",
      "nodes": [
        {
          "id": "speed_1",
          "kind": "core.value-f32",
          "kindVersion": "0.1.0",
          "params": {
            "value": 0.35
          },
          "ports": [
            {
              "id": "value",
              "direction": "output",
              "label": "Value",
              "type": {
                "flow": "value",
                "dataKind": "number.f32"
              }
            }
          ]
        },
        {
          "id": "tint_1",
          "kind": "core.color-rgba",
          "kindVersion": "0.1.0",
          "params": {
            "value": [
              0.2,
              0.6,
              1,
              1
            ]
          },
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
          ]
        },
        {
          "id": "shader_1",
          "kind": "render.fullscreen-shader",
          "kindVersion": "0.1.0",
          "params": {
            "language": "wgsl",
            "source": "// @skenion.uniform speed number.f32 default=0.35\n// @skenion.uniform tint color.rgba default=[0.2,0.6,1,1]\nfn fs_main() -> @location(0) vec4<f32> { return skenion_uniforms.tint * skenion_uniforms.speed; }"
          },
          "ports": [
            {
              "id": "speed",
              "direction": "input",
              "label": "Speed",
              "type": {
                "flow": "value",
                "dataKind": "number.f32"
              },
              "activation": "latched"
            },
            {
              "id": "tint",
              "direction": "input",
              "label": "Tint",
              "type": {
                "flow": "value",
                "dataKind": "color.rgba"
              },
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
          ]
        },
        {
          "id": "output_1",
          "kind": "render.output",
          "kindVersion": "0.1.0",
          "params": {},
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
              "activation": "latched"
            }
          ]
        }
      ],
      "edges": [
        {
          "from": {
            "node": "speed_1",
            "port": "value"
          },
          "to": {
            "node": "shader_1",
            "port": "speed"
          }
        },
        {
          "from": {
            "node": "tint_1",
            "port": "value"
          },
          "to": {
            "node": "shader_1",
            "port": "tint"
          }
        },
        {
          "from": {
            "node": "shader_1",
            "port": "out"
          },
          "to": {
            "node": "output_1",
            "port": "in"
          }
        }
      ]
    }
  },
  {
    "id": "render.output",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-render-output",
      "revision": "1",
      "nodes": [
        {
          "id": "clear_1",
          "kind": "render.clear-color",
          "kindVersion": "0.1.0",
          "params": {
            "color": [
              0.2,
              0.1,
              0.05,
              1
            ]
          },
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
          ]
        },
        {
          "id": "output_1",
          "kind": "render.output",
          "kindVersion": "0.1.0",
          "params": {},
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
              "activation": "latched"
            }
          ]
        }
      ],
      "edges": [
        {
          "from": {
            "node": "clear_1",
            "port": "out"
          },
          "to": {
            "node": "output_1",
            "port": "in"
          }
        }
      ]
    }
  },
  {
    "id": "ui.button",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-ui-button",
      "revision": "1",
      "nodes": [
        {
          "id": "note_1",
          "kind": "core.comment",
          "kindVersion": "0.1.0",
          "params": {
            "text": "Button accepts any input or runtime click and emits a bang. sendName can publish the bang to a named event channel."
          },
          "ports": []
        },
        {
          "id": "button_1",
          "kind": "ui.button",
          "kindVersion": "0.1.0",
          "params": {
            "label": "Bang",
            "sendName": "reset"
          },
          "ports": [
            {
              "id": "in",
              "direction": "input",
              "label": "In",
              "type": {
                "flow": "value",
                "dataKind": "message.any"
              },
              "required": false,
              "activation": "trigger"
            },
            {
              "id": "bang",
              "direction": "output",
              "label": "Bang",
              "type": {
                "flow": "event",
                "dataKind": "event.bang"
              }
            }
          ]
        },
        {
          "id": "log_1",
          "kind": "core.event-log",
          "kindVersion": "0.1.0",
          "params": {},
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
          ]
        }
      ],
      "edges": [
        {
          "from": {
            "node": "button_1",
            "port": "bang"
          },
          "to": {
            "node": "log_1",
            "port": "bang"
          }
        }
      ]
    }
  },
  {
    "id": "ui.slider-f32",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-ui-slider-f32",
      "revision": "1",
      "nodes": [
        {
          "id": "note_1",
          "kind": "core.comment",
          "kindVersion": "0.1.0",
          "params": {
            "text": "Slider F32 emits typed runtime control values. Use sendName for named routing, or connect value directly."
          },
          "ports": []
        },
        {
          "id": "slider_1",
          "kind": "ui.slider-f32",
          "kindVersion": "0.1.0",
          "params": {
            "label": "Speed",
            "value": 0.5,
            "min": 0,
            "max": 2,
            "step": 0.01,
            "sendName": "speed"
          },
          "ports": [
            {
              "id": "in",
              "direction": "input",
              "label": "In",
              "type": {
                "flow": "value",
                "dataKind": "number.f32"
              },
              "required": false,
              "activation": "trigger"
            },
            {
              "id": "set",
              "direction": "input",
              "label": "Set",
              "type": {
                "flow": "value",
                "dataKind": "number.f32"
              },
              "required": false,
              "activation": "latched"
            },
            {
              "id": "bang",
              "direction": "input",
              "label": "Bang",
              "type": {
                "flow": "event",
                "dataKind": "event.bang"
              },
              "required": false,
              "activation": "trigger"
            },
            {
              "id": "value",
              "direction": "output",
              "label": "Value",
              "type": {
                "flow": "value",
                "dataKind": "number.f32"
              }
            }
          ]
        }
      ],
      "edges": []
    }
  },
  {
    "id": "ui.toggle",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-ui-toggle",
      "revision": "1",
      "nodes": [
        {
          "id": "note_1",
          "kind": "core.comment",
          "kindVersion": "0.1.0",
          "params": {
            "text": "UI Toggle flips on bang/click and emits boolean values. Use sendName for named routing."
          },
          "ports": []
        },
        {
          "id": "toggle_1",
          "kind": "ui.toggle",
          "kindVersion": "0.1.0",
          "params": {
            "label": "Enabled",
            "value": true,
            "sendName": "enabled"
          },
          "ports": [
            {
              "id": "in",
              "direction": "input",
              "label": "In",
              "type": {
                "flow": "value",
                "dataKind": "message.any"
              },
              "required": false,
              "activation": "trigger"
            },
            {
              "id": "set",
              "direction": "input",
              "label": "Set",
              "type": {
                "flow": "value",
                "dataKind": "message.any"
              },
              "required": false,
              "activation": "latched"
            },
            {
              "id": "value",
              "direction": "output",
              "label": "Value",
              "type": {
                "flow": "value",
                "dataKind": "boolean"
              }
            }
          ]
        }
      ],
      "edges": []
    }
  }
] satisfies BuiltinNodeHelpGraphV01[];

export function getBuiltinNodeDefinition(id: string): NodeDefinitionManifestV01 | undefined {
  return builtinNodeDefinitionsV01.find((definition) => definition.id === id);
}

export function getBuiltinNodeHelp(id: string): BuiltinNodeHelpV01 | undefined {
  return builtinNodeHelpV01.find((help) => help.id === id);
}

export function getBuiltinNodeHelpGraph(id: string): GraphDocumentV01 | undefined {
  return builtinNodeHelpGraphsV01.find((helpGraph) => helpGraph.id === id)?.graph;
}
