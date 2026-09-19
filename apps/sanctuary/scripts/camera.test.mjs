// File: apps/sanctuary/scripts/camera.test.mjs
// Description: Tests bounded camera poses and transition timing.
// Purpose: Catches non-finite framing and easing regressions without WebGL.
// Notes: Uses representative anchor coordinates; source reconciliation is tested separately.

import { test } from "node:test";
import assert from "node:assert/strict";
import { cameraDuration, cameraPose, transitionEase } from "../lib/sanctuary/camera.ts";
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
  assert.deepEqual(pose.up, [0, 1, 0]);
  assert.equal(pose.fov, 43.1);
});
test("owner devotional camera lock is exact", () => {
  const pose = cameraPose("kneel", 1.78);
  assert.deepEqual(pose.position, [-0.09284529296935504, 3.0203792982467257, 3.1079608535465595]);
  assert.deepEqual(pose.target, [-0.05345574122261582, 2.91259250941797, -3.1695882549225813]);
  assert.deepEqual(pose.up, [0, 1, 0]);
  assert.equal(pose.fov, 49.2);
  assert(pose.position[2] < cameraPose("entry", 1.78).position[2]);
});
test("owner Bible camera lock is exact", () => {
  const pose = cameraPose("bible", 1.78);
  assert.deepEqual(pose.position, [0.00037665110056488724, 3.991898100773323, -0.3558153850886138]);
  assert.deepEqual(pose.target, [0.0005360429555142286, 1.0832682689439963, -0.41188717984421014]);
  assert.deepEqual(pose.up, [0, 1, 0]);
  assert.equal(pose.fov, 49.2);
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
