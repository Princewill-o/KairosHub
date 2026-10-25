"""Blender-authored LTBS scenery and London bus, with review renders."""
from pathlib import Path
import bpy, math, random
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'public/world3d'; SOURCE=ROOT/'assets/blender'
def clear():
    bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
def mat(name, colour, metal=0):
    m=bpy.data.materials.new(name); m.diffuse_color=(*colour,1); m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value=(*colour,1); p.inputs['Roughness'].default_value=.65 if not metal else .3; p.inputs['Metallic'].default_value=metal
    return m
def cube(name,p,s,m,bevel=.05):
    bpy.ops.mesh.primitive_cube_add(size=1,location=p); o=bpy.context.object; o.name=name; o.scale=s
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True); o.data.materials.append(m)
    if bevel:
        b=o.modifiers.new('Crafted rounded edges','BEVEL'); b.width=bevel;b.segments=3
        o.modifiers.new('Weighted soft normals','WEIGHTED_NORMAL')
    return o
def sphere(name,p,s,m):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=8,location=p);o=bpy.context.object;o.name=name;o.scale=s;o.data.materials.append(m)
    for f in o.data.polygons:f.use_smooth=True
    return o
def cyl(name,p,r,depth,m,rotation=(0,0,0),vertices=24):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices,radius=r,depth=depth,location=p,rotation=rotation);o=bpy.context.object;o.name=name;o.data.materials.append(m)
    b=o.modifiers.new('Edge highlight','BEVEL');b.width=.025;b.segments=2;o.modifiers.new('Soft normals','WEIGHTED_NORMAL');return o
def text(body,p,size,m,rotation=(math.pi/2,0,0)):
    bpy.ops.object.text_add(location=p,rotation=rotation);o=bpy.context.object;o.name=body;o.data.body=body;o.data.align_x='CENTER';o.data.size=size;o.data.extrude=.001;o.data.materials.append(m);return o
def finish(name,camera,target,ortho=13):
    # Convert text before exporting; lettering is part of the authored asset.
    for o in list(bpy.context.scene.objects):
        if o.type=='FONT':bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');o.select_set(False)
    bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/f'{name}.blend'))
    # Keep the editable objects in the source; export static batches per material.
    deps=bpy.context.evaluated_depsgraph_get();batches={};originals=list(bpy.context.scene.objects)
    for obj in originals:
        if obj.type!='MESH':continue
        evaluated=obj.evaluated_get(deps);mesh=evaluated.to_mesh()
        for poly in mesh.polygons:
            material=mesh.materials[poly.material_index]
            batch=batches.setdefault(material.name,{'material':material,'verts':[],'faces':[]})
            start=len(batch['verts']);batch['verts'].extend(tuple(obj.matrix_world @ mesh.vertices[i].co) for i in poly.vertices)
            batch['faces'].append(tuple(range(start,start+len(poly.vertices))))
        evaluated.to_mesh_clear();obj.hide_render=True
    bpy.ops.object.select_all(action='DESELECT')
    for key,batch in batches.items():
        mesh=bpy.data.meshes.new(key);mesh.from_pydata(batch['verts'],[],batch['faces']);mesh.materials.append(batch['material']);mesh.update()
        obj=bpy.data.objects.new('Game mesh '+key,mesh);bpy.context.collection.objects.link(obj);obj.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(OUT/f'{name}.glb'),export_format='GLB',export_apply=True,export_yup=True,use_selection=True)
    scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24
    scene.world.color=(.35,.4,.48)
    bpy.ops.object.light_add(type='AREA',location=(8,-10,20));bpy.context.object.data.energy=2400;bpy.context.object.data.shape='DISK';bpy.context.object.data.size=12
    bpy.ops.object.light_add(type='SUN',location=(-5,4,10));bpy.context.object.data.energy=2;bpy.context.object.rotation_euler=(.5,-.4,-.5)
    bpy.ops.object.camera_add(location=camera);cam=bpy.context.object;cam.rotation_euler=(Vector(target)-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO' if ortho else 'PERSP';cam.data.ortho_scale=ortho or 40;cam.data.lens=38;scene.camera=cam
    scene.render.resolution_x=1100;scene.render.resolution_y=760;scene.render.resolution_percentage=100
    scene.view_settings.view_transform='AgX';scene.render.filepath=str(SOURCE/f'{name}-preview.png');bpy.ops.render.render(write_still=True)

clear();rng=random.Random(71)
palette=[mat('Sandstone warm '+str(i),(.32+i*.026,.235+i*.019,.18+i*.014)) for i in range(8)]
green=mat('Foothill sage',(.26,.34,.22))
# Independently placed, overlapping massifs with eroded ridges: no concentric cones.
verts=[];faces=[];N=154;M=148
peaks=[]
for i in range(52):
    side=i%4;t=rng.uniform(-90,140);d=rng.uniform(12,95)
    x,z=((-d,t) if side==0 else (52+d,t) if side==1 else (t,-d) if side==2 else (t,46+d))
    peaks.append((x,z,rng.uniform(5,14)+d*.36,rng.uniform(19,34)))
for iz in range(M):
    z=-125+iz*2
    for ix in range(N):
        x=-128+ix*2;distance=max(-x,x-52,-z,z-46,0)
        h=max((p[2]*math.exp(-((x-p[0])**2+(z-p[1])**2)/(p[3]**2)) for p in peaks),default=0)
        erosion=1+ .075*math.sin(x*.17+math.sin(z*.12)*2)+.04*math.sin(z*.24+x*.11)+.012*math.sin(x*.7-z*.5)
        h=(h*erosion+distance*.08)*min(1,max(0,distance/12))-.6
        verts.append((x,-z,h))
for iz in range(M-1):
    for ix in range(N-1):
        x=-128+ix*2;z=-125+iz*2
        if -1<x<53 and -1<z<47:continue
        a=iz*N+ix;faces.extend([(a,a+N,a+1),(a+1,a+N,a+N+1)])
mesh=bpy.data.meshes.new('Eroded sandstone mountain range');mesh.from_pydata(verts,[],faces);mesh.update()
for m in [green,*palette]:mesh.materials.append(m)
for f in mesh.polygons:
    h=sum(mesh.vertices[i].co.z for i in f.vertices)/3
    f.material_index=0 if h<6 else 1+min(7,int(h*.085))
o=bpy.data.objects.new('Sculpted continuous mountain terrain',mesh);bpy.context.collection.objects.link(o)
finish('mountain-surround',(36,-36,13),(18,30,7),0)

clear();red=mat('London vermilion coachwork',(.68,.025,.035),.15);black=mat('Black window surround',(.018,.024,.029));glass=mat('Smoked blue panoramic glazing',(.055,.13,.17),.4);rubber=mat('Tyre rubber',(.025,.026,.028));silver=mat('Brushed alloy',(.55,.58,.58),.7);cream=mat('Warm white lettering',(.97,.91,.73));yellow=mat('Indicator amber',(.98,.49,.07));light=mat('Headlamp lens',(.94,.96,.85),.2)
cube('Lower rounded body',(0,0,.78),(5.7,1.72,1.05),red,.18)
cube('Double deck monocoque',(0,0,2.02),(5.65,1.72,2.37),red,.22)
cube('Roof cap',(-.05,0,3.21),(5.46,1.68,.15),red,.1)
cube('Lower dark panoramic window band',(.05,0,1.42),(5.62,1.765,.91),black,.13)
cube('Upper dark panoramic window band',(-.03,0,2.65),(5.58,1.765,.86),black,.16)
cube('Distinctive red centre belt',(0,0,2.03),(5.71,1.79,.26),red,.045)
for side in [-1,1]:
    for deck in [1.43,2.64]:
        for i in range(7):cube('Individual recessed passenger window',(-2.27+i*.66,side*.892,deck),(.59,.025,.69),glass,.045)
    for x in [-1.65,.7]:
        cube('Passenger double door surround',(x,side*.91,1.0),(.68,.035,1.48),black,.035)
        for k in [-1,1]:cube('Door glass pane',(x+k*.16,side*.937,1.1),(.28,.022,1.16),glass,.02)
        cube('Door yellow safety strip',(x,side*.957,.37),(.62,.018,.045),yellow,.005)
    cube('Kharis side advert panel',(-.55,side*.96,2.03),(2.8,.022,.22),cream,.015)
    text('KHARIS  /  LTBS',(-.55,side*.979,1.97),.14,black,(math.pi/2 if side<0 else -math.pi/2,0,0 if side<0 else math.pi))
    cube('Mirror stalk',(2.54,side*1.0,1.84),(.22,.3,.045),black,.015)
    cube('Side mirror housing',(2.6,side*1.15,1.72),(.12,.12,.32),black,.04)
for z,h in [(1.39,.84),(2.65,.72)]:cube('Curved front windscreen',(2.81,0,z),(.09,1.48,h),glass,.07)
cube('Front blind',(2.87,0,2.14),(.05,1.45,.26),black,.015)
text('191  KHARIS',(2.905,0,2.07),.17,cream,(math.pi/2,0,math.pi/2))
cube('Central windscreen pillar',(2.88,0,1.45),(.03,.045,.8),black,.008)
for yy in [-.59,.59]:
    cyl('Round headlight',(2.86,yy,.68),.11,.06,light,(0,math.pi/2,0))
    cube('Amber running light',(2.9,yy,.91),(.045,.19,.045),yellow,.015)
    cube('Rear stop light',(-2.86,yy,.85),(.04,.12,.35),red,.035)
for yy in [-.9,.9]:
    for x in [-1.8,1.77]:
        cyl('Radial tyre',(x,yy,.43),.43,.16,rubber,(math.pi/2,0,0),32)
        cyl('Alloy hub',(x,yy*1.04,.43),.245,.17,silver,(math.pi/2,0,0),24)
        cyl('Hub centre',(x,yy*1.055,.43),.095,.18,black,(math.pi/2,0,0))
        for bolt in range(8):sphere('Wheel bolt',(x+.17*math.cos(bolt*math.tau/8),yy*1.065,.43+.17*math.sin(bolt*math.tau/8)),(.023,.015,.023),silver)
cube('Front bumper',(2.86,0,.33),(.12,1.5,.13),black,.04)
cube('Number plate',(2.934,0,.43),(.025,.41,.12),cream,.01)
finish('london-bus',(9,-10,6),(0,0,1.4),8.7)

# Four complete environment stages for the story director. Runtime adds actors.
for story in ['david','ruth','esther','daniel']:
    clear();sand=mat('Ochre plaster',(.65,.46,.27));stone=mat('Sunlit stone',(.79,.65,.43));wood=mat('Cedar beams',(.27,.16,.09));leaf=mat('Olive canopy',(.32,.43,.18));water=mat('Blue water',(.13,.43,.51),.15);gold=mat('Royal gold',(.79,.55,.16),.55)
    floor=mat('Ground',(.48,.53,.27) if story in ['david','ruth'] else (.53,.39,.26))
    cube('Terrain platform',(0,0,-.3),(30,26,.6),floor,.4)
    cube('Worn path',(0,-2,.015),(3.3,20,.04),stone,.12)
    rng=random.Random(42)
    for i in range(20):
        x=rng.choice([-1,1])*rng.uniform(5,13);y=rng.uniform(-11,11)
        sphere('Landscape boulder',(x,y,.35),(rng.uniform(.4,1.1),.7,.55),sand)
        if story in ['david','ruth']:
            cyl('Olive trunk',(x,y,1),.15,2,wood)
            sphere('Olive tree crown',(x,y,2.4),(1.25,1.1,1.1),leaf)
    if story=='david':
        for x in [-8,8]:
            for y in [-5,0,5]:
                bpy.ops.mesh.primitive_cone_add(vertices=4,radius1=1.8,depth=2.3,location=(x,y,1.15),rotation=(0,0,math.pi/4));bpy.context.object.data.materials.append(sand)
        cube('Brook',(0,5,.025),(20,1.4,.06),water,.2)
    if story=='ruth':
        for x in [-8,-5,5,8]:
            for y in range(-8,9,2):
                cyl('Barley stalk',(x,y,.6),.035,1.2,gold,vertices=6)
                sphere('Barley ear',(x,y,1.25),(.14,.12,.3),gold)
        cyl('Stone well',(0,6,.6),1.15,1.2,stone)
        cyl('Well water',(0,6,1.21),.85,.03,water)
        cube('Bethlehem house',(-7,7,1.8),(5,5,3.6),sand,.12)
        cube('Door',(-7,4.46,1.2),(1.2,.08,2.4),wood,.05)
    if story=='esther':
        cube('Royal carpet',(0,0,.06),(3.2,22,.08),mat('Persian purple',(.28,.1,.38)),.02)
        for x in [-5,5]:
            for y in [-7,-2,3,8]:
                cyl('Palace column',(x,y,2.7),.45,5.4,stone)
                cube('Gilded capital',(x,y,5.4),(1.1,1.1,.28),gold,.04)
        cube('Throne dais',(0,8,.35),(6,4,.7),stone,.12);cube('Throne seat',(0,8,1.3),(1.6,1.2,.8),gold,.1);cube('Throne back',(0,8.6,2.2),(1.6,.25,2.7),gold,.16)
    if story=='daniel':
        for y in [-8,-3,2,7]:
            cube('Den wall',(-12,y,2.4),(1.2,5,4.8),sand,.2);cube('Den wall',(12,y,2.4),(1.2,5,4.8),sand,.2)
        for x,y in [(-5,5),(6,3),(-6,-5)]:
            sphere('Lion body',(x,y,.7),(1.5,.65,.75),gold);sphere('Lion mane',(x+1.2,y,1.2),(.75,.75,.8),wood);sphere('Lion face',(x+1.65,y,1.2),(.45,.5,.52),sand)
            for dx in [-.9,.9]:
                for dy in [-.4,.4]:cyl('Lion leg',(x+dx,y+dy,.35),.16,.7,gold)
    finish('story-'+story,(23,-28,24),(0,0,1),37)
