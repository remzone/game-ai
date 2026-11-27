import { expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  appearanceFor,
  createWorld,
  createOrganicWorld,
  promote,
  organicPersonName,
  PORTRAIT_VARIANTS,
  BiographySchema,
  command,
  addPerson,
} from '@living-world/simulation';
import { createApp } from '../apps/server/src/app.js';
import { FileStorage, decode, encode } from '../apps/server/src/storage.js';

const bio = {
  name: 'Лиана',
  race: 'Dark Elf',
  sex: 'female',
  birthplace: 0,
  origin: 'merchants',
  childhood: 'books',
  youth: 'caravan',
  training: 'healer',
  turningPoint: 'inheritance',
  reason: 'knowledge',
};

it('validates new-character options and equips, projects, and persists really owned clothes', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'portrait-test-'));
  const storage = new FileStorage(dir);
  const app = await createApp(storage, { timers: false });
  try {
    const invalid = await app.inject({
      method: 'POST',
      url: '/api/new',
      payload: {
        seed: 'portrait-test',
        biography: { ...bio, appearance: { hair: 'pink', eyes: 'gray' } },
      },
    });
    expect(invalid.statusCode).toBe(400);
    const invalidStyle = await app.inject({
      method: 'POST',
      url: '/api/new',
      payload: {
        seed: 'portrait-test',
        biography: { ...bio, appearance: { hair: 'silver', eyes: 'gray', hairStyle: 'invalid' } },
      },
    });
    expect(invalidStyle.statusCode).toBe(400);
    expect(await storage.list()).toHaveLength(0);
    const created = await app.inject({
      method: 'POST',
      url: '/api/new',
      payload: {
        seed: 'portrait-test',
        biography: {
          ...bio,
          appearance: {
            hair: 'silver',
            eyes: 'gray',
            face: 'rounded',
            hairStyle: 'braided',
            skin: 'slate',
          },
        },
      },
    });
    expect(created.statusCode).toBe(200);
    const initial = created.json();
    expect(initial.hero.appearance).toMatchObject({
      race: 'Dark Elf',
      sex: 'female',
      hair: 'silver',
      eyes: 'gray',
      face: 'rounded',
      hairStyle: 'braided',
      skin: 'slate',
      outfit: 'healer',
    });
    expect(initial.wardrobe).toEqual({ equipped: 'healer', outfitIds: ['traveler', 'healer'] });
    expect(initial.player.biography.appearance).toBeUndefined();
    expect(initial.rulers[0].appearance).toBeDefined();
    const reject = await app.inject({
      method: 'POST',
      url: '/api/command',
      payload: { type: 'equip_outfit', outfit: 'warrior' },
    });
    expect(reject.statusCode).toBe(400);
    expect((await storage.load(0)).people[initial.hero.id].wardrobe?.equipped).toBe('healer');
    const changed = await app.inject({
      method: 'POST',
      url: '/api/command',
      payload: { type: 'equip_outfit', outfit: 'traveler' },
    });
    expect(changed.statusCode).toBe(200);
    expect(changed.json().hero.appearance).toEqual({
      ...initial.hero.appearance,
      outfit: 'traveler',
    });
    const saved = await storage.load(0);
    expect(saved.people[initial.hero.id].wardrobe?.equipped).toBe('traveler');
    expect(saved.people[initial.hero.id].appearance).toMatchObject({
      hair: 'silver',
      eyes: 'gray',
      face: 'rounded',
      hairStyle: 'braided',
      skin: 'slate',
    });
    const loaded = await app.inject({ method: 'POST', url: '/api/saves/0/load' });
    expect(loaded.json().hero.appearance).toEqual(changed.json().hero.appearance);
    const enter = await app.inject({
      method: 'POST',
      url: '/api/command',
      payload: { type: 'enter' },
    });
    const npc = enter.json().locals.find((p: { id: number }) => p.id !== initial.hero.id);
    const talk = await app.inject({
      method: 'POST',
      url: '/api/dialogue',
      payload: { person: npc.id },
    });
    expect(talk.json().appearance).toEqual(npc.appearance);
  } finally {
    await app.close();
    await rm(dir, { recursive: true, force: true });
  }
});

it('projects deterministic legacy and mixed-ancestry NPCs without mutating RNG; clothing follows gear', () => {
  const w = createWorld('legacy-portrait', 8);
  const p = w.people[0];
  p.ancestry = [0.1, 0.15, 0.7, 0.05, 0, 0];
  p.sex = 'female';
  p.profession = 'merchant';
  const rng = w.rng;
  const face = appearanceFor(w, p);
  expect(face.race).toBe('Dark Elf');
  expect(face.sex).toBe('female');
  expect(face.outfit).toBe('trader');
  const loaded = decode(encode(w));
  expect(loaded.people[0].appearance).toBeUndefined();
  expect(appearanceFor(loaded, loaded.people[0])).toEqual(face);
  p.profession = 'soldier';
  expect(appearanceFor(w, p)).toEqual({ ...face, outfit: 'warrior' });
  expect(w.rng).toBe(rng);
});

it('an heir keeps their own identity and clothing instead of copying the deceased hero', () => {
  const w = createWorld('inherit-portrait', 20);
  expect(
    command(w, {
      type: 'create_player',
      biography: { ...bio, appearance: { hair: 'silver', eyes: 'gray' } },
    }).ok,
  ).toBe(true);
  const older = w.people[w.player!.person];
  const heir = addPerson(w, 0, 32, [1, 0, 0, 0, 0, 0], [older.id]);
  heir.sex = 'male';
  heir.profession = 'merchant';
  w.player!.heirs = [heir.id];
  older.alive = false;
  const original = appearanceFor(w, heir);
  expect(command(w, { type: 'inherit', person: heir.id }).ok).toBe(true);
  expect(appearanceFor(w, w.people[w.player!.person])).toEqual(original);
  expect(w.people[w.player!.person].wardrobe?.outfitIds).toEqual(['traveler', 'trader']);
});

it('names organic NPCs from their actual ancestry and sex, while retaining already authored names', () => {
  const w = createOrganicWorld('ashen-crown', 12);
  const first = w.people[w.states[0].ruler];
  expect(w.npcs[first.id].name).toBe(organicPersonName(w, first));
  expect(w.npcs[first.id].name).not.toMatch(/\d/);
  const rng = w.rng;
  const given = (p: typeof first) => organicPersonName(w, p).split(' ')[0];
  const humanMale = {
    ...first,
    sex: 'male' as const,
    ancestry: [1, 0, 0, 0, 0, 0] as typeof first.ancestry,
  };
  expect(given(humanMale)).toMatch(/^(Эрин|Торен|Велен|Бернар|Мирослав|Радан|Калем|Ивар)$/);
  expect(given({ ...humanMale, sex: 'female' })).toMatch(
    /^(Мира|Рада|Альва|Милена|Илана|Велена|Злата|Тамара)$/,
  );
  expect(given({ ...humanMale, ancestry: [0, 0.2, 0.8, 0, 0, 0] })).toMatch(
    /^(Ваарен|Сэвар|Нэртас|Дариэль|Валькар|Тарэн|Ашрен|Сиар)$/,
  );
  expect(w.rng).toBe(rng);
  const npc = w.npcs[first.id];
  npc.name = 'Имя из сохранения';
  const restored = decode(encode(w));
  expect(promote(restored, first.id).name).toBe(npc.name);
  const archive = createWorld('legacy-name', 12);
  expect(archive.npcs[archive.states[0].ruler].name).toMatch(/ 0$/);
});

it('gives same-ancestry NPCs independent, stable facial features and fills older partial portraits', () => {
  const w = createWorld('faces-archive', 8);
  const ancestry = [1, 0, 0, 0, 0, 0] as (typeof w.people)[number]['ancestry'];
  const people = w.people.slice(0, 24);
  for (const p of people) {
    p.ancestry = ancestry;
    p.sex = 'female';
  }
  const rng = w.rng;
  const appearances = people.map((p) => appearanceFor(w, p));
  expect(new Set(appearances.map((a) => a.face)).size).toBe(2);
  expect(new Set(appearances.map((a) => a.hairStyle)).size).toBe(4);
  expect(new Set(appearances.map((a) => a.skin)).size).toBe(4);
  expect(
    new Set(appearances.map((a) => a.face + ':' + a.hairStyle + ':' + a.skin)).size,
  ).toBeGreaterThan(8);
  people[0].appearance = { hair: 'auburn', eyes: 'green' };
  const legacy = decode(encode(w));
  const first = appearanceFor(legacy, legacy.people[0]);
  expect(first).toEqual({ ...appearances[0], hair: 'auburn', eyes: 'green' });
  expect(legacy.people.slice(1, 24).map((p) => appearanceFor(legacy, p))).toEqual(
    appearances.slice(1),
  );
  expect(w.rng).toBe(rng);
});

it('validates the six ready portrait choices and persists a preset-only creation request', async () => {
  for (const variant of PORTRAIT_VARIANTS)
    expect(BiographySchema.safeParse({ ...bio, appearance: { variant } }).success).toBe(true);
  for (const variant of [0, 7, 2.5, '4'])
    expect(BiographySchema.safeParse({ ...bio, appearance: { variant } }).success).toBe(false);
  const dir = await mkdtemp(join(tmpdir(), 'preset-test-'));
  const storage = new FileStorage(dir);
  const app = await createApp(storage, { timers: false });
  try {
    const created = await app.inject({
      method: 'POST',
      url: '/api/new',
      payload: { seed: 'ready-portrait', biography: { ...bio, appearance: { variant: 6 } } },
    });
    expect(created.statusCode).toBe(200);
    const initial = created.json();
    expect(initial.hero.appearance).toMatchObject({ race: 'Dark Elf', sex: 'female', variant: 6 });
    expect((await storage.load(0)).people[initial.hero.id].appearance?.variant).toBe(6);
    const equip = await app.inject({
      method: 'POST',
      url: '/api/command',
      payload: { type: 'equip_outfit', outfit: 'traveler' },
    });
    expect(equip.json().hero.appearance.variant).toBe(6);
    const loaded = await app.inject({ method: 'POST', url: '/api/saves/0/load' });
    expect(loaded.json().hero.appearance.variant).toBe(6);
    expect(loaded.json().wardrobe.equipped).toBe('traveler');
  } finally {
    await app.close();
    await rm(dir, { recursive: true, force: true });
  }
});

it('falls back to stable ready portraits without using RNG, including older saves with stored layers', () => {
  const w = createWorld('old-portrait-preset', 22);
  const actors = w.people.slice(0, 60);
  const rng = w.rng;
  const variants = actors.map((person) => appearanceFor(w, person).variant);
  expect(new Set(variants)).toEqual(new Set(PORTRAIT_VARIANTS));
  const person = actors[0];
  person.appearance = {
    hair: 'auburn',
    eyes: 'green',
    face: 'angular',
    hairStyle: 'braided',
    skin: 'pale',
  };
  const restored = decode(encode(w));
  expect(appearanceFor(restored, restored.people[0])).toMatchObject({
    ...person.appearance,
    variant: variants[0],
  });
  expect(restored.people.slice(0, 60).map((p) => appearanceFor(restored, p).variant)).toEqual(
    variants,
  );
  expect(w.rng).toBe(rng);
});
