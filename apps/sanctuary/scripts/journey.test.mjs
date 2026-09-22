// File: apps/sanctuary/scripts/journey.test.mjs
// Description: Tests the exact owner-directed object interaction contract.
// Purpose: Keeps architecture inert and prevents skipped or duplicate journey transitions.
// Notes: Pointer and keyboard interactions share this state machine.

import { test } from "node:test";
import assert from "node:assert/strict";
import { cameraPose } from "../lib/sanctuary/camera.ts";
import { devotionalObjects, eligibleObjects, initialJourney, journeyHotspots, journeyTransition, journeyViewForHotspot } from "../lib/sanctuary/journey.ts";
test("each devotional object approaches the same kneeling state", () => {
  for (const object of Object.values(devotionalObjects)) assert.deepEqual(journeyTransition(initialJourney, {type: "activate", object}), {view:"kneel", revision:1, moving:true});
});
test("only the Bible is eligible once kneeling", () => {
  assert.deepEqual(eligibleObjects("kneel"), [devotionalObjects.bible]);
  const kneel = {view:"kneel", revision:1, moving:false};
  for (const object of [devotionalObjects.table, devotionalObjects["kneeling-rest"], "ROG_V2_Floor_Planks_AUTH", "ALTAR_ACC_HYPER3D_CROSS_CENTER_MASTER"]) assert.equal(journeyTransition(kneel, {type:"activate",object}), kneel);
  assert.equal(journeyTransition(kneel, {type:"activate",object:devotionalObjects.bible}).view,"bible");
});
test("motion, reading and prayer disable object navigation", () => {
  for (const view of ["bible", "prayer"]) assert.deepEqual(eligibleObjects(view), []);
  const moving = {view:"kneel", revision:2, moving:true};
  assert.equal(journeyTransition(moving,{type:"activate",object:devotionalObjects.bible}),moving);
});
test("home interrupts any state and stale completion is ignored", () => {
  for (const view of ["entry","kneel","bible","prayer"]) {
    const home = journeyTransition({view, revision:4, moving:true}, {type:"home"});
    assert.deepEqual(home,{view:"entry",revision:5,moving:true});
    assert.equal(journeyTransition(home,{type:"settled",revision:4}),home);
    assert.equal(journeyTransition(home,{type:"settled",revision:5}).moving,false);
  }
});
test("home is quiet when already at the sanctuary entrance", () => {
  assert.equal(journeyTransition(initialJourney, { type: "home" }), initialJourney);
});
test("stable semantic hotspots reach every owner-locked camera destination", () => {
  for (const [hotspot, expectedView] of Object.entries(journeyViewForHotspot)) {
    const source = expectedView === "entry" ? { view: "bible", revision: 0, moving: false } : initialJourney;
    const moved = journeyTransition(source, { type: "navigate", hotspot });
    assert.equal(moved.view, expectedView, hotspot);
    assert.equal(moved.moving, true, hotspot);
    const expected = cameraPose(expectedView, 16 / 9);
    const actual = cameraPose(moved.view, 16 / 9);
    assert.deepEqual(actual.position, expected.position, hotspot);
    assert.deepEqual(actual.target, expected.target, hotspot);
    assert.equal(actual.fov, expected.fov, hotspot);
    assert.equal(journeyHotspots[hotspot], `sanctuary-hotspot-${hotspot}`);
  }
});
