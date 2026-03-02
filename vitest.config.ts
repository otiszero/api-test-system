import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 30000,
    setupFiles: ['./vitest.setup.ts'],
    reporters: ['verbose', 'html'],
    outputFile: {
      html: './reports/html/index.html',
    },
    include: ['generated/tests/**/*.test.ts'],
    sequence: {
      // Chạy theo thứ tự folder: 01-smoke → 02-contract → ... → 07-db
      shuffle: false,
    },
    pool: 'forks',
    poolOptions: {
      forks: {
        // Chạy tuần tự để tránh race condition khi test DB
        singleFork: true,
      },
    },
  },
  resolve: {
    alias: {
      '@helpers': '/generated/helpers',
      '@config': '/config',
    },
  },
})
