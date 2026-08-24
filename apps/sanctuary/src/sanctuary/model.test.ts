/**
 * File: apps/sanctuary/src/sanctuary/model.test.ts
 * Description: Tests the D9 sanctuary interaction sequence and its single-affordance discipline.
 * Purpose: Prevents old journey stages, free navigation, or illegal camera-state jumps from entering the MVP proof.
 * Notes: These tests use only synthetic in-memory state and do not construct a renderer or persist visitor behavior.
 */

// Import the pure state model so its legal behavior remains testable without WebGL or DOM concerns.
import { describe, expect, it } from "vitest";

import {
  initialSanctuaryMvpState,
  selectSanctuaryAffordance,
  transitionSanctuaryMvp,
  type SanctuaryMvpState,
} from "./model";

// Exercise the one approved loop in the same order a visitor can encounter it.
describe("D9 sanctuary interaction model", () => {
  it("moves only through SANCTUARY, SIT, READ, PRAY, and RETURN to SANCTUARY", () => {
    const sit = transitionSanctuaryMvp(initialSanctuaryMvpState, "SIT");
    const read = transitionSanctuaryMvp(sit, "READ_BIBLE");
    const pray = transitionSanctuaryMvp(read, "ENTER_PRAYER");
    const returned = transitionSanctuaryMvp(pray, "RETURN_TO_SANCTUARY");

    expect([initialSanctuaryMvpState, sit, read, pray, returned]).toEqual([
      { name: "SANCTUARY" },
      { name: "SIT" },
      { name: "READ" },
      { name: "PRAY" },
      { name: "SANCTUARY" },
    ]);
  });

  it("leaves every illegal transition unchanged instead of offering backward or free navigation", () => {
    const states: readonly SanctuaryMvpState[] = [
      { name: "SANCTUARY" },
      { name: "SIT" },
      { name: "READ" },
      { name: "PRAY" },
    ];

    expect(transitionSanctuaryMvp(states[0]!, "READ_BIBLE")).toBe(states[0]);
    expect(transitionSanctuaryMvp(states[1]!, "ENTER_PRAYER")).toBe(states[1]);
    expect(transitionSanctuaryMvp(states[2]!, "SIT")).toBe(states[2]);
    expect(transitionSanctuaryMvp(states[3]!, "READ_BIBLE")).toBe(states[3]);
  });

  it("exposes exactly one meaningful affordance and accessible label in each state", () => {
    expect(selectSanctuaryAffordance({ name: "SANCTUARY" })).toEqual({
      action: "SIT",
      anchor: "seating",
      label: "Sit in the sanctuary",
    });
    expect(selectSanctuaryAffordance({ name: "SIT" })).toEqual({
      action: "READ_BIBLE",
      anchor: "bible",
      label: "Read the open Bible",
    });
    expect(selectSanctuaryAffordance({ name: "READ" })).toEqual({
      action: "ENTER_PRAYER",
      anchor: "clerestory",
      label: "Enter prayer",
    });
    expect(selectSanctuaryAffordance({ name: "PRAY" })).toEqual({
      action: "RETURN_TO_SANCTUARY",
      anchor: "grounding",
      label: "Return to the sanctuary",
    });
  });
});
