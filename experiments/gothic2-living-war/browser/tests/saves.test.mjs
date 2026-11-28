import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
const dist = new URL('../dist/',import.meta.url);
const base = readFileSync(new URL('../lk-saves.js',import.meta.url),'utf8');
const file = (index, byte = index) => ({name: 'save_slot_'+index+'.sav', bytes: Uint8Array.of(byte)});
const summary = writes => Array.from(writes, s=>[s.name,s.bytes[0]]);
const context = () => {const box=vm.createContext({Blob,TextEncoder,TextDecoder,Uint8Array,Response,URL});vm.runInContext(base,box);return box;};
test('occupied manual and quick slots move, and original free slots are reserved first',()=>{
 const c=context();
 const r=c.LivingKhorinisSaves.plan([file(0),file(1)],[file(1,11),file(2),file(0,10),file(99)]);
 assert.deepEqual(summary(r.writes),[['save_slot_2.sav',2],['save_slot_3.sav',11],['save_slot_4.sav',10]]);
 assert.equal(r.ignored,1);
});
test('identical files are skipped; an import with no capacity rejects before any writes',()=>{
 const c=context();
 const r=c.LivingKhorinisSaves.plan([file(1)],[file(1)]);
 assert.equal(r.writes.length,0);
 assert.equal(r.duplicates,1);
 assert.throws(()=>c.LivingKhorinisSaves.plan([file(1)],[file(2),file(1,4)],2),/Нет свободных/);
 assert.throws(()=>c.LivingKhorinisSaves.plan([],[{name:'anything.zip',bytes:Uint8Array.of(5)}]),/непустой файл/);
});
test('shipped picker round-trips a synthetic ZIP without touching occupied storage',async()=>{
 const candidates = ['game/index.html','index.html'];
 let html;
 for(const p of candidates) {try { const x=readFileSync(new URL(p,dist),'utf8'); if(x.includes('function onSavesPicked')) {html=x;break;} } catch {}}
 assert.ok(html,'game shell not found');
 assert.match(html,/href="\.\.\/saves\.html"/);
 assert.match(html,/src="lk-saves\.js"/);
 const codec=html.slice(html.indexOf('    const SAVE_RE'),html.indexOf('    async function downloadSaves'));
 const handler=html.slice(html.indexOf('    let lkSaveImportBusy'),html.indexOf('    let lkCloudBusy'));
 const box=context(), existing=[file(2,99)], writes=[], toasts=[];
 vm.runInContext(codec+'\nglobalThis.pack=zipStore;',box);
 box.collectSaves=async()=>existing;
 box.writeSave=async(name,bytes)=>writes.push({name,bytes});
 box.window={ogToast:x=>toasts.push(x)};
 box.alert=x=>{throw Error(x);};
 vm.runInContext(handler+'\nglobalThis.pick=onSavesPicked;',box);
 const archive=Object.assign(box.pack([file(2),file(3)]),{name:'gothic-saves.zip'});
 await box.pick({target:{files:[archive],value:''}});
 assert.deepEqual(summary(writes),[['save_slot_3.sav',3],['save_slot_1.sav',2]]);
 assert.deepEqual(summary(existing),[['save_slot_2.sav',99]]);
 assert.match(toasts[0],/Импортировано/);
});
