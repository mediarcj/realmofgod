// File: apps/sanctuary/scripts/materials.test.mjs
// Description: Protects semantic runtime material resolution.
// Purpose: Prevents a generic fallback from flattening the accepted sanctuary families.
// Notes: Resolver tests use exact exported-unit and source-material semantics only.

import { test } from "node:test";
import assert from "node:assert/strict";
import { materialProjectionMode, materialTextureSet, resolveSanctuaryMaterial } from "../lib/sanctuary/materials.ts";

test("major construction units resolve to distinct intentional material families", () => {
  assert.equal(resolveSanctuaryMaterial("floor", "ROG_V2_Floor_Planks_AUTH_Mesh.001").family, "floorWood");
  assert.equal(resolveSanctuaryMaterial("north-wall", "Cube.001").family, "wallWood");
  assert.equal(resolveSanctuaryMaterial("ceiling-coffers", "ROG_V2_CofferFrame_R1_C1_CLEAN_Mesh.001").family, "ceilingWood");
  assert.equal(resolveSanctuaryMaterial("table", "ROG_TABLE_HYPER3D_MASTER_Mesh.002", "MAT_WOOD_TABLE_DARK_WALNUT").family, "tableWood");
  assert.equal(resolveSanctuaryMaterial("bible", "ROG_BIBLE_HYPER3D_MASTER_Mesh.002", "MAT_LEATHER_BIBLE_AGED_TAN").family, "bibleLeather");
});

test("accepted source material labels retain plaster zone distinctions", () => {
  assert.equal(resolveSanctuaryMaterial("altar-reredos", "ARCH_CENTER", "MAT_PLASTER_IVORY_BODY").family, "plasterBody");
  assert.equal(resolveSanctuaryMaterial("altar-reredos", "ARCH_CENTER", "MAT_PLASTER_IVORY_MOLDING").family, "plasterMolding");
  assert.equal(resolveSanctuaryMaterial("altar-reredos", "ARCH_CENTER", "MAT_PLASTER_RECESS_IVORY").family, "plasterRecess");
});

test("window semantics distinguish glazing from accepted joinery names", () => {
  assert.equal(resolveSanctuaryMaterial("north-window-1", "ROG_V2_NorthClerestory_1_AUTH_LeafL_GlazingStop_R1C1_REPAIR_Mesh.001").family, "windowWood");
  assert.equal(resolveSanctuaryMaterial("north-window-1", "ROG_V2_NorthClerestory_1_AUTH_Casing_Mesh.002").family, "windowWood");
  assert.equal(resolveSanctuaryMaterial("north-window-1", "Cube.001", "MAT_GLASS_ARCHITECTURE_CLEAR").family, "windowGlass");
});

test("only the named ceiling cross receives two-sided rendering", () => {
  assert.equal(resolveSanctuaryMaterial("ceiling-structure", "ROG_V2_CeilingCross_CLEAN_Mesh.001").family, "ceilingCross");
  assert.equal(resolveSanctuaryMaterial("ceiling-structure", "Cube.001").family, "ceilingWood");
});

test("wood families use distinct cached PBR sources and UV-less wood uses projection", () => {
  assert.equal(materialTextureSet("floorWood"), "floor");
  assert.equal(materialTextureSet("wallWood"), "fine");
  assert.equal(materialTextureSet("ceilingWood"), "walnut");
  assert.equal(materialProjectionMode("tableWood", false), "triplanar");
  assert.equal(materialProjectionMode("wallWood", true), "authored-uv");
  assert.equal(materialProjectionMode("plasterBody", false), "none");
});
