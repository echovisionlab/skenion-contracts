import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const packageRoot = process.cwd();
const repoRoot = path.resolve(packageRoot, "../..");
const generatedPath = path.join(packageRoot, "src", "builtins.generated.ts");
const builtinsDir = path.join(repoRoot, "builtins", "v0.1", "nodes");

const files = (await readdir(builtinsDir))
  .filter((file) => file.endsWith(".node.json"))
  .sort();

const definitions = [];
for (const file of files) {
  definitions.push(JSON.parse(await readFile(path.join(builtinsDir, file), "utf8")));
}

await mkdir(path.dirname(generatedPath), { recursive: true });
await writeFile(
  generatedPath,
  [
    "/* This file is generated from builtins/v0.1/nodes. */",
    "import type { NodeDefinitionManifestV01 } from \"./types.js\";",
    "",
    `export const builtinNodeDefinitionsV01 = ${JSON.stringify(definitions, null, 2)} satisfies NodeDefinitionManifestV01[];`,
    "",
    "export function getBuiltinNodeDefinition(id: string): NodeDefinitionManifestV01 | undefined {",
    "  return builtinNodeDefinitionsV01.find((definition) => definition.id === id);",
    "}",
    ""
  ].join("\n")
);
