/**
 * File: apps/sanctuary/src/rendering/RealmScene.tsx
 * Description: Composes the authored timber refuge with the existing temporary woodland peace journey.
 * Purpose: Gives the DOM-led journey a tactile local hero room while preserving its lightweight outdoor branches.
 * Notes: The renderer receives read-only stage and choice values and contains no text, controls, or persistence.
 */

// Import only renderer-local frame access, React helpers, and Three values used by this scene composition.
import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Group, MathUtils, Vector3 } from "three";

import type { JourneyVisualState, PeaceChoice } from "../journey/model";
import {
  readLocalVisualCheck,
  shouldAnimateAtmosphere,
  type RendererVerificationStage,
} from "./capabilities";
import { Hf01SanctuaryAsset } from "./Hf01SanctuaryAsset";

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
      return { position: [-2.2, 1.65, -1.05], target: [0.7, 0.95, 0.55] };
    case "threshold":
      return { position: [-0.15, 1.62, -0.62], target: [0, 1.35, -2.45] };
    case "movement":
      return { position: [0, 1.68, -2.7], target: [0, 1.35, -8] };
    case "choice":
      return { position: [0, 1.62, -7.2], target: [0, 1.25, -13.8] };
    case "reflection":
      return choiceDestination(visualState.choice);
    case "scripture":
      return { position: [0.15, 1.58, -11.4], target: [0, 1.25, -17.3] };
    case "stillness":
      return { position: [-0.1, 1.5, -12.9], target: [0, 1.18, -18.4] };
    case "sanctuary":
      return { position: [-2.2, 1.65, -1.05], target: [0.7, 0.95, 0.55] };
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

// Build one temporary evergreen used only after leaving the authored hero sanctuary.
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

// Build the existing narrow earth path and woodland only when the journey is physically outdoors.
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

// Coordinate camera settling and almost-imperceptible woodland movement from the read-only journey view.
export function RealmScene({
  reducedMotion,
  rendererVerificationStage,
  visualState,
}: {
  readonly reducedMotion: boolean;
  readonly rendererVerificationStage: RendererVerificationStage;
  readonly visualState: JourneyVisualState;
}) {
  const woodlandRef = useRef<Group>(null);
  const elapsedRef = useRef(0);
  const arrivalElapsedRef = useRef(0);
  const currentLookTarget = useRef(new Vector3(0.75, 1.1, 0.7));
  const [authoredSceneReady, setAuthoredSceneReady] = useState(false);
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
  const outdoors =
    visualState.stage === "movement" ||
    visualState.stage === "choice" ||
    visualState.stage === "reflection" ||
    visualState.stage === "scripture" ||
    visualState.stage === "stillness";
  const bareCanvas = rendererVerificationStage === "a";
  const staticRuntimeLights =
    rendererVerificationStage !== "a" && rendererVerificationStage !== "b";
  const dynamicShadows = rendererVerificationStage === "e";
  const localVisualCheck = readLocalVisualCheck();
  const fixedDoorReview = localVisualCheck === "door-mid";
  const fixedBibleReview =
    localVisualCheck === "bible-partial" || localVisualCheck === "bible-open";

  // Synchronize the authored door motion with a fresh threshold camera instead of moving behind a loading fallback.
  const handleAuthoredSceneReady = useCallback(() => {
    if (fixedBibleReview) {
      camera.position.set(-2.2, 1.65, -1.05);
      currentLookTarget.current.set(0.7, 0.95, 0.55);
    } else {
      camera.position.set(0, 1.68, -5.3);
      currentLookTarget.current.set(0.65, 1, 0.55);
    }
    camera.lookAt(currentLookTarget.current);
    arrivalElapsedRef.current = 0;
    setAuthoredSceneReady(true);
  }, [camera, fixedBibleReview]);

  // Reduced motion moves immediately to each stable composition instead of traveling between states.
  useEffect(() => {
    if (reducedMotion && authoredSceneReady) {
      camera.position.copy(desiredPosition);
      currentLookTarget.current.copy(desiredTarget);
      camera.lookAt(desiredTarget);
    }
  }, [authoredSceneReady, camera, desiredPosition, desiredTarget, reducedMotion]);

  // Full motion eases from the fresh threshold camera and safely changes course on an early journey action.
  useFrame(({ camera: frameCamera }, delta) => {
    if (authoredSceneReady && !reducedMotion) {
      // Development-only clip review poses keep the actual asset still at the matching authored camera.
      if (fixedDoorReview || fixedBibleReview) {
        frameCamera.lookAt(currentLookTarget.current);
        return;
      }

      const isRoomArrival = visualState.stage === "entry" || visualState.stage === "sanctuary";
      if (isRoomArrival) {
        arrivalElapsedRef.current += delta;
      }
      const cameraCanEnter = !isRoomArrival || arrivalElapsedRef.current >= 1.15;
      const cameraDamping = isRoomArrival ? 1.7 : 0.8;

      // Hold at the visible threshold briefly, then enter before the authored door finishes closing.
      if (!cameraCanEnter) {
        frameCamera.position.set(0, 1.68, -5.3);
        currentLookTarget.current.set(0.65, 1, 0.55);
        frameCamera.lookAt(currentLookTarget.current);
        return;
      }

      frameCamera.position.x = MathUtils.damp(
        frameCamera.position.x,
        desiredPosition.x,
        cameraDamping,
        delta,
      );
      frameCamera.position.y = MathUtils.damp(
        frameCamera.position.y,
        desiredPosition.y,
        cameraDamping,
        delta,
      );
      frameCamera.position.z = MathUtils.damp(
        frameCamera.position.z,
        desiredPosition.z,
        cameraDamping,
        delta,
      );
      currentLookTarget.current.x = MathUtils.damp(
        currentLookTarget.current.x,
        desiredTarget.x,
        1.05,
        delta,
      );
      currentLookTarget.current.y = MathUtils.damp(
        currentLookTarget.current.y,
        desiredTarget.y,
        1.05,
        delta,
      );
      currentLookTarget.current.z = MathUtils.damp(
        currentLookTarget.current.z,
        desiredTarget.z,
        1.05,
        delta,
      );
      frameCamera.lookAt(currentLookTarget.current);
    }

    // Let the temporary woodland breathe only when motion is allowed and the current state is not asking for quiet.
    if (
      woodlandRef.current !== null &&
      shouldAnimateAtmosphere(reducedMotion) &&
      !environmentIsQuiet
    ) {
      elapsedRef.current += delta;
      woodlandRef.current.rotation.y = Math.sin(elapsedRef.current * 0.22) * 0.0018;
    }
  });

  return (
    <>
      <color
        attach="background"
        args={[bareCanvas ? "#5b321d" : outdoors ? "#172a23" : "#17100c"]}
      />
      <fog attach="fog" args={[outdoors ? "#304a3f" : "#2b1d15", 8, 34]} />
      {bareCanvas ? (
        <mesh position={[0.8, 1.1, 0]}>
          <boxGeometry args={[1.1, 1.1, 1.1]} />
          <meshBasicMaterial color="#e4b56f" />
        </mesh>
      ) : null}
      {staticRuntimeLights ? (
        <>
          <hemisphereLight args={["#d9cfb0", "#111b16", outdoors ? 1.05 : 0.82]} />
          <directionalLight
            castShadow={dynamicShadows}
            color="#f0c982"
            intensity={outdoors ? 1.5 : 1.2}
            position={[4.5, 7.5, 1.5]}
            shadow-bias={-0.00035}
            shadow-mapSize-height={1024}
            shadow-mapSize-width={1024}
          />
        </>
      ) : null}
      {!bareCanvas ? (
        <Hf01SanctuaryAsset
          onReady={handleAuthoredSceneReady}
          reducedMotion={reducedMotion}
          rendererVerificationStage={rendererVerificationStage}
          visualState={visualState}
        />
      ) : null}
      {outdoors ? (
        <group ref={woodlandRef}>
          <Woodland />
        </group>
      ) : null}
    </>
  );
}
