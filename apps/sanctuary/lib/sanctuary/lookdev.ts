// File: apps/sanctuary/lib/sanctuary/lookdev.ts
// Description: Defines the small development-only sanctuary lighting calibration profile.
// Purpose: Lets visual tuning persist locally without changing material structure or production source data.
// Notes: Values are deliberately bounded to keep lighting physically restrained.

export type LookdevProfile = { exposure: number; environment: number; windowDaylight: number; candleLight: number; crossLight: number };
/** The pre-realism profile is retained only for side-by-side development review. */
export const baselineLookdev: LookdevProfile = { exposure: 1.24, environment: .48, windowDaylight: .72, candleLight: .78, crossLight: .9 };
/**
 * The normal runtime profile: lower indirect fill preserves walnut depth while
 * daylight and restrained candle bounce retain a readable devotional interior.
 */
export const enhancedLookdev: LookdevProfile = { exposure: 1.02, environment: .26, windowDaylight: .54, candleLight: .46, crossLight: .9 };
/** Isolated scan-led candidate; enhanced remains the non-destructive comparison baseline. */
export const photorealLookdev: LookdevProfile = { exposure: .94, environment: .34, windowDaylight: .48, candleLight: .38, crossLight: .9 };
export const giLookdev: LookdevProfile = { exposure: .90, environment: .18, windowDaylight: .52, candleLight: .32, crossLight: .9 };
/**
 * Reserved for Cycles-authored PBR and UV1 lightmap proof assets. This only
 * reduces unbaked runtime fill; it does not invent GI when bake assets are absent.
 */
export const blenderBakedLookdev: LookdevProfile = { exposure: .92, environment: .16, windowDaylight: .38, candleLight: .32, crossLight: .9 };
export const defaultLookdev = enhancedLookdev;
const limits: Record<keyof LookdevProfile, readonly [number, number]> = { exposure: [.6, 2], environment: [0, 1.2], windowDaylight: [0, 1.5], candleLight: [0, 1.5], crossLight: [0, 1.8] };
export function isLookdevProfile(value: unknown): value is LookdevProfile {
  return Boolean(value) && typeof value === "object" && (Object.keys(limits) as (keyof LookdevProfile)[]).every((key) => {
    const number = (value as Record<string, unknown>)[key]; const [min, max] = limits[key];
    return typeof number === "number" && Number.isFinite(number) && number >= min && number <= max;
  });
}
export function clampLookdev(key: keyof LookdevProfile, value: number) { const [min, max] = limits[key]; return Math.max(min, Math.min(max, value)); }

/**
 * Development-only comparison input.  This deliberately has no visible UI and
 * is ignored by the production experience, so it cannot alter the journey.
 */
export function developmentLookdevProfile(search: string): LookdevProfile | null {
  const requested = new URLSearchParams(search).get("lookdev");
  if (requested === "baseline") return baselineLookdev;
  if (requested === "enhanced") return enhancedLookdev;
  if (requested === "photoreal") return photorealLookdev;
  if (requested === "gi") return giLookdev;
  if (requested === "blender-baked") return blenderBakedLookdev;
  return null;
}

export type DevelopmentTone = "aces" | "agx";
export function developmentTone(search: string): DevelopmentTone | null {
  const requested = new URLSearchParams(search).get("tone");
  return requested === "agx" || requested === "aces" ? requested : null;
}
