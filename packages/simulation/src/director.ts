import { z } from 'zod';
import type { World } from './model.js';
import { event, nextId, promote } from './world.js';
const evidence = z.array(z.string().max(50)).min(1).max(8);
export const ProposalSchema = z.discriminatedUnion('type', [
  z
    .object({
      type: z.literal('create_claim'),
      state: z.number().int().nonnegative(),
      settlement: z.number().int().nonnegative(),
      evidence,
    })
    .strict(),
  z
    .object({
      type: z.literal('create_historical_title'),
      person: z.number().int().nonnegative(),
      title: z.string().min(1).max(60),
      evidence,
    })
    .strict(),
  z
    .object({
      type: z.literal('create_organization'),
      state: z.number().int().nonnegative(),
      leader: z.number().int().nonnegative(),
      name: z.string().min(1).max(80),
      evidence,
    })
    .strict(),
  z
    .object({
      type: z.literal('chronicle'),
      title: z.string().min(1).max(100),
      text: z.string().min(1).max(1600),
      evidence,
    })
    .strict(),
  z
    .object({
      type: z.literal('assign_nickname'),
      person: z.number().int().nonnegative(),
      nickname: z.string().min(1).max(60),
      evidence,
    })
    .strict(),
  z
    .object({
      type: z.literal('spawn_quest'),
      settlement: z.number().int().nonnegative(),
      evidence,
    })
    .strict(),
]);
export function directorContext(w: World) {
  return {
    day: w.day,
    seed: w.seed,
    states: w.states.map((s) => ({ id: s.id, name: s.name, ruler: s.ruler, claims: s.claims })),
    regions: w.regions.map((r) => ({ id: r.id, state: r.state, governor: r.governor })),
    events: w.events.filter((e) => e.historical).slice(-8),
    npcs: Object.values(w.npcs)
      .slice(-12)
      .map((n) => ({ id: n.person, name: n.name })),
    needs: w.settlements
      .filter((s) => s.shortageDays >= 3)
      .slice(0, 8)
      .map((s) => ({ id: s.id, shortageDays: s.shortageDays })),
  };
}
export function applyProposal(w: World, input: unknown): { ok: boolean; reason: string } {
  const parse = ProposalSchema.safeParse(input);
  if (!parse.success) return { ok: false, reason: 'Ответ не соответствует whitelist/schema' };
  const p = parse.data;
  const facts = p.evidence.map((id) => w.events.find((e) => e.id === id && e.historical));
  if (facts.some((e) => !e)) return { ok: false, reason: 'Неизвестное историческое основание' };
  if (p.type === 'create_claim') {
    const state = w.states[p.state],
      target = w.settlements[p.settlement];
    if (
      !state ||
      !target ||
      target.state === state.id ||
      !facts.some((e) => e!.entities.includes(`state:${state.id}`)) ||
      !w.settlements.some((s) => s.state === state.id && s.shortageDays >= 10)
    )
      return { ok: false, reason: 'Нет подтверждённого государственного дефицита' };
    const border = w.roads.some(
      (r) =>
        (r.a === target.id && w.settlements[r.b].state === state.id) ||
        (r.b === target.id && w.settlements[r.a].state === state.id),
    );
    if (!border || state.claims.includes(target.id))
      return { ok: false, reason: 'Нет общей границы или претензия уже существует' };
    state.claims.push(target.id);
    event(
      w,
      'claim',
      `${state.name}: претензия на ${target.name} из-за затяжного дефицита.`,
      [`state:${state.id}`, `settlement:${target.id}`],
      true,
    );
    return { ok: true, reason: 'Территориальная претензия подтверждена текущим дефицитом' };
  }
  if (p.type === 'create_historical_title') {
    if (!w.people[p.person] || !facts.some((e) => e!.entities.includes(`person:${p.person}`)))
      return { ok: false, reason: 'Нет события о персонаже' };
    const npc = promote(w, p.person);
    if (!npc.titles.includes(p.title)) npc.titles.push(p.title);
    return { ok: true, reason: 'Почётное название не даёт политических полномочий' };
  }
  if (p.type === 'create_organization') {
    const state = w.states[p.state],
      leader = w.people[p.leader];
    if (
      !state ||
      !leader?.alive ||
      leader.state !== state.id ||
      !facts.some((e) => e!.entities.includes(`person:${leader.id}`))
    )
      return { ok: false, reason: 'Нет подтверждённого живого местного лидера' };
    const members = [
      ...new Set(
        w.regions
          .filter((r) => r.state === state.id && r.governor !== null)
          .map((r) => r.governor!),
      ),
    ].filter((id) => w.people[id].alive);
    if (
      !members.includes(leader.id) ||
      members.length < 2 ||
      w.organizations.some((o) => o.state === state.id && o.leader === leader.id)
    )
      return {
        ok: false,
        reason: 'Нет совета реальных руководителей или организация уже существует',
      };
    w.organizations.push({
      id: nextId(w, 'organization'),
      name: p.name,
      state: state.id,
      leader: leader.id,
      members,
    });
    return { ok: true, reason: 'Организация объединяет существующих областных руководителей' };
  }
  if (p.type === 'chronicle') {
    w.chronicles.push({
      id: nextId(w, 'chronicle'),
      day: w.day,
      title: p.title,
      text: p.text,
      evidence: p.evidence,
      subjective: true,
    });
    return { ok: true, reason: 'Субъективная хроника сохранена отдельно от фактов' };
  }
  if (p.type === 'assign_nickname') {
    if (!w.people[p.person] || !facts.some((e) => e!.entities.includes(`person:${p.person}`)))
      return { ok: false, reason: 'События не относятся к этому персонажу' };
    const n = promote(w, p.person);
    if (!n.titles.includes(p.nickname)) n.titles.push(p.nickname);
    event(w, 'nickname', `${n.name} получил прозвище «${p.nickname}».`, [`person:${p.person}`]);
    return { ok: true, reason: 'Прозвище подтверждено событиями' };
  }
  const s = w.settlements[p.settlement];
  if (!s || s.shortageDays < 3 || !facts.some((e) => e!.entities.includes(`settlement:${s.id}`)))
    return { ok: false, reason: 'Подтверждённая проблема отсутствует' };
  if (
    w.quests.some(
      (q) =>
        q.settlement === s.id && q.type === 'deliver' && ['open', 'accepted'].includes(q.status),
    )
  )
    return { ok: false, reason: 'Контракт уже существует' };
  w.quests.push({
    id: nextId(w, 'quest'),
    settlement: s.id,
    type: 'deliver',
    need: Math.max(10, s.population * 2),
    reward: Math.max(40, s.population * 8),
    created: w.day,
    status: 'open',
    reason: `Подтверждённый дефицит: ${s.shortageDays} дней`,
  });
  return { ok: true, reason: 'Контракт создан для существующей проблемы' };
}
