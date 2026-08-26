"""Export the reviewed BlueMesh Betta splendens while preserving its authored skin and animation."""
import json
import math
import os
import sys
from pathlib import Path

import bpy
from mathutils import Vector


def args_after_separator():
    return sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []


args = args_after_separator()
if len(args) != 2:
    raise SystemExit("usage: blender --background --python export_authored_betta.py -- SOURCE.gltf OUTPUT.glb")

source, output = args
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=os.path.abspath(source), import_pack_images=False)

meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
armatures = [obj for obj in bpy.context.scene.objects if obj.type == "ARMATURE"]
skinned = [
    obj for obj in meshes
    if (obj.parent and obj.parent.type == "ARMATURE")
    or any(modifier.type == "ARMATURE" for modifier in obj.modifiers)
]
if not skinned or not armatures:
    raise RuntimeError("Expected skinned Betta meshes and an armature")

# Remove the source package's non-fish staging geometry.
for obj in list(meshes):
    if obj not in skinned:
        bpy.data.objects.remove(obj, do_unlink=True)

points = [obj.matrix_world @ Vector(corner) for obj in skinned for corner in obj.bound_box]
minimum = Vector(tuple(min(point[index] for point in points) for index in range(3)))
maximum = Vector(tuple(max(point[index] for point in points) for index in range(3)))
centre = (minimum + maximum) * 0.5
source_length = maximum.y - minimum.y
target_length_metres = 0.06
scale = target_length_metres / source_length

root = bpy.data.objects.new("BettaRoot", None)
root.location = centre
bpy.context.scene.collection.objects.link(root)

top_level = [obj for obj in bpy.context.scene.objects if obj != root and obj.parent is None]
for obj in top_level:
    world = obj.matrix_world.copy()
    obj.parent = root
    obj.matrix_world = world

# Source points nose-first along -Y. FishTankr's motion frame expects +X.
root.location = (0, 0, 0)
root.rotation_euler = (0, 0, math.radians(90))
root.scale = (scale, scale, scale)

for material in bpy.data.materials:
    material.use_nodes = True
    material.diffuse_color[3] = 1.0

Path(output).parent.mkdir(parents=True, exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath=os.path.abspath(output),
    export_format="GLB",
    use_selection=False,
    export_animations=True,
    export_all_actions=True,
    export_skins=True,
    export_morph=True,
    export_materials="EXPORT",
    export_image_format="AUTO",
    export_yup=True,
)

report = {
    "output": output,
    "bytes": os.path.getsize(output),
    "skinned_meshes": [obj.name for obj in skinned],
    "armatures": [{"name": obj.name, "bones": len(obj.data.bones)} for obj in armatures],
    "actions": [action.name for action in bpy.data.actions],
    "reference_length_cm": 6,
    "forward_axis": "+x",
}
Path(output).with_suffix(".json").write_text(json.dumps(report, indent=2), encoding="utf-8")
print(json.dumps(report, indent=2))
