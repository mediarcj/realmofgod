/**
 * File: scripts/build-hf01-assets.mjs
 * Description: Rebuilds and optimizes the locally authored HF-01 sanctuary asset.
 * Purpose: Gives reviewers one deterministic offline command for Blender source, WebP textures, and production GLB.
 * Notes: The command refuses unexpected tool versions, remote input, Blender tracebacks, or an oversized result.
 */

// Import only local process, path, and file helpers; the pipeline never opens a network connection.
import { existsSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Resolve every path from this script so invoking it from another directory cannot target another project.
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const blenderScript = resolve(repositoryRoot, "tools/hf01/build_hf01_sanctuary.py");
const rawAsset = resolve(repositoryRoot, "tools/hf01/build/realm-hf01-sanctuary.raw.glb");
const productionAsset = resolve(
  repositoryRoot,
  "apps/sanctuary/src/assets/production/realm-hf01-sanctuary.glb",
);
const expectedBlenderVersion = "Blender 5.2.0 LTS";
const expectedGltfTransformVersion = "4.4.2";
const preferredAssetLimitBytes = 3 * 1024 * 1024;
const hardAssetLimitBytes = 5 * 1024 * 1024;

// Run one local tool with inherited output only when it succeeds and contains no hidden Python traceback.
function runTool(command, arguments_, { capture = false } = {}) {
  const result = spawnSync(command, arguments_, {
    cwd: repositoryRoot,
    encoding: "utf8",
    env: process.env,
    stdio: capture ? "pipe" : "inherit",
  });

  const combinedOutput = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  if (result.error !== undefined) {
    throw result.error;
  }
  if (result.status !== 0 || combinedOutput.includes("Traceback (most recent call last)")) {
    throw new Error(`${command} failed while building the HF-01 asset.`);
  }
  return combinedOutput.trim();
}

// Verify the recorded offline authoring versions before any generated file is replaced.
const blenderVersion = runTool("blender", ["--version"], { capture: true });
if (!blenderVersion.startsWith(expectedBlenderVersion)) {
  throw new Error(`Expected ${expectedBlenderVersion}; received ${blenderVersion.split("\n")[0]}.`);
}

const gltfTransformVersion = runTool("corepack", ["pnpm", "exec", "gltf-transform", "--version"], {
  capture: true,
});
if (gltfTransformVersion !== expectedGltfTransformVersion) {
  throw new Error(
    `Expected glTF Transform ${expectedGltfTransformVersion}; received ${gltfTransformVersion}.`,
  );
}

// Recreate editable Blender source and raw GLB solely from the repository-owned Python authoring script.
runTool("blender", [
  "--background",
  "--factory-startup",
  "--python",
  blenderScript,
  "--",
  repositoryRoot,
]);
if (!existsSync(rawAsset)) {
  throw new Error("Blender completed without producing the expected raw HF-01 GLB.");
}

// Apply reviewed conservative optimization: no simplification, flattening, joining, or remote texture access.
runTool("corepack", [
  "pnpm",
  "exec",
  "gltf-transform",
  "optimize",
  rawAsset,
  productionAsset,
  "--compress",
  "meshopt",
  "--texture-compress",
  "webp",
  "--texture-size",
  "512",
  "--flatten",
  "false",
  "--join",
  "false",
  "--instance",
  "false",
  "--palette",
  "false",
  "--simplify",
  "false",
]);

// Treat three megabytes as the preferred budget and five megabytes as an absolute build failure.
const productionBytes = statSync(productionAsset).size;
if (productionBytes > hardAssetLimitBytes) {
  throw new Error(`HF-01 production GLB exceeds the 5 MB hard limit: ${productionBytes} bytes.`);
}
if (productionBytes > preferredAssetLimitBytes) {
  console.warn(`HF-01 production GLB exceeds the preferred 3 MB target: ${productionBytes} bytes.`);
}

// Finish through the repository's semantic asset validator, which also invokes the official glTF validator.
runTool(process.execPath, [resolve(repositoryRoot, "scripts/verify-hf01-assets.mjs")]);
console.log(`HF-01 asset pipeline completed at ${productionBytes} bytes.`);
