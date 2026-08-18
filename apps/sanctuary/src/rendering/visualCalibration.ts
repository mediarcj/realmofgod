/**
 * File: apps/sanctuary/src/rendering/visualCalibration.ts
 * Description: Defines the reviewed visual parameters for the authored sanctuary composition.
 * Purpose: Keeps camera, room, prop, and lighting values explicit for runtime rendering and local art review.
 * Notes: The values contain no visitor data and have no persistence, network, or provider behavior.
 */

// Use tuples for renderer-facing coordinates so calibration data remains compact and unambiguous.
export type CalibrationVector = readonly [number, number, number];

export interface TransformCalibration {
  readonly position: CalibrationVector;
  readonly rotationY: number;
  readonly scale: number;
}

export interface VisualCalibration {
  readonly camera: {
    readonly position: CalibrationVector;
    readonly target: CalibrationVector;
    readonly fov: number;
  };
  readonly room: TransformCalibration;
  readonly lighting: {
    readonly exposure: number;
    readonly warmKey: {
      readonly intensity: number;
      readonly position: CalibrationVector;
    };
    readonly fill: {
      readonly intensity: number;
      readonly color: string;
    };
    readonly exteriorKey: {
      readonly intensity: number;
      readonly color: string;
    };
  };
  readonly table: TransformCalibration;
  readonly bible: TransformCalibration;
  readonly candleLeft: TransformCalibration;
  readonly candleRight: TransformCalibration;
}

export interface SanctuaryHeroCamera {
  readonly position: CalibrationVector;
  readonly target: CalibrationVector;
  readonly fov: number;
}

// Hold a close symmetrical view that keeps the room readable while giving the table objects real presence.
export const defaultVisualCalibration: VisualCalibration = {
  camera: {
    position: [0, 1.86, 5.9],
    target: [0, 1.5, -0.2],
    fov: 44,
  },
  room: {
    position: [0, 0, 0],
    rotationY: 0,
    scale: 1,
  },
  lighting: {
    exposure: 1.26,
    warmKey: {
      intensity: 20,
      position: [0, 2.1, 0.1],
    },
    fill: {
      intensity: 0.045,
      color: "#c99671",
    },
    exteriorKey: {
      intensity: 0.02,
      color: "#80624f",
    },
  },
  table: {
    position: [0, 0, 0],
    rotationY: 0,
    scale: 1,
  },
  bible: {
    position: [0, 0, 0],
    rotationY: 0,
    scale: 0.62,
  },
  candleLeft: {
    position: [0, 0, 0],
    rotationY: 0,
    scale: 1,
  },
  candleRight: {
    position: [0, 0, 0],
    rotationY: 0,
    scale: 1,
  },
};

// Move a portrait camera back before modestly widening its lens so the room avoids game-like distortion.
export function selectSanctuaryHeroCamera(
  baseCamera: SanctuaryHeroCamera,
  viewportAspect: number,
  sanctuaryHero: boolean,
): SanctuaryHeroCamera {
  if (!sanctuaryHero || viewportAspect >= 0.82) {
    return baseCamera;
  }

  const portraitAmount = Math.min(1, Math.max(0, (0.82 - viewportAspect) / 0.36));
  return {
    position: [
      baseCamera.position[0],
      baseCamera.position[1] + 0.08 * portraitAmount,
      baseCamera.position[2] + 0.55 * portraitAmount,
    ],
    target: [
      baseCamera.target[0],
      baseCamera.target[1] - 0.35 * portraitAmount,
      baseCamera.target[2],
    ],
    fov: baseCamera.fov + 14 * portraitAmount,
  };
}

// Return fresh nested objects so a reset cannot share mutable arrays with an earlier review session.
export function createDefaultVisualCalibration(): VisualCalibration {
  return structuredClone(defaultVisualCalibration);
}
