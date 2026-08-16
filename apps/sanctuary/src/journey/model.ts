/**
 * File: apps/sanctuary/src/journey/model.ts
 * Description: Defines the small deterministic state model for the anonymous peace journey.
 * Purpose: Keeps valid journey progression explicit without creating a general game framework.
 * Notes: State exists only in React memory and contains no visitor identity or lasting history.
 */

// Keep the journey vocabulary limited to the approved states needed by this one vertical slice.
export type JourneyStage =
  | "entry"
  | "threshold"
  | "movement"
  | "choice"
  | "reflection"
  | "scripture"
  | "stillness"
  | "sanctuary";

// Describe equal experience-shaping choices without attaching rank, score, or spiritual meaning.
export type PeaceChoice = "walk" | "sit" | "listen";

// Model each stage precisely so a branch choice exists only during its short reflection beat.
export type JourneyState =
  | { readonly stage: "entry" }
  | { readonly stage: "threshold" }
  | { readonly stage: "movement" }
  | { readonly stage: "choice" }
  | { readonly stage: "reflection"; readonly choice: PeaceChoice }
  | { readonly stage: "scripture" }
  | { readonly stage: "stillness" }
  | { readonly stage: "sanctuary" };

// Name only the visitor actions this one journey can understand.
export type JourneyAction =
  | { readonly type: "begin-peace" }
  | { readonly type: "continue" }
  | { readonly type: "choose"; readonly choice: PeaceChoice }
  | { readonly type: "remain" }
  | { readonly type: "return-to-realm" };

// Limit the decorative layer to the two presentation facts it needs from the journey engine.
export interface JourneyVisualState {
  readonly stage: JourneyStage;
  readonly choice: PeaceChoice | null;
}

// Keep the entry state reusable and make a reset visibly return to the same safe starting point.
export const initialJourneyState: JourneyState = { stage: "entry" };

// Derive a read-only visual projection without giving the renderer actions or a second state machine.
export function deriveJourneyVisualState(state: JourneyState): JourneyVisualState {
  return {
    stage: state.stage,
    choice: state.stage === "reflection" ? state.choice : null,
  };
}

// Move through the approved path only; unsupported actions intentionally preserve the current state.
export function transitionJourney(state: JourneyState, action: JourneyAction): JourneyState {
  switch (state.stage) {
    case "entry":
      return action.type === "begin-peace" ? { stage: "threshold" } : state;
    case "threshold":
      return action.type === "continue" ? { stage: "movement" } : state;
    case "movement":
      return action.type === "continue" ? { stage: "choice" } : state;
    case "choice":
      return action.type === "choose" ? { stage: "reflection", choice: action.choice } : state;
    case "reflection":
      return action.type === "continue" ? { stage: "scripture" } : state;
    case "scripture":
      return action.type === "continue" ? { stage: "stillness" } : state;
    case "stillness":
      return action.type === "continue" ? { stage: "sanctuary" } : state;
    case "sanctuary":
      return action.type === "return-to-realm" ? initialJourneyState : state;
  }
}
