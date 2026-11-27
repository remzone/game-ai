import type { Settlement, World } from './model.js';
import { random, seedHash } from './rng.js';

export type AtlasPoint = [number, number];
export interface Geography {
  width: number;
  height: number;
  coast: AtlasPoint[];
  cells: {
    settlement: number;
    center: AtlasPoint;
    polygon: AtlasPoint[];
    neighbors: number[];
    port: boolean;
  }[];
  rivers: { name: string; points: AtlasPoint[] }[];
}

const width = 1100,
  height = 620;
const sq = (a: AtlasPoint, b: AtlasPoint) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
const dist = (a: AtlasPoint, b: AtlasPoint) => Math.sqrt(sq(a, b));
const edgeKey = (a: number, b: number) => Math.min(a, b) + ':' + Math.max(a, b);
const round = (p: AtlasPoint): AtlasPoint =>
  p.map((n) => Math.round(n * 10000) / 10000) as AtlasPoint;

export function containsPoint(point: AtlasPoint, polygon: AtlasPoint[]) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [x1, y1] = polygon[i],
      [x2, y2] = polygon[j];
    if (
      y1 > point[1] !== y2 > point[1] &&
      point[0] < ((x2 - x1) * (point[1] - y1)) / (y2 - y1) + x1
    )
      inside = !inside;
  }
  return inside;
}
export function landLink(a: AtlasPoint, b: AtlasPoint, coast: AtlasPoint[]) {
  const samples = Math.max(2, Math.ceil(dist(a, b) / 3));
  for (let i = 1; i < samples; i++) {
    const t = i / samples;
    if (!containsPoint([a[0] * (1 - t) + b[0] * t, a[1] * (1 - t) + b[1] * t], coast)) return false;
  }
  return true;
}
export function fromEngineCoordinates(w: World, x: number, y: number): AtlasPoint {
  return [(x * (w.geography?.width ?? width)) / 29, (y * (w.geography?.height ?? height)) / 9];
}
function clip(poly: AtlasPoint[], a: AtlasPoint, b: AtlasPoint) {
  const normal: AtlasPoint = [b[0] - a[0], b[1] - a[1]];
  const d = (b[0] ** 2 + b[1] ** 2 - a[0] ** 2 - a[1] ** 2) / 2;
  const out: AtlasPoint[] = [];
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const p = poly[j],
      q = poly[i];
    const u = p[0] * normal[0] + p[1] * normal[1] - d,
      v = q[0] * normal[0] + q[1] * normal[1] - d;
    if (u > 0 !== v > 0) {
      const k = u / (u - v);
      out.push([p[0] + k * (q[0] - p[0]), p[1] + k * (q[1] - p[1])]);
    }
    if (v <= 0) out.push(q);
  }
  return out;
}
function coastDistance(p: AtlasPoint, coast: AtlasPoint[]) {
  return Math.min(
    ...coast.map((a, i) => {
      const b = coast[(i + 1) % coast.length],
        dx = b[0] - a[0],
        dy = b[1] - a[1];
      const t = Math.max(
        0,
        Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)),
      );
      return dist(p, [a[0] + dx * t, a[1] + dy * t]);
    }),
  );
}
function nearest(p: AtlasPoint, points: AtlasPoint[], except = new Set<number>()) {
  let result = -1,
    best = Infinity;
  points.forEach((q, i) => {
    const d = sq(p, q);
    if (!except.has(i) && d < best) {
      best = d;
      result = i;
    }
  });
  return result;
}
function partition(
  roots: number[],
  graph: number[][],
  points: AtlasPoint[],
  pace: number[],
  allowed?: Set<number>,
) {
  const owner = points.map(() => -1);
  const queue = roots.map((id, group) => ({ id, group, cost: 0 }));
  while (queue.length) {
    queue.sort((a, b) => a.cost - b.cost || a.id - b.id);
    const { id, group, cost } = queue.shift()!;
    if (owner[id] !== -1) continue;
    owner[id] = group;
    for (const next of graph[id])
      if (owner[next] === -1 && (!allowed || allowed.has(next)))
        queue.push({ id: next, group, cost: cost + dist(points[id], points[next]) / pace[group] });
  }
  return owner;
}
export const STARTING_CAPITAL_NAMES = [
  'Переправье',
  'Высокий Предел',
  'Семипечатье',
  'Устьеград',
  'Янтарная Гавань',
  'Светозар',
  'Круг Ольх',
  'Железные Врата',
  'Каменодвор',
  'Синяя Башня',
] as const;
const capitalVariants = [
  ['Переправье', 'Грачий Брод', 'Островерх', 'Надпечье', 'Торжев'],
  ['Высокий Предел', 'Зимний Дол', 'Тальверн', 'Сумрачный Яр', 'Льногорск'],
  ['Семипечатье', 'Войр', 'Чертоград', 'Кровель', 'Медный Двор'],
  ['Устьеград', 'Меловой Ряд', 'Солехлеб', 'Илвена', 'Веретено'],
  ['Янтарная Гавань', 'Карнов', 'Драговал', 'Латунный Свод', 'Горящий Мыс'],
  ['Светозар', 'Сагар', 'Золокамень', 'Белый Прах', 'Седые Кровли'],
  ['Круг Ольх', 'Видар', 'Черноключье', 'Боровая Стража', 'Заросль'],
  ['Железные Врата', 'Чернёный Порог', 'Роган', 'Костяная Межа', 'Холодный Двор'],
  ['Каменодвор', 'Гнейсборг', 'Шахтоград', 'Девять Башен', 'Пепельный Уступ'],
  ['Синяя Башня', 'Лунная Вежа', 'Вайм', 'Волчий Фонарь', 'Чертог Спиц'],
] as const;

/** Display the exact starting capitals before the new-world request, without simulating it. */
export function startingCapitalNames(seed: string): readonly string[] {
  if (seed === 'ashen-crown') return STARTING_CAPITAL_NAMES;
  return capitalVariants.map(
    (options, i) => options[seedHash(`${seed}:capital:${i}:${options[0]}`) % options.length],
  );
}

const riverNames = [
  ['Серебряная Вода', 'Багряная Вода', 'Река Вязов', 'Серый Разлив', 'Плач-Река'],
  ['Ледяная Оправа', 'Тисовая Река', 'Ольховая Нить', 'Воронья Вода', 'Река Чёрной Глины'],
  ['Река Семи Бродов', 'Бурый Плёс', 'Каменка', 'Чёрная Заводь', 'Река Трёх Мельниц'],
] as const;
const names: Record<Settlement['biome'], string[]> = {
  forest: [
    'Ольховье',
    'Сосновый Лог',
    'Мшистый Бор',
    'Тихая Просека',
    'Брусничный Яр',
    'Дымные Кроны',
    'Осиновый Свод',
    'Глухоречье',
  ],
  mountain: [
    'Рудный Ключ',
    'Седой Перевал',
    'Медная Жила',
    'Крутой Склон',
    'Каменные Кровли',
    'Ступень Ветра',
    'Зола Вершин',
    'Кремнёвый Зуб',
  ],
  plains: [
    'Ржаное Поле',
    'Ветролесье',
    'Белые Межи',
    'Журавлиный Луг',
    'Горечавка',
    'Длинный Дол',
    'Яровая Слобода',
    'Светлые Поля',
  ],
  marsh: [
    'Утиная Лука',
    'Серая Гать',
    'Камышовый Плёс',
    'Чёрные Окна',
    'Семь Заводей',
    'Глухая Трясина',
    'Вересковый Омут',
    'Клюквенный Остров',
  ],
};
const qualifiers = [
  '',
  'Первый',
  'Нижний',
  'Верхний',
  'Приозёрный',
  'Старый',
  'Крайний',
  'Заречный',
  'Северный',
  'Речной',
  'Каменистый',
  'Малый',
  'Дальний',
  'Лесной',
  'Новый',
  'Тихий',
];
const realmPace = [1.18, 0.78, 1.03, 1.19, 1.12, 0.91, 1.19, 1.07, 0.88, 0.93];
const capitalTargets: AtlasPoint[] = [
  [285, 303],
  [245, 159],
  [463, 170],
  [711, 139],
  [925, 232],
  [801, 310],
  [502, 365],
  [400, 481],
  [750, 489],
  [595, 238],
];
const realmTreasury = [4000, 3700, 2800, 6400, 8200, 4200, 2350, 5800, 4600, 3400];
const realmTax = [0.1, 0.17, 0.13, 0.09, 0.07, 0.15, 0.06, 0.19, 0.14, 0.12];

function riverPath(
  graph: number[][],
  points: AtlasPoint[],
  elevation: number[],
  from: number,
  to: number,
) {
  const distances = points.map(() => Infinity),
    prev = points.map(() => -1),
    open = new Set<number>([from]),
    done = new Set<number>();
  distances[from] = 0;
  while (open.size) {
    const a = [...open].sort((x, y) => distances[x] - distances[y])[0];
    open.delete(a);
    done.add(a);
    if (a === to) break;
    for (const b of graph[a]) {
      if (done.has(b)) continue;
      const d =
        distances[a] +
        dist(points[a], points[b]) * (1 + Math.max(0, elevation[b] - elevation[a]) * 4);
      if (d < distances[b]) {
        distances[b] = d;
        prev[b] = a;
        open.add(b);
      }
    }
  }
  const path = [to];
  while (path[0] !== from && prev[path[0]] !== -1) path.unshift(prev[path[0]]);
  return path[0] === from ? path : [];
}

export function layOutContinent(w: World, perSettlement: number) {
  const rng = { rng: seedHash(w.seed + ':continent') };
  const phase = random(rng) * Math.PI * 2;
  const outline: AtlasPoint[] = Array.from({ length: 48 }, (_, i) => {
    const a = (i * Math.PI) / 24;
    const amp =
      1 +
      0.13 * Math.sin(3 * a + phase) +
      0.09 * Math.sin(5 * a + 0.7) +
      0.07 * Math.cos(8 * a - phase) +
      0.035 * Math.sin(13 * a);
    return [550 + 477 * Math.cos(a) * amp, 310 + 238 * Math.sin(a) * amp];
  });
  const bounds = ([0, 1] as const).map((i) => {
    const axis = outline.map((p) => p[i]);
    return [Math.min(...axis), Math.max(...axis)] as const;
  });
  const coast: AtlasPoint[] = outline.map(([x, y]) => [
    35 + ((x - bounds[0][0]) / (bounds[0][1] - bounds[0][0])) * (width - 70),
    33 + ((y - bounds[1][0]) / (bounds[1][1] - bounds[1][0])) * (height - 66),
  ]);
  const count = w.settlements.length,
    points: AtlasPoint[] = [];
  for (let n = 0; points.length < count; n++) {
    const p: AtlasPoint = [35 + (width - 70) * random(rng), 33 + (height - 66) * random(rng)];
    if (containsPoint(p, coast) && points.every((q) => sq(p, q) > (n < 20000 ? 18 : 4) ** 2))
      points.push(p);
  }
  // Keep existing capital IDs in the character-creation contract (0, 30, …, 270).
  const reserved = new Set<number>();
  for (const [state, target] of capitalTargets.entries()) {
    const slot = w.states[state].capital,
      closest = nearest(target, points, reserved);
    [points[slot], points[closest]] = [points[closest], points[slot]];
    reserved.add(slot);
  }
  const polys = points.map((p, i) =>
    points.reduce((poly, q, j) => (j === i ? poly : clip(poly, p, q)), coast),
  );
  const graph = points.map(() => [] as number[]);
  for (let i = 0; i < count; i++) {
    const poly = polys[i];
    for (let k = 0; k < poly.length; k++) {
      const a = poly[k],
        b = poly[(k + 1) % poly.length];
      if (sq(a, b) < 0.00001) continue;
      const midpoint: AtlasPoint = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const d = sq(midpoint, points[i]);
      const j = points.findIndex((q, j) => j !== i && Math.abs(sq(midpoint, q) - d) < 0.00001);
      if (j !== -1 && !graph[i].includes(j)) {
        graph[i].push(j);
        graph[j].push(i);
      }
    }
  }
  const paths = graph.map((neighbors, id) =>
    neighbors.filter((next) => landLink(points[id], points[next], coast)),
  );
  const owners = partition(
    w.states.map((s) => s.capital),
    paths,
    points,
    realmPace,
  );
  if (owners.some((id) => id < 0)) throw new Error('Нет связного берега для нового континента');
  const elevation = points.map(([x, y]) => {
    const ridge = 260 + 62 * Math.sin(x / 123) + 15 * Math.sin(x / 39);
    const spine = Math.exp(-(((y - ridge) / 65) ** 2)) * Math.exp(-(((x - 540) / 430) ** 6));
    const massif = Math.exp(-(((x - 340) / 115) ** 2 + ((y - 440) / 71) ** 2));
    return Math.max(spine, massif * 0.9) * (0.82 + random(rng) * 0.3);
  });
  const seaDistances = points.map((p) => coastDistance(p, coast));
  const rivers = (
    [
      [
        [510, 252],
        [988, 250],
      ],
      [
        [551, 200],
        [648, 98],
      ],
      [
        [382, 458],
        [202, 475],
      ],
    ] as [AtlasPoint, AtlasPoint][]
  ).map(([src, dst], i) => {
    const from = nearest(src, points);
    const mouth = coast.reduce((a, b) => (sq(a, dst) < sq(b, dst) ? a : b));
    const to = points
      .map((_, id) => id)
      .sort((a, b) => sq(mouth, points[a]) - sq(mouth, points[b]))
      .find((id) => landLink(points[id], mouth, coast));
    const path = to === undefined ? [] : riverPath(paths, points, elevation, from, to);
    const variants = riverNames[i];
    return {
      name: variants[
        w.seed === 'ashen-crown' ? 0 : seedHash(`${w.seed}:river:${i}`) % variants.length
      ],
      path,
      mouth,
    };
  });
  const riverTowns = new Set(rivers.flatMap((r) => r.path));
  const ports = new Set(rivers.map((r) => r.path.at(-1)).filter((id) => id !== undefined));
  w.regions = [];
  const demographics: number[] = [];
  const nameCounts = new Map<string, number>();
  const weights = w.states.map((s) => (owners.filter((x) => x === s.id).length / count) * 50);
  const regionCounts = weights.map((n) => Math.max(1, Math.floor(n)));
  while (regionCounts.reduce((a, b) => a + b, 0) < 50) {
    const i = regionCounts
      .map((v, i) => weights[i] - v)
      .reduce((a, v, i, all) => (v > all[a] ? i : a), 0);
    regionCounts[i]++;
  }
  while (regionCounts.reduce((a, b) => a + b, 0) > 50) {
    const i = regionCounts
      .map((v, i) => (v > 1 ? v - weights[i] : -Infinity))
      .reduce((a, v, i, all) => (v > all[a] ? i : a), 0);
    regionCounts[i]--;
  }
  const capitals = startingCapitalNames(w.seed);
  for (const state of w.states) {
    const members = owners.flatMap((owner, id) => (owner === state.id ? [id] : []));
    const allowed = new Set(members);
    const roots = [state.capital];
    while (roots.length < regionCounts[state.id]) {
      const next = members
        .filter((id) => !roots.includes(id))
        .sort(
          (a, b) =>
            Math.min(...roots.map((id) => sq(points[b], points[id]))) -
            Math.min(...roots.map((id) => sq(points[a], points[id]))),
        )[0];
      if (next === undefined) break;
      roots.push(next);
    }
    const partitioned = partition(
      roots,
      paths,
      points,
      roots.map(() => 1),
      allowed,
    );
    const first = w.regions.length;
    roots.forEach((root, i) =>
      w.regions.push({
        id: first + i,
        state: state.id,
        name: '',
        capital: root,
        treasury: Math.round((realmTreasury[state.id] / roots.length) * 0.22),
        governor: null,
      }),
    );
    state.treasury = realmTreasury[state.id] + members.length * 35;
    state.tax = realmTax[state.id];
    state.legitimacy = [77, 83, 68, 84, 74, 90, 61, 70, 67, 78][state.id];
    state.electionDay = 210 + Math.floor(random(rng) * 180);
    state.relations = Object.fromEntries(
      w.states.map((o) => [o.id, o.id === state.id ? 100 : Math.floor(random(rng) * 25) - 13]),
    );
    for (const id of members) {
      const place = w.settlements[id],
        p = points[id],
        central = roots.includes(id),
        isCapital = id === state.capital;
      place.x = (p[0] * 29) / width;
      place.y = (p[1] * 9) / height;
      place.state = state.id;
      place.region = first + partitioned[id];
      const river = riverTowns.has(id),
        nearSea = seaDistances[id] < 55;
      const port = ports.has(id) || (central && nearSea);
      if (port) ports.add(id);
      const woodland =
        Math.sin(p[0] / 69) + Math.cos(p[1] / 49 + phase) + Math.sin((p[0] + p[1]) / 87);
      place.biome =
        id === 0
          ? 'plains'
          : elevation[id] > 0.7
            ? 'mountain'
            : elevation[id] < 0.39 && river && p[1] > 326
              ? 'marsh'
              : woodland > 0.2
                ? 'forest'
                : 'plains';
      place.central = central;
      place.kind = isCapital ? 'city' : central || port ? 'town' : 'village';
      const catalog = names[place.biome],
        base = catalog[Math.floor(random(rng) * catalog.length)];
      const occurrences = nameCounts.get(base) ?? 0;
      nameCounts.set(base, occurrences + 1);
      place.name = isCapital
        ? capitals[state.id]
        : occurrences === 0
          ? base
          : occurrences < qualifiers.length
            ? `${base} · ${qualifiers[occurrences]}`
            : `${base} · ${qualifiers[occurrences % qualifiers.length]} ${qualifiers[Math.floor(occurrences / qualifiers.length)] ?? String(occurrences)}`;
      const biomeFactor = { plains: 1.25, forest: 0.92, mountain: 0.54, marsh: 0.67 }[place.biome];
      demographics[id] =
        biomeFactor *
        (isCapital ? 3.2 : central ? 1.75 : port ? 1.22 : 0.8) *
        (river ? 1.3 : 1) *
        (0.76 + random(rng) * 0.49);
      place.infrastructure = 1 + Number(central) + Number(port || (river && central));
      place.fortification = (isCapital ? 2 : central ? 1 : 0) + Number(state.id === 7);
      place.loyalty = Math.floor(
        Math.min(93, Math.max(45, state.legitimacy - 8 + random(rng) * 24)),
      );
      place.treasury = Math.round(
        (isCapital ? 1.95 : central ? 1.4 : 0.65) *
          (state.treasury / 8) *
          (0.78 + random(rng) * 0.49),
      );
      place.monsters =
        id === 0
          ? 5
          : !central && random(rng) < (place.biome === 'forest' ? 0.16 : 0.07)
            ? 2 + Math.floor(random(rng) * 5)
            : 0;
    }
    for (const region of w.regions.slice(first))
      region.name = `Окрестья · ${w.settlements[region.capital].name}`;
  }
  const min = Math.min(perSettlement, 8),
    budget = perSettlement * count;
  const available = budget - min * count,
    sum = demographics.reduce((a, b) => a + b, 0);
  const exact = demographics.map((v) => (available * v) / sum);
  const populations = exact.map((v) => min + Math.floor(v));
  const byRemainder = points.map((_, i) => i).sort((a, b) => (exact[b] % 1) - (exact[a] % 1));
  const missing = budget - populations.reduce((a, b) => a + b, 0);
  for (let i = 0; i < missing; i++) populations[byRemainder[i]]++;
  for (const s of w.settlements) {
    const mountain = s.biome === 'mountain',
      forest = s.biome === 'forest',
      river = riverTowns.has(s.id),
      port = ports.has(s.id),
      pop = populations[s.id];
    const grain =
      s.id === 0 ? 10 : mountain ? 2.0 : s.biome === 'marsh' ? 4 : s.biome === 'forest' ? 5 : 9.5;
    const grainFactor = [1.15, 0.93, 1, 1.46, 1.09, 0.97, 1.08, 0.86, 1.03, 0.94][s.state];
    const ironFactor = [0.82, 0.97, 1.18, 0.57, 0.82, 0.62, 1.02, 1.65, 1.32, 0.9][s.state];
    s.stocks = {
      grain: Math.max(
        s.id === 0 ? 190 : 15,
        Math.round(pop * grain * grainFactor * (river ? 1.33 : 1) * (0.82 + 0.39 * random(rng))),
      ),
      wood: Math.round((forest ? 175 : 56) * (0.78 + random(rng) * 0.42) + (port ? 32 : 0)),
      stone: Math.round((mountain ? 153 : 48) * (0.78 + random(rng) * 0.42)),
      iron: Math.round((mountain ? 103 : 25) * ironFactor * (0.67 + random(rng) * 0.65)),
      tools: s.central ? 22 : 8 + Math.floor(random(rng) * 10),
      weapons: s.id === 0 ? 35 : s.central ? 22 : 6 + Math.floor(random(rng) * 8),
      horses: Math.round((s.biome === 'plains' ? 13 : 4) * (0.75 + random(rng) * 0.65)),
    };
    s.prices = {
      grain: mountain ? 4 : river ? 1 : 2,
      wood: forest ? 3 : 4,
      stone: mountain ? 2 : 6,
      iron: mountain ? 5 : 10,
      tools: port ? 17 : 20,
      weapons: port ? 34 : 36,
      horses: s.biome === 'plains' ? 54 : 68,
    };
  }
  w.roads = [];
  const links = new Set<string>(),
    routeLinks = new Set(
      rivers.flatMap((r) => r.path.slice(1).map((id, i) => edgeKey(id, r.path[i]))),
    );
  for (const [a, neighbors] of paths.entries())
    for (const b of neighbors)
      if (a < b) {
        const key = edgeKey(a, b);
        if (links.has(key)) continue;
        links.add(key);
        const roadDays =
          Math.max(1, Math.round(dist(points[a], points[b]) / 24)) +
          Number(
            (w.settlements[a].biome === 'mountain' || w.settlements[b].biome === 'mountain') &&
              !routeLinks.has(key),
          );
        w.roads.push({ a, b, days: roadDays, blocked: false, traffic: 0 });
      }
  const borders = new Map<string, { a: number; b: number; trade: number; rivalry: number }>();
  for (const { a, b } of w.roads) {
    const left = w.settlements[a],
      right = w.settlements[b];
    if (left.state === right.state) continue;
    const key = edgeKey(left.state, right.state);
    const entry = borders.get(key) ?? { a: left.state, b: right.state, trade: 0, rivalry: 0 };
    entry.trade +=
      Number(routeLinks.has(edgeKey(a, b))) * 3 +
      Number(left.central || right.central) +
      Number(ports.has(a) || ports.has(b)) * 2;
    entry.rivalry +=
      Number(left.biome !== right.biome) +
      Number(left.biome === 'mountain' || right.biome === 'mountain');
    borders.set(key, entry);
  }
  const candidates = [...borders.values()].sort((a, b) => b.trade - a.trade);
  const allies = new Set(candidates.slice(0, 3).map(({ a, b }) => edgeKey(a, b)));
  for (const { a, b, trade, rivalry } of candidates) {
    const partners = allies.has(edgeKey(a, b));
    w.states[a].relations[b] = w.states[b].relations[a] = partners
      ? 38 + Math.min(12, trade)
      : Math.max(-45, -7 - rivalry * 2);
    if (partners)
      w.treaties.push({
        id: `founding-trade-${a}-${b}`,
        a,
        b,
        type: 'trade',
        until: 180 + Math.floor(random(rng) * 180),
      });
  }
  w.geography = {
    width,
    height,
    coast: coast.map(round),
    cells: points.map((center, settlement) => ({
      settlement,
      center: round(center),
      polygon: polys[settlement].map(round),
      neighbors: graph[settlement].sort((a, b) => a - b),
      port: ports.has(settlement),
    })),
    rivers: rivers
      .filter((r) => r.path.length > 1)
      .map((r) => ({
        name: r.name,
        points: [...r.path.map((id) => round(points[id])), round(r.mouth)],
      })),
  };
  return populations;
}
