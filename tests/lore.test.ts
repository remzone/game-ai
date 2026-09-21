import { expect, it } from 'vitest';
import {
  createWorld,
  command,
  loreDay,
  addPerson,
  death,
  spellCost,
} from '@living-world/simulation';
import { decode, encode } from '../apps/server/src/storage.js';
function game() {
  const w = createWorld('lore', 60);
  command(w, {
    type: 'create_player',
    biography: {
      name: 'Книжник',
      race: 'Human',
      sex: 'male',
      birthplace: 0,
      origin: 'nobles',
      childhood: 'books',
      youth: 'temple',
      training: 'healer',
      turningPoint: 'rescue',
      reason: 'knowledge',
    },
  });
  w.player!.scene = 'settlement';
  w.player!.gold = 1000;
  w.player!.inventory.grain = 100;
  w.people[w.player!.person].potential = 8;
  return w;
}
it('finite magical ore deposits consume actual mining inputs and remain depleted after save/load', () => {
  const w = game(),
    s = w.settlements.find((s) => s.biome === 'mountain')!;
  s.stocks.tools = 100;
  s.stocks.iron = 100;
  const reserve = s.essenceReserve!;
  for (let i = 1; i <= reserve + 2; i++) {
    w.day = i * 30;
    loreDay(w);
  }
  expect(s.essenceReserve).toBe(0);
  expect(s.essence).toBe(reserve);
  expect(s.stocks.tools).toBe(100 - reserve);
  expect(s.stocks.iron).toBe(100 - reserve);
  const loaded = decode(encode(w));
  expect(loaded.settlements[s.id].essenceReserve).toBe(0);
});
it('a real teacher creates a physical book and reading advances the world calendar', () => {
  const w = game(),
    s = w.settlements[0],
    wood = s.stocks.wood;
  expect(command(w, { type: 'commission_book', school: 'nature' }).ok).toBe(true);
  const book = w.items![0];
  expect(w.people[book.creator].alive).toBe(true);
  expect(s.stocks.wood).toBe(wood - 2);
  expect(w.player!.gold).toBe(920);
  expect(command(w, { type: 'read_book', item: book.id }).ok).toBe(true);
  expect(w.day).toBe(3);
  expect(w.player!.skills.nature).toBe(1);
  expect(book.owner).toBe(w.player!.person);
});
it('forging spends ore and inventory, provides an actual spell benefit and records gift provenance', () => {
  const w = game(),
    p = w.player!,
    s = w.settlements[0];
  p.skills.crafting = 2;
  p.skills.elemental = 2;
  s.essence = 3;
  p.inventory.iron = 10;
  p.inventory.tools = 2;
  expect(
    command(w, { type: 'forge_artifact', school: 'elemental', name: 'Последняя искра' }).ok,
  ).toBe(true);
  const item = w.items![0];
  expect(s.essence).toBe(0);
  expect(p.inventory.iron).toBe(0);
  expect(p.inventory.tools).toBe(0);
  expect(spellCost(w, 'elemental')).toBe(8);
  const recipient = s.residents.find(
    (id) => id !== p.person && w.people[id].profession !== 'child',
  )!;
  expect(command(w, { type: 'give_item', item: item.id, person: recipient }).ok).toBe(true);
  expect(spellCost(w, 'elemental')).toBe(10);
  expect(item.owner).toBe(recipient);
  expect(item.history).toHaveLength(2);
});
it('books are inherited by real heirs with ownership history instead of copied inventories', () => {
  const w = game(),
    p = w.player!;
  expect(command(w, { type: 'commission_book', school: 'healing' }).ok).toBe(true);
  const heir = addPerson(w, 0, 25, [1, 0, 0, 0, 0, 0], [p.person]);
  p.heirs = [heir.id];
  death(w, w.people[p.person], 'test');
  expect(command(w, { type: 'inherit', person: heir.id }).ok).toBe(true);
  expect(w.items).toHaveLength(1);
  expect(w.items![0].owner).toBe(heir.id);
  expect(w.items![0].history).toHaveLength(2);
});
