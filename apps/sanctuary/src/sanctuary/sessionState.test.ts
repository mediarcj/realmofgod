/**
 * File: apps/sanctuary/src/sanctuary/sessionState.test.ts
 * Description: Covers same-tab state restoration and the deliberately tiny durable session payload.
 * Purpose: Prevents a refresh from losing a settled sanctuary state or accepting arbitrary browser data.
 * Notes: Tests use in-memory storage doubles only; they do not access a real browser, network, account, or visitor content.
 */

// Import focused test primitives and the pure state helpers that surround browser storage access.
import { describe, expect, it } from "vitest";

import { initialSanctuaryMvpState, transitionSanctuaryMvp } from "./model";
import {
  persistSanctuaryMvpState,
  restoreSanctuaryMvpState,
  sanctuarySessionStorageKey,
} from "./sessionState";

// Represent only the get and set operations used by the continuity boundary, keeping each test browser-independent.
function createMemoryStorage(initialValue: string | null = null) {
  let value = initialValue;
  const writes: [string, string][] = [];

  return {
    getItem: (key: string): string | null => (key === sanctuarySessionStorageKey ? value : null),
    setItem: (key: string, nextValue: string): void => {
      writes.push([key, nextValue]);
      if (key === sanctuarySessionStorageKey) {
        value = nextValue;
      }
    },
    writes,
  };
}

// Confirm valid state names restore as settled states before any visitor viewport would mount.
describe("sanctuary same-tab state restoration", () => {
  it.each(["SANCTUARY", "SIT", "READ", "PRAY"] as const)(
    "restores a valid %s state directly",
    (stateName) => {
      expect(restoreSanctuaryMvpState(createMemoryStorage(stateName))).toEqual({ name: stateName });
    },
  );

  it("falls back calmly to SANCTUARY for invalid or missing state values", () => {
    expect(restoreSanctuaryMvpState(createMemoryStorage("moving-at-0.41"))).toEqual(
      initialSanctuaryMvpState,
    );
    expect(restoreSanctuaryMvpState(createMemoryStorage())).toEqual(initialSanctuaryMvpState);
  });

  it("falls back calmly when a storage read throws", () => {
    expect(
      restoreSanctuaryMvpState({
        getItem: () => {
          throw new Error("Storage unavailable");
        },
      }),
    ).toEqual(initialSanctuaryMvpState);
  });
});

// Confirm the reducer's legal sequence writes only settled names and never camera or presentation facts.
describe("sanctuary same-tab state persistence", () => {
  it("writes each legal durable transition as the next state name only", () => {
    const storage = createMemoryStorage();
    const sit = transitionSanctuaryMvp(initialSanctuaryMvpState, "SIT");
    const read = transitionSanctuaryMvp(sit, "READ_BIBLE");
    const pray = transitionSanctuaryMvp(read, "ENTER_PRAYER");
    const returned = transitionSanctuaryMvp(pray, "RETURN_TO_SANCTUARY");

    for (const state of [sit, read, pray, returned]) {
      persistSanctuaryMvpState(storage, state);
    }

    expect(storage.writes).toEqual([
      [sanctuarySessionStorageKey, "SIT"],
      [sanctuarySessionStorageKey, "READ"],
      [sanctuarySessionStorageKey, "PRAY"],
      [sanctuarySessionStorageKey, "SANCTUARY"],
    ]);
  });

  it("keeps the Home return payload equally minimal", () => {
    const storage = createMemoryStorage();
    const returned = transitionSanctuaryMvp({ name: "READ" }, "RETURN_HOME_TO_SANCTUARY");

    persistSanctuaryMvpState(storage, returned);

    expect(storage.writes).toEqual([[sanctuarySessionStorageKey, "SANCTUARY"]]);
  });

  it("keeps the sanctuary usable when a storage write throws", () => {
    expect(() => {
      persistSanctuaryMvpState(
        {
          setItem: () => {
            throw new Error("Storage unavailable");
          },
        },
        { name: "SIT" },
      );
    }).not.toThrow();
  });
});
