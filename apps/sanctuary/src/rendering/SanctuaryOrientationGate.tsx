/**
 * File: apps/sanctuary/src/rendering/SanctuaryOrientationGate.tsx
 * Description: Withholds the optional sanctuary Canvas from a narrow phone held in portrait orientation.
 * Purpose: Preserves the approved landscape-only MVP policy without inspecting a user agent or storing device data.
 * Notes: The gate is semantic DOM content and automatically removes itself when the viewport becomes landscape.
 */

// Import only the local React primitives needed to respond to an ordinary viewport resize.
import { useEffect, useState, type ReactNode } from "react";

import { shouldBlockNarrowPortraitViewport } from "./capabilities";
import "./sanctuary-orientation-gate.css";

// Read dimensions defensively so static rendering remains a safe no-Canvas document path.
function readViewportSize(): { readonly height: number; readonly width: number } {
  if (typeof window === "undefined") {
    return { height: 0, width: Number.MAX_SAFE_INTEGER };
  }

  return { height: window.innerHeight, width: window.innerWidth };
}

// Mount children only after the narrow portrait policy permits the decorative renderer to start.
export function SanctuaryOrientationGate({
  children,
}: {
  readonly children: ReactNode;
}): ReactNode {
  const [portraitBlocked, setPortraitBlocked] = useState(() =>
    shouldBlockNarrowPortraitViewport(readViewportSize()),
  );

  useEffect(() => {
    // Observe both common browser signals because changing device orientation can expose either one first.
    const updateOrientationState = (): void => {
      setPortraitBlocked(shouldBlockNarrowPortraitViewport(readViewportSize()));
    };
    const portraitMediaQuery =
      typeof window.matchMedia === "function" ? window.matchMedia("(orientation: portrait)") : null;

    window.addEventListener("resize", updateOrientationState);
    portraitMediaQuery?.addEventListener("change", updateOrientationState);
    updateOrientationState();

    return () => {
      window.removeEventListener("resize", updateOrientationState);
      portraitMediaQuery?.removeEventListener("change", updateOrientationState);
    };
  }, []);

  if (!portraitBlocked) {
    return children;
  }

  // Keep the notice practical and quiet: it explains a rendering constraint, not an emotional entry choice.
  return (
    <main className="sanctuary-orientation-gate" data-sanctuary-orientation-gate="portrait">
      <section className="sanctuary-orientation-gate__message" aria-labelledby="orientation-title">
        <h1 id="orientation-title">Turn your phone sideways to enter the sanctuary.</h1>
        <p>The sanctuary is available in landscape orientation on phones.</p>
      </section>
    </main>
  );
}
