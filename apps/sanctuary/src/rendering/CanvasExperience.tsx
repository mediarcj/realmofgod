/**
 * File: apps/sanctuary/src/rendering/CanvasExperience.tsx
 * Description: Renders the optional local Canvas environment after the lightweight viewport selects it.
 * Purpose: Holds renderer-only imports in an asynchronous application chunk instead of the mandatory document path.
 * Notes: The scene is decorative, uses no remote assets, and remains separate from sanctuary semantics.
 */

// Import renderer-specific code only inside this asynchronously loaded visual module.
import { Canvas } from "@react-three/fiber";
import type { ReactNode } from "react";
import { AgXToneMapping, PCFSoftShadowMap, SRGBColorSpace } from "three";

import type { JourneyVisualState } from "../journey/model";
import { RealmScene } from "./RealmScene";

// Describe the single local preference forwarded from the lightweight viewport boundary.
interface CanvasExperienceProps {
  readonly reducedMotion: boolean;
  readonly visualState: JourneyVisualState;
}

// Render a full atmospheric background while keeping every meaningful word and action in the DOM.
export function CanvasExperience({ reducedMotion, visualState }: CanvasExperienceProps): ReactNode {
  return (
    <div className="experience-canvas" aria-hidden="true">
      <Canvas
        camera={{ fov: 46, near: 0.1, far: 60, position: [1.6, 1.68, -5.3] }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          powerPreference: "high-performance",
          // Preserve the development framebuffer only so loopback visual evidence captures the current frame.
          preserveDrawingBuffer: import.meta.env.DEV,
        }}
        onCreated={({ gl }) => {
          // Use photographic highlight rolloff and explicit sRGB output without a postprocessing chain.
          gl.outputColorSpace = SRGBColorSpace;
          gl.shadowMap.enabled = true;
          gl.shadowMap.type = PCFSoftShadowMap;
          gl.toneMapping = AgXToneMapping;
          gl.toneMappingExposure = 1.04;
        }}
        shadows="soft"
      >
        <RealmScene reducedMotion={reducedMotion} visualState={visualState} />
      </Canvas>
    </div>
  );
}

// Provide React.lazy with the module's renderer-only component while retaining a named export for direct tests.
export default CanvasExperience;
