"""Kairos travel kit (low-poly): airliner, walkable cabin, airport terminal, Thames ferry.

Same conventions as the other world kits: metres = tiles, ground z = 0, origin at
the footprint centre, front faces +Y, flat colours (the game adds ink outlines).
Writes public/world3d/{airliner,plane-cabin,airport-terminal,ferry}.glb
"""
from pathlib import Path
import math
import bpy, bmesh

REPO = Path(r"C:\Users\johnd\Documents\GitHub\KairosHub")


class Kit:
    def __init__(self, name):
        for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
        self.name, self.mats, self.meshes = name, {}, {}

    def mat(self, key, rgb, emit=0.0):
        if key not in self.mats:
            m = bpy.data.materials.new(f"{self.name}-{key}"); m.use_nodes = True
            b = m.node_tree.nodes["Principled BSDF"]
            b.inputs["Base Color"].default_value = (*rgb, 1); b.inputs["Roughness"].default_value = 0.85
            if emit:
                b.inputs["Emission Color"].default_value = (*rgb, 1); b.inputs["Emission Strength"].default_value = emit
            self.mats[key] = m; self.meshes[key] = bmesh.new()
        return key

    def box(self, k, x0, x1, y0, y1, z0, z1):
        bm = self.meshes[k]
        vs = [bm.verts.new((a, b, c)) for a in (x0, x1) for b in (y0, y1) for c in (z0, z1)]
        for f in [(0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)]:
            bm.faces.new([vs[i] for i in f])

    def prism(self, k, pts, z0, z1):
        """Extrude a 2D outline (x, y) between two heights."""
        bm = self.meshes[k]
        bot = [bm.verts.new((x, y, z0)) for x, y in pts]
        top = [bm.verts.new((x, y, z1)) for x, y in pts]
        bm.faces.new(list(reversed(bot))); bm.faces.new(top)
        n = len(pts)
        for i in range(n): bm.faces.new((bot[i], bot[(i + 1) % n], top[(i + 1) % n], top[i]))

    def tube(self, k, axis_pts, n=10, x0=0.0):
        """A faceted tube along Y through rings (y, radius_x, radius_z, z_centre), centred on x0."""
        bm = self.meshes[k]
        rings = []
        for y, rx, rz, zc in axis_pts:
            rings.append([bm.verts.new((x0 + rx * math.cos(a), y, zc + rz * math.sin(a))) for a in [i * math.tau / n for i in range(n)]])
        for r0, r1 in zip(rings, rings[1:]):
            for i in range(n): bm.faces.new((r0[i], r0[(i + 1) % n], r1[(i + 1) % n], r1[i]))
        bm.faces.new(list(reversed(rings[0]))); bm.faces.new(rings[-1])

    def cyl(self, k, x, y, z0, z1, r, n=8):
        bm = self.meshes[k]
        bot = [bm.verts.new((x + r * math.cos(a), y + r * math.sin(a), z0)) for a in [i * math.tau / n for i in range(n)]]
        top = [bm.verts.new((x + r * math.cos(a), y + r * math.sin(a), z1)) for a in [i * math.tau / n for i in range(n)]]
        bm.faces.new(list(reversed(bot))); bm.faces.new(top)
        for i in range(n): bm.faces.new((bot[i], bot[(i + 1) % n], top[(i + 1) % n], top[i]))

    def export(self, filename):
        root = bpy.data.objects.new(self.name, None); bpy.context.collection.objects.link(root)
        for k, bm in self.meshes.items():
            me = bpy.data.meshes.new(f"{self.name}-{k}"); bm.to_mesh(me); bm.free()
            for p in me.polygons: p.use_smooth = False
            ob = bpy.data.objects.new(f"{self.name}-{k}", me); ob.data.materials.append(self.mats[k])
            bpy.context.collection.objects.link(ob); ob.parent = root
        path = REPO / "public" / "world3d" / filename
        bpy.ops.object.select_all(action="DESELECT")
        bpy.ops.export_scene.gltf(filepath=str(path), export_format="GLB", export_yup=True)
        return str(path)


def airliner():
    """Kairos Air narrow-body, nose towards +Y. ~30 m long, 26 m span."""
    k = Kit("airliner")
    W = k.mat("white", (0.95, 0.95, 0.97)); V = k.mat("violet", (0.42, 0.25, 0.63)); Gd = k.mat("gold", (0.96, 0.72, 0.24))
    G = k.mat("glass", (0.12, 0.16, 0.24)); D = k.mat("dark", (0.14, 0.14, 0.16)); E = k.mat("engine", (0.75, 0.76, 0.8))
    zc = 3.0
    k.tube(W, [(-15, 0.3, 0.6, zc + 0.6), (-12, 1.4, 1.5, zc + 0.3), (-8, 1.9, 2.0, zc), (10, 1.9, 2.0, zc), (13, 1.5, 1.6, zc - 0.1), (14.6, 0.6, 0.7, zc - 0.3)], n=12)
    k.tube(V, [(-14.0, 1.0, 0.25, zc - 1.2), (12.0, 1.0, 0.25, zc - 1.2)], n=8)          # belly stripe
    k.box(G, -1.1, 1.1, 13.3, 13.9, zc + 0.2, zc + 0.75)                                 # cockpit windows
    for y in [i * 1.0 for i in range(-10, 11)]:                                           # cabin windows
        for s in (-1, 1): k.box(G, s * 1.93 - 0.04, s * 1.93 + 0.04, y - 0.2, y + 0.2, zc + 0.35, zc + 0.8)
    for s in (-1, 1):
        k.prism(W, [(s * 1.6, 3.5), (s * 13.0, -3.0), (s * 13.0, -4.6), (s * 1.6, -2.2)], zc - 1.0, zc - 0.75)   # wings
        k.box(V, s * 12.6 - 0.2, s * 12.6 + 0.2, -4.6, -3.0, zc - 0.75, zc + 0.8)                                  # winglets
        k.tube(E, [(-0.3, 0.75, 0.75, zc - 1.9), (3.2, 0.8, 0.8, zc - 1.9)], n=10, x0=s * 5.0)        # engines
        k.tube(D, [(3.2, 0.55, 0.55, zc - 1.9), (3.25, 0.55, 0.55, zc - 1.9)], n=10, x0=s * 5.0)       # intake
        k.box(D, s * 5.0 - 0.15, s * 5.0 + 0.15, 0.4, 2.6, zc - 1.2, zc - 1.0)            # pylons
        k.prism(W, [(s * 0.4, -11.5), (s * 5.2, -14.6), (s * 5.2, -15.4), (s * 0.4, -13.6)], zc + 0.4, zc + 0.6)   # tailplane
    k.box(V, -0.12, 0.12, -15.0, -10.5, zc + 1.6, zc + 6.2)                               # fin
    k.box(Gd, -0.14, 0.14, -14.0, -11.6, zc + 4.4, zc + 5.4)                              # fin logo band
    k.box(Gd, -1.95, 1.95, 8.2, 8.8, zc - 0.2, zc + 1.5)                                  # door frame band
    # Landing gear
    for x, y in [(-2.2, -1.0), (2.2, -1.0), (0, 11.5)]:
        k.cyl(D, x, y, 0, zc - 1.6, 0.12); k.cyl(D, x, y, 0.0, 0.5, 0.45, n=10)
    return k.export("airliner.glb")


def plane_cabin():
    """Walkable cabin, 6 abreast with a central aisle, open-topped for the game camera.
    4.4 m wide x 22 m long, front +Y; the window wall carries the passing sky in game."""
    k = Kit("plane-cabin")
    F = k.mat("floor", (0.32, 0.30, 0.42)); Wl = k.mat("wall", (0.93, 0.92, 0.9)); S = k.mat("seat", (0.36, 0.22, 0.58))
    H = k.mat("headrest", (0.94, 0.86, 0.6)); G = k.mat("window", (0.55, 0.78, 0.95), emit=0.6); B = k.mat("bins", (0.86, 0.86, 0.88))
    Gy = k.mat("galley", (0.7, 0.72, 0.76)); C = k.mat("carpet", (0.46, 0.3, 0.66))
    X, Y0, Y1, Hh = 2.2, -11, 11, 2.2
    k.box(F, -X, X, Y0, Y1, -0.1, 0)
    k.box(C, -0.45, 0.45, Y0, Y1, 0, 0.02)                                                # aisle carpet
    # Far side (+x): full wall, windows and bins. Camera side (-x): a low cut-away sill so you see the aisle.
    Sk = k.mat("sky", (0.62, 0.82, 0.97), emit=0.4)
    k.box(Wl, X, X + 0.15, Y0, Y1, 0, Hh)
    for y in range(-9, 10, 1):
        k.box(G, X - 0.03, X, y - 0.22, y + 0.22, 1.05, 1.5)
    k.box(B, X - 0.55, X, Y0, Y1, 1.85, 2.1)                                              # overhead bins
    k.box(Wl, -X - 0.15, -X, Y0, Y1, 0, 0.45)
    k.box(Sk, -X - 0.16, -X - 0.15, Y0, Y1, 0.2, 0.42)
    k.box(Wl, -X - 0.15, X + 0.15, Y0 - 0.15, Y0, 0, Hh); k.box(Wl, -X - 0.15, X + 0.15, Y1, Y1 + 0.15, 0, Hh)
    k.box(Gy, -X + 0.1, -0.6, Y1 - 1.6, Y1 - 0.1, 0, 1.1); k.box(Gy, 0.6, X - 0.1, Y1 - 1.6, Y1 - 0.1, 0, 1.1)  # galleys
    for row in range(14):
        y = -8.6 + row * 1.15
        for x in (-1.75, -1.2, -0.65, 0.65, 1.2, 1.75):
            k.box(S, x - 0.24, x + 0.24, y - 0.25, y + 0.2, 0.25, 0.48)                   # cushion
            k.box(S, x - 0.24, x + 0.24, y - 0.3, y - 0.2, 0.48, 1.1)                     # back
            k.box(H, x - 0.2, x + 0.2, y - 0.31, y - 0.19, 0.95, 1.15)                    # headrest cover
    return k.export("plane-cabin.glb")


def terminal():
    """Kairos International: glass terminal 30 x 12, jet bridge to +Y apron."""
    k = Kit("airport-terminal")
    C = k.mat("concrete", (0.86, 0.85, 0.82)); G = k.mat("glass", (0.42, 0.62, 0.78), emit=0.15); R = k.mat("roof", (0.3, 0.3, 0.36))
    V = k.mat("violet", (0.42, 0.25, 0.63)); Gd = k.mat("gold", (0.96, 0.72, 0.24)); D = k.mat("dark", (0.12, 0.12, 0.14)); T = k.mat("tarmac", (0.22, 0.22, 0.24))
    Y = k.mat("line", (0.98, 0.84, 0.2))
    k.box(C, -15, 15, -6, 6, 0, 0.6)
    k.box(G, -14.5, 14.5, -5.6, 5.6, 0.6, 7.0)
    for x in range(-14, 15, 2): k.box(D, x - 0.08, x + 0.08, -5.7, 5.7, 0.6, 7.0)      # mullions
    k.prism(R, [(-16, -7), (16, -7), (16, 7), (-16, 7)], 7.0, 7.6)                        # roof slab
    k.box(R, -16, 16, -7.2, -6.8, 7.6, 8.4)                                               # roof edge
    k.box(V, -9, 9, -7.3, -6.9, 4.8, 6.4)                                                 # sign band (name painted in game)
    k.box(Gd, -9, 9, -7.32, -6.9, 4.6, 4.8)
    k.box(T, -40, 40, 6, 40, -0.02, 0.0)                                                  # apron
    for x in range(-36, 37, 6): k.box(Y, x - 1.5, x + 1.5, 22.9, 23.1, 0.0, 0.01)         # runway centre line
    k.box(Y, -0.08, 0.08, 6, 20, 0, 0.01)                                                 # lead-in line
    # Jet bridge from the terminal to the parked airliner's door.
    k.box(C, -1.4, 1.4, 6, 14, 3.0, 3.4); k.box(G, -1.3, 1.3, 6, 14, 3.4, 5.6); k.box(R, -1.5, 1.5, 6, 14, 5.6, 5.9)
    k.cyl(D, 0, 12, 0, 3.0, 0.35)
    # Control tower.
    k.cyl(C, 13, -3, 7.6, 18, 1.2, n=8); k.cyl(G, 13, -3, 18, 20.5, 2.4, n=8); k.cyl(R, 13, -3, 20.5, 21.1, 2.6, n=8)
    return k.export("airport-terminal.glb")


def ferry():
    """Kairos Clipper river ferry, bow towards +Y. 18 m x 5 m, with a walkable deck."""
    k = Kit("ferry")
    Hu = k.mat("hull", (0.16, 0.19, 0.3)); W = k.mat("white", (0.95, 0.95, 0.96)); V = k.mat("violet", (0.42, 0.25, 0.63))
    G = k.mat("glass", (0.25, 0.4, 0.55), emit=0.1); Gd = k.mat("gold", (0.96, 0.72, 0.24)); D = k.mat("deck", (0.6, 0.45, 0.3))
    k.prism(Hu, [(-2.5, -9), (2.5, -9), (2.5, 6), (0, 9.5), (-2.5, 6)], -0.8, 0.9)
    k.prism(D, [(-2.4, -8.9), (2.4, -8.9), (2.4, 5.9), (0, 9.3), (-2.4, 5.9)], 0.9, 1.0)
    k.prism(V, [(-2.55, -9.05), (2.55, -9.05), (2.55, 6.0), (0, 9.6), (-2.55, 6.0)], 0.6, 0.85)
    k.box(W, -2.0, 2.0, -4.5, 4.0, 1.0, 3.1)                                              # cabin
    k.box(G, -2.05, 2.05, -4.2, 3.7, 1.7, 2.7)
    k.box(W, -2.2, 2.2, -4.7, 4.2, 3.1, 3.3)                                              # roof
    k.box(Gd, -0.9, 0.9, 2.8, 4.0, 3.3, 4.1); k.box(G, -0.85, 0.85, 3.95, 4.05, 3.5, 3.95)  # wheelhouse
    for x in (-2.35, 2.35): k.box(W, x - 0.04, x + 0.04, -8.8, -4.6, 1.0, 1.9)            # rear rails
    k.box(W, -2.35, 2.35, -8.9, -8.8, 1.0, 1.9)
    return k.export("ferry.glb")


out = [airliner(), plane_cabin(), terminal(), ferry()]
print("\n".join(out))
