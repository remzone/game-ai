import { createWorld } from '@living-world/simulation';
import { PostgresStorage } from '../apps/server/src/storage.js';
const storage = new PostgresStorage();
try {
  const slots = await storage.list();
  if (slots.some((s) => s.slot === 0))
    throw new Error('Автосохранение уже существует; seed не перезаписывает игру.');
  await storage.save(0, createWorld('ashen-crown'));
  console.log('Seed создан в слоте 0. Персонаж создаётся в New Game.');
} finally {
  await storage.close();
}
