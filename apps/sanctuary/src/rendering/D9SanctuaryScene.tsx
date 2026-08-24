/**
 * File: apps/sanctuary/src/rendering/D9SanctuaryScene.tsx
 * Description: Renders the normal local D9 visitor sanctuary from the accepted authored batched candidate.
 * Purpose: Separates visitor-quality rendering from the fixed DPR-1 diagnostic proof renderer.
 * Notes: This development-only scene uses local assets, preserves authored transforms, and contains no visitor data.
 */

// Import only the local R3F, GLB-loading, and measurement primitives needed by the visitor scene.
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { Vector2 } from "three";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

import batchedCandidateUrl from "../assets/candidates/realm-mvp-sanctuary-v1-r2-batched-meshopt.glb?url";
import rawCandidateUrl from "../../../../tools/hf01/candidates/realm-mvp-sanctuary-v1-raw-r2.glb?url";
import type { SanctuaryMvpAction, SanctuaryMvpState } from "../sanctuary/model";
import type { StaticSanctuaryProofConfig } from "./capabilities";
import { D9EnvironmentalAffordances } from "./D9EnvironmentalAffordances";
import { d9VisitorSceneContract, type D9RenderQuality } from "./d9SanctuaryQuality";
import {
  prepareStaticSanctuaryScene,
  resolveAuthoredCandleFlamePositions,
  type AuthoredCandleFlamePositions,
} from "./staticSanctuaryProof";
import type { VisualCalibration } from "./visualCalibration";

// Configure the repository-bundled decoder so the accepted local Meshopt candidate never needs a remote helper.
function configureLoader(loader: GLTFLoader): void {
  loader.setMeshoptDecoder(MeshoptDecoder);
}

// Keep D9's scene-preparation policy explicit: authored R2 transforms remain its only prop placement authority.
const d9VisitorSceneConfig: StaticSanctuaryProofConfig = {
  candidate: "batched",
  shadowPolicy: d9VisitorSceneContract.shadowPolicy,
  transformPolicy: d9VisitorSceneContract.transformPolicy,
};

// Record actual browser render values after the candidate settles without collecting any device identity.
function D9RuntimeMetrics({
  quality,
  sanctuaryState,
}: {
  readonly quality: D9RenderQuality;
  readonly sanctuaryState: SanctuaryMvpState["name"];
}): ReactNode {
  const { gl } = useThree();
  const settled = useRef(false);
  const pacingIntervals = useRef<number[]>([]);
  const previousTimestamp = useRef<number | null>(null);
  const frameCount = useRef(0);

  useEffect(() => {
    const canvas = gl.domElement;
    canvas.setAttribute("data-d9-visitor-ready", "false");
    canvas.setAttribute("data-d9-render-policy", quality.policy);
    canvas.setAttribute("data-d9-requested-dpr", String(quality.dpr));
    canvas.setAttribute("data-d9-antialias-requested", String(quality.antialias));
    canvas.setAttribute("data-d9-sanctuary-state", sanctuaryState);

    const firstFrame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const drawingBuffer = gl.getDrawingBufferSize(new Vector2());
        const antialias = gl.getContext().getContextAttributes()?.antialias === true;
        canvas.setAttribute("data-d9-renderer-calls", String(gl.info.render.calls));
        canvas.setAttribute("data-d9-renderer-triangles", String(gl.info.render.triangles));
        canvas.setAttribute("data-d9-renderer-pixel-ratio", String(gl.getPixelRatio()));
        canvas.setAttribute("data-d9-drawing-buffer-width", String(drawingBuffer.width));
        canvas.setAttribute("data-d9-drawing-buffer-height", String(drawingBuffer.height));
        canvas.setAttribute("data-d9-antialias-active", String(antialias));
        canvas.setAttribute("data-d9-visitor-ready", "true");
        settled.current = true;
      });
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      for (const attribute of [
        "data-d9-visitor-ready",
        "data-d9-render-policy",
        "data-d9-requested-dpr",
        "data-d9-antialias-requested",
        "data-d9-renderer-calls",
        "data-d9-renderer-triangles",
        "data-d9-renderer-pixel-ratio",
        "data-d9-drawing-buffer-width",
        "data-d9-drawing-buffer-height",
        "data-d9-antialias-active",
        "data-d9-sanctuary-state",
        "data-d9-pacing-ready",
        "data-d9-pacing-median-ms",
        "data-d9-pacing-p95-ms",
        "data-d9-pacing-long-frame-count",
      ]) {
        canvas.removeAttribute(attribute);
      }
    };
  }, [gl, quality.antialias, quality.dpr, quality.policy, sanctuaryState]);

  useFrame(() => {
    // Wait for the same settled state as the renderer counters before recording ordinary browser presentation intervals.
    if (!settled.current || pacingIntervals.current.length >= 120) {
      return;
    }
    // Use browser wall-clock milliseconds rather than R3F's elapsed-seconds clock for an honest presentation interval.
    const timestamp = performance.now();
    const priorTimestamp = previousTimestamp.current;
    previousTimestamp.current = timestamp;
    frameCount.current += 1;
    if (priorTimestamp === null || frameCount.current <= 30) {
      return;
    }
    pacingIntervals.current.push(timestamp - priorTimestamp);
    if (pacingIntervals.current.length !== 120) {
      return;
    }

    const ordered = [...pacingIntervals.current].sort((first, second) => first - second);
    const median = ordered[Math.floor(ordered.length / 2)];
    const p95 = ordered[Math.ceil(ordered.length * 0.95) - 1];
    if (median === undefined || p95 === undefined) {
      return;
    }
    const canvas = gl.domElement;
    canvas.setAttribute("data-d9-pacing-median-ms", String(median));
    canvas.setAttribute("data-d9-pacing-p95-ms", String(p95));
    canvas.setAttribute(
      "data-d9-pacing-long-frame-count",
      String(pacingIntervals.current.filter((interval) => interval > 1000 / 30).length),
    );
    canvas.setAttribute("data-d9-pacing-ready", "true");
  });

  return null;
}

// Match the accepted restrained light budget while leaving the D84 proof component free to retain its diagnostic controls.
function D9Lighting({
  candleFlamePositions,
  visualCalibration,
}: {
  readonly candleFlamePositions: AuthoredCandleFlamePositions;
  readonly visualCalibration: VisualCalibration;
}): ReactNode {
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
        castShadow
        color={visualCalibration.lighting.exteriorKey.color}
        intensity={visualCalibration.lighting.exteriorKey.intensity * 30}
        position={[4.5, 7.5, 1.5]}
        shadow-bias={-0.0001}
        shadow-normalBias={0.012}
        shadow-mapSize-height={1024}
        shadow-mapSize-width={1024}
      />
      {/* Keep exactly two non-shadowing lights at the authored flame anchors; a third lamp would change the approved staging. */}
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

// Render the normal D9 visitor scene from the one accepted local candidate, not through a benchmark selector.
export function D9SanctuaryScene({
  config = d9VisitorSceneConfig,
  onSanctuaryInteraction,
  quality,
  reducedMotion,
  sanctuaryState,
  visualCalibration,
}: {
  readonly config?: StaticSanctuaryProofConfig | undefined;
  readonly onSanctuaryInteraction?: ((action: SanctuaryMvpAction) => void) | undefined;
  readonly quality: D9RenderQuality;
  readonly reducedMotion: boolean;
  readonly sanctuaryState?: SanctuaryMvpState | undefined;
  readonly visualCalibration: VisualCalibration;
}): ReactNode {
  // The D9 visitor uses the accepted batched asset; only the explicit D92 local inspection may request the immutable raw input.
  const candidateUrl = config.candidate === "raw" ? rawCandidateUrl : batchedCandidateUrl;
  const gltf = useLoader(GLTFLoader, candidateUrl, configureLoader) as GLTF;
  const scene = useMemo(
    () => prepareStaticSanctuaryScene(gltf.scene, config, visualCalibration),
    [config, gltf.scene, visualCalibration],
  );
  const candleFlamePositions = useMemo(() => resolveAuthoredCandleFlamePositions(scene), [scene]);

  return (
    <>
      <color attach="background" args={["#0f0b08"]} />
      <D9Lighting
        candleFlamePositions={candleFlamePositions}
        visualCalibration={visualCalibration}
      />
      <group
        position={[...visualCalibration.room.position]}
        rotation={[0, visualCalibration.room.rotationY, 0]}
        scale={visualCalibration.room.scale}
      >
        <primitive object={scene} />
        {sanctuaryState !== undefined && onSanctuaryInteraction !== undefined ? (
          <D9EnvironmentalAffordances
            onInteraction={onSanctuaryInteraction}
            reducedMotion={reducedMotion}
            state={sanctuaryState}
          />
        ) : null}
      </group>
      <D9RuntimeMetrics quality={quality} sanctuaryState={sanctuaryState?.name ?? "SANCTUARY"} />
    </>
  );
}
