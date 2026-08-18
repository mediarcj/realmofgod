/**
 * File: apps/sanctuary/src/rendering/hybridProof.test.ts
 * Description: Covers the local visual-proof and cinematic-presentation decisions.
 * Purpose: Proves cinematic media stays limited to supplied states and never changes journey semantics.
 * Notes: Tests use only static in-memory facts and do not load media or browser storage.
 */

// Import Vitest helpers and the small pure decision functions under review.
import { describe, expect, it } from "vitest";

import {
  selectCinematicMotionStatus,
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

// Confirm the control labels report actual native-media conditions rather than a requested pause intent.
describe("cinematic motion status", () => {
  const baseState = {
    manuallyPaused: false,
    playbackUnavailable: false,
    reducedMotion: false,
    videoFailed: false,
    videoPlaying: false,
    videoReady: true,
  };

  it("reports every meaningful playback state", () => {
    expect(selectCinematicMotionStatus({ ...baseState, videoPlaying: true })).toBe("playing");
    expect(selectCinematicMotionStatus({ ...baseState, manuallyPaused: true })).toBe("paused");
    expect(selectCinematicMotionStatus({ ...baseState, playbackUnavailable: true })).toBe(
      "unavailable",
    );
    expect(selectCinematicMotionStatus({ ...baseState, videoReady: false })).toBe("loading");
    expect(selectCinematicMotionStatus({ ...baseState, videoFailed: true })).toBe("failed");
    expect(selectCinematicMotionStatus({ ...baseState, reducedMotion: true })).toBe("reduced");
  });

  it("reveals video only for reported active playback", () => {
    expect(selectCinematicPresentation("playing")).toBe("video");
    expect(selectCinematicPresentation("loading")).toBe("still");
    expect(selectCinematicPresentation("paused")).toBe("still");
    expect(selectCinematicPresentation("unavailable")).toBe("still");
    expect(selectCinematicPresentation("reduced")).toBe("still");
    expect(selectCinematicPresentation("failed")).toBe("still");
  });
});
