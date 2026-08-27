/**
 * File: apps/sanctuary/src/sanctuary/SanctuaryHomeControl.test.tsx
 * Description: Verifies the quiet universal Home control's visibility, semantics, and intended target size.
 * Purpose: Keeps the secondary sanctuary escape accessible without becoming a standing visual navigation surface.
 * Notes: These server-rendered checks use no graphics hardware, browser storage, input device, or visitor state.
 */

// Import static rendering and focused assertions for the DOM-led control boundary.
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SanctuaryHomeControl } from "./SanctuaryHomeControl";
import { sanctuaryHomeControlTargetSizePx, shouldShowSanctuaryHome } from "./sanctuaryHomePolicy";

// Check the state visibility rule separately from the visual Canvas so every restored settled state remains navigable.
describe("SanctuaryHomeControl visibility", () => {
  it("is absent in SANCTUARY and available in SIT, READ, and PRAY", () => {
    expect(shouldShowSanctuaryHome("SANCTUARY")).toBe(false);
    expect(shouldShowSanctuaryHome("SIT")).toBe(true);
    expect(shouldShowSanctuaryHome("READ")).toBe(true);
    expect(shouldShowSanctuaryHome("PRAY")).toBe(true);
  });
});

// Keep the button semantic and its interaction size explicit without requiring an icon library or client renderer.
describe("SanctuaryHomeControl semantics", () => {
  it("uses an accessible button with an owned outline SVG and no permanent visible label", () => {
    const markup = renderToStaticMarkup(
      <SanctuaryHomeControl onReturnToSanctuary={() => undefined} />,
    );

    expect(markup).toContain('<button aria-label="Return to sanctuary"');
    expect(markup).toContain("<svg");
    expect(markup).not.toContain(">Home<");
  });

  it("keeps a minimum 44px interaction-target contract around the small visual icon", () => {
    expect(sanctuaryHomeControlTargetSizePx).toBeGreaterThanOrEqual(44);
  });
});
