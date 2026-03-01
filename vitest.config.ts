import { defineConfig } from 'vitest/config';
import type { UserConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    env: { NODE_ENV: 'test' },
    include: ['src/**/*.{test,spec}.ts', 'tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'lcov', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
        'src/app.ts',
        '**/*.d.ts',
        'src/messaging/**',
        'src/middlewares/**',
        'src/config/**',
        'src/lifecycle/**',
        'src/utils/logger.ts',
        'src/utils/typeGuards.ts'
      ],
    },
  },
} as UserConfig);
