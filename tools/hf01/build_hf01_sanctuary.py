# File: tools/hf01/build_hf01_sanctuary.py
# Description: Authors the HF-01 paneled-wood sanctuary and its devotional focal objects in Blender.
# Purpose: Keeps the cinematic room, materials, props, and restrained motion reproducible without downloaded art.
# Notes: Run only through the repository asset script; Blender and generated source files never ship as runtime code.

"""Build the locally authored HF-01 sanctuary source scene and raw glTF asset."""

# Use only Blender's bundled API and Python standard library so authoring remains offline.
from __future__ import annotations

import math
import random
import sys
from array import array
from pathlib import Path
from typing import Callable, Iterable

import bpy
from mathutils import Vector


# Resolve repository-owned output paths from the explicit CLI argument supplied by the build wrapper.
if "--" not in sys.argv:
    raise RuntimeError("Expected repository root after Blender's -- argument.")

REPOSITORY_ROOT = Path(sys.argv[sys.argv.index("--") + 1]).resolve()
SOURCE_ROOT = REPOSITORY_ROOT / "tools" / "hf01" / "source"
TEXTURE_ROOT = SOURCE_ROOT / "textures"
BUILD_ROOT = REPOSITORY_ROOT / "tools" / "hf01" / "build"
BLEND_PATH = SOURCE_ROOT / "realm-hf01-sanctuary.blend"
RAW_GLTF_PATH = BUILD_ROOT / "realm-hf01-sanctuary.raw.glb"

for output_directory in (SOURCE_ROOT, TEXTURE_ROOT, BUILD_ROOT):
    output_directory.mkdir(parents=True, exist_ok=True)


# Start from a deterministic empty scene and use the same frame range for both authored clips.
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.preferences.filepaths.save_version = 0
scene = bpy.context.scene
scene.name = "Realm_HF01_Sanctuary"
scene.render.engine = "BLENDER_EEVEE"
scene.render.fps = 24
scene.frame_start = 1
scene.frame_end = 96
scene.unit_settings.system = "METRIC"
scene.unit_settings.scale_length = 1.0
scene.world = bpy.data.worlds.new("HF01_World")
scene.world.color = (0.015, 0.01, 0.008)
try:
    scene.view_settings.look = "AgX - Medium High Contrast"
except TypeError:
    scene.view_settings.look = "Medium High Contrast"


# Keep generated names and small surface variation stable across rebuilds.
random.seed(46010)


def texture_pixels(
    size: int,
    pixel: Callable[[float, float], tuple[float, float, float, float]],
) -> array:
    """Create one RGBA float buffer from a deterministic local material function."""

    values = array("f")
    denominator = max(1, size - 1)
    for row in range(size):
        v = row / denominator
        for column in range(size):
            u = column / denominator
            values.extend(pixel(u, v))
    return values


def save_texture(
    name: str,
    size: int,
    pixel: Callable[[float, float], tuple[float, float, float, float]],
    *,
    color_space: str,
) -> bpy.types.Image:
    """Generate and save one owned PNG source texture for glTF material export."""

    path = TEXTURE_ROOT / f"{name}.png"
    image = bpy.data.images.new(name, width=size, height=size, alpha=False, float_buffer=False)
    image.colorspace_settings.name = color_space
    image.pixels.foreach_set(texture_pixels(size, pixel))
    image.filepath_raw = str(path)
    image.file_format = "PNG"
    image.save()
    image.pack()
    return image


def load_local_texture(name: str, filename: str, *, color_space: str) -> bpy.types.Image:
    """Load one repository-owned or reviewed CC0 source map without any authoring-time network path."""

    path = TEXTURE_ROOT / filename
    if not path.is_file():
        raise RuntimeError(f"Expected local HF-01 texture is unavailable: {filename}")
    image = bpy.data.images.load(str(path), check_existing=True)
    image.name = name
    image.colorspace_settings.name = color_space
    image.pack()
    return image


# Define a restrained timber grain shared by the room, table, and door material families.
def wood_height(u: float, v: float) -> float:
    bend = math.sin(v * math.tau * 2.1) * 0.045
    long_grain = math.sin((u + bend) * math.tau * 13.0) * 0.52
    fine_grain = math.sin((u * 41.0 + v * 2.7) * math.tau) * 0.19
    knot_distance = math.hypot((u - 0.68) * 1.7, v - 0.42)
    knot = math.sin(knot_distance * math.tau * 17.0) * math.exp(-knot_distance * 7.0)
    return long_grain + fine_grain + knot * 0.72


def wood_base_pixel(u: float, v: float, dark: bool = False) -> tuple[float, float, float, float]:
    grain = wood_height(u, v)
    age = 0.5 + 0.5 * math.sin((v * 3.2 + u * 0.37) * math.tau)
    if dark:
        return (
            0.074 + grain * 0.006 + age * 0.008,
            0.018 + grain * 0.0025 + age * 0.003,
            0.0035 + grain * 0.0008 + age * 0.0008,
            1.0,
        )
    return (
        0.15 + grain * 0.011 + age * 0.012,
        0.041 + grain * 0.004 + age * 0.004,
        0.006 + grain * 0.001 + age * 0.001,
        1.0,
    )


def wood_roughness_pixel(u: float, v: float) -> tuple[float, float, float, float]:
    roughness = max(0.42, min(0.88, 0.66 - wood_height(u, v) * 0.12))
    return (roughness, roughness, roughness, 1.0)


def wood_normal_pixel(u: float, v: float) -> tuple[float, float, float, float]:
    epsilon = 1.0 / 512.0
    dx = wood_height((u + epsilon) % 1.0, v) - wood_height((u - epsilon) % 1.0, v)
    dy = wood_height(u, (v + epsilon) % 1.0) - wood_height(u, (v - epsilon) % 1.0)
    normal = Vector((-dx * 3.8, -dy * 2.2, 1.0)).normalized()
    return (normal.x * 0.5 + 0.5, normal.y * 0.5 + 0.5, normal.z * 0.5 + 0.5, 1.0)


# Give leather a dark tactile grain without a photographic or downloaded source.
def leather_height(u: float, v: float) -> float:
    pores = math.sin(u * math.tau * 47.0) * math.sin(v * math.tau * 53.0)
    broad = math.sin((u * 5.0 + v * 3.0) * math.tau) * 0.3
    return pores * 0.35 + broad


def leather_base_pixel(u: float, v: float) -> tuple[float, float, float, float]:
    grain = leather_height(u, v)
    return (0.055 + grain * 0.009, 0.032 + grain * 0.006, 0.024 + grain * 0.004, 1.0)


def leather_roughness_pixel(u: float, v: float) -> tuple[float, float, float, float]:
    roughness = 0.67 - leather_height(u, v) * 0.07
    return (roughness, roughness, roughness, 1.0)


def leather_normal_pixel(u: float, v: float) -> tuple[float, float, float, float]:
    epsilon = 1.0 / 256.0
    dx = leather_height((u + epsilon) % 1.0, v) - leather_height((u - epsilon) % 1.0, v)
    dy = leather_height(u, (v + epsilon) % 1.0) - leather_height(u, (v - epsilon) % 1.0)
    normal = Vector((-dx * 2.4, -dy * 2.4, 1.0)).normalized()
    return (normal.x * 0.5 + 0.5, normal.y * 0.5 + 0.5, normal.z * 0.5 + 0.5, 1.0)


# Use a subtle woven pattern for the low cushion rather than a flat color.
def fabric_height(u: float, v: float) -> float:
    warp = math.sin(u * math.tau * 72.0)
    weft = math.sin(v * math.tau * 68.0)
    return warp * weft


def fabric_base_pixel(u: float, v: float) -> tuple[float, float, float, float]:
    weave = fabric_height(u, v)
    return (0.16 + weave * 0.018, 0.175 + weave * 0.017, 0.11 + weave * 0.012, 1.0)


def fabric_roughness_pixel(u: float, v: float) -> tuple[float, float, float, float]:
    roughness = 0.86 - abs(fabric_height(u, v)) * 0.08
    return (roughness, roughness, roughness, 1.0)


# Give the Bible pages fibrous paper and non-semantic line structure without encoding readable text.
def paper_base_pixel(u: float, v: float) -> tuple[float, float, float, float]:
    fiber = math.sin((u * 87.0 + v * 7.0) * math.tau) * 0.008
    age = math.sin((u * 2.0 - v * 1.3) * math.tau) * 0.006
    margin = 0.11 < u < 0.89 and 0.08 < v < 0.92
    column_gap = 0.475 < u < 0.525
    line_phase = (v * 24.0) % 1.0
    line = margin and not column_gap and line_phase < 0.17
    short_line = ((v * 12.0) % 1.0) > 0.86 and (u < 0.39 or u > 0.61)
    ink = 0.4 if line and not short_line else 0.0
    return (
        0.82 + fiber + age - ink,
        0.765 + fiber * 0.8 + age - ink * 0.92,
        0.64 + fiber * 0.5 - ink * 0.76,
        1.0,
    )


def paper_roughness_pixel(u: float, v: float) -> tuple[float, float, float, float]:
    roughness = 0.88 + math.sin((u * 29.0 + v * 31.0) * math.tau) * 0.025
    return (roughness, roughness, roughness, 1.0)


# Generate only the compact source maps needed for visible PBR variation.
wood_light_base = save_texture(
    "wood-light-basecolor", 512, lambda u, v: wood_base_pixel(u, v), color_space="sRGB"
)
wood_dark_base = save_texture(
    "wood-dark-basecolor", 512, lambda u, v: wood_base_pixel(u, v, True), color_space="sRGB"
)
wood_roughness = save_texture(
    "wood-roughness", 512, wood_roughness_pixel, color_space="Non-Color"
)
wood_normal = save_texture("wood-normal", 512, wood_normal_pixel, color_space="Non-Color")
leather_base = save_texture(
    "leather-basecolor", 256, leather_base_pixel, color_space="sRGB"
)
leather_roughness = save_texture(
    "leather-roughness", 256, leather_roughness_pixel, color_space="Non-Color"
)
leather_normal = save_texture(
    "leather-normal", 256, leather_normal_pixel, color_space="Non-Color"
)
fabric_base = save_texture("fabric-basecolor", 256, fabric_base_pixel, color_space="sRGB")
fabric_roughness = save_texture(
    "fabric-roughness", 256, fabric_roughness_pixel, color_space="Non-Color"
)
paper_base = save_texture("paper-basecolor", 512, paper_base_pixel, color_space="sRGB")
paper_roughness = save_texture(
    "paper-roughness", 256, paper_roughness_pixel, color_space="Non-Color"
)

# Replace the broad procedural hero wood with a reviewed local CC0 scan while retaining offline rebuilds.
wood_cc0_base = load_local_texture(
    "wood-cc0-basecolor",
    "cc0-fine-grained-wood-basecolor-1k.jpg",
    color_space="sRGB",
)
wood_cc0_roughness = load_local_texture(
    "wood-cc0-roughness",
    "cc0-fine-grained-wood-roughness-1k.jpg",
    color_space="Non-Color",
)
wood_cc0_normal = load_local_texture(
    "wood-cc0-normal-gl",
    "cc0-fine-grained-wood-normal-gl-1k.jpg",
    color_space="Non-Color",
)


def pbr_material(
    name: str,
    *,
    base_image: bpy.types.Image | None = None,
    roughness_image: bpy.types.Image | None = None,
    normal_image: bpy.types.Image | None = None,
    base_color: tuple[float, float, float, float] = (0.5, 0.5, 0.5, 1.0),
    roughness: float = 0.7,
    metallic: float = 0.0,
    normal_strength: float = 0.42,
) -> bpy.types.Material:
    """Create one exporter-friendly Principled material with direct texture channels."""

    material = bpy.data.materials.new(name)
    material.use_nodes = True
    material.use_backface_culling = True
    material.diffuse_color = base_color
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    principled = nodes.get("Principled BSDF")
    principled.inputs["Base Color"].default_value = base_color
    principled.inputs["Roughness"].default_value = roughness
    principled.inputs["Metallic"].default_value = metallic

    if base_image is not None:
        base_node = nodes.new("ShaderNodeTexImage")
        base_node.name = f"{name}_BaseColor"
        base_node.image = base_image
        links.new(base_node.outputs["Color"], principled.inputs["Base Color"])
    if roughness_image is not None:
        roughness_node = nodes.new("ShaderNodeTexImage")
        roughness_node.name = f"{name}_Roughness"
        roughness_node.image = roughness_image
        links.new(roughness_node.outputs["Color"], principled.inputs["Roughness"])
    if normal_image is not None:
        normal_texture = nodes.new("ShaderNodeTexImage")
        normal_texture.name = f"{name}_NormalTexture"
        normal_texture.image = normal_image
        normal_map = nodes.new("ShaderNodeNormalMap")
        normal_map.name = f"{name}_NormalMap"
        normal_map.inputs["Strength"].default_value = normal_strength
        links.new(normal_texture.outputs["Color"], normal_map.inputs["Color"])
        links.new(normal_map.outputs["Normal"], principled.inputs["Normal"])
    return material


# Assemble a small controlled material palette shared across many meshes to limit draw calls.
wood_light = pbr_material(
    "HF01_Wood_Honey",
    base_image=wood_cc0_base,
    roughness_image=wood_cc0_roughness,
    normal_image=wood_cc0_normal,
    normal_strength=0.36,
)
wood_dark = pbr_material(
    "HF01_Wood_Smoked",
    base_image=wood_cc0_base,
    roughness_image=wood_cc0_roughness,
    normal_image=wood_cc0_normal,
    base_color=(0.36, 0.24, 0.16, 1.0),
    normal_strength=0.32,
)
wood_table = pbr_material(
    "HF01_Wood_Table",
    base_image=wood_cc0_base,
    roughness_image=wood_cc0_roughness,
    normal_image=wood_cc0_normal,
    base_color=(0.78, 0.61, 0.46, 1.0),
    roughness=0.58,
    normal_strength=0.48,
)
wood_floor_dark = pbr_material(
    "HF01_Wood_Floor_Dark",
    base_image=wood_cc0_base,
    roughness_image=wood_cc0_roughness,
    normal_image=wood_cc0_normal,
    base_color=(0.58, 0.43, 0.31, 1.0),
    normal_strength=0.42,
)
leather = pbr_material(
    "HF01_Bible_Leather",
    base_image=leather_base,
    roughness_image=leather_roughness,
    normal_image=leather_normal,
    normal_strength=0.2,
)
fabric = pbr_material(
    "HF01_Cushion_Fabric",
    base_image=fabric_base,
    roughness_image=fabric_roughness,
)
paper = pbr_material(
    "HF01_Bible_Paper",
    base_image=paper_base,
    roughness_image=paper_roughness,
)
paper_line = pbr_material(
    "HF01_Bible_Page_Lines",
    base_color=(0.2, 0.135, 0.09, 1.0),
    roughness=0.92,
)
metal_dark = pbr_material(
    "HF01_Iron",
    base_color=(0.035, 0.032, 0.029, 1.0),
    roughness=0.32,
    metallic=0.82,
)
metal_warm = pbr_material(
    "HF01_Brass",
    base_color=(0.31, 0.18, 0.055, 1.0),
    roughness=0.34,
    metallic=0.72,
)
metal_silver = pbr_material(
    "HF01_Cross_Silver",
    base_color=(0.58, 0.61, 0.62, 1.0),
    roughness=0.18,
    metallic=0.96,
)
rug_material = pbr_material(
    "HF01_Rug",
    base_color=(0.16, 0.09, 0.055, 1.0),
    roughness=0.95,
)
foliage_material = pbr_material(
    "HF01_Exterior_Foliage",
    base_color=(0.055, 0.14, 0.085, 1.0),
    roughness=0.92,
)


def emissive_material(
    name: str,
    color: tuple[float, float, float, float],
    strength: float,
) -> bpy.types.Material:
    """Create one small exporter-friendly emissive material for a physical candle flame."""

    material = pbr_material(name, base_color=color, roughness=0.45)
    principled = material.node_tree.nodes.get("Principled BSDF")
    emission_color = principled.inputs.get("Emission Color") or principled.inputs.get("Emission")
    emission_strength = principled.inputs.get("Emission Strength")
    if emission_color is not None:
        emission_color.default_value = color
    if emission_strength is not None:
        emission_strength.default_value = strength
    return material


# Candles are authored physical props, while their restrained practical illumination is applied at runtime.
candle_wax = pbr_material(
    "HF01_Candle_Wax",
    base_color=(0.88, 0.67, 0.34, 1.0),
    roughness=0.61,
)
wick_material = pbr_material(
    "HF01_Candle_Wick",
    base_color=(0.035, 0.025, 0.018, 1.0),
    roughness=0.9,
)
flame_material = emissive_material(
    "HF01_Candle_Flame",
    (1.0, 0.22, 0.025, 1.0),
    2.4,
)
flame_core_material = emissive_material(
    "HF01_Candle_Flame_Core",
    (1.0, 0.82, 0.3, 1.0),
    3.2,
)


# Keep the hierarchy explicit so animation clips and runtime tests can locate stable node names.
root = bpy.data.objects.new("HF01_Sanctuary_Root", None)
root["asset_id"] = "ROG-HF01-SANCTUARY-001"
root["ownership"] = "Locally authored for Realm of God"
scene.collection.objects.link(root)


def apply_bevel(obj: bpy.types.Object, width: float, segments: int) -> None:
    """Apply small real edge radii so timber and furniture catch light naturally."""

    if width <= 0:
        return
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    modifier = obj.modifiers.new(name="Crafted_Edge", type="BEVEL")
    modifier.width = width
    modifier.segments = segments
    modifier.limit_method = "ANGLE"
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    obj.select_set(False)


def box(
    name: str,
    location: tuple[float, float, float],
    dimensions: tuple[float, float, float],
    material: bpy.types.Material,
    *,
    bevel: float = 0.025,
    segments: int = 2,
    rotation: tuple[float, float, float] = (0.0, 0.0, 0.0),
    parent: bpy.types.Object = root,
) -> bpy.types.Object:
    """Create one authored beveled solid in local coordinates under its intended parent."""

    bpy.ops.mesh.primitive_cube_add(location=(0.0, 0.0, 0.0))
    obj = bpy.context.object
    obj.name = name
    obj.parent = parent
    obj.location = location
    obj.rotation_euler = rotation
    obj.dimensions = dimensions
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    apply_bevel(obj, min(bevel, min(dimensions) * 0.24), segments)
    obj.data.materials.append(material)
    return obj


def cylinder(
    name: str,
    location: tuple[float, float, float],
    radius: float,
    depth: float,
    material: bpy.types.Material,
    *,
    vertices: int = 16,
    rotation: tuple[float, float, float] = (0.0, 0.0, 0.0),
    parent: bpy.types.Object = root,
) -> bpy.types.Object:
    """Create one modestly faceted authored round detail such as hardware or a tree trunk."""

    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth)
    obj = bpy.context.object
    obj.name = name
    obj.parent = parent
    obj.location = location
    obj.rotation_euler = rotation
    obj.data.materials.append(material)
    apply_bevel(obj, min(radius * 0.18, 0.025), 2)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    triangulate = obj.modifiers.new(name="Web_Triangles", type="TRIANGULATE")
    bpy.ops.object.modifier_apply(modifier=triangulate.name)
    obj.select_set(False)
    return obj


def curved_page(
    name: str,
    width: float,
    depth: float,
    material: bpy.types.Material,
    *,
    parent: bpy.types.Object,
    height: float = 0.035,
) -> bpy.types.Object:
    """Create a lightly curved blank page surface with owned UVs and real thickness."""

    columns = 8
    rows = 6
    vertices: list[tuple[float, float, float]] = []
    faces: list[tuple[int, int, int, int]] = []
    for column in range(columns):
        u = column / (columns - 1)
        for row in range(rows):
            v = row / (rows - 1)
            x = width * u
            y = depth * (v - 0.5)
            edge_lift = height * (u**1.65)
            gentle_crown = 0.008 * (1.0 - (v * 2.0 - 1.0) ** 2)
            vertices.append((x, y, edge_lift + gentle_crown))
    for column in range(columns - 1):
        for row in range(rows - 1):
            first = column * rows + row
            faces.append((first, first + rows, first + rows + 1, first + 1))

    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    uv_layer = mesh.uv_layers.new(name="Page_UV")
    for polygon in mesh.polygons:
        for loop_index in polygon.loop_indices:
            vertex_index = mesh.loops[loop_index].vertex_index
            column = vertex_index // rows
            row = vertex_index % rows
            uv_layer.data[loop_index].uv = (column / (columns - 1), row / (rows - 1))

    obj = bpy.data.objects.new(name, mesh)
    obj.parent = parent
    scene.collection.objects.link(obj)
    obj.data.materials.append(material)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    solidify = obj.modifiers.new(name="Page_Thickness", type="SOLIDIFY")
    solidify.thickness = 0.008
    solidify.offset = 0.0
    bpy.ops.object.modifier_apply(modifier=solidify.name)
    apply_bevel(obj, 0.004, 2)
    obj.select_set(False)
    return obj


def open_page_surface(
    name: str,
    side: int,
    width: float,
    depth: float,
    material: bpy.types.Material,
    *,
    parent: bpy.types.Object,
    edge_lift: float = 0.045,
) -> bpy.types.Object:
    """Create one signed half of an open book with a raised spine and gently curled outer edge."""

    columns = 12
    rows = 8
    vertices: list[tuple[float, float, float]] = []
    faces: list[tuple[int, int, int, int]] = []
    for column in range(columns):
        u = column / (columns - 1)
        for row in range(rows):
            v = row / (rows - 1)
            x = side * width * u
            y = depth * (v - 0.5)
            spine_crown = 0.044 * math.exp(-u * 4.2)
            outer_curl = edge_lift * (u**3.2)
            page_crown = 0.018 * (1.0 - (v * 2.0 - 1.0) ** 2)
            vertices.append((x, y, spine_crown + outer_curl + page_crown))
    for column in range(columns - 1):
        for row in range(rows - 1):
            first = column * rows + row
            faces.append((first, first + rows, first + rows + 1, first + 1))

    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    uv_layer = mesh.uv_layers.new(name="Open_Page_UV")
    for polygon in mesh.polygons:
        for loop_index in polygon.loop_indices:
            vertex_index = mesh.loops[loop_index].vertex_index
            column = vertex_index // rows
            row = vertex_index % rows
            uv_layer.data[loop_index].uv = (column / (columns - 1), row / (rows - 1))

    obj = bpy.data.objects.new(name, mesh)
    obj.parent = parent
    scene.collection.objects.link(obj)
    obj.data.materials.append(material)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    solidify = obj.modifiers.new(name="Page_Thickness", type="SOLIDIFY")
    solidify.thickness = 0.007
    solidify.offset = 0.0
    bpy.ops.object.modifier_apply(modifier=solidify.name)
    apply_bevel(obj, 0.003, 2)
    obj.select_set(False)
    return obj


def join_meshes(objects: Iterable[bpy.types.Object], name: str) -> bpy.types.Object:
    """Join static meshes that share a material to reduce browser draw calls."""

    members = list(objects)
    bpy.ops.object.select_all(action="DESELECT")
    for member in members:
        member.select_set(True)
    bpy.context.view_layer.objects.active = members[0]
    bpy.ops.object.join()
    joined = bpy.context.object
    joined.name = name
    joined.parent = root
    joined.select_set(False)
    return joined


# Build alternating floor-board families so depth and age remain legible without obvious identical repetition.
floor_board_groups: tuple[list[bpy.types.Object], list[bpy.types.Object]] = ([], [])
for index in range(12):
    x = -3.66 + index * 0.665
    floor_board_groups[index % 2].append(
        box(
            f"FloorBoard_{index + 1:02d}",
            (x, -2.65 + random.uniform(-0.025, 0.025), -0.055 + random.uniform(-0.006, 0.006)),
            (0.62 + random.uniform(-0.018, 0.018), 9.25, 0.12),
            wood_light if index % 2 == 0 else wood_floor_dark,
            bevel=0.018,
            rotation=(0.0, 0.0, random.uniform(-0.0025, 0.0025)),
        )
    )
join_meshes(floor_board_groups[0], "HF01_Floorboards_Honey")
join_meshes(floor_board_groups[1], "HF01_Floorboards_Smoked")


# Build solid room shells first so every decorative seam reads as real depth rather than a light leak.
wall_panels: list[bpy.types.Object] = [
    box("BackWall_Shell", (0.0, -7.28, 2.2), (8.0, 0.18, 4.5), wood_dark, bevel=0.01),
]
for side in (-1, 1):
    wall_panels.append(
        box(
            f"SideWall_Shell_{'L' if side < 0 else 'R'}",
            (side * 4.0, -2.64, 2.2),
            (0.2, 9.45, 4.5),
            wood_dark,
            bevel=0.01,
        )
    )
    wall_panels.append(
        box(
            f"FrontWall_Shell_{'L' if side < 0 else 'R'}",
            (side * 2.73, 1.95, 2.2),
            (2.5, 0.2, 4.5),
            wood_dark,
            bevel=0.01,
        )
    )
wall_panels.append(box("FrontWall_Header", (0.0, 1.95, 3.96), (3.02, 0.2, 0.98), wood_dark, bevel=0.01))

# Vertical lower boards and framed upper panels reproduce the sturdy old-room construction in the reference.
for side in (-1, 1):
    for index in range(4):
        x = side * (1.76 + index * 0.6)
        wall_panels.append(
            box(
                f"FrontWainscot_{'L' if side < 0 else 'R'}_{index + 1:02d}",
                (x, 1.82, 0.92),
                (0.52, 0.08, 1.48),
                wood_light,
                bevel=0.018,
            )
        )
    for index in range(8):
        y = -5.95 + index * 1.05
        wall_panels.append(
            box(
                f"SideWainscot_{'L' if side < 0 else 'R'}_{index + 1:02d}",
                (side * 3.88, y, 0.92),
                (0.08, 0.92, 1.48),
                wood_light,
                bevel=0.018,
            )
        )

# Large upper fields avoid the repeated-log look and let broad wood grain sit behind crafted molding.
for side in (-1, 1):
    wall_panels.append(
        box(
            f"FrontUpperPanel_{'L' if side < 0 else 'R'}",
            (side * 2.72, 1.81, 2.91),
            (2.2, 0.075, 1.65),
            wood_light,
            bevel=0.025,
            segments=3,
        )
    )
    for index, y in enumerate((-5.6, -3.35, -1.1, 1.05)):
        wall_panels.append(
            box(
                f"SideUpperPanel_{'L' if side < 0 else 'R'}_{index + 1:02d}",
                (side * 3.87, y, 2.91),
                (0.075, 1.92, 1.65),
                wood_light,
                bevel=0.025,
                segments=3,
            )
        )
join_meshes(wall_panels, "HF01_PaneledWalls")

# Chair rails, baseboards, crown molding, and inset frames create the old-world depth hierarchy.
trim: list[bpy.types.Object] = []
for side in (-1, 1):
    trim.extend(
        [
            box(f"FrontBase_{side}", (side * 2.72, 1.70, 0.16), (2.5, 0.19, 0.25), wood_dark, bevel=0.04, segments=3),
            box(f"FrontChairRail_{side}", (side * 2.72, 1.68, 1.78), (2.52, 0.24, 0.22), wood_dark, bevel=0.045, segments=3),
            box(f"FrontCrown_{side}", (side * 2.72, 1.66, 4.1), (2.52, 0.28, 0.28), wood_dark, bevel=0.05, segments=3),
            box(f"SideBase_{side}", (side * 3.79, -2.64, 0.16), (0.24, 9.45, 0.25), wood_dark, bevel=0.04, segments=3),
            box(f"SideChairRail_{side}", (side * 3.76, -2.64, 1.78), (0.3, 9.45, 0.22), wood_dark, bevel=0.045, segments=3),
            box(f"SideCrown_{side}", (side * 3.73, -2.64, 4.1), (0.34, 9.45, 0.28), wood_dark, bevel=0.05, segments=3),
        ]
    )
    for x in (side * 1.58, side * 3.86):
        trim.append(box(f"FrontUpperStile_{x}", (x, 1.61, 2.91), (0.17, 0.22, 1.92), wood_dark, bevel=0.035, segments=3))
    for z in (1.94, 3.88):
        trim.append(box(f"FrontUpperRail_{side}_{z}", (side * 2.72, 1.61, z), (2.46, 0.22, 0.17), wood_dark, bevel=0.035, segments=3))
    for y in (-6.65, -4.5, -2.25, 0.0, 2.0):
        trim.append(box(f"SideUpperStile_{side}_{y}", (side * 3.68, y, 2.91), (0.24, 0.18, 1.92), wood_dark, bevel=0.035, segments=3))
    for z in (1.94, 3.88):
        trim.append(box(f"SideUpperRail_{side}_{z}", (side * 3.67, -2.65, z), (0.25, 9.35, 0.17), wood_dark, bevel=0.035, segments=3))

# Deep corner posts and a single restrained ceiling frame complete the intimate enclosure.
for x in (-3.75, 3.75):
    for y in (-7.04, 1.7):
        trim.append(box(f"CornerPost_{x}_{y}", (x, y, 2.24), (0.34, 0.34, 4.48), wood_dark, bevel=0.05, segments=3))
for y in (-6.95, 1.5):
    trim.append(box(f"CeilingFrame_{y}", (0.0, y, 4.32), (7.7, 0.3, 0.34), wood_dark, bevel=0.05, segments=3))
join_meshes(trim, "HF01_CraftedMolding")


# Center one handmade trestle table with a thick worn top, broad feet, and a visible stretcher.
table_parts = [
    box("PrayerTable_Top", (0.0, -0.32, 0.78), (3.68, 1.32, 0.2), wood_table, bevel=0.105, segments=5),
    box("PrayerTable_Top_Seam", (0.0, -0.32, 0.887), (0.022, 1.17, 0.012), wood_dark, bevel=0.004),
    box("PrayerTable_Apron_Front", (0.0, -0.89, 0.61), (3.2, 0.13, 0.24), wood_dark, bevel=0.045, segments=3),
    box("PrayerTable_Apron_Back", (0.0, 0.25, 0.61), (3.2, 0.13, 0.24), wood_dark, bevel=0.045, segments=3),
    box("PrayerTable_Stretcher", (0.0, -0.32, 0.26), (2.48, 0.17, 0.17), wood_dark, bevel=0.055, segments=3),
]
for x in (-1.34, 1.34):
    table_parts.extend(
        [
            box(f"PrayerTable_Trestle_{x}", (x, -0.32, 0.42), (0.3, 0.78, 0.66), wood_dark, bevel=0.07, segments=4),
            box(f"PrayerTable_Foot_{x}", (x, -0.32, 0.095), (0.68, 1.02, 0.15), wood_dark, bevel=0.065, segments=4),
            box(f"PrayerTable_TrestleCap_{x}", (x, -0.32, 0.68), (0.55, 0.94, 0.13), wood_dark, bevel=0.05, segments=3),
        ]
    )
join_meshes(table_parts, "HF01_PrayerTable")


def candle_fixture(name: str, x: float) -> bpy.types.Object:
    """Author one complete brass candle fixture with wax, wick, and a small luminous flame."""

    fixture = bpy.data.objects.new(name, None)
    fixture.parent = root
    fixture.location = (x, -0.18, 0.9)
    scene.collection.objects.link(fixture)

    # A broad base, short stem, and cup make the flame visibly supported instead of floating.
    cylinder(f"{name}_Base", (0.0, 0.0, 0.035), 0.19, 0.07, metal_warm, vertices=40, parent=fixture)
    cylinder(f"{name}_Foot", (0.0, 0.0, 0.085), 0.13, 0.045, metal_warm, vertices=36, parent=fixture)
    cylinder(f"{name}_Stem", (0.0, 0.0, 0.18), 0.045, 0.22, metal_warm, vertices=28, parent=fixture)
    cylinder(f"{name}_Collar", (0.0, 0.0, 0.285), 0.085, 0.055, metal_warm, vertices=32, parent=fixture)
    cylinder(f"{name}_Cup", (0.0, 0.0, 0.345), 0.115, 0.065, metal_warm, vertices=36, parent=fixture)
    cylinder(f"{name}_Wax", (0.0, 0.0, 0.625), 0.073, 0.54, candle_wax, vertices=40, parent=fixture)
    cylinder(f"{name}_WaxDrip", (0.055, -0.008, 0.69), 0.018, 0.16, candle_wax, vertices=16, parent=fixture)
    cylinder(f"{name}_Wick", (0.0, 0.0, 0.915), 0.009, 0.06, wick_material, vertices=12, parent=fixture)

    # A stretched low-poly sphere keeps the flame silhouette soft from desktop and mobile cameras.
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=0.083)
    flame = bpy.context.object
    flame.name = f"{name}_Flame"
    flame.parent = fixture
    flame.location = (0.0, 0.0, 0.995)
    flame.scale = (0.42, 0.42, 1.42)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    flame.data.materials.append(flame_material)

    # A small warm core keeps the flame luminous without turning it into a white cardboard shape.
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=0.048)
    core = bpy.context.object
    core.name = f"{name}_FlameCore"
    core.parent = fixture
    core.location = (0.0, -0.008, 0.975)
    core.scale = (0.38, 0.38, 1.05)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    core.data.materials.append(flame_core_material)
    return fixture


# Two physical candles flank the Bible and establish the room's practical-light source.
candle_fixture("HF01_Candle_Left", -1.12)
candle_fixture("HF01_Candle_Right", 1.12)


# Lay one substantial reflective metal cross beside the Bible as a separate devotional object.
table_cross = bpy.data.objects.new("HF01_TableCross_Root", None)
table_cross.parent = root
table_cross.location = (-0.08, -0.2, 0.915)
table_cross.rotation_euler.z = math.radians(-55.0)
table_cross.scale = (1.14, 1.14, 1.14)
scene.collection.objects.link(table_cross)
box("TableCross_Long", (0.0, 0.0, 0.0), (0.23, 1.22, 0.105), metal_silver, bevel=0.048, segments=5, parent=table_cross)
box("TableCross_Arm", (0.0, 0.23, 0.0), (0.78, 0.23, 0.105), metal_silver, bevel=0.048, segments=5, parent=table_cross)


# Build a hinged timber door with recessed panels, iron straps, latch, and real frame depth.
door_pivot = bpy.data.objects.new("HF01_Door_Hinge", None)
door_pivot.parent = root
door_pivot.location = (-1.3, 1.83, 0.12)
scene.collection.objects.link(door_pivot)
door_pivot.rotation_euler.z = math.radians(74.0)

door_parts = [
    box("Door_Slab", (1.3, 0.0, 1.7), (2.54, 0.16, 3.38), wood_light, bevel=0.055, segments=4, parent=door_pivot),
    box("Door_TopRail", (1.3, -0.105, 3.08), (2.3, 0.08, 0.18), wood_dark, bevel=0.03, parent=door_pivot),
    box("Door_MidRail", (1.3, -0.105, 1.7), (2.3, 0.08, 0.18), wood_dark, bevel=0.03, parent=door_pivot),
    box("Door_BottomRail", (1.3, -0.105, 0.3), (2.3, 0.08, 0.18), wood_dark, bevel=0.03, parent=door_pivot),
]
for x in (0.28, 2.32):
    door_parts.append(box(f"Door_Stile_{x}", (x, -0.105, 1.7), (0.17, 0.08, 3.02), wood_dark, bevel=0.025, parent=door_pivot))

# Narrow face boards give the door visible vertical grain and age beneath its structural rails.
for index in range(6):
    box(
        f"Door_InteriorBoard_{index + 1:02d}",
        (0.25 + index * 0.42, -0.095, 1.7),
        (0.36, 0.025, 3.02),
        wood_light,
        bevel=0.014,
        parent=door_pivot,
    )

# Mirror restrained joinery onto the exterior face seen during the fresh threshold arrival.
for label, height in (("Top", 3.08), ("Mid", 1.7), ("Bottom", 0.3)):
    box(
        f"Door_Outer{label}Rail",
        (1.3, 0.105, height),
        (2.3, 0.08, 0.18),
        wood_dark,
        bevel=0.03,
        parent=door_pivot,
    )
for x in (0.28, 2.32):
    box(
        f"Door_OuterStile_{x}",
        (x, 0.105, 1.7),
        (0.17, 0.08, 3.02),
        wood_dark,
        bevel=0.025,
        parent=door_pivot,
    )

for height in (0.62, 2.72):
    box(f"Door_HingeStrap_{height}", (0.78, -0.145, height), (1.52, 0.055, 0.12), metal_dark, bevel=0.025, parent=door_pivot)
    cylinder(
        f"Door_HingePin_{height}",
        (0.05, -0.14, height),
        0.055,
        0.24,
        metal_dark,
        vertices=20,
        rotation=(math.pi / 2.0, 0.0, 0.0),
        parent=door_pivot,
    )

box("Door_LatchPlate", (2.17, -0.145, 1.47), (0.23, 0.055, 0.38), metal_dark, bevel=0.035, parent=door_pivot)
cylinder(
    "Door_Latch",
    (2.17, -0.22, 1.48),
    0.065,
    0.2,
    metal_warm,
    vertices=24,
    rotation=(math.pi / 2.0, 0.0, 0.0),
    parent=door_pivot,
)
box("Door_OuterLatchPlate", (2.17, 0.145, 1.47), (0.23, 0.055, 0.38), metal_dark, bevel=0.035, parent=door_pivot)
cylinder(
    "Door_OuterLatch",
    (2.17, 0.22, 1.48),
    0.065,
    0.2,
    metal_warm,
    vertices=24,
    rotation=(math.pi / 2.0, 0.0, 0.0),
    parent=door_pivot,
)

door_frame_parts = [
    box("DoorFrame_Left", (-1.45, 1.78, 1.76), (0.24, 0.42, 3.54), wood_dark, bevel=0.04, segments=3),
    box("DoorFrame_Right", (1.45, 1.78, 1.76), (0.24, 0.42, 3.54), wood_dark, bevel=0.04, segments=3),
    box("DoorFrame_Header", (0.0, 1.78, 3.5), (3.14, 0.42, 0.25), wood_dark, bevel=0.04, segments=3),
    box("DoorFrame_TransomFill", (0.0, 1.86, 3.78), (2.92, 0.3, 0.34), wood_light, bevel=0.035, segments=3),
    box("Door_Threshold", (0.0, 1.78, 0.08), (3.05, 0.62, 0.15), wood_light, bevel=0.045, segments=3),
]
join_meshes(door_frame_parts, "HF01_DoorFrame")


# Construct a substantial blank open Bible with curved pages and a settled devotional silhouette.
bible_root = bpy.data.objects.new("HF01_Bible_Root", None)
bible_root.parent = root
bible_root.location = (0.67, -0.31, 0.915)
bible_root.rotation_euler.z = math.radians(-2.5)
scene.collection.objects.link(bible_root)

box("Bible_LeftBottomCover", (-0.62, 0.0, 0.018), (1.3, 1.0, 0.075), leather, bevel=0.065, segments=5, parent=bible_root)
box("Bible_RightBottomCover", (0.62, 0.0, 0.018), (1.3, 1.0, 0.075), leather, bevel=0.065, segments=5, parent=bible_root)
box("Bible_LeftPageBlock", (-0.61, 0.0, 0.095), (1.18, 0.9, 0.13), paper, bevel=0.045, segments=4, parent=bible_root)
box("Bible_RightPageBlock", (0.61, 0.0, 0.095), (1.18, 0.9, 0.13), paper, bevel=0.045, segments=4, parent=bible_root)
box("Bible_Spine", (0.0, 0.0, 0.11), (0.13, 1.04, 0.2), leather, bevel=0.045, segments=4, parent=bible_root)

# The hero still begins with two visibly curved page fields rather than hinged rectangular slabs.
left_open_page = open_page_surface("Bible_LeftOpenPage", -1, 1.18, 0.88, paper, parent=bible_root, edge_lift=0.035)
left_open_page.location.z = 0.18
right_open_page = open_page_surface("Bible_RightOpenPage", 1, 1.18, 0.88, paper, parent=bible_root, edge_lift=0.028)
right_open_page.location.z = 0.18

right_page_pivot = bpy.data.objects.new("HF01_Bible_RightPage_Hinge", None)
right_page_pivot.parent = bible_root
right_page_pivot.location = (0.0, 0.0, 0.21)
right_page_pivot.rotation_euler.y = 0.0
scene.collection.objects.link(right_page_pivot)

top_cover_pivot = bpy.data.objects.new("HF01_Bible_TopCover_Hinge", None)
top_cover_pivot.parent = bible_root
top_cover_pivot.location = (0.0, 0.0, 0.16)
top_cover_pivot.rotation_euler.y = math.radians(-179.0)
scene.collection.objects.link(top_cover_pivot)

page_pivot = bpy.data.objects.new("HF01_Bible_LeftPages_Hinge", None)
page_pivot.parent = bible_root
page_pivot.location = (0.0, 0.0, 0.2)
page_pivot.rotation_euler.y = math.radians(-179.0)
scene.collection.objects.link(page_pivot)

page_leaf_pivot = bpy.data.objects.new("HF01_Bible_PageLeaf_Hinge", None)
page_leaf_pivot.parent = bible_root
page_leaf_pivot.location = (0.0, 0.0, 0.142)
page_leaf_pivot.rotation_euler.y = math.radians(-1.0)
scene.collection.objects.link(page_leaf_pivot)
page_leaf = open_page_surface("Bible_PageLeaf", 1, 1.22, 0.88, paper, parent=page_leaf_pivot, edge_lift=0.028)
page_leaf.location.z = 0.008

# Add thin blank page-edge bands to make the closed and open silhouettes legible at hero scale.
for side in (-1, 1):
    for index, z in enumerate((0.043, 0.063, 0.083, 0.103)):
        box(
            f"Bible_PageEdge_{'L' if side < 0 else 'R'}_{index + 1}",
            (side * 0.67, -0.47, z),
            (1.15, 0.016, 0.01),
            paper,
            bevel=0.003,
            segments=1,
            parent=bible_root,
        )

# Raised non-semantic strokes remain legible at hero distance without pretending to contain Bible text.
for side in (-1, 1):
    for index, y in enumerate((-0.3, -0.19, -0.08, 0.03, 0.14, 0.25, 0.36)):
        line_width = 0.42 if index in (2, 6) else 0.49
        box(
            f"Bible_PageLine_{'L' if side < 0 else 'R'}_{index + 1:02d}",
            (side * 0.61, y, 0.238),
            (line_width, 0.012, 0.006),
            paper_line,
            bevel=0.002,
            segments=1,
            parent=bible_root,
        )


# Supply only a restrained irregular exterior glimpse so the hero doorway avoids cone-tree shorthand.
exterior_parts: list[bpy.types.Object] = []
for index, (x, y, scale) in enumerate(((-2.8, 4.8, 1.0), (2.65, 5.5, 1.22), (-4.2, 7.0, 1.4), (4.1, 7.8, 1.25))):
    exterior_parts.append(cylinder(f"ExteriorTrunk_{index}", (x, y, 1.55 * scale), 0.2 * scale, 3.1 * scale, wood_dark, vertices=14))
    for cluster, offset in enumerate(((-0.32, 0.0, 2.85), (0.28, 0.12, 3.35), (0.0, -0.16, 3.78))):
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=(0.78 - cluster * 0.08) * scale)
        foliage = bpy.context.object
        foliage.name = f"ExteriorFoliage_{index}_{cluster}"
        foliage.parent = root
        foliage.location = (x + offset[0] * scale, y + offset[1] * scale, offset[2] * scale)
        foliage.scale = (1.2, 0.82, 0.72)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
        foliage.data.materials.append(foliage_material)
        exterior_parts.append(foliage)
join_meshes(exterior_parts, "HF01_ExteriorGlimpse")


# Place renderer-readable locators for the threshold and settled hero compositions.
for name, location in (
    ("HF01_Camera_Arrival", (-0.25, 4.5, 1.68)),
    ("HF01_Camera_Hero", (0.0, -5.9, 1.86)),
    ("HF01_Focus_PrayerTable", (0.0, -0.3, 1.18)),
):
    locator = bpy.data.objects.new(name, None)
    locator.parent = root
    locator.location = location
    locator.empty_display_type = "SPHERE"
    locator.empty_display_size = 0.12
    scene.collection.objects.link(locator)


# Preserve two source-scene cameras for local art review without exporting a runtime camera.
def preview_camera(
    name: str,
    location: tuple[float, float, float],
    target: tuple[float, float, float],
    lens: float,
) -> bpy.types.Object:
    """Create one Blender-only review camera aimed at a physical point in the room."""

    data = bpy.data.cameras.new(name)
    data.lens = lens
    data.sensor_width = 36.0
    camera = bpy.data.objects.new(name, data)
    camera.location = location
    camera.rotation_euler = (Vector(target) - camera.location).to_track_quat("-Z", "Y").to_euler()
    scene.collection.objects.link(camera)
    return camera


arrival_camera = preview_camera(
    "HF01_Preview_Arrival",
    (0.0, 5.3, 1.68),
    (0.65, -0.55, 1.0),
    35.0,
)
hero_camera = preview_camera(
    "HF01_Preview_Hero",
    (0.0, -5.9, 1.86),
    (0.0, 0.2, 1.5),
    40.0,
)
scene.camera = hero_camera
scene.render.resolution_x = 1280
scene.render.resolution_y = 720
scene.render.resolution_percentage = 100


# Add two restrained punctual lights that glTF can preserve; runtime fill remains deliberately simple.
def point_light(name: str, location: tuple[float, float, float], color: tuple[float, float, float], energy: float, radius: float) -> None:
    data = bpy.data.lights.new(name=name, type="POINT")
    data.color = color
    data.energy = energy
    data.shadow_soft_size = radius
    light = bpy.data.objects.new(name, data)
    light.parent = root
    light.location = location
    scene.collection.objects.link(light)


point_light("HF01_Warm_Prayer_Light", (0.0, -0.2, 2.5), (1.0, 0.52, 0.24), 220.0, 1.35)
point_light("HF01_Soft_Interior_Fill", (-2.2, -2.0, 2.45), (0.72, 0.46, 0.29), 92.0, 2.2)
point_light("HF01_Cool_Threshold_Fill", (0.0, 2.9, 2.25), (0.46, 0.5, 0.52), 220.0, 1.8)


# Author NLA tracks with shared names so glTF merges each multi-object movement into one clip.
def rotation_animation(
    obj: bpy.types.Object,
    clip_name: str,
    axis_index: int,
    keyframes: tuple[tuple[int, float], ...],
) -> None:
    """Keyframe one rotation channel and place it on a named NLA track."""

    obj.animation_data_create()
    action = bpy.data.actions.new(name=f"{clip_name}_{obj.name}")
    obj.animation_data.action = action
    for frame, angle in keyframes:
        obj.rotation_euler[axis_index] = angle
        obj.keyframe_insert(data_path="rotation_euler", index=axis_index, frame=frame)
    track = obj.animation_data.nla_tracks.new()
    track.name = clip_name
    strip = track.strips.new(clip_name, int(keyframes[0][0]), action)
    strip.action_frame_start = float(keyframes[0][0])
    strip.action_frame_end = float(keyframes[-1][0])
    obj.animation_data.action = None


door_clip = "Realm_Door_Close"
rotation_animation(
    door_pivot,
    door_clip,
    2,
    (
        (1, math.radians(74.0)),
        (14, math.radians(72.0)),
        (69, math.radians(2.8)),
        (84, math.radians(-1.4)),
        (96, 0.0),
    ),
)

bible_clip = "Realm_Bible_Settle_Open"
rotation_animation(
    top_cover_pivot,
    bible_clip,
    1,
    (
        (1, math.radians(-178.0)),
        (50, math.radians(-178.0)),
        (66, math.radians(-175.0)),
        (76, math.radians(-180.0)),
        (84, math.radians(-176.0)),
        (96, math.radians(-179.0)),
    ),
)
rotation_animation(
    page_pivot,
    bible_clip,
    1,
    (
        (1, math.radians(-178.0)),
        (50, math.radians(-178.0)),
        (68, math.radians(-176.0)),
        (80, math.radians(-180.0)),
        (88, math.radians(-176.0)),
        (96, math.radians(-179.0)),
    ),
)
rotation_animation(
    page_leaf_pivot,
    bible_clip,
    1,
    (
        (1, math.radians(-1.0)),
        (50, math.radians(-1.0)),
        (70, math.radians(-5.0)),
        (82, math.radians(0.0)),
        (91, math.radians(-3.0)),
        (96, math.radians(-1.0)),
    ),
)


# Return the source scene to its authored first frame before saving and exporting.
scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH), compress=True)


# Export a raw local GLB with named NLA clips; project-local glTF Transform performs final optimization.
bpy.ops.export_scene.gltf(
    filepath=str(RAW_GLTF_PATH),
    export_format="GLB",
    export_yup=True,
    export_animations=True,
    export_animation_mode="NLA_TRACKS",
    export_merge_animation="NLA_TRACK",
    export_force_sampling=True,
    export_frame_range=True,
    export_lights=True,
    export_cameras=False,
    export_extras=True,
    export_materials="EXPORT",
    export_image_format="AUTO",
    export_texcoords=True,
    export_normals=True,
    export_tangents=True,
    export_apply=True,
    export_optimize_animation_size=True,
)

print(f"HF01_BLEND={BLEND_PATH}")
print(f"HF01_RAW_GLTF={RAW_GLTF_PATH}")
