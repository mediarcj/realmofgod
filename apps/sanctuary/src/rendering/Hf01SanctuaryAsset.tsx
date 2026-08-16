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
  Mesh,
  Object3D,
} from "three";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

import sanctuaryAssetUrl from "../assets/production/realm-hf01-sanctuary.glb?url";
import type { JourneyVisualState } from "../journey/model";
import { type Hf01ClipCommand, selectHf01MotionPlan } from "./hf01Motion";

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

// Mark only important foreground meshes as shadow casters while letting every solid receive soft shade.
function prepareScene(source: Object3D): Object3D {
  const clone = source.clone(true);
  clone.traverse((object) => {
    if (object instanceof Mesh) {
      object.receiveShadow = true;
      object.castShadow = /Bible|Door|PrayerTable|Cushion/iu.test(object.name);
    }
    if (object instanceof Light) {
      object.castShadow = false;
    }
  });
  return clone;
}

// Load one repository-owned asset with one repository-bundled decoder and no remote fallback path.
function configureLoader(loader: GLTFLoader): void {
  loader.setMeshoptDecoder(MeshoptDecoder);
}

// Render the physical sanctuary and keep its decorative lifecycle subordinate to the current journey stage.
export function Hf01SanctuaryAsset({
  reducedMotion,
  visualState,
}: {
  readonly reducedMotion: boolean;
  readonly visualState: JourneyVisualState;
}) {
  const gltf = useLoader(GLTFLoader, sanctuaryAssetUrl, configureLoader) as GLTF;
  const authoredScene = useMemo(() => prepareScene(gltf.scene), [gltf.scene]);
  const mixer = useMemo(() => new AnimationMixer(authoredScene), [authoredScene]);
  const freshArrivalAvailable = useRef(true);

  // Create clip actions once for this scene clone so animation never mutates the cached loader source.
  const actions = useMemo(() => {
    return {
      bible: mixer.clipAction(requireClip(gltf.animations, bibleClipName)),
      door: mixer.clipAction(requireClip(gltf.animations, doorClipName)),
    };
  }, [gltf.animations, mixer]);

  // Resolve arrival, interruption, departure, and return poses from the read-only journey projection.
  useEffect(() => {
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
  }, [actions, mixer, reducedMotion, visualState.stage]);

  // Advance only authored decorative clips; the mixer cannot dispatch or alter journey state.
  useFrame((_, delta) => {
    mixer.update(Math.min(delta, 0.05));
  });

  // Stop decorative actions on teardown while allowing React's development effect replay to reuse bindings.
  useEffect(() => {
    return () => {
      mixer.stopAllAction();
    };
  }, [mixer]);

  // Turn Blender's authored depth toward the existing journey path and reserve the left side for DOM copy.
  return <primitive object={authoredScene} position={[1.6, 0, 0]} rotation={[0, Math.PI, 0]} />;
}
