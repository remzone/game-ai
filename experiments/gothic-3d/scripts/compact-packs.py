"""Prepare local CC0 source files. Supply downloaded sources, never run code from a mirror."""
import argparse, json, struct
from pathlib import Path
from PIL import Image
from io import BytesIO

def read_glb(path):
    b=path.read_bytes()
    if b[:4]!=b'glTF': raise ValueError(path)
    size=struct.unpack_from('<I',b,12)[0]
    return json.loads(b[20:20+size]),b[28+size:]

def make_glb(path,d,payload):
    j=json.dumps(d,separators=(',',':')).encode()
    j+=b' '*((-len(j))%4); payload+=b'\0'*((-len(payload))%4)
    path.write_bytes(struct.pack('<4sII',b'glTF',2,28+len(j)+len(payload))+struct.pack('<I4s',len(j),b'JSON')+j+struct.pack('<I4s',len(payload),b'BIN\0')+payload)

def repack_accessors(d,src,keep):
    out=bytearray(); av=[]; bv=[]; ma={}; mv={}
    for old in sorted(keep):
        item=d['accessors'][old].copy()
        if (i:=item.get('bufferView')) is not None:
            if i not in mv:
                v=d['bufferViews'][i].copy(); start=v.get('byteOffset',0)
                mv[i]=len(bv);v['byteOffset']=len(out)
                out.extend(src[start:start+v['byteLength']]);out.extend(b'\0'*((-len(out))%4));bv.append(v)
            item['bufferView']=mv[i]
        ma[old]=len(av);av.append(item)
    return av,bv,ma,out

def image(p,name,n=512,quality=78):
    im=Image.open(p).convert('RGB');im.thumbnail((n,n),Image.Resampling.LANCZOS)
    im.save(name,'JPEG',quality=quality,optimize=True)

def animations(path,dst):
    d,src=read_glb(path)
    keep={'Idle_Loop','Walk_Loop','Jog_Fwd_Loop','Jump_Loop','Sword_Attack','Sword_Idle'}
    anim=[a for a in d['animations'] if a['name'] in keep]
    # Joint rotations preserve the outfit's original proportions; don't apply source translations.
    acc=set()
    for a in anim:
        a['channels']=[c for c in a['channels'] if c['target']['path']=='rotation']
        used=sorted({c['sampler'] for c in a['channels']})
        lookup={j:i for i,j in enumerate(used)}
        a['samplers']=[a['samplers'][j] for j in used]
        for c in a['channels']:c['sampler']=lookup[c['sampler']]
        acc.update(s[k] for s in a['samplers'] for k in ('input','output'))
    av,bv,lookup,buf=repack_accessors(d,src,acc)
    for a in anim:
        for s in a['samplers']:
            for k in ('input','output'):s[k]=lookup[s[k]]
    nodes=[{k:v for k,v in n.items() if k not in ('mesh','skin','extras')} for n in d['nodes']]
    make_glb(dst,dict(asset={'version':'2.0','copyright':'Quaternius CC0'},nodes=nodes, scenes=d['scenes'],scene=0,animations=anim,accessors=av,bufferViews=bv,buffers=[{'byteLength':len(buf)}]),buf)

def grass(folder,dst):
    path=folder/'grass_medium_01_1k.gltf'
    d=json.loads(path.read_text());src=(folder/'grass_medium_01.bin').read_bytes()
    ns=[n for n in d['nodes'] if 'mesh' in n]
    picks=[next(n for n in ns if q in n['name']) for q in ('tiny_a_LOD0','small_a_LOD0','mid_a_LOD0')]
    meshes=[d['meshes'][n['mesh']] for n in picks]
    acc=set()
    for m in meshes:
        for p in m['primitives']:
            p['attributes']={k:v for k,v in p['attributes'].items() if k in ('POSITION','NORMAL','TEXCOORD_0')}
            acc.update(list(p['attributes'].values())+[p['indices']])
    av,bv,lookup,buf=repack_accessors(d,src,acc)
    for m in meshes:
        for p in m['primitives']:
            p['indices']=lookup[p['indices']]; p['attributes']={k:lookup[v] for k,v in p['attributes'].items()};p['material']=0
    fn=next(d['images'][i]['uri'] for i in range(len(d['images'])) if '_diff_' in d['images'][i]['uri'])
    im=Image.open(folder/fn).convert('RGB');im.thumbnail((512,512),Image.Resampling.LANCZOS)
    o=BytesIO();im.save(o,'JPEG',quality=75,optimize=True);dat=o.getvalue()
    bv.append({'buffer':0,'byteOffset':len(buf),'byteLength':len(dat)})
    buf.extend(dat)
    out=dict(asset={'version':'2.0','copyright':'Rico Cilliers and Rob Tuytel / Poly Haven CC0'},scene=0,scenes=[{'nodes':list(range(len(meshes)))}],nodes=[{'mesh':i,'name':picks[i]['name']} for i in range(len(meshes))],meshes=meshes,materials=[{'doubleSided':True,'pbrMetallicRoughness':{'baseColorTexture':{'index':0},'metallicFactor':0,'roughnessFactor':1}}],images=[{'bufferView':len(bv)-1,'mimeType':'image/jpeg'}],textures=[{'source':0}],accessors=av,bufferViews=bv,buffers=[{'byteLength':len(buf)}])
    make_glb(dst,out,buf)

def outfits(src,stage):
    stage.mkdir(exist_ok=True,parents=True)
    for f in src.glob('*.gltf'):
        d=json.loads(f.read_text())
        used=[]
        for mat in d['materials']:
            for key in ('occlusionTexture','normalTexture','emissiveTexture'):mat.pop(key,None)
            m=mat['pbrMetallicRoughness'];m.pop('metallicRoughnessTexture',None);m['metallicFactor']=0;m['roughnessFactor']=.82
            if 'baseColorTexture' in m:used.append(m['baseColorTexture'])
        textures,images=[],[]
        for i,t in enumerate(used):
            img=d['images'][d['textures'][t['index']]['source']]['uri'];jpg=Path(img).stem+'.jpg'
            image(src/img,stage/jpg,768,79);t['index']=i
            images.append({'uri':jpg});textures.append({'source':i})
        d['images']=images;d['textures']=textures
        (stage/f.name).write_text(json.dumps(d))
        (stage/f.with_suffix('.bin').name).write_bytes(f.with_suffix('.bin').read_bytes())

if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('source',type=Path);p.add_argument('dest',type=Path);p.add_argument('staging',type=Path)
    a=p.parse_args();a.dest.mkdir(exist_ok=True,parents=True)
    animations(a.source/'characters/UAL1.glb',a.dest/'quaternius-motion.glb')
    grass(a.source/'poly',a.dest/'poly-grass.glb')
    image(a.source/'poly/litter.jpg',a.dest/'poly-litter.jpg',768)
    image(a.source/'poly/litter-normal.jpg',a.dest/'poly-litter-normal.jpg',512)
    image(a.source/'poly/bark.jpg',a.dest/'poly-bark.jpg')
    outfits(a.source/'characters',a.staging)
