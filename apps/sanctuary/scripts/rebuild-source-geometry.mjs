// File: apps/sanctuary/scripts/rebuild-source-geometry.mjs
// Description: Rebuilds the public source-geometry contract from the five verified runtime derivatives.
// Purpose: Keeps browser verification tied to the current split-authority export set.
// Notes: The candle group is separately verified against its own source contract.

import { readFileSync, writeFileSync } from "node:fs";

const models = new URL("../public/models/sanctuary/", import.meta.url);
const architectureSha = "118ac40912509b1242608fa88163476e0013ee9179f17942b3f8ed3273286e36";
const units = ["sanctuary-architecture", "table", "bible", "kneeling-rest"];
const records = units.flatMap((unit) => {
  const contract = JSON.parse(readFileSync(new URL(`${unit}.json`, models)));
  if (contract.source_sha256 !== architectureSha) throw Error(`Unexpected source SHA for ${unit}`);
  return contract.objects.map(({ name, category, export_policy: policy, triangles, matrix_world_blender: matrix, bounds_blender: bounds, materials }) => ({ name, category, policy, triangles, matrix, bounds, materials }));
});
if (records.length !== 724 || new Set(records.map((record) => record.name)).size !== records.length) throw Error("Architecture export inventory is incomplete or duplicated.");
writeFileSync(new URL("../lib/sanctuary/source-geometry.json", import.meta.url), JSON.stringify({ source_sha256: architectureSha, geometry: records }, null, 2) + "\n");
const runtimeUrl = new URL("../lib/sanctuary/runtime-contract.json", import.meta.url);
const runtime = JSON.parse(readFileSync(runtimeUrl));
runtime.source_sha256 = architectureSha;
writeFileSync(runtimeUrl, JSON.stringify(runtime, null, 2) + "\n");
console.log(`Rebuilt source geometry for ${records.length} architecture-source objects.`);
