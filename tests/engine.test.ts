import { describe, it, expect } from 'vitest';
import {
  createWorld,
  tickDay,
  command,
  logistics,
  makeJourney,
  route,
  death,
  politics,
  stepBattle,
  applyProposal,
  economy,
  quests,
  demography,
  type World,
} from '@living-world/simulation';
const bio = {
  name: 'Рем',
  race: 'Human',
  sex: 'male',
  birthplace: 0,
  origin: 'peasants',
  childhood: 'fields',
  youth: 'militia',
  training: 'warrior',
  turningPoint: 'rescue',
  reason: 'fortune',
};
export function game() {
  const w = createWorld('test', 30);
  expect(command(w, { type: 'create_player', biography: bio }).ok).toBe(true);
  return w;
}
describe('World identity and determinism', () => {
  it('replays seed, geography and ticks independently of serialization', () => {
    const a = createWorld('test', 12),
      b = createWorld('test', 12);
    expect(a).toEqual(b);
    for (let d = 0; d < 35; d++) tickDay(a);
    let c = JSON.parse(JSON.stringify(b));
    for (let d = 0; d < 35; d++) tickDay(c);
    expect(a).toEqual(c);
    const other = createWorld('other', 12);
    expect(other.settlements.map((s) => [s.x, s.y, s.biome])).toEqual(
      a.settlements.map((s) => [s.x, s.y, s.biome]),
    );
    expect(other.states.map((s) => s.name)).not.toEqual(a.states.map((s) => s.name));
  });
  it('keeps real people, family links and correct workforce counters', () => {
    const w = game();
    for (let d = 0; d < 45; d++) tickDay(w);
    for (const s of w.settlements) {
      expect(s.population).toBe(s.residents.filter((id) => w.people[id].alive).length);
      expect(Object.values(s.workers).reduce((a, b) => a + b, 0)).toBe(s.population);
      for (const p of s.residents.map((id) => w.people[id])) {
        expect(p.settlement).toBe(s.id);
        for (const parent of p.parents) expect(w.people[parent].children).toContain(p.id);
      }
    }
  });
  it('applies mortality and succession to actual identities', () => {
    const w = createWorld('lineage', 20),
      state = w.states[0],
      old = state.ruler;
    death(w, w.people[old], 'test');
    politics(w);
    expect(state.ruler).not.toBe(old);
    expect(w.people[state.ruler].alive).toBe(true);
    expect(w.events.some((e) => e.type === 'succession')).toBe(true);
  });
});
describe('Causal economy and transport', () => {
  it('consumes stocks, raises prices and derives quests from shortage', () => {
    const w = createWorld('scarcity', 12),
      s = w.settlements[0];
    s.stocks.grain = 0;
    s.workers.farmer = 0;
    s.shortageDays = 2;
    economy(w);
    quests(w);
    expect(s.shortageDays).toBe(3);
    expect(s.prices.grain).toBeGreaterThan(2);
    expect(w.quests.some((q) => q.settlement === 0 && q.type === 'deliver')).toBe(true);
  });
  it('does not teleport shipments or deliver across a blocked road', () => {
    const w = createWorld('transport', 12);
    w.day = 1;
    w.settlements.forEach((s) => (s.monsters = 0));
    const path = route(w, 0, 1),
      journey = makeJourney(w, path);
    const stock = w.settlements[1].stocks.grain;
    w.caravans.push({
      id: 'test-shipment',
      from: 0,
      to: 1,
      good: 'grain',
      amount: 50,
      paid: 100,
      journey,
      status: 'traveling',
    });
    const edge = w.roads.find((r) => r.a === 0 && r.b === 1)!;
    edge.blocked = true;
    for (let d = 0; d < 10; d++) logistics(w);
    expect(w.settlements[1].stocks.grain).toBe(stock);
    edge.blocked = false;
    for (let d = 0; d < edge.days; d++) logistics(w);
    expect(w.settlements[1].stocks.grain).toBe(stock + 50);
    logistics(w);
    expect(w.settlements[1].stocks.grain).toBe(stock + 50);
  });
  it('removes goods at dispatch and transfers payment exactly once', () => {
    const w = createWorld('dispatch', 12);
    w.settlements.forEach((s) => {
      s.stocks.grain = s.population * 6;
      s.monsters = 0;
    });
    const source = w.settlements[0],
      dest = w.settlements[1];
    source.stocks.grain = 1000;
    dest.stocks.grain = 0;
    const beforeStock = source.stocks.grain,
      beforeMoney = source.treasury + dest.treasury;
    w.day = 3;
    logistics(w);
    const c = w.caravans.find((c) => c.to === 1)!;
    expect(c).toBeDefined();
    expect(source.stocks.grain).toBe(beforeStock - c.amount);
    expect(dest.stocks.grain).toBe(0);
    expect(source.treasury + dest.treasury).toBeCloseTo(beforeMoney);
  });
});
describe('Commands and real combat', () => {
  it('rejects invalid commands without mutation', () => {
    const w = game();
    const before = JSON.stringify(w);
    expect(command(w, { type: 'trade', side: 'buy', good: 'grain', quantity: -1 }).ok).toBe(false);
    expect(command(w, { type: 'travel', settlement: 9999 }).ok).toBe(false);
    expect(command(w, { type: 'tax', value: 0.1 }).ok).toBe(false);
    expect(JSON.stringify(w)).toBe(before);
  });
  it('recruits people out of production and returns the same survivors', () => {
    const w = game();
    command(w, { type: 'enter' });
    const before = structuredClone(w.settlements[0].workers);
    expect(command(w, { type: 'recruit', count: 5 }).ok).toBe(true);
    const army = w.armies.find((a) => a.id === w.player!.army)!,
      ids = [...army.members];
    expect(new Set(ids).size).toBe(5);
    expect(ids.every((id) => w.people[id].profession === 'soldier')).toBe(true);
    expect(w.settlements[0].workers.soldier).toBe(before.soldier + 5);
    expect(command(w, { type: 'dismiss' }).ok).toBe(true);
    expect(w.settlements[0].workers).toEqual(before);
    expect(ids.every((id) => w.people[id].alive)).toBe(true);
  });
  it('runs tactical movement and reconciles specific deaths to the population', () => {
    const w = game();
    command(w, { type: 'enter' });
    command(w, { type: 'recruit', count: 5 });
    const s = w.settlements[0];
    s.monsters = 3;
    expect(command(w, { type: 'battle' }).ok).toBe(true);
    const fighter = w.battle!.fighters.find(
      (f) => f.person !== undefined && f.person !== w.player!.person,
    )!;
    fighter.hp = 0;
    const before = s.population;
    for (let i = 0; i < 1200 && w.battle!.status === 'active'; i++) stepBattle(w, 0.25);
    expect(w.battle!.status).not.toBe('active');
    expect(w.people[fighter.person!].alive).toBe(false);
    expect(s.population).toBeLessThan(before);
    expect(w.armies.find((a) => a.id === w.player!.army)!.members).not.toContain(fighter.person);
  });
  it('moves along actual road legs and keeps army identities colocated', () => {
    const w = game();
    command(w, { type: 'enter' });
    command(w, { type: 'recruit', count: 5 });
    expect(command(w, { type: 'travel', settlement: 2 }).ok).toBe(true);
    expect(w.people[w.player!.person].settlement).toBe(0);
    for (let d = 0; d < 8 && w.player!.journey; d++) tickDay(w);
    expect(w.people[w.player!.person].settlement).toBe(2);
    const army = w.armies.find((a) => a.id === w.player!.army)!;
    expect(army.members.every((id) => w.people[id].settlement === 2)).toBe(true);
  });
});
describe('AI boundary', () => {
  it('rejects fabricated evidence and arbitrary resource mutations', () => {
    const w = createWorld('ai', 8),
      before = JSON.stringify(w);
    expect(applyProposal(w, { type: 'set_gold', amount: 100000 }).ok).toBe(false);
    expect(
      applyProposal(w, { type: 'chronicle', title: 'Lie', text: 'Lie', evidence: ['invented'] }).ok,
    ).toBe(false);
    expect(JSON.stringify(w)).toBe(before);
  });
  it('stores subjective narration separately without rewriting history', () => {
    const w = createWorld('ai', 8),
      facts = structuredClone(w.events);
    expect(
      applyProposal(w, {
        type: 'chronicle',
        title: 'Эпоха корон',
        text: 'Песнь о десяти державах.',
        evidence: [w.events[0].id],
      }).ok,
    ).toBe(true);
    expect(w.events).toEqual(facts);
    expect(w.chronicles[0].subjective).toBe(true);
  });
});
