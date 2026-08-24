/**
 * File: apps/sanctuary/src/rendering/d9SanctuaryQuality.test.ts
 * Description: Verifies the bounded high-DPI policy for the D9 visitor renderer.
 * Purpose: Prevents the normal visitor path from silently inheriting the DPR-1, no-antialias benchmark policy.
 * Notes: These tests are pure and use synthetic viewport measurements only.
 */

// Import the focused quality policy and scene contract without constructing a WebGL context.
import { describe, expect, it } from "vitest";

import {
  d9BenchmarkRenderQuality,
  d9VisitorSceneContract,
  selectD9VisitorRenderQuality,
} from "./d9SanctuaryQuality";

// Keep the desktop visitor path crisp on a dense display without allowing a larger hidden cap.
describe("D9 visitor renderer quality", () => {
  it("selects capped high-DPI antialiasing instead of the DPR-1 benchmark policy", () => {
    expect(
      selectD9VisitorRenderQuality({ devicePixelRatio: 3, height: 1080, width: 1920 }),
    ).toEqual({
      antialias: true,
      devicePixelRatio: 3,
      dpr: 2,
      policy: "visitor-quality",
    });
    expect(d9BenchmarkRenderQuality).toEqual({
      antialias: false,
      dpr: 1,
      policy: "benchmark-dpr-1",
    });
  });

  // Preserve a modest quality cap for the approved narrow landscape presentation without classifying the browser.
  it("caps narrow landscape at DPR 1.5 while keeping antialiasing enabled", () => {
    expect(
      selectD9VisitorRenderQuality({ devicePixelRatio: 2, height: 390, width: 844 }),
    ).toMatchObject({ antialias: true, dpr: 1.5, policy: "visitor-quality" });
  });

  // Keep the direct visitor scene contract narrow and independent from D84's raw/batched benchmark selector.
  it("loads only the accepted authored batched candidate with two anchored candle lights", () => {
    expect(d9VisitorSceneContract).toEqual({
      candidate: "realm-mvp-sanctuary-v1-r2-batched-meshopt.glb",
      candleLightCount: 2,
      shadowPolicy: "restrained",
      transformPolicy: "preserve-authored",
    });
  });
});
