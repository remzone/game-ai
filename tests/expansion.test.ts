import { it, expect } from 'vitest';
import {
  createWorld,
  command,
  tickDay,
  death,
  addPerson,
  politics,
  polityDay,
  economy,
  succession,
  stepBattle,
  route,
  logistics,
  type World,
  emptyStocks,
} from '@living-world/simulation';
import { estateProduction } from '../packages/simulation/src/property.js';
import { campaignDay } from '../packages/simulation/src/campaign.js';
import { decode, encode } from '../apps/server/src/storage.js';
import { createApp } from '../apps/server/src/app.js';
import { FileStorage } from '../apps/server/src/storage.js';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
function game() {
  const w = createWorld('expansion', 60);
  command(w, {
    type: 'create_player',
    biography: {
      name: 'Рем',
      race: 'Human',
      sex: 'male',
      birthplace: 0,
      origin: 'merchants',
      childhood: 'fields',
      youth: 'militia',
      training: 'warrior',
      turningPoint: 'rescue',
      reason: 'duty',
    },
  });
  command(w, { type: 'enter' });
  return w;
}
function reject(w: World, c: unknown) {
  const before = JSON.stringify(w);
  expect(command(w, c).ok).toBe(false);
  expect(JSON.stringify(w)).toBe(before);
}
it('splits all player assets and estates between heirs while preserving personal skills', () => {
  const w = game(),
    p = w.player!,
    old = p.person;
  w.states[0].laws.inheritance = 'equal';
  const one = addPerson(w, 0, 22, [1, 0, 0, 0, 0, 0], [old]),
    two = addPerson(w, 0, 20, [1, 0, 0, 0, 0, 0], [old]);
  one.wealth = 0;
  two.wealth = 0;
  p.heirs = [one.id, two.id];
  p.gold = 100;
  p.inventory = { ...emptyStocks(), grain: 20, iron: 6 };
  p.skills.magic = 20;
  w.estates.push({
    id: 'farm-test',
    owner: old,
    settlement: 0,
    kind: 'farm',
    workers: [],
    stocks: emptyStocks(),
    treasury: 10,
  });
  death(w, w.people[old], 'test');
  expect(command(w, { type: 'inherit', person: one.id }).ok).toBe(true);
  expect(p.gold).toBe(50);
  expect(two.wealth).toBe(50);
  expect(p.inventory.grain).toBe(10);
  expect(w.npcs[two.id].possessions?.iron).toBe(3);
  expect(p.skills.magic ?? 0).toBe(0);
  expect(w.estates[0].owner).toBe(one.id);
});
it('respects primogeniture without deleting a younger playable heir', () => {
  const w = game(),
    p = w.player!,
    old = p.person;
  w.states[0].laws.inheritance = 'eldest';
  const older = addPerson(w, 0, 30, [1, 0, 0, 0, 0, 0], [old]),
    younger = addPerson(w, 0, 20, [1, 0, 0, 0, 0, 0], [old]);
  older.wealth = 0;
  younger.wealth = 0;
  p.heirs = [older.id, younger.id];
  p.gold = 120;
  death(w, w.people[old], 'test');
  expect(command(w, { type: 'inherit', person: younger.id }).ok).toBe(true);
  expect(p.gold).toBe(0);
  expect(older.wealth).toBe(120);
  expect(w.people[older.id].alive).toBe(true);
});
it('requires a real relationship, paid recognition and an adult successor', () => {
  const w = game(),
    p = w.player!,
    other = w.settlements[0].residents[8];
  w.people[other].born = -40 * 360;
  reject(w, { type: 'recognize_heir', person: other });
  command(w, { type: 'gift', person: other });
  reject(w, { type: 'gift', person: other });
  w.day++;
  command(w, { type: 'gift', person: other });
  expect(command(w, { type: 'recognize_heir', person: other }).ok).toBe(true);
  expect(p.heirs).toContain(other);
  expect(w.npcs[p.person].recognizedHeirs).toContain(other);
});
it('uses hereditary succession versus recorded council elections', () => {
  const w = game(),
    state = w.states[0],
    old = state.ruler,
    heir = addPerson(w, 0, 30, [1, 0, 0, 0, 0, 0], [old]);
  death(w, w.people[old], 'test');
  succession(w, state);
  expect(state.ruler).toBe(heir.id);
  state.government = 'merchant_republic';
  state.electionDay = w.day;
  polityDay(w);
  expect(state.ballots.length).toBeGreaterThan(0);
  expect(state.electionDay).toBe(w.day + 360);
  expect(w.people[state.ruler].alive).toBe(true);
});
it('lets earned local mandates lead to region and crown without a free crown command', () => {
  const w = game(),
    p = w.player!,
    state = w.states[0];
  reject(w, { type: 'seek_region' });
  reject(w, { type: 'seek_crown' });
  for (const s of w.settlements.filter((t) => t.region === 0)) {
    s.governance.steward = p.person;
    s.loyalty = 80;
  }
  expect(command(w, { type: 'seek_region' }).ok).toBe(true);
  expect(w.regions[0].governor).toBe(p.person);
  command(w, { type: 'recruit', count: 10 });
  for (const r of w.regions.filter((r) => r.state === 0).slice(0, 3)) r.governor = p.person;
  reject(w, { type: 'seek_crown' });
  state.legitimacy = 20;
  expect(command(w, { type: 'seek_crown' }).ok).toBe(true);
  expect(state.ruler).toBe(p.person);
});
it('prolonged regional discontent creates an actual independent realm without losing people', () => {
  const w = game(),
    count = w.people.length;
  for (const s of w.settlements.filter((t) => t.state === 0)) s.loyalty = 10;
  for (let i = 0; i < 30; i++) {
    w.day++;
    polityDay(w);
  }
  expect(w.states.length).toBe(11);
  expect(w.people.length).toBe(count);
  expect(w.settlements.filter((s) => s.state === 10)).toHaveLength(6);
  expect(w.regions[0].state).toBe(10);
  expect(w.organizations[0].members.every((id) => w.people[id].alive)).toBe(true);
});
it('estate production transfers goods, pays identities and cannot operate with an empty till', () => {
  const w = game();
  w.player!.gold = 500;
  expect(command(w, { type: 'buy_estate', kind: 'farm' }).ok).toBe(true);
  const e = w.estates[0],
    s = w.settlements[0],
    grain = e.stocks.grain + s.stocks.grain,
    till = e.treasury,
    wealth = w.people.reduce((n, p) => n + p.wealth, 0);
  estateProduction(w, s, { grain: 10 });
  expect(e.stocks.grain + s.stocks.grain).toBeCloseTo(grain);
  expect(e.stocks.grain).toBeGreaterThan(0);
  expect(w.people.reduce((n, p) => n + p.wealth, 0) - wealth).toBeCloseTo(till - e.treasury);
  e.treasury = 0;
  const before = JSON.stringify(e.stocks);
  estateProduction(w, s, { grain: 10 });
  expect(JSON.stringify(e.stocks)).toBe(before);
  reject(w, { type: 'estate', estate: e.id, action: 'withdraw', quantity: 1, good: 'grain' });
});
function siegeGame() {
  const w = game();
  command(w, { type: 'recruit', count: 10 });
  const a = w.armies.find((a) => a.id === w.player!.army)!;
  a.state = 1;
  w.wars.push({
    id: 'testwar',
    a: 1,
    b: 0,
    reason: 'test',
    started: 0,
    active: true,
    target: 0,
    campaign: true,
  });
  expect(command(w, { type: 'besiege' }).ok).toBe(true);
  return w;
}
it('blockade prevents deliveries and a real assault reconciles defenders and captures the city', () => {
  const w = siegeGame(),
    siege = w.sieges[0],
    defender = w.armies.find((a) => a.id === siege.defender)!,
    ids = [...defender.members];
  expect(ids.length).toBeGreaterThan(0);
  expect(route(w, 0, 1)).toEqual([]);
  expect(command(w, { type: 'assault' }).ok).toBe(true);
  expect(
    w.battle!.fighters.filter((f) => f.side === 'enemy').every((f) => f.person !== undefined),
  ).toBe(true);
  for (const f of w.battle!.fighters) if (f.side === 'enemy') f.hp = 0;
  stepBattle(w);
  expect(w.settlements[0].state).toBe(1);
  expect(w.sieges[0].status).toBe('captured');
  expect(ids.every((id) => !w.people[id].alive)).toBe(true);
  expect(route(w, 0, 1).length).toBeGreaterThan(0);
  expect(w.settlements[1].occupation?.state).toBe(1);
  w.settlements[1].loyalty = 40;
  w.day += 14;
  polityDay(w);
  expect(w.settlements[1].state).toBe(1);
});
it('starvation weakens the real garrison and causes surrender; lifting releases surviving workers', () => {
  const w = siegeGame(),
    siege = w.sieges[0],
    s = w.settlements[0],
    d = w.armies.find((a) => a.id === siege.defender)!;
  s.shortageDays = 10;
  const first = w.people[d.members[0]],
    health = first.health;
  for (let i = 0; i < 15; i++) {
    w.day++;
    campaignDay(w);
  }
  expect(first.health).toBeLessThan(health);
  expect(siege.status).toBe('captured');
  expect(first.alive).toBe(true);
  expect(first.profession).not.toBe('soldier');
  const other = siegeGame();
  expect(command(other, { type: 'lift_siege' }).ok).toBe(true);
  expect(other.sieges[0].status).toBe('lifted');
  expect(route(other, 0, 1).length).toBeGreaterThan(0);
});
it('training uses time and money; spells require learned skill, range, side and mana', () => {
  const w = game(),
    p = w.player!,
    hero = w.people[p.person];
  hero.potential = 2;
  const day = w.day,
    gold = p.gold;
  expect(command(w, { type: 'study', school: 'elemental' }).ok).toBe(true);
  expect(w.day).toBe(day + 3);
  expect(p.gold).toBe(gold - 60);
  command(w, { type: 'battle' });
  const caster = w.battle!.fighters.find((f) => f.person === p.person)!,
    enemy = w.battle!.fighters.find((f) => f.side === 'enemy')!;
  reject(w, { type: 'spell', school: 'elemental', target: caster.id });
  reject(w, { type: 'spell', school: 'elemental', target: enemy.id });
  enemy.x = caster.x + 2;
  enemy.y = caster.y;
  const health = enemy.hp,
    mana = hero.mana;
  expect(command(w, { type: 'spell', school: 'elemental', target: enemy.id }).ok).toBe(true);
  expect(hero.mana).toBe(mana - 10);
  expect(enemy.hp).toBeLessThan(health);
  hero.mana = 0;
  reject(w, { type: 'spell', school: 'elemental', target: enemy.id });
});
it('old snapshots acquire stable defaults and a complete v4 world continues identically', () => {
  const w = siegeGame(),
    raw = JSON.parse(JSON.stringify(w));
  raw.version = 3;
  delete raw.estates;
  delete raw.sieges;
  delete raw.treaties;
  delete raw.religions;
  delete raw.organizations;
  for (const p of raw.people) {
    delete p.potential;
    delete p.mana;
    delete p.faith;
  }
  const migrated = decode(encode(raw));
  expect(migrated.version).toBe(4);
  expect(migrated.rng).toBe(w.rng);
  expect(migrated.religions).toHaveLength(3);
  const copy = decode(encode(w));
  for (let i = 0; i < 20; i++) {
    tickDay(w);
    tickDay(copy);
  }
  expect(copy).toEqual(w);
});
it('API exposes, validates and saves the integrated economy and learning actions', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'final-api-')),
    store = new FileStorage(dir),
    w = game();
  w.player!.gold = 1000;
  w.people[w.player!.person].potential = 2;
  await store.save(0, w);
  const app = await createApp(store, { timers: false });
  try {
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/api/command',
          payload: { type: 'buy_estate', kind: 'farm' },
        })
      ).statusCode,
    ).toBe(200);
    expect(
      (
        await app.inject({
          method: 'POST',
          url: '/api/command',
          payload: { type: 'study', school: 'healing' },
        })
      ).statusCode,
    ).toBe(200);
    const current = (await app.inject('/api/world')).json();
    expect(current.estates).toHaveLength(1);
    expect(current.player.skills.healing).toBe(1);
    expect(current.hero.potential).toBe(2);
    const saved = await store.load(0);
    expect(saved.estates).toEqual(current.estates);
    expect(saved.day).toBe(current.day);
  } finally {
    await app.close();
    await rm(dir, { recursive: true, force: true });
  }
});
it('never lets a historical title replace appointment checks', async () => {
  const { applyProposal, event } = await import('@living-world/simulation');
  const w = game(),
    p = w.player!;
  const fact = event(w, 'service', 'test', [`person:${p.person}`], true);
  expect(
    applyProposal(w, {
      type: 'create_historical_title',
      person: p.person,
      title: 'Правитель',
      evidence: [fact.id],
    }).ok,
  ).toBe(true);
  reject(w, { type: 'law', inheritance: 'equal', tolerance: false });
  reject(w, { type: 'seek_crown' });
});
it('ships industrial goods from actual stocks with exactly conserved payment', () => {
  const w = game();
  w.day = 3;
  for (const s of w.settlements) {
    s.monsters = 0;
    s.stocks.grain = s.population * 8;
    s.stocks.iron = 10;
  }
  const source = w.settlements[0],
    dest = w.settlements[1];
  source.stocks.iron = 100;
  dest.stocks.iron = 0;
  const money = w.settlements.reduce((n, s) => n + s.treasury, 0),
    iron = w.settlements.reduce((n, s) => n + s.stocks.iron, 0);
  logistics(w);
  const shipments = w.caravans.filter((c) => c.good === 'iron');
  expect(shipments.length).toBeGreaterThan(0);
  expect(
    w.settlements.reduce((n, s) => n + s.stocks.iron, 0) +
      shipments.reduce((n, c) => n + c.amount, 0),
  ).toBeCloseTo(iron);
  expect(w.settlements.reduce((n, s) => n + s.treasury, 0)).toBeCloseTo(money);
});
it('founds a village by moving identities and transferring resources instead of spawning settlers', () => {
  const w = game();
  w.states[0].ruler = w.player!.person;
  const people = w.people.length,
    pop = w.settlements.reduce((n, s) => n + s.population, 0),
    grain = w.settlements.reduce((n, s) => n + s.stocks.grain, 0);
  expect(command(w, { type: 'found_settlement', name: 'Новый очаг' }).ok).toBe(true);
  const town = w.settlements.at(-1)!;
  expect(town.population).toBe(10);
  expect(w.people.length).toBe(people);
  expect(w.settlements.reduce((n, s) => n + s.population, 0)).toBe(pop);
  expect(w.settlements.reduce((n, s) => n + s.stocks.grain, 0)).toBe(grain);
  expect(town.residents.every((id) => w.people[id].settlement === town.id)).toBe(true);
  expect(route(w, 0, town.id)).toEqual([0, town.id]);
});
it('escorts an existing caravan along the same road and pays the held reward exactly once', async () => {
  const { makeJourney } = await import('@living-world/simulation');
  const w = game();
  command(w, { type: 'recruit', count: 3 });
  w.caravans.push({
    id: 'escort-test',
    from: 0,
    to: 1,
    good: 'iron',
    amount: 10,
    paid: 80,
    status: 'traveling',
    journey: makeJourney(w, [0, 1]),
  });
  const gold = w.player!.gold,
    money = w.settlements[0].treasury;
  expect(command(w, { type: 'escort', caravan: 'escort-test' }).ok).toBe(true);
  expect(w.settlements[0].treasury).toBe(money - 30);
  expect(w.player!.gold).toBe(gold);
  w.settlements.forEach((s) => (s.monsters = 0));
  for (let i = 0; i < 10 && w.player!.journey; i++) tickDay(w);
  expect(w.player!.gold).toBe(gold + 30);
  expect(w.people[w.player!.person].settlement).toBe(1);
  expect(w.player!.escort).toBeUndefined();
  tickDay(w);
  expect(w.player!.gold).toBe(gold + 30);
});
it('an unfed workshop cannot allocate old weapons as new private production', () => {
  const w = game();
  w.player!.gold = 500;
  expect(command(w, { type: 'buy_estate', kind: 'workshop' }).ok).toBe(true);
  const e = w.estates[0],
    s = w.settlements[0];
  s.stocks.iron = 0;
  s.workers.miner = 0;
  const money = e.treasury;
  economy(w);
  expect(e.stocks.weapons).toBe(0);
  expect(e.treasury).toBe(money);
});
it('mixed classes keep identities and lose only the horses of dead cavalry', () => {
  const w = game();
  command(w, { type: 'recruit', count: 3 });
  w.player!.inventory.horses = 1;
  const a = w.armies.find((a) => a.id === w.player!.army)!,
    id = a.members[0];
  expect(command(w, { type: 'train_soldier', person: id, unitClass: 'cavalry' }).ok).toBe(true);
  expect(a.members).toContain(id);
  expect(a.mounts).toBe(1);
  command(w, { type: 'battle' });
  const fighter = w.battle!.fighters.find((f) => f.person === id)!;
  expect(fighter.unitClass).toBe('cavalry');
  fighter.hp = 0;
  command(w, { type: 'retreat' });
  expect(a.mounts).toBe(0);
  expect(a.members).toHaveLength(2);
  command(w, { type: 'leave' });
  command(w, { type: 'enter' });
  command(w, { type: 'dismiss' });
  expect(w.player!.inventory.horses).toBe(0);
});
it('mage recruitment requires potential and a living teacher, then spends personal mana in battle', () => {
  const w = game();
  command(w, { type: 'recruit', count: 3 });
  const a = w.armies.find((a) => a.id === w.player!.army)!,
    id = a.members[0];
  w.people[id].potential = 0;
  reject(w, { type: 'train_soldier', person: id, unitClass: 'mages' });
  w.people[id].potential = 8;
  w.player!.inventory.grain = 100;
  expect(command(w, { type: 'train_soldier', person: id, unitClass: 'mages' }).ok).toBe(true);
  command(w, { type: 'battle' });
  const f = w.battle!.fighters.find((f) => f.person === id)!,
    enemy = w.battle!.fighters.find((f) => f.side === 'enemy')!;
  enemy.x = f.x + 3;
  enemy.y = f.y;
  const mana = w.people[id].mana;
  stepBattle(w);
  expect(w.people[id].mana).toBeLessThan(mana);
});
it('distinct creature populations produce their real combatants and persist losses', () => {
  const w = game(),
    s = w.settlements[0];
  s.monsterKind = 'troll';
  s.monsters = 2;
  command(w, { type: 'battle' });
  const enemies = w.battle!.fighters.filter((f) => f.side === 'enemy');
  expect(enemies).toHaveLength(2);
  expect(enemies.every((f) => f.maxHp === 140)).toBe(true);
  enemies[0].hp = 0;
  command(w, { type: 'retreat' });
  expect(s.monsters).toBe(1);
});
it('ecological migration preserves the total population except explicit reproduction', async () => {
  const { ecologyDay } = await import('@living-world/simulation');
  const w = game();
  for (const s of w.settlements) s.monsters = 0;
  w.settlements[0].monsterKind = 'troll';
  w.settlements[0].monsters = 4;
  for (let i = 1; i <= 40; i++) {
    w.day = i * 30;
    ecologyDay(w);
  }
  expect(w.settlements.filter((s) => s.monsters > 0).length).toBeGreaterThan(1);
  expect(w.settlements.filter((s) => s.monsters > 0).every((s) => s.monsterKind === 'troll')).toBe(
    true,
  );
});

it('siege engineering spends physical materials, rejects duplicate excess, and increases pressure', () => {
  const w = siegeGame(),
    p = w.player!,
    siege = w.sieges[0];
  p.inventory.wood = 90;
  p.inventory.iron = 30;
  p.inventory.tools = 15;
  for (let i = 0; i < 3; i++) expect(command(w, { type: 'siege_engine' }).ok).toBe(true);
  expect(p.inventory.wood).toBe(0);
  expect(p.inventory.iron).toBe(0);
  expect(p.inventory.tools).toBe(0);
  const saved = JSON.stringify(w);
  expect(command(w, { type: 'siege_engine' }).ok).toBe(false);
  expect(JSON.stringify(w)).toBe(saved);
  campaignDay(w);
  expect(siege.pressure).toBe(4);
});
