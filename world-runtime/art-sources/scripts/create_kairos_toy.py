"""Original Kairos articulated toy, authored and exported in Blender."""
from pathlib import Path
import math
import bpy
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[2]
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def mat(name,c,rough=.32):
 m=bpy.data.materials.new(name);m.diffuse_color=(*c,1);m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Roughness'].default_value=rough
 return m
skin=mat('Cloth',(.74,.43,.24));top=mat('Top',(.35,.12,.65));bottom=mat('Bottom',(.08,.13,.24));shoe=mat('Shoes',(.91,.88,.78));hair=mat('Hair',(.08,.045,.025));ink=mat('FaceInk',(.018,.015,.024));white=mat('WhitePrint',(.97,.96,.9));gold=mat('GoldPrint',(.98,.67,.08));red=mat('AccentPrint',(.7,.1,.2))
def group(name,loc,parent=None):
 o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.parent=parent;o.location=loc;return o
root=group('KairosToy',(0,0,0))
def box(name,loc,dim,m,parent,bevel=.045):
 bpy.ops.mesh.primitive_cube_add(size=1);o=bpy.context.object;o.name=name;o.parent=parent;o.location=loc;o.scale=dim
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(m)
 mod=o.modifiers.new('Moulded edges','BEVEL');mod.width=bevel;mod.segments=3;bpy.ops.object.modifier_apply(modifier=mod.name)
 for p in o.data.polygons:p.use_smooth=True
 return o
def sphere(name,loc,dim,m,parent):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=10);o=bpy.context.object;o.name=name;o.parent=parent;o.location=loc;o.scale=dim;o.data.materials.append(m)
 for p in o.data.polygons:p.use_smooth=True
 return o
def curve(name,pts,m,parent,r=.009):
 c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.bevel_depth=r;c.bevel_resolution=2;s=c.splines.new('POLY');s.points.add(len(pts)-1)
 for p,co in zip(s.points,pts):p.co=(*co,1)
 o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);o.parent=parent;o.data.materials.append(m)
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH');return o
torso=group('torso',(0,0,.76),root)
body=box('TaperedToyTorso',(0,0,0),(.58,.33,.48),top,torso,.065)
# Taper the upper body with an original shoulder/chest silhouette.
for v in body.data.vertices:
 if v.co.z>0:v.co.x*=.8
neck=box('Neck',(0,0,1.045),(.19,.19,.13),skin,root,.06)
head=group('head',(0,0,1.32),root)
box('RoundedHexHead',(0,0,0),(.56,.45,.49),skin,head,.14)
# Low-profile cap-like crown rather than a construction-toy stud.
box('CrownInset',(0,.02,.245),(.32,.29,.025),skin,head,.06)
for side in [-1,1]:
 arm=group('arm-left' if side<0 else 'arm-right',(.29*side,0,.92),root)
 sleeve=box('MouldedSleeve',(.025*side,0,-.115),(.18,.22,.31),top,arm,.065)
 sleeve.rotation_euler[1]=-.12*side
 box('Wrist',(.04*side,0,-.31),(.11,.14,.1),skin,arm,.03)
 # Soft open grip hands, sculpted as rounded fingers around a circular opening.
 curve('OpenGrip',[(.045*side+.078*math.cos(t),-.025+.02*math.sin(t),-.415+.08*math.sin(t)) for t in [i*math.pi/24 for i in range(-4,29)]],skin,arm,.027)
 leg=group('leg-left' if side<0 else 'leg-right',(.145*side,0,.51),root)
 box('ArticulatedLeg',(0,0,-.19),(.24,.28,.4),bottom,leg,.055)
 box('ChunkyShoe',(0,-.055,-.43),(.26,.37,.12),shoe,leg,.035)
 # Trouser geometry variants are independently selected by the game.
 for style in range(5):
  g=group('trouser-'+str(style),(0,0,0),leg)
  if style==0:box('DenimSeam',(.095*side,-.145,-.2),(.015,.012,.3),gold,g,.003)
  elif style==1:box('CargoPocket',(.12*side,-.015,-.19),(.055,.19,.12),bottom,g,.015);box('CargoFlap',(.15*side,-.015,-.135),(.018,.2,.025),gold,g,.005)
  elif style==2:box('SportsStripe',(.125*side,-.02,-.19),(.013,.25,.3),white,g,.004)
  elif style==3:box('SmartCrease',(0,-.145,-.2),(.012,.012,.3),ink,g,.003)
  else:box('RolledCuff',(0,0,-.33),(.25,.29,.06),white,g,.015)
for style in range(8):
 g=group('face-'+str(style),(0,0,0),head)
 for side in [-1,1]:
  x=.12*side
  eye_pivot=group(('eye-left-' if side<0 else 'eye-right-')+str(style),(x,-.225,.035),g)
  closed=style==2 or style==6 and side<0
  sphere('PrintedEye',(0,0,0),(.026,.009,.011 if closed else .034),ink,eye_pivot)
  if style in [0,1,3,6] and not closed:sphere('EyeLight',(-.008,-.01,.01),(.008,.004,.01),white,eye_pivot)
  if style in [3,4,5,7]:
   a=box('ExpressiveBrow',(x,-.231,.106),(.082,.012,.017),ink,g,.007);a.rotation_euler[1]=side*(.3 if style in [4,7] else -.2)
 if style in [4,7]:
  box('DarkGrin',(0,-.231,-.092),(.19,.014,.08),ink,g,.028)
  for x in [-.06,.06]:box('LittleFang',(x,-.245,-.075),(.025,.012,.04),white,g,.005)
 elif style==1:
  box('OpenSmile',(0,-.23,-.1),(.18,.014,.095),ink,g,.038);box('Teeth',(0,-.242,-.077),(.12,.01,.021),white,g,.004)
 elif style==5:
  curve('Moustache',[(-.09,-.235,-.055),(0,-.241,-.038),(.09,-.235,-.055)],ink,g,.013)
  curve('CalmMouth',[(-.055,-.236,-.11),(.055,-.236,-.11)],ink,g,.008)
 else:curve('Smile',[(x,-.235,-.09-.028*(1-(x/.09)**2)) for x in [i*.009 for i in range(-10,11)]],ink,g,.009)
for style in range(6):
 g=group('outfit-'+str(style),(0,0,0),torso)
 if style==0:
  for side in [-1,1]:box('HoodieCord',(.07*side,-.18,.07),(.012,.015,.17),white,g,.004)
  box('HoodiePocket',(0,-.18,-.14),(.23,.025,.075),top,g,.018)
 elif style==1:
  for side in [-1,1]:
   lap=box('JacketLapel',(.1*side,-.18,.1),(.085,.022,.21),white,g,.012);lap.rotation_euler[1]=side*.35
  box('Tie',(0,-.2,.04),(.04,.018,.2),gold,g,.007)
 elif style==2:
  for z in [-.12,-.04,.04,.12]:box('SailorStripe',(0,-.18,z),(.43,.014,.024),white,g,.005)
 elif style==3:
  for side in [-1,1]:box('DenimPocket',(.13*side,-.18,.04),(.09,.024,.11),bottom,g,.01)
  box('JacketZip',(0,-.18,0),(.018,.018,.4),gold,g,.005)
 elif style==4:
  box('VarsityPanel',(-.13,-.18,0),(.12,.014,.36),white,g,.015)
  for z in [-.12,0,.12]:sphere('VarsityButton',(.025,-.19,z),(.012,.008,.012),gold,g)
 else:
  box('KharisBadge',(0,-.185,.055),(.15,.018,.15),gold,g,.04)
  box('BadgeCross',(0,-.2,.055),(.025,.008,.1),white,g,.003);box('BadgeCrossBar',(0,-.2,.07),(.075,.008,.025),white,g,.003)
for style in range(5):
 g=group('hair-style-'+str(style),(0,0,0),head)
 box('HairCap',(0,.04,.215),(.57,.43,.15),hair,g,.07)
 if style==0:
  for i in range(7):sphere('Curl',(-.23+i*.077,-.08,.27),(.065,.15,.06),hair,g)
 elif style==1:
  for side in [-1,1]:box('Bob',(.25*side,.05,-.01),(.1,.34,.41),hair,g,.05)
 elif style==2:
  for side in [-1,1]:sphere('Bun',(.24*side,.05,.31),(.095,.1,.09),hair,g)
 elif style==3:
  for i in range(4):sphere('Sweep',(-.17+i*.11,-.14,.23-i*.016),(.1,.085,.07),hair,g)
 else:
  for i in range(5):box('ShortTuft',(-.2+i*.1,0,.3),(.075,.24,.11),hair,g,.025)
# Merge static details by parent/material; animated pivots stay independent.
clusters={}
for o in root.children_recursive:
 if o.type=='MESH':clusters.setdefault((o.parent.name,o.data.materials[0].name),[]).append(o)
for items in clusters.values():
 if len(items)<2:continue
 bpy.ops.object.select_all(action='DESELECT')
 for o in items:o.select_set(True)
 bpy.context.view_layer.objects.active=items[0];bpy.ops.object.join()
bpy.ops.object.select_all(action='DESELECT')
for o in [root,*root.children_recursive]:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/world3d/chars/kairos-toy.glb'),export_format='GLB',use_selection=True)
# Render a lineup showing original outfits and expressions.
for node in root.children_recursive:
 for prefix,selected in [('face-',0),('outfit-',0),('trouser-',0),('hair-style-',3)]:
  if node.name.startswith(prefix):
   show=node.name==prefix+str(selected);node.hide_render=not show
   for child in node.children_recursive:child.hide_render=not show
for i in range(1,4):
 clone=root.copy();bpy.context.collection.objects.link(clone);clone.location.x=i*.92
 def duplicate(src,parent):
  for child in list(src.children):
   cp=child.copy();bpy.context.collection.objects.link(cp);cp.parent=parent;cp.hide_render=False
   duplicate(child,cp)
 duplicate(root,clone)
 for node in clone.children_recursive:
  for prefix in ['face-','outfit-','trouser-','hair-style-']:
   if node.name.startswith(prefix):
    choice=int(node.name.split('-')[-1].split('.')[0]);selected=choice==(i if prefix!='face-' else [0,1,5,4][i])
    node.hide_render=not selected
    for child in node.children_recursive:child.hide_render=not selected
bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.025));bpy.context.object.data.materials.append(mat('Studio',(.83,.79,.71)))
bpy.ops.object.camera_add(location=(3,-6,2.65));cam=bpy.context.object;cam.rotation_euler=(Vector((1.4,0,.8))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=4.7;bpy.context.scene.camera=cam
for loc,power in [((0,-3,5),500),((4,-1,4),400)]:
 bpy.ops.object.light_add(type='AREA',location=loc);bpy.context.object.data.energy=power;bpy.context.object.data.size=4
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.world.color=(.4,.4,.4);scene.render.resolution_x=1400;scene.render.resolution_y=700;scene.render.resolution_percentage=100
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'assets/blender/kairos-toy.blend'))
scene.render.filepath=str(ROOT/'assets/blender/kairos-toy-lineup.png');bpy.ops.render.render(write_still=True)
