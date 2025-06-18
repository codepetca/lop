import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    name: 'shared',
    environment: 'node',
    include: ['**/*.{test,spec}.{js,ts}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['**/*.ts'],
      exclude: ['**/*.{test,spec}.ts', '**/*.d.ts']
    }
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '.')
    }
  }
})