// File: apps/sanctuary/components/sanctuary/SanctuaryCanvas.tsx
// Description: Hosts the browser-only sanctuary renderer.
// Purpose: Gives the accepted assets an isolated, demand-rendered canvas.
// Notes: No physical geometry is generated here.
"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, useCallback, useState } from "react";
import { ACESFilmicToneMapping, SRGBColorSpace, type Object3D } from "three";
import { SanctuaryScene } from "./SanctuaryScene";
import { GuidedCamera } from "./GuidedCamera";
import { CameraCalibrationControls, type CameraCalibrationMode } from "./CameraCalibrationControls";
import { SanctuaryAtmosphere } from "./SanctuaryAtmosphere";
import type { SanctuaryView } from "../../lib/sanctuary/camera";
import type { CalibrationCommand, CalibrationPose } from "../../lib/sanctuary/camera-calibration";
import type { DevotionalCalibrationKey } from "../../lib/sanctuary/camera-calibration";
import { DevotionalObjectControls, type ObjectCalibrationCommand, type ObjectCalibrationState } from "./DevotionalObjectControls";

export default function SanctuaryCanvas({ view, reducedMotion, onProgress, revision, onSettled, interactive, onActivate, calibrationEnabled, calibrationMode, calibrationCommand, onCameraState, selectedObject, objectCommand, onObjectState }: { view: SanctuaryView; reducedMotion: boolean; onProgress: (count: number) => void; revision: number; onSettled: (revision: number) => void; interactive: boolean; onActivate: (name: string) => void; calibrationEnabled: boolean; calibrationMode: CameraCalibrationMode; calibrationCommand: CalibrationCommand | null; onCameraState: (state: CalibrationPose) => void; selectedObject: DevotionalCalibrationKey; objectCommand: ObjectCalibrationCommand | null; onObjectState: (key: DevotionalCalibrationKey, state: ObjectCalibrationState) => void }) {
  const [objects, setObjects] = useState<Partial<Record<DevotionalCalibrationKey, Object3D>>>({}); const [dragging, setDragging] = useState(false);
  const register = useCallback((key: string, object: Object3D | null) => setObjects((current) => ({ ...current, [key as DevotionalCalibrationKey]: object ?? undefined })), []);
  return (
    <Canvas
      aria-label="Sanctuary interior"
      frameloop="demand"
      dpr={[1, 1.5]}
      shadows
      gl={{ toneMapping: ACESFilmicToneMapping, outputColorSpace: SRGBColorSpace, antialias: true }}
      camera={{ position: [0, 1.75, 4], fov: 55, near: 0.05, far: 60 }}
      fallback={<p className="scene-message">The sanctuary view needs WebGL support.</p>}
    >
      <color attach="background" args={["#181612"]} />
      {calibrationEnabled ? <><CameraCalibrationControls command={calibrationCommand} mode={calibrationMode} transformDragging={dragging} onCameraState={onCameraState} /><DevotionalObjectControls objects={objects} selected={selectedObject} mode={calibrationMode} command={objectCommand} onState={onObjectState} onDragging={setDragging} /></> : <GuidedCamera view={view} reducedMotion={reducedMotion} revision={revision} onSettled={onSettled} />}
      <SanctuaryAtmosphere reducedMotion={reducedMotion} />
      <Suspense fallback={null}><SanctuaryScene onProgress={onProgress} view={view} interactive={interactive} onActivate={onActivate} onCalibrationObject={register} /></Suspense>
    </Canvas>
  );
}
