import { it, expect } from 'vitest';
import {
  createWorld,
  command,
  crown,
  statecraftDay,
  honorGuarantees,
  overlord,
  hasCivilRights,
  militaryRoute,
  campaignDay,
  type World,
} from '@living-world/simulation';
import { encode, decode } from '../apps/server/src/storage.js';
function game() {
  const w = createWorld('statecraft', 60);
  expect(
    command(w, {
      type: 'create_player',
      biography: {
        name: 'Правитель',
        race: 'Human',
        sex: 'male',
        birthplace: 0,
        origin: 'nobles',
        childhood: 'books',
        youth: 'militia',
        training: 'warrior',
        turningPoint: 'inheritance',
        reason: 'duty',
      },
    }).ok,
  ).toBe(true);
  crown(w, w.states[0], w.player!.person, 'test');
  w.player!.scene = 'settlement';
  for (const s of w.states) for (const other of w.states) s.relations[other.id] = 20;
  return w;
}
function pact(w: World, action: 'vassalage' | 'tribute' | 'guarantee', state = 1, amount = 50) {
  return command(w, { type: 'state_pact', state, action, amount });
}
it('tribute transfers only existing treasury funds and cannot be paid twice the same day', () => {
  const w = game(),
    initial = w.states[0].treasury + w.states[1].treasury;
  expect(pact(w, 'tribute').ok).toBe(true);
  const before = w.states[1].treasury;
  w.day = 30;
  statecraftDay(w);
  expect(w.states[1].treasury).toBe(before + 50);
  expect(w.states[0].treasury + w.states[1].treasury).toBe(initial);
  statecraftDay(w);
  expect(w.states[1].treasury).toBe(before + 50);
  w.states[0].treasury = 7;
  w.day = 60;
  statecraftDay(w);
  expect(w.states[0].treasury).toBe(0);
  expect(w.states[1].treasury).toBe(before + 57);
  expect(w.states[1].relations[0]).toBe(10);
});
it('vassalage grants passage, disallows independent wars and rejects circular oaths atomically', () => {
  const w = game();
  expect(pact(w, 'vassalage').ok).toBe(true);
  expect(overlord(w, 0)).toBe(1);
  expect(militaryRoute(w, 0, 0, 30).length).toBeGreaterThan(0);
  w.states[0].claims.push(60);
  const before = JSON.stringify(w);
  expect(command(w, { type: 'diplomacy', state: 2, action: 'war' }).ok).toBe(false);
  expect(JSON.stringify(w)).toBe(before);
  expect(command(w, { type: 'end_pact', treaty: w.treaties[0].id }).ok).toBe(true);
  expect(overlord(w, 0)).toBeUndefined();
  w.states[0].relations[1] = 20;
  w.states[1].relations[0] = 20;
  w.treaties.push({
    id: 'reverse',
    a: 1,
    b: 0,
    type: 'vassalage',
    until: 360,
    amount: 10,
    nextPayment: 30,
  });
  const circular = JSON.stringify(w);
  expect(pact(w, 'vassalage').ok).toBe(false);
  expect(JSON.stringify(w)).toBe(circular);
});
it('a guarantee responds to an actual attack once and ends when that attack ends', () => {
  const w = game();
  expect(pact(w, 'guarantee').ok).toBe(true);
  honorGuarantees(w);
  expect(w.wars).toHaveLength(0);
  w.wars.push({
    id: 'attack',
    a: 2,
    b: 1,
    target: 30,
    reason: 'claim',
    started: 0,
    active: true,
    campaign: true,
  });
  honorGuarantees(w);
  honorGuarantees(w);
  expect(w.wars).toHaveLength(2);
  const defense = w.wars.find((v) => v.defenseOf === 'attack')!;
  expect(defense.a).toBe(0);
  expect(defense.b).toBe(2);
  expect(w.states[0].claims).toEqual([]);
  w.wars[0].active = false;
  campaignDay(w);
  expect(defense.active).toBe(false);
});
it('a law acts on mixed ancestry and cannot disenfranchise its own ruler', () => {
  const w = game(),
    person = w.people[w.player!.person];
  expect(command(w, { type: 'race_rights', race: 'Elf', rights: 'restricted' }).ok).toBe(true);
  expect(hasCivilRights(w.states[0], { ...person, ancestry: [0.5, 0.5, 0, 0, 0, 0] })).toBe(false);
  expect(hasCivilRights(w.states[0], { ...person, ancestry: [0.75, 0.25, 0, 0, 0, 0] })).toBe(true);
  const before = JSON.stringify(w);
  expect(command(w, { type: 'race_rights', race: 'Human', rights: 'restricted' }).ok).toBe(false);
  expect(JSON.stringify(w)).toBe(before);
});
it('identity and obligations survive save/load without changing RNG or creating people', () => {
  const w = game(),
    rng = w.rng,
    count = w.people.length;
  expect(
    command(w, {
      type: 'state_identity',
      name: 'Сумеречный предел',
      color: '#3c243f',
      emblem: 'moon',
      rulerTitle: 'Хранитель',
    }).ok,
  ).toBe(true);
  expect(pact(w, 'vassalage').ok).toBe(true);
  const loaded = decode(encode(w));
  expect(loaded.states[0].name).toBe('Сумеречный предел');
  expect(loaded.states[0].emblem).toBe('moon');
  expect(loaded.player!.title).toBe('Хранитель Сумеречный предел');
  expect(overlord(loaded, 0)).toBe(1);
  expect(loaded.rng).toBe(rng);
  expect(loaded.people.length).toBe(count);
});
