# Renders a lineup of Kairos citizen v4 looks (for art review and the README).
# Usage: python render_citizen_lineup.py <citizen.glb> <out.png>
import bpy, sys, math
from mathutils import Vector
glb, out = sys.argv[-2], sys.argv[-1]
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene

def srgb(h):
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (1, 3, 5))
    f = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return (f(r), f(g), f(b), 1)

LOOKS = [
    dict(frame="masc", hair="crop", outfit="hivis", hat="hardhat", skin="#8a5a3c", top="#e9772e", bottom="#2b4a6b"),
    dict(frame="masc", hair="short", outfit="suit", skin="#f2c7a5", top="#2a2a33", bottom="#2a2a33", extras=["glasses"], hairc="#4e3025"),
    dict(frame="fem", hair="bob", outfit="scrubs", hat="scrubcap", skin="#c08b62", top="#6fa8c8", bottom="#6fa8c8"),
    dict(frame="masc", hair="buzz", outfit="labcoat", skin="#6e4630", top="#3d7a52", bottom="#3b3b44", extras=["glasses", "beard"]),
    dict(frame="fem", hair="bald", outfit="abaya", hat="hijab", skin="#d9a778", top="#1e1d22", bottom="#1e1d22", veil="#1e1d22"),
    dict(frame="masc", hair="buzz", outfit="uniform", hat="police", skin="#482e25", top="#2f4a73", bottom="#1d2638", extras=["beard"]),
    dict(frame="fem", hair="long", outfit="dress", skin="#a6734d", top="#c0504d", bottom="#c0504d", hairc="#241a18"),
    dict(frame="fem", hair="buns", outfit="tshirt", skin="#e9c09a", top="#f4f1ea", bottom="#2d4f8a", skirt=True, hairc="#bf7540"),
    dict(frame="masc", hair="short", outfit="tshirt", skin="#e9c09a", top="#4f6236", bottom="#8a7a4e", extras=["beard", "backpack"], cargo=True, hairc="#4e3025"),
    dict(frame="fem", hair="braids", outfit="jacket", skin="#6e4630", top="#7a4fb5", bottom="#2b2f45"),
]
HATS = {"hardhat", "scrubcap", "hijab", "police", "cap", "beanie"}
for i, L in enumerate(LOOKS):
    before = set(bpy.data.objects); mats_before = set(bpy.data.materials)
    bpy.ops.import_scene.gltf(filepath=glb)
    new = [o for o in bpy.data.objects if o not in before]
    rootobj = [o for o in new if o.parent is None and o.name.startswith("KairosCitizen")][0]
    outfit = "skirt" if L.get("skirt") else L["outfit"]
    def apply(o, vis):
        base = o.name.split(".")[0]; v = vis
        if base.startswith("frame_"): v = vis and base == "frame_" + L["frame"]
        elif base.startswith("hair_"): v = vis and base == "hair_" + L["hair"] and L.get("hat") not in ("hijab", "scrubcap")
        elif base.startswith("outfit_"): v = vis and base in ("outfit_" + L["outfit"], "outfit_" + outfit)
        elif base.startswith("extras_"):
            n = base[7:]; v = vis and (n == L.get("hat") or n in L.get("extras", []))
        elif base.startswith("trouser_cargo"): v = vis and bool(L.get("cargo"))
        if base.startswith(("trouser_", "waist", "belt_line", "sewn_crease")) and not base.startswith("trouser_cargo") and outfit in ("dress", "skirt", "abaya"): v = False
        o.hide_render = not v; o.hide_set(not v)
        for c in o.children: apply(c, v)
    apply(rootobj, True)
    cols = dict(skin=L["skin"], top=L["top"], bottom=L["bottom"], hair=L.get("hairc", "#241a18"), veil=L.get("veil", "#4b3a6b"), shoes=L.get("shoes", "#2a2a2e"))
    for m in set(bpy.data.materials) - mats_before:
        base = m.name.split(".")[0]
        if base == "ink" and m.node_tree:
            # Inverted-hull outline: the game culls back faces; Cycles needs them made transparent.
            nt = m.node_tree; bsdf = nt.nodes["Principled BSDF"]; outn = nt.nodes["Material Output"]
            geo = nt.nodes.new("ShaderNodeNewGeometry"); tr = nt.nodes.new("ShaderNodeBsdfTransparent"); mix = nt.nodes.new("ShaderNodeMixShader")
            nt.links.new(geo.outputs["Backfacing"], mix.inputs[0]); nt.links.new(tr.outputs[0], mix.inputs[1]); nt.links.new(bsdf.outputs[0], mix.inputs[2])
            nt.links.new(tr.outputs[0], outn.inputs["Surface"])  # Cycles has no back-face culling: hide the hulls
        if base in cols and m.node_tree:
            m.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = srgb(cols[base])
        if base == "lips" and m.node_tree:
            c = Vector(srgb(L["skin"])[:3]).lerp(Vector(srgb("#7a2a3a")[:3]), 0.4 if L["frame"] == "fem" else 0.25)
            m.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (*c, 1)
    row = i % 5; back = i // 5
    rootobj.location = ((row - 2) * 0.66 + (0.33 if back else 0), back * 1.1, 0)
    rootobj.rotation_euler = (0, 0, math.radians((row - 2) * -4))

bpy.ops.mesh.primitive_plane_add(size=30, location=(0, 0, 0))
floor = bpy.context.object; fm = bpy.data.materials.new("floor"); fm.use_nodes = True
fm.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = srgb("#2a2d33"); floor.data.materials.append(fm)
bpy.ops.mesh.primitive_plane_add(size=30, location=(0, 6, 0), rotation=(math.radians(90), 0, 0))
wall = bpy.context.object; wm = bpy.data.materials.new("wall"); wm.use_nodes = True
wm.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = srgb("#15171c"); wall.data.materials.append(wm)
bpy.ops.object.light_add(type="SPOT", location=(1.5, -4, 5)); sp = bpy.context.object
sp.data.energy = 1800; sp.data.spot_size = math.radians(70); sp.data.spot_blend = 0.6
sp.rotation_euler = (Vector((0, 0.4, 0.9)) - sp.location).to_track_quat("-Z", "Y").to_euler()
bpy.ops.object.light_add(type="AREA", location=(-3, -3, 3)); fill = bpy.context.object; fill.data.energy = 300; fill.data.size = 4
fill.rotation_euler = (Vector((0, 0.4, 1)) - fill.location).to_track_quat("-Z", "Y").to_euler()
bpy.ops.object.light_add(type="AREA", location=(0, 3, 3)); rim = bpy.context.object; rim.data.energy = 250; rim.data.size = 5
rim.rotation_euler = (Vector((0, 0.4, 1.2)) - rim.location).to_track_quat("-Z", "Y").to_euler()
bpy.ops.object.camera_add(location=(0, -5.2, 1.05)); cam = bpy.context.object
cam.data.lens = 40
cam.rotation_euler = (Vector((0, 0.45, 0.95)) - cam.location).to_track_quat("-Z", "Y").to_euler()
sc.camera = cam
w = sc.world or bpy.data.worlds.new("w"); sc.world = w; w.use_nodes = True
w.node_tree.nodes["Background"].inputs["Color"].default_value = srgb("#101216"); w.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.6
sc.render.engine = "CYCLES"; sc.cycles.device = "CPU"; sc.cycles.samples = int(__import__("os").environ.get("SAMPLES", "32"))
try: sc.cycles.use_denoising = True
except Exception: pass
sc.render.resolution_x, sc.render.resolution_y = int(__import__("os").environ.get("RW", "1600")), int(__import__("os").environ.get("RH", "900"))
sc.view_settings.view_transform = "AgX" if "AgX" in [v.identifier for v in type(sc.view_settings).bl_rna.properties["view_transform"].enum_items] else "Filmic"
sc.render.filepath = out
bpy.ops.render.render(write_still=True)
print("rendered", out)
