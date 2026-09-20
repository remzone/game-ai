/** Disposable in-process HTTP acceptance; never touches the user's save slots. */
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../apps/server/src/app.js';
import { FileStorage } from '../apps/server/src/storage.js';
const dir = await mkdtemp(join(tmpdir(), 'rpg-release-'));
const app = await createApp(new FileStorage(dir), { timers: false });
try {
  await app.listen({ host: '127.0.0.1', port: 0 });
  const address = app.server.address();
  if (!address || typeof address === 'string') throw new Error('No HTTP port');
  const base = `http://127.0.0.1:${address.port}`;
  async function post(path: string, payload: unknown) {
    const r = await fetch(base + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(JSON.stringify(data));
    return data;
  }
  const biography = {
    name: 'Приёмка',
    race: 'Human',
    sex: 'male',
    birthplace: 0,
    origin: 'merchants',
    childhood: 'fields',
    youth: 'militia',
    training: 'warrior',
    turningPoint: 'inheritance',
    reason: 'duty',
  };
  await post('/api/new', { seed: 'release-smoke', biography });
  await post('/api/command', { type: 'enter' });
  await post('/api/command', { type: 'work', job: 'farm' });
  await post('/api/command', { type: 'work', job: 'farm' });
  const owned = await post('/api/command', { type: 'buy_estate', kind: 'farm' });
  if (owned.estates.length !== 1) throw new Error('Estate missing');
  await post('/api/saves/1', {});
  await post('/api/command', {
    type: 'estate',
    estate: owned.estates[0].id,
    action: 'withdraw',
    quantity: 50,
    good: 'grain',
  });
  const restored = await post('/api/saves/1/load', {});
  if (restored.player.gold !== owned.player.gold || restored.estates[0].treasury !== 100)
    throw new Error('Wrong restored assets');
  const history = await (await fetch(base + '/api/history?offset=0&limit=10')).json();
  if (!history.items.length) throw new Error('History missing');
  const html = await (await fetch(base + '/')).text();
  if (!html.includes('id="root"')) throw new Error('Client unavailable');
  console.log(
    JSON.stringify({
      ok: true,
      http: true,
      version: restored.version,
      scenario: 'create → work → own → save → withdraw → load',
      history: history.total,
      client: true,
    }),
  );
} finally {
  await app.close();
  await rm(dir, { recursive: true, force: true });
}
