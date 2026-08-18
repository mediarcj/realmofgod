/**
 * File: apps/sanctuary/src/rendering/capabilities.test.ts
 * Description: Covers local graphics and motion decisions without requiring actual graphics hardware.
 * Purpose: Proves unsupported graphics select the DOM fallback and reduced motion stops atmosphere animation.
 * Notes: These tests use only synthetic in-memory probes and do not inspect visitor devices.
 */

// Import Vitest assertions and the pure local decision functions under test.
import { describe, expect, it } from "vitest";

import {
  hasUsableGraphicsApi,
  readRendererVerificationStage,
  selectLocalVisualCheck,
  selectExperienceMode,
  shouldAnimateAtmosphere,
} from "./capabilities";

// Cover supported and unsupported browser APIs without creating a spare GPU context.
describe("graphics capability decisions", () => {
  it("accepts a WebGL2 API without reading GPU identifiers", () => {
    expect(hasUsableGraphicsApi(true, false)).toBe(true);
  });

  it("uses fallback when neither supported API is available", () => {
    expect(hasUsableGraphicsApi(false, false)).toBe(false);
    expect(selectExperienceMode(false)).toBe("fallback");
  });

  it("allows the Canvas only for a usable local context", () => {
    expect(selectExperienceMode(true)).toBe("canvas");
  });
});

// Keep local-only visual verification fragments exact so unrelated hashes cannot change the experience.
describe("local visual check selection", () => {
  it("recognizes only the narrow verification fragments", () => {
    expect(selectLocalVisualCheck("#verify-fallback")).toBe("fallback");
    expect(selectLocalVisualCheck("#verify-reduced-motion")).toBe("reduced-motion");
    expect(selectLocalVisualCheck("#verify-context-loss")).toBe("context-loss");
    expect(selectLocalVisualCheck("#verify-door-mid")).toBe("door-mid");
    expect(selectLocalVisualCheck("#verify-bible-partial")).toBe("bible-partial");
    expect(selectLocalVisualCheck("#verify-bible-open")).toBe("bible-open");
    expect(selectLocalVisualCheck("#verify-cinematic-failure")).toBe("cinematic-failure");
    expect(selectLocalVisualCheck("#verify-cinematic-motion")).toBe("cinematic-motion");
    expect(selectLocalVisualCheck("#verify-renderer-a")).toBe("renderer-a");
    expect(selectLocalVisualCheck("#verify-renderer-e")).toBe("renderer-e");
    expect(selectLocalVisualCheck("#other")).toBeNull();
    expect(selectLocalVisualCheck("")).toBeNull();
  });

  it("keeps renderer isolation inactive outside an exact development check", () => {
    expect(readRendererVerificationStage()).toBeNull();
  });
});

// Cover the reduced-motion decision independently from the browser media-query adapter.
describe("sanctuary atmosphere motion", () => {
  it("stops animation when reduced motion is requested", () => {
    expect(shouldAnimateAtmosphere(true)).toBe(false);
  });

  it("allows restrained animation when reduced motion is not requested", () => {
    expect(shouldAnimateAtmosphere(false)).toBe(true);
  });
});
