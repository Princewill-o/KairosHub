"""London high-street restaurants (low-poly): Pizzazz Pizza and Kharis Café.

Two-storey shopfronts with full-height glazing, a striped awning, sign band
(the game paints the name on it), upper sash windows, cornice and parapet,
and outdoor seating with parasols, planters and an A-board menu.
Front faces +Y; origin at the centre of the footprint; ground z = 0; metres = tiles.
Footprint 8 x 5 (building 8 x 3.6, pavement seating 1.4). Built with bmesh.
Writes public/world3d/restaurant-<name>.glb
"""
from pathlib import Path
import math
import bpy, bmesh

REPO = Path(r"C:\Users\johnd\Documents\GitHub\KairosHub")

def build(name, wall, trim, awn_a, awn_b, frame, parasol):
    for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
    MATS, MESHES = {}, {}
    def mat(key, rgb, emit=0.0):
        if key not in MATS:
            m = bpy.data.materials.new(f"{name}-{key}"); m.use_nodes = True
            b = m.node_tree.nodes["Principled BSDF"]
            b.inputs["Base Color"].default_value = (*rgb, 1); b.inputs["Roughness"].default_value = 0.85
            if emit:
                b.inputs["Emission Color"].default_value = (*rgb, 1); b.inputs["Emission Strength"].default_value = emit
            MATS[key] = m; MESHES[key] = bmesh.new()
        return key
    def box(k, x0, x1, y0, y1, z0, z1):
        bm = MESHES[k]
        vs = [bm.verts.new((a, b, c)) for a in (x0, x1) for b in (y0, y1) for c in (z0, z1)]
        for f in [(0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)]:
            bm.faces.new([vs[i] for i in f])
    def cyl(k, x, y, z0, z1, r, n=8, r1=None):
        bm = MESHES[k]; r1 = r if r1 is None else r1
        bot = [bm.verts.new((x + r * math.cos(a), y + r * math.sin(a), z0)) for a in [i * math.tau / n for i in range(n)]]
        if r1 < 0.001:
            tip = bm.verts.new((x, y, z1))
            for i in range(n): bm.faces.new((bot[i], bot[(i + 1) % n], tip))
        else:
            top = [bm.verts.new((x + r1 * math.cos(a), y + r1 * math.sin(a), z1)) for a in [i * math.tau / n for i in range(n)]]
            bm.faces.new(top)
            for i in range(n): bm.faces.new((bot[i], bot[(i + 1) % n], top[(i + 1) % n], top[i]))
        bm.faces.new(list(reversed(bot)))
    W = mat("wall", wall); T = mat("trim", trim); A = mat("awning-a", awn_a); B = mat("awning-b", awn_b)
    F = mat("frame", frame); G = mat("glass", (0.98, 0.86, 0.6), emit=0.7); D = mat("dark", (0.12, 0.12, 0.14))
    P = mat("parasol", parasol); WD = mat("wood", (0.50, 0.32, 0.18)); GR = mat("green", (0.30, 0.58, 0.24)); S = mat("sign", (0.12, 0.10, 0.14))
    X0, X1, Y0, Y1 = -4.0, 4.0, -2.5, 1.1       # building block; pavement from 1.1 to 2.5
    H1, H2 = 3.2, 6.2
    box(W, X0, X1, Y0, Y1, 0, H2)
    box(T, X0 - 0.1, X1 + 0.1, Y0 - 0.1, Y1 + 0.12, H2, H2 + 0.3)              # cornice
    box(T, X0, X1, Y0, Y1, H2 + 0.3, H2 + 0.75)                                 # parapet
    for x in (X0, X1):                                                          # pilasters
        box(T, x - 0.18, x + 0.18, Y1, Y1 + 0.18, 0, H2)
    # Shopfront: fascia sign band, glazing, mullions, door
    box(S, X0 + 0.2, X1 - 0.2, Y1, Y1 + 0.2, H1 - 0.15, H1 + 0.55)
    box(F, X0 + 0.2, X1 - 0.2, Y1, Y1 + 0.12, 0, 0.45)                          # stall riser
    box(G, X0 + 0.35, X1 - 0.35, Y1 + 0.02, Y1 + 0.06, 0.45, H1 - 0.25)
    for x in [X0 + 0.35 + i * (X1 - X0 - 0.7) / 6 for i in range(7)]:
        box(F, x - 0.05, x + 0.05, Y1, Y1 + 0.12, 0.45, H1 - 0.15)
    box(F, X0 + 0.3, X1 - 0.3, Y1, Y1 + 0.12, H1 - 0.3, H1 - 0.15)
    box(D, -0.65, 0.65, Y1 + 0.03, Y1 + 0.08, 0, 2.3)                           # door
    box(F, -0.75, 0.75, Y1, Y1 + 0.14, 2.3, 2.42)
    # Striped awning, sloping out over the pavement
    stripes = 12
    for i in range(stripes):
        x0 = X0 + 0.3 + i * (X1 - X0 - 0.6) / stripes; x1 = x0 + (X1 - X0 - 0.6) / stripes
        bm = MESHES[A if i % 2 else B]
        v = [bm.verts.new(p) for p in [(x0, Y1 + 0.1, H1 - 0.2), (x1, Y1 + 0.1, H1 - 0.2), (x1, Y1 + 1.0, H1 - 0.75), (x0, Y1 + 1.0, H1 - 0.75)]]
        bm.faces.new(v); bm.faces.new(list(reversed([bm.verts.new(q.co.copy()) for q in v])))
        box(A if i % 2 else B, x0, x1, Y1 + 0.98, Y1 + 1.02, H1 - 1.0, H1 - 0.75)  # valance
    # Upper floor sash windows with sills and lintels
    for x in (-2.6, 0.0, 2.6):
        box(T, x - 0.65, x + 0.65, Y1, Y1 + 0.1, H1 + 1.0, H1 + 2.55)
        box(D, x - 0.5, x + 0.5, Y1 + 0.1, Y1 + 0.13, H1 + 1.1, H1 + 2.45)
        box(F, x - 0.04, x + 0.04, Y1 + 0.1, Y1 + 0.16, H1 + 1.1, H1 + 2.45)
        box(F, x - 0.5, x + 0.5, Y1 + 0.1, Y1 + 0.16, H1 + 1.74, H1 + 1.8)
        box(T, x - 0.75, x + 0.75, Y1, Y1 + 0.22, H1 + 0.92, H1 + 1.02)
    # Pavement seating: two tables with parasols, chairs, planters, A-board
    for tx in (-2.7, 2.7):
        cyl(D, tx, 1.85, 0, 0.72, 0.04, 6); cyl(WD, tx, 1.85, 0.72, 0.76, 0.42, 10)
        cyl(T, tx, 1.85, 0.76, 2.2, 0.025, 5); cyl(P, tx, 1.85, 1.95, 2.35, 1.0, 8, 0.0)
        for dx in (-0.6, 0.6):
            box(WD, tx + dx - 0.2, tx + dx + 0.2, 1.65, 2.05, 0.42, 0.47)
            box(D, tx + dx - 0.2, tx + dx + 0.2, 1.65 if dx < 0 else 2.0, 1.7 if dx < 0 else 2.05, 0.47, 0.9)
            for lx in (-0.17, 0.13):
                box(D, tx + dx + lx, tx + dx + lx + 0.04, 1.68, 2.02, 0, 0.42)
    for x in (X0 + 0.35, X1 - 0.35):
        box(WD, x - 0.3, x + 0.3, 1.2, 1.7, 0, 0.55); cyl(GR, x, 1.45, 0.55, 1.0, 0.32, 7, 0.1)
    box(S, 1.1, 1.6, 2.1, 2.16, 0, 1.0); box(S, 1.1, 1.6, 2.34, 2.4, 0, 1.0)     # A-board
    box(T, X0 - 0.2, X1 + 0.2, Y1, 2.5, -0.02, 0.0)                              # paving
    for k, bm in MESHES.items():
        if not bm.faces: continue
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        me = bpy.data.meshes.new(f"{name}-{k}"); bm.to_mesh(me); bm.free()
        me.materials.append(MATS[k])
        bpy.context.collection.objects.link(bpy.data.objects.new(f"{name}-{k}", me))
    path = REPO / f"public/world3d/restaurant-{name}.glb"
    bpy.ops.export_scene.gltf(filepath=str(path), export_format="GLB", export_yup=True)
    return path

out = [
    build("pizzazz", (0.62, 0.22, 0.16), (0.95, 0.90, 0.80), (0.86, 0.12, 0.10), (0.98, 0.96, 0.92), (0.10, 0.28, 0.14), (0.86, 0.12, 0.10)),
    build("cafe", (0.72, 0.84, 0.74), (0.98, 0.96, 0.90), (0.20, 0.50, 0.30), (0.98, 0.96, 0.92), (0.30, 0.20, 0.12), (0.95, 0.80, 0.30)),
]
print("exported", [p.name for p in out])
