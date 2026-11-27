import {readFileSync, readdirSync} from 'node:fs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const dir=new URL('../dist/assets/packs/',import.meta.url);
function glb(name){
 const b=readFileSync(new URL(name,dir));
 assert.equal(b.toString('ascii',0,4),'glTF',name);
 assert.equal(b.readUInt32LE(8),b.length,name);
 return JSON.parse(b.toString('utf8',20,20+b.readUInt32LE(12)));
}
test('every shipped GLB is self-contained',()=>{
 const files=readdirSync(dir).filter(p=>p.endsWith('.glb'));
 assert.equal(files.length,16);
 for(const name of files){
  const a=glb(name);
  assert.ok(a.buffers.every(b=>!b.uri),name);
  assert.ok(a.images?.every(i=>!i.uri)??true,name);
 }
});
test('selected outfits preserve outfit meshes, head joint and four-way skinning',()=>{
 for(const group of ['female','male'])for(const type of ['ranger','peasant']){
  const d=glb('outfit-'+group+'_'+type+'.glb');
  const names=new Set(d.nodes.map(n=>n.name));
  for(const name of ['Head','hand_l','hand_r'])assert.ok(names.has(name),name);
  assert.ok(d.nodes.filter(n=>n.skin!==undefined).length>=4);
  assert.ok(d.meshes.some(m=>m.primitives.some(p=>p.attributes.WEIGHTS_0!==undefined)));
  assert.ok(![...names].some(n=>n?.endsWith('Head_Hood')));
 }
});
test('walk, idle, jog, jump and sword clips use only joint rotation channels',()=>{
 const a=glb('quaternius-motion.glb');
 assert.deepEqual(a.animations.map(a=>a.name).sort(),['Idle_Loop','Jog_Fwd_Loop','Jump_Loop','Sword_Attack','Sword_Idle','Walk_Loop']);
 assert.ok(a.animations.every(m=>m.channels.every(c=>c.target.path==='rotation')));
});
