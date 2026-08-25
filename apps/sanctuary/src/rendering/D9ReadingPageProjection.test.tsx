/**
 * File: apps/sanctuary/src/rendering/D9ReadingPageProjection.test.tsx
 * Description: Tests the DOM-first reading and reflection surfaces used after the D9 environmental Bible interaction.
 * Purpose: Prevents development fixture text or the page action from drifting back into Canvas-only semantics.
 * Notes: These server-rendered tests use synthetic page rectangles and never initialize WebGL or store visitor content.
 */

// Import server rendering to inspect semantic HTML without requiring a browser or renderer.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  D9ProjectedInteractionTarget,
  D9ReadingFallback,
  D9ReadingSurface,
  D9ReflectionSurface,
} from "./ExperienceViewport";
import { createD9PageMatrix3d, orderD9ScreenQuad } from "./d9ReadingPageGeometry";

// Keep the proof rectangle deliberately ordinary because the test protects semantics, not camera-calibration pixels.
const developmentPageLayout = {
  leftPage: {
    corners: [
      { x: 100, y: 140 },
      { x: 220, y: 145 },
      { x: 212, y: 220 },
      { x: 96, y: 215 },
    ],
    semanticRoot: "Bible_LeftOpenPage",
    sourceHeight: 76,
    sourceWidth: 118,
  },
  rightPage: {
    corners: [
      { x: 230, y: 145 },
      { x: 350, y: 140 },
      { x: 356, y: 215 },
      { x: 238, y: 220 },
    ],
    semanticRoot: "Bible_RightOpenPage",
    sourceHeight: 76,
    sourceWidth: 118,
  },
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
    expect(markup).toContain("matrix3d");
    expect(markup).toContain('data-d9-reading-page-root="Bible_RightOpenPage"');
  });

  it("renders the deterministic local reflection with an accessible sanctuary return action", () => {
    const markup = renderToStaticMarkup(<D9ReflectionSurface onReturn={() => undefined} />);

    expect(markup).toContain('data-d9-reflection-surface="true"');
    expect(markup).toContain("Development reflection fixture — not spiritual guidance");
    expect(markup).toContain("Return to sanctuary");
  });

  it("keeps the semantic READ-to-PRAY action available when authored page projection is disabled", () => {
    // The fallback is a stable development path, not a visual substitute for final Bible typography.
    const markup = renderToStaticMarkup(<D9ReadingFallback onLetsPray={() => undefined} />);

    expect(markup).toContain('data-d9-reading-fallback="true"');
    expect(markup).toContain("Let&#x27;s pray");
    expect(markup).toContain("overlay unavailable");
  });

  it("renders a transparent semantic DOM target for an authored object without a standing action box", () => {
    // This static check protects the DOM-first authority boundary; dispatch remains reducer-owned by the shell.
    const markup = renderToStaticMarkup(
      <D9ProjectedInteractionTarget
        onInteraction={() => undefined}
        onVisualStateChange={() => undefined}
        target={{
          action: "SIT",
          ariaLabel: "Sit in the sanctuary",
          key: "dom:SANCTUARY:HF01_PrayerTable__Table_Top",
          screenBounds: { bottom: 420, height: 140, left: 300, right: 620, top: 280, width: 320 },
          semanticRoot: "HF01_PrayerTable__Table_Top",
        }}
      />,
    );

    expect(markup).toContain('data-d9-dom-interaction-target="HF01_PrayerTable__Table_Top"');
    expect(markup).toContain('aria-label="Sit in the sanctuary"');
    expect(markup).not.toContain("d9-affordance-proxy");
  });

  it("orders page corners and emits a perspective transform instead of an axis-aligned rectangle", () => {
    const corners = orderD9ScreenQuad([
      { x: 212, y: 220 },
      { x: 100, y: 140 },
      { x: 96, y: 215 },
      { x: 220, y: 145 },
    ]);

    expect(corners).toEqual(developmentPageLayout.leftPage.corners);
    expect(createD9PageMatrix3d(developmentPageLayout.leftPage)).toContain("matrix3d(");
  });
});
