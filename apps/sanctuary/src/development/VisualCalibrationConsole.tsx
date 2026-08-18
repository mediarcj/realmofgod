/**
 * File: apps/sanctuary/src/development/VisualCalibrationConsole.tsx
 * Description: Provides local visual tuning and reference comparison for the sanctuary hero.
 * Purpose: Lets the owner and developer calibrate authored values in the actual browser without a new dependency.
 * Notes: This module is development-only; references remain memory-only object URLs and are never transmitted.
 */

// Import only React state/lifecycle helpers, the local stylesheet, and reviewed calibration types.
import { useEffect, useState, type ChangeEvent, type CSSProperties, type ReactNode } from "react";

import type {
  CalibrationVector,
  TransformCalibration,
  VisualCalibration,
} from "../rendering/visualCalibration";
import { createDefaultVisualCalibration } from "../rendering/visualCalibration";
import "./visual-calibration-console.css";

type ComparisonMode = "actual-only" | "overlay" | "side-by-side";
const calibrationAxes = [
  { index: 0, label: "X" },
  { index: 1, label: "Y" },
  { index: 2, label: "Z" },
] as const;

interface NumericControlProps {
  readonly label: string;
  readonly max: number;
  readonly min: number;
  readonly onChange: (value: number) => void;
  readonly step: number;
  readonly value: number;
}

// Pair every slider with its exact numeric value so visual changes remain reproducible.
function NumericControl({
  label,
  max,
  min,
  onChange,
  step,
  value,
}: NumericControlProps): ReactNode {
  return (
    <label className="calibration-number">
      <span>{label}</span>
      <input
        max={max}
        min={min}
        onChange={(event) => {
          onChange(event.currentTarget.valueAsNumber);
        }}
        step={step}
        type="range"
        value={value}
      />
      <input
        aria-label={`${label} numeric value`}
        className="calibration-number-value"
        max={max}
        min={min}
        onChange={(event) => {
          onChange(event.currentTarget.valueAsNumber);
        }}
        step={step}
        type="number"
        value={value}
      />
    </label>
  );
}

// Replace one tuple coordinate without changing the other reviewed axes.
function replaceCoordinate(
  vector: CalibrationVector,
  index: 0 | 1 | 2,
  value: number,
): CalibrationVector {
  const next: [number, number, number] = [...vector];
  next[index] = value;
  return next;
}

// Present XYZ controls consistently for camera, focus, room, light, and prop positions.
function VectorControls({
  label,
  max,
  min,
  onChange,
  step = 0.01,
  value,
}: {
  readonly label: string;
  readonly max: number;
  readonly min: number;
  readonly onChange: (value: CalibrationVector) => void;
  readonly step?: number;
  readonly value: CalibrationVector;
}): ReactNode {
  return (
    <fieldset className="calibration-vector">
      <legend>{label}</legend>
      {calibrationAxes.map((axis) => (
        <NumericControl
          key={axis.label}
          label={axis.label}
          max={max}
          min={min}
          onChange={(next) => {
            onChange(replaceCoordinate(value, axis.index, next));
          }}
          step={step}
          value={value[axis.index]}
        />
      ))}
    </fieldset>
  );
}

// Keep runtime-safe prop tuning to position, one room-relative rotation axis, and uniform scale.
function TransformControls({
  label,
  onChange,
  value,
}: {
  readonly label: string;
  readonly onChange: (value: TransformCalibration) => void;
  readonly value: TransformCalibration;
}): ReactNode {
  return (
    <fieldset className="calibration-group">
      <legend>{label}</legend>
      <VectorControls
        label="Position offset"
        max={2}
        min={-2}
        onChange={(position) => {
          onChange({ ...value, position });
        }}
        value={value.position}
      />
      <NumericControl
        label="Y rotation"
        max={3.14}
        min={-3.14}
        onChange={(rotationY) => {
          onChange({ ...value, rotationY });
        }}
        step={0.01}
        value={value.rotationY}
      />
      <NumericControl
        label="Scale"
        max={2}
        min={0.25}
        onChange={(scale) => {
          onChange({ ...value, scale });
        }}
        step={0.01}
        value={value.scale}
      />
    </fieldset>
  );
}

// Render one development-only calibration surface and local reference layer outside the sanctuary DOM.
export default function VisualCalibrationConsole({
  calibration,
  onCalibrationChange,
}: {
  readonly calibration: VisualCalibration;
  readonly onCalibrationChange: (calibration: VisualCalibration) => void;
}): ReactNode {
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>("actual-only");
  const [copyStatus, setCopyStatus] = useState("Copy Calibration JSON");
  const [expanded, setExpanded] = useState(false);
  const [referenceName, setReferenceName] = useState("No local reference selected");
  const [referenceOpacity, setReferenceOpacity] = useState(0.5);
  const [referenceUrl, setReferenceUrl] = useState<string | null>(null);

  // Revoke each memory-only object URL as soon as its replacement or the console leaves the page.
  useEffect(() => {
    return () => {
      if (referenceUrl !== null) {
        URL.revokeObjectURL(referenceUrl);
      }
    };
  }, [referenceUrl]);

  // Accept only local PNG/JPEG files and retain neither file bytes nor a path after the review session.
  const handleReferenceSelection = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.currentTarget.files?.[0];
    if (file === undefined || !["image/jpeg", "image/png"].includes(file.type)) {
      setReferenceName("Choose a local PNG or JPEG");
      return;
    }
    setReferenceUrl(URL.createObjectURL(file));
    setReferenceName(file.name);
    setComparisonMode("overlay");
    event.currentTarget.value = "";
  };

  // Copy plain calibration data only; failure stays local and does not interrupt the visual experience.
  const copyCalibration = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(calibration, null, 2));
      setCopyStatus("Calibration copied");
    } catch {
      setCopyStatus("Copy unavailable");
    }
  };

  return (
    <>
      {referenceUrl !== null && comparisonMode !== "actual-only" ? (
        <div
          className={`calibration-reference calibration-reference--${comparisonMode}`}
          style={{ "--reference-opacity": referenceOpacity } as CSSProperties}
          aria-hidden="true"
        >
          <img alt="" src={referenceUrl} />
        </div>
      ) : null}

      <aside className="visual-calibration-console" aria-label="Visual calibration console">
        <button
          className="calibration-toggle"
          onClick={() => {
            setExpanded((current) => !current);
          }}
          type="button"
        >
          {expanded ? "Close visual calibration" : "Open visual calibration"}
        </button>

        {expanded ? (
          <div className="calibration-panel">
            <header>
              <strong>HF-01 visual calibration</strong>
              <span>Development only · memory only</span>
            </header>

            <fieldset className="calibration-group">
              <legend>Local reference</legend>
              <label className="calibration-file">
                Choose local PNG/JPEG
                <input
                  accept="image/jpeg,image/png"
                  onChange={handleReferenceSelection}
                  type="file"
                />
              </label>
              <small>{referenceName}</small>
              <label className="calibration-select">
                Comparison
                <select
                  onChange={(event) => {
                    setComparisonMode(event.currentTarget.value as ComparisonMode);
                  }}
                  value={comparisonMode}
                >
                  <option value="actual-only">Actual only</option>
                  <option value="overlay">Overlay</option>
                  <option value="side-by-side">Side by side</option>
                </select>
              </label>
              <NumericControl
                label="Reference opacity"
                max={1}
                min={0}
                onChange={setReferenceOpacity}
                step={0.01}
                value={referenceOpacity}
              />
            </fieldset>

            <fieldset className="calibration-group">
              <legend>Camera</legend>
              <VectorControls
                label="Position"
                max={12}
                min={-12}
                onChange={(position) => {
                  onCalibrationChange({
                    ...calibration,
                    camera: { ...calibration.camera, position },
                  });
                }}
                value={calibration.camera.position}
              />
              <VectorControls
                label="Target"
                max={8}
                min={-8}
                onChange={(target) => {
                  onCalibrationChange({
                    ...calibration,
                    camera: { ...calibration.camera, target },
                  });
                }}
                value={calibration.camera.target}
              />
              <NumericControl
                label="Field of view"
                max={80}
                min={25}
                onChange={(fov) => {
                  onCalibrationChange({
                    ...calibration,
                    camera: { ...calibration.camera, fov },
                  });
                }}
                step={0.5}
                value={calibration.camera.fov}
              />
            </fieldset>

            <TransformControls
              label="Room root"
              onChange={(room) => {
                onCalibrationChange({ ...calibration, room });
              }}
              value={calibration.room}
            />

            <fieldset className="calibration-group">
              <legend>Lighting</legend>
              <NumericControl
                label="Exposure"
                max={3}
                min={0.4}
                onChange={(exposure) => {
                  onCalibrationChange({
                    ...calibration,
                    lighting: { ...calibration.lighting, exposure },
                  });
                }}
                step={0.01}
                value={calibration.lighting.exposure}
              />
              <NumericControl
                label="Warm key intensity"
                max={10}
                min={0}
                onChange={(intensity) => {
                  onCalibrationChange({
                    ...calibration,
                    lighting: {
                      ...calibration.lighting,
                      warmKey: { ...calibration.lighting.warmKey, intensity },
                    },
                  });
                }}
                step={0.05}
                value={calibration.lighting.warmKey.intensity}
              />
              <VectorControls
                label="Warm key position"
                max={8}
                min={-8}
                onChange={(position) => {
                  onCalibrationChange({
                    ...calibration,
                    lighting: {
                      ...calibration.lighting,
                      warmKey: { ...calibration.lighting.warmKey, position },
                    },
                  });
                }}
                value={calibration.lighting.warmKey.position}
              />
              <NumericControl
                label="Fill intensity"
                max={3}
                min={0}
                onChange={(intensity) => {
                  onCalibrationChange({
                    ...calibration,
                    lighting: {
                      ...calibration.lighting,
                      fill: { ...calibration.lighting.fill, intensity },
                    },
                  });
                }}
                step={0.01}
                value={calibration.lighting.fill.intensity}
              />
              <label className="calibration-color">
                Fill color
                <input
                  onChange={(event) => {
                    onCalibrationChange({
                      ...calibration,
                      lighting: {
                        ...calibration.lighting,
                        fill: { ...calibration.lighting.fill, color: event.currentTarget.value },
                      },
                    });
                  }}
                  type="color"
                  value={calibration.lighting.fill.color}
                />
              </label>
              <NumericControl
                label="Exterior key intensity"
                max={3}
                min={0}
                onChange={(intensity) => {
                  onCalibrationChange({
                    ...calibration,
                    lighting: {
                      ...calibration.lighting,
                      exteriorKey: { ...calibration.lighting.exteriorKey, intensity },
                    },
                  });
                }}
                step={0.01}
                value={calibration.lighting.exteriorKey.intensity}
              />
              <label className="calibration-color">
                Exterior key color
                <input
                  onChange={(event) => {
                    onCalibrationChange({
                      ...calibration,
                      lighting: {
                        ...calibration.lighting,
                        exteriorKey: {
                          ...calibration.lighting.exteriorKey,
                          color: event.currentTarget.value,
                        },
                      },
                    });
                  }}
                  type="color"
                  value={calibration.lighting.exteriorKey.color}
                />
              </label>
            </fieldset>

            <TransformControls
              label="Table"
              onChange={(table) => {
                onCalibrationChange({ ...calibration, table });
              }}
              value={calibration.table}
            />
            <TransformControls
              label="Bible"
              onChange={(bible) => {
                onCalibrationChange({ ...calibration, bible });
              }}
              value={calibration.bible}
            />
            <TransformControls
              label="Left candle"
              onChange={(candleLeft) => {
                onCalibrationChange({ ...calibration, candleLeft });
              }}
              value={calibration.candleLeft}
            />
            <TransformControls
              label="Right candle"
              onChange={(candleRight) => {
                onCalibrationChange({ ...calibration, candleRight });
              }}
              value={calibration.candleRight}
            />

            <div className="calibration-actions">
              <button onClick={() => void copyCalibration()} type="button">
                {copyStatus}
              </button>
              <button
                onClick={() => {
                  onCalibrationChange(createDefaultVisualCalibration());
                }}
                type="button"
              >
                Reset Calibration
              </button>
            </div>
          </div>
        ) : null}
      </aside>
    </>
  );
}
