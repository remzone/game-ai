import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
// This mechanically exercises the integer/control-flow subset used in the original rule file.
// It is not a Gothic or Daedalus compiler. Actual engine compatibility needs a separate test.
const prefix='Patch_LivingKhorinis_';
const daedalus=fs.readFileSync(new URL('./LivingKhorinis.d', import.meta.url), 'utf8');
const code=daedalus.replace(/\bfunc\s+(?:int|void)\s+/g,'function ')
 .replace(/\bconst\s+int\s+/g,'const ')
 .replace(/([,(]\s*)var int (\w+)/g,'$1$2')
 .replace(/\bvar\s+int\s+(\w+);/g,'var $1 = 0;');
function rules(){
 const session=vm.createContext({});
 vm.runInContext(code,session);
 const f=n=>session[prefix+n];
 f('Begin')(0);
 return f;
}
test('unguarded logistics lose the post without player input; militia can later recapture',()=>{
 const f=rules();
 f('Advance')(3);assert.equal(f('Owner'),2);assert.equal(f('Revision'),1);
 f('Advance')(5);assert.equal(f('Revision'),1);
 f('Advance')(13);assert.ok(f('Revision')>1);
});
test('supporting the militia can secure the initially neutral post',()=>{
 const f=rules();
 f('Deliver')(1);f('Deliver')(1);
 f('Advance')(3);
 assert.equal(f('Owner'),1);assert.equal(f('Revision'),1);
});
test('no duplicate day settlement, no supply overflow, bounded catch-up',()=>{
 const f=rules();
 for(let i=0;i<30;i++)f('Deliver')(1);assert.equal(f('MilitiaSupply'),10);
 f('Advance')(100);assert.equal(f('Day'),30);
 f('Advance')(30);assert.equal(f('Day'),30);
 f('Advance')(29);assert.equal(f('Day'),30);
 f('Advance')(100);assert.equal(f('Day'),60);
});
