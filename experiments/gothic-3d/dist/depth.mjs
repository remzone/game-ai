import * as T from './vendor/three.module.min.js';
// Small typed-array depth renderer used for the actual mesh when the browser blocks WebGL.
export class DepthRenderer{
 domElement=document.createElement('canvas'); 
 ctx=this.domElement.getContext('2d',{alpha:false});
 ratio=1; budget=390000; last=-1e6;
 mat=new T.Matrix4(); pv=new T.Matrix4(); inst=new T.Matrix4(); mvp=new T.Matrix4(); normal=new T.Matrix3();
 skin=new T.Vector3(); c=new T.Color(); fog=new T.Color(); base=new T.Color(); sphere=new T.Sphere(); frustum=new T.Frustum();
 cache=new WeakMap(); maps=new WeakMap(); overlays=[]; tint=new T.Color(); lit=new T.Vector3(); key=new T.Vector3(-.41,.76,.49).normalize(); studio=false;
 // Linear values convert to display RGB before interpolation; the table also limits gamut.
 lut=Uint8Array.from({length:1025},(_,i)=>Math.round((i/1024<.0031308?12.92*i/1024:1.055*(i/1024)**(1/2.4)-.055)*255));
 setPixelRatio(r){this.ratio=Math.min(r,1.35);}
 setSize(w,h){
  const r=Math.min(this.ratio,Math.sqrt(this.budget/(w*h)));
  this.w=this.domElement.width=Math.max(1,w*r|0);this.h=this.domElement.height=Math.max(1,h*r|0);
  this.domElement.style.width=w+'px';this.domElement.style.height=h+'px';
  this.im=this.ctx.createImageData(this.w,this.h);this.px=new Uint32Array(this.im.data.buffer);this.depth=new Float32Array(this.w*this.h);
 }
 setAnimationLoop(fn){const tick=t=>{fn(t);requestAnimationFrame(tick);};requestAnimationFrame(tick);}
 srgb(n){return this.lut[Math.min(1024,Math.max(0,(n*1024)|0))];}
 render(scene,camera){
  const now=performance.now();if(!this.im||now-this.last<(this.studio?30:44))return;this.last=now;
  const {w,h,px,depth}=this;
  this.fog.copy(scene.fog?.color??scene.background);depth.fill(0);
  const r=this.srgb(this.fog.r),g=this.srgb(this.fog.g),b=this.srgb(this.fog.b);
  for(let y=0;y<h;y++){const q=.55+.45*Math.min(1,y/h*2.04);px.fill((255<<24)|(b*q<<16)|(g*q<<8)|(r*q|0),y*w,(y+1)*w);}
  camera.updateMatrixWorld();scene.updateMatrixWorld();this.pv.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);
  this.frustum.setFromProjectionMatrix(this.pv);this.overlays.length=0;
  const sun=scene.children.find(o=>o.isDirectionalLight);
  this.strength=this.studio?1.32:Math.min(1.14,.50+(sun?.intensity??1)*.34);
  this.ambient=this.studio?.51:.68;
  scene.traverseVisible(o=>{
   if(!o.isMesh||!o.material||Array.isArray(o.material)||o.material.transparent&&o.material.opacity<.82)return;
   const g=o.geometry;if(!g.boundingSphere)g.computeBoundingSphere();
   if(o.material.transparent&&o.material.map){this.overlays.push(o);return;}
   if(o.isInstancedMesh){
    for(let i=0;i<o.count;i++){
     o.getMatrixAt(i,this.inst);this.mat.multiplyMatrices(o.matrixWorld,this.inst);
     const ex=this.mat.elements,dx=ex[12]-camera.position.x,dz=ex[14]-camera.position.z;
     const range=Math.abs(ex[5])+Math.abs(ex[6])>3?72:27;
     if(dx*dx+dz*dz>range*range)continue;
     if(!this.frustum.intersectsSphere(this.sphere.copy(g.boundingSphere).applyMatrix4(this.mat)))continue;
     if(o.instanceColor)o.getColorAt(i,this.tint);else this.tint.set(0xffffff);
     this.draw(g,o.material,this.mat,this.tint);
    }
   }else if(this.frustum.intersectsSphere(this.sphere.copy(g.boundingSphere).applyMatrix4(o.matrixWorld))){
    this.tint.set(0xffffff);this.draw(g,o.material,o.matrixWorld,this.tint,o.isSkinnedMesh?o:null);
   }
  });
  this.tint.set(0xffffff);
  for(const o of this.overlays)this.draw(o.geometry,o.material,o.matrixWorld,this.tint);
  this.ctx.putImageData(this.im,0,0);
 }
 texture(tex){
  if(!tex?.image)return null;
  if(!this.maps.has(tex)){
   const im=tex.image;
   try{
     const src=document.createElement('canvas'), max=tex.userData?.softwareEdge??2048;src.width=Math.min(max,im.width);src.height=Math.min(max,im.height);
     const q=src.getContext('2d');q.imageSmoothingQuality='high';q.drawImage(im,0,0,src.width,src.height);
     this.maps.set(tex,{w:src.width,h:src.height,p:q.getImageData(0,0,src.width,src.height).data,repeat:tex.wrapS===T.RepeatWrapping,flip:tex.flipY});
   }catch{return null;}
  }
  return this.maps.get(tex);
 }
 draw(g,mat,matrix,tint,skinned=null){
  const {w,h,key}=this,vert=g.attributes.position,normal=g.attributes.normal,col=g.attributes.color,uv=g.attributes.uv,tex=uv?this.texture(mat.map):null;
  let p=this.cache.get(g);
  if(!p||p.length!==vert.count*8){p=new Float32Array(vert.count*8);this.cache.set(g,p);}
  this.mvp.multiplyMatrices(this.pv,matrix);this.normal.getNormalMatrix(matrix);
  const M=this.mvp.elements,N=this.normal.elements;
  this.base.copy(mat.color??this.c.set(0xffffff)).multiply(tint);
  const br=this.base.r,bg=this.base.g,bb=this.base.b;
  const er=(mat.emissive?.r??0)*(mat.emissiveIntensity??0)*.38,eg=(mat.emissive?.g??0)*(mat.emissiveIntensity??0)*.38,eb=(mat.emissive?.b??0)*(mat.emissiveIntensity??0)*.38;
  const f=this.fog;
  for(let i=0,j=0;i<vert.count;i++,j+=8){
   let x=vert.getX(i),y=vert.getY(i),z=vert.getZ(i);
   if(skinned){this.skin.set(x,y,z);skinned.applyBoneTransform(i,this.skin);x=this.skin.x;y=this.skin.y;z=this.skin.z;}
   const q=M[3]*x+M[7]*y+M[11]*z+M[15];
   const inv=1/Math.max(.09,q);
   p[j]=w*.5*(1+(M[0]*x+M[4]*y+M[8]*z+M[12])*inv);
   p[j+1]=h*.5*(1-(M[1]*x+M[5]*y+M[9]*z+M[13])*inv);
   p[j+2]=q>.087?inv:0;
   const nx=normal?.getX(i)??0,ny=normal?.getY(i)??1,nz=normal?.getZ(i)??0;
   const a=N[0]*nx+N[3]*ny+N[6]*nz,b=N[1]*nx+N[4]*ny+N[7]*nz,c=N[2]*nx+N[5]*ny+N[8]*nz;
   const length=Math.max(.001,Math.sqrt(a*a+b*b+c*c));
   const d=(a*key.x+b*key.y+c*key.z)/length;
   const side=mat.side===T.DoubleSide&&mat.vertexColors?Math.abs(d)*.64:d;
   const light=mat.isMeshBasicMaterial?1:this.strength*(this.ambient+.66*Math.max(0,side)+.13*Math.max(0,(c-a)*.7/length));
   const age=this.studio?0:Math.min(.96,q*q/8250);
   p[j+3]=this.srgb((br*light*(col?.getX(i)??1)+er)*(1-age)+f.r*age);
   p[j+4]=this.srgb((bg*light*(col?.getY(i)??1)+eg)*(1-age)+f.g*age);
   p[j+5]=this.srgb((bb*light*(col?.getZ(i)??1)+eb)*(1-age)+f.b*age);
   if(tex){p[j+6]=uv.getX(i)*inv;p[j+7]=uv.getY(i)*inv;}
  }
  const ix=g.index,n=ix?.count??vert.count, double=mat.side===T.DoubleSide;
  for(let i=0;i<n;i+=3){
   let a=(ix?ix.getX(i):i)*8,b=(ix?ix.getX(i+1):i+1)*8,c=(ix?ix.getX(i+2):i+2)*8;
   if(p[a+2]<=0||p[b+2]<=0||p[c+2]<=0)continue;
   const area=(p[b]-p[a])*(p[c+1]-p[a+1])-(p[b+1]-p[a+1])*(p[c]-p[a]);
   if(Math.abs(area)<.19||area>0&&!double)continue;
   this.tri(p,a,b,c,area,tex,mat.transparent&&Boolean(tex),mat.alphaTest??0);
  }
 }
 tri(p,a,b,c,A,tex,overlay,cutoff){
  const {w,h,px,depth}=this;
  const ax=p[a],ay=p[a+1],bx=p[b],by=p[b+1],cx=p[c],cy=p[c+1];
  const x0=Math.max(0,Math.floor(Math.min(ax,bx,cx))),x1=Math.min(w-1,Math.ceil(Math.max(ax,bx,cx)));
  const y0=Math.max(0,Math.floor(Math.min(ay,by,cy))),y1=Math.min(h-1,Math.ceil(Math.max(ay,by,cy)));
  if(x0>x1||y0>y1)return;
  const adx=(by-cy)/A,ady=(cx-bx)/A,bdx=(cy-ay)/A,bdy=(ax-cx)/A;
  const au=p[a+6]-p[c+6],bu=p[b+6]-p[c+6],av=p[a+7]-p[c+7],bv=p[b+7]-p[c+7];
  const ar=p[a+3]-p[c+3],br=p[b+3]-p[c+3],ag=p[a+4]-p[c+4],bg=p[b+4]-p[c+4],ab=p[a+5]-p[c+5],bb=p[b+5]-p[c+5];
  for(let y=y0;y<=y1;y++){
   let u=((by-cy)*(x0+.5-cx)+(cx-bx)*(y+.5-cy))/A,v=((cy-ay)*(x0+.5-cx)+(ax-cx)*(y+.5-cy))/A;
   for(let x=x0,i=y*w+x0;x<=x1;x++,i++,u+=adx,v+=bdx){
    if(u<-.00001||v<-.00001||u+v>1.00001)continue;
    const z=u*(p[a+2]-p[c+2])+v*(p[b+2]-p[c+2])+p[c+2];
    if(z<=depth[i]-(overlay?.007:0))continue;
    let r=(p[c+3]+u*ar+v*br)|0,g=(p[c+4]+u*ag+v*bg)|0,bl=(p[c+5]+u*ab+v*bb)|0;
    if(tex){
     let U=(p[c+6]+u*au+v*bu)/z,V=(p[c+7]+u*av+v*bv)/z;
     if(tex.repeat){U-=Math.floor(U);V-=Math.floor(V);}
     const x1=Math.min(tex.w-1,Math.max(0,(U*tex.w)|0)),y1=Math.min(tex.h-1,Math.max(0,((tex.flip?1-V:V)*tex.h)|0));
     const k=(y1*tex.w+x1)*4,q=tex.p;
     if(q[k+3]<Math.max(1,cutoff*255))continue;
     r=r*q[k]/255;g=g*q[k+1]/255;bl=bl*q[k+2]/255;
     if(overlay){const a=q[k+3]/255, p0=px[i];r=(p0&255)*(1-a)+r*a;g=(p0>>>8&255)*(1-a)+g*a;bl=(p0>>>16&255)*(1-a)+bl*a;}
    }
    if(!overlay)depth[i]=z;
    px[i]=(255<<24)|(bl<<16)|(g<<8)|r;
   }
  }
 }
}
