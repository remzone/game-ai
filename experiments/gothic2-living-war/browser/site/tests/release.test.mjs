import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';
const dist=new URL('../dist/',import.meta.url);
const read=(p)=>readFileSync(new URL(p,dist),'utf8');
test('landing leads to the local launcher and does not solicit Steam credentials',()=>{
 const html=read('index.html');
 assert.match(html,/href="\.\/game\/"/);
 assert.doesNotMatch(html,/<form|<input|<script[^>]+src="https?:/i);
});
test('game executable is a Wasm module and hosting has isolation headers',()=>{
 assert.match(read('_headers'),/Cross-Origin-Opener-Policy: same-origin/);
 assert.match(read('_headers'),/Cross-Origin-Embedder-Policy: require-corp/);
 const b=readFileSync(new URL('game/opengothic.wasm',dist));
 assert.ok(b.subarray(0,8).equals(Buffer.from([0,97,115,109,1,0,0,0])));
 assert.ok(b.length>1000000);
});
test('release has no original Gothic archives, scripts or world files',()=>{
 const all=readdirSync(dist,{recursive:true});
 let blocked=all.filter(n=>/\.(vdf|dat|zen|3ds|tex|mrm|mds|wav|ogg|mp3|exe|dll)$/i.test(n));
 assert.deepEqual(blocked,[]);
 assert.ok(all.some(n=>/LICENSE/i.test(n)));
});
