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
function simulate({actors=new Map(), prevState={}, gameDay=0, bread=2, heroRange=3000}={}) {
    const self=newHandle("self"), other=newHandle("player");
    const messages=[];
    let calls=0;
    const c=vm.createContext({
        self,other,TRUE:1,FALSE:0,ItFo_Bread:1,MALE:0,Face_N_Normal01:0,BodyTex_N:0,ItAr_Mil_L:1,ItAr_Sld_L:2,ItAr_Bau_M:3,ItAr_NOV_L:4,ItAr_Pal_M:6,ItMw_1H_Mil_Sword:5,AR_NONE:0,hero:other,NPC_RUN:2,
        Npc_ClearAIQueue:()=>{}, AI_GotoWP:(npc,where)=>{npc.target=where;},Npc_GetDistToWP:(npc)=>npc===other?heroRange:0,Npc_GetDistToNpc:()=>0,CreateInvItems:()=>{},AI_EquipBestMeleeWeapon:()=>{},
        B_Attack:(a,b)=>{
          assert.match(a.instance,/^LKN_((City|Onar)Scout|FortGuard[AB]|Raider[ABC])$/);
          assert.match(b.instance,/^LKN_((City|Onar)Scout|FortGuard[AB]|Raider[ABC])$/);
          messages.push("clash");
        },
        AI_SetWalkMode:()=>{}, AI_StartState:(actor,state)=>{actor.lastState=state.name;}, IntToString:String,
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
        Print: line=>messages.push(line), ConcatStrings:(a,b)=>a+b,
    });
    vm.runInContext(code,c);
    Object.assign(c,prevState);
    return {c,actors,messages,get bread(){return bread;},get calls(){return calls;},
      day:n=>{gameDay=n;}, range:n=>{heroRange=n;},
      tick:()=>{c.LKN_Refresh();assert.equal(c.self,self);assert.equal(c.other,other);},
      enter:()=>{c.LKN_OnWorldInit();assert.equal(c.self,self);assert.equal(c.other,other);},
      save:()=>({actors:new Map(actors),prevState:Object.fromEntries(
          Object.entries(c).filter(([k,v])=>/^(LKN_|Patch_LivingKhorinis_)/.test(k) && typeof v==='number')
      ),gameDay,bread,heroRange}),
    };
}

test('new units and named posts are persistent; water novice only in Jharkendar',()=>{
 const sim=simulate();
 sim.enter();sim.enter();sim.tick();
 assert.equal(sim.calls,28);
 assert.equal(sim.actors.get('LKN_Ridge').where,'NW_BIGFARM_FARM4_PATH_01');
 assert.equal(sim.actors.get('LKN_PostGuard').name[0],'Neutral tavern lookout');
 assert.equal(sim.actors.get('LKN_OnarScout').where,'NW_BIGFARM_PATH_01');
 assert.equal(sim.actors.get('LKN_PostGuard').where,'TAVERNE');
 assert.equal(sim.actors.has('LKN_WaterNovice'),false);
 sim.c.LKN_OnAddonInit();sim.c.LKN_OnAddonInit();
 assert.equal(sim.actors.get('LKN_WaterNovice').where,'ADW_ENTRANCE_BUILDING2_04');
 sim.c.Patch_LivingKhorinis_WarUnlocked=1;
 sim.day(4);sim.tick();sim.tick();
 assert.equal(sim.messages.filter(x=>x==='clash').length,2);
 sim.day(8);sim.tick();
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

test('preserves posts on reload and routes the dispatch to the port, with the real owner shown',()=>{
 const sim=simulate();sim.enter();sim.enter();
 const port=sim.actors.get('LKN_DockGuard'), mine=sim.actors.get('LKN_MineGuard');
 assert.equal(port.armor,6);assert.equal(mine.armor,2);
 assert.equal(port.where,'NW_CITY_HABOUR_09');
 assert.equal(mine.where,'NW_CASTLEMINE_PATH_OUTSIDEHUT_02');
 assert.equal(sim.messages.filter(m=>m.startsWith('LKN_DockBuilding:')).length,1);
 assert.equal(sim.messages.filter(m=>m.startsWith('LKN_MineBuilding:')).length,1);
 assert.ok(sim.actors.has('LKN_DockWorker') && sim.actors.has('LKN_MineWorker'));
 sim.c.Patch_LivingKhorinis_WarUnlocked=1;
 sim.day(10);sim.tick();
 assert.equal(sim.actors.get('LKN_OnarScout').target,port.where);
 assert.equal(port.armor,6);
 sim.c.LKN_IndustryReport();assert.ok(sim.messages.includes('Harbour timber depot: Khorinis paladins; shift suspended.'));
 sim.day(12);sim.tick();assert.equal(port.armor,2);
 const back=simulate(sim.save());back.enter();
 assert.equal(back.calls,0);assert.equal(back.messages.filter(m=>m.includes('Building:')).length,0);
 assert.equal(back.actors.get('LKN_DockGuard').armor,2);
});

test('first nearby approach plays the one-time scripted raid and defenders hold',()=>{
 const sim=simulate();sim.enter();
 sim.c.LKN_RaidTick();assert.ok(!sim.actors.has('LKN_RaiderA'));
 sim.range(1500);sim.c.LKN_RaidTick();
 assert.equal(sim.actors.get('LKN_RaiderA').target,'NW_FARM1_PATH_CITY_19_B');
 sim.c.LKN_RaidTick();assert.equal(sim.messages.filter(x=>x==='clash').length,5);
 for(let i=0;i<12;i++)sim.c.LKN_RaidTick();
 assert.equal(sim.c.LKN_RaidStage,3);assert.equal(sim.c.Patch_LivingKhorinis_WarUnlocked,1);
 assert.equal(sim.actors.get('LKN_RaiderC').lastState,'ZS_LKN_Retreat');
 assert.ok(sim.messages.includes('The paladins repelled the raid.'));
 const back=simulate(sim.save());back.enter();back.c.LKN_RaidTick();
 assert.equal(back.calls,0);assert.ok(!back.messages.includes('Gate Fort is under attack!'));
});
test('carrier targets use the same staged route as the food cargo',()=>{
 const sim=simulate();sim.enter();
 const c=sim.c;
 assert.equal(c.LKN_FreightGoal(61050),'NW_FARM1_OUT_05');
 sim.day(1);sim.tick();
 assert.equal(c.LKN_FreightGoal(61050),'NW_CITY_ENTRANCE_01');
 assert.equal(c.LKN_FreightGoal(61052),'NW_BIGFARM_PATH_01');
 sim.day(2);sim.tick();
 assert.equal(c.LKN_FreightGoal(61054),'NW_CITY_HABOUR_09');
 assert.equal(c.LKN_FreightGoal(61055),c.LKN_FreightGoal(61054));
 assert.equal(c.LKN_FreightGoal(61059),c.LKN_FreightGoal(61057));
 assert.ok(sim.messages.includes('LKN_DockBench:NW_CITY_HABOUR_08'));
 assert.ok(sim.messages.includes('LKN_OreVein:NW_CASTLEMINE_PATH_HUT_02'));
});
