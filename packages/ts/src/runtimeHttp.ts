import {
  validateExtensionManifestV01,
  validateGraphFragmentV01,
  validateProjectDocumentV01
} from "./validate.js";
import type {
  CanvasNodeViewV01,
  ExtensionManifestV01,
  GeneratedShaderSourceMapV01,
  GraphTargetRef,
  IdRemapResult,
  PackageRegistryEntryV01,
  PackageRegistryListResponseV01,
  PasteGraphFragmentOptions,
  PasteGraphFragmentRequest,
  PasteGraphFragmentResponse,
  PastePlacement,
  RuntimeApiResponse,
  RuntimeAssetGetResponse,
  RuntimeAssetImportResponse,
  RuntimeAssetListResponse,
  RuntimeControlEmission,
  RuntimeControlEventRequest,
  RuntimeControlEventResponse,
  RuntimeControlMessage,
  RuntimeControlReadRequest,
  RuntimeControlReadResponse,
  RuntimeControlReadValue,
  RuntimeControlStateResponse,
  RuntimeControlValue,
  RuntimeDiagnostic,
  RuntimeDiagnosticSeverity,
  RuntimeExtensionDescriptor,
  RuntimeExtensionListResponse,
  RuntimeConnectionProfile,
  RuntimeConnectionProfileMode,
  RuntimeEndpointMetadata,
  RuntimeEventReplayGap,
  RuntimeEventReplayMetadata,
  RuntimeEventReplayWindow,
  RuntimeGeneratedShaderResponse,
  RuntimeHealth,
  RuntimeHistory,
  RuntimeInfo,
  RuntimeIoDeviceListResponse,
  RuntimeLogEvent,
  RuntimeLogSnapshotResponse,
  RuntimeMutationRequest,
  RuntimeOperationAttribution,
  RuntimeOperationDiagnostic,
  RuntimeOperationEnvelope,
  RuntimeOwnershipMode,
  RuntimeProcessMetadata,
  RuntimePreviewStatus,
  RuntimeSessionCapabilitySet,
  RuntimeSessionEvent,
  RuntimeSessionEventKind,
  RuntimeSessionInfoResponse,
  RuntimeSessionLifecycleState,
  RuntimeSessionResponse,
  RuntimeSessionSnapshot,
  RuntimeTelemetrySnapshot
} from "./types.js";

const SHADER_DIAGNOSTIC_SEVERITIES = new Set(["error", "warning", "info"]);
const SHADER_DIAGNOSTIC_PHASES = new Set([
  "interface-analysis",
  "source-sync",
  "wgsl-generation",
  "wgsl-compile",
  "render-pipeline",
  "render-frame"
]);
const SHADER_DIAGNOSTIC_SOURCES = new Set(["user", "generated", "runtime"]);
const RUNTIME_OPERATION_DIAGNOSTIC_CODES = new Set([
  "base-revision-mismatch",
  "duplicate-edge-id",
  "duplicate-node-id",
  "duplicate-target-path",
  "fragment-edge-outside-selection",
  "id-conflict",
  "interface-drift",
  "invalid-incident-edge",
  "invalid-target-path",
  "operation-rebased",
  "target-not-found",
  "unsupported-operation"
]);
const INTERFACE_INCIDENT_EDGE_POLICIES = new Set(["drop", "preserve-diagnostic", "reject"]);
const INTERFACE_RECOVERY_ACTION_IDS = new Set(["drop-edge", "reconnect", "restore-port", "replace-provider"]);
const INTERFACE_MISSING_ENDPOINTS = new Set(["source-node", "source-port", "target-node", "target-port"]);
const INTERFACE_CARDINALITY_REASONS = new Set(["fan-in", "fan-out", "merge-policy", "min-connections", "max-connections"]);
const RUNTIME_SESSION_LIFECYCLE_STATES = new Set(["initializing", "ready", "closing", "closed", "error"]);
const RUNTIME_CONNECTION_PROFILE_MODES = new Set(["local-managed", "local-shared", "remote"]);
const RUNTIME_OWNERSHIP_MODES = new Set(["owned-child", "external", "remote"]);
const RUNTIME_EVENT_REPLAY_GAP_REASONS = new Set(["retention-overflow", "stream-reset", "unknown"]);
const PACKAGE_ID_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\/[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const PACKAGE_PROVIDED_ID_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*$/;
const PACKAGE_SEMVER_PATTERN = /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const PACKAGE_V0_LINE_PATTERN = /^0\.[0-9]+$/;
const PACKAGE_V0_RANGE_PATTERN = /^>=0\.[0-9]+\.[0-9]+ <0\.[0-9]+\.[0-9]+$/;
const PACKAGE_RELATIVE_PATH_PATTERN = /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[A-Za-z0-9._~!$&'()+,;=:@%/-]+$/;
const PACKAGE_SHA256_PATTERN = /^[a-fA-F0-9]{64}$/;
const PACKAGE_TARGET_TRIPLES = new Set([
  "aarch64-apple-darwin",
  "x86_64-apple-darwin",
  "x86_64-pc-windows-msvc",
  "aarch64-pc-windows-msvc",
  "x86_64-unknown-linux-gnu",
  "aarch64-unknown-linux-gnu"
]);

export function isRuntimeHealth(value: unknown): value is RuntimeHealth {
  return isRecord(value) && typeof value.ok === "boolean" && typeof value.service === "string" && typeof value.version === "string";
}

export function isRuntimeInfo(value: unknown): value is RuntimeInfo {
  return (
    isRecord(value) &&
    typeof value.name === "string" &&
    typeof value.version === "string" &&
    typeof value.apiVersion === "string" &&
    Array.isArray(value.capabilities) &&
    value.capabilities.every((capability) => typeof capability === "string")
  );
}

export function isRuntimeLogSnapshotResponse(value: unknown): value is RuntimeLogSnapshotResponse {
  return (
    isRecord(value) &&
    value.schema === "skenion.runtime.logs" &&
    typeof value.schemaVersion === "string" &&
    typeof value.ok === "boolean" &&
    Array.isArray(value.events) &&
    value.events.every(isRuntimeLogEvent) &&
    isRecord(value.retention) &&
    typeof value.retention.replayLimit === "number" &&
    Array.isArray(value.retention.replayLevels) &&
    value.retention.replayLevels.every(isRuntimeDiagnosticSeverity) &&
    Array.isArray(value.diagnostics) &&
    value.diagnostics.every(isRuntimeDiagnostic)
  );
}

export function isRuntimeLogEvent(value: unknown): value is RuntimeLogEvent {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.timestamp === "string" &&
    value.source === "runtime" &&
    isRuntimeDiagnosticSeverity(value.level) &&
    (value.code === null || typeof value.code === "string") &&
    typeof value.message === "string"
  );
}

export function isRuntimeApiResponse(value: unknown): value is RuntimeApiResponse {
  return (
    isRecord(value) &&
    typeof value.ok === "boolean" &&
    Array.isArray(value.diagnostics) &&
    value.diagnostics.every(isRuntimeDiagnostic) &&
    (value.plan === null || isRecord(value.plan)) &&
    (value.report === null || isRecord(value.report))
  );
}

export function isRuntimeSessionResponse(value: unknown): value is RuntimeSessionResponse {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, ["ok", "snapshot", "diagnostics", "report"]) &&
    typeof value.ok === "boolean" &&
    !("loaded" in value) &&
    !("graphId" in value) &&
    !("graphRevision" in value) &&
    !("viewState" in value) &&
    isRuntimeSessionSnapshot(value.snapshot) &&
    Array.isArray(value.diagnostics) &&
    value.diagnostics.every(isRuntimeDiagnostic) &&
    (value.report === null || isRecord(value.report))
  );
}

export function isRuntimeSessionInfoResponse(value: unknown): value is RuntimeSessionInfoResponse {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, ["schema", "schemaVersion", "ok", "sessionId", "lifecycle", "snapshot", "profile", "capabilities", "eventReplay", "diagnostics"]) &&
    value.schema === "skenion.runtime.session.info" &&
    value.schemaVersion === "0.1.0" &&
    typeof value.ok === "boolean" &&
    isNonEmptyString(value.sessionId) &&
    isRuntimeSessionLifecycleState(value.lifecycle) &&
    isRuntimeSessionSnapshot(value.snapshot) &&
    isRuntimeConnectionProfile(value.profile) &&
    isRuntimeSessionCapabilitySet(value.capabilities) &&
    isRuntimeEventReplayWindow(value.eventReplay) &&
    Array.isArray(value.diagnostics) &&
    value.diagnostics.every(isRuntimeDiagnostic)
  );
}

export function isRuntimeOperationEnvelope(value: unknown): value is RuntimeOperationEnvelope {
  return (
    isRecord(value) &&
    value.schema === "skenion.runtime.operation" &&
    value.schemaVersion === "0.1.0" &&
    typeof value.id === "string" &&
    value.kind === "pasteGraphFragment" &&
    isPasteGraphFragmentRequest(value.request) &&
    (value.attribution === undefined || isRuntimeOperationAttribution(value.attribution)) &&
    (value.correlationId === undefined || typeof value.correlationId === "string") &&
    (value.createdAt === undefined || typeof value.createdAt === "string")
  );
}

export function isPasteGraphFragmentRequest(value: unknown): value is PasteGraphFragmentRequest {
  const options = isRecord(value) && isPasteGraphFragmentOptions(value.options) ? value.options : undefined;
  return (
    isRecord(value) &&
    isGraphTargetRef(value.target) &&
    validateGraphFragmentV01(value.fragment, { outsideEndpointPolicy: options?.outsideEndpointPolicy }).ok &&
    (value.placement === undefined || isPastePlacement(value.placement)) &&
    (value.options === undefined || options !== undefined)
  );
}

export function isPasteGraphFragmentResponse(value: unknown): value is PasteGraphFragmentResponse {
  return (
    isRecord(value) &&
    value.schema === "skenion.runtime.paste-graph-fragment.response" &&
    value.schemaVersion === "0.1.0" &&
    typeof value.ok === "boolean" &&
    typeof value.applied === "boolean" &&
    typeof value.conflict === "boolean" &&
    isGraphTargetRef(value.target) &&
    typeof value.revisionBefore === "string" &&
    (typeof value.revisionAfter === "string" || value.revisionAfter === null) &&
    (typeof value.historyEntryId === "string" || value.historyEntryId === null) &&
    isIdRemapResult(value.idRemap) &&
    Array.isArray(value.diagnostics) &&
    value.diagnostics.every(isRuntimeOperationDiagnostic)
  );
}

export function isRuntimeSessionEvent(value: unknown): value is RuntimeSessionEvent {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, ["schema", "schemaVersion", "id", "sessionId", "sequence", "sessionRevision", "kind", "snapshot", "history", "mutation", "replay", "diagnostics", "createdAt"]) &&
    value.schema === "skenion.runtime.session.event" &&
    value.schemaVersion === "0.1.0" &&
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.sessionId) &&
    isNonNegativeInteger(value.sequence) &&
    value.sequence >= 1 &&
    isNonNegativeInteger(value.sessionRevision) &&
    isRuntimeSessionEventKind(value.kind) &&
    isRuntimeSessionSnapshot(value.snapshot) &&
    value.sessionRevision === value.snapshot.sessionRevision &&
    !("session" in value) &&
    !("graph" in value) &&
    !("viewState" in value) &&
    !("graphEvent" in value) &&
    isRuntimeHistory(value.history) &&
    (value.mutation === undefined || isRuntimeHistoryEntry(value.mutation)) &&
    isRuntimeEventReplayMetadata(value.replay) &&
    Array.isArray(value.diagnostics) &&
    value.diagnostics.every(isRuntimeDiagnostic) &&
    isNonEmptyString(value.createdAt)
  );
}

function isRuntimeSessionLifecycleState(value: unknown): value is RuntimeSessionLifecycleState {
  return typeof value === "string" && RUNTIME_SESSION_LIFECYCLE_STATES.has(value);
}

function isRuntimeConnectionProfileMode(value: unknown): value is RuntimeConnectionProfileMode {
  return typeof value === "string" && RUNTIME_CONNECTION_PROFILE_MODES.has(value);
}

function isRuntimeOwnershipMode(value: unknown): value is RuntimeOwnershipMode {
  return typeof value === "string" && RUNTIME_OWNERSHIP_MODES.has(value);
}

function isRuntimeEndpointMetadata(value: unknown): value is RuntimeEndpointMetadata {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, ["url", "canonicalUrl", "protocol", "host", "port", "tls"]) &&
    isNonEmptyString(value.url) &&
    (value.canonicalUrl === undefined || isNonEmptyString(value.canonicalUrl)) &&
    (value.protocol === "http" || value.protocol === "https") &&
    (value.host === undefined || isNonEmptyString(value.host)) &&
    (value.port === undefined || (typeof value.port === "number" && Number.isInteger(value.port) && value.port >= 0 && value.port <= 65535)) &&
    (value.tls === undefined || typeof value.tls === "boolean")
  );
}

function isRuntimeProcessMetadata(value: unknown): value is RuntimeProcessMetadata {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, ["ownedByHost", "pid", "executablePath", "workingDirectory", "startedAt", "ownerWindowId", "platform", "arch"]) &&
    typeof value.ownedByHost === "boolean" &&
    (value.pid === undefined || (typeof value.pid === "number" && Number.isInteger(value.pid) && value.pid >= 1)) &&
    (value.executablePath === undefined || isNonEmptyString(value.executablePath)) &&
    (value.workingDirectory === undefined || isNonEmptyString(value.workingDirectory)) &&
    (value.startedAt === undefined || typeof value.startedAt === "string") &&
    (value.ownerWindowId === undefined || isNonEmptyString(value.ownerWindowId)) &&
    (value.platform === undefined || isNonEmptyString(value.platform)) &&
    (value.arch === undefined || isNonEmptyString(value.arch))
  );
}

function isRuntimeConnectionProfile(value: unknown): value is RuntimeConnectionProfile {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, ["mode", "ownership", "displayName", "endpoint", "process"]) &&
    isRuntimeConnectionProfileMode(value.mode) &&
    isRuntimeOwnershipMode(value.ownership) &&
    runtimeProfileOwnershipMatches(value.mode, value.ownership) &&
    (value.displayName === undefined || typeof value.displayName === "string") &&
    isRuntimeEndpointMetadata(value.endpoint) &&
    (value.process === undefined || value.process === null || isRuntimeProcessMetadata(value.process))
  );
}

function isRuntimeEventReplayWindow(value: unknown): value is RuntimeEventReplayWindow {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, ["cursorKind", "currentCursor", "earliestSequence", "latestSequence", "replayLimit", "overflow"]) &&
    value.cursorKind === "sequence" &&
    isNonEmptyString(value.currentCursor) &&
    isNonNegativeInteger(value.earliestSequence) &&
    value.earliestSequence >= 1 &&
    isNonNegativeInteger(value.latestSequence) &&
    (value.replayLimit === null || (typeof value.replayLimit === "number" && Number.isInteger(value.replayLimit) && value.replayLimit >= 0)) &&
    (value.overflow === undefined || typeof value.overflow === "boolean")
  );
}

function isRuntimeSessionCapabilitySet(value: unknown): value is RuntimeSessionCapabilitySet {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, ["sessionAddressing", "eventReplay", "multiWindow", "profiles", "authPolicy"]) &&
    typeof value.sessionAddressing === "boolean" &&
    typeof value.eventReplay === "boolean" &&
    typeof value.multiWindow === "boolean" &&
    Array.isArray(value.profiles) &&
    value.profiles.every(isRuntimeConnectionProfileMode) &&
    value.authPolicy === "deferred"
  );
}

function isRuntimeEventReplayGap(value: unknown): value is RuntimeEventReplayGap {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, ["expectedSequence", "actualSequence", "reason"]) &&
    isNonNegativeInteger(value.expectedSequence) &&
    value.expectedSequence >= 1 &&
    isNonNegativeInteger(value.actualSequence) &&
    value.actualSequence >= 1 &&
    value.expectedSequence < value.actualSequence &&
    typeof value.reason === "string" &&
    RUNTIME_EVENT_REPLAY_GAP_REASONS.has(value.reason)
  );
}

function isRuntimeEventReplayMetadata(value: unknown): value is RuntimeEventReplayMetadata {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, ["cursor", "previousCursor", "replayed", "gap", "overflow"]) &&
    isNonEmptyString(value.cursor) &&
    (value.previousCursor === null || isNonEmptyString(value.previousCursor)) &&
    typeof value.replayed === "boolean" &&
    (value.gap === null || isRuntimeEventReplayGap(value.gap)) &&
    typeof value.overflow === "boolean"
  );
}

export function isRuntimeHistory(value: unknown): value is RuntimeHistory {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, ["schema", "schemaVersion", "entries", "canUndo", "canRedo", "undoDepth", "redoDepth"]) &&
    value.schema === "skenion.runtime.history" &&
    value.schemaVersion === "0.1.0" &&
    Array.isArray(value.entries) &&
    value.entries.every(isRuntimeHistoryEntry) &&
    typeof value.canUndo === "boolean" &&
    typeof value.canRedo === "boolean" &&
    isNonNegativeInteger(value.undoDepth) &&
    isNonNegativeInteger(value.redoDepth)
  );
}

export function isRuntimeControlEventResponse(value: unknown): value is RuntimeControlEventResponse {
  return (
    isRecord(value) &&
    typeof value.ok === "boolean" &&
    typeof value.changed === "boolean" &&
    (typeof value.controlRevision === "number" || value.controlRevision === null) &&
    Array.isArray(value.emitted) &&
    value.emitted.every(isRuntimeControlEmission) &&
    Array.isArray(value.diagnostics) &&
    value.diagnostics.every(isRuntimeDiagnostic)
  );
}

export function isRuntimeControlStateResponse(value: unknown): value is RuntimeControlStateResponse {
  return (
    isRecord(value) &&
    typeof value.ok === "boolean" &&
    typeof value.controlRevision === "number" &&
    isRecord(value.values) &&
    Object.values(value.values).every(isRuntimeControlValue) &&
    isRecord(value.channels) &&
    Object.values(value.channels).every(isRuntimeControlMessage) &&
    Array.isArray(value.diagnostics) &&
    value.diagnostics.every(isRuntimeDiagnostic)
  );
}

export function isRuntimeControlReadResponse(value: unknown): value is RuntimeControlReadResponse {
  return (
    isRecord(value) &&
    typeof value.ok === "boolean" &&
    isRuntimeControlReadRequest(value.address) &&
    (value.value === null || isRuntimeControlReadValue(value.value)) &&
    Array.isArray(value.diagnostics) &&
    value.diagnostics.every(isRuntimeDiagnostic)
  );
}

export function isRuntimePreviewStatus(value: unknown): value is RuntimePreviewStatus {
  return (
    isRecord(value) &&
    typeof value.ok === "boolean" &&
    isRuntimePreviewState(value.state) &&
    (typeof value.pid === "number" || value.pid === null) &&
    (typeof value.graphId === "string" || value.graphId === null) &&
    (typeof value.graphRevision === "string" || value.graphRevision === null) &&
    (typeof value.sessionRevision === "number" || value.sessionRevision === null) &&
    (typeof value.previewSessionRevision === "number" || value.previewSessionRevision === null) &&
    (typeof value.controlRevision === "number" || value.controlRevision === null) &&
    (typeof value.previewControlRevision === "number" || value.previewControlRevision === null) &&
    typeof value.controlLive === "boolean" &&
    (typeof value.lastControlUpdateAt === "string" || value.lastControlUpdateAt === null) &&
    typeof value.stale === "boolean" &&
    (typeof value.startedAt === "string" || value.startedAt === null) &&
    (typeof value.exitedAt === "string" || value.exitedAt === null) &&
    (typeof value.exitCode === "number" || value.exitCode === null) &&
    (typeof value.message === "string" || value.message === null) &&
    Array.isArray(value.diagnostics) &&
    value.diagnostics.every(isRuntimeDiagnostic)
  );
}

export function isRuntimeAssetImportResponse(value: unknown): value is RuntimeAssetImportResponse {
  return (
    isRecord(value) &&
    typeof value.ok === "boolean" &&
    (value.asset === null || isRuntimeAsset(value.asset)) &&
    Array.isArray(value.diagnostics) &&
    value.diagnostics.every(isRuntimeDiagnostic)
  );
}

export function isRuntimeAssetListResponse(value: unknown): value is RuntimeAssetListResponse {
  return (
    isRecord(value) &&
    typeof value.ok === "boolean" &&
    Array.isArray(value.assets) &&
    value.assets.every(isRuntimeAsset) &&
    Array.isArray(value.diagnostics) &&
    value.diagnostics.every(isRuntimeDiagnostic)
  );
}

export function isRuntimeAssetGetResponse(value: unknown): value is RuntimeAssetGetResponse {
  return (
    isRecord(value) &&
    typeof value.ok === "boolean" &&
    (value.asset === null || isRuntimeAsset(value.asset)) &&
    Array.isArray(value.diagnostics) &&
    value.diagnostics.every(isRuntimeDiagnostic)
  );
}

export function isRuntimeIoDeviceListResponse(value: unknown): value is RuntimeIoDeviceListResponse {
  return (
    isRecord(value) &&
    typeof value.ok === "boolean" &&
    Array.isArray(value.devices) &&
    value.devices.every(isRuntimeIoDeviceDescriptor) &&
    Array.isArray(value.diagnostics) &&
    value.diagnostics.every(isRuntimeIoDiagnostic)
  );
}

export function isRuntimeTelemetrySnapshot(value: unknown): value is RuntimeTelemetrySnapshot {
  return (
    isRecord(value) &&
    value.schema === "skenion.runtime.telemetry" &&
    value.schemaVersion === "0.1.0" &&
    typeof value.ok === "boolean" &&
    typeof value.timestamp === "string" &&
    isRuntimeTelemetrySession(value.session) &&
    isRuntimeTelemetryPreview(value.preview) &&
    isRuntimeTelemetryRender(value.render) &&
    isRuntimeTelemetryProcess(value.process) &&
    Array.isArray(value.diagnostics) &&
    value.diagnostics.every(isRuntimeDiagnostic)
  );
}

export function isRuntimeGeneratedShaderResponse(value: unknown): value is RuntimeGeneratedShaderResponse {
  return (
    isRecord(value) &&
    typeof value.ok === "boolean" &&
    (typeof value.nodeId === "string" || value.nodeId === null) &&
    (value.language === "wgsl" || value.language === null) &&
    (typeof value.source === "string" || value.source === null) &&
    (value.sourceMap === null || isGeneratedShaderSourceMap(value.sourceMap)) &&
    Array.isArray(value.diagnostics) &&
    value.diagnostics.every(isShaderDiagnostic)
  );
}

export function isRuntimeExtensionListResponse(value: unknown): value is RuntimeExtensionListResponse {
  return (
    isRecord(value) &&
    typeof value.ok === "boolean" &&
    Array.isArray(value.extensions) &&
    value.extensions.every(isRuntimeExtensionDescriptor) &&
    Array.isArray(value.diagnostics) &&
    value.diagnostics.every(isRuntimeDiagnostic)
  );
}

export function isPackageRegistryListResponse(value: unknown): value is PackageRegistryListResponseV01 {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, ["ok", "packages", "diagnostics"]) &&
    typeof value.ok === "boolean" &&
    Array.isArray(value.packages) &&
    value.packages.every(isPackageRegistryEntry) &&
    Array.isArray(value.diagnostics) &&
    value.diagnostics.every(isPackageDiagnostic)
  );
}

export function isExtensionManifestV01(value: unknown): value is ExtensionManifestV01 {
  return validateExtensionManifestV01(value).ok;
}

function isRuntimeSessionSnapshot(value: unknown): value is RuntimeSessionSnapshot {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, ["sessionRevision", "viewRevision", "controlRevision", "project", "diagnostics", "plan"]) &&
    isNonNegativeInteger(value.sessionRevision) &&
    isNonNegativeInteger(value.viewRevision) &&
    isNonNegativeInteger(value.controlRevision) &&
    (value.project === null || isRuntimeProjectSnapshot(value.project)) &&
    Array.isArray(value.diagnostics) &&
    value.diagnostics.every(isRuntimeDiagnostic) &&
    (value.plan === null || isRecord(value.plan))
  );
}

function isRuntimeProjectSnapshot(value: unknown): boolean {
  return validateProjectDocumentV01(value).ok;
}

function isRuntimeSessionEventKind(value: unknown): value is RuntimeSessionEventKind {
  return (
    value === "snapshot" ||
    value === "load" ||
    value === "clear" ||
    value === "mutate" ||
    value === "undo" ||
    value === "redo"
  );
}

function isGraphTargetRef(value: unknown): value is GraphTargetRef {
  return (
    isRecord(value) &&
    isPatchPath(value.path) &&
    typeof value.baseRevision === "string" &&
    (value.targetRevision === undefined || typeof value.targetRevision === "string")
  );
}

function isPatchPath(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }
  if (value.kind === "root") {
    return true;
  }
  if (value.kind === "project-patch-definition") {
    return typeof value.patchId === "string";
  }
  if (value.kind === "package-patch-definition") {
    return (
      typeof value.packageId === "string" &&
      typeof value.patchId === "string" &&
      (value.version === undefined || typeof value.version === "string")
    );
  }
  if (value.kind === "embedded-patch-instance") {
    return Array.isArray(value.ownerPath) && value.ownerPath.every((entry) => typeof entry === "string") && typeof value.nodeId === "string";
  }
  if (value.kind === "help-working-copy") {
    return (
      typeof value.workingCopyId === "string" &&
      (value.sourcePackageId === undefined || typeof value.sourcePackageId === "string") &&
      (value.sourcePatchId === undefined || typeof value.sourcePatchId === "string")
    );
  }
  return false;
}

function isPastePlacement(value: unknown): value is PastePlacement {
  if (!isRecord(value)) {
    return false;
  }
  if (value.kind === "position") {
    return typeof value.x === "number" && Number.isFinite(value.x) && typeof value.y === "number" && Number.isFinite(value.y);
  }
  if (value.kind === "anchor") {
    return (
      typeof value.nodeId === "string" &&
      (value.offsetX === undefined || (typeof value.offsetX === "number" && Number.isFinite(value.offsetX))) &&
      (value.offsetY === undefined || (typeof value.offsetY === "number" && Number.isFinite(value.offsetY)))
    );
  }
  return false;
}

function isPasteGraphFragmentOptions(value: unknown): value is PasteGraphFragmentOptions {
  return (
    value === undefined ||
    (
      isRecord(value) &&
      (value.outsideEndpointPolicy === undefined || value.outsideEndpointPolicy === "reject" || value.outsideEndpointPolicy === "omit") &&
      (value.idConflictPolicy === undefined || value.idConflictPolicy === "remap" || value.idConflictPolicy === "reject") &&
      (
        value.interfaceIncidentEdgePolicy === undefined ||
        (typeof value.interfaceIncidentEdgePolicy === "string" && INTERFACE_INCIDENT_EDGE_POLICIES.has(value.interfaceIncidentEdgePolicy))
      ) &&
      (value.preserveRelativePositions === undefined || typeof value.preserveRelativePositions === "boolean")
    )
  );
}

function isRuntimeOperationAttribution(value: unknown): value is RuntimeOperationAttribution {
  return (
    isRecord(value) &&
    (value.actorId === undefined || typeof value.actorId === "string") &&
    (value.clientId === undefined || typeof value.clientId === "string") &&
    (value.label === undefined || typeof value.label === "string")
  );
}

function isIdRemapResult(value: unknown): value is IdRemapResult {
  return (
    isRecord(value) &&
    isStringRecord(value.nodeIdMap) &&
    isStringRecord(value.edgeIdMap) &&
    Array.isArray(value.omittedEdgeIds) &&
    value.omittedEdgeIds.every((entry) => typeof entry === "string")
  );
}

function isRuntimeOperationDiagnostic(value: unknown): value is RuntimeOperationDiagnostic {
  return (
    isRecord(value) &&
    (value.severity === "error" || value.severity === "warning" || value.severity === "info") &&
    typeof value.code === "string" &&
    RUNTIME_OPERATION_DIAGNOSTIC_CODES.has(value.code) &&
    typeof value.message === "string" &&
    (value.path === undefined || typeof value.path === "string") &&
    (value.target === undefined || isGraphTargetRef(value.target)) &&
    (value.expectedRevision === undefined || typeof value.expectedRevision === "string") &&
    (value.actualRevision === undefined || typeof value.actualRevision === "string") &&
    (value.duplicates === undefined || (Array.isArray(value.duplicates) && value.duplicates.every((entry) => typeof entry === "string"))) &&
    (value.nodes === undefined || (Array.isArray(value.nodes) && value.nodes.every((entry) => typeof entry === "string"))) &&
    (value.edges === undefined || (Array.isArray(value.edges) && value.edges.every((entry) => typeof entry === "string"))) &&
    (value.interfacePolicy === undefined || (typeof value.interfacePolicy === "string" && INTERFACE_INCIDENT_EDGE_POLICIES.has(value.interfacePolicy))) &&
    (value.interfaceDetail === undefined || isInterfaceDiagnosticDetail(value.interfaceDetail)) &&
    ((value.code !== "interface-drift" && value.code !== "invalid-incident-edge") || value.interfaceDetail !== undefined)
  );
}

function isInterfaceDiagnosticDetail(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.edgeId === "string" &&
    typeof value.sourceNodeId === "string" &&
    typeof value.sourcePortId === "string" &&
    typeof value.targetNodeId === "string" &&
    typeof value.targetPortId === "string" &&
    (value.missingEndpoint === undefined || (typeof value.missingEndpoint === "string" && INTERFACE_MISSING_ENDPOINTS.has(value.missingEndpoint))) &&
    (value.expectedDirection === undefined || value.expectedDirection === "input" || value.expectedDirection === "output") &&
    (value.actualDirection === undefined || value.actualDirection === "input" || value.actualDirection === "output") &&
    (value.expectedType === undefined || typeof value.expectedType === "string") &&
    (value.actualType === undefined || typeof value.actualType === "string") &&
    (value.cardinality === undefined || isInterfaceDiagnosticCardinality(value.cardinality)) &&
    Array.isArray(value.recoveryActions) &&
    value.recoveryActions.length > 0 &&
    value.recoveryActions.every((entry) => typeof entry === "string" && INTERFACE_RECOVERY_ACTION_IDS.has(entry))
  );
}

function isInterfaceDiagnosticCardinality(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.reason === "string" &&
    INTERFACE_CARDINALITY_REASONS.has(value.reason) &&
    (value.policy === undefined || typeof value.policy === "string") &&
    (value.limit === undefined || value.limit === null || (typeof value.limit === "number" && Number.isInteger(value.limit) && value.limit >= 0)) &&
    (value.actual === undefined || (typeof value.actual === "number" && Number.isInteger(value.actual) && value.actual >= 0))
  );
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return isRecord(value) && Object.values(value).every((entry) => typeof entry === "string");
}

function isRuntimeControlReadRequest(value: unknown): value is RuntimeControlReadRequest {
  return (
    isRecord(value) &&
    typeof value.nodeId === "string" &&
    (value.target === "param" || value.target === "port" || value.target === "state") &&
    typeof value.id === "string"
  );
}

function isRuntimeControlReadValue(value: unknown): value is RuntimeControlReadValue {
  return isRuntimeControlValue(value) || (isRecord(value) && value.type === "json" && "value" in value);
}

function isRuntimeControlEmission(value: unknown): value is RuntimeControlEmission {
  return (
    isRecord(value) &&
    typeof value.nodeId === "string" &&
    (value.portId === "value" || value.portId === "in" || value.portId === "out") &&
    isRuntimeControlMessage(value.message)
  );
}

function isRuntimeControlMessage(value: unknown): value is RuntimeControlMessage {
  return (
    isRecord(value) &&
    typeof value.selector === "string" &&
    Array.isArray(value.atoms) &&
    value.atoms.every(isRuntimeControlValue)
  );
}

function isRuntimeControlValue(value: unknown): value is RuntimeControlValue {
  if (!isRecord(value) || typeof value.type !== "string") {
    return false;
  }

  if (value.type === "float") {
    return typeof value.representation === "string" && typeof value.value === "number" && Number.isFinite(value.value);
  }
  if (value.type === "int" || value.type === "uint") {
    return typeof value.representation === "string" && typeof value.value === "number" && Number.isInteger(value.value);
  }
  if (value.type === "bool") {
    return typeof value.value === "boolean";
  }
  if (value.type === "string") {
    return typeof value.value === "string";
  }
  if (value.type === "color") {
    return (
      typeof value.representation === "string" &&
      typeof value.colorSpace === "string" &&
      Array.isArray(value.value) &&
      value.value.length === 4 &&
      value.value.every((component) => typeof component === "number" && Number.isFinite(component))
    );
  }

  return false;
}

function isRuntimeAsset(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.mimeType === "string" &&
    typeof value.kind === "string" &&
    typeof value.sizeBytes === "number" &&
    Number.isFinite(value.sizeBytes) &&
    typeof value.runtimeUri === "string"
  );
}

function isRuntimeIoDeviceDescriptor(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    (value.transportKind === "midi" || value.transportKind === "hid" || value.transportKind === "serial" || value.transportKind === "inline") &&
    Array.isArray(value.directions) &&
    value.directions.every((direction) => direction === "input" || direction === "output") &&
    typeof value.backend === "string" &&
    (value.index === undefined || (typeof value.index === "number" && Number.isInteger(value.index) && value.index >= 0)) &&
    typeof value.stable === "boolean"
  );
}

function isRuntimeIoDiagnostic(value: unknown): boolean {
  return (
    isRecord(value) &&
    (value.severity === "error" || value.severity === "warning") &&
    typeof value.code === "string" &&
    typeof value.message === "string"
  );
}

function isRuntimeTelemetrySession(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.loaded === "boolean" &&
    (typeof value.graphId === "string" || value.graphId === null) &&
    (typeof value.graphRevision === "string" || value.graphRevision === null) &&
    typeof value.sessionRevision === "number" &&
    typeof value.controlRevision === "number"
  );
}

function isRuntimeTelemetryPreview(value: unknown): boolean {
  return (
    isRecord(value) &&
    isRuntimePreviewState(value.state) &&
    (typeof value.pid === "number" || value.pid === null) &&
    typeof value.stale === "boolean" &&
    (typeof value.graphId === "string" || value.graphId === null) &&
    (typeof value.graphRevision === "string" || value.graphRevision === null) &&
    (typeof value.sessionRevision === "number" || value.sessionRevision === null) &&
    (typeof value.previewSessionRevision === "number" || value.previewSessionRevision === null) &&
    (typeof value.controlRevision === "number" || value.controlRevision === null) &&
    (typeof value.previewControlRevision === "number" || value.previewControlRevision === null) &&
    typeof value.controlLive === "boolean" &&
    (typeof value.lastControlUpdateAt === "string" || value.lastControlUpdateAt === null)
  );
}

function isRuntimeTelemetryRender(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.active === "boolean" &&
    (typeof value.backend === "string" || value.backend === null) &&
    (typeof value.renderer === "string" || value.renderer === null) &&
    typeof value.framesRendered === "number" &&
    (typeof value.approxFps === "number" || value.approxFps === null) &&
    (typeof value.lastFrameMs === "number" || value.lastFrameMs === null) &&
    (typeof value.lastError === "string" || value.lastError === null) &&
    (typeof value.sourceNodeId === "string" || value.sourceNodeId === null) &&
    Array.isArray(value.diagnostics) &&
    value.diagnostics.every(isShaderDiagnostic) &&
    typeof value.generatedSourceAvailable === "boolean" &&
    (typeof value.controlRevision === "number" || value.controlRevision === null) &&
    (typeof value.previewControlRevision === "number" || value.previewControlRevision === null) &&
    typeof value.controlLive === "boolean" &&
    (typeof value.lastControlUpdateAt === "string" || value.lastControlUpdateAt === null)
  );
}

function isRuntimeTelemetryProcess(value: unknown): boolean {
  return isRecord(value) && typeof value.runtimeVersion === "string" && typeof value.uptimeMs === "number";
}

function isRuntimeExtensionDescriptor(value: unknown): value is RuntimeExtensionDescriptor {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.version === "string" &&
    (value.kind === "core-package" || value.kind === "native-runtime" || value.kind === "codec" || value.kind === "node-pack") &&
    typeof value.runtimeAbiVersion === "string" &&
    typeof value.manifestPath === "string" &&
    (value.status === "loaded" || value.status === "disabled" || value.status === "failed") &&
    Array.isArray(value.capabilities) &&
    value.capabilities.every((entry) => typeof entry === "string") &&
    Array.isArray(value.providedNodes) &&
    value.providedNodes.every((entry) => typeof entry === "string") &&
    Array.isArray(value.providedCodecs) &&
    value.providedCodecs.every((entry) => typeof entry === "string") &&
    Array.isArray(value.providedTransports) &&
    value.providedTransports.every((entry) => typeof entry === "string") &&
    Array.isArray(value.providedHelp) &&
    value.providedHelp.every((entry) => typeof entry === "string") &&
    Array.isArray(value.testIds) &&
    value.testIds.every((entry) => typeof entry === "string") &&
    Array.isArray(value.diagnostics) &&
    value.diagnostics.every(isRuntimeDiagnostic)
  );
}

function isPackageRegistryEntry(value: unknown): value is PackageRegistryEntryV01 {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, [
      "packageId",
      "version",
      "category",
      "source",
      "root",
      "trust",
      "contracts",
      "runtimeAbiRange",
      "targets",
      "manifestPath",
      "manifestChecksum",
      "provides",
      "diagnostics"
    ]) &&
    isPackageId(value.packageId) &&
    isPackageSemver(value.version) &&
    isPackageCategory(value.category) &&
    isPackageSource(value.source) &&
    isPackageRoot(value.root) &&
    isPackageTrust(value.trust) &&
    isPackageContracts(value.contracts) &&
    (value.runtimeAbiRange === undefined || isPackageV0Range(value.runtimeAbiRange)) &&
    (
      value.targets === undefined ||
      (Array.isArray(value.targets) && value.targets.every(isPackageTargetTriple))
    ) &&
    isPackageRelativePath(value.manifestPath) &&
    isPackageChecksum(value.manifestChecksum) &&
    isPackageProvides(value.provides) &&
    Array.isArray(value.diagnostics) &&
    value.diagnostics.every(isPackageDiagnostic)
  );
}

function isPackageContracts(value: unknown): boolean {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, ["line", "range"]) &&
    typeof value.line === "string" &&
    PACKAGE_V0_LINE_PATTERN.test(value.line) &&
    isPackageV0Range(value.range)
  );
}

function isPackageProvides(value: unknown): boolean {
  if (!isRecord(value)) {
    return false;
  }
  if (!hasOnlyKeys(value, ["patches", "nodes", "resources", "help"])) {
    return false;
  }
  for (const key of ["patches", "nodes", "resources", "help"]) {
    const provided = value[key];
    if (provided !== undefined && (!Array.isArray(provided) || !provided.every(isPackageProvidedRef))) {
      return false;
    }
  }
  return true;
}

function isPackageProvidedRef(value: unknown): boolean {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, ["id", "path", "description"]) &&
    isPackageProvidedId(value.id) &&
    isPackageRelativePath(value.path) &&
    (value.description === undefined || typeof value.description === "string")
  );
}

function isPackageChecksum(value: unknown): boolean {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, ["algorithm", "value"]) &&
    value.algorithm === "sha256" &&
    typeof value.value === "string" &&
    PACKAGE_SHA256_PATTERN.test(value.value)
  );
}

function isPackageDiagnostic(value: unknown): boolean {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, ["severity", "code", "message", "details"]) &&
    isRuntimeDiagnosticSeverity(value.severity) &&
    isNonEmptyString(value.code) &&
    isNonEmptyString(value.message) &&
    (value.details === undefined || isJsonValue(value.details))
  );
}

function isPackageId(value: unknown): value is string {
  return typeof value === "string" && PACKAGE_ID_PATTERN.test(value);
}

function isPackageProvidedId(value: unknown): value is string {
  return typeof value === "string" && PACKAGE_PROVIDED_ID_PATTERN.test(value);
}

function isPackageSemver(value: unknown): value is string {
  return typeof value === "string" && PACKAGE_SEMVER_PATTERN.test(value);
}

function isPackageV0Range(value: unknown): value is string {
  return typeof value === "string" && PACKAGE_V0_RANGE_PATTERN.test(value);
}

function isPackageRelativePath(value: unknown): value is string {
  return typeof value === "string" && PACKAGE_RELATIVE_PATH_PATTERN.test(value);
}

function isPackageTargetTriple(value: unknown): value is string {
  return typeof value === "string" && PACKAGE_TARGET_TRIPLES.has(value);
}

function isPackageCategory(value: unknown): boolean {
  return value === "patch" || value === "native" || value === "mixed";
}

function isPackageSource(value: unknown): boolean {
  return value === "first-party" || value === "marketplace" || value === "workspace" || value === "project-local";
}

function isPackageRoot(value: unknown): boolean {
  return value === "package" || value === "project" || value === "dev-link" || value === "marketplace-install";
}

function isPackageTrust(value: unknown): boolean {
  return value === "trusted" || value === "untrusted" || value === "quarantined";
}

function isGeneratedShaderSourceMap(value: unknown): value is GeneratedShaderSourceMapV01 {
  return (
    isRecord(value) &&
    typeof value.userSourceStartLine === "number" &&
    Number.isInteger(value.userSourceStartLine) &&
    value.userSourceStartLine >= 1 &&
    typeof value.generatedLineOffset === "number" &&
    Number.isInteger(value.generatedLineOffset) &&
    value.generatedLineOffset >= 0
  );
}

function isRuntimeHistoryEntry(value: unknown): boolean {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, ["id", "sequence", "kind", "mutation", "inverseMutation", "subjectEventId", "clientId", "description", "createdAt"]) &&
    isNonEmptyString(value.id) &&
    isNonNegativeInteger(value.sequence) &&
    value.sequence >= 1 &&
    (value.kind === "apply" || value.kind === "undo" || value.kind === "redo") &&
    isRuntimeMutationRequest(value.mutation) &&
    isRuntimeMutationRequest(value.inverseMutation) &&
    (value.subjectEventId === undefined || isNonEmptyString(value.subjectEventId)) &&
    (value.clientId === undefined || isNonEmptyString(value.clientId)) &&
    (value.description === undefined || typeof value.description === "string") &&
    isNonEmptyString(value.createdAt)
  );
}

function isRuntimeMutationRequest(value: unknown): value is RuntimeMutationRequest {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, ["operation", "viewPatch", "clientId", "description"]) &&
    (value.operation === undefined || isRuntimeOperationEnvelope(value.operation)) &&
    (value.viewPatch === undefined || isRuntimeViewPatch(value.viewPatch)) &&
    (value.clientId === undefined || isNonEmptyString(value.clientId)) &&
    (value.description === undefined || typeof value.description === "string")
  );
}

function isRuntimeViewPatch(value: unknown): boolean {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, ["baseViewRevision", "ops"]) &&
    isNonNegativeInteger(value.baseViewRevision) &&
    Array.isArray(value.ops) &&
    value.ops.every(isRuntimeViewPatchOperation)
  );
}

function isRuntimeViewPatchOperation(value: unknown): boolean {
  if (!isRecord(value) || !isNonEmptyString(value.nodeId)) {
    return false;
  }
  if (value.op === "setNodeView") {
    return hasOnlyKeys(value, ["op", "nodeId", "view"]) && isCanvasNodeView(value.view);
  }
  if (value.op === "moveNodeView") {
    return hasOnlyKeys(value, ["op", "nodeId", "from", "to"]) && (value.from === undefined || isCanvasNodeView(value.from)) && isCanvasNodeView(value.to);
  }
  return false;
}

function isCanvasNodeView(value: unknown): value is CanvasNodeViewV01 {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, ["x", "y", "width", "height", "collapsed"]) &&
    typeof value.x === "number" &&
    Number.isFinite(value.x) &&
    typeof value.y === "number" &&
    Number.isFinite(value.y) &&
    (value.width === undefined || (typeof value.width === "number" && Number.isFinite(value.width))) &&
    (value.height === undefined || (typeof value.height === "number" && Number.isFinite(value.height))) &&
    (value.collapsed === undefined || typeof value.collapsed === "boolean")
  );
}

function isRuntimeDiagnostic(value: unknown): value is RuntimeDiagnostic {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, ["severity", "message", "code", "details"]) &&
    typeof value.message === "string" &&
    isRuntimeDiagnosticSeverity(value.severity) &&
    (value.code === undefined || typeof value.code === "string") &&
    (!("details" in value) || isJsonValue(value.details))
  );
}

function isRuntimeDiagnosticSeverity(value: unknown): value is RuntimeDiagnosticSeverity {
  return value === "error" || value === "warning" || value === "info";
}

function isShaderDiagnostic(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.severity === "string" &&
    SHADER_DIAGNOSTIC_SEVERITIES.has(value.severity) &&
    typeof value.phase === "string" &&
    SHADER_DIAGNOSTIC_PHASES.has(value.phase) &&
    typeof value.code === "string" &&
    typeof value.message === "string" &&
    typeof value.source === "string" &&
    SHADER_DIAGNOSTIC_SOURCES.has(value.source) &&
    optionalPositiveInteger(value.line) &&
    optionalPositiveInteger(value.column) &&
    optionalPositiveInteger(value.endLine) &&
    optionalPositiveInteger(value.endColumn) &&
    (typeof value.uniformId === "string" || value.uniformId === undefined)
  );
}

function isRuntimePreviewState(value: unknown): boolean {
  return value === "stopped" || value === "starting" || value === "running" || value === "exited" || value === "error";
}

function runtimeProfileOwnershipMatches(mode: RuntimeConnectionProfileMode, ownership: RuntimeOwnershipMode): boolean {
  return (
    (mode === "local-managed" && ownership === "owned-child") ||
    (mode === "local-shared" && ownership === "external") ||
    (mode === "remote" && ownership === "remote")
  );
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function hasOnlyKeys(value: Record<string, unknown>, keys: string[]): boolean {
  const allowed = new Set(keys);
  return Object.keys(value).every((key) => allowed.has(key));
}

function optionalPositiveInteger(value: unknown): boolean {
  return value === undefined || (typeof value === "number" && Number.isInteger(value) && value >= 1);
}

function isJsonValue(value: unknown): boolean {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return true;
  }
  if (typeof value === "number") {
    return Number.isFinite(value);
  }
  if (Array.isArray(value)) {
    return value.every(isJsonValue);
  }
  if (isRecord(value)) {
    return Object.values(value).every(isJsonValue);
  }
  return false;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
