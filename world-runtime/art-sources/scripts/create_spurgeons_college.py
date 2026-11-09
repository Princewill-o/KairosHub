"""Spurgeon's College (Falkland Park, South Norwood Hill) as Kharis Church — low-poly.

Reference: Former_Falkland_Park_South_Norwood_Hill (geograph 1777086).
Italianate Victorian mansion: dark brick panels framed by cream stone pilasters
and string courses, sash windows with stone surrounds, first-floor balconettes,
a roof balustrade with urns, tall stacks, and a central belvedere tower.
Front faces +Y (the game rotates it to face the lawn). Ground at z = 0, metres.

Writes world-runtime/art-sources/spurgeons-college.blend and
public/world3d/spurgeons-college.glb
"""
from pathlib import Path
import math
import bpy

REPO = Path(r"C:\Users\johnd\Documents\GitHub\KairosHub")
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)
for coll in (bpy.data.meshes, bpy.data.materials):
    for b in list(coll):
        if b.users == 0:
            coll.remove(b)

MATS = {}
def mat(name, rgb, rough=0.9):
    if name in MATS:
        return MATS[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Roughness"].default_value = rough
    MATS[name] = m
    return m

BRICK = mat("Dark rendered panels", (0.40, 0.36, 0.31))
STONE = mat("Cream stone", (0.90, 0.86, 0.75))
STONE_D = mat("Shaded stone", (0.74, 0.70, 0.60))
ANNEX = mat("Annex brick", (0.50, 0.33, 0.24))
BENCH = mat("Teak benches", (0.55, 0.42, 0.30))
SLATE = mat("Slate roof", (0.27, 0.28, 0.31))
GLASS = mat("Window glass", (0.10, 0.14, 0.19), 0.3)
FRAME = mat("White sash frames", (0.94, 0.93, 0.89))
DOOR = mat("Oak doors", (0.25, 0.14, 0.08))
LEAD = mat("Lead flat roof", (0.36, 0.37, 0.40))
GOLD = mat("Kharis gold", (0.95, 0.74, 0.25), 0.5)

PARTS = []
def B(x0, x1, y0, y1, z0, z1, m):
    bpy.ops.mesh.primitive_cube_add(size=1, location=((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2))
    o = bpy.context.object
    o.scale = (abs(x1 - x0), abs(y1 - y0), abs(z1 - z0))
    o.data.materials.append(m)
    PARTS.append(o)
    return o

def C(x, y, z0, z1, r, m, v=8):
    bpy.ops.mesh.primitive_cylinder_add(vertices=v, radius=r, depth=z1 - z0, location=(x, y, (z0 + z1) / 2))
    o = bpy.context.object; o.data.materials.append(m); PARTS.append(o); return o

def S(x, y, z, r, m):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=r, location=(x, y, z))
    o = bpy.context.object; o.data.materials.append(m); PARTS.append(o); return o

def urn(x, y, z):
    C(x, y, z, z + 0.18, 0.22, STONE, 8)
    C(x, y, z + 0.18, z + 0.45, 0.12, STONE, 8)
    S(x, y, z + 0.62, 0.24, STONE)
    C(x, y, z + 0.82, z + 1.0, 0.06, STONE, 6)

def balustrade(x0, x1, y, z, depth=0.35, height=0.95, pier_every=3.2, urns=True):
    B(x0, x1, y - depth / 2, y + depth / 2, z, z + 0.16, STONE)
    B(x0, x1, y - depth / 2 - 0.03, y + depth / 2 + 0.03, z + height - 0.14, z + height, STONE)
    n = max(2, int((x1 - x0) / 0.32))
    for i in range(n):
        x = x0 + (i + 0.5) * (x1 - x0) / n
        C(x, y, z + 0.16, z + height - 0.14, 0.075, STONE, 6)
    piers = max(1, int(round((x1 - x0) / pier_every)))
    for i in range(piers + 1):
        x = x0 + i * (x1 - x0) / piers
        B(x - 0.22, x + 0.22, y - depth / 2 - 0.05, y + depth / 2 + 0.05, z, z + height + 0.08, STONE)
        if urns:
            urn(x, y, z + height + 0.08)

def balustrade_y(x, y0, y1, z, height=0.95):
    B(x - 0.17, x + 0.17, y0, y1, z, z + 0.16, STONE)
    B(x - 0.2, x + 0.2, y0, y1, z + height - 0.14, z + height, STONE)
    n = max(2, int((y1 - y0) / 0.32))
    for i in range(n):
        C(x, y0 + (i + 0.5) * (y1 - y0) / n, z + 0.16, z + height - 0.14, 0.075, STONE, 6)

def sash(x, y, z, w, h, face=1, arched=False):
    """Window on a wall plane at y (face +1 front, -1 back)."""
    d = 0.12 * face
    B(x - w / 2 - 0.18, x + w / 2 + 0.18, y, y + d * 1.4, z - 0.22, z + h + 0.25, STONE)          # surround
    B(x - w / 2, x + w / 2, y + d * 1.4, y + d * 1.6, z, z + h, GLASS)
    B(x - 0.04, x + 0.04, y + d * 1.6, y + d * 1.9, z, z + h, FRAME)                               # mullion
    B(x - w / 2, x + w / 2, y + d * 1.6, y + d * 1.9, z + h * 0.5 - 0.04, z + h * 0.5 + 0.04, FRAME) # meeting rail
    B(x - w / 2 - 0.26, x + w / 2 + 0.26, y, y + d * 2.6, z - 0.32, z - 0.18, STONE)               # sill
    B(x - w / 2 - 0.26, x + w / 2 + 0.26, y, y + d * 2.4, z + h + 0.25, z + h + 0.45, STONE)       # hood
    if arched:
        B(x - 0.28, x + 0.28, y, y + d * 2.6, z + h + 0.45, z + h + 0.75, STONE)                    # keystone

def sash_x(x, y, z, w, h, face=1):
    d = 0.12 * face
    B(x, x + d * 1.4, y - w / 2 - 0.18, y + w / 2 + 0.18, z - 0.22, z + h + 0.25, STONE)
    B(x + d * 1.4, x + d * 1.6, y - w / 2, y + w / 2, z, z + h, GLASS)
    B(x + d * 1.6, x + d * 1.9, y - 0.04, y + 0.04, z, z + h, FRAME)
    B(x, x + d * 2.6, y - w / 2 - 0.26, y + w / 2 + 0.26, z - 0.32, z - 0.18, STONE)

# ── Main block ────────────────────────────────────────────────────────────
W, D = 30.0, 13.0           # x -15..15, y -6.5..6.5
X0, X1, Y0, Y1 = -W / 2, W / 2, -D / 2, D / 2
PLINTH, F1, F2, CORNICE = 0.9, 5.0, 9.6, 10.4
B(X0 - 0.3, X1 + 0.3, Y0 - 0.3, Y1 + 0.3, 0, PLINTH, STONE_D)
B(X0, X1, Y0, Y1, PLINTH, CORNICE, BRICK)
# String courses and cornice
for z in (F1 - 0.15, F2 - 0.1):
    B(X0 - 0.12, X1 + 0.12, Y0 - 0.12, Y1 + 0.12, z, z + 0.28, STONE)
B(X0 - 0.45, X1 + 0.45, Y0 - 0.45, Y1 + 0.45, CORNICE, CORNICE + 0.45, STONE)
B(X0 + 0.4, X1 - 0.4, Y0 + 0.4, Y1 - 0.4, CORNICE + 0.45, CORNICE + 0.6, LEAD)
# Hipped slate roof behind the parapet
# Flat lead roof behind the balustrade, as on the real building.

# Pilasters (rusticated quoins) dividing the front into 7 bays
bays = [-12.6, -8.4, -4.2, 0.0, 4.2, 8.4, 12.6]
edges = [X0] + [(bays[i] + bays[i + 1]) / 2 for i in range(len(bays) - 1)] + [X1]
for x in edges:
    B(x - 0.38, x + 0.38, Y1, Y1 + 0.22, PLINTH, CORNICE, STONE)
    for z in [PLINTH + 0.3 + k * 0.75 for k in range(12)]:
        B(x - 0.5, x + 0.5, Y1, Y1 + 0.3, z, z + 0.35, STONE)           # quoin blocks
    B(x - 0.38, x + 0.38, Y0 - 0.22, Y0, PLINTH, CORNICE, STONE)

# Front windows: ground floor tall sashes, first floor arched with balconettes
for i, x in enumerate(bays):
    if i == 3:
        continue
    sash(x - 0.85, Y1, PLINTH + 0.9, 1.1, 2.7)
    sash(x + 0.85, Y1, PLINTH + 0.9, 1.1, 2.7)
    sash(x - 0.85, Y1, F1 + 0.8, 1.1, 2.5, arched=True)
    sash(x + 0.85, Y1, F1 + 0.8, 1.1, 2.5, arched=True)
    balustrade(x - 2.0, x + 2.0, Y1 + 0.45, F1 + 0.1, depth=0.5, height=0.7, pier_every=4, urns=False)

# Canted ground-floor bay windows on bays 2 and 6
for x in (bays[1], bays[5]):
    B(x - 1.9, x + 1.9, Y1, Y1 + 1.4, PLINTH, F1 - 0.2, STONE)
    for dx in (-1.1, 0, 1.1):
        B(x + dx - 0.42, x + dx + 0.42, Y1 + 1.4, Y1 + 1.5, PLINTH + 0.8, F1 - 0.9, GLASS)
    B(x - 2.0, x + 2.0, Y1, Y1 + 1.55, F1 - 0.3, F1, STONE)

# Back windows (simpler)
for x in bays:
    sash(x, Y0, PLINTH + 0.9, 1.2, 2.6, face=-1)
    sash(x, Y0, F1 + 0.8, 1.2, 2.4, face=-1)
# Side windows
for y in (-3.2, 0, 3.2):
    sash_x(X1, y, PLINTH + 0.9, 1.1, 2.6, 1)
    sash_x(X1, y, F1 + 0.8, 1.1, 2.4, 1)
    sash_x(X0, y, PLINTH + 0.9, 1.1, 2.6, -1)
    sash_x(X0, y, F1 + 0.8, 1.1, 2.4, -1)

# Central entrance: porch with columns, glazed doors, balcony above, Kharis gold sign
x = 0
B(-2.6, 2.6, Y1, Y1 + 2.4, 0, PLINTH, STONE_D)
for step in range(4):
    B(-2.2, 2.2, Y1 + 2.4 + step * 0.4, Y1 + 2.8 + step * 0.4, 0, PLINTH - (step + 1) * 0.22, STONE)
for cx in (-2.1, -0.9, 0.9, 2.1):
    C(cx, Y1 + 2.1, PLINTH, F1 - 0.45, 0.24, STONE, 10)
B(-2.6, 2.6, Y1 - 0.1, Y1 + 2.5, F1 - 0.45, F1 + 0.05, STONE)
balustrade(-2.6, 2.6, Y1 + 2.25, F1 + 0.05, depth=0.4, height=0.8, pier_every=2.6)
B(-1.0, 1.0, Y1, Y1 + 0.12, PLINTH, PLINTH + 3.0, DOOR)
B(-1.1, 1.1, Y1, Y1 + 0.16, PLINTH + 3.0, PLINTH + 3.15, STONE)
B(-0.95, 0.95, Y1 + 0.12, Y1 + 0.16, PLINTH + 3.15, PLINTH + 3.75, GLASS)
sash(0, Y1, F1 + 0.8, 1.6, 2.6, arched=True)
B(-1.9, 1.9, Y1 + 0.25, Y1 + 0.32, F2 + 0.2, F2 + 0.65, GOLD)                                    # "KHARIS" fascia

# Roof balustrade around the whole parapet, urns on piers
balustrade(X0 - 0.3, X1 + 0.3, Y1 + 0.2, CORNICE + 0.45, depth=0.35, height=1.0, pier_every=4.2)
balustrade(X0 - 0.3, X1 + 0.3, Y0 - 0.2, CORNICE + 0.45, depth=0.35, height=1.0, pier_every=4.2)
balustrade_y(X0 - 0.2, Y0, Y1, CORNICE + 0.45)
balustrade_y(X1 + 0.2, Y0, Y1, CORNICE + 0.45)

# Two small pediments rising above the parapet (left and right bays), urn finials
for px in (-9.6, 8.4):
    B(px - 2.1, px + 2.1, Y1 - 0.3, Y1 + 0.3, CORNICE + 0.45, CORNICE + 1.75, STONE)
    bpy.ops.mesh.primitive_cone_add(vertices=3, radius1=2.4, depth=0.6, location=(px, Y1, CORNICE + 2.05), rotation=(math.pi / 2, 0, 0))
    ped = bpy.context.object; ped.scale = (1, 0.42, 1); ped.data.materials.append(STONE); PARTS.append(ped)
    urn(px, Y1, CORNICE + 2.55)

# Tall stone chimney stacks with urn caps
for cx, cy in [(-13.2, -1.0), (-5.8, -3.5), (5.6, -3.5), (12.6, 1.8), (13.8, -2.5)]:
    B(cx - 0.55, cx + 0.55, cy - 0.45, cy + 0.45, CORNICE, CORNICE + 4.4, STONE)
    B(cx - 0.7, cx + 0.7, cy - 0.6, cy + 0.6, CORNICE + 4.4, CORNICE + 4.7, STONE)
    urn(cx, cy, CORNICE + 4.7)

# Right-end canted bay through both floors, with a first-floor balcony
# (model -x becomes the viewer's right once the game turns the building to face the lawn)
B(X0 + 0.4, X0 + 4.0, Y1, Y1 + 1.5, PLINTH, F2 - 0.1, STONE)
for dx in (1.3, 2.2, 3.1):
    B(X0 + dx - 0.35, X0 + dx + 0.35, Y1 + 1.5, Y1 + 1.6, PLINTH + 0.8, F1 - 0.6, GLASS)
    B(X0 + dx - 0.3, X0 + dx + 0.3, Y1 + 1.5, Y1 + 1.6, F1 + 0.8, F2 - 0.8, GLASS)
balustrade(X0 + 0.2, X0 + 4.2, Y1 + 1.8, F1 + 0.05, depth=0.4, height=0.8, pier_every=2.0)

# ── Belvedere tower (left of centre, as in the photographs) ───────────────
_tower_start = len(PARTS)
T0, T1 = CORNICE + 0.45, CORNICE + 5.2
B(-3.0, 3.0, -2.6, 2.6, T0, T1, BRICK)
for tx in (-3.0, 3.0):
    for ty in (-2.6, 2.6):
        B(tx - 0.35, tx + 0.35, ty - 0.35, ty + 0.35, T0, T1, STONE)
for dx in (-1.6, 0, 1.6):
    sash(dx, 2.6, T0 + 1.0, 0.8, 2.4, arched=True)
    sash(dx, -2.6, T0 + 1.0, 0.8, 2.4, face=-1, arched=True)
for dy in (-1.0, 1.0):
    sash_x(3.0, dy, T0 + 1.0, 0.8, 2.4, 1)
    sash_x(-3.0, dy, T0 + 1.0, 0.8, 2.4, -1)
B(-3.45, 3.45, -3.05, 3.05, T1, T1 + 0.4, STONE)
B(-3.2, 3.2, -2.8, 2.8, T1 + 0.4, T1 + 0.5, LEAD)
balustrade(-3.3, 3.3, 2.85, T1 + 0.4, depth=0.3, height=0.85, pier_every=3.3)
balustrade(-3.3, 3.3, -2.85, T1 + 0.4, depth=0.3, height=0.85, pier_every=3.3)
balustrade_y(-3.3, -2.85, 2.85, T1 + 0.4, 0.85)
balustrade_y(3.3, -2.85, 2.85, T1 + 0.4, 0.85)
C(0, 0, T1 + 0.5, T1 + 1.2, 0.08, GOLD, 6)                                                         # cross upright
B(-0.32, 0.32, -0.05, 0.05, T1 + 0.9, T1 + 1.0, GOLD)                                            # cross bar

for _o in PARTS[_tower_start:]:
    _o.location.x += 3.0  # game rotates 180°, so +x reads as left of centre


# Later brick annex to the right, linked by a low glazed corridor
AX0, AX1, AY0, AY1 = X0 - 11.0, X0 - 3.0, Y0 - 1.0, Y1 - 2.5
B(AX1, AX1 + 3.0, AY0 + 3.0, AY1 - 3.0, 0, 3.2, GLASS)
B(AX1, AX1 + 3.0, AY0 + 2.8, AY1 - 2.8, 3.2, 3.5, STONE)
B(AX0, AX1, AY0, AY1, 0, 8.4, ANNEX)
for z in (PLINTH - 0.2, 4.4, 8.4):
    B(AX0 - 0.1, AX1 + 0.1, AY0 - 0.1, AY1 + 0.1, z, z + 0.3, STONE)
for wx in (AX0 + 1.4, AX0 + 4.0, AX0 + 6.6):
    sash(wx, AY1, 1.2, 1.1, 2.2)
    sash(wx, AY1, 5.2, 1.1, 2.0)
bpy.ops.mesh.primitive_cone_add(vertices=3, radius1=2.0, depth=0.5, location=((AX0 + AX1) / 2, AY1, 9.2), rotation=(math.pi / 2, 0, 0))
ap = bpy.context.object; ap.scale = (1, 0.4, 1); ap.data.materials.append(STONE); PARTS.append(ap)

# ── Front terrace with balustrade and urn piers ───────────────────────────
TY = Y1 + 4.5
B(X0 - 1.5, X1 + 1.5, Y1, TY, 0, 0.35, STONE_D)
balustrade(X0 - 1.5, -2.8, TY, 0.35, depth=0.45, height=1.0, pier_every=3.6)
balustrade(2.8, X1 + 1.5, TY, 0.35, depth=0.45, height=1.0, pier_every=3.6)
for x in (-2.8, 2.8):
    B(x - 0.4, x + 0.4, TY - 0.4, TY + 0.4, 0.35, 1.7, STONE)
    urn(x, TY, 1.7)

# ── Join by material to keep draw calls low ───────────────────────────────
for p in PARTS:
    for poly in p.data.polygons:
        poly.use_smooth = False
by_mat = {}
for p in PARTS:
    by_mat.setdefault(p.data.materials[0].name, []).append(p)
for name, objs in by_mat.items():
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    bpy.context.object.name = f"Spurgeons · {name}"
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)

blend = REPO / "world-runtime/art-sources/spurgeons-college.blend"
glb = REPO / "public/world3d/spurgeons-college.glb"
bpy.ops.wm.save_as_mainfile(filepath=str(blend))
bpy.ops.export_scene.gltf(filepath=str(glb), export_format="GLB", export_yup=True, export_apply=True)
import mathutils
pts = [o.matrix_world @ mathutils.Vector(c) for o in bpy.data.objects if o.type == "MESH" for c in o.bound_box]
print("exported", glb, glb.stat().st_size, "bbox x", min(p.x for p in pts), max(p.x for p in pts), "y", min(p.y for p in pts), max(p.y for p in pts), "z", max(p.z for p in pts))
