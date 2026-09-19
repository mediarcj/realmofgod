// File: apps/sanctuary/lib/sanctuary/camera-calibration.ts
// Description: Defines local-only camera calibration records.
// Purpose: Keeps owner pose captures separate from the production camera contract.
// Notes: This module contains data validation only; it never changes a camera pose.

import type { SanctuaryView } from "./camera";

export const calibrationSlots = ["angle1", "angle2", "angle3", "angle4"] as const;
export type CalibrationSlot = (typeof calibrationSlots)[number];
export type CalibrationView = "entry" | "devotional" | "bible" | "prayer";
export type CalibrationVector = [number, number, number];

export type CalibrationViewOffset = {
  fullWidth: number;
  fullHeight: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
};

export type CalibrationPose = {
  position: CalibrationVector;
  target: CalibrationVector;
  up: CalibrationVector;
  rotationRadians: CalibrationVector;
  rotationDegrees: CalibrationVector;
  quaternion: [number, number, number, number];
  fov: number;
  near: number;
  far: number;
  aspect: number;
  viewport: [number, number];
  cameraType: string;
  viewOffset: CalibrationViewOffset | null;
};

export type CalibrationRecord = CalibrationPose & {
  slot: CalibrationSlot;
  view: CalibrationView;
  capturedAt: string;
};

export type CalibrationCommand =
  | { id: number; type: "load-coded"; view: CalibrationView }
  | { id: number; type: "load-saved"; record: CalibrationRecord }
  | { id: number; type: "patch"; patch: Partial<Pick<CalibrationPose, "position" | "target" | "fov">> };

export type CalibrationCommandDraft =
  | { type: "load-coded"; view: CalibrationView }
  | { type: "load-saved"; record: CalibrationRecord }
  | { type: "patch"; patch: Partial<Pick<CalibrationPose, "position" | "target" | "fov">> };

export type CalibrationFile = {
  version: 1;
  updatedAt: string | null;
  slots: Partial<Record<CalibrationSlot, CalibrationRecord>>;
};

export const emptyCalibrationFile = (): CalibrationFile => ({ version: 1, updatedAt: null, slots: {} });

export const calibrationViewForSlot: Record<CalibrationSlot, CalibrationView> = {
  angle1: "entry",
  angle2: "devotional",
  angle3: "bible",
  angle4: "prayer",
};

export const calibrationSlotLabels: Record<CalibrationSlot, string> = {
  angle1: "Angle 1 — Entry",
  angle2: "Angle 2 — Devotional",
  angle3: "Angle 3 — Bible",
  angle4: "Angle 4 — Prayer",
};

export function sanctuaryViewForCalibration(view: CalibrationView): SanctuaryView {
  return view === "devotional" ? "kneel" : view;
}

function isFiniteNumber(value: unknown): value is number { return typeof value === "number" && Number.isFinite(value); }
function isVector(value: unknown, length: number): value is number[] { return Array.isArray(value) && value.length === length && value.every(isFiniteNumber); }
function isViewOffset(value: unknown): value is CalibrationViewOffset | null {
  if (value === null) return true;
  if (!value || typeof value !== "object") return false;
  return ["fullWidth", "fullHeight", "offsetX", "offsetY", "width", "height"].every((key) => isFiniteNumber((value as Record<string, unknown>)[key]));
}

export function isCalibrationRecord(value: unknown): value is CalibrationRecord {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return calibrationSlots.includes(record.slot as CalibrationSlot)
    && ["entry", "devotional", "bible", "prayer"].includes(record.view as CalibrationView)
    && typeof record.capturedAt === "string"
    && isVector(record.position, 3)
    && isVector(record.target, 3)
    && isVector(record.up, 3)
    && isVector(record.rotationRadians, 3)
    && isVector(record.rotationDegrees, 3)
    && isVector(record.quaternion, 4)
    && ["fov", "near", "far", "aspect"].every((key) => isFiniteNumber(record[key]))
    && isVector(record.viewport, 2)
    && typeof record.cameraType === "string"
    && isViewOffset(record.viewOffset);
}

export function isCalibrationFile(value: unknown): value is CalibrationFile {
  if (!value || typeof value !== "object") return false;
  const file = value as Record<string, unknown>;
  if (file.version !== 1 || !(file.updatedAt === null || typeof file.updatedAt === "string") || !file.slots || typeof file.slots !== "object") return false;
  return Object.entries(file.slots as Record<string, unknown>).every(([slot, record]) => calibrationSlots.includes(slot as CalibrationSlot) && isCalibrationRecord(record));
}
