/**
 * File: apps/sanctuary/src/rendering/d75SanctuaryCamera.test.ts
 * Description: Verifies the local browser projection retains the locked D7.5 sanctuary camera data.
 * Purpose: Prevents the D9 visitor frame from silently drifting into an inferred or portrait-widened camera.
 * Notes: These checks validate coordinate conversion and projection math only; they do not mount WebGL.
 */

// Import the deterministic calibration adapter rather than a renderer so the locked values stay unit-testable.
import { describe, expect, it } from "vitest";

import { d75SanctuaryCamera, selectD75SanctuaryProjection } from "./d75SanctuaryCamera";

// Keep the known D7.5 SANCTUARY position and camera axes exact after the documented glTF conversion.
describe("D7.5 SANCTUARY camera", () => {
  it("preserves the approved camera location and orientation", () => {
    expect(d75SanctuaryCamera.position).toEqual([
      0.0211249440908432, 5.040225028991699, 10.790785789489746,
    ]);
    expect(d75SanctuaryCamera.forward).toEqual([
      0.004210270941257477, -0.16493822634220123, -0.9862949252128601,
    ]);
    expect(d75SanctuaryCamera.up).toEqual([
      0.0007038679905235767, 0.9863039255142212, -0.16493673622608185,
    ]);
  });

  it("keeps Blender's 27 mm horizontal lens constant across browser aspect ratios", () => {
    const approvedAspect = 3120 / 1328;
    const projection = selectD75SanctuaryProjection(approvedAspect);

    expect(projection.fovDegrees).toBeCloseTo(31.683714, 5);
    expect(selectD75SanctuaryProjection(844 / 390).fovDegrees).toBeGreaterThan(
      projection.fovDegrees,
    );
  });
});
