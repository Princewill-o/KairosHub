"""LTBS story portal (low-poly): a faceted dark-stone gate with purple crystal accents.

Original design for Kairos World. The game fills the opening with an animated purple
swirl, glow and drifting particles, and hangs a name tag above it.
Metres = tiles, ground z = 0, origin at the centre of the opening, front faces +Y.
Opening 2.0 wide x 2.7 tall; outer frame 3.1 x 3.4. Writes public/world3d/story-portal.glb
"""
from pathlib import Path
import math, random
import bpy, bmesh

REPO = Path(r"C:\Users\johnd\Documents\GitHub\KairosHub")
random.seed(7)
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
MATS, MESHES = {}, {}
def mat(key, rgb, emit=0.0):
    if key not in MATS:
        m = bpy.data.materials.new(f"portal-{key}"); m.use_nodes = True
        b = m.node_tree.nodes["Principled BSDF"]
        b.inputs["Base Color"].default_value = (*rgb, 1); b.inputs["Roughness"].default_value = 0.8
        if emit:
            b.inputs["Emission Color"].default_value = (*rgb, 1); b.inputs["Emission Strength"].default_value = emit
        MATS[key] = m; MESHES[key] = bmesh.new()
    return key
def stone(k, cx, cy, cz, sx, sy, sz, wob=0.06):
    """A slightly irregular block: each corner nudged so the gate reads hand-built."""
    bm = MESHES[k]
    vs = []
    for dx in (-1, 1):
        for dy in (-1, 1):
            for dz in (-1, 1):
                vs.append(bm.verts.new((cx + dx * sx / 2 + random.uniform(-wob, wob), cy + dy * sy / 2 + random.uniform(-wob, wob) * 0.5, cz + dz * sz / 2 + random.uniform(-wob, wob))))
    for f in [(0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)]:
        bm.faces.new([vs[i] for i in f])
def crystal(k, x, y, z, h, r):
    bm = MESHES[k]
    n = 5
    ring = [bm.verts.new((x + r * math.cos(a), y + r * math.sin(a), z + h * 0.35)) for a in [i * math.tau / n + 0.3 for i in range(n)]]
    tip = bm.verts.new((x, y, z + h)); base = bm.verts.new((x, y, z))
    for i in range(n):
        bm.faces.new((ring[i], ring[(i + 1) % n], tip)); bm.faces.new((ring[(i + 1) % n], ring[i], base))

S1 = mat("stone", (0.14, 0.10, 0.20)); S2 = mat("stone-light", (0.24, 0.18, 0.33)); C = mat("crystal", (0.62, 0.32, 0.95), emit=2.5)
G = mat("gold", (0.96, 0.72, 0.24)); B = mat("base", (0.32, 0.30, 0.36))
W, H, T = 2.0, 2.7, 0.55          # opening width/height, frame thickness
stone(B, 0, 0, 0.08, W + 2 * T + 0.6, 1.1, 0.16, 0.02)                              # base step
for side in (-1, 1):                                                               # pillars of stacked stones
    x = side * (W / 2 + T / 2)
    z = 0.16
    i = 0
    while z < H + 0.16:
        h = min(0.5 + random.uniform(-0.08, 0.1), H + 0.16 - z)
        stone(S1 if i % 2 else S2, x, 0, z + h / 2, T + random.uniform(-0.04, 0.06), 0.62, h)
        z += h; i += 1
for i, x in enumerate([-1.3, -0.65, 0, 0.65, 1.3]):                                  # lintel
    stone(S2 if i % 2 else S1, x, 0, H + 0.16 + T / 2, 0.68, 0.66, T)
stone(G, 0, 0.33, H + 0.16 + T / 2, 0.9, 0.06, 0.22, 0.01)                          # gold name plate (text in game)
for x, h in [(-1.5, 0.55), (-1.25, 0.35), (1.35, 0.6), (1.55, 0.32)]:               # crystals on the lintel
    crystal(C, x, 0, H + 0.16 + T, h, 0.12)
for side in (-1, 1):
    crystal(C, side * (W / 2 + T + 0.25), 0.25, 0.16, 0.45, 0.1)                    # crystals at the feet
root = bpy.data.objects.new("story-portal", None); bpy.context.collection.objects.link(root)
for k, bm in MESHES.items():
    me = bpy.data.meshes.new(f"portal-{k}"); bm.to_mesh(me); bm.free()
    for p in me.polygons: p.use_smooth = False
    ob = bpy.data.objects.new(f"portal-{k}", me); ob.data.materials.append(MATS[k])
    bpy.context.collection.objects.link(ob); ob.parent = root
path = REPO / "public" / "world3d" / "story-portal.glb"
bpy.ops.object.select_all(action="DESELECT")
bpy.ops.export_scene.gltf(filepath=str(path), export_format="GLB", export_yup=True)
print(path)
