/**
 * File: scripts/verify-final-art-sanctuary-assets.mjs
 * Description: Verifies the locally committed final-art sanctuary GLB and runtime contract.
 * Purpose: Prevents an asset replacement from adding a camera, corpus figure, white volume, video, or missing focal object.
 * Notes: This read-only script inspects committed local bytes only; it does not start Blender, a browser, storage, or a network request.
 */

// Import the small Node helpers used to inspect local artifact bytes from any repository working directory.
import { readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Resolve the artifact directory once so every assertion applies to the same shipped production surface.
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const productionDirectory = resolve(repositoryRoot, "apps/sanctuary/src/assets/production");
const contractPath = resolve(productionDirectory, "realm-living-sanctuary-final-art-v1.json");
const glbPath = resolve(productionDirectory, "realm-mvp-sanctuary-v2-final-art.glb");

// Decode only the GLB JSON chunk, which contains scene topology and node names without requiring a browser image decoder.
function readGlbDocument() {
  const bytes = readFileSync(glbPath);
  if (bytes.subarray(0, 4).toString("utf8") !== "glTF") {
    throw new Error("Final-art asset must be a valid GLB container.");
  }
  if (bytes.readUInt32LE(16) !== 0x4e4f534a) {
    throw new Error("Final-art GLB must begin with a JSON chunk.");
  }
  const jsonLength = bytes.readUInt32LE(12);
  return JSON.parse(bytes.subarray(20, 20 + jsonLength).toString("utf8"));
}

// Walk the local production directory so the cinematic source video cannot accidentally be packaged for visitors.
function listFiles(directory) {
  return readdirSync(directory, { recursive: true }).map(String);
}

const document = readGlbDocument();
const contract = JSON.parse(readFileSync(contractPath, "utf8"));
const nodeNames = document.nodes.map((node) => node.name ?? "");

// Preserve the one reachable visitor scene and all semantic anchors used by fixed camera and atmosphere code.
if (
  document.scenes.length !== 1 ||
  document.cameras !== undefined ||
  document.animations !== undefined
) {
  throw new Error("Final-art GLB must contain one static, camera-free visitor scene.");
}
if (
  !contract.required_semantic_roots.every((name) => nodeNames.includes(name)) ||
  nodeNames.filter((name) => name === "HF01_Candle_Left").length !== 1 ||
  nodeNames.filter((name) => name === "HF01_Candle_Right").length !== 1
) {
  throw new Error(
    "Final-art GLB must retain the table, Bible, plain cross, two candles, benches, and north-door anchors.",
  );
}

// Keep the approved plain-cross and local-only privacy boundary literal so forbidden art and reference media fail the build early.
const serialized = JSON.stringify(document).toLowerCase();
for (const prohibitedName of ["corpus", "crucifix_figure", "white_volume_cube", "blender_camera"]) {
  if (serialized.includes(prohibitedName)) {
    throw new Error(`Final-art GLB must not contain prohibited content: ${prohibitedName}.`);
  }
}
if (listFiles(productionDirectory).some((filename) => filename.endsWith(".mp4"))) {
  throw new Error("Final-art production assets must not ship the Higgsfield reference video.");
}

console.log("Final-art sanctuary asset contract: PASS");
