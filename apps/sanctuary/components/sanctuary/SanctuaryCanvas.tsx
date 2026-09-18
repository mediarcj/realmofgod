// File: apps/sanctuary/components/sanctuary/SanctuaryCanvas.tsx
// Description: Hosts the browser-only sanctuary renderer.
// Purpose: Gives the accepted assets an isolated, demand-rendered canvas.
// Notes: No physical geometry is generated here.
"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { SanctuaryScene } from "./SanctuaryScene";

export default function SanctuaryCanvas() {
  return (
    <Canvas
      aria-label="Sanctuary interior"
      frameloop="demand"
      dpr={[1, 1.5]}
      camera={{ position: [0, 2, 4], fov: 55, near: 0.05, far: 60 }}
      onCreated={({ camera }) => camera.lookAt(0, 0, -1)}
      fallback={<p className="scene-message">The sanctuary view needs WebGL support.</p>}
    >
      <color attach="background" args={["#181612"]} />
      <hemisphereLight args={["#fff4df", "#40382c", 2]} />
      <directionalLight position={[2, 6, 3]} intensity={3} color="#fff0d2" />
      <Suspense fallback={null}><SanctuaryScene /></Suspense>
    </Canvas>
  );
}
