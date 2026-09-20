import { useEffect, useRef, useState } from 'react';
import { route, type Command, type Conversation } from '@living-world/simulation';
import type { View } from './types';
import { ART } from './art';
import { api } from './api';
export const troopNames = {
  infantry: 'Пехота',
  spearmen: 'Копейщики',
  archers: 'Лучники',
  cavalry: 'Конница',
  mages: 'Маги',
};
type Send = (command: Command) => Promise<boolean>;
const art = (key: string) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(ART[key]);
export function Dialogue({
  person,
  send,
  onClose,
  onPanel,
}: {
  person: number;
  send: Send;
  onClose: () => void;
  onPanel: (panel: string) => void;
}) {
  const modal = useRef<HTMLDialogElement>(null);
  const [data, setData] = useState<Conversation | null>(null),
    [error, setError] = useState(''),
    [pending, setPending] = useState(false),
    [refresh, setRefresh] = useState(0);
  useEffect(() => {
    modal.current?.showModal();
  }, []);
  useEffect(() => {
    let current = true;
    setError('');
    api<Conversation>('/dialogue', { person })
      .then((d) => {
        if (current) setData(d);
      })
      .catch((e) => {
        if (current) setError(e.message);
      });
    return () => {
      current = false;
    };
  }, [person, refresh]);
  return (
    <dialog
      ref={modal}
      className="dialogue-window"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      aria-labelledby="dialogue-name"
    >
      <div className="dialogue-heading">
        <span className="eyebrow">РАЗГОВОР</span>
        <button onClick={onClose} aria-label="Завершить разговор">
          ×
        </button>
      </div>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {!data ? (
        <p>Собеседник отвечает…</p>
      ) : (
        <div className="dialogue-body">
          <div className="dialogue-portrait">
            <span className="eyebrow">{data.role}</span>
            <img src={art(data.portrait)} alt="" />
            <h2 id="dialogue-name">{data.name}</h2>
          </div>
          <div>
            <h2>{data.name}</h2>
            {data.lines.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
            <div className="dialogue-choices">
              {data.choices.map((choice, i) => (
                <button
                  key={i}
                  disabled={pending}
                  onClick={async () => {
                    if (choice.panel) {
                      onPanel(choice.panel);
                      onClose();
                      return;
                    }
                    if (choice.command) {
                      setPending(true);
                      const ok = await send(choice.command);
                      setPending(false);
                      if (ok) setRefresh((v) => v + 1);
                      else
                        setError(
                          'Действие отклонено. Проверьте припасы, деньги и состояние задания.',
                        );
                    }
                  }}
                >
                  <b>
                    {i + 1}. {choice.label}
                  </b>
                  <small>{choice.detail}</small>
                </button>
              ))}
              <button onClick={onClose}>До встречи.</button>
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}
export function ArmyPanel({ world, send }: { world: View; send: Send }) {
  const p = world.player!,
    army = world.armies.find((a) => a.id === p.army)!;
  const [quantity, setQuantity] = useState(20),
    [count, setCount] = useState(5);
  const here = p.scene === 'settlement' && !p.journey && world.hero?.alive;
  return (
    <>
      <span className="eyebrow">ВАШИ СПУТНИКИ</span>
      <h2>Смешанный отряд</h2>
      <div className="metrics">
        <div>
          <b>{army.members.length}/60</b>бойцов
        </div>
        <div>
          <b>{Math.floor(army.morale)}%</b>мораль
        </div>
        <div>
          <b>{Math.floor(army.food)}</b>пайков
        </div>
      </div>
      <p>
        Запаса отряда на {army.members.length ? Math.floor(army.food / army.members.length) : 0} дн.
        В инвентаре героя: {Math.floor(p.inventory.grain)} зерна.
      </p>
      <small>
        Каждый солдат ест 1 зерно в день. Отряд пополняет запас из вашего инвентаря, оставляя 3
        зерна герою.
      </small>
      {!here && (
        <p className="muted">Набор, обучение и передача запасов доступны внутри поселения.</p>
      )}
      <fieldset disabled={!here}>
        <legend>Набор</legend>
        <label>
          Количество
          <input
            type="number"
            min="1"
            max="20"
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
          />
        </label>
        <button className="full" onClick={() => void send({ type: 'recruit', count })}>
          Нанять {count} · {count * 10} монет
        </button>
        <label>
          Передать зерна
          <input
            type="number"
            min="1"
            max="500"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />
        </label>
        <button className="full" onClick={() => void send({ type: 'supply', quantity })}>
          Передать отряду
        </button>
        <h3>Обучение всего отряда</h3>
        <p className="muted">
          10 монет за бойца; конница — 25 монет и лошадь каждому. Лошади выживших возвращаются при
          смене класса.
        </p>
        <div className="actions">
          {(['infantry', 'spearmen', 'archers', 'cavalry'] as const).map((unitClass) => (
            <button
              key={unitClass}
              disabled={army.unitClass === unitClass || !army.members.length}
              onClick={() => void send({ type: 'train', unitClass })}
            >
              {troopNames[unitClass]} · {army.members.length * (unitClass === 'cavalry' ? 25 : 10)}{' '}
              монет
            </button>
          ))}
        </div>
        <button
          className="full"
          disabled={!army.members.length}
          onClick={() => {
            if (window.confirm('Распустить отряд? Выжившие вернутся к мирным профессиям.'))
              void send({ type: 'dismiss' });
          }}
        >
          Распустить отряд
        </button>
      </fieldset>
      <h3>Люди в отряде</h3>
      <p>
        Личное обучение: 10 монет, конница — 25 и лошадь, маг — 60 и 3 дня. Для мага нужны потенциал
        ≥ 4, учитель и еда. Классы можно смешивать.
      </p>
      {world.party?.map((person) => (
        <div className="stat" key={person.id}>
          <span>
            {person.npc?.name ?? `Боец ${person.id}`}
            <small>
              Опыт: {person.experience} · потенциал {person.potential}
            </small>
            <select
              aria-label={`Класс бойца ${person.id}`}
              disabled={!here}
              value={person.unitClass ?? army.unitClass}
              onChange={(e) =>
                void send({
                  type: 'train_soldier',
                  person: person.id,
                  unitClass: e.target.value as Extract<
                    Command,
                    { type: 'train_soldier' }
                  >['unitClass'],
                })
              }
            >
              {Object.entries(troopNames).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </span>
          <b>{Math.round(person.health)} ♥</b>
        </div>
      ))}
    </>
  );
}
export function QuestJournal({
  world,
  send,
  onLocate,
}: {
  world: View;
  send: Send;
  onLocate: (id: number) => void;
}) {
  const [filter, setFilter] = useState('accepted');
  const list = world.quests.filter((q) => filter === 'all' || q.status === filter);
  return (
    <>
      <span className="eyebrow">ЖУРНАЛ ПУТЕШЕСТВЕННИКА</span>
      <h2>Задания</h2>
      <select
        aria-label="Фильтр заданий"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      >
        <option value="accepted">Принятые</option>
        <option value="open">Доступные</option>
        <option value="completed">Выполненные</option>
        <option value="all">Все известные</option>
      </select>
      {!list.length && (
        <p className="muted">
          Здесь пока нет заданий. Поговорите с жителями поселения или посмотрите доступные
          контракты.
        </p>
      )}
      {list.map((q) => {
        const local =
          world.hero?.settlement === q.settlement && world.player?.scene === 'settlement';
        return (
          <div className="quest" key={q.id}>
            <b>{q.type === 'hunt' ? 'Устранить угрозу существ' : `Доставить ${q.need} зерна`}</b>
            <p>
              {world.settlements[q.settlement].name} · {q.reason}
            </p>
            <p>Награда: {q.reward} монет</p>
            <strong>
              {q.objectiveMet
                ? 'Цель выполнена — получите награду'
                : {
                    open: 'Доступно',
                    accepted: 'Принято',
                    completed: 'Завершено',
                    resolved: 'Проблема разрешилась',
                  }[q.status]}
            </strong>
            <button onClick={() => onLocate(q.settlement)}>Показать место</button>
            {local && ['open', 'accepted'].includes(q.status) && (
              <button
                onClick={() =>
                  void send({
                    type: q.status === 'open' ? 'accept_quest' : 'complete_quest',
                    quest: q.id,
                  })
                }
              >
                {q.status === 'open' ? 'Принять' : 'Сдать контракт'}
              </button>
            )}
            {q.status === 'accepted' && !q.objectiveMet && local && (
              <button onClick={() => void send({ type: 'abandon_quest', quest: q.id })}>
                Отказаться
              </button>
            )}
          </div>
        );
      })}
    </>
  );
}
export function TravelPanel({
  world,
  selected,
  onSelect,
}: {
  world: View;
  selected: number;
  onSelect: (id: number) => void;
}) {
  const [query, setQuery] = useState('');
  const path = route(world, world.hero!.settlement, selected);
  const days = path
    .slice(1)
    .reduce(
      (total, id, i) =>
        total +
        (world.roads.find((r) => (r.a === path[i] && r.b === id) || (r.b === path[i] && r.a === id))
          ?.days ?? 0),
      0,
    );
  return (
    <div className="travel-panel">
      <label>
        Найти поселение
        <input
          placeholder="Название города или деревни"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      {query && (
        <div className="place-results">
          {world.settlements
            .filter((s) => s.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
            .slice(0, 12)
            .map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  onSelect(s.id);
                  setQuery('');
                }}
              >
                {s.name} · {world.states[s.state].name}
              </button>
            ))}
        </div>
      )}
      {selected !== world.hero!.settlement && (
        <p className="muted">
          {path.length > 1
            ? `Путь: ${days} дн. Расход героя: ${days} зерна; отряда: ${days * (world.armies.find((a) => a.id === world.player?.army)?.members.length ?? 0)}.`
            : 'Открытой дороги нет.'}
        </p>
      )}
    </div>
  );
}
export function Guide({ world }: { world: View }) {
  const p = world.player!,
    army = world.armies.find((a) => a.id === p.army)!;
  const steps = [
    ['Создайте героя', true],
    ['Войдите в поселение', p.scene === 'settlement' || p.visited.length > 1],
    ['Наймите спутников', army.members.length > 0],
    [
      'Примите контракт',
      world.quests.some((q) => q.status === 'accepted' || q.status === 'completed'),
    ],
    ['Выполните контракт', world.quests.some((q) => q.status === 'completed')],
    ['Посетите другую землю', p.visited.length > 1],
  ] as const;
  return (
    <>
      <span className="eyebrow">ПЕРВЫЕ ШАГИ</span>
      <h2>Ваша история</h2>
      {steps.map(([text, done]) => (
        <p key={text}>
          {done ? '✓' : '○'} {text}
        </p>
      ))}
      <h3>Управление</h3>
      <p>Перетаскивание — камера. Колесо или +/− — масштаб. ♟ — к герою, ⌖ — весь континент.</p>
      <p>
        Пробел — пауза, E — войти в поселение, Esc — меню. Время останавливается по прибытии и после
        отдыха.
      </p>
      <p>
        Жителей можно выбрать на сцене или в списке. Разговоры показывают реальные проблемы и
        доступные контракты.
      </p>
      <p>
        Зерно кормит героя и отряд. Работа в поселении приносит деньги и занимает день. Постой
        восстанавливает здоровье, но требует денег и припасов.
      </p>
      <p>
        В бою используйте атаку, удержание позиции или нажмите на поле для движения. Лучники атакуют
        издалека, конница движется быстрее. Смерти постоянны.
      </p>
      <p>
        После гибели можно продолжить за живого взрослого наследника. Без него начните новую историю
        или загрузите сохранение.
      </p>
    </>
  );
}
