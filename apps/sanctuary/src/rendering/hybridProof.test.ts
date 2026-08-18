/**
 * File: apps/sanctuary/src/rendering/hybridProof.test.ts
 * Description: Covers the local visual-proof and cinematic-presentation decisions.
 * Purpose: Proves cinematic media stays limited to supplied states and never changes journey semantics.
 * Notes: Tests use only static in-memory facts and do not load media or browser storage.
 */

// Import Vitest helpers and the small pure decision functions under review.
import { describe, expect, it } from "vitest";

import {
  selectCinematicPresentation,
  selectVisualProofLayer,
  supportsCinematicStage,
} from "./hybridProof";

// Confirm that missing footage never becomes an invented cinematic journey extension.
describe("cinematic-stage support", () => {
  it("uses cinematic media only at entry and sanctuary return", () => {
    expect(supportsCinematicStage("entry")).toBe(true);
    expect(supportsCinematicStage("sanctuary")).toBe(true);
    expect(supportsCinematicStage("threshold")).toBe(false);
    expect(supportsCinematicStage("reflection")).toBe(false);
  });

  it("keeps unsupported stages on the real-time layer without changing the selected proof mode", () => {
    expect(selectVisualProofLayer("cinematic", "entry")).toBe("cinematic");
    expect(selectVisualProofLayer("cinematic", "threshold")).toBe("realtime");
    expect(selectVisualProofLayer("realtime", "sanctuary")).toBe("realtime");
  });
});

// Confirm every motion-protection and error condition leaves a stable still instead of a blank frame.
describe("cinematic presentation", () => {
  it("shows video only after a permitted, unpaused playback state", () => {
    expect(
      selectCinematicPresentation({
        reducedMotion: false,
        paused: false,
        videoPlaying: true,
        videoFailed: false,
      }),
    ).toBe("video");
  });

  it("uses the still for motion reduction, a manual pause, unavailable playback, and decode failure", () => {
    expect(
      selectCinematicPresentation({
        reducedMotion: true,
        paused: false,
        videoPlaying: true,
        videoFailed: false,
      }),
    ).toBe("still");
    expect(
      selectCinematicPresentation({
        reducedMotion: false,
        paused: true,
        videoPlaying: true,
        videoFailed: false,
      }),
    ).toBe("still");
    expect(
      selectCinematicPresentation({
        reducedMotion: false,
        paused: false,
        videoPlaying: false,
        videoFailed: false,
      }),
    ).toBe("still");
    expect(
      selectCinematicPresentation({
        reducedMotion: false,
        paused: false,
        videoPlaying: true,
        videoFailed: true,
      }),
    ).toBe("still");
  });
});
