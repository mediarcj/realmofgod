/**
 * File: apps/sanctuary/src/rendering/CanvasExperience.tsx
 * Description: Renders the optional local Canvas environment after the lightweight viewport selects it.
 * Purpose: Holds renderer-only imports in an asynchronous application chunk instead of the mandatory document path.
 * Notes: The scene is decorative, uses no remote assets, and remains separate from sanctuary semantics.
 */

// Import renderer-specific code only inside this asynchronously loaded visual module.
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  lazy,
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  AgXToneMapping,
  PCFShadowMap,
  PMREMGenerator,
  PerspectiveCamera,
  SRGBColorSpace,
  WebGLRenderer,
} from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

import type { JourneyVisualState } from "../journey/model";
import type { SanctuaryMvpAction, SanctuaryMvpState } from "../sanctuary/model";
import {
  readD84StaticProofConfig,
  readD85LandscapeProofConfig,
  readD9VisitorSanctuaryConfig,
  readD91InspectionConfig,
  readD92QualityInspectionConfig,
  readLocalVisualCheck,
  readRendererVerificationStage,
} from "./capabilities";
import {
  d75SanctuaryCamera,
  selectD75SanctuaryProjection,
  type D75SanctuaryCameraName,
  type D75SanctuaryFramingPolicy,
} from "./d75SanctuaryCamera";
import { selectD9VisitorRenderQuality, type D9RenderQuality } from "./d9SanctuaryQuality";
import { RealmScene } from "./RealmScene";
import { selectSanctuaryHeroCamera, type VisualCalibration } from "./visualCalibration";

// Keep the local D8.4 comparison module and both candidate assets out of the production module graph.
const D84StaticSanctuaryProof = import.meta.env.DEV
  ? lazy(async () =>
      import("./D84StaticSanctuaryProof").then(({ D84StaticSanctuaryProof: proof }) => ({
        default: proof,
      })),
    )
  : null;

// Keep the normal D9 visitor scene separate from D84's intentionally fixed-DPR diagnostic path.
const D9SanctuaryScene = import.meta.env.DEV
  ? lazy(async () =>
      import("./D9SanctuaryScene").then(({ D9SanctuaryScene: scene }) => ({ default: scene })),
    )
  : null;

// Classify only the renderer boundary needed to verify a safe local recovery path.
export type RendererFailureReason = "context-lost" | "creation-unavailable";

// Describe the single local preference forwarded from the lightweight viewport boundary.
interface CanvasExperienceProps {
  readonly fallback: ReactNode;
  readonly onRendererFailure: (reason: RendererFailureReason) => void;
  readonly onRendererReady: (api: "webgl1" | "webgl2") => void;
  readonly onSanctuaryInteraction?: ((action: SanctuaryMvpAction) => void) | undefined;
  readonly reducedMotion: boolean;
  readonly sanctuaryState?: SanctuaryMvpState | undefined;
  readonly visualCalibration: VisualCalibration;
  readonly visualState: JourneyVisualState;
}

// Read only the dimensions and scale needed to bound decorative pixels; this is not a browser fingerprint.
function readD9RenderQuality(): D9RenderQuality {
  if (typeof window === "undefined") {
    return selectD9VisitorRenderQuality({ devicePixelRatio: 1, height: 1, width: 1 });
  }
  return selectD9VisitorRenderQuality({
    devicePixelRatio: window.devicePixelRatio,
    height: window.innerHeight,
    width: window.innerWidth,
  });
}

// Refresh the local quality cap after an ordinary resize or orientation change without storing a browser preference.
function useD9RenderQuality(active: boolean): D9RenderQuality {
  const [quality, setQuality] = useState(readD9RenderQuality);

  useEffect(() => {
    if (!active) {
      return undefined;
    }
    const updateQuality = (): void => {
      setQuality(readD9RenderQuality());
    };
    window.addEventListener("resize", updateQuality);
    updateQuality();
    return () => {
      window.removeEventListener("resize", updateQuality);
    };
  }, [active]);

  return quality;
}

// Update Three's deliberately mutable renderer and camera objects behind one reviewed imperative boundary.
function applyRendererCalibration(
  gl: WebGLRenderer,
  camera: PerspectiveCamera,
  visualCalibration: VisualCalibration,
  viewportAspect: number,
  sanctuaryHero: boolean,
  useD75SanctuaryCamera: boolean,
  d75FramingPolicy: D75SanctuaryFramingPolicy,
  d75CameraName: D75SanctuaryCameraName,
): void {
  gl.toneMappingExposure = visualCalibration.lighting.exposure;
  if (useD75SanctuaryCamera) {
    const projection = selectD75SanctuaryProjection(
      viewportAspect,
      d75FramingPolicy,
      d75CameraName,
    );
    const authoredCamera = d75CameraName === "SANCTUARY" ? d75SanctuaryCamera : null;
    camera.fov = projection.fovDegrees;
    camera.near = authoredCamera?.clipStart ?? 0.009999999776482582;
    camera.far = authoredCamera?.clipEnd ?? 500;
    camera.position.set(...projection.position);
    camera.up.set(...projection.up);
    camera.lookAt(
      projection.position[0] + projection.forward[0],
      projection.position[1] + projection.forward[1],
      projection.position[2] + projection.forward[2],
    );
    camera.updateProjectionMatrix();
    return;
  }
  camera.fov = selectSanctuaryHeroCamera(
    visualCalibration.camera,
    viewportAspect,
    sanctuaryHero,
  ).fov;
  camera.updateProjectionMatrix();
}

// Apply live-safe camera and exposure values without rebuilding the WebGL renderer during local calibration.
function RendererCalibration({
  visualCalibration,
  visualState,
  useD75SanctuaryCamera,
  d75FramingPolicy,
  d75CameraName,
}: {
  readonly visualCalibration: VisualCalibration;
  readonly visualState: JourneyVisualState;
  readonly useD75SanctuaryCamera: boolean;
  readonly d75FramingPolicy: D75SanctuaryFramingPolicy;
  readonly d75CameraName: D75SanctuaryCameraName;
}): ReactNode {
  const { camera, gl, size } = useThree();

  useLayoutEffect(() => {
    if (camera instanceof PerspectiveCamera) {
      const sanctuaryHero = visualState.stage === "entry" || visualState.stage === "sanctuary";
      applyRendererCalibration(
        gl,
        camera,
        visualCalibration,
        size.width / Math.max(size.height, 1),
        sanctuaryHero,
        useD75SanctuaryCamera,
        d75FramingPolicy,
        d75CameraName,
      );
    }
  }, [
    camera,
    gl,
    size.height,
    size.width,
    useD75SanctuaryCamera,
    d75FramingPolicy,
    d75CameraName,
    visualCalibration,
    visualState.stage,
  ]);

  return null;
}

// Create one local reflected-light map so metal and polished wood respond to the room without a remote HDR file.
function LocalReflectionEnvironment(): ReactNode {
  const { gl } = useThree();
  const environment = useMemo(() => {
    const generator = new PMREMGenerator(gl);
    const texture = generator.fromScene(new RoomEnvironment(), 0.04).texture;
    generator.dispose();
    return texture;
  }, [gl]);

  useEffect(() => {
    return () => {
      environment.dispose();
    };
  }, [environment]);

  return <primitive attach="environment" object={environment} />;
}

// Observe the actual renderer canvas so initialization and later context loss share one safe fallback path.
function RendererLifecycle({
  onRendererFailure,
  onRendererReady,
}: Pick<CanvasExperienceProps, "onRendererFailure" | "onRendererReady">): ReactNode {
  const { gl } = useThree();
  const firstFrameReported = useRef(false);

  useEffect(() => {
    const canvas = gl.domElement;

    const handleContextLost = (): void => {
      // R3F deliberately loses a context during teardown; only a still-connected canvas represents failure.
      window.setTimeout(() => {
        if (canvas.isConnected) {
          onRendererFailure("context-lost");
        }
      }, 0);
    };
    canvas.addEventListener("webglcontextlost", handleContextLost);

    return () => {
      canvas.removeEventListener("webglcontextlost", handleContextLost);
    };
  }, [gl, onRendererFailure]);

  useFrame(() => {
    if (!firstFrameReported.current) {
      firstFrameReported.current = true;
      onRendererReady(gl.capabilities.isWebGL2 ? "webgl2" : "webgl1");

      // Exercise real context-loss handling only from the exact development-only verification fragment.
      if (readLocalVisualCheck() === "context-loss") {
        gl.getContext().getExtension("WEBGL_lose_context")?.loseContext();
      }
    }
  });

  return null;
}

// Render a full atmospheric background while keeping every meaningful word and action in the DOM.
export function CanvasExperience({
  fallback,
  onRendererFailure,
  onRendererReady,
  onSanctuaryInteraction,
  reducedMotion,
  sanctuaryState,
  visualCalibration,
  visualState,
}: CanvasExperienceProps): ReactNode {
  const rendererVerificationStage = readRendererVerificationStage();
  // Make the D9 local visitor root use the approved static candidate before older explicit proof fragments.
  const d9VisitorConfig = import.meta.env.DEV ? readD9VisitorSanctuaryConfig() : null;
  const d91InspectionConfig = import.meta.env.DEV ? readD91InspectionConfig() : null;
  const d92QualityInspectionConfig = import.meta.env.DEV ? readD92QualityInspectionConfig() : null;
  const staticProofConfig = import.meta.env.DEV
    ? (d91InspectionConfig ?? readD85LandscapeProofConfig() ?? readD84StaticProofConfig())
    : null;
  const staticProofActive = staticProofConfig !== null && D84StaticSanctuaryProof !== null;
  const d9VisitorActive = d9VisitorConfig !== null && D9SanctuaryScene !== null;
  const d92QualityInspectionActive =
    d92QualityInspectionConfig !== null && D9SanctuaryScene !== null;
  const d9QualityRendererActive = d9VisitorActive || d92QualityInspectionActive;
  const d9RenderQuality = useD9RenderQuality(d9QualityRendererActive);
  const useD75SanctuaryCamera =
    d9QualityRendererActive || (d91InspectionConfig !== null && staticProofActive);
  const d75FramingPolicy =
    d92QualityInspectionConfig?.framingPolicy ?? d91InspectionConfig?.framingPolicy ?? "horizontal";
  // Normal D9 interaction selects one exact endpoint; diagnostics intentionally retain the SANCTUARY frame.
  const d75CameraName: D75SanctuaryCameraName = d9VisitorActive
    ? (sanctuaryState?.name ?? "SANCTUARY")
    : "SANCTUARY";
  const cinematicRenderer =
    !d9QualityRendererActive &&
    !staticProofActive &&
    (rendererVerificationStage === null || rendererVerificationStage === "e");
  const shadowsEnabled = d9QualityRendererActive
    ? true
    : staticProofActive
      ? staticProofConfig.shadowPolicy !== "off"
      : cinematicRenderer;

  return (
    <div
      className="experience-canvas"
      data-d9-camera-calibration={useD75SanctuaryCamera ? "d7.5-sanctuary" : undefined}
      data-d91-inspection={d91InspectionConfig?.candidate}
      data-renderer-check={rendererVerificationStage ?? "normal"}
      aria-hidden="true"
    >
      <Canvas
        camera={{
          fov: visualCalibration.camera.fov,
          near: 0.1,
          far: 60,
          position: [...visualCalibration.camera.position],
        }}
        // Keep only explicit D84/D85/D91 diagnostics at DPR 1; the D9 visitor receives its bounded quality scale.
        dpr={
          d9QualityRendererActive
            ? d9RenderQuality.dpr
            : staticProofActive
              ? 1
              : cinematicRenderer
                ? [1, 1.5]
                : [1, 1.25]
        }
        gl={(defaults) => {
          try {
            // Construct exactly one renderer with a neutral GPU preference and the reviewed quality level.
            return new WebGLRenderer({
              ...defaults,
              antialias: d9QualityRendererActive ? d9RenderQuality.antialias : cinematicRenderer,
              powerPreference: "default",
            });
          } catch {
            onRendererFailure("creation-unavailable");
            throw new Error("The local WebGL renderer could not be created.");
          }
        }}
        fallback={fallback}
        onCreated={({ camera, gl, scene }) => {
          // Use photographic highlight rolloff and explicit sRGB output without a postprocessing chain.
          gl.outputColorSpace = SRGBColorSpace;
          gl.shadowMap.enabled = shadowsEnabled;
          gl.shadowMap.type = PCFShadowMap;
          gl.toneMapping = AgXToneMapping;
          gl.toneMappingExposure = visualCalibration.lighting.exposure;
          // Keep restrained local reflections on metal and varnished wood without introducing a pictured third lamp.
          scene.environmentIntensity = 0.35;
          if (camera instanceof PerspectiveCamera) {
            // Apply the exact D7.5 frame only to the D9 visitor candidate; older proof routes retain their evidence camera.
            applyRendererCalibration(
              gl,
              camera,
              visualCalibration,
              gl.domElement.clientWidth / Math.max(gl.domElement.clientHeight, 1),
              visualState.stage === "entry" || visualState.stage === "sanctuary",
              useD75SanctuaryCamera,
              d75FramingPolicy,
              d75CameraName,
            );
          }
        }}
        // Select the same percentage-closer map explicitly so R3F does not initialize its deprecated soft default first.
        shadows={shadowsEnabled ? "percentage" : false}
      >
        <RendererLifecycle
          onRendererFailure={onRendererFailure}
          onRendererReady={onRendererReady}
        />
        <RendererCalibration
          d75CameraName={d75CameraName}
          d75FramingPolicy={d75FramingPolicy}
          useD75SanctuaryCamera={useD75SanctuaryCamera}
          visualCalibration={visualCalibration}
          visualState={visualState}
        />
        <LocalReflectionEnvironment />
        {d9QualityRendererActive ? (
          <Suspense fallback={null}>
            <D9SanctuaryScene
              config={d92QualityInspectionConfig ?? undefined}
              onSanctuaryInteraction={d9VisitorActive ? onSanctuaryInteraction : undefined}
              quality={d9RenderQuality}
              reducedMotion={reducedMotion}
              sanctuaryState={d9VisitorActive ? sanctuaryState : undefined}
              visualCalibration={visualCalibration}
            />
          </Suspense>
        ) : staticProofActive ? (
          <Suspense fallback={null}>
            <D84StaticSanctuaryProof
              config={staticProofConfig}
              visualCalibration={visualCalibration}
            />
          </Suspense>
        ) : (
          <RealmScene
            reducedMotion={reducedMotion}
            rendererVerificationStage={rendererVerificationStage}
            visualCalibration={visualCalibration}
            visualState={visualState}
          />
        )}
      </Canvas>
    </div>
  );
}

// Provide React.lazy with the module's renderer-only component while retaining a named export for direct tests.
export default CanvasExperience;
