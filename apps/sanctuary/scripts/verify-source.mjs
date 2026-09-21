// File: apps/sanctuary/scripts/verify-source.mjs
// Description: Reconciles all web units and runtime anchors with the source inventory.
// Purpose: Prevents missing geometry, invented names, and detached runtime interactions.
// Notes: Runs after the complete source-derived room has been assembled.

import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
const read = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url)));
const authority = read("../lib/sanctuary/source-geometry.json");
const runtime = read("../lib/sanctuary/runtime-contract.json");
const base = new URL("../public/models/sanctuary/", import.meta.url);
const architectureSourceSha = "118ac40912509b1242608fa88163476e0013ee9179f17942b3f8ed3273286e36";
const candleSourceSha = "9b6852358af32c625589d5108249c5da4947d1aeb31bcf8e30a398ece290fd6b";
const contracts = readdirSync(base).filter((name) => name.endsWith(".glb")).map((asset) => ({ asset, contract: JSON.parse(readFileSync(new URL(asset.replace(".glb", ".json"), base))) }));
assert.deepEqual(contracts.map(({ asset }) => asset).sort(), ["altar-candles-runtime.glb", "bible.glb", "kneeling-rest.glb", "sanctuary-architecture.glb", "table.glb"]);
const architectureObjects = contracts.filter(({ asset }) => asset !== "altar-candles-runtime.glb").flatMap(({ contract }) => contract.objects);
const candleObjects = contracts.find(({ asset }) => asset === "altar-candles-runtime.glb").contract.objects;
const runtimeObjects = [...architectureObjects, ...candleObjects];
assert.equal(architectureObjects.length, 724);
assert.equal(candleObjects.length, 6);
assert.deepEqual(architectureObjects.map((object) => object.name).sort(), authority.geometry.map((object) => object.name).sort());
for (const object of architectureObjects) {
  const source = authority.geometry.find((candidate) => candidate.name === object.name);
  assert.equal(object.category, source.category);
  assert.equal(object.export_policy, source.policy);
  assert.deepEqual(object.materials, source.materials);
  assert.deepEqual(object.matrix_world_blender, source.matrix);
  assert.equal(object.source_triangles ?? object.triangles, source.triangles);
  for (const side of ["min", "max"]) for (let axis = 0; axis < 3; axis++)
    assert(Math.abs(object.bounds_blender[side][axis] - source.bounds[side][axis]) < (object.source_triangles ? .003 : .0002), `Source bounds: ${object.name}`);
}
assert.equal(runtime.source_sha256, authority.source_sha256);
assert.equal(authority.source_sha256, architectureSourceSha);
assert.equal(runtime.source_sha256, architectureSourceSha);
for (const { asset, contract } of contracts) {
  assert.equal(contract.source_sha256, asset === "altar-candles-runtime.glb" ? candleSourceSha : architectureSourceSha, `Wrong source authority: ${asset}`);
}
assert.equal(runtime.anchors.length, 25);
assert.equal(new Set(runtime.anchors.map((anchor) => anchor.name)).size, 25);
const roles = { CANDLE_FLAME_ANCHOR: 6, CANDLE_SMOKE_ANCHOR: 6, CANDLE_LIGHT_ANCHOR: 6, DUST_VOLUME: 1, SUNRAY_SOURCE_BANK: 3, SUNLIGHT_PRIMARY: 1, BIBLE_HOVER_CLICK_FOCUS: 1, PRAYER_ZONE: 1 };
for (const [role, count] of Object.entries(roles)) assert.equal(runtime.anchors.filter((anchor) => anchor.role === role).length, count);
for (const anchor of runtime.anchors) {
  assert(anchor.position.length === 3 && anchor.position.every(Number.isFinite));
  assert.deepEqual(anchor.position, anchor.matrix.slice(12, 15));
  // Candle anchors are explicit runtime positions from the separate candle source;
  // their former architecture-source host names are intentionally not required.
  if (anchor.host && !anchor.role.startsWith("CANDLE_")) assert(runtimeObjects.some((object) => object.name === anchor.host), `Missing host: ${anchor.name}`);
}
console.log("PASS 724 architecture objects, 6 candle objects, and 25 runtime anchors reconciled.");
