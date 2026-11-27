import { expect, it } from 'vitest';
import {
  createOrganicWorld,
  planSettlement,
  seededLore,
  townCulture,
  type Ancestry,
} from '@living-world/simulation';
import { decode, encode } from '../apps/server/src/storage.js';

const human: Ancestry = [1, 0, 0, 0, 0, 0],
  dwarf: Ancestry = [0, 0, 0, 0, 1, 0];

it('draws houses from the resident population but political buildings from the current government', () => {
  const w = createOrganicWorld('ashen-crown', 60),
    s = w.settlements[0],
    state = w.states[s.state];
  s.residents.forEach((id, i) => {
    w.people[id].ancestry = i % 3 ? dwarf : human;
  });
  const before = planSettlement(w, 0)!;
  expect(before.culture.homes[0]).toBe('Dwarf');
  expect(new Set(before.culture.homes)).toEqual(new Set(['Human', 'Dwarf']));
  state.government = 'merchant_republic';
  state.emblem = 'moon';
  const changed = planSettlement(w, 0)!;
  expect(changed.culture.civic).toBe('guild');
  expect(changed.culture.emblem).toBe('moon');
  expect(changed.culture.homes).toEqual(before.culture.homes);
  expect(changed.districts.find((d) => d.kind === 'houses')?.at).toEqual(
    before.districts.find((d) => d.kind === 'houses')?.at,
  );
});

it('reflects actual religious communities and does not add public shrines for outlawed cults', () => {
  const w = createOrganicWorld('ashen-crown', 60),
    s = w.settlements[0],
    state = w.states[s.state];
  s.residents.forEach((id, i) => {
    w.people[id].faith = i % 3 ? 2 : 1;
  });
  const plan = planSettlement(w, 0)!;
  expect(plan.districts.filter((d) => d.kind === 'shrine').map((d) => d.faith?.style)).toEqual([
    'observatory',
    'memorial',
  ]);
  for (const district of plan.districts.filter((d) => d.kind === 'shrine')) {
    expect(district.people.every((p) => w.people[p.id].faith === district.faith?.id)).toBe(true);
  }
  state.laws.religion = 1;
  state.laws.tolerance = false;
  expect(
    planSettlement(w, 0)
      ?.districts.filter((d) => d.kind === 'shrine')
      .map((d) => d.faith?.id),
  ).toEqual([1]);
});

it('does not make an arriving army overwrite residential culture, and keeps residents stable on reload', () => {
  const w = createOrganicWorld('ashen-crown', 60),
    s = w.settlements[0];
  const before = planSettlement(w, 0)!;
  expect(before.districts.find((d) => d.kind === 'houses')?.people.length).toBe(2);
  const rng = w.rng;
  expect(planSettlement(decode(encode(w)), 0)).toEqual(before);
  expect(w.rng).toBe(rng);
  const visitor = w.people[w.settlements[30].residents[6]];
  visitor.profession = 'soldier';
  visitor.settlement = 0;
  visitor.faith = 2;
  visitor.ancestry = [0, 0, 1, 0, 0, 0];
  s.residents.push(visitor.id);
  expect(townCulture(w, s, before.seed)).toEqual(before.culture);
  expect(
    planSettlement(w, 0)
      ?.districts.flatMap((d) => d.people)
      .some((p) => p.id === visitor.id),
  ).toBe(false);
});

it('lets the local ritual determine the shrine design, even if the religion ID does not change', () => {
  const w = createOrganicWorld('ashen-crown', 60),
    s = w.settlements[0];
  w.worldLore = seededLore(w);
  s.residents.forEach((id) => {
    w.people[id].faith = 0;
  });
  expect(planSettlement(w, 0)?.culture.faiths[0]?.style).toBe('hearth');
  w.worldLore.faiths[0].rite = 'Перед восходом считают видимые звёзды и наблюдают небесный свод.';
  expect(planSettlement(w, 0)?.culture.faiths[0]?.style).toBe('observatory');
});
