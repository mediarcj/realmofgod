/**
 * File: apps/sanctuary/src/rendering/D84StaticSanctuaryProof.test.ts
 * Description: Verifies that local static sanctuary routes either preserve authored props or retain an explicit legacy proof offset.
 * Purpose: Prevents the D9 visitor candidate from silently restoring the historical 0.62 Bible scale.
 * Notes: These tests use only synthetic Three object graphs and do not create a WebGL context or load a GLB.
 */

// Import the focused renderer preparation helper and lightweight scene primitives for deterministic transform checks.
import { Group } from "three";
import { describe, expect, it } from "vitest";

import {
  prepareStaticSanctuaryScene,
  resolveAuthoredCandleFlamePositions,
  shouldStaticSanctuaryMeshCastShadow,
  STATIC_CANDLE_LIGHT_COUNT,
} from "./staticSanctuaryProof";
import type { StaticSanctuaryProofConfig } from "./capabilities";
import { createDefaultVisualCalibration } from "./visualCalibration";

// Build the four named anchors that legacy routes previously calibrated after loading an authored candidate.
function createSyntheticPropScene(): Group {
  const scene = new Group();
  for (const name of [
    "HF01_PrayerTable",
    "HF01_Bible_Root",
    "HF01_Candle_Left",
    "HF01_Candle_Right",
  ]) {
    const prop = new Group();
    prop.name = name;
    scene.add(prop);
  }
  return scene;
}

// Keep D9's scene graph transform source with Blender even when an older proof calibration remains available elsewhere.
describe("static sanctuary prop transforms", () => {
  it("preserves the authored Bible scale and all authored prop placements for the D9 policy", () => {
    const source = createSyntheticPropScene();
    const config: StaticSanctuaryProofConfig = {
      candidate: "batched",
      shadowPolicy: "restrained",
      transformPolicy: "preserve-authored",
    };
    const scene = prepareStaticSanctuaryScene(source, config, createDefaultVisualCalibration());
    const bible = scene.getObjectByName("HF01_Bible_Root");

    expect(bible?.scale.toArray()).toEqual([1, 1, 1]);
    expect(bible?.position.toArray()).toEqual([0, 0, 0]);
  });

  it("keeps the older proof transform behavior narrowly opt-in", () => {
    const source = createSyntheticPropScene();
    const config: StaticSanctuaryProofConfig = {
      candidate: "batched",
      shadowPolicy: "restrained",
      transformPolicy: "legacy-calibrated",
    };
    const scene = prepareStaticSanctuaryScene(source, config, createDefaultVisualCalibration());
    const bible = scene.getObjectByName("HF01_Bible_Root");

    expect(bible?.scale.toArray()).toEqual([0.62, 0.62, 0.62]);
  });
});

// Keep the two runtime lights fixed to the GLB's authored flame anchors instead of adding an unpictured table light.
describe("authored candle lighting anchors", () => {
  it("keeps the runtime candle-light budget at exactly two non-shadowing lights", () => {
    expect(STATIC_CANDLE_LIGHT_COUNT).toBe(2);
    expect(
      shouldStaticSanctuaryMeshCastShadow("HF01_CandleLeft__Candle_0_Mesh", "restrained"),
    ).toBe(false);
    expect(shouldStaticSanctuaryMeshCastShadow("HF01_CandleLeft__Candle_0_Flame", "current")).toBe(
      false,
    );
  });

  it("returns exactly the left and right authored flame coordinates", () => {
    const scene = new Group();
    const left = new Group();
    left.name = "HF01_CandleLeft__Candle_0_Flame";
    left.position.set(-1.55, 2.86, -0.66);
    const right = new Group();
    right.name = "HF01_CandleRight__Candle_1_Flame";
    right.position.set(1.55, 2.86, -0.66);
    scene.add(left, right);

    expect(resolveAuthoredCandleFlamePositions(scene)).toEqual({
      left: [-1.55, 2.86, -0.66],
      right: [1.55, 2.86, -0.66],
    });
  });
});
