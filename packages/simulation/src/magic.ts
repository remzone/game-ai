import type { World, Fighter } from './model.js';
import { death, event, nextId, profession } from './world.js';
export const SCHOOLS = [
  'elemental',
  'healing',
  'nature',
  'illusion',
  'necromancy',
  'summoning',
  'spatial',
] as const;
export type School = (typeof SCHOOLS)[number];
export const schoolInfo: Record<School, { name: string; cost: number; description: string }> = {
  elemental: { name: 'Стихийный удар', cost: 10, description: 'Наносит урон врагу.' },
  healing: { name: 'Лечение', cost: 10, description: 'Восстанавливает здоровье союзника.' },
  nature: {
    name: 'Корни',
    cost: 12,
    description: 'Удерживают врага на месте; он может атаковать в пределах досягаемости.',
  },
  illusion: { name: 'Морок', cost: 12, description: 'На время уменьшает урон врага вдвое.' },
  necromancy: {
    name: 'Поднять павшего',
    cost: 25,
    description:
      'Павший человек становится нежитью вашего отряда. Нужна 1 мана хозяина в день; без неё нежить распадается.',
  },
  summoning: {
    name: 'Призыв духа',
    cost: 20,
    description: 'Дух сражается 20 секунд; не более двух одновременно. Цель — сам герой.',
  },
  spatial: {
    name: 'Перестановка',
    cost: 20,
    description: 'Меняет героя местами с живым союзником в радиусе 8.',
  },
};
export function initializeMagic(w: World) {
  for (const npc of Object.values(w.npcs))
    if (npc.titles.includes('Учитель магии')) {
      npc.skills ??= {};
      for (const school of SCHOOLS) npc.skills[school] ??= 3;
    }
}
function ensure(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
export function isSpellTarget(f: Fighter, school: School, hero: number) {
  if (school === 'necromancy')
    return f.hp <= 0 && f.person !== undefined && f.person !== hero && !f.undead;
  if (school === 'summoning') return f.person === hero && f.hp > 0;
  if (school === 'spatial') return f.side === 'player' && f.hp > 0 && f.person !== hero;
  return f.hp > 0 && f.side === (school === 'healing' ? 'player' : 'enemy');
}
export function spellCost(w: Pick<World, 'items' | 'player'>, school: School) {
  const focus = (w.items ?? []).some(
    (item) => item.owner === w.player?.person && item.kind === 'artifact' && item.school === school,
  );
  return schoolInfo[school].cost - (focus ? 2 : 0);
}
export function castSpell(w: World, school: School, targetId: string) {
  const p = w.player!,
    hero = w.people[p.person],
    b = w.battle;
  ensure(b?.status === 'active', 'Заклинание доступно в бою');
  const caster = b.fighters.find((f) => f.person === p.person),
    target = b.fighters.find((f) => f.id === targetId);
  ensure(
    caster && caster.hp > 0 && target && isSpellTarget(target, school, p.person),
    'Недопустимая цель заклинания',
  );
  ensure((p.skills[school] ?? 0) >= 1 && hero.potential >= 1, 'Сначала изучите школу магии');
  ensure(hero.mana >= spellCost(w, school), `Нужно ${spellCost(w, school)} маны`);
  ensure(Math.hypot(caster.x - target.x, caster.y - target.y) <= 8, 'Цель вне радиуса 8');
  ensure(school !== 'healing' || target.hp < target.maxHp, 'Цель не ранена');
  const army = w.armies.find((a) => a.id === p.army)!;
  if (school === 'necromancy') {
    const person = w.people[target.person!];
    ensure(
      !person.undead && army.members.length < 60 && person.settlement === b.settlement,
      'Нельзя поднять этого павшего или отряд полон',
    );
    ensure(
      !w.states.some((s) => s.ruler === person.id) &&
        !w.regions.some((r) => r.governor === person.id),
      'Правителя нельзя подчинить некромантией',
    );
  }
  if (school === 'summoning')
    ensure(
      b.fighters.filter(
        (f) => f.summonedUntil !== undefined && f.hp > 0 && f.summonedUntil > b.elapsed,
      ).length < 2,
      'Уже призваны два духа',
    );
  hero.mana -= spellCost(w, school);
  const focus = (w.items ?? []).some(
    (item) => item.owner === p.person && item.kind === 'artifact' && item.school === school,
  )
    ? 8
    : 0;
  const power = Math.min(65, 12 + hero.potential * 3 + (p.skills[school] ?? 0) * 2) + focus;
  if (school === 'healing') target.hp = Math.min(target.maxHp, target.hp + power);
  if (school === 'elemental') target.hp = Math.max(0, target.hp - power);
  if (school === 'nature') target.rootedUntil = b.elapsed + 4 + Math.min(6, p.skills[school]);
  if (school === 'illusion') target.weakenedUntil = b.elapsed + 6 + Math.min(6, p.skills[school]);
  if (school === 'spatial') {
    [caster.x, target.x] = [target.x, caster.x];
    [caster.y, target.y] = [target.y, caster.y];
    caster.targetX = caster.x;
    caster.targetY = caster.y;
    target.targetX = target.x;
    target.targetY = target.y;
  }
  if (school === 'summoning')
    b.fighters.push({
      id: nextId(w, 'spirit'),
      side: 'player',
      unitClass: 'mages',
      hp: power,
      maxHp: power,
      x: Math.min(19, caster.x + 0.8),
      y: caster.y,
      targetX: caster.x + 1,
      targetY: caster.y,
      order: 'attack',
      cooldown: 0,
      summonedUntil: b.elapsed + 20,
    });
  if (school === 'necromancy') {
    const person = w.people[target.person!],
      town = w.settlements[person.settlement];
    death(w, person, 'падение в бою перед некромантией');
    for (const a of w.armies)
      if (a.members.includes(person.id)) {
        a.members = a.members.filter((id) => id !== person.id);
        if ((person.unitClass ?? a.unitClass) === 'cavalry')
          a.mounts = Math.max(0, (a.mounts ?? 0) - 1);
      }
    person.alive = true;
    person.health = 50;
    person.undead = true;
    person.undeadMaster = p.person;
    town.population++;
    town.workers[person.profession]++;
    profession(w, person, 'soldier');
    person.unitClass = 'infantry';
    person.state = hero.state;
    army.members.push(person.id);
    target.side = 'player';
    target.hp = 50;
    target.maxHp = 100;
    target.unitClass = 'infantry';
    target.undead = true;
    target.order = 'attack';
    target.cooldown = 1;
    event(
      w,
      'undeath',
      `${p.name} поднял павшего ${person.id}; его прежняя личность сохранена.`,
      [`person:${person.id}`, `person:${p.person}`],
      true,
    );
  }
  p.skills[school] += 0.05;
}
