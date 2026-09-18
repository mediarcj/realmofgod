// File: apps/sanctuary/components/sanctuary/SanctuaryScene.tsx
// Description: Composes accepted sanctuary derivatives in construction order.
// Purpose: Keeps scene geometry traceable to the Blender master.
// Notes: The floor is the first physical unit.

import { sanctuaryUnits } from "../../lib/sanctuary/asset-manifest";
import { SanctuaryAsset } from "./SanctuaryAsset";

export function SanctuaryScene() {
  return <>{sanctuaryUnits.map((unit) => <SanctuaryAsset key={unit} unit={unit} />)}</>;
}
