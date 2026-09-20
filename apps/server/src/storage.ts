import { createHash } from 'node:crypto';
import { gzipSync, gunzipSync } from 'node:zlib';
import { mkdir, readFile, writeFile, rename, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';
import type { World } from '@living-world/simulation';
export interface Slot {
  slot: number;
  seed: string;
  day: number;
  updatedAt: string;
}
interface Snapshot extends Slot {
  version: number;
  checksum: string;
  compressed: Buffer;
}
export function encode(w: World) {
  const bytes = Buffer.from(JSON.stringify(w));
  return {
    version: w.version,
    seed: w.seed,
    day: w.day,
    checksum: createHash('sha256').update(bytes).digest('hex'),
    compressed: gzipSync(bytes),
  };
}
export function decode(s: { version: number; checksum: string; compressed: Uint8Array }): World {
  if (s.version !== 1 && s.version !== 2) throw new Error('Неподдерживаемая версия сохранения');
  const bytes = gunzipSync(s.compressed, { maxOutputLength: 1024 * 1024 * 1024 });
  if (createHash('sha256').update(bytes).digest('hex') !== s.checksum)
    throw new Error('Сохранение повреждено');
  const raw = JSON.parse(bytes.toString());
  if (raw.version === 1) {
    for (const army of raw.armies ?? []) army.mounts ??= 0;
    for (const fighter of raw.battle?.fighters ?? []) fighter.order ??= 'move';
    for (const q of raw.quests ?? [])
      if (
        q.status === 'accepted' &&
        q.type === 'hunt' &&
        raw.settlements[q.settlement]?.monsters === 0
      )
        q.objectiveMet = true;
    raw.version = 2;
  }
  const w = raw as World;
  if (
    w.version !== 2 ||
    !Array.isArray(w.people) ||
    !Array.isArray(w.settlements) ||
    !Number.isInteger(w.rng)
  )
    throw new Error('Некорректное состояние мира');
  return w;
}
export interface Storage {
  list(): Promise<Slot[]>;
  save(slot: number, w: World): Promise<void>;
  load(slot: number): Promise<World>;
  close(): Promise<void>;
}
function validateSlot(slot: number) {
  if (!Number.isInteger(slot) || slot < 0 || slot > 5)
    throw new Error('Слоты: 0 — автосохранение; 1–5 — ручные');
}
export class FileStorage implements Storage {
  constructor(private directory = './data') {}
  async list() {
    await mkdir(this.directory, { recursive: true });
    const files = (await readdir(this.directory)).filter((n) => /^slot-[0-5]\.json$/.test(n));
    return Promise.all(
      files.map(async (name) => {
        const s = JSON.parse(await readFile(join(this.directory, name), 'utf8'));
        return { slot: s.slot, day: s.day, seed: s.seed, updatedAt: s.updatedAt };
      }),
    );
  }
  async save(slot: number, w: World) {
    validateSlot(slot);
    const s = encode(w);
    await mkdir(this.directory, { recursive: true });
    const file = join(this.directory, `slot-${slot}.json`);
    await writeFile(
      `${file}.tmp`,
      JSON.stringify({
        ...s,
        slot,
        updatedAt: new Date().toISOString(),
        compressed: s.compressed.toString('base64'),
      }),
      { mode: 0o600 },
    );
    await rename(`${file}.tmp`, file);
  }
  async load(slot: number) {
    validateSlot(slot);
    const s = JSON.parse(await readFile(join(this.directory, `slot-${slot}.json`), 'utf8'));
    return decode({ ...s, compressed: Buffer.from(s.compressed, 'base64') });
  }
  async close() {}
}
export class PostgresStorage implements Storage {
  private db = new PrismaClient();
  async list() {
    const rows = await this.db.saveSlot.findMany({
      select: { slot: true, seed: true, day: true, updatedAt: true },
      orderBy: { slot: 'asc' },
    });
    return rows.map((r) => ({ ...r, updatedAt: r.updatedAt.toISOString() }));
  }
  async save(slot: number, w: World) {
    validateSlot(slot);
    const data = encode(w);
    await this.db.saveSlot.upsert({ where: { slot }, create: { slot, ...data }, update: data });
  }
  async load(slot: number) {
    validateSlot(slot);
    const row = await this.db.saveSlot.findUniqueOrThrow({ where: { slot } });
    return decode(row);
  }
  async close() {
    await this.db.$disconnect();
  }
}
