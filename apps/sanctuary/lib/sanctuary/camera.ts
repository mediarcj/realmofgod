// File: apps/sanctuary/lib/sanctuary/camera.ts
// Description: Defines the sanctuary's bounded, guided camera views.
// Purpose: Frames the source objects without free-roam or geometry changes.
// Notes: Owner-locked desktop endpoints use saved local calibration poses; geometry remains safety-only.

export type SanctuaryView = "entry" | "kneel" | "bible" | "prayer";
export function cameraDuration(reducedMotion: boolean) { return reducedMotion ? 0 : 1.6; }
type Point3 = [number, number, number];
export type CameraPose = { position: Point3; target: Point3; up: Point3; fov: number; near: number; far: number; offset: [number, number] };

// OWNER CAMERA DESKTOP LOCK: Angle 1 / Entry, promoted verbatim from the
// Git-ignored local calibration record. Do not derive or refit this endpoint.
const OWNER_ENTRY_DESKTOP: CameraPose = {
  position: [-0.11269881499354367, 3.3045042935398734, 9.063174840923534],
  target: [0.05896333736516662, 2.1607696616746113, -3.3778820839605586],
  up: [0, 1, 0],
  fov: 43.1,
  near: 0.05,
  far: 60,
  offset: [0, 0],
};

// OWNER CAMERA DESKTOP LOCK: Angle 2 / Devotional, promoted verbatim from the
// Git-ignored local calibration record. Do not derive or refit this endpoint.
const OWNER_DEVOTIONAL_DESKTOP: CameraPose = {
  position: [-0.09284529296935504, 3.0203792982467257, 3.1079608535465595],
  target: [-0.05345574122261582, 2.91259250941797, -3.1695882549225813],
  up: [0, 1, 0],
  fov: 49.2,
  near: 0.05,
  far: 60,
  offset: [0, 0],
};

// OWNER CAMERA DESKTOP LOCK: Angle 3 / Bible, promoted verbatim from the
// Git-ignored local calibration record. Do not derive or refit this endpoint.
const OWNER_BIBLE_DESKTOP: CameraPose = {
  position: [0.00037665110056488724, 3.991898100773323, -0.3558153850886138],
  target: [0.0005360429555142286, 1.0832682689439963, -0.41188717984421014],
  up: [0, 1, 0],
  fov: 49.2,
  near: 0.05,
  far: 60,
  offset: [0, 0],
};

// OWNER CAMERA DESKTOP LOCK: Angle 4 / Prayer, promoted verbatim from the
// Git-ignored local calibration record. Do not derive or refit this endpoint.
const OWNER_PRAYER_DESKTOP: CameraPose = {
  position: [0.007128735040103533, 2.1547926392109815, 1.4569803586793368],
  target: [0.005757616056300196, 4.068051109055716, -0.12509942565052734],
  up: [0, 1, 0],
  fov: 49.2,
  near: 0.05,
  far: 60,
  offset: [0, 0],
};

export function cameraPose(view: SanctuaryView, aspect: number): CameraPose {
  if (view === "kneel") return OWNER_DEVOTIONAL_DESKTOP;
  if (view === "bible") return OWNER_BIBLE_DESKTOP;
  if (view === "prayer") return OWNER_PRAYER_DESKTOP;
  return OWNER_ENTRY_DESKTOP;
}

export function transitionEase(progress: number) {
  const bounded = Math.max(0, Math.min(1, progress));
  return bounded * bounded * (3 - 2 * bounded);
}
