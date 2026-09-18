// File: apps/sanctuary/lib/sanctuary/asset-manifest.ts
// Description: Lists the independently exported sanctuary units.
// Purpose: Loads only verified derivatives in construction order.
// Notes: Object names and transforms live in each adjacent asset manifest.

export const sanctuaryUnits = ["floor","north-wall","east-wall","west-wall","north-window-1","north-window-2","north-window-3","east-window-1","east-window-2","east-window-3","west-window-1","west-window-2","west-window-3","ceiling-structure","ceiling-coffers","east-wall-panels","west-wall-panels"] as const;
