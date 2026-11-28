import assert from 'node:assert/strict';
import test from 'node:test';
import {canHire,createWorld,factions,lands,resources,roads,step,territoryOwner} from './war.mjs';
const forward=(w,n)=>{while(n--)w=step(w);return w;};
test('correct initial ownership, all four resources, and a post on every modeled road',()=>{
 const w=createWorld();
 for(const f of ['onar','sekob','bengar'])assert.equal(territoryOwner(w,f),'onar');
 assert.equal(territoryOwner(w,'akil'),'free');
 assert.equal(territoryOwner(w,'tavern'),null);
 assert.equal(territoryOwner(w,'water'),'water');
 assert.ok(lands.city.yield[0]>lands.city.yield[3]);
 for(const x of Object.values(lands))assert.equal(x.yield.filter(n=>n>0).length,4);
 assert.deepEqual(Object.keys(w.posts),Object.keys(roads));
 assert.ok(factions.fire.neutral&&factions.water.neutral);
 assert.equal(canHire('city','sect'),false);
 for(const magic of ['fire','water','sect'])assert.equal(canHire('onar',magic),true);
});
test('economy advances independently of the player and real contenders capture only after holding',()=>{
 let w=createWorld(), landed;
 for(let i=0;i<14;i++){
  const previous=w;w=step(w);
  if(w.posts.tavern.captures>previous.posts.tavern.captures) {
   landed=w;
   const outgoing=previous.armies.find(a=>a.target==='tavern' && a.owner===w.posts.tavern.owner);
   assert.ok(outgoing && outgoing.travel===0 && outgoing.hold===1 && outgoing.food>=1);
  }
 }
 assert.ok(landed);
 assert.equal(w.posts.tavern.owner,'onar');
 assert.ok(w.factions.city.trades>0);
 assert.ok(w.log.some(e=>e.line.includes('нанят новый боец')));
 assert.ok(w.log.some(e=>e.line.includes('укреплена застава')));
 assert.ok(w.log.some(e=>e.line.includes('отряд из')));
 assert.equal(w.armies.some(a=>['water','fire','free'].includes(a.owner)),false);
});
test('an unfed expedition fails and no stocks or unit costs underflow',()=>{
 let w=createWorld();w.armies.push({id:1,owner:'city',target:'tavern',size:4,food:0,travel:0,hold:1,support:0});
 w=step(w);assert.equal(w.posts.tavern.owner,null);assert.ok(w.factions.city.soldiersLost>0);
 const final=forward(createWorld(),400);
 assert.deepEqual(final,forward(createWorld(),400));
 for(const f of Object.values(final.factions))for(const r of resources)assert.ok(Number.isInteger(f.stock[r])&&f.stock[r]>=0&&f.stock[r]<=150);
 for(const a of final.armies)assert.ok(a.food>=0&&a.size>0);
});
