import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const read = s => fs.readFileSync(new URL(s,import.meta.url),'utf8');
const src = read('../gothic2-living-war/LivingKhorinis.d') + "\n" + read('./LivingKhorinisNative.d');
const code = src.replace(/\binstance (\w+)\([^)]+\) \{[^}]+\};/g, 'const $1 = "$1";')
 .replace(/\bfunc\s+(?:int|void)\s+/g,'function ')
 .replace(/\bconst\s+(?:int|string)\s+/g,'const ')
 .replace(/([,(]\s*)var int (\w+)/g,'$1$2')
 .replace(/\bvar\s+(?:int|C_NPC)\s+(\w+);/g,'var $1 = 0;');

// Only engine API boundaries are mocked; rules and adapter are mechanically
// run from the same exact source that the real GDC compiler consumes.
const newHandle = instance => ({instance,name:[],armor:0});
function simulate({actors=new Map(), prevState={}, gameDay=0, bread=2}={}) {
    const self=newHandle("self"), other=newHandle("player");
    const messages=[];
    let calls=0;
    const c=vm.createContext({
        self,other,TRUE:1,FALSE:0,ItFo_Bread:1,MALE:0,Face_N_Normal01:0,BodyTex_N:0,ItAr_Mil_L:1,ItAr_Sld_L:2,ItAr_Bau_M:3,
        B_SetNpcVisual: (npc,sex,head,face,body,armor)=>{ npc.armor=armor; },
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
        Npc_HasItems: (who,item)=>{ assert.equal(who,other); return bread; },
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

test('world init and restore use exactly one added quartermaster and one owned guard',()=>{
    const sim=simulate();
    sim.enter(); sim.enter(); sim.tick();
    assert.equal(sim.calls,2);
    assert.deepEqual([...sim.actors.keys()],['LKN_PostGuard','LKN_Quartermaster']);
    assert.equal(sim.actors.get('LKN_PostGuard').name[0], "Neutral tavern lookout");
    assert.equal(sim.actors.get('LKN_PostGuard').where, "TAVERNE");
    assert.equal(sim.actors.get('LKN_Quartermaster').where, "NW_TAVERNE_IN_07");
    sim.day(3); sim.tick();
    assert.deepEqual([...sim.actors.keys()],['LKN_PostGuard','LKN_Quartermaster']);
    assert.equal(sim.actors.get('LKN_PostGuard').name[0], "Onar's mercenary lookout");
    assert.equal(sim.actors.get('LKN_PostGuard').armor, 2);
    const loaded=simulate(sim.save());
    loaded.enter(); loaded.tick();
    assert.equal(loaded.calls,0);
    assert.equal(loaded.c.Patch_LivingKhorinis_Revision,1);
});

test('daily delivery is atomic at the engine boundary and not repeated on reload',()=>{
    const sim=simulate();
    sim.enter();
    const deliver=()=>sim.c.LKN_DeliverMilitia();
    deliver(); deliver();
    assert.equal(sim.bread,1);
    assert.equal(sim.c.Patch_LivingKhorinis_MilitiaSupply,7);
    const loaded=simulate(sim.save());
    loaded.enter(); loaded.c.LKN_DeliverMilitia();
    assert.equal(loaded.bread,1);
    loaded.day(1); loaded.c.LKN_DeliverMilitia();
    assert.equal(loaded.bread,0);
    loaded.day(3); loaded.tick();
    assert.equal(loaded.actors.get('LKN_PostGuard').name[0], 'Khorinis militia lookout');
});
