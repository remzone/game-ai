"""Original Living Khorinis road architecture, serialized as Gothic II MRM/TEX.
Uses public ZenGin format layouts documented by GothicKit/ZenKit (MIT).
The geometry and textures are generated here; no original game assets are copied.
"""
import math
import struct
from collections import defaultdict

def pack(fmt, *fields):
    return struct.pack("<"+fmt,*fields)

def str0(s):
    return s.encode("ascii")+b"\0"

PALETTE={
    "LKN_OAK":(104,72,45),
    "LKN_STONE":(107,107,98),
    "LKN_CLOTH":(167,152,112),
    "LKN_IRON":(76,75,70),
}

def texture(key):
    size=32
    r,g,b=PALETTE[key]
    pixels=bytearray()
    for y in range(size):
        for x in range(size):
            q=((x*6037 ^ y*7919 ^ x*y*19) %17)-8
            if key=="LKN_OAK": q+=3*(x%6)-9 - (14 if x%8==0 else 0)
            if key=="LKN_STONE": q-=15 if y%8==0 or (x+((y//8)%2)*8)%16==0 else 0
            if key=="LKN_CLOTH":
                # Woven lozenge on a muted campaign standard.
                if abs(x-15)+abs(y-15)<8: q-=50
                q+=(-3 if (x+y)%2 else 3)
            rgb=[min(255,max(0,k+q)) for k in (b,g,r)]
            pixels.extend([*rgb,255])
    return b"ZTEX"+pack("8I",0,0,size,size,1,size,size,(255<<24)|(r<<16)|(g<<8)|b)+pixels

def cross(a,b):
    return (a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])

def material(name,index):
    r,g,b=PALETTE[name]
    obj = pack("HI",0x9c03,index)+b"%\0zCMaterial\0"+str0(name)+pack("5Bf",0,b,g,r,255,0)
    obj+=str0(name+".TGA")+str0("1 1")+pack("fB",0,0)+str0("0 0")+bytes([0,1,1])+b"\0"
    obj+=pack("fBBfBBffBBff",1,0,0,0,0,0,0,0,0,0,1,1)
    return str0(name)+pack("I",4+len(obj))+obj

class Mesh:
    def __init__(self,x=0,z=0):
        self.positions=[]
        self.sub=defaultdict(lambda: ([],[]))
        self.x,self.z=x,z

    def face(self,key,pts):
        pts=[(a+self.x,b,c+self.z) for a,b,c in pts]
        ab=tuple(b-a for a,b in zip(pts[0],pts[1]))
        ac=tuple(b-a for a,b in zip(pts[0],pts[2]))
        n=cross(ab,ac)
        mag=math.sqrt(sum(k*k for k in n))
        if mag<=0: raise ValueError("degenerate face")
        n=tuple(k/mag for k in n)
        tri,wdg=self.sub[key]
        first=len(wdg)
        for i,(p,uv) in enumerate(zip(pts,[(0,1),(1,1),(1,0),(0,0)])):
            j=len(self.positions)
            self.positions.append(p)
            wdg.append(pack("5fHH",*n,*uv,j,0))
        tri.append(pack("3H",first,first+1,first+2))
        if len(pts)==4: tri.append(pack("3H",first,first+2,first+3))

    def box(self,key,x,y,z,w,h,d):
        a=(x,y,z); b=(x+w,y,z); c=(x+w,y+h,z); d0=(x,y+h,z)
        e=(x,y,z+d); f=(x+w,y,z+d); g=(x+w,y+h,z+d); h0=(x,y+h,z+d)
        for quad in [(d0,c,b,a),(e,f,g,h0),(a,b,f,e),(d0,h0,g,c),(a,e,h0,d0),(b,c,g,f)]:
            self.face(key,quad)

    def roof(self,x,y,z,w,h,d):
        a=(x,y,z);b=(x+w,y,z);c=(x+w,y,z+d);d0=(x,y,z+d)
        p=(x+w/2,y+h,z);q=(x+w/2,y+h,z+d)
        self.face("LKN_OAK",(a,p,q,d0));self.face("LKN_OAK",(b,c,q,p))
        self.face("LKN_OAK",(a,b,p));self.face("LKN_OAK",(d0,q,c))

    def banner(self,x,y,z):
        self.box("LKN_IRON",x,y,z,6,135,6)
        self.box("LKN_IRON",x-24,y+116,z,64,5,5)
        self.face("LKN_CLOTH",[(x-21,y+115,z),(x+36,y+115,z),(x+36,y+45,z),(x-21,y+45,z)])
        self.face("LKN_CLOTH",[(x-21,y+45,z),(x+36,y+45,z),(x+36,y+115,z),(x-21,y+115,z)])

    def emit(self):
        content=bytearray(b"".join(pack("3f",*p) for p in self.positions))
        normals=len(content)
        headers=b""
        for tris,wedges in self.sub.values():
            headers+=pack("II",len(content),len(tris))
            content.extend(b"".join(tris))
            headers+=pack("II",len(content),len(wedges))
            content.extend(b"".join(wedges))
            headers+=pack("II",len(content),0)*8
        aabb=tuple(min(p[i] for p in self.positions) for i in range(3))+tuple(max(p[i] for p in self.positions) for i in range(3))
        middle=tuple((a+b)/2 for a,b in zip(aabb[:3],aabb[3:]))
        extent=tuple((b-a)/2 for a,b in zip(aabb[:3],aabb[3:]))
        archive=b"ZenGin Archive\nver 1\nzCArchiverGeneric\nBINARY\nsaveGame 0\nEND\nobjects "+str(len(self.sub)).encode()+b"\nEND\n\n"
        archive+=b"".join(material(key,i) for i,key in enumerate(self.sub))
        body=pack("HI",0x905,len(content))+content+pack("B4I",len(self.sub),0,len(self.positions),normals,0)+headers+archive
        body+=pack("B6f15fH",0,*aabb,*middle,1,0,0,0,1,0,0,0,1,*extent,0)+bytes(10)
        return pack("HI",0xb100,len(body))+body+pack("HI",0xb1ff,0)

def assets():
    # Offsets put props a few metres off the NPC marker, not centred on the guard.
    m=Mesh(265,190)
    m.box("LKN_STONE",-83,0,-65,166,25,130)
    for x in [-75,64]:
        for z in [-55,44]:m.box("LKN_OAK",x,25,z,11,164,11)
    for side in [-63,55]:m.box("LKN_OAK",-78,25,side,156,104,8)
    m.box("LKN_OAK",64,25,-55,11,102,110)
    m.roof(-97,183,-78,194,57,156)
    m.banner(-74,26,-61)
    n=Mesh(-280,170)
    n.box("LKN_STONE",-82,0,-79,164,146,158)
    n.box("LKN_OAK",-97,146,-91,194,18,182)
    for x in [-84,-42,0,42,76]:
        for z in [-82,66]:n.box("LKN_OAK",x,164,z,18,40,16)
    for x in [-84,76]:
        for z in [-54,-16,22]:n.box("LKN_OAK",x,164,z,18,40,18)
    n.banner(68,164,-64)
    result={"LKN_CROSS.MRM":m.emit(),"LKN_RIDGE.MRM":n.emit()}
    result.update({k+"-C.TEX":texture(k) for k in PALETTE})
    return result
