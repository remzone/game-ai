import {
  BASE_PRICES,
  emptyStocks,
  emptyWorkers,
  type World,
  type Person,
  type Profession,
  type Ancestry,
  type GameEvent,
} from './model.js';
import { seedHash, integer, pick, random } from './rng.js';
export function nextId(w: World, prefix: string): string {
  return `${prefix}${w.nextId++}`;
}
export function event(
  w: World,
  type: string,
  text: string,
  entities: string[] = [],
  historical = false,
): GameEvent {
  const e = { id: nextId(w, 'e'), day: w.day, type, text, entities, historical };
  w.events.push(e);
  return e;
}
export function promote(w: World, id: number) {
  if (!w.npcs[id]) {
    const p = w.people[id];
    w.npcs[id] = {
      person: id,
      name: `${pick(w, ['Эрин', 'Рен', 'Альва', 'Торен', 'Мира', 'Саэль', 'Грим', 'Рада'])} ${id}`,
      biography: `Родом из ${w.settlements[p.settlement].name}`,
      traits: [pick(w, ['осторожный', 'честолюбивый', 'милосердный', 'торговец'])],
      memory: [],
      titles: [],
      relationships: {},
    };
  }
  return w.npcs[id];
}
export function profession(w: World, p: Person, job: Profession) {
  const s = w.settlements[p.settlement];
  if (p.alive) {
    s.workers[p.profession]--;
    s.workers[job]++;
  }
  p.profession = job;
}
export function addPerson(
  w: World,
  settlement: number,
  age: number,
  ancestry: Ancestry,
  parents: number[] = [],
): Person {
  const s = w.settlements[settlement];
  const jobs: Profession[] = [
    'farmer',
    'farmer',
    'farmer',
    'farmer',
    'woodcutter',
    'miner',
    'smith',
    'merchant',
  ];
  const maturation = ancestry.reduce((v, a, i) => v + a * [18, 35, 32, 16, 25, 12][i], 0);
  const p: Person = {
    id: w.people.length,
    parents,
    children: [],
    ancestry,
    sex: pick(w, ['female', 'male'] as const),
    born: w.day - Math.round(age * 360),
    alive: true,
    health: 100,
    profession: age < maturation ? 'child' : pick(w, jobs),
    settlement,
    state: s.state,
    wealth: integer(w, 0, 20),
    experience: 0,
  };
  w.people.push(p);
  s.residents.push(p.id);
  s.population++;
  s.workers[p.profession]++;
  for (const parent of parents) w.people[parent].children.push(p.id);
  return p;
}
export function death(w: World, p: Person, reason: string) {
  if (!p.alive) return;
  p.alive = false;
  p.health = 0;
  const s = w.settlements[p.settlement];
  s.population--;
  s.workers[p.profession]--;
  event(
    w,
    'death',
    `${w.npcs[p.id]?.name ?? `Житель ${p.id}`} умер: ${reason}`,
    [`person:${p.id}`, `settlement:${s.id}`],
    !!w.npcs[p.id],
  );
}
export function createWorld(seed = 'ashen-crown', perSettlement = 60): World {
  const w: World = {
    version: 1,
    seed,
    rng: seedHash(seed),
    nextId: 1,
    day: 0,
    speed: 0,
    people: [],
    npcs: {},
    settlements: [],
    regions: [],
    states: [],
    roads: [],
    caravans: [],
    armies: [],
    wars: [],
    quests: [],
    events: [],
    chronicles: [],
    player: null,
    battle: null,
    director: {
      enabled: false,
      model: 'openai/gpt-4.1-mini',
      cooldownDays: 30,
      budget: 10,
      calls: 0,
      lastDay: -30,
    },
    directorLogs: [],
  };
  const colors = [
    '#b77858',
    '#738f8a',
    '#9982ae',
    '#9caa65',
    '#b39353',
    '#5e90a9',
    '#ab6578',
    '#879eae',
    '#ba9d87',
    '#66876c',
  ];
  const forms = [
    'feudal_monarchy',
    'absolute_monarchy',
    'elective_monarchy',
    'republic',
    'merchant_republic',
    'theocracy',
    'tribal_confederation',
    'military_dictatorship',
    'council_of_nobles',
    'magocracy',
  ];
  for (let i = 0; i < 10; i++)
    w.states.push({
      id: i,
      name: `${pick(w, ['Эль', 'Вар', 'Дор', 'Сар', 'Тор', 'Нор', 'Аль', 'Грим'])}${pick(w, ['дория', 'марк', 'вен', 'гард', 'хейм'])} ${i + 1}`,
      color: colors[i],
      government: forms[i],
      doctrines: [pick(w, ['торговля', 'традиция', 'равенство', 'воинская честь'])],
      ruler: -1,
      capital: i * 30,
      legitimacy: 75,
      tax: 0.12,
      treasury: 3000,
      claims: [],
      relations: Object.fromEntries(
        Array.from({ length: 10 }, (_, j) => [j, j === i ? 100 : integer(w, -15, 25)]),
      ),
    });
  for (let state = 0; state < 10; state++)
    for (let r = 0; r < 5; r++) {
      const region = state * 5 + r;
      w.regions.push({
        id: region,
        state,
        name: `Марка ${region + 1}`,
        capital: w.settlements.length,
        treasury: 0,
      });
      for (let v = 0; v < 6; v++) {
        const id = w.settlements.length,
          x = (state % 5) * 6 + v,
          y = Math.floor(state / 5) * 5 + r;
        const biome = (['plains', 'forest', 'mountain', 'marsh'] as const)[(x * 7 + y * 3) % 4];
        w.settlements.push({
          id,
          name: `${v === 0 ? 'Град' : 'Село'} ${region + 1}-${v + 1}`,
          region,
          state,
          x,
          y,
          biome,
          kind: v === 0 ? 'city' : 'village',
          central: v === 0,
          residents: [],
          population: 0,
          workers: emptyWorkers(),
          stocks: {
            ...emptyStocks(),
            grain: perSettlement * (biome === 'mountain' ? 2 : 12),
            wood: 100,
            stone: 60,
            iron: 40,
            tools: 20,
            weapons: 20,
            horses: 8,
          },
          prices: { ...BASE_PRICES },
          treasury: 1000,
          loyalty: 80,
          infrastructure: 1,
          shortageDays: 0,
          monsters: id % 17 === 0 ? integer(w, 3, 7) : 0,
        });
      }
    }
  const positions = new Map(w.settlements.map((s) => [`${s.x},${s.y}`, s.id]));
  for (const s of w.settlements)
    for (const [dx, dy] of [
      [1, 0],
      [0, 1],
    ]) {
      const b = positions.get(`${s.x + dx},${s.y + dy}`);
      if (b !== undefined)
        w.roads.push({
          a: s.id,
          b,
          days: s.biome === 'mountain' ? 3 : 2,
          blocked: false,
          traffic: 0,
        });
    }
  for (const s of w.settlements) {
    const race = integer(w, 0, 5);
    const ancestry = Array.from({ length: 6 }, (_, i) => (i === race ? 1 : 0)) as Ancestry;
    for (let i = 0; i < perSettlement; i++) {
      const p = addPerson(w, s.id, i < 2 ? 65 : i < 6 ? integer(w, 5, 30) : integer(w, 5, 65), [
        ...ancestry,
      ]);
      if (i >= 2 && i < 6) {
        p.parents = [s.residents[0], s.residents[1]];
        w.people[p.parents[0]].children.push(p.id);
        w.people[p.parents[1]].children.push(p.id);
      }
    }
    // Rebuild workforce once: seeded child ages above may differ from initial rolls.
    s.workers = emptyWorkers();
    for (const id of s.residents) {
      const p = w.people[id];
      if (-p.born / 360 < p.ancestry.reduce((n, a, i) => n + a * [18, 35, 32, 16, 25, 12][i], 0))
        p.profession = 'child';
      s.workers[p.profession]++;
    }
  }
  for (const s of w.states) {
    s.ruler = w.settlements[s.capital].residents[0];
    promote(w, s.ruler).titles.push('Правитель');
  }
  event(
    w,
    'foundation',
    'Десять держав вступают в новую эпоху.',
    w.states.map((s) => `state:${s.id}`),
    true,
  );
  return w;
}
export function movePerson(w: World, p: Person, to: number) {
  const old = w.settlements[p.settlement],
    s = w.settlements[to];
  if (old.id === s.id) return;
  old.residents = old.residents.filter((id) => id !== p.id);
  if (p.alive) {
    old.population--;
    old.workers[p.profession]--;
    s.population++;
    s.workers[p.profession]++;
  }
  s.residents.push(p.id);
  p.settlement = to;
  p.state = s.state;
}
export function route(w: World, from: number, to: number): number[] {
  const distance = new Map<number, number>([[from, 0]]),
    prev = new Map<number, number>(),
    open = new Set([from]);
  while (open.size) {
    const u = [...open].sort((a, b) => distance.get(a)! - distance.get(b)!)[0];
    open.delete(u);
    if (u === to) break;
    for (const edge of w.roads) {
      if (edge.blocked || (edge.a !== u && edge.b !== u)) continue;
      const v = edge.a === u ? edge.b : edge.a,
        d = distance.get(u)! + edge.days;
      if (d < (distance.get(v) ?? Infinity)) {
        distance.set(v, d);
        prev.set(v, u);
        open.add(v);
      }
    }
  }
  if (!distance.has(to)) return [];
  const out = [to];
  while (out[0] !== from) out.unshift(prev.get(out[0])!);
  return out;
}
export function makeJourney(w: World, path: number[]) {
  if (path.length < 2) throw new Error('Путь отсутствует');
  const legs = path
    .slice(1)
    .map(
      (b, i) =>
        w.roads.find((r) => (r.a === path[i] && r.b === b) || (r.b === path[i] && r.a === b))!.days,
    );
  return { route: path, leg: 0, remaining: legs[0], total: legs.reduce((a, b) => a + b, 0) };
}
export function advanceJourney(
  w: World,
  j: ReturnType<typeof makeJourney>,
): 'moving' | 'arrived' | 'blocked' {
  const a = j.route[j.leg],
    b = j.route[j.leg + 1],
    edge = w.roads.find((r) => (r.a === a && r.b === b) || (r.b === a && r.a === b));
  if (!edge || edge.blocked) return 'blocked';
  if (--j.remaining > 0) return 'moving';
  edge.traffic++;
  j.leg++;
  if (j.leg === j.route.length - 1) return 'arrived';
  const next = w.roads.find(
    (r) => (r.a === b && r.b === j.route[j.leg + 1]) || (r.b === b && r.a === j.route[j.leg + 1]),
  )!;
  j.remaining = next.days;
  return 'moving';
}
export function blended(a: Ancestry, b: Ancestry): Ancestry {
  return a.map((v, i) => (v + b[i]) / 2) as Ancestry;
}
