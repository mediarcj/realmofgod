/**
 * File: apps/sanctuary/src/rendering/d9LivingSanctuaryPolicy.test.ts
 * Description: Covers the pure policy, bounded motion, and local scheduling rules for D9 sanctuary atmosphere.
 * Purpose: Prevents decorative rendering work from adding reducer authority, extra lights, rapid effects, or persistent event behavior.
 * Notes: Tests use only local deterministic values and never create a WebGL renderer, timer, storage entry, or network request.
 */

// Import the pure rendering-policy helpers so browser-independent tests can cover the D9.1 boundary directly.
import { describe, expect, it } from "vitest";

import {
  clampD9AtmosphereDeltaSeconds,
  createD9CloudEvent,
  createD9RareEventSchedule,
  d9CloudSofteningBounds,
  d9MaximumDustParticleCount,
  isD9CloudEventComplete,
  isD9NarrowLandscapeAtmosphereViewport,
  sampleD9CloudSoftening,
  sampleD9DaylightModulation,
  selectD9LivingSanctuaryPolicy,
  shouldD9AtmosphereScheduleFrames,
} from "./d9LivingSanctuaryPolicy";
import { d9VisitorSceneContract } from "./d9SanctuaryQuality";
import { STATIC_CANDLE_LIGHT_COUNT } from "./staticSanctuaryProof";

// Confirm that the environment keeps the approved two-light budget; map sampling itself is covered in the D9.1B focused test.
describe("D9 living sanctuary candle policy", () => {
  it("keeps exactly two authored candle lights without retaining a procedural motion authority", () => {
    expect(STATIC_CANDLE_LIGHT_COUNT).toBe(2);
    expect(d9VisitorSceneContract.candleLightCount).toBe(2);
  });
});

// Cover semantic visual differences without involving the sanctuary reducer or adding a third runtime light.
describe("D9 living sanctuary state policy", () => {
  it("keeps candle, daylight, dust, and rare-event choices rendering-only and state-specific", () => {
    const sanctuary = selectD9LivingSanctuaryPolicy({
      height: 1080,
      reducedMotion: false,
      state: "SANCTUARY",
      width: 1920,
    });
    const sit = selectD9LivingSanctuaryPolicy({
      height: 1080,
      reducedMotion: false,
      state: "SIT",
      width: 1920,
    });
    const read = selectD9LivingSanctuaryPolicy({
      height: 1080,
      reducedMotion: false,
      state: "READ",
      width: 1920,
    });
    const pray = selectD9LivingSanctuaryPolicy({
      height: 1080,
      reducedMotion: false,
      state: "PRAY",
      width: 1920,
    });

    expect(sit.candleWarmthAmount).toBeGreaterThan(sanctuary.candleWarmthAmount);
    expect(read.dustCount).toBeLessThan(sanctuary.dustCount);
    expect(read.allowCloudEvent).toBe(false);
    expect(pray.allowCloudEvent).toBe(false);
    expect(pray.daylightBase).toBeGreaterThan(sanctuary.daylightBase);
    expect(sanctuary.allowBirdAnimation).toBe(false);
  });

  it("returns reduced motion to near-true demand idle with static candle, dust, cloud, and bird behavior", () => {
    const policy = selectD9LivingSanctuaryPolicy({
      height: 1080,
      reducedMotion: true,
      state: "PRAY",
      width: 1920,
    });

    expect(policy.cadenceFramesPerSecond).toBe(0);
    expect(policy.candleMotionAmount).toBe(0);
    expect(policy.daylightVariation).toBe(0);
    expect(policy.dustCount).toBe(0);
    expect(policy.allowCloudEvent).toBe(false);
    expect(policy.allowBirdAnimation).toBe(false);
  });

  it("lowers the narrow-landscape atmosphere budget without inspecting browser identity", () => {
    const desktop = selectD9LivingSanctuaryPolicy({
      height: 1080,
      reducedMotion: false,
      state: "SANCTUARY",
      width: 1920,
    });
    const narrow = selectD9LivingSanctuaryPolicy({
      height: 390,
      reducedMotion: false,
      state: "SANCTUARY",
      width: 844,
    });

    expect(isD9NarrowLandscapeAtmosphereViewport(844, 390)).toBe(true);
    expect(narrow.cadenceFramesPerSecond).toBeLessThan(desktop.cadenceFramesPerSecond);
    expect(narrow.dustCount).toBeLessThan(desktop.dustCount);
    expect(narrow.dustCount).toBeLessThanOrEqual(d9MaximumDustParticleCount);
  });
});

// Keep rare local cloud timing slow, bounded, and unable to jump from clear to dim in one presentation frame.
describe("D9 living sanctuary rare cloud scheduler", () => {
  it("uses a long randomized local cooldown without any retained event history", () => {
    const earliest = createD9RareEventSchedule(1_000, () => 0);
    const latest = createD9RareEventSchedule(1_000, () => 1);

    expect(earliest.nextEligibleAtMilliseconds - 1_000).toBeGreaterThanOrEqual(95_000);
    expect(latest.nextEligibleAtMilliseconds - 1_000).toBeLessThanOrEqual(210_000);
    expect(latest.nextEligibleAtMilliseconds).toBeGreaterThan(earliest.nextEligibleAtMilliseconds);
  });

  it("creates a slow cloud softening that never exceeds the reviewed daylight reduction", () => {
    const event = createD9CloudEvent(1_000, () => 0.5);
    expect(event.fadeInMilliseconds).toBeGreaterThanOrEqual(8_000);
    expect(event.recoveryMilliseconds).toBeGreaterThanOrEqual(10_000);
    expect(event.intensityReduction).toBeGreaterThanOrEqual(d9CloudSofteningBounds.minimum);
    expect(event.intensityReduction).toBeLessThanOrEqual(d9CloudSofteningBounds.maximum);
    expect(sampleD9CloudSoftening(event, 1_000)).toBe(0);
    expect(isD9CloudEventComplete(event, 1_000)).toBe(false);
    expect(sampleD9CloudSoftening(event, 5_000)).toBeLessThan(event.intensityReduction);
    expect(sampleD9CloudSoftening(event, 9_000)).toBeGreaterThan(0);
    expect(sampleD9CloudSoftening(event, 30_000)).toBe(0);
    expect(isD9CloudEventComplete(event, 30_000)).toBe(true);
  });

  it("keeps normal daylight modulation deliberately small", () => {
    for (const seconds of [0, 10, 60, 180]) {
      const modulation = sampleD9DaylightModulation(seconds, 0.018);
      expect(modulation).toBeGreaterThan(0.98);
      expect(modulation).toBeLessThan(1.02);
    }
  });
});

// Cover visibility and reactivation helpers separately from real browser event listeners.
describe("D9 living sanctuary visibility safety", () => {
  it("pauses scheduling while hidden or reduced and caps resumed deltas before a visual burst", () => {
    expect(shouldD9AtmosphereScheduleFrames(false, false)).toBe(true);
    expect(shouldD9AtmosphereScheduleFrames(false, true)).toBe(false);
    expect(shouldD9AtmosphereScheduleFrames(true, false)).toBe(false);
    expect(clampD9AtmosphereDeltaSeconds(12)).toBe(0.1);
    expect(clampD9AtmosphereDeltaSeconds(Number.NaN)).toBe(0);
  });
});
