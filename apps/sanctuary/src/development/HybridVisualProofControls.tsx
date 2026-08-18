/**
 * File: apps/sanctuary/src/development/HybridVisualProofControls.tsx
 * Description: Provides the small development-only selector and motion control for visual comparison.
 * Purpose: Lets the owner compare visual implementations without changing the anonymous Journey Engine.
 * Notes: This component is lazy-loaded only in development and stores no preference outside React memory.
 */

// Import the small visual-mode type without importing any media or changing journey state.
import type { ReactNode } from "react";

import type { CinematicMotionStatus, VisualProofMode } from "../rendering/hybridProof";
import "./hybrid-visual-proof-controls.css";

// Describe the view-local controls that the parent owns while keeping interaction state out of browser storage.
interface HybridVisualProofControlsProps {
  readonly cinematicActive: boolean;
  readonly motionStatus: CinematicMotionStatus;
  readonly onPauseMotion: () => void;
  readonly onStartMotion: () => void;
  readonly onVisualProofModeChange: (mode: VisualProofMode) => void;
  readonly visualProofMode: VisualProofMode;
}

// Give the proof a truthful description even when the browser has no moving frame to show.
function MotionStatusControl({
  motionStatus,
  onPauseMotion,
  onStartMotion,
}: Pick<
  HybridVisualProofControlsProps,
  "motionStatus" | "onPauseMotion" | "onStartMotion"
>): ReactNode {
  switch (motionStatus) {
    case "playing":
      return (
        <button className="hybrid-motion-control" type="button" onClick={onPauseMotion}>
          Pause motion
        </button>
      );
    case "paused":
      return (
        <button className="hybrid-motion-control" type="button" onClick={onStartMotion}>
          Resume motion
        </button>
      );
    case "unavailable":
      return (
        <div className="hybrid-motion-status" role="status">
          <span>Motion unavailable</span>
          <button className="hybrid-motion-control" type="button" onClick={onStartMotion}>
            Start motion
          </button>
        </div>
      );
    case "reduced":
      return (
        <p className="hybrid-motion-status" role="status">
          Motion disabled by reduced-motion preference
        </p>
      );
    case "failed":
      return (
        <p className="hybrid-motion-status" role="status">
          Motion unavailable because media failed
        </p>
      );
    case "loading":
      return (
        <p className="hybrid-motion-status" role="status">
          Loading motion
        </p>
      );
  }
}

// Render ordinary buttons so comparison and motion controls remain keyboard-accessible DOM elements.
export default function HybridVisualProofControls({
  cinematicActive,
  motionStatus,
  onPauseMotion,
  onStartMotion,
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
        <MotionStatusControl
          motionStatus={motionStatus}
          onPauseMotion={onPauseMotion}
          onStartMotion={onStartMotion}
        />
      ) : null}
    </aside>
  );
}
