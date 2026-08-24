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
    forward: [-0.0019341225270181894, 0.5195367336273193, -0.8544459342956543] as const,
    horizontalFovRadians: 2 * Math.atan(36 / (2 * 28)),
    position: [-0.005403348244726658, -0.21240007877349854, 8.475226402282715] as const,
    up: [0.0011753428261727095, 0.854448139667511, 0.5195354223251343] as const,
  },
  READ: {
    clipEnd: 500,
    clipStart: 0.009999999776482582,
    forward: [0.008063985034823418, -0.9981837868690491, -0.05969979614019394] as const,
    horizontalFovRadians: 2 * Math.atan(36 / (2 * 38)),
    position: [0.3297552466392517, 4.333072185516357, 0.1551894098520279] as const,
    up: [0.13363796472549438, 0.06024195998907089, -0.9891975522041321] as const,
  },
  SANCTUARY: d75SanctuaryCamera,
  SIT: {
    clipEnd: 500,
    clipStart: 0.009999999776482582,
    forward: [0.0007467248942703009, -0.2754653990268707, -0.9613106846809387] as const,
    horizontalFovRadians: 2 * Math.atan(36 / (2 * 30)),
    position: [-0.0001566986902616918, 4.976417064666748, 6.702975749969482] as const,
    up: [0.00021314318291842937, 0.9613109827041626, -0.27546530961990356] as const,
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
