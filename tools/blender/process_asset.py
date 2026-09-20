"""FishTankr Blender asset processor.

Run with Blender:
  blender -b --python tools/blender/process_asset.py -- \
    --input assets/3d/source/betta.glb \
    --metadata assets/3d/source/betta.asset.json \
    --output public/models/fish/betta/betta.medium.glb \
    --kind fish --target-triangles 45000

The source mesh must already be an accurate likeness of the named taxon.
This script deliberately optimises and validates; it does not invent anatomy.
"""

import argparse
import json
import math
import os
import sys
from pathlib import Path

import bpy
from mathutils import Vector

ALLOWED_LICENSES = {"CC0-1.0", "CC-BY-4.0", "CC-BY-SA-4.0", "ORIGINAL"}
SUPPORTED_INPUTS = {".glb", ".gltf", ".fbx", ".obj"}


def arguments():
    values = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--metadata", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--kind", choices=("fish", "plant"), required=True)
    parser.add_argument("--target-triangles", type=int, default=45000)
    return parser.parse_args(values)


def load_metadata(path):
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    required = ("asset_id", "common_name", "scientific_name", "source_url", "creator", "license")
    missing = [key for key in required if not data.get(key)]
    if missing:
        raise ValueError("Missing asset metadata: " + ", ".join(missing))
    if data["license"] not in ALLOWED_LICENSES:
        raise ValueError(
            f"Unsupported licence {data['license']!r}; allowed: {sorted(ALLOWED_LICENSES)}"
        )
    length = data.get("adult_length_cm")
    if length is not None and (not isinstance(length, (int, float)) or length <= 0):
        raise ValueError("adult_length_cm must be a positive number")
    return data


def reset_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for collection in (bpy.data.meshes, bpy.data.curves, bpy.data.armatures):
        for block in list(collection):
            if block.users == 0:
                collection.remove(block)


def import_asset(path):
    suffix = Path(path).suffix.lower()
    if suffix not in SUPPORTED_INPUTS:
        raise ValueError(f"Unsupported input format: {suffix}")
    if suffix in {".glb", ".gltf"}:
        bpy.ops.import_scene.gltf(filepath=path)
    elif suffix == ".fbx":
        bpy.ops.import_scene.fbx(filepath=path)
    else:
        bpy.ops.wm.obj_import(filepath=path)


def mesh_objects():
    return [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]


def join_meshes(objects):
    if not objects:
        raise ValueError("The source file contains no mesh")
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]
    bpy.ops.object.join()
    body = bpy.context.active_object
    body.name = "Body"
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    return body


def triangle_count(obj):
    depsgraph = bpy.context.evaluated_depsgraph_get()
    evaluated = obj.evaluated_get(depsgraph)
    mesh = evaluated.to_mesh()
    mesh.calc_loop_triangles()
    count = len(mesh.loop_triangles)
    evaluated.to_mesh_clear()
    return count


def optimise_mesh(body, target):
    before = triangle_count(body)
    if before > target:
        modifier = body.modifiers.new(name="FishTankr_Web_Decimate", type="DECIMATE")
        modifier.decimate_type = "COLLAPSE"
        modifier.ratio = max(0.05, target / before)
        modifier.use_collapse_triangulate = True
        bpy.context.view_layer.objects.active = body
        bpy.ops.object.modifier_apply(modifier=modifier.name)
    bpy.context.view_layer.objects.active = body
    bpy.ops.object.shade_smooth()
    return before, triangle_count(body)


def normalise(body, metadata, kind):
    corners = [body.matrix_world @ Vector(corner) for corner in body.bound_box]
    minimum = Vector((min(v.x for v in corners), min(v.y for v in corners), min(v.z for v in corners)))
    maximum = Vector((max(v.x for v in corners), max(v.y for v in corners), max(v.z for v in corners)))
    size = maximum - minimum
    centre = (minimum + maximum) * 0.5

    body.location -= centre
    bpy.context.view_layer.update()

    if kind == "fish" and metadata.get("adult_length_cm"):
        if size.x <= 0:
            raise ValueError("Fish must be authored nose-to-tail along the +X axis")
        target_metres = float(metadata["adult_length_cm"]) / 100
        scale = target_metres / size.x
        body.scale = (scale, scale, scale)
        bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    elif kind == "plant":
        body.location.z -= min(v.z for v in [body.matrix_world @ Vector(c) for c in body.bound_box])

    body["fishtankr_scientific_name"] = metadata["scientific_name"]
    body["fishtankr_common_name"] = metadata["common_name"]
    body["fishtankr_source_url"] = metadata["source_url"]
    body["fishtankr_creator"] = metadata["creator"]
    body["fishtankr_license"] = metadata["license"]


def tune_materials():
    for material in bpy.data.materials:
        material.use_nodes = True
        material.blend_method = "HASHED"
        material.use_screen_refraction = False
        material.diffuse_color[3] = 1.0


def export_glb(path):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        use_selection=False,
        export_apply=True,
        export_animations=True,
        export_all_actions=True,
        export_skins=True,
        export_morph=True,
        export_materials="EXPORT",
        export_image_format="AUTO",
        export_yup=True,
    )


def main():
    args = arguments()
    source = str(Path(args.input).resolve())
    metadata_path = str(Path(args.metadata).resolve())
    output = str(Path(args.output).resolve())

    metadata = load_metadata(metadata_path)
    reset_scene()
    import_asset(source)
    body = join_meshes(mesh_objects())
    normalise(body, metadata, args.kind)
    tune_materials()
    before, after = optimise_mesh(body, args.target_triangles)
    export_glb(output)

    result = {
        "asset_id": metadata["asset_id"],
        "scientific_name": metadata["scientific_name"],
        "kind": args.kind,
        "source_triangles": before,
        "output_triangles": after,
        "output_bytes": os.path.getsize(output),
        "output": output,
    }
    print("FISHTANKR_ASSET_RESULT=" + json.dumps(result, sort_keys=True))


if __name__ == "__main__":
    main()
