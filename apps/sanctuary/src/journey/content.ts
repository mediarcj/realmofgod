/**
 * File: apps/sanctuary/src/journey/content.ts
 * Description: Holds the approved reflection beats and the translation-gated Scripture reference slot.
 * Purpose: Makes Scripture visibly and structurally different from ordinary interface reflection content.
 * Notes: No Bible translation or verse wording is included until the owner approves both decisions.
 */

import type { PeaceChoice } from "./model";

// Mark ordinary journey writing plainly so it cannot be rendered through the Scripture component by accident.
export interface ReflectionContent {
  readonly kind: "reflection";
  readonly text: string;
}

// Reserve the fields needed for an approved future Scripture entry without filling unapproved text today.
export interface ScriptureContent {
  readonly kind: "scripture";
  readonly reference: "Psalm 46:10";
  readonly translationId: null;
  readonly approvedText: null;
  readonly status: "translation-and-licensing-pending";
}

// Keep each equal choice small, environment-neutral, and free from spiritual evaluation.
export const choiceReflections: Readonly<Record<PeaceChoice, ReflectionContent>> = {
  walk: { kind: "reflection", text: "The path remains open. Continue at your own pace." },
  sit: { kind: "reflection", text: "You can stay here for a moment." },
  listen: { kind: "reflection", text: "Notice what is already here." },
};

// Present only the approved reference until translation and licensing choices are explicitly made.
export const peaceScripture: ScriptureContent = {
  kind: "scripture",
  reference: "Psalm 46:10",
  translationId: null,
  approvedText: null,
  status: "translation-and-licensing-pending",
};
