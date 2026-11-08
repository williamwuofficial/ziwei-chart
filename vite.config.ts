import { defineConfig } from 'vite';

// Served from https://williamwuofficial.github.io/ziwei-chart/ — every asset URL must be relative.
export default defineConfig({
  base: '/ziwei-chart/',
  build: { target: 'es2022' },
});
