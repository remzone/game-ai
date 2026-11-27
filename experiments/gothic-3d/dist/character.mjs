import * as T from './vendor/three.module.min.js';
import {buildOutfit} from './packs.mjs';
export const OPTIONS={
 frame:['Крепкое','Стройное'], face:['Северянин','Долинник','Горец'],
 skin:['Светлая','Смуглая','Тёмная'], eyes:['Серые','Зелёные','Карие'],
 hair:['Зачёс назад','До плеч','Коса','Бритая голова'],
 dye:['Уголь','Каштан','Седина'], armor:['Дорожная одежда','Пограничный доспех','Одежда следопыта'],
};
export const DEFAULT={frame:0,face:0,skin:1,eyes:0,hair:1,dye:1,armor:0};
export function validateLook(obj){
 return Object.fromEntries(Object.entries(OPTIONS).map(([key,list])=>[key,Number.isInteger(obj?.[key])&&obj[key]>=0&&obj[key]<list.length?obj[key]:DEFAULT[key]]));
}
const styles=[
 [0x5b3730,0x342922,0x766555],
 [0x474747,0x382c25,0x9b8a6f],
 [0x4d554a,0x442e24,0x947e59]
];
const skinTones=[0xc8a17f,0xa87857,0x734e3a],
 eyeTones=[0x738286,0x677648,0x65452e],
 dyes=[0x252320,0x613d2a,0x929087],
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
 const response=await fetch(new URL('./assets/head.json',import.meta.url));
 if(!response.ok)throw Error('Не загрузилась модель лица');
 return await response.json();
}
function faceShape(asset,look){
 const key='head'+look.face;
 if(geoCache[key])return geoCache[key];
 const [points,index]=asset.body, pos=[], colors=[];
 const cs=new T.Color(), hues=[0xc9a598,0xd1b2a7,0xc5a09a]; 
 for(let i=0;i<points.length;i+=3){
   let [x,y,z]=points.slice(i,i+3);
   const jaw=1-T.MathUtils.smoothstep(y,1.51,1.58);
   if(look.face===0){x*=1.0+.11*jaw;}
   if(look.face===1){x*=.94-.06*jaw;z+=.007*(1-jaw);}
   if(look.face===2){x*=1.07+.03*jaw;z-=.013*Math.exp(-Math.pow((y-1.548)/.031,2))*Math.exp(-Math.pow(x/.031,2));}
   const front=Math.max(0,-z-.064);
   const lip=Math.exp(-Math.pow((y-1.506)/.010,2)-Math.pow(x/.043,2))*Math.min(front*21,1);
   const cheek=Math.exp(-Math.pow((Math.abs(x)-.050)/.038,2)-Math.pow((y-1.547)/.046,2))*Math.min(front*14,1);
   const under=Math.exp(-Math.pow((y-1.557)/.017,2))*Math.min(front*12,1);
   cs.set(0xfaf0dd).lerp(new T.Color(hues[look.face]),Math.max(lip*.38,cheek*.22,under*.12));
   pos.push(x,y,z);colors.push(cs.r,cs.g,cs.b);
 }
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(colors,3));g.setIndex(index);g.computeVertexNormals();
 geoCache[key]=g;return g;
}
function face(p,asset,look){
 const skin=std(skinTones[look.skin],{vertexColors:true,roughness:.80});
 const face=put(p,faceShape(asset,look),skin);
 face.material.userData.transient=true;
 const hair=m(dyes[look.dye],'hair'), glint=m(new T.Color(dyes[look.dye]).lerp(new T.Color(0xb2895d),.16).getHex(),'hair');
 const dark=m(0x211a16), white=m(0x9c897a), iris=m(eyeTones[look.eyes]);
 const faceX=[1,.94,1.07][look.face],faceZ=[0,.007,0][look.face];
 for(const side of [-1,1]){
  const x=side*.032*faceX,y=1.573,z=-.086+faceZ;
  oval(p,white,x,y,z,.0145,.015,.017);
  oval(p,iris,x,y+.0004,z-.017,.0086,.0082,.0017);
  oval(p,dark,x,y+.0004,z-.019,.0045,.0046,.00075);
  tape(p,hair,[[x-side*.013,1.595,z-.015],[x,1.599,z-.009],[x+side*.02,1.595,z+.006]],.0028);
 }
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
export function makeCharacter(parent,asset,config,opts={}){
 const look=validateLook(config);
 if(asset.packs){
   const fitted=buildOutfit(asset.packs,look,{
    makeHead(model,l){const h=group(model);face(h,asset,l);return h;},
    shadow:radialShadow,
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
 const f=look.frame?.89:1.05, root=group(parent), body=group(root);
 const [coat,brown,edge]=styles[look.armor];
 const fabric=std(opts.coat??coat,{map:grain('cloth')});fabric.userData.transient=true;
 const cloakMat=std(opts.coat??coat,{map:grain('cloth'),side:T.DoubleSide});cloakMat.userData.transient=true;
 const leather=m(brown,'leather'), seam=m(0x32221d), trim=m(edge,'metal');
 const iron=m(look.armor===1?0x797971:0x5c5d5a,'metal'), steel=m(0xb4b4ab,'metal'), worn=m(0x5b5549,'cloth');
 const skin=m(skinTones[look.skin]);
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
