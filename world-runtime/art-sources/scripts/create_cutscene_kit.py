# Kairos Life cutscene kit: nine low-poly sets with black ink outlines.
# Each set is exported as public/world3d/cut-<name>.glb. Run inside Blender.
# Frame: the cast stands at the origin facing the camera (Blender -Y); the
# back wall sits at +Y 3. Keep x in [-1.6, 1.6], y in [-1.6, 0.6] clear.
import bpy, bmesh, math, os, random

OUT = os.environ.get("KAIROS_WORLD3D", r"C:\Users\johnd\Documents\GitHub\KairosHub\public\world3d")
MATS = {}

def mat(hex_, emit=0.0):
    key = (hex_, emit)
    if key in MATS: return MATS[key]
    m = bpy.data.materials.new(f"k_{hex_.strip('#')}_{int(emit*10)}")
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    r, g, bl = (int(hex_[i:i + 2], 16) / 255 for i in (1, 3, 5))
    lin = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    col = (lin(r), lin(g), lin(bl), 1)
    b.inputs["Base Color"].default_value = col
    b.inputs["Roughness"].default_value = 0.85
    if emit:
        b.inputs["Emission Color"].default_value = col
        b.inputs["Emission Strength"].default_value = emit
    MATS[key] = m
    return m

INK = None
def ink():
    global INK
    if INK: return INK
    INK = bpy.data.materials.new("k_ink")
    INK.use_nodes = True
    b = INK.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (0.008, 0.007, 0.012, 1)
    b.inputs["Roughness"].default_value = 1
    INK.use_backface_culling = True
    return INK

def finish(o, colour, outline=True, emit=0.0):
    o.data.materials.append(mat(colour, emit))
    for p in o.data.polygons: p.use_smooth = False
    if outline:
        o.data.materials.append(ink())
        s = o.modifiers.new("ink", "SOLIDIFY")
        s.thickness = -0.035; s.offset = 1; s.use_flip_normals = True
        s.material_offset = 1; s.use_rim = False
    return o

def box(col, size, loc, colour, rot=(0, 0, 0), outline=True, emit=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(loc[0], loc[1], loc[2] + size[2] / 2), rotation=rot)
    o = bpy.context.object; o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    move(o, col); return finish(o, colour, outline, emit)

def cyl(col, r, h, loc, colour, verts=8, outline=True, r2=None, emit=0.0):
    if r2 is None:
        bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=h, location=(loc[0], loc[1], loc[2] + h / 2))
    else:
        bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=r, radius2=r2, depth=h, location=(loc[0], loc[1], loc[2] + h / 2))
    o = bpy.context.object; move(o, col); return finish(o, colour, outline, emit)

def ico(col, r, loc, colour, outline=True):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=r, location=loc)
    o = bpy.context.object
    for v in o.data.vertices: v.co *= 1 + random.uniform(-0.12, 0.12)
    move(o, col); return finish(o, colour, outline)

def move(o, col):
    for c in o.users_collection: c.objects.unlink(o)
    col.objects.link(o)

def room(col, floor, wall, side=True):
    box(col, (14, 10, 0.1), (0, 1, -0.1), floor, outline=False)
    box(col, (14, 0.2, 4.2), (0, 3.1, 0), wall)
    if side:
        box(col, (0.2, 6, 4.2), (-5.2, 0.2, 0), wall)
        box(col, (0.2, 6, 4.2), (5.2, 0.2, 0), wall)

def window(col, x, z, w=1.6, h=1.1, y=2.98, sky="#a9d6f2"):
    box(col, (w + 0.16, 0.08, h + 0.16), (x, y, z - 0.08), "#f6f0e4")
    box(col, (w, 0.1, h), (x, y - 0.03, z), sky, emit=0.4)
    box(col, (0.06, 0.12, h), (x, y - 0.05, z), "#f6f0e4", outline=False)

def plant(col, x, y, s=1.0):
    cyl(col, 0.22 * s, 0.4 * s, (x, y, 0), "#b4643c", verts=6, r2=0.16 * s)
    ico(col, 0.38 * s, (x, y, 0.75 * s), "#3f8a52")

random.seed(7)
SETS = {}

def hospital(c):
    room(c, "#d9e4ea", "#eef4f7")
    box(c, (1.0, 2.1, 0.55), (-3.1, 1.2, 0), "#f9fbfc")
    box(c, (0.95, 0.5, 0.18), (-3.1, 2.0, 0.55), "#cfe3f2")
    box(c, (1.05, 0.08, 0.9), (-3.1, 2.25, 0), "#8aa3b4")
    cyl(c, 0.04, 1.7, (-2.35, 2.1, 0), "#9aa7b0", verts=6)
    box(c, (0.25, 0.08, 0.35), (-2.35, 2.1, 1.45), "#d4eefc", emit=0.2)
    box(c, (0.6, 0.45, 1.1), (2.9, 2.6, 0), "#e5ecf0")
    box(c, (0.5, 0.05, 0.35), (2.9, 2.37, 1.2), "#1d2a33", emit=0.0)
    box(c, (0.42, 0.04, 0.22), (2.9, 2.34, 1.27), "#38e08c", emit=1.5)
    box(c, (0.9, 0.1, 0.28), (0.2, 2.98, 2.6), "#d83a3a")
    box(c, (0.28, 0.1, 0.9), (0.2, 2.98, 2.29), "#d83a3a")
    window(c, -1.8, 1.4); plant(c, 4.3, 2.3, 0.9)
    box(c, (3.5, 0.06, 0.25), (0.6, 2.98, 0.0), "#7fb3c9", outline=False)

def home(c):
    room(c, "#b88a5e", "#f3e7d2")
    box(c, (2.6, 0.95, 0.45), (-2.6, 2.1, 0), "#6b3fa0")
    box(c, (2.6, 0.3, 0.75), (-2.6, 2.5, 0.25), "#5a3388")
    for x in (-3.75, -1.45): box(c, (0.3, 0.95, 0.65), (x, 2.1, 0), "#5a3388")
    box(c, (1.3, 0.75, 0.42), (-2.4, 0.6, 0), "#a0764e")
    box(c, (1.6, 0.4, 0.55), (3.0, 2.75, 0), "#3b2f2a")
    box(c, (1.5, 0.06, 0.85), (3.0, 2.78, 0.6), "#14141a", emit=0.0)
    box(c, (1.36, 0.04, 0.72), (3.0, 2.74, 0.66), "#5f8fd1", emit=0.6)
    window(c, 0.2, 1.3, 1.9, 1.2)
    box(c, (2.2, 1.6, 0.02), (-2.5, 0.9, 0.0), "#c84b3c", outline=False)
    plant(c, 4.4, 2.2); cyl(c, 0.2, 0.06, (-2.4, 0.6, 0.42), "#f3f3f3", verts=8)
    box(c, (0.9, 0.05, 0.6), (-2.6, 3.0, 1.6), "#e0b25a")

def classroom(c):
    room(c, "#c9a77c", "#eef0dc")
    box(c, (4.2, 0.08, 1.6), (0, 2.98, 1.0), "#2f5d3a")
    box(c, (4.4, 0.12, 0.08), (0, 2.92, 0.95), "#a0764e")
    for i, w in enumerate((1.2, 0.8, 1.5)): box(c, (w, 0.02, 0.05), (-1.2 + i * 1.1, 2.93, 2.0 - i * 0.35), "#f2f2ea", outline=False)
    for x in (-3.4, 3.4):
        for y in (0.4, 1.6):
            box(c, (1.0, 0.6, 0.06), (x, y, 0.72), "#d8b27e")
            for dx in (-0.42, 0.42): box(c, (0.06, 0.5, 0.72), (x + dx, y, 0), "#4a4a52", outline=False)
            box(c, (0.42, 0.4, 0.42), (x, y - 0.55, 0), "#3e6fb0")
    box(c, (0.9, 0.5, 2.2), (4.4, 2.6, 0), "#a0764e")
    for k in range(5): box(c, (0.12, 0.35, 0.3), (4.1 + k * 0.14, 2.6, 0.9), ["#d83a3a", "#3e6fb0", "#e0b25a", "#3f8a52", "#7c3aed"][k])
    cyl(c, 0.3, 0.04, (-3.8, 2.98, 2.6), "#f6f0e4", verts=12)

def office(c):
    room(c, "#7d8794", "#e6e9ef")
    for x in (-3.3, 3.3):
        box(c, (1.6, 0.8, 0.06), (x, 1.6, 0.74), "#e2e2e2")
        box(c, (0.06, 0.7, 0.74), (x - 0.75, 1.6, 0), "#9aa0aa", outline=False)
        box(c, (0.06, 0.7, 0.74), (x + 0.75, 1.6, 0), "#9aa0aa", outline=False)
        box(c, (0.7, 0.05, 0.45), (x, 1.8, 0.8), "#1d2a33")
        box(c, (0.62, 0.04, 0.38), (x, 1.77, 0.84), "#7fb3e8", emit=0.8)
        box(c, (0.5, 0.5, 0.5), (x, 0.9, 0), "#2a2f3a")
    for i in range(3): window(c, -2.6 + i * 2.6, 1.0, 2.2, 1.9, sky="#9fc7e8")
    box(c, (0.5, 0.5, 1.6), (0, 2.6, 0), "#d6d9df")
    plant(c, 4.5, 2.4, 1.2)

def park(c):
    box(c, (30, 30, 0.1), (0, 4, -0.1), "#7fb069", outline=False)
    box(c, (1.6, 12, 0.02), (0, 4, 0), "#d9c9a8", outline=False)
    for i in range(14):
        x = random.choice([-1, 1]) * random.uniform(2.2, 7); y = random.uniform(1, 9)
        cyl(c, 0.14, 0.9, (x, y, 0), "#6b4a2b", verts=6)
        cyl(c, 0.8, 1.8, (x, y, 0.8), random.choice(["#3f7d4f", "#4f9a5c", "#2f6a40"]), verts=6, r2=0.0)
    box(c, (1.8, 0.5, 0.08), (2.1, 0.8, 0.45), "#8a5a3c")
    box(c, (1.8, 0.08, 0.5), (2.1, 1.05, 0.55), "#8a5a3c")
    for dx in (-0.8, 0.8): box(c, (0.08, 0.5, 0.45), (2.1 + dx, 0.8, 0), "#2a2a2a", outline=False)
    cyl(c, 0.05, 2.6, (-1.6, 2.2, 0), "#2a2a2a", verts=6)
    box(c, (0.3, 0.3, 0.35), (-1.6, 2.2, 2.6), "#ffe9a8", emit=1.2)
    cyl(c, 1.2, 0.3, (-4, 5, 0), "#9ab0bd", verts=10)
    box(c, (2.4, 0.04, 0.02), (-4, 5, 0.3), "#5fa8d3", outline=False)
    for k in range(6): ico(c, 0.28, (random.uniform(-5, 5), random.uniform(0.5, 3), 0.15), "#5b9a4a")

def alley(c):
    box(c, (30, 30, 0.1), (0, 4, -0.1), "#2a1a2c", outline=False)
    for i in range(-3, 4):
        h = 4 + (i % 2) * 1.2
        box(c, (2.6, 2.0, h), (i * 2.8, 4.2, 0), random.choice(["#241628", "#2e1d33", "#1f1424"]))
        for k in range(3): box(c, (0.4, 0.06, 0.5), (i * 2.8 - 0.7 + k * 0.7, 3.17, 1.4 + (k % 2) * 1.3), "#ffcf6a", emit=1.6 if (i + k) % 3 else 0)
    for x, y, col in ((-3.2, 1.6, "#ff3a6a"), (2.6, 2.2, "#7c3aed"), (0.4, 3.12, "#3ad6ff")):
        box(c, (1.2, 0.12, 0.35), (x, y, 2.4), col, emit=3.0)
    box(c, (0.9, 0.6, 0.9), (-4.2, 1.2, 0), "#3a4a3a"); box(c, (0.9, 0.6, 0.08), (-4.2, 1.2, 0.9), "#2a3a2a")
    for k in range(3): cyl(c, 0.3, 0.8, (4.0 + k * 0.5, 1.4 - k * 0.3, 0), "#4a3a2a", verts=8)
    box(c, (0.08, 1.4, 2.2), (-5.2, 1.0, 0), "#555", outline=False)

def cafe(c):
    room(c, "#8a5a3c", "#efe1cb")
    box(c, (3.2, 0.7, 1.05), (-3.0, 2.3, 0), "#5a3a28")
    box(c, (3.3, 0.8, 0.06), (-3.0, 2.3, 1.05), "#d9c4a0")
    cyl(c, 0.2, 0.5, (-3.6, 2.3, 1.1), "#c0c0c8", verts=8)
    for i in range(4): box(c, (0.55, 0.05, 0.35), (-4.2 + i * 0.75, 2.98, 2.1), "#f6f0e4")
    for x in (2.4, 4.0):
        cyl(c, 0.45, 0.04, (x, 1.2, 0.72), "#f3e7d2", verts=10)
        cyl(c, 0.05, 0.72, (x, 1.2, 0), "#2a2a2a", verts=6)
        for dx in (-0.6, 0.6): cyl(c, 0.22, 0.45, (x + dx, 1.2, 0), "#c84b3c", verts=8)
        cyl(c, 0.07, 0.12, (x - 0.15, 1.15, 0.76), "#ffffff", verts=8)
    window(c, 1.8, 1.1, 2.6, 1.6)
    for k in range(4): cyl(c, 0.12, 0.3, (-2 + k * 1.3, 0.6 + (k % 2) * 0.6, 3.6), "#ffe9a8", verts=6, emit=1.5)
    plant(c, 4.6, 2.5, 1.1)

def church(c):
    room(c, "#a8865e", "#efe4cf", side=False)
    box(c, (6.0, 2.0, 0.4), (0, 2.6, 0), "#7a5636")
    box(c, (0.25, 0.12, 2.3), (0, 3.0, 0.9), "#f5b83d", emit=0.6)
    box(c, (1.3, 0.12, 0.25), (0, 3.0, 2.35), "#f5b83d", emit=0.6)
    box(c, (2.6, 0.08, 1.4), (-3.0, 2.98, 1.7), "#1a1430")
    box(c, (2.4, 0.06, 1.2), (-3.0, 2.94, 1.8), "#f6f0e4", emit=0.8)
    box(c, (2.6, 0.08, 1.4), (3.0, 2.98, 1.7), "#1a1430")
    box(c, (2.4, 0.06, 1.2), (3.0, 2.94, 1.8), "#f6f0e4", emit=0.8)
    box(c, (0.7, 0.5, 1.1), (1.2, 2.2, 0.4), "#5a3a28")
    for r in range(3):
        for x in (-3.3, 3.3):
            box(c, (2.6, 0.45, 0.45), (x, -0.4 + r * 1.1, 0), "#8a5a3c")
            box(c, (2.6, 0.1, 0.5), (x, -0.2 + r * 1.1, 0.45), "#7a4a2c")
    for x in (-5.4, 5.4):
        box(c, (0.2, 8, 4.4), (x, 0.4, 0), "#efe4cf")
        for y in (-0.5, 1.5): box(c, (0.12, 0.8, 1.6), (x * 0.99, y, 1.6), "#9f7ae0", emit=0.7)
    for x in (-1.2, 2.4): cyl(c, 0.6, 0.4, (x, 2.3, 0.4), "#3f8a52", verts=6, r2=0.3)

def nursery(c):
    room(c, "#e8d7c0", "#fff1f5")
    box(c, (1.6, 1.0, 0.08), (0, 0.7, 0.55), "#ffffff")
    for x in (-0.8, 0.8):
        for y in (0.22, 1.18): cyl(c, 0.04, 0.9, (x, y, 0), "#f3d2b0", verts=6)
    for k in range(9): cyl(c, 0.025, 0.4, (-0.7 + k * 0.175, 0.2, 0.55), "#f3d2b0", verts=4, outline=False)
    box(c, (1.6, 0.06, 0.06), (0, 0.2, 0.92), "#f3d2b0")
    box(c, (1.4, 0.85, 0.1), (0, 0.7, 0.62), "#f8d9e6", outline=False)
    cyl(c, 0.02, 0.9, (0.0, 0.7, 1.3), "#c8c8c8", verts=4, outline=False)
    for k, col in enumerate(("#ffd166", "#9f7ae0", "#7fd1b9", "#f78fb3")):
        a = k * math.pi / 2; ico(c, 0.12, (math.cos(a) * 0.35, 0.7 + math.sin(a) * 0.35, 1.95), col)
    box(c, (1.2, 0.6, 1.0), (-3.2, 2.4, 0), "#f3e7d2"); box(c, (1.2, 0.08, 0.9), (-3.2, 2.08, 0.05), "#e0b25a")
    window(c, 2.6, 1.3, 1.6, 1.2, sky="#ffe0b8")
    box(c, (0.9, 0.9, 0.9), (3.4, 2.2, 0), "#cfe3f2")
    ico(c, 0.35, (3.4, 2.2, 1.2), "#c8a27a")

for name, fn in (("hospital", hospital), ("home", home), ("classroom", classroom), ("office", office), ("park", park), ("alley", alley), ("cafe", cafe), ("church", church), ("nursery", nursery)):
    old = bpy.data.collections.get(f"cut-{name}")
    if old:
        for o in list(old.objects): bpy.data.objects.remove(o, do_unlink=True)
        bpy.data.collections.remove(old)
    col = bpy.data.collections.new(f"cut-{name}"); bpy.context.scene.collection.children.link(col)
    fn(col)
    SETS[name] = col

def export(name):
    for o in bpy.context.view_layer.objects: o.select_set(False)
    for o in SETS[name].objects: o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, f"cut-{name}.glb"), use_selection=True, export_apply=True, export_yup=True, export_materials="EXPORT")

if __name__ == "__main__" or True:
    for n in SETS: export(n)
    print("exported", list(SETS))
