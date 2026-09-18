// File: apps/sanctuary/components/sanctuary/SanctuaryAsset.tsx
// Description: Displays one unchanged glTF construction unit.
// Purpose: Keeps the Blender world placement and semantic mesh names intact.
// Notes: Unassigned source surfaces use a neutral matte material.

import { useLoader } from "@react-three/fiber";
import { useMemo } from "react";
import { Mesh, MeshStandardMaterial } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

const neutral = new MeshStandardMaterial({ color: "#a69b87", roughness: 0.8 });

export function SanctuaryAsset({ unit }: { unit: string }) {
  const gltf = useLoader(GLTFLoader, `/models/sanctuary/${unit}.glb`, (loader) => loader.setMeshoptDecoder(MeshoptDecoder));
  const scene = useMemo(() => {
    const copy = gltf.scene.clone(true);
    copy.traverse((object) => {
      if (object instanceof Mesh && !gltf.parser.json.materials?.length) object.material = neutral;
    });
    return copy;
  }, [gltf]);
  return <primitive object={scene} dispose={null} />;
}
