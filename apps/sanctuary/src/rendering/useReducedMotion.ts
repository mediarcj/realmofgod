/**
 * File: apps/sanctuary/src/rendering/useReducedMotion.ts
 * Description: Reads and follows the browser reduced-motion preference.
 * Purpose: Prevents nonessential scene motion when a visitor asks for less movement.
 * Notes: The preference is used only in local component state and is never persisted or transmitted.
 */

// Import React hooks only for the local browser preference lifecycle.
import { useEffect, useState } from "react";

import { readLocalVisualCheck } from "./capabilities";

// Read the media query defensively so a non-browser render remains calm by default.
export function readReducedMotionPreference(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return true;
  }

  if (readLocalVisualCheck() === "reduced-motion") {
    return true;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Follow a visitor's live operating-system preference without writing it to browser storage.
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(readReducedMotionPreference);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = (): void => {
      // Preserve the exact development check while still following live visitor preference changes.
      setReducedMotion(readReducedMotionPreference());
    };

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);

    return () => {
      mediaQuery.removeEventListener("change", updatePreference);
    };
  }, []);

  return reducedMotion;
}
