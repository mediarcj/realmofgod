/**
 * File: apps/sanctuary/src/rendering/d91cCandleFidelity.ts
 * Description: Adds bounded browser presentation layers around the two authored sanctuary candles.
 * Purpose: Makes the approved Blender flame motion read as candlelight while preserving its two existing pivots and map timing.
 * Notes: This module never creates a light, changes the approved motion samples, reads visitor data, or contacts a network service.
 */

// Import only local Three presentation primitives; every animated value is written through refs by the owning renderer frame loop.
import {
  Box3,
  BufferGeometry,
  CanvasTexture,
  Color,
  Group,
  Material,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Sprite,
  SpriteMaterial,
  Texture,
  Vector3,
} from "three";

import type { D91BCandleSide, D91BFlameRuntimeRig } from "./d91bBlenderCandleMotion";

// Narrow generic GLB mesh values at the dynamic scene boundary before material code reads or replaces their inspected single materials.
type D91CCandleMesh = Mesh<BufferGeometry, Material | Material[]>;

// Keep the two inspected GLB wick roots explicit so a renamed Blender export fails rather than creating a browser-only substitute wick.
export const d91cAuthoredWickNames: Record<D91BCandleSide, string> = {
  left: "HF01_CandleLeft__Candle_0_Wick",
  right: "HF01_CandleRight__Candle_1_Wick",
};

// Make the already-approved lean and stretch readable from the D9 visitor camera without changing its timing, samples, phase, or light sequence.
export const d91cPerceptualGain = 1.18 as const;

// Keep smoke intentionally sparse: two short, non-overlapping wisps per candle and no continuous particle system.
export const d91cMaximumSmokeSprites = 4;

interface D91CSmokeEvent {
  readonly curlX: number;
  readonly curlZ: number;
  readonly durationSeconds: number;
  readonly startSeconds: number;
}

export interface D91CSmokeSample {
  readonly active: boolean;
  readonly opacity: number;
  readonly scale: number;
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

// Use fixed, visibly independent event windows instead of random emission, physics, or a second motion signal on the flame.
const d91cSmokeSchedule: Record<D91BCandleSide, readonly D91CSmokeEvent[]> = {
  left: [
    { curlX: -0.026, curlZ: 0.012, durationSeconds: 0.82, startSeconds: 0.68 },
    { curlX: 0.018, curlZ: -0.018, durationSeconds: 0.72, startSeconds: 4.68 },
  ],
  right: [
    { curlX: 0.022, curlZ: -0.015, durationSeconds: 0.78, startSeconds: 2.12 },
    { curlX: -0.018, curlZ: 0.014, durationSeconds: 0.74, startSeconds: 5.82 },
  ],
};

interface D91CPreparedSprite {
  readonly material: SpriteMaterial;
  readonly sprite: Sprite;
}

export interface D91CCandlePresentationRig {
  readonly ember: D91CPreparedSprite;
  readonly halo: D91CPreparedSprite;
  readonly innerFlame: Mesh<BufferGeometry, MeshStandardMaterial>;
  readonly innerFlameMaterial: MeshStandardMaterial;
  readonly originalFlameMaterial: Material | Material[];
  readonly originalWickMaterial: Material | Material[];
  readonly outerFlame: D91CCandleMesh;
  readonly outerFlameMaterial: MeshStandardMaterial;
  readonly side: D91BCandleSide;
  readonly smoke: readonly D91CPreparedSprite[];
  readonly smokeRoot: Group;
  readonly softTexture: Texture;
  readonly wick: D91CCandleMesh;
  readonly wickMaterial: MeshStandardMaterial;
}

// Read one mesh material safely because the inspected candle surfaces are single-material GLB meshes, not material arrays.
function requireSingleMaterial(mesh: D91CCandleMesh, label: string): Material {
  if (Array.isArray(mesh.material)) {
    throw new Error(`The ${label} must keep one authored GLB material.`);
  }
  return mesh.material;
}

// Define the inspected candle mesh contract once so dynamic GLB nodes do not flow through the renderer as untyped generic mesh values.
function isD91CCandleMesh(value: Object3D | undefined): value is D91CCandleMesh {
  return value instanceof Mesh;
}

// Treat the loaded scene as untrusted at this type boundary so an unexpected export shape fails clearly instead of flowing as any into renderer code.
function requireCandleMesh(value: Object3D | undefined, label: string): D91CCandleMesh {
  if (!isD91CCandleMesh(value)) {
    throw new Error(`The sanctuary scene is missing the authored ${label} mesh.`);
  }
  return value;
}

// Convert one local GLB material into an isolated standard material so candle presentation cannot mutate another asset surface.
function createStandardPresentationMaterial(
  source: Material,
  color: string,
  emissive: string,
  emissiveIntensity: number,
): MeshStandardMaterial {
  const material =
    source instanceof MeshStandardMaterial ? source.clone() : new MeshStandardMaterial();
  material.color = new Color(color);
  material.emissive = new Color(emissive);
  material.emissiveIntensity = emissiveIntensity;
  material.depthWrite = false;
  material.transparent = true;
  material.toneMapped = false;
  return material;
}

// Draw one small local radial texture once for halos, embers, and smoke instead of fetching a remote image or adding a postprocess pass.
function createD91CSoftTexture(): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.height = 64;
  canvas.width = 64;
  const context = canvas.getContext("2d");
  if (context === null) {
    throw new Error("The browser could not create the local candle presentation texture.");
  }
  const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.28, "rgba(255,237,198,0.86)");
  gradient.addColorStop(0.66, "rgba(255,184,93,0.2)");
  gradient.addColorStop(1, "rgba(255,145,52,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, 64, 64);
  return new CanvasTexture(canvas);
}

// Convert a world anchor into one parent-local position so wick details remain stationary even as only the flame pivot moves.
function setObjectAtWorldPosition(parent: Object3D, object: Object3D, position: Vector3): void {
  const localPosition = parent.worldToLocal(position.clone());
  object.position.copy(localPosition);
  parent.add(object);
}

// Build one soft, camera-facing presentation sprite with no depth writing so it cannot cut hard geometry-shaped holes into the room.
function createD91CSprite(
  texture: Texture,
  color: string,
  opacity: number,
  size: number,
): D91CPreparedSprite {
  const material = new SpriteMaterial({
    color,
    depthWrite: false,
    map: texture,
    opacity,
    transparent: true,
    toneMapped: false,
  });
  const sprite = new Sprite(material);
  sprite.scale.set(size, size, 1);
  return { material, sprite };
}

// Calculate a source mesh's local vertical size so the new inner core preserves the authored flame base rather than floating at its center.
function getLocalMeshHeight(mesh: D91CCandleMesh): number {
  mesh.geometry.computeBoundingBox();
  const bounds = mesh.geometry.boundingBox;
  if (bounds === null) {
    return 0.15;
  }
  return Math.max(0.01, (bounds.max.y - bounds.min.y) * mesh.scale.y);
}

// Find the top of the actual GLB wick in world space; this is the only acceptable origin for the stationary ember and smoke root.
function getWickTopWorldPosition(wick: D91CCandleMesh): Vector3 {
  const bounds = new Box3().setFromObject(wick);
  return new Vector3(
    (bounds.min.x + bounds.max.x) / 2,
    bounds.max.y,
    (bounds.min.z + bounds.max.z) / 2,
  );
}

// Prepare exact map-following flame layers and wick-anchored details without creating a third candle, third light, or procedural flame transform.
export function prepareD91CCandlePresentation(
  scene: Object3D,
  flameRigs: Record<D91BCandleSide, D91BFlameRuntimeRig>,
): Record<D91BCandleSide, D91CCandlePresentationRig> {
  scene.updateWorldMatrix(true, true);
  const softTexture = createD91CSoftTexture();

  return (Object.keys(flameRigs) as D91BCandleSide[]).reduce(
    (prepared, side) => {
      const mapRig = flameRigs[side];
      const outerFlame = requireCandleMesh(mapRig.source, `${side} flame`);
      if (outerFlame.parent === null) {
        throw new Error(
          `The ${side} authored flame must remain a visible mesh below its approved pivot.`,
        );
      }
      const wick = requireCandleMesh(
        scene.getObjectByName(d91cAuthoredWickNames[side]),
        `${side} wick`,
      );
      if (wick.parent === null) {
        throw new Error(`The sanctuary scene is missing the authored ${side} wick mesh.`);
      }

      // Refine the existing outer mesh in place so its geometry still receives the exact approved D9.1B pivot motion.
      const originalFlameMaterial = outerFlame.material;
      const outerFlameMaterial = createStandardPresentationMaterial(
        requireSingleMaterial(outerFlame, `${side} flame`),
        "#ff9b3e",
        "#ff5d10",
        1.9,
      );
      outerFlameMaterial.opacity = 0.76;
      outerFlame.material = outerFlameMaterial;

      // Add one smaller core under the same pivot, keeping its lower edge aligned with the visible outer flame base.
      const innerFlameMaterial = createStandardPresentationMaterial(
        requireSingleMaterial(outerFlame, `${side} refined flame`),
        "#fff1bf",
        "#fff5cf",
        2.6,
      );
      innerFlameMaterial.opacity = 0.96;
      const innerFlame = new Mesh(outerFlame.geometry, innerFlameMaterial);
      innerFlame.name = `D91C_${side}_InnerFlameCore`;
      innerFlame.position.copy(outerFlame.position);
      innerFlame.scale.copy(outerFlame.scale).multiplyScalar(0.46);
      const outerHeight = getLocalMeshHeight(outerFlame);
      innerFlame.position.y -= (outerHeight * (1 - 0.46)) / 2;
      outerFlame.parent.add(innerFlame);

      // Keep the halo small and tied to the same pivot as the outer flame, not to a separate per-frame motion function.
      const halo = createD91CSprite(softTexture, "#ffb75f", 0.105, 0.205);
      halo.sprite.name = `D91C_${side}_CandleHalo`;
      halo.sprite.position.copy(outerFlame.position);
      halo.sprite.position.y += outerHeight * 0.04;
      outerFlame.parent.add(halo.sprite);

      // Preserve the real wick mesh and make it darker; the tiny ember is fixed at its inspected top rather than attached to the moving flame.
      const originalWickMaterial = wick.material;
      const wickMaterial = createStandardPresentationMaterial(
        requireSingleMaterial(wick, `${side} wick`),
        "#120c08",
        "#3b1608",
        0.22,
      );
      wickMaterial.opacity = 1;
      wickMaterial.transparent = false;
      wickMaterial.depthWrite = true;
      wick.material = wickMaterial;
      const wickAnchor = getWickTopWorldPosition(wick);
      const ember = createD91CSprite(softTexture, "#ff9a35", 0.62, 0.025);
      ember.sprite.name = `D91C_${side}_WickEmber`;
      setObjectAtWorldPosition(wick.parent, ember.sprite, wickAnchor);

      // Attach sparse smoke to the wick parent so it starts at the stationary candle body while retaining a deterministic local loop.
      const smokeRoot = new Group();
      smokeRoot.name = `D91C_${side}_WickAnchoredSmoke`;
      setObjectAtWorldPosition(wick.parent, smokeRoot, wickAnchor);
      const smoke = d91cSmokeSchedule[side].map((_, index) => {
        const sprite = createD91CSprite(softTexture, "#c6b4a2", 0, 0.05);
        sprite.sprite.name = `D91C_${side}_SmokeWisp_${String(index + 1)}`;
        smokeRoot.add(sprite.sprite);
        return sprite;
      });

      prepared[side] = {
        ember,
        halo,
        innerFlame,
        innerFlameMaterial,
        originalFlameMaterial,
        originalWickMaterial,
        outerFlame,
        outerFlameMaterial,
        side,
        smoke,
        smokeRoot,
        softTexture,
        wick,
        wickMaterial,
      };
      return prepared;
    },
    {} as Record<D91BCandleSide, D91CCandlePresentationRig>,
  );
}

// Sample one sparse wisp with fixed Bézier-like offsets so smoke stays decorative and cannot become a hidden random or semantic channel.
export function sampleD91CSmoke(
  side: D91BCandleSide,
  eventIndex: number,
  seconds: number,
  reducedMotion: boolean,
): D91CSmokeSample {
  const event = d91cSmokeSchedule[side][eventIndex];
  if (event === undefined || reducedMotion) {
    return { active: false, opacity: 0, scale: 0.05, x: 0, y: 0, z: 0 };
  }
  const loopSeconds = ((seconds % 7) + 7) % 7;
  const progress = (loopSeconds - event.startSeconds) / event.durationSeconds;
  if (progress < 0 || progress > 1) {
    return { active: false, opacity: 0, scale: 0.05, x: 0, y: 0, z: 0 };
  }
  const fade = progress <= 0.5 ? progress * 2 : (1 - progress) * 2;
  return {
    active: true,
    opacity: fade * 0.115,
    scale: MathUtils.lerp(0.048, 0.112, progress),
    x: event.curlX * progress * progress,
    y: 0.018 + 0.16 * progress,
    z: event.curlZ * progress * (1 - progress * 0.2),
  };
}

// Apply only the map-derived light response to presentation opacity and size; spatial flame motion remains exclusively under D9.1B pivots.
export function applyD91CCandlePresentation(
  rig: D91CCandlePresentationRig,
  seconds: number,
  lightMultiplier: number,
  reducedMotion: boolean,
): void {
  const response = reducedMotion ? 1 : MathUtils.clamp(lightMultiplier, 0.94, 1.08);
  const responseAmount = (response - 1) / 0.08;
  rig.outerFlameMaterial.opacity = MathUtils.clamp(0.76 + responseAmount * 0.035, 0.72, 0.8);
  rig.innerFlameMaterial.emissiveIntensity = MathUtils.clamp(
    2.6 + responseAmount * 0.22,
    2.38,
    2.82,
  );
  rig.halo.material.opacity = MathUtils.clamp(0.105 + responseAmount * 0.018, 0.082, 0.123);
  const haloScale = MathUtils.clamp(0.205 + responseAmount * 0.012, 0.188, 0.218);
  rig.halo.sprite.scale.set(haloScale, haloScale, 1);
  rig.ember.material.opacity = reducedMotion
    ? 0.52
    : MathUtils.clamp(0.62 + responseAmount * 0.04, 0.56, 0.68);

  for (const [index, smoke] of rig.smoke.entries()) {
    const sample = sampleD91CSmoke(rig.side, index, seconds, reducedMotion);
    smoke.sprite.visible = sample.active;
    smoke.material.opacity = sample.opacity;
    smoke.sprite.position.set(sample.x, sample.y, sample.z);
    smoke.sprite.scale.set(sample.scale, sample.scale * 1.22, 1);
  }
}

// Remove only D9.1C presentation children and cloned materials, restoring the original GLB mesh materials for a clean renderer remount.
export function restoreD91CCandlePresentation(rig: D91CCandlePresentationRig): void {
  rig.outerFlame.material = rig.originalFlameMaterial;
  rig.wick.material = rig.originalWickMaterial;
  rig.innerFlame.removeFromParent();
  rig.halo.sprite.removeFromParent();
  rig.ember.sprite.removeFromParent();
  rig.smokeRoot.removeFromParent();
  rig.outerFlameMaterial.dispose();
  rig.innerFlameMaterial.dispose();
  rig.wickMaterial.dispose();
  rig.halo.material.dispose();
  rig.ember.material.dispose();
  for (const smoke of rig.smoke) {
    smoke.material.dispose();
  }
  rig.softTexture.dispose();
}
