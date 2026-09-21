import { useState } from 'react';
import { SCHOOLS, schoolInfo, type School, type Command } from '@living-world/simulation';
import type { View } from './types';
export function Lore({ world, send }: { world: View; send: (c: Command) => Promise<boolean> }) {
  const p = world.player!,
    s = world.settlements[world.hero!.settlement];
  const [school, setSchool] = useState<School>('elemental'),
    [name, setName] = useState('Уголь последней зари'),
    [recipient, setRecipient] = useState(''),
    [pending, setPending] = useState(false);
  const act = async (c: Command) => {
    if (pending) return;
    setPending(true);
    try {
      await send(c);
    } finally {
      setPending(false);
    }
  };
  return (
    <details>
      <summary>Книги и артефакты</summary>
      <fieldset
        disabled={
          pending || p.scene !== 'settlement' || !!p.journey || world.battle?.status === 'active'
        }
      >
        <p>
          Магическая руда города: {s.essence ?? 0}; остаток месторождения: {s.essenceReserve ?? 0}.
          Шахтёры извлекают одну единицу за 30 дней, расходуя железо и инструмент.
        </p>
        <label>
          Школа
          <select value={school} onChange={(e) => setSchool(e.target.value as School)}>
            {SCHOOLS.map((id) => (
              <option key={id} value={id}>
                {schoolInfo[id].name}
              </option>
            ))}
          </select>
        </label>
        <button onClick={() => void act({ type: 'commission_book', school })}>
          Заказать трактат · 80 ◈, 2 дерева, 1 инструмент со склада города
        </button>
        <p>
          Нужен живой учитель выбранной школы. Чтение собственной книги занимает 3 дня и обучает до
          навыка 3.
        </p>
        <label>
          Имя артефакта
          <input value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
        </label>
        <button onClick={() => void act({ type: 'forge_artifact', school, name })}>
          Выковать артефакт · 100 ◈, 3 руды, 10 железа, 2 инструмента
        </button>
        <p>
          Нужны ремесло 2 и школа 2. Артефакт снижает цену заклинаний своей школы на 2 маны;
          усиливает урон, лечение и духа на 8. Несколько артефактов одной школы не складываются.
        </p>
        <label>
          Получатель подарка
          <select value={recipient} onChange={(e) => setRecipient(e.target.value)}>
            <option value="">Выберите местного жителя</option>
            {world.locals
              .filter((n) => n.id !== p.person)
              .map((n) => (
                <option key={n.id} value={n.id}>
                  {n.npc?.name ?? `Житель ${n.id}`}
                </option>
              ))}
          </select>
        </label>
        {(world.items ?? [])
          .filter((item) => item.owner === p.person)
          .map((item) => (
            <div className="card" key={item.id}>
              <b>
                {item.kind === 'book' ? 'Трактат' : 'Артефакт'}: {item.name}
              </b>
              <p>
                {schoolInfo[item.school].name} · создатель{' '}
                {item.creator === p.person
                  ? p.name
                  : (world.locals.find((n) => n.id === item.creator)?.npc?.name ??
                    'Мастер прежних лет')}{' '}
                · день {item.created}
              </p>
              <p>
                Исторические записи: {item.history.join(', ')}. Предмет наследуется по закону
                державы.
              </p>
              <ul>
                {item.history.map((id) => (
                  <li key={id}>
                    {world.events.find((e) => e.id === id)?.text ??
                      'Ранняя запись доступна в полном архиве истории.'}
                  </li>
                ))}
              </ul>
              {item.kind === 'book' && (
                <button
                  disabled={(p.skills[item.school] ?? 0) >= 3}
                  onClick={() => void act({ type: 'read_book', item: item.id })}
                >
                  Читать · 3 дня
                </button>
              )}
              <button
                disabled={!recipient}
                onClick={() =>
                  void act({ type: 'give_item', item: item.id, person: Number(recipient) })
                }
              >
                Передать выбранному жителю
              </button>
            </div>
          ))}
      </fieldset>
    </details>
  );
}
