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
import { createD9ReadingPageRegistrationGate } from "./d9ReadingPageRegistration";

// Re-export the public layout type from this component boundary for the Canvas and DOM shell.
export type { D9ReadingPageLayout } from "./d9ReadingPageGeometry";

// Keep the DEV warning process-wide so a remount cannot turn one malformed mesh into noisy console output.
let hasReportedD9ReadingPageRegistrationFailure = false;

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
  const registrationGate = useRef(createD9ReadingPageRegistrationGate<D9ReadingPageLayout>());

  useEffect(() => {
    // A successful layout may need a fresh screen projection after resize; a failed layout stays disabled.
    registrationGate.current.resetForViewport();
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
    // Bound registration to one attempt so a malformed page mesh cannot throw again on each render frame.
    const registration = registrationGate.current.register(() => {
      const [leftAnchor, rightAnchor] = selectD9ReadingPageAnchors();
      if (leftAnchor === undefined || rightAnchor === undefined) {
        throw new Error("The authored reading page is not available for visual registration.");
      }
      return {
        leftPage: projectD9PageQuad(leftAnchor, scene, gl.domElement, camera),
        rightPage: projectD9PageQuad(rightAnchor, scene, gl.domElement, camera),
      };
    });

    if (registration.status === "skipped") {
      return;
    }

    if (registration.status === "unavailable") {
      // Remove the optional page visual only; the semantic journey remains usable in READ.
      onLayoutChange(null);
      if (diagnosticsEnabled) {
        gl.domElement.setAttribute("data-d9-reading-page-registration", "unavailable");
      }
      if (import.meta.env.DEV && !hasReportedD9ReadingPageRegistrationFailure) {
        hasReportedD9ReadingPageRegistrationFailure = true;
        console.warn(
          "D9 reading-page visual overlay is disabled because its authored page geometry could not be registered.",
        );
      }
      return;
    }

    const layout = registration.value;
    if (diagnosticsEnabled) {
      gl.domElement.setAttribute("data-d9-reading-left-page", JSON.stringify(layout.leftPage));
      gl.domElement.setAttribute("data-d9-reading-right-page", JSON.stringify(layout.rightPage));
      gl.domElement.setAttribute("data-d9-reading-page-registration", "registered");
    }
    onLayoutChange(layout);
  });

  return null;
}
