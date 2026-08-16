/**
 * File: apps/sanctuary/src/rendering/hf01Motion.ts
 * Description: Selects the decorative HF-01 door and Bible pose from the read-only journey projection.
 * Purpose: Keeps renderer motion deterministic, cancelable, and subordinate to the authoritative DOM journey.
 * Notes: The plan cannot dispatch an action, save progress, or infer anything about a visitor.
 */

import type { JourneyStage } from "../journey/model";

// Name only the four local animation commands understood by the authored-asset adapter.
export type Hf01ClipCommand = "play-forward" | "play-reverse" | "show-start" | "show-end";

export interface Hf01MotionPlan {
  readonly bible: Hf01ClipCommand;
  readonly door: Hf01ClipCommand;
  readonly consumesFreshArrival: boolean;
}

// Resolve visual motion from journey state without creating a second progression authority.
export function selectHf01MotionPlan({
  stage,
  reducedMotion,
  freshArrivalAvailable,
}: {
  readonly stage: JourneyStage;
  readonly reducedMotion: boolean;
  readonly freshArrivalAvailable: boolean;
}): Hf01MotionPlan {
  if (stage === "entry" && freshArrivalAvailable) {
    return {
      bible: reducedMotion ? "show-end" : "play-forward",
      door: reducedMotion ? "show-end" : "play-forward",
      consumesFreshArrival: true,
    };
  }

  if (stage === "threshold") {
    return {
      bible: "show-end",
      door: reducedMotion ? "show-start" : "play-reverse",
      consumesFreshArrival: false,
    };
  }

  if (
    stage === "movement" ||
    stage === "choice" ||
    stage === "reflection" ||
    stage === "scripture" ||
    stage === "stillness"
  ) {
    return { bible: "show-end", door: "show-start", consumesFreshArrival: false };
  }

  return { bible: "show-end", door: "show-end", consumesFreshArrival: false };
}
