// File: apps/sanctuary/scripts/camera-calibration-runtime.test.mjs
// Description: Tests exact local capture and restore of the owner camera pose.
// Purpose: Verifies save, deliberate movement, and reload reproduce one composition.
// Notes: This runs without WebGL and uses the same PerspectiveCamera implementation as R3F.

import { test } from "node:test";
import assert from "node:assert/strict";
import { PerspectiveCamera, Vector3 } from "three";
import { applyCameraCalibrationPose, captureCameraCalibrationPose } from "../lib/sanctuary/camera-calibration-runtime.ts";

test("saved camera pose restores after position, target and projection change", () => {
  const camera = new PerspectiveCamera(46, 16 / 9, .05, 60);
  camera.position.set(.012919, 4.427709, -.440667);
  camera.up.set(0, 0, -1);
  const target = new Vector3(.012919, 2.006365, -.440667);
  camera.lookAt(target); camera.setViewOffset(1920, 1080, 0, 0, 1920, 1080); camera.updateProjectionMatrix();
  const saved = captureCameraCalibrationPose(camera, target, [1920, 1080]);
  camera.position.set(9, 8, 7); camera.up.set(0, 1, 0); camera.fov = 75; camera.near = .5; camera.far = 10; camera.clearViewOffset(); camera.updateProjectionMatrix();
  const restoredTarget = applyCameraCalibrationPose(camera, saved);
  const restored = captureCameraCalibrationPose(camera, restoredTarget, [1920, 1080]);
  assert.deepEqual(restored.position, saved.position);
  assert.deepEqual(restored.target, saved.target);
  assert.deepEqual(restored.up, saved.up);
  assert.equal(restored.fov, saved.fov);
  assert.equal(restored.near, saved.near);
  assert.equal(restored.far, saved.far);
  assert.equal(restored.aspect, saved.aspect);
  assert.deepEqual(restored.viewOffset, saved.viewOffset);
});
