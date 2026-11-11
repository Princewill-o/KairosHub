# Kairos citizen v3: defined low-poly people, masculine and feminine frames.
# Faceted (flat-shaded) anatomy at about seven heads tall, elbow and knee
# joints for real walking and jumping, separate face pieces (eyes, brows,
# mouth) the game animates for blinks, talking and reactions. Clothing is lofted
# from each body's own profile, so every outfit fits that body. Hair hugs the
# skull with a real hairline and carries no ink outline.
#
# Joints: KairosCitizen > Body > Head, ArmL/R > ElbowL/R ; KairosCitizen > LegL/R > KneeL/R
# Variants the game toggles by name: frame_masc / frame_fem, hair_*, outfit_*,
# extras_*, trouser_cargo_*. Exports public/world3d/kairos-citizen-v3.glb.
import bpy, bmesh, math, os, random
from mathutils import Vector

OUT = os.environ.get("KAIROS_CITIZEN", r"C:\Users\johnd\Documents\GitHub\KairosHub\public\world3d\kairos-citizen-v3.glb")
COL = "kairos-citizen-v3"
random.seed(23)

# Earlier citizen builds own the joint names (Body, Head, ...): clear them so the
# exported names stay exact.
for name in ("kairos-citizen-v2", COL):
    old = bpy.data.collections.get(name)
    if not old: continue
    for o in list(old.objects): bpy.data.objects.remove(o, do_unlink=True)
    bpy.data.collections.remove(old)
for n in ("KairosCitizen", "Body", "Head", "ArmL", "ArmR", "LegL", "LegR"):
    o = bpy.data.objects.get(n)
    if o: raise SystemExit(f"Another object is already named {n}; rename it before exporting the citizen.")
col = bpy.data.collections.new(COL); bpy.context.scene.collection.children.link(col)

def srgb(h):
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (1, 3, 5))
    f = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return (f(r), f(g), f(b), 1)

def material(name, hexc, rough=0.85, cull=False):
    # Exact names: the game recolours skin/top/bottom/hair/shoes/lips by name.
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    p = m.node_tree.nodes["Principled BSDF"]
    p.inputs["Base Color"].default_value = srgb(hexc)
    p.inputs["Roughness"].default_value = rough
    m.use_backface_culling = cull
    return m

M = {k: material(k, c) for k, c in dict(skin="#8a5a3c", top="#6b3fa0", bottom="#2b2f45", hair="#241a18", shoes="#efe6d2", ivory="#f6f0e4", gold="#e0b25a", lips="#7a3b3b").items()}
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

def loft(rings, segs=12, cap_top=True, cap_bot=True, ring_z=None, keep=None, cx=0.0, cy=0.0, jitter=0.0):
    """rings: (height, rx, rdepth[, forward]) bottom to top. Angle 0 faces the
    camera (Blender -Y). keep(a) can drop columns of faces (open fronts)."""
    bm = bmesh.new(); grid = []
    for i, r in enumerate(rings):
        z, rx, rd = r[0], r[1], r[2]; fw = r[3] if len(r) > 3 else 0.0
        row = []
        for s in range(segs):
            a = s / segs * math.tau
            zz = ring_z(a, i, z) if ring_z else z
            j = 1 + (random.uniform(-jitter, jitter) if jitter else 0)
            row.append(bm.verts.new((cx + rx * j * math.sin(a), cy - (rd * j * math.cos(a) + fw), zz)))
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

def tube(p0, p1, r, segs=6, r1=None):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=segs, radius1=r, radius2=r if r1 is None else r1, depth=1)
    d = Vector(p1) - Vector(p0); q = d.to_track_quat("Z", "Y")
    for v in bm.verts:
        v.co = q @ Vector((v.co.x, v.co.y, v.co.z * d.length)) + (Vector(p0) + Vector(p1)) / 2
    return bm

def poly(points, faces):
    bm = bmesh.new(); vs = [bm.verts.new(p) for p in points]
    for f in faces: bm.faces.new([vs[i] for i in f])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm

def interp(profile, z):
    """(rx, rdepth, forward) of a ring profile at height z."""
    for a, b in zip(profile, profile[1:]):
        if a[0] <= z <= b[0]:
            t = (z - a[0]) / (b[0] - a[0])
            fa = a[3] if len(a) > 3 else 0.0; fb = b[3] if len(b) > 3 else 0.0
            return (a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, fa + (fb - fa) * t)
    last = profile[-1] if z > profile[-1][0] else profile[0]
    return (last[1], last[2], last[3] if len(last) > 3 else 0.0)
def front(profile, z, off=0.0):
    rx, rd, fw = interp(profile, z); return -(rd + fw + off)
def shell(rings, off, lo=None, hi=None):
    out = [(r[0], r[1] + off, r[2] + off) + tuple(r[3:]) for r in rings]
    return [r for r in out if (lo is None or r[0] >= lo) and (hi is None or r[0] <= hi)]

OL = 0.0045  # thin ink line on clothing and limbs only
S = ".{:03d}"
def nm(base, k): return base if k == 0 else base + S.format(k)

# ---------- joints ----------
root = empty("KairosCitizen")
body = empty("Body", root, (0, 0, 0.92))
head = empty("Head", body, (0, 0, 0.575))
armL = empty("ArmL", body, (-0.195, 0, 0.45)); armR = empty("ArmR", body, (0.195, 0, 0.45))
elbowL = empty("ElbowL", armL, (0, 0, -0.27)); elbowR = empty("ElbowR", armR, (0, 0, -0.27))
legL = empty("LegL", root, (-0.088, 0, 0.92)); legR = empty("LegR", root, (0.088, 0, 0.92))
kneeL = empty("KneeL", legL, (0, 0, -0.42)); kneeR = empty("KneeR", legR, (0, 0, -0.42))

# ---------- the two frames ----------
FRAMES = {
    "masc": dict(
        torso=[(-0.05, 0.165, 0.11), (0.05, 0.158, 0.104), (0.16, 0.148, 0.097), (0.27, 0.166, 0.106, 0.004), (0.36, 0.188, 0.11, 0.006), (0.43, 0.198, 0.1), (0.48, 0.16, 0.084), (0.53, 0.066, 0.058)],
        head=[(0.0, 0.045, 0.04, -0.012), (0.03, 0.074, 0.078, -0.006), (0.07, 0.09, 0.098), (0.12, 0.096, 0.106), (0.17, 0.099, 0.107), (0.21, 0.092, 0.1), (0.24, 0.066, 0.072), (0.258, 0.012, 0.012)],
        neck=0.046, brow=0.0045, lips=False),
    "fem": dict(
        torso=[(-0.05, 0.176, 0.114), (0.05, 0.168, 0.108), (0.15, 0.13, 0.09), (0.24, 0.142, 0.097, 0.004), (0.31, 0.156, 0.112, 0.016), (0.37, 0.162, 0.106, 0.008), (0.43, 0.168, 0.092), (0.48, 0.14, 0.078), (0.53, 0.06, 0.054)],
        head=[(0.006, 0.034, 0.034, -0.012), (0.035, 0.064, 0.074, -0.006), (0.075, 0.084, 0.095), (0.12, 0.092, 0.104), (0.17, 0.095, 0.105), (0.21, 0.089, 0.098), (0.24, 0.063, 0.07), (0.256, 0.012, 0.012)],
        neck=0.038, brow=0.0032, lips=True),
}
HAIR_HEAD = FRAMES["masc"]["head"]

def build_head(f, g):
    H = f["head"]
    mesh_obj(nm("sculpted_head", 0), loft(H, 12), "skin", g, 0.003)
    for k, x in enumerate((-1, 1)):
        mesh_obj(nm("ear", k), blob(0.022, (x * 0.097, 0.004, 0.128), (0.42, 0.8, 1.25), sub=1), "skin", g)
        ey = front(H, 0.13, -0.006)
        mesh_obj(nm("eye_white", k), blob(0.017, (x * 0.036, ey, 0.13), (1.25, 0.35, 0.62), sub=2), "ivory", g)
        mesh_obj(nm("eye_iris", k), blob(0.0085, (x * 0.036, ey - 0.004, 0.13), (1, 0.4, 1), sub=2), "ink", g)
        mesh_obj(nm("eye_glint", k), blob(0.0026, (x * 0.036 + 0.003, ey - 0.0075, 0.133), sub=1), "ivory", g)
        by = front(H, 0.152, 0.003)
        mesh_obj(nm("brow", k), tube((x * 0.018, by, 0.152), (x * 0.054, by + 0.008, 0.155 - (0.004 if f["lips"] else 0)), f["brow"], 4), "hair", g)
        if f["lips"]:  # lashes: a short dark flick at the outer corner
            mesh_obj(nm("lash", k), tube((x * 0.05, ey - 0.002, 0.134), (x * 0.06, ey + 0.002, 0.14), 0.002, 3), "ink", g)
    # Nose: a faceted wedge off the face plane.
    ny = front(H, 0.11)
    mesh_obj("nose", poly([(0, ny + 0.004, 0.142), (0, ny - 0.02, 0.086), (-0.015, ny + 0.002, 0.084), (0.015, ny + 0.002, 0.084), (0, ny - 0.004, 0.078)],
                          [(0, 2, 1), (0, 1, 3), (2, 4, 1), (1, 4, 3)]), "skin", g)
    # Cheekbones: two subtle facets that catch the light.
    for k, x in enumerate((-1, 1)):
        mesh_obj(nm("cheek", k), blob(0.024, (x * 0.056, front(H, 0.1) + 0.02, 0.102), (1, 0.32, 0.7), sub=1), "skin", g)
    my = front(H, 0.06, 0.002)
    if f["lips"]:
        mesh_obj("mouth", blob(0.014, (0, my, 0.058), (1.55, 0.45, 0.42), sub=1), "lips", g)
    else:
        mesh_obj("mouth", blob(0.012, (0, my, 0.058), (1.8, 0.35, 0.22), sub=1), "lips", g)
    if not f["lips"]:  # a stronger jaw line
        mesh_obj("jaw", loft(shell([(0.02, 0.07, 0.075, -0.006), (0.05, 0.083, 0.09, -0.003)], 0.002), 12, False, False, keep=lambda a: math.cos(a) > -0.1), "skin", g)

def details_on(f, g, name, mat, size, z, x=0.0, off=0.004):
    return mesh_obj(name, cube(size, (x, front(f["torso"], z, off), z)), mat, g)

def build_body(fname):
    f = FRAMES[fname]; T = f["torso"]
    gb = empty("frame_" + fname, body)
    gh = empty("frame_" + fname + ".head", head)
    mesh_obj("tailored_torso", loft(T, 12), "top", gb, OL)
    mesh_obj("waist", loft([(-0.07, T[0][1] + 0.006, T[0][2] + 0.006), (0.07, T[1][1] + 0.005, T[1][2] + 0.005)], 12), "bottom", gb, OL)
    mesh_obj("belt_line", loft([(0.05, T[1][1] + 0.006, T[1][2] + 0.006), (0.065, T[1][1] + 0.006, T[1][2] + 0.006)], 12, False, False), "ink", gb)
    mesh_obj("collar", loft([(0.5, 0.072, 0.064), (0.535, 0.06, 0.054)], 12, False, False), "top", gb, OL)
    mesh_obj("neck", loft([(0.48, f["neck"] + 0.004, f["neck"]), (0.62, f["neck"], f["neck"] - 0.002)], 8), "skin", gb)
    build_head(f, gh)

    def outfit(name): return empty("outfit_" + name, gb)
    outfit("tshirt")
    g = outfit("hoodie")
    mesh_obj("hood", loft([(0.44, 0.12, 0.095, -0.02), (0.51, 0.11, 0.09, -0.03), (0.57, 0.09, 0.066, -0.04)], 12, False, False, keep=lambda a: math.cos(a) < 0.55), "top", g, OL)
    mesh_obj("kangaroo_pocket", loft(shell([(0.06, T[1][1], T[1][2]), (0.17, T[2][1], T[2][2])], 0.007), 12, keep=lambda a: math.cos(a) > 0.6), "top", g, OL)
    for k, x in enumerate((-0.026, 0.026)):
        mesh_obj(nm("drawcord", k), tube((x, front(T, 0.47, 0.004), 0.47), (x * 1.2, front(T, 0.34, 0.006), 0.34), 0.0035, 4), "ivory", g)
    g = outfit("jacket")
    mesh_obj("jacket_panel", loft(shell(T[:-2], 0.011), 12, False, False, keep=lambda a: math.cos(a) < 0.92), "top", g, OL)
    mesh_obj("shirt_front", loft(shell(T[:-2], 0.004), 12, False, False, keep=lambda a: math.cos(a) >= 0.92), "ivory", g)
    for k, s in enumerate((-1, 1)):
        mesh_obj(nm("lapel", k), tube((s * 0.03, front(T, 0.46, 0.012), 0.46), (s * 0.055, front(T, 0.3, 0.014), 0.3), 0.01, 3), "top", g, OL)
    for k in range(3):
        z = 0.26 - k * 0.09
        mesh_obj(nm("brass_button", k), blob(0.007, (0.04, front(T, z, 0.014), z)), "gold", g)
    g = outfit("polo")
    for k, s in enumerate((-1, 1)):
        mesh_obj(nm("polo_collar", k), cube((0.045, 0.026, 0.01), (s * 0.036, -0.064, 0.52)), "ivory", g, OL)
    details_on(f, g, "placket", "ivory", (0.018, 0.004, 0.08), 0.45)
    details_on(f, g, "woven_kairos_mark", "gold", (0.026, 0.004, 0.026), 0.36, 0.075)
    g = outfit("stripes")
    for k, z in enumerate((0.1, 0.18, 0.26, 0.34)):
        rx, rd, fw = interp(T, z)
        mesh_obj(nm("knit_band", k), loft([(z, rx + 0.004, rd + 0.004, fw), (z + 0.032, rx + 0.004, rd + 0.004, fw)], 12, False, False), "ivory", g)
    g = outfit("tracksuit")
    for k in range(6):
        z0, z1 = 0.05 + k * 0.075, 0.05 + (k + 1) * 0.075
        mesh_obj(nm("sport_zip", k), tube((0, front(T, z0, 0.003), z0), (0, front(T, z1, 0.003), z1), 0.004, 4), "ivory", g)
    for k, s in enumerate((-1, 1)):
        mesh_obj(nm("track_stripe", k), cube((0.01, 0.006, 0.38), (s * (T[3][1] + 0.004), 0, 0.07)), "ivory", g)
    g = outfit("overalls")
    mesh_obj("overall_bib", loft(shell([r for r in T if r[0] <= 0.31], 0.006), 12, False, False, keep=lambda a: math.cos(a) > 0.55), "bottom", g, OL)
    for k, s in enumerate((-1, 1)):
        mesh_obj(nm("overall_strap", k), tube((s * 0.07, front(T, 0.3, 0.008), 0.3), (s * 0.09, 0.0, 0.5), 0.01, 4), "bottom", g, OL)
        mesh_obj(nm("overall_clasp", k), blob(0.009, (s * 0.07, front(T, 0.3, 0.012), 0.3)), "gold", g)
    g = outfit("tunic")
    hem = 0.24 if fname == "fem" else 0.2
    mesh_obj("tunic_hem", loft(shell([(-hem, T[0][1] + 0.05, T[0][2] + 0.035), (-0.1, T[0][1] + 0.02, T[0][2] + 0.012), (0.06, T[1][1], T[1][2])], 0.008), 12, False, False), "top", g, OL)
    mesh_obj("tunic_belt", loft(shell([(0.08, T[1][1] - 0.004, T[1][2] - 0.002), (0.105, T[1][1] - 0.006, T[1][2] - 0.003)], 0.012), 12, False, False), "gold", g)
    # Scarf and backpack follow the frame too.
    g = empty("extras_scarf", gb)
    mesh_obj("scarf_wrap", loft([(0.48, 0.1, 0.085), (0.55, 0.086, 0.075)], 10), "gold", g, OL)
    mesh_obj("scarf_tail", cube((0.045, 0.018, 0.18), (0.045, front(T, 0.38, 0.012), 0.38)), "gold", g, OL)
    g = empty("extras_backpack", gb)
    mesh_obj("backpack", cube((0.22, 0.09, 0.28), (0, T[4][2] + 0.05, 0.25)), "bottom", g, OL)
    mesh_obj("pack_pocket", cube((0.15, 0.03, 0.11), (0, T[4][2] + 0.105, 0.18)), "bottom", g, OL)
    g = empty("extras_beard", gh)
    if fname == "masc":
        H = f["head"]
        mesh_obj("beard_chin", loft(shell([r for r in H if r[0] <= 0.075], 0.004), 12, False, False, keep=lambda a: math.cos(a) > -0.15), "hair", g)
        mesh_obj("moustache", blob(0.012, (0, front(H, 0.075, 0.004), 0.074), (2.4, 0.5, 0.5)), "hair", g)
    g = empty("extras_freckles", gh)
    for k in range(6):
        s = -1 if k < 3 else 1
        mesh_obj(nm("freckle", k), blob(0.0025, (s * (0.04 + (k % 3) * 0.011), front(f["head"], 0.105, 0.001), 0.1 + (k % 2) * 0.007)), "hair", g)

build_body("masc"); build_body("fem")

# ---------- hair (shared; sits on the larger skull so it never clips) ----------
def cap(name, parent, frontz=0.168, back=0.06, off=0.006, temple=-0.018, segs=14):
    bm = bmesh.new(); rows = []
    for t in (0.0, 0.3, 0.55, 0.75, 0.88, 0.96):
        row = []
        for k in range(segs):
            a = k / segs * math.tau
            fr = (1 + math.cos(a)) / 2
            z0 = back + (frontz - back) * fr + temple * math.sin(a) ** 2
            z = z0 + (0.252 - z0) * t
            rx, rd, fw = interp(HAIR_HEAD, z)
            row.append(bm.verts.new((math.sin(a) * (rx + off), -(math.cos(a) * (rd + off) + fw), z)))
        rows.append(row)
    for i in range(len(rows) - 1):
        for k in range(segs):
            bm.faces.new((rows[i][k], rows[i][(k + 1) % segs], rows[i + 1][(k + 1) % segs], rows[i + 1][k]))
    top = bm.verts.new((0, 0, 0.258 + off))
    for k in range(segs): bm.faces.new((rows[-1][k], rows[-1][(k + 1) % segs], top))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return mesh_obj(name, bm, "hair", parent)

def on_skull(a, z, off):
    rx, rd, fw = interp(HAIR_HEAD, z)
    return (math.sin(a) * (rx + off), -(math.cos(a) * (rd + off) + fw), z)

def style(name): return empty("hair_" + name, head)
g = style("short"); cap("swept_crown", g)
for k in range(5):
    a = -0.6 + k * 0.26; z = 0.19 - abs(k - 1) * 0.004
    mesh_obj(nm("swept_lock", k), blob(0.026, on_skull(a, z, 0.006), (1.5, 0.55, 0.6), sub=1), "hair", g)
g = style("buzz"); cap("close_crop", g, 0.172, 0.065, 0.0025)
g = style("curly"); cap("curl_cap", g, 0.165, 0.06, 0.007)
for k in range(46):
    th = random.uniform(0, math.tau); z = random.uniform(0.08, 0.25)
    if math.cos(th) > 0.5 and z < 0.175: continue
    mesh_obj(nm("curl", k), blob(0.018, on_skull(th, z, 0.012), sub=1, jitter=0.15), "hair", g)
g = style("afro"); cap("afro_cap", g, 0.165, 0.06, 0.007)
mesh_obj("afro_crown", blob(0.128, (0, 0.016, 0.18), (1.04, 1.0, 0.88), sub=2, jitter=0.04), "hair", g)
g = style("bob"); cap("bob_cap", g, 0.175, 0.07, 0.007)
mesh_obj("bob_side", loft([(0.02, 0.104, 0.11), (0.08, 0.108, 0.116), (0.17, 0.106, 0.114)], 14, keep=lambda a: math.cos(a) < 0.3), "hair", g)
g = style("long"); cap("long_cap", g, 0.175, 0.07, 0.007)
mesh_obj("long_side", loft([(-0.2, 0.09, 0.07, -0.035), (-0.04, 0.104, 0.1, -0.01), (0.08, 0.108, 0.116), (0.17, 0.106, 0.114)], 14, keep=lambda a: math.cos(a) < 0.25), "hair", g)
g = style("braids"); cap("braid_cap", g, 0.172, 0.06, 0.006)
for k in range(10):
    a = math.pi * (0.55 + k * 0.1)
    x, y, z = on_skull(a, 0.1, 0.004)
    mesh_obj(nm("braid_segment", k), tube((x, y, z), (x * 1.08, y * 1.15, -0.17 - (k % 3) * 0.025), 0.008, 4, 0.006), "hair", g)
g = style("buns"); cap("bun_cap", g, 0.172, 0.065, 0.006)
for k, x in enumerate((-0.062, 0.062)):
    mesh_obj(nm("twist_bun", k), blob(0.036, (x, 0.012, 0.236), sub=1, jitter=0.08), "hair", g)
style("bald")

# ---------- arms: shoulder cap and sleeve, elbow, forearm, hand ----------
def arm(j, e, sx, tag):
    mesh_obj("sleeve_" + tag, loft([(-0.27, 0.042, 0.042), (-0.12, 0.047, 0.047), (-0.02, 0.052, 0.052), (0.02, 0.05, 0.051), (0.05, 0.036, 0.04), (0.066, 0.012, 0.014)], 10), "top", j, OL)
    mesh_obj("upper_arm_" + tag, loft([(-0.29, 0.035, 0.035), (-0.18, 0.04, 0.04)], 8), "skin", j)
    mesh_obj("cuff_" + tag, loft([(-0.28, 0.044, 0.044), (-0.255, 0.044, 0.044)], 10, False, False), "top", j)
    mesh_obj("forearm_" + tag, loft([(0.0, 0.035, 0.036), (-0.12, 0.034, 0.034), (-0.24, 0.026, 0.028)], 8), "skin", e, OL)
    mesh_obj("hand_" + tag, blob(0.03, (0, -0.004, -0.29), (0.75, 0.48, 1.45), sub=1), "skin", e, OL)
    mesh_obj("thumb_" + tag, tube((-sx * 0.016, -0.012, -0.26), (-sx * 0.024, -0.03, -0.3), 0.008, 4), "skin", e)
    for outfit, k in (("hoodie", 1), ("jacket", 2), ("tracksuit", 3)):
        g = empty(f"outfit_{outfit}{S.format(k + (0 if tag == 'L' else 3))}", e)
        mesh_obj(f"long_sleeve_{outfit}_{tag}", loft([(0.03, 0.044, 0.044), (-0.12, 0.04, 0.04), (-0.23, 0.033, 0.035)], 10), "top", g, OL)
        mesh_obj(f"long_cuff_{outfit}_{tag}", loft([(-0.245, 0.035, 0.037), (-0.215, 0.035, 0.037)], 10, False, False), "ivory" if outfit == "tracksuit" else "top", g)
        if outfit == "tracksuit":
            mesh_obj(f"sleeve_stripe_{tag}", cube((0.006, 0.006, 0.2), (sx * 0.042, 0, -0.1)), "ivory", g)
arm(armL, elbowL, -1, "L"); arm(armR, elbowR, 1, "R")

# ---------- legs: thigh, knee, shin, shoe ----------
def leg(j, kn, tag):
    sx = -1 if tag == "L" else 1
    mesh_obj("trouser_" + tag, loft([(0.05, 0.088, 0.094), (-0.08, 0.084, 0.09), (-0.26, 0.068, 0.072), (-0.44, 0.058, 0.06)], 10), "bottom", j, OL)
    mesh_obj("thigh_skin_" + tag, loft([(-0.44, 0.052, 0.054), (-0.2, 0.062, 0.064)], 8), "skin", j)
    mesh_obj("trouser_lower_" + tag, loft([(0.03, 0.058, 0.06), (-0.16, 0.053, 0.056), (-0.34, 0.046, 0.048)], 10), "bottom", kn, OL)
    mesh_obj("lower_leg_skin_" + tag, loft([(-0.34, 0.034, 0.036), (-0.16, 0.044, 0.048), (0.02, 0.046, 0.046)], 8), "skin", kn)
    mesh_obj("sewn_crease_" + tag, cube((0.003, 0.003, 0.3), (0, -0.059, -0.17)), "ink", kn)
    mesh_obj("shoe_" + tag, loft([(-0.42, 0.046, 0.088, 0.032), (-0.37, 0.048, 0.088, 0.032), (-0.335, 0.04, 0.052, 0.01)], 10), "shoes", kn, OL)
    mesh_obj("sole_" + tag, loft([(-0.435, 0.05, 0.093, 0.032), (-0.42, 0.05, 0.093, 0.032)], 10), "ivory", kn, OL)
    g = empty("trouser_cargo_" + tag, j)
    mesh_obj("utility_pocket_" + tag, cube((0.012, 0.07, 0.09), (sx * 0.08, 0, -0.27)), "bottom", g, OL)
    mesh_obj("pocket_flap_" + tag, cube((0.014, 0.074, 0.018), (sx * 0.081, 0, -0.22)), "bottom", g, OL)
leg(legL, kneeL, "L"); leg(legR, kneeR, "R")

# ---------- head extras (shared) ----------
H = HAIR_HEAD
g = empty("extras_glasses", head)
ey = front(H, 0.13, 0.004)
for k, s in enumerate((-1, 1)):
    mesh_obj(nm("frame", k), loft([(0.115, 0.024, 0.005, -ey - 0.005), (0.146, 0.024, 0.005, -ey - 0.005)], 10, False, False, cx=s * 0.036), "ink", g)
mesh_obj("bridge", cube((0.024, 0.005, 0.005), (0, ey - 0.006, 0.136)), "ink", g)
g = empty("extras_cap", head)
mesh_obj("cap", loft([(0.15, 0.106, 0.114), (0.2, 0.1, 0.108), (0.24, 0.07, 0.076), (0.265, 0.01, 0.01)], 12, cap_bot=False), "top", g, OL)
mesh_obj("peak", loft([(0.15, 0.08, 0.05, 0.1), (0.158, 0.08, 0.05, 0.1)], 10, keep=lambda a: math.cos(a) > 0.0), "top", g, OL)
g = empty("extras_beanie", head)
mesh_obj("knit_hat", loft([(0.13, 0.108, 0.116), (0.2, 0.104, 0.112), (0.25, 0.07, 0.076), (0.278, 0.01, 0.01)], 12, cap_bot=False), "top", g, OL)
mesh_obj("knit_turnup", loft([(0.118, 0.112, 0.12), (0.16, 0.112, 0.12)], 12, False, False), "top", g, OL)

dupes = [o.name for o in col.objects if "." in o.name and o.name.split(".")[0] in ("Body", "Head", "KairosCitizen", "trouser_L", "trouser_R")]
assert not dupes, dupes
print("objects", len(col.objects))
for o in bpy.context.view_layer.objects: o.select_set(False)
for o in col.objects: o.select_set(True)
bpy.ops.export_scene.gltf(filepath=OUT, use_selection=True, export_apply=True, export_yup=True, export_materials="EXPORT")
print("exported", OUT)
