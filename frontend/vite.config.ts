import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		port: 5173
	},
	resolve: {
		alias: {
			'@shared': path.resolve(__dirname, '../shared')
		}
	},
	esbuild: {
		target: 'es2022'
	}
});