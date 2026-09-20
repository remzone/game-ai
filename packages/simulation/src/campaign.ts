import type { World, Siege, Army } from './model.js';
import { advanceJourney, death, event, movePerson, profession } from './world.js';
import { adult, levy } from './systems.js';
import { route, makeJourney, nextId } from './world.js';
import { transferSettlement } from './polity.js';
/** Every province on an army route must grant access or be at war. */
export function militaryRoute(w: World, state: number, from: number, to: number) {
  const allowed = (id: number) => {
    const owner = w.settlements[id]?.state;
    return (
      owner === state ||
      w.wars.some(
        (v) => v.active && ((v.a === state && v.b === owner) || (v.b === state && v.a === owner)),
      ) ||
      w.treaties.some(
        (t) =>
          t.until > w.day &&
          ['access', 'alliance'].includes(t.type) &&
          ((t.a === state && t.b === owner) || (t.b === state && t.a === owner)),
      )
    );
  };
  return route({ roads: w.roads.filter((r) => allowed(r.a) && allowed(r.b)) }, from, to);
}

export function beginSiege(w: World, attacker: Army) {
  const s = w.settlements[attacker.settlement];
  const defender = levy(w, s.id, Math.min(30, 5 + s.fortification * 5));
  // Existing defending soldiers remain soldiers and join the same real garrison.
  for (const army of w.armies) {
    if (
      army === defender ||
      army.player ||
      army.state !== s.state ||
      army.settlement !== s.id ||
      army.journey ||
      !army.members.length
    )
      continue;
    defender.members.push(...army.members);
    defender.food += army.food;
    defender.mounts = (defender.mounts ?? 0) + (army.mounts ?? 0);
    for (const id of army.members) w.people[id].unitClass ??= army.unitClass;
    army.members = [];
    army.food = 0;
    army.mounts = 0;
  }
  const blockedRoads = w.roads.filter((r) => !r.blocked && (r.a === s.id || r.b === s.id));
  for (const road of blockedRoads) road.blocked = true;
  const siege: Siege = {
    id: nextId(w, 'siege'),
    settlement: s.id,
    attacker: attacker.id,
    defender: defender.id,
    started: w.day,
    status: 'active',
    pressure: 0,
    engines: 0,
    blockedRoads: blockedRoads.map(({ a, b }) => ({ a, b })),
  };
  w.sieges.push(siege);
  event(
    w,
    'siege_start',
    `${w.states[attacker.state].name}: армия блокировала ${s.name}.`,
    [siege.id, attacker.id, `settlement:${s.id}`, `state:${attacker.state}`],
    true,
  );
  return siege;
}

function strategyDay(w: World) {
  // One expedition per side and declared territorial objective. No fabricated soldiers or cargo.
  for (const war of w.wars.filter((v) => v.active && v.campaign)) {
    const target = w.settlements[war.target];
    if (!target || target.state !== war.b || w.day - war.started >= 180) {
      war.active = false;
      for (const type of ['peace', 'access'] as const)
        w.treaties.push({ id: nextId(w, 'treaty'), a: war.a, b: war.b, type, until: w.day + 90 });
      w.states[war.a].relations[war.b] = -20;
      w.states[war.b].relations[war.a] = -20;
      for (const siege of w.sieges.filter((v) => v.status === 'active')) {
        const attacker = w.armies.find((a) => a.id === siege.attacker);
        const owner = w.settlements[siege.settlement].state;
        if (
          attacker &&
          ((attacker.state === war.a && owner === war.b) ||
            (attacker.state === war.b && owner === war.a))
        )
          endSiege(w, siege, false);
      }
      for (const army of w.armies.filter(
        (a) =>
          !a.player &&
          a.members.length &&
          (a.state === war.a || a.state === war.b) &&
          (a.commander === undefined || a.commander !== w.player?.person),
      )) {
        army.journey = undefined;
        if (w.settlements[army.settlement].state === army.state) continue;
        const home = w.settlements
          .filter((s) => s.state === army.state)
          .map((s) => militaryRoute(w, army.state, army.settlement, s.id))
          .filter((path) => path.length > 1)
          .map((path) => makeJourney(w, path))
          .sort((a, b) => a.total - b.total)[0];
        if (home) army.journey = home;
      }
      event(
        w,
        'peace',
        target?.state === war.a
          ? 'Территориальная цель достигнута: стороны заключили перемирие.'
          : 'Затяжной поход завершён перемирием; армии возвращаются домой.',
        [war.id],
        true,
      );
      continue;
    }

    if (w.sieges.some((v) => v.status === 'active' && v.settlement === target.id)) continue;
    const armies = w.armies.filter(
      (a) =>
        !a.player &&
        a.state === war.a &&
        a.members.length &&
        (a.commander === undefined || a.commander !== w.player?.person) &&
        !w.sieges.some(
          (v) => v.status === 'active' && (v.attacker === a.id || v.defender === a.id),
        ),
    );
    if (armies.some((a) => a.journey)) continue;
    let army = armies.find((a) => a.settlement === target.id && a.morale >= 30);
    if (army) {
      beginSiege(w, army);
      continue;
    }
    if (w.day % 7 !== 0) continue;
    const origins = w.settlements
      .filter((s) => s.state === war.a && s.shortageDays === 0)
      .map((s) => ({ s, path: militaryRoute(w, war.a, s.id, target.id) }))
      .filter((v) => v.path.length > 1)
      .map((v) => ({ ...v, journey: makeJourney(w, v.path) }))
      .sort((a, b) => a.journey.total - b.journey.total || a.s.id - b.s.id);
    for (const { s, journey } of origins) {
      army = armies.find((a) => a.settlement === s.id && a.morale >= 60);
      const days = journey.total + 70;
      const surplus = Math.max(0, s.stocks.grain - s.population * 3);
      if (!army) {
        const count = Math.min(
          20,
          Math.floor(s.stocks.weapons),
          Math.floor(s.treasury / 10),
          Math.floor(surplus / days),
          s.residents.filter((id) => {
            const person = w.people[id];
            return (
              person.alive &&
              adult(w, person) &&
              person.profession !== 'soldier' &&
              id !== w.player?.person &&
              !w.states.some((v) => v.ruler === id) &&
              !w.regions.some((v) => v.governor === id)
            );
          }).length,
        );
        if (count < 5) continue;
        army = levy(w, s.id, count);
        if (!army.members.length) continue;
        s.treasury -= army.members.length * 10;
        for (const id of army.members) w.people[id].wealth += 10;
      }
      const cargo = Math.max(0, army.members.length * days - army.food);
      if (s.stocks.grain - s.population * 3 < cargo) continue;
      s.stocks.grain -= cargo;
      army.food += cargo;
      army.journey = journey;
      event(
        w,
        'campaign',
        `${w.states[war.a].name}: ${army.members.length} воинов выступили к ${target.name} с запасом на ${days} дней.`,
        [war.id, army.id, `settlement:${target.id}`],
        true,
      );
      break;
    }
  }
}

export function endSiege(w: World, siege: Siege, captured: boolean) {
  if (siege.status !== 'active') return;
  siege.status = captured ? 'captured' : 'lifted';
  for (const edge of siege.blockedRoads) {
    const road = w.roads.find((r) => r.a === edge.a && r.b === edge.b);
    if (
      road &&
      !w.sieges.some(
        (other) =>
          other.status === 'active' && (other.settlement === road.a || other.settlement === road.b),
      )
    )
      road.blocked = false;
  }
  const attacker = w.armies.find((a) => a.id === siege.attacker),
    defender = w.armies.find((a) => a.id === siege.defender);
  if (defender) {
    for (const id of defender.members)
      if (w.people[id].alive) profession(w, w.people[id], w.people[id].homeProfession ?? 'farmer');
    const s = w.settlements[siege.settlement];
    s.stocks.weapons += defender.members.filter((id) => w.people[id].alive).length;
    s.stocks.grain += defender.food;
    s.stocks.horses += Math.min(
      defender.mounts ?? 0,
      defender.members.filter(
        (id) => w.people[id].alive && (w.people[id].unitClass ?? defender.unitClass) === 'cavalry',
      ).length,
    );
    defender.mounts = 0;
    defender.food = 0;
    defender.members = [];
  }
  if (captured && attacker) {
    transferSettlement(w, siege.settlement, attacker.state);
    if (attacker.player && w.player) {
      w.settlements[siege.settlement].governance.steward = w.player.person;
      w.player.reputation[`settlement:${siege.settlement}`] = 40;
      w.player.legitimacy += 5;
    }
  }
  event(
    w,
    'siege_end',
    `${w.settlements[siege.settlement].name}: ${captured ? 'капитуляция и переход контроля' : 'осада снята'}.`,
    [siege.id, `settlement:${siege.settlement}`],
    true,
  );
}
export function campaignDay(w: World) {
  for (const a of w.armies)
    if (!a.player && a.journey && a.members.length) {
      const next = a.journey.route[a.journey.leg + 1];
      if (!militaryRoute(w, a.state, a.settlement, next).length) {
        a.journey = undefined;
        continue;
      }
      const result = advanceJourney(w, a.journey),
        at = a.journey.route[a.journey.leg];
      a.settlement = at;
      for (const id of a.members) movePerson(w, w.people[id], at);
      if (result !== 'moving') a.journey = undefined;
    }
  strategyDay(w);
  for (const siege of w.sieges) {
    if (siege.status !== 'active') continue;
    const a = w.armies.find((a) => a.id === siege.attacker),
      d = w.armies.find((a) => a.id === siege.defender);
    if (
      !a?.members.length ||
      a.settlement !== siege.settlement ||
      a.morale < 20 ||
      (a.player && !w.people[w.player!.person].alive)
    ) {
      endSiege(w, siege, false);
      continue;
    }
    const s = w.settlements[siege.settlement];
    const atWar = w.wars.some(
      (v) =>
        v.active && ((v.a === a.state && v.b === s.state) || (v.b === a.state && v.a === s.state)),
    );
    if (!atWar || (w.battle?.status === 'active' && w.battle.siege === siege.id)) {
      if (!atWar) endSiege(w, siege, false);
      continue;
    }
    siege.pressure += (s.shortageDays > 0 ? 4 : 1) + (siege.engines ?? 0);
    if (d && (siege.engines ?? 0) > 0) d.morale = Math.max(0, d.morale - siege.engines! * 0.5);
    if (s.shortageDays >= 3 && d)
      for (const id of d.members) {
        w.people[id].health = Math.max(0, w.people[id].health - 3);
        if (w.people[id].health === 0) death(w, w.people[id], 'голод в осаде');
      }
    if (
      !a.player &&
      d?.members.length &&
      w.day % 7 === 0 &&
      siege.pressure >= 14 + s.fortification * 10 &&
      a.food >= a.members.length * 3 &&
      a.members.length >= d.members.length * 0.8
    ) {
      const defendingDamage = Math.min(
        30,
        (12 * a.members.length) / d.members.length / (1 + s.fortification * 0.15),
      );
      const attackingDamage = Math.min(30, (10 * d.members.length) / a.members.length);
      for (const [army, damage] of [
        [a, attackingDamage],
        [d, defendingDamage],
      ] as const)
        for (const id of army.members) {
          w.people[id].health = Math.max(0, w.people[id].health - damage);
          if (w.people[id].health === 0) death(w, w.people[id], 'штурм укреплений');
        }
      a.members = a.members.filter((id) => w.people[id].alive);
      event(
        w,
        'siege_assault',
        `${s.name}: армии столкнулись у укреплений.`,
        [siege.id, a.id, d.id],
        true,
      );
      if (!a.members.length) {
        endSiege(w, siege, false);
        continue;
      }
    }
    if (d) d.members = d.members.filter((id) => w.people[id].alive);
    if (!d?.members.length || (siege.pressure >= 60 && (s.shortageDays >= 10 || d.morale < 30)))
      endSiege(w, siege, true);
  }
}
