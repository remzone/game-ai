import { expect, it } from 'vitest';
import {
  beginSiege,
  endSiege,
  campaignDay,
  command,
  createOrganicWorld,
  createWorld,
  death,
  economy,
  levy,
  movePerson,
  type World,
} from '@living-world/simulation';
import { decode, encode } from '../apps/server/src/storage.js';

const biography = {
  name: 'Рен',
  race: 'Human',
  sex: 'male',
  origin: 'merchants',
  childhood: 'books',
  youth: 'militia',
  training: 'warrior',
  turningPoint: 'rescue',
  reason: 'duty',
};
function playerAt(w: World, birthplace: number) {
  expect(command(w, { type: 'create_player', biography: { ...biography, birthplace } }).ok).toBe(
    true,
  );
  expect(command(w, { type: 'enter' }).ok).toBe(true);
}

it('uses real siege engines to damage the town and restores its landmark by paying the normal reconstruction costs', () => {
  const w = createOrganicWorld('works-acceptance', 60);
  const site = w.atlasWorld!.sites.find(
    (site) => site.kind === 'wizard_tower' && site.status === 'standing',
  )!;
  const s = w.settlements[site.settlement];
  const origin = w.settlements.find((t) => t.state !== s.state && t.population > 40)!;
  playerAt(w, s.id);
  const a = levy(w, origin.id, 5);
  a.player = true;
  a.food = 250;
  a.settlement = s.id;
  const old = s.state;
  w.wars.push({
    id: 'campaign:works',
    a: a.state,
    b: old,
    target: s.id,
    reason: 'тестовая пограничная война',
    active: true,
    started: 0,
    campaign: false,
  });
  s.stocks.grain = 1000;
  s.treasury = 1000;
  s.fortification = 4;
  s.infrastructure = 4;
  const siege = beginSiege(w, a);
  siege.engines = 1;
  w.day = 7;
  campaignDay(w);
  campaignDay(w); // Still the same day; do not hit the town twice.
  expect(s.structuralDamage).toBe(1);
  expect(s.infrastructure).toBe(3);
  expect(s.fortification).toBe(3);
  expect(site.status).toBe('standing');
  w.day = 14;
  campaignDay(w);
  expect(siege.status).toBe('active');
  expect(s.structuralDamage).toBe(2);
  expect(site.status).toBe('ruined');
  expect(site.damageCause).toBe('siege');
  expect(s.state).toBe(old); // A siege is not already a territorial transfer.
  endSiege(w, siege, true);
  expect(s.state).toBe(a.state);
  expect(s.structuralDamage).toBe(2);
  const saved = decode(encode(w));
  expect(saved.atlasWorld!.sites.find((item) => item.id === site.id)?.status).toBe('ruined');
  expect(saved.settlements[s.id].structuralDamage).toBe(2);
  expect(saved.settlements[s.id].state).toBe(a.state);
  s.governance.steward = w.player!.person;
  s.stocks.wood = 99;
  s.stocks.stone = 100;
  s.treasury = 700;
  expect(command(w, { type: 'public_build' }).ok).toBe(false);
  expect(s.structuralDamage).toBe(2);
  s.stocks.wood = 201;
  expect(command(w, { type: 'public_build' }).ok).toBe(true);
  expect(s.structuralDamage).toBe(1);
  expect(site.status).toBe('ruined');
  expect(command(w, { type: 'public_build' }).ok).toBe(true);
  expect(s.structuralDamage).toBe(0);
  expect(s.infrastructure).toBe(4);
  expect(s.fortification).toBe(2); // Rebuilding homes does not automatically repair walls.
  expect(s.stocks.wood).toBe(1);
  expect(s.stocks.stone).toBe(0);
  expect(s.treasury).toBe(300);
  expect(site.status).toBe('standing');
  expect(site.damageCause).toBeUndefined();
});
it('leaves non-bombarded captures intact, but actual abandonment degrades a town and stops new construction', () => {
  const w = createOrganicWorld('works-peace', 40);
  const site = w.atlasWorld!.sites.find(
    (site) => site.kind === 'wizard_tower' && site.status === 'standing',
  )!;
  const s = w.settlements[site.settlement];
  const origin = w.settlements.find((t) => t.state !== s.state && t.population > 40)!;
  const a = levy(w, origin.id, 5);
  a.settlement = s.id;
  const infrastructure = s.infrastructure;
  const siege = beginSiege(w, a);
  endSiege(w, siege, true);
  expect(s.state).toBe(a.state);
  expect(s.infrastructure).toBe(infrastructure);
  expect(s.structuralDamage).toBeUndefined();
  expect(site.status).toBe('standing');
  for (const id of s.residents) death(w, w.people[id], 'запустение');
  s.stocks.wood = 500;
  s.stocks.stone = 500;
  s.loyalty = 89;
  w.day = 30;
  economy(w);
  expect(s.kind).toBe('ruins');
  expect(s.stocks.wood).toBe(500);
  expect(s.stocks.stone).toBe(500);
  expect(site.status).toBe('abandoned');
  expect(site.damageCause).toBe('abandonment');
  const settler = origin.residents
    .map((id) => w.people[id])
    .find((p) => p.alive && p.profession !== 'child' && p.profession !== 'soldier')!;
  movePerson(w, settler, s.id);
  s.stocks.grain = 50;
  w.day = 60;
  economy(w);
  expect(s.kind).not.toBe('ruins');
  expect(s.structuralDamage).toBe(0);
  expect(s.stocks.wood).toBeLessThan(500);
  expect(s.stocks.stone).toBeLessThan(500);
  expect(site.status).toBe('standing');
  expect(site.damageCause).toBeUndefined();
  expect(
    w.atlasWorld!.sites.find(
      (site) => site.kind === 'wizard_tower' && !site.damageCause && site.status === 'ruined',
    ),
  ).toBeDefined();
});
it('dates new settlements without inheriting their parent damage and accepts older undated archives', () => {
  const w = createOrganicWorld('dated-reconstruction');
  const s = w.settlements[0];
  playerAt(w, 0);
  s.structuralDamage = 2;
  s.treasury = 600;
  s.stocks.wood = 200;
  s.stocks.stone = 100;
  s.stocks.grain = 350;
  w.day = 109;
  w.states[s.state].ruler = w.player!.person;
  expect(command(w, { type: 'found_settlement', name: 'Заречная Слобода' }).ok).toBe(true);
  const colony = w.settlements.at(-1)!;
  expect(colony.foundedDay).toBe(109);
  expect(colony.structuralDamage).toBe(0);
  expect(colony.population).toBe(10);
  expect(decode(encode(w)).settlements.at(-1)!.foundedDay).toBe(109);
  const old = createWorld('dated-old-archive', 8);
  expect(decode(encode(old)).settlements[0].foundedDay).toBeUndefined();
  expect(decode(encode(old)).atlasWorld).toBeUndefined();
});

it('puts a new defensive landmark on the chart only after paid construction', () => {
  const w = createOrganicWorld('lookout-construction');
  const s = w.settlements[0];
  playerAt(w, 0);
  w.states[s.state].ruler = w.player!.person;
  s.treasury = 500;
  s.stocks.wood = 160;
  s.stocks.stone = 0;
  const original = w.atlasWorld!.sites.length;
  expect(command(w, { type: 'fortify' }).ok).toBe(false);
  expect(w.atlasWorld!.sites).toHaveLength(original);
  s.stocks.stone = 250;
  w.day = 19;
  expect(command(w, { type: 'fortify' }).ok).toBe(true);
  expect(w.atlasWorld!.sites).toHaveLength(original + 1);
  expect(w.atlasWorld!.sites.at(-1)).toMatchObject({
    builtDay: 19,
    status: 'standing',
    kind: 'fortress',
    settlement: 0,
    state: s.state,
  });
  expect(s.treasury).toBe(300);
  expect(s.stocks.stone).toBe(150);
  expect(command(w, { type: 'fortify' }).ok).toBe(true);
  expect(w.atlasWorld!.sites).toHaveLength(original + 1);
  expect(decode(encode(w)).atlasWorld!.sites.at(-1)).toEqual(w.atlasWorld!.sites.at(-1));
});
