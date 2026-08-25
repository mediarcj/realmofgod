/**
 * File: apps/sanctuary/src/rendering/D9EnvironmentalAffordances.tsx
 * Description: Renders state-specific local interaction proxies and optional local diagnostics data.
 * Purpose: Lets visitors discover one real sanctuary object at a time without a visible game-control layer.
 * Notes: Proxies are local and stateless; semantic labels and transition authority stay in the DOM shell.
 */

// Import only local R3F, React, and Three helpers needed for one measured proxy box at a time.
import { useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Vector3, type Camera, type Object3D } from "three";

import {
  selectSanctuaryAffordance,
  type SanctuaryMvpAction,
  type SanctuaryMvpState,
} from "../sanctuary/model";
import {
  selectD9AffordanceBox,
  selectD9CueIntensity,
  selectD9CuePosition,
  type D9AffordanceAnchor,
} from "./d9AffordanceAnchors";
import { selectD9InteractionProxy } from "./d9InteractionProxy";

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

// Place one freshly keyed proxy for the current state so Three discards stale raycast bounds during a transition.
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
  const activationCount = useRef(0);
  const [hoveredProxy, setHoveredProxy] = useState<string | null>(null);
  const proxyDefinition = useMemo(() => selectD9InteractionProxy(state.name), [state.name]);
  const primaryDefinition = proxyDefinition?.anchor;
  const describedAnchor = useMemo(
    () => (primaryDefinition === undefined ? null : describeBox(primaryDefinition)),
    [primaryDefinition],
  );
  const anchors = useMemo(
    () => (primaryDefinition === undefined ? [] : [primaryDefinition]),
    [primaryDefinition],
  );
  // A state change can replace the mesh before pointerout arrives, so only the current object may stay hovered.
  const activeHoveredProxy = primaryDefinition?.semanticRoot === hoveredProxy ? hoveredProxy : null;
  // Keep one warm cue on the current meaningful object and increase it only after a normal pointer enters it.
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
    if (!diagnosticsEnabled) {
      onDiagnosticChange?.(null);
      return undefined;
    }

    // Make the Canvas evidence-bearing while the matching simple DOM card remains development-only.
    const canvas = gl.domElement;
    const screenBounds = projectBoxesToScreen(anchors, scene, camera, canvas);
    const snapshot: D9AffordanceDiagnosticSnapshot = {
      activeProxy: proxyDefinition === null ? [] : [proxyDefinition.key],
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
      worldBounds:
        describedAnchor === null
          ? []
          : [
              {
                dimensions: describedAnchor.dimensions,
                max: describedAnchor.max,
                min: describedAnchor.min,
              },
            ],
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
    describedAnchor,
    diagnosticsEnabled,
    gl,
    onDiagnosticChange,
    primaryDefinition,
    proxyDefinition,
    scene,
    state.name,
    cueIntensity,
  ]);

  useEffect(() => {
    return () => {
      // Never leave a page-level cursor override behind if this local scene unmounts during a state change.
      document.body.style.cursor = "";
    };
  }, []);

  if (proxyDefinition === null || primaryDefinition === undefined || describedAnchor === null) {
    return null;
  }

  const center = describedAnchor.box.getCenter(new Vector3());

  return (
    <>
      <pointLight
        color={primaryDefinition.cueColor}
        decay={2}
        distance={primaryDefinition.cueDistance}
        intensity={cueIntensity}
        position={selectD9CuePosition(primaryDefinition)}
      />
      <mesh
        key={proxyDefinition.key}
        name={proxyDefinition.key}
        onClick={(event) => {
          // Stop propagation so a pointer can advance only the one state-legal environmental action.
          event.stopPropagation();
          activationCount.current += 1;
          onInteraction(selectSanctuaryAffordance(state).action);
        }}
        onPointerOut={() => {
          // Restore the ordinary cursor when the pointer leaves the actual current proxy surface.
          document.body.style.cursor = "";
          setHoveredProxy(null);
        }}
        onPointerOver={(event) => {
          // Keep the browser's familiar pointer cursor without a reticle, label, or hover-only action requirement.
          event.stopPropagation();
          document.body.style.cursor = "pointer";
          setHoveredProxy(primaryDefinition.semanticRoot);
        }}
        position={center}
      >
        <boxGeometry args={describedAnchor.dimensions} />
        <meshBasicMaterial
          color="#7bf0d8"
          colorWrite={diagnosticsEnabled}
          depthTest={!diagnosticsEnabled}
          depthWrite={false}
          transparent
          opacity={diagnosticsEnabled ? 0.28 : 0}
        />
      </mesh>
    </>
  );
}
