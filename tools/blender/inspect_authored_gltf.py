import bpy
import json
import math
import os
import sys
from mathutils import Vector


def args_after_separator():
    return sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []


args = args_after_separator()
if len(args) != 2:
    raise SystemExit("usage: blender --background --python inspect_authored_gltf.py -- SOURCE.gltf OUTPUT_DIR")

source, output_dir = args
os.makedirs(output_dir, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=os.path.abspath(source), import_pack_images=False)

meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
armatures = [obj for obj in bpy.context.scene.objects if obj.type == "ARMATURE"]
if not meshes:
    raise RuntimeError("No mesh objects imported")

def world_corners(obj):
    return [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]

visible_meshes = [obj for obj in meshes if obj.parent and obj.parent.type == "ARMATURE"]
if not visible_meshes:
    visible_meshes = meshes

for obj in meshes:
    obj.hide_render = obj not in visible_meshes

points = [point for obj in visible_meshes for point in world_corners(obj)]
minimum = Vector(tuple(min(p[i] for p in points) for i in range(3)))
maximum = Vector(tuple(max(p[i] for p in points) for i in range(3)))
center = (minimum + maximum) * 0.5
size = maximum - minimum
longest = max(size)

report = {
    "source": source,
    "meshes": [{
        "name": obj.name,
        "vertices": len(obj.data.vertices),
        "triangles": sum(max(0, len(poly.vertices) - 2) for poly in obj.data.polygons),
        "materials": [slot.material.name if slot.material else None for slot in obj.material_slots],
        "skinned": bool(obj.parent and obj.parent.type == "ARMATURE") or any(m.type == "ARMATURE" for m in obj.modifiers),
    } for obj in meshes],
    "armatures": [{"name": obj.name, "bones": len(obj.data.bones)} for obj in armatures],
    "actions": [{
        "name": action.name,
        "frame_start": action.frame_range[0],
        "frame_end": action.frame_range[1],
        "fcurves": len(action.fcurves),
    } for action in bpy.data.actions],
    "images": [{"name": image.name, "size": list(image.size), "filepath": image.filepath} for image in bpy.data.images],
    "bounds": {"minimum": list(minimum), "maximum": list(maximum), "size": list(size)},
}

with open(os.path.join(output_dir, "inspection.json"), "w", encoding="utf-8") as handle:
    json.dump(report, handle, indent=2)

scene = bpy.context.scene
scene.render.engine = "BLENDER_EEVEE"
scene.render.resolution_x = 900
scene.render.resolution_y = 700
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.film_transparent = False
if scene.world is None:
    scene.world = bpy.data.worlds.new("ReviewWorld")
scene.world.color = (0.012, 0.018, 0.03)

def look_at(obj, target):
    obj.rotation_euler = (target - obj.location).to_track_quat("-Z", "Y").to_euler()

camera_data = bpy.data.cameras.new("ReviewCamera")
camera = bpy.data.objects.new("ReviewCamera", camera_data)
scene.collection.objects.link(camera)
scene.camera = camera
camera.data.lens = 58

key = bpy.data.lights.new("Key", "AREA")
key.energy = 900
key.size = max(longest * 0.9, 0.5)
key_obj = bpy.data.objects.new("Key", key)
scene.collection.objects.link(key_obj)
key_obj.location = center + Vector((longest, -longest, longest))
look_at(key_obj, center)

fill = bpy.data.lights.new("Fill", "AREA")
fill.energy = 500
fill.size = max(longest, 0.5)
fill_obj = bpy.data.objects.new("Fill", fill)
scene.collection.objects.link(fill_obj)
fill_obj.location = center + Vector((-longest, -longest * 0.4, longest * 0.3))
look_at(fill_obj, center)

views = {
    "side": Vector((0, -max(longest * 2.4, 1.5), longest * 0.15)),
    "three-quarter": Vector((longest * 1.6, -longest * 1.8, longest * 0.35)),
    "top": Vector((0, -longest * 0.15, max(longest * 2.5, 1.5))),
}
for name, offset in views.items():
    camera.location = center + offset
    look_at(camera, center)
    scene.render.filepath = os.path.join(output_dir, f"{name}.png")
    bpy.ops.render.render(write_still=True)

print(json.dumps(report, indent=2))
