"""Create FishTankr's art-directed neon tetra benchmark in Blender 4.x.

The mesh is lofted from anatomical cross-sections instead of scaled spheres.
It is still a review model: final approval requires comparison with specimens.
"""

import argparse
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector


BLUE = (0.015, 0.34, 0.72, 1)
RED = (0.78, 0.025, 0.018, 1)
SILVER = (0.34, 0.39, 0.40, 1)


def cli():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="generated/neon-tetra-hero.glb")
    parser.add_argument("--preview", default="generated/neon-tetra-hero.png")
    return parser.parse_args(argv)


def reset():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (bpy.data.meshes, bpy.data.curves, bpy.data.materials,
                       bpy.data.cameras, bpy.data.lights):
        for item in list(datablocks):
            if item.users == 0:
                datablocks.remove(item)


def material(name, color, metallic=0.0, roughness=0.45, emission=None,
             emission_strength=0.0, alpha=1.0):
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color[:3], alpha)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*color[:3], alpha)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if "Coat Weight" in bsdf.inputs:
        bsdf.inputs["Coat Weight"].default_value = 0.22
        bsdf.inputs["Coat Roughness"].default_value = 0.22
    if emission and "Emission Color" in bsdf.inputs:
        bsdf.inputs["Emission Color"].default_value = (*emission[:3], 1)
        bsdf.inputs["Emission Strength"].default_value = emission_strength
    if alpha < 1:
        bsdf.inputs["Alpha"].default_value = alpha
        if hasattr(mat, "surface_render_method"):
            mat.surface_render_method = "DITHERED"
        elif hasattr(mat, "blend_method"):
            mat.blend_method = "BLEND"
        if hasattr(mat, "use_transparency_overlap"):
            mat.use_transparency_overlap = False
    return mat


def loft_body():
    # x, half-width, half-height, vertical centre. Values are normalized from
    # adult P. innesi reference proportions; +X points toward the snout.
    sections = [
        (-2.15, .06, .12, .00), (-2.00, .18, .28, .00),
        (-1.72, .31, .50, .02), (-1.30, .43, .67, .05),
        (-.72, .50, .78, .08), (-.08, .51, .82, .08),
        (.55, .46, .75, .07), (1.10, .37, .62, .05),
        (1.52, .27, .47, .03), (1.82, .18, .31, .02),
        (2.02, .06, .12, .01),
    ]
    rings = 20
    verts, faces = [], []
    for x, width, height, zc in sections:
        for i in range(rings):
            a = 2 * math.pi * i / rings
            # Slightly flatter ventral contour and fuller dorsal shoulder.
            z = zc + math.sin(a) * height
            if z < zc:
                z = zc + (z - zc) * .86
            y = math.cos(a) * width
            verts.append((x, y, z))
    for s in range(len(sections) - 1):
        for i in range(rings):
            a, b = s * rings + i, s * rings + (i + 1) % rings
            c, d = (s + 1) * rings + (i + 1) % rings, (s + 1) * rings + i
            faces.append((a, b, c, d))
    faces += [tuple(range(rings - 1, -1, -1)),
              tuple((len(sections) - 1) * rings + i for i in range(rings))]
    mesh = bpy.data.meshes.new("NeonTetra_AnatomicalBody")
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    obj = bpy.data.objects.new("NeonTetra_Body", mesh)
    bpy.context.collection.objects.link(obj)
    for poly in mesh.polygons:
        poly.use_smooth = True
    bevel = obj.modifiers.new("Subtle anatomical smoothing", "BEVEL")
    bevel.width, bevel.segments = .018, 2
    return obj


def membrane(name, points, mat, thickness=.012):
    # Duplicate on both sides around the sagittal plane for a thin visible fin.
    verts = [(x, -thickness, z) for x, z in points] + [(x, thickness, z) for x, z in points]
    n = len(points)
    faces = [tuple(range(n)), tuple(range(2*n-1, n-1, -1))]
    for i in range(n):
        faces.append((i, (i+1)%n, n+(i+1)%n, n+i))
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    bevel = obj.modifiers.new("Membrane edge softness", "BEVEL")
    bevel.width, bevel.segments = .01, 2
    return obj


def ray(name, a, b, radius, mat):
    curve = bpy.data.curves.new(name, "CURVE")
    curve.dimensions = "3D"
    curve.bevel_depth, curve.bevel_resolution = radius, 2
    spline = curve.splines.new("BEZIER")
    spline.bezier_points.add(1)
    for point, co in zip(spline.bezier_points, (a, b)):
        point.co = co
        point.handle_left_type = point.handle_right_type = "AUTO"
    obj = bpy.data.objects.new(name, curve)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    return obj


def fin_with_rays(name, points, roots, tips, fin_mat, ray_mat, thickness=.012):
    obj = membrane(name, points, fin_mat, thickness)
    for i, (a, b) in enumerate(zip(roots, tips)):
        ray(f"{name}_Ray_{i:02d}", a, b, .008, ray_mat)
    return obj


def markings(body):
    # Curves sit slightly above each flank and follow the actual body taper.
    blue_mat = material("Iridescent blue chromatophores", BLUE, .68, .18, BLUE, .18)
    red_mat = material("Red chromatophore band", RED, .08, .31)
    dark_mat = material("Ventral shadow band", (.012, .02, .026, 1), .05, .5)
    paths = [
        ("Blue", [(-1.72,.318,.18),(-.75,.505,.20),(.25,.505,.17),(1.38,.31,.12)], .052, blue_mat),
        ("Red", [(-1.75,.315,-.16),(-1.15,.43,-.22),(-.45,.49,-.27),(.15,.48,-.29)], .075, red_mat),
        ("Shadow", [(-1.5,.34,-.32),(-.55,.48,-.47),(.45,.43,-.41)], .025, dark_mat),
    ]
    for side in (-1, 1):
        for name, coords, width, mat in paths:
            curve = bpy.data.curves.new(f"{name}_{side}", "CURVE")
            curve.dimensions = "3D"
            curve.bevel_depth, curve.bevel_resolution = width, 3
            spline = curve.splines.new("BEZIER")
            spline.bezier_points.add(len(coords)-1)
            for p, (x,y,z) in zip(spline.bezier_points, coords):
                p.co = (x, y*side, z)
                p.handle_left_type = p.handle_right_type = "AUTO"
            obj = bpy.data.objects.new(f"{name}_stripe_{'L' if side>0 else 'R'}", curve)
            bpy.context.collection.objects.link(obj)
            obj.data.materials.append(mat)


def eyes():
    iris = material("Iris silver", (.45,.53,.55,1), .62, .16)
    pupil = material("Pupil", (.002,.004,.006,1), .05, .11)
    for side in (-1, 1):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, location=(1.28, side*.345, .29), scale=(.22,.085,.22))
        e=bpy.context.object; e.name=f"Eye_{side}"; e.data.materials.append(iris)
        bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, location=(1.31, side*.423, .29), scale=(.105,.025,.105))
        p=bpy.context.object; p.name=f"Pupil_{side}"; p.data.materials.append(pupil)


def fins():
    fin_mat = material("Living translucent fin membrane", (.48,.58,.59,1), 0, .34, alpha=.34)
    ray_mat = material("Fin rays", (.24,.30,.31,1), 0, .42, alpha=.7)
    fin_with_rays("CaudalFin", [(-2.02,0),(-2.72,.74),(-2.48,.04),(-2.72,-.70)],
                  [(-2.02,0)]*7,
                  [(-2.68,.68),(-2.58,.43),(-2.48,.16),(-2.45,0),(-2.49,-.17),(-2.59,-.43),(-2.68,-.64)], fin_mat, ray_mat, .018)
    fin_with_rays("DorsalFin", [(-.30,.76),(-.84,1.48),(-1.05,.82)],
                  [(-.32,0,.76),(-.52,0,.77),(-.73,0,.78),(-.94,0,.80)],
                  [(-.80,0,1.42),(-.84,0,1.25),(-.91,0,1.07),(-1.03,0,.84)], fin_mat, ray_mat)
    fin_with_rays("AnalFin", [(-.15,-.61),(-.82,-1.04),(-1.35,-.47)],
                  [(-.18,0,-.60),(-.42,0,-.62),(-.67,0,-.59),(-.93,0,-.55),(-1.2,0,-.49)],
                  [(-.78,0,-1.0),(-.87,0,-.90),(-1.0,0,-.75),(-1.18,0,-.60),(-1.34,0,-.49)], fin_mat, ray_mat)
    membrane("AdiposeFin", [(-1.25,.56),(-1.49,.82),(-1.63,.48)], fin_mat, .01)
    # Paired pectoral/pelvic fins are angled out from the flanks.
    for side in (-1,1):
        for name, loc, rot, scale in (
            ("Pectoral",(.62,side*.38,-.08),(math.radians(12),side*math.radians(34),side*math.radians(18)),(.62,.36,.012)),
            ("Pelvic",(-.22,side*.25,-.53),(0,side*math.radians(42),side*math.radians(8)),(.44,.25,.01))):
            f=membrane(f"{name}_{side}", [(0,0),(-1,.30),(-.78,-.14)], fin_mat, .008)
            f.location=loc; f.rotation_euler=rot; f.scale=scale


def mouth_and_gills():
    dark=material("Gill and mouth detail", (.035,.045,.045,1),0,.48)
    for side in (-1,1):
        ray(f"Operculum_{side}",(1.03,side*.43,.53),(1.00,side*.47,-.34),.012,dark)
    ray("Mouth crease",(1.94,-.08,-.05),(1.97,.08,-.05),.012,dark)


def studio(preview):
    world=bpy.context.scene.world or bpy.data.worlds.new("Studio World")
    bpy.context.scene.world=world; world.use_nodes=True
    world.node_tree.nodes["Background"].inputs["Color"].default_value=(.008,.018,.024,1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value=.32
    for name,loc,energy,size,color in (
        ("Key",(1,-5,5),950,4,(.68,.86,1)),("Rim",(-3,3,3),1100,3,(.12,.55,1)),("Fill",(4,2,0),600,3,(1,.22,.12))):
        data=bpy.data.lights.new(name,"AREA"); data.energy=energy; data.shape="DISK"; data.size=size; data.color=color
        o=bpy.data.objects.new(name,data); bpy.context.collection.objects.link(o); o.location=loc
        direction=Vector((0,0,.12))-o.location; o.rotation_euler=direction.to_track_quat("-Z","Y").to_euler()
    cam_data=bpy.data.cameras.new("Review Camera"); cam=bpy.data.objects.new("Review Camera",cam_data)
    bpy.context.collection.objects.link(cam); cam.location=(5.8,-8.6,3.2)
    cam.rotation_euler=(Vector((0,0,.12))-cam.location).to_track_quat("-Z","Y").to_euler(); cam_data.lens=58
    bpy.context.scene.camera=cam
    scene=bpy.context.scene
    try:
        scene.render.engine="BLENDER_EEVEE_NEXT"
    except TypeError:
        scene.render.engine="BLENDER_EEVEE"
    scene.render.resolution_x=1200; scene.render.resolution_y=800; scene.render.resolution_percentage=100
    scene.render.image_settings.file_format="PNG"; scene.render.film_transparent=False
    scene.render.filepath=str(Path(preview).resolve()); Path(preview).parent.mkdir(parents=True,exist_ok=True)
    bpy.ops.render.render(write_still=True)


def export_glb(path):
    Path(path).parent.mkdir(parents=True,exist_ok=True)
    requested={"filepath":str(Path(path).resolve()),"export_format":"GLB","export_apply":True,
               "export_materials":"EXPORT","export_yup":True}
    supported={p.identifier for p in bpy.ops.export_scene.gltf.get_rna_type().properties}
    bpy.ops.export_scene.gltf(**{k:v for k,v in requested.items() if k in supported})


def main():
    args=cli(); reset()
    body=loft_body(); body.data.materials.append(material("Silver olive body",SILVER,.28,.29))
    markings(body); eyes(); fins(); mouth_and_gills()
    scene=bpy.context.scene
    scene["scientific_name"]="Paracheirodon innesi"
    scene["art_direction"]="FishTankr premium scientific illustration"
    scene["accuracy_note"]="Art-directed validation model; requires expert visual review before publication."
    scene["references"]="FishBase species summary; live adult specimen photography"
    studio(args.preview); export_glb(args.output)
    print(f"Created {args.output} and {args.preview}")


if __name__ == "__main__":
    main()
