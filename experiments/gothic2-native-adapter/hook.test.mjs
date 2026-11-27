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
p=Path(${JSON.stringify(folder)})
(p/'system'/'livingkhorinis.ini').write_bytes(mod_ini(INI))
(p/'data'/'modvdf'/'LivingKhorinis.mod').write_bytes(vdf_for(fake_dat()))
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
