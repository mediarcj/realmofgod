/**
 * File: apps/sanctuary/src/rendering/d9CameraTransition.test.ts
 * Description: Verifies the narrow D9.0C.0 camera math without mounting a browser or WebGL renderer.
 * Purpose: Guards the immutable D7.5 endpoints, bounded motion path, reduced-motion snap, and demand-loop policy.
 * Notes: These tests cover only SANCTUARY-to-SIT; they intentionally leave all other guided state changes as snaps.
 */

// Import the local deterministic camera math and the immutable endpoint authority needed for direct proof assertions.
import { describe, expect, it } from "vitest";

import { d75SanctuaryCameras } from "./d75SanctuaryCamera";
import {
  clampD9CameraTransitionProgress,
  createD9CameraEndpoint,
  d9SanctuaryToSitPathBounds,
  easeD9CameraTransition,
  sampleD9SanctuaryToSitTransition,
  selectD9CameraTransitionPlan,
  shouldInvalidateD9CameraTransition,
} from "./d9CameraTransition";

// Use the required desktop aspect so position, orientation, and lens checks all share one ordinary visitor frame.
const desktopAspect = 1920 / 1080;

// Compare exact Three.js vector components without introducing renderer-only helper state into the test suite.
function expectVector(
  vector: { readonly x: number; readonly y: number; readonly z: number },
  expected: readonly number[],
): void {
  expect([vector.x, vector.y, vector.z]).toEqual(expected);
}

// Keep the first transition's endpoints byte-for-byte tied to their accepted D7.5 transform data.
describe("D9.0C.0 immutable sanctuary endpoints", () => {
  it("starts at the exact SANCTUARY position and finishes at the exact SIT position", () => {
    expectVector(
      sampleD9SanctuaryToSitTransition(0, desktopAspect, "horizontal").position,
      d75SanctuaryCameras.SANCTUARY.position,
    );
    expectVector(
      sampleD9SanctuaryToSitTransition(1, desktopAspect, "horizontal").position,
      d75SanctuaryCameras.SIT.position,
    );
  });

  it("finishes with the exact authored SIT orientation and horizontal-framing lens", () => {
    const expected = createD9CameraEndpoint("SIT", desktopAspect, "horizontal");
    const settled = sampleD9SanctuaryToSitTransition(1, desktopAspect, "horizontal");

    expect(settled.quaternion.toArray()).toEqual(expected.quaternion.toArray());
    expect(settled.fovDegrees).toBe(expected.fovDegrees);
    expect(settled.near).toBe(d75SanctuaryCameras.SIT.clipStart);
    expect(settled.far).toBe(d75SanctuaryCameras.SIT.clipEnd);
  });
});

// Exercise the cubic presentation math densely enough to detect a future overshoot or accidental non-normalized quaternion.
describe("D9.0C.0 bounded SANCTUARY-to-SIT motion", () => {
  it("clamps progress and keeps its calm easing within zero and one", () => {
    expect(clampD9CameraTransitionProgress(-0.2)).toBe(0);
    expect(clampD9CameraTransitionProgress(1.2)).toBe(1);
    for (let progress = 0; progress <= 1; progress += 0.05) {
      const eased = easeD9CameraTransition(progress);
      expect(eased).toBeGreaterThanOrEqual(0);
      expect(eased).toBeLessThanOrEqual(1);
    }
  });

  it("keeps every sampled location inside the approved central-aisle bounds", () => {
    for (let progress = 0; progress <= 1; progress += 0.025) {
      const position = sampleD9SanctuaryToSitTransition(
        progress,
        desktopAspect,
        "horizontal",
      ).position;
      expect(position.x).toBeGreaterThanOrEqual(d9SanctuaryToSitPathBounds.minimum[0]);
      expect(position.y).toBeGreaterThanOrEqual(d9SanctuaryToSitPathBounds.minimum[1]);
      expect(position.z).toBeGreaterThanOrEqual(d9SanctuaryToSitPathBounds.minimum[2]);
      expect(position.x).toBeLessThanOrEqual(d9SanctuaryToSitPathBounds.maximum[0]);
      expect(position.y).toBeLessThanOrEqual(d9SanctuaryToSitPathBounds.maximum[1]);
      expect(position.z).toBeLessThanOrEqual(d9SanctuaryToSitPathBounds.maximum[2]);
    }
  });

  it("keeps every interpolated quaternion normalized and lens values between exact endpoints", () => {
    const sanctuaryFov = createD9CameraEndpoint(
      "SANCTUARY",
      desktopAspect,
      "horizontal",
    ).fovDegrees;
    const sitFov = createD9CameraEndpoint("SIT", desktopAspect, "horizontal").fovDegrees;

    for (let progress = 0.05; progress < 1; progress += 0.05) {
      const pose = sampleD9SanctuaryToSitTransition(progress, desktopAspect, "horizontal");
      expect(pose.quaternion.length()).toBeCloseTo(1, 10);
      expect(pose.fovDegrees).toBeGreaterThanOrEqual(Math.min(sanctuaryFov, sitFov));
      expect(pose.fovDegrees).toBeLessThanOrEqual(Math.max(sanctuaryFov, sitFov));
    }
  });
});

// Keep the approved state-specific behavior explicit rather than allowing a future generic transition helper to animate every state.
describe("D9.0C.0 transition policy", () => {
  it("uses the calm move only for SANCTUARY-to-SIT and snaps every other guided transition", () => {
    expect(selectD9CameraTransitionPlan("SANCTUARY", "SIT", false).kind).toBe("sanctuary-to-sit");
    expect(selectD9CameraTransitionPlan("SIT", "READ", false)).toEqual({
      kind: "snap",
      target: "READ",
    });
    expect(selectD9CameraTransitionPlan("READ", "PRAY", false)).toEqual({
      kind: "snap",
      target: "PRAY",
    });
    expect(selectD9CameraTransitionPlan("PRAY", "SANCTUARY", false)).toEqual({
      kind: "snap",
      target: "SANCTUARY",
    });
  });

  it("honors reduced motion with an immediate SIT endpoint and requests frames only before settlement", () => {
    expect(selectD9CameraTransitionPlan("SANCTUARY", "SIT", true)).toEqual({
      kind: "snap",
      target: "SIT",
    });
    expect(shouldInvalidateD9CameraTransition(0)).toBe(true);
    expect(shouldInvalidateD9CameraTransition(0.999)).toBe(true);
    expect(shouldInvalidateD9CameraTransition(1)).toBe(false);
    expect(shouldInvalidateD9CameraTransition(2)).toBe(false);
  });
});
