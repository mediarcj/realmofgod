/**
 * File: apps/sanctuary/src/rendering/d9DomInteractionTarget.ts
 * Description: Projects one authored sanctuary affordance into a bounded semantic DOM interaction region.
 * Purpose: Keeps pointer and touch action authority in accessible DOM controls rather than fragile Canvas raycasts.
 * Notes: This module is pure and local; it projects no visitor content and creates no browser persistence or network work.
 */

// Import only stable Three geometry and camera helpers used to project authored world-space bounds.
import { PerspectiveCamera, Vector3, type Camera } from "three";

import { selectSanctuaryAffordance, type SanctuaryMvpState } from "../sanctuary/model";
import { selectD75SanctuaryProjection } from "./d75SanctuaryCamera";
import { selectD9AffordanceAnchors, type D9AffordanceAnchor } from "./d9AffordanceAnchors";

// Describe a bounded screen rectangle that a semantic DOM button can safely own.
export interface D9ScreenBounds {
  readonly bottom: number;
  readonly height: number;
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly width: number;
}

// Keep DOM hover and focus as the only input that can strengthen the local Three.js warmth cue.
export type D9DomInteractionVisualState = "focused" | "hovered" | "idle";

// Describe the sole state-legal DOM target without granting it state-transition authority.
export interface D9DomInteractionTarget {
  readonly action: ReturnType<typeof selectSanctuaryAffordance>["action"];
  readonly ariaLabel: string;
  readonly key: string;
  readonly screenBounds: D9ScreenBounds;
  readonly semanticRoot: string;
}

// Name the minimal viewport facts needed by the pure projection layer.
export interface D9InteractionViewport {
  readonly height: number;
  readonly width: number;
}

// Build the exact D7.5 state camera for unit verification without mounting a Canvas or creating a WebGL context.
function createD75ProjectionCamera(
  state: SanctuaryMvpState["name"],
  viewport: D9InteractionViewport,
): PerspectiveCamera {
  const projection = selectD75SanctuaryProjection(
    viewport.width / viewport.height,
    "horizontal",
    state,
  );
  const camera = new PerspectiveCamera(
    projection.fovDegrees,
    viewport.width / viewport.height,
    0.01,
    500,
  );
  const position = new Vector3(...projection.position);

  camera.position.copy(position);
  camera.up.set(...projection.up);
  camera.lookAt(position.add(new Vector3(...projection.forward)));
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld();
  return camera;
}

// Return all authored bounds corners so a generous target follows the actual visible physical object, not the room.
function createBoxCorners(anchor: Pick<D9AffordanceAnchor, "max" | "min">): Vector3[] {
  const corners: Vector3[] = [];
  for (const x of [anchor.min[0], anchor.max[0]]) {
    for (const y of [anchor.min[1], anchor.max[1]]) {
      for (const z of [anchor.min[2], anchor.max[2]]) {
        corners.push(new Vector3(x, y, z));
      }
    }
  }
  return corners;
}

// Keep touch forgiveness local to the object while avoiding a visually invisible full-screen activation surface.
function interactionPadding(viewport: D9InteractionViewport): number {
  return Math.min(30, Math.max(16, Math.min(viewport.width, viewport.height) * 0.025));
}

// Clamp a point to the Canvas viewport and reject bounds that would create an unusable or screen-filling target.
function createScreenBounds(
  projected: readonly Vector3[],
  viewport: D9InteractionViewport,
): D9ScreenBounds | null {
  if (
    viewport.width <= 0 ||
    viewport.height <= 0 ||
    !projected.some(
      (point) =>
        Number.isFinite(point.x) && Number.isFinite(point.y) && point.z >= -1 && point.z <= 1,
    )
  ) {
    return null;
  }

  const padding = interactionPadding(viewport);
  const valuesX = projected.map((point) => (point.x + 1) * 0.5 * viewport.width);
  const valuesY = projected.map((point) => (1 - point.y) * 0.5 * viewport.height);
  const left = Math.max(0, Math.min(...valuesX) - padding);
  const right = Math.min(viewport.width, Math.max(...valuesX) + padding);
  const top = Math.max(0, Math.min(...valuesY) - padding);
  const bottom = Math.min(viewport.height, Math.max(...valuesY) + padding);
  const width = right - left;
  const height = bottom - top;

  // Reject off-screen, degenerate, and room-sized regions before they become visitor controls.
  if (
    width < 12 ||
    height < 12 ||
    width >= viewport.width * 0.9 ||
    height >= viewport.height * 0.9
  ) {
    return null;
  }

  return { bottom, height, left, right, top, width };
}

// Select the one anchored physical object that is legal to activate in the active sanctuary state.
function selectStateAnchor(state: SanctuaryMvpState): D9AffordanceAnchor | null {
  const [anchor] = selectD9AffordanceAnchors(state.name);
  return anchor ?? null;
}

// Project a state-specific authored object through the exact active camera and optional scene-world transform.
export function projectD9DomInteractionTarget(
  state: SanctuaryMvpState,
  camera: Camera,
  viewport: D9InteractionViewport,
  toWorld: (point: Vector3) => Vector3 = (point) => point,
): D9DomInteractionTarget | null {
  const anchor = selectStateAnchor(state);
  if (anchor === null) {
    return null;
  }

  const screenBounds = createScreenBounds(
    createBoxCorners(anchor).map((corner) => toWorld(corner).project(camera)),
    viewport,
  );
  if (screenBounds === null) {
    return null;
  }

  const affordance = selectSanctuaryAffordance(state);
  return {
    action: affordance.action,
    ariaLabel: affordance.label,
    key: `dom:${state.name}:${anchor.semanticRoot}`,
    screenBounds,
    semanticRoot: anchor.semanticRoot,
  };
}

// Verify expected D7.5 placement without a renderer so touch targets remain testable in desktop and landscape sizes.
export function selectD9DomInteractionTargetForViewport(
  state: SanctuaryMvpState,
  viewport: D9InteractionViewport,
): D9DomInteractionTarget | null {
  return projectD9DomInteractionTarget(
    state,
    createD75ProjectionCamera(state.name, viewport),
    viewport,
  );
}
