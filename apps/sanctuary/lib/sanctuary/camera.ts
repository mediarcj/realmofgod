// File: apps/sanctuary/lib/sanctuary/camera.ts
// Description: Defines the sanctuary's bounded, guided camera views.
// Purpose: Frames the source objects without free-roam or geometry changes.
// Notes: Every endpoint is fitted from accepted browser-space geometry bounds.

import { sanctuaryCameraGeometry as geometry, type Point3 } from "./camera-geometry.ts";
export type SanctuaryView = "entry" | "kneel" | "bible" | "prayer";
export function cameraDuration(reducedMotion: boolean) { return reducedMotion ? 0 : 1.6; }
export type CameraPose = { position: Point3; target: Point3; up: Point3; fov: number; offset: [number, number] };

// Desktop composition transcribed from the owner's Blender viewport references.
// Browser-space geometry still supplies the room-safety and responsive checks.
const OWNER_ENTRY_DESKTOP: CameraPose = {
  position: [0, 1.68, 4.6],
  target: [0, 2.5, -3.88],
  up: [0, 1, 0],
  fov: 90,
  offset: [0, 0],
};

const OWNER_DEVOTIONAL_DESKTOP: CameraPose = {
  position: [0, 2.4, 3.5],
  target: [0, 3.4, -3.88],
  up: [0, 1, 0],
  fov: 36,
  offset: [0, 0],
};

const OWNER_BIBLE_DESKTOP: CameraPose = {
  position: [0.012919425964355469, 4.4277093727340535, -0.4406667798757553],
  target: [0.012919425964355469, 2.00636488199234, -0.4406667798757553],
  up: [0, 0, -1],
  fov: 46,
  offset: [0, 0],
};

function architecturalFov(aspect: number) { return aspect < .75 ? 64 : 68; }
function bibleFov(aspect: number) { return aspect < .6 ? 76 : aspect < 1 ? 60 : 46; }
function fitBibleDistance(aspect: number, fov: number) {
  const bible = geometry.bible;
  const [width, , depth] = geometry.size(bible);
  const vertical = fov * Math.PI / 180;
  const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * aspect);
  const coverage = .8;
  const halfThickness = (bible.max[1] - bible.min[1]) / 2;
  return Math.max(width / 2 / (coverage * Math.tan(horizontal / 2)), depth / 2 / (coverage * Math.tan(vertical / 2))) + halfThickness + .08;
}

export function cameraPose(view: SanctuaryView, aspect: number): CameraPose {
  const cross = geometry.center(geometry.centralCross);
  const bible = geometry.center(geometry.bible);
  const adultPosition: Point3 = [0, geometry.adultEyeY, geometry.devotionalZ];
  if (view === "kneel") return OWNER_DEVOTIONAL_DESKTOP;
  if (view === "bible") {
    if (aspect >= 1.4) return OWNER_BIBLE_DESKTOP;
    const fov = bibleFov(aspect);
    return { position: [bible[0], bible[1] + fitBibleDistance(aspect, fov), bible[2]], target: bible, up: [0, 0, -1], fov, offset: [0, 0] };
  }
  if (view === "prayer") {
    const ceilingLift = (geometry.ceiling.min[1] - geometry.centralCross.max[1]) * .45;
    return { position: adultPosition, target: [cross[0], geometry.centralCross.max[1] + ceilingLift, cross[2]], up: [0, 1, 0], fov: architecturalFov(aspect), offset: [0, 0] };
  }
  return OWNER_ENTRY_DESKTOP;
}

export function transitionEase(progress: number) {
  const bounded = Math.max(0, Math.min(1, progress));
  return bounded * bounded * (3 - 2 * bounded);
}
