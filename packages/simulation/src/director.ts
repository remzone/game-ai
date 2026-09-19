import { z } from 'zod';
import type { World } from './model.js';
import { event, nextId, promote } from './world.js';
const evidence = z.array(z.string().max(50)).min(1).max(8);
export const ProposalSchema = z.discriminatedUnion('type', [
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
