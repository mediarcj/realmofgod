/**
 * File: apps/sanctuary/src/rendering/ExperienceViewport.tsx
 * Description: Chooses the optional asynchronously loaded visual layer or state-aware local CSS atmosphere.
 * Purpose: Keeps capability and accessibility decisions lightweight before any renderer code is requested.
 * Notes: Capability and motion state stay local; this component performs no network or browser-storage work.
 */

// Import React's local code-splitting helpers without importing the renderer into the initial bundle.
import { Component, lazy, type ReactNode, Suspense, useCallback, useState } from "react";

import type { JourneyVisualState } from "../journey/model";
import type { RendererFailureReason } from "./CanvasExperience";
import { detectGraphicsCapability, selectExperienceMode } from "./capabilities";
import { useReducedMotion } from "./useReducedMotion";
import { selectVisualAtmosphere } from "./visualAtmosphere";
import { createDefaultVisualCalibration, type VisualCalibration } from "./visualCalibration";

// Defer the renderer module until a capable browser reaches the optional visual layer.
const CanvasExperience = lazy(async () => import("./CanvasExperience"));

// Keep every calibration and local-reference control out of production's module graph and document.
const VisualCalibrationConsole = import.meta.env.DEV
  ? lazy(async () => import("../development/VisualCalibrationConsole"))
  : null;

// Describe the narrow error boundary contract used only to replace an unavailable visual layer.
interface ViewportErrorBoundaryProps {
  readonly children: ReactNode;
  readonly fallback: ReactNode;
  readonly onFailure: (reason: "react-error") => void;
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

  public override componentDidCatch(error: Error): void {
    // Development diagnostics contain no visitor content and make local renderer recovery reproducible.
    if (import.meta.env.DEV) {
      console.error("The local sanctuary renderer entered its safe fallback.", error);
    }
    this.props.onFailure("react-error");
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
  const [rendererState, setRendererState] = useState<"failed" | "ready" | "starting">("starting");
  const [rendererFailure, setRendererFailure] = useState<
    RendererFailureReason | "react-error" | null
  >(null);
  const [rendererApi, setRendererApi] = useState<"webgl1" | "webgl2" | null>(null);
  const [visualCalibration, setVisualCalibration] = useState<VisualCalibration>(
    createDefaultVisualCalibration,
  );
  const reducedMotion = useReducedMotion();
  const fallback = <ExperienceFallback visualState={visualState} />;
  const handleRendererFailure = useCallback((reason: RendererFailureReason | "react-error") => {
    setRendererFailure(reason);
    setRendererState("failed");
  }, []);
  const handleRendererReady = useCallback((api: "webgl1" | "webgl2") => {
    setRendererApi(api);
    setRendererState("ready");
  }, []);
  const developmentCalibrationTools =
    VisualCalibrationConsole === null ? null : (
      <Suspense fallback={null}>
        <VisualCalibrationConsole
          calibration={visualCalibration}
          onCalibrationChange={setVisualCalibration}
        />
      </Suspense>
    );

  if (experienceMode === "fallback" || rendererState === "failed") {
    return (
      <>
        <section
          className="experience-viewport"
          data-reduced-motion={reducedMotion ? "true" : "false"}
          data-renderer-failure={rendererFailure ?? undefined}
          data-renderer-state={experienceMode === "fallback" ? "unavailable" : "failed"}
          aria-hidden="true"
        >
          {fallback}
        </section>
        {developmentCalibrationTools}
      </>
    );
  }

  return (
    <>
      <section
        className="experience-viewport"
        data-reduced-motion={reducedMotion ? "true" : "false"}
        data-renderer-api={rendererApi ?? undefined}
        data-renderer-state={rendererState}
        aria-hidden="true"
      >
        <ViewportErrorBoundary fallback={fallback} onFailure={handleRendererFailure}>
          <Suspense fallback={<ExperienceLoading visualState={visualState} />}>
            <CanvasExperience
              fallback={fallback}
              onRendererFailure={handleRendererFailure}
              onRendererReady={handleRendererReady}
              reducedMotion={reducedMotion}
              visualCalibration={visualCalibration}
              visualState={visualState}
            />
          </Suspense>
        </ViewportErrorBoundary>
      </section>
      {developmentCalibrationTools}
    </>
  );
}
