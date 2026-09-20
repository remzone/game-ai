import type { World } from './model.js';
/** Deterministic defaults: legacy migration must not consume simulation RNG. */
export function initializeExpansion(w: World) {
  w.estates ??= [];
  w.sieges ??= [];
  w.treaties ??= [];
  w.organizations ??= [];
  w.religions ??= [];
  if (!w.religions.length)
    w.religions.push(
      { id: 0, name: 'Хранители очага', doctrine: 'Помощь и община' },
      { id: 1, name: 'Путь предков', doctrine: 'Память и наследование' },
      { id: 2, name: 'Круг познания', doctrine: 'Знание без божества' },
    );
  for (const p of w.people) {
    p.potential ??= (Math.imul(p.id + 1, 2654435761) >>> 0) % 100 < 5 ? 8 : p.id % 3;
    p.mana ??= 20;
    p.faith ??= p.state % 3;
  }
  for (const s of w.settlements) {
    s.monsterKind ??= 'wolf';
    s.fortification ??= s.central ? 2 : 0;
    s.occupation ??= null;
  }
  for (const s of w.states) {
    s.electionDay ??= w.day + 360;
    s.unrestDays ??= 0;
    s.ballots ??= [];
    s.laws ??= {
      inheritance: s.government.includes('monarchy') ? 'eldest' : 'equal',
      tolerance: true,
      religion: s.id % 3,
    };
  }
  for (const r of w.regions) {
    r.governor ??=
      w.settlements[r.capital].residents.find(
        (id) =>
          w.people[id].alive &&
          w.people[id].profession !== 'child' &&
          id !== w.states[r.state].ruler,
      ) ?? null;
  }
  for (const town of w.settlements.filter((s) => s.central)) {
    const teacher = town.residents.find(
      (id) =>
        w.people[id].alive && w.people[id].profession !== 'child' && w.people[id].potential >= 4,
    );
    if (teacher === undefined) continue;
    w.npcs[teacher] ??= {
      person: teacher,
      name: `Мастер ${teacher}`,
      biography: `Учитель из ${town.name}`,
      traits: ['учёный'],
      memory: [],
      titles: [],
      relationships: {},
    };
    const npc = w.npcs[teacher];
    npc.skills ??= { magic: 5, elemental: 3, healing: 3 };
    if (!npc.titles.includes('Учитель магии')) npc.titles.push('Учитель магии');
  }
}
