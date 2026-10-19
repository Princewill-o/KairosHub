"""Author a continuous, layered mountain surround in Blender for the outdoor maps."""
from pathlib import Path
import math
import bpy

ROOT = Path(__file__).resolve().parents[2]
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
colours = [(0.31, .40, .40), (.28, .38, .37), (.25, .35, .32), (.23, .32, .26), (.25, .34, .22)]
# Far ranges first, with progressively closer foothills. The central opening
# matches a 52 x 46 map; the game scales it for other outdoor map sizes.
for layer, (start, reach, peak) in enumerate([(65, 145, 112), (40, 100, 76), (22, 70, 48), (9, 45, 27), (0, 25, 12)]):
    verts, faces = [], []
    segments = 192
    for row in range(5):
        distance = start + reach * row / 4
        for i in range(segments):
            angle = i * math.tau / segments
            c, s = math.cos(angle), math.sin(angle)
            # A rectangular opening with rounded, irregular ridgelines.
            radius = min((26 + distance) / max(abs(c), .001), (23 + distance) / max(abs(s), .001))
            ridge = .73 + .15*math.sin(angle*13+layer*2) + .09*math.sin(angle*29+layer)
            profile = [0, .47, 1, .63, .28][row]
            height = -.55 + peak * profile * ridge
            verts.append((26 + c*radius, -(23+s*radius), height))
    for row in range(4):
        for i in range(segments):
            a=row*segments+i; b=row*segments+(i+1)%segments
            faces.extend([(a,b,b+segments),(a,b+segments,a+segments)])
    mesh=bpy.data.meshes.new(f'Ridge terrain {layer}')
    mesh.from_pydata(verts, [], faces); mesh.update()
    material=bpy.data.materials.new(f'Mountain range {layer}')
    material.diffuse_color=(*colours[layer],1)
    material.use_nodes=True
    material.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value=(*colours[layer],1)
    material.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value=.95
    mesh.materials.append(material)
    obj=bpy.data.objects.new(f'Mountain range {layer}',mesh)
    bpy.context.collection.objects.link(obj)
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'assets/blender/mountain-surround.blend'))
bpy.ops.export_scene.gltf(filepath=str(ROOT/'public/world3d/mountain-surround.glb'), export_format='GLB', export_yup=True)
