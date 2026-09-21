import { useState } from 'react';
import { RACES, emblems, type Command } from '@living-world/simulation';
import type { View } from './types';
export function Statecraft({
  world,
  send,
}: {
  world: View;
  send: (c: Command) => Promise<boolean>;
}) {
  const p = world.player!,
    s = world.states[world.hero!.state];
  const [name, setName] = useState(s.name),
    [color, setColor] = useState(s.color),
    [emblem, setEmblem] = useState<NonNullable<typeof s.emblem>>(s.emblem ?? 'tower'),
    [title, setTitle] = useState(s.rulerTitle ?? 'Правитель'),
    [other, setOther] = useState(''),
    [amount, setAmount] = useState(50),
    [pending, setPending] = useState(false);
  if (s.ruler !== p.person) return null;
  const act = async (c: Command) => {
    if (pending) return;
    setPending(true);
    try {
      await send(c);
    } finally {
      setPending(false);
    }
  };
  const labels = {
    vassalage: 'Вассальная клятва',
    guarantee: 'Гарантия защиты',
    tribute: 'Дань',
  } as const;
  return (
    <details>
      <summary>Держава: герб, права и обязательства</summary>
      <fieldset
        disabled={
          pending || p.scene !== 'settlement' || !!p.journey || world.battle?.status === 'active'
        }
      >
        <h3 style={{ color: s.color }}>
          {emblems[s.emblem ?? 'tower']} {s.name}
        </h3>
        <label>
          Название
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
        </label>
        <label>
          Цвет знамени
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
        </label>
        <label>
          Герб
          <select value={emblem} onChange={(e) => setEmblem(e.target.value as typeof emblem)}>
            {Object.entries(emblems).map(([id, glyph]) => (
              <option key={id} value={id}>
                {glyph} · {id}
              </option>
            ))}
          </select>
        </label>
        <label>
          Титул правителя
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={40} />
        </label>
        <button
          onClick={() =>
            void act({ type: 'state_identity', name, color, emblem, rulerTitle: title })
          }
        >
          Утвердить символику
        </button>
        <h3>Гражданские права</h3>
        <p>
          Ограничение закрывает новые назначения и наследование власти. Дискриминация снижает
          лояльность жителей; изменение закона стоит 10 легитимности.
        </p>
        {RACES.map((race) => (
          <label key={race}>
            {race}
            <select
              value={s.raceRights?.[race] ?? 'equal'}
              onChange={(e) =>
                void act({
                  type: 'race_rights',
                  race,
                  rights: e.target.value as 'equal' | 'restricted',
                })
              }
            >
              <option value="equal">Равные права</option>
              <option value="restricted">Без права на должность</option>
            </select>
          </label>
        ))}
        <h3>Договорные обязательства</h3>
        <label>
          Держава
          <select value={other} onChange={(e) => setOther(e.target.value)}>
            <option value="">Выберите державу</option>
            {world.states
              .filter((v) => v.id !== s.id && v.capital >= 0)
              .map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
          </select>
        </label>
        <label>
          Выплата каждые 30 дней
          <input
            type="number"
            min={10}
            max={500}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        </label>
        <p>
          Вы присягаете выбранной державе или обязуетесь платить ей дань из казны. Гарантия
          обязывает вас защищать её при нападении. Нужны мир и взаимные отношения ≥10; срок — 360
          дней. Вассал не объявляет самостоятельные войны.
        </p>
        {(['vassalage', 'guarantee', 'tribute'] as const).map((action) => (
          <button
            key={action}
            disabled={!other}
            onClick={() => void act({ type: 'state_pact', state: Number(other), action, amount })}
          >
            {labels[action]}
          </button>
        ))}
        <p>
          Разрыв своего обязательства или освобождение вассала: −10 легитимности и −30 отношений.
        </p>
        {world.treaties
          .filter(
            (t) =>
              t.until > world.day &&
              ['vassalage', 'guarantee', 'tribute'].includes(t.type) &&
              (t.a === s.id || (t.type === 'vassalage' && t.b === s.id)),
          )
          .map((t) => (
            <div className="card" key={t.id}>
              {world.states[t.a].name} → {world.states[t.b].name}:{' '}
              {labels[t.type as keyof typeof labels]} · {t.until - world.day} дн.
              {t.amount !== undefined && (
                <p>
                  Выплата: {t.amount} ◈; через{' '}
                  {Math.max(0, (t.nextPayment ?? world.day) - world.day)} дн.
                </p>
              )}
              <button onClick={() => void act({ type: 'end_pact', treaty: t.id })}>
                Прекратить обязательство
              </button>
            </div>
          ))}
      </fieldset>
    </details>
  );
}
