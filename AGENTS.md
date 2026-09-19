# Working in this repository

- Read `docs/MASTER_PROMPT.ru.txt`, `docs/STATUS.md` and `docs/ARCHITECTURE.md` before extending systems.
- The simulation is the only source of truth. UI, API handlers and LLM responses must not bypass command validation.
- Keep domain logic in `packages/simulation`; use only its stored RNG for random mechanics.
- Never delete or reuse a population identity. Update workforce aggregates on every profession, location and lifecycle change.
- Retain complete world/RNG state in saves; version and migrate snapshots when breaking the format.
- Do not replace physical cargo, soldiers or battle losses with arbitrary counters.
- Add causality tests for behavior changes, not tests that merely mirror functions.
- Run `npm run db:generate`, `npm run check`, and `npm run format:check` before delivery.
- Keep `.env`, API keys and real saved games out of Git.
- Update STATUS and VALIDATION honestly; scaffolding is not a completed mechanic.
- No external calls are needed for tests: use the injected OpenRouter fetch adapter.
