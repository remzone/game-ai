import { describe, it, expect } from 'vitest';
import {
  createWorld,
  command,
  economy,
  tickDay,
  death,
  type World,
} from '@living-world/simulation';
import { localGovernance } from '../packages/simulation/src/governance.js';
import { decode, encode } from '../apps/server/src/storage.js';

function game() {
  const w = createWorld('council', 60);
  command(w, {
    type: 'create_player',
    biography: {
      name: 'Управляющий',
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
  command(w, { type: 'recruit', count: 5 });
  return w;
}
function appoint(w: World) {
  w.player!.reputation['settlement:0'] = 60;
  expect(command(w, { type: 'petition' }).ok).toBe(true);
  expect(command(w, { type: 'seek_office' }).ok).toBe(true);
}
function rejectedWithoutMutation(w: World, c: unknown) {
  const before = JSON.stringify(w);
  expect(command(w, c).ok).toBe(false);
  expect(JSON.stringify(w)).toBe(before);
}
describe('Local governance', () => {
  it('requires earned recognition and a stable settlement; titles alone grant no authority', () => {
    const w = game();
    rejectedWithoutMutation(w, { type: 'local_tax', value: 0.2 });
    rejectedWithoutMutation(w, { type: 'public_build' });
    rejectedWithoutMutation(w, { type: 'seek_office' });
    w.player!.reputation['settlement:0'] = 60;
    rejectedWithoutMutation(w, { type: 'seek_office' });
    command(w, { type: 'petition' });
    w.settlements[0].shortageDays = 3;
    rejectedWithoutMutation(w, { type: 'seek_office' });
    w.settlements[0].shortageDays = 0;
    expect(command(w, { type: 'seek_office' }).ok).toBe(true);
    expect(w.settlements[0].governance.steward).toBe(w.player!.person);
    rejectedWithoutMutation(w, { type: 'seek_office' });
    const title = w.player!.title;
    command(w, { type: 'petition' });
    expect(w.player!.title).toBe(title);
  });
  it('routes the surcharge to local public funds and high taxes erode trust', () => {
    const w = game();
    appoint(w);
    const low = structuredClone(w);
    command(w, { type: 'local_tax', value: 0.2 });
    const gold = w.player!.gold;
    economy(w);
    economy(low);
    expect(w.settlements[0].treasury).toBeGreaterThan(low.settlements[0].treasury);
    expect(w.states[0].treasury).toBe(low.states[0].treasury);
    expect(w.regions[0].treasury).toBe(low.regions[0].treasury);
    expect(w.player!.gold).toBe(gold);
    expect(w.settlements[0].loyalty).toBeLessThan(low.settlements[0].loyalty);
    rejectedWithoutMutation(w, { type: 'local_tax', value: 0.3 });
  });
  it('pays real civilian workers, consumes public materials and improves later harvests', () => {
    const w = game();
    appoint(w);
    const s = w.settlements[0],
      before = structuredClone(w);
    const wealth = w.people.reduce((n, p) => n + p.wealth, 0);
    expect(command(w, { type: 'public_build' }).ok).toBe(true);
    expect(s.treasury).toBe(before.settlements[0].treasury - 200);
    expect(s.stocks.wood).toBe(before.settlements[0].stocks.wood - 100);
    expect(s.stocks.stone).toBe(before.settlements[0].stocks.stone - 50);
    expect(w.player!.gold).toBe(before.player!.gold);
    expect(w.people.reduce((n, p) => n + p.wealth, 0)).toBeCloseTo(wealth + 200);
    economy(w);
    economy(before);
    expect(s.stocks.grain).toBeGreaterThan(before.settlements[0].stocks.grain);
    rejectedWithoutMutation(w, { type: 'public_build' });
  });
  it('rejects construction atomically if no civilian workers remain', () => {
    const w = game();
    appoint(w);
    const s = w.settlements[0];
    for (const id of [...s.residents])
      if (w.people[id].profession !== 'soldier') death(w, w.people[id], 'test');
    rejectedWithoutMutation(w, { type: 'public_build' });
  });
  it('relief transfers owned grain, rewards only an actual food deficit and prevents reward farming', () => {
    const w = game(),
      s = w.settlements[0],
      p = w.player!;
    s.stocks.grain = 0;
    p.inventory.grain = 500;
    const rep = p.reputation['settlement:0'],
      total = s.stocks.grain + p.inventory.grain;
    expect(command(w, { type: 'relief', quantity: 100 }).ok).toBe(true);
    expect(s.stocks.grain + p.inventory.grain).toBe(total);
    expect(p.reputation['settlement:0']).toBe(rep + 5);
    command(w, { type: 'relief', quantity: 100 });
    expect(p.reputation['settlement:0']).toBe(rep + 5);
    rejectedWithoutMutation(w, { type: 'relief', quantity: 500 });
  });
  it('sustained excessive taxes lead to recall and remove authority without game over', () => {
    const w = game();
    appoint(w);
    const s = w.settlements[0];
    s.loyalty = 26;
    w.states[0].tax = 0.6;
    command(w, { type: 'local_tax', value: 0.2 });
    for (let i = 0; i < 25 && s.governance.steward !== null; i++) {
      w.day++;
      s.stocks.grain = 10000;
      economy(w);
      localGovernance(w);
    }
    expect(s.governance.steward).toBeNull();
    expect(s.governance.localTax).toBe(0);
    expect(s.governance.eligibleDay).toBe(w.day + 30);
    expect(w.player!.gameOver).toBe(false);
    expect(w.npcs[w.player!.person].titles).not.toContain(`Управляющий ${s.name}`);
    expect(w.events.some((e) => e.type === 'office_revoked')).toBe(true);
    rejectedWithoutMutation(w, { type: 'local_tax', value: 0 });
    s.loyalty = 80;
    rejectedWithoutMutation(w, { type: 'seek_office' });
  });
  it('resets a protest when trust recovers and ends the personal mandate on death', () => {
    const w = game();
    appoint(w);
    const s = w.settlements[0];
    s.loyalty = 20;
    for (let i = 0; i < 13; i++) {
      w.day++;
      localGovernance(w);
    }
    expect(s.governance.steward).toBe(w.player!.person);
    s.loyalty = 26;
    w.day++;
    localGovernance(w);
    expect(s.governance.unrestDays).toBe(0);
    death(w, w.people[w.player!.person], 'test');
    localGovernance(w);
    expect(s.governance.steward).toBeNull();
  });
  it('migrates old saves without granting authority and keeps current mandates deterministic', () => {
    const w = game();
    appoint(w);
    for (const version of [1, 2]) {
      const legacy = JSON.parse(JSON.stringify(w));
      legacy.version = version;
      for (const s of legacy.settlements) delete s.governance;
      const restored = decode(encode(legacy));
      expect(restored.version).toBe(3);
      expect(restored.rng).toBe(w.rng);
      expect(restored.settlements.every((s) => s.governance.steward === null)).toBe(true);
    }
    command(w, { type: 'local_tax', value: 0.1 });
    const restored = decode(encode(w));
    for (let i = 0; i < 15; i++) {
      tickDay(w);
      tickDay(restored);
    }
    expect(restored).toEqual(w);
  });
  it('resignation removes the office and applies the same cooldown', () => {
    const w = game();
    appoint(w);
    command(w, { type: 'local_tax', value: 0.2 });
    expect(command(w, { type: 'resign_office' }).ok).toBe(true);
    expect(w.settlements[0].governance.localTax).toBe(0);
    rejectedWithoutMutation(w, { type: 'public_build' });
    rejectedWithoutMutation(w, { type: 'resign_office' });
  });
});
