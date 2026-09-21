"""Create a material-selection preparation derivative from the accepted Sanctuary master.

Run only once from Blender's interactive Python Console with the accepted master open.

This script creates a separate .blend with semantic material slots for manual face
selection. It does not alter vertices, faces, transforms, object placement, or
the accepted source file. Faces intentionally remain on their existing source
slot until a human visually selects and assigns authoritative regions.
"""
from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

import bpy

SOURCE = Path.home() / "Documents/Blender/realm_new_sanctuary_v2/blend/Realm_of_God_NEW_SANCTUARY_v2_CEILING_LEVEL_v28_4_4.blend"
EXPECTED_SHA = "118ac40912509b1242608fa88163476e0013ee9179f17942b3f8ed3273286e36"
DERIVATIVE = SOURCE.with_name("Realm_of_God_NEW_SANCTUARY_v2_RUNTIME_MATERIAL_SEGMENTATION_PREP_v27_0_0.blend")
ZONE_PLAN = {
    "ROG_BIBLE_HYPER3D_MASTER": ["MAT_BIBLE_PAGE_PAPER", "MAT_BIBLE_PAGE_EDGES", "MAT_BIBLE_COVER_LEATHER", "MAT_BIBLE_BINDING"],
    "ALTAR_ACC_HYPER3D_LARGE_LEFT_MASTER": ["MAT_CANDLE_WAX", "MAT_CANDLE_METAL_AGED", "MAT_CANDLE_WICK"],
    "ALTAR_ACC_HYPER3D_LARGE_RIGHT_MASTER": ["MAT_CANDLE_WAX", "MAT_CANDLE_METAL_AGED", "MAT_CANDLE_WICK"],
    "ALTAR_ACC_HYPER3D_MEDIUM_LEFT_MASTER": ["MAT_CANDLE_WAX", "MAT_CANDLE_METAL_AGED", "MAT_CANDLE_WICK"],
    "ALTAR_ACC_HYPER3D_MEDIUM_RIGHT_MASTER": ["MAT_CANDLE_WAX", "MAT_CANDLE_METAL_AGED", "MAT_CANDLE_WICK"],
    "ALTAR_ACC_HYPER3D_MEDIUM_LEFT_ARCH3_MASTER": ["MAT_CANDLE_WAX", "MAT_CANDLE_METAL_AGED", "MAT_CANDLE_WICK"],
    "ALTAR_ACC_HYPER3D_MEDIUM_RIGHT_ARCH3_MASTER": ["MAT_CANDLE_WAX", "MAT_CANDLE_METAL_AGED", "MAT_CANDLE_WICK"],
    "ROG_KNEE_REST_HYPER3D_MASTER": ["MAT_KNEELER_WOOD", "MAT_KNEELER_CUSHION", "MAT_KNEELER_ORNAMENT"],
}

def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()

def ensure_material(name: str) -> bpy.types.Material:
    material = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    material.use_nodes = True
    return material

if Path(bpy.data.filepath).resolve() != SOURCE.resolve():
    raise RuntimeError("Open the exact accepted master in Blender before running this preparation script.")
if sha256(SOURCE) != EXPECTED_SHA:
    raise RuntimeError("The accepted master SHA-256 does not match the material-preparation authority.")
if DERIVATIVE.exists():
    raise RuntimeError(f"Refusing to overwrite existing derivative: {DERIVATIVE}")

before = {}
for name, zones in ZONE_PLAN.items():
    obj = bpy.data.objects.get(name)
    if obj is None or obj.type != "MESH":
        raise RuntimeError(f"Expected exact mesh is missing: {name}")
    before[name] = {"matrix_world": [list(row) for row in obj.matrix_world], "vertices": len(obj.data.vertices), "polygons": len(obj.data.polygons)}
    for zone in zones:
        if obj.data.materials.get(zone) is None:
            obj.data.materials.append(ensure_material(zone))
    obj["rog_material_segmentation_status"] = "MANUAL_VISUAL_FACE_SELECTION_REQUIRED"
    obj["rog_material_semantic_zones"] = zones
    obj["rog_material_preparation_note"] = "Select faces visually and assign only verified zones; no automatic face classification was used."

bpy.ops.wm.save_as_mainfile(filepath=str(DERIVATIVE), check_existing=False)
if sha256(SOURCE) != EXPECTED_SHA:
    raise RuntimeError("The accepted master changed while creating the derivative.")

after = {name: {"matrix_world": [list(row) for row in bpy.data.objects[name].matrix_world], "vertices": len(bpy.data.objects[name].data.vertices), "polygons": len(bpy.data.objects[name].data.polygons)} for name in ZONE_PLAN}
if before != after:
    raise RuntimeError("Preparation changed geometry ownership or transform data; derivative is not valid.")
receipt = {
    "created_at_utc": datetime.now(timezone.utc).isoformat(),
    "source": str(SOURCE), "source_sha256": EXPECTED_SHA,
    "derivative": str(DERIVATIVE), "derivative_sha256": sha256(DERIVATIVE),
    "allowed_mutation": "semantic material slots and manual-selection metadata only",
    "objects": {name: {"semantic_zones": zones, "status": "DERIVATIVE_SEGMENTATION_NEEDS_VISUAL_SELECTION"} for name, zones in ZONE_PLAN.items()},
}
DERIVATIVE.with_suffix(".material-segmentation.json").write_text(json.dumps(receipt, indent=2) + "\n", encoding="utf8")
print("MATERIAL_PREP_OK", json.dumps(receipt, indent=2))
