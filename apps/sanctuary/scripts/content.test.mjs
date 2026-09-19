// File: apps/sanctuary/scripts/content.test.mjs
// Description: Tests the safe Scripture content boundary.
// Purpose: Prevents unlicensed or incomplete placeholder readings from appearing as Scripture.
// Notes: The default source must remain empty until approved content is supplied.

import { test } from "node:test";
import assert from "node:assert/strict";
import { historicalScripture, scriptureSource, isCompleteReading } from "../lib/sanctuary/content.ts";
test("unconfigured content does not invent a reading", async () => { assert.equal(await scriptureSource.read(), null); });
test("readings require reference, text, translation and attribution", () => {
  const fixture = { reference: "test reference", text: "test fixture only", translation: "test edition", attribution: "test license" };
  assert(isCompleteReading(fixture));
  for (const key of Object.keys(fixture)) assert(!isCompleteReading({...fixture, [key]: " "}));
});
test("the historical Bible reference does not contain unapproved verse wording", () => {
  assert.equal(historicalScripture.reference, "Psalm 46:10");
  assert.equal(historicalScripture.status, "translation-and-licensing-pending");
  assert.equal("text" in historicalScripture, false);
});
