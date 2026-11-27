import * as T from './vendor/three.module.min.js';
import {makeCharacter,disposeCharacter,validateLook,OPTIONS,DEFAULT} from './character.mjs';
import {DepthRenderer as SoftwareRenderer} from './depth.mjs';
const labels={frame:'Телосложение',face:'Черты лица',skin:'Тон кожи',eyes:'Цвет глаз',hair:'Причёска',dye:'Цвет волос',armor:'Одежда'};
export function installCreator({asset,software,onApply}){
 const parent=document.querySelector('#modelView'), form=document.querySelector('#lookFields'), apply=document.querySelector('#applyLook');
 let renderer=null, actor, config={...DEFAULT}, angle=Math.PI-.27, touch=null, zoom=false, pending=true;
 const scene=new T.Scene(), camera=new T.PerspectiveCamera(36,1,.1,22);
 scene.background=new T.Color(0x3c423a);scene.fog=new T.FogExp2(0x3c423a,.046);
 const hemi=new T.HemisphereLight(0xf0e0c5,0x493e36,1.71);scene.add(hemi);
 const sun=new T.DirectionalLight(0xffdfb3,3.0);sun.position.set(-2.15,3.3,2.6);scene.add(sun);
 const rim=new T.DirectionalLight(0xa0b5be,2.15);rim.position.set(3.0,3.3,-2.1);scene.add(rim);
 const stage=new T.Mesh(new T.CylinderGeometry(.74,.78,.09,56),new T.MeshStandardMaterial({color:0x423c32,roughness:.9}));stage.position.y=-.07;scene.add(stage);
 const floor=new T.Mesh(new T.PlaneGeometry(24,24,16,16),new T.MeshStandardMaterial({color:0x44483e,roughness:.98}));
 floor.rotation.x=-Math.PI/2;floor.position.y=-.121;scene.add(floor);
 const selectors={};
 for(const [key,items] of Object.entries(OPTIONS)){
  const l=document.createElement('label'), title=document.createElement('span'), sel=document.createElement('select');
  title.textContent=labels[key];
  items.forEach((item,i)=>{const option=document.createElement('option');option.textContent=item;option.value=i;sel.append(option);});
  sel.addEventListener('change',()=>{
    config[key]=+sel.value;
    if(['face','eyes','skin','hair','dye'].includes(key))zoom=true;
    else zoom=false;
    pending=true;
  });
  l.append(title,sel);form.append(l);selectors[key]=sel;
 }
 function init(){
  if(renderer)return;
  try{renderer=software?new SoftwareRenderer():new T.WebGLRenderer({antialias:true,alpha:false});}catch{renderer=new SoftwareRenderer();}
  if(renderer instanceof SoftwareRenderer){renderer.studio=true;renderer.budget=460000;}
  if(renderer.isWebGLRenderer){renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.06;}
  parent.prepend(renderer.domElement);
  renderer.domElement.setAttribute('aria-label','Вращай модель мышью. Двойной клик приближает лицо.');
  const canvas=renderer.domElement;
  canvas.addEventListener('pointerdown',e=>{if(e.button===0){touch={id:e.pointerId,x:e.clientX};canvas.setPointerCapture(e.pointerId);}});
  canvas.addEventListener('pointermove',e=>{if(touch?.id===e.pointerId){angle+=(e.clientX-touch.x)*.012;touch.x=e.clientX;}});
  for(const ev of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(ev,()=>{touch=null;});
  zoomToggle.addEventListener('click',()=>{zoom=!zoom;zoomToggle.textContent=zoom?'Показать целиком':'Лицо крупнее';});
  canvas.addEventListener('dblclick',()=>zoomToggle.click());
 }
 const zoomToggle=document.createElement('button');
 zoomToggle.type='button';zoomToggle.className='zoomLook';zoomToggle.textContent='Лицо крупнее';parent.append(zoomToggle);
 function resize(){
  if(!renderer||!parent.clientWidth||!parent.clientHeight)return;
  renderer.setPixelRatio(Math.min(1.5,devicePixelRatio));
  renderer.setSize(parent.clientWidth,parent.clientHeight);camera.aspect=parent.clientWidth/parent.clientHeight;camera.updateProjectionMatrix();
 }
 addEventListener('resize',resize);
 document.querySelector('#randomLook').addEventListener('click',()=>{
  for(const [key,items] of Object.entries(OPTIONS)){config[key]=Math.floor(Math.random()*items.length);selectors[key].value=config[key];}zoom=false;pending=true;
 });
 apply.addEventListener('click',()=>onApply(validateLook(config)));
 function prepare(look,edit){
  init();config=validateLook(look);angle=Math.PI-.28;zoom=false;pending=true;
  for(const [key,el] of Object.entries(selectors))el.value=config[key];
  apply.textContent=edit?'Применить':'Начать игру';
 }
 function render(t){
  if(!renderer)return;
  if(pending){if(actor){scene.remove(actor.root);actor.stop?.();disposeCharacter(actor.root);}actor=makeCharacter(scene,asset,config);pending=false;}
  zoomToggle.textContent=zoom?'Показать целиком':'Лицо крупнее';
  const distance=zoom?(camera.aspect>1.3?1.44:1.33):Math.max(3.36,2.75/Math.max(.55,camera.aspect));
  camera.position.set(zoom?.14:0,zoom?1.63:1.37,distance);camera.lookAt(0,zoom?1.55:.918,0);
  actor.root.rotation.y=angle;actor.pose(t);renderer.render(scene,camera);
 }
 return {prepare,resize,render};
}
