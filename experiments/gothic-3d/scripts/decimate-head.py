"""Optional browser performance bake. blender -b --python scripts/decimate-head.py"""
from pathlib import Path
import bpy, json
path=Path(__file__).resolve().parents[1]/'dist/assets/head.json'
data=json.loads(path.read_text())
p,f=data['body']
mesh=bpy.data.meshes.new('Head');mesh.from_pydata(list(zip(p[::3],p[1::3],p[2::3])),[],list(zip(f[::3],f[1::3],f[2::3])));mesh.update()
ob=bpy.data.objects.new('Head',mesh);bpy.context.collection.objects.link(ob)
mod=ob.modifiers.new('Game LOD','DECIMATE');mod.ratio=.24;mod.use_collapse_triangulate=True
mesh=ob.evaluated_get(bpy.context.evaluated_depsgraph_get()).to_mesh()
mesh.calc_loop_triangles()
data['body']=[[round(float(c),4) for v in mesh.vertices for c in v.co],[i for t in mesh.loop_triangles for i in t.vertices]]
path.write_text(json.dumps(data,separators=(',',':')))
