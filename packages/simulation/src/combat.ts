import type { World, Fighter, UnitClass } from './model.js';
import { death, event, nextId } from './world.js';
import { adult } from './systems.js';
import { random } from './rng.js';
const stats: Record<UnitClass, { range: number; damage: number; speed: number }> = {
  infantry: { range: 1.4, damage: 12, speed: 1.5 },
  spearmen: { range: 2, damage: 11, speed: 1.3 },
  archers: { range: 7, damage: 8, speed: 1.3 },
  cavalry: { range: 1.7, damage: 16, speed: 2.8 },
  mages: { range: 6, damage: 22, speed: 1.1 },
};
export function startBattle(w: World) {
  const p = w.player!,
    at = w.people[p.person].settlement,
    s = w.settlements[at],
    army = w.armies.find((a) => a.id === p.army)!;
  const people = [p.person, ...army.members];
  const fighters: Fighter[] = people.map((id, i) => ({
    id: `person:${id}`,
    person: id,
    side: 'player',
    unitClass: id === p.person ? 'infantry' : army.unitClass,
    hp: w.people[id].health,
    maxHp: 100,
    x: 1 + (i % 8) * 0.6,
    y: 2 + Math.floor(i / 8) * 1.3,
    order: 'attack',
    targetX: 8,
    targetY: 5,
    cooldown: 0,
  }));
  for (let i = 0; i < s.monsters; i++)
    fighters.push({
      id: `wolf:${i}`,
      side: 'enemy',
      unitClass: 'infantry',
      hp: 45,
      maxHp: 45,
      x: 14 + (i % 3),
      y: 3 + Math.floor(i / 3),
      targetX: 8,
      targetY: 5,
      cooldown: 0,
    });
  w.battle = { id: nextId(w, 'battle'), settlement: at, fighters, status: 'active', elapsed: 0 };
  p.scene = 'battle';
  w.speed = 1;
  event(w, 'battle_start', `${p.name} вступает в бой у ${s.name}.`, [`settlement:${at}`]);
}
export function finishBattle(w: World, result: 'victory' | 'defeat' | 'retreated') {
  const b = w.battle!,
    p = w.player!;
  if (b.status !== 'active') return;
  b.status = result;
  w.speed = 0;
  const killed = b.fighters.filter((f) => f.side === 'enemy' && f.hp <= 0).length;
  w.settlements[b.settlement].monsters = Math.max(0, w.settlements[b.settlement].monsters - killed);
  for (const f of b.fighters)
    if (f.person !== undefined) {
      const person = w.people[f.person];
      person.health = Math.max(0, Math.min(100, f.hp));
      if (f.hp <= 0) death(w, person, 'бой с волками');
      else person.experience++;
    }
  const army = w.armies.find((a) => a.id === p.army)!;
  army.members = army.members.filter((id) => w.people[id].alive);
  army.mounts = Math.min(army.mounts ?? 0, army.members.length);
  if (result === 'victory') {
    for (const q of w.quests)
      if (q.settlement === b.settlement && q.type === 'hunt' && q.status === 'accepted')
        q.objectiveMet = true;
    p.skills.command++;
    p.skills.melee++;
    p.reputation[`settlement:${b.settlement}`] =
      (p.reputation[`settlement:${b.settlement}`] ?? 0) + 10;
  }
  if (!w.people[p.person].alive) {
    p.gameOver = !p.heirs.some((id) => w.people[id]?.alive && adult(w, w.people[id]));
  }
  event(
    w,
    'battle_end',
    `Бой окончен: ${result}. Убито волков: ${killed}; погибло людей: ${b.fighters.filter((f) => f.person !== undefined && f.hp <= 0).length}.`,
    [b.id, `person:${p.person}`],
    true,
  );
}
export function stepBattle(w: World, dt = 0.25) {
  const b = w.battle;
  if (!b || b.status !== 'active') return;
  b.elapsed += dt;
  for (const f of b.fighters) {
    if (f.hp <= 0) continue;
    const enemies = b.fighters
      .filter((t) => t.side !== f.side && t.hp > 0)
      .sort((a, b) => Math.hypot(a.x - f.x, a.y - f.y) - Math.hypot(b.x - f.x, b.y - f.y));
    const target = enemies[0];
    if (!target) break;
    const cfg = stats[f.unitClass];
    f.cooldown = Math.max(0, f.cooldown - dt);
    const distance = Math.hypot(target.x - f.x, target.y - f.y);
    if (distance <= cfg.range && f.cooldown === 0) {
      const bonus =
        f.unitClass === 'spearmen' && target.unitClass === 'cavalry'
          ? 1.6
          : f.unitClass === 'cavalry' && target.unitClass === 'archers'
            ? 1.5
            : 1;
      const race =
        f.person === undefined
          ? 1
          : w.people[f.person].ancestry.reduce(
              (n, a, i) => n + a * [1, 0.9, 0.95, 1.2, 1.15, 0.8][i],
              0,
            );
      const experience =
        f.person === undefined ? 1 : 1 + Math.min(0.3, w.people[f.person].experience * 0.015);
      const skill =
        w.player && f.person === w.player.person
          ? 1 + Math.min(0.4, (w.player.skills.melee ?? 0) * 0.02)
          : 1;
      target.hp = Math.max(
        0,
        target.hp - cfg.damage * bonus * race * experience * skill * (0.85 + random(w) * 0.3),
      );
      f.cooldown = 1;
    } else if (distance > cfg.range) {
      if (f.order === 'hold' && f.side === 'player') continue;
      const chase = f.side === 'enemy' || f.order === 'attack';
      const tx = chase ? target.x : f.targetX,
        ty = chase ? target.y : f.targetY;
      const dx = tx - f.x,
        dy = ty - f.y,
        len = Math.hypot(dx, dy);
      if (len > 0.1) {
        const step = Math.min(len, cfg.speed * dt);
        f.x += (dx / len) * step;
        f.y += (dy / len) * step;
      }
    }
  }
  if (!b.fighters.some((f) => f.side === 'enemy' && f.hp > 0)) finishBattle(w, 'victory');
  else if (!b.fighters.some((f) => f.side === 'player' && f.hp > 0)) finishBattle(w, 'defeat');
}
