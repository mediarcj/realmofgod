// File: apps/sanctuary/scripts/verify-single-authority.mjs
// Description: Rejects retired Blender authorities from active Sanctuary runtime files.
// Purpose: Makes the CEILING_LEVEL_v28_4_4 authority fail closed before validation or export.
// Notes: The retired-name deny-list is intentionally local to this verification script.

import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";

const approvedSha = "118ac40912509b1242608fa88163476e0013ee9179f17942b3f8ed3273286e36";
const retired = [
  "9b6852358af32c625589d5108249c5da4947d1aeb31bcf8e30a398ece290fd6b",
  "CANDLE_HOLDER_STRUCTURE_v28_3_0",
  "CROSS_METAL_RENAISSANCE_v28_2_0",
];
const root = resolve(new URL("../../..", import.meta.url).pathname);
const activeRoots = [join(root, "AGENTS.md"), join(root, "tools", "blender"), join(root, "apps", "sanctuary")];
const ignored = new Set(["node_modules", ".next", "dist", ".git"]);
function files(path) {
  const stat = statSync(path);
  if (stat.isFile()) return [path];
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => ignored.has(entry.name) ? [] : files(join(path, entry.name)));
}
const activeFiles = activeRoots
  .flatMap(files)
  // The deny-list necessarily spells retired identifiers; it is not a runtime source.
  .filter((file) => file !== new URL(import.meta.url).pathname)
  .filter((file) => /\.(?:md|mjs|ts|tsx|json|py)$/.test(file));
for (const file of activeFiles) {
  const content = readFileSync(file, "utf8");
  for (const forbidden of retired) assert(!content.includes(forbidden), `Retired runtime authority in ${file}: ${forbidden}`);
}
for (const asset of readdirSync(join(root, "apps", "sanctuary", "public", "models", "sanctuary")).filter((name) => name.endsWith(".json"))) {
  const contract = JSON.parse(readFileSync(join(root, "apps", "sanctuary", "public", "models", "sanctuary", asset)));
  assert.equal(contract.source_sha256, approvedSha, `Wrong active source SHA: ${asset}`);
}
console.log(`PASS single approved authority across ${activeFiles.length} active files.`);
