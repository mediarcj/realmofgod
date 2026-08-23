/**
 * File: apps/sanctuary/src/rendering/CanvasExperience.tsx
 * Description: Renders the optional local Canvas environment after the lightweight viewport selects it.
 * Purpose: Holds renderer-only imports in an asynchronous application chunk instead of the mandatory document path.
 * Notes: The scene is decorative, uses no remote assets, and remains separate from sanctuary semantics.
 */

// Import renderer-specific code only inside this asynchronously loaded visual module.
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { lazy, Suspense, useEffect, useMemo, useRef, type ReactNode } from "react";
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
import {
  readD84StaticProofConfig,
  readD85LandscapeProofConfig,
  readD9VisitorSanctuaryConfig,
  readLocalVisualCheck,
  readRendererVerificationStage,
} from "./capabilities";
import { d75SanctuaryCamera, selectD75SanctuaryProjection } from "./d75SanctuaryCamera";
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

// Classify only the renderer boundary needed to verify a safe local recovery path.
export type RendererFailureReason = "context-lost" | "creation-unavailable";

// Describe the single local preference forwarded from the lightweight viewport boundary.
interface CanvasExperienceProps {
  readonly fallback: ReactNode;
  readonly onRendererFailure: (reason: RendererFailureReason) => void;
  readonly onRendererReady: (api: "webgl1" | "webgl2") => void;
  readonly reducedMotion: boolean;
  readonly visualCalibration: VisualCalibration;
  readonly visualState: JourneyVisualState;
}

// Update Three's deliberately mutable renderer and camera objects behind one reviewed imperative boundary.
function applyRendererCalibration(
  gl: WebGLRenderer,
  camera: PerspectiveCamera,
  visualCalibration: VisualCalibration,
  viewportAspect: number,
  sanctuaryHero: boolean,
  useD75SanctuaryCamera: boolean,
): void {
  gl.toneMappingExposure = visualCalibration.lighting.exposure;
  if (useD75SanctuaryCamera) {
    const projection = selectD75SanctuaryProjection(viewportAspect);
    camera.fov = projection.fovDegrees;
    camera.near = d75SanctuaryCamera.clipStart;
    camera.far = d75SanctuaryCamera.clipEnd;
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
}: {
  readonly visualCalibration: VisualCalibration;
  readonly visualState: JourneyVisualState;
  readonly useD75SanctuaryCamera: boolean;
}): ReactNode {
  const { camera, gl, size } = useThree();

  useEffect(() => {
    if (camera instanceof PerspectiveCamera) {
      const sanctuaryHero = visualState.stage === "entry" || visualState.stage === "sanctuary";
      applyRendererCalibration(
        gl,
        camera,
        visualCalibration,
        size.width / Math.max(size.height, 1),
        sanctuaryHero,
        useD75SanctuaryCamera,
      );
    }
  }, [
    camera,
    gl,
    size.height,
    size.width,
    useD75SanctuaryCamera,
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
  reducedMotion,
  visualCalibration,
  visualState,
}: CanvasExperienceProps): ReactNode {
  const rendererVerificationStage = readRendererVerificationStage();
  // Make the D9 local visitor root use the approved static candidate before older explicit proof fragments.
  const d9VisitorConfig = import.meta.env.DEV ? readD9VisitorSanctuaryConfig() : null;
  const staticProofConfig = import.meta.env.DEV
    ? (d9VisitorConfig ?? readD85LandscapeProofConfig() ?? readD84StaticProofConfig())
    : null;
  const staticProofActive = staticProofConfig !== null && D84StaticSanctuaryProof !== null;
  const useD75SanctuaryCamera = d9VisitorConfig !== null && staticProofActive;
  const cinematicRenderer =
    !staticProofActive && (rendererVerificationStage === null || rendererVerificationStage === "e");
  const shadowsEnabled = staticProofActive
    ? staticProofConfig.shadowPolicy !== "off"
    : cinematicRenderer;

  return (
    <div
      className="experience-canvas"
      data-d9-camera-calibration={useD75SanctuaryCamera ? "d7.5-sanctuary" : undefined}
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
        // Hold proof pixels at CSS resolution so desktop and mobile counters describe the requested viewports.
        dpr={staticProofActive ? 1 : cinematicRenderer ? [1, 1.5] : [1, 1.25]}
        gl={(defaults) => {
          try {
            // Construct exactly one renderer with a neutral GPU preference and the reviewed quality level.
            return new WebGLRenderer({
              ...defaults,
              antialias: cinematicRenderer,
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
          // Keep reflections present for metal and varnished wood without suggesting a second lamp.
          scene.environmentIntensity = 0.2;
          if (camera instanceof PerspectiveCamera) {
            // Apply the exact D7.5 frame only to the D9 visitor candidate; older proof routes retain their evidence camera.
            applyRendererCalibration(
              gl,
              camera,
              visualCalibration,
              gl.domElement.clientWidth / Math.max(gl.domElement.clientHeight, 1),
              visualState.stage === "entry" || visualState.stage === "sanctuary",
              useD75SanctuaryCamera,
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
          useD75SanctuaryCamera={useD75SanctuaryCamera}
          visualCalibration={visualCalibration}
          visualState={visualState}
        />
        <LocalReflectionEnvironment />
        {staticProofActive ? (
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
