// File: apps/sanctuary/components/sanctuary/CameraCalibrationControls.tsx
// Description: Gives the owner direct local-development control of the actual R3F camera.
// Purpose: Captures visual camera truth without changing guided production poses or geometry.
// Notes: Rendered only while the explicit calibration toggle is on.

import { useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { PerspectiveCamera, Vector3 } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { cameraPose } from "../../lib/sanctuary/camera";
import { applyCameraCalibrationPose, captureCameraCalibrationPose } from "../../lib/sanctuary/camera-calibration-runtime";
import {
  sanctuaryViewForCalibration,
  type CalibrationCommand,
  type CalibrationPose,
} from "../../lib/sanctuary/camera-calibration";

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
      onCameraState(captureCameraCalibrationPose(camera, orbit.target, [size.width, size.height]));
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
      orbit.target.copy(applyCameraCalibrationPose(camera, { ...pose, aspect: size.width / size.height, near: camera.near, far: camera.far, viewOffset: null }));
    } else if (command.type === "load-saved") {
      orbit.target.copy(applyCameraCalibrationPose(camera, command.record));
    } else {
      orbit.target.copy(applyCameraCalibrationPose(camera, {
        position: command.patch.position ?? camera.position.toArray(),
        target: command.patch.target ?? orbit.target.toArray(),
        up: camera.up.toArray(),
        fov: command.patch.fov ?? camera.fov,
        near: camera.near,
        far: camera.far,
        aspect: camera.aspect,
        viewOffset: camera.view?.enabled ? {
          fullWidth: camera.view.fullWidth,
          fullHeight: camera.view.fullHeight,
          offsetX: camera.view.offsetX,
          offsetY: camera.view.offsetY,
          width: camera.view.width,
          height: camera.view.height,
        } : null,
      }));
    }
    orbit.update();
    camera.userData.sanctuaryTarget = orbit.target.toArray();
    onCameraState(captureCameraCalibrationPose(camera, orbit.target, [size.width, size.height]));
    invalidate();
  }, [camera, command, invalidate, onCameraState, size.height, size.width]);

  return null;
}
