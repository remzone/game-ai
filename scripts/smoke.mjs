// Run only against a disposable local/CI instance: this creates a new world.
const base = process.env.SMOKE_URL ?? 'http://127.0.0.1:3000';
async function post(path, body) {
  const r = await fetch(base + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(`${path}: ${r.status} ${JSON.stringify(data)}`);
  return data;
}
const biography = {
  name: 'CI Hero',
  race: 'Human',
  sex: 'male',
  birthplace: 0,
  origin: 'merchants',
  childhood: 'books',
  youth: 'caravan',
  training: 'trader',
  turningPoint: 'inheritance',
  reason: 'knowledge',
};
const initial = await post('/api/new', { seed: 'http-smoke', biography });
if (initial.states.length !== 10 || initial.settlements.length !== 300)
  throw new Error('Invalid world');
await post('/api/command', { type: 'enter' });
const traded = await post('/api/command', {
  type: 'trade',
  side: 'buy',
  good: 'grain',
  quantity: 5,
});
await post('/api/saves/1', {});
await post('/api/command', { type: 'trade', side: 'sell', good: 'grain', quantity: 5 });
const loaded = await post('/api/saves/1/load', {});
if (loaded.player.gold !== traded.player.gold || loaded.rng !== traded.rng)
  throw new Error('Save/load mismatch');
console.log('HTTP smoke passed: new → enter → trade → save → mutate → load');
