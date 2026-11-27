import { useId, useLayoutEffect, useRef } from 'react';
import type { Point } from './atlas-geometry';
import './atlas-hero.css';

export interface HeroRoute {
  key: string;
  points: Point[];
  progress: number;
}

const segmentAt = (points: Point[], progress: number): Point => {
  const bounded = Math.min(points.length - 1, Math.max(0, progress));
  const index = Math.floor(bounded);
  const [x, y] = points[index];
  const [nx, ny] = points[index + 1] ?? points[index];
  const t = bounded - index;
  return [x + (nx - x) * t, y + (ny - y) * t];
};

export function AtlasHero({
  at,
  name,
  route,
  scale,
}: {
  at: Point;
  name: string;
  route?: HeroRoute;
  scale: number;
}) {
  const marker = useRef<SVGGElement>(null);
  const visible = useRef<{ key: string; points: Point[]; progress: number } | undefined>(undefined);
  const halo = useId();
  const [x, y] = at;
  const routeKey = route?.key;
  const progress = route?.progress;
  const locations = route?.points.map((point) => point.join(',')).join(' ');
  useLayoutEffect(() => {
    const node = marker.current;
    if (!node) return;
    const position = ([px, py]: Point) => node.setAttribute('transform', `translate(${px} ${py})`);
    node.removeAttribute('data-moving');
    if (route && visible.current?.key !== route.key) {
      visible.current = { ...route };
      position(segmentAt(route.points, route.progress));
      return;
    }
    const last = visible.current;
    const end = last?.points.at(-1);
    // Arrival drops the engine journey: finish its known last leg rather than jumping.
    const destination =
      route?.progress ??
      (last && end && end[0] === x && end[1] === y ? last.points.length - 1 : undefined);
    if (!last || destination === undefined) {
      visible.current = undefined;
      position([x, y]);
      return;
    }
    const path = route?.points ?? last.points;
    const start = last.progress;
    const apply = (value: number) => {
      last.progress = value;
      last.points = path;
      position(segmentAt(path, value));
    };
    const finish = () => {
      apply(destination);
      node.removeAttribute('data-moving');
      if (!route) visible.current = undefined;
    };
    if (start === destination || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finish();
      return;
    }
    // Only animate acknowledged server positions. No prediction or simulation changes.
    node.setAttribute('data-moving', 'true');
    const began = performance.now();
    const span = Math.min(640, 290 + Math.abs(destination - start) * 85);
    let frame = 0;
    const step = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - began) / span));
      if (t === 1) return finish();
      apply(start + (destination - start) * t);
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [x, y, routeKey, progress, locations]);

  return (
    <g
      ref={marker}
      className="atlas-hero-miniature"
      role="img"
      aria-label={`Герой на карте: ${name}`}
    >
      <title>Герой: {name}</title>
      <defs>
        <radialGradient id={halo}>
          <stop stopColor="#f5cc7d" stopOpacity=".7" />
          <stop offset=".6" stopColor="#f5b95b" stopOpacity=".25" />
          <stop offset="1" stopColor="#f5b95b" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g transform={`scale(${scale})`}>
        <ellipse cx="0" cy="1" rx="24" ry="12" fill={`url(#${halo})`} />
        <g className="atlas-hero-model">
          <image href="/art/hero-miniature.webp" x="-20" y="-43" width="40" height="49" />
        </g>
      </g>
    </g>
  );
}
