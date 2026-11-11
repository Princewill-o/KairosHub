# Kairos human: the base character for every person in Kairos World.
#
# Built on the supplied Blockbench rig "Human_male_basic" (its joint hierarchy
# and its idle / walk / run / jump / punch_basic / hit_take / death clips), with
# the joints moved to realistic proportions and every blocky part replaced by a
# faceted low-poly body segment. Each segment is UV-mapped by box projection
# into the standard 64x64 Minecraft skin layout (classic 4 px arms, with the
# second "overlay" layer as a slightly larger shell), so any Minecraft skin, or
# a Kairos skin painted by public/kairos-skins.mjs, dresses the same body.
#
# Usage: python create_kairos_human.py <Human_male_basic.gltf> <skin.png> <out.glb>
import bpy, bmesh, math, sys
from mathutils import Vector

SRC, SKIN, OUT = sys.argv[-3], sys.argv[-2], sys.argv[-1]
PX = 1 / 16  # Blockbench pixel in metres-ish game units

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=SRC)
bpy.context.view_layer.update()
J = {o.name: o for o in bpy.data.objects if o.type == "EMPTY"}
for o in [o for o in bpy.data.objects if o.type == "MESH"]:
    bpy.data.objects.remove(o, do_unlink=True)
if "head_2" in J:  # the source's hat-layer joint; our overlay shells replace it
    for c in list(J["head_2"].children): c.parent = J["head"]
    bpy.data.objects.remove(J.pop("head_2"), do_unlink=True)

# ---- 1. realistic proportions: new joint offsets (length along the old offset) ----
LENGTH = {  # parent -> joint distance, in pixels
    "pelvis": 15.5, "waist": 3.0, "chest": 3.0, "neck": 4.8, "head": 0.9,
    "left_arm_lower": 5.6, "right_arm_lower": 5.6, "left_hand": 4.6, "right_hand": 4.6,
    "left_leg_lower": 7.0, "right_leg_lower": 7.0, "left_foot": 6.3, "right_foot": 6.3,
}
EXPLICIT = {  # joints placed by vector (pixels) relative to their parent
    "left_arm_upper": (-4.6, 0.0, 4.2), "right_arm_upper": (4.6, 0.0, 4.2),
    "left_leg_upper": (-1.9, 0.0, 0.0), "right_leg_upper": (1.9, 0.0, 0.0),
}
delta = {}
for name, o in J.items():
    old = o.location.copy()
    if name in EXPLICIT:
        v = Vector(EXPLICIT[name]) * PX
        # The target is given in body space; express it in the parent's (slightly rotated) space.
        new = (o.parent.matrix_world.to_quaternion().inverted() @ v) if o.parent else v
    elif name in LENGTH and old.length > 1e-6:
        new = old.normalized() * LENGTH[name] * PX
    else:
        continue
    delta[name] = new - old
    o.location = new
bpy.context.view_layer.update()

# Translation keys (pelvis bob, idle sway) keep their motion but ride on the new rest.
for o in J.values():
    ad = o.animation_data
    if not ad or o.name not in delta: continue
    acts = [t.strips[0].action for t in ad.nla_tracks if t.strips] + ([ad.action] if ad.action else [])
    for act in set(acts):
        for fc in act.fcurves:
            if fc.data_path == "location":
                for k in fc.keyframe_points:
                    k.co.y += delta[o.name][fc.array_index]; k.handle_left.y += delta[o.name][fc.array_index]; k.handle_right.y += delta[o.name][fc.array_index]

# ---- 2. skin material ----
img = bpy.data.images.load(SKIN)
def skin_material(name, overlay):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; bsdf = nt.nodes["Principled BSDF"]
    tex = nt.nodes.new("ShaderNodeTexImage"); tex.image = img; tex.interpolation = "Closest"
    nt.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = 0.9
    if overlay:
        nt.links.new(tex.outputs["Alpha"], bsdf.inputs["Alpha"])
        m.blend_method = "CLIP" if hasattr(m, "blend_method") else m.blend_method
        try: m.alpha_threshold = 0.5
        except Exception: pass
    return m
MAT = skin_material("kairos_skin", False)
MAT_OVER = skin_material("kairos_skin_overlay", True)

# ---- 3. segments: faceted lofts, Minecraft box-UV ----
# Minecraft parts: (u, v) of base and overlay, size (w, h, d) in pixels.
PART = {
    "head": ((0, 0), (32, 0), (8, 8, 8)), "body": ((16, 16), (16, 32), (8, 12, 4)),
    "rightArm": ((40, 16), (40, 32), (4, 12, 4)), "leftArm": ((32, 48), (48, 48), (4, 12, 4)),
    "rightLeg": ((0, 16), (0, 32), (4, 12, 4)), "leftLeg": ((16, 48), (0, 48), (4, 12, 4)),
}

def loft(rings, segs=8):
    """rings: (z, rx, ry, fy) in pixels; front is +Y (the source rig faces +Y here)."""
    bm = bmesh.new(); grid = []
    for z, rx, ry, *rest in rings:
        fy = rest[0] if rest else 0.0
        row = []
        for s in range(segs):
            a = s / segs * math.tau
            row.append(bm.verts.new((rx * math.sin(a) * PX, (ry * math.cos(a) + fy) * PX, z * PX)))
        grid.append(row)
    for i in range(len(grid) - 1):
        for s in range(segs):
            bm.faces.new((grid[i][s], grid[i][(s + 1) % segs], grid[i + 1][(s + 1) % segs], grid[i + 1][s]))
    bm.faces.new(list(reversed(grid[0]))); bm.faces.new(grid[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm

def box_uv(bm, part, rows, overlay):
    """Wrap a faceted segment in its Minecraft box. Faces are sorted into the
    box's front / back / right / left by the angle of their centre around the
    segment (caps go to top / bottom), and each group is stretched over its own
    face of the box, so the skin reads square-on from every side.
    rows = (r0, r1): the slice of the part's height this segment covers."""
    (base, over, (w, h, d)) = PART[part]
    u0, v0 = over if overlay else base
    uv = bm.loops.layers.uv.verify()
    zs = [v.co.z for v in bm.verts]; z0, z1 = min(zs), max(zs); zh = max(z1 - z0, 1e-6)
    r0, r1 = rows
    def side(f):
        if abs(f.normal.z) > 0.75: return "top" if f.normal.z > 0 else "bottom"
        c = f.calc_center_median(); a = math.degrees(math.atan2(c.x, c.y))  # 0 = front (+Y), +90 = right (+X)
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

def segment(joint, name, rings, part, rows, segs=8, over=0.55):
    for overlay in (False, True):
        r = [(z, rx + (over if overlay else 0), ry + (over if overlay else 0), *rest) for z, rx, ry, *rest in rings]
        if overlay:  # the overlay shell also reaches half a pixel past each end
            r[0] = (r[0][0] - over * 0.5, *r[0][1:]); r[-1] = (r[-1][0] + over * 0.5, *r[-1][1:])
        bm = loft(r, segs)
        box_uv(bm, part, rows, overlay)
        me = bpy.data.meshes.new(name + ("_overlay" if overlay else "")); bm.to_mesh(me); bm.free()
        me.materials.append(MAT_OVER if overlay else MAT)
        for p in me.polygons: p.use_smooth = False
        ob = bpy.data.objects.new(me.name, me); bpy.context.scene.collection.objects.link(ob)
        ob.parent = J[joint]; ob.matrix_parent_inverse.identity()

# Spine and head (pixels, local to each joint; z up, +Y front).
segment("pelvis", "pelvis_mesh", [(-1.2, 3.7, 2.2), (0.6, 3.9, 2.3), (3.2, 3.55, 2.1)], "body", (10, 12))
segment("waist", "waist_mesh", [(-0.6, 3.52, 2.08), (1.4, 3.3, 2.0), (3.6, 3.52, 2.08)], "body", (6, 10))
segment("chest", "chest_mesh", [(-0.6, 3.5, 2.07), (2.0, 4.1, 2.35, 0.15), (3.6, 4.4, 2.3), (4.6, 3.8, 2.0), (5.2, 1.7, 1.4)], "body", (0, 6))
segment("neck", "neck_mesh", [(-0.4, 1.15, 1.15), (1.2, 1.05, 1.05)], "head", (7, 8), segs=6, over=0.2)
segment("head", "head_mesh", [(0.0, 1.25, 1.35, 0.25), (0.8, 1.9, 2.05, 0.15), (2.0, 2.2, 2.3), (3.2, 2.25, 2.35), (4.1, 1.95, 2.05), (4.7, 1.0, 1.1)], "head", (0, 8), segs=10)

# Arms: shoulder cap, upper arm; elbow; forearm; hand.
for side, part in (("left", "leftArm"), ("right", "rightArm")):
    segment(f"{side}_arm_upper", f"{side}_upper_arm_mesh", [(-5.6, 1.15, 1.15), (-2.5, 1.35, 1.35), (0.0, 1.55, 1.5), (0.9, 1.1, 1.1)], part, (0, 5))
    segment(f"{side}_arm_lower", f"{side}_forearm_mesh", [(-4.6, 0.85, 0.85), (-2.0, 1.05, 1.0), (0.2, 1.12, 1.1)], part, (5, 10))
    segment(f"{side}_hand", f"{side}_hand_mesh", [(-2.4, 0.45, 0.3), (-1.4, 0.75, 0.42), (0.1, 0.72, 0.45)], part, (10, 12), segs=6, over=0.25)

# Legs: thigh, knee, shin; foot is a shoe pointing forward.
for side, part in (("left", "leftLeg"), ("right", "rightLeg")):
    segment(f"{side}_leg_upper", f"{side}_thigh_mesh", [(-7.2, 1.45, 1.5), (-3.5, 1.75, 1.8), (0.4, 2.0, 2.05)], part, (0, 6))
    segment(f"{side}_leg_lower", f"{side}_shin_mesh", [(-6.4, 1.0, 1.05), (-3.6, 1.3, 1.4, -0.1), (0.2, 1.42, 1.45)], part, (6, 10))
    segment(f"{side}_foot", f"{side}_shoe_mesh", [(-2.2, 1.15, 2.3, 1.2), (-1.0, 1.15, 2.2, 1.1), (0.2, 0.95, 1.2, 0.2)], part, (10, 12))

bpy.context.view_layer.update()
# Ground the model: the lowest point sits at 0.
low = min((o.matrix_world @ v.co).z for o in bpy.data.objects if o.type == "MESH" for v in o.data.vertices)
print("lowest point", round(low, 4))
bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", export_animation_mode="NLA_TRACKS", export_image_format="AUTO", export_apply=True)
print("exported", OUT)
