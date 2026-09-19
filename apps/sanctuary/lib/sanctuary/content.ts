// File: apps/sanctuary/lib/sanctuary/content.ts
// Description: Defines the replaceable interface for approved Scripture content.
// Purpose: Keeps translation text and licensing explicit rather than inventing readings.
// Notes: No approved content source is configured; the default returns no reading.

export interface ScriptureReading { reference: string; text: string; translation: string; attribution: string }
export interface ScriptureSource { read(): Promise<ScriptureReading | null> }
export const scriptureSource: ScriptureSource = { async read() { return null; } };
export function isCompleteReading(reading: ScriptureReading) {
  return [reading.reference, reading.text, reading.translation, reading.attribution].every((value) => typeof value === "string" && value.trim().length > 0);
}

// Reused from the approved historical sanctuary journey. It deliberately names
// the reading without inventing a translation or verse wording.
export const historicalScripture = {
  reference: "Psalm 46:10",
  status: "translation-and-licensing-pending",
} as const;

export const historicalPrayerReflections = [
  "Nothing else is asked of you right now.",
  "You may stay as long as you like.",
  "Pray quietly, reflect, or simply be still.",
] as const;
