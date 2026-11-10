# POC round 3, option 3: make Poly Haven models more stylized by changing their GEOMETRY, then carry their colour over.
#   blender.exe -b --factory-startup -P stylize.py
# For each model: join its parts, voxel-remesh (melts tiny details, cracks and wear into clean surfaces), inflate a
# little along the normals (chunkier legs, rails and rims, softer edges), smooth, decimate, stretch the proportions per
# object (squatter barrel, thicker table top...), then bake the original colour onto the new shape and export a .glb.
import bpy, os, time, math
import os as _os; POC = _os.path.dirname(_os.path.abspath(__file__)).replace(chr(92), '/') + '/'   # the _poc folder (this script's folder)
from mathutils import Vector
ROOT = POC + ""
# id: (voxel size as a share of the model's height, inflate (m), proportion scale (x, y, z) in Blender axes - z is up)
JOBS = {
  "round_wooden_table_01": (.012, .006, (1.08, 1.08, .92)),
  "Rockingchair_01": (.010, .007, (1.05, 1.05, .96)),
  "wine_barrel_01": (.014, .005, (1.12, 1.12, .9)),
  "wooden_crate_01": (.014, .004, (1.05, 1.05, .95)),
  "painted_wooden_cabinet": (.012, .004, (1.0, 1.0, .95)),
  "wooden_lantern_01": (.010, .003, (1.1, 1.1, .95)),
  "wooden_candlestick": (.014, .004, (1.15, 1.15, .9)),
  "jug_01": (.014, .003, (1.1, 1.1, .92)),
}
os.makedirs(ROOT + "downloads/st", exist_ok=True); report = {}
for mid, (vox, inflate, prop) in JOBS.items():
    t0 = time.time(); bpy.ops.wm.read_factory_settings(use_empty=True); sc = bpy.context.scene
    bpy.ops.import_scene.gltf(filepath=f"{ROOT}downloads/ph/{mid}/{mid}_1k.gltf")
    src = [o for o in sc.objects if o.type == 'MESH']
    for im in bpy.data.images:                                     # bake from the painted colour maps
        if im.filepath and "_diff_1k" in im.filepath:
            p = bpy.path.abspath(im.filepath).replace("_diff_1k.jpg", "_paint.png")
            if os.path.exists(p): im.filepath = p; im.reload()
    bpy.ops.object.select_all(action='DESELECT')
    for o in src: o.select_set(True)
    bpy.context.view_layer.objects.active = src[0]
    bpy.ops.object.duplicate(); dup = [o for o in sc.objects if o.select_get()]
    bpy.context.view_layer.objects.active = dup[0]
    if len(dup) > 1: bpy.ops.object.join()
    st = bpy.context.object; st.name = mid + "_st"
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    h = max(v.co.z for v in st.data.vertices) - min(v.co.z for v in st.data.vertices); before = len(st.data.polygons)
    m = st.modifiers.new('remesh', 'REMESH'); m.mode = 'VOXEL'; m.voxel_size = max(.004, vox * h); m.use_smooth_shade = True
    m = st.modifiers.new('inflate', 'DISPLACE'); m.strength = inflate; m.direction = 'NORMAL'; m.mid_level = 0
    m = st.modifiers.new('smooth', 'CORRECTIVE_SMOOTH'); m.iterations = 8; m.smooth_type = 'LENGTH_WEIGHTED'
    m = st.modifiers.new('dec', 'DECIMATE'); m.ratio = .35
    for md in list(st.modifiers): bpy.ops.object.modifier_apply(modifier=md.name)
    zmin = min(v.co.z for v in st.data.vertices)
    for v in st.data.vertices: v.co = Vector((v.co.x * prop[0], v.co.y * prop[1], zmin + (v.co.z - zmin) * prop[2]))
    for p in st.data.polygons: p.use_smooth = True
    # carry the colour over: new UVs, an image, bake the old surface's colour onto it
    for o in sc.objects: o.select_set(False)
    st.select_set(True); bpy.context.view_layer.objects.active = st
    st.data.materials.clear(); bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(island_margin=.02); bpy.ops.object.mode_set(mode='OBJECT')
    img = bpy.data.images.new(mid + "_st_col", 1024, 1024); mat = bpy.data.materials.new(mid + "_st"); mat.use_nodes = True
    tn = mat.node_tree.nodes.new('ShaderNodeTexImage'); tn.image = img
    mat.node_tree.links.new(tn.outputs['Color'], mat.node_tree.nodes['Principled BSDF'].inputs['Base Color'])
    mat.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = .8; mat.node_tree.nodes.active = tn; st.data.materials.append(mat)
    sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = 1
    for o in src: o.select_set(True)
    st.select_set(True); bpy.context.view_layer.objects.active = st
    bpy.ops.object.bake(type='DIFFUSE', pass_filter={'COLOR'}, use_selected_to_active=True, cage_extrusion=.03 * h + inflate * 2, max_ray_distance=.1 * h, margin=8)
    img.filepath_raw = f"{ROOT}downloads/st/{mid}_st_col.png"; img.file_format = 'PNG'; img.save()
    for o in src: bpy.data.objects.remove(o, do_unlink=True)
    for o in list(sc.objects):
        if o != st: bpy.data.objects.remove(o, do_unlink=True)
    bpy.ops.export_scene.gltf(filepath=f"{ROOT}downloads/st/{mid}.glb", export_format='GLB')
    report[mid] = {'faces_before': before, 'faces_after': len(st.data.polygons), 'sec': round(time.time() - t0, 1)}
    print('STYLIZED', mid, report[mid], flush=True)
print('STYLIZE_DONE', report)
