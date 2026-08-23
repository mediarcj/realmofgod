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
  selectD9VisitorSanctuaryConfig,
  selectD84StaticProofConfig,
  selectD85LandscapeProofConfig,
  selectLocalDiagnosticRoute,
  selectLocalVisualCheck,
  selectExperienceMode,
  shouldBlockD85PortraitViewport,
  shouldBlockNarrowPortraitViewport,
  summarizeD85FrameIntervals,
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

// Keep the separate asset and shadow matrix exact so unrecognized fragments cannot alter the local renderer.
describe("D8.4 static proof selection", () => {
  it("recognizes the approved baseline and batched shadow checks", () => {
    expect(selectD84StaticProofConfig("#verify-d84-baseline-shadows-off")).toEqual({
      candidate: "baseline",
      shadowPolicy: "off",
    });
    expect(selectD84StaticProofConfig("#verify-d84-batched-current-shadows")).toEqual({
      candidate: "batched",
      shadowPolicy: "current",
    });
    expect(selectD84StaticProofConfig("#verify-d84-batched-restrained-shadows")).toEqual({
      candidate: "batched",
      shadowPolicy: "restrained",
    });
  });

  it("rejects incomplete or unrelated static proof fragments", () => {
    expect(selectD84StaticProofConfig("#verify-d84-batched")).toBeNull();
    expect(selectD84StaticProofConfig("#verify-d84-batched-unlimited-shadows")).toBeNull();
  });
});

// Keep the D8.5 continuation route narrow so it cannot request a non-approved policy or source asset.
describe("D8.5 landscape proof selection", () => {
  it("recognizes only the batched candidate with off or restrained shadows", () => {
    expect(selectD85LandscapeProofConfig("#verify-d85-batched-shadows-off")).toEqual({
      candidate: "batched",
      shadowPolicy: "off",
    });
    expect(selectD85LandscapeProofConfig("#verify-d85-batched-restrained-shadows")).toEqual({
      candidate: "batched",
      shadowPolicy: "restrained",
    });
  });

  it("rejects the retired current-shadow and unapproved baseline routes", () => {
    expect(selectD85LandscapeProofConfig("#verify-d85-batched-current-shadows")).toBeNull();
    expect(selectD85LandscapeProofConfig("#verify-d85-baseline-shadows-off")).toBeNull();
  });
});

// Keep the unfragmented D9 visitor root distinct from every explicit local diagnostic route.
describe("D9 visitor sanctuary selection", () => {
  it("uses the batched candidate and restrained shadows at the ordinary development root", () => {
    expect(selectD9VisitorSanctuaryConfig("")).toEqual({
      candidate: "batched",
      shadowPolicy: "restrained",
    });
    expect(selectD9VisitorSanctuaryConfig("#diagnostic-hf01")).toBeNull();
    expect(selectD9VisitorSanctuaryConfig("#verify-d85-batched-restrained-shadows")).toBeNull();
  });

  it("recognizes only the explicit local diagnostics fragment", () => {
    expect(selectLocalDiagnosticRoute("#diagnostic-hf01")).toBe(true);
    expect(selectLocalDiagnosticRoute("")).toBe(false);
    expect(selectLocalDiagnosticRoute("#verify-cinematic-motion")).toBe(false);
  });

  it("blocks narrow portrait viewports without using a device identity", () => {
    expect(shouldBlockNarrowPortraitViewport({ width: 390, height: 844 })).toBe(true);
    expect(shouldBlockNarrowPortraitViewport({ width: 844, height: 390 })).toBe(false);
  });
});

// Keep the landscape-required policy based on actual viewport geometry rather than browser identification.
describe("D8.5 portrait viewport policy", () => {
  it("blocks a narrow portrait phone viewport before the Canvas can mount", () => {
    expect(shouldBlockD85PortraitViewport({ width: 390, height: 844 })).toBe(true);
  });

  it("allows the requested phone landscape and ordinary desktop viewports", () => {
    expect(shouldBlockD85PortraitViewport({ width: 667, height: 375 })).toBe(false);
    expect(shouldBlockD85PortraitViewport({ width: 1920, height: 1080 })).toBe(false);
  });
});

// Keep the pacing summary deterministic while leaving the browser responsible for collecting actual rAF intervals.
describe("D8.5 frame pacing summary", () => {
  it("reports median, p95, and long intervals from a sorted copy", () => {
    expect(summarizeD85FrameIntervals([40, 16, 17, 18, 19])).toEqual({
      frameCount: 5,
      longFrameCount: 1,
      medianMilliseconds: 18,
      p95Milliseconds: 40,
    });
  });

  it("keeps an empty sample distinct from a claimed healthy result", () => {
    expect(summarizeD85FrameIntervals([])).toBeNull();
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
    expect(selectLocalVisualCheck("#verify-cinematic-unavailable")).toBe("cinematic-unavailable");
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
