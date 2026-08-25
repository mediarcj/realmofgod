/**
 * File: apps/sanctuary/src/rendering/d9AmbientCameraPolicy.ts
 * Description: Defines the bounded D9 pointer-camera policy and pure clamp helper.
 * Purpose: Lets renderer code and focused tests share one small safety contract without exposing navigation controls.
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

// Describe the compact evidence retained by the development-only diagnostics fragment after an ordinary mouse signal.
export interface D9AmbientPointerSignal {
  readonly pendingPitchRadians: number;
  readonly pendingYawRadians: number;
  readonly pointerEventCount: number;
  readonly pointerType: string;
}

// Keep settled states and reduced motion on the literal authored endpoint.
const staticPolicy: D9AmbientCameraPolicy = {
  enabled: false,
  holdMilliseconds: 340,
  intentDelayMilliseconds: 180,
  maxPitchRadians: 0,
  maxYawRadians: 0,
  responseDamping: 0,
  returnDamping: 0,
};

// Keep living-camera values below the owner-approved maximum so the scene can never become free navigation.
const movingPolicy: D9AmbientCameraPolicy = {
  enabled: true,
  holdMilliseconds: 520,
  intentDelayMilliseconds: 150,
  maxPitchRadians: MathUtils.degToRad(1.15),
  maxYawRadians: MathUtils.degToRad(2.4),
  responseDamping: 4.2,
  returnDamping: 0.55,
};

// Select only the two approved living-camera states; READ and PRAY remain stable reading/reflection endpoints.
export function selectD9AmbientCameraPolicy(
  state: SanctuaryMvpState["name"],
  reducedMotion: boolean,
): D9AmbientCameraPolicy {
  return reducedMotion || (state !== "SANCTUARY" && state !== "SIT") ? staticPolicy : movingPolicy;
}

// Clamp every accumulated pointer impulse before it reaches mutable camera state so the view cannot drift or spin.
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

// Accumulate one browser pointer sample in a pure helper so focused tests can prove that a real signal reaches the camera policy.
export function applyD9AmbientPointerSignal(
  prior: D9AmbientPointerSignal,
  movementX: number,
  movementY: number,
  pointerType: string,
): D9AmbientPointerSignal {
  return {
    pendingPitchRadians: prior.pendingPitchRadians + movementY * 0.00075,
    pendingYawRadians: prior.pendingYawRadians + movementX * 0.0014,
    pointerEventCount: prior.pointerEventCount + 1,
    pointerType,
  };
}
