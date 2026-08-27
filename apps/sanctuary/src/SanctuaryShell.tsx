/**
 * File: apps/sanctuary/src/SanctuaryShell.tsx
 * Description: Renders the minimal semantic visitor surface around the guided sanctuary environment.
 * Purpose: Places every visitor inside one quiet four-step interaction path without restoring an entry journey or visual HUD.
 * Notes: Same-tab state continuity stays minimal and local; this component has no account, prayer-input, provider, network, or camera-transition behavior.
 */

// Import only the optional decorative viewport; visitor meaning remains ordinary DOM rather than Canvas state.
import { selectSanctuaryAffordance } from "./sanctuary/model";
import { SanctuaryHomeControl } from "./sanctuary/SanctuaryHomeControl";
import { shouldShowSanctuaryHome } from "./sanctuary/sanctuaryHomePolicy";
import { useSanctuarySessionState } from "./sanctuary/sessionState";
import { ExperienceViewport } from "./rendering/ExperienceViewport";
import { SanctuaryOrientationGate } from "./rendering/SanctuaryOrientationGate";

// Keep the approved starting state immutable until a later owner-approved interaction pass introduces authored movement.
const sanctuaryVisualState = { choice: null, stage: "sanctuary" } as const;

// Render the D9 visitor root without the former emotional selection screen, HUD, or pre-entry copy.
export function SanctuaryShell() {
  // Restore one validated same-tab state before the viewport mounts; Canvas receives only a state projection and action callback.
  const [sanctuaryState, sendSanctuaryAction] = useSanctuarySessionState();
  const affordance = selectSanctuaryAffordance(sanctuaryState);
  const environmentalKeyboardControl =
    sanctuaryState.name === "SANCTUARY" ||
    sanctuaryState.name === "SIT" ||
    sanctuaryState.name === "READ";

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

        {shouldShowSanctuaryHome(sanctuaryState.name) ? (
          <SanctuaryHomeControl
            onReturnToSanctuary={() => {
              sendSanctuaryAction("RETURN_HOME_TO_SANCTUARY");
            }}
          />
        ) : null}

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
