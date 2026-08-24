/**
 * File: apps/sanctuary/src/sanctuary/model.ts
 * Description: Defines the four-state, in-memory visitor interaction model for the D9 sanctuary proof.
 * Purpose: Keeps the approved environmental interaction sequence deterministic without reusing the retired peace journey.
 * Notes: This model has no account, network, browser-storage, camera-animation, score, or free-navigation behavior.
 */

// Keep the durable MVP vocabulary limited to the owner-approved sanctuary states.
export type SanctuaryMvpStateName = "SANCTUARY" | "SIT" | "READ" | "PRAY";

// Model each state explicitly so later state-specific visuals cannot invent hidden progress facts.
export interface SanctuaryMvpState {
  readonly name: SanctuaryMvpStateName;
}

// Name only the environmental actions the visitor may perform during this proof.
export type SanctuaryMvpAction = "ENTER_PRAYER" | "READ_BIBLE" | "RETURN_TO_SANCTUARY" | "SIT";

// Describe the one semantic action and stable accessible label available in each state.
export interface SanctuaryAffordance {
  readonly action: SanctuaryMvpAction;
  readonly anchor: "bible" | "clerestory" | "grounding" | "seating";
  readonly label:
    "Enter prayer" | "Read the open Bible" | "Return to the sanctuary" | "Sit in the sanctuary";
}

// Start every anonymous visitor in the settled sanctuary frame without retained history.
export const initialSanctuaryMvpState: SanctuaryMvpState = { name: "SANCTUARY" };

// Map each legal state to exactly one next environmental invitation.
const affordancesByState: Record<SanctuaryMvpStateName, SanctuaryAffordance> = {
  SANCTUARY: {
    action: "SIT",
    anchor: "seating",
    label: "Sit in the sanctuary",
  },
  SIT: {
    action: "READ_BIBLE",
    anchor: "bible",
    label: "Read the open Bible",
  },
  READ: {
    action: "ENTER_PRAYER",
    anchor: "clerestory",
    label: "Enter prayer",
  },
  PRAY: {
    action: "RETURN_TO_SANCTUARY",
    anchor: "grounding",
    label: "Return to the sanctuary",
  },
};

// Return the sole active invitation so DOM and Canvas cannot accidentally offer a map of simultaneous hotspots.
export function selectSanctuaryAffordance(state: SanctuaryMvpState): SanctuaryAffordance {
  return affordancesByState[state.name];
}

// Advance only through the owner-approved loop; unsupported actions deliberately leave state unchanged.
export function transitionSanctuaryMvp(
  state: SanctuaryMvpState,
  action: SanctuaryMvpAction,
): SanctuaryMvpState {
  switch (state.name) {
    case "SANCTUARY":
      return action === "SIT" ? { name: "SIT" } : state;
    case "SIT":
      return action === "READ_BIBLE" ? { name: "READ" } : state;
    case "READ":
      return action === "ENTER_PRAYER" ? { name: "PRAY" } : state;
    case "PRAY":
      return action === "RETURN_TO_SANCTUARY" ? initialSanctuaryMvpState : state;
  }
}
