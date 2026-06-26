#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const tsPackagePath = resolve(root, "packages/ts");
const rustCratePath = resolve(root, "packages/rust");
const tsManifestPath = resolve(tsPackagePath, "package.json");
const rustManifestPath = resolve(rustCratePath, "Cargo.toml");
const requiredOutputs = [
  resolve(tsPackagePath, "dist/index.js"),
  resolve(tsPackagePath, "dist/index.d.ts"),
];

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function readRustPackageMetadata(cargoTomlPath) {
  const metadata = {};
  let inPackageSection = false;

  for (const line of readFileSync(cargoTomlPath, "utf8").split(/\r?\n/)) {
    const section = line.match(/^\[(?<section>[^\]]+)\]\s*$/);

    if (section) {
      inPackageSection = section.groups.section === "package";
      continue;
    }

    if (!inPackageSection) {
      continue;
    }

    const field = line.match(/^(?<key>name|version)\s*=\s*"(?<value>[^"]+)"/);

    if (field?.groups?.key && field.groups.value) {
      metadata[field.groups.key] = field.groups.value;
    }
  }

  if (!metadata.name) {
    throw new Error(`Could not read package.name from ${cargoTomlPath}`);
  }

  if (!metadata.version) {
    throw new Error(`Could not read package.version from ${cargoTomlPath}`);
  }

  return {
    name: metadata.name,
    version: metadata.version,
  };
}

function git(args) {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function buildGitEvidence() {
  const status = git(["status", "--porcelain"]);

  return {
    branch: git(["branch", "--show-current"]) || null,
    commit: git(["rev-parse", "HEAD"]),
    dirty: status.length > 0,
    status: status ? status.split("\n") : [],
  };
}

function fail(message, details = {}) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: message,
        ...details,
      },
      null,
      2,
    ),
  );
  process.exit(1);
}

try {
  const missingOutputs = requiredOutputs.filter((path) => !existsSync(path));

  if (missingOutputs.length > 0) {
    fail("Local integration evidence requires built TypeScript dist outputs. Run `pnpm run build` first.", {
      missingOutputs,
    });
  }

  const tsManifest = readJson(tsManifestPath);
  const rustManifest = readRustPackageMetadata(rustManifestPath);

  const evidence = {
    ok: true,
    generatedAt: new Date().toISOString(),
    repository: {
      path: root,
      git: buildGitEvidence(),
    },
    typescript: {
      packageName: tsManifest.name,
      version: tsManifest.version,
      packagePath: tsPackagePath,
      manifestPath: tsManifestPath,
      distEntry: requiredOutputs[0],
      typesEntry: requiredOutputs[1],
    },
    rust: {
      crateName: rustManifest.name,
      version: rustManifest.version,
      cratePath: rustCratePath,
      manifestPath: rustManifestPath,
    },
  };

  console.log(JSON.stringify(evidence, null, 2));
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
