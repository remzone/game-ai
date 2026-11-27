import type { Landmark } from './atlas-world.js';
import type { Person, Profession, World } from './model.js';
import { organicPersonName } from './names.js';
import { appearanceFor, type PortraitAppearance } from './portrait.js';
import { seedHash } from './rng.js';
import { adult } from './systems.js';

export type DistrictKind =
  | 'square'
  | 'houses'
  | 'court'
  | 'watch'
  | 'market'
  | 'forge'
  | 'mine'
  | 'fields'
  | 'wood'
  | 'wharf'
  | 'site';
export type TownProfile = 'capital' | 'coast' | 'mountain' | 'forest' | 'marsh' | 'plains';
type Position = [x: number, y: number];
export interface TownResident {
  id: number;
  name: string;
  role: string;
  appearance: PortraitAppearance;
}
export interface DistrictPlan {
  id: string;
  kind: DistrictKind;
  title: string;
  detail: string;
  at: Position;
  people: TownResident[];
  site?: Landmark;
  houses: number;
}
export interface TownPlan {
  settlement: number;
  seed: number;
  profile: TownProfile;
  biome: 'forest' | 'mountain' | 'marsh' | 'plains';
  size: 'capital' | 'city' | 'village' | 'ruins';
  water: 'sea' | 'river' | 'marsh' | 'none';
  mirror: boolean;
  fortification: number;
  damage: number;
  title: string;
  owner: string;
  banner: string;
  region: string;
  residents: number;
  roads: number;
  occupations: boolean;
  lore: { title: string; text: string }[];
  districts: DistrictPlan[];
}

const labels: Record<Profession, string> = {
  farmer: 'Земледелие',
  woodcutter: 'Лесное хозяйство',
  miner: 'Горное дело',
  smith: 'Кузнечное ремесло',
  merchant: 'Торговля',
  soldier: 'Гарнизон',
  child: 'Житель',
};
const targets: Record<Exclude<DistrictKind, 'site'>, Position> = {
  square: [485, 337],
  houses: [705, 305],
  court: [485, 205],
  watch: [509, 452],
  market: [318, 270],
  forge: [262, 369],
  mine: [737, 189],
  fields: [235, 445],
  wood: [235, 180],
  wharf: [788, 405],
};
const purposes: Record<
  Exclude<DistrictKind, 'site'>,
  { name: string; job?: Profession; art: number }
> = {
  square: { name: 'Общая площадь', art: 0 },
  houses: { name: 'Жилой квартал', art: 4 },
  court: { name: 'Двор державы', art: 1 },
  watch: { name: 'Дозорные ворота', art: 1 },
  market: { name: 'Торговый ряд', job: 'merchant', art: 3 },
  forge: { name: 'Кузнечный двор', job: 'smith', art: 2 },
  mine: { name: 'Горный промысел', job: 'miner', art: 1 },
  fields: { name: 'Поля и амбары', job: 'farmer', art: 2 },
  wood: { name: 'Лесной двор', job: 'woodcutter', art: 2 },
  wharf: { name: 'Причалы', job: 'merchant', art: 2 },
};

function distance(p: Position, a: Position, b: Position) {
  const dx = b[0] - a[0],
    dy = b[1] - a[1];
  const d = dx * dx + dy * dy;
  const t = d ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / d)) : 0;
  return Math.hypot(p[0] - a[0] - dx * t, p[1] - a[1] - dy * t);
}

/** Pure projection: the settlement plan never mutates population, saves or RNG. */
export function planSettlement(w: World, id: number): TownPlan | undefined {
  const s = w.settlements[id];
  if (!s) return;
  const state = w.states[s.state],
    region = w.regions[s.region];
  const graphicSeed = seedHash(`${w.seed}:town:${id}`);
  const variant = (key: string, span: number) => seedHash(`${graphicSeed}:${key}`) % span;
  const cell = w.geography?.cells.find((c) => c.settlement === id);
  const water = cell?.port
    ? 'sea'
    : cell &&
        w.geography?.rivers.some((r) =>
          r.points.slice(1).some((p, i) => distance(cell.center, r.points[i], p) < 23),
        )
      ? 'river'
      : s.biome === 'marsh'
        ? 'marsh'
        : 'none';
  const isCapital = state.capital === id;
  const size =
    s.kind === 'ruins'
      ? 'ruins'
      : isCapital
        ? 'capital'
        : s.kind === 'village'
          ? 'village'
          : 'city';
  const profile = isCapital ? 'capital' : water === 'sea' ? 'coast' : s.biome;
  const roads = w.roads.filter((r) => !r.blocked && (r.a === id || r.b === id)).length;
  const damage = Math.min(3, s.structuralDamage ?? 0);
  const mirror = !!variant('handed', 2);
  const jitter = (kind: string, at: Position): Position => {
    const x = at[0] + variant(kind + ':east', 39) - 19,
      y = at[1] + variant(kind + ':north', 27) - 13;
    return [mirror ? 1000 - x : x, y];
  };
  const lore: TownPlan['lore'] = [];
  if (s.foundedDay !== undefined)
    lore.push({ title: 'Основание', text: `Поселенцы основали это место в день ${s.foundedDay}.` });
  if (!lore.length)
    lore.push({
      title: 'Земли и власть',
      text: isCapital
        ? `${s.name} — действующая столица державы «${state.name}».`
        : `${s.name} — поселение области «${region.name}», под властью державы «${state.name}».`,
    });
  if (water === 'sea')
    lore.push({
      title: 'Морской путь',
      text: 'Береговая география допускает порт: пристани обращены к воде, дворы остаются на суше.',
    });
  if (water === 'river')
    lore.push({
      title: 'У реки',
      text: 'У поселения проходит река, отмеченная на континентальном атласе.',
    });
  if (s.occupation)
    lore.push({
      title: 'Оккупация',
      text: `Под военным контролем державы «${w.states[s.occupation.state]?.name ?? state.name}».`,
    });
  if (damage)
    lore.push({
      title: 'Следы осады',
      text: `Урон, нанесённый поселению: ${damage} из 3. Повреждённая застройка остаётся на плане.`,
    });
  const sites = (w.atlasWorld?.sites ?? [])
    .filter((x) => x.settlement === id)
    .sort((a, b) => a.id - b.id);
  for (const site of sites) {
    lore.push({ title: site.name, text: site.lore });
    for (const entry of w.atlasWorld?.history.filter((e) => e.site === site.id) ?? [])
      lore.push({ title: entry.title, text: entry.detail });
  }

  const used = new Set<number>();
  const present = (p: Person | undefined): p is Person =>
    !!p &&
    p.alive &&
    !p.undead &&
    p.settlement === id &&
    p.id !== w.player?.person &&
    !used.has(p.id) &&
    adult(w, p);
  const travelers = new Set(
    w.roadLife?.peddlers.filter((t) => t.journey).map((t) => t.person) ?? [],
  );
  const locals = s.residents
    .map((i) => w.people[i])
    .filter((p) => present(p) && !travelers.has(p.id));
  const garrison = w.armies
    .filter((a) => !a.player && a.settlement === id && !a.journey)
    .flatMap((a) => [
      ...(a.commander !== undefined && a.members.includes(a.commander) ? [a.commander] : []),
      ...a.members,
    ])
    .filter((i, n, list) => list.indexOf(i) === n)
    .map((i) => w.people[i])
    .filter(present);
  const person = (p: Person | undefined, role?: string): TownResident[] => {
    if (!present(p) || travelers.has(p.id)) return [];
    used.add(p.id);
    return [
      {
        id: p.id,
        name: w.npcs[p.id]?.name ?? organicPersonName(w, p),
        role: role ?? labels[p.profession],
        appearance: appearanceFor(w, p),
      },
    ];
  };
  const districts: DistrictPlan[] = [];
  function add(kind: Exclude<DistrictKind, 'site'>, detail?: string) {
    const data = purposes[kind];
    let roster: TownResident[] = [];
    if (size !== 'ruins') {
      if (kind === 'court') roster = person(w.people[state.ruler], 'Правитель');
      else if (kind === 'watch')
        roster = garrison.slice(0, 2).flatMap((p) => person(p, 'Гарнизон'));
      else if (kind === 'square')
        roster = person(
          s.governance.steward == null ? undefined : w.people[s.governance.steward],
          'Управление',
        );
      else if (kind === 'houses')
        roster = person(locals.find((p) => !used.has(p.id) && p.profession !== 'soldier'));
      else if (data.job)
        roster = person(locals.find((p) => !used.has(p.id) && p.profession === data.job));
    }
    const houses = Math.max(
      0,
      data.art +
        (size === 'ruins'
          ? -1
          : size === 'city' && kind === 'houses'
            ? 2
            : size === 'capital' && kind === 'houses'
              ? 3
              : 0),
    );
    districts.push({
      id: kind,
      kind,
      title: kind === 'houses' && size === 'village' ? 'Жилые дворы' : data.name,
      detail: detail ?? (data.job ? `Занятых жителей: ${s.workers[data.job]}.` : ''),
      at: jitter(kind, targets[kind]),
      people: roster,
      houses,
    });
  }
  if (isCapital && size !== 'ruins') add('court', `Столица державы «${state.name}».`);
  add(
    'square',
    size === 'ruins' ? 'Бывший центр поселения.' : `К поселению ведут открытые дороги: ${roads}.`,
  );
  if (water === 'sea' && size !== 'ruins') add('wharf', 'Порт, отмеченный на атласе.');
  if (size !== 'ruins') {
    if (s.workers.merchant > 0 && size !== 'village') add('market');
    if (s.workers.smith > 0 && (size !== 'village' || s.workers.smith >= 3)) add('forge');
    if (s.biome === 'mountain' && s.workers.miner > 0) add('mine');
    if (s.biome === 'forest' && s.workers.woodcutter > 0) add('wood');
    if (s.workers.farmer > 0 && (size === 'village' || s.biome === 'plains')) add('fields');
    if (s.fortification > 0 || garrison.length || size === 'capital')
      add('watch', `Укрепления: ${s.fortification}. Бойцов на месте: ${garrison.length}.`);
  }
  // Reserve specialist NPCs first, then fill the residential card.
  add('houses', `Население: ${s.population}. Инфраструктура: ${s.infrastructure}.`);
  for (const site of sites) {
    const i = districts.filter((d) => d.kind === 'site').length;
    const slots: Position[] = [
      [565, 135],
      [165, 304],
      [648, 410],
      [365, 175],
      [137, 396],
    ];
    if (i >= slots.length) break;
    const at: Position =
      site.kind === 'harbor' && water === 'sea'
        ? [842, 342]
        : site.kind === 'mine' && s.biome === 'mountain'
          ? [655, 158]
          : site.kind === 'grove' && s.biome === 'forest'
            ? [132, 200]
            : site.kind === 'fortress'
              ? [627, 465]
              : slots[i];
    districts.push({
      id: `site:${site.id}`,
      kind: 'site',
      title: site.name,
      detail: site.lore,
      at: jitter(`site:${site.id}`, at),
      people: [],
      houses: 1,
      site,
    });
  }
  return {
    settlement: id,
    seed: graphicSeed,
    profile,
    biome: s.biome,
    size,
    water,
    mirror,
    fortification: s.fortification,
    damage,
    title: s.name,
    owner: state.name,
    region: region.name,
    banner: state.color,
    residents: s.population,
    roads,
    occupations: !!s.occupation,
    lore,
    districts,
  };
}
