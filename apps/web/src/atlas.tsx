import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
} from 'react';
import { emblems, type AtlasWorld, type Command, type RoadActor } from '@living-world/simulation';
import type { View } from './types';

import {
  borders,
  engravedCoast,
  line,
  points,
  projectAtlas,
  smoothRiver,
  type Point,
} from './atlas-geometry';
import {
  CartographicCoast,
  CartographicLand,
  CartographicTown,
  CartographicWords,
  CartographyDefs,
  drawCartography,
} from './atlas-cartography';
import { AtlasFieldbook, AtlasSiteMarker } from './atlas-legend';
import { AtlasHero, type HeroRoute } from './atlas-hero';
import { AtlasRoadLedger, AtlasRoadMarkers } from './atlas-road-life';
import './atlas-layout.css';
import './atlas-cartography.css';
import './atlas-scroll.css';
import './atlas-fog.css';

const terrainName = { forest: 'Лес', plains: 'Равнина', mountain: 'Горы', marsh: 'Топи' };

export function Atlas({
  world,
  selected,
  onSelect,
  onRealm,
  send,
}: {
  world: View;
  selected: number;
  onSelect: (id: number) => void;
  onRealm: (id: number) => void;
  send: (c: Command) => Promise<boolean>;
}) {
  const [layer, setLayer] = useState<'atlas' | 'political'>('atlas');
  const [roads, setRoads] = useState(false);
  const [activity, setActivity] = useState(true);
  const [actor, setActor] = useState<string | null>(null);
  const [roadKinds, setRoadKinds] = useState({
    army: true,
    band: true,
    caravan: true,
    merchant: true,
  });
  const [record, setRecord] = useState<'history' | number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [zoom, setZoom] = useState(() =>
    world.mapKnowledge && !world.mapKnowledge.chart ? 2.1 : 1,
  );
  const [focusAt, setFocusAt] = useState<Point | null>(null);
  const [dragging, setDragging] = useState(false);
  const [aspect, setAspect] = useState(1100 / 620);
  const [paperWidth, setPaperWidth] = useState(1100);
  const paper = useRef<HTMLDivElement>(null);
  const press = useRef<{ id: number; x: number; y: number; start: Point; moved: boolean } | null>(
    null,
  );
  const ignoreClick = useRef(false);
  const riverId = useId();
  const atlas = world.atlasWorld;
  const knowledge = world.mapKnowledge;
  const explored = new Set(knowledge?.known);
  const visible = new Set(knowledge?.visible);
  const fog = !!knowledge && !knowledge.chart;
  const mapped = (id: number) => !fog || explored.has(id);
  const witnessed = (id: number) => !knowledge || visible.has(id);
  const fogId = useId();
  const knownTowns = world.settlements.filter((s) => mapped(s.id));
  const knownStates = new Set(knownTowns.map((s) => s.state));
  const fieldAtlas =
    atlas && fog
      ? {
          ...atlas,
          sites: atlas.sites.filter((site) => mapped(site.settlement)),
          history: atlas.history.filter(
            (e) =>
              e.site == null ||
              atlas.sites.some((site) => site.id === e.site && mapped(site.settlement)),
          ),
          scenario: {
            ...atlas.scenario,
            campaign: undefined,
            roles: atlas.scenario.roles.filter((role) => knownStates.has(role.state)),
          },
        }
      : atlas;
  useEffect(() => {
    setRecord(null);
    setActor(null);
  }, [world.seed]);
  useEffect(() => {
    if (!paper.current) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width && height) {
        setAspect(width / height);
        setPaperWidth(width);
      }
    });
    observer.observe(paper.current);
    return () => observer.disconnect();
  }, []);
  const states = new Map(world.states.map((state) => [state.id, state]));
  const towns = new Map(world.settlements.map((s) => [s.id, s]));
  const chart = useMemo(() => projectAtlas(world), [world.geography, world.settlements]);
  const { coast, width: W, height: H, town: townPoint } = chart;
  const inkCoast = useMemo(() => engravedCoast(coast), [coast]);
  const geometryKey = `${world.seed}:${world.geography?.coast.map((p) => p.join(',')).join('|') ?? 'legacy'}:${chart.cells.length}`;
  const cartoCache = useRef<{ key: string; drawing: ReturnType<typeof drawCartography> } | null>(
    null,
  );
  if (cartoCache.current?.key !== geometryKey)
    cartoCache.current = { key: geometryKey, drawing: drawCartography(chart, towns) };
  const carto = cartoCache.current.drawing;
  const fitX = Math.max(W, H * aspect) / zoom;
  const fitY = Math.max(H, W / aspect) / zoom;
  const clampView = ([x, y]: Point, scale = zoom): Point => {
    const halfX = Math.max(W, H * aspect) / scale / 2;
    const halfY = Math.max(H, W / aspect) / scale / 2;
    return [
      halfX >= W / 2 ? W / 2 : Math.min(W - halfX, Math.max(halfX, x)),
      halfY >= H / 2 ? H / 2 : Math.min(H - halfY, Math.max(halfY, y)),
    ];
  };
  const home = world.hero && towns.get(world.hero.settlement);
  const center = clampView(focusAt ?? (fog && zoom > 1 && home ? townPoint(home) : [W / 2, H / 2]));
  const goZoom = (amount: number) => {
    const next = Math.min(4, Math.max(1, zoom * amount));
    const target = towns.get(selected);
    setFocusAt(
      next === 1 ? null : clampView(zoom === 1 && target ? townPoint(target) : center, next),
    );
    setZoom(next);
  };
  const panStart = (event: PointerEvent<SVGSVGElement>) => {
    if (zoom <= 1 || (event.pointerType === 'mouse' && event.button !== 0)) return;
    ignoreClick.current = false;
    press.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      start: center,
      moved: false,
    };
  };
  const panMove = (event: PointerEvent<SVGSVGElement>) => {
    const info = press.current;
    if (!info || info.id !== event.pointerId) return;
    const dx = event.clientX - info.x;
    const dy = event.clientY - info.y;
    if (!info.moved && Math.hypot(dx, dy) < 6) return;
    if (!info.moved) {
      info.moved = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      setDragging(true);
    }
    const box = event.currentTarget.getBoundingClientRect();
    setFocusAt(
      clampView([
        info.start[0] - (dx * fitX) / box.width,
        info.start[1] - (dy * fitY) / box.height,
      ]),
    );
  };
  const panEnd = (event: PointerEvent<SVGSVGElement>) => {
    const info = press.current;
    if (!info || info.id !== event.pointerId) return;
    press.current = null;
    if (info.moved) {
      ignoreClick.current = true;
      setTimeout(() => {
        ignoreClick.current = false;
      }, 120);
      setDragging(false);
    }
  };
  const portIds = new Set(chart.cells.filter((c) => c.port).map((c) => c.settlement));
  const edges = borders(chart, new Map(knownTowns.map((s) => [s.id, s])));
  const front = new Set(
    world.wars
      .filter((w) => w.active && knownStates.has(w.a) && knownStates.has(w.b))
      .map((w) => [w.a, w.b].sort((a, b) => a - b).join(':')),
  );
  const frontier = edges.filter(
    (edge) => edge.owners && front.has([...edge.owners].sort((a, b) => a - b).join(':')),
  );
  const surveyedCells = fog ? chart.cells.filter((c) => mapped(c.settlement)) : [];
  const exploredTerrain = fog ? surveyedCells.map((c) => `M${points(c.polygon)}Z`).join(' ') : '';
  const placement = new Map<number, Point>();
  const occupiedNames: Point[] = [];
  for (const state of world.states) {
    const owned = chart.cells.filter(
      (cell) => mapped(cell.settlement) && towns.get(cell.settlement)?.state === state.id,
    );
    if (!owned.length) continue;
    const [x, y] = owned.reduce<Point>(
      (memo, cell) => [
        memo[0] + cell.center[0] / owned.length,
        memo[1] + cell.center[1] / owned.length,
      ],
      [0, 0],
    );
    const prioritized = owned
      .map((cell) => ({
        cell,
        score:
          Math.hypot(cell.center[0] - x, cell.center[1] - y) +
          occupiedNames.reduce(
            (total, p) =>
              total +
              Math.max(
                0,
                1 - Math.hypot((p[0] - cell.center[0]) / 110, (p[1] - cell.center[1]) / 42),
              ) *
                240,
            0,
          ),
      }))
      .sort((a, b) => a.score - b.score);
    const anchor: Point = [prioritized[0].cell.center[0], prioritized[0].cell.center[1] - 12];
    placement.set(state.id, anchor);
    occupiedNames.push(anchor);
  }
  const selectedTown = towns.get(selected);
  const selectedState = selectedTown?.state;
  const selectedSite =
    typeof record === 'number' ? fieldAtlas?.sites.find((site) => site.id === record) : undefined;
  const siteScale = Math.min(1.34, Math.max(0.76, (aspect < 1 ? 1.36 : 1) / Math.sqrt(zoom)));
  const siteMarks: { site: AtlasWorld['sites'][number]; anchor: Point; at: Point }[] = [];
  const pickSite = (id: number, centerOnSite = false) => {
    const site = fieldAtlas?.sites.find((s) => s.id === id);
    const town = site && towns.get(site.settlement);
    if (!town) return;
    setRecord(id);
    onSelect(town.id);
    if (centerOnSite) {
      const next = Math.max(zoom, aspect < 1 ? 2.55 : 1.65);
      setZoom(next);
      setFocusAt(clampView(townPoint(town), next));
    }
  };
  const importantPoints = knownTowns
    .filter(
      (s) =>
        s.id === selected ||
        s.id === world.hero?.settlement ||
        world.states.some((st) => st.capital === s.id),
    )
    .map(townPoint);
  for (const site of [...(fieldAtlas?.sites ?? [])].sort(
    (a, b) =>
      Number(b.id === atlas?.scenario.focalSite) - Number(a.id === atlas?.scenario.focalSite),
  )) {
    const town = towns.get(site.settlement);
    if (!town) continue;
    const anchor = townPoint(town);
    const [x, y] = anchor;
    const shift = 15 * siteScale;
    const candidates: Point[] = [
      [x, y - shift],
      [x + shift, y],
      [x - shift, y],
      [x, y + shift],
      [x, y - shift * 2],
      [x + shift * 2, y],
      [x - shift * 2, y],
      [x, y + shift * 2],
    ];
    const penalty = (p: Point) =>
      Math.hypot(p[0] - x, p[1] - y) +
      siteMarks.reduce(
        (n, other) =>
          n + Math.max(0, 30 * siteScale - Math.hypot(p[0] - other.at[0], p[1] - other.at[1])) * 45,
        0,
      ) +
      importantPoints.reduce(
        (n, other) =>
          n + Math.max(0, 15 * siteScale - Math.hypot(p[0] - other[0], p[1] - other[1])) * 35,
        0,
      );
    const at = candidates.sort((a, b) => penalty(a) - penalty(b))[0];
    siteMarks.push({ site, anchor, at });
  }
  // One shared collision budget protects map titles, site glyphs and sovereign labels.
  type Box = [number, number, number, number];
  const boxes: Box[] = siteMarks.map(({ at: [x, y] }) => [
    x - 15 * siteScale,
    y - 15 * siteScale,
    x + 15 * siteScale,
    y + 15 * siteScale,
  ]);
  const fitLabel = (label: string, [x, y]: Point, size: number, placements: Point[]) => {
    const width = size * (label.length * 0.58 + 0.9);
    for (const [dx, dy] of placements) {
      const at: Point = [x + dx, y + dy];
      const [a, b] = at;
      const box: Box = [a - width / 2, b - size, a + width / 2, b + size * 0.35];
      if (
        box[0] < center[0] - fitX / 2 + 3 ||
        box[1] < center[1] - fitY / 2 + 3 ||
        box[2] > center[0] + fitX / 2 - 3 ||
        box[3] > center[1] + fitY / 2 - 3 ||
        boxes.some(([l, t, r, d]) => l < box[2] && r > box[0] && t < box[3] && d > box[1])
      )
        continue;
      boxes.push(box);
      return at;
    }
  };
  const realmLabels = new Map<number, Point>();
  const townLabels = new Map<number, Point>();
  const shorten = (value: string) => (value.length > 24 ? value.slice(0, 23) + '…' : value);
  if (layer === 'political')
    for (const st of world.states) {
      const p = placement.get(st.id);
      const at =
        p &&
        fitLabel(shorten(st.name), p, 15 / Math.sqrt(zoom), [
          [0, -4],
          [0, 16],
          [-18, -15],
          [18, 26],
          [0, -27],
        ]);
      if (at) realmLabels.set(st.id, at);
    }
  const townSize = 15 / Math.sqrt(zoom);
  const detailTowns =
    zoom < 1.74
      ? []
      : knownTowns
          .map((town) => ({ town, at: townPoint(town) }))
          .filter(
            ({ at: [x, y] }) =>
              Math.abs(x - center[0]) < fitX * 0.47 && Math.abs(y - center[1]) < fitY * 0.46,
          )
          .sort(
            (a, b) =>
              (Number(b.town.central) - Number(a.town.central)) * 200 +
              Math.hypot(a.at[0] - center[0], a.at[1] - center[1]) -
              Math.hypot(b.at[0] - center[0], b.at[1] - center[1]),
          )
          .slice(0, aspect > 1 ? 12 : 5)
          .map(({ town }) => town.id);
  for (const id of new Set([
    selected,
    world.hero?.settlement ?? -1,
    hover ?? -1,
    ...((layer !== 'political' && aspect > 1) || zoom > 1.25
      ? world.states.map((s) => s.capital)
      : []),
    ...detailTowns,
  ])) {
    const town = towns.get(id);
    if (!town || !mapped(town.id)) continue;
    const at = fitLabel(shorten(town.name), townPoint(town), townSize, [
      [0, 17],
      [0, -23],
      [17, 26],
      [-17, 26],
      [0, 38],
      [0, -42],
    ]);
    if (at) townLabels.set(id, at);
  }
  const hoveredTown = towns.get(hover ?? selected);
  const capitalIds = new Set(world.states.map((s) => s.capital));
  const landmarkIds = new Set<number>();
  const clearings: Point[] = [];
  const byImportance = [...knownTowns].sort((a, b) => {
    const rank = (s: typeof a) =>
      Number(capitalIds.has(s.id)) * 3000 +
      Number(portIds.has(s.id)) * 2000 +
      Number(s.kind === 'ruins') * 1500 +
      Number(s.central) * 1200 +
      s.population;
    return rank(b) - rank(a);
  });
  for (const settlement of byImportance) {
    const at = townPoint(settlement);
    const capital = capitalIds.has(settlement.id);
    const port = portIds.has(settlement.id);
    const ruins = settlement.kind === 'ruins';
    const town = settlement.central || settlement.kind === 'town' || settlement.kind === 'city';
    const mustShow =
      capital ||
      port ||
      ruins ||
      settlement.id === selected ||
      settlement.id === world.hero?.settlement;
    const gap = zoom > 1.6 ? 15 : town ? 24 : 28;
    if (!mustShow && clearings.some((p) => Math.hypot(at[0] - p[0], at[1] - p[1]) < gap)) continue;
    landmarkIds.add(settlement.id);
    clearings.push(at);
  }
  const profile = selectedState == null ? undefined : states.get(selectedState);
  const travel = world.player?.journey;
  const traveler = world.hero && towns.get(world.hero.settlement);
  const routeToAnimate =
    travel &&
    travel.route.map((id) => {
      const point = towns.get(id);
      return point && townPoint(point);
    });
  const a = travel?.route[travel.leg];
  const b = travel?.route[travel.leg + 1];
  const segment =
    a === undefined || b === undefined
      ? undefined
      : world.roads.find(
          (road) => (road.a === a && road.b === b) || (road.a === b && road.b === a),
        );
  const heroRoute: HeroRoute | undefined =
    travel && routeToAnimate?.length && routeToAnimate.every((p): p is Point => p !== undefined)
      ? {
          key: travel.route.join(':'),
          points: routeToAnimate,
          progress:
            travel.leg +
            (segment
              ? Math.min(1, Math.max(0, 1 - travel.remaining / Math.max(1, segment.days)))
              : 0),
        }
      : undefined;
  const routePoints = travel
    ? travel.route.slice(travel.leg).flatMap((id) => {
        const town = towns.get(id);
        return town ? [townPoint(town)] : [];
      })
    : [];
  const roadActors = world.roadActors ?? [];
  const filteredActors = roadActors.filter((a) => roadKinds[a.kind]);
  const focusedActor = filteredActors.find((a) => a.id === actor);
  function chooseActor(id: string | null, center = false) {
    setActor(id);
    setRecord(null);
    const entity = center && filteredActors.find((a) => a.id === id);
    if (entity && zoom > 1) {
      const town = towns.get(entity.at);
      if (town) setFocusAt(clampView(townPoint(town)));
    }
  }
  function toggleKind(kind: RoadActor['kind']) {
    if (focusedActor?.kind === kind) setActor(null);
    setRoadKinds((flags) => ({ ...flags, [kind]: !flags[kind] }));
  }
  const sieges = new Set(
    world.sieges
      .filter((s) => s.status === 'active' && witnessed(s.settlement))
      .map((s) => s.settlement),
  );
  const stats = useMemo(
    () => ({
      roadPaths: world.roads.map((road) => {
        const a = world.settlements[road.a],
          b = world.settlements[road.b];
        return a && b && mapped(a.id) && mapped(b.id)
          ? {
              ...road,
              path: line([townPoint(a), townPoint(b)]),
              scenic:
                a.foundedDay !== undefined ||
                b.foundedDay !== undefined ||
                ((a.central || b.central) && landmarkIds.has(a.id) && landmarkIds.has(b.id)),
            }
          : null;
      }),
    }),
    [world.roads, towns, townPoint, landmarkIds, knowledge],
  );
  return (
    <div
      className={`atlas atlas-adventure ${chart.legacy ? 'atlas-archival' : 'atlas-natural'} ${layer === 'political' ? 'is-political' : 'is-terrain'} is-ink-map`}
      aria-label="Игровая карта континента"
      style={{ '--atlas-label-scale': Math.sqrt(zoom) } as CSSProperties}
    >
      {atlas && (
        <div className="atlas-titleplate">
          <span aria-hidden="true">◈</span>
          <small>АТЛАС ОБИТАЕМЫХ ЗЕМЕЛЬ</small>
          <span aria-hidden="true">◈</span>
        </div>
      )}
      <div className="atlas-toolbar">
        <div className="atlas-segments">
          <button aria-pressed={layer === 'political'} onClick={() => setLayer('political')}>
            Державы
          </button>
          <button aria-pressed={layer === 'atlas'} onClick={() => setLayer('atlas')}>
            Атлас
          </button>
          {atlas && (
            <button
              aria-pressed={record === 'history'}
              onClick={() => setRecord(record === 'history' ? null : 'history')}
            >
              Хроника
            </button>
          )}
          <button aria-pressed={roads} onClick={() => setRoads(!roads)}>
            Дороги
          </button>
          <button aria-pressed={activity} onClick={() => setActivity(!activity)}>
            События и путники
          </button>
        </div>
        <div className="atlas-segments" aria-label="Масштаб карты">
          <button
            aria-label="Уменьшить карту"
            disabled={zoom <= 1}
            onClick={() => goZoom(1 / 1.34)}
          >
            −
          </button>
          <button aria-label="Увеличить карту" disabled={zoom >= 4} onClick={() => goZoom(1.34)}>
            +
          </button>
        </div>
      </div>
      <div
        ref={paper}
        className={`atlas-paper${zoom > 1 ? ' can-pan' : ''}${dragging ? ' is-panning' : ''}`}
      >
        <svg
          viewBox={`${center[0] - fitX / 2} ${center[1] - fitY / 2} ${fitX} ${fitY}`}
          aria-label="Карта владений, поселений и столиц"
          onPointerDown={panStart}
          onPointerMove={panMove}
          onPointerUp={panEnd}
          onPointerCancel={panEnd}
          onPointerLeave={(event) => {
            if (!press.current?.moved) panEnd(event);
          }}
          onClickCapture={(event) => {
            if (ignoreClick.current) {
              event.stopPropagation();
              ignoreClick.current = false;
            }
          }}
        >
          <defs>
            <CartographyDefs />
            <pattern
              id="atlas-occupied"
              width="7"
              height="7"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(37)"
            >
              <path d="M0 0v7" stroke="#f1c68c" opacity=".65" strokeWidth="2" />
            </pattern>
            {fog && (
              <>
                <radialGradient id={`${fogId}-ash`} cx="45%" cy="39%" r="83%">
                  <stop stopColor="#60544b" />
                  <stop offset=".47" stopColor="#443a35" />
                  <stop offset="1" stopColor="#241e1b" />
                </radialGradient>
                <filter id={`${fogId}-feather`} x="-40%" y="-40%" width="180%" height="180%">
                  <feGaussianBlur stdDeviation="8" />
                </filter>
                <mask
                  id={`${fogId}-veil`}
                  maskUnits="userSpaceOnUse"
                  x={-W}
                  y={-H}
                  width={W * 3}
                  height={H * 3}
                >
                  <g
                    fill="white"
                    stroke="white"
                    strokeWidth="8"
                    strokeLinejoin="round"
                    filter={`url(#${fogId}-feather)`}
                  >
                    <path d={exploredTerrain} />
                    {knownTowns
                      .filter((s) => !chart.cells.some((cell) => cell.settlement === s.id))
                      .map((s) => {
                        const [x, y] = townPoint(s);
                        return <circle key={s.id} cx={x} cy={y} r="17" />;
                      })}
                  </g>
                </mask>
              </>
            )}
            <clipPath id="atlas-land-clip">
              <path d={inkCoast} />
            </clipPath>
          </defs>
          {fog && (
            <rect
              x={-W}
              y={-H}
              width={W * 3}
              height={H * 3}
              fill={`url(#${fogId}-ash)`}
              className="atlas-unknown-land"
            />
          )}
          <g mask={fog ? `url(#${fogId}-veil)` : undefined}>
            <rect x={-W} y={-H} width={W * 3} height={H * 3} fill="url(#ink-sea)" />
            <rect x={-W} y={-H} width={W * 3} height={H * 3} fill="url(#ink-sea-engrave)" />
            <CartographicCoast path={inkCoast} carto={carto} />
            <path d={inkCoast} fill="#937e57" stroke="#261d15" strokeWidth="3" />
            <g clipPath="url(#atlas-land-clip)">
              <CartographicLand chart={chart} carto={carto} path={inkCoast} />
              {chart.cells.map((cell) => {
                const s = towns.get(cell.settlement);
                if (!s || !mapped(s.id)) return null;
                const realm = states.get(s.state);
                const tint = layer === 'political' ? realm?.color : undefined;
                const pigment = tint && `color-mix(in srgb, ${tint} 84%, #583720)`;
                return (
                  <g key={s.id}>
                    <polygon
                      points={points(cell.polygon)}
                      fill={pigment ?? 'transparent'}
                      fillOpacity={tint ? '.44' : undefined}
                      className="atlas-cell"
                      onClick={() => {
                        onSelect(s.id);
                        setRecord(null);
                      }}
                    >
                      <title>
                        {s.name} · {realm?.name ?? 'Независимое поселение'}
                      </title>
                    </polygon>
                    {s.occupation && (
                      <polygon
                        points={points(cell.polygon)}
                        fill="url(#atlas-occupied)"
                        pointerEvents="none"
                      />
                    )}
                  </g>
                );
              })}
              <g className="atlas-rivers" aria-label="Реки">
                {chart.rivers.map((river, i) => {
                  if (river.points.length < 2) return null;
                  const seq =
                    river.points[0][0] <= river.points[river.points.length - 1][0]
                      ? river.points
                      : [...river.points].reverse();
                  const path = smoothRiver(seq);
                  return (
                    <g key={`${river.name}-${i}`}>
                      <path d={path} className="river-bank" />
                      <path id={`${riverId}-river-${i}`} d={path} className="river-flow" />
                      {layer !== 'political' && zoom > 1.65 && !atlas && (
                        <text className="river-label">
                          <textPath
                            href={`#${riverId}-river-${i}`}
                            startOffset="48%"
                            textAnchor="middle"
                          >
                            {river.name}
                          </textPath>
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            </g>
            <g fill="none" pointerEvents="none">
              <path
                className="atlas-border-underlay"
                d={edges
                  .filter((edge) => edge.kind === 'state')
                  .map((edge) => line(edge.side))
                  .join(' ')}
              />
              <path
                className="atlas-realm-line"
                d={edges
                  .filter((edge) => edge.kind === 'state')
                  .map((edge) => line(edge.side))
                  .join(' ')}
              />
              {activity && frontier.length > 0 && (
                <path
                  className="atlas-war-front"
                  d={frontier.map((edge) => line(edge.side)).join(' ')}
                />
              )}
              {zoom > 1.25 && layer === 'political' && (
                <path
                  className="atlas-region-line"
                  d={edges
                    .filter((edge) => edge.kind === 'region')
                    .map((edge) => line(edge.side))
                    .join(' ')}
                />
              )}
              <path d={inkCoast} className="atlas-coast-line" />
            </g>
            {!roads && (
              <g className="atlas-trails" aria-hidden="true">
                {stats.roadPaths.map(
                  (r) => r?.scenic && !r.blocked && <path key={`${r.a}-${r.b}`} d={r.path} />,
                )}
              </g>
            )}
            {roads && (
              <g className="atlas-roads" aria-hidden="true">
                {stats.roadPaths.map(
                  (r) =>
                    r && (
                      <path
                        key={`${r.a}-${r.b}`}
                        d={r.path}
                        className={r.blocked ? 'blocked' : ''}
                      />
                    ),
                )}
              </g>
            )}
            <CartographicWords
              chart={chart}
              carto={carto}
              title={world.worldLore?.continent ?? 'Астерн'}
              hideLabels={layer === 'political' || aspect < 1.2 || Boolean(atlas)}
            />
            {routePoints.length > 1 && (
              <polyline className="atlas-journey" points={points(routePoints)} />
            )}
            <g>
              {knownTowns.map((s) => {
                const [x, y] = townPoint(s);
                const cap = capitalIds.has(s.id);
                const player = s.id === world.hero?.settlement;
                const focus = s.id === selected;
                const highlighted = focus || player || hover === s.id;
                const damage = s.structuralDamage ?? 0;
                const colony = s.foundedDay !== undefined;
                const labelAt = townLabels.get(s.id);
                const label = shorten(s.name);
                return (
                  <g
                    key={s.id}
                    data-place={s.id}
                    data-condition={
                      s.kind === 'ruins'
                        ? 'ruins'
                        : damage
                          ? 'damaged'
                          : colony
                            ? 'founded'
                            : 'standing'
                    }
                    className={`atlas-town ${focus ? 'is-current' : ''} ${player ? 'is-hero' : ''}`}
                    transform={`translate(${x},${y})`}
                    onClick={() => {
                      onSelect(s.id);
                      setRecord(null);
                    }}
                    onMouseEnter={() => setHover(s.id)}
                    onMouseLeave={() => setHover(null)}
                  >
                    <title>
                      {s.name}
                      {cap ? ' · столица' : ''}
                      {s.kind === 'ruins' ? ' · руины' : damage ? ' · повреждено войной' : ''}
                      {colony ? ` · основано в день ${s.foundedDay}` : ''}
                      {portIds.has(s.id) ? ' · порт' : ''}
                      {player ? ' · герой' : ''}
                      {activity && sieges.has(s.id) ? ' · осада' : ''}
                      {activity && focus && s.monsters ? ` · местная угроза: ${s.monsters}` : ''}
                    </title>
                    <circle r={cap ? 13 : 9} fill="transparent" />
                    {(focus || player) && (
                      <ellipse className="atlas-halo" rx={cap ? 12 : 9} ry="6" />
                    )}
                    {(cap ||
                      s.central ||
                      portIds.has(s.id) ||
                      focus ||
                      colony ||
                      s.kind === 'ruins' ||
                      damage > 0 ||
                      zoom >= 1.75) && (
                      <CartographicTown
                        kind={
                          s.kind === 'ruins'
                            ? 'ruins'
                            : cap
                              ? 'capital'
                              : portIds.has(s.id)
                                ? 'port'
                                : s.central
                                  ? 'town'
                                  : 'village'
                        }
                      />
                    )}
                    {colony && s.kind !== 'ruins' && (
                      <path
                        className="atlas-colony-flag"
                        style={
                          {
                            '--realm-ink': states.get(s.state)?.color ?? '#bc955f',
                          } as CSSProperties
                        }
                        d="M-4 5v-12l8 2-8 2M-6 5h4"
                      />
                    )}
                    {(damage > 0 || s.kind === 'ruins') && (
                      <path
                        className={`atlas-town-scar${s.kind === 'ruins' ? ' is-ruin' : ''}`}
                        d="M-6 5 6-5M-3 7 8-2"
                      />
                    )}
                    {activity && sieges.has(s.id) && <circle className="atlas-siege" r={13} />}
                    {activity && focus && !!s.monsters && (
                      <circle className="atlas-danger" cx="7" cy="-6" r="2.8" />
                    )}
                    {labelAt && (
                      <text
                        x={labelAt[0] - x}
                        y={labelAt[1] - y}
                        textAnchor="middle"
                        className={`atlas-town-label${highlighted ? ' is-highlighted' : ''}`}
                      >
                        {label}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
            {layer === 'political' && (
              <g>
                {world.states.map((state) => {
                  const anchor = realmLabels.get(state.id);
                  if (!anchor) return null;
                  const [x, y] = anchor;
                  const label = state.name.length > 24 ? `${state.name.slice(0, 23)}…` : state.name;
                  return (
                    <g
                      className="atlas-realm-label"
                      key={state.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`Открыть свод: ${state.name}`}
                      onClick={() => onRealm(state.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onRealm(state.id);
                        }
                      }}
                    >
                      <rect fill="transparent" x={x - 52} y={y - 15} width="104" height="23" />
                      <title>Открыть свод о державе «{state.name}»</title>
                      <text x={x} y={y}>
                        {label}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}
            <g className="atlas-generated-sites" aria-label="Исторические места">
              {siteMarks.map(({ site, at, anchor }) => (
                <AtlasSiteMarker
                  key={site.id}
                  site={site}
                  at={at}
                  anchor={anchor}
                  focal={site.id === atlas?.scenario.focalSite}
                  active={record === site.id}
                  scale={siteScale}
                  onSelect={() => pickSite(site.id)}
                />
              ))}
            </g>
          </g>
          {activity && (
            <AtlasRoadMarkers
              actors={filteredActors}
              world={world}
              at={(id) => {
                const place = towns.get(id);
                return place && townPoint(place);
              }}
              scale={(fitX / paperWidth) * (paperWidth < 600 ? 1.3 : 1.22)}
              heroAnchor={traveler ? townPoint(traveler) : undefined}
              active={focusedActor?.id ?? null}
              select={(id) => chooseActor(id)}
            />
          )}
          {traveler && world.hero && (
            <AtlasHero
              key={world.seed + ':' + world.hero.id}
              at={townPoint(traveler)}
              name={world.player?.name ?? 'Путешественник'}
              route={heroRoute}
              scale={(aspect < 1.45 ? 1.45 : 1) / zoom}
            />
          )}
        </svg>
        <div className="atlas-vellum-surface" aria-hidden="true">
          <div className="atlas-vellum-frame">
            <i />
            <i />
            <i />
            <i />
          </div>
        </div>
        {zoom === 1 && (
          <div className="atlas-scroll-cartouche" aria-hidden="true">
            <span className="atlas-scroll-seal">✦</span>
            <span>{layer === 'political' ? 'Пределы держав' : 'Свиток обитаемых земель'}</span>
          </div>
        )}
        {fog && (
          <div className="atlas-unknown-caption">
            Нанесено на карту: {explored.size}/{world.settlements.length}
          </div>
        )}
        <div className="atlas-map-key" aria-label="Условные знаки">
          <span className="atlas-key-mountain">Горы</span>
          <span className="atlas-key-forest">Лес</span>
          <span className="atlas-key-marsh">Топи</span>
          <span className="atlas-key-water">Вода</span>
          <span className="atlas-key-village">Деревня</span>
          <span className="atlas-key-town">Город</span>
          <span className="atlas-key-capital">Столица</span>
          {atlas && <span className="atlas-key-site">Историческое место</span>}
          {activity && frontier.length > 0 && <span className="atlas-key-war">Фронт</span>}
        </div>
        <div className="atlas-navigator">
          <span aria-hidden="true">✥</span>
          <button
            aria-label="Показать весь континент"
            onClick={() => {
              setZoom(1);
              setFocusAt(null);
            }}
            disabled={zoom <= 1}
          >
            Весь мир
          </button>
        </div>
      </div>
      {activity && world.player && (
        <AtlasRoadLedger
          all={roadActors}
          filters={roadKinds}
          toggle={toggleKind}
          actor={focusedActor}
          world={world}
          select={(id) => chooseActor(id, true)}
          send={send}
        />
      )}
      {fieldAtlas && (record === 'history' || selectedSite) && (
        <AtlasFieldbook
          atlas={fieldAtlas}
          site={selectedSite}
          world={world}
          close={() => setRecord(null)}
          pick={(id) => pickSite(id, true)}
          onRealm={onRealm}
        />
      )}
      <div className="atlas-inspector">
        <label>
          <span className="sr-only">Поселение на карте</span>
          <select
            value={selected}
            onChange={(event) => {
              const id = Number(event.target.value);
              const chosen = towns.get(id);
              onSelect(id);
              setRecord(null);
              if (zoom > 1 && chosen) setFocusAt(clampView(townPoint(chosen)));
            }}
          >
            {world.states
              .filter((s) => knownStates.has(s.id))
              .map((state) => (
                <optgroup key={state.id} label={state.name}>
                  {knownTowns
                    .filter((s) => s.state === state.id)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                </optgroup>
              ))}
          </select>
        </label>
        <span>
          {hoveredTown
            ? `${hoveredTown.name} · ${terrainName[hoveredTown.biome]}${portIds.has(hoveredTown.id) ? ' · порт' : ''}`
            : '◆ Столица · ○ Герой'}
        </span>
        {profile && (
          <button onClick={() => onRealm(profile.id)}>
            {emblems[profile.emblem ?? 'tower']} Открыть свод
          </button>
        )}
      </div>
    </div>
  );
}
