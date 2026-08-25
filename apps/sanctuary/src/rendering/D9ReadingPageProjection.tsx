/**
 * File: apps/sanctuary/src/rendering/D9ReadingPageProjection.tsx
 * Description: Projects the authored open Bible pages into DOM overlay rectangles for the settled READ state.
 * Purpose: Keeps development reading text semantic and crisp while it remains spatially attached to the real page geometry.
 * Notes: The component has no text or action authority; it measures local scene geometry and reports layout only.
 */

// Import R3F frame access and Three vectors needed to project an authored page box through the active camera.
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, type ReactNode } from "react";
import { Box3, Vector3, type Camera, type Object3D } from "three";

import { selectD9ReadingPageAnchors, type D9ReadingPageAnchor } from "./d9AffordanceAnchors";

// Describe the viewport rectangle of one authored page without exposing mutable Three values to the DOM layer.
export interface D9ReadingPageRect {
  readonly height: number;
  readonly left: number;
  readonly top: number;
  readonly width: number;
}

// Preserve left/right page identity for future reading replacement or page-turn work without implementing it now.
export interface D9ReadingPageLayout {
  readonly leftPage: D9ReadingPageRect;
  readonly rightPage: D9ReadingPageRect;
}

// Project all eight measured authored-page corners so responsive layout cannot detach DOM text from its visible geometry.
function projectPageRect(
  anchor: D9ReadingPageAnchor,
  scene: Object3D,
  canvas: HTMLCanvasElement,
  camera: Camera,
): D9ReadingPageRect {
  const pageNode = scene.getObjectByName(anchor.semanticRoot);
  if (pageNode === undefined) {
    throw new Error(`The authored reading page is unavailable: ${anchor.semanticRoot}.`);
  }
  const box = new Box3().setFromObject(pageNode);
  if (box.isEmpty()) {
    throw new Error(
      `The authored reading page has no measurable geometry: ${anchor.semanticRoot}.`,
    );
  }
  const horizontal: number[] = [];
  const vertical: number[] = [];
  for (const x of [box.min.x, box.max.x]) {
    for (const y of [box.min.y, box.max.y]) {
      for (const z of [box.min.z, box.max.z]) {
        const point = new Vector3(x, y, z).project(camera);
        horizontal.push((point.x + 1) * 0.5 * canvas.clientWidth);
        vertical.push((1 - point.y) * 0.5 * canvas.clientHeight);
      }
    }
  }
  const left = Math.min(...horizontal);
  const top = Math.min(...vertical);
  const width = Math.max(0, Math.max(...horizontal) - left);
  const height = Math.max(0, Math.max(...vertical) - top);
  // Inset the axis-aligned perspective footprint so page typography avoids its beveled edge and central binding.
  const insetHorizontal = width * 0.13;
  const insetVertical = height * 0.1;
  return {
    height: Math.max(0, height - insetVertical * 2),
    left: left + insetHorizontal,
    top: top + insetVertical,
    width: Math.max(0, width - insetHorizontal * 2),
  };
}

// Measure the static authored pages only while READ is active; the settled camera makes the reported layout stable.
export function D9ReadingPageProjection({
  onLayoutChange,
  scene,
}: {
  readonly onLayoutChange: (layout: D9ReadingPageLayout | null) => void;
  readonly scene: Object3D;
}): ReactNode {
  const { camera, gl } = useThree();
  const lastSerializedLayout = useRef("");

  useEffect(() => {
    return () => {
      // Remove the DOM layout when READ ends so a later state cannot leave text floating over the room.
      onLayoutChange(null);
    };
  }, [onLayoutChange]);

  useFrame(() => {
    const [leftAnchor, rightAnchor] = selectD9ReadingPageAnchors();
    if (leftAnchor === undefined || rightAnchor === undefined) {
      return;
    }
    const layout: D9ReadingPageLayout = {
      leftPage: projectPageRect(leftAnchor, scene, gl.domElement, camera),
      rightPage: projectPageRect(rightAnchor, scene, gl.domElement, camera),
    };
    const serialized = JSON.stringify(layout);
    if (serialized !== lastSerializedLayout.current) {
      lastSerializedLayout.current = serialized;
      onLayoutChange(layout);
    }
  });

  return null;
}
