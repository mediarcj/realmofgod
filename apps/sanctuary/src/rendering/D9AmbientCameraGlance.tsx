/**
 * File: apps/sanctuary/src/rendering/D9AmbientCameraGlance.tsx
 * Description: Applies a tightly bounded pointer-delta camera glance around each locked D7.5 endpoint.
 * Purpose: Gives the SANCTUARY and SIT views a slow living response without introducing free camera control.
 * Notes: This renderer-local component keeps no React frame state, never changes position, and fully disables for touch/reduced motion.
 */

// Import only renderer-local hooks and stable Three math needed to offset a camera quaternion around its authored anchor.
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, type ReactNode } from "react";
import { Euler, MathUtils, Matrix4, Quaternion, Vector3 } from "three";

import type { SanctuaryMvpState } from "../sanctuary/model";
import { d75SanctuaryCameras } from "./d75SanctuaryCamera";
import { clampD9AmbientOffset, selectD9AmbientCameraPolicy } from "./d9AmbientCameraPolicy";

// Apply a local yaw/pitch quaternion over the immutable D7.5 orientation without moving the authored camera position.
function buildAnchorQuaternion(state: SanctuaryMvpState["name"]): Quaternion {
  const authored = d75SanctuaryCameras[state];
  const position = new Vector3(...authored.position);
  const target = position.clone().add(new Vector3(...authored.forward));
  return new Quaternion().setFromRotationMatrix(
    new Matrix4().lookAt(position, target, new Vector3(...authored.up)),
  );
}

// Keep raw browser movement in refs so normal pointer frames never create React application updates.
export function D9AmbientCameraGlance({
  reducedMotion,
  state,
}: {
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
      pendingYaw.current += event.movementX * 0.0014;
      pendingPitch.current += event.movementY * 0.00075;
    };
    canvas.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => {
      canvas.removeEventListener("pointermove", handlePointerMove);
    };
  }, [gl, policy.enabled]);

  useFrame((_, deltaSeconds) => {
    const now = performance.now();
    const startedAt = intentStartedAt.current;
    const lastMovement = lastMovementAt.current;
    let targetYaw = 0;
    let targetPitch = 0;

    if (
      policy.enabled &&
      startedAt !== null &&
      lastMovement !== null &&
      now - startedAt >= policy.intentDelayMilliseconds
    ) {
      const [clampedYaw, clampedPitch] = clampD9AmbientOffset(
        pendingYaw.current,
        pendingPitch.current,
        policy,
      );
      if (now - lastMovement <= policy.holdMilliseconds) {
        targetYaw = clampedYaw;
        targetPitch = clampedPitch;
      }
      if (now - lastMovement > policy.holdMilliseconds) {
        pendingYaw.current = 0;
        pendingPitch.current = 0;
        intentStartedAt.current = null;
        lastMovementAt.current = null;
      }
    }

    const damping =
      targetYaw === 0 && targetPitch === 0 ? policy.returnDamping : policy.responseDamping;
    appliedYaw.current = MathUtils.damp(appliedYaw.current, targetYaw, damping, deltaSeconds);
    appliedPitch.current = MathUtils.damp(appliedPitch.current, targetPitch, damping, deltaSeconds);
    // Finish at the literal authored quaternion once the deliberate return is visually settled instead of preserving a sub-pixel drift forever.
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

    // Keep a compact renderer-local diagnostic without creating a DOM/control path in the normal visitor surface.
    gl.domElement.setAttribute(
      "data-d9-ambient-camera-offset-degrees",
      `${MathUtils.radToDeg(appliedYaw.current).toFixed(3)},${MathUtils.radToDeg(appliedPitch.current).toFixed(3)}`,
    );
    gl.domElement.setAttribute("data-d9-ambient-camera-state", stateName.current);
  });

  return null;
}
