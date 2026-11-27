import React, { useEffect, useState, useRef, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import {
  monsterNames,
  date,
  adult,
  season,
  RACES,
  PORTRAIT_VARIANTS,
  startingCapitalNames,
  GOODS,
  type Command,
  type World,
  type Race,
  type PortraitAppearance,
  type PortraitVariant,
} from '@living-world/simulation';
import { api, ApiError } from './api';
import type { View } from './types';
import './style.css';
import { Dialogue, ArmyPanel, QuestJournal, TravelPanel, Guide, troopNames } from './play';
import { Archive } from './archive';
import { Adventure, SpellPanel } from './adventure';
import { GovernancePanel } from './governance';
import { Atlas } from './atlas';
import { SettlementPlan } from './settlement-plan';
import { FaithCodex, FoundingChronicle, StateCodex } from './codex';
import { LoadingScreen } from './splash';
import { Portrait, outfitNames, portraitForPerson } from './portrait';
import './presentation.css';
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
  const sending = useRef(false);
  const sidebar = useRef<HTMLElement>(null);
  const [pending, setPending] = useState(false),
    [dialogue, setDialogue] = useState<number | null>(null);
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
    [busy, setBusy] = useState<'create' | 'load' | null>(null),
    [realm, setRealm] = useState<number | null>(null),
    [faith, setFaith] = useState<number | null>(null),
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
  async function send(c: Command): Promise<boolean> {
    if (sending.current) return false;
    sending.current = true;
    setPending(true);
    let ok = false;
    await action(async () => {
      setWorld(await api('/command', c));
      ok = true;
    });
    sending.current = false;
    setPending(false);
    return ok;
  }
  const locate = (id: number) => {
    if (world?.mapKnowledge && !world.mapKnowledge.known.includes(id)) {
      setNotice(
        'Это место ещё вне вашей карты. Исследуйте ближайшие дороги или купите свиток в столице.',
      );
      return;
    }
    setSelected(id);
    setTab('place');
    if (world?.player?.scene === 'settlement') void send({ type: 'leave' });
  };
  const revealSidebar = () => {
    const panel = sidebar.current;
    if (!panel) return;
    panel.scrollTop = 0;
    if (window.matchMedia('(max-width: 760px)').matches) panel.scrollIntoView({ block: 'start' });
  };
  const openRealm = (id: number) => {
    setRealm(id);
    setTab('states');
    revealSidebar();
  };
  const openFaith = (id: number) => {
    setFaith(id);
    setTab('faiths');
    revealSidebar();
  };
  const selectTown = (id: number) => {
    if (world?.mapKnowledge && !world.mapKnowledge.known.includes(id)) return;
    setSelected(id);
    setTab('place');
  };
  const loadWorld = async (slot: number) => {
    setBusy('load');
    await action(async () => {
      const next = await api<View>(`/saves/${slot}/load`, {});
      setWorld(next);
      setSelected(next.hero?.settlement ?? 0);
      setRealm(null);
      setFaith(null);
      setTab('place');
      setMenu(false);
      setMenuSaves(false);
      setNotice('Мир загружен и поставлен на паузу');
    });
    setBusy(null);
  };
  const talk = (id: number) => {
    if (world?.speed) void send({ type: 'speed', value: 0 });
    setDialogue(id);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (busy || !loaded || locked) return;
      if ((e.target as HTMLElement).matches('input,select,textarea')) return;
      if (document.querySelector('dialog[open]')) return;
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
  }, [world, menu, newGame, busy, loaded, locked]);
  useEffect(() => {
    if (tab === 'saves' || menuSaves) void action(async () => setSlots(await api('/saves')));
    if (tab === 'admin') void action(async () => setAdmin(await api('/admin')));
  }, [tab, menuSaves]);
  useEffect(() => {
    if (sidebar.current) sidebar.current.scrollTop = 0;
  }, [tab]);
  const p = world?.player,
    hero = world?.hero,
    local = world && hero ? world.settlements[hero.settlement] : null,
    s = world?.player?.scene === 'settlement' ? local : (world?.settlements[selected] ?? local),
    army = world?.armies.find((a) => a.id === p?.army);
  if (locked)
    return (
      <div className="entry title-screen">
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
  if (!loaded)
    return (
      <LoadingScreen
        title="У ворот мира"
        caption="Подключаемся к летописи континента."
        error={error}
        onRetry={() => setAuthVersion((v) => v + 1)}
      />
    );
  if (busy === 'load')
    return (
      <LoadingScreen
        title="Открывается летопись"
        caption="Восстанавливаем героев, земли и события из сохранения."
      />
    );
  if (menu && !newGame)
    return (
      <div className="entry title-screen">
        <div className="title-copy">
          <span className="title-ornament" aria-hidden="true">
            ✧
          </span>
          <span className="eyebrow">РОЛЕВАЯ ИГРА · ЖИВОЙ МИР</span>
          <h1>
            Пепельная
            <br />
            <em>корона</em>
          </h1>
          <p>
            Государства поднимаются и рушатся. Города помнят тех, кто их спас. Какой след оставит
            ваша династия?
          </p>
          <div className="title-actions">
            <button
              className="primary ornate-action"
              onClick={() => {
                if (
                  !world?.player ||
                  window.confirm(
                    'Начать новый мир? Текущее автосохранение будет заменено. Ручные слоты сохранятся.',
                  )
                )
                  setNewGame(true);
              }}
            >
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
                <button key={slot.slot} onClick={() => void loadWorld(slot.slot)}>
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
          <small>ОДИНОЧНАЯ КАМПАНИЯ · ALPHA</small>
        </div>
      </div>
    );
  if (!world?.player || newGame)
    return (
      <div className="entry creation-screen">
        <div className="creation-content" inert={busy === 'create'}>
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
          <h1>Кем вас запомнит мир?</h1>
          <p className="creation-lede">
            Происхождение и ремесло определят, с чем вы начнёте историю.
          </p>
          <Biography
            onStart={async (seed, biography) => {
              setBusy('create');
              await action(async () => {
                const w = await api<View>('/new', { seed, biography });
                setWorld(w);
                setSelected(w.hero!.settlement);
                setTab('place');
                setRealm(null);
                setFaith(null);
                setNewGame(false);
                setMenu(false);
              });
              setBusy(null);
            }}
          />
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </div>
        {busy === 'create' && (
          <div className="creation-loading-overlay">
            <LoadingScreen
              title="Рождается мир"
              caption="Готовим континент, его жителей и предысторию. Это может занять несколько секунд."
            />
          </div>
        )}
      </div>
    );
  return (
    <div className="app">
      <header>
        <div className="brand">
          <span className="brand-seal" aria-hidden="true">
            ✧
          </span>
          <div>
            ПЕПЕЛЬНАЯ КОРОНА<small>ЛЕТОПИСЬ КОНТИНЕНТА</small>
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
          Здоровье{' '}
          <meter
            min="0"
            max="100"
            value={
              world.battle?.status === 'active'
                ? (world.battle.fighters.find((f) => f.person === p!.person)?.hp ?? hero!.health)
                : hero!.health
            }
          />{' '}
          {fmt(
            world.battle?.status === 'active'
              ? (world.battle.fighters.find((f) => f.person === p!.person)?.hp ?? hero!.health)
              : hero!.health,
          )}
        </span>
        <span>◈ {fmt(p!.gold)} монет</span>
        <span>⚑ {army?.members.length ?? 0} бойцов</span>
        <span>
          Зерно: {fmt(p!.inventory.grain)} · Отряд: {Math.floor(army?.food ?? 0)} пайков
        </span>
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
      {world.saveError && (
        <div role="alert" className="error">
          {world.saveError}
        </div>
      )}
      {pending && (
        <div className="command-pending" role="status">
          Выполняется действие…
        </div>
      )}
      <main>
        <section
          className={`map-panel ${p!.scene === 'world' ? 'has-atlas' : p!.scene === 'settlement' && world.townPlan ? 'has-settlement-plan' : ''}`}
        >
          <div className="map-heading">
            <div>
              <span className="eyebrow">
                {p!.scene === 'world'
                  ? 'КОНТИНЕНТ'
                  : p!.scene === 'battle'
                    ? 'ПОЛЕ БОЯ'
                    : 'ПОСЕЛЕНИЕ'}
              </span>
              <h2>
                {p!.scene === 'world'
                  ? (world.worldLore?.continent ?? 'Земли десяти корон')
                  : local?.name}
              </h2>
            </div>
            <div className="map-heading-tools">
              <span>
                {p!.journey
                  ? 'В пути · ' + p!.journey.remaining + ' дн. до следующей точки'
                  : p!.scene === 'world'
                    ? 'Выберите поселение на карте'
                    : 'Вы на месте'}
              </span>
              {p!.scene === 'world' && world.worldLore && (
                <button
                  className="codex-link"
                  onClick={() => {
                    setTab('history');
                    revealSidebar();
                  }}
                >
                  Предыстория →
                </button>
              )}
            </div>
          </div>
          {p!.scene === 'world' ? (
            <Atlas
              world={world}
              selected={selected}
              onSelect={selectTown}
              onRealm={openRealm}
              send={send}
            />
          ) : p!.scene === 'settlement' && world.townPlan ? (
            <SettlementPlan
              key={world.seed + ':' + world.townPlan.settlement}
              plan={world.townPlan}
              onTalk={talk}
            />
          ) : (
            <Suspense
              fallback={
                <div className="scene-loading" role="status">
                  Различаем силуэты в тумане…
                </div>
              }
            >
              <Game
                world={world}
                selected={selected}
                onSelect={selectTown}
                send={(c) => void send(c)}
                unit={unit}
                onTalk={talk}
              />
            </Suspense>
          )}
          <div className="map-footer">
            <span>
              {p!.scene === 'world'
                ? '◆ Столица · ♟ Герой · ⚑ Армия · Штриховка: оккупация'
                : 'Пробел: пауза'}
            </span>
            <span>Пробел — пауза · E — войти</span>
          </div>
        </section>
        <aside ref={sidebar}>
          <div className="side-content">
            {!hero!.alive && (
              <section className="card">
                <h2>История героя окончена</h2>
                <p>
                  {p!.gameOver ? 'Нет допустимого наследника.' : 'Выберите взрослого наследника.'}
                </p>
                {world.heirs
                  .filter((h) => h.alive && adult(world as unknown as World, h))
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
                    ? world.battle.enemyArmy
                      ? 'Штурм укреплений'
                      : 'Бой: ' + monsterNames[local!.monsterKind]
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
                        <span>
                          {side === 'player'
                            ? 'Ваш отряд и герой'
                            : world.battle?.enemyArmy
                              ? 'Гарнизон'
                              : monsterNames[local!.monsterKind]}
                        </span>
                        <b>
                          {alive} / {all.length}
                        </b>
                      </div>
                      <meter min="0" max={Math.max(1, all.length)} value={alive} />
                    </div>
                  );
                })}
                <SpellPanel world={world} send={send} />
                <h3>Приказ отряду</h3>
                <select
                  aria-label="Отряд для приказа"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value as typeof unit)}
                >
                  <option value="all">Все бойцы</option>
                  <option value="infantry">Герой / пехота</option>
                  <option value="spearmen">Копейщики</option>
                  <option value="archers">Лучники</option>
                  <option value="cavalry">Конница</option>
                </select>
                <p className="muted">
                  Нажмите на поле, чтобы задать позицию выбранным бойцам. В пределах досягаемости
                  они атакуют сами.
                </p>
                <button
                  className="primary full"
                  disabled={world.battle.status !== 'active'}
                  onClick={() =>
                    void send({ type: 'battle_tactic', tactic: 'attack', unitClass: unit })
                  }
                >
                  Атаковать
                </button>
                <button
                  className="full"
                  disabled={world.battle.status !== 'active'}
                  onClick={() =>
                    void send({ type: 'battle_tactic', tactic: 'hold', unitClass: unit })
                  }
                >
                  Держать позицию
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
            {tab === 'army' && <ArmyPanel world={world} send={send} />}
            {tab === 'quests' && <QuestJournal world={world} send={send} onLocate={locate} />}
            {tab === 'guide' && <Guide world={world} />}
            {tab === 'adventure' && <Adventure world={world} send={send} />}
            {tab === 'market' && (
              <>
                <h2>Рынок</h2>
                {p!.scene === 'settlement' && local ? (
                  <Trade send={send} world={world} />
                ) : (
                  <p>Войдите в поселение для торговли.</p>
                )}
              </>
            )}
            {tab === 'history' && (
              <>
                <FoundingChronicle world={world} />
                <Archive />
              </>
            )}
            {tab === 'place' && s && p!.scene !== 'battle' && (
              <>
                <TravelPanel world={world} selected={selected} onSelect={locate} />
                {world.mapKnowledge?.chartForSale && (
                  <div className="atlas-chart-offer">
                    <small>Картограф нанесёт земли и дороги на ваш свиток.</small>
                    <button
                      disabled={pending || p!.gold < world.mapKnowledge.chartPrice}
                      onClick={() => void send({ type: 'buy_world_chart' })}
                    >
                      Купить карту континента · {world.mapKnowledge.chartPrice}◈
                    </button>
                  </div>
                )}
                <div
                  className={`settlement-card settlement-art-${s.kind === 'ruins' ? 2 : s.kind === 'city' ? 0 : 1}`}
                >
                  <span className="eyebrow">
                    {world.states.find((state) => state.id === s.state)?.name ?? 'КОНТИНЕНТ'}
                  </span>
                  <h2>{s.name}</h2>
                </div>
                <p className="muted">
                  {{ city: 'Город', town: 'Городок', village: 'Деревня', ruins: 'Руины' }[s.kind] ??
                    s.kind}{' '}
                  ·{' '}
                  {{ forest: 'Лес', mountain: 'Горы', plains: 'Равнина', marsh: 'Болота' }[s.biome]}{' '}
                  · {s.central ? 'Центр области' : 'Поселение'}
                </p>
                {s.kind === 'ruins' ? (
                  <p className="atlas-place-warning">Поселение лежит в руинах.</p>
                ) : (
                  (s.structuralDamage ?? 0) > 0 && (
                    <p className="atlas-place-warning">
                      Постройки повреждены войной: {s.structuralDamage}/3.
                    </p>
                  )
                )}
                {s.foundedDay !== undefined && (
                  <p className="muted">Основано на {s.foundedDay}-й день.</p>
                )}
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
                    <Trade send={send} world={world} />
                    <h3>Постой и работа</h3>
                    <p className="muted">
                      Отдых: {5 + (army?.members.length ?? 0)} монет за день. Герою и каждому бойцу
                      нужен 1 паёк в день.
                    </p>
                    <div className="actions">
                      <button onClick={() => void send({ type: 'rest', days: 1 })}>
                        Отдохнуть день
                      </button>
                      <button onClick={() => void send({ type: 'rest', days: 3 })}>
                        Отдохнуть три дня
                      </button>
                      <button onClick={() => void send({ type: 'work', job: 'farm' })}>
                        Работать в поле · +10 монет / день
                      </button>
                      <button onClick={() => void send({ type: 'work', job: 'smith' })}>
                        Работать в кузнице · +16 монет / день
                      </button>
                      <button onClick={() => setTab('army')}>Управление отрядом</button>
                    </div>
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
                          {q.objectiveMet && <p>Цель выполнена — получите награду.</p>}
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
                        {person.appearance && (
                          <div className="person-preview">
                            <Portrait
                              value={person.appearance}
                              label={`Портрет: ${person.npc?.name ?? 'житель'}`}
                            />
                          </div>
                        )}
                        <button onClick={() => talk(person.id)}>Поговорить</button>
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
                <Portrait
                  value={portraitForPerson(hero!, hero!.appearance)}
                  className="hero-codex-portrait"
                  label={`Портрет: ${p!.name}`}
                />
                {world.wardrobe && (
                  <fieldset
                    className="wardrobe-controls"
                    disabled={pending || p!.scene === 'battle' || !!p!.journey || !hero!.alive}
                  >
                    <legend>Гардероб</legend>
                    <label>
                      Надетая одежда
                      <select
                        value={world.wardrobe.equipped}
                        onChange={(e) =>
                          void send({
                            type: 'equip_outfit',
                            outfit: e.target.value as PortraitAppearance['outfit'],
                          })
                        }
                      >
                        {world.wardrobe.outfitIds.map((outfit) => (
                          <option key={outfit} value={outfit}>
                            {outfitNames[outfit]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <small className="wardrobe-note">
                      Выбор меняет экипировку, но не иллюстрацию портрета.
                    </small>
                  </fieldset>
                )}
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
                <StateCodex
                  world={world}
                  selected={realm}
                  onSelect={setRealm}
                  onFaith={openFaith}
                  onLocate={locate}
                />
                <GovernancePanel world={world} send={send} />
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
            {tab === 'faiths' && (
              <FaithCodex world={world} selected={faith} onSelect={setFaith} onRealm={openRealm} />
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
                        onClick={() => {
                          if (
                            window.confirm(
                              'Загрузить сохранение? Несохранённые изменения текущего мира будут потеряны.',
                            )
                          )
                            void loadWorld(slot);
                        }}
                      >
                        Загрузить
                      </button>
                    </div>
                  );
                })}
                <button
                  onClick={() => {
                    if (
                      !world?.player ||
                      window.confirm(
                        'Начать новый мир? Текущее автосохранение будет заменено. Ручные слоты сохранятся.',
                      )
                    )
                      setNewGame(true);
                  }}
                >
                  Новая игра…
                </button>
                <p className="muted">
                  Новая игра заменяет автосохранение. Ручные слоты сохраняются.
                </p>
              </>
            )}
            {tab === 'admin' && (
              <details>
                <summary>Жители мира (постранично)</summary>
                <Archive people />
              </details>
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
          ['hero', 'Герой'],
          ['army', 'Отряд'],
          ['quests', 'Задания'],
          ['adventure', 'Жизнь и власть'],
          ['guide', 'Помощь'],
          ['states', 'Державы'],
          ['faiths', 'Верования'],
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
      {dialogue !== null && p!.scene === 'settlement' && (
        <Dialogue
          person={dialogue}
          send={send}
          onClose={() => setDialogue(null)}
          onPanel={setTab}
        />
      )}
    </div>
  );
}
function Trade({ send, world }: { send: (c: Command) => Promise<boolean>; world: View }) {
  const [good, setGood] = useState<(typeof GOODS)[number]>('grain'),
    [quantity, setQuantity] = useState(10);
  const price = world.settlements[world.hero!.settlement].prices[good];
  const own = world.player!.inventory[good];
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
        Купить · {(price * quantity).toFixed(1)}◈
      </button>
      <button onClick={() => void send({ type: 'trade', side: 'sell', good, quantity })}>
        Продать · {(price * quantity * 0.8).toFixed(1)}◈
      </button>
      <p className="trade-summary">
        У вас: {Math.floor(own)}. Монет: {world.player!.gold.toFixed(1)}. Цена продажи составляет
        80% цены покупки.
      </p>
    </div>
  );
}
function randomWorldCode() {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(8));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
function Biography({ onStart }: { onStart: (seed: string, biography: any) => Promise<void> }) {
  const [seed, setSeed] = useState(randomWorldCode),
    [variant, setVariant] = useState<PortraitVariant>(1),
    [b, setB] = useState({
      name: 'Рем',
      race: 'Human' as Race,
      sex: 'male' as PortraitAppearance['sex'],
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
  const archetypes = [
    { id: 'warrior', name: 'Воин', description: 'Воинская выучка и жизнь в отряде.' },
    { id: 'trader', name: 'Торговец', description: 'Рынки, ремесло сделки и дороги караванов.' },
    { id: 'healer', name: 'Лекарь', description: 'Знания о ранах, болезнях и жизни людей.' },
  ] as const;
  const raceIndex = Math.max(0, RACES.indexOf(b.race));
  const archetype = archetypes.find((entry) => entry.id === b.training) ?? archetypes[0];
  return (
    <form
      className="biography-form"
      onSubmit={(e) => {
        e.preventDefault();
        void onStart(seed.trim() || randomWorldCode(), { ...b, appearance: { variant } });
      }}
    >
      <div className="biography-fields">
        <p className="eyebrow">I. ВЫБЕРИТЕ ПРОИСХОЖДЕНИЕ</p>
        <fieldset className="race-choices">
          <legend className="sr-only">Раса героя</legend>
          {RACES.map((race, i) => (
            <label key={race} title={raceNames[i]} className={b.race === race ? 'active' : ''}>
              <input
                type="radio"
                name="race"
                value={race}
                checked={b.race === race}
                onChange={() => setB({ ...b, race })}
              />
              <Portrait
                className="race-thumb"
                decorative
                value={{ race, sex: b.sex, variant: 1 }}
              />
              <strong>{raceNames[i]}</strong>
            </label>
          ))}
        </fieldset>
        <fieldset className="training-choices body-choices">
          <legend>Пол</legend>
          {(
            [
              ['male', 'Мужской'],
              ['female', 'Женский'],
            ] as const
          ).map(([sex, name]) => (
            <label key={sex} className={b.sex === sex ? 'active' : ''}>
              <input
                type="radio"
                name="sex"
                value={sex}
                checked={b.sex === sex}
                onChange={() => setB({ ...b, sex })}
              />
              <span>{name}</span>
            </label>
          ))}
        </fieldset>
        <fieldset className="preset-choices">
          <legend>Готовые портреты</legend>
          {PORTRAIT_VARIANTS.map((id) => (
            <label key={id} className={variant === id ? 'active' : ''}>
              <input
                type="radio"
                name="portrait-variant"
                value={id}
                checked={variant === id}
                onChange={() => setVariant(id)}
              />
              <Portrait
                className="preset-thumb"
                decorative
                value={{ race: b.race, sex: b.sex, variant: id }}
              />
              <strong>Внешность {id}</strong>
            </label>
          ))}
        </fieldset>
        <fieldset className="training-choices">
          <legend>Обучение</legend>
          {archetypes.map((item) => (
            <label key={item.id} className={b.training === item.id ? 'active' : ''}>
              <input
                type="radio"
                name="training"
                value={item.id}
                checked={b.training === item.id}
                onChange={() => setB({ ...b, training: item.id })}
              />
              <span>{item.name}</span>
            </label>
          ))}
        </fieldset>
        <p className="eyebrow">II. НАПИШИТЕ ПРОШЛОЕ</p>
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
          {select(
            'birthplace',
            'Место рождения',
            startingCapitalNames(seed.trim() || 'ashen-crown').map((name, i) => [
              String(i * 30),
              name,
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
        <details className="seed-settings">
          <summary>Код мира</summary>
          <p>
            Для новой игры код выбирается случайно. Введите прежний код, чтобы повторить географию.
          </p>
          <label>
            Код географии и симуляции
            <input
              required
              maxLength={100}
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
            />
          </label>
          <button type="button" onClick={() => setSeed(randomWorldCode())}>
            Другой код
          </button>
        </details>
        <button className="primary full ornate-action">Начать историю →</button>
      </div>
      <div className="biography-portrait">
        <Portrait
          value={{ race: b.race, sex: b.sex, variant }}
          className="forge-portrait"
          label={`Облик расы: ${raceNames[raceIndex]}`}
          eager
        />
        <div className="forge-caption">
          <p className="eyebrow">
            {raceNames[raceIndex]} · {archetype.name}
          </p>
          <h2>{b.name.trim() || 'Безымянный'}</h2>
          <p>Внешность {variant}</p>
          <small>{archetype.description}</small>
        </div>
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
