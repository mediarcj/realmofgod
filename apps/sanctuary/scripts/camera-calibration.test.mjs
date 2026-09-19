// File: apps/sanctuary/scripts/camera-calibration.test.mjs
// Description: Tests local camera-calibration data validation and slot mapping.
// Purpose: Prevents malformed local files from becoming usable calibration poses.
// Notes: Browser controls are verified separately in the local development interface.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  calibrationViewForSlot,
  emptyCalibrationFile,
  isCalibrationFile,
  sanctuaryViewForCalibration,
} from "../lib/sanctuary/camera-calibration.ts";

const pose = {
  position: [0, 1.68, 4.6], target: [0, 2.5, -3.88], up: [0, 1, 0],
  rotationRadians: [0, 0, 0], rotationDegrees: [0, 0, 0], quaternion: [0, 0, 0, 1],
  fov: 60, near: .05, far: 60, aspect: 1.78, viewport: [1920, 1080], cameraType: "PerspectiveCamera", viewOffset: null,
};

test("calibration slots map to their owner-facing views", () => {
  assert.deepEqual(calibrationViewForSlot, { angle1: "entry", angle2: "devotional", angle3: "bible", angle4: "prayer" });
  assert.equal(sanctuaryViewForCalibration("devotional"), "kneel");
});

test("local calibration files accept complete finite camera records", () => {
  const file = { ...emptyCalibrationFile(), updatedAt: "2026-09-18T00:00:00.000Z", slots: { angle1: { ...pose, slot: "angle1", view: "entry", capturedAt: "2026-09-18T00:00:00.000Z" } } };
  assert.equal(isCalibrationFile(file), true);
});

test("local calibration files reject incomplete or non-finite camera records", () => {
  const missingTarget = { ...emptyCalibrationFile(), slots: { angle1: { ...pose, slot: "angle1", view: "entry", capturedAt: "now", target: [0, 1] } } };
  const infiniteFov = { ...emptyCalibrationFile(), slots: { angle1: { ...pose, slot: "angle1", view: "entry", capturedAt: "now", fov: Infinity } } };
  assert.equal(isCalibrationFile(missingTarget), false);
  assert.equal(isCalibrationFile(infiniteFov), false);
});
