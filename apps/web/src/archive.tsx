import { useEffect, useState } from 'react';
import { date, type GameEvent, type Person, type NPC } from '@living-world/simulation';
import { api } from './api';
export function Archive({ people = false }: { people?: boolean }) {
  const [offset, setOffset] = useState(0),
    [data, setData] = useState<{
      total: number;
      items: (GameEvent | (Person & { npc?: NPC }))[];
    } | null>(null),
    [error, setError] = useState(''),
    [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    setError('');
    api<{ total: number; items: (GameEvent | (Person & { npc?: NPC }))[] }>(
      `${people ? '/admin/people' : '/history'}?offset=${offset}&limit=50`,
    )
      .then((d) => {
        if (active) setData(d);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [offset, people, refresh]);
  return (
    <div className="chronicle">
      <span className="eyebrow">{people ? 'ЖИТЕЛИ МИРА' : 'ЛЕТОПИСЬ МИРА'}</span>
      <p>Записей: {data?.total ?? '…'}</p>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - 50))}>
        Назад
      </button>
      <button disabled={!data || offset + 50 >= data.total} onClick={() => setOffset(offset + 50)}>
        Далее
      </button>
      <button onClick={() => setRefresh((n) => n + 1)}>Обновить</button>
      {data?.items.map((item) =>
        'day' in item ? (
          <p key={item.id}>
            <time>{date(item.day)}</time>
            {item.text}
          </p>
        ) : (
          <details key={item.id}>
            <summary>
              {item.npc?.name ?? `Житель ${item.id}`} · {item.alive ? 'жив' : 'умер'}
            </summary>
            <p>
              Поселение: {item.settlement} · профессия: {item.profession} · здоровье:{' '}
              {item.health.toFixed(1)}
            </p>
            <p>
              Родители: {item.parents.join(', ') || 'неизвестны'} · дети:{' '}
              {item.children.join(', ') || 'нет'}
            </p>
            <p>
              Имущество: {item.wealth.toFixed(1)} ◈ · потенциал: {item.potential}
            </p>
          </details>
        ),
      )}
    </div>
  );
}
