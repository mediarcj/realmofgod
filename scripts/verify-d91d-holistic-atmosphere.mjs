/**
 * File: scripts/verify-d91d-holistic-atmosphere.mjs
 * Description: Verifies the narrow D9.1D room-atmosphere calibration boundary.
 * Purpose: Prevents holistic ambience work from changing the passed candle system, camera authority, or local performance limits.
 * Notes: This read-only local script inspects source text only and does not open a browser, start Blender, use storage, or contact a service.
 */

// Import the small Node helpers needed to inspect just the D9.1D rendering boundary from any working directory.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Resolve the three source surfaces whose relationship defines this atmosphere-only pass.
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const atmospherePath = resolve(
  repositoryRoot,
  "apps/sanctuary/src/rendering/D9LivingSanctuaryAtmosphere.tsx",
);
const policyPath = resolve(
  repositoryRoot,
  "apps/sanctuary/src/rendering/d9LivingSanctuaryPolicy.ts",
);
const scenePath = resolve(repositoryRoot, "apps/sanctuary/src/rendering/D9SanctuaryScene.tsx");

// Read one expected source file with a clear failure so an incomplete checkout cannot look verified.
function readLocalFile(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    throw new Error(`Expected D9.1D local file is missing: ${path}`);
  }
}

// Keep the passed candle pipeline connected while requiring the local dust profile and ordinary daylight-only exterior modulation.
function verifyAtmosphereBoundary(atmosphereSource) {
  for (const requiredFragment of [
    "applyD91BBlenderCandleMotion",
    "applyD91CCandlePresentation",
    "d91cPerceptualGain",
    "D9_Exterior_RuntimeLight",
    "createD9DustBasePositions(profile: D9DustProfile)",
    "data-d9-atmosphere-dust-profile",
    "sampleD9DaylightModulation",
    "sampleD9CloudSoftening",
    "setDrawRange(0, policy.dustCount)",
  ]) {
    if (!atmosphereSource.includes(requiredFragment)) {
      throw new Error(`The D9.1D atmosphere boundary must preserve ${requiredFragment}.`);
    }
  }
  for (const forbiddenFragment of [
    "<pointLight",
    "<directionalLight",
    "createD9DevelopmentCloudSample",
    "camera.position",
    "camera.lookAt",
    "OrbitControls",
    "localStorage",
    "sessionStorage",
    "useState(",
  ]) {
    if (atmosphereSource.includes(forbiddenFragment)) {
      throw new Error(`The D9.1D atmosphere must not introduce ${forbiddenFragment}.`);
    }
  }
}

// Require bounded semantic policies, the fixed cloud cooldown, and a deterministic test-only cloud sampler without a visitor path.
function verifyPolicyBoundary(policySource) {
  for (const requiredFragment of [
    'dustProfile: "sanctuary-air"',
    'dustProfile: "sit-table-warmth"',
    'dustProfile: "read-quiet"',
    'dustProfile: "pray-upper-light"',
    "minimum: 95_000",
    "maximum: 210_000",
    "createD9DevelopmentCloudSample",
    "allowBirdAnimation: false",
    "cadenceFramesPerSecond: 0",
  ]) {
    if (!policySource.includes(requiredFragment)) {
      throw new Error(`The D9.1D atmosphere policy must preserve ${requiredFragment}.`);
    }
  }
  for (const forbiddenFragment of [
    "localStorage",
    "sessionStorage",
    "fetch(",
    "Audio(",
    "requestAnimationFrame",
  ]) {
    if (policySource.includes(forbiddenFragment)) {
      throw new Error(`The D9.1D atmosphere policy must not introduce ${forbiddenFragment}.`);
    }
  }
}

// Keep the two accepted candle lights and static exterior direction in their pre-existing visitor scene rather than adding a room-light architecture.
function verifySceneBoundary(sceneSource) {
  for (const requiredFragment of [
    'name="D9_Exterior_RuntimeLight"',
    'name="D9_CandleLeft_RuntimeLight"',
    'name="D9_CandleRight_RuntimeLight"',
    "position={[4.5, 7.5, 1.5]}",
  ]) {
    if (!sceneSource.includes(requiredFragment)) {
      throw new Error(`The D9.1D visitor scene must preserve ${requiredFragment}.`);
    }
  }
  if ((sceneSource.match(/<pointLight/g) ?? []).length !== 2) {
    throw new Error("The D9.1D visitor scene must retain exactly two candle point lights.");
  }
}

verifyAtmosphereBoundary(readLocalFile(atmospherePath));
verifyPolicyBoundary(readLocalFile(policyPath));
verifySceneBoundary(readLocalFile(scenePath));
console.log("D9.1D holistic-atmosphere boundary: PASS");
