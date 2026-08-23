/**
 * File: apps/sanctuary/src/rendering/D84StaticSanctuaryProof.tsx
 * Description: Loads a local D8.4 sanctuary candidate for a bounded development-only draw and shadow comparison.
 * Purpose: Measures static batching and restrained shadows without changing the production asset or journey behavior.
 * Notes: This component is dynamically reachable only from an exact development fragment and contains no visitor data.
 */

// Import only renderer-local loading, measurement, and light primitives needed by the bounded proof scene.
import { useLoader, useThree } from "@react-three/fiber";
import { useEffect, useMemo, type ReactNode } from "react";
import { Light, Mesh, Object3D, Vector3 } from "three";
import type { GLTF } from "three/addons/loaders/GLTFLoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

import baselineCandidateUrl from "../assets/candidates/realm-mvp-sanctuary-v1-r2-meshopt.glb?url";
import batchedCandidateUrl from "../assets/candidates/realm-mvp-sanctuary-v1-r2-batched-meshopt.glb?url";
import type { D84StaticProofConfig } from "./capabilities";
import type { VisualCalibration } from "./visualCalibration";

// Narrow Three's loose object surface to the exact visibility and shadow controls used by the proof.
interface ShadowableMesh {
  castShadow: boolean;
  name: string;
  receiveShadow: boolean;
}

// Configure Three's repository-bundled decoder so both Meshopt candidates load without a remote decoder path.
function configureLoader(loader: GLTFLoader): void {
  loader.setMeshoptDecoder(MeshoptDecoder);
}

// Keep glowing flames, transparent glass, and any later dust decoration out of every shadow map policy.
function isNeverShadowCaster(name: string): boolean {
  return /(?:Flame|Wick|Glass|Dust)/iu.test(name);
}

// Match D8.3's foreground caster choice for the current policy while restricting the candidate policy to solid focal forms.
function shouldCastShadow(name: string, policy: D84StaticProofConfig["shadowPolicy"]): boolean {
  if (policy === "off" || isNeverShadowCaster(name)) {
    return false;
  }
  if (policy === "current") {
    return /(?:Bible|Door|PrayerTable|TableCross|Candle)/iu.test(name);
  }
  return /(?:Door_North_Slab|PrayerTable|Bible|TableCross)/iu.test(name);
}

// Apply the same bounded prop offsets as the live asset so both proof files share the approved entry composition.
function applyProofTransform(
  scene: Object3D,
  name: string,
  transform: VisualCalibration["table"],
): void {
  const object = scene.getObjectByName(name);
  if (object === undefined) {
    throw new Error(`The D8.4 proof candidate is missing the required root: ${name}.`);
  }
  object.position.add(new Vector3(...transform.position));
  object.rotation.y += transform.rotationY;
  object.scale.multiplyScalar(transform.scale);
}

// Clone the loaded graph so source caches remain untouched while each test policy can safely set renderer-local flags.
function prepareProofScene(
  source: Object3D,
  policy: D84StaticProofConfig["shadowPolicy"],
  visualCalibration: VisualCalibration,
): Object3D {
  const clone = source.clone(true);
  clone.traverse((object) => {
    if (object instanceof Mesh) {
      const mesh = object as unknown as ShadowableMesh;
      mesh.receiveShadow = policy !== "off";
      mesh.castShadow = shouldCastShadow(mesh.name, policy);
    }
    if (object instanceof Light) {
      // The candidate contains no authored lights, but disable any future embedded source so this proof remains explicit.
      object.castShadow = false;
      object.visible = false;
    }
  });
  applyProofTransform(clone, "HF01_PrayerTable", visualCalibration.table);
  applyProofTransform(clone, "HF01_Bible_Root", visualCalibration.bible);
  applyProofTransform(clone, "HF01_Candle_Left", visualCalibration.candleLeft);
  applyProofTransform(clone, "HF01_Candle_Right", visualCalibration.candleRight);
  return clone;
}

// Report actual renderer counters after the selected GLB has loaded, avoiding geometry-only estimates in the browser proof.
function RuntimeMetrics({ config }: { readonly config: D84StaticProofConfig }): ReactNode {
  const { gl } = useThree();

  useEffect(() => {
    const selector = ".experience-canvas canvas";
    const canvas = document.querySelector<HTMLCanvasElement>(selector);
    canvas?.setAttribute("data-d84-proof-ready", "false");
    canvas?.setAttribute("data-d84-candidate", config.candidate);
    canvas?.setAttribute("data-d84-shadow-policy", config.shadowPolicy);
    // Wait for two browser frames so the counter snapshot represents a completed local proof render.
    const firstFrame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const settledCanvas = document.querySelector<HTMLCanvasElement>(selector);
        settledCanvas?.setAttribute("data-d84-renderer-calls", String(gl.info.render.calls));
        settledCanvas?.setAttribute(
          "data-d84-renderer-triangles",
          String(gl.info.render.triangles),
        );
        settledCanvas?.setAttribute("data-d84-proof-ready", "true");
      });
    });
    return () => {
      window.cancelAnimationFrame(firstFrame);
      const currentCanvas = document.querySelector<HTMLCanvasElement>(selector);
      currentCanvas?.removeAttribute("data-d84-proof-ready");
      currentCanvas?.removeAttribute("data-d84-renderer-calls");
      currentCanvas?.removeAttribute("data-d84-renderer-triangles");
      currentCanvas?.removeAttribute("data-d84-candidate");
      currentCanvas?.removeAttribute("data-d84-shadow-policy");
    };
  }, [config.candidate, config.shadowPolicy, gl]);

  return null;
}

// Recreate the existing room light positions but give each policy a deliberately explicit caster budget.
function ProofLighting({
  config,
  visualCalibration,
}: {
  readonly config: D84StaticProofConfig;
  readonly visualCalibration: VisualCalibration;
}): ReactNode {
  const shadowsEnabled = config.shadowPolicy !== "off";
  const currentShadows = config.shadowPolicy === "current";
  const warmKey = visualCalibration.lighting.warmKey;

  return (
    <>
      <hemisphereLight
        args={[
          visualCalibration.lighting.fill.color,
          "#17100c",
          visualCalibration.lighting.fill.intensity,
        ]}
      />
      <directionalLight
        castShadow={shadowsEnabled}
        color={visualCalibration.lighting.exteriorKey.color}
        intensity={visualCalibration.lighting.exteriorKey.intensity}
        position={[4.5, 7.5, 1.5]}
        shadow-bias={-0.00035}
        shadow-mapSize-height={1024}
        shadow-mapSize-width={1024}
      />
      <pointLight
        castShadow={currentShadows}
        color="#ff9f45"
        decay={2}
        distance={5.4}
        intensity={warmKey.intensity * 0.16}
        position={[...warmKey.position]}
        shadow-bias={-0.00035}
        shadow-mapSize-height={512}
        shadow-mapSize-width={512}
      />
      <pointLight
        castShadow={currentShadows}
        color="#ff8a36"
        decay={2}
        distance={4.2}
        intensity={warmKey.intensity * 4.5}
        position={[
          -1.12 + visualCalibration.candleLeft.position[0],
          1.895 + visualCalibration.candleLeft.position[1],
          0.18 + visualCalibration.candleLeft.position[2],
        ]}
        shadow-bias={-0.00035}
        shadow-mapSize-height={512}
        shadow-mapSize-width={512}
      />
      <pointLight
        castShadow={currentShadows}
        color="#ff8a36"
        decay={2}
        distance={4.2}
        intensity={warmKey.intensity * 4.5}
        position={[
          1.12 + visualCalibration.candleRight.position[0],
          1.895 + visualCalibration.candleRight.position[1],
          0.18 + visualCalibration.candleRight.position[2],
        ]}
        shadow-bias={-0.00035}
        shadow-mapSize-height={512}
        shadow-mapSize-width={512}
      />
    </>
  );
}

// Render one selected local candidate with the existing camera calibration left entirely unchanged.
export function D84StaticSanctuaryProof({
  config,
  visualCalibration,
}: {
  readonly config: D84StaticProofConfig;
  readonly visualCalibration: VisualCalibration;
}): ReactNode {
  const candidateUrl = config.candidate === "baseline" ? baselineCandidateUrl : batchedCandidateUrl;
  const gltf = useLoader(GLTFLoader, candidateUrl, configureLoader) as GLTF;
  const scene = useMemo(
    () => prepareProofScene(gltf.scene, config.shadowPolicy, visualCalibration),
    [config.shadowPolicy, gltf.scene, visualCalibration],
  );

  return (
    <>
      <color attach="background" args={["#17100c"]} />
      <ProofLighting config={config} visualCalibration={visualCalibration} />
      <group
        position={[...visualCalibration.room.position]}
        rotation={[0, visualCalibration.room.rotationY, 0]}
        scale={visualCalibration.room.scale}
      >
        <primitive object={scene} />
      </group>
      <RuntimeMetrics config={config} />
    </>
  );
}
