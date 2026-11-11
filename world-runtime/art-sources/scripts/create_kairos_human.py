# Kairos human: the base character for every person in Kairos World.
#
# This is the supplied Blockbench humanoid "Human_male_basic", kept exactly as
# designed: its blocky parts, its proportions, its joint hierarchy and its
# idle / walk / run / jump / punch_basic / hit_take / death clips. Two things
# are added so it works as a skinnable game character:
#
#   1. every block is re-UV'd into the standard 64x64 Minecraft skin layout
#      (chest / waist / pelvis share the 8x12 body, each limb's three blocks
#      share its 4x12 limb, the neck sits under the head), so any Minecraft
#      skin, or a Kairos skin painted by public/kairos-skins.mjs, fits;
#   2. each block gets a second "overlay" shell half a pixel larger, mapped to
#      the skin's second layer (hat, jacket, sleeves, trousers), alpha-clipped.
#
# (create_kairos_human_reshaped.py is the earlier variant with realistic proportions.)
# Usage: python create_kairos_human.py <Human_male_basic.gltf> <skin.png> <out.glb>
import bpy, bmesh, math, sys
from mathutils import Vector

SRC, SKIN, OUT = sys.argv[-3], sys.argv[-2], sys.argv[-1]
PX = 1 / 16

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=SRC)
bpy.context.view_layer.update()

PART = {
    "head": ((0, 0), (32, 0), (8, 8, 8)), "body": ((16, 16), (16, 32), (8, 12, 4)),
    "rightArm": ((40, 16), (40, 32), (4, 12, 4)), "leftArm": ((32, 48), (48, 48), (4, 12, 4)),
    "rightLeg": ((0, 16), (0, 32), (4, 12, 4)), "leftLeg": ((16, 48), (0, 48), (4, 12, 4)),
}
# The slice of its Minecraft part each block covers (pixels from the top).
# Source blocks: body 6+5+3 px, arms 6+5+2 px, legs 5+3+1 px, scaled into 12 px.
SLICE = {
    "chest": ("body", (0, 5.1)), "waist": ("body", (5.1, 9.4)), "pelvis": ("body", (9.4, 12)),
    "neck": ("head", (7, 8)), "head": ("head", (0, 8)),
    "right_arm_upper": ("rightArm", (0, 5.5)), "right_arm_lower": ("rightArm", (5.5, 10.2)), "right_hand": ("rightArm", (10.2, 12)),
    "left_arm_upper": ("leftArm", (0, 5.5)), "left_arm_lower": ("leftArm", (5.5, 10.2)), "left_hand": ("leftArm", (10.2, 12)),
    "right_leg_upper": ("rightLeg", (0, 6.6)), "right_leg_lower": ("rightLeg", (6.6, 10.7)), "right_foot": ("rightLeg", (10.7, 12)),
    "left_leg_upper": ("leftLeg", (0, 6.6)), "left_leg_lower": ("leftLeg", (6.6, 10.7)), "left_foot": ("leftLeg", (10.7, 12)),
}

img = bpy.data.images.load(SKIN)
def skin_material(name, overlay):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; bsdf = nt.nodes["Principled BSDF"]
    tex = nt.nodes.new("ShaderNodeTexImage"); tex.image = img; tex.interpolation = "Closest"
    nt.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.9
    if overlay:
        nt.links.new(tex.outputs["Alpha"], bsdf.inputs["Alpha"])
        try: m.blend_method = "CLIP"; m.alpha_threshold = 0.5
        except Exception: pass
    return m
MAT = skin_material("kairos_skin", False)
MAT_OVER = skin_material("kairos_skin_overlay", True)

def box_uv(bm, part, rows, overlay):
    """Wrap a block in its Minecraft box. Faces are sorted by the side they face
    (+Y is the rig's forward in Blender) and stretched over that face of the box."""
    (base, over, (w, h, d)) = PART[part]
    u0, v0 = over if overlay else base
    uv = bm.loops.layers.uv.verify()
    zs = [v.co.z for v in bm.verts]; z0, z1 = min(zs), max(zs); zh = max(z1 - z0, 1e-6)
    r0, r1 = rows
    def side(f):
        n = f.normal
        if abs(n.z) > 0.7: return "top" if n.z > 0 else "bottom"
        a = math.degrees(math.atan2(n.x, n.y))
        return "front" if abs(a) <= 45 else "back" if abs(a) >= 135 else "right" if a > 0 else "left"
    groups = {}
    for f in bm.faces: groups.setdefault(side(f), []).append(f)
    for name, fs in groups.items():
        vs = {v for f in fs for v in f.verts}
        xs = [v.co.x for v in vs]; ys = [v.co.y for v in vs]
        x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
        xw, yd = max(x1 - x0, 1e-6), max(y1 - y0, 1e-6)
        for f in fs:
            for l in f.loops:
                c = l.vert.co
                fx = (c.x - x0) / xw; fy = (c.y - y0) / yd; fz = (z1 - c.z) / zh
                vv = v0 + d + r0 + fz * (r1 - r0)
                if name == "top": u, vv = u0 + d + (1 - fx) * w, v0 + fy * d
                elif name == "bottom": u, vv = u0 + d + w + (1 - fx) * w, v0 + fy * d
                elif name == "front": u = u0 + d + (1 - fx) * w
                elif name == "back": u = u0 + d + w + d + fx * w
                elif name == "right": u = u0 + fy * d
                else: u = u0 + d + w + (1 - fy) * d
                l[uv].uv = (u / 64, 1 - vv / 64)

for o in [o for o in bpy.data.objects if o.type == "MESH"]:
    joint = o.parent.name if o.parent else ""
    if joint.startswith("head_2"):  # the source's own hat block: the overlay shells replace it
        bpy.data.objects.remove(o, do_unlink=True); continue
    key = joint.split(".")[0]
    if key not in SLICE: print("skip", o.name, joint); continue
    part, rows = SLICE[key]
    for overlay in (False, True):
        me = o.data.copy() if overlay else o.data
        bm = bmesh.new(); bm.from_mesh(me)
        bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
        if overlay:  # half a pixel larger all round, about the block's own centre
            lo = Vector([min(v.co[i] for v in bm.verts) for i in range(3)]); hi = Vector([max(v.co[i] for v in bm.verts) for i in range(3)])
            c = (lo + hi) / 2; size = hi - lo
            for v in bm.verts:
                for i in range(3): v.co[i] = c[i] + (v.co[i] - c[i]) * (1 + PX / max(size[i], 1e-6))
        box_uv(bm, part, rows, overlay)
        bm.to_mesh(me); bm.free()
        me.materials.clear(); me.materials.append(MAT_OVER if overlay else MAT)
        for p in me.polygons: p.use_smooth = False
        if overlay:
            ob = bpy.data.objects.new(key + "_overlay", me); bpy.context.scene.collection.objects.link(ob)
            ob.parent = o.parent; ob.matrix_parent_inverse = o.matrix_parent_inverse.copy(); ob.matrix_basis = o.matrix_basis.copy()
        else:
            o.name = key + "_block"; me.name = key + "_block"
for o in list(bpy.data.objects):
    if o.name.startswith("head_2"): bpy.data.objects.remove(o, do_unlink=True)

bpy.context.view_layer.update()
top = max((o.matrix_world @ v.co).z for o in bpy.data.objects if o.type == "MESH" for v in o.data.vertices)
print("height", round(top, 4))
bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", export_animation_mode="NLA_TRACKS", export_apply=True)
print("exported", OUT)
