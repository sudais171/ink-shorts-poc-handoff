# POC round 7: replacements for the remaining scanned props in shot, built to the barrel standard (ASSET_STANDARD.md):
# crate, candlestick, picture frame, chandelier, and a wall sconce (a visible source for a new light).
#   blender.exe -b --factory-startup -P heroes4.py
import bpy, bmesh, math, os
import os as _os; POC = _os.path.dirname(_os.path.abspath(__file__)).replace(chr(92), '/') + '/'   # the _poc folder (this script's folder)
OUT = POC + "downloads/hero/"
MATS = {}
def mat(name, col):
    if name not in MATS:
        m = bpy.data.materials.new(name); m.use_nodes = True; m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (*col, 1); MATS[name] = m
    return MATS[name]
def finish(o, m, bevel=0., seg=3):
    o.data.materials.append(m)
    if bevel: b = o.modifiers.new('bev', 'BEVEL'); b.width = bevel; b.segments = seg; b.limit_method = 'ANGLE'; b.angle_limit = math.radians(35)
    for p in o.data.polygons: p.use_smooth = True
    o.modifiers.new('wn', 'WEIGHTED_NORMAL').keep_sharp = True
    return o
def box(name, size, loc, m, bevel=.01, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot); o = bpy.context.object; o.name = name; o.scale = size
    bpy.ops.object.transform_apply(scale=True); return finish(o, m, bevel)
def lathe(name, prof, m, seg=32, loc=(0, 0, 0)):
    bm = bmesh.new(); rings = []
    for r, z in prof: rings.append([bm.verts.new((loc[0] + r * math.cos(2 * math.pi * k / seg), loc[1] + r * math.sin(2 * math.pi * k / seg), loc[2] + z)) for k in range(seg)])
    for a, b in zip(rings, rings[1:]):
        for k in range(seg): bm.faces.new((a[k], a[(k + 1) % seg], b[(k + 1) % seg], b[k]))
    bm.faces.new(list(reversed(rings[0]))); bm.faces.new(rings[-1])
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); o = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(o)
    return finish(o, m)
def tube(name, pts, r, m):
    cu = bpy.data.curves.new(name, 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = r; cu.bevel_resolution = 3
    sp = cu.splines.new('POLY'); sp.points.add(len(pts) - 1)
    for p, q in zip(sp.points, pts): p.co = (*q, 1)
    o = bpy.data.objects.new(name, cu); bpy.context.scene.collection.objects.link(o)
    bpy.context.view_layer.objects.active = o; o.select_set(True); bpy.ops.object.convert(target='MESH'); o.select_set(False)
    return finish(o, m)
def candle(x, y, z, r, h):
    lathe('wax', [(0, 0), (r, 0), (r, h), (r * .8, h + r * .3), (0, h + r * .3)], W, 20, (x, y, z))
    lathe('flame', [(0, 0), (r * .55, r * .7), (r * .45, r * 1.6), (0, r * 2.8)], FL, 16, (x, y, z + h + r * .25))
def reset():
    global W, FL
    bpy.ops.wm.read_factory_settings(use_empty=True); MATS.clear()
    W, FL = mat('P_wax', (.95, .9, .78)), mat('P_flame', (1., .78, .35))
    return mat('P_wood', (.8, .5, .27)), mat('P_wood2', (.7, .42, .22)), mat('P_iron', (.2, .21, .28)), mat('P_brass', (.85, .62, .25))
def export(name):
    bpy.ops.object.select_all(action='SELECT'); bpy.ops.export_scene.gltf(filepath=OUT + name + ".glb", export_format='GLB', export_apply=True)
    print('HERO4', name, len([o for o in bpy.context.scene.objects if o.type == 'MESH']), 'parts')

# CRATE: planked sides with gaps, corner battens, a planked lid, iron corner brackets and two rope-grip slots
W1, W2, IRON, BR = reset(); S = .6
for side in range(4):
    a = side * math.pi / 2; cx, cy = math.cos(a) * S / 2, math.sin(a) * S / 2
    for k in range(3):
        z = .02 + (S - .04) / 3 * (k + .5)
        box(f'plank{side}{k}', (.035, S - .1, (S - .04) / 3 - .012), (cx, cy, z), W1 if (side + k) % 2 else W2, .008, (0, 0, a))
for sx in (-1, 1):
    for sy in (-1, 1):
        box(f'post{sx}{sy}', (.07, .07, S), (sx * (S / 2 - .02), sy * (S / 2 - .02), S / 2), W2, .012)
        for z in (.04, S - .04): box(f'brk{sx}{sy}{z}', (.085, .085, .04), (sx * (S / 2 - .02), sy * (S / 2 - .02), z), IRON, .006)
for k in range(4): box(f'lid{k}', ((S - .02) / 4 - .01, S - .02, .035), (-S / 2 + .01 + (S - .02) / 4 * (k + .5), 0, S + .018), W1 if k % 2 else W2, .008)
box('lidbar', (S - .06, .07, .03), (0, 0, S + .05), W2, .008)
export('crate4')

# CANDLESTICK: a turned brass stick - wide dish base, knopped stem, a drip cup - and a candle with its flame
W1, W2, IRON, BR = reset()
lathe('stick', [(0, 0), (.16, 0), (.17, .02), (.12, .04), (.05, .06), (.045, .12), (.065, .15), (.04, .18), (.035, .3), (.06, .33), (.04, .36), (.1, .38), (.1, .4), (0, .4)], BR, 40)
candle(0, 0, .4, .04, .22)
export('candlestick4')

# PICTURE FRAME: a wide moulded gilt frame (stepped profile) and a canvas facing -y (the room)
W1, W2, IRON, BR = reset(); CAN = mat('P_canvas', (1, 1, 1))
FW, FH, B = .8, .6, .085
for nm, sz, loc in [('ft', (FW, .05, B), (0, -.03, FH / 2 - B / 2)), ('fb', (FW, .05, B), (0, -.03, -FH / 2 + B / 2)),
                    ('fl', (B, .05, FH), (-FW / 2 + B / 2, -.03, 0)), ('fr', (B, .05, FH), (FW / 2 - B / 2, -.03, 0))]:
    box(nm, sz, (loc[0], loc[1], loc[2] + FH / 2), BR, .018)
for nm, sz, loc in [('it', (FW - B * 1.6, .02, .02), (0, -.06, FH - B)), ('ib', (FW - B * 1.6, .02, .02), (0, -.06, B)),
                    ('il', (.02, .02, FH - B * 1.6), (-FW / 2 + B, -.06, FH / 2)), ('ir', (.02, .02, FH - B * 1.6), (FW / 2 - B, -.06, FH / 2))]:
    box(nm, sz, loc, W2, .006)
bpy.ops.mesh.primitive_plane_add(size=1, location=(0, -.035, FH / 2), rotation=(math.pi / 2, 0, 0)); c = bpy.context.object; c.name = 'canvas'
c.scale = (FW - B * 1.7, FH - B * 1.7, 1); bpy.ops.object.transform_apply(scale=True, rotation=True); finish(c, CAN)
box('back', (FW - .02, .02, FH - .02), (0, -.005, FH / 2), W2, .004)
export('frame4')

# CHANDELIER: a chain, a turned brass hub, six S-curved arms ending in drip cups with candles
W1, W2, IRON, BR = reset()
for k in range(5): lathe(f'link{k}', [(0, 0), (.018, 0), (.018, .045), (0, .045)], IRON, 10, (0, 0, .62 + k * .05))
lathe('hub', [(0, 0), (.03, 0), (.075, .03), (.06, .08), (.03, .12), (.04, .2), (.08, .24), (.05, .29), (.02, .36), (.03, .62), (0, .62)], BR, 36)
for k in range(6):
    a = k * math.pi / 3; ca, sa = math.cos(a), math.sin(a)
    pts = [(ca * r, sa * r, z) for r, z in ((.05, .22), (.12, .17), (.2, .17), (.26, .22), (.28, .29))]
    tube(f'arm{k}', pts, .014, BR)
    lathe(f'cup{k}', [(0, 0), (.045, 0), (.05, .02), (.03, .03), (0, .03)], BR, 20, (ca * .28, sa * .28, .29))
    candle(ca * .28, sa * .28, .32, .022, .11)
export('chandelier4')

# WALL SCONCE: a shaped brass backplate on the wall (y=0), a curved arm out into the room (-y), a cup and a candle
W1, W2, IRON, BR = reset()
pl = lathe('plate', [(0, 0), (.06, 0), (.07, .012), (0, .012)], BR, 32)
pl.rotation_euler = (math.pi / 2, 0, 0); pl.location = (0, -.002, .16); pl.scale = (1, 1.8, 1)
tube('arm', [(0, -.012, .14), (0, -.06, .12), (0, -.1, .12), (0, -.12, .15)], .012, BR)
lathe('cup', [(0, 0), (.05, 0), (.055, .025), (.03, .035), (0, .035)], BR, 24, (0, -.12, .15))
candle(0, -.12, .18, .025, .1)
export('sconce4')
print('HEROES4_DONE')
