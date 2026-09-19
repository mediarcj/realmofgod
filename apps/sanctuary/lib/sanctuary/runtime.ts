// File: apps/sanctuary/lib/sanctuary/runtime.ts
// Description: Provides typed access to the accepted source anchors.
// Purpose: Keeps interactions and effects attached to the measured sanctuary.
// Notes: Positions and matrices are already converted to browser Y-up metres.

import contract from "./runtime-contract.json";
import sourceGeometry from "./source-geometry.json";

export type Point3 = [number, number, number];
export const runtimeAnchors = contract.anchors;
export const referenceCamera = contract.reference_camera;
export function anchorByRole(role: string) {
  const anchor = runtimeAnchors.find((item) => item.role === role);
  if (!anchor) throw new Error(`Missing sanctuary anchor: ${role}`);
  return anchor;
}
export function point(values: number[]): Point3 {
  if (values.length !== 3 || !values.every(Number.isFinite)) throw new Error("Invalid sanctuary point");
  return [values[0], values[1], values[2]];
}

// The inventory records Blender coordinates. Browser derivatives use X, Z, -Y.
// This keeps camera targets tied to named source geometry instead of scene guesses.
export function sourceObjectCenter(name: string): Point3 {
  const object = sourceGeometry.geometry.find((item) => item.name === name);
  if (!object) throw new Error(`Missing sanctuary source object: ${name}`);
  const center = object.bounds.min.map((value, axis) => (value + object.bounds.max[axis]) / 2);
  return [center[0], center[2], -center[1]];
}
