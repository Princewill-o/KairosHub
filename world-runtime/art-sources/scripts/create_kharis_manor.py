"""Build the Kharis manor landmark in Blender and export its game-ready GLB.

Run with: blender --background --python scripts/world/create_kharis_manor.py
The saved Blender source is intentionally kept alongside the exported game asset.
"""

from pathlib import Path
import bpy
import math

ROOT = Path(__file__).resolve().parents[2]
BLEND_PATH = ROOT / "assets" / "blender" / "kharis-manor.blend"
GLB_PATH = ROOT / "public" / "world3d" / "kharis-manor.glb"
PREVIEW_PATH = ROOT / "assets" / "blender" / "kharis-manor-preview.png"

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)
for datablocks in (bpy.data.meshes, bpy.data.curves, bpy.data.materials, bpy.data.cameras, bpy.data.lights):
    for block in list(datablocks):
        if block.users == 0:
            datablocks.remove(block)

ROOT_COLLECTION = bpy.context.scene.collection
MODEL = bpy.data.collections.new("Kharis Manor · model")
ROOT_COLLECTION.children.link(MODEL)
STUDIO = bpy.data.collections.new("Studio · render only")
ROOT_COLLECTION.children.link(STUDIO)

def material(name, colour, metallic=0.0, roughness=0.76):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*colour, 1.0)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*colour, 1.0)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    return m

STONE = material("Warm pale ashlar limestone", (0.56, 0.50, 0.39))
STONE_LIGHT = material("Sunlit limestone trim", (0.91, 0.87, 0.78))
STONE_MID = material("Cut limestone blocks", (0.83, 0.79, 0.70))
STONE_SHADOW = material("Recessed joints and plinth", (0.58, 0.54, 0.47))
ROOF = material("Weathered slate roof", (0.19, 0.18, 0.20))
ROOF_EDGE = material("Slate roof edge", (0.29, 0.27, 0.27))
FRAME = material("Dark painted sash frames", (0.92, 0.91, 0.84), roughness=0.42)
GLASS = material("Blue grey reflected window glass", (0.34, 0.48, 0.54), metallic=0.12, roughness=0.24)
DOOR = material("Deep walnut entrance doors", (0.20, 0.12, 0.08), roughness=0.42)
BRASS = material("Aged brass door furniture", (0.59, 0.42, 0.19), metallic=0.7, roughness=0.33)

def mesh_box(name, loc, size, mat, bevel=0.0, collection=MODEL):
    x, y, z = loc
    sx, sy, sz = (v / 2 for v in size)
    verts = [(x + ix * sx, y + iy * sy, z + iz * sz) for ix, iy, iz in (
        (-1,-1,-1),(-1,-1,1),(-1,1,-1),(-1,1,1),(1,-1,-1),(1,-1,1),(1,1,-1),(1,1,1)
    )]
    faces = [(0,4,6,2),(1,3,7,5),(0,1,5,4),(2,6,7,3),(0,2,3,1),(4,5,7,6)]
    mesh = bpy.data.meshes.new(name + " mesh")
    mesh.from_pydata(verts, [], faces)
    mesh.materials.append(mat)
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    if bevel:
        mod = obj.modifiers.new("Soft dressed-stone arris", "BEVEL")
        mod.width = bevel
        mod.segments = 2
        mod.affect = "EDGES"
        obj.modifiers.new("Weighted architectural normals", "WEIGHTED_NORMAL")
    return obj

def cube_between(name, x0, x1, y0, y1, z0, z1, mat, bevel=0.0):
    return mesh_box(name, ((x0+x1)/2, (y0+y1)/2, (z0+z1)/2), (x1-x0, y1-y0, z1-z0), mat, bevel)

def cylinder(name, loc, radius, depth, mat, vertices=16, axis="Z"):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc)
    obj = bpy.context.object
    obj.name = name
    for c in list(obj.users_collection): c.objects.unlink(obj)
    MODEL.objects.link(obj)
    obj.data.materials.append(mat)
    if axis == "Y": obj.rotation_euler[0] = math.pi / 2
    if axis == "X": obj.rotation_euler[1] = math.pi / 2
    return obj

def window(name, x, y, z, width=1.22, height=1.95, face="front"):
    """Deep rectangular Georgian sash with two lights and a central meeting rail."""
    if face == "front":
        cube_between(name + " stone reveal", x-width/2-0.1, x+width/2+0.1, y-0.08, y+0.08, z-0.12, z+height+0.12, STONE_LIGHT, 0.018)
        cube_between(name + " recessed glass", x-width/2, x+width/2, y+0.085, y+0.13, z, z+height, FRAME)
        cube_between(name + " glass", x-width/2+0.09, x+width/2-0.09, y+0.132, y+0.15, z+0.1, z+height-0.1, GLASS)
        for xx in (x-width/2+0.055, x, x+width/2-0.055):
            cube_between(name + " vertical sash", xx-0.035, xx+0.035, y+0.16, y+0.19, z+0.05, z+height-0.05, FRAME)
        cube_between(name + " meeting rail", x-width/2+0.06, x+width/2-0.06, y+0.16, y+0.19, z+height*0.52-0.035, z+height*0.52+0.035, FRAME)
        cube_between(name + " projecting sill", x-width/2-0.18, x+width/2+0.18, y-0.2, y+0.01, z-0.12, z-0.015, STONE_LIGHT, 0.025)
        cube_between(name + " lintel", x-width/2-0.16, x+width/2+0.16, y-0.17, y+0.025, z+height+0.04, z+height+0.15, STONE_MID, 0.02)
    else:
        # Side windows face outward along X; local window width runs along Y.
        side = 1 if face == "right" else -1
        xx = x + side * 0.085
        cube_between(name + " side reveal", x-0.08, x+0.08, y-width/2-0.1, y+width/2+0.1, z-0.12, z+height+0.12, STONE_LIGHT, 0.018)
        cube_between(name + " side frame", xx, xx+side*0.05, y-width/2, y+width/2, z, z+height, FRAME)
        cube_between(name + " side glass", xx+side*0.052, xx+side*0.07, y-width/2+0.09, y+width/2-0.09, z+0.1, z+height-0.1, GLASS)
        for yy in (y-width/2+0.055, y, y+width/2-0.055):
            cube_between(name + " side sash", xx+side*0.075, xx+side*0.1, yy-0.035, yy+0.035, z+0.05, z+height-0.05, FRAME)
        cube_between(name + " side rail", xx+side*0.075, xx+side*0.1, y-width/2+0.06, y+width/2-0.06, z+height*0.52-0.035, z+height*0.52+0.035, FRAME)
        cube_between(name + " side sill", x-0.16, x+0.03, y-width/2-0.16, y+width/2+0.16, z-0.12, z-0.015, STONE_LIGHT, 0.02)

# Entire building, measured to the 20 × 11 tile plot in London's central court.
W, D, FRONT = 20.0, 11.0, 5.5
# Raised dressed-stone podium and broad entrance stair.
cube_between("Broad foundation plinth", -10.0, 10.0, -5.5, 5.5, 0.05, 0.62, STONE_SHADOW, 0.06)
cube_between("Ashlar water-table course", -10.0, 10.0, -5.58, 5.58, 0.60, 0.84, STONE_LIGHT, 0.04)
cube_between("Main two-storey manor body", -9.85, 9.85, -5.25, 5.25, 0.82, 6.95, STONE, 0.035)

# Symmetrical ashlar string courses, deep eaves, and continuous raised cornice.
for z, depth, mat in ((3.62, 0.19, STONE_LIGHT), (6.88, 0.24, STONE_LIGHT), (7.08, 0.15, STONE_MID)):
    cube_between("Continuous front string course", -10.08, 10.08, 5.12-depth, 5.72, z, z+0.15, mat, 0.025)
    cube_between("Rear string course", -10.08, 10.08, -5.72, -5.12+depth, z, z+0.15, mat, 0.025)
cube_between("Deep stone cornice", -10.2, 10.2, -5.7, 5.7, 7.05, 7.42, STONE_LIGHT, 0.06)
cube_between("Slate roof deck", -9.92, 9.92, -5.38, 5.38, 7.40, 7.62, ROOF, 0.025)

# Rusticated corner quoins on all four corners.
for x in (-9.72, 9.48):
    for z in [0.96 + i*0.42 for i in range(14)]:
        if z > 6.75: break
        cube_between("Alternating corner quoin", x, x+0.24, 5.25, 5.48, z, z+0.22, STONE_LIGHT if int(z*5)%2 else STONE_MID, 0.025)
        cube_between("Side corner quoin", x, x+0.24, -5.48, -5.25, z, z+0.22, STONE_LIGHT if int(z*5)%2 else STONE_MID, 0.025)

# Nine tall sash windows on each main floor. The central ground bay becomes the entrance.
front_bays = [-8.25, -6.2, -4.15, -2.1, 0, 2.1, 4.15, 6.2, 8.25]
for floor, z in (("ground", 1.22), ("first", 4.00)):
    for i, x in enumerate(front_bays):
        if floor == "ground" and i == 4:
            continue
        window(f"{floor.title()} floor sash · bay {i+1}", x, FRONT+0.03, z,
               1.18 if floor == "ground" else 1.23, 1.92 if floor == "ground" else 2.05)

# Broad central doorcase, glazed double doors, fanlight, and projecting entrance porch.
cube_between("Entrance stone surround", -1.48, 1.48, 5.27, 5.72, 0.82, 3.05, STONE_LIGHT, 0.045)
cube_between("Walnut double door", -1.16, 1.16, 5.73, 5.9, 0.84, 2.58, DOOR, 0.035)
for x in (-0.55, 0.55):
    cube_between("Door inset glass panel", x-0.38, x+0.38, 5.905, 5.94, 1.28, 2.38, GLASS, 0.018)
    for dx in (-0.35, 0.35): cube_between("Door glazing bar", x+dx-0.025, x+dx+0.025, 5.94, 5.97, 1.25, 2.42, STONE_MID)
cube_between("Entrance fanlight", -0.96, 0.96, 5.9, 5.96, 2.62, 3.0, GLASS)
for x in (-0.34, 0, 0.34): cube_between("Fanlight radial mullion", x-0.025, x+0.025, 5.97, 5.99, 2.62, 3.0, STONE_LIGHT)
for x in (-0.12, 0.12): cylinder("Polished brass door handle", (x, 5.99, 1.72), 0.045, 0.07, BRASS, 12, "Y")
for x in (-1.58, 1.58):
    cube_between("Doorcase pilaster", x-0.16, x+0.16, 5.4, 5.69, 0.9, 3.18, STONE_MID, 0.035)
    cube_between("Pilaster capital", x-0.27, x+0.27, 5.32, 5.78, 3.16, 3.36, STONE_LIGHT, 0.035)
cube_between("Entrance entablature", -2.02, 2.02, 5.25, 5.82, 3.34, 3.68, STONE_LIGHT, 0.04)
for step in range(5):
    z0 = 0.15 + step*0.105
    y1 = 6.0 + (4-step)*0.2
    cube_between(f"Broad entrance stair {step+1}", -2.55, 2.55, 5.48, y1, z0, z0+0.16, STONE_MID, 0.035)

# Raised central pavilion, the distinctive rooftop block visible in all references.
cube_between("Central pavilion body", -3.75, 3.75, -3.2, 5.18, 7.55, 10.52, STONE_MID, 0.035)
for z in (7.55, 8.0, 10.45, 10.67):
    cube_between("Pavilion moulding", -3.96, 3.96, -3.35, 5.36, z, z+0.15, STONE_LIGHT, 0.028)
for x in (-2.25, 0, 2.25):
    window("Upper pavilion sash", x, 5.21, 8.15, 0.86, 1.83)
for x in (-2.35, 2.35):
    window("Pavilion side sash", -3.81, x*0.8, 8.18, 0.92, 1.72, "left")
# The pavilion has its own rooftop belvedere and a balustraded crown.
cube_between("Raised pavilion slate cap", -3.85, 3.85, -3.38, 5.4, 10.68, 10.92, ROOF, 0.03)
for x in [i*0.26-3.55 for i in range(28)]:
    cube_between("Pavilion rooftop baluster", x, x+0.085, 5.22, 5.32, 10.92, 11.35, STONE_LIGHT, 0.018)
    cube_between("Rear pavilion rooftop baluster", x, x+0.085, -3.3, -3.2, 10.92, 11.35, STONE_LIGHT, 0.018)
cube_between("Pavilion balustrade coping front", -3.75, 3.75, 5.13, 5.40, 11.34, 11.47, STONE_LIGHT, 0.035)
cube_between("Pavilion balustrade coping back", -3.75, 3.75, -3.38, -3.11, 11.34, 11.47, STONE_LIGHT, 0.035)
for y in [-3.05 + i*0.27 for i in range(31)]:
    cube_between("Pavilion side baluster", -3.75, -3.65, y, y+0.085, 10.92, 11.35, STONE_LIGHT, 0.018)
    cube_between("Pavilion opposite baluster", 3.65, 3.75, y, y+0.085, 10.92, 11.35, STONE_LIGHT, 0.018)
cube_between("Pavilion side coping left", -3.9, -3.48, -3.12, 5.2, 11.34, 11.47, STONE_LIGHT, 0.035)
cube_between("Pavilion side coping right", 3.48, 3.9, -3.12, 5.2, 11.34, 11.47, STONE_LIGHT, 0.035)

# Parapet balustrades span both lower wings, matching the delicate roof silhouette.
for xa, xb in ((-9.8, -4.0), (4.0, 9.8)):
    cube_between("Wing front balustrade base", xa, xb, 5.08, 5.45, 7.62, 7.77, STONE_LIGHT, 0.025)
    cube_between("Wing front balustrade coping", xa, xb, 5.08, 5.45, 8.42, 8.56, STONE_LIGHT, 0.03)
    n = max(2, int((xb-xa)/0.28))
    for i in range(n):
        x = xa + (xb-xa)*(i+0.5)/n
        cube_between("Wing baluster", x-0.045, x+0.045, 5.19, 5.34, 7.76, 8.42, STONE_LIGHT, 0.018)
    for y in (-5.25, 5.25):
        cube_between("Side parapet coping", xa, xb, y-0.12, y+0.12, 8.42, 8.56, STONE_LIGHT, 0.025)

# Four symmetrical chimney stacks with stepped pale pots and clay caps.
for x in (-8.3, -5.4, 5.4, 8.3):
    y = -2.8 if abs(x) > 7 else 1.2
    cube_between("Limestone chimney stack", x-0.38, x+0.38, y-0.42, y+0.42, 7.55, 9.25, STONE_MID, 0.025)
    cube_between("Chimney shoulder course", x-0.5, x+0.5, y-0.5, y+0.5, 9.1, 9.26, STONE_LIGHT, 0.025)
    cube_between("Chimney crown", x-0.47, x+0.47, y-0.47, y+0.47, 9.26, 9.5, ROOF_EDGE, 0.035)
    cube_between("Chimney dark flue", x-0.2, x+0.2, y-0.2, y+0.2, 9.5, 9.66, FRAME, 0.015)

# Tall sash windows and quoins continue around the visible side elevations.
for side in (-1, 1):
    x = side*9.84
    for yy in (-3.55, -1.25, 1.05, 3.35):
        for z in (1.35, 4.05):
            window("Side elevation sash", x, yy, z, 1.22, 1.82, "right" if side == 1 else "left")
    for z in [1.0 + i*0.42 for i in range(14)]:
        cube_between("Side ashlar corner block", x-side*0.10, x+side*0.14, -5.35, -5.1, z, z+0.22, STONE_LIGHT if int(z*5)%2 else STONE_MID, 0.02)

# Secondary, smaller sash windows and cornice detail on the rear elevation.
for x in (-8.1, -5.7, -3.3, -1.1, 1.1, 3.3, 5.7, 8.1):
    for z in (1.35, 4.05):
        cube_between("Rear limestone window reveal", x-0.7, x+0.7, -5.48, -5.3, z-0.1, z+1.95, STONE_LIGHT)
        cube_between("Rear reflected glazing", x-0.56, x+0.56, -5.51, -5.49, z, z+1.82, GLASS)
        cube_between("Rear sash centre mullion", x-0.035, x+0.035, -5.55, -5.52, z, z+1.82, FRAME)
        cube_between("Rear sash meeting rail", x-0.56, x+0.56, -5.55, -5.52, z+0.9, z+0.97, FRAME)

# Correct the narrow rooftop pavilion proportions from the front reference.
for obj in MODEL.objects:
    if 'pavilion' in obj.name.lower():
        if obj.type == 'MESH':
            # Box geometry is authored in world coordinates; cylinders use object transforms.
            for v in obj.data.vertices: v.co.x *= .48
            obj.location.x *= .48
# Projecting side bay windows run through both floors, with pale corner pilasters.
for cx in (-7.25,7.25):
    cube_between("Projecting two-storey end bay",cx-2.0,cx+2.0,5.24,6.15,.84,6.91,STONE,.035)
    for z in (1.2,4.0):
        for dx in (-1.25,0,1.25):window("Bay window white sash",cx+dx,6.17,z,.87,1.96)
        cube_between("Bay stone band",cx-2.07,cx+2.07,5.2,6.4,z+2.07,z+2.23,STONE_LIGHT,.03)
    for dx in (-1.94,1.75):
        for z in [1+i*.4 for i in range(15)]:
            cube_between("Bay rusticated quoin",cx+dx,cx+dx+.2,6.16,6.39,z,z+.23,STONE_LIGHT,.015)
    cube_between("Bay parapet base",cx-2.1,cx+2.1,5.1,6.42,7.05,7.35,STONE_LIGHT,.03)
# Roofline finials and triangular wing pediments visible in all supplied photographs.
for cx in (-7.25,7.25):
    verts=[(cx-1.0,5.5,8.45),(cx+1.0,5.5,8.45),(cx,5.5,9.25),(cx-1.0,5.7,8.45),(cx+1.0,5.7,8.45),(cx,5.7,9.25)]
    mesh=bpy.data.meshes.new("Wing pediment mesh");mesh.from_pydata(verts,[],[(0,1,2),(3,5,4),(0,3,4,1),(0,2,5,3),(1,4,5,2)]);mesh.materials.append(STONE_LIGHT)
    o=bpy.data.objects.new("Wing triangular pediment",mesh);MODEL.objects.link(o)
    cylinder("Pediment finial",(cx,5.6,9.35),.09,.32,STONE_LIGHT,12)
# The door is modest and recessed, without an invented temple portico.
for obj in list(MODEL.objects):
    if obj.name.startswith("Entrance entablature"):
        obj.scale.x=.64

# Named camera and soft architectural-studio lighting remain in the .blend source.
ground_mat = material("Studio ground, render only", (0.24, 0.31, 0.27), roughness=0.9)
ground = mesh_box("Studio ground · render only", (0,0,-0.17), (220,220,0.25), ground_mat, collection=STUDIO)
cam_data = bpy.data.cameras.new("Manor three-quarter camera")
camera = bpy.data.objects.new("Manor three-quarter camera", cam_data); STUDIO.objects.link(camera)
camera.location = (10, 36, 12)
target = bpy.mathutils.Vector((0,0,5.0)) if hasattr(bpy, "mathutils") else None
from mathutils import Vector
camera.rotation_euler = (Vector((0,0,5.0))-camera.location).to_track_quat("-Z", "Y").to_euler()
camera.data.type = "ORTHO"; camera.data.ortho_scale = 33
bpy.context.scene.camera = camera

def area_light(name, loc, energy, size, colour):
    data = bpy.data.lights.new(name, "AREA"); data.energy=energy; data.shape="DISK"; data.size=size; data.color=colour
    obj=bpy.data.objects.new(name,data); STUDIO.objects.link(obj); obj.location=loc
    obj.rotation_euler=(Vector((0,0,4.5))-obj.location).to_track_quat("-Z","Y").to_euler()

area_light("Large warm key", (4, 14, 24), 4200, 13, (1.0,0.84,0.66))
area_light("Soft cool fill", (-15, 4, 14), 2300, 12, (0.70,0.82,1.0))
area_light("Roof rim", (2,-12,16), 3000, 10, (1.0,0.91,0.75))
world=bpy.data.worlds.new("Soft blue-grey architectural sky") if not bpy.data.worlds else bpy.data.worlds[0]
world.use_nodes=True; world.node_tree.nodes["Background"].inputs["Color"].default_value=(0.46,0.62,0.78,1); world.node_tree.nodes["Background"].inputs["Strength"].default_value=0.55
bpy.context.scene.world=world

scene=bpy.context.scene
scene.render.engine="CYCLES"
scene.cycles.samples=24
scene.render.resolution_x=1280; scene.render.resolution_y=960; scene.render.resolution_percentage=100
scene.render.image_settings.file_format="PNG"
scene.render.filepath=str(PREVIEW_PATH)
scene.view_settings.view_transform="AgX"
scene.render.film_transparent=False
BLEND_PATH.parent.mkdir(parents=True,exist_ok=True); GLB_PATH.parent.mkdir(parents=True,exist_ok=True)

# Save the editable, fully lit Blender project and render it for visual inspection.
bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH))
bpy.ops.render.render(write_still=True)

# Consolidate the static building into one mesh per material for real-time crowds.
# The editable .blend above retains each architectural element separately.
depsgraph=bpy.context.evaluated_depsgraph_get()
batches={}
for obj in MODEL.objects:
    if obj.type!='MESH':continue
    evaluated=obj.evaluated_get(depsgraph)
    mesh=evaluated.to_mesh()
    key=obj.data.materials[0].name
    batch=batches.setdefault(key,{'material':obj.data.materials[0],'verts':[],'faces':[]})
    offset=len(batch['verts'])
    batch['verts'].extend([tuple(obj.matrix_world @ vertex.co) for vertex in mesh.vertices])
    batch['faces'].extend([tuple(offset+i for i in face.vertices) for face in mesh.polygons])
    evaluated.to_mesh_clear()
export_objects=[]
for key,batch in batches.items():
    mesh=bpy.data.meshes.new('Game-ready '+key)
    mesh.from_pydata(batch['verts'],[],batch['faces']);mesh.materials.append(batch['material']);mesh.update()
    obj=bpy.data.objects.new('Kharis Manor · '+key,mesh);bpy.context.scene.collection.objects.link(obj);export_objects.append(obj)
bpy.ops.object.select_all(action='DESELECT')
for obj in export_objects:obj.select_set(True)
bpy.context.view_layer.objects.active=export_objects[0]
bpy.ops.export_scene.gltf(filepath=str(GLB_PATH), export_format="GLB", use_selection=True,
                           export_apply=True, export_materials="EXPORT", export_cameras=False,
                           export_lights=False, export_yup=True)
print(f"Saved Blender source: {BLEND_PATH}")
print(f"Rendered visual review: {PREVIEW_PATH}")
print(f"Exported game model: {GLB_PATH}")
