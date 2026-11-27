import type { Command, RoadActor } from '@living-world/simulation';
import type { CSSProperties } from 'react';
import type { Point } from './atlas-geometry';
import type { View } from './types';
import './atlas-road-life.css';

export const actorKinds = {
  army: { one: 'Армия', many: 'Армии', color: '#ffcb76' },
  band: { one: 'Банда', many: 'Бандиты', color: '#ff9e8b' },
  caravan: { one: 'Караван', many: 'Караваны', color: '#f7dfa0' },
  merchant: { one: 'Торговец', many: 'Торговцы', color: '#b6e4b6' },
} as const;
export const actorKindIds = Object.keys(actorKinds) as RoadActor['kind'][];
const goods = {
  grain: 'Зерно',
  wood: 'Дерево',
  stone: 'Камень',
  iron: 'Железо',
  tools: 'Инструменты',
  weapons: 'Оружие',
  horses: 'Лошади',
};

// Pictograms are deliberately drawn for 18–30 px, not shrunk character art.
// The outlines and silhouettes remain distinct in grayscale.
const badgeOutline = {
  army: 'M-10-10H10v9c0 5-3 9-10 12C-7 8-10 4-10-1Z',
  band: 'M-1.6-11h3.2l9.4 9.4v3.2L1.6 11h-3.2L-11 1.6v-3.2Z',
  caravan: 'M-8-8H8l4 4v8l-4 4H-8l-4-4v-8Z',
  merchant: 'M0-11a11 11 0 1 1 0 22 11 11 0 1 1 0-22Z',
} as const;

function ActorGlyph({ kind }: { kind: RoadActor['kind'] }) {
  switch (kind) {
    case 'army':
      return (
        <g>
          <path
            d="M-5.8 5.5 5.1-5.8M5.8 5.5-5.1-5.8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.65"
          />
          <path
            d="M-2.4 4.4-5.1 1.7m7.5 2.7 2.7-2.7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.65"
          />
        </g>
      );
    case 'band':
      return (
        <g>
          <path
            d="M-7-2c2.2-1.5 4.6-.9 7 .1 2.4-1 4.8-1.6 7-.1l-1.1 3.8C5.3 3.6 3.5 4.3 2 3.3L0 1.8l-2 1.5C-3.5 4.3-5.3 3.6-5.9 1.8Z"
            fill="currentColor"
          />
          <path
            d="M-4-1h.9l1.9 1.5h-1.5c-.9 0-1.3-.5-1.3-1.5M4-1h-.9L1.2.5h1.5C3.6.5 4 0 4-1"
            className="atlas-road-cutout"
          />
        </g>
      );
    case 'caravan':
      return (
        <g>
          <path d="M-8 1.7v-4.2q.8-2.7 3.4-3.5H1q3 .7 3.6 3.5v5H-8Z" fill="currentColor" />
          <path d="M-4.6-3.8h2v3.6h-2Zm4 0h2v3.6h-2Z" className="atlas-road-cutout" />
          <path d="M4.1 1.5H8l1.3-2" fill="none" stroke="currentColor" strokeWidth="1.55" />
          <circle cx="-5.3" cy="3.7" r="2.3" fill="currentColor" className="atlas-road-wheel" />
          <circle cx="2.5" cy="3.7" r="2.3" fill="currentColor" className="atlas-road-wheel" />
        </g>
      );
    case 'merchant':
      return (
        <g>
          <path
            d="M0-6.7v13M-3.4 6.3h6.8M-6.6-4h13.2M-4.4-4l-2.2 5m11-5 2.2 5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.55"
          />
          <path
            d="M-7.9.5h5.4c-.15 1.6-1.4 2.8-2.7 2.8S-7.8 2.1-7.9.5Zm10.4 0h5.4C7.8 2.1 6.5 3.3 5.2 3.3S2.65 2.1 2.5.5Z"
            fill="currentColor"
          />
        </g>
      );
  }
}
function ActorBadge({ kind }: { kind: RoadActor['kind'] }) {
  return (
    <g className="atlas-road-symbol">
      <path className="atlas-road-badge" d={badgeOutline[kind]} />
      <g className="atlas-road-icon">
        <ActorGlyph kind={kind} />
      </g>
    </g>
  );
}

type MapActor = RoadActor & { point: Point; offset: Point };
export function AtlasRoadMarkers({
  actors,
  world,
  at,
  scale,
  heroAnchor,
  active,
  select,
}: {
  actors: RoadActor[];
  world: View;
  at: (id: number) => Point | undefined;
  scale: number;
  heroAnchor?: Point;
  active: string | null;
  select: (id: string) => void;
}) {
  const placed: MapActor[] = [];
  const sorted = [...actors].sort(
    (a, b) =>
      actorKindIds.indexOf(a.kind) - actorKindIds.indexOf(b.kind) || a.id.localeCompare(b.id),
  );
  for (const actor of sorted) {
    const start = at(actor.at),
      next = actor.toward === undefined ? undefined : at(actor.toward);
    if (!start) continue;
    const point: Point = next
      ? [
          start[0] + (next[0] - start[0]) * actor.fraction,
          start[1] + (next[1] - start[1]) * actor.fraction,
        ]
      : start;
    let offset: Point = [0, -25];
    const offsets: Point[] = [
      [0, -25],
      [27, -18],
      [-27, -18],
      [31, 10],
      [-31, 10],
      [23, 34],
      [-23, 34],
      [0, 38],
      [0, -52],
      [48, -5],
      [-48, -5],
      [49, 25],
      [-49, 25],
    ];
    for (const p of offsets) {
      offset = p;
      const px = point[0] + p[0] * scale,
        py = point[1] + p[1] * scale;
      const clearsHero =
        !heroAnchor ||
        Math.hypot(px - heroAnchor[0], py - (heroAnchor[1] - scale * 12)) >= 22 * scale;
      if (
        clearsHero &&
        !placed.some(
          ({ point: q, offset: o }) =>
            Math.hypot(px - (q[0] + scale * o[0]), py - (q[1] + scale * o[1])) < 25 * scale,
        )
      )
        break;
    }
    placed.push({ ...actor, point, offset });
  }
  // Crowded junctions are accessible in the accompanying sightings list.
  return (
    <g className="atlas-road-actors" aria-label="Замеченные отряды и путники">
      {[...placed]
        .sort((a, b) => Number(a.id === active) - Number(b.id === active))
        .map((actor) => {
          const [x, y] = actor.point,
            [dx, dy] = actor.offset;
          const ring =
            actor.state == null
              ? actorKinds[actor.kind].color
              : (world.states.find((s) => s.id === actor.state)?.color ?? actorKinds.army.color);
          return (
            <g
              className={`atlas-road-unit${active === actor.id ? ' is-selected' : ''}`}
              data-actor-kind={actor.kind}
              data-actor-id={actor.id}
              key={actor.id}
              role="button"
              tabIndex={0}
              aria-label={`${actorKinds[actor.kind].one}: ${actor.commander ?? actor.name}`}
              style={
                {
                  transform: `translate(${x}px,${y}px)`,
                  '--unit-ink': actorKinds[actor.kind].color,
                  '--unit-faction': ring,
                } as CSSProperties
              }
              onClick={(event) => {
                event.stopPropagation();
                select(actor.id);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  select(actor.id);
                }
              }}
            >
              <title>{`${actorKinds[actor.kind].one}: ${actor.commander ?? actor.name}`}</title>
              <g transform={`scale(${scale})`}>
                <path className="atlas-road-stem" d={`M0 0L${dx} ${dy}`} />
                <circle cx="0" cy="0" r="1.5" fill="var(--unit-ink)" />
                <g transform={`translate(${dx} ${dy})`}>
                  <ActorBadge kind={actor.kind} />
                  {actor.kind === 'army' && (
                    <path className="atlas-road-faction" d="M-7.6-8.2H7.6" />
                  )}
                  <circle className="atlas-road-hit" r="15.5" />
                </g>
              </g>
            </g>
          );
        })}
    </g>
  );
}

export function AtlasRoadLedger({
  all,
  filters,
  toggle,
  actor,
  world,
  select,
  send,
}: {
  all: RoadActor[];
  filters: Record<RoadActor['kind'], boolean>;
  toggle: (k: RoadActor['kind']) => void;
  actor?: RoadActor;
  world: View;
  select: (id: string | null) => void;
  send: (c: Command) => Promise<boolean>;
}) {
  const place = actor && world.settlements[actor.at],
    next = actor?.toward !== undefined ? world.settlements[actor.toward] : undefined;
  const dst = actor?.destination !== undefined ? world.settlements[actor.destination] : undefined;
  const realm =
    actor?.state !== undefined ? world.states.find((s) => s.id === actor.state) : undefined;
  const available = all.filter((a) => filters[a.kind]);
  return (
    <section className="atlas-road-ledger" aria-label="На дорогах">
      <div className="atlas-road-head">
        <div>
          <span className="atlas-road-eyebrow">ДОРОЖНАЯ СВОДКА</span>
          <h3>На дорогах</h3>
        </div>
        <span>
          {world.mapKnowledge ? 'Только в поле зрения героя' : 'Замеченные путники и отряды'}
        </span>
      </div>
      <div className="atlas-road-filters" aria-label="Кого показывать">
        {actorKindIds.map((kind) => (
          <button
            key={kind}
            type="button"
            aria-pressed={filters[kind]}
            onClick={() => toggle(kind)}
          >
            <svg
              width="24"
              height="24"
              viewBox="-14 -14 28 28"
              aria-hidden="true"
              style={{ '--unit-ink': actorKinds[kind].color } as CSSProperties}
            >
              <ActorBadge kind={kind} />
            </svg>
            {actorKinds[kind].many} <small>{all.filter((a) => a.kind === kind).length}</small>
          </button>
        ))}
      </div>
      {available.length > 0 && (
        <label className="atlas-road-list">
          <span>Наблюдения поблизости</span>
          <select
            aria-label="Выбрать путника"
            value={actor?.id ?? ''}
            onChange={(e) => select(e.target.value || null)}
          >
            <option value="">Выбрать путника…</option>
            {available.map((a) => (
              <option key={a.id} value={a.id}>
                {actorKinds[a.kind].one} · {a.commander ?? a.name} · {world.settlements[a.at]?.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {available.length === 0 && (
        <p className="atlas-road-empty">
          {all.length === 0
            ? 'Герой сейчас никого не видит.'
            : 'Все замеченные путники скрыты фильтрами.'}
        </p>
      )}
      {actor && place && (
        <article className="atlas-road-card">
          <div className="atlas-road-card-head">
            <div>
              <span className="atlas-road-eyebrow">
                {actorKinds[actor.kind].one}
                {realm ? ` · ${realm.name}` : ''}
              </span>
              <h4>{actor.name}</h4>
            </div>
            <button
              type="button"
              aria-label="Закрыть дорожную карточку"
              onClick={() => select(null)}
            >
              ×
            </button>
          </div>
          <p>
            {next ? `В пути: ${place.name} → ${next.name}` : `Стоянка: ${place.name}`}
            {dst && dst.id !== next?.id ? ` · цель: ${dst.name}` : ''}
          </p>
          {actor.commander && (
            <p>
              {actor.patrol ? 'Командир дозора' : 'Полевой генерал'}:{' '}
              <strong>{actor.commander}</strong>
            </p>
          )}
          {actor.count !== undefined && <p>Численность: {actor.count}</p>}
          {actor.freight && (
            <p>
              Груз: {goods[actor.freight.good]} · {Math.floor(actor.freight.amount)} ед.
            </p>
          )}
          {actor.kind === 'band' && <p>Грабит неохраняемые караваны на своём маршруте.</p>}
          {actor.kind === 'merchant' &&
            (!actor.offers?.length ? (
              <p>
                {next || !actor.offers
                  ? 'Торговать можно, когда вы встретитесь на стоянке.'
                  : 'Товары распроданы.'}
              </p>
            ) : (
              <ul className="atlas-road-offers">
                {actor.offers.map((offer) => (
                  <li key={offer.good}>
                    <span>
                      {goods[offer.good]} · осталось {offer.amount}
                    </span>
                    <button
                      type="button"
                      disabled={!!world.player?.journey || (world.player?.gold ?? 0) < offer.price}
                      onClick={() =>
                        void send({
                          type: 'road_buy',
                          person: actor.person!,
                          good: offer.good,
                          quantity: 1,
                        })
                      }
                    >
                      Купить за {offer.price} мон.
                    </button>
                  </li>
                ))}
              </ul>
            ))}
          {actor.canEscort && (
            <button type="button" onClick={() => void send({ type: 'escort', caravan: actor.id })}>
              Взять охрану каравана · 30 мон.
            </button>
          )}
        </article>
      )}
    </section>
  );
}
