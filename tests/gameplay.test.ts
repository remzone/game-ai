import { describe, it, expect } from 'vitest';
import {
  createWorld,
  command,
  tickDay,
  stepBattle,
  conversation,
  type World,
} from '@living-world/simulation';
import { encode, decode } from '../apps/server/src/storage.js';
function game(population = 30) {
  const w = createWorld('playable', population);
  expect(
    command(w, {
      type: 'create_player',
      biography: {
        name: 'Тест',
        race: 'Human',
        sex: 'male',
        birthplace: 0,
        origin: 'merchants',
        childhood: 'fields',
        youth: 'militia',
        training: 'warrior',
        turningPoint: 'rescue',
        reason: 'fortune',
      },
    }).ok,
  ).toBe(true);
  command(w, { type: 'enter' });
  return w;
}
const army = (w: World) => w.armies.find((a) => a.id === w.player!.army)!;
describe('Complete player loops', () => {
  it('keeps the reward after a hunt, later ticks and save/load, and pays only once', () => {
    let w = game();
    const q = w.quests.find((q) => q.type === 'hunt' && q.settlement === 0)!;
    expect(command(w, { type: 'accept_quest', quest: q.id }).ok).toBe(true);
    command(w, { type: 'battle' });
    for (const f of w.battle!.fighters) if (f.side === 'enemy') f.hp = 0;
    stepBattle(w);
    expect(q.objectiveMet).toBe(true);
    command(w, { type: 'leave' });
    for (let i = 0; i < 4; i++) tickDay(w);
    w = decode(encode(w));
    command(w, { type: 'enter' });
    expect(w.quests.find((item) => item.id === q.id)?.status).toBe('accepted');
    w.settlements[0].monsters = 3; // A later threat does not revoke an earned reward.
    const gold = w.player!.gold;
    expect(command(w, { type: 'complete_quest', quest: q.id }).ok).toBe(true);
    expect(w.player!.gold).toBe(gold + q.reward);
    const once = JSON.stringify(w);
    expect(command(w, { type: 'complete_quest', quest: q.id }).ok).toBe(false);
    expect(JSON.stringify(w)).toBe(once);
  });
  it('rest costs money, consumes time and heals actual people; invalid rest is atomic', () => {
    const w = game();
    command(w, { type: 'recruit', count: 3 });
    const a = army(w);
    w.people[w.player!.person].health = 35;
    w.people[a.members[0]].health = 30;
    const gold = w.player!.gold;
    const day = w.day;
    expect(command(w, { type: 'rest', days: 1 }).ok).toBe(true);
    expect(w.day).toBe(day + 1);
    expect(w.player!.gold).toBe(gold - 8);
    expect(w.people[w.player!.person].health).toBeGreaterThan(35);
    expect(w.people[a.members[0]].health).toBeGreaterThan(30);
    expect(w.speed).toBe(0);
    w.player!.gold = 0;
    const before = JSON.stringify(w);
    expect(command(w, { type: 'rest', days: 3 }).ok).toBe(false);
    expect(JSON.stringify(w)).toBe(before);
  });
  it('work pays from the treasury and cannot mint money when the employer cannot pay', () => {
    const w = game();
    const money = w.player!.gold;
    const day = w.day;
    expect(command(w, { type: 'work', job: 'farm' }).ok).toBe(true);
    expect(w.player!.gold).toBe(money + 10);
    expect(w.day).toBe(day + 1);
    w.settlements[0].treasury = 0;
    const before = JSON.stringify(w);
    expect(command(w, { type: 'work', job: 'farm' }).ok).toBe(false);
    expect(JSON.stringify(w)).toBe(before);
  });
  it('supplies the player army from owned inventory, not free market stocks', () => {
    const w = game();
    command(w, { type: 'recruit', count: 3 });
    const a = army(w);
    const before = w.player!.inventory.grain + a.food;
    expect(command(w, { type: 'supply', quantity: 10 }).ok).toBe(true);
    expect(w.player!.inventory.grain + a.food).toBe(before);
    tickDay(w);
    expect(w.player!.inventory.grain + a.food).toBeCloseTo(before - 4);
  });
  it('training preserves identities and accounts for cavalry horses and casualties', () => {
    const w = game();
    command(w, { type: 'recruit', count: 3 });
    const a = army(w),
      ids = [...a.members];
    w.player!.inventory.horses = 3;
    expect(command(w, { type: 'train', unitClass: 'cavalry' }).ok).toBe(true);
    expect(a.members).toEqual(ids);
    expect(a.mounts).toBe(3);
    expect(w.player!.inventory.horses).toBe(0);
    command(w, { type: 'battle' });
    expect(
      w
        .battle!.fighters.filter((f) => f.person !== w.player!.person && f.side === 'player')
        .every((f) => f.unitClass === 'cavalry'),
    ).toBe(true);
    w.battle!.fighters.find((f) => f.person === ids[0])!.hp = 0;
    command(w, { type: 'retreat' });
    command(w, { type: 'leave' });
    command(w, { type: 'enter' });
    command(w, { type: 'dismiss' });
    expect(w.player!.inventory.horses).toBe(2);
    expect(w.people[ids[0]].alive).toBe(false);
    expect(a.members).toHaveLength(0);
  });
  it('hold stays in place and attack follows an enemy', () => {
    const w = game();
    command(w, { type: 'battle' });
    const hero = w.battle!.fighters[0];
    for (const f of w.battle!.fighters)
      if (f.side === 'enemy') {
        f.x = 18;
        f.y = 10;
      }
    command(w, { type: 'battle_tactic', tactic: 'hold', unitClass: 'all' });
    const x = hero.x,
      y = hero.y;
    stepBattle(w);
    expect([hero.x, hero.y]).toEqual([x, y]);
    command(w, { type: 'battle_tactic', tactic: 'attack', unitClass: 'all' });
    stepBattle(w);
    expect(hero.x).toBeGreaterThan(x);
    expect(w.battle!.fighters.every((f) => f.x >= 0 && f.x <= 20 && f.y >= 0 && f.y <= 14)).toBe(
      true,
    );
  });
  it('deploys all 60 recruited identities inside the battlefield', () => {
    const w = game(120);
    w.player!.gold = 3000;
    w.settlements[0].stocks.weapons = 100;
    w.settlements[0].stocks.grain = 1000;
    for (let i = 0; i < 3; i++) expect(command(w, { type: 'recruit', count: 20 }).ok).toBe(true);
    command(w, { type: 'battle' });
    const fighters = w.battle!.fighters.filter((f) => f.side === 'player');
    expect(fighters).toHaveLength(61);
    expect(fighters.every((f) => f.x >= 0 && f.x <= 20 && f.y >= 0 && f.y <= 14)).toBe(true);
  });
  it('dialogue reflects real local quests, remembers first meeting and rejects remote NPCs', () => {
    const w = game(),
      npc = w.settlements[0].residents.find(
        (id) => id !== w.player!.person && w.people[id].profession !== 'child',
      )!;
    expect(command(w, { type: 'talk', person: npc }).ok).toBe(true);
    const d = conversation(w, npc);
    expect(d.lines.join(' ')).toContain(String(w.settlements[0].monsters));
    const choice = d.choices.find((c) => c.command?.type === 'accept_quest')!;
    expect(command(w, choice.command).ok).toBe(true);
    expect(conversation(w, npc).choices.some((c) => c.command?.type === 'accept_quest')).toBe(
      false,
    );
    const memories = w.npcs[npc].memory.length;
    command(w, { type: 'talk', person: npc });
    expect(w.npcs[npc].memory).toHaveLength(memories);
    const before = JSON.stringify(w);
    expect(command(w, { type: 'talk', person: w.settlements[1].residents[0] }).ok).toBe(false);
    expect(JSON.stringify(w)).toBe(before);
  });
  it('migrates v1 saves and preserves deterministic continuation of v2 saves', () => {
    const w = game();
    const legacy = structuredClone(w) as unknown as { version: number };
    legacy.version = 1;
    const migrated = decode(encode(legacy as unknown as World));
    expect(migrated.version).toBe(2);
    expect(migrated.rng).toBe(w.rng);
    command(w, { type: 'recruit', count: 3 });
    command(w, { type: 'battle' });
    command(w, { type: 'battle_tactic', tactic: 'hold', unitClass: 'all' });
    const restored = decode(encode(w));
    for (let i = 0; i < 8; i++) {
      stepBattle(w);
      stepBattle(restored);
    }
    expect(restored).toEqual(w);
  });
  it('pauses at arrival, keeping the player and actual army colocated', () => {
    const w = game();
    command(w, { type: 'recruit', count: 3 });
    command(w, { type: 'travel', settlement: 1 });
    for (let i = 0; i < 10 && w.player!.journey; i++) tickDay(w);
    expect(w.player!.journey).toBeUndefined();
    expect(w.speed).toBe(0);
    expect(army(w).members.every((id) => w.people[id].settlement === 1)).toBe(true);
  });
});
