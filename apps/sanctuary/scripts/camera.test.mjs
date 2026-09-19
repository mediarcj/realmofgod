// File: apps/sanctuary/scripts/camera.test.mjs
// Description: Tests bounded camera poses and transition timing.
// Purpose: Catches non-finite framing and easing regressions without WebGL.
// Notes: Uses representative anchor coordinates; source reconciliation is tested separately.

import { test } from "node:test";
import assert from "node:assert/strict";
import { PerspectiveCamera, Vector3 } from "three";
import { cameraDuration, cameraPose, transitionEase } from "../lib/sanctuary/camera.ts";
import { boundsCorners, sanctuaryCameraGeometry } from "../lib/sanctuary/camera-geometry.ts";
test("guided views stay finite on phone, tablet and desktop", () => {
  for (const aspect of [.45, .75, 1, 1.78, 2.4]) for (const view of ["entry", "kneel", "bible", "prayer"]) {
    const pose = cameraPose(view, aspect);
    assert([...pose.position, ...pose.target, ...pose.up, pose.fov, ...pose.offset].every(Number.isFinite));
    assert(pose.fov >= 30 && pose.fov <= 90);
    assert(pose.position[1] > sanctuaryCameraGeometry.floorY && pose.position[2] <= sanctuaryCameraGeometry.interior.max[2]);
  }
});
test("entry pose uses adult height from the finished floor", () => {
  const expected = sanctuaryCameraGeometry.floorY + 1.68;
  assert.equal(cameraPose("entry", 1.78).position[1], expected);
  assert(cameraPose("kneel", 1.78).position[2] < cameraPose("entry", 1.78).position[2]);
});
test("owner entry calibration stays centered and inside the sanctuary", () => {
  const pose = cameraPose("entry", 1.78);
  assert.deepEqual(pose.position, [0, sanctuaryCameraGeometry.floorY + 1.68, 4.6]);
  assert.deepEqual(pose.target, [0, 2.5, -3.88]);
  assert.equal(pose.fov, 90);
  assert(pose.position[2] < sanctuaryCameraGeometry.floor.max[2]);
});
test("owner devotional calibration frames the altar over the tabletop", () => {
  const pose = cameraPose("kneel", 1.78);
  assert.deepEqual(pose.position, [0, 2.4, 3.5]);
  assert.deepEqual(pose.target, [0, 3.4, -3.88]);
  assert.equal(pose.fov, 36);
  assert(pose.position[2] < cameraPose("entry", 1.78).position[2]);
});
test("Bible fitting keeps every source-bound corner in frame at useful coverage", () => {
  for (const aspect of [.45, .75, 1.78]) {
    const pose = cameraPose("bible", aspect);
    const camera = new PerspectiveCamera(pose.fov, aspect, .05, 60);
    camera.position.set(...pose.position); camera.up.set(...pose.up); camera.lookAt(new Vector3(...pose.target)); camera.updateMatrixWorld();
    const projected = boundsCorners(sanctuaryCameraGeometry.bible).map((corner) => new Vector3(...corner).project(camera));
    const xs = projected.map((point) => point.x), ys = projected.map((point) => point.y);
    assert(Math.min(...xs) > -1 && Math.max(...xs) < 1 && Math.min(...ys) > -1 && Math.max(...ys) < 1);
    const width = (Math.max(...xs) - Math.min(...xs)) / 2;
    const height = (Math.max(...ys) - Math.min(...ys)) / 2;
    assert(Math.max(width, height) >= .75 && Math.max(width, height) <= .85);
    assert(Math.abs((Math.max(...xs) + Math.min(...xs)) / 2) < .05);
    assert(Math.abs((Math.max(...ys) + Math.min(...ys)) / 2) < .05);
  }
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
