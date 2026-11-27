import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';

const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
const body = html.match(/<script type="text\/plain" id="install-worker-src">([\s\S]+?)<\/script>/)[1];

function makeZip(entries) {
  const out = execFileSync('python', ['-c', `
import sys, zipfile, json, io
b = io.BytesIO()
with zipfile.ZipFile(b, "w", compression=zipfile.ZIP_DEFLATED) as z:
    for path, content in json.loads(sys.argv[1]):
        z.writestr(path, content)
sys.stdout.buffer.write(b.getvalue())
`, JSON.stringify(entries)]);
  return new Blob([out]);
}
async function extract(entries) {
  const messages = [];
  const context = vm.createContext({self:{postMessage:m=>messages.push(m)},performance,TextDecoder,Blob,DecompressionStream,setTimeout});
  vm.runInContext(body,context);
  await context.self.onmessage({data:{type:'extract',memory:true,blob:makeZip(entries),skip:[/\.(dll|exe)$/i]}});
  return messages.at(-1);
}
test('locally extracts wrapped Steam paths and excludes executables',async () => {
  const x = await extract([['root/Gothic II/Data/Worlds.vdf','local game archive sample'],['root/Gothic II/System/Gothic2.exe','ignored'],['root/Gothic II/System/LivingKhorinis.ini','[FILES]']]);
  assert.equal(x.type,'done', x.msg);
  assert.equal(x.result.files,2);
  assert.equal(x.result.mem[0].path,'Data/Worlds.vdf');
  assert.equal(x.result.mem[1].path,'System/LivingKhorinis.ini');
  assert.equal(new TextDecoder().decode(x.result.mem[0].buf),'local game archive sample');
});
test('rejects archive without a root Data/*.vdf', async () => {
  const x = await extract([['Gothic/Data/Info.txt','vdf missing']]);
  assert.equal(x.type,'error');
  assert.match(x.msg,/Data\/\*\.vdf/);
});
