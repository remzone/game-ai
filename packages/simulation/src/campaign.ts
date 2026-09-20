import type { World, Siege } from './model.js';
import { advanceJourney, death, event, movePerson, profession } from './world.js';
import { transferSettlement } from './polity.js';
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
      const result = advanceJourney(w, a.journey),
        at = a.journey.route[a.journey.leg];
      a.settlement = at;
      for (const id of a.members) movePerson(w, w.people[id], at);
      if (result !== 'moving') a.journey = undefined;
    }
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
    siege.pressure += s.shortageDays > 0 ? 4 : 1;
    if (s.shortageDays >= 3 && d)
      for (const id of d.members) {
        w.people[id].health = Math.max(0, w.people[id].health - 3);
        if (w.people[id].health === 0) death(w, w.people[id], 'голод в осаде');
      }
    if (d) d.members = d.members.filter((id) => w.people[id].alive);
    if (!d?.members.length || (siege.pressure >= 60 && (s.shortageDays >= 10 || d.morale < 30)))
      endSiege(w, siege, true);
  }
}
