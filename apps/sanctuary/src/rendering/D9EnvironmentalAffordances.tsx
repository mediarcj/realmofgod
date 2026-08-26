/**
 * File: apps/sanctuary/src/rendering/D9EnvironmentalAffordances.tsx
 * Description: Renders state-specific warmth cues and reports projected DOM interaction regions.
 * Purpose: Leaves visitor actions to semantic DOM buttons while keeping the room's visual invitation local to Three.js.
 * Notes: This component owns neither browser pointer events nor state transitions and contains no visitor content.
 */

// Import renderer-local hooks and Three helpers needed to project one existing authored object after a settled frame.
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, type ReactNode } from "react";
import type { Object3D } from "three";

import type { SanctuaryMvpState } from "../sanctuary/model";
import {
  selectD9AffordanceAnchors,
  selectD9CueIntensity,
  selectD9CuePosition,
} from "./d9AffordanceAnchors";
import {
  projectD9DomInteractionTarget,
  type D9DomInteractionTarget,
  type D9DomInteractionVisualState,
} from "./d9DomInteractionTarget";

// Project once after an active-camera or state update; a DOM button owns all subsequent visitor pointer interaction.
export function D9EnvironmentalAffordances({
  interactionVisualState,
  onInteractionTargetChange,
  reducedMotion,
  scene,
  state,
}: {
  readonly interactionVisualState: D9DomInteractionVisualState;
  readonly onInteractionTargetChange: (target: D9DomInteractionTarget | null) => void;
  readonly reducedMotion: boolean;
  readonly scene: Object3D;
  readonly state: SanctuaryMvpState;
}): ReactNode {
  const { camera, gl, size } = useThree();
  const pendingProjection = useRef(true);
  const [primaryAnchor] = selectD9AffordanceAnchors(state.name);
  const cueIntensity = selectD9CueIntensity(
    primaryAnchor,
    interactionVisualState !== "idle",
    reducedMotion,
  );

  useEffect(() => {
    // A newly selected D7.5 endpoint requires one fresh projection; no per-frame React state is written afterward.
    pendingProjection.current = true;
  }, [camera, size.height, size.width, state.name]);

  useEffect(() => {
    // READ and PRAY deliberately have no projected object action: their DOM semantic controls remain explicit.
    if (primaryAnchor === undefined) {
      onInteractionTargetChange(null);
    }
  }, [onInteractionTargetChange, primaryAnchor]);

  useFrame(() => {
    if (!pendingProjection.current) {
      return;
    }
    pendingProjection.current = false;

    const sceneParent = scene.parent;
    const target = projectD9DomInteractionTarget(
      state,
      camera,
      { height: gl.domElement.clientHeight, width: gl.domElement.clientWidth },
      (point) => (sceneParent === null ? point : sceneParent.localToWorld(point)),
    );

    onInteractionTargetChange(target);
  });

  if (primaryAnchor === undefined) {
    return null;
  }

  return (
    <pointLight
      color={primaryAnchor.cueColor}
      decay={2}
      distance={primaryAnchor.cueDistance}
      intensity={cueIntensity}
      position={selectD9CuePosition(primaryAnchor)}
    />
  );
}
