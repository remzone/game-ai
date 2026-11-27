import {
  noise,
  pointInCoast,
  smoothRiver,
  type Chart,
  type Point,
  type Town,
} from './atlas-geometry';

type Line = [Point, Point];
type Sample = { at: Point; height: number; forest: number; marsh: number };
type Cartography = {
  relief: { shape: string; level: number }[];
  forest: string;
  marsh: string;
  stipple: string;
  reeds: string;
  grass: string;
  slopes: string;
  surf: string;
  ridges: { shape: string; outline: string; folds: string; shade: string; label: Point }[];
  woods?: Point;
  plainNames: { at: Point; label: string }[];
};
const distance = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const f = (x: number) => x.toFixed(1);
const xy = ([x, y]: Point) => `${f(x)},${f(y)}`;
const name = (at: Point) => at.map((v) => Math.round(v * 1000)).join(',');

// Marching squares converts an actual biome field into smoothly joined hand-inked relief.
// World geodata supplies the temperatures/positions; no decorative matrix is drawn.
function contours(grid: Sample[][], field: 'height' | 'forest' | 'marsh', limit: number) {
  const links: Line[] = [];
  const mix = (a: Sample, b: Sample): Point => {
    const t = (limit - a[field]) / (b[field] - a[field]);
    return [a.at[0] + (b.at[0] - a.at[0]) * t, a.at[1] + (b.at[1] - a.at[1]) * t];
  };
  for (let row = 0; row < grid.length - 1; row++) {
    for (let c = 0; c < grid[row].length - 1; c++) {
      const quad = [grid[row][c], grid[row][c + 1], grid[row + 1][c + 1], grid[row + 1][c]];
      const marks = quad.flatMap((a, i) => {
        const b = quad[(i + 1) % 4];
        return a[field] >= limit !== b[field] >= limit ? [mix(a, b)] : [];
      });
      if (marks.length === 2) links.push([marks[0], marks[1]]);
      if (marks.length === 4) {
        const centerInside = quad.reduce((sum, a) => sum + a[field], 0) / 4 >= limit;
        if (centerInside === quad[0][field] >= limit)
          links.push([marks[0], marks[1]], [marks[2], marks[3]]);
        else links.push([marks[0], marks[3]], [marks[1], marks[2]]);
      }
    }
  }
  const heads = new Map<string, { i: number; to: Point }[]>();
  links.forEach(([a, b], i) => {
    for (const [from, to] of [
      [a, b],
      [b, a],
    ] as const) {
      const key = name(from);
      heads.set(key, [...(heads.get(key) ?? []), { i, to }]);
    }
  });
  const seen = new Set<number>();
  const paths: Point[][] = [];
  const extend = (head: Point): Point[] => {
    const next = (heads.get(name(head)) ?? []).find(({ i }) => !seen.has(i));
    if (!next) return [];
    const res: Point[] = [];
    let curr: typeof next | undefined = next;
    while (curr) {
      seen.add(curr.i);
      res.push(curr.to);
      curr = (heads.get(name(curr.to)) ?? []).find(({ i }) => !seen.has(i));
    }
    return res;
  };
  links.forEach(([a, b], i) => {
    if (seen.has(i)) return;
    seen.add(i);
    paths.push([...extend(a).reverse(), a, b, ...extend(b)]);
  });
  return paths.filter((p) => p.length >= 5);
}

function roundPath(p: Point[], fill: boolean) {
  const end = p[p.length - 1];
  const closed = distance(p[0], end) < 0.03;
  if (fill && !closed) return '';
  return (
    `M${xy(p[0])}` +
    p
      .slice(1, -1)
      .map((v, i) => {
        const next = p[i + 2];
        return `Q${xy(v)} ${xy([(v[0] + next[0]) / 2, (v[1] + next[1]) / 2])}`;
      })
      .join('') +
    `L${xy(end)}` +
    (closed ? 'Z' : '')
  );
}

// Geographic masses are clustered once; pan, zoom, state colors and real-time events
// do not redraw the terrain's physical landforms.
function clusters(p: Point[], maxGap: number) {
  const open = new Set(p);
  const out: Point[][] = [];
  while (open.size) {
    const first = open.values().next().value!;
    open.delete(first);
    const group = [first];
    for (let k = 0; k < group.length; k++) {
      for (const candidate of open) {
        if (distance(group[k], candidate) < maxGap) {
          group.push(candidate);
          open.delete(candidate);
        }
      }
    }
    out.push(group);
  }
  return out.sort((a, b) => b.length - a.length);
}

function ridge(group: Point[], index: number): Cartography['ridges'][number] | null {
  const left = Math.min(...group.map((p) => p[0]));
  const right = Math.max(...group.map((p) => p[0]));
  if (right - left < 25) return null;
  const columns = Math.min(13, Math.max(3, Math.round((right - left) / 30)));
  const chain: Point[] = [];
  const spacing = (right - left) / columns;
  for (let i = 0; i < columns; i++) {
    const x = left + (i + 0.5) * spacing;
    const window = group.filter((p) => Math.abs(p[0] - x) <= spacing * 0.8);
    if (!window.length) continue;
    const ys = window.map(([_, y]) => y).sort((a, b) => a - b);
    const y = ys[Math.floor(0.55 * (ys.length - 1))];
    chain.push([x + noise(x, index) * 14, y]);
  }
  if (chain.length < 2) return null;
  const mask: Point[] = [];
  let folds = '';
  let shade = '';
  const foot: Point[] = [];
  chain.forEach(([x, y], i) => {
    const prior = chain[i - 1];
    const next = chain[i + 1];
    const altitude = Math.min(42, 19 + (noise(x, y) + 0.5) * 26 + group.length * 0.2);
    const peak: Point = [x + noise(x + 5, y) * 9, y - altitude * 0.67];
    const leftEdge: Point = prior
      ? [(prior[0] + x) / 2, (prior[1] + y) / 2 - 2]
      : [x - spacing * 0.75, y + 6];
    const rightEdge: Point = next
      ? [(x + next[0]) / 2, (y + next[1]) / 2 - 2]
      : [x + spacing * 0.75, y + 7];
    const root: Point = [x + spacing * 0.1, y + altitude * 0.53];
    const shoulder: Point = [peak[0] + spacing * 0.27, peak[1] + altitude * 0.49];
    const lightSlope: Point = [peak[0] - spacing * 0.19, peak[1] + altitude * 0.43];
    if (!i) mask.push(leftEdge);
    const lightRim: Point = [
      peak[0] - spacing * (0.08 + (noise(x, 7) + 0.5) * 0.11),
      peak[1] + altitude * 0.24,
    ];
    const overhang: Point = [
      peak[0] + spacing * (0.12 + (noise(x, 13) + 0.5) * 0.1),
      peak[1] + altitude * 0.23,
    ];
    const spur: Point = [
      (shoulder[0] + rightEdge[0]) / 2,
      (shoulder[1] + rightEdge[1]) / 2 + noise(x, 21) * 5,
    ];
    mask.push(lightSlope, lightRim, peak, overhang, shoulder, spur, rightEdge);
    foot.push(root);
    const crease: Point = [x + 4 + noise(x, 144) * 12, y - altitude * 0.24];
    folds += `M${xy(peak)}L${xy(crease)}L${xy(root)}M${xy(lightSlope)}l-4,7l-5,3M${xy(shoulder)}l5,5l4,6`;
    shade += `M${xy(peak)}L${xy(overhang)}L${xy(shoulder)}L${xy(spur)}L${xy(rightEdge)}Q${xy(spur)} ${xy(root)}L${xy(crease)}Z`;
    for (let j = 1; j < 7; j++) {
      const p = (j + noise(x, j) * 0.35) / 8;
      const q = (j + 1 + noise(j, x) * 0.55) / 8;
      const start: Point = [
        shoulder[0] + (rightEdge[0] - shoulder[0]) * p,
        shoulder[1] + (rightEdge[1] - shoulder[1]) * p,
      ];
      const finish: Point = [
        crease[0] + (root[0] - crease[0]) * q,
        crease[1] + (root[1] - crease[1]) * q,
      ];
      const elbow: Point = [
        start[0] + (finish[0] - start[0]) * 0.46 + noise(x + j, y) * 4,
        start[1] + (finish[1] - start[1]) * 0.47,
      ];
      folds += `M${xy(start)}Q${xy(elbow)} ${xy(finish)}`;
      if (j % 2 === 0)
        folds += `M${xy([peak[0] - (4 + j) * 0.62, peak[1] + altitude * p])}q-4,4 -7,${5 + j * 0.7}`;
    }
  });
  const center = chain[Math.floor(chain.length / 2)];
  const outline = 'M' + mask.map(xy).join('L');
  return {
    outline,
    shape: outline + 'L' + foot.reverse().map(xy).join('L') + 'Z',
    folds,
    shade,
    label: [center[0], center[1] + 30],
  };
}

export function drawCartography(chart: Chart, towns: Map<number, Town>): Cartography {
  const sources = chart.cells.flatMap(({ center: at, settlement }) => {
    const town = towns.get(settlement);
    if (!town) return [];
    return [{ at, biome: town.biome }];
  });
  const samples: Sample[][] = [];
  const step = 15;
  const margin = step * 8; // close biome isobands fully in sea before the coast clips their ink
  for (let y = -margin; y <= chart.height + margin; y += step) {
    const row: Sample[] = [];
    for (let x = -margin; x <= chart.width + margin; x += step) {
      let sum = 0;
      let height = 0;
      let forest = 0;
      let marsh = 0;
      for (const a of sources) {
        const dd = (x - a.at[0]) ** 2 + (y - a.at[1]) ** 2;
        if (dd > 8700) continue;
        const w = 1 / (1 + dd / 388) ** 1.85;
        sum += w;
        height +=
          w *
          (a.biome === 'mountain'
            ? 1
            : a.biome === 'forest'
              ? 0.3
              : a.biome === 'plains'
                ? 0.12
                : 0.02);
        if (a.biome === 'forest') forest += w;
        if (a.biome === 'marsh') marsh += w;
      }
      // Small natural variation, subordinate to the actual nearby biome field.
      const modulation =
        Math.sin(x * 0.083 + Math.cos(y * 0.055) * 2) * Math.sin(y * 0.064 + x * 0.037);
      row.push({
        at: [x, y],
        height: sum ? height / sum + modulation * 0.037 : 0,
        forest: sum ? forest / sum + modulation * 0.045 : 0,
        marsh: sum ? marsh / sum : 0,
      });
    }
    samples.push(row);
  }
  let slopes = '';
  let stipple = '';
  let reeds = '';
  let grass = '';
  for (let i = 1; i < samples.length - 1; i++) {
    for (let j = 1; j < samples[i].length - 1; j++) {
      const s = samples[i][j];
      const x = s.at[0] + noise(i, j) * 12;
      const y = s.at[1] + noise(j, i + 4) * 12;
      if (s.marsh > 0.43) {
        reeds += `M${xy([x, y])}q3-1.7 6 0t6 0m-9 0-2-3m2 3v-5m0 5 3-3m-11 7h12`;
      } else if (s.forest < 0.36 && s.height < 0.24 && noise(j + 5, i) > 0.07) {
        grass += `M${xy([x, y])}q1-1.5 2.5-2m-2.5 2-1-3m7 6h3`;
      }
      if (s.forest > 0.36) {
        for (let n = 0; n < (s.forest > 0.65 ? 8 : 4); n++) {
          const dx = noise(x + n * 4, y - 2) * 21;
          const dy = noise(x - 3, y + n * 5) * 21;
          const r = noise(x, y + n) > 0.15 ? 2 : 0.8;
          const base: Point = [x + dx, y + dy];
          const h = r + 1.8;
          stipple += `M${xy(base)}l-${f(r)},0 ${f(r)},-${f(h)} ${f(r)},${f(h)}h-${f(r)}v1.3`;
        }
      }
      if (s.height < 0.29 || s.height > 0.79) continue;
      const gx = samples[i][j + 1].height - samples[i][j - 1].height;
      const gy = samples[i + 1][j].height - samples[i - 1][j].height;
      const strength = Math.hypot(gx, gy);
      if (strength < 0.052) continue;
      const size = Math.min(10, 3 + strength * 25);
      for (let n = 0; n < (strength > 0.17 ? 3 : 2); n++) {
        const t = (n - 1) * 4.5;
        const a: Point = [x + (gy / strength) * t, y - (gx / strength) * t];
        slopes += `M${xy(a)}l${f((-gx / strength) * size)},${f((-gy / strength) * size)}`;
      }
    }
  }
  let surf = '';
  for (let i = 0; i < chart.coast.length; i++) {
    const a = chart.coast[i];
    const b = chart.coast[(i + 1) % chart.coast.length];
    const span = distance(a, b);
    const dx = (b[0] - a[0]) / span;
    const dy = (b[1] - a[1]) / span;
    const m: Point = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    if (!span) continue;
    const outside = pointInCoast([m[0] - dy * 7, m[1] + dx * 7], chart.coast) ? -1 : 1;
    for (let n = 0; n < Math.ceil(span / 13); n++) {
      const p = ((n + 0.5) * span) / Math.ceil(span / 13);
      const x = a[0] + dx * p;
      const y = a[1] + dy * p;
      const side = 5 + (noise(x, y) + 0.5) * 6;
      const pos: Point = [x - dy * side * outside, y + dx * side * outside];
      surf += `M${xy(pos)}q${f(dx * 2.6 - dy * outside * 2)},${f(dy * 2.6 + dx * outside * 2)} ${f(dx * 7)},${f(dy * 7)}`;
      if (noise(y, x + 7) > 0.1)
        surf += `M${xy([pos[0] - dy * outside * 6, pos[1] + dx * outside * 6])}l${f(dx * 9)},${f(dy * 9)}`;
    }
  }
  const forestGroups = clusters(
    sources.filter((s) => s.biome === 'forest').map((s) => s.at),
    58,
  );
  const woodsGroup = forestGroups[0];
  const woods =
    woodsGroup?.length > 10
      ? woodsGroup.reduce<Point>(
          (p, a) => [p[0] + a[0] / woodsGroup.length, p[1] + a[1] / woodsGroup.length],
          [0, 0],
        )
      : undefined;
  const flat = sources.filter(({ biome }) => biome === 'plains').map(({ at }) => at);
  const important = chart.cells
    .filter((cell) => towns.get(cell.settlement)?.kind === 'city')
    .map((cell) => cell.center);
  const plainNames = [
    {
      limit: ([x, y]: Point) => x > chart.width * 0.55 && y < chart.height * 0.44,
      label: 'Северные равнины',
    },
    {
      limit: ([x, y]: Point) => x > chart.width * 0.53 && y > chart.height * 0.61,
      label: 'Южные пастбища',
    },
  ].flatMap(({ limit, label }) => {
    const group = flat.filter(limit);
    if (group.length < 7) return [];
    const middle = group.reduce<Point>(
      (p, a) => [p[0] + a[0] / group.length, p[1] + a[1] / group.length],
      [0, 0],
    );
    const score = (p: Point) =>
      distance(p, middle) +
      important.reduce(
        (sum, c) =>
          sum + Math.max(0, 1 - Math.hypot((p[0] - c[0]) / 110, (p[1] - c[1]) / 27)) * 590,
        0,
      );
    const at = [...group].sort((a, b) => score(a) - score(b))[0];
    return [{ at, label }];
  });
  return {
    relief: [0.23, 0.31, 0.39, 0.48, 0.57, 0.66, 0.75, 0.83].map((level) => ({
      level,
      shape: contours(samples, 'height', level)
        .map((p) => roundPath(p, true))
        .join(''),
    })),
    forest: contours(samples, 'forest', 0.38)
      .map((p) => roundPath(p, true))
      .join(''),
    marsh: contours(samples, 'marsh', 0.35)
      .map((p) => roundPath(p, true))
      .join(''),
    slopes,
    stipple,
    reeds,
    grass,
    surf,
    ridges: clusters(
      sources.filter((s) => s.biome === 'mountain').map((s) => s.at),
      60,
    )
      .filter((g) => g.length > 4)
      .slice(0, 4)
      .flatMap((g, i) => ridge(g, i) ?? []),
    woods,
    plainNames,
  };
}

export function CartographyDefs() {
  return (
    <>
      <radialGradient id="ink-sea" cx="49%" cy="47%" r="57%">
        <stop stopColor="#9b865f" />
        <stop offset=".72" stopColor="#7d684b" />
        <stop offset="1" stopColor="#4e3e2c" />
      </radialGradient>
      <linearGradient id="ink-vellum" x1="14%" y1="5%" x2="91%" y2="83%">
        <stop stopColor="#d7b785" />
        <stop offset=".48" stopColor="#baa071" />
        <stop offset="1" stopColor="#98764e" />
      </linearGradient>
      <linearGradient id="ink-ridge" x1="28%" y1="0%" x2="61%" y2="100%">
        <stop stopColor="#e1c391" />
        <stop offset=".52" stopColor="#a07d58" />
        <stop offset="1" stopColor="#73533c" stopOpacity=".78" />
      </linearGradient>
      <pattern
        id="ink-crosshatch"
        width="3"
        height="4"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(31)"
      >
        <path d="M0 0H3" fill="none" stroke="#6f4a35" strokeWidth=".45" opacity=".42" />
      </pattern>
      <pattern id="ink-sea-engrave" width="112" height="54" patternUnits="userSpaceOnUse">
        <path
          d="M5 14q5-2.2 10 0t10 0m-10 3q6 1.8 12-.4m38 8q4-2 8 0t9 0m-5 3 8-1m-49 14q6-2.3 12-.1t13 0m40-29h4m-83 26h6m67 7h5"
          fill="none"
          stroke="#3e291a"
          strokeWidth=".66"
          opacity=".36"
        />
      </pattern>
      <pattern id="ink-wetland" width="18" height="12" patternUnits="userSpaceOnUse">
        <path
          d="M0 7q5-2 8 0t9 0M4 11h9m-4-8h5"
          fill="none"
          stroke="#768264"
          strokeWidth=".65"
          opacity=".45"
        />
      </pattern>
      <pattern id="ink-paper-tooth" width="18" height="13" patternUnits="userSpaceOnUse">
        <path
          d="M.9 4h.4m3 2.6h.7m.2-5h.3m4.6 9h.45m2.6-5.6h.6m3.5 6h.75M9 4h.5m4-2.5h.3m-8 10h.9M.7 12h.5"
          fill="none"
          stroke="#765432"
          strokeWidth=".35"
        />
      </pattern>
    </>
  );
}

export function CartographicLand({
  carto,
  chart,
  path,
}: {
  carto: Cartography;
  chart: Chart;
  path: string;
}) {
  return (
    <g className="ink-relief" aria-hidden="true" pointerEvents="none">
      <path d={path} fill="url(#ink-vellum)" />
      <g className="ink-river-wash">
        {chart.rivers.map((river, i) => (
          <path key={i} d={smoothRiver(river.points)} />
        ))}
      </g>
      {carto.relief.map(({ level, shape }, i) => (
        <path
          d={shape}
          key={level}
          fillRule="evenodd"
          fill={i < 3 ? '#5d493d' : '#998481'}
          fillOpacity={i < 3 ? '.12' : '.13'}
        />
      ))}
      <path d={carto.forest} className="ink-forest" fillRule="evenodd" />
      <path d={carto.marsh} className="ink-marsh" fillRule="evenodd" />
      <path d={carto.marsh} fill="url(#ink-wetland)" fillRule="evenodd" />
      {carto.relief.map(({ level, shape }) => (
        <path d={shape} key={level} className="ink-contour" opacity={level > 0.38 ? 0.42 : 0.24} />
      ))}
      <path d={carto.slopes} className="ink-hachure" />
      <path d={carto.stipple} className="ink-stipple" />
      <path d={carto.grass} className="ink-grass" />
      <path d={carto.reeds} className="ink-reeds" />
      {carto.ridges.map(({ shape, outline, folds, shade }) => (
        <g className="ink-ridge" key={outline}>
          <path d={shape} fill="url(#ink-ridge)" />
          <path d={shade} className="ink-ridge-shadow" />
          <path d={shade} fill="url(#ink-crosshatch)" />
          <path d={folds} className="ink-ridge-folds" />
          <path d={outline} className="ink-ridge-spine" />
        </g>
      ))}
      <rect
        width={chart.width}
        height={chart.height}
        fill="url(#ink-paper-tooth)"
        className="ink-grain"
      />
    </g>
  );
}

export function CartographicCoast({ carto, path }: { carto: Cartography; path: string }) {
  return (
    <g aria-hidden="true" className="ink-shallows" pointerEvents="none">
      <path d={path} className="ink-shelf-outer" />
      <path d={path} className="ink-shelf-inner" />
      <path d={carto.surf} className="ink-surf" />
    </g>
  );
}

export function CartographicWords({
  carto,
  chart,
  title,
  hideLabels,
}: {
  carto: Cartography;
  chart: Chart;
  title: string;
  hideLabels: boolean;
}) {
  const left = Math.min(...chart.coast.map((p) => p[0]));
  const [west, north] = chart.coast.reduce<Point>(
    (p, a) => [Math.min(p[0], a[0]), Math.min(p[1], a[1])],
    [chart.width, chart.height],
  );
  const caption = title.length > 24 ? title.slice(0, 23) + '…' : title;
  return (
    <g pointerEvents="none" className="ink-map-words" aria-hidden="true">
      {!hideLabels && (
        <>
          <g
            className="ink-map-title"
            transform={`translate(${Math.max(55, west + 2)} ${Math.min(51, Math.max(35, north - 12))})`}
          >
            <path d="M-12 8h250m-250 3h250m-251-4 4 3-4 3-4-3z" />
            <text y="-1">{caption}</text>
            <text y="25" className="ink-map-kicker">
              КАРТА ОБИТАЕМЫХ ЗЕМЕЛЬ
            </text>
          </g>
          <text className="ink-sea-name" x={left + 121} y={chart.height - 75}>
            Западные воды
          </text>
          {carto.ridges.slice(0, 2).map(({ label: [x, y] }, i) => (
            <text
              key={i}
              className="ink-region-name"
              textAnchor="middle"
              x={x}
              y={y}
              transform={`rotate(-7 ${x} ${y})`}
            >
              {i === 0 ? 'Каменный кряж' : 'Южные нагорья'}
            </text>
          ))}
          {carto.plainNames.map(({ at: [x, y], label }) => (
            <text key={label} className="ink-region-name is-plains" textAnchor="middle" x={x} y={y}>
              {label}
            </text>
          ))}
          {carto.woods && (
            <text
              className="ink-region-name is-woods"
              textAnchor="middle"
              x={carto.woods[0]}
              y={carto.woods[1] + 25}
            >
              Лесные земли
            </text>
          )}
        </>
      )}
      <g transform={`translate(${chart.width - 71} ${chart.height - 73})`} className="ink-compass">
        <circle r="42" strokeDasharray="1 2.1" />
        <circle r="38" />
        <circle r="33" />
        <circle r="28" />
        <path
          className="ink-compass-petals"
          d="M0-28 4-9 20-20 9-4 28 0 9 4 20 20 4 9 0 28-4 9-20 20-9 4-28 0-9-4-20-20-4-9Z"
        />
        <path d="M0-43 8-8 43 0 8 8 0 43-8 8-43 0-8-8Z M0-28L0 28M-28 0H28M-20-20 20 20m0-40-40 40" />
        <path
          className="ink-compass-fold"
          d="M0-43 0 0-8-8ZM43 0H0l8-8ZM0 43V0l8 8ZM-43 0H0l-8 8Z"
        />
        <circle r="5" className="ink-compass-core" />
        <text x="0" y="-48">
          С
        </text>
        <text x="50" y="4">
          В
        </text>
        <text x="0" y="55">
          Ю
        </text>
        <text x="-50" y="4">
          З
        </text>
      </g>
    </g>
  );
}

export function CartographicTown({
  kind,
}: {
  kind: 'capital' | 'port' | 'village' | 'town' | 'ruins';
}) {
  return kind === 'capital' ? (
    <g className="ink-town-capital">
      <path d="M-6 4V-4h2v2h2v-2h4v2h2v-2h2v8zM-8 4H8" />
      <path d="M-1 4V1h2v3M0-5v-5m0 0 4 1-4 1" />
    </g>
  ) : kind === 'port' ? (
    <g className="ink-town-port">
      <path d="M0-5V4M-2-2h4m-5 3a3 3 0 0 0 6 0M0-6v.1" />
    </g>
  ) : kind === 'ruins' ? (
    <path className="ink-town-village" d="M-4 3V-2h2v-1h3v2h2v4Zm2-2 2-1" />
  ) : kind === 'town' ? (
    <g className="ink-town-gate">
      <path d="M-4 3v-3l2-2.4L0 0l2-2.4L4 0v3ZM-1 3V1h2v2" />
    </g>
  ) : (
    <circle className="ink-town-village" r="1.35" />
  );
}
