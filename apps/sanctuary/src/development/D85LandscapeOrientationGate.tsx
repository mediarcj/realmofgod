/**
 * File: apps/sanctuary/src/development/D85LandscapeOrientationGate.tsx
 * Description: Provides the local D8.5 orientation gate around the static sanctuary proof route.
 * Purpose: Confirms a narrow portrait phone viewport cannot initialize the optional WebGL proof.
 * Notes: This development-only component uses no storage, network request, tracking, or device identity.
 */

// Import only the React primitives needed to observe local viewport changes and conditionally mount proof content.
import { useEffect, useState, type ReactNode } from "react";

import { shouldBlockD85PortraitViewport } from "../rendering/capabilities";
import "./d85-landscape-orientation-gate.css";

// Read viewport dimensions at the point of use so orientation changes do not require persistence or user-agent sniffing.
function readViewportSize(): { readonly height: number; readonly width: number } {
  return {
    height: window.innerHeight,
    width: window.innerWidth,
  };
}

// Render the actual requested proof only when the current narrow viewport is landscape-shaped.
export function D85LandscapeOrientationGate({
  children,
}: {
  readonly children: ReactNode;
}): ReactNode {
  const [portraitBlocked, setPortraitBlocked] = useState(() =>
    shouldBlockD85PortraitViewport(readViewportSize()),
  );

  useEffect(() => {
    // Recheck both resize and orientation changes because browser support varies across phone platforms.
    const updateOrientationState = (): void => {
      setPortraitBlocked(shouldBlockD85PortraitViewport(readViewportSize()));
    };
    // A dimension check is sufficient when a constrained browser does not expose matchMedia.
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

  // Keep the gate small and semantic: it is a device requirement, not a marketing or spiritual prompt.
  return (
    <main className="d85-orientation-gate" data-d85-orientation-gate="portrait" aria-live="polite">
      <section className="d85-orientation-gate__message" aria-labelledby="d85-orientation-title">
        <h1 id="d85-orientation-title">Rotate your device to continue.</h1>
        <p>The sanctuary is available in landscape orientation on phones.</p>
      </section>
    </main>
  );
}
