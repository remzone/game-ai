import { RACES, type Person, type Race, type Settlement, type State, type World } from './model.js';
import { seedHash } from './rng.js';

export type CivicStyle = 'court' | 'guild' | 'fort' | 'spire';
export type ShrineStyle = 'hearth' | 'memorial' | 'observatory';
export interface TownFaith {
  id: number;
  title: string;
  followers: number;
  style: ShrineStyle;
  rite?: string;
}
export interface TownCulture {
  homes: Race[];
  communities: { race: Race; share: number }[];
  civic: CivicStyle;
  emblem?: State['emblem'];
  government: string;
  officialFaith?: string;
  faiths: TownFaith[];
}
const shrineStyles = ['hearth', 'memorial', 'observatory'] as const;

function shrineStyle(id: number, title: string, rite?: string): ShrineStyle {
  // Read the actual local rite first. Generated faith names can replace the defaults.
  for (const text of [rite, title]) {
    if (!text) continue;
    if (/предк|помин|умерш|могил|надгроб|память камня/i.test(text)) return 'memorial';
    if (/познани|небес|зв[её]зд|светил|обсерватор|наук/i.test(text)) return 'observatory';
    if (/очаг|уголь|угля|гостеприим|жаров|оставляет у ворот воду/i.test(text)) return 'hearth';
  }
  return shrineStyles[((id % 3) + 3) % 3];
}

export function civicStyle(government: string): CivicStyle {
  switch (government) {
    case 'republic':
    case 'merchant_republic':
    case 'council_of_nobles':
      return 'guild';
    case 'military_dictatorship':
    case 'tribal_confederation':
      return 'fort';
    case 'magocracy':
    case 'theocracy':
      return 'spire';
    default:
      return 'court';
  }
}

export function townCulture(w: World, s: Settlement, seed: number): TownCulture {
  const state = w.states[s.state];
  const ancestries = RACES.map(() => 0);
  const counts = new Map<number, number>();
  let people = 0;
  const transients = new Set(w.roadLife?.peddlers.filter((t) => t.journey).map((t) => t.person));
  for (const id of s.residents) {
    const p = w.people[id];
    // Do not recolor a town merely because a marching army or the player arrives.
    if (
      !p?.alive ||
      p.undead ||
      p.id === w.player?.person ||
      p.profession === 'soldier' ||
      p.settlement !== s.id ||
      transients.has(id)
    )
      continue;
    people++;
    p.ancestry.forEach((share, i) => (ancestries[i] += share));
    counts.set(p.faith, (counts.get(p.faith) ?? 0) + 1);
  }
  const communities = RACES.map((race, i) => ({ race, share: people ? ancestries[i] / people : 0 }))
    .filter((a) => a.share > 0)
    .sort((a, b) => b.share - a.share || RACES.indexOf(a.race) - RACES.indexOf(b.race));
  const use = communities.map(() => 0);
  // Highest averages preserve the dominant vernacular but allow genuinely mixed streets.
  const homes: Race[] = [];
  for (let j = 0; j < 18 && communities.length; j++) {
    let best = 0;
    for (let i = 1; i < communities.length; i++)
      if (communities[i].share / (1 + use[i]) > communities[best].share / (1 + use[best])) best = i;
    homes.push(communities[best].race);
    use[best]++;
  }
  const rank = [...counts].sort((a, b) => b[1] - a[1] || a[0] - b[0]);
  const faiths: TownFaith[] = [];
  for (const [id, followers] of rank) {
    if (followers < 3 || (faiths.length && (followers < 5 || followers / people < 0.22))) continue;
    const faith = w.religions.find((r) => r.id === id);
    if (!faith || (!state.laws.tolerance && id !== state.laws.religion)) continue;
    const rite = w.worldLore?.faiths.find((f) => f.id === id)?.rite;
    faiths.push({
      id,
      title: faith.name,
      style: shrineStyle(id, faith.name, rite),
      followers,
      rite,
    });
    if (faiths.length === 2) break;
  }
  // Preserve the primary example; seed the remaining slots rather than alternating mechanically.
  for (let j = homes.length - 1; j > 1; j--) {
    const at = 1 + (seedHash(`${seed}:houses:${j}`) % j);
    [homes[j], homes[at]] = [homes[at], homes[j]];
  }
  return {
    homes: homes.length ? homes : ['Human'],
    communities,
    civic: civicStyle(state.government),
    emblem: state.emblem,
    government: state.government,
    officialFaith: w.religions.find((r) => r.id === state.laws.religion)?.name,
    faiths,
  };
}

function heritage(p: Person) {
  return p.ancestry.indexOf(Math.max(...p.ancestry));
}

export function variedResidents(people: Person[], limit: number, seed: number): Person[] {
  const rank = people
    .map((person) => ({ person, rank: seedHash(`${seed}:${person.id}`) }))
    .sort((a, b) => a.rank - b.rank || a.person.id - b.person.id);
  const seenRace = new Set<number>(),
    seenSex = new Set<Person['sex']>(),
    seenJob = new Set<Person['profession']>();
  const out: Person[] = [];
  while (rank.length && out.length < limit) {
    const score = (p: Person) =>
      Number(!seenRace.has(heritage(p))) * 4 +
      Number(!seenSex.has(p.sex)) * 2 +
      Number(!seenJob.has(p.profession));
    let best = 0;
    for (let n = 1; n < rank.length; n++)
      if (score(rank[n].person) > score(rank[best].person)) best = n;
    const [{ person }] = rank.splice(best, 1);
    out.push(person);
    seenRace.add(heritage(person));
    seenSex.add(person.sex);
    seenJob.add(person.profession);
  }
  return out;
}
