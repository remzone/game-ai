import { z } from 'zod';
import type { World, LoreItem } from './model.js';
import { SCHOOLS } from './magic.js';
import { adult, tickDay } from './systems.js';
import { event, nextId } from './world.js';
export const LoreSchemas = [
  z.object({ type: z.literal('commission_book'), school: z.enum(SCHOOLS) }).strict(),
  z.object({ type: z.literal('read_book'), item: z.string().max(80) }).strict(),
  z
    .object({
      type: z.literal('forge_artifact'),
      school: z.enum(SCHOOLS),
      name: z.string().trim().min(2).max(60),
    })
    .strict(),
  z
    .object({
      type: z.literal('give_item'),
      item: z.string().max(80),
      person: z.number().int().nonnegative(),
    })
    .strict(),
] as const;
const Schema = z.discriminatedUnion('type', LoreSchemas);
function ensure(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
export function initializeLore(w: World) {
  w.items ??= [];
  for (const s of w.settlements) {
    s.essence ??= 0;
    s.essenceReserve ??= s.biome === 'mountain' ? 3 + (s.id % 4) : 0;
  }
}
export function loreDay(w: World) {
  if (w.day % 30 !== 0) return;
  for (const s of w.settlements)
    if (
      (s.essenceReserve ?? 0) > 0 &&
      s.workers.miner > 0 &&
      s.stocks.tools >= 1 &&
      s.stocks.iron >= 1
    ) {
      s.stocks.tools--;
      s.stocks.iron--;
      s.essenceReserve!--;
      s.essence = (s.essence ?? 0) + 1;
      event(w, 'essence', `${s.name}: шахтёры извлекли единицу редкой магической руды.`, [
        `settlement:${s.id}`,
      ]);
    }
}
export function transferItem(w: World, item: LoreItem, owner: number, reason: string) {
  const old = item.owner;
  item.owner = owner;
  item.history.push(
    event(
      w,
      'item_transfer',
      `${item.name}: ${reason}.`,
      [item.id, `person:${old}`, `person:${owner}`],
      true,
    ).id,
  );
}
export function loreCommand(w: World, input: unknown) {
  const parsed = Schema.safeParse(input);
  if (!parsed.success) return false;
  const c = parsed.data,
    p = w.player;
  ensure(p && !p.gameOver && w.people[p.person].alive, 'Нужен живой герой');
  const hero = w.people[p.person],
    s = w.settlements[hero.settlement],
    army = w.armies.find((a) => a.id === p.army)!;
  ensure(
    p.scene === 'settlement' && !p.journey && w.battle?.status !== 'active',
    'Обратитесь в поселении вне боя',
  );
  if (c.type === 'give_item') {
    const item = w.items?.find((v) => v.id === c.item),
      other = w.people[c.person];
    ensure(item?.owner === p.person, 'Предмет вам не принадлежит');
    ensure(
      other?.alive && other.id !== p.person && other.settlement === s.id && adult(w, other),
      'Нужен живой местный получатель',
    );
    transferItem(w, item, other.id, 'дарение');
    return true;
  }
  ensure(hero.potential >= 1, 'Нужен врождённый магический потенциал');
  if (c.type === 'read_book') {
    const item = w.items?.find((v) => v.id === c.item && v.owner === p.person && v.kind === 'book');
    ensure(item, 'Нужна собственная книга');
    ensure(
      (p.skills[item.school] ?? 0) < 3,
      'Книга даёт знания только до навыка 3; далее нужен учитель',
    );
    ensure(
      p.inventory.grain >= 3 && p.inventory.grain + army.food >= 3 * (army.members.length + 1),
      'Нужна еда на 3 дня',
    );
    for (let i = 0; i < 3 && hero.alive; i++) tickDay(w);
    if (hero.alive) {
      p.skills[item.school] = Math.min(3, (p.skills[item.school] ?? 0) + 1);
      p.skills.magic = (p.skills.magic ?? 0) + 1;
    }
    w.speed = 0;
    return true;
  }
  let creator = p.person,
    kind: LoreItem['kind'],
    name: string;
  if (c.type === 'commission_book') {
    const teacher = s.residents.find(
      (id) =>
        id !== p.person &&
        w.people[id].alive &&
        adult(w, w.people[id]) &&
        (w.npcs[id]?.skills?.[c.school] ?? 0) >= 3,
    );
    ensure(teacher !== undefined, 'Нужен местный учитель этой школы');
    ensure(
      p.gold >= 80 && s.stocks.wood >= 2 && s.stocks.tools >= 1,
      'Нужно 80 монет, 2 дерева и 1 инструмент на складе города',
    );
    p.gold -= 80;
    w.people[teacher].wealth += 80;
    s.stocks.wood -= 2;
    s.stocks.tools--;
    creator = teacher;
    kind = 'book';
    name = `Трактат: ${c.school}`;
  } else {
    ensure(
      (p.skills.crafting ?? 0) >= 2 && (p.skills[c.school] ?? 0) >= 2,
      'Нужны ремесло 2 и выбранная школа 2',
    );
    ensure(
      p.gold >= 100 && (s.essence ?? 0) >= 3 && p.inventory.iron >= 10 && p.inventory.tools >= 2,
      'Нужно 100 монет, 3 магической руды в городе, 10 железа и 2 инструмента в инвентаре',
    );
    p.gold -= 100;
    s.treasury += 100;
    s.essence! -= 3;
    p.inventory.iron -= 10;
    p.inventory.tools -= 2;
    kind = 'artifact';
    name = c.name;
  }
  const item: LoreItem = {
    id: nextId(w, 'item'),
    name,
    kind,
    school: c.school,
    owner: p.person,
    creator,
    created: w.day,
    history: [],
  };
  item.history.push(
    event(
      w,
      'item_created',
      `${name}: ${kind === 'book' ? 'создан трактат' : 'выкован артефакт'} мастером ${creator}.`,
      [item.id, `person:${creator}`, `settlement:${s.id}`],
      true,
    ).id,
  );
  (w.items ??= []).push(item);
  return true;
}
