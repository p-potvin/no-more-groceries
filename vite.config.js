import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],

  // Use relative paths so the built index.html works from Electron's file://
  base: './',

  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },

  build: {
    outDir:   'dist',
    emptyOutDir: true,
    // Increase warning threshold — Electron bundles don't need tiny chunks
    chunkSizeWarningLimit: 1000,
  },
}));

