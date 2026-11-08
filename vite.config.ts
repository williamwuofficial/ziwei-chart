import { defineConfig } from 'vite';

// Served from https://williamwuofficial.github.io/ziwei-chart/ — every asset URL must be relative.
export default defineConfig({
  base: '/ziwei-chart/',
  // iztro ships every locale (~490 KB); trimming it is a Phase 4 task.
  build: { target: 'es2022', chunkSizeWarningLimit: 600 },
});
