/**
 * File: apps/sanctuary/src/rendering/D9CameraTransitionController.tsx
 * Description: Owns the D9.0C.1 runtime camera transform across the approved guided sanctuary routes.
 * Purpose: Keeps one renderer-owned camera writer while semantic state and the accessible DOM overlay remain independent.
 * Notes: Full motion uses bounded routes, while reduced motion and restored sessions settle immediately on exact D7.5 endpoints.
 */

// Import R3F lifecycle hooks and React refs used to mutate the one existing Three.js camera without per-frame React state.
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { PerspectiveCamera } from "three";

import type { SanctuaryMvpState } from "../sanctuary/model";
import type { D75SanctuaryFramingPolicy } from "./d75SanctuaryCamera";
import {
  cloneD9CameraPose,
  createD9CameraEndpoint,
  d9CameraTransitionDurationsMs,
  sampleD9CameraTransition,
  selectD9CameraTransitionPlan,
  shouldInvalidateD9CameraTransition,
  type D9CameraMovePlan,
  type D9CameraPose,
  type D9CameraTransitionRoute,
} from "./d9CameraTransition";

// Retain only the visual facts needed to continue one in-flight render loop; this is deliberately not application state.
interface ActiveD9CameraTransition {
  readonly plan: D9CameraMovePlan;
  readonly startedAtMilliseconds: number | null;
  readonly startPose: D9CameraPose;
}

// Apply a complete pose atomically so a visible frame never combines a new location with an old lens or orientation.
function applyD9CameraPose(camera: PerspectiveCamera, pose: D9CameraPose): void {
  camera.far = pose.far;
  camera.fov = pose.fovDegrees;
  camera.near = pose.near;
  camera.position.copy(pose.position);
  camera.quaternion.copy(pose.quaternion);
  camera.up.copy(pose.up);
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);
}

// Capture the actual rendered camera before replacing a route so rapid legal actions remain visually continuous.
function captureD9CameraPose(camera: PerspectiveCamera): D9CameraPose {
  return {
    far: camera.far,
    fovDegrees: camera.fov,
    near: camera.near,
    position: camera.position.clone(),
    quaternion: camera.quaternion.clone().normalize(),
    up: camera.up.clone().normalize(),
  };
}

// Keep nonvisual evidence useful to browser checks without restoring a visitor-facing diagnostics surface.
function writeD9CameraTransitionEvidence(
  canvas: HTMLCanvasElement,
  transition: D9CameraTransitionRoute | "settled",
  progress: number,
  plan?: D9CameraMovePlan,
): void {
  canvas.setAttribute("data-d9-camera-transition", transition);
  canvas.setAttribute("data-d9-camera-transition-progress", progress.toFixed(4));
  if (plan === undefined) {
    canvas.removeAttribute("data-d9-camera-route");
    canvas.removeAttribute("data-d9-camera-transition-from");
    canvas.removeAttribute("data-d9-camera-transition-to");
    return;
  }
  canvas.setAttribute("data-d9-camera-route", plan.kind);
  canvas.setAttribute("data-d9-camera-transition-from", plan.from);
  canvas.setAttribute("data-d9-camera-transition-to", plan.target);
}

// Render the approved transition paths while snapshots and reduced motion retain exact endpoint presentation.
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

  // Store the latest semantic endpoint for resize handling without allowing resize code to become a competing transition writer.
  useLayoutEffect(() => {
    cameraNameRef.current = cameraName;
  }, [cameraName]);

  // Let a settled endpoint respond to ordinary resize, while active motion recomputes its lens on the next requested controller frame.
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
    invalidate();
  }, [camera, framingPolicy, invalidate, size.height, size.width]);

  // Turn an owner-approved semantic edge into one renderer-owned route, rebasing from the actual camera if the visitor interrupts it.
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

    if (plan.kind !== "snap") {
      const startPose =
        activeTransition.current === null
          ? createD9CameraEndpoint(plan.from, aspectRef.current, framingPolicy)
          : captureD9CameraPose(camera);
      activeTransition.current = {
        plan,
        startedAtMilliseconds: null,
        startPose: cloneD9CameraPose(startPose),
      };
      onTransitionActiveChange(true);
      writeD9CameraTransitionEvidence(gl.domElement, plan.kind, 0, plan);
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
    // A single exact-endpoint frame is enough in demand mode; no continuing idle render loop is requested here.
    invalidate();
  }, [camera, cameraName, framingPolicy, gl, invalidate, onTransitionActiveChange, reducedMotion]);

  // Remove only local evidence attributes when this development-only visitor renderer unmounts.
  useEffect(() => {
    const canvas = gl.domElement;
    return () => {
      for (const attribute of [
        "data-d9-camera-route",
        "data-d9-camera-transition",
        "data-d9-camera-transition-progress",
        "data-d9-camera-transition-from",
        "data-d9-camera-transition-to",
      ]) {
        canvas.removeAttribute(attribute);
      }
    };
  }, [gl]);

  // Sample only an active route and explicitly release demand rendering once its exact destination endpoint is applied.
  useFrame((state) => {
    const transition = activeTransition.current;
    if (transition === null || !(camera instanceof PerspectiveCamera)) {
      return;
    }

    const nowMilliseconds = state.clock.getElapsedTime() * 1000;
    const startedAtMilliseconds = transition.startedAtMilliseconds ?? nowMilliseconds;
    if (transition.startedAtMilliseconds === null) {
      activeTransition.current = { ...transition, startedAtMilliseconds };
    }
    const progress = Math.min(
      1,
      (nowMilliseconds - startedAtMilliseconds) /
        d9CameraTransitionDurationsMs[transition.plan.kind],
    );

    applyD9CameraPose(
      camera,
      sampleD9CameraTransition(
        transition.plan,
        progress,
        aspectRef.current,
        framingPolicy,
        transition.startPose,
      ),
    );
    writeD9CameraTransitionEvidence(gl.domElement, transition.plan.kind, progress, transition.plan);

    if (shouldInvalidateD9CameraTransition(progress)) {
      // Demand mode receives one next frame for every unfinished route sample and no idle refresh loop.
      invalidate();
      return;
    }

    // Reapply the immutable target after interpolation so the final lens, clip range, and normalized orientation stay exact.
    applyD9CameraPose(
      camera,
      createD9CameraEndpoint(transition.plan.target, aspectRef.current, framingPolicy),
    );
    activeTransition.current = null;
    onTransitionActiveChange(false);
    writeD9CameraTransitionEvidence(gl.domElement, "settled", 1);
  });

  return null;
}
