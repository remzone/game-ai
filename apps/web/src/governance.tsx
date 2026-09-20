import { useState } from 'react';
import type { Command } from '@living-world/simulation';
import type { View } from './types';

export function GovernancePanel({
  world,
  send,
}: {
  world: View;
  send: (c: Command) => Promise<boolean>;
}) {
  const [pending, setPending] = useState(false);
  const p = world.player!,
    hero = world.hero!;
  const s = world.settlements[hero.settlement],
    g = s.governance,
    state = world.states[s.state];
  const army = world.armies.find((a) => a.id === p.army)!;
  const local =
    p.scene === 'settlement' && !p.journey && world.battle?.status !== 'active' && hero.alive;
  const owns = g.steward === p.person;
  const rep = p.reputation[`settlement:${s.id}`] ?? 0;
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
    <section className="governance-panel">
      <span className="eyebrow">СЛУЖБА И ВЛАСТЬ</span>
      <h2>Совет · {s.name}</h2>
      <p>
        {owns
          ? 'Вы — действующий управляющий.'
          : g.steward === null
            ? 'Поселением управляет местный совет.'
            : `Управляющий: житель ${g.steward}.`}
      </p>
      <div className="stat">
        <span>Лояльность жителей</span>
        <b>{s.loyalty.toFixed(1)} / 100</b>
      </div>
      <div className="stat">
        <span>Ваша местная репутация</span>
        <b>{rep.toFixed(1)}</b>
      </div>
      <div className="stat">
        <span>Казна поселения</span>
        <b>{Math.floor(s.treasury)} ◈</b>
      </div>
      <div className="stat">
        <span>Развитие хозяйства</span>
        <b>{s.infrastructure} / 10</b>
      </div>
      <p>
        Налог державы: {Math.round(state.tax * 100)}% · местный сбор: {Math.round(g.localTax * 100)}
        %. Общая нагрузка выше 20% ежедневно снижает лояльность.
      </p>
      {!local && (
        <p className="hint">
          Для решений войдите в поселение у героя и завершите бой или путешествие.
        </p>
      )}
      <fieldset disabled={!local || pending}>
        {!owns && (
          <>
            <p>
              Путь к мандату: защитник (репутация 40, 5 бойцов) → управляющий (репутация 60,
              лояльность ≥ 50, голод менее 3 дней). Сейчас в отряде: {army.members.length}.
            </p>
            {g.eligibleDay > world.day && (
              <p>Новое назначение возможно через {g.eligibleDay - world.day} дн.</p>
            )}
            <button
              disabled={rep < 40 || army.members.length < 5}
              onClick={() => void act({ type: 'petition' })}
            >
              Просить признание защитником
            </button>
            <button
              disabled={
                g.steward !== null ||
                rep < 60 ||
                army.members.length < 5 ||
                s.loyalty < 50 ||
                s.shortageDays >= 3 ||
                g.eligibleDay > world.day
              }
              onClick={() => void act({ type: 'seek_office' })}
            >
              Просить мандат управляющего
            </button>
          </>
        )}
        {owns && (
          <>
            <h3>Местный сбор</h3>
            <p>Весь сбор поступает в общественную казну. Личный кошелёк отделён от неё.</p>
            <div className="actions">
              {[0, 0.05, 0.1, 0.2].map((value) => (
                <button
                  key={value}
                  disabled={g.localTax === value}
                  onClick={() => void act({ type: 'local_tax', value })}
                >
                  {Math.round(value * 100)}%
                </button>
              ))}
            </div>
            <button
              disabled={
                s.infrastructure >= 10 ||
                s.treasury < 200 ||
                s.stocks.wood < 100 ||
                s.stocks.stone < 50
              }
              onClick={() => void act({ type: 'public_build' })}
            >
              Развить хозяйство из казны
            </button>
            <p>
              100 дерева, 50 камня, 200 монет поселения. Оплата поступает живым взрослым работникам;
              развитие повышает урожай.
            </p>
            <p className={g.unrestDays > 0 ? 'error' : 'hint'}>
              Недоверие: {g.unrestDays} / 14 дней. Лояльность ≤ 25 в течение 14 дней подряд приводит
              к отзыву мандата и отмене сбора. Новый мандат недоступен 30 дней. Должность не
              наследуется.
            </p>
            <button
              onClick={() => {
                if (
                  window.confirm('Уйти в отставку? Повторное назначение будет недоступно 30 дней.')
                )
                  void act({ type: 'resign_office' });
              }}
            >
              Сложить полномочия
            </button>
          </>
        )}
        <h3>Помощь жителям</h3>
        <p>
          На складе {Math.floor(s.stocks.grain)} зерна · у вас {Math.floor(p.inventory.grain)}.
          Репутация и лояльность растут только при восполнении нехватки суточного рациона.
        </p>
        <button
          disabled={p.inventory.grain < 20}
          onClick={() => void act({ type: 'relief', quantity: 20 })}
        >
          Передать 20 личного зерна
        </button>
        {state.ruler === p.person && (
          <>
            <h3>Налог державы</h3>
            <div className="actions">
              {[0.1, 0.2, 0.4, 0.6].map((value) => (
                <button
                  key={value}
                  disabled={state.tax === value}
                  onClick={() => void act({ type: 'tax', value })}
                >
                  {Math.round(value * 100)}%
                </button>
              ))}
            </div>
          </>
        )}
      </fieldset>
      <details>
        <summary>Ваши действующие мандаты</summary>
        {world.settlements
          .filter((t) => t.governance.steward === p.person)
          .map((t) => (
            <p key={t.id}>
              {t.name} · лояльность {t.loyalty.toFixed(1)} · недоверие {t.governance.unrestDays}/14
            </p>
          ))}
      </details>
    </section>
  );
}
