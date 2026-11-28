import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const page=fs.readFileSync(new URL('../dist/game/index.html',import.meta.url),'utf8');
const src=page.slice(page.indexOf('    async function startGame()'),page.indexOf('    // Android app: the engine runs natively'));
async function mock({result=null,search='',visible=true}={}){
 const errors=[],args=[],modes=[];
 const classes={classList:{add(){},remove(){}}};
 const environment={
  isolationBlocked:()=>false,g_started:false,uiOverlay:classes,player:classes,canvas:{focus(){}},bootBg_isUp:()=>false,
  bootStatus:{style:{}},bootStatusText:{},statusSpin:{style:{}},statusText:{style:{}},GAME_ROOT:'/gothic2',GAME_ID:'g2',GameFS:{},
  Module:{FS:{chdir(){},analyzePath(){return {exists:visible};}},callMain:a=>args.push(...a)},
  useWebGL:()=>true,lkMountLocalUpdate:async()=>{},lkShowBootMode:m=>modes.push(m),URLSearchParams,location:{search},
  window:{LivingKhorinisPrepare:async()=>result},sessionStorage:{getItem(){return null;}},
  console:{log(){},info(){},warn(){},error(_message,e){errors.push(e.message);}}
 };
 const c=vm.createContext(environment);
 vm.runInContext(src,c);await c.startGame();return {errors,args,modes,c};
}
test('launcher uses validated standard VDF without asking the engine to load a named mod INI',async()=>{
 const x=await mock({result:{runtime:'/gothic2/Data/lk browser runtime.vdf',version:'0.5'},search:'?checkmod=1'});
 assert.deepEqual(x.args,['-g','/gothic2','-g2','-webgl2']);
 assert.match(x.modes[0],/0\.5/);assert.equal(x.c.lkModActive,true);
});
test('checking the mod never silently starts vanilla when no package is found or readable',async()=>{
 const x=await mock({search:'?checkmod=1'});
 assert.equal(x.args.length,0);assert.match(x.errors[0],/пакет мода не найден/i);
 const unreadable=await mock({result:{runtime:'/vdf',version:'0.5'},visible:false});
 assert.equal(unreadable.args.length,0);assert.match(unreadable.errors[0],/недоступен/i);
 const vanilla=await mock();
 assert.match(vanilla.modes[0],/мод не выбран/);assert.ok(vanilla.args.length);
});
