"""Kharis Church sanctuary inside Spurgeon's College — low-poly, from the owner's photo.

Tall white hall with high clerestory light panels, warm wood panelling to
dado height, a curved white apse with a gold cross on a copper ring, a low
wooden stage (lectern, communion table, mics, music stands, amps, keyboard,
upright piano with hymn books, red drum kit, speakers), and rows of purple
upholstered chairs with beech frames either side of a central aisle on a
plank floor. Sliding wooden partitions on the left wall.

Units = game tiles. The room spans x 0..COLS and Blender y 0..-ROWS (game z);
the stage is at the north (y ~ 0), the entrance at the south. The south wall is
kept low so the game camera can see in. Built with bmesh (fast, one mesh per
material). Writes public/world3d/spurgeons-interior.glb.
"""
from pathlib import Path
import math
import bpy, bmesh

REPO = Path(r"C:\Users\johnd\Documents\GitHub\KairosHub")
COLS, ROWS, HEIGHT = 26, 22, 6.0

for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)

MATS, MESHES = {}, {}
def mat(name, rgb, emit=0.0):
    if name not in MATS:
        m = bpy.data.materials.new(name); m.use_nodes = True
        b = m.node_tree.nodes["Principled BSDF"]
        b.inputs["Base Color"].default_value = (*rgb, 1)
        b.inputs["Roughness"].default_value = 0.85
        if emit:
            b.inputs["Emission Color"].default_value = (*rgb, 1)
            b.inputs["Emission Strength"].default_value = emit
        MATS[name] = m
        MESHES[name] = bmesh.new()
    return name

WALL = mat("White plaster", (0.93, 0.93, 0.91))
PANEL = mat("Oak panelling", (0.55, 0.33, 0.16))
FLOOR = mat("Plank floor", (0.45, 0.22, 0.10))
FLOOR2 = mat("Plank floor dark", (0.38, 0.18, 0.08))
STAGE = mat("Stage oak", (0.58, 0.36, 0.18))
BEECH = mat("Beech chair frame", (0.86, 0.62, 0.32))
PURPLE = mat("Purple upholstery", (0.38, 0.30, 0.58))
LILAC = mat("Lilac seat", (0.58, 0.52, 0.80))
GOLD = mat("Gold cross", (0.86, 0.68, 0.22))
COPPER = mat("Copper ring", (0.78, 0.40, 0.18))
LIGHT = mat("Clerestory light", (1.0, 0.98, 0.93), emit=2.5)
BLACK = mat("Black equipment", (0.06, 0.06, 0.07))
METAL = mat("Steel", (0.55, 0.56, 0.60))
RED = mat("Drum red", (0.78, 0.08, 0.10))
CEIL = mat("Ceiling tiles", (0.88, 0.88, 0.86))
GRILLE = mat("Radiator grille", (0.75, 0.74, 0.70))
BOOKS = [mat(f"Book {i}", c) for i, c in enumerate([(0.15, 0.25, 0.55), (0.55, 0.12, 0.12), (0.12, 0.4, 0.25), (0.8, 0.6, 0.2), (0.3, 0.2, 0.4)])]

def box(m, x0, x1, y0, y1, z0, z1):
    """x right, y = game z (south positive), z up. Stored with Blender y = -y."""
    bm = MESHES[m]
    vs = [bm.verts.new((x, -y, z)) for x in (x0, x1) for y in (y0, y1) for z in (z0, z1)]
    for f in [(0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)]:
        bm.faces.new([vs[i] for i in f])

def cyl(m, x, y, z0, z1, r, n=8):
    bm = MESHES[m]
    top = [bm.verts.new((x + r * math.cos(a), -(y + r * math.sin(a)), z1)) for a in [i * math.tau / n for i in range(n)]]
    bot = [bm.verts.new((v.co.x, v.co.y, z0)) for v in top]
    bm.faces.new(top); bm.faces.new(list(reversed(bot)))
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((bot[i], bot[j], top[j], top[i]))

def ring_x(m, cx, y, cz, r0, r1, n=24, depth=0.08):
    """A flat ring in the x/z plane facing south, at game depth y."""
    bm = MESHES[m]
    for i in range(n):
        a0, a1 = i * math.tau / n, (i + 1) * math.tau / n
        pts = [(r0, a0), (r1, a0), (r1, a1), (r0, a1)]
        front = [bm.verts.new((cx + r * math.cos(a), -(y + depth), cz + r * math.sin(a))) for r, a in pts]
        back = [bm.verts.new((v.co.x, -y, v.co.z)) for v in front]
        bm.faces.new(front); bm.faces.new(list(reversed(back)))
        for k in range(4):
            l = (k + 1) % 4
            bm.faces.new((front[k], front[l], back[l], back[k]))

# ── Shell ──────────────────────────────────────────────────────────────────
for i in range(int(COLS / 0.5)):
    box(FLOOR if i % 3 else FLOOR2, i * 0.5, i * 0.5 + 0.5, 0, ROWS, -0.05, 0.0)
T = 0.3
box(WALL, -T, 0, 0, ROWS, 0, HEIGHT)                    # west wall
box(WALL, COLS, COLS + T, 0, ROWS, 0, HEIGHT)           # east wall
box(WALL, -T, COLS + T, ROWS - 0.05, ROWS + T, 0, 0.45) # low south wall (camera side)
box(PANEL, -T, COLS + T, ROWS - 0.1, ROWS, 0.45, 0.55)
# Dado-height oak panelling with a top rail
for x0, x1 in ((0.0, 0.08), (COLS - 0.08, COLS)):
    box(PANEL, x0, x1, 0, ROWS, 0, 2.3)
    box(PANEL, x0 - 0.04 if x0 == 0 else x0, x1 + 0.04 if x1 == COLS else x1, 0, ROWS, 2.3, 2.42)
# Clerestory light panels high on the side walls, angled lamps beneath
for y in range(4, ROWS - 2, 4):
    for x, d in ((0.06, 0.04), (COLS - 0.06, -0.04)):
        box(LIGHT, min(x, x + d), max(x, x + d), y, y + 2.6, 3.6, 5.6)
        box(WALL, min(x, x + d * 6), max(x, x + d * 6), y + 0.2, y + 1.4, 2.9, 3.05)
    box(BLACK, 0.08, 0.4, y + 2.9, y + 3.3, 3.0, 3.45)                  # wall speakers
    box(BLACK, COLS - 0.4, COLS - 0.08, y + 2.9, y + 3.3, 3.0, 3.45)
# Sliding wooden partition doors on the west wall
for k in range(4):
    box(PANEL, 0.08, 0.2, 9 + k * 1.6, 10.5 + k * 1.6, 0, 2.9)
    box(METAL, 0.2, 0.24, 9.7 + k * 1.6, 9.8 + k * 1.6, 1.0, 1.6)
# Radiator covers
for y in (6, 15):
    box(PANEL, 0.08, 0.6, y, y + 2.2, 0, 0.9)
    box(GRILLE, 0.6, 0.62, y + 0.2, y + 2.0, 0.15, 0.75)

# Curved apse at the north end: white upper, panelled lower, segmented
SEG = 14
for i in range(SEG):
    a0 = math.pi * i / SEG; a1 = math.pi * (i + 1) / SEG
    cx, r = COLS / 2, COLS / 2
    x0, x1 = cx - r * math.cos(a0), cx - r * math.cos(a1)
    y0, y1 = 1.2 - 1.2 * math.sin(a0), 1.2 - 1.2 * math.sin(a1)
    xa, xb = min(x0, x1), max(x0, x1)
    ya = min(y0, y1) - 0.3
    box(WALL, xa, xb, ya - 0.2, ya, 0, HEIGHT)
    box(PANEL, xa, xb, ya, ya + 0.08, 0, 2.3)
# No ceiling: the game camera looks down into the hall.

# The cross — detailed: glowing niche, hammered copper ring with gold rims and
# studs, a bevelled gold cross with flared ends, a lighter inlay and a central boss.
GOLD_L = mat("Gold highlight", (1.0, 0.86, 0.40))
GOLD_D = mat("Gold shadow", (0.62, 0.44, 0.10))
COPPER_D = mat("Copper dark", (0.55, 0.24, 0.10))
HALO = mat("Cross halo", (1.0, 0.93, 0.78), emit=1.6)
GEM = mat("Boss gem", (0.55, 0.20, 0.75), emit=0.6)
CX, CY, CZ = COLS / 2, 0.15, 3.95
def disc(m, cx, y, cz, r, n=32, depth=0.03):
    bm = MESHES[m]
    front = [bm.verts.new((cx + r * math.cos(a), -(y + depth), cz + r * math.sin(a))) for a in [i * math.tau / n for i in range(n)]]
    back = [bm.verts.new((v.co.x, -y, v.co.z)) for v in front]
    bm.faces.new(front); bm.faces.new(list(reversed(back)))
    for i in range(n):
        j = (i + 1) % n; bm.faces.new((front[i], front[j], back[j], back[i]))
def stud(m, x, y, z, r):
    bm = MESHES[m]
    ret = bmesh.ops.create_icosphere(bm, subdivisions=1, radius=r)
    for v in ret["verts"]: v.co = Vector((x + v.co.x, -(y + abs(v.co.y) * 0.6), z + v.co.z))
from mathutils import Vector
disc(HALO, CX, CY - 0.12, CZ, 1.9, 40, 0.02)                     # soft glowing niche behind
for i in range(28):                                                  # hammered mosaic ring
    a0, a1 = i * math.tau / 28, (i + 1) * math.tau / 28
    bm = MESHES[COPPER if i % 2 else COPPER_D]
    pts = [(0.78, a0), (1.02, a0), (1.02, a1), (0.78, a1)]
    f = [bm.verts.new((CX + r * math.cos(a), -(CY + 0.08 + (0.015 if i % 2 else 0)), CZ + r * math.sin(a))) for r, a in pts]
    b = [bm.verts.new((v.co.x, -CY, v.co.z)) for v in f]
    bm.faces.new(f); bm.faces.new(list(reversed(b)))
    for k in range(4): bm.faces.new((f[k], f[(k + 1) % 4], b[(k + 1) % 4], b[k]))
ring_x(GOLD, CX, CY + 0.02, CZ, 1.02, 1.08, 40, 0.1)                 # outer gold rim
ring_x(GOLD, CX, CY + 0.02, CZ, 0.72, 0.78, 40, 0.1)                 # inner gold rim
for i in range(14):
    a = i * math.tau / 14 + 0.11
    stud(GOLD_L, CX + 0.9 * math.cos(a), CY + 0.1, CZ + 0.9 * math.sin(a), 0.035)
# Bevelled cross: dark backing plate, main body, flared ends, inlay, boss
def arm(x0, x1, z0, z1):
    box(GOLD_D, x0 - 0.05, x1 + 0.05, CY + 0.08, CY + 0.14, z0 - 0.05, z1 + 0.05)
    box(GOLD, x0, x1, CY + 0.14, CY + 0.26, z0, z1)
arm(CX - 0.2, CX + 0.2, 2.35, 5.45)          # upright
arm(CX - 1.25, CX + 1.25, 3.77, 4.13)        # beam
for (x0, x1, z0, z1) in [(CX - 0.3, CX + 0.3, 5.3, 5.5), (CX - 0.3, CX + 0.3, 2.3, 2.5), (CX - 1.35, CX - 1.15, 3.67, 4.23), (CX + 1.15, CX + 1.35, 3.67, 4.23)]:
    box(GOLD_L, x0, x1, CY + 0.12, CY + 0.28, z0, z1)                # flared terminals
box(GOLD_L, CX - 0.05, CX + 0.05, CY + 0.26, CY + 0.28, 2.55, 5.25)  # inlay
box(GOLD_L, CX - 1.05, CX + 1.05, CY + 0.26, CY + 0.28, 3.9, 4.0)
disc(GOLD_L, CX, CY + 0.26, CZ, 0.24, 16, 0.06)                      # boss
disc(GEM, CX, CY + 0.32, CZ, 0.11, 10, 0.04)

# ── Stage ──────────────────────────────────────────────────────────────────
S0, S1, SY0, SY1, SH = 6.0, 20.0, 0.6, 4.6, 0.32
box(STAGE, S0, S1, SY0, SY1, 0, SH)
box(PANEL, S0, S1, SY1 - 0.04, SY1, 0, SH)
for x in [S0 + i * 0.5 for i in range(int((S1 - S0) / 0.5))]:
    box(FLOOR2, x, x + 0.02, SY0, SY1, SH, SH + 0.005)
# Communion table and lectern
box(PANEL, CX - 1.3, CX + 1.3, 1.5, 2.2, SH, SH + 0.95)
box(STAGE, CX - 1.4, CX + 1.4, 1.45, 2.25, SH + 0.95, SH + 1.02)
box(PANEL, CX + 0.2, CX + 0.6, 2.7, 3.1, SH, SH + 1.25)
box(STAGE, CX + 0.0, CX + 0.8, 2.6, 3.2, SH + 1.25, SH + 1.35)
# Left: keyboard on stand, low cabinet, amps, mics and music stands
box(PANEL, S0 + 0.3, S0 + 2.6, 0.9, 1.4, SH, SH + 1.0)
box(BLACK, S0 + 2.9, S0 + 4.2, 1.2, 1.6, SH + 0.7, SH + 0.82)
for dx in (3.0, 4.1):
    cyl(METAL, S0 + dx, 1.4, SH, SH + 0.7, 0.03, 5)
for x, y, h in ((S0 + 0.9, 2.6, 0.45), (S0 + 2.3, 3.5, 0.55)):
    box(BLACK, x, x + 0.55, y, y + 0.35, SH, SH + h)
    box(GRILLE, x + 0.05, x + 0.5, y + 0.35, y + 0.37, SH + 0.05, SH + h - 0.08)
for x, y in ((S0 + 1.6, 2.2), (S0 + 3.2, 2.4), (S0 + 4.6, 2.0)):
    cyl(BLACK, x, y, SH, SH + 1.55, 0.025, 5); cyl(BLACK, x, y, SH, SH + 0.03, 0.22, 6)
    cyl(METAL, x, y, SH + 1.55, SH + 1.65, 0.035, 6)
for x, y in ((S0 + 2.6, 3.0), (S0 + 4.2, 2.9)):
    cyl(BLACK, x, y, SH, SH + 1.1, 0.02, 5)
    box(BLACK, x - 0.28, x + 0.28, y - 0.02, y + 0.02, SH + 1.1, SH + 1.45)
# Right: upright piano with hymn books, speakers, red drum kit
PX = S1 - 4.8
box(PANEL, PX, PX + 2.2, 0.9, 1.5, SH, SH + 1.2)
box(BLACK, PX + 0.1, PX + 2.1, 1.5, 1.85, SH + 0.7, SH + 0.82)
for i in range(18):
    box(BOOKS[i % len(BOOKS)], PX + 0.1 + i * 0.11, PX + 0.19 + i * 0.11, 0.95, 1.25, SH + 1.2, SH + 1.5)
for x in (PX - 1.0, PX - 0.45):
    box(BLACK, x, x + 0.5, 1.2, 1.7, SH, SH + 0.75)
DX, DY = S1 - 1.8, 1.8
cyl(RED, DX, DY + 0.4, SH, SH + 0.55, 0.32, 10)
for ox, oy, r, h in ((-0.55, 0.1, 0.17, 0.62), (0.45, 0.0, 0.2, 0.55), (0.1, -0.3, 0.14, 0.78), (-0.25, -0.3, 0.14, 0.82)):
    cyl(RED, DX + ox, DY + oy, SH + h - 0.2, SH + h, r, 10)
for ox, h in ((-0.8, 1.15), (0.8, 1.25), (0.95, 0.95)):
    cyl(METAL, DX + ox, DY - 0.2, SH, SH + h, 0.02, 5)
    cyl(GOLD, DX + ox, DY - 0.2, SH + h, SH + h + 0.02, 0.3, 10)
# Front speakers on the floor
for x in (S0 - 0.8, S1 + 0.2):
    box(BLACK, x, x + 0.6, SY1 - 0.6, SY1, 0, 0.9)

# ── Chairs: purple upholstery, beech frames, central aisle ────────────────
def chair(x, y):
    w, d = 0.62, 0.6
    for lx in (x + 0.04, x + w - 0.08):
        for ly in (y + 0.04, y + d - 0.08):
            box(BEECH, lx, lx + 0.05, ly, ly + 0.05, 0, 0.46 if ly < y + 0.3 else 0.9)
    box(BEECH, x, x + w, y, y + d, 0.42, 0.46)
    box(LILAC, x + 0.03, x + w - 0.03, y + 0.03, y + d - 0.06, 0.46, 0.54)
    box(BEECH, x, x + w, y + d - 0.07, y + d - 0.02, 0.86, 0.92)
    box(PURPLE, x + 0.05, x + w - 0.05, y + d - 0.08, y + d - 0.02, 0.58, 0.86)
CHAIR_ROWS = list(range(7, 19))
for row in CHAIR_ROWS:
    for i in range(8):
        chair(3.2 + i * 0.85, row + 0.1)
        chair(15.2 + i * 0.85, row + 0.1)

# ── Build objects ─────────────────────────────────────────────────────────
for name, bm in MESHES.items():
    if not bm.faces:
        continue
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me); bm.free()
    me.materials.append(MATS[name])
    ob = bpy.data.objects.new(f"Interior · {name}", me)
    bpy.context.collection.objects.link(ob)

blend = REPO / "world-runtime/art-sources/spurgeons-interior.blend"
glb = REPO / "public/world3d/spurgeons-interior.glb"
bpy.ops.wm.save_as_mainfile(filepath=str(blend))
bpy.ops.export_scene.gltf(filepath=str(glb), export_format="GLB", export_yup=True)
print("exported", glb, glb.stat().st_size)
