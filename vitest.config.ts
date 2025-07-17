import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['tests/**/*.{test,spec}.{js,ts}'],
		environment: 'jsdom',
		setupFiles: ['tests/setup.ts'],
		globals: true,
		coverage: {
			include: ['src/**', 'party/**', 'shared/**'],
			exclude: ['**/*.d.ts', '**/*.test.ts', '**/*.spec.ts']
		}
	}
});