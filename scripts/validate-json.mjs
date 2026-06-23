import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import Ajv2020 from "ajv/dist/2020.js";

const allowedNodePermissions = new Set();

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else {
      files.push(fullPath);
    }
  }

  return files.sort();
}

async function readJson(file) {
  return JSON.parse(await readFile(file, "utf8"));
}

function fail(file, message) {
  throw new Error(`${file}: ${message}`);
}

function requireString(file, value, label) {
  if (typeof value !== "string" || value.length === 0) {
    fail(file, `${label} must be a non-empty string`);
  }
}

function duplicateCheck(file, values, label) {
  const seen = new Set();
  for (const value of values) {
    if (seen.has(value)) {
      fail(file, `duplicate ${label}: ${value}`);
    }
    seen.add(value);
  }
}

function assertSameSet(file, actualValues, expectedValues, label) {
  const actual = new Set(actualValues);
  const expected = new Set(expectedValues);
  const missing = [...expected].filter((value) => !actual.has(value));
  const extra = [...actual].filter((value) => !expected.has(value));
  if (missing.length > 0 || extra.length > 0) {
    fail(
      file,
      `${label} mismatch: missing [${missing.join(", ")}], extra [${extra.join(", ")}]`
    );
  }
}

function validateViewStateNodeReferences(file, graph, viewState, label = "viewState") {
  const graphNodeIds = new Set(graph.nodes.map((node) => node.id));
  for (const nodeId of Object.keys(viewState.canvas.nodes)) {
    if (!graphNodeIds.has(nodeId)) {
      fail(file, `${label} references missing graph node: ${nodeId}`);
    }
  }
}

function boundaryStringParam(node, key) {
  const value = node.params?.[key];
  if (typeof value === "string" && value.length > 0) {
    return value;
  }
  return undefined;
}

function boundaryPortId(node, port, eligiblePortCount) {
  return (
    boundaryStringParam(node, "portId") ??
    boundaryStringParam(node, "externalPortId") ??
    (eligiblePortCount === 1 ? node.id : port.id)
  );
}

function derivedPatchBoundaryPortIds(patch) {
  const portIds = [];

  for (const node of patch.graph.nodes) {
    if (node.kind === "core.inlet") {
      const ports = node.ports.filter((port) => port.direction === "output");
      for (const port of ports) {
        portIds.push(boundaryPortId(node, port, ports.length));
      }
    } else if (node.kind === "core.outlet") {
      const ports = node.ports.filter((port) => port.direction === "input");
      for (const port of ports) {
        portIds.push(boundaryPortId(node, port, ports.length));
      }
    }
  }

  return portIds;
}

function validatePatchDefinitionV01Semantics(file, patch) {
  validateGraphV01Semantics(file, patch.graph);

  if (patch.viewState) {
    validateViewStateNodeReferences(file, patch.graph, patch.viewState, `patch ${patch.id} viewState`);
  }

  duplicateCheck(file, derivedPatchBoundaryPortIds(patch), `boundary port id on patch ${patch.id}`);
}

function validateProjectV01Semantics(file, project) {
  validateGraphV01Semantics(file, project.graph);
  validateViewStateNodeReferences(file, project.graph, project.viewState);
  duplicateCheck(
    file,
    project.patchLibrary.map((patch) => patch.id),
    "patch id"
  );

  for (const patch of project.patchLibrary) {
    validatePatchDefinitionV01Semantics(file, patch);
  }
}

function portSpecKey(nodeId, portId) {
  return `${nodeId}:${portId}`;
}

function edgeEndpointKey(edge) {
  return `${edge.source.nodeId}:${edge.source.portId}->${edge.target.nodeId}:${edge.target.portId}`;
}

function edgeEnabled(edge) {
  return edge.enabled !== false;
}

function v01ControlMessagePortType(type) {
  return [
    "message.any",
    "event.bang",
    "number.float",
    "number.int",
    "number.uint",
    "boolean",
    "color",
    "string"
  ].includes(type);
}

function portTypeAccepts(source, target) {
  if (target.type === "message.any" && v01ControlMessagePortType(source.type)) {
    return true;
  }
  return source.type === target.type || target.accepts?.includes(source.type) === true;
}

function inputMaxConnections(port) {
  if (port.direction === "output") {
    return Number.POSITIVE_INFINITY;
  }
  if (port.maxConnections === null) {
    return Number.POSITIVE_INFINITY;
  }
  return port.maxConnections ?? 1;
}

function mergePolicy(port) {
  return port.mergePolicy ?? "forbid";
}

function typeFamily(type) {
  return type.split(".")[0] ?? type;
}

function controlCycleTypes(edges, ports) {
  return edges.every((edge) => {
    const source = ports.get(portSpecKey(edge.source.nodeId, edge.source.portId));
    const target = ports.get(portSpecKey(edge.target.nodeId, edge.target.portId));
    const sourceFamily = source ? typeFamily(source.type) : "";
    const targetFamily = target ? typeFamily(target.type) : "";
    return (
      (sourceFamily === "value" || sourceFamily === "control") &&
      (targetFamily === "value" || targetFamily === "control")
    );
  });
}

function stronglyConnectedComponents(nodes, edges) {
  const outgoing = new Map(nodes.map((node) => [node, []]));
  for (const edge of edges.filter(edgeEnabled)) {
    outgoing.get(edge.source.nodeId)?.push(edge.target.nodeId);
  }

  let nextIndex = 0;
  const stack = [];
  const onStack = new Set();
  const index = new Map();
  const low = new Map();
  const components = [];

  function visit(node) {
    index.set(node, nextIndex);
    low.set(node, nextIndex);
    nextIndex += 1;
    stack.push(node);
    onStack.add(node);

    for (const target of outgoing.get(node) ?? []) {
      if (!index.has(target)) {
        visit(target);
        low.set(node, Math.min(low.get(node), low.get(target)));
      } else if (onStack.has(target)) {
        low.set(node, Math.min(low.get(node), index.get(target)));
      }
    }

    if (low.get(node) === index.get(node)) {
      const component = [];
      let current;
      do {
        current = stack.pop();
        onStack.delete(current);
        component.push(current);
      } while (current !== node);
      components.push(component.sort());
    }
  }

  for (const node of nodes) {
    if (!index.has(node)) {
      visit(node);
    }
  }

  return components;
}

function cycleEdgesFor(component, edges) {
  const nodes = new Set(component);
  return edges.filter((edge) => (
    edgeEnabled(edge) &&
    nodes.has(edge.source.nodeId) &&
    nodes.has(edge.target.nodeId) &&
    (component.length > 1 || edge.source.nodeId === edge.target.nodeId)
  ));
}

function validateGraphV01Semantics(file, graph) {
  duplicateCheck(
    file,
    graph.nodes.map((node) => node.id),
    "node id"
  );

  const ports = new Map();
  const incoming = new Map();
  const outgoing = new Map();
  for (const node of graph.nodes) {
    duplicateCheck(
      file,
      node.ports.map((port) => port.id),
      `port id on ${node.id}`
    );
    for (const group of node.portGroups ?? []) {
      if (group.maxPorts !== undefined && group.maxPorts < group.minPorts) {
        fail(file, `port group ${node.id}.${group.id} maxPorts is less than minPorts`);
      }
    }
    for (const port of node.ports) {
      const key = portSpecKey(node.id, port.id);
      ports.set(key, port);
      incoming.set(key, []);
      outgoing.set(key, []);
    }
  }

  duplicateCheck(
    file,
    graph.edges.map((edge) => edge.id),
    "edge id"
  );
  const edgeKeys = new Set();
  for (const edge of graph.edges) {
    const exactKey = edgeEndpointKey(edge);
    if (edgeKeys.has(exactKey)) {
      fail(file, `duplicate edge endpoints: ${exactKey}`);
    }
    edgeKeys.add(exactKey);

    const sourceKey = portSpecKey(edge.source.nodeId, edge.source.portId);
    const targetKey = portSpecKey(edge.target.nodeId, edge.target.portId);
    const source = ports.get(sourceKey);
    const target = ports.get(targetKey);
    if (!source) {
      fail(file, `edge ${edge.id} references missing source port ${sourceKey}`);
    }
    if (!target) {
      fail(file, `edge ${edge.id} references missing target port ${targetKey}`);
    }
    if (source.direction !== "output") {
      fail(file, `edge ${edge.id} source ${sourceKey} is not an output port`);
    }
    if (target.direction !== "input") {
      fail(file, `edge ${edge.id} target ${targetKey} is not an input port`);
    }
    if (!portTypeAccepts(source, target)) {
      fail(file, `edge ${edge.id} cannot connect ${sourceKey} ${source.type} to ${targetKey} ${target.type}`);
    }
    if (edgeEnabled(edge)) {
      incoming.get(targetKey).push(edge);
      outgoing.get(sourceKey).push(edge);
    }
  }

  for (const [key, connectedEdges] of incoming) {
    const port = ports.get(key);
    if (port.direction !== "input") {
      continue;
    }
    const minimum = port.required === true ? Math.max(port.minConnections ?? 0, 1) : port.minConnections ?? 0;
    if (connectedEdges.length < minimum) {
      fail(file, `input ${key} requires at least ${minimum} connection(s)`);
    }
    if (connectedEdges.length > inputMaxConnections(port)) {
      fail(file, `input ${key} accepts at most ${port.maxConnections ?? 1} connection(s)`);
    }
    if (connectedEdges.length > 1 && mergePolicy(port) === "forbid") {
      fail(file, `input ${key} has fan-in but mergePolicy is forbid`);
    }
  }

  for (const [key, connectedEdges] of outgoing) {
    const port = ports.get(key);
    if (port.direction === "output" && connectedEdges.length > 1 && port.fanOutPolicy === "forbid") {
      fail(file, `output ${key} forbids fan-out`);
    }
  }

  const nodes = graph.nodes.map((node) => node.id).sort();
  for (const component of stronglyConnectedComponents(nodes, graph.edges)) {
    const cycleEdges = cycleEdgesFor(component, graph.edges);
    if (cycleEdges.length === 0) {
      continue;
    }
    const feedback = cycleEdges.find((edge) => edge.feedback?.enabled === true);
    if (!feedback && controlCycleTypes(cycleEdges, ports)) {
      fail(file, "ambiguous-algebraic-loop: control/value cycle requires explicit latch, delay, or feedback policy");
    }
    if (!feedback) {
      fail(file, "invalid-cycle: cycle requires explicit feedback policy");
    }
  }
}

function validateGraphFragmentV01Semantics(file, fragment) {
  duplicateCheck(
    file,
    fragment.nodes.map((node) => node.id),
    "node id"
  );

  const nodeIds = new Set(fragment.nodes.map((node) => node.id));
  const ports = new Map();
  for (const node of fragment.nodes) {
    duplicateCheck(
      file,
      node.ports.map((port) => port.id),
      `port id on ${node.id}`
    );
    for (const port of node.ports) {
      ports.set(portSpecKey(node.id, port.id), port);
    }
  }

  duplicateCheck(
    file,
    fragment.edges.map((edge) => edge.id),
    "edge id"
  );
  for (const edge of fragment.edges) {
    if (!nodeIds.has(edge.source.nodeId) || !nodeIds.has(edge.target.nodeId)) {
      fail(file, `edge ${edge.id} references an endpoint outside the graph fragment`);
    }

    const sourceKey = portSpecKey(edge.source.nodeId, edge.source.portId);
    const targetKey = portSpecKey(edge.target.nodeId, edge.target.portId);
    const source = ports.get(sourceKey);
    const target = ports.get(targetKey);
    if (!source) {
      fail(file, `edge ${edge.id} references missing source port ${sourceKey}`);
    }
    if (!target) {
      fail(file, `edge ${edge.id} references missing target port ${targetKey}`);
    }
    if (source.direction !== "output") {
      fail(file, `edge ${edge.id} source ${sourceKey} is not an output port`);
    }
    if (target.direction !== "input") {
      fail(file, `edge ${edge.id} target ${targetKey} is not an input port`);
    }
    if (!portTypeAccepts(source, target)) {
      fail(file, `edge ${edge.id} cannot connect ${sourceKey} ${source.type} to ${targetKey} ${target.type}`);
    }
  }
}

function validateNodeDefinitionV01Semantics(file, definition) {
  duplicateCheck(
    file,
    definition.ports.map((port) => port.id),
    `port id on ${definition.id}`
  );

  for (const group of definition.portGroups ?? []) {
    if (group.maxPorts !== undefined && group.maxPorts < group.minPorts) {
      fail(file, `port group ${definition.id}.${group.id} maxPorts is less than minPorts`);
    }
  }

  for (const permission of definition.permissions) {
    if (!allowedNodePermissions.has(permission)) {
      fail(file, `unsupported permission: ${permission}`);
    }
  }
}

function validateRuntimeSessionEventSemantics(file, event) {
  const gap = event.replay?.gap;
  if (gap && gap.expectedSequence >= gap.actualSequence) {
    fail(file, "replay gap expectedSequence must be less than actualSequence");
  }
  if (event.sessionRevision !== event.snapshot?.sessionRevision) {
    fail(file, "sessionRevision must match snapshot.sessionRevision");
  }
}

function validateRuntimeCollaborationCausality(file, causal, label) {
  const maxVector = Math.max(...Object.values(causal.vector));
  if (causal.baseSequence < maxVector) {
    fail(file, `${label} baseSequence must be greater than or equal to the causal vector maximum`);
  }
}

function validateRuntimeCollaborationAuthSeparation(file, participantId, authSubject, label) {
  if (authSubject?.subjectId && authSubject.subjectId === participantId) {
    fail(file, `${label} participantId must not mirror auth subject id`);
  }
}

function validateRuntimeCollaborationExpiry(file, updatedAt, expiresAt, label) {
  if (expiresAt <= updatedAt) {
    fail(file, `${label} expiresAt must be later than updatedAt`);
  }
}

function validateRuntimeCollaborationOperationEnvelopeSemantics(file, operation) {
  validateRuntimeCollaborationCausality(file, operation.causal, "operation causal");
  validateRuntimeCollaborationAuthSeparation(file, operation.participantId, operation.authSubject, "operation");
  if (!(operation.participantId in operation.causal.vector)) {
    fail(file, "operation causal vector must include participantId");
  }
  if (operation.payload.kind === "changeSet") {
    duplicateCheck(
      file,
      operation.payload.changes.map((change) => change.changeId),
      "collaboration change id"
    );
  }
  if (operation.payload.kind === "pasteGraphFragment") {
    validateGraphFragmentV01Semantics(file, operation.payload.request.fragment);
  }
  if (
    operation.payload.kind === "undoRedo" &&
    operation.payload.scope.participantId !== operation.participantId
  ) {
    fail(file, "undoRedo scope participantId must match operation participantId");
  }
}

function validateRuntimeCollaborationOperationBatchSemantics(file, batch) {
  duplicateCheck(
    file,
    batch.operations.map((operation) => operation.idempotencyKey),
    "collaboration idempotency key"
  );
  for (const operation of batch.operations) {
    if (operation.sessionId !== batch.sessionId) {
      fail(file, "collaboration batch operation sessionId must match batch sessionId");
    }
    validateRuntimeCollaborationOperationEnvelopeSemantics(file, operation);
  }
}

function validateRuntimeCollaborationOperationResultSemantics(file, result) {
  validateRuntimeCollaborationCausality(file, result.causal, "operation result causal");
  if ((result.status === "accepted" || result.status === "rebased") && !result.ack) {
    fail(file, "accepted or rebased collaboration result must include ack");
  }
  if (result.status === "accepted" && (result.nack || result.rebase)) {
    fail(file, "accepted collaboration result must not include nack or rebase");
  }
  if ((result.status === "duplicate" || result.status === "rejected") && !result.nack) {
    fail(file, "duplicate or rejected collaboration result must include nack");
  }
  if (result.status === "duplicate" && result.nack?.reason !== "duplicate-idempotency-key") {
    fail(file, "duplicate collaboration result nack reason must be duplicate-idempotency-key");
  }
  if (result.status === "rebased" && !result.rebase) {
    fail(file, "rebased collaboration result must include rebase metadata");
  }
  if (result.rebase) {
    validateRuntimeCollaborationCausality(file, result.rebase.from, "rebase from causal");
    validateRuntimeCollaborationCausality(file, result.rebase.to, "rebase to causal");
  }
}

function validateRuntimeCollaborationOperationBatchResultSemantics(file, result) {
  duplicateCheck(
    file,
    result.results.map((operationResult) => operationResult.idempotencyKey),
    "collaboration batch result idempotency key"
  );
  for (const operationResult of result.results) {
    if (operationResult.sessionId !== result.sessionId) {
      fail(file, "collaboration batch result operation sessionId must match batch result sessionId");
    }
    validateRuntimeCollaborationOperationResultSemantics(file, operationResult);
  }
}

function validateRuntimeCollaborationPresenceSemantics(file, presence) {
  validateRuntimeCollaborationAuthSeparation(file, presence.participantId, presence.authSubject, "presence");
  validateRuntimeCollaborationExpiry(file, presence.updatedAt, presence.expiresAt, "presence");
}

function validateRuntimeCollaborationSelectionSemantics(file, selection) {
  validateRuntimeCollaborationExpiry(file, selection.updatedAt, selection.expiresAt, "selection");
}

function validateRuntimeCollaborationEventSemantics(file, event) {
  validateRuntimeCollaborationCausality(file, event.causal, "collaboration event causal");
  const expectedPayloadKindByEventKind = {
    "operation-result": "operationResult",
    presence: "presence",
    selection: "selection"
  };
  if (event.payload.kind !== expectedPayloadKindByEventKind[event.kind]) {
    fail(file, "collaboration event kind must match payload kind");
  }
  const gap = event.replay?.gap;
  if (gap && gap.expectedSequence >= gap.actualSequence) {
    fail(file, "collaboration event replay gap expectedSequence must be less than actualSequence");
  }
}

function releaseTrainPackageVersions(manifest) {
  return [
    ["contracts npm", manifest.components.contracts.npm],
    ["contracts crate", manifest.components.contracts.crate],
    ["sdk npm", manifest.components.sdk.npm]
  ];
}

function releaseTrainRegistryPackageGatePackages(manifest) {
  return [
    [
      "contracts-npm",
      manifest["release-gates"]["registry-packages"]["contracts-npm"].package,
      manifest.components.contracts.npm
    ],
    [
      "contracts-crate",
      manifest["release-gates"]["registry-packages"]["contracts-crate"].package,
      manifest.components.contracts.crate
    ],
    [
      "sdk-npm",
      manifest["release-gates"]["registry-packages"]["sdk-npm"].package,
      manifest.components.sdk.npm
    ]
  ];
}

function releaseTrainRegistryPackageIdentity(packageRef) {
  return [packageRef.ecosystem, packageRef.name, packageRef.version].join("\u0000");
}

function validateReleaseTrainRegistryPackageGates(file, manifest) {
  for (const [label, gatePackage, componentPackage] of releaseTrainRegistryPackageGatePackages(manifest)) {
    if (releaseTrainRegistryPackageIdentity(gatePackage) !== releaseTrainRegistryPackageIdentity(componentPackage)) {
      fail(file, `release-gates.registry-packages.${label}.package must match component package`);
    }
  }
}

function releaseTrainArtifacts(manifest) {
  return [
    ...Object.values(manifest.components.runtime.binaries),
    ...Object.values(manifest.components.studio["desktop-packages"]),
    ...Object.values(manifest.components.studio["runtime-sidecars"]),
    manifest.components.studio["web-bundle"]
  ];
}

function validateReleaseTrainArtifactVersions(file, artifacts, label, trainVersion) {
  for (const artifact of Object.values(artifacts)) {
    if (artifact.version !== trainVersion) {
      fail(file, `${label} ${artifact.target} version must be ${trainVersion}`);
    }
  }
}

function validateReleaseTrainArtifactSourceRepositories(file, artifacts, label, expectedRepository) {
  for (const artifact of Object.values(artifacts)) {
    if (artifact.source.kind !== "github-release-asset") {
      fail(file, `${label} ${artifact.target} source must be a GitHub release asset`);
      continue;
    }
    if (artifact.source.repository !== expectedRepository) {
      fail(file, `${label} ${artifact.target} repository must be ${expectedRepository}`);
    }
  }
}

function validateReleaseTrainDesktopArtifactNames(file, artifacts, label) {
  for (const [target, artifact] of Object.entries(artifacts)) {
    const expectedName = releaseTrainStudioDesktopArchiveName(target);
    if (artifact.name !== expectedName) {
      fail(file, `${label} ${target} name must be ${expectedName}`);
    }
    if (artifact.source.kind === "github-release-asset" && artifact.source["asset-name"] !== expectedName) {
      fail(file, `${label} ${target} asset-name must be ${expectedName}`);
    }
  }
}

function validateReleaseTrainStudioWebBundleArtifact(file, manifest) {
  const artifact = manifest.components.studio["web-bundle"];
  const label = `components.studio["web-bundle"]`;
  const expectedName = `skenion-studio-web-bundle-v${manifest["train-version"]}.tar.gz`;
  const expectedTag = `skenion-studio-v${manifest["train-version"]}`;

  if (artifact.version !== manifest["train-version"]) {
    fail(file, `${label}.version must be ${manifest["train-version"]}`);
  }
  if (artifact.kind !== "studio-web-bundle") {
    fail(file, `${label}.kind must be studio-web-bundle`);
  }
  if (artifact.name !== expectedName) {
    fail(file, `${label}.name must be ${expectedName}`);
  }
  if (artifact.source.kind !== "github-release-asset") {
    fail(file, `${label}.source must be a GitHub release asset`);
  } else {
    if (artifact.source.repository !== releaseTrainStudioRepositoryV01) {
      fail(file, `${label}.repository must be ${releaseTrainStudioRepositoryV01}`);
    }
    if (artifact.source.tag !== expectedTag) {
      fail(file, `${label}.tag must be ${expectedTag}`);
    }
    if (artifact.source["asset-name"] !== expectedName) {
      fail(file, `${label}["asset-name"] must be ${expectedName}`);
    }
  }
}

const releaseTrainTargetsV01 = [
  "aarch64-apple-darwin",
  "x86_64-apple-darwin",
  "x86_64-pc-windows-msvc",
  "aarch64-pc-windows-msvc",
  "x86_64-unknown-linux-gnu",
  "aarch64-unknown-linux-gnu"
];
const releaseTrainRuntimeRepositoryV01 = "skenion/skenion-runtime";
const releaseTrainStudioRepositoryV01 = "skenion/skenion-studio";
const releaseTrainExamplesRepositoryV01 = "skenion/skenion-examples";
const releaseTrainDocsPagesOriginV01 = "https://skenion.github.io/skenion-docs";

function releaseTrainStudioDesktopArchiveName(target) {
  const extension = target.includes("windows-msvc") ? "zip" : "tar.gz";
  return `skenion-studio-${target}.${extension}`;
}

function releaseTrainArtifactsById(manifest) {
  return new Map(releaseTrainArtifacts(manifest).map((artifact) => [artifact.id, artifact]));
}

function validateReleaseTrainArtifactId(file, artifactsById, label, artifactId) {
  if (!artifactsById.has(artifactId)) {
    fail(file, `${label} references unknown artifact ${artifactId}`);
  }
}

function validateReleaseTrainArtifactCollectionGate(file, artifactsById, label, artifactIds) {
  for (const artifactId of artifactIds) {
    validateReleaseTrainArtifactId(file, artifactsById, label, artifactId);
  }
}

function validateReleaseTrainRuntimeSmokeGates(file, manifest, artifactsById) {
  for (const target of releaseTrainTargetsV01) {
    const gate = manifest["release-gates"]["runtime-smoke"][target];
    const artifact = manifest.components.runtime.binaries[target];
    validateReleaseTrainArtifactId(file, artifactsById, "runtime-smoke", gate["artifact-id"]);
    if (gate.target !== target) {
      fail(file, `runtime-smoke ${target} target must match map key`);
    }
    if (gate["artifact-id"] !== artifact.id) {
      fail(file, `runtime-smoke ${target} artifact-id must match runtime binary`);
    }
  }
}

function validateReleaseTrainStudioSmokeGates(file, manifest, artifactsById) {
  for (const target of releaseTrainTargetsV01) {
    const gate = manifest["release-gates"]["studio-package-smoke"][target];
    const desktopPackage = manifest.components.studio["desktop-packages"][target];
    const runtimeSidecar = manifest.components.studio["runtime-sidecars"][target];
    validateReleaseTrainArtifactId(
      file,
      artifactsById,
      "studio-package-smoke desktop-package-artifact-id",
      gate["desktop-package-artifact-id"]
    );
    validateReleaseTrainArtifactId(
      file,
      artifactsById,
      "studio-package-smoke runtime-sidecar-artifact-id",
      gate["runtime-sidecar-artifact-id"]
    );
    if (gate.target !== target) {
      fail(file, `studio-package-smoke ${target} target must match map key`);
    }
    if (gate["desktop-package-artifact-id"] !== desktopPackage.id) {
      fail(file, `studio-package-smoke ${target} desktop-package-artifact-id must match desktop package`);
    }
    if (gate["runtime-sidecar-artifact-id"] !== runtimeSidecar.id) {
      fail(file, `studio-package-smoke ${target} runtime-sidecar-artifact-id must match runtime sidecar`);
    }
  }
}

function validateReleaseTrainManifestSemantics(file, manifest) {
  if (!manifest["train-version"].startsWith(`${manifest["train-id"]}.`)) {
    fail(file, "train-version must match train-id major.minor");
  }

  for (const [label, packageRef] of releaseTrainPackageVersions(manifest)) {
    if (packageRef.version !== manifest["train-version"]) {
      fail(file, `${label} version must be ${manifest["train-version"]}`);
    }
  }
  validateReleaseTrainRegistryPackageGates(file, manifest);

  validateReleaseTrainArtifactVersions(file, manifest.components.runtime.binaries, "runtime binary", manifest["train-version"]);
  validateReleaseTrainArtifactVersions(file, manifest.components.studio["desktop-packages"], "studio desktop package", manifest["train-version"]);
  validateReleaseTrainArtifactVersions(file, manifest.components.studio["runtime-sidecars"], "studio runtime-sidecars", manifest["train-version"]);
  validateReleaseTrainStudioWebBundleArtifact(file, manifest);
  validateReleaseTrainArtifactSourceRepositories(file, manifest.components.runtime.binaries, "runtime binary", releaseTrainRuntimeRepositoryV01);
  validateReleaseTrainArtifactSourceRepositories(file, manifest.components.studio["desktop-packages"], "studio desktop package", releaseTrainStudioRepositoryV01);
  validateReleaseTrainArtifactSourceRepositories(file, manifest.components.studio["runtime-sidecars"], "studio runtime-sidecars", releaseTrainStudioRepositoryV01);
  validateReleaseTrainDesktopArtifactNames(file, manifest.components.studio["desktop-packages"], "studio desktop package");

  if (manifest.components.examples.version !== manifest["train-version"]) {
    fail(file, `examples version must be ${manifest["train-version"]}`);
  }
  if (manifest.components.examples.repository !== releaseTrainExamplesRepositoryV01) {
    fail(file, `examples repository must be ${releaseTrainExamplesRepositoryV01}`);
  }
  if (manifest["release-gates"]["examples-conformance"].version !== manifest.components.examples.version) {
    fail(file, "examples conformance gate version must match examples version");
  }
  if (manifest["release-gates"]["examples-conformance"].repository !== manifest.components.examples.repository) {
    fail(file, "examples conformance gate repository must match examples repository");
  }
  if (manifest["release-gates"]["examples-conformance"].ref !== manifest.components.examples.tag) {
    fail(file, "examples conformance gate ref must match examples tag");
  }

  if (manifest.components.docs.manual.version !== manifest["train-version"]) {
    fail(file, `docs manual version must be ${manifest["train-version"]}`);
  }
  const expectedManualPath = `/manual/${manifest["train-id"]}/`;
  if (manifest.components.docs.manual.path !== expectedManualPath) {
    fail(file, `docs manual path must be ${expectedManualPath}`);
  }
  const expectedManualPagesUrl = `${releaseTrainDocsPagesOriginV01}${expectedManualPath}`;
  if (manifest.components.docs.manual["pages-url"] !== expectedManualPagesUrl) {
    fail(file, `docs manual pages-url must be ${expectedManualPagesUrl}`);
  }
  if (manifest["release-gates"]["docs-pages-deployment"]["manual-version"] !== manifest.components.docs.manual.version) {
    fail(file, "docs Pages gate manual-version must match docs manual version");
  }
  if (manifest["release-gates"]["docs-pages-deployment"]["manual-path"] !== manifest.components.docs.manual.path) {
    fail(file, "docs Pages gate manual-path must match docs manual path");
  }
  if (manifest["release-gates"]["docs-pages-deployment"]["pages-url"] !== manifest.components.docs.manual["pages-url"]) {
    fail(file, "docs Pages gate pages-url must match docs manual pages-url");
  }

  const artifactsById = releaseTrainArtifactsById(manifest);
  if (manifest["release-gates"]["github-release-assets"].runtime.repository !== releaseTrainRuntimeRepositoryV01) {
    fail(file, `github-release-assets runtime repository must be ${releaseTrainRuntimeRepositoryV01}`);
  }
  if (manifest["release-gates"]["github-release-assets"].studio.repository !== releaseTrainStudioRepositoryV01) {
    fail(file, `github-release-assets studio repository must be ${releaseTrainStudioRepositoryV01}`);
  }
  validateReleaseTrainArtifactCollectionGate(
    file,
    artifactsById,
    "github-release-assets runtime",
    manifest["release-gates"]["github-release-assets"].runtime["artifact-ids"]
  );
  validateReleaseTrainArtifactCollectionGate(
    file,
    artifactsById,
    "github-release-assets studio",
    manifest["release-gates"]["github-release-assets"].studio["artifact-ids"]
  );
  validateReleaseTrainArtifactCollectionGate(
    file,
    artifactsById,
    "checksum-verification",
    manifest["release-gates"]["checksum-verification"]["artifact-ids"]
  );
  if (!manifest["release-gates"]["github-release-assets"].studio["artifact-ids"].includes(manifest.components.studio["web-bundle"].id)) {
    fail(file, `github-release-assets studio artifact-ids must include components.studio["web-bundle"].id`);
  }
  if (!manifest["release-gates"]["checksum-verification"]["artifact-ids"].includes(manifest.components.studio["web-bundle"].id)) {
    fail(file, `checksum-verification artifact-ids must include components.studio["web-bundle"].id`);
  }
  validateReleaseTrainRuntimeSmokeGates(file, manifest, artifactsById);
  validateReleaseTrainStudioSmokeGates(file, manifest, artifactsById);

  for (const [artifactId, expectedChecksum] of Object.entries(manifest["release-gates"]["checksum-verification"]["expected-checksums"] ?? {})) {
    const artifact = artifactsById.get(artifactId);
    if (artifact === undefined) {
      fail(file, `checksum gate references unknown artifact ${artifactId}`);
    }
    if (
      artifact.checksum.value !== null &&
      expectedChecksum.value !== null &&
      artifact.checksum.value !== expectedChecksum.value
    ) {
      fail(file, `checksum gate value must match artifact ${artifactId}`);
    }
    if (artifact.checksum.value === null && expectedChecksum.value !== null) {
      fail(file, `artifact ${artifactId} checksum value must be populated before checksum gate can pin it`);
    }
  }
}

function parseV0Semver(version) {
  const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(version);
  if (!match || Number(match[1]) !== 0) {
    return undefined;
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3])
  };
}

function deriveV0CompatibilityLine(version) {
  const parsed = parseV0Semver(version);
  return parsed ? `0.${parsed.minor}` : undefined;
}

function deriveV0CompatibilityRange(version) {
  const parsed = parseV0Semver(version);
  return parsed ? `>=0.${parsed.minor}.0 <0.${parsed.minor + 1}.0` : undefined;
}

function satisfiesV0CompatibilityRange(version, range) {
  const parsed = parseV0Semver(version);
  const rangeMatch = /^>=0\.([0-9]+)\.0 <0\.([0-9]+)\.0$/.exec(range);
  if (!parsed || !rangeMatch) {
    return false;
  }
  const lowerMinor = Number(rangeMatch[1]);
  const upperMinor = Number(rangeMatch[2]);
  return upperMinor === lowerMinor + 1 && parsed.minor === lowerMinor;
}

function compatibilityMatrixArtifacts(matrix) {
  return [
    ...Object.values(matrix.components.runtime.assets),
    ...matrix.components.studio["web-assets"],
    ...Object.values(matrix.components.studio["desktop-assets"]),
    ...Object.values(matrix.components.studio["runtime-sidecars"])
  ];
}

function validateCompatibilityMatrixTargetMap(file, artifacts, label, expectedKind) {
  for (const target of releaseTrainTargetsV01) {
    const artifact = artifacts[target];
    if (artifact.target !== target) {
      fail(file, `${label} ${target} target must match map key`);
    }
    if (artifact.kind !== expectedKind) {
      fail(file, `${label} ${target} kind must be ${expectedKind}`);
    }
  }
}

function validateCompatibilityMatrixSemantics(file, matrix) {
  const contractsNpm = matrix.components.contracts.npm;
  const contractsCrate = matrix.components.contracts.crate;
  const expectedLine = deriveV0CompatibilityLine(contractsNpm.version);
  const expectedRange = deriveV0CompatibilityRange(contractsNpm.version);

  if (contractsNpm.ecosystem !== "npm" || contractsNpm.name !== "@skenion/contracts") {
    fail(file, "components.contracts.npm must identify @skenion/contracts on npm");
  }
  if (contractsCrate.ecosystem !== "crates.io" || contractsCrate.name !== "skenion-contracts") {
    fail(file, "components.contracts.crate must identify skenion-contracts on crates.io");
  }
  if (matrix.components.sdk.npm.ecosystem !== "npm" || matrix.components.sdk.npm.name !== "@skenion/sdk") {
    fail(file, "components.sdk.npm must identify @skenion/sdk on npm");
  }
  if (matrix["contracts-line"] !== expectedLine) {
    fail(file, `contracts-line must be ${expectedLine}`);
  }
  if (matrix["contracts-range"] !== expectedRange) {
    fail(file, `contracts-range must be ${expectedRange}`);
  }
  if (deriveV0CompatibilityLine(contractsCrate.version) !== expectedLine) {
    fail(file, "contracts npm and crate versions must be on the same v0 compatibility line");
  }
  if (!satisfiesV0CompatibilityRange(contractsNpm.version, matrix.components.sdk["supported-contracts-range"])) {
    fail(file, "sdk supported-contracts-range must include the Contracts package version");
  }
  if (!satisfiesV0CompatibilityRange(contractsNpm.version, matrix["contracts-range"])) {
    fail(file, "contracts-range must include the Contracts package version");
  }

  validateCompatibilityMatrixTargetMap(file, matrix.components.runtime.assets, "runtime asset", "runtime-binary");
  validateCompatibilityMatrixTargetMap(file, matrix.components.studio["desktop-assets"], "studio desktop asset", "studio-desktop-package");
  validateCompatibilityMatrixTargetMap(file, matrix.components.studio["runtime-sidecars"], "studio runtime sidecar", "studio-runtime-sidecar");
  for (const artifact of matrix.components.studio["web-assets"]) {
    if (artifact.kind !== "studio-web-bundle") {
      fail(file, `studio web asset ${artifact.id} kind must be studio-web-bundle`);
    }
  }

  const artifactsById = new Map();
  for (const artifact of compatibilityMatrixArtifacts(matrix)) {
    if (artifactsById.has(artifact.id)) {
      fail(file, `duplicate compatibility matrix artifact id: ${artifact.id}`);
    }
    artifactsById.set(artifact.id, artifact);
  }
  for (const [artifactId, expectedChecksum] of Object.entries(matrix.verification["expected-checksums"])) {
    const artifact = artifactsById.get(artifactId);
    if (artifact === undefined) {
      fail(file, `verification expected-checksums references unknown artifact ${artifactId}`);
    }
    if (artifact.checksum.value === null && expectedChecksum.value !== null) {
      fail(file, `artifact ${artifactId} checksum value must be populated before verification can pin it`);
    }
    if (
      artifact.checksum.value !== null &&
      expectedChecksum.value !== null &&
      artifact.checksum.value !== expectedChecksum.value
    ) {
      fail(file, `verification checksum value must match artifact ${artifactId}`);
    }
  }

  if (matrix.promotion.state === "promoted") {
    if (matrix.components.examples["conformance-status"] !== "passed") {
      fail(file, "promoted compatibility matrix requires passed examples conformance");
    }
    if (!matrix.components.docs.manual["pages-deployed"]) {
      fail(file, "promoted compatibility matrix requires deployed docs Pages manual");
    }
    if (!matrix.components.docs.manual["promoted-latest"]) {
      fail(file, "promoted compatibility matrix requires docs manual promoted latest");
    }
    for (const artifact of compatibilityMatrixArtifacts(matrix)) {
      if (artifact.checksum.value === null) {
        fail(file, `promoted compatibility matrix requires checksum for artifact ${artifact.id}`);
      }
    }
  }
}

function selectValidator(file, document, validators) {
  if (document.schema === "skenion.graph" && document.schemaVersion === "0.1.0") {
    return validators.graphV01;
  }
  if (document.schema === "skenion.graph.fragment" && document.schemaVersion === "0.1.0") {
    return validators.graphFragmentV01;
  }
  if (document.schema === "skenion.runtime.operation" && document.schemaVersion === "0.1.0") {
    return validators.runtimeOperationV0;
  }
  if (document.schema === "skenion.runtime.session.info" && document.schemaVersion === "0.1.0") {
    return validators.runtimeSessionInfo;
  }
  if (document.schema === "skenion.runtime.session.event" && document.schemaVersion === "0.1.0") {
    return validators.runtimeSessionEvent;
  }
  if (document.schema === "skenion.runtime.paste-graph-fragment.response" && document.schemaVersion === "0.1.0") {
    return validators.pasteGraphFragmentResponse;
  }
  if (document.schema === "skenion.runtime.collaboration.operation" && document.schemaVersion === "0.1.0") {
    return validators.runtimeCollaborationOperation;
  }
  if (document.schema === "skenion.runtime.collaboration.operation-batch" && document.schemaVersion === "0.1.0") {
    return validators.runtimeCollaborationOperationBatch;
  }
  if (document.schema === "skenion.runtime.collaboration.operation-batch-result" && document.schemaVersion === "0.1.0") {
    return validators.runtimeCollaborationOperationBatchResult;
  }
  if (document.schema === "skenion.runtime.collaboration.operation-result" && document.schemaVersion === "0.1.0") {
    return validators.runtimeCollaborationOperationResult;
  }
  if (document.schema === "skenion.runtime.collaboration.presence" && document.schemaVersion === "0.1.0") {
    return validators.runtimeCollaborationPresence;
  }
  if (document.schema === "skenion.runtime.collaboration.selection" && document.schemaVersion === "0.1.0") {
    return validators.runtimeCollaborationSelection;
  }
  if (document.schema === "skenion.runtime.collaboration.event" && document.schemaVersion === "0.1.0") {
    return validators.runtimeCollaborationEvent;
  }
  if (document.schema === "skenion.view-state" && document.schemaVersion === "0.1.0") {
    return validators.viewStateV01;
  }
  if (document.schema === "skenion.project" && document.schemaVersion === "0.1.0") {
    return validators.projectV01;
  }
  if (document.schema === "skenion.node.definition" && document.schemaVersion === "0.1.0") {
    return validators.nodeDefinitionV01;
  }
  if (document.schema === "skenion.shader.interface" && document.schemaVersion === "0.1.0") {
    return validators.shaderInterfaceV01;
  }
  if (document.schema === "skenion.object-text.parse-result" && document.schemaVersion === "0.1.0") {
    return validators.objectTextParseResultV01;
  }
  if (document.schema === "skenion.extension.manifest" && document.schemaVersion === "0.1.0") {
    return validators.extensionManifestV01;
  }
  if (document.schema === "skenion.release-train" && document["schema-version"] === "0.1.0") {
    return validators.releaseTrainV01;
  }
  if (document.schema === "skenion.compatibility-matrix" && document["schema-version"] === "0.1.0") {
    return validators.compatibilityMatrixV01;
  }

  const schemaVersion = document.schema === "skenion.release-train" || document.schema === "skenion.compatibility-matrix"
    ? document["schema-version"]
    : document.schemaVersion;
  fail(file, `no validator for schema ${document.schema ?? "<missing>"} ${schemaVersion ?? "<missing>"}`);
}

function validateDocument(file, document, validators) {
  const validator = selectValidator(file, document, validators);
  if (!validator(document)) {
    fail(file, validator.errors?.map((error) => `${error.instancePath} ${error.message}`).join("; "));
  }

  if (document.schema === "skenion.graph" && document.schemaVersion === "0.1.0") {
    validateGraphV01Semantics(file, document);
  }
  if (document.schema === "skenion.graph.fragment" && document.schemaVersion === "0.1.0") {
    validateGraphFragmentV01Semantics(file, document);
  }
  if (document.schema === "skenion.runtime.operation" && document.schemaVersion === "0.1.0") {
    validateGraphFragmentV01Semantics(file, document.request.fragment);
  }
  if (document.schema === "skenion.runtime.session.event" && document.schemaVersion === "0.1.0") {
    validateRuntimeSessionEventSemantics(file, document);
  }
  if (document.schema === "skenion.runtime.collaboration.operation" && document.schemaVersion === "0.1.0") {
    validateRuntimeCollaborationOperationEnvelopeSemantics(file, document);
  }
  if (document.schema === "skenion.runtime.collaboration.operation-batch" && document.schemaVersion === "0.1.0") {
    validateRuntimeCollaborationOperationBatchSemantics(file, document);
  }
  if (document.schema === "skenion.runtime.collaboration.operation-batch-result" && document.schemaVersion === "0.1.0") {
    validateRuntimeCollaborationOperationBatchResultSemantics(file, document);
  }
  if (document.schema === "skenion.runtime.collaboration.operation-result" && document.schemaVersion === "0.1.0") {
    validateRuntimeCollaborationOperationResultSemantics(file, document);
  }
  if (document.schema === "skenion.runtime.collaboration.presence" && document.schemaVersion === "0.1.0") {
    validateRuntimeCollaborationPresenceSemantics(file, document);
  }
  if (document.schema === "skenion.runtime.collaboration.selection" && document.schemaVersion === "0.1.0") {
    validateRuntimeCollaborationSelectionSemantics(file, document);
  }
  if (document.schema === "skenion.runtime.collaboration.event" && document.schemaVersion === "0.1.0") {
    validateRuntimeCollaborationEventSemantics(file, document);
  }
  if (document.schema === "skenion.project" && document.schemaVersion === "0.1.0") {
    validateProjectV01Semantics(file, document);
  }
  if (document.schema === "skenion.node.definition" && document.schemaVersion === "0.1.0") {
    validateNodeDefinitionV01Semantics(file, document);
  }
  if (document.schema === "skenion.extension.manifest" && document.schemaVersion === "0.1.0") {
    duplicateCheck(
      file,
      (document.provides.nodes ?? []).map((node) => node.id),
      "provided node id"
    );
    for (const node of document.provides.nodes ?? []) {
      validateNodeDefinitionV01Semantics(file, node);
    }
  }
  if (document.schema === "skenion.release-train" && document["schema-version"] === "0.1.0") {
    validateReleaseTrainManifestSemantics(file, document);
  }
  if (document.schema === "skenion.compatibility-matrix" && document["schema-version"] === "0.1.0") {
    validateCompatibilityMatrixSemantics(file, document);
  }
}

function validateBuiltinManifest(file, manifest) {
  if (manifest.schema !== "skenion.builtins.manifest") {
    fail(file, "schema must be skenion.builtins.manifest");
  }
  if (manifest.schemaVersion !== "0.1.0") {
    fail(file, "schemaVersion must be 0.1.0");
  }
  if (manifest.version !== "0.1") {
    fail(file, "version must be 0.1");
  }
  if (!Array.isArray(manifest.nodes) || manifest.nodes.length === 0) {
    fail(file, "nodes must be a non-empty array");
  }
  if (!Array.isArray(manifest.canonicalDataKinds) || manifest.canonicalDataKinds.length === 0) {
    fail(file, "canonicalDataKinds must be a non-empty array");
  }

  for (const node of manifest.nodes) {
    requireString(file, node, "node id");
  }
  for (const dataKind of manifest.canonicalDataKinds) {
    requireString(file, dataKind, "canonical data kind");
  }

  duplicateCheck(file, manifest.nodes, "builtin node id");
  duplicateCheck(file, manifest.canonicalDataKinds, "canonical data kind");

  for (const [dataKind, representations] of Object.entries(manifest.representations ?? {})) {
    if (!manifest.canonicalDataKinds.includes(dataKind)) {
      fail(file, `representation key is not a canonical data kind: ${dataKind}`);
    }
    if (!Array.isArray(representations) || representations.length === 0) {
      fail(file, `representations for ${dataKind} must be a non-empty array`);
    }
    for (const representation of representations) {
      requireString(file, representation, `representation for ${dataKind}`);
    }
    duplicateCheck(file, representations, `representation for ${dataKind}`);
  }
}

function validateBuiltinNodeDefinition(file, definition, id, manifest) {
  validateDocument(file, definition, validators);
  if (definition.id !== id) {
    fail(file, `node definition id ${definition.id} does not match canonical id ${id}`);
  }
  if (!manifest.nodes.includes(definition.id)) {
    fail(file, `node definition is not listed in builtins manifest: ${definition.id}`);
  }

  const canonicalDataKinds = new Set(manifest.canonicalDataKinds);
  for (const port of definition.ports) {
    if (!canonicalDataKinds.has(port.type)) {
      fail(file, `port ${definition.id}.${port.id} uses non-canonical type ${port.type}`);
    }
    for (const acceptedType of port.accepts ?? []) {
      if (!canonicalDataKinds.has(acceptedType)) {
        fail(file, `port ${definition.id}.${port.id} accepts non-canonical type ${acceptedType}`);
      }
    }
  }
}

function validateBuiltinHelp(file, help, id, manifest, nodeDefinitions) {
  if (help.schema !== "skenion.node.help") {
    fail(file, "schema must be skenion.node.help");
  }
  if (help.schemaVersion !== "0.1.0") {
    fail(file, "schemaVersion must be 0.1.0");
  }
  if (help.id !== id) {
    fail(file, `help id ${help.id} does not match canonical id ${id}`);
  }
  for (const key of ["summary", "description", "helpGraph"]) {
    requireString(file, help[key], key);
  }
  if (!Array.isArray(help.tags) || help.tags.length === 0) {
    fail(file, "tags must be a non-empty array");
  }
  for (const tag of help.tags) {
    requireString(file, tag, "tag");
  }
  duplicateCheck(file, help.tags, "help tag");
  if (!manifest.nodes.includes(help.id)) {
    fail(file, `help is not listed in builtins manifest: ${help.id}`);
  }
  const expectedHelpGraph = `help/v0.1/nodes/${id}.help.graph.json`;
  if (help.helpGraph !== expectedHelpGraph) {
    fail(file, `helpGraph must be ${expectedHelpGraph}`);
  }
  if (help.example?.graph !== undefined && help.example.graph !== expectedHelpGraph) {
    fail(file, `example graph must be ${expectedHelpGraph}`);
  }
  for (const relatedNode of help.relatedNodes ?? []) {
    if (!manifest.nodes.includes(relatedNode)) {
      fail(file, `related node is not listed in builtins manifest: ${relatedNode}`);
    }
  }

  const definition = nodeDefinitions.get(help.id);
  const portIds = new Set((definition?.ports ?? []).map((port) => port.id));
  for (const port of help.ports ?? []) {
    requireString(file, port.id, "help port id");
    requireString(file, port.description, `help port ${port.id} description`);
    if (!portIds.has(port.id)) {
      fail(file, `help port is not declared by node definition: ${help.id}.${port.id}`);
    }
  }
}

function validateBuiltinHelpGraph(file, graph, id, manifest) {
  validateDocument(file, graph, validators);
  if (graph.id !== `help-${id.replaceAll(".", "-")}`) {
    fail(file, `help graph id must be help-${id.replaceAll(".", "-")}`);
  }
  const builtinKinds = new Set(manifest.nodes);
  for (const node of graph.nodes) {
    if (!builtinKinds.has(node.kind)) {
      fail(file, `help graph node ${node.id} uses non-canonical builtin kind ${node.kind}`);
    }
    if (node.kindVersion !== "0.1.0") {
      fail(file, `help graph node ${node.id} kindVersion must be 0.1.0`);
    }
  }
}

async function validateBuiltinsAndHelp() {
  const manifestFile = "builtins/v0.1/builtins.manifest.json";
  const manifest = await readJson(manifestFile);
  validateBuiltinManifest(manifestFile, manifest);

  const nodeFiles = (await walk("builtins/v0.1/nodes"))
    .filter((file) => file.endsWith(".node.json"));
  const helpFiles = (await walk("builtins/v0.1/help"))
    .filter((file) => file.endsWith(".help.json"));
  const helpGraphFiles = (await walk("help/v0.1/nodes"))
    .filter((file) => file.endsWith(".help.graph.json"));

  const nodeIds = nodeFiles.map((file) => path.basename(file, ".node.json"));
  const helpIds = helpFiles.map((file) => path.basename(file, ".help.json"));
  const helpGraphIds = helpGraphFiles.map((file) => path.basename(file, ".help.graph.json"));
  assertSameSet(manifestFile, nodeIds, manifest.nodes, "builtin node file ids");
  assertSameSet(manifestFile, helpIds, manifest.nodes, "builtin help file ids");
  assertSameSet(manifestFile, helpGraphIds, manifest.nodes, "builtin help graph file ids");

  const nodeDefinitions = new Map();
  for (const file of nodeFiles) {
    const id = path.basename(file, ".node.json");
    const definition = await readJson(file);
    validateBuiltinNodeDefinition(file, definition, id, manifest);
    nodeDefinitions.set(definition.id, definition);
  }

  for (const file of helpFiles) {
    const id = path.basename(file, ".help.json");
    validateBuiltinHelp(file, await readJson(file), id, manifest, nodeDefinitions);
  }

  for (const file of helpGraphFiles) {
    const id = path.basename(file, ".help.graph.json");
    validateBuiltinHelpGraph(file, await readJson(file), id, manifest);
  }

  return {
    nodeCount: nodeFiles.length,
    helpCount: helpFiles.length,
    helpGraphCount: helpGraphFiles.length
  };
}

async function validatePublicDocs() {
  const docFiles = [
    ...(await walk("docs")),
    "README.md",
    "packages/ts/README.md",
    "packages/rust/README.md"
  ].filter((file) => file.endsWith(".md"));
  const singularRuntimeSessionRoute = /\/v0\/session(?!s)(?:\/|`|\s|$)/;

  for (const file of docFiles) {
    const text = await readFile(file, "utf8");
    if (singularRuntimeSessionRoute.test(text)) {
      fail(file, "removed singular Runtime route /v0/session is documented");
    }
  }

  return docFiles.length;
}

function normalizedPath(file) {
  return file.split(path.sep).join("/");
}

function isExplicitlyLoadedSchemaFile(file) {
  const normalized = normalizedPath(file);
  return [
    "json-schema/extension/v0.1/",
    "json-schema/compatibility-matrix/v0.1/",
    "json-schema/graph/v0.1/",
    "json-schema/node/v0.1/",
    "json-schema/project/v0.1/",
    "json-schema/view/v0.1/"
  ].some((prefix) => normalized.startsWith(prefix));
}

const schemaFiles = (await walk("json-schema"))
  .filter((file) => file.endsWith(".json"))
  .filter((file) => !isExplicitlyLoadedSchemaFile(file));
for (const file of schemaFiles) {
  await readJson(file);
}

await readFile("openapi/runtime-http.v0.yaml", "utf8");

const ajv = new Ajv2020({ allErrors: true });
const graphV01Schema = await readJson("json-schema/graph/v0.1/graph.schema.json");
const graphFragmentV01Schema = await readJson("json-schema/graph/v0.1/fragment.schema.json");
const runtimeOperationV0Schema = await readJson("json-schema/runtime/v0/operation.schema.json");
const runtimeSessionV0Schema = await readJson("json-schema/runtime/v0/session.schema.json");
const runtimeCollaborationV0Schema = await readJson("json-schema/runtime/v0/collaboration.schema.json");
const viewStateV01Schema = await readJson("json-schema/view/v0.1/view-state.schema.json");
const projectV01Schema = await readJson("json-schema/project/v0.1/project.schema.json");
const nodeDefinitionV01Schema = await readJson("json-schema/node/v0.1/node-definition.schema.json");
const extensionManifestV01Schema = await readJson("json-schema/extension/v0.1/extension-manifest.schema.json");
const releaseTrainV01Schema = await readJson("json-schema/release-train/v0.1/release-train.schema.json");
const compatibilityMatrixV01Schema = await readJson("json-schema/compatibility-matrix/v0.1/compatibility-matrix.schema.json");
ajv.addSchema(graphV01Schema);
ajv.addSchema(graphFragmentV01Schema);
ajv.addSchema(runtimeOperationV0Schema);
ajv.addSchema(viewStateV01Schema);
ajv.addSchema(nodeDefinitionV01Schema);
ajv.addSchema(projectV01Schema);
ajv.addSchema(runtimeSessionV0Schema);
ajv.addSchema(runtimeCollaborationV0Schema);
ajv.addSchema(releaseTrainV01Schema);
ajv.addSchema(compatibilityMatrixV01Schema);
const validators = {
  graphV01: ajv.compile(graphV01Schema),
  graphFragmentV01: ajv.compile(graphFragmentV01Schema),
  runtimeOperationV0: ajv.compile(runtimeOperationV0Schema),
  runtimeSessionInfo: ajv.compile(runtimeSessionV0Schema),
  runtimeSessionEvent: ajv.compile({
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://skenion.dev/schemas/runtime/v0/session-event.schema.json",
    $ref: "https://skenion.dev/schemas/runtime/v0/session.schema.json#/$defs/runtimeSessionEvent"
  }),
  pasteGraphFragmentResponse: ajv.compile({
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://skenion.dev/schemas/runtime/v0/paste-graph-fragment-response.schema.json",
    $ref: "https://skenion.dev/schemas/runtime/v0/operation.schema.json#/$defs/pasteGraphFragmentResponse"
  }),
  runtimeCollaborationOperation: ajv.compile({
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://skenion.dev/schemas/runtime/v0/collaboration-operation.fixture.schema.json",
    $ref: "https://skenion.dev/schemas/runtime/v0/collaboration.schema.json#/$defs/runtimeCollaborationOperationEnvelope"
  }),
  runtimeCollaborationOperationBatch: ajv.compile({
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://skenion.dev/schemas/runtime/v0/collaboration-operation-batch.fixture.schema.json",
    $ref: "https://skenion.dev/schemas/runtime/v0/collaboration.schema.json#/$defs/runtimeCollaborationOperationBatch"
  }),
  runtimeCollaborationOperationBatchResult: ajv.compile({
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://skenion.dev/schemas/runtime/v0/collaboration-operation-batch-result.fixture.schema.json",
    $ref: "https://skenion.dev/schemas/runtime/v0/collaboration.schema.json#/$defs/runtimeCollaborationOperationBatchResult"
  }),
  runtimeCollaborationOperationResult: ajv.compile({
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://skenion.dev/schemas/runtime/v0/collaboration-operation-result.fixture.schema.json",
    $ref: "https://skenion.dev/schemas/runtime/v0/collaboration.schema.json#/$defs/runtimeCollaborationOperationResult"
  }),
  runtimeCollaborationPresence: ajv.compile({
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://skenion.dev/schemas/runtime/v0/collaboration-presence.fixture.schema.json",
    $ref: "https://skenion.dev/schemas/runtime/v0/collaboration.schema.json#/$defs/runtimeCollaborationPresenceEnvelope"
  }),
  runtimeCollaborationSelection: ajv.compile({
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://skenion.dev/schemas/runtime/v0/collaboration-selection.fixture.schema.json",
    $ref: "https://skenion.dev/schemas/runtime/v0/collaboration.schema.json#/$defs/runtimeCollaborationSelectionEnvelope"
  }),
  runtimeCollaborationEvent: ajv.compile({
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: "https://skenion.dev/schemas/runtime/v0/collaboration-event.fixture.schema.json",
    $ref: "https://skenion.dev/schemas/runtime/v0/collaboration.schema.json#/$defs/runtimeCollaborationEventEnvelope"
  }),
  viewStateV01: ajv.compile(viewStateV01Schema),
  projectV01: ajv.compile(projectV01Schema),
  nodeDefinitionV01: ajv.compile(nodeDefinitionV01Schema),
  shaderInterfaceV01: ajv.compile(
    await readJson("json-schema/shader/v0.1/shader-interface.schema.json")
  ),
  objectTextParseResultV01: ajv.compile(
    await readJson("json-schema/object-text/v0.1/parse-result.schema.json")
  ),
  extensionManifestV01: ajv.compile(extensionManifestV01Schema),
  releaseTrainV01: ajv.compile(releaseTrainV01Schema),
  compatibilityMatrixV01: ajv.compile(compatibilityMatrixV01Schema)
};

const fixtureFiles = (await walk("fixtures"))
  .filter((file) => file.endsWith(".json"));
const validFixtureFiles = fixtureFiles.filter((file) => !file.includes(`${path.sep}invalid${path.sep}`));
const invalidFixtureFiles = fixtureFiles.filter((file) => file.includes(`${path.sep}invalid${path.sep}`));

for (const file of validFixtureFiles) {
  validateDocument(file, await readJson(file), validators);
}

for (const file of invalidFixtureFiles) {
  try {
    validateDocument(file, await readJson(file), validators);
  } catch {
    continue;
  }
  fail(file, "invalid fixture unexpectedly passed");
}

const builtinsSummary = await validateBuiltinsAndHelp();
const docCount = await validatePublicDocs();

console.log(
  `validated ${schemaFiles.length} schemas, ${validFixtureFiles.length} valid fixtures, ${invalidFixtureFiles.length} invalid fixtures, ${builtinsSummary.nodeCount} builtin node definitions, ${builtinsSummary.helpCount} help files, ${builtinsSummary.helpGraphCount} help graphs, and ${docCount} public docs`
);
