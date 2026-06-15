import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const packageRoot = process.cwd();
const repoRoot = path.resolve(packageRoot, "../..");
const generatedDir = path.join(packageRoot, "src/generated");

async function readSchema(relativePath) {
  return JSON.parse(await readFile(path.join(repoRoot, relativePath), "utf8"));
}

const graphV01Schema = await readSchema("json-schema/graph/v0.1/graph.schema.json");
const nodeDefinitionV01Schema = await readSchema(
  "json-schema/node/v0.1/node-definition.schema.json"
);

await mkdir(generatedDir, { recursive: true });
await writeFile(
  path.join(generatedDir, "schemas.ts"),
  [
    "/* This file is generated from the repository JSON Schema sources. */",
    "",
    `export const graphV01Schema = ${JSON.stringify(graphV01Schema, null, 2)} as const;`,
    "",
    `export const nodeDefinitionV01Schema = ${JSON.stringify(nodeDefinitionV01Schema, null, 2)} as const;`,
    ""
  ].join("\n")
);
