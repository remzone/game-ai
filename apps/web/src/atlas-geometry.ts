import type { View } from './types';

export type Point = [number, number];
export type Side = [Point, Point];
export type Town = View['settlements'][number];
export type Chart = {
  width: number;
  height: number;
  coast: Point[];
  cells: { settlement: number; center: Point; polygon: Point[]; port: boolean }[];
  rivers: { name: string; points: Point[] }[];
  town: (s: Town) => Point;
  legacy: boolean;
};
const nx = 30;
const ny = 10;
export const noise = (x: number, y: number) => {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n) - 0.5;
};
export const line = ([a, b]: Side) => `M${a[0]},${a[1]}L${b[0]},${b[1]}`;
export const points = (p: Point[]) => p.map((q) => q.join(',')).join(' ');

/** Short inking strokes follow the simulation coast; only the drawing gains coves and texture. */
export function engravedCoast(coast: Point[]) {
  const line = coast.flatMap(([ax, ay], i): Point[] => {
    const [bx, by] = coast[(i + 1) % coast.length];
    const dx = bx - ax,
      dy = by - ay;
    const len = Math.hypot(dx, dy);
    if (len < 13) return [[ax, ay]];
    const cuts = Math.ceil(len / 7);
    return Array.from({ length: cuts }, (_, k): Point => {
      const t = k / cuts,
        x = ax + t * dx,
        y = ay + t * dy;
      const feather = Math.sin(t * Math.PI);
      const ink = feather * (2.4 * Math.sin(t * 9 + ax * 0.13) + 3.2 * noise(x * 0.21, y * 0.44));
      return [x - (dy / len) * ink, y + (dx / len) * ink];
    });
  });
  if (!line.length) return '';
  const xy = (p: Point) => p.map((v) => v.toFixed(2)).join(',');
  const midpoint = (p: Point, q: Point): Point => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  return (
    'M' +
    xy(midpoint(line.at(-1)!, line[0])) +
    line.map((p, i) => 'Q' + xy(p) + ' ' + xy(midpoint(p, line[(i + 1) % line.length]))).join('') +
    'Z'
  );
}

function archivalProjection(x: number, y: number): Point {
  const u = x / nx;
  const v = y / ny;
  const left = 67 + Math.sin(v * Math.PI * 2.2 - 0.45) * 49 + Math.sin(v * 15) * 10;
  const right = 1025 - Math.sin(v * Math.PI * 1.5 + 0.2) * 49 + Math.sin(v * 13) * 15;
  const top = 123 - Math.sin(u * Math.PI * 1.7 - 0.2) * 73 + Math.sin(u * 26) * 15;
  const bottom = 515 + Math.sin(u * Math.PI * 2.7 - 0.1) * 29 - Math.sin(u * 19) * 18;
  return [
    left + u * (right - left) + Math.sin(v * 4 + u * 5) * 14 + noise(x, y) * 17,
    top + v * (bottom - top) + Math.sin(u * 10 + v * 5) * 7 + noise(y + 23, x) * 14,
  ];
}
const historicCoast = [
  ...Array.from({ length: nx + 1 }, (_, i) => archivalProjection(i, 0)),
  ...Array.from({ length: ny }, (_, i) => archivalProjection(nx, i + 1)),
  ...Array.from({ length: nx }, (_, i) => archivalProjection(nx - 1 - i, ny)),
  ...Array.from({ length: ny - 1 }, (_, i) => archivalProjection(0, ny - 1 - i)),
];

export function projectAtlas(world: View): Chart {
  // Real new-game topography exists on the server and is part of the save.
  // The conversion below is only for newly founded settlements outside its initial cell list.
  const geo = world.geography;
  if (geo?.cells.length) {
    const byID = new Map(geo.cells.map((cell) => [cell.settlement, cell.center]));
    return {
      ...geo,
      legacy: false,
      town: (s) => byID.get(s.id) ?? [(s.x * geo.width) / 29, (s.y * geo.height) / 9],
    };
  }
  const p = archivalProjection;
  return {
    width: 1100,
    height: 620,
    coast: historicCoast,
    rivers: [],
    legacy: true,
    town: (s) => p(s.x + 0.5, s.y + 0.5),
    cells: world.settlements
      .filter((s) => Number.isInteger(s.x) && Number.isInteger(s.y))
      .map((s) => ({
        settlement: s.id,
        center: p(s.x + 0.5, s.y + 0.5),
        port: false,
        polygon: [p(s.x, s.y), p(s.x + 1, s.y), p(s.x + 1, s.y + 1), p(s.x, s.y + 1)],
      })),
  };
}

function pointKey(p: Point) {
  // Voronoi vertices of adjacent cells may differ by machine rounding.
  return p.map((n) => Math.round(n * 50)).join(',');
}
export function borders(chart: Chart, towns: Map<number, Town>) {
  const edges = new Map<string, { side: Side; town: Town }>();
  const out: { kind: 'state' | 'region'; side: Side; owners?: [number, number] }[] = [];
  for (const cell of chart.cells) {
    const town = towns.get(cell.settlement);
    if (!town || cell.polygon.length < 3) continue;
    for (let i = 0; i < cell.polygon.length; i++) {
      const a = cell.polygon[i],
        b = cell.polygon[(i + 1) % cell.polygon.length];
      const from = pointKey(a),
        to = pointKey(b);
      if (from === to) continue;
      const key = from < to ? `${from}:${to}` : `${to}:${from}`;
      const previous = edges.get(key);
      if (!previous) edges.set(key, { side: [a, b], town });
      else if (previous.town.id !== town.id) {
        if (previous.town.state !== town.state)
          out.push({
            kind: 'state',
            side: previous.side,
            owners: [previous.town.state, town.state],
          });
        else if (previous.town.region !== town.region)
          out.push({ kind: 'region', side: previous.side });
      }
    }
  }
  return out;
}

export function pointInCoast(at: Point, coast: Point[]) {
  let inside = false;
  for (let i = 0, j = coast.length - 1; i < coast.length; j = i++) {
    const [ax, ay] = coast[i];
    const [bx, by] = coast[j];
    if (ay > at[1] !== by > at[1] && at[0] < ax + ((bx - ax) * (at[1] - ay)) / (by - ay))
      inside = !inside;
  }
  return inside;
}

// Follow the real river points with gently curved segments, with explicit endpoints retained.
export function smoothRiver(seq: Point[]) {
  const start = seq[0];
  if (!start) return '';
  const controls = seq.slice(1, -1).map((p, i) => {
    const next = seq[i + 2];
    return `Q${p.join(',')} ${(p[0] + next[0]) / 2},${(p[1] + next[1]) / 2}`;
  });
  return `M${start.join(',')} ${controls.join(' ')} L${seq[seq.length - 1].join(',')}`;
}
