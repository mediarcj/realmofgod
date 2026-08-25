/**
 * File: apps/sanctuary/src/rendering/D9ReadingPageProjection.tsx
 * Description: Measures and reports the settled authored Bible-page perspective layout during READ.
 * Purpose: Lets the DOM reading surface use real page-plane geometry without a per-frame React update loop.
 * Notes: This component has no text, storage, network, or visitor-content authority.
 */

// Import only the R3F settled-frame hook and local React lifecycle helpers needed to publish one static page layout.
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, type ReactNode } from "react";
import type { Object3D } from "three";

import { selectD9ReadingPageAnchors } from "./d9AffordanceAnchors";
import { projectD9PageQuad, type D9ReadingPageLayout } from "./d9ReadingPageGeometry";

// Re-export the public layout type from this component boundary for the Canvas and DOM shell.
export type { D9ReadingPageLayout } from "./d9ReadingPageGeometry";

// Measure only after the R3F scene and camera have settled, then repeat on a real viewport resize rather than updating React on every frame.
export function D9ReadingPageProjection({
  diagnosticsEnabled,
  onLayoutChange,
  scene,
}: {
  readonly diagnosticsEnabled: boolean;
  readonly onLayoutChange: (layout: D9ReadingPageLayout | null) => void;
  readonly scene: Object3D;
}): ReactNode {
  const { camera, gl, size } = useThree();
  const pendingMeasurement = useRef(true);

  useEffect(() => {
    pendingMeasurement.current = true;
  }, [size.height, size.width]);

  useEffect(() => {
    return () => {
      // Remove the DOM layout and diagnostics when READ ends so a later state cannot leave text floating over the room.
      onLayoutChange(null);
      gl.domElement.removeAttribute("data-d9-reading-left-page");
      gl.domElement.removeAttribute("data-d9-reading-right-page");
    };
  }, [gl, onLayoutChange]);

  useFrame(() => {
    if (!pendingMeasurement.current) {
      return;
    }
    const [leftAnchor, rightAnchor] = selectD9ReadingPageAnchors();
    if (leftAnchor === undefined || rightAnchor === undefined) {
      return;
    }
    const layout: D9ReadingPageLayout = {
      leftPage: projectD9PageQuad(leftAnchor, scene, gl.domElement, camera),
      rightPage: projectD9PageQuad(rightAnchor, scene, gl.domElement, camera),
    };
    pendingMeasurement.current = false;
    if (diagnosticsEnabled) {
      gl.domElement.setAttribute("data-d9-reading-left-page", JSON.stringify(layout.leftPage));
      gl.domElement.setAttribute("data-d9-reading-right-page", JSON.stringify(layout.rightPage));
    }
    onLayoutChange(layout);
  });

  return null;
}
