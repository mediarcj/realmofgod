/**
 * File: scripts/verify-hf01-assets.mjs
 * Description: Validates the local HF-01 GLB structure, animation, budget, and content boundary.
 * Purpose: Detects missing clips, remote assets, readable Scripture, excessive geometry, or damaged optimization.
 * Notes: The official glTF validator may report Meshopt as unsupported information; any real ERROR still fails.
 */

// Import local binary, process, and path helpers used by this deterministic asset check.
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Pin validation to the one production asset referenced by the sanctuary renderer.
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const assetPath = resolve(
  repositoryRoot,
  "apps/sanctuary/src/assets/production/realm-hf01-sanctuary.glb",
);
const asset = readFileSync(assetPath);
const expectedClips = new Set(["Realm_Door_Close", "Realm_Bible_Settle_Open"]);

// Parse the GLB header and JSON chunk without adding a runtime or validation dependency.
if (asset.subarray(0, 4).toString("ascii") !== "glTF") {
  throw new Error("HF-01 production asset is not a glTF binary.");
}
if (asset.readUInt32LE(4) !== 2 || asset.readUInt32LE(8) !== asset.length) {
  throw new Error("HF-01 production GLB has an invalid version or byte length.");
}
const jsonChunkLength = asset.readUInt32LE(12);
const jsonChunkType = asset.readUInt32LE(16);
if (jsonChunkType !== 0x4e4f534a) {
  throw new Error("HF-01 production GLB does not begin with a JSON chunk.");
}
const document = JSON.parse(asset.subarray(20, 20 + jsonChunkLength).toString("utf8"));

// Require the reviewed local compression and texture extensions and forbid all URI-based dependencies.
const requiredExtensions = new Set(document.extensionsRequired ?? []);
for (const extension of [
  "EXT_meshopt_compression",
  "EXT_texture_webp",
  "KHR_lights_punctual",
  "KHR_mesh_quantization",
]) {
  if (!requiredExtensions.has(extension)) {
    throw new Error(`HF-01 production asset is missing required extension ${extension}.`);
  }
}
const serializedDocument = JSON.stringify(document);
if (/https?:|data:|\/\//iu.test(serializedDocument)) {
  throw new Error("HF-01 production asset contains a remote or embedded-URI dependency.");
}

// Preserve the two owner-approved clips and reject readable Scripture or invented Bible wording in the asset.
const animationNames = new Set((document.animations ?? []).map((animation) => animation.name));
for (const clipName of expectedClips) {
  if (!animationNames.has(clipName)) {
    throw new Error(`HF-01 production asset is missing animation clip ${clipName}.`);
  }
}
if (/psalm|scripture|be still|verse|chapter/iu.test(serializedDocument)) {
  throw new Error("HF-01 production asset contains readable or revealing Scripture-related text.");
}

// Confirm named physical elements remain addressable after optimization.
for (const nodeName of [
  "HF01_Sanctuary_Root",
  "HF01_Door_Hinge",
  "HF01_DoorFrame",
  "HF01_PrayerTable",
  "HF01_Bible_Root",
  "HF01_Bible_TopCover_Hinge",
  "HF01_Bible_LeftPages_Hinge",
  "HF01_Bible_PageLeaf_Hinge",
]) {
  if (!(document.nodes ?? []).some((node) => node.name === nodeName)) {
    throw new Error(`HF-01 production asset is missing required node ${nodeName}.`);
  }
}

// Count only scene-reachable mesh instances so review thresholds describe what the browser can draw.
const scene = document.scenes?.[document.scene ?? 0];
if (scene === undefined) {
  throw new Error("HF-01 production asset has no default scene.");
}
let triangleCount = 0;
let drawCallCount = 0;
const visitNode = (nodeIndex) => {
  const node = document.nodes[nodeIndex];
  if (node.mesh !== undefined) {
    const mesh = document.meshes[node.mesh];
    for (const primitive of mesh.primitives) {
      const elementCount =
        primitive.indices === undefined
          ? document.accessors[primitive.attributes.POSITION].count
          : document.accessors[primitive.indices].count;
      triangleCount += Math.floor(elementCount / 3);
      drawCallCount += 1;
    }
  }
  for (const childIndex of node.children ?? []) {
    visitNode(childIndex);
  }
};
for (const nodeIndex of scene.nodes ?? []) {
  visitNode(nodeIndex);
}
if (triangleCount > 150_000) {
  throw new Error(`HF-01 scene exceeds 150,000 visible triangles: ${triangleCount}.`);
}
if (drawCallCount > 100) {
  throw new Error(`HF-01 scene exceeds 100 visible draw calls: ${drawCallCount}.`);
}
if (asset.length > 5 * 1024 * 1024) {
  throw new Error(`HF-01 production asset exceeds 5 MB: ${asset.length} bytes.`);
}

// Ask the pinned official CLI to validate and inspect the optimized binary without permitting network reads.
function gltfTransform(arguments_) {
  const result = spawnSync("corepack", ["pnpm", "exec", "gltf-transform", ...arguments_], {
    cwd: repositoryRoot,
    encoding: "utf8",
    env: process.env,
  });
  if (result.error !== undefined || result.status !== 0) {
    throw result.error ?? new Error(`glTF Transform ${arguments_[0]} failed.`);
  }
  return `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
}

const validatorOutput = gltfTransform(["validate", assetPath]);
if (!validatorOutput.includes("No errors found.")) {
  throw new Error("The official glTF validator did not confirm a zero-error result.");
}

const inspectionOutput = gltfTransform(["inspect", assetPath, "--format", "csv"]);
const textureResolutions = [...inspectionOutput.matchAll(/,(\d+x\d+),\d+,\d+$/gmu)].map(
  (match) => match[1],
);
if (
  textureResolutions.length === 0 ||
  textureResolutions.some((value) => value !== "256x256" && value !== "512x512")
) {
  throw new Error("HF-01 textures are missing or exceed the reviewed 512-pixel dimensions.");
}

console.log(
  `HF-01 asset checks passed: ${asset.length} bytes, ${triangleCount} triangles, ${drawCallCount} draw calls, ${textureResolutions.length} textures.`,
);
