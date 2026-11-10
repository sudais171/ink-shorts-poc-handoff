# POC round 6: the chair redesigned for every angle (side view first), the table's proportions corrected, and the
# distressed scanned cabinet replaced by a sideboard designed to the barrel standard (ASSET_STANDARD.md).
#   blender.exe -b --factory-startup -P heroes3.py
import bpy, bmesh, math, os
import os as _os; POC = _os.path.dirname(_os.path.abspath(__file__)).replace(chr(92), '/') + '/'   # the _poc folder (this script's folder)
from mathutils import Vector
OUT = POC + "downloads/hero/"; os.makedirs(OUT, exist_ok=True)
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
def box(name, size, loc, m, bevel=.012, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot); o = bpy.context.object; o.name = name; o.scale = size
    bpy.ops.object.transform_apply(scale=True); return finish(o, m, bevel)
def tapered(name, x, y, z0, z1, w0, w1, m, bevel=.014, lean=(0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1); o = bpy.context.object; o.name = name
    for v in o.data.vertices:
        t = v.co.z + .5; w = w0 + (w1 - w0) * t
        v.co = Vector((x + v.co.x * w + lean[0] * (t - 1), y + v.co.y * w + lean[1] * (t - 1), z0 + (z1 - z0) * t))
    return finish(o, m, bevel)
def sweep(name, pts, wx, wy, m, bevel=.012):
    """a square-section piece following pts [(x, y, z)], wx wide (x) and wy deep (perpendicular to the path in y-z)"""
    bm = bmesh.new(); rings = []
    for i, p in enumerate(pts):
        a = Vector(pts[max(0, i - 1)]); b = Vector(pts[min(len(pts) - 1, i + 1)]); d = (b - a).normalized()
        side = Vector((1, 0, 0)); nrm = d.cross(side).normalized(); c = Vector(p)
        rings.append([bm.verts.new(c + side * sx * wx / 2 + nrm * sy * wy / 2) for sx, sy in ((-1, -1), (1, -1), (1, 1), (-1, 1))])
    for r0, r1 in zip(rings, rings[1:]):
        for k in range(4): bm.faces.new((r0[k], r0[(k + 1) % 4], r1[(k + 1) % 4], r1[k]))
    bm.faces.new(list(reversed(rings[0]))); bm.faces.new(rings[-1])
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); bmesh.ops if False else None
    o = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(o)
    bpy.context.view_layer.objects.active = o; o.select_set(True); bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.normals_make_consistent(inside=False); bpy.ops.object.mode_set(mode='OBJECT'); o.select_set(False)
    return finish(o, m, bevel)
def dome(name, loc, r, m, sz=.55):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, segments=14, ring_count=8, location=loc); o = bpy.context.object; o.name = name
    o.scale = (1, 1, sz); bpy.ops.object.transform_apply(scale=True); return finish(o, m)
def export(name):
    bpy.ops.object.select_all(action='SELECT'); bpy.ops.export_scene.gltf(filepath=OUT + name + ".glb", export_format='GLB', export_apply=True)
    print('HERO3', name, len([o for o in bpy.context.scene.objects if o.type == 'MESH']), 'parts')
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True); MATS.clear()
    return mat('P_wood', (.80, .50, .27)), mat('P_wood2', (.70, .42, .22)), mat('P_iron', (.20, .21, .28))

# ---------------- TABLE: same construction as round 5, table proportions (top ~ 1.35 x height, legs set in, deeper top) ----------------
W1, W2, IRON = reset()
L, TW, TH, H = 1.06, .74, .075, .8
n = 5; pw = (TW - .06) / n
for i in range(n):
    box(f'plank{i}', (L - .2, pw - .01, TH), (0, -TW / 2 + .03 + pw * (i + .5), H - TH / 2), W1 if i % 2 else W2, .014)
for sx in (-1, 1):
    box(f'cleat{sx}', (.1, TW + .02, TH + .012), (sx * (L / 2 - .05), 0, H - TH / 2 - .004), W2, .016)
    for i in range(n): dome(f'peg{sx}{i}', (sx * (L / 2 - .05), -TW / 2 + .03 + pw * (i + .5), H + .004), .013, IRON)
lx, ly = L / 2 - .16, TW / 2 - .12
for sx in (-1, 1):
    for sy in (-1, 1):
        tapered(f'leg{sx}{sy}', sx * lx, sy * ly, 0, H - TH, .085, .108, W2, .016)
        bpy.ops.mesh.primitive_cylinder_add(vertices=4, radius=.068, depth=.06, location=(sx * lx, sy * ly, .03), rotation=(0, 0, math.pi / 4)); finish(bpy.context.object, IRON, .01)
for sx in (-1, 1): box(f'apron_s{sx}', (.045, 2 * ly - .06, .11), (sx * lx, 0, H - TH - .055), W1, .01)
for sy in (-1, 1): box(f'apron_l{sy}', (2 * lx - .06, .045, .11), (0, sy * ly, H - TH - .055), W1, .01)
for sx in (-1, 1): box(f'stretch_s{sx}', (.06, 2 * ly - .05, .06), (sx * lx, 0, .2), W1, .012)
box('stretch_mid', (2 * lx - .05, .06, .06), (0, 0, .2), W1, .012)
export('table3')

# ---------------- CHAIR: designed for the side view - rear legs that sweep up and back into the back posts, a thick ----------------
# ---------------- planked seat on an apron, a deep curved back (rails and slats follow a curve), stretchers at two heights ----------------
W1, W2, IRON = reset()
SH, ST = .47, .07
# rear leg + back post in one swept piece: foot kicked back, straight through the seat, then raked back to the cap
rear = [(0, -.3, 0), (0, -.25, .2), (0, -.22, .42), (0, -.24, .62), (0, -.28, .82), (0, -.32, 1.0)]
for sx in (-1, 1):
    sweep(f'rear{sx}', [(sx * .21, y, z) for _, y, z in rear], .068, .062, W2, .016)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=.05, segments=16, ring_count=10, location=(sx * .21, -.325, 1.035)); o = bpy.context.object
    o.scale = (1, 1, .85); bpy.ops.object.transform_apply(scale=True); finish(o, W1)
    tapered(f'front{sx}', sx * .21, .19, 0, SH - ST, .068, .078, W2, .014, lean=(-sx * .025, -.03))
# seat: 3 planks with gaps and a rounded front edge, sitting on an apron (seat + apron = a seat with real body)
for i in range(3):
    x = -.25 + .5 / 3 * (i + .5); box(f'seat{i}', (.5 / 3 - .005, .5, ST), (x, -.02, SH - ST / 2), W1 if i % 2 else W2, .012)
box('apron_f', (.44, .04, .08), (0, .2, SH - ST - .04), W1, .01); box('apron_b', (.4, .04, .08), (0, -.23, SH - ST - .04), W1, .01)
for sx in (-1, 1): box(f'apron_s{sx}', (.04, .42, .08), (sx * .21, -.02, SH - ST - .04), W1, .01)
for sx in (-1, 1):
    dome(f'pegf{sx}', (sx * .2, .19, SH + .003), .012, IRON); dome(f'pegb{sx}', (sx * .2, -.22, SH + .003), .012, IRON)
# back: a deep arched top rail and a mid rail, both bowed backwards in plan (depth from the side), slats following the bow
def bowed(name, z, hgt, depth, arch, m, cut=False):
    pts = []; bm = bmesh.new(); prof = []
    for j in range(17):
        t = j / 16; x = -.24 + .48 * t; zc = z + arch * math.sin(math.pi * t)
        yb = -.28 - (zc - .82) * .22 - .035 * math.sin(math.pi * t)          # follows the post rake, bowed back in the middle
        prof.append([bm.verts.new((x, yb + dy, zc + dz)) for dy, dz in ((-depth / 2, -hgt / 2), (depth / 2, -hgt / 2), (depth / 2, hgt / 2), (-depth / 2, hgt / 2))])
    for p, q2 in zip(prof, prof[1:]):
        for k in range(4): bm.faces.new((p[k], p[(k + 1) % 4], q2[(k + 1) % 4], q2[k]))
    bm.faces.new(list(reversed(prof[0]))); bm.faces.new(prof[-1])
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); o = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(o)
    if cut:
        bpy.ops.mesh.primitive_cube_add(size=1, location=(0, -.36, z + arch * .95), rotation=(0, math.pi / 4, 0)); c = bpy.context.object; c.scale = (.065, .4, .065)
        bo = o.modifiers.new('cut', 'BOOLEAN'); bo.object = c; bo.operation = 'DIFFERENCE'
        bpy.context.view_layer.objects.active = o; bpy.ops.object.modifier_apply(modifier='cut'); bpy.data.objects.remove(c, do_unlink=True)
    return finish(o, m, .014)
bowed('toprail', .9, .14, .065, .045, W1, cut=True)
bowed('midrail', .62, .06, .05, .0, W1)
for k, t in enumerate((.3, .5, .7)):                     # three slats between the rails, on the same bow
    x = -.24 + .48 * t; yb = -.28 - (.76 - .82) * .22 - .035 * math.sin(math.pi * t)
    box(f'slat{k}', (.06, .03, .24), (x, yb, .76), W2, .01, (math.radians(-12), 0, 0))
# stretchers: sides low, front higher (classic), all set into the legs
for sx in (-1, 1): box(f'str_s{sx}', (.042, .44, .05), (sx * .215, -.03, .15), W1, .01)
box('str_f', (.42, .045, .05), (0, .18, .24), W1, .01); box('str_b', (.42, .045, .05), (0, -.26, .2), W1, .01)
export('chair3')

# ---------------- SIDEBOARD: painted carcass, a thick wood top with an overhang, framed panel doors, a drawer row, ----------------
# ---------------- iron ring pulls and strap hinges, a plinth on bun feet ----------------
W1, W2, IRON = reset(); PAINT, PAINT2 = mat('P_paint', (.24, .45, .52)), mat('P_paint2', (.2, .38, .45))
CW, CD, CH = 1.0, .42, .78
box('top', (CW + .06, CD + .05, .05), (0, -.01, CH - .025), W1, .018)
box('body', (CW, CD, CH - .17), (0, 0, .12 + (CH - .17) / 2), PAINT2, .012)
for sx in (-1, 1): box(f'stile{sx}', (.06, .03, CH - .17), (sx * (CW / 2 - .03), -CD / 2 - .01, .12 + (CH - .17) / 2), PAINT, .01)
box('rail_top', (CW, .03, .05), (0, -CD / 2 - .01, CH - .075), PAINT, .01); box('rail_mid', (CW, .03, .04), (0, -CD / 2 - .01, CH - .2), PAINT, .01)
box('rail_bot', (CW, .03, .05), (0, -CD / 2 - .01, .145), PAINT, .01)
for k, x in enumerate((-.25, .25)):                      # two drawers in the top row
    box(f'drawer{k}', (.42, .03, .08), (x, -CD / 2 - .025, CH - .135), PAINT, .012)
    bpy.ops.mesh.primitive_torus_add(major_radius=.022, minor_radius=.006, location=(x, -CD / 2 - .045, CH - .14), rotation=(math.pi / 2, 0, 0)); finish(bpy.context.object, IRON)
for k, x in enumerate((-.235, .235)):                    # two framed panel doors
    box(f'door{k}', (.43, .03, .41), (x, -CD / 2 - .025, .39), PAINT, .012)
    box(f'panel{k}', (.31, .02, .29), (x, -CD / 2 - .045, .39), PAINT2, .02)
    bpy.ops.mesh.primitive_torus_add(major_radius=.026, minor_radius=.007, location=(x - math.copysign(.17, x), -CD / 2 - .06, .39), rotation=(math.pi / 2, 0, 0)); finish(bpy.context.object, IRON)
    for z in (.27, .51): box(f'hinge{k}{z}', (.09, .008, .025), (x + math.copysign(.18, x), -CD / 2 - .045, z), IRON, .004)
box('plinth', (CW + .02, CD + .02, .06), (0, 0, .09), W2, .012)
for sx in (-1, 1):
    for sy in (-1, 1): dome(f'foot{sx}{sy}', (sx * (CW / 2 - .06), sy * (CD / 2 - .05), .04), .05, W2, 1.0)
export('cabinet3')
print('HEROES3_DONE')
