import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = s => fs.readFileSync(new URL(s,import.meta.url),'utf8');
const src = read('../gothic2-living-war/LivingKhorinis.d') + "\n" + read('./LivingKhorinisNative.d');
const code = src.replace(/\binstance (\w+)\([^)]+\) \{[^}]+\};/g, 'const $1 = "$1";')
 .replace(/\bfunc\s+(?:int|void|string)\s+/g,'function ')
 .replace(/\bconst\s+(?:int|string)\s+/g,'const ')
 .replace(/([,(]\s*)var (?:int|string|C_NPC) (\w+)/g,'$1$2')
 .replace(/\bvar\s+(?:int|C_NPC|string)\s+(\w+);/g,'var $1 = 0;');

// Only engine API boundaries are mocked; rules and adapter are mechanically
// run from the same exact source that the real GDC compiler consumes.
const newHandle = instance => ({instance,name:[],armor:0});
function simulate({actors=new Map(), prevState={}, gameDay=0, bread=2}={}) {
    const self=newHandle("self"), other=newHandle("player");
    const messages=[];
    let calls=0;
    const c=vm.createContext({
        self,other,TRUE:1,FALSE:0,ItFo_Bread:1,MALE:0,Face_N_Normal01:0,BodyTex_N:0,ItAr_Mil_L:1,ItAr_Sld_L:2,ItAr_Bau_M:3,ItAr_NOV_L:4,ItMw_1H_Mil_Sword:5,AR_NONE:0,hero:other,
        Npc_ClearAIQueue:()=>{}, AI_GotoWP:()=>{},Npc_GetDistToWP:()=>0,Npc_GetDistToNpc:()=>0,CreateInvItems:()=>{},AI_EquipBestMeleeWeapon:()=>{},
        B_Attack:(a,b)=>{assert.match(a.instance,/^LKN_(City|Onar)Scout$/);assert.match(b.instance,/^LKN_(City|Onar)Scout$/);messages.push("clash")},
        B_SetNpcVisual: (npc,sex,head,face,body,armor)=>{ npc.armor=armor; },
        Wld_InsertItem:(name,where)=>messages.push(name+":"+where),
        Wld_GetDay:()=>gameDay,
        Hlp_GetNpc: name=>actors.get(name),
        Hlp_IsValidNpc: value=>!!value,
        Wld_InsertNpc: (name,where)=>{
            assert.ok(!actors.has(name), 'should not insert a duplicate');
            const item = newHandle(name);
            item.where=where;
            actors.set(name,item);
            c.self=item;
            calls++;
        },
        Wld_RemoveNpc: ()=>{ throw new Error("persistent actors must not be removed"); },
        Npc_HasItems: (who,item)=>{ return who===other ? bread : 0; },
        Npc_RemoveInvItems: (who,item,n)=>{ if (who===other) bread-=n; else assert.notEqual(who.armor,item); },
        Print: line=>messages.push(line),
    });
    vm.runInContext(code,c);
    Object.assign(c,prevState);
    return {c,actors,messages,get bread(){return bread;},get calls(){return calls;},
      day:n=>{gameDay=n;},
      tick:()=>{c.LKN_Refresh();assert.equal(c.self,self);assert.equal(c.other,other);},
      enter:()=>{c.LKN_OnWorldInit();assert.equal(c.self,self);assert.equal(c.other,other);},
      save:()=>({actors:new Map(actors),prevState:Object.fromEntries(
          Object.entries(c).filter(([k,v])=>/^(LKN_|Patch_LivingKhorinis_)/.test(k) && typeof v==='number')
      ),gameDay,bread}),
    };
}

test('new units and named posts are persistent; water novice only in Jharkendar',()=>{
 const sim=simulate();
 sim.enter();sim.enter();sim.tick();
 assert.equal(sim.calls,11);
 assert.equal(sim.actors.get('LKN_Ridge').where,'NW_BIGFARM_FARM4_PATH_01');
 assert.equal(sim.actors.get('LKN_PostGuard').name[0],'Neutral tavern lookout');
 assert.equal(sim.actors.get('LKN_OnarScout').where,'NW_BIGFARM_PATH_01');
 assert.equal(sim.actors.get('LKN_PostGuard').where,'TAVERNE');
 assert.equal(sim.actors.has('LKN_WaterNovice'),false);
 sim.c.LKN_OnAddonInit();sim.c.LKN_OnAddonInit();
 assert.equal(sim.actors.get('LKN_WaterNovice').where,'ADW_ENTRANCE_BUILDING2_04');
 sim.day(3);sim.tick();sim.tick();
 assert.equal(sim.messages.filter(x=>x==='clash').length,2);
 sim.day(7);sim.tick();
 assert.equal(sim.actors.get('LKN_PostGuard').name[0],"Onar's mercenary lookout");
 assert.equal(sim.actors.get('LKN_PostGuard').armor,2);
 assert.ok(sim.messages.includes('LKN_RidgeBuilding:NW_BIGFARM_FARM4_PATH_01'));
 assert.equal(sim.messages.filter(x=>x.startsWith('LKN_RidgeBuilding:')).length,1);
 assert.ok(sim.actors.has('LKN_RidgeReserve'));
 const back=simulate(sim.save());back.enter();back.tick();
 assert.equal(back.calls,0);
 assert.ok(!back.messages.some(x=>x.includes("Building:")));
});
test('one bread per day; no duplicate delivery after reload',()=>{
 const sim=simulate();sim.enter();
 sim.c.LKN_DeliverMilitia();sim.c.LKN_DeliverMilitia();
 assert.equal(sim.bread,1);
 assert.equal(sim.c.Patch_LivingKhorinis_MilitiaSupply,20);
 const back=simulate(sim.save());back.enter();back.c.LKN_DeliverMilitia();
 assert.equal(back.bread,1);
 back.day(1);back.c.LKN_DeliverMilitia();assert.equal(back.bread,0);
});
