import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import staticPlugin from '@fastify/static';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import {
  BiographySchema,
  conversation,
  adult,
  command,
  createWorld,
  stepBattle,
  tickDay,
  type World,
} from '@living-world/simulation';
import { runDirector } from './director.js';
import type { Storage } from './storage.js';
export function worldView(w: World) {
  const here = w.player ? w.people[w.player.person].settlement : 0;
  return {
    ...w,
    people: undefined,
    directorLogs: undefined,
    npcs: undefined,
    settlements: w.settlements.map((s) => ({ ...s, residents: undefined })),
    events: w.events.slice(-80),
    chronicles: w.chronicles.slice(-20),
    caravans: w.caravans.filter((c) => c.status === 'traveling').slice(-150),
    quests: [
      ...w.quests.filter((q) => q.status === 'accepted'),
      ...w.quests.filter((q) => q.status !== 'accepted').slice(-150),
    ],
    party:
      w.armies
        .find((a) => a.id === w.player?.army)
        ?.members.map((id) => ({ ...w.people[id], npc: w.npcs[id] })) ?? [],
    population: {
      total: w.people.length,
      alive: w.settlements.reduce((n, s) => n + s.population, 0),
    },
    hero: w.player ? w.people[w.player.person] : null,
    heirs: w.player?.heirs.map((id) => w.people[id]) ?? [],
    locals: w.settlements[here].residents
      .map((id) => w.people[id])
      .filter((p) => p.alive && adult(w, p))
      .slice(0, 20)
      .map((p) => ({ ...p, npc: w.npcs[p.id] })),
    rulers: w.states.map((s) => w.npcs[s.ruler]),
  };
}
export async function createApp(
  storage: Storage,
  options: {
    timers?: boolean;
    password?: string;
    origin?: string;
    apiKey?: string;
    log?: boolean;
  } = {},
) {
  const app = Fastify({ logger: options.log ?? false, bodyLimit: 32768 });
  let w: World | null = null;
  let generation = 0;
  let tickMs = 0;
  let lastError: string | null = null;
  let directorBusy = false;
  let steps = 0;
  let queue = Promise.resolve();
  let closed = false;
  let timer: NodeJS.Timeout | undefined;
  const sessions = new Map<string, number>();
  const clients = new Set<{ send(data: string): void; close(): void }>();
  function auth(cookie?: string) {
    if (!options.password) return true;
    const token = cookie?.match(/(?:^|; )rpg_session=([^;]+)/)?.[1];
    return !!token && (sessions.get(token) ?? 0) > Date.now();
  }
  function serial<T>(fn: () => T | Promise<T>): Promise<T> {
    const run = queue.then(fn);
    queue = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }
  function broadcast() {
    if (!w || !clients.size) return;
    const data = JSON.stringify({ ...worldView(w), saveError: lastError });
    for (const c of clients)
      try {
        c.send(data);
      } catch {
        clients.delete(c);
      }
  }
  app.setErrorHandler((error, req, reply) => {
    const validation = error instanceof z.ZodError;
    if (!validation) app.log.error(error);
    reply.code(validation ? 400 : 500).send({
      error: validation
        ? 'Некорректные параметры'
        : error instanceof Error
          ? error.message
          : 'Ошибка сервера',
    });
  });
  app.addHook('onRequest', async (req, reply) => {
    if (req.url === '/api/health') return;
    const origin = req.headers.origin;
    if (origin && origin !== (options.origin ?? `http://${req.headers.host}`))
      return reply.code(403).send({ error: 'Недопустимый Origin' });
    if (
      (req.url.startsWith('/api/') || req.url === '/ws') &&
      req.url !== '/api/login' &&
      !auth(req.headers.cookie)
    )
      return reply.code(401).send({ error: 'Требуется вход' });
  });
  const attempts = new Map<string, { count: number; reset: number }>();
  app.post('/api/login', async (req, reply) => {
    const body = z
      .object({ password: z.string().max(300) })
      .strict()
      .parse(req.body);
    const key = req.ip;
    let a = attempts.get(key);
    if (!a || a.reset < Date.now()) {
      a = { count: 0, reset: Date.now() + 60000 };
      attempts.set(key, a);
    }
    if (++a.count > 10) return reply.code(429).send({ error: 'Повторите через минуту' });
    const expected = Buffer.from(options.password ?? ''),
      given = Buffer.from(body.password);
    if (expected.length !== given.length || !timingSafeEqual(expected, given))
      return reply.code(401).send({ error: 'Неверный пароль' });
    const token = randomBytes(32).toString('hex');
    sessions.set(token, Date.now() + 24 * 3600000);
    reply.header(
      'Set-Cookie',
      `rpg_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400${options.origin?.startsWith('https:') ? '; Secure' : ''}`,
    );
    return { ok: true };
  });
  app.get('/api/health', async () => ({ ok: true }));
  app.get('/api/world', async () => (w ? { ...worldView(w), saveError: lastError } : null));
  app.post('/api/new', async (req) => {
    const input = z
      .object({ seed: z.string().trim().min(1).max(100), biography: BiographySchema })
      .strict()
      .parse(req.body);
    return serial(async () => {
      const next = createWorld(input.seed);
      const result = command(next, { type: 'create_player', biography: input.biography });
      if (!result.ok) throw new Error(result.error);
      next.director.model = process.env.OPENROUTER_MODEL ?? next.director.model;
      await storage.save(0, next);
      generation++;
      w = next;
      steps = 0;
      lastError = null;
      broadcast();
      return { ...worldView(next), saveError: null };
    });
  });
  app.post('/api/command', async (req, reply) =>
    serial(async () => {
      if (!w) return reply.code(409).send({ error: 'Создайте мир' });
      const result = command(w, req.body);
      if (!result.ok) return reply.code(400).send({ error: result.error });
      const type = (req.body as { type?: string }).type;
      if (!['battle_order', 'battle_tactic', 'speed', 'talk'].includes(type ?? '')) {
        try {
          await storage.save(0, w);
          lastError = null;
        } catch (error) {
          app.log.error(error);
          lastError =
            'Автосохранение недоступно. Действие выполнено; сохраните мир вручную и проверьте хранилище.';
        }
      }
      broadcast();
      return { ...worldView(w), saveError: lastError };
    }),
  );
  app.post('/api/dialogue', async (req, reply) => {
    const body = z.object({ person: z.number().int().nonnegative() }).strict().parse(req.body);
    return serial(() => {
      if (!w?.player) return reply.code(409).send({ error: 'Создайте героя' });
      const result = command(w, { type: 'talk', person: body.person });
      if (!result.ok) return reply.code(400).send({ error: result.error });
      broadcast();
      return conversation(w, body.person);
    });
  });
  app.get('/api/saves', async () => storage.list());
  const slot = z.coerce.number().int().min(0).max(5);
  app.post('/api/saves/:slot', async (req, reply) => {
    const n = slot.parse((req.params as { slot: string }).slot);
    return serial(async () => {
      if (!w) return reply.code(409).send({ error: 'Нет мира' });
      await storage.save(n, w);
      lastError = null;
      return { ok: true };
    });
  });
  app.post('/api/saves/:slot/load', async (req) => {
    const n = slot.parse((req.params as { slot: string }).slot);
    return serial(async () => {
      const loaded = await storage.load(n);
      loaded.speed = 0;
      generation++;
      w = loaded;
      steps = 0;
      lastError = null;
      broadcast();
      return { ...worldView(w), saveError: null };
    });
  });
  app.get('/api/history', async (req, reply) => {
    const query = z
      .object({
        offset: z.coerce.number().int().min(0).default(0),
        limit: z.coerce.number().int().min(1).max(100).default(50),
      })
      .parse(req.query);
    if (!w) return reply.code(409).send({ error: 'Создайте мир' });
    return {
      total: w.events.length,
      items: w.events
        .slice(
          Math.max(0, w.events.length - query.offset - query.limit),
          Math.max(0, w.events.length - query.offset),
        )
        .reverse(),
    };
  });
  app.get('/api/admin/people', async (req, reply) => {
    const query = z
      .object({
        offset: z.coerce.number().int().min(0).default(0),
        limit: z.coerce.number().int().min(1).max(100).default(50),
      })
      .parse(req.query);
    if (!w) return reply.code(409).send({ error: 'Создайте мир' });
    return {
      total: w.people.length,
      items: w.people
        .slice(query.offset, query.offset + query.limit)
        .map((p) => ({ ...p, npc: w!.npcs[p.id] })),
    };
  });
  app.get('/api/admin', async () => ({
    day: w?.day,
    seed: w?.seed,
    rng: w?.rng,
    population: w?.people.length,
    events: w?.events.slice(-200) ?? [],
    director: w?.director,
    logs: w?.directorLogs.slice(-30) ?? [],
    tickMs,
    lastError,
    keyConfigured: !!options.apiKey,
    generation,
  }));
  app.post('/api/admin/director', async (req, reply) => {
    const settings = z
      .object({
        enabled: z.boolean(),
        model: z.string().trim().min(1).max(100),
        cooldownDays: z.number().int().min(10).max(3600),
        budget: z.number().int().min(0).max(100),
      })
      .strict()
      .parse(req.body);
    return serial(() => {
      if (!w) return reply.code(409).send({ error: 'Нет мира' });
      Object.assign(w.director, settings);
      return { ok: true };
    });
  });
  await app.register(websocket);
  app.get('/ws', { websocket: true }, (socket, req) => {
    if (!auth(req.headers.cookie)) {
      socket.close();
      return;
    }
    clients.add(socket);
    if (w) socket.send(JSON.stringify(worldView(w)));
    socket.on('close', () => clients.delete(socket));
    socket.on('error', () => clients.delete(socket));
  });
  const webRoot = fileURLToPath(new URL('../../web/dist/', import.meta.url));
  if (existsSync(webRoot)) {
    await app.register(staticPlugin, { root: webRoot });
    app.setNotFoundHandler((req, reply) =>
      req.url.startsWith('/api/')
        ? reply.code(404).send({ error: 'Не найдено' })
        : reply.sendFile('index.html'),
    );
  }
  const saves = await storage.list();
  if (saves.some((s) => s.slot === 0)) {
    w = await storage.load(0);
    w.speed = 0;
  }
  if (options.timers !== false)
    timer = setInterval(() => {
      if (closed) return;
      void serial(async () => {
        if (!w || w.speed === 0) return;
        const start = performance.now();
        if (w.battle?.status === 'active') {
          stepBattle(w, 0.25);
          if (w.battle.status !== 'active') await storage.save(0, w);
        } else if (++steps % 4 === 0) {
          const days = w.speed;
          for (let i = 0; i < days; i++) {
            tickDay(w);
            if (Number(w.speed) === 0) break;
          }
          if (w.day % 10 < days) await storage.save(0, w);
        }
        tickMs = performance.now() - start;
        broadcast();
        if (w.director.enabled && !directorBusy && options.apiKey) {
          directorBusy = true;
          const current = w,
            g = generation;
          void runDirector(
            current,
            options.apiKey,
            fetch,
            () => generation === g && w === current,
          ).finally(() => {
            directorBusy = false;
          });
        }
      }).catch((error) => {
        lastError =
          'Симуляция приостановлена из-за ошибки. Сохраните мир вручную и проверьте журнал сервера.';
        if (w) w.speed = 0;
        app.log.error(error);
      });
    }, 250);
  app.addHook('onClose', async () => {
    closed = true;
    if (timer) clearInterval(timer);
    for (const c of clients) c.close();
    await queue;
    if (w) await storage.save(0, w);
    await storage.close();
  });
  return app;
}
