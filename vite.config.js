import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: 'index.html'
    }
  },
  envPrefix: 'VITE_',
  server: {
    port: 5173,
    open: true
  }
});
