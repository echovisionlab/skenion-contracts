import {
  validateExtensionManifestV01,
  validateGraphFragmentV02,
  validateGraphDocument,
  validateGraphPatch,
  validateViewState
} from "./validate.js";
import type {
  CanvasNodeViewV01,
  ExtensionManifestV01,
  GeneratedShaderSourceMapV01,
  GraphTargetRef,
  IdRemapResult,
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
  RuntimePatchResponse,
  RuntimePreviewStatus,
  RuntimeSessionEvent,
  RuntimeSessionEventKind,
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
  "invalid-target-path",
  "operation-rebased",
  "target-not-found",
  "unsupported-operation"
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

export function isRuntimePatchResponse(value: unknown): value is RuntimePatchResponse {
  return (
    isRecord(value) &&
    typeof value.ok === "boolean" &&
    typeof value.applied === "boolean" &&
    typeof value.conflict === "boolean" &&
    !("graph" in value) &&
    !("viewState" in value) &&
    !("session" in value) &&
    !("event" in value) &&
    isRuntimeSessionSnapshot(value.snapshot) &&
    isRuntimeHistory(value.history) &&
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
    validateGraphFragmentV02(value.fragment, { outsideEndpointPolicy: options?.outsideEndpointPolicy }).ok &&
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
    value.schema === "skenion.runtime.session.event" &&
    typeof value.schemaVersion === "string" &&
    typeof value.id === "string" &&
    typeof value.sessionId === "string" &&
    typeof value.sequence === "number" &&
    isRuntimeSessionEventKind(value.kind) &&
    isRuntimeSessionSnapshot(value.snapshot) &&
    !("session" in value) &&
    !("graph" in value) &&
    !("viewState" in value) &&
    !("graphEvent" in value) &&
    isRuntimeHistory(value.history) &&
    (value.mutation === undefined || isRuntimeHistoryEntry(value.mutation)) &&
    Array.isArray(value.diagnostics) &&
    value.diagnostics.every(isRuntimeDiagnostic) &&
    typeof value.createdAt === "string"
  );
}

export function isRuntimeHistory(value: unknown): value is RuntimeHistory {
  return (
    isRecord(value) &&
    value.schema === "skenion.runtime.history" &&
    typeof value.schemaVersion === "string" &&
    Array.isArray(value.entries) &&
    value.entries.every(isRuntimeHistoryEntry) &&
    typeof value.canUndo === "boolean" &&
    typeof value.canRedo === "boolean" &&
    typeof value.undoDepth === "number" &&
    typeof value.redoDepth === "number"
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

export function isExtensionManifestV01(value: unknown): value is ExtensionManifestV01 {
  return validateExtensionManifestV01(value).ok;
}

function isRuntimeSessionSnapshot(value: unknown): value is RuntimeSessionSnapshot {
  return (
    isRecord(value) &&
    typeof value.sessionRevision === "number" &&
    typeof value.viewRevision === "number" &&
    typeof value.controlRevision === "number" &&
    (value.project === null || isRuntimeProjectSnapshot(value.project)) &&
    Array.isArray(value.diagnostics) &&
    value.diagnostics.every(isRuntimeDiagnostic) &&
    (value.plan === null || isRecord(value.plan))
  );
}

function isRuntimeProjectSnapshot(value: unknown): boolean {
  return (
    isRecord(value) &&
    validateGraphDocument(value.graph).ok &&
    validateViewState(value.viewState).ok &&
    Array.isArray(value.nodes) &&
    value.nodes.every((node) => isRecord(node) && typeof node.id === "string")
  );
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
    (value.edges === undefined || (Array.isArray(value.edges) && value.edges.every((entry) => typeof entry === "string")))
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
    typeof value.id === "string" &&
    typeof value.sequence === "number" &&
    (value.kind === "apply" || value.kind === "undo" || value.kind === "redo") &&
    isRuntimeMutationRequest(value.mutation) &&
    isRuntimeMutationRequest(value.inverseMutation) &&
    (value.subjectEventId === undefined || typeof value.subjectEventId === "string") &&
    (value.clientId === undefined || typeof value.clientId === "string") &&
    (value.description === undefined || typeof value.description === "string") &&
    typeof value.createdAt === "string"
  );
}

function isRuntimeMutationRequest(value: unknown): value is RuntimeMutationRequest {
  return (
    isRecord(value) &&
    (value.graphPatch === undefined || validateGraphPatch(value.graphPatch).ok) &&
    (value.viewPatch === undefined || isRuntimeViewPatch(value.viewPatch)) &&
    (value.clientId === undefined || typeof value.clientId === "string") &&
    (value.description === undefined || typeof value.description === "string")
  );
}

function isRuntimeViewPatch(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.baseViewRevision === "number" &&
    Array.isArray(value.ops) &&
    value.ops.every(isRuntimeViewPatchOperation)
  );
}

function isRuntimeViewPatchOperation(value: unknown): boolean {
  if (!isRecord(value) || typeof value.nodeId !== "string") {
    return false;
  }
  if (value.op === "setNodeView") {
    return isCanvasNodeView(value.view);
  }
  if (value.op === "moveNodeView") {
    return (value.from === undefined || isCanvasNodeView(value.from)) && isCanvasNodeView(value.to);
  }
  return false;
}

function isCanvasNodeView(value: unknown): value is CanvasNodeViewV01 {
  return (
    isRecord(value) &&
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
  return isRecord(value) && typeof value.message === "string" && isRuntimeDiagnosticSeverity(value.severity);
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

function optionalPositiveInteger(value: unknown): boolean {
  return value === undefined || (typeof value === "number" && Number.isInteger(value) && value >= 1);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
