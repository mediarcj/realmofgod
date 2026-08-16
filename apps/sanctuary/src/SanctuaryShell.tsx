/**
 * File: apps/sanctuary/src/SanctuaryShell.tsx
 * Description: Renders the semantic document surface around the sanctuary visual environment.
 * Purpose: Keeps primary sanctuary meaning and accessibility in ordinary React and DOM content.
 * Notes: This component has no account, prayer-input, persistence, provider, or network behavior.
 */

// Import React's one local reducer together with the semantic journey and lazy visual boundary.
import { useReducer } from "react";

import { JourneyExperience } from "./journey/JourneyExperience";
import { deriveJourneyVisualState, initialJourneyState, transitionJourney } from "./journey/model";
import { ExperienceViewport } from "./rendering/ExperienceViewport";

// Keep one journey state authoritative while the DOM and decorative background receive narrow views of it.
export function SanctuaryShell() {
  const [journeyState, dispatch] = useReducer(transitionJourney, initialJourneyState);
  const visualState = deriveJourneyVisualState(journeyState);

  return (
    <main
      className={`sanctuary-shell sanctuary-shell--${journeyState.stage}`}
      aria-labelledby="sanctuary-title"
    >
      <ExperienceViewport visualState={visualState} />

      <div className="sanctuary-content">
        <header className="sanctuary-introduction">
          <p className="sanctuary-name">Realm of God</p>
          <h1 id="sanctuary-title">A place to be still.</h1>
          <p className="sanctuary-summary">Enter slowly. Nothing here asks you to hurry.</p>
        </header>

        <JourneyExperience state={journeyState} dispatch={dispatch} />

        <aside className="sanctuary-note" aria-label="Private visit status">
          <p>This visit is anonymous. Nothing you choose here is saved.</p>
        </aside>
      </div>
    </main>
  );
}
