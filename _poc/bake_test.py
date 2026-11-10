# Blender headless bake test (POC 2026-11-09). Run:
#   blender.exe -b --factory-startup -P bake_test.py -- <samples> <size> <out.png>
# Builds a floor + two walls, imports KayKit models, lights it (sun + a warm point lamp), unwraps the room shell,
# and bakes direct + indirect light (Cycles, CPU) into one lightmap. Prints the time of each step.
import bpy, sys, time, os
import os as _os; POC = _os.path.dirname(_os.path.abspath(__file__)).replace(chr(92), '/') + '/'   # the _poc folder (this script's folder)
a = sys.argv[sys.argv.index('--') + 1:]
SAMPLES, SIZE, OUT = int(a[0]), int(a[1]), a[2]
K = POC + "downloads/kk"
F = K + "/KayKit-Furniture-Bits-1.0-main/addons/kaykit_furniture_bits/Assets/gltf/"
R = K + "/KayKit-Restaurant-Bits-1.0-main/addons/kaykit_restaurant_bits/Assets/gltf/"
D = K + "/KayKit-Dungeon-Remastered-1.0-main/addons/kaykit_dungeon_remastered/Assets/gltf/"
T = {}; t0 = time.time()
def mark(k):
    global t0; T[k] = round(time.time() - t0, 2); t0 = time.time()

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene; sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = SAMPLES
sc.cycles.use_denoising = False
# room shell in metres-like units (KayKit: table 2 units long); one mesh so it shares one lightmap
bpy.ops.mesh.primitive_plane_add(size=1); fl = bpy.context.object; fl.scale = (8, 7, 1); bpy.ops.object.transform_apply(scale=True)
bpy.ops.mesh.primitive_plane_add(size=1, location=(0, -3.5, 2), rotation=(1.5708, 0, 0)); wb = bpy.context.object; wb.scale = (8, 4, 1); bpy.ops.object.transform_apply(scale=True, rotation=True)
bpy.ops.mesh.primitive_plane_add(size=1, location=(-4, 0, 2), rotation=(0, 1.5708, 0)); wl = bpy.context.object; wl.scale = (4, 7, 1); bpy.ops.object.transform_apply(scale=True, rotation=True)
for o in bpy.context.scene.objects: o.select_set(o in (fl, wb, wl))
bpy.context.view_layer.objects.active = fl; bpy.ops.object.join(); shell = bpy.context.object; shell.name = 'shell'
mat = bpy.data.materials.new('shellmat'); mat.use_nodes = True; shell.data.materials.append(mat)
mat.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (.8, .7, .55, 1)
mark('build shell')
for path, loc, rot in [(F + 'table_medium.gltf', (-.5, 0, 0), 0), (F + 'chair_A_wood.gltf', (-1.6, .6, 0), 1.2), (D + 'barrel_large.gltf.glb', (-3, -2.6, 0), 0),
                       (R + 'crate.gltf', (2.4, -2.4, 0), .3), (F + 'lamp_table.gltf', (-.6, 0, 1.0), 0), (F + 'shelf_B_small_decorated.gltf', (0, -3.45, 1.6), 0)]:
    before = set(bpy.context.scene.objects); bpy.ops.import_scene.gltf(filepath=path)
    for o in set(bpy.context.scene.objects) - before:
        if o.parent is None: o.location = loc; o.rotation_euler[2] = rot
mark('import 6 models')
sun = bpy.data.lights.new('sun', 'SUN'); sun.energy = 3; so = bpy.data.objects.new('sun', sun); sc.collection.objects.link(so); so.rotation_euler = (.9, .3, -.5)
lamp = bpy.data.lights.new('lamp', 'POINT'); lamp.energy = 120; lamp.color = (1, .7, .4); lo = bpy.data.objects.new('lamp', lamp); sc.collection.objects.link(lo); lo.location = (-.6, 0, 1.7)
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[1].default_value = .4
# lightmap UVs + an image to bake into
bpy.ops.object.select_all(action='DESELECT'); shell.select_set(True); bpy.context.view_layer.objects.active = shell
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.uv.smart_project(island_margin=.02); bpy.ops.object.mode_set(mode='OBJECT')
img = bpy.data.images.new('lightmap', SIZE, SIZE); node = mat.node_tree.nodes.new('ShaderNodeTexImage'); node.image = img; mat.node_tree.nodes.active = node
mark('lights + uv')
bpy.ops.object.bake(type='DIFFUSE', pass_filter={'DIRECT', 'INDIRECT'}, margin=4)
mark('bake')
img.filepath_raw = OUT; img.file_format = 'PNG'; img.save()
mark('save')
tris = sum(len(o.data.polygons) for o in sc.objects if o.type == 'MESH')
print('BAKE_RESULT', {'samples': SAMPLES, 'size': SIZE, 'faces': tris, **T})
