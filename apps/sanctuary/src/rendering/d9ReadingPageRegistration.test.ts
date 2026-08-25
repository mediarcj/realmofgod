/**
 * File: apps/sanctuary/src/rendering/d9ReadingPageRegistration.test.ts
 * Description: Covers the fail-closed registration gate used by the D9 reading-page overlay.
 * Purpose: Proves a malformed visual mesh is attempted once and cannot create a repeated render-frame error.
 * Notes: These tests use synthetic errors only and do not need a browser, WebGL renderer, or prayer content.
 */

import { describe, expect, it } from "vitest";

import { createD9ReadingPageRegistrationGate } from "./d9ReadingPageRegistration";

describe("createD9ReadingPageRegistrationGate", () => {
  it("catches a page-measurement error once and never retries it", () => {
    // Count measurement calls so the test directly protects against frame-by-frame retries.
    const gate = createD9ReadingPageRegistrationGate<string>();
    let attempts = 0;

    const firstResult = gate.register(() => {
      attempts += 1;
      throw new Error("The authored reading page needs four upper-face vertices; found 2.");
    });
    const laterResult = gate.register(() => {
      attempts += 1;
      return "must not run";
    });

    expect(firstResult.status).toBe("unavailable");
    expect(laterResult.status).toBe("unavailable");
    expect(attempts).toBe(1);
    expect(gate.getFailure()?.message).toContain("four upper-face vertices");
  });

  it("allows a successful overlay measurement to be refreshed after a viewport resize", () => {
    // A resize needs a fresh screen projection, but it must not weaken the failed-registration boundary.
    const gate = createD9ReadingPageRegistrationGate<string>();

    expect(gate.register(() => "first")).toEqual({ status: "ready", value: "first" });
    expect(gate.register(() => "skipped")).toEqual({ status: "skipped" });
    gate.resetForViewport();
    expect(gate.register(() => "resized")).toEqual({ status: "ready", value: "resized" });
  });
});
