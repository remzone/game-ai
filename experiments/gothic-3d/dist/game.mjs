import * as T from './vendor/three.module.min.js';
import {DepthRenderer as SoftwareRenderer} from './depth.mjs';
import {makeCharacter,disposeCharacter,loadHead,validateLook,DEFAULT} from './character.mjs';
import {loadPacks} from './packs.mjs';
import {installCreator} from './creator.mjs';
import {buildArt,material,rand} from './art.mjs';
import {DAY,PLACES,ROAD,START,JUMP_SPEED,tickJump,walkY,clockText,isNight,regime,spawn,markVisited,travel,collide,caravanPos} from './world.mjs';
const $=id=>document.getElementById(id), host=$('game');
const intro=$('intro'), talk=$('talk'), atlas=$('atlas'), creator=$('creator'), interact=$('interact');
const objective=['Поговори со стражником у ворот.','Иди по старой дороге через хутор к руинам.','Одолей часового у ворот школы.','Осмотри печать под аркой школы.','Вернись к воротам Переправья.','Донесение доставлено. Мир продолжает жить.'];
const storageKey='ashen-crown-gothic:1';
function readSave(){
  try{
    const s=JSON.parse(localStorage.getItem(storageKey));
    if(s && Number.isFinite(s.x)&&Math.abs(s.x)<=62&&Number.isFinite(s.z)&&s.z>=-173&&s.z<=36&&Number.isFinite(s.minutes)&&s.minutes>=START&&Number.isFinite(s.hp)&&s.hp>0&&s.hp<=100&&Number.isInteger(s.quest)&&s.quest>=0&&s.quest<=5&&Array.isArray(s.visited)&&s.visited.includes('town')&&s.visited.every(id=>PLACES.some(p=>p.id===id)))return s;
  }catch{}
  return spawn();
}
let s=readSave(), started=false, yaw=0, pitch=.39, stamp=0, lastOrange=-1, noticeAt=0, previousRegime=regime(s.minutes);
let arc={y:0,v:0}, jumpStart=null;
let swing=0, atkCooldown=0, hostileWind=0, hostileWait=0, hurt=0;
const keys=new Set(), joystick=new T.Vector2();
let drag=null, blockingTouch=false, renderer;
try{
  renderer=new T.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
}catch{
  renderer=new SoftwareRenderer();
}
renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.08;
host.prepend(renderer.domElement);
const camera=new T.PerspectiveCamera(63,1,.10,215), scene=new T.Scene();
scene.background=new T.Color(0x8c8f81);scene.fog=new T.FogExp2(0x8c8f81,.012);
const hemi=new T.HemisphereLight(0xdedbc9,0x564d43,2.17);scene.add(hemi);
const sun=new T.DirectionalLight(0xffd3a4,2.1);sun.position.set(-32,26,-37);scene.add(sun);
const moon=new T.DirectionalLight(0x819cce,.6);moon.position.set(8,44,37);scene.add(moon);
const packs=await loadPacks();
const {solids,update:animateArt,wagon}=buildArt(scene,renderer instanceof SoftwareRenderer,packs);
const palette={iron:material(0x686364,{metalness:.51,roughness:.5}),wax:material(0x39302a),ivory:material(0xc5aa87),cloth:material(0x554934),shine:material(0xa19982,{metalness:.65,roughness:.4})};
function mesh(geo,m,p,x,y,z){const a=new T.Mesh(geo,m);a.position.set(x,y,z);p.add(a);return a;}
function cube(p,m,x,y,z,w,h,d){return mesh(new T.BoxGeometry(w,h,d),m,p,x,y,z);}
let asset;
try{asset=await loadHead();}catch(e){
  $('intro').querySelector('p').textContent='Не удалось загрузить 3D-модели. Обнови страницу, чтобы попробовать ещё раз.';
  $('start').hidden=true;intro.showModal();throw e;
}
asset.packs=packs;
s.look=s.look?validateLook(s.look):undefined;
let hero=makeCharacter(scene,asset,s.look??DEFAULT,{weapon:true});
const guard=makeCharacter(scene,asset,{frame:0,face:0,skin:0,eyes:0,hair:0,armor:1,dye:1},{weapon:true,coat:0x813b30});
const relief=makeCharacter(scene,asset,{frame:0,face:2,skin:2,eyes:2,hair:3,armor:1,dye:0},{weapon:true,coat:0x69372f});
const caretaker=makeCharacter(scene,asset,{frame:1,face:1,skin:1,eyes:1,hair:2,armor:2,dye:2});
const merchant=makeCharacter(scene,asset,{frame:0,face:2,skin:1,eyes:1,hair:0,armor:0,dye:1},{coat:0x6d5436});
const enemy=makeCharacter(scene,asset,{frame:1,face:2,skin:0,eyes:0,hair:1,armor:1,dye:2},{weapon:true,coat:0x51485a});
const creatorUI=installCreator({asset,software:renderer instanceof SoftwareRenderer,onApply(look){
 scene.remove(hero.root);hero.stop?.();disposeCharacter(hero.root);hero=makeCharacter(scene,asset,look,{weapon:true});s.look=look;resetArc();snapCamera();
 started=true;creator.close();save();
}});
const relic=mesh(new T.OctahedronGeometry(.32),new T.MeshStandardMaterial({color:0xd9a66d,emissive:0xdd7d36,emissiveIntensity:1.4,metalness:.31,roughness:.53}),scene,-12,walkY(-12,-151)+1,-151);
const pedestal=cube(scene,palette.iron,-12,walkY(-12,-151)+.35,-151,.86,.71,.8);
solids.push({x:-12,z:-151,w:.86,d:.8});
const militiaColors={town:new T.Color(0x813b30),order:new T.Color(0x3e6584)};
const lightDay=new T.Color(0xf4d3ab), lightNight=new T.Color(0x879fc0);
const skyDay=new T.Color(0x898879), skyNight=new T.Color(0x303a49);
const fogBase=new T.Color(),lightBase=new T.Color(), tint=new T.Color(); 
const camDst=new T.Vector3(), focus=new T.Vector3(), front=new T.Vector3(), dyn=new T.Vector3();
const actors=[guard,relief,caretaker,merchant,enemy];
let candidates=[], nearby;
let enemyX=-12, enemyZ=-140, enemyAngle=0;
function locate(a,x,z,dir){a.root.position.set(x,walkY(x,z),z);a.root.rotation.y=dir;}
function save(){if(s.hp>0)try{
 const safe=jumpStart&&collide(s.x,s.z,solids)?{...s,x:jumpStart.x,z:jumpStart.z}:s;
 localStorage.setItem(storageKey,JSON.stringify(safe));
}catch{}}
function notify(message){$('notice').textContent=message;noticeAt=4.0;}
function modal(d){
  keys.clear();joystick.set(0,0);$('pad').firstElementChild.style.transform='';blockingTouch=false;drag=null;
  if(document.pointerLockElement===renderer.domElement)document.exitPointerLock();
  d.showModal();
}
function setQuest(n){s.quest=Math.max(s.quest,n);save();$('objective').textContent=objective[s.quest];}
function speak(title,role,lines){$('speaker').textContent=title;$('speakerRole').textContent=role;$('speech').textContent=lines;modal(talk);}
function attemptInteract(){
  if(!nearby||!canPlay())return;
  switch(nearby.id){
    case 'guard':
      if(s.quest===4){setQuest(5);speak(nearby.name,'ВОРОТА ПЕРЕПРАВЬЯ','Значит, печать школы кто-то вскрыл. Оставь её мне: ночью я удвою дозор на переправе. Ты вернулся вовремя.');}
      else if(s.quest===0){setQuest(1);speak(nearby.name,'ВОРОТА ПЕРЕПРАВЬЯ','Старая дорога доведёт тебя через мост до Волчьего хутора, а за ним до школы. Осмотри печать во дворе, но не лезь туда без меча. У развалин видели часового в выцветшей форме.');}
      else speak(nearby.name,'ВОРОТА ПЕРЕПРАВЬЯ',regime(s.minutes)==='order'?'Синий штандарт теперь на башнях. Орден выставил дозор, но к школе нас пока не пускают.':isNight(s.minutes)?'Я до рассвета на посту. Мой напарник уже ушёл греться.':'Если увидишь возчика, держись ближе к дороге. За хутором лес уже не наш.');
      break;
    case 'farm': speak('Вера','СМОТРИТЕЛЬНИЦА ХУТОРА',isNight(s.minutes)?'Ночь я пережидаю у фонаря. Если слышишь колокол со стороны школы, это не к добру.':'До ночи переношу сено к дому. Ищи каменную арку: под ней осталась целая печать.');break;
    case 'merchant': speak('Савел','ВОЗЧИК','Вожу товар из Переправья до развилки за хутором и обратно. Дальше телега не идёт: там с недавних пор кто-то патрулирует руины.');break;
    case 'seal':
      if(!s.enemyDown){notify('Часовой не подпускает к печати.');break;}
      setQuest(4);speak('Печать школы','НАЙДЕНО В РУИНАХ','Узор школы расколот изнутри. На свежем сколе блестит металл: кто-то трогал печать уже после гибели школы. Нужно сообщить страже.');break;
  }
}
function canPlay(){return started&&s.hp>0&&!atlas.open&&!talk.open&&!creator.open;}
function drawAtlas(){
 const ctx=$('chart').getContext('2d'), W=600,H=380;
 const map=(x,z)=>[W/2+x*3.6,49+(31-z)*1.47];
 ctx.fillStyle='#b59b6b';ctx.fillRect(0,0,W,H);
 const r=rand(86);
 for(let i=0;i<5000;i++){ctx.fillStyle=i%2?'#64523220':'#ffe7b523';ctx.fillRect(r()*W,r()*H,.6+r()*4,1+r()*2);}
 ctx.strokeStyle='#674e31';ctx.strokeRect(12,12,W-24,H-24);ctx.strokeRect(16,16,W-32,H-32);
 ctx.save();ctx.beginPath();ctx.rect(18,18,W-36,H-36);ctx.clip();
 function path(points){ctx.beginPath();points.forEach(([x,z],i)=>ctx[i===0?'moveTo':'lineTo'](...map(x,z)));}
 for(let j=0;j<11;j++){
   ctx.beginPath();const ox=j%2?141:434,oz=75+j*20;
   for(let k=0;k<13;k++){const x=ox+Math.cos(k/12*Math.PI*2)*(39+j*2+Math.sin(k*2+j)*7),y=oz+Math.sin(k/12*Math.PI*2)*(20+j*1.45+Math.cos(k*2)*5);ctx[k===0?'moveTo':'lineTo'](x,y);}
   ctx.strokeStyle='#715c3e44';ctx.stroke();
 }
 path([[-90,-31],[-40,-38],[-12,-36],[0,-39],[28,-43],[80,-40]]);ctx.strokeStyle='#4b665c';ctx.lineWidth=12;ctx.stroke();
 path(ROAD);ctx.strokeStyle='#654625';ctx.lineWidth=4;ctx.setLineDash([6,4]);ctx.stroke();ctx.setLineDash([]);
 ctx.font='14px Georgia';ctx.fillStyle='#654e36';ctx.fillText('Чёрная вода',40,149);ctx.fillText('Старый ельник',393,242);
 for(const p of PLACES){
   const [x,y]=map(p.x,p.z), seen=s.visited.includes(p.id);
   ctx.beginPath();ctx.arc(x,y,seen?7:5,0,2*Math.PI);
   ctx.fillStyle=seen?(p.id==='town'&&regime(s.minutes)==='order'?'#294f66':'#8a3730'):'#70674d';ctx.fill();
   ctx.font='bold 18px Georgia';ctx.fillStyle='#392917';ctx.fillText(p.name,x+13,y+(p.id==='farm'?2:-5));
 }
 const [x,y]=map(s.x,s.z);ctx.beginPath();ctx.arc(x,y,5,0,2*Math.PI);ctx.fillStyle='#fff0b4';ctx.fill();ctx.strokeStyle='#53321e';ctx.lineWidth=2;ctx.stroke();
 ctx.font='bold 24px Georgia';ctx.fillStyle='#65432c';ctx.fillText('С',548,54);ctx.fillText('❖',548,78);
 ctx.restore();
 const box=$('travels');box.replaceChildren();
 for(const p of PLACES){const b=document.createElement('button');b.textContent=p.name;b.disabled=!s.visited.includes(p.id)||s.hp<=0;b.title=b.disabled?'Сначала открой это место пешком':'Быстрый путь: 35 минут';b.addEventListener('click',()=>{
   if(travel(s,p.id)){if(p.id==='ruins'&&s.quest<=1&&!s.enemyDown)setQuest(2);yaw=0;atlas.close();resetArc();snapCamera();save();notify('Ты прибыл: '+p.name+'. В пути прошло 35 минут.');}
 });box.append(b);}
}
function toggleAtlas(){if(atlas.open) atlas.close();else if(canPlay()){drawAtlas();modal(atlas);}}
function hit(){
 if(!canPlay()||atkCooldown>0)return;
 swing=.34;atkCooldown=.57;
 const dx=enemyX-s.x,dz=enemyZ-s.z,d=Math.hypot(dx,dz);
 if(!s.enemyDown&&d<2.55&&arc.y<.9){
   hero.root.rotation.y=Math.atan2(-dx,-dz);
   enemyHealth-=38;hostileWind=0;hostileWait=.72;
   if(enemyHealth<=0){s.enemyDown=true;if(s.quest<3)setQuest(3);save();notify('Часовой повержен.');}
   else notify('Удар достиг цели.');
 }else notify('Нет цели перед тобой.');
}
let enemyHealth=100;
const block=()=>keys.has('KeyQ')||blockingTouch;
function updateActors(dt,t){
 const night=isNight(s.minutes), gameTime=(s.minutes-START)/35;
 const minute=s.minutes%DAY, change=minute>12*60?T.MathUtils.smoothstep(minute,18*60+50,19*60):1-T.MathUtils.smoothstep(minute,5*60+50,6*60);
 const lerp=(a,b)=>T.MathUtils.lerp(a,b,change);
 const moveNight=night?.4:.2;
 locate(guard,lerp(-2.35+Math.sin(gameTime)*.39,-2.6),lerp(-14+Math.sin(gameTime*1.3)*1.46,-5.7),lerp(.3+Math.sin(gameTime)*.31,2.5));
 locate(relief,lerp(5.8,2.42),lerp(6.2+Math.sin(gameTime*1.8)*2.35,-14.7+Math.sin(gameTime*2)*1.2),lerp(1.9+Math.sin(gameTime),-.5));
 for(const g of [guard,relief]){g.fabric.color.lerp(militiaColors[regime(s.minutes)],.06);g.cloakMat.color.copy(g.fabric.color);}
 locate(caretaker,night?12.3:12+Math.sin(gameTime*2)*1.7,night?-67.2:-72+.9*Math.cos(gameTime*2),night?-.69:gameTime*.68);
 const cart=caravanPos(s.minutes);locate(merchant,cart.x,cart.z+(cart.dir===0?-1.7:1.7),cart.dir);
 wagon.position.set(cart.x,walkY(cart.x,cart.z),cart.z);wagon.rotation.y=cart.dir;
 guard.pose(t,night?0:.28);relief.pose(t,.37);caretaker.pose(t,night?0:moveNight);merchant.pose(t,.64);
 if(!s.enemyDown){
   const d=Math.hypot(s.x-enemyX,s.z-enemyZ);hostileWait=Math.max(0,hostileWait-dt);
   if(d<18&&canPlay()){
     enemyAngle=Math.atan2(enemyX-s.x,enemyZ-s.z);
     if(d>1.58&&hostileWind<=0){
       const x=enemyX+(s.x-enemyX)/d*dt*2.08,z=enemyZ+(s.z-enemyZ)/d*dt*2.08;
       if(!collide(x,enemyZ,solids,.23))enemyX=x;if(!collide(enemyX,z,solids,.23))enemyZ=z;
     }
     if(d<2.04&&hostileWait<=0&&hostileWind<=0)hostileWind=.72;
   }else if(d>=18&&canPlay()&&Math.hypot(enemyX+12,enemyZ+140)>1.0){
     const dx=-12-enemyX,dz=-140-enemyZ,l=Math.hypot(dx,dz);const x=enemyX+dx/l*dt*1.6,z=enemyZ+dz/l*dt*1.6;
     if(!collide(x,enemyZ,solids,.23))enemyX=x;if(!collide(enemyX,z,solids,.23))enemyZ=z;
     enemyAngle=Math.atan2(-dx,-dz);
   }
   if(hostileWind>0&&canPlay()){
     hostileWind-=dt;
     if(hostileWind<=0){hostileWait=.95;if(d<2.48&&arc.y<.88){s.hp=Math.max(0,s.hp-(block()?6:21));hurt=.52;notify(block()?'Удар принят на щит.':'Часовой ранил тебя.');}}
   }
   enemy.pose(t,d<18&&d>1.65&&hostileWind<=0?.56:.1,hostileWind>0?Math.max(.1,hostileWind/.72):0);
   enemy.root.rotation.z=0;
 }else enemy.root.rotation.z=-1.4;
 locate(enemy,enemyX,enemyZ,enemyAngle);if(s.enemyDown)enemy.root.position.y+=.08;
 relic.rotation.y=t*.55;relic.position.y=walkY(-12,-151)+1.07+.08*Math.sin(t*1.6);relic.visible=s.quest<4;
 candidates=[{id:'guard',name:night?'Сотник Мирон':'Стражник Борис',...at(night?relief:guard)},{id:'farm',name:'Вера',...at(caretaker)},{id:'merchant',name:'Савел',...at(merchant)}];
 if(s.quest<4)candidates.push({id:'seal',name:'Осмотреть печать',x:-12,z:-151});
}
function at(a){return {x:a.root.position.x,z:a.root.position.z};}
function updateCam(dt,snap=false){
 const x=s.x,z=s.z,y=walkY(x,z)+arc.y*.75;
 focus.set(x,y+1.23,z);
 front.set(-Math.sin(yaw),0,-Math.cos(yaw));
 const dist=4.05;
 camDst.set(x+Math.sin(yaw)*Math.cos(pitch)*dist,y+1.47+Math.sin(pitch)*dist,z+Math.cos(yaw)*Math.cos(pitch)*dist);
 // Shorten the camera arm in front of obstructing walls.
 for(let f=.26;f<=1;f+=.14){
   dyn.copy(focus).lerp(camDst,f);
   if(solids.some(b=>Math.abs(dyn.x-b.x)<(b.canopy??b.w*.5)+.1&&Math.abs(dyn.z-b.z)<(b.canopy??b.d*.5)+.1)){camDst.lerp(focus,1-Math.max(.25,f-.14));break;}
 }
 camDst.y=Math.max(camDst.y,walkY(camDst.x,camDst.z)+.48);
 if(snap)camera.position.copy(camDst);else camera.position.lerp(camDst,1-Math.exp(-dt*15));
 camera.lookAt(focus.x+front.x*.83,focus.y-.10+(.37-pitch)*1.0,focus.z+front.z*.83);
}
function resetArc(){arc={y:0,v:0};jumpStart=null;}
function jump(){if(canPlay()&&arc.y===0&&arc.v===0){jumpStart={x:s.x,z:s.z};arc={y:0,v:JUMP_SPEED};}}
function snapCamera(){locate(hero,s.x,s.z,yaw);updateCam(0,true);}
function update(dt,t){
 let moving=0;
 if(canPlay()){
   arc=tickJump(arc,dt);
   if(jumpStart&&arc.y===0&&arc.v===0){
     if(collide(s.x,s.z,solids)){s.x=jumpStart.x;s.z=jumpStart.z;}
     jumpStart=null;
   }
   s.minutes+=dt*2.4;
   if(s.minutes-stamp>4){stamp=s.minutes;save();}
   const ax=(+keys.has('KeyD')-+keys.has('KeyA'))+joystick.x, az=(+keys.has('KeyS')-+keys.has('KeyW'))+joystick.y;
   const len=Math.hypot(ax,az);
   if(len>.05){
     const speed=(block()?1.85:keys.has('ShiftLeft')||keys.has('ShiftRight')?6.4:4.0)*Math.min(1,len)*dt;
     const dx=(Math.cos(yaw)*ax+Math.sin(yaw)*az)/len*speed,dz=(-Math.sin(yaw)*ax+Math.cos(yaw)*az)/len*speed;
     if(!collide(s.x+dx,s.z,solids,.29,arc.y))s.x+=dx;
     if(!collide(s.x,s.z+dz,solids,.29,arc.y))s.z+=dz;
     const angle=Math.atan2(-dx,-dz);hero.root.rotation.y+=Math.atan2(Math.sin(angle-hero.root.rotation.y),Math.cos(angle-hero.root.rotation.y))*Math.min(1,dt*18);
     moving=keys.has('ShiftLeft')?1:.71;
   }
   hero.root.position.set(s.x,walkY(s.x,s.z)+arc.y-hurt*.055,s.z);
   swing=Math.max(0,swing-dt);atkCooldown=Math.max(0,atkCooldown-dt);hurt=Math.max(0,hurt-dt);
   const prior=s.visited.length, zone=markVisited(s);
   if(s.visited.length!==prior){save();notify('Открыто: '+zone.name+' · добавлено в атлас');}
   $('where').textContent=zone?.name??(s.z< -44?'Старый ельник':'Старая дорога');
   if(zone?.id==='ruins'&&s.quest<2&&!s.enemyDown)setQuest(2);
   const r=regime(s.minutes);if(r!==previousRegime){previousRegime=r;notify('Орден выставил дозор. На воротах Переправья сменились знамёна.');save();}
 }
 updateActors(dt,t);hero.pose(t,moving,swing?1-swing/.34:0,block(),arc.y);updateCam(dt);
 const hr=(s.minutes%DAY)/60, twilight=hr>=18?T.MathUtils.smoothstep(hr,18,21):1-T.MathUtils.smoothstep(hr,4.9,6.2);
 fogBase.copy(skyDay).lerp(skyNight,.86*twilight);lightBase.copy(lightDay).lerp(lightNight,twilight);
 scene.background.copy(fogBase);scene.fog.color.copy(fogBase);hemi.intensity=2.0-.68*twilight;sun.intensity=1.8-1.52*twilight;sun.color.copy(lightBase);moon.intensity=.22+.58*twilight;
 animateArt(t,regime(s.minutes)==='order');
 if((s.minutes|0)!==lastOrange){lastOrange=s.minutes|0;$('time').textContent='День '+(Math.floor(s.minutes/DAY)+1)+' · '+clockText(s.minutes);}
 if(+$('hpnum').textContent!==s.hp){$('hpnum').textContent=s.hp;$('hp').value=s.hp;}
 if(canPlay()&&Math.abs(s.z+50.9)<4.0&&s.x>-1.2&&s.x<4.5&&!s.hopHint){s.hopHint=true;notify('Поваленный ствол можно перепрыгнуть: Пробел.');}
 nearby=canPlay()?candidates.map(c=>({...c,d:Math.hypot(s.x-c.x,s.z-c.z)})).filter(c=>c.d<2.8).sort((a,b)=>a.d-b.d)[0]:null;
 interact.hidden=!nearby;
 if(nearby)interact.textContent=(nearby.id==='seal'?nearby.name:'Поговорить: '+nearby.name)+'  [E]';
 if(noticeAt>0){noticeAt-=dt;if(noticeAt<=0)$('notice').textContent='';}
 if(s.hp<=0&&!talk.open){
   const last=readSave();if(last.z< -124){last.x=PLACES[0].x;last.z=PLACES[0].z;}last.hp=100;s=last;resetArc();enemyX=-12;enemyZ=-140;enemyHealth=100;hostileWind=0;hostileWait=0;snapCamera();
   $('objective').textContent=objective[s.quest];speak('Ты пал','ПОСЛЕДНЕЕ СОХРАНЕНИЕ','Ты вернулся к последнему сохранению. Если путь оборвался у школы, ты очнёшься в Переправье.');
 }
}
function resize(){const w=host.clientWidth,h=host.clientHeight;renderer.setPixelRatio(Math.min(devicePixelRatio,1.55,Math.sqrt(1800000/Math.max(1,w*h))));renderer.setSize(w,h);camera.aspect=w/h;camera.fov=w/h<.92?77:63;camera.updateProjectionMatrix();}
addEventListener('resize',resize);addEventListener('pagehide',save);document.addEventListener('visibilitychange',()=>{if(document.hidden){save();keys.clear();}});
const relevant=new Set(['KeyW','KeyA','KeyS','KeyD','KeyE','KeyF','KeyQ','KeyM','ShiftLeft','ShiftRight','Space','ArrowLeft','ArrowRight']);
addEventListener('keydown',e=>{
 if(!relevant.has(e.code)||e.ctrlKey||e.metaKey||e.altKey)return;
 if(!started||talk.open||creator.open||atlas.open&&e.code!=='KeyM')return;
 e.preventDefault();if(e.code==='KeyM'&&!e.repeat){toggleAtlas();return;}
 if(e.code==='KeyE'&&!e.repeat)attemptInteract();
 if(e.code==='KeyF'&&!e.repeat)hit();
 if(e.code==='Space'&&!e.repeat)jump();
 if(e.code==='ArrowLeft')yaw+=.19;if(e.code==='ArrowRight')yaw-=.19;
 keys.add(e.code);
});
addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>keys.clear());
function turn(dx,dy){yaw-=dx*.0035;pitch=T.MathUtils.clamp(pitch+dy*.0033,.04,.88);}
renderer.domElement.addEventListener('pointerdown',e=>{
 if(!canPlay()||e.button!==0)return;
 if(document.pointerLockElement===renderer.domElement){hit();return;}
 drag={id:e.pointerId,x:e.clientX,y:e.clientY,length:0};renderer.domElement.setPointerCapture(e.pointerId);
});
renderer.domElement.addEventListener('pointermove',e=>{
 if(!drag||e.pointerId!==drag.id)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.x=e.clientX;drag.y=e.clientY;drag.length+=Math.abs(dx)+Math.abs(dy);turn(dx,dy);
});
renderer.domElement.addEventListener('pointerup',e=>{
 if(!drag||drag.id!==e.pointerId)return;
 if(e.pointerType==='mouse'&&drag.length<5&&canPlay()){
   try{renderer.domElement.requestPointerLock()?.catch(()=>{});}catch{}
 }
 drag=null;
});
renderer.domElement.addEventListener('pointercancel',()=>{drag=null;});
document.addEventListener('mousemove',e=>{if(document.pointerLockElement===renderer.domElement&&canPlay())turn(e.movementX,e.movementY);});
const pad=$('pad');
function padMove(e){const r=pad.getBoundingClientRect();const x=(e.clientX-r.x-r.width*.5)/30,y=(e.clientY-r.y-r.height*.5)/30;joystick.set(x,y).clampLength(0,1);pad.firstElementChild.style.transform='translate('+joystick.x*27+'px,'+joystick.y*27+'px)';}
pad.addEventListener('pointerdown',e=>{pad.setPointerCapture(e.pointerId);padMove(e);});
pad.addEventListener('pointermove',e=>{if(pad.hasPointerCapture(e.pointerId))padMove(e);});
for(const ev of ['pointerup','pointercancel','lostpointercapture'])pad.addEventListener(ev,()=>{joystick.set(0,0);pad.firstElementChild.style.transform='';});
$('attackTouch').addEventListener('click',hit);
$('jumpTouch').addEventListener('click',jump);
$('blockTouch').addEventListener('pointerdown',e=>{$('blockTouch').setPointerCapture(e.pointerId);blockingTouch=true;});
for(const ev of ['pointerup','pointercancel','lostpointercapture'])$('blockTouch').addEventListener(ev,()=>{blockingTouch=false;});
$('mapbtn').addEventListener('click',toggleAtlas);$('closemap').addEventListener('click',()=>atlas.close());interact.addEventListener('click',attemptInteract);
$('start').addEventListener('click',()=>{intro.close();if(s.look){started=true;save();}else{creatorUI.prepare(DEFAULT,false);modal(creator);creatorUI.resize();}});
$('lookbtn').addEventListener('click',()=>{if(canPlay()){creatorUI.prepare(s.look??DEFAULT,true);modal(creator);creatorUI.resize();}});
creator.addEventListener('cancel',e=>{if(!started)e.preventDefault();});
intro.addEventListener('cancel',e=>e.preventDefault());
if(s.look)$('start').textContent='Продолжить';
$('objective').textContent=objective[s.quest];
resize();snapCamera();intro.showModal();
let prev=performance.now();
renderer.setAnimationLoop(now=>{const dt=Math.min(.095,Math.max(0,(now-prev)/1000));prev=now;if(creator.open){creatorUI.render(now/1000);}else{update(document.hidden?0:dt,now/1000);renderer.render(scene,camera);}});
