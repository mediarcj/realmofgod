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
