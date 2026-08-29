/**
 * File: apps/sanctuary/src/rendering/d9SanctuaryQuality.ts
 * Description: Defines the D9 visitor renderer's bounded pixel-quality policy and scene contract.
 * Purpose: Keeps the normal sanctuary distinct from fixed DPR-1 diagnostic proof rendering.
 * Notes: The policy is local, does not identify a device, and has no persistence or network behavior.
 */

// Describe only the local measurements needed to select a bounded presentation-quality scale.
export interface D9RenderQualityInput {
  readonly devicePixelRatio: number;
  readonly height: number;
  readonly width: number;
}

// Keep the selected renderer inputs explicit so focused tests can separate visitor quality from benchmarks.
export interface D9RenderQuality {
  readonly antialias: true;
  readonly devicePixelRatio: number;
  readonly dpr: number;
  readonly policy: "visitor-quality";
}

// Retain the existing benchmark surface as an explicit, fixed comparison configuration.
export const d9BenchmarkRenderQuality = {
  antialias: false,
  dpr: 1,
  policy: "benchmark-dpr-1",
} as const;

// Name the final authored candidate and render constraints without coupling the visitor component to D8.4 proof routes.
export const d9VisitorSceneContract = {
  candidate: "realm-mvp-sanctuary-v2-final-art.glb",
  candleLightCount: 2,
  shadowPolicy: "restrained",
  transformPolicy: "preserve-authored",
} as const;

// Keep a large desktop reasonably crisp while preventing unbounded pixel-fill cost on very dense displays.
const D9_DESKTOP_MAX_DPR = 2;

// Give the required narrow landscape phone composition a smaller, still anti-aliased rendering cap.
const D9_NARROW_LANDSCAPE_MAX_DPR = 1.5;

// Treat only small landscape dimensions as the mobile-quality case; browser identity is never inspected.
function isNarrowLandscapeViewport({ height, width }: D9RenderQualityInput): boolean {
  return width >= height && width <= 900 && height <= 500;
}

// Select a safe DPR even when an embedding surface reports an invalid or missing device scale.
function normalizeDevicePixelRatio(devicePixelRatio: number): number {
  return Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1;
}

// Select the normal visitor quality independently from the intentionally DPR-1 D84/D85 proof routes.
export function selectD9VisitorRenderQuality(input: D9RenderQualityInput): D9RenderQuality {
  const devicePixelRatio = normalizeDevicePixelRatio(input.devicePixelRatio);
  const maximumDpr = isNarrowLandscapeViewport(input)
    ? D9_NARROW_LANDSCAPE_MAX_DPR
    : D9_DESKTOP_MAX_DPR;

  return {
    antialias: true,
    devicePixelRatio,
    dpr: Math.min(devicePixelRatio, maximumDpr),
    policy: "visitor-quality",
  };
}
