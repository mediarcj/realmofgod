// File: apps/sanctuary/lib/sanctuary/camera-calibration-runtime.ts
// Description: Captures and restores a PerspectiveCamera's local calibration state.
// Purpose: Keeps owner pose persistence deterministic and independently testable.
// Notes: This is runtime camera state only; it does not change source geometry or coded poses.

import { PerspectiveCamera, Vector3 } from "three";
import type { CalibrationPose, CalibrationVector } from "./camera-calibration";

function vector(value: Vector3): CalibrationVector { return [value.x, value.y, value.z]; }
function degrees(value: number): number { return value * 180 / Math.PI; }

export function captureCameraCalibrationPose(camera: PerspectiveCamera, target: Vector3, viewport: [number, number]): CalibrationPose {
  const view = camera.view?.enabled ? {
    fullWidth: camera.view.fullWidth,
    fullHeight: camera.view.fullHeight,
    offsetX: camera.view.offsetX,
    offsetY: camera.view.offsetY,
    width: camera.view.width,
    height: camera.view.height,
  } : null;
  return {
    position: vector(camera.position),
    target: vector(target),
    up: vector(camera.up),
    rotationRadians: [camera.rotation.x, camera.rotation.y, camera.rotation.z],
    rotationDegrees: [degrees(camera.rotation.x), degrees(camera.rotation.y), degrees(camera.rotation.z)],
    quaternion: [camera.quaternion.x, camera.quaternion.y, camera.quaternion.z, camera.quaternion.w],
    fov: camera.fov,
    near: camera.near,
    far: camera.far,
    aspect: camera.aspect,
    viewport,
    cameraType: camera.type,
    viewOffset: view,
  };
}

export function applyCameraCalibrationPose(camera: PerspectiveCamera, pose: Pick<CalibrationPose, "position" | "target" | "up" | "fov" | "near" | "far" | "aspect" | "viewOffset">): Vector3 {
  camera.position.set(...pose.position);
  camera.up.set(...pose.up);
  camera.fov = pose.fov;
  camera.near = pose.near;
  camera.far = pose.far;
  camera.aspect = pose.aspect;
  if (pose.viewOffset) camera.setViewOffset(pose.viewOffset.fullWidth, pose.viewOffset.fullHeight, pose.viewOffset.offsetX, pose.viewOffset.offsetY, pose.viewOffset.width, pose.viewOffset.height);
  else camera.clearViewOffset();
  camera.updateProjectionMatrix();
  const target = new Vector3(...pose.target);
  camera.lookAt(target);
  camera.updateMatrixWorld();
  return target;
}
