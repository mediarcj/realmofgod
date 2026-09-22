// File: apps/sanctuary/components/sanctuary/SanctuaryCanvas.tsx
// Description: Hosts the browser-only sanctuary renderer.
// Purpose: Gives the accepted assets an isolated, demand-rendered canvas.
// Notes: No physical geometry is generated here.
"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { Suspense, useCallback, useEffect, useState } from "react";
import { ACESFilmicToneMapping, AgXToneMapping, Box3, SRGBColorSpace, Vector3, type Object3D } from "three";
import { LightProbeGridWebGL } from "three/examples/jsm/lighting/LightProbeGridWebGL.js";
import { SanctuaryScene } from "./SanctuaryScene";
import { GuidedCamera } from "./GuidedCamera";
import { CameraCalibrationControls, type CameraCalibrationMode } from "./CameraCalibrationControls";
import { SanctuaryAtmosphere } from "./SanctuaryAtmosphere";
import type { SanctuaryView } from "../../lib/sanctuary/camera";
import type { CalibrationCommand, CalibrationPose } from "../../lib/sanctuary/camera-calibration";
import type { DevotionalCalibrationKey } from "../../lib/sanctuary/camera-calibration";
import { DevotionalObjectControls, type ObjectCalibrationCommand, type ObjectCalibrationState } from "./DevotionalObjectControls";
import { SanctuaryEnvironment } from "./SanctuaryEnvironment";
import { MaterialDebugReadout, type MaterialDebugInfo } from "./MaterialDebugReadout";
import { developmentTone, type LookdevProfile } from "../../lib/sanctuary/lookdev";

function RendererLookdev({ lookdev }: { lookdev: LookdevProfile }) {
  const { gl, invalidate } = useThree();
  useEffect(() => {
    const tone = process.env.NODE_ENV === "production" ? null : developmentTone(window.location.search);
    gl.toneMapping = tone === "agx" ? AgXToneMapping : ACESFilmicToneMapping;
    gl.toneMappingExposure = lookdev.exposure;
    invalidate();
  }, [gl, invalidate, lookdev.exposure]);
  return null;
}

function IndirectProbeGrid() {
  const { gl, scene, invalidate } = useThree();
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const query = new URLSearchParams(window.location.search);
    const mode = query.get("gi");
    if (query.get("lookdev") !== "gi" || (mode !== "direct" && mode !== "bounce2")) return;
    let cancelled = false;
    const grid = new LightProbeGridWebGL(1, 1, 1, 8, 5, 10);
    const bake = () => {
      if (cancelled) return;
      const bounds = new Box3().setFromObject(scene);
      const size = bounds.getSize(new Vector3());
      const center = bounds.getCenter(new Vector3());
      grid.width = Math.max(size.x, 1); grid.height = Math.max(size.y, 1); grid.depth = Math.max(size.z, 1);
      grid.position.copy(center); grid.updateBoundingBox(); scene.add(grid);
      const started = performance.now();
      try {
        grid.bake(gl, scene, { cubemapSize: 32, bounces: mode === "bounce2" ? 2 : 0, near: .05, far: 40 });
        console.info("[sanctuary gi]", { mode, resolution: grid.resolution.toArray(), bounds: { min: grid.boundingBox.min.toArray(), max: grid.boundingBox.max.toArray() }, cubemapSize: 32, sampleCount: "fixed WebGL SH projection", bounces: mode === "bounce2" ? 2 : 0, bakeMs: performance.now() - started });
        invalidate();
      } catch (error) { console.error("[sanctuary gi] bake failed; raster fallback remains active", error); scene.remove(grid); grid.dispose(); }
    };
    const frame = requestAnimationFrame(bake);
    return () => { cancelled = true; cancelAnimationFrame(frame); scene.remove(grid); grid.dispose(); };
  }, [gl, invalidate, scene]);
  return null;
}

export default function SanctuaryCanvas({ view, reducedMotion, onProgress, revision, onSettled, interactive, onActivate, calibrationEnabled, calibrationMode, calibrationCommand, onCameraState, selectedObject, objectCommand, onObjectState, lookdev }: { view: SanctuaryView; reducedMotion: boolean; onProgress: (count: number) => void; revision: number; onSettled: (revision: number) => void; interactive: boolean; onActivate: (name: string) => void; calibrationEnabled: boolean; calibrationMode: CameraCalibrationMode; calibrationCommand: CalibrationCommand | null; onCameraState: (state: CalibrationPose) => void; selectedObject: DevotionalCalibrationKey; objectCommand: ObjectCalibrationCommand | null; onObjectState: (key: DevotionalCalibrationKey, state: ObjectCalibrationState) => void; lookdev: LookdevProfile }) {
  const [objects, setObjects] = useState<Partial<Record<DevotionalCalibrationKey, Object3D>>>({}); const [dragging, setDragging] = useState(false);
  const [materialDebug, setMaterialDebug] = useState<MaterialDebugInfo | null>(null);
  const register = useCallback((key: string, object: Object3D | null) => setObjects((current) => ({ ...current, [key as DevotionalCalibrationKey]: object ?? undefined })), []);
  return (
    <>
    <Canvas
      aria-label="Sanctuary interior"
      frameloop="demand"
      dpr={[1, 1.5]}
      shadows="percentage"
      gl={{ toneMapping: ACESFilmicToneMapping, outputColorSpace: SRGBColorSpace, antialias: true }}
      onCreated={({ gl }) => { gl.toneMappingExposure = lookdev.exposure; }}
      camera={{ position: [0, 1.75, 4], fov: 55, near: 0.05, far: 60 }}
      fallback={<p className="scene-message">The sanctuary view needs WebGL support.</p>}
    >
      <color attach="background" args={["#181612"]} />
      <RendererLookdev lookdev={lookdev} />
      {calibrationEnabled ? <><CameraCalibrationControls command={calibrationCommand} mode={calibrationMode} transformDragging={dragging} onCameraState={onCameraState} /><DevotionalObjectControls objects={objects} selected={selectedObject} mode={calibrationMode} command={objectCommand} onState={onObjectState} onDragging={setDragging} /></> : <GuidedCamera view={view} reducedMotion={reducedMotion} revision={revision} onSettled={onSettled} />}
      <SanctuaryAtmosphere reducedMotion={reducedMotion} lookdev={lookdev} />
      <SanctuaryEnvironment lookdev={lookdev} />
      <Suspense fallback={null}><SanctuaryScene onProgress={onProgress} view={view} interactive={interactive} onActivate={onActivate} onCalibrationObject={register} onMaterialDebug={calibrationEnabled ? setMaterialDebug : undefined} /></Suspense>
      <IndirectProbeGrid />
    </Canvas>
    {calibrationEnabled && <MaterialDebugReadout info={materialDebug} />}
    </>
  );
}
