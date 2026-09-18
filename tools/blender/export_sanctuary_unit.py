# File: tools/blender/export_sanctuary_unit.py
# Description: Exports explicitly selected accepted-source objects into one web construction unit.
# Purpose: Preserves source geometry and world transforms without saving the master.
# Notes: Blender 5.2 LTS; invoke with factory startup and automatic scripts disabled.

import argparse
import hashlib
import json
import sys
import struct
from pathlib import Path

import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree

ACCEPTED_SHA = "fc0357a2335e3ed7205a4035d2baf2bedae5ac8e5b7934dd24382d19b89a1c24"


def digest(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--objects", nargs="+", required=True)
    parser.add_argument("--max-triangles", type=int, default=0)
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
    source, output = args.source.resolve(), args.output.resolve()
    if output == source or output.suffix != ".glb":
        raise ValueError("Output must be a separate GLB derivative.")
    if digest(source) != ACCEPTED_SHA:
        raise ValueError("Accepted master SHA-256 mismatch.")
    if len(set(args.objects)) != len(args.objects):
        raise ValueError("Duplicate selected object names.")
    bpy.ops.wm.open_mainfile(filepath=str(source), load_ui=False, use_scripts=False)
    bpy.context.view_layer.update()
    records = []
    copies = []
    source_scene = bpy.context.scene
    export_scene = bpy.data.scenes.new("WEB_DERIVATIVE")
    export_scene.unit_settings.scale_length = bpy.context.scene.unit_settings.scale_length
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
        mesh = bpy.data.meshes.new_from_object(evaluated, depsgraph=depsgraph)
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
        # The derivative has no parent or modifiers: the evaluated mesh and world matrix
        # preserve their result without pulling authoring parents into the browser asset.
        original.name = name + "__SOURCE_IN_MEMORY"
        copy = bpy.data.objects.new(name, mesh)
        copy.matrix_world = world
        copy["rog_source_name"] = name
        copy["rog_category"] = original.get("rog_category", "")
        export_scene.collection.objects.link(copy)
        # Dense source props receive a separate measured web mesh. Sample the source
        # surface against the result in world metres; fail before shipping visible drift.
        if args.max_triangles and source_triangles > args.max_triangles:
            modifier = copy.modifiers.new("Web derivative reduction", "DECIMATE")
            modifier.ratio = args.max_triangles / source_triangles
            modifier.use_collapse_triangulate = True
            bpy.context.window.scene = export_scene
            bpy.context.view_layer.update()
            reduced_object = copy.evaluated_get(bpy.context.evaluated_depsgraph_get())
            reduced = bpy.data.meshes.new_from_object(reduced_object, depsgraph=bpy.context.evaluated_depsgraph_get())
            reduced.calc_loop_triangles()
            tree = BVHTree.FromPolygons([world @ v.co for v in reduced.vertices],
                [tuple(t.vertices) for t in reduced.loop_triangles], all_triangles=True)
            step = max(1, len(mesh.vertices) // 4096)
            error = max(tree.find_nearest(world @ v.co)[3] for v in list(mesh.vertices)[::step])
            if error > 0.003:
                raise RuntimeError(f"Web surface deviation exceeds 3 mm: {name}: {error}")
            record["source_triangles"] = source_triangles
            record["sampled_surface_error_m"] = error
            record["source_bounds_blender"] = record["bounds_blender"]
            reduced_bounds = [world @ v.co for v in reduced.vertices]
            record["bounds_blender"] = {"min": [min(v[i] for v in reduced_bounds) for i in range(3)],
                                         "max": [max(v[i] for v in reduced_bounds) for i in range(3)]}
            record["triangles"] = len(reduced.loop_triangles)
            record["derivative_level"] = "WEB_HIGH"
            copy.modifiers.clear()
            copy.data = reduced
            bpy.context.window.scene = source_scene
        records.append(record)
        copies.append(copy)
    bpy.context.window.scene = export_scene
    for obj in copies:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = copies[0]
    output.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(output), export_format="GLB", use_selection=True, use_active_scene=True,
        export_yup=True, export_animations=False, export_cameras=False,
        export_lights=False, export_extras=True, export_apply=False,
    )
    glb = output.read_bytes()
    json_size = struct.unpack_from("<I", glb, 12)[0]
    gltf = json.loads(glb[20:20 + json_size])
    exported = [node.get("name") for node in gltf.get("nodes", []) if "mesh" in node]
    if sorted(exported) != sorted(args.objects):
        raise RuntimeError(f"Exported mesh selection mismatch: {exported}")
    if digest(source) != ACCEPTED_SHA:
        raise RuntimeError("Master changed during export.")
    manifest = {"source_sha256": ACCEPTED_SHA, "blender_version": bpy.app.version_string,
                "coordinate_mapping": "Blender (x,y,z) -> glTF (x,z,-y), metres",
                "asset": output.name, "sha256": digest(output), "bytes": output.stat().st_size,
                "objects": records}
    output.with_suffix(".json").write_text(json.dumps(manifest, indent=2) + "\n")
    print("EXPORT_OK", output.name, len(records), "objects", manifest["bytes"], "bytes")


if __name__ == "__main__":
    main()
