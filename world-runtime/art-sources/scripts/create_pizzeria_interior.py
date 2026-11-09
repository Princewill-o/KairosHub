"""Pizzazz Pizza restaurant interior (London) — low-poly, built with bmesh.

Checkerboard floor, exposed-brick back wall with a domed wood-fired oven,
a long service counter with a pizza display, chalk menu boards, red booths on
both side walls, café tables with chairs, pendant lights, a till counter and a
drinks fridge. Units = game tiles: x 0..26, Blender y 0..-20 (game z).
The south wall is low so the game camera can see in. No ceiling.
Writes public/world3d/pizzazz-interior.glb.
"""
from pathlib import Path
import math
import bpy, bmesh

REPO = Path(r"C:\Users\johnd\Documents\GitHub\KairosHub")
COLS, ROWS, HEIGHT = 26, 20, 4.2
for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)

MATS, MESHES = {}, {}
def mat(name, rgb, emit=0.0):
    if name not in MATS:
        m = bpy.data.materials.new(name); m.use_nodes = True
        b = m.node_tree.nodes["Principled BSDF"]
        b.inputs["Base Color"].default_value = (*rgb, 1)
        b.inputs["Roughness"].default_value = 0.8
        if emit:
            b.inputs["Emission Color"].default_value = (*rgb, 1)
            b.inputs["Emission Strength"].default_value = emit
        MATS[name] = m; MESHES[name] = bmesh.new()
    return name

def box(m, x0, x1, y0, y1, z0, z1):
    bm = MESHES[m]
    vs = [bm.verts.new((x, -y, z)) for x in (x0, x1) for y in (y0, y1) for z in (z0, z1)]
    for f in [(0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)]:
        bm.faces.new([vs[i] for i in f])

def cyl(m, x, y, z0, z1, r, n=10):
    bm = MESHES[m]
    top = [bm.verts.new((x + r * math.cos(a), -(y + r * math.sin(a)), z1)) for a in [i * math.tau / n for i in range(n)]]
    bot = [bm.verts.new((v.co.x, v.co.y, z0)) for v in top]
    bm.faces.new(top); bm.faces.new(list(reversed(bot)))
    for i in range(n):
        j = (i + 1) % n; bm.faces.new((bot[i], bot[j], top[j], top[i]))

def dome(m, x, y, z, r, n=10, rings=4):
    bm = MESHES[m]
    pts = []
    for k in range(rings + 1):
        phi = (math.pi / 2) * k / rings
        rr, zz = r * math.cos(phi), z + r * math.sin(phi)
        pts.append([bm.verts.new((x + rr * math.cos(a), -(y + rr * math.sin(a)), zz)) for a in [i * math.tau / n for i in range(n)]])
    for k in range(rings):
        for i in range(n):
            j = (i + 1) % n
            try: bm.faces.new((pts[k][i], pts[k][j], pts[k + 1][j], pts[k + 1][i]))
            except ValueError: pass

WHITE = mat("White tile", (0.95, 0.94, 0.90))
BLACKT = mat("Black tile", (0.10, 0.10, 0.12))
BRICK = mat("Red brick", (0.62, 0.26, 0.18))
MORTAR = mat("Brick mortar", (0.82, 0.76, 0.68))
CREAM = mat("Cream wall", (0.98, 0.91, 0.76))
WOOD = mat("Walnut", (0.42, 0.24, 0.12))
STEEL = mat("Stainless", (0.72, 0.74, 0.78))
RED = mat("Booth red", (0.78, 0.13, 0.12))
GREEN = mat("Basil green", (0.20, 0.50, 0.25))
CHALK = mat("Chalkboard", (0.12, 0.14, 0.13))
CHALKW = mat("Chalk", (0.92, 0.92, 0.88))
FIRE = mat("Oven fire", (1.0, 0.55, 0.15), emit=4)
LAMP = mat("Pendant glow", (1.0, 0.86, 0.6), emit=3)
GLASS = mat("Fridge glow", (0.75, 0.9, 1.0), emit=1.2)
CLOTH = mat("Red check cloth", (0.85, 0.20, 0.18))
PIZZA = mat("Pizza", (0.95, 0.72, 0.30))
TOM = mat("Tomato", (0.80, 0.18, 0.10))
BLACK = mat("Black metal", (0.08, 0.08, 0.09))
BOTTLES = [mat(f"Bottle {i}", c) for i, c in enumerate([(0.9, 0.2, 0.2), (0.2, 0.6, 0.9), (0.95, 0.7, 0.1), (0.3, 0.75, 0.3)])]

# Floor: black and white checkerboard (0.5 tiles)
for i in range(COLS * 2):
    for j in range(ROWS * 2):
        box(WHITE if (i + j) % 2 else BLACKT, i * 0.5, i * 0.5 + 0.5, j * 0.5, j * 0.5 + 0.5, -0.05, 0)
T = 0.3
# Walls: brick back wall, cream sides with white tile wainscot, low south wall
box(BRICK, -T, COLS + T, -T, 0, 0, HEIGHT)
for row in range(1, int(HEIGHT / 0.3)):
    box(MORTAR, -T, COLS + T, -0.02, 0.0, row * 0.3, row * 0.3 + 0.03)
for x0, x1 in ((-T, 0), (COLS, COLS + T)):
    box(CREAM, x0, x1, 0, ROWS, 0, HEIGHT)
    box(WHITE, x0 - 0.02 if x0 < 0 else x0, x1 + 0.02 if x1 > COLS else x1, 0, ROWS, 0, 1.3)
    box(GREEN, x0 - 0.03 if x0 < 0 else x0, x1 + 0.03 if x1 > COLS else x1, 0, ROWS, 1.3, 1.4)
box(CREAM, -T, COLS + T, ROWS, ROWS + T, 0, 0.45)
box(GREEN, -T, COLS + T, ROWS - 0.05, ROWS, 0.45, 0.55)

# Wood-fired oven: brick base, dome, glowing mouth, flue
OX, OY = 13.0, 2.2
box(BRICK, OX - 2.0, OX + 2.0, OY - 1.6, OY + 1.2, 0, 1.0)
dome(BRICK, OX, OY - 0.2, 1.0, 1.7)
box(BLACK, OX - 0.7, OX + 0.7, OY + 1.2, OY + 1.3, 1.05, 1.75)
box(FIRE, OX - 0.55, OX + 0.55, OY + 1.25, OY + 1.32, 1.1, 1.6)
cyl(STEEL, OX, OY - 0.4, 2.6, HEIGHT, 0.25)
# Back prep counters and shelves of bottles either side of the oven
for x0, x1 in ((1.0, 10.2), (15.8, 25.0)):
    box(STEEL, x0, x1, 0.2, 1.2, 0, 0.95)
    box(WOOD, x0, x1, 0.05, 0.4, 1.9, 1.98)
    for i in range(int((x1 - x0) / 0.35)):
        bx = x0 + 0.1 + i * 0.35
        cyl(BOTTLES[i % 4], bx, 0.22, 1.98, 2.3, 0.07, 6)
# Chalk menu boards above the counters
for cx in (5.6, 20.4):
    box(WOOD, cx - 3.0, cx + 3.0, 0.0, 0.08, 2.5, 3.9)
    box(CHALK, cx - 2.85, cx + 2.85, 0.08, 0.1, 2.6, 3.8)
    for k in range(6):
        box(CHALKW, cx - 2.5, cx - 0.4 - (k % 3) * 0.3, 0.1, 0.12, 3.45 - k * 0.17, 3.5 - k * 0.17)
        box(CHALKW, cx + 1.4, cx + 2.4, 0.1, 0.12, 3.45 - k * 0.17, 3.5 - k * 0.17)
# Service counter (game row 5) with glass pizza display
box(WOOD, 3.0, 23.0, 5.0, 6.0, 0, 1.05)
box(STEEL, 2.9, 23.1, 4.9, 6.1, 1.05, 1.12)
for px in (5.0, 8.0, 12.0, 16.0, 20.0):
    cyl(PIZZA, px, 5.4, 1.12, 1.16, 0.42, 12)
    for a in range(5):
        cyl(TOM, px + 0.22 * math.cos(a * 1.3), 5.4 + 0.22 * math.sin(a * 1.3), 1.16, 1.18, 0.06, 6)
box(GLASS, 3.0, 23.0, 5.95, 6.0, 1.12, 1.45)
# Till counter at the front left (reception) and a drinks fridge
box(WOOD, 3.0, 8.0, 14.0, 15.0, 0, 1.05)
box(STEEL, 2.9, 8.1, 13.9, 15.1, 1.05, 1.1)
box(BLACK, 5.0, 5.6, 14.3, 14.6, 1.1, 1.45)
box(STEEL, 0.1, 1.0, 3.0, 4.6, 0, 2.2)
box(GLASS, 1.0, 1.03, 3.1, 4.5, 0.1, 2.1)

# Red booths on the side walls
for y in (8.0, 10.6, 13.2):
    for x0, x1 in ((0.0, 2.2), (23.8, 26.0)):
        box(RED, x0, x1, y, y + 0.5, 0, 1.2)            # back rest
        box(RED, x0, x1, y + 0.5, y + 1.0, 0, 0.5)      # seat
        box(RED, x0, x1, y + 1.9, y + 2.4, 0, 0.5)
        box(RED, x0, x1, y + 2.4, y + 2.6, 0, 1.2)
        tx = (x0 + x1) / 2
        box(WOOD, tx - 0.7, tx + 0.7, y + 1.05, y + 1.85, 0.72, 0.78)
        box(BLACK, tx - 0.06, tx + 0.06, y + 1.4, y + 1.5, 0, 0.72)

# Café tables with red check cloths and two chairs each
def chair(x, y, face):
    box(WOOD, x - 0.25, x + 0.25, y - 0.25, y + 0.25, 0.42, 0.47)
    for dx in (-0.2, 0.17):
        for dy in (-0.2, 0.17):
            box(BLACK, x + dx, x + dx + 0.04, y + dy, y + dy + 0.04, 0, 0.42)
    by = y - 0.25 if face > 0 else y + 0.21
    box(WOOD, x - 0.25, x + 0.25, by, by + 0.04, 0.47, 0.95)
for tx in (6.5, 10.5, 15.5, 19.5):
    for ty in (9.5, 12.5):
        cyl(BLACK, tx, ty, 0, 0.72, 0.06, 6)
        cyl(CLOTH, tx, ty, 0.72, 0.78, 0.55, 10)
        cyl(PIZZA, tx, ty, 0.78, 0.81, 0.25, 10)
        chair(tx - 0.95, ty, 1)
        chair(tx + 0.95, ty, -1)
# Waiting bench (east, front) and plants
box(WOOD, 18.0, 23.0, 14.0, 14.8, 0, 0.45)
box(WOOD, 18.0, 23.0, 14.7, 14.9, 0.45, 1.0)
for x, y in ((2.4, 2.4), (23.6, 2.4), (23.5, 11.3)):
    cyl(WOOD, x, y, 0, 0.5, 0.3, 8)
    for k in range(5):
        cyl(GREEN, x + 0.15 * math.cos(k), y + 0.15 * math.sin(k), 0.5, 1.2 + (k % 3) * 0.15, 0.12, 5)
# Pendant lights over tables and counter
for x in (6.5, 10.5, 15.5, 19.5):
    for y in (9.5, 12.5, 5.5):
        cyl(BLACK, x, y, 2.7, HEIGHT, 0.015, 4)
        cyl(BLACK, x, y, 2.45, 2.7, 0.28, 8)
        cyl(LAMP, x, y, 2.4, 2.46, 0.22, 8)

for name, bm in MESHES.items():
    if not bm.faces: continue
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    me.materials.append(MATS[name])
    bpy.context.collection.objects.link(bpy.data.objects.new(f"Pizzazz · {name}", me))

blend = REPO / "world-runtime/art-sources/pizzazz-interior.blend"
glb = REPO / "public/world3d/pizzazz-interior.glb"
bpy.ops.wm.save_as_mainfile(filepath=str(blend))
bpy.ops.export_scene.gltf(filepath=str(glb), export_format="GLB", export_yup=True)
print("exported", glb, glb.stat().st_size)
