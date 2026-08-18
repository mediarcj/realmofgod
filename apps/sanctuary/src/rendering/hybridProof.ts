/**
 * File: apps/sanctuary/src/rendering/hybridProof.ts
 * Description: Defines the small local decision model for the visual comparison.
 * Purpose: Keeps the development proof separate from the authoritative Journey Engine.
 * Notes: These choices live only in React memory and never represent visitor progress or preference data.
 */

// Import only the journey stage type because visual selection never needs to dispatch a journey action.
import type { JourneyStage } from "../journey/model";

// Name the two visual implementations the owner can compare during local development.
export type VisualProofMode = "realtime" | "cinematic";

// Name the presentation result so the visual component can stay a simple renderer of local state.
export type CinematicPresentation = "still" | "video";

// Name the actual native-media states the development controls must describe without guessing from intent.
export type CinematicMotionStatus =
  "failed" | "loading" | "paused" | "playing" | "reduced" | "unavailable";

// Limit cinematic media to the two states for which the owner supplied matching footage.
export function supportsCinematicStage(stage: JourneyStage): boolean {
  return stage === "entry" || stage === "sanctuary";
}

// Select the visual layer without changing, resetting, or interpreting the visitor's journey state.
export function selectVisualProofLayer(
  mode: VisualProofMode,
  stage: JourneyStage,
): VisualProofMode {
  return mode === "cinematic" && supportsCinematicStage(stage) ? "cinematic" : "realtime";
}

// Describe the visible native-media condition before choosing a label or revealing a moving frame.
export function selectCinematicMotionStatus({
  reducedMotion,
  manuallyPaused,
  videoPlaying,
  videoFailed,
  videoReady,
  playbackUnavailable,
}: {
  readonly reducedMotion: boolean;
  readonly manuallyPaused: boolean;
  readonly videoPlaying: boolean;
  readonly videoFailed: boolean;
  readonly videoReady: boolean;
  readonly playbackUnavailable: boolean;
}): CinematicMotionStatus {
  if (reducedMotion) {
    return "reduced";
  }
  if (videoFailed) {
    return "failed";
  }
  if (!videoReady) {
    return "loading";
  }
  if (manuallyPaused) {
    return "paused";
  }
  if (videoPlaying) {
    return "playing";
  }
  return playbackUnavailable ? "unavailable" : "loading";
}

// Keep a settled still on screen until the native element reports active playback.
export function selectCinematicPresentation(status: CinematicMotionStatus): CinematicPresentation {
  return status === "playing" ? "video" : "still";
}
