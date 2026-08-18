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
