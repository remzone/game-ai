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
        self,other,TRUE:1,FALSE:0,ItFo_Bread:1,MALE:0,Face_N_Normal01:0,BodyTex_N:0,ItAr_Mil_L:1,ItAr_Sld_L:2,ItAr_Bau_M:3,ItAr_NOV_L:4,ItAr_Pal_M:6,ITAR_MIL_L:1,ITAR_SLD_L:2,ITAR_NOV_L:4,ITAR_KDF_L:7,ITAR_KDW_L_Addon:8,ItMw_1H_Mil_Sword:5,AR_NONE:0,SPL_Firebolt:1,SPL_Icelance:2,SPL_Sleep:3,SPL_Cost_Firebolt:5,SPL_Cost_Icelance:7,SPL_Cost_Sleep:8,hero:other,NPC_RUN:2,
        Npc_ClearAIQueue:()=>{}, AI_GotoWP:(npc,where)=>{npc.target=where;},Npc_GetDistToWP:(npc)=>npc===other?heroRange:0,Npc_GetDistToNpc:()=>0,CreateInvItems:()=>{},AI_EquipBestMeleeWeapon:()=>{},
        B_Attack:(a,b)=>{
          assert.match(a.instance,/^LKN_((City|Onar)(Scout|Blade)|FortGuard[AB]|Raider[ABC])$/);
          assert.match(b.instance,/^LKN_((City|Onar)(Scout|Blade)|FortGuard[AB]|Raider[ABC])$/);
          messages.push("clash");
        },
        AI_RemoveWeapon:()=>{}, AI_Wait:()=>{}, Npc_SetTarget:(npc,target)=>{npc.spellTarget=target.instance;},
        AI_ReadySpell:(npc,spell)=>messages.push(npc.instance+':spell:'+spell), AI_Attack:npc=>messages.push(npc.instance+':cast'),
        AI_SetWalkMode:()=>{}, AI_StartState:(actor,state)=>{actor.lastState=state.name;}, IntToString:String,
        B_SetNpcVisual: (npc,sex,head,face,body,armor)=>{ npc.armor=armor; },
        Npc_IsDead:npc=>!!npc?.dead, PrintScreen:line=>messages.push(line),
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
 assert.equal(sim.calls,57);
 assert.equal(sim.actors.get('LKN_Ridge').where,'NW_BIGFARM_FARM4_PATH_01');
 assert.equal(sim.actors.get('LKN_PostGuard').name[0],'Neutral tavern lookout');
 assert.equal(sim.actors.get('LKN_OnarScout').where,'NW_BIGFARM_PATH_01');
 assert.equal(sim.actors.get('LKN_PostGuard').where,'TAVERNE');
 assert.equal(sim.actors.has('LKN_WaterNovice'),false);
 sim.c.LKN_OnAddonInit();sim.c.LKN_OnAddonInit();
 assert.equal(sim.actors.get('LKN_WaterNovice').where,'ADW_ENTRANCE_BUILDING2_04');
 sim.c.Patch_LivingKhorinis_WarUnlocked=1;
 sim.day(4);sim.tick();sim.tick();
 assert.equal(sim.messages.filter(x=>x==='clash').length,4);
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
 assert.ok(sim.messages.includes('LKN_OreVein:NW_CASTLEMINE_PATH_OUTSIDEHUT_02'));
});

test('post dialogue consumes one real bread, creates local food and a valid faction convoy order',()=>{
 const sim=simulate();sim.enter();
 const c=sim.c;
 c.self={id:61046};
 assert.equal(c.LKN_CanRequestPost(),false);
 c.LKN_PostSpeak();assert.ok(sim.messages.some(x=>x.includes('Jan')));
 c.LKN_FeedPost();c.LKN_FeedPost();
 assert.equal(sim.bread,1);assert.equal(c.Patch_LivingKhorinis_DockFood,10);
 assert.equal(c.Patch_LivingKhorinis_CityStanding,1);
 c.LKN_RequestPost();assert.equal(c.Patch_LivingKhorinis_CityRequest,3);
 c.Patch_LivingKhorinis_MilitiaSupply=40;
 c.Patch_LivingKhorinis_OutpostFreight();
 assert.equal(c.Patch_LivingKhorinis_CityRoute,3);
 assert.equal(c.Patch_LivingKhorinis_CityRequest,0);
});
test('dead miner stops production and corpses are not replaced on load',()=>{
 const sim=simulate();sim.enter();sim.actors.get('LKN_MineWorker').dead=true;
 sim.day(1);sim.tick();
 assert.equal(sim.c.Patch_LivingKhorinis_MineWorkerLost,1);
 assert.equal(sim.c.Patch_LivingKhorinis_MineClosed,1);
 const saved=sim.save();saved.actors.delete('LKN_MineWorker');
 const reload=simulate(saved);reload.enter();assert.ok(!reload.actors.has('LKN_MineWorker'));
});

test('Water camp and Brotherhood occupy separate NewWorld camps, with Water watch post',()=>{
 const sim=simulate();sim.enter();sim.enter();
 assert.equal(sim.actors.get('LKN_WaterMaster').where,'NW_TROLLAREA_PORTAL_KDWWAIT_01');
 assert.equal(sim.actors.get('LKN_WaterGuard1').where,'NW_TROLLAREA_PORTAL_03');
 assert.ok(sim.actors.has('LKN_WaterAcolyte1')&&sim.actors.has('LKN_WaterAcolyte2'));
 assert.equal(sim.actors.get('LKN_SectMaster').where,'NW_XARDAS_TOWER_LESTER');
 assert.ok(sim.actors.has('LKN_SectGuard')&&sim.actors.has('LKN_SectGuard2'));
 assert.ok(sim.actors.has('LKN_FireGuard1')&&sim.actors.has('LKN_FireGuard2'));
 for(const prop of ['LKN_WaterCampProp','LKN_WaterWatchProp','LKN_SectCampProp','LKN_FireWatchProp'])
  assert.equal(sim.messages.filter(x=>x.startsWith(prop+':')).length,1);
});
test('hired Water and Brotherhood casters walk to battle, target only opposing faction and cast once',()=>{
 const sim=simulate();sim.enter();
 const c=sim.c;
 c.Patch_LivingKhorinis_MilitiaWater=1;
 c.Patch_LivingKhorinis_MercenarySect=1;
 c.Patch_LivingKhorinis_AttackSide=2;
 c.Patch_LivingKhorinis_AttackPost=1;
 c.Patch_LivingKhorinis_Dispatched=1;
 sim.tick();sim.tick();sim.tick();
 const water=sim.actors.get('LKN_CityWaterMage'),sect=sim.actors.get('LKN_OnarSectMage');
 assert.equal(sect.target,'TAVERNE');assert.equal(water.target,'TAVERNE');
 assert.equal(sect.spellTarget,'LKN_CityScout');assert.equal(water.spellTarget,'LKN_OnarScout');
 assert.equal(sim.messages.filter(x=>x==='LKN_OnarSectMage:spell:3').length,1);
 assert.equal(sim.messages.filter(x=>x==='LKN_CityWaterMage:spell:2').length,1);
 c.Patch_LivingKhorinis_AttackSide=0;sim.tick();
 assert.equal(sect.target,'NW_XARDAS_TOWER_LESTER');
 sect.dead=true;sim.tick();
 assert.equal(c.Patch_LivingKhorinis_OnarSectLost,1);
 assert.equal(c.Patch_LivingKhorinis_MercenarySect,0);
});
test('opening unlocks the campaign once even if both mortal storytellers die',()=>{
 const sim=simulate();sim.enter();
 sim.actors.get('LKN_FortCaptain').dead=true;sim.actors.get('LKN_FortSteward').dead=true;
 sim.tick();sim.tick();
 assert.equal(sim.c.LKN_RaidStage,3);assert.equal(sim.c.Patch_LivingKhorinis_WarUnlocked,1);
 assert.ok(!sim.messages.includes('The paladins repelled the raid.'));
});

test('roads have distinct posts, an expanded pass garrison, and neutral uniforms follow the owner',()=>{
 const sim=simulate();sim.enter();sim.enter();
 assert.equal(sim.actors.get('LKN_LighthouseGuard').where,'NW_CITY_TO_LIGHTHOUSE_03');
 assert.equal(sim.actors.get('LKN_FarmRoadGuard').where,'NW_FARM1_OUT_05');
 assert.equal(sim.actors.get('LKN_XardasRoadGuard').where,'NW_XARDAS_TOWER_PATH_01');
 assert.equal(sim.actors.get('LKN_TavernRoadGuard').where,'NW_TAVERNE_OUT_01');
 assert.equal(sim.actors.get('LKN_ValleyRoadGuard').where,'NW_TO_PASS_01');
 assert.equal([...sim.actors.keys()].filter(n=>n.startsWith('LKN_Pass')).length,6);
 assert.equal(sim.messages.filter(n=>n.startsWith('LKN_Build_')).length,9);
 sim.c.Patch_LivingKhorinis_ForestCampOwner=5;sim.tick();
 assert.equal(sim.actors.get('LKN_ForestCampGuard').armor,8);
 sim.c.Patch_LivingKhorinis_ForestCampOwner=2;sim.tick();
 assert.equal(sim.actors.get('LKN_ForestCampGuard').armor,2);
});
