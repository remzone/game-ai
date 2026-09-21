import { z } from 'zod';
import { RACES, type World, type State, type Person } from './model.js';
import { event, nextId } from './world.js';

export const emblems = { tower: '♜', sun: '☀', star: '✦', moon: '☾', cross: '✠' } as const;
export const StatecraftSchemas = [
  z
    .object({
      type: z.literal('state_identity'),
      name: z.string().trim().min(2).max(60),
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      emblem: z.enum(['tower', 'sun', 'star', 'moon', 'cross']),
      rulerTitle: z.string().trim().min(2).max(40),
    })
    .strict(),
  z
    .object({
      type: z.literal('race_rights'),
      race: z.enum(RACES),
      rights: z.enum(['equal', 'restricted']),
    })
    .strict(),
  z
    .object({
      type: z.literal('state_pact'),
      state: z.number().int().nonnegative(),
      action: z.enum(['vassalage', 'guarantee', 'tribute']),
      amount: z.number().int().min(10).max(500),
    })
    .strict(),
  z.object({ type: z.literal('end_pact'), treaty: z.string().max(80) }).strict(),
] as const;
const Schema = z.discriminatedUnion('type', StatecraftSchemas);
function ensure(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
export function hasCivilRights(state: State, person: Person) {
  // Mixed ancestry is restricted only when at least half of it is covered by the law.
  return (
    person.ancestry.reduce(
      (n, share, i) => n + (state.raceRights?.[RACES[i]] === 'restricted' ? share : 0),
      0,
    ) < 0.5
  );
}
export function overlord(w: World, state: number) {
  return w.treaties.find((t) => t.type === 'vassalage' && t.a === state && t.until > w.day)?.b;
}
export function sameRealm(w: World, a: number, b: number) {
  const root = (id: number) => {
    const seen = new Set<number>();
    while (!seen.has(id)) {
      seen.add(id);
      const next = overlord(w, id);
      if (next === undefined) return id;
      id = next;
    }
    return id;
  };
  return root(a) === root(b);
}
export function statecraftCommand(w: World, input: unknown) {
  const parsed = Schema.safeParse(input);
  if (!parsed.success) return false;
  const c = parsed.data,
    p = w.player;
  ensure(p && !p.gameOver && w.people[p.person].alive, 'Нужен живой герой');
  const hero = w.people[p.person],
    state = w.states[hero.state];
  ensure(state?.ruler === p.person, 'Нужны полномочия верховного правителя');
  ensure(
    !p.journey &&
      w.battle?.status !== 'active' &&
      p.scene === 'settlement' &&
      w.settlements[hero.settlement].state === state.id,
    'Обратитесь в поселении своей державы вне боя',
  );
  if (c.type === 'state_identity') {
    ensure(
      state.name !== c.name ||
        state.color !== c.color ||
        state.emblem !== c.emblem ||
        state.rulerTitle !== c.rulerTitle,
      'Такая символика уже действует',
    );
    state.name = c.name;
    state.color = c.color;
    state.emblem = c.emblem;
    state.rulerTitle = c.rulerTitle;
    p.title = `${c.rulerTitle} ${c.name}`;
    event(
      w,
      'state_identity',
      `${state.name}: утверждены название, герб и титул ${c.rulerTitle}.`,
      [`state:${state.id}`, `person:${p.person}`],
      true,
    );
  } else if (c.type === 'race_rights') {
    ensure((state.raceRights?.[c.race] ?? 'equal') !== c.rights, 'Этот закон уже действует');
    const proposed = { ...state, raceRights: { ...state.raceRights, [c.race]: c.rights } };
    ensure(
      hasCivilRights(proposed, hero),
      'Правитель не может лишить самого себя права занимать должность',
    );
    state.raceRights = proposed.raceRights;
    state.legitimacy = Math.max(0, state.legitimacy - 10);
    for (const s of w.settlements.filter((s) => s.state === state.id)) {
      const affected = s.residents.filter(
        (id) => w.people[id].alive && !hasCivilRights(state, w.people[id]),
      ).length;
      s.loyalty = Math.max(0, s.loyalty - (10 * affected) / Math.max(1, s.population));
    }
    event(
      w,
      'race_law',
      `${state.name}: ${c.race} — ${c.rights === 'equal' ? 'равные гражданские права' : 'ограничение доступа к должностям'}.`,
      [`state:${state.id}`],
      true,
    );
  } else if (c.type === 'state_pact') {
    const other = w.states[c.state];
    ensure(
      other && other.id !== state.id && other.capital >= 0,
      'Нужна другая существующая держава',
    );
    ensure(
      !w.wars.some(
        (v) =>
          v.active &&
          ((v.a === state.id && v.b === other.id) || (v.b === state.id && v.a === other.id)),
      ),
      'Сначала заключите мир',
    );
    ensure(
      (state.relations[other.id] ?? 0) >= 10 && (other.relations[state.id] ?? 0) >= 10,
      'Нужны взаимные отношения не ниже 10',
    );
    ensure(
      !w.treaties.some(
        (t) => t.until > w.day && t.type === c.action && t.a === state.id && t.b === other.id,
      ),
      'Договор уже действует',
    );
    if (c.action === 'vassalage') {
      ensure(overlord(w, state.id) === undefined, 'У державы уже есть сюзерен');
      ensure(!sameRealm(w, state.id, other.id), 'Вассальный договор создал бы цикл');
      let ancestor: number | undefined = other.id;
      const seen = new Set<number>();
      while (ancestor !== undefined && !seen.has(ancestor)) {
        ensure(ancestor !== state.id, 'Нельзя стать вассалом своего вассала');
        seen.add(ancestor);
        ancestor = overlord(w, ancestor);
      }
      ensure(state.treasury >= c.amount, 'Казна должна покрывать первый платёж');
    }
    if (c.action === 'tribute')
      ensure(state.treasury >= c.amount, 'Казна должна покрывать первый платёж');
    w.treaties.push({
      id: nextId(w, 'treaty'),
      a: state.id,
      b: other.id,
      type: c.action,
      until: w.day + 360,
      amount: c.action === 'guarantee' ? undefined : c.amount,
      nextPayment: w.day + 30,
    });
    event(
      w,
      'pact',
      `${state.name} → ${other.name}: ${c.action}${c.action === 'guarantee' ? '' : `, выплата ${c.amount} каждые 30 дней`}.`,
      [`state:${state.id}`, `state:${other.id}`],
      true,
    );
  } else {
    const t = w.treaties.find((t) => t.id === c.treaty && t.until > w.day);
    ensure(
      t && ['vassalage', 'guarantee', 'tribute'].includes(t.type),
      'Нужен действующий политический договор',
    );
    ensure(
      t.a === state.id || (t.type === 'vassalage' && t.b === state.id),
      'Вы не можете разорвать чужое обязательство',
    );
    t.until = w.day;
    state.legitimacy = Math.max(0, state.legitimacy - 10);
    const other = t.a === state.id ? t.b : t.a;
    state.relations[other] = (state.relations[other] ?? 0) - 30;
    w.states[other].relations[state.id] = (w.states[other].relations[state.id] ?? 0) - 30;
    event(
      w,
      'pact_end',
      `${state.name}: прекращён договор ${t.type}.`,
      [t.id, `state:${state.id}`],
      true,
    );
  }
  p.legitimacy = state.legitimacy;
  return true;
}
export function honorGuarantees(w: World) {
  for (const war of [...w.wars].filter((v) => v.active && !v.defenseOf)) {
    const protectors = w.treaties
      .filter(
        (t) =>
          t.until > w.day &&
          ((t.type === 'guarantee' && t.b === war.b) || (t.type === 'vassalage' && t.a === war.b)),
      )
      .map((t) => (t.type === 'vassalage' ? t.b : t.a));
    for (const protector of new Set(protectors)) {
      if (
        protector === war.a ||
        w.states[protector]?.capital < 0 ||
        sameRealm(w, protector, war.a) ||
        w.wars.some(
          (v) =>
            v.active &&
            ((v.a === protector && v.b === war.a) || (v.b === protector && v.a === war.a)),
        )
      )
        continue;
      const target =
        w.settlements.find(
          (s) =>
            s.state === war.a &&
            w.roads.some(
              (r) =>
                (r.a === s.id && w.settlements[r.b].state === protector) ||
                (r.b === s.id && w.settlements[r.a].state === protector),
            ),
        ) ?? w.settlements[w.states[war.a].capital];
      if (!target) continue;
      // A guarantee is a defensive obligation: it does not invent a territorial claim.
      w.wars.push({
        id: nextId(w, 'war'),
        a: protector,
        b: war.a,
        target: target.id,
        reason: `Защита ${w.states[war.b].name} по договору`,
        started: w.day,
        active: true,
        campaign: true,
        defenseOf: war.id,
      });
      w.states[protector].relations[war.a] = -80;
      w.states[war.a].relations[protector] = -80;
      event(
        w,
        'guarantee_honored',
        `${w.states[protector].name} вступает в войну на защиту ${w.states[war.b].name}.`,
        [war.id, `state:${protector}`],
        true,
      );
    }
  }
}
export function statecraftDay(w: World) {
  for (const t of w.treaties.filter(
    (t) => t.until > w.day && ['vassalage', 'tribute'].includes(t.type),
  )) {
    if (w.states[t.a].capital < 0 || w.states[t.b].capital < 0) {
      t.until = w.day;
      continue;
    }
    if (w.day < (t.nextPayment ?? Infinity)) continue;
    const payer = w.states[t.a],
      receiver = w.states[t.b],
      due = t.amount ?? 0,
      paid = Math.min(due, payer.treasury);
    payer.treasury -= paid;
    receiver.treasury += paid;
    t.nextPayment = w.day + 30;
    if (paid < due) {
      payer.legitimacy = Math.max(0, payer.legitimacy - 5);
      receiver.relations[payer.id] = (receiver.relations[payer.id] ?? 0) - 10;
    }
    event(
      w,
      'tribute',
      `${payer.name} выплатил ${paid} из ${due} державе ${receiver.name}.`,
      [t.id, `state:${payer.id}`, `state:${receiver.id}`],
      true,
    );
  }
  honorGuarantees(w);
}
