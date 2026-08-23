/**
 * File: scripts/verify-static-sanctuary-candidate.mjs
 * Description: Validates the staged R2 sanctuary source and its Meshopt-only review candidate.
 * Purpose: Keeps the authored semantic contract explicit before a static local renderer proof may use it.
 * Notes: This script does not replace the current production sanctuary asset or contact any external service.
 */

// Import only local Node helpers needed to inspect the two repository-owned binary artifacts.
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Resolve every path from this script so direct invocation cannot accidentally inspect a similarly named file.
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const rawPath = resolve(repositoryRoot, "tools/hf01/candidates/realm-mvp-sanctuary-v1-raw-r2.glb");
const candidatePath = resolve(
  repositoryRoot,
  "apps/sanctuary/src/assets/candidates/realm-mvp-sanctuary-v1-r2-meshopt.glb",
);
const rawSha256 = "641793795a4739e144d170ca7140e40b05cf72bc43e73bed708b2aa404893c75";
const rawByteSize = 1_100_820;
const requiredNodeNames = [
  "HF01_Sanctuary_Root",
  "HF01_RoomShell",
  "HF01_PaneledWalls",
  "HF01_CraftedMolding",
  "HF01_Floorboards",
  "HF01_Bench_Left",
  "HF01_Bench_Right",
  "HF01_Bench_Front",
  "HF01_DoorFrame",
  "HF01_Door_Hinge",
  "HF01_PrayerTable",
  "HF01_TableCross_Root",
  "HF01_Candle_Left",
  "HF01_Candle_Right",
  "HF01_Bible_Root",
];
const forbiddenNames = /(?:D[2-5]|workshop|proof)/iu;

// Read the JSON chunk directly so scene facts remain independently checked rather than inferred from a renderer.
function readGlbJson(path) {
  const buffer = readFileSync(path);
  if (buffer.readUInt32LE(0) !== 0x46546c67 || buffer.readUInt32LE(4) !== 2) {
    throw new Error(`${path} is not a glTF 2.0 binary.`);
  }
  if (buffer.readUInt32LE(8) !== buffer.byteLength || buffer.readUInt32LE(16) !== 0x4e4f534a) {
    throw new Error(`${path} has an invalid GLB header or JSON chunk.`);
  }
  return {
    buffer,
    document: JSON.parse(buffer.subarray(20, 20 + buffer.readUInt32LE(12)).toString("utf8")),
  };
}

// Count actual primitive topology instead of treating every mesh as one primitive by assumption.
function countTriangles(document) {
  return (document.meshes ?? []).reduce(
    (total, mesh) =>
      total +
      (mesh.primitives ?? []).reduce((meshTotal, primitive) => {
        const accessor = document.accessors?.[primitive.indices];
        return meshTotal + Math.floor((accessor?.count ?? 0) / 3);
      }, 0),
    0,
  );
}

// Capture the semantic facts used by the current acceptance boundary in one comparable value.
function summarize(document) {
  const nodeNames = (document.nodes ?? []).map((node) => node.name ?? "");
  const materialNames = (document.materials ?? []).map((material) => material.name ?? "");
  const primitiveCount = (document.meshes ?? []).reduce(
    (total, mesh) => total + (mesh.primitives?.length ?? 0),
    0,
  );
  return {
    sceneCount: document.scenes?.length ?? 0,
    nodeCount: document.nodes?.length ?? 0,
    meshCount: document.meshes?.length ?? 0,
    primitiveCount,
    triangleCount: countTriangles(document),
    materialCount: document.materials?.length ?? 0,
    materialNames,
    nodeNames,
    cameraCount: document.cameras?.length ?? 0,
    animationCount: document.animations?.length ?? 0,
    skinCount: document.skins?.length ?? 0,
    lightCount: document.extensions?.KHR_lights_punctual?.lights?.length ?? 0,
    imageCount: document.images?.length ?? 0,
    textureCount: document.textures?.length ?? 0,
    extensionsUsed: document.extensionsUsed ?? [],
    extensionsRequired: document.extensionsRequired ?? [],
  };
}

// Stop on any changed authored meaning before the candidate can be considered for a local load proof.
function assertRawContract(raw, rawBuffer) {
  if (rawBuffer.byteLength !== rawByteSize) {
    throw new Error(
      `Raw byte size changed: expected ${rawByteSize}, received ${rawBuffer.byteLength}.`,
    );
  }
  const observedSha = createHash("sha256").update(rawBuffer).digest("hex");
  if (observedSha !== rawSha256) {
    throw new Error(`Raw SHA-256 changed: expected ${rawSha256}, received ${observedSha}.`);
  }
  const expected = [
    raw.sceneCount === 1,
    raw.nodeCount === 465,
    raw.meshCount === 444,
    raw.primitiveCount === 444,
    raw.triangleCount === 12_368,
    raw.materialCount === 17,
    raw.cameraCount === 0,
    raw.animationCount === 0,
    raw.skinCount === 0,
    raw.lightCount === 0,
    raw.imageCount === 0,
    raw.textureCount === 0,
    raw.extensionsRequired.length === 0,
  ];
  if (expected.some((result) => !result)) {
    throw new Error(`Raw R2 contract mismatch: ${JSON.stringify(raw)}.`);
  }
  const missingNodes = requiredNodeNames.filter((name) => !raw.nodeNames.includes(name));
  const leakedNames = raw.nodeNames.filter((name) => forbiddenNames.test(name));
  if (
    missingNodes.length > 0 ||
    leakedNames.length > 0 ||
    raw.nodeNames.filter((name) => name === "HF01_Candle_Left" || name === "HF01_Candle_Right")
      .length !== 2
  ) {
    throw new Error(
      `Raw semantic nodes are invalid: missing=${missingNodes.join(",")}; leaked=${leakedNames.join(",")}.`,
    );
  }
}

// Compare the optimized file with raw semantics while allowing only Meshopt and quantization metadata to differ.
function assertCandidateContract(raw, candidate) {
  const scalarKeys = [
    "sceneCount",
    "nodeCount",
    "meshCount",
    "primitiveCount",
    "triangleCount",
    "materialCount",
    "cameraCount",
    "animationCount",
    "skinCount",
    "lightCount",
    "imageCount",
    "textureCount",
  ];
  for (const key of scalarKeys) {
    if (raw[key] !== candidate[key]) {
      throw new Error(`Candidate ${key} changed: raw=${raw[key]}, candidate=${candidate[key]}.`);
    }
  }
  if (
    raw.nodeNames.join("\n") !== candidate.nodeNames.join("\n") ||
    raw.materialNames.join("\n") !== candidate.materialNames.join("\n")
  ) {
    throw new Error("Candidate renamed or reordered authored semantic nodes or materials.");
  }
  if (
    !candidate.extensionsRequired.includes("EXT_meshopt_compression") ||
    !candidate.extensionsRequired.includes("KHR_mesh_quantization")
  ) {
    throw new Error("Candidate is missing its declared Meshopt or quantization requirement.");
  }
  const missingNodes = requiredNodeNames.filter((name) => !candidate.nodeNames.includes(name));
  const leakedNames = candidate.nodeNames.filter((name) => forbiddenNames.test(name));
  if (missingNodes.length > 0 || leakedNames.length > 0) {
    throw new Error(
      `Candidate semantic nodes are invalid: missing=${missingNodes.join(",")}; leaked=${leakedNames.join(",")}.`,
    );
  }
}

// Use the installed validator when present and distinguish its advisory warnings from a hard validation error.
function runInstalledValidator(path) {
  const result = spawnSync(
    "corepack",
    ["pnpm", "exec", "gltf-transform", "validate", path, "--format", "csv", "--limit", "40"],
    { cwd: repositoryRoot, encoding: "utf8" },
  );
  const output = `${result.stdout}\n${result.stderr}`;
  if (result.status !== 0 || /(?:^|,)ERROR(?:,|$)|severity:?[\s=]*0/iu.test(output)) {
    throw new Error(`Installed glTF validator rejected ${path}:\n${output}`);
  }
  return output
    .split("\n")
    .filter((line) => line.includes("UNUSED_OBJECT") || line.includes("UNSUPPORTED_EXTENSION"));
}

// Resolve both staged paths first so a missing candidate cannot be mistaken for a production asset pass.
for (const path of [rawPath, candidatePath]) {
  if (!existsSync(path)) {
    throw new Error(`Required staged asset is missing: ${path}.`);
  }
}

const { buffer: rawBuffer, document: rawDocument } = readGlbJson(rawPath);
const { buffer: candidateBuffer, document: candidateDocument } = readGlbJson(candidatePath);
const raw = summarize(rawDocument);
const candidate = summarize(candidateDocument);
assertRawContract(raw, rawBuffer);
assertCandidateContract(raw, candidate);
const validatorAdvisories = runInstalledValidator(candidatePath);
const candidateSha256 = createHash("sha256").update(candidateBuffer).digest("hex");
const reduction = ((1 - candidateBuffer.byteLength / rawBuffer.byteLength) * 100).toFixed(2);

console.log(
  JSON.stringify(
    {
      raw: { bytes: rawBuffer.byteLength, sha256: rawSha256, ...raw },
      candidate: {
        bytes: candidateBuffer.byteLength,
        sha256: candidateSha256,
        reductionPercent: Number(reduction),
        ...candidate,
      },
      likelyMaximumDrawCalls: candidate.primitiveCount,
      validatorAdvisories,
    },
    null,
    2,
  ),
);
