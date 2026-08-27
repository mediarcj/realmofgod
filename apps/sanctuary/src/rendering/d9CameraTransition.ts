/**
 * File: apps/sanctuary/src/rendering/d9CameraTransition.ts
 * Description: Defines bounded D9.0C.1 presentation paths between locked sanctuary camera endpoints.
 * Purpose: Lets rendering choreograph the approved guided journey while the sanctuary reducer keeps semantic state authority.
 * Notes: Every completed route returns to an exact immutable D7.5 endpoint; reduced motion always selects an immediate endpoint snap.
 */

// Import only stable Three.js math primitives; this module creates no renderer, storage, or browser event listener.
import { MathUtils, Matrix4, Quaternion, Vector3 } from "three";

import {
  d75SanctuaryCameras,
  selectD75SanctuaryProjection,
  type D75SanctuaryCameraName,
  type D75SanctuaryFramingPolicy,
} from "./d75SanctuaryCamera";

// Name the presentation-only routes approved for the guided sanctuary and its universal Home return control.
export type D9CameraTransitionRoute =
  | "sanctuary-to-sit"
  | "sit-to-read"
  | "read-to-pray"
  | "pray-to-sanctuary"
  | "sit-home-to-sanctuary"
  | "read-home-to-sanctuary";

// Keep the duration of each calm route explicit so later artistic review can revise one route without changing state meaning.
export const d9CameraTransitionDurationsMs: Readonly<Record<D9CameraTransitionRoute, number>> = {
  "pray-to-sanctuary": 2900,
  "read-home-to-sanctuary": 2800,
  "read-to-pray": 3100,
  "sanctuary-to-sit": 2700,
  "sit-home-to-sanctuary": 2700,
  "sit-to-read": 2100,
};

// Preserve the owner-reviewed first-route duration under its established exported name for focused regression checks.
export const d9SanctuaryToSitDurationMs = d9CameraTransitionDurationsMs["sanctuary-to-sit"];

// Represent a moving route separately from application state so rendering can safely rebase it without changing the reducer.
export interface D9CameraMovePlan {
  readonly from: D75SanctuaryCameraName;
  readonly kind: D9CameraTransitionRoute;
  readonly target: D75SanctuaryCameraName;
}

// Describe either an approved visual route or an exact endpoint application for restored and reduced-motion states.
export type D9CameraTransitionPlan =
  { readonly kind: "snap"; readonly target: D75SanctuaryCameraName } | D9CameraMovePlan;

// Keep the authored-style controls inside the open center aisle or the intentional open-rear approach, not through furniture.
const d9CameraTransitionControls: Readonly<
  Record<
    D9CameraTransitionRoute,
    {
      readonly first: readonly [number, number, number];
      readonly second: readonly [number, number, number];
    }
  >
> = {
  "pray-to-sanctuary": {
    first: [-0.004, 0.68, 8.9],
    second: [0.014, 4.78, 10.22],
  },
  "read-home-to-sanctuary": {
    first: [0.3, 4.72, 2.2],
    second: [0.035, 5.1, 9.3],
  },
  "read-to-pray": {
    first: [0.26, 4.56, 1.22],
    second: [0.035, 1.36, 6.7],
  },
  "sanctuary-to-sit": {
    first: [0.015, 5.032, 9.74],
    second: [0.004, 4.991, 7.62],
  },
  "sit-home-to-sanctuary": {
    first: [0.028, 4.94, 7.76],
    second: [0.038, 5.1, 9.7],
  },
  "sit-to-read": {
    first: [0.008, 4.96, 5.45],
    second: [0.19, 4.53, 1.45],
  },
};

// Publish conservative route envelopes so focused tests detect clipping-prone edits before a browser review.
export const d9CameraTransitionPathBounds: Readonly<
  Record<
    D9CameraTransitionRoute,
    {
      readonly maximum: readonly [number, number, number];
      readonly minimum: readonly [number, number, number];
    }
  >
> = {
  "pray-to-sanctuary": {
    maximum: [0.022, 5.041, 10.791],
    minimum: [-0.006, -0.213, 8.475],
  },
  "read-home-to-sanctuary": {
    maximum: [0.33, 5.101, 10.791],
    minimum: [0.021, 4.333, 0.155],
  },
  "read-to-pray": {
    maximum: [0.33, 4.561, 8.476],
    minimum: [-0.006, -0.213, 0.155],
  },
  "sanctuary-to-sit": {
    maximum: [0.022, 5.041, 10.791],
    minimum: [-0.001, 4.975, 6.702],
  },
  "sit-home-to-sanctuary": {
    maximum: [0.039, 5.101, 10.791],
    minimum: [-0.001, 4.939, 6.702],
  },
  "sit-to-read": {
    maximum: [0.33, 4.977, 6.703],
    minimum: [-0.001, 4.333, 0.155],
  },
};

// Preserve the initial proof's named path contract for direct regression coverage without duplicating its bounds.
export const d9SanctuaryToSitPathBounds = d9CameraTransitionPathBounds["sanctuary-to-sit"];

// State the small geometry facts used by tests to keep paths above the table before they move into the open rear approach.
export const d9CameraTransitionClearanceContracts = {
  aboveTableY: 2.3,
  openRearBeginsAtZ: 4.1,
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

// Copy a rendered pose before a legal interruption so the next route begins from what the visitor actually saw.
export function cloneD9CameraPose(pose: D9CameraPose): D9CameraPose {
  return {
    far: pose.far,
    fovDegrees: pose.fovDegrees,
    near: pose.near,
    position: pose.position.clone(),
    quaternion: pose.quaternion.clone(),
    up: pose.up.clone(),
  };
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

// Choose the legal presentation route from semantic endpoints; a null source means a restored state and must never replay travel.
export function selectD9CameraTransitionPlan(
  from: D75SanctuaryCameraName | null,
  target: D75SanctuaryCameraName,
  reducedMotion: boolean,
): D9CameraTransitionPlan {
  if (reducedMotion || from === null) {
    return { kind: "snap", target };
  }

  const routeByEndpointPair: Partial<
    Record<`${D75SanctuaryCameraName}:${D75SanctuaryCameraName}`, D9CameraTransitionRoute>
  > = {
    "PRAY:SANCTUARY": "pray-to-sanctuary",
    "READ:PRAY": "read-to-pray",
    "READ:SANCTUARY": "read-home-to-sanctuary",
    "SANCTUARY:SIT": "sanctuary-to-sit",
    "SIT:READ": "sit-to-read",
    "SIT:SANCTUARY": "sit-home-to-sanctuary",
  };
  const route = routeByEndpointPair[`${from}:${target}`];

  return route === undefined ? { kind: "snap", target } : { from, kind: route, target };
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

// Evaluate one four-point cubic Bézier without creating a motion library or a second rendering system.
function sampleCubicPosition(
  start: Vector3,
  first: Vector3,
  second: Vector3,
  end: Vector3,
  easedProgress: number,
): Vector3 {
  const inverse = 1 - easedProgress;
  return start
    .clone()
    .multiplyScalar(inverse * inverse * inverse)
    .add(first.multiplyScalar(3 * inverse * inverse * easedProgress))
    .add(second.multiplyScalar(3 * inverse * easedProgress * easedProgress))
    .add(end.clone().multiplyScalar(easedProgress * easedProgress * easedProgress));
}

// Shift only the first authored control during a rapid action so an interruption begins at the actual rendered pose without changing the safe corridor near arrival.
function resolveFirstControl(
  route: D9CameraTransitionRoute,
  authoredStart: D9CameraPose,
  rebasedStart: D9CameraPose | undefined,
): Vector3 {
  const authoredFirst = new Vector3(...d9CameraTransitionControls[route].first);
  return rebasedStart === undefined
    ? authoredFirst
    : authoredFirst.add(rebasedStart.position.clone().sub(authoredStart.position));
}

// Sample an approved route, preserving exact D7.5 endpoints while allowing the controller to rebase from a captured visual pose after interruption.
export function sampleD9CameraTransition(
  plan: D9CameraMovePlan,
  progress: number,
  viewportAspect: number,
  framingPolicy: D75SanctuaryFramingPolicy,
  rebasedStart?: D9CameraPose,
): D9CameraPose {
  const bounded = clampD9CameraTransitionProgress(progress);
  const authoredStart = createD9CameraEndpoint(plan.from, viewportAspect, framingPolicy);
  const start = rebasedStart === undefined ? authoredStart : cloneD9CameraPose(rebasedStart);
  const end = createD9CameraEndpoint(plan.target, viewportAspect, framingPolicy);

  if (bounded === 0) {
    return start;
  }
  if (bounded === 1) {
    return end;
  }

  const eased = easeD9CameraTransition(bounded);
  return {
    far: MathUtils.lerp(start.far, end.far, eased),
    fovDegrees: MathUtils.lerp(start.fovDegrees, end.fovDegrees, eased),
    near: MathUtils.lerp(start.near, end.near, eased),
    position: sampleCubicPosition(
      start.position,
      resolveFirstControl(plan.kind, authoredStart, rebasedStart),
      new Vector3(...d9CameraTransitionControls[plan.kind].second),
      end.position,
      eased,
    ),
    quaternion: new Quaternion()
      .slerpQuaternions(start.quaternion, end.quaternion, eased)
      .normalize(),
    up: start.up.clone().lerp(end.up, eased).normalize(),
  };
}

// Keep the approved first route callable through its former helper while all controller code uses the general transition model.
export function sampleD9SanctuaryToSitTransition(
  progress: number,
  viewportAspect: number,
  framingPolicy: D75SanctuaryFramingPolicy,
): D9CameraPose {
  return sampleD9CameraTransition(
    { from: "SANCTUARY", kind: "sanctuary-to-sit", target: "SIT" },
    progress,
    viewportAspect,
    framingPolicy,
  );
}

// Keep the controller's next-frame request policy independently testable and strictly bounded to unfinished movement.
export function shouldInvalidateD9CameraTransition(progress: number): boolean {
  return clampD9CameraTransitionProgress(progress) < 1;
}
