import { readFile } from "node:fs/promises";

const files = [
  "json-schema/graph/v0/graph.schema.json",
  "json-schema/graph/v0/patch.schema.json",
  "fixtures/graph/minimal.graph.json",
  "fixtures/patch/add-value-node.patch.json",
  "openapi/runtime-http.v0.yaml"
];

for (const file of files) {
  const text = await readFile(file, "utf8");
  if (file.endsWith(".json")) {
    JSON.parse(text);
  }
}

console.log(`validated ${files.length} contract files`);
