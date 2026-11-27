export const DAY = 1440;
export const START = 16 * 60 + 40;
export const PLACES = [
  {id:'town',name:'Переправье',x:0,z:12,r:27},
  {id:'farm',name:'Волчий хутор',x:9,z:-71,r:11},
  {id:'ruins',name:'Пепельная школа',x:-12,z:-143,r:24,arrivalZ:-131}
];
export const ROAD = [[0,30],[0,-31],[0,-47],[9,-71],[5,-87],[-12,-115],[-12,-151],[-12,-165]];
export function roadX(z) {
  for(let i=1;i<ROAD.length;i++){
    const [a,b]=ROAD[i-1], [c,d]=ROAD[i];
    if(z>=d) return a+(c-a)*Math.max(0,Math.min(1,(z-b)/(d-b)));
  }
  return ROAD.at(-1)[0];
}
export function terrain(x,z){
  if(Math.abs(z+39)<5) return -1.3;
  const away=Math.min(1,Math.abs(x-roadX(z))/45);
  const island=1-Math.exp(-Math.max(0,Math.abs(z+39)-5)/8);
  return island*(Math.max(0,(-z-91))*0.037 + away*(Math.sin(x*.16+z*.045)*2.1+Math.cos(z*.13-x*.074)*1.3));
}
export const walkY=(x,z)=>Math.abs(z+39)<6.1 && Math.abs(x)<3.6 ? .13 : terrain(x,z);
export const clockText=m=>Math.floor((m%DAY)/60).toString().padStart(2,'0')+':'+Math.floor(m%60).toString().padStart(2,'0');
export const isNight=m=>m%DAY>=19*60 || m%DAY<6*60;
export const regime=m=>m>=19*60+30?'order':'town';
export const spawn=()=>({x:0,z:14,minutes:START,hp:100,quest:0,visited:['town'],enemyDown:false});
export function markVisited(s){
  const found=PLACES.find(p=>Math.hypot(s.x-p.x,s.z-p.z)<p.r);
  if(found&&!s.visited.includes(found.id))s.visited.push(found.id);
  return found;
}
export function travel(s,id){
  const p=PLACES.find(p=>p.id===id);
  if(!p||!s.visited.includes(id)||s.hp<=0) return false;
  s.x=p.x;s.z=p.arrivalZ??p.z;s.minutes+=35;return true;
}
export function collide(x,z,solids,r=.29){
  return Math.abs(x)>62 || z>36 || z< -173 || (Math.abs(z+39)<6 && Math.abs(x)>3.15)
    || solids.some(b=>Math.abs(x-b.x)<b.w/2+r && Math.abs(z-b.z)<b.d/2+r);
}
export function caravanPos(minutes){
  const a=((minutes-START+9000)%150)/150;
  const span=a<.5?a*2:(1-a)*2;
  const z=3-86*span;
  return {x:roadX(z)+1.5,z,dir:a<.5?0:Math.PI};
}
