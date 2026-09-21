import { hasCivilRights } from './statecraft.js';
import type { World, State } from './model.js';
import { adult } from './systems.js';
import { event, promote } from './world.js';
import { revokeOffice } from './governance.js';
export const governments: Record<
  string,
  { name: string; hereditary: boolean; term: number; basis: string }
> = {
  feudal_monarchy: { name: 'Феодальная монархия', hereditary: true, term: 0, basis: 'dynasty' },
  absolute_monarchy: { name: 'Абсолютная монархия', hereditary: true, term: 0, basis: 'dynasty' },
  elective_monarchy: { name: 'Выборная монархия', hereditary: false, term: 720, basis: 'lords' },
  republic: { name: 'Республика', hereditary: false, term: 360, basis: 'service' },
  merchant_republic: { name: 'Торговая республика', hereditary: false, term: 360, basis: 'wealth' },
  theocracy: { name: 'Теократия', hereditary: false, term: 720, basis: 'faith' },
  tribal_confederation: {
    name: 'Племенная конфедерация',
    hereditary: false,
    term: 360,
    basis: 'kin',
  },
  military_dictatorship: { name: 'Военная диктатура', hereditary: false, term: 720, basis: 'army' },
  council_of_nobles: { name: 'Совет знати', hereditary: false, term: 360, basis: 'lords' },
  magocracy: { name: 'Магократия', hereditary: false, term: 720, basis: 'magic' },
};
export function crown(w: World, s: State, person: number, reason: string) {
  const old = s.ruler;
  if (w.npcs[old]) w.npcs[old].titles = w.npcs[old].titles.filter((t) => t !== 'Правитель');
  s.ruler = person;
  s.legitimacy = 60;
  s.unrestDays = 0;
  s.electionDay = w.day + (governments[s.government]?.term || 720);
  const npc = promote(w, person);
  if (!npc.titles.includes('Правитель')) npc.titles.push('Правитель');
  if (w.player?.person === person) {
    w.player.title = `${s.rulerTitle ?? 'Правитель'} ${s.name}`;
    w.player.legitimacy = 60;
    w.people[person].state = s.id;
    const army = w.armies.find((a) => a.id === w.player!.army);
    if (army) army.state = s.id;
  } else if (w.player?.person === old) {
    w.player.title = 'Бывший правитель';
    w.player.legitimacy = 10;
  }
  event(
    w,
    'succession',
    `${s.name}: ${npc.name} получает власть — ${reason}.`,
    [`state:${s.id}`, `person:${person}`],
    true,
  );
}
export function electors(w: World, state: number) {
  const ids = w.regions
    .filter((r) => r.state === state)
    .map((r) => r.governor)
    .filter((id): id is number => id !== null && !!w.people[id]?.alive && adult(w, w.people[id]));
  return [...new Set(ids)];
}
export function succession(w: World, s: State, election = false) {
  const rule = governments[s.government] ?? governments.republic;
  const previous = w.people[s.ruler];
  if (!election && rule.hereditary) {
    const heir = [...(previous?.children ?? []), ...(w.npcs[s.ruler]?.recognizedHeirs ?? [])]
      .map((id) => w.people[id])
      .filter((p) => p?.alive && adult(w, p) && p.state === s.id && hasCivilRights(s, p))
      .sort((a, b) => a.born - b.born || a.id - b.id)[0];
    if (heir) {
      crown(w, s, heir.id, 'династическое наследование');
      return;
    }
  }
  const voters = electors(w, s.id);
  const candidates = [
    ...new Set([
      ...voters,
      s.ruler,
      ...w.settlements.filter((t) => t.state === s.id).map((t) => t.governance.steward),
    ]),
  ].filter(
    (id): id is number =>
      id !== null &&
      !!w.people[id]?.alive &&
      adult(w, w.people[id]) &&
      w.people[id].state === s.id &&
      hasCivilRights(s, w.people[id]),
  );
  if (!candidates.length) {
    const fallback = w.people.find(
      (p) => p.alive && adult(w, p) && p.state === s.id && hasCivilRights(s, p),
    );
    if (fallback) crown(w, s, fallback.id, 'признание уцелевших жителей');
    return;
  }
  const scores = new Map(
    candidates.map((id) => {
      const p = w.people[id],
        npc = w.npcs[id],
        player = w.player?.person === id ? w.player : null;
      const offices = w.settlements.filter(
        (t) => t.state === s.id && t.governance.steward === id,
      ).length;
      let score =
        offices * 12 + w.regions.filter((r) => r.state === s.id && r.governor === id).length * 20;
      if (rule.basis === 'wealth') score += Math.min(60, (player?.gold ?? p.wealth) / 50);
      if (rule.basis === 'army')
        score +=
          w.armies
            .filter((a) => a.commander === id || (a.player && player))
            .reduce((n, a) => n + a.members.length, 0) *
            2 +
          p.experience;
      if (rule.basis === 'magic')
        score += (player?.skills.magic ?? npc?.skills?.magic ?? 0) * p.potential;
      if (rule.basis === 'faith') score += p.faith === s.laws.religion ? 30 : -50;
      if (rule.basis === 'kin') score += p.children.filter((id) => w.people[id].alive).length * 5;
      if (rule.basis === 'service')
        score += player
          ? Object.entries(player.reputation)
              .filter(
                ([key]) =>
                  key.startsWith('settlement:') &&
                  w.settlements[Number(key.split(':')[1])]?.state === s.id,
              )
              .reduce((n, [, v]) => n + v, 0) / 10
          : 0;
      return [id, score] as const;
    }),
  );
  s.ballots = voters.map((elector) => ({
    elector,
    candidate: [...candidates].sort(
      (a, b) =>
        scores.get(b)! +
          (w.npcs[elector]?.relationships[b] ?? 0) +
          (b === elector ? 5 : 0) -
          (scores.get(a)! + (w.npcs[elector]?.relationships[a] ?? 0) + (a === elector ? 5 : 0)) ||
        a - b,
    )[0],
  }));
  const winner = [...candidates].sort(
    (a, b) =>
      s.ballots.filter((v) => v.candidate === b).length -
        s.ballots.filter((v) => v.candidate === a).length ||
      scores.get(b)! - scores.get(a)! ||
      a - b,
  )[0];
  crown(
    w,
    s,
    winner,
    `голосование совета: ${s.ballots.filter((v) => v.candidate === winner).length}/${voters.length}; ${rule.name}`,
  );
}
export function transferSettlement(w: World, id: number, state: number) {
  const s = w.settlements[id],
    old = s.state;
  if (old === state) return;
  revokeOffice(w, s, 'смена державы');
  s.state = state;
  s.occupation = null;
  s.loyalty = 40;
  for (const id of s.residents)
    if (w.people[id].profession !== 'soldier') w.people[id].state = state;
  if (w.regions[s.region].capital === s.id) {
    const region = w.regions[s.region];
    region.state = state;
    region.governor = null;
    for (const village of w.settlements.filter(
      (t) => t.region === s.region && t.id !== id && t.state !== state,
    ))
      village.occupation = { state, until: w.day + 14 };
  }
  const remaining = w.settlements.filter((t) => t.state === old);
  if (w.states[old].capital === id) w.states[old].capital = remaining[0]?.id ?? -1;
  if (!remaining.length) w.states[old].ruler = -1;
  event(
    w,
    'capture',
    `${s.name}: контроль перешёл от ${w.states[old].name} к ${w.states[state].name}.`,
    [`settlement:${id}`, `state:${old}`, `state:${state}`],
    true,
  );
}
export function polityDay(w: World) {
  for (const r of w.regions)
    if (
      r.governor === null ||
      !w.people[r.governor]?.alive ||
      w.people[r.governor].state !== r.state
    ) {
      r.governor =
        w.settlements[r.capital].residents.find(
          (id) =>
            w.people[id].alive &&
            adult(w, w.people[id]) &&
            w.people[id].profession !== 'soldier' &&
            id !== w.states[r.state].ruler &&
            hasCivilRights(w.states[r.state], w.people[id]),
        ) ?? null;
    }
  for (const t of w.settlements) {
    if (!t.occupation) continue;
    const occupier = t.occupation.state;
    if (w.settlements[w.regions[t.region].capital].state !== occupier) {
      t.occupation = null;
      continue;
    }
    if (w.day < t.occupation.until) continue;
    const defenders = w.armies
      .filter((a) => a.state === t.state && a.settlement === t.id)
      .reduce((n, a) => n + a.members.filter((id) => w.people[id].alive).length, 0);
    const occupiers = w.armies
      .filter((a) => a.state === occupier && a.settlement === t.id)
      .reduce((n, a) => n + a.members.filter((id) => w.people[id].alive).length, 0);
    if (defenders > 0 || t.loyalty >= 60) {
      t.occupation.until = w.day + 7;
      if (!defenders && occupiers >= 5) t.loyalty = Math.max(0, t.loyalty - 5);
      event(
        w,
        'resistance',
        `${t.name}: жители сохраняют верность прежней державе${defenders ? ', гарнизон удерживает поселение' : ''}.`,
        [`settlement:${t.id}`, `state:${t.state}`, `state:${occupier}`],
      );
    } else transferSettlement(w, t.id, occupier);
  }
  for (const s of [...w.states]) {
    const towns = w.settlements.filter((t) => t.state === s.id);
    if (!towns.length) continue;
    if (!w.people[s.ruler]?.alive) succession(w, s);
    else if ((governments[s.government]?.term ?? 0) > 0 && w.day >= s.electionDay)
      succession(w, s, true);
    const discontent = towns.filter((t) => t.loyalty <= 20).length >= Math.ceil(towns.length / 2);
    s.unrestDays = discontent ? s.unrestDays + 1 : 0;
    if (s.unrestDays < 30 || towns.length <= 6) continue;
    const region = w.regions
      .filter((r) => r.state === s.id && r.governor !== null && w.people[r.governor]?.alive)
      .find((r) => w.settlements.filter((t) => t.region === r.id).every((t) => t.loyalty <= 25));
    if (!region || region.governor === null) continue;
    const leader = region.governor,
      id = w.states.length;
    w.states.push({
      ...s,
      id,
      name: `Вольная ${region.name}`,
      ruler: leader,
      capital: region.capital,
      government: 'republic',
      tax: 0.12,
      treasury: region.treasury,
      claims: [],
      relations: { [s.id]: -80 },
      laws: { ...s.laws, tolerance: true },
      ballots: [],
      unrestDays: 0,
      electionDay: w.day + 360,
    });
    region.treasury = 0;
    w.organizations.push({
      id: `rebels:${id}`,
      name: `Совет ${region.name}`,
      state: id,
      leader,
      members: [
        ...new Set([
          leader,
          ...w.settlements
            .filter((t) => t.region === region.id)
            .map((t) => t.governance.steward)
            .filter((n): n is number => n !== null),
        ]),
      ],
    });
    for (const t of w.settlements.filter((t) => t.region === region.id))
      transferSettlement(w, t.id, id);
    region.governor = leader;
    w.people[leader].state = id;
    crown(w, w.states[id], leader, 'отделение области после затяжного недовольства');
    s.unrestDays = 0;
    s.legitimacy = Math.max(0, s.legitimacy - 20);
    event(
      w,
      'rebellion',
      `${w.states[id].name} отделилась после затяжного недовольства.`,
      [`state:${s.id}`, `state:${id}`, `person:${leader}`],
      true,
    );
  }
}
