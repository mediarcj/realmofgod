/**
 * File: apps/sanctuary/src/rendering/Hf01SanctuaryAsset.tsx
 * Description: Loads the local authored sanctuary GLB and applies its decorative door and Bible clips.
 * Purpose: Replaces runtime-built hero-room primitives while keeping motion read-only and renderer-local.
 * Notes: The local Meshopt decoder ships with Three.js; this component has no remote URL or journey action.
 */

// Import only the lazy-renderer loader/frame hooks, React lifecycle tools, and Three's local glTF adapters.
import { useFrame, useLoader } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  AnimationAction,
  AnimationClip,
  AnimationMixer,
  Light,
  LoopOnce,
  Material,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Vector3,
} from "three";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

import sanctuaryAssetUrl from "../assets/production/realm-hf01-sanctuary.glb?url";
import type { JourneyVisualState } from "../journey/model";
import { type Hf01ClipCommand, selectHf01MotionPlan } from "./hf01Motion";
import { readLocalVisualCheck, type RendererVerificationStage } from "./capabilities";
import type { TransformCalibration, VisualCalibration } from "./visualCalibration";

const doorClipName = "Realm_Door_Close";
const bibleClipName = "Realm_Bible_Settle_Open";

// Fail clearly inside the visual error boundary if an optimized asset loses a required authored clip.
function requireClip(animations: readonly AnimationClip[], name: string): AnimationClip {
  const clip = animations.find((candidate) => candidate.name === name);
  if (clip === undefined) {
    throw new Error(`Required local sanctuary animation is unavailable: ${name}.`);
  }
  return clip;
}

// Apply one deterministic clip command and force its selected pose into the scene immediately.
function applyClipCommand(action: AnimationAction, command: Hf01ClipCommand): void {
  const duration = action.getClip().duration;
  action.enabled = true;
  action.clampWhenFinished = true;
  action.setLoop(LoopOnce, 1);
  action.paused = false;
  action.timeScale = command === "play-reverse" ? -1 : 1;
  action.play();

  switch (command) {
    case "play-forward":
      action.reset();
      action.clampWhenFinished = true;
      action.setLoop(LoopOnce, 1);
      action.play();
      return;
    case "play-reverse":
      // Reverse from an in-flight closure when possible; only a fully open pose needs the closed start.
      action.time = action.time > 0.001 ? action.time : duration;
      return;
    case "show-start":
      action.time = 0;
      action.paused = true;
      return;
    case "show-end":
      action.time = duration;
      action.paused = true;
  }
}

// Hold an authored clip at one exact review pose without creating a second animation path.
function showClipFraction(action: AnimationAction, fraction: number): void {
  action.reset();
  action.enabled = true;
  action.clampWhenFinished = true;
  action.setLoop(LoopOnce, 1);
  action.play();
  action.time = action.getClip().duration * fraction;
  action.paused = true;
}

// Mark only important foreground meshes as shadow casters while letting every solid receive soft shade.
function prepareScene(source: Object3D, dynamicShadows: boolean): Object3D {
  const clone = source.clone(true);
  clone.traverse((object) => {
    if (object instanceof Mesh) {
      // Clone the materials before tuning them so the loader cache remains an untouched source asset.
      const sourceMaterials = Array.isArray(object.material) ? object.material : [object.material];
      const preparedMaterials: Material[] = sourceMaterials.map((material) => {
        const preparedMaterial = material.clone();
        if (preparedMaterial instanceof MeshStandardMaterial) {
          // The local texture maps carry grain while this restrained tint restores the warm aged-wood family.
          if (preparedMaterial.name.includes("Wood_Honey")) {
            preparedMaterial.color.setRGB(0.28, 0.14, 0.07);
          } else if (preparedMaterial.name.includes("Wood_Smoked")) {
            preparedMaterial.color.setRGB(0.1, 0.045, 0.02);
          } else if (preparedMaterial.name.includes("Bible_Paper")) {
            preparedMaterial.color.setRGB(1, 0.92, 0.72);
          } else if (preparedMaterial.name.includes("Cross_Silver")) {
            preparedMaterial.color.setRGB(0.38, 0.42, 0.44);
          } else if (preparedMaterial.name.includes("Candle_Flame_Core")) {
            preparedMaterial.color.setRGB(1, 0.68, 0.16);
            preparedMaterial.emissive.setRGB(1, 0.46, 0.06);
            preparedMaterial.emissiveIntensity = 4.8;
          } else if (preparedMaterial.name.includes("Candle_Flame")) {
            preparedMaterial.color.setRGB(1, 0.22, 0.02);
            preparedMaterial.emissive.setRGB(1, 0.13, 0.01);
            preparedMaterial.emissiveIntensity = 3.4;
          }
          preparedMaterial.envMapIntensity = /Cross_Silver|Brass|Iron/iu.test(preparedMaterial.name)
            ? 1.25
            : 0.14;
        }
        return preparedMaterial;
      });
      object.material = Array.isArray(object.material) ? preparedMaterials : preparedMaterials[0];
      object.receiveShadow = dynamicShadows;
      object.castShadow =
        dynamicShadows && /Bible|Door|PrayerTable|TableCross|Candle/iu.test(object.name);
    }
    if (object instanceof Light) {
      // Runtime lights are intentionally bounded; Blender review lights are too strong for WebGL units.
      object.visible = false;
      object.castShadow = false;
    }
  });
  return clone;
}

// Load one repository-owned asset with one repository-bundled decoder and no remote fallback path.
function configureLoader(loader: GLTFLoader): void {
  loader.setMeshoptDecoder(MeshoptDecoder);
}

interface CalibratedObject {
  readonly object: Object3D;
  readonly position: Vector3;
  readonly rotationY: number;
  readonly scale: Vector3;
}

// Resolve the four approved prop roots once and preserve their authored transforms as calibration origins.
function requireCalibratedObject(scene: Object3D, name: string): CalibratedObject {
  const object = scene.getObjectByName(name);
  if (object === undefined) {
    throw new Error(`Required local calibration object is unavailable: ${name}.`);
  }
  return {
    object,
    position: object.position.clone(),
    rotationY: object.rotation.y,
    scale: object.scale.clone(),
  };
}

// Apply bounded offsets to a cloned scene node without replacing its authored transform or animation hierarchy.
function applyTransformCalibration(
  calibratedObject: CalibratedObject,
  calibration: TransformCalibration,
): void {
  calibratedObject.object.position.set(
    calibratedObject.position.x + calibration.position[0],
    calibratedObject.position.y + calibration.position[1],
    calibratedObject.position.z + calibration.position[2],
  );
  calibratedObject.object.rotation.y = calibratedObject.rotationY + calibration.rotationY;
  calibratedObject.object.scale.copy(calibratedObject.scale).multiplyScalar(calibration.scale);
}

// Render the physical sanctuary and keep its decorative lifecycle subordinate to the current journey stage.
export function Hf01SanctuaryAsset({
  onReady,
  reducedMotion,
  rendererVerificationStage,
  visualCalibration,
  visualState,
}: {
  readonly onReady: () => void;
  readonly reducedMotion: boolean;
  readonly rendererVerificationStage: RendererVerificationStage;
  readonly visualCalibration: VisualCalibration;
  readonly visualState: JourneyVisualState;
}) {
  const gltf = useLoader(GLTFLoader, sanctuaryAssetUrl, configureLoader) as GLTF;
  const dynamicShadows = rendererVerificationStage === null || rendererVerificationStage === "e";
  const authoredScene = useMemo(
    () => prepareScene(gltf.scene, dynamicShadows),
    [dynamicShadows, gltf.scene],
  );
  const mixer = useMemo(() => new AnimationMixer(authoredScene), [authoredScene]);
  const freshArrivalAvailable = useRef(true);
  const calibratedObjects = useMemo(() => {
    return {
      bible: requireCalibratedObject(authoredScene, "HF01_Bible_Root"),
      candleLeft: requireCalibratedObject(authoredScene, "HF01_Candle_Left"),
      candleRight: requireCalibratedObject(authoredScene, "HF01_Candle_Right"),
      table: requireCalibratedObject(authoredScene, "HF01_PrayerTable"),
    };
  }, [authoredScene]);

  // Update only the reviewed prop roots so local tuning cannot disturb animation clips or unrelated geometry.
  useEffect(() => {
    applyTransformCalibration(calibratedObjects.table, visualCalibration.table);
    applyTransformCalibration(calibratedObjects.bible, visualCalibration.bible);
    applyTransformCalibration(calibratedObjects.candleLeft, visualCalibration.candleLeft);
    applyTransformCalibration(calibratedObjects.candleRight, visualCalibration.candleRight);
  }, [calibratedObjects, visualCalibration]);

  // Create clip actions once for this scene clone so animation never mutates the cached loader source.
  const actions = useMemo(() => {
    return {
      bible: mixer.clipAction(requireClip(gltf.animations, bibleClipName)),
      door: mixer.clipAction(requireClip(gltf.animations, doorClipName)),
    };
  }, [gltf.animations, mixer]);

  // Tell the camera boundary when the local scene and its required clips are ready for a synchronized reveal.
  useEffect(() => {
    onReady();
  }, [onReady]);

  // Resolve arrival, interruption, departure, and return poses from the read-only journey projection.
  useEffect(() => {
    const localVisualCheck = readLocalVisualCheck();
    if (localVisualCheck === "door-mid") {
      showClipFraction(actions.door, 0.82);
      showClipFraction(actions.bible, 0);
      mixer.update(0);
      return;
    }
    if (localVisualCheck === "bible-partial") {
      showClipFraction(actions.door, 1);
      showClipFraction(actions.bible, 0.52);
      mixer.update(0);
      return;
    }
    if (localVisualCheck === "bible-open") {
      showClipFraction(actions.door, 1);
      showClipFraction(actions.bible, 1);
      mixer.update(0);
      return;
    }

    if (rendererVerificationStage === "b" || rendererVerificationStage === "c") {
      actions.door.stop();
      actions.bible.stop();
      mixer.update(0);
      return;
    }

    const plan = selectHf01MotionPlan({
      stage: visualState.stage,
      reducedMotion,
      freshArrivalAvailable: freshArrivalAvailable.current,
    });
    if (plan.consumesFreshArrival) {
      freshArrivalAvailable.current = false;
    }

    applyClipCommand(actions.door, plan.door);
    applyClipCommand(actions.bible, plan.bible);
    mixer.update(0);
  }, [actions, mixer, reducedMotion, rendererVerificationStage, visualState.stage]);

  // Advance only authored decorative clips; the mixer cannot dispatch or alter journey state.
  useFrame((_, delta) => {
    if (rendererVerificationStage !== "b" && rendererVerificationStage !== "c") {
      mixer.update(Math.min(delta, 0.05));
    }
  });

  // Stop decorative actions on teardown while allowing React's development effect replay to reuse bindings.
  useEffect(() => {
    return () => {
      mixer.stopAllAction();
    };
  }, [mixer]);

  // glTF already converts Blender's coordinate system, so preserve the authored world transform exactly.
  return <primitive object={authoredScene} />;
}
