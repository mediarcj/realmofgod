/**
 * File: apps/sanctuary/src/rendering/d75SanctuaryCamera.test.ts
 * Description: Verifies the local browser projection retains the locked D7.5 sanctuary camera data.
 * Purpose: Prevents the D9 visitor frame from silently drifting into an inferred or portrait-widened camera.
 * Notes: These checks validate coordinate conversion and projection math only; they do not mount WebGL.
 */

// Import the deterministic calibration adapter rather than a renderer so the locked values stay unit-testable.
import { describe, expect, it } from "vitest";

import {
  d75SanctuaryCamera,
  d75SanctuaryCameras,
  selectD75SanctuaryProjection,
} from "./d75SanctuaryCamera";

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

  it("selects only the four authored guided-state endpoints without interpolating a camera", () => {
    const aspect = 1920 / 1080;

    expect(selectD75SanctuaryProjection(aspect, "horizontal", "SANCTUARY").position).toEqual(
      d75SanctuaryCameras.SANCTUARY.position,
    );
    expect(selectD75SanctuaryProjection(aspect, "horizontal", "SIT").position).toEqual(
      d75SanctuaryCameras.SIT.position,
    );
    expect(selectD75SanctuaryProjection(aspect, "horizontal", "READ").position).toEqual(
      d75SanctuaryCameras.READ.position,
    );
    expect(selectD75SanctuaryProjection(aspect, "horizontal", "PRAY").position).toEqual(
      d75SanctuaryCameras.PRAY.position,
    );
  });

  it("keeps Blender's 27 mm horizontal lens constant across browser aspect ratios", () => {
    const approvedAspect = 3120 / 1328;
    const projection = selectD75SanctuaryProjection(approvedAspect);

    expect(projection.fovDegrees).toBeCloseTo(31.683714, 5);
    expect(selectD75SanctuaryProjection(844 / 390).fovDegrees).toBeGreaterThan(
      projection.fovDegrees,
    );
  });

  it("offers the reference vertical fit only as an explicit D9.0A.1 comparison policy", () => {
    const approvedAspect = 3120 / 1328;
    const referenceProjection = selectD75SanctuaryProjection(approvedAspect, "stable-vertical");
    const phoneLandscapeProjection = selectD75SanctuaryProjection(667 / 375, "stable-vertical");

    expect(referenceProjection.fovDegrees).toBeCloseTo(31.683714, 5);
    expect(phoneLandscapeProjection.fovDegrees).toBeCloseTo(referenceProjection.fovDegrees, 10);
    expect(selectD75SanctuaryProjection(667 / 375, "horizontal").fovDegrees).toBeGreaterThan(
      referenceProjection.fovDegrees,
    );
  });
});
