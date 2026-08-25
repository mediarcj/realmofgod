/**
 * File: apps/sanctuary/src/rendering/d9AmbientCameraPolicy.ts
 * Description: Defines the bounded D9 pointer-camera policy and pure coordinate helpers.
 * Purpose: Lets renderer code and focused tests share one calm, Canvas-relative camera contract.
 * Notes: This module has no DOM, renderer, storage, network, or visitor-state side effects.
 */

// Import only Three's stable angle and clamp helpers for the renderer-local camera safety envelope.
import { MathUtils } from "three";

import type { SanctuaryMvpState } from "../sanctuary/model";

// Describe the deliberate response envelope that keeps the camera tethered to its authored D7.5 endpoint.
export interface D9AmbientCameraPolicy {
  readonly enabled: boolean;
  readonly holdMilliseconds: number;
  readonly intentDelayMilliseconds: number;
  readonly maxPitchRadians: number;
  readonly maxYawRadians: number;
  readonly responseDamping: number;
  readonly returnDamping: number;
}

// Describe one stable Canvas-relative pointer sample retained only for developer diagnostics.
export interface D9AmbientPointerCoordinates {
  readonly clientX: number;
  readonly clientY: number;
  readonly normalizedX: number;
  readonly normalizedY: number;
}

// Accept only a pointer that falls inside the active sanctuary viewport when listening at the stable window boundary.
export function isD9PointerWithinViewport(
  clientX: number,
  clientY: number,
  viewport: Pick<DOMRect, "bottom" | "left" | "right" | "top">,
): boolean {
  return (
    clientX >= viewport.left &&
    clientX <= viewport.right &&
    clientY >= viewport.top &&
    clientY <= viewport.bottom
  );
}

// Describe the compact evidence retained by the development-only diagnostics fragment after an ordinary mouse signal.
export interface D9AmbientPointerSignal extends D9AmbientPointerCoordinates {
  readonly pendingPitchRadians: number;
  readonly pendingYawRadians: number;
  readonly pointerEventCount: number;
  readonly pointerType: string;
}

// Keep settled states and reduced motion on the literal authored endpoint.
const staticPolicy: D9AmbientCameraPolicy = {
  enabled: false,
  holdMilliseconds: 450,
  intentDelayMilliseconds: 150,
  maxPitchRadians: 0,
  maxYawRadians: 0,
  responseDamping: 0,
  returnDamping: 0,
};

// Keep living-camera values inside the owner-approved proof envelope, not a free-navigation range.
const movingPolicy: D9AmbientCameraPolicy = {
  enabled: true,
  holdMilliseconds: 460,
  intentDelayMilliseconds: 150,
  maxPitchRadians: MathUtils.degToRad(1.5),
  maxYawRadians: MathUtils.degToRad(3),
  responseDamping: 5.2,
  returnDamping: 1.65,
};

// Use an unmistakable but bounded envelope only behind the development diagnostic control to prove camera mechanics.
const diagnosticMovingPolicy: D9AmbientCameraPolicy = {
  ...movingPolicy,
  maxPitchRadians: MathUtils.degToRad(2.5),
  maxYawRadians: MathUtils.degToRad(5),
};

// Select only the two approved living-camera states; READ and PRAY remain stable reading/reflection endpoints.
export function selectD9AmbientCameraPolicy(
  state: SanctuaryMvpState["name"],
  reducedMotion: boolean,
  diagnosticMotionOverride = false,
): D9AmbientCameraPolicy {
  if (state !== "SANCTUARY" && state !== "SIT") {
    return staticPolicy;
  }
  // The override is supplied only from a development diagnostic route and never changes the normal visitor route.
  if (diagnosticMotionOverride) {
    return diagnosticMovingPolicy;
  }
  return reducedMotion ? staticPolicy : movingPolicy;
}

// Clamp every requested offset before it reaches mutable camera state so the view cannot drift or spin.
export function clampD9AmbientOffset(
  yawRadians: number,
  pitchRadians: number,
  policy: D9AmbientCameraPolicy,
): readonly [number, number] {
  return [
    MathUtils.clamp(yawRadians, -policy.maxYawRadians, policy.maxYawRadians),
    MathUtils.clamp(pitchRadians, -policy.maxPitchRadians, policy.maxPitchRadians),
  ];
}

// Normalize a client pointer against the actual Canvas rectangle so edge position remains meaningful without movement deltas.
export function normalizeD9AmbientPointer(
  clientX: number,
  clientY: number,
  canvasRect: Pick<DOMRect, "height" | "left" | "top" | "width">,
): D9AmbientPointerCoordinates {
  const normalizedX = canvasRect.width === 0 ? 0 : (clientX - canvasRect.left) / canvasRect.width;
  const normalizedY = canvasRect.height === 0 ? 0 : (clientY - canvasRect.top) / canvasRect.height;

  return {
    clientX,
    clientY,
    normalizedX: MathUtils.clamp(normalizedX, 0, 1),
    normalizedY: MathUtils.clamp(normalizedY, 0, 1),
  };
}

// Convert one stable pointer position into a calm camera target rather than accumulating unreliable pointer movement deltas.
export function applyD9AmbientPointerSignal(
  prior: D9AmbientPointerSignal,
  coordinates: D9AmbientPointerCoordinates,
  pointerType: string,
  policy: D9AmbientCameraPolicy,
): D9AmbientPointerSignal {
  const [pendingYawRadians, pendingPitchRadians] = clampD9AmbientOffset(
    (coordinates.normalizedX - 0.5) * policy.maxYawRadians * 2,
    (0.5 - coordinates.normalizedY) * policy.maxPitchRadians * 2,
    policy,
  );

  return {
    ...coordinates,
    pendingPitchRadians,
    pendingYawRadians,
    pointerEventCount: prior.pointerEventCount + 1,
    pointerType,
  };
}

// Decide the time-bounded motion phase in one pure helper so an idle pointer is always directed home.
export function selectD9AmbientMotionState({
  intentStartedAt,
  lastMovementAt,
  now,
  policy,
}: {
  readonly intentStartedAt: number | null;
  readonly lastMovementAt: number | null;
  readonly now: number;
  readonly policy: D9AmbientCameraPolicy;
}): "disabled" | "holding" | "intent-delay" | "returning" {
  if (!policy.enabled) {
    return "disabled";
  }

  if (intentStartedAt === null || lastMovementAt === null) {
    return "returning";
  }

  if (now - intentStartedAt < policy.intentDelayMilliseconds) {
    return "intent-delay";
  }

  return now - lastMovementAt <= policy.holdMilliseconds ? "holding" : "returning";
}
