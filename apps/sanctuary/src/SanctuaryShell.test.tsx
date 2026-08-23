/**
 * File: apps/sanctuary/src/SanctuaryShell.test.tsx
 * Description: Verifies the D9 visitor root can render without graphics hardware or the retired entry journey.
 * Purpose: Guards the DOM-first accessibility boundary and prevents legacy emotional-entry UI from returning by default.
 * Notes: Server rendering is sufficient because renderer and viewport choices have focused unit tests.
 */

// Import the renderer and test helpers used to inspect static document output in Node.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SanctuaryShell } from "./SanctuaryShell";
import { ExperienceFallback, ExperienceLoading } from "./rendering/ExperienceViewport";
import { selectVisualAtmosphere } from "./rendering/visualAtmosphere";

// Confirm the ordinary root is already inside the sanctuary and exposes only the temporary semantic SIT control.
describe("SanctuaryShell", () => {
  it("renders the D9 visitor document without requiring graphics", () => {
    const markup = renderToStaticMarkup(<SanctuaryShell />);

    expect(markup).toContain("Realm of God sanctuary");
    expect(markup).toContain(">Sit</button>");
    expect(markup).toContain("disabled");
    expect(markup).not.toContain("A place to be still.");
    expect(markup).not.toContain("What brings you here?");
    expect(markup).not.toContain("I need peace");
    expect(markup).not.toContain("Open visual calibration");
    expect(markup).not.toContain("Cinematic Higgsfield");
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
