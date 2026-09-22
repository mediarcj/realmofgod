// File: apps/sanctuary/lib/sanctuary/materials.ts
// Description: Resolves browser PBR materials from accepted sanctuary semantics.
// Purpose: Keeps Blender geometry and semantic zones authoritative while giving runtime surfaces intentional response.
// Notes: Texture-bearing maps are only added to derivatives with authored compatible UVs.

import { Color, DoubleSide, FrontSide, MeshPhysicalMaterial, MeshStandardMaterial, RepeatWrapping, SRGBColorSpace, TextureLoader, Vector2, Vector3, type Material, type Side, type Texture } from "three";

export type SanctuaryMaterialFamily =
  | "ceilingWood"
  | "ceilingCross"
  | "wallWood"
  | "trimWood"
  | "floorWood"
  | "plasterBody"
  | "plasterMolding"
  | "plasterRecess"
  | "altarStone"
  | "agedMetal"
  | "tableWood"
  | "bibleLeather"
  | "biblePages"
  | "biblePageEdges"
  | "bibleCover"
  | "bibleBinding"
  | "kneelingWood"
  | "kneelingCushion"
  | "kneelingOrnament"
  | "windowGlass"
  | "windowWood"
  | "candleWax"
  | "candleMetal"
  | "candleWick"
  | "candleFlame"
  | "altarWood"
  | "windowMullion"
  | "stringcourseWood"
  | "baseboardWood"
  | "ceilingPanelWood"
  | "ceilingBeamWood"
  | "fallback";

export type MaterialResolution = { family: SanctuaryMaterialFamily; source: string; fallback?: boolean };

const ceilingCrossMesh = "ROG_V2_CeilingCross_CLEAN_Mesh.001";
const windowWoodTerms = ["casing", "sash", "stop", "astragal", "mullion", "frame"];
const woodFamilies = new Set<SanctuaryMaterialFamily>(["ceilingWood", "wallWood", "trimWood", "floorWood", "tableWood", "kneelingWood", "windowWood"]);
type TextureSet = "floor" | "agedFloor" | "cabinet" | "fine" | "walnut" | "leather" | "plaster";
type PbrTextures = { albedo: Texture; normal: Texture; roughness: Texture };
const texturePaths: Record<TextureSet, { albedo: string; normal: string; roughness: string; repeat: number }> = {
  floor: { albedo: "/textures/polyhaven/wood_floor/wood_floor_diff_1k.jpg", normal: "/textures/polyhaven/wood_floor/wood_floor_nor_gl_1k.jpg", roughness: "/textures/polyhaven/wood_floor/wood_floor_arm_1k.jpg", repeat: 2.8 },
  agedFloor: { albedo: "/textures/polyhaven/old_wooden_floor_01/old_wooden_floor_01_diff_2k.jpg", normal: "/textures/polyhaven/old_wooden_floor_01/old_wooden_floor_01_nor_gl_2k.jpg", roughness: "/textures/polyhaven/old_wooden_floor_01/old_wooden_floor_01_rough_2k.jpg", repeat: 1 },
  cabinet: { albedo: "/textures/polyhaven/wood_cabinet_worn_long/wood_cabinet_worn_long_diff_2k.jpg", normal: "/textures/polyhaven/wood_cabinet_worn_long/wood_cabinet_worn_long_nor_gl_2k.jpg", roughness: "/textures/polyhaven/wood_cabinet_worn_long/wood_cabinet_worn_long_rough_2k.jpg", repeat: 1 },
  fine: { albedo: "/textures/polyhaven/walnut_veneer/walnut_veneer_diff_2k.jpg", normal: "/textures/polyhaven/fine_grained_wood/fine_grained_wood_nor_gl_2k.jpg", roughness: "/textures/polyhaven/fine_grained_wood/fine_grained_wood_rough_2k.jpg", repeat: 2.15 },
  walnut: { albedo: "/textures/polyhaven/walnut_veneer/walnut_veneer_diff_2k.jpg", normal: "/textures/polyhaven/walnut_veneer/walnut_veneer_nor_gl_2k.jpg", roughness: "/textures/polyhaven/walnut_veneer/walnut_veneer_rough_2k.jpg", repeat: 1.45 },
  leather: { albedo: "/textures/polyhaven/fabric_leather_02/fabric_leather_02_diff_2k.jpg", normal: "/textures/polyhaven/fabric_leather_02/fabric_leather_02_nor_gl_2k.jpg", roughness: "/textures/polyhaven/fabric_leather_02/fabric_leather_02_rough_2k.jpg", repeat: 3.2 },
  plaster: { albedo: "/textures/polyhaven/white_plaster_02/white_plaster_02_diff_2k.jpg", normal: "/textures/polyhaven/white_plaster_02/white_plaster_02_nor_gl_2k.jpg", roughness: "/textures/polyhaven/white_plaster_02/white_plaster_02_rough_2k.jpg", repeat: 3.6 },
};
const textureSetForFamily: Record<SanctuaryMaterialFamily, TextureSet | null> = {
  wallWood: "cabinet", ceilingWood: "walnut", trimWood: "fine", floorWood: "agedFloor", tableWood: "walnut", kneelingWood: "fine", windowWood: "walnut",
  ceilingCross: "walnut", plasterBody: "plaster", plasterMolding: "plaster", plasterRecess: "plaster", altarStone: "plaster", agedMetal: null, bibleLeather: "leather", biblePages: null, biblePageEdges: null, bibleCover: "leather", bibleBinding: "leather", kneelingCushion: "leather", kneelingOrnament: null, windowGlass: null, candleWax: null, candleMetal: null, candleWick: null, candleFlame: null, altarWood: "walnut", windowMullion: "walnut", stringcourseWood: "walnut", baseboardWood: "walnut", ceilingPanelWood: "walnut", ceilingBeamWood: "walnut", fallback: null,
};
let pbrTextures: Partial<Record<TextureSet, PbrTextures>> = {};
function getPbrTextures(textureSet: TextureSet): PbrTextures {
  const cached = pbrTextures[textureSet];
  if (cached) return cached;
  const loader = new TextureLoader();
  const paths = texturePaths[textureSet];
  const albedo = loader.load(paths.albedo); albedo.colorSpace = SRGBColorSpace;
  const normal = loader.load(paths.normal);
  const roughness = loader.load(paths.roughness);
  for (const texture of [albedo, normal, roughness]) {
    texture.wrapS = RepeatWrapping; texture.wrapT = RepeatWrapping; texture.repeat.set(paths.repeat, paths.repeat);
  }
  const loaded = { albedo, normal, roughness };
  pbrTextures = { ...pbrTextures, [textureSet]: loaded };
  return loaded;
}

function seedFromName(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  return (hash >>> 0) / 4294967295;
}

function addProjectedPbr(material: MeshStandardMaterial, textures: PbrTextures, meshName: string, scale: number, useAlbedo: boolean, grain?: WoodGrainDetail) {
  const seed = seedFromName(meshName);
  const useWoodScan = !useAlbedo && Boolean(grain?.albedoStrength);
  material.onBeforeCompile = (shader) => {
    if (useAlbedo || useWoodScan) shader.uniforms.realmBaseMap = { value: textures.albedo };
    shader.uniforms.realmNormalMap = { value: textures.normal };
    shader.uniforms.realmRoughnessMap = { value: textures.roughness };
    shader.uniforms.realmProjectionScale = { value: scale * (0.92 + seed * .16) };
    shader.uniforms.realmProjectionOffset = { value: new Vector2(seed * 13.7, seed * 7.3) };
    shader.uniforms.realmProjectionTone = { value: .93 + seed * .14 };
    if (grain) {
      shader.uniforms.realmWoodAxis = { value: new Vector3(...grain.axis) };
      shader.uniforms.realmWoodScale = { value: grain.scale };
      shader.uniforms.realmWoodContrast = { value: grain.contrast };
      shader.uniforms.realmWoodRoughness = { value: grain.roughness };
      shader.uniforms.realmWoodScanStrength = { value: grain.albedoStrength ?? 0 };
    }
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 realmWorldPosition;\nvarying vec3 realmWorldNormal;\nvarying vec3 realmObjectPosition;")
      .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nrealmWorldPosition = worldPosition.xyz;\nrealmWorldNormal = normalize(mat3(modelMatrix) * objectNormal);\nrealmObjectPosition = transformed;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>
varying vec3 realmWorldPosition;
varying vec3 realmWorldNormal;
varying vec3 realmObjectPosition;
${useAlbedo || useWoodScan ? "uniform sampler2D realmBaseMap;" : ""}
uniform sampler2D realmNormalMap;
uniform sampler2D realmRoughnessMap;
uniform float realmProjectionScale;
uniform vec2 realmProjectionOffset;
uniform float realmProjectionTone;
${grain ? "uniform vec3 realmWoodAxis;\nuniform float realmWoodScale;\nuniform float realmWoodContrast;\nuniform float realmWoodRoughness;\nuniform float realmWoodScanStrength;" : ""}
vec3 realmTriSample(sampler2D image, vec3 position, vec3 normal) {
  vec3 weights = abs(normal); weights = max(weights, vec3(0.0001)); weights /= (weights.x + weights.y + weights.z);
  vec2 xy = position.xy * realmProjectionScale + realmProjectionOffset;
  vec2 xz = position.xz * realmProjectionScale + realmProjectionOffset.yx;
  vec2 yz = position.yz * realmProjectionScale + realmProjectionOffset;
  return texture2D(image, yz).rgb * weights.x + texture2D(image, xz).rgb * weights.y + texture2D(image, xy).rgb * weights.z;
}
${grain ? `float realmWoodHash(vec3 value) { return fract(sin(dot(value, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float realmWoodNoise(vec3 value) {
  vec3 cell = floor(value); vec3 local = fract(value); local = local * local * (3.0 - 2.0 * local);
  return mix(mix(mix(realmWoodHash(cell), realmWoodHash(cell + vec3(1., 0., 0.)), local.x), mix(realmWoodHash(cell + vec3(0., 1., 0.)), realmWoodHash(cell + vec3(1., 1., 0.)), local.x), local.y), mix(mix(realmWoodHash(cell + vec3(0., 0., 1.)), realmWoodHash(cell + vec3(1., 0., 1.)), local.x), mix(realmWoodHash(cell + vec3(0., 1., 1.)), realmWoodHash(cell + vec3(1., 1., 1.)), local.x), local.y), local.z);
}
float realmWoodFbm(vec3 value) {
  float sum = 0.0; float gain = .5;
  for (int octave = 0; octave < 3; octave++) { sum += realmWoodNoise(value) * gain; value = value * 2.03 + 7.1; gain *= .5; }
  return sum / .875;
}
float realmWoodGrain(vec3 position) {
  vec3 axis = normalize(realmWoodAxis);
  float along = dot(position, axis);
  vec3 across = position - axis * along;
  vec3 grainPoint = across * realmWoodScale + axis * along * .38 + realmProjectionOffset.xyx;
  float warp = realmWoodFbm(grainPoint * .21) * 4.1 + realmWoodFbm(grainPoint * .66) * 1.15;
  float growth = sin((across.x + across.y * 1.73 + across.z * 2.37) * realmWoodScale + warp);
  float pores = realmWoodFbm(grainPoint * 7.6);
  float figure = pow(abs(growth), 2.15);
  return clamp(.34 + growth * .18 + figure * .29 + (pores - .5) * .18, .0, 1.0);
}` : ""}`)
      .replace("#include <map_fragment>", `${useAlbedo ? "vec3 realmBaseColor = pow(realmTriSample(realmBaseMap, realmWorldPosition, realmWorldNormal), vec3(2.2));\ndiffuseColor.rgb *= realmBaseColor * realmProjectionTone;" : useWoodScan ? "vec3 realmWoodScan = pow(realmTriSample(realmBaseMap, realmWorldPosition, realmWorldNormal), vec3(2.2));\nfloat realmWoodLuma = max(dot(realmWoodScan, vec3(.2126, .7152, .0722)), .001);\nvec3 realmWoodChroma = realmWoodScan / realmWoodLuma;\nvec3 realmWoodPhotoResponse = realmWoodChroma * clamp(.67 + realmWoodLuma * 1.32, .72, 1.2);\ndiffuseColor.rgb *= mix(vec3(1.0), realmWoodPhotoResponse, realmWoodScanStrength);" : ""}${grain ? "\nfloat realmGrain = realmWoodGrain(realmObjectPosition);\ndiffuseColor.rgb *= mix(1.0 - realmWoodContrast, 1.0 + realmWoodContrast, realmGrain);" : ""}`)
      .replace("#include <roughnessmap_fragment>", `#include <roughnessmap_fragment>
roughnessFactor *= mix(0.72, 1.18, realmTriSample(realmRoughnessMap, realmWorldPosition, realmWorldNormal).g);${grain ? "\nroughnessFactor *= mix(.82, realmWoodRoughness, realmWoodGrain(realmObjectPosition));" : ""}`)
      .replace("#include <normal_fragment_begin>", "#include <normal_fragment_begin>\nvec3 realmDetailNormal = realmTriSample(realmNormalMap, realmWorldPosition, realmWorldNormal) * 2.0 - 1.0;\nnormal = normalize(normal + realmDetailNormal * 0.045);");
  };
  material.customProgramCacheKey = () => `realm-triplanar-pbr-v4-${useAlbedo ? "albedo" : useWoodScan ? "wood-scan" : "neutral"}-${grain ? "wood" : "surface"}`;
}

function addBiblePageDetail(material: MeshPhysicalMaterial, meshName: string, pageEdges: boolean) {
  const seed = seedFromName(meshName);
  material.onBeforeCompile = (shader) => {
    shader.uniforms.realmBibleSeed = { value: seed * 23.17 };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 realmBiblePosition;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nrealmBiblePosition = transformed;");
    const pageColor = pageEdges
      ? `vec3 realmPagePoint = realmBiblePosition * 22.0;
float realmStack = .55 + .45 * sin(realmPagePoint.y * 19.0 + realmPagePoint.x * 2.0);
diffuseColor.rgb *= mix(vec3(.62, .43, .24), vec3(1.0, .84, .59), realmStack);`
      : `vec2 realmPageUv = realmBiblePosition.xz * 26.0;
float realmFiber = realmBibleHash(floor(realmPageUv * 7.0));
float realmRows = smoothstep(.83, .96, fract(realmPageUv.y * 6.0));
float realmGlyphs = step(.26, realmBibleHash(vec2(floor(realmPageUv.x * 19.0), floor(realmPageUv.y * 31.0))));
float realmInk = realmRows * realmGlyphs * .36;
float realmGutter = exp(-abs(realmBiblePosition.x) * 18.0) * .12;
diffuseColor.rgb *= mix(.91, 1.07, realmFiber);
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.12, .075, .035), realmInk + realmGutter);`;
    const pageRoughness = pageEdges
      ? ".92 + .12 * sin(realmBiblePosition.y * 418.0)"
      : ".90 + .12 * realmBibleHash(floor(realmBiblePosition.xz * 180.0))";
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 realmBiblePosition;\nuniform float realmBibleSeed;\nfloat realmBibleHash(vec2 value) { return fract(sin(dot(value, vec2(127.1, 311.7)) + realmBibleSeed) * 43758.5453); }")
      .replace("#include <map_fragment>", pageColor)
      .replace("#include <roughnessmap_fragment>", `#include <roughnessmap_fragment>\nroughnessFactor *= ${pageRoughness};`);
  };
  material.customProgramCacheKey = () => `realm-bible-page-v2-${pageEdges ? "edges" : "paper"}`;
}

/** Subtle non-geometric wax bloom and cast-metal patina keep smooth source meshes from reading as flat paint. */
function addSurfaceMicrodetail(material: MeshStandardMaterial | MeshPhysicalMaterial, meshName: string, kind: "wax" | "metal") {
  const seed = seedFromName(meshName);
  material.onBeforeCompile = (shader) => {
    shader.uniforms.realmSurfaceSeed = { value: seed * 41.71 };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 realmSurfacePosition;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nrealmSurfacePosition = transformed;");
    const detail = kind === "wax"
      ? `float realmBloom = realmSurfaceNoise(realmSurfacePosition * 17.0);
diffuseColor.rgb *= mix(vec3(.94, .89, .76), vec3(1.035, 1.01, .92), realmBloom);`
      : `float realmPatina = smoothstep(.72, .91, realmSurfaceNoise(realmSurfacePosition * 11.0));
diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(.62, .78, .61), realmPatina * .16);`;
    const roughness = kind === "wax"
      ? "mix(.88, 1.13, realmSurfaceNoise(realmSurfacePosition * 31.0))"
      : "mix(.80, 1.18, realmSurfaceNoise(realmSurfacePosition * 23.0))";
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 realmSurfacePosition;\nuniform float realmSurfaceSeed;\nfloat realmSurfaceNoise(vec3 value) { return fract(sin(dot(floor(value), vec3(127.1, 311.7, 74.7)) + realmSurfaceSeed) * 43758.5453); }")
      .replace("#include <map_fragment>", detail)
      .replace("#include <roughnessmap_fragment>", `#include <roughnessmap_fragment>\nroughnessFactor *= ${roughness};`);
  };
  material.customProgramCacheKey = () => `realm-${kind}-microdetail-v1`;
}

const byUnit: Partial<Record<string, SanctuaryMaterialFamily>> = {
  floor: "floorWood",
  "north-wall": "wallWood",
  "east-wall": "wallWood",
  "west-wall": "wallWood",
  "east-wall-panels": "wallWood",
  "west-wall-panels": "wallWood",
  baseboard: "trimWood",
  "east-stringcourse": "trimWood",
  "west-stringcourse": "trimWood",
  "ceiling-structure": "ceilingWood",
  "ceiling-coffers": "ceilingWood",
  "altar-base": "plasterBody",
  "altar-reredos": "plasterBody",
  "altar-pedestals": "plasterBody",
  "altar-pilasters": "plasterBody",
  "altar-cornice": "plasterMolding",
  "altar-corbels": "plasterMolding",
  "altar-cross-center": "agedMetal",
  "altar-cross-sides": "agedMetal",
  "altar-candles-large": "candleWax",
  "altar-candles-medium": "candleWax",
  "altar-candles-runtime": "candleWax",
  table: "tableWood",
  bible: "bibleLeather",
  "kneeling-rest": "kneelingWood",
};

/** Resolves only from exported unit, accepted mesh name, and accepted source-material label. */
export function resolveSanctuaryMaterial(unit: string, meshName: string, sourceMaterialName = ""): MaterialResolution {
  const mesh = meshName.toLowerCase();
  const source = sourceMaterialName.toLowerCase();
  if (meshName === ceilingCrossMesh) return { family: "ceilingCross", source: "ceiling-cross mesh" };
  const architectureMaterials: Record<string, SanctuaryMaterialFamily> = {
    mat_sanctuary_wall_walnut_reference: "wallWood",
    mat_altar_reredos_dark_walnut_reference: "altarWood",
    mat_upper_window_mullion_weathered_oak: "windowMullion",
    mat_upper_window_glass_seeded: "windowGlass",
    mat_sanctuary_stringcourse_dark_walnut: "stringcourseWood",
    mat_sanctuary_baseboard_deep_umber: "baseboardWood",
    mat_sanctuary_floor_weathered_walnut: "floorWood",
    mat_ceiling_panel_warm_walnut_reference: "ceilingPanelWood",
    mat_ceiling_beam_espresso_reference: "ceilingBeamWood",
    mat_ceiling_cross_dark_wood: "ceilingCross",
    mat_cross_metal_aged_renaissance: "agedMetal",
  };
  if (architectureMaterials[source]) return { family: architectureMaterials[source], source: sourceMaterialName };
  if (source === "ivory molding") return { family: "plasterMolding", source: sourceMaterialName };
  if (unit === "altar-cross-center" || unit === "altar-cross-sides") return { family: "agedMetal", source: "altar cross assembly" };
  if (unit.includes("window")) {
    if (windowWoodTerms.some((term) => mesh.includes(term))) return { family: "windowWood", source: "window joinery" };
    if (source.includes("glass")) return { family: "windowGlass", source: sourceMaterialName };
    return { family: "windowWood", source: "window unit" };
  }
  if (source.includes("plaster_recess")) return { family: "plasterRecess", source: sourceMaterialName };
  if (source.includes("plaster_ivory_molding")) return { family: "plasterMolding", source: sourceMaterialName };
  if (source.includes("plaster_ivory")) return { family: "plasterBody", source: sourceMaterialName };
  if (source.includes("leather_bible")) return { family: "bibleLeather", source: sourceMaterialName };
  if (source.includes("bible_page_edges")) return { family: "biblePageEdges", source: sourceMaterialName };
  if (source.includes("bible_page")) return { family: "biblePages", source: sourceMaterialName };
  if (source.includes("bible_cover")) return { family: "bibleCover", source: sourceMaterialName };
  if (source.includes("bible_binding")) return { family: "bibleBinding", source: sourceMaterialName };
  if (source.includes("candle_flame_source")) return { family: "candleFlame", source: sourceMaterialName };
  if (source.includes("candle_metal")) return { family: "candleMetal", source: sourceMaterialName };
  if (source.includes("candle_wick")) return { family: "candleWick", source: sourceMaterialName };
  if (source.includes("candle_wax")) return { family: "candleWax", source: sourceMaterialName };
  if (source.includes("kneeler_cushion")) return { family: "kneelingCushion", source: sourceMaterialName };
  if (source.includes("kneeler_ornament")) return { family: "kneelingOrnament", source: sourceMaterialName };
  if (source.includes("wood_table")) return { family: "tableWood", source: sourceMaterialName };
  if (source.includes("wood_knee")) return { family: "kneelingWood", source: sourceMaterialName };
  if (source.includes("stone_altar")) return { family: "altarStone", source: sourceMaterialName };
  return { family: byUnit[unit] ?? "fallback", source: byUnit[unit] ? "semantic unit" : "unclassified unit", fallback: !byUnit[unit] };
}

type MaterialRecipe = { color: string; roughness: number; metalness?: number; side?: Side; envMapIntensity?: number; transparent?: boolean; opacity?: number; projectionScale?: number; colorTexture?: boolean; clearcoat?: number; clearcoatRoughness?: number };
type WoodGrainDetail = { axis: [number, number, number]; scale: number; contrast: number; roughness: number; albedoStrength?: number };

// Object-space grain directions vary by construction family. They augment the
// accepted semantic colors without importing the rejected legacy wall albedo.
const woodGrain: Partial<Record<SanctuaryMaterialFamily, WoodGrainDetail>> = {
  wallWood: { axis: [0, 1, 0], scale: 8.5, contrast: .24, roughness: 1.12, albedoStrength: .52 },
  altarWood: { axis: [0, 1, 0], scale: 12.5, contrast: .30, roughness: .92, albedoStrength: .44 },
  floorWood: { axis: [1, 0, 0], scale: 11.5, contrast: .28, roughness: 1.18, albedoStrength: .38 },
  ceilingPanelWood: { axis: [1, 0, 0], scale: 10.0, contrast: .20, roughness: 1.04, albedoStrength: .36 },
  ceilingBeamWood: { axis: [1, 0, 0], scale: 13.5, contrast: .26, roughness: .90, albedoStrength: .38 },
  ceilingCross: { axis: [0, 1, 0], scale: 14.0, contrast: .23, roughness: .88, albedoStrength: .28 },
  windowMullion: { axis: [0, 1, 0], scale: 16.0, contrast: .20, roughness: 1.24, albedoStrength: .34 },
  windowWood: { axis: [0, 1, 0], scale: 14.0, contrast: .24, roughness: 1.16, albedoStrength: .40 },
  stringcourseWood: { axis: [1, 0, 0], scale: 15.0, contrast: .25, roughness: .96, albedoStrength: .36 },
  baseboardWood: { axis: [1, 0, 0], scale: 14.0, contrast: .22, roughness: 1.03, albedoStrength: .34 },
  tableWood: { axis: [1, 0, 0], scale: 10.0, contrast: .18, roughness: 1.05 },
  kneelingWood: { axis: [1, 0, 0], scale: 12.0, contrast: .22, roughness: 1.08 },
  trimWood: { axis: [1, 0, 0], scale: 14.0, contrast: .20, roughness: 1.0 },
  ceilingWood: { axis: [1, 0, 0], scale: 11.0, contrast: .20, roughness: 1.04 },
};

const recipes: Record<SanctuaryMaterialFamily, MaterialRecipe> = {
  ceilingWood: { color: "#5b3725", roughness: .58, envMapIntensity: .3, projectionScale: 1.1, colorTexture: false, clearcoat: .055, clearcoatRoughness: .58 },
  ceilingCross: { color: "#21130a", roughness: .42, side: DoubleSide, envMapIntensity: .42, projectionScale: 1.55, colorTexture: false, clearcoat: .10, clearcoatRoughness: .42 },
  wallWood: { color: "#4d2b18", roughness: .48, envMapIntensity: .28, projectionScale: .78, colorTexture: false, clearcoat: .075, clearcoatRoughness: .48 },
  trimWood: { color: "#70462d", roughness: .46, envMapIntensity: .42, projectionScale: 1.8, colorTexture: false, clearcoat: .11, clearcoatRoughness: .40 },
  floorWood: { color: "#2e190e", roughness: .57, envMapIntensity: .32, projectionScale: .52, colorTexture: false, clearcoat: .035, clearcoatRoughness: .62 },
  plasterBody: { color: "#cbb995", roughness: .72, envMapIntensity: .14, projectionScale: 1.3 },
  plasterMolding: { color: "#e1d1ae", roughness: .63, envMapIntensity: .18, projectionScale: 2.2 },
  plasterRecess: { color: "#a89170", roughness: .8, envMapIntensity: .08, projectionScale: 1.75 },
  altarStone: { color: "#d8c49f", roughness: .48, envMapIntensity: .24, projectionScale: 1.8 },
  agedMetal: { color: "#6b4e31", roughness: .43, metalness: .78, envMapIntensity: .62 },
  tableWood: { color: "#4a2919", roughness: .58, envMapIntensity: .34, projectionScale: .94, clearcoat: .12, clearcoatRoughness: .38 },
  bibleLeather: { color: "#68402a", roughness: .53, envMapIntensity: .3, projectionScale: 3.4, clearcoat: .055, clearcoatRoughness: .58 },
  biblePages: { color: "#ead8b2", roughness: .88, envMapIntensity: .12 },
  biblePageEdges: { color: "#a97948", roughness: .82, envMapIntensity: .12 },
  bibleCover: { color: "#4a2a19", roughness: .62, envMapIntensity: .24, projectionScale: 2.7, clearcoat: .07, clearcoatRoughness: .56 },
  bibleBinding: { color: "#352015", roughness: .69, envMapIntensity: .18, projectionScale: 3.1, clearcoat: .04, clearcoatRoughness: .68 },
  kneelingWood: { color: "#382016", roughness: .58, envMapIntensity: .32, projectionScale: 1.18, colorTexture: false },
  kneelingCushion: { color: "#5b3425", roughness: .74, envMapIntensity: .18, projectionScale: 2.6 },
  kneelingOrnament: { color: "#715034", roughness: .45, metalness: .72, envMapIntensity: .5 },
  windowGlass: { color: "#d7e1df", roughness: .13, metalness: .02, transparent: true, opacity: .32, envMapIntensity: .85 },
  windowWood: { color: "#633b25", roughness: .5, envMapIntensity: .38, projectionScale: 2.1, colorTexture: false },
  candleWax: { color: "#ead6a4", roughness: .42, envMapIntensity: .22 },
  candleMetal: { color: "#6c4c2e", roughness: .43, metalness: .82, envMapIntensity: .62 },
  candleWick: { color: "#17120e", roughness: .92, envMapIntensity: .04 },
  candleFlame: { color: "#ffb05a", roughness: .28, envMapIntensity: .08 },
  altarWood: { color: "#1f110a", roughness: .40, envMapIntensity: .34, projectionScale: 1.1, colorTexture: false, clearcoat: .13, clearcoatRoughness: .32 },
  windowMullion: { color: "#6b5947", roughness: .72, envMapIntensity: .18, projectionScale: 1.65, colorTexture: false, clearcoat: .025, clearcoatRoughness: .76 },
  stringcourseWood: { color: "#331c0f", roughness: .48, envMapIntensity: .3, projectionScale: 1.35, colorTexture: false, clearcoat: .085, clearcoatRoughness: .46 },
  baseboardWood: { color: "#24130a", roughness: .48, envMapIntensity: .25, projectionScale: 1.4, colorTexture: false, clearcoat: .07, clearcoatRoughness: .50 },
  ceilingPanelWood: { color: "#5c4033", roughness: .52, envMapIntensity: .26, projectionScale: 1.15, colorTexture: false, clearcoat: .065, clearcoatRoughness: .54 },
  ceilingBeamWood: { color: "#2a1b12", roughness: .45, envMapIntensity: .34, projectionScale: 1.25, colorTexture: false, clearcoat: .09, clearcoatRoughness: .44 },
  fallback: { color: "#98866f", roughness: .68, envMapIntensity: .16 },
};

/** Creates a new material so one mesh's runtime changes cannot leak into another accepted unit. */
export function materialTextureSet(family: SanctuaryMaterialFamily) { return textureSetForFamily[family]; }
export function materialUsesColorTexture(family: SanctuaryMaterialFamily) { return recipes[family].colorTexture !== false; }
/** Textured families keep a near-neutral multiplier so photographic albedo controls surface value. */
export function materialTint(family: SanctuaryMaterialFamily) {
  if (recipes[family].colorTexture === false) return recipes[family].color;
  if (family === "tableWood" || family === "kneelingWood") return "#f3eee6";
  return textureSetForFamily[family] ? "#fffaf3" : recipes[family].color;
}
export function materialProjectionMode(family: SanctuaryMaterialFamily, hasAuthoredUv: boolean) {
  if (woodGrain[family]) return "object-space-wood";
  if (!textureSetForFamily[family]) return "none";
  if (recipes[family].colorTexture === false) return hasAuthoredUv ? "neutral-authored-uv" : "neutral-triplanar";
  return hasAuthoredUv ? "authored-uv" : "triplanar";
}

const auditedSourceMaterials = new Set<string>();
export function auditMaterialResolution(sourceMaterialName: string, resolution: MaterialResolution, material: MeshStandardMaterial | MeshPhysicalMaterial) {
  if (process.env.NODE_ENV !== "development" || auditedSourceMaterials.has(sourceMaterialName)) return;
  auditedSourceMaterials.add(sourceMaterialName);
  console.info("[sanctuary material]", {
    sourceMaterial: sourceMaterialName || "<unnamed>", resolver: resolution.family, class: material.type,
    color: `#${material.color.getHexString()}`, roughness: material.roughness, metalness: material.metalness,
    transmission: material instanceof MeshPhysicalMaterial ? material.transmission : undefined,
    opacity: material.opacity, transparent: material.transparent, fallback: Boolean(resolution.fallback),
  });
}

/** Creates runtime material instances without changing accepted mesh data. */
export function createSanctuaryMaterial(resolution: MaterialResolution, hasAuthoredUv: boolean, meshName: string): MeshStandardMaterial | MeshPhysicalMaterial {
  const recipe = recipes[resolution.family];
  const textureSet = textureSetForFamily[resolution.family];
  if (resolution.family === "windowGlass") {
    const glass = new MeshPhysicalMaterial({ color: new Color(recipe.color), roughness: .28, metalness: 0, transmission: .44, thickness: .045, ior: 1.45, transparent: true, opacity: .76, side: FrontSide });
    glass.name = `runtime:${resolution.family}:${resolution.source}`;
    glass.envMapIntensity = recipe.envMapIntensity ?? 1;
    return glass;
  }
  if (resolution.family === "candleFlame") {
    const flame = new MeshStandardMaterial({
      color: new Color("#ffb05a"),
      roughness: .28,
      metalness: 0,
      emissive: new Color("#ff640f"),
      emissiveIntensity: 3.4,
    });
    flame.name = `runtime:${resolution.family}:${resolution.source}`;
    flame.envMapIntensity = .08;
    return flame;
  }
  if (resolution.family === "candleWax") {
    const wax = new MeshPhysicalMaterial({ color: new Color(recipe.color), roughness: .62, metalness: 0, transmission: .08, thickness: .035, ior: 1.38 });
    wax.name = `runtime:${resolution.family}:${resolution.source}`;
    wax.envMapIntensity = recipe.envMapIntensity ?? 1;
    addSurfaceMicrodetail(wax, meshName, "wax");
    return wax;
  }
  if (resolution.family === "biblePages" || resolution.family === "biblePageEdges") {
    const paper = new MeshPhysicalMaterial({ color: new Color(recipe.color), roughness: recipe.roughness, metalness: 0, transmission: .025, thickness: .012, ior: 1.46 });
    paper.name = `runtime:${resolution.family}:${resolution.source}`;
    paper.envMapIntensity = recipe.envMapIntensity ?? 1;
    addBiblePageDetail(paper, meshName, resolution.family === "biblePageEdges");
    return paper;
  }
  const parameters: ConstructorParameters<typeof MeshStandardMaterial>[0] = {
    color: new Color(materialTint(resolution.family)),
    roughness: recipe.roughness,
    metalness: recipe.metalness ?? 0,
    side: recipe.side ?? FrontSide,
  };
  if (recipe.transparent !== undefined) parameters.transparent = recipe.transparent;
  if (recipe.opacity !== undefined) parameters.opacity = recipe.opacity;
  const material = recipe.clearcoat === undefined
    ? new MeshStandardMaterial(parameters)
    : new MeshPhysicalMaterial({ ...parameters, clearcoat: recipe.clearcoat, clearcoatRoughness: recipe.clearcoatRoughness ?? .5 });
  material.name = `runtime:${resolution.family}:${resolution.source}`;
  material.envMapIntensity = recipe.envMapIntensity ?? 1;
  if (resolution.family === "agedMetal" || resolution.family === "candleMetal" || resolution.family === "kneelingOrnament") addSurfaceMicrodetail(material, meshName, "metal");
  const useColorTexture = recipe.colorTexture !== false;
  const grain = woodGrain[resolution.family];
  if (textureSet && grain) {
    addProjectedPbr(material, getPbrTextures(textureSet), meshName, recipe.projectionScale ?? 1, useColorTexture, grain);
  } else if (hasAuthoredUv && textureSet) {
    const textures = getPbrTextures(textureSet);
    if (useColorTexture) material.map = textures.albedo;
    material.normalMap = textures.normal;
    material.roughnessMap = textures.roughness;
    material.roughness = 1;
    material.normalScale.set(.45, .45);
  } else if (textureSet) {
    addProjectedPbr(material, getPbrTextures(textureSet), meshName, recipe.projectionScale ?? 1, useColorTexture);
  }
  return material;
}

export function sourceMaterialName(material: Material | Material[]): string {
  return Array.isArray(material) ? material.map((item) => item.name).join("|") : material.name;
}
