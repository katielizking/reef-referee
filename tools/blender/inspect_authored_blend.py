"""Inspect and studio-render an authored Blender source without modifying it."""

import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector


def bounds(objects):
    points = [o.matrix_world @ Vector(c) for o in objects for c in o.bound_box]
    lo = Vector((min(p.x for p in points), min(p.y for p in points), min(p.z for p in points)))
    hi = Vector((max(p.x for p in points), max(p.y for p in points), max(p.z for p in points)))
    return lo, hi


def triangles(obj):
    dg = bpy.context.evaluated_depsgraph_get()
    evaluated = obj.evaluated_get(dg)
    mesh = evaluated.to_mesh()
    mesh.calc_loop_triangles()
    count = len(mesh.loop_triangles)
    evaluated.to_mesh_clear()
    return count


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    output_dir = Path(argv[0] if argv else "generated/authored-neon-review").resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    arms = [o for o in bpy.context.scene.objects if o.type == "ARMATURE"]
    if not meshes:
        raise RuntimeError("Authored source contains no mesh objects")

    lo, hi = bounds(meshes)
    size, centre = hi - lo, (lo + hi) * .5
    report = {
        "blender_version": bpy.app.version_string,
        "objects": len(bpy.context.scene.objects),
        "meshes": [{"name": o.name, "triangles": triangles(o), "materials": [m.name for m in o.data.materials if m]} for o in meshes],
        "armatures": [{"name": o.name, "bones": len(o.data.bones)} for o in arms],
        "actions": [{"name": a.name, "frame_range": list(a.frame_range), "fcurves": len(a.fcurves)} for a in bpy.data.actions],
        "materials": [m.name for m in bpy.data.materials],
        "images": [{"name": i.name, "size": list(i.size), "packed": i.packed_file is not None} for i in bpy.data.images],
        "bounds": {"minimum": list(lo), "maximum": list(hi), "size": list(size)},
        "total_triangles": sum(triangles(o) for o in meshes),
    }
    (output_dir / "inspection.json").write_text(json.dumps(report, indent=2), encoding="utf-8")

    # Hide non-rendering rig controls and build a neutral review studio.
    for obj in bpy.context.scene.objects:
        if obj.type in {"EMPTY", "ARMATURE"}:
            obj.hide_render = True

    world = bpy.context.scene.world or bpy.data.worlds.new("FishTankr Review World")
    bpy.context.scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (.008, .015, .02, 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = .25

    for name, location, energy, size_l, colour in [
        ("Review Key", (centre.x, centre.y - max(size.length, 1) * 1.7, centre.z + size.z), 900, max(size.length, 1), (.72, .88, 1)),
        ("Review Rim", (centre.x - size.x, centre.y + max(size.length, 1), centre.z + size.z), 1100, max(size.length, 1), (.1, .45, 1)),
        ("Review Fill", (centre.x + size.x, centre.y - size.y, centre.z), 500, max(size.length, 1), (1, .34, .18)),
    ]:
        data = bpy.data.lights.new(name, "AREA")
        data.energy, data.shape, data.size, data.color = energy, "DISK", size_l, colour
        light = bpy.data.objects.new(name, data)
        bpy.context.collection.objects.link(light)
        light.location = location
        light.rotation_euler = (centre - light.location).to_track_quat("-Z", "Y").to_euler()

    camera_data = bpy.data.cameras.new("FishTankr Review Camera")
    camera = bpy.data.objects.new("FishTankr Review Camera", camera_data)
    bpy.context.collection.objects.link(camera)
    longest = max(size.x, size.y, size.z, .1)
    # The source is expected to be authored in a conventional horizontal fish orientation.
    camera.location = centre + Vector((longest * 1.15, -longest * 2.7, longest * .65))
    camera.rotation_euler = (centre - camera.location).to_track_quat("-Z", "Y").to_euler()
    camera_data.lens = 62
    bpy.context.scene.camera = camera

    scene = bpy.context.scene
    try:
        scene.render.engine = "BLENDER_EEVEE_NEXT"
    except TypeError:
        scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x, scene.render.resolution_y, scene.render.resolution_percentage = 1400, 900, 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = str(output_dir / "studio-preview.png")
    bpy.ops.render.render(write_still=True)


if __name__ == "__main__":
    main()
