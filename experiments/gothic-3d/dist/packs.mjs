import * as T from './vendor/three.module.min.js';
import {outfitKey,bodyScale,SPECIES} from './appearance.mjs';
import {GLTFLoader} from './vendor/loaders/GLTFLoader.js';
import {MeshoptDecoder} from './vendor/libs/meshopt_decoder.module.js';
import {clone} from './vendor/utils/SkeletonUtils.js';
const folder=new URL('./assets/packs/',import.meta.url);
const gltf=new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
const images=new T.TextureLoader();
const files={
 hairSide:'hair_simpleparted.glb',hairLong:'hair_long.glb',hairBuns:'hair_buns.glb',hairBeard:'hair_beard.glb',hairBuzz:'hair_buzzed.glb',
 pineA:'Pine_1.glb',pineB:'Pine_2.glb',dead:'DeadTree_1.glb',fern:'Fern_1.glb',grass:'poly-grass.glb',
 window:'Wall_Plaster_Window_Wide_Round.glb',gate:'Wall_UnevenBrick_Door_Round.glb',wall:'Wall_UnevenBrick_Straight.glb',
 roof:'Roof_RoundTiles_4x4.glb',fence:'Prop_WoodenFence_Single.glb',chimney:'Prop_Chimney.glb',
 malePeasant:'outfit-male_peasant.glb',femalePeasant:'outfit-female_peasant.glb',
 maleRanger:'outfit-male_ranger.glb',femaleRanger:'outfit-female_ranger.glb',motion:'quaternius-motion.glb',
};
const textures={litter:'poly-litter.jpg',litterNormal:'poly-litter-normal.jpg',bark:'poly-bark.jpg'};
export async function loadPacks(){
 const result={};
 await Promise.all(Object.entries(files).map(async ([key,name])=>{
   try{result[key]=await gltf.loadAsync(new URL(name,folder).href);}
   catch(err){console.warn('3D asset unavailable: '+key,err?.message??err);}
 }).concat(Object.entries(textures).map(async ([key,name])=>{
   try{
     const t=await images.loadAsync(new URL(name,folder).href);
     if(key!=='litterNormal')t.colorSpace=T.SRGBColorSpace;
     if(key==='litter')t.userData.softwareEdge=220;
     t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;result[key]=t;
   }catch(err){console.warn('Texture unavailable: '+key,err?.message??err);}
 })));
 return result;
}
const mailMaps=new WeakMap();
function mailMap(tex){
 if(!tex?.image)return tex;
 if(mailMaps.has(tex.image))return mailMaps.get(tex.image);
 const source=tex.image,c=document.createElement('canvas');
 c.width=source.width;c.height=source.height;const q=c.getContext('2d');q.drawImage(source,0,0);
 const im=q.getImageData(0,0,c.width,c.height),px=im.data;
 for(let i=0;i<px.length;i+=4){
   const strength=px[i+1]>px[i]*(1.16)&&px[i+1]>px[i+2]*1.17?.88:.26;
   const n=.26*px[i]+.61*px[i+1]+.13*px[i+2];
   px[i]=px[i]*(1-strength)+(n*1.07+10)*strength;
   px[i+1]=px[i+1]*(1-strength)+(n*1.12+10)*strength;
   px[i+2]=px[i+2]*(1-strength)+(n*1.21+11)*strength;
 }
 q.putImageData(im,0,0);
 const t=new T.CanvasTexture(c);t.colorSpace=tex.colorSpace;t.flipY=tex.flipY;t.wrapS=tex.wrapS;t.wrapT=tex.wrapT;
 mailMaps.set(tex.image,t);return t;
}
export function buildOutfit(packs,look,helpers,opts){
 const src=packs[outfitKey(look)], motions=packs.motion?.animations;
 if(!src||!motions?.length)return null;
 const root=new T.Group(), model=clone(src.scene);root.add(model);model.rotation.y=Math.PI;
 const cloth=[];
 const palette=SPECIES[look.race].skins[look.skin];
 model.traverse(o=>{
   if(!o.isMesh)return;
   const mat=o.material.clone();
   mat.userData.transient=true;o.material=mat;
   if(mat.name.includes('Regular')){mat.color.set(palette).lerp(new T.Color(0xd1c0ac),.26);}
   else {
     mat.color.set(look.armor===2?0xb4b7a2:look.armor===1?0xb3b7bc:0xc4a99a);
     if(look.armor===1)mat.map=mailMap(mat.map);
     cloth.push(mat);
     if(opts.coat)mat.color.lerp(new T.Color(opts.coat),.22);
   }
   o.castShadow=true;o.receiveShadow=true;
 });
 const bones={};
 model.traverse(o=>{if(o.isBone)bones[o.name]=o;});
 if(!bones.Head||!bones.hand_r||!bones.hand_l)return null;
 // Quaternius faces +Z and the game faces -Z. Turn the entire rig and align the custom head in rig space.
 const head=helpers.makeHead(model,look);head.rotation.y=Math.PI;
 head.position.y=look.sex?.086:.104;
 head.position.z=look.sex?.013:.023;
 model.updateMatrixWorld(true);bones.Head.attach(head);
 if(look.armor===1)helpers.borderKit(model,bones,look);
 root.scale.set(...bodyScale(look));
 if(opts.weapon)helpers.weaponHands(model,bones.hand_r,bones.hand_l);
 const shadow=helpers.shadow(root);
 const mixer=new T.AnimationMixer(model), actions={};
 for(const clip of motions)actions[clip.name]=mixer.clipAction(clip);
 let active=null,last=null;
 function pose(t,pace=0,hit=0,block=false,jump=0){
   const name=jump>.06?'Jump_Loop':hit?'Sword_Attack':block?'Sword_Idle':pace>.85?'Jog_Fwd_Loop':pace>.48?'Walk_Loop':'Idle_Loop';
   const next=actions[name]??actions.Idle_Loop;
   if(next&&active!==next){
     next.reset().setEffectiveWeight(1).setEffectiveTimeScale(name==='Sword_Attack'?1.7:pace>.85?1.11:1).play();
     if(active)active.crossFadeTo(next,.15,false);
     active=next;
     if(last===null)mixer.update(.035);
   }
   mixer.update(last===null?0:Math.min(.09,Math.max(0,t-last)));last=t;
   shadow.position.y=.017-jump;
 }
 const target=new T.Color();
 function uniform(color){target.set(0x90949a).lerp(color,.44);for(const m of cloth)m.color.lerp(target,.06);}
 return {root,pose,uniform,fabric:{color:new T.Color()},cloakMat:{color:new T.Color()},stop:()=>{mixer.stopAllAction();mixer.uncacheRoot(model);}};
}
// Flatten a static pack scene into reusable geometry/material pairs while keeping UVs and textures.
const packetCache=new WeakMap();
export function staticPacket(src){
 if(!src)return [];
 if(packetCache.has(src))return packetCache.get(src);
 src.scene.updateMatrixWorld(true);
 const packet=[];
 src.scene.traverse(o=>{
   if(!o.isMesh||o.isSkinnedMesh||Array.isArray(o.material))return;
   const geometry=o.geometry.clone();
   // Meshopt packs use normalized integers before node transforms. Bake into floats or the positions clamp.
   for(const key of ['position','normal','tangent']){
     const a=geometry.getAttribute(key);
     if(!a||(!a.normalized&&!a.isInterleavedBufferAttribute&&a.array instanceof Float32Array))continue;
     const v=new Float32Array(a.count*a.itemSize);
     for(let i=0;i<a.count;i++){
       v[i*a.itemSize]=a.getX(i);v[i*a.itemSize+1]=a.getY(i);v[i*a.itemSize+2]=a.getZ(i);
       if(a.itemSize===4)v[i*a.itemSize+3]=a.getW(i);
     }
     geometry.setAttribute(key,new T.BufferAttribute(v,a.itemSize));
   }
   geometry.applyMatrix4(o.matrixWorld);geometry.computeBoundingBox();geometry.computeBoundingSphere();
   const material=o.material.clone();
   if(material.transparent&&material.map){material.transparent=false;material.alphaTest=Math.max(.43,material.alphaTest);}
   if(material.name.toLowerCase().includes('leaves'))material.alphaTest=Math.max(.46,material.alphaTest);
   packet.push({geometry,material});
 });
 packetCache.set(src,packet);return packet;
}
export function buildFarmKit(packs,scene,{x,y,z,w,d,h,i}){
 const {window,wall,gate,roof,chimney}=packs;
 if(!window||!wall||!gate||!roof)return false;
 const align=(asset,px,py,pz,span,height,depth,angle)=>{
  const parts=staticPacket(asset);
  const bb=new T.Box3();
  for(const p of parts)bb.union(p.geometry.boundingBox);
  if(bb.isEmpty())return;
  const center=bb.getCenter(new T.Vector3()), size=bb.getSize(new T.Vector3());
  const g=new T.Group(), body=new T.Group();g.add(body);
  g.position.set(px,py,pz);g.rotation.y=angle;
  body.scale.set(span/Math.max(.05,size.x),height/Math.max(.05,size.y),depth/Math.max(.05,size.z));
  body.position.set(-center.x*body.scale.x,-bb.min.y*body.scale.y,-center.z*body.scale.z);
  for(const {geometry,material} of parts){
   const mat=material.clone();
   const name=mat.name.toLowerCase();
   mat.color.multiply(new T.Color(name.includes('plaster')?0xb4a382:name.includes('brick')?0xaaa292:name.includes('tile')?0x756e66:0x7b6d56));
   mat.roughness=Math.max(.77,mat.roughness??1);
   const mesh=new T.Mesh(geometry,mat);mesh.castShadow=mesh.receiveShadow=true;body.add(mesh);
  }
  scene.add(g);
 };
 const wallDepth=.32;
 align(i===1?gate:window,x,y,z+d/2,w,h,wallDepth,0);
 align(window,x,y,z-d/2,w,h,wallDepth,Math.PI);
 align(wall,x-w/2,y,z,d,h,wallDepth,-Math.PI/2);
 align(wall,x+w/2,y,z,d,h,wallDepth,Math.PI/2);
 align(roof,x,y+h-.06,z,w+.64,h*.75,d+.58,0);
 if(chimney)align(chimney,x+w*.24,y+h*.99,z-d*.22,.68,h*1.06,.64,0);
 if(packs.fence&&i===1){
  for(let j=0;j<3;j++)align(packs.fence,x-w*.45+j*1.9,y,z+d*.5+2.1,1.94,.74,.44,0);
 }
 return true;
}
