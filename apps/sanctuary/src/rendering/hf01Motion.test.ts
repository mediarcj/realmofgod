/**
 * File: apps/sanctuary/src/rendering/hf01Motion.test.ts
 * Description: Covers fresh arrival, interruption, reduced motion, departure, and return asset poses.
 * Purpose: Proves decorative clips follow the journey without becoming another journey state machine.
 * Notes: Tests use synthetic stage values and never load WebGL, the production GLB, or visitor data.
 */

// Import the focused test helpers and pure motion-plan selector.
import { describe, expect, it } from "vitest";

import { selectHf01MotionPlan } from "./hf01Motion";

// Keep the once-per-page arrival motion separate from stable return-to-sanctuary poses.
describe("HF-01 authored clip plan", () => {
  it("plays the door and Bible clips only for an ordinary fresh arrival", () => {
    expect(
      selectHf01MotionPlan({
        stage: "entry",
        reducedMotion: false,
        freshArrivalAvailable: true,
      }),
    ).toEqual({
      bible: "play-forward",
      door: "play-forward",
      consumesFreshArrival: true,
    });

    expect(
      selectHf01MotionPlan({
        stage: "entry",
        reducedMotion: false,
        freshArrivalAvailable: false,
      }),
    ).toEqual({ bible: "show-end", door: "show-end", consumesFreshArrival: false });
  });

  it("shows final poses immediately when reduced motion is requested", () => {
    expect(
      selectHf01MotionPlan({
        stage: "entry",
        reducedMotion: true,
        freshArrivalAvailable: true,
      }),
    ).toEqual({ bible: "show-end", door: "show-end", consumesFreshArrival: true });
  });

  it("resolves an early journey action to the physical departure pose", () => {
    expect(
      selectHf01MotionPlan({
        stage: "threshold",
        reducedMotion: false,
        freshArrivalAvailable: false,
      }),
    ).toEqual({ bible: "show-end", door: "play-reverse", consumesFreshArrival: false });

    expect(
      selectHf01MotionPlan({
        stage: "movement",
        reducedMotion: false,
        freshArrivalAvailable: false,
      }),
    ).toEqual({ bible: "show-end", door: "show-start", consumesFreshArrival: false });
  });
});
