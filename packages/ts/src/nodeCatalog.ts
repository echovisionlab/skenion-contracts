import { derivePatchContractV01 } from "./project.js";
import type {
  NodeCatalogEntryV01,
  NodeCatalogSnapshotV01,
  PackageChecksumV01,
  PatchDefinitionV01
} from "./types.js";

const sha256InitialState = new Uint32Array([
  0x6a09e667,
  0xbb67ae85,
  0x3c6ef372,
  0xa54ff53a,
  0x510e527f,
  0x9b05688c,
  0x1f83d9ab,
  0x5be0cd19
]);

const sha256RoundConstants = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
  0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
  0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
  0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
  0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
  0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
]);

function compareUnicodeCodePoint(left: string, right: string): number {
  const leftCodePoints = Array.from(left);
  const rightCodePoints = Array.from(right);
  const count = Math.min(leftCodePoints.length, rightCodePoints.length);

  for (let index = 0; index < count; index += 1) {
    const leftCodePoint = leftCodePoints[index].codePointAt(0) as number;
    const rightCodePoint = rightCodePoints[index].codePointAt(0) as number;
    if (leftCodePoint !== rightCodePoint) {
      return leftCodePoint - rightCodePoint;
    }
  }

  return leftCodePoints.length - rightCodePoints.length;
}

function canonicalJsonStringify(value: unknown): string {
  if (value === null) {
    return "null";
  }
  if (typeof value === "string") {
    return JSON.stringify(value);
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new TypeError("canonical JSON cannot encode non-finite numbers");
    }
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => canonicalJsonStringify(entry)).join(",")}]`;
  }
  if (typeof value === "object" && value !== null) {
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record)
      .filter((key) => record[key] !== undefined)
      .sort(compareUnicodeCodePoint);
    return `{${keys
      .map((key) => `${JSON.stringify(key)}:${canonicalJsonStringify(record[key])}`)
      .join(",")}}`;
  }

  throw new TypeError(`canonical JSON cannot encode ${typeof value}`);
}

function rotateRight(value: number, bits: number): number {
  return (value >>> bits) | (value << (32 - bits));
}

function sha256Hex(bytes: Uint8Array): string {
  const paddedLength = Math.ceil((bytes.length + 1 + 8) / 64) * 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(bytes);
  padded[bytes.length] = 0x80;

  const view = new DataView(padded.buffer);
  const bitLengthHigh = Math.floor(bytes.length / 0x20000000);
  const bitLengthLow = (bytes.length << 3) >>> 0;
  view.setUint32(paddedLength - 8, bitLengthHigh, false);
  view.setUint32(paddedLength - 4, bitLengthLow, false);

  const hash = new Uint32Array(sha256InitialState);
  const words = new Uint32Array(64);

  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let index = 0; index < 16; index += 1) {
      words[index] = view.getUint32(offset + index * 4, false);
    }
    for (let index = 16; index < 64; index += 1) {
      const s0 = rotateRight(words[index - 15], 7) ^
        rotateRight(words[index - 15], 18) ^
        (words[index - 15] >>> 3);
      const s1 = rotateRight(words[index - 2], 17) ^
        rotateRight(words[index - 2], 19) ^
        (words[index - 2] >>> 10);
      words[index] = (words[index - 16] + s0 + words[index - 7] + s1) >>> 0;
    }

    let a = hash[0];
    let b = hash[1];
    let c = hash[2];
    let d = hash[3];
    let e = hash[4];
    let f = hash[5];
    let g = hash[6];
    let h = hash[7];

    for (let index = 0; index < 64; index += 1) {
      const s1 = rotateRight(e, 6) ^ rotateRight(e, 11) ^ rotateRight(e, 25);
      const choice = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + choice + sha256RoundConstants[index] + words[index]) >>> 0;
      const s0 = rotateRight(a, 2) ^ rotateRight(a, 13) ^ rotateRight(a, 22);
      const majority = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + majority) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    hash[0] = (hash[0] + a) >>> 0;
    hash[1] = (hash[1] + b) >>> 0;
    hash[2] = (hash[2] + c) >>> 0;
    hash[3] = (hash[3] + d) >>> 0;
    hash[4] = (hash[4] + e) >>> 0;
    hash[5] = (hash[5] + f) >>> 0;
    hash[6] = (hash[6] + g) >>> 0;
    hash[7] = (hash[7] + h) >>> 0;
  }

  return Array.from(hash)
    .map((value) => value.toString(16).padStart(8, "0"))
    .join("");
}

function sha256CanonicalDigest(value: unknown): PackageChecksumV01 {
  const canonicalJson = canonicalJsonStringify(value);
  const bytes = new TextEncoder().encode(canonicalJson);
  return {
    algorithm: "sha256",
    value: sha256Hex(bytes)
  };
}

function stripCatalogRevisionAndDiagnostics(
  snapshot: NodeCatalogSnapshotV01
): unknown {
  const {
    catalogRevision: _catalogRevision,
    diagnostics: _diagnostics,
    entries,
    ...snapshotWithoutRevision
  } = snapshot;

  return {
    ...snapshotWithoutRevision,
    entries: entries.map((entry): Omit<NodeCatalogEntryV01, "diagnostics"> => {
      const { diagnostics: _entryDiagnostics, ...entryWithoutDiagnostics } = entry;
      return entryWithoutDiagnostics;
    })
  };
}

export function computePatchInterfaceDigestV01(patch: PatchDefinitionV01): PackageChecksumV01 {
  const contract = derivePatchContractV01(patch);
  return sha256CanonicalDigest({
    id: patch.id,
    ports: contract.ports
  });
}

export function computeNodeCatalogRevisionV01(
  snapshot: NodeCatalogSnapshotV01
): PackageChecksumV01 {
  return sha256CanonicalDigest(stripCatalogRevisionAndDiagnostics(snapshot));
}

export function sanitizeProjectPatchIdV01(patchId: string): string {
  const sanitized = patchId.replace(/[^A-Za-z0-9.-]/g, "-");
  return sanitized.length > 0 ? sanitized : "patch";
}

export function projectPatchNodeDefinitionIdV01(
  patchId: string,
  interfaceDigest: PackageChecksumV01
): string {
  return `object.project.patch.${sanitizeProjectPatchIdV01(patchId)}.${interfaceDigest.value}`;
}
