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

// Fail on the first development-only marker so production exclusion remains a release invariant.
for (const path of collectTextFiles(productionDirectory)) {
  const source = readFileSync(path, "utf8");
  const leakedMarker = forbiddenMarkers.find((marker) => source.includes(marker));
  if (leakedMarker !== undefined) {
    throw new Error(`${path.slice(repositoryRoot.length + 1)} contains ${leakedMarker}.`);
  }
}

console.log("Production visual boundary checks passed.");
