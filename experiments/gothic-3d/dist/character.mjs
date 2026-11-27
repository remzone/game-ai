import * as T from './vendor/three.module.min.js';
import {buildOutfit} from './packs.mjs';
import {OPTIONS,DEFAULT,SPECIES,validateLook,bodyScale} from './appearance.mjs';
import {staticPacket} from './packs.mjs';
export {OPTIONS,DEFAULT,validateLook};
const styles=[
 [0x5b3730,0x342922,0x766555],
 [0x474747,0x382c25,0x9b8a6f],
 [0x4d554a,0x442e24,0x947e59]
];
const eyeTones=[0x738c9b,0x506945,0x583726,0x9d6b2e],
 dyes=[0x232124,0x644232,0xb0ac9d,0x984d28,0xa89669],
 std=(color,opts={})=>new T.MeshStandardMaterial({color,roughness:.88,...opts});
const geoCache={};
const mCache={};
const m=(color,kind='')=>mCache[kind+color]??=std(color,kind==='metal'?{metalness:.68,roughness:.46}:kind==='cloth'?{map:grain(kind)}:kind==='leather'?{map:grain(kind),roughness:.78}:kind==='double'?{side:T.DoubleSide,map:grain('cloth')}:kind==='hair'?{roughness:.59}:{}); 
const patches={};
function grain(which){
 if(patches[which])return patches[which];
 const c=document.createElement('canvas');c.width=c.height=128;
 const ctx=c.getContext('2d');ctx.fillStyle=which==='leather'?'#d7c8b7':'#d9d2c8';ctx.fillRect(0,0,128,128);
 let seed=14;const rnd=()=>((seed=Math.imul(1664525,seed)+1013904223|0)>>>0)/4294967296;
 for(let i=0;i<3200;i++){ctx.fillStyle=i%2?'#130c071c':'#fff9ee2e';ctx.fillRect(rnd()*128,rnd()*128,which==='leather'?1+rnd()*3:1,1+rnd()*4);}
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;patches[which]=t;return t;
}
function group(p,x=0,y=0,z=0){const g=new T.Group();g.position.set(x,y,z);p.add(g);return g;}
function put(p,g,mat,x=0,y=0,z=0){const o=new T.Mesh(g,mat);o.position.set(x,y,z);p.add(o);return o;}
function oval(p,mat,x,y,z,w,h,d,detail=1){const g=geoCache['oval'+detail]??=new T.SphereGeometry(1,detail===2?19:12,detail===2?13:8);const o=put(p,g,mat,x,y,z);o.scale.set(w,h,d);return o;}
function box(p,mat,x,y,z,w,h,d){const o=put(p,geoCache.box??=new T.BoxGeometry(1,1,1),mat,x,y,z);o.scale.set(w,h,d);return o;}
function ringMesh(rings,segments,fold,offset=0){
 const pos=[], uv=[], ix=[];
 rings.forEach(([y,w,d,cz=0],j)=>{
   for(let i=0;i<=segments;i++){const t=(i%segments)/segments*Math.PI*2;
    const wrinkle=1+fold*Math.cos(t*8+j*.62)+fold*.44*Math.sin(t*13+j*1.45);
    pos.push(Math.cos(t)*w*wrinkle,y+fold*.024*Math.sin(t*6+j),cz+Math.sin(t)*d*wrinkle);
    uv.push(i/segments+offset,j/Math.max(1,rings.length-1));
   }
 });
 for(let j=0;j<rings.length-1;j++)for(let i=0;i<segments;i++){const a=j*(segments+1)+i,b=a+segments+1;ix.push(a,b,a+1,a+1,b,b+1);}
 const g=new T.BufferGeometry();g.userData.transient=true;g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(ix);g.computeVertexNormals();return g;
}
function rings(p,mat,bands,n=18,fold=.014){return put(p,ringMesh(bands,n,fold),mat);}
function tape(p,mat,pts,width=.006){
 const path=new T.CatmullRomCurve3(pts.map(q=>new T.Vector3(...q)));
 const g=new T.TubeGeometry(path,Math.max(4,pts.length*3),width,5,false);g.userData.transient=true;return put(p,g,mat);
}
function shapePiece(p,mat,shape,depth,x,y,z){
 const s=new T.Shape();shape.forEach(([a,b],i)=>i?s.lineTo(a,b):s.moveTo(a,b));s.closePath();
 const g=new T.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSize:.003,bevelThickness:.003,bevelSegments:1,curveSegments:1});g.userData.transient=true;return put(p,g,mat,x,y,z);
}
function cape(p,mat,edge,style,f){
 const o=group(p,0,1.417,.09);
 const wide=[.225,.225,.177][style]*f, len=[.71,.47,.51][style];
 const pos=[],uv=[],idx=[],steps=16,rows=13;
 const coord=(u,v)=>[u*wide*(1+.38*v),-len*v+.03*u*u*v,.064+.18*Math.sqrt(Math.max(0,1-u*u)) + .10*v + .022*Math.cos(u*14-v*2.2)*(v*.68+.32)];
 for(let j=0;j<=rows;j++)for(let i=0;i<=steps;i++){pos.push(...coord(i*2/steps-1,j/rows));uv.push(i/steps,j/rows);}
 for(let j=0;j<rows;j++)for(let i=0;i<steps;i++){const a=j*(steps+1)+i,b=a+steps+1;idx.push(a,a+1,b,a+1,b+1,b);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();
 g.userData.transient=true;put(o,g,mat);
 for(const side of [-1,1])tape(o,edge,Array.from({length:8},(_,i)=>coord(side,i/7)),.006);
 tape(o,edge,Array.from({length:17},(_,i)=>coord(i/8-1,1)),.008);
 if(style===0){tape(o,edge,[coord(-.15,.28),coord(0,.35),coord(.15,.28)],.004);}
 return o;
}
export async function loadHead(){
 const read=async n=>{
  const res=await fetch(new URL('./assets/'+n,import.meta.url));
  if(!res.ok)throw Error('Не загрузилась модель лица '+n);
  return await res.json();
 };
 const [head,morphs]=await Promise.all([read('head.json'),read('face-morphs.json')]);
 return {...head,morphs};
}
const gauss=(v,r)=>Math.exp(-(v*v)/(r*r));
function deform(x,y,z,look){
 const r=SPECIES[look.race];
 const jaw=(1-T.MathUtils.smoothstep(y,1.52,1.59))*T.MathUtils.smoothstep(y,1.445,1.49);
 const front=1-T.MathUtils.smoothstep(z,-.08,-.04);
 const ear=T.MathUtils.smoothstep(Math.abs(x),.067,.095)*gauss(y-1.581,.054)*gauss(z-.032,.062);
 const cheek=gauss(y-1.555,.034)*gauss(Math.abs(x)-.063,.033);
 const nose=gauss(x,.033)*gauss(y-1.546,.034)*front;
 const brow=gauss(y-1.604,.024)*gauss(Math.abs(x)-.035,.031)*front;
 x*=1+(r.jaw-1)*jaw + (look.face===2?.065:look.face===1?-.065:.02)*cheek;
 x+=Math.sign(x)*r.ear*ear*.86;
 y+=r.ear*ear*(look.race===5?.34:.66);
 z-=r.nose*nose + r.brow*brow;
 if(look.race===3)z-=.014*gauss(y-1.502,.031)*front;
 if(look.race===5)y-=.013*nose;
 return [x,y,z];
}
const morphFor=(asset,look)=>asset.morphs?.[(look.sex?'female':'male')+'-'+look.face];
function faceShape(asset,look){
 const key='head-'+[look.sex,look.race,look.face].join('-');
 if(geoCache[key])return geoCache[key];
 const [points,index]=asset.body, pos=[], colors=[], morph=morphFor(asset,look);
 const cs=new T.Color(), base=new T.Color(0xfff2e5), lipColor=new T.Color(look.race===2?0x987283:look.race===3||look.race===5?0x8e806a:0xc09183);
 const warm=new T.Color(0xcb9891), shade=new T.Color(0x9c8a79);
 for(let i=0;i<points.length;i+=3){
   const k=.87;
   const [x,y,z]=deform(points[i]+k*(morph?.[i]??0),points[i+1]+k*(morph?.[i+1]??0),points[i+2]+k*(morph?.[i+2]??0),look);
   const front=T.MathUtils.smoothstep(-z,.062,.112), lip=gauss(y-1.502,.010)*gauss(x,.035)*front;
   const cheek=gauss(Math.abs(x)-.050,.029)*gauss(y-1.547,.040)*front;
   const crease=gauss(y-1.565,.018)*gauss(Math.abs(x)-.036,.024)*front;
   const granule=Math.sin(x*735+y*417)*Math.cos(z*597-x*413);
   cs.copy(base).lerp(lipColor,lip*.47).lerp(warm,cheek*.11).lerp(shade,crease*.23)
     .multiplyScalar(1+granule*.033);
   if(look.face===0&&front>.46&&Math.sin(x*520+y*381)*Math.sin(y*632)>.84&&y>1.537&&y<1.575)cs.multiplyScalar(.74);
   pos.push(x,y,z);colors.push(cs.r,cs.g,cs.b);
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(index);g.computeVertexNormals();
 geoCache[key]=g;return g;
}
function eyePoint(asset,look,x,y,z){
 const m=morphFor(asset,look), points=asset.body[0];
 if(!m)return deform(x,y,z,look);
 let w=0,dx=0,dy=0,dz=0;
 for(let i=0;i<points.length;i+=3){
   const a=points[i]-x,b=points[i+1]-y,c=points[i+2]-z;
   const d=a*a+b*b+c*c;if(d>.0014)continue;
   const k=Math.exp(-d/.00018);w+=k;dx+=m[i]*k;dy+=m[i+1]*k;dz+=m[i+2]*k;
 }
 return deform(x+dx/(w||1)*.85,y+dy/(w||1)*.85,z+dz/(w||1)*.85,look);
}
function styledHair(p,asset,key,color,look,beard=false){
 const pieces=staticPacket(asset.packs?.[key]);
 if(!pieces.length)return false;
 const bbox=new T.Box3();
 for(const part of pieces)bbox.union(part.geometry.boundingBox);
 const s=bbox.getSize(new T.Vector3()), c=bbox.getCenter(new T.Vector3());
 if(s.lengthSq()<.000001)return false;
 const spin=group(p);spin.rotation.y=Math.PI;
 const base=group(spin), w=beard?.18:(key==='hairLong'?.222:key==='hairBuns'?.284:.210);
 const height=beard?.163:key==='hairLong'?.290:key==='hairBuns'?.208:.154;
 base.scale.set(w/Math.max(.02,s.x),height/Math.max(.01,s.y),(beard?.109:.23)/Math.max(.02,s.z));
 const scalp=faceShape(asset,look);if(!scalp.boundingBox)scalp.computeBoundingBox();
 base.position.set(-c.x*base.scale.x,(beard?1.563:scalp.boundingBox.max.y+.027)-bbox.max.y*base.scale.y,(beard?.088:-.009)-c.z*base.scale.z);
 for(const piece of pieces){
   const mat=piece.material.clone();mat.color.set(color);mat.roughness=.69;mat.userData.transient=true;
   put(base,piece.geometry,mat);
 }
 return true;
}
function face(p,asset,look){
 const skinColor=SPECIES[look.race].skins[look.skin];
 const skin=std(skinColor,{vertexColors:true,roughness:.80});
 const face=put(p,faceShape(asset,look),skin);
 face.material.userData.transient=true;
 const hair=m(dyes[look.dye],'hair'), glint=m(new T.Color(dyes[look.dye]).lerp(new T.Color(0xb2895d),.16).getHex(),'hair');
 const dark=m(0x211a16), white=m(0x9c897a), iris=m(eyeTones[look.eyes]);
 for(const side of [-1,1]){
  const [x,y,depth]=eyePoint(asset,look,side*.032,1.573,-.086),z=depth+.003;
  oval(p,white,x,y,z,.0142,.0132,.0154);
  oval(p,iris,x,y+.0004,z-.0153,.0068,.0071,.0017);
  oval(p,dark,x,y+.0004,z-.0171,.0036,.0038,.00075);
  tape(p,hair,[[x-side*.013,1.595,z-.015],[x,1.599,z-.009],[x+side*.02,1.595,z+.006]],.0028);
 }
 if(look.race===3)for(const sign of [-1,1]){
   const [x,y,z]=eyePoint(asset,look,sign*.024,1.500,-.111);
   const fang=put(p,new T.ConeGeometry(.0065,.029,8),m(0xc0ad8d),x,y+.012,z+.006);
   fang.geometry.userData.transient=true;fang.rotation.z=sign*-.23;fang.rotation.x=.29;
 }
 if(look.race===4&&look.sex===0&&look.hair!==3)styledHair(p,asset,'hairBeard',dyes[look.dye],look,true);
 const key=['hairSide','hairLong',null,null,'hairBuns','hairBuzz'][look.hair];
 if(key&&styledHair(p,asset,key,dyes[look.dye],look))return face;
 if(look.hair!==3){
   const N=32,M=12, verts=[], ix=[];
   // Crown surface conforms to the head, with a changing hairline and layered swept strands.
   const hairPos=(u,v)=>{const theta=u*Math.PI*2; const front=Math.sin(theta);
    const bottom=(look.hair===0?1.64:1.54)+Math.max(0,-front)*(look.hair===0?.013:.097)+.013*Math.sin(theta*3);
    const phi=.05+v*(Math.PI*.61);
    const y=1.741-(1.741-bottom)*Math.pow(v,1.6);
    const r=Math.sin(phi)*(1+.025*Math.sin(theta*9+v*4));
    const z=.021+Math.sin(theta+.26*(1-v))*.121*r;
    return [Math.cos(theta+.26*(1-v))*.108*r,y,z];
   };
   for(let j=0;j<=M;j++)for(let i=0;i<=N;i++)verts.push(...hairPos(i/N,j/M));
   for(let j=0;j<M;j++)for(let i=0;i<N;i++){const a=j*(N+1)+i,b=a+N+1;ix.push(a,a+1,b,a+1,b+1,b);}
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(verts,3));g.setIndex(ix);g.computeVertexNormals();
   g.userData.transient=true;const cap=hair.clone();cap.userData.transient=true;cap.side=T.DoubleSide;put(p,g,cap);
   for(let i=0;i<25;i++)tape(p,i%4===0?glint:hair,Array.from({length:6},(_,j)=>hairPos(i/25,j*.19+.05)),i%4===0?.0023:.0028);
   if(look.hair===1||look.hair===2){
     const ribbons=look.hair===1?13:6;
     for(let inx=0;inx<ribbons;inx++){
       const a=-.17+inx/(ribbons-1)*3.35, x=Math.cos(a)*.093;
       const mat=inx%3===0?glint:hair;
       const curve=[
        [x,1.636,.054+.046*Math.sin(a)],
        [x*1.16,1.558,.066+.047*Math.sin(a)],
        [x*1.06,1.470,.078+.063*Math.sin(a)],
        [x*.95,look.hair===1?1.397+.036*Math.cos(inx*4):1.47,.100+.039*Math.sin(a)]
       ];
       tape(p,mat,curve,.009+inx%3*.003);
     }
     if(look.hair===2){
       for(let j=0;j<12;j++)for(const side of [-1,1]){
         const y=1.489-j*.028;const a=oval(p,j%3===0?glint:hair,side*(.013-j*.0005),y,.135+j*.002,.024-j*.0008,.027,.017);
         a.rotation.z=side*.52;
       }
       oval(p,m(0x917358,'metal'),0,1.171,.158,.017,.012,.019);
     }
   }
 }else{
   // Short stubble at the hairline, rather than a separate swollen head shell.
   const caps=m(dyes[look.dye]); for(let i=0;i<22;i++){const a=i/22*Math.PI*2;const side=Math.sin(a); if(side<-.20)continue;
    oval(p,caps,Math.cos(a)*.076,1.678,.018+Math.sin(a)*.090,.012,.006,.009);}
 }
 return face;
}
function articulated(p,x,y,z){return group(p,x,y,z);}
function sword(p,steel,leather,trim){
 box(p,leather,0,-.292,-.019,.040,.125,.043);
 for(let j=0;j<5;j++)box(p,trim,0,-.245-j*.020,-.043,.043,.004,.006);
 shapePiece(p,steel,[[-.031,0],[.031,0],[.025,-.39],[.013,-.55],[0,-.611],[-.013,-.55],[-.023,-.39]],.013,0,-.347,-.026);
 tape(p,trim,[[-.095,-.318,-.027],[0,-.34,-.03],[.095,-.318,-.027]],.012);
 box(p,trim,0,-.227,-.021,.052,.023,.052);
}
function borderKit(model,bones,look){
 const blue=m(0x626b70,'metal'), dark=m(0x353b3d,'metal'), edge=m(0x9c8c6b,'metal'), cloth=m(0x542b28,'leather');
 const chest=group(model), w=look.sex?.182:.198, y=look.sex?1.361:1.392;
 // Beveled plates fitted to the neck and shoulders of each rig before posing.
 const cap=[[-w*.86,.083],[-w*.56,.113],[-w*.26,.104],[0,.078],[w*.25,.104],[w*.56,.113],[w*.86,.083],[w*.92,.021],[w*.69,-.051],[w*.48,-.128],[0,-.155],[-w*.48,-.128],[-w*.69,-.051],[-w*.92,.021]];
 shapePiece(chest,dark,cap,.024,0,y,.138);
 shapePiece(chest,dark,[[-w*.59,.018],[-w*.24,.035],[0,.02],[w*.24,.035],[w*.59,.018],[w*.45,-.018],[-w*.45,-.018]],.024,0,y+.104,.133);
 const mid=cap.map(([a,b])=>[a*.883,b*.91]);
 shapePiece(chest,blue,mid,.022,0,y+.001,.155);
 // The raised ridge and the Order's divided-gate motif catch the light when the model is rotated.
 tape(chest,edge,[[0,y+.060,.181],[0,y-.092,.187],[0,y-.129,.180]],.005);
 for(const k of [-1,1]){
  tape(chest,edge,[[k*.018,y-.044,.183],[k*.018,y+.012,.185],[k*.043,y+.013,.183],[k*.046,y-.045,.183]],.006);
  for(const i of [0,1,2])oval(chest,edge,k*(.072+i*.025),y+.063-i*.012,.180,.006,.007,.004);
 }
 for(let j=0;j<3;j++){
   const a=.122-j*.009;
   shapePiece(chest,j%2?blue:dark,[[-a,.024],[a,.024],[a*.86,-.011],[0,-.030],[-a*.86,-.011]],.018,0,y-.137-j*.036,.145-j*.009);
 }
 shapePiece(chest,cloth,[[-.15,.083],[-.06,.107],[.062,.107],[.15,.083],[.137,-.129],[-.134,-.124]],.027,0,y,-.161);
 const back=group(chest);back.rotation.y=Math.PI;
 shapePiece(back,blue,[[-.135,.071],[0,.092],[.135,.071],[.106,-.086],[0,-.106],[-.106,-.086]],.022,0,y,.139);
 if(bones.spine_03)bones.spine_03.attach(chest);
 for(const arm of [bones.upperarm_r,bones.upperarm_l]){
   if(!arm)continue;
   const v=model.worldToLocal(arm.getWorldPosition(new T.Vector3()));
   const sign=Math.sign(v.x)||1, shoulder=group(model,v.x+sign*.064,v.y-.012,v.z+.011);
   for(let j=0;j<3;j++){
     const layer=group(shoulder,sign*j*.021,-j*.035,0);
     const size=(look.sex?.9:1)*(1-j*.09), a=.086*size;
     shapePiece(layer,j%2?dark:blue,[[-a,-.012],[-a*.85,.035],[-a*.31,.069],[a*.58,.06],[a*.97,.005],[a*.70,-.050],[-a*.57,-.060]],.125*size,0,0,-.060*size);
     oval(layer,edge,0,.024,.071*size,.008,.009,.009);
   }
   arm.attach(shoulder);
 }
}
export function makeCharacter(parent,asset,config,opts={}){
 const look=validateLook(config);
 if(asset.packs){
   const fitted=buildOutfit(asset.packs,look,{
    makeHead(model,l){const h=group(model), detail=group(h);const q=SPECIES[l.race].head;detail.scale.setScalar(q);detail.position.y=1.59*(1-q);face(detail,asset,l);return h;},
    shadow:radialShadow,borderKit,
    weaponHands(model,right,left){
      const ink=m(0x49372a,'leather'), iron=m(0x92918b,'metal'), trim=m(0x8b7053,'metal');
      const swordMount=group(right,.022,.019,-.014);
      swordMount.rotation.set(-Math.PI*.38,0,Math.PI*.50);
      const native=group(swordMount,0,.31,0);sword(native,iron,ink,trim);
      const sh=group(left,.004,.02,.041);sh.rotation.set(0,-.35,-Math.PI*.5);
      const outline=[[-.143,.147],[0,.188],[.133,.146],[.157,-.026],[.082,-.139],[0,-.193],[-.09,-.124],[-.145,-.012]];
      shapePiece(sh,iron,outline,.028,0,0,0);
      shapePiece(sh,ink,outline.map(([x,y])=>[x*.85,y*.86]),.017,0,0,.018);
      oval(sh,iron,0,0,.041,.044,.042,.016);
    }
   },opts);
   if(fitted){parent.add(fitted.root);return fitted;}
 }
 const f=(look.sex?.91:1.03)*(look.frame?.96:1.04), root=group(parent), body=group(root);
 root.scale.set(...bodyScale(look));
 const [coat,brown,edge]=styles[look.armor];
 const fabric=std(opts.coat??coat,{map:grain('cloth')});fabric.userData.transient=true;
 const cloakMat=std(opts.coat??coat,{map:grain('cloth'),side:T.DoubleSide});cloakMat.userData.transient=true;
 const leather=m(brown,'leather'), seam=m(0x32221d), trim=m(edge,'metal');
 const iron=m(look.armor===1?0x797971:0x5c5d5a,'metal'), steel=m(0xb4b4ab,'metal'), worn=m(0x5b5549,'cloth');
 const skin=m(SPECIES[look.race].skins[look.skin]);
 const torso=[
   [.738,.214*f,.135],[.793,.226*f,.14],[.94,.179*f,.108],
   [1.05,.185*f,.117],[1.13,.195*f,.136,-.004],
   [1.25,.233*f,.153,-.007],[1.343,.253*f,.145],
   [1.406,.225*f,.120],[1.467,.086,.076,.016]
 ];
 rings(body,fabric,torso,22,.029);
 rings(body,leather,[[.94,.186*f,.126],[.957,.193*f,.133],[1.008,.188*f,.129],[1.027,.184*f,.127]],18,.006);
 rings(body,iron,[[1.411,.105,.100,.014],[1.45,.096,.087,.013],[1.475,.081,.075,.012]],16,.012);
 rings(body,leather,[[.707,.223*f,.151],[.725,.222*f,.151],[.751,.222*f,.149]],18,.008);
 const capePivot=cape(body,cloakMat,trim,look.armor,f);
 tape(body,seam,[[-.16*f,1.37,-.119],[0,1.29,-.169],[.15*f,1.27,-.142]],.019);
 tape(body,trim,[[-.16*f,1.381,-.125],[0,1.30,-.178],[.15*f,1.28,-.148]],.0045);
 box(body,trim,.016,.984,-.142,.080,.054,.019);box(body,seam,.016,.984,-.155,.048,.032,.018);
 const brooch=put(body,new T.CircleGeometry(.032,9),trim,-.15*f,1.34,-.142);brooch.rotation.y=Math.PI;
 for(const side of [-1,1]){
   const strap=box(body,leather,side*.13*f,1.18,-.132,.036,.421,.028);strap.rotation.z=side*.27;
   if(look.armor===1)for(let j=0;j<5;j++){
     const pts=[[-.096,.034],[-.063,.057],[.087,.044],[.113,.006],[.083,-.026],[-.081,-.024]].map(([x,y])=>[x*f,y]);
     const sc=shapePiece(body,iron,pts,.025,side*.103*f,1.235-j*.058,-.148+j*.009);
     sc.rotation.z=side*(.09+j*.016);sc.rotation.y=side*-.26;
     oval(body,trim,side*.150*f,1.244-j*.057,-.151+j*.009,.008,.008,.009);
   }
   for(let j=0;j<4;j++)oval(body,trim,side*.139*f,.813+j*.024,-.128,.005,.008,.006);
   if(side===1){const bag=oval(body,leather,.212*f,.934,.062,.061,.101,.066);bag.rotation.z=-.12;box(body,seam,.214*f,.984,.123,.10,.022,.013);}
 }
 const head=group(body);
 const hScale=SPECIES[look.race].head;head.scale.setScalar(hScale);head.position.y=1.59*(1-hScale);
 face(head,asset,look);
 const upper=[], elbows=[], hips=[], knees=[];
 for(const side of [-1,1]){
   const arm=articulated(body,side*.235*f,1.348,0);
   rings(arm,fabric,[[-.314,.056,.066],[-.25,.065,.07],[-.144,.088,.075],[-.042,.094,.081],[.035,.071,.068]],14,.042);
   for(let j=0;j<(look.armor===2?2:3);j++){
    const outline=[[-.067,.025],[-.033,.065],[.047,.066],[.096,.013],[.063,-.033],[-.044,-.042]].map(([x,y])=>[x*side*(1-j*.10),y*(1-j*.08)]);
    const plate=shapePiece(arm,look.armor===0?leather:iron,outline,.136-j*.013,side*.030,-.018-j*.056,-.072+j*.008);
    plate.rotation.z=side*-.22;
    oval(arm,trim,side*.080,-.028-j*.053,-.078+j*.009,.008,.008,.007);
   }
   const elbow=articulated(arm,side*.012,-.277,.006);
   rings(elbow,leather,[[-.26,.041,.046],[-.22,.047,.048],[-.15,.054,.062],[-.042,.061,.064],[.023,.055,.063]],13,.029);
   for(let j=0;j<3;j++)rings(elbow,j===1?iron:trim,[[-.195+j*.062,.054,.060],[-.183+j*.062,.054,.060]],13,.012);
   oval(elbow,skin,0,-.264,-.012,.046,.069,.035);
   if(opts.weapon&&side===1)sword(elbow,steel,leather,trim);
   if(opts.weapon&&side===-1){
     const sh=group(elbow,-.023,-.16,.123);sh.rotation.y=-.10;
     const outline=[[-.155,.174],[0,.212],[.149,.169],[.158,-.014],[.092,-.134],[0,-.212],[-.105,-.121],[-.157,-.008]];
     shapePiece(sh,iron,outline,.022,0,0,0);
     shapePiece(sh,leather,outline.map(([x,y])=>[x*.88,y*.89]),.020,0,0,.016);
     tape(sh,trim,[[0,.161,.047],[0,.05,.047],[0,-.146,.041]],.009);
     oval(sh,iron,0,-.006,.066,.049,.049,.021);
   }
   const hip=articulated(body,side*.113*f,.765,0);
   rings(hip,worn,[[-.389,.067,.064],[-.298,.078,.080],[-.141,.093,.097],[.026,.107,.113]],16,.032);
   const shin=articulated(hip,0,-.378,0);
   rings(shin,leather,[[-.33,.068,.070],[-.268,.057,.056],[-.15,.074,.077],[-.064,.080,.082],[-.01,.067,.069]],15,.027);
   const foot=oval(shin,leather,0,-.342,-.062,.074,.057,.157);foot.rotation.x=-.13;
   for(let j=0;j<3;j++)rings(shin,trim,[[-.132-j*.052,.071-j*.004,.073-j*.005],[-.126-j*.052,.071-j*.004,.073-j*.005]],13,.01);
   upper.push(arm);elbows.push(elbow);hips.push(hip);knees.push(shin);
 }
 const groundShadow=radialShadow(root);
 function pose(t,pace=0,hit=0,block=false,jumping=0){
   const p=Math.sin(t*(pace>.9?12:9.6)), swing=pace*p;
   body.position.y=Math.abs(swing)*.028;
   body.rotation.set(jumping?-.085:pace*.035,hit?(hit-.5)*.38:0,Math.cos(t*9.6)*pace*.021);
   for(let i=0;i<2;i++){const sign=i?1:-1;upper[i].rotation.set(sign*swing*.6,sign*.12,-sign*.075);
    elbows[i].rotation.x=-.24-1*Math.max(0,sign*swing)*.2;
    hips[i].rotation.set(-sign*swing*.72,0,sign*.043);
    knees[i].rotation.x=.06+Math.max(0,sign*swing)*.90;
   }
   head.rotation.y=Math.sin(t*1.19)*.034;capePivot.rotation.x=pace*Math.sin(t*10)*.044+pace*.08;
   if(jumping){hips[0].rotation.x=-.52;hips[1].rotation.x=-.29;knees[0].rotation.x=.66;knees[1].rotation.x=.47;upper[0].rotation.x=-.25;upper[1].rotation.x=-.37;}
   if(hit){upper[1].rotation.set(-1.80+hit*.69,hit*.15,-.21-Math.sin(hit*Math.PI)*1.9);elbows[1].rotation.x=-.43+hit*.22;}
   if(block){upper[0].rotation.set(-1.18,.42,.47);elbows[0].rotation.x=-.8;}
   groundShadow.position.y=.016-jumping;
 }
 return {root,pose,fabric,cloakMat};
}
let shadowMat;
function radialShadow(root){
 if(!shadowMat){
  const c=document.createElement('canvas');c.width=c.height=64;
  const q=c.getContext('2d'),g=q.createRadialGradient(32,32,2,32,32,31);
  g.addColorStop(0,'#111109b0');g.addColorStop(.62,'#15150d55');g.addColorStop(1,'#0000');q.fillStyle=g;q.fillRect(0,0,64,64);
  shadowMat=new T.MeshBasicMaterial({map:new T.CanvasTexture(c),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2});
 }
 const shadow=put(root,geoCache.shadow??=new T.PlaneGeometry(1.07,1.07),shadowMat,0,.018,0);shadow.rotation.x=-Math.PI/2;return shadow;
}

export function disposeCharacter(root){
 const geo=new Set(), mat=new Set();root.traverse(o=>{if(!o.isMesh)return;if(o.geometry.userData.transient)geo.add(o.geometry);if(o.material.userData.transient)mat.add(o.material);});
 for(const g of geo)g.dispose();for(const m of mat)m.dispose();
}
