import { expect, it } from 'vitest';
import {
  command,
  createOrganicWorld,
  makeJourney,
  logistics,
  mapProjection,
  movePerson,
  raidCaravan,
  tickDay,
  type Caravan,
} from '@living-world/simulation';
import { worldView } from '../apps/server/src/app.js';
import { decode, encode } from '../apps/server/src/storage.js';

const biography = {
  name: 'Лиора',
  race: 'Human',
  sex: 'female',
  birthplace: 0,
  origin: 'merchants',
  childhood: 'fields',
  youth: 'militia',
  training: 'trader',
  turningPoint: 'rescue',
  reason: 'knowledge',
};

function begin() {
  const w = createOrganicWorld('ashen-crown', 60);
  expect(command(w, { type: 'create_player', biography }).ok).toBe(true);
  return w;
}

it('gives healthy existing NPCs the commands of real, moving armies; replaces a lost commander', () => {
  const w = begin();
  const initial = worldView(w).roadActors.find((a) => a.kind === 'army')!;
  expect(initial.commander).toBeTruthy();
  expect(initial.count).toBe(4);
  const army = w.armies.find((a) => a.id === initial.id)!;
  expect(army.members).toContain(initial.person);
  for (let i = 0; i < 4; i++) tickDay(w);
  const moving = worldView(w).roadActors.find((a) => a.id === initial.id)!;
  expect(moving.fraction).toBeGreaterThan(0);
  expect(moving.fraction).toBeLessThan(1);
  expect(moving.toward).not.toBe(moving.at);
  army.members = army.members.filter((id) => id !== initial.person);
  tickDay(w);
  expect(army.members).toContain(army.commander);
  expect(army.commander).not.toBe(initial.person);
});

it('lets a hero buy physical goods from a real merchant only when both are stopped at the same place', () => {
  const w = begin(),
    p = w.player!;
  const merchant = worldView(w).roadActors.find((m) => m.kind === 'merchant' && m.at === 0)!;
  const offer = merchant.offers!.find((o) => o.good === 'grain')!;
  const good = offer.good,
    traveler = w.roadLife!.peddlers.find((t) => t.person === merchant.person)!;
  const seller = w.people[traveler.person];
  const cost = offer.price;
  const before = [p.gold, p.inventory[good], seller.wealth, traveler.goods[good]];
  const buy = { type: 'road_buy', person: seller.id, good, quantity: 1 };
  expect(command(w, buy).ok).toBe(true);
  expect([p.gold, p.inventory[good], seller.wealth, traveler.goods[good]]).toEqual([
    before[0] - cost,
    before[1] + 1,
    before[2] + cost,
    before[3] - 1,
  ]);
  expect(command(w, { ...buy, quantity: 20 }).ok).toBe(false);
  tickDay(w);
  expect(traveler.journey).toBeTruthy();
  expect(command(w, buy).ok).toBe(false);
  const duration = traveler.journey!.total;
  for (let day = 0; day < duration; day++) tickDay(w);
  expect(seller.settlement).not.toBe(0);
  expect(command(w, buy).ok).toBe(false);
  expect(worldView(w).roadActors.find((m) => m.id === merchant.id)?.offers).toBeUndefined();
});

it('transfers stolen cargo once and an escort of sufficient strength protects the shipment', () => {
  const w = begin();
  const b = w.roadLife!.bands.find((b) => mapProjection(w)!.visible.includes(b.home))!;
  const road = w.roads.find((r) => r.a === b.home || r.b === b.home)!;
  const next = road.a === b.home ? road.b : road.a;
  b.journey = makeJourney(w, [b.home, next]);
  const c: Caravan = {
    id: 'shipment',
    from: b.home,
    to: next,
    good: 'iron',
    amount: 36,
    paid: 72,
    journey: makeJourney(w, [b.home, next]),
    status: 'traveling',
  };
  raidCaravan(w, c, b.members.length);
  expect(c.amount).toBe(36);
  raidCaravan(w, c, 0);
  expect(c.amount).toBe(24);
  expect(b.loot.iron).toBe(12);
  raidCaravan(w, c, 0);
  expect(c.amount + b.loot.iron).toBe(36);
  w.day = 1;
  w.settlements[b.home].monsters = 0;
  w.caravans.push(c);
  const stock = w.settlements[next].stocks.iron;
  const days = c.journey.total;
  for (let i = 0; i < days; i++) logistics(w);
  expect(c.status).toBe('delivered');
  expect(w.settlements[next].stocks.iron).toBe(stock + 24);
  expect(
    w.events.filter((e) => e.type === 'bandit_raid' && e.entities.includes(c.id)),
  ).toHaveLength(1);
});

it('keeps merchants, bandits and armies hidden outside current sight even after buying a chart; state survives save', () => {
  const w = begin();
  for (let i = 0; i < 4; i++) tickDay(w);
  const before = worldView(w);
  expect(new Set(before.roadActors.map((a) => a.kind))).toEqual(
    new Set(['army', 'band', 'caravan', 'merchant']),
  );
  expect(before.roadLife).toBeUndefined();
  expect(command(w, { type: 'buy_world_chart' }).ok).toBe(true);
  const chart = worldView(w);
  expect(chart.mapKnowledge!.known).toHaveLength(w.settlements.length);
  expect(chart.roadActors.map((a) => a.id)).toEqual(before.roadActors.map((a) => a.id));
  for (const a of chart.roadActors) {
    expect(chart.mapKnowledge!.visible).toContain(a.at);
    if (a.toward !== undefined) expect(chart.mapKnowledge!.visible).toContain(a.toward);
  }
  const loaded = decode(encode(w));
  expect(loaded.roadLife).toEqual(JSON.parse(JSON.stringify(w.roadLife)));
  expect(worldView(loaded).roadActors).toEqual(chart.roadActors);
  const far = w.states.find((s) => !chart.mapKnowledge!.visible.includes(s.capital))!;
  movePerson(w, w.people[w.player!.person], far.capital);
  const after = worldView(w);
  expect(
    after.roadActors.some((a) => a.id === chart.roadActors.find((v) => v.kind === 'army')!.id),
  ).toBe(false);
});
