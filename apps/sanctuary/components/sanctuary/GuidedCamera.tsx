// File: apps/sanctuary/components/sanctuary/GuidedCamera.tsx
// Description: Moves between intentional entry and devotional views.
// Purpose: Provides gentle framing without navigation through physical geometry.
// Notes: Reduced motion applies the destination immediately.

import { useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useRef } from "react";
import { PerspectiveCamera, Vector3 } from "three";
import { cameraPose, transitionEase, type SanctuaryView } from "../../lib/sanctuary/camera";
import { anchorByRole, point, referenceCamera, sourceObjectCenter } from "../../lib/sanctuary/runtime";

export function GuidedCamera({ view, reducedMotion, revision, onSettled }: { view: SanctuaryView; reducedMotion: boolean; revision: number; onSettled: (revision: number) => void }) {
  const { camera, size, invalidate } = useThree();
  const currentTarget = useRef(new Vector3(0, 1.8, -2.8));
  const currentOffset = useRef([0, 0]);
  const motion = useRef<null | { elapsed: number; start: Vector3; target: Vector3; position: Vector3; look: Vector3; fov: number; startFov: number; offset: number[]; startOffset: number[] }>(null);
  const first = useRef(true);
  useLayoutEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return;
    const pose = cameraPose(view, size.width / size.height, point(referenceCamera.position), point(anchorByRole("BIBLE_HOVER_CLICK_FOCUS").position), point(anchorByRole("PRAYER_ZONE").position), sourceObjectCenter("ALTAR_ACC_HYPER3D_CROSS_CENTER_MASTER"));
    motion.current = { elapsed: first.current || reducedMotion ? 1.6 : 0, start: camera.position.clone(), target: currentTarget.current.clone(), position: new Vector3(...pose.position), look: new Vector3(...pose.target), fov: pose.fov, startFov: camera.fov, offset: pose.offset, startOffset: [...currentOffset.current] };
    first.current = false;
    invalidate();
  }, [camera, size.width, size.height, view, reducedMotion, revision, invalidate]);
  useFrame((_, delta) => {
    const movement = motion.current;
    if (!movement || !(camera instanceof PerspectiveCamera)) return;
    movement.elapsed += Math.min(delta, .05);
    const progress = transitionEase(movement.elapsed / 1.6);
    camera.position.lerpVectors(movement.start, movement.position, progress);
    currentTarget.current.lerpVectors(movement.target, movement.look, progress);
    camera.lookAt(currentTarget.current);
    camera.fov = movement.startFov + (movement.fov - movement.startFov) * progress;
    currentOffset.current = movement.offset.map((value, axis) => movement.startOffset[axis] + (value - movement.startOffset[axis]) * progress);
    camera.setViewOffset(size.width, size.height, size.width * currentOffset.current[0], size.height * currentOffset.current[1], size.width, size.height);
    camera.updateProjectionMatrix();
    if (progress < 1) invalidate(); else { motion.current = null; onSettled(revision); }
  });
  return null;
}
