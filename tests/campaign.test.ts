import { expect, it } from 'vitest';
import {
  createWorld,
  campaignDay,
  militaryRoute,
  levy,
  transferSettlement,
  polityDay,
  beginSiege,
  command,
  stepBattle,
} from '@living-world/simulation';
import { encode, decode } from '../apps/server/src/storage.js';

function warWorld() {
  const w = createWorld('campaign-acceptance', 100);
  w.wars.push({
    id: 'campaign:test',
    a: 0,
    b: 1,
    target: 30,
    reason: 'territorial claim',
    started: 0,
    active: true,
    campaign: true,
  });
  // Isolate a two-day border route, with one provisioned recruiting settlement.
  w.roads = [{ a: 5, b: 30, days: 2, blocked: false, traffic: 0 }];
  for (const s of w.settlements) s.stocks.grain = 0;
  w.settlements[5].stocks.grain = 5000;
  w.settlements[5].treasury = 5000;
  w.day = 7;
  return w;
}
it('a funded campaign moves existing people and food before establishing a blockade', () => {
  const w = warWorld(),
    s = w.settlements[5],
    people = w.people.length,
    weapons = s.stocks.weapons,
    grain = s.stocks.grain,
    cash = s.treasury;
  campaignDay(w);
  const a = w.armies.find((a) => a.state === 0 && a.members.length)!;
  expect(a.members.length).toBeGreaterThanOrEqual(5);
  expect(a.settlement).toBe(5);
  expect(a.journey?.total).toBe(2);
  expect(s.stocks.grain + a.food).toBe(grain);
  expect(s.stocks.weapons + a.members.length).toBe(weapons);
  expect(s.treasury + a.members.length * 10).toBe(cash);
  expect(w.people.length).toBe(people);
  campaignDay(w);
  expect(a.settlement).toBe(5);
  w.settlements[30].stocks.grain = 300;
  campaignDay(w);
  expect(a.settlement).toBe(30);
  expect(a.members.every((id) => w.people[id].settlement === 30 && w.people[id].state === 0)).toBe(
    true,
  );
  expect(w.sieges[0].status).toBe('active');
  expect(w.roads[0].blocked).toBe(true);
});
it('food shortages prevent recruitment and neutral transit requires an unexpired treaty', () => {
  const w = warWorld();
  w.settlements[5].stocks.grain = 0;
  const before = JSON.stringify(w.people);
  campaignDay(w);
  expect(w.armies).toHaveLength(0);
  expect(JSON.stringify(w.people)).toBe(before);
  w.roads = [
    { a: 5, b: 60, days: 1, traffic: 0, blocked: false },
    { a: 60, b: 30, days: 1, traffic: 0, blocked: false },
  ];
  expect(militaryRoute(w, 0, 5, 30)).toEqual([]);
  w.treaties.push({ id: 'access', a: 0, b: 2, type: 'access', until: 8 });
  expect(militaryRoute(w, 0, 5, 30)).toEqual([5, 60, 30]);
  w.day = 8;
  expect(militaryRoute(w, 0, 5, 30)).toEqual([]);
});
it('a loyal village and a real defending garrison resist administrative annexation', () => {
  const w = createWorld('resistance', 100);
  transferSettlement(w, 0, 1);
  const village = w.settlements[1];
  village.loyalty = 80;
  w.day = 14;
  polityDay(w);
  expect(village.state).toBe(0);
  expect(village.occupation?.until).toBe(21);
  village.loyalty = 40;
  const defenders = levy(w, 1, 5);
  expect(defenders.members.length).toBe(5);
  w.day = 21;
  polityDay(w);
  expect(village.state).toBe(0);
  transferSettlement(w, 0, 0);
  polityDay(w);
  expect(village.occupation).toBeNull();
});
it('peace lifts an active blockade and releases garrison resources exactly once', () => {
  const w = warWorld();
  const a = levy(w, 5, 10);
  a.settlement = 30;
  w.settlements[30].stocks.grain = 300;
  const siege = beginSiege(w, a);
  w.wars[0].active = false;
  campaignDay(w);
  expect(siege.status).toBe('lifted');
  expect(w.roads[0].blocked).toBe(false);
  const grain = w.settlements[30].stocks.grain;
  campaignDay(w);
  expect(w.settlements[30].stocks.grain).toBe(grain);
});
it('autonomous assaults reconcile casualties with named living people', () => {
  const w = warWorld(),
    a = levy(w, 5, 20);
  a.settlement = 30;
  a.food = 500;
  w.settlements[30].stocks.grain = 100;
  const siege = beginSiege(w, a),
    d = w.armies.find((a) => a.id === siege.defender)!;
  const ids = [...d.members];
  siege.pressure = 100;
  for (const id of ids) w.people[id].health = 1;
  campaignDay(w);
  expect(ids.length).toBeGreaterThan(0);
  expect(ids.every((id) => !w.people[id].alive)).toBe(true);
  expect(siege.status).toBe('captured');
  expect(w.settlements[30].state).toBe(0);
});
it('a defensive sortie uses the real garrison, and victory lifts rather than captures the town', () => {
  const w = warWorld();
  command(w, {
    type: 'create_player',
    biography: {
      name: 'Защитник',
      race: 'Human',
      sex: 'male',
      birthplace: 30,
      origin: 'merchants',
      childhood: 'fields',
      youth: 'militia',
      training: 'warrior',
      turningPoint: 'rescue',
      reason: 'duty',
    },
  });
  const a = levy(w, 5, 10);
  a.settlement = 30;
  w.settlements[30].stocks.grain = 100;
  const siege = beginSiege(w, a),
    garrison = w.armies.find((a) => a.id === siege.defender)!;
  expect(command(w, { type: 'defend_siege' }).ok).toBe(true);
  expect(
    garrison.members.every((id) =>
      w.battle!.fighters.some((f) => f.person === id && f.side === 'player'),
    ),
  ).toBe(true);
  for (const f of w.battle!.fighters) if (f.side === 'enemy') f.hp = 0;
  stepBattle(w);
  expect(siege.status).toBe('lifted');
  expect(w.settlements[30].state).toBe(1);
});
it('old v4 sieges remain loadable and siege engines survive checksummed saves', () => {
  const w = warWorld(),
    a = levy(w, 5, 10);
  a.settlement = 30;
  const siege = beginSiege(w, a);
  delete siege.engines;
  expect(decode(encode(w)).sieges[0].engines ?? 0).toBe(0);
  siege.engines = 2;
  expect(decode(encode(w)).sieges[0].engines).toBe(2);
});

it('an exhausted campaign grants withdrawal passage and returns its real army along roads', () => {
  const w = warWorld(),
    a = levy(w, 5, 10);
  a.settlement = 30;
  w.day = 180;
  const siege = beginSiege(w, a);
  campaignDay(w);
  expect(w.wars[0].active).toBe(false);
  expect(siege.status).toBe('lifted');
  expect(a.settlement).toBe(30);
  expect(a.journey?.route).toEqual([30, 5]);
  expect(w.treaties.some((t) => t.type === 'peace')).toBe(true);
});
