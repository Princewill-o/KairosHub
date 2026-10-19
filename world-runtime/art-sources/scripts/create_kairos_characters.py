"""Create the Kairos cloth resident in Blender before exporting its game model."""
from pathlib import Path
import bpy
import math

ROOT = Path(__file__).resolve().parents[2]
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def material(name, colour, roughness=.85):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*colour, 1)
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*colour, 1)
    p.inputs['Roughness'].default_value = roughness
    return m

cloth = material('Cloth', (.64, .43, .26))
top = material('Top', (.31, .13, .57))
bottom = material('Bottom', (.12, .13, .2))
hair = material('Hair', (.14, .08, .045))
shoe = material('Shoes', (.88, .79, .59))
eye = material('ButtonEyes', (.012, .009, .014), .17)
shine = material('EyeGlints', (.97, .97, .92), .2)
thread = material('SeamThread', (.25, .16, .1))
metal = material('ZipMetal', (.73, .73, .66), .3)

# A packed repeatable knit texture survives glTF export, unlike Blender-only noise.
size = 128
image = bpy.data.images.new('Kairos woven cotton', width=size, height=size)
pixels = []
for y in range(size):
    for x in range(size):
        a = math.sin((x+y)*math.pi/8)
        b = math.sin((x-y)*math.pi/8)
        v = .78 + .09*a*b + .04*math.sin(x*math.pi/2)
        pixels.extend((v, v*.98, v*.94, 1))
image.pixels = pixels
image.pack()
for m in [cloth, top, bottom, hair]:
    n = m.node_tree.nodes
    t = n.new('ShaderNodeTexImage'); t.image = image
    uv = n.new('ShaderNodeTexCoord')
    mapping = n.new('ShaderNodeVectorMath'); mapping.operation = 'SCALE'
    mapping.inputs[3].default_value = 4
    m.node_tree.links.new(uv.outputs['UV'], mapping.inputs[0])
    m.node_tree.links.new(mapping.outputs[0], t.inputs['Vector'])
    mix = n.new('ShaderNodeMixRGB'); mix.blend_type='MULTIPLY'; mix.inputs[0].default_value=1
    mix.inputs[1].default_value=m.diffuse_color
    m.node_tree.links.new(t.outputs['Color'], mix.inputs[2])
    m.node_tree.links.new(mix.outputs[0], n.get('Principled BSDF').inputs['Base Color'])
    bump = n.new('ShaderNodeBump'); bump.inputs['Strength'].default_value=.15
    bump.inputs['Distance'].default_value=.025
    m.node_tree.links.new(t.outputs['Color'], bump.inputs['Height'])
    m.node_tree.links.new(bump.outputs['Normal'], n.get('Principled BSDF').inputs['Normal'])

def group(name, loc, parent=None):
    o=bpy.data.objects.new(name,None); bpy.context.collection.objects.link(o)
    o.parent=parent; o.location=loc
    return o

root=group('KairosResident',(0,0,0))
def rounded(name, loc, scale, mat, parent, bevel=.18):
    bpy.ops.mesh.primitive_cube_add(size=1)
    o=bpy.context.object; o.name=name; o.parent=parent; o.location=loc
    o.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    o.data.materials.append(mat)
    mod=o.modifiers.new('Soft sewn silhouette','BEVEL'); mod.width=bevel; mod.segments=4
    bpy.context.view_layer.objects.active=o; bpy.ops.object.modifier_apply(modifier=mod.name)
    for p in o.data.polygons:p.use_smooth=True
    return o

def sphere(name, loc, scale, mat, parent):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=12)
    o=bpy.context.object;o.name=name;o.parent=parent;o.location=loc;o.scale=scale
    o.data.materials.append(mat)
    for p in o.data.polygons:p.use_smooth=True
    return o

torso=group('torso',(0,0,.67),root)
sphere('SoftBody',(0,0,0),(.24,.17,.31),top,torso)
head=group('head',(0,0,1.23),root)
rounded('ClothHead',(0,0,0),(.79,.56,.68),cloth,head,.22)
for side in [-1,1]:
    sphere('ButtonEye',(.18*side,-.278,.04),(.068,.035,.084),eye,head)
    sphere('EyeHighlight',(.18*side-.018,-.31,.066),(.016,.008,.02),shine,head)
    sphere('SoftEar',(.4*side,0,-.01),(.065,.06,.09),cloth,head)
    arm=group('arm-left' if side<0 else 'arm-right',(.24*side,0,.84),root)
    rounded('Sleeve',(.035*side,0,-.12),(.16,.19,.28),top,arm,.07)
    sphere('MittenHand',(.06*side,0,-.31),(.09,.085,.115),cloth,arm)
    leg=group('leg-left' if side<0 else 'leg-right',(.12*side,0,.44),root)
    rounded('TrouserLeg',(0,0,-.12),(.18,.2,.29),bottom,leg,.07)
    rounded('RoundedShoe',(0,-.055,-.32),(.22,.32,.13),shoe,leg,.06)

# A stitched smile and seam around the head make the handmade face readable.
def stitch_curve(name, points, mat, parent, thickness):
    c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.bevel_depth=thickness;c.bevel_resolution=2
    line=c.splines.new('POLY');line.points.add(len(points)-1)
    for p,co in zip(line.points,points):p.co=(*co,1)
    o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);o.parent=parent;o.data.materials.append(mat)
    bpy.context.view_layer.objects.active=o;o.select_set(True)
    bpy.ops.object.convert(target='MESH');o.select_set(False)
    return o
stitch_curve('FriendlySmile',[(x,-.286,-.15-.045*(1-(x/.16)**2)) for x in [i*.016 for i in range(-10,11)]],thread,head,.011)
for i in range(13):
    x=-.27+i*.045
    rounded('FaceStitch',(x,-.271,-.258),(.015,.012,.026),thread,head,.004)
rounded('ZipTrack',(0,-.172,0),(.03,.016,.32),metal,torso,.007)
for i in range(8):rounded('ZipTooth',(0,-.185,-.13+i*.037),(.06,.012,.012),metal,torso,.004)
rounded('ZipPull',(0,-.202,.14),(.06,.022,.08),metal,torso,.014)

# Original interchangeable hair pieces are exported as named optional nodes.
for style in range(4):
    g=group('hair-style-'+str(style),(0,0,0),head)
    if style==0:
        for i in range(7):sphere('CurlyTuft',(-.27+i*.09,.01,.31+(.04 if i%2 else 0)),(.105,.24,.095),hair,g)
    elif style==1:
        rounded('SoftBob',(0,.075,.02),(.84,.5,.67),hair,g,.19)
        for side in [-1,1]:rounded('BobSide',(.34*side,-.06,-.05),(.15,.29,.55),hair,g,.07)
    elif style==2:
        sphere('HairCap',(0,.025,.27),(.4,.27,.15),hair,g)
        for side in [-1,1]:sphere('HairBun',(.35*side,.045,.32),(.14,.14,.14),hair,g)
    else:
        sphere('SweptHair',(0,.025,.28),(.4,.27,.14),hair,g)
        for i in range(4):sphere('Fringe',(-.22+i*.13,-.19,.26-i*.023),(.12,.11,.1),hair,g)

# Merge details sharing a material and animated parent to keep crowds inexpensive.
clusters={}
for o in root.children_recursive:
    if o.type=='MESH':
        key=(o.parent.name, o.data.materials[0].name)
        clusters.setdefault(key,[]).append(o)
for items in clusters.values():
    if len(items)<2:continue
    bpy.ops.object.select_all(action='DESELECT')
    for o in items:o.select_set(True)
    bpy.context.view_layer.objects.active=items[0]
    bpy.ops.object.join()
root.select_set(True)
bpy.context.view_layer.objects.active=root
model=[root, *root.children_recursive]
bpy.ops.object.select_all(action='DESELECT')
for o in model:o.select_set(True)
out=ROOT/'public/world3d/chars/kairos-cloth-resident.glb'
bpy.ops.export_scene.gltf(filepath=str(out),export_format='GLB',use_selection=True)

# Studio preview and editable source, with only one hairstyle showing.
for o in bpy.data.objects:
    if o.name.startswith('hair-style-') and o.name!='hair-style-0':
        o.hide_render=True
        for child in o.children_recursive:child.hide_render=True
bpy.ops.mesh.primitive_plane_add(size=200, location=(0,0,-.02))
bpy.context.object.data.materials.append(material('Backdrop',(.89,.84,.75)))
bpy.ops.object.camera_add(location=(2.4,-4.1,2.0))
cam=bpy.context.object
from mathutils import Vector
cam.rotation_euler=(Vector((0,0,.8))-cam.location).to_track_quat('-Z','Y').to_euler()
cam.data.type='ORTHO';cam.data.ortho_scale=2.35;bpy.context.scene.camera=cam
for loc,power,size in [((2,-3,5),500,4),((-3,-1,2),250,3)]:
    bpy.ops.object.light_add(type='AREA',location=loc);bpy.context.object.data.energy=power;bpy.context.object.data.shape='DISK';bpy.context.object.data.size=size
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24
scene.render.resolution_x=800;scene.render.resolution_y=900;scene.render.resolution_percentage=100
scene.world.color=(.4,.4,.4)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'assets/blender/kairos-cloth-resident.blend'))
scene.render.filepath=str(ROOT/'assets/blender/kairos-cloth-resident-preview.png')
bpy.ops.render.render(write_still=True)
