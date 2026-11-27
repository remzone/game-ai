"""Run with Blender 4.3: blender -b -t 2 --python scripts/bake-outfits.py -- STAGING DEST"""
import bpy, sys
from pathlib import Path
src,dest=map(Path,sys.argv[sys.argv.index('--')+1:])
for f in sorted(src.glob('*.gltf')):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(f))
    for obj in list(bpy.data.objects):
        if obj.type!='MESH':continue
        if 'head_hood' in obj.name.lower():
            bpy.data.objects.remove(obj,do_unlink=True)
            continue
        bpy.context.view_layer.objects.active=obj
        mod=obj.modifiers.new('Browser geometry','DECIMATE')
        mod.ratio=.34 if 'Ranger' in f.name else .50
        mod.use_collapse_triangulate=True
        bpy.ops.object.modifier_move_up(modifier=mod.name)
        bpy.ops.object.modifier_apply(modifier=mod.name)
    bpy.ops.export_scene.gltf(filepath=str(dest/('outfit-'+f.stem.lower()+'.glb')),export_format='GLB',export_image_format='JPEG',export_jpeg_quality=85,export_animations=False,export_yup=True)
