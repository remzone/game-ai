import { z } from 'zod';
import { ExpansionSchemas, expansionCommand } from './expansion-commands.js';
import { officeTitle, revokeOffice } from './governance.js';
import { GOODS, RACES, emptyStocks, type World, type Ancestry } from './model.js';
import { addPerson, event, makeJourney, nextId, profession, promote, route } from './world.js';
import { adult, levy, quests, tickDay } from './systems.js';
import { finishBattle, startBattle } from './combat.js';
const id = z.number().int().nonnegative(),
  text = z.string().trim().min(1).max(80);
export const BiographySchema = z
  .object({
    name: z.string().trim().min(1).max(40),
    race: z.enum(RACES),
    sex: z.enum(['female', 'male']),
    birthplace: id,
    origin: z.enum(['peasants', 'merchants', 'nobles']),
    childhood: z.enum(['fields', 'books', 'streets']),
    youth: z.enum(['militia', 'caravan', 'temple']),
    training: z.enum(['warrior', 'trader', 'healer']),
    turningPoint: z.enum(['loss', 'inheritance', 'rescue']),
    reason: z.enum(['fortune', 'knowledge', 'duty']),
  })
  .strict();
export const CommandSchema = z.discriminatedUnion('type', [
  ...ExpansionSchemas,
  z.object({ type: z.literal('create_player'), biography: BiographySchema }).strict(),
  z
    .object({
      type: z.literal('speed'),
      value: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(5), z.literal(10)]),
    })
    .strict(),
  z.object({ type: z.literal('travel'), settlement: id }).strict(),
  z.object({ type: z.literal('enter') }).strict(),
  z.object({ type: z.literal('leave') }).strict(),
  z
    .object({
      type: z.literal('trade'),
      side: z.enum(['buy', 'sell']),
      good: z.enum(GOODS),
      quantity: z.number().int().min(1).max(500),
    })
    .strict(),
  z.object({ type: z.literal('recruit'), count: z.number().int().min(1).max(20) }).strict(),
  z.object({ type: z.literal('dismiss') }).strict(),
  z.object({ type: z.literal('talk'), person: id }).strict(),
  z.object({ type: z.literal('rest'), days: z.number().int().min(1).max(3) }).strict(),
  z.object({ type: z.literal('work'), job: z.enum(['farm', 'wood', 'smith']) }).strict(),
  z.object({ type: z.literal('supply'), quantity: z.number().int().min(1).max(500) }).strict(),
  z
    .object({
      type: z.literal('train'),
      unitClass: z.enum(['infantry', 'spearmen', 'archers', 'cavalry']),
    })
    .strict(),
  z
    .object({
      type: z.literal('battle_tactic'),
      tactic: z.enum(['attack', 'hold']),
      unitClass: z.enum(['all', 'infantry', 'spearmen', 'archers', 'cavalry', 'mages']),
    })
    .strict(),
  z.object({ type: z.literal('abandon_quest'), quest: text }).strict(),

  z.object({ type: z.literal('accept_quest'), quest: text }).strict(),
  z.object({ type: z.literal('complete_quest'), quest: text }).strict(),
  z.object({ type: z.literal('battle') }).strict(),
  z.object({ type: z.literal('retreat') }).strict(),
  z
    .object({
      type: z.literal('battle_order'),
      x: z.number().min(0).max(20),
      y: z.number().min(0).max(14),
      unitClass: z.enum(['all', 'infantry', 'spearmen', 'archers', 'cavalry', 'mages']),
    })
    .strict(),
  z.object({ type: z.literal('marry'), person: id }).strict(),
  z.object({ type: z.literal('inherit'), person: id }).strict(),
  z.object({ type: z.literal('petition') }).strict(),
  z.object({ type: z.literal('seek_office') }).strict(),
  z.object({ type: z.literal('resign_office') }).strict(),
  z.object({ type: z.literal('local_tax'), value: z.number().min(0).max(0.2) }).strict(),
  z.object({ type: z.literal('public_build') }).strict(),
  z.object({ type: z.literal('relief'), quantity: z.number().int().min(1).max(500) }).strict(),
  z.object({ type: z.literal('build') }).strict(),
  z.object({ type: z.literal('tax'), value: z.number().min(0).max(0.6) }).strict(),
]);
export type Command = z.infer<typeof CommandSchema>;
export function command(w: World, input: unknown): { ok: boolean; error?: string } {
  const parsed = CommandSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join('; ') };
  try {
    apply(w, parsed.data);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Команда отклонена' };
  }
}
function ensure(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
function apply(w: World, c: Command) {
  if (expansionCommand(w, c)) return;
  if (c.type === 'create_player') {
    ensure(!w.player, 'Персонаж уже создан');
    const b = c.biography,
      s = w.settlements[b.birthplace];
    ensure(s, 'Поселение не существует');
    const ancestry = RACES.map((r) => (r === b.race ? 1 : 0)) as Ancestry;
    const age = [22, 42, 40, 20, 32, 18][RACES.indexOf(b.race)];
    const mother = addPerson(w, s.id, age + 40, ancestry),
      father = addPerson(w, s.id, age + 45, ancestry);
    mother.sex = 'female';
    father.sex = 'male';
    mother.spouse = father.id;
    father.spouse = mother.id;
    const hero = addPerson(w, s.id, age, ancestry, [mother.id, father.id]);
    hero.sex = b.sex;
    const npc = promote(w, hero.id);
    npc.name = b.name;
    npc.biography = Object.values(b).join(' · ');
    hero.homeProfession = hero.profession;
    profession(w, hero, 'soldier');
    const army = {
      id: nextId(w, 'army'),
      state: s.state,
      settlement: s.id,
      members: [] as number[],
      unitClass: 'spearmen' as const,
      food: 0,
      morale: 100,
      player: true,
    };
    w.armies.push(army);
    w.player = {
      person: hero.id,
      name: b.name,
      gold: b.origin === 'merchants' ? 300 : 150,
      inventory: { ...emptyStocks(), grain: 30, weapons: b.training === 'warrior' ? 2 : 1 },
      skills: {
        melee: b.training === 'warrior' ? 5 : 1,
        trade: b.training === 'trader' ? 5 : 1,
        medicine: b.training === 'healer' ? 5 : 1,
        command: b.youth === 'militia' ? 3 : 1,
        diplomacy: b.origin === 'nobles' ? 3 : 1,
      },
      attributes: {
        strength: b.childhood === 'fields' ? 12 : 10,
        agility: b.childhood === 'streets' ? 12 : 10,
        endurance: 10,
        intelligence: b.childhood === 'books' ? 12 : 10,
        charisma: b.origin === 'nobles' ? 12 : 10,
        willpower: b.reason === 'duty' ? 12 : 10,
        magicalPotential: hero.potential,
      },
      reputation: { [`settlement:${s.id}`]: b.turningPoint === 'rescue' ? 10 : 0 },
      legitimacy: 0,
      title: 'Путешественник',
      army: army.id,
      biography: Object.fromEntries(Object.entries(b).map(([k, v]) => [k, String(v)])),
      visited: [s.id],
      scene: 'world',
      heirs: [],
      gameOver: false,
    };
    if (b.turningPoint === 'inheritance') w.player.gold += 80;
    event(w, 'hero', `${b.name} отправляется в путь.`, [`person:${hero.id}`], true);
    quests(w);
    return;
  }
  const p = w.player;
  if (c.type === 'speed') {
    ensure(!p || w.people[p.person].alive, 'Выберите наследника');
    w.speed = c.value;
    return;
  }
  ensure(p, 'Сначала создайте персонажа');
  const person = w.people[p.person];
  if (c.type === 'inherit') {
    ensure(!person.alive, 'Персонаж ещё жив');
    ensure(p.heirs.includes(c.person), 'Это не наследник');
    const heir = w.people[c.person];
    ensure(heir?.alive && adult(w, heir), 'Наследник должен быть живым и взрослым');
    const heirs = p.heirs
      .map((id) => w.people[id])
      .filter((q) => q?.alive)
      .sort((a, b) => a.born - b.born || a.id - b.id);
    const law = w.states[person.state]?.laws.inheritance ?? 'equal';
    const recipients = law === 'eldest' ? heirs.slice(0, 1) : heirs;
    const oldNpc = promote(w, person.id);
    oldNpc.skills = { ...p.skills };
    for (const recipient of recipients) {
      recipient.wealth += p.gold / recipients.length;
      const npc = promote(w, recipient.id);
      npc.possessions ??= emptyStocks();
      for (const g of GOODS) npc.possessions[g] += p.inventory[g] / recipients.length;
    }
    w.estates
      .filter((e) => e.owner === person.id)
      .forEach((e, i) => {
        e.owner = recipients[i % recipients.length].id;
      });
    const heirNpc = promote(w, heir.id);
    p.gold = heir.wealth;
    heir.wealth = 0;
    p.inventory = { ...(heirNpc.possessions ?? emptyStocks()) };
    heirNpc.possessions = emptyStocks();
    p.skills = {
      ...(heirNpc.skills ?? { melee: 1, trade: 1, medicine: 1, command: 1, diplomacy: 1 }),
    };
    p.attributes = {
      strength: 10,
      agility: 10,
      endurance: 10,
      intelligence: 10,
      charisma: 10,
      willpower: 10,
      magicalPotential: heir.potential,
    };
    p.person = heir.id;
    p.name = promote(w, heir.id).name;
    p.heirs = [...new Set([...heir.children, ...(heirNpc.recognizedHeirs ?? [])])];
    p.gameOver = false;
    const realm = w.states.find((s) => s.ruler === heir.id);
    p.title = realm ? `Правитель ${realm.name}` : 'Наследник';
    p.legitimacy *= 0.5;
    for (const key of Object.keys(p.reputation)) p.reputation[key] *= 0.3;
    p.scene = 'world';
    p.journey = undefined;
    w.battle = null;
    const old = w.armies.find((a) => a.id === p.army);
    if (old) {
      for (const id of old.members)
        profession(w, w.people[id], w.people[id].homeProfession ?? 'farmer');
      w.settlements[old.settlement].stocks.weapons += old.members.length;
      w.settlements[old.settlement].stocks.grain += old.food;
      w.settlements[old.settlement].stocks.horses += old.mounts ?? 0;
      old.food = 0;
      old.mounts = 0;
      old.members = [];
    }
    heir.homeProfession = heir.profession;
    profession(w, heir, 'soldier');
    if (old) {
      old.settlement = heir.settlement;
      old.state = heir.state;
    }
    event(w, 'inheritance', `${p.name} продолжает историю династии.`, [`person:${heir.id}`], true);
    return;
  }
  ensure(person.alive && !p.gameOver, 'Персонаж погиб. Выберите наследника.');
  const s = w.settlements[person.settlement],
    army = w.armies.find((a) => a.id === p.army)!;
  if (c.type === 'battle_tactic') {
    ensure(w.battle?.status === 'active', 'Бой не идёт');
    for (const f of w.battle.fighters)
      if (
        f.side === 'player' &&
        f.hp > 0 &&
        (c.unitClass === 'all' || f.unitClass === c.unitClass)
      ) {
        f.order = c.tactic;
        if (c.tactic === 'hold') {
          f.targetX = f.x;
          f.targetY = f.y;
        }
      }
    return;
  }
  if (c.type === 'battle_order') {
    ensure(w.battle?.status === 'active', 'Бой не идёт');
    for (const f of w.battle.fighters)
      if (f.side === 'player' && (c.unitClass === 'all' || c.unitClass === f.unitClass)) {
        f.order = 'move';
        f.targetX = c.x;
        f.targetY = c.y;
      }
    return;
  }
  if (c.type === 'retreat') {
    ensure(w.battle?.status === 'active', 'Бой не идёт');
    finishBattle(w, 'retreated');
    return;
  }
  ensure(w.battle?.status !== 'active', 'Сначала завершите бой');
  if (c.type === 'leave') {
    p.scene = 'world';
    w.battle = null;
    return;
  }
  ensure(!p.journey, 'Сначала завершите путешествие');
  if (c.type === 'travel') {
    ensure(w.settlements[c.settlement], 'Поселение не существует');
    ensure(c.settlement !== s.id, 'Вы уже здесь');
    const path = route(w, s.id, c.settlement);
    ensure(path.length > 1, 'Нет открытого маршрута');
    p.journey = makeJourney(w, path);
    p.scene = 'world';
    w.speed = 1;
    return;
  }
  if (c.type === 'enter') {
    ensure(
      !w.sieges.some((v) => v.status === 'active' && v.settlement === s.id),
      'Поселение в осаде: доступен штурм или снятие блокады',
    );
    p.scene = 'settlement';
    for (const id of s.residents.filter((id) => w.people[id].alive).slice(0, 12)) promote(w, id);
    return;
  }
  if (c.type === 'battle') {
    ensure(s.monsters > 0, 'В окрестностях нет угроз');
    startBattle(w);
    return;
  }
  ensure(p.scene === 'settlement', 'Войдите в поселение');
  if (c.type === 'talk') {
    const other = w.people[c.person];
    ensure(
      other?.alive && other.settlement === s.id && other.id !== person.id && adult(w, other),
      'Собеседник недоступен',
    );
    const npc = promote(w, other.id),
      memory = `Знакомство с ${p.name} (${person.id})`;
    if (!npc.memory.includes(memory)) {
      npc.memory.push(memory);
      event(w, 'meeting', `${p.name} познакомился с ${npc.name}.`, [
        `person:${other.id}`,
        `person:${person.id}`,
      ]);
    }
    return;
  }
  if (c.type === 'rest') {
    const cost = c.days * (5 + army.members.length);
    const food = c.days * (army.members.length + 1);
    ensure(p.gold >= cost, `Нужно ${cost} монет за постой`);
    ensure(
      p.inventory.grain + army.food >= food && p.inventory.grain >= c.days,
      'Купите зерно для героя и отряда',
    );
    p.gold -= cost;
    s.treasury += cost;
    for (let d = 0; d < c.days && person.alive; d++) {
      tickDay(w);
      for (const id of [person.id, ...army.members])
        if (w.people[id].alive)
          w.people[id].health = Math.min(100, w.people[id].health + 8 + (p.skills.medicine ?? 0));
    }
    w.speed = 0;
    event(w, 'rest', `${p.name}: отдых ${c.days} дн., постой ${cost} монет.`, [
      `person:${person.id}`,
    ]);
    return;
  }
  if (c.type === 'work') {
    const wages = c.job === 'smith' ? 16 : 10;
    ensure(s.treasury >= wages, 'В казне нет денег на оплату работы');
    ensure(person.health >= 20, 'Сначала восстановите здоровье');
    if (c.job === 'smith')
      ensure(s.stocks.iron >= 2 && s.stocks.wood >= 2, 'Кузнице нужны 2 железа и 2 дерева');
    s.treasury -= wages;
    p.gold += wages;
    if (c.job === 'smith') {
      s.stocks.iron -= 2;
      s.stocks.wood -= 2;
      s.stocks.tools += 1;
      p.skills.crafting = (p.skills.crafting ?? 0) + 0.2;
    } else s.stocks[c.job === 'farm' ? 'grain' : 'wood'] += c.job === 'farm' ? 12 : 4;
    tickDay(w);
    w.speed = 0;
    event(w, 'work', `${p.name} заработал ${wages} монет за день работы.`, [
      `person:${person.id}`,
      `settlement:${s.id}`,
    ]);
    return;
  }
  if (c.type === 'supply') {
    ensure(army.members.length > 0, 'Сначала наберите отряд');
    ensure(p.inventory.grain >= c.quantity, 'Недостаточно зерна в инвентаре');
    p.inventory.grain -= c.quantity;
    army.food += c.quantity;
    return;
  }
  if (c.type === 'train') {
    ensure(army.members.length > 0, 'Нет бойцов для обучения');
    ensure(
      army.members.some((id) => (w.people[id].unitClass ?? army.unitClass) !== c.unitClass),
      'Отряд уже обучен этому классу',
    );
    const cost = army.members.length * (c.unitClass === 'cavalry' ? 25 : 10);
    ensure(p.gold >= cost, `Нужно ${cost} монет на обучение`);
    if (c.unitClass === 'cavalry')
      ensure(
        p.inventory.horses + (army.mounts ?? 0) >= army.members.length,
        'Нужна одна лошадь из инвентаря на каждого бойца',
      );
    p.gold -= cost;
    s.treasury += cost;
    p.inventory.horses += army.mounts ?? 0;
    army.mounts = c.unitClass === 'cavalry' ? army.members.length : 0;
    p.inventory.horses -= army.mounts;
    army.unitClass = c.unitClass;
    for (const id of army.members) w.people[id].unitClass = undefined;
    event(w, 'training', `${p.name} переобучил отряд: ${c.unitClass}.`, [army.id]);
    return;
  }
  if (c.type === 'abandon_quest') {
    const q = w.quests.find((q) => q.id === c.quest);
    ensure(q?.status === 'accepted', 'Контракт не принят');
    ensure(!q.objectiveMet, 'Задание уже выполнено — получите награду');
    q.status = 'open';
    return;
  }
  if (c.type === 'trade') {
    const price = s.prices[c.good] * (c.side === 'sell' ? 0.8 : 1),
      total = price * c.quantity;
    if (c.side === 'buy') {
      ensure(s.stocks[c.good] >= c.quantity, 'На складе нет столько товара');
      ensure(p.gold >= total, 'Недостаточно монет');
      s.stocks[c.good] -= c.quantity;
      p.inventory[c.good] += c.quantity;
      p.gold -= total;
      s.treasury += total;
    } else {
      ensure(p.inventory[c.good] >= c.quantity, 'Недостаточно товара');
      ensure(s.treasury >= total, 'Рынок не может оплатить товар');
      p.inventory[c.good] -= c.quantity;
      s.stocks[c.good] += c.quantity;
      p.gold += total;
      s.treasury -= total;
    }
    p.skills.trade += 0.05;
    return;
  }
  if (c.type === 'recruit') {
    ensure(army.members.length + c.count <= 60, 'В отряде может быть до 60 солдат');
    ensure(p.gold >= c.count * 10, 'Нужно 10 монет за бойца');
    ensure(
      s.stocks.weapons >= c.count && s.stocks.grain >= c.count * 3,
      'В поселении не хватает оружия или еды',
    );
    const eligible = s.residents.filter((id) => {
      const q = w.people[id];
      return (
        q.alive &&
        adult(w, q) &&
        q.profession !== 'soldier' &&
        !w.states.some((st) => st.ruler === id) &&
        !w.regions.some((r) => r.governor === id)
      );
    });
    ensure(eligible.length >= c.count, 'Недостаточно взрослых жителей для набора');
    if (army.unitClass === 'cavalry')
      ensure(p.inventory.horses >= c.count, 'Нужны лошади для пополнения конницы');
    const recruits = levy(w, s.id, c.count, true);
    army.members.push(...recruits.members);
    if (army.unitClass === 'cavalry') {
      p.inventory.horses -= c.count;
      army.mounts = (army.mounts ?? 0) + c.count;
    }
    army.food += recruits.food;
    w.armies = w.armies.filter((a) => a !== recruits);
    p.gold -= c.count * 10;
    s.treasury += c.count * 10;
    event(
      w,
      'recruit',
      `${p.name} нанял ${c.count} жителей.`,
      army.members.map((id) => `person:${id}`),
    );
    return;
  }
  if (c.type === 'dismiss') {
    for (const id of army.members)
      profession(w, w.people[id], w.people[id].homeProfession ?? 'farmer');
    s.stocks.weapons += army.members.length;
    s.stocks.grain += army.food;
    p.inventory.horses += army.mounts ?? 0;
    army.mounts = 0;
    army.members = [];
    army.food = 0;
    return;
  }
  if (c.type === 'accept_quest' || c.type === 'complete_quest') {
    const q = w.quests.find((q) => q.id === c.quest);
    ensure(q && q.settlement === s.id, 'Контракт находится в другом поселении');
    if (c.type === 'accept_quest') {
      ensure(q.status === 'open', 'Контракт недоступен');
      q.status = 'accepted';
    } else {
      ensure(q.status === 'accepted', 'Сначала примите контракт');
      ensure(s.treasury >= q.reward, 'В казне пока недостаточно денег для награды');
      if (q.type === 'deliver') {
        ensure(p.inventory.grain >= q.need, 'Недостаточно зерна');
        p.inventory.grain -= q.need;
        s.stocks.grain += q.need;
      } else ensure(q.objectiveMet || s.monsters === 0, 'Угроза ещё не устранена');
      s.treasury -= q.reward;
      p.gold += q.reward;
      q.status = 'completed';
      p.reputation[`settlement:${s.id}`] = (p.reputation[`settlement:${s.id}`] ?? 0) + 20;
      event(
        w,
        'quest_completed',
        `${p.name} выполнил контракт ${q.id}.`,
        [q.id, `person:${p.person}`],
        true,
      );
    }
    return;
  }
  if (c.type === 'marry') {
    const spouse = w.people[c.person];
    ensure(
      spouse?.alive && spouse.settlement === s.id && adult(w, spouse),
      'Нужен взрослый житель этого поселения',
    );
    ensure(
      spouse.id !== person.id && person.spouse === undefined && spouse.spouse === undefined,
      'Брак недоступен',
    );
    ensure(
      !person.parents.includes(spouse.id) &&
        !person.children.includes(spouse.id) &&
        !person.parents.some((id) => spouse.parents.includes(id)),
      'Близкое родство',
    );
    person.spouse = spouse.id;
    spouse.spouse = person.id;
    promote(w, spouse.id);
    event(
      w,
      'marriage',
      `${p.name} и ${w.npcs[spouse.id].name} заключили брак.`,
      [`person:${person.id}`, `person:${spouse.id}`],
      true,
    );
    return;
  }
  if (c.type === 'seek_office') {
    ensure(s.governance.steward === null, 'В поселении уже есть управляющий');
    ensure(
      w.day >= s.governance.eligibleDay,
      `Совет рассмотрит назначение с дня ${s.governance.eligibleDay}`,
    );
    ensure((p.reputation[`settlement:${s.id}`] ?? 0) >= 60, 'Нужна местная репутация 60');
    ensure(
      w.npcs[p.person]?.titles.includes(`Защитник ${s.name}`),
      'Сначала получите признание защитником',
    );
    ensure(army.members.length >= 5, 'Нужен отряд из 5 бойцов');
    ensure(
      s.loyalty >= 50 && s.shortageDays < 3,
      'Совет требует лояльность 50 и прекращение затяжного голода',
    );
    s.governance.steward = p.person;
    s.governance.unrestDays = 0;
    p.title = officeTitle(s);
    p.legitimacy = Math.max(p.legitimacy, 30);
    const npc = promote(w, p.person);
    if (!npc.titles.includes(p.title)) npc.titles.push(p.title);
    event(
      w,
      'appointment',
      `${s.name}: совет назначил ${p.name} управляющим за службу поселению.`,
      [`settlement:${s.id}`, `person:${p.person}`],
      true,
    );
    return;
  }
  if (c.type === 'local_tax' || c.type === 'public_build' || c.type === 'resign_office') {
    ensure(
      s.governance.steward === p.person,
      'Нужен действующий мандат управляющего этого поселения',
    );
    if (c.type === 'resign_office') {
      revokeOffice(w, s, 'добровольная отставка');
    } else if (c.type === 'local_tax') {
      ensure(s.governance.localTax !== c.value, 'Этот сбор уже установлен');
      s.governance.localTax = c.value;
      event(
        w,
        'local_tax',
        `${s.name}: местный сбор установлен в ${Math.round(c.value * 100)}%.`,
        [`settlement:${s.id}`, `person:${p.person}`],
        true,
      );
    } else {
      ensure(s.infrastructure < 10, 'Хозяйство уже достигло предела развития');
      ensure(
        s.stocks.wood >= 100 && s.stocks.stone >= 50 && s.treasury >= 200,
        'В поселении нужно 100 дерева, 50 камня и 200 монет',
      );
      // Pay the actual adult civilian workforce, rather than the player's purse.
      const workers = s.residents
        .map((id) => w.people[id])
        .filter((q) => q.alive && adult(w, q) && q.profession !== 'soldier');
      ensure(workers.length > 0, 'В поселении нет работников');
      s.stocks.wood -= 100;
      s.stocks.stone -= 50;
      s.treasury -= 200;
      for (const worker of workers) worker.wealth += 200 / workers.length;
      s.infrastructure++;
      p.skills.governance = (p.skills.governance ?? 0) + 0.5;
      event(
        w,
        'public_construction',
        `${p.name}: общественное строительство в ${s.name}.`,
        [`settlement:${s.id}`, `person:${p.person}`],
        true,
      );
    }
    return;
  }
  if (c.type === 'relief') {
    ensure(p.inventory.grain >= c.quantity, 'Недостаточно личного зерна');
    const deficit = Math.max(0, s.population - s.workers.soldier - s.stocks.grain);
    p.inventory.grain -= c.quantity;
    s.stocks.grain += c.quantity;
    const help = Math.min(deficit, c.quantity) / Math.max(1, s.population - s.workers.soldier);
    s.loyalty = Math.min(100, s.loyalty + help * 5);
    p.reputation[`settlement:${s.id}`] = (p.reputation[`settlement:${s.id}`] ?? 0) + help * 5;
    event(w, 'relief', `${p.name} передал ${c.quantity} зерна поселению ${s.name}.`, [
      `settlement:${s.id}`,
      `person:${p.person}`,
    ]);
    return;
  }
  if (c.type === 'petition') {
    ensure((p.reputation[`settlement:${s.id}`] ?? 0) >= 40, 'Нужна репутация 40 в этом поселении');
    ensure(army.members.length >= 5, 'Нужен отряд из 5 бойцов');
    const title = `Защитник ${s.name}`;
    if (!w.settlements.some((t) => t.governance.steward === p.person)) p.title = title;
    p.legitimacy = Math.max(p.legitimacy, 20);
    const npc = promote(w, p.person);
    if (!npc.titles.includes(title)) npc.titles.push(title);
    return;
  }
  if (c.type === 'build') {
    ensure(s.infrastructure < 10, 'Хозяйство уже достигло предела развития');
    ensure(
      p.inventory.wood >= 20 && p.inventory.stone >= 20 && p.gold >= 50,
      'Нужно 20 дерева, 20 камня и 50 монет',
    );
    p.inventory.wood -= 20;
    p.inventory.stone -= 20;
    p.gold -= 50;
    s.treasury += 50;
    s.infrastructure++;
    p.reputation[`settlement:${s.id}`] = (p.reputation[`settlement:${s.id}`] ?? 0) + 10;
    event(
      w,
      'construction',
      `${p.name} улучшил хозяйство ${s.name}.`,
      [`settlement:${s.id}`, `person:${p.person}`],
      true,
    );
    return;
  }
  if (c.type === 'tax') {
    const state = w.states[s.state];
    ensure(state.ruler === p.person, 'Налоги меняет только правитель');
    state.tax = c.value;
    return;
  }
}
