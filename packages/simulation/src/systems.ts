import {
  BASE_PRICES,
  GOODS,
  type World,
  type Person,
  type Settlement,
  type Army,
} from './model.js';
import { random, pick, integer } from './rng.js';
import {
  addPerson,
  advanceJourney,
  blended,
  death,
  event,
  makeJourney,
  movePerson,
  nextId,
  profession,
  promote,
  route,
} from './world.js';
export function economy(w: World) {
  const harvest = [1, 1.2, 1.6, 0.35][Math.floor((w.day % 360) / 90)];
  for (const s of w.settlements) {
    const fertility = { plains: 3.5, forest: 2.7, mountain: 1, marsh: 2.3 }[s.biome];
    const production = s.workers.farmer * fertility * harvest * (1 + s.infrastructure * 0.05);
    s.stocks.grain += production;
    s.stocks.wood += s.workers.woodcutter * (s.biome === 'forest' ? 1.5 : 0.1);
    s.stocks.stone += s.workers.miner * (s.biome === 'mountain' ? 0.8 : 0.1);
    s.stocks.iron += s.workers.miner * (s.biome === 'mountain' ? 0.4 : 0);
    const forged = Math.min(s.workers.smith * 0.3, s.stocks.iron, s.stocks.wood / 2);
    s.stocks.iron -= forged;
    s.stocks.wood -= forged * 2;
    s.stocks.tools += forged * 0.6;
    s.stocks.weapons += forged * 0.4;
    const needed = s.population - s.workers.soldier,
      consumed = Math.min(s.stocks.grain, needed);
    s.stocks.grain -= consumed;
    if (consumed < needed) {
      s.shortageDays++;
      s.loyalty = Math.max(0, s.loyalty - 0.8);
      if (s.shortageDays === 3)
        event(w, 'shortage', `${s.name}: запасы еды исчерпаны.`, [`settlement:${s.id}`], true);
    } else {
      s.shortageDays = Math.max(0, s.shortageDays - 1);
      s.loyalty = Math.min(100, s.loyalty + 0.1);
    }
    const state = w.states[s.state],
      tax = production * BASE_PRICES.grain * state.tax;
    s.treasury += tax * 0.35;
    w.regions[s.region].treasury += tax * 0.3;
    state.treasury += tax * 0.35;
    s.loyalty = Math.max(0, s.loyalty - Math.max(0, state.tax - 0.2) * 2);
    for (const good of GOODS) {
      const desired =
        good === 'grain' ? Math.max(1, s.population * 7) : Math.max(5, s.population * 0.4);
      s.prices[good] =
        Math.round(
          BASE_PRICES[good] *
            Math.max(0.3, Math.min(6, desired / Math.max(1, s.stocks[good]))) *
            100,
        ) / 100;
    }
    if (w.day % 30 === 0) {
      const old = s.kind;
      s.kind =
        s.population === 0
          ? 'ruins'
          : s.shortageDays > 20
            ? 'village'
            : s.population > 500
              ? 'city'
              : s.population > 180
                ? 'town'
                : s.central
                  ? 'city'
                  : 'village';
      if (old !== s.kind)
        event(
          w,
          'settlement_change',
          `${s.name}: ${old} → ${s.kind}`,
          [`settlement:${s.id}`],
          true,
        );
      if (s.stocks.wood > 200 && s.stocks.stone > 100 && s.loyalty > 60 && s.infrastructure < 10) {
        s.stocks.wood -= 100;
        s.stocks.stone -= 50;
        s.infrastructure++;
        event(w, 'construction', `${s.name} расширяет хозяйство.`, [`settlement:${s.id}`]);
      }
    }
  }
}
export function logistics(w: World) {
  for (const c of w.caravans) {
    if (c.status !== 'traveling') continue;
    const j = c.journey,
      current = w.settlements[j.route[j.leg]];
    if (current.monsters > 0 && random(w) < Math.min(0.3, current.monsters * 0.008)) {
      c.status = 'lost';
      event(
        w,
        'caravan_lost',
        `Караван ${c.id} потерял ${Math.round(c.amount)} ед. ${c.good} у ${current.name}.`,
        [`settlement:${current.id}`, c.id],
        true,
      );
      continue;
    }
    if (advanceJourney(w, j) === 'arrived') {
      w.settlements[c.to].stocks[c.good] += c.amount;
      c.status = 'delivered';
      event(
        w,
        'caravan_delivered',
        `${w.settlements[c.to].name}: доставлено ${Math.round(c.amount)} ед. ${c.good}.`,
        [c.id, `settlement:${c.to}`],
      );
    }
  }
  if (w.day % 3 !== 0) return;
  let budget = 20;
  for (const to of w.settlements) {
    if (!budget) break;
    if (
      to.stocks.grain >= to.population * 4 ||
      to.population === 0 ||
      w.caravans.some((c) => c.status === 'traveling' && c.to === to.id)
    )
      continue;
    const donors = w.settlements
      .filter((s) => s.id !== to.id && s.stocks.grain > s.population * 10)
      .sort(
        (a, b) =>
          Math.abs(a.x - to.x) +
          Math.abs(a.y - to.y) -
          (Math.abs(b.x - to.x) + Math.abs(b.y - to.y)),
      );
    for (const from of donors.slice(0, 6)) {
      const path = route(w, from.id, to.id);
      if (path.length < 2) continue;
      const amount = Math.floor(
        Math.min(
          from.stocks.grain - from.population * 8,
          to.population * 8,
          to.treasury / from.prices.grain,
        ),
      );
      if (amount < 1) continue;
      const paid = amount * from.prices.grain;
      from.stocks.grain -= amount;
      to.treasury -= paid;
      from.treasury += paid;
      w.caravans.push({
        id: nextId(w, 'caravan'),
        from: from.id,
        to: to.id,
        good: 'grain',
        amount,
        paid,
        journey: makeJourney(w, path),
        status: 'traveling',
      });
      budget--;
      break;
    }
  }
  for (const road of w.roads)
    if (road.traffic > 30 && road.days > 1) {
      const a = w.settlements[road.a];
      if (a.stocks.stone >= 10 && a.stocks.wood >= 10) {
        a.stocks.stone -= 10;
        a.stocks.wood -= 10;
        road.days--;
        road.traffic = 0;
        event(w, 'road', `Торговая дорога у ${a.name} улучшена.`, [`settlement:${a.id}`]);
      }
    }
}
export function adult(w: World, p: Person) {
  return (
    (w.day - p.born) / 360 >= p.ancestry.reduce((v, a, i) => v + a * [18, 35, 32, 16, 25, 12][i], 0)
  );
}
export function demography(w: World) {
  const populationAtStart = w.people.length;
  // Each identity is processed once per 30 game days, in a stable deterministic bucket.
  for (let id = w.day % 30; id < populationAtStart; id += 30) {
    const p = w.people[id];
    if (!p.alive) continue;
    const s = w.settlements[p.settlement],
      age = (w.day - p.born) / 360,
      lifespan = p.ancestry.reduce((v, a, i) => v + a * [80, 260, 220, 65, 160, 50][i], 0);
    if (p.profession === 'child' && adult(w, p))
      profession(
        w,
        p,
        pick(w, ['farmer', 'farmer', 'woodcutter', 'miner', 'smith', 'merchant'] as const),
      );
    p.health = Math.min(100, p.health + 4 - Math.min(60, s.shortageDays * 2));
    if (p.health <= 0 || (age > lifespan * 0.8 && random(w) < (age / lifespan - 0.8) * 0.04)) {
      death(w, p, p.health <= 0 ? 'голод' : 'старость');
      continue;
    }
    if (
      p.sex === 'female' &&
      adult(w, p) &&
      age < lifespan * 0.6 &&
      (p.profession !== 'soldier' || p.id === w.player?.person) &&
      s.shortageDays === 0 &&
      (!p.lastBirth || w.day - p.lastBirth > 360) &&
      random(w) < 0.035
    ) {
      const father =
        p.spouse !== undefined
          ? w.people[p.spouse]
          : s.residents
              .map((i) => w.people[i])
              .find(
                (other) =>
                  other.alive &&
                  other.id !== p.id &&
                  other.sex === 'male' &&
                  adult(w, other) &&
                  !p.parents.includes(other.id) &&
                  !p.children.includes(other.id) &&
                  !other.parents.some((id) => p.parents.includes(id)),
              );
      if (father?.alive && father.settlement === p.settlement) {
        const child = addPerson(w, s.id, 0, blended(p.ancestry, father.ancestry), [
          p.id,
          father.id,
        ]);
        p.lastBirth = w.day;
        event(w, 'birth', `В ${s.name} родился житель ${child.id}.`, [
          `person:${child.id}`,
          `settlement:${s.id}`,
        ]);
        if (
          w.player &&
          child.parents.includes(w.player.person) &&
          !w.player.heirs.includes(child.id)
        )
          w.player.heirs.push(child.id);
      }
    }
    if (
      s.shortageDays > 15 &&
      p.profession !== 'soldier' &&
      p.id !== w.player?.person &&
      random(w) < 0.05
    ) {
      const nearby = w.roads
        .filter((r) => !r.blocked && (r.a === s.id || r.b === s.id))
        .map((r) => w.settlements[r.a === s.id ? r.b : r.a])
        .find((dest) => dest.shortageDays === 0);
      if (nearby) {
        movePerson(w, p, nearby.id);
        event(w, 'migration', `Житель ${p.id} переселился в ${nearby.name}.`, [`person:${p.id}`]);
      }
    }
  }
  const player = w.player;
  if (player && !w.people[player.person].alive) {
    player.journey = undefined;
    player.scene = 'world';
    player.gameOver = !player.heirs.some((id) => w.people[id]?.alive && adult(w, w.people[id]));
    w.speed = 0;
  }
}
export function levy(w: World, settlement: number, count: number, player = false): Army {
  const s = w.settlements[settlement];
  const candidates = s.residents
    .map((id) => w.people[id])
    .filter(
      (p) =>
        p.alive &&
        adult(w, p) &&
        p.profession !== 'soldier' &&
        p.id !== w.player?.person &&
        !w.states.some((st) => st.ruler === p.id),
    );
  const n = Math.min(
    count,
    candidates.length,
    Math.floor(s.stocks.weapons),
    Math.floor(s.stocks.grain / 3),
  );
  const members = candidates.slice(0, n);
  for (const p of members) {
    p.homeProfession = p.profession;
    profession(w, p, 'soldier');
  }
  s.stocks.weapons -= n;
  s.stocks.grain -= n * 3;
  const army: Army = {
    id: nextId(w, 'army'),
    settlement,
    state: s.state,
    members: members.map((p) => p.id),
    food: n * 3,
    morale: 100,
    unitClass: 'spearmen',
    player,
  };
  w.armies.push(army);
  return army;
}
export function supply(w: World) {
  for (const a of w.armies) {
    a.members = a.members.filter((id) => w.people[id].alive);
    if (!a.members.length) continue;
    const moving = a.player && w.player?.journey;
    const s = w.settlements[a.settlement];
    if (!moving) {
      const take = Math.min(Math.max(0, a.members.length * 7 - a.food), s.stocks.grain);
      s.stocks.grain -= take;
      a.food += take;
    }
    const required = a.members.length;
    if (a.food >= required) {
      a.food -= required;
      a.morale = Math.min(100, a.morale + 1);
    } else {
      a.food = 0;
      a.morale = Math.max(0, a.morale - 10);
      if (a.morale < 30) {
        const id = a.members.pop()!;
        profession(w, w.people[id], w.people[id].homeProfession ?? 'farmer');
        event(w, 'desertion', `Солдат ${id} покинул голодный отряд.`, [`person:${id}`, a.id]);
      }
    }
  }
}
export function politics(w: World) {
  for (const s of w.states) {
    if (!w.people[s.ruler]?.alive) {
      const previous = w.people[s.ruler];
      const successor =
        previous?.children
          .map((id) => w.people[id])
          .filter((p) => p.alive && adult(w, p) && p.state === s.id)
          .sort((a, b) => a.born - b.born)[0] ??
        w.people.find((p) => p.alive && p.state === s.id && adult(w, p));
      if (successor) {
        s.ruler = successor.id;
        promote(w, successor.id).titles.push('Правитель');
        s.legitimacy = Math.max(30, s.legitimacy - 15);
        event(
          w,
          'succession',
          `${s.name}: власть перешла к ${w.npcs[successor.id].name}.`,
          [`person:${successor.id}`, `state:${s.id}`],
          true,
        );
      }
    }
    if (w.day % 30 !== 0) continue;
    const towns = w.settlements.filter((t) => t.state === s.id);
    if (!towns.length) continue;
    const mean = towns.reduce((n, t) => n + t.loyalty, 0) / towns.length;
    s.legitimacy = Math.max(0, Math.min(100, s.legitimacy + (mean - 60) * 0.04));
    // A resource war needs an actual prolonged shortage and an adjacent stocked target.
    if (w.wars.some((war) => war.active && (war.a === s.id || war.b === s.id))) continue;
    const starving = towns.find((t) => t.shortageDays >= 20);
    if (!starving) continue;
    const border = w.roads.find((r) => {
      const a = w.settlements[r.a],
        b = w.settlements[r.b];
      return (
        !r.blocked &&
        ((a.state === s.id && b.state !== s.id && b.stocks.grain > b.population * 8) ||
          (b.state === s.id && a.state !== s.id && a.stocks.grain > a.population * 8))
      );
    });
    if (!border) continue;
    const source =
        w.settlements[border.a].state === s.id ? w.settlements[border.a] : w.settlements[border.b],
      target =
        w.settlements[border.a].state === s.id ? w.settlements[border.b] : w.settlements[border.a];
    const troops = levy(w, source.id, 8);
    if (troops.members.length < 3) {
      for (const id of troops.members)
        profession(w, w.people[id], w.people[id].homeProfession ?? 'farmer');
      source.stocks.weapons += troops.members.length;
      source.stocks.grain += troops.food;
      w.armies = w.armies.filter((a) => a !== troops);
      continue;
    }
    const reason = `Голод в ${starving.name}, спор за продовольствие ${target.name}`;
    s.claims.push(target.id);
    s.relations[target.state] = -80;
    w.states[target.state].relations[s.id] = -80;
    w.wars.push({
      id: nextId(w, 'war'),
      a: s.id,
      b: target.state,
      target: target.id,
      reason,
      started: w.day,
      active: true,
    });
    levy(w, target.id, 8);
    border.blocked = true;
    event(
      w,
      'war',
      `${s.name} объявляет войну: ${reason}.`,
      [`state:${s.id}`, `state:${target.state}`],
      true,
    );
  }
  for (const war of w.wars.filter((v) => v.active)) {
    if (w.day % 7 !== 0) continue;
    const a = w.armies.find((a) => !a.player && a.state === war.a && a.members.length),
      b = w.armies.find(
        (a) => !a.player && a.state === war.b && a.settlement === war.target && a.members.length,
      );
    if (a && b) {
      const loser =
        a.members.length + a.morale * 0.05 >= b.members.length + b.morale * 0.05 ? b : a;
      const id = loser.members.pop()!;
      death(w, w.people[id], 'пограничный бой');
      event(w, 'war_loss', `В пограничном бою погиб солдат ${id}.`, [war.id, `person:${id}`], true);
    }
    if (w.day - war.started >= 60 || !a || !b) {
      war.active = false;
      w.states[war.a].relations[war.b] = -20;
      w.states[war.b].relations[war.a] = -20;
      for (const r of w.roads) {
        const sa = w.settlements[r.a].state,
          sb = w.settlements[r.b].state;
        if ((sa === war.a && sb === war.b) || (sa === war.b && sb === war.a)) r.blocked = false;
      }
      for (const army of [a, b])
        if (army) {
          const home = w.settlements[army.settlement];
          for (const id of army.members)
            profession(w, w.people[id], w.people[id].homeProfession ?? 'farmer');
          home.stocks.weapons += army.members.length;
          home.stocks.grain += army.food;
          army.members = [];
          army.food = 0;
        }
      event(w, 'peace', `Державы заключили перемирие после пограничной войны.`, [war.id], true);
    }
  }
}
export function quests(w: World) {
  for (const s of w.settlements) {
    for (const q of w.quests.filter(
      (q) => q.settlement === s.id && (q.status === 'open' || q.status === 'accepted'),
    )) {
      if (
        (q.type === 'deliver' && s.stocks.grain > s.population * 5) ||
        (q.type === 'hunt' && s.monsters === 0)
      ) {
        q.status = 'resolved';
        event(w, 'quest_resolved', `Проблема ${q.id} разрешилась без сдачи контракта.`, [q.id]);
      }
    }
    const type = s.shortageDays >= 3 ? 'deliver' : s.monsters > 0 ? 'hunt' : null;
    if (
      !type ||
      w.quests.some(
        (q) =>
          q.settlement === s.id &&
          q.type === type &&
          (q.status === 'open' || q.status === 'accepted'),
      )
    )
      continue;
    const need = type === 'deliver' ? Math.max(10, s.population * 2) : s.monsters;
    w.quests.push({
      id: nextId(w, 'quest'),
      settlement: s.id,
      type,
      status: 'open',
      need,
      reward: type === 'deliver' ? need * 4 : 80,
      created: w.day,
      reason:
        type === 'deliver'
          ? `Нехватка еды уже ${s.shortageDays} дней`
          : `В окрестностях ${s.monsters} волков`,
    });
  }
}
export function tickDay(w: World) {
  if (w.battle?.status === 'active') return;
  w.day++;
  economy(w);
  logistics(w);
  const hero = w.player;
  if (hero && w.people[hero.person].alive) {
    if (hero.inventory.grain >= 1) {
      hero.inventory.grain--;
      w.people[hero.person].health = Math.min(100, w.people[hero.person].health + 0.5);
    } else {
      w.people[hero.person].health -= 2;
      if (w.people[hero.person].health <= 0) death(w, w.people[hero.person], 'голод в пути');
    }
  }
  demography(w);
  supply(w);
  politics(w);
  const p = w.player;
  if (p?.journey && w.people[p.person].alive) {
    const result = advanceJourney(w, p.journey);
    const at = p.journey.route[p.journey.leg];
    movePerson(w, w.people[p.person], at);
    const army = w.armies.find((a) => a.id === p.army);
    if (army) {
      army.settlement = at;
      for (const id of army.members) movePerson(w, w.people[id], at);
    }
    if (result === 'arrived') {
      p.journey = undefined;
      if (!p.visited.includes(at)) p.visited.push(at);
      event(w, 'arrival', `${p.name} прибыл в ${w.settlements[at].name}.`, [`person:${p.person}`]);
    } else if (result === 'blocked') {
      p.journey = undefined;
      event(w, 'route_blocked', 'Путь перекрыт войной. Выберите другой маршрут.');
    }
  }
  if (w.day % 30 === 0)
    for (const s of w.settlements)
      if (s.monsters > 0 && s.monsters < 20 && random(w) < 0.35) s.monsters++;
  quests(w);
}
