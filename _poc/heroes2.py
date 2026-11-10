# POC round 5: the table and chair redesigned to the barrel's standard (ASSET_STANDARD.md).
#   blender.exe -b --factory-startup -P heroes2.py
# Built from real parts with small gaps, chunky (1.3-1.6x real thickness), generous bevels, two close wood tones that
# alternate between parts plus one dark iron contrast material, detail only from construction.
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
    """a square post, w0 wide at the bottom and w1 at the top, leaning by lean (dx, dy) over its height"""
    bpy.ops.mesh.primitive_cube_add(size=1); o = bpy.context.object; o.name = name
    for v in o.data.vertices:
        t = v.co.z + .5; w = w0 + (w1 - w0) * t
        v.co = Vector((x + v.co.x * w + lean[0] * (t - 1), y + v.co.y * w + lean[1] * (t - 1), z0 + (z1 - z0) * t))
    return finish(o, m, bevel)
def dome(name, loc, r, m):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, segments=14, ring_count=8, location=loc); o = bpy.context.object; o.name = name
    o.scale = (1, 1, .55); bpy.ops.object.transform_apply(scale=True); return finish(o, m)
def export(name):
    bpy.ops.object.select_all(action='SELECT'); bpy.ops.export_scene.gltf(filepath=OUT + name + ".glb", export_format='GLB', export_apply=True)
    print('HERO2', name, len([o for o in bpy.context.scene.objects if o.type == 'MESH']), 'parts')

# ---------------- TABLE: a plank top with breadboard ends, chunky tapered legs, aprons, an H-stretcher, iron ferrules ----------------
bpy.ops.wm.read_factory_settings(use_empty=True); MATS.clear()
W1, W2, IRON = mat('P_wood', (.80, .50, .27)), mat('P_wood2', (.70, .42, .22)), mat('P_iron', (.20, .21, .28))
L, TW, TH, H = 1.24, .62, .075, .78                        # top length, width, thickness, height to the top surface
n = 5; pw = (TW - .03 * 2) / n                             # planks between the two end cleats
for i in range(n):
    y = -TW / 2 + .03 + pw * (i + .5)
    box(f'plank{i}', (L - .2, pw - .01, TH), (0, y, H - TH / 2), W1 if i % 2 else W2, .014)
for sx in (-1, 1):                                          # breadboard ends across the planks, a little proud
    box(f'cleat{sx}', (.1, TW + .02, TH + .012), (sx * (L / 2 - .05), 0, H - TH / 2 - .004), W2, .016)
    for i in range(n): dome(f'peg{sx}{i}', (sx * (L / 2 - .05), -TW / 2 + .03 + pw * (i + .5), H + .004), .013, IRON)
lx, ly = L / 2 - .17, TW / 2 - .11
for sx in (-1, 1):
    for sy in (-1, 1):
        tapered(f'leg{sx}{sy}', sx * lx, sy * ly, 0, H - TH, .085, .105, W2, .016)
        bpy.ops.mesh.primitive_cylinder_add(vertices=4, radius=.068, depth=.06, location=(sx * lx, sy * ly, .03), rotation=(0, 0, math.pi / 4))
        finish(bpy.context.object, IRON, .01)            # an iron ferrule on each foot
for sx in (-1, 1): box(f'apron_s{sx}', (.045, 2 * ly - .06, .1), (sx * lx, 0, H - TH - .05), W1, .01)
for sy in (-1, 1): box(f'apron_l{sy}', (2 * lx - .06, .045, .1), (0, sy * ly, H - TH - .05), W1, .01)
for sx in (-1, 1): box(f'stretch_s{sx}', (.06, 2 * ly - .05, .06), (sx * lx, 0, .2), W1, .012)
box('stretch_mid', (2 * lx - .05, .06, .06), (0, 0, .2), W1, .012)
export('table2')

# ---------------- CHAIR: plank seat, chunky splayed legs, tall back posts with caps, an arched top rail with a cut-out ----------------
bpy.ops.wm.read_factory_settings(use_empty=True); MATS.clear()
W1, W2, IRON = mat('P_wood', (.80, .50, .27)), mat('P_wood2', (.70, .42, .22)), mat('P_iron', (.20, .21, .28))
SW, SD, SH, ST = .5, .46, .47, .065                        # seat width, depth, height to its top, thickness
for i in range(3):
    x = -SW / 2 + SW / 3 * (i + .5)
    box(f'seat{i}', (SW / 3 - .012, SD, ST), (x, .01, SH - ST / 2), W1 if i % 2 else W2, .016)
for sx in (-1, 1):
    tapered(f'front{sx}', sx * .2, .16, 0, SH - ST, .07, .08, W2, .014, lean=(-sx * .03, -.02))
    tapered(f'back{sx}', sx * .2, -.18, 0, 1.06, .075, .07, W2, .014, lean=(-sx * .02, .09))
    bpy.ops.mesh.primitive_uv_sphere_add(radius=.052, segments=16, ring_count=10, location=(sx * .2, -.18 - .09 * 0, 1.08)); o = bpy.context.object
    o.scale = (1, 1, .8); bpy.ops.object.transform_apply(scale=True); finish(o, W1)    # rounded caps on the back posts
    dome(f'pegs{sx}', (sx * .2, .16, SH + .003), .012, IRON); dome(f'pegb{sx}', (sx * .2, -.18, SH + .003), .012, IRON)
# arched top rail with a diamond cut out of it (boolean), and a straight mid rail
bm = bmesh.new(); prof = []
for j in range(17):
    t = j / 16; x = -.24 + .48 * t; zc = .93 + .05 * math.sin(math.pi * t); y = -.18 - .09 * (1 - zc / 1.06)
    prof.append([bm.verts.new((x, y + dy, zc + dz)) for dy, dz in ((-.035, -.075), (.035, -.075), (.035, .075), (-.035, .075))])
for p, q2 in zip(prof, prof[1:]):
    for m in range(4): bm.faces.new((p[m], p[(m + 1) % 4], q2[(m + 1) % 4], q2[m]))
bm.faces.new(list(reversed(prof[0]))); bm.faces.new(prof[-1])
me = bpy.data.meshes.new('toprail'); bm.to_mesh(me); bm.free(); rail = bpy.data.objects.new('toprail', me); bpy.context.scene.collection.objects.link(rail)
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, -.19, .95), rotation=(0, math.pi / 4, 0)); cut = bpy.context.object; cut.scale = (.06, .3, .06)
bo = rail.modifiers.new('cut', 'BOOLEAN'); bo.object = cut; bo.operation = 'DIFFERENCE'
bpy.context.view_layer.objects.active = rail; bpy.ops.object.modifier_apply(modifier='cut'); bpy.data.objects.remove(cut, do_unlink=True)
finish(rail, W1, .012)
box('midrail', (.44, .05, .07), (0, -.18 - .09 * (1 - .7 / 1.06), .7), W1, .012)
for k, x in enumerate((-.09, .09)): box(f'spindle{k}', (.045, .04, .2), (x, -.18 - .09 * (1 - .8 / 1.06), .8), W2, .01)
for sx in (-1, 1): box(f'stretch{sx}', (.045, .34, .05), (sx * .21, -.01, .16), W1, .01)
box('stretch_f', (.4, .045, .05), (0, .15, .2), W1, .01)
export('chair2')
print('HEROES2_DONE')
