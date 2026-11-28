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
 session[prefix+'WarUnlocked']=1;
 f.set=(n,value)=>{session[prefix+n]=value;};
 return f;
}
test('neutral crossroads, Onar ridge, rising stocks, trade and sustained territorial control',()=>{
 const f=rules();
 assert.equal(f('Owner'),3);assert.equal(f('RidgeOwner'),2);
 f('Advance')(4);assert.equal(f('Owner'),3);assert.equal(f('AttackSide'),1);assert.equal(f('AttackDays'),2);
 f('Advance')(5);assert.equal(f('Owner'),3);assert.equal(f('AttackDays'),1);
 f('Advance')(6);assert.equal(f('Owner'),1);assert.equal(f('AttackSide'),2);
 f('Advance')(8);assert.equal(f('Owner'),2);assert.equal(f('Revision'),2);
 assert.ok(f('MercenaryTroops')>8);assert.ok(f('Convoys')>0);
});
test('an expedition without provisions cannot capture',()=>{
 const f=rules();
 f('Advance')(4);
 assert.equal(f('AttackSide'),1);
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
 scenario('Advance')(18);
 assert.equal(scenario('RidgeLevel'),2);assert.equal(scenario('PostLevel'),2);
});

test('paladins start with the docks and Onar with the ore camp; output follows control',()=>{
 const f=rules();
 assert.equal(f('DockOwner'),1);assert.equal(f('MineOwner'),2);
 f('Industry')();
 assert.equal(f('MilitiaWood'),20);assert.equal(f('MilitiaGold'),8);
 assert.equal(f('MercenaryIron'),17);assert.equal(f('MercenaryGold'),10);
 assert.equal(f('MercenarySupply'),22);assert.equal(f('MineFood'),4);
 const siege=rules();
 for(const d of [8,10]) siege('Advance')(d);
 assert.equal(siege('AttackPost'),3);assert.equal(siege('AttackSide'),2);
 assert.equal(siege('DockClosed'),1);assert.equal(siege('DockOwner'),1);
 siege('Advance')(12);
 assert.equal(siege('DockOwner'),2);
 siege.set('MercenaryWood',20);siege.set('DockFood',2);
 const cityWood=siege('MilitiaWood');
 siege('Industry')();
 assert.equal(siege('MercenaryWood'),26);assert.equal(siege('MilitiaWood'),cityWood);
 siege.set('DockFood',0);siege.set('MineFood',0);
 siege('Industry')();assert.equal(siege('DockClosed'),1);assert.equal(siege('MineClosed'),1);
});
test('paladins can take the ore camp only with the ridge route, supply and a stronger force',()=>{
 const f=rules();
 f.set('Rounds',9);
 f.set('MilitiaSupply',40);f.set('MilitiaTroops',12);f.set('MercenaryTroops',6);
 assert.equal(f('PlanIndustry')(),0);
 f.set('RidgeOwner',1);
 assert.equal(f('PlanIndustry')(),1);
 assert.equal(f('AttackPost'),4);assert.equal(f('MineClosed'),1);
 f('ResolveOperation')();f('ResolveOperation')();
 assert.equal(f('MineOwner'),1);assert.equal(f('RidgeOwner'),1);
 f.set('MilitiaTroops',8);f.set('MineFood',2);const before=f('MilitiaIron');const enemy=f('MercenaryIron');
 f('Industry')();assert.equal(f('MilitiaIron'),before+5);assert.equal(f('MercenaryIron'),enemy);
});

test('farm shipment loads first and food reaches only its warehouse the following day',()=>{
 const f=rules();
 f('FarmFreight')();
 assert.equal(f('MilitiaSupply'),15);assert.equal(f('MercenarySupply'),22);
 assert.equal(f('LobartCart'),23);
 assert.deepEqual([f('OnarCart'),f('SekobCart'),f('BengarCart')],[17,15,13]);
 f('FarmFreight')();
 assert.equal(f('LobartCart'),0);assert.equal(f('SekobCart'),0);
 assert.equal(f('MilitiaSupply'),38);assert.equal(f('MercenarySupply'),67);
});
test('convoy transfers real food only on arrival and returns it when control changed',()=>{
 const f=rules();f.set('MilitiaSupply',45);f.set('MercenarySupply',50);
 const before=f('DockFood');f('OutpostFreight')();
 assert.equal(f('CityRoute'),3);assert.equal(f('CityCargo'),16);
 assert.equal(f('MilitiaSupply'),29);assert.equal(f('DockFood'),before);
 f('OutpostFreight')();assert.equal(f('DockFood'),before+16);assert.equal(f('CityCargo'),0);
 assert.equal(f('CityReturn'),1);
 const blocked=rules();blocked.set('MilitiaSupply',45);blocked('OutpostFreight')();
 blocked.set('DockOwner',2);blocked('OutpostFreight')();
 assert.equal(blocked('MilitiaSupply'),45);assert.equal(blocked('DockFood'),5);
});
test('war is held for the first-approach prologue, while both supply chains work',()=>{
 const f=rules();f.set('WarUnlocked',0);f('Advance')(20);
 assert.equal(f('Owner'),3);assert.equal(f('Dispatched'),0);
 assert.ok(f('Arrivals')>0);
 f.set('WarUnlocked',1);f('Advance')(27);assert.ok(f('Dispatched')>0);
});

test('Brotherhood mage is actually hired only by Onar and the neutral camp is paid',()=>{
 const f=rules();
 f.set('MercenaryGold',20);f.set('MercenarySupply',21);f.set('SectFood',9);
 assert.equal(Number(f('CanHireSect')()),0);
 f('TendSect')();assert.equal(Number(f('CanHireSect')()),1);
 f('HireSect')();f('HireSect')();
 assert.equal(f('MercenarySect'),1);assert.equal(f('SectGold'),16);
 assert.equal(f('MercenaryGold'),8);assert.equal(f('MercenarySupply'),19);
 assert.equal(typeof f('MilitiaSect'),'undefined');
});

test('Fire serves only the city, with a higher threshold for Onar to hire Water',()=>{
 const f=rules();
 f.set('MilitiaGold',75);f.set('MilitiaSupply',40);
 f.set('MercenaryGold',28);f.set('MercenarySupply',40);
 f.set('WaterSupply',40);
 f('Invest')();
 assert.equal(f('MilitiaFire'),1);assert.equal(f('MilitiaWater'),1);
 assert.equal(f('MercenaryWater'),0);assert.equal(typeof f('MercenaryFire'),'undefined');
 f.set('MercenaryGold',50);f('Invest')();
 assert.equal(f('MercenaryWater'),1);
});
