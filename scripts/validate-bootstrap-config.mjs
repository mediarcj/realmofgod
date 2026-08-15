/**
 * File: scripts/validate-bootstrap-config.mjs
 * Description: Checks the small local configuration contract for the sanctuary package.
 * Purpose: Fails early when dependency pins or loopback-only development settings drift.
 * Notes: This script reads repository files only and does not contact a provider or network service.
 */

// Import only Node standard-library helpers so configuration validation has no runtime dependency.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Resolve paths from this file so invoking the script from another directory cannot change its scope.
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const packagePath = resolve(repositoryRoot, "apps/sanctuary/package.json");
const viteConfigPath = resolve(repositoryRoot, "apps/sanctuary/vite.config.ts");

// Read a UTF-8 repository file with a direct failure message when the expected contract is absent.
function readRepositoryFile(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    throw new Error(`Expected configuration file is missing: ${path}`);
  }
}

// Keep the direct rendering dependencies exact so upgrades remain an intentional review decision.
function verifyExactRenderingPins(sanctuaryPackage) {
  const expectedPins = {
    "@react-three/fiber": "9.7.0",
    three: "0.185.1",
  };

  for (const [name, version] of Object.entries(expectedPins)) {
    if (sanctuaryPackage.dependencies?.[name] !== version) {
      throw new Error(`${name} must be pinned exactly to ${version}.`);
    }
  }

  if (sanctuaryPackage.devDependencies?.["@types/three"] !== "0.185.4") {
    throw new Error("@types/three must be pinned exactly to 0.185.4.");
  }
}

// Require explicit loopback settings and prevent convenience configuration from reopening a public host.
function verifyLoopbackViteSettings(viteConfig) {
  const requiredFragments = [
    'host: "127.0.0.1"',
    "cors: false",
    "publicDir: false",
    "polyfill: false",
  ];

  for (const fragment of requiredFragments) {
    if (!viteConfig.includes(fragment)) {
      throw new Error(`Vite configuration must include ${fragment}.`);
    }
  }
}

// Parse and validate the small package contract before reporting one clear success line.
const sanctuaryPackage = JSON.parse(readRepositoryFile(packagePath));
verifyExactRenderingPins(sanctuaryPackage);
verifyLoopbackViteSettings(readRepositoryFile(viteConfigPath));
console.log("Bootstrap configuration checks passed.");
