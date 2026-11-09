"""Low-poly mountain surround with tunnel portals for Kairos World outdoor maps.

Run inside Blender (Text editor or MCP). Writes:
  world-runtime/art-sources/mountain-surround-lowpoly.blend
  public/world3d/mountain-surround.glb

Frame convention (unchanged from create_mountain_surround.py): the playable map
occupies Blender x 0..52 and y 0..-46; the game scales it to each map size.
A ground skirt runs under everything so nothing outside the map is ever empty.
"""
from pathlib import Path
import math, random
import bpy, bmesh
from mathutils import Vector, noise

REPO = Path(r"C:\Users\johnd\Documents\GitHub\KairosHub")
random.seed(7)
W, H = 52.0, 46.0

for o in list(bpy.data.objects):
    bpy.data.objects.remove(o, do_unlink=True)
for m in list(bpy.data.meshes):
    bpy.data.meshes.remove(m)


def material(name, rgb, rough=0.95):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*rgb, 1)
    bsdf.inputs["Roughness"].default_value = rough
    return m


def vertex_colour_material():
    m = bpy.data.materials.new("Mountain faceted")
    m.use_nodes = True
    nt = m.node_tree
    attr = nt.nodes.new("ShaderNodeVertexColor")
    attr.layer_name = "Col"
    nt.links.new(attr.outputs["Color"], nt.nodes["Principled BSDF"].inputs["Base Color"])
    nt.nodes["Principled BSDF"].inputs["Roughness"].default_value = 1
    return m


def outside_distance(x, y):
    """Distance outside the playable rectangle (map y is negative in Blender)."""
    dx = max(-x, 0, x - W)
    dy = max(y, 0, -H - y)  # y in 0..-46
    return math.hypot(dx, dy)


# Road/tunnel openings: (x, y, facing angle) on the map boundary.
TUNNELS = [(-1.0, -23.0, 0.0), (W + 1.0, -23.0, math.pi), (26.0, 1.0, -math.pi / 2), (26.0, -H - 1.0, math.pi / 2)]


def height(x, y):
    d = outside_distance(x, y)
    if d < 1.5:
        return -0.35
    rise = min(1.0, (d - 1.5) / 26.0)
    n = noise.noise(Vector((x * 0.035, y * 0.035, 0.3))) * 0.5 + 0.5
    ridge = 1 - abs(noise.noise(Vector((x * 0.018, y * 0.018, 1.7))))
    h = (rise ** 1.5) * (10 + 38 * ridge * n) + noise.noise(Vector((x * 0.2, y * 0.2, 4))) * 1.4 * rise
    # Keep a level apron in front of each tunnel portal.
    for tx, ty, _ in TUNNELS:
        k = math.hypot(x - tx, y - ty)
        if k < 9:
            h = min(h, max(-0.35, (k - 3.5) * 1.6))
    return h


def colour(h, slope):
    if h > 33 and slope < 0.85:
        return (0.93, 0.95, 0.98)
    if h > 22:
        return (0.47, 0.45, 0.46) if slope > 0.6 else (0.55, 0.53, 0.52)
    if h > 7:
        return (0.33, 0.47, 0.30) if slope < 0.7 else (0.42, 0.41, 0.36)
    return (0.40, 0.60, 0.32)


# ── Faceted terrain ring ──────────────────────────────────────────────────
STEP = 3.2
X0, X1, Y0, Y1 = -150, W + 150, -H - 150, 150
bm = bmesh.new()
cols = int((X1 - X0) / STEP) + 1
rows = int((Y1 - Y0) / STEP) + 1
grid = []
for j in range(rows):
    row = []
    for i in range(cols):
        x = X0 + i * STEP + (random.random() - 0.5) * STEP * 0.5
        y = Y0 + j * STEP + (random.random() - 0.5) * STEP * 0.5
        row.append(bm.verts.new((x, y, height(x, y))))
    grid.append(row)
for j in range(rows - 1):
    for i in range(cols - 1):
        a, b, c, d = grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]
        # Skip faces entirely inside the playable map (the game draws its own ground).
        cx = (a.co.x + c.co.x) / 2
        cy = (a.co.y + c.co.y) / 2
        if outside_distance(cx, cy) < 0.5:
            continue
        if (i + j) % 2:
            bm.faces.new((a, b, c)); bm.faces.new((a, c, d))
        else:
            bm.faces.new((a, b, d)); bm.faces.new((b, c, d))
bm.normal_update()
col = bm.loops.layers.color.new("Col")
for f in bm.faces:
    h = sum(v.co.z for v in f.verts) / 3
    slope = 1 - abs(f.normal.z)
    shade = 0.92 + random.random() * 0.12
    r, g, b = colour(h, slope)
    for loop in f.loops:
        loop[col] = (r * shade, g * shade, b * shade, 1)
mesh = bpy.data.meshes.new("Mountains")
bm.to_mesh(mesh)
bm.free()
mesh.materials.append(vertex_colour_material())
for p in mesh.polygons:
    p.use_smooth = False
terrain = bpy.data.objects.new("Mountains lowpoly", mesh)
bpy.context.collection.objects.link(terrain)

# ── Ground skirt so no void shows beyond the map ──────────────────────────
bpy.ops.mesh.primitive_plane_add(size=1, location=(W / 2, -H / 2, -0.42))
skirt = bpy.context.object
skirt.name = "Ground skirt"
skirt.scale = (W + 320, H + 320, 1)
skirt.data.materials.append(material("Skirt grass", (0.36, 0.55, 0.30)))

# ── Tunnel portals ────────────────────────────────────────────────────────
stone = material("Tunnel stone", (0.62, 0.58, 0.52))
dark = material("Tunnel dark", (0.03, 0.03, 0.04), 1)
trim = material("Tunnel keystone", (0.80, 0.70, 0.45))
road = material("Tunnel road", (0.17, 0.17, 0.19))
for n, (tx, ty, ang) in enumerate(TUNNELS):
    root = bpy.data.objects.new(f"Tunnel portal {n}", None)
    bpy.context.collection.objects.link(root)
    root.location = (tx, ty, 0)
    root.rotation_euler = (0, 0, ang)

    def part(obj, mat):
        obj.data.materials.append(mat)
        obj.parent = root
        for p in obj.data.polygons:
            p.use_smooth = False
        return obj

    # Portal wall
    bpy.ops.mesh.primitive_cube_add(size=1, location=(-3.2, 0, 3.1))
    w = bpy.context.object; w.scale = (2.0, 11, 6.6); part(w, stone)
    # Arch: half-cylinder with a dark mouth
    bpy.ops.mesh.primitive_cylinder_add(vertices=10, radius=3.1, depth=2.4, location=(-2.6, 0, 2.2), rotation=(0, math.pi / 2, 0))
    a = bpy.context.object; part(a, stone)
    bpy.ops.mesh.primitive_cylinder_add(vertices=10, radius=2.55, depth=2.6, location=(-2.35, 0, 2.2), rotation=(0, math.pi / 2, 0))
    m = bpy.context.object; part(m, dark)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(-2.35, 0, 1.0))
    mb = bpy.context.object; mb.scale = (2.6, 5.1, 2.4); part(mb, dark)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(-1.25, 0, 5.45))
    k = bpy.context.object; k.scale = (0.5, 1.0, 0.9); part(k, trim)
    bpy.ops.mesh.primitive_cube_add(size=1, location=(1.5, 0, -0.33))
    r = bpy.context.object; r.scale = (8, 5.0, 0.06); part(r, road)
    for side in (-1, 1):
        bpy.ops.mesh.primitive_cube_add(size=1, location=(-1.6, side * 3.4, 2.2))
        p = bpy.context.object; p.scale = (1.0, 0.8, 4.6); part(p, stone)

# ── Pines on the lower slopes ─────────────────────────────────────────────
pine = material("Pine", (0.18, 0.36, 0.22))
trunk = material("Trunk", (0.36, 0.25, 0.17))
bpy.ops.mesh.primitive_cone_add(vertices=6, radius1=1.3, depth=3.6, location=(0, 0, 0))
cone = bpy.context.object; cone.name = "pine-src"; cone.data.materials.append(pine)
placed = 0
tries = 0
while placed < 260 and tries < 6000:
    tries += 1
    x = random.uniform(-60, W + 60)
    y = random.uniform(-H - 60, 60)
    d = outside_distance(x, y)
    if d < 4 or d > 40:
        continue
    if any(math.hypot(x - tx, y - ty) < 10 for tx, ty, _ in TUNNELS):
        continue
    h = height(x, y)
    if h > 16:
        continue
    t = bpy.data.objects.new(f"pine {placed}", cone.data.copy())
    s = random.uniform(0.7, 1.5)
    t.scale = (s, s, s * random.uniform(0.9, 1.3))
    t.location = (x, y, h + 1.6 * t.scale.z)
    t.rotation_euler = (0, 0, random.random() * 6.28)
    bpy.context.collection.objects.link(t)
    placed += 1
bpy.data.objects.remove(cone, do_unlink=True)

# Join pines into one mesh to keep draw calls low.
pines = [o for o in bpy.context.scene.objects if o.name.startswith("pine ")]
if pines:
    bpy.ops.object.select_all(action="DESELECT")
    for o in pines:
        o.select_set(True)
    bpy.context.view_layer.objects.active = pines[0]
    bpy.ops.object.join()
    bpy.context.object.name = "Pines"

out_blend = REPO / "world-runtime/art-sources/mountain-surround-lowpoly.blend"
out_glb = REPO / "public/world3d/mountain-surround.glb"
bpy.ops.wm.save_as_mainfile(filepath=str(out_blend))
bpy.ops.export_scene.gltf(filepath=str(out_glb), export_format="GLB", export_yup=True, export_apply=True)
print("exported", out_glb, out_glb.stat().st_size, "faces", len(terrain.data.polygons), "pines", placed)
