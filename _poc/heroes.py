# POC round 4: four hero props designed from scratch for the references' illustrated 3D look.
#   blender.exe -b --factory-startup -P heroes.py
# Shape language taken from the references: chunky but elegant proportions, generous rounded bevels, clean surfaces,
# a few deliberate details that say what the thing is (staves + hoops, a turned pedestal, a peaked iron lantern with a
# ring, a curved chair back with slats). Materials are named P_* so the renderer gives each one its own look.
import bpy, bmesh, math, os
import os as _os; POC = _os.path.dirname(_os.path.abspath(__file__)).replace(chr(92), '/') + '/'   # the _poc folder (this script's folder)
from mathutils import Vector, Matrix
OUT = POC + "downloads/hero/"; os.makedirs(OUT, exist_ok=True)
MATS = {}
def mat(name, col):
    if name not in MATS:
        m = bpy.data.materials.new(name); m.use_nodes = True; m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (*col, 1); MATS[name] = m
    return MATS[name]
def finish(o, m, bevel=.0, seg=3, smooth=True):
    o.data.materials.append(m)
    if bevel: b = o.modifiers.new('bev', 'BEVEL'); b.width = bevel; b.segments = seg; b.limit_method = 'ANGLE'; b.angle_limit = math.radians(35)
    if smooth:
        for p in o.data.polygons: p.use_smooth = True
        o.modifiers.new('wn', 'WEIGHTED_NORMAL').keep_sharp = True
    return o
def obj_from_bm(name, bm):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); o = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(o); return o
def box(name, size, loc, m, bevel=.01, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot); o = bpy.context.object; o.name = name; o.scale = size
    bpy.ops.object.transform_apply(scale=True); return finish(o, m, bevel)
def lathe(name, prof, m, seg=40, bevel=0):           # prof: [(r, z)] bottom to top -> a turned (spun) solid
    bm = bmesh.new(); rings = []
    for r, z in prof: rings.append([bm.verts.new((r * math.cos(2 * math.pi * k / seg), r * math.sin(2 * math.pi * k / seg), z)) for k in range(seg)])
    for a, b in zip(rings, rings[1:]):
        for k in range(seg): bm.faces.new((a[k], a[(k + 1) % seg], b[(k + 1) % seg], b[k]))
    bm.faces.new(list(reversed(rings[0]))); bm.faces.new(rings[-1]); return finish(obj_from_bm(name, bm), m, bevel)
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True); MATS.clear()
def export(name):
    bpy.ops.object.select_all(action='SELECT'); bpy.ops.export_scene.gltf(filepath=OUT + name + ".glb", export_format='GLB', export_apply=True)
    print('HERO', name, sum(len(o.data.polygons) for o in bpy.context.scene.objects if o.type == 'MESH'), 'faces (before bevels)')

# ---------------- 1. BARREL: 16 bulging staves with small gaps, 4 thick iron hoops, a planked lid, a bung ----------------
reset()
W1, W2, IRON, BRASS = mat('P_wood', (.80, .50, .27)), mat('P_wood2', (.72, .43, .22)), mat('P_iron', (.20, .21, .28)), mat('P_brass', (.85, .62, .25))
H, R, N, BUL = 1.0, .36, 16, .13
rad = lambda z: R * (1 + BUL * math.sin(math.pi * z / H))
for i in range(N):
    a0, a1 = 2 * math.pi * (i + .035) / N, 2 * math.pi * (i + .965) / N; bm = bmesh.new(); cols = []
    for j in range(13):
        z = H * j / 12; ro, ri = rad(z), rad(z) - .045
        cols.append([bm.verts.new((r * math.cos(a), r * math.sin(a), z)) for r, a in ((ro, a0), (ro, a1), (ri, a1), (ri, a0))])
    for a, b in zip(cols, cols[1:]):
        for k in range(4): bm.faces.new((a[k], a[(k + 1) % 4], b[(k + 1) % 4], b[k]))
    bm.faces.new(list(reversed(cols[0]))); bm.faces.new(cols[-1])
    finish(obj_from_bm(f'stave{i}', bm), W1 if i % 2 else W2, .008)
for z in (.1, .3, .7, .9):
    r0 = rad(z) + .004; lathe(f'hoop{z}', [(r0 - .01, z - .035), (r0 + .016, z - .035), (r0 + .022, z), (r0 + .016, z + .035), (r0 - .01, z + .035)], IRON, 48, .004)
for k in range(4):                                   # lid planks, set a little below the rim
    w = 2 * R * .92 / 4; x = -R * .92 + w * (k + .5); half = math.sqrt(max(.001, (R * .93) ** 2 - x * x))
    box(f'lid{k}', (w - .012, 2 * half, .03), (x, 0, H - .05), W1 if k % 2 else W2, .006)
lathe('bung', [(.045, .0), (.045, .025), (.03, .035), (0, .035)], W2, 24, .004).location = (0, .2, H - .04)
export('barrel')

# ---------------- 2. TABLE: thick round top with a rounded rim, an apron, a turned pedestal, four curved feet ----------------
reset()
TOP, LEG = mat('P_wood', (.70, .40, .22)), mat('P_wood2', (.56, .31, .17))
lathe('top', [(0, .74), (.58, .74), (.62, .76), (.62, .8), (.6, .83), (0, .83)], TOP, 72, .006)
lathe('apron', [(.5, .69), (.53, .69), (.53, .745), (.5, .745)], LEG, 64, .004)
lathe('pedestal', [(.0, .1), (.13, .1), (.15, .14), (.11, .2), (.085, .3), (.12, .38), (.12, .43), (.075, .5), (.07, .62), (.1, .67), (.14, .7), (0, .7)], LEG, 40, .006)
for k in range(4):
    a = math.pi / 4 + k * math.pi / 2; bm = bmesh.new(); prof = []
    for j in range(9):                                # a foot that sweeps out and down, thick at the hub
        t = j / 8; d = .1 + .34 * t; zt = .2 - .17 * t ** .7; th = .07 - .03 * t; w = .055 - .015 * t
        c = Vector((d * math.cos(a), d * math.sin(a), zt)); s = Vector((-math.sin(a), math.cos(a), 0)) * w
        prof.append([bm.verts.new(c - s), bm.verts.new(c + s), bm.verts.new(c + s + Vector((0, 0, th))), bm.verts.new(c - s + Vector((0, 0, th)))])
    for p, q2 in zip(prof, prof[1:]):
        for m in range(4): bm.faces.new((p[m], p[(m + 1) % 4], q2[(m + 1) % 4], q2[m]))
    bm.faces.new(list(reversed(prof[0]))); bm.faces.new(prof[-1])
    finish(obj_from_bm(f'foot{k}', bm), LEG, .012)
    lathe(f'toe{k}', [(0, 0), (.045, 0), (.05, .02), (.035, .035), (0, .035)], LEG, 20, .003).location = (.44 * math.cos(a), .44 * math.sin(a), 0)
export('table')

# ---------------- 3. LANTERN: iron frame, peaked roof, chimney, ring handle, glass, a candle and its flame ----------------
reset()
IRON, GLASS, WAX, FLAME, BR = mat('P_iron', (.18, .19, .26)), mat('P_glass', (1., .86, .55)), mat('P_wax', (.95, .9, .78)), mat('P_flame', (1., .78, .35)), mat('P_brass', (.85, .62, .25))
box('base', (.32, .32, .05), (0, 0, .025), IRON, .012); box('base2', (.27, .27, .03), (0, 0, .065), BR, .008)
for sx in (-1, 1):
    for sy in (-1, 1): box(f'post{sx}{sy}', (.03, .03, .42), (sx * .125, sy * .125, .29), IRON, .006)
for z in (.08, .5): box(f'ring{z}', (.29, .29, .025), (0, 0, z), IRON, .006)
for k in range(4):                                    # glass panes, with a thin cross bar on each
    a = k * math.pi / 2; c = Vector((math.cos(a) * .118, math.sin(a) * .118, .29))
    g = box(f'glass{k}', (.008, .22, .4), c, GLASS, 0, (0, 0, a)); bar = box(f'bar{k}', (.012, .23, .018), c + Vector((math.cos(a), math.sin(a), 0)) * .006, IRON, .003, (0, 0, a))
bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=.23, radius2=.05, depth=.16, location=(0, 0, .59), rotation=(0, 0, math.pi / 4)); finish(bpy.context.object, IRON, .01)
lathe('chimney', [(.045, .66), (.05, .66), (.05, .72), (.075, .74), (.06, .76), (0, .76)], IRON, 24, .004)
bpy.ops.mesh.primitive_torus_add(major_radius=.075, minor_radius=.014, location=(0, 0, .84), rotation=(math.pi / 2, 0, 0)); finish(bpy.context.object, IRON)
lathe('candle', [(0, .08), (.045, .08), (.045, .2), (.035, .215), (0, .215)], WAX, 24, .003)
lathe('flame', [(0, .215), (.022, .24), (.02, .27), (0, .31)], FLAME, 20)
export('lantern')

# ---------------- 4. CHAIR: splayed tapered legs, stretchers, a thick seat, two back posts, a curved top rail, slats ----------------
reset()
WD, WD2 = mat('P_wood', (.74, .45, .25)), mat('P_wood2', (.6, .34, .18))
def leg(name, p0, p1, r0, r1, m):
    d = Vector(p1) - Vector(p0); bpy.ops.mesh.primitive_cylinder_add(vertices=14, radius=1, depth=1); o = bpy.context.object; o.name = name
    for v in o.data.vertices: v.co = Vector((v.co.x * (r0 if v.co.z < 0 else r1), v.co.y * (r0 if v.co.z < 0 else r1), (v.co.z + .5) * d.length))
    o.rotation_mode = 'QUATERNION'; o.rotation_quaternion = d.to_track_quat('Z', 'Y'); o.location = p0; return finish(o, m, .004)
for sx in (-1, 1):
    for sy in (-1, 1):
        top = (sx * .2, sy * .19, .45); bot = (sx * .25, sy * .24, 0); leg(f'leg{sx}{sy}', bot, top, .032, .026, WD2)
for sy in (-1, 1): leg(f'str{sy}', (-.23, sy * .215, .14), (.23, sy * .215, .14), .016, .016, WD2)
leg('strx', (0, -.215, .14), (0, .215, .14), .015, .015, WD2)
box('seat', (.5, .48, .06), (0, 0, .48), WD, .02)
for sx in (-1, 1): leg(f'backpost{sx}', (sx * .2, -.2, .5), (sx * .215, -.27, 1.02), .028, .024, WD2)
bm = bmesh.new(); prof = []                            # the curved top rail: a thick bow between the posts
for j in range(13):
    t = j / 12; x = -.25 + .5 * t; y = -.27 + .045 * math.sin(math.pi * t); z = .93 + .04 * math.sin(math.pi * t)
    prof.append([bm.verts.new((x, y + dy, z + dz)) for dy, dz in ((-.025, -.06), (.025, -.06), (.025, .06), (-.025, .06))])
for p, q2 in zip(prof, prof[1:]):
    for m in range(4): bm.faces.new((p[m], p[(m + 1) % 4], q2[(m + 1) % 4], q2[m]))
bm.faces.new(list(reversed(prof[0]))); bm.faces.new(prof[-1]); finish(obj_from_bm('toprail', bm), WD, .015)
for k, x in enumerate((-.1, 0, .1)): box(f'slat{k}', (.055, .025, .38), (x, -.235 - .012 * (1 - abs(x) * 5), .7), WD, .008, (math.radians(-6), 0, 0))
export('chair')
print('HEROES_DONE')
