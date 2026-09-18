// File: apps/sanctuary/components/sanctuary/SanctuaryAsset.tsx
// Description: Displays one unchanged glTF construction unit.
// Purpose: Keeps the Blender world placement and semantic mesh names intact.
// Notes: Unassigned source surfaces use a neutral matte material.

import { useLoader } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { Mesh, MeshStandardMaterial } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { anchorByRole } from "../../lib/sanctuary/runtime";

const neutral = new MeshStandardMaterial({ color: "#a69b87", roughness: 0.8 });

export function SanctuaryAsset({ unit, onLoaded, onBible }: { unit: string; onLoaded?: (unit: string) => void; onBible?: () => void }) {
  const gltf = useLoader(GLTFLoader, `/models/sanctuary/${unit}.glb`, (loader) => loader.setMeshoptDecoder(MeshoptDecoder));
  const scene = useMemo(() => {
    const copy = gltf.scene.clone(true);
    copy.traverse((object) => {
      if (object instanceof Mesh && !gltf.parser.json.materials?.length) object.material = neutral;
    });
    return copy;
  }, [gltf]);
  useEffect(() => { onLoaded?.(unit); }, [unit, onLoaded]);
  return <primitive object={scene} dispose={null}
    onClick={onBible ? (event: import("@react-three/fiber").ThreeEvent<MouseEvent>) => {
      if (event.object.name === anchorByRole("BIBLE_HOVER_CLICK_FOCUS").host) { event.stopPropagation(); onBible(); }
    } : undefined}
    onPointerOver={onBible ? (event: import("@react-three/fiber").ThreeEvent<PointerEvent>) => {
      if (event.object.name === anchorByRole("BIBLE_HOVER_CLICK_FOCUS").host) document.body.style.cursor = "pointer";
    } : undefined}
    onPointerOut={onBible ? () => { document.body.style.cursor = ""; } : undefined} />;
}
