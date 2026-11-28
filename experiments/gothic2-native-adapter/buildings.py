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
    "LKN_ORE":(103,143,158),
}

def texture(key):
    size=32
    r,g,b=PALETTE[key]
    pixels=bytearray()
    for y in range(size):
        for x in range(size):
            q=((x*6037 ^ y*7919 ^ x*y*19) %17)-8
            if key=="LKN_OAK": q+=3*(x%6)-9 - (14 if x%8==0 else 0)
            if key=="LKN_ORE": q+=20 if (x+y*3)%13<3 else -10
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

    def log(self,x,y,z,length,r):
        faces=8
        end=[(y+r*math.cos(i*math.tau/faces),z+r*math.sin(i*math.tau/faces)) for i in range(faces)]
        for i,(a,b) in enumerate(end):
            c,d=end[(i+1)%faces]
            self.face("LKN_OAK",[(x,c,d),(x+length,c,d),(x+length,a,b),(x,a,b)])
            self.face("LKN_OAK",[(x,y,z),(x,c,d),(x,a,b)])
            self.face("LKN_OAK",[(x+length,y,z),(x+length,a,b),(x+length,c,d)])

    def boulder(self,key,x,y,z,size):
        a=(x-size,y,z-size); b=(x+size,y,z-size)
        c=(x+size,y,z+size); d=(x-size,y,z+size)
        roof=(x+size*.28,y+size*1.65,z-size*.17)
        for p,q in [(a,b),(b,c),(c,d),(d,a)]: self.face(key,[p,roof,q])
        self.face(key,[a,b,c,d])

    def ring(self,key,x,z,lower,upper,r1,r2,count=14):
        coords=[(math.cos(math.tau*i/count),math.sin(math.tau*i/count)) for i in range(count)]
        for i,(a,b) in enumerate(coords):
            c,d=coords[(i+1)%count]
            self.face(key,[(x+r1*a,lower,z+r1*b),(x+r2*a,upper,z+r2*b),
                           (x+r2*c,upper,z+r2*d),(x+r1*c,lower,z+r1*d)])

    def cone(self,key,x,z,base,tip,r,count=14):
        coords=[(math.cos(math.tau*i/count),math.sin(math.tau*i/count)) for i in range(count)]
        for i,(a,b) in enumerate(coords):
            c,d=coords[(i+1)%count]
            self.face(key,[(x+r*a,base,z+r*b),(x,tip,z),(x+r*c,base,z+r*d)])

    def palisade(self,start,stop,z):
        for i,x in enumerate(range(start,stop,28)):
            h=109+(i*19%31)
            self.ring("LKN_OAK",x,z,0,h,12,12,6)
            self.cone("LKN_OAK",x,z,h,h+31,12,6)
        for y in (40,86):
            self.box("LKN_OAK",start,y,z+10,stop-start,8,7)

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
    n=Mesh(-315,200)
    n.ring("LKN_STONE",0,0,0,31,114,107)
    for ring in range(7):
        y=31+ring*39
        n.ring("LKN_STONE",0,0,y,y+39,107-ring*1.5,105-ring*1.5)
    n.ring("LKN_STONE",0,0,299,325,118,128)
    n.ring("LKN_OAK",0,0,325,401,114,113)
    n.ring("LKN_OAK",0,0,399,415,133,128)
    n.cone("LKN_OAK",0,0,413,529,128)
    n.box("LKN_IRON",-4,524,-4,8,19,8)
    # Deep arrow slits, entrance recess and stone arch framing.
    n.box("LKN_IRON",-10,215,-105,20,73,8)
    n.box("LKN_IRON",-45,0,-109,90,133,8)
    n.box("LKN_STONE",-69,0,-114,21,129,12)
    n.box("LKN_STONE",48,0,-114,21,129,12)
    for i in range(7):
        ang=math.pi*(i+.5)/7
        x=57*math.cos(ang); y=122+49*math.sin(ang)
        n.box("LKN_STONE",x-12,y-12,-117,24,24,13)
    n.palisade(-252,-118,-127)
    n.palisade(103,288,-127)
    n.banner(139,12,-134)
    # Paladins' timber depot: stacked timbers and a roof over the scales.
    dock=Mesh(250,135)
    dock.box("LKN_STONE",-115,0,-77,230,19,154)
    for x in (-104,93):
        for z in (-68,53):dock.box("LKN_OAK",x,19,z,11,182,11)
    dock.roof(-119,201,-84,238,48,168)
    for y,num in [(22,5),(40,4),(58,3)]:
        for j in range(num):
            dock.box("LKN_OAK",-92,y,-40+16*j+(5-num)*8,133,12,12)
    dock.box("LKN_IRON",72,20,20,24,18,24)
    dock.banner(-98,23,-72)
    # Onar's ore camp: crenellated low walls, a slatted workbench and ore bins.
    mine=Mesh(-256,142)
    mine.box("LKN_STONE",-106,0,-78,212,23,156)
    mine.box("LKN_STONE",-101,23,51,200,87,23)
    for x in (-101,-42,16,76):
        mine.box("LKN_STONE",x,110,51,24,26,23)
    mine.box("LKN_STONE",-101,23,-71,24,83,122)
    for x,y in [(-35,24),(31,24),(53,24)]:
        mine.box("LKN_OAK",x,y,-36,31,38,37)
        mine.box("LKN_IRON",x+5,y+38,-30,21,22,24)
    mine.banner(65,27,35)
    logs=Mesh(95,-128)
    for x in [-54,54]:
        logs.box("LKN_OAK",x,0,-24,8,58,9)
        logs.box("LKN_OAK",x,0,15,8,58,9)
        logs.box("LKN_OAK",x-4,49,-31,16,10,65)
    logs.log(-77,67,0,152,13)
    logs.log(-77,12,46,150,12)
    logs.log(-70,10,67,135,10)
    ore=Mesh(78,59)
    for x,z,size in [(-29,-20,37),(15,-9,30),(6,24,24),(-28,31,19)]:
        ore.boulder("LKN_STONE",x,0,z,size)
    for x,y,z,size in [(-34,30,-20,8),(-22,39,-16,10),(-11,29,-23,8),(13,22,2,10),(22,18,5,8)]:
        ore.boulder("LKN_ORE",x,y,z,size)
    result={"LKN_CROSS.MRM":m.emit(),"LKN_RIDGE.MRM":n.emit(),
            "LKN_DOCK.MRM":dock.emit(),"LKN_MINE.MRM":mine.emit(),
            "LKN_LOGS.MRM":logs.emit(),"LKN_ORE.MRM":ore.emit()}
    result.update({k+"-C.TEX":texture(k) for k in PALETTE})
    return result
