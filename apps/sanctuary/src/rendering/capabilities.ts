/**
 * File: apps/sanctuary/src/rendering/capabilities.ts
 * Description: Defines local-only graphics capability and rendering-mode decisions.
 * Purpose: Lets the visual layer fall back safely without collecting device or GPU information.
 * Notes: Capability results stay in browser memory and are never sent to a server.
 */

// Keep visual rendering choices small and explicit for components and tests.
export type ExperienceMode = "canvas" | "fallback";

// Name the fragment-only local checks that make otherwise hardware-dependent paths reproducible.
export type RendererVerificationStage = "a" | "b" | "c" | "d" | "e" | null;

// Describe the deliberately narrow local D8.4 comparison matrix without adding a production-facing control.
export interface D84StaticProofConfig {
  readonly candidate: "baseline" | "batched";
  readonly shadowPolicy: "off" | "current" | "restrained";
}

// Describe the D8.5 continuation route, which intentionally measures only the accepted batched candidate.
export interface D85LandscapeProofConfig {
  readonly candidate: "batched";
  readonly shadowPolicy: "off" | "restrained";
}

// Keep the viewport-only mobile policy explicit so it does not depend on a browser user-agent claim.
export interface ViewportSize {
  readonly height: number;
  readonly width: number;
}

// Describe the small rAF summary recorded by the development-only landscape proof.
export interface FramePacingSummary {
  readonly frameCount: number;
  readonly longFrameCount: number;
  readonly medianMilliseconds: number;
  readonly p95Milliseconds: number;
}

// Keep the MVP phone classification deliberately narrow; larger portrait browser windows remain ordinary layouts.
export const D85_NARROW_VIEWPORT_MAX_WIDTH = 600;

// Use a 30fps threshold only to flag a long presentation interval, not to claim a GPU benchmark.
export const D85_LONG_FRAME_THRESHOLD_MILLISECONDS = 1000 / 30;

// Keep failure, motion, and renderer-isolation checks development-only and fragment-exact.
export type LocalVisualCheck =
  | "bible-open"
  | "cinematic-failure"
  | "cinematic-motion"
  | "cinematic-unavailable"
  | "bible-partial"
  | "context-loss"
  | "door-mid"
  | "fallback"
  | "reduced-motion"
  | `renderer-${Exclude<RendererVerificationStage, null>}`
  | null;

// Interpret only exact non-transmitted URL fragments and ignore every other value.
export function selectLocalVisualCheck(fragment: string): LocalVisualCheck {
  switch (fragment) {
    case "#verify-fallback":
      return "fallback";
    case "#verify-reduced-motion":
      return "reduced-motion";
    case "#verify-context-loss":
      return "context-loss";
    case "#verify-door-mid":
      return "door-mid";
    case "#verify-bible-partial":
      return "bible-partial";
    case "#verify-bible-open":
      return "bible-open";
    case "#verify-cinematic-failure":
      return "cinematic-failure";
    case "#verify-cinematic-motion":
      return "cinematic-motion";
    case "#verify-cinematic-unavailable":
      return "cinematic-unavailable";
    case "#verify-renderer-a":
      return "renderer-a";
    case "#verify-renderer-b":
      return "renderer-b";
    case "#verify-renderer-c":
      return "renderer-c";
    case "#verify-renderer-d":
      return "renderer-d";
    case "#verify-renderer-e":
      return "renderer-e";
    default:
      return null;
  }
}

// Enable deterministic local visual checks only in the development bundle; production always uses real capability signals.
export function readLocalVisualCheck(): LocalVisualCheck {
  if (!import.meta.env.DEV || typeof window === "undefined") {
    return null;
  }

  return selectLocalVisualCheck(window.location.hash);
}

// Recognize only the exact local fragments used to compare the two staged assets and three shadow policies.
export function selectD84StaticProofConfig(fragment: string): D84StaticProofConfig | null {
  const matches =
    /^#verify-d84-(baseline|batched)-(shadows-off|current-shadows|restrained-shadows)$/u.exec(
      fragment,
    );
  if (matches === null) {
    return null;
  }
  const [, candidate, shadow] = matches;
  if (candidate !== "baseline" && candidate !== "batched") {
    return null;
  }
  switch (shadow) {
    case "shadows-off":
      return { candidate, shadowPolicy: "off" };
    case "current-shadows":
      return { candidate, shadowPolicy: "current" };
    case "restrained-shadows":
      return { candidate, shadowPolicy: "restrained" };
    default:
      return null;
  }
}

// Keep D8.4 proof selection in the development bundle so a production visitor cannot request a candidate asset.
export function readD84StaticProofConfig(): D84StaticProofConfig | null {
  if (!import.meta.env.DEV || typeof window === "undefined") {
    return null;
  }
  return selectD84StaticProofConfig(window.location.hash);
}

// Recognize only the D8.5 routes needed for landscape comparison and frame-pacing evidence.
export function selectD85LandscapeProofConfig(fragment: string): D85LandscapeProofConfig | null {
  const matches = /^#verify-d85-batched-(shadows-off|restrained-shadows)$/u.exec(fragment);
  if (matches === null) {
    return null;
  }

  return matches[1] === "shadows-off"
    ? { candidate: "batched", shadowPolicy: "off" }
    : { candidate: "batched", shadowPolicy: "restrained" };
}

// Keep the D8.5 proof selection development-only so production cannot request the candidate asset.
export function readD85LandscapeProofConfig(): D85LandscapeProofConfig | null {
  if (!import.meta.env.DEV || typeof window === "undefined") {
    return null;
  }
  return selectD85LandscapeProofConfig(window.location.hash);
}

// Block only narrow portrait viewports; this uses dimensions rather than a fallible device or browser identity.
export function shouldBlockD85PortraitViewport(viewport: ViewportSize): boolean {
  return viewport.width <= D85_NARROW_VIEWPORT_MAX_WIDTH && viewport.height > viewport.width;
}

// Summarize collected browser frame intervals without inventing device-specific GPU timing.
export function summarizeD85FrameIntervals(
  intervals: readonly number[],
): FramePacingSummary | null {
  if (intervals.length === 0) {
    return null;
  }

  const orderedIntervals = [...intervals].sort((first, second) => first - second);
  const percentileIndex = Math.min(
    orderedIntervals.length - 1,
    Math.ceil(orderedIntervals.length * 0.95) - 1,
  );
  const medianIndex = Math.floor(orderedIntervals.length / 2);
  // The non-empty guard above makes both selections present; keep the defensive branch for strict linting.
  const medianMilliseconds = orderedIntervals[medianIndex];
  const p95Milliseconds = orderedIntervals[percentileIndex];
  if (medianMilliseconds === undefined || p95Milliseconds === undefined) {
    return null;
  }

  return {
    frameCount: orderedIntervals.length,
    longFrameCount: orderedIntervals.filter(
      (interval) => interval > D85_LONG_FRAME_THRESHOLD_MILLISECONDS,
    ).length,
    medianMilliseconds,
    p95Milliseconds,
  };
}

// Check for a standard browser WebGL API without creating a second, disposable GPU context.
export function hasUsableGraphicsApi(webgl2Available: boolean, webgl1Available: boolean): boolean {
  return webgl2Available || webgl1Available;
}

// Select one repeatable renderer-isolation stage without exposing a production debug control.
export function readRendererVerificationStage(): RendererVerificationStage {
  const localCheck = readLocalVisualCheck();
  return localCheck?.startsWith("renderer-") === true
    ? (localCheck.slice(-1) as Exclude<RendererVerificationStage, null>)
    : null;
}

// Read capability locally when the browser document is available; non-browser rendering uses fallback.
export function detectGraphicsCapability(): boolean {
  if (typeof document === "undefined") {
    return false;
  }

  if (readLocalVisualCheck() === "fallback") {
    return false;
  }

  // The actual Canvas is the only context authority; its lifecycle reports creation failure and later loss.
  return hasUsableGraphicsApi(
    typeof WebGL2RenderingContext !== "undefined",
    typeof WebGLRenderingContext !== "undefined",
  );
}

// Select a Canvas only for capable browsers, leaving every other visitor with the document fallback.
export function selectExperienceMode(graphicsAvailable: boolean): ExperienceMode {
  return graphicsAvailable ? "canvas" : "fallback";
}

// Keep optional atmosphere still while preserving the visual surface and readable DOM content.
export function shouldAnimateAtmosphere(reducedMotion: boolean): boolean {
  return !reducedMotion;
}
