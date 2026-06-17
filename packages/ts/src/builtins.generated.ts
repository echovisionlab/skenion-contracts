/* This file is generated from builtins/v0.1. */
import type { NodeDefinitionManifestV01 } from "./types.js";

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
  ports?: BuiltinNodeHelpItemV01[];
  params?: BuiltinNodeHelpItemV01[];
  example?: BuiltinNodeHelpExampleV01;
}

export const builtinManifestV01 = {
  "schema": "skenion.builtins.manifest",
  "schemaVersion": "0.1.0",
  "version": "0.1",
  "nodes": [
    "core.comment",
    "core.message",
    "core.string",
    "core.toggle",
    "core.value-f32",
    "core.value-i32",
    "core.value-bool",
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
    "number.i32",
    "boolean",
    "string",
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
    "ports": [],
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
  }
] satisfies NodeDefinitionManifestV01[];

export const builtinNodeHelpV01 = [
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "core.color-rgba",
    "summary": "Stores and emits an RGBA color control value.",
    "description": "Use RGBA for color controls. Component values are normalized floats in graph and runtime payloads.",
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
      }
    ]
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "core.comment",
    "summary": "Documents a patch without participating in execution.",
    "description": "Comment nodes are persisted graph annotations. Runtime validation keeps them in the graph, but execution and planning ignore them.",
    "ports": [],
    "params": [
      {
        "id": "text",
        "description": "Saved annotation text."
      }
    ]
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "core.message",
    "summary": "Emits a saved string payload when triggered.",
    "description": "Message is the first simple message-box form. It is intentionally string-only in v0.1; typed multi-message, pack/unpack, and send/receive nodes are deferred until the control graph model is stable.",
    "ports": [
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
      }
    ]
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "core.string",
    "summary": "Stores and emits a string control value.",
    "description": "Use String for labels, symbolic control values, and text payloads that should move through the graph as data.",
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
      }
    ]
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "core.toggle",
    "summary": "Stores a boolean value and flips it when banged.",
    "description": "Toggle is the performer-facing boolean control. Use Bool when bang should only re-emit the current value; use Toggle when bang should flip the stored state.",
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
      }
    ]
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "core.value-bool",
    "summary": "Stores and emits a boolean control value.",
    "description": "Use Bool for an explicit true/false value. Bang emits the current value; it does not toggle.",
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
      }
    ]
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "core.value-f32",
    "summary": "Stores and emits a 32-bit floating-point control value.",
    "description": "Use F32 when a patch needs a generic numeric control value. The graph parameter is the saved default; runtime control events can update the live session value without changing the saved graph.",
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
      }
    ],
    "example": {
      "title": "Drive a shader uniform",
      "description": "Connect value to a fullscreen shader numeric input, then send runtime in/set/bang events while the preview runs."
    }
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "core.value-i32",
    "summary": "Stores and emits a signed integer control value.",
    "description": "Use I32 for discrete numeric controls such as counts, selected indices, and integer mode values.",
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
      }
    ]
  }
] satisfies BuiltinNodeHelpV01[];

export function getBuiltinNodeDefinition(id: string): NodeDefinitionManifestV01 | undefined {
  return builtinNodeDefinitionsV01.find((definition) => definition.id === id);
}

export function getBuiltinNodeHelp(id: string): BuiltinNodeHelpV01 | undefined {
  return builtinNodeHelpV01.find((help) => help.id === id);
}
