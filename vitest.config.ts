import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  resolve: {
    alias: {
      '@living-world/simulation': fileURLToPath(
        new URL('./packages/simulation/src/index.ts', import.meta.url),
      ),
    },
  },
  test: { include: ['tests/**/*.test.ts'], testTimeout: 30000 },
});
