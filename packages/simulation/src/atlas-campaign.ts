import type { World } from './model.js';
import { honorGuarantees, sameRealm } from './statecraft.js';
import { event, nextId } from './world.js';

/**
 * Activate an authored pre-game conflict using the existing campaign, travel and logistics systems.
 * Called only on the freshly initialized, final atlas plan. AI has no access to these fields.
 */
export function startAtlasCampaign(w: World): boolean {
  const campaign = w.atlasWorld?.scenario.campaign;
  if (!campaign || w.day !== 0) return false;
  const { a, b, target } = campaign;
  const left = w.states[a],
    right = w.states[b];
  const isPair = (x: number, y: number) => (x === a && y === b) || (x === b && y === a);
  if (
    !left ||
    !right ||
    sameRealm(w, a, b) ||
    w.settlements[target]?.state !== b ||
    !w.roads.some(
      (r) =>
        !r.blocked &&
        ((r.a === target && w.settlements[r.b]?.state === a) ||
          (r.b === target && w.settlements[r.a]?.state === a)),
    ) ||
    w.wars.some((war) => war.active && isPair(war.a, war.b)) ||
    w.treaties.some(
      (t) =>
        t.until > w.day &&
        isPair(t.a, t.b) &&
        ['alliance', 'peace', 'vassalage', 'guarantee'].includes(t.type),
    )
  )
    return false;
  const reason = 'Война за наследие единой школы магии';
  // At the start of hostilities, both sides revoke their bilateral founding trade and passage.
  w.treaties = w.treaties.filter((t) => !isPair(t.a, t.b) || !['trade', 'access'].includes(t.type));
  left.relations[b] = right.relations[a] = -80;
  if (!left.claims.includes(target)) left.claims.push(target);
  const id = nextId(w, 'war');
  w.wars.push({ id, a, b, target, reason, active: true, started: w.day, campaign: true });
  event(
    w,
    'war',
    `${left.name} и ${right.name}: ${reason.toLowerCase()}. Цель похода: ${w.settlements[target].name}.`,
    [id, `state:${a}`, `state:${b}`, `settlement:${target}`],
    true,
  );
  honorGuarantees(w);
  return true;
}
