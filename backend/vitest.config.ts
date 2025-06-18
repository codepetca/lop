import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    name: 'backend',
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    setupFiles: ['../shared/test-setup/backend-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.{test,spec}.ts', 'src/**/*.d.ts']
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared')
    }
  }
})