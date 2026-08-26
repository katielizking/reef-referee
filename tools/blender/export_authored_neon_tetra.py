"""Export the CC-BY authored neon tetra while preserving its rig and action."""

import argparse
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector


def args():
    values = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    parser.add_argument("--review-dir", required=True)
    return parser.parse_args(values)


def triangle_count(obj):
    dg = bpy.context.evaluated_depsgraph_get()
    evaluated = obj.evaluated_get(dg)
    mesh = evaluated.to_mesh()
    mesh.calc_loop_triangles()
    count = len(mesh.loop_triangles)
    evaluated.to_mesh_clear()
    return count


def authored_objects():
    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH" and len(o.data.polygons) > 0]
    armatures = [o for o in bpy.context.scene.objects if o.type == "ARMATURE"]
    if len(meshes) != 1 or not armatures:
        raise RuntimeError(f"Expected one authored fish mesh and an armature; got {len(meshes)} mesh(es), {len(armatures)} armature(s)")
    return meshes[0], armatures[0]


def world_bounds(objects):
    points = [obj.matrix_world @ Vector(corner) for obj in objects for corner in obj.bound_box]
    lo = Vector(tuple(min(p[i] for p in points) for i in range(3)))
    hi = Vector(tuple(max(p[i] for p in points) for i in range(3)))
    return lo, hi


def make_export_root(mesh, armature):
    # Preserve the internal rig hierarchy. Parent only top-level authored nodes
    # beneath a transform root so animation data and skin weights remain intact.
    keep = {mesh, armature}
    root = bpy.data.objects.new("FishTankr_NeonTetra_Root", None)
    bpy.context.collection.objects.link(root)
    for obj in keep:
        if obj.parent not in keep:
            matrix = obj.matrix_world.copy()
            obj.parent = root
            obj.matrix_world = matrix

    lo, hi = world_bounds([mesh])
    size = hi - lo
    # Source is authored nose-to-tail along Y. Rotate Y to +X and scale the
    # longest body axis to the documented 4 cm adult total length.
    root.rotation_euler.z = -math.pi / 2
    root.scale = (0.04 / max(size.x, size.y, size.z),) * 3
    root.location = -(lo + hi) * .5 * root.scale.x
    root["fishtankr_asset_id"] = "neon-tetra-aeroplankton"
    root["scientific_name"] = "Paracheirodon innesi"
    root["common_name"] = "Neon tetra"
    root["adult_total_length_m"] = 0.04
    root["creator"] = "aeroplankton"
    root["license"] = "CC-BY"
    root["source_url"] = "https://blendswap.com/blend/32414"
    root["modifications"] = "Oriented, scaled, control geometry excluded, glTF export prepared by FishTankr."
    bpy.context.view_layer.update()
    return root


def tune_material(mesh):
    for material in mesh.data.materials:
        if not material:
            continue
        material.use_nodes = True
        material.diffuse_color[3] = 1.0
        bsdf = material.node_tree.nodes.get("Principled BSDF")
        if bsdf:
            bsdf.inputs["Roughness"].default_value = min(bsdf.inputs["Roughness"].default_value, .42)
            if "Coat Weight" in bsdf.inputs:
                bsdf.inputs["Coat Weight"].default_value = .18
                bsdf.inputs["Coat Roughness"].default_value = .24


def select_export(root, mesh, armature):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in (root, mesh, armature):
        obj.hide_viewport = False
        obj.hide_render = False
        obj.select_set(True)
    bpy.context.view_layer.objects.active = armature


def export_glb(path, root, mesh, armature):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    select_export(root, mesh, armature)
    requested = {
        "filepath": str(Path(path).resolve()),
        "export_format": "GLB",
        "use_selection": True,
        "export_apply": False,
        "export_animations": True,
        "export_skins": True,
        "export_morph": True,
        "export_materials": "EXPORT",
        "export_image_format": "AUTO",
        "export_yup": True,
        "export_force_sampling": True,
        "export_all_actions": True,
        "export_nla_strips": True,
    }
    supported = {p.identifier for p in bpy.ops.export_scene.gltf.get_rna_type().properties}
    bpy.ops.export_scene.gltf(**{k: v for k, v in requested.items() if k in supported})


def studio(root, mesh, armature, review_dir):
    review_dir = Path(review_dir).resolve()
    review_dir.mkdir(parents=True, exist_ok=True)
    # Blender-only controllers remain in the source but never enter renders.
    for obj in bpy.context.scene.objects:
        if obj not in {root, mesh, armature}:
            obj.hide_render = True
    armature.hide_render = True

    world = bpy.context.scene.world or bpy.data.worlds.new("FishTankr Review World")
    bpy.context.scene.world = world
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (.006, .015, .021, 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = .22

    for name, location, energy, size, colour in [
        ("Key", (.02, -.09, .055), 700, .08, (.72, .88, 1)),
        ("Rim", (-.05, .06, .045), 850, .065, (.08, .45, 1)),
        ("Warm Fill", (.06, -.03, -.01), 420, .06, (1, .28, .13)),
    ]:
        data = bpy.data.lights.new(f"FishTankr_{name}", "AREA")
        data.energy, data.shape, data.size, data.color = energy, "DISK", size, colour
        obj = bpy.data.objects.new(f"FishTankr_{name}", data)
        bpy.context.collection.objects.link(obj)
        obj.location = location
        obj.rotation_euler = (Vector((0, 0, 0)) - obj.location).to_track_quat("-Z", "Y").to_euler()

    camera_data = bpy.data.cameras.new("FishTankr Review Camera")
    camera = bpy.data.objects.new("FishTankr Review Camera", camera_data)
    bpy.context.collection.objects.link(camera)
    camera_data.lens = 62
    bpy.context.scene.camera = camera

    scene = bpy.context.scene
    try:
        scene.render.engine = "BLENDER_EEVEE_NEXT"
    except TypeError:
        scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x, scene.render.resolution_y = 1400, 900
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False

    views = {
        "side": (Vector((0, -.115, .012)), 70),
        "three-quarter": (Vector((.075, -.095, .035)), 62),
        "top": (Vector((0, -.012, .13)), 65),
    }
    for name, (location, lens) in views.items():
        camera.location = location
        camera.rotation_euler = (Vector((0, 0, 0)) - camera.location).to_track_quat("-Z", "Y").to_euler()
        camera_data.lens = lens
        scene.render.filepath = str(review_dir / f"{name}.png")
        bpy.ops.render.render(write_still=True)


def main():
    options = args()
    mesh, armature = authored_objects()
    before = triangle_count(mesh)
    root = make_export_root(mesh, armature)
    tune_material(mesh)
    studio(root, mesh, armature, options.review_dir)
    export_glb(options.output, root, mesh, armature)
    result = {
        "asset_id": "neon-tetra-aeroplankton",
        "triangles": before,
        "bones": len(armature.data.bones),
        "actions": [a.name for a in bpy.data.actions],
        "output": str(Path(options.output).resolve()),
        "creator": "aeroplankton",
        "license": "CC-BY",
    }
    Path(options.review_dir, "export-report.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
    print("FISHTANKR_AUTHORED_EXPORT=" + json.dumps(result, sort_keys=True))


if __name__ == "__main__":
    main()
