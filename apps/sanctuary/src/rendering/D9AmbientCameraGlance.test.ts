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
  isD9PointerWithinViewport,
  normalizeD9AmbientPointer,
  selectD9AmbientCameraPolicy,
  selectD9AmbientMotionState,
} from "./d9AmbientCameraPolicy";

describe("D9 ambient camera policy", () => {
  it("keeps SANCTUARY and SIT below the owner safety envelope", () => {
    for (const state of ["SANCTUARY", "SIT"] as const) {
      const policy = selectD9AmbientCameraPolicy(state, false);
      expect(policy.enabled).toBe(true);
      expect(policy.maxYawRadians).toBeLessThanOrEqual((3.5 * Math.PI) / 180);
      expect(policy.maxPitchRadians).toBeLessThanOrEqual((1.75 * Math.PI) / 180);
      expect(policy.intentDelayMilliseconds).toBeGreaterThanOrEqual(120);
      expect(policy.intentDelayMilliseconds).toBeLessThanOrEqual(180);
      expect(policy.holdMilliseconds).toBeGreaterThanOrEqual(350);
      expect(policy.holdMilliseconds).toBeLessThanOrEqual(600);
    }
  });

  it("settles READ, PRAY, and reduced motion at the exact authored anchor", () => {
    expect(selectD9AmbientCameraPolicy("READ", false).enabled).toBe(false);
    expect(selectD9AmbientCameraPolicy("PRAY", false).enabled).toBe(false);
    expect(selectD9AmbientCameraPolicy("SANCTUARY", true).enabled).toBe(false);
  });

  it("keeps the diagnostic proof DEV envelope separate from normal visitor motion", () => {
    const normalPolicy = selectD9AmbientCameraPolicy("SANCTUARY", false);
    const diagnosticPolicy = selectD9AmbientCameraPolicy("SANCTUARY", true, true);

    expect(normalPolicy.maxYawRadians).toBeCloseTo((3 * Math.PI) / 180);
    expect(normalPolicy.maxPitchRadians).toBeCloseTo((1.5 * Math.PI) / 180);
    expect(diagnosticPolicy.maxYawRadians).toBeCloseTo((5 * Math.PI) / 180);
    expect(diagnosticPolicy.maxPitchRadians).toBeCloseTo((2.5 * Math.PI) / 180);
  });

  it("accepts window pointer input only inside the active sanctuary viewport", () => {
    const viewport = { bottom: 220, left: 10, right: 310, top: 20 };

    expect(isD9PointerWithinViewport(160, 120, viewport)).toBe(true);
    expect(isD9PointerWithinViewport(9, 120, viewport)).toBe(false);
    expect(isD9PointerWithinViewport(160, 221, viewport)).toBe(false);
  });

  it("clamps arbitrary pointer impulses instead of accumulating a free camera", () => {
    const policy = selectD9AmbientCameraPolicy("SANCTUARY", false);
    const [yaw, pitch] = clampD9AmbientOffset(20, -20, policy);

    expect(yaw).toBe(policy.maxYawRadians);
    expect(pitch).toBe(-policy.maxPitchRadians);
  });

  it("uses a stable Canvas-relative mouse position before the bounded policy applies it", () => {
    const policy = selectD9AmbientCameraPolicy("SANCTUARY", false);
    const coordinates = normalizeD9AmbientPointer(130, 70, {
      height: 200,
      left: 10,
      top: 20,
      width: 200,
    });
    const signal = applyD9AmbientPointerSignal(
      {
        clientX: 0,
        clientY: 0,
        normalizedX: 0.5,
        normalizedY: 0.5,
        pendingPitchRadians: 0,
        pendingYawRadians: 0,
        pointerEventCount: 0,
        pointerType: "none",
      },
      coordinates,
      "mouse",
      policy,
    );

    expect(signal.pointerEventCount).toBe(1);
    expect(signal.pointerType).toBe("mouse");
    expect(signal.clientX).toBe(130);
    expect(signal.clientY).toBe(70);
    expect(signal.normalizedX).toBe(0.6);
    expect(signal.normalizedY).toBe(0.25);
    expect(signal.pendingYawRadians).not.toBe(0);
    expect(signal.pendingPitchRadians).not.toBe(0);
  });

  it("waits briefly, holds briefly, and then directs an idle pointer back to the exact anchor", () => {
    const policy = selectD9AmbientCameraPolicy("SIT", false);

    expect(
      selectD9AmbientMotionState({
        intentStartedAt: 100,
        lastMovementAt: 100,
        now: 200,
        policy,
      }),
    ).toBe("intent-delay");
    expect(
      selectD9AmbientMotionState({
        intentStartedAt: 100,
        lastMovementAt: 100,
        now: 300,
        policy,
      }),
    ).toBe("holding");
    expect(
      selectD9AmbientMotionState({
        intentStartedAt: 100,
        lastMovementAt: 100,
        now: 100 + policy.holdMilliseconds + 1,
        policy,
      }),
    ).toBe("returning");
  });
});
