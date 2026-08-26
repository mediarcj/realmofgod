/**
 * File: apps/sanctuary/src/rendering/D9CameraTransitionController.tsx
 * Description: Owns the D9.0C.0 runtime camera transform between immutable sanctuary camera endpoints.
 * Purpose: Provides one calm SANCTUARY-to-SIT presentation move while keeping the reducer and DOM controls authoritative.
 * Notes: This controller does not create visitor actions and returns every non-approved transition to an exact D7.5 snap.
 */

// Import R3F lifecycle hooks and React refs used to mutate the one existing Three.js camera without a per-frame React update.
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { PerspectiveCamera } from "three";

import type { SanctuaryMvpState } from "../sanctuary/model";
import type { D75SanctuaryFramingPolicy } from "./d75SanctuaryCamera";
import {
  createD9CameraEndpoint,
  d9SanctuaryToSitDurationMs,
  sampleD9SanctuaryToSitTransition,
  selectD9CameraTransitionPlan,
  shouldInvalidateD9CameraTransition,
} from "./d9CameraTransition";

// Retain only the visual facts required to resume one in-flight render loop; this is deliberately not application state.
interface ActiveD9CameraTransition {
  readonly startedAtMilliseconds: number | null;
}

// Apply a complete pose atomically so the visible frame never combines a new location with an old lens or orientation.
function applyD9CameraPose(
  camera: PerspectiveCamera,
  pose: ReturnType<typeof createD9CameraEndpoint>,
): void {
  camera.far = pose.far;
  camera.fov = pose.fovDegrees;
  camera.near = pose.near;
  camera.position.copy(pose.position);
  camera.quaternion.copy(pose.quaternion);
  camera.up.copy(pose.up);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
}

// Keep nonvisual local evidence useful to browser checks without restoring a visitor-facing diagnostics surface.
function writeD9CameraTransitionEvidence(
  canvas: HTMLCanvasElement,
  transition: "sanctuary-to-sit" | "settled",
  progress: number,
  includeRoute = false,
): void {
  canvas.setAttribute("data-d9-camera-transition", transition);
  canvas.setAttribute("data-d9-camera-transition-progress", progress.toFixed(4));
  if (includeRoute) {
    canvas.setAttribute("data-d9-camera-transition-from", "SANCTUARY");
    canvas.setAttribute("data-d9-camera-transition-to", "SIT");
    return;
  }
  canvas.removeAttribute("data-d9-camera-transition-from");
  canvas.removeAttribute("data-d9-camera-transition-to");
}

// Render the one approved transition path while all other selected states continue to use their exact authored frames.
export function D9CameraTransitionController({
  cameraName,
  framingPolicy,
  onTransitionActiveChange,
  reducedMotion,
}: {
  readonly cameraName: SanctuaryMvpState["name"];
  readonly framingPolicy: D75SanctuaryFramingPolicy;
  readonly onTransitionActiveChange: (active: boolean) => void;
  readonly reducedMotion: boolean;
}): ReactNode {
  const { camera, gl, invalidate, size } = useThree();
  const activeTransition = useRef<ActiveD9CameraTransition | null>(null);
  const previousCameraName = useRef<SanctuaryMvpState["name"] | null>(null);
  const cameraNameRef = useRef(cameraName);
  const aspectRef = useRef(size.width / Math.max(size.height, 1));

  // Store the latest selected semantic endpoint for a later resize without giving the resize effect a second camera-state writer.
  useLayoutEffect(() => {
    cameraNameRef.current = cameraName;
  }, [cameraName]);

  // Keep the latest horizontal-frame lens available to an active transition when ordinary browser resizing occurs.
  useLayoutEffect(() => {
    aspectRef.current = size.width / Math.max(size.height, 1);
    if (!(camera instanceof PerspectiveCamera)) {
      return;
    }
    if (activeTransition.current === null) {
      applyD9CameraPose(
        camera,
        createD9CameraEndpoint(cameraNameRef.current, aspectRef.current, framingPolicy),
      );
      return;
    }
    // Let the controller's next requested frame recompute its in-flight FOV rather than allowing a second writer to snap it.
    invalidate();
  }, [camera, framingPolicy, invalidate, size.height, size.width]);

  // Start only SANCTUARY to SIT as a visual move; all later state changes settle immediately and cannot leave a half pose behind.
  useLayoutEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) {
      return;
    }

    const plan = selectD9CameraTransitionPlan(
      previousCameraName.current,
      cameraName,
      reducedMotion,
    );
    previousCameraName.current = cameraName;

    if (plan.kind === "sanctuary-to-sit") {
      activeTransition.current = { startedAtMilliseconds: null };
      onTransitionActiveChange(true);
      writeD9CameraTransitionEvidence(gl.domElement, "sanctuary-to-sit", 0, true);
      invalidate();
      return;
    }

    activeTransition.current = null;
    applyD9CameraPose(
      camera,
      createD9CameraEndpoint(plan.target, aspectRef.current, framingPolicy),
    );
    onTransitionActiveChange(false);
    writeD9CameraTransitionEvidence(gl.domElement, "settled", 1);
    // A single exact-endpoint frame is sufficient in demand mode; no continuing transition loop is requested here.
    invalidate();
  }, [camera, cameraName, framingPolicy, gl, invalidate, onTransitionActiveChange, reducedMotion]);

  // Remove only the local evidence attributes when this development-only visitor renderer unmounts.
  useEffect(() => {
    const canvas = gl.domElement;
    return () => {
      for (const attribute of [
        "data-d9-camera-transition",
        "data-d9-camera-transition-progress",
        "data-d9-camera-transition-from",
        "data-d9-camera-transition-to",
      ]) {
        canvas.removeAttribute(attribute);
      }
    };
  }, [gl]);

  useFrame((state) => {
    const transition = activeTransition.current;
    if (transition === null || !(camera instanceof PerspectiveCamera)) {
      return;
    }

    const nowMilliseconds = state.clock.getElapsedTime() * 1000;
    const startedAtMilliseconds = transition.startedAtMilliseconds ?? nowMilliseconds;
    if (transition.startedAtMilliseconds === null) {
      activeTransition.current = { startedAtMilliseconds };
    }
    const progress = Math.min(
      1,
      (nowMilliseconds - startedAtMilliseconds) / d9SanctuaryToSitDurationMs,
    );

    applyD9CameraPose(
      camera,
      sampleD9SanctuaryToSitTransition(progress, aspectRef.current, framingPolicy),
    );
    writeD9CameraTransitionEvidence(gl.domElement, "sanctuary-to-sit", progress, true);

    if (shouldInvalidateD9CameraTransition(progress)) {
      // Demand mode receives exactly one next frame for every unfinished transition sample and no idle refresh loop.
      invalidate();
      return;
    }

    // Explicitly restore the immutable SIT pose after interpolation, including its authored lens and normalized orientation.
    applyD9CameraPose(camera, createD9CameraEndpoint("SIT", aspectRef.current, framingPolicy));
    activeTransition.current = null;
    onTransitionActiveChange(false);
    writeD9CameraTransitionEvidence(gl.domElement, "settled", 1, true);
  });

  return null;
}
