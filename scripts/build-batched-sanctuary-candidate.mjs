/**
 * File: scripts/build-batched-sanctuary-candidate.mjs
 * Description: Builds a separate, semantics-preserving static batching candidate from the immutable R2 GLB.
 * Purpose: Lets local performance review reduce static room draw calls without altering the production rollback asset.
 * Notes: This script preserves every authored node and material identity and writes only the named review candidate.
 */

// Import only local Node helpers needed to preserve and process the repository-owned candidate artifacts.
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// Resolve artifact paths from this checked-in script so an identically named file elsewhere cannot be used by accident.
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const rawPath = resolve(repositoryRoot, "tools/hf01/candidates/realm-mvp-sanctuary-v1-raw-r2.glb");
const candidatePath = resolve(
  repositoryRoot,
  "apps/sanctuary/src/assets/candidates/realm-mvp-sanctuary-v1-r2-batched-meshopt.glb",
);
const rawSha256 = "641793795a4739e144d170ca7140e40b05cf72bc43e73bed708b2aa404893c75";
const rawByteSize = 1_100_820;

// Join only leaf meshes below these static architecture roots; animated or foreground semantic props stay separate.
const staticArchitectureRoots = new Set([
  "HF01_RoomShell",
  "HF01_PaneledWalls",
  "HF01_CraftedMolding",
  "HF01_Floorboards",
  "HF01_Bench_Left",
  "HF01_Bench_Right",
  "HF01_Bench_Front",
  "HF01_Ceiling",
  "HF01_Clerestory",
]);

// Stop early if the immutable authored input changed before any derived candidate is written.
function assertRawIdentity() {
  if (!existsSync(rawPath)) {
    throw new Error(`The required raw R2 sanctuary asset is missing: ${rawPath}.`);
  }
  const source = readFileSync(rawPath);
  const sha256 = createHash("sha256").update(source).digest("hex");
  if (source.byteLength !== rawByteSize || sha256 !== rawSha256) {
    throw new Error("The raw R2 sanctuary asset does not match its approved immutable identity.");
  }
}

// Resolve the exact locked glTF Transform dependency rather than accepting an ambient global toolchain.
function loadPinnedTransformApi() {
  const cliPackagePath = resolve(
    repositoryRoot,
    "node_modules/.pnpm/@gltf-transform+cli@4.4.2/node_modules/@gltf-transform/cli/package.json",
  );
  if (!existsSync(cliPackagePath)) {
    throw new Error(
      "The locked @gltf-transform/cli 4.4.2 package is unavailable. Install the lockfile first.",
    );
  }
  const transformRequire = createRequire(cliPackagePath);
  const cliPackage = transformRequire(cliPackagePath);
  if (cliPackage.version !== "4.4.2") {
    throw new Error(`Expected @gltf-transform/cli 4.4.2, received ${cliPackage.version}.`);
  }
  const { NodeIO, PropertyType } = transformRequire("@gltf-transform/core");
  const { ALL_EXTENSIONS } = transformRequire("@gltf-transform/extensions");
  const { join: joinMeshes, prune } = transformRequire("@gltf-transform/functions");
  return { ALL_EXTENSIONS, NodeIO, PropertyType, joinMeshes, prune };
}

// Write an uncompressed intermediate with every extension registered so material extension data survives the join.
async function writeBatchedIntermediate(path) {
  const { ALL_EXTENSIONS, NodeIO, PropertyType, joinMeshes, prune } = loadPinnedTransformApi();
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
  const document = await io.read(rawPath);
  await document.transform(
    joinMeshes({
      // This parent-scoped filter intentionally excludes the door, table, Bible, candles, cross, and all animation roots.
      filter: (node) => staticArchitectureRoots.has(node.getParentNode()?.getName() ?? ""),
      // Keep source node names and hierarchy instead of flattening semantic anchors out of the document.
      cleanup: false,
    }),
    prune({
      // Remove only now-unreferenced geometry records; node and material records remain authored and addressable.
      propertyTypes: [PropertyType.MESH, PropertyType.PRIMITIVE, PropertyType.ACCESSOR],
      keepAttributes: true,
      keepIndices: true,
      keepLeaves: true,
    }),
  );
  await io.write(path, document);
}

// Invoke the pinned command-line Meshopt pass for transport efficiency after the semantic batching pass is complete.
function writeMeshoptCandidate(intermediatePath) {
  const result = spawnSync(
    "corepack",
    [
      "pnpm@11.21.0",
      "exec",
      "gltf-transform",
      "meshopt",
      intermediatePath,
      candidatePath,
      "--level",
      "medium",
      "--quantize-position",
      "14",
      "--quantize-normal",
      "10",
      "--quantize-texcoord",
      "12",
    ],
    { cwd: repositoryRoot, encoding: "utf8" },
  );
  if (result.status !== 0) {
    throw new Error(
      `The pinned Meshopt candidate build failed:\n${result.stdout}\n${result.stderr}`,
    );
  }
  return `${result.stdout}\n${result.stderr}`.trim();
}

// Keep temporary build material outside the repository and remove only the directory this script just created.
const temporaryDirectory = mkdtempSync(join(tmpdir(), "realm-d84-batched-candidate-"));
const intermediatePath = join(temporaryDirectory, "realm-mvp-sanctuary-v1-r2-batched.glb");

try {
  assertRawIdentity();
  await writeBatchedIntermediate(intermediatePath);
  const meshoptOutput = writeMeshoptCandidate(intermediatePath);
  const candidate = readFileSync(candidatePath);
  console.log(
    JSON.stringify(
      {
        candidate: candidatePath,
        bytes: statSync(candidatePath).size,
        sha256: createHash("sha256").update(candidate).digest("hex"),
        meshoptOutput,
      },
      null,
      2,
    ),
  );
} finally {
  rmSync(temporaryDirectory, { force: true, recursive: true });
}
