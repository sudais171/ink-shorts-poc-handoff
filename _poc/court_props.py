# POC round 10: courtroom props, built with the same asset standard (ASSET_STANDARD.md) and the same helpers as the
# saloon props. Built directly in person units (1 = a person's height). Front = -Y (Blender) = toward the camera (+z).
#   blender.exe -b --factory-startup -P court_props.py
import bpy, bmesh, math, os
import os as _os; POC = _os.path.dirname(_os.path.abspath(__file__)).replace(chr(92), '/') + '/'   # the _poc folder (this script's folder)
from mathutils import Vector
OUT = POC + "downloads/court/"; os.makedirs(OUT, exist_ok=True)
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
def box(name, size, loc, m, bevel=.008, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot); o = bpy.context.object; o.name = name; o.scale = size
    bpy.ops.object.transform_apply(scale=True); return finish(o, m, bevel)
def bx(name, x0, x1, y0, y1, z0, z1, m, bevel=.008): return box(name, (x1 - x0, y1 - y0, z1 - z0), ((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), m, bevel)
def lathe(name, prof, m, seg=32, loc=(0, 0, 0), rot=None):
    bm = bmesh.new(); rings = []
    for r, z in prof: rings.append([bm.verts.new((r * math.cos(2 * math.pi * k / seg), r * math.sin(2 * math.pi * k / seg), z)) for k in range(seg)])
    for a, b in zip(rings, rings[1:]):
        for k in range(seg): bm.faces.new((a[k], a[(k + 1) % seg], b[(k + 1) % seg], b[k]))
    bm.faces.new(list(reversed(rings[0]))); bm.faces.new(rings[-1])
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); o = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(o)
    if rot: o.rotation_euler = rot
    o.location = loc; return finish(o, m)
def dome(name, loc, r, m, sz=.6):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, segments=14, ring_count=8, location=loc); o = bpy.context.object; o.name = name
    o.scale = (1, 1, sz); bpy.ops.object.transform_apply(scale=True); return finish(o, m)
def profile(name, pts, x0, x1, m, bevel=.008):
    """a flat shape drawn in the Y-Z plane (pts = [(y, z)]), extruded along X from x0 to x1"""
    bm = bmesh.new(); vs = [bm.verts.new((x0, y, z)) for y, z in pts]; f = bm.faces.new(vs)
    r = bmesh.ops.extrude_face_region(bm, geom=[f]); nv = [e for e in r['geom'] if isinstance(e, bmesh.types.BMVert)]
    for v in nv: v.co.x = x1
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); o = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(o)
    return finish(o, m, bevel)
def panel_front(prefix, x0, x1, z0, z1, y, M1, M2, GOLD=None):
    """a framed raised panel on a front face at depth y (front = -Y): stiles, rails, a bevelled raised field"""
    t = .028; bx(prefix + 'st0', x0, x0 + .04, y - t, y, z0, z1, M1); bx(prefix + 'st1', x1 - .04, x1, y - t, y, z0, z1, M1)
    bx(prefix + 'rl0', x0, x1, y - t, y, z0, z0 + .045, M1); bx(prefix + 'rl1', x0, x1, y - t, y, z1 - .045, z1, M1)
    bx(prefix + 'field', x0 + .065, x1 - .065, y - .022, y, z0 + .07, z1 - .07, M2, .012)
    if GOLD: bx(prefix + 'bead', x0 + .05, x1 - .05, y - .016, y - .01, z0 + .055, z0 + .062, GOLD, .002)
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True); MATS.clear()
    return (mat('P_wood', (.55, .3, .17)), mat('P_wood2', (.45, .23, .13)), mat('P_brass', (.85, .62, .25)), mat('P_leather', (.5, .12, .15)),
            mat('P_iron', (.2, .21, .28)))
def export(name):
    bpy.ops.object.select_all(action='SELECT'); bpy.ops.export_scene.gltf(filepath=OUT + name + ".glb", export_format='GLB', export_apply=True)
    vs = [o.matrix_world @ v.co for o in bpy.context.scene.objects if o.type == 'MESH' for v in o.data.vertices]
    print('COURT', name, len([o for o in bpy.context.scene.objects if o.type == 'MESH']), 'parts, height', round(max(v.z for v in vs) - min(v.z for v in vs), 3))

# ---------- JUDGE'S BENCH: a tall centre desk with two lower clerk wings, raised-panel front, pilasters with gilt ----------
# ---------- capitals, a thick overhanging top with a leather inset, a gilt emblem on the centre panel, a plinth ----------
W1, W2, GOLD, LEA, IRON = reset()
CW, D, CH, WW, WH = 1.0, .55, .55, .5, .42           # centre width, depth, centre height, wing width, wing height
def desk(prefix, x0, x1, h, emblem=False):
    bx(prefix + 'plinth', x0 - .02, x1 + .02, -D / 2 - .03, D / 2, 0, .06, W2, .01)
    bx(prefix + 'body', x0, x1, -D / 2, D / 2, .06, h - .05, W2, .006)
    n = max(1, round((x1 - x0) / .34)); w = (x1 - x0) / n
    for i in range(n): panel_front(f'{prefix}p{i}', x0 + i * w + .03, x0 + (i + 1) * w - .03, .1, h - .1, -D / 2, W1, W2, GOLD)
    for x in [x0 + i * w for i in range(n + 1)]:
        bx(prefix + f'pil{x:.2f}', x - .028, x + .028, -D / 2 - .03, -D / 2 + .01, .06, h - .06, W1, .008)
        bx(prefix + f'cap{x:.2f}', x - .036, x + .036, -D / 2 - .038, -D / 2 + .012, h - .1, h - .07, GOLD, .006)
    bx(prefix + 'top', x0 - .05, x1 + .05, -D / 2 - .07, D / 2 + .02, h - .05, h, W1, .016)
    bx(prefix + 'topedge', x0 - .05, x1 + .05, -D / 2 - .074, -D / 2 - .066, h - .035, h - .02, GOLD, .003)
    if emblem:
        lathe(prefix + 'emb', [(0, 0), (.075, 0), (.08, .012), (.07, .02), (0, .02)], GOLD, 40, (0, -D / 2 - .03, (h - .06) / 2 + .06), (math.pi / 2, 0, 0))
        lathe(prefix + 'emb2', [(0, 0), (.045, 0), (.045, .012), (0, .012)], LEA, 32, (0, -D / 2 - .045, (h - .06) / 2 + .06), (math.pi / 2, 0, 0))
desk('c', -CW / 2, CW / 2, CH, emblem=True)
bx('inset', -CW / 2 + .06, CW / 2 - .06, -D / 2 + .04, D / 2 - .1, CH - .002, CH + .004, LEA, .004)       # leather writing inset
for s in (-1, 1): desk(f'w{s}', s * CW / 2 if s > 0 else -CW / 2 - WW, CW / 2 + WW if s > 0 else -CW / 2, WH)
export('judge_bench')

# ---------- JUDGE'S CHAIR: a throne-like high back - leather seat and buttoned back, rolled arms on turned supports, ----------
# ---------- back posts with gilt finials, an arched crest rail with a gilt emblem ----------
W1, W2, GOLD, LEA, IRON = reset()
SH = .3
for sx in (-1, 1):
    for sy in (-1, 1):
        lathe(f'leg{sx}{sy}', [(.03, 0), (.036, .02), (.03, .06), (.025, .15), (.03, .2), (.034, SH - .06), (0, SH - .06)], W2, 20, (sx * .22, sy * .2, 0))
        lathe(f'foot{sx}{sy}', [(0, 0), (.04, 0), (.042, .012), (0, .012)], GOLD, 20, (sx * .22, sy * .2, 0))
bx('seatframe', -.26, .26, -.24, .24, SH - .07, SH - .02, W1, .012)
bx('seat', -.235, .235, -.235, .215, SH - .03, SH + .045, LEA, .03)                                   # a deep leather cushion
for sx in (-1, 1):
    bx(f'post{sx}', sx * .25 - .032, sx * .25 + .032, .2, .26, SH - .05, 1.0, W2, .014)
    lathe(f'fin{sx}', [(0, 0), (.035, 0), (.04, .02), (.02, .05), (.03, .075), (0, .1)], GOLD, 24, (sx * .25, .23, 1.0))
    # rolled arm on a turned support
    lathe(f'armpost{sx}', [(.022, 0), (.03, .03), (.02, .1), (.026, .16), (0, .16)], W2, 18, (sx * .245, -.17, SH + .02))
    bx(f'arm{sx}', sx * .245 - .04, sx * .245 + .04, -.24, .22, SH + .17, SH + .22, W1, .02)
    bx(f'armpad{sx}', sx * .245 - .03, sx * .245 + .03, -.2, .2, SH + .215, SH + .24, LEA, .012)
    bpy.ops.mesh.primitive_cylinder_add(vertices=20, radius=.035, depth=.085, location=(sx * .245, -.24, SH + .195), rotation=(0, math.pi / 2, 0)); finish(bpy.context.object, W1)
bx('back', -.21, .21, .21, .25, SH + .05, .9, LEA, .03)                                                 # leather back panel
for i in range(3):
    for j in range(4): dome(f'btn{i}{j}', (-.12 + .12 * i, .207, SH + .14 + .13 * j), .012, GOLD, .7)
bm = bmesh.new(); prof = []                                                                               # arched crest rail
for k in range(17):
    t = k / 16; x = -.28 + .56 * t; z = .9 + .09 * math.sin(math.pi * t)
    prof.append([bm.verts.new((x, y, z + dz)) for y, dz in ((.2, -.05), (.26, -.05), (.26, .05), (.2, .05))])
for p, q in zip(prof, prof[1:]):
    for m in range(4): bm.faces.new((p[m], p[(m + 1) % 4], q[(m + 1) % 4], q[m]))
bm.faces.new(list(reversed(prof[0]))); bm.faces.new(prof[-1])
me = bpy.data.meshes.new('crest'); bm.to_mesh(me); bm.free(); cr = bpy.data.objects.new('crest', me); bpy.context.scene.collection.objects.link(cr); finish(cr, W1, .014)
lathe('crestemb', [(0, 0), (.055, 0), (.06, .012), (.05, .02), (0, .02)], GOLD, 36, (0, .195, .98), (math.pi / 2, 0, 0))
export('judge_chair')

# ---------- WITNESS STAND: a raised platform, a panelled enclosure open at the back, a moulded top rail with a gilt bead, ----------
# ---------- a small bench inside ----------
W1, W2, GOLD, LEA, IRON = reset()
PW, PD, PH, EH = .62, .55, .08, .55
bx('platform', -PW / 2 - .03, PW / 2 + .03, -PD / 2 - .03, PD / 2 + .03, 0, PH, W2, .012)
bx('step', -.18, .18, PD / 2 + .03, PD / 2 + .15, 0, PH / 2, W2, .01)
bx('front', -PW / 2, PW / 2, -PD / 2, -PD / 2 + .04, PH, EH, W2, .006); panel_front('fp', -PW / 2 + .02, PW / 2 - .02, PH + .04, EH - .06, -PD / 2, W1, W2, GOLD)
for s in (-1, 1):
    bx(f'side{s}', s * PW / 2 - .02, s * PW / 2 + .02, -PD / 2, PD / 2 - .1, PH, EH, W2, .006)
    bx(f'cpost{s}', s * PW / 2 - .035, s * PW / 2 + .035, -PD / 2 - .035, -PD / 2 + .035, PH, EH + .03, W1, .01)
    lathe(f'cfin{s}', [(0, 0), (.03, 0), (.034, .015), (.018, .04), (0, .055)], GOLD, 20, (s * PW / 2, -PD / 2, EH + .03))
bx('rail_f', -PW / 2 - .04, PW / 2 + .04, -PD / 2 - .045, -PD / 2 + .045, EH - .01, EH + .03, W1, .012)
for s in (-1, 1): bx(f'rail_s{s}', s * PW / 2 - .035, s * PW / 2 + .035, -PD / 2, PD / 2 - .1, EH - .01, EH + .03, W1, .012)
bx('bead', -PW / 2 - .04, PW / 2 + .04, -PD / 2 - .049, -PD / 2 - .043, EH + .005, EH + .015, GOLD, .002)
bx('bench', -.2, .2, .05, .2, PH + .24, PH + .28, W1, .01)
for s in (-1, 1): bx(f'bleg{s}', s * .17 - .02, s * .17 + .02, .08, .17, PH, PH + .24, W2, .006)
export('witness_stand')

# ---------- PEW: shaped scroll ends, a thick seat, a raked two-plank back, a leather seat pad, a hymn-shelf rail ----------
W1, W2, GOLD, LEA, IRON = reset()
PL = 1.5
end = [(-.2, 0), (.2, 0), (.2, .2), (.24, .5), (.27, .58), (.22, .62), (.16, .56), (.12, .3), (-.14, .3), (-.2, .26)]   # (y, z): front (-y) to back
for s in (-1, 1): profile(f'end{s}', end, s * PL / 2 - .025, s * PL / 2 + .025, W2, .012)
bx('seat', -PL / 2, PL / 2, -.2, .14, .26, .3, W1, .014)
bx('pad', -PL / 2 + .03, PL / 2 - .03, -.18, .12, .3, .32, LEA, .01)
for k, z in enumerate((.36, .47)):
    bx(f'back{k}', -PL / 2, PL / 2, .14 + (z - .3) * .25, .17 + (z - .3) * .25, z - .045, z + .045, W1, .012)
bx('rail', -PL / 2, PL / 2, .19, .22, .54, .57, W2, .01)
bx('stretcher', -PL / 2, PL / 2, -.02, .02, .06, .1, W2, .01)
for s in (-1, 1): dome(f'boss{s}', (s * (PL / 2 + .026), .22, .55), .018, GOLD, 1.0)
export('pew')

# ---------- GAVEL (grip at the origin, handle along +X, head axis vertical at -X) and SOUND BLOCK ----------
W1, W2, GOLD, LEA, IRON = reset()
lathe('handle', [(0, 0), (.011, 0), (.013, .05), (.011, .11), (.016, .135), (.016, .15), (0, .16)], W1, 20, (-.045, 0, 0), (0, math.pi / 2, 0))
lathe('head', [(0, 0), (.024, 0), (.026, .006), (.026, .069), (.024, .075), (0, .075)], W2, 28, (-.07, 0, -.0375))
for z in (-.022, .016): lathe(f'band{z}', [(.0265, 0), (.0275, .002), (.0275, .006), (.0265, .008)], GOLD, 28, (-.07, 0, z))
export('gavel')
W1, W2, GOLD, LEA, IRON = reset()
lathe('block', [(0, 0), (.05, 0), (.052, .006), (.05, .016), (.044, .022), (0, .022)], W2, 36)
lathe('ring', [(.0505, .006), (.0515, .008), (.0515, .013), (.0505, .015)], GOLD, 36)
export('block')

# ---------- EVIDENCE: a lidded box with a brass label plate and tag, a stack of papers, a brass magnifier ----------
W1, W2, GOLD, LEA, IRON = reset(); PAP = mat('P_paper', (.94, .9, .8)); TAG = mat('P_tag', (.85, .7, .4))
bx('box', -.11, .11, -.08, .08, 0, .1, W2, .01); bx('lid', -.115, .115, -.085, .085, .1, .125, W1, .012)
bx('plate', -.04, .04, -.083, -.079, .045, .07, GOLD, .002)
bx('tag', .118, .124, -.02, .03, .03, .09, TAG, .002)
for k in range(4): bx(f'paper{k}', .17 - .003 * k, .37 + .004 * k, -.1 + .002 * k, .12 - .003 * k, .004 * k, .004 * k + .004, PAP, .001)
lathe('lensring', [(.04, 0), (.048, 0), (.048, .012), (.04, .012)], GOLD, 32, (-.24, .06, .004))
lathe('lens', [(0, 0), (.04, 0), (.04, .006), (0, .006)], mat('P_glass', (.8, .9, .95)), 32, (-.24, .06, .007))
bx('maghandle', -.33, -.285, .04, .08, .002, .018, W1, .006)
export('evidence')

# ---------- BANKER'S LAMP: brass base and stem, a green glass shade, a pull chain ----------
W1, W2, GOLD, LEA, IRON = reset(); GRN = mat('P_green', (.12, .45, .28))
lathe('base', [(0, 0), (.08, 0), (.085, .012), (.06, .03), (0, .03)], GOLD, 36)
lathe('stem', [(.012, .03), (.012, .2), (0, .2)], GOLD, 16)
bx('yoke', -.1, .1, -.008, .008, .19, .205, GOLD, .003)
bm = bmesh.new(); seg = 16; rings = []                     # half-cylinder shade along X
for k in range(seg + 1):
    a = math.pi * k / seg; rings.append([bm.verts.new((x, .06 * math.cos(a), .2 + .055 * math.sin(a))) for x in (-.13, .13)])
for a, b in zip(rings, rings[1:]): bm.faces.new((a[0], a[1], b[1], b[0]))
me = bpy.data.meshes.new('shade'); bm.to_mesh(me); bm.free(); sh = bpy.data.objects.new('shade', me); bpy.context.scene.collection.objects.link(sh)
so = sh.modifiers.new('sol', 'SOLIDIFY'); so.thickness = .006; finish(sh, GRN)
for x in (-.13, .13): bx(f'cap{x}', x - .004, x + .004, -.065, .065, .195, .26, GOLD, .002)
export('desk_lamp')
print('COURT_DONE')
