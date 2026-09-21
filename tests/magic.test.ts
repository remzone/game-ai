import { it, expect } from 'vitest';
import {
  createWorld,
  command,
  startBattle,
  stepBattle,
  levy,
  supply,
  adult,
  SCHOOLS,
  type World,
} from '@living-world/simulation';
import { encode, decode } from '../apps/server/src/storage.js';
function game(human = false) {
  const w = createWorld('magic-schools', 60);
  command(w, {
    type: 'create_player',
    biography: {
      name: 'Маг',
      race: 'Human',
      sex: 'male',
      birthplace: 0,
      origin: 'nobles',
      childhood: 'books',
      youth: 'temple',
      training: 'healer',
      turningPoint: 'rescue',
      reason: 'knowledge',
    },
  });
  const p = w.player!,
    hero = w.people[p.person];
  hero.potential = 10;
  hero.mana = 100;
  for (const school of SCHOOLS) p.skills[school] = 1;
  w.settlements[0].monsters = 2;
  const enemy = human ? levy(w, 0, 5) : undefined;
  startBattle(w, enemy?.id);
  const caster = w.battle!.fighters.find((f) => f.person === p.person)!;
  for (const f of w.battle!.fighters.filter((f) => f.side === 'enemy')) {
    f.x = caster.x + 5;
    f.y = caster.y;
  }
  return w;
}
function cast(w: World, school: (typeof SCHOOLS)[number], target: string) {
  return command(w, { type: 'spell', school, target });
}
it('roots stop movement until their saved expiration time and do not stop time itself', () => {
  const w = game(),
    target = w.battle!.fighters.find((f) => f.side === 'enemy')!,
    x = target.x;
  expect(cast(w, 'nature', target.id).ok).toBe(true);
  stepBattle(w);
  expect(target.x).toBe(x);
  const saved = decode(encode(w));
  expect(saved.battle!.fighters.find((f) => f.id === target.id)!.rootedUntil).toBe(
    target.rootedUntil,
  );
  w.battle!.elapsed = target.rootedUntil!;
  stepBattle(w);
  expect(target.x).toBeLessThan(x);
});
it('illusion halves actual attack damage with identical RNG and battlefield positions', () => {
  const control = game(),
    hero = control.battle!.fighters[0],
    enemy = control.battle!.fighters[1];
  enemy.x = hero.x + 1;
  enemy.y = hero.y;
  control.battle!.fighters = control.battle!.fighters.slice(0, 2);
  const enchanted = structuredClone(control);
  expect(cast(enchanted, 'illusion', enemy.id).ok).toBe(true);
  stepBattle(control);
  stepBattle(enchanted);
  expect(100 - enchanted.battle!.fighters[0].hp).toBeCloseTo(
    (100 - control.battle!.fighters[0].hp) / 2,
  );
});
it('summons consume mana, expire, and cannot create population or bypass the cap', () => {
  const w = game(),
    count = w.people.length,
    id = w.battle!.fighters[0].id;
  expect(cast(w, 'summoning', id).ok).toBe(true);
  expect(cast(w, 'summoning', id).ok).toBe(true);
  const before = JSON.stringify(w);
  expect(cast(w, 'summoning', id).ok).toBe(false);
  expect(JSON.stringify(w)).toBe(before);
  expect(w.people.length).toBe(count);
  expect(w.people[w.player!.person].mana).toBe(60);
  const spirit = w.battle!.fighters.find((f) => f.summonedUntil)!;
  w.battle!.elapsed = 20;
  stepBattle(w);
  expect(spirit.hp).toBe(0);
});
it('spatial magic exchanges existing allies and rejects enemies without spending mana', () => {
  const w = game(),
    hero = w.battle!.fighters[0];
  expect(cast(w, 'summoning', hero.id).ok).toBe(true);
  const spirit = w.battle!.fighters.find((f) => f.summonedUntil)!,
    x = hero.x,
    sx = spirit.x;
  expect(cast(w, 'spatial', spirit.id).ok).toBe(true);
  expect(hero.x).toBe(sx);
  expect(spirit.x).toBe(x);
  const before = JSON.stringify(w);
  expect(cast(w, 'spatial', w.battle!.fighters[1].id).ok).toBe(false);
  expect(JSON.stringify(w)).toBe(before);
});
it('necromancy retains a fallen identity, transfers army membership and requires continuing mana', () => {
  const w = game(true),
    target = w.battle!.fighters.find((f) => f.side === 'enemy')!,
    person = w.people[target.person!],
    count = w.people.length,
    pop = w.settlements[0].population,
    parents = [...person.parents];
  target.hp = 0;
  expect(cast(w, 'necromancy', target.id).ok).toBe(true);
  expect(person.undead).toBe(true);
  expect(person.alive).toBe(true);
  expect(person.parents).toEqual(parents);
  expect(w.people.length).toBe(count);
  expect(w.settlements[0].population).toBe(pop);
  expect(w.armies.filter((a) => a.members.includes(person.id))).toHaveLength(1);
  expect(w.armies.find((a) => a.id === w.player!.army)!.members).toContain(person.id);
  expect(adult(w, person)).toBe(false);
  const loaded = decode(encode(w));
  expect(loaded.people[person.id].undead).toBe(true);
  w.people[w.player!.person].mana = 1;
  supply(w);
  expect(person.alive).toBe(true);
  supply(w);
  expect(person.alive).toBe(false);
  expect(w.settlements[0].population).toBe(pop - 1);
});
it('new schools are taught by real teachers and paid from the hero to the teacher', () => {
  const w = game();
  w.battle = null;
  w.player!.scene = 'settlement';
  w.player!.gold = 100;
  w.player!.inventory.grain = 100;
  const teacher = w.settlements[0].residents.find(
    (id) => id !== w.player!.person && w.people[id].alive && (w.npcs[id]?.skills?.nature ?? 0) >= 3,
  )!;
  expect(teacher).toBeDefined();
  const wealth = w.people[teacher].wealth,
    day = w.day;
  expect(command(w, { type: 'study', school: 'nature' }).ok).toBe(true);
  expect(w.day).toBe(day + 3);
  expect(w.people[teacher].wealth).toBeGreaterThanOrEqual(wealth + 60);
  expect(w.player!.gold).toBe(40);
  expect(w.player!.skills.nature).toBe(2);
});
