/**
 * File: scripts/verify-source-comments.mjs
 * Description: Verifies standard headers on tracked human-authored source and configuration files.
 * Purpose: Keeps documentation present when each reviewable file enters repository history.
 * Notes: Lockfiles and strict-data formats without comment syntax are intentionally excluded.
 */

// Import Node helpers only; Git supplies the authoritative tracked-file inventory.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, extname, resolve } from "node:path";
import { spawnSync } from "node:child_process";

// Resolve the repository root from this script so direct execution remains repository-scoped.
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const requiredHeaderFields = ["File:", "Description:", "Purpose:", "Notes:"];
const excludedFiles = new Set(["pnpm-lock.yaml", "package.json"]);
const commentCapableExtensions = new Set([
  ".css",
  ".html",
  ".js",
  ".jsonc",
  ".mjs",
  ".md",
  ".py",
  ".ts",
  ".tsx",
  ".yaml",
  ".yml",
]);
const commentCapableNames = new Set([
  ".editorconfig",
  ".gitattributes",
  ".gitignore",
  ".npmrc",
  "pnpm-workspace.yaml",
]);

// Ask Git for tracked paths so dependencies, build output, and ignored local state are never scanned.
function readTrackedPaths() {
  const result = spawnSync("git", ["ls-files", "-z"], {
    cwd: repositoryRoot,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    throw new Error("Unable to read the repository's tracked-file inventory.");
  }

  return result.stdout.split("\0").filter(Boolean);
}

// Recognize files that support the repository's standard comment header without forcing invalid JSON edits.
function requiresHeader(relativePath) {
  const filename = relativePath.split("/").at(-1);
  if (excludedFiles.has(filename)) {
    return false;
  }

  return commentCapableExtensions.has(extname(relativePath)) || commentCapableNames.has(filename);
}

// Check the first portion of each eligible file so the header remains immediately visible to reviewers.
function verifyHeader(relativePath) {
  const content = readFileSync(resolve(repositoryRoot, relativePath), "utf8");
  const openingSection = content.slice(0, 600);
  const missingFields = requiredHeaderFields.filter((field) => !openingSection.includes(field));

  if (missingFields.length > 0) {
    throw new Error(`${relativePath} is missing header fields: ${missingFields.join(", ")}`);
  }
}

// Verify every tracked, human-authored file before reporting a compact result for local use.
const eligiblePaths = readTrackedPaths().filter(requiresHeader);
for (const relativePath of eligiblePaths) {
  verifyHeader(relativePath);
}
console.log(`Source header checks passed for ${eligiblePaths.length} tracked files.`);
