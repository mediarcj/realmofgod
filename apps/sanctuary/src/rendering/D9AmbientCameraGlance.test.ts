/**
 * File: apps/sanctuary/src/rendering/D9AmbientCameraGlance.test.ts
 * Description: Covers the pure bounds and state policy behind the D9 local ambient camera glance.
 * Purpose: Prevents a future visual change from becoming free roam, reading motion, or a reduced-motion violation.
 * Notes: Browser pointer timing and real WebGL rendering are verified separately.
 */

// Import only the pure policy helpers so this safety test needs no Canvas or browser pointer event.
import { describe, expect, it } from "vitest";

import { clampD9AmbientOffset, selectD9AmbientCameraPolicy } from "./d9AmbientCameraPolicy";

describe("D9 ambient camera policy", () => {
  it("keeps SANCTUARY and SIT below the owner safety envelope", () => {
    for (const state of ["SANCTUARY", "SIT"] as const) {
      const policy = selectD9AmbientCameraPolicy(state, false);
      expect(policy.enabled).toBe(true);
      expect(policy.maxYawRadians).toBeLessThan(Math.PI / 90);
      expect(policy.maxPitchRadians).toBeLessThan(Math.PI / 180);
    }
  });

  it("settles READ, PRAY, and reduced motion at the exact authored anchor", () => {
    expect(selectD9AmbientCameraPolicy("READ", false).enabled).toBe(false);
    expect(selectD9AmbientCameraPolicy("PRAY", false).enabled).toBe(false);
    expect(selectD9AmbientCameraPolicy("SANCTUARY", true).enabled).toBe(false);
  });

  it("clamps arbitrary pointer impulses instead of accumulating a free camera", () => {
    const policy = selectD9AmbientCameraPolicy("SANCTUARY", false);
    const [yaw, pitch] = clampD9AmbientOffset(20, -20, policy);

    expect(yaw).toBe(policy.maxYawRadians);
    expect(pitch).toBe(-policy.maxPitchRadians);
  });
});
