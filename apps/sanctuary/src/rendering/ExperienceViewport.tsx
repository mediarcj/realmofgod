/**
 * File: apps/sanctuary/src/rendering/ExperienceViewport.tsx
 * Description: Chooses the optional asynchronously loaded visual layer or state-aware local CSS atmosphere.
 * Purpose: Keeps capability and accessibility decisions lightweight before any renderer code is requested.
 * Notes: Capability and motion state stay local; this component performs no network or browser-storage work.
 */

// Import React's local code-splitting helpers without importing the renderer into the initial bundle.
import { Component, lazy, type ReactNode, Suspense, useCallback, useRef, useState } from "react";

import type { JourneyVisualState } from "../journey/model";
import type { SanctuaryMvpAction, SanctuaryMvpState } from "../sanctuary/model";
import {
  d9DevelopmentReading,
  selectD9DevelopmentReflection,
} from "../sanctuary/developmentReading";
import type { RendererFailureReason } from "./CanvasExperience";
import type { D9AmbientCameraDiagnosticSnapshot } from "./D9AmbientCameraGlance";
import type { D9AffordanceDiagnosticSnapshot } from "./D9EnvironmentalAffordances";
import type { D9DomInteractionTarget, D9DomInteractionVisualState } from "./d9DomInteractionTarget";
import { createD9PageMatrix3d, type D9ReadingPageQuad } from "./d9ReadingPageGeometry";
import type { D9ReadingPageLayout } from "./D9ReadingPageProjection";
import type { CinematicPlaybackHandle } from "./CinematicSanctuaryLayer";
import {
  detectGraphicsCapability,
  readD9AffordanceDiagnostic,
  readD9VisitorSanctuaryConfig,
  readD84StaticProofConfig,
  readD85LandscapeProofConfig,
  readD91InspectionConfig,
  readD92QualityInspectionConfig,
  readLocalDiagnosticRoute,
  readLocalVisualCheck,
  selectExperienceMode,
} from "./capabilities";
import {
  selectVisualProofLayer,
  type CinematicMotionStatus,
  type VisualProofMode,
} from "./hybridProof";
import { readSystemReducedMotionPreference, useReducedMotion } from "./useReducedMotion";
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

// Build the local proof marker only when development code requests the comparison route.
const d84ProofAttributeName = ["data", "d84", "static", "proof"].join("-");
const d85ProofAttributeName = ["data", "d85", "landscape", "proof"].join("-");
const d91InspectionAttributeName = ["data", "d91", "inspection"].join("-");

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

// Keep page placement in a narrow DOM-only helper so future readings can replace fixture content without changing Canvas.
function D9PageText({
  children,
  diagnosticsEnabled,
  page,
}: {
  readonly children: ReactNode;
  readonly diagnosticsEnabled: boolean;
  readonly page: D9ReadingPageQuad;
}): ReactNode {
  return (
    <article
      className={`d9-reading-page${diagnosticsEnabled ? " d9-reading-page--diagnostic" : ""}`}
      data-d9-reading-page-root={page.semanticRoot}
      style={{
        height: page.sourceHeight,
        transform: createD9PageMatrix3d(page),
        width: page.sourceWidth,
      }}
    >
      {children}
    </article>
  );
}

// Render only clearly labeled fixture content during D9.0B.2; no source text is represented as Scripture here.
export function D9ReadingSurface({
  diagnosticsEnabled = false,
  layout,
  onLetsPray,
}: {
  readonly diagnosticsEnabled?: boolean;
  readonly layout: D9ReadingPageLayout;
  readonly onLetsPray: () => void;
}): ReactNode {
  return (
    <section
      aria-label="Development reading surface"
      className="d9-reading-surface"
      data-d9-reading-surface="true"
    >
      <D9PageText diagnosticsEnabled={diagnosticsEnabled} page={layout.leftPage}>
        <p className="d9-reading-fixture">Development layout fixture — not Scripture</p>
        <p className="d9-reading-reference">{d9DevelopmentReading.reference}</p>
        <p className="d9-reading-copy">{d9DevelopmentReading.leftPage}</p>
      </D9PageText>
      <D9PageText diagnosticsEnabled={diagnosticsEnabled} page={layout.rightPage}>
        <p className="d9-reading-source">{d9DevelopmentReading.translationOrSource}</p>
        <p className="d9-reading-copy">{d9DevelopmentReading.rightPage}</p>
        <button
          aria-label="Let us pray from this development reading"
          className="d9-reading-action"
          onClick={onLetsPray}
          type="button"
        >
          Let&apos;s pray
        </button>
      </D9PageText>
    </section>
  );
}

// Keep READ recoverable when page-perspective registration is unavailable; this is deliberately labeled development content.
export function D9ReadingFallback({ onLetsPray }: { readonly onLetsPray: () => void }): ReactNode {
  return (
    <section
      aria-label="Development reading fallback"
      className="d9-reading-surface d9-reading-surface--fallback"
      data-d9-reading-fallback="true"
    >
      <p className="d9-reading-fixture">
        Development reading overlay unavailable — the sanctuary reading journey remains available.
      </p>
      <button
        aria-label="Let us pray from the development reading fallback"
        className="d9-reading-action"
        onClick={onLetsPray}
        type="button"
      >
        Let&apos;s pray
      </button>
    </section>
  );
}

// Render the sole visible-object action as a bounded semantic DOM button rather than a Canvas raycast proxy.
export function D9ProjectedInteractionTarget({
  onInteraction,
  onVisualStateChange,
  target,
}: {
  readonly onInteraction: (action: SanctuaryMvpAction) => void;
  readonly onVisualStateChange: (state: D9DomInteractionVisualState) => void;
  readonly target: D9DomInteractionTarget;
}): ReactNode {
  const { screenBounds } = target;

  return (
    <button
      aria-label={target.ariaLabel}
      className="d9-projected-interaction-target"
      data-d9-dom-interaction-target={target.semanticRoot}
      data-d9-dom-interaction-target-key={target.key}
      onBlur={() => {
        onVisualStateChange("idle");
      }}
      onClick={() => {
        onInteraction(target.action);
      }}
      onFocus={() => {
        onVisualStateChange("focused");
      }}
      onPointerEnter={() => {
        onVisualStateChange("hovered");
      }}
      onPointerLeave={() => {
        onVisualStateChange("idle");
      }}
      style={{
        height: `${screenBounds.height.toString()}px`,
        left: `${screenBounds.left.toString()}px`,
        top: `${screenBounds.top.toString()}px`,
        width: `${screenBounds.width.toString()}px`,
      }}
      type="button"
    >
      <span>{target.ariaLabel}</span>
    </button>
  );
}

// Keep reflection content visible and semantic while a later reviewed content pass decides any real reading material.
export function D9ReflectionSurface({ onReturn }: { readonly onReturn: () => void }): ReactNode {
  const reflection = selectD9DevelopmentReflection(d9DevelopmentReading.relatedPrayerContentId);
  return (
    <section
      aria-label="Development reflection"
      className="d9-reflection-surface"
      data-d9-reflection-surface="true"
    >
      <p className="d9-reflection-fixture">
        Development reflection fixture — not spiritual guidance
      </p>
      <h2>{reflection.title}</h2>
      <p>{reflection.body}</p>
      <button className="d9-reflection-action" onClick={onReturn} type="button">
        Return to sanctuary
      </button>
    </section>
  );
}

// Keep capability selection local and forward only the minimal read-only visual projection.
export function ExperienceViewport({
  onSanctuaryInteraction,
  sanctuaryState,
  visualState,
}: {
  readonly onSanctuaryInteraction?: ((action: SanctuaryMvpAction) => void) | undefined;
  readonly sanctuaryState?: SanctuaryMvpState | undefined;
  readonly visualState: JourneyVisualState;
}): ReactNode {
  const viewportContent = (
    <ExperienceViewportContent
      onSanctuaryInteraction={onSanctuaryInteraction}
      sanctuaryState={sanctuaryState}
      visualState={visualState}
    />
  );

  // SanctuaryShell owns the one shared viewport gate before this visual component can initialize a Canvas.
  return viewportContent;
}

// Keep the normal viewport behavior together while the D8.5 wrapper decides whether this subtree may mount.
function ExperienceViewportContent({
  onSanctuaryInteraction,
  sanctuaryState,
  visualState,
}: {
  readonly onSanctuaryInteraction?: ((action: SanctuaryMvpAction) => void) | undefined;
  readonly sanctuaryState?: SanctuaryMvpState | undefined;
  readonly visualState: JourneyVisualState;
}): ReactNode {
  const d9VisitorConfig = import.meta.env.DEV ? readD9VisitorSanctuaryConfig() : null;
  const affordanceDiagnosticsActive = import.meta.env.DEV && readD9AffordanceDiagnostic();
  const d84StaticProofConfig = import.meta.env.DEV ? readD84StaticProofConfig() : null;
  const d85LandscapeProofConfig = import.meta.env.DEV ? readD85LandscapeProofConfig() : null;
  const d91InspectionConfig = import.meta.env.DEV ? readD91InspectionConfig() : null;
  const d92QualityInspectionConfig = import.meta.env.DEV ? readD92QualityInspectionConfig() : null;
  const diagnosticRouteActive = import.meta.env.DEV && readLocalDiagnosticRoute();
  const staticProofActive =
    d9VisitorConfig !== null ||
    d84StaticProofConfig !== null ||
    d85LandscapeProofConfig !== null ||
    d91InspectionConfig !== null ||
    d92QualityInspectionConfig !== null;
  const d84ProofAttributes =
    import.meta.env.DEV && d84StaticProofConfig !== null ? { [d84ProofAttributeName]: "true" } : {};
  const d85ProofAttributes =
    import.meta.env.DEV && d85LandscapeProofConfig !== null
      ? { [d85ProofAttributeName]: "true" }
      : {};
  const d91InspectionAttributes =
    import.meta.env.DEV && d91InspectionConfig !== null
      ? { [d91InspectionAttributeName]: d91InspectionConfig.candidate }
      : {};
  const d92QualityInspectionAttributes =
    import.meta.env.DEV && d92QualityInspectionConfig !== null
      ? { ["data-d92-quality-inspection"]: d92QualityInspectionConfig.candidate }
      : {};
  const [experienceMode] = useState(() => selectExperienceMode(detectGraphicsCapability()));
  const [rendererState, setRendererState] = useState<"failed" | "ready" | "starting">("starting");
  const [rendererFailure, setRendererFailure] = useState<
    RendererFailureReason | "react-error" | null
  >(null);
  const [rendererApi, setRendererApi] = useState<"webgl1" | "webgl2" | null>(null);
  const [affordanceDiagnostics, setAffordanceDiagnostics] =
    useState<D9AffordanceDiagnosticSnapshot | null>(null);
  const [ambientCameraDiagnostics, setAmbientCameraDiagnostics] =
    useState<D9AmbientCameraDiagnosticSnapshot | null>(null);
  const [readingPageLayout, setReadingPageLayout] = useState<D9ReadingPageLayout | null>(null);
  const [domInteractionTarget, setDomInteractionTarget] = useState<D9DomInteractionTarget | null>(
    null,
  );
  const [interactionVisualState, setInteractionVisualState] =
    useState<D9DomInteractionVisualState>("idle");
  const [diagnosticMotionOverride, setDiagnosticMotionOverride] = useState(false);
  const [visualCalibration, setVisualCalibration] = useState<VisualCalibration>(
    createDefaultVisualCalibration,
  );
  // Start the development-only comparison with media so a fresh cinematic proof does not download R3F first.
  const [visualProofMode, setVisualProofMode] = useState<VisualProofMode>(
    diagnosticRouteActive && !staticProofActive ? "cinematic" : "realtime",
  );
  const cinematicPlaybackRef = useRef<CinematicPlaybackHandle>(null);
  const [cinematicMotionStatus, setCinematicMotionStatus] =
    useState<CinematicMotionStatus>("loading");
  const reducedMotion = useReducedMotion();
  const systemReducedMotion = readSystemReducedMotionPreference();
  const fallback = <ExperienceFallback visualState={visualState} />;
  const visualProofLayer = selectVisualProofLayer(visualProofMode, visualState.stage);
  const cinematicActive =
    !staticProofActive && CinematicSanctuaryLayer !== null && visualProofLayer === "cinematic";
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
  const handleReadingPageLayoutChange = useCallback((layout: D9ReadingPageLayout | null) => {
    setReadingPageLayout(layout);
  }, []);
  const handleDomInteractionTargetChange = useCallback((target: D9DomInteractionTarget | null) => {
    // A target replacement can happen before pointer-leave, so return the local cue to its resting warmth atomically.
    setInteractionVisualState("idle");
    setDomInteractionTarget(target);
  }, []);
  const enterPrayerFromReading = useCallback(() => {
    onSanctuaryInteraction?.("ENTER_PRAYER");
  }, [onSanctuaryInteraction]);
  const returnToSanctuaryFromReflection = useCallback(() => {
    onSanctuaryInteraction?.("RETURN_TO_SANCTUARY");
  }, [onSanctuaryInteraction]);
  const handleStartCinematicMotion = useCallback(() => {
    cinematicPlaybackRef.current?.startMotion();
  }, []);
  const handlePauseCinematicMotion = useCallback(() => {
    cinematicPlaybackRef.current?.pauseMotion();
  }, []);
  const developmentCalibrationTools =
    !diagnosticRouteActive || staticProofActive || VisualCalibrationConsole === null ? null : (
      <Suspense fallback={null}>
        <VisualCalibrationConsole
          calibration={visualCalibration}
          onCalibrationChange={setVisualCalibration}
        />
      </Suspense>
    );
  const developmentHybridProofTools =
    !diagnosticRouteActive || staticProofActive || HybridVisualProofControls === null ? null : (
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
          data-sanctuary-environmental-interaction={
            d9VisitorConfig !== null && sanctuaryState !== undefined ? "true" : undefined
          }
          data-sanctuary-visitor-path={d9VisitorConfig !== null ? "d9-static-candidate" : undefined}
          {...d84ProofAttributes}
          {...d85ProofAttributes}
          {...d91InspectionAttributes}
          {...d92QualityInspectionAttributes}
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
        data-sanctuary-environmental-interaction={
          d9VisitorConfig !== null && sanctuaryState !== undefined ? "true" : undefined
        }
        data-sanctuary-visitor-path={d9VisitorConfig !== null ? "d9-static-candidate" : undefined}
        data-visual-proof-layer={cinematicActive ? "cinematic" : "realtime"}
        {...d84ProofAttributes}
        {...d85ProofAttributes}
        {...d91InspectionAttributes}
        {...d92QualityInspectionAttributes}
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
                affordanceDiagnosticsEnabled={affordanceDiagnosticsActive}
                fallback={fallback}
                onAffordanceDiagnosticChange={setAffordanceDiagnostics}
                onAmbientCameraDiagnosticChange={setAmbientCameraDiagnostics}
                onInteractionTargetChange={handleDomInteractionTargetChange}
                onReadingPageLayoutChange={handleReadingPageLayoutChange}
                onRendererFailure={handleRendererFailure}
                onRendererReady={handleRendererReady}
                diagnosticMotionOverride={affordanceDiagnosticsActive && diagnosticMotionOverride}
                interactionVisualState={interactionVisualState}
                reducedMotion={reducedMotion}
                systemReducedMotion={systemReducedMotion}
                sanctuaryState={sanctuaryState}
                visualCalibration={visualCalibration}
                visualState={visualState}
              />
            </Suspense>
          </ViewportErrorBoundary>
        ) : null}
      </section>
      {d9VisitorConfig !== null &&
      domInteractionTarget !== null &&
      onSanctuaryInteraction !== undefined ? (
        <D9ProjectedInteractionTarget
          onInteraction={onSanctuaryInteraction}
          onVisualStateChange={setInteractionVisualState}
          target={domInteractionTarget}
        />
      ) : null}
      {d9VisitorConfig !== null && sanctuaryState?.name === "READ" ? (
        readingPageLayout !== null ? (
          <D9ReadingSurface
            diagnosticsEnabled={affordanceDiagnosticsActive}
            layout={readingPageLayout}
            onLetsPray={enterPrayerFromReading}
          />
        ) : (
          <D9ReadingFallback onLetsPray={enterPrayerFromReading} />
        )
      ) : null}
      {d9VisitorConfig !== null && sanctuaryState?.name === "PRAY" ? (
        <D9ReflectionSurface onReturn={returnToSanctuaryFromReflection} />
      ) : null}
      {affordanceDiagnosticsActive ? (
        <aside className="d9-affordance-diagnostics" data-d9-affordance-diagnostics="true">
          {affordanceDiagnostics !== null ? (
            <>
              <p>Active DOM target: {affordanceDiagnostics.activeTarget ?? "none"}</p>
              <p>World bounds: {JSON.stringify(affordanceDiagnostics.worldBounds)}</p>
              <p>
                Screen bounds:{" "}
                {affordanceDiagnostics.screenBounds === null
                  ? "unavailable"
                  : affordanceDiagnostics.screenBounds.map((value) => value.toFixed(1)).join(", ")}
              </p>
              <p>State: {affordanceDiagnostics.state}</p>
              <p>DOM visual state: {affordanceDiagnostics.visualState}</p>
              <p>Cue: {JSON.stringify(affordanceDiagnostics.cue)}</p>
            </>
          ) : null}
          {ambientCameraDiagnostics !== null ? (
            <>
              <p>
                System reduced motion / Realm resolved: {String(systemReducedMotion)} /{" "}
                {String(reducedMotion)}
              </p>
              <button
                aria-pressed={diagnosticMotionOverride}
                data-d9-diagnostic-motion-override="true"
                onClick={() => {
                  setDiagnosticMotionOverride((current) => !current);
                }}
                type="button"
              >
                {diagnosticMotionOverride ? "Disable" : "Enable"} diagnostic camera motion proof
              </button>
              <p>Camera state: {ambientCameraDiagnostics.state}</p>
              <p>Pointer events: {ambientCameraDiagnostics.pointerEventCount}</p>
              <p>
                Pointer: {ambientCameraDiagnostics.pointerType} / client{" "}
                {ambientCameraDiagnostics.pointerClientPosition.join(", ")}
              </p>
              <p>
                Normalized pointer:{" "}
                {ambientCameraDiagnostics.normalizedPointer
                  .map((value) => value.toFixed(3))
                  .join(", ")}
              </p>
              <p>
                Pending yaw/pitch: {ambientCameraDiagnostics.pendingYawDegrees.toFixed(3)},{" "}
                {ambientCameraDiagnostics.pendingPitchDegrees.toFixed(3)}
              </p>
              <p>
                Target yaw/pitch: {ambientCameraDiagnostics.targetYawDegrees.toFixed(3)},{" "}
                {ambientCameraDiagnostics.targetPitchDegrees.toFixed(3)}
              </p>
              <p>
                Applied yaw/pitch: {ambientCameraDiagnostics.appliedYawDegrees.toFixed(3)},{" "}
                {ambientCameraDiagnostics.appliedPitchDegrees.toFixed(3)}
              </p>
              <p>
                Intent/motion: {ambientCameraDiagnostics.intentDelayActive ? "delay" : "ready"} /{" "}
                {ambientCameraDiagnostics.holdOrReturnState}
              </p>
              <p>
                Idle / exact home: {ambientCameraDiagnostics.idleMilliseconds ?? "none"} /{" "}
                {String(ambientCameraDiagnostics.exactHome)}
              </p>
            </>
          ) : null}
          {readingPageLayout !== null ? (
            <>
              <p>READ left page quad: {JSON.stringify(readingPageLayout.leftPage)}</p>
              <p>READ right page quad: {JSON.stringify(readingPageLayout.rightPage)}</p>
              <p>READ action: Let&apos;s pray</p>
            </>
          ) : null}
        </aside>
      ) : null}
      {developmentCalibrationTools}
      {developmentHybridProofTools}
    </>
  );
}
