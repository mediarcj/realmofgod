/**
 * File: apps/sanctuary/src/rendering/D84StaticSanctuaryProof.tsx
 * Description: Loads a local sanctuary candidate for bounded development-only rendering comparisons.
 * Purpose: Measures static batching, authored transforms, and restrained light policies without changing production behavior.
 * Notes: This component is dynamically reachable only from exact development paths and contains no visitor data.
 */

// Import only renderer-local loading, measurement, and light primitives needed by the bounded proof scene.
import { useLoader, useThree } from "@react-three/fiber";
import { useEffect, useMemo, type ReactNode } from "react";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

import baselineCandidateUrl from "../assets/candidates/realm-mvp-sanctuary-v1-r2-meshopt.glb?url";
import batchedCandidateUrl from "../assets/candidates/realm-mvp-sanctuary-v1-r2-batched-meshopt.glb?url";
import rawCandidateUrl from "../../../../tools/hf01/candidates/realm-mvp-sanctuary-v1-raw-r2.glb?url";
import {
  readD85LandscapeProofConfig,
  summarizeD85FrameIntervals,
  type StaticSanctuaryProofConfig,
} from "./capabilities";
import {
  prepareStaticSanctuaryScene,
  resolveAuthoredCandleFlamePositions,
  STATIC_CANDLE_LIGHT_COUNT,
  type AuthoredCandleFlamePositions,
} from "./staticSanctuaryProof";
import type { VisualCalibration } from "./visualCalibration";

// Configure Three's repository-bundled decoder so both Meshopt candidates load without a remote decoder path.
function configureLoader(loader: GLTFLoader): void {
  loader.setMeshoptDecoder(MeshoptDecoder);
}

// Report actual renderer counters after the selected GLB has loaded, avoiding geometry-only estimates in the browser proof.
function RuntimeMetrics({ config }: { readonly config: StaticSanctuaryProofConfig }): ReactNode {
  const { gl } = useThree();

  useEffect(() => {
    const selector = ".experience-canvas canvas";
    const canvas = document.querySelector<HTMLCanvasElement>(selector);
    const d85LandscapeProofActive = readD85LandscapeProofConfig() !== null;
    canvas?.setAttribute("data-d84-proof-ready", "false");
    canvas?.setAttribute("data-d84-candidate", config.candidate);
    canvas?.setAttribute("data-d84-shadow-policy", config.shadowPolicy);
    canvas?.setAttribute("data-d84-candle-light-count", String(STATIC_CANDLE_LIGHT_COUNT));
    // Wait for two browser frames so the counter snapshot represents a completed local proof render.
    const firstFrame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const settledCanvas = document.querySelector<HTMLCanvasElement>(selector);
        settledCanvas?.setAttribute("data-d84-renderer-calls", String(gl.info.render.calls));
        settledCanvas?.setAttribute(
          "data-d84-renderer-triangles",
          String(gl.info.render.triangles),
        );
        settledCanvas?.setAttribute("data-d84-proof-ready", "true");
      });
    });

    // Sample ordinary browser presentation intervals only in D8.5 after a short warmup, not GPU timing.
    const pacingWarmupFrameCount = 30;
    const pacingSampleFrameCount = 120;
    const pacingIntervals: number[] = [];
    let pacingAnimationFrame = 0;
    let pacingFrameCount = 0;
    let pacingPreviousTimestamp: number | null = null;
    const pacingStartTimestamp = performance.now();
    const collectPacingInterval = (timestamp: number): void => {
      const previousTimestamp = pacingPreviousTimestamp;
      pacingPreviousTimestamp = timestamp;
      pacingFrameCount += 1;

      if (previousTimestamp !== null && pacingFrameCount > pacingWarmupFrameCount) {
        pacingIntervals.push(timestamp - previousTimestamp);
      }

      if (pacingIntervals.length >= pacingSampleFrameCount) {
        const summary = summarizeD85FrameIntervals(pacingIntervals);
        const pacedCanvas = document.querySelector<HTMLCanvasElement>(selector);
        if (summary !== null) {
          pacedCanvas?.setAttribute("data-d85-pacing-frame-count", String(summary.frameCount));
          pacedCanvas?.setAttribute(
            "data-d85-pacing-duration-ms",
            String(timestamp - pacingStartTimestamp),
          );
          pacedCanvas?.setAttribute(
            "data-d85-pacing-median-ms",
            String(summary.medianMilliseconds),
          );
          pacedCanvas?.setAttribute("data-d85-pacing-p95-ms", String(summary.p95Milliseconds));
          pacedCanvas?.setAttribute(
            "data-d85-pacing-long-frame-count",
            String(summary.longFrameCount),
          );
          pacedCanvas?.setAttribute("data-d85-pacing-ready", "true");
        }
        return;
      }

      pacingAnimationFrame = window.requestAnimationFrame(collectPacingInterval);
    };

    if (d85LandscapeProofActive) {
      canvas?.setAttribute("data-d85-pacing-ready", "false");
      pacingAnimationFrame = window.requestAnimationFrame(collectPacingInterval);
    }

    return () => {
      window.cancelAnimationFrame(firstFrame);
      window.cancelAnimationFrame(pacingAnimationFrame);
      const currentCanvas = document.querySelector<HTMLCanvasElement>(selector);
      currentCanvas?.removeAttribute("data-d84-proof-ready");
      currentCanvas?.removeAttribute("data-d84-renderer-calls");
      currentCanvas?.removeAttribute("data-d84-renderer-triangles");
      currentCanvas?.removeAttribute("data-d84-candidate");
      currentCanvas?.removeAttribute("data-d84-shadow-policy");
      currentCanvas?.removeAttribute("data-d85-pacing-frame-count");
      currentCanvas?.removeAttribute("data-d85-pacing-duration-ms");
      currentCanvas?.removeAttribute("data-d85-pacing-median-ms");
      currentCanvas?.removeAttribute("data-d85-pacing-p95-ms");
      currentCanvas?.removeAttribute("data-d85-pacing-long-frame-count");
      currentCanvas?.removeAttribute("data-d85-pacing-ready");
    };
  }, [config.candidate, config.shadowPolicy, gl]);

  return null;
}

// Recreate the existing room light positions but give each policy a deliberately explicit caster budget.
function ProofLighting({
  candleFlamePositions,
  config,
  visualCalibration,
}: {
  readonly candleFlamePositions: AuthoredCandleFlamePositions;
  readonly config: StaticSanctuaryProofConfig;
  readonly visualCalibration: VisualCalibration;
}): ReactNode {
  const shadowsEnabled = config.shadowPolicy !== "off";
  const warmKey = visualCalibration.lighting.warmKey;

  return (
    <>
      <hemisphereLight
        args={[
          visualCalibration.lighting.fill.color,
          "#090605",
          visualCalibration.lighting.fill.intensity * 1.55,
        ]}
      />
      <directionalLight
        castShadow={shadowsEnabled}
        color={visualCalibration.lighting.exteriorKey.color}
        intensity={visualCalibration.lighting.exteriorKey.intensity * 30}
        position={[4.5, 7.5, 1.5]}
        shadow-bias={-0.0001}
        shadow-normalBias={0.012}
        shadow-mapSize-height={1024}
        shadow-mapSize-width={1024}
      />
      {/* Keep exactly two non-shadowing candle lights; their short range leaves the floor below the table deliberately quieter. */}
      <pointLight
        color="#ffb15b"
        decay={2}
        distance={2.75}
        intensity={warmKey.intensity * 1.2}
        position={[...candleFlamePositions.left]}
      />
      <pointLight
        color="#ffb15b"
        decay={2}
        distance={2.75}
        intensity={warmKey.intensity * 1.2}
        position={[...candleFlamePositions.right]}
      />
    </>
  );
}

// Render one selected local candidate with the existing camera calibration left entirely unchanged.
export function D84StaticSanctuaryProof({
  config,
  visualCalibration,
}: {
  readonly config: StaticSanctuaryProofConfig;
  readonly visualCalibration: VisualCalibration;
}): ReactNode {
  const candidateUrl =
    config.candidate === "baseline"
      ? baselineCandidateUrl
      : config.candidate === "raw"
        ? rawCandidateUrl
        : batchedCandidateUrl;
  const gltf = useLoader(GLTFLoader, candidateUrl, configureLoader) as GLTF;
  const scene = useMemo(
    () => prepareStaticSanctuaryScene(gltf.scene, config, visualCalibration),
    [config, gltf.scene, visualCalibration],
  );
  const candleFlamePositions = useMemo(() => resolveAuthoredCandleFlamePositions(scene), [scene]);

  return (
    <>
      <color attach="background" args={["#0f0b08"]} />
      <ProofLighting
        candleFlamePositions={candleFlamePositions}
        config={config}
        visualCalibration={visualCalibration}
      />
      <group
        position={[...visualCalibration.room.position]}
        rotation={[0, visualCalibration.room.rotationY, 0]}
        scale={visualCalibration.room.scale}
      >
        <primitive object={scene} />
      </group>
      <RuntimeMetrics config={config} />
    </>
  );
}
