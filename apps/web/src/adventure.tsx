import { useState } from 'react';
import { governments, GOODS, type Command } from '@living-world/simulation';
import type { View } from './types';
type Props = { world: View; send: (c: Command) => Promise<boolean> };
const label = {
  grain: 'Зерно',
  wood: 'Дерево',
  stone: 'Камень',
  iron: 'Железо',
  tools: 'Инструменты',
  weapons: 'Оружие',
  horses: 'Лошади',
};
export function Adventure({ world, send }: Props) {
  const [newTown, setNewTown] = useState('Новый очаг');
  const [pending, setPending] = useState(false),
    [target, setTarget] = useState(''),
    [destination, setDestination] = useState('');
  const p = world.player!,
    hero = world.hero!,
    s = world.settlements[hero.settlement],
    state = world.states[s.state];
  const army = world.armies.find((a) => a.id === p.army)!;
  const local =
    p.scene === 'settlement' && !p.journey && world.battle?.status !== 'active' && hero.alive;
  const siege = world.sieges.find((v) => v.status === 'active' && v.attacker === army.id);
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
    <section className="adventure-panel">
      <span className="eyebrow">ЖИЗНЬ В МИРЕ</span>
      <h2>{s.name}</h2>
      <p>
        Держава: {state.name} · {governments[state.government]?.name ?? state.government}
      </p>
      <fieldset
        disabled={pending || !hero.alive || !!p.journey || world.battle?.status === 'active'}
      >
        <h3>Поход и осада</h3>
        {world.sieges.some(
          (v) => v.status === 'active' && v.settlement === s.id && v.attacker !== army.id,
        ) &&
          army.state === s.state && (
            <button onClick={() => void act({ type: 'defend_siege' })}>
              Защитить поселение · вылазка гарнизона
            </button>
          )}
        <p>
          Укрепления: {s.fortification}/5. При штурме они снижают получаемый защитниками урон. Осада
          блокирует все дороги поселения.
        </p>
        {siege ? (
          <>
            <p>
              Осада {world.settlements[siege.settlement].name}: {world.day - siege.started} дн. ·
              давление {Math.floor(siege.pressure)}/60 · машин {siege.engines ?? 0}
            </p>
            <button
              disabled={
                (siege.engines ?? 0) >= 3 ||
                p.inventory.wood < 30 ||
                p.inventory.iron < 10 ||
                p.inventory.tools < 5
              }
              onClick={() => void act({ type: 'siege_engine' })}
            >
              Осадная машина · 30 дерева, 10 железа, 5 инструментов
            </button>
            <button onClick={() => void act({ type: 'assault' })}>Начать штурм</button>
            <button onClick={() => void act({ type: 'lift_siege' })}>Снять осаду</button>
          </>
        ) : (
          <button
            disabled={s.state === army.state || army.members.length < 5}
            onClick={() => void act({ type: 'besiege' })}
          >
            Начать осаду (нужна война)
          </button>
        )}
        <button onClick={() => void act({ type: 'wait', days: 1 })}>Ждать 1 день</button>
        <button onClick={() => void act({ type: 'wait', days: 7 })}>Ждать 7 дней</button>
        <p>
          Ожидание расходует еду героя и отряда. Для капитуляции нужны давление 60 и истощение
          гарнизона; при слабом снабжении ваша осада тоже сорвётся.
        </p>
      </fieldset>
      {!local && (
        <p className="hint">Войдите в поселение для обучения, хозяйства и политических решений.</p>
      )}
      <fieldset disabled={!local || pending}>
        <details>
          <summary>Охрана караванов</summary>
          <p>
            Три бойца и опасный маршрут. Отправитель резервирует 30 монет; выплата только после
            доставки. Охрана снижает риск потери, но не создаёт новый груз.
          </p>
          {world.caravans
            .filter((c) => c.status === 'traveling' && c.journey.route[c.journey.leg] === s.id)
            .map((c) => (
              <button key={c.id} onClick={() => void act({ type: 'escort', caravan: c.id })}>
                {c.id} → {world.settlements[c.to].name}: {Math.floor(c.amount)} {label[c.good]}
              </button>
            ))}
        </details>
        <details open>
          <summary>Земля и хозяйства</summary>
          <p>
            Владение стоит 400 монет: 300 продавцу, 100 в кассу. Зарплата — 2 монеты работнику в
            день. Производство выделяется из реального выпуска поселения, повторно товары не
            создаются.
          </p>
          {(['farm', 'mine', 'workshop'] as const).map((kind) => (
            <button
              key={kind}
              disabled={p.gold < 400}
              onClick={() => void act({ type: 'buy_estate', kind })}
            >
              Купить {kind === 'farm' ? 'ферму' : kind === 'mine' ? 'шахту' : 'мастерскую'}
            </button>
          ))}
          {world.estates
            .filter((e) => e.owner === p.person)
            .map((e) => (
              <article className="card" key={e.id}>
                <b>
                  {e.kind === 'farm' ? 'Ферма' : e.kind === 'mine' ? 'Шахта' : 'Мастерская'} ·{' '}
                  {world.settlements[e.settlement].name}
                </b>
                <p>
                  Работники: {e.workers.length} · касса {Math.floor(e.treasury)} ◈
                </p>
                <fieldset disabled={e.settlement !== s.id}>
                  <button
                    disabled={p.gold < 100}
                    onClick={() =>
                      void act({
                        type: 'estate',
                        estate: e.id,
                        action: 'fund',
                        quantity: 100,
                        good: 'grain',
                      })
                    }
                  >
                    Внести 100 ◈
                  </button>
                  <button
                    disabled={e.treasury < 50}
                    onClick={() =>
                      void act({
                        type: 'estate',
                        estate: e.id,
                        action: 'withdraw',
                        quantity: 50,
                        good: 'grain',
                      })
                    }
                  >
                    Забрать 50 ◈
                  </button>
                  {GOODS.filter((g) => e.stocks[g] >= 1).map((good) => (
                    <button
                      key={good}
                      onClick={() =>
                        void act({
                          type: 'estate',
                          estate: e.id,
                          action: 'collect',
                          quantity: Math.min(500, Math.floor(e.stocks[good])),
                          good,
                        })
                      }
                    >
                      Забрать {label[good]}: {Math.floor(e.stocks[good])}
                    </button>
                  ))}
                </fieldset>
              </article>
            ))}
        </details>
        <details>
          <summary>Магия и верования</summary>
          <p>
            Врождённый потенциал: {hero.potential} · мана: {Math.floor(hero.mana)}. Обучение не
            повышает врождённый потенциал. Мана восстанавливается со временем.
          </p>
          <p>
            Обучение в областном городе: 60 монет и 3 дня. Заклинание требует 10 маны и цель в
            радиусе 8 клеток.
          </p>
          {(['elemental', 'healing'] as const).map((school) => (
            <button
              key={school}
              disabled={!s.central || hero.potential < 1 || p.gold < 60}
              onClick={() => void act({ type: 'study', school })}
            >
              Изучать {school === 'elemental' ? 'стихии' : 'лечение'} · навык{' '}
              {(p.skills[school] ?? 0).toFixed(1)}
            </button>
          ))}
          <p>Ваш путь: {world.religions[hero.faith]?.name}</p>
          {world.religions.map((r) => (
            <button
              key={r.id}
              disabled={hero.faith === r.id}
              onClick={() => void act({ type: 'faith', religion: r.id })}
            >
              {r.name}
            </button>
          ))}
        </details>
        <details>
          <summary>Семья и признание наследника</summary>
          <p>
            Закон этой державы:{' '}
            {state.laws.inheritance === 'equal' ? 'равные доли' : 'всё старшему'}. Наследник
            получает собственные навыки, свою долю денег, товаров и владений. Признание требует
            доверия 10 и 50 монет; подарок 20 монет даёт 5 доверия раз в день.
          </p>
          {world.locals
            .filter((n) => n.id !== p.person)
            .map((n) => (
              <div className="card" key={n.id}>
                <b>{n.npc?.name ?? `Житель ${n.id}`}</b>
                <p>Доверие: {n.npc?.relationships[p.person] ?? 0}</p>
                <button onClick={() => void act({ type: 'gift', person: n.id })}>
                  Подарить 20 ◈
                </button>
                <button
                  disabled={p.heirs.includes(n.id)}
                  onClick={() => void act({ type: 'recognize_heir', person: n.id })}
                >
                  Признать наследником
                </button>
              </div>
            ))}
        </details>
        <details>
          <summary>Основание поселений и дорог</summary>
          <p>
            Для правителя области или державы. Новая деревня: 10 реальных переселенцев, 300 монет,
            100 дерева, 50 камня и 100 зерна. Нужна свободная соседняя клетка.
          </p>
          <input
            aria-label="Название нового поселения"
            value={newTown}
            onChange={(e) => setNewTown(e.target.value)}
            maxLength={50}
          />
          <button onClick={() => void act({ type: 'found_settlement', name: newTown })}>
            Основать деревню
          </button>
          <label>
            Новое дорожное соединение
            <select value={destination} onChange={(e) => setDestination(e.target.value)}>
              <option value="">Выберите соседнее поселение</option>
              {world.settlements
                .filter(
                  (t) =>
                    t.id !== s.id &&
                    t.state === s.state &&
                    Math.abs(t.x - s.x) + Math.abs(t.y - s.y) <= 2,
                )
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
            </select>
          </label>
          <button
            disabled={!destination}
            onClick={() => void act({ type: 'build_road', settlement: Number(destination) })}
          >
            Проложить дорогу (100 камня, 50 дерева)
          </button>
        </details>
        <details>
          <summary>Путь к верховной власти</summary>
          <p>
            Область: получите мандаты с лояльностью 50 в половине её поселений и обратитесь в
            областной столице. Корона: большинство областей, 10 бойцов, легитимность 40 и обращение
            в столице державы. В наследственной монархии дополнительно нужен кризис династии
            (легитимность &lt; 30).
          </p>
          <button onClick={() => void act({ type: 'seek_region' })}>
            Просить управление областью
          </button>
          <button onClick={() => void act({ type: 'seek_crown' })}>
            Созвать совет о верховной власти
          </button>
          <p>
            Следующее голосование:{' '}
            {governments[state.government]?.hereditary
              ? 'наследственная власть'
              : `через ${Math.max(0, state.electionDay - world.day)} дней`}
            . Дни массового недовольства: {state.unrestDays}/30.
          </p>
          {world.regions
            .filter((r) => r.state === state.id)
            .map((r) => (
              <p key={r.id}>
                {r.name}: {r.governor === p.person ? 'вы' : `житель ${r.governor}`}
              </p>
            ))}
          {state.ballots.length > 0 && (
            <details>
              <summary>Последние голоса совета</summary>
              {state.ballots.map((b, i) => (
                <p key={i}>
                  Житель {b.elector} → житель {b.candidate}
                </p>
              ))}
            </details>
          )}
          <button onClick={() => void act({ type: 'fortify' })}>
            Укрепить поселение (100 камня, 50 дерева, 200 ◈)
          </button>
          <button onClick={() => void act({ type: 'raise_army', count: 10 })}>
            Созвать 10 бойцов из казны
          </button>
          <label>
            Цель похода
            <select value={destination} onChange={(e) => setDestination(e.target.value)}>
              <option value="">Выберите поселение</option>
              {world.settlements.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          {world.armies
            .filter((a) => !a.player && a.commander === p.person && a.members.length)
            .map((a) => (
              <p key={a.id}>
                {a.id}: {a.members.length} бойцов, {Math.floor(a.food)} еды,{' '}
                {world.settlements[a.settlement].name}{' '}
                <button
                  disabled={!destination || !!a.journey}
                  onClick={() =>
                    void act({ type: 'march', army: a.id, settlement: Number(destination) })
                  }
                >
                  Отправить
                </button>
              </p>
            ))}
        </details>
        {state.ruler === p.person && (
          <details>
            <summary>Законы и дипломатия</summary>
            <p>
              Реформа снижает легитимность на 15 и лояльность поселений на 5. Запрет иных верований
              вызывает дополнительное недовольство последователей.
            </p>
            <select
              aria-label="Форма правления"
              value={state.government}
              onChange={(e) => {
                if (window.confirm('Провести реформу? Легитимность −15, лояльность −5.'))
                  void act({
                    type: 'reform',
                    government: e.target.value as Extract<
                      Command,
                      { type: 'reform' }
                    >['government'],
                  });
              }}
            >
              {Object.entries(governments).map(([id, g]) => (
                <option key={id} value={id}>
                  {g.name}
                </option>
              ))}
            </select>
            <button
              onClick={() =>
                void act({
                  type: 'law',
                  inheritance: state.laws.inheritance === 'equal' ? 'eldest' : 'equal',
                  tolerance: state.laws.tolerance,
                })
              }
            >
              Наследование: {state.laws.inheritance === 'equal' ? 'равные доли' : 'старшему'} —
              изменить
            </button>
            <button
              onClick={() =>
                void act({
                  type: 'law',
                  inheritance: state.laws.inheritance,
                  tolerance: !state.laws.tolerance,
                })
              }
            >
              Веротерпимость: {state.laws.tolerance ? 'да' : 'нет'} — изменить
            </button>
            <label>
              Другая держава
              <select value={target} onChange={(e) => setTarget(e.target.value)}>
                <option value="">Выберите державу</option>
                {world.states
                  .filter((t) => t.id !== state.id && t.capital >= 0)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} · отношения {state.relations[t.id] ?? 0}
                    </option>
                  ))}
              </select>
            </label>
            <p>
              Претензия требует общей границы и 10 дней дефицита. Война требует претензии; мир
              доступен через 7 дней. Договоры требуют отношений ≥ 10.
            </p>
            {(
              [
                ['claim', 'Претензия'],
                ['war', 'Объявить войну'],
                ['peace', 'Предложить мир'],
                ['alliance', 'Союз'],
                ['trade', 'Торговля'],
                ['access', 'Проход'],
              ] as const
            ).map(([action, name]) => (
              <button
                disabled={!target}
                key={action}
                onClick={() => {
                  if (action !== 'war' || window.confirm('Объявить войну выбранной державе?'))
                    void act({ type: 'diplomacy', state: Number(target), action });
                }}
              >
                {name}
              </button>
            ))}
          </details>
        )}
      </fieldset>
      <details>
        <summary>Действующие договоры</summary>
        {world.treaties
          .filter((t) => t.until > world.day)
          .map((t) => (
            <p key={t.id}>
              {world.states[t.a].name} — {world.states[t.b].name}: {t.type}, ещё{' '}
              {t.until - world.day} дн.
            </p>
          ))}
      </details>
    </section>
  );
}
export function SpellPanel({ world, send }: Props) {
  const [school, setSchool] = useState<'elemental' | 'healing'>('elemental');
  const p = world.player!,
    b = world.battle;
  if (!b || b.status !== 'active') return null;
  return (
    <details>
      <summary>Заклинания · мана {Math.floor(world.hero!.mana)}</summary>
      <select
        aria-label="Школа заклинания"
        value={school}
        onChange={(e) => setSchool(e.target.value as typeof school)}
      >
        <option value="elemental">Стихийный удар</option>
        <option value="healing">Лечение</option>
      </select>
      <p>Выберите цель. Цена: 10 маны, радиус: 8 клеток.</p>
      {b.fighters
        .filter((f) => f.hp > 0 && f.side === (school === 'healing' ? 'player' : 'enemy'))
        .map((f) => (
          <button
            key={f.id}
            disabled={world.hero!.mana < 10 || !(p.skills[school] >= 1)}
            onClick={() => void send({ type: 'spell', school, target: f.id })}
          >
            {f.person === p.person ? 'Герой' : f.id} · {Math.ceil(f.hp)} HP
          </button>
        ))}
    </details>
  );
}
