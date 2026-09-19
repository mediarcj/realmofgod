// File: apps/sanctuary/components/sanctuary/SanctuaryAsset.tsx
// Description: Displays one unchanged glTF construction unit.
// Purpose: Keeps the Blender world placement and semantic mesh names intact.
// Notes: Unassigned source surfaces use a neutral matte material.

import { useLoader } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { DoubleSide, Mesh, MeshStandardMaterial } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

const neutral = new MeshStandardMaterial({ color: "#a69b87", roughness: 0.8 });
const ceilingCrossMesh = "ROG_V2_CeilingCross_CLEAN_Mesh.001";

export function SanctuaryAsset({ unit, onLoaded, interactiveName, onActivate }: { unit: string; onLoaded?: (unit: string) => void; interactiveName?: string; onActivate: (name: string) => void }) {
  const gltf = useLoader(GLTFLoader, `/models/sanctuary/${unit}.glb`, (loader) => loader.setMeshoptDecoder(MeshoptDecoder));
  const scene = useMemo(() => {
    const copy = gltf.scene.clone(true);
    copy.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      if (object.name === ceilingCrossMesh) {
        object.material = Array.isArray(object.material)
          ? object.material.map((material) => { const visibleBelow = material.clone(); visibleBelow.side = DoubleSide; return visibleBelow; })
          : (() => { const visibleBelow = object.material.clone(); visibleBelow.side = DoubleSide; return visibleBelow; })();
      } else if (!gltf.parser.json.materials?.length) object.material = neutral;
    });
    return copy;
  }, [gltf]);
  useEffect(() => { onLoaded?.(unit); }, [unit, onLoaded]);
  useEffect(() => { return () => { document.body.style.cursor = ""; }; }, [interactiveName]);
  return <primitive object={scene} dispose={null}
    onClick={interactiveName ? (event: import("@react-three/fiber").ThreeEvent<MouseEvent>) => {
      if (event.object.name === interactiveName) { event.stopPropagation(); document.body.style.cursor = ""; onActivate(interactiveName); }
    } : undefined}
    onPointerOver={interactiveName ? (event: import("@react-three/fiber").ThreeEvent<PointerEvent>) => {
      if (event.object.name === interactiveName) document.body.style.cursor = "pointer";
    } : undefined}
    onPointerOut={interactiveName ? () => { document.body.style.cursor = ""; } : undefined} />;
}
