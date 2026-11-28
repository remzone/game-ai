"""Build character-only colour variants from the player's installed Gothic II assets."""
import re
import struct

from stock import SIGNATURE

VARIANTS = (
    ("LKNW_ROBE", "ARMOR_NOV_L", "LKW_", "blue"),
    ("LKNS_ROBE", "ARMOR_NOV_L", "LKS_", "moss"),
    ("LKNT_LEATHER", "ARMOR_BDT_M", "LKT_", "leather"),
)
SOURCE_MESHES = {source + ".MDM" for _, source, _, _ in VARIANTS}
TEXTURE = re.compile(rb'HUM_[A-Z0-9_]{5,44}\.TGA(?=[\0\r\n])', re.I)

def entries(data):
    found = {}
    for file in sorted(data.iterdir()):
        if file.suffix.lower() != ".vdf" or not file.is_file() or file.is_symlink():
            continue
        try:
            with file.open("rb") as f:
                head = f.read(296)
                size = file.stat().st_size
                if len(head)!=296 or head[256:272]!=SIGNATURE:
                    continue
                count,_,stamp,_,position,version=struct.unpack_from("<6I",head,272)
                position=position or 296
                if version!=0x50 or not (1<=count<=300000) or not (296<=position<=size-80*count):
                    continue
                f.seek(position)
                for field,offset,length,flags,_ in struct.iter_unpack("<64s4I",f.read(count*80)):
                    name=field.rstrip(b" \0").decode("ascii","ignore").upper()
                    if name not in SOURCE_MESHES and not (name.startswith("HUM_") and name.endswith("-C.TEX")):continue
                    if flags&0x80000000 or not (12<=length<=4*1024*1024) or not (296<=offset<=size-length):continue
                    if name not in found or found[name][3]<stamp:found[name]=(file,offset,length,stamp)
        except (OSError,struct.error):
            continue
    return found

def read(entries,name):
    if name not in entries:return None
    path,offset,size,_=entries[name]
    try:
        with path.open("rb") as f:
            f.seek(offset)
            payload=f.read(size)
        return payload if len(payload)==size else None
    except OSError:
        return None

def palette(r,g,b,style):
    # Keep tiny black details and warm trim, shift the warm cloth/leather but retain lightness.
    hi=max(r,g,b);lo=min(r,g,b)
    if hi < 33 or hi-lo < 10:return r,g,b
    red=(r>g*1.10 and r>b*1.14)
    warm=(r>=g and g>=b and r-b>=20)
    if style=="blue":
        if not warm or (r>=164 and g>=r*.78 and b<=g*.45):return r,g,b
        y=(r*.36+g*.46+b*.18)/255
        return tuple(round(min(255,(k+(y**.8)*v))) for k,v in ((11,99),(22,148),(56,183)))
    if style=="moss":
        if not red:return r,g,b
        y=(r*.32+g*.52+b*.16)/255
        return tuple(round(min(255,k+y*v)) for k,v in ((18,91),(32,134),(18,62)))
    if not warm:return r,g,b
    y=(r*.32+g*.51+b*.17)/255
    if hi-lo>53 and g>r*.59:
        return tuple(round(min(255,k+y*v)) for k,v in ((17,88),(26,115),(16,61)))
    return tuple(round(min(255,k+y*v)) for k,v in ((26,139),(17,103),(9,65)))

def from565(c):
    return ((c>>11)*255//31, ((c>>5)&63)*255//63, (c&31)*255//31)
def to565(c):
    r,g,b=c
    return (round(r*31/255)<<11)|(round(g*63/255)<<5)|round(b*31/255)

def recolor(texture,style):
    if len(texture)<36 or texture[:4]!=b"ZTEX":return None
    version,fmt,width,height,mips,_,_,average=struct.unpack_from("<8I",texture,4)
    if version!=0 or fmt not in (0,1,2,3,4,5,10,11,12,13,14):return None
    if not (1<=width<=2048 and 1<=height<=2048 and 1<=mips<=12):return None
    out=bytearray(texture)
    i=36
    for level in reversed(range(mips)):
        w=max(1,width>>level);h=max(1,height>>level)
        if fmt<6:
            channel={0:(2,1,0),1:(0,1,2),2:(3,2,1),3:(1,2,3),4:(2,1,0),5:(0,1,2)}[fmt]
            step=4 if fmt<4 else 3
            end=i+w*h*step
            if end>len(out):return None
            while i<end:
                colors=palette(*(out[i+j] for j in channel),style)
                for j,c in zip(channel,colors):out[i+j]=c
                i+=step
        else:
            step=8 if fmt==10 else 16
            end=i+max(1,w//4)*max(1,h//4)*step
            if end>len(out):return None
            while i<end:
                q=i+step-8
                a,b,indices=struct.unpack_from("<HHI",out,q)
                x=to565(palette(*from565(a),style));y=to565(palette(*from565(b),style))
                if fmt==10:
                    four=a>b
                    if x==y and four:
                        if x<65535:x+=1
                        else:y-=1
                    if (x>y)!=four:
                        x,y=y,x
                        idx=0
                        for j in range(16):
                            k=(indices>>(2*j))&3
                            idx|=(k^1 if four or k<2 else k)<<(2*j)
                        indices=idx
                struct.pack_into("<HHI",out,q,x,y,indices)
                i+=step
    if i!=len(out) or out[36:]==texture[36:]:return None
    r,g,b=palette((average>>16)&255,(average>>8)&255,average&255,style)
    struct.pack_into("<I",out,32,(average&0xff000000)|(r<<16)|(g<<8)|b)
    return bytes(out)

def prepare(data, adapter):
    index=entries(data)
    result={}
    source_script=adapter.read_bytes()
    for alias,model,prefix,style in VARIANTS:
        raw=read(index,model+".MDM")
        selected={}
        if raw and raw.startswith(b"\0\xd0"):
            target=bytearray(raw)
            for material in sorted({m.group() for m in TEXTURE.finditer(raw)}):
                stem=material[:-4].decode("ascii").upper()
                if "ARMOR" not in stem or any(t in stem for t in ("HEAD","NAKED","SKIN","HAND")):continue
                if len(selected)>=4:continue
                texture=read(index,stem+"-C.TEX")
                recolored=recolor(texture,style) if texture else None
                if recolored is None:continue
                name=prefix+stem[4:]
                selected[name+"-C.TEX"]=recolored
                target=target.replace(material,(name+".TGA").encode("ascii"))
        if selected:
            result[alias+".MDM"]=bytes(target)
            result.update(selected)
            print(alias+": local armour recolour generated",flush=True)
        else:
            source_script=source_script.replace((alias+".ASC").encode(),(model+".ASC").encode())
            print(alias+": original armour fallback (compatible mesh or textile not found)",flush=True)
    adapter.write_bytes(source_script)
    return result
