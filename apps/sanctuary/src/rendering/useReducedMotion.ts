/**
 * File: apps/sanctuary/src/rendering/useReducedMotion.ts
 * Description: Reads and follows the browser reduced-motion preference.
 * Purpose: Prevents nonessential scene motion when a visitor asks for less movement.
 * Notes: The preference is used only in local component state and is never persisted or transmitted.
 */

// Import React hooks only for the local browser preference lifecycle.
import { useEffect, useState } from "react";

import { readLocalVisualCheck } from "./capabilities";

// Report the raw operating-system truth separately so DEV diagnostics can distinguish it from Realm's local proof policy.
export function readSystemReducedMotionPreference(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return true;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Read the media query defensively so a non-browser render remains calm by default.
export function readReducedMotionPreference(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return true;
  }

  // Local proof fragments can verify both intentional still states without changing the operating-system preference.
  const localCheck = readLocalVisualCheck();
  if (localCheck === "reduced-motion") {
    return true;
  }

  if (
    localCheck === "cinematic-motion" ||
    localCheck === "cinematic-failure" ||
    localCheck === "cinematic-unavailable"
  ) {
    return false;
  }

  return readSystemReducedMotionPreference();
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
