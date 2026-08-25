/**
 * File: apps/sanctuary/src/rendering/d9InteractionProxy.test.ts
 * Description: Covers the state-keyed D9 interaction-proxy camera raycast contract.
 * Purpose: Prevents the table or Bible from being present but unreachable in its accepted visitor frame.
 * Notes: The measured authored bounds are independently checked by the local asset verifier.
 */

// Import only pure interaction-contract helpers so the test needs no browser Canvas or renderer mount.
import { describe, expect, it } from "vitest";

import { selectD9InteractionProxy, verifyD9InteractionRaycast } from "./d9InteractionProxy";

// Keep the two visitor interaction states separate so a completed table click cannot reuse its old proxy for the Bible.
describe("D9 state-keyed interaction proxies", () => {
  it("creates one fresh semantic key for each active object and none for settled states", () => {
    expect(selectD9InteractionProxy("SANCTUARY")?.key).toBe(
      "SANCTUARY:HF01_PrayerTable__Table_Top",
    );
    expect(selectD9InteractionProxy("SIT")?.key).toBe("SIT:HF01_Bible_Root");
    expect(selectD9InteractionProxy("READ")).toBeNull();
    expect(selectD9InteractionProxy("PRAY")).toBeNull();
  });

  it("keeps the D7.5 SANCTUARY camera table target on screen and raycastable", () => {
    const result = verifyD9InteractionRaycast("SANCTUARY", { height: 1080, width: 1920 });

    expect(result.key).toBe("SANCTUARY:HF01_PrayerTable__Table_Top");
    expect(result.onScreen).toBe(true);
    expect(result.intersects).toBe(true);
  });

  it("keeps the D7.5 SIT camera Bible target on screen and raycastable", () => {
    const result = verifyD9InteractionRaycast("SIT", { height: 1080, width: 1920 });

    expect(result.key).toBe("SIT:HF01_Bible_Root");
    expect(result.onScreen).toBe(true);
    expect(result.intersects).toBe(true);
  });
});
