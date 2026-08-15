/**
 * File: apps/sanctuary/src/SanctuaryShell.tsx
 * Description: Renders the semantic document surface around the sanctuary visual environment.
 * Purpose: Keeps primary sanctuary meaning and accessibility in ordinary React and DOM content.
 * Notes: This component has no account, prayer-input, persistence, provider, or network behavior.
 */

// Import the visual boundary without allowing rendering-library code to spread through the document UI.
import { ExperienceViewport } from "./rendering/ExperienceViewport";
import { JourneyExperience } from "./journey/JourneyExperience";

// Keep the primary sanctuary content semantic and readable before the optional visual environment.
export function SanctuaryShell() {
  return (
    <main className="sanctuary-shell" aria-labelledby="sanctuary-title">
      <section className="sanctuary-introduction">
        <p className="sanctuary-name">Realm of God</p>
        <h1 id="sanctuary-title">A quiet place to pause and reflect.</h1>
        <p className="sanctuary-summary">
          This is an anonymous contemplative sanctuary. Its visual environment is optional; the
          words and structure remain available without graphics.
        </p>
      </section>

      <ExperienceViewport />

      <JourneyExperience />

      <aside className="sanctuary-note" aria-label="Local sanctuary status">
        <p>No account, prayer entry, saved content, or browser persistence is active here.</p>
      </aside>
    </main>
  );
}
