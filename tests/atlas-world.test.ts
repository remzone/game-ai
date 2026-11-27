import { expect, it } from 'vitest';
import {
  createAtlasWorld,
  createOrganicWorld,
  createWorld,
  landmarkFits,
  LANDMARK_CATALOG,
} from '@living-world/simulation';
import { decode, encode } from '../apps/server/src/storage.js';

it('makes biome/port-aware landmarks and real, bounded history references across different seeds and plan branches', () => {
  const scenarioIds = new Set<string>();
  const landmarks = new Set<string>();
  for (let i = 0; i < 14; i++) {
    const w = createOrganicWorld('atlas-world-' + i, 12);
    const rng = w.rng;
    const wars = structuredClone(w.wars),
      treaties = structuredClone(w.treaties);
    const branches = [0, 1, 2].map((n) => createAtlasWorld(w, n)!);
    expect(branches[0]).toEqual(w.atlasWorld);
    expect(new Set(branches.map((p) => p.scenario.id)).size).toBe(3);
    expect(new Set(branches.map((p) => p.sites.map((s) => s.settlement).join(','))).size).toBe(3);
    expect(w.rng).toBe(rng);
    expect(w.wars).toEqual(wars);
    expect(w.treaties).toEqual(treaties);
    for (const plan of branches) {
      scenarioIds.add(plan.scenario.id);
      expect(plan.sites.length).toBeGreaterThanOrEqual(11);
      expect(plan.sites.length).toBeLessThanOrEqual(19);
      const ids = new Set(plan.sites.map((site) => site.id));
      expect(ids.size).toBe(plan.sites.length);
      expect(new Set(plan.sites.map((site) => site.settlement)).size).toBe(plan.sites.length);
      expect(new Set(plan.sites.map((site) => site.name)).size).toBe(plan.sites.length);
      for (const site of plan.sites) {
        landmarks.add(site.kind);
        expect(landmarkFits(w, site.settlement, site.kind, site.status)).toBe(true);
        expect(LANDMARK_CATALOG[site.kind].biomes).toContain(w.settlements[site.settlement].biome);
        expect(site.state).toBe(w.settlements[site.settlement].state);
      }
      const statuses = plan.sites.filter((s) => s.kind === 'wizard_tower').map((s) => s.status);
      expect(statuses).toContain('standing');
      expect(statuses).toContain('ruined');
      const focal = plan.sites.find((s) => s.id === plan.scenario.focalSite)!;
      expect(focal).toBeDefined();
      expect(plan.scenario.roles.filter((s) => s.role === 'guardian').map((s) => s.state)).toEqual([
        focal.state,
      ]);
      expect(plan.scenario.roles.filter((s) => s.role === 'claimant')).toHaveLength(2);
      expect(plan.scenario.roles.map((r) => r.state)).toEqual(w.states.map((r) => r.id));
      expect(new Set(plan.history.map((e) => e.id)).size).toBe(plan.history.length);
      expect(plan.history.map((e) => e.year)).toEqual(
        [...plan.history].map((e) => e.year).sort((a, b) => a - b),
      );
      for (const event of plan.history) {
        expect(event.year).toBeLessThan(0);
        if (event.site !== undefined) expect(ids.has(event.site)).toBe(true);
        expect(event.states.every((id) => w.states[id]?.id === id)).toBe(true);
      }
      if (plan.scenario.id === 'academy-cinders') {
        expect(plan.scenario.trigger).toMatch(/Некромант/);
        expect(plan.sites.filter((s) => s.kind === 'academy')).toHaveLength(1);
        expect(focal.status).toBe('ruined');
        const { a, b, target } = plan.scenario.campaign!;
        expect(a).not.toBe(b);
        expect(plan.scenario.roles.find((s) => s.state === a)?.role).toBe('claimant');
        expect(plan.scenario.roles.find((s) => s.state === b)?.role).toBe('claimant');
        expect(w.settlements[target].state).toBe(b);
        expect(
          w.roads.some(
            (road) =>
              !road.blocked &&
              ((road.a === target && w.settlements[road.b].state === a) ||
                (road.b === target && w.settlements[road.a].state === a)),
          ),
        ).toBe(true);
      } else expect(plan.scenario.campaign).toBeUndefined();
    }
  }
  expect(scenarioIds.size).toBe(5);
  expect(landmarks.size).toBe(10);
});
it('preserves atlas decisions in snapshots and leaves legacy worlds alone', () => {
  const w = createOrganicWorld('archive-atlas', 12);
  w.atlasWorld = createAtlasWorld(w, 2);
  expect(decode(encode(w)).atlasWorld).toEqual(w.atlasWorld);
  expect(createOrganicWorld('archive-atlas', 12).atlasWorld).toEqual(createAtlasWorld(w, 0));
  const old = createWorld('archive-atlas', 12);
  expect(createAtlasWorld(old)).toBeUndefined();
  expect(decode(encode(old)).atlasWorld).toBeUndefined();
});
