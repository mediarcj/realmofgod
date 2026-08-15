/**
 * File: apps/sanctuary/src/rendering/capabilities.test.ts
 * Description: Covers local graphics and motion decisions without requiring actual graphics hardware.
 * Purpose: Proves unsupported graphics select the DOM fallback and reduced motion stops proof-scene animation.
 * Notes: These tests use only synthetic in-memory probes and do not inspect visitor devices.
 */

// Import Vitest assertions and the pure local decision functions under test.
import { describe, expect, it } from "vitest";

import {
  hasUsableGraphicsContext,
  selectExperienceMode,
  shouldAnimateProofScene,
} from "./capabilities";

// Cover supported and unsupported Canvas probes without creating a real browser canvas.
describe("graphics capability decisions", () => {
  it("accepts a WebGL2 context without reading GPU identifiers", () => {
    expect(
      hasUsableGraphicsContext(() => ({
        getContext: (contextId) => (contextId === "webgl2" ? ({} as RenderingContext) : null),
      })),
    ).toBe(true);
  });

  it("uses fallback when neither supported context is available", () => {
    expect(
      hasUsableGraphicsContext(() => ({
        getContext: () => null,
      })),
    ).toBe(false);
    expect(selectExperienceMode(false)).toBe("fallback");
  });

  it("allows the Canvas only for a usable local context", () => {
    expect(selectExperienceMode(true)).toBe("canvas");
  });
});

// Cover the reduced-motion decision independently from the browser media-query adapter.
describe("proof-scene motion", () => {
  it("stops animation when reduced motion is requested", () => {
    expect(shouldAnimateProofScene(true)).toBe(false);
  });

  it("allows restrained animation when reduced motion is not requested", () => {
    expect(shouldAnimateProofScene(false)).toBe(true);
  });
});
