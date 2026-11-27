import * as T from './vendor/three.module.min.js';
import {terrain, walkY, ROAD, roadX} from './world.mjs';
export const rand=(seed=221)=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const rng=rand();
export function material(color,opts={}){return new T.MeshStandardMaterial({color,roughness:.91,...opts});}
function texture(kind){
  const c=document.createElement('canvas'); c.width=c.height=256;
  const q=c.getContext('2d'), s=rand(421+kind.length);
  q.fillStyle=kind==='roof'?'#514039':kind==='stone'?'#888277':'#806b54';q.fillRect(0,0,256,256);
  const step=kind==='roof'?22:kind==='stone'?34:13;
  for(let y=0;y<280;y+=step){
    const block=kind==='roof'?32:kind==='stone'?62:260;
    for(let x=-(y/step%2)*block/2;x<256;x+=block){
      const v=Math.round((s()-.5)*25);q.fillStyle=kind==='roof'?`rgb(${81+v},${66+v},${60+v})`:kind==='stone'?`rgb(${143+v},${137+v},${127+v})`:`rgb(${114+v},${91+v},${64+v})`;
      q.fillRect(x+1,y+1,block-3,step-3);q.fillStyle='#ffffff1e';q.fillRect(x+2,y+1,block-5,2);q.fillStyle='#211b1789';q.fillRect(x+2,y+step-4,block-4,2);
    }
  }
  for(let k=0;k<5900;k++){q.fillStyle=s()<.5?'#00000019':'#efe0c117';q.fillRect(s()*256,s()*256,1+s()*5,1+s()*2);}
  const t=new T.CanvasTexture(c); t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;return t;
}
export function buildArt(scene,soft=false){
 const stoneMap=texture('stone'), woodMap=texture('wood'), tileMap=texture('roof');
 const stone=material(0xa4a095,{map:stoneMap}), oldStone=material(0x978b76,{map:stoneMap});
 const plaster=material(0xb0a18a), beam=material(0x584335,{map:woodMap}), decking=material(0xa59072,{map:woodMap});
 const roofs=[0x8a5446,0x6f6263,0x857756,0x625c60].map(c=>material(c,{map:tileMap}));
 const glass=material(0xfac880,{emissive:0xbb662e,emissiveIntensity:.85});
 const iron=material(0x403e38), log=material(0x4c4031);
 const bannerM=material(0x9b3e32,{side:T.DoubleSide});const banners=[];
 const fireMat=new T.MeshBasicMaterial({color:0xffae40});const fires=[], solids=[];
 const boxGeo=new T.BoxGeometry(1,1,1);
 function mesh(g,m,x,y,z,parent=scene){const o=new T.Mesh(g,m);o.position.set(x,y,z);parent.add(o);return o;}
 function box(x,y,z,w,h,d,m,parent=scene){const b=mesh(boxGeo,m,x,y,z,parent);b.scale.set(w,h,d);return b;}
 function obstacle(x,z,w,d){solids.push({x,z,w,d});}
 function torch(x,z,y=terrain(x,z)+1.9){box(x,y-.45,z,.1,.9,.1,iron);const f=mesh(new T.IcosahedronGeometry(.18,1),fireMat,x,y,z);f.scale.y=1.6;fires.push(f);const light=new T.PointLight(0xffa753,12,12,2);light.position.set(x,y,z);scene.add(light);}
 function sign(x,z,label){
   const y=walkY(x,z);box(x,y+.67,z,.14,1.34,.14,beam);box(x,y+1.29,z,1.49,.43,.12,decking);
   const c=document.createElement('canvas');c.width=256;c.height=64;const q=c.getContext('2d');q.fillStyle='#31231a';q.fillRect(0,0,256,64);q.strokeStyle='#b28b51';q.strokeRect(4,4,248,56);q.font='bold 23px Georgia';q.textAlign='center';q.fillStyle='#ffe0a8';q.fillText(label,128,39);
   const m=new T.CanvasTexture(c);m.colorSpace=T.SRGBColorSpace;mesh(new T.PlaneGeometry(1.42,.37),new T.MeshBasicMaterial({map:m,side:T.DoubleSide}),x,y+1.29,z+.066);
 }
 function house(x,z,w,d,h,i){
   const y=terrain(x,z), group=new T.Group();group.position.set(x,y,z);scene.add(group);
   obstacle(x,z,w,d);box(0,.22,0,w+.16,.51,d+.16,stone,group);box(0,h/2+.37,0,w,h,d,i%4===2?decking:plaster,group);
   const edge=h+.37, slope=.56, half=(w+.76)/2;
   const geom=new T.BufferGeometry();
   const zd=(d+.74)/2;
   const vv=[-half,edge,-zd, -half,edge,zd, 0,edge+half*slope,zd, 0,edge+half*slope,-zd, half,edge,-zd,half,edge,zd];
   geom.setAttribute('position',new T.Float32BufferAttribute(vv,3)); geom.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,1,1,0,1,0,0,1,0],2));
   geom.setIndex([0,1,2,0,2,3,3,2,5,3,5,4,1,5,2,0,3,4]);geom.computeVertexNormals();
   roofs[i%4].side=T.DoubleSide;mesh(geom,roofs[i%4],0,0,0,group);
   for (const a of [-1,1]){
     box(a*(w*.5-.07),h/2+.37,0,.18,h,d+.09,beam,group);
     for(const front of [-1,1]){
       const b=box(a*w*.24,h*.65,front*(d*.5+.026),.12,h*.86,.11,beam,group);b.rotation.z=a*front*.48;
       box(a*w*.29,h*.63,front*(d*.5+.084),.70,.81,.13,beam,group);
       box(a*w*.29,h*.63,front*(d*.5+.16),.45,.59,.032,glass,group);
       box(a*w*.29,h*.63,front*(d*.5+.188),.045,.66,.027,beam,group);
     }
   }

   // Street walls have the same details as the gables.
   for (const side of [-1,1]) {
     for(const at of [-.26,.24]){
       const Z=at*d;
       box(side*(w*.5+.04),h*.59,Z,.12,.92,.83,beam,group);
       box(side*(w*.5+.11),h*.59,Z,.035,.63,.53,glass,group);
       box(side*(w*.5+.139),h*.59,Z,.024,.7,.052,beam,group);
       box(side*(w*.5+.14),h*.63,Z,.025,.050,.59,beam,group);
     }
     for(const v of [-.32,.29]){
       const cut=box(side*(w*.5+.033),h*.65,v*d,.12,h*.92,.11,beam,group);cut.rotation.x=v*1.3;
     }
   }
   box(0,h+.21,0,w+.12,.21,d+.15,beam,group);
   box(0,1, d/2+.02,.92,1.8,.15,beam,group);box(0,.105,d/2+.32,1.33,.21,.73,stone,group);
   box(.92,edge+1.02,-.55,.66,2.26,.78,oldStone,group);
 }
 function tower(x,z,w,h,cracked=false){
   const y=terrain(x,z); obstacle(x,z,w,w);
   box(x,y+h/2,z,w,h,w,cracked?oldStone:stone);
   box(x,y+h-.29,z,w+.26,.28,w+.26,stone);
   for(const a of [-1,0,1])for(const b of [-1,0,1])if((a||b)&&(!cracked||rng()>.43))box(x+a*w*.39,y+h+.25,z+b*w*.39,w*.21,.65,w*.21,oldStone);
   for(let i=0;i<2;i++)box(x,y+h*(.48+i*.27),z+w*.508,.18,.75,.03,iron);
   for(let j=0;j<h/.58-1;j++){
     const Y=y+.47+j*.58;
     box(x,Y,z+w*.504,w,.035,.04,iron);
     for(let k=0;k<4;k++){const X=x-w*.45+(k+(j%2)*.47)*w*.22;box(X,Y+.29,z+w*.507,.035,.58,.034,iron);}
   }
 }
 function flag(x,z,y){box(x,y+.2,z,.11,1.0,.11,beam);const f=mesh(new T.PlaneGeometry(.94,1.42,5,5),bannerM,x+.53,y-.25,z);banners.push(f);}
 // Terrain grid with seeded colour, road surface and a cut river channel.
 const geo=new T.PlaneGeometry(150,215,soft?58:150,soft?103:215);geo.rotateX(-Math.PI/2);geo.translate(0,0,-68.5);
 const v=geo.attributes.position, colors=[];const color=new T.Color();
 for(let i=0;i<v.count;i++){
   const x=v.getX(i),z=v.getZ(i);v.setY(i,terrain(x,z));
   const dist=Math.abs(x-roadX(z)), n=Math.sin(x*1.49+z*2.5)*.033+(rng()-.5)*.055;
   const path=T.MathUtils.smoothstep(dist,2.2,4.6);
   color.set(0x5c5344).lerp(new T.Color(z< -108?0x47483b:0x4a5440),path);
   if(Math.abs(z+39)<6.1)color.lerp(new T.Color(0x4a4c45),.64);
   color.multiplyScalar(1+n*4.4);colors.push(color.r,color.g,color.b);
 }
 geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));geo.computeVertexNormals();mesh(geo,material(0xffffff,{vertexColors:true}),0,0,0);
 const water=mesh(new T.PlaneGeometry(151,9.7,soft?25:96,soft?2:8),material(0x3e5c58,{metalness:.23,roughness:.32,transparent:true,opacity:.88}),0,-.48,-39);water.rotation.x=-Math.PI/2;
 for(let i=0;i<24;i++){const x=(rng()-.5)*105,z=-35-rng()*8;mesh(new T.PlaneGeometry(.4+rng()*2,.055),new T.MeshBasicMaterial({color:0x849386,transparent:true,opacity:.3,side:T.DoubleSide}),x,-.46,z).rotation.x=-Math.PI/2;}
 for(let i=0;i<29;i++)box(0,.045,-45.75+i*.47,6.3,.17,.45,decking);
 for(const x of [-3.05,3.05]){
   box(x,.73,-39,.14,.16,13.8,beam);
   for(let j=0;j<6;j++)box(x,.35,-45.5+j*2.66,.21,1.18,.22,beam);
 }
 // Town gate, separate towers, timber market and outlying farm.
 for(const x of [-5.1,5.1]){tower(x,-19,3.65,7.4);flag(x-1.5,-16.99,terrain(x,-19)+6.6);}
 box(0,5.75,-19,7.5,2.6,2.85,stone);
 for(let j=-3;j<=3;j++)box(j*1.03,7.32,-17.8,.66,.69,.48,stone);
 for(const a of [-1,1]){
   const x=a*14.3;box(x,terrain(x,-19)+1.88,-19,15,4.4,1.6,stone);obstacle(x,-19,15,1.6);
   for(let j=0;j<10;j++)box(a*(7.3+j*1.48),4.48,-18.65,.82,.75,.84,stone);
 }
 for (const h of [[-7,9,6,6,3.8,0],[7,12,6,7,3.7,1],[-10,-5,6,6,4.6,2],[8,-3,5,5.8,4,3],[-15,13,5.4,5.6,3.8,1],[15,3,6,8,4,0],[-16,-12,5.5,5,3.3,0],[17,-9,5.2,6.8,4.6,2],[-7,23,5.2,5.9,3.6,3],[7,24,5.7,7,4,1],[15,-68,4.8,5.5,3,3],[18,-75,5.2,5,2.6,1],[-3,-69,5.2,6,2.9,2]])house(...h);
 for(const x of [-3.6,3.6])for(const z of [7,-13,-23])torch(x,z);
 torch(12,-69);torch(-8,-136); torch(-17,-136);
 sign(3.5,-26,'Старая дорога');sign(12,-66,'Волчий хутор');sign(-8,-130,'Пепельная школа');
 for(const z of [2,8])for(const x of [-3.7,4.5])for(let n=0;n<3;n++){
   const xx=x+.51*n;mesh(new T.CylinderGeometry(.29,.25,.76,10),decking,xx,terrain(xx,z)+.4,z);
   for(const y of [.2,.61])mesh(new T.CylinderGeometry(.306,.306,.062,10),iron,xx,terrain(xx,z)+y,z);
 }
 // A broken academy silhouette visible from the road.
 tower(-19,-150,5.5,13,true);tower(-5,-151,4.5,10.4,true);tower(-20,-162,6,7.3,true);
 for(const [x,z,w,h,d] of [[-19,-156,2,7,7],[-4,-157,1.7,5.8,7],[-17,-165,7,6,1.4],[-4,-164,5,4,2],[-16,-143,3,5.4,1.5],[-8,-143,3,4.5,1.5]]){
   box(x,terrain(x,z)+h/2,z,w,h,d,oldStone);obstacle(x,z,w,d);
 }
 box(-12,terrain(-12,-143)+4.79,-143,6.7,.96,1.36,oldStone);
 for(let i=0;i<43;i++){
   const x=-24+rng()*24,z=-134-rng()*33;if(Math.abs(x-roadX(z))<2.7)continue;
   const s=.3+rng()*1.24;const b=box(x,terrain(x,z)+s*.18,z,s,s*.51,s*.69,oldStone);b.rotation.y=rng()*3.14;
 }
 // Instanced forest and ground detail: varied silhouettes, no billboard sprites.
 function inst(g,m,entries){
   const o=new T.InstancedMesh(g,m,entries.length), dummy=new T.Object3D();
   entries.forEach((e,i)=>{dummy.position.set(e[0],e[1],e[2]);dummy.scale.set(e[3],e[4],e[5]);dummy.rotation.set(e[7]??0,e[6]??0,e[8]??0);dummy.updateMatrix();o.setMatrixAt(i,dummy.matrix);if(e[9])o.setColorAt(i,new T.Color(e[9]));});scene.add(o);return o;
 }
 const trunks=[], needles=[], rocks=[], grass=[];
 for(let k=0;k<850;k++){
   const x=(rng()-.5)*139,z=35-rng()*205;
   if(z> -24 && Math.abs(x)<26 || Math.abs(z+39)<7 || Math.abs(x-roadX(z))<5.8 || z< -129&&Math.abs(x+12)<20 || Math.abs(x-9)<14&&Math.abs(z+71)<11)continue;
   const y=terrain(x,z),h=4+rng()*8,w=.86+rng()*1.43;trunks.push([x,y+h*.36,z,.45,h*.72,.45,0,0,.02]);
   if(Math.abs(x)<50){obstacle(x,z,.65,.65);solids.at(-1).canopy=w;}
   const tint=[0x687264,0x546353,0x778074,0x4e6656][k%4];
   for(let tier=0;tier<3;tier++){const scale=1-tier*.19;needles.push([x+(rng()-.5)*.3,y+h*(.43+tier*.19),z,w*scale,h*.55,w*scale,rng()*6,0,.04,tint]);}
 }
 for(let k=0;k<1750;k++){
   const x=(rng()-.5)*136,z=35-rng()*205,y=terrain(x,z);if(Math.abs(z+39)<6.2)continue;
   const a=Math.abs(x-roadX(z));
   if(a>3.3&&rng()<.83){const s=.13+rng()*.65;grass.push([x,y+s*.28,z,s*.39,s,s*.39,rng()*6,.3,0,[0x817950,0x646947,0x656950,0x9b8b60][k%4]]);}
   else if(rng()<.34){const s=.06+rng()*(a<3?.21:1.2);rocks.push([x,y+s*.23,z,s,s*.56,s*.78,rng()*6,0,0,[0xb0a18b,0x80796d,0x958e80][k%3]]);}
 }
 inst(new T.CylinderGeometry(.18,.42,1,7),log,trunks);
 inst(new T.ConeGeometry(1,1,7),material(0x9fa99b,{flatShading:true}),needles);
 inst(new T.IcosahedronGeometry(1,0),material(0xd2c8b5,{flatShading:true}),rocks);
 inst(new T.ConeGeometry(1,1,3),material(0xb0aa88,{flatShading:true}),grass);
 // Distant ridge shapes are geometry and are softened by fog.
 for(let j=0;j<16;j++){
   const angle=(j/16)*Math.PI*2; const o=mesh(new T.ConeGeometry(16+rng()*26,17+rng()*28,5),material(0x4d564f,{flatShading:true}),Math.cos(angle)*111,-5,Math.sin(angle)*122-63);o.rotation.y=rng()*5;
 }
 // Hanging smoke above rooftops.
 const smGeo=new T.BufferGeometry();const sp=new Float32Array(120*3);smGeo.setAttribute('position',new T.BufferAttribute(sp,3));
 const smoke= new T.Points(smGeo,new T.PointsMaterial({size:.38,color:0x96938b,transparent:true,opacity:.21,depthWrite:false}));scene.add(smoke);smoke.frustumCulled=false;
 const wagon=new T.Group();scene.add(wagon);box(0,.93,0,1.65,.41,2.1,decking,wagon);
 for(const x of [-1,1])for(const z of [-.69,.69]){const wh=mesh(new T.CylinderGeometry(.49,.49,.15,11),beam,x,.5,z,wagon);wh.rotation.z=Math.PI/2;box(x,.5,z,.16,.94,.12,iron,wagon);}
 for(const x of [-.49,.48])for(const z of [-.44,.48])box(x,1.28,z,.66,.59,.71,decking,wagon);
 function update(t,ordering){
   const r=new T.Color(ordering?'#3e6584':'#a0392f');bannerM.color.lerp(r,.08);
   for(const f of flags()) {
     const p=f.geometry.attributes.position;
     for(let i=0;i<p.count;i++)p.setZ(i,Math.sin(t*3+p.getX(i)*4+p.getY(i)*2)*(.05+p.getX(i)*.115));
     p.needsUpdate=true;
   }
   for(let n=0;n<fires.length;n++){const f=fires[n];f.rotation.y=t*1.8+n;f.scale.y=1.4+.34*Math.sin(t*9+n*2);}
   for(let j=0;j<120;j++){const age=(t*.24+j*.071)%1; const base=j%3; const x=[-6,7,-9][base],z=[8,11,-6][base];sp[j*3]=x+age*5+Math.sin(j+age*6)*age;sp[j*3+1]=5.5+age*8;sp[j*3+2]=z+age*2+Math.cos(j)*age;}
   smGeo.attributes.position.needsUpdate=true;
 }
 function flags(){return banners}
 return {solids,update,wagon};
}
