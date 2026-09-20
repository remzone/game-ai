import type { World, Settlement, Stocks } from './model.js';
/** Allocate only this day's measured production, before public consumption. */
export function estateProduction(w: World, s: Settlement, produced: Partial<Stocks>) {
  for (const e of w.estates) {
    if (e.settlement !== s.id) continue;
    const job = e.kind === 'farm' ? 'farmer' : e.kind === 'mine' ? 'miner' : 'smith';
    e.workers = e.workers.filter(
      (id) =>
        w.people[id]?.alive && w.people[id].settlement === s.id && w.people[id].profession === job,
    );
    const n = Math.min(e.workers.length, Math.floor(e.treasury / 2));
    if (!n) continue;
    const good = e.kind === 'farm' ? 'grain' : e.kind === 'mine' ? 'iron' : 'weapons';
    const output = Math.min(
      s.stocks[good],
      ((produced[good] ?? 0) * n) / Math.max(1, s.workers[job]),
    );
    if (output <= 0) continue;
    e.treasury -= n * 2;
    for (const id of e.workers.slice(0, n)) w.people[id].wealth += 2;
    const net = output * (1 - w.states[s.state].tax);
    s.stocks[good] -= net;
    e.stocks[good] += net;
  }
}
