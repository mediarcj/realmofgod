# File: tools/blender/export_sanctuary_unit.py
# Description: Exports selected objects from the already-open authoritative Blender GUI file.
# Purpose: Creates a separate browser derivative without reloading, saving, or mutating the source file.
# Notes: Blender 5.2 LTS; this script is intentionally GUI-current-file only.

import argparse
import hashlib
import json
import sys
import struct
from pathlib import Path

import bpy
def digest(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--source-sha256", required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--objects", nargs="+", required=True)
    parser.add_argument("--max-triangles", type=int, default=0)
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
    source, output = args.source.resolve(), args.output.resolve()
    if output == source or output.suffix != ".glb":
        raise ValueError("Output must be a separate GLB derivative.")
    if Path(bpy.data.filepath).resolve() != source:
        raise ValueError(f"Wrong open Blender file: {bpy.data.filepath}; expected {source}")
    if digest(source) != args.source_sha256:
        raise ValueError("Accepted master SHA-256 mismatch.")
    if len(set(args.objects)) != len(args.objects):
        raise ValueError("Duplicate selected object names.")
    bpy.context.view_layer.update()
    records = []
    depsgraph = bpy.context.evaluated_depsgraph_get()
    for name in args.objects:
        original = bpy.data.objects.get(name)
        if original is None or original.type not in {"MESH", "CURVE"}:
            raise ValueError(f"Expected exact source mesh or curve geometry: {name}")
        if original.get("rog_export_policy") not in {
            "WEB_DERIVATIVE_STATIC", "WEB_DERIVATIVE_RUNTIME_ADDRESSABLE"
        }:
            raise ValueError(f"Source policy does not permit geometry export: {name}")
        depsgraph = bpy.context.evaluated_depsgraph_get()
        evaluated = original.evaluated_get(depsgraph)
        mesh = evaluated.to_mesh()
        mesh.calc_loop_triangles()
        world = original.matrix_world.copy()
        # Curve bounds may include control-handle extents. Measure the evaluated
        # surface itself, which is also the geometry sent to glTF.
        bounds = [world @ vertex.co for vertex in mesh.vertices]
        source_triangles = len(mesh.loop_triangles)
        record = {
            "name": name, "category": original.get("rog_category"),
            "export_policy": original.get("rog_export_policy"),
            "triangles": len(mesh.loop_triangles),
            "matrix_world_blender": [list(row) for row in world],
            "bounds_blender": {"min": [min(v[i] for v in bounds) for i in range(3)],
                               "max": [max(v[i] for v in bounds) for i in range(3)]},
            "materials": [slot.material.name if slot.material else None for slot in original.material_slots],
        }
        evaluated.to_mesh_clear()
        records.append(record)
    selected_before = {obj: obj.select_get() for obj in bpy.context.selected_objects}
    active_before = bpy.context.view_layer.objects.active
    try:
        for obj in bpy.context.selected_objects:
            obj.select_set(False)
        for name in args.objects:
            bpy.data.objects[name].select_set(True)
        bpy.context.view_layer.objects.active = bpy.data.objects[args.objects[0]]
        output.parent.mkdir(parents=True, exist_ok=True)
        bpy.ops.export_scene.gltf(
            filepath=str(output), export_format="GLB", use_selection=True, use_active_scene=True,
            export_yup=True, export_animations=False, export_cameras=False,
            export_lights=False, export_extras=True, export_apply=True,
        )
        glb = output.read_bytes()
        json_size = struct.unpack_from("<I", glb, 12)[0]
        gltf = json.loads(glb[20:20 + json_size])
        exported = [node.get("name") for node in gltf.get("nodes", []) if "mesh" in node]
        if sorted(exported) != sorted(args.objects):
            raise RuntimeError(f"Exported mesh selection mismatch: {exported}")
        if digest(source) != args.source_sha256:
            raise RuntimeError("Master changed during export.")
        manifest = {"source_sha256": args.source_sha256, "blender_version": bpy.app.version_string,
                    "coordinate_mapping": "Blender (x,y,z) -> glTF (x,z,-y), metres",
                    "asset": output.name, "sha256": digest(output), "bytes": output.stat().st_size,
                    "objects": records}
        output.with_suffix(".json").write_text(json.dumps(manifest, indent=2) + "\n")
        print("EXPORT_OK", output.name, len(records), "objects", manifest["bytes"], "bytes")
    finally:
        for obj in bpy.context.selected_objects:
            obj.select_set(False)
        for obj in selected_before:
            if obj.name in bpy.data.objects:
                obj.select_set(True)
        bpy.context.view_layer.objects.active = active_before


if __name__ == "__main__":
    main()
