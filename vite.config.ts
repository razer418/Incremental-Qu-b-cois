import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    // Three.js pèse environ 150 kB gzip, c'est attendu.
    chunkSizeWarningLimit: 700,
  },
});
