// File: apps/sanctuary/components/sanctuary/SanctuaryExperience.tsx
// Description: Loads the sanctuary renderer and contains render failures.
// Purpose: Keeps a readable page available while WebGL starts or fails.
// Notes: The renderer is loaded only in the browser.
"use client";

import dynamic from "next/dynamic";
import { Component, useCallback, useEffect, useReducer, useState, type ReactNode } from "react";
import { sanctuaryUnits } from "../../lib/sanctuary/asset-manifest";
import { devotionalLabels, eligibleObjects, initialJourney, journeyTransition } from "../../lib/sanctuary/journey";
import {
  calibrationViewForSlot,
  emptyCalibrationFile,
  type CalibrationCommand,
  type CalibrationCommandDraft,
  type CalibrationFile,
  type CalibrationPose,
  type CalibrationSlot,
  devotionalCalibrationSources,
  type DevotionalCalibrationKey,
} from "../../lib/sanctuary/camera-calibration";
import { ScripturePanel } from "./ScripturePanel";
import { PrayerPanel } from "./PrayerPanel";
import { HomeControl } from "./HomeControl";
import { CameraCalibrationPanel } from "./CameraCalibrationPanel";
import type { CameraCalibrationMode } from "./CameraCalibrationControls";
import type { ObjectCalibrationCommand, ObjectCalibrationState } from "./DevotionalObjectControls";

const SanctuaryCanvas = dynamic(() => import("./SanctuaryCanvas"), {
  ssr: false,
  loading: () => null,
});

class RenderBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <div className="scene-message" role="alert">
      <p>The sanctuary view could not load.</p>
      <button onClick={() => window.location.reload()}>Try again</button>
    </div>;
    return this.props.children;
  }
}

export function SanctuaryExperience() {
  const [journey, dispatch] = useReducer(journeyTransition, initialJourney);
  const [calibrationAvailable, setCalibrationAvailable] = useState(false);
  const [calibrationEnabled, setCalibrationEnabled] = useState(false);
  const [calibrationMode, setCalibrationMode] = useState<CameraCalibrationMode>("navigate");
  const [calibrationCollapsed, setCalibrationCollapsed] = useState(false);
  const [selectedObject, setSelectedObject] = useState<DevotionalCalibrationKey>("table");
  const [objectStates, setObjectStates] = useState<Partial<Record<DevotionalCalibrationKey, ObjectCalibrationState>>>({});
  const [objectCommand, setObjectCommand] = useState<ObjectCalibrationCommand | null>(null);
  const [calibrationFile, setCalibrationFile] = useState<CalibrationFile>(emptyCalibrationFile);
  const [cameraPose, setCameraPose] = useState<CalibrationPose | null>(null);
  const [calibrationCommand, setCalibrationCommand] = useState<CalibrationCommand | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<CalibrationSlot>("angle1");
  const [calibrationStatus, setCalibrationStatus] = useState("No local calibration saved.");
  const [storageMode, setStorageMode] = useState<"project" | "browser" | null>(null);
  const onObjectState = useCallback((key: DevotionalCalibrationKey, state: ObjectCalibrationState) => setObjectStates((current) => ({ ...current, [key]: state })), []);
  const issueCommand = useCallback((command: CalibrationCommandDraft) => setCalibrationCommand({ ...command, id: Date.now() }), []);
  const onActivate = useCallback((object: string) => { if (!calibrationEnabled) dispatch({ type: "activate", object }); }, [calibrationEnabled]);
  const onSettled = useCallback((revision: number) => dispatch({ type: "settled", revision }), []);
  const onPray = useCallback(() => { if (!calibrationEnabled) dispatch({ type: "pray" }); }, [calibrationEnabled]);
  const onReturn = useCallback(() => { if (!calibrationEnabled) dispatch({ type: "home" }); }, [calibrationEnabled]);
  const [loaded, setLoaded] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(true);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update(); query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (process.env.NODE_ENV === "production" || new URLSearchParams(window.location.search).get("calibrate") !== "1") return;
    setCalibrationAvailable(true);
    const localKey = "realm-of-god-camera-calibration";
    fetch("/api/camera-calibration", { cache: "no-store" }).then(async (response) => {
      if (!response.ok) throw new Error("Local API unavailable");
      return response.json() as Promise<CalibrationFile>;
    }).then((file) => {
      setCalibrationFile(file); setStorageMode("project");
      if (file.updatedAt) setCalibrationStatus(`Local project file loaded: ${new Date(file.updatedAt).toLocaleString()}`);
    }).catch(() => {
      try {
        const stored = window.localStorage.getItem(localKey);
        if (stored) setCalibrationFile(JSON.parse(stored) as CalibrationFile);
      } catch { /* The panel remains usable without persistence. */ }
      setStorageMode("browser"); setCalibrationStatus("Project file unavailable. Browser-only fallback is active; copy a backup before closing.");
    });
  }, []);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!calibrationEnabled && event.key === "Escape" && (journey.view === "bible" || journey.view === "prayer")) onReturn();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [calibrationEnabled, journey.view, onReturn]);
  const ready = loaded === sanctuaryUnits.length;
  const persistCalibration = useCallback(async (next: CalibrationFile) => {
    const localKey = "realm-of-god-camera-calibration";
    try {
      const response = await fetch("/api/camera-calibration", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(next) });
      if (!response.ok) throw new Error("Local API unavailable");
      const saved = await response.json() as CalibrationFile;
      setCalibrationFile(saved); setStorageMode("project"); setCalibrationStatus(`Saved locally: ${new Date(saved.updatedAt ?? Date.now()).toLocaleString()}`);
    } catch {
      window.localStorage.setItem(localKey, JSON.stringify(next));
      setCalibrationFile(next); setStorageMode("browser"); setCalibrationStatus("Saved only in browser storage. Copy a backup before closing.");
    }
  }, []);
  const copy = useCallback(async (value: unknown, message: string) => {
    try { await navigator.clipboard.writeText(JSON.stringify(value, null, 2)); setCalibrationStatus(message); }
    catch { setCalibrationStatus("Clipboard unavailable. Select values from the panel and copy manually."); }
  }, []);
  const saveCalibration = useCallback(() => {
    if (!cameraPose) return;
    const now = new Date().toISOString();
    const record = { ...cameraPose, slot: selectedSlot, view: calibrationViewForSlot[selectedSlot], capturedAt: now };
    void persistCalibration({ version: 1, updatedAt: now, slots: { ...calibrationFile.slots, [selectedSlot]: record } });
  }, [calibrationFile.slots, cameraPose, persistCalibration, selectedSlot]);
  const patchCamera = useCallback((field: "position" | "target" | "fov", axis: number | null, value: number) => {
    if (!cameraPose) return;
    if (field === "fov") issueCommand({ type: "patch", patch: { fov: value } });
    else {
      const next = [...cameraPose[field]] as [number, number, number];
      if (axis !== null) next[axis] = value;
      issueCommand({ type: "patch", patch: { [field]: next } });
    }
  }, [cameraPose, issueCommand]);
  const issueObject = useCallback((command: Omit<ObjectCalibrationCommand, "id">) => setObjectCommand({ ...command, id: Date.now() }), []);
  const patchObject = useCallback((field: "position" | "scale", axis: number | null, value: number) => { const current = objectStates[selectedObject]; if (!current) return; if (field === "scale" && axis === null) issueObject({ type: "patch", key: selectedObject, position: current.position, scale: current.originalScale.map((base) => base * value) as [number, number, number] }); else { const next = [...current.position] as [number, number, number]; if (axis !== null) next[axis] = value; issueObject({ type: "patch", key: selectedObject, position: next, scale: current.scale }); } }, [issueObject, objectStates, selectedObject]);
  const saveObject = useCallback(() => { const state = objectStates[selectedObject]; if (!state) return; const now = new Date().toISOString(); void persistCalibration({ ...calibrationFile, updatedAt: now, objects: { ...calibrationFile.objects, [selectedObject]: { sourceName: devotionalCalibrationSources[selectedObject], position: state.position, scale: state.scale, savedAt: now } } }); }, [calibrationFile, objectStates, persistCalibration, selectedObject]);
  return <>
    <div className="scene-frame" data-view={journey.view} data-moving={journey.moving}><RenderBoundary><SanctuaryCanvas view={journey.view} reducedMotion={reducedMotion} onProgress={setLoaded} revision={journey.revision} onSettled={onSettled} interactive={ready && !journey.moving && !calibrationEnabled} onActivate={onActivate} calibrationEnabled={calibrationEnabled} calibrationMode={calibrationMode} calibrationCommand={calibrationCommand} onCameraState={setCameraPose} selectedObject={selectedObject} objectCommand={objectCommand} onObjectState={onObjectState} /></RenderBoundary></div>
    <HomeControl onReturn={onReturn} />
    {!calibrationEnabled && !journey.moving && <nav className="visually-hidden" aria-label="Devotional interactions">
      {eligibleObjects(journey.view).map((object) => <button key={object} type="button" onClick={() => onActivate(object)}>{devotionalLabels[object]}</button>)}
    </nav>}
    {!ready && <div className="loading-mark" role="progressbar" aria-label="Loading sanctuary" aria-valuemin={0} aria-valuemax={sanctuaryUnits.length} aria-valuenow={loaded}><span style={{ transform: `scaleX(${loaded / sanctuaryUnits.length})` }} /></div>}
    {!calibrationEnabled && journey.view === "bible" && !journey.moving && <ScripturePanel onPray={onPray} />}
    {!calibrationEnabled && journey.view === "prayer" && !journey.moving && <PrayerPanel />}
    {calibrationAvailable && <CameraCalibrationPanel collapsed={calibrationCollapsed} onCollapse={() => setCalibrationCollapsed((value) => !value)} enabled={calibrationEnabled} mode={calibrationMode} file={calibrationFile} pose={cameraPose} selectedSlot={selectedSlot} selectedObject={selectedObject} objectState={objectStates[selectedObject] ?? null} status={calibrationStatus} storageMode={storageMode} onToggle={() => setCalibrationEnabled((current) => !current)} onMode={setCalibrationMode} onSlot={setSelectedSlot} onObject={setSelectedObject} onLoadCoded={() => issueCommand({ type: "load-coded", view: calibrationViewForSlot[selectedSlot] })} onCapture={() => setCalibrationStatus("Pose captured. Save this slot when ready.")} onCopyPose={() => { if (cameraPose) void copy({ ...cameraPose, slot: selectedSlot, view: calibrationViewForSlot[selectedSlot] }, "Current pose copied."); }} onCopyAll={() => void copy(calibrationFile, "All calibration slots copied.")} onSave={saveCalibration} onLoadSaved={() => { const record = calibrationFile.slots[selectedSlot]; if (record) issueCommand({ type: "load-saved", record }); }} onPatch={patchCamera} onLevelCamera={() => issueCommand({ type: "patch", patch: { up: [0, 1, 0] } })} onObjectPatch={patchObject} onObjectSave={saveObject} onObjectLoad={() => { const value = calibrationFile.objects?.[selectedObject]; if (value) issueObject({ type: "load", key: selectedObject, position: value.position, scale: value.scale }); }} onObjectReset={() => issueObject({ type: "reset", key: selectedObject })} onObjectsLoad={() => issueObject({ type: "load-all", values: calibrationFile.objects })} onObjectsReset={() => issueObject({ type: "reset-all" })} />}
    <p className="visually-hidden" role="status">{ready ? "The sanctuary is ready." : "The sanctuary is loading."}</p>
  </>;
}
