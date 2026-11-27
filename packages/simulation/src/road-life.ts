import {
  GOODS,
  BASE_PRICES,
  emptyStocks,
  type Army,
  type Caravan,
  type Good,
  type Journey,
  type Person,
  type Settlement,
  type Stocks,
  type World,
} from './model.js';
import { adult, levy } from './systems.js';
import {
  advanceJourney,
  event,
  makeJourney,
  movePerson,
  nextId,
  profession,
  promote,
} from './world.js';
import { mapProjection } from './map-knowledge.js';

type Itinerary = { home: number; journey?: Journey; depart: number };
type Peddler = Itinerary & { person: number; goods: Stocks; stop: number; circuit: number[] };
type Band = Itinerary & { id: string; members: number[]; loot: Stocks; name: string };
export interface RoadLife {
  peddlers: Peddler[];
  bands: Band[];
}
export type RoadActor = {
  id: string;
  kind: 'army' | 'band' | 'caravan' | 'merchant';
  name: string;
  at: number;
  toward?: number;
  fraction: number;
  destination?: number;
  state?: number;
  commander?: string;
  person?: number;
  count?: number;
  patrol?: boolean;
  canEscort?: boolean;
  freight?: { good: Good; amount: number };
  offers?: { good: Good; amount: number; price: number }[];
};

const localTraders = ['grain', 'tools', 'wood', 'iron'] as const;
const protectedPerson = (w: World, id: number) =>
  id === w.player?.person ||
  w.states.some((s) => s.ruler === id) ||
  w.regions.some((r) => r.governor === id) ||
  w.settlements[w.people[id].settlement].governance.steward === id;
const besieged = (w: World, id: number) =>
  w.sieges.some((s) => s.status === 'active' && s.settlement === id);
function options(w: World, id: number) {
  return w.roads.flatMap((r) =>
    r.blocked
      ? []
      : r.a === id
        ? [{ id: r.b, days: r.days }]
        : r.b === id
          ? [{ id: r.a, days: r.days }]
          : [],
  );
}
function priceFor(s: Settlement, good: Good) {
  return Math.max(1, Math.ceil(s.prices[good] * 1.12));
}
function resupply(w: World, trader: Peddler) {
  const person = w.people[trader.person],
    place = w.settlements[person.settlement];
  for (const good of localTraders) {
    const price = Math.max(1, Math.ceil(place.prices[good]));
    const reserve = good === 'grain' ? place.population * 3 : 2;
    const lot = Math.floor(
      Math.min(
        Math.max(0, place.stocks[good] - reserve),
        person.wealth / price,
        (good === 'grain' ? 20 : 7) - trader.goods[good],
      ),
    );
    if (lot <= 0) continue;
    place.stocks[good] -= lot;
    trader.goods[good] += lot;
    person.wealth -= lot * price;
    place.treasury += lot * price;
  }
}

// New organic games (and old organic saves on their first next day) get real
// road crews from existing residents, never decorative actors or extra people.
export function initializeRoadLife(w: World) {
  if (!w.geography || !w.player || w.roadLife) return;
  const life: RoadLife = { peddlers: [], bands: [] };
  w.roadLife = life;
  const here = w.people[w.player.person].settlement;
  const visible = new Set(mapProjection(w)?.visible);
  for (const state of w.states) {
    if (state.capital < 0) continue;
    const home = w.settlements[state.capital];
    const market = w.settlements[here].state === state.id ? w.settlements[here] : home;
    const link = options(w, market.id)
      .filter((r) => w.settlements[r.id].state === state.id && w.settlements[r.id].population)
      .sort(
        (a, b) =>
          Number(w.settlements[b.id].central) - Number(w.settlements[a.id].central) ||
          b.days - a.days ||
          a.id - b.id,
      )[0];
    const trader = market.residents
      .map((id) => w.people[id])
      .filter(
        (p) => p.alive && adult(w, p) && p.profession === 'merchant' && !protectedPerson(w, p.id),
      )
      .sort((a, b) => b.wealth - a.wealth || a.id - b.id)[0];
    if (trader && link) {
      const entry: Peddler = {
        person: trader.id,
        home: market.id,
        circuit: [market.id, link.id],
        stop: 0,
        depart: w.day + 1,
        goods: emptyStocks(),
      };
      promote(w, trader.id);
      resupply(w, entry);
      life.peddlers.push(entry);
    }
    const camp = w.settlements
      .filter(
        (s) =>
          s.state === state.id &&
          !s.central &&
          s.id !== market.id &&
          s.kind !== 'ruins' &&
          (s.biome === 'forest' || s.biome === 'marsh') &&
          s.stocks.weapons >= 3 &&
          options(w, s.id).some((r) => w.settlements[r.id].state === state.id),
      )
      .sort(
        (a, b) =>
          Number(visible.has(b.id)) - Number(visible.has(a.id)) ||
          a.loyalty - b.loyalty ||
          a.id - b.id,
      )[0];
    if (camp) {
      const members = camp.residents
        .map((id) => w.people[id])
        .filter(
          (p) =>
            p.alive &&
            adult(w, p) &&
            (p.profession === 'woodcutter' || p.profession === 'miner') &&
            !protectedPerson(w, p.id),
        )
        .slice(0, 3);
      if (members.length >= 2) {
        const loot = emptyStocks();
        loot.grain = Math.min(camp.stocks.grain, members.length * 10);
        camp.stocks.grain -= loot.grain;
        camp.stocks.weapons -= members.length;
        for (const person of members) {
          person.homeProfession = person.profession;
          profession(w, person, 'soldier');
        }
        const id = nextId(w, 'band');
        life.bands.push({
          id,
          name: `Лихие из ${camp.name}`,
          home: camp.id,
          members: members.map((p) => p.id),
          loot,
          depart: w.day + 1,
        });
      }
    }
    // A locally supplied peacetime patrol is separate from the campaign force.
    // Do not create a second patrol when this function upgrades an old save.
    const outpost = options(w, home.id).some(
      (r) => w.settlements[r.id].state === state.id && w.settlements[r.id].population,
    );
    if (
      outpost &&
      home.treasury >= 40 &&
      home.stocks.grain > home.population * 3 + 36 &&
      home.stocks.weapons >= 4 &&
      !w.armies.some((a) => a.state === state.id && !a.player && a.members.length)
    ) {
      const patrol = levy(w, home.id, 4);
      if (patrol.members.length) {
        patrol.patrolHome = home.id;
        home.treasury -= patrol.members.length * 10;
        for (const id of patrol.members) w.people[id].wealth += 10;
        nameCommander(w, patrol);
      }
    }
  }
}

export function nameCommander(w: World, army: Army) {
  if (army.player || (army.commander === w.player?.person && army.commander !== undefined)) return;
  if (
    army.commander !== undefined &&
    w.people[army.commander]?.alive &&
    army.members.includes(army.commander)
  )
    return;
  army.commander = [...army.members]
    .filter((id) => w.people[id].alive && !w.people[id].undead)
    .sort((a, b) => w.people[b].experience - w.people[a].experience || a - b)[0];
  if (army.commander !== undefined) promote(w, army.commander);
}

export function roadLifeDay(w: World) {
  const life = w.roadLife;
  if (!life) return;
  for (const a of w.armies) {
    nameCommander(w, a);
    if (
      a.patrolHome === undefined ||
      !a.members.length ||
      a.journey ||
      w.day % 3 !== 0 ||
      w.sieges.some((s) => s.status === 'active' && (s.attacker === a.id || s.defender === a.id))
    )
      continue;
    const place = w.settlements[a.settlement];
    if (place.state !== a.state || besieged(w, place.id) || place.shortageDays) continue;
    const ends = options(w, place.id).filter(
      (r) =>
        w.settlements[r.id].state === a.state &&
        w.settlements[r.id].population &&
        !besieged(w, r.id),
    );
    const leg =
      place.id === a.patrolHome
        ? ends.sort((a, b) => b.days - a.days || a.id - b.id)[
            Math.floor(w.day / 3) % Math.max(1, ends.length)
          ]
        : ends.find((r) => r.id === a.patrolHome);
    if (!leg) continue;
    const needed = Math.max(0, (leg.days + 2) * a.members.length - a.food);
    if (place.stocks.grain - place.population * 2 < needed) continue;
    place.stocks.grain -= needed;
    a.food += needed;
    a.journey = makeJourney(w, [place.id, leg.id]);
  }
  for (const trader of life.peddlers) {
    const person = w.people[trader.person];
    if (!traderActive(w, trader)) {
      trader.journey = undefined;
      continue;
    }
    if (trader.journey) {
      const result = advanceJourney(w, trader.journey);
      movePerson(w, person, trader.journey.route[trader.journey.leg]);
      if (result !== 'moving') {
        trader.journey = undefined;
        trader.depart = w.day + 2;
        trader.stop = trader.circuit.indexOf(person.settlement);
        if (result === 'arrived' && person.settlement === trader.home) resupply(w, trader);
      }
    } else if (w.day >= trader.depart && !besieged(w, person.settlement)) {
      const to = trader.circuit[trader.stop === 0 ? 1 : 0];
      if (
        !besieged(w, to) &&
        options(w, person.settlement).some((r) => r.id === to) &&
        w.settlements[to].population
      )
        trader.journey = makeJourney(w, [person.settlement, to]);
    }
  }
  for (const band of life.bands) {
    band.members = band.members.filter(
      (id) =>
        w.people[id]?.alive && w.people[id].profession === 'soldier' && !protectedPerson(w, id),
    );
    if (!band.members.length) continue;
    const here = w.people[band.members[0]].settlement;
    const need = band.members.length;
    if (
      band.loot.grain < need &&
      w.settlements[here].fortification < 2 &&
      !besieged(w, here) &&
      !w.armies.some((a) => a.settlement === here && !a.journey && a.members.length >= need)
    ) {
      const captured = Math.min(need * 2, Math.floor(w.settlements[here].stocks.grain));
      if (captured > 0) {
        w.settlements[here].stocks.grain -= captured;
        band.loot.grain += captured;
        event(w, 'bandit_raid', `${band.name}: украдено зерно у ${w.settlements[here].name}.`, [
          band.id,
          `settlement:${here}`,
        ]);
      }
    }
    if (band.loot.grain < need && w.day % 7 === 0) {
      const id = band.members.pop()!;
      profession(w, w.people[id], w.people[id].homeProfession ?? 'farmer');
      if (!band.members.length) {
        for (const good of GOODS) w.settlements[here].stocks[good] += band.loot[good];
        band.loot = emptyStocks();
        continue;
      }
    }
    band.loot.grain = Math.max(0, band.loot.grain - band.members.length);
    if (band.journey) {
      const result = advanceJourney(w, band.journey);
      for (const id of band.members)
        movePerson(w, w.people[id], band.journey.route[band.journey.leg]);
      if (result !== 'moving') {
        band.journey = undefined;
        band.depart = w.day + 1;
      }
    } else if (w.day >= band.depart) {
      const roads = options(w, here).filter(
        (r) =>
          w.settlements[r.id].state === w.settlements[band.home].state &&
          !besieged(w, r.id) &&
          w.settlements[r.id].fortification < 2,
      );
      const leg =
        roads.find((r) => r.id === band.home) ??
        roads
          .map((r) => ({
            ...r,
            cargo: w.caravans.some(
              (c) => c.status === 'traveling' && sameLeg(c.journey, here, r.id),
            ),
          }))
          .sort(
            (a, b) =>
              Number(b.cargo) - Number(a.cargo) ||
              w.settlements[a.id].loyalty - w.settlements[b.id].loyalty ||
              a.id - b.id,
          )[0];
      if (leg) band.journey = makeJourney(w, [here, leg.id]);
    }
  }
}

const sameLeg = (j: Journey, a: number, b: number) =>
  (j.route[j.leg] === a && j.route[j.leg + 1] === b) ||
  (j.route[j.leg] === b && j.route[j.leg + 1] === a);

export function caravanStop(w: World, c: Caravan) {
  const j = c.journey;
  return (
    c.status === 'traveling' &&
    options(w, j.route[j.leg]).some((r) => r.id === j.route[j.leg + 1] && j.remaining === r.days)
  );
}

export function riskyCaravan(w: World, c: Caravan) {
  const ahead = c.journey.route.slice(c.journey.leg);
  return (
    ahead.some((id) => w.settlements[id].monsters > 0) ||
    !!w.roadLife?.bands.some(
      (b) =>
        b.members.some((id) => w.people[id]?.alive) &&
        (ahead.includes(b.home) ||
          (b.journey && ahead.some((id, i) => sameLeg(b.journey!, id, ahead[i + 1])))),
    )
  );
}

// Both parties spend a day on the same road. Opposite-direction parties
// cross only when their actual day intervals overlap; a nearby marker alone
// does not let one group raid or shield a distant traveler.
function pathIntersects(a: Journey, b: Journey, days: number) {
  if (b.route[b.leg] === a.route[a.leg]) return a.remaining === b.remaining;
  const gap = b.remaining - (days - a.remaining);
  return gap >= 0 && gap <= 2;
}

export function raidCaravan(w: World, c: Caravan, guards: number) {
  const here = c.journey.route[c.journey.leg],
    next = c.journey.route[c.journey.leg + 1];
  if (!w.roadLife || c.amount < 3 || next === undefined) return;
  const edge = options(w, here).find((r) => r.id === next);
  if (!edge) return;
  const band = w.roadLife.bands.find(
    (b) =>
      b.journey &&
      sameLeg(b.journey, here, next) &&
      pathIntersects(c.journey, b.journey, edge.days) &&
      !c.raidedBy?.includes(b.id) &&
      b.members.some((id) => w.people[id].alive),
  );
  if (!band) return;
  const strength = band.members.filter((id) => w.people[id].alive).length;
  const patrol = w.armies.some(
    (a) =>
      !a.player &&
      a.patrolHome !== undefined &&
      a.journey &&
      sameLeg(a.journey, here, next) &&
      pathIntersects(c.journey, a.journey, edge.days) &&
      a.members.filter((id) => w.people[id].alive).length >= strength,
  );
  if (guards >= strength || patrol) return;
  const taken = Math.max(1, Math.floor(c.amount / 3));
  c.amount -= taken;
  band.loot[c.good] += taken;
  (c.raidedBy ??= []).push(band.id);
  event(
    w,
    'bandit_raid',
    `${band.name} ограбили караван на дороге у ${w.settlements[here].name}.`,
    [band.id, c.id, `settlement:${here}`],
    true,
  );
}

const traderActive = (w: World, t: Peddler) =>
  !!w.people[t.person]?.alive &&
  w.people[t.person].profession === 'merchant' &&
  !protectedPerson(w, t.person);

export function buyRoadGoods(w: World, id: number, good: Good, quantity: number) {
  const p = w.player!,
    trader = w.roadLife?.peddlers.find((t) => t.person === id),
    seller = w.people[id];
  const here = w.people[p.person].settlement;
  if (
    !trader ||
    !traderActive(w, trader) ||
    trader.journey ||
    seller.settlement !== here ||
    besieged(w, here)
  )
    throw new Error('Торговец сейчас недоступен. Встретьте его на стоянке.');
  const cost = priceFor(w.settlements[here], good) * quantity;
  if (trader.goods[good] < quantity || p.gold < cost)
    throw new Error('Нужны деньги и товар в наличии');
  trader.goods[good] -= quantity;
  seller.wealth += cost;
  p.inventory[good] += quantity;
  p.gold -= cost;
  event(w, 'road_trade', `${p.name} закупает припасы у ${w.npcs[id].name}.`, [
    `person:${id}`,
    `settlement:${here}`,
  ]);
}

export function roadActorProjection(w: World, map = mapProjection(w)): RoadActor[] {
  if (!w.player) return [];
  const visible = new Set(map?.visible),
    known = new Set(map?.known);
  const actors: RoadActor[] = [];
  function put(actor: Omit<RoadActor, 'fraction'>, journey?: Journey) {
    if (map && !visible.has(actor.at)) return;
    const next = journey?.route[journey.leg + 1];
    const dest = journey?.route.at(-1);
    if (journey && next !== undefined && (!map || visible.has(next))) {
      const edge = options(w, actor.at).find((r) => r.id === next);
      if (edge && journey.remaining < edge.days) {
        actor.toward = next;
        if (dest !== undefined && (!map || known.has(dest))) actor.destination = dest;
      }
      actors.push({
        ...actor,
        fraction: edge ? Math.min(1, Math.max(0, 1 - journey.remaining / edge.days)) : 0,
      });
    } else if (
      !journey ||
      journey.remaining === options(w, actor.at).find((r) => r.id === next)?.days
    )
      actors.push({ ...actor, fraction: 0 });
  }
  for (const a of w.armies) {
    const live = a.members.filter((id) => w.people[id]?.alive);
    if (a.player || !live.length) continue;
    const person =
      a.commander !== undefined &&
      w.people[a.commander]?.alive &&
      (a.commander === w.player.person || live.includes(a.commander))
        ? a.commander
        : live[0];
    put(
      {
        id: a.id,
        kind: 'army',
        at: a.settlement,
        name: a.patrolHome === undefined ? 'Полевая армия' : 'Дорожный дозор',
        state: a.state,
        count: live.length,
        patrol: a.patrolHome !== undefined,
        commander: w.npcs[person]?.name ?? 'Полевой командир',
        person,
      },
      a.journey,
    );
  }
  const p = w.player,
    hero = w.people[p.person];
  const followers =
    w.armies.find((a) => a.id === p.army)?.members.filter((id) => w.people[id]?.alive).length ?? 0;
  for (const c of w.caravans) {
    if (c.status !== 'traveling') continue;
    const at = c.journey.route[c.journey.leg];
    const canEscort =
      hero.alive &&
      hero.settlement === at &&
      !p.journey &&
      !p.escort &&
      p.scene !== 'battle' &&
      followers >= 3 &&
      w.settlements[c.from].treasury >= 30 &&
      caravanStop(w, c) &&
      riskyCaravan(w, c);
    put(
      {
        id: c.id,
        kind: 'caravan',
        at,
        name: 'Торговый караван',
        freight: { good: c.good, amount: c.amount },
        canEscort,
      },
      c.journey,
    );
  }
  for (const b of w.roadLife?.bands ?? []) {
    const members = b.members.filter((id) => w.people[id]?.alive);
    if (members.length)
      put(
        {
          id: b.id,
          kind: 'band',
          at: w.people[members[0]].settlement,
          name: b.name,
          count: members.length,
        },
        b.journey,
      );
  }
  for (const t of w.roadLife?.peddlers ?? []) {
    if (!traderActive(w, t)) continue;
    const person = w.people[t.person],
      at = person.settlement;
    put(
      {
        id: `merchant:${t.person}`,
        kind: 'merchant',
        name: w.npcs[t.person].name,
        person: t.person,
        at,
        offers:
          !t.journey && !besieged(w, at) && w.people[w.player.person].settlement === at
            ? GOODS.filter((good) => t.goods[good] >= 1).map((good) => ({
                good,
                amount: Math.floor(t.goods[good]),
                price: priceFor(w.settlements[at], good),
              }))
            : undefined,
      },
      t.journey,
    );
  }
  return actors;
}
