/**
 * File: apps/sanctuary/src/sanctuary/sanctuaryHomePolicy.ts
 * Description: Defines visibility and interaction-size facts for the global sanctuary Home control.
 * Purpose: Keeps the secondary return escape available in settled non-entry states without adding navigation state.
 * Notes: This is a pure local policy with no DOM, Canvas, persistence, account, or browser-device behavior.
 */

// Import the state name only so Home visibility stays tied to the approved four-state sanctuary vocabulary.
import type { SanctuaryMvpStateName } from "./model";

// Keep the accessible target comfortably usable while CSS keeps the visible outline icon deliberately small.
export const sanctuaryHomeControlTargetSizePx = 44;

// Show this secondary escape only after a visitor has progressed beyond the opening sanctuary frame.
export function shouldShowSanctuaryHome(stateName: SanctuaryMvpStateName): boolean {
  return stateName !== "SANCTUARY";
}
