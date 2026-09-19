// File: apps/sanctuary/components/sanctuary/SanctuaryAsset.tsx
// Description: Displays one unchanged glTF construction unit.
// Purpose: Keeps the Blender world placement and semantic mesh names intact.
// Notes: Runtime materials resolve from accepted unit and source semantic names.

import { useLoader } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { Mesh, Object3D } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { createSanctuaryMaterial, resolveSanctuaryMaterial, sourceMaterialName } from "../../lib/sanctuary/materials";


export function SanctuaryAsset({ unit, onLoaded, interactiveName, onActivate, calibrationKey, calibrationSourceName, onCalibrationObject }: { unit: string; onLoaded?: (unit: string) => void; interactiveName?: string; onActivate: (name: string) => void; calibrationKey?: string; calibrationSourceName?: string; onCalibrationObject?: (key: string, object: Object3D | null) => void }) {
  const gltf = useLoader(GLTFLoader, `/models/sanctuary/${unit}.glb`, (loader) => loader.setMeshoptDecoder(MeshoptDecoder));
  const scene = useMemo(() => {
    const copy = gltf.scene.clone(true);
    copy.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      const material = createSanctuaryMaterial(resolveSanctuaryMaterial(unit, object.name, sourceMaterialName(object.material)));
      object.material = material;
      object.receiveShadow = true;
      object.castShadow = unit.startsWith("altar-") || unit === "table" || unit === "bible" || unit === "kneeling-rest";
    });
    return copy;
  }, [gltf, unit]);
  useEffect(() => { onLoaded?.(unit); }, [unit, onLoaded]);
  useEffect(() => {
    if (!calibrationKey || !onCalibrationObject) return;
    const object = scene.getObjectByName(calibrationSourceName ?? "");
    if (object) onCalibrationObject(calibrationKey, object);
    return () => onCalibrationObject(calibrationKey, null);
  }, [calibrationKey, onCalibrationObject, calibrationSourceName, scene]);
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
