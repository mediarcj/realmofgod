/**
 * File: apps/sanctuary/src/rendering/D9AmbientCameraGlance.tsx
 * Description: Applies a tightly bounded Canvas-relative camera glance around each locked D7.5 endpoint.
 * Purpose: Gives the SANCTUARY and SIT views a slow living response without introducing free camera control.
 * Notes: This renderer-local component keeps no React frame state, never changes position, and disables for touch/reduced motion.
 */

// Import only renderer-local hooks and stable Three math needed to offset a camera quaternion around its authored anchor.
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, type ReactNode } from "react";
import { Euler, MathUtils, Matrix4, Quaternion, Vector3 } from "three";

import type { SanctuaryMvpState } from "../sanctuary/model";
import { d75SanctuaryCameras } from "./d75SanctuaryCamera";
import {
  applyD9AmbientPointerSignal,
  clampD9AmbientOffset,
  normalizeD9AmbientPointer,
  selectD9AmbientCameraPolicy,
  selectD9AmbientMotionState,
  type D9AmbientPointerSignal,
} from "./d9AmbientCameraPolicy";

// Describe exactly the renderer-local values exposed only through the explicit development diagnostics fragment.
export interface D9AmbientCameraDiagnosticSnapshot {
  readonly appliedPitchDegrees: number;
  readonly appliedYawDegrees: number;
  readonly exactHome: boolean;
  readonly holdOrReturnState: "disabled" | "holding" | "intent-delay" | "returning";
  readonly idleMilliseconds: number | null;
  readonly intentDelayActive: boolean;
  readonly normalizedPointer: readonly [number, number];
  readonly pendingPitchDegrees: number;
  readonly pendingYawDegrees: number;
  readonly pointerClientPosition: readonly [number, number];
  readonly pointerEventCount: number;
  readonly pointerType: string;
  readonly state: SanctuaryMvpState["name"];
  readonly targetPitchDegrees: number;
  readonly targetYawDegrees: number;
}

// Apply a local yaw/pitch quaternion over the immutable D7.5 orientation without moving the authored camera position.
function buildAnchorQuaternion(state: SanctuaryMvpState["name"]): Quaternion {
  const authored = d75SanctuaryCameras[state];
  const position = new Vector3(...authored.position);
  const target = position.clone().add(new Vector3(...authored.forward));
  return new Quaternion().setFromRotationMatrix(
    new Matrix4().lookAt(position, target, new Vector3(...authored.up)),
  );
}

// Keep raw browser pointer records in refs so normal pointer frames never create React application updates.
export function D9AmbientCameraGlance({
  diagnosticsEnabled,
  onDiagnosticChange,
  reducedMotion,
  state,
}: {
  readonly diagnosticsEnabled: boolean;
  readonly onDiagnosticChange:
    ((snapshot: D9AmbientCameraDiagnosticSnapshot | null) => void) | undefined;
  readonly reducedMotion: boolean;
  readonly state: SanctuaryMvpState;
}): ReactNode {
  const { camera, gl } = useThree();
  const anchorQuaternion = useRef(new Quaternion());
  const appliedPitch = useRef(0);
  const appliedYaw = useRef(0);
  const pendingPitch = useRef(0);
  const pendingYaw = useRef(0);
  const relativeEuler = useRef(new Euler());
  const relativeQuaternion = useRef(new Quaternion());
  const intentStartedAt = useRef<number | null>(null);
  const lastMovementAt = useRef<number | null>(null);
  const pointerSignal = useRef<D9AmbientPointerSignal>({
    clientX: 0,
    clientY: 0,
    normalizedX: 0.5,
    normalizedY: 0.5,
    pendingPitchRadians: 0,
    pendingYawRadians: 0,
    pointerEventCount: 0,
    pointerType: "none",
  });
  const stateName = useRef(state.name);
  const policy = selectD9AmbientCameraPolicy(state.name, reducedMotion);

  useEffect(() => {
    // State snaps always win: clear any old glance and reset the exact authored quaternion immediately.
    stateName.current = state.name;
    anchorQuaternion.current.copy(buildAnchorQuaternion(state.name));
    appliedPitch.current = 0;
    appliedYaw.current = 0;
    pendingPitch.current = 0;
    pendingYaw.current = 0;
    intentStartedAt.current = null;
    lastMovementAt.current = null;
    pointerSignal.current = {
      clientX: 0,
      clientY: 0,
      normalizedX: 0.5,
      normalizedY: 0.5,
      pendingPitchRadians: 0,
      pendingYawRadians: 0,
      pointerEventCount: 0,
      pointerType: "none",
    };
    camera.quaternion.copy(anchorQuaternion.current);
    camera.updateMatrixWorld();
  }, [camera, state.name]);

  useEffect(() => {
    const canvas = gl.domElement;
    const handlePointerMove = (event: PointerEvent): void => {
      // Touch has direct targets but never simulates a desktop camera response.
      if (!policy.enabled || event.pointerType !== "mouse") {
        return;
      }

      const now = performance.now();
      intentStartedAt.current ??= now;
      lastMovementAt.current = now;
      pointerSignal.current = applyD9AmbientPointerSignal(
        pointerSignal.current,
        normalizeD9AmbientPointer(event.clientX, event.clientY, canvas.getBoundingClientRect()),
        event.pointerType,
        policy,
      );
      pendingYaw.current = pointerSignal.current.pendingYawRadians;
      pendingPitch.current = pointerSignal.current.pendingPitchRadians;
    };

    canvas.addEventListener("pointermove", handlePointerMove, { passive: true });

    return () => {
      canvas.removeEventListener("pointermove", handlePointerMove);
    };
  }, [gl, policy]);

  useFrame((_, deltaSeconds) => {
    const now = performance.now();
    const motionState = selectD9AmbientMotionState({
      intentStartedAt: intentStartedAt.current,
      lastMovementAt: lastMovementAt.current,
      now,
      policy,
    });
    const idleMilliseconds =
      lastMovementAt.current === null ? null : Math.max(0, now - lastMovementAt.current);
    let targetYaw = 0;
    let targetPitch = 0;

    if (motionState === "holding") {
      [targetYaw, targetPitch] = clampD9AmbientOffset(
        pendingYaw.current,
        pendingPitch.current,
        policy,
      );
    }

    if (motionState === "returning" && lastMovementAt.current !== null) {
      // Drop the intent after its short hold so returning cannot remain dependent on a cursor at an edge.
      pendingYaw.current = 0;
      pendingPitch.current = 0;
      intentStartedAt.current = null;
      lastMovementAt.current = null;
      pointerSignal.current = {
        ...pointerSignal.current,
        pendingPitchRadians: 0,
        pendingYawRadians: 0,
      };
    }

    const damping =
      targetYaw === 0 && targetPitch === 0 ? policy.returnDamping : policy.responseDamping;
    appliedYaw.current = MathUtils.damp(appliedYaw.current, targetYaw, damping, deltaSeconds);
    appliedPitch.current = MathUtils.damp(appliedPitch.current, targetPitch, damping, deltaSeconds);
    // Finish at the literal authored quaternion once the deliberate return is visually settled instead of preserving sub-pixel drift.
    if (targetYaw === 0 && Math.abs(appliedYaw.current) < 0.001) {
      appliedYaw.current = 0;
    }
    if (targetPitch === 0 && Math.abs(appliedPitch.current) < 0.001) {
      appliedPitch.current = 0;
    }

    relativeEuler.current.set(appliedPitch.current, appliedYaw.current, 0, "YXZ");
    relativeQuaternion.current.setFromEuler(relativeEuler.current);
    camera.quaternion.copy(anchorQuaternion.current).multiply(relativeQuaternion.current);
    camera.updateMatrixWorld();

    // Keep compact renderer-local evidence without creating a DOM/control path in the normal visitor surface.
    if (diagnosticsEnabled) {
      const snapshot: D9AmbientCameraDiagnosticSnapshot = {
        appliedPitchDegrees: MathUtils.radToDeg(appliedPitch.current),
        appliedYawDegrees: MathUtils.radToDeg(appliedYaw.current),
        exactHome: appliedPitch.current === 0 && appliedYaw.current === 0,
        holdOrReturnState: motionState,
        idleMilliseconds,
        intentDelayActive: motionState === "intent-delay",
        normalizedPointer: [pointerSignal.current.normalizedX, pointerSignal.current.normalizedY],
        pendingPitchDegrees: MathUtils.radToDeg(pendingPitch.current),
        pendingYawDegrees: MathUtils.radToDeg(pendingYaw.current),
        pointerClientPosition: [pointerSignal.current.clientX, pointerSignal.current.clientY],
        pointerEventCount: pointerSignal.current.pointerEventCount,
        pointerType: pointerSignal.current.pointerType,
        state: stateName.current,
        targetPitchDegrees: MathUtils.radToDeg(targetPitch),
        targetYawDegrees: MathUtils.radToDeg(targetYaw),
      };
      gl.domElement.setAttribute(
        "data-d9-ambient-camera-offset-degrees",
        `${snapshot.appliedYawDegrees.toFixed(3)},${snapshot.appliedPitchDegrees.toFixed(3)}`,
      );
      gl.domElement.setAttribute("data-d9-ambient-camera-state", stateName.current);
      gl.domElement.setAttribute(
        "data-d9-ambient-camera-pointer-events",
        String(snapshot.pointerEventCount),
      );
      gl.domElement.setAttribute("data-d9-ambient-camera-pointer-type", snapshot.pointerType);
      gl.domElement.setAttribute("data-d9-ambient-camera-motion-state", snapshot.holdOrReturnState);
      onDiagnosticChange?.(snapshot);
    }
  });

  useEffect(() => {
    if (!diagnosticsEnabled) {
      onDiagnosticChange?.(null);
      return undefined;
    }

    return () => {
      onDiagnosticChange?.(null);
      for (const name of [
        "data-d9-ambient-camera-offset-degrees",
        "data-d9-ambient-camera-state",
        "data-d9-ambient-camera-pointer-events",
        "data-d9-ambient-camera-pointer-type",
        "data-d9-ambient-camera-motion-state",
      ]) {
        gl.domElement.removeAttribute(name);
      }
    };
  }, [diagnosticsEnabled, gl, onDiagnosticChange]);

  return null;
}
