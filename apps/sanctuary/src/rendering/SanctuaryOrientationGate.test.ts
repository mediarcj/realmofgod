/**
 * File: apps/sanctuary/src/rendering/SanctuaryOrientationGate.test.ts
 * Description: Covers the DOM-only viewport notices used before the optional sanctuary Canvas may mount.
 * Purpose: Keeps browser zoom available and keeps portrait orientation guidance separate from constrained-space guidance.
 * Notes: These tests use synthetic dimensions only and do not identify a browser, device, or visitor.
 */

// Import Vitest assertions and the pure viewport policy without creating a WebGL context.
import { describe, expect, it } from "vitest";

import { selectSanctuaryViewportNotice } from "./capabilities";

// Keep the portrait splash intentionally separate from a small effective landscape viewport caused by resize or magnification.
describe("SanctuaryOrientationGate viewport notices", () => {
  it("keeps phone portrait DOM-only and asks the visitor to use landscape orientation", () => {
    expect(selectSanctuaryViewportNotice({ width: 390, height: 844 })).toEqual({
      instruction: "Turn your phone sideways to enter.",
      permitsCanvas: false,
      presentation: "portrait",
      supportingCopy: "The sanctuary opens in landscape orientation.",
      title: "Realm of God",
      welcome: "Welcome to the sanctuary.",
    });
  });

  it("keeps an extremely constrained landscape viewport DOM-only with zoom or window guidance", () => {
    expect(selectSanctuaryViewportNotice({ width: 422, height: 195 })).toEqual({
      instruction: "Zoom out or enlarge this browser window to continue.",
      permitsCanvas: false,
      presentation: "constrained",
      supportingCopy: null,
      title: "The sanctuary needs a little more viewing space.",
      welcome: null,
    });
  });

  it("permits the Canvas again when a portrait visitor rotates into sufficient landscape space", () => {
    expect(selectSanctuaryViewportNotice({ width: 390, height: 844 }).permitsCanvas).toBe(false);
    expect(selectSanctuaryViewportNotice({ width: 844, height: 390 })).toEqual({
      instruction: null,
      permitsCanvas: true,
      presentation: "scene",
      supportingCopy: null,
      title: null,
      welcome: null,
    });
  });
});
