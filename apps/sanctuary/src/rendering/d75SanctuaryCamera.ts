/**
 * File: apps/sanctuary/src/rendering/d75SanctuaryCamera.ts
 * Description: Converts the locked D7.5 Blender SANCTUARY camera into the local Three.js coordinate system.
 * Purpose: Keeps the visitor's first static sanctuary frame tied to the owner-approved authored camera.
 * Notes: The source calibration remains versioned under artifacts; this module adds no camera movement or storage.
 */

// Preserve the owner-approved Blender transform after the Blender-to-glTF axis conversion: (x, y, z) -> (x, z, -y).
export const d75SanctuaryCamera = {
  clipEnd: 500,
  clipStart: 0.009999999776482582,
  forward: [0.004210270941257477, -0.16493822634220123, -0.9862949252128601] as const,
  horizontalFovRadians: 2 * Math.atan(36 / (2 * 27)),
  position: [0.0211249440908432, 5.040225028991699, 10.790785789489746] as const,
  up: [0.0007038679905235767, 0.9863039255142212, -0.16493673622608185] as const,
} as const;

// Describe the exact projection values needed by the renderer without importing mutable Three.js classes here.
export interface D75SanctuaryProjection {
  readonly fovDegrees: number;
  readonly forward: readonly [number, number, number];
  readonly position: readonly [number, number, number];
  readonly up: readonly [number, number, number];
}

// Preserve Blender's horizontal sensor fit at each browser aspect ratio rather than guessing a new vertical lens.
export function selectD75SanctuaryProjection(viewportAspect: number): D75SanctuaryProjection {
  const safeAspect = Math.max(viewportAspect, Number.EPSILON);
  const fovRadians =
    2 * Math.atan(Math.tan(d75SanctuaryCamera.horizontalFovRadians / 2) / safeAspect);

  return {
    fovDegrees: (fovRadians * 180) / Math.PI,
    forward: d75SanctuaryCamera.forward,
    position: d75SanctuaryCamera.position,
    up: d75SanctuaryCamera.up,
  };
}
