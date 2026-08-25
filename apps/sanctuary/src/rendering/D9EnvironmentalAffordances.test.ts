/**
 * File: apps/sanctuary/src/rendering/D9EnvironmentalAffordances.test.ts
 * Description: Covers the small cue and action projections used by D9 environmental proxies.
 * Purpose: Keeps touch discovery static, pointer feedback modest, and Canvas activation aligned with the DOM model.
 * Notes: These tests use no renderer and do not exercise a real device pointer.
 */

// Import focused pure helpers and the state model that remains the interaction authority.
import { describe, expect, it } from "vitest";

import { selectSanctuaryAffordance } from "../sanctuary/model";
import { selectD9AffordanceAnchors, selectD9CueIntensity } from "./d9AffordanceAnchors";

// Check that an environmental activation always resolves through the exact current semantic action.
describe("D9 environmental action projection", () => {
  it("maps the tabletop and Bible proxies to their legal DOM-authoritative actions", () => {
    expect(selectSanctuaryAffordance({ name: "SANCTUARY" }).action).toBe("SIT");
    expect(selectSanctuaryAffordance({ name: "SIT" }).action).toBe("READ_BIBLE");
    expect(selectD9AffordanceAnchors("READ")).toEqual([]);
    expect(selectD9AffordanceAnchors("PRAY")).toEqual([]);
  });
});

// Check static touch discoverability independently from the optional desktop hover confirmation.
describe("D9 environmental cue projection", () => {
  it("keeps a visible resting cue when there is no hover, including reduced motion", () => {
    const [tabletop] = selectD9AffordanceAnchors("SANCTUARY");

    expect(selectD9CueIntensity(tabletop, false, false)).toBeGreaterThan(0);
    expect(selectD9CueIntensity(tabletop, false, true)).toBe(
      selectD9CueIntensity(tabletop, false, false),
    );
  });

  it("adds only a modest hover confirmation without making hover an activation requirement", () => {
    const [bible] = selectD9AffordanceAnchors("SIT");
    const restingCue = selectD9CueIntensity(bible, false, false);

    expect(selectD9CueIntensity(bible, true, false)).toBeGreaterThan(restingCue);
    expect(selectD9CueIntensity(bible, true, true)).toBe(restingCue);
  });
});
