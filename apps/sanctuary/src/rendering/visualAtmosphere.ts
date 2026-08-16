/**
 * File: apps/sanctuary/src/rendering/visualAtmosphere.ts
 * Description: Maps the shared journey projection to the few moods used by the CSS fallback.
 * Purpose: Keeps fallback presentation derived from the journey without creating another state machine.
 * Notes: The mapping is pure, local, and contains no actions or visitor information.
 */

import type { JourneyVisualState } from "../journey/model";

// Name only the distinct static compositions needed by the no-WebGL path.
export type VisualAtmosphere = "sanctuary" | "threshold" | "nature" | "scripture" | "stillness";

// Translate a journey stage into a visual mood without introducing another progression model.
export function selectVisualAtmosphere(visualState: JourneyVisualState): VisualAtmosphere {
  switch (visualState.stage) {
    case "entry":
    case "sanctuary":
      return "sanctuary";
    case "threshold":
      return "threshold";
    case "movement":
    case "choice":
    case "reflection":
      return "nature";
    case "scripture":
      return "scripture";
    case "stillness":
      return "stillness";
  }
}
