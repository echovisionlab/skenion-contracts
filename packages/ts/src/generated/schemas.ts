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
        "objectText": {
          "type": "string",
          "minLength": 1
        },
        "bindingRef": {
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
        "messageKeys": {
          "$ref": "#/$defs/messageKeys"
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
    "messageKeys": {
      "type": "object",
      "required": [
        "accepted"
      ],
      "properties": {
        "accepted": {
          "$ref": "#/$defs/messageKeyList"
        },
        "silent": {
          "$ref": "#/$defs/messageKeyList"
        },
        "trigger": {
          "$ref": "#/$defs/messageKeyList"
        },
        "store": {
          "$ref": "#/$defs/messageKeyList"
        },
        "emit": {
          "$ref": "#/$defs/messageKeyList"
        }
      },
      "additionalProperties": false
    },
    "messageKeyList": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1,
        "pattern": "^[A-Za-z_][A-Za-z0-9_.:-]*$"
      },
      "minItems": 1,
      "uniqueItems": true
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
    "documentId",
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
    "documentId": {
      "type": "string",
      "pattern": "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
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
    "packageDependencies": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/packageDependency"
      },
      "default": []
    },
    "packageLock": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/packageLockEntry"
      },
      "default": []
    },
    "resourceLock": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/resourceLockEntry"
      },
      "default": []
    },
    "objectBindings": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/objectBinding"
      },
      "default": []
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
    },
    "packageId": {
      "type": "string",
      "pattern": "^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$"
    },
    "providedId": {
      "type": "string",
      "pattern": "^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*$"
    },
    "semver": {
      "type": "string",
      "pattern": "^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z.-]+)?(?:\\+[0-9A-Za-z.-]+)?$"
    },
    "semverRange": {
      "type": "string",
      "pattern": "^>=0\\.[0-9]+\\.[0-9]+ <0\\.[0-9]+\\.[0-9]+$"
    },
    "contractsLine": {
      "type": "string",
      "pattern": "^0\\.[0-9]+$"
    },
    "relativePath": {
      "type": "string",
      "minLength": 1,
      "pattern": "^(?!/)(?!.*(?:^|/)\\.\\.(?:/|$))[A-Za-z0-9._~!$&'()+,;=:@%/-]+$"
    },
    "packageSource": {
      "enum": [
        "first-party",
        "marketplace",
        "workspace",
        "project-local"
      ]
    },
    "packageCategory": {
      "enum": [
        "patch",
        "native",
        "mixed"
      ]
    },
    "packageRoot": {
      "enum": [
        "package",
        "project",
        "dev-link",
        "marketplace-install"
      ]
    },
    "packageTrust": {
      "enum": [
        "trusted",
        "untrusted",
        "quarantined"
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
          "enum": [
            "sha256"
          ]
        },
        "value": {
          "type": "string",
          "pattern": "^[a-fA-F0-9]{64}$"
        }
      },
      "additionalProperties": false
    },
    "packageDependency": {
      "type": "object",
      "required": [
        "packageId",
        "versionRange",
        "lockEntryId"
      ],
      "properties": {
        "packageId": {
          "$ref": "#/$defs/packageId"
        },
        "versionRange": {
          "$ref": "#/$defs/semverRange"
        },
        "lockEntryId": {
          "type": "string",
          "minLength": 1
        },
        "required": {
          "type": "boolean"
        }
      },
      "additionalProperties": false
    },
    "packageLockEntry": {
      "type": "object",
      "required": [
        "id",
        "packageId",
        "version",
        "category",
        "source",
        "root",
        "trust",
        "contractsLine",
        "contractsRange",
        "manifestPath",
        "manifestChecksum"
      ],
      "properties": {
        "id": {
          "type": "string",
          "minLength": 1
        },
        "packageId": {
          "$ref": "#/$defs/packageId"
        },
        "version": {
          "$ref": "#/$defs/semver"
        },
        "category": {
          "$ref": "#/$defs/packageCategory"
        },
        "source": {
          "$ref": "#/$defs/packageSource"
        },
        "root": {
          "$ref": "#/$defs/packageRoot"
        },
        "trust": {
          "$ref": "#/$defs/packageTrust"
        },
        "contractsLine": {
          "$ref": "#/$defs/contractsLine"
        },
        "contractsRange": {
          "$ref": "#/$defs/semverRange"
        },
        "manifestPath": {
          "$ref": "#/$defs/relativePath"
        },
        "manifestChecksum": {
          "$ref": "#/$defs/checksum"
        },
        "evidenceRefs": {
          "type": "array",
          "items": {
            "type": "string",
            "minLength": 1
          },
          "uniqueItems": true
        },
        "runtimeAbiRange": {
          "$ref": "#/$defs/semverRange"
        },
        "target": {
          "$ref": "#/$defs/targetTriple"
        },
        "nativeArtifacts": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/nativeArtifact"
          }
        }
      },
      "allOf": [
        {
          "if": {
            "properties": {
              "category": {
                "const": "patch"
              }
            },
            "required": [
              "category"
            ]
          },
          "then": {
            "not": {
              "anyOf": [
                {
                  "required": [
                    "runtimeAbiRange"
                  ]
                },
                {
                  "required": [
                    "target"
                  ]
                },
                {
                  "required": [
                    "nativeArtifacts"
                  ]
                }
              ]
            }
          }
        },
        {
          "if": {
            "properties": {
              "category": {
                "enum": [
                  "native",
                  "mixed"
                ]
              }
            },
            "required": [
              "category"
            ]
          },
          "then": {
            "required": [
              "runtimeAbiRange",
              "target",
              "nativeArtifacts"
            ],
            "properties": {
              "nativeArtifacts": {
                "type": "array",
                "items": {
                  "$ref": "#/$defs/nativeArtifact"
                },
                "minItems": 1
              }
            }
          }
        }
      ],
      "additionalProperties": false
    },
    "resourceLockEntry": {
      "type": "object",
      "required": [
        "id",
        "lockEntryId",
        "resourceId",
        "path",
        "checksum"
      ],
      "properties": {
        "id": {
          "type": "string",
          "minLength": 1
        },
        "lockEntryId": {
          "type": "string",
          "minLength": 1
        },
        "resourceId": {
          "$ref": "#/$defs/providedId"
        },
        "path": {
          "$ref": "#/$defs/relativePath"
        },
        "checksum": {
          "$ref": "#/$defs/checksum"
        },
        "evidenceRefs": {
          "type": "array",
          "items": {
            "type": "string",
            "minLength": 1
          },
          "uniqueItems": true
        }
      },
      "additionalProperties": false
    },
    "objectBinding": {
      "type": "object",
      "required": [
        "id",
        "objectText",
        "status"
      ],
      "properties": {
        "id": {
          "type": "string",
          "minLength": 1
        },
        "objectText": {
          "type": "string",
          "minLength": 1
        },
        "status": {
          "enum": [
            "resolved",
            "unresolved",
            "ambiguous",
            "stale",
            "missing"
          ]
        },
        "target": {
          "$ref": "#/$defs/objectBindingTarget"
        },
        "diagnostics": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/objectBindingDiagnostic"
          },
          "default": []
        }
      },
      "allOf": [
        {
          "if": {
            "properties": {
              "status": {
                "const": "resolved"
              }
            },
            "required": [
              "status"
            ]
          },
          "then": {
            "required": [
              "target"
            ]
          }
        },
        {
          "if": {
            "properties": {
              "status": {
                "const": "missing"
              }
            },
            "required": [
              "status"
            ]
          },
          "then": {
            "required": [
              "target",
              "diagnostics"
            ],
            "properties": {
              "diagnostics": {
                "type": "array",
                "items": {
                  "$ref": "#/$defs/objectBindingDiagnostic"
                },
                "minItems": 1,
                "contains": {
                  "type": "object",
                  "properties": {
                    "code": {
                      "const": "binding-target-missing"
                    }
                  },
                  "required": [
                    "code"
                  ]
                }
              }
            }
          }
        },
        {
          "if": {
            "properties": {
              "status": {
                "const": "stale"
              }
            },
            "required": [
              "status"
            ]
          },
          "then": {
            "required": [
              "target",
              "diagnostics"
            ],
            "properties": {
              "diagnostics": {
                "type": "array",
                "items": {
                  "$ref": "#/$defs/objectBindingDiagnostic"
                },
                "minItems": 1,
                "contains": {
                  "type": "object",
                  "properties": {
                    "code": {
                      "enum": [
                        "binding-target-stale",
                        "binding-interface-drift"
                      ]
                    }
                  },
                  "required": [
                    "code"
                  ]
                }
              }
            }
          }
        },
        {
          "if": {
            "properties": {
              "status": {
                "const": "unresolved"
              }
            },
            "required": [
              "status"
            ]
          },
          "then": {
            "required": [
              "diagnostics"
            ],
            "properties": {
              "diagnostics": {
                "type": "array",
                "items": {
                  "$ref": "#/$defs/objectBindingDiagnostic"
                },
                "minItems": 1,
                "contains": {
                  "type": "object",
                  "properties": {
                    "code": {
                      "const": "binding-unresolved"
                    }
                  },
                  "required": [
                    "code"
                  ]
                }
              }
            }
          }
        },
        {
          "if": {
            "properties": {
              "status": {
                "const": "ambiguous"
              }
            },
            "required": [
              "status"
            ]
          },
          "then": {
            "required": [
              "diagnostics"
            ],
            "properties": {
              "diagnostics": {
                "type": "array",
                "items": {
                  "$ref": "#/$defs/objectBindingDiagnostic"
                },
                "minItems": 1,
                "contains": {
                  "type": "object",
                  "properties": {
                    "code": {
                      "const": "binding-ambiguous"
                    }
                  },
                  "required": [
                    "code"
                  ]
                }
              }
            }
          }
        }
      ],
      "additionalProperties": false
    },
    "objectBindingTarget": {
      "oneOf": [
        {
          "$ref": "#/$defs/projectPatchBindingTarget"
        },
        {
          "$ref": "#/$defs/packageProviderBindingTarget"
        }
      ]
    },
    "projectPatchBindingTarget": {
      "type": "object",
      "required": [
        "kind",
        "patchId"
      ],
      "properties": {
        "kind": {
          "const": "projectPatch"
        },
        "patchId": {
          "type": "string",
          "minLength": 1
        },
        "revision": {
          "type": "string",
          "minLength": 1
        },
        "interfaceRevision": {
          "type": "string",
          "minLength": 1
        },
        "interfaceDigest": {
          "$ref": "#/$defs/checksum"
        }
      },
      "additionalProperties": false
    },
    "packageProviderBindingTarget": {
      "type": "object",
      "required": [
        "kind",
        "lockEntryId",
        "packageId",
        "capabilityKind",
        "providedId"
      ],
      "properties": {
        "kind": {
          "const": "packageProvider"
        },
        "lockEntryId": {
          "type": "string",
          "minLength": 1
        },
        "packageId": {
          "$ref": "#/$defs/packageId"
        },
        "capabilityKind": {
          "enum": [
            "patch",
            "node",
            "resource",
            "native-object",
            "codec",
            "help"
          ]
        },
        "providedId": {
          "$ref": "#/$defs/providedId"
        },
        "alias": {
          "type": "string",
          "minLength": 1
        },
        "displayName": {
          "type": "string",
          "minLength": 1
        }
      },
      "additionalProperties": false
    },
    "objectBindingDiagnostic": {
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
            "binding-unresolved",
            "binding-ambiguous",
            "binding-target-missing",
            "binding-target-stale",
            "binding-lock-mismatch",
            "binding-interface-drift"
          ]
        },
        "message": {
          "type": "string",
          "minLength": 1
        },
        "details": {
          "description": "Arbitrary JSON diagnostic metadata."
        }
      },
      "additionalProperties": false
    },
    "targetTriple": {
      "enum": [
        "aarch64-apple-darwin",
        "x86_64-apple-darwin",
        "x86_64-pc-windows-msvc",
        "aarch64-pc-windows-msvc",
        "x86_64-unknown-linux-gnu",
        "aarch64-unknown-linux-gnu"
      ]
    },
    "nativeArtifact": {
      "type": "object",
      "required": [
        "target",
        "path",
        "entrypoint",
        "checksum",
        "evidenceRefs"
      ],
      "properties": {
        "target": {
          "$ref": "#/$defs/targetTriple"
        },
        "path": {
          "$ref": "#/$defs/relativePath"
        },
        "entrypoint": {
          "type": "string",
          "minLength": 1
        },
        "checksum": {
          "$ref": "#/$defs/checksum"
        },
        "evidenceRefs": {
          "type": "array",
          "items": {
            "type": "string",
            "minLength": 1
          },
          "minItems": 1,
          "uniqueItems": true
        }
      },
      "additionalProperties": false
    }
  }
} as const;

export const runtimeSessionLoadRequestV01Schema = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://skenion.dev/schemas/runtime/v0.1/session-load-request.schema.json",
  "title": "skenion Runtime Session Load Request v0.1",
  "description": "Request body for loading a project document into a Runtime session. This wrapper is distinct from a raw ProjectDocumentV01 body so callers must declare load mode and any replacement preconditions.",
  "type": "object",
  "required": [
    "schema",
    "schemaVersion",
    "project",
    "mode"
  ],
  "properties": {
    "schema": {
      "const": "skenion.runtime.session-load-request"
    },
    "schemaVersion": {
      "const": "0.1.0"
    },
    "project": {
      "$ref": "https://skenion.dev/schemas/project/v0.1/project.schema.json"
    },
    "mode": {
      "enum": [
        "loadIfEmpty",
        "replaceIfMatch",
        "forceReplace"
      ]
    },
    "precondition": {
      "$ref": "#/$defs/precondition"
    }
  },
  "additionalProperties": false,
  "allOf": [
    {
      "if": {
        "properties": {
          "mode": {
            "const": "replaceIfMatch"
          }
        },
        "required": [
          "mode"
        ]
      },
      "then": {
        "required": [
          "precondition"
        ]
      }
    }
  ],
  "$defs": {
    "uuid": {
      "type": "string",
      "pattern": "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$"
    },
    "precondition": {
      "type": "object",
      "minProperties": 1,
      "properties": {
        "documentId": {
          "$ref": "#/$defs/uuid"
        },
        "sessionRevision": {
          "type": "string",
          "minLength": 1
        },
        "graphRevision": {
          "type": "string",
          "minLength": 1
        }
      },
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
        "messageKeys": {
          "$ref": "#/$defs/messageKeys"
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
    "messageKeys": {
      "type": "object",
      "required": [
        "accepted"
      ],
      "properties": {
        "accepted": {
          "$ref": "#/$defs/messageKeyList"
        },
        "silent": {
          "$ref": "#/$defs/messageKeyList"
        },
        "trigger": {
          "$ref": "#/$defs/messageKeyList"
        },
        "store": {
          "$ref": "#/$defs/messageKeyList"
        },
        "emit": {
          "$ref": "#/$defs/messageKeyList"
        }
      },
      "additionalProperties": false
    },
    "messageKeyList": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1,
        "pattern": "^[A-Za-z_][A-Za-z0-9_.:-]*$"
      },
      "minItems": 1,
      "uniqueItems": true
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
            "control",
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

export const nodeCatalogV01Schema = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://skenion.dev/schemas/node-catalog/v0.1/node-catalog.schema.json",
  "title": "skenion Node Catalog Snapshot v0.1",
  "type": "object",
  "required": [
    "schema",
    "schemaVersion",
    "catalogRevision",
    "entries",
    "diagnosticNodeDefinitions"
  ],
  "properties": {
    "schema": {
      "const": "skenion.node-catalog.snapshot"
    },
    "schemaVersion": {
      "const": "0.1.0"
    },
    "catalogRevision": {
      "$ref": "#/$defs/checksum"
    },
    "entries": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/entry"
      }
    },
    "diagnosticNodeDefinitions": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/diagnosticNodeDefinition"
      }
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
          "type": "string",
          "pattern": "^[a-f0-9]{64}$"
        }
      },
      "additionalProperties": false
    },
    "display": {
      "type": "object",
      "required": [
        "title"
      ],
      "properties": {
        "title": {
          "type": "string",
          "minLength": 1
        },
        "category": {
          "oneOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ]
        },
        "palette": {
          "oneOf": [
            {
              "enum": [
                "direct",
                "text"
              ]
            },
            {
              "type": "null"
            }
          ]
        },
        "description": {
          "oneOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ]
        },
        "helpId": {
          "oneOf": [
            {
              "type": "string"
            },
            {
              "type": "null"
            }
          ]
        }
      },
      "additionalProperties": false
    },
    "source": {
      "oneOf": [
        {
          "type": "object",
          "required": [
            "kind"
          ],
          "properties": {
            "kind": {
              "const": "core"
            }
          },
          "additionalProperties": false
        },
        {
          "type": "object",
          "required": [
            "kind",
            "patchId",
            "interfaceDigest"
          ],
          "properties": {
            "kind": {
              "const": "projectPatch"
            },
            "patchId": {
              "type": "string"
            },
            "patchRevision": {
              "type": "string",
              "minLength": 1
            },
            "interfaceDigest": {
              "$ref": "#/$defs/checksum"
            }
          },
          "additionalProperties": false
        }
      ]
    },
    "diagnosticTarget": {
      "oneOf": [
        {
          "type": "object",
          "required": [
            "kind"
          ],
          "properties": {
            "kind": {
              "const": "catalog"
            }
          },
          "additionalProperties": false
        },
        {
          "type": "object",
          "required": [
            "kind",
            "catalogId"
          ],
          "properties": {
            "kind": {
              "const": "entry"
            },
            "catalogId": {
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
            "diagnosticId"
          ],
          "properties": {
            "kind": {
              "const": "diagnosticNodeDefinition"
            },
            "diagnosticId": {
              "type": "string",
              "minLength": 1
            }
          },
          "additionalProperties": false
        }
      ]
    },
    "diagnostic": {
      "type": "object",
      "required": [
        "severity",
        "code",
        "message",
        "target"
      ],
      "properties": {
        "severity": {
          "enum": [
            "info",
            "warning",
            "error"
          ]
        },
        "code": {
          "type": "string",
          "minLength": 1
        },
        "message": {
          "type": "string",
          "minLength": 1
        },
        "target": {
          "$ref": "#/$defs/diagnosticTarget"
        },
        "details": true
      },
      "additionalProperties": false
    },
    "entry": {
      "type": "object",
      "required": [
        "catalogId",
        "canonicalObjectText",
        "source",
        "definition",
        "creatable",
        "display"
      ],
      "properties": {
        "catalogId": {
          "type": "string",
          "minLength": 1
        },
        "canonicalObjectText": {
          "type": "string",
          "minLength": 1
        },
        "aliases": {
          "type": "array",
          "items": {
            "type": "string",
            "minLength": 1
          },
          "uniqueItems": true
        },
        "source": {
          "$ref": "#/$defs/source"
        },
        "definition": {
          "$ref": "https://skenion.dev/schemas/node/v0.1/node-definition.schema.json"
        },
        "creatable": {
          "const": true
        },
        "display": {
          "$ref": "#/$defs/display"
        },
        "diagnostics": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/diagnostic"
          }
        }
      },
      "additionalProperties": false
    },
    "diagnosticNodeDefinition": {
      "type": "object",
      "required": [
        "diagnosticId",
        "reason",
        "definition"
      ],
      "properties": {
        "diagnosticId": {
          "type": "string",
          "minLength": 1
        },
        "reason": {
          "const": "unresolvedObject"
        },
        "definition": {
          "$ref": "https://skenion.dev/schemas/node/v0.1/node-definition.schema.json"
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
          "const": "control"
        },
        "dataKind": {
          "enum": [
            "value.core.float32",
            "value.core.int32",
            "value.core.uint32",
            "value.core.bool",
            "value.core.color"
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

export const messageValueV01Schema = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://skenion.dev/schemas/message/v0.1/message-value.schema.json",
  "title": "skenion Message Value v0.1",
  "type": "object",
  "required": [
    "key",
    "atoms"
  ],
  "properties": {
    "key": {
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
                "ufloat64",
                "ufloat32",
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
    "className",
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
    "className": {
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
            "identifier",
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
        "accepts": {
          "$ref": "#/$defs/typeList"
        },
        "activation": {
          "enum": [
            "trigger",
            "latched",
            "passive"
          ]
        },
        "defaultValue": true,
        "messageKeys": {
          "$ref": "#/$defs/messageKeys"
        },
        "description": {
          "type": "string"
        }
      },
      "additionalProperties": false
    },
    "typeList": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1
      },
      "minItems": 1,
      "uniqueItems": true
    },
    "messageKeys": {
      "type": "object",
      "required": [
        "accepted"
      ],
      "properties": {
        "accepted": {
          "$ref": "#/$defs/messageKeyList"
        },
        "silent": {
          "$ref": "#/$defs/messageKeyList"
        },
        "trigger": {
          "$ref": "#/$defs/messageKeyList"
        },
        "store": {
          "$ref": "#/$defs/messageKeyList"
        },
        "emit": {
          "$ref": "#/$defs/messageKeyList"
        }
      },
      "additionalProperties": false
    },
    "messageKeyList": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1,
        "pattern": "^[A-Za-z_][A-Za-z0-9_.:-]*$"
      },
      "minItems": 1,
      "uniqueItems": true
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

export const packageManifestV01Schema = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://skenion.dev/schemas/package/v0.1/package-manifest.schema.json",
  "title": "skenion Package Manifest v0.1",
  "type": "object",
  "required": [
    "schema",
    "schemaVersion",
    "id",
    "version",
    "category",
    "contracts",
    "provides",
    "paths",
    "checksums",
    "evidence"
  ],
  "properties": {
    "schema": {
      "const": "skenion.package.manifest"
    },
    "schemaVersion": {
      "const": "0.1.0"
    },
    "id": {
      "$ref": "#/$defs/packageId"
    },
    "version": {
      "$ref": "#/$defs/semver"
    },
    "displayName": {
      "type": "string",
      "minLength": 1
    },
    "category": {
      "$ref": "#/$defs/packageCategory"
    },
    "contracts": {
      "$ref": "#/$defs/contractsSupport"
    },
    "runtimeAbiRange": {
      "$ref": "#/$defs/semverRange"
    },
    "targets": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/targetTriple"
      },
      "minItems": 1,
      "uniqueItems": true
    },
    "provides": {
      "$ref": "#/$defs/provides"
    },
    "patchLibrary": {
      "type": "array",
      "items": {
        "$ref": "https://skenion.dev/schemas/project/v0.1/project.schema.json#/$defs/patchDefinition"
      },
      "default": []
    },
    "paths": {
      "$ref": "#/$defs/packagePaths"
    },
    "checksums": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/checksumRef"
      },
      "minItems": 1
    },
    "evidence": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/evidenceRef"
      },
      "minItems": 1
    },
    "nativeArtifacts": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/nativeArtifact"
      }
    },
    "diagnostics": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/packageDiagnostic"
      },
      "default": []
    }
  },
  "allOf": [
    {
      "if": {
        "properties": {
          "category": {
            "const": "patch"
          }
        },
        "required": [
          "category"
        ]
      },
      "then": {
        "not": {
          "anyOf": [
            {
              "required": [
                "runtimeAbiRange"
              ]
            },
            {
              "required": [
                "nativeArtifacts"
              ]
            },
            {
              "required": [
                "targets"
              ]
            }
          ]
        }
      }
    },
    {
      "if": {
        "properties": {
          "category": {
            "enum": [
              "native",
              "mixed"
            ]
          }
        },
        "required": [
          "category"
        ]
      },
      "then": {
        "required": [
          "runtimeAbiRange",
          "targets",
          "nativeArtifacts"
        ],
        "properties": {
          "nativeArtifacts": {
            "type": "array",
            "items": {
              "$ref": "#/$defs/nativeArtifact"
            },
            "minItems": 1
          }
        }
      }
    }
  ],
  "additionalProperties": false,
  "$defs": {
    "packageId": {
      "type": "string",
      "pattern": "^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$"
    },
    "providedId": {
      "type": "string",
      "pattern": "^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*$"
    },
    "semver": {
      "type": "string",
      "pattern": "^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z.-]+)?(?:\\+[0-9A-Za-z.-]+)?$"
    },
    "semverRange": {
      "type": "string",
      "pattern": "^>=0\\.[0-9]+\\.[0-9]+ <0\\.[0-9]+\\.[0-9]+$"
    },
    "contractsLine": {
      "type": "string",
      "pattern": "^0\\.[0-9]+$"
    },
    "packageCategory": {
      "enum": [
        "patch",
        "native",
        "mixed"
      ]
    },
    "targetTriple": {
      "enum": [
        "aarch64-apple-darwin",
        "x86_64-apple-darwin",
        "x86_64-pc-windows-msvc",
        "aarch64-pc-windows-msvc",
        "x86_64-unknown-linux-gnu",
        "aarch64-unknown-linux-gnu"
      ]
    },
    "relativePath": {
      "type": "string",
      "minLength": 1,
      "pattern": "^(?!/)(?!.*(?:^|/)\\.\\.(?:/|$))[A-Za-z0-9._~!$&'()+,;=:@%/-]+$"
    },
    "contractsSupport": {
      "type": "object",
      "required": [
        "line",
        "range"
      ],
      "properties": {
        "line": {
          "$ref": "#/$defs/contractsLine"
        },
        "range": {
          "$ref": "#/$defs/semverRange"
        }
      },
      "additionalProperties": false
    },
    "providedRef": {
      "type": "object",
      "required": [
        "id",
        "path"
      ],
      "properties": {
        "id": {
          "$ref": "#/$defs/providedId"
        },
        "path": {
          "$ref": "#/$defs/relativePath"
        },
        "description": {
          "type": "string"
        }
      },
      "additionalProperties": false
    },
    "provides": {
      "type": "object",
      "properties": {
        "patches": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/providedRef"
          },
          "default": []
        },
        "nodes": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/providedRef"
          },
          "default": []
        },
        "resources": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/providedRef"
          },
          "default": []
        },
        "help": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/providedRef"
          },
          "default": []
        }
      },
      "additionalProperties": false
    },
    "packagePaths": {
      "type": "object",
      "properties": {
        "patches": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/relativePath"
          },
          "default": []
        },
        "resources": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/relativePath"
          },
          "default": []
        },
        "docs": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/relativePath"
          },
          "default": []
        },
        "tests": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/relativePath"
          },
          "default": []
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
          "enum": [
            "sha256"
          ]
        },
        "value": {
          "type": "string",
          "pattern": "^[a-fA-F0-9]{64}$"
        }
      },
      "additionalProperties": false
    },
    "checksumRef": {
      "type": "object",
      "required": [
        "id",
        "path",
        "checksum"
      ],
      "properties": {
        "id": {
          "type": "string",
          "minLength": 1
        },
        "path": {
          "$ref": "#/$defs/relativePath"
        },
        "checksum": {
          "$ref": "#/$defs/checksum"
        }
      },
      "additionalProperties": false
    },
    "evidenceRef": {
      "type": "object",
      "required": [
        "id",
        "kind",
        "path",
        "checksum"
      ],
      "properties": {
        "id": {
          "type": "string",
          "minLength": 1
        },
        "kind": {
          "enum": [
            "checksum",
            "signature",
            "sbom",
            "attestation"
          ]
        },
        "path": {
          "$ref": "#/$defs/relativePath"
        },
        "checksum": {
          "$ref": "#/$defs/checksum"
        }
      },
      "additionalProperties": false
    },
    "nativeArtifact": {
      "type": "object",
      "required": [
        "target",
        "path",
        "entrypoint",
        "checksum",
        "evidenceRefs"
      ],
      "properties": {
        "target": {
          "$ref": "#/$defs/targetTriple"
        },
        "path": {
          "$ref": "#/$defs/relativePath"
        },
        "entrypoint": {
          "type": "string",
          "minLength": 1
        },
        "checksum": {
          "$ref": "#/$defs/checksum"
        },
        "evidenceRefs": {
          "type": "array",
          "items": {
            "type": "string",
            "minLength": 1
          },
          "minItems": 1,
          "uniqueItems": true
        }
      },
      "additionalProperties": false
    },
    "packageDiagnostic": {
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
        },
        "details": {
          "description": "Arbitrary JSON diagnostic metadata."
        }
      },
      "additionalProperties": false
    }
  }
} as const;

export const packageListingV01Schema = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://skenion.dev/schemas/package/v0.1/package-listing.schema.json",
  "title": "skenion Package Listing v0.1",
  "description": "Read-only public discovery projection. Project packageId, version, category, contracts, runtimeAbiRange, targetSupport targets, provides, and artifactEvidence from PackageManifestV01 and release artifacts; project displayName when present. Marketplace/discovery metadata owns summary, description, tags, license, homepageUrl, repositoryUrl, discoverySignals, and public visibility diagnostics.",
  "type": "object",
  "required": [
    "schema",
    "schemaVersion",
    "packageId",
    "version",
    "displayName",
    "summary",
    "category",
    "license",
    "contracts",
    "targetSupport",
    "provides",
    "artifactEvidence",
    "discoverySignals",
    "diagnostics"
  ],
  "properties": {
    "schema": {
      "const": "skenion.package.listing"
    },
    "schemaVersion": {
      "const": "0.1.0"
    },
    "packageId": {
      "$ref": "#/$defs/packageId"
    },
    "version": {
      "$ref": "#/$defs/semver"
    },
    "displayName": {
      "type": "string",
      "minLength": 1
    },
    "summary": {
      "type": "string",
      "minLength": 1
    },
    "description": {
      "type": "string"
    },
    "category": {
      "$ref": "#/$defs/packageCategory"
    },
    "tags": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/packageTag"
      },
      "uniqueItems": true,
      "default": []
    },
    "license": {
      "type": "string",
      "minLength": 1
    },
    "homepageUrl": {
      "$ref": "#/$defs/httpUrl"
    },
    "repositoryUrl": {
      "$ref": "#/$defs/httpUrl"
    },
    "contracts": {
      "$ref": "#/$defs/contractsSupport"
    },
    "runtimeAbiRange": {
      "$ref": "#/$defs/semverRange"
    },
    "targetSupport": {
      "$ref": "#/$defs/targetSupportSummary"
    },
    "provides": {
      "$ref": "#/$defs/providesSummary"
    },
    "artifactEvidence": {
      "$ref": "#/$defs/artifactEvidenceSummary"
    },
    "discoverySignals": {
      "$ref": "#/$defs/discoverySignals"
    },
    "diagnostics": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/packageListingDiagnostic"
      },
      "default": []
    }
  },
  "allOf": [
    {
      "if": {
        "properties": {
          "category": {
            "const": "patch"
          }
        },
        "required": [
          "category"
        ]
      },
      "then": {
        "not": {
          "required": [
            "runtimeAbiRange"
          ]
        },
        "properties": {
          "targetSupport": {
            "type": "object",
            "properties": {
              "kind": {
                "const": "target-independent"
              }
            }
          }
        }
      }
    },
    {
      "if": {
        "properties": {
          "category": {
            "enum": [
              "native",
              "mixed"
            ]
          }
        },
        "required": [
          "category"
        ]
      },
      "then": {
        "required": [
          "runtimeAbiRange"
        ],
        "properties": {
          "targetSupport": {
            "type": "object",
            "properties": {
              "kind": {
                "enum": [
                  "targeted",
                  "unavailable"
                ]
              }
            }
          },
          "artifactEvidence": {
            "type": "object",
            "properties": {
              "artifacts": {
                "type": "array",
                "contains": {
                  "type": "object",
                  "required": [
                    "kind"
                  ],
                  "properties": {
                    "kind": {
                      "const": "native-artifact"
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    {
      "properties": {
        "artifactEvidence": {
          "type": "object",
          "properties": {
            "artifacts": {
              "type": "array",
              "contains": {
                "type": "object",
                "required": [
                  "kind"
                ],
                "properties": {
                  "kind": {
                    "const": "manifest"
                  }
                }
              }
            }
          }
        }
      }
    }
  ],
  "additionalProperties": false,
  "$defs": {
    "packageId": {
      "type": "string",
      "pattern": "^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$"
    },
    "providedId": {
      "type": "string",
      "pattern": "^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*$"
    },
    "semver": {
      "type": "string",
      "pattern": "^(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)\\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z.-]+)?(?:\\+[0-9A-Za-z.-]+)?$"
    },
    "semverRange": {
      "type": "string",
      "pattern": "^>=0\\.[0-9]+\\.[0-9]+ <0\\.[0-9]+\\.[0-9]+$"
    },
    "contractsLine": {
      "type": "string",
      "pattern": "^0\\.[0-9]+$"
    },
    "packageCategory": {
      "enum": [
        "patch",
        "native",
        "mixed"
      ]
    },
    "packageTag": {
      "type": "string",
      "pattern": "^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$"
    },
    "targetTriple": {
      "enum": [
        "aarch64-apple-darwin",
        "x86_64-apple-darwin",
        "x86_64-pc-windows-msvc",
        "aarch64-pc-windows-msvc",
        "x86_64-unknown-linux-gnu",
        "aarch64-unknown-linux-gnu"
      ]
    },
    "relativePath": {
      "type": "string",
      "minLength": 1,
      "pattern": "^(?!/)(?!.*(?:^|/)\\.\\.(?:/|$))[A-Za-z0-9._~!$&'()+,;=:@%/-]+$"
    },
    "httpUrl": {
      "type": "string",
      "pattern": "^https?://[^\\s]+$"
    },
    "contractsSupport": {
      "type": "object",
      "required": [
        "line",
        "range"
      ],
      "properties": {
        "line": {
          "$ref": "#/$defs/contractsLine"
        },
        "range": {
          "$ref": "#/$defs/semverRange"
        }
      },
      "additionalProperties": false
    },
    "targetSupportSummary": {
      "type": "object",
      "required": [
        "kind"
      ],
      "properties": {
        "kind": {
          "enum": [
            "target-independent",
            "targeted",
            "unavailable"
          ]
        },
        "targets": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/targetTriple"
          },
          "minItems": 1,
          "uniqueItems": true
        },
        "summary": {
          "type": "string"
        }
      },
      "allOf": [
        {
          "if": {
            "properties": {
              "kind": {
                "const": "target-independent"
              }
            },
            "required": [
              "kind"
            ]
          },
          "then": {
            "not": {
              "required": [
                "targets"
              ]
            }
          }
        },
        {
          "if": {
            "properties": {
              "kind": {
                "const": "targeted"
              }
            },
            "required": [
              "kind"
            ]
          },
          "then": {
            "required": [
              "targets"
            ]
          }
        }
      ],
      "additionalProperties": false
    },
    "providedSummaryRef": {
      "type": "object",
      "required": [
        "id"
      ],
      "properties": {
        "id": {
          "$ref": "#/$defs/providedId"
        },
        "description": {
          "type": "string"
        }
      },
      "additionalProperties": false
    },
    "providesSummary": {
      "type": "object",
      "properties": {
        "patches": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/providedSummaryRef"
          },
          "default": []
        },
        "nodes": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/providedSummaryRef"
          },
          "default": []
        },
        "resources": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/providedSummaryRef"
          },
          "default": []
        },
        "help": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/providedSummaryRef"
          },
          "default": []
        },
        "nativeObjects": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/providedSummaryRef"
          },
          "default": []
        },
        "codecs": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/providedSummaryRef"
          },
          "default": []
        },
        "capabilities": {
          "type": "array",
          "items": {
            "type": "string",
            "minLength": 1
          },
          "uniqueItems": true,
          "default": []
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
          "enum": [
            "sha256"
          ]
        },
        "value": {
          "type": "string",
          "pattern": "^[a-fA-F0-9]{64}$"
        }
      },
      "additionalProperties": false
    },
    "artifactSummary": {
      "type": "object",
      "required": [
        "kind",
        "path",
        "checksum",
        "evidenceRefs"
      ],
      "properties": {
        "kind": {
          "enum": [
            "manifest",
            "package-archive",
            "native-artifact"
          ]
        },
        "target": {
          "$ref": "#/$defs/targetTriple"
        },
        "path": {
          "$ref": "#/$defs/relativePath"
        },
        "checksum": {
          "$ref": "#/$defs/checksum"
        },
        "evidenceRefs": {
          "type": "array",
          "items": {
            "type": "string",
            "minLength": 1
          },
          "minItems": 1,
          "uniqueItems": true
        }
      },
      "allOf": [
        {
          "if": {
            "properties": {
              "kind": {
                "const": "native-artifact"
              }
            },
            "required": [
              "kind"
            ]
          },
          "then": {
            "required": [
              "target"
            ]
          }
        }
      ],
      "additionalProperties": false
    },
    "evidenceSummary": {
      "type": "object",
      "required": [
        "id",
        "kind",
        "path",
        "checksum"
      ],
      "properties": {
        "id": {
          "type": "string",
          "minLength": 1
        },
        "kind": {
          "enum": [
            "checksum",
            "signature",
            "sbom",
            "attestation"
          ]
        },
        "path": {
          "$ref": "#/$defs/relativePath"
        },
        "checksum": {
          "$ref": "#/$defs/checksum"
        }
      },
      "additionalProperties": false
    },
    "artifactEvidenceSummary": {
      "type": "object",
      "required": [
        "artifacts",
        "evidence"
      ],
      "properties": {
        "artifacts": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/artifactSummary"
          },
          "minItems": 1
        },
        "evidence": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/evidenceSummary"
          },
          "minItems": 1
        }
      },
      "additionalProperties": false
    },
    "discoverySignals": {
      "type": "object",
      "required": [
        "stargazerCount",
        "rankingScore"
      ],
      "properties": {
        "stargazerCount": {
          "type": "integer",
          "minimum": 0,
          "readOnly": true
        },
        "rankingScore": {
          "type": "number",
          "minimum": 0,
          "readOnly": true
        }
      },
      "additionalProperties": false
    },
    "packageListingDiagnosticCode": {
      "enum": [
        "malformed-listing-metadata",
        "unsupported-contracts-range",
        "missing-artifact",
        "unavailable-target",
        "quarantined-package",
        "hidden-package"
      ]
    },
    "packageListingDiagnostic": {
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
          "$ref": "#/$defs/packageListingDiagnosticCode"
        },
        "message": {
          "type": "string",
          "minLength": 1
        },
        "details": {
          "description": "Arbitrary JSON diagnostic metadata."
        }
      },
      "additionalProperties": false
    }
  }
} as const;

export const packageDiscoveryV01Schema = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://skenion.dev/schemas/package/v0.1/package-discovery.schema.json",
  "title": "skenion Package Discovery Response v0.1",
  "type": "object",
  "required": [
    "schema",
    "schemaVersion",
    "ok",
    "listings",
    "diagnostics"
  ],
  "properties": {
    "schema": {
      "const": "skenion.package.discovery"
    },
    "schemaVersion": {
      "const": "0.1.0"
    },
    "ok": {
      "type": "boolean"
    },
    "listings": {
      "type": "array",
      "items": {
        "$ref": "https://skenion.dev/schemas/package/v0.1/package-listing.schema.json"
      }
    },
    "diagnostics": {
      "type": "array",
      "items": {
        "$ref": "https://skenion.dev/schemas/package/v0.1/package-listing.schema.json#/$defs/packageListingDiagnostic"
      }
    }
  },
  "additionalProperties": false
} as const;

export const packageInstallPlanRequestV01Schema = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://skenion.dev/schemas/package/v0.1/package-install-plan-request.schema.json",
  "title": "skenion Package Install/Update Plan Request v0.1",
  "description": "Declarative package install/update planning input. It references current project package lock and object binding state, desired package version/range, candidate listing/manifest evidence, and the Runtime host target. It does not request filesystem mutation, registry writes, or Runtime native loading.",
  "type": "object",
  "required": [
    "schema",
    "schemaVersion",
    "requestId",
    "intent",
    "packageId",
    "desired",
    "target",
    "current",
    "candidates"
  ],
  "properties": {
    "schema": {
      "const": "skenion.package.install-plan.request"
    },
    "schemaVersion": {
      "const": "0.1.0"
    },
    "requestId": {
      "type": "string",
      "minLength": 1
    },
    "intent": {
      "$ref": "#/$defs/packageInstallPlanIntent"
    },
    "packageId": {
      "$ref": "https://skenion.dev/schemas/package/v0.1/package-listing.schema.json#/$defs/packageId"
    },
    "desired": {
      "$ref": "#/$defs/packageInstallPlanDesired"
    },
    "target": {
      "$ref": "#/$defs/packageInstallPlanTarget"
    },
    "current": {
      "$ref": "#/$defs/packageInstallPlanCurrentState"
    },
    "candidates": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/packageInstallPlanCandidate"
      },
      "minItems": 1
    },
    "rollbackCandidates": {
      "type": "array",
      "items": {
        "$ref": "https://skenion.dev/schemas/project/v0.1/project.schema.json#/$defs/packageLockEntry"
      },
      "default": []
    }
  },
  "allOf": [
    {
      "if": {
        "properties": {
          "intent": {
            "const": "update"
          }
        },
        "required": [
          "intent"
        ]
      },
      "then": {
        "properties": {
          "current": {
            "type": "object",
            "required": [
              "installedLockEntryId"
            ]
          }
        }
      }
    }
  ],
  "additionalProperties": false,
  "$defs": {
    "packageInstallPlanIntent": {
      "enum": [
        "install",
        "update"
      ]
    },
    "packageInstallPlanDesired": {
      "type": "object",
      "anyOf": [
        {
          "required": [
            "version"
          ]
        },
        {
          "required": [
            "versionRange"
          ]
        }
      ],
      "properties": {
        "version": {
          "$ref": "https://skenion.dev/schemas/package/v0.1/package-listing.schema.json#/$defs/semver"
        },
        "versionRange": {
          "$ref": "https://skenion.dev/schemas/package/v0.1/package-listing.schema.json#/$defs/semverRange"
        }
      },
      "additionalProperties": false
    },
    "packageInstallPlanTargetOs": {
      "enum": [
        "macos",
        "windows",
        "linux"
      ]
    },
    "packageInstallPlanTargetArch": {
      "enum": [
        "aarch64",
        "x86_64"
      ]
    },
    "packageInstallPlanTarget": {
      "type": "object",
      "required": [
        "os",
        "arch",
        "triple",
        "contracts"
      ],
      "properties": {
        "os": {
          "$ref": "#/$defs/packageInstallPlanTargetOs"
        },
        "arch": {
          "$ref": "#/$defs/packageInstallPlanTargetArch"
        },
        "triple": {
          "$ref": "https://skenion.dev/schemas/package/v0.1/package-listing.schema.json#/$defs/targetTriple"
        },
        "contracts": {
          "$ref": "https://skenion.dev/schemas/package/v0.1/package-listing.schema.json#/$defs/contractsSupport"
        },
        "runtimeAbiRange": {
          "$ref": "https://skenion.dev/schemas/package/v0.1/package-listing.schema.json#/$defs/semverRange"
        }
      },
      "additionalProperties": false
    },
    "packageInstallPlanCurrentState": {
      "type": "object",
      "required": [
        "packageLock",
        "objectBindings"
      ],
      "properties": {
        "packageLock": {
          "type": "array",
          "items": {
            "$ref": "https://skenion.dev/schemas/project/v0.1/project.schema.json#/$defs/packageLockEntry"
          },
          "default": []
        },
        "objectBindings": {
          "type": "array",
          "items": {
            "$ref": "https://skenion.dev/schemas/project/v0.1/project.schema.json#/$defs/objectBinding"
          },
          "default": []
        },
        "installedLockEntryId": {
          "type": "string",
          "minLength": 1
        }
      },
      "additionalProperties": false
    },
    "packageInstallPlanCandidate": {
      "type": "object",
      "required": [
        "listing"
      ],
      "properties": {
        "listing": {
          "$ref": "https://skenion.dev/schemas/package/v0.1/package-listing.schema.json"
        },
        "manifest": {
          "$ref": "https://skenion.dev/schemas/package/v0.1/package-manifest.schema.json"
        }
      },
      "additionalProperties": false
    }
  }
} as const;

export const packageInstallPlanResponseV01Schema = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://skenion.dev/schemas/package/v0.1/package-install-plan-response.schema.json",
  "title": "skenion Package Install/Update Plan Response v0.1",
  "description": "Declarative package install/update planning output. It can express a safe no-op, ordered install/update actions, rollback actions, and fail-closed rejection with structured diagnostics. Actions are planning records only; Runtime filesystem mutation and registry writes are intentionally out of scope.",
  "type": "object",
  "required": [
    "schema",
    "schemaVersion",
    "requestId",
    "ok",
    "packageId",
    "target",
    "checks",
    "actions",
    "diagnostics"
  ],
  "properties": {
    "schema": {
      "const": "skenion.package.install-plan.response"
    },
    "schemaVersion": {
      "const": "0.1.0"
    },
    "requestId": {
      "type": "string",
      "minLength": 1
    },
    "ok": {
      "type": "boolean"
    },
    "packageId": {
      "$ref": "https://skenion.dev/schemas/package/v0.1/package-listing.schema.json#/$defs/packageId"
    },
    "selectedVersion": {
      "$ref": "https://skenion.dev/schemas/package/v0.1/package-listing.schema.json#/$defs/semver"
    },
    "target": {
      "$ref": "https://skenion.dev/schemas/package/v0.1/package-install-plan-request.schema.json#/$defs/packageInstallPlanTarget"
    },
    "checks": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/packageInstallPlanCheck"
      },
      "minItems": 1
    },
    "actions": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/packageInstallPlanAction"
      }
    },
    "diagnostics": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/packageInstallPlanDiagnostic"
      }
    }
  },
  "allOf": [
    {
      "if": {
        "properties": {
          "ok": {
            "const": false
          }
        },
        "required": [
          "ok"
        ]
      },
      "then": {
        "properties": {
          "actions": {
            "type": "array",
            "contains": {
              "type": "object",
              "required": [
                "kind"
              ],
              "properties": {
                "kind": {
                  "const": "reject"
                }
              }
            }
          },
          "diagnostics": {
            "type": "array",
            "minItems": 1,
            "contains": {
              "type": "object",
              "required": [
                "severity"
              ],
              "properties": {
                "severity": {
                  "const": "error"
                }
              }
            }
          }
        }
      }
    },
    {
      "if": {
        "properties": {
          "ok": {
            "const": true
          }
        },
        "required": [
          "ok"
        ]
      },
      "then": {
        "properties": {
          "checks": {
            "type": "array",
            "not": {
              "contains": {
                "type": "object",
                "required": [
                  "status"
                ],
                "properties": {
                  "status": {
                    "const": "fail"
                  }
                }
              }
            }
          },
          "actions": {
            "type": "array",
            "not": {
              "contains": {
                "type": "object",
                "required": [
                  "kind"
                ],
                "properties": {
                  "kind": {
                    "const": "reject"
                  }
                }
              }
            }
          }
        }
      }
    }
  ],
  "additionalProperties": false,
  "$defs": {
    "diagnosticRefArray": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1
      },
      "minItems": 1,
      "uniqueItems": true
    },
    "packageInstallPlanCheckKind": {
      "enum": [
        "contracts-line",
        "runtime-abi",
        "target-triple",
        "checksum",
        "provenance",
        "capability-change",
        "lock-state"
      ]
    },
    "packageInstallPlanCheckStatus": {
      "enum": [
        "pass",
        "warning",
        "fail",
        "skipped"
      ]
    },
    "packageInstallPlanCheck": {
      "type": "object",
      "required": [
        "kind",
        "status"
      ],
      "properties": {
        "kind": {
          "$ref": "#/$defs/packageInstallPlanCheckKind"
        },
        "status": {
          "$ref": "#/$defs/packageInstallPlanCheckStatus"
        },
        "diagnosticRefs": {
          "$ref": "#/$defs/diagnosticRefArray"
        },
        "message": {
          "type": "string",
          "minLength": 1
        }
      },
      "allOf": [
        {
          "if": {
            "properties": {
              "status": {
                "const": "fail"
              }
            },
            "required": [
              "status"
            ]
          },
          "then": {
            "required": [
              "diagnosticRefs"
            ]
          }
        }
      ],
      "additionalProperties": false
    },
    "packageInstallPlanActionKind": {
      "enum": [
        "download",
        "verify",
        "stage",
        "replace",
        "disable",
        "rollback",
        "keep",
        "reject"
      ]
    },
    "packageInstallPlanCapabilityChangeKind": {
      "enum": [
        "add",
        "remove",
        "keep"
      ]
    },
    "packageInstallPlanCapabilityKind": {
      "enum": [
        "patch",
        "node",
        "resource",
        "native-object",
        "codec",
        "help",
        "capability"
      ]
    },
    "packageInstallPlanCapabilityChange": {
      "type": "object",
      "required": [
        "kind",
        "capabilityKind",
        "id"
      ],
      "properties": {
        "kind": {
          "$ref": "#/$defs/packageInstallPlanCapabilityChangeKind"
        },
        "capabilityKind": {
          "$ref": "#/$defs/packageInstallPlanCapabilityKind"
        },
        "id": {
          "type": "string",
          "minLength": 1
        },
        "diagnosticRef": {
          "type": "string",
          "minLength": 1
        }
      },
      "additionalProperties": false
    },
    "packageInstallPlanAction": {
      "type": "object",
      "required": [
        "id",
        "order",
        "kind",
        "packageId"
      ],
      "properties": {
        "id": {
          "type": "string",
          "minLength": 1
        },
        "order": {
          "type": "integer",
          "minimum": 0
        },
        "kind": {
          "$ref": "#/$defs/packageInstallPlanActionKind"
        },
        "packageId": {
          "$ref": "https://skenion.dev/schemas/package/v0.1/package-listing.schema.json#/$defs/packageId"
        },
        "version": {
          "$ref": "https://skenion.dev/schemas/package/v0.1/package-listing.schema.json#/$defs/semver"
        },
        "lockEntryId": {
          "type": "string",
          "minLength": 1
        },
        "toLockEntryId": {
          "type": "string",
          "minLength": 1
        },
        "rollbackLockEntryId": {
          "type": "string",
          "minLength": 1
        },
        "target": {
          "$ref": "https://skenion.dev/schemas/package/v0.1/package-listing.schema.json#/$defs/targetTriple"
        },
        "artifact": {
          "$ref": "https://skenion.dev/schemas/package/v0.1/package-listing.schema.json#/$defs/artifactSummary"
        },
        "checksum": {
          "$ref": "https://skenion.dev/schemas/package/v0.1/package-listing.schema.json#/$defs/checksum"
        },
        "evidenceRefs": {
          "$ref": "#/$defs/diagnosticRefArray"
        },
        "capabilityChanges": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/packageInstallPlanCapabilityChange"
          },
          "default": []
        },
        "diagnosticRefs": {
          "$ref": "#/$defs/diagnosticRefArray"
        },
        "reason": {
          "type": "string",
          "minLength": 1
        }
      },
      "allOf": [
        {
          "if": {
            "properties": {
              "kind": {
                "enum": [
                  "download",
                  "verify"
                ]
              }
            },
            "required": [
              "kind"
            ]
          },
          "then": {
            "required": [
              "version",
              "artifact",
              "evidenceRefs"
            ]
          }
        },
        {
          "if": {
            "properties": {
              "kind": {
                "const": "stage"
              }
            },
            "required": [
              "kind"
            ]
          },
          "then": {
            "required": [
              "version"
            ]
          }
        },
        {
          "if": {
            "properties": {
              "kind": {
                "const": "replace"
              }
            },
            "required": [
              "kind"
            ]
          },
          "then": {
            "required": [
              "version",
              "lockEntryId",
              "toLockEntryId"
            ]
          }
        },
        {
          "if": {
            "properties": {
              "kind": {
                "enum": [
                  "disable",
                  "keep"
                ]
              }
            },
            "required": [
              "kind"
            ]
          },
          "then": {
            "required": [
              "lockEntryId"
            ]
          }
        },
        {
          "if": {
            "properties": {
              "kind": {
                "const": "rollback"
              }
            },
            "required": [
              "kind"
            ]
          },
          "then": {
            "required": [
              "lockEntryId",
              "rollbackLockEntryId"
            ]
          }
        },
        {
          "if": {
            "properties": {
              "kind": {
                "const": "reject"
              }
            },
            "required": [
              "kind"
            ]
          },
          "then": {
            "required": [
              "diagnosticRefs"
            ]
          }
        }
      ],
      "additionalProperties": false
    },
    "packageInstallPlanDiagnosticCode": {
      "enum": [
        "incompatible-contracts-line",
        "incompatible-runtime-abi",
        "unsupported-target",
        "missing-artifact",
        "checksum-mismatch",
        "missing-provenance-evidence",
        "missing-lock-entry",
        "ambiguous-package-id",
        "stale-installed-lock",
        "removed-capability",
        "rollback-unavailable"
      ]
    },
    "packageInstallPlanDiagnostic": {
      "type": "object",
      "required": [
        "id",
        "severity",
        "code",
        "message"
      ],
      "properties": {
        "id": {
          "type": "string",
          "minLength": 1
        },
        "severity": {
          "enum": [
            "error",
            "warning",
            "info"
          ]
        },
        "code": {
          "$ref": "#/$defs/packageInstallPlanDiagnosticCode"
        },
        "message": {
          "type": "string",
          "minLength": 1
        },
        "details": {
          "description": "Arbitrary JSON diagnostic metadata."
        }
      },
      "additionalProperties": false
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
    "components"
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
    "components": {
      "$ref": "#/$defs/components"
    }
  },
  "additionalProperties": false,
  "$defs": {
    "version": {
      "type": "string",
      "pattern": "^[0-9]+\\.[0-9]+\\.[0-9]+$"
    },
    "packageEcosystem": {
      "enum": [
        "npm",
        "crates.io"
      ]
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
          "$ref": "#/$defs/packageEcosystem"
        },
        "name": {
          "type": "string",
          "minLength": 1
        },
        "version": {
          "$ref": "#/$defs/version"
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
    "components": {
      "type": "object",
      "required": [
        "contracts",
        "runtime",
        "sdk",
        "studio"
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
            "version"
          ],
          "properties": {
            "version": {
              "$ref": "#/$defs/version"
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
            "version"
          ],
          "properties": {
            "version": {
              "$ref": "#/$defs/version"
            }
          },
          "additionalProperties": false
        }
      },
      "additionalProperties": false
    }
  }
} as const;
