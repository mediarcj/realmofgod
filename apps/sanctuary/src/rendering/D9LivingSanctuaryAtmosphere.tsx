/**
 * File: apps/sanctuary/src/rendering/D9LivingSanctuaryAtmosphere.tsx
 * Description: Renders restrained local candle, daylight, dust, and rare-cloud presentation life for the D9 sanctuary.
 * Purpose: Makes the still visitor viewpoint feel quietly inhabited without giving rendering authority over journey meaning.
 * Notes: This layer uses no network, browser storage, telemetry, visitor content, or per-frame React application state.
 */

// Import the renderer hooks, local refs, and compact Three primitives used by this decorative-only presentation layer.
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import {
  BufferAttribute,
  DirectionalLight,
  DynamicDrawUsage,
  MathUtils,
  Object3D,
  PointLight,
  Points,
} from "three";

import type { SanctuaryMvpState } from "../sanctuary/model";
import {
  applyD91BBlenderCandleMotion,
  d91bCandleLoopSeconds,
  prepareD91BBlenderCandleMotion,
  restoreD91BBlenderCandleMotion,
  sampleD91BBlenderCandleMotion,
  type D91BCandleSide,
  type D91BFlameRuntimeRig,
} from "./d91bBlenderCandleMotion";
import {
  applyD91CCandlePresentation,
  d91cAuthoredWickNames,
  d91cMaximumSmokeSprites,
  d91cPerceptualGain,
  prepareD91CCandlePresentation,
  restoreD91CCandlePresentation,
  type D91CCandlePresentationRig,
} from "./d91cCandleFidelity";
import {
  clampD9AtmosphereDeltaSeconds,
  createD9CloudEvent,
  createD9RareEventSchedule,
  d9MaximumDustParticleCount,
  isD9CloudEventComplete,
  sampleD9CloudSoftening,
  sampleD9DaylightModulation,
  selectD9LivingSanctuaryPolicy,
  shouldD9AtmosphereScheduleFrames,
  type D9CloudEvent,
  type D9DustProfile,
} from "./d9LivingSanctuaryPolicy";
import type { VisualCalibration } from "./visualCalibration";

// Keep renderer-only crossfade values together so semantic state changes do not cause abrupt lighting changes.
interface D9AtmosphereCurrentValues {
  candleMotionAmount: number;
  candleWarmthAmount: number;
  daylightBase: number;
  daylightVariation: number;
  dustOpacity: number;
}

// Build each state-specific dust grouping around real camera-visible light, retaining substantially more empty air than visible decoration.
function createD9DustBasePositions(profile: D9DustProfile): Float32Array {
  const basePositions = new Float32Array(d9MaximumDustParticleCount * 3);

  // Keep the four quiet READ motes high and away from the Bible so the reading surface remains the visual priority.
  const profileBounds =
    profile === "read-quiet"
      ? { centerX: 0, centerY: 3.22, centerZ: 0.08, spreadX: 1.55, spreadY: 0.58, spreadZ: 1.05 }
      : profile === "sit-table-warmth"
        ? { centerX: 0, centerY: 2.48, centerZ: 0.26, spreadX: 2.5, spreadY: 1.55, spreadZ: 1.7 }
        : profile === "pray-upper-light"
          ? {
              centerX: 0,
              centerY: 3.08,
              centerZ: -0.12,
              spreadX: 2.25,
              spreadY: 2.28,
              spreadZ: 1.58,
            }
          : { centerX: 0, centerY: 2.78, centerZ: 0.1, spreadX: 3.65, spreadY: 2.3, spreadZ: 2.2 };

  for (let index = 0; index < d9MaximumDustParticleCount; index += 1) {
    const offset = index * 3;
    // Use deterministic low-discrepancy placement instead of a runtime random history or an obvious particle grid.
    basePositions[offset] =
      profileBounds.centerX + (((index * 0.618_033_988_75) % 1) - 0.5) * profileBounds.spreadX;
    basePositions[offset + 1] =
      profileBounds.centerY +
      (((index * 0.754_877_666_25 + 0.13) % 1) - 0.5) * profileBounds.spreadY;
    basePositions[offset + 2] =
      profileBounds.centerZ +
      (((index * 0.414_213_562_37 + 0.21) % 1) - 0.5) * profileBounds.spreadZ;
  }

  return basePositions;
}

// Render one isolated decoration layer whose inputs are visual state and existing authored scene objects only.
export function D9LivingSanctuaryAtmosphere({
  reducedMotion,
  scene,
  state,
  visualCalibration,
}: {
  readonly reducedMotion: boolean;
  readonly scene: Object3D;
  readonly state: SanctuaryMvpState;
  readonly visualCalibration: VisualCalibration;
}): ReactNode {
  const { gl, invalidate, scene: rendererScene, size } = useThree();
  const policy = selectD9LivingSanctuaryPolicy({
    height: size.height,
    reducedMotion,
    state: state.name,
    width: size.width,
  });
  // The profile changes only at a semantic endpoint; within that endpoint the array remains immutable from React's perspective.
  const dustBasePositions = useMemo(
    () => createD9DustBasePositions(policy.dustProfile),
    [policy.dustProfile],
  );
  const dustPointsRef = useRef<Points>(null);
  const flameRigsRef = useRef<Record<D91BCandleSide, D91BFlameRuntimeRig> | null>(null);
  const candlePresentationRigsRef = useRef<Record<
    D91BCandleSide,
    D91CCandlePresentationRig
  > | null>(null);
  const runtimeLights = useRef<{
    exterior: DirectionalLight | null;
    left: PointLight | null;
    right: PointLight | null;
  }>({ exterior: null, left: null, right: null });
  const current = useRef<D9AtmosphereCurrentValues>({
    candleMotionAmount: policy.candleMotionAmount,
    candleWarmthAmount: policy.candleWarmthAmount,
    daylightBase: policy.daylightBase,
    daylightVariation: policy.daylightVariation,
    dustOpacity: policy.dustOpacity,
  });
  const localSeconds = useRef(0);
  const previousElapsedSeconds = useRef<number | null>(null);
  const hidden = useRef(typeof document !== "undefined" && document.hidden);
  const cloudEvent = useRef<D9CloudEvent | null>(null);
  const rareEventSchedule = useRef(createD9RareEventSchedule(0, Math.random));
  const atmosphereUpdateCount = useRef(0);

  useEffect(() => {
    // Resolve only the three existing named runtime lights after mount; this layer never creates or owns a light source.
    const exterior = rendererScene.getObjectByName("D9_Exterior_RuntimeLight");
    const left = rendererScene.getObjectByName("D9_CandleLeft_RuntimeLight");
    const right = rendererScene.getObjectByName("D9_CandleRight_RuntimeLight");
    runtimeLights.current = {
      exterior: exterior instanceof DirectionalLight ? exterior : null,
      left: left instanceof PointLight ? left : null,
      right: right instanceof PointLight ? right : null,
    };

    return () => {
      runtimeLights.current = { exterior: null, left: null, right: null };
    };
  }, [rendererScene]);

  useEffect(() => {
    // Reparent only the two visible flame meshes at their bases so approved Blender transforms cannot spill into their candles or nearby props.
    flameRigsRef.current = prepareD91BBlenderCandleMotion(scene);
    return () => {
      for (const rig of Object.values(flameRigsRef.current ?? {})) {
        restoreD91BBlenderCandleMotion(rig);
      }
      flameRigsRef.current = null;
    };
  }, [scene]);

  useEffect(() => {
    const flameRigs = flameRigsRef.current;
    if (flameRigs === null) {
      throw new Error("D9.1C candle presentation requires the approved D9.1B flame pivots.");
    }
    // Layer local presentation around the inspected GLB flame and wick meshes without adding a browser flame transform or another light.
    candlePresentationRigsRef.current = prepareD91CCandlePresentation(scene, flameRigs);
    return () => {
      for (const rig of Object.values(candlePresentationRigsRef.current ?? {})) {
        restoreD91CCandlePresentation(rig);
      }
      candlePresentationRigsRef.current = null;
    };
  }, [scene]);

  useEffect(() => {
    const canvas = gl.domElement;
    // Publish noninteractive local evidence for browser checks without adding a visitor-facing diagnostics control.
    canvas.setAttribute("data-d9-atmosphere-boundary", "living-sanctuary");
    canvas.setAttribute("data-d9-atmosphere-cadence-target", String(policy.cadenceFramesPerSecond));
    canvas.setAttribute("data-d9-atmosphere-dust-budget", String(policy.dustCount));
    canvas.setAttribute("data-d9-atmosphere-dust-profile", policy.dustProfile);
    canvas.setAttribute("data-d9-atmosphere-reduced-motion", String(policy.reducedMotion));
    canvas.setAttribute("data-d9-atmosphere-state", policy.state);
    canvas.setAttribute("data-d9-atmosphere-bird", "deferred-art");
    canvas.setAttribute("data-d9-candle-source", "blender-approved-v1");
    canvas.setAttribute("data-d9-candle-loop-seconds", String(d91bCandleLoopSeconds));
    canvas.setAttribute("data-d9-candle-fidelity", "layered-local-v1");
    canvas.setAttribute("data-d9-candle-wicks", Object.values(d91cAuthoredWickNames).join(","));
    canvas.setAttribute(
      "data-d9-candle-smoke",
      `bounded-deterministic-${String(d91cMaximumSmokeSprites)}-max`,
    );
    canvas.setAttribute("data-d9-candle-perceptual-gain", String(d91cPerceptualGain));

    return () => {
      for (const attribute of [
        "data-d9-atmosphere-boundary",
        "data-d9-atmosphere-cadence-target",
        "data-d9-atmosphere-dust-budget",
        "data-d9-atmosphere-dust-profile",
        "data-d9-atmosphere-reduced-motion",
        "data-d9-atmosphere-state",
        "data-d9-atmosphere-bird",
        "data-d9-atmosphere-hidden",
        "data-d9-atmosphere-rare-event",
        "data-d9-atmosphere-update-count",
        "data-d9-candle-source",
        "data-d9-candle-loop-seconds",
        "data-d9-candle-motion-amplitude",
        "data-d9-candle-fidelity",
        "data-d9-candle-wicks",
        "data-d9-candle-smoke",
        "data-d9-candle-perceptual-gain",
        "data-d9-candle-left-sample",
        "data-d9-candle-right-sample",
      ]) {
        canvas.removeAttribute(attribute);
      }
    };
  }, [gl, policy]);

  useEffect(() => {
    // Pace visible demand frames near film cadence instead of blindly requesting display-refresh rendering forever.
    let timer: number | undefined;
    let disposed = false;

    const clearTimer = (): void => {
      if (timer !== undefined) {
        window.clearTimeout(timer);
        timer = undefined;
      }
    };
    const requestNextFrame = (): void => {
      if (
        disposed ||
        !shouldD9AtmosphereScheduleFrames(policy.reducedMotion, hidden.current) ||
        policy.cadenceFramesPerSecond <= 0
      ) {
        return;
      }
      timer = window.setTimeout(
        () => {
          invalidate();
          requestNextFrame();
        },
        Math.round(1000 / policy.cadenceFramesPerSecond),
      );
    };
    const handleVisibilityChange = (): void => {
      hidden.current = document.hidden;
      gl.domElement.setAttribute("data-d9-atmosphere-hidden", String(hidden.current));
      // Drop elapsed wall-clock time while hidden so visible dust and light never try to catch up in a burst.
      previousElapsedSeconds.current = null;
      clearTimer();
      if (!hidden.current) {
        invalidate();
        requestNextFrame();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    gl.domElement.setAttribute("data-d9-atmosphere-hidden", String(hidden.current));
    requestNextFrame();

    return () => {
      disposed = true;
      clearTimer();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [gl, invalidate, policy.cadenceFramesPerSecond, policy.reducedMotion]);

  useFrame((frameState) => {
    const elapsedSeconds = frameState.clock.getElapsedTime();
    const previous = previousElapsedSeconds.current;
    previousElapsedSeconds.current = elapsedSeconds;
    const deltaSeconds =
      previous === null ? 0 : clampD9AtmosphereDeltaSeconds(elapsedSeconds - previous);

    if (hidden.current) {
      return;
    }

    // Crossfade renderer targets so a state change feels calm even while the locked camera controller takes its own route.
    const smoothing = 1 - Math.exp(-deltaSeconds * 1.25);
    current.current.candleMotionAmount = MathUtils.lerp(
      current.current.candleMotionAmount,
      policy.candleMotionAmount,
      smoothing,
    );
    current.current.candleWarmthAmount = MathUtils.lerp(
      current.current.candleWarmthAmount,
      policy.candleWarmthAmount,
      smoothing,
    );
    current.current.daylightBase = MathUtils.lerp(
      current.current.daylightBase,
      policy.daylightBase,
      smoothing,
    );
    current.current.daylightVariation = MathUtils.lerp(
      current.current.daylightVariation,
      policy.daylightVariation,
      smoothing,
    );
    current.current.dustOpacity = MathUtils.lerp(
      current.current.dustOpacity,
      policy.dustOpacity,
      smoothing,
    );
    localSeconds.current += deltaSeconds;

    // Start only a long-cooldown cloud softening event in eligible quiet states; birds remain an explicit future-art boundary.
    const nowMilliseconds = elapsedSeconds * 1000;
    if (
      !policy.reducedMotion &&
      policy.allowCloudEvent &&
      cloudEvent.current === null &&
      nowMilliseconds >= rareEventSchedule.current.nextEligibleAtMilliseconds
    ) {
      cloudEvent.current = createD9CloudEvent(nowMilliseconds, Math.random);
      rareEventSchedule.current = createD9RareEventSchedule(nowMilliseconds, Math.random);
    }
    const cloudReduction =
      cloudEvent.current === null ? 0 : sampleD9CloudSoftening(cloudEvent.current, nowMilliseconds);
    if (
      cloudEvent.current !== null &&
      isD9CloudEventComplete(cloudEvent.current, nowMilliseconds)
    ) {
      cloudEvent.current = null;
    }
    gl.domElement.setAttribute(
      "data-d9-atmosphere-rare-event",
      cloudEvent.current === null ? "none" : "cloud-softening",
    );

    // Apply only the approved independent Blender streams to their dedicated pivots; no procedural browser candle signal remains.
    // Snap the approved flame pivots to neutral for reduced motion rather than letting the ordinary visual crossfade leave one moving frame.
    const candleMotionAmount = policy.reducedMotion ? 0 : current.current.candleMotionAmount;
    gl.domElement.setAttribute("data-d9-candle-motion-amplitude", candleMotionAmount.toFixed(4));
    const flameLightMultipliers = (["left", "right"] as const).map((side) => {
      const rig = flameRigsRef.current?.[side];
      const transform =
        rig === undefined
          ? { lightMultiplier: 1 }
          : applyD91BBlenderCandleMotion(
              rig,
              side,
              localSeconds.current,
              candleMotionAmount,
              d91cPerceptualGain,
            );
      const sample = sampleD91BBlenderCandleMotion(side, localSeconds.current);
      gl.domElement.setAttribute(
        `data-d9-candle-${side}-sample`,
        `main=${sample.lean_main_deg.toFixed(6)};depth=${sample.lean_depth_deg.toFixed(6)};stretch=${sample.stretch.toFixed(6)};light=${sample.light_multiplier.toFixed(6)}`,
      );
      const presentationRig = candlePresentationRigsRef.current?.[side];
      if (presentationRig !== undefined) {
        // The map's existing light multiplier may gently affect visual brightness, but it never adds a new lean, phase, or flame position signal.
        applyD91CCandlePresentation(
          presentationRig,
          localSeconds.current,
          transform.lightMultiplier,
          policy.reducedMotion,
        );
      }
      return transform.lightMultiplier;
    });
    const candleBaseIntensity = visualCalibration.lighting.warmKey.intensity * 1.2;
    if (runtimeLights.current.left !== null) {
      runtimeLights.current.left.intensity =
        candleBaseIntensity * current.current.candleWarmthAmount * (flameLightMultipliers[0] ?? 1);
    }
    if (runtimeLights.current.right !== null) {
      runtimeLights.current.right.intensity =
        candleBaseIntensity * current.current.candleWarmthAmount * (flameLightMultipliers[1] ?? 1);
    }

    // Preserve the existing exterior light and alter only its restrained intensity, never a direction, day/night cycle, or fake beam.
    if (runtimeLights.current.exterior !== null) {
      const daylight =
        current.current.daylightBase *
        sampleD9DaylightModulation(localSeconds.current, current.current.daylightVariation) *
        (1 - cloudReduction);
      runtimeLights.current.exterior.intensity =
        visualCalibration.lighting.exteriorKey.intensity * 30 * daylight;
    }

    // Keep dust in one points draw call; READ and reduced motion shrink its draw range without a React particle tree.
    const dustPoints = dustPointsRef.current;
    const dustMaterial = dustPoints?.material;
    const dustPositionAttribute = dustPoints?.geometry.getAttribute("position");
    dustPoints?.geometry.setDrawRange(0, policy.dustCount);
    if (dustMaterial !== undefined && !Array.isArray(dustMaterial)) {
      dustMaterial.opacity = policy.reducedMotion ? 0 : current.current.dustOpacity;
    }
    if (
      !policy.reducedMotion &&
      policy.dustCount > 0 &&
      dustPositionAttribute instanceof BufferAttribute
    ) {
      const positions = dustPositionAttribute.array as Float32Array;
      for (let index = 0; index < policy.dustCount; index += 1) {
        const offset = index * 3;
        const driftPhase = localSeconds.current * (0.035 + (index % 4) * 0.006) + index * 1.73;
        positions[offset] = (dustBasePositions[offset] ?? 0) + Math.sin(driftPhase) * 0.045;
        positions[offset + 1] =
          (dustBasePositions[offset + 1] ?? 0) + Math.cos(driftPhase * 0.71) * 0.025;
        positions[offset + 2] =
          (dustBasePositions[offset + 2] ?? 0) + Math.sin(driftPhase * 0.57) * 0.032;
      }
      dustPositionAttribute.needsUpdate = true;
    }

    atmosphereUpdateCount.current += 1;
    gl.domElement.setAttribute(
      "data-d9-atmosphere-update-count",
      String(atmosphereUpdateCount.current),
    );
  });

  return (
    <points ref={dustPointsRef}>
      <bufferGeometry>
        <bufferAttribute
          args={[dustBasePositions.slice(), 3]}
          attach="attributes-position"
          usage={DynamicDrawUsage}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#d7b28c"
        depthWrite={false}
        opacity={0}
        size={0.026}
        sizeAttenuation
        transparent
      />
    </points>
  );
}
