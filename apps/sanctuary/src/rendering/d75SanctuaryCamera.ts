/**
 * File: apps/sanctuary/src/rendering/d75SanctuaryCamera.ts
 * Description: Converts the four locked D7.5 Blender sanctuary cameras into the local Three.js coordinate system.
 * Purpose: Keeps each guided sanctuary state tied to its owner-approved authored endpoint without camera interpolation.
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

// Name the only four authored endpoints the guided sanctuary may select.
export type D75SanctuaryCameraName = "SANCTUARY" | "SIT" | "READ" | "PRAY";

// Preserve the Blender-to-glTF conversion for each exact D7.5 endpoint rather than deriving new camera positions.
export const d75SanctuaryCameras = {
  PRAY: {
    clipEnd: 500,
    clipStart: 0.009999999776482582,
    forward: [0.001228, 0.01149, -0.999933] as const,
    horizontalFovRadians: 2 * Math.atan(36 / (2 * 28)),
    position: [-0.005403348244726658, -0.21240007877349854, 8.475226402282715] as const,
    up: [0.000014, 0.999934, 0.01149] as const,
  },
  READ: {
    clipEnd: 500,
    clipStart: 0.009999999776482582,
    forward: [-0.014873, -0.123062, -0.992286] as const,
    horizontalFovRadians: 2 * Math.atan(36 / (2 * 38)),
    position: [0.3297552466392517, 4.333072185516357, 0.1551894098520279] as const,
    up: [-0.001845, 0.992399, -0.12304] as const,
  },
  SANCTUARY: d75SanctuaryCamera,
  SIT: {
    clipEnd: 500,
    clipStart: 0.009999999776482582,
    forward: [0.000093, -0.157713, -0.987485] as const,
    horizontalFovRadians: 2 * Math.atan(36 / (2 * 30)),
    position: [-0.000156698690960184, 4.976417064666748, 6.702975749969482] as const,
    up: [0.000015, 0.987485, -0.157713] as const,
  },
} as const;

// Describe the exact projection values needed by the renderer without importing mutable Three.js classes here.
export interface D75SanctuaryProjection {
  readonly fovDegrees: number;
  readonly forward: readonly [number, number, number];
  readonly position: readonly [number, number, number];
  readonly up: readonly [number, number, number];
}

// Keep the temporary D9.0A.1 A/B framing choices explicit and restricted to the existing authored camera.
export type D75SanctuaryFramingPolicy = "horizontal" | "stable-vertical";

// Preserve Blender's horizontal sensor fit by default; the alternative holds the approved reference vertical lens for comparison.
export function selectD75SanctuaryProjection(
  viewportAspect: number,
  framingPolicy: D75SanctuaryFramingPolicy = "horizontal",
  cameraName: D75SanctuaryCameraName = "SANCTUARY",
): D75SanctuaryProjection {
  const authoredCamera = d75SanctuaryCameras[cameraName];
  const safeAspect = Math.max(viewportAspect, Number.EPSILON);
  const referenceAspect = 3120 / 1328;
  const referenceVerticalFovRadians =
    2 * Math.atan(Math.tan(authoredCamera.horizontalFovRadians / 2) / referenceAspect);
  const fovRadians =
    framingPolicy === "stable-vertical"
      ? referenceVerticalFovRadians
      : 2 * Math.atan(Math.tan(authoredCamera.horizontalFovRadians / 2) / safeAspect);

  return {
    fovDegrees: (fovRadians * 180) / Math.PI,
    forward: authoredCamera.forward,
    position: authoredCamera.position,
    up: authoredCamera.up,
  };
}
