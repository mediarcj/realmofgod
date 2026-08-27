/**
 * File: scripts/verify-sanctuary-boundary.mjs
 * Description: Scans browser source for forbidden persistence, provider, and outbound-request primitives.
 * Purpose: Keeps the anonymous local sanctuary from quietly gaining data collection or network behavior.
 * Notes: This is a focused static guard; the one reviewed same-tab state module is the only permitted browser session-storage boundary.
 */

// Import Node standard-library helpers for a local, deterministic source-tree scan.
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, extname, join, resolve } from "node:path";

// Resolve the browser source directory from this file so the guard cannot scan another project by accident.
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sanctuarySourceDirectory = resolve(repositoryRoot, "apps/sanctuary/src");
const sourceExtensions = new Set([".ts", ".tsx", ".css"]);
const permittedSessionStoragePath = resolve(sanctuarySourceDirectory, "sanctuary/sessionState.ts");
const forbiddenPatterns = [
  { label: "browser fetch", expression: /\bfetch\s*\(/u },
  { label: "XMLHttpRequest", expression: /\bXMLHttpRequest\b/u },
  { label: "WebSocket", expression: /\bWebSocket\b/u },
  { label: "localStorage", expression: /\blocalStorage\b/u },
  { label: "IndexedDB", expression: /\bindexedDB\b/u },
  { label: "sendBeacon", expression: /\bsendBeacon\b/u },
  { label: "Supabase", expression: /\bsupabase\b/iu },
  { label: "Stripe", expression: /\bstripe\b/iu },
  { label: "analytics", expression: /\banalytics\b/iu },
];

// Walk only the small sanctuary source tree and skip file formats that cannot contain browser code.
function collectSourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      return collectSourceFiles(path);
    }

    return sourceExtensions.has(extname(entry.name)) ? [path] : [];
  });
}

// Fail with a source-relative path so the reviewer's next action is clear and limited.
function verifyFile(path) {
  const source = readFileSync(path, "utf8");
  for (const forbiddenPattern of forbiddenPatterns) {
    if (forbiddenPattern.expression.test(source)) {
      const relativePath = path.slice(repositoryRoot.length + 1);
      throw new Error(`${relativePath} contains forbidden ${forbiddenPattern.label} behavior.`);
    }
  }

  // Permit the narrowly reviewed same-tab state helper and reject session persistence from every other browser module.
  if (path !== permittedSessionStoragePath && /\bsessionStorage\b/u.test(source)) {
    const relativePath = path.slice(repositoryRoot.length + 1);
    throw new Error(`${relativePath} contains forbidden sessionStorage behavior.`);
  }
}

// Inspect every browser source file without executing application code or opening a network connection.
const sourceFiles = collectSourceFiles(sanctuarySourceDirectory);
for (const sourceFile of sourceFiles) {
  verifyFile(sourceFile);
}
console.log(`Sanctuary boundary checks passed for ${sourceFiles.length} source files.`);
