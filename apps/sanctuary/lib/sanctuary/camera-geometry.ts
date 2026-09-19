// File: apps/sanctuary/lib/sanctuary/camera-geometry.ts
// Description: Derives camera reference volumes from accepted source bounds.
// Purpose: Prevents human-scale framing from drifting to object-anchor offsets.
// Notes: Blender bounds convert to browser coordinates as X, Z, -Y.

import sourceGeometry from "./source-geometry.json" with { type: "json" };

export type Point3 = [number, number, number];
export type Bounds3 = { min: Point3; max: Point3 };

function browserBounds(name: string): Bounds3 {
  const object = sourceGeometry.geometry.find((item) => item.name === name);
  if (!object) throw new Error(`Missing camera geometry: ${name}`);
  const { min, max } = object.bounds;
  return { min: [min[0], min[2], -max[1]], max: [max[0], max[2], -min[1]] };
}

function unionBounds(names: string[]): Bounds3 {
  const bounds = names.map(browserBounds);
  return {
    min: [0, 1, 2].map((axis) => Math.min(...bounds.map((item) => item.min[axis]))) as Point3,
    max: [0, 1, 2].map((axis) => Math.max(...bounds.map((item) => item.max[axis]))) as Point3,
  };
}

function center(bounds: Bounds3): Point3 {
  return bounds.min.map((value, axis) => (value + bounds.max[axis]) / 2) as Point3;
}

function size(bounds: Bounds3): Point3 {
  return bounds.min.map((value, axis) => bounds.max[axis] - value) as Point3;
}

const names = sourceGeometry.geometry.map((item) => item.name);
const named = (prefix: string) => names.filter((name) => name.startsWith(prefix));

const floor = unionBounds(["ROG_V2_Floor_Planks_AUTH", "ROG_V2_Floor_Substrate"]);
const eastWall = unionBounds(named("ROG_V2_Wall_East_"));
const westWall = unionBounds(named("ROG_V2_Wall_West_"));
const northWall = unionBounds(named("ROG_V2_Wall_North_"));
const ceiling = unionBounds(named("ROG_V2_Ceiling_"));
const clerestory = unionBounds(names.filter((name) => name.includes("Clerestory") && name.includes("_AUTH_")));
const table = browserBounds("ROG_TABLE_HYPER3D_MASTER");
const bible = browserBounds("ROG_BIBLE_HYPER3D_MASTER");
const kneelingRest = browserBounds("ROG_KNEE_REST_HYPER3D_MASTER");
const centralCross = browserBounds("ALTAR_ACC_HYPER3D_CROSS_CENTER_MASTER");

// Walls and ceiling establish the usable room, while the finished floor
// establishes the only human-height reference in this experience.
const interior: Bounds3 = {
  min: [westWall.max[0], floor.max[1], northWall.max[2]],
  max: [eastWall.min[0], ceiling.min[1], floor.max[2]],
};

export const sanctuaryCameraGeometry = {
  floor,
  eastWall,
  westWall,
  northWall,
  ceiling,
  clerestory,
  table,
  bible,
  kneelingRest,
  centralCross,
  interior,
  center,
  size,
  floorY: floor.max[1],
  adultEyeY: floor.max[1] + 1.68,
  rearSafeZ: floor.max[2] - .4,
  // The devotional station occupies the actual rear clearance behind the
  // kneeling rest rather than an arbitrary displacement from an interaction.
  devotionalZ: interior.max[2] - (interior.max[2] - kneelingRest.max[2]) * .25,
} as const;

export function boundsCorners(bounds: Bounds3): Point3[] {
  const corners: Point3[] = [];

  for (const x of [bounds.min[0], bounds.max[0]]) {
    for (const y of [bounds.min[1], bounds.max[1]]) {
      for (const z of [bounds.min[2], bounds.max[2]]) {
        corners.push([x, y, z]);
      }
    }
  }

  return corners;
}
