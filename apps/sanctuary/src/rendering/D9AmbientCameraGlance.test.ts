/**
 * File: apps/sanctuary/src/rendering/D9AmbientCameraGlance.test.ts
 * Description: Covers the pure bounds and state policy behind the D9 local ambient camera glance.
 * Purpose: Prevents a future visual change from becoming free roam, reading motion, or a reduced-motion violation.
 * Notes: Browser pointer timing and real WebGL rendering are verified separately.
 */

// Import only the pure policy helpers so this safety test needs no Canvas or browser pointer event.
import { describe, expect, it } from "vitest";

import {
  applyD9AmbientPointerSignal,
  clampD9AmbientOffset,
  selectD9AmbientCameraPolicy,
} from "./d9AmbientCameraPolicy";

describe("D9 ambient camera policy", () => {
  it("keeps SANCTUARY and SIT below the owner safety envelope", () => {
    for (const state of ["SANCTUARY", "SIT"] as const) {
      const policy = selectD9AmbientCameraPolicy(state, false);
      expect(policy.enabled).toBe(true);
      expect(policy.maxYawRadians).toBeLessThanOrEqual(Math.PI / 60);
      expect(policy.maxPitchRadians).toBeLessThanOrEqual(Math.PI / 120);
      expect(policy.intentDelayMilliseconds).toBeGreaterThanOrEqual(120);
      expect(policy.intentDelayMilliseconds).toBeLessThanOrEqual(220);
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

  it("records a normal mouse signal before the bounded policy applies it", () => {
    const signal = applyD9AmbientPointerSignal(
      { pendingPitchRadians: 0, pendingYawRadians: 0, pointerEventCount: 0, pointerType: "none" },
      24,
      -12,
      "mouse",
    );

    expect(signal.pointerEventCount).toBe(1);
    expect(signal.pointerType).toBe("mouse");
    expect(signal.pendingYawRadians).not.toBe(0);
    expect(signal.pendingPitchRadians).not.toBe(0);
  });
});
