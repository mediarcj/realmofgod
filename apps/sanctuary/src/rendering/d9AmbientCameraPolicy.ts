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
  holdMilliseconds: 340,
  intentDelayMilliseconds: 180,
  maxPitchRadians: MathUtils.degToRad(0.7),
  maxYawRadians: MathUtils.degToRad(1.45),
  responseDamping: 1.65,
  returnDamping: 1.1,
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
