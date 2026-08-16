/**
 * File: apps/sanctuary/src/journey/model.test.ts
 * Description: Covers the deterministic memory-only transitions for the anonymous peace journey.
 * Purpose: Proves valid progression, equal branches, reconvergence, stillness, and reset behavior.
 * Notes: Tests use synthetic state only and do not access a browser, a visitor, or persistent storage.
 */

// Import Vitest and the complete pure journey contract under test.
import { describe, expect, it } from "vitest";

import { choiceReflections, peaceScripture } from "./content";
import {
  deriveJourneyVisualState,
  initialJourneyState,
  transitionJourney,
  type JourneyState,
} from "./model";

// Move a synthetic visitor through the common states until the approved choice point.
function reachChoice(): JourneyState {
  const threshold = transitionJourney(initialJourneyState, { type: "begin-peace" });
  const movement = transitionJourney(threshold, { type: "continue" });
  return transitionJourney(movement, { type: "continue" });
}

// Cover entry and ordinary progression without relying on a visual renderer.
describe("peace journey progression", () => {
  it("starts only when the peace entry action is selected", () => {
    expect(transitionJourney(initialJourneyState, { type: "continue" })).toBe(initialJourneyState);
    expect(transitionJourney(initialJourneyState, { type: "begin-peace" })).toEqual({
      stage: "threshold",
    });
  });

  it("moves through threshold and movement before offering an equal choice", () => {
    expect(reachChoice()).toEqual({ stage: "choice" });
  });

  it.each(["walk", "sit", "listen"] as const)("lets %s reconverge at Scripture", (choice) => {
    const reflection = transitionJourney(reachChoice(), { type: "choose", choice });
    expect(reflection).toEqual({ stage: "reflection", choice });
    expect(transitionJourney(reflection, { type: "continue" })).toEqual({ stage: "scripture" });
  });

  it("reaches stillness, allows remaining, and reaches sanctuary only by continuing", () => {
    const scripture = transitionJourney(
      { stage: "reflection", choice: "walk" },
      { type: "continue" },
    );
    const stillness = transitionJourney(scripture, { type: "continue" });

    expect(stillness).toEqual({ stage: "stillness" });
    expect(transitionJourney(stillness, { type: "remain" })).toBe(stillness);
    expect(transitionJourney(stillness, { type: "continue" })).toEqual({ stage: "sanctuary" });
  });

  it("resets only when returning from sanctuary", () => {
    expect(transitionJourney({ stage: "sanctuary" }, { type: "return-to-realm" })).toBe(
      initialJourneyState,
    );
    expect(transitionJourney({ stage: "threshold" }, { type: "return-to-realm" })).toEqual({
      stage: "threshold",
    });
  });
});

// Prove the renderer receives only a read-only stage and the short branch choice where it is useful.
describe("peace journey visual projection", () => {
  it("derives sanctuary and nature stages without creating another journey state", () => {
    expect(deriveJourneyVisualState(initialJourneyState)).toEqual({
      stage: "entry",
      choice: null,
    });
    expect(deriveJourneyVisualState({ stage: "reflection", choice: "sit" })).toEqual({
      stage: "reflection",
      choice: "sit",
    });
    expect(deriveJourneyVisualState({ stage: "scripture" })).toEqual({
      stage: "scripture",
      choice: null,
    });
  });

  it("does not expose actions, scoring, identity, or history to the visual layer", () => {
    const projection = deriveJourneyVisualState({ stage: "reflection", choice: "listen" });

    expect(Object.keys(projection).sort()).toEqual(["choice", "stage"]);
  });
});

// Keep each option free from ranking data and keep Scripture data structurally separate from reflection content.
describe("peace journey content boundaries", () => {
  it("keeps every branch as ordinary reflection without score or rank fields", () => {
    for (const reflection of Object.values(choiceReflections)) {
      expect(reflection.kind).toBe("reflection");
      expect("score" in reflection).toBe(false);
      expect("rank" in reflection).toBe(false);
    }
  });

  it("keeps the reference-only Scripture slot free of unapproved translation wording", () => {
    expect(peaceScripture).toEqual({
      kind: "scripture",
      reference: "Psalm 46:10",
      translationId: null,
      approvedText: null,
      status: "translation-and-licensing-pending",
    });
  });
});
