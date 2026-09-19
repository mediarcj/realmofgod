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

export function CameraCalibrationPanel({ collapsed, onCollapse, enabled, mode, file, pose, selectedSlot, status, storageMode, selectedObject, objectState, onToggle, onMode, onSlot, onObject, onLoadCoded, onCapture, onCopyPose, onCopyAll, onSave, onLoadSaved, onPatch, onLevelCamera, onObjectPatch, onObjectSave, onObjectLoad, onObjectReset, onObjectsLoad, onObjectsReset }: {
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
  onLevelCamera: () => void;
  onObjectPatch: (field: "position" | "scale", axis: number | null, value: number) => void; onObjectSave: () => void; onObjectLoad: () => void; onObjectReset: () => void; onObjectsLoad: () => void; onObjectsReset: () => void;
}) {
  const saved = file.slots[selectedSlot];
  const selectedLabel = selectedObject === "kneelingRest" ? "KNEELING REST" : selectedObject.toUpperCase();
  const active = mode === "navigate" ? "ACTIVE: NAVIGATE" : mode === "lens" ? "ACTIVE: PERSPECTIVE" : mode === "move" ? `ACTIVE: MOVE ${selectedLabel}` : `ACTIVE: RESIZE ${selectedLabel}`;
  if (collapsed) return <button type="button" className="calibration-handle" aria-label="Expand camera calibration" onClick={onCollapse}>‹</button>;
  return <aside className="camera-calibration" data-mode={mode} aria-label="Camera calibration">
    <div className="calibration-heading"><strong>Camera Calibration</strong><span><button type="button" className={enabled ? "calibration-toggle is-on" : "calibration-toggle"} role="switch" aria-checked={enabled} onClick={onToggle}>{enabled ? "ON" : "OFF"}</button><button type="button" className="calibration-collapse" aria-label="Collapse camera calibration" onClick={onCollapse}>›</button></span></div>
    <p className="calibration-note">Development only. Calibration suspends the guided camera and uses the active Three.js camera directly.</p>
    <fieldset className="calibration-modes" disabled={!enabled}><legend>Tool mode</legend>{(["navigate", "lens", "move", "scale"] as const).map((choice) => <button key={choice} type="button" className={mode === choice ? "is-active" : ""} onClick={() => onMode(choice)}>{choice === "navigate" ? "Navigate" : choice === "lens" ? "Lens / Perspective" : choice === "move" ? "Move Object" : "Scale Object"}</button>)}</fieldset>
    <p className="calibration-active">{active}</p>
    {mode === "navigate" && <section className="calibration-context"><strong>NAVIGATE CAMERA</strong><p>Left drag: Look around<br />Right drag: Move sideways/up/down<br />Two-finger scroll: Move forward/backward</p><p>Camera roll: {number(pose?.rotationDegrees?.[2])}° <button type="button" onClick={onLevelCamera}>LEVEL CAMERA</button></p></section>}
    {mode === "lens" && <section className="calibration-context"><strong>PERSPECTIVE</strong><p>Two-finger scroll adjusts lens depth only.<br />Lower FOV: flatter perspective<br />Higher FOV: stronger/wider perspective</p><label className="calibration-slider"><span>FLATTER</span><input type="range" min="20" max="100" step="0.1" value={pose?.fov ?? 55} onChange={(event) => onPatch("fov", null, Number(event.currentTarget.value))} /><span>WIDER</span></label><p>FOV: {number(pose?.fov)}° · Lens: {number(pose?.focalLength)} mm</p></section>}
    {(mode === "navigate" || mode === "lens") && <section className="calibration-camera-main"><label className="calibration-slot"><span>Destination slot</span><select value={selectedSlot} onChange={(event) => onSlot(event.target.value as CalibrationSlot)}>{calibrationSlots.map((slot) => <option key={slot} value={slot}>{calibrationSlotLabels[slot]}</option>)}</select></label><div className="calibration-actions">
      <button type="button" disabled={!enabled} onClick={onLoadCoded}>Load Current Coded View</button>
      <button type="button" disabled={!enabled || !pose} onClick={onCapture}>Capture Pose</button>
      <button type="button" disabled={!enabled || !pose} onClick={onCopyPose}>Copy Pose</button>
      <button type="button" disabled={!enabled || !pose} onClick={onSave}>SAVE {calibrationSlotLabels[selectedSlot].split(" —")[0].toUpperCase()}</button>
      <button type="button" disabled={!enabled || !saved} onClick={onLoadSaved}>LOAD {calibrationSlotLabels[selectedSlot].split(" —")[0].toUpperCase()}</button>
      <button type="button" disabled={!enabled} onClick={onCopyAll}>Copy all</button>
    </div></section>}
    <div className="calibration-editable">
      <VectorInputs label="Position" value={pose?.position} onCommit={(axis, value) => onPatch("position", axis, value)} />
      <VectorInputs label="Target" value={pose?.target} onCommit={(axis, value) => onPatch("target", axis, value)} />
      <NumberInput label="FOV" value={pose?.fov} onCommit={(value) => onPatch("fov", null, value)} />
      <p className="calibration-lens">Focal length {number(pose?.focalLength)} mm · Film gauge {number(pose?.filmGauge)} mm</p>
    </div>
    <details className="calibration-advanced"><summary>Advanced Camera Data</summary><dl className="calibration-readout">
      <div><dt>Euler rad</dt><dd>{vector(pose?.rotationRadians)}</dd></div>
      <div><dt>Euler deg</dt><dd>{vector(pose?.rotationDegrees)}</dd></div>
      <div><dt>Quaternion</dt><dd>{vector(pose?.quaternion)}</dd></div>
      <div><dt>Up</dt><dd>{vector(pose?.up)}</dd></div>
      <div><dt>Near / far</dt><dd>{number(pose?.near)} / {number(pose?.far)}</dd></div>
      <div><dt>Aspect</dt><dd>{number(pose?.aspect)}</dd></div>
      <div><dt>Viewport</dt><dd>{pose ? `${pose.viewport[0]} × ${pose.viewport[1]}` : "—"}</dd></div>
      <div><dt>Camera</dt><dd>{pose?.cameraType ?? "—"}</dd></div>
      <div><dt>View offset</dt><dd>{pose?.viewOffset ? `${number(pose.viewOffset.offsetX)}, ${number(pose.viewOffset.offsetY)} / ${number(pose.viewOffset.width)} × ${number(pose.viewOffset.height)}` : "none"}</dd></div>
    </dl></details>
    {(mode === "move" || mode === "scale") && <section className="calibration-object"><div className="calibration-object-buttons">{devotionalCalibrationKeys.map((key) => <button key={key} className={key === selectedObject ? "is-active" : ""} onClick={() => onObject(key)}>{key === "kneelingRest" ? "KNEELING REST" : key.toUpperCase()}</button>)}</div><p className="calibration-note">{devotionalCalibrationSources[selectedObject]}</p>{mode === "move" ? <><strong>MOVE: {selectedLabel}</strong><p className="calibration-note">Drag the colored arrows: Red = X · Green = Y · Blue = Z</p><div className="calibration-nudges">{[0,1,2].map((axis) => <span key={axis}><button onClick={() => onObjectPatch("position", axis, (objectState?.position[axis] ?? 0) - .01)}>{["X","Y","Z"][axis]} −</button><button onClick={() => onObjectPatch("position", axis, (objectState?.position[axis] ?? 0) + .01)}>{["X","Y","Z"][axis]} +</button></span>)}</div><VectorInputs label="Position" value={objectState?.position} onCommit={(axis, value) => onObjectPatch("position", axis, value)} /></> : <><strong>RESIZE: {selectedLabel}</strong><p className="calibration-note">Set X, Y, and Z independently below. The slider keeps proportions and changes all three together.</p><label className="calibration-slider"><span>50%</span><input type="range" min="50" max="200" step="1" value={objectState ? objectState.scale[0] / objectState.originalScale[0] * 100 : 100} onChange={(event) => onObjectPatch("scale", null, Number(event.currentTarget.value) / 100)} /><span>200%</span></label><p>Uniform size: {objectState ? number(objectState.scale[0] / objectState.originalScale[0] * 100) : "100"}%</p><VectorInputs label="Scale" value={objectState?.scale} onCommit={(axis, value) => onObjectPatch("scale", axis, value)} /></>}<div className="calibration-actions"><button disabled={!enabled} onClick={onObjectSave}>SAVE {selectedLabel}</button><button disabled={!enabled || !file.objects?.[selectedObject]} onClick={onObjectLoad}>LOAD SAVED</button><button disabled={!enabled} onClick={onObjectReset}>RESET TO BLENDER</button><button disabled={!enabled} onClick={onObjectsLoad}>LOAD ALL</button><button disabled={!enabled} onClick={onObjectsReset}>RESET ALL</button></div></section>}
    <p className={storageMode === "browser" ? "calibration-status warning" : "calibration-status"} role="status">{status}</p>
    {saved && <p className="calibration-saved">{selectedSlot} saved {new Date(saved.capturedAt).toLocaleString()}</p>}
  </aside>;
}
