/**
 * File: apps/sanctuary/src/rendering/d9CameraTransition.ts
 * Description: Defines the bounded D9.0C.0 camera presentation math between locked sanctuary endpoints.
 * Purpose: Keeps the first guided camera move deterministic without changing sanctuary meaning or authored D7.5 data.
 * Notes: Only SANCTUARY to SIT may move in this proof; every other state change stays an exact endpoint snap.
 */

// Import only stable Three.js math primitives; this module creates no renderer, storage, or browser event listener.
import { MathUtils, Matrix4, Quaternion, Vector3 } from "three";

import {
  d75SanctuaryCameras,
  selectD75SanctuaryProjection,
  type D75SanctuaryCameraName,
  type D75SanctuaryFramingPolicy,
} from "./d75SanctuaryCamera";

// Keep the owner-requested calm duration explicit while leaving a later motion-review pass free to revise it deliberately.
export const d9SanctuaryToSitDurationMs = 2700;

// Describe the only presentation plans permitted by this narrow proof without putting animation facts in the sanctuary reducer.
export type D9CameraTransitionPlan =
  | { readonly kind: "snap"; readonly target: D75SanctuaryCameraName }
  | {
      readonly from: "SANCTUARY";
      readonly kind: "sanctuary-to-sit";
      readonly target: "SIT";
    };

// Keep the camera near the established center aisle: the controls move forward and gently lower without lateral wandering.
const sanctuaryToSitControls = {
  first: [0.015, 5.032, 9.74] as const,
  second: [0.004, 4.991, 7.62] as const,
} as const;

// Publish conservative bounds so focused tests can prevent future edits from sending the visitor through benches, walls, or the open rear.
export const d9SanctuaryToSitPathBounds = {
  maximum: [0.022, 5.041, 10.791] as const,
  minimum: [-0.001, 4.975, 6.702] as const,
} as const;

// Name the complete mutable camera pose the controller may apply while leaving endpoint selection with immutable D7.5 data.
export interface D9CameraPose {
  readonly far: number;
  readonly fovDegrees: number;
  readonly near: number;
  readonly position: Vector3;
  readonly quaternion: Quaternion;
  readonly up: Vector3;
}

// Clamp externally supplied progress before it can influence camera math or a test-only evidence attribute.
export function clampD9CameraTransitionProgress(progress: number): number {
  return MathUtils.clamp(progress, 0, 1);
}

// Use a bounded quintic ease-in-out so the camera begins and ends quietly with no spring or overshoot behavior.
export function easeD9CameraTransition(progress: number): number {
  const bounded = clampD9CameraTransitionProgress(progress);
  return bounded * bounded * bounded * (bounded * (bounded * 6 - 15) + 10);
}

// Select the only non-snap route and make reduced motion an immediate exact endpoint application.
export function selectD9CameraTransitionPlan(
  from: D75SanctuaryCameraName | null,
  target: D75SanctuaryCameraName,
  reducedMotion: boolean,
): D9CameraTransitionPlan {
  if (!reducedMotion && from === "SANCTUARY" && target === "SIT") {
    return { from: "SANCTUARY", kind: "sanctuary-to-sit", target: "SIT" };
  }
  return { kind: "snap", target };
}

// Convert an exact D7.5 forward/up contract to a normalized camera orientation without using Euler interpolation.
function createCameraQuaternion(position: Vector3, forward: Vector3, up: Vector3): Quaternion {
  const lookAtMatrix = new Matrix4().lookAt(position, position.clone().add(forward), up);
  return new Quaternion().setFromRotationMatrix(lookAtMatrix).normalize();
}

// Build one immutable authored endpoint in browser projection space while retaining the established horizontal framing policy.
export function createD9CameraEndpoint(
  cameraName: D75SanctuaryCameraName,
  viewportAspect: number,
  framingPolicy: D75SanctuaryFramingPolicy,
): D9CameraPose {
  const projection = selectD75SanctuaryProjection(viewportAspect, framingPolicy, cameraName);
  const authoredCamera = d75SanctuaryCameras[cameraName];
  const position = new Vector3(...projection.position);
  const forward = new Vector3(...projection.forward);
  const up = new Vector3(...projection.up).normalize();

  return {
    far: authoredCamera.clipEnd,
    fovDegrees: projection.fovDegrees,
    near: authoredCamera.clipStart,
    position,
    quaternion: createCameraQuaternion(position, forward, up),
    up,
  };
}

// Evaluate the minimum four-point cubic Bézier needed for a gentle central approach rather than a mechanical linear conveyor move.
function sampleSanctuaryToSitPosition(easedProgress: number): Vector3 {
  const start = new Vector3(...d75SanctuaryCameras.SANCTUARY.position);
  const first = new Vector3(...sanctuaryToSitControls.first);
  const second = new Vector3(...sanctuaryToSitControls.second);
  const end = new Vector3(...d75SanctuaryCameras.SIT.position);
  const inverse = 1 - easedProgress;

  return start
    .multiplyScalar(inverse * inverse * inverse)
    .add(first.multiplyScalar(3 * inverse * inverse * easedProgress))
    .add(second.multiplyScalar(3 * inverse * easedProgress * easedProgress))
    .add(end.multiplyScalar(easedProgress * easedProgress * easedProgress));
}

// Sample the sole moving path, returning exact D7.5 endpoint poses at both limits to prevent accumulated float drift.
export function sampleD9SanctuaryToSitTransition(
  progress: number,
  viewportAspect: number,
  framingPolicy: D75SanctuaryFramingPolicy,
): D9CameraPose {
  const bounded = clampD9CameraTransitionProgress(progress);
  const sanctuary = createD9CameraEndpoint("SANCTUARY", viewportAspect, framingPolicy);
  const sit = createD9CameraEndpoint("SIT", viewportAspect, framingPolicy);

  if (bounded === 0) {
    return sanctuary;
  }
  if (bounded === 1) {
    return sit;
  }

  const eased = easeD9CameraTransition(bounded);
  return {
    far: MathUtils.lerp(sanctuary.far, sit.far, eased),
    fovDegrees: MathUtils.lerp(sanctuary.fovDegrees, sit.fovDegrees, eased),
    near: MathUtils.lerp(sanctuary.near, sit.near, eased),
    position: sampleSanctuaryToSitPosition(eased),
    quaternion: new Quaternion()
      .slerpQuaternions(sanctuary.quaternion, sit.quaternion, eased)
      .normalize(),
    up: sanctuary.up.clone().lerp(sit.up, eased).normalize(),
  };
}

// Keep the controller's next-frame request policy independently testable and strictly bounded to unfinished movement.
export function shouldInvalidateD9CameraTransition(progress: number): boolean {
  return clampD9CameraTransitionProgress(progress) < 1;
}
