/**
 * File: apps/sanctuary/src/rendering/d91bBlenderCandleMotion.test.ts
 * Description: Verifies the approved Blender candle map, axis conversion, isolated runtime pivots, and neutral reduced-motion result.
 * Purpose: Prevents browser code from silently replacing the owner-approved left and right candle performance with procedural motion.
 * Notes: Tests use local JSON and synthetic Three graphs only; they do not construct WebGL, open a network connection, or load visitor data.
 */

// Import compact synthetic scene primitives and the focused local motion helpers under test.
import { BoxGeometry, Group, Mesh, MeshBasicMaterial, Vector3 } from "three";
import { describe, expect, it } from "vitest";

import {
  applyD91BBlenderCandleMotion,
  d91bBlenderCandleMotionReference,
  d91bCandleFlameNames,
  d91bCandleLoopSeconds,
  d91bCandleSides,
  mapD91BBlenderSampleToThree,
  prepareD91BBlenderCandleMotion,
  restoreD91BBlenderCandleMotion,
  sampleD91BBlenderCandleMotion,
} from "./d91bBlenderCandleMotion";

// Build two direct visible mesh roots with the inspected local GLB placement so pivot behavior can be checked without a renderer.
function createSyntheticFlameScene(): Group {
  const scene = new Group();
  for (const [index, side] of d91bCandleSides.entries()) {
    const candle = new Group();
    candle.name = side === "left" ? "HF01_Candle_Left" : "HF01_Candle_Right";
    const flame = new Mesh(new BoxGeometry(0.8, 2, 0.8), new MeshBasicMaterial());
    flame.name = d91bCandleFlameNames[side];
    flame.position.set(index === 0 ? -1.55 : 1.55, 2.86, -0.66);
    flame.scale.setScalar(0.075);
    candle.add(flame);
    scene.add(candle);
  }
  scene.updateWorldMatrix(true, true);
  return scene;
}

// Keep the checked-in JSON contract and left/right authored streams separate and seamless.
describe("D9.1B approved Blender candle map", () => {
  it("keeps the expected versioned schema, two named streams, and seven-second loop", () => {
    expect(d91bBlenderCandleMotionReference.schema).toBe("realm-candle-motion-reference-v1");
    expect(d91bCandleSides).toEqual(["left", "right"]);
    expect(d91bCandleLoopSeconds).toBe(7);
    expect(d91bBlenderCandleMotionReference.candles.left.samples).toHaveLength(85);
    expect(d91bBlenderCandleMotionReference.candles.right.samples).toHaveLength(85);
  });

  it("preserves distinct approved left and right samples at representative authored times", () => {
    const left = sampleD91BBlenderCandleMotion("left", 2.5);
    const right = sampleD91BBlenderCandleMotion("right", 2.5);
    expect(left).toMatchObject({
      lean_depth_deg: 0.117359,
      lean_main_deg: -2.4,
      light_multiplier: 1.06,
      stretch: 1.09,
    });
    expect(right).toMatchObject({
      lean_depth_deg: -1.276029,
      lean_main_deg: 0.4,
      light_multiplier: 1.07,
      stretch: 1.09,
    });
    expect(left).not.toEqual(right);
  });

  it("returns the same authored result at the clean loop seam and linearly blends between captured samples", () => {
    expect(sampleD91BBlenderCandleMotion("left", 0)).toEqual(
      sampleD91BBlenderCandleMotion("left", d91bCandleLoopSeconds),
    );
    expect(sampleD91BBlenderCandleMotion("right", 0)).toEqual(
      sampleD91BBlenderCandleMotion("right", d91bCandleLoopSeconds),
    );
    expect(sampleD91BBlenderCandleMotion("left", 0.0416665).lean_main_deg).toBeCloseTo(
      -1.6666665,
      5,
    );
  });
});

// Cover the inspected Blender-to-glTF coordinate conversion rather than allowing a plausible but incorrect axis swap.
describe("D9.1B Blender-to-Three flame conversion", () => {
  it("maps Blender depth X, main Y, and vertical stretch Z into Three X, negative Z, and Y", () => {
    const transform = mapD91BBlenderSampleToThree(sampleD91BBlenderCandleMotion("left", 1), 1);
    expect(transform.rotationX).toBeCloseTo((0.958004 * Math.PI) / 180, 8);
    expect(transform.rotationZ).toBeCloseTo((0.6 * Math.PI) / 180, 8);
    expect(transform.scaleY).toBeCloseTo(1.06, 8);
    expect(transform.lightMultiplier).toBeCloseTo(1.045, 8);
  });

  it("returns an exact neutral transform and stable unit candle light when reduced motion supplies zero amplitude", () => {
    expect(mapD91BBlenderSampleToThree(sampleD91BBlenderCandleMotion("right", 4.5), 0)).toEqual({
      lightMultiplier: 1,
      rotationX: 0,
      rotationZ: 0,
      scaleY: 1,
    });
  });

  it("can apply only a bounded visual gain to authored lean and stretch without changing the map light sample", () => {
    const sample = sampleD91BBlenderCandleMotion("left", 2.5);
    const neutralGain = mapD91BBlenderSampleToThree(sample, 1);
    const visualGain = mapD91BBlenderSampleToThree(sample, 1, 1.18);
    expect(Math.abs(visualGain.rotationX)).toBeGreaterThan(Math.abs(neutralGain.rotationX));
    expect(Math.abs(visualGain.rotationZ)).toBeGreaterThan(Math.abs(neutralGain.rotationZ));
    expect(visualGain.scaleY).toBeGreaterThan(neutralGain.scaleY);
    expect(visualGain.lightMultiplier).toBe(neutralGain.lightMultiplier);
  });
});

// Prove that the runtime changes only the two named flame roots while preserving their original world placement through base pivots.
describe("D9.1B isolated flame pivots", () => {
  it("reparents both direct visible meshes at their bases without moving their world centers", () => {
    const scene = createSyntheticFlameScene();
    const leftBefore = scene
      .getObjectByName(d91bCandleFlameNames.left)
      ?.getWorldPosition(new Vector3());
    const rightBefore = scene
      .getObjectByName(d91bCandleFlameNames.right)
      ?.getWorldPosition(new Vector3());
    const rigs = prepareD91BBlenderCandleMotion(scene);
    scene.updateWorldMatrix(true, true);

    expect(rigs.left.source.parent).toBe(rigs.left.pivot);
    expect(rigs.right.source.parent).toBe(rigs.right.pivot);
    expect(rigs.left.source).toBeInstanceOf(Mesh);
    expect(rigs.right.source).toBeInstanceOf(Mesh);
    expect(rigs.left.source.children).toHaveLength(0);
    expect(rigs.right.source.children).toHaveLength(0);
    expect(rigs.left.source.getWorldPosition(new Vector3())).toEqual(leftBefore);
    expect(rigs.right.source.getWorldPosition(new Vector3())).toEqual(rightBefore);
    expect(rigs.left.pivot.getWorldPosition(new Vector3()).y).toBeCloseTo(2.785, 5);
    expect(rigs.right.pivot.getWorldPosition(new Vector3()).y).toBeCloseTo(2.785, 5);
  });

  it("applies map motion through pivots only and restores both pivots to their neutral transforms", () => {
    const rigs = prepareD91BBlenderCandleMotion(createSyntheticFlameScene());
    applyD91BBlenderCandleMotion(rigs.left, "left", 6, 1);
    applyD91BBlenderCandleMotion(rigs.right, "right", 6, 1);
    expect(rigs.left.pivot.rotation.z).not.toBe(rigs.right.pivot.rotation.z);
    expect(rigs.left.source.rotation.x).toBeCloseTo(0, 12);
    expect(rigs.left.source.rotation.y).toBeCloseTo(0, 12);
    expect(rigs.left.source.rotation.z).toBeCloseTo(0, 12);
    expect(rigs.right.source.rotation.x).toBeCloseTo(0, 12);
    expect(rigs.right.source.rotation.y).toBeCloseTo(0, 12);
    expect(rigs.right.source.rotation.z).toBeCloseTo(0, 12);

    restoreD91BBlenderCandleMotion(rigs.left);
    restoreD91BBlenderCandleMotion(rigs.right);
    expect(rigs.left.pivot.rotation.toArray()).toEqual([0, 0, 0, "XYZ"]);
    expect(rigs.right.pivot.rotation.toArray()).toEqual([0, 0, 0, "XYZ"]);
    expect(rigs.left.pivot.scale.toArray()).toEqual([1, 1, 1]);
    expect(rigs.right.pivot.scale.toArray()).toEqual([1, 1, 1]);
  });
});
