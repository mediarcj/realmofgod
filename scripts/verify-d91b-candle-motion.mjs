/**
 * File: scripts/verify-d91b-candle-motion.mjs
 * Description: Verifies the copied approved Blender candle map and its narrow browser authority boundary.
 * Purpose: Detects map drift, procedural candle authority, extra candle lights, or runtime reference-media usage before review.
 * Notes: This read-only local script uses Node standard libraries and does not start a browser, Blender, provider, or network request.
 */

// Import only Node file and digest helpers needed to inspect checked-in local source.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Resolve every target from this script so calling it from another directory cannot widen its repository scope.
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const mapPath = resolve(
  repositoryRoot,
  "apps/sanctuary/src/assets/animation/realm-candle-motion-reference-v1.json",
);
const atmospherePath = resolve(
  repositoryRoot,
  "apps/sanctuary/src/rendering/D9LivingSanctuaryAtmosphere.tsx",
);
const policyPath = resolve(
  repositoryRoot,
  "apps/sanctuary/src/rendering/d9LivingSanctuaryPolicy.ts",
);
const scenePath = resolve(repositoryRoot, "apps/sanctuary/src/rendering/D9SanctuaryScene.tsx");

// Keep the owner-approved source digest explicit so changing the copied map requires a deliberate follow-up review.
const approvedMapSha256 = "08d1fca524d7923e3a8ca4a1b559aaecc30370717546b98fcc7f46480c96b860";

// Read a UTF-8 source file with a concise failure that makes an incomplete checkout obvious.
function readLocalFile(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    throw new Error(`Expected D9.1B local file is missing: ${path}`);
  }
}

// Fail on any contract mismatch instead of treating a visually similar procedural effect as the approved Blender performance.
function verifyApprovedMap() {
  const mapSource = readLocalFile(mapPath);
  const mapHash = createHash("sha256").update(mapSource).digest("hex");
  if (mapHash !== approvedMapSha256) {
    throw new Error("The copied D9.1B candle map does not match the approved Blender source hash.");
  }

  const map = JSON.parse(mapSource);
  if (map.schema !== "realm-candle-motion-reference-v1") {
    throw new Error("The copied D9.1B candle map has an unexpected schema.");
  }
  for (const side of ["left", "right"]) {
    const samples = map.candles?.[side]?.samples;
    if (!Array.isArray(samples) || samples.length !== 85 || samples[0]?.seconds !== 0) {
      throw new Error(`The D9.1B ${side} stream must retain all approved samples.`);
    }
    const first = samples[0];
    const last = samples.at(-1);
    const seamMatches =
      first !== undefined &&
      last !== undefined &&
      first.lean_main_deg === last.lean_main_deg &&
      first.lean_depth_deg === last.lean_depth_deg &&
      first.stretch === last.stretch &&
      first.light_multiplier === last.light_multiplier;
    if (last?.seconds !== 7 || !seamMatches) {
      throw new Error(`The D9.1B ${side} stream must retain its clean seven-second seam.`);
    }
  }
  if (JSON.stringify(map.candles.left.samples) === JSON.stringify(map.candles.right.samples)) {
    throw new Error("The D9.1B left and right candle streams must remain distinct.");
  }
  if (typeof map.web_mapping_intent?.smoke !== "string") {
    throw new Error("The D9.1B map must retain its documented smoke note.");
  }
}

// Confirm the browser imports the local map adapter and cannot silently restore prior sine-based candle authority.
function verifyBrowserBoundary() {
  const atmosphereSource = readLocalFile(atmospherePath);
  const policySource = readLocalFile(policyPath);
  const sceneSource = readLocalFile(scenePath);
  for (const requiredFragment of [
    "prepareD91BBlenderCandleMotion",
    "applyD91BBlenderCandleMotion",
    'data-d9-candle-source", "blender-approved-v1"',
    "data-d9-candle-loop-seconds",
    "data-d9-candle-left-sample",
    "data-d9-candle-right-sample",
    "policy.reducedMotion ? 0 : current.current.candleMotionAmount",
  ]) {
    if (!atmosphereSource.includes(requiredFragment)) {
      throw new Error(`The D9.1B browser adapter must preserve ${requiredFragment}.`);
    }
  }
  for (const forbiddenFragment of ["sampleD9CandleFlame", "d9CandleChannels", "IrregularSignal"]) {
    if (atmosphereSource.includes(forbiddenFragment) || policySource.includes(forbiddenFragment)) {
      throw new Error(`The D9.1B browser adapter must not retain ${forbiddenFragment}.`);
    }
  }
  const pointLightNames = ["D9_CandleLeft_RuntimeLight", "D9_CandleRight_RuntimeLight"];
  if (pointLightNames.some((name) => !sceneSource.includes(name))) {
    throw new Error("The D9.1B visitor scene must retain the two approved candle lights.");
  }
  if (sceneSource.includes("Higgsfield") || atmosphereSource.includes(".mp4")) {
    throw new Error("The D9.1B normal visitor runtime must not load reference video media.");
  }
}

verifyApprovedMap();
verifyBrowserBoundary();
console.log("D9.1B approved Blender candle map: PASS");
