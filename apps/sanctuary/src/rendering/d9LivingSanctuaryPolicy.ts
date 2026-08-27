/**
 * File: apps/sanctuary/src/rendering/d9LivingSanctuaryPolicy.ts
 * Description: Defines pure, bounded atmosphere policy and timing helpers for the D9 sanctuary.
 * Purpose: Keeps visual life separate from the semantic journey reducer, browser storage, and renderer component details.
 * Notes: Values are intentionally modest and local; no helper reads device identity, persists a seed, or contacts a service.
 */

// Import only small math helpers so policy tests can run without a renderer or browser document.
import { MathUtils } from "three";

import type { SanctuaryMvpState } from "../sanctuary/model";

// Name the two authored candle channels once so the visual layer cannot grow a third decorative light source.
export const d9CandleChannels = [
  { key: "left", phase: 0.41, swayRate: 0.73 },
  { key: "right", phase: 2.17, swayRate: 0.61 },
] as const;

export type D9CandleChannelKey = (typeof d9CandleChannels)[number]["key"];

// Describe the small state-targeted values that the rendering layer may crossfade without changing journey meaning.
export interface D9LivingSanctuaryPolicy {
  readonly allowCloudEvent: boolean;
  readonly allowBirdAnimation: false;
  readonly cadenceFramesPerSecond: number;
  readonly candleMotionAmount: number;
  readonly candleWarmthAmount: number;
  readonly daylightBase: number;
  readonly daylightVariation: number;
  readonly dustCount: number;
  readonly dustOpacity: number;
  readonly reducedMotion: boolean;
  readonly state: SanctuaryMvpState["name"];
}

// Keep the particle count deliberately small before the per-state policy lowers it further.
export const d9MaximumDustParticleCount = 36;

// Bound light changes tightly enough that candle and daylight life cannot look like a flashing effect.
export const d9CandleLightBounds = {
  maximum: 1.04,
  minimum: 0.96,
} as const;

export const d9CloudSofteningBounds = {
  maximum: 0.12,
  minimum: 0.05,
} as const;

// Treat only the approved narrow landscape geometry as the lower-cost atmosphere case.
export function isD9NarrowLandscapeAtmosphereViewport(width: number, height: number): boolean {
  return width >= height && width <= 900 && height <= 500;
}

// Select semantic-state presentation targets without importing or updating the reducer.
function selectD9StateAtmospherePolicy(
  state: SanctuaryMvpState["name"],
): Omit<D9LivingSanctuaryPolicy, "cadenceFramesPerSecond" | "reducedMotion"> {
  switch (state) {
    case "SIT":
      return {
        allowCloudEvent: true,
        allowBirdAnimation: false,
        candleMotionAmount: 0.88,
        candleWarmthAmount: 1.03,
        daylightBase: 0.985,
        daylightVariation: 0.014,
        dustCount: 22,
        dustOpacity: 0.18,
        state,
      };
    case "READ":
      return {
        allowCloudEvent: false,
        allowBirdAnimation: false,
        candleMotionAmount: 0.48,
        candleWarmthAmount: 0.98,
        daylightBase: 0.975,
        daylightVariation: 0.004,
        dustCount: 6,
        dustOpacity: 0.09,
        state,
      };
    case "PRAY":
      return {
        allowCloudEvent: false,
        allowBirdAnimation: false,
        candleMotionAmount: 0.62,
        candleWarmthAmount: 1.0,
        daylightBase: 1.055,
        daylightVariation: 0.012,
        dustCount: 26,
        dustOpacity: 0.2,
        state,
      };
    case "SANCTUARY":
      return {
        allowCloudEvent: true,
        allowBirdAnimation: false,
        candleMotionAmount: 1,
        candleWarmthAmount: 1,
        daylightBase: 1,
        daylightVariation: 0.018,
        dustCount: 30,
        dustOpacity: 0.18,
        state,
      };
  }
}

// Select a modest update rate that leaves the ordinary visitor renderer in demand mode instead of display-refresh rendering.
function selectD9AtmosphereCadenceFramesPerSecond(narrowLandscape: boolean): number {
  return narrowLandscape ? 22 : 28;
}

// Build the complete local policy from semantic state, viewport geometry, and the existing reduced-motion choice.
export function selectD9LivingSanctuaryPolicy({
  height,
  reducedMotion,
  state,
  width,
}: {
  readonly height: number;
  readonly reducedMotion: boolean;
  readonly state: SanctuaryMvpState["name"];
  readonly width: number;
}): D9LivingSanctuaryPolicy {
  const narrowLandscape = isD9NarrowLandscapeAtmosphereViewport(width, height);
  const base = selectD9StateAtmospherePolicy(state);

  if (reducedMotion) {
    return {
      ...base,
      allowCloudEvent: false,
      cadenceFramesPerSecond: 0,
      candleMotionAmount: 0,
      daylightVariation: 0,
      dustCount: 0,
      reducedMotion: true,
    };
  }

  return {
    ...base,
    cadenceFramesPerSecond: selectD9AtmosphereCadenceFramesPerSecond(narrowLandscape),
    dustCount: narrowLandscape ? Math.max(3, Math.floor(base.dustCount * 0.58)) : base.dustCount,
    reducedMotion: false,
  };
}

// Produce a small composite signal rather than one recognizably repeating sine wave for a candle channel.
function sampleD9IrregularSignal(seconds: number, phase: number, rate: number): number {
  const slowSway = Math.sin(seconds * rate + phase);
  const slowerCorrection = Math.sin(seconds * rate * 0.37 + phase * 2.3) * 0.42;
  const fineCorrection = Math.sin(seconds * rate * 1.91 + phase * 4.7) * 0.16;
  return (slowSway + slowerCorrection + fineCorrection) / 1.58;
}

// Describe only transform-level flame life so the authored mesh can remain the source of flame shape and material.
export function sampleD9CandleFlame(
  channel: (typeof d9CandleChannels)[number],
  seconds: number,
): {
  readonly leanX: number;
  readonly leanZ: number;
  readonly lightMultiplier: number;
  readonly stretchY: number;
} {
  const primary = sampleD9IrregularSignal(seconds, channel.phase, channel.swayRate);
  const lateral = sampleD9IrregularSignal(seconds, channel.phase + 0.91, channel.swayRate * 0.83);
  // Keep the light related to, but intentionally out of phase with, visible flame movement.
  const lightSignal = sampleD9IrregularSignal(
    seconds,
    channel.phase + 1.74,
    channel.swayRate * 1.17,
  );

  return {
    leanX: primary * 0.035,
    leanZ: lateral * 0.026,
    lightMultiplier: MathUtils.clamp(
      1 + lightSignal * 0.038,
      d9CandleLightBounds.minimum,
      d9CandleLightBounds.maximum,
    ),
    stretchY: 1 + primary * 0.018,
  };
}

// Keep the ordinary slow exterior modulation below the threshold of an obvious daylight animation.
export function sampleD9DaylightModulation(seconds: number, variation: number): number {
  const slow = Math.sin(seconds * 0.065 + 0.8) * 0.68;
  const uneven = Math.sin(seconds * 0.019 + 2.4) * 0.32;
  return 1 + (slow + uneven) * variation;
}

// Describe a rare local cloud event with long cooldowns and slow ramps; this contains no history after reload.
export interface D9CloudEvent {
  readonly fadeInMilliseconds: number;
  readonly holdMilliseconds: number;
  readonly intensityReduction: number;
  readonly recoveryMilliseconds: number;
  readonly startsAtMilliseconds: number;
}

export interface D9RareEventSchedule {
  readonly nextEligibleAtMilliseconds: number;
}

const d9CloudEventCooldownBounds = {
  maximum: 210_000,
  minimum: 95_000,
} as const;

// Keep a fresh local schedule deliberately long so a visitor has no learnable repeating attraction.
export function createD9RareEventSchedule(
  nowMilliseconds: number,
  random: () => number,
): D9RareEventSchedule {
  const fraction = MathUtils.clamp(random(), 0, 1);
  return {
    nextEligibleAtMilliseconds:
      nowMilliseconds +
      d9CloudEventCooldownBounds.minimum +
      (d9CloudEventCooldownBounds.maximum - d9CloudEventCooldownBounds.minimum) * fraction,
  };
}

// Create one slow softening event when the local scheduler reaches a legal state-specific opportunity.
export function createD9CloudEvent(nowMilliseconds: number, random: () => number): D9CloudEvent {
  const fraction = MathUtils.clamp(random(), 0, 1);
  return {
    fadeInMilliseconds: 8_000,
    holdMilliseconds: 6_000,
    intensityReduction:
      d9CloudSofteningBounds.minimum +
      (d9CloudSofteningBounds.maximum - d9CloudSofteningBounds.minimum) * fraction,
    recoveryMilliseconds: 10_000,
    startsAtMilliseconds: nowMilliseconds,
  };
}

// Sample a cloud event through gradual ramps so it cannot create a light flash or a sharp shadow transition.
export function sampleD9CloudSoftening(event: D9CloudEvent, nowMilliseconds: number): number {
  const elapsed = Math.max(0, nowMilliseconds - event.startsAtMilliseconds);
  const fadeEnd = event.fadeInMilliseconds;
  const holdEnd = fadeEnd + event.holdMilliseconds;
  const recoveryEnd = holdEnd + event.recoveryMilliseconds;

  if (elapsed >= recoveryEnd) {
    return 0;
  }
  if (elapsed <= fadeEnd) {
    return event.intensityReduction * (elapsed / fadeEnd);
  }
  if (elapsed <= holdEnd) {
    return event.intensityReduction;
  }
  return event.intensityReduction * (1 - (elapsed - holdEnd) / event.recoveryMilliseconds);
}

// Keep event completion distinct from a zero-strength first frame so a new cloud can finish its gradual fade-in.
export function isD9CloudEventComplete(event: D9CloudEvent, nowMilliseconds: number): boolean {
  return (
    nowMilliseconds >=
    event.startsAtMilliseconds +
      event.fadeInMilliseconds +
      event.holdMilliseconds +
      event.recoveryMilliseconds
  );
}

// Make the visibility boundary testable without making document.hidden part of application state.
export function shouldD9AtmosphereScheduleFrames(
  reducedMotion: boolean,
  documentHidden: boolean,
): boolean {
  return !reducedMotion && !documentHidden;
}

// Cap wall-clock deltas after visibility changes so particles and local effects never catch up in one visible burst.
export function clampD9AtmosphereDeltaSeconds(deltaSeconds: number): number {
  return MathUtils.clamp(Number.isFinite(deltaSeconds) ? deltaSeconds : 0, 0, 0.1);
}
