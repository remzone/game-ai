import { useState, type CSSProperties } from 'react';
import { emblems } from '@living-world/simulation';
import type { View } from './types';
import { Portrait } from './portrait';

const governments: Record<string, string> = {
  feudal_monarchy: 'Феодальная монархия',
  absolute_monarchy: 'Абсолютная монархия',
  elective_monarchy: 'Выборная монархия',
  republic: 'Республика',
  merchant_republic: 'Торговая республика',
  theocracy: 'Теократия',
  tribal_confederation: 'Союз племён',
  military_dictatorship: 'Военная диктатура',
  council_of_nobles: 'Совет знати',
  magocracy: 'Магократия',
};
const jobs: Record<string, string> = {
  farmer: 'Земледелец',
  woodcutter: 'Лесник',
  miner: 'Шахтёр',
  smith: 'Кузнец',
  merchant: 'Купец',
  soldier: 'Воин',
  child: 'Ребёнок',
};
const faithMarks = ['☀', '☽', '✣'];

const assets = {
  grain: 'зерно',
  wood: 'дерево',
  stone: 'камень',
  iron: 'железо',
  tools: 'инструменты',
  weapons: 'оружие',
  horses: 'лошади',
};
const treaties = {
  peace: 'мир',
  alliance: 'союз',
  trade: 'торговля',
  access: 'проход',
  vassalage: 'вассалитет',
  guarantee: 'гарантия',
  tribute: 'дань',
};
const formatPop = (number: number) => Math.floor(number).toLocaleString('ru');

export function StateCodex({
  world,
  selected,
  onSelect,
  onFaith,
  onLocate,
}: {
  world: View;
  selected: number | null;
  onSelect: (id: number) => void;
  onFaith: (id: number) => void;
  onLocate: (id: number) => void;
}) {
  const [compare, setCompare] = useState<number | null>(null);
  const state = world.states.find((s) => s.id === selected) ?? world.states[0];
  if (!state) return null;
  const capital = world.settlements.find((s) => s.id === state.capital);
  const ruler = world.rulers.find((p) => p?.person === state.ruler);
  const lore = world.worldLore?.states.find((s) => s.id === state.id);
  const originalRuler = world.worldLore?.people.find((p) => p.id === state.ruler);
  const faith = world.religions.find((f) => f.id === state.laws.religion);
  const owned = world.settlements.filter((town) => town.state === state.id);
  const population = owned.reduce((n, town) => n + town.population, 0);
  const portIds = new Set(
    world.geography?.cells.filter((cell) => cell.port).map((cell) => cell.settlement),
  );
  const ports = owned.filter((town) => portIds.has(town.id));
  const geographyLinks = new Set<number>();
  if (world.geography) {
    const byID = new Map(world.settlements.map((town) => [town.id, town.state]));
    for (const cell of world.geography.cells) {
      if (byID.get(cell.settlement) !== state.id) continue;
      for (const adjacent of cell.neighbors) {
        const neighbor = byID.get(adjacent);
        if (neighbor != null && neighbor !== state.id) geographyLinks.add(neighbor);
      }
    }
  } else {
    for (const road of world.roads) {
      const a = world.settlements[road.a],
        b = world.settlements[road.b];
      if (a?.state === state.id && b && b.state !== state.id) geographyLinks.add(b.state);
      if (b?.state === state.id && a && a.state !== state.id) geographyLinks.add(a.state);
    }
  }
  const neighbors = world.states.filter((item) => geographyLinks.has(item.id));
  const nearestTreaties = world.treaties.filter(
    (t) => (t.a === state.id || t.b === state.id) && t.until >= world.day,
  );
  const activeTrade = world.caravans.filter((caravan) => {
    if (caravan.status !== 'traveling') return false;
    const a = world.settlements[caravan.from],
      b = world.settlements[caravan.to];
    return a?.state === state.id || b?.state === state.id;
  });
  const opponent = world.states.find((item) => item.id === compare && item.id !== state.id);
  const comparisonRows = opponent
    ? [
        [
          'Строй',
          governments[state.government] ?? state.government,
          governments[opponent.government] ?? opponent.government,
        ],
        [
          'Поселения',
          owned.length,
          world.settlements.filter((town) => town.state === opponent.id).length,
        ],
        [
          'Жители',
          formatPop(population),
          formatPop(
            world.settlements
              .filter((town) => town.state === opponent.id)
              .reduce((n, town) => n + town.population, 0),
          ),
        ],
        ['Казна', formatPop(state.treasury), formatPop(opponent.treasury)],
        ['Налог', `${Math.floor(state.tax * 100)}%`, `${Math.floor(opponent.tax * 100)}%`],
      ]
    : [];
  return (
    <section className="codex-section">
      <label className="codex-select">
        Свод держав
        <select value={state.id} onChange={(e) => onSelect(Number(e.target.value))}>
          {world.states.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </label>
      <div className="codex-crest" style={{ '--crest': state.color } as CSSProperties}>
        <span className="codex-sigil" aria-hidden="true">
          {emblems[state.emblem ?? 'tower']}
        </span>
        <p className="eyebrow">{governments[state.government] ?? 'Государственное устройство'}</p>
        <h2>{state.name}</h2>
        {capital && (
          <p>
            <button className="codex-link" onClick={() => onLocate(capital.id)}>
              Столица · {capital.name}
            </button>
          </p>
        )}
      </div>
      {lore && (
        <>
          <h3>Прошлое державы</h3>
          <p>{lore.summary}</p>
          <h3>Разлом</h3>
          <p>{lore.conflict}</p>
        </>
      )}
      <div className="codex-stat-grid">
        <div>
          <small>Легитимность</small>
          <strong>{Math.floor(state.legitimacy)}</strong>
        </div>
        <div>
          <small>Налог</small>
          <strong>{Math.floor(state.tax * 100)}%</strong>
        </div>
        <div>
          <small>Казна</small>
          <strong>{Math.floor(state.treasury).toLocaleString('ru')}</strong>
        </div>
      </div>
      <h3>Земли и торговля</h3>
      <p>
        {owned.length} поселений · {formatPop(population)} жителей
        {world.geography ? ` · ${ports.length} портов` : ''}.
      </p>
      {activeTrade.length > 0 ? (
        <details className="codex-economy">
          <summary>Караваны в пути: {activeTrade.length}</summary>
          {activeTrade.slice(0, 8).map((c) => (
            <p key={c.id}>
              <strong>
                {world.settlements[c.from]?.name} → {world.settlements[c.to]?.name}
              </strong>
              <br />
              {c.amount} ед. · {assets[c.good]}
            </p>
          ))}
        </details>
      ) : (
        <p className="muted">Нет караванов этой державы в пути.</p>
      )}
      <div className="ruler-figure">
        {ruler?.appearance && (
          <Portrait
            value={ruler.appearance}
            className="ruler-codex-portrait"
            label={`Портрет: ${ruler.name}`}
          />
        )}
        <h3>{state.rulerTitle || 'Правитель'}</h3>
        <p>
          <strong>
            {ruler?.name ?? (state.ruler >= 0 ? `Житель №${state.ruler}` : 'Престол свободен')}
          </strong>
        </p>
        {originalRuler?.biography || ruler?.biography ? (
          <p>{originalRuler?.biography ?? ruler?.biography}</p>
        ) : null}
      </div>
      {faith && (
        <button className="codex-link" onClick={() => onFaith(faith.id)}>
          Верование державы · {faith.name} →
        </button>
      )}
      {state.doctrines.length > 0 && <p className="muted">Уклад: {state.doctrines.join(', ')}.</p>}
      {(neighbors.length > 0 || nearestTreaties.length > 0) && (
        <details className="codex-diplomacy">
          <summary>Соседи и договоры</summary>
          {neighbors.map((item) => (
            <button className="codex-link" key={item.id} onClick={() => onSelect(item.id)}>
              {item.name} · отношения {state.relations[item.id] ?? 0}
            </button>
          ))}
          {nearestTreaties.map((t) => {
            const other = world.states.find((item) => item.id === (t.a === state.id ? t.b : t.a));
            return (
              other && (
                <p key={t.id}>
                  {other.name} · {treaties[t.type]}
                </p>
              )
            );
          })}
        </details>
      )}
      <details className="codex-comparison">
        <summary>Сравнить державы</summary>
        <label>
          Держава для сравнения
          <select
            value={opponent?.id ?? ''}
            onChange={(e) => setCompare(e.target.value === '' ? null : Number(e.target.value))}
          >
            <option value="">Выберите державу</option>
            {world.states
              .filter((item) => item.id !== state.id)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
          </select>
        </label>
        {opponent && (
          <div
            className="codex-compare-table"
            role="region"
            aria-label="Сравнение держав"
            tabIndex={0}
          >
            <table>
              <thead>
                <tr>
                  <th>Показатель</th>
                  <th>{state.name}</th>
                  <th>{opponent.name}</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map(([title, left, right]) => (
                  <tr key={title}>
                    <th scope="row">{title}</th>
                    <td>{left}</td>
                    <td>{right}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </details>
    </section>
  );
}

export function FaithCodex({
  world,
  selected,
  onSelect,
  onRealm,
}: {
  world: View;
  selected: number | null;
  onSelect: (id: number) => void;
  onRealm: (id: number) => void;
}) {
  const faith =
    world.religions.find((f) => f.id === selected) ??
    world.religions.find((f) => f.id === world.hero?.faith) ??
    world.religions[0];
  if (!faith) return <p className="muted">В этом мире ещё не записаны верования.</p>;
  const lore = world.worldLore?.faiths.find((f) => f.id === faith.id);
  const recognized = world.states.filter((s) => s.laws.religion === faith.id);
  return (
    <section className="codex-section">
      <label className="codex-select">
        Верования континента
        <select value={faith.id} onChange={(e) => onSelect(Number(e.target.value))}>
          {world.religions.map((f) => (
            <option value={f.id} key={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </label>
      <div className="codex-crest codex-faith">
        <span className="codex-sigil" aria-hidden="true">
          {faithMarks[faith.id % faithMarks.length]}
        </span>
        <p className="eyebrow">
          {world.hero?.faith === faith.id ? 'ПУТЬ ВАШЕГО ГЕРОЯ' : 'ВЕРОВАНИЯ'}
        </p>
        <h2>{faith.name}</h2>
      </div>
      <h3>Учение</h3>
      <p>{faith.doctrine}</p>
      {lore && (
        <>
          <h3>Предание</h3>
          <p>{lore.summary}</p>
          <h3>Обряд</h3>
          <p>{lore.rite}</p>
        </>
      )}
      <h3>Признано законами</h3>
      {recognized.length > 0 ? (
        <div className="codex-faith-states">
          {recognized.map((s) => (
            <button key={s.id} onClick={() => onRealm(s.id)}>
              {emblems[s.emblem ?? 'tower']} {s.name}
            </button>
          ))}
        </div>
      ) : (
        <p className="muted">Ни одна действующая держава не закрепила это верование в законе.</p>
      )}
    </section>
  );
}

export function FoundingChronicle({ world }: { world: View }) {
  const [expanded, setExpanded] = useState(true);
  const lore = world.worldLore;
  if (!lore) return null;
  return (
    <section className="codex-section founding-chronicle">
      <div className="codex-crest">
        <span className="codex-sigil" aria-hidden="true">
          ✧
        </span>
        <p className="eyebrow">ПРЕДЫСТОРИЯ МИРА</p>
        <h2>{lore.continent}</h2>
        <p>{lore.premise}</p>
      </div>
      <button
        className="codex-link"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        {expanded ? 'Свернуть летопись' : 'Развернуть летопись'}
      </button>
      {expanded && (
        <ol className="codex-timeline">
          {lore.history.map((event, i) => (
            <li key={`${event.year}-${i}`}>
              <span className="eyebrow">
                {event.year < 0 ? `${Math.abs(event.year)} г. до начала` : `${event.year} г.`}
              </span>
              <strong>{event.title}</strong>
              <p>{event.detail}</p>
            </li>
          ))}
        </ol>
      )}
      {lore.people.length > 0 && (
        <div className="codex-cast">
          <h3>Люди первой главы</h3>
          {lore.people.map((person) => (
            <details key={person.id}>
              <summary>{person.name}</summary>
              {person.role && (
                <small>
                  {person.role === 'ruler'
                    ? 'Правитель при основании мира'
                    : (jobs[person.profession ?? ''] ?? 'Житель континента')}
                </small>
              )}
              <p>{person.biography}</p>
            </details>
          ))}
        </div>
      )}
    </section>
  );
}
