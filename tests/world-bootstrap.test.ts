import { expect, it, vi } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../apps/server/src/app.js';
import { FileStorage } from '../apps/server/src/storage.js';
import { bootstrapWorld } from '../apps/server/src/world-bootstrap.js';
import {
  createAtlasWorld,
  createOrganicWorld,
  createWorld,
  seededLore,
  startAtlasCampaign,
  tickDay,
} from '@living-world/simulation';

const biography = {
  name: 'Мара',
  race: 'Human',
  sex: 'female',
  birthplace: 0,
  origin: 'merchants',
  childhood: 'books',
  youth: 'caravan',
  training: 'trader',
  turningPoint: 'inheritance',
  reason: 'knowledge',
};
function answer(value: unknown) {
  return new Response(
    JSON.stringify({ choices: [{ message: { content: JSON.stringify(value) } }] }),
  );
}

it('generates structured lore against actual IDs once and restores it without a new provider call', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'lore-test-'));
  const store = new FileStorage(dir);
  const seed = 'user text not shared';
  const base = createOrganicWorld(seed);
  const { source: _, ...lore } = seededLore(base, true);
  const modelChoice = 2;
  const chosen = createAtlasWorld(base, modelChoice)!;
  expect(chosen.scenario.id).not.toBe(base.atlasWorld?.scenario.id);
  const selected = atlasResponse(chosen, modelChoice);
  const dropped = chosen.sites.find(
    (s) => s.kind === 'trade_post' && !chosen.history.some((e) => e.site === s.id),
  )!;
  expect(dropped).toBeDefined();
  selected.sites = selected.sites.filter((s) => s.id !== dropped.id);
  lore.continent = 'Туманные Земли';
  lore.states[0].title = 'Северная Корона';
  lore.faiths[0].title = 'Храм Грани';
  lore.people[0].name = 'Ария Снег';
  const resident = lore.people.find((entry) => entry.role === 'resident')!;
  resident.name = 'Голос Меловой Переправы';
  let finish!: () => void;
  const fetcher = vi.fn<typeof fetch>(async (_target, options) => {
    expect(String(options?.body)).not.toContain(seed);
    expect(String(options?.body)).not.toContain(biography.name);
    expect(options?.signal).toBeInstanceOf(AbortSignal);
    const body = JSON.parse(String(options?.body));
    expect(body.response_format.json_schema.strict).toBe(true);
    const context = JSON.parse(body.messages[1].content);
    expect(context.atlasPlans).toHaveLength(3);
    expect(context.atlasPlans[modelChoice].scenario.focalSite).toBe(chosen.scenario.focalSite);
    expect(
      context.atlasPlans[modelChoice].sites.find((s: { id: number }) => s.id === dropped.id)
        .required,
    ).toBe(false);
    expect(context.landmarkRules.wizard_tower.statuses).toEqual(
      expect.arrayContaining(['standing', 'ruined']),
    );
    await new Promise<void>((resolve) => {
      finish = resolve;
    });
    return answer({
      ...lore,
      history: [],
      atlas: selected,
      people: lore.people.map(({ id, name, biography }) => ({ id, name, biography })),
    });
  });
  const app = await createApp(store, { timers: false, apiKey: 'test-only', loreFetch: fetcher });
  try {
    const make = app
      .inject({ method: 'POST', url: '/api/new', payload: { seed, biography } })
      .then((r) => r);
    await vi.waitFor(() => expect(finish).toBeTypeOf('function'));
    const concurrent = await app.inject({
      method: 'POST',
      url: '/api/new',
      payload: { seed, biography },
    });
    expect(concurrent.statusCode).toBe(409);
    finish();
    const world = (await make).json();
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(world.worldLore.continent).toBe(lore.continent);
    expect(world.worldLore.source).toBe('openrouter');
    expect(world.states[0].name).toBe(lore.states[0].title);
    expect(world.religions[0].name).toBe(lore.faiths[0].title);
    expect(world.rulers[0].name).toBe(lore.people[0].name);
    expect(world.states[0].ruler).toBe(base.states[0].ruler);
    expect(world.roads).toEqual(base.roads);
    expect(world.geography).toEqual(base.geography);
    expect(world.atlasWorld.scenario.id).toEqual(chosen.scenario.id);
    expect(world.atlasWorld.scenario.title).toEqual(selected.title);
    expect(world.atlasWorld.scenario.roles).toEqual(chosen.scenario.roles);
    expect(world.atlasWorld.sites).toEqual(
      chosen.sites
        .filter((s) => s.id !== dropped.id)
        .map((site, i) => ({
          ...site,
          ...selected.sites[i],
        })),
    );
    expect(
      world.atlasWorld.history.map(
        ({ id, year, site, states }: (typeof chosen.history)[number]) => ({
          id,
          year,
          site,
          states,
        }),
      ),
    ).toEqual(chosen.history.map(({ id, year, site, states }) => ({ id, year, site, states })));
    expect(world.population.total).toBe(base.people.length + 3);
    const saved = await store.load(0);
    expect(saved.worldLore).toEqual(world.worldLore);
    expect(saved.atlasWorld).toEqual(world.atlasWorld);
    const cast = saved.worldLore?.people.filter(({ role }) => role === 'resident') ?? [];
    expect(cast).toHaveLength(4);
    expect(new Set(cast.map(({ profession }) => profession)).size).toBe(4);
    expect(new Set(cast.map(({ id }) => saved.people[id].state)).size).toBe(4);
    expect(saved.people[resident.id].profession).toBe(resident.profession);
    expect(saved.npcs[resident.id].name).toBe(resident.name);
    expect(saved.npcs[resident.id].biography).toBe(resident.biography);
    expect(
      (await app.inject({ method: 'POST', url: '/api/saves/0/load' })).json().worldLore,
    ).toEqual(world.worldLore);
    expect((await app.inject('/api/world')).json().atlasWorld).toEqual(saved.atlasWorld);
    expect(fetcher).toHaveBeenCalledTimes(1);
  } finally {
    finish?.();
    await app.close();
    await rm(dir, { recursive: true, force: true });
  }
});

it('rejects mismatching entity IDs atomically and retains deterministic lore without provider', async () => {
  const w = createWorld('offline', 8);
  const again = createWorld('offline', 8);
  const { source: _, ...bad } = seededLore(w, true);
  bad.people[0].id = 999999;
  bad.states[0].title = 'Подмена';
  const fetcher = vi.fn<typeof fetch>(async () =>
    answer({
      ...bad,
      atlas: null,
      people: bad.people.map(({ id, name, biography }) => ({ id, name, biography })),
    }),
  );
  const originalRng = w.rng;
  await bootstrapWorld(w, 'test-only', fetcher);
  await bootstrapWorld(w, 'test-only', fetcher);
  await bootstrapWorld(again);
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(w).toEqual(again);
  expect(w.rng).toBe(originalRng);
  expect(w.worldLore?.source).toBe('seed');
  expect(w.states[0].name).not.toBe('Подмена');
});

type Atlas = NonNullable<ReturnType<typeof createAtlasWorld>>;

function atlasResponse(atlas: Atlas, planId: number) {
  return {
    planId,
    title: 'Дни разбитой печати',
    fallenPower: 'Державы Пепла',
    sites: atlas.sites.map(({ id, lore }) => ({ id, name: `Седая метка ${id}`, lore })),
    history: atlas.history.map(({ id, title, detail }) => ({ id, title, detail })),
  };
}

it.each(['site-id', 'event-id', 'site-status', 'plan-id', 'duplicate-name', 'required-site'])(
  'rejects malformed atlas output (%s) as one transaction',
  async (failure) => {
    const world = createOrganicWorld('inconsistent-atlas');
    const original = structuredClone(world.atlasWorld);
    const proposed = createAtlasWorld(world, 1)!;
    const written = atlasResponse(proposed, 1);
    const { source: _, ...lore } = seededLore(world, true);
    if (failure === 'site-id') written.sites[0].id = 696969;
    if (failure === 'event-id') written.history[0].id = 696969;
    if (failure === 'site-status') Object.assign(written.sites[0], { status: 'ruined' });
    if (failure === 'plan-id') written.planId = 3;
    if (failure === 'duplicate-name') written.sites[0].name = written.sites[1].name;
    if (failure === 'required-site')
      written.sites = written.sites.filter((s) => s.id !== proposed.scenario.focalSite);
    lore.states[0].title = 'Этого имени быть не должно';
    await bootstrapWorld(
      world,
      'test-only',
      vi.fn<typeof fetch>(async () =>
        answer({
          ...lore,
          history: [],
          atlas: written,
          people: lore.people.map(({ id, name, biography }) => ({ id, name, biography })),
        }),
      ),
    );
    expect(world.worldLore?.source).toBe('seed');
    expect(world.atlasWorld).toEqual(original);
    expect(world.states[0].name).not.toBe(lore.states[0].title);
    expect(world.worldLore?.premise).toBe(world.atlasWorld?.scenario.premise);
  },
);

it('feeds the academy inheritance dispute into the existing army and save systems', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'atlas-campaign-test-'));
  const store = new FileStorage(dir);
  const app = await createApp(store, { timers: false });
  try {
    const response = await app.inject({
      method: 'POST',
      url: '/api/new',
      payload: { seed: 'ashen-crown', biography },
    });
    expect(response.statusCode).toBe(200);
    const w = await store.load(0);
    const proposal = w.atlasWorld?.scenario.campaign!;
    expect(proposal).toBeDefined();
    const { a, b, target } = proposal;
    expect(w.wars).toHaveLength(1);
    expect(w.wars[0]).toMatchObject({ a, b, target, active: true, campaign: true });
    expect(w.states[a].claims).toContain(target);
    expect(w.states[a].relations[b]).toBe(-80);
    expect(w.treaties.some((t) => (t.a === a && t.b === b) || (t.a === b && t.b === a))).toBe(
      false,
    );
    expect(startAtlasCampaign(w)).toBe(false);
    expect(w.wars).toHaveLength(1);
    const forceAtStart = w.armies.reduce((sum, army) => sum + army.members.length, 0);
    for (let day = 0; day < 7; day++) tickDay(w);
    expect(
      w.armies.find((army) => army.state === a && army.journey && army.members.length),
    ).toBeDefined();
    expect(w.armies.reduce((sum, army) => sum + army.members.length, 0)).toBeGreaterThan(
      forceAtStart,
    );
    const reloaded = await app.inject({ method: 'POST', url: '/api/saves/0/load' });
    expect(reloaded.json().wars).toHaveLength(1);
    expect(reloaded.json().wars[0].id).toBe(w.wars[0].id);
  } finally {
    await app.close();
    await rm(dir, { recursive: true, force: true });
  }
});

it('opens a legacy save with seeded lore, preserving its names and never contacting the provider', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'old-lore-test-'));
  const store = new FileStorage(dir);
  const old = createWorld('legacy', 8);
  old.states[0].name = 'Название из старого сохранения';
  await store.save(0, old);
  const fetcher = vi.fn<typeof fetch>();
  const app = await createApp(store, { timers: false, apiKey: 'test-only', loreFetch: fetcher });
  try {
    const loaded = (await app.inject('/api/world')).json();
    expect(loaded.worldLore.source).toBe('seed');
    expect(loaded.worldLore.states[0].title).toBe(old.states[0].name);
    expect(loaded.states[0].name).toBe(old.states[0].name);
    expect(fetcher).not.toHaveBeenCalled();
  } finally {
    await app.close();
    await rm(dir, { recursive: true, force: true });
  }
});

it('leaves the active game usable while the provider waits and does not overwrite a newer load', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'concurrent-lore-test-'));
  const store = new FileStorage(dir);
  await store.save(0, createWorld('active-world', 8));
  await store.save(1, createWorld('chosen-save', 8));
  let release!: () => void;
  const fetcher = vi.fn<typeof fetch>(async () => {
    await new Promise<void>((resolve) => {
      release = resolve;
    });
    return new Response('', { status: 503 });
  });
  const app = await createApp(store, { timers: false, apiKey: 'test-only', loreFetch: fetcher });
  try {
    const pending = app
      .inject({ method: 'POST', url: '/api/new', payload: { seed: 'new-world', biography } })
      .then((r) => r);
    await vi.waitFor(() => expect(release).toBeTypeOf('function'));
    const command = await app.inject({
      method: 'POST',
      url: '/api/command',
      payload: { type: 'create_player', biography },
    });
    expect(command.statusCode).toBe(200);
    expect(command.json().seed).toBe('active-world');
    expect(command.json().player.name).toBe(biography.name);
    const load = await app.inject({ method: 'POST', url: '/api/saves/1/load' });
    expect(load.json().seed).toBe('chosen-save');
    release();
    expect((await pending).statusCode).toBe(409);
    expect((await app.inject('/api/world')).json().seed).toBe('chosen-save');
    expect((await store.load(0)).seed).toBe('active-world');
  } finally {
    release?.();
    await app.close();
    await rm(dir, { recursive: true, force: true });
  }
});
