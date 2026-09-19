// File: apps/sanctuary/components/sanctuary/CameraCalibrationPanel.tsx
// Description: Compact development-only owner interface for camera pose calibration.
// Purpose: Exposes exact, copyable values from the active Three.js camera.
// Notes: The panel is never rendered unless ?calibrate=1 is present in development.

"use client";

import {
  calibrationSlotLabels,
  calibrationSlots,
  devotionalCalibrationKeys, devotionalCalibrationSources,
  type DevotionalCalibrationKey,
  type CalibrationFile,
  type CalibrationPose,
  type CalibrationSlot,
} from "../../lib/sanctuary/camera-calibration";
import type { CameraCalibrationMode } from "./CameraCalibrationControls";
import type { ObjectCalibrationState } from "./DevotionalObjectControls";

type VectorField = "position" | "target";

function number(value: number | undefined) { return Number.isFinite(value) ? (value as number).toFixed(6) : "—"; }
function vector(values: number[] | undefined) { return values?.map(number).join(", ") ?? "—"; }

function NumberInput({ label, value, onCommit }: { label: string; value: number | undefined; onCommit: (value: number) => void }) {
  return <label className="calibration-number"><span>{label}</span><input key={`${label}-${value}`} type="number" step="any" defaultValue={Number.isFinite(value) ? number(value) : ""} onBlur={(event) => {
    const next = Number(event.currentTarget.value);
    if (Number.isFinite(next)) onCommit(next);
  }} onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }} /></label>;
}

function VectorInputs({ label, value, onCommit }: { label: string; value: number[] | undefined; onCommit: (axis: number, value: number) => void }) {
  return <div className="calibration-vector"><span>{label}</span><div>{["X", "Y", "Z"].map((axis, index) => <NumberInput key={axis} label={axis} value={value?.[index]} onCommit={(next) => onCommit(index, next)} />)}</div></div>;
}

export function CameraCalibrationPanel({ collapsed, onCollapse, enabled, mode, file, pose, selectedSlot, status, storageMode, selectedObject, objectState, onToggle, onMode, onSlot, onObject, onLoadCoded, onCapture, onCopyPose, onCopyAll, onSave, onLoadSaved, onPatch, onObjectPatch, onObjectSave, onObjectLoad, onObjectReset, onObjectsLoad, onObjectsReset }: {
  collapsed: boolean; onCollapse: () => void;
  enabled: boolean;
  mode: CameraCalibrationMode;
  file: CalibrationFile;
  pose: CalibrationPose | null;
  selectedSlot: CalibrationSlot;
  status: string;
  storageMode: "project" | "browser" | null;
  selectedObject: DevotionalCalibrationKey; objectState: ObjectCalibrationState | null;
  onToggle: () => void;
  onMode: (mode: CameraCalibrationMode) => void;
  onSlot: (slot: CalibrationSlot) => void;
  onObject: (key: DevotionalCalibrationKey) => void;
  onLoadCoded: () => void;
  onCapture: () => void;
  onCopyPose: () => void;
  onCopyAll: () => void;
  onSave: () => void;
  onLoadSaved: () => void;
  onPatch: (field: VectorField | "fov", axis: number | null, value: number) => void;
  onObjectPatch: (field: "position" | "scale", axis: number | null, value: number) => void; onObjectSave: () => void; onObjectLoad: () => void; onObjectReset: () => void; onObjectsLoad: () => void; onObjectsReset: () => void;
}) {
  const saved = file.slots[selectedSlot];
  if (collapsed) return <button type="button" className="calibration-handle" aria-label="Expand camera calibration" onClick={onCollapse}>‹</button>;
  return <aside className="camera-calibration" aria-label="Camera calibration">
    <div className="calibration-heading"><strong>Camera Calibration</strong><span><button type="button" className={enabled ? "calibration-toggle is-on" : "calibration-toggle"} role="switch" aria-checked={enabled} onClick={onToggle}>{enabled ? "ON" : "OFF"}</button><button type="button" className="calibration-collapse" aria-label="Collapse camera calibration" onClick={onCollapse}>›</button></span></div>
    <p className="calibration-note">Development only. Calibration suspends the guided camera and uses the active Three.js camera directly.</p>
    <fieldset className="calibration-modes" disabled={!enabled}><legend>Tool mode</legend>{(["navigate", "lens", "move", "scale"] as const).map((choice) => <button key={choice} type="button" className={mode === choice ? "is-active" : ""} onClick={() => onMode(choice)}>{choice === "navigate" ? "Navigate" : choice === "lens" ? "Lens / Perspective" : choice === "move" ? "Move Object" : "Scale Object"}</button>)}</fieldset>
    <label className="calibration-slot"><span>Destination slot</span><select value={selectedSlot} onChange={(event) => onSlot(event.target.value as CalibrationSlot)}>{calibrationSlots.map((slot) => <option key={slot} value={slot}>{calibrationSlotLabels[slot]}</option>)}</select></label>
    <div className="calibration-actions">
      <button type="button" disabled={!enabled} onClick={onLoadCoded}>Load Current Coded View</button>
      <button type="button" disabled={!enabled || !pose} onClick={onCapture}>Capture Pose</button>
      <button type="button" disabled={!enabled || !pose} onClick={onCopyPose}>Copy Pose</button>
      <button type="button" disabled={!enabled || !pose} onClick={onSave}>Save {calibrationSlotLabels[selectedSlot].split(" —")[0]}</button>
      <button type="button" disabled={!enabled || !saved} onClick={onLoadSaved}>Load saved</button>
      <button type="button" disabled={!enabled} onClick={onCopyAll}>Copy all</button>
    </div>
    <div className="calibration-editable">
      <VectorInputs label="Position" value={pose?.position} onCommit={(axis, value) => onPatch("position", axis, value)} />
      <VectorInputs label="Target" value={pose?.target} onCommit={(axis, value) => onPatch("target", axis, value)} />
      <NumberInput label="FOV" value={pose?.fov} onCommit={(value) => onPatch("fov", null, value)} />
      <p className="calibration-lens">Focal length {number(pose?.focalLength)} mm · Film gauge {number(pose?.filmGauge)} mm</p>
    </div>
    <dl className="calibration-readout">
      <div><dt>Euler rad</dt><dd>{vector(pose?.rotationRadians)}</dd></div>
      <div><dt>Euler deg</dt><dd>{vector(pose?.rotationDegrees)}</dd></div>
      <div><dt>Quaternion</dt><dd>{vector(pose?.quaternion)}</dd></div>
      <div><dt>Up</dt><dd>{vector(pose?.up)}</dd></div>
      <div><dt>Near / far</dt><dd>{number(pose?.near)} / {number(pose?.far)}</dd></div>
      <div><dt>Aspect</dt><dd>{number(pose?.aspect)}</dd></div>
      <div><dt>Viewport</dt><dd>{pose ? `${pose.viewport[0]} × ${pose.viewport[1]}` : "—"}</dd></div>
      <div><dt>Camera</dt><dd>{pose?.cameraType ?? "—"}</dd></div>
      <div><dt>View offset</dt><dd>{pose?.viewOffset ? `${number(pose.viewOffset.offsetX)}, ${number(pose.viewOffset.offsetY)} / ${number(pose.viewOffset.width)} × ${number(pose.viewOffset.height)}` : "none"}</dd></div>
    </dl>
    <section className="calibration-object"><h2>Devotional Object</h2><label className="calibration-slot"><span>Selected object</span><select value={selectedObject} onChange={(event) => onObject(event.target.value as DevotionalCalibrationKey)}>{devotionalCalibrationKeys.map((key) => <option key={key} value={key}>{key === "kneelingRest" ? "Kneeling Rest" : key[0].toUpperCase() + key.slice(1)}</option>)}</select></label><p className="calibration-note">{devotionalCalibrationSources[selectedObject]}</p><VectorInputs label="Position" value={objectState?.position} onCommit={(axis, value) => onObjectPatch("position", axis, value)} /><NumberInput label="Uniform scale" value={objectState ? objectState.scale[0] / objectState.originalScale[0] : undefined} onCommit={(value) => onObjectPatch("scale", null, value)} /><p className="calibration-note">Scale {vector(objectState?.scale)} · original position {vector(objectState?.originalPosition)} · original scale {vector(objectState?.originalScale)}</p><div className="calibration-actions"><button disabled={!enabled} onClick={onObjectSave}>Save Selected Object</button><button disabled={!enabled || !file.objects?.[selectedObject]} onClick={onObjectLoad}>Load Saved Object</button><button disabled={!enabled} onClick={onObjectReset}>Reset Selected Object</button><button disabled={!enabled} onClick={onObjectsLoad}>Load All Saved Objects</button><button disabled={!enabled} onClick={onObjectsReset}>Reset All Devotional Objects</button></div></section>
    <p className={storageMode === "browser" ? "calibration-status warning" : "calibration-status"} role="status">{status}</p>
    {saved && <p className="calibration-saved">{selectedSlot} saved {new Date(saved.capturedAt).toLocaleString()}</p>}
  </aside>;
}
