/**
 * File: apps/sanctuary/src/rendering/D9EnvironmentalAffordances.tsx
 * Description: Places the one quiet, state-specific pointer region inside the authored sanctuary scene.
 * Purpose: Lets visitors use the room's seating, Bible, light, and grounding cues without adding visible game controls.
 * Notes: Regions are local, invisible, and stateless; semantic labels and transition authority stay in the DOM shell.
 */

// Import only the local React state needed to make a resting cue slightly clearer under an ordinary pointer.
import { useState, type ReactNode } from "react";

import type { SanctuaryMvpAction, SanctuaryMvpState } from "../sanctuary/model";

// Describe a generous local region and restrained illumination response for one authored environmental cue.
interface EnvironmentalAffordanceDefinition {
  readonly action: SanctuaryMvpAction;
  readonly cueColor: string;
  readonly cuePosition: readonly [number, number, number];
  readonly cueStrength: number;
  readonly dimensions: readonly [number, number, number];
  readonly position: readonly [number, number, number];
}

// Anchor each state to a physical place in the D7.5 sanctuary rather than introducing a screen-space button.
const environmentalAffordances: Record<
  SanctuaryMvpState["name"],
  EnvironmentalAffordanceDefinition
> = {
  PRAY: {
    action: "RETURN_TO_SANCTUARY",
    cueColor: "#d6a56c",
    cuePosition: [0, 0.18, 4.8],
    cueStrength: 0.035,
    dimensions: [3.8, 0.55, 2.1],
    position: [0, 0.28, 4.9],
  },
  READ: {
    action: "ENTER_PRAYER",
    cueColor: "#e0d6be",
    cuePosition: [0, 3.55, -1.15],
    cueStrength: 0.055,
    dimensions: [5.8, 1.55, 0.8],
    position: [0, 3.4, -1.1],
  },
  SANCTUARY: {
    action: "SIT",
    cueColor: "#d8a566",
    cuePosition: [0, 0.52, 5.1],
    cueStrength: 0.035,
    dimensions: [4.8, 0.9, 2.8],
    position: [0, 0.52, 5.15],
  },
  SIT: {
    action: "READ_BIBLE",
    cueColor: "#e0b26f",
    cuePosition: [0.67, 1.08, 0.31],
    cueStrength: 0.045,
    dimensions: [3.1, 0.7, 2.1],
    position: [0.67, 1.02, 0.31],
  },
};

// Render a pointer-ready region without drawing a marker, ring, label, or additional scene geometry.
export function D9EnvironmentalAffordances({
  onInteraction,
  reducedMotion,
  state,
}: {
  readonly onInteraction: (action: SanctuaryMvpAction) => void;
  readonly reducedMotion: boolean;
  readonly state: SanctuaryMvpState;
}): ReactNode {
  const [hovered, setHovered] = useState(false);
  const affordance = environmentalAffordances[state.name];
  // Keep the reduced-motion cue fully static while a standard pointer receives only a small local clarification.
  const cueIntensity = affordance.cueStrength + (reducedMotion || !hovered ? 0 : 0.025);

  return (
    <>
      <pointLight
        color={affordance.cueColor}
        decay={2}
        distance={2.4}
        intensity={cueIntensity}
        position={[...affordance.cuePosition]}
      />
      <mesh
        onClick={(event) => {
          // Stop propagation so one click can advance only the currently allowed state.
          event.stopPropagation();
          onInteraction(affordance.action);
        }}
        onPointerOut={() => {
          // Restore the ordinary cursor when the pointer leaves the authored region.
          document.body.style.cursor = "";
          setHovered(false);
        }}
        onPointerOver={(event) => {
          // Use the normal pointer cursor without replacing it with a game-style reticle.
          event.stopPropagation();
          document.body.style.cursor = "pointer";
          setHovered(true);
        }}
        position={[...affordance.position]}
      >
        <boxGeometry args={[...affordance.dimensions]} />
        <meshBasicMaterial colorWrite={false} depthWrite={false} transparent opacity={0} />
      </mesh>
    </>
  );
}
