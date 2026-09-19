// File: apps/sanctuary/components/sanctuary/LookdevControls.tsx
// Description: Provides compact local lighting calibration controls.
// Purpose: Lets browser review tune photographic balance without exposing production UI.
// Notes: Mounted only through the development calibration gate.

import { clampLookdev, type LookdevProfile } from "../../lib/sanctuary/lookdev";

const fields: { key: keyof LookdevProfile; label: string; min: number; max: number; step: number }[] = [
  { key: "exposure", label: "Exposure", min: .6, max: 2, step: .01 },
  { key: "environment", label: "Environment", min: 0, max: 1.2, step: .01 },
  { key: "windowDaylight", label: "Window daylight", min: 0, max: 1.5, step: .01 },
  { key: "candleLight", label: "Candle light", min: 0, max: 1.5, step: .01 },
  { key: "crossLight", label: "Cross glow", min: 0, max: 1.8, step: .01 },
];
export function LookdevControls({ profile, onChange, onSave, status }: { profile: LookdevProfile; onChange: (value: LookdevProfile) => void; onSave: () => void; status: string }) {
  return <aside className="lookdev-controls" aria-label="Lookdev controls"><strong>Lookdev</strong><p>Development only. These controls change lighting balance, not geometry or material assignment.</p>{fields.map(({ key, label, min, max, step }) => <label key={key}><span>{label}: {profile[key].toFixed(2)}</span><input type="range" min={min} max={max} step={step} value={profile[key]} onChange={(event) => onChange({ ...profile, [key]: clampLookdev(key, Number(event.currentTarget.value)) })} /></label>)}<button type="button" onClick={onSave}>Save Lookdev</button><small>{status}</small></aside>;
}
