import * as T from './vendor/three.module.min.js';
import {staticPacket} from './packs.mjs';
import {roadX,terrain} from './world.mjs';
const TAU=Math.PI*2;
function rng(seed){return ()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);}
const vex=(x,y,z)=>new T.Vector3(x,y,z);
class Shape{
 p=[];colors=[];uv=[];ix=[];
 v(p,c,u=0,v=0){const i=this.p.length/3;this.p.push(p.x,p.y,p.z);this.colors.push(c.r,c.g,c.b);this.uv.push(u,v);return i;}
 tri(a,b,c,color,c2=color,c3=color){const i=this.v(a,color,0,0);this.v(b,c2,1,0);this.v(c,c3,.5,1);this.ix.push(i,i+1,i+2);}
 tube(pts,radii,n,color,rand){
   const start=this.p.length/3;
   for(let j=0;j<pts.length;j++){
     const p=pts[j];const tangent=pts[Math.min(pts.length-1,j+1)].clone().sub(pts[Math.max(0,j-1)]).normalize();
     const u=new T.Vector3(1,0,0).cross(tangent);if(u.lengthSq()<.0001)u.set(0,0,1);u.normalize();
     const v=tangent.clone().cross(u).normalize();
     for(let k=0;k<=n;k++){
       const a=k%n/n*TAU,f=1+Math.sin(k%n*7+j*2)*.12;
       const point=p.clone().addScaledVector(u,Math.cos(a)*radii[j]*f).addScaledVector(v,Math.sin(a)*radii[j]*f);
       this.v(point,color.clone().multiplyScalar(.72+.40*rand()),k/n,p.y*.57);
     }
   }
   for(let j=0;j<pts.length-1;j++)for(let k=0;k<n;k++){const a=start+j*(n+1)+k,b=a+n+1;this.ix.push(a,a+1,b,a+1,b+1,b);}
 }
 build(){
   const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(this.p,3));g.setAttribute('color',new T.Float32BufferAttribute(this.colors,3));g.setAttribute('uv',new T.Float32BufferAttribute(this.uv,2));g.setIndex(this.ix);g.computeVertexNormals();g.computeBoundingSphere();return g;
 }
}
function color(n){return new T.Color(n);}
function barkTexture(){
 const c=document.createElement('canvas');c.width=96;c.height=160;
 const q=c.getContext('2d'), r=rng(712);const image=q.createImageData(c.width,c.height);
 for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){
   const a=x/c.width*TAU,b=y/c.height*TAU;
   let n=122+22*Math.sin(a*12+Math.sin(b*2)*.73+Math.sin(b*5)*.49)+12*Math.sin(a*31+Math.sin(b*4)*1.8)+12*(r()-.5);
   const k=(y*c.width+x)*4;image.data.set([n+13,n+4,n-4,255],k);
 }
 q.putImageData(image,0,0);
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;t.wrapS=t.wrapT=T.RepeatWrapping;return t;
}
function tree(seed,variant,detail){
 const r=rng(seed), wood=new Shape(), leaves=new Shape(), thick=[.048,.039,.066][variant], shift=[.052,.032,.116][variant], fast=detail===0;
 const brown=color(0x78624f), green=color([0x3e594a,0x4d6251,0x715f3e][variant]);
 const curve=y=>vex(shift*y*y*Math.sin(seed),y,shift*y*y*Math.cos(seed));
 const pts=[0,.045,.19,.39,.59,.78,.93,1.02].map(curve);
 wood.tube(pts,[thick*1.36,thick,thick*.82,thick*.63,thick*.46,thick*.35,thick*.20,.002],fast?5:9,brown,r);
 for(let j=0;j<4;j++){
   const a=j*TAU/4+r()*.51;wood.tube([curve(.065),vex(Math.cos(a)*thick*1.9,.011,Math.sin(a)*thick*1.9),vex(Math.cos(a)*thick*3.0,-.018,Math.sin(a)*thick*3.0)],[thick*.67,thick*.39,.002],4,brown,r);
 }
 const count=fast?16:27;
 for(let i=0;i<count;i++){
   const v=i/count,y=[.24,.36,.22][variant]+v*[.73,.64,.71][variant], a=i*2.399963+r()*.52;
   const len=(1-v)**.66*[.34,.255,.31][variant]*(.71+r()*.37);
   const dir=vex(Math.cos(a),0,Math.sin(a)), side=vex(-Math.sin(a),0,Math.cos(a));
   const p=curve(y), tip=p.clone().addScaledVector(dir,len).add(vex(0,.029+.051*r(),0));
   const knee=p.clone().lerp(tip,.46).add(vex(0,-.035,0));
   wood.tube([p,knee,tip],[.012*(1-v)+.002,.007*(1-v)+.001,.001],fast?3:5,brown,r);
   const coat=green.clone().multiplyScalar(.62+r()*.59);
   const twigs=fast?5:9;
   for(let t=0;t<twigs;t++){
     const w=.19+t/twigs*.80;
     const center=new T.QuadraticBezierCurve3(p,knee,tip).getPoint(w);
     const sign=t%2?1:-1,rib=len*(.30-.15*w)*(.53+r()*.56);
     const end=center.clone().addScaledVector(side,sign*rib).addScaledVector(dir,rib*.52).add(vex(0,(r()-.28)*.047,0));
     if(!fast&&t%2===0)wood.tube([center,end],[.0028,.0005],3,brown,r);
     // Each twig ends in a folded, serrated spray. These replace the old solid cones.
     if(variant!==2||t%3!==0){
       const spread=rib*(.30+.20*r()), along=end.clone().addScaledVector(dir,.055*(1-v)+.012).add(vex(0,.012,0));
       const raised=center.clone().lerp(along,.56).add(vex(0,.026+.014*r(),0));
       const base=coat.clone().multiplyScalar(.74), highlight=coat.clone().multiplyScalar(1.16);
       const l=center.clone().lerp(along,.32).addScaledVector(dir,-spread).add(vex(0,-.016,0));
       const rr=center.clone().lerp(along,.53).addScaledVector(dir,spread).add(vex(0,-.012,0));
       const top=along.clone().addScaledVector(side,sign*spread*.40);
       leaves.tri(center,l,raised,base,coat,highlight);
       leaves.tri(l,top,raised,coat,highlight,highlight);
       leaves.tri(top,rr,raised,highlight,coat,highlight);
       leaves.tri(rr,center,raised,coat,base,highlight);
     }
     const strips=fast?2:4;
     for(let k=0;k<strips;k++){
       const root=center.clone().lerp(end,k/strips*.85);
       const s=coat.clone().multiplyScalar(.78+r()*.43), bright=coat.clone().multiplyScalar(.99+r()*.32);
       const extent=rib*(.69-k/strips*.37);
       const head=root.clone().addScaledVector(dir,extent*.86).addScaledVector(side,sign*extent*.37).add(vex(0,.02*(r()+.1),0));
       const tipUp=head.clone().add(vex(0,.016,-.008));
       const offset=extent*.50;
       leaves.tri(root.clone().addScaledVector(side,offset),head,root.clone().addScaledVector(side,-offset),s,bright,s);
       leaves.tri(root.clone().add(vex(0,-.009,0)),tipUp,root.clone().addScaledVector(side,sign*offset).add(vex(0,.024,0)),s,bright,s);
       if(variant!==0&&!fast)leaves.tri(end.clone().lerp(root,.36),head.clone().addScaledVector(side,sign*.018),root.clone().add(vex(0,.018,0)),s,bright,s);
     }
   }
 }
 return [wood.build(),leaves.build()];
}
function meadow(seed,kind,detail){
 const r=rng(seed), out=new Shape();
 const start=color(kind===2?0x634834:0x425037), edge=color(kind===1?0x819158:kind===2?0xaf925c:0x7d8853);
 const count=kind===1?8:kind===2?12:22;
 for(let i=0;i<(detail===0?Math.ceil(count/2):count);i++){
   const a=r()*TAU, size=.52+r()*.52, base=vex((r()-.5)*.80,0,(r()-.5)*.69), axis=vex(Math.cos(a),0,Math.sin(a)), side=vex(-Math.sin(a),0,Math.cos(a));
   if(kind===1){
     const leaf=base.clone().multiplyScalar(.35);
     for(let j=0;j<7;j++){
       const f=j/7, p=leaf.clone().addScaledVector(axis,f*.51*size).add(vex(0,Math.sin(f*Math.PI*.86)*.40*size,0));
       const span=(1-f)*.16*size;
       for(const k of [-1,1]){
         const tip=p.clone().addScaledVector(side,k*span).addScaledVector(axis,.115).add(vex(0,.011,0));
         out.tri(p,tip,p.clone().addScaledVector(axis,.09),start,edge,edge);
       }
     }
     continue;
   }
   const h=size*(kind===2?.58:.46), mid=base.clone().addScaledVector(axis,.10*size).add(vex(0,h*.57,0)), tip=mid.clone().addScaledVector(axis,.17*size).add(vex(0,h*.43,0));
   const w=kind===2?.017:.031, bl=base.clone().addScaledVector(side,w),br=base.clone().addScaledVector(side,-w);
   const ml=mid.clone().addScaledVector(side,w*.69),mr=mid.clone().addScaledVector(side,-w*.69);
   const light=edge.clone().multiplyScalar(.74+r()*.43);
   out.tri(bl,br,ml,start,start,light);out.tri(ml,br,mr,light,start,light);out.tri(ml,mr,tip,light,light,edge);
   if(kind===2){
     const stem=tip.clone().add(vex(0,.071,0));out.tri(tip.clone().addScaledVector(side,.028),tip.clone().addScaledVector(side,-.023),stem,light,light,edge);
   }
 }
 return out.build();
}
export function growWoodland(scene,{soft=false,obstacle,packs={}}={}){
 const r=rng(5319), bark=new T.MeshStandardMaterial({vertexColors:true,roughness:.96,map:packs.bark??barkTexture(),side:T.DoubleSide}),
  foliage=new T.MeshStandardMaterial({vertexColors:true,roughness:1,side:T.DoubleSide}), grass=foliage.clone();
 const sampleTree=[0,1,2].map(i=>[[],[]]), sampleGrass=[0,1,2].map(i=>[[],[]]);
 const temp=new T.Object3D();
 function place(g,m,rows){
   if(!rows.length)return;
   const o=new T.InstancedMesh(g,m,rows.length);
   rows.forEach(([x,y,z,sx,sy,sz,a,tint],i)=>{temp.position.set(x,y,z);temp.scale.set(sx,sy,sz);temp.rotation.set(0,a,0);temp.updateMatrix();o.setMatrixAt(i,temp.matrix);o.setColorAt(i,new T.Color(tint));});
   o.computeBoundingSphere();scene.add(o);return o;
 }
 const putTree=(x,z,h,kind)=>{const close=Math.abs(x-roadX(z))<17;const w=.78+r()*.46,y=terrain(x,z);sampleTree[kind][close?1:0].push([x,y,z,h*w,h,h*w,r()*TAU,[0xc1c4b0,0xe0dcca,0xaaada6,0xf0e8d3][Math.floor(r()*4)]]);
   if(Math.abs(x)<48)obstacle?.(x,z,h*(kind===2?.105:.062),h*.065,h*.17);
 };
 for(let j=0;j<(soft?480:690);j++){
   const x=(r()-.5)*140,z=33-r()*200,d=Math.abs(x-roadX(z));
   if(z> -24&&Math.abs(x)<25||Math.abs(z+39)<7||d<5.6||z< -129&&Math.abs(x+12)<20||Math.abs(x-9)<14&&Math.abs(z+71)<12)continue;
   const h=5.8+r()*8.3, kind=r()<.19?2:r()<.46?0:1;
   putTree(x,z,h,kind);
 }
 for(const [x,z,h,kind] of [[-5,-49,9,0],[6.9,-45.9,10,0],[9,-56,11,1],[-4,-57,11,2],[15,-95,12,0],[-6,-94,9,1],[-15,-111,8,2]])putTree(x,z,h,kind);
 for(let j=0;j<(soft?1920:2880);j++){
   const z=32-r()*198, a=(r()-.5)*(r()<.7?27:106),x=roadX(z)+a;
   if(Math.abs(z+39)<6.2||Math.abs(a)<2.28||z>-20&&Math.abs(x)>5&&Math.abs(x)<20&&Math.abs(a)>5||z< -141&&Math.abs(x+12)<9)continue;
   const clump=.65+r()*.94, type=r()<.18?1:r()<.26?2:0,close=Math.abs(a)<11;
   sampleGrass[type][close?1:0].push([x,terrain(x,z)-.008,z,clump,clump,clump,r()*TAU,[0xe1e1c6,0xaab597,0xd7c8ad][Math.floor(r()*3)]]);
 }
 const packTrees=[packs.pineA,packs.pineB,packs.dead];
 const grassModels=staticPacket(packs.grass);
 const ferns=staticPacket(packs.fern);
 for(let v=0;v<3;v++)for(const l of [0,1]){
   const [trunk,crown]=tree(155+v*39,v,soft?0:l);
   const stockTree=staticPacket(packTrees[v]);
   const source=sampleTree[v][l], domain=r=>r[2]<-43&&r[2]>-128&&Math.abs(r[0]-roadX(r[2]))<29;
   const usePack=(r,i)=>stockTree.length>0&&domain(r)&&((i+v)%3!==1);
   const background=source.filter((row,i)=>!usePack(row,i));
   place(trunk,bark,background);place(crown,foliage,background);
   if(stockTree.length){
     const box=new T.Box3();
     for(const p of stockTree)box.union(p.geometry.boundingBox);
     const high=box.max.y-box.min.y, cx=(box.min.x+box.max.x)*.5,cz=(box.min.z+box.max.z)*.5;
     // Pivot at ground and normalize once so the same seeded placement controls both asset sources.
     const rows=source.filter(usePack);
     for(const {geometry,material} of stockTree){
       const g=geometry.clone().translate(-cx,-box.min.y,-cz).scale(1/high,1/high,1/high);
       const mat=material.clone();mat.color.multiply(new T.Color(v===2?0xc4b49c:0x899684));
       place(g,mat,rows);
     }
   }
   const grassRows=sampleGrass[v][l];
   const canUse=(r,i)=>l===1&&domain(r)&&((i+v)%5===0);
   const packIt=v===1?ferns:grassModels.slice(v===0?0:2,v===0?1:3);
   const sourceGrass=packIt.length?grassRows.filter((r,i)=>!canUse(r,i)):grassRows;
   place(meadow(482+v*79,v,soft?0:l),grass,sourceGrass);
   if(packIt.length)for(const {geometry,material} of packIt){
     const g=geometry.clone();g.computeBoundingBox();
     const center=g.boundingBox.getCenter(new T.Vector3()), dlt=g.boundingBox.getSize(new T.Vector3());
     const scale=(v===1?.56:.46)/Math.max(.05,dlt.y);
     g.translate(-center.x,-g.boundingBox.min.y,-center.z).scale(scale,scale,scale);
     const mat=material.clone();mat.color.multiply(new T.Color(0xb2bc9b));mat.side=T.DoubleSide;
     place(g,mat,grassRows.filter(canUse));
   }
 }
 return {trees:sampleTree.flat().reduce((sum,x)=>sum+x.length,0),plants:sampleGrass.flat().reduce((sum,x)=>sum+x.length,0)};
}
