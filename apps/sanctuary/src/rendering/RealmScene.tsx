/**
 * File: apps/sanctuary/src/rendering/RealmScene.tsx
 * Description: Builds the original procedural wooden refuge and grounded woodland peace journey.
 * Purpose: Gives the approved journey a recognizable local visual home without remote art or game controls.
 * Notes: The scene is decorative, first-person, low-complexity, and contains no readable book text.
 */

// Import only renderer-local frame access, React helpers, and Three primitives used by this scene.
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Group, MathUtils, Vector3 } from "three";

import type { JourneyVisualState, PeaceChoice } from "../journey/model";
import { shouldAnimateAtmosphere } from "./capabilities";

// Keep positions explicit and deterministic so the same small woodland is composed on every visit.
type Position = [number, number, number];

interface TreeSpec {
  readonly position: Position;
  readonly scale: number;
  readonly tone: "near" | "far";
}

const trees: readonly TreeSpec[] = [
  { position: [-4.8, 0, -5.5], scale: 1.15, tone: "near" },
  { position: [4.4, 0, -6.8], scale: 1.3, tone: "near" },
  { position: [-5.6, 0, -9.8], scale: 1.45, tone: "near" },
  { position: [5.7, 0, -11.2], scale: 1.15, tone: "near" },
  { position: [-4.3, 0, -14.3], scale: 1.25, tone: "near" },
  { position: [4.6, 0, -15.8], scale: 1.4, tone: "near" },
  { position: [-6.8, 0, -18.2], scale: 1.7, tone: "far" },
  { position: [6.2, 0, -19.5], scale: 1.55, tone: "far" },
  { position: [-3.3, 0, -22], scale: 1.2, tone: "far" },
  { position: [3.4, 0, -23.5], scale: 1.35, tone: "far" },
];

// Describe the settled first-person camera destinations for each approved journey state.
function cameraDestination(visualState: JourneyVisualState): {
  readonly position: Position;
  readonly target: Position;
} {
  switch (visualState.stage) {
    case "entry":
      return { position: [0, 1.65, 5.3], target: [0, 1.05, 0.15] };
    case "threshold":
      return { position: [0.35, 1.65, 4.45], target: [0, 1.35, -2.8] };
    case "movement":
      return { position: [0, 1.68, -1.6], target: [0, 1.35, -8] };
    case "choice":
      return { position: [0, 1.62, -7.2], target: [0, 1.25, -13.8] };
    case "reflection":
      return choiceDestination(visualState.choice);
    case "scripture":
      return { position: [0.15, 1.58, -11.4], target: [0, 1.25, -17.3] };
    case "stillness":
      return { position: [-0.1, 1.5, -12.9], target: [0, 1.18, -18.4] };
    case "sanctuary":
      return { position: [-0.2, 1.62, 5], target: [0, 1.03, 0.2] };
  }
}

// Give the three equal choices distinct but equally restrained woodland compositions.
function choiceDestination(choice: PeaceChoice | null): {
  readonly position: Position;
  readonly target: Position;
} {
  switch (choice) {
    case "walk":
      return { position: [0.15, 1.65, -10.7], target: [0.35, 1.25, -18] };
    case "sit":
      return { position: [1.9, 1.05, -10.2], target: [0.2, 0.95, -15.6] };
    case "listen":
      return { position: [-1.25, 1.55, -9.7], target: [-2.3, 1.35, -15.2] };
    case null:
      return { position: [0, 1.62, -7.2], target: [0, 1.25, -13.8] };
  }
}

// Build one stylized evergreen from inexpensive geometry and grounded natural colors.
function WoodlandTree({ position, scale, tone }: TreeSpec) {
  const foliage = tone === "near" ? "#244b38" : "#2f5142";
  const lowerFoliage = tone === "near" ? "#173b2b" : "#29483a";

  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.35, 0]}>
        <cylinderGeometry args={[0.16, 0.24, 2.7, 7]} />
        <meshStandardMaterial color="#5a3c27" roughness={1} />
      </mesh>
      <mesh position={[0, 2.35, 0]}>
        <coneGeometry args={[1.05, 2.4, 8]} />
        <meshStandardMaterial color={lowerFoliage} roughness={1} />
      </mesh>
      <mesh position={[0, 3.35, 0]}>
        <coneGeometry args={[0.78, 2.1, 8]} />
        <meshStandardMaterial color={foliage} roughness={1} />
      </mesh>
    </group>
  );
}

// Compose the intimate refuge from simple timber planes, beams, and a clear outdoor opening.
function WoodenSanctuary() {
  return (
    <group>
      <mesh position={[0, -0.08, 2]}>
        <boxGeometry args={[8, 0.16, 8]} />
        <meshStandardMaterial color="#5b3a24" roughness={0.92} />
      </mesh>

      {/* Narrow floor boards create timber rhythm without a texture download. */}
      {[-3.5, -2.5, -1.5, -0.5, 0.5, 1.5, 2.5, 3.5].map((x) => (
        <mesh key={x} position={[x, 0.015, 2]}>
          <boxGeometry args={[0.94, 0.035, 7.9]} />
          <meshStandardMaterial color={x % 2 === 0 ? "#6a452b" : "#704a2e"} roughness={1} />
        </mesh>
      ))}

      {/* Side walls and back wall keep the refuge small while leaving the doorway open to nature. */}
      <mesh position={[-4, 1.9, 2]}>
        <boxGeometry args={[0.2, 3.8, 8]} />
        <meshStandardMaterial color="#51331f" roughness={1} />
      </mesh>
      <mesh position={[4, 1.9, 2]}>
        <boxGeometry args={[0.2, 3.8, 8]} />
        <meshStandardMaterial color="#51331f" roughness={1} />
      </mesh>
      <mesh position={[0, 1.9, 6]}>
        <boxGeometry args={[8, 3.8, 0.2]} />
        <meshStandardMaterial color="#4a2f1d" roughness={1} />
      </mesh>

      {/* Structural beams frame the room and the natural opening without ornament or spectacle. */}
      {[-3.7, 3.7].map((x) => (
        <mesh key={x} position={[x, 2.05, 2]}>
          <boxGeometry args={[0.32, 4.1, 0.32]} />
          <meshStandardMaterial color="#2d1d14" roughness={0.95} />
        </mesh>
      ))}
      {[-2.2, 2.2].map((x) => (
        <mesh key={x} position={[x, 1.75, -1.9]}>
          <boxGeometry args={[0.35, 3.5, 0.35]} />
          <meshStandardMaterial color="#352116" roughness={0.95} />
        </mesh>
      ))}
      <mesh position={[0, 3.45, -1.9]}>
        <boxGeometry args={[4.75, 0.38, 0.38]} />
        <meshStandardMaterial color="#352116" roughness={0.95} />
      </mesh>
      <mesh position={[0, 3.75, 2]}>
        <boxGeometry args={[8, 0.26, 0.34]} />
        <meshStandardMaterial color="#2f1e14" roughness={1} />
      </mesh>

      <SanctuaryTable />
    </group>
  );
}

// Place a short grounded table and a quiet open book at the center of the refuge composition.
function SanctuaryTable() {
  return (
    <group position={[0, 0, 0.75]}>
      <mesh position={[0, 0.82, 0]}>
        <boxGeometry args={[1.75, 0.16, 0.9]} />
        <meshStandardMaterial color="#744929" roughness={0.88} />
      </mesh>
      {[-0.68, 0.68].flatMap((x) =>
        [-0.3, 0.3].map((z) => (
          <mesh key={[x, z].join(":")} position={[x, 0.39, z]}>
            <boxGeometry args={[0.13, 0.78, 0.13]} />
            <meshStandardMaterial color="#4b2e1c" roughness={1} />
          </mesh>
        )),
      )}

      {/* Two unmarked page forms suggest an open Bible without displaying unapproved wording. */}
      <mesh position={[-0.34, 0.94, 0]} rotation={[-0.06, 0.08, 0.035]}>
        <boxGeometry args={[0.68, 0.055, 0.58]} />
        <meshStandardMaterial color="#d8cda9" roughness={0.95} />
      </mesh>
      <mesh position={[0.34, 0.94, 0]} rotation={[-0.06, -0.08, -0.035]}>
        <boxGeometry args={[0.68, 0.055, 0.58]} />
        <meshStandardMaterial color="#d8cda9" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.9, 0.02]}>
        <boxGeometry args={[1.5, 0.045, 0.66]} />
        <meshStandardMaterial color="#3e2619" roughness={0.9} />
      </mesh>
    </group>
  );
}

// Build a narrow earth path, low ground forms, and layered trees beyond the refuge doorway.
function Woodland() {
  return (
    <group>
      <mesh position={[0, -0.18, -14]}>
        <boxGeometry args={[15, 0.3, 26]} />
        <meshStandardMaterial color="#203628" roughness={1} />
      </mesh>
      <mesh position={[0, 0.005, -14]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.2, 25, 1, 12]} />
        <meshStandardMaterial color="#72583b" roughness={1} />
      </mesh>
      <mesh position={[-3.6, 0.18, -12]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3.2, 12]} />
        <meshStandardMaterial color="#294833" roughness={1} />
      </mesh>
      <mesh position={[3.9, 0.12, -17]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3.7, 12]} />
        <meshStandardMaterial color="#2b4935" roughness={1} />
      </mesh>
      {trees.map((tree) => (
        <WoodlandTree key={tree.position.join(":")} {...tree} />
      ))}
    </group>
  );
}

// Coordinate camera settling and almost-imperceptible natural movement from the read-only journey view.
export function RealmScene({
  reducedMotion,
  visualState,
}: {
  readonly reducedMotion: boolean;
  readonly visualState: JourneyVisualState;
}) {
  const woodlandRef = useRef<Group>(null);
  const elapsedRef = useRef(0);
  const currentLookTarget = useRef(new Vector3(0, 1.05, 0.15));
  const { camera } = useThree();
  const destination = useMemo(() => cameraDestination(visualState), [visualState]);
  const desiredPosition = useMemo(
    () => new Vector3(...destination.position),
    [destination.position],
  );
  const desiredTarget = useMemo(() => new Vector3(...destination.target), [destination.target]);
  const environmentIsQuiet =
    visualState.stage === "scripture" ||
    visualState.stage === "stillness" ||
    (visualState.stage === "reflection" && visualState.choice === "listen");

  // Reduced motion moves immediately to each stable composition instead of traveling between states.
  useEffect(() => {
    if (reducedMotion) {
      camera.position.copy(desiredPosition);
      currentLookTarget.current.copy(desiredTarget);
      camera.lookAt(desiredTarget);
    }
  }, [camera, desiredPosition, desiredTarget, reducedMotion]);

  // Full motion eases toward the newest state and safely changes course when the visitor advances quickly.
  useFrame(({ camera: frameCamera }, delta) => {
    if (!reducedMotion) {
      frameCamera.position.x = MathUtils.damp(
        frameCamera.position.x,
        desiredPosition.x,
        1.15,
        delta,
      );
      frameCamera.position.y = MathUtils.damp(
        frameCamera.position.y,
        desiredPosition.y,
        1.15,
        delta,
      );
      frameCamera.position.z = MathUtils.damp(
        frameCamera.position.z,
        desiredPosition.z,
        1.15,
        delta,
      );
      currentLookTarget.current.x = MathUtils.damp(
        currentLookTarget.current.x,
        desiredTarget.x,
        1.25,
        delta,
      );
      currentLookTarget.current.y = MathUtils.damp(
        currentLookTarget.current.y,
        desiredTarget.y,
        1.25,
        delta,
      );
      currentLookTarget.current.z = MathUtils.damp(
        currentLookTarget.current.z,
        desiredTarget.z,
        1.25,
        delta,
      );
      frameCamera.lookAt(currentLookTarget.current);
    }

    // Let the woodland breathe only when motion is allowed and the current state is not asking for quiet.
    if (
      woodlandRef.current !== null &&
      shouldAnimateAtmosphere(reducedMotion) &&
      !environmentIsQuiet
    ) {
      elapsedRef.current += delta;
      woodlandRef.current.rotation.y = Math.sin(elapsedRef.current * 0.22) * 0.0018;
    }
  });

  const outdoors =
    visualState.stage === "movement" ||
    visualState.stage === "choice" ||
    visualState.stage === "reflection" ||
    visualState.stage === "scripture" ||
    visualState.stage === "stillness";

  return (
    <>
      <color attach="background" args={[outdoors ? "#172a23" : "#241810"]} />
      <fog attach="fog" args={[outdoors ? "#304a3f" : "#35251a", 8, 34]} />
      <hemisphereLight args={["#d9d0ac", "#17251d", outdoors ? 1.15 : 0.72]} />
      <directionalLight color="#f0c982" intensity={outdoors ? 1.75 : 1.25} position={[5, 8, 2]} />
      <pointLight
        color="#e5a965"
        intensity={outdoors ? 0.35 : 2.1}
        distance={10}
        position={[-1.8, 2.5, 1.8]}
      />
      <WoodenSanctuary />
      <group ref={woodlandRef}>
        <Woodland />
      </group>
    </>
  );
}
