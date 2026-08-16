/**
 * File: apps/sanctuary/src/rendering/capabilities.ts
 * Description: Defines local-only graphics capability and rendering-mode decisions.
 * Purpose: Lets the visual layer fall back safely without collecting device or GPU information.
 * Notes: Capability results stay in browser memory and are never sent to a server.
 */

// Model only the one Canvas operation needed to test WebGL availability without reading identifiers.
export interface GraphicsCanvasProbe {
  getContext(contextId: "webgl" | "webgl2"): RenderingContext | null;
}

// Keep visual rendering choices small and explicit for components and tests.
export type ExperienceMode = "canvas" | "fallback";

// Name two fragment-only local checks that make otherwise hardware-dependent paths reproducible.
export type LocalVisualCheck = "fallback" | "reduced-motion" | null;

// Interpret only exact non-transmitted URL fragments and ignore every other value.
export function selectLocalVisualCheck(fragment: string): LocalVisualCheck {
  switch (fragment) {
    case "#verify-fallback":
      return "fallback";
    case "#verify-reduced-motion":
      return "reduced-motion";
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

// Check for a usable standard WebGL context without asking the browser for renderer or device details.
export function hasUsableGraphicsContext(createCanvas: () => GraphicsCanvasProbe): boolean {
  try {
    return (
      createCanvas().getContext("webgl2") !== null || createCanvas().getContext("webgl") !== null
    );
  } catch {
    return false;
  }
}

// Read capability locally when the browser document is available; non-browser rendering uses fallback.
export function detectGraphicsCapability(): boolean {
  if (typeof document === "undefined") {
    return false;
  }

  if (readLocalVisualCheck() === "fallback") {
    return false;
  }

  return hasUsableGraphicsContext(() => document.createElement("canvas"));
}

// Select a Canvas only for capable browsers, leaving every other visitor with the document fallback.
export function selectExperienceMode(graphicsAvailable: boolean): ExperienceMode {
  return graphicsAvailable ? "canvas" : "fallback";
}

// Keep optional atmosphere still while preserving the visual surface and readable DOM content.
export function shouldAnimateAtmosphere(reducedMotion: boolean): boolean {
  return !reducedMotion;
}
