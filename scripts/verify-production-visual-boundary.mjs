/**
 * File: scripts/verify-production-visual-boundary.mjs
 * Description: Verifies the production build excludes development calibration and local-reference UI.
 * Purpose: Prevents visual review tools or reference-handling labels from entering the shipped sanctuary.
 * Notes: Run only after the local production build has created the reviewed dist directory.
 */

// Import local file and path helpers used to scan the production text artifacts without executing them.
import { readdirSync, readFileSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Resolve the exact production directory and markers that belong only to local development review.
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const productionDirectory = resolve(repositoryRoot, "apps/sanctuary/dist");
const textExtensions = new Set([".css", ".html", ".js", ".map"]);
const forbiddenMarkers = [
  "HF-01 visual calibration",
  "Open visual calibration",
  "Choose local PNG/JPEG",
  "calibration-reference",
  "visual-calibration-console",
  "Visual proof",
  "Cinematic Higgsfield",
  "d84-static-proof",
  "d85-landscape-proof",
  "d85-orientation-gate",
  "Rotate your device to continue.",
  "data-d85-pacing-",
];
const forbiddenAssetMarkers = [
  "hf01f-higgsfield",
  "hybrid-visual-proof-controls",
  "realm-mvp-sanctuary-v1-r2-batched",
];

// Walk only generated production text files; binary assets are covered by the separate asset validator.
function collectTextFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      return collectTextFiles(path);
    }
    return textExtensions.has(extname(entry.name)) ? [path] : [];
  });
}

// Walk every emitted path separately so dev-only video, still, and selector CSS cannot hide as binary output.
function collectOutputPaths(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? collectOutputPaths(path) : [path];
  });
}

// Fail on the first development-only marker so production exclusion remains a release invariant.
for (const path of collectTextFiles(productionDirectory)) {
  const source = readFileSync(path, "utf8");
  const leakedMarker = forbiddenMarkers.find((marker) => source.includes(marker));
  if (leakedMarker !== undefined) {
    throw new Error(`${path.slice(repositoryRoot.length + 1)} contains ${leakedMarker}.`);
  }
}

// Reject a development-only visual asset by filename before it can reach a production deployment artifact.
for (const path of collectOutputPaths(productionDirectory)) {
  const emittedPath = path.slice(repositoryRoot.length + 1);
  const leakedAssetMarker = forbiddenAssetMarkers.find((marker) => emittedPath.includes(marker));
  if (leakedAssetMarker !== undefined) {
    throw new Error(`${emittedPath} contains development-only ${leakedAssetMarker}.`);
  }
}

console.log("Production visual boundary checks passed.");
