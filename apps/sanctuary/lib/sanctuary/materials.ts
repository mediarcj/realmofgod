// File: apps/sanctuary/lib/sanctuary/materials.ts
// Description: Resolves browser PBR materials from accepted sanctuary semantics.
// Purpose: Keeps Blender geometry and semantic zones authoritative while giving runtime surfaces intentional response.
// Notes: Texture-bearing maps are only added to derivatives with authored compatible UVs.

import { Color, DoubleSide, FrontSide, MeshPhysicalMaterial, MeshStandardMaterial, RepeatWrapping, SRGBColorSpace, TextureLoader, Vector2, type Material, type Side, type Texture } from "three";

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
  | "kneelingWood"
  | "windowGlass"
  | "windowWood"
  | "candleWax"
  | "fallback";

export type MaterialResolution = { family: SanctuaryMaterialFamily; source: string };

const ceilingCrossMesh = "ROG_V2_CeilingCross_CLEAN_Mesh.001";
const windowWoodTerms = ["casing", "sash", "stop", "astragal", "mullion", "frame"];
const woodFamilies = new Set<SanctuaryMaterialFamily>(["ceilingWood", "wallWood", "trimWood", "floorWood", "tableWood", "kneelingWood", "windowWood"]);
type TextureSet = "floor" | "fine" | "walnut" | "leather" | "plaster";
type PbrTextures = { albedo: Texture; normal: Texture; roughness: Texture };
const texturePaths: Record<TextureSet, { albedo: string; normal: string; roughness: string; repeat: number }> = {
  floor: { albedo: "/textures/polyhaven/wood_floor/wood_floor_diff_1k.jpg", normal: "/textures/polyhaven/wood_floor/wood_floor_nor_gl_1k.jpg", roughness: "/textures/polyhaven/wood_floor/wood_floor_arm_1k.jpg", repeat: 2.8 },
  fine: { albedo: "/textures/polyhaven/fine_grained_wood/fine_grained_wood_col_2k.jpg", normal: "/textures/polyhaven/fine_grained_wood/fine_grained_wood_nor_gl_2k.jpg", roughness: "/textures/polyhaven/fine_grained_wood/fine_grained_wood_rough_2k.jpg", repeat: 2.15 },
  walnut: { albedo: "/textures/polyhaven/walnut_veneer/walnut_veneer_diff_2k.jpg", normal: "/textures/polyhaven/walnut_veneer/walnut_veneer_nor_gl_2k.jpg", roughness: "/textures/polyhaven/walnut_veneer/walnut_veneer_rough_2k.jpg", repeat: 1.45 },
  leather: { albedo: "/textures/polyhaven/fabric_leather_02/fabric_leather_02_diff_2k.jpg", normal: "/textures/polyhaven/fabric_leather_02/fabric_leather_02_nor_gl_2k.jpg", roughness: "/textures/polyhaven/fabric_leather_02/fabric_leather_02_rough_2k.jpg", repeat: 3.2 },
  plaster: { albedo: "/textures/polyhaven/white_plaster_02/white_plaster_02_diff_2k.jpg", normal: "/textures/polyhaven/white_plaster_02/white_plaster_02_nor_gl_2k.jpg", roughness: "/textures/polyhaven/white_plaster_02/white_plaster_02_rough_2k.jpg", repeat: 3.6 },
};
const textureSetForFamily: Record<SanctuaryMaterialFamily, TextureSet | null> = {
  wallWood: "fine", ceilingWood: "walnut", trimWood: "fine", floorWood: "floor", tableWood: "walnut", kneelingWood: "fine", windowWood: "walnut",
  ceilingCross: "walnut", plasterBody: "plaster", plasterMolding: "plaster", plasterRecess: "plaster", altarStone: "plaster", agedMetal: null, bibleLeather: "leather", windowGlass: null, candleWax: null, fallback: null,
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

function addProjectedPbr(material: MeshStandardMaterial, textures: PbrTextures, meshName: string, scale: number) {
  const seed = seedFromName(meshName);
  material.onBeforeCompile = (shader) => {
    shader.uniforms.realmBaseMap = { value: textures.albedo };
    shader.uniforms.realmNormalMap = { value: textures.normal };
    shader.uniforms.realmRoughnessMap = { value: textures.roughness };
    shader.uniforms.realmProjectionScale = { value: scale * (0.92 + seed * .16) };
    shader.uniforms.realmProjectionOffset = { value: new Vector2(seed * 13.7, seed * 7.3) };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 realmWorldPosition;\nvarying vec3 realmWorldNormal;")
      .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nrealmWorldPosition = worldPosition.xyz;\nrealmWorldNormal = normalize(mat3(modelMatrix) * objectNormal);");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>
varying vec3 realmWorldPosition;
varying vec3 realmWorldNormal;
uniform sampler2D realmBaseMap;
uniform sampler2D realmNormalMap;
uniform sampler2D realmRoughnessMap;
uniform float realmProjectionScale;
uniform vec2 realmProjectionOffset;
vec3 realmTriSample(sampler2D image, vec3 position, vec3 normal) {
  vec3 weights = abs(normal); weights = max(weights, vec3(0.0001)); weights /= (weights.x + weights.y + weights.z);
  vec2 xy = position.xy * realmProjectionScale + realmProjectionOffset;
  vec2 xz = position.xz * realmProjectionScale + realmProjectionOffset.yx;
  vec2 yz = position.yz * realmProjectionScale + realmProjectionOffset;
  return texture2D(image, yz).rgb * weights.x + texture2D(image, xz).rgb * weights.y + texture2D(image, xy).rgb * weights.z;
}`)
      .replace("#include <map_fragment>", "vec3 realmBaseColor = pow(realmTriSample(realmBaseMap, realmWorldPosition, realmWorldNormal), vec3(2.2));\ndiffuseColor.rgb *= realmBaseColor;")
      .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\nroughnessFactor *= mix(0.72, 1.18, realmTriSample(realmRoughnessMap, realmWorldPosition, realmWorldNormal).g);")
      .replace("#include <normal_fragment_begin>", "#include <normal_fragment_begin>\nvec3 realmDetailNormal = realmTriSample(realmNormalMap, realmWorldPosition, realmWorldNormal) * 2.0 - 1.0;\nnormal = normalize(normal + realmDetailNormal * 0.055);");
  };
  material.customProgramCacheKey = () => "realm-triplanar-pbr-v1";
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
  table: "tableWood",
  bible: "bibleLeather",
  "kneeling-rest": "kneelingWood",
};

/** Resolves only from exported unit, accepted mesh name, and accepted source-material label. */
export function resolveSanctuaryMaterial(unit: string, meshName: string, sourceMaterialName = ""): MaterialResolution {
  const mesh = meshName.toLowerCase();
  const source = sourceMaterialName.toLowerCase();
  if (meshName === ceilingCrossMesh) return { family: "ceilingCross", source: "ceiling-cross mesh" };
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
  if (source.includes("wood_table")) return { family: "tableWood", source: sourceMaterialName };
  if (source.includes("wood_knee")) return { family: "kneelingWood", source: sourceMaterialName };
  if (source.includes("stone_altar")) return { family: "altarStone", source: sourceMaterialName };
  return { family: byUnit[unit] ?? "fallback", source: byUnit[unit] ? "semantic unit" : "unclassified unit" };
}

type MaterialRecipe = { color: string; roughness: number; metalness?: number; side?: Side; envMapIntensity?: number; transparent?: boolean; opacity?: number; projectionScale?: number };

const recipes: Record<SanctuaryMaterialFamily, MaterialRecipe> = {
  ceilingWood: { color: "#5b3725", roughness: .58, envMapIntensity: .3, projectionScale: 1.1 },
  ceilingCross: { color: "#6a4028", roughness: .42, side: DoubleSide, envMapIntensity: .42, projectionScale: 1.55 },
  wallWood: { color: "#4d2b1d", roughness: .64, envMapIntensity: .28, projectionScale: .78 },
  trimWood: { color: "#70462d", roughness: .46, envMapIntensity: .42, projectionScale: 1.8 },
  floorWood: { color: "#552f1e", roughness: .5, envMapIntensity: .36, projectionScale: 1.05 },
  plasterBody: { color: "#cbb995", roughness: .72, envMapIntensity: .14, projectionScale: 1.3 },
  plasterMolding: { color: "#e1d1ae", roughness: .63, envMapIntensity: .18, projectionScale: 2.2 },
  plasterRecess: { color: "#a89170", roughness: .8, envMapIntensity: .08, projectionScale: 1.75 },
  altarStone: { color: "#d8c49f", roughness: .48, envMapIntensity: .24, projectionScale: 1.8 },
  agedMetal: { color: "#6b4e31", roughness: .43, metalness: .78, envMapIntensity: .62 },
  tableWood: { color: "#4a2919", roughness: .36, envMapIntensity: .55, projectionScale: 1.25 },
  bibleLeather: { color: "#68402a", roughness: .53, envMapIntensity: .3, projectionScale: 3.4 },
  kneelingWood: { color: "#382016", roughness: .43, envMapIntensity: .44, projectionScale: 1.45 },
  windowGlass: { color: "#d7e1df", roughness: .13, metalness: .02, transparent: true, opacity: .32, envMapIntensity: .85 },
  windowWood: { color: "#633b25", roughness: .5, envMapIntensity: .38, projectionScale: 2.1 },
  candleWax: { color: "#ead6a4", roughness: .42, envMapIntensity: .22 },
  fallback: { color: "#98866f", roughness: .68, envMapIntensity: .16 },
};

/** Creates a new material so one mesh's runtime changes cannot leak into another accepted unit. */
export function materialTextureSet(family: SanctuaryMaterialFamily) { return textureSetForFamily[family]; }
/** Textured families keep a near-neutral multiplier so photographic albedo controls surface value. */
export function materialTint(family: SanctuaryMaterialFamily) { return textureSetForFamily[family] ? "#fffaf3" : recipes[family].color; }
export function materialProjectionMode(family: SanctuaryMaterialFamily, hasAuthoredUv: boolean) {
  return textureSetForFamily[family] ? hasAuthoredUv ? "authored-uv" : "triplanar" : "none";
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
  if (resolution.family === "candleWax") {
    const wax = new MeshPhysicalMaterial({ color: new Color(recipe.color), roughness: .62, metalness: 0, transmission: .08, thickness: .035, ior: 1.38 });
    wax.name = `runtime:${resolution.family}:${resolution.source}`;
    wax.envMapIntensity = recipe.envMapIntensity ?? 1;
    return wax;
  }
  const material = new MeshStandardMaterial({
    color: new Color(materialTint(resolution.family)),
    roughness: recipe.roughness,
    metalness: recipe.metalness ?? 0,
    side: recipe.side ?? FrontSide,
    transparent: recipe.transparent,
    opacity: recipe.opacity,
  });
  material.name = `runtime:${resolution.family}:${resolution.source}`;
  material.envMapIntensity = recipe.envMapIntensity ?? 1;
  if (hasAuthoredUv && textureSet) {
    const textures = getPbrTextures(textureSet);
    material.map = textures.albedo;
    material.normalMap = textures.normal;
    material.roughnessMap = textures.roughness;
    material.roughness = 1;
    material.normalScale.set(.45, .45);
  } else if (textureSet) {
    addProjectedPbr(material, getPbrTextures(textureSet), meshName, recipe.projectionScale ?? 1);
  }
  return material;
}

export function sourceMaterialName(material: Material | Material[]): string {
  return Array.isArray(material) ? material.map((item) => item.name).join("|") : material.name;
}
