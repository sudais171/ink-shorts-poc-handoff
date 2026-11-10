# POC round 10: the courtroom. Same production system as the saloon (build_room3.py): bevelled-box architecture,
# designed props placed from a list, ambient occlusion baked into vertex colours, one .glb out.
#   blender.exe -b --factory-startup -P build_court.py -- <samples>
import bpy, bmesh, json, sys, time, os, math
import os as _os; POC = _os.path.dirname(_os.path.abspath(__file__)).replace(chr(92), '/') + '/'   # the _poc folder (this script's folder)
from mathutils import Vector
ROOT = POC + ""
SAMPLES = int(sys.argv[sys.argv.index('--') + 1]) if '--' in sys.argv else 32
T = {}; t0 = time.time()
def mark(k):
    global t0; T[k] = round(time.time() - t0, 1); t0 = time.time()
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene; sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = SAMPLES; sc.cycles.use_denoising = False
B = lambda x, y, z: (x, -z, y)                       # three (x, y up, z toward camera) -> Blender
MATS = {}
def mat(name, col=(.8, .8, .8)):
    if name not in MATS:
        m = bpy.data.materials.new(name); m.use_nodes = True; m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (*col, 1); MATS[name] = m
    return MATS[name]
def box(name, x0, x1, y0, y1, z0, z1, m, bevel=0.0, seg=2):
    bpy.ops.mesh.primitive_cube_add(size=1); o = bpy.context.object; o.name = name
    o.scale = ((x1 - x0), (z1 - z0), (y1 - y0)); o.location = B((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)
    bpy.ops.object.transform_apply(scale=True); o.data.materials.append(m)
    if bevel: b = o.modifiers.new('bev', 'BEVEL'); b.width = bevel; b.segments = seg; b.limit_method = 'ANGLE'
    return o
def grid(name, corner, u, v, m, step=.06, flip=False):
    nu, nv = max(2, int(Vector(u).length / step)), max(2, int(Vector(v).length / step))
    me = bpy.data.meshes.new(name); bm = bmesh.new(); c, U, Vv = Vector(B(*corner)), Vector(B(*u)), Vector(B(*v))
    vs = [[bm.verts.new(c + U * (i / nu) + Vv * (j / nv)) for i in range(nu + 1)] for j in range(nv + 1)]
    for j in range(nv):
        for i in range(nu): bm.faces.new((vs[j][i], vs[j][i + 1], vs[j + 1][i + 1], vs[j + 1][i]) if not flip else (vs[j][i], vs[j + 1][i], vs[j + 1][i + 1], vs[j][i + 1]))
    bm.to_mesh(me); bm.free(); o = bpy.data.objects.new(name, me); sc.collection.objects.link(o); me.materials.append(m)
    return o
def lathe(name, prof, m, seg=24, loc=(0, 0, 0)):
    bm = bmesh.new(); rings = []
    for r, z in prof: rings.append([bm.verts.new((r * math.cos(2 * math.pi * k / seg), r * math.sin(2 * math.pi * k / seg), z)) for k in range(seg)])
    for a, b in zip(rings, rings[1:]):
        for k in range(seg): bm.faces.new((a[k], a[(k + 1) % seg], b[(k + 1) % seg], b[k]))
    bm.faces.new(list(reversed(rings[0]))); bm.faces.new(rings[-1])
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); o = bpy.data.objects.new(name, me); sc.collection.objects.link(o)
    o.location = B(*loc); o.data.materials.append(m)
    for p in o.data.polygons: p.use_smooth = True
    return o
X0, X1, Z0, Z1, H = -2.6, 2.6, -2.4, 2.6, 2.3
mFloor, mWall, mPanel, mTrim, mCeil, mBeam, mDoor, mGlass, mGold, mRun, mBan, mSeal, mCurt, mDais = (mat('S_floor'), mat('S_wall'), mat('S_panel'), mat('S_trim'),
    mat('S_ceiling'), mat('S_beam'), mat('S_door'), mat('S_glass'), mat('S_gold'), mat('S_runner'), mat('S_banner'), mat('S_seal'), mat('S_curtain'), mat('S_dais'))
WIN = [(-1.25, -.35), (.55, 1.45)]; WY0, WY1 = .55, 1.85; DZ0, DZ1, DH = .75, 1.65, 1.6
# ---- shell ----
grid('floor', (X0, 0, Z1), (X1 - X0, 0, 0), (0, 0, Z0 - Z1), mFloor)
grid('ceiling', (X0, H, Z0), (X1 - X0, 0, 0), (0, 0, Z1 - Z0), mCeil, flip=True)
grid('wall_back', (X0, 0, Z0), (X1 - X0, 0, 0), (0, H, 0), mWall, flip=True)
grid('wall_front', (X1, 0, Z1), (X0 - X1, 0, 0), (0, H, 0), mWall, flip=True)
zs = [Z1] + [z for w in reversed(WIN) for z in (w[1], w[0])] + [Z0]           # left wall, broken by the windows
for k in range(0, len(zs), 2):
    grid(f'wall_l{k}', (X0, 0, zs[k]), (0, 0, zs[k + 1] - zs[k]), (0, H, 0), mWall)
for w0, w1 in WIN:
    grid(f'wall_lb{w0}', (X0, 0, w1), (0, 0, w0 - w1), (0, WY0, 0), mWall); grid(f'wall_lt{w0}', (X0, WY1, w1), (0, 0, w0 - w1), (0, H - WY1, 0), mWall)
grid('wall_r0', (X1, 0, Z0), (0, 0, DZ0 - Z0), (0, H, 0), mWall, flip=True); grid('wall_r1', (X1, 0, DZ1), (0, 0, Z1 - DZ1), (0, H, 0), mWall, flip=True)
grid('wall_r2', (X1, DH, DZ0), (0, 0, DZ1 - DZ0), (0, H - DH, 0), mWall, flip=True)
# ---- tall wainscot: framed raised panels up to 1.0, a moulded rail, a skirting, a gilt cornice under the ceiling ----
WT = 1.0
def wains(axis, fixed, a0, a1, inward):
    def bx(n, u0, u1, y0, y1, d0, d1, m, bev):
        d0, d1 = sorted((fixed + d0 * inward, fixed + d1 * inward))
        return box(n, u0, u1, y0, y1, d0, d1, m, bev) if axis == 'x' else box(n, d0, d1, y0, y1, u0, u1, m, bev)
    bx('wain', a0, a1, 0, WT, 0, .014, mPanel, 0)
    bx('rail', a0, a1, WT - .02, WT + .03, 0, .04, mTrim, .008); bx('railgold', a0, a1, WT + .03, WT + .04, 0, .03, mGold, .003)
    bx('skirt', a0, a1, 0, .1, 0, .03, mTrim, .006)
    bx('cornice', a0, a1, H - .1, H, 0, .06, mTrim, .01); bx('cornicegold', a0, a1, H - .13, H - .1, 0, .035, mGold, .004)
    n = max(1, round((a1 - a0) / .5)); w = (a1 - a0) / n
    for i in range(n):
        u0 = a0 + i * w + .04; u1 = a0 + (i + 1) * w - .04
        bx('pframe', u0, u1, .16, WT - .08, .014, .024, mTrim, .006)
        bx('pfield', u0 + .04, u1 - .04, .2, WT - .12, .014, .036, mPanel, .014)
wains('x', Z0, X0, X1, 1); wains('x', Z1, X1 * -1 + 0, X1, -1) if False else wains('x', Z1, X0, X1, -1)
wains('z', X1, Z0, DZ0 - .1, -1); wains('z', X1, DZ1 + .1, Z1, -1)
zl = [Z0, WIN[0][0] - .08, WIN[0][1] + .08, WIN[1][0] - .08, WIN[1][1] + .08, Z1]
for k in range(0, len(zl), 2): wains('z', X0, zl[k], zl[k + 1], 1)
for w0, w1 in WIN: wains('z', X0, w0 - .08, w1 + .08, 1) if False else box('sillwain', X0, X0 + .014, 0, WY0 - .05, w0 - .08, w1 + .08, mPanel)
# ---- pilasters on the back wall with gilt capitals, a seal and two banners behind the bench ----
for x in (-2.0, -1.0, 1.0, 2.0):
    box(f'pil{x}', x - .09, x + .09, 0, H - .13, Z0, Z0 + .08, mTrim, .012)
    box(f'pcap{x}', x - .12, x + .12, H - .3, H - .22, Z0, Z0 + .11, mGold, .01); box(f'pbase{x}', x - .12, x + .12, 0, .16, Z0, Z0 + .11, mTrim, .01)
seal = lathe('seal', [(0, 0), (.36, 0), (.38, .03), (.36, .06), (0, .06)], mGold, 48, (0, 1.7, Z0 + .01)); seal.rotation_euler = (math.pi / 2, 0, 0); seal.location = B(0, 1.7, Z0 + .01)
seal2 = lathe('seal2', [(0, 0), (.3, 0), (.3, .02), (0, .02)], mSeal, 48, (0, 1.7, Z0 + .07)); seal2.rotation_euler = (math.pi / 2, 0, 0); seal2.location = B(0, 1.7, Z0 + .065)
for k in range(12):
    a = k * math.pi / 6; box(f'star{k}', math.cos(a) * .22 - .02, math.cos(a) * .22 + .02, 1.7 + math.sin(a) * .22 - .02, 1.7 + math.sin(a) * .22 + .02, Z0 + .08, Z0 + .095, mGold, .004)
box('sealcentre', -.08, .08, 1.62, 1.78, Z0 + .08, Z0 + .1, mGold, .02)
for x in (-.7, .7):
    box(f'ban{x}', x - .17, x + .17, 1.02, 2.05, Z0 + .02, Z0 + .04, mBan, .004)
    box(f'banrod{x}', x - .22, x + .22, 2.05, 2.08, Z0 + .02, Z0 + .07, mGold, .005)
    for k in range(9): box(f'fringe{x}{k}', x - .16 + k * .04, x - .14 + k * .04, .96, 1.03, Z0 + .03, Z0 + .045, mGold, .002)
    box(f'banstripe{x}', x - .17, x + .17, 1.75, 1.8, Z0 + .041, Z0 + .045, mGold, .002)
# ---- the dais the bench stands on, with a moulded edge and a front step ----
box('dais', -1.6, 1.6, 0, .25, Z0, -1.1, mDais, .01); box('daisedge', -1.62, 1.62, .22, .26, -1.12, -1.08, mGold, .006)
box('daisstep', -.6, .6, 0, .12, -1.1, -.92, mDais, .01)
# ---- the bar: a balustrade across the room with a gate gap at the aisle ----
for xa, xb in ((-2.5, -.45), (.45, 2.5)):
    box(f'bartop{xa}', xa, xb, .5, .56, .4, .48, mTrim, .012); box(f'barbase{xa}', xa, xb, 0, .06, .41, .47, mTrim, .008)
    n = int((xb - xa) / .14)
    for k in range(n + 1): lathe(f'bal{xa}{k}', [(.018, 0), (.026, .06), (.018, .14), (.03, .26), (.018, .38), (.022, .44), (0, .44)], mTrim, 12, (xa + (xb - xa) * k / n, .06, .44))
    for x in (xa, xb): box(f'barpost{x}', x - .04, x + .04, 0, .62, .4, .48, mTrim, .01); lathe(f'barfin{x}', [(0, 0), (.04, 0), (.045, .02), (.02, .05), (0, .07)], mGold, 16, (x, .62, .44))
# ---- the aisle runner ----
box('runner', -.42, .42, 0, .01, .5, Z1 - .2, mRun, .003); box('runner2', -.42, .42, 0, .01, -1.08, .38, mRun, .003)
# ---- windows on the left wall: deep reveals, frames, a transom, glazing bars, a valance ----
for w0, w1 in WIN:
    box('sill', X0, X0 + .12, WY0 - .05, WY0, w0 - .05, w1 + .05, mTrim, .01)
    for z in (w0 - .05, w1): box('jamb', X0 - .03, X0 + .04, WY0, WY1, z, z + .05, mTrim, .008)
    box('head', X0 - .03, X0 + .04, WY1, WY1 + .06, w0 - .05, w1 + .05, mTrim, .008)
    box('transom', X0 - .02, X0 + .015, 1.42, 1.46, w0, w1, mTrim, .004)
    box('mull', X0 - .02, X0 + .015, WY0, WY1, (w0 + w1) / 2 - .015, (w0 + w1) / 2 + .015, mTrim, .004)
    for y in (.85, 1.15): box('bar', X0 - .02, X0 + .015, y - .01, y + .01, w0, w1, mTrim, .003)
    box('glass', X0 - .006, X0 - .004, WY0, WY1, w0, w1, mGlass)
    box('valance', X0, X0 + .1, WY1 + .02, WY1 + .2, w0 - .12, w1 + .12, mCurt, .02)
    box('valgold', X0 + .1, X0 + .105, WY1 + .02, WY1 + .05, w0 - .12, w1 + .12, mGold, .003)
# ---- a double door on the right wall: architrave, a pediment, two panelled leaves, brass pulls ----
for z in (DZ0 - .1, DZ1): box('arch', X1 - .03, X1, 0, DH + .1, z, z + .1, mTrim, .01)
box('archtop', X1 - .04, X1, DH, DH + .12, DZ0 - .14, DZ1 + .14, mTrim, .012); box('pedi', X1 - .06, X1, DH + .12, DH + .2, DZ0 - .2, DZ1 + .2, mGold, .01)
for z0, z1 in ((DZ0, (DZ0 + DZ1) / 2 - .005), ((DZ0 + DZ1) / 2 + .005, DZ1)):
    box('leaf', X1 - .02, X1 + .02, 0, DH, z0, z1, mDoor, .006)
    for y0, y1 in ((.1, .7), (.82, 1.5)): box('dpan', X1 - .035, X1 - .02, y0, y1, z0 + .06, z1 - .06, mDoor, .012)
    lathe('pull', [(0, 0), (.02, 0), (.022, .03), (0, .03)], mGold, 12, (X1 - .05, .8, (z0 + z1) / 2 + (.05 if z0 > DZ0 else -.05)))
# ---- coffered ceiling: walnut beams both ways with a gilt bead, cream coffers ----
for x in [X0 + 1.04 * (i + 1) for i in range(4)]: box('beamx', x - .06, x + .06, H - .16, H, Z0, Z1, mBeam, .014)
for z in [Z0 + 1.0 * (i + 1) for i in range(4)]: box('beamz', X0, X1, H - .12, H, z - .05, z + .05, mBeam, .012)
for x in [X0 + 1.04 * (i + 1) for i in range(4)]: box('beadx', x - .065, x + .065, H - .17, H - .16, Z0, Z1, mGold, .002)
mark('build room')
# ---- props ----
PROPS = json.load(open(ROOT + "court_layout.json"))
tops = {}
def place(item):
    path = ROOT + item["file"]; at, rot = item["at"], item["rot"]; before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path); new = [o for o in set(bpy.data.objects) - before]
    root = bpy.data.objects.new(item["role"], None); sc.collection.objects.link(root)
    for o in new:
        if o.parent is None: o.parent = root
    bpy.context.view_layer.update()
    zs = [(o.matrix_world @ Vector(c)).z for o in new if o.type == 'MESH' for c in o.bound_box]; s = item.get("s") or item["h"] / (max(zs) - min(zs))
    root.scale = (s, s, s); root.rotation_euler = (0, 0, rot); bpy.context.view_layer.update()
    zs = [(o.matrix_world @ Vector(c)).z for o in new if o.type == 'MESH' for c in o.bound_box]
    y = at[1] if isinstance(at[1], (int, float)) else (H - .02 - (max(zs) - min(zs)) if at[1] == 'CEIL' else tops.get(at[1], 0))
    root.location = Vector(B(at[0], 0, at[2])) + Vector((0, 0, y - min(zs))); bpy.context.view_layer.update()
    zs = [(o.matrix_world @ Vector(c)).z for o in new if o.type == 'MESH' for c in o.bound_box]
    tops[item["role"].upper()] = max(zs); tops[item["role"].upper() + "_LOW"] = min(zs)
for item in PROPS: place(item)
json.dump(tops, open(ROOT + "tops_court.json", "w")); mark('place props')
meshes = [o for o in bpy.data.objects if o.type == 'MESH']
for o in meshes:
    bpy.context.view_layer.objects.active = o
    for md in list(o.modifiers): bpy.ops.object.modifier_apply(modifier=md.name)
nv = sum(len(o.data.vertices) for o in meshes); mark('apply')
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; sc.world.light_settings.distance = .35
for o in meshes:
    if 'bake' not in o.data.color_attributes: o.data.color_attributes.new('bake', 'FLOAT_COLOR', 'POINT')
    o.data.color_attributes.active_color = o.data.color_attributes['bake']
bpy.ops.object.select_all(action='DESELECT')
for o in meshes: o.select_set(True)
bpy.context.view_layer.objects.active = meshes[0]
bpy.ops.object.bake(type='AO', target='VERTEX_COLORS'); mark('AO bake')
os.makedirs(ROOT + "court", exist_ok=True)
bpy.ops.export_scene.gltf(filepath=ROOT + "court/room_court.glb", export_format='GLB', export_vertex_color='ACTIVE', export_apply=True, export_lights=False, export_cameras=False)
mark('export')
print('COURT_RESULT', {'samples': SAMPLES, 'meshes': len(meshes), 'verts': nv, 'tops': {k: round(v, 3) for k, v in tops.items()}, **T})
