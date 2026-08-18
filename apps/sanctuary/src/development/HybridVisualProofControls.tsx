/**
 * File: apps/sanctuary/src/development/HybridVisualProofControls.tsx
 * Description: Provides the small development-only selector and motion control for visual comparison.
 * Purpose: Lets the owner compare visual implementations without changing the anonymous Journey Engine.
 * Notes: This component is lazy-loaded only in development and stores no preference outside React memory.
 */

// Import the small visual-mode type without importing any media or changing journey state.
import type { ReactNode } from "react";

import type { VisualProofMode } from "../rendering/hybridProof";
import "./hybrid-visual-proof-controls.css";

// Describe the view-local controls that the parent owns while keeping interaction state out of browser storage.
interface HybridVisualProofControlsProps {
  readonly cinematicActive: boolean;
  readonly motionPaused: boolean;
  readonly onMotionPausedChange: (paused: boolean) => void;
  readonly onVisualProofModeChange: (mode: VisualProofMode) => void;
  readonly visualProofMode: VisualProofMode;
}

// Render ordinary buttons so comparison and motion controls remain keyboard-accessible DOM elements.
export default function HybridVisualProofControls({
  cinematicActive,
  motionPaused,
  onMotionPausedChange,
  onVisualProofModeChange,
  visualProofMode,
}: HybridVisualProofControlsProps): ReactNode {
  return (
    <aside className="hybrid-visual-proof-controls" aria-label="Visual proof controls">
      <p>Visual proof</p>
      <div className="hybrid-visual-proof-actions">
        <button
          type="button"
          aria-pressed={visualProofMode === "realtime"}
          onClick={() => {
            onVisualProofModeChange("realtime");
          }}
        >
          Real-time R3F
        </button>
        <button
          type="button"
          aria-pressed={visualProofMode === "cinematic"}
          onClick={() => {
            onVisualProofModeChange("cinematic");
          }}
        >
          Cinematic Higgsfield
        </button>
      </div>
      {cinematicActive ? (
        <button
          className="hybrid-motion-control"
          type="button"
          aria-pressed={motionPaused}
          onClick={() => {
            onMotionPausedChange(!motionPaused);
          }}
        >
          {motionPaused ? "Resume motion" : "Pause motion"}
        </button>
      ) : null}
    </aside>
  );
}
