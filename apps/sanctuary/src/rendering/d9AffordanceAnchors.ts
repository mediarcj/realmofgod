/**
 * File: apps/sanctuary/src/rendering/d9AffordanceAnchors.ts
 * Description: Defines measured, authored-object bounds for the D9 sanctuary environmental interactions.
 * Purpose: Keeps visitor interaction attached to meaningful sanctuary surfaces after static batching removes their render meshes.
 * Notes: Bounds are checked against the untouched local authored graph; this module has no visitor storage or network behavior.
 */

// Import only Three's local bound primitives so proxy placement remains tied to the authored spatial contract.
import { Box3, Object3D, Vector3 } from "three";

import type { SanctuaryMvpStateName } from "../sanctuary/model";

// Name each authored root and physical child used to establish the local interaction contract.
export const d9AffordanceSemanticRoots = {
  bible: ["HF01_Bible_Root", "Bible_LeftOpenPage", "Bible_RightOpenPage"],
  tabletop: ["HF01_PrayerTable", "HF01_PrayerTable__Table_Top"],
} as const;

// Describe one deliberately expanded physical bound without treating a whole wall or floor as an interaction target.
export interface D9AffordanceAnchor {
  readonly cueColor: string;
  readonly cueClearance: number;
  readonly cueDistance: number;
  readonly cueHoverStrength: number;
  readonly cueStrength: number;
  readonly max: readonly [number, number, number];
  readonly min: readonly [number, number, number];
  readonly semanticRoot: string;
}

// Describe the two authored Bible page surfaces used by the DOM-first READ layout, not by a Canvas text interaction.
export interface D9ReadingPageAnchor {
  readonly semanticRoot: "Bible_LeftOpenPage" | "Bible_RightOpenPage";
}

// Preserve the measured page footprints with a small visual edge margin so text remains within the open Bible.
const readingPageAnchors: readonly D9ReadingPageAnchor[] = [
  {
    semanticRoot: "Bible_LeftOpenPage",
  },
  {
    semanticRoot: "Bible_RightOpenPage",
  },
] as const;

// Preserve measured raw-graph bounds and add only a modest hand/touch margin around each actual surface.
const anchorsByState: Record<SanctuaryMvpStateName, readonly D9AffordanceAnchor[]> = {
  PRAY: [],
  READ: [],
  SANCTUARY: [
    {
      cueColor: "#d8a566",
      cueClearance: 0.16,
      cueDistance: 2.35,
      cueHoverStrength: 0.7,
      cueStrength: 0.36,
      max: [2.64, 1.93, 1.4],
      min: [-2.64, 1.51, -1.5],
      semanticRoot: "HF01_PrayerTable__Table_Top",
    },
  ],
  SIT: [
    {
      cueColor: "#e0b26f",
      cueClearance: 0.12,
      cueDistance: 1.55,
      cueHoverStrength: 0.62,
      cueStrength: 0.31,
      max: [1.5, 2.28, 0.94],
      min: [-0.76, 1.52, -0.92],
      semanticRoot: "HF01_Bible_Root",
    },
  ],
};

// Return only the active state's physical invitation so Canvas cannot present simultaneous action regions.
export function selectD9AffordanceAnchors(
  state: SanctuaryMvpStateName,
): readonly D9AffordanceAnchor[] {
  return anchorsByState[state];
}

// Return both open-page surfaces in source order so the DOM overlay remains replaceable for later page-turn work.
export function selectD9ReadingPageAnchors(): readonly D9ReadingPageAnchor[] {
  return readingPageAnchors;
}

// Create a Three box from the static measured contract for the batched visitor candidate.
export function selectD9AffordanceBox(anchor: Pick<D9AffordanceAnchor, "max" | "min">): Box3 {
  return new Box3(new Vector3(...anchor.min), new Vector3(...anchor.max));
}

// Keep touch discovery static and make the optional ordinary-pointer confirmation deliberately modest.
export function selectD9CueIntensity(
  anchor: D9AffordanceAnchor | undefined,
  hovered: boolean,
  reducedMotion: boolean,
): number {
  if (anchor === undefined) {
    return 0;
  }
  return reducedMotion || !hovered ? anchor.cueStrength : anchor.cueHoverStrength;
}

// Place a warm invitation above the measured tabletop or page volume so it can read as light rather than a buried source.
export function selectD9CuePosition(
  anchor: Pick<D9AffordanceAnchor, "cueClearance" | "max" | "min">,
): readonly [number, number, number] {
  const box = selectD9AffordanceBox(anchor);
  const center = box.getCenter(new Vector3());
  return [center.x, box.max.y + anchor.cueClearance, center.z];
}

// Inspect one required authored node and fail clearly if a future asset loses the semantic hierarchy.
function requireAuthoredNode(scene: Object3D, name: string): Object3D {
  const node = scene.getObjectByName(name);
  if (node === undefined) {
    throw new Error(`The authored sanctuary node is unavailable: ${name}.`);
  }
  return node;
}

// Measure one supplied raw authored graph with Three's Box3 instead of trusting a hand-positioned runtime coordinate.
export function measureD9AuthoredAnchor(scene: Object3D, name: string): Box3 {
  scene.updateWorldMatrix(true, true);
  const measured = new Box3().setFromObject(requireAuthoredNode(scene, name));
  if (measured.isEmpty()) {
    throw new Error(`The authored sanctuary node has no measurable geometry: ${name}.`);
  }
  return measured;
}

// Verify every physical semantic node that the batched candidate retains as an empty transform-only hierarchy.
export function verifyD9AffordanceSemanticHierarchy(scene: Object3D): void {
  for (const roots of Object.values(d9AffordanceSemanticRoots)) {
    for (const root of roots) {
      requireAuthoredNode(scene, root);
    }
  }
}
