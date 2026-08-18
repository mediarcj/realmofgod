/**
 * File: apps/sanctuary/src/rendering/CanvasExperience.tsx
 * Description: Renders the optional local Canvas environment after the lightweight viewport selects it.
 * Purpose: Holds renderer-only imports in an asynchronous application chunk instead of the mandatory document path.
 * Notes: The scene is decorative, uses no remote assets, and remains separate from sanctuary semantics.
 */

// Import renderer-specific code only inside this asynchronously loaded visual module.
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, type ReactNode } from "react";
import {
  AgXToneMapping,
  PCFShadowMap,
  PerspectiveCamera,
  SRGBColorSpace,
  WebGLRenderer,
} from "three";

import type { JourneyVisualState } from "../journey/model";
import { readLocalVisualCheck, readRendererVerificationStage } from "./capabilities";
import { RealmScene } from "./RealmScene";
import type { VisualCalibration } from "./visualCalibration";

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
): void {
  gl.toneMappingExposure = visualCalibration.lighting.exposure;
  camera.fov = visualCalibration.camera.fov;
  camera.updateProjectionMatrix();
}

// Apply live-safe camera and exposure values without rebuilding the WebGL renderer during local calibration.
function RendererCalibration({
  visualCalibration,
}: {
  readonly visualCalibration: VisualCalibration;
}): ReactNode {
  const { camera, gl } = useThree();

  useEffect(() => {
    if (camera instanceof PerspectiveCamera) {
      applyRendererCalibration(gl, camera, visualCalibration);
    }
  }, [camera, gl, visualCalibration]);

  return null;
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
  const fullRendererCheck = rendererVerificationStage === "e";

  return (
    <div
      className="experience-canvas"
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
        dpr={fullRendererCheck ? [1, 1.5] : [1, 1.25]}
        gl={(defaults) => {
          try {
            // Construct exactly one renderer with a neutral GPU preference and the reviewed quality level.
            return new WebGLRenderer({
              ...defaults,
              antialias: fullRendererCheck,
              powerPreference: "default",
            });
          } catch {
            onRendererFailure("creation-unavailable");
            throw new Error("The local WebGL renderer could not be created.");
          }
        }}
        fallback={fallback}
        onCreated={({ gl }) => {
          // Use photographic highlight rolloff and explicit sRGB output without a postprocessing chain.
          gl.outputColorSpace = SRGBColorSpace;
          gl.shadowMap.enabled = fullRendererCheck;
          gl.shadowMap.type = PCFShadowMap;
          gl.toneMapping = AgXToneMapping;
          gl.toneMappingExposure = visualCalibration.lighting.exposure;
        }}
        shadows={fullRendererCheck}
      >
        <RendererLifecycle
          onRendererFailure={onRendererFailure}
          onRendererReady={onRendererReady}
        />
        <RendererCalibration visualCalibration={visualCalibration} />
        <RealmScene
          reducedMotion={reducedMotion}
          rendererVerificationStage={rendererVerificationStage}
          visualCalibration={visualCalibration}
          visualState={visualState}
        />
      </Canvas>
    </div>
  );
}

// Provide React.lazy with the module's renderer-only component while retaining a named export for direct tests.
export default CanvasExperience;
