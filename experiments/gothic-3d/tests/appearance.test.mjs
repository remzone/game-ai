import {test} from 'node:test';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {OPTIONS,SPECIES,validateLook,bodyScale,outfitKey} from '../dist/appearance.mjs';
test('legacy appearance migrates female rig without dropping outfit or face choices',()=>{
 assert.deepEqual(validateLook({frame:1,face:2,armor:1}),{...validateLook(),sex:1,frame:1,face:2,armor:1});
 assert.equal(validateLook({sex:0,frame:1}).sex,0);
 assert.equal(validateLook({sex:1,frame:0}).frame,0);
 assert.equal(validateLook({race:6}).race,0);
});
test('every species has distinct proportions, not just a palette change',()=>{
 assert.equal(SPECIES.length,OPTIONS.race.length);
 assert.equal(new Set(SPECIES.map((_,race)=>bodyScale(validateLook({race})).join(','))).size,6);
 assert.ok(SPECIES[3].jaw>SPECIES[0].jaw);
 assert.ok(SPECIES[4].y<SPECIES[0].y);
});
test('sex chooses the base rig for all outfits including Border Armor independently of build',()=>{
 for(let armor=0;armor<3;armor++){
  const a=outfitKey(validateLook({sex:0,armor,frame:1}));
  const b=outfitKey(validateLook({sex:1,armor,frame:0}));
  assert.ok(a.startsWith('male')&&b.startsWith('female'));
  assert.equal(a,outfitKey(validateLook({sex:0,armor,frame:0})));
 }
});
test('six head morphs match topology and stay aligned to the shared head rig',()=>{
 const read=n=>JSON.parse(readFileSync(new URL('../dist/assets/'+n,import.meta.url)));
 const morphs=Object.values(read('face-morphs.json')), size=read('head.json').body[0].length;
 assert.equal(morphs.length,6);
 for(const m of morphs){assert.equal(m.length,size);assert.ok(Math.max(...m.map(Math.abs))<.05);}
});
