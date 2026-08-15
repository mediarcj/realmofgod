/**
 * File: apps/sanctuary/src/rendering/ExperienceViewport.tsx
 * Description: Chooses the optional Canvas scene or local DOM fallback beside the semantic sanctuary document.
 * Purpose: Contains Three.js and React Three Fiber so the visual renderer does not become the application boundary.
 * Notes: Capability and motion state stay local; this component performs no network or browser-storage work.
 */

// Import the Canvas renderer separately from the DOM-first sanctuary components.
import { Canvas } from "@react-three/fiber";
import { Component, type ReactNode, useState } from "react";

import { detectGraphicsCapability, selectExperienceMode } from "./capabilities";
import { ProofScene } from "./ProofScene";
import { useReducedMotion } from "./useReducedMotion";

// Describe the narrow error boundary contract used only to replace an unavailable visual layer.
interface ViewportErrorBoundaryProps {
  readonly children: ReactNode;
}

interface ViewportErrorBoundaryState {
  readonly failed: boolean;
}

// Keep a Canvas initialization failure from taking down the primary semantic document.
class ViewportErrorBoundary extends Component<
  ViewportErrorBoundaryProps,
  ViewportErrorBoundaryState
> {
  public override state: ViewportErrorBoundaryState = { failed: false };

  public static getDerivedStateFromError(): ViewportErrorBoundaryState {
    return { failed: true };
  }

  public override render(): ReactNode {
    return this.state.failed ? <ExperienceFallback /> : this.props.children;
  }
}

// Offer a calm visual surface when Canvas cannot be used; document content remains outside this decoration.
export function ExperienceFallback(): ReactNode {
  return (
    <div className="experience-fallback" aria-hidden="true">
      <p>A still clearing remains here for this visit.</p>
    </div>
  );
}

// Keep capability selection local and let reduced motion retain a still version of the same proof scene.
export function ExperienceViewport(): ReactNode {
  const [experienceMode] = useState(() => selectExperienceMode(detectGraphicsCapability()));
  const reducedMotion = useReducedMotion();

  if (experienceMode === "fallback") {
    return (
      <section className="experience-viewport" aria-label="Optional sanctuary environment">
        <ExperienceFallback />
      </section>
    );
  }

  return (
    <section className="experience-viewport" aria-label="Optional sanctuary environment">
      <ViewportErrorBoundary>
        <div className="experience-canvas" aria-hidden="true">
          <Canvas
            camera={{ fov: 42, position: [0, 0.2, 5.2] }}
            dpr={[1, 1.5]}
            gl={{ antialias: false, powerPreference: "low-power" }}
          >
            <ProofScene reducedMotion={reducedMotion} />
          </Canvas>
        </div>
      </ViewportErrorBoundary>
    </section>
  );
}
