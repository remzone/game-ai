import test from 'node:test';
import assert from 'node:assert/strict';
import {DAY,START,PLACES,roadX,terrain,walkY,clockText,isNight,regime,spawn,markVisited,travel,collide,caravanPos} from '../dist/world.mjs';
test('atlas locks unvisited landmarks and travel advances time without consuming discoveries',()=>{
 const s=spawn();
 assert.equal(travel(s,'farm'),false);
 assert.deepEqual(s.visited,['town']);
 Object.assign(s,{x:9,z:-71});
 assert.equal(markVisited(s).id,'farm');
 markVisited(s);
 assert.deepEqual(s.visited,['town','farm']);
 assert.equal(travel(s,'town'),true);
 assert.equal(s.z,12);assert.equal(s.minutes,START+35);
 assert.equal(travel(s,'farm'),true);assert.equal(s.z,-71);
 assert.equal(s.minutes,START+70);
 s.hp=0;assert.equal(travel(s,'town'),false);
});
test('route is walkable along its full spine; river and walls constrain movement',()=>{
 for(let z=30;z>=-168;z-=.25) assert.equal(collide(roadX(z),z,[]),false,`road blocked at ${z}`);
 assert.equal(collide(9,-39,[]),true);
 assert.equal(walkY(0,-39),.13);
 assert.equal(terrain(0,-39),-1.3);
 assert.equal(collide(2,4,[{x:2,z:4,w:2,d:3}]),true);
 assert.equal(collide(4,4,[{x:2,z:4,w:2,d:3}]),false);
});
test('clock and faction advance together, including past midnight',()=>{
 assert.equal(clockText(START),'16:40');assert.equal(clockText(DAY+8),'00:08');
 assert.equal(isNight(18*60+59),false);assert.equal(isNight(19*60),true);
 assert.equal(regime(19*60+29),'town');assert.equal(regime(19*60+30),'order');
 assert.equal(regime(DAY+7*60),'order');
});
test('caravan moves on the actual regional road and returns',()=>{
 assert.deepEqual(caravanPos(START),caravanPos(START+150));assert.notEqual(caravanPos(START).z,caravanPos(START+35).z);
 for(let m=START;m<START+150;m+=.1){
  const {x,z}=caravanPos(m);
  assert.ok(Math.abs(x-roadX(z))<=1.51);
  assert.ok(!collide(x,z,[]));
 }
});
test('spawn and fast-travel landmarks are inside the terrain',()=>{
 for(const p of PLACES){assert.ok(!collide(p.x,p.z,[]));assert.equal(markVisited({...spawn(),x:p.x,z:p.z})?.id,p.id);}
});
