/**
 * File: apps/sanctuary/src/sanctuary/sessionState.ts
 * Description: Restores and persists the minimal same-tab sanctuary state around the pure interaction model.
 * Purpose: Lets a refresh reopen the settled anonymous sanctuary state without retaining visitor content or camera data.
 * Notes: Only the four approved state names are accepted, and inaccessible browser storage safely behaves like a new sanctuary visit.
 */

// Import React primitives only for synchronous reducer initialization and semantic action dispatching.
import { useCallback, useEffect, useReducer, useRef } from "react";

import {
  initialSanctuaryMvpState,
  transitionSanctuaryMvp,
  type SanctuaryMvpAction,
  type SanctuaryMvpState,
  type SanctuaryMvpStateName,
} from "./model";

// Keep the browser payload versioned and intentionally limited to one settled state name.
export const sanctuarySessionStorageKey = "realm.sanctuary.state.v1";

// Recognize only the durable vocabulary that the sanctuary reducer already understands.
export function isSanctuaryMvpStateName(value: string | null): value is SanctuaryMvpStateName {
  return value === "SANCTUARY" || value === "SIT" || value === "READ" || value === "PRAY";
}

// Read session storage through one defensive browser boundary so disabled or private modes cannot interrupt the sanctuary.
function readBrowserSessionStorage(): Storage | null {
  try {
    if (typeof window === "undefined") {
      return null;
    }

    return window.sessionStorage;
  } catch {
    return null;
  }
}

// Convert one stored state name to a settled reducer state; malformed or unavailable input always starts calmly at the sanctuary.
export function restoreSanctuaryMvpState(
  storage: Pick<Storage, "getItem"> | null,
): SanctuaryMvpState {
  try {
    const storedStateName = storage?.getItem(sanctuarySessionStorageKey) ?? null;
    return isSanctuaryMvpStateName(storedStateName)
      ? { name: storedStateName }
      : initialSanctuaryMvpState;
  } catch {
    return initialSanctuaryMvpState;
  }
}

// Persist only a newly settled state name and deliberately swallow storage failures because continuity is never required to enter.
export function persistSanctuaryMvpState(
  storage: Pick<Storage, "setItem"> | null,
  state: SanctuaryMvpState,
): void {
  try {
    storage?.setItem(sanctuarySessionStorageKey, state.name);
  } catch {
    // Keep the anonymous sanctuary usable when the browser rejects same-tab storage access.
  }
}

// Read the same-tab state during React's lazy initialization so a restored frame exists before the visitor viewport mounts.
function initializeSanctuaryMvpState(): SanctuaryMvpState {
  return restoreSanctuaryMvpState(readBrowserSessionStorage());
}

// Keep persistence at the semantic-action boundary while the reducer remains the source of truth for legal transitions.
export function useSanctuarySessionState(): readonly [
  SanctuaryMvpState,
  (action: SanctuaryMvpAction) => void,
] {
  const [sanctuaryState, dispatch] = useReducer(
    transitionSanctuaryMvp,
    initialSanctuaryMvpState,
    initializeSanctuaryMvpState,
  );
  const sanctuaryStateRef = useRef(sanctuaryState);

  // Keep the action callback aligned with the committed state after React renders or development refreshes the module.
  useEffect(() => {
    sanctuaryStateRef.current = sanctuaryState;
  }, [sanctuaryState]);

  // Write only after the pure reducer accepts a legal state change; camera progress and presentation preferences never reach storage.
  const sendSanctuaryAction = useCallback((action: SanctuaryMvpAction): void => {
    const currentState = sanctuaryStateRef.current;
    const nextState = transitionSanctuaryMvp(currentState, action);

    if (nextState === currentState) {
      return;
    }

    sanctuaryStateRef.current = nextState;
    persistSanctuaryMvpState(readBrowserSessionStorage(), nextState);
    dispatch(action);
  }, []);

  return [sanctuaryState, sendSanctuaryAction] as const;
}
