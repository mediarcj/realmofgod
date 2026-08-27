/**
 * File: apps/sanctuary/src/rendering/d91bBlenderCandleMotion.ts
 * Description: Adapts the approved Blender candle map into exact, local Three scene transforms.
 * Purpose: Preserves the owner-approved left and right authored motion rather than recreating it with procedural browser animation.
 * Notes: This module reads one local JSON asset, creates no renderer, and does not access browser storage, network, or visitor data.
 */

// Import only the local baked motion data and small Three scene primitives needed for a reversible flame pivot.
import approvedMotionReference from "../assets/animation/realm-candle-motion-reference-v1.json";
import { Box3, Group, MathUtils, Object3D, Vector3 } from "three";

import { authoredCandleFlameNames } from "./staticSanctuaryProof";

// Name the two authored candle streams so map parsing and the runtime cannot create an unapproved third candle source.
export const d91bCandleSides = ["left", "right"] as const;

export type D91BCandleSide = (typeof d91bCandleSides)[number];

interface D91BMotionSample {
  readonly frame: number;
  readonly lean_depth_deg: number;
  readonly lean_main_deg: number;
  readonly light_multiplier: number;
  readonly seconds: number;
  readonly stretch: number;
}

interface D91BMotionCandle {
  readonly flame_height_world: number;
  readonly flame_object: string;
  readonly flame_width_world: number;
  readonly light_object: string;
  readonly rig_object: string;
  readonly samples: readonly D91BMotionSample[];
}

interface D91BMotionReference {
  readonly candles: Record<D91BCandleSide, D91BMotionCandle>;
  readonly schema: string;
}

// Treat the checked-in map as untrusted structure at the import boundary, then fail early if a future edit changes its contract.
function assertD91BMotionReference(value: unknown): asserts value is D91BMotionReference {
  if (typeof value !== "object" || value === null) {
    throw new Error("The approved Blender candle reference must be an object.");
  }
  const reference = value as Partial<D91BMotionReference>;
  if (reference.schema !== "realm-candle-motion-reference-v1" || reference.candles === undefined) {
    throw new Error("The approved Blender candle reference has an unexpected schema.");
  }
  for (const side of d91bCandleSides) {
    const candle = reference.candles[side];
    if (candle.samples.length < 2) {
      throw new Error(`The approved Blender candle reference is missing the ${side} stream.`);
    }
  }
}

assertD91BMotionReference(approvedMotionReference);

// Export the validated asset once so tests can check its source schema and all runtime readers share one immutable reference.
export const d91bBlenderCandleMotionReference = approvedMotionReference;

// Derive the seamless duration from the authored final sample instead of duplicating a timing constant in browser code.
export const d91bCandleLoopSeconds =
  d91bBlenderCandleMotionReference.candles.left.samples.at(-1)?.seconds ?? 0;

// Preserve the exact visible GLB flame roots, which are the only scene objects this module is allowed to reparent.
export const d91bCandleFlameNames: Record<D91BCandleSide, string> = {
  left: authoredCandleFlameNames[0],
  right: authoredCandleFlameNames[1],
};

// Keep a compact transform response distinct from the source sample so a semantic state can reduce amplitude without changing time or phase.
export interface D91BFlamePivotTransform {
  readonly lightMultiplier: number;
  readonly rotationX: number;
  readonly rotationZ: number;
  readonly scaleY: number;
}

export interface D91BFlameRuntimeRig {
  readonly pivot: Group;
  readonly source: Object3D;
}

// Repeat the authored loop through its intentional duplicated seam sample, with no procedural interpolation curve or random variation.
function wrapD91BLoopSeconds(seconds: number): number {
  if (!Number.isFinite(seconds) || d91bCandleLoopSeconds <= 0) {
    return 0;
  }
  const wrapped = seconds % d91bCandleLoopSeconds;
  return wrapped < 0 ? wrapped + d91bCandleLoopSeconds : wrapped;
}

// Blend two adjacent baked samples linearly so browser presentation follows the authored map between Blender's captured frames.
function interpolateD91BMotionSample(
  before: D91BMotionSample,
  after: D91BMotionSample,
  seconds: number,
): D91BMotionSample {
  const span = after.seconds - before.seconds;
  const progress = span <= 0 ? 0 : MathUtils.clamp((seconds - before.seconds) / span, 0, 1);
  const blend = (first: number, second: number): number => MathUtils.lerp(first, second, progress);
  return {
    frame: blend(before.frame, after.frame),
    lean_depth_deg: blend(before.lean_depth_deg, after.lean_depth_deg),
    lean_main_deg: blend(before.lean_main_deg, after.lean_main_deg),
    light_multiplier: blend(before.light_multiplier, after.light_multiplier),
    seconds,
    stretch: blend(before.stretch, after.stretch),
  };
}

// Sample one named approved stream without coupling the left and right candle phases in any browser-side helper.
export function sampleD91BBlenderCandleMotion(
  side: D91BCandleSide,
  seconds: number,
): D91BMotionSample {
  const samples = d91bBlenderCandleMotionReference.candles[side].samples;
  const loopSeconds = wrapD91BLoopSeconds(seconds);
  for (let index = 1; index < samples.length; index += 1) {
    const after = samples[index];
    const before = samples[index - 1];
    if (after !== undefined && before !== undefined && loopSeconds <= after.seconds) {
      return interpolateD91BMotionSample(before, after, loopSeconds);
    }
  }
  const first = samples[0];
  if (first === undefined) {
    throw new Error(`The approved Blender ${side} stream has no samples.`);
  }
  return first;
}

// Convert Blender's X/Y rig lean and Z stretch into the inspected glTF/Three axes: X depth, negative Z main, and Y stretch.
export function mapD91BBlenderSampleToThree(
  sample: D91BMotionSample,
  motionAmount: number,
): D91BFlamePivotTransform {
  const amount = MathUtils.clamp(motionAmount, 0, 1);
  return {
    lightMultiplier: MathUtils.lerp(1, sample.light_multiplier, amount),
    rotationX: MathUtils.degToRad(sample.lean_depth_deg) * amount,
    rotationZ: -MathUtils.degToRad(sample.lean_main_deg) * amount,
    scaleY: 1 + (sample.stretch - 1) * amount,
  };
}

// Reparent one visible flame at its own world-space base so its existing mesh transform stays exact while the new pivot owns only approved motion.
function createD91BFlamePivot(scene: Object3D, side: D91BCandleSide): D91BFlameRuntimeRig {
  const source = scene.getObjectByName(d91bCandleFlameNames[side]);
  if (source === undefined) {
    throw new Error(`The sanctuary scene is missing the approved ${side} flame root.`);
  }
  const existingPivot = source.parent;
  if (existingPivot === null) {
    throw new Error(`The sanctuary scene is missing the approved ${side} flame parent.`);
  }
  const expectedPivotName = `D91B_${side}_ApprovedFlamePivot`;
  if (existingPivot.name === expectedPivotName) {
    return { pivot: existingPivot as Group, source };
  }

  scene.updateWorldMatrix(true, true);
  const bounds = new Box3().setFromObject(source);
  const baseWorld = new Vector3(
    (bounds.min.x + bounds.max.x) / 2,
    bounds.min.y,
    (bounds.min.z + bounds.max.z) / 2,
  );
  const pivot = new Group();
  pivot.name = expectedPivotName;
  existingPivot.add(pivot);
  existingPivot.worldToLocal(baseWorld);
  pivot.position.copy(baseWorld);
  pivot.updateWorldMatrix(true, false);
  // Object3D.attach preserves the mesh world transform, including its original position, quaternion, scale, and any descendants.
  pivot.attach(source);
  scene.updateWorldMatrix(true, true);
  return { pivot, source };
}

// Create both isolated pivots once per prepared scene, keeping the candle bodies, wicks, table, Bible, and cross outside this transform boundary.
export function prepareD91BBlenderCandleMotion(
  scene: Object3D,
): Record<D91BCandleSide, D91BFlameRuntimeRig> {
  return {
    left: createD91BFlamePivot(scene, "left"),
    right: createD91BFlamePivot(scene, "right"),
  };
}

// Apply a map sample through the dedicated pivot; a zero amount is an exact neutral pivot with a stable unit light multiplier.
export function applyD91BBlenderCandleMotion(
  rig: D91BFlameRuntimeRig,
  side: D91BCandleSide,
  seconds: number,
  motionAmount: number,
): D91BFlamePivotTransform {
  const transform = mapD91BBlenderSampleToThree(
    sampleD91BBlenderCandleMotion(side, seconds),
    motionAmount,
  );
  rig.pivot.rotation.set(transform.rotationX, 0, transform.rotationZ);
  rig.pivot.scale.set(1, transform.scaleY, 1);
  return transform;
}

// Return a pivot to its exact neutral transform during teardown so a remount cannot accumulate an animation offset.
export function restoreD91BBlenderCandleMotion(rig: D91BFlameRuntimeRig): void {
  rig.pivot.rotation.set(0, 0, 0);
  rig.pivot.scale.set(1, 1, 1);
}
