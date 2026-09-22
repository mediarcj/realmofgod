// File: apps/sanctuary/scripts/materials.test.mjs
// Description: Protects semantic runtime material resolution.
// Purpose: Prevents a generic fallback from flattening the accepted sanctuary families.
// Notes: Resolver tests use exact exported-unit and source-material semantics only.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { materialProjectionMode, materialTextureSet, materialTint, materialUsesColorTexture, resolveSanctuaryMaterial } from "../lib/sanctuary/materials.ts";
import { baselineLookdev, blenderBakedLookdev, defaultLookdev, developmentLookdevProfile, developmentTone, enhancedLookdev, giLookdev, isLookdevProfile, photorealLookdev } from "../lib/sanctuary/lookdev.ts";

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
test("v28 architecture source labels resolve to their explicit runtime PBR families", () => {
  const names = {
    MAT_SANCTUARY_WALL_WALNUT_REFERENCE: "wallWood", MAT_ALTAR_REREDOS_DARK_WALNUT_REFERENCE: "altarWood",
    MAT_UPPER_WINDOW_MULLION_WEATHERED_OAK: "windowMullion", MAT_UPPER_WINDOW_GLASS_SEEDED: "windowGlass",
    MAT_SANCTUARY_STRINGCOURSE_DARK_WALNUT: "stringcourseWood", MAT_SANCTUARY_BASEBOARD_DEEP_UMBER: "baseboardWood",
    MAT_SANCTUARY_FLOOR_WEATHERED_WALNUT: "floorWood", MAT_CEILING_PANEL_WARM_WALNUT_REFERENCE: "ceilingPanelWood",
    MAT_CEILING_BEAM_ESPRESSO_REFERENCE: "ceilingBeamWood", MAT_CEILING_CROSS_DARK_WOOD: "ceilingCross",
    MAT_CROSS_METAL_AGED_RENAISSANCE: "agedMetal",
  };
  for (const [source, family] of Object.entries(names)) assert.equal(resolveSanctuaryMaterial("sanctuary-architecture", "v28 mesh", source).family, family, source);
  assert.equal(resolveSanctuaryMaterial("sanctuary-architecture", "v28 mesh", "Ivory molding").family, "plasterMolding");
});

test("altar cross assemblies resolve as aged metal without changing their source geometry", () => {
  assert.equal(resolveSanctuaryMaterial("altar-cross-center", "mesh_0.008", "MAT_STONE_ALTAR_WARM_IVORY").family, "agedMetal");
  assert.equal(resolveSanctuaryMaterial("altar-cross-sides", "mesh_0.010", "MAT_STONE_ALTAR_WARM_IVORY").family, "agedMetal");
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

test("legacy families retain their PBR sources while v28 architecture uses neutral detail projection", () => {
  assert.equal(materialTextureSet("floorWood"), "agedFloor");
  assert.equal(materialTextureSet("wallWood"), "cabinet");
  assert.equal(materialTextureSet("ceilingWood"), "walnut");
  assert.equal(materialProjectionMode("tableWood", false), "object-space-wood");
  assert.equal(materialTextureSet("bibleLeather"), "leather");
  assert.equal(materialTextureSet("plasterBody"), "plaster");
  assert.equal(materialProjectionMode("wallWood", true), "object-space-wood");
  assert.equal(materialProjectionMode("wallWood", false), "object-space-wood");
  assert.equal(materialProjectionMode("plasterBody", false), "triplanar");
});

test("v28 architecture semantic families keep their Blender-parity base colors", () => {
  for (const family of ["bibleLeather", "plasterBody"]) {
    assert.equal(materialTint(family), "#fffaf3");
  }
  assert.equal(materialTint("trimWood"), "#70462d");
  assert.equal(materialTint("ceilingWood"), "#5b3725");
  assert.equal(materialTint("windowWood"), "#633b25");
  assert.equal(materialTint("wallWood"), "#4d2b18");
  assert.equal(materialTint("altarWood"), "#1f110a");
  assert.equal(materialTint("floorWood"), "#2e190e");
  assert.equal(materialTint("ceilingPanelWood"), "#5c4033");
  assert.equal(materialTint("ceilingBeamWood"), "#2a1b12");
  assert.equal(materialTint("tableWood"), "#f3eee6");
  assert.equal(materialTint("kneelingWood"), "#382016");
  assert.equal(materialTint("agedMetal"), "#6b4e31");
});

test("v28 wall materials omit the legacy albedo while retaining neutral PBR detail", () => {
  for (const family of ["wallWood", "altarWood", "windowMullion", "stringcourseWood", "baseboardWood", "floorWood", "ceilingPanelWood", "ceilingBeamWood", "ceilingCross"]) assert.equal(materialUsesColorTexture(family), false, family);
  assert.equal(materialUsesColorTexture("tableWood"), true);
  const source = readFileSync(new URL("../lib/sanctuary/materials.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /fine_grained_wood_col_2k/);
});

test("prepared semantic material labels take precedence over object-name fallback", () => {
  assert.equal(resolveSanctuaryMaterial("bible", "ROG_BIBLE_HYPER3D_MASTER", "MAT_BIBLE_PAGE_PAPER").family, "biblePages");
  assert.equal(resolveSanctuaryMaterial("bible", "ROG_BIBLE_HYPER3D_MASTER", "MAT_BIBLE_PAGE_EDGES").family, "biblePageEdges");
  assert.equal(resolveSanctuaryMaterial("bible", "ROG_BIBLE_HYPER3D_MASTER", "MAT_BIBLE_COVER_LEATHER").family, "bibleCover");
  assert.equal(resolveSanctuaryMaterial("altar-candles-large", "ALTAR_ACC_HYPER3D_LARGE_LEFT_MASTER", "MAT_CANDLE_METAL_AGED").family, "candleMetal");
  assert.equal(resolveSanctuaryMaterial("kneeling-rest", "ROG_KNEE_REST_HYPER3D_MASTER", "MAT_KNEELER_CUSHION").family, "kneelingCushion");
});

test("referenced material texture assets exist and material debug remains calibration-gated", () => {
  for (const file of [
    "../public/textures/polyhaven/old_wooden_floor_01/old_wooden_floor_01_diff_2k.jpg",
    "../public/textures/polyhaven/old_wooden_floor_01/old_wooden_floor_01_nor_gl_2k.jpg",
    "../public/textures/polyhaven/old_wooden_floor_01/old_wooden_floor_01_rough_2k.jpg",
    "../public/textures/polyhaven/wood_cabinet_worn_long/wood_cabinet_worn_long_diff_2k.jpg",
    "../public/textures/polyhaven/wood_cabinet_worn_long/wood_cabinet_worn_long_nor_gl_2k.jpg",
    "../public/textures/polyhaven/wood_cabinet_worn_long/wood_cabinet_worn_long_rough_2k.jpg",
    "../public/textures/polyhaven/wood_floor/wood_floor_diff_1k.jpg",
    "../public/textures/polyhaven/fine_grained_wood/fine_grained_wood_col_2k.jpg",
    "../public/textures/polyhaven/walnut_veneer/walnut_veneer_diff_2k.jpg",
    "../public/textures/polyhaven/fabric_leather_02/fabric_leather_02_diff_2k.jpg",
    "../public/textures/polyhaven/white_plaster_02/white_plaster_02_diff_2k.jpg",
  ]) assert(existsSync(new URL(file, import.meta.url)));
  const canvas = readFileSync(new URL("../components/sanctuary/SanctuaryCanvas.tsx", import.meta.url), "utf8");
  assert.match(canvas, /calibrationEnabled && <MaterialDebugReadout/);
});

test("lookdev defaults stay bounded and local-profile support remains production-isolated", () => {
  assert(isLookdevProfile(defaultLookdev));
  assert(isLookdevProfile(baselineLookdev));
  assert(isLookdevProfile(enhancedLookdev));
  assert(isLookdevProfile(photorealLookdev));
  assert(isLookdevProfile(giLookdev));
  assert(isLookdevProfile(blenderBakedLookdev));
  assert.equal(developmentLookdevProfile("?lookdev=baseline"), baselineLookdev);
  assert.equal(developmentLookdevProfile("?lookdev=enhanced"), enhancedLookdev);
  assert.equal(developmentLookdevProfile("?lookdev=photoreal"), photorealLookdev);
  assert.equal(developmentLookdevProfile("?lookdev=gi"), giLookdev);
  assert.equal(developmentLookdevProfile("?lookdev=blender-baked"), blenderBakedLookdev);
  assert.equal(developmentTone("?tone=aces"), "aces");
  assert.equal(developmentTone("?tone=agx"), "agx");
  assert.equal(developmentLookdevProfile("?lookdev=unknown"), null);
  const experience = readFileSync(new URL("../components/sanctuary/SanctuaryExperience.tsx", import.meta.url), "utf8");
  const route = readFileSync(new URL("../app/api/lookdev-calibration/route.ts", import.meta.url), "utf8");
  assert.match(experience, /calibrationAvailable && calibrationEnabled && <LookdevControls/);
  assert.match(experience, /process\.env\.NODE_ENV === "production"/);
  assert.match(route, /NODE_ENV !== "production"/);
  const ignore = readFileSync(new URL("../../../.gitignore", import.meta.url), "utf8");
  assert.match(ignore, /apps\/sanctuary\/\.lookdev-calibration\.local\.json/);
});

test("runtime candle flames stay disabled until the v27 source regions are visually verified", () => {
  const atmosphere = readFileSync(new URL("../components/sanctuary/SanctuaryAtmosphere.tsx", import.meta.url), "utf8");
  assert.match(atmosphere, /const runtimeFlamesEnabled = false/);
  assert.match(atmosphere, /runtimeFlamesEnabled && <CandleFlames/);
  assert.match(atmosphere, /const runtimeAtmosphericsEnabled = false/);
});
