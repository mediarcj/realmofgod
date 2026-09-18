// File: apps/sanctuary/components/sanctuary/SanctuaryScene.tsx
// Description: Composes accepted sanctuary derivatives in construction order.
// Purpose: Keeps scene geometry traceable to the Blender master.
// Notes: The floor is the first physical unit.

import { sanctuaryUnits } from "../../lib/sanctuary/asset-manifest";
import { SanctuaryAsset } from "./SanctuaryAsset";
import { Suspense, useCallback, useEffect, useState } from "react";

const devotionalUnits = new Set(["table", "bible", "kneeling-rest"]);
export function SanctuaryScene({ onProgress }: { onProgress: (count: number) => void }) {
  const [loaded, setLoaded] = useState<Set<string>>(() => new Set());
  const onLoaded = useCallback((unit: string) => {
    setLoaded((previous) => previous.has(unit) ? previous : new Set([...previous, unit]));
  }, []);
  // Report from an effect, never from a state updater that React may replay.
  useEffect(() => { onProgress(loaded.size); }, [loaded, onProgress]);
  const roomReady = sanctuaryUnits.filter((unit) => !devotionalUnits.has(unit)).every((unit) => loaded.has(unit));
  const visible = sanctuaryUnits.filter((unit) => unit === "floor" || (loaded.has("floor") && (!devotionalUnits.has(unit) || roomReady)));
  return <>{visible.map((unit) => <Suspense key={unit} fallback={null}><SanctuaryAsset unit={unit} onLoaded={onLoaded} /></Suspense>)}</>;
}
