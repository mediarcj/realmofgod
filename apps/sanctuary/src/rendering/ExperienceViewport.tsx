/**
 * File: apps/sanctuary/src/rendering/ExperienceViewport.tsx
 * Description: Chooses the optional asynchronously loaded visual layer or local DOM fallback beside the sanctuary document.
 * Purpose: Keeps capability and accessibility decisions lightweight before any renderer code is requested.
 * Notes: Capability and motion state stay local; this component performs no network or browser-storage work.
 */

// Import React's local code-splitting helpers without importing the renderer into the initial bundle.
import { Component, lazy, type ReactNode, Suspense, useState } from "react";

import { detectGraphicsCapability, selectExperienceMode } from "./capabilities";
import { useReducedMotion } from "./useReducedMotion";

// Defer the renderer module until a capable browser reaches the optional visual layer.
const CanvasExperience = lazy(async () => import("./CanvasExperience"));

// Describe the narrow error boundary contract used only to replace an unavailable visual layer.
interface ViewportErrorBoundaryProps {
  readonly children: ReactNode;
}

interface ViewportErrorBoundaryState {
  readonly failed: boolean;
}

// Keep a Canvas initialization failure from taking down the primary semantic document.
class ViewportErrorBoundary extends Component<
  ViewportErrorBoundaryProps,
  ViewportErrorBoundaryState
> {
  public override state: ViewportErrorBoundaryState = { failed: false };

  public static getDerivedStateFromError(): ViewportErrorBoundaryState {
    return { failed: true };
  }

  public override render(): ReactNode {
    return this.state.failed ? <ExperienceFallback /> : this.props.children;
  }
}

// Offer a calm visual surface when Canvas cannot be used; document content remains outside this decoration.
export function ExperienceFallback(): ReactNode {
  return (
    <div className="experience-fallback" aria-hidden="true">
      <p>A still clearing remains here for this visit.</p>
    </div>
  );
}

// Keep asynchronous renderer loading visually quiet because the semantic document is already available.
export function ExperienceLoading(): ReactNode {
  return <ExperienceFallback />;
}

// Keep capability selection local and let reduced motion retain a still version of the same proof scene.
export function ExperienceViewport(): ReactNode {
  const [experienceMode] = useState(() => selectExperienceMode(detectGraphicsCapability()));
  const reducedMotion = useReducedMotion();

  if (experienceMode === "fallback") {
    return (
      <section className="experience-viewport" aria-label="Optional sanctuary environment">
        <ExperienceFallback />
      </section>
    );
  }

  return (
    <section className="experience-viewport" aria-label="Optional sanctuary environment">
      <ViewportErrorBoundary>
        <Suspense fallback={<ExperienceLoading />}>
          <CanvasExperience reducedMotion={reducedMotion} />
        </Suspense>
      </ViewportErrorBoundary>
    </section>
  );
}
