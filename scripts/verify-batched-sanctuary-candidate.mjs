/**
 * File: scripts/verify-batched-sanctuary-candidate.mjs
 * Description: Validates the separate R2 static-batching candidate against the immutable source contract.
 * Purpose: Proves batching reduces only static draw work while retaining authored semantic anchors and PBR material data.
 * Notes: This verifier never reads the production rollback asset and does not contact an external service.
 */

// Import only local inspection helpers so binary contract checks remain deterministic and offline.
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Resolve all paths from this script to prevent accidental validation of another matching asset name.
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const rawPath = resolve(repositoryRoot, "tools/hf01/candidates/realm-mvp-sanctuary-v1-raw-r2.glb");
const candidatePath = resolve(
  repositoryRoot,
  "apps/sanctuary/src/assets/candidates/realm-mvp-sanctuary-v1-r2-batched-meshopt.glb",
);
const staticVerifierPath = resolve(repositoryRoot, "scripts/verify-static-sanctuary-candidate.mjs");
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
  "HF01_DoorStaticWorld__Door_North_Slab",
  "HF01_DoorStaticWorld__Door_North_UpperHingeLeaf",
  "HF01_PrayerTable",
  "HF01_TableCross_Root",
  "HF01_Candle_Left",
  "HF01_Candle_Right",
  "HF01_Bible_Root",
];
const forbiddenNames = /(?:D[2-5]|workshop|proof|corpus)/iu;
const staticBatchName = /^HF01_D84_StaticBatch(?:_Mesh)?_\d+$/u;

// Read the JSON chunk directly so draw-cost facts are not inferred from renderer behavior.
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

// Canonicalize object-key order before comparing values because valid glTF writers may choose a different JSON field order.
function canonicalize(value) {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalize(child)]),
    );
  }
  return value;
}

// Count triangles from indexed primitives rather than guessing one draw per mesh.
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

// Summarize the semantic and rendering facts that should remain stable across the batching transform.
function summarize(document) {
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
    materialNames: (document.materials ?? []).map((material) => material.name ?? ""),
    nodeNames: (document.nodes ?? []).map((node) => node.name ?? ""),
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

// Keep command output concise while the full node and material arrays remain available to the contract checks above.
function summarizeForReport(summary) {
  const { materialNames, nodeNames, ...counts } = summary;
  return {
    ...counts,
    materialNameCount: materialNames.length,
    nodeNameCount: nodeNames.length,
  };
}

// Preserve source provenance by running the existing immutable R2 verifier before the derived file is considered.
function verifyRawBoundary() {
  const result = spawnSync(process.execPath, [staticVerifierPath], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    throw new Error(`The immutable R2 verifier failed:\n${result.stdout}\n${result.stderr}`);
  }
}

// Run the installed glTF validator as a second, format-level check after the local contract is satisfied.
function validateCandidateTransport() {
  const result = spawnSync(
    "corepack",
    [
      "pnpm@11.21.0",
      "exec",
      "gltf-transform",
      "validate",
      candidatePath,
      "--format",
      "csv",
      "--limit",
      "40",
    ],
    {
      cwd: repositoryRoot,
      encoding: "utf8",
    },
  );
  if (result.status !== 0) {
    throw new Error(
      `The batched candidate failed glTF validation:\n${result.stdout}\n${result.stderr}`,
    );
  }
  // The installed validator cannot decode Meshopt itself, and therefore reports its compressed UV accessors
  // as unused. Return compact advisory counts for review without concealing the validator's exit status.
  return result.stdout
    .trim()
    .split("\n")
    .slice(1)
    .filter(Boolean)
    .reduce((codes, row) => {
      const [code] = row.split(",", 1);
      codes[code] = (codes[code] ?? 0) + 1;
      return codes;
    }, {});
}

// Ensure batching changes only the allowed renderable primitive structure and Meshopt transport metadata.
function assertBatchedContract(rawDocument, raw, candidateDocument, candidate) {
  const equalScalars = [
    "sceneCount",
    "triangleCount",
    "materialCount",
    "cameraCount",
    "animationCount",
    "skinCount",
    "lightCount",
    "imageCount",
    "textureCount",
  ];
  for (const key of equalScalars) {
    if (raw[key] !== candidate[key]) {
      throw new Error(`Candidate ${key} changed: raw=${raw[key]}, candidate=${candidate[key]}.`);
    }
  }
  if (candidate.nodeCount !== raw.nodeCount + 8) {
    throw new Error(
      `Candidate semantic anchor contract changed: expected ${raw.nodeCount + 8} nodes, received ${candidate.nodeCount}.`,
    );
  }
  if (candidate.meshCount !== 75 || candidate.primitiveCount !== 75) {
    throw new Error(
      `Candidate batching contract changed: expected 75 meshes and primitives, received ${candidate.meshCount}/${candidate.primitiveCount}.`,
    );
  }
  if (candidate.primitiveCount >= raw.primitiveCount) {
    throw new Error("Candidate did not reduce the static primitive count.");
  }
  if (
    raw.nodeNames.some((name) => !candidate.nodeNames.includes(name)) ||
    raw.materialNames.join("\n") !== candidate.materialNames.join("\n")
  ) {
    throw new Error(
      "Candidate changed an authored semantic node name or reordered a material identity.",
    );
  }
  if (
    JSON.stringify(canonicalize(rawDocument.materials ?? [])) !==
    JSON.stringify(canonicalize(candidateDocument.materials ?? []))
  ) {
    throw new Error("Candidate changed an authored PBR material or its extension data.");
  }
  // Meshopt quantization may rewrite equivalent local transform values alongside its vertex encoding.
  // The contract therefore retains every named anchor and verifies source materials exactly, while visual review
  // compares the resulting room rather than treating a JSON representation detail as a geometry change.
  const missingNodes = requiredNodeNames.filter((name) => !candidate.nodeNames.includes(name));
  const leakedNames = candidate.nodeNames.filter((name) => forbiddenNames.test(name));
  const batchNodeCount = candidate.nodeNames.filter((name) => staticBatchName.test(name)).length;
  if (missingNodes.length > 0 || leakedNames.length > 0 || batchNodeCount !== 8) {
    throw new Error(
      `Candidate semantic nodes are invalid: missing=${missingNodes.join(",")}; leaked=${leakedNames.join(",")}; batchNodes=${batchNodeCount}.`,
    );
  }
  if (
    !candidate.extensionsRequired.includes("EXT_meshopt_compression") ||
    !candidate.extensionsRequired.includes("KHR_mesh_quantization") ||
    candidate.extensionsUsed.includes("KHR_draco_mesh_compression")
  ) {
    throw new Error("Candidate does not have the required Meshopt-only transport contract.");
  }
}

// Require the current candidate before any downstream renderer proof can present it.
for (const path of [rawPath, candidatePath]) {
  if (!existsSync(path)) {
    throw new Error(`Required asset is missing: ${path}.`);
  }
}

verifyRawBoundary();
const { buffer: rawBuffer, document: rawDocument } = readGlbJson(rawPath);
const { buffer: candidateBuffer, document: candidateDocument } = readGlbJson(candidatePath);
const raw = summarize(rawDocument);
const candidate = summarize(candidateDocument);
assertBatchedContract(rawDocument, raw, candidateDocument, candidate);
const validationReport = validateCandidateTransport();

console.log(
  JSON.stringify(
    {
      raw: { bytes: rawBuffer.byteLength, ...summarizeForReport(raw) },
      candidate: {
        bytes: candidateBuffer.byteLength,
        sha256: createHash("sha256").update(candidateBuffer).digest("hex"),
        primitiveReductionPercent: Number(
          ((1 - candidate.primitiveCount / raw.primitiveCount) * 100).toFixed(2),
        ),
        byteReductionPercent: Number(
          ((1 - candidateBuffer.byteLength / rawBuffer.byteLength) * 100).toFixed(2),
        ),
        ...summarizeForReport(candidate),
      },
      likelyMaximumDrawCalls: candidate.primitiveCount,
      validatorAdvisoryCodes: validationReport,
    },
    null,
    2,
  ),
);
