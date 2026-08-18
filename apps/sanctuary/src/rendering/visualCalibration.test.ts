/**
 * File: apps/sanctuary/src/rendering/visualCalibration.test.ts
 * Description: Verifies the reviewed HF-01 calibration defaults and reset isolation.
 * Purpose: Keeps the reference-locked camera, lighting, and physical-prop contract explicit.
 * Notes: The test uses plain synthetic numbers and does not load a browser file or production asset.
 */

// Import the small calibration factory and test helpers without initializing the renderer.
import { describe, expect, it } from "vitest";

import {
  createDefaultVisualCalibration,
  defaultVisualCalibration,
  selectSanctuaryHeroFov,
} from "./visualCalibration";

// Guard the centered composition, two-candle transform surface, and warm practical-light baseline.
describe("defaultVisualCalibration", () => {
  it("keeps the reviewed centered room and warm-light parameters", () => {
    expect(defaultVisualCalibration.camera.position).toEqual([0, 1.72, 5.72]);
    expect(defaultVisualCalibration.camera.target).toEqual([0, 1.08, -0.42]);
    expect(defaultVisualCalibration.camera.fov).toBe(48);
    expect(defaultVisualCalibration.lighting.warmKey.intensity).toBe(42);
    expect(defaultVisualCalibration.lighting.exposure).toBe(1.02);
    expect(defaultVisualCalibration.candleLeft).toEqual(defaultVisualCalibration.candleRight);
  });

  it("returns isolated reset objects instead of sharing nested calibration arrays", () => {
    const first = createDefaultVisualCalibration();
    const second = createDefaultVisualCalibration();

    expect(first).toEqual(defaultVisualCalibration);
    expect(second).toEqual(defaultVisualCalibration);
    expect(first).not.toBe(second);
    expect(first.camera.position).not.toBe(second.camera.position);
  });

  it("widens only the portrait sanctuary lens and keeps it within the reviewed limit", () => {
    expect(selectSanctuaryHeroFov(48, 1.6, true)).toBe(48);
    expect(selectSanctuaryHeroFov(48, 390 / 844, true)).toBeCloseTo(77.78, 2);
    expect(selectSanctuaryHeroFov(48, 390 / 844, false)).toBe(48);
  });
});
