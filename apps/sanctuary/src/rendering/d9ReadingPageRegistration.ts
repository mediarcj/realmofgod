/**
 * File: apps/sanctuary/src/rendering/d9ReadingPageRegistration.ts
 * Description: Provides a one-attempt safety gate for the optional D9 reading-page visual overlay.
 * Purpose: Prevents a malformed authored page mesh from throwing on every render frame or blocking the
 *          state-machine reading journey.
 * Notes: The gate deliberately fails closed for the visual overlay only; the accessible journey remains
 *        available through its semantic controls.
 */

// Represent one bounded registration result without retaining mutable renderer state in the DOM layer.
export type D9ReadingPageRegistrationResult<T> =
  | { readonly status: "ready"; readonly value: T }
  | { readonly status: "unavailable"; readonly error: Error }
  | { readonly status: "skipped" };

// Keep page-overlay registration to one attempt per viewport while allowing a successful layout after resize.
export function createD9ReadingPageRegistrationGate<T>() {
  let hasAttemptedForViewport = false;
  let failure: Error | null = null;

  return {
    // Set the attempt flag before measurement so a thrown registration cannot retry on the next render frame.
    register(measure: () => T): D9ReadingPageRegistrationResult<T> {
      if (failure !== null) {
        // The first unavailable result is reported by the caller; later frames do no additional overlay work.
        return { status: "skipped" };
      }
      if (hasAttemptedForViewport) {
        return { status: "skipped" };
      }

      hasAttemptedForViewport = true;
      try {
        return { status: "ready", value: measure() };
      } catch (error: unknown) {
        failure = error instanceof Error ? error : new Error(String(error));
        return { status: "unavailable", error: failure };
      }
    },

    // Reopen successful registration after resize without weakening the known-failure boundary.
    resetForViewport(): void {
      if (failure === null) {
        hasAttemptedForViewport = false;
      }
    },

    // Expose failure state to DEV diagnostics without exposing authored content.
    getFailure(): Error | null {
      return failure;
    },
  };
}
