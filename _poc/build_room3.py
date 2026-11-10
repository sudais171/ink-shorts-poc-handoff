# POC round 2: build the parlour in Blender (bevelled mouldings, panels, door, window, ceiling), place the Poly Haven
# models from layout.json, swap their colour maps for the painted versions, bake lighting into vertex colours (two
# bakes: FULL = direct + indirect, IND = indirect only) and export one .glb per bake.
#   blender.exe -b --factory-startup -P build_room.py -- <samples>
import bpy, bmesh, json, sys, time, os, math
import os as _os; POC = _os.path.dirname(_os.path.abspath(__file__)).replace(chr(92), '/') + '/'   # the _poc folder (this script's folder)
from mathutils import Vector
ROOT = POC + ""
ARGS = sys.argv[sys.argv.index('--') + 1:]; SAMPLES = int(ARGS[0]); SET = ARGS[1]; BAKE = ARGS[2] if len(ARGS) > 2 else 'full'
L = json.load(open(ROOT + "layout.json")); RM, WI, DO = L["room"], L["window"], L["door"]
T = {}; t0 = time.time()
def mark(k):
    global t0; T[k] = round(time.time() - t0, 1); t0 = time.time()
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene; sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = SAMPLES; sc.cycles.use_denoising = False
B = lambda x, y, z: (x, -z, y)                       # three (x, y up, z toward camera) -> Blender (x, y, z up)
MATS = {}
def mat(name, col=(.8, .8, .8)):
    if name not in MATS:
        m = bpy.data.materials.new(name); m.use_nodes = True; m.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (*col, 1); MATS[name] = m
    return MATS[name]
def box(name, x0, x1, y0, y1, z0, z1, m, bevel=0.0, seg=2):
    bpy.ops.mesh.primitive_cube_add(size=1); o = bpy.context.object; o.name = name
    o.scale = ((x1 - x0), (z1 - z0), (y1 - y0)); o.location = B((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)
    bpy.ops.object.transform_apply(scale=True)
    o.data.materials.append(m)
    if bevel: b = o.modifiers.new('bev', 'BEVEL'); b.width = bevel; b.segments = seg; b.limit_method = 'ANGLE'
    return o
def grid(name, corner, u, v, m, step=.05):          # a flat surface (floor, wall, ceiling) dense enough to hold baked light
    nu, nv = max(2, int(Vector(u).length / step)), max(2, int(Vector(v).length / step))
    me = bpy.data.meshes.new(name); bm = bmesh.new(); c, U, Vv = Vector(B(*corner)), Vector(B(*u)), Vector(B(*v))
    vs = [[bm.verts.new(c + U * (i / nu) + Vv * (j / nv)) for i in range(nu + 1)] for j in range(nv + 1)]
    for j in range(nv):
        for i in range(nu): bm.faces.new((vs[j][i], vs[j][i + 1], vs[j + 1][i + 1], vs[j + 1][i]))
    bm.to_mesh(me); bm.free(); o = bpy.data.objects.new(name, me); sc.collection.objects.link(o); me.materials.append(m)
    return o
X0, X1, Z0, Z1, H = RM["x0"], RM["x1"], RM["z0"], RM["z1"], RM["h"]
mFloor, mPaper, mPanel, mTrim, mCeil, mBeam, mDoor, mGlass, mBrass = (mat('S_floor', (.55, .35, .2)), mat('S_wallpaper', (.75, .5, .4)), mat('S_panel', (.35, .22, .14)),
    mat('S_trim', (.3, .18, .1)), mat('S_ceiling', (.45, .3, .2)), mat('S_beam', (.28, .17, .1)), mat('S_door', (.4, .24, .14)), mat('S_glass', (.7, .85, .9)), mat('S_brass', (.8, .6, .25)))
# ---- shell: floor, ceiling planks, walls with a window (left) and a door (back); faces point into the room ----
grid('floor', (X0, 0, Z1), (X1 - X0, 0, 0), (0, 0, Z0 - Z1), mFloor)
grid('ceiling', (X0, H, Z0), (X1 - X0, 0, 0), (0, 0, Z1 - Z0), mCeil)
grid('wall_back_a', (X0, 0, Z0), (DO["x0"] - X0, 0, 0), (0, H, 0), mPaper); grid('wall_back_b', (DO["x1"], 0, Z0), (X1 - DO["x1"], 0, 0), (0, H, 0), mPaper)
grid('wall_back_c', (DO["x0"], DO["y1"], Z0), (DO["x1"] - DO["x0"], 0, 0), (0, H - DO["y1"], 0), mPaper)
grid('wall_left_a', (X0, 0, Z1), (0, 0, WI["z1"] - Z1), (0, H, 0), mPaper); grid('wall_left_b', (X0, 0, WI["z0"]), (0, 0, Z0 - WI["z0"]), (0, H, 0), mPaper)
grid('wall_left_c', (X0, 0, WI["z1"]), (0, 0, WI["z0"] - WI["z1"]), (0, WI["y0"], 0), mPaper); grid('wall_left_d', (X0, WI["y1"], WI["z1"]), (0, 0, WI["z0"] - WI["z1"]), (0, H - WI["y1"], 0), mPaper)
grid('wall_right', (X1, 0, Z0), (0, 0, Z1 - Z0), (0, H, 0), mPaper)
for o in bpy.data.objects:                           # flip faces so they face into the room where needed
    if o.name in ('ceiling', 'wall_back_a', 'wall_back_b', 'wall_back_c', 'wall_right'):
        bpy.context.view_layer.objects.active = o; o.select_set(True); bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.flip_normals(); bpy.ops.object.mode_set(mode='OBJECT'); o.select_set(False)
# ---- wainscot: raised, bevelled panels in frames, a moulded chair rail, a skirting board, a crown moulding ----
def wainscot(axis, fixed, a0, a1, inward):
    def bx(n, u0, u1, y0, y1, d0, d1, m, bev):
        d0, d1 = sorted((fixed + d0 * inward, fixed + d1 * inward))
        return box(n, u0, u1, y0, y1, d0, d1, m, bev) if axis == 'x' else box(n, d0, d1, y0, y1, u0, u1, m, bev)
    bx('wain_back', a0, a1, 0, .52, 0, .012, mPanel, 0)
    bx('rail', a0, a1, .5, .545, 0, .035, mTrim, .008); bx('rail_lip', a0, a1, .535, .555, 0, .045, mBrass if SET in ('hero4', 'hero5') else mTrim, .006)
    bx('skirt', a0, a1, 0, .075, 0, .028, mTrim, .006); bx('skirt_top', a0, a1, .07, .085, 0, .02, mTrim, .004)
    bx('crown', a0, a1, H - .07, H, 0, .045, mTrim, .01); bx('crown2', a0, a1, H - .1, H - .07, 0, .025, mBrass if SET in ('hero4', 'hero5') else mTrim, .006)
    n = max(1, round((a1 - a0) / .42)); w = (a1 - a0) / n
    for i in range(n):
        u0 = a0 + i * w + .035; u1 = a0 + (i + 1) * w - .035
        bx('pframe', u0, u1, .12, .45, .012, .02, mTrim, .006)
        bx('panel', u0 + .03, u1 - .03, .15, .42, .012, .032, mPanel, .012)
wainscot('x', Z0, X0, DO["x0"] - .07, 1); wainscot('x', Z0, DO["x1"] + .07, X1, 1)
wainscot('z', X0, Z0, WI["z0"] - .06, 1); wainscot('z', X0, WI["z1"] + .06, Z1, 1); wainscot('z', X1, Z0, Z1, -1)
# ---- the door: architrave, a panelled leaf, brass knob ----
for x in (DO["x0"] - .07, DO["x1"]): box('architrave', x, x + .07, 0, DO["y1"] + .07, Z0, Z0 + .03, mTrim, .008)
box('architrave_top', DO["x0"] - .1, DO["x1"] + .1, DO["y1"], DO["y1"] + .1, Z0, Z0 + .04, mTrim, .01)
R7 = SET in ('hero4', 'hero5')
if not R7: box('door_leaf', DO["x0"], DO["x1"], 0, DO["y1"], Z0 - .03, Z0 - .005, mDoor, .004)
else:
    mHall = mat('S_hall', (.8, .6, .35)); lw = DO["x1"] - DO["x0"]
    box('door_leaf', DO["x0"] - .005, DO["x0"] + .025, 0, DO["y1"], Z0 + .01, Z0 + .01 + lw, mDoor, .004)       # swung open into the room
    for z0, z1 in ((.06, lw / 2 - .02), (lw / 2 + .02, lw - .06)):
        for y0, y1 in ((.1, .52), (.62, 1.12)): box('door_panel', DO["x0"] + .025, DO["x0"] + .035, y0, y1, Z0 + .01 + z0, Z0 + .01 + z1, mDoor, .008)
    xa, xb, D2 = DO["x0"] - .3, DO["x1"] + .3, 1.4
    grid('hall_floor', (xa, 0, Z0), (xb - xa, 0, 0), (0, 0, -D2), mFloor)
    box('hall_l', xa - .05, xa, 0, H, Z0 - D2, Z0, mHall, 0); box('hall_r', xb, xb + .05, 0, H, Z0 - D2, Z0, mHall, 0)
    box('hall_end', xa, xb, 0, H, Z0 - D2 - .05, Z0 - D2, mHall, 0); box('hall_ceil', xa, xb, H, H + .05, Z0 - D2, Z0, mCeil, 0)
    box('hall_wain', xa, xb, 0, .5, Z0 - D2, Z0 - D2 + .02, mPanel, .004); box('hall_rail', xa, xb, .5, .54, Z0 - D2, Z0 - D2 + .04, mBrass, .006)
for y0, y1 in (((.08, .5), (.6, 1.14)) if not R7 else ()):
    for x0, x1 in ((DO["x0"] + .05, (DO["x0"] + DO["x1"]) / 2 - .025), ((DO["x0"] + DO["x1"]) / 2 + .025, DO["x1"] - .05)):
        box('door_panel', x0, x1, y0, y1, Z0 - .005, Z0 + .005, mDoor, .01)
if not R7: bpy.ops.mesh.primitive_uv_sphere_add(radius=.022, location=B(DO["x1"] - .07, .55, Z0 + .02)); bpy.context.object.data.materials.append(mBrass); bpy.context.object.name = 'knob'
# ---- the window: frame, glazing bars, a deep sill, glass ----
wz0, wz1, wy0, wy1 = WI["z0"], WI["z1"], WI["y0"], WI["y1"]
box('win_sill', X0, X0 + .09, wy0 - .04, wy0, wz0 - .08, wz1 + .08, mTrim, .01)
for z in (wz0 - .05, wz1): box('win_jamb', X0 - .03, X0 + .03, wy0, wy1, z, z + .05, mTrim, .008)
box('win_head', X0 - .03, X0 + .03, wy1, wy1 + .06, wz0 - .05, wz1 + .05, mTrim, .008)
box('win_mull', X0 - .02, X0 + .01, wy0, wy1, (wz0 + wz1) / 2 - .015, (wz0 + wz1) / 2 + .015, mTrim, .004)
for y in (wy0 + (wy1 - wy0) / 3, wy0 + 2 * (wy1 - wy0) / 3): box('win_bar', X0 - .02, X0 + .01, y - .012, y + .012, wz0, wz1, mTrim, .003)
box('glass', X0 - .006, X0 - .004, wy0, wy1, wz0, wz1, mGlass, 0)
# ---- ceiling: main beams with joists between ----
for x in [X0 + .6 + i * 1.2 for i in range(3)]: box('beam', x - .05, x + .05, H - .13, H, Z0, Z1, mBeam, .012)
for z in [Z0 + .5 + i * .55 for i in range(6)]: box('joist', X0, X1, H - .05, H, z - .025, z + .025, mBeam, .006)
# ---- curtains: two folded cloth panels each side of the window on a brass rod; a woven rug under the table ----
mCurt, mRug = mat('S_curtain', (.6, .1, .1)), mat('S_rug', (.6, .2, .15))
def curtain(name, z0, z1):
    nu, nv = 36, 30; me = bpy.data.meshes.new(name); bm = bmesh.new()
    vs = [[bm.verts.new(B(X0 + .07 + .028 * (1 + math.sin(i / nu * (z1 - z0) / .09 * 2 * math.pi)) * (.6 + .4 * j / nv), .06 + 1.47 * j / nv, z0 + (z1 - z0) * i / nu)) for i in range(nu + 1)] for j in range(nv + 1)]
    for j in range(nv):
        for i in range(nu): bm.faces.new((vs[j][i], vs[j][i + 1], vs[j + 1][i + 1], vs[j + 1][i]))
    bm.to_mesh(me); bm.free(); o = bpy.data.objects.new(name, me); sc.collection.objects.link(o); me.materials.append(mCurt)
    so = o.modifiers.new('sol', 'SOLIDIFY'); so.thickness = .008
curtain('curtain_a', WI["z0"] - .34, WI["z0"] + .02); curtain('curtain_b', WI["z1"] - .02, WI["z1"] + .34)
bpy.ops.mesh.primitive_cylinder_add(radius=.012, depth=WI["z1"] - WI["z0"] + .9, location=B(X0 + .07, 1.55, (WI["z0"] + WI["z1"]) / 2), rotation=(math.pi / 2, 0, 0))
bpy.context.object.data.materials.append(mBrass); bpy.context.object.name = 'rod'
box('rug', -1.32, .14, 0, .012, -.42, .5, mRug, .004)
mark('build room')
# ---- models (Poly Haven, metres -> person units), painted colour maps ----
tops = {}
def place(item):
    path = ROOT + item["file"]; at, rot = item["at"], item["rot"]; before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path); new = [o for o in set(bpy.data.objects) - before]
    root = bpy.data.objects.new(item["role"], None); sc.collection.objects.link(root)
    for o in new:
        if o.parent is None: o.parent = root
    bpy.context.view_layer.update()
    zs = [(o.matrix_world @ Vector(c)).z for o in new if o.type == 'MESH' for c in o.bound_box]; s = item["h"] / (max(zs) - min(zs))
    root.scale = (s, s, s); root.rotation_euler = (0, 0, rot); bpy.context.view_layer.update()
    zs = [(o.matrix_world @ Vector(c)).z for o in new if o.type == 'MESH' for c in o.bound_box]
    y = at[1] if isinstance(at[1], (int, float)) else (H - .02 - (max(zs) - min(zs)) if at[1] == 'CEIL' else tops.get(at[1], 0))
    root.location = Vector(B(at[0], 0, at[2])) + Vector((0, 0, y - min(zs))); bpy.context.view_layer.update()
    zs = [(o.matrix_world @ Vector(c)).z for o in new if o.type == 'MESH' for c in o.bound_box]
    tops[item["role"].upper()] = max(zs); tops[item["role"].upper() + "_LOW"] = min(zs)
for item in L["sets"][SET]: place(item)
for im in bpy.data.images:
    if im.filepath and "_diff_1k" in im.filepath:
        p = bpy.path.abspath(im.filepath).replace("_diff_1k.jpg", "_paint.png")
        if os.path.exists(p): im.filepath = p; im.reload()
json.dump(tops, open(ROOT + f"tops_{SET}.json", "w")); mark('import models')
# ---- lights: the sun (same direction as the renderer's), the lantern, a soft sky ----
sv = Vector(B(*L["sun"])).normalized(); sun = bpy.data.lights.new('sun', 'SUN'); sun.energy = 4.5; sun.angle = .05
so = bpy.data.objects.new('sun', sun); sc.collection.objects.link(so); so.rotation_euler = sv.to_track_quat('Z', 'Y').to_euler()
lp = L["lantern_light"]; ln = bpy.data.lights.new('lantern', 'POINT'); ln.energy = 25; ln.color = (1, .62, .3); ln.shadow_soft_size = .05
lo = bpy.data.objects.new('lantern', ln); sc.collection.objects.link(lo); lo.location = B(lp[0], tops["TABLE"] + .12, lp[2])
ch = bpy.data.lights.new('chand', 'POINT'); ch.energy = 30; ch.color = (1, .7, .4); ch.shadow_soft_size = .1
co = bpy.data.objects.new('chand', ch); sc.collection.objects.link(co); co.location = B(-.62, tops.get('CHANDELIER_LOW', 1.2) + .1, 0)
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; bg = w.node_tree.nodes['Background']; bg.inputs[0].default_value = (.55, .7, .9, 1); bg.inputs[1].default_value = .6
# ---- bake light into vertex colours on every mesh ----
meshes = [o for o in bpy.data.objects if o.type == 'MESH']
for o in meshes:                                     # apply bevels so the baked vertices are the exported ones
    bpy.context.view_layer.objects.active = o
    for md in list(o.modifiers): bpy.ops.object.modifier_apply(modifier=md.name)
nv = sum(len(o.data.vertices) for o in meshes); mark('lights + apply')
def bake(passes, tag):
    for o in meshes:
        if 'bake' not in o.data.color_attributes: o.data.color_attributes.new('bake', 'FLOAT_COLOR', 'POINT')
        o.data.color_attributes.active_color = o.data.color_attributes['bake']
    bpy.ops.object.select_all(action='DESELECT')
    for o in meshes: o.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    if BAKE == 'ao': sc.world.light_settings.distance = .35; bpy.ops.object.bake(type='AO', target='VERTEX_COLORS')
    else: bpy.ops.object.bake(type='DIFFUSE', pass_filter=passes, target='VERTEX_COLORS')
    mark('bake ' + tag)
    bpy.ops.export_scene.gltf(filepath=ROOT + "scene3/room_" + SET + ("_ao" if BAKE == "ao" else "") + ".glb", export_format='GLB', export_vertex_color='ACTIVE', export_apply=True, export_image_format='AUTO', export_lights=False, export_cameras=False)
    mark('export ' + tag)
os.makedirs(ROOT + "scene3", exist_ok=True)
bake({'DIRECT', 'INDIRECT'}, 'full')
print('ROOM_RESULT', {'samples': SAMPLES, 'meshes': len(meshes), 'verts': nv, 'tops': tops, **T})
