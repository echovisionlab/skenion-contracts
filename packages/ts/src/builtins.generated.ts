/* This file is generated from builtins/v0.1. */
import type { GraphDocumentV01, NodeDefinitionManifestV01 } from "./types.js";

export interface BuiltinManifestV01 {
  schema: "skenion.builtins.manifest";
  schemaVersion: "0.1.0";
  version: "0.1";
  nodes: string[];
  canonicalDataKinds: string[];
  representations: Record<string, string[]>;
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
    "core.bang",
    "core.float",
    "core.int",
    "core.uint",
    "core.bool",
    "core.color",
    "core.video-asset",
    "core.video-decode",
    "core.gpu-upload",
    "core.preview",
    "clock.local",
    "clock.position-display",
    "render.clear-color",
    "render.fullscreen-shader",
    "render.output",
    "core.operator.add",
    "core.operator.sub",
    "core.operator.mul",
    "core.operator.div",
    "core.operator.pow",
    "core.operator.min",
    "core.operator.max",
    "core.operator.sqrt",
    "audio.operator.add",
    "audio.operator.sub",
    "audio.operator.mul",
    "audio.operator.div",
    "audio.operator.sqrt",
    "audio.osc",
    "audio.phasor",
    "audio.cos",
    "audio.noise",
    "audio.sig",
    "audio.snapshot"
  ],
  "canonicalDataKinds": [
    "number.float",
    "number.int",
    "number.uint",
    "boolean",
    "string",
    "message.any",
    "event.bang",
    "clock.state",
    "asset.video",
    "video.frame",
    "gpu.texture2d",
    "color",
    "signal.audio"
  ],
  "representations": {
    "number.float": [
      "f64",
      "f32",
      "f16",
      "f8.e4m3",
      "f8.e5m2",
      "ufloat16",
      "ufloat8"
    ],
    "number.int": [
      "i64",
      "i32",
      "i16",
      "i8"
    ],
    "number.uint": [
      "u64",
      "u32",
      "u16",
      "u8"
    ],
    "color": [
      "rgba32f",
      "rgba16f",
      "rgba8unorm",
      "rgb8unorm"
    ]
  }
} satisfies BuiltinManifestV01;

export const builtinNodeDefinitionsV01 = [
  {
    "schema": "skenion.node.definition",
    "schemaVersion": "0.1.0",
    "id": "audio.cos",
    "version": "0.1.0",
    "displayName": "Cosine",
    "category": "Audio",
    "ports": [
      {
        "id": "phase",
        "direction": "input",
        "label": "Phase",
        "type": {
          "flow": "signal",
          "dataKind": "signal.audio"
        },
        "required": false,
        "activation": "latched"
      },
      {
        "id": "out",
        "direction": "output",
        "label": "Signal",
        "type": {
          "flow": "signal",
          "dataKind": "signal.audio"
        }
      }
    ],
    "execution": {
      "model": "audio_block",
      "clock": "audio"
    },
    "state": {
      "persistent": false
    },
    "permissions": [],
    "capabilities": [
      "pd.audio.v0.1"
    ]
  },
  {
    "schema": "skenion.node.definition",
    "schemaVersion": "0.1.0",
    "id": "audio.noise",
    "version": "0.1.0",
    "displayName": "Noise",
    "category": "Audio",
    "ports": [
      {
        "id": "seed",
        "direction": "input",
        "label": "Seed",
        "type": {
          "flow": "event",
          "dataKind": "message.any"
        },
        "required": false,
        "activation": "trigger"
      },
      {
        "id": "out",
        "direction": "output",
        "label": "Signal",
        "type": {
          "flow": "signal",
          "dataKind": "signal.audio"
        }
      }
    ],
    "execution": {
      "model": "audio_block",
      "clock": "audio"
    },
    "state": {
      "persistent": false
    },
    "permissions": [],
    "capabilities": [
      "pd.audio.v0.1"
    ]
  },
  {
    "schema": "skenion.node.definition",
    "schemaVersion": "0.1.0",
    "id": "audio.operator.add",
    "version": "0.1.0",
    "displayName": "Audio Add",
    "category": "Audio",
    "ports": [
      {
        "id": "left",
        "direction": "input",
        "label": "Left",
        "type": {
          "flow": "signal",
          "dataKind": "signal.audio"
        },
        "required": false,
        "activation": "latched"
      },
      {
        "id": "right",
        "direction": "input",
        "label": "Right",
        "type": {
          "flow": "signal",
          "dataKind": "signal.audio"
        },
        "required": false,
        "activation": "latched"
      },
      {
        "id": "out",
        "direction": "output",
        "label": "Signal",
        "type": {
          "flow": "signal",
          "dataKind": "signal.audio"
        }
      }
    ],
    "execution": {
      "model": "audio_block",
      "clock": "audio"
    },
    "state": {
      "persistent": false
    },
    "permissions": [],
    "capabilities": [
      "pd.audio.operator.v0.1"
    ]
  },
  {
    "schema": "skenion.node.definition",
    "schemaVersion": "0.1.0",
    "id": "audio.operator.div",
    "version": "0.1.0",
    "displayName": "Audio Divide",
    "category": "Audio",
    "ports": [
      {
        "id": "left",
        "direction": "input",
        "label": "Left",
        "type": {
          "flow": "signal",
          "dataKind": "signal.audio"
        },
        "required": false,
        "activation": "latched"
      },
      {
        "id": "right",
        "direction": "input",
        "label": "Right",
        "type": {
          "flow": "signal",
          "dataKind": "signal.audio"
        },
        "required": false,
        "activation": "latched"
      },
      {
        "id": "out",
        "direction": "output",
        "label": "Signal",
        "type": {
          "flow": "signal",
          "dataKind": "signal.audio"
        }
      }
    ],
    "execution": {
      "model": "audio_block",
      "clock": "audio"
    },
    "state": {
      "persistent": false
    },
    "permissions": [],
    "capabilities": [
      "pd.audio.operator.v0.1"
    ]
  },
  {
    "schema": "skenion.node.definition",
    "schemaVersion": "0.1.0",
    "id": "audio.operator.mul",
    "version": "0.1.0",
    "displayName": "Audio Multiply",
    "category": "Audio",
    "ports": [
      {
        "id": "left",
        "direction": "input",
        "label": "Left",
        "type": {
          "flow": "signal",
          "dataKind": "signal.audio"
        },
        "required": false,
        "activation": "latched"
      },
      {
        "id": "right",
        "direction": "input",
        "label": "Right",
        "type": {
          "flow": "signal",
          "dataKind": "signal.audio"
        },
        "required": false,
        "activation": "latched"
      },
      {
        "id": "out",
        "direction": "output",
        "label": "Signal",
        "type": {
          "flow": "signal",
          "dataKind": "signal.audio"
        }
      }
    ],
    "execution": {
      "model": "audio_block",
      "clock": "audio"
    },
    "state": {
      "persistent": false
    },
    "permissions": [],
    "capabilities": [
      "pd.audio.operator.v0.1"
    ]
  },
  {
    "schema": "skenion.node.definition",
    "schemaVersion": "0.1.0",
    "id": "audio.operator.sqrt",
    "version": "0.1.0",
    "displayName": "Audio Square Root",
    "category": "Audio",
    "ports": [
      {
        "id": "in",
        "direction": "input",
        "label": "In",
        "type": {
          "flow": "signal",
          "dataKind": "signal.audio"
        },
        "required": false,
        "activation": "latched"
      },
      {
        "id": "out",
        "direction": "output",
        "label": "Signal",
        "type": {
          "flow": "signal",
          "dataKind": "signal.audio"
        }
      }
    ],
    "execution": {
      "model": "audio_block",
      "clock": "audio"
    },
    "state": {
      "persistent": false
    },
    "permissions": [],
    "capabilities": [
      "pd.audio.operator.v0.1"
    ]
  },
  {
    "schema": "skenion.node.definition",
    "schemaVersion": "0.1.0",
    "id": "audio.operator.sub",
    "version": "0.1.0",
    "displayName": "Audio Subtract",
    "category": "Audio",
    "ports": [
      {
        "id": "left",
        "direction": "input",
        "label": "Left",
        "type": {
          "flow": "signal",
          "dataKind": "signal.audio"
        },
        "required": false,
        "activation": "latched"
      },
      {
        "id": "right",
        "direction": "input",
        "label": "Right",
        "type": {
          "flow": "signal",
          "dataKind": "signal.audio"
        },
        "required": false,
        "activation": "latched"
      },
      {
        "id": "out",
        "direction": "output",
        "label": "Signal",
        "type": {
          "flow": "signal",
          "dataKind": "signal.audio"
        }
      }
    ],
    "execution": {
      "model": "audio_block",
      "clock": "audio"
    },
    "state": {
      "persistent": false
    },
    "permissions": [],
    "capabilities": [
      "pd.audio.operator.v0.1"
    ]
  },
  {
    "schema": "skenion.node.definition",
    "schemaVersion": "0.1.0",
    "id": "audio.osc",
    "version": "0.1.0",
    "displayName": "Oscillator",
    "category": "Audio",
    "ports": [
      {
        "id": "frequency",
        "direction": "input",
        "label": "Frequency",
        "type": {
          "flow": "value",
          "dataKind": "number.float",
          "format": "f32"
        },
        "required": false,
        "activation": "latched"
      },
      {
        "id": "out",
        "direction": "output",
        "label": "Signal",
        "type": {
          "flow": "signal",
          "dataKind": "signal.audio"
        }
      }
    ],
    "execution": {
      "model": "audio_block",
      "clock": "audio"
    },
    "state": {
      "persistent": false
    },
    "permissions": [],
    "capabilities": [
      "pd.audio.v0.1"
    ]
  },
  {
    "schema": "skenion.node.definition",
    "schemaVersion": "0.1.0",
    "id": "audio.phasor",
    "version": "0.1.0",
    "displayName": "Phasor",
    "category": "Audio",
    "ports": [
      {
        "id": "frequency",
        "direction": "input",
        "label": "Frequency",
        "type": {
          "flow": "value",
          "dataKind": "number.float",
          "format": "f32"
        },
        "required": false,
        "activation": "latched"
      },
      {
        "id": "out",
        "direction": "output",
        "label": "Signal",
        "type": {
          "flow": "signal",
          "dataKind": "signal.audio"
        }
      }
    ],
    "execution": {
      "model": "audio_block",
      "clock": "audio"
    },
    "state": {
      "persistent": false
    },
    "permissions": [],
    "capabilities": [
      "pd.audio.v0.1"
    ]
  },
  {
    "schema": "skenion.node.definition",
    "schemaVersion": "0.1.0",
    "id": "audio.sig",
    "version": "0.1.0",
    "displayName": "Signal Value",
    "category": "Audio",
    "ports": [
      {
        "id": "in",
        "direction": "input",
        "label": "In",
        "type": {
          "flow": "event",
          "dataKind": "message.any"
        },
        "required": false,
        "activation": "trigger"
      },
      {
        "id": "out",
        "direction": "output",
        "label": "Signal",
        "type": {
          "flow": "signal",
          "dataKind": "signal.audio"
        }
      }
    ],
    "execution": {
      "model": "audio_block",
      "clock": "audio"
    },
    "state": {
      "persistent": false
    },
    "permissions": [],
    "capabilities": [
      "pd.audio.v0.1"
    ]
  },
  {
    "schema": "skenion.node.definition",
    "schemaVersion": "0.1.0",
    "id": "audio.snapshot",
    "version": "0.1.0",
    "displayName": "Snapshot",
    "category": "Audio",
    "ports": [
      {
        "id": "signal",
        "direction": "input",
        "label": "Signal",
        "type": {
          "flow": "signal",
          "dataKind": "signal.audio"
        },
        "required": false,
        "activation": "latched"
      },
      {
        "id": "trigger",
        "direction": "input",
        "label": "Trigger",
        "type": {
          "flow": "event",
          "dataKind": "message.any"
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
          "dataKind": "number.float",
          "format": "f32"
        }
      }
    ],
    "execution": {
      "model": "audio_block",
      "clock": "audio"
    },
    "state": {
      "persistent": false
    },
    "permissions": [],
    "capabilities": [
      "pd.audio.v0.1"
    ]
  },
  {
    "schema": "skenion.node.definition",
    "schemaVersion": "0.1.0",
    "id": "clock.local",
    "version": "0.1.0",
    "displayName": "Local Clock",
    "category": "Clock",
    "ports": [
      {
        "id": "sync",
        "direction": "input",
        "label": "Sync",
        "type": {
          "flow": "value",
          "dataKind": "clock.state"
        },
        "required": false,
        "activation": "latched"
      },
      {
        "id": "reset",
        "direction": "input",
        "label": "Reset",
        "type": {
          "flow": "event",
          "dataKind": "event.bang"
        },
        "required": false,
        "activation": "trigger"
      },
      {
        "id": "state",
        "direction": "output",
        "label": "State",
        "type": {
          "flow": "value",
          "dataKind": "clock.state"
        }
      },
      {
        "id": "tick",
        "direction": "output",
        "label": "Tick",
        "type": {
          "flow": "event",
          "dataKind": "event.bang"
        }
      },
      {
        "id": "phase",
        "direction": "output",
        "label": "Phase",
        "type": {
          "flow": "value",
          "dataKind": "number.float",
          "format": "f32",
          "range": {
            "min": 0,
            "max": 1
          }
        }
      },
      {
        "id": "tempo",
        "direction": "output",
        "label": "Tempo",
        "type": {
          "flow": "value",
          "dataKind": "number.float",
          "unit": "bpm",
          "format": "f32"
        }
      }
    ],
    "execution": {
      "model": "value",
      "clock": "beat"
    },
    "state": {
      "persistent": false
    },
    "permissions": [],
    "capabilities": [
      "clock.transport.v0.1"
    ]
  },
  {
    "schema": "skenion.node.definition",
    "schemaVersion": "0.1.0",
    "id": "clock.position-display",
    "version": "0.1.0",
    "displayName": "Clock Position Display",
    "category": "Clock",
    "ports": [
      {
        "id": "clock",
        "direction": "input",
        "label": "Clock",
        "type": {
          "flow": "value",
          "dataKind": "clock.state"
        },
        "required": false,
        "activation": "latched"
      }
    ],
    "execution": {
      "model": "value",
      "clock": "external"
    },
    "state": {
      "persistent": false
    },
    "permissions": [],
    "capabilities": [
      "clock.display.v0.1"
    ]
  },
  {
    "schema": "skenion.node.definition",
    "schemaVersion": "0.1.0",
    "id": "core.bang",
    "version": "0.1.0",
    "displayName": "Bang",
    "category": "Events",
    "ports": [
      {
        "id": "in",
        "direction": "input",
        "label": "In",
        "type": {
          "flow": "event",
          "dataKind": "message.any"
        },
        "required": false,
        "activation": "trigger"
      },
      {
        "id": "out",
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
    "id": "core.bool",
    "version": "0.1.0",
    "displayName": "Bool",
    "category": "Values",
    "ports": [
      {
        "id": "in",
        "direction": "input",
        "label": "In",
        "type": {
          "flow": "event",
          "dataKind": "message.any"
        },
        "required": false,
        "activation": "trigger"
      },
      {
        "id": "cold",
        "direction": "input",
        "label": "Cold",
        "type": {
          "flow": "value",
          "dataKind": "boolean"
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
  },
  {
    "schema": "skenion.node.definition",
    "schemaVersion": "0.1.0",
    "id": "core.color",
    "version": "0.1.0",
    "displayName": "Color",
    "category": "Values",
    "ports": [
      {
        "id": "in",
        "direction": "input",
        "label": "In",
        "type": {
          "flow": "event",
          "dataKind": "message.any"
        },
        "required": false,
        "activation": "trigger"
      },
      {
        "id": "cold",
        "direction": "input",
        "label": "Cold",
        "type": {
          "flow": "value",
          "dataKind": "color",
          "format": "rgba32f",
          "colorSpace": "linear"
        },
        "required": false,
        "activation": "latched"
      },
      {
        "id": "value",
        "direction": "output",
        "label": "Color",
        "type": {
          "flow": "value",
          "dataKind": "color",
          "format": "rgba32f",
          "colorSpace": "linear"
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
        "id": "in",
        "direction": "input",
        "label": "In",
        "type": {
          "flow": "event",
          "dataKind": "message.any"
        },
        "required": false,
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
    "id": "core.float",
    "version": "0.1.0",
    "displayName": "Float",
    "category": "Values",
    "ports": [
      {
        "id": "in",
        "direction": "input",
        "label": "In",
        "type": {
          "flow": "event",
          "dataKind": "message.any"
        },
        "required": false,
        "activation": "trigger"
      },
      {
        "id": "cold",
        "direction": "input",
        "label": "Cold",
        "type": {
          "flow": "value",
          "dataKind": "number.float",
          "format": "f32"
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
          "dataKind": "number.float",
          "format": "f32"
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
    "id": "core.int",
    "version": "0.1.0",
    "displayName": "Int",
    "category": "Values",
    "ports": [
      {
        "id": "in",
        "direction": "input",
        "label": "In",
        "type": {
          "flow": "event",
          "dataKind": "message.any"
        },
        "required": false,
        "activation": "trigger"
      },
      {
        "id": "cold",
        "direction": "input",
        "label": "Cold",
        "type": {
          "flow": "value",
          "dataKind": "number.int",
          "format": "i32"
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
          "dataKind": "number.int",
          "format": "i32"
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
          "flow": "event",
          "dataKind": "message.any"
        },
        "required": false,
        "activation": "trigger"
      },
      {
        "id": "out",
        "direction": "output",
        "label": "Message",
        "type": {
          "flow": "event",
          "dataKind": "message.any"
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
    "id": "core.operator.add",
    "version": "0.1.0",
    "displayName": "Add",
    "category": "Operators",
    "ports": [
      {
        "id": "in",
        "direction": "input",
        "label": "In",
        "type": {
          "flow": "event",
          "dataKind": "message.any"
        },
        "required": false,
        "activation": "trigger"
      },
      {
        "id": "right",
        "direction": "input",
        "label": "Right",
        "type": {
          "flow": "value",
          "dataKind": "number.float",
          "format": "f32"
        },
        "required": false,
        "activation": "latched",
        "default": 0
      },
      {
        "id": "out",
        "direction": "output",
        "label": "Value",
        "type": {
          "flow": "value",
          "dataKind": "number.float",
          "format": "f32"
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
    "capabilities": [
      "pd.control.operator.v0.1"
    ]
  },
  {
    "schema": "skenion.node.definition",
    "schemaVersion": "0.1.0",
    "id": "core.operator.div",
    "version": "0.1.0",
    "displayName": "Divide",
    "category": "Operators",
    "ports": [
      {
        "id": "in",
        "direction": "input",
        "label": "In",
        "type": {
          "flow": "event",
          "dataKind": "message.any"
        },
        "required": false,
        "activation": "trigger"
      },
      {
        "id": "right",
        "direction": "input",
        "label": "Right",
        "type": {
          "flow": "value",
          "dataKind": "number.float",
          "format": "f32"
        },
        "required": false,
        "activation": "latched",
        "default": 1
      },
      {
        "id": "out",
        "direction": "output",
        "label": "Value",
        "type": {
          "flow": "value",
          "dataKind": "number.float",
          "format": "f32"
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
    "capabilities": [
      "pd.control.operator.v0.1"
    ]
  },
  {
    "schema": "skenion.node.definition",
    "schemaVersion": "0.1.0",
    "id": "core.operator.max",
    "version": "0.1.0",
    "displayName": "Maximum",
    "category": "Operators",
    "ports": [
      {
        "id": "in",
        "direction": "input",
        "label": "In",
        "type": {
          "flow": "event",
          "dataKind": "message.any"
        },
        "required": false,
        "activation": "trigger"
      },
      {
        "id": "right",
        "direction": "input",
        "label": "Right",
        "type": {
          "flow": "value",
          "dataKind": "number.float",
          "format": "f32"
        },
        "required": false,
        "activation": "latched",
        "default": 0
      },
      {
        "id": "out",
        "direction": "output",
        "label": "Value",
        "type": {
          "flow": "value",
          "dataKind": "number.float",
          "format": "f32"
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
    "capabilities": [
      "pd.control.operator.v0.1"
    ]
  },
  {
    "schema": "skenion.node.definition",
    "schemaVersion": "0.1.0",
    "id": "core.operator.min",
    "version": "0.1.0",
    "displayName": "Minimum",
    "category": "Operators",
    "ports": [
      {
        "id": "in",
        "direction": "input",
        "label": "In",
        "type": {
          "flow": "event",
          "dataKind": "message.any"
        },
        "required": false,
        "activation": "trigger"
      },
      {
        "id": "right",
        "direction": "input",
        "label": "Right",
        "type": {
          "flow": "value",
          "dataKind": "number.float",
          "format": "f32"
        },
        "required": false,
        "activation": "latched",
        "default": 0
      },
      {
        "id": "out",
        "direction": "output",
        "label": "Value",
        "type": {
          "flow": "value",
          "dataKind": "number.float",
          "format": "f32"
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
    "capabilities": [
      "pd.control.operator.v0.1"
    ]
  },
  {
    "schema": "skenion.node.definition",
    "schemaVersion": "0.1.0",
    "id": "core.operator.mul",
    "version": "0.1.0",
    "displayName": "Multiply",
    "category": "Operators",
    "ports": [
      {
        "id": "in",
        "direction": "input",
        "label": "In",
        "type": {
          "flow": "event",
          "dataKind": "message.any"
        },
        "required": false,
        "activation": "trigger"
      },
      {
        "id": "right",
        "direction": "input",
        "label": "Right",
        "type": {
          "flow": "value",
          "dataKind": "number.float",
          "format": "f32"
        },
        "required": false,
        "activation": "latched",
        "default": 1
      },
      {
        "id": "out",
        "direction": "output",
        "label": "Value",
        "type": {
          "flow": "value",
          "dataKind": "number.float",
          "format": "f32"
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
    "capabilities": [
      "pd.control.operator.v0.1"
    ]
  },
  {
    "schema": "skenion.node.definition",
    "schemaVersion": "0.1.0",
    "id": "core.operator.pow",
    "version": "0.1.0",
    "displayName": "Power",
    "category": "Operators",
    "ports": [
      {
        "id": "in",
        "direction": "input",
        "label": "In",
        "type": {
          "flow": "event",
          "dataKind": "message.any"
        },
        "required": false,
        "activation": "trigger"
      },
      {
        "id": "right",
        "direction": "input",
        "label": "Right",
        "type": {
          "flow": "value",
          "dataKind": "number.float",
          "format": "f32"
        },
        "required": false,
        "activation": "latched",
        "default": 1
      },
      {
        "id": "out",
        "direction": "output",
        "label": "Value",
        "type": {
          "flow": "value",
          "dataKind": "number.float",
          "format": "f32"
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
    "capabilities": [
      "pd.control.operator.v0.1"
    ]
  },
  {
    "schema": "skenion.node.definition",
    "schemaVersion": "0.1.0",
    "id": "core.operator.sqrt",
    "version": "0.1.0",
    "displayName": "Square Root",
    "category": "Operators",
    "ports": [
      {
        "id": "in",
        "direction": "input",
        "label": "In",
        "type": {
          "flow": "event",
          "dataKind": "message.any"
        },
        "required": false,
        "activation": "trigger"
      },
      {
        "id": "out",
        "direction": "output",
        "label": "Value",
        "type": {
          "flow": "value",
          "dataKind": "number.float",
          "format": "f32"
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
    "capabilities": [
      "pd.control.operator.v0.1"
    ]
  },
  {
    "schema": "skenion.node.definition",
    "schemaVersion": "0.1.0",
    "id": "core.operator.sub",
    "version": "0.1.0",
    "displayName": "Subtract",
    "category": "Operators",
    "ports": [
      {
        "id": "in",
        "direction": "input",
        "label": "In",
        "type": {
          "flow": "event",
          "dataKind": "message.any"
        },
        "required": false,
        "activation": "trigger"
      },
      {
        "id": "right",
        "direction": "input",
        "label": "Right",
        "type": {
          "flow": "value",
          "dataKind": "number.float",
          "format": "f32"
        },
        "required": false,
        "activation": "latched",
        "default": 0
      },
      {
        "id": "out",
        "direction": "output",
        "label": "Value",
        "type": {
          "flow": "value",
          "dataKind": "number.float",
          "format": "f32"
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
    "capabilities": [
      "pd.control.operator.v0.1"
    ]
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
        "id": "in",
        "direction": "input",
        "label": "In",
        "type": {
          "flow": "event",
          "dataKind": "message.any"
        },
        "required": false,
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
          "flow": "event",
          "dataKind": "message.any"
        },
        "required": false,
        "activation": "trigger"
      },
      {
        "id": "cold",
        "direction": "input",
        "label": "Cold",
        "type": {
          "flow": "value",
          "dataKind": "string"
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
    "id": "core.uint",
    "version": "0.1.0",
    "displayName": "UInt",
    "category": "Values",
    "ports": [
      {
        "id": "in",
        "direction": "input",
        "label": "In",
        "type": {
          "flow": "event",
          "dataKind": "message.any"
        },
        "required": false,
        "activation": "trigger"
      },
      {
        "id": "cold",
        "direction": "input",
        "label": "Cold",
        "type": {
          "flow": "value",
          "dataKind": "number.uint",
          "format": "u32"
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
          "dataKind": "number.uint",
          "format": "u32"
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
    "id": "audio.cos",
    "summary": "Pd-style cos~ phase-domain cosine lookup.",
    "description": "Cosine maps an audio phase signal to cosine output. It is not a frequency oscillator by itself.",
    "helpGraph": "help/v0.1/nodes/audio.cos.help.graph.json",
    "tags": [
      "audio",
      "pd"
    ],
    "runtimeBehavior": "Runs in or crosses an audio_block DSP context. Device IO and real-time audio backend behavior are deferred."
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "audio.noise",
    "summary": "Pd-style noise~ source.",
    "description": "Noise is a stateful pseudo-random audio source. Seed updates are control messages to runtime state.",
    "helpGraph": "help/v0.1/nodes/audio.noise.help.graph.json",
    "tags": [
      "audio",
      "pd"
    ],
    "runtimeBehavior": "Runs in or crosses an audio_block DSP context. Device IO and real-time audio backend behavior are deferred."
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "audio.operator.add",
    "summary": "Pd-style +~ signal operator.",
    "description": "Audio Add is a block/vector DSP operator. Object text with a numeric creation argument may specialize the right inlet to a latched scalar operand.",
    "helpGraph": "help/v0.1/nodes/audio.operator.add.help.graph.json",
    "tags": [
      "audio",
      "operator",
      "pd"
    ],
    "runtimeBehavior": "Runs in an audio_block DSP context. No UI, HTTP, or graph mutation work is allowed in the audio callback."
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "audio.operator.div",
    "summary": "Pd-style /~ signal operator.",
    "description": "Audio Divide is a block/vector DSP operator. Object text with a numeric creation argument may specialize the right inlet to a latched scalar operand.",
    "helpGraph": "help/v0.1/nodes/audio.operator.div.help.graph.json",
    "tags": [
      "audio",
      "operator",
      "pd"
    ],
    "runtimeBehavior": "Runs in an audio_block DSP context. No UI, HTTP, or graph mutation work is allowed in the audio callback."
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "audio.operator.mul",
    "summary": "Pd-style *~ signal operator.",
    "description": "Audio Multiply is a block/vector DSP operator. Object text with a numeric creation argument may specialize the right inlet to a latched scalar operand.",
    "helpGraph": "help/v0.1/nodes/audio.operator.mul.help.graph.json",
    "tags": [
      "audio",
      "operator",
      "pd"
    ],
    "runtimeBehavior": "Runs in an audio_block DSP context. No UI, HTTP, or graph mutation work is allowed in the audio callback."
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "audio.operator.sqrt",
    "summary": "Pd-style sqrt~ signal operator.",
    "description": "Audio Square Root runs per block and outputs zero for negative samples in the Pd-compatible baseline.",
    "helpGraph": "help/v0.1/nodes/audio.operator.sqrt.help.graph.json",
    "tags": [
      "audio",
      "operator",
      "pd"
    ],
    "runtimeBehavior": "Runs in an audio_block DSP context with deterministic negative-input behavior."
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "audio.operator.sub",
    "summary": "Pd-style -~ signal operator.",
    "description": "Audio Subtract is a block/vector DSP operator. Object text with a numeric creation argument may specialize the right inlet to a latched scalar operand.",
    "helpGraph": "help/v0.1/nodes/audio.operator.sub.help.graph.json",
    "tags": [
      "audio",
      "operator",
      "pd"
    ],
    "runtimeBehavior": "Runs in an audio_block DSP context. No UI, HTTP, or graph mutation work is allowed in the audio callback."
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "audio.osc",
    "summary": "Pd-style osc~ sine oscillator.",
    "description": "Oscillator is a stateful sine oscillator. Frequency may come from params or a control-rate inlet; phase is runtime state.",
    "helpGraph": "help/v0.1/nodes/audio.osc.help.graph.json",
    "tags": [
      "audio",
      "pd"
    ],
    "runtimeBehavior": "Runs in or crosses an audio_block DSP context. Device IO and real-time audio backend behavior are deferred."
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "audio.phasor",
    "summary": "Pd-style phasor~ ramp generator.",
    "description": "Phasor is a stateful phase ramp generator used to build saw-like shapes and phase-domain patches.",
    "helpGraph": "help/v0.1/nodes/audio.phasor.help.graph.json",
    "tags": [
      "audio",
      "pd"
    ],
    "runtimeBehavior": "Runs in or crosses an audio_block DSP context. Device IO and real-time audio backend behavior are deferred."
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "audio.sig",
    "summary": "Pd-style sig~ control-to-signal crossing.",
    "description": "Signal Value copies the current control value into each audio block. It is a block-aligned crossing from control to audio.",
    "helpGraph": "help/v0.1/nodes/audio.sig.help.graph.json",
    "tags": [
      "audio",
      "pd"
    ],
    "runtimeBehavior": "Runs in or crosses an audio_block DSP context. Device IO and real-time audio backend behavior are deferred."
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "audio.snapshot",
    "summary": "Pd-style snapshot~ signal-to-control crossing.",
    "description": "Snapshot samples an audio signal into a control value when triggered. It makes signal-to-control latency explicit.",
    "helpGraph": "help/v0.1/nodes/audio.snapshot.help.graph.json",
    "tags": [
      "audio",
      "pd"
    ],
    "runtimeBehavior": "Runs in or crosses an audio_block DSP context. Device IO and real-time audio backend behavior are deferred."
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "clock.local",
    "summary": "Graph-visible local musical clock.",
    "description": "Local Clock is a patch object for musical timing. It is not the runtime's hidden master clock and it does not drive audio callbacks. It emits clock.state plus tick, phase, and tempo projections that other graph nodes can consume.",
    "helpGraph": "help/v0.1/nodes/clock.local.help.graph.json",
    "tags": [
      "clock",
      "transport",
      "timing"
    ],
    "runtimeBehavior": "Runs as graph-visible musical transport state. Audio DSP still runs from audio.output's device sample clock.",
    "relatedNodes": [
      "clock.position-display"
    ],
    "ports": [
      {
        "id": "sync",
        "description": "Optional value<clock.state> input used by future follow/sync policies."
      },
      {
        "id": "reset",
        "description": "Optional event<event.bang> input that resets local phase/position."
      },
      {
        "id": "state",
        "description": "Outputs value<clock.state> with source capability and authority metadata."
      },
      {
        "id": "tick",
        "description": "Outputs event<event.bang> for discrete musical ticks."
      },
      {
        "id": "phase",
        "description": "Outputs normalized number.float phase in the current cycle."
      },
      {
        "id": "tempo",
        "description": "Outputs tempo as number.float in BPM."
      }
    ],
    "params": [
      {
        "id": "tempoBpm",
        "description": "Initial local tempo in BPM."
      },
      {
        "id": "running",
        "description": "Initial transport running state."
      }
    ],
    "example": {
      "title": "Display local clock position",
      "description": "Connect state to clock.position-display to inspect available bar, beat, phase, time, and authority fields.",
      "graph": "help/v0.1/nodes/clock.local.help.graph.json"
    }
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "clock.position-display",
    "summary": "Displays clock position fields with authority metadata.",
    "description": "Clock Position Display is a UI object for clock.state. It may show bar, beat, division, tick, timecode, or time fields when the source provides them, and must distinguish authoritative, derived, estimated, and unavailable values.",
    "helpGraph": "help/v0.1/nodes/clock.position-display.help.graph.json",
    "tags": [
      "clock",
      "display",
      "transport"
    ],
    "runtimeBehavior": "Displays clock.state projections only. It does not create a master transport and does not drive audio or render callbacks.",
    "relatedNodes": [
      "clock.local"
    ],
    "ports": [
      {
        "id": "clock",
        "description": "Accepts value<clock.state> from clock.local or future external clock source objects."
      }
    ],
    "example": {
      "title": "Inspect clock authority",
      "description": "Use this display to see whether bar, beat, timecode, and phase are authoritative, derived, estimated, or unavailable.",
      "graph": "help/v0.1/nodes/clock.position-display.help.graph.json"
    }
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "core.bang",
    "summary": "Emits a discrete bang event.",
    "description": "Bang is the simplest manual trigger object. It emits event.bang and does not store a value; event.bang itself remains a data kind/message selector, not an object.",
    "helpGraph": "help/v0.1/nodes/core.bang.help.graph.json",
    "tags": [
      "event",
      "trigger",
      "control"
    ],
    "runtimeBehavior": "Clicking the object or receiving any message on in emits one event.bang from out.",
    "relatedNodes": [
      "core.float",
      "core.bool",
      "core.message"
    ],
    "ports": [
      {
        "id": "in",
        "description": "Accepts any control message and converts it to a bang trigger."
      },
      {
        "id": "out",
        "description": "Outputs a discrete event.bang trigger."
      }
    ],
    "example": {
      "title": "Trigger stored values",
      "description": "Connect Bang to value nodes or messages to emit their stored payloads.",
      "graph": "help/v0.1/nodes/core.bang.help.graph.json"
    }
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "core.bool",
    "summary": "Stores and emits a boolean control value.",
    "description": "Use Bool for an explicit true/false value. With the default value-box widget, bang emits the current value. With widget=toggle or widget=checkbox, bang flips the stored value and emits the new value.",
    "helpGraph": "help/v0.1/nodes/core.bool.help.graph.json",
    "tags": [
      "value",
      "control",
      "boolean"
    ],
    "runtimeBehavior": "in is the hot inlet. Value-box widgets emit stored value on bang; toggle/checkbox widgets flip and emit on bang. cold updates silently.",
    "relatedNodes": [
      "render.fullscreen-shader"
    ],
    "ports": [
      {
        "id": "in",
        "description": "Hot inlet: values update and emit; bang emits or toggles depending on widget; set ... updates silently."
      },
      {
        "id": "cold",
        "description": "Cold inlet: compatible boolean values or set ... update without emitting."
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
      },
      {
        "id": "widget",
        "description": "Optional display widget. Use toggle or checkbox for Max/Pd-style boolean toggling."
      }
    ],
    "example": {
      "title": "Bool versus Toggle",
      "description": "Bool keeps bang as re-emit behavior; Toggle flips on bang.",
      "graph": "help/v0.1/nodes/core.bool.help.graph.json"
    }
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "core.color",
    "summary": "Stores and emits an Color color control value.",
    "description": "Use Color for color controls. Component values are normalized floats in graph and runtime payloads.",
    "helpGraph": "help/v0.1/nodes/core.color.help.graph.json",
    "tags": [
      "value",
      "control",
      "color"
    ],
    "runtimeBehavior": "in is the hot inlet: color values update and emit, bang emits the stored color, and set ... updates silently. cold updates silently.",
    "relatedNodes": [
      "render.fullscreen-shader"
    ],
    "ports": [
      {
        "id": "in",
        "description": "Hot inlet: color values update and emit; bang emits the stored color; set ... updates silently."
      },
      {
        "id": "cold",
        "description": "Cold inlet: compatible color values or set ... update without emitting."
      },
      {
        "id": "value",
        "description": "Outputs the current color/rgba32f."
      }
    ],
    "params": [
      {
        "id": "value",
        "description": "Saved default RGBA color/rgba32f."
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
      "graph": "help/v0.1/nodes/core.color.help.graph.json"
    }
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "core.comment",
    "summary": "Displays patch notes and can receive Pd-style set messages.",
    "description": "Comment nodes render as canvas text. They can receive message events on their inlet; set <text> updates the runtime displayed text silently, but comments do not output values.",
    "helpGraph": "help/v0.1/nodes/core.comment.help.graph.json",
    "tags": [
      "documentation",
      "annotation"
    ],
    "runtimeBehavior": "Messages arrive through in. set <text> updates the runtime comment text silently. Inspector text edits remain graph patches.",
    "relatedNodes": [
      "core.message"
    ],
    "ports": [
      {
        "id": "in",
        "description": "Accepts event<message.any>. A set message updates runtime comment text without output."
      }
    ],
    "params": [
      {
        "id": "text",
        "description": "Saved annotation text."
      }
    ],
    "example": {
      "title": "Annotate a patch",
      "description": "Use comments to label intent near control and render nodes. Send set <text> to update runtime display text.",
      "graph": "help/v0.1/nodes/core.comment.help.graph.json"
    }
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "core.float",
    "summary": "Stores and emits a floating-point control value.",
    "description": "Use Float when a patch needs a generic numeric control value. Representation such as f32 or f8 is selected separately from the semantic number.float type.",
    "docsPath": "docs/nodes/core.float.md",
    "helpGraph": "help/v0.1/nodes/core.float.help.graph.json",
    "tags": [
      "value",
      "control",
      "number"
    ],
    "runtimeBehavior": "in is the hot inlet: typed values update and emit, bang emits the stored value, and set ... updates silently. cold updates silently.",
    "relatedNodes": [
      "render.fullscreen-shader"
    ],
    "ports": [
      {
        "id": "in",
        "description": "Hot inlet: typed values update and emit; bang emits the stored value; set ... updates silently."
      },
      {
        "id": "cold",
        "description": "Cold inlet: compatible values or set ... update the stored value without emitting."
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
      },
      {
        "id": "widget",
        "description": "Optional display widget. Use slider for a compact runtime slider object."
      },
      {
        "id": "representation",
        "description": "Numeric storage/transport representation such as f32, f16, or f8.e4m3."
      }
    ],
    "example": {
      "title": "Drive a shader uniform",
      "description": "Connect value to a fullscreen shader numeric input, then send runtime in/set/bang events while the preview runs.",
      "graph": "help/v0.1/nodes/core.float.help.graph.json"
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
    "id": "core.int",
    "summary": "Stores and emits a signed integer control value.",
    "description": "Use Int for discrete numeric controls such as counts, selected indices, and integer mode values.",
    "helpGraph": "help/v0.1/nodes/core.int.help.graph.json",
    "tags": [
      "value",
      "control",
      "integer"
    ],
    "runtimeBehavior": "in is the hot inlet: typed values update and emit, bang emits the stored integer, and set ... updates silently. cold updates silently.",
    "relatedNodes": [
      "render.fullscreen-shader"
    ],
    "ports": [
      {
        "id": "in",
        "description": "Hot inlet: typed integer values update and emit; bang emits the stored value; set ... updates silently."
      },
      {
        "id": "cold",
        "description": "Cold inlet: compatible integer values or set ... update without emitting."
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
      "graph": "help/v0.1/nodes/core.int.help.graph.json"
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
    "runtimeBehavior": "Click or bang on in emits the saved message payload. set ... on in updates runtime message text without output. Inspector edits are graph patches.",
    "relatedNodes": [
      "core.string"
    ],
    "ports": [
      {
        "id": "in",
        "description": "Hot message inlet: bang emits saved payload; set ... updates silently; other messages evaluate the stored payload."
      },
      {
        "id": "out",
        "description": "Outputs the saved selector plus typed atoms as a message payload."
      }
    ],
    "params": [
      {
        "id": "value",
        "description": "Saved message box text parsed into selector plus atoms at runtime."
      },
      {
        "id": "sendName",
        "description": "Optional message channel name updated whenever the message emits."
      },
      {
        "id": "receiveName",
        "description": "Optional message channel name used to receive routed message updates."
      }
    ],
    "example": {
      "title": "Trigger a string message",
      "description": "Use Bang to emit the saved message text on demand.",
      "graph": "help/v0.1/nodes/core.message.help.graph.json"
    }
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "core.operator.add",
    "summary": "Pd-style + control operator.",
    "description": "Add is a Pd-style control-rate operator with a hot in inlet, sticky right operand, and value output.",
    "helpGraph": "help/v0.1/nodes/core.operator.add.help.graph.json",
    "tags": [
      "control",
      "operator",
      "pd"
    ],
    "runtimeBehavior": "Creation arguments initialize right. Hot numeric input computes and emits; bang re-emits; right updates silently."
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "core.operator.div",
    "summary": "Pd-style / control operator.",
    "description": "Divide is a Pd-style control-rate operator with a hot in inlet, sticky right operand, and value output.",
    "helpGraph": "help/v0.1/nodes/core.operator.div.help.graph.json",
    "tags": [
      "control",
      "operator",
      "pd"
    ],
    "runtimeBehavior": "Creation arguments initialize right. Hot numeric input computes and emits; bang re-emits; right updates silently."
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "core.operator.max",
    "summary": "Pd-style max control operator.",
    "description": "Maximum is a Pd-style control-rate operator with a hot in inlet, sticky right operand, and value output.",
    "helpGraph": "help/v0.1/nodes/core.operator.max.help.graph.json",
    "tags": [
      "control",
      "operator",
      "pd"
    ],
    "runtimeBehavior": "Creation arguments initialize right. Hot numeric input computes and emits; bang re-emits; right updates silently."
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "core.operator.min",
    "summary": "Pd-style min control operator.",
    "description": "Minimum is a Pd-style control-rate operator with a hot in inlet, sticky right operand, and value output.",
    "helpGraph": "help/v0.1/nodes/core.operator.min.help.graph.json",
    "tags": [
      "control",
      "operator",
      "pd"
    ],
    "runtimeBehavior": "Creation arguments initialize right. Hot numeric input computes and emits; bang re-emits; right updates silently."
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "core.operator.mul",
    "summary": "Pd-style * control operator.",
    "description": "Multiply is a Pd-style control-rate operator with a hot in inlet, sticky right operand, and value output.",
    "helpGraph": "help/v0.1/nodes/core.operator.mul.help.graph.json",
    "tags": [
      "control",
      "operator",
      "pd"
    ],
    "runtimeBehavior": "Creation arguments initialize right. Hot numeric input computes and emits; bang re-emits; right updates silently."
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "core.operator.pow",
    "summary": "Pd-style pow control operator.",
    "description": "Power is a Pd-style control-rate operator with a hot in inlet, sticky right operand, and value output.",
    "helpGraph": "help/v0.1/nodes/core.operator.pow.help.graph.json",
    "tags": [
      "control",
      "operator",
      "pd"
    ],
    "runtimeBehavior": "Creation arguments initialize right. Hot numeric input computes and emits; bang re-emits; right updates silently."
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "core.operator.sqrt",
    "summary": "Pd-style sqrt control operator.",
    "description": "Square Root is a unary control-rate operator. It outputs 0 for nonpositive input in the Pd-compatible baseline.",
    "helpGraph": "help/v0.1/nodes/core.operator.sqrt.help.graph.json",
    "tags": [
      "control",
      "operator",
      "pd"
    ],
    "runtimeBehavior": "Hot numeric input stores and emits sqrt; bang re-emits the stored result."
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "core.operator.sub",
    "summary": "Pd-style - control operator.",
    "description": "Subtract is a Pd-style control-rate operator with a hot in inlet, sticky right operand, and value output.",
    "helpGraph": "help/v0.1/nodes/core.operator.sub.help.graph.json",
    "tags": [
      "control",
      "operator",
      "pd"
    ],
    "runtimeBehavior": "Creation arguments initialize right. Hot numeric input computes and emits; bang re-emits; right updates silently."
  },
  {
    "schema": "skenion.node.help",
    "schemaVersion": "0.1.0",
    "id": "core.panel",
    "summary": "Draws a colored background panel on the patch canvas.",
    "description": "Panel is a visual patch annotation object. Its saved default is transparent unless a color param is set. It receives message events on its inlet; set <hex> updates its runtime color state silently, but it does not output values.",
    "helpGraph": "help/v0.1/nodes/core.panel.help.graph.json",
    "tags": [
      "annotation",
      "panel",
      "background"
    ],
    "runtimeBehavior": "Messages arrive through in. set <hex> updates the runtime panel CSS color text silently. Inspector color edits remain graph patches.",
    "relatedNodes": [
      "core.comment",
      "core.message"
    ],
    "ports": [
      {
        "id": "in",
        "description": "Accepts event<message.any>. A set #00ff00 message updates the panel CSS color text without output."
      }
    ],
    "params": [
      {
        "id": "color",
        "description": "Optional saved panel color as a CSS hex string. Omit for transparent."
      },
      {
        "id": "label",
        "description": "Optional panel title text."
      },
      {
        "id": "receiveName",
        "description": "Optional string channel name used to receive routed CSS color text updates."
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
    "id": "core.string",
    "summary": "Stores and emits a string control value.",
    "description": "Use String for labels, symbolic control values, and text payloads that should move through the graph as data.",
    "helpGraph": "help/v0.1/nodes/core.string.help.graph.json",
    "tags": [
      "value",
      "control",
      "text"
    ],
    "runtimeBehavior": "in is the hot inlet: string values update and emit, bang emits the stored string, and set ... updates silently. cold updates silently.",
    "relatedNodes": [
      "core.message"
    ],
    "ports": [
      {
        "id": "in",
        "description": "Hot inlet: string values update and emit; bang emits the stored text; set ... updates silently."
      },
      {
        "id": "cold",
        "description": "Cold inlet: compatible string values or set ... update without emitting."
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
    "id": "core.uint",
    "summary": "Stores and emits an unsigned integer control value.",
    "description": "UInt is a Max-style unsigned integer value object. in updates and emits, set updates silently, and bang emits the current value.",
    "helpGraph": "help/v0.1/nodes/core.uint.help.graph.json",
    "tags": [
      "value",
      "control",
      "integer",
      "uint"
    ],
    "runtimeBehavior": "in is the hot inlet: typed values update and emit, bang emits the stored unsigned integer, and set ... updates silently. cold updates silently.",
    "relatedNodes": [
      "render.fullscreen-shader"
    ],
    "ports": [
      {
        "id": "in",
        "description": "Hot inlet: typed unsigned integer values update and emit; bang emits the stored value; set ... updates silently."
      },
      {
        "id": "cold",
        "description": "Cold inlet: compatible unsigned integer values or set ... update without emitting."
      },
      {
        "id": "value",
        "description": "Outputs the current value."
      }
    ],
    "params": [
      {
        "id": "value",
        "description": "Saved default unsigned integer value."
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
      "graph": "help/v0.1/nodes/core.uint.help.graph.json"
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
    "runtimeBehavior": "On each preview frame, produces a gpu.texture2d resource cleared to params.color/rgba32f.",
    "relatedNodes": [
      "render.output",
      "render.fullscreen-shader",
      "core.color"
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
        "description": "Saved RGBA clear color/rgba32f."
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
      "core.float",
      "core.color",
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
  }
] satisfies BuiltinNodeHelpV01[];

export const builtinNodeHelpGraphsV01 = [
  {
    "id": "audio.cos",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-audio-cos",
      "revision": "1",
      "nodes": [],
      "edges": []
    }
  },
  {
    "id": "audio.noise",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-audio-noise",
      "revision": "1",
      "nodes": [],
      "edges": []
    }
  },
  {
    "id": "audio.operator.add",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-audio-operator-add",
      "revision": "1",
      "nodes": [],
      "edges": []
    }
  },
  {
    "id": "audio.operator.div",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-audio-operator-div",
      "revision": "1",
      "nodes": [],
      "edges": []
    }
  },
  {
    "id": "audio.operator.mul",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-audio-operator-mul",
      "revision": "1",
      "nodes": [],
      "edges": []
    }
  },
  {
    "id": "audio.operator.sqrt",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-audio-operator-sqrt",
      "revision": "1",
      "nodes": [],
      "edges": []
    }
  },
  {
    "id": "audio.operator.sub",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-audio-operator-sub",
      "revision": "1",
      "nodes": [],
      "edges": []
    }
  },
  {
    "id": "audio.osc",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-audio-osc",
      "revision": "1",
      "nodes": [],
      "edges": []
    }
  },
  {
    "id": "audio.phasor",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-audio-phasor",
      "revision": "1",
      "nodes": [],
      "edges": []
    }
  },
  {
    "id": "audio.sig",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-audio-sig",
      "revision": "1",
      "nodes": [],
      "edges": []
    }
  },
  {
    "id": "audio.snapshot",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-audio-snapshot",
      "revision": "1",
      "nodes": [],
      "edges": []
    }
  },
  {
    "id": "clock.local",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-clock-local",
      "revision": "1",
      "nodes": [
        {
          "id": "clock_1",
          "kind": "clock.local",
          "kindVersion": "0.1.0",
          "params": {
            "tempoBpm": 120,
            "running": true
          },
          "ports": [
            {
              "id": "sync",
              "direction": "input",
              "label": "Sync",
              "type": {
                "flow": "value",
                "dataKind": "clock.state"
              },
              "required": false,
              "activation": "latched"
            },
            {
              "id": "reset",
              "direction": "input",
              "label": "Reset",
              "type": {
                "flow": "event",
                "dataKind": "event.bang"
              },
              "required": false,
              "activation": "trigger"
            },
            {
              "id": "state",
              "direction": "output",
              "label": "State",
              "type": {
                "flow": "value",
                "dataKind": "clock.state"
              }
            },
            {
              "id": "tick",
              "direction": "output",
              "label": "Tick",
              "type": {
                "flow": "event",
                "dataKind": "event.bang"
              }
            },
            {
              "id": "phase",
              "direction": "output",
              "label": "Phase",
              "type": {
                "flow": "value",
                "dataKind": "number.float",
                "format": "f32",
                "range": {
                  "min": 0,
                  "max": 1
                }
              }
            },
            {
              "id": "tempo",
              "direction": "output",
              "label": "Tempo",
              "type": {
                "flow": "value",
                "dataKind": "number.float",
                "unit": "bpm",
                "format": "f32"
              }
            }
          ]
        },
        {
          "id": "display_1",
          "kind": "clock.position-display",
          "kindVersion": "0.1.0",
          "params": {},
          "ports": [
            {
              "id": "clock",
              "direction": "input",
              "label": "Clock",
              "type": {
                "flow": "value",
                "dataKind": "clock.state"
              },
              "required": false,
              "activation": "latched"
            }
          ]
        }
      ],
      "edges": [
        {
          "from": {
            "node": "clock_1",
            "port": "state"
          },
          "to": {
            "node": "display_1",
            "port": "clock"
          }
        }
      ]
    }
  },
  {
    "id": "clock.position-display",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-clock-position-display",
      "revision": "1",
      "nodes": [
        {
          "id": "clock_1",
          "kind": "clock.local",
          "kindVersion": "0.1.0",
          "params": {
            "tempoBpm": 120,
            "running": true
          },
          "ports": [
            {
              "id": "state",
              "direction": "output",
              "label": "State",
              "type": {
                "flow": "value",
                "dataKind": "clock.state"
              }
            }
          ]
        },
        {
          "id": "display_1",
          "kind": "clock.position-display",
          "kindVersion": "0.1.0",
          "params": {
            "fields": [
              "bar",
              "beat",
              "division",
              "tick",
              "timecode"
            ]
          },
          "ports": [
            {
              "id": "clock",
              "direction": "input",
              "label": "Clock",
              "type": {
                "flow": "value",
                "dataKind": "clock.state"
              },
              "required": false,
              "activation": "latched"
            }
          ]
        }
      ],
      "edges": [
        {
          "from": {
            "node": "clock_1",
            "port": "state"
          },
          "to": {
            "node": "display_1",
            "port": "clock"
          }
        }
      ]
    }
  },
  {
    "id": "core.bang",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-core-bang",
      "revision": "1",
      "nodes": [
        {
          "id": "bang_1",
          "kind": "core.bang",
          "kindVersion": "0.1.0",
          "params": {},
          "ports": [
            {
              "id": "in",
              "direction": "input",
              "label": "In",
              "type": {
                "flow": "event",
                "dataKind": "message.any"
              },
              "required": false,
              "activation": "trigger"
            },
            {
              "id": "out",
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
          "kind": "core.float",
          "kindVersion": "0.1.0",
          "params": {
            "value": 0.5,
            "representation": "f32",
            "widget": "number"
          },
          "ports": [
            {
              "id": "in",
              "direction": "input",
              "label": "In",
              "type": {
                "flow": "event",
                "dataKind": "message.any"
              },
              "required": false,
              "activation": "trigger"
            },
            {
              "id": "cold",
              "direction": "input",
              "label": "Cold",
              "type": {
                "flow": "value",
                "dataKind": "number.float",
                "format": "f32"
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
                "dataKind": "number.float",
                "format": "f32"
              }
            }
          ]
        }
      ],
      "edges": [
        {
          "from": {
            "node": "bang_1",
            "port": "out"
          },
          "to": {
            "node": "value_1",
            "port": "in"
          }
        }
      ]
    }
  },
  {
    "id": "core.bool",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-core-bool",
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
          "kindVersion": "0.1.0",
          "params": {},
          "ports": [
            {
              "id": "in",
              "direction": "input",
              "label": "In",
              "type": {
                "flow": "event",
                "dataKind": "message.any"
              },
              "required": false,
              "activation": "trigger"
            },
            {
              "id": "out",
              "direction": "output",
              "label": "Bang",
              "type": {
                "flow": "event",
                "dataKind": "event.bang"
              }
            }
          ],
          "kind": "core.bang"
        },
        {
          "id": "value_1",
          "kind": "core.bool",
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
                "flow": "event",
                "dataKind": "message.any"
              },
              "required": false,
              "activation": "trigger"
            },
            {
              "id": "cold",
              "direction": "input",
              "label": "Cold",
              "type": {
                "flow": "value",
                "dataKind": "boolean"
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
        },
        {
          "id": "toggle_1",
          "kindVersion": "0.1.0",
          "params": {
            "value": false,
            "widget": "toggle"
          },
          "ports": [
            {
              "id": "in",
              "direction": "input",
              "label": "In",
              "type": {
                "flow": "event",
                "dataKind": "message.any"
              },
              "required": false,
              "activation": "trigger"
            },
            {
              "id": "cold",
              "direction": "input",
              "label": "Cold",
              "type": {
                "flow": "value",
                "dataKind": "boolean"
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
          "kind": "core.bool"
        }
      ],
      "edges": [
        {
          "from": {
            "node": "bang_1",
            "port": "out"
          },
          "to": {
            "node": "value_1",
            "port": "in"
          }
        },
        {
          "from": {
            "node": "value_1",
            "port": "value"
          },
          "to": {
            "node": "toggle_1",
            "port": "cold"
          }
        }
      ]
    }
  },
  {
    "id": "core.color",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-core-color",
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
          "kind": "core.color",
          "kindVersion": "0.1.0",
          "params": {
            "value": [
              1,
              0.2,
              0.1,
              1
            ],
            "representation": "rgba32f",
            "colorSpace": "linear"
          },
          "ports": [
            {
              "id": "in",
              "direction": "input",
              "label": "In",
              "type": {
                "flow": "event",
                "dataKind": "message.any"
              },
              "required": false,
              "activation": "trigger"
            },
            {
              "id": "cold",
              "direction": "input",
              "label": "Cold",
              "type": {
                "flow": "value",
                "dataKind": "color",
                "format": "rgba32f",
                "colorSpace": "linear"
              },
              "required": false,
              "activation": "latched"
            },
            {
              "id": "value",
              "direction": "output",
              "label": "Color",
              "type": {
                "flow": "value",
                "dataKind": "color",
                "format": "rgba32f",
                "colorSpace": "linear"
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
            "source": "// @skenion.uniform tint color default=[1,0.2,0.1,1]\nfn fs_main() -> @location(0) vec4<f32> { return skenion_uniforms.tint; }"
          },
          "ports": [
            {
              "id": "tint",
              "direction": "input",
              "label": "Tint",
              "type": {
                "flow": "value",
                "dataKind": "color",
                "format": "rgba32f",
                "colorSpace": "linear"
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
            "text": "Comments annotate a patch. Send set <text> to in to update runtime display text."
          },
          "ports": [
            {
              "id": "in",
              "direction": "input",
              "label": "In",
              "type": {
                "flow": "event",
                "dataKind": "message.any"
              },
              "required": false,
              "activation": "trigger"
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
              "id": "in",
              "direction": "input",
              "label": "In",
              "type": {
                "flow": "event",
                "dataKind": "message.any"
              },
              "required": false,
              "activation": "trigger"
            }
          ]
        }
      ],
      "edges": []
    }
  },
  {
    "id": "core.float",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-core-float",
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
          "kindVersion": "0.1.0",
          "params": {},
          "ports": [
            {
              "id": "in",
              "direction": "input",
              "label": "In",
              "type": {
                "flow": "event",
                "dataKind": "message.any"
              },
              "required": false,
              "activation": "trigger"
            },
            {
              "id": "out",
              "direction": "output",
              "label": "Bang",
              "type": {
                "flow": "event",
                "dataKind": "event.bang"
              }
            }
          ],
          "kind": "core.bang"
        },
        {
          "id": "value_1",
          "kind": "core.float",
          "kindVersion": "0.1.0",
          "params": {
            "value": 0.5,
            "representation": "f32"
          },
          "ports": [
            {
              "id": "in",
              "direction": "input",
              "label": "In",
              "type": {
                "flow": "event",
                "dataKind": "message.any"
              },
              "required": false,
              "activation": "trigger"
            },
            {
              "id": "cold",
              "direction": "input",
              "label": "Cold",
              "type": {
                "flow": "value",
                "dataKind": "number.float",
                "format": "f32"
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
                "dataKind": "number.float",
                "format": "f32"
              }
            }
          ]
        },
        {
          "id": "target_1",
          "kindVersion": "0.1.0",
          "params": {},
          "ports": [
            {
              "id": "in",
              "direction": "input",
              "label": "In",
              "type": {
                "flow": "event",
                "dataKind": "message.any"
              },
              "required": false,
              "activation": "trigger"
            },
            {
              "id": "cold",
              "direction": "input",
              "label": "Cold",
              "type": {
                "flow": "value",
                "dataKind": "number.float",
                "format": "f32"
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
                "dataKind": "number.float",
                "format": "f32"
              }
            }
          ],
          "kind": "core.float"
        }
      ],
      "edges": [
        {
          "from": {
            "node": "bang_1",
            "port": "out"
          },
          "to": {
            "node": "value_1",
            "port": "in"
          }
        },
        {
          "from": {
            "node": "value_1",
            "port": "value"
          },
          "to": {
            "node": "target_1",
            "port": "in"
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
    "id": "core.int",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-core-int",
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
          "kindVersion": "0.1.0",
          "params": {},
          "ports": [
            {
              "id": "in",
              "direction": "input",
              "label": "In",
              "type": {
                "flow": "event",
                "dataKind": "message.any"
              },
              "required": false,
              "activation": "trigger"
            },
            {
              "id": "out",
              "direction": "output",
              "label": "Bang",
              "type": {
                "flow": "event",
                "dataKind": "event.bang"
              }
            }
          ],
          "kind": "core.bang"
        },
        {
          "id": "value_1",
          "kind": "core.int",
          "kindVersion": "0.1.0",
          "params": {
            "value": 8,
            "representation": "i32"
          },
          "ports": [
            {
              "id": "in",
              "direction": "input",
              "label": "In",
              "type": {
                "flow": "event",
                "dataKind": "message.any"
              },
              "required": false,
              "activation": "trigger"
            },
            {
              "id": "cold",
              "direction": "input",
              "label": "Cold",
              "type": {
                "flow": "value",
                "dataKind": "number.int",
                "format": "i32"
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
                "dataKind": "number.int",
                "format": "i32"
              }
            }
          ]
        }
      ],
      "edges": [
        {
          "from": {
            "node": "bang_1",
            "port": "out"
          },
          "to": {
            "node": "value_1",
            "port": "in"
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
          "kindVersion": "0.1.0",
          "params": {},
          "ports": [
            {
              "id": "in",
              "direction": "input",
              "label": "In",
              "type": {
                "flow": "event",
                "dataKind": "message.any"
              },
              "required": false,
              "activation": "trigger"
            },
            {
              "id": "out",
              "direction": "output",
              "label": "Bang",
              "type": {
                "flow": "event",
                "dataKind": "event.bang"
              }
            }
          ],
          "kind": "core.bang"
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
              "id": "in",
              "direction": "input",
              "label": "In",
              "type": {
                "flow": "event",
                "dataKind": "message.any"
              },
              "required": false,
              "activation": "trigger"
            },
            {
              "id": "out",
              "direction": "output",
              "label": "Message",
              "type": {
                "flow": "event",
                "dataKind": "message.any"
              }
            }
          ]
        }
      ],
      "edges": [
        {
          "from": {
            "node": "bang_1",
            "port": "out"
          },
          "to": {
            "node": "message_1",
            "port": "in"
          }
        }
      ]
    }
  },
  {
    "id": "core.operator.add",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-core-operator-add",
      "revision": "1",
      "nodes": [],
      "edges": []
    }
  },
  {
    "id": "core.operator.div",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-core-operator-div",
      "revision": "1",
      "nodes": [],
      "edges": []
    }
  },
  {
    "id": "core.operator.max",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-core-operator-max",
      "revision": "1",
      "nodes": [],
      "edges": []
    }
  },
  {
    "id": "core.operator.min",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-core-operator-min",
      "revision": "1",
      "nodes": [],
      "edges": []
    }
  },
  {
    "id": "core.operator.mul",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-core-operator-mul",
      "revision": "1",
      "nodes": [],
      "edges": []
    }
  },
  {
    "id": "core.operator.pow",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-core-operator-pow",
      "revision": "1",
      "nodes": [],
      "edges": []
    }
  },
  {
    "id": "core.operator.sqrt",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-core-operator-sqrt",
      "revision": "1",
      "nodes": [],
      "edges": []
    }
  },
  {
    "id": "core.operator.sub",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-core-operator-sub",
      "revision": "1",
      "nodes": [],
      "edges": []
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
              "id": "in",
              "direction": "input",
              "label": "In",
              "type": {
                "flow": "event",
                "dataKind": "message.any"
              },
              "required": false,
              "activation": "trigger"
            }
          ]
        },
        {
          "id": "note_1",
          "kind": "core.comment",
          "kindVersion": "0.1.0",
          "params": {
            "text": "Panel is a visual grouping object. Send set #00ff00 to in to update runtime color state."
          },
          "ports": [
            {
              "id": "in",
              "direction": "input",
              "label": "In",
              "type": {
                "flow": "event",
                "dataKind": "message.any"
              },
              "required": false,
              "activation": "trigger"
            }
          ]
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
          "kindVersion": "0.1.0",
          "params": {},
          "ports": [
            {
              "id": "in",
              "direction": "input",
              "label": "In",
              "type": {
                "flow": "event",
                "dataKind": "message.any"
              },
              "required": false,
              "activation": "trigger"
            },
            {
              "id": "out",
              "direction": "output",
              "label": "Bang",
              "type": {
                "flow": "event",
                "dataKind": "event.bang"
              }
            }
          ],
          "kind": "core.bang"
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
                "flow": "event",
                "dataKind": "message.any"
              },
              "required": false,
              "activation": "trigger"
            },
            {
              "id": "cold",
              "direction": "input",
              "label": "Cold",
              "type": {
                "flow": "value",
                "dataKind": "string"
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
            "port": "out"
          },
          "to": {
            "node": "text_1",
            "port": "in"
          }
        }
      ]
    }
  },
  {
    "id": "core.uint",
    "graph": {
      "schema": "skenion.graph",
      "schemaVersion": "0.1.0",
      "id": "help-core-uint",
      "revision": "1",
      "nodes": [
        {
          "id": "note_1",
          "kind": "core.comment",
          "kindVersion": "0.1.0",
          "params": {
            "text": "UInt stores non-negative integer values such as counts or modes."
          },
          "ports": []
        },
        {
          "id": "bang_1",
          "kindVersion": "0.1.0",
          "params": {},
          "ports": [
            {
              "id": "in",
              "direction": "input",
              "label": "In",
              "type": {
                "flow": "event",
                "dataKind": "message.any"
              },
              "required": false,
              "activation": "trigger"
            },
            {
              "id": "out",
              "direction": "output",
              "label": "Bang",
              "type": {
                "flow": "event",
                "dataKind": "event.bang"
              }
            }
          ],
          "kind": "core.bang"
        },
        {
          "id": "value_1",
          "kind": "core.uint",
          "kindVersion": "0.1.0",
          "params": {
            "value": 8,
            "representation": "u32"
          },
          "ports": [
            {
              "id": "in",
              "direction": "input",
              "label": "In",
              "type": {
                "flow": "event",
                "dataKind": "message.any"
              },
              "required": false,
              "activation": "trigger"
            },
            {
              "id": "cold",
              "direction": "input",
              "label": "Cold",
              "type": {
                "flow": "value",
                "dataKind": "number.uint",
                "format": "u32"
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
                "dataKind": "number.uint",
                "format": "u32"
              }
            }
          ]
        }
      ],
      "edges": [
        {
          "from": {
            "node": "bang_1",
            "port": "out"
          },
          "to": {
            "node": "value_1",
            "port": "in"
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
          "kind": "core.float",
          "kindVersion": "0.1.0",
          "params": {
            "value": 0.35,
            "representation": "f32"
          },
          "ports": [
            {
              "id": "in",
              "direction": "input",
              "label": "In",
              "type": {
                "flow": "event",
                "dataKind": "message.any"
              },
              "required": false,
              "activation": "trigger"
            },
            {
              "id": "cold",
              "direction": "input",
              "label": "Cold",
              "type": {
                "flow": "value",
                "dataKind": "number.float",
                "format": "f32"
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
                "dataKind": "number.float",
                "format": "f32"
              }
            }
          ]
        },
        {
          "id": "tint_1",
          "kind": "core.color",
          "kindVersion": "0.1.0",
          "params": {
            "value": [
              0.2,
              0.6,
              1,
              1
            ],
            "representation": "rgba32f",
            "colorSpace": "linear"
          },
          "ports": [
            {
              "id": "in",
              "direction": "input",
              "label": "In",
              "type": {
                "flow": "event",
                "dataKind": "message.any"
              },
              "required": false,
              "activation": "trigger"
            },
            {
              "id": "cold",
              "direction": "input",
              "label": "Cold",
              "type": {
                "flow": "value",
                "dataKind": "color",
                "format": "rgba32f",
                "colorSpace": "linear"
              },
              "required": false,
              "activation": "latched"
            },
            {
              "id": "value",
              "direction": "output",
              "label": "Color",
              "type": {
                "flow": "value",
                "dataKind": "color",
                "format": "rgba32f",
                "colorSpace": "linear"
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
            "source": "// @skenion.uniform speed number.float default=0.35\n// @skenion.uniform tint color default=[0.2,0.6,1,1]\nfn fs_main() -> @location(0) vec4<f32> { return skenion_uniforms.tint * skenion_uniforms.speed; }"
          },
          "ports": [
            {
              "id": "speed",
              "direction": "input",
              "label": "Speed",
              "type": {
                "flow": "value",
                "dataKind": "number.float",
                "format": "f32"
              },
              "activation": "latched"
            },
            {
              "id": "tint",
              "direction": "input",
              "label": "Tint",
              "type": {
                "flow": "value",
                "dataKind": "color",
                "format": "rgba32f",
                "colorSpace": "linear"
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
