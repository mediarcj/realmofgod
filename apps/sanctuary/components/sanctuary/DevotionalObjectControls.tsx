// File: apps/sanctuary/components/sanctuary/DevotionalObjectControls.tsx
// Description: Restricts development transform controls to the three devotional roots.
// Purpose: Supports local owner calibration without changing Blender or GLB transforms.
// Notes: Only Move and uniform Scale are exposed.
"use client";
import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Object3D, PerspectiveCamera, Vector3 } from "three";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import type { DevotionalCalibrationKey } from "../../lib/sanctuary/camera-calibration";
import type { CameraCalibrationMode } from "./CameraCalibrationControls";

export type ObjectCalibrationState = { sourceName: string; position: [number, number, number]; scale: [number, number, number]; originalPosition: [number, number, number]; originalScale: [number, number, number] };
export type ObjectCalibrationCommand = { id: number; type: "patch" | "reset" | "load" | "reset-all" | "load-all"; key?: DevotionalCalibrationKey; position?: [number, number, number]; scale?: [number, number, number]; values?: Partial<Record<DevotionalCalibrationKey, { position: [number, number, number]; scale: [number, number, number] }>> };
const tuple = (v: Vector3): [number, number, number] => [v.x, v.y, v.z];

export function DevotionalObjectControls({ objects, selected, mode, command, onState, onDragging }: { objects: Partial<Record<DevotionalCalibrationKey, Object3D>>; selected: DevotionalCalibrationKey; mode: CameraCalibrationMode; command: ObjectCalibrationCommand | null; onState: (key: DevotionalCalibrationKey, state: ObjectCalibrationState) => void; onDragging: (active: boolean) => void }) {
  const { camera, gl, scene, invalidate } = useThree(); const control = useRef<TransformControls | null>(null); const originals = useRef(new Map<DevotionalCalibrationKey, { position: Vector3; scale: Vector3 }>()); const last = useRef(0); const scalingBase = useRef<Vector3 | null>(null);
  const emit = (key: DevotionalCalibrationKey, object: Object3D) => { const original = originals.current.get(key); if (original) onState(key, { sourceName: object.name, position: tuple(object.position), scale: tuple(object.scale), originalPosition: tuple(original.position), originalScale: tuple(original.scale) }); invalidate(); };
  useEffect(() => { Object.entries(objects).forEach(([key, object]) => { if (object && !originals.current.has(key as DevotionalCalibrationKey)) originals.current.set(key as DevotionalCalibrationKey, { position: object.position.clone(), scale: object.scale.clone() }); }); }, [objects]);
  useEffect(() => { if (!(camera instanceof PerspectiveCamera) || !(mode === "move" || mode === "scale")) return; const object = objects[selected]; if (!object) return; const gizmo = new TransformControls(camera, gl.domElement); const helper = gizmo.getHelper(); gizmo.setMode(mode === "move" ? "translate" : "scale"); gizmo.attach(object); scene.add(helper); control.current = gizmo;
    const dragging = (event: { value: unknown }) => { const active = event.value === true; onDragging(active); if (active) scalingBase.current = object.scale.clone(); };
    const changed = () => { if (mode === "scale" && scalingBase.current) { const base = scalingBase.current; const ratios = [object.scale.x / base.x, object.scale.y / base.y, object.scale.z / base.z]; const multiplier = ratios.reduce((best, value) => Math.abs(value - 1) > Math.abs(best - 1) ? value : best, 1); object.scale.copy(base).multiplyScalar(multiplier); } emit(selected, object); };
    gizmo.addEventListener("dragging-changed", dragging); gizmo.addEventListener("objectChange", changed); emit(selected, object);
    return () => { gizmo.removeEventListener("dragging-changed", dragging); gizmo.removeEventListener("objectChange", changed); onDragging(false); gizmo.detach(); scene.remove(helper); gizmo.dispose(); control.current = null; };
  }, [camera, gl, invalidate, mode, objects, onDragging, onState, scene, selected]);
  useEffect(() => { if (!command || command.id === last.current) return; last.current = command.id; const apply = (key: DevotionalCalibrationKey, position?: [number, number, number], scale?: [number, number, number]) => { const object = objects[key]; const original = originals.current.get(key); if (!object || !original) return; object.position.set(...(position ?? original.position.toArray())); object.scale.set(...(scale ?? original.scale.toArray())); emit(key, object); };
    if (command.type === "reset-all" || command.type === "load-all") (Object.keys(objects) as DevotionalCalibrationKey[]).forEach((key) => { const value = command.values?.[key]; apply(key, command.type === "load-all" ? value?.position : undefined, command.type === "load-all" ? value?.scale : undefined); }); else if (command.key) apply(command.key, command.type === "load" || command.type === "patch" ? command.position : undefined, command.type === "load" || command.type === "patch" ? command.scale : undefined);
  }, [command, objects]);
  return null;
}
