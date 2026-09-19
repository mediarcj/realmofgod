// File: apps/sanctuary/lib/sanctuary/camera.ts
// Description: Defines the sanctuary's bounded, guided camera views.
// Purpose: Frames the source objects without free-roam or geometry changes.
// Notes: Runtime offsets are deliberate viewing choices relative to authored anchors.

export type SanctuaryView = "entry" | "kneel" | "bible" | "prayer";
type Point = [number, number, number];
export function cameraPose(view: SanctuaryView, aspect: number, entry: Point, bible: Point, prayer: Point, centralCross: Point) {
  const portrait = aspect < .85;
  const fov = portrait ? 78 : 64;
  if (view === "kneel") return {
    position: [prayer[0], prayer[1] + 1.05, prayer[2] - .1] as Point,
    target: centralCross, fov, offset: [0, 0],
  };
  if (view === "bible") return {
    position: [bible[0], bible[1] - .72, bible[2] + (portrait ? 1.05 : 1.35)] as Point,
    target: [bible[0], bible[1] - .08, bible[2]] as Point,
    fov: portrait ? 62 : 44, offset: portrait ? [0, .08] : [-.15, 0],
  };
  if (view === "prayer") return {
    position: [prayer[0], prayer[1] + 1.15, prayer[2] + .05] as Point,
    target: [centralCross[0], centralCross[1] + 1.35, centralCross[2]] as Point,
    fov: portrait ? 74 : 58, offset: [0, 0],
  };
  return {
    position: [entry[0], entry[1] + .65, entry[2] + .6] as Point,
    target: [0, 1.8, -2.8] as Point, fov, offset: [0, 0],
  };
}

export function transitionEase(progress: number) {
  const bounded = Math.max(0, Math.min(1, progress));
  return bounded * bounded * (3 - 2 * bounded);
}
