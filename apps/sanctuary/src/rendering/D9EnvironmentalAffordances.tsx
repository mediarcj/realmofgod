/**
 * File: apps/sanctuary/src/rendering/D9EnvironmentalAffordances.tsx
 * Description: Renders state-specific warmth cues and reports projected DOM interaction regions.
 * Purpose: Leaves visitor actions to semantic DOM buttons while keeping the room's visual invitation local to Three.js.
 * Notes: This component owns neither browser pointer events nor state transitions and contains no visitor content.
 */

// Import renderer-local hooks and Three helpers needed to project one existing authored object after a settled frame.
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { Vector3, type Object3D } from "three";

import type { SanctuaryMvpState } from "../sanctuary/model";
import {
  selectD9AffordanceBox,
  selectD9AffordanceAnchors,
  selectD9CueIntensity,
  selectD9CuePosition,
  type D9AffordanceAnchor,
} from "./d9AffordanceAnchors";
import {
  projectD9DomInteractionTarget,
  type D9DomInteractionTarget,
  type D9DomInteractionVisualState,
} from "./d9DomInteractionTarget";

// Describe local development evidence without reintroducing Canvas-hitbox or activation authority.
export interface D9AffordanceDiagnosticSnapshot {
  readonly activeTarget: string | null;
  readonly cue: {
    readonly intensity: number;
    readonly position: readonly [number, number, number];
  } | null;
  readonly screenBounds: readonly [number, number, number, number] | null;
  readonly state: SanctuaryMvpState["name"];
  readonly visualState: D9DomInteractionVisualState;
  readonly worldBounds: readonly {
    readonly dimensions: readonly [number, number, number];
    readonly max: readonly [number, number, number];
    readonly min: readonly [number, number, number];
  }[];
}

// Turn a measured authored anchor into immutable diagnostic values without retaining mutable Box3 instances in React.
function describeBox(anchor: D9AffordanceAnchor) {
  const box = selectD9AffordanceBox(anchor);
  const dimensions = box.getSize(new Vector3());
  return {
    dimensions: [dimensions.x, dimensions.y, dimensions.z] as const,
    max: [box.max.x, box.max.y, box.max.z] as const,
    min: [box.min.x, box.min.y, box.min.z] as const,
  };
}

// Project once after an active-camera or state update; a DOM button owns all subsequent visitor pointer interaction.
export function D9EnvironmentalAffordances({
  diagnosticsEnabled,
  interactionVisualState,
  onDiagnosticChange,
  onInteractionTargetChange,
  reducedMotion,
  scene,
  state,
}: {
  readonly diagnosticsEnabled: boolean;
  readonly interactionVisualState: D9DomInteractionVisualState;
  readonly onDiagnosticChange:
    ((snapshot: D9AffordanceDiagnosticSnapshot | null) => void) | undefined;
  readonly onInteractionTargetChange: (target: D9DomInteractionTarget | null) => void;
  readonly reducedMotion: boolean;
  readonly scene: Object3D;
  readonly state: SanctuaryMvpState;
}): ReactNode {
  const { camera, gl, size } = useThree();
  const pendingProjection = useRef(true);
  const targetRef = useRef<D9DomInteractionTarget | null>(null);
  const [primaryAnchor] = selectD9AffordanceAnchors(state.name);
  const describedAnchor = useMemo(
    () => (primaryAnchor === undefined ? null : describeBox(primaryAnchor)),
    [primaryAnchor],
  );
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
      targetRef.current = null;
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

    targetRef.current = target;
    onInteractionTargetChange(target);
  });

  useEffect(() => {
    if (!diagnosticsEnabled) {
      onDiagnosticChange?.(null);
      return undefined;
    }

    const target = targetRef.current;
    const snapshot: D9AffordanceDiagnosticSnapshot = {
      activeTarget: target?.key ?? null,
      cue:
        primaryAnchor === undefined
          ? null
          : { intensity: cueIntensity, position: selectD9CuePosition(primaryAnchor) },
      screenBounds:
        target === null
          ? null
          : [
              target.screenBounds.left,
              target.screenBounds.top,
              target.screenBounds.right,
              target.screenBounds.bottom,
            ],
      state: state.name,
      visualState: interactionVisualState,
      worldBounds: describedAnchor === null ? [] : [describedAnchor],
    };

    gl.domElement.setAttribute("data-d9-dom-target", snapshot.activeTarget ?? "");
    gl.domElement.setAttribute("data-d9-dom-target-state", snapshot.state);
    onDiagnosticChange?.(snapshot);

    return () => {
      gl.domElement.removeAttribute("data-d9-dom-target");
      gl.domElement.removeAttribute("data-d9-dom-target-state");
    };
  }, [
    cueIntensity,
    describedAnchor,
    diagnosticsEnabled,
    gl,
    interactionVisualState,
    onDiagnosticChange,
    primaryAnchor,
    state.name,
  ]);

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
