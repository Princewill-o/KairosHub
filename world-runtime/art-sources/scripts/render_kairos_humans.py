# Renders a lineup of the Kairos human wearing different skins (art review / README).
# Usage: python render_kairos_humans.py <kairos-human.glb> <skins_dir> <out.png> [names...]
import bpy, sys, math, os
from mathutils import Vector
args = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
glb, skins, out, names = args[0], args[1], args[2], args[3:]
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
clips = ["idle", "walk", "idle", "run", "idle", "walk", "idle", "punch_basic", "idle", "walk", "idle"]
for i, name in enumerate(names):
    before = set(bpy.data.objects); mats = set(bpy.data.materials)
    bpy.ops.import_scene.gltf(filepath=glb)
    new = [o for o in bpy.data.objects if o not in before]
    roots = [o for o in new if o.parent is None]
    img = bpy.data.images.load(os.path.join(skins, name + ".png"))
    for m in set(bpy.data.materials) - mats:
        for n in m.node_tree.nodes:
            if n.type == "TEX_IMAGE": n.image = img; n.interpolation = "Closest"
        if "overlay" in m.name:
            bsdf = m.node_tree.nodes["Principled BSDF"]; tex = [n for n in m.node_tree.nodes if n.type == "TEX_IMAGE"][0]
            m.node_tree.links.new(tex.outputs["Alpha"], bsdf.inputs["Alpha"])
    # pick one clip per figure via NLA: mute all tracks except the chosen one
    for o in new:
        ad = o.animation_data
        if not ad: continue
        for t in ad.nla_tracks: t.mute = t.name != clips[i % len(clips)]
        ad.action = None
    row, back = i % 6, i // 6
    for root in roots:
        root.location = ((row - 2.5) * 0.85 + (0.42 if back else 0), back * 1.2, 0)
        root.rotation_mode = "XYZ"; root.rotation_euler = (0, 0, math.radians(180 + (row - 2.5) * 6))  # the rig faces +Y; turn it to the camera
sc.frame_set(8)
bpy.ops.mesh.primitive_plane_add(size=40); fl = bpy.context.object
fm = bpy.data.materials.new("floor"); fm.use_nodes = True; fm.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (0.42, 0.46, 0.5, 1); fl.data.materials.append(fm)
bpy.ops.object.light_add(type="SUN"); s = bpy.context.object; s.data.energy = 3.2; s.rotation_euler = (math.radians(50), 0, math.radians(-30)); s.data.angle = math.radians(8)
bpy.ops.object.camera_add(location=(0, -6.2, 1.5)); cam = bpy.context.object; cam.data.lens = 42
cam.rotation_euler = (Vector((0, 0.5, 0.95)) - cam.location).to_track_quat("-Z", "Y").to_euler(); sc.camera = cam
w = bpy.data.worlds.new("w"); sc.world = w; w.use_nodes = True
w.node_tree.nodes["Background"].inputs["Color"].default_value = (0.45, 0.52, 0.6, 1); w.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.9
sc.render.engine = "CYCLES"; sc.cycles.device = "CPU"; sc.cycles.samples = int(os.environ.get("SAMPLES", "24"))
sc.render.resolution_x, sc.render.resolution_y = 1600, 900
sc.render.filepath = out; bpy.ops.render.render(write_still=True); print("rendered", out)
