/**
 * File: apps/sanctuary/src/rendering/SanctuaryOrientationGate.tsx
 * Description: Withholds the optional sanctuary Canvas from unsupported portrait or extremely constrained landscape viewports.
 * Purpose: Preserves the approved landscape MVP policy without inspecting a user agent or storing device data.
 * Notes: The gate is semantic DOM content and automatically removes itself when sufficient viewport space returns.
 */

// Import only the local React primitives needed to respond to an ordinary viewport resize.
import { useEffect, useState, type ReactNode } from "react";

import { selectSanctuaryViewportNotice, type SanctuaryViewportNotice } from "./capabilities";
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
  const [notice, setNotice] = useState<SanctuaryViewportNotice>(() =>
    selectSanctuaryViewportNotice(readViewportSize()),
  );

  useEffect(() => {
    // Observe both common browser signals because changing device orientation can expose either one first.
    const updatePresentationState = (): void => {
      setNotice(selectSanctuaryViewportNotice(readViewportSize()));
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

  if (notice.permitsCanvas) {
    return children;
  }

  // Keep the notice practical and quiet: it explains a rendering constraint, not an emotional entry choice.
  return (
    <section
      className="sanctuary-orientation-gate"
      data-sanctuary-orientation-gate={notice.presentation}
      aria-labelledby="orientation-title"
    >
      <section className="sanctuary-orientation-gate__message" aria-labelledby="orientation-title">
        <h2 id="orientation-title">{notice.title}</h2>
        {notice.welcome === null ? null : (
          <p className="sanctuary-orientation-gate__welcome">{notice.welcome}</p>
        )}
        <p>{notice.instruction}</p>
        {notice.supportingCopy === null ? null : (
          <p className="sanctuary-orientation-gate__supporting">{notice.supportingCopy}</p>
        )}
      </section>
    </section>
  );
}
