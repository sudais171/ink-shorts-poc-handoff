# POC round 9: a designed jug that replaces the scanned porcelain one WITHOUT changing the interaction.
# Matched to the old jug's measured layout (Blender units): height 0.211, handle on -X reaching x = -0.152,
# pouring lip on +X reaching x = +0.123, body radius ~0.09, origin bottom-centre.
#   blender.exe -b --factory-startup -P jug5.py
import bpy, bmesh, math
import os as _os; POC = _os.path.dirname(_os.path.abspath(__file__)).replace(chr(92), '/') + '/'   # the _poc folder (this script's folder)
OUT = POC + "downloads/hero/jug5.glb"
bpy.ops.wm.read_factory_settings(use_empty=True)
def mat(name, col):
    m = bpy.data.materials.new(name); m.use_nodes = True; m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (*col, 1); return m
GLAZE, BAND = mat('P_glaze', (.95, .88, .72)), mat('P_band', (.18, .45, .43))
def smooth(o, m):
    o.data.materials.append(m)
    for p in o.data.polygons: p.use_smooth = True
    o.modifiers.new('wn', 'WEIGHTED_NORMAL').keep_sharp = True
def lathe(name, prof, m, seg=48):
    bm = bmesh.new(); rings = []
    for r, z in prof: rings.append([bm.verts.new((r * math.cos(2 * math.pi * k / seg), r * math.sin(2 * math.pi * k / seg), z)) for k in range(seg)])
    for a, b in zip(rings, rings[1:]):
        for k in range(seg): bm.faces.new((a[k], a[(k + 1) % seg], b[(k + 1) % seg], b[k]))
    bm.faces.new(list(reversed(rings[0]))); bm.faces.new(rings[-1])
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); o = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(o)
    smooth(o, m); return o
# body: a foot ring, a round belly, a waisted neck, a thick rolled rim, hollow inside to a visible depth
prof = [(0, 0), (.066, 0), (.072, .008), (.068, .016), (.084, .045), (.094, .085), (.09, .125), (.075, .162), (.072, .18),
        (.082, .198), (.086, .207), (.08, .213), (.07, .213), (.064, .204), (.062, .17), (0, .17)]
body = lathe('body', prof, GLAZE)
# pouring lip: pull the rim out and up on +X, smoothly (a pinched spout)
for v in body.data.vertices:
    if v.co.z > .165:
        a = math.atan2(v.co.y, v.co.x); w = max(0., math.cos(a)) ** 6; k = min(1., (v.co.z - .165) / .045)
        v.co.x += .04 * w * k; v.co.z += .0 * w * k
        v.co.y *= 1 - .25 * w * k
# one painted band round the belly
lathe('band', [(.0952, .074), (.0955, .082), (.0955, .098), (.0952, .106)], BAND)
# handle: a thick loop on -X, from under the rim down to the belly, reaching x = -0.152
cu = bpy.data.curves.new('handle', 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = .016; cu.bevel_resolution = 4
sp = cu.splines.new('BEZIER'); sp.bezier_points.add(3)
for p, co in zip(sp.bezier_points, [(-.075, 0, .175), (-.123, 0, .165), (-.119, 0, .075), (-.086, 0, .055)]):
    p.co = co; p.handle_left_type = p.handle_right_type = 'AUTO'
h = bpy.data.objects.new('handle', cu); bpy.context.scene.collection.objects.link(h)
bpy.context.view_layer.objects.active = h; h.select_set(True); bpy.ops.object.convert(target='MESH'); smooth(h, GLAZE)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', export_apply=True)
vs = [o.matrix_world @ v.co for o in bpy.context.scene.objects if o.type == 'MESH' for v in o.data.vertices]
print('JUG5 x', round(min(v.x for v in vs), 3), round(max(v.x for v in vs), 3), 'y', round(min(v.y for v in vs), 3), round(max(v.y for v in vs), 3), 'z', round(max(v.z for v in vs), 3))
