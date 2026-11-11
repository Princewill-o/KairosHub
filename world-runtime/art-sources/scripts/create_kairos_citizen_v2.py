# Kairos citizen v2: a fully modelled low-poly person with fitted clothing.
# Clothing is lofted from the same body profile with a small offset, so every
# outfit sits on the body instead of floating as blocks. Hair hugs the skull
# with a real hairline and carries no ink outline. Exported over
# public/world3d/kairos-citizen.glb with the same joint and variant names the
# game reads (Body, Head, ArmL/R, LegL/R, hair_*, outfit_*, extras_*, ...).
import bpy, bmesh, math, os, random
from mathutils import Vector

OUT = os.environ.get("KAIROS_CITIZEN", r"C:\Users\johnd\Documents\GitHub\KairosHub\public\world3d\kairos-citizen-v2.glb")
COL = "kairos-citizen-v2"
random.seed(11)

old = bpy.data.collections.get(COL)
if old:
    for o in list(old.objects): bpy.data.objects.remove(o, do_unlink=True)
    bpy.data.collections.remove(old)
col = bpy.data.collections.new(COL); bpy.context.scene.collection.children.link(col)

def srgb(h):
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (1, 3, 5))
    f = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return (f(r), f(g), f(b), 1)

def material(name, hexc, rough=0.85, cull=False):
    # Exact names: the game recolours skin/top/bottom/hair/shoes by material name.
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes["Principled BSDF"]
    p.inputs["Base Color"].default_value = srgb(hexc)
    p.inputs["Roughness"].default_value = rough
    m.use_backface_culling = cull
    return m

M = {k: material(k, c) for k, c in dict(skin="#8a5a3c", top="#6b3fa0", bottom="#2b2f45", hair="#241a18", shoes="#efe6d2", ivory="#f6f0e4", gold="#e0b25a").items()}
M["ink"] = material("ink", "#120f16", 1.0, cull=True)

def empty(name, parent=None, loc=(0, 0, 0)):
    o = bpy.data.objects.new(name, None); col.objects.link(o)
    o.parent = parent; o.location = loc
    return o

def mesh_obj(name, bm, mat, parent, outline=0.0, smooth=False):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); col.objects.link(o)
    o.parent = parent
    me.materials.append(M[mat])
    for p in me.polygons: p.use_smooth = smooth
    if outline:
        me.materials.append(M["ink"])
        s = o.modifiers.new("ink", "SOLIDIFY")
        s.thickness = -outline; s.offset = 1; s.use_flip_normals = True; s.material_offset = 1; s.use_rim = False
    return o

def loft(rings, segs=12, cap_top=True, cap_bot=True, ring_z=None, keep=None, cx=0.0, cy=0.0):
    """rings: (height, rx, rdepth[, forward]) bottom to top, in joint space.
    Angle 0 faces the camera (Blender -Y). ring_z(a, i, z) can bend a ring,
    keep(a) can drop columns of faces (open fronts)."""
    bm = bmesh.new(); grid = []
    for i, r in enumerate(rings):
        z, rx, rd = r[0], r[1], r[2]; fw = r[3] if len(r) > 3 else 0.0
        row = []
        for s in range(segs):
            a = s / segs * math.tau
            zz = ring_z(a, i, z) if ring_z else z
            row.append(bm.verts.new((cx + rx * math.sin(a), cy - (rd * math.cos(a) + fw), zz)))
        grid.append(row)
    for i in range(len(grid) - 1):
        for s in range(segs):
            a = (s + 0.5) / segs * math.tau
            if keep and not keep(a): continue
            bm.faces.new((grid[i][s], grid[i][(s + 1) % segs], grid[i + 1][(s + 1) % segs], grid[i + 1][s]))
    if cap_bot and not keep: bm.faces.new(list(reversed(grid[0])))
    if cap_top and not keep: bm.faces.new(grid[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm

def blob(r, loc, scale=(1, 1, 1), sub=1, jitter=0.0):
    bm = bmesh.new(); bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=r)
    for v in bm.verts:
        v.co = Vector((v.co.x * scale[0], v.co.y * scale[1], v.co.z * scale[2])) * (1 + random.uniform(-jitter, jitter)) + Vector(loc)
    return bm

def cube(size, loc):
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1)
    for v in bm.verts: v.co = Vector((v.co.x * size[0] + loc[0], v.co.y * size[1] + loc[1], v.co.z * size[2] + loc[2]))
    return bm

def tube(p0, p1, r, segs=6):
    """A thin cylinder between two points (cords, straps, braid strands)."""
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=segs, radius1=r, radius2=r, depth=1)
    d = Vector(p1) - Vector(p0); q = d.to_track_quat("Z", "Y")
    for v in bm.verts:
        v.co = q @ Vector((v.co.x, v.co.y, v.co.z * d.length)) + (Vector(p0) + Vector(p1)) / 2
    return bm

OL = 0.006  # thin ink line: clothing and body only

# ---------- joints ----------
root = empty("KairosCitizen")
body = empty("Body", root, (0, 0, 0.88))
head = empty("Head", body, (0, 0, 0.58)); head.scale = (1.12, 1.12, 1.12)  # friendly, readable faces
armL = empty("ArmL", body, (-0.2, 0, 0.445)); armR = empty("ArmR", body, (0.2, 0, 0.445))
legL = empty("LegL", root, (-0.09, 0, 0.88)); legR = empty("LegR", root, (0.09, 0, 0.88))

# ---------- torso (the shirt is the torso surface, so it always fits) ----------
TORSO = [(-0.02, 0.165, 0.105), (0.08, 0.158, 0.1), (0.2, 0.155, 0.098), (0.31, 0.172, 0.108, 0.006), (0.4, 0.188, 0.104, 0.004), (0.46, 0.17, 0.09), (0.5, 0.075, 0.062)]
def shell(rings, off, lo=None, hi=None):
    out = [(r[0], r[1] + off, r[2] + off) + tuple(r[3:]) for r in rings]
    return [r for r in out if (lo is None or r[0] >= lo) and (hi is None or r[0] <= hi)]
mesh_obj("tailored_torso", loft(TORSO, 14), "top", body, OL)
mesh_obj("waist", loft([(-0.04, 0.17, 0.11), (0.06, 0.163, 0.105)], 14), "bottom", body, OL)  # trouser waistband
mesh_obj("belt_line", loft([(0.035, 0.1645, 0.1065), (0.05, 0.1635, 0.1055)], 14, False, False), "ink", body)
mesh_obj("collar", loft([(0.47, 0.085, 0.072), (0.505, 0.07, 0.06)], 14, False, False), "top", body, OL)
mesh_obj("neck", loft([(0.46, 0.048, 0.046), (0.6, 0.044, 0.044)], 10), "skin", body)

# ---------- head ----------
HEAD = [(-0.02, 0.064, 0.06, -0.01), (0.03, 0.095, 0.1, -0.008), (0.08, 0.12, 0.124), (0.15, 0.134, 0.134), (0.21, 0.135, 0.132), (0.26, 0.118, 0.118), (0.295, 0.075, 0.075), (0.31, 0.012, 0.012)]
mesh_obj("sculpted_head", loft(HEAD, 16), "skin", head, 0.004, smooth=True)
for side, x in (("", -1), (".001", 1)):
    mesh_obj("ear" + side, blob(0.028, (x * 0.136, 0.004, 0.14), (0.45, 0.75, 1.15), sub=2), "skin", head, smooth=True)
    mesh_obj("eye_white" + side, blob(0.019, (x * 0.045, -0.126, 0.145), (0.95, 0.4, 1.12), sub=2), "ivory", head, smooth=True)
    mesh_obj("eye_iris" + side, blob(0.0145, (x * 0.045, -0.131, 0.143), (0.95, 0.38, 1.08), sub=2), "ink", head, smooth=True)
    mesh_obj("eye_glint" + side, blob(0.0042, (x * 0.042 + 0.004, -0.137, 0.15), sub=2), "ivory", head)
    mesh_obj("brow" + side, cube((0.042, 0.008, 0.008), (x * 0.05, -0.132, 0.182)), "hair", head)
mesh_obj("nose", blob(0.017, (0, -0.134, 0.11), (0.8, 0.65, 1.0), sub=2), "skin", head, smooth=True)
mesh_obj("smile_line", loft([(0.062, 0.03, 0.118, 0.004), (0.069, 0.033, 0.12, 0.004)], 16, False, False, keep=lambda a: math.cos(a) > 0.86), "ink", head)

def prof(z):
    """Head radius (rx, rdepth, forward) at height z, from the HEAD profile."""
    for a, b in zip(HEAD, HEAD[1:]):
        if a[0] <= z <= b[0]:
            t = (z - a[0]) / (b[0] - a[0])
            fa = a[3] if len(a) > 3 else 0.0; fb = b[3] if len(b) > 3 else 0.0
            return (a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, fa + (fb - fa) * t)
    return (HEAD[-1][1], HEAD[-1][2], 0.0)

def cap(name, parent, front=0.205, back=0.085, off=0.008, temple=-0.02, segs=18):
    """A hair cap that hugs the skull: starts on a real hairline (high at the
    forehead, low at the nape) and follows the head's own curve to the crown."""
    bm = bmesh.new(); rows = []
    ts = (0.0, 0.3, 0.55, 0.75, 0.88, 0.96)
    for t in ts:
        row = []
        for k in range(segs):
            a = k / segs * math.tau
            f = (1 + math.cos(a)) / 2
            z0 = back + (front - back) * f + temple * math.sin(a) ** 2
            z = z0 + (0.305 - z0) * t
            rx, rd, fw = prof(z)
            row.append(bm.verts.new((math.sin(a) * (rx + off), -(math.cos(a) * (rd + off) + fw), z)))
        rows.append(row)
    for i in range(len(rows) - 1):
        for k in range(segs):
            bm.faces.new((rows[i][k], rows[i][(k + 1) % segs], rows[i + 1][(k + 1) % segs], rows[i + 1][k]))
    top = bm.verts.new((0, 0, 0.31 + off))
    for k in range(segs): bm.faces.new((rows[-1][k], rows[-1][(k + 1) % segs], top))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return mesh_obj(name, bm, "hair", parent, smooth=True)

hair_styles = {}
def style(name):
    g = empty("hair_" + name, head); hair_styles[name] = g; return g
g = style("short"); cap("swept_crown", g)
for k in range(4):  # a soft fringe swept to one side
    a = -0.55 + k * 0.3; z = 0.232 - k * 0.008
    rx, rd, fw = prof(z)
    mesh_obj("swept_lock" + ("" if k == 0 else f".{k:03d}"), blob(0.034, (math.sin(a) * (rx + 0.008), -(math.cos(a) * (rd + 0.008) + fw), z), (1.5, 0.6, 0.55), sub=2), "hair", g, smooth=True)
g = style("buzz"); cap("close_crop", g, 0.21, 0.09, 0.0035)
g = style("curly"); cap("curl_cap", g, 0.2, 0.08, 0.01)
for k in range(48):
    th = random.uniform(0, math.tau); z = random.uniform(0.1, 0.3)
    if math.cos(th) > 0.5 and z < 0.215: continue  # keep the face clear
    rx, rd, fw = prof(z)
    mesh_obj("curl" + ("" if k == 0 else f".{k:03d}"), blob(0.025, (math.sin(th) * (rx + 0.014), -(math.cos(th) * (rd + 0.014) + fw), z), sub=1, jitter=0.12), "hair", g, smooth=True)
g = style("afro"); cap("afro_cap", g, 0.2, 0.08, 0.01)
mesh_obj("afro_crown", blob(0.17, (0, 0.025, 0.215), (1.05, 1.0, 0.9), sub=2, jitter=0.03), "hair", g, smooth=True)
g = style("bob"); cap("bob_cap", g, 0.215, 0.09, 0.01)
mesh_obj("bob_side", loft([(0.04, 0.146, 0.146), (0.1, 0.148, 0.148), (0.2, 0.146, 0.144)], 16, keep=lambda a: math.cos(a) < 0.35), "hair", g, smooth=True)
g = style("long"); cap("long_cap", g, 0.215, 0.09, 0.01)
mesh_obj("long_side", loft([(-0.2, 0.13, 0.1, -0.04), (-0.05, 0.145, 0.13, -0.01), (0.1, 0.148, 0.148), (0.2, 0.146, 0.144)], 16, keep=lambda a: math.cos(a) < 0.3), "hair", g, smooth=True)
g = style("braids"); cap("braid_cap", g, 0.21, 0.08, 0.008)
for k in range(10):
    a = math.pi * (0.55 + k * 0.1)  # around the back of the head
    x, y = math.sin(a) * 0.13, -math.cos(a) * 0.13
    mesh_obj("braid_segment" + ("" if k == 0 else f".{k:03d}"), tube((x, y, 0.13), (x * 1.08, y * 1.15, -0.16 - (k % 3) * 0.03), 0.011, 5), "hair", g)
g = style("buns"); cap("bun_cap", g, 0.21, 0.085, 0.008)
for k, x in enumerate((-0.085, 0.085)):
    mesh_obj("twist_bun" + ("" if k == 0 else ".001"), blob(0.05, (x, 0.02, 0.29), sub=1, jitter=0.08), "hair", g)
style("bald")

# ---------- arms: sleeve, forearm, hand ----------
def arm(j, sx, tag):
    # Rounded shoulder cap flowing into the sleeve.
    mesh_obj("sleeve_" + tag, loft([(-0.27, 0.05, 0.05), (-0.05, 0.059, 0.059), (0.01, 0.062, 0.062), (0.045, 0.05, 0.052), (0.068, 0.022, 0.026)], 12), "top", j, OL)
    mesh_obj("forearm_" + tag, loft([(-0.27, 0.043, 0.043), (-0.5, 0.036, 0.038)], 10), "skin", j, OL)
    mesh_obj("cuff_" + tag, loft([(-0.285, 0.052, 0.052), (-0.255, 0.052, 0.052)], 10, False, False), "top", j)
    mesh_obj("hand_" + tag, blob(0.05, (0, -0.005, -0.55), (0.8, 0.62, 1.1)), "skin", j, OL)
    mesh_obj("thumb_" + tag, blob(0.016, (-sx * 0.028, -0.025, -0.53), (0.8, 0.8, 1.4)), "skin", j)
arm(armL, -1, "L"); arm(armR, 1, "R")

def long_sleeves(outfit, mat="top"):
    for j, tag, n in ((armL, "L", ".001"), (armR, "R", ".002")):
        g = empty("outfit_" + outfit + n, j)
        mesh_obj(f"long_sleeve_{outfit}_{tag}", loft([(-0.25, 0.051, 0.051), (-0.48, 0.042, 0.044)], 10), mat, g, OL)
        mesh_obj(f"long_cuff_{outfit}_{tag}", loft([(-0.5, 0.045, 0.046), (-0.47, 0.045, 0.046)], 10, False, False), "ivory" if outfit == "tracksuit" else mat, g)

# ---------- legs: trousers to the ankle, shoes ----------
def leg(j, tag):
    mesh_obj("trouser_" + tag, loft([(0.04, 0.092, 0.096), (-0.1, 0.088, 0.092), (-0.38, 0.072, 0.075), (-0.72, 0.062, 0.064)], 10), "bottom", j, OL)
    mesh_obj("lower_leg_skin_" + tag, loft([(-0.36, 0.058, 0.06), (-0.72, 0.046, 0.048)], 10), "skin", j)
    mesh_obj("sewn_crease_" + tag, cube((0.004, 0.003, 0.3), (0, -0.075, -0.38)), "ink", j)
    mesh_obj("shoe_" + tag, loft([(-0.79, 0.066, 0.11, 0.035), (-0.73, 0.068, 0.11, 0.035), (-0.7, 0.056, 0.07, 0.015)], 10), "shoes", j, OL)
    mesh_obj("sole_" + tag, loft([(-0.815, 0.07, 0.115, 0.035), (-0.79, 0.07, 0.115, 0.035)], 10), "ivory", j, OL)
    g = empty("trouser_cargo_" + tag, j)
    sx = -1 if tag == "L" else 1
    mesh_obj("utility_pocket_" + tag, cube((0.012, 0.08, 0.1), (sx * 0.08, 0, -0.3)), "bottom", g, OL)
    mesh_obj("pocket_flap_" + tag, cube((0.014, 0.084, 0.02), (sx * 0.081, 0, -0.245)), "bottom", g, OL)
leg(legL, "L"); leg(legR, "R")

# ---------- outfits (all lofted from the torso, so they fit) ----------
def outfit(name): return empty("outfit_" + name, body)
outfit("tshirt")
g = outfit("hoodie")
mesh_obj("hood", loft([(0.43, 0.13, 0.1, -0.02), (0.5, 0.12, 0.095, -0.03), (0.56, 0.1, 0.07, -0.04)], 14, False, False, keep=lambda a: math.cos(a) < 0.55), "top", g, OL)
mesh_obj("kangaroo_pocket", loft(shell([(0.06, 0.12, 0.1), (0.17, 0.11, 0.1)], 0.006), 14, keep=lambda a: math.cos(a) > 0.55), "top", g, OL)
for k, x in enumerate((-0.03, 0.03)):
    mesh_obj("drawcord" + ("" if k == 0 else ".001"), tube((x, -0.1, 0.46), (x * 1.3, -0.112, 0.33), 0.005, 5), "ivory", g)
long_sleeves("hoodie")
g = outfit("jacket")
mesh_obj("jacket_panel", loft(shell(TORSO[:5], 0.012), 14, False, False, keep=lambda a: math.cos(a) < 0.93), "top", g, OL)
mesh_obj("shirt_front", loft(shell(TORSO[:5], 0.004), 14, False, False, keep=lambda a: math.cos(a) >= 0.93), "ivory", g)
for k, s in enumerate((-1, 1)):
    mesh_obj("lapel" + ("" if k == 0 else ".001"), tube((s * 0.03, -0.112, 0.45), (s * 0.06, -0.122, 0.28), 0.012, 4), "top", g, OL)
for k in range(3):
    mesh_obj("brass_button" + ("" if k == 0 else f".{k:03d}"), blob(0.009, (0.045, -0.126 + k * 0.004, 0.27 - k * 0.09)), "gold", g)
long_sleeves("jacket")
g = outfit("polo")
for k, s in enumerate((-1, 1)):
    mesh_obj("polo_collar" + ("" if k == 0 else ".001"), cube((0.05, 0.03, 0.012), (s * 0.04, -0.07, 0.49)), "ivory", g, OL)
mesh_obj("placket", cube((0.022, 0.004, 0.09), (0, -0.112, 0.43)), "ivory", g)
mesh_obj("woven_kairos_mark", cube((0.03, 0.004, 0.03), (0.08, -0.118, 0.36)), "gold", g)
g = outfit("stripes")
for k, z in enumerate((0.1, 0.18, 0.26, 0.34)):
    mesh_obj("knit_band" + ("" if k == 0 else f".{k:03d}"), loft(shell([(z, 0.156 + (z > 0.25) * 0.016, 0.099 + (z > 0.25) * 0.008), (z + 0.035, 0.157 + (z > 0.25) * 0.016, 0.1 + (z > 0.25) * 0.008)], 0.004), 14, False, False), "ivory", g)
g = outfit("tracksuit")
mesh_obj("sport_zip", cube((0.008, 0.006, 0.44), (0, -0.112, 0.04)), "ivory", g)
for k, s in enumerate((-1, 1)):
    mesh_obj("track_stripe" + ("" if k == 0 else ".001"), cube((0.012, 0.006, 0.4), (s * 0.17, 0, 0.06)), "ivory", g)
long_sleeves("tracksuit")
g = outfit("overalls")
mesh_obj("overall_bib", loft(shell([(0.0, 0.165, 0.105), (0.12, 0.158, 0.1), (0.3, 0.17, 0.108)], 0.006), 14, False, False, keep=lambda a: math.cos(a) > 0.55), "bottom", g, OL)
for k, s in enumerate((-1, 1)):
    mesh_obj("overall_strap" + ("" if k == 0 else ".001"), tube((s * 0.08, -0.112, 0.3), (s * 0.1, 0.0, 0.47), 0.012, 4), "bottom", g, OL)
    mesh_obj("overall_clasp" + ("" if k == 0 else ".001"), blob(0.011, (s * 0.08, -0.118, 0.3)), "gold", g)
g = outfit("tunic")
mesh_obj("tunic_hem", loft(shell([(-0.24, 0.2, 0.135), (-0.1, 0.18, 0.12), (0.05, 0.163, 0.105)], 0.008), 14, False, False), "top", g, OL)
mesh_obj("tunic_belt", loft(shell([(0.06, 0.158, 0.1), (0.09, 0.158, 0.1)], 0.012), 14, False, False), "gold", g)

# ---------- extras ----------
g = empty("extras_glasses", head)
for k, s in enumerate((-1, 1)):
    mesh_obj("frame" + ("" if k == 0 else f".{k:03d}"), loft([(0.12, 0.03, 0.006, 0.134), (0.17, 0.03, 0.006, 0.134)], 10, False, False, cx=s * 0.048), "ink", g)
mesh_obj("bridge", cube((0.03, 0.006, 0.006), (0, -0.14, 0.15)), "ink", g)
g = empty("extras_scarf", body)
mesh_obj("scarf_wrap", loft([(0.47, 0.11, 0.095), (0.54, 0.095, 0.085)], 12), "gold", g, OL)
mesh_obj("scarf_tail", cube((0.05, 0.02, 0.2), (0.05, -0.105, 0.36)), "gold", g, OL)
g = empty("extras_backpack", body)
mesh_obj("backpack", cube((0.24, 0.1, 0.3), (0, 0.15, 0.24)), "bottom", g, OL)
mesh_obj("pack_pocket", cube((0.16, 0.03, 0.12), (0, 0.21, 0.17)), "bottom", g, OL)
g = empty("extras_cap", head)
mesh_obj("cap", loft([(0.19, 0.146, 0.146), (0.25, 0.135, 0.135), (0.3, 0.08, 0.08), (0.32, 0.01, 0.01)], 14, cap_bot=False), "top", g, OL)
mesh_obj("peak", loft([(0.19, 0.11, 0.07, 0.14), (0.2, 0.11, 0.07, 0.14)], 12, keep=lambda a: math.cos(a) > 0.0), "top", g, OL)
g = empty("extras_beanie", head)
mesh_obj("knit_hat", loft([(0.17, 0.148, 0.148), (0.25, 0.14, 0.14), (0.31, 0.09, 0.09), (0.335, 0.01, 0.01)], 14, cap_bot=False), "top", g, OL)
mesh_obj("knit_turnup", loft([(0.15, 0.152, 0.152), (0.2, 0.152, 0.152)], 14, False, False), "top", g, OL)
g = empty("extras_beard", head)
mesh_obj("beard_chin", loft([(-0.03, 0.06, 0.06, -0.012), (0.03, 0.105, 0.11, -0.006), (0.09, 0.128, 0.13)], 14, False, False, keep=lambda a: math.cos(a) > -0.2), "hair", g, smooth=True)
g = empty("extras_freckles", head)
for k in range(6):
    s = -1 if k < 3 else 1
    mesh_obj("freckle" + ("" if k == 0 else f".{k:03d}"), blob(0.0035, (s * (0.05 + (k % 3) * 0.014), -0.128 + (k % 3) * 0.004, 0.115 + (k % 2) * 0.008)), "hair", g)

print("objects", len(col.objects))

for o in bpy.context.view_layer.objects: o.select_set(False)
for o in col.objects: o.select_set(True)
bpy.ops.export_scene.gltf(filepath=OUT, use_selection=True, export_apply=True, export_yup=True, export_materials="EXPORT")
print("exported", OUT)
