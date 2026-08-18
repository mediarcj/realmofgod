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

// Hold a close symmetrical view that keeps the room readable while giving the table objects real presence.
export const defaultVisualCalibration: VisualCalibration = {
  camera: {
    position: [0, 1.72, 5.72],
    target: [0, 1.08, -0.42],
    fov: 48,
  },
  room: {
    position: [0, 0, 0],
    rotationY: 0,
    scale: 1,
  },
  lighting: {
    exposure: 1.02,
    warmKey: {
      intensity: 42,
      position: [0, 2.42, 0.24],
    },
    fill: {
      intensity: 0.18,
      color: "#d56f35",
    },
    exteriorKey: {
      intensity: 0.08,
      color: "#70442f",
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

// Widen only the portrait hero lens so the door, two candles, Bible, and table remain visible together.
export function selectSanctuaryHeroFov(
  baseFov: number,
  viewportAspect: number,
  sanctuaryHero: boolean,
): number {
  const portraitExpansion = sanctuaryHero ? Math.max(0, 0.9 - viewportAspect) * 68 : 0;
  return Math.min(78, baseFov + portraitExpansion);
}

// Return fresh nested objects so a reset cannot share mutable arrays with an earlier review session.
export function createDefaultVisualCalibration(): VisualCalibration {
  return structuredClone(defaultVisualCalibration);
}
