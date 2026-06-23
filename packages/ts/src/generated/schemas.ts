/* This file is generated from the repository JSON Schema sources. */

export const graphV01Schema = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://skenion.dev/schemas/graph/v0.1/graph.schema.json",
  "title": "skenion Graph Document v0.1",
  "type": "object",
  "required": [
    "schema",
    "schemaVersion",
    "id",
    "revision",
    "nodes",
    "edges"
  ],
  "properties": {
    "schema": {
      "const": "skenion.graph"
    },
    "schemaVersion": {
      "const": "0.1.0"
    },
    "id": {
      "type": "string",
      "minLength": 1
    },
    "revision": {
      "type": "string",
      "minLength": 1
    },
    "nodes": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/node"
      }
    },
    "edges": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/edge"
      }
    },
    "cableStyles": {
      "$ref": "#/$defs/cableStyleRegistry"
    }
  },
  "additionalProperties": false,
  "$defs": {
    "node": {
      "type": "object",
      "required": [
        "id",
        "kind",
        "kindVersion",
        "params",
        "ports"
      ],
      "properties": {
        "id": {
          "type": "string",
          "minLength": 1
        },
        "kind": {
          "type": "string",
          "minLength": 1
        },
        "kindVersion": {
          "type": "string",
          "minLength": 1
        },
        "params": {
          "type": "object",
          "additionalProperties": true
        },
        "ports": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/port"
          }
        },
        "portGroups": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/portGroup"
          }
        }
      },
      "additionalProperties": false
    },
    "port": {
      "type": "object",
      "required": [
        "id",
        "direction",
        "type"
      ],
      "properties": {
        "id": {
          "type": "string",
          "minLength": 1
        },
        "direction": {
          "enum": [
            "input",
            "output"
          ]
        },
        "type": {
          "type": "string",
          "minLength": 1
        },
        "label": {
          "type": "string"
        },
        "rate": {
          "enum": [
            "event",
            "control",
            "audio",
            "render",
            "gpu",
            "resource",
            "io"
          ]
        },
        "accepts": {
          "type": "array",
          "items": {
            "type": "string",
            "minLength": 1
          },
          "uniqueItems": true
        },
        "minConnections": {
          "type": "integer",
          "minimum": 0
        },
        "maxConnections": {
          "oneOf": [
            {
              "type": "integer",
              "minimum": 0
            },
            {
              "type": "null"
            }
          ]
        },
        "mergePolicy": {
          "enum": [
            "forbid",
            "ordered-events",
            "mix",
            "array",
            "latest",
            "first",
            "custom"
          ]
        },
        "fanOutPolicy": {
          "enum": [
            "allow",
            "forbid",
            "copy",
            "share"
          ]
        },
        "triggerMode": {
          "enum": [
            "passive",
            "trigger",
            "latched"
          ]
        },
        "defaultValue": true,
        "latch": {
          "type": "boolean"
        },
        "required": {
          "type": "boolean"
        },
        "styleKey": {
          "type": "string",
          "minLength": 1
        },
        "group": {
          "type": "string",
          "minLength": 1
        },
        "description": {
          "type": "string"
        }
      },
      "additionalProperties": false
    },
    "portGroup": {
      "type": "object",
      "required": [
        "id",
        "direction",
        "type",
        "minPorts"
      ],
      "properties": {
        "id": {
          "type": "string",
          "minLength": 1
        },
        "label": {
          "type": "string"
        },
        "direction": {
          "enum": [
            "input",
            "output"
          ]
        },
        "type": {
          "type": "string",
          "minLength": 1
        },
        "rate": {
          "enum": [
            "event",
            "control",
            "audio",
            "render",
            "gpu",
            "resource",
            "io"
          ]
        },
        "minPorts": {
          "type": "integer",
          "minimum": 0
        },
        "maxPorts": {
          "type": "integer",
          "minimum": 0
        },
        "ordered": {
          "type": "boolean"
        },
        "portIdPattern": {
          "type": "string",
          "minLength": 1
        },
        "createLabel": {
          "type": "string"
        },
        "defaultPortSpec": {
          "$ref": "#/$defs/port"
        }
      },
      "additionalProperties": false
    },
    "edge": {
      "type": "object",
      "required": [
        "id",
        "source",
        "target"
      ],
      "properties": {
        "id": {
          "type": "string",
          "minLength": 1
        },
        "source": {
          "$ref": "#/$defs/portEndpoint"
        },
        "target": {
          "$ref": "#/$defs/portEndpoint"
        },
        "resolvedType": {
          "type": "string",
          "minLength": 1
        },
        "order": {
          "type": "integer",
          "minimum": 0
        },
        "enabled": {
          "type": "boolean"
        },
        "adapter": {
          "type": "string",
          "minLength": 1
        },
        "feedback": {
          "$ref": "#/$defs/feedbackPolicy"
        },
        "styleOverride": {
          "type": "string",
          "minLength": 1
        },
        "label": {
          "type": "string"
        },
        "description": {
          "type": "string"
        }
      },
      "additionalProperties": false
    },
    "portEndpoint": {
      "type": "object",
      "required": [
        "nodeId",
        "portId"
      ],
      "properties": {
        "nodeId": {
          "type": "string",
          "minLength": 1
        },
        "portId": {
          "type": "string",
          "minLength": 1
        }
      },
      "additionalProperties": false
    },
    "feedbackPolicy": {
      "type": "object",
      "required": [
        "enabled",
        "boundary"
      ],
      "properties": {
        "enabled": {
          "type": "boolean"
        },
        "boundary": {
          "enum": [
            "same-turn",
            "next-tick",
            "control-frame",
            "audio-sample",
            "audio-block",
            "render-frame",
            "gpu-pingpong",
            "manual"
          ]
        },
        "initialValue": true,
        "recursionLimit": {
          "type": "integer",
          "minimum": 0
        },
        "maxEventsPerTick": {
          "type": "integer",
          "minimum": 1
        },
        "maxIterationsPerFrame": {
          "type": "integer",
          "minimum": 1
        },
        "bufferMode": {
          "enum": [
            "latest",
            "queue",
            "ring",
            "pingpong"
          ]
        },
        "intentional": {
          "type": "boolean"
        },
        "label": {
          "type": "string"
        }
      },
      "additionalProperties": false
    },
    "cableStyleRegistry": {
      "type": "object",
      "additionalProperties": {
        "type": "object",
        "properties": {
          "color": {
            "type": "string"
          },
          "pattern": {
            "enum": [
              "solid",
              "dashed",
              "dotted"
            ]
          },
          "width": {
            "type": "number",
            "exclusiveMinimum": 0
          },
          "marker": {
            "type": "string"
          }
        },
        "additionalProperties": false
      }
    }
  }
} as const;

export const graphFragmentV01Schema = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://skenion.dev/schemas/graph/v0.1/fragment.schema.json",
  "title": "skenion Graph Fragment v0.1",
  "type": "object",
  "required": [
    "schema",
    "schemaVersion",
    "nodes",
    "edges"
  ],
  "properties": {
    "schema": {
      "const": "skenion.graph.fragment"
    },
    "schemaVersion": {
      "const": "0.1.0"
    },
    "id": {
      "type": "string",
      "minLength": 1
    },
    "nodes": {
      "type": "array",
      "items": {
        "$ref": "https://skenion.dev/schemas/graph/v0.1/graph.schema.json#/$defs/node"
      }
    },
    "edges": {
      "type": "array",
      "items": {
        "$ref": "https://skenion.dev/schemas/graph/v0.1/graph.schema.json#/$defs/edge"
      }
    },
    "view": {
      "$ref": "#/$defs/fragmentView"
    },
    "omittedEdges": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/omittedEdge"
      }
    },
    "metadata": {
      "type": "object",
      "additionalProperties": true
    }
  },
  "additionalProperties": false,
  "$defs": {
    "fragmentView": {
      "type": "object",
      "properties": {
        "nodes": {
          "type": "object",
          "additionalProperties": {
            "$ref": "#/$defs/nodeView"
          }
        }
      },
      "additionalProperties": false
    },
    "nodeView": {
      "type": "object",
      "required": [
        "x",
        "y"
      ],
      "properties": {
        "x": {
          "type": "number"
        },
        "y": {
          "type": "number"
        },
        "width": {
          "type": "number"
        },
        "height": {
          "type": "number"
        },
        "collapsed": {
          "type": "boolean"
        }
      },
      "additionalProperties": false
    },
    "omittedEdge": {
      "type": "object",
      "required": [
        "id",
        "source",
        "target",
        "reason"
      ],
      "properties": {
        "id": {
          "type": "string",
          "minLength": 1
        },
        "source": {
          "$ref": "https://skenion.dev/schemas/graph/v0.1/graph.schema.json#/$defs/portEndpoint"
        },
        "target": {
          "$ref": "https://skenion.dev/schemas/graph/v0.1/graph.schema.json#/$defs/portEndpoint"
        },
        "reason": {
          "enum": [
            "outside-fragment",
            "policy-omit"
          ]
        }
      },
      "additionalProperties": false
    }
  }
} as const;

export const viewStateV01Schema = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://skenion.dev/schemas/view/v0.1/view-state.schema.json",
  "title": "skenion View State v0.1",
  "type": "object",
  "required": [
    "schema",
    "schemaVersion",
    "canvas"
  ],
  "properties": {
    "schema": {
      "const": "skenion.view-state"
    },
    "schemaVersion": {
      "const": "0.1.0"
    },
    "canvas": {
      "type": "object",
      "required": [
        "nodes"
      ],
      "properties": {
        "nodes": {
          "type": "object",
          "additionalProperties": {
            "$ref": "#/$defs/nodeView"
          }
        },
        "viewport": {
          "$ref": "#/$defs/viewport"
        }
      },
      "additionalProperties": false
    }
  },
  "additionalProperties": false,
  "$defs": {
    "nodeView": {
      "type": "object",
      "required": [
        "x",
        "y"
      ],
      "properties": {
        "x": {
          "type": "number"
        },
        "y": {
          "type": "number"
        },
        "width": {
          "type": "number",
          "exclusiveMinimum": 0
        },
        "height": {
          "type": "number",
          "exclusiveMinimum": 0
        },
        "collapsed": {
          "type": "boolean"
        }
      },
      "additionalProperties": false
    },
    "viewport": {
      "type": "object",
      "required": [
        "x",
        "y",
        "zoom"
      ],
      "properties": {
        "x": {
          "type": "number"
        },
        "y": {
          "type": "number"
        },
        "zoom": {
          "type": "number",
          "exclusiveMinimum": 0
        }
      },
      "additionalProperties": false
    }
  }
} as const;

export const projectV01Schema = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://skenion.dev/schemas/project/v0.1/project.schema.json",
  "title": "skenion Project Document v0.1",
  "type": "object",
  "required": [
    "schema",
    "schemaVersion",
    "id",
    "revision",
    "graph",
    "viewState",
    "patchLibrary"
  ],
  "properties": {
    "schema": {
      "const": "skenion.project"
    },
    "schemaVersion": {
      "const": "0.1.0"
    },
    "id": {
      "type": "string",
      "minLength": 1
    },
    "revision": {
      "type": "string",
      "minLength": 1
    },
    "metadata": {
      "$ref": "#/$defs/metadata"
    },
    "graph": {
      "$ref": "https://skenion.dev/schemas/graph/v0.1/graph.schema.json"
    },
    "viewState": {
      "$ref": "https://skenion.dev/schemas/view/v0.1/view-state.schema.json"
    },
    "patchLibrary": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/patchDefinition"
      }
    },
    "tutorial": {
      "type": "object",
      "additionalProperties": true
    },
    "help": {
      "type": "object",
      "additionalProperties": true
    }
  },
  "additionalProperties": false,
  "$defs": {
    "metadata": {
      "type": "object",
      "properties": {
        "title": {
          "type": "string"
        },
        "description": {
          "type": "string"
        },
        "createdAt": {
          "type": "string"
        },
        "updatedAt": {
          "type": "string"
        }
      },
      "additionalProperties": true
    },
    "patchDefinition": {
      "type": "object",
      "required": [
        "id",
        "revision",
        "graph"
      ],
      "properties": {
        "id": {
          "type": "string",
          "minLength": 1
        },
        "revision": {
          "type": "string",
          "minLength": 1
        },
        "metadata": {
          "$ref": "#/$defs/metadata"
        },
        "graph": {
          "$ref": "https://skenion.dev/schemas/graph/v0.1/graph.schema.json"
        },
        "viewState": {
          "$ref": "https://skenion.dev/schemas/view/v0.1/view-state.schema.json"
        }
      },
      "additionalProperties": false
    }
  }
} as const;

export const runtimeOperationV0Schema = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://skenion.dev/schemas/runtime/v0/operation.schema.json",
  "title": "skenion Runtime Operation Envelope v0",
  "type": "object",
  "required": [
    "schema",
    "schemaVersion",
    "id",
    "kind",
    "request"
  ],
  "properties": {
    "schema": {
      "const": "skenion.runtime.operation"
    },
    "schemaVersion": {
      "const": "0.1.0"
    },
    "id": {
      "type": "string",
      "minLength": 1
    },
    "kind": {
      "const": "pasteGraphFragment"
    },
    "request": {
      "$ref": "#/$defs/pasteGraphFragmentRequest"
    },
    "attribution": {
      "$ref": "#/$defs/runtimeOperationAttribution"
    },
    "correlationId": {
      "type": "string",
      "minLength": 1
    },
    "createdAt": {
      "type": "string"
    }
  },
  "additionalProperties": false,
  "$defs": {
    "patchPath": {
      "oneOf": [
        {
          "type": "object",
          "required": [
            "kind"
          ],
          "properties": {
            "kind": {
              "const": "root"
            }
          },
          "additionalProperties": false
        },
        {
          "type": "object",
          "required": [
            "kind",
            "patchId"
          ],
          "properties": {
            "kind": {
              "const": "project-patch-definition"
            },
            "patchId": {
              "type": "string",
              "minLength": 1
            }
          },
          "additionalProperties": false
        },
        {
          "type": "object",
          "required": [
            "kind",
            "packageId",
            "patchId"
          ],
          "properties": {
            "kind": {
              "const": "package-patch-definition"
            },
            "packageId": {
              "type": "string",
              "minLength": 1
            },
            "patchId": {
              "type": "string",
              "minLength": 1
            },
            "version": {
              "type": "string",
              "minLength": 1
            }
          },
          "additionalProperties": false
        },
        {
          "type": "object",
          "required": [
            "kind",
            "ownerPath",
            "nodeId"
          ],
          "properties": {
            "kind": {
              "const": "embedded-patch-instance"
            },
            "ownerPath": {
              "type": "array",
              "items": {
                "type": "string",
                "minLength": 1
              }
            },
            "nodeId": {
              "type": "string",
              "minLength": 1
            }
          },
          "additionalProperties": false
        },
        {
          "type": "object",
          "required": [
            "kind",
            "workingCopyId"
          ],
          "properties": {
            "kind": {
              "const": "help-working-copy"
            },
            "workingCopyId": {
              "type": "string",
              "minLength": 1
            },
            "sourcePackageId": {
              "type": "string",
              "minLength": 1
            },
            "sourcePatchId": {
              "type": "string",
              "minLength": 1
            }
          },
          "additionalProperties": false
        }
      ]
    },
    "graphTargetRef": {
      "type": "object",
      "required": [
        "path",
        "baseRevision"
      ],
      "properties": {
        "path": {
          "$ref": "#/$defs/patchPath"
        },
        "baseRevision": {
          "type": "string",
          "minLength": 1
        },
        "targetRevision": {
          "type": "string",
          "minLength": 1
        }
      },
      "additionalProperties": false
    },
    "pastePlacement": {
      "oneOf": [
        {
          "type": "object",
          "required": [
            "kind",
            "x",
            "y"
          ],
          "properties": {
            "kind": {
              "const": "position"
            },
            "x": {
              "type": "number"
            },
            "y": {
              "type": "number"
            }
          },
          "additionalProperties": false
        },
        {
          "type": "object",
          "required": [
            "kind",
            "nodeId"
          ],
          "properties": {
            "kind": {
              "const": "anchor"
            },
            "nodeId": {
              "type": "string",
              "minLength": 1
            },
            "offsetX": {
              "type": "number"
            },
            "offsetY": {
              "type": "number"
            }
          },
          "additionalProperties": false
        }
      ]
    },
    "pasteGraphFragmentOptions": {
      "type": "object",
      "properties": {
        "outsideEndpointPolicy": {
          "enum": [
            "reject",
            "omit"
          ],
          "default": "reject"
        },
        "idConflictPolicy": {
          "enum": [
            "remap",
            "reject"
          ],
          "default": "remap"
        },
        "preserveRelativePositions": {
          "type": "boolean",
          "default": true
        }
      },
      "additionalProperties": false
    },
    "pasteGraphFragmentRequest": {
      "type": "object",
      "required": [
        "target",
        "fragment"
      ],
      "properties": {
        "target": {
          "$ref": "#/$defs/graphTargetRef"
        },
        "fragment": {
          "$ref": "https://skenion.dev/schemas/graph/v0.1/fragment.schema.json"
        },
        "placement": {
          "$ref": "#/$defs/pastePlacement"
        },
        "options": {
          "$ref": "#/$defs/pasteGraphFragmentOptions"
        }
      },
      "additionalProperties": false
    },
    "runtimeOperationAttribution": {
      "type": "object",
      "properties": {
        "actorId": {
          "type": "string",
          "minLength": 1
        },
        "clientId": {
          "type": "string",
          "minLength": 1
        },
        "label": {
          "type": "string"
        }
      },
      "additionalProperties": false
    },
    "idRemapResult": {
      "type": "object",
      "required": [
        "nodeIdMap",
        "edgeIdMap",
        "omittedEdgeIds"
      ],
      "properties": {
        "nodeIdMap": {
          "type": "object",
          "additionalProperties": {
            "type": "string",
            "minLength": 1
          }
        },
        "edgeIdMap": {
          "type": "object",
          "additionalProperties": {
            "type": "string",
            "minLength": 1
          }
        },
        "omittedEdgeIds": {
          "type": "array",
          "items": {
            "type": "string",
            "minLength": 1
          }
        }
      },
      "additionalProperties": false
    },
    "runtimeOperationDiagnosticSeverity": {
      "enum": [
        "error",
        "warning",
        "info"
      ]
    },
    "runtimeOperationDiagnostic": {
      "type": "object",
      "required": [
        "severity",
        "code",
        "message"
      ],
      "properties": {
        "severity": {
          "$ref": "#/$defs/runtimeOperationDiagnosticSeverity"
        },
        "code": {
          "enum": [
            "base-revision-mismatch",
            "duplicate-edge-id",
            "duplicate-node-id",
            "duplicate-target-path",
            "fragment-edge-outside-selection",
            "id-conflict",
            "invalid-target-path",
            "operation-rebased",
            "target-not-found",
            "unsupported-operation"
          ]
        },
        "message": {
          "type": "string"
        },
        "path": {
          "type": "string",
          "minLength": 1
        },
        "target": {
          "$ref": "#/$defs/graphTargetRef"
        },
        "expectedRevision": {
          "type": "string",
          "minLength": 1
        },
        "actualRevision": {
          "type": "string",
          "minLength": 1
        },
        "duplicates": {
          "type": "array",
          "items": {
            "type": "string",
            "minLength": 1
          }
        },
        "nodes": {
          "type": "array",
          "items": {
            "type": "string",
            "minLength": 1
          }
        },
        "edges": {
          "type": "array",
          "items": {
            "type": "string",
            "minLength": 1
          }
        }
      },
      "additionalProperties": false
    },
    "pasteGraphFragmentResponse": {
      "type": "object",
      "required": [
        "schema",
        "schemaVersion",
        "ok",
        "applied",
        "conflict",
        "target",
        "revisionBefore",
        "revisionAfter",
        "historyEntryId",
        "idRemap",
        "diagnostics"
      ],
      "properties": {
        "schema": {
          "const": "skenion.runtime.paste-graph-fragment.response"
        },
        "schemaVersion": {
          "const": "0.1.0"
        },
        "ok": {
          "type": "boolean"
        },
        "applied": {
          "type": "boolean"
        },
        "conflict": {
          "type": "boolean"
        },
        "target": {
          "$ref": "#/$defs/graphTargetRef"
        },
        "revisionBefore": {
          "type": "string",
          "minLength": 1
        },
        "revisionAfter": {
          "anyOf": [
            {
              "type": "string",
              "minLength": 1
            },
            {
              "type": "null"
            }
          ]
        },
        "historyEntryId": {
          "anyOf": [
            {
              "type": "string",
              "minLength": 1
            },
            {
              "type": "null"
            }
          ]
        },
        "idRemap": {
          "$ref": "#/$defs/idRemapResult"
        },
        "diagnostics": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/runtimeOperationDiagnostic"
          }
        }
      },
      "additionalProperties": false
    }
  }
} as const;

export const runtimeSessionV0Schema = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://skenion.dev/schemas/runtime/v0/session.schema.json",
  "title": "skenion Runtime Session Profile v0",
  "type": "object",
  "required": [
    "schema",
    "schemaVersion",
    "ok",
    "sessionId",
    "lifecycle",
    "snapshot",
    "profile",
    "capabilities",
    "eventReplay",
    "diagnostics"
  ],
  "properties": {
    "schema": {
      "const": "skenion.runtime.session.info"
    },
    "schemaVersion": {
      "const": "0.1.0"
    },
    "ok": {
      "type": "boolean"
    },
    "sessionId": {
      "type": "string",
      "minLength": 1
    },
    "lifecycle": {
      "$ref": "#/$defs/runtimeSessionLifecycleState"
    },
    "snapshot": {
      "$ref": "#/$defs/runtimeSessionSnapshot"
    },
    "profile": {
      "$ref": "#/$defs/runtimeConnectionProfile"
    },
    "capabilities": {
      "$ref": "#/$defs/runtimeSessionCapabilitySet"
    },
    "eventReplay": {
      "$ref": "#/$defs/runtimeEventReplayWindow"
    },
    "diagnostics": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/runtimeDiagnostic"
      }
    }
  },
  "additionalProperties": false,
  "$defs": {
    "runtimeDiagnostic": {
      "type": "object",
      "required": [
        "severity",
        "message"
      ],
      "properties": {
        "severity": {
          "enum": [
            "error",
            "warning",
            "info"
          ]
        },
        "message": {
          "type": "string"
        }
      },
      "additionalProperties": false
    },
    "runtimeSessionLifecycleState": {
      "enum": [
        "initializing",
        "ready",
        "closing",
        "closed",
        "error"
      ]
    },
    "runtimeConnectionProfileMode": {
      "enum": [
        "local-managed",
        "local-shared",
        "remote"
      ]
    },
    "runtimeOwnershipMode": {
      "enum": [
        "owned-child",
        "external",
        "remote"
      ]
    },
    "runtimeEndpointMetadata": {
      "type": "object",
      "required": [
        "url",
        "protocol"
      ],
      "properties": {
        "url": {
          "type": "string",
          "minLength": 1
        },
        "canonicalUrl": {
          "type": "string",
          "minLength": 1
        },
        "protocol": {
          "enum": [
            "http",
            "https"
          ]
        },
        "host": {
          "type": "string",
          "minLength": 1
        },
        "port": {
          "type": "integer",
          "minimum": 0,
          "maximum": 65535
        },
        "tls": {
          "type": "boolean"
        }
      },
      "additionalProperties": false
    },
    "runtimeProcessMetadata": {
      "type": "object",
      "required": [
        "ownedByHost"
      ],
      "properties": {
        "ownedByHost": {
          "type": "boolean"
        },
        "pid": {
          "type": "integer",
          "minimum": 1
        },
        "executablePath": {
          "type": "string",
          "minLength": 1
        },
        "workingDirectory": {
          "type": "string",
          "minLength": 1
        },
        "startedAt": {
          "type": "string"
        },
        "ownerWindowId": {
          "type": "string",
          "minLength": 1
        },
        "platform": {
          "type": "string",
          "minLength": 1
        },
        "arch": {
          "type": "string",
          "minLength": 1
        }
      },
      "additionalProperties": false
    },
    "runtimeConnectionProfile": {
      "oneOf": [
        {
          "$ref": "#/$defs/runtimeLocalManagedConnectionProfile"
        },
        {
          "$ref": "#/$defs/runtimeLocalSharedConnectionProfile"
        },
        {
          "$ref": "#/$defs/runtimeRemoteConnectionProfile"
        }
      ]
    },
    "runtimeConnectionProfileBase": {
      "type": "object",
      "required": [
        "mode",
        "ownership",
        "endpoint"
      ],
      "properties": {
        "mode": {
          "$ref": "#/$defs/runtimeConnectionProfileMode"
        },
        "ownership": {
          "$ref": "#/$defs/runtimeOwnershipMode"
        },
        "displayName": {
          "type": "string"
        },
        "endpoint": {
          "$ref": "#/$defs/runtimeEndpointMetadata"
        },
        "process": {
          "oneOf": [
            {
              "$ref": "#/$defs/runtimeProcessMetadata"
            },
            {
              "type": "null"
            }
          ]
        }
      },
      "additionalProperties": false
    },
    "runtimeLocalManagedConnectionProfile": {
      "allOf": [
        {
          "$ref": "#/$defs/runtimeConnectionProfileBase"
        },
        {
          "type": "object",
          "properties": {
            "mode": {
              "const": "local-managed"
            },
            "ownership": {
              "const": "owned-child"
            }
          }
        }
      ]
    },
    "runtimeLocalSharedConnectionProfile": {
      "allOf": [
        {
          "$ref": "#/$defs/runtimeConnectionProfileBase"
        },
        {
          "type": "object",
          "properties": {
            "mode": {
              "const": "local-shared"
            },
            "ownership": {
              "const": "external"
            }
          }
        }
      ]
    },
    "runtimeRemoteConnectionProfile": {
      "allOf": [
        {
          "$ref": "#/$defs/runtimeConnectionProfileBase"
        },
        {
          "type": "object",
          "properties": {
            "mode": {
              "const": "remote"
            },
            "ownership": {
              "const": "remote"
            }
          }
        }
      ]
    },
    "runtimeProjectSnapshot": {
      "description": "Active Runtime project snapshots are current ProjectDocument v0.1 documents.",
      "$ref": "https://skenion.dev/schemas/project/v0.1/project.schema.json"
    },
    "runtimeSessionSnapshot": {
      "type": "object",
      "required": [
        "sessionRevision",
        "viewRevision",
        "controlRevision",
        "project",
        "diagnostics",
        "plan"
      ],
      "properties": {
        "sessionRevision": {
          "type": "integer",
          "minimum": 0
        },
        "viewRevision": {
          "type": "integer",
          "minimum": 0
        },
        "controlRevision": {
          "type": "integer",
          "minimum": 0
        },
        "project": {
          "oneOf": [
            {
              "$ref": "#/$defs/runtimeProjectSnapshot"
            },
            {
              "type": "null"
            }
          ]
        },
        "diagnostics": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/runtimeDiagnostic"
          }
        },
        "plan": {
          "oneOf": [
            {
              "type": "object"
            },
            {
              "type": "null"
            }
          ]
        }
      },
      "additionalProperties": false
    },
    "runtimeMutationRequest": {
      "type": "object",
      "properties": {
        "operation": {
          "$ref": "https://skenion.dev/schemas/runtime/v0/operation.schema.json"
        },
        "viewPatch": {
          "$ref": "#/$defs/runtimeViewPatch"
        },
        "clientId": {
          "type": "string",
          "minLength": 1
        },
        "description": {
          "type": "string"
        }
      },
      "additionalProperties": false
    },
    "runtimeViewPatch": {
      "type": "object",
      "required": [
        "baseViewRevision",
        "ops"
      ],
      "properties": {
        "baseViewRevision": {
          "type": "integer",
          "minimum": 0
        },
        "ops": {
          "type": "array",
          "items": {
            "oneOf": [
              {
                "$ref": "#/$defs/runtimeSetNodeViewOperation"
              },
              {
                "$ref": "#/$defs/runtimeMoveNodeViewOperation"
              }
            ]
          }
        }
      },
      "additionalProperties": false
    },
    "runtimeSetNodeViewOperation": {
      "type": "object",
      "required": [
        "op",
        "nodeId",
        "view"
      ],
      "properties": {
        "op": {
          "const": "setNodeView"
        },
        "nodeId": {
          "type": "string",
          "minLength": 1
        },
        "view": {
          "$ref": "#/$defs/runtimeCanvasNodeView"
        }
      },
      "additionalProperties": false
    },
    "runtimeMoveNodeViewOperation": {
      "type": "object",
      "required": [
        "op",
        "nodeId",
        "to"
      ],
      "properties": {
        "op": {
          "const": "moveNodeView"
        },
        "nodeId": {
          "type": "string",
          "minLength": 1
        },
        "from": {
          "$ref": "#/$defs/runtimeCanvasNodeView"
        },
        "to": {
          "$ref": "#/$defs/runtimeCanvasNodeView"
        }
      },
      "additionalProperties": false
    },
    "runtimeCanvasNodeView": {
      "type": "object",
      "required": [
        "x",
        "y"
      ],
      "properties": {
        "x": {
          "type": "number"
        },
        "y": {
          "type": "number"
        },
        "width": {
          "type": "number"
        },
        "height": {
          "type": "number"
        },
        "collapsed": {
          "type": "boolean"
        }
      },
      "additionalProperties": false
    },
    "runtimeHistoryEntry": {
      "type": "object",
      "required": [
        "id",
        "sequence",
        "kind",
        "mutation",
        "inverseMutation",
        "createdAt"
      ],
      "properties": {
        "id": {
          "type": "string",
          "minLength": 1
        },
        "sequence": {
          "type": "integer",
          "minimum": 1
        },
        "kind": {
          "enum": [
            "apply",
            "undo",
            "redo"
          ]
        },
        "mutation": {
          "$ref": "#/$defs/runtimeMutationRequest"
        },
        "inverseMutation": {
          "$ref": "#/$defs/runtimeMutationRequest"
        },
        "subjectEventId": {
          "type": "string",
          "minLength": 1
        },
        "clientId": {
          "type": "string",
          "minLength": 1
        },
        "description": {
          "type": "string"
        },
        "createdAt": {
          "type": "string",
          "minLength": 1
        }
      },
      "additionalProperties": false
    },
    "runtimeHistory": {
      "type": "object",
      "required": [
        "schema",
        "schemaVersion",
        "entries",
        "canUndo",
        "canRedo",
        "undoDepth",
        "redoDepth"
      ],
      "properties": {
        "schema": {
          "const": "skenion.runtime.history"
        },
        "schemaVersion": {
          "const": "0.1.0"
        },
        "entries": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/runtimeHistoryEntry"
          }
        },
        "canUndo": {
          "type": "boolean"
        },
        "canRedo": {
          "type": "boolean"
        },
        "undoDepth": {
          "type": "integer",
          "minimum": 0
        },
        "redoDepth": {
          "type": "integer",
          "minimum": 0
        }
      },
      "additionalProperties": false
    },
    "runtimeEventReplayWindow": {
      "type": "object",
      "required": [
        "cursorKind",
        "currentCursor",
        "earliestSequence",
        "latestSequence",
        "replayLimit"
      ],
      "properties": {
        "cursorKind": {
          "const": "sequence"
        },
        "currentCursor": {
          "type": "string",
          "minLength": 1
        },
        "earliestSequence": {
          "type": "integer",
          "minimum": 1
        },
        "latestSequence": {
          "type": "integer",
          "minimum": 0
        },
        "replayLimit": {
          "oneOf": [
            {
              "type": "integer",
              "minimum": 0
            },
            {
              "type": "null"
            }
          ]
        },
        "overflow": {
          "type": "boolean"
        }
      },
      "additionalProperties": false
    },
    "runtimeSessionCapabilitySet": {
      "type": "object",
      "required": [
        "sessionAddressing",
        "eventReplay",
        "multiWindow",
        "profiles",
        "authPolicy"
      ],
      "properties": {
        "sessionAddressing": {
          "type": "boolean"
        },
        "eventReplay": {
          "type": "boolean"
        },
        "multiWindow": {
          "type": "boolean"
        },
        "profiles": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/runtimeConnectionProfileMode"
          }
        },
        "authPolicy": {
          "const": "deferred"
        }
      },
      "additionalProperties": false
    },
    "runtimeEventReplayGap": {
      "type": "object",
      "description": "Gap metadata reports a missed retained range. expectedSequence must be less than actualSequence.",
      "required": [
        "expectedSequence",
        "actualSequence",
        "reason"
      ],
      "properties": {
        "expectedSequence": {
          "type": "integer",
          "minimum": 1
        },
        "actualSequence": {
          "type": "integer",
          "minimum": 1
        },
        "reason": {
          "enum": [
            "retention-overflow",
            "stream-reset",
            "unknown"
          ]
        }
      },
      "additionalProperties": false
    },
    "runtimeEventReplayMetadata": {
      "type": "object",
      "required": [
        "cursor",
        "previousCursor",
        "replayed",
        "gap",
        "overflow"
      ],
      "properties": {
        "cursor": {
          "type": "string",
          "minLength": 1
        },
        "previousCursor": {
          "oneOf": [
            {
              "type": "string",
              "minLength": 1
            },
            {
              "type": "null"
            }
          ]
        },
        "replayed": {
          "type": "boolean"
        },
        "gap": {
          "oneOf": [
            {
              "$ref": "#/$defs/runtimeEventReplayGap"
            },
            {
              "type": "null"
            }
          ]
        },
        "overflow": {
          "type": "boolean"
        }
      },
      "additionalProperties": false
    },
    "runtimeSessionEventKind": {
      "enum": [
        "snapshot",
        "load",
        "clear",
        "mutate",
        "undo",
        "redo"
      ]
    },
    "runtimeSessionEvent": {
      "type": "object",
      "required": [
        "schema",
        "schemaVersion",
        "id",
        "sessionId",
        "sequence",
        "sessionRevision",
        "kind",
        "snapshot",
        "history",
        "replay",
        "diagnostics",
        "createdAt"
      ],
      "properties": {
        "schema": {
          "const": "skenion.runtime.session.event"
        },
        "schemaVersion": {
          "const": "0.1.0"
        },
        "id": {
          "type": "string",
          "minLength": 1
        },
        "sessionId": {
          "type": "string",
          "minLength": 1
        },
        "sequence": {
          "type": "integer",
          "minimum": 1
        },
        "sessionRevision": {
          "type": "integer",
          "minimum": 0
        },
        "kind": {
          "$ref": "#/$defs/runtimeSessionEventKind"
        },
        "snapshot": {
          "$ref": "#/$defs/runtimeSessionSnapshot"
        },
        "history": {
          "$ref": "#/$defs/runtimeHistory"
        },
        "mutation": {
          "$ref": "#/$defs/runtimeHistoryEntry"
        },
        "replay": {
          "$ref": "#/$defs/runtimeEventReplayMetadata"
        },
        "diagnostics": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/runtimeDiagnostic"
          }
        },
        "createdAt": {
          "type": "string",
          "minLength": 1
        }
      },
      "additionalProperties": false
    }
  }
} as const;

export const runtimeCollaborationV0Schema = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://skenion.dev/schemas/runtime/v0/collaboration.schema.json",
  "title": "skenion Runtime Collaboration Contracts v0",
  "oneOf": [
    {
      "$ref": "#/$defs/runtimeCollaborationOperationEnvelope"
    },
    {
      "$ref": "#/$defs/runtimeCollaborationOperationBatch"
    },
    {
      "$ref": "#/$defs/runtimeCollaborationOperationBatchResult"
    },
    {
      "$ref": "#/$defs/runtimeCollaborationOperationResult"
    },
    {
      "$ref": "#/$defs/runtimeCollaborationPresenceEnvelope"
    },
    {
      "$ref": "#/$defs/runtimeCollaborationSelectionEnvelope"
    },
    {
      "$ref": "#/$defs/runtimeCollaborationEventEnvelope"
    }
  ],
  "$defs": {
    "nonEmptyString": {
      "type": "string",
      "minLength": 1
    },
    "stringIdArray": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/nonEmptyString"
      },
      "uniqueItems": true
    },
    "causalVector": {
      "type": "object",
      "minProperties": 1,
      "additionalProperties": {
        "type": "integer",
        "minimum": 0
      }
    },
    "runtimeCollaborationCausalMetadata": {
      "type": "object",
      "required": [
        "baseRevision",
        "baseSequence",
        "vector"
      ],
      "properties": {
        "baseRevision": {
          "$ref": "#/$defs/nonEmptyString"
        },
        "baseSequence": {
          "type": "integer",
          "minimum": 0
        },
        "vector": {
          "$ref": "#/$defs/causalVector"
        },
        "observedOperationIds": {
          "$ref": "#/$defs/stringIdArray"
        }
      },
      "additionalProperties": false
    },
    "runtimeCollaborationAuthSubject": {
      "type": "object",
      "required": [
        "kind"
      ],
      "properties": {
        "kind": {
          "enum": [
            "anonymous",
            "user",
            "service",
            "deferred"
          ]
        },
        "subjectId": {
          "$ref": "#/$defs/nonEmptyString"
        },
        "issuer": {
          "$ref": "#/$defs/nonEmptyString"
        },
        "displayName": {
          "type": "string"
        }
      },
      "additionalProperties": false
    },
    "runtimeCollaborationParticipant": {
      "type": "object",
      "required": [
        "participantId",
        "sessionId",
        "joinedAt"
      ],
      "properties": {
        "participantId": {
          "$ref": "#/$defs/nonEmptyString"
        },
        "sessionId": {
          "$ref": "#/$defs/nonEmptyString"
        },
        "joinedAt": {
          "$ref": "#/$defs/nonEmptyString"
        },
        "displayName": {
          "type": "string"
        },
        "color": {
          "type": "string"
        },
        "capabilities": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/nonEmptyString"
          },
          "uniqueItems": true
        },
        "authSubject": {
          "$ref": "#/$defs/runtimeCollaborationAuthSubject"
        }
      },
      "additionalProperties": false
    },
    "canvasPosition": {
      "type": "object",
      "required": [
        "x",
        "y"
      ],
      "properties": {
        "x": {
          "type": "number"
        },
        "y": {
          "type": "number"
        }
      },
      "additionalProperties": false
    },
    "runtimeCollaborationChange": {
      "oneOf": [
        {
          "type": "object",
          "required": [
            "op",
            "changeId",
            "node"
          ],
          "properties": {
            "op": {
              "const": "node.add"
            },
            "changeId": {
              "$ref": "#/$defs/nonEmptyString"
            },
            "node": {
              "$ref": "https://skenion.dev/schemas/graph/v0.1/graph.schema.json#/$defs/node"
            },
            "view": {
              "$ref": "#/$defs/canvasPosition"
            }
          },
          "additionalProperties": false
        },
        {
          "type": "object",
          "required": [
            "op",
            "changeId",
            "nodeId",
            "to"
          ],
          "properties": {
            "op": {
              "const": "node.move"
            },
            "changeId": {
              "$ref": "#/$defs/nonEmptyString"
            },
            "nodeId": {
              "$ref": "#/$defs/nonEmptyString"
            },
            "from": {
              "$ref": "#/$defs/canvasPosition"
            },
            "to": {
              "$ref": "#/$defs/canvasPosition"
            }
          },
          "additionalProperties": false
        },
        {
          "type": "object",
          "required": [
            "op",
            "changeId",
            "nodeId"
          ],
          "properties": {
            "op": {
              "const": "node.delete"
            },
            "changeId": {
              "$ref": "#/$defs/nonEmptyString"
            },
            "nodeId": {
              "$ref": "#/$defs/nonEmptyString"
            },
            "tombstoneId": {
              "$ref": "#/$defs/nonEmptyString"
            }
          },
          "additionalProperties": false
        },
        {
          "type": "object",
          "required": [
            "op",
            "changeId",
            "edge"
          ],
          "properties": {
            "op": {
              "const": "edge.connect"
            },
            "changeId": {
              "$ref": "#/$defs/nonEmptyString"
            },
            "edge": {
              "$ref": "https://skenion.dev/schemas/graph/v0.1/graph.schema.json#/$defs/edge"
            }
          },
          "additionalProperties": false
        },
        {
          "type": "object",
          "required": [
            "op",
            "changeId",
            "edgeId"
          ],
          "properties": {
            "op": {
              "const": "edge.disconnect"
            },
            "changeId": {
              "$ref": "#/$defs/nonEmptyString"
            },
            "edgeId": {
              "$ref": "#/$defs/nonEmptyString"
            }
          },
          "additionalProperties": false
        }
      ]
    },
    "runtimeCollaborationChangeSetPayload": {
      "type": "object",
      "required": [
        "kind",
        "target",
        "changes"
      ],
      "properties": {
        "kind": {
          "const": "changeSet"
        },
        "target": {
          "$ref": "https://skenion.dev/schemas/runtime/v0/operation.schema.json#/$defs/graphTargetRef"
        },
        "changes": {
          "type": "array",
          "minItems": 1,
          "items": {
            "$ref": "#/$defs/runtimeCollaborationChange"
          }
        },
        "undoGroupId": {
          "$ref": "#/$defs/nonEmptyString"
        },
        "description": {
          "type": "string"
        }
      },
      "additionalProperties": false
    },
    "runtimeCollaborationPasteGraphFragmentPayload": {
      "type": "object",
      "required": [
        "kind",
        "request"
      ],
      "properties": {
        "kind": {
          "const": "pasteGraphFragment"
        },
        "request": {
          "$ref": "https://skenion.dev/schemas/runtime/v0/operation.schema.json#/$defs/pasteGraphFragmentRequest"
        },
        "undoGroupId": {
          "$ref": "#/$defs/nonEmptyString"
        },
        "description": {
          "type": "string"
        }
      },
      "additionalProperties": false
    },
    "runtimeCollaborationUndoScope": {
      "type": "object",
      "required": [
        "kind",
        "participantId"
      ],
      "properties": {
        "kind": {
          "const": "participant"
        },
        "participantId": {
          "$ref": "#/$defs/nonEmptyString"
        }
      },
      "additionalProperties": false
    },
    "runtimeCollaborationUndoRedoPayload": {
      "type": "object",
      "required": [
        "kind",
        "action",
        "scope"
      ],
      "properties": {
        "kind": {
          "const": "undoRedo"
        },
        "action": {
          "enum": [
            "undo",
            "redo"
          ]
        },
        "scope": {
          "$ref": "#/$defs/runtimeCollaborationUndoScope"
        },
        "subjectOperationId": {
          "$ref": "#/$defs/nonEmptyString"
        },
        "undoGroupId": {
          "$ref": "#/$defs/nonEmptyString"
        },
        "maxOperations": {
          "type": "integer",
          "minimum": 1
        }
      },
      "additionalProperties": false
    },
    "runtimeCollaborationOperationPayload": {
      "oneOf": [
        {
          "$ref": "#/$defs/runtimeCollaborationChangeSetPayload"
        },
        {
          "$ref": "#/$defs/runtimeCollaborationPasteGraphFragmentPayload"
        },
        {
          "$ref": "#/$defs/runtimeCollaborationUndoRedoPayload"
        }
      ]
    },
    "runtimeCollaborationOperationEnvelope": {
      "type": "object",
      "required": [
        "schema",
        "schemaVersion",
        "operationId",
        "sessionId",
        "participantId",
        "idempotencyKey",
        "causal",
        "payload",
        "submittedAt"
      ],
      "properties": {
        "schema": {
          "const": "skenion.runtime.collaboration.operation"
        },
        "schemaVersion": {
          "const": "0.1.0"
        },
        "operationId": {
          "$ref": "#/$defs/nonEmptyString"
        },
        "sessionId": {
          "$ref": "#/$defs/nonEmptyString"
        },
        "participantId": {
          "$ref": "#/$defs/nonEmptyString"
        },
        "idempotencyKey": {
          "$ref": "#/$defs/nonEmptyString"
        },
        "causal": {
          "$ref": "#/$defs/runtimeCollaborationCausalMetadata"
        },
        "payload": {
          "$ref": "#/$defs/runtimeCollaborationOperationPayload"
        },
        "authSubject": {
          "$ref": "#/$defs/runtimeCollaborationAuthSubject"
        },
        "correlationId": {
          "$ref": "#/$defs/nonEmptyString"
        },
        "submittedAt": {
          "$ref": "#/$defs/nonEmptyString"
        }
      },
      "additionalProperties": false
    },
    "runtimeCollaborationOperationBatch": {
      "type": "object",
      "required": [
        "schema",
        "schemaVersion",
        "sessionId",
        "operations"
      ],
      "properties": {
        "schema": {
          "const": "skenion.runtime.collaboration.operation-batch"
        },
        "schemaVersion": {
          "const": "0.1.0"
        },
        "sessionId": {
          "$ref": "#/$defs/nonEmptyString"
        },
        "operations": {
          "type": "array",
          "minItems": 1,
          "items": {
            "$ref": "#/$defs/runtimeCollaborationOperationEnvelope"
          }
        },
        "submittedAt": {
          "$ref": "#/$defs/nonEmptyString"
        }
      },
      "additionalProperties": false
    },
    "runtimeCollaborationOperationBatchResult": {
      "type": "object",
      "required": [
        "schema",
        "schemaVersion",
        "sessionId",
        "results",
        "diagnostics",
        "createdAt"
      ],
      "properties": {
        "schema": {
          "const": "skenion.runtime.collaboration.operation-batch-result"
        },
        "schemaVersion": {
          "const": "0.1.0"
        },
        "sessionId": {
          "$ref": "#/$defs/nonEmptyString"
        },
        "results": {
          "type": "array",
          "minItems": 1,
          "items": {
            "$ref": "#/$defs/runtimeCollaborationOperationResult"
          }
        },
        "diagnostics": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/runtimeCollaborationOperationDiagnostic"
          }
        },
        "createdAt": {
          "$ref": "#/$defs/nonEmptyString"
        }
      },
      "additionalProperties": false
    },
    "runtimeCollaborationOperationDiagnostic": {
      "type": "object",
      "required": [
        "severity",
        "code",
        "message"
      ],
      "properties": {
        "severity": {
          "enum": [
            "error",
            "warning",
            "info"
          ]
        },
        "code": {
          "enum": [
            "base-revision-mismatch",
            "causality-gap",
            "duplicate-idempotency-key",
            "idempotent-replay",
            "invalid-operation",
            "operation-rebased",
            "participant-expired",
            "participant-mismatch",
            "presence-expired",
            "selection-expired",
            "unsupported-operation"
          ]
        },
        "message": {
          "type": "string"
        },
        "path": {
          "$ref": "#/$defs/nonEmptyString"
        },
        "participantId": {
          "$ref": "#/$defs/nonEmptyString"
        },
        "operationId": {
          "$ref": "#/$defs/nonEmptyString"
        },
        "idempotencyKey": {
          "$ref": "#/$defs/nonEmptyString"
        },
        "expectedRevision": {
          "$ref": "#/$defs/nonEmptyString"
        },
        "actualRevision": {
          "$ref": "#/$defs/nonEmptyString"
        },
        "expectedSequence": {
          "type": "integer",
          "minimum": 0
        },
        "actualSequence": {
          "type": "integer",
          "minimum": 0
        }
      },
      "additionalProperties": false
    },
    "runtimeCollaborationServerClock": {
      "type": "object",
      "required": [
        "revision",
        "sequence",
        "vector"
      ],
      "properties": {
        "revision": {
          "$ref": "#/$defs/nonEmptyString"
        },
        "sequence": {
          "type": "integer",
          "minimum": 0
        },
        "vector": {
          "$ref": "#/$defs/causalVector"
        }
      },
      "additionalProperties": false
    },
    "runtimeCollaborationAck": {
      "type": "object",
      "required": [
        "sequence",
        "revision",
        "serverClock",
        "appliedAt"
      ],
      "properties": {
        "sequence": {
          "type": "integer",
          "minimum": 1
        },
        "revision": {
          "$ref": "#/$defs/nonEmptyString"
        },
        "serverClock": {
          "$ref": "#/$defs/runtimeCollaborationServerClock"
        },
        "appliedAt": {
          "$ref": "#/$defs/nonEmptyString"
        }
      },
      "additionalProperties": false
    },
    "runtimeCollaborationNack": {
      "type": "object",
      "required": [
        "reason"
      ],
      "properties": {
        "reason": {
          "enum": [
            "base-revision-mismatch",
            "causality-gap",
            "duplicate-idempotency-key",
            "invalid-operation",
            "participant-expired",
            "unsupported-operation"
          ]
        },
        "retryable": {
          "type": "boolean"
        },
        "diagnostics": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/runtimeCollaborationOperationDiagnostic"
          }
        }
      },
      "additionalProperties": false
    },
    "runtimeCollaborationConflict": {
      "type": "object",
      "required": [
        "code",
        "message"
      ],
      "properties": {
        "code": {
          "$ref": "#/$defs/nonEmptyString"
        },
        "message": {
          "type": "string"
        },
        "changeIds": {
          "$ref": "#/$defs/stringIdArray"
        },
        "nodeIds": {
          "$ref": "#/$defs/stringIdArray"
        },
        "edgeIds": {
          "$ref": "#/$defs/stringIdArray"
        }
      },
      "additionalProperties": false
    },
    "runtimeCollaborationRebase": {
      "type": "object",
      "required": [
        "from",
        "to",
        "strategy",
        "conflicts"
      ],
      "properties": {
        "from": {
          "$ref": "#/$defs/runtimeCollaborationCausalMetadata"
        },
        "to": {
          "$ref": "#/$defs/runtimeCollaborationCausalMetadata"
        },
        "strategy": {
          "enum": [
            "ot-transform",
            "crdt-merge",
            "server-reject"
          ]
        },
        "transformedPayload": {
          "$ref": "#/$defs/runtimeCollaborationOperationPayload"
        },
        "conflicts": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/runtimeCollaborationConflict"
          }
        }
      },
      "additionalProperties": false
    },
    "runtimeCollaborationOperationResult": {
      "type": "object",
      "required": [
        "schema",
        "schemaVersion",
        "sessionId",
        "operationId",
        "participantId",
        "idempotencyKey",
        "status",
        "causal",
        "diagnostics",
        "createdAt"
      ],
      "properties": {
        "schema": {
          "const": "skenion.runtime.collaboration.operation-result"
        },
        "schemaVersion": {
          "const": "0.1.0"
        },
        "sessionId": {
          "$ref": "#/$defs/nonEmptyString"
        },
        "operationId": {
          "$ref": "#/$defs/nonEmptyString"
        },
        "participantId": {
          "$ref": "#/$defs/nonEmptyString"
        },
        "idempotencyKey": {
          "$ref": "#/$defs/nonEmptyString"
        },
        "status": {
          "enum": [
            "accepted",
            "duplicate",
            "rejected",
            "rebased"
          ]
        },
        "causal": {
          "$ref": "#/$defs/runtimeCollaborationCausalMetadata"
        },
        "ack": {
          "$ref": "#/$defs/runtimeCollaborationAck"
        },
        "nack": {
          "$ref": "#/$defs/runtimeCollaborationNack"
        },
        "rebase": {
          "$ref": "#/$defs/runtimeCollaborationRebase"
        },
        "diagnostics": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/runtimeCollaborationOperationDiagnostic"
          }
        },
        "createdAt": {
          "$ref": "#/$defs/nonEmptyString"
        }
      },
      "additionalProperties": false
    },
    "runtimeCollaborationPresenceState": {
      "enum": [
        "joined",
        "active",
        "idle",
        "away",
        "left",
        "expired"
      ]
    },
    "runtimeCollaborationPresence": {
      "type": "object",
      "required": [
        "state"
      ],
      "properties": {
        "state": {
          "$ref": "#/$defs/runtimeCollaborationPresenceState"
        },
        "displayName": {
          "type": "string"
        },
        "color": {
          "type": "string"
        },
        "statusText": {
          "type": "string"
        },
        "capabilities": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/nonEmptyString"
          },
          "uniqueItems": true
        },
        "connectionId": {
          "$ref": "#/$defs/nonEmptyString"
        },
        "clientWindowId": {
          "$ref": "#/$defs/nonEmptyString"
        }
      },
      "additionalProperties": false
    },
    "runtimeCollaborationPresenceEnvelope": {
      "type": "object",
      "required": [
        "schema",
        "schemaVersion",
        "sessionId",
        "participantId",
        "presence",
        "updatedAt",
        "expiresAt"
      ],
      "properties": {
        "schema": {
          "const": "skenion.runtime.collaboration.presence"
        },
        "schemaVersion": {
          "const": "0.1.0"
        },
        "sessionId": {
          "$ref": "#/$defs/nonEmptyString"
        },
        "participantId": {
          "$ref": "#/$defs/nonEmptyString"
        },
        "presence": {
          "$ref": "#/$defs/runtimeCollaborationPresence"
        },
        "authSubject": {
          "$ref": "#/$defs/runtimeCollaborationAuthSubject"
        },
        "updatedAt": {
          "$ref": "#/$defs/nonEmptyString"
        },
        "expiresAt": {
          "$ref": "#/$defs/nonEmptyString"
        }
      },
      "additionalProperties": false
    },
    "runtimeCollaborationPortEndpoint": {
      "type": "object",
      "required": [
        "nodeId",
        "portId"
      ],
      "properties": {
        "nodeId": {
          "$ref": "#/$defs/nonEmptyString"
        },
        "portId": {
          "$ref": "#/$defs/nonEmptyString"
        }
      },
      "additionalProperties": false
    },
    "runtimeCollaborationTextPosition": {
      "type": "object",
      "required": [
        "nodeId",
        "field",
        "offset"
      ],
      "properties": {
        "nodeId": {
          "$ref": "#/$defs/nonEmptyString"
        },
        "field": {
          "$ref": "#/$defs/nonEmptyString"
        },
        "offset": {
          "type": "integer",
          "minimum": 0
        }
      },
      "additionalProperties": false
    },
    "runtimeCollaborationSelectionRange": {
      "oneOf": [
        {
          "type": "object",
          "required": [
            "kind",
            "nodeIds"
          ],
          "properties": {
            "kind": {
              "const": "nodes"
            },
            "nodeIds": {
              "$ref": "#/$defs/stringIdArray"
            }
          },
          "additionalProperties": false
        },
        {
          "type": "object",
          "required": [
            "kind",
            "edgeIds"
          ],
          "properties": {
            "kind": {
              "const": "edges"
            },
            "edgeIds": {
              "$ref": "#/$defs/stringIdArray"
            }
          },
          "additionalProperties": false
        },
        {
          "type": "object",
          "required": [
            "kind",
            "endpoints"
          ],
          "properties": {
            "kind": {
              "const": "ports"
            },
            "endpoints": {
              "type": "array",
              "minItems": 1,
              "items": {
                "$ref": "#/$defs/runtimeCollaborationPortEndpoint"
              }
            }
          },
          "additionalProperties": false
        },
        {
          "type": "object",
          "required": [
            "kind",
            "anchor",
            "focus"
          ],
          "properties": {
            "kind": {
              "const": "text"
            },
            "anchor": {
              "$ref": "#/$defs/runtimeCollaborationTextPosition"
            },
            "focus": {
              "$ref": "#/$defs/runtimeCollaborationTextPosition"
            }
          },
          "additionalProperties": false
        }
      ]
    },
    "runtimeCollaborationSelection": {
      "type": "object",
      "required": [
        "ranges"
      ],
      "properties": {
        "ranges": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/runtimeCollaborationSelectionRange"
          }
        },
        "activeRangeIndex": {
          "type": "integer",
          "minimum": 0
        }
      },
      "additionalProperties": false
    },
    "runtimeCollaborationCursor": {
      "oneOf": [
        {
          "type": "object",
          "required": [
            "kind",
            "x",
            "y"
          ],
          "properties": {
            "kind": {
              "const": "canvas"
            },
            "x": {
              "type": "number"
            },
            "y": {
              "type": "number"
            },
            "clientWindowId": {
              "$ref": "#/$defs/nonEmptyString"
            }
          },
          "additionalProperties": false
        },
        {
          "type": "object",
          "required": [
            "kind",
            "nodeId"
          ],
          "properties": {
            "kind": {
              "const": "node"
            },
            "nodeId": {
              "$ref": "#/$defs/nonEmptyString"
            },
            "portId": {
              "$ref": "#/$defs/nonEmptyString"
            },
            "clientWindowId": {
              "$ref": "#/$defs/nonEmptyString"
            }
          },
          "additionalProperties": false
        }
      ]
    },
    "runtimeCollaborationSelectionEnvelope": {
      "type": "object",
      "required": [
        "schema",
        "schemaVersion",
        "sessionId",
        "participantId",
        "target",
        "selection",
        "updatedAt",
        "expiresAt"
      ],
      "properties": {
        "schema": {
          "const": "skenion.runtime.collaboration.selection"
        },
        "schemaVersion": {
          "const": "0.1.0"
        },
        "sessionId": {
          "$ref": "#/$defs/nonEmptyString"
        },
        "participantId": {
          "$ref": "#/$defs/nonEmptyString"
        },
        "target": {
          "$ref": "https://skenion.dev/schemas/runtime/v0/operation.schema.json#/$defs/graphTargetRef"
        },
        "selection": {
          "$ref": "#/$defs/runtimeCollaborationSelection"
        },
        "cursor": {
          "$ref": "#/$defs/runtimeCollaborationCursor"
        },
        "updatedAt": {
          "$ref": "#/$defs/nonEmptyString"
        },
        "expiresAt": {
          "$ref": "#/$defs/nonEmptyString"
        }
      },
      "additionalProperties": false
    },
    "runtimeCollaborationEventPayload": {
      "oneOf": [
        {
          "type": "object",
          "required": [
            "kind",
            "result"
          ],
          "properties": {
            "kind": {
              "const": "operationResult"
            },
            "result": {
              "$ref": "#/$defs/runtimeCollaborationOperationResult"
            }
          },
          "additionalProperties": false
        },
        {
          "type": "object",
          "required": [
            "kind",
            "presence"
          ],
          "properties": {
            "kind": {
              "const": "presence"
            },
            "presence": {
              "$ref": "#/$defs/runtimeCollaborationPresenceEnvelope"
            }
          },
          "additionalProperties": false
        },
        {
          "type": "object",
          "required": [
            "kind",
            "selection"
          ],
          "properties": {
            "kind": {
              "const": "selection"
            },
            "selection": {
              "$ref": "#/$defs/runtimeCollaborationSelectionEnvelope"
            }
          },
          "additionalProperties": false
        }
      ]
    },
    "runtimeCollaborationEventEnvelope": {
      "type": "object",
      "required": [
        "schema",
        "schemaVersion",
        "eventId",
        "sessionId",
        "sequence",
        "causal",
        "kind",
        "payload",
        "replay",
        "createdAt"
      ],
      "properties": {
        "schema": {
          "const": "skenion.runtime.collaboration.event"
        },
        "schemaVersion": {
          "const": "0.1.0"
        },
        "eventId": {
          "$ref": "#/$defs/nonEmptyString"
        },
        "sessionId": {
          "$ref": "#/$defs/nonEmptyString"
        },
        "sequence": {
          "type": "integer",
          "minimum": 1
        },
        "causal": {
          "$ref": "#/$defs/runtimeCollaborationCausalMetadata"
        },
        "kind": {
          "enum": [
            "operation-result",
            "presence",
            "selection"
          ]
        },
        "payload": {
          "$ref": "#/$defs/runtimeCollaborationEventPayload"
        },
        "replay": {
          "$ref": "https://skenion.dev/schemas/runtime/v0/session.schema.json#/$defs/runtimeEventReplayMetadata"
        },
        "createdAt": {
          "$ref": "#/$defs/nonEmptyString"
        }
      },
      "allOf": [
        {
          "oneOf": [
            {
              "properties": {
                "kind": {
                  "const": "operation-result"
                },
                "payload": {
                  "type": "object",
                  "properties": {
                    "kind": {
                      "const": "operationResult"
                    }
                  },
                  "required": [
                    "kind"
                  ]
                }
              }
            },
            {
              "properties": {
                "kind": {
                  "const": "presence"
                },
                "payload": {
                  "type": "object",
                  "properties": {
                    "kind": {
                      "const": "presence"
                    }
                  },
                  "required": [
                    "kind"
                  ]
                }
              }
            },
            {
              "properties": {
                "kind": {
                  "const": "selection"
                },
                "payload": {
                  "type": "object",
                  "properties": {
                    "kind": {
                      "const": "selection"
                    }
                  },
                  "required": [
                    "kind"
                  ]
                }
              }
            }
          ]
        }
      ],
      "additionalProperties": false
    }
  }
} as const;

export const nodeDefinitionV01Schema = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://skenion.dev/schemas/node/v0.1/node-definition.schema.json",
  "title": "skenion Node Definition Manifest v0.1",
  "type": "object",
  "required": [
    "schema",
    "schemaVersion",
    "id",
    "version",
    "displayName",
    "category",
    "ports",
    "execution",
    "state",
    "permissions",
    "capabilities"
  ],
  "properties": {
    "schema": {
      "const": "skenion.node.definition"
    },
    "schemaVersion": {
      "const": "0.1.0"
    },
    "id": {
      "type": "string",
      "minLength": 1
    },
    "version": {
      "type": "string",
      "minLength": 1
    },
    "displayName": {
      "type": "string",
      "minLength": 1
    },
    "category": {
      "type": "string",
      "minLength": 1
    },
    "scriptApiVersion": {
      "type": "string",
      "minLength": 1
    },
    "bundleHash": {
      "type": "string",
      "minLength": 1
    },
    "surface": {
      "$ref": "#/$defs/surface"
    },
    "ports": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/port"
      }
    },
    "portGroups": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/portGroup"
      }
    },
    "execution": {
      "$ref": "#/$defs/execution"
    },
    "state": {
      "$ref": "#/$defs/state"
    },
    "permissions": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "capabilities": {
      "type": "array",
      "items": {
        "type": "string"
      }
    }
  },
  "additionalProperties": false,
  "$defs": {
    "port": {
      "type": "object",
      "required": [
        "id",
        "direction",
        "type"
      ],
      "properties": {
        "id": {
          "type": "string",
          "minLength": 1
        },
        "direction": {
          "enum": [
            "input",
            "output"
          ]
        },
        "type": {
          "type": "string",
          "minLength": 1
        },
        "label": {
          "type": "string"
        },
        "rate": {
          "enum": [
            "event",
            "control",
            "audio",
            "render",
            "gpu",
            "resource",
            "io"
          ]
        },
        "accepts": {
          "type": "array",
          "items": {
            "type": "string",
            "minLength": 1
          },
          "uniqueItems": true
        },
        "minConnections": {
          "type": "integer",
          "minimum": 0
        },
        "maxConnections": {
          "oneOf": [
            {
              "type": "integer",
              "minimum": 0
            },
            {
              "type": "null"
            }
          ]
        },
        "mergePolicy": {
          "enum": [
            "forbid",
            "ordered-events",
            "mix",
            "array",
            "latest",
            "first",
            "custom"
          ]
        },
        "fanOutPolicy": {
          "enum": [
            "allow",
            "forbid",
            "copy",
            "share"
          ]
        },
        "triggerMode": {
          "enum": [
            "passive",
            "trigger",
            "latched"
          ]
        },
        "defaultValue": true,
        "latch": {
          "type": "boolean"
        },
        "required": {
          "type": "boolean"
        },
        "styleKey": {
          "type": "string",
          "minLength": 1
        },
        "group": {
          "type": "string",
          "minLength": 1
        },
        "description": {
          "type": "string"
        }
      },
      "additionalProperties": false
    },
    "portGroup": {
      "type": "object",
      "required": [
        "id",
        "direction",
        "type",
        "minPorts"
      ],
      "properties": {
        "id": {
          "type": "string",
          "minLength": 1
        },
        "label": {
          "type": "string"
        },
        "direction": {
          "enum": [
            "input",
            "output"
          ]
        },
        "type": {
          "type": "string",
          "minLength": 1
        },
        "rate": {
          "enum": [
            "event",
            "control",
            "audio",
            "render",
            "gpu",
            "resource",
            "io"
          ]
        },
        "minPorts": {
          "type": "integer",
          "minimum": 0
        },
        "maxPorts": {
          "type": "integer",
          "minimum": 0
        },
        "ordered": {
          "type": "boolean"
        },
        "portIdPattern": {
          "type": "string",
          "minLength": 1
        },
        "createLabel": {
          "type": "string"
        },
        "defaultPortSpec": {
          "$ref": "#/$defs/port"
        }
      },
      "additionalProperties": false
    },
    "execution": {
      "type": "object",
      "required": [
        "model"
      ],
      "properties": {
        "model": {
          "enum": [
            "event",
            "value",
            "frame",
            "audio_block",
            "video_frame",
            "gpu_pass",
            "async_resource",
            "script_control",
            "native_plugin"
          ]
        },
        "clock": {
          "enum": [
            "frame",
            "audio",
            "beat",
            "timecode",
            "external"
          ]
        }
      },
      "additionalProperties": false
    },
    "surface": {
      "type": "object",
      "properties": {
        "palette": {
          "enum": [
            "direct"
          ]
        }
      },
      "additionalProperties": false
    },
    "state": {
      "type": "object",
      "required": [
        "persistent"
      ],
      "properties": {
        "persistent": {
          "type": "boolean"
        }
      },
      "additionalProperties": false
    }
  }
} as const;

export const shaderInterfaceV01Schema = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://skenion.dev/schemas/shader/v0.1/shader-interface.schema.json",
  "title": "skenion Shader Interface v0.1",
  "type": "object",
  "required": [
    "schema",
    "schemaVersion",
    "language",
    "uniforms"
  ],
  "properties": {
    "schema": {
      "const": "skenion.shader.interface"
    },
    "schemaVersion": {
      "const": "0.1.0"
    },
    "language": {
      "const": "wgsl"
    },
    "uniforms": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/uniform"
      }
    }
  },
  "additionalProperties": false,
  "$defs": {
    "uniform": {
      "type": "object",
      "required": [
        "id",
        "label",
        "type",
        "required"
      ],
      "properties": {
        "id": {
          "type": "string",
          "pattern": "^[A-Za-z_][A-Za-z0-9_]*$",
          "not": {
            "enum": [
              "out",
              "in",
              "set",
              "bang",
              "value"
            ]
          }
        },
        "label": {
          "type": "string",
          "minLength": 1
        },
        "type": {
          "$ref": "#/$defs/dataType"
        },
        "default": true,
        "required": {
          "type": "boolean"
        }
      },
      "additionalProperties": false
    },
    "dataType": {
      "type": "object",
      "required": [
        "flow",
        "dataKind"
      ],
      "properties": {
        "flow": {
          "const": "value"
        },
        "dataKind": {
          "enum": [
            "number.float",
            "number.int",
            "number.uint",
            "boolean",
            "color"
          ]
        },
        "format": {
          "type": "string"
        },
        "colorSpace": {
          "type": "string"
        },
        "range": {
          "type": "object",
          "properties": {
            "min": {
              "type": "number"
            },
            "max": {
              "type": "number"
            },
            "step": {
              "type": "number",
              "exclusiveMinimum": 0
            }
          },
          "additionalProperties": false
        }
      },
      "additionalProperties": false
    }
  }
} as const;

export const shaderDiagnosticV01Schema = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://skenion.dev/schemas/shader/v0.1/shader-diagnostic.schema.json",
  "title": "skenion Shader Diagnostic v0.1",
  "type": "object",
  "required": [
    "severity",
    "phase",
    "code",
    "message",
    "source"
  ],
  "properties": {
    "severity": {
      "enum": [
        "error",
        "warning",
        "info"
      ]
    },
    "phase": {
      "enum": [
        "interface-analysis",
        "source-sync",
        "wgsl-generation",
        "wgsl-compile",
        "render-pipeline",
        "render-frame"
      ]
    },
    "code": {
      "type": "string",
      "pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*$"
    },
    "message": {
      "type": "string",
      "minLength": 1
    },
    "line": {
      "type": "integer",
      "minimum": 1
    },
    "column": {
      "type": "integer",
      "minimum": 1
    },
    "endLine": {
      "type": "integer",
      "minimum": 1
    },
    "endColumn": {
      "type": "integer",
      "minimum": 1
    },
    "uniformId": {
      "type": "string",
      "pattern": "^[A-Za-z_][A-Za-z0-9_]*$"
    },
    "source": {
      "enum": [
        "user",
        "generated",
        "runtime"
      ]
    }
  },
  "additionalProperties": false
} as const;

export const controlMessageV01Schema = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://skenion.dev/schemas/control/v0.1/control-message.schema.json",
  "title": "skenion Control Message v0.1",
  "type": "object",
  "required": [
    "selector",
    "atoms"
  ],
  "properties": {
    "selector": {
      "type": "string",
      "minLength": 1,
      "pattern": "^[A-Za-z_][A-Za-z0-9_.:-]*$"
    },
    "atoms": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/atom"
      },
      "default": []
    }
  },
  "additionalProperties": false,
  "$defs": {
    "atom": {
      "oneOf": [
        {
          "type": "object",
          "required": [
            "type",
            "representation",
            "value"
          ],
          "properties": {
            "type": {
              "const": "float"
            },
            "representation": {
              "enum": [
                "f64",
                "f32",
                "f16",
                "f8.e4m3",
                "f8.e5m2",
                "ufloat16",
                "ufloat8"
              ]
            },
            "value": {
              "type": "number"
            }
          },
          "additionalProperties": false
        },
        {
          "type": "object",
          "required": [
            "type",
            "representation",
            "value"
          ],
          "properties": {
            "type": {
              "const": "int"
            },
            "representation": {
              "enum": [
                "i64",
                "i32",
                "i16",
                "i8"
              ]
            },
            "value": {
              "type": "integer"
            }
          },
          "additionalProperties": false
        },
        {
          "type": "object",
          "required": [
            "type",
            "representation",
            "value"
          ],
          "properties": {
            "type": {
              "const": "uint"
            },
            "representation": {
              "enum": [
                "u64",
                "u32",
                "u16",
                "u8"
              ]
            },
            "value": {
              "type": "integer",
              "minimum": 0
            }
          },
          "additionalProperties": false
        },
        {
          "type": "object",
          "required": [
            "type",
            "value"
          ],
          "properties": {
            "type": {
              "const": "bool"
            },
            "value": {
              "type": "boolean"
            }
          },
          "additionalProperties": false
        },
        {
          "type": "object",
          "required": [
            "type",
            "value"
          ],
          "properties": {
            "type": {
              "const": "string"
            },
            "value": {
              "type": "string"
            }
          },
          "additionalProperties": false
        },
        {
          "type": "object",
          "required": [
            "type",
            "representation",
            "value"
          ],
          "properties": {
            "type": {
              "const": "color"
            },
            "representation": {
              "enum": [
                "rgba32f",
                "rgba16f",
                "rgba8unorm",
                "rgb8unorm"
              ]
            },
            "colorSpace": {
              "enum": [
                "linear",
                "srgb"
              ]
            },
            "value": {
              "type": "array",
              "prefixItems": [
                {
                  "type": "number"
                },
                {
                  "type": "number"
                },
                {
                  "type": "number"
                },
                {
                  "type": "number"
                }
              ],
              "minItems": 4,
              "maxItems": 4
            }
          },
          "additionalProperties": false
        }
      ]
    }
  }
} as const;

export const objectTextParseResultV01Schema = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://skenion.dev/schemas/object-text/v0.1/parse-result.schema.json",
  "title": "skenion Object Text Parse Result v0.1",
  "type": "object",
  "required": [
    "schema",
    "schemaVersion",
    "input",
    "ok",
    "classSymbol",
    "creationArgs",
    "resolvedKind",
    "resolvedKindVersion",
    "params",
    "instancePorts",
    "displayText",
    "diagnostics"
  ],
  "properties": {
    "schema": {
      "const": "skenion.object-text.parse-result"
    },
    "schemaVersion": {
      "const": "0.1.0"
    },
    "input": {
      "type": "string",
      "minLength": 1
    },
    "ok": {
      "type": "boolean"
    },
    "classSymbol": {
      "type": "string",
      "minLength": 1
    },
    "creationArgs": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/atom"
      }
    },
    "resolvedKind": {
      "type": [
        "string",
        "null"
      ],
      "minLength": 1
    },
    "resolvedKindVersion": {
      "type": [
        "string",
        "null"
      ],
      "minLength": 1
    },
    "params": {
      "type": "object",
      "additionalProperties": true
    },
    "instancePorts": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/port"
      }
    },
    "displayText": {
      "type": "string",
      "minLength": 1
    },
    "diagnostics": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/diagnostic"
      }
    }
  },
  "additionalProperties": false,
  "$defs": {
    "atom": {
      "type": "object",
      "required": [
        "type",
        "value"
      ],
      "properties": {
        "type": {
          "enum": [
            "float",
            "int",
            "uint",
            "bool",
            "symbol",
            "string"
          ]
        },
        "value": {
          "anyOf": [
            {
              "type": "number"
            },
            {
              "type": "boolean"
            },
            {
              "type": "string"
            }
          ]
        },
        "representation": {
          "type": "string",
          "minLength": 1
        }
      },
      "additionalProperties": false
    },
    "port": {
      "type": "object",
      "required": [
        "id",
        "direction",
        "type"
      ],
      "properties": {
        "id": {
          "type": "string",
          "minLength": 1
        },
        "direction": {
          "enum": [
            "input",
            "output"
          ]
        },
        "type": {
          "type": "string",
          "minLength": 1
        },
        "rate": {
          "enum": [
            "event",
            "control",
            "audio",
            "render",
            "gpu",
            "resource",
            "io"
          ]
        },
        "activation": {
          "enum": [
            "trigger",
            "latched",
            "passive"
          ]
        },
        "defaultValue": true,
        "description": {
          "type": "string"
        }
      },
      "additionalProperties": false
    },
    "diagnostic": {
      "type": "object",
      "required": [
        "severity",
        "code",
        "message"
      ],
      "properties": {
        "severity": {
          "enum": [
            "error",
            "warning",
            "info"
          ]
        },
        "code": {
          "type": "string",
          "minLength": 1
        },
        "message": {
          "type": "string",
          "minLength": 1
        }
      },
      "additionalProperties": false
    }
  }
} as const;

export const extensionManifestV01Schema = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://skenion.dev/schemas/extension/v0.1/extension-manifest.schema.json",
  "title": "skenion Extension Manifest v0.1",
  "type": "object",
  "required": [
    "schema",
    "schemaVersion",
    "id",
    "version",
    "runtimeAbiVersion",
    "kind",
    "provides",
    "permissions"
  ],
  "properties": {
    "schema": {
      "const": "skenion.extension.manifest"
    },
    "schemaVersion": {
      "const": "0.1.0"
    },
    "id": {
      "type": "string",
      "pattern": "^[a-z0-9][a-z0-9._-]*(/[a-z0-9][a-z0-9._-]*)*$"
    },
    "version": {
      "type": "string",
      "minLength": 1
    },
    "sdkVersion": {
      "type": "string",
      "minLength": 1
    },
    "runtimeAbiVersion": {
      "type": "string",
      "minLength": 1
    },
    "kind": {
      "enum": [
        "core-package",
        "native-runtime",
        "codec",
        "node-pack"
      ]
    },
    "native": {
      "$ref": "#/$defs/nativeBinding"
    },
    "provides": {
      "$ref": "#/$defs/provides"
    },
    "permissions": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1
      },
      "uniqueItems": true
    },
    "frontend": {
      "$ref": "#/$defs/frontendMetadata"
    },
    "tests": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/test"
      },
      "default": []
    }
  },
  "allOf": [
    {
      "if": {
        "properties": {
          "kind": {
            "const": "native-runtime"
          }
        },
        "required": [
          "kind"
        ]
      },
      "then": {
        "required": [
          "native"
        ]
      }
    }
  ],
  "additionalProperties": false,
  "$defs": {
    "nativeBinding": {
      "type": "object",
      "required": [
        "entrypoint",
        "artifacts"
      ],
      "properties": {
        "entrypoint": {
          "type": "string",
          "minLength": 1,
          "default": "skenion_extension_init"
        },
        "artifacts": {
          "type": "array",
          "minItems": 1,
          "items": {
            "$ref": "#/$defs/nativeArtifact"
          }
        }
      },
      "additionalProperties": false
    },
    "nativeArtifact": {
      "type": "object",
      "required": [
        "os",
        "arch",
        "abi",
        "path"
      ],
      "properties": {
        "os": {
          "type": "string",
          "minLength": 1
        },
        "arch": {
          "type": "string",
          "minLength": 1
        },
        "abi": {
          "const": "c"
        },
        "path": {
          "type": "string",
          "minLength": 1
        },
        "sha256": {
          "type": "string",
          "pattern": "^[a-fA-F0-9]{64}$"
        }
      },
      "additionalProperties": false
    },
    "provides": {
      "type": "object",
      "properties": {
        "nodes": {
          "type": "array",
          "items": {
            "$ref": "https://skenion.dev/schemas/node/v0.1/node-definition.schema.json"
          },
          "default": []
        },
        "codecs": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/codec"
          },
          "default": []
        },
        "transports": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/transport"
          },
          "default": []
        },
        "help": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/helpEntry"
          },
          "default": []
        }
      },
      "additionalProperties": false
    },
    "codec": {
      "type": "object",
      "required": [
        "id",
        "version",
        "transportKinds",
        "direction"
      ],
      "properties": {
        "id": {
          "type": "string",
          "minLength": 1
        },
        "version": {
          "type": "string",
          "minLength": 1
        },
        "transportKinds": {
          "type": "array",
          "items": {
            "enum": [
              "midi",
              "hid",
              "serial",
              "inline"
            ]
          },
          "minItems": 1,
          "uniqueItems": true
        },
        "direction": {
          "enum": [
            "decode",
            "encode",
            "duplex"
          ]
        }
      },
      "additionalProperties": false
    },
    "transport": {
      "type": "object",
      "required": [
        "id",
        "version",
        "kind"
      ],
      "properties": {
        "id": {
          "type": "string",
          "minLength": 1
        },
        "version": {
          "type": "string",
          "minLength": 1
        },
        "kind": {
          "type": "string",
          "minLength": 1
        }
      },
      "additionalProperties": false
    },
    "helpEntry": {
      "type": "object",
      "required": [
        "nodeId"
      ],
      "properties": {
        "nodeId": {
          "type": "string",
          "minLength": 1
        },
        "nodeVersion": {
          "type": "string",
          "minLength": 1
        },
        "title": {
          "type": "string"
        },
        "markdownPath": {
          "type": "string",
          "minLength": 1
        },
        "graphPath": {
          "type": "string",
          "minLength": 1
        }
      },
      "additionalProperties": false
    },
    "test": {
      "type": "object",
      "required": [
        "id",
        "kind",
        "target"
      ],
      "properties": {
        "id": {
          "type": "string",
          "minLength": 1
        },
        "kind": {
          "enum": [
            "node",
            "codec",
            "extension"
          ]
        },
        "target": {
          "type": "string",
          "minLength": 1
        },
        "fixturePath": {
          "type": "string",
          "minLength": 1
        },
        "expectedPath": {
          "type": "string",
          "minLength": 1
        }
      },
      "additionalProperties": false
    },
    "frontendMetadata": {
      "type": "object",
      "properties": {
        "displayName": {
          "type": "string"
        },
        "description": {
          "type": "string"
        },
        "tags": {
          "type": "array",
          "items": {
            "type": "string"
          },
          "uniqueItems": true
        }
      },
      "additionalProperties": false
    }
  }
} as const;

export const releaseTrainV01Schema = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://skenion.dev/schemas/release-train/v0.1/release-train.schema.json",
  "title": "skenion Release Train Manifest v0.1",
  "type": "object",
  "required": [
    "schema",
    "schema-version",
    "train-id",
    "train-version",
    "protocol-baselines",
    "capability-set",
    "components",
    "release-gates"
  ],
  "properties": {
    "schema": {
      "const": "skenion.release-train"
    },
    "schema-version": {
      "const": "0.1.0"
    },
    "train-id": {
      "type": "string",
      "pattern": "^[0-9]+\\.[0-9]+$"
    },
    "train-version": {
      "type": "string",
      "pattern": "^[0-9]+\\.[0-9]+\\.[0-9]+$"
    },
    "protocol-baselines": {
      "$ref": "#/$defs/protocol-baselines"
    },
    "capability-set": {
      "$ref": "#/$defs/capability-set"
    },
    "components": {
      "$ref": "#/$defs/components"
    },
    "release-gates": {
      "$ref": "#/$defs/release-gates"
    }
  },
  "additionalProperties": false,
  "$defs": {
    "protocol-baselines": {
      "type": "object",
      "required": [
        "graph",
        "project",
        "node",
        "extension",
        "runtime-http",
        "runtime-collaboration"
      ],
      "properties": {
        "graph": {
          "const": "0.1"
        },
        "project": {
          "const": "0.1"
        },
        "node": {
          "const": "0.1"
        },
        "extension": {
          "const": "0.1"
        },
        "runtime-http": {
          "const": "v0"
        },
        "runtime-collaboration": {
          "const": "v0"
        }
      },
      "additionalProperties": false
    },
    "capability-set": {
      "type": "object",
      "required": [
        "protocol-surfaces",
        "runtime",
        "studio",
        "marketplace",
        "manual"
      ],
      "properties": {
        "protocol-surfaces": {
          "$ref": "#/$defs/protocol-baselines"
        },
        "runtime": {
          "$ref": "#/$defs/runtimeCapabilitySet"
        },
        "studio": {
          "$ref": "#/$defs/studioCapabilitySet"
        },
        "marketplace": {
          "$ref": "#/$defs/marketplaceCapabilitySet"
        },
        "manual": {
          "$ref": "#/$defs/manualCapabilitySet"
        }
      },
      "additionalProperties": false
    },
    "runtimeCapabilitySet": {
      "type": "object",
      "required": [
        "session-addressing",
        "event-replay",
        "multi-window",
        "connection-profiles",
        "collaboration",
        "operation-log",
        "io-discovery",
        "auth-policy"
      ],
      "properties": {
        "session-addressing": {
          "const": true
        },
        "event-replay": {
          "const": true
        },
        "multi-window": {
          "const": true
        },
        "connection-profiles": {
          "type": "array",
          "items": {
            "enum": [
              "local-managed",
              "local-shared",
              "remote"
            ]
          },
          "minItems": 3,
          "uniqueItems": true
        },
        "collaboration": {
          "const": "server-authoritative-ot"
        },
        "operation-log": {
          "const": true
        },
        "io-discovery": {
          "const": "raw-descriptor"
        },
        "auth-policy": {
          "const": "deferred"
        }
      },
      "additionalProperties": false
    },
    "studioCapabilitySet": {
      "type": "object",
      "required": [
        "graph-editor",
        "patch-library",
        "subpatches",
        "living-help",
        "graph-clipboard",
        "desktop-shell",
        "connection-profiles"
      ],
      "properties": {
        "graph-editor": {
          "const": true
        },
        "patch-library": {
          "const": true
        },
        "subpatches": {
          "const": true
        },
        "living-help": {
          "const": true
        },
        "graph-clipboard": {
          "const": true
        },
        "desktop-shell": {
          "const": "tauri"
        },
        "connection-profiles": {
          "type": "array",
          "items": {
            "enum": [
              "local-managed",
              "local-shared",
              "remote"
            ]
          },
          "minItems": 3,
          "uniqueItems": true
        }
      },
      "additionalProperties": false
    },
    "marketplaceCapabilitySet": {
      "type": "object",
      "required": [
        "package-discovery",
        "package-install",
        "package-update",
        "extension-packages"
      ],
      "properties": {
        "package-discovery": {
          "const": true
        },
        "package-install": {
          "const": true
        },
        "package-update": {
          "const": true
        },
        "extension-packages": {
          "const": true
        }
      },
      "additionalProperties": false
    },
    "manualCapabilitySet": {
      "type": "object",
      "required": [
        "versioned-paths",
        "pages-deployment",
        "latest-promotion-requires-matrix",
        "patch-releases-use-major-minor-path"
      ],
      "properties": {
        "versioned-paths": {
          "const": true
        },
        "pages-deployment": {
          "const": true
        },
        "latest-promotion-requires-matrix": {
          "const": true
        },
        "patch-releases-use-major-minor-path": {
          "const": true
        }
      },
      "additionalProperties": false
    },
    "components": {
      "type": "object",
      "required": [
        "contracts",
        "runtime",
        "sdk",
        "studio",
        "examples",
        "docs"
      ],
      "properties": {
        "contracts": {
          "$ref": "#/$defs/contractsComponent"
        },
        "runtime": {
          "$ref": "#/$defs/runtimeComponent"
        },
        "sdk": {
          "$ref": "#/$defs/sdkComponent"
        },
        "studio": {
          "$ref": "#/$defs/studioComponent"
        },
        "examples": {
          "$ref": "#/$defs/examplesComponent"
        },
        "docs": {
          "$ref": "#/$defs/docsComponent"
        }
      },
      "additionalProperties": false
    },
    "contractsComponent": {
      "type": "object",
      "required": [
        "npm",
        "crate"
      ],
      "properties": {
        "npm": {
          "$ref": "#/$defs/registryPackage"
        },
        "crate": {
          "$ref": "#/$defs/registryPackage"
        }
      },
      "additionalProperties": false
    },
    "runtimeComponent": {
      "type": "object",
      "required": [
        "binaries"
      ],
      "properties": {
        "binaries": {
          "$ref": "#/$defs/runtimeBinaryArtifactMap"
        }
      },
      "additionalProperties": false
    },
    "sdkComponent": {
      "type": "object",
      "required": [
        "npm"
      ],
      "properties": {
        "npm": {
          "$ref": "#/$defs/registryPackage"
        }
      },
      "additionalProperties": false
    },
    "studioComponent": {
      "type": "object",
      "required": [
        "web-bundle",
        "desktop-packages",
        "runtime-sidecars"
      ],
      "properties": {
        "web-bundle": {
          "$ref": "#/$defs/studioWebBundleArtifact"
        },
        "desktop-packages": {
          "$ref": "#/$defs/studioDesktopArtifactMap"
        },
        "runtime-sidecars": {
          "$ref": "#/$defs/studioRuntimeSidecarArtifactMap"
        }
      },
      "additionalProperties": false
    },
    "examplesComponent": {
      "type": "object",
      "required": [
        "repository",
        "version",
        "tag"
      ],
      "properties": {
        "repository": {
          "$ref": "#/$defs/repository"
        },
        "version": {
          "$ref": "#/$defs/version"
        },
        "tag": {
          "type": "string",
          "minLength": 1
        },
        "commit": {
          "type": "string",
          "minLength": 1
        }
      },
      "additionalProperties": false
    },
    "docsComponent": {
      "type": "object",
      "required": [
        "manual"
      ],
      "properties": {
        "manual": {
          "$ref": "#/$defs/manualComponent"
        }
      },
      "additionalProperties": false
    },
    "manualComponent": {
      "type": "object",
      "required": [
        "version",
        "path",
        "pages-url"
      ],
      "properties": {
        "version": {
          "$ref": "#/$defs/version"
        },
        "path": {
          "type": "string",
          "pattern": "^/manual/[0-9]+\\.[0-9]+/$"
        },
        "pages-url": {
          "type": "string",
          "pattern": "^https://skenion\\.github\\.io/skenion-docs/manual/[0-9]+\\.[0-9]+/$"
        }
      },
      "additionalProperties": false
    },
    "registryPackage": {
      "type": "object",
      "required": [
        "ecosystem",
        "name",
        "version"
      ],
      "properties": {
        "ecosystem": {
          "enum": [
            "npm",
            "crates.io"
          ]
        },
        "name": {
          "type": "string",
          "minLength": 1
        },
        "version": {
          "$ref": "#/$defs/version"
        },
        "url": {
          "oneOf": [
            {
              "type": "string",
              "minLength": 1
            },
            {
              "type": "null"
            }
          ]
        }
      },
      "additionalProperties": false
    },
    "runtimeBinaryArtifactMap": {
      "type": "object",
      "required": [
        "aarch64-apple-darwin",
        "x86_64-apple-darwin",
        "x86_64-pc-windows-msvc",
        "aarch64-pc-windows-msvc",
        "x86_64-unknown-linux-gnu",
        "aarch64-unknown-linux-gnu"
      ],
      "properties": {
        "aarch64-apple-darwin": {
          "$ref": "#/$defs/runtimeBinaryAarch64AppleDarwin"
        },
        "x86_64-apple-darwin": {
          "$ref": "#/$defs/runtimeBinaryX8664AppleDarwin"
        },
        "x86_64-pc-windows-msvc": {
          "$ref": "#/$defs/runtimeBinaryX8664WindowsMsvc"
        },
        "aarch64-pc-windows-msvc": {
          "$ref": "#/$defs/runtimeBinaryAarch64WindowsMsvc"
        },
        "x86_64-unknown-linux-gnu": {
          "$ref": "#/$defs/runtimeBinaryX8664LinuxGnu"
        },
        "aarch64-unknown-linux-gnu": {
          "$ref": "#/$defs/runtimeBinaryAarch64LinuxGnu"
        }
      },
      "additionalProperties": false
    },
    "studioDesktopArtifactMap": {
      "type": "object",
      "required": [
        "aarch64-apple-darwin",
        "x86_64-apple-darwin",
        "x86_64-pc-windows-msvc",
        "aarch64-pc-windows-msvc",
        "x86_64-unknown-linux-gnu",
        "aarch64-unknown-linux-gnu"
      ],
      "properties": {
        "aarch64-apple-darwin": {
          "$ref": "#/$defs/studioDesktopAarch64AppleDarwin"
        },
        "x86_64-apple-darwin": {
          "$ref": "#/$defs/studioDesktopX8664AppleDarwin"
        },
        "x86_64-pc-windows-msvc": {
          "$ref": "#/$defs/studioDesktopX8664WindowsMsvc"
        },
        "aarch64-pc-windows-msvc": {
          "$ref": "#/$defs/studioDesktopAarch64WindowsMsvc"
        },
        "x86_64-unknown-linux-gnu": {
          "$ref": "#/$defs/studioDesktopX8664LinuxGnu"
        },
        "aarch64-unknown-linux-gnu": {
          "$ref": "#/$defs/studioDesktopAarch64LinuxGnu"
        }
      },
      "additionalProperties": false
    },
    "studioRuntimeSidecarArtifactMap": {
      "type": "object",
      "required": [
        "aarch64-apple-darwin",
        "x86_64-apple-darwin",
        "x86_64-pc-windows-msvc",
        "aarch64-pc-windows-msvc",
        "x86_64-unknown-linux-gnu",
        "aarch64-unknown-linux-gnu"
      ],
      "properties": {
        "aarch64-apple-darwin": {
          "$ref": "#/$defs/studioRuntimeSidecarAarch64AppleDarwin"
        },
        "x86_64-apple-darwin": {
          "$ref": "#/$defs/studioRuntimeSidecarX8664AppleDarwin"
        },
        "x86_64-pc-windows-msvc": {
          "$ref": "#/$defs/studioRuntimeSidecarX8664WindowsMsvc"
        },
        "aarch64-pc-windows-msvc": {
          "$ref": "#/$defs/studioRuntimeSidecarAarch64WindowsMsvc"
        },
        "x86_64-unknown-linux-gnu": {
          "$ref": "#/$defs/studioRuntimeSidecarX8664LinuxGnu"
        },
        "aarch64-unknown-linux-gnu": {
          "$ref": "#/$defs/studioRuntimeSidecarAarch64LinuxGnu"
        }
      },
      "additionalProperties": false
    },
    "runtimeBinaryAarch64AppleDarwin": {
      "allOf": [
        {
          "$ref": "#/$defs/artifact"
        },
        {
          "$ref": "#/$defs/aarch64AppleDarwinReleaseBlocking"
        },
        {
          "$ref": "#/$defs/runtimeBinaryKind"
        }
      ]
    },
    "runtimeBinaryX8664AppleDarwin": {
      "allOf": [
        {
          "$ref": "#/$defs/artifact"
        },
        {
          "$ref": "#/$defs/x8664AppleDarwinReleaseBlocking"
        },
        {
          "$ref": "#/$defs/runtimeBinaryKind"
        }
      ]
    },
    "runtimeBinaryX8664WindowsMsvc": {
      "allOf": [
        {
          "$ref": "#/$defs/artifact"
        },
        {
          "$ref": "#/$defs/x8664WindowsMsvcReleaseBlocking"
        },
        {
          "$ref": "#/$defs/runtimeBinaryKind"
        }
      ]
    },
    "runtimeBinaryAarch64WindowsMsvc": {
      "allOf": [
        {
          "$ref": "#/$defs/artifact"
        },
        {
          "$ref": "#/$defs/aarch64WindowsMsvcPreview"
        },
        {
          "$ref": "#/$defs/runtimeBinaryKind"
        }
      ]
    },
    "runtimeBinaryX8664LinuxGnu": {
      "allOf": [
        {
          "$ref": "#/$defs/artifact"
        },
        {
          "$ref": "#/$defs/x8664LinuxGnuReleaseBlocking"
        },
        {
          "$ref": "#/$defs/runtimeBinaryKind"
        }
      ]
    },
    "runtimeBinaryAarch64LinuxGnu": {
      "allOf": [
        {
          "$ref": "#/$defs/artifact"
        },
        {
          "$ref": "#/$defs/aarch64LinuxGnuPreview"
        },
        {
          "$ref": "#/$defs/runtimeBinaryKind"
        }
      ]
    },
    "studioDesktopAarch64AppleDarwin": {
      "allOf": [
        {
          "$ref": "#/$defs/artifact"
        },
        {
          "$ref": "#/$defs/aarch64AppleDarwinReleaseBlocking"
        },
        {
          "$ref": "#/$defs/studioDesktopKind"
        }
      ]
    },
    "studioDesktopX8664AppleDarwin": {
      "allOf": [
        {
          "$ref": "#/$defs/artifact"
        },
        {
          "$ref": "#/$defs/x8664AppleDarwinReleaseBlocking"
        },
        {
          "$ref": "#/$defs/studioDesktopKind"
        }
      ]
    },
    "studioDesktopX8664WindowsMsvc": {
      "allOf": [
        {
          "$ref": "#/$defs/artifact"
        },
        {
          "$ref": "#/$defs/x8664WindowsMsvcReleaseBlocking"
        },
        {
          "$ref": "#/$defs/studioDesktopKind"
        }
      ]
    },
    "studioDesktopAarch64WindowsMsvc": {
      "allOf": [
        {
          "$ref": "#/$defs/artifact"
        },
        {
          "$ref": "#/$defs/aarch64WindowsMsvcPreview"
        },
        {
          "$ref": "#/$defs/studioDesktopKind"
        }
      ]
    },
    "studioDesktopX8664LinuxGnu": {
      "allOf": [
        {
          "$ref": "#/$defs/artifact"
        },
        {
          "$ref": "#/$defs/x8664LinuxGnuReleaseBlocking"
        },
        {
          "$ref": "#/$defs/studioDesktopKind"
        }
      ]
    },
    "studioDesktopAarch64LinuxGnu": {
      "allOf": [
        {
          "$ref": "#/$defs/artifact"
        },
        {
          "$ref": "#/$defs/aarch64LinuxGnuPreview"
        },
        {
          "$ref": "#/$defs/studioDesktopKind"
        }
      ]
    },
    "studioRuntimeSidecarAarch64AppleDarwin": {
      "allOf": [
        {
          "$ref": "#/$defs/artifact"
        },
        {
          "$ref": "#/$defs/aarch64AppleDarwinReleaseBlocking"
        },
        {
          "$ref": "#/$defs/studioRuntimeSidecarKind"
        }
      ]
    },
    "studioRuntimeSidecarX8664AppleDarwin": {
      "allOf": [
        {
          "$ref": "#/$defs/artifact"
        },
        {
          "$ref": "#/$defs/x8664AppleDarwinReleaseBlocking"
        },
        {
          "$ref": "#/$defs/studioRuntimeSidecarKind"
        }
      ]
    },
    "studioRuntimeSidecarX8664WindowsMsvc": {
      "allOf": [
        {
          "$ref": "#/$defs/artifact"
        },
        {
          "$ref": "#/$defs/x8664WindowsMsvcReleaseBlocking"
        },
        {
          "$ref": "#/$defs/studioRuntimeSidecarKind"
        }
      ]
    },
    "studioRuntimeSidecarAarch64WindowsMsvc": {
      "allOf": [
        {
          "$ref": "#/$defs/artifact"
        },
        {
          "$ref": "#/$defs/aarch64WindowsMsvcPreview"
        },
        {
          "$ref": "#/$defs/studioRuntimeSidecarKind"
        }
      ]
    },
    "studioRuntimeSidecarX8664LinuxGnu": {
      "allOf": [
        {
          "$ref": "#/$defs/artifact"
        },
        {
          "$ref": "#/$defs/x8664LinuxGnuReleaseBlocking"
        },
        {
          "$ref": "#/$defs/studioRuntimeSidecarKind"
        }
      ]
    },
    "studioRuntimeSidecarAarch64LinuxGnu": {
      "allOf": [
        {
          "$ref": "#/$defs/artifact"
        },
        {
          "$ref": "#/$defs/aarch64LinuxGnuPreview"
        },
        {
          "$ref": "#/$defs/studioRuntimeSidecarKind"
        }
      ]
    },
    "studioWebBundleArtifact": {
      "allOf": [
        {
          "$ref": "#/$defs/nonTargetArtifact"
        },
        {
          "$ref": "#/$defs/studioWebBundleKind"
        }
      ]
    },
    "aarch64AppleDarwinReleaseBlocking": {
      "type": "object",
      "properties": {
        "target": {
          "const": "aarch64-apple-darwin"
        },
        "support-tier": {
          "const": "release-blocking"
        }
      }
    },
    "x8664AppleDarwinReleaseBlocking": {
      "type": "object",
      "properties": {
        "target": {
          "const": "x86_64-apple-darwin"
        },
        "support-tier": {
          "const": "release-blocking"
        }
      }
    },
    "x8664WindowsMsvcReleaseBlocking": {
      "type": "object",
      "properties": {
        "target": {
          "const": "x86_64-pc-windows-msvc"
        },
        "support-tier": {
          "const": "release-blocking"
        }
      }
    },
    "aarch64WindowsMsvcPreview": {
      "type": "object",
      "properties": {
        "target": {
          "const": "aarch64-pc-windows-msvc"
        },
        "support-tier": {
          "const": "preview"
        }
      }
    },
    "x8664LinuxGnuReleaseBlocking": {
      "type": "object",
      "properties": {
        "target": {
          "const": "x86_64-unknown-linux-gnu"
        },
        "support-tier": {
          "const": "release-blocking"
        }
      }
    },
    "aarch64LinuxGnuPreview": {
      "type": "object",
      "properties": {
        "target": {
          "const": "aarch64-unknown-linux-gnu"
        },
        "support-tier": {
          "const": "preview"
        }
      }
    },
    "runtimeBinaryKind": {
      "type": "object",
      "properties": {
        "kind": {
          "const": "runtime-binary"
        }
      }
    },
    "studioDesktopKind": {
      "type": "object",
      "properties": {
        "kind": {
          "const": "studio-desktop-package"
        }
      }
    },
    "studioRuntimeSidecarKind": {
      "type": "object",
      "properties": {
        "kind": {
          "const": "studio-runtime-sidecar"
        }
      }
    },
    "studioWebBundleKind": {
      "type": "object",
      "properties": {
        "kind": {
          "const": "studio-web-bundle"
        }
      }
    },
    "artifact": {
      "type": "object",
      "required": [
        "id",
        "target",
        "support-tier",
        "kind",
        "name",
        "version",
        "source",
        "checksum",
        "size-bytes"
      ],
      "properties": {
        "id": {
          "type": "string",
          "minLength": 1
        },
        "target": {
          "$ref": "#/$defs/target"
        },
        "support-tier": {
          "enum": [
            "release-blocking",
            "preview"
          ]
        },
        "kind": {
          "enum": [
            "runtime-binary",
            "studio-desktop-package",
            "studio-runtime-sidecar"
          ]
        },
        "name": {
          "type": "string",
          "minLength": 1
        },
        "version": {
          "$ref": "#/$defs/version"
        },
        "source": {
          "$ref": "#/$defs/artifactSource"
        },
        "checksum": {
          "$ref": "#/$defs/checksum"
        },
        "size-bytes": {
          "oneOf": [
            {
              "type": "integer",
              "minimum": 0
            },
            {
              "type": "null"
            }
          ]
        }
      },
      "additionalProperties": false
    },
    "nonTargetArtifact": {
      "type": "object",
      "required": [
        "id",
        "kind",
        "name",
        "version",
        "source",
        "checksum",
        "size-bytes"
      ],
      "properties": {
        "id": {
          "type": "string",
          "minLength": 1
        },
        "kind": {
          "enum": [
            "studio-web-bundle"
          ]
        },
        "name": {
          "type": "string",
          "minLength": 1
        },
        "version": {
          "$ref": "#/$defs/version"
        },
        "source": {
          "$ref": "#/$defs/artifactSource"
        },
        "checksum": {
          "$ref": "#/$defs/checksum"
        },
        "size-bytes": {
          "oneOf": [
            {
              "type": "integer",
              "minimum": 0
            },
            {
              "type": "null"
            }
          ]
        }
      },
      "additionalProperties": false
    },
    "artifactSource": {
      "oneOf": [
        {
          "type": "object",
          "required": [
            "kind",
            "repository",
            "tag",
            "asset-name",
            "url"
          ],
          "properties": {
            "kind": {
              "const": "github-release-asset"
            },
            "repository": {
              "$ref": "#/$defs/repository"
            },
            "tag": {
              "type": "string",
              "minLength": 1
            },
            "asset-name": {
              "type": "string",
              "minLength": 1
            },
            "url": {
              "oneOf": [
                {
                  "type": "string",
                  "minLength": 1
                },
                {
                  "type": "null"
                }
              ]
            }
          },
          "additionalProperties": false
        },
        {
          "type": "object",
          "required": [
            "kind",
            "url"
          ],
          "properties": {
            "kind": {
              "const": "url"
            },
            "url": {
              "type": "string",
              "minLength": 1
            }
          },
          "additionalProperties": false
        }
      ]
    },
    "checksum": {
      "type": "object",
      "required": [
        "algorithm",
        "value"
      ],
      "properties": {
        "algorithm": {
          "const": "sha256"
        },
        "value": {
          "oneOf": [
            {
              "type": "string",
              "pattern": "^[a-fA-F0-9]{64}$"
            },
            {
              "type": "null"
            }
          ]
        }
      },
      "additionalProperties": false
    },
    "release-gates": {
      "type": "object",
      "required": [
        "registry-packages",
        "github-release-assets",
        "checksum-verification",
        "runtime-smoke",
        "studio-package-smoke",
        "examples-conformance",
        "docs-pages-deployment"
      ],
      "properties": {
        "registry-packages": {
          "$ref": "#/$defs/registryPackageGates"
        },
        "github-release-assets": {
          "$ref": "#/$defs/githubReleaseAssetGates"
        },
        "checksum-verification": {
          "$ref": "#/$defs/checksumGate"
        },
        "runtime-smoke": {
          "$ref": "#/$defs/runtime-smokeGateMap"
        },
        "studio-package-smoke": {
          "$ref": "#/$defs/studio-package-smokeGateMap"
        },
        "examples-conformance": {
          "$ref": "#/$defs/examples-conformanceGate"
        },
        "docs-pages-deployment": {
          "$ref": "#/$defs/docs-pages-deploymentGate"
        }
      },
      "additionalProperties": false
    },
    "registryPackageGates": {
      "type": "object",
      "required": [
        "contracts-npm",
        "contracts-crate",
        "sdk-npm"
      ],
      "properties": {
        "contracts-npm": {
          "$ref": "#/$defs/registryPackageGate"
        },
        "contracts-crate": {
          "$ref": "#/$defs/registryPackageGate"
        },
        "sdk-npm": {
          "$ref": "#/$defs/registryPackageGate"
        }
      },
      "additionalProperties": false
    },
    "registryPackageGate": {
      "type": "object",
      "required": [
        "id",
        "status",
        "required",
        "package"
      ],
      "properties": {
        "id": {
          "type": "string",
          "minLength": 1
        },
        "status": {
          "$ref": "#/$defs/gateStatus"
        },
        "required": {
          "type": "boolean"
        },
        "package": {
          "$ref": "#/$defs/registryPackage"
        },
        "evidence-url": {
          "type": "string",
          "minLength": 1
        }
      },
      "additionalProperties": false
    },
    "githubReleaseAssetGates": {
      "type": "object",
      "required": [
        "runtime",
        "studio"
      ],
      "properties": {
        "runtime": {
          "$ref": "#/$defs/artifactCollectionGate"
        },
        "studio": {
          "$ref": "#/$defs/artifactCollectionGate"
        }
      },
      "additionalProperties": false
    },
    "artifactCollectionGate": {
      "type": "object",
      "required": [
        "id",
        "status",
        "required",
        "repository",
        "tag",
        "artifact-ids"
      ],
      "properties": {
        "id": {
          "type": "string",
          "minLength": 1
        },
        "status": {
          "$ref": "#/$defs/gateStatus"
        },
        "required": {
          "type": "boolean"
        },
        "repository": {
          "$ref": "#/$defs/repository"
        },
        "tag": {
          "type": "string",
          "minLength": 1
        },
        "artifact-ids": {
          "type": "array",
          "items": {
            "type": "string",
            "minLength": 1
          },
          "minItems": 1,
          "uniqueItems": true
        },
        "evidence-url": {
          "type": "string",
          "minLength": 1
        }
      },
      "additionalProperties": false
    },
    "checksumGate": {
      "type": "object",
      "required": [
        "id",
        "status",
        "required",
        "artifact-ids"
      ],
      "properties": {
        "id": {
          "type": "string",
          "minLength": 1
        },
        "status": {
          "$ref": "#/$defs/gateStatus"
        },
        "required": {
          "type": "boolean"
        },
        "artifact-ids": {
          "type": "array",
          "items": {
            "type": "string",
            "minLength": 1
          },
          "minItems": 1,
          "uniqueItems": true
        },
        "expected-checksums": {
          "type": "object",
          "propertyNames": {
            "type": "string",
            "minLength": 1
          },
          "additionalProperties": {
            "$ref": "#/$defs/checksum"
          }
        },
        "evidence-url": {
          "type": "string",
          "minLength": 1
        }
      },
      "additionalProperties": false
    },
    "runtime-smokeGateMap": {
      "type": "object",
      "required": [
        "aarch64-apple-darwin",
        "x86_64-apple-darwin",
        "x86_64-pc-windows-msvc",
        "aarch64-pc-windows-msvc",
        "x86_64-unknown-linux-gnu",
        "aarch64-unknown-linux-gnu"
      ],
      "properties": {
        "aarch64-apple-darwin": {
          "$ref": "#/$defs/runtime-smokeGate"
        },
        "x86_64-apple-darwin": {
          "$ref": "#/$defs/runtime-smokeGate"
        },
        "x86_64-pc-windows-msvc": {
          "$ref": "#/$defs/runtime-smokeGate"
        },
        "aarch64-pc-windows-msvc": {
          "$ref": "#/$defs/runtime-smokeGate"
        },
        "x86_64-unknown-linux-gnu": {
          "$ref": "#/$defs/runtime-smokeGate"
        },
        "aarch64-unknown-linux-gnu": {
          "$ref": "#/$defs/runtime-smokeGate"
        }
      },
      "additionalProperties": false
    },
    "runtime-smokeGate": {
      "type": "object",
      "required": [
        "id",
        "status",
        "required",
        "target",
        "artifact-id"
      ],
      "properties": {
        "id": {
          "type": "string",
          "minLength": 1
        },
        "status": {
          "$ref": "#/$defs/gateStatus"
        },
        "required": {
          "type": "boolean"
        },
        "target": {
          "$ref": "#/$defs/target"
        },
        "artifact-id": {
          "type": "string",
          "minLength": 1
        },
        "evidence-url": {
          "type": "string",
          "minLength": 1
        }
      },
      "additionalProperties": false
    },
    "studio-package-smokeGateMap": {
      "type": "object",
      "required": [
        "aarch64-apple-darwin",
        "x86_64-apple-darwin",
        "x86_64-pc-windows-msvc",
        "aarch64-pc-windows-msvc",
        "x86_64-unknown-linux-gnu",
        "aarch64-unknown-linux-gnu"
      ],
      "properties": {
        "aarch64-apple-darwin": {
          "$ref": "#/$defs/studio-package-smokeGate"
        },
        "x86_64-apple-darwin": {
          "$ref": "#/$defs/studio-package-smokeGate"
        },
        "x86_64-pc-windows-msvc": {
          "$ref": "#/$defs/studio-package-smokeGate"
        },
        "aarch64-pc-windows-msvc": {
          "$ref": "#/$defs/studio-package-smokeGate"
        },
        "x86_64-unknown-linux-gnu": {
          "$ref": "#/$defs/studio-package-smokeGate"
        },
        "aarch64-unknown-linux-gnu": {
          "$ref": "#/$defs/studio-package-smokeGate"
        }
      },
      "additionalProperties": false
    },
    "studio-package-smokeGate": {
      "type": "object",
      "required": [
        "id",
        "status",
        "required",
        "target",
        "desktop-package-artifact-id",
        "runtime-sidecar-artifact-id"
      ],
      "properties": {
        "id": {
          "type": "string",
          "minLength": 1
        },
        "status": {
          "$ref": "#/$defs/gateStatus"
        },
        "required": {
          "type": "boolean"
        },
        "target": {
          "$ref": "#/$defs/target"
        },
        "desktop-package-artifact-id": {
          "type": "string",
          "minLength": 1
        },
        "runtime-sidecar-artifact-id": {
          "type": "string",
          "minLength": 1
        },
        "evidence-url": {
          "type": "string",
          "minLength": 1
        }
      },
      "additionalProperties": false
    },
    "examples-conformanceGate": {
      "type": "object",
      "required": [
        "id",
        "status",
        "required",
        "repository",
        "ref",
        "version"
      ],
      "properties": {
        "id": {
          "type": "string",
          "minLength": 1
        },
        "status": {
          "$ref": "#/$defs/gateStatus"
        },
        "required": {
          "type": "boolean"
        },
        "repository": {
          "$ref": "#/$defs/repository"
        },
        "ref": {
          "type": "string",
          "minLength": 1
        },
        "version": {
          "$ref": "#/$defs/version"
        },
        "evidence-url": {
          "type": "string",
          "minLength": 1
        }
      },
      "additionalProperties": false
    },
    "docs-pages-deploymentGate": {
      "type": "object",
      "required": [
        "id",
        "status",
        "required",
        "manual-version",
        "manual-path",
        "pages-url"
      ],
      "properties": {
        "id": {
          "type": "string",
          "minLength": 1
        },
        "status": {
          "$ref": "#/$defs/gateStatus"
        },
        "required": {
          "type": "boolean"
        },
        "manual-version": {
          "$ref": "#/$defs/version"
        },
        "manual-path": {
          "type": "string",
          "pattern": "^/manual/[0-9]+\\.[0-9]+/$"
        },
        "pages-url": {
          "type": "string",
          "pattern": "^https://skenion\\.github\\.io/skenion-docs/manual/[0-9]+\\.[0-9]+/$"
        },
        "evidence-url": {
          "type": "string",
          "minLength": 1
        }
      },
      "additionalProperties": false
    },
    "gateStatus": {
      "enum": [
        "pending",
        "passed",
        "failed",
        "waived"
      ]
    },
    "target": {
      "enum": [
        "aarch64-apple-darwin",
        "x86_64-apple-darwin",
        "x86_64-pc-windows-msvc",
        "aarch64-pc-windows-msvc",
        "x86_64-unknown-linux-gnu",
        "aarch64-unknown-linux-gnu"
      ]
    },
    "repository": {
      "type": "string",
      "pattern": "^skenion/[A-Za-z0-9_.-]+$"
    },
    "version": {
      "type": "string",
      "pattern": "^[0-9]+\\.[0-9]+\\.[0-9]+$"
    }
  }
} as const;

export const compatibilityMatrixV01Schema = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://skenion.dev/schemas/compatibility-matrix/v0.1/compatibility-matrix.schema.json",
  "title": "skenion Compatibility Matrix v0.1",
  "type": "object",
  "required": [
    "schema",
    "schema-version",
    "matrix-id",
    "contracts-line",
    "contracts-range",
    "protocol-baselines",
    "capabilities",
    "components",
    "verification",
    "promotion"
  ],
  "properties": {
    "schema": {
      "const": "skenion.compatibility-matrix"
    },
    "schema-version": {
      "const": "0.1.0"
    },
    "matrix-id": {
      "type": "string",
      "minLength": 1
    },
    "contracts-line": {
      "type": "string",
      "pattern": "^0\\.[0-9]+$"
    },
    "contracts-range": {
      "type": "string",
      "pattern": "^>=0\\.[0-9]+\\.0 <0\\.[0-9]+\\.0$"
    },
    "protocol-baselines": {
      "$ref": "#/$defs/protocolBaselines"
    },
    "capabilities": {
      "$ref": "#/$defs/capabilities"
    },
    "components": {
      "$ref": "#/$defs/components"
    },
    "verification": {
      "$ref": "#/$defs/verification"
    },
    "promotion": {
      "$ref": "#/$defs/promotion"
    }
  },
  "additionalProperties": false,
  "$defs": {
    "target": {
      "enum": [
        "aarch64-apple-darwin",
        "x86_64-apple-darwin",
        "x86_64-pc-windows-msvc",
        "aarch64-pc-windows-msvc",
        "x86_64-unknown-linux-gnu",
        "aarch64-unknown-linux-gnu"
      ]
    },
    "targetMap": {
      "type": "object",
      "required": [
        "aarch64-apple-darwin",
        "x86_64-apple-darwin",
        "x86_64-pc-windows-msvc",
        "aarch64-pc-windows-msvc",
        "x86_64-unknown-linux-gnu",
        "aarch64-unknown-linux-gnu"
      ],
      "properties": {
        "aarch64-apple-darwin": {
          "$ref": "#/$defs/artifact"
        },
        "x86_64-apple-darwin": {
          "$ref": "#/$defs/artifact"
        },
        "x86_64-pc-windows-msvc": {
          "$ref": "#/$defs/artifact"
        },
        "aarch64-pc-windows-msvc": {
          "$ref": "#/$defs/artifact"
        },
        "x86_64-unknown-linux-gnu": {
          "$ref": "#/$defs/artifact"
        },
        "aarch64-unknown-linux-gnu": {
          "$ref": "#/$defs/artifact"
        }
      },
      "additionalProperties": false
    },
    "checksum": {
      "type": "object",
      "required": [
        "algorithm",
        "value"
      ],
      "properties": {
        "algorithm": {
          "const": "sha256"
        },
        "value": {
          "type": [
            "string",
            "null"
          ],
          "pattern": "^[A-Fa-f0-9]{64}$"
        }
      },
      "additionalProperties": false
    },
    "githubSource": {
      "type": "object",
      "required": [
        "kind",
        "repository",
        "tag",
        "asset-name"
      ],
      "properties": {
        "kind": {
          "const": "github-release-asset"
        },
        "repository": {
          "type": "string",
          "minLength": 1
        },
        "tag": {
          "type": "string",
          "minLength": 1
        },
        "asset-name": {
          "type": "string",
          "minLength": 1
        },
        "url": {
          "type": [
            "string",
            "null"
          ]
        }
      },
      "additionalProperties": false
    },
    "artifact": {
      "type": "object",
      "required": [
        "id",
        "target",
        "kind",
        "name",
        "version",
        "source",
        "checksum"
      ],
      "properties": {
        "id": {
          "type": "string",
          "minLength": 1
        },
        "target": {
          "$ref": "#/$defs/target"
        },
        "kind": {
          "enum": [
            "runtime-binary",
            "studio-desktop-package",
            "studio-runtime-sidecar",
            "studio-web-bundle"
          ]
        },
        "name": {
          "type": "string",
          "minLength": 1
        },
        "version": {
          "type": "string",
          "pattern": "^[0-9]+\\.[0-9]+\\.[0-9]+$"
        },
        "source": {
          "$ref": "#/$defs/githubSource"
        },
        "checksum": {
          "$ref": "#/$defs/checksum"
        },
        "size-bytes": {
          "type": [
            "integer",
            "null"
          ],
          "minimum": 0
        }
      },
      "additionalProperties": false
    },
    "registryPackage": {
      "type": "object",
      "required": [
        "ecosystem",
        "name",
        "version",
        "tag",
        "commit"
      ],
      "properties": {
        "ecosystem": {
          "enum": [
            "npm",
            "crates.io"
          ]
        },
        "name": {
          "type": "string",
          "minLength": 1
        },
        "version": {
          "type": "string",
          "pattern": "^[0-9]+\\.[0-9]+\\.[0-9]+$"
        },
        "tag": {
          "type": "string",
          "minLength": 1
        },
        "commit": {
          "type": "string",
          "minLength": 7
        },
        "url": {
          "type": [
            "string",
            "null"
          ]
        }
      },
      "additionalProperties": false
    },
    "protocolBaselines": {
      "type": "object",
      "required": [
        "graph",
        "project",
        "node",
        "extension",
        "runtime-http",
        "runtime-collaboration"
      ],
      "properties": {
        "graph": {
          "const": "0.1"
        },
        "project": {
          "const": "0.1"
        },
        "node": {
          "const": "0.1"
        },
        "extension": {
          "const": "0.1"
        },
        "runtime-http": {
          "const": "v0"
        },
        "runtime-collaboration": {
          "const": "v0"
        }
      },
      "additionalProperties": false
    },
    "capabilitySet": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1
      },
      "minItems": 1,
      "uniqueItems": true
    },
    "capabilities": {
      "type": "object",
      "required": [
        "runtime",
        "studio",
        "marketplace",
        "docs"
      ],
      "properties": {
        "runtime": {
          "$ref": "#/$defs/capabilitySet"
        },
        "studio": {
          "$ref": "#/$defs/capabilitySet"
        },
        "marketplace": {
          "$ref": "#/$defs/capabilitySet"
        },
        "docs": {
          "$ref": "#/$defs/capabilitySet"
        }
      },
      "additionalProperties": false
    },
    "components": {
      "type": "object",
      "required": [
        "contracts",
        "runtime",
        "sdk",
        "studio",
        "examples",
        "docs"
      ],
      "properties": {
        "contracts": {
          "type": "object",
          "required": [
            "npm",
            "crate"
          ],
          "properties": {
            "npm": {
              "$ref": "#/$defs/registryPackage"
            },
            "crate": {
              "$ref": "#/$defs/registryPackage"
            }
          },
          "additionalProperties": false
        },
        "runtime": {
          "type": "object",
          "required": [
            "version",
            "assets"
          ],
          "properties": {
            "version": {
              "type": "string",
              "pattern": "^[0-9]+\\.[0-9]+\\.[0-9]+$"
            },
            "assets": {
              "$ref": "#/$defs/targetMap"
            }
          },
          "additionalProperties": false
        },
        "sdk": {
          "type": "object",
          "required": [
            "npm",
            "supported-contracts-range"
          ],
          "properties": {
            "npm": {
              "$ref": "#/$defs/registryPackage"
            },
            "supported-contracts-range": {
              "type": "string",
              "pattern": "^>=0\\.[0-9]+\\.0 <0\\.[0-9]+\\.0$"
            }
          },
          "additionalProperties": false
        },
        "studio": {
          "type": "object",
          "required": [
            "version",
            "web-assets",
            "desktop-assets",
            "runtime-sidecars"
          ],
          "properties": {
            "version": {
              "type": "string",
              "pattern": "^[0-9]+\\.[0-9]+\\.[0-9]+$"
            },
            "web-assets": {
              "type": "array",
              "items": {
                "$ref": "#/$defs/artifact"
              },
              "minItems": 1
            },
            "desktop-assets": {
              "$ref": "#/$defs/targetMap"
            },
            "runtime-sidecars": {
              "$ref": "#/$defs/targetMap"
            }
          },
          "additionalProperties": false
        },
        "examples": {
          "type": "object",
          "required": [
            "repository",
            "ref",
            "commit",
            "conformance-status"
          ],
          "properties": {
            "repository": {
              "type": "string",
              "minLength": 1
            },
            "ref": {
              "type": "string",
              "minLength": 1
            },
            "commit": {
              "type": "string",
              "minLength": 7
            },
            "conformance-status": {
              "enum": [
                "pending",
                "passed",
                "failed"
              ]
            },
            "evidence-url": {
              "type": "string"
            }
          },
          "additionalProperties": false
        },
        "docs": {
          "type": "object",
          "required": [
            "manual"
          ],
          "properties": {
            "manual": {
              "type": "object",
              "required": [
                "version",
                "path",
                "pages-url",
                "pages-deployed",
                "promoted-latest"
              ],
              "properties": {
                "version": {
                  "type": "string",
                  "pattern": "^[0-9]+\\.[0-9]+\\.[0-9]+$"
                },
                "path": {
                  "type": "string",
                  "minLength": 1
                },
                "pages-url": {
                  "type": "string",
                  "minLength": 1
                },
                "pages-deployed": {
                  "type": "boolean"
                },
                "promoted-latest": {
                  "type": "boolean"
                },
                "evidence-url": {
                  "type": "string"
                }
              },
              "additionalProperties": false
            }
          },
          "additionalProperties": false
        }
      },
      "additionalProperties": false
    },
    "verification": {
      "type": "object",
      "required": [
        "expected-checksums"
      ],
      "properties": {
        "expected-checksums": {
          "type": "object",
          "additionalProperties": {
            "$ref": "#/$defs/checksum"
          }
        }
      },
      "additionalProperties": false
    },
    "promotion": {
      "type": "object",
      "required": [
        "state"
      ],
      "properties": {
        "state": {
          "enum": [
            "draft",
            "candidate",
            "promoted",
            "rejected"
          ]
        },
        "promoted-at": {
          "type": "string"
        },
        "promoted-by": {
          "type": "string"
        },
        "evidence-url": {
          "type": "string"
        }
      },
      "additionalProperties": false
    }
  }
} as const;
