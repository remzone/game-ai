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
test('neutral crossroads, Onar ridge, rising stocks, trade and sustained territorial control',()=>{
 const f=rules();
 assert.equal(f('Owner'),3);assert.equal(f('RidgeOwner'),2);
 f('Advance')(3);assert.equal(f('Owner'),3);assert.equal(f('AttackSide'),1);assert.equal(f('AttackDays'),2);
 f('Advance')(4);assert.equal(f('Owner'),3);assert.equal(f('AttackDays'),1);
 f('Advance')(5);assert.equal(f('Owner'),1);assert.equal(f('AttackSide'),2);
 f('Advance')(7);assert.equal(f('Owner'),2);assert.equal(f('Revision'),2);
 assert.ok(f('MercenaryTroops')>8);assert.ok(f('Convoys')>0);
});
test('an expedition without provisions cannot capture',()=>{
 const f=rules();
 f('Advance')(3);
 // Advance food drain until the force loses supply, without running another planning tick.
 for(let i=0;i<26;i++)f('Upkeep')();
 f('ResolveOperation')();
 assert.equal(f('Owner'),3);assert.equal(f('AttackSide'),0);
});
test('no duplicate day settlement, no overflow, bounded catch-up',()=>{
 const f=rules();
 for(let i=0;i<30;i++)f('Deliver')(1);assert.equal(f('MilitiaSupply'),100);
 f('Advance')(100);assert.equal(f('Day'),30);
 f('Advance')(30);assert.equal(f('Day'),30);
 f('Advance')(29);assert.equal(f('Day'),30);
 f('Advance')(100);assert.equal(f('Day'),60);
 for(const team of ['Mercenary','Militia','Fire','Water','Free']) for(const stock of ['Wood','Iron','Gold','Supply'])
   assert.ok(f(team+stock)>=0 && f(team+stock)<=100);
 assert.equal(typeof f('MilitiaSect'),'undefined');
});

test('construction consumes stock, completes two ticks later and survives change of owner',()=>{
 const f=rules();
 const iron=f('MercenaryIron');
 f('Fortify')();assert.equal(f('RidgeWork'),0);assert.equal(f('MercenaryIron'),iron);
 f('Harvest')();
 const after=f('MercenaryIron');
 f('Fortify')();assert.equal(f('RidgeWork'),2);assert.equal(f('MercenaryIron'),after-14);
 f('Fortify')();assert.equal(f('RidgeWork'),1);assert.equal(f('RidgeLevel'),1);
 f('Fortify')();assert.equal(f('RidgeLevel'),2);assert.equal(f('MercenaryIron'),after-14);
 const scenario=rules();
 scenario('Advance')(12);
 assert.equal(scenario('RidgeLevel'),2);assert.equal(scenario('PostLevel'),2);
});
