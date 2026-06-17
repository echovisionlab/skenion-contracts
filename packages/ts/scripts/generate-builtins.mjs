import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const packageRoot = process.cwd();
const repoRoot = path.resolve(packageRoot, "../..");
const generatedPath = path.join(packageRoot, "src", "builtins.generated.ts");
const builtinsDir = path.join(repoRoot, "builtins", "v0.1", "nodes");
const helpDir = path.join(repoRoot, "builtins", "v0.1", "help");
const manifestPath = path.join(repoRoot, "builtins", "v0.1", "builtins.manifest.json");

const files = (await readdir(builtinsDir))
  .filter((file) => file.endsWith(".node.json"))
  .sort();
const helpFiles = (await readdir(helpDir))
  .filter((file) => file.endsWith(".help.json"))
  .sort();

const definitions = [];
for (const file of files) {
  definitions.push(JSON.parse(await readFile(path.join(builtinsDir, file), "utf8")));
}
const helpDocuments = [];
for (const file of helpFiles) {
  helpDocuments.push(JSON.parse(await readFile(path.join(helpDir, file), "utf8")));
}
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));

await mkdir(path.dirname(generatedPath), { recursive: true });
await writeFile(
  generatedPath,
  [
    "/* This file is generated from builtins/v0.1. */",
    "import type { NodeDefinitionManifestV01 } from \"./types.js\";",
    "",
    "export interface BuiltinManifestV01 {",
    "  schema: \"skenion.builtins.manifest\";",
    "  schemaVersion: \"0.1.0\";",
    "  version: \"0.1\";",
    "  nodes: string[];",
    "  canonicalDataKinds: string[];",
    "}",
    "",
    "export interface BuiltinNodeHelpItemV01 {",
    "  id: string;",
    "  description: string;",
    "}",
    "",
    "export interface BuiltinNodeHelpExampleV01 {",
    "  title: string;",
    "  description?: string;",
    "  graph?: string;",
    "}",
    "",
    "export interface BuiltinNodeHelpV01 {",
    "  schema: \"skenion.node.help\";",
    "  schemaVersion: \"0.1.0\";",
    "  id: string;",
    "  summary: string;",
    "  description: string;",
    "  ports?: BuiltinNodeHelpItemV01[];",
    "  params?: BuiltinNodeHelpItemV01[];",
    "  example?: BuiltinNodeHelpExampleV01;",
    "}",
    "",
    `export const builtinManifestV01 = ${JSON.stringify(manifest, null, 2)} satisfies BuiltinManifestV01;`,
    "",
    `export const builtinNodeDefinitionsV01 = ${JSON.stringify(definitions, null, 2)} satisfies NodeDefinitionManifestV01[];`,
    "",
    `export const builtinNodeHelpV01 = ${JSON.stringify(helpDocuments, null, 2)} satisfies BuiltinNodeHelpV01[];`,
    "",
    "export function getBuiltinNodeDefinition(id: string): NodeDefinitionManifestV01 | undefined {",
    "  return builtinNodeDefinitionsV01.find((definition) => definition.id === id);",
    "}",
    "",
    "export function getBuiltinNodeHelp(id: string): BuiltinNodeHelpV01 | undefined {",
    "  return builtinNodeHelpV01.find((help) => help.id === id);",
    "}",
    ""
  ].join("\n")
);
