// File: apps/sanctuary/components/sanctuary/CameraCalibrationControls.tsx
// Description: Gives the owner direct local-development control of the actual R3F camera.
// Purpose: Captures visual camera truth without changing guided production poses or geometry.
// Notes: Rendered only while the explicit calibration toggle is on.

import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { PerspectiveCamera, Vector3 } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { cameraPose } from "../../lib/sanctuary/camera";
import {
  sanctuaryViewForCalibration,
  type CalibrationCommand,
  type CalibrationPose,
  type CalibrationVector,
} from "../../lib/sanctuary/camera-calibration";

function vector(value: Vector3): CalibrationVector { return [value.x, value.y, value.z]; }
function degrees(value: number): number { return value * 180 / Math.PI; }

function capturePose(camera: PerspectiveCamera, target: Vector3, viewport: [number, number]): CalibrationPose {
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

function applyPose(camera: PerspectiveCamera, controls: OrbitControls, pose: Pick<CalibrationPose, "position" | "target" | "up" | "fov" | "near" | "far" | "viewOffset">) {
  camera.position.set(...pose.position);
  camera.up.set(...pose.up);
  camera.fov = pose.fov;
  camera.near = pose.near;
  camera.far = pose.far;
  if (pose.viewOffset) {
    camera.setViewOffset(pose.viewOffset.fullWidth, pose.viewOffset.fullHeight, pose.viewOffset.offsetX, pose.viewOffset.offsetY, pose.viewOffset.width, pose.viewOffset.height);
  } else camera.clearViewOffset();
  camera.updateProjectionMatrix();
  controls.target.set(...pose.target);
  controls.update();
}

function savedTarget(camera: PerspectiveCamera): Vector3 {
  const candidate = camera.userData.sanctuaryTarget;
  if (Array.isArray(candidate) && candidate.length === 3 && candidate.every(Number.isFinite)) return new Vector3(...candidate);
  return camera.position.clone().add(camera.getWorldDirection(new Vector3()));
}

export function CameraCalibrationControls({ command, onCameraState }: { command: CalibrationCommand | null; onCameraState: (state: CalibrationPose) => void }) {
  const { camera, gl, size, invalidate } = useThree();
  const controls = useRef<OrbitControls | null>(null);
  const lastCommand = useRef(0);

  useEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return;
    const orbit = new OrbitControls(camera, gl.domElement);
    orbit.enableDamping = false;
    orbit.enablePan = true;
    orbit.screenSpacePanning = true;
    orbit.target.copy(savedTarget(camera));
    controls.current = orbit;
    const emit = () => {
      camera.userData.sanctuaryTarget = orbit.target.toArray();
      onCameraState(capturePose(camera, orbit.target, [size.width, size.height]));
      invalidate();
    };
    orbit.addEventListener("change", emit);
    emit();
    return () => {
      orbit.removeEventListener("change", emit);
      orbit.dispose();
      controls.current = null;
    };
  }, [camera, gl, invalidate, onCameraState, size.height, size.width]);

  useEffect(() => {
    if (!command || command.id === lastCommand.current || !(camera instanceof PerspectiveCamera) || !controls.current) return;
    lastCommand.current = command.id;
    const orbit = controls.current;
    if (command.type === "load-coded") {
      const pose = cameraPose(sanctuaryViewForCalibration(command.view), size.width / size.height);
      applyPose(camera, orbit, { ...pose, near: camera.near, far: camera.far, viewOffset: null });
    } else if (command.type === "load-saved") {
      applyPose(camera, orbit, command.record);
    } else {
      applyPose(camera, orbit, {
        position: command.patch.position ?? vector(camera.position),
        target: command.patch.target ?? vector(orbit.target),
        up: vector(camera.up),
        fov: command.patch.fov ?? camera.fov,
        near: camera.near,
        far: camera.far,
        viewOffset: camera.view?.enabled ? {
          fullWidth: camera.view.fullWidth,
          fullHeight: camera.view.fullHeight,
          offsetX: camera.view.offsetX,
          offsetY: camera.view.offsetY,
          width: camera.view.width,
          height: camera.view.height,
        } : null,
      });
    }
    camera.userData.sanctuaryTarget = orbit.target.toArray();
    onCameraState(capturePose(camera, orbit.target, [size.width, size.height]));
    invalidate();
  }, [camera, command, invalidate, onCameraState, size.height, size.width]);

  return null;
}
