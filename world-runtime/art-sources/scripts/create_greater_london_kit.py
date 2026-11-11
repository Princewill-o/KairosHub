# Greater London set pieces, low poly with black ink outlines (solidify hulls):
#   gl-coach-station.glb : Kairos Coach Station (terminal hall, glass front,
#                          sawtooth canopy over six bays, clock tower, signs)
#   gl-coach.glb         : a touring coach (purple and gold Kairos Coaches)
#   gl-terrace-row.glb   : a row of London terraces with bay windows and chimneys
# Run: KAIROS_WORLD3D=public/world3d blender -b -P create_greater_london_kit.py
# Units: metres = world tiles. +X east, -Y is the front (faces the road), Z up.
import bpy, math, os, sys
sys.path.insert(0, os.path.dirname(__file__))
OUT = os.environ.get("KAIROS_WORLD3D", "public/world3d")
MATS = {}

def mat(hex_, emit=0.0, alpha=1.0):
    key = (hex_, emit, alpha)
    if key in MATS: return MATS[key]
    m = bpy.data.materials.new(f"gl_{hex_.strip('#')}_{int(emit*10)}_{int(alpha*10)}")
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
    if alpha < 1:
        b.inputs["Alpha"].default_value = alpha
        m.blend_method = "BLEND"
    MATS[key] = m
    return m

INK = None
def ink():
    global INK
    if INK: return INK
    INK = bpy.data.materials.new("gl_ink")
    INK.use_nodes = True
    b = INK.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (0.008, 0.007, 0.012, 1)
    b.inputs["Roughness"].default_value = 1
    INK.use_backface_culling = True
    return INK

def finish(o, colour, outline=True, emit=0.0, alpha=1.0, thick=0.05):
    o.data.materials.append(mat(colour, emit, alpha))
    for p in o.data.polygons: p.use_smooth = False
    if outline:
        o.data.materials.append(ink())
        s = o.modifiers.new("ink", "SOLIDIFY")
        s.thickness = -thick; s.offset = 1; s.use_flip_normals = True
        s.material_offset = 1; s.use_rim = False
    return o

def move(o, col):
    for c in o.users_collection: c.objects.unlink(o)
    col.objects.link(o)

def box(col, size, loc, colour, rot=(0, 0, 0), outline=True, emit=0.0, alpha=1.0, thick=0.05):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(loc[0], loc[1], loc[2] + size[2] / 2), rotation=rot)
    o = bpy.context.object; o.scale = size
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    move(o, col); return finish(o, colour, outline, emit, alpha, thick)

def cyl(col, r, h, loc, colour, verts=8, outline=True, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=h, location=(loc[0], loc[1], loc[2] + (h / 2 if rot == (0, 0, 0) else 0)), rotation=rot)
    o = bpy.context.object; bpy.ops.object.transform_apply(rotation=True); move(o, col); return finish(o, colour, outline)

def text(col, s, size, loc, colour, rot=(math.pi / 2, 0, 0), emit=1.2, extrude=0.03):
    bpy.ops.object.text_add(location=loc, rotation=rot)
    o = bpy.context.object; o.data.body = s; o.data.size = size; o.data.extrude = extrude
    o.data.align_x = "CENTER"; o.data.align_y = "CENTER"
    bpy.ops.object.convert(target="MESH")
    o = bpy.context.object; move(o, col)
    return finish(o, colour, False, emit)

def new_collection(name):
    for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
    c = bpy.data.collections.new(name); bpy.context.scene.collection.children.link(c)
    return c

def export(col, name):
    bpy.ops.object.select_all(action="DESELECT")
    for o in col.objects: o.select_set(True)
    bpy.context.view_layer.objects.active = col.objects[0]
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, f"{name}.glb"), use_selection=True, export_apply=True, export_yup=True, export_materials="EXPORT")
    print("exported", name)

PURPLE, GOLD, CREAM, INKC, GLASS, STONE, BRICK = "#4a2a7a", "#f5c518", "#efe6d2", "#16121d", "#9fc3e8", "#c9bea5", "#a8553f"

def coach(col, x=0.0, y=0.0, rot=0.0, body=PURPLE, stripe=GOLD):
    """A touring coach, length 6 along X, facing +X."""
    L, W, H = 6.0, 1.25, 1.65
    parts = []
    parts.append(box(col, (L, W, H - 0.35), (x, y, 0.35), body))
    parts.append(box(col, (L - 0.3, W + 0.02, 0.5), (x - 0.1, y, 0.95), GLASS, thick=0.03))           # window band
    parts.append(box(col, (L + 0.02, W + 0.04, 0.12), (x, y, 0.62), stripe, outline=False))           # gold stripe
    parts.append(box(col, (0.5, W - 0.1, 0.8), (x + L / 2 - 0.15, y, 0.75), GLASS, thick=0.03))       # windscreen
    parts.append(box(col, (L - 0.4, W - 0.1, 0.12), (x - 0.1, y, H), CREAM))                          # roof
    for wx in (-2.0, -1.4, 1.9):
        for side in (-1, 1):
            parts.append(cyl(col, 0.33, 0.22, (x + wx, y + side * (W / 2), 0.33), "#1b1b1f", verts=10, rot=(math.pi / 2, 0, 0)))
    parts.append(box(col, (0.05, 0.6, 0.18), (x + L / 2 + 0.02, y, 1.38), "#ff9f1c", outline=False, emit=1.5))  # destination board
    for p in parts:
        p.location.x -= x; p.location.y -= y
    # group under an empty, rotated
    bpy.ops.object.empty_add(location=(x, y, 0)); e = bpy.context.object; move(e, col); e.rotation_euler[2] = rot
    for p in parts: p.parent = e
    return e

def coach_station():
    col = new_collection("gl-coach-station")
    # Terminal hall: brick with a cream band, glass frontage, gold sign.
    box(col, (16, 6, 5), (0, 4, 0), BRICK)
    box(col, (16.2, 6.2, 0.5), (0, 4, 5), CREAM)
    for i in range(7):
        box(col, (1.6, 0.12, 3.0), (-6 + i * 2, 0.95, 0.4), GLASS, thick=0.03)
    box(col, (3.2, 0.2, 2.6), (0, 0.9, 0), "#2a1f36")                       # entrance
    box(col, (9, 0.3, 1.0), (0, 0.85, 3.7), PURPLE)                           # sign board
    text(col, "KAIROS COACH STATION", 0.62, (0, 0.68, 4.2), GOLD)
    # Clock tower
    box(col, (2, 2, 9), (8.6, 4, 0), BRICK)
    box(col, (2.3, 2.3, 0.4), (8.6, 4, 9), CREAM)
    cyl(col, 0.75, 0.12, (8.6, 2.95, 7.2), "#fbf7ee", verts=16, rot=(math.pi / 2, 0, 0))
    box(col, (0.08, 0.06, 0.55), (8.6, 2.85, 7.0), INKC, outline=False)
    box(col, (0.4, 0.06, 0.08), (8.75, 2.85, 7.2), INKC, outline=False)
    # Sawtooth canopy over six bays, on posts.
    for i in range(6):
        bx = -7.5 + i * 3
        cyl(col, 0.12, 3.6, (bx - 1.3, -6.5, 0), "#5d6673")
        cyl(col, 0.12, 3.6, (bx - 1.3, -1.0, 0), "#5d6673")
        box(col, (3, 6.4, 0.18), (bx, -3.8, 3.6), "#e8e4da", rot=(0, math.radians(8), 0))
        box(col, (2.6, 0.08, 0.5), (bx, -7.0, 0), "#d9cfbd")                  # kerb island
        text(col, f"BAY {i + 1}", 0.32, (bx, -0.9, 3.2), "#ffffff", emit=1.0)
    # Bay markings and a forecourt
    box(col, (18, 8, 0.04), (0, -3.8, 0), "#3d3d44", outline=False)
    for i in range(7):
        box(col, (0.12, 5.6, 0.05), (-9 + i * 3, -3.8, 0.0), "#f2e9c9", outline=False)
    # Coaches parked in three bays
    for i, (bx, liv) in enumerate([(-7.5, (PURPLE, GOLD)), (-1.5, ("#2b5fd9", "#ffffff")), (4.5, ("#2f7a4f", GOLD))]):
        coach(col, bx, -4.0, math.pi / 2, *liv)
    # Benches and a bus-stop style totem
    for i in range(3): box(col, (1.6, 0.4, 0.45), (-5 + i * 5, 0.2, 0), "#7a4f32")
    box(col, (0.5, 0.3, 2.6), (-10, -1, 0), PURPLE); text(col, "K", 0.4, (-10, -1.17, 2.2), GOLD)
    export(col, "gl-coach-station")

def lone_coach():
    col = new_collection("gl-coach")
    coach(col, 0, 0, 0)
    export(col, "gl-coach")

def terrace_row():
    col = new_collection("gl-terrace-row")
    colours = ["#a8553f", "#c9bea5", "#8a5a3c", "#d9cfbd", "#b5463a", "#efe6d2"]
    for i in range(6):
        x = -7.5 + i * 3
        c = colours[i % len(colours)]
        box(col, (3, 5, 6), (x, 2.5, 0), c)
        box(col, (3.1, 5.2, 0.3), (x, 2.5, 6), CREAM)
        # pitched roof
        bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=2.3, radius2=0, depth=1.6, location=(x, 2.5, 7.1), rotation=(0, 0, math.pi / 4))
        o = bpy.context.object; o.scale = (1.0, 1.6, 1.0); bpy.ops.object.transform_apply(scale=True, rotation=True); move(o, col); finish(o, "#3d3d44")
        box(col, (0.5, 0.5, 1.4), (x + 0.9, 3.6, 6.6), BRICK)                       # chimney
        box(col, (1.6, 0.9, 2.0), (x - 0.4, -0.3, 0.6), c)                           # bay window
        box(col, (1.3, 0.05, 1.3), (x - 0.4, -0.76, 1.0), GLASS, thick=0.02)
        box(col, (0.9, 0.12, 1.9), (x + 0.9, -0.02, 0), ["#2b5fd9", "#c0392b", "#2f7a4f", "#1d1d22", "#f5c518", "#6b3fa0"][i])  # door
        for wx in (-0.6, 0.6):
            box(col, (0.8, 0.05, 1.1), (x + wx, -0.01, 3.6), GLASS, thick=0.02)
        box(col, (3, 0.6, 0.9), (x, -1.4, 0), "#2a2730")                            # railings / wall
    export(col, "gl-terrace-row")

coach_station(); lone_coach(); terrace_row()
