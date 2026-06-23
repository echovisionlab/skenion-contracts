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
const runtimeOperationV0Schema = await readSchema("json-schema/runtime/v0/operation.schema.json");
const runtimeSessionV0Schema = await readSchema("json-schema/runtime/v0/session.schema.json");
const runtimeCollaborationV0Schema = await readSchema(
  "json-schema/runtime/v0/collaboration.schema.json"
);
const nodeDefinitionV01Schema = await readSchema(
  "json-schema/node/v0.1/node-definition.schema.json"
);
const shaderInterfaceV01Schema = await readSchema(
  "json-schema/shader/v0.1/shader-interface.schema.json"
);
const shaderDiagnosticV01Schema = await readSchema(
  "json-schema/shader/v0.1/shader-diagnostic.schema.json"
);
const controlMessageV01Schema = await readSchema(
  "json-schema/control/v0.1/control-message.schema.json"
);
const objectTextParseResultV01Schema = await readSchema(
  "json-schema/object-text/v0.1/parse-result.schema.json"
);
const extensionManifestV01Schema = await readSchema(
  "json-schema/extension/v0.1/extension-manifest.schema.json"
);
const releaseTrainV01Schema = await readSchema(
  "json-schema/release-train/v0.1/release-train.schema.json"
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
    `export const runtimeOperationV0Schema = ${JSON.stringify(runtimeOperationV0Schema, null, 2)} as const;`,
    "",
    `export const runtimeSessionV0Schema = ${JSON.stringify(runtimeSessionV0Schema, null, 2)} as const;`,
    "",
    `export const runtimeCollaborationV0Schema = ${JSON.stringify(runtimeCollaborationV0Schema, null, 2)} as const;`,
    "",
    `export const nodeDefinitionV01Schema = ${JSON.stringify(nodeDefinitionV01Schema, null, 2)} as const;`,
    "",
    `export const shaderInterfaceV01Schema = ${JSON.stringify(shaderInterfaceV01Schema, null, 2)} as const;`,
    "",
    `export const shaderDiagnosticV01Schema = ${JSON.stringify(shaderDiagnosticV01Schema, null, 2)} as const;`,
    "",
    `export const controlMessageV01Schema = ${JSON.stringify(controlMessageV01Schema, null, 2)} as const;`,
    "",
    `export const objectTextParseResultV01Schema = ${JSON.stringify(objectTextParseResultV01Schema, null, 2)} as const;`,
    "",
    `export const extensionManifestV01Schema = ${JSON.stringify(extensionManifestV01Schema, null, 2)} as const;`,
    "",
    `export const releaseTrainV01Schema = ${JSON.stringify(releaseTrainV01Schema, null, 2)} as const;`,
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
    `export const contractsPackageVersion = ${JSON.stringify(contractsPackageVersion)};`,
    ""
  ].join("\n")
);
