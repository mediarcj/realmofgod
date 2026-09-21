// File: apps/sanctuary/components/sanctuary/SanctuaryScene.tsx
// Description: Composes accepted sanctuary derivatives in construction order.
// Purpose: Keeps scene geometry traceable to the Blender master.
// Notes: The floor is the first physical unit.

import { sanctuaryUnits } from "../../lib/sanctuary/asset-manifest";
import { SanctuaryAsset } from "./SanctuaryAsset";
import { Suspense, useCallback, useEffect, useState } from "react";
import type { Object3D } from "three";
import { devotionalObjects, eligibleObjects } from "../../lib/sanctuary/journey";
import type { SanctuaryView } from "../../lib/sanctuary/camera";
import type { MaterialDebugInfo } from "./MaterialDebugReadout";

const devotionalUnits = new Set(["table", "bible", "kneeling-rest"]);
const calibrationKeys: Record<string, string> = { table: "table", bible: "bible", "kneeling-rest": "kneelingRest" };
export function SanctuaryScene({ onProgress, view, interactive, onActivate, onCalibrationObject, onMaterialDebug }: { onProgress: (count: number) => void; view: SanctuaryView; interactive: boolean; onActivate: (name: string) => void; onCalibrationObject?: (key: string, object: Object3D | null) => void; onMaterialDebug?: (info: MaterialDebugInfo) => void }) {
  const [loaded, setLoaded] = useState<Set<string>>(() => new Set());
  const onLoaded = useCallback((unit: string) => {
    setLoaded((previous) => previous.has(unit) ? previous : new Set([...previous, unit]));
  }, []);
  // Report from an effect, never from a state updater that React may replay.
  useEffect(() => { onProgress(loaded.size); }, [loaded, onProgress]);
  const roomReady = sanctuaryUnits.filter((unit) => !devotionalUnits.has(unit)).every((unit) => loaded.has(unit));
  const visible = sanctuaryUnits.filter((unit) => unit === "sanctuary-architecture" || (loaded.has("sanctuary-architecture") && (!devotionalUnits.has(unit) || roomReady)));
  return <>{visible.map((unit) => {
    const name = devotionalObjects[unit as keyof typeof devotionalObjects];
    const interactiveName = interactive && eligibleObjects(view).includes(name) ? name : undefined;
    return <Suspense key={unit} fallback={null}><SanctuaryAsset unit={unit} onLoaded={onLoaded} interactiveName={interactiveName} onActivate={onActivate} calibrationKey={calibrationKeys[unit]} calibrationSourceName={name} onCalibrationObject={onCalibrationObject} onMaterialDebug={onMaterialDebug} /></Suspense>;
  })}</>;
}
