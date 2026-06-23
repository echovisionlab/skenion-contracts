import { contractsPackageVersion } from "./generated/package-version.js";

const SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const V0_RANGE_PATTERN = /^>=(0|[1-9]\d*)\.(0|[1-9]\d*)\.0 <(0|[1-9]\d*)\.(0|[1-9]\d*)\.0$/;

export const CONTRACTS_PACKAGE_VERSION = contractsPackageVersion;
export const CONTRACTS_COMPATIBILITY_LINE = deriveV0CompatibilityLine(CONTRACTS_PACKAGE_VERSION);
export const CONTRACTS_COMPATIBILITY_RANGE = deriveV0CompatibilityRange(CONTRACTS_PACKAGE_VERSION);

interface ParsedVersion {
  major: number;
  minor: number;
  patch: number;
}

function parseSemver(version: string): ParsedVersion {
  const match = SEMVER_PATTERN.exec(version);
  if (!match) {
    throw new TypeError(`expected SemVer major.minor.patch version, found ${version}`);
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3])
  };
}

export function deriveV0CompatibilityLine(version: string): string {
  const parsed = parseSemver(version);
  if (parsed.major !== 0) {
    throw new TypeError(`expected v0 SemVer version, found ${version}`);
  }

  return `0.${parsed.minor}`;
}

export function deriveV0CompatibilityRange(version: string): string {
  const parsed = parseSemver(version);
  if (parsed.major !== 0) {
    throw new TypeError(`expected v0 SemVer version, found ${version}`);
  }

  return `>=0.${parsed.minor}.0 <0.${parsed.minor + 1}.0`;
}

export function isSameV0CompatibilityLine(leftVersion: string, rightVersion: string): boolean {
  try {
    return deriveV0CompatibilityLine(leftVersion) === deriveV0CompatibilityLine(rightVersion);
  } catch {
    return false;
  }
}

export function satisfiesV0CompatibilityRange(version: string, range: string): boolean {
  const versionMatch = SEMVER_PATTERN.exec(version);
  const rangeMatch = V0_RANGE_PATTERN.exec(range);
  if (!versionMatch || !rangeMatch) {
    return false;
  }

  const versionMajor = Number(versionMatch[1]);
  const versionMinor = Number(versionMatch[2]);
  const lowerMajor = Number(rangeMatch[1]);
  const lowerMinor = Number(rangeMatch[2]);
  const upperMajor = Number(rangeMatch[3]);
  const upperMinor = Number(rangeMatch[4]);

  return (
    versionMajor === 0 &&
    lowerMajor === 0 &&
    upperMajor === 0 &&
    upperMinor === lowerMinor + 1 &&
    versionMinor === lowerMinor
  );
}
