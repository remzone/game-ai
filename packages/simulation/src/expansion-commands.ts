import { SCHOOLS, castSpell } from './magic.js';
import { hasCivilRights, overlord, sameRealm, honorGuarantees } from './statecraft.js';
import { z } from 'zod';
import { emptyStocks, emptyWorkers, BASE_PRICES, GOODS, type World } from './model.js';
import { promote, event } from './world.js';
import { nextId, makeJourney, route, movePerson } from './world.js';
import { adult, levy, tickDay } from './systems.js';
import { governments, succession, crown } from './polity.js';
import { endSiege, beginSiege, militaryRoute } from './campaign.js';
import { startBattle } from './combat.js';
const id = z.number().int().nonnegative();
export const ExpansionSchemas = [
  z
    .object({
      type: z.literal('train_soldier'),
      person: id,
      unitClass: z.enum(['infantry', 'spearmen', 'archers', 'cavalry', 'mages']),
    })
    .strict(),
  z
    .object({ type: z.literal('found_settlement'), name: z.string().trim().min(2).max(50) })
    .strict(),
  z.object({ type: z.literal('build_road'), settlement: id }).strict(),
  z.object({ type: z.literal('escort'), caravan: z.string().max(80) }).strict(),
  z.object({ type: z.literal('seek_region') }).strict(),
  z.object({ type: z.literal('seek_crown') }).strict(),
  z
    .object({
      type: z.literal('reform'),
      government: z.enum([
        'feudal_monarchy',
        'absolute_monarchy',
        'elective_monarchy',
        'republic',
        'merchant_republic',
        'theocracy',
        'tribal_confederation',
        'military_dictatorship',
        'council_of_nobles',
        'magocracy',
      ]),
    })
    .strict(),
  z
    .object({
      type: z.literal('law'),
      inheritance: z.enum(['equal', 'eldest']),
      tolerance: z.boolean(),
    })
    .strict(),
  z
    .object({
      type: z.literal('diplomacy'),
      state: id,
      action: z.enum(['claim', 'war', 'peace', 'alliance', 'trade', 'access']),
    })
    .strict(),
  z.object({ type: z.literal('raise_army'), count: z.number().int().min(3).max(60) }).strict(),
  z.object({ type: z.literal('march'), army: z.string().max(80), settlement: id }).strict(),
  z.object({ type: z.literal('besiege') }).strict(),
  z.object({ type: z.literal('assault') }).strict(),
  z.object({ type: z.literal('defend_siege') }).strict(),
  z.object({ type: z.literal('siege_engine') }).strict(),
  z.object({ type: z.literal('lift_siege') }).strict(),
  z.object({ type: z.literal('fortify') }).strict(),
  z.object({ type: z.literal('buy_estate'), kind: z.enum(['farm', 'mine', 'workshop']) }).strict(),
  z
    .object({
      type: z.literal('estate'),
      estate: z.string().max(80),
      action: z.enum(['fund', 'withdraw', 'collect']),
      quantity: z.number().int().min(1).max(500),
      good: z.enum(GOODS),
    })
    .strict(),
  z.object({ type: z.literal('recognize_heir'), person: id }).strict(),
  z.object({ type: z.literal('study'), school: z.enum(SCHOOLS) }).strict(),
  z
    .object({
      type: z.literal('spell'),
      school: z.enum(SCHOOLS),
      target: z.string().max(80),
    })
    .strict(),
  z.object({ type: z.literal('gift'), person: id }).strict(),
  z.object({ type: z.literal('faith'), religion: id }).strict(),
  z.object({ type: z.literal('wait'), days: z.number().int().min(1).max(30) }).strict(),
] as const;
export const ExpansionSchema = z.discriminatedUnion('type', ExpansionSchemas);
function ensure(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
export function expansionCommand(w: World, input: unknown): boolean {
  const parsed = ExpansionSchema.safeParse(input);
  if (!parsed.success) return false;
  const c = parsed.data,
    p = w.player;
  ensure(p, 'Создайте героя');
  const hero = w.people[p.person],
    s = w.settlements[hero.settlement],
    a = w.armies.find((a) => a.id === p.army)!;
  ensure(hero.alive && !p.gameOver, 'Нужен живой герой');
  if (c.type === 'spell') {
    castSpell(w, c.school, c.target);
    return true;
  }
  ensure(w.battle?.status !== 'active' && !p.journey, 'Завершите бой или путь');
  const siege = w.sieges.find(
    (v) => v.status === 'active' && v.attacker === a.id && v.settlement === s.id,
  );
  if (c.type === 'defend_siege') {
    const blockade = w.sieges.find((v) => v.status === 'active' && v.settlement === s.id);
    const attacker = w.armies.find((v) => v.id === blockade?.attacker);
    ensure(
      blockade && attacker && a.state === s.state && attacker.state !== a.state,
      'Нужна осада поселения вашей державы',
    );
    startBattle(w, attacker.id, blockade.id, true);
    return true;
  }
  if (c.type === 'lift_siege' || c.type === 'assault') {
    ensure(siege, 'Вы не ведёте здесь осаду');
    if (c.type === 'lift_siege') endSiege(w, siege, false);
    else startBattle(w, siege.defender, siege.id);
    return true;
  }
  if (c.type === 'siege_engine') {
    ensure(siege && (siege.engines ?? 0) < 3, 'Нужна активная осада; максимум 3 машины');
    ensure(
      a.members.length >= 5 &&
        p.inventory.wood >= 30 &&
        p.inventory.iron >= 10 &&
        p.inventory.tools >= 5,
      'Нужны 5 бойцов, 30 дерева, 10 железа и 5 инструментов',
    );
    p.inventory.wood -= 30;
    p.inventory.iron -= 10;
    p.inventory.tools -= 5;
    siege.engines = (siege.engines ?? 0) + 1;
    event(w, 'siege_engine', `${p.name}: построена осадная машина у ${s.name}.`, [siege.id], true);
    return true;
  }
  if (c.type === 'besiege') {
    ensure(a.members.length >= 5, 'Нужны 5 бойцов');
    ensure(a.state !== s.state, 'Это союзное поселение');
    ensure(
      w.wars.some(
        (war) =>
          war.active &&
          ((war.a === a.state && war.b === s.state) || (war.b === a.state && war.a === s.state)),
      ),
      'Нужна объявленная война',
    );
    ensure(
      !w.sieges.some(
        (v) => v.status === 'active' && (v.settlement === s.id || v.attacker === a.id),
      ),
      'Здесь уже осада или ваш отряд занят',
    );
    beginSiege(w, a);
    w.speed = 0;
    p.scene = 'world';
    return true;
  }
  if (c.type === 'wait') {
    ensure(
      p.inventory.grain >= c.days && p.inventory.grain + a.food >= c.days * (a.members.length + 1),
      'Недостаточно еды для ожидания',
    );
    for (let i = 0; i < c.days && hero.alive; i++) tickDay(w);
    w.speed = 0;
    return true;
  }
  ensure(p.scene === 'settlement', 'Войдите в поселение');
  const state = w.states[s.state],
    ruler = state.ruler === p.person;
  if (c.type === 'train_soldier') {
    const soldier = w.people[c.person];
    ensure(a.members.includes(c.person) && soldier?.alive, 'Нужен живой боец вашего отряда');
    const old = soldier.unitClass ?? a.unitClass;
    ensure(old !== c.unitClass, 'Боец уже обучен');
    const price = c.unitClass === 'mages' ? 60 : c.unitClass === 'cavalry' ? 25 : 10;
    ensure(p.gold >= price, `Нужно ${price} монет`);
    if (c.unitClass === 'cavalry') ensure(p.inventory.horses >= 1, 'Нужна личная лошадь');
    if (c.unitClass === 'mages') {
      ensure(soldier.potential >= 4, 'Нужен редкий врождённый потенциал не ниже 4');
      ensure(
        s.residents.some((id) => w.people[id].alive && (w.npcs[id]?.skills?.magic ?? 0) >= 3),
        'Нужен живой учитель магии в поселении',
      );
      ensure(
        p.inventory.grain >= 3 && p.inventory.grain + a.food >= 3 * (a.members.length + 1),
        'Нужна еда на 3 дня обучения',
      );
    }
    p.gold -= price;
    s.treasury += price;
    if (old === 'cavalry') {
      a.mounts = Math.max(0, (a.mounts ?? 0) - 1);
      p.inventory.horses++;
    }
    if (c.unitClass === 'cavalry') {
      p.inventory.horses--;
      a.mounts = (a.mounts ?? 0) + 1;
    }
    soldier.unitClass = c.unitClass;
    if (c.unitClass === 'mages') {
      const npc = promote(w, soldier.id);
      npc.skills ??= {};
      npc.skills.magic = 1;
      for (let i = 0; i < 3 && hero.alive; i++) tickDay(w);
      w.speed = 0;
    }
  } else if (c.type === 'found_settlement') {
    ensure(
      ruler || w.regions[s.region].governor === p.person,
      'Основание требует полномочий державы или области',
    );
    ensure(
      s.treasury >= 300 && s.stocks.wood >= 100 && s.stocks.stone >= 50 && s.stocks.grain >= 100,
      'Нужно 300 монет, 100 дерева, 50 камня и 100 зерна поселения',
    );
    const position = [
      [s.x + 0.5, s.y],
      [s.x - 0.5, s.y],
      [s.x, s.y + 0.5],
      [s.x, s.y - 0.5],
    ].find(
      ([x, y]) =>
        x >= 0 && y >= 0 && x <= 29 && y <= 9 && !w.settlements.some((t) => t.x === x && t.y === y),
    );
    ensure(position, 'Нет свободного участка рядом с поселением');
    const settlers = s.residents
      .filter(
        (id) =>
          w.people[id].alive &&
          adult(w, w.people[id]) &&
          w.people[id].profession !== 'soldier' &&
          !w.states.some((st) => st.ruler === id) &&
          !w.regions.some((r) => r.governor === id),
      )
      .slice(0, 10);
    ensure(settlers.length === 10, 'Нужны 10 взрослых переселенцев');
    const id = w.settlements.length;
    s.treasury -= 300;
    s.stocks.wood -= 100;
    s.stocks.stone -= 50;
    s.stocks.grain -= 100;
    w.settlements.push({
      ...s,
      id,
      name: c.name,
      x: position[0],
      y: position[1],
      central: false,
      kind: 'village',
      essence: 0,
      essenceReserve: 0,
      residents: [],
      population: 0,
      workers: emptyWorkers(),
      stocks: { ...emptyStocks(), grain: 100 },
      prices: { ...BASE_PRICES },
      treasury: 100,
      infrastructure: 1,
      fortification: 0,
      shortageDays: 0,
      monsters: 0,
      loyalty: 60,
      occupation: null,
      governance: { steward: p.person, localTax: 0, unrestDays: 0, eligibleDay: 0 },
    });
    for (const id of settlers) {
      movePerson(w, w.people[id], w.settlements.length - 1);
      w.people[id].wealth += 20;
    }
    w.roads.push({ a: s.id, b: id, days: 2, blocked: false, traffic: 0 });
    event(
      w,
      'settlement_founded',
      `${p.name} основал ${c.name}; переселены 10 жителей ${s.name}.`,
      [`settlement:${id}`, `person:${p.person}`],
      true,
    );
  } else if (c.type === 'build_road') {
    const target = w.settlements[c.settlement];
    ensure(
      ruler || w.regions[s.region].governor === p.person,
      'Нужны полномочия области или державы',
    );
    ensure(
      target &&
        target.id !== s.id &&
        target.state === s.state &&
        Math.abs(target.x - s.x) + Math.abs(target.y - s.y) <= 2,
      'Нужно близкое поселение той же державы (до 2 клеток)',
    );
    ensure(
      !w.roads.some(
        (r) => (r.a === s.id && r.b === target.id) || (r.b === s.id && r.a === target.id),
      ),
      'Дорога уже существует',
    );
    ensure(s.stocks.stone >= 100 && s.stocks.wood >= 50, 'Нужно 100 камня и 50 дерева');
    s.stocks.stone -= 100;
    s.stocks.wood -= 50;
    w.roads.push({ a: s.id, b: target.id, days: 2, blocked: false, traffic: 0 });
    event(
      w,
      'road',
      `${s.name} соединён дорогой с ${target.name}.`,
      [`settlement:${s.id}`, `settlement:${target.id}`],
      true,
    );
  } else if (c.type === 'escort') {
    const caravan = w.caravans.find((v) => v.id === c.caravan);
    ensure(
      caravan?.status === 'traveling' && caravan.journey.route[caravan.journey.leg] === s.id,
      'Караван уже ушёл',
    );
    ensure(a.members.length >= 3, 'Нужны хотя бы 3 бойца');
    ensure(!p.escort, 'Вы уже сопровождаете караван');
    ensure(w.settlements[caravan.from].treasury >= 30, 'У отправителя нет 30 монет на охрану');
    ensure(
      caravan.journey.route.some((id) => w.settlements[id].monsters > 0),
      'На маршруте нет угроз: платная охрана не нужна',
    );
    w.settlements[caravan.from].treasury -= 30;
    p.escort = { caravan: caravan.id, reward: 30 };
    p.journey = { ...caravan.journey, route: [...caravan.journey.route] };
    p.scene = 'world';
    w.speed = 1;
    event(w, 'escort', `${p.name} сопровождает караван ${caravan.id}.`, [
      caravan.id,
      `person:${p.person}`,
    ]);
  } else if (c.type === 'seek_region') {
    ensure(hasCivilRights(state, hero), 'Закон державы ограничивает доступ к должности');
    const r = w.regions[s.region],
      towns = w.settlements.filter((t) => t.region === r.id);
    ensure(s.id === r.capital, 'Обратитесь в столице области');
    ensure(r.governor !== p.person, 'Вы уже управляете областью');
    ensure(
      towns.filter((t) => t.governance.steward === p.person && t.loyalty >= 50).length >=
        Math.ceil(towns.length / 2),
      'Нужны мандаты и лояльность 50 в половине поселений области',
    );
    r.governor = p.person;
    hero.state = state.id;
    a.state = state.id;
    p.title = `Правитель области ${r.name}`;
    p.legitimacy = Math.max(40, p.legitimacy);
    event(
      w,
      'regional_appointment',
      `${p.name} признан руководителем ${r.name}.`,
      [`person:${p.person}`, `state:${state.id}`],
      true,
    );
  } else if (c.type === 'seek_crown') {
    ensure(hasCivilRights(state, hero), 'Закон державы ограничивает доступ к должности');
    ensure(s.id === state.capital, 'Нужна столица державы');
    ensure(!ruler, 'Вы уже правитель');
    const regions = w.regions.filter((r) => r.state === state.id);
    const support = regions.filter((r) => r.governor === p.person).length;
    ensure(
      support >= Math.ceil(regions.length / 2),
      'Нужно признание в большинстве областей державы',
    );
    ensure(a.members.length >= 10 && p.legitimacy >= 40, 'Нужны 10 бойцов и легитимность 40');
    if (governments[state.government].hereditary) {
      ensure(
        state.legitimacy < 30 || !w.people[state.ruler]?.alive,
        'Действующая династия сохраняет признание (легитимность ≥ 30)',
      );
      crown(w, state, p.person, 'признание большинства областей при кризисе династии');
    } else succession(w, state, true);
  } else if (c.type === 'law' || c.type === 'reform') {
    ensure(ruler, 'Нужны полномочия правителя');
    if (c.type === 'law') {
      ensure(
        state.laws.inheritance !== c.inheritance || state.laws.tolerance !== c.tolerance,
        'Эти законы уже действуют',
      );
      state.laws.inheritance = c.inheritance;
      state.laws.tolerance = c.tolerance;
    } else {
      ensure(state.government !== c.government, 'Этот строй уже действует');
      state.government = c.government;
      state.electionDay = w.day + (governments[c.government].term || 720);
    }
    state.legitimacy = Math.max(0, state.legitimacy - 15);
    for (const t of w.settlements.filter((t) => t.state === state.id))
      t.loyalty = Math.max(0, t.loyalty - 5);
    event(
      w,
      'reform',
      `${state.name}: ${c.type === 'law' ? 'изменены законы наследования и веротерпимости' : governments[c.government].name}.`,
      [`state:${state.id}`, `person:${p.person}`],
      true,
    );
  } else if (c.type === 'diplomacy') {
    ensure(ruler, 'Дипломатия доступна правителю');
    const other = w.states[c.state];
    ensure(
      other && other.id !== state.id && other.capital >= 0,
      'Нужна другая действующая держава',
    );
    const war = w.wars.find(
      (v) =>
        v.active &&
        ((v.a === state.id && v.b === other.id) || (v.b === state.id && v.a === other.id)),
    );
    if (c.action === 'claim') {
      const border = w.roads.find(
        (r) =>
          (w.settlements[r.a].state === state.id && w.settlements[r.b].state === other.id) ||
          (w.settlements[r.b].state === state.id && w.settlements[r.a].state === other.id),
      );
      ensure(border, 'Нет общей границы');
      ensure(
        w.settlements.some((t) => t.state === state.id && t.shortageDays >= 10),
        'Претензии требуют затяжного дефицита (10 дней)',
      );
      const target = w.settlements[border.a].state === other.id ? border.a : border.b;
      ensure(!state.claims.includes(target), 'Претензия уже заявлена');
      state.claims.push(target);
    } else if (c.action === 'war') {
      ensure(
        overlord(w, state.id) === undefined && !sameRealm(w, state.id, other.id),
        'Вассальная клятва запрещает самостоятельную войну',
      );
      ensure(!war, 'Война уже идёт');
      ensure(
        !w.treaties.some(
          (t) =>
            t.until > w.day &&
            (t.type === 'peace' || t.type === 'alliance') &&
            ((t.a === state.id && t.b === other.id) || (t.b === state.id && t.a === other.id)),
        ),
        'Действует мир или союз',
      );
      const target = state.claims.find((id) => w.settlements[id]?.state === other.id);
      ensure(target !== undefined, 'Нужна подтверждённая территориальная претензия');
      w.wars.push({
        id: nextId(w, 'war'),
        a: state.id,
        b: other.id,
        target,
        reason: 'Территориальная претензия из-за дефицита',
        started: w.day,
        active: true,
        campaign: true,
      });
      state.relations[other.id] = -80;
      other.relations[state.id] = -80;
      honorGuarantees(w);
    } else if (c.action === 'peace') {
      ensure(war, 'Война не идёт');
      ensure(w.day - war.started >= 7, 'Переговоры возможны после 7 дней войны');
      war.active = false;
      for (const v of w.sieges.filter((v) => v.status === 'active')) {
        const attacker = w.armies.find((a) => a.id === v.attacker);
        if (
          attacker &&
          [state.id, other.id].includes(attacker.state) &&
          [state.id, other.id].includes(w.settlements[v.settlement].state)
        )
          endSiege(w, v, false);
      }
      state.relations[other.id] = 0;
      other.relations[state.id] = 0;
      w.treaties.push({
        id: nextId(w, 'treaty'),
        a: state.id,
        b: other.id,
        type: 'peace',
        until: w.day + 90,
      });
    } else {
      ensure(!war && (state.relations[other.id] ?? 0) >= 10, 'Нужны мир и отношения не ниже 10');
      ensure(
        !w.treaties.some(
          (t) =>
            t.type === c.action &&
            t.until > w.day &&
            ((t.a === state.id && t.b === other.id) || (t.b === state.id && t.a === other.id)),
        ),
        'Договор уже действует',
      );
      w.treaties.push({
        id: nextId(w, 'treaty'),
        a: state.id,
        b: other.id,
        type: c.action,
        until: w.day + 360,
      });
    }
    event(
      w,
      'diplomacy',
      `${state.name} — ${other.name}: ${c.action}.`,
      [`state:${state.id}`, `state:${other.id}`],
      true,
    );
  } else if (c.type === 'raise_army') {
    ensure(
      ruler || w.regions[s.region].governor === p.person,
      'Нужны полномочия области или державы',
    );
    ensure(
      s.treasury >= c.count * 10 && s.stocks.weapons >= c.count && s.stocks.grain >= c.count * 3,
      'Недостаточно казны, оружия или еды',
    );
    const candidates = s.residents.filter(
      (id) =>
        w.people[id].alive &&
        adult(w, w.people[id]) &&
        w.people[id].profession !== 'soldier' &&
        !w.states.some((st) => st.ruler === id) &&
        !w.regions.some((r) => r.governor === id),
    );
    ensure(candidates.length >= c.count, 'Не хватает взрослых работников');
    const army = levy(w, s.id, c.count);
    army.commander = p.person;
    s.treasury -= c.count * 10;
    for (const id of army.members) w.people[id].wealth += 10;
  } else if (c.type === 'march') {
    const army = w.armies.find((v) => v.id === c.army),
      target = w.settlements[c.settlement];
    ensure(
      army && !army.player && army.commander === p.person && army.members.length,
      'Нужна ваша действующая армия',
    );
    ensure(
      !army.journey && target && target.id !== army.settlement,
      'Армия уже идёт или цель недоступна',
    );
    ensure(
      !w.sieges.some(
        (v) => v.status === 'active' && (v.attacker === army.id || v.defender === army.id),
      ),
      'Армия занята осадой',
    );
    const path = militaryRoute(w, army.state, army.settlement, target.id);
    ensure(path.length > 1, 'Дорога закрыта');
    army.journey = makeJourney(w, path);
  } else if (c.type === 'fortify') {
    ensure(ruler || s.governance.steward === p.person, 'Нужны местные полномочия');
    ensure(
      s.fortification < 5 && s.stocks.stone >= 100 && s.stocks.wood >= 50 && s.treasury >= 200,
      'Нужно 100 камня, 50 дерева, 200 монет; максимум 5 укреплений',
    );
    s.stocks.stone -= 100;
    s.stocks.wood -= 50;
    s.treasury -= 200;
    s.fortification++;
    event(
      w,
      'fortification',
      `${s.name}: укрепления ${s.fortification}.`,
      [`settlement:${s.id}`],
      true,
    );
  } else if (c.type === 'buy_estate') {
    ensure(p.gold >= 400, 'Нужно 400 монет: 300 за владение, 100 в оборот');
    ensure(
      !w.estates.some((e) => e.settlement === s.id && e.kind === c.kind),
      'Такое хозяйство уже принадлежит владельцу',
    );
    ensure(c.kind !== 'mine' || s.biome === 'mountain', 'Железная шахта доступна в горах');
    const job = c.kind === 'farm' ? 'farmer' : c.kind === 'mine' ? 'miner' : 'smith';
    const workers = s.residents
      .filter(
        (id) =>
          w.people[id].alive &&
          w.people[id].profession === job &&
          !w.estates.some((e) => e.workers.includes(id)),
      )
      .slice(0, 3);
    ensure(workers.length, 'Нет работников нужной профессии');
    p.gold -= 400;
    s.treasury += 300;
    w.estates.push({
      id: nextId(w, 'estate'),
      settlement: s.id,
      owner: p.person,
      kind: c.kind,
      workers,
      stocks: emptyStocks(),
      treasury: 100,
    });
    event(
      w,
      'ownership',
      `${p.name} приобрёл хозяйство ${c.kind} в ${s.name}.`,
      [`person:${p.person}`, `settlement:${s.id}`],
      true,
    );
  } else if (c.type === 'estate') {
    const e = w.estates.find((e) => e.id === c.estate);
    ensure(
      e && e.owner === p.person && e.settlement === s.id,
      'Нужно своё хозяйство в этом поселении',
    );
    if (c.action === 'fund') {
      ensure(p.gold >= c.quantity, 'Недостаточно монет');
      p.gold -= c.quantity;
      e.treasury += c.quantity;
    } else if (c.action === 'withdraw') {
      ensure(e.treasury >= c.quantity, 'В кассе нет столько монет');
      e.treasury -= c.quantity;
      p.gold += c.quantity;
    } else {
      ensure(e.stocks[c.good] >= c.quantity, 'На складе нет столько товара');
      e.stocks[c.good] -= c.quantity;
      p.inventory[c.good] += c.quantity;
    }
  } else if (c.type === 'recognize_heir') {
    const other = w.people[c.person];
    ensure(
      other?.alive && other.settlement === s.id && other.id !== hero.id,
      'Нужен живой местный житель',
    );
    ensure(!p.heirs.includes(other.id), 'Наследник уже признан');
    ensure(
      w.npcs[other.id]?.relationships[p.person] >= 10,
      'Нужно доверие 10: общайтесь и помогайте жителю',
    );
    ensure(p.gold >= 50, 'Нужно 50 монет за оформление признания');
    p.gold -= 50;
    s.treasury += 50;
    const npc = promote(w, p.person);
    npc.recognizedHeirs ??= [];
    npc.recognizedHeirs.push(other.id);
    p.heirs.push(other.id);
    event(
      w,
      'recognition',
      `${p.name} признал наследником ${promote(w, other.id).name}.`,
      [`person:${p.person}`, `person:${other.id}`],
      true,
    );
  } else if (c.type === 'study') {
    ensure(hero.potential >= 1, 'Нет врождённого магического потенциала');
    ensure(s.central, 'Учителя находятся в областном городе');
    const teacher = s.residents.find(
      (id) =>
        id !== p.person &&
        w.people[id].alive &&
        adult(w, w.people[id]) &&
        (w.npcs[id]?.skills?.[c.school] ?? 0) >= 3,
    );
    ensure(teacher !== undefined, 'В этом городе сейчас нет живого учителя выбранной школы');
    ensure(
      p.gold >= 60 &&
        p.inventory.grain >= 3 &&
        p.inventory.grain + a.food >= 3 * (a.members.length + 1),
      'Нужно 60 монет и еда на 3 дня',
    );
    p.gold -= 60;
    w.people[teacher].wealth += 60;
    for (let i = 0; i < 3 && hero.alive; i++) tickDay(w);
    if (hero.alive) {
      p.skills[c.school] = (p.skills[c.school] ?? 0) + 1;
      p.skills.magic = (p.skills.magic ?? 0) + 1;
      hero.mana = Math.min(20 + hero.potential * 5, hero.mana + 10);
    }
    w.speed = 0;
  } else if (c.type === 'gift') {
    const other = w.people[c.person];
    ensure(
      other?.alive && other.id !== p.person && other.settlement === s.id && adult(w, other),
      'Нужен взрослый местный житель',
    );
    ensure(p.gold >= 20, 'Нужно 20 монет');
    const npc = promote(w, other.id),
      marker = `gift:${p.person}:${w.day}`;
    ensure(!npc.memory.includes(marker), 'Подарок за сегодня уже принят');
    p.gold -= 20;
    other.wealth += 20;
    npc.relationships[p.person] = Math.min(100, (npc.relationships[p.person] ?? 0) + 5);
    npc.memory.push(marker);
  } else if (c.type === 'faith') {
    ensure(
      w.religions.some((r) => r.id === c.religion),
      'Неизвестное верование',
    );
    ensure(hero.faith !== c.religion, 'Вы уже следуете этому пути');
    hero.faith = c.religion;
    event(
      w,
      'faith',
      `${p.name}: принят ${w.religions[c.religion].name}.`,
      [`person:${p.person}`],
      true,
    );
  }
  return true;
}
