import { it, expect, vi } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../apps/server/src/app.js';
import { FileStorage, PostgresStorage, encode, decode } from '../apps/server/src/storage.js';
import { runDirector } from '../apps/server/src/director.js';
import { createWorld, tickDay } from '@living-world/simulation';
const biography = {
  name: 'Smoke',
  race: 'Human',
  sex: 'male',
  birthplace: 0,
  origin: 'merchants',
  childhood: 'books',
  youth: 'caravan',
  training: 'trader',
  turningPoint: 'inheritance',
  reason: 'knowledge',
};
it('smoke: new game → settlement → trade → recruit → save → load, without AI', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'rpg-test-'));
  const app = await createApp(new FileStorage(dir), { timers: false });
  try {
    const make = await app.inject({
      method: 'POST',
      url: '/api/new',
      payload: { seed: 'smoke', biography },
    });
    expect(make.statusCode).toBe(200);
    const world = make.json();
    expect(world.states).toHaveLength(10);
    expect(world.settlements).toHaveLength(300);
    expect(world.people).toBeUndefined();
    for (const payload of [
      { type: 'enter' },
      { type: 'trade', side: 'buy', good: 'grain', quantity: 10 },
      { type: 'recruit', count: 5 },
    ])
      expect((await app.inject({ method: 'POST', url: '/api/command', payload })).statusCode).toBe(
        200,
      );
    expect(
      (await app.inject({ method: 'POST', url: '/api/saves/1', payload: {} })).statusCode,
    ).toBe(200);
    const before = (await app.inject('/api/world')).json();
    await app.inject({
      method: 'POST',
      url: '/api/command',
      payload: { type: 'trade', side: 'sell', good: 'grain', quantity: 10 },
    });
    const loaded = (
      await app.inject({ method: 'POST', url: '/api/saves/1/load', payload: {} })
    ).json();
    expect(loaded).toEqual(before);
    expect((await app.inject('/api/admin')).json().keyConfigured).toBe(false);
    expect(
      (await app.inject({ method: 'POST', url: '/api/saves/99', payload: {} })).statusCode,
    ).toBe(400);
  } finally {
    await app.close();
    await rm(dir, { recursive: true, force: true });
  }
});
it('protects API and rejects cross-origin mutations', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'rpg-auth-')),
    app = await createApp(new FileStorage(dir), {
      timers: false,
      password: 'test-secret',
      origin: 'https://game.example',
    });
  try {
    expect((await app.inject('/api/world')).statusCode).toBe(401);
    expect(
      (await app.inject({ method: 'POST', url: '/api/login', payload: { password: 'wrong' } }))
        .statusCode,
    ).toBe(401);
    const response = await app.inject({
      method: 'POST',
      url: '/api/login',
      payload: { password: 'test-secret' },
    });
    const cookie = String(response.headers['set-cookie']).split(';')[0];
    expect((await app.inject({ url: '/api/world', headers: { cookie } })).statusCode).toBe(200);
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/api/new',
          headers: { cookie, origin: 'https://attacker.example' },
          payload: {},
        })
      ).statusCode,
    ).toBe(403);
  } finally {
    await app.close();
    await rm(dir, { recursive: true, force: true });
  }
});
it('round trips full state and detects corruption', () => {
  const w = createWorld('saved-rng', 10);
  for (let d = 0; d < 8; d++) tickDay(w);
  const encoded = encode(w),
    loaded = decode(encoded);
  expect(loaded).toEqual(w);
  tickDay(w);
  tickDay(loaded);
  expect(loaded).toEqual(w);
  expect(() => decode({ ...encoded, checksum: 'wrong' })).toThrow('повреждено');
});
it('validates structured OpenRouter response, cooldown and rejection logs', async () => {
  const w = createWorld('mock-ai', 8);
  w.director.enabled = true;
  const mock = vi.fn(
    async () =>
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  type: 'chronicle',
                  title: 'Начало',
                  text: 'Летописец увидел десять держав.',
                  evidence: [w.events[0].id],
                }),
              },
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
  );
  await runDirector(w, 'fake-test-key', mock as typeof fetch);
  expect(w.chronicles).toHaveLength(1);
  expect(w.directorLogs[0].accepted).toBe(true);
  await runDirector(w, 'fake-test-key', mock as typeof fetch);
  expect(mock).toHaveBeenCalledTimes(1);
  w.day = 31;
  const bad = vi.fn(
    async () =>
      new Response(
        JSON.stringify({ choices: [{ message: { content: '{"type":"set_gold","amount":100}' } }] }),
      ),
  );
  await runDirector(w, 'fake-test-key', bad as typeof fetch);
  expect(w.directorLogs.at(-1)?.accepted).toBe(false);
});
it('continues after unavailable AI and does not log the API key', async () => {
  const w = createWorld('offline', 8);
  w.director.enabled = true;
  await runDirector(
    w,
    'do-not-log',
    vi.fn(async () => new Response('', { status: 503 })) as typeof fetch,
  );
  expect(w.directorLogs[0].reason).toContain('503');
  expect(JSON.stringify(w.directorLogs)).not.toContain('do-not-log');
  tickDay(w);
  expect(w.day).toBe(1);
});
it.skipIf(!process.env.TEST_POSTGRES)(
  'PostgreSQL migration-backed snapshot round trip',
  async () => {
    const store = new PostgresStorage();
    try {
      const w = createWorld('postgres-ci', 8);
      await store.save(5, w);
      expect(await store.load(5)).toEqual(w);
      expect((await store.list()).some((s) => s.slot === 5)).toBe(true);
    } finally {
      await store.close();
    }
  },
);
