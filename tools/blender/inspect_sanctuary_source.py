# File: tools/blender/inspect_sanctuary_source.py
# Description: Inspects an accepted Blender sanctuary source and writes a JSON inventory.
# Purpose: Preserves authoritative scene names, transforms, metadata, and export policy before web derivatives are made.
# Notes: Run through Blender with the source file loaded; this script never saves the source file.

"""Create a read-only, machine-readable inventory of an accepted sanctuary source.

Example:
  blender --background --factory-startup --python tools/blender/inspect_sanctuary_source.py -- \
    --source accepted.blend --output /tmp/sanctuary-inventory.json --expected-sha256 <accepted-sha>
"""

from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path
from typing import Any

import bpy


# The inventory needs JSON-safe values even when Blender custom properties use ID types.
def json_value(value: Any) -> Any:
    """Convert a Blender custom-property value into plain JSON data."""

    if isinstance(value, (str, int, float, bool)) or value is None:
        return value
    if hasattr(value, "to_list"):
        return [json_value(item) for item in value.to_list()]
    if hasattr(value, "keys"):
        return {str(key): json_value(value[key]) for key in value.keys()}
    if isinstance(value, (list, tuple)):
        return [json_value(item) for item in value]
    return str(value)


# Only application-facing metadata belongs in the exported contract.
def rog_metadata(owner: Any) -> dict[str, Any]:
    """Return the `rog_*` custom properties attached to a Blender data block."""

    return {
        str(key): json_value(owner[key])
        for key in owner.keys()
        if str(key).lower().startswith("rog_")
    }


def sha256_file(path: Path) -> str:
    """Hash a source file in chunks so large Blender files do not need a duplicate buffer."""

    digest = hashlib.sha256()
    with path.open("rb") as source_file:
        for chunk in iter(lambda: source_file.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def transform(object_: bpy.types.Object) -> dict[str, list[float]]:
    """Preserve Blender-local placement precisely enough for browser asset derivation."""

    return {
        "location": [float(value) for value in object_.location],
        "rotation_euler": [float(value) for value in object_.rotation_euler],
        "scale": [float(value) for value in object_.scale],
    }


def object_record(object_: bpy.types.Object) -> dict[str, Any]:
    """Record one object without exporting or mutating its geometry."""

    material_slots = []
    if getattr(object_.data, "materials", None):
        material_slots = [material.name for material in object_.data.materials if material]

    return {
        "name": object_.name,
        "type": object_.type,
        "parent": object_.parent.name if object_.parent else None,
        "collections": sorted(collection.name for collection in object_.users_collection),
        "transform": transform(object_),
        "materials": material_slots,
        "rog_metadata": rog_metadata(object_),
        "data_rog_metadata": rog_metadata(object_.data) if object_.data else {},
    }


def parse_arguments() -> argparse.Namespace:
    """Read only output and identity arguments after Blender's `--` separator."""

    arguments = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--expected-sha256", required=True)
    return parser.parse_args(arguments)


def main() -> None:
    """Validate the loaded master and write an inventory without saving it."""

    args = parse_arguments()
    source_path = args.source.resolve()
    if not source_path.is_file():
        raise RuntimeError("The requested source file does not exist; inspection cannot continue.")

    # Stop before deriving any output if the named visual authority is not byte-for-byte accepted.
    actual_sha256 = sha256_file(source_path)
    if actual_sha256.lower() != args.expected_sha256.lower():
        raise RuntimeError(
            f"Accepted source SHA-256 mismatch: expected {args.expected_sha256}, got {actual_sha256}."
        )

    # Load only after the clean background runtime has started. This avoids relying on
    # a local startup file and still changes only Blender's in-memory document.
    bpy.ops.wm.open_mainfile(filepath=str(source_path), load_ui=False, use_scripts=False)
    if Path(bpy.data.filepath).resolve() != source_path:
        raise RuntimeError("Blender did not load the requested source file.")

    # Preserve all discovered names rather than imposing browser-oriented labels.
    collection_parents = {
        child.name: collection.name
        for collection in bpy.data.collections
        for child in collection.children
    }
    collections = [
        {
            "name": collection.name,
            "parent": collection_parents.get(collection.name),
            "rog_metadata": rog_metadata(collection),
        }
        for collection in sorted(bpy.data.collections, key=lambda item: item.name)
    ]
    objects = [object_record(object_) for object_ in sorted(bpy.data.objects, key=lambda item: item.name)]
    materials = [
        {"name": material.name, "rog_metadata": rog_metadata(material)}
        for material in sorted(bpy.data.materials, key=lambda item: item.name)
    ]

    # Anchors and export policy remain derived from authoritative metadata and names.
    anchors = [
        object_["name"]
        for object_ in objects
        if object_["name"].startswith("ROG_INT_")
        or object_["name"].startswith("ROG_FX_")
        or object_["rog_metadata"]
    ]
    export_policy_objects = [
        object_["name"]
        for object_ in objects
        if any("export" in key.lower() for key in object_["rog_metadata"])
    ]

    inventory = {
        "schema_version": 1,
        "source": {
            "filename": source_path.name,
            "sha256": actual_sha256,
            "blender_version": bpy.app.version_string,
        },
        "collections": collections,
        "materials": materials,
        "objects": objects,
        "runtime_addressable_anchors": anchors,
        "export_policy_objects": export_policy_objects,
    }

    # The generated inventory is a separate derivative and never a Blender save operation.
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(inventory, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"Wrote inventory: {args.output}")
    print(f"Objects: {len(objects)}; anchors: {len(anchors)}; export-policy objects: {len(export_policy_objects)}")


if __name__ == "__main__":
    main()
