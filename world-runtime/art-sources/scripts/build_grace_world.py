"""Original Kairos assets, modelled in Blender. No reference-project meshes are copied."""
import bpy, math, os
from mathutils import Vector
ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'../../..'))
OUT=os.path.join(ROOT,'public','world3d')
SOURCE=os.path.join(ROOT,'world-runtime','art-sources')
os.makedirs(OUT,exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
def mat(name,color):
 m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
 p=m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value=(*color,1);p.inputs['Roughness'].default_value=.78
 return m
skin=mat('skin',(.39,.20,.11));hair=mat('hair',(.055,.035,.025));top=mat('top',(.40,.20,.65));bottom=mat('bottom',(.12,.18,.29));shoes=mat('shoes',(.90,.87,.79));ink=mat('ink',(.035,.028,.055));ivory=mat('ivory',(.97,.92,.80));gold=mat('gold',(.95,.65,.17));glass=mat('glass',(.19,.38,.39));stone=mat('stone',(.79,.70,.55));roof=mat('roof',(.15,.10,.23))
def group(name,parent=None,loc=(0,0,0)):
 o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.parent=parent;o.location=loc;return o
def box(name,parent,loc,size,material,bevel=.035):
 bpy.ops.mesh.primitive_cube_add(size=1);o=bpy.context.object;o.name=name;o.parent=parent;o.location=loc;o.scale=size
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 if bevel:
  mod=o.modifiers.new('Tailored edges','BEVEL');mod.width=bevel;mod.segments=2
  bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=mod.name)
 o.data.materials.append(material);return o
def sphere(name,parent,loc,scale,material,segments=10):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=6);o=bpy.context.object;o.name=name;o.parent=parent;o.location=loc;o.scale=scale;o.data.materials.append(material);return o
def bar(name,parent,a,b,width,material):
 v=Vector(b)-Vector(a);o=box(name,parent,(Vector(a)+Vector(b))/2,(width,width,v.length),material,width*.3);o.rotation_euler=v.to_track_quat('Z','Y').to_euler();return o
citizen=group('KairosCitizen');body=group('Body',citizen,(0,0,.83))
box('waist',body,(0,0,.03),(.48,.27,.20),bottom)
box('tailored_torso',body,(0,0,.34),(.58,.31,.59),top,.055)
box('collar',body,(0,-.012,.65),(.21,.25,.055),ivory,.012)
for side,x in [('L',-.33),('R',.33)]:
 arm=group('Arm'+side,body,(x,0,.53))
 sleeve=box('sleeve_'+side,arm,(0,0,-.21),(.19,.24,.43),top,.045)
 box('cuff_'+side,arm,(0,0,-.425),(.19,.245,.055),ivory,.012)
 sphere('hand_'+side,arm,(0,-.01,-.50),(.105,.105,.12),skin)
 leg=group('Leg'+side,citizen,(x*.43,0,.84))
 box('trouser_'+side,leg,(0,0,-.32),(.225,.27,.63),bottom,.035)
 box('lower_leg_skin_'+side,leg,(0,0,-.54),(.205,.245,.28),skin,.025)
 box('sewn_crease_'+side,leg,(0,-.14,-.30),(.014,.012,.48),bottom,.002)
 box('shoe_'+side,leg,(0,-.055,-.735),(.255,.39,.17),shoes,.04)
 box('sole_'+side,leg,(0,-.065,-.805),(.26,.40,.045),ivory,.01)
 cargo=group('trouser_cargo_'+side,leg)
 box('utility_pocket_'+side,cargo,(x/abs(x)*.123,-.02,-.26),(.055,.22,.19),bottom,.012)
 box('pocket_flap_'+side,cargo,(x/abs(x)*.154,-.02,-.18),(.02,.23,.04),ivory,.004)
head=group('Head',body,(0,0,.73))
box('neck',head,(0,0,-.025),(.20,.20,.15),skin,.03)
box('sculpted_head',head,(0,-.008,.245),(.55,.45,.50),skin,.10)
for x in [-.29,.29]:sphere('ear',head,(x,0,.23),(.055,.075,.09),skin)
for x in [-.115,.115]:
 box('eye_white',head,(x,-.23,.27),(.102,.028,.126),ivory,.022)
 box('eye_iris',head,(x,-.249,.264),(.056,.016,.086),ink,.014)
 box('eye_glint',head,(x-.013,-.26,.29),(.022,.008,.024),ivory,.004)
 brow=box('brow',head,(x,-.24,.375),(.12,.028,.027),hair,.008);brow.rotation_euler.y=x*.5
sphere('nose',head,(0,-.255,.205),(.045,.047,.05),skin)
smile_curve=bpy.data.curves.new('Soft smile','CURVE');smile_curve.dimensions='3D';smile_curve.bevel_depth=.010;smile_curve.bevel_resolution=2
smile_line=smile_curve.splines.new('POLY');smile_line.points.add(8)
for i,p in enumerate(smile_line.points):
 x=(i-4)*.023;p.co=(x,-.243,.112+((i-4)/4)**2*.038,1)
smile=bpy.data.objects.new('smile_line',smile_curve);bpy.context.collection.objects.link(smile);smile.parent=head;smile.data.materials.append(ink)
def hairstyle(kind):return group('hair_'+kind,head)
short=hairstyle('short');box('swept_crown',short,(0,.015,.49),(.57,.46,.16),hair,.07)
for i in range(4):
 o=box('swept_lock',short,(-.20+i*.12,-.18,.46+i*.008),(.19,.16,.14),hair,.04);o.rotation_euler.y=-.35
buzz=hairstyle('buzz');box('close_crop',buzz,(0,.025,.48),(.55,.43,.10),hair,.06)
bob=hairstyle('bob');box('bob_cap',bob,(0,.035,.49),(.61,.48,.15),hair,.06)
for x in [-.265,.265]:box('bob_side',bob,(x,.025,.29),(.14,.39,.42),hair,.045)
curls=hairstyle('curly')
for i in range(14):
 a=i*math.tau/9;r=.23 if i<9 else .12
 sphere('curl',curls,(math.cos(a)*r,math.sin(a)*r*.7,.47+(i%3)*.025),(.115,.10,.11),hair)
afro=hairstyle('afro');sphere('afro_crown',afro,(0,.055,.51),(.37,.28,.24),hair,14)
braids=hairstyle('braids');box('braid_cap',braids,(0,.035,.49),(.57,.45,.13),hair,.06)
for x in [-.27,.27]:
 for i in range(5):sphere('braid_segment',braids,(x+math.sin(i*2)*.014,-.015,.40-i*.095),(.066,.072,.070),hair,8)
buns=hairstyle('buns');box('bun_cap',buns,(0,.035,.48),(.55,.44,.12),hair,.06)
for x in [-.28,.28]:sphere('twist_bun',buns,(x,.025,.52),(.135,.13,.13),hair)
long=hairstyle('long');box('long_cap',long,(0,.04,.48),(.57,.45,.13),hair,.06);box('long_back',long,(0,.20,.22),(.57,.13,.55),hair,.05)
for x in [-.27,.27]:box('long_side',long,(x,.04,.21),(.11,.31,.54),hair,.03)
hoodie=group('outfit_hoodie',body)
sphere('hood',hoodie,(0,.12,.62),(.30,.18,.15),top,12)
box('kangaroo_pocket',hoodie,(0,-.17,.19),(.32,.045,.15),top,.02)
for x in [-.075,.075]:bar('drawcord',hoodie,(x,-.20,.58),(x*1.15,-.20,.39),.018,ivory)
jacket=group('outfit_jacket',body)
for x in [-.16,.16]:
 box('jacket_panel',jacket,(x,-.17,.35),(.25,.04,.47),top,.018)
 lapel=box('lapel',jacket,(x*.6,-.204,.54),(.115,.035,.20),ivory,.012);lapel.rotation_euler.y=x*2
 box('chest_pocket',jacket,(x,-.207,.35),(.15,.025,.11),top,.008)
for z in [.22,.32,.42]:sphere('brass_button',jacket,(0,-.211,z),(.018,.015,.018),gold,8)
stripe=group('outfit_stripes',body)
for z in [.13,.25,.37,.49]:box('knit_band',stripe,(0,-.17,z),(.54,.025,.048),ivory,.005)
badge=group('outfit_polo',body);box('woven_kairos_mark',badge,(-.14,-.18,.46),(.082,.025,.105),gold,.012)
sport=group('outfit_tracksuit',body);box('sport_zip',sport,(0,-.18,.35),(.025,.025,.52),ivory,.003)
tunic=group('outfit_tunic',body);box('tunic_hem',tunic,(0,0,.015),(.60,.33,.29),top,.03)
overalls=group('outfit_overalls',body);box('overall_bib',overalls,(0,-.18,.27),(.39,.045,.33),bottom,.02)
for x in [-.16,.16]:bar('overall_strap',overalls,(x,-.19,.40),(x,-.18,.64),.055,bottom);sphere('overall_clasp',overalls,(x,-.22,.42),(.025,.012,.025),gold,8)
freckles=group('extras_freckles',head)
for side in [-1,1]:
 for i in range(3):sphere('freckle',freckles,(side*(.13+i*.032),-.239,.18+(i%2)*.022),(.010,.008,.010),hair,6)
beard=group('extras_beard',head);box('beard_chin',beard,(0,-.09,.045),(.46,.30,.10),hair,.035)
glasses=group('extras_glasses',head)
for x in [-.115,.115]:
 for z in [.195,.35]:bar('frame',glasses,(x-.074,-.275,z),(x+.074,-.275,z),.019,ink)
 for xx in [x-.074,x+.074]:bar('frame',glasses,(xx,-.275,.195),(xx,-.275,.35),.019,ink)
bar('bridge',glasses,(-.04,-.275,.28),(.04,-.275,.28),.018,ink)
scarf=group('extras_scarf',body);box('scarf_wrap',scarf,(0,-.01,.64),(.34,.34,.10),gold,.025);box('scarf_tail',scarf,(.12,-.20,.49),(.13,.06,.27),gold,.012)
pack=group('extras_backpack',body);box('backpack',pack,(0,.24,.34),(.40,.20,.43),bottom,.06);box('pack_pocket',pack,(0,.35,.27),(.28,.05,.17),gold,.02)
hat=group('extras_cap',head);box('cap',hat,(0,.01,.55),(.60,.46,.12),top,.05);box('peak',hat,(0,-.25,.51),(.45,.28,.035),top,.03)
beanie=group('extras_beanie',head);sphere('knit_hat',beanie,(0,.025,.49),(.31,.25,.18),top,14);box('knit_turnup',beanie,(0,.015,.49),(.62,.48,.09),top,.035)
def descendants(o):return [o]+list(o.children_recursive)
def export(o,file):
 bpy.ops.object.select_all(action='DESELECT')
 for x in descendants(o):x.select_set(True)
 bpy.context.view_layer.objects.active=o
 bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,file),export_format='GLB',use_selection=True,export_animations=False,export_yup=True)
export(citizen,'kairos-citizen.glb')
# Reusable hand-modelled game pavilion: recessed door, glazing, roof lantern and timber fins.
pavilion=group('GracePavilion',loc=(6,0,0))
box('foundation',pavilion,(0,0,.10),(4.2,3.3,.20),stone,.05)
box('pavilion_shell',pavilion,(0,0,1.35),(4,3,2.5),ivory,.06)
box('green_roof',pavilion,(0,0,2.65),(4.35,3.35,.22),roof,.06)
box('clerestory',pavilion,(0,.2,3.02),(2.6,1.5,.55),glass,.04)
box('lantern_cap',pavilion,(0,.2,3.33),(2.8,1.7,.12),roof,.04)
for x in [-1.45,1.45]:box('window',pavilion,(x,-1.515,1.35),(.75,.04,1.45),glass,.02)
box('recessed_entry',pavilion,(0,-1.52,1.15),(1.0,.05,2.1),roof,.035)
for x in [-.23,.23]:box('door_leaf',pavilion,(x,-1.56,1.15),(.43,.035,1.95),glass,.02)
for x in [-.07,.07]:box('door_pull',pavilion,(x,-1.60,1.2),(.025,.04,.35),gold,.006)
box('entry_canopy',pavilion,(0,-1.8,2.38),(1.6,.9,.12),top,.025)
for x in [-1.96,-1.1,1.1,1.96]:box('timber_fin',pavilion,(x,-1.56,1.35),(.09,.14,2.45),stone,.01)
box('signboard',pavilion,(0,-1.57,2.04),(2.1,.05,.36),top,.018)
export(pavilion,'grace-pavilion.glb')
# Artist preview and editable source. Hidden variants remain in the GLB for runtime customization.
for o in head.children:
 if o.name.startswith('hair_'):
  for part in descendants(o):part.hide_render=o!=short
for o in body.children:
 if o.name.startswith('outfit_'):
  for part in descendants(o):part.hide_render=o!=jacket
for o in [glasses,scarf,pack,hat,beanie,freckles,beard]:
 for part in descendants(o):part.hide_render=True
pavilion.hide_render=True
for o in pavilion.children_recursive:o.hide_render=True
world=bpy.context.scene.world or bpy.data.worlds.new('World');bpy.context.scene.world=world;world.use_nodes=True;world.node_tree.nodes['Background'].inputs[0].default_value=(.10,.07,.15,1)
box('studio_ground',None,(0,0,-.045),(200,200,.06),mat('studio',(.17,.12,.23)),0)
for loc,power,size in [((3,-4,6),650,5),((-4,-2,4),400,4),((2,4,5),700,3)]:
 bpy.ops.object.light_add(type='AREA',location=loc);l=bpy.context.object;l.data.energy=power;l.data.shape='DISK';l.data.size=size;l.rotation_euler=(Vector((0,0,1))-l.location).to_track_quat('-Z','Y').to_euler()
bpy.ops.object.camera_add(location=(3,-5,2.9));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,1))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=2.75;bpy.context.scene.camera=cam
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.render.resolution_x=900;scene.render.resolution_y=1000;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG';scene.render.filepath=os.path.join(SOURCE,'kairos-citizen-preview.png')
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(SOURCE,'kairos-grace-world.blend'))
bpy.ops.render.render(write_still=True)
print('Original Kairos citizen and Grace pavilion exported.')
