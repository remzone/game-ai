import { expect, it } from 'vitest';
import { command, createOrganicWorld, planSettlement, type World } from '@living-world/simulation';
import { worldView } from '../apps/server/src/app.js';
import { decode, encode } from '../apps/server/src/storage.js';

const begin = (w: World, birthplace = 0) =>
  command(w, {
    type: 'create_player',
    biography: {
      name: 'Лиора',
      race: 'Human',
      sex: 'female',
      birthplace,
      origin: 'merchants',
      childhood: 'fields',
      youth: 'militia',
      training: 'trader',
      turningPoint: 'rescue',
      reason: 'knowledge',
    },
  });

it('gives seats of power, independently situated ports, mining towns and villages different actual places', () => {
  const w = createOrganicWorld('ashen-crown', 60);
  const capital = planSettlement(w, 0)!,
    mountain = planSettlement(w, 19)!,
    village = planSettlement(w, 6)!,
    port = planSettlement(w, 3)!;
  expect(capital.districts.some((d) => d.kind === 'court')).toBe(true);
  expect(mountain.districts.some((d) => d.kind === 'mine')).toBe(true);
  expect(mountain.districts.some((d) => d.kind === 'wharf')).toBe(false);
  expect(port.water).toBe('sea');
  expect(port.districts.some((d) => d.kind === 'wharf')).toBe(true);
  expect(village.districts.some((d) => d.kind === 'wood')).toBe(true);
  expect(village.districts.some((d) => d.kind === 'court' || d.kind === 'market')).toBe(false);
  expect(capital.districts.length).toBeGreaterThan(village.districts.length);
  expect(mountain.districts.find((d) => d.id === 'square')?.at).not.toEqual(
    village.districts.find((d) => d.id === 'square')?.at,
  );
});

it('exposes an inspectable local plan only after entering and points its NPCs to real dialogue', () => {
  const w = createOrganicWorld('ashen-crown', 60);
  expect(begin(w).ok).toBe(true);
  expect(worldView(w).townPlan).toBeUndefined();
  expect(command(w, { type: 'enter' }).ok).toBe(true);
  const plan = worldView(w).townPlan!;
  expect(plan?.title).toBe(w.settlements[0].name);
  expect(plan.settlement).toBe(w.people[w.player!.person].settlement);
  const residents = plan.districts.flatMap((d) => d.people);
  expect(new Set(residents.map((p) => p.id)).size).toBe(residents.length);
  const ruler = plan.districts.find((d) => d.kind === 'court')?.people[0];
  expect(ruler?.id).toBe(w.states[w.settlements[0].state].ruler);
  for (const p of residents) {
    expect(w.people[p.id].settlement).toEqual(0);
    expect(command(w, { type: 'talk', person: p.id }).ok).toBe(true);
    expect(w.npcs[p.id].name).toEqual(p.name);
  }
  expect(command(w, { type: 'leave' }).ok).toBe(true);
  expect(worldView(w).townPlan).toBeUndefined();
});

it('keeps building geography and sight lines stable across save/load and reads actual historical status', () => {
  const w = createOrganicWorld('ashen-crown', 60),
    site = w.atlasWorld!.sites[0],
    town = w.settlements[site.settlement];
  const before = w.rng;
  const original = planSettlement(w, town.id)!;
  expect(w.rng).toBe(before);
  expect(original.lore.some((e) => e.title === site.name && e.text === site.lore)).toBe(true);
  site.status = 'ruined';
  town.structuralDamage = 2;
  const wounded = planSettlement(w, town.id)!;
  expect(wounded.districts.find((d) => d.site?.id === site.id)?.site?.status).toBe('ruined');
  expect(wounded.damage).toBe(2);
  expect(wounded.districts.map((d) => [d.id, d.at])).toEqual(
    original.districts.map((d) => [d.id, d.at]),
  );
  expect(planSettlement(decode(encode(w)), town.id)).toEqual(wounded);
});
