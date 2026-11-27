import * as T from './vendor/three.module.min.js';
// Same scene, camera and gameplay, with a non-WebGL projection for restricted browsers.
export class SoftwareRenderer {
 domElement=document.createElement('canvas');
 ratio=1;
 domContext=this.domElement.getContext('2d',{alpha:false});
 trans=new T.Matrix4();
 instance=new T.Matrix4();
 mvp=new T.Matrix4();
 pv=new T.Matrix4();
 pos=new T.Vector3();
 norm=new T.Vector3();
 view=new T.Vector3();
 scratch=new T.Color();
 shadeColor=new T.Color();
 mats=new WeakMap();
 colors=new Map();
 buckets=Array.from({length:120},()=>[]);
 lastFrame=-Infinity;
 setPixelRatio(r){this.ratio=Math.min(1,r);}
 setSize(w,h){
   const r=Math.min(this.ratio,Math.sqrt(630000/(w*h)));
   this.domElement.width=Math.max(1,w*r|0);this.domElement.height=Math.max(1,h*r|0);
   this.domElement.style.width=w+'px';this.domElement.style.height=h+'px';
 }
 setAnimationLoop(fn){const frame=t=>{fn(t);requestAnimationFrame(frame);};requestAnimationFrame(frame);}
 render(scene,camera){
   const now=performance.now();if(now-this.lastFrame<33)return;this.lastFrame=now;
   scene.updateMatrixWorld();camera.updateMatrixWorld();this.pv.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);
   const c=this.domContext,w=this.domElement.width,h=this.domElement.height,b=this.buckets;
   const fog=scene.fog.color;
   const sky=c.createLinearGradient(0,0,0,h);
   sky.addColorStop(0,this.shadeColor.copy(fog).multiplyScalar(.57).getStyle());
   sky.addColorStop(.48,fog.getStyle());
   sky.addColorStop(1,fog.getStyle());
   c.fillStyle=sky;c.fillRect(0,0,w,h);
   for(const bin of b)bin.length=0;
   const sun=scene.children.find(o=>o.isDirectionalLight);
   this.lighting=Math.min(1.35,.68+(sun?.intensity??1)*.33);
   const frustum=new T.Frustum().setFromProjectionMatrix(this.pv);
   const tempSphere=new T.Sphere();
   scene.traverseVisible(o=>{
     if(!o.isMesh || !o.material || Array.isArray(o.material) || o.material.transparent&&o.material.opacity<.82)return;
     if(o.geometry.type==='PlaneGeometry'&&o.material.map&&o.material.transparent)return;
     if(!o.geometry.boundingSphere)o.geometry.computeBoundingSphere();
     if(o.isInstancedMesh){
       for(let i=0;i<o.count;i++){
         o.getMatrixAt(i,this.instance);this.trans.multiplyMatrices(o.matrixWorld,this.instance);
         const x=this.trans.elements[12]-camera.position.x,z=this.trans.elements[14]-camera.position.z;
         if(x*x+z*z>88*88)continue;
         tempSphere.copy(o.geometry.boundingSphere).applyMatrix4(this.trans);
         if(!frustum.intersectsSphere(tempSphere))continue;
         if(o.instanceColor)o.getColorAt(i,this.scratch);else this.scratch.set(0xffffff);
         this.draw(o.geometry,o.material,this.trans,this.scratch,camera,w,h,fog);
       }
     }else{
       tempSphere.copy(o.geometry.boundingSphere).applyMatrix4(o.matrixWorld);
       if(!frustum.intersectsSphere(tempSphere))return;
       this.scratch.set(0xffffff);this.draw(o.geometry,o.material,o.matrixWorld,this.scratch,camera,w,h,fog);
     }
   });
   for(let i=b.length-1;i>=0;i--){
     const bin=b[i];bin.sort((a,b)=>b[0]-a[0]);
     for(const f of bin){
       c.fillStyle=f[7];c.beginPath();c.moveTo(f[1],f[2]);c.lineTo(f[3],f[4]);c.lineTo(f[5],f[6]);c.closePath();
       c.fill();if(f[8]){c.strokeStyle=f[7];c.lineWidth=.64;c.stroke();}
     }
   }
 }
 draw(g,m,matrix,ic,camera,w,h,fog){
   const vert=g.attributes.position, idx=g.index, colors=g.attributes.color;
   this.mvp.multiplyMatrices(this.pv,matrix);
   const e=this.mvp.elements;
   let arr=this.mats.get(g);
   if(!arr||arr.length<vert.count*3){arr=new Float32Array(vert.count*3);this.mats.set(g,arr);}
   for(let i=0,j=0;i<vert.count;i++,j+=3){
     const x=vert.getX(i),y=vert.getY(i),z=vert.getZ(i);
     const k=e[3]*x+e[7]*y+e[11]*z+e[15];arr[j+2]=k;
     const inv=1/Math.max(.12,k);
     arr[j]=w*.5*(1+(e[0]*x+e[4]*y+e[8]*z+e[12])*inv);
     arr[j+1]=h*.5*(1-(e[1]*x+e[5]*y+e[9]*z+e[13])*inv);
   }
   const b=this.buckets,n=idx?.count??vert.count;
   const col=m.color??new T.Color(0xffffff), wn=g.attributes.normal;
   const sz=matrix.elements[2];
   const nightNight=this.lighting, coarse=Boolean(colors);
   for(let i=0;i<n;i+=3){
     const a=idx?idx.getX(i):i, f=idx?idx.getX(i+1):i+1, j=idx?idx.getX(i+2):i+2;
     const ta=a*3,tb=f*3,tc=j*3,za=arr[ta+2],zb=arr[tb+2],zc=arr[tc+2];
     if(za<=.1&&zb<=.1&&zc<=.1)continue;
     const depth=(za+zb+zc)/3;if(depth<=.1||depth>186)continue;
     const ax=arr[ta],ay=arr[ta+1],bx=arr[tb],by=arr[tb+1],cx=arr[tc],cy=arr[tc+1];
     if(Math.max(ax,bx,cx)<0||Math.min(ax,bx,cx)>w||Math.max(ay,by,cy)<0||Math.min(ay,by,cy)>h)continue;
     const area=(bx-ax)*(cy-ay)-(by-ay)*(cx-ax);
     if(m.side!==T.DoubleSide&&area>=0||Math.abs(area)<.72)continue;
     const gray=wn?.getY(a)??.5, nx=wn?.getX(a)??.31, nz=wn?.getZ(a)??.1;
     const ambient=coarse?1.22:1.12;
     const light=m.isMeshBasicMaterial?1:nightNight*(ambient+gray*.22+nx*(-.11+Math.min(.1,sz*.085))-nz*.16);
     const age=Math.min(.94,depth*depth/8100);
     let r=col.r*ic.r*light,g=col.g*ic.g*light,bl=col.b*ic.b*light;
     if(colors){r*=colors.getX(a);g*=colors.getY(a);bl*=colors.getZ(a);}
     if(m.emissiveIntensity&&m.emissive){r+=m.emissive.r*m.emissiveIntensity*.33;g+=m.emissive.g*m.emissiveIntensity*.33;bl+=m.emissive.b*m.emissiveIntensity*.33;}
     r=r*(1-age)+fog.r*age;g=g*(1-age)+fog.g*age;bl=bl*(1-age)+fog.b*age;
     const quant=x=>Math.max(0,Math.min(63,Math.round(x*63)));
     const qr=quant(r),qg=quant(g),qb=quant(bl), key=(qr<<12)|(qg<<6)|qb;
     let style=this.colors.get(key);if(!style){style=this.shadeColor.setRGB(qr/63,qg/63,qb/63).getStyle();this.colors.set(key,style);}
     b[Math.min(b.length-1,depth|0)].push([depth,ax,ay,bx,by,cx,cy,style,coarse]);
   }
 }
}
