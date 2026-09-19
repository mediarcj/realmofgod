// File: apps/sanctuary/components/sanctuary/DevotionalObjectControls.tsx
// Description: Restricts development transform controls to the three devotional roots.
// Purpose: Supports local owner calibration without changing Blender or GLB transforms.
// Notes: Move and independent X/Y/Z scale calibration are exposed locally.
"use client";
import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { BoxHelper, Object3D, PerspectiveCamera, Vector3 } from "three";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import type { DevotionalCalibrationKey } from "../../lib/sanctuary/camera-calibration";
import type { CameraCalibrationMode } from "./CameraCalibrationControls";

export type ObjectCalibrationState = { sourceName: string; position: [number, number, number]; scale: [number, number, number]; originalPosition: [number, number, number]; originalScale: [number, number, number] };
export type ObjectCalibrationCommand = { id: number; type: "patch" | "reset" | "load" | "reset-all" | "load-all"; key?: DevotionalCalibrationKey; position?: [number, number, number]; scale?: [number, number, number]; values?: Partial<Record<DevotionalCalibrationKey, { position: [number, number, number]; scale: [number, number, number] }>> };
const tuple = (v: Vector3): [number, number, number] => [v.x, v.y, v.z];

export function DevotionalObjectControls({ objects, selected, mode, command, onState, onDragging }: { objects: Partial<Record<DevotionalCalibrationKey, Object3D>>; selected: DevotionalCalibrationKey; mode: CameraCalibrationMode; command: ObjectCalibrationCommand | null; onState: (key: DevotionalCalibrationKey, state: ObjectCalibrationState) => void; onDragging: (active: boolean) => void }) {
  const { camera, gl, scene, invalidate } = useThree(); const control = useRef<TransformControls | null>(null); const originals = useRef(new Map<DevotionalCalibrationKey, { position: Vector3; scale: Vector3 }>()); const last = useRef(0); const latest = useRef<{ key: DevotionalCalibrationKey; state: ObjectCalibrationState } | null>(null); const lastPanelUpdate = useRef(0); const pending = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emit = (key: DevotionalCalibrationKey, object: Object3D, exact = false) => { const original = originals.current.get(key); if (!original) return; latest.current = { key, state: { sourceName: object.name, position: tuple(object.position), scale: tuple(object.scale), originalPosition: tuple(original.position), originalScale: tuple(original.scale) } }; invalidate(); const now = performance.now(); if (exact || now - lastPanelUpdate.current >= 100) { lastPanelUpdate.current = now; onState(key, latest.current.state); } else if (!pending.current) pending.current = setTimeout(() => { pending.current = null; lastPanelUpdate.current = performance.now(); if (latest.current) onState(latest.current.key, latest.current.state); }, 100); };
  useEffect(() => { Object.entries(objects).forEach(([key, object]) => { if (object && !originals.current.has(key as DevotionalCalibrationKey)) originals.current.set(key as DevotionalCalibrationKey, { position: object.position.clone(), scale: object.scale.clone() }); }); }, [objects]);
  useEffect(() => { const object = objects[selected]; if (!object || !(mode === "move" || mode === "scale")) return; const outline = new BoxHelper(object, 0xf4d691); scene.add(outline); const refresh = () => { outline.setFromObject(object); invalidate(); }; refresh(); return () => { scene.remove(outline); } }, [invalidate, mode, objects, scene, selected]);
  useEffect(() => { if (!(camera instanceof PerspectiveCamera) || mode !== "move") return; const object = objects[selected]; if (!object) return; const gizmo = new TransformControls(camera, gl.domElement); const helper = gizmo.getHelper(); gizmo.setMode("translate"); gizmo.attach(object); scene.add(helper); control.current = gizmo;
    const dragging = (event: { value: unknown }) => { const active = event.value === true; onDragging(active); if (!active) emit(selected, object, true); };
    const changed = () => emit(selected, object); gizmo.addEventListener("dragging-changed", dragging); gizmo.addEventListener("objectChange", changed); emit(selected, object, true);
    return () => { gizmo.removeEventListener("dragging-changed", dragging); gizmo.removeEventListener("objectChange", changed); onDragging(false); gizmo.detach(); scene.remove(helper); gizmo.dispose(); control.current = null; if (pending.current) clearTimeout(pending.current); };
  }, [camera, gl, invalidate, mode, objects, onDragging, onState, scene, selected]);
  useEffect(() => { if (!command || command.id === last.current) return; last.current = command.id; const apply = (key: DevotionalCalibrationKey, position?: [number, number, number], scale?: [number, number, number]) => { const object = objects[key]; const original = originals.current.get(key); if (!object || !original) return; object.position.set(...(position ?? original.position.toArray())); object.scale.set(...(scale ?? original.scale.toArray())); emit(key, object); };
    if (command.type === "reset-all" || command.type === "load-all") (Object.keys(objects) as DevotionalCalibrationKey[]).forEach((key) => { const value = command.values?.[key]; apply(key, command.type === "load-all" ? value?.position : undefined, command.type === "load-all" ? value?.scale : undefined); }); else if (command.key) apply(command.key, command.type === "load" || command.type === "patch" ? command.position : undefined, command.type === "load" || command.type === "patch" ? command.scale : undefined);
  }, [command, objects]);
  return null;
}
