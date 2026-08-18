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

// Center the room around its rear door and keep enough camera distance for floor, walls, table, and Bible.
export const defaultVisualCalibration: VisualCalibration = {
  camera: {
    position: [0, 1.58, 6.48],
    target: [0, 1.02, -0.45],
    fov: 50,
  },
  room: {
    position: [0, 0, 0],
    rotationY: 0,
    scale: 1,
  },
  lighting: {
    exposure: 1.52,
    warmKey: {
      intensity: 3.8,
      position: [0, 2.55, 0.18],
    },
    fill: {
      intensity: 1.02,
      color: "#d7b68a",
    },
    exteriorKey: {
      intensity: 1.05,
      color: "#d8b07c",
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
    scale: 1,
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

// Return fresh nested objects so a reset cannot share mutable arrays with an earlier review session.
export function createDefaultVisualCalibration(): VisualCalibration {
  return structuredClone(defaultVisualCalibration);
}
