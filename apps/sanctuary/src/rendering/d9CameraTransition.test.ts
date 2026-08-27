/**
 * File: apps/sanctuary/src/rendering/d9CameraTransition.test.ts
 * Description: Verifies D9.0C.1 camera routes without mounting a browser or WebGL renderer.
 * Purpose: Guards immutable D7.5 endpoints, bounded choreography, interruption rebasing, reduced-motion snaps, and demand-loop policy.
 * Notes: Browser tests separately prove the real Canvas and accessible DOM overlay; this suite keeps the route math deterministic.
 */

// Import the deterministic camera math and the immutable authored endpoint authority used for direct proof assertions.
import { describe, expect, it } from "vitest";

import { d75SanctuaryCameras, type D75SanctuaryCameraName } from "./d75SanctuaryCamera";
import {
  clampD9CameraTransitionProgress,
  createD9CameraEndpoint,
  d9CameraTransitionClearanceContracts,
  d9CameraTransitionDurationsMs,
  d9CameraTransitionPathBounds,
  easeD9CameraTransition,
  sampleD9CameraTransition,
  sampleD9SanctuaryToSitTransition,
  selectD9CameraTransitionPlan,
  shouldInvalidateD9CameraTransition,
  type D9CameraMovePlan,
} from "./d9CameraTransition";

// Use the required desktop aspect so position, orientation, and lens checks all share one ordinary visitor frame.
const desktopAspect = 1920 / 1080;

// Keep every owner-authorized move in a single table so endpoint, bounds, policy, and reduced-motion checks cannot drift apart.
const routes: readonly D9CameraMovePlan[] = [
  { from: "SANCTUARY", kind: "sanctuary-to-sit", target: "SIT" },
  { from: "SIT", kind: "sit-to-read", target: "READ" },
  { from: "READ", kind: "read-to-pray", target: "PRAY" },
  { from: "PRAY", kind: "pray-to-sanctuary", target: "SANCTUARY" },
  { from: "SIT", kind: "sit-home-to-sanctuary", target: "SANCTUARY" },
  { from: "READ", kind: "read-home-to-sanctuary", target: "SANCTUARY" },
];

// Compare exact Three.js vector components without introducing renderer-only helper state into the test suite.
function expectVector(
  vector: { readonly x: number; readonly y: number; readonly z: number },
  expected: readonly number[],
): void {
  expect([vector.x, vector.y, vector.z]).toEqual(expected);
}

// Keep every complete route byte-for-byte tied to its locked D7.5 start and destination transforms.
describe("D9.0C.1 immutable sanctuary endpoints", () => {
  it("starts and finishes every supported route on its exact authored endpoint", () => {
    for (const route of routes) {
      expectVector(
        sampleD9CameraTransition(route, 0, desktopAspect, "horizontal").position,
        d75SanctuaryCameras[route.from].position,
      );
      expectVector(
        sampleD9CameraTransition(route, 1, desktopAspect, "horizontal").position,
        d75SanctuaryCameras[route.target].position,
      );
    }
  });

  it("finishes each route with the exact authored quaternion, lens, and projection range", () => {
    for (const route of routes) {
      const expected = createD9CameraEndpoint(route.target, desktopAspect, "horizontal");
      const settled = sampleD9CameraTransition(route, 1, desktopAspect, "horizontal");

      expect(settled.quaternion.toArray()).toEqual(expected.quaternion.toArray());
      expect(settled.quaternion.length()).toBeCloseTo(1, 10);
      expect(settled.fovDegrees).toBe(expected.fovDegrees);
      expect(settled.near).toBe(d75SanctuaryCameras[route.target].clipStart);
      expect(settled.far).toBe(d75SanctuaryCameras[route.target].clipEnd);
    }
  });

  it("retains the approved SANCTUARY-to-SIT helper and duration", () => {
    const legacy = sampleD9SanctuaryToSitTransition(0.5, desktopAspect, "horizontal");
    const sanctuaryToSit = routes.find((route) => route.kind === "sanctuary-to-sit");
    if (sanctuaryToSit === undefined) {
      throw new Error("The approved SANCTUARY-to-SIT route must remain available.");
    }
    const general = sampleD9CameraTransition(sanctuaryToSit, 0.5, desktopAspect, "horizontal");

    expect(legacy.position.toArray()).toEqual(general.position.toArray());
    expect(d9CameraTransitionDurationsMs["sanctuary-to-sit"]).toBe(2700);
  });
});

// Exercise each cubic route densely enough to detect future easing overshoot, unsafe envelope edits, or non-normalized orientations.
describe("D9.0C.1 bounded camera choreography", () => {
  it("clamps progress and keeps its calm easing within zero and one", () => {
    expect(clampD9CameraTransitionProgress(-0.2)).toBe(0);
    expect(clampD9CameraTransitionProgress(1.2)).toBe(1);
    for (let progress = 0; progress <= 1; progress += 0.05) {
      const eased = easeD9CameraTransition(progress);
      expect(eased).toBeGreaterThanOrEqual(0);
      expect(eased).toBeLessThanOrEqual(1);
    }
  });

  it("keeps every sampled position within its reviewed route envelope", () => {
    for (const route of routes) {
      const bounds = d9CameraTransitionPathBounds[route.kind];
      for (let progress = 0; progress <= 1; progress += 0.025) {
        const position = sampleD9CameraTransition(
          route,
          progress,
          desktopAspect,
          "horizontal",
        ).position;
        expect(position.x).toBeGreaterThanOrEqual(bounds.minimum[0]);
        expect(position.y).toBeGreaterThanOrEqual(bounds.minimum[1]);
        expect(position.z).toBeGreaterThanOrEqual(bounds.minimum[2]);
        expect(position.x).toBeLessThanOrEqual(bounds.maximum[0]);
        expect(position.y).toBeLessThanOrEqual(bounds.maximum[1]);
        expect(position.z).toBeLessThanOrEqual(bounds.maximum[2]);
      }
    }
  });

  it("keeps table-crossing portions above the reviewed tabletop clearance before entering the open rear approach", () => {
    const tableSensitiveRoutes = routes.filter((route) =>
      ["sit-to-read", "read-to-pray", "read-home-to-sanctuary"].includes(route.kind),
    );
    for (const route of tableSensitiveRoutes) {
      for (let progress = 0; progress <= 1; progress += 0.025) {
        const position = sampleD9CameraTransition(
          route,
          progress,
          desktopAspect,
          "horizontal",
        ).position;
        if (position.z <= d9CameraTransitionClearanceContracts.openRearBeginsAtZ) {
          expect(position.y).toBeGreaterThanOrEqual(
            d9CameraTransitionClearanceContracts.aboveTableY,
          );
        }
      }
    }
  });

  it("keeps every interpolated quaternion normalized and FOV values between exact route endpoints", () => {
    for (const route of routes) {
      const startFov = createD9CameraEndpoint(route.from, desktopAspect, "horizontal").fovDegrees;
      const endFov = createD9CameraEndpoint(route.target, desktopAspect, "horizontal").fovDegrees;
      for (let progress = 0.05; progress < 1; progress += 0.05) {
        const pose = sampleD9CameraTransition(route, progress, desktopAspect, "horizontal");
        expect(pose.quaternion.length()).toBeCloseTo(1, 10);
        expect(pose.fovDegrees).toBeGreaterThanOrEqual(Math.min(startFov, endFov));
        expect(pose.fovDegrees).toBeLessThanOrEqual(Math.max(startFov, endFov));
      }
    }
  });
});

// Keep the approved semantic edges explicit rather than allowing a future generic helper to animate every possible state jump.
describe("D9.0C.1 transition policy", () => {
  it("selects the supported full-motion routes, including quiet Home returns", () => {
    for (const route of routes) {
      expect(selectD9CameraTransitionPlan(route.from, route.target, false)).toEqual(route);
    }
  });

  it("uses the contextual PRAY-to-SANCTUARY route for both Return and Home without creating a duplicate route", () => {
    expect(selectD9CameraTransitionPlan("PRAY", "SANCTUARY", false)).toEqual({
      from: "PRAY",
      kind: "pray-to-sanctuary",
      target: "SANCTUARY",
    });
  });

  it("honors reduced motion with zero spatial travel and exact destination snaps for every route", () => {
    for (const route of routes) {
      const plan = selectD9CameraTransitionPlan(route.from, route.target, true);
      expect(plan).toEqual({ kind: "snap", target: route.target });
      if (plan.kind === "snap") {
        expectVector(
          createD9CameraEndpoint(plan.target, desktopAspect, "horizontal").position,
          d75SanctuaryCameras[route.target].position,
        );
      }
    }
  });

  it("treats restored SIT, READ, and PRAY states as settled endpoints with no inferred inbound route", () => {
    const restoredStates: readonly D75SanctuaryCameraName[] = ["SIT", "READ", "PRAY"];
    for (const state of restoredStates) {
      expect(selectD9CameraTransitionPlan(null, state, false)).toEqual({
        kind: "snap",
        target: state,
      });
    }
  });

  it("rebases a legal interruption from its rendered pose without inventing another active writer", () => {
    const sanctuaryToSit = routes.find((route) => route.kind === "sanctuary-to-sit");
    if (sanctuaryToSit === undefined) {
      throw new Error("The approved SANCTUARY-to-SIT route must remain available.");
    }
    const activePose = sampleD9CameraTransition(sanctuaryToSit, 0.45, desktopAspect, "horizontal");
    const homePlan = selectD9CameraTransitionPlan("SIT", "SANCTUARY", false);
    expect(homePlan.kind).toBe("sit-home-to-sanctuary");
    if (homePlan.kind === "snap") {
      throw new Error("The approved SIT Home route must remain animated under full motion.");
    }
    const rebasedStart = sampleD9CameraTransition(
      homePlan,
      0,
      desktopAspect,
      "horizontal",
      activePose,
    );
    const rebasedEnd = sampleD9CameraTransition(
      homePlan,
      1,
      desktopAspect,
      "horizontal",
      activePose,
    );

    expect(rebasedStart.position.toArray()).toEqual(activePose.position.toArray());
    expect(rebasedStart.quaternion.toArray()).toEqual(activePose.quaternion.toArray());
    expectVector(rebasedEnd.position, d75SanctuaryCameras.SANCTUARY.position);
  });

  it("requests demand-rendered frames only until a route has settled", () => {
    expect(shouldInvalidateD9CameraTransition(0)).toBe(true);
    expect(shouldInvalidateD9CameraTransition(0.999)).toBe(true);
    expect(shouldInvalidateD9CameraTransition(1)).toBe(false);
    expect(shouldInvalidateD9CameraTransition(2)).toBe(false);
  });
});
