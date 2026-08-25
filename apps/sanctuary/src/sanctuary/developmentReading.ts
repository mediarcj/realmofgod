/**
 * File: apps/sanctuary/src/sanctuary/developmentReading.ts
 * Description: Defines the single local non-Scripture reading and reflection fixture for the D9.0B.2 layout proof.
 * Purpose: Lets the page and reflection surfaces prove semantic content flow without inventing Bible text or using AI.
 * Notes: This fixture is explicitly development-only placeholder content and is never presented as Scripture.
 */

// Describe the future reviewed-reading contract while keeping this proof to one deterministic local record.
export interface SanctuaryDevelopmentReading {
  readonly id: string;
  readonly leftPage: string;
  readonly reference: string;
  readonly relatedPrayerContentId: string;
  readonly rightPage: string;
  readonly translationOrSource: string;
}

// Keep the related reflection independent from visitor behavior so it cannot imply diagnosis or generated spiritual advice.
export interface SanctuaryDevelopmentReflection {
  readonly body: string;
  readonly id: string;
  readonly title: string;
}

// Use plain layout copy that visibly identifies itself as non-Scripture development material.
export const d9DevelopmentReading: SanctuaryDevelopmentReading = {
  id: "development-reading-surface-001",
  leftPage:
    "Development placeholder reading surface. Verified Scripture text has not been selected for this prototype.",
  reference: "Development layout fixture — not Scripture",
  relatedPrayerContentId: "development-reflection-001",
  rightPage:
    "This page proves the readable DOM overlay and its future replaceable page-content structure.",
  translationOrSource: "Development placeholder — no translation or Scripture source",
};

// Keep the prayer panel's relationship deterministic and locally curated rather than inferred from a visitor.
export const d9DevelopmentReflections: readonly SanctuaryDevelopmentReflection[] = [
  {
    body: "Development placeholder reflection. Future reviewed content may appear here after its own content and licensing review.",
    id: "development-reflection-001",
    title: "A quiet place for reflection",
  },
] as const;

// Resolve only the explicitly linked local fixture so the proof has no selection model, API, visitor tracking, or AI boundary.
export function selectD9DevelopmentReflection(
  relatedPrayerContentId: string,
): SanctuaryDevelopmentReflection {
  const reflection = d9DevelopmentReflections.find((entry) => entry.id === relatedPrayerContentId);
  if (reflection === undefined) {
    throw new Error(`The local development reflection is unavailable: ${relatedPrayerContentId}.`);
  }
  return reflection;
}
