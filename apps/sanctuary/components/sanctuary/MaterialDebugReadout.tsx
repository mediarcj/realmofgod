// File: apps/sanctuary/components/sanctuary/MaterialDebugReadout.tsx
// Description: Displays compact development-only material information for a hovered mesh.
// Purpose: Makes unresolved material zones visible during local calibration without shipping a production panel.
// Notes: This component is mounted only when the existing development calibration gate is enabled.

export type MaterialDebugInfo = { mesh: string; unit: string; family: string; uv: boolean; projection: string; textureSet: string | null };

export function MaterialDebugReadout({ info }: { info: MaterialDebugInfo | null }) {
  if (!info) return <aside className="material-debug" aria-live="polite">Material debug: hover a sanctuary mesh.</aside>;
  return <aside className="material-debug" aria-live="polite">
    <strong>Material debug</strong>
    <span>{info.mesh}</span><span>unit: {info.unit}</span><span>family: {info.family}</span>
    <span>UV: {info.uv ? "yes" : "no"}</span><span>projection: {info.projection}</span><span>set: {info.textureSet ?? "none"}</span>
  </aside>;
}
