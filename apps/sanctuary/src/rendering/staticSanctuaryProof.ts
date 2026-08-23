/**
 * File: apps/sanctuary/src/rendering/staticSanctuaryProof.ts
 * Description: Provides pure local scene preparation helpers for the static sanctuary proof.
 * Purpose: Keeps authored-transform, candle-anchor, and shadow-budget checks testable outside React rendering.
 * Notes: The helpers operate only on already-loaded local GLB graphs and contain no visitor data or network access.
 */

// Import only the scene primitives required to inspect and prepare a local candidate graph.
import { Light, Mesh, Object3D, Vector3 } from "three";

import type { StaticSanctuaryProofConfig } from "./capabilities";
import type { VisualCalibration } from "./visualCalibration";

// Narrow Three's loose object surface to the exact visibility and shadow controls used by the proof.
interface ShadowableMesh {
  castShadow: boolean;
  name: string;
  receiveShadow: boolean;
}

// Keep the two runtime candle lights attached to their named authored flame anchors instead of legacy guessed coordinates.
const authoredCandleFlameNames = [
  "HF01_CandleLeft__Candle_0_Flame",
  "HF01_CandleRight__Candle_1_Flame",
] as const;

// Keep the bounded candle-light budget visible to focused tests and local proof diagnostics.
export const STATIC_CANDLE_LIGHT_COUNT = authoredCandleFlameNames.length;

export interface AuthoredCandleFlamePositions {
  readonly left: readonly [number, number, number];
  readonly right: readonly [number, number, number];
}

// Keep glowing flames, transparent glass, and any later dust decoration out of every shadow map policy.
function isNeverShadowCaster(name: string): boolean {
  return /(?:Flame|Wick|Glass|Dust)/iu.test(name);
}

// Match D8.3's foreground caster choice for the current policy while restricting the candidate policy to solid focal forms.
export function shouldStaticSanctuaryMeshCastShadow(
  name: string,
  policy: StaticSanctuaryProofConfig["shadowPolicy"],
): boolean {
  if (policy === "off" || isNeverShadowCaster(name)) {
    return false;
  }
  if (policy === "current") {
    return /(?:Bible|Door|PrayerTable|TableCross|Candle)/iu.test(name);
  }
  return /(?:Door_North_Slab|PrayerTable|Bible|TableCross)/iu.test(name);
}

// Apply an older explicit proof offset only when a compatibility route asks for it.
function applyProofTransform(
  scene: Object3D,
  name: string,
  transform: VisualCalibration["table"],
): void {
  const object = scene.getObjectByName(name);
  if (object === undefined) {
    throw new Error(`The static sanctuary candidate is missing the required root: ${name}.`);
  }
  object.position.add(new Vector3(...transform.position));
  object.rotation.y += transform.rotationY;
  object.scale.multiplyScalar(transform.scale);
}

// Clone the loaded graph so source caches remain untouched while each local policy can safely set renderer flags.
export function prepareStaticSanctuaryScene(
  source: Object3D,
  config: StaticSanctuaryProofConfig,
  visualCalibration: VisualCalibration,
): Object3D {
  const clone = source.clone(true);
  clone.traverse((object) => {
    if (object instanceof Mesh) {
      const mesh = object as unknown as ShadowableMesh;
      mesh.receiveShadow = config.shadowPolicy !== "off";
      mesh.castShadow = shouldStaticSanctuaryMeshCastShadow(mesh.name, config.shadowPolicy);
    }
    if (object instanceof Light) {
      // The candidate contains no authored lights, but disable any future embedded source so this proof remains explicit.
      object.castShadow = false;
      object.visible = false;
    }
  });
  // Preserve the authored R2 transforms on D9 and D9.0A.1; older explicit proof routes retain their prior offsets.
  if (config.transformPolicy === "legacy-calibrated") {
    applyProofTransform(clone, "HF01_PrayerTable", visualCalibration.table);
    applyProofTransform(clone, "HF01_Bible_Root", visualCalibration.bible);
    applyProofTransform(clone, "HF01_Candle_Left", visualCalibration.candleLeft);
    applyProofTransform(clone, "HF01_Candle_Right", visualCalibration.candleRight);
  }
  return clone;
}

// Resolve authored candle locations after the selected candidate has loaded so the two warm lights do not shine through the table.
export function resolveAuthoredCandleFlamePositions(
  source: Object3D,
): AuthoredCandleFlamePositions {
  source.updateWorldMatrix(true, true);
  const positions = authoredCandleFlameNames.map((name) => {
    const flame = source.getObjectByName(name);
    if (flame === undefined) {
      throw new Error(
        `The static sanctuary candidate is missing the required candle flame: ${name}.`,
      );
    }
    const position = flame.getWorldPosition(new Vector3());
    return [position.x, position.y, position.z] as const;
  });
  const [left, right] = positions;
  if (left === undefined || right === undefined) {
    throw new Error(
      "The static sanctuary candidate did not provide two authored candle flame positions.",
    );
  }
  return { left, right };
}
