/**
 * File: apps/sanctuary/scripts/verify-d9-affordance-anchors.mjs
 * Description: Verifies D9 proxy-source geometry against the untouched local authored raw GLB.
 * Purpose: Catches a changed Blender/GLB hierarchy before measured visitor interaction bounds can drift from real sanctuary objects.
 * Notes: This local Node check reads one repository asset only and performs no browser, provider, or network operation.
 */

// Import Node path helpers and local Three loaders so verification can inspect the source graph without rendering it.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { Box3, Vector3 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// Resolve from this package-local script so its asset location cannot depend on the caller's working directory.
const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const rawCandidatePath = resolve(
  packageRoot,
  "../../tools/hf01/candidates/realm-mvp-sanctuary-v1-raw-r2.glb",
);

// Keep the required hierarchy explicit: static batching may remove leaf meshes from the visitor candidate but not this source truth.
const semanticNames = [
  "HF01_Bible_Root",
  "Bible_LeftOpenPage",
  "Bible_RightOpenPage",
  "HF01_PrayerTable",
  "HF01_PrayerTable__Table_Top",
];

// Keep each static visitor proxy's measured source surface and deliberate local expansion together for auditable drift checks.
const proxyContracts = [
  { max: [1.5, 2.28, 0.94], min: [-0.76, 1.52, -0.92], name: "HF01_Bible_Root" },
  {
    max: [2.64, 1.93, 1.4],
    min: [-2.64, 1.51, -1.5],
    name: "HF01_PrayerTable__Table_Top",
  },
];

// Load one raw local graph with the source asset's own transforms; this never opens a renderer or requests a remote helper.
async function loadRawScene() {
  const source = readFileSync(rawCandidatePath);
  const loader = new GLTFLoader();
  const gltf = await loader.parseAsync(
    source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength),
    "",
  );
  gltf.scene.updateWorldMatrix(true, true);
  return gltf.scene;
}

// Reject a missing semantic node before attempting a box measurement so hierarchy drift is immediately understandable.
function requireNode(scene, name) {
  const node = scene.getObjectByName(name);
  if (node === undefined) {
    throw new Error(`Required authored sanctuary node is missing: ${name}.`);
  }
  return node;
}

// Ensure a generous visitor proxy still contains the full physical object it represents.
function assertContainsMeasuredBox(contract, measured) {
  const minimum = new Vector3(...contract.min);
  const maximum = new Vector3(...contract.max);
  const tolerance = 0.001;
  if (
    minimum.x > measured.min.x + tolerance ||
    minimum.y > measured.min.y + tolerance ||
    minimum.z > measured.min.z + tolerance ||
    maximum.x < measured.max.x - tolerance ||
    maximum.y < measured.max.y - tolerance ||
    maximum.z < measured.max.z - tolerance
  ) {
    throw new Error(`D9 proxy no longer contains its measured authored surface: ${contract.name}.`);
  }
}

// Measure the source graph with Three Box3 and check both semantic roots and actual physical proxy coverage.
const scene = await loadRawScene();
for (const name of semanticNames) {
  requireNode(scene, name);
}
for (const contract of proxyContracts) {
  const measured = new Box3().setFromObject(requireNode(scene, contract.name));
  if (measured.isEmpty()) {
    throw new Error(
      `Required authored sanctuary node has no measurable geometry: ${contract.name}.`,
    );
  }
  assertContainsMeasuredBox(contract, measured);
}

console.log(
  `D9 authored affordance anchors pass: ${proxyContracts.length} measured physical surfaces.`,
);
