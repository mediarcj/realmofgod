/**
 * File: apps/sanctuary/src/rendering/SanctuaryOrientationGate.tsx
 * Description: Withholds the optional sanctuary Canvas from unsupported portrait or extremely constrained landscape viewports.
 * Purpose: Preserves the approved landscape MVP policy without inspecting a user agent or storing device data.
 * Notes: The gate is semantic DOM content and automatically removes itself when sufficient viewport space returns.
 */

// Import only the local React primitives needed to respond to an ordinary viewport resize.
import { useEffect, useState, type ReactNode } from "react";

import {
  selectSanctuaryViewportPresentation,
  type SanctuaryViewportPresentation,
} from "./capabilities";
import "./sanctuary-orientation-gate.css";

// Read dimensions defensively so static rendering remains a safe no-Canvas document path.
function readViewportSize(): { readonly height: number; readonly width: number } {
  if (typeof window === "undefined") {
    // Keep server and unit-test rendering on the normal semantic path because no actual viewport has been measured.
    return { height: Number.MAX_SAFE_INTEGER, width: Number.MAX_SAFE_INTEGER };
  }

  return { height: window.innerHeight, width: window.innerWidth };
}

// Mount children only after the narrow portrait policy permits the decorative renderer to start.
export function SanctuaryOrientationGate({
  children,
}: {
  readonly children: ReactNode;
}): ReactNode {
  const [presentation, setPresentation] = useState<SanctuaryViewportPresentation>(() =>
    selectSanctuaryViewportPresentation(readViewportSize()),
  );

  useEffect(() => {
    // Observe both common browser signals because changing device orientation can expose either one first.
    const updatePresentationState = (): void => {
      setPresentation(selectSanctuaryViewportPresentation(readViewportSize()));
    };
    const portraitMediaQuery =
      typeof window.matchMedia === "function" ? window.matchMedia("(orientation: portrait)") : null;

    window.addEventListener("resize", updatePresentationState);
    portraitMediaQuery?.addEventListener("change", updatePresentationState);
    updatePresentationState();

    return () => {
      window.removeEventListener("resize", updatePresentationState);
      portraitMediaQuery?.removeEventListener("change", updatePresentationState);
    };
  }, []);

  if (presentation === "scene") {
    return children;
  }

  // Keep the notice practical and quiet: it explains a rendering constraint, not an emotional entry choice.
  return (
    <main className="sanctuary-orientation-gate" data-sanctuary-orientation-gate={presentation}>
      <section className="sanctuary-orientation-gate__message" aria-labelledby="orientation-title">
        <h1 id="orientation-title">
          {presentation === "portrait"
            ? "Turn your phone sideways to enter the sanctuary."
            : "Make the sanctuary window a little larger to enter."}
        </h1>
        <p>
          {presentation === "portrait"
            ? "The sanctuary is available in landscape orientation on phones."
            : "The quiet room will return when there is enough landscape space for its fixed composition."}
        </p>
      </section>
    </main>
  );
}
