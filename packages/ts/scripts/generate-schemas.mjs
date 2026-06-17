import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const packageRoot = process.cwd();
const repoRoot = path.resolve(packageRoot, "../..");
const generatedDir = path.join(packageRoot, "src/generated");

async function readSchema(relativePath) {
  return JSON.parse(await readFile(path.join(repoRoot, relativePath), "utf8"));
}

const graphV01Schema = await readSchema("json-schema/graph/v0.1/graph.schema.json");
const graphV02Schema = await readSchema("json-schema/graph/v0.2/graph.schema.json");
const viewStateV01Schema = await readSchema("json-schema/view/v0.1/view-state.schema.json");
const projectV01Schema = await readSchema("json-schema/project/v0.1/project.schema.json");
const graphPatchV01Schema = await readSchema("json-schema/graph/v0.1/patch.schema.json");
const graphPatchEventV01Schema = await readSchema(
  "json-schema/graph/v0.1/patch-event.schema.json"
);
const graphPatchHistoryV01Schema = await readSchema(
  "json-schema/graph/v0.1/patch-history.schema.json"
);
const nodeDefinitionV01Schema = await readSchema(
  "json-schema/node/v0.1/node-definition.schema.json"
);
const nodeDefinitionV02Schema = await readSchema(
  "json-schema/node/v0.2/node-definition.schema.json"
);
const shaderInterfaceV01Schema = await readSchema(
  "json-schema/shader/v0.1/shader-interface.schema.json"
);
const shaderDiagnosticV01Schema = await readSchema(
  "json-schema/shader/v0.1/shader-diagnostic.schema.json"
);

await mkdir(generatedDir, { recursive: true });
await writeFile(
  path.join(generatedDir, "schemas.ts"),
  [
    "/* This file is generated from the repository JSON Schema sources. */",
    "",
    `export const graphV01Schema = ${JSON.stringify(graphV01Schema, null, 2)} as const;`,
    "",
    `export const graphV02Schema = ${JSON.stringify(graphV02Schema, null, 2)} as const;`,
    "",
    `export const viewStateV01Schema = ${JSON.stringify(viewStateV01Schema, null, 2)} as const;`,
    "",
    `export const projectV01Schema = ${JSON.stringify(projectV01Schema, null, 2)} as const;`,
    "",
    `export const graphPatchV01Schema = ${JSON.stringify(graphPatchV01Schema, null, 2)} as const;`,
    "",
    `export const graphPatchEventV01Schema = ${JSON.stringify(graphPatchEventV01Schema, null, 2)} as const;`,
    "",
    `export const graphPatchHistoryV01Schema = ${JSON.stringify(graphPatchHistoryV01Schema, null, 2)} as const;`,
    "",
    `export const nodeDefinitionV01Schema = ${JSON.stringify(nodeDefinitionV01Schema, null, 2)} as const;`,
    "",
    `export const nodeDefinitionV02Schema = ${JSON.stringify(nodeDefinitionV02Schema, null, 2)} as const;`,
    "",
    `export const shaderInterfaceV01Schema = ${JSON.stringify(shaderInterfaceV01Schema, null, 2)} as const;`,
    "",
    `export const shaderDiagnosticV01Schema = ${JSON.stringify(shaderDiagnosticV01Schema, null, 2)} as const;`,
    ""
  ].join("\n")
);
