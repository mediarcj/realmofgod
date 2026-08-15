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

  return hasUsableGraphicsContext(() => document.createElement("canvas"));
}

// Select a Canvas only for capable browsers, leaving every other visitor with the document fallback.
export function selectExperienceMode(graphicsAvailable: boolean): ExperienceMode {
  return graphicsAvailable ? "canvas" : "fallback";
}

// Keep reduced-motion scenes still while preserving the visual surface and readable DOM content.
export function shouldAnimateProofScene(reducedMotion: boolean): boolean {
  return !reducedMotion;
}
