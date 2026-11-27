"""Pack Quaternius's CC0 hairstyles as self-contained GLB; downsize and neutralize base color for dyeing."""
from pathlib import Path
import io,json,sys, runpy
from PIL import Image, ImageOps
src,dest=map(Path,sys.argv[1:])
write=runpy.run_path(str(Path(__file__).with_name('compact-packs.py')))['make_glb']
for name in ['Hair_SimpleParted','Hair_Long','Hair_Buns','Hair_Beard','Hair_Buzzed']:
    f=src/(name+'.gltf')
    d=json.loads(f.read_text())
    t=d['materials'][0]; t.pop('normalTexture',None); t['roughnessFactor']=.65
    tex=t['pbrMetallicRoughness']['baseColorTexture']; image=d['images'][d['textures'][tex['index']]['source']]
    tex['index']=0
    im=Image.open(src/image['uri']).convert('L');im.thumbnail((512,512),Image.Resampling.LANCZOS)
    im=ImageOps.autocontrast(im,cutoff=1).point(lambda u:int(99+u*.60)).convert('RGB')
    o=io.BytesIO();im.save(o,'JPEG',quality=80,optimize=True);pixels=o.getvalue()
    buf=bytearray((src/d['buffers'][0]['uri']).read_bytes());buf.extend(b'\x00'*((-len(buf))%4))
    d['bufferViews'].append({'buffer':0,'byteOffset':len(buf),'byteLength':len(pixels)})
    buf.extend(pixels)
    d['images']=[{'bufferView':len(d['bufferViews'])-1,'mimeType':'image/jpeg'}]
    d['textures']=[{'source':0}];d['buffers']=[{'byteLength':len(buf)}]
    write(dest/(name.lower()+'.glb'),d,bytes(buf))
