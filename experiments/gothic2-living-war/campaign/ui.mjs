import {resources,factions,lands,roads,territoryOwner,createWorld,step} from './war.mjs';
const $=id=>document.getElementById(id);
const resourceNames={wood:'Лес',iron:'Железо',gold:'Золото',food:'Еда'};
const magicNames={fire:'Огонь',water:'Вода',sect:'Сектанты'};
const color=id=>id?factions[id].color:'#c2b38d';
const owner=id=>id?factions[id].label:'Нейтральная территория';
const center=r=>[(lands[r.a].x+lands[r.b].x)/2,(lands[r.a].y+lands[r.b].y)/2];
const factionTitle=(id)=>id?factions[id].symbol:'◇';
let world=createWorld(),selection=['post','tavern'];
function describe(){
 const [kind,id]=selection;
 if(kind==='land'){const t=lands[id];$('details').innerHTML='<b>'+t.name+'</b> · '+owner(territoryOwner(world,id))+'<br>'+resources.map((r,i)=>resourceNames[r]+' '+t.yield[i]).join(' · ')+' · Рабочих мест: '+t.workers;return;}
 const p=world.posts[id],r=roads[id];
 $('details').innerHTML='<b>'+r.name+'</b> · '+r.kind+' · '+owner(p.owner)+'<br>Уровень '+p.level+' · Гарнизон '+p.garrison+' · Провизия '+p.food+' · Смены владельца '+p.captures;
}
function render(){
 $('day').textContent='День '+world.day;
 const lines=Object.values(roads).map(r=>'<line class="road" x1="'+lands[r.a].x+'" y1="'+lands[r.a].y+'" x2="'+lands[r.b].x+'" y2="'+lands[r.b].y+'"/>').join('');
 const posts=Object.entries(roads).map(([id,r])=>{const [x,y]=center(r),p=world.posts[id],c=color(p.owner);return '<g class="node" tabindex="0" role="button" aria-label="'+r.name+'" data-kind="post" data-id="'+id+'" transform="translate('+x+' '+y+')"><title>'+r.name+' · '+owner(p.owner)+'</title><path class="marker" d="M -13 -17 H 14 V 5 L 0 13 L -13 5 Z" fill="'+c+'" stroke="#2b2115" stroke-width="3"/><path d="M -14 13 V -17" stroke="#d4b17d" stroke-width="2"/><text class="sym" style="fill:#251c12;stroke:none" text-anchor="middle" y="-3">'+factionTitle(p.owner)+'</text></g>';}).join('');
 const arms=world.armies.map(a=>{const [x,y]=center(roads[a.target]);return '<text class="army" x="'+(x+20)+'" y="'+(y+23)+'" fill="'+color(a.owner)+'" font-size="18" font-weight="700">⚔ '+a.size+'</text>';}).join('');
 const cities=Object.entries(lands).map(([id,t])=>'<g class="node" tabindex="0" role="button" aria-label="'+t.name+'" data-kind="land" data-id="'+id+'"><circle class="marker" cx="'+t.x+'" cy="'+t.y+'" r="13" fill="'+color(territoryOwner(world,id))+'" stroke="#211e16" stroke-width="3"/><text x="'+t.x+'" y="'+(t.y+28)+'" text-anchor="middle">'+(id==='tavern'?'Мёртвая гарпия':id==='water'?'Раскопки · Вода':t.name)+'</text></g>').join('');
 $('map').innerHTML='<path d="M 0 282 Q 156 308 281 247 T 494 263 T 830 298" stroke="#5c7372" stroke-width="12" fill="none" opacity=".27"/><path d="M 0 65 L 140 40 L 216 91 L 314 44 L 490 40 L 536 0 H 0 Z M 830 305 L 782 332 L 722 428 L 610 462 V 480 H 830 Z" fill="#667052" opacity=".15"/>'+lines+cities+posts+arms;
 $('factions').innerHTML=Object.entries(factions).map(([id,f])=>{const u=world.factions[id];return '<article class="card" style="--banner:'+f.color+'"><b>'+f.symbol+' '+f.label+'</b><div class="stock">'+resources.map(r=>'<span>'+resourceNames[r]+' <strong>'+u.stock[r]+'</strong></span>').join('')+'</div><small>В резерве: '+u.soldiers+' · Обменов: '+u.trades+'<br>'+(f.neutral?'Нейтральная сторона':('Маги: '+(u.magic.map(k=>magicNames[k]).join(', ')||'нет')))+'</small></article>';}).join('');
 $('log').innerHTML=world.log.length?world.log.slice(-25).reverse().map(e=>'<li><small>День '+e.day+'</small>'+e.line+'</li>').join(''):'<li>Первая сводка появится после хода. Заставы и фермы уже распределены.</li>';
 describe();
}
function advance(n){for(let i=0;i<n;i++)world=step(world);render();}
$('next').onclick=()=>advance(1);$('ten').onclick=()=>advance(10);$('reset').onclick=()=>{world=createWorld();render();};
function select(e){const g=e.target.closest('[data-id]');if(g){selection=[g.dataset.kind,g.dataset.id];describe();}}
$('map').onclick=select;$('map').onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(e);}};
render();
