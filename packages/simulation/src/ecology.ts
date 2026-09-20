import type { World } from './model.js';
import { random } from './rng.js';
import { event } from './world.js';
export const monsterNames = { wolf: 'Волки', spider: 'Пауки', troll: 'Тролли', dragon: 'Дракон' };
export const monsterStats = {
  wolf: { hp: 45, unitClass: 'infantry' },
  spider: { hp: 30, unitClass: 'infantry' },
  troll: { hp: 140, unitClass: 'cavalry' },
  dragon: { hp: 300, unitClass: 'mages' },
} as const;
export function ecologyDay(w: World) {
  if (w.day % 30 !== 0) return;
  const dens = w.settlements.filter((s) => s.monsters > 0);
  for (const s of dens) {
    const capacity = { wolf: 20, spider: 16, troll: 4, dragon: 1 }[s.monsterKind];
    if (s.monsters < capacity && s.monsterKind !== 'dragon' && random(w) < 0.35) s.monsters++;
    if (s.monsters < 2 || random(w) > 0.15) continue;
    const to = w.roads
      .filter((r) => !r.blocked && (r.a === s.id || r.b === s.id))
      .map((r) => w.settlements[r.a === s.id ? r.b : r.a])
      .find((t) => t.monsters === 0);
    if (!to) continue;
    s.monsters--;
    to.monsterKind = s.monsterKind;
    to.monsters = 1;
    event(
      w,
      'lair_migration',
      `${monsterNames[s.monsterKind]} распространились из ${s.name} к ${to.name}.`,
      [`settlement:${s.id}`, `settlement:${to.id}`],
    );
  }
}
