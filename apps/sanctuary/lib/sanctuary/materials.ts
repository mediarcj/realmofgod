// File: apps/sanctuary/lib/sanctuary/materials.ts
// Description: Resolves browser PBR materials from accepted sanctuary semantics.
// Purpose: Keeps Blender geometry and semantic zones authoritative while giving runtime surfaces intentional response.
// Notes: Texture-bearing maps are only added to derivatives with authored compatible UVs.

import { Color, DoubleSide, FrontSide, MeshStandardMaterial, RepeatWrapping, SRGBColorSpace, TextureLoader, type Material, type Side } from "three";

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
let woodTextures: { albedo: ReturnType<TextureLoader["load"]>; normal: ReturnType<TextureLoader["load"]>; arm: ReturnType<TextureLoader["load"]> } | undefined;
function getWoodTextures() {
  if (woodTextures) return woodTextures;
  const textureLoader = new TextureLoader();
  const albedo = textureLoader.load("/textures/polyhaven/wood_floor/wood_floor_diff_1k.jpg");
  albedo.colorSpace = SRGBColorSpace;
  const normal = textureLoader.load("/textures/polyhaven/wood_floor/wood_floor_nor_gl_1k.jpg");
  const arm = textureLoader.load("/textures/polyhaven/wood_floor/wood_floor_arm_1k.jpg");
  for (const texture of [albedo, normal, arm]) {
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(2, 2);
  }
  woodTextures = { albedo, normal, arm };
  return woodTextures;
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
  "altar-cross-center": "altarStone",
  "altar-cross-sides": "altarStone",
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

type MaterialRecipe = { color: string; roughness: number; metalness?: number; side?: Side; envMapIntensity?: number; transparent?: boolean; opacity?: number };

const recipes: Record<SanctuaryMaterialFamily, MaterialRecipe> = {
  ceilingWood: { color: "#4a2b1d", roughness: .54, envMapIntensity: .3 },
  ceilingCross: { color: "#6a4028", roughness: .42, side: DoubleSide, envMapIntensity: .42 },
  wallWood: { color: "#3f2418", roughness: .58, envMapIntensity: .28 },
  trimWood: { color: "#5b3622", roughness: .44, envMapIntensity: .42 },
  floorWood: { color: "#4a2b1c", roughness: .47, envMapIntensity: .36 },
  plasterBody: { color: "#cbb995", roughness: .72, envMapIntensity: .14 },
  plasterMolding: { color: "#e1d1ae", roughness: .63, envMapIntensity: .18 },
  plasterRecess: { color: "#a89170", roughness: .8, envMapIntensity: .08 },
  altarStone: { color: "#d8c49f", roughness: .48, envMapIntensity: .24 },
  tableWood: { color: "#3b2014", roughness: .32, envMapIntensity: .55 },
  bibleLeather: { color: "#5e3420", roughness: .48, envMapIntensity: .3 },
  kneelingWood: { color: "#321b13", roughness: .38, envMapIntensity: .44 },
  windowGlass: { color: "#d7e1df", roughness: .13, metalness: .02, transparent: true, opacity: .32, envMapIntensity: .85 },
  windowWood: { color: "#4f2d1e", roughness: .47, envMapIntensity: .38 },
  candleWax: { color: "#ead6a4", roughness: .42, envMapIntensity: .22 },
  fallback: { color: "#98866f", roughness: .68, envMapIntensity: .16 },
};

/** Creates a new material so one mesh's runtime changes cannot leak into another accepted unit. */
export function createSanctuaryMaterial(resolution: MaterialResolution, hasAuthoredUv: boolean): MeshStandardMaterial {
  const recipe = recipes[resolution.family];
  const material = new MeshStandardMaterial({
    color: new Color(recipe.color),
    roughness: recipe.roughness,
    metalness: recipe.metalness ?? 0,
    side: recipe.side ?? FrontSide,
    transparent: recipe.transparent,
    opacity: recipe.opacity,
  });
  material.name = `runtime:${resolution.family}:${resolution.source}`;
  material.envMapIntensity = recipe.envMapIntensity ?? 1;
  if (hasAuthoredUv && woodFamilies.has(resolution.family)) {
    const textures = getWoodTextures();
    material.map = textures.albedo;
    material.normalMap = textures.normal;
    material.roughnessMap = textures.arm;
    material.roughness = 1;
  }
  return material;
}

export function sourceMaterialName(material: Material | Material[]): string {
  return Array.isArray(material) ? material.map((item) => item.name).join("|") : material.name;
}
