import { useEffect, useRef } from 'react';
import type { View } from './types';
import type { Point } from './atlas-geometry';

import type { AtlasWorld, Landmark as AtlasSite, LandmarkKind } from '@living-world/simulation';

const signs = {
  wizard_tower: ['Башня магов', 'M-5 7h10M-3 7V-3l3-6 3 6V7M-3-3h6M0 0v2M0-8v-3'],
  academy: ['Академия', 'M0 5q-4-3-7-1v-8q4-1 7 2 3-3 7-2v8Q3 2 0 5ZM0-2v7M-7 6q4-1 7 1 3-2 7-1'],
  fortress: ['Крепость', 'M-7 7V-5h3v2h2v-2h4v2h2v-2h3V7ZM-2 7V2a2 2 0 014 0v5M-8 7h16'],
  monastery: ['Монастырь', 'M-7 7V0L0-6l7 6v7ZM0-6v-5m-2 2h4M-2 7V2a2 2 0 014 0v5'],
  mine: ['Шахта', 'M-7 7l2-9 5-5 5 5 2 9ZM-3 7V1l3-3 3 3v6M-6-6l12 7M4-7l-8 10'],
  harbor: [
    'Гавань',
    'M0-7V7M-3-2h6M-7 1q1 7 7 6 6 1 7-6l-3 2m-11-2 3 2 M-1-8a1 1 0 102 0 1 1 0 10-2 0',
  ],
  barrow: ['Курган', 'M-8 6q2-10 8-10t8 10ZM-3 6V2h6v4M0-4v-4m-3 0h6'],
  grove: [
    'Священная роща',
    'M0 7V-7m0 9L-5-3M0 4l6-5M-6 7H6M0-8q-3 0-2 4m-4 0q-3 1 0 4m11-2q4 1 1 3',
  ],
  observatory: ['Обсерватория', 'M-7 7V3a7 7 0 0114 0v4ZM-7 3H7M0-4v-3m0-5v4m-2-2h4M0 3v4'],
  trade_post: ['Торговый двор', 'M-8-2 0-7l8 5ZM-6-2v9m12-9v9M-7 6H7M-3 0v2m6-2v2'],
} as const satisfies Record<LandmarkKind, readonly [string, string]>;
export const statusLabel = {
  standing: 'Действует',
  ruined: 'Руины',
  sealed: 'Запечатано',
  abandoned: 'Заброшено',
};
const roles = {
  claimant: 'Претендует',
  guardian: 'Охраняет',
  opportunist: 'Ищет выгоду',
  independent: 'Отстаивает независимость',
};
const ruinSigns: Partial<Record<LandmarkKind, string>> = {
  wizard_tower: 'M-8 7h16M-4 7V-4l2 1 2-2 1 4 3-1V7M-2 3l2 1-1 3m6-1 1-1',
  academy: 'M-9 7h18M-7 7V-3l2-1 3 1 3-3 1 2 3-1 2 1V7M-4 7V1M1 7V0m3 7 2-2',
  fortress: 'M-8 7h16M-7 7V-5h2v2h2l2 4 1 6M2 7V2l1-3 2 1 1-3 1 2V7',
};
export const kindLabel = (s: AtlasSite) =>
  s.builtDay !== undefined ? 'Сторожевая башня' : (signs[s.kind]?.[0] ?? 'Достопримечательность');

export function AtlasSiteMarker({
  site,
  at,
  anchor,
  focal,
  active,
  scale,
  onSelect,
}: {
  site: AtlasSite;
  at: Point;
  anchor: Point;
  focal: boolean;
  active: boolean;
  scale: number;
  onSelect: () => void;
}) {
  return (
    <g
      className={`atlas-site is-${site.status}${focal ? ' is-focal' : ''}${active ? ' is-active' : ''}`}
    >
      {(at[0] !== anchor[0] || at[1] !== anchor[1]) && (
        <path className="atlas-site-leader" d={`M${anchor.join(',')}L${at.join(',')}`} />
      )}
      <g
        transform={`translate(${at.join(',')}) scale(${scale})`}
        onClick={onSelect}
        role="button"
        tabIndex={0}
        aria-label={`${site.name} · ${kindLabel(site)} · ${statusLabel[site.status]}`}
        aria-pressed={active}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect();
          }
        }}
      >
        <title>
          {site.name} · {kindLabel(site)} · {statusLabel[site.status]}
        </title>
        <circle className="atlas-site-hit" r="17" fill="transparent" />
        {site.status === 'ruined' ? (
          <path className="atlas-site-frame" d="M-5-11H5L8-8l-2 3 5 1v9l-6 6H-5l-6-6V-5Z" />
        ) : site.status === 'sealed' ? (
          <path className="atlas-site-frame" d="M0-13 12 0 0 13-12 0Z" />
        ) : (
          <path className="atlas-site-frame" d="M-10-8-4-11H4l6 3 2 8-2 7-6 4h-8l-6-4-2-7Z" />
        )}
        <path
          className="atlas-site-glyph"
          d={(site.status === 'ruined' && ruinSigns[site.kind]) || signs[site.kind][1]}
          transform="scale(.75)"
        />
        {focal && (
          <path
            className="atlas-site-star"
            d="M0-18 1.5-15 4.5-14 1.5-13 0-10-1.5-13-4.5-14-1.5-15Z"
          />
        )}
      </g>
    </g>
  );
}

export function AtlasFieldbook({
  atlas,
  site,
  world,
  close,
  pick,
  onRealm,
}: {
  atlas: AtlasWorld;
  site?: AtlasSite;
  world: View;
  close: () => void;
  pick: (id: number) => void;
  onRealm: (id: number) => void;
}) {
  const fieldbook = useRef<HTMLElement>(null);
  useEffect(() => {
    const panel = fieldbook.current;
    if (!panel) return;
    panel.scrollTop = 0;
    const bounds = panel.getBoundingClientRect();
    if (bounds.top + Math.min(bounds.height, 95) > window.innerHeight)
      panel.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [site?.id]);
  const scene = atlas.scenario;
  const town = site && world.settlements.find((s) => s.id === site.settlement);
  const controller = town && world.states.find((s) => s.id === town.state);
  const history = site ? atlas.history.filter((e) => e.site === site.id) : atlas.history;
  const motive = controller && scene.roles.find((r) => r.state === controller.id);
  const theatre = scene.campaign;
  const war =
    theatre &&
    world.wars.find(
      (w) =>
        w.campaign &&
        w.a === theatre.a &&
        w.b === theatre.b &&
        w.target === theatre.target &&
        w.started === 0,
    );
  return (
    <section
      ref={fieldbook}
      className="atlas-fieldbook"
      aria-label={site ? 'Сведения о месте' : 'Хроника континента'}
    >
      <header>
        <div>
          <small>
            {site ? `${kindLabel(site)} · ${statusLabel[site.status]}` : 'Свиток основания'}
          </small>
          <h3>{site?.name ?? scene.title}</h3>
        </div>
        <button type="button" onClick={close} aria-label="Закрыть сведения">
          ×
        </button>
      </header>
      <p>{site?.lore ?? scene.premise}</p>
      {site ? (
        <>
          {site.damageCause && (
            <p className="atlas-place-warning">
              {site.damageCause === 'siege'
                ? 'Место пострадало при осаде.'
                : 'Место опустело после ухода жителей.'}
            </p>
          )}
          {site.builtDay !== undefined && (
            <p className="atlas-context">Построено: день {site.builtDay}.</p>
          )}
          <p className="atlas-context">
            {town?.name}
            {controller && (
              <>
                {' '}
                · <button onClick={() => onRealm(controller.id)}>{controller.name}</button>
              </>
            )}
          </p>
          {motive && (
            <details>
              <summary>Интерес державы</summary>
              <p>
                {roles[motive.role]}: {motive.motive}
              </p>
            </details>
          )}
        </>
      ) : (
        <>
          <p className="atlas-context">
            {scene.fallenPower} · {scene.trigger}
          </p>
          {war && theatre && (
            <p className="atlas-war-status">
              <strong>{war.active ? 'Война идёт' : 'Война завершилась'}</strong>
              {' · '}
              {world.states.find(({ id }) => id === theatre.a)?.name}
              {' и '}
              {world.states.find(({ id }) => id === theatre.b)?.name}
              <br />
              Цель похода: {world.settlements.find(({ id }) => id === theatre.target)?.name}
            </p>
          )}
          <div className="atlas-record-links">
            {atlas.sites.some((s) => s.id === scene.focalSite) && (
              <button onClick={() => pick(scene.focalSite)}>✦ Ключевое место</button>
            )}
            <label>
              <span className="sr-only">Достопримечательности</span>
              <select
                aria-label="Достопримечательности"
                value=""
                onChange={(e) => pick(Number(e.target.value))}
              >
                <option value="" disabled>
                  Все места · {atlas.sites.length}
                </option>
                {atlas.sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} · {kindLabel(s)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </>
      )}
      {history.length > 0 && (
        <details open={!!site}>
          <summary>Летопись · {history.length}</summary>
          <ol>
            {history.map((e) => (
              <li key={e.id}>
                <strong>
                  {e.year} · {e.title}
                </strong>
                <p>{e.detail}</p>
              </li>
            ))}
          </ol>
        </details>
      )}
      {!site && (
        <details>
          <summary>Державы и их интересы</summary>
          <ul>
            {scene.roles.map((r) => {
              const state = world.states.find((s) => s.id === r.state);
              return (
                state && (
                  <li key={r.state}>
                    <button onClick={() => onRealm(state.id)}>{state.name}</button> ·{' '}
                    {roles[r.role]}
                    <p>{r.motive}</p>
                  </li>
                )
              );
            })}
          </ul>
        </details>
      )}
    </section>
  );
}
