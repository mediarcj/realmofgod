/**
 * File: apps/sanctuary/src/rendering/D9FinalArtLightBeams.tsx
 * Description: Adds the fixed, transparent daylight shafts used by the final-art sanctuary scene.
 * Purpose: Suggests the reference room's clerestory light without importing a Blender volume or adding a moving light source.
 * Notes: The meshes are local, decorative, and intentionally static for both ordinary and reduced-motion visitors.
 */

// Import React's render type only; these decorative meshes require no frame loop or mutable runtime state.
import type { ReactNode } from "react";

// Keep the two broad shafts as geometry rather than a white volume cube so normal scene inspection remains unobstructed.
export function D9FinalArtLightBeams(): ReactNode {
  return (
    <group name="D9_FinalArt_TransparentDaylightBeams">
      {/* The main upper-right plane implies the dominant warm daylight seen across the room without becoming another lamp. */}
      <mesh position={[1.62, 3.56, 2.68]} rotation={[-0.52, 0.16, -0.12]}>
        <planeGeometry args={[2.9, 3.9]} />
        <meshBasicMaterial
          color="#e7a65d"
          depthWrite={false}
          opacity={0.035}
          side={2}
          transparent
        />
      </mesh>
      {/* The quieter left plane preserves the reference's soft counter-light while leaving the table as the focal surface. */}
      <mesh position={[-2.92, 2.12, 1.78]} rotation={[-0.74, -0.28, 0.2]}>
        <planeGeometry args={[1.7, 2.75]} />
        <meshBasicMaterial
          color="#c67d3b"
          depthWrite={false}
          opacity={0.018}
          side={2}
          transparent
        />
      </mesh>
    </group>
  );
}
