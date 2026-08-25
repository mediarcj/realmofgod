/**
 * File: apps/sanctuary/src/SanctuaryShell.tsx
 * Description: Renders the minimal semantic visitor surface around the guided sanctuary environment.
 * Purpose: Places every visitor inside one quiet four-step interaction path without restoring an entry journey or visual HUD.
 * Notes: This component has no account, prayer-input, persistence, provider, network, or camera-transition behavior.
 */

// Import only the optional decorative viewport; visitor meaning remains ordinary DOM rather than Canvas state.
import { useReducer, useState } from "react";

import {
  initialSanctuaryMvpState,
  selectSanctuaryAffordance,
  transitionSanctuaryMvp,
} from "./sanctuary/model";
import { ExperienceViewport } from "./rendering/ExperienceViewport";
import { SanctuaryOrientationGate } from "./rendering/SanctuaryOrientationGate";
import { readD9AffordanceDiagnostic } from "./rendering/capabilities";

// Keep the approved starting state immutable until a later owner-approved interaction pass introduces authored movement.
const sanctuaryVisualState = { choice: null, stage: "sanctuary" } as const;

// Render the D9 visitor root without the former emotional selection screen, HUD, or pre-entry copy.
export function SanctuaryShell() {
  // Keep the browser shell as the only transition authority; Canvas receives only a state projection and action callback.
  const [sanctuaryState, sendSanctuaryAction] = useReducer(
    transitionSanctuaryMvp,
    initialSanctuaryMvpState,
  );
  // Make explicit local diagnostics recoverable without adding controls to the normal visitor route or production bundle.
  const diagnosticAffordancesEnabled = import.meta.env.DEV && readD9AffordanceDiagnostic();
  const [diagnosticState, setDiagnosticState] = useState(initialSanctuaryMvpState);
  const activeState = diagnosticAffordancesEnabled ? diagnosticState : sanctuaryState;
  const advanceState = (action: Parameters<typeof transitionSanctuaryMvp>[1]) => {
    if (diagnosticAffordancesEnabled) {
      setDiagnosticState((current) => transitionSanctuaryMvp(current, action));
      return;
    }
    sendSanctuaryAction(action);
  };
  const affordance = selectSanctuaryAffordance(activeState);
  const environmentalKeyboardControl =
    activeState.name === "SANCTUARY" || activeState.name === "SIT" || activeState.name === "READ";

  return (
    <main className="sanctuary-shell sanctuary-shell--visitor" aria-labelledby="sanctuary-title">
      <h1 id="sanctuary-title" className="visually-hidden">
        Realm of God sanctuary
      </h1>
      <SanctuaryOrientationGate>
        <ExperienceViewport
          onSanctuaryInteraction={advanceState}
          sanctuaryState={activeState}
          visualState={sanctuaryVisualState}
        />

        {diagnosticAffordancesEnabled ? (
          <section
            aria-label="Development sanctuary state tester"
            className="d9-diagnostic-state-tester"
            data-d9-diagnostic-state-tester="true"
          >
            <p>Development state</p>
            {(["SANCTUARY", "SIT", "READ", "PRAY"] as const).map((stateName) => (
              <button
                aria-pressed={activeState.name === stateName}
                key={stateName}
                onClick={() => {
                  // Let a developer recover the one local state machine without a refresh when testing a Canvas target.
                  setDiagnosticState({ name: stateName });
                }}
                type="button"
              >
                {stateName}
              </button>
            ))}
          </section>
        ) : null}

        {environmentalKeyboardControl ? (
          <div className="sanctuary-environmental-control">
            {/* Keep the current environmental action keyboard-reachable while its label stays absent during ordinary pointer use. */}
            <button
              aria-label={affordance.label}
              onClick={() => {
                advanceState(affordance.action);
              }}
              type="button"
            >
              {affordance.label}
            </button>
          </div>
        ) : null}
        <p aria-live="polite" className="visually-hidden">
          {activeState.name.toLowerCase()} sanctuary state
        </p>
      </SanctuaryOrientationGate>
    </main>
  );
}
