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

// Describe the local-only candidate choices without making any candidate available to a production visitor.
export type StaticSanctuaryCandidate = "baseline" | "batched" | "final-art" | "raw";

// Keep the older proof offsets separate from the D9 authored scene, whose GLB transforms are the source of truth.
export type StaticSanctuaryTransformPolicy = "legacy-calibrated" | "preserve-authored";

// Share the narrow static-scene contract across the historical checks, D9 root, and D9.0A.1 inspection routes.
export interface StaticSanctuaryProofConfig {
  readonly candidate: StaticSanctuaryCandidate;
  readonly shadowPolicy: "off" | "current" | "restrained";
  readonly transformPolicy: StaticSanctuaryTransformPolicy;
}

// Retain the D8.4 check's original candidate options and transform behavior for its explicit comparison fragments.
export interface D84StaticProofConfig extends StaticSanctuaryProofConfig {
  readonly candidate: "baseline" | "batched";
}

// Describe the D8.5 continuation route, which intentionally measures only the accepted batched candidate.
export interface D85LandscapeProofConfig {
  readonly candidate: "batched";
  readonly shadowPolicy: "off" | "restrained";
  readonly transformPolicy: "legacy-calibrated";
}

// Describe the normal visitor selection: final art is the only production sanctuary candidate.
export interface D9VisitorSanctuaryConfig {
  readonly candidate: "final-art";
  readonly shadowPolicy: "restrained";
  readonly transformPolicy: "preserve-authored";
}

// Describe the D9.0A.1 local forensic routes, which compare immutable raw and batched assets without becoming product controls.
export interface D91InspectionConfig extends StaticSanctuaryProofConfig {
  readonly candidate: "batched" | "raw";
  readonly framingPolicy: "horizontal" | "stable-vertical";
}

// Describe the D9.0A.2 quality inspection separately so ordinary visitors cannot select a raw local asset.
export interface D92QualityInspectionConfig extends StaticSanctuaryProofConfig {
  readonly candidate: "batched" | "raw";
  readonly framingPolicy: "horizontal" | "stable-vertical";
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

// Withhold the expensive decorative Canvas only when browser zoom leaves too little practical landscape area for the locked frame.
export const D91_CONSTRAINED_LANDSCAPE_MIN_HEIGHT = 240;
export const D91_CONSTRAINED_LANDSCAPE_MIN_WIDTH = 480;

// Name the three presentation outcomes without storing a device identity or a browser zoom preference.
export type SanctuaryViewportPresentation = "constrained" | "portrait" | "scene";

// Describe the DOM-only presentation boundary so both the React gate and focused tests use one exact policy.
export interface SanctuaryViewportNotice {
  readonly instruction: string | null;
  readonly permitsCanvas: boolean;
  readonly presentation: SanctuaryViewportPresentation;
  readonly supportingCopy: string | null;
  readonly title: string | null;
  readonly welcome: string | null;
}

// Use a 30fps threshold only to flag a long presentation interval, not to claim a GPU benchmark.
export const D85_LONG_FRAME_THRESHOLD_MILLISECONDS = 1000 / 30;

// Hold the D9 root selection as data so tests can distinguish the visitor path from explicit diagnostics.
const d9VisitorSanctuaryConfig: D9VisitorSanctuaryConfig = {
  candidate: "final-art",
  shadowPolicy: "restrained",
  transformPolicy: "preserve-authored",
};

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

// Reserve one explicit fragment for the legacy local comparison controls; the normal root never enables them.
export function selectLocalDiagnosticRoute(fragment: string): boolean {
  return fragment === "#diagnostic-hf01";
}

// Read the local diagnostic route only in development so it cannot become a production visitor control.
export function readLocalDiagnosticRoute(): boolean {
  return import.meta.env.DEV && typeof window !== "undefined"
    ? selectLocalDiagnosticRoute(window.location.hash)
    : false;
}

// Keep the final-art D9 scene present for the ordinary root and the existing reduced-motion proof, while all other local checks stay isolated.
export function selectD9VisitorSanctuaryConfig(fragment: string): D9VisitorSanctuaryConfig | null {
  return fragment === "" || fragment === "#verify-reduced-motion" ? d9VisitorSanctuaryConfig : null;
}

// Production and ordinary local visitors share the approved final-art candidate; only explicit diagnostic routes remain development-only.
export function readD9VisitorSanctuaryConfig(): D9VisitorSanctuaryConfig | null {
  if (typeof window === "undefined") {
    return null;
  }
  return import.meta.env.DEV
    ? selectD9VisitorSanctuaryConfig(window.location.hash)
    : d9VisitorSanctuaryConfig;
}

// Reserve explicit forensic paths for the D9.0A.1 comparison; an ordinary visitor never reaches the immutable raw asset.
export function selectD91InspectionConfig(fragment: string): D91InspectionConfig | null {
  const matches =
    /^#inspect-d91-(raw|batched)-(horizontal|stable-vertical)-(shadows-off|restrained-shadows)$/u.exec(
      fragment,
    );
  if (matches === null) {
    return null;
  }

  const [, candidate, framingPolicy, shadow] = matches;
  if (
    (candidate !== "raw" && candidate !== "batched") ||
    (framingPolicy !== "horizontal" && framingPolicy !== "stable-vertical")
  ) {
    return null;
  }

  return {
    candidate,
    framingPolicy,
    shadowPolicy: shadow === "shadows-off" ? "off" : "restrained",
    transformPolicy: "preserve-authored",
  };
}

// Keep the raw-versus-batched inspection entirely in the development module graph.
export function readD91InspectionConfig(): D91InspectionConfig | null {
  if (!import.meta.env.DEV || typeof window === "undefined") {
    return null;
  }
  return selectD91InspectionConfig(window.location.hash);
}

// Reserve explicit quality-inspection fragments for comparing raw and batched candidates after antialiasing is active.
export function selectD92QualityInspectionConfig(
  fragment: string,
): D92QualityInspectionConfig | null {
  const matches =
    /^#inspect-d92-quality-(raw|batched)-(horizontal|stable-vertical)-restrained-shadows$/u.exec(
      fragment,
    );
  if (matches === null) {
    return null;
  }

  const [, candidate, framingPolicy] = matches;
  if (
    (candidate !== "raw" && candidate !== "batched") ||
    (framingPolicy !== "horizontal" && framingPolicy !== "stable-vertical")
  ) {
    return null;
  }

  return {
    candidate,
    framingPolicy,
    shadowPolicy: "restrained",
    transformPolicy: "preserve-authored",
  };
}

// Keep high-quality forensic inspection in the development bundle and behind an exact local fragment.
export function readD92QualityInspectionConfig(): D92QualityInspectionConfig | null {
  if (!import.meta.env.DEV || typeof window === "undefined") {
    return null;
  }
  return selectD92QualityInspectionConfig(window.location.hash);
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
      return { candidate, shadowPolicy: "off", transformPolicy: "legacy-calibrated" };
    case "current-shadows":
      return { candidate, shadowPolicy: "current", transformPolicy: "legacy-calibrated" };
    case "restrained-shadows":
      return { candidate, shadowPolicy: "restrained", transformPolicy: "legacy-calibrated" };
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
    ? { candidate: "batched", shadowPolicy: "off", transformPolicy: "legacy-calibrated" }
    : { candidate: "batched", shadowPolicy: "restrained", transformPolicy: "legacy-calibrated" };
}

// Keep the D8.5 proof selection development-only so production cannot request the candidate asset.
export function readD85LandscapeProofConfig(): D85LandscapeProofConfig | null {
  if (!import.meta.env.DEV || typeof window === "undefined") {
    return null;
  }
  return selectD85LandscapeProofConfig(window.location.hash);
}

// Block only narrow portrait viewports; this uses dimensions rather than a fallible device or browser identity.
export function shouldBlockNarrowPortraitViewport(viewport: ViewportSize): boolean {
  return viewport.width <= D85_NARROW_VIEWPORT_MAX_WIDTH && viewport.height > viewport.width;
}

// Keep normal landscape running while offering a calm non-Canvas state when effective browser space becomes too small.
export function selectSanctuaryViewportPresentation(
  viewport: ViewportSize,
): SanctuaryViewportPresentation {
  if (shouldBlockNarrowPortraitViewport(viewport)) {
    return "portrait";
  }
  if (
    viewport.width < D91_CONSTRAINED_LANDSCAPE_MIN_WIDTH ||
    viewport.height < D91_CONSTRAINED_LANDSCAPE_MIN_HEIGHT
  ) {
    return "constrained";
  }
  return "scene";
}

// Keep portrait and constrained-landscape guidance distinct while allowing sufficient landscape space to mount Canvas.
export function selectSanctuaryViewportNotice(viewport: ViewportSize): SanctuaryViewportNotice {
  const presentation = selectSanctuaryViewportPresentation(viewport);

  if (presentation === "portrait") {
    return {
      instruction: "Turn your phone sideways to enter.",
      permitsCanvas: false,
      presentation,
      supportingCopy: "The sanctuary opens in landscape orientation.",
      title: "Realm of God",
      welcome: "Welcome to the sanctuary.",
    };
  }

  if (presentation === "constrained") {
    return {
      instruction: "Zoom out or enlarge this browser window to continue.",
      permitsCanvas: false,
      presentation,
      supportingCopy: null,
      title: "The sanctuary needs a little more viewing space.",
      welcome: null,
    };
  }

  return {
    instruction: null,
    permitsCanvas: true,
    presentation,
    supportingCopy: null,
    title: null,
    welcome: null,
  };
}

// Preserve the D8.5 helper name for its focused proof tests while D9 uses the product-neutral policy name.
export function shouldBlockD85PortraitViewport(viewport: ViewportSize): boolean {
  return shouldBlockNarrowPortraitViewport(viewport);
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
