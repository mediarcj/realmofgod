/**
 * File: scripts/verify-d91c-candle-fidelity.mjs
 * Description: Verifies the narrow D9.1C candle-presentation and smoke boundary.
 * Purpose: Prevents visual fidelity work from changing the approved map, adding a light, or restoring uncontrolled flame motion.
 * Notes: This read-only local script uses Node standard libraries and does not start a browser, Blender, provider, or network request.
 */

// Import only the file helpers needed to inspect the checked-in source boundary from any working directory.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Resolve the three narrow D9.1C surfaces so this verifier cannot drift into unrelated repository files.
const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const atmospherePath = resolve(
  repositoryRoot,
  "apps/sanctuary/src/rendering/D9LivingSanctuaryAtmosphere.tsx",
);
const fidelityPath = resolve(repositoryRoot, "apps/sanctuary/src/rendering/d91cCandleFidelity.ts");
const scenePath = resolve(repositoryRoot, "apps/sanctuary/src/rendering/D9SanctuaryScene.tsx");

// Read one source file with an explicit message so an incomplete checkout does not produce a misleading pass.
function readLocalFile(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    throw new Error(`Expected D9.1C local file is missing: ${path}`);
  }
}

// Confirm browser presentation consumes the existing D9.1B transform result and retains the local diagnostics needed for review.
function verifyPresentationConnection(atmosphereSource) {
  for (const requiredFragment of [
    "prepareD91CCandlePresentation",
    "applyD91CCandlePresentation",
    "restoreD91CCandlePresentation",
    "transform.lightMultiplier",
    "policy.reducedMotion",
    "data-d9-candle-fidelity",
    "data-d9-candle-motion-amplitude",
    "data-d9-candle-wicks",
    "data-d9-candle-smoke",
    "data-d9-candle-perceptual-gain",
  ]) {
    if (!atmosphereSource.includes(requiredFragment)) {
      throw new Error(`The D9.1C atmosphere connection must preserve ${requiredFragment}.`);
    }
  }
}

// Confirm the fidelity layer has two known authored wicks, one bounded halo per side, four or fewer smoke sprites, and no light ownership.
function verifyFidelityBoundary(fidelitySource) {
  for (const requiredFragment of [
    "HF01_CandleLeft__Candle_0_Wick",
    "HF01_CandleRight__Candle_1_Wick",
    "d91cMaximumSmokeSprites = 4",
    "D91C_${side}_InnerFlameCore",
    "D91C_${side}_CandleHalo",
    "D91C_${side}_WickEmber",
    "D91C_${side}_WickAnchoredSmoke",
    "outerFlame.parent.add(innerFlame)",
    "outerFlame.parent.add(halo.sprite)",
    "setObjectAtWorldPosition(wick.parent, ember.sprite, wickAnchor)",
    "sampleD91CSmoke",
    "reducedMotion",
  ]) {
    if (!fidelitySource.includes(requiredFragment)) {
      throw new Error(`The D9.1C candle-fidelity layer must preserve ${requiredFragment}.`);
    }
  }
  for (const forbiddenFragment of [
    "PointLight",
    "pointLight",
    "Math.random",
    "requestAnimationFrame",
    "useState",
    "localStorage",
    "sessionStorage",
    "waxMelt",
    "meltWax",
  ]) {
    if (fidelitySource.includes(forbiddenFragment)) {
      throw new Error(`The D9.1C candle-fidelity layer must not introduce ${forbiddenFragment}.`);
    }
  }
  const gainMatch = fidelitySource.match(/d91cPerceptualGain\s*=\s*([0-9.]+)/);
  const gain = gainMatch === null ? Number.NaN : Number(gainMatch[1]);
  if (!Number.isFinite(gain) || gain < 1 || gain > 1.3) {
    throw new Error(
      "The D9.1C perceptual gain must remain within the owner-approved 1.00–1.30 boundary.",
    );
  }
}

// Count the accepted two named point lights in the normal visitor scene so a cosmetic flame layer cannot quietly brighten staging with another source.
function verifyTwoCandleLights(sceneSource) {
  const names = ["D9_CandleLeft_RuntimeLight", "D9_CandleRight_RuntimeLight"];
  for (const name of names) {
    if ((sceneSource.match(new RegExp(name, "g")) ?? []).length !== 1) {
      throw new Error(`The D9.1C visitor scene must contain exactly one ${name}.`);
    }
  }
  if ((sceneSource.match(/<pointLight/g) ?? []).length !== 2) {
    throw new Error("The D9.1C visitor scene must retain exactly two candle point lights.");
  }
}

verifyPresentationConnection(readLocalFile(atmospherePath));
verifyFidelityBoundary(readLocalFile(fidelityPath));
verifyTwoCandleLights(readLocalFile(scenePath));
console.log("D9.1C candle-fidelity boundary: PASS");
