/**
 * File: apps/sanctuary/src/rendering/d9ReadingPageGeometry.ts
 * Description: Derives and projects the authored Bible page planes for D9 DOM perspective registration.
 * Purpose: Makes the reading overlay follow real page mesh corners rather than an axis-aligned screen estimate.
 * Notes: This pure local module has no React, DOM, storage, network, or visitor-content behavior.
 */

// Import only Three geometry primitives needed to inspect a local page mesh and project it through an existing camera.
import { Mesh, Vector3, type BufferGeometry, type Camera, type Object3D } from "three";

import type { D9ReadingPageAnchor } from "./d9AffordanceAnchors";

// Describe one browser-space point without leaking mutable Three vectors into the DOM layer.
export interface D9ScreenPoint {
  readonly x: number;
  readonly y: number;
}

// Preserve the four visible page corners in DOM reading order: top-left, top-right, bottom-right, bottom-left.
export interface D9ReadingPageQuad {
  readonly corners: readonly [D9ScreenPoint, D9ScreenPoint, D9ScreenPoint, D9ScreenPoint];
  readonly semanticRoot: "Bible_LeftOpenPage" | "Bible_RightOpenPage";
  readonly sourceHeight: number;
  readonly sourceWidth: number;
}

// Keep left/right page identity explicit so the semantic overlay and the physical book remain independently reviewable.
export interface D9ReadingPageLayout {
  readonly leftPage: D9ReadingPageQuad;
  readonly rightPage: D9ReadingPageQuad;
}

// Narrow Three's intentionally broad traversal type to the one geometry surface needed for local page measurement.
type PageMesh = Object3D & { readonly geometry: BufferGeometry };

// Return every concrete mesh below one semantic page root so authored page geometry, not a Box3, remains the projection source.
function collectPageMeshes(pageNode: Object3D): PageMesh[] {
  const meshes: PageMesh[] = [];
  pageNode.traverse((candidate) => {
    const mesh = candidate as unknown as PageMesh;
    if (candidate instanceof Mesh) {
      meshes.push(mesh);
    }
  });
  return meshes;
}

// Select the four upper-face vertices from the deliberately simple authored page wedge without relying on texture coordinates.
export function deriveD9PageSurfaceCorners(pageNode: Object3D): readonly Vector3[] {
  const vertices: Vector3[] = [];
  for (const mesh of collectPageMeshes(pageNode)) {
    const positions = mesh.geometry.getAttribute("position");
    for (let index = 0; index < positions.count; index += 1) {
      vertices.push(mesh.localToWorld(new Vector3().fromBufferAttribute(positions, index)));
    }
  }
  const highest = Math.max(...vertices.map((vertex) => vertex.y));
  const lowest = Math.min(...vertices.map((vertex) => vertex.y));
  const upperFaceThreshold = lowest + (highest - lowest) * 0.55;
  const deduplicated = new Map<string, Vector3>();
  for (const vertex of vertices) {
    if (vertex.y >= upperFaceThreshold) {
      deduplicated.set(
        vertex
          .toArray()
          .map((value) => value.toFixed(5))
          .join(","),
        vertex,
      );
    }
  }
  const surfaceCorners = [...deduplicated.values()];
  if (surfaceCorners.length !== 4) {
    throw new Error(
      `The authored reading page needs four upper-face vertices; found ${surfaceCorners.length.toString()}.`,
    );
  }
  return surfaceCorners;
}

// Put four projected corners in stable DOM reading order so CSS can map a normal rectangle onto the angled page plane.
export function orderD9ScreenQuad(
  points: readonly D9ScreenPoint[],
): readonly [D9ScreenPoint, D9ScreenPoint, D9ScreenPoint, D9ScreenPoint] {
  if (points.length !== 4) {
    throw new Error(
      `A reading page needs four projected corners; received ${points.length.toString()}.`,
    );
  }
  const byVertical = [...points].sort((first, second) => first.y - second.y);
  const top = byVertical.slice(0, 2).sort((first, second) => first.x - second.x);
  const bottom = byVertical.slice(2).sort((first, second) => first.x - second.x);
  const [topLeft, topRight] = top;
  const [bottomLeft, bottomRight] = bottom;
  if (
    topLeft === undefined ||
    topRight === undefined ||
    bottomLeft === undefined ||
    bottomRight === undefined
  ) {
    throw new Error("The projected reading page could not be ordered.");
  }
  return [topLeft, topRight, bottomRight, bottomLeft];
}

// Project one authored page plane through the active settled READ camera; this is intentionally not an axis-aligned Box3 rectangle.
export function projectD9PageQuad(
  anchor: D9ReadingPageAnchor,
  scene: Object3D,
  canvas: HTMLCanvasElement,
  camera: Camera,
): D9ReadingPageQuad {
  const pageNode = scene.getObjectByName(anchor.semanticRoot);
  if (pageNode === undefined) {
    throw new Error(`The authored reading page is unavailable: ${anchor.semanticRoot}.`);
  }
  const projected = deriveD9PageSurfaceCorners(pageNode).map((corner) => {
    const point = corner.clone().project(camera);
    return {
      x: (point.x + 1) * 0.5 * canvas.clientWidth,
      y: (1 - point.y) * 0.5 * canvas.clientHeight,
    };
  });
  const corners = orderD9ScreenQuad(projected);
  const [topLeft, topRight, bottomRight, bottomLeft] = corners;
  const distance = (first: D9ScreenPoint, second: D9ScreenPoint): number =>
    Math.hypot(second.x - first.x, second.y - first.y);
  return {
    corners,
    semanticRoot: anchor.semanticRoot,
    sourceHeight: Math.max(
      1,
      (distance(topLeft, bottomLeft) + distance(topRight, bottomRight)) / 2,
    ),
    sourceWidth: Math.max(1, (distance(topLeft, topRight) + distance(bottomLeft, bottomRight)) / 2),
  };
}

// Build a dependency-free CSS homography that maps a semantic page rectangle onto the projected page quad.
export function createD9PageMatrix3d(quad: D9ReadingPageQuad): string {
  const [topLeft, topRight, bottomRight, bottomLeft] = quad.corners;
  const dx1 = topRight.x - bottomRight.x;
  const dx2 = bottomLeft.x - bottomRight.x;
  const dx3 = topLeft.x - topRight.x + bottomRight.x - bottomLeft.x;
  const dy1 = topRight.y - bottomRight.y;
  const dy2 = bottomLeft.y - bottomRight.y;
  const dy3 = topLeft.y - topRight.y + bottomRight.y - bottomLeft.y;
  const denominator = dx1 * dy2 - dx2 * dy1;
  if (Math.abs(denominator) < 0.00001) {
    throw new Error(`The authored reading page is degenerate: ${quad.semanticRoot}.`);
  }
  const g = (dx3 * dy2 - dx2 * dy3) / denominator;
  const h = (dx1 * dy3 - dx3 * dy1) / denominator;
  const a = (topRight.x - topLeft.x + g * topRight.x) / quad.sourceWidth;
  const b = (bottomLeft.x - topLeft.x + h * bottomLeft.x) / quad.sourceHeight;
  const c = topLeft.x;
  const d = (topRight.y - topLeft.y + g * topRight.y) / quad.sourceWidth;
  const e = (bottomLeft.y - topLeft.y + h * bottomLeft.y) / quad.sourceHeight;
  const f = topLeft.y;
  // CSS matrix3d uses column-major ordering; source dimensions keep semantic text at its intended pixel scale.
  return `matrix3d(${[a, d, 0, g / quad.sourceWidth, b, e, 0, h / quad.sourceHeight, 0, 0, 1, 0, c, f, 0, 1].join(",")})`;
}
