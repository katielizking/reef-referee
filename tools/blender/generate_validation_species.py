"""Generate FishTankr's five reference-informed Blender validation models.

Run inside Blender:
  blender -b --python tools/blender/generate_validation_species.py -- \
    --species neon-tetra --output /tmp/neon-tetra.validation.glb

These models are procedural validation assets, not scans. Their profile data
is intentionally explicit and traceable so a reviewer can correct anatomy
without rewriting the generator.
"""

import argparse
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector


PROFILES = {
    "neon-tetra": {
        "kind": "fish",
        "scientific_name": "Paracheirodon innesi",
        "length_cm": 4.0,
        "body": (1.00, 0.27, 0.16),
        "head": (0.24, 0.23, 0.15),
        "tail": "forked",
        "base": (0.60, 0.66, 0.66, 1),
        "stripe": (0.02, 0.72, 1.0, 1),
        "posterior": (0.95, 0.08, 0.10, 1),
        "fin": (0.78, 0.88, 0.87, 0.42),
        "sources": [
            "https://fishbase.se/summary/Paracheirodon-innesi",
            "https://www.fishi-pedia.com/fishes/paracheirodon-innesi",
        ],
    },
    "betta": {
        "kind": "fish",
        "scientific_name": "Betta splendens",
        "length_cm": 6.0,
        "body": (1.00, 0.34, 0.22),
        "head": (0.29, 0.29, 0.21),
        "tail": "flowing",
        "base": (0.08, 0.19, 0.48, 1),
        "stripe": (0.10, 0.52, 0.86, 1),
        "posterior": (0.50, 0.06, 0.45, 1),
        "fin": (0.12, 0.28, 0.75, 0.72),
        "sources": [
            "https://fishbase.se/summary/betta-splendens.html",
            "https://fishbase.se/physiology/MorphDataList.php?GenusName=Betta&ID=4768&SpeciesName=splendens",
        ],
    },
    "bronze-corydoras": {
        "kind": "fish",
        "scientific_name": "Osteogaster aenea",
        "length_cm": 7.0,
        "body": (1.00, 0.42, 0.32),
        "head": (0.36, 0.37, 0.34),
        "tail": "forked",
        "base": (0.43, 0.38, 0.24, 1),
        "stripe": (0.20, 0.27, 0.22, 1),
        "posterior": (0.52, 0.39, 0.20, 1),
        "fin": (0.50, 0.43, 0.30, 0.58),
        "barbels": True,
        "armour": True,
        "bottom": True,
        "sources": [
            "https://fishbase.se/summary/Corydoras-aeneus",
            "https://fishesoftexas.org/taxa/corydoras-aeneus/",
        ],
    },
    "java-fern": {
        "kind": "plant",
        "scientific_name": "Microsorum pteropus",
        "height_cm": 28,
        "habit": "rhizome",
        "leaf_count": 11,
        "leaf_length": 0.82,
        "leaf_width": 0.16,
        "green": (0.08, 0.30, 0.12, 1),
        "sources": [
            "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:17341240-1",
        ],
    },
    "amazon-sword": {
        "kind": "plant",
        "scientific_name": "Aquarius grisebachii",
        "height_cm": 50,
        "habit": "rosette",
        "leaf_count": 17,
        "leaf_length": 1.00,
        "leaf_width": 0.23,
        "green": (0.12, 0.42, 0.16, 1),
        "sources": [
            "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:77183004-1",
            "https://idtools.org/appw/index.cfm?entityID=10305&packageID=2197",
        ],
    },
}


def args():
    values = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--species", choices=sorted(PROFILES), required=True)
    parser.add_argument("--output", required=True)
    return parser.parse_args(values)


def reset():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)


def material(name, colour, metallic=0.0, roughness=0.4, transmission=0.0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = colour
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = colour
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Metallic"].default_value = metallic
    if "Transmission Weight" in shader.inputs:
        shader.inputs["Transmission Weight"].default_value = transmission
    elif "Transmission" in shader.inputs:
        shader.inputs["Transmission"].default_value = transmission
    shader.inputs["Alpha"].default_value = colour[3]
    if colour[3] < 1:
        mat.blend_method = "BLEND"
        mat.use_nodes = True
        mat.show_transparent_back = True
    return mat


def uv_ellipsoid(name, location, scale, mat, segments=32, rings=20):
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=segments, ring_count=rings, location=location
    )
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
    return obj


def fin_mesh(name, vertices, mat, location=(0, 0, 0)):
    mesh = bpy.data.meshes.new(name + "Mesh")
    mesh.from_pydata(vertices, [], [list(range(len(vertices)))])
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    obj.data.materials.append(mat)
    solid = obj.modifiers.new("MembraneThickness", "SOLIDIFY")
    solid.thickness = 0.003
    return obj


def curve_tube(name, points, radius, mat):
    curve = bpy.data.curves.new(name + "Curve", "CURVE")
    curve.dimensions = "3D"
    curve.resolution_u = 3
    curve.bevel_depth = radius
    curve.bevel_resolution = 3
    spline = curve.splines.new("BEZIER")
    spline.bezier_points.add(len(points) - 1)
    for point, coordinate in zip(spline.bezier_points, points):
        point.co = coordinate
        point.handle_left_type = "AUTO"
        point.handle_right_type = "AUTO"
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    return obj


def add_eye(x, y, z, side, scale):
    white = material("EyeIris", (0.72, 0.62, 0.36, 1), roughness=0.18)
    black = material("EyePupil", (0.004, 0.006, 0.006, 1), roughness=0.12)
    uv_ellipsoid(
        "Eye",
        (x, y, side * z),
        (scale, scale, scale * 0.45),
        white,
        20,
        12,
    )
    uv_ellipsoid(
        "Pupil",
        (x + scale * 0.08, y, side * (z + scale * 0.38)),
        (scale * 0.55, scale * 0.55, scale * 0.22),
        black,
        16,
        10,
    )


def animate_tail(tail):
    tail.rotation_mode = "XYZ"
    for name, amplitude, frames in (
        ("Idle", 0.04, 48),
        ("Cruise", 0.16, 32),
        ("FastSwim", 0.27, 20),
        ("Dart", 0.34, 12),
    ):
        action = bpy.data.actions.new(name)
        curve = action.fcurves.new(data_path="rotation_euler", index=1)
        for frame, angle in (
            (1, 0),
            (1 + frames * 0.25, amplitude),
            (1 + frames * 0.50, 0),
            (1 + frames * 0.75, -amplitude),
            (1 + frames, 0),
        ):
            curve.keyframe_points.insert(frame, angle)
        for modifier_curve in action.fcurves:
            modifier_curve.modifiers.new("CYCLES")
        track = tail.animation_data_create().nla_tracks.new()
        track.name = name
        track.strips.new(name, 1, action)


def add_armour(body_length, body_height, body_depth, mat):
    plate_count = 9
    for side in (-1, 1):
        for index in range(plate_count):
            x = -body_length * 0.36 + index * body_length * 0.085
            y = -0.01 + math.sin(index * 0.55) * body_height * 0.08
            plate = uv_ellipsoid(
                "Scute",
                (x, y, side * body_depth * 1.015),
                (body_length * 0.052, body_height * 0.18, 0.004),
                mat,
                12,
                8,
            )
            plate.rotation_euler.y = side * 0.03


def build_fish(profile):
    length = profile["length_cm"] / 100
    body_len, body_height, body_depth = (
        length * profile["body"][0] * 0.58,
        length * profile["body"][1],
        length * profile["body"][2],
    )
    base = material("Body", profile["base"], metallic=0.08, roughness=0.28)
    accent = material("Marking", profile["stripe"], metallic=0.18, roughness=0.2)
    posterior = material("PosteriorMarking", profile["posterior"], roughness=0.3)
    fin = material("Fin", profile["fin"], roughness=0.24, transmission=0.18)

    body_y = -body_height * 0.12 if profile.get("bottom") else 0
    uv_ellipsoid("Body", (0, body_y, 0), (body_len, body_height, body_depth), base)
    head_x = body_len * 0.74
    head_scale = profile["head"]
    uv_ellipsoid(
        "Head",
        (head_x, body_y - body_height * 0.03, 0),
        (
            length * head_scale[0],
            length * head_scale[1],
            length * head_scale[2],
        ),
        base,
    )

    tail_root = -body_len * 0.92
    tail_length = length * (0.30 if profile["tail"] == "flowing" else 0.22)
    tail_height = body_height * (1.7 if profile["tail"] == "flowing" else 1.0)
    if profile["tail"] == "forked":
        tail_vertices = [
            (0, tail_height * 0.28, 0),
            (-tail_length, tail_height, 0),
            (-tail_length * 0.67, 0, 0),
            (-tail_length, -tail_height, 0),
            (0, -tail_height * 0.28, 0),
        ]
    else:
        tail_vertices = [
            (0, tail_height * 0.25, 0),
            (-tail_length * 0.72, tail_height, 0),
            (-tail_length, tail_height * 0.45, 0),
            (-tail_length * 0.92, -tail_height * 0.8, 0),
            (0, -tail_height * 0.25, 0),
        ]
    tail = fin_mesh("Fin_Caudal", tail_vertices, fin, (tail_root, body_y, 0))
    animate_tail(tail)

    dorsal_len = body_len * (0.75 if profile["tail"] == "flowing" else 0.50)
    dorsal_height = body_height * (1.18 if profile["tail"] == "flowing" else 0.68)
    fin_mesh(
        "Fin_Dorsal",
        [
            (-dorsal_len * 0.5, 0, 0),
            (-dorsal_len * 0.15, dorsal_height, 0),
            (dorsal_len * 0.5, 0, 0),
        ],
        fin,
        (-body_len * 0.08, body_y + body_height * 0.9, 0),
    )
    anal_scale = 1.35 if profile["tail"] == "flowing" else 0.55
    fin_mesh(
        "Fin_Anal",
        [
            (-dorsal_len * 0.56, 0, 0),
            (-dorsal_len * 0.34, -dorsal_height * anal_scale, 0),
            (dorsal_len * 0.56, 0, 0),
        ],
        fin,
        (-body_len * 0.02, body_y - body_height * 0.86, 0),
    )

    for side in (-1, 1):
        fin_mesh(
            "Fin_Pectoral",
            [
                (0, 0, 0),
                (-length * 0.08, -length * 0.11, side * length * 0.06),
                (length * 0.04, -length * 0.06, side * length * 0.025),
            ],
            fin,
            (head_x * 0.72, body_y - body_height * 0.04, side * body_depth * 0.82),
        )
        add_eye(
            head_x + length * 0.04,
            body_y + body_height * 0.28,
            body_depth * 0.92,
            side,
            length * 0.035,
        )

    if profile["scientific_name"] == "Paracheirodon innesi":
        for side in (-1, 1):
            fin_mesh(
                "BlueLateralStripe",
                [
                    (-body_len * 0.75, body_height * 0.15, 0),
                    (body_len * 0.92, body_height * 0.23, 0),
                    (body_len * 0.88, body_height * 0.03, 0),
                    (-body_len * 0.72, -body_height * 0.02, 0),
                ],
                accent,
                (0, body_y, side * body_depth * 1.015),
            )
            fin_mesh(
                "RedPosteriorStripe",
                [
                    (-body_len * 0.82, body_height * 0.02, 0),
                    (0.02, 0, 0),
                    (0.02, -body_height * 0.30, 0),
                    (-body_len * 0.82, -body_height * 0.22, 0),
                ],
                posterior,
                (0, body_y, side * body_depth * 1.02),
            )

    if profile.get("armour"):
        add_armour(body_len, body_height, body_depth, accent)
    if profile.get("barbels"):
        for side in (-1, 1):
            curve_tube(
                "Barbel",
                [
                    (head_x + length * 0.20, body_y - body_height * 0.25, side * body_depth * 0.34),
                    (head_x + length * 0.29, body_y - body_height * 0.38, side * body_depth * 0.52),
                    (head_x + length * 0.38, body_y - body_height * 0.43, side * body_depth * 0.72),
                ],
                length * 0.006,
                accent,
            )


def leaf_mesh(name, length, width, mat):
    segments = 12
    vertices = []
    for index in range(segments + 1):
        t = index / segments
        z = t * length
        half = math.sin(math.pi * t) ** 0.72 * width * 0.5
        wave = math.sin(t * math.pi * 3) * width * 0.035
        vertices.append((-half + wave, 0, z))
        vertices.append((half + wave, 0, z))
    faces = []
    for index in range(segments):
        a = index * 2
        faces.append((a, a + 1, a + 3, a + 2))
    mesh = bpy.data.meshes.new(name + "Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    solid = obj.modifiers.new("LeafThickness", "SOLIDIFY")
    solid.thickness = max(0.001, length * 0.008)
    bevel = obj.modifiers.new("LeafSoftEdge", "BEVEL")
    bevel.width = max(0.0005, length * 0.004)
    bevel.segments = 2
    return obj


def animate_plant(leaf, phase):
    leaf.rotation_mode = "XYZ"
    action = bpy.data.actions.new("WaterSway")
    xcurve = action.fcurves.new(data_path="rotation_euler", index=0)
    ycurve = action.fcurves.new(data_path="rotation_euler", index=1)
    for frame, value in ((1, -0.025), (36, 0.035), (72, -0.025)):
        xcurve.keyframe_points.insert(frame, value)
        ycurve.keyframe_points.insert(frame, math.sin(phase) * value * 0.6)
    xcurve.modifiers.new("CYCLES")
    ycurve.modifiers.new("CYCLES")
    track = leaf.animation_data_create().nla_tracks.new()
    track.name = "WaterSway"
    track.strips.new("WaterSway", 1, action)


def build_plant(profile):
    height = profile["height_cm"] / 100
    green = material("Leaf", profile["green"], roughness=0.56)
    vein = material("Midrib", tuple(min(1, c * 1.16) for c in profile["green"][:3]) + (1,), roughness=0.62)
    root = material("Rhizome", (0.20, 0.15, 0.07, 1), roughness=0.8)

    if profile["habit"] == "rhizome":
        curve_tube(
            "Rhizome",
            [(-height * 0.30, 0, 0.02), (0, 0.01, 0.03), (height * 0.30, -0.01, 0.025)],
            height * 0.025,
            root,
        )

    count = profile["leaf_count"]
    for index in range(count):
        phase = (index / count) * math.tau
        variance = 0.78 + ((index * 37) % 23) / 100
        length = height * profile["leaf_length"] * variance
        width = height * profile["leaf_width"] * (0.82 + ((index * 19) % 21) / 100)
        leaf = leaf_mesh("Leaf", length, width, green)
        radius = height * (0.13 if profile["habit"] == "rhizome" else 0.045)
        leaf.location = (math.cos(phase) * radius, math.sin(phase) * radius, 0)
        leaf.rotation_euler = (
            math.radians(5 + (index % 4) * 4),
            math.radians(-12 + (index % 5) * 6),
            phase,
        )
        animate_plant(leaf, phase)
        curve_tube(
            "Midrib",
            [
                tuple(leaf.location),
                (
                    leaf.location.x + math.cos(phase) * width * 0.08,
                    leaf.location.y + math.sin(phase) * width * 0.08,
                    length * 0.52,
                ),
                (
                    leaf.location.x + math.cos(phase) * width * 0.04,
                    leaf.location.y + math.sin(phase) * width * 0.04,
                    length * 0.96,
                ),
            ],
            height * 0.004,
            vein,
        )


def stamp_metadata(profile, slug):
    scene = bpy.context.scene
    scene["fishtankr_validation_asset"] = True
    scene["fishtankr_profile"] = slug
    scene["scientific_name"] = profile["scientific_name"]
    scene["reference_sources"] = " | ".join(profile["sources"])
    scene["accuracy_note"] = "Reference-informed procedural validation model; requires visual review."


def export(path):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(Path(path).resolve()),
        export_format="GLB",
        export_apply=True,
        export_animations=True,
        export_all_actions=True,
        export_nla_strips=True,
        export_materials="EXPORT",
        export_yup=True,
    )


def main():
    options = args()
    profile = PROFILES[options.species]
    reset()
    if profile["kind"] == "fish":
        build_fish(profile)
    else:
        build_plant(profile)
    stamp_metadata(profile, options.species)
    export(options.output)
    print(f"Generated validation model: {options.species} -> {options.output}")


if __name__ == "__main__":
    main()
