import { expect, it } from 'vitest';
import {
  createOrganicWorld,
  createWorld,
  containsPoint,
  command,
  fromEngineCoordinates,
  landLink,
  STARTING_CAPITAL_NAMES,
  startingCapitalNames,
  tickDay,
} from '@living-world/simulation';
import { decode, encode } from '../apps/server/src/storage.js';

function reachable(start: number, graph: number[][], allowed: (id: number) => boolean) {
  const seen = new Set([start]);
  const todo = [start];
  for (let i = 0; i < todo.length; i++) {
    for (const next of graph[todo[i]]) {
      if (allowed(next) && !seen.has(next)) {
        seen.add(next);
        todo.push(next);
      }
    }
  }
  return seen;
}

it.each(['ashen-crown', 'delta', 'misty-coast'])(
  'has a contiguous asymmetric continent with physically connected realms: %s',
  (seed) => {
    const w = createOrganicWorld(seed, 22);
    const g = w.geography!;
    const graph = w.settlements.map(() => [] as number[]);
    for (const road of w.roads) {
      graph[road.a].push(road.b);
      graph[road.b].push(road.a);
      expect(landLink(g.cells[road.a].center, g.cells[road.b].center, g.coast)).toBe(true);
    }
    expect(reachable(0, graph, () => true).size).toBe(300);
    expect(w.people.length).toBe(6600);
    expect(w.regions.length).toBe(50);
    expect(g.rivers).toHaveLength(3);
    expect(g.coast.every(([x, y]) => x > 0 && x < g.width && y > 0 && y < g.height)).toBe(true);
    expect(g.cells.filter((c) => c.port).length).toBeGreaterThan(5);
    expect(g.cells.every((c) => c.polygon.length > 2 && containsPoint(c.center, g.coast))).toBe(
      true,
    );
    expect(new Set(w.settlements.map((s) => s.name)).size).toBe(300);
    expect(w.states.map((s) => s.capital)).toEqual(w.states.map((s) => s.id * 30));
    const visibleCapitals = w.states.map((s) => w.settlements[s.capital].name);
    expect(visibleCapitals).toEqual(startingCapitalNames(seed));
    if (seed === 'ashen-crown') expect(visibleCapitals).toEqual(STARTING_CAPITAL_NAMES);
    else expect(visibleCapitals).not.toEqual(STARTING_CAPITAL_NAMES);
    const sizes = w.states.map((s) => {
      const inhabitants = w.settlements.filter((t) => t.state === s.id);
      expect(reachable(s.capital, graph, (id) => w.settlements[id].state === s.id).size).toBe(
        inhabitants.length,
      );
      return inhabitants.length;
    });
    expect(Math.max(...sizes) / Math.min(...sizes)).toBeGreaterThan(1.6);
    expect(new Set(w.states.map((s) => s.tax)).size).toBeGreaterThan(5);
    expect(new Set(w.states.map((s) => s.treasury)).size).toBeGreaterThan(5);
    expect(w.treaties.filter((t) => t.type === 'trade' && t.until > 0)).toHaveLength(3);
    const mountains = w.settlements.filter((s) => s.biome === 'mountain');
    const fields = w.settlements.filter((s) => s.biome === 'plains');
    const ratio = (list: typeof mountains) =>
      list.reduce((total, s) => total + s.stocks.grain / s.population, 0) / list.length;
    expect(ratio(fields)).toBeGreaterThan(ratio(mountains) * 2);
  },
);

it('persists the generated geography while legacy saves remain unmodified', () => {
  const a = createOrganicWorld('peat', 12);
  const b = createOrganicWorld('peat', 12);
  expect(a.geography).toEqual(b.geography);
  expect(a.geography?.coast).not.toEqual(createOrganicWorld('hollow', 12).geography?.coast);
  expect(decode(encode(a)).geography).toEqual(a.geography);
  const legacy = createWorld('peat', 12);
  expect(decode(encode(legacy)).geography).toBeUndefined();
  expect(decode(encode(legacy)).settlements[0].name).toBe('Град 1-1');
});

it('uses working trade shipments between actual settlements after a new game starts', () => {
  const w = createOrganicWorld('ashen-crown', 22);
  for (let day = 0; day < 16; day++) tickDay(w);
  const outbound = w.caravans.filter(
    (c) => w.settlements[c.from].state !== w.settlements[c.to].state,
  );
  expect(outbound.length).toBeGreaterThan(0);
  expect(outbound.some((c) => c.status === 'delivered' && c.amount > 0 && c.paid > 0)).toBe(true);
});

it('founds a real village on its realm’s land and moves residents rather than creating them', () => {
  const w = createOrganicWorld('coastal-founder');
  const g = w.geography!;
  const place = w.settlements[0];
  const population = w.people.length;

  place.stocks.wood = 250;
  place.stocks.stone = 100;
  place.treasury = 800;
  place.stocks.grain = 500;
  expect(
    command(w, {
      type: 'create_player',
      biography: {
        name: 'Мира',
        race: 'Human',
        sex: 'female',
        birthplace: 0,
        origin: 'merchants',
        childhood: 'books',
        youth: 'caravan',
        training: 'trader',
        turningPoint: 'inheritance',
        reason: 'knowledge',
      },
    }).ok,
  ).toBe(true);
  const before = new Set(place.residents);
  w.states[place.state].ruler = w.player!.person;
  expect(command(w, { type: 'enter' }).ok).toBe(true);
  expect(command(w, { type: 'found_settlement', name: 'Сторожевой Луг' }).ok).toBe(true);
  const colony = w.settlements.at(-1)!;
  const coords = fromEngineCoordinates(w, colony.x, colony.y);
  expect(containsPoint(coords, g.coast)).toBe(true);
  expect(landLink(g.cells[place.id].center, coords, g.coast)).toBe(true);
  expect(colony.state).toBe(place.state);
  expect(colony.residents).toHaveLength(10);
  expect(colony.residents.every((id) => before.has(id))).toBe(true);
  expect(w.people.length).toBe(population + 3);
});
