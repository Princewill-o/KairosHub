"""Stylised low-poly forest kit for Kharis Forest (Norwood), after the owner's references:
tiered paper-fold pines, tall red-trunk pines with drooping branch layers, round
faceted broadleaf trees, grey faceted boulders, bushes, sunflowers/daffodils/
lavender, purple mushrooms, ferns and fallen logs. Bright greens, flat shading.

Each asset is exported to public/world3d/forest/<name>.glb, origin at the base
centre, roughly 1 unit = 1 tile. Built with bmesh (fast)."""
from pathlib import Path
import math, random
import bpy, bmesh
from mathutils import Vector, Matrix

REPO = Path(r"C:\Users\johnd\Documents\GitHub\KairosHub")
OUT = REPO / "public/world3d/forest"
OUT.mkdir(parents=True, exist_ok=True)
random.seed(11)

def material(name, rgb):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*rgb, 1); b.inputs["Roughness"].default_value = 0.9
    return m

PAL = {
    "leaf1": (0.30, 0.62, 0.16), "leaf2": (0.40, 0.74, 0.20), "leaf3": (0.22, 0.50, 0.14),
    "leaf4": (0.52, 0.82, 0.26), "bark": (0.45, 0.24, 0.14), "barkred": (0.48, 0.18, 0.12),
    "rock": (0.66, 0.67, 0.70), "rockd": (0.52, 0.53, 0.57), "moss": (0.45, 0.72, 0.22),
    "sun": (0.98, 0.78, 0.10), "sunc": (0.36, 0.20, 0.08), "daff": (1.0, 0.86, 0.25),
    "lav": (0.45, 0.32, 0.78), "mush": (0.62, 0.36, 0.82), "mushd": (0.42, 0.22, 0.62),
    "stem": (0.92, 0.86, 0.74), "stalk": (0.22, 0.48, 0.14),
}

class Asset:
    def __init__(self, name):
        self.name = name; self.parts = {}
    def bm(self, key):
        if key not in self.parts: self.parts[key] = bmesh.new()
        return self.parts[key]
    def cone(self, key, x, y, z, r0, r1, h, n=7, rot=0.0, tilt=(0, 0)):
        bm = self.bm(key)
        m = Matrix.Translation((x, y, z)) @ Matrix.Rotation(tilt[0], 4, "X") @ Matrix.Rotation(tilt[1], 4, "Y")
        bot = [bm.verts.new(m @ Vector((r0 * math.cos(rot + a), r0 * math.sin(rot + a), 0))) for a in [i * math.tau / n for i in range(n)]]
        if r1 <= 0.001:
            tip = bm.verts.new(m @ Vector((0, 0, h)))
            for i in range(n): bm.faces.new((bot[i], bot[(i + 1) % n], tip))
        else:
            top = [bm.verts.new(m @ Vector((r1 * math.cos(rot + a), r1 * math.sin(rot + a), h))) for a in [i * math.tau / n for i in range(n)]]
            for i in range(n): bm.faces.new((bot[i], bot[(i + 1) % n], top[(i + 1) % n], top[i]))
            bm.faces.new(top)
        bm.faces.new(list(reversed(bot)))
    def blob(self, key, x, y, z, r, sx=1, sy=1, sz=1, sub=1, jitter=0.18):
        bm = self.bm(key)
        ret = bmesh.ops.create_icosphere(bm, subdivisions=sub, radius=r)
        for v in ret["verts"]:
            j = 1 + (random.random() - 0.5) * jitter * 2
            v.co = Vector((x + v.co.x * sx * j, y + v.co.y * sy * j, z + v.co.z * sz * j))
    def star_layer(self, key, x, y, z, r, droop, points=7, rot=0.0):
        """Drooping star-shaped branch layer (paper-fold pine)."""
        bm = self.bm(key)
        top = bm.verts.new((x, y, z + 0.18))
        ring = []
        for i in range(points * 2):
            a = rot + i * math.pi / points
            rr = r if i % 2 == 0 else r * 0.55
            ring.append(bm.verts.new((x + rr * math.cos(a), y + rr * math.sin(a), z - (droop if i % 2 == 0 else droop * 0.35))))
        for i in range(len(ring)):
            bm.faces.new((top, ring[i], ring[(i + 1) % len(ring)]))
        under = bm.verts.new((x, y, z - droop * 0.5))
        for i in range(len(ring)):
            bm.faces.new((under, ring[(i + 1) % len(ring)], ring[i]))
    def box(self, key, x0, x1, y0, y1, z0, z1):
        bm = self.bm(key)
        vs = [bm.verts.new((a, b, c)) for a in (x0, x1) for b in (y0, y1) for c in (z0, z1)]
        for f in [(0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)]:
            bm.faces.new([vs[i] for i in f])
    def export(self):
        for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
        objs = []
        for key, bm in self.parts.items():
            bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
            me = bpy.data.meshes.new(f"{self.name}-{key}"); bm.to_mesh(me); bm.free()
            for p in me.polygons: p.use_smooth = False
            me.materials.append(material(f"forest-{key}", PAL[key]))
            ob = bpy.data.objects.new(f"{self.name}-{key}", me); bpy.context.collection.objects.link(ob); objs.append(ob)
        path = OUT / f"{self.name}.glb"
        bpy.ops.export_scene.gltf(filepath=str(path), export_format="GLB", export_yup=True)
        return path

made = []
# Tiered pines (reference 2): stacked shallow cones, alternating greens
for v, (tiers, height, width) in enumerate([(5, 4.2, 1.5), (4, 3.4, 1.25), (6, 5.0, 1.6)]):
    a = Asset(f"pine-tiered-{v}")
    a.cone("bark", 0, 0, 0, 0.14, 0.1, 0.8, 6)
    for t in range(tiers):
        f = t / tiers
        r = width * (1 - f * 0.8)
        z = 0.6 + f * (height - 1.0)
        a.cone(["leaf1", "leaf2", "leaf3"][t % 3], 0, 0, z, r, r * 0.18, height / tiers * 1.25, 8, rot=t * 0.4)
    a.cone("leaf2", 0, 0, height - 0.2, 0.25, 0, 0.6, 6)
    made.append(a.export())
# Tall red-trunk pines with drooping star layers (reference 3)
for v, (layers, height) in enumerate([(5, 5.5), (6, 6.4)]):
    a = Asset(f"pine-tall-{v}")
    a.cone("barkred", 0, 0, 0, 0.16, 0.03, height, 6)
    for k in range(layers):
        f = k / layers
        a.star_layer(["leaf2", "leaf1", "leaf4"][k % 3], 0, 0, 1.6 + f * (height - 2.2), 1.5 * (1 - f * 0.7), 0.45 * (1 - f * 0.4), 7, rot=k * 0.5)
    made.append(a.export())
# Round broadleaf trees (reference 1 bushes, larger)
for v in range(2):
    a = Asset(f"tree-round-{v}")
    a.cone("bark", 0, 0, 0, 0.18, 0.12, 1.6, 6)
    for (x, y, z, r) in [(0, 0, 2.2, 1.1), (0.6, 0.2, 1.9, 0.75), (-0.5, -0.3, 2.0, 0.8), (0.1, 0.4, 2.8, 0.7)][: 3 + v]:
        a.blob(["leaf2", "leaf1", "leaf4"][int(x * 10) % 3], x, y, z, r, 1, 1, 0.85)
    made.append(a.export())
# Boulders, bush, log
for v in range(2):
    a = Asset(f"rock-{v}")
    a.blob("rock", 0, 0, 0.35, 0.6, 1.2, 1.0, 0.75, sub=1, jitter=0.25)
    a.blob("rockd", 0.55, 0.2, 0.2, 0.32, 1, 1, 0.8, sub=1, jitter=0.3)
    if v: a.blob("moss", 0, 0, 0.72, 0.42, 1.1, 0.9, 0.25, sub=1, jitter=0.1)
    made.append(a.export())
a = Asset("bush")
for (x, y, r) in [(0, 0, 0.5), (0.45, 0.15, 0.38), (-0.4, 0.1, 0.36)]:
    a.blob("leaf1" if x else "leaf2", x, y, r * 0.8, r, 1, 1, 0.9)
made.append(a.export())
a = Asset("log")
a.cone("bark", -0.9, 0, 0.22, 0.2, 0.2, 1.8, 7, tilt=(0, math.pi / 2))
a.cone("moss", -0.2, 0, 0.36, 0.12, 0.05, 0.5, 6, tilt=(0, math.pi / 2))
made.append(a.export())
# Flowers: sunflowers, daffodils, lavender
a = Asset("flowers")
for i, (x, y) in enumerate([(0, 0), (0.25, 0.15), (-0.2, 0.2)]):
    h = 0.9 + i * 0.12
    a.cone("stalk", x, y, 0, 0.03, 0.02, h, 5)
    a.cone("sun", x, y + 0.05, h, 0.2, 0.02, 0.05, 10, tilt=(math.pi / 2.2, 0))
    a.cone("sunc", x, y + 0.08, h, 0.09, 0.02, 0.04, 8, tilt=(math.pi / 2.2, 0))
for i in range(5):
    x, y = random.uniform(-0.4, 0.4), random.uniform(-0.4, 0.1)
    a.cone("stalk", x, y, 0, 0.02, 0.01, 0.45, 4)
    a.cone("lav" if i % 2 else "daff", x, y, 0.4, 0.06, 0.0, 0.22, 5)
made.append(a.export())
# Purple mushroom cluster
a = Asset("mushrooms")
for (x, y, s) in [(0, 0, 1.0), (0.25, 0.1, 0.7), (-0.2, 0.15, 0.6), (0.05, -0.25, 0.5)]:
    a.cone("stem", x, y, 0, 0.06 * s, 0.05 * s, 0.35 * s, 6)
    a.cone("mush" if s > 0.6 else "mushd", x, y, 0.32 * s, 0.22 * s, 0, 0.3 * s, 7)
made.append(a.export())
# Fern / grass tuft
a = Asset("fern")
for k in range(7):
    ang = k * math.tau / 7
    a.cone("leaf2" if k % 2 else "leaf4", 0, 0, 0, 0.06, 0.0, 0.6, 3, tilt=(0.6 * math.cos(ang), 0.6 * math.sin(ang)))
made.append(a.export())
print("exported", len(made), [p.name for p in made])
