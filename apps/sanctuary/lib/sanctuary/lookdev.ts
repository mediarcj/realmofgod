// File: apps/sanctuary/lib/sanctuary/lookdev.ts
// Description: Defines the small development-only sanctuary lighting calibration profile.
// Purpose: Lets visual tuning persist locally without changing material structure or production source data.
// Notes: Values are deliberately bounded to keep lighting physically restrained.

export type LookdevProfile = { exposure: number; environment: number; windowDaylight: number; candleLight: number; crossLight: number };
export const defaultLookdev: LookdevProfile = { exposure: 1.24, environment: .48, windowDaylight: .72, candleLight: .78, crossLight: .9 };
const limits: Record<keyof LookdevProfile, readonly [number, number]> = { exposure: [.6, 2], environment: [0, 1.2], windowDaylight: [0, 1.5], candleLight: [0, 1.5], crossLight: [0, 1.8] };
export function isLookdevProfile(value: unknown): value is LookdevProfile {
  return Boolean(value) && typeof value === "object" && (Object.keys(limits) as (keyof LookdevProfile)[]).every((key) => {
    const number = (value as Record<string, unknown>)[key]; const [min, max] = limits[key];
    return typeof number === "number" && Number.isFinite(number) && number >= min && number <= max;
  });
}
export function clampLookdev(key: keyof LookdevProfile, value: number) { const [min, max] = limits[key]; return Math.max(min, Math.min(max, value)); }
