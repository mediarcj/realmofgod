// File: apps/sanctuary/components/sanctuary/SanctuaryEnvironment.tsx
// Description: Creates a compact PMREM reflection and indirect-light source.
// Purpose: Gives runtime PBR materials grounded, indoor specular response without a visible backdrop.
// Notes: The generated environment is shared by the scene and disposed with the canvas.

import { useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { PMREMGenerator, type Material } from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import type { LookdevProfile } from "../../lib/sanctuary/lookdev";

export function SanctuaryEnvironment({ lookdev }: { lookdev: LookdevProfile }) {
  const { gl, scene } = useThree();
  const environment = useMemo(() => {
    const generator = new PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const texture = generator.fromScene(room, .04).texture;
    generator.dispose();
    room.traverse((object) => {
      const material = "material" in object ? object.material as Material | Material[] : undefined;
      if (Array.isArray(material)) material.forEach((item) => item.dispose());
      else material?.dispose();
    });
    return texture;
  }, [gl]);
  useEffect(() => {
    const previous = scene.environment;
    scene.environment = environment;
    scene.environmentIntensity = lookdev.environment;
    return () => { scene.environment = previous; environment.dispose(); };
  }, [environment, lookdev.environment, scene]);
  return null;
}
