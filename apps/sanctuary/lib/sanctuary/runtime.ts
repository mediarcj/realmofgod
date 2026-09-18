// File: apps/sanctuary/lib/sanctuary/runtime.ts
// Description: Provides typed access to the accepted source anchors.
// Purpose: Keeps interactions and effects attached to the measured sanctuary.
// Notes: Positions and matrices are already converted to browser Y-up metres.

import contract from "./runtime-contract.json";

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
