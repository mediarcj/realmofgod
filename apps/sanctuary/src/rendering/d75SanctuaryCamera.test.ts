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

  it("preserves the exact converted D7.5 vectors for the three guided endpoints", () => {
    expect(d75SanctuaryCameras.SIT).toMatchObject({
      forward: [0.0007467248942703009, -0.2754653990268707, -0.9613106846809387],
      up: [0.00021314318291842937, 0.9613109827041626, -0.27546530961990356],
    });
    expect(d75SanctuaryCameras.READ).toMatchObject({
      forward: [0.008063985034823418, -0.9981837868690491, -0.05969979614019394],
      up: [0.13363796472549438, 0.06024195998907089, -0.9891975522041321],
    });
    expect(d75SanctuaryCameras.PRAY).toMatchObject({
      forward: [-0.0019341225270181894, 0.5195367336273193, -0.8544459342956543],
      up: [0.0011753428261727095, 0.854448139667511, 0.5195354223251343],
    });
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
