// File: apps/sanctuary/scripts/camera.test.mjs
// Description: Tests bounded camera poses and transition timing.
// Purpose: Catches non-finite framing and easing regressions without WebGL.
// Notes: Uses representative anchor coordinates; source reconciliation is tested separately.

import { test } from "node:test";
import assert from "node:assert/strict";
import { cameraPose, transitionEase } from "../lib/sanctuary/camera.ts";
test("guided views stay finite on phone, tablet and desktop", () => {
  for (const aspect of [.45, .75, 1, 1.78, 2.4]) for (const view of ["entry", "kneel", "bible", "prayer"]) {
    const pose = cameraPose(view, aspect, [0,1.75,4], [0,2,-.44], [0,.32,1.59], [0,3.15,-3.88]);
    assert([...pose.position, ...pose.target, pose.fov, ...pose.offset].every(Number.isFinite));
    assert(pose.fov >= 40 && pose.fov <= 90);
    assert(pose.position[1] > .5 && pose.position[2] <= 4.8);
  }
});
test("transition easing is bounded and monotonic", () => {
  assert.equal(transitionEase(-1), 0);
  assert.equal(transitionEase(2), 1);
  let previous = 0;
  for (let step = 0; step <= 100; step++) { const next = transitionEase(step/100); assert(next >= previous); previous = next; }
});
