import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    testTimeout: 120_000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      reportsDirectory: 'coverage',
      include: [
        'src/application/**/*.ts',
        'src/domain/**/*.ts',
        'src/plugins/**/*.ts',
        'src/prompt/**/*.ts',
        'src/templates/**/*.ts',
        'src/validation/**/*.ts',
        'src/utils/**/*.ts'
      ],
      exclude: [
        'src/cli.ts',
        'src/cli/**',
        'src/script-runtime.ts'
      ],
      thresholds: {
        branches: 60,
        functions: 60,
        lines: 60,
        statements: 60
      }
    }
  }
});
