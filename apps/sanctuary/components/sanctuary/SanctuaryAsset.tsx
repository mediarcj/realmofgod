// File: apps/sanctuary/components/sanctuary/SanctuaryAsset.tsx
// Description: Displays one unchanged glTF construction unit.
// Purpose: Keeps the Blender world placement and semantic mesh names intact.
// Notes: Runtime materials resolve from accepted unit and source semantic names.

import { useLoader } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { Mesh, Object3D } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { createSanctuaryMaterial, materialProjectionMode, materialTextureSet, resolveSanctuaryMaterial, sourceMaterialName } from "../../lib/sanctuary/materials";
import type { MaterialDebugInfo } from "./MaterialDebugReadout";


export function SanctuaryAsset({ unit, onLoaded, interactiveName, onActivate, calibrationKey, calibrationSourceName, onCalibrationObject, onMaterialDebug }: { unit: string; onLoaded?: (unit: string) => void; interactiveName?: string; onActivate: (name: string) => void; calibrationKey?: string; calibrationSourceName?: string; onCalibrationObject?: (key: string, object: Object3D | null) => void; onMaterialDebug?: (info: MaterialDebugInfo) => void }) {
  const gltf = useLoader(GLTFLoader, `/models/sanctuary/${unit}.glb`, (loader) => loader.setMeshoptDecoder(MeshoptDecoder));
  const scene = useMemo(() => {
    const copy = gltf.scene.clone(true);
    copy.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      const hasAuthoredUv = Boolean(object.geometry.getAttribute("uv"));
      const sourceMaterials = Array.isArray(object.material) ? object.material : [object.material];
      const resolutions = sourceMaterials.map((material) => resolveSanctuaryMaterial(unit, object.name, sourceMaterialName(material)));
      const runtimeMaterials = resolutions.map((resolution) => createSanctuaryMaterial(resolution, hasAuthoredUv, object.name));
      object.material = Array.isArray(object.material) ? runtimeMaterials : runtimeMaterials[0];
      const resolution = resolutions[0];
      object.userData.sanctuaryMaterial = { unit, family: resolutions.map((item) => item.family).join("|"), source: resolutions.map((item) => item.source).join("|"), uv: hasAuthoredUv, projection: materialProjectionMode(resolution.family, hasAuthoredUv), textureSet: materialTextureSet(resolution.family) };
      object.receiveShadow = true;
      object.castShadow = unit.startsWith("altar-") || unit === "table" || unit === "bible" || unit === "kneeling-rest" || unit === "ceiling-structure" || unit === "ceiling-coffers" || unit.endsWith("wall") || unit.endsWith("wall-panels") || unit === "baseboard" || unit.endsWith("stringcourse");
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
    onPointerOver={interactiveName || onMaterialDebug ? (event: import("@react-three/fiber").ThreeEvent<PointerEvent>) => {
      const info = event.object.userData.sanctuaryMaterial as Omit<MaterialDebugInfo, "mesh"> | undefined;
      if (info) onMaterialDebug?.({ ...info, mesh: event.object.name });
      if (event.object.name === interactiveName) document.body.style.cursor = "pointer";
    } : undefined}
    onPointerOut={interactiveName ? () => { document.body.style.cursor = ""; } : undefined} />;
}
