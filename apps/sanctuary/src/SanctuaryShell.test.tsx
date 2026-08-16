/**
 * File: apps/sanctuary/src/SanctuaryShell.test.tsx
 * Description: Verifies the semantic sanctuary shell can render without graphics hardware.
 * Purpose: Guards the DOM-first accessibility boundary from becoming dependent on Canvas.
 * Notes: Server rendering is sufficient because the visual capability logic has focused unit tests.
 */

// Import the renderer and test helpers used to inspect static document output in Node.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { JourneyExperience } from "./journey/JourneyExperience";
import { SanctuaryShell } from "./SanctuaryShell";
import { ExperienceFallback, ExperienceLoading } from "./rendering/ExperienceViewport";
import { selectVisualAtmosphere } from "./rendering/visualAtmosphere";

// Confirm essential sanctuary copy remains in ordinary semantic HTML without a WebGL context.
describe("SanctuaryShell", () => {
  it("renders the local sanctuary document without requiring graphics", () => {
    const markup = renderToStaticMarkup(<SanctuaryShell />);

    expect(markup).toContain("A place to be still.");
    expect(markup).toContain("What brings you here?");
    expect(markup).toContain("I need peace");
    expect(markup).toContain("Nothing you choose here is saved");
  });
});

// Confirm the semantic journey remains a button-driven DOM surface without any Canvas requirement.
describe("JourneyExperience", () => {
  it("renders each choice as an ordinary button from controlled journey state", () => {
    const markup = renderToStaticMarkup(
      <JourneyExperience state={{ stage: "choice" }} dispatch={() => undefined} />,
    );

    expect(markup).toContain("<button");
    expect(markup).toContain("Continue walking");
    expect(markup).toContain("Sit and rest");
    expect(markup).toContain("Listen");
    expect(markup).not.toContain("canvas");
  });
});

// Confirm unavailable and loading renderers leave stage-aware local atmosphere behind the usable DOM.
describe("ExperienceViewport fallback surfaces", () => {
  it("renders the same sanctuary fallback during asynchronous loading", () => {
    const visualState = { stage: "entry", choice: null } as const;
    const fallbackMarkup = renderToStaticMarkup(<ExperienceFallback visualState={visualState} />);
    const loadingMarkup = renderToStaticMarkup(<ExperienceLoading visualState={visualState} />);

    expect(loadingMarkup).toBe(fallbackMarkup);
    expect(loadingMarkup).toContain("experience-fallback--sanctuary");
    expect(loadingMarkup).toContain('data-atmosphere="sanctuary"');
  });

  it("selects distinct fallback moods for sanctuary, nature, Scripture, and stillness", () => {
    expect(selectVisualAtmosphere({ stage: "sanctuary", choice: null })).toBe("sanctuary");
    expect(selectVisualAtmosphere({ stage: "reflection", choice: "walk" })).toBe("nature");
    expect(selectVisualAtmosphere({ stage: "scripture", choice: null })).toBe("scripture");
    expect(selectVisualAtmosphere({ stage: "stillness", choice: null })).toBe("stillness");
  });
});
