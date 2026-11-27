import { expect, it } from 'vitest';
import {
  command,
  createOrganicWorld,
  createWorld,
  mapProjection,
  tickDay,
  WORLD_CHART_PRICE,
  type World,
} from '@living-world/simulation';
import { decode, encode } from '../apps/server/src/storage.js';
import { worldView } from '../apps/server/src/app.js';

const biography = {
  name: 'Следопыт',
  race: 'Human',
  sex: 'female',
  birthplace: 0,
  origin: 'peasants',
  childhood: 'fields',
  youth: 'militia',
  training: 'warrior',
  turningPoint: 'rescue',
  reason: 'knowledge',
};
const begin = (w: World) => {
  expect(command(w, { type: 'create_player', biography }).ok).toBe(true);
  return w;
};

it('hides unknown travel targets and remembers discovered territory through a save', () => {
  const w = begin(createOrganicWorld('ashen-crown', 12));
  const start = mapProjection(w)!;
  expect(start.chart).toBe(false);
  expect(start.known).toContain(0);
  expect(start.known.length).toBeLessThan(w.settlements.length / 5);
  const far = w.settlements.find((s) => !start.known.includes(s.id))!;
  expect(command(w, { type: 'travel', settlement: far.id }).ok).toBe(false);
  expect(w.player!.journey).toBeUndefined();
  const target = w.roads.find(({ a, b }) => a === 0 || b === 0)!;
  const next = target.a === 0 ? target.b : target.a;
  expect(command(w, { type: 'travel', settlement: next })).toEqual({ ok: true });
  while (w.player!.journey) tickDay(w);
  const surveyed = mapProjection(w)!;
  expect(w.people[w.player!.person].settlement).toBe(next);
  expect(surveyed.known).toEqual(expect.arrayContaining(start.known));
  expect(surveyed.known.length).toBeGreaterThan(start.known.length);
  const restored = decode(encode(w));
  expect(mapProjection(restored)).toEqual(surveyed);
  expect(worldView(restored).mapKnowledge).toEqual(surveyed);
});

it('sells the complete survey once, without turning remote armies into live sightings', () => {
  const w = begin(createOrganicWorld('ashen-crown', 12));
  const p = w.player!;
  const gold = p.gold;
  const cash = w.settlements[0].treasury;
  expect(mapProjection(w)!.chartForSale).toBe(true);
  p.gold = 0;
  expect(command(w, { type: 'buy_world_chart' }).ok).toBe(false);
  expect(w.settlements[0].treasury).toBe(cash);
  p.gold = gold;
  expect(command(w, { type: 'buy_world_chart' }).ok).toBe(true);
  const projection = mapProjection(w)!;
  expect(p.gold).toBe(gold - WORLD_CHART_PRICE);
  expect(w.settlements[0].treasury).toBe(cash + WORLD_CHART_PRICE);
  expect(projection.known.length).toBe(w.settlements.length);
  expect(projection.visible.length).toBeLessThan(projection.known.length / 5);
  expect(command(w, { type: 'buy_world_chart' }).ok).toBe(false);
  expect(p.gold).toBe(gold - WORLD_CHART_PRICE);
  expect(mapProjection(decode(encode(w)))).toEqual(projection);
});

it('leaves old grid worlds usable and maps old continental saves from visited places', () => {
  const old = begin(createWorld('old-map', 12));
  expect(mapProjection(old)).toBeUndefined();
  expect(command(old, { type: 'buy_world_chart' }).ok).toBe(false);
  const organic = begin(createOrganicWorld('older-continent', 12));
  delete organic.player!.mapKnowledge;
  organic.player!.visited.push(60);
  expect(mapProjection(decode(encode(organic)))?.known).toContain(60);
});
