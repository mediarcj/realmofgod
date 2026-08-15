/**
 * File: apps/sanctuary/src/rendering/CanvasExperience.tsx
 * Description: Renders the optional local Canvas environment after the lightweight viewport selects it.
 * Purpose: Holds renderer-only imports in an asynchronous application chunk instead of the mandatory document path.
 * Notes: The scene is decorative, uses no remote assets, and remains separate from sanctuary semantics.
 */

// Import renderer-specific code only inside this asynchronously loaded visual module.
import { Canvas } from "@react-three/fiber";
import type { ReactNode } from "react";

import { ProofScene } from "./ProofScene";

// Describe the single local preference forwarded from the lightweight viewport boundary.
interface CanvasExperienceProps {
  readonly reducedMotion: boolean;
}

// Render a modest Canvas surface while keeping all meaningful sanctuary content in ordinary DOM elements.
export function CanvasExperience({ reducedMotion }: CanvasExperienceProps): ReactNode {
  return (
    <div className="experience-canvas" aria-hidden="true">
      <Canvas
        camera={{ fov: 42, position: [0, 0.2, 5.2] }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, powerPreference: "low-power" }}
      >
        <ProofScene reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  );
}

// Provide React.lazy with the module's renderer-only component while retaining a named export for direct tests.
export default CanvasExperience;
