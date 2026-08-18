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
  selectSanctuaryHeroCamera,
} from "./visualCalibration";

// Guard the centered composition, two-candle transform surface, and warm practical-light baseline.
describe("defaultVisualCalibration", () => {
  it("keeps the reviewed centered room and warm-light parameters", () => {
    expect(defaultVisualCalibration.camera.position).toEqual([0, 1.86, 5.9]);
    expect(defaultVisualCalibration.camera.target).toEqual([0, 1.5, -0.2]);
    expect(defaultVisualCalibration.camera.fov).toBe(44);
    expect(defaultVisualCalibration.lighting.warmKey.intensity).toBe(20);
    expect(defaultVisualCalibration.lighting.exposure).toBe(1.26);
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

  it("moves back before applying a restrained portrait lens adjustment", () => {
    const baseCamera = defaultVisualCalibration.camera;
    expect(selectSanctuaryHeroCamera(baseCamera, 1.6, true)).toBe(baseCamera);

    const portrait = selectSanctuaryHeroCamera(baseCamera, 390 / 844, true);
    expect(portrait.position[2]).toBeCloseTo(6.45, 2);
    expect(portrait.fov).toBeCloseTo(57.92, 2);
    expect(portrait.fov).toBeLessThan(60);
    expect(selectSanctuaryHeroCamera(baseCamera, 390 / 844, false)).toBe(baseCamera);
  });
});
