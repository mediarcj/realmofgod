/**
 * File: apps/sanctuary/src/rendering/D9EnvironmentalAffordances.tsx
 * Description: Renders object-anchored environmental interaction proxies and optional local diagnostics data.
 * Purpose: Lets visitors discover real sanctuary objects without a visible game-control layer.
 * Notes: Proxies are local and stateless; semantic labels and transition authority stay in the DOM shell.
 */

// Import only local R3F, React, and Three helpers needed to place measured scene-space proxy boxes.
import { useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Matrix4,
  Quaternion,
  Vector3,
  type Camera,
  type InstancedMesh,
  type Object3D,
} from "three";

import {
  selectSanctuaryAffordance,
  type SanctuaryMvpAction,
  type SanctuaryMvpState,
} from "../sanctuary/model";
import {
  selectD9AffordanceAnchors,
  selectD9AffordanceBox,
  selectD9CueIntensity,
  selectD9CuePosition,
  type D9AffordanceAnchor,
} from "./d9AffordanceAnchors";

// Describe the small local-only diagnostic record shown outside the Canvas after an explicit development fragment.
export interface D9AffordanceDiagnosticSnapshot {
  readonly activeProxy: readonly string[];
  readonly activationCount: number;
  readonly hoverProxy: string | null;
  readonly screenBounds: readonly [number, number, number, number] | null;
  readonly state: SanctuaryMvpState["name"];
  readonly cue: {
    readonly intensity: number;
    readonly position: readonly [number, number, number];
  } | null;
  readonly worldBounds: readonly {
    readonly dimensions: readonly [number, number, number];
    readonly max: readonly [number, number, number];
    readonly min: readonly [number, number, number];
  }[];
}

// Turn a measured box into immutable values so React never depends on Three's mutable box instances.
function describeBox(anchor: D9AffordanceAnchor) {
  const box = selectD9AffordanceBox(anchor);
  const dimensions = box.getSize(new Vector3());
  return {
    box,
    dimensions: [dimensions.x, dimensions.y, dimensions.z] as const,
    max: [box.max.x, box.max.y, box.max.z] as const,
    min: [box.min.x, box.min.y, box.min.z] as const,
  };
}

// Project a local proxy box through the real camera only for diagnostics, never for ordinary interaction.
function projectBoxesToScreen(
  anchors: readonly D9AffordanceAnchor[],
  scene: Object3D,
  camera: Camera,
  canvas: HTMLCanvasElement,
): readonly [number, number, number, number] | null {
  const points: Vector3[] = [];
  const sceneParent = scene.parent;
  for (const anchor of anchors) {
    const box = selectD9AffordanceBox(anchor);
    for (const x of [box.min.x, box.max.x]) {
      for (const y of [box.min.y, box.max.y]) {
        for (const z of [box.min.z, box.max.z]) {
          const point = new Vector3(x, y, z);
          // Convert from the D9 scene's authored coordinates into the active camera's world coordinates.
          sceneParent?.localToWorld(point);
          points.push(point.project(camera));
        }
      }
    }
  }
  if (points.length === 0) {
    return null;
  }
  const projectedX = points.map((point) => (point.x + 1) * 0.5 * canvas.clientWidth);
  const projectedY = points.map((point) => (1 - point.y) * 0.5 * canvas.clientHeight);
  return [
    Math.min(...projectedX),
    Math.min(...projectedY),
    Math.max(...projectedX),
    Math.max(...projectedY),
  ];
}

// Place every active proxy with one instanced mesh so multiple real seats or panes do not create repeated draw calls.
export function D9EnvironmentalAffordances({
  diagnosticsEnabled,
  onDiagnosticChange,
  onInteraction,
  reducedMotion,
  scene,
  state,
}: {
  readonly diagnosticsEnabled: boolean;
  readonly onDiagnosticChange:
    ((snapshot: D9AffordanceDiagnosticSnapshot | null) => void) | undefined;
  readonly onInteraction: (action: SanctuaryMvpAction) => void;
  readonly reducedMotion: boolean;
  readonly scene: Object3D;
  readonly state: SanctuaryMvpState;
}): ReactNode {
  const { camera, gl } = useThree();
  const proxyMeshRef = useRef<InstancedMesh>(null);
  const activationCount = useRef(0);
  const [hoveredProxy, setHoveredProxy] = useState<string | null>(null);
  const anchors = useMemo(() => selectD9AffordanceAnchors(state.name), [state.name]);
  const describedAnchors = useMemo(() => anchors.map(describeBox), [anchors]);
  const primaryAnchor = describedAnchors[0];
  const primaryDefinition = anchors[0];
  // A state change can replace its proxy before a pointerout event arrives, so only an active root may appear hovered.
  const activeHoveredProxy = anchors.some((anchor) => anchor.semanticRoot === hoveredProxy)
    ? hoveredProxy
    : null;
  // Keep one static warm cue on a meaningful object and increase it only after a normal pointer enters it.
  const cueIntensity = selectD9CueIntensity(
    primaryDefinition,
    activeHoveredProxy !== null,
    reducedMotion,
  );

  useEffect(() => {
    // A prior physical surface cannot retain the browser cursor after its state-specific proxy is replaced.
    document.body.style.cursor = "";
  }, [state.name]);

  useEffect(() => {
    const mesh = proxyMeshRef.current;
    if (mesh === null) {
      return;
    }
    const matrix = new Matrix4();
    const rotation = new Quaternion();
    // Update per-state instances once, without an animation-frame loop or browser-state write.
    describedAnchors.forEach(({ box, dimensions }, index) => {
      matrix.compose(box.getCenter(new Vector3()), rotation, new Vector3(...dimensions));
      mesh.setMatrixAt(index, matrix);
    });
    // Keep Three's raycast bounds current when this one mesh changes between one Bible and four bench surfaces.
    mesh.count = describedAnchors.length;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingBox();
    mesh.computeBoundingSphere();
  }, [describedAnchors]);

  useEffect(() => {
    if (!diagnosticsEnabled) {
      onDiagnosticChange?.(null);
      return undefined;
    }
    // Make the Canvas evidence-bearing while the matching simple DOM card remains development-only.
    const canvas = gl.domElement;
    const screenBounds = projectBoxesToScreen(anchors, scene, camera, canvas);
    const snapshot: D9AffordanceDiagnosticSnapshot = {
      activeProxy: anchors.map((anchor) => anchor.semanticRoot),
      activationCount: activationCount.current,
      hoverProxy: activeHoveredProxy,
      screenBounds,
      state: state.name,
      cue:
        primaryDefinition === undefined
          ? null
          : {
              intensity: cueIntensity,
              position: selectD9CuePosition(primaryDefinition),
            },
      worldBounds: describedAnchors.map(({ dimensions, max, min }) => ({ dimensions, max, min })),
    };
    canvas.setAttribute("data-d9-affordance-active-proxy", snapshot.activeProxy.join(","));
    canvas.setAttribute("data-d9-affordance-hover-proxy", snapshot.hoverProxy ?? "");
    canvas.setAttribute("data-d9-affordance-state", snapshot.state);
    canvas.setAttribute("data-d9-affordance-activations", String(snapshot.activationCount));
    onDiagnosticChange?.(snapshot);
    return () => {
      for (const name of [
        "data-d9-affordance-active-proxy",
        "data-d9-affordance-hover-proxy",
        "data-d9-affordance-state",
        "data-d9-affordance-activations",
      ]) {
        canvas.removeAttribute(name);
      }
    };
  }, [
    activeHoveredProxy,
    anchors,
    camera,
    describedAnchors,
    diagnosticsEnabled,
    gl,
    onDiagnosticChange,
    scene,
    state.name,
    cueIntensity,
    primaryDefinition,
  ]);

  useEffect(() => {
    return () => {
      // Never leave a page-level cursor override behind if this local scene unmounts during a state change.
      document.body.style.cursor = "";
    };
  }, []);

  if (primaryAnchor === undefined || primaryDefinition === undefined) {
    return null;
  }

  return (
    <>
      <pointLight
        color={primaryDefinition.cueColor}
        decay={2}
        distance={primaryDefinition.cueDistance}
        intensity={cueIntensity}
        position={selectD9CuePosition(primaryDefinition)}
      />
      <instancedMesh
        ref={proxyMeshRef}
        args={[undefined, undefined, describedAnchors.length]}
        onClick={(event) => {
          // Stop propagation so a pointer can advance only the one state-legal environmental action.
          event.stopPropagation();
          activationCount.current += 1;
          onInteraction(selectSanctuaryAffordance(state).action);
        }}
        onPointerOut={() => {
          // Restore the ordinary cursor when the pointer leaves an actual physical proxy surface.
          document.body.style.cursor = "";
          setHoveredProxy(null);
        }}
        onPointerOver={(event) => {
          // Keep the browser's familiar pointer cursor without a reticle, label, or hover-only action requirement.
          event.stopPropagation();
          document.body.style.cursor = "pointer";
          setHoveredProxy(anchors[event.instanceId ?? 0]?.semanticRoot ?? null);
        }}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial
          color="#7bf0d8"
          colorWrite={diagnosticsEnabled}
          depthTest={!diagnosticsEnabled}
          depthWrite={false}
          transparent
          opacity={diagnosticsEnabled ? 0.28 : 0}
        />
      </instancedMesh>
    </>
  );
}
