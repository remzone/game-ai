import { createApp } from './app.js';
import { FileStorage, PostgresStorage } from './storage.js';
const driver = process.env.STORAGE_DRIVER ?? 'postgres';
if (!['postgres', 'file'].includes(driver)) throw new Error('STORAGE_DRIVER: postgres или file');
const storage =
  driver === 'file' ? new FileStorage(process.env.SAVE_DIRECTORY) : new PostgresStorage();
const app = await createApp(storage, {
  password: process.env.GAME_PASSWORD,
  origin: process.env.PUBLIC_ORIGIN,
  apiKey: process.env.OPENROUTER_API_KEY,
  log: true,
});
await app.listen({ port: Number(process.env.PORT ?? 3000), host: process.env.HOST ?? '127.0.0.1' });
for (const signal of ['SIGTERM', 'SIGINT'] as const) process.once(signal, () => void app.close());
