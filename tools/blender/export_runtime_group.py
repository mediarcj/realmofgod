# File: tools/blender/export_runtime_group.py
# Description: Runs the GUI-current-file exporter for one named Sanctuary V2 runtime group.
# Purpose: Produces the five independent browser assets without opening, saving, or merging Blender files.

import argparse
import json
import runpy
import sys
from pathlib import Path

ROOT = (
    Path(__file__).resolve().parents[2]
    if "__file__" in globals()
    else Path.cwd()
)
EXPORTER = ROOT / "tools/blender/export_sanctuary_unit.py"
MODELS = ROOT / "apps/sanctuary/public/models/sanctuary"
APPROVED_SHA256 = "118ac40912509b1242608fa88163476e0013ee9179f17942b3f8ed3273286e36"
DEVOTIONAL = {"table", "bible", "kneeling-rest"}
CANDLES = {"altar-candles-large", "altar-candles-medium", "altar-candles-runtime"}

def names(unit):
    return [item["name"] for item in json.loads((MODELS / f"{unit}.json").read_text())["objects"]]

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--group", required=True)
    parser.add_argument("--expected-source", type=Path, required=True)
    args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
    group = args.group
    source = args.expected_source.resolve()
    units = [path.stem for path in MODELS.glob("*.json")]
    if group == "sanctuary-architecture":
        objects = [name for unit in units if unit not in DEVOTIONAL | CANDLES for name in names(unit)]
        sha = APPROVED_SHA256
    elif group == "table":
        objects, sha = names("table"), APPROVED_SHA256
    elif group == "bible":
        objects, sha = names("bible"), APPROVED_SHA256
    elif group == "kneeling-rest":
        objects, sha = names("kneeling-rest"), APPROVED_SHA256
    elif group == "altar-candles-runtime":
        objects, sha = [
            "WEB_ALTAR_ACC_HYPER3D_LARGE_LEFT_MASTER.001",
            "WEB_ALTAR_ACC_HYPER3D_LARGE_RIGHT_MASTER.001",
            "WEB_ALTAR_ACC_HYPER3D_MEDIUM_LEFT_ARCH3_MASTER.001",
            "WEB_ALTAR_ACC_HYPER3D_MEDIUM_LEFT_MASTER.001",
            "WEB_ALTAR_ACC_HYPER3D_MEDIUM_RIGHT_ARCH3_MASTER.001",
            "WEB_ALTAR_ACC_HYPER3D_MEDIUM_RIGHT_MASTER.001",
        ], APPROVED_SHA256
    else:
        raise ValueError(f"Unknown runtime group: {group}")
    output = MODELS / f"{group}.glb"
    sys.argv = ["export_sanctuary_unit.py", "--", "--expected-source", str(source), "--output", str(output), "--objects", *objects]
    runpy.run_path(str(EXPORTER), run_name="__main__")

if __name__ == "__main__":
    main()
