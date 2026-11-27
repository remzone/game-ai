"""Bake MakeHuman's CC0 young-adult face targets onto the prototype's head LOD.
Run: blender -b -t 2 --python scripts/face-morphs.py -- BASE_OBJ TARGET_FOLDER
"""
import json,sys
from pathlib import Path
from mathutils import Vector
from mathutils.kdtree import KDTree

obj,targets=map(Path,sys.argv[sys.argv.index('--')+1:])
assets=Path(__file__).resolve().parents[1]/'dist/assets'
old=json.loads((assets/'head.json').read_text())
lod=old['body'][0]
base=[tuple(map(float,l.split()[1:4])) for l in obj.read_text().splitlines() if l.startswith('v ')]
def conv(coord):
    x,y,z=coord
    return (-x*.104,1.405+(y-5.94)*.125,-(z-.57)*.125)
tree=KDTree(len(base))
for i,v in enumerate(base):tree.insert(Vector(conv(v)),i)
tree.balance()
nearest=[tree.find(Vector(lod[i:i+3]))[1] for i in range(0,len(lod),3)]
result={}
for sex in ['male','female']:
    for flavour,source in enumerate(['caucasian','asian','african']):
        f=targets/(f'{source}-{sex}-young.target')
        delta={}
        for line in f.read_text().splitlines():
            row=line.split()
            if len(row)==4 and row[0].isdigit():
                p,x,y,z=row;delta[int(p)]=(-float(x)*.104,float(y)*.125,-float(z)*.125)
        # Macro targets also move and rescale the head on the full-height character.
        # Remove that global displacement so separate parts stay fitted to either game rig.
        existing=[tuple(lod[j:j+3]) for j in range(0,len(lod),3)]
        changed=[tuple(a+b for a,b in zip(v,delta.get(i,(0,0,0)))) for v,i in zip(existing,nearest)]
        bounds=lambda v: [(min(q),max(q)) for q in zip(*v)]
        src,dst=bounds(changed),bounds(existing)
        points=[]
        for orig,now in zip(existing,changed):
            for j in range(3):
                lo,hi=src[j]; destlo,desthi=dst[j]
                aligned=destlo+(now[j]-lo)*(desthi-destlo)/(hi-lo)
                points.append(round(aligned-orig[j],4))
        result[f'{sex}-{flavour}']=points
(assets/'face-morphs.json').write_text(json.dumps(result,separators=(',',':')))
