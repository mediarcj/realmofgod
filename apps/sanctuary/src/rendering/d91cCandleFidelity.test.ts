/**
 * File: apps/sanctuary/src/rendering/d91cCandleFidelity.test.ts
 * Description: Verifies the bounded local candle-fidelity constants and deterministic smoke schedule.
 * Purpose: Prevents a future visual tweak from adding random flame authority, continuous smoke, or motion under reduced-motion preference.
 * Notes: These tests are pure local checks; they do not create WebGL, browser storage, network traffic, or visitor data.
 */

// Import only the local presentation policy values and pure smoke sampler under test.
import { describe, expect, it } from "vitest";

import {
  d91cAuthoredWickNames,
  d91cMaximumSmokeSprites,
  d91cPerceptualGain,
  sampleD91CSmoke,
} from "./d91cCandleFidelity";

// Cover the declared presentation boundary before exercising individual sparse smoke windows.
describe("D9.1C candle-fidelity boundary", () => {
  it("keeps the inspected authored wick roots, two-candle budget, and unchanged map gain explicit", () => {
    expect(d91cAuthoredWickNames).toEqual({
      left: "HF01_CandleLeft__Candle_0_Wick",
      right: "HF01_CandleRight__Candle_1_Wick",
    });
    expect(d91cMaximumSmokeSprites).toBe(4);
    expect(d91cPerceptualGain).toBe(1.18);
  });
});

// Prove that smoke is a short deterministic decorative schedule, never a continuous effect or a reduced-motion animation.
describe("D9.1C bounded smoke", () => {
  it("activates only within its separate left and right windows", () => {
    expect(sampleD91CSmoke("left", 0, 0.69, false).active).toBe(true);
    expect(sampleD91CSmoke("left", 0, 1.7, false).active).toBe(false);
    expect(sampleD91CSmoke("right", 0, 2.13, false).active).toBe(true);
    expect(sampleD91CSmoke("right", 0, 0.69, false).active).toBe(false);
  });

  it("has no simultaneous smoke event at any sampled point in the approved seven-second loop", () => {
    for (let step = 0; step < 700; step += 1) {
      const seconds = step / 100;
      const activeCount = ["left", "right"]
        .flatMap((side) =>
          [0, 1].map((eventIndex) =>
            sampleD91CSmoke(side as "left" | "right", eventIndex, seconds, false).active ? 1 : 0,
          ),
        )
        .reduce<number>((sum, active) => sum + active, 0);
      expect(activeCount).toBeLessThanOrEqual(1);
    }
  });

  it("removes all smoke motion and opacity when reduced motion is active", () => {
    expect(sampleD91CSmoke("left", 0, 0.9, true)).toEqual({
      active: false,
      opacity: 0,
      scale: 0.05,
      x: 0,
      y: 0,
      z: 0,
    });
  });
});
