"""Kairos World: the player's house on London Square.

A two-storey London terrace-style house in the low-poly world style: brick
walls, white sash windows, a coloured front door with steps and a porch light,
a slate roof with a chimney, and a small front garden with a fence, hedge and
bins. The front faces +Y (north in the world, towards the road).

Run inside Blender:  exec(compile(open(p).read(), p, "exec"))
Exports public/world3d/player-house.glb next to the repo.
"""
import bpy, bmesh, math, os
from mathutils import Vector

REPO = os.environ.get("KAIROS_REPO", r"C:\Users\johnd\Documents\GitHub\KairosHub")
OUT = os.path.join(REPO, "public", "world3d", "player-house.glb")
BLEND = os.path.join(REPO, "world-runtime", "art-sources", "player-house.blend")

for o in list(bpy.data.objects):
    if o.get("kairos_house"):
        bpy.data.objects.remove(o, do_unlink=True)
col = bpy.data.collections.get("PlayerHouse") or bpy.data.collections.new("PlayerHouse")
if col.name not in bpy.context.scene.collection.children:
    bpy.context.scene.collection.children.link(col)

mats = {}
def mat(name, rgb, rough=0.85, metal=0.0, emit=None):
    key = name
    if key in mats:
        return mats[key]
    m = bpy.data.materials.get("house_" + name) or bpy.data.materials.new("house_" + name)
    m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value = (*rgb, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if emit:
        b.inputs["Emission Color"].default_value = (*emit, 1)
        b.inputs["Emission Strength"].default_value = 2.0
    mats[key] = m
    return m

def hexrgb(h):
    h = h.lstrip("#")
    return tuple((int(h[i:i + 2], 16) / 255) ** 2.2 for i in (0, 2, 4))

BRICK = mat("brick", hexrgb("#a4553f"))
BRICK_D = mat("brick_dark", hexrgb("#7e3d2e"))
WHITE = mat("white", hexrgb("#f1ece2"))
SLATE = mat("slate", hexrgb("#3e4552"), 0.7)
DOOR = mat("door", hexrgb("#1f4fbf"), 0.5)
GLASS = mat("glass", hexrgb("#8fb8cc"), 0.15, 0.1)
STONE = mat("stone", hexrgb("#c9c0ae"))
HEDGE = mat("hedge", hexrgb("#4f7d43"))
GRASS = mat("grass", hexrgb("#8fbf6a"))
WOOD = mat("wood", hexrgb("#e9dfc7"))
BIN = mat("bin", hexrgb("#2f4f3a"))
GOLD = mat("brass", hexrgb("#d8b45a"), 0.35, 0.6)
LAMP = mat("lamp", hexrgb("#fff1c9"), 0.3, 0, emit=hexrgb("#ffd27a"))

def box(name, m, x0, y0, z0, x1, y1, z1):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1)
    for v in bm.verts:
        v.co = Vector(((x0 + x1) / 2 + v.co.x * (x1 - x0), (y0 + y1) / 2 + v.co.y * (y1 - y0), (z0 + z1) / 2 + v.co.z * (z1 - z0)))
    bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me)
    o.data.materials.append(m)
    o["kairos_house"] = True
    col.objects.link(o)
    return o

def prism_roof(name, m, x0, x1, y0, y1, z0, ridge):
    """Gabled roof running along x, ridge over the middle of y."""
    me = bpy.data.meshes.new(name)
    ym = (y0 + y1) / 2
    verts = [(x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0), (x0, ym, ridge), (x1, ym, ridge)]
    faces = [(0, 1, 5, 4), (2, 3, 4, 5), (0, 4, 3), (1, 2, 5), (0, 3, 2, 1)]
    me.from_pydata(verts, [], faces)
    o = bpy.data.objects.new(name, me)
    o.data.materials.append(m)
    o["kairos_house"] = True
    col.objects.link(o)
    return o

W, D, H = 7.0, 4.6, 5.2   # house body (x width, y depth, z height)
x0, x1 = -W / 2, W / 2
yf, yb = 0.6, 0.6 - D    # front face at y=0.6 (garden in front, +y)
# Walls with a darker brick plinth and a band between floors.
box("walls", BRICK, x0, yb, 0, x1, yf, H)
box("plinth", BRICK_D, x0 - 0.04, yb - 0.04, 0, x1 + 0.04, yf + 0.04, 0.45)
box("band", WHITE, x0 - 0.05, yb - 0.05, 2.55, x1 + 0.05, yf + 0.05, 2.7)
# Roof, ridge and chimney.
r = prism_roof("roof", SLATE, x0 - 0.3, x1 + 0.3, yb - 0.35, yf + 0.35, H, H + 2.1)
box("ridge", BRICK_D, x0 - 0.3, -1.75, H + 2.05, x1 + 0.3, -1.25, H + 2.2)
box("chimney", BRICK_D, x1 - 1.4, -2.6, H + 0.6, x1 - 0.6, -1.9, H + 3.0)
box("chimney_cap", STONE, x1 - 1.5, -2.7, H + 3.0, x1 - 0.5, -1.8, H + 3.15)
# Front door with steps, fanlight, knocker and porch light.
box("door_frame", WHITE, -0.75, yf - 0.02, 0.35, 0.75, yf + 0.08, 2.45)
box("door", DOOR, -0.55, yf, 0.45, 0.55, yf + 0.1, 2.25)
box("fanlight", GLASS, -0.5, yf + 0.06, 2.27, 0.5, yf + 0.1, 2.42)
box("knocker", GOLD, -0.08, yf + 0.1, 1.55, 0.08, yf + 0.16, 1.7)
box("step1", STONE, -0.95, yf, 0, 0.95, yf + 0.7, 0.18)
box("step2", STONE, -0.85, yf, 0.18, 0.85, yf + 0.4, 0.35)
box("lamp", LAMP, 0.9, yf + 0.05, 2.1, 1.1, yf + 0.25, 2.4)
box("number", GOLD, -0.2, yf + 0.1, 1.95, 0.2, yf + 0.13, 2.1)
# Sash windows, ground and first floor, front and back.
def window(name, cx, z, y, out):
    box(name + "_frame", WHITE, cx - 0.65, y - 0.02 * out, z - 0.05, cx + 0.65, y + 0.1 * out, z + 1.45)
    box(name + "_glass", GLASS, cx - 0.52, y + 0.05 * out, z + 0.08, cx + 0.52, y + 0.12 * out, z + 1.32)
    box(name + "_bar", WHITE, cx - 0.52, y + 0.11 * out, z + 0.66, cx + 0.52, y + 0.15 * out, z + 0.74)
    box(name + "_sill", STONE, cx - 0.75, y, z - 0.15, cx + 0.75, y + 0.25 * out, z - 0.02)
for i, cx in enumerate((-2.2, 2.2)):
    window(f"win_g{i}", cx, 0.85, yf, 1)
for i, cx in enumerate((-2.2, 0, 2.2)):
    window(f"win_f{i}", cx, 3.1, yf, 1)
for i, cx in enumerate((-2.2, 2.2)):
    window(f"win_b{i}", cx, 3.1, yb, -1)
# Front garden: lawn, path, low brick wall with gate, hedge, bins.
box("lawn", GRASS, x0, yf, 0, x1, yf + 2.2, 0.06)
box("path", STONE, -0.6, yf, 0, 0.6, yf + 2.3, 0.08)
box("wall_l", BRICK_D, x0, yf + 2.2, 0, -0.75, yf + 2.45, 0.7)
box("wall_r", BRICK_D, 0.75, yf + 2.2, 0, x1, yf + 2.45, 0.7)
box("cap_l", STONE, x0 - 0.03, yf + 2.17, 0.7, -0.72, yf + 2.48, 0.78)
box("cap_r", STONE, 0.72, yf + 2.17, 0.7, x1 + 0.03, yf + 2.48, 0.78)
for gx in (-0.7, 0.7):
    box(f"gatepost{gx}", BRICK_D, gx - 0.12, yf + 2.15, 0, gx + 0.12, yf + 2.5, 1.0)
box("hedge_l", HEDGE, x0 + 0.2, yf + 1.5, 0, -1.3, yf + 2.1, 0.9)
for i, bx in enumerate((2.0, 2.7)):
    box(f"bin{i}", BIN, bx - 0.28, yf + 1.4, 0, bx + 0.28, yf + 1.95, 1.0)
    box(f"bin_lid{i}", BIN, bx - 0.3, yf + 1.38, 1.0, bx + 0.3, yf + 1.97, 1.08)

for o in col.objects:
    o.select_set(False)
for o in col.objects:
    o.select_set(True)
bpy.context.view_layer.objects.active = col.objects[0]
os.makedirs(os.path.dirname(OUT), exist_ok=True)
bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", use_selection=True, export_apply=True)
try:
    bpy.ops.wm.save_as_mainfile(filepath=BLEND, copy=True)
except Exception as e:
    print("save blend skipped", e)
print("exported", OUT, len(col.objects), "parts")
