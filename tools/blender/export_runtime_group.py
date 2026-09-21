# File: tools/blender/export_runtime_group.py
# Description: Runs the GUI-current-file exporter for one named Sanctuary V2 runtime group.
# Purpose: Produces the five independent browser assets without opening, saving, or merging Blender files.

import argparse
import json
import runpy
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MODELS = ROOT / "apps/sanctuary/public/models/sanctuary"
DEVOTIONAL = {"table", "bible", "kneeling-rest"}
CANDLES = {"altar-candles-large", "altar-candles-medium", "altar-candles-runtime"}

def names(unit):
    return [item["name"] for item in json.loads((MODELS / f"{unit}.json").read_text())["objects"]]

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--group", required=True)
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--source-sha256", required=True)
    parser.add_argument("--quit", action="store_true")
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
    group = args.group
    units = [path.stem for path in MODELS.glob("*.json")]
    if group == "sanctuary-architecture":
        objects = [name for unit in units if unit not in DEVOTIONAL | CANDLES for name in names(unit)]
        source, sha = args.source, args.source_sha256
    elif group == "table":
        objects, source, sha = names("table"), args.source, args.source_sha256
    elif group == "bible":
        objects, source, sha = names("bible"), args.source, args.source_sha256
    elif group == "kneeling-rest":
        objects, source, sha = names("kneeling-rest"), args.source, args.source_sha256
    elif group == "altar-candles-runtime":
        objects, source, sha = names("altar-candles-runtime"), args.source, args.source_sha256
    else:
        raise ValueError(f"Unknown runtime group: {group}")
    output = MODELS / f"{group}.glb"
    sys.argv = ["export_sanctuary_unit.py", "--", "--source", str(source), "--source-sha256", sha, "--output", str(output), "--objects", *objects]
    runpy.run_path(str(Path(__file__).with_name("export_sanctuary_unit.py")), run_name="__main__")
    if args.quit:
        import bpy
        bpy.ops.wm.quit_blender()

if __name__ == "__main__":
    main()
