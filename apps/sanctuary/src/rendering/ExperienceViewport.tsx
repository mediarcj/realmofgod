/**
 * File: apps/sanctuary/src/rendering/ExperienceViewport.tsx
 * Description: Chooses the optional asynchronously loaded visual layer or state-aware local CSS atmosphere.
 * Purpose: Keeps capability and accessibility decisions lightweight before any renderer code is requested.
 * Notes: Capability and motion state stay local; this component performs no network or browser-storage work.
 */

// Import React's local code-splitting helpers without importing the renderer into the initial bundle.
import { Component, lazy, type ReactNode, Suspense, useCallback, useRef, useState } from "react";

import type { JourneyVisualState } from "../journey/model";
import type { RendererFailureReason } from "./CanvasExperience";
import type { CinematicPlaybackHandle } from "./CinematicSanctuaryLayer";
import {
  detectGraphicsCapability,
  readLocalVisualCheck,
  selectExperienceMode,
} from "./capabilities";
import {
  selectVisualProofLayer,
  type CinematicMotionStatus,
  type VisualProofMode,
} from "./hybridProof";
import { useReducedMotion } from "./useReducedMotion";
import { selectVisualAtmosphere } from "./visualAtmosphere";
import { createDefaultVisualCalibration, type VisualCalibration } from "./visualCalibration";

// Defer the renderer module until a capable browser reaches the optional visual layer.
const CanvasExperience = lazy(async () => import("./CanvasExperience"));

// Keep every calibration and local-reference control out of production's module graph and document.
const VisualCalibrationConsole = import.meta.env.DEV
  ? lazy(async () => import("../development/VisualCalibrationConsole"))
  : null;

// Load cinematic proof controls and exact media only for the local comparison, never for a production visitor.
const CinematicSanctuaryLayer = import.meta.env.DEV
  ? lazy(async () => import("./CinematicSanctuaryLayer"))
  : null;
const HybridVisualProofControls = import.meta.env.DEV
  ? lazy(async () => import("../development/HybridVisualProofControls"))
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
  // Start the development-only comparison with media so a fresh cinematic proof does not download R3F first.
  const [visualProofMode, setVisualProofMode] = useState<VisualProofMode>(
    import.meta.env.DEV ? "cinematic" : "realtime",
  );
  const cinematicPlaybackRef = useRef<CinematicPlaybackHandle>(null);
  const [cinematicMotionStatus, setCinematicMotionStatus] =
    useState<CinematicMotionStatus>("loading");
  const reducedMotion = useReducedMotion();
  const fallback = <ExperienceFallback visualState={visualState} />;
  const visualProofLayer = selectVisualProofLayer(visualProofMode, visualState.stage);
  const cinematicActive = CinematicSanctuaryLayer !== null && visualProofLayer === "cinematic";
  const shouldRenderRealtime = !cinematicActive;
  const forceCinematicFailure = readLocalVisualCheck() === "cinematic-failure";
  const forceCinematicUnavailable = readLocalVisualCheck() === "cinematic-unavailable";
  const handleRendererFailure = useCallback((reason: RendererFailureReason | "react-error") => {
    setRendererFailure(reason);
    setRendererState("failed");
  }, []);
  const handleRendererReady = useCallback((api: "webgl1" | "webgl2") => {
    setRendererApi(api);
    setRendererState("ready");
  }, []);
  const handleStartCinematicMotion = useCallback(() => {
    cinematicPlaybackRef.current?.startMotion();
  }, []);
  const handlePauseCinematicMotion = useCallback(() => {
    cinematicPlaybackRef.current?.pauseMotion();
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
  const developmentHybridProofTools =
    HybridVisualProofControls === null ? null : (
      <Suspense fallback={null}>
        <HybridVisualProofControls
          cinematicActive={cinematicActive}
          motionStatus={cinematicMotionStatus}
          onPauseMotion={handlePauseCinematicMotion}
          onStartMotion={handleStartCinematicMotion}
          onVisualProofModeChange={setVisualProofMode}
          visualProofMode={visualProofMode}
        />
      </Suspense>
    );

  if (shouldRenderRealtime && (experienceMode === "fallback" || rendererState === "failed")) {
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
        {developmentHybridProofTools}
      </>
    );
  }

  return (
    <>
      <section
        className="experience-viewport"
        data-reduced-motion={reducedMotion ? "true" : "false"}
        data-renderer-api={rendererApi ?? undefined}
        data-renderer-state={shouldRenderRealtime ? rendererState : "not-requested"}
        data-visual-proof-layer={cinematicActive ? "cinematic" : "realtime"}
        aria-hidden="true"
      >
        {cinematicActive ? (
          <Suspense fallback={null}>
            <CinematicSanctuaryLayer
              active={cinematicActive}
              forceFailure={forceCinematicFailure}
              forceUnavailable={forceCinematicUnavailable}
              onMotionStatusChange={setCinematicMotionStatus}
              reducedMotion={reducedMotion}
              ref={cinematicPlaybackRef}
            />
          </Suspense>
        ) : null}
        {shouldRenderRealtime ? (
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
        ) : null}
      </section>
      {developmentCalibrationTools}
      {developmentHybridProofTools}
    </>
  );
}
