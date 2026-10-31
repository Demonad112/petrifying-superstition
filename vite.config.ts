import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  // No SPA fallback: missing files 404 like on Pages/itch instead of returning index.html.
  appType: 'mpa',
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
  build: { target: 'es2022', chunkSizeWarningLimit: 2000 },
});
