// File: apps/sanctuary/scripts/camera.test.mjs
// Description: Tests bounded camera poses and transition timing.
// Purpose: Catches non-finite framing and easing regressions without WebGL.
// Notes: Uses representative anchor coordinates; source reconciliation is tested separately.

import { test } from "node:test";
import assert from "node:assert/strict";
import { PerspectiveCamera, Vector3 } from "three";
import { cameraDuration, cameraPose, cameraRollCorrectionDegrees, transitionEase } from "../lib/sanctuary/camera.ts";

function screenY(position, target, up, fov, point) {
  const camera = new PerspectiveCamera(fov, 16 / 9, .05, 60);
  camera.position.set(...position);
  camera.up.set(...up);
  camera.lookAt(new Vector3(...target));
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  return new Vector3(...point).project(camera).y;
}
test("guided views stay finite on phone, tablet and desktop", () => {
  for (const aspect of [.45, .75, 1, 1.78, 2.4]) for (const view of ["entry", "kneel", "bible", "prayer"]) {
    const pose = cameraPose(view, aspect);
    assert([...pose.position, ...pose.target, ...pose.up, pose.fov, ...pose.offset].every(Number.isFinite));
    assert(pose.fov >= 20 && pose.fov <= 100);
  }
});
test("owner entry camera lock is exact", () => {
  const pose = cameraPose("entry", 1.78);
  assert.deepEqual(pose.position, [-0.11269881499354367, 3.3045042935398734, 9.063174840923534]);
  assert.deepEqual(pose.target, [0.05896333736516662, 2.1607696616746113, -3.3778820839605586]);
  assert(Math.abs(cameraRollCorrectionDegrees(pose.position, pose.target) - .072) < .002);
  assert.equal(pose.fov, 43.1);
  assert.equal(pose.near, 0.05);
  assert.equal(pose.far, 60);
});
test("owner devotional camera lock is exact", () => {
  const pose = cameraPose("kneel", 1.78);
  assert.deepEqual(pose.position, [-0.09284529296935504, 3.0203792982467257, 3.1079608535465595]);
  assert.deepEqual(pose.target, [-0.05345574122261582, 2.91259250941797, -3.1695882549225813]);
  assert.equal(pose.fov, 49.2);
  assert.equal(pose.near, 0.05);
  assert.equal(pose.far, 60);
  assert(pose.position[2] < cameraPose("entry", 1.78).position[2]);
});
test("owner Bible camera lock is exact", () => {
  const pose = cameraPose("bible", 1.78);
  assert.deepEqual(pose.position, [0.00037665110056488724, 3.991898100773323, -0.3558153850886138]);
  assert.deepEqual(pose.target, [0.0005360429555142286, 1.0832682689439963, -0.41188717984421014]);
  assert.equal(pose.fov, 49.2);
  assert.equal(pose.near, 0.05);
  assert.equal(pose.far, 60);
});
test("owner prayer camera lock is exact", () => {
  const pose = cameraPose("prayer", 1.78);
  assert.deepEqual(pose.position, [0.007128735040103533, 2.1547926392109815, 1.4569803586793368]);
  assert.deepEqual(pose.target, [0.005757616056300196, 4.068051109055716, -0.12509942565052734]);
  assert.equal(pose.fov, 49.2);
  assert.equal(pose.near, 0.05);
  assert.equal(pose.far, 60);
});
test("transition easing is bounded and monotonic", () => {
  assert.equal(transitionEase(-1), 0);
  assert.equal(transitionEase(2), 1);
  let previous = 0;
  for (let step = 0; step <= 100; step++) { const next = transitionEase(step/100); assert(next >= previous); previous = next; }
});
test("reduced motion settles camera changes immediately", () => {
  assert.equal(cameraDuration(true), 0);
  assert.equal(cameraDuration(false), 1.6);
});
test("locked views keep a world-X line level in final screen space", () => {
  for (const view of ["entry", "kneel", "bible", "prayer"]) {
    const pose = cameraPose(view, 16 / 9);
    const left = [pose.target[0] - 1, pose.target[1], pose.target[2]];
    const right = [pose.target[0] + 1, pose.target[1], pose.target[2]];
    const correctedError = Math.abs(screenY(pose.position, pose.target, pose.up, pose.fov, left) - screenY(pose.position, pose.target, pose.up, pose.fov, right));
    assert(correctedError < 1e-12, `${view} screen-space horizontal error: ${correctedError}`);
  }
});
