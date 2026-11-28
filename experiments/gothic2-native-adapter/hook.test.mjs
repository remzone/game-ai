import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const dir = path.dirname(fileURLToPath(import.meta.url));
const code = fs.readFileSync(path.join(dir,'living-khorinis-hook.js'),'utf8');
const folder = fs.mkdtempSync(path.join(os.tmpdir(),'living-khorinis-overlay-fixture-'));
process.on('exit', () => fs.rmSync(folder, {force: true, recursive: true}));
for (const d of ['system','data/modvdf']) fs.mkdirSync(path.join(folder,d), {recursive:true});
execFileSync('python3', ['-B','-c', `
from pathlib import Path
from test_native import fake_dat, INI
from pack import mod_ini, vdf_for
from buildings import assets
p=Path(${JSON.stringify(folder)})
(p/'system'/'livingkhorinis.ini').write_bytes(mod_ini(INI))
(p/'data'/'modvdf'/'LivingKhorinis.mod').write_bytes(vdf_for(fake_dat()))
(p/'art.mod').write_bytes(vdf_for(fake_dat(), assets()))
logistics={k:v for k,v in assets().items() if k not in ['LKN_SECT.MRM','LKN_WATER.MRM','LKN_BLUE-C.TEX','LKN_GREEN-C.TEX','LKN_FIRE.MRM','LKN_RED-C.TEX']}
(p/'v06-art.mod').write_bytes(vdf_for(fake_dat(), logistics))
old={k:v for k,v in logistics.items() if k not in ['LKN_LOGS.MRM','LKN_ORE.MRM','LKN_ORE-C.TEX']}
(p/'v04-art.mod').write_bytes(vdf_for(fake_dat(), old))
(p/'old-art.mod').write_bytes(vdf_for(fake_dat(), {k:v for k,v in old.items() if k not in ['LKN_DOCK.MRM','LKN_MINE.MRM']}))
`], {cwd:dir});
const gameRoot='/game';
function runtime({volMissing=false,iniMissing=false,broken=false,vanilla=false}={}) {
    const local = p=>folder+p.slice(gameRoot.length);
    const FS = {
        readdir(p) { return fs.readdirSync(local(p)).filter(e=>!(volMissing && e.endsWith('.mod')) && !(iniMissing && e.endsWith('.ini'))); },
        stat: p=>fs.statSync(local(p)),
        isFile: mode=>(mode & 0o170000) === 0o100000,
        readFile(p) {
            const bytes = new Uint8Array(fs.readFileSync(local(p)));
            if (broken && p.endsWith('.mod')) bytes[256] = 0;
            return bytes;
        },
    };
    const ctx = vm.createContext({TextDecoder, URLSearchParams, location: {search:vanilla?'?vanilla=1':''}});
    vm.runInContext(code,ctx);
    return ctx.LivingKhorinisPrepare({FS,gameRoot});
}

test('mounts locally packaged overlay with imported filename casing', async () => {
    assert.equal((await runtime()).ini,'livingkhorinis.ini');
});
test('runs vanilla only when both files absent, or explicitly requested', async () => {
    assert.equal(await runtime({volMissing:true,iniMissing:true}),null);
    assert.equal(await runtime({volMissing:true,vanilla:true}),null);
});
test('fails closed on incomplete or invalid overlay', async () => {
    await assert.rejects(runtime({volMissing:true}),/нужны обе части/);
    await assert.rejects(runtime({broken:true}),/неподдерживаемый формат/);
});

test('one .lkmod shadows only the engine view and does not touch base bytes or saves', () => {
    const ctx=vm.createContext({TextDecoder,Uint8Array,URLSearchParams});
    vm.runInContext(code,ctx);
    const ini=fs.readFileSync(path.join(folder,'system/livingkhorinis.ini'));
    const vol=fs.readFileSync(path.join(folder,'art.mod'));
    const head=Buffer.alloc(16);head.write('LKHMOD01');head.writeUInt32LE(ini.length,8);head.writeUInt32LE(vol.length,12);
    const encoded=new Uint8Array(Buffer.concat([head,ini,vol]));
    const VFS={files:new Map(),addEntry(n,isDir,size){const old=this.files.get(n.toLowerCase()),
     e=old??{path:n,isDir,size};this.files.set(n.toLowerCase(),e);return e;}};
    VFS.addEntry('data',true);VFS.addEntry('System',true);
    VFS.addEntry('data/Worlds_Addon.vdf',false,7);
    const save=VFS.addEntry('save_slot_1.sav',false,12);
    ctx.LivingKhorinisOverlay.mount(VFS,encoded);
    assert.equal(VFS.files.get('data/modvdf/livingkhorinis.mod').mem.length,vol.length);
    assert.equal(VFS.files.get('system/livingkhorinis.ini').mem.length,ini.length);
    assert.equal(VFS.files.get('save_slot_1.sav'),save);
    assert.equal(VFS.files.get('data/worlds_addon.vdf').size,7);
    const prev=VFS.files.get('system/livingkhorinis.ini').mem;
    const broken=encoded.slice(0,-1);
    assert.throws(()=>ctx.LivingKhorinisOverlay.mount(VFS,broken),/повреждён/);
    assert.equal(VFS.files.get('system/livingkhorinis.ini').mem,prev);
    const wrongEntry=encoded.slice();
    wrongEntry[16+ini.length+296+80*8]=0x57;
    assert.throws(()=>ctx.LivingKhorinisOverlay.mount(VFS,wrongEntry),/содержимое пакета/);
});


test('accepts 0.3 through 0.7 asset catalogs while retaining the version tag', async ()=>{
 const ini=fs.readFileSync(path.join(folder,'system/livingkhorinis.ini'));
 const ctx=vm.createContext({TextDecoder,Uint8Array,URLSearchParams});vm.runInContext(code,ctx);
 for(const [version,asset] of [['0.3','old-art.mod'],['0.4','v04-art.mod'],['0.5','v06-art.mod'],['0.6','v06-art.mod'],['0.7','art.mod']]){
   const versioned=Buffer.from(ini.toString().replace('Version=0.7','Version='+version));
   const volume=fs.readFileSync(path.join(folder,asset));
   const FS={
    readdir(p){return ({'/game':['system','data'],'/game/system':['LivingKhorinis.ini'],'/game/data':['modvdf'],
                  '/game/data/modvdf':['LivingKhorinis.mod']})[p]??[];},
    stat:p=>({size:p.endsWith('.mod')?volume.length:versioned.length,mode:0}),
    isFile:()=>true,readFile:p=>p.endsWith('.mod')?volume:versioned
   };
   assert.equal((await ctx.LivingKhorinisPrepare({FS,gameRoot})).version,version);
 }
});

test('passes the patched parser to engines that only start the standard GOTHIC.DAT', async ()=>{
 const ctx=vm.createContext({TextDecoder,Uint8Array,URLSearchParams});vm.runInContext(code,ctx);
 const ini=fs.readFileSync(path.join(folder,'system/livingkhorinis.ini'));
 const volume=new Uint8Array(fs.readFileSync(path.join(folder,'art.mod')));
 const orig=volume.slice();
 const gameFs={
   files:new Map([['data',{path:'DaTa',isDir:true}],['data/scripts.vdf',{path:'DaTa/Scripts.vdf',isDir:false}]]),
   addEntry(path,isDir,size){const entry={path,isDir,size};this.files.set(path.toLowerCase(),entry);return entry;}
 };
 const FS={
   readdir(p){return ({'/game':['System','DaTa'],'/game/System':['LivingKhorinis.ini'],
       '/game/DaTa':['ModVDF'],'/game/DaTa/ModVDF':['LivingKhorinis.mod']})[p]??[];},
   stat:p=>({size:p.endsWith('.mod')?volume.length:ini.length,mode:0}),
   isFile:()=>true,readFile:p=>p.endsWith('.mod')?volume:ini
 };
 const result=await ctx.LivingKhorinisPrepare({FS,gameRoot,gameFs});
 assert.equal(result.runtime,'/game/DaTa/lk browser runtime.vdf');
 const e=gameFs.files.get('data/lk browser runtime.vdf');
 assert.equal(e.dirty,false);
 assert.equal(e.hIdx,-1);
 assert.equal(new DataView(e.mem.buffer).getUint32(280,true),0xff9fbf7d);
 const decoder=new TextDecoder(), label=new TextEncoder().encode('LIVINGKHORINIS.DAT');
 const row=Buffer.from(orig).indexOf(label);
 assert.equal(decoder.decode(e.mem.subarray(row,row+64)).trim(),'GOTHIC.DAT');
 assert.deepEqual(e.mem.subarray(row+64),orig.subarray(row+64));
 assert.deepEqual(volume,orig);
 assert.equal(gameFs.files.get('data/scripts.vdf').path,'DaTa/Scripts.vdf');
});
