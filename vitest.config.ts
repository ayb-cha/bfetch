import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    alias: {
      '@/': './src/',
      '~/': './',
    },
  },
  test: {
    setupFiles: './test/vitest.setup.ts',
    environment: 'node',
    dir: './test',
    coverage: {
      include: ['src'],
    },
  },
})
