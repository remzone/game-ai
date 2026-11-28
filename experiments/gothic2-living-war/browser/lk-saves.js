/* Living Khorinis: plan a save import without replacing existing progress. */
(() => {
  'use strict';
  const slot = /^save_slot_(0|[1-9]\d?)\.sav$/i;
  const nameOf = n => 'save_slot_' + n + '.sav';
  const same = (a, b) => a.length === b.length && a.every((byte, i) => byte === b[i]);
  function plan(existing, incoming, max = 20) {
    const occupied = new Set(existing.map(file => file.name.toLowerCase()));
    const valid = incoming.map(file => {
      if (!/\.sav$/i.test(file.name) || !file.bytes?.length) throw Error('Выбери непустой файл .sav или ZIP с сохранениями.');
      const match = slot.exec(file.name);
      return { ...file, index: match ? Number(match[1]) : null };
    }).filter(file => file.index !== 99); // internal renderer-resume slot
    const writes = [], deferred = [];
    let duplicates = 0;
    const put = (file, index) => {
      const name = nameOf(index);
      writes.push({ name, bytes: file.bytes, original: file.name, index });
      occupied.add(name);
    };
    // Reserve all original free slots before moving any conflicting ones.
    for (const file of valid) {
      const exact = file.index !== null && file.index <= max ? nameOf(file.index) : null;
      if (exact && !occupied.has(exact)) put(file, file.index);
      else if (exact && [...existing, ...writes].some(e => e.name.toLowerCase() === exact && same(e.bytes, file.bytes))) duplicates++;
      else deferred.push(file);
    }
    for (const file of deferred) {
      let free = 1;
      while (free <= max && occupied.has(nameOf(free))) free++;
      if (free > max) throw Error('Нет свободных слотов. Ничего не импортировано. Сначала сделай резервную копию и освободи место в меню игры.');
      put(file, free);
    }
    return { writes, duplicates, ignored: incoming.length - valid.length };
  }
  globalThis.LivingKhorinisSaves = Object.freeze({ plan });
})();
