import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
const src = readFileSync(new URL('../lk-github-saves.js',import.meta.url),'utf8');
const token = 'github_pat_'+'x'.repeat(30);
const hash = 'b'.repeat(40);
const info = {private:true,visibility:'private',full_name:'remzone/living-khorinis-saves',id:1475762857};
const meta = {type:'file',path:'latest.sav',sha:hash,size:3};
const json = data=>Response.json(data);
function fixture(...responses) {
 const calls = [];
 const box=vm.createContext({AbortController,setTimeout,clearTimeout,btoa,Uint8Array});
 vm.runInContext(src,box);
 const api=box.LivingKhorinisGitHub.create(async (u,o)=>{
  assert.ok(u.startsWith('https://api.github.com/repos/remzone/living-khorinis-saves'));
  assert.equal(o.headers.Authorization,'Bearer '+token);
  assert.equal(o.redirect,'error');
  calls.push([u,o]);
  return responses.shift();
 });
 return {api,calls};
}
test('publishes only selected save bytes, to the fixed private branch',async()=>{
 const {api,calls}=fixture(json(info),new Response(null,{status:404}),json({}));
 const bytes = new Uint8Array(25001).map((_,i)=>i%241);
 assert.equal(await api.push(token,bytes,()=>assert.fail()),true);
 const body = JSON.parse(calls[2][1].body);
 assert.equal(body.branch,'mod-ru');
 assert.deepEqual(Buffer.from(body.content,'base64'),Buffer.from(bytes));
 assert.equal(body.sha,undefined);
 assert.ok(calls[2][0].endsWith('/contents/latest.sav'));
});
test('verifies repository identity and preserves previous writes on conflict or user cancellation',async()=>{
 let f=fixture(json({...info,private:false}));
 await assert.rejects(f.api.push(token,Uint8Array.of(1),()=>true),/приватным/);
 assert.equal(f.calls.length,1);
 f=fixture(json(info),json(meta));
 assert.equal(await f.api.push(token,Uint8Array.of(1),()=>false),false);
 assert.equal(f.calls.length,2);
 f=fixture(json(info),json(meta),new Response(null,{status:409}));
 await assert.rejects(f.api.push(token,Uint8Array.of(1),()=>true),/обновилась/);
 assert.equal(JSON.parse(f.calls[2][1].body).sha,hash);
});
test('downloads by commit blob SHA, bounds length, and does not accept another token type',async()=>{
 let f=fixture(json(info),json(meta),new Response(Uint8Array.of(2,4,6)));
 assert.deepEqual(Array.from(await f.api.pull(token)),[2,4,6]);
 assert.ok(f.calls[2][0].endsWith('/git/blobs/'+hash));
 assert.equal(f.calls[2][1].headers.Accept,'application/vnd.github.raw+json');
 f=fixture(json(info),json(meta),new Response(Uint8Array.of(2,4)));
 await assert.rejects(f.api.pull(token),/не вся/);
 f=fixture();
 await assert.rejects(f.api.pull('ghp_dont_use_classic'),/fine-grained/);
 assert.equal(f.calls.length,0);
});

test('metadata reads for large saves use GitHub object media type before pull and replacement',async()=>{
 const bytes=new Uint8Array(1024*1024+1);
 bytes[bytes.length-1]=42;
 const large={...meta,size:bytes.length,content:'',encoding:'none'};
 let f=fixture(json(info),json(large),new Response(bytes));
 const got=await f.api.pull(token);
 assert.equal(got.length,bytes.length);
 assert.equal(got.at(-1),42);
 assert.equal(f.calls[1][1].headers.Accept,'application/vnd.github.object+json');
 assert.equal(f.calls[2][1].headers.Accept,'application/vnd.github.raw+json');
 f=fixture(json(info),json(large),json({}));
 assert.equal(await f.api.push(token,Uint8Array.of(5),()=>true),true);
 assert.equal(f.calls[1][1].headers.Accept,'application/vnd.github.object+json');
 assert.equal(JSON.parse(f.calls[2][1].body).sha,hash);
});

test('0.4 never reads or overwrites the 0.3 or legacy save path', async ()=>{
  const calls=[];
  const fetcher=async (url,opts)=>{
    calls.push(String(url));
    if(calls.length===1) return json(info);
    return {status:404,ok:false};
  };
  const box=vm.createContext({AbortController,setTimeout,clearTimeout,btoa,Uint8Array});
  vm.runInContext(src,box);
  const sync=box.LivingKhorinisGitHub.create(fetcher,'0.4');
  assert.equal(await sync.pull(token),null);
  assert.match(calls[1],/latest-v04\.sav\?ref=mod-ru$/);
});

test('0.5 uses its own cloud slot',async ()=>{
 const calls=[];
 const box=vm.createContext({AbortController,setTimeout,clearTimeout,btoa,Uint8Array});
 vm.runInContext(src,box);
 const api=box.LivingKhorinisGitHub.create(async (url)=>{
  calls.push(url);
  if(calls.length===1) return json(info);
  if(calls.length===2) return new Response(null,{status:404});
  return json({});
 },'0.5');
 assert.equal(await api.push(token,Uint8Array.of(1),()=>true),true);
 assert.match(calls[1],/latest-v05\.sav\?ref=mod-ru$/);
 assert.match(calls[2],/latest-v05\.sav$/);
});
test('0.6 uses its own cloud slot',async ()=>{
 const calls=[];
 const box=vm.createContext({AbortController,setTimeout,clearTimeout,btoa,Uint8Array});
 vm.runInContext(src,box);
 const api=box.LivingKhorinisGitHub.create(async (url)=>{
  calls.push(url);
  if(calls.length===1) return json(info);
  if(calls.length===2) return new Response(null,{status:404});
  return json({});
 },'0.6');
 assert.equal(await api.push(token,Uint8Array.of(1),()=>true),true);
 assert.match(calls[1],/latest-v06\.sav\?ref=mod-ru$/);
 assert.match(calls[2],/latest-v06\.sav$/);
});
test('0.7 uses its own cloud slot',async ()=>{
 const calls=[];
 const box=vm.createContext({AbortController,setTimeout,clearTimeout,btoa,Uint8Array});
 vm.runInContext(src,box);
 const api=box.LivingKhorinisGitHub.create(async (url)=>{
  calls.push(url);
  if(calls.length===1) return json(info);
  if(calls.length===2) return new Response(null,{status:404});
  return json({});
 },'0.7');
 assert.equal(await api.push(token,Uint8Array.of(1),()=>true),true);
 assert.match(calls[1],/latest-v07\.sav\?ref=mod-ru$/);
 assert.match(calls[2],/latest-v07\.sav$/);
});
test('0.8 uses its own cloud slot',async ()=>{
 const calls=[];
 const box=vm.createContext({AbortController,setTimeout,clearTimeout,btoa,Uint8Array});
 vm.runInContext(src,box);
 const api=box.LivingKhorinisGitHub.create(async (url)=>{
  calls.push(url);
  if(calls.length===1) return json(info);
  if(calls.length===2) return new Response(null,{status:404});
  return json({});
 },'0.8');
 assert.equal(await api.push(token,Uint8Array.of(1),()=>true),true);
 assert.match(calls[1],/latest-v08\.sav\?ref=mod-ru$/);
 assert.match(calls[2],/latest-v08\.sav$/);
});
test('0.9 uses its own cloud slot',async ()=>{
 const calls=[];
 const box=vm.createContext({AbortController,setTimeout,clearTimeout,btoa,Uint8Array});
 vm.runInContext(src,box);
 const api=box.LivingKhorinisGitHub.create(async (url)=>{
  calls.push(url);
  if(calls.length===1) return json(info);
  if(calls.length===2) return new Response(null,{status:404});
  return json({});
 },'0.9');
 assert.equal(await api.push(token,Uint8Array.of(1),()=>true),true);
 assert.match(calls[1],/latest-v09\.sav\?ref=mod-ru$/);
 assert.match(calls[2],/latest-v09\.sav$/);
});
