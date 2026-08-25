/**
 * File: apps/sanctuary/src/rendering/d9DomInteractionTarget.test.ts
 * Description: Verifies D7.5 authored table and Bible bounds form bounded screen-space DOM targets.
 * Purpose: Prevents interaction reachability from depending on Canvas raycasts in desktop or landscape phone layouts.
 * Notes: The tests use pure camera projection only; they do not create a browser Canvas or WebGL renderer.
 */

import { describe, expect, it } from "vitest";

import {
  selectD9DomInteractionTargetForViewport,
  type D9InteractionViewport,
} from "./d9DomInteractionTarget";

// Keep both owner-requested viewport sizes explicit because object framing changes substantially between them.
const verificationViewports: readonly D9InteractionViewport[] = [
  { height: 1080, width: 1920 },
  { height: 390, width: 844 },
];

describe("D9 projected DOM interaction targets", () => {
  for (const viewport of verificationViewports) {
    it(`keeps the SANCTUARY table target visible and bounded at ${viewport.width.toString()}x${viewport.height.toString()}`, () => {
      // The target must cover the tabletop, not become an invisible full-screen state-advance button.
      const target = selectD9DomInteractionTargetForViewport({ name: "SANCTUARY" }, viewport);

      expect(target?.semanticRoot).toBe("HF01_PrayerTable__Table_Top");
      expect(target?.action).toBe("SIT");
      expect(target?.screenBounds.width).toBeGreaterThan(12);
      expect(target?.screenBounds.height).toBeGreaterThan(12);
      expect(target?.screenBounds.width).toBeLessThan(viewport.width * 0.9);
      expect(target?.screenBounds.height).toBeLessThan(viewport.height * 0.9);
    });

    it(`keeps the SIT Bible target visible and bounded at ${viewport.width.toString()}x${viewport.height.toString()}`, () => {
      // The Bible must receive its own fresh target after SIT rather than relying on the retired table mesh proxy.
      const target = selectD9DomInteractionTargetForViewport({ name: "SIT" }, viewport);

      expect(target?.semanticRoot).toBe("HF01_Bible_Root");
      expect(target?.action).toBe("READ_BIBLE");
      expect(target?.screenBounds.width).toBeGreaterThan(12);
      expect(target?.screenBounds.height).toBeGreaterThan(12);
      expect(target?.screenBounds.width).toBeLessThan(viewport.width * 0.9);
      expect(target?.screenBounds.height).toBeLessThan(viewport.height * 0.9);
    });
  }

  it("creates no DOM action target for the settled READ or PRAY states", () => {
    // READ owns its semantic development action and PRAY owns its visible return control.
    const viewport = { height: 1080, width: 1920 };

    expect(selectD9DomInteractionTargetForViewport({ name: "READ" }, viewport)).toBeNull();
    expect(selectD9DomInteractionTargetForViewport({ name: "PRAY" }, viewport)).toBeNull();
  });
});
