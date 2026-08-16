/**
 * File: apps/sanctuary/src/rendering/ExperienceViewport.tsx
 * Description: Chooses the optional asynchronously loaded visual layer or state-aware local CSS atmosphere.
 * Purpose: Keeps capability and accessibility decisions lightweight before any renderer code is requested.
 * Notes: Capability and motion state stay local; this component performs no network or browser-storage work.
 */

// Import React's local code-splitting helpers without importing the renderer into the initial bundle.
import { Component, lazy, type ReactNode, Suspense, useState } from "react";

import type { JourneyVisualState } from "../journey/model";
import { detectGraphicsCapability, selectExperienceMode } from "./capabilities";
import { useReducedMotion } from "./useReducedMotion";
import { selectVisualAtmosphere } from "./visualAtmosphere";

// Defer the renderer module until a capable browser reaches the optional visual layer.
const CanvasExperience = lazy(async () => import("./CanvasExperience"));

// Describe the narrow error boundary contract used only to replace an unavailable visual layer.
interface ViewportErrorBoundaryProps {
  readonly children: ReactNode;
  readonly fallback: ReactNode;
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
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

// Offer a stage-aware local surface when Canvas cannot be used; all meaning remains in the DOM above it.
export function ExperienceFallback({
  visualState,
}: {
  readonly visualState: JourneyVisualState;
}): ReactNode {
  const atmosphere = selectVisualAtmosphere(visualState);
  const choiceClass =
    visualState.choice === null ? "" : ` experience-fallback--${visualState.choice}`;

  return (
    <div
      className={`experience-fallback experience-fallback--${atmosphere}${choiceClass}`}
      data-atmosphere={atmosphere}
      aria-hidden="true"
    />
  );
}

// Keep asynchronous renderer loading visually quiet because the semantic document is already available.
export function ExperienceLoading({
  visualState,
}: {
  readonly visualState: JourneyVisualState;
}): ReactNode {
  return <ExperienceFallback visualState={visualState} />;
}

// Keep capability selection local and forward only the minimal read-only visual projection.
export function ExperienceViewport({
  visualState,
}: {
  readonly visualState: JourneyVisualState;
}): ReactNode {
  const [experienceMode] = useState(() => selectExperienceMode(detectGraphicsCapability()));
  const reducedMotion = useReducedMotion();
  const fallback = <ExperienceFallback visualState={visualState} />;

  if (experienceMode === "fallback") {
    return (
      <section className="experience-viewport" aria-hidden="true">
        {fallback}
      </section>
    );
  }

  return (
    <section className="experience-viewport" aria-hidden="true">
      <ViewportErrorBoundary fallback={fallback}>
        <Suspense fallback={<ExperienceLoading visualState={visualState} />}>
          <CanvasExperience reducedMotion={reducedMotion} visualState={visualState} />
        </Suspense>
      </ViewportErrorBoundary>
    </section>
  );
}
