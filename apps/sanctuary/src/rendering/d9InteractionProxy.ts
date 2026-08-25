/**
 * File: d9InteractionProxy.ts
 * Description: Defines fresh, state-scoped interaction proxies for the sanctuary scene.
 * Purpose: Keep canvas raycasting tied to the current meaningful object instead of a reused mesh.
 * Notes: The measured proxy bounds come from the local authored-scene contract.
 */

// Three.js owns the invisible interaction volume and the deterministic camera check.
import {
  BoxGeometry,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Raycaster,
  Vector2,
  Vector3,
} from "three";

// These imports keep the proxy aligned with the existing authored asset and D7.5 camera contracts.
import type { SanctuaryMvpState } from "../sanctuary/model";
import { selectD75SanctuaryProjection } from "./d75SanctuaryCamera";
import {
  selectD9AffordanceAnchors,
  selectD9AffordanceBox,
  type D9AffordanceAnchor,
} from "./d9AffordanceAnchors";

// Keep this local shorthand tied to the DOM-authoritative sanctuary state union.
type SanctuaryMvpStateName = SanctuaryMvpState["name"];

/** A single proxy is deliberately created for the one active semantic scene target. */
export interface D9InteractionProxyDefinition {
  readonly anchor: D9AffordanceAnchor;
  readonly key: string;
}

/** The raycast result is retained for focused tests and developer diagnostics. */
export interface D9InteractionRaycastResult {
  readonly intersects: boolean;
  readonly key: string;
  readonly ndc: readonly [number, number, number];
  readonly onScreen: boolean;
}

/**
 * Selects the fresh state-specific proxy definition.
 *
 * The semantic scene is intentionally limited to one canvas target at a time: the table in
 * SANCTUARY and the Bible in SIT. READ and PRAY remain DOM-led states without a canvas proxy.
 */
export function selectD9InteractionProxy(
  state: SanctuaryMvpStateName,
): D9InteractionProxyDefinition | null {
  const anchors = selectD9AffordanceAnchors(state);

  if (anchors.length === 0) {
    return null;
  }

  if (anchors.length !== 1) {
    throw new Error(
      `Expected one D9 interaction anchor for ${state}, received ${String(anchors.length)}.`,
    );
  }

  const anchor = anchors[0];

  if (anchor === undefined) {
    throw new Error(`Expected a D9 interaction anchor for ${state}.`);
  }

  return {
    anchor,
    key: `${state}:${anchor.semanticRoot}`,
  };
}

/**
 * Builds a new mesh for the selected proxy rather than mutating an instanced mesh across states.
 *
 * This small box follows the already-measured local GLB bounds and is only a raycast surface. The
 * material remains hidden in normal use so it cannot change the visual sanctuary composition.
 */
export function createD9InteractionProxyMesh(definition: D9InteractionProxyDefinition): Mesh {
  const box = selectD9AffordanceBox(definition.anchor);
  const dimensions = box.getSize(new Vector3());
  const center = box.getCenter(new Vector3());
  const geometry = new BoxGeometry(dimensions.x, dimensions.y, dimensions.z);
  const material = new MeshBasicMaterial({ colorWrite: false, depthWrite: false });
  const mesh = new Mesh(geometry, material);

  mesh.name = definition.key;
  mesh.position.copy(center);
  mesh.updateMatrixWorld(true);

  return mesh;
}

/**
 * Reconstructs the accepted D7.5 camera for a deterministic interaction check.
 *
 * The camera uses the same authored projection rather than a test-only viewpoint, which catches a
 * target that is present in the scene but falls outside the actual visitor frame.
 */
export function createD9InteractionCamera(
  state: SanctuaryMvpStateName,
  viewport: { readonly height: number; readonly width: number },
): PerspectiveCamera {
  const projection = selectD75SanctuaryProjection(
    viewport.width / viewport.height,
    "horizontal",
    state,
  );
  const camera = new PerspectiveCamera(
    projection.fovDegrees,
    viewport.width / viewport.height,
    0.1,
    100,
  );

  camera.name = `D9 interaction verification camera: ${state}`;
  camera.position.set(...projection.position);
  camera.up.set(...projection.up);
  camera.lookAt(camera.position.clone().add(new Vector3(...projection.forward)));
  camera.updateProjectionMatrix();
  camera.updateMatrixWorld(true);

  return camera;
}

/**
 * Verifies that the active state proxy is visible and raycastable from the accepted D7.5 camera.
 *
 * This is intentionally a Three.js contract instead of a DOM geometry approximation. It protects
 * the visitor path from a proxy that looks right in authored coordinates but cannot be clicked.
 */
export function verifyD9InteractionRaycast(
  state: Extract<SanctuaryMvpStateName, "SANCTUARY" | "SIT">,
  viewport: { readonly height: number; readonly width: number },
): D9InteractionRaycastResult {
  const definition = selectD9InteractionProxy(state);

  if (definition === null) {
    throw new Error(`Expected a D9 interaction proxy for ${state}.`);
  }

  const mesh = createD9InteractionProxyMesh(definition);
  const camera = createD9InteractionCamera(state, viewport);
  const center = selectD9AffordanceBox(definition.anchor).getCenter(new Vector3());
  const projected = center.clone().project(camera);
  const raycaster = new Raycaster();

  raycaster.setFromCamera(new Vector2(projected.x, projected.y), camera);

  return {
    intersects: raycaster.intersectObject(mesh, false).length > 0,
    key: definition.key,
    ndc: [projected.x, projected.y, projected.z],
    onScreen:
      Math.abs(projected.x) <= 1 &&
      Math.abs(projected.y) <= 1 &&
      projected.z >= -1 &&
      projected.z <= 1,
  };
}
