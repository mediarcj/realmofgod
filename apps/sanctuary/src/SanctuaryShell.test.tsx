/**
 * File: apps/sanctuary/src/SanctuaryShell.test.tsx
 * Description: Verifies the semantic sanctuary shell can render without graphics hardware.
 * Purpose: Guards the DOM-first accessibility boundary from becoming dependent on Canvas.
 * Notes: Server rendering is sufficient because the visual capability logic has focused unit tests.
 */

// Import the renderer and test helpers used to inspect static document output in Node.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SanctuaryShell } from "./SanctuaryShell";

// Confirm essential sanctuary copy remains in ordinary semantic HTML without a WebGL context.
describe("SanctuaryShell", () => {
  it("renders the local sanctuary document without requiring graphics", () => {
    const markup = renderToStaticMarkup(<SanctuaryShell />);

    expect(markup).toContain("A quiet place to pause and reflect.");
    expect(markup).toContain("No account, prayer entry, saved content, or browser persistence");
  });
});
