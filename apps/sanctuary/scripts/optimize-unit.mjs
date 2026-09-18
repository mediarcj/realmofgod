// File: apps/sanctuary/scripts/optimize-unit.mjs
// Description: Compresses a source derivative while preserving named object boundaries.
// Purpose: Keeps dense geometry and texture transfers practical for the browser.
// Notes: The input GLB and source measurements remain available for comparison.

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdtempSync, rmSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join, resolve, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const [inputArg, outputArg] = process.argv.slice(2);
if (!inputArg || !outputArg) throw Error("Usage: optimize-unit.mjs input.glb output.glb");
const input = resolve(inputArg), output = resolve(outputArg);
if (input === output) throw Error("Keep the input derivative separate.");
const cli = fileURLToPath(new URL("../node_modules/.bin/gltf-transform", import.meta.url));
const temporary = mkdtempSync(join(tmpdir(), "sanctuary-opt-"));
try {
  mkdirSync(dirname(output), { recursive: true });
  const resized = join(temporary, "resized.glb"), textured = join(temporary, "textured.glb");
  execFileSync(cli, ["resize", input, resized, "--width", "1024", "--height", "1024"], { stdio: "inherit" });
  execFileSync(cli, ["webp", resized, textured, "--quality", "90"], { stdio: "inherit" });
  execFileSync(cli, ["meshopt", textured, output, "--level", "medium", "--quantize-position", "16"], { stdio: "inherit" });
  execFileSync(cli, ["validate", output], { stdio: "inherit" });
  const bytes = readFileSync(output);
  const manifest = JSON.parse(readFileSync(input.replace(/\.glb$/, ".json")));
  manifest.uncompressed_bytes = manifest.bytes;
  manifest.uncompressed_sha256 = manifest.sha256;
  manifest.bytes = bytes.length;
  manifest.asset = basename(output);
  manifest.sha256 = createHash("sha256").update(bytes).digest("hex");
  manifest.optimization = "glTF Transform 4.4.2; 1024px textures, WebP q90, Meshopt medium, position 16 bits; no joining";
  writeFileSync(output.replace(/\.glb$/, ".json"), JSON.stringify(manifest, null, 2) + "\n");
} finally {
  // Remove only the fresh temporary directory owned by this invocation.
  rmSync(temporary, { recursive: true, force: true });
}
