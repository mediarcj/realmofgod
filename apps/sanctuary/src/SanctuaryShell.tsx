/**
 * File: apps/sanctuary/src/SanctuaryShell.tsx
 * Description: Renders the minimal semantic visitor surface around the static sanctuary environment.
 * Purpose: Places every visitor directly in the approved sanctuary frame without an entry journey or hidden state model.
 * Notes: This component has no account, prayer-input, persistence, provider, network, or camera-transition behavior.
 */

// Import only the optional decorative viewport; visitor meaning remains ordinary DOM rather than Canvas state.
import { ExperienceViewport } from "./rendering/ExperienceViewport";
import { SanctuaryOrientationGate } from "./rendering/SanctuaryOrientationGate";

// Keep the approved starting state immutable until a later owner-approved interaction pass introduces authored movement.
const sanctuaryVisualState = { choice: null, stage: "sanctuary" } as const;

// Render the D9 visitor root without the former emotional selection screen, HUD, or pre-entry copy.
export function SanctuaryShell() {
  return (
    <main className="sanctuary-shell sanctuary-shell--visitor" aria-labelledby="sanctuary-title">
      <h1 id="sanctuary-title" className="visually-hidden">
        Realm of God sanctuary
      </h1>
      <SanctuaryOrientationGate>
        <ExperienceViewport visualState={sanctuaryVisualState} />

        <div className="sanctuary-visitor-control">
          {/* Keep the lone upcoming action semantic but unavailable until the separate authored SIT interaction is approved. */}
          <button type="button" disabled aria-describedby="sanctuary-sit-status">
            Sit
          </button>
          <p id="sanctuary-sit-status" className="visually-hidden">
            Sitting movement is not available in this preview.
          </p>
        </div>
      </SanctuaryOrientationGate>
    </main>
  );
}
