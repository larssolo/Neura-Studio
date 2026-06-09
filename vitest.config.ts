import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Enables @testing-library/react's automatic DOM cleanup between tests (registers a global afterEach).
    globals: true,
    include: ['server/**/*.test.ts', 'src/**/*.test.{ts,tsx}'],
  },
});
