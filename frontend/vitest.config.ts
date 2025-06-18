import { defineConfig } from 'vitest/config'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import path from 'path'

export default defineConfig({
  plugins: [svelte({ hot: false })],
  test: {
    name: 'frontend',
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    setupFiles: ['../shared/test-setup/frontend-setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,svelte}'],
      exclude: ['src/**/*.{test,spec}.ts', 'src/**/*.d.ts', 'src/app.html']
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared')
    }
  }
})