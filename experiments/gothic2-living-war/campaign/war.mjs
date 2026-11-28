// Living Khorinis campaign rules. Geographic links are a gameplay abstraction, not a ZEN map.
export const resources = ['wood','iron','gold','food'];
export const factions = {
 city:{label:'Хоринис', color:'#bbc9d3', symbol:'✦', magic:['fire','water'], population:24, soldiers:6, stock:[16,9,10,12]},
 onar:{label:'Наёмники Онара',color:'#ba765a',symbol:'⚔',magic:['fire','water','sect'],population:27,soldiers:8,stock:[17,13,9,28]},
 fire:{label:'Маги Огня',color:'#e1a164',symbol:'♨',magic:[],population:15,soldiers:3,stock:[10,8,7,13],neutral:true},
 water:{label:'Маги Воды',color:'#78b3d6',symbol:'≈',magic:[],population:15,soldiers:3,stock:[9,8,7,13],neutral:true},
 free:{label:'Вольные фермеры',color:'#9fa97b',symbol:'❧',magic:[],population:10,soldiers:2,stock:[6,4,4,11],neutral:true}
};
export const lands = {
 city:{name:'Хоринис',owner:'city',yield:[7,3,4,1],workers:9,x:100,y:125},
 onar:{name:'Ферма Онара',owner:'onar',yield:[4,4,2,7],workers:6,x:660,y:325},
 sekob:{name:'Ферма Секоба',owner:'onar',yield:[3,2,1,6],workers:5,x:565,y:185},
 bengar:{name:'Ферма Бенгара',owner:'onar',yield:[2,5,1,5],workers:5,x:470,y:389},
 akil:{name:'Ферма Акила',owner:'free',yield:[3,2,1,6],workers:6,x:251,y:208},
 fire:{name:'Монастырь Огня',owner:'fire',yield:[3,2,2,5],workers:7,x:460,y:83},
 water:{name:'Монастырь Воды · Яркендар',owner:'water',yield:[2,4,3,5],workers:7,x:730,y:78},
 tavern:{name:'Перекрёсток · Мёртвая гарпия',owner:null,yield:[3,2,1,4],workers:4,x:382,y:242,post:'tavern'}
};
export const roads = {
 gate:{a:'city',b:'akil',owner:'city',name:'Городская сторожка',kind:'каменная башня',cover:3},
 tavern:{a:'akil',b:'tavern',owner:null,name:'Постоялый дозор',kind:'деревянный редут',cover:1},
 ridge:{a:'tavern',b:'sekob',owner:'onar',name:'Гребень Секоба',kind:'частокол',cover:2},
 farm:{a:'sekob',b:'onar',owner:'onar',name:'Заслон Онара',kind:'дорожные ворота',cover:3},
 pass:{a:'tavern',b:'bengar',owner:'onar',name:'Перевал Бенгара',kind:'дорожная башня',cover:3},
 mills:{a:'bengar',b:'onar',owner:'onar',name:'Мельничный дозор',kind:'бревенчатая застава',cover:2},
 abbey:{a:'tavern',b:'fire',owner:'fire',name:'Монастырский мост',kind:'мостовая башня',cover:4},
 portal:{a:'fire',b:'water',owner:'water',name:'Заслон у раскопок',kind:'каменная арка',cover:3}
};
export const isHostile=(a,b)=>a!==b && ['city','onar'].includes(a) && ['city','onar'].includes(b);
const values = o => Object.entries(o);
const event = (s,line) => {s.log.push({day:s.day,line});if(s.log.length>90)s.log.shift();};
const stockOf = arr=>Object.fromEntries(resources.map((r,i)=>[r,arr[i]]));
export const territoryOwner=(s,id)=>lands[id].post?s.posts[lands[id].post].owner:lands[id].owner;
export const canHire=(id,school)=>!!factions[id]?.magic.includes(school);
export function createWorld() {
 return {day:0,nextUnit:1,log:[],armies:[],factions:Object.fromEntries(values(factions).map(([id,f])=>[id,{
   stock:stockOf(f.stock),soldiers:f.soldiers,builders:0,magic:[],soldiersLost:0,trades:0,hunger:0,population:f.population,
   today:stockOf([0,0,0,0])}])),
 posts:Object.fromEntries(values(roads).map(([id,p])=>[id,{owner:p.owner,level:1,garrison:p.owner?2:0,food:p.owner?5:0,captures:0,spentAt:-4}]))};
}
function path(s,group,start,targets, finalHostile=false) {
 const q=[[start,[]]],seen=new Set([start]);
 while(q.length){
  const [at,used]=q.shift();
  if(targets.includes(at)) return used;
  for(const [id,r] of values(roads)){
   const to=r.a===at?r.b:r.b===at?r.a:null;
   if(!to || seen.has(to))continue;
   const hostile=isHostile(group,s.posts[id].owner);
   if(hostile && !(finalHostile && targets.includes(to))) continue;
   seen.add(to);q.push([to,[...used,id]]);
  }
 }
 return null;
}
function harvest(s,id,land) {
 const owner=territoryOwner(s,id);if(!owner)return;
 const f=s.factions[owner], output=land.yield.slice();
 const ownHome=Object.keys(lands).filter(k=>territoryOwner(s,k)===owner)[0];
 if(id!==ownHome && !path(s,owner,ownHome,[id])) return; // isolated harvest cannot reach the faction
 // Four baseline jobs. Extra workers prioritize provisions and local abundance.
 const committed=s.armies.filter(a=>a.owner===owner).reduce((n,a)=>n+a.size,0);
 const soldiers=f.soldiers+committed;
 const w=Math.max(0,Math.min(land.workers, Math.floor((f.population-soldiers-f.magic.length)/Object.keys(lands).filter(k=>territoryOwner(s,k)===owner).length)));
 const priority=resources.map((r,i)=>({i,weight:output[i]+(r==='food' && f.stock.food<15?10:0)})).sort((a,b)=>b.weight-a.weight);
 let jobs=[0,0,0,0];
 for(let n=0;n<w;n++)jobs[n<4?priority[n].i:priority[(n-4)%priority.length].i]++;
 resources.forEach((r,i)=>{
   const qty=Math.floor(jobs[i]*output[i]/2);
   f.stock[r]+=qty; f.today[r]+=qty;
 });
}
function trade(s,buyer,seller) {
 const a=s.factions[buyer],b=s.factions[seller];
 if (isHostile(buyer,seller) || a.stock.food>=16 || b.stock.food<22 || a.stock.wood<6) return;
 const home = id=>Object.keys(lands).filter(k=>territoryOwner(s,k)===id);
 const bases=home(buyer);
 if(!bases.length || !path(s,buyer,bases[0],home(seller))) return;
 a.stock.wood-=4;b.stock.wood+=4;b.stock.food-=7;a.stock.food+=7;a.trades++;b.trades++;
 event(s,'Обмен: '+factions[buyer].label+' получает 7 еды за 4 дерева. Поставщик: '+factions[seller].label+'.');
}
function upkeep(s,id) {
 const f=s.factions[id];
 const upkeep=Math.ceil(f.population/8)+Math.ceil(f.soldiers/3)+f.magic.length;
 if(f.stock.food>=upkeep){f.stock.food-=upkeep;f.hunger=0;}
 else {
  f.stock.food=0;f.hunger++;
  if(f.hunger>=2 && f.soldiers>2){
   f.soldiers--; f.soldiersLost++;event(s,factions[id].label+': один боец ушёл из-за нехватки продовольствия.');
  }
 }
 for(const [key,p] of values(s.posts)) {
  if(p.owner!==id) continue;
  const cost=Math.max(1,Math.ceil(p.garrison/2));
  const home=Object.keys(lands).find(k=>lands[k].owner===id);
  if(home && f.stock.food>6 && p.food<8 && path(s,id,home,[roads[key].a,roads[key].b])){
   const supply=Math.min(4,f.stock.food-6,8-p.food);
   f.stock.food-=supply;p.food+=supply;
  }
  if(p.food>=cost)p.food-=cost;
  else {p.food=0;p.garrison=Math.max(0,p.garrison-1);}
 }
}
function invest(s,id) {
 const f=s.factions[id], cfg=factions[id];
 const deployed=s.armies.filter(a=>a.owner===id).reduce((n,a)=>n+a.size,0);
 const garrisoned=Object.values(s.posts).filter(p=>p.owner===id).reduce((n,p)=>n+p.garrison,0);
 const capacity=Math.max(2,Math.floor((f.population-garrisoned)*0.52));
 const canFeed=f.today.food>=Math.ceil(f.population/8)+Math.ceil(f.soldiers/3);
 if(!cfg.neutral && canFeed && f.soldiers+deployed+f.magic.length<capacity && f.stock.food>=13 && f.stock.iron>=4 && f.stock.gold>=3) {
  f.stock.iron-=4;f.stock.gold-=3;f.stock.food-=2;f.soldiers++;
  event(s,cfg.label+': нанят новый боец.');
 }
 if(canFeed && f.stock.wood>=21 && f.stock.iron>=9 && f.stock.food>=15) {
  const p=values(s.posts).find(([,x])=>x.owner===id && x.level<3);
  if(p){
   f.stock.wood-=12;f.stock.iron-=5;p[1].level++;f.builders++;
   event(s,cfg.label+': укреплена застава «'+roads[p[0]].name+'».');
  }
 }
 if(!cfg.neutral && s.day%4===0 && f.stock.gold>=12 && f.stock.food>18 && f.magic.length<cfg.magic.length){
  const school=cfg.magic.find(x=>!f.magic.includes(x)&&(x==='sect'||s.factions[x].stock.food>=12));
  if(school) {
   f.stock.gold-=8;f.stock.food-=2;f.magic.push(school);
   if(school!=='sect')s.factions[school].stock.gold+=8;
   event(s,cfg.label+': нанят союзный маг ('+({water:'Вода',fire:'Огонь',sect:'сектанты'}[school])+').');
  }
 }
}
function resolveArmies(s) {
 const still=[];
 for(const a of s.armies){
  const f=s.factions[a.owner],p=s.posts[a.target];
  if(p.owner===a.owner || (p.owner && !isHostile(a.owner,p.owner))){
   f.soldiers+=a.size;continue;
  }
  if(a.food<1){
   const survivors=Math.max(0,a.size-1);f.soldiers+=survivors;f.soldiersLost+=a.size-survivors;
   event(s,factions[a.owner].label+': отряд отошёл без провизии.');continue;
  }
  a.food--;if(a.travel>0){a.travel--;still.push(a);continue;}
  a.hold++;
  const defense=p.garrison + (p.owner?roads[a.target].cover+p.level-1:1);
  if(a.size+a.support<=defense) {
   if(p.garrison>0&&p.food===0)p.garrison--;
   a.size--;f.soldiersLost++;
   if(a.size>1&&a.food>0)still.push(a);else f.soldiers+=a.size;
   event(s,'Штурм «'+roads[a.target].name+'» отбит.');continue;
  }
  if(a.hold<2){still.push(a);continue;}
  const old = p.owner;
  if(old) s.factions[old].soldiersLost += p.garrison;
  p.owner=a.owner;p.garrison=Math.min(2,a.size);p.food=a.food;p.captures++;
  f.soldiers+=a.size-p.garrison;
  event(s,'Захват: «'+roads[a.target].name+'». Новый владелец: '+factions[a.owner].label+'.');
 }
 s.armies=still;
}
function plan(s,id) {
 const f=s.factions[id], cfg=factions[id];
 if(cfg.neutral || f.soldiers<4 || f.stock.food<8 || f.stock.iron<3 || s.armies.some(a=>a.owner===id))return;
 // Food-poor Khorinis seeks a productive road. Onar answers intrusions rather than occupying neutral farms.
 const contested=s.posts.tavern;
 const needFood=f.today.food<Math.ceil(f.population/8)+Math.ceil(f.soldiers/3) && f.stock.food<=16;
 const ordered=id==='city'?(needFood?['tavern','ridge','pass']:[]):(contested.owner==='city'?['tavern']:[]);
 for(const target of ordered){
  const p=s.posts[target],r=roads[target];
  if(p.owner===id || (p.owner && !isHostile(id,p.owner)) || s.day-p.spentAt<3)continue;
  const route=path(s,id,id==='city'?'city':'onar',[r.a,r.b]);
  if(!route)continue;
  const size=Math.min(f.soldiers-2,5);
  const food=route.length+3;
  if(size<2 || f.stock.food<food+3)continue;
  f.soldiers-=size;f.stock.food-=food;f.stock.iron-=2;p.spentAt=s.day;
  s.armies.push({id:s.nextUnit++,owner:id,target,size,food,route,travel:route.length,hold:0,support:f.magic.length});
  event(s,cfg.label+': отряд из '+size+' бойцов вышел к заставе «'+r.name+'».');
  break;
 }
}
export function step(world) {
 const s=structuredClone(world);
 s.day++;
 for(const [,f] of values(s.factions)) f.today=stockOf([0,0,0,0]);
 for(const [id,t] of values(lands))harvest(s,id,t);
 for(const [id] of values(factions)) for(const [seller] of values(factions)) if(id!==seller) trade(s,id,seller);
 for(const [id] of values(factions)){upkeep(s,id);invest(s,id);}
 resolveArmies(s);
 for(const [id] of values(factions))plan(s,id);
 // Local storage and display limits prevent unbounded stock while observing long campaigns.
 for (const [,f] of values(s.factions)) for(const r of resources) f.stock[r]=Math.min(150,f.stock[r]);
 return s;
}
