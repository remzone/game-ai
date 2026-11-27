"""Create runtime head geometry from MakeHuman's CC0 hm08 mesh.
usage: python scripts/extract-head.py /path/to/base.obj
"""
import json, sys
from pathlib import Path
p=[]; f=[]; group=''
for l in open(sys.argv[1],encoding='utf8'):
    a=l.split()
    if not a: continue
    if a[0]=='v': p.append(tuple(map(float,a[1:4])))
    elif a[0]=='g': group=a[1]
    elif a[0]=='f':
        fi=[int(v.split('/')[0])-1 for v in a[1:]]
        if (group=='body' and min(p[i][1] for i in fi)>5.94 and max(abs(p[i][0]) for i in fi)<1.2) or group in ('helper-l-eye','helper-r-eye'):
            f.append((group,fi))
data={}
for group, faces in [(g,[a for b,a in f if b==g]) for g in ('body','helper-l-eye','helper-r-eye')]:
    ind=[]; points=[]; lookup={}
    for face in faces:
        mapped=[]
        for i in face:
            if i not in lookup:
                x,y,z=p[i]; lookup[i]=len(points)//3
                points += [round(n,4) for n in (-x*.104, 1.405+(y-5.94)*.125, -(z-.57)*.125)]
            mapped.append(lookup[i])
        for j in range(1,len(mapped)-1):ind += [mapped[0],mapped[j],mapped[j+1]]
    data[group]=[points,ind]
out=Path(__file__).resolve().parents[1]/'dist/assets/head.json'
out.write_text(json.dumps(data,separators=(',',':')),encoding='utf8')
