/**
 * File: apps/sanctuary/src/SanctuaryShell.tsx
 * Description: Renders the minimal semantic visitor surface around the guided sanctuary environment.
 * Purpose: Places every visitor inside one quiet four-step interaction path without restoring an entry journey or visual HUD.
 * Notes: This component has no account, prayer-input, persistence, provider, network, or camera-transition behavior.
 */

// Import only the optional decorative viewport; visitor meaning remains ordinary DOM rather than Canvas state.
import { useReducer } from "react";

import {
  initialSanctuaryMvpState,
  selectSanctuaryAffordance,
  transitionSanctuaryMvp,
} from "./sanctuary/model";
import { ExperienceViewport } from "./rendering/ExperienceViewport";
import { SanctuaryOrientationGate } from "./rendering/SanctuaryOrientationGate";

// Keep the approved starting state immutable until a later owner-approved interaction pass introduces authored movement.
const sanctuaryVisualState = { choice: null, stage: "sanctuary" } as const;

// Render the D9 visitor root without the former emotional selection screen, HUD, or pre-entry copy.
export function SanctuaryShell() {
  // Keep the browser shell as the only transition authority; Canvas receives only a state projection and action callback.
  const [sanctuaryState, sendSanctuaryAction] = useReducer(
    transitionSanctuaryMvp,
    initialSanctuaryMvpState,
  );
  const affordance = selectSanctuaryAffordance(sanctuaryState);
  const environmentalKeyboardControl =
    sanctuaryState.name === "SANCTUARY" || sanctuaryState.name === "SIT";

  return (
    <main className="sanctuary-shell sanctuary-shell--visitor" aria-labelledby="sanctuary-title">
      <h1 id="sanctuary-title" className="visually-hidden">
        Realm of God sanctuary
      </h1>
      <SanctuaryOrientationGate>
        <ExperienceViewport
          onSanctuaryInteraction={sendSanctuaryAction}
          sanctuaryState={sanctuaryState}
          visualState={sanctuaryVisualState}
        />

        {environmentalKeyboardControl ? (
          <div className="sanctuary-environmental-control">
            {/* Keep the current environmental action keyboard-reachable while its label stays absent during ordinary pointer use. */}
            <button
              aria-label={affordance.label}
              onClick={() => {
                sendSanctuaryAction(affordance.action);
              }}
              type="button"
            >
              {affordance.label}
            </button>
          </div>
        ) : null}
        <p aria-live="polite" className="visually-hidden">
          {sanctuaryState.name.toLowerCase()} sanctuary state
        </p>
      </SanctuaryOrientationGate>
    </main>
  );
}
