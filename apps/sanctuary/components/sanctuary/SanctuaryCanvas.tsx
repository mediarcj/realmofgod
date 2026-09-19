// File: apps/sanctuary/components/sanctuary/SanctuaryCanvas.tsx
// Description: Hosts the browser-only sanctuary renderer.
// Purpose: Gives the accepted assets an isolated, demand-rendered canvas.
// Notes: No physical geometry is generated here.
"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { SanctuaryScene } from "./SanctuaryScene";
import { GuidedCamera } from "./GuidedCamera";
import { CameraCalibrationControls } from "./CameraCalibrationControls";
import { SanctuaryAtmosphere } from "./SanctuaryAtmosphere";
import type { SanctuaryView } from "../../lib/sanctuary/camera";
import type { CalibrationCommand, CalibrationPose } from "../../lib/sanctuary/camera-calibration";

export default function SanctuaryCanvas({ view, reducedMotion, onProgress, revision, onSettled, interactive, onActivate, calibrationEnabled, calibrationCommand, onCameraState }: { view: SanctuaryView; reducedMotion: boolean; onProgress: (count: number) => void; revision: number; onSettled: (revision: number) => void; interactive: boolean; onActivate: (name: string) => void; calibrationEnabled: boolean; calibrationCommand: CalibrationCommand | null; onCameraState: (state: CalibrationPose) => void }) {
  return (
    <Canvas
      aria-label="Sanctuary interior"
      frameloop="demand"
      dpr={[1, 1.5]}
      camera={{ position: [0, 1.75, 4], fov: 55, near: 0.05, far: 60 }}
      fallback={<p className="scene-message">The sanctuary view needs WebGL support.</p>}
    >
      <color attach="background" args={["#181612"]} />
      {calibrationEnabled ? <CameraCalibrationControls command={calibrationCommand} onCameraState={onCameraState} /> : <GuidedCamera view={view} reducedMotion={reducedMotion} revision={revision} onSettled={onSettled} />}
      <SanctuaryAtmosphere reducedMotion={reducedMotion} />
      <Suspense fallback={null}><SanctuaryScene onProgress={onProgress} view={view} interactive={interactive} onActivate={onActivate} /></Suspense>
    </Canvas>
  );
}
