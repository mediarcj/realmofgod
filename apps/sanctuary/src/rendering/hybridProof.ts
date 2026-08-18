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

// Keep a settled still on screen for reduced motion, a user pause, or any unavailable media state.
export function selectCinematicPresentation({
  reducedMotion,
  paused,
  videoPlaying,
  videoFailed,
}: {
  readonly reducedMotion: boolean;
  readonly paused: boolean;
  readonly videoPlaying: boolean;
  readonly videoFailed: boolean;
}): CinematicPresentation {
  return !reducedMotion && !paused && videoPlaying && !videoFailed ? "video" : "still";
}
