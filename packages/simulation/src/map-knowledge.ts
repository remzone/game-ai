import type { World } from './model.js';
import { route } from './world.js';

export const WORLD_CHART_PRICE = 45;
export interface MapKnowledge {
  chart: boolean;
  explored: number[];
}
export interface PlayerMapView {
  chart: boolean;
  known: number[];
  visible: number[];
  chartPrice: number;
  chartForSale: boolean;
}

type MapContext = Pick<
  World,
  'roads' | 'settlements' | 'geography' | 'player' | 'people' | 'sieges'
>;

function nearby(w: MapContext, here: number) {
  const links = new Map<number, number[]>();
  for (const road of w.roads) {
    links.set(road.a, [...(links.get(road.a) ?? []), road.b]);
    links.set(road.b, [...(links.get(road.b) ?? []), road.a]);
  }
  const known = new Set([here]);
  let layer = [here];
  for (let depth = 0; depth < 2; depth++) {
    const next: number[] = [];
    for (const id of layer)
      for (const neighbor of links.get(id) ?? []) {
        if (known.has(neighbor)) continue;
        known.add(neighbor);
        next.push(neighbor);
      }
    layer = next;
  }
  return known;
}

export function rememberMap(w: MapContext) {
  const p = w.player,
    hero = p && w.people[p.person];
  if (!w.geography || !p || !hero?.alive) return;
  p.mapKnowledge ??= { chart: false, explored: p.visited.filter((id) => !!w.settlements[id]) };
  const old = new Set(p.mapKnowledge.explored);
  for (const id of nearby(w, hero.settlement)) old.add(id);
  if (old.size !== p.mapKnowledge.explored.length)
    p.mapKnowledge.explored = [...old].sort((a, b) => a - b);
}

export function chartForSale(w: MapContext) {
  const p = w.player,
    hero = p && w.people[p.person];
  return !!(
    w.geography &&
    p &&
    hero?.alive &&
    !p.gameOver &&
    !p.mapKnowledge?.chart &&
    !p.journey &&
    p.scene !== 'battle' &&
    w.settlements[hero.settlement]?.kind === 'city' &&
    !w.sieges.some((siege) => siege.status === 'active' && siege.settlement === hero.settlement)
  );
}

export function mapProjection(w: MapContext): PlayerMapView | undefined {
  const p = w.player,
    hero = p && w.people[p.person];
  // No artificial discovery model on older grid saves without geographical cells.
  if (!w.geography || !p || !hero) return;
  const visible = nearby(w, hero.settlement);
  const known = p.mapKnowledge?.chart
    ? w.settlements.map((s) => s.id)
    : [
        ...new Set([
          ...(p.mapKnowledge?.explored ?? p.visited),
          ...visible,
          ...(p.journey?.route ?? []),
        ]),
      ]
        .filter((id) => !!w.settlements[id])
        .sort((a, b) => a - b);
  return {
    chart: !!p.mapKnowledge?.chart,
    known,
    visible: [...visible].sort((a, b) => a - b),
    chartPrice: WORLD_CHART_PRICE,
    chartForSale: chartForSale(w),
  };
}

export function knownRoute(
  world: Pick<World, 'roads'>,
  from: number,
  to: number,
  chart?: Pick<PlayerMapView, 'chart' | 'known'>,
) {
  if (!chart || chart.chart) return route(world, from, to);
  const known = new Set(chart.known);
  if (!known.has(to)) return [];
  return route({ roads: world.roads.filter((r) => known.has(r.a) && known.has(r.b)) }, from, to);
}
