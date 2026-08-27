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
  Euler,
  MathUtils,
  Object3D,
  PointLight,
  Points,
  Vector3,
} from "three";

import type { SanctuaryMvpState } from "../sanctuary/model";
import { authoredCandleFlameNames } from "./staticSanctuaryProof";
import {
  clampD9AtmosphereDeltaSeconds,
  createD9CloudEvent,
  createD9RareEventSchedule,
  d9CandleChannels,
  d9MaximumDustParticleCount,
  isD9CloudEventComplete,
  sampleD9CandleFlame,
  sampleD9CloudSoftening,
  sampleD9DaylightModulation,
  selectD9LivingSanctuaryPolicy,
  shouldD9AtmosphereScheduleFrames,
  type D9CloudEvent,
} from "./d9LivingSanctuaryPolicy";
import type { VisualCalibration } from "./visualCalibration";

// Hold each authored flame's original transform so reduced motion and unmount can return exactly to the local GLB presentation.
interface AuthoredFlameBaseline {
  readonly object: Object3D;
  readonly rotation: Euler;
  readonly scale: Vector3;
}

// Keep renderer-only crossfade values together so semantic state changes do not cause abrupt lighting changes.
interface D9AtmosphereCurrentValues {
  candleMotionAmount: number;
  candleWarmthAmount: number;
  daylightBase: number;
  daylightVariation: number;
  dustOpacity: number;
}

// Build stable tiny particles around the upper table light, retaining substantially more empty air than visible decoration.
function createD9DustBasePositions(): Float32Array {
  const basePositions = new Float32Array(d9MaximumDustParticleCount * 3);

  for (let index = 0; index < d9MaximumDustParticleCount; index += 1) {
    const offset = index * 3;
    // Use deterministic low-discrepancy placement instead of a runtime random history or an obvious particle grid.
    basePositions[offset] = ((index * 0.618_033_988_75) % 1) * 5.6 - 2.8;
    basePositions[offset + 1] = 1.45 + ((index * 0.754_877_666_25 + 0.13) % 1) * 2.75;
    basePositions[offset + 2] = ((index * 0.414_213_562_37 + 0.21) % 1) * 3.4 - 1.7;
  }

  return basePositions;
}

// Resolve the two known local flame objects without creating duplicate geometry or lamps.
function collectAuthoredFlameBaselines(scene: Object3D): AuthoredFlameBaseline[] {
  return authoredCandleFlameNames.flatMap((name) => {
    const object = scene.getObjectByName(name);
    if (object === undefined) {
      return [];
    }
    return [{ object, rotation: object.rotation.clone(), scale: object.scale.clone() }];
  });
}

// Apply a very small transform response while preserving every authored flame position, mesh shape, and material.
function applyD9FlameLife(
  baseline: AuthoredFlameBaseline,
  channelIndex: number,
  seconds: number,
  amount: number,
): number {
  const channel = d9CandleChannels[channelIndex];
  if (channel === undefined) {
    return 1;
  }
  const sample = sampleD9CandleFlame(channel, seconds);
  baseline.object.rotation.set(
    baseline.rotation.x + sample.leanX * amount,
    baseline.rotation.y,
    baseline.rotation.z + sample.leanZ * amount,
  );
  baseline.object.scale.set(
    baseline.scale.x,
    baseline.scale.y * (1 + (sample.stretchY - 1) * amount),
    baseline.scale.z,
  );
  return MathUtils.lerp(1, sample.lightMultiplier, amount);
}

// Reset one flame exactly when the component leaves the renderer tree.
function restoreD9FlameBaseline(baseline: AuthoredFlameBaseline): void {
  baseline.object.rotation.set(baseline.rotation.x, baseline.rotation.y, baseline.rotation.z);
  baseline.object.scale.copy(baseline.scale);
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
  // The array remains immutable from React's perspective; only the GPU attribute copy is updated inside the renderer frame loop.
  const dustBasePositions = useMemo(() => createD9DustBasePositions(), []);
  const dustPointsRef = useRef<Points>(null);
  const flameBaselinesRef = useRef<AuthoredFlameBaseline[] | null>(null);
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
    // Retain mutable authored transforms locally and restore them during teardown so a remount cannot compound a lean.
    flameBaselinesRef.current = collectAuthoredFlameBaselines(scene);
    return () => {
      for (const baseline of flameBaselinesRef.current ?? []) {
        restoreD9FlameBaseline(baseline);
      }
      flameBaselinesRef.current = null;
    };
  }, [scene]);

  useEffect(() => {
    const canvas = gl.domElement;
    // Publish noninteractive local evidence for browser checks without adding a visitor-facing diagnostics control.
    canvas.setAttribute("data-d9-atmosphere-boundary", "living-sanctuary");
    canvas.setAttribute("data-d9-atmosphere-cadence-target", String(policy.cadenceFramesPerSecond));
    canvas.setAttribute("data-d9-atmosphere-dust-budget", String(policy.dustCount));
    canvas.setAttribute("data-d9-atmosphere-reduced-motion", String(policy.reducedMotion));
    canvas.setAttribute("data-d9-atmosphere-state", policy.state);
    canvas.setAttribute("data-d9-atmosphere-bird", "deferred-art");

    return () => {
      for (const attribute of [
        "data-d9-atmosphere-boundary",
        "data-d9-atmosphere-cadence-target",
        "data-d9-atmosphere-dust-budget",
        "data-d9-atmosphere-reduced-motion",
        "data-d9-atmosphere-state",
        "data-d9-atmosphere-bird",
        "data-d9-atmosphere-hidden",
        "data-d9-atmosphere-rare-event",
        "data-d9-atmosphere-update-count",
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

    // Mutate only the two named authored flames and their two existing local lights; no extra table illumination is created.
    const flameLightMultipliers = (flameBaselinesRef.current ?? []).map((baseline, index) =>
      applyD9FlameLife(baseline, index, localSeconds.current, current.current.candleMotionAmount),
    );
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
        size={0.022}
        sizeAttenuation
        transparent
      />
    </points>
  );
}
