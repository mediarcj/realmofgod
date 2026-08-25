/**
 * File: apps/sanctuary/src/rendering/D9ReadingPageProjection.test.tsx
 * Description: Tests the DOM-first reading and reflection surfaces used after the D9 environmental Bible interaction.
 * Purpose: Prevents development fixture text or the page action from drifting back into Canvas-only semantics.
 * Notes: These server-rendered tests use synthetic page rectangles and never initialize WebGL or store visitor content.
 */

// Import server rendering to inspect semantic HTML without requiring a browser or renderer.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { D9ReadingSurface, D9ReflectionSurface } from "./ExperienceViewport";

// Keep the proof rectangle deliberately ordinary because the test protects semantics, not camera-calibration pixels.
const developmentPageLayout = {
  leftPage: { height: 80, left: 100, top: 140, width: 120 },
  rightPage: { height: 80, left: 230, top: 140, width: 120 },
} as const;

describe("D9 page-anchored DOM reading surfaces", () => {
  it("renders development-only page content and the lower-right prayer action as semantic HTML", () => {
    const markup = renderToStaticMarkup(
      <D9ReadingSurface layout={developmentPageLayout} onLetsPray={() => undefined} />,
    );

    expect(markup).toContain('data-d9-reading-surface="true"');
    expect(markup).toContain("Development layout fixture — not Scripture");
    expect(markup).toContain("Let&#x27;s pray");
    expect(markup).toContain("button");
  });

  it("renders the deterministic local reflection with an accessible sanctuary return action", () => {
    const markup = renderToStaticMarkup(<D9ReflectionSurface onReturn={() => undefined} />);

    expect(markup).toContain('data-d9-reflection-surface="true"');
    expect(markup).toContain("Development reflection fixture — not spiritual guidance");
    expect(markup).toContain("Return to sanctuary");
  });
});
