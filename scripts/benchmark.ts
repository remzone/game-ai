import { createWorld, tickDay } from '../packages/simulation/src/index.js';
const requested = Number(process.argv[2] ?? 100000),
  days = Number(process.argv[3] ?? 30);
if (
  !Number.isSafeInteger(requested) ||
  requested < 300 ||
  !Number.isSafeInteger(days) ||
  days < 1 ||
  days > 3600
)
  throw new Error('Usage: npm run bench -- <population >=300> <days 1..3600>');
const started = performance.now(),
  w = createWorld('benchmark', Math.ceil(requested / 300)),
  creationMs = performance.now() - started;
const ticks: number[] = [];
for (let i = 0; i < days; i++) {
  const start = performance.now();
  tickDay(w);
  ticks.push(performance.now() - start);
}
ticks.sort((a, b) => a - b);
console.log(
  JSON.stringify(
    {
      population: w.people.length,
      days,
      creationMs: Math.round(creationMs),
      tickMeanMs: Math.round(ticks.reduce((a, b) => a + b, 0) / days),
      tickP95Ms: Math.round(ticks[Math.floor(days * 0.95)]),
      rssMb: Math.round(process.memoryUsage().rss / 1048576),
    },
    null,
    2,
  ),
);
