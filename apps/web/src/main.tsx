import React, { useEffect, useState, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import {
  date,
  season,
  RACES,
  GOODS,
  type Command,
  type World,
  type Race,
} from '@living-world/simulation';
import { api, ApiError } from './api';
import type { View } from './types';
import './style.css';
import { ART } from './art';
const artwork = (key: string) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(ART[key]);
const Game = lazy(() => import('./game').then((m) => ({ default: m.Game })));
const goods: Record<string, string> = {
  grain: 'Зерно',
  wood: 'Дерево',
  stone: 'Камень',
  iron: 'Железо',
  tools: 'Инструменты',
  weapons: 'Оружие',
  horses: 'Лошади',
};
const raceNames = ['Человек', 'Эльф', 'Тёмный эльф', 'Орк', 'Дворф', 'Гоблин'];
const fmt = (n: number) => Math.floor(n).toLocaleString('ru');
function App() {
  const [world, setWorld] = useState<View | null>(null),
    [loaded, setLoaded] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [locked, setLocked] = useState(false),
    [password, setPassword] = useState(''),
    [selected, setSelected] = useState(0),
    [tab, setTab] = useState('place'),
    [newGame, setNewGame] = useState(false),
    [menu, setMenu] = useState(true),
    [menuSaves, setMenuSaves] = useState(false),
    [slots, setSlots] = useState<any[]>([]),
    [admin, setAdmin] = useState<any>(null),
    [online, setOnline] = useState(false),
    [busy, setBusy] = useState(false),
    [authVersion, setAuthVersion] = useState(0),
    [unit, setUnit] = useState<'all' | 'infantry' | 'spearmen' | 'archers' | 'cavalry' | 'mages'>(
      'all',
    );
  async function action<T>(fn: () => Promise<T>) {
    setError('');
    try {
      return await fn();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) setLocked(true);
      setError(e instanceof Error ? e.message : 'Ошибка');
    }
  }
  useEffect(() => {
    void action(async () => {
      const w = await api<View | null>('/world');
      setWorld(w);
      setSelected(w?.hero?.settlement ?? 0);
      setLoaded(true);
    });
  }, [authVersion]);
  useEffect(() => {
    if (locked) return;
    let socket: WebSocket | undefined, retry: ReturnType<typeof setTimeout>;
    let disposed = false;
    function connect() {
      if (disposed) return;
      socket = new WebSocket(
        `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`,
      );
      socket.onopen = () => setOnline(true);
      socket.onmessage = (e) => {
        try {
          setWorld(JSON.parse(e.data));
        } catch {
          setError('Некорректное обновление мира');
        }
      };
      socket.onclose = () => {
        setOnline(false);
        if (!disposed) retry = setTimeout(connect, 2500);
      };
    }
    connect();
    return () => {
      disposed = true;
      clearTimeout(retry);
      socket?.close();
    };
  }, [locked, authVersion]);
  async function send(c: Command) {
    await action(async () => setWorld(await api('/command', c)));
  }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).matches('input,select,textarea')) return;
      if (e.key === 'Escape') {
        if (!menu && world?.speed) void send({ type: 'speed', value: 0 });
        setMenu((v) => !v);
        setNewGame(false);
        return;
      }
      if (menu || newGame) return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (world) void send({ type: 'speed', value: world.speed === 0 ? 1 : 0 });
      }
      if (e.key.toLowerCase() === 'e' && world?.hero) void send({ type: 'enter' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [world, menu, newGame]);
  useEffect(() => {
    if (tab === 'saves' || menuSaves) void action(async () => setSlots(await api('/saves')));
    if (tab === 'admin') void action(async () => setAdmin(await api('/admin')));
  }, [tab, menuSaves]);
  const p = world?.player,
    hero = world?.hero,
    local = world && hero ? world.settlements[hero.settlement] : null,
    s = world?.player?.scene === 'settlement' ? local : (world?.settlements[selected] ?? local),
    army = world?.armies.find((a) => a.id === p?.army);
  if (locked)
    return (
      <div className="entry">
        <div className="entry-card">
          <span className="eyebrow">LIVING WORLD RPG</span>
          <h1>Пепельная корона</h1>
          <p>Введите пароль вашего сервера.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void action(async () => {
                await api('/login', { password });
                setPassword('');
                setLocked(false);
                setAuthVersion((v) => v + 1);
              });
            }}
          >
            <input
              type="password"
              aria-label="Пароль сервера"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button>Войти</button>
          </form>
          {error && <p role="alert">{error}</p>}
        </div>
      </div>
    );
  if (!loaded) return <div className="entry">{error || 'Подключение к миру…'}</div>;
  if (menu && !newGame)
    return (
      <div className="entry title-screen">
        <div className="title-copy">
          <span className="eyebrow">LIVING WORLD RPG · ALPHA</span>
          <h1>
            Пепельная
            <br />
            <em>корона</em>
          </h1>
          <p>
            Мир живёт своей жизнью.
            <br />
            Какой след оставит ваша династия?
          </p>
          <div className="title-actions">
            <button className="primary" onClick={() => setNewGame(true)}>
              Начать новую историю →
            </button>
            <button
              disabled={!world?.player}
              onClick={() => {
                setMenu(false);
                setMenuSaves(false);
              }}
            >
              Продолжить
            </button>
            <button onClick={() => setMenuSaves((v) => !v)}>Сохранения</button>
          </div>
          {menuSaves && (
            <div className="menu-saves">
              <h3>Загрузить историю</h3>
              {slots.length === 0 && <p>Сохранений пока нет.</p>}
              {slots.map((slot) => (
                <button
                  key={slot.slot}
                  onClick={() =>
                    void action(async () => {
                      const next = await api<View>(`/saves/${slot.slot}/load`, {});
                      setWorld(next);
                      setSelected(next.hero?.settlement ?? 0);
                      setMenu(false);
                      setMenuSaves(false);
                    })
                  }
                >
                  {slot.slot === 0 ? 'Автосохранение' : `Слот ${slot.slot}`} · День {slot.day}
                </button>
              ))}
            </div>
          )}
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <small>10 держав · 300 поселений · живой мир</small>
        </div>
        <img className="title-hero" src={artwork('hero')} alt="Герой у стен крепости" />
      </div>
    );
  if (!world?.player || newGame)
    return (
      <div className="entry creation-screen">
        <div className="creation-content">
          <button
            className="back-link"
            onClick={() => {
              setNewGame(false);
              setMenu(true);
            }}
          >
            ← Главное меню
          </button>
          <span className="eyebrow">СОЗДАНИЕ ГЕРОЯ</span>
          <h2>У каждой династии есть начало</h2>
          <Biography
            busy={busy}
            onStart={async (seed, biography) => {
              setBusy(true);
              await action(async () => {
                const w = await api<View>('/new', { seed, biography });
                setWorld(w);
                setSelected(w.hero!.settlement);
                setTab('place');
                setNewGame(false);
                setMenu(false);
              });
              setBusy(false);
            }}
          />
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    );
  return (
    <div className="app">
      <header>
        <div className="brand">
          <img className="brand-art" src={artwork('castle')} alt="" />
          <div>
            ПЕПЕЛЬНАЯ КОРОНА<small>LIVING WORLD RPG</small>
          </div>
        </div>
        <div className="calendar">
          <b>{season(world.day)}</b>
          <span>
            {date(world.day)} · День {world.day}
          </span>
        </div>
        <div className="time">
          {([0, 1, 2, 5, 10] as const).map((n) => (
            <button
              aria-label={n ? `Скорость ${n}` : 'Пауза'}
              className={world.speed === n ? 'active' : ''}
              key={n}
              onClick={() => void send({ type: 'speed', value: n })}
            >
              {n ? `×${n}` : 'Ⅱ'}
            </button>
          ))}
        </div>
        <span className={`connection ${online ? 'on' : ''}`}>
          {online ? 'Мир на связи' : 'Переподключение…'}
        </span>
      </header>
      <div className="hero-bar">
        <b>{p!.name}</b>
        <span>{p!.title}</span>
        <span className="health">
          Здоровье <meter min="0" max="100" value={hero!.health} /> {fmt(hero!.health)}
        </span>
        <span>◈ {fmt(p!.gold)} монет</span>
        <span>⚑ {army?.members.length ?? 0} бойцов</span>
        <span>Население: {fmt(world.population.alive)}</span>
      </div>
      {error && (
        <div className="error" role="alert" onClick={() => setError('')}>
          {error} <span>×</span>
        </div>
      )}
      {notice && (
        <div className="notice" onClick={() => setNotice('')}>
          {notice}
        </div>
      )}
      <main>
        <section className="map-panel">
          <div className="map-heading">
            <div>
              <span className="eyebrow">
                {p!.scene === 'world'
                  ? 'КОНТИНЕНТ'
                  : p!.scene === 'battle'
                    ? 'ПОЛЕ БОЯ'
                    : 'ПОСЕЛЕНИЕ'}
              </span>
              <h2>{p!.scene === 'world' ? 'Земли десяти корон' : local?.name}</h2>
            </div>
            <span>
              {p!.journey
                ? 'В пути · ' + p!.journey.remaining + ' дн. до следующей точки'
                : p!.scene === 'world'
                  ? 'Выберите поселение на карте'
                  : 'Вы на месте'}
            </span>
          </div>
          <Suspense fallback={<div className="game">Загрузка карты…</div>}>
            <Game
              world={world}
              selected={selected}
              onSelect={(id) => {
                setSelected(id);
                setTab('place');
              }}
              send={(c) => void send(c)}
              unit={unit}
            />
          </Suspense>
          <div className="map-footer">
            <span>
              ● Герой &nbsp; ▪ Караван &nbsp; <i>●</i> Угроза
            </span>
            <span>Пробел — пауза · E — войти</span>
          </div>
        </section>
        <aside>
          <div className="side-content">
            {!hero!.alive && (
              <section className="card">
                <h2>История героя окончена</h2>
                <p>
                  {p!.gameOver ? 'Нет допустимого наследника.' : 'Выберите взрослого наследника.'}
                </p>
                {world.heirs
                  .filter((h) => h.alive)
                  .map((h) => (
                    <button key={h.id} onClick={() => void send({ type: 'inherit', person: h.id })}>
                      Продолжить за наследника {h.id}
                    </button>
                  ))}
              </section>
            )}
            {p!.scene === 'battle' && world.battle && (
              <section className="battle-card">
                <span className="eyebrow">ТАКТИЧЕСКИЙ БОЙ</span>
                <h2>
                  {world.battle.status === 'active'
                    ? 'Схватка с волками'
                    : { victory: 'Победа', defeat: 'Поражение', retreated: 'Отступление' }[
                        world.battle.status
                      ]}
                </h2>
                <p className="muted">
                  {Math.floor(world.battle.elapsed)} с · {local?.name}
                </p>
                {(['player', 'enemy'] as const).map((side) => {
                  const all = world.battle!.fighters.filter((f) => f.side === side);
                  const alive = all.filter((f) => f.hp > 0).length;
                  return (
                    <div className={`force-meter ${side}`} key={side}>
                      <div>
                        <span>{side === 'player' ? 'Ваш отряд и герой' : 'Волки'}</span>
                        <b>
                          {alive} / {all.length}
                        </b>
                      </div>
                      <meter min="0" max={Math.max(1, all.length)} value={alive} />
                    </div>
                  );
                })}
                <h3>Приказ отряду</h3>
                <select
                  aria-label="Отряд для приказа"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as typeof unit)}
                >
                  <option value="all">Все бойцы</option>
                  <option value="infantry">Герой / пехота</option>
                  <option value="spearmen">Копейщики</option>
                </select>
                <p className="muted">
                  Нажмите на поле, чтобы задать позицию выбранным бойцам. В пределах досягаемости
                  они атакуют сами.
                </p>
                <button
                  className="primary full"
                  disabled={world.battle.status !== 'active'}
                  onClick={() => {
                    const enemy = world.battle!.fighters.find(
                      (f) => f.side === 'enemy' && f.hp > 0,
                    );
                    if (enemy)
                      void send({ type: 'battle_order', x: enemy.x, y: enemy.y, unitClass: unit });
                  }}
                >
                  Сблизиться с противником
                </button>
                <button
                  className="full"
                  onClick={() =>
                    void send({ type: world.battle?.status === 'active' ? 'retreat' : 'leave' })
                  }
                >
                  {world.battle.status === 'active' ? 'Отступить' : 'Вернуться на карту'}
                </button>
                <small>Погибшие бойцы — реальные жители мира. Потери сохраняются после боя.</small>
              </section>
            )}
            {tab === 'history' && (
              <div className="chronicle">
                <span className="eyebrow">ЛЕТОПИСЬ МИРА</span>
                {world.events
                  .slice(-5)
                  .reverse()
                  .map((e) => (
                    <p key={e.id}>
                      <time>{date(e.day)}</time>
                      {e.text}
                    </p>
                  ))}
              </div>
            )}
            {tab === 'place' && s && p!.scene !== 'battle' && (
              <>
                <span className="eyebrow">{world.states[s.state].name}</span>
                <h2>{s.name}</h2>
                <img
                  className="place-portrait"
                  src={artwork(s.kind === 'ruins' ? 'ruins' : s.central ? 'castle' : 'house')}
                  alt=""
                />
                <p className="muted">
                  {{ city: 'Город', town: 'Городок', village: 'Деревня', ruins: 'Руины' }[s.kind] ??
                    s.kind}{' '}
                  ·{' '}
                  {{ forest: 'Лес', mountain: 'Горы', plains: 'Равнина', marsh: 'Болота' }[s.biome]}{' '}
                  · {s.central ? 'Центр области' : 'Поселение'}
                </p>
                <div className="metrics">
                  <div>
                    <b>{fmt(s.population)}</b>жителей
                  </div>
                  <div>
                    <b>{fmt(s.loyalty)}%</b>лояльность
                  </div>
                  <div>
                    <b>{s.infrastructure}</b>хозяйство
                  </div>
                </div>
                {s.id !== hero!.settlement ? (
                  <button
                    className="primary full"
                    disabled={!!p!.journey}
                    onClick={() => void send({ type: 'travel', settlement: s.id })}
                  >
                    Отправиться в {s.name}
                  </button>
                ) : (
                  <button
                    className="primary full"
                    disabled={!!p!.journey}
                    onClick={() =>
                      void send({ type: p!.scene === 'settlement' ? 'leave' : 'enter' })
                    }
                  >
                    {p!.scene === 'settlement' ? 'Выйти на карту' : 'Войти в поселение'}
                  </button>
                )}
                {p!.visited.includes(s.id) || s.id === hero!.settlement ? (
                  <>
                    {p!.scene === 'settlement' && (
                      <div className="settlement-actions">
                        <button
                          onClick={() =>
                            document
                              .getElementById('market-panel')
                              ?.scrollIntoView({ block: 'start' })
                          }
                        >
                          Посетить рынок
                        </button>
                        <button
                          onClick={() =>
                            document
                              .getElementById('recruit-panel')
                              ?.scrollIntoView({ block: 'start' })
                          }
                        >
                          Нанять воинов
                        </button>
                        <button
                          onClick={() =>
                            document
                              .getElementById('quests-panel')
                              ?.scrollIntoView({ block: 'start' })
                          }
                        >
                          Доступные задания
                        </button>
                      </div>
                    )}
                    <h3>Местный склад</h3>
                    <table>
                      <thead>
                        <tr>
                          <th>Товар</th>
                          <th>Запас</th>
                          <th>Цена</th>
                        </tr>
                      </thead>
                      <tbody>
                        {GOODS.map((g) => (
                          <tr key={g}>
                            <td>{goods[g]}</td>
                            <td>{fmt(s.stocks[g])}</td>
                            <td>{s.prices[g].toFixed(1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="muted">
                      Голод: {s.shortageDays} дн. · Угроза: {s.monsters} волков
                    </p>
                  </>
                ) : (
                  <p className="muted">Посетите поселение, чтобы узнать состояние складов.</p>
                )}
                {s.id === hero!.settlement && p!.scene === 'settlement' && (
                  <>
                    <h3 id="market-panel">Торговля</h3>
                    <Trade send={send} />
                    <h3 id="recruit-panel">Отряд и поселение</h3>
                    <div className="actions">
                      <button onClick={() => void send({ type: 'recruit', count: 5 })}>
                        Нанять 5 бойцов · 50◈
                      </button>
                      <button onClick={() => void send({ type: 'dismiss' })}>
                        Распустить отряд
                      </button>
                      <button disabled={!s.monsters} onClick={() => void send({ type: 'battle' })}>
                        Выступить против волков
                      </button>
                      <button onClick={() => void send({ type: 'build' })}>
                        Строить · 20 дерева / камня, 50◈
                      </button>
                      <button onClick={() => void send({ type: 'petition' })}>
                        Просить признания
                      </button>
                    </div>
                    <h3 id="quests-panel">Контракты</h3>
                    {world.quests
                      .filter(
                        (q) => q.settlement === s.id && ['open', 'accepted'].includes(q.status),
                      )
                      .map((q) => (
                        <div className="quest" key={q.id}>
                          <b>
                            {q.type === 'deliver'
                              ? `Доставить ${q.need} зерна`
                              : 'Устранить угрозу волков'}
                          </b>
                          <p>{q.reason}</p>
                          <span>Награда: {q.reward}◈</span>
                          <button
                            onClick={() =>
                              void send({
                                type: q.status === 'open' ? 'accept_quest' : 'complete_quest',
                                quest: q.id,
                              })
                            }
                          >
                            {q.status === 'open' ? 'Принять' : 'Сдать'}
                          </button>
                        </div>
                      ))}
                    <h3>Жители</h3>
                    {world.locals.slice(0, 10).map((person) => (
                      <details key={person.id}>
                        <summary>
                          {person.npc?.name ?? `Житель ${person.id}`} · {person.profession}
                        </summary>
                        <p>
                          Возраст: {Math.floor((world.day - person.born) / 360)}. Дети:{' '}
                          {person.children.length}. {person.npc?.traits.join(', ')}
                        </p>
                        <button onClick={() => void send({ type: 'marry', person: person.id })}>
                          Предложить брак
                        </button>
                      </details>
                    ))}
                  </>
                )}
              </>
            )}
            {tab === 'hero' && (
              <>
                <span className="eyebrow">ДИНАСТИЯ</span>
                <h2>{p!.name}</h2>
                <img className="hero-portrait" src={artwork('hero')} alt="Герой" />
                <p>
                  {p!.title} · Легитимность {fmt(p!.legitimacy)}
                </p>
                <h3>Характеристики</h3>
                {Object.entries(p!.attributes).map(([k, v]) => (
                  <div className="stat" key={k}>
                    <span>{k}</span>
                    <b>{fmt(v)}</b>
                  </div>
                ))}
                <h3>Навыки</h3>
                {Object.entries(p!.skills).map(([k, v]) => (
                  <div className="stat" key={k}>
                    <span>{k}</span>
                    <b>{v.toFixed(1)}</b>
                  </div>
                ))}
                <h3>Инвентарь</h3>
                {GOODS.map((g) => (
                  <div className="stat" key={g}>
                    <span>{goods[g]}</span>
                    <b>{fmt(p!.inventory[g])}</b>
                  </div>
                ))}
                <h3>Семья</h3>
                <p>
                  Супруг: {hero!.spouse ?? 'нет'} · Наследников: {p!.heirs.length}
                </p>
                <h3>Местная репутация</h3>
                {Object.entries(p!.reputation).map(([k, v]) => (
                  <div className="stat" key={k}>
                    <span>{k}</span>
                    <b>{fmt(v)}</b>
                  </div>
                ))}
              </>
            )}
            {tab === 'states' && (
              <>
                <h2>Державы</h2>
                {world.states.map((state) => (
                  <details key={state.id}>
                    <summary style={{ color: state.color }}>{state.name}</summary>
                    <p>{state.government}</p>
                    <p>
                      Правитель:{' '}
                      {world.rulers.find((r) => r?.person === state.ruler)?.name ?? state.ruler}
                    </p>
                    <p>
                      Легитимность {fmt(state.legitimacy)} · Налог {fmt(state.tax * 100)}%
                    </p>
                    <p>Казна {fmt(state.treasury)}◈</p>
                    <p>{state.doctrines.join(', ')}</p>
                  </details>
                ))}
                <h3>Войны и перемирия</h3>
                {world.wars.map((w) => (
                  <p key={w.id}>
                    {w.active ? '⚔' : '⚑'} {w.reason}
                  </p>
                ))}
                <h3>Субъективные хроники</h3>
                {world.chronicles.map((c) => (
                  <details key={c.id}>
                    <summary>{c.title}</summary>
                    <p>{c.text}</p>
                    <small>Хроника, не объективный факт</small>
                  </details>
                ))}
              </>
            )}
            {tab === 'saves' && (
              <>
                <h2>Сохранения</h2>
                {[0, 1, 2, 3, 4, 5].map((slot) => {
                  const saved = slots.find((s) => s.slot === slot);
                  return (
                    <div className="slot" key={slot}>
                      <b>{slot === 0 ? 'Автосохранение' : `Слот ${slot}`}</b>
                      <p>{saved ? `День ${saved.day} · ${saved.seed}` : 'Пусто'}</p>
                      {slot > 0 && (
                        <button
                          onClick={() =>
                            void action(async () => {
                              await api(`/saves/${slot}`, {});
                              setSlots(await api('/saves'));
                              setNotice(`Слот ${slot} сохранён`);
                            })
                          }
                        >
                          Сохранить
                        </button>
                      )}
                      <button
                        disabled={!saved}
                        onClick={() =>
                          void action(async () => {
                            const next = await api<View>(`/saves/${slot}/load`, {});
                            setWorld(next);
                            setSelected(next.hero?.settlement ?? 0);
                            setNotice('Мир загружен и поставлен на паузу');
                          })
                        }
                      >
                        Загрузить
                      </button>
                    </div>
                  );
                })}
                <button onClick={() => setNewGame(true)}>Новая игра…</button>
                <p className="muted">
                  Новая игра заменяет автосохранение. Ручные слоты сохраняются.
                </p>
              </>
            )}
            {tab === 'admin' && (
              <>
                <h2>Диагностика</h2>
                <button onClick={() => void action(async () => setAdmin(await api('/admin')))}>
                  Обновить
                </button>
                {admin && (
                  <>
                    <p>
                      Tick: {Number(admin.tickMs).toFixed(1)} мс · Жителей: {admin.population}
                    </p>
                    <p>OpenRouter: {admin.keyConfigured ? 'ключ настроен' : 'ключ не задан'}</p>
                    {admin.lastError && <p className="error">{admin.lastError}</p>}
                    <DirectorForm
                      value={admin.director}
                      onSave={(v) =>
                        void action(async () => {
                          await api('/admin/director', v);
                          setAdmin(await api('/admin'));
                          setNotice('Настройки Director сохранены в мире');
                        })
                      }
                    />
                    <h3>Журнал AI</h3>
                    {admin.logs.map((log: any, i: number) => (
                      <details key={i}>
                        <summary>
                          {log.accepted ? '✓' : '×'} День {log.day} · {log.reason}
                        </summary>
                        <pre>
                          {JSON.stringify(
                            { request: log.request, response: log.response },
                            null,
                            2,
                          )}
                        </pre>
                      </details>
                    ))}
                    <h3>События</h3>
                    {admin.events
                      .slice(-20)
                      .reverse()
                      .map((e: any) => (
                        <p key={e.id}>
                          {e.historical ? '★' : '·'} {e.text}
                        </p>
                      ))}
                  </>
                )}
              </>
            )}
          </div>
        </aside>
      </main>
      <nav className="bottom-nav" aria-label="Разделы игры">
        {[
          ['place', 'Мир'],
          ['hero', 'Герой и отряд'],
          ['states', 'Державы'],
          ['history', 'Летопись'],
          ['saves', 'Сохранения'],
          ['admin', 'Диагностика'],
        ].map(([id, label]) => (
          <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
        <button
          onClick={() => {
            setMenu(true);
            if (world.speed !== 0) void send({ type: 'speed', value: 0 });
          }}
        >
          Меню
        </button>
      </nav>
    </div>
  );
}
function Trade({ send }: { send: (c: Command) => Promise<void> }) {
  const [good, setGood] = useState<(typeof GOODS)[number]>('grain'),
    [quantity, setQuantity] = useState(10);
  return (
    <div className="trade">
      <select
        aria-label="Товар"
        value={good}
        onChange={(e) => setGood(e.target.value as typeof good)}
      >
        {GOODS.map((g) => (
          <option key={g} value={g}>
            {goods[g]}
          </option>
        ))}
      </select>
      <input
        aria-label="Количество"
        type="number"
        min="1"
        max="500"
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value))}
      />
      <button onClick={() => void send({ type: 'trade', side: 'buy', good, quantity })}>
        Купить
      </button>
      <button onClick={() => void send({ type: 'trade', side: 'sell', good, quantity })}>
        Продать
      </button>
    </div>
  );
}
function Biography({
  busy,
  onStart,
}: {
  busy: boolean;
  onStart: (seed: string, biography: any) => Promise<void>;
}) {
  const [seed, setSeed] = useState('ashen-crown'),
    [b, setB] = useState({
      name: 'Рем',
      race: 'Human' as Race,
      sex: 'male',
      birthplace: 0,
      origin: 'peasants',
      childhood: 'fields',
      youth: 'militia',
      training: 'warrior',
      turningPoint: 'rescue',
      reason: 'fortune',
    });
  const select = (key: keyof typeof b, label: string, options: string[][]) => (
    <label key={key}>
      {label}
      <select
        value={String(b[key])}
        onChange={(e) =>
          setB({ ...b, [key]: key === 'birthplace' ? Number(e.target.value) : e.target.value })
        }
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <form
      className="biography-form"
      onSubmit={(e) => {
        e.preventDefault();
        void onStart(seed, b);
      }}
    >
      <div className="biography-fields">
        <div className="bio-grid">
          <label>
            Имя
            <input
              required
              maxLength={40}
              value={b.name}
              onChange={(e) => setB({ ...b, name: e.target.value })}
            />
          </label>
          <label>
            Seed мира
            <input
              required
              maxLength={100}
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
            />
          </label>
          {select(
            'race',
            'Происхождение',
            RACES.map((r, i) => [r, raceNames[i]]),
          )}
          {select('sex', 'Пол', [
            ['male', 'Мужской'],
            ['female', 'Женский'],
          ])}
          {select(
            'birthplace',
            'Место рождения',
            Array.from({ length: 10 }, (_, i) => [
              String(i * 30),
              `Град ${i * 5 + 1}-1 · Держава ${i + 1}`,
            ]),
          )}
          {select('origin', 'Семья', [
            ['peasants', 'Крестьяне'],
            ['merchants', 'Купцы'],
            ['nobles', 'Мелкая знать'],
          ])}
          {select('childhood', 'Детство', [
            ['fields', 'Работа в полях'],
            ['books', 'Книги и наставник'],
            ['streets', 'Улицы города'],
          ])}
          {select('youth', 'Юность', [
            ['militia', 'Ополчение'],
            ['caravan', 'Торговый караван'],
            ['temple', 'Храм'],
          ])}
          {select('training', 'Обучение', [
            ['warrior', 'Воин'],
            ['trader', 'Торговец'],
            ['healer', 'Лекарь'],
          ])}
          {select('turningPoint', 'Важное событие', [
            ['rescue', 'Спасение соседей'],
            ['inheritance', 'Наследство'],
            ['loss', 'Потеря дома'],
          ])}
          {select('reason', 'Причина странствий', [
            ['fortune', 'Поиск удачи'],
            ['knowledge', 'Познание мира'],
            ['duty', 'Долг перед семьёй'],
          ])}
        </div>
        <button className="primary full" disabled={busy}>
          {busy ? 'Создаётся мир…' : 'Войти в мир →'}
        </button>
      </div>
      <div className="biography-portrait">
        <span className="eyebrow">
          {raceNames[RACES.indexOf(b.race)]} ·{' '}
          {{ warrior: 'Воин', trader: 'Торговец', healer: 'Лекарь' }[b.training]}
        </span>
        <img src={artwork('hero')} alt="Образ героя" />
        <h2>{b.name || 'Ваш герой'}</h2>
        <p>Первая глава вашей истории</p>
        <small>
          Общий образ персонажа.
          <br />
          Внешность пока не зависит от расы и пола.
        </small>
      </div>
    </form>
  );
}
function DirectorForm({ value, onSave }: { value: World['director']; onSave: (v: any) => void }) {
  const [v, setV] = useState({
    enabled: value.enabled,
    model: value.model,
    cooldownDays: value.cooldownDays,
    budget: value.budget,
  });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(v);
      }}
    >
      <label className="check">
        <input
          type="checkbox"
          checked={v.enabled}
          onChange={(e) => setV({ ...v, enabled: e.target.checked })}
        />{' '}
        Включить AI Director
      </label>
      <label>
        Модель
        <input value={v.model} onChange={(e) => setV({ ...v, model: e.target.value })} />
      </label>
      <label>
        Пауза между запросами, дней
        <input
          type="number"
          min="10"
          max="3600"
          value={v.cooldownDays}
          onChange={(e) => setV({ ...v, cooldownDays: Number(e.target.value) })}
        />
      </label>
      <label>
        Общий лимит запросов на мир
        <input
          type="number"
          min="0"
          max="100"
          value={v.budget}
          onChange={(e) => setV({ ...v, budget: Number(e.target.value) })}
        />
      </label>
      <p>Использовано: {value.calls}</p>
      <button>Сохранить настройки</button>
    </form>
  );
}
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
