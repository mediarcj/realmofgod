// File: apps/sanctuary/lib/sanctuary/journey.ts
// Description: Defines the object-driven devotional journey.
// Purpose: Restricts navigation to approved source objects and valid state changes.
// Notes: State is transient; camera revisions make interrupted transitions safe.

import type { SanctuaryView } from "./camera";

export const devotionalObjects = {
  "kneeling-rest": "ROG_KNEE_REST_HYPER3D_MASTER",
  table: "ROG_TABLE_HYPER3D_MASTER",
  bible: "ROG_BIBLE_HYPER3D_MASTER",
} as const;
export const devotionalLabels: Record<string, string> = {
  [devotionalObjects["kneeling-rest"]]: "Approach kneeling rest",
  [devotionalObjects.table]: "Approach devotional table",
  [devotionalObjects.bible]: "Approach Bible",
};
export type JourneyState = { view: SanctuaryView; revision: number; moving: boolean };
export type JourneyAction = { type: "activate"; object: string } | { type: "home" } | { type: "pray" } | { type: "settled"; revision: number };
export const initialJourney: JourneyState = { view: "entry", revision: 0, moving: false };
export function eligibleObjects(view: SanctuaryView): readonly string[] {
  if (view === "entry") return Object.values(devotionalObjects);
  return view === "kneel" ? [devotionalObjects.bible] : [];
}
export function journeyTransition(state: JourneyState, action: JourneyAction): JourneyState {
  if (action.type === "settled") return action.revision === state.revision && state.moving ? { ...state, moving: false } : state;
  if (action.type === "home") return state.view === "entry" && !state.moving ? state : { view: "entry", revision: state.revision + 1, moving: true };
  if (state.moving) return state;
  if (action.type === "pray") return state.view === "bible" ? { view: "prayer", revision: state.revision + 1, moving: true } : state;
  if (!eligibleObjects(state.view).includes(action.object)) return state;
  return { view: state.view === "entry" ? "kneel" : "bible", revision: state.revision + 1, moving: true };
}
