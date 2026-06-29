import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const packageRoot = process.cwd();
const repoRoot = path.resolve(packageRoot, "../..");
const generatedDir = path.join(packageRoot, "src/generated");

async function readSchema(relativePath) {
  return JSON.parse(await readFile(path.join(repoRoot, relativePath), "utf8"));
}

async function readPackageJson() {
  return JSON.parse(await readFile(path.join(packageRoot, "package.json"), "utf8"));
}

function readPackageVersion(packageJson) {
  if (typeof packageJson.version !== "string" || packageJson.version.length === 0) {
    throw new TypeError("packages/ts/package.json must define a non-empty version");
  }
  return packageJson.version;
}

const contractsPackageVersion = readPackageVersion(await readPackageJson());
const graphV01Schema = await readSchema("json-schema/graph/v0.1/graph.schema.json");
const graphFragmentV01Schema = await readSchema("json-schema/graph/v0.1/fragment.schema.json");
const viewStateV01Schema = await readSchema("json-schema/view/v0.1/view-state.schema.json");
const projectV01Schema = await readSchema("json-schema/project/v0.1/project.schema.json");
const nodeDefinitionV01Schema = await readSchema(
  "json-schema/node/v0.1/node-definition.schema.json"
);
const nodeCatalogV01Schema = await readSchema(
  "json-schema/node-catalog/v0.1/node-catalog.schema.json"
);
const shaderInterfaceV01Schema = await readSchema(
  "json-schema/shader/v0.1/shader-interface.schema.json"
);
const shaderDiagnosticV01Schema = await readSchema(
  "json-schema/shader/v0.1/shader-diagnostic.schema.json"
);
const messageValueV01Schema = await readSchema(
  "json-schema/message/v0.1/message-value.schema.json"
);
const objectTextParseResultV01Schema = await readSchema(
  "json-schema/object-text/v0.1/parse-result.schema.json"
);
const extensionManifestV01Schema = await readSchema(
  "json-schema/extension/v0.1/extension-manifest.schema.json"
);
const packageManifestV01Schema = await readSchema(
  "json-schema/package/v0.1/package-manifest.schema.json"
);
const packageListingV01Schema = await readSchema(
  "json-schema/package/v0.1/package-listing.schema.json"
);
const packageDiscoveryV01Schema = await readSchema(
  "json-schema/package/v0.1/package-discovery.schema.json"
);
const packageInstallPlanRequestV01Schema = await readSchema(
  "json-schema/package/v0.1/package-install-plan-request.schema.json"
);
const packageInstallPlanResponseV01Schema = await readSchema(
  "json-schema/package/v0.1/package-install-plan-response.schema.json"
);
const compatibilityMatrixV01Schema = await readSchema(
  "json-schema/compatibility-matrix/v0.1/compatibility-matrix.schema.json"
);

await mkdir(generatedDir, { recursive: true });
await writeFile(
  path.join(generatedDir, "schemas.ts"),
  [
    "/* This file is generated from the repository JSON Schema sources. */",
    "",
    `export const graphV01Schema = ${JSON.stringify(graphV01Schema, null, 2)} as const;`,
    "",
    `export const graphFragmentV01Schema = ${JSON.stringify(graphFragmentV01Schema, null, 2)} as const;`,
    "",
    `export const viewStateV01Schema = ${JSON.stringify(viewStateV01Schema, null, 2)} as const;`,
    "",
    `export const projectV01Schema = ${JSON.stringify(projectV01Schema, null, 2)} as const;`,
    "",
    `export const nodeDefinitionV01Schema = ${JSON.stringify(nodeDefinitionV01Schema, null, 2)} as const;`,
    "",
    `export const nodeCatalogV01Schema = ${JSON.stringify(nodeCatalogV01Schema, null, 2)} as const;`,
    "",
    `export const shaderInterfaceV01Schema = ${JSON.stringify(shaderInterfaceV01Schema, null, 2)} as const;`,
    "",
    `export const shaderDiagnosticV01Schema = ${JSON.stringify(shaderDiagnosticV01Schema, null, 2)} as const;`,
    "",
    `export const messageValueV01Schema = ${JSON.stringify(messageValueV01Schema, null, 2)} as const;`,
    "",
    `export const objectTextParseResultV01Schema = ${JSON.stringify(objectTextParseResultV01Schema, null, 2)} as const;`,
    "",
    `export const extensionManifestV01Schema = ${JSON.stringify(extensionManifestV01Schema, null, 2)} as const;`,
    "",
    `export const packageManifestV01Schema = ${JSON.stringify(packageManifestV01Schema, null, 2)} as const;`,
    "",
    `export const packageListingV01Schema = ${JSON.stringify(packageListingV01Schema, null, 2)} as const;`,
    "",
    `export const packageDiscoveryV01Schema = ${JSON.stringify(packageDiscoveryV01Schema, null, 2)} as const;`,
    "",
    `export const packageInstallPlanRequestV01Schema = ${JSON.stringify(packageInstallPlanRequestV01Schema, null, 2)} as const;`,
    "",
    `export const packageInstallPlanResponseV01Schema = ${JSON.stringify(packageInstallPlanResponseV01Schema, null, 2)} as const;`,
    "",
    `export const compatibilityMatrixV01Schema = ${JSON.stringify(compatibilityMatrixV01Schema, null, 2)} as const;`,
    ""
  ].join("\n")
);
await writeFile(
  path.join(generatedDir, "package-version.ts"),
  [
    "/* This file is generated from packages/ts/package.json. */",
    "",
    `export const contractsPackageVersion = ${JSON.stringify(contractsPackageVersion)}; // x-release-please-version`,
    ""
  ].join("\n")
);
