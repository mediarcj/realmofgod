/**
 * File: apps/sanctuary/src/rendering/d9AffordanceAnchors.test.ts
 * Description: Tests the small D9 object-anchor selection contract.
 * Purpose: Prevents the visitor path from returning to guessed screen-space boxes or a center-floor action region.
 * Notes: Raw authored-GLB Box3 verification runs separately under the Node-only local asset check.
 */

// Import only browser-safe pure helpers so this test shares the application type surface.
import { Vector3 } from "three";
import { describe, expect, it } from "vitest";

import {
  d9AffordanceSemanticRoots,
  selectD9AffordanceAnchors,
  selectD9AffordanceBox,
  selectD9CueIntensity,
  selectD9CuePosition,
  selectD9ReadingPageAnchors,
} from "./d9AffordanceAnchors";

describe("D9 authored environmental affordance anchors", () => {
  it("keeps the Bible proxy attached to HF01_Bible_Root", () => {
    const [anchor] = selectD9AffordanceAnchors("SIT");

    expect(anchor?.semanticRoot).toBe("HF01_Bible_Root");
    if (anchor === undefined) {
      throw new Error("Expected the SIT state to expose the authored Bible anchor.");
    }
    expect(selectD9AffordanceBox(anchor).getSize(new Vector3()).length()).toBeGreaterThan(0);
  });

  it("keeps the sanctuary invitation attached to the tabletop rather than legs or floor", () => {
    const [anchor] = selectD9AffordanceAnchors("SANCTUARY");

    expect(anchor?.semanticRoot).toBe("HF01_PrayerTable__Table_Top");
    expect(anchor?.min[1]).toBeGreaterThan(1.29);
  });

  it("keeps READ and PRAY free of an environmental hotspot", () => {
    expect(selectD9AffordanceAnchors("READ")).toEqual([]);
    expect(selectD9AffordanceAnchors("PRAY")).toEqual([]);
  });

  it("keeps the exact authored page roots available for DOM-first READ projection", () => {
    expect(d9AffordanceSemanticRoots.bible).toEqual([
      "HF01_Bible_Root",
      "Bible_LeftOpenPage",
      "Bible_RightOpenPage",
    ]);
    expect(selectD9ReadingPageAnchors().map((anchor) => anchor.semanticRoot)).toEqual([
      "Bible_LeftOpenPage",
      "Bible_RightOpenPage",
    ]);
  });

  it("keeps every environmental and reading-page measured box non-empty", () => {
    for (const state of ["SANCTUARY", "SIT"] as const) {
      for (const anchor of selectD9AffordanceAnchors(state)) {
        expect(selectD9AffordanceBox(anchor).getSize(new Vector3()).length()).toBeGreaterThan(0);
      }
    }
    expect(selectD9ReadingPageAnchors()).toHaveLength(2);
  });

  it("keeps table and Bible invitation light above the measured object with a restrained hover increase", () => {
    for (const state of ["SANCTUARY", "SIT"] as const) {
      const [anchor] = selectD9AffordanceAnchors(state);
      if (anchor === undefined) {
        throw new Error(`Expected ${state} to have one invitation anchor.`);
      }
      expect(selectD9CuePosition(anchor)[1]).toBeGreaterThan(anchor.max[1]);
      expect(selectD9CueIntensity(anchor, true, false)).toBeGreaterThan(
        selectD9CueIntensity(anchor, false, false),
      );
      expect(selectD9CueIntensity(anchor, true, true)).toBe(
        selectD9CueIntensity(anchor, false, true),
      );
    }
  });
});
